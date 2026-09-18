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

/** 前端可读的非敏感设置。 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentSettings {
    pub api_base_url: String,
    pub device_name: String,
    pub default_volume: u32,
    pub default_rate: f32,
    pub auto_start: bool,
}

impl From<&AgentConfig> for AgentSettings {
    fn from(config: &AgentConfig) -> Self {
        Self {
            api_base_url: config.api_base_url.clone(),
            device_name: config.device_name.clone(),
            default_volume: config.default_volume,
            default_rate: config.default_rate,
            auto_start: config.auto_start,
        }
    }
}

impl Default for AgentConfig {
    fn default() -> Self {
        // 默认地址由 build.rs 从 .env.development / .env.production 注入，与前端 VITE_API_BASE 一致
        let api_base_url = option_env!("DEFAULT_API_BASE")
            .unwrap_or("https://fishhub.cc")
            .to_string();
        let ws_base_url = to_ws_base(&api_base_url).unwrap_or_else(|_| {
            if api_base_url.starts_with("https://") {
                api_base_url.replacen("https://", "wss://", 1)
            } else if api_base_url.starts_with("http://") {
                api_base_url.replacen("http://", "ws://", 1)
            } else {
                format!("wss://{}", api_base_url.trim_start_matches('/'))
            }
        });
        Self {
            api_base_url,
            ws_base_url,
            device_id: String::new(),
            device_token: String::new(),
            device_name: "教室设备".to_string(),
            default_volume: 80,
            default_rate: 1.0,
            auto_start: true,
        }
    }
}

/// 规范化 API 根地址
pub fn normalize_api_base(raw: &str) -> Result<String, String> {
    let trimmed = raw.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return Err("后端地址不能为空".to_string());
    }
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        return Err("后端地址必须以 http:// 或 https:// 开头".to_string());
    }
    Ok(trimmed.to_string())
}

/// 根据 API 地址推导 WebSocket 地址
pub fn to_ws_base(api_base: &str) -> Result<String, String> {
    if api_base.starts_with("https://") {
        Ok(api_base.replacen("https://", "wss://", 1))
    } else if api_base.starts_with("http://") {
        Ok(api_base.replacen("http://", "ws://", 1))
    } else {
        Err("无法从后端地址推导 WebSocket 地址".to_string())
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
    let temp_path = app_data_dir.join("config.json.tmp");
    fs::write(&temp_path, json).map_err(|e| e.to_string())?;
    fs::rename(temp_path, path).map_err(|e| e.to_string())
}
