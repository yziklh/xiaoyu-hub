use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// 客户端本地配置（持久化到 app_data_dir/config.json）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    pub api_base_url: String,
    pub ws_base_url: String,
    pub device_id: String,
    pub device_token: String,
    pub device_name: String,
    pub default_volume: u32,
    pub default_rate: f32,
    pub auto_start: bool,
}

impl Default for AgentConfig {
    fn default() -> Self {
        // 默认地址需与 src/config/client.js 中的 BASE_URL 保持一致
        Self {
            api_base_url: "https://fishhub.cc".to_string(),
            ws_base_url: "wss://fishhub.cc".to_string(),
            device_id: String::new(),
            device_token: String::new(),
            device_name: "教室设备".to_string(),
            default_volume: 80,
            default_rate: 1.0,
            auto_start: true,
        }
    }
}

pub fn config_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("config.json")
}

pub fn load_config(app_data_dir: &PathBuf) -> AgentConfig {
    let path = config_path(app_data_dir);
    if !path.exists() {
        return AgentConfig::default();
    }
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => AgentConfig::default(),
    }
}

pub fn save_config(app_data_dir: &PathBuf, config: &AgentConfig) -> Result<(), String> {
    fs::create_dir_all(app_data_dir).map_err(|e| e.to_string())?;
    let path = config_path(app_data_dir);
    let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}
