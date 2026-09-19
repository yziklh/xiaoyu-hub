use crate::agent::config::AgentConfig;
use serde_json::{json, Value};
use std::sync::OnceLock;
use std::time::Instant;

const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

static START_INSTANT: OnceLock<Instant> = OnceLock::new();

/// 记录进程启动时间，用于计算运行时长
pub fn init_start_time() {
    let _ = START_INSTANT.set(Instant::now());
}

fn uptime_sec() -> u64 {
    START_INSTANT
        .get()
        .map(|started| started.elapsed().as_secs())
        .unwrap_or(0)
}

fn platform_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

/// 构建心跳上报快照（版本、平台、连接状态等）
pub fn build_snapshot(config: &AgentConfig, connection_status: &str) -> Value {
    json!({
        "clientVersion": APP_VERSION,
        "platform": platform_name(),
        "osVersion": std::env::consts::OS,
        "connectionStatus": connection_status,
        "volume": config.default_volume,
        "rate": config.default_rate,
        "autoStart": config.auto_start,
        "deviceName": config.device_name,
        "uptimeSec": uptime_sec(),
    })
}
