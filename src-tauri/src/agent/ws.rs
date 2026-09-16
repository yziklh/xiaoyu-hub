use crate::agent::config::AgentConfig;
use crate::agent::idempotency::IdempotencyStore;
use crate::agent::logger;
use crate::agent::tts;
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tokio_tungstenite::{connect_async, tungstenite::Message};

const HEARTBEAT_INTERVAL_SECS: u64 = 30;
const MAX_RECONNECT_DELAY_SECS: u64 = 60;

type WsWriter = futures_util::stream::SplitSink<
    tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>,
    Message,
>;

fn emit_status(app: &AppHandle, status: &str) {
    let _ = app.emit("agent:connection_status", status);
}

fn build_ws_url(config: &AgentConfig) -> String {
    format!(
        "{}/ws/device?deviceToken={}",
        config.ws_base_url.trim_end_matches('/'),
        urlencoding::encode(&config.device_token)
    )
}

async fn send_ack(write: &Arc<Mutex<WsWriter>>, request_id: &str, status: &str, message: &str) {
    let payload = json!({
        "type": "COMMAND_ACK",
        "requestId": request_id,
        "data": {
            "status": status,
            "message": message,
            "executedAt": chrono::Utc::now().timestamp_millis()
        }
    });
    if let Ok(text) = serde_json::to_string(&payload) {
        let mut guard = write.lock().await;
        let _ = guard.send(Message::Text(text)).await;
    }
}

async fn handle_command(
    app: &AppHandle,
    config: &AgentConfig,
    envelope: Value,
    write: Arc<Mutex<WsWriter>>,
    idempotency: &IdempotencyStore,
) {
    let msg_type = envelope
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if msg_type == "HEARTBEAT_ACK" {
        return;
    }

    let request_id = envelope
        .get("requestId")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let data = envelope.get("data").cloned().unwrap_or(json!({}));

    // 同一 requestId 重复下发时直接回放 ACK，避免连续播报
    if !idempotency.try_claim(&request_id) {
        if let Some(record) = idempotency.get(&request_id) {
            logger::info(&format!("跳过重复指令 requestId={request_id}"));
            send_ack(&write, &request_id, &record.status, &record.message).await;
        }
        return;
    }

    let _ = app.emit("agent:command_received", &envelope);

    if msg_type == "TTS" {
        send_ack(&write, &request_id, "RECEIVED", "已接收").await;
        tts::stop_speak();
        let text = data
            .get("text")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let volume = data
            .get("volume")
            .and_then(|v| v.as_u64())
            .unwrap_or(config.default_volume as u64) as u32;
        let rate = data
            .get("rate")
            .and_then(|v| v.as_f64())
            .unwrap_or(config.default_rate as f64) as f32;

        // 后台线程播报，不阻塞 WebSocket 心跳
        let write_bg = write.clone();
        let request_id_bg = request_id.clone();
        let idempotency_bg = idempotency.clone();
        tokio::spawn(async move {
            let result = tokio::task::spawn_blocking(move || tts::speak(&text, volume, rate)).await;

            match result {
                Ok(Ok(_)) => {
                    idempotency_bg.remember(&request_id_bg, "SUCCESS", "播报完成");
                    send_ack(&write_bg, &request_id_bg, "SUCCESS", "播报完成").await;
                }
                Ok(Err(err)) => {
                    logger::error(&format!("TTS 执行失败: {err}"));
                    idempotency_bg.remember(&request_id_bg, "FAILED", &err);
                    send_ack(&write_bg, &request_id_bg, "FAILED", &err).await;
                }
                Err(err) => {
                    let msg = format!("TTS 任务异常: {err}");
                    logger::error(&msg);
                    idempotency_bg.remember(&request_id_bg, "FAILED", &msg);
                    send_ack(&write_bg, &request_id_bg, "FAILED", &msg).await;
                }
            }
        });
        return;
    }

    if msg_type == "SHOW_MESSAGE" {
        let _ = app.emit("agent:show_message", data);
        idempotency.remember(&request_id, "SUCCESS", "弹窗已展示");
        send_ack(&write, &request_id, "SUCCESS", "弹窗已展示").await;
        return;
    }

    logger::warn(&format!("未知指令类型: {msg_type}"));
    send_ack(&write, &request_id, "FAILED", &format!("未知指令: {msg_type}")).await;
}

