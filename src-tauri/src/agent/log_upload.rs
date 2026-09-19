use crate::agent::config::AgentConfig;
use crate::agent::logger;
use chrono::Local;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use uuid::Uuid;

const UPLOAD_INTERVAL_SECS: u64 = 600;
const LOG_FILE_PREFIX: &str = "agent-";
const LOG_FILE_SUFFIX: &str = ".log";

/// 日志上传进度（按文件名记录已上传字节偏移）
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct UploadState {
    files: HashMap<String, u64>,
}

fn state_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("log_upload_state.json")
}

fn load_state(app_data_dir: &Path) -> UploadState {
    let path = state_path(app_data_dir);
    if !path.exists() {
        return UploadState::default();
    }
    fs::read_to_string(path)
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

fn save_state(app_data_dir: &Path, state: &UploadState) -> Result<(), String> {
    let path = state_path(app_data_dir);
    let json = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn list_log_files(log_dir: &Path) -> Vec<PathBuf> {
    let Ok(entries) = fs::read_dir(log_dir) else {
        return Vec::new();
    };
    let mut files = entries
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| {
            path.file_name()
                .and_then(|name| name.to_str())
                .map(|name| name.starts_with(LOG_FILE_PREFIX) && name.ends_with(LOG_FILE_SUFFIX))
                .unwrap_or(false)
        })
        .collect::<Vec<_>>();
    files.sort_by_key(|path| {
        fs::metadata(path)
            .and_then(|meta| meta.modified())
            .ok()
    });
    files
}

fn count_lines(content: &str) -> i32 {
    content.lines().filter(|line| !line.trim().is_empty()).count() as i32
}

fn infer_time_range(content: &str) -> (String, String) {
    let mut first = String::new();
    let mut last = String::new();
    for line in content.lines() {
        if line.len() >= 21 && line.starts_with('[') {
            let ts = line[1..20].to_string();
            if first.is_empty() {
                first = ts.clone();
            }
            last = ts;
        }
    }
    if first.is_empty() {
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        (now.clone(), now)
    } else {
        (first, last)
    }
}

async fn upload_batch(
    config: &AgentConfig,
    app_data_dir: &Path,
    file_name: &str,
    content: &str,
) -> Result<(), String> {
    if content.trim().is_empty() {
        return Ok(());
    }
    let (from_time, to_time) = infer_time_range(content);
    let payload = serde_json::json!({
        "deviceId": config.device_id,
        "deviceToken": config.device_token,
        "batchId": Uuid::new_v4().to_string(),
        "fileName": file_name,
        "fromTime": from_time,
        "toTime": to_time,
        "lineCount": count_lines(content),
        "content": content,
    });

    let url = format!(
        "{}/api/device/runtime-logs",
        config.api_base_url.trim_end_matches('/')
    );
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .post(url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("日志上传请求失败: {e}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("日志上传失败 HTTP {status}: {body}"));
    }
    let body = response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("日志上传响应解析失败: {e}"))?;
    let code = body.get("code").and_then(|v| v.as_i64()).unwrap_or(-1);
    if code != 200 && code != 0 {
        let msg = body
            .get("message")
            .or_else(|| body.get("msg"))
            .and_then(|v| v.as_str())
            .unwrap_or("未知错误");
        return Err(format!("日志上传被拒绝: {msg}"));
    }

    logger::info(&format!("日志批次已上传 file={file_name} lines={}", count_lines(content)));
    let _ = app_data_dir;
    Ok(())
}

/// 上传自上次偏移后的新增日志内容
pub async fn upload_pending_logs(config: &AgentConfig, app_data_dir: &Path) -> Result<(), String> {
    if config.device_id.is_empty() || config.device_token.is_empty() {
        return Ok(());
    }

    let log_dir = app_data_dir.join("logs");
    if !log_dir.exists() {
        return Ok(());
    }

    let mut state = load_state(app_data_dir);
    let files = list_log_files(&log_dir);
    for path in files {
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("")
            .to_string();
        if file_name.is_empty() {
            continue;
        }

        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let offset = state.files.get(&file_name).copied().unwrap_or(0) as usize;
        if offset >= content.len() {
            continue;
        }

        let chunk = &content[offset..];
        upload_batch(config, app_data_dir, &file_name, chunk).await?;
        state.files.insert(file_name, content.len() as u64);
    }

    save_state(app_data_dir, &state)
}

/// 后台定时上传日志（默认 10 分钟）
pub async fn run_upload_loop(
    config: AgentConfig,
    app_data_dir: PathBuf,
    stop: std::sync::Arc<std::sync::atomic::AtomicBool>,
) {
    // 启动后先尝试上传一次，避免首次等待完整周期
    if let Err(err) = upload_pending_logs(&config, &app_data_dir).await {
        logger::warn(&format!("启动后日志上传失败: {err}"));
    }

    let mut ticker = tokio::time::interval(Duration::from_secs(UPLOAD_INTERVAL_SECS));
    ticker.tick().await;
    loop {
        if stop.load(std::sync::atomic::Ordering::SeqCst) {
            break;
        }
        ticker.tick().await;
        if stop.load(std::sync::atomic::Ordering::SeqCst) {
            break;
        }
        if let Err(err) = upload_pending_logs(&config, &app_data_dir).await {
            logger::warn(&format!("日志上传失败: {err}"));
        }
    }
}