async fn run_session(
    app: AppHandle,
    config: AgentConfig,
    stop: Arc<AtomicBool>,
    idempotency: IdempotencyStore,
) -> Result<(), String> {
    if config.device_token.is_empty() {
        return Err("设备未绑定，缺少 token".to_string());
    }

    let ws_url = build_ws_url(&config);
    logger::info(&format!("连接 WebSocket: {ws_url}"));
    emit_status(&app, "connecting");

    let (ws_stream, _) = connect_async(&ws_url)
        .await
        .map_err(|e| format!("WebSocket 连接失败: {e}"))?;
    let (write, mut read) = ws_stream.split();
    let write = Arc::new(Mutex::new(write));

    logger::info("WebSocket 已连接");
    emit_status(&app, "online");

    let mut heartbeat = tokio::time::interval(Duration::from_secs(HEARTBEAT_INTERVAL_SECS));
    heartbeat.tick().await;

    loop {
        if stop.load(Ordering::SeqCst) {
            let mut guard = write.lock().await;
            let _ = guard.close().await;
            emit_status(&app, "offline");
            return Ok(());
        }

        tokio::select! {
            _ = heartbeat.tick() => {
                let payload = json!({ "type": "HEARTBEAT", "timestamp": chrono::Utc::now().timestamp_millis() });
                if let Ok(text) = serde_json::to_string(&payload) {
                    let mut guard = write.lock().await;
                    if guard.send(Message::Text(text)).await.is_err() {
                        return Err("心跳发送失败".to_string());
                    }
                }
            }
            incoming = read.next() => {
                match incoming {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(envelope) = serde_json::from_str::<Value>(&text) {
                            let app = app.clone();
                            let config = config.clone();
                            let write = write.clone();
                            let idempotency = idempotency.clone();
                            tokio::spawn(async move {
                                handle_command(&app, &config, envelope, write, &idempotency).await;
                            });
                        }
                    }
                    Some(Ok(Message::Close(_))) | Some(Err(_)) | None => {
                        return Err("WebSocket 连接断开".to_string());
                    }
                    _ => {}
                }
            }
        }
    }
}

/// 后台 WebSocket 常驻循环（指数退避重连）
pub async fn run_agent_loop(
    app: AppHandle,
    config: AgentConfig,
    stop: Arc<AtomicBool>,
    idempotency: IdempotencyStore,
) {
    let mut attempt: u32 = 0;
    loop {
        if stop.load(Ordering::SeqCst) {
            emit_status(&app, "offline");
            break;
        }

        match run_session(app.clone(), config.clone(), stop.clone(), idempotency.clone()).await {
            Ok(_) => {
                if stop.load(Ordering::SeqCst) {
                    break;
                }
            }
            Err(err) => {
                logger::warn(&format!("WebSocket 会话结束: {err}"));
            }
        }

        if stop.load(Ordering::SeqCst) {
            emit_status(&app, "offline");
            break;
        }

        attempt = attempt.saturating_add(1);
        let delay = std::cmp::min(MAX_RECONNECT_DELAY_SECS, 1u64 << attempt.min(6));
        logger::info(&format!("{delay}s 后重连 WebSocket"));
        emit_status(&app, "reconnecting");

        let mut waited = 0u64;
        while waited < delay {
            if stop.load(Ordering::SeqCst) {
                emit_status(&app, "offline");
                return;
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
            waited += 1;
        }
    }
}
