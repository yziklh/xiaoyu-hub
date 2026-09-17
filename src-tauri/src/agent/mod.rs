pub mod attachment;
pub mod commands;
pub mod config;
pub mod idempotency;
pub mod logger;
pub mod paths;
pub mod tts;
pub mod updater;
pub mod ws;

use config::{load_config, save_config, AgentConfig};
use idempotency::IdempotencyStore;
use std::path::PathBuf;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use tauri::{AppHandle, Emitter};
use tauri_plugin_autostart::ManagerExt;

const MAX_PROCESSED_REQUESTS: usize = 500;

pub struct AgentManager {
    app_data_dir: PathBuf,
    stop_flag: Arc<AtomicBool>,
    runtime_handle: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
    connection_status: Mutex<String>,
    current_config: Mutex<AgentConfig>,
    /// 指令幂等存储
    idempotency: IdempotencyStore,
}

impl AgentManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let config = load_config(&app_data_dir);
        Self {
            app_data_dir,
            stop_flag: Arc::new(AtomicBool::new(false)),
            runtime_handle: Mutex::new(None),
            connection_status: Mutex::new("offline".to_string()),
            current_config: Mutex::new(config),
            idempotency: IdempotencyStore::new(MAX_PROCESSED_REQUESTS),
        }
    }

    pub fn app_data_dir(&self) -> &PathBuf {
        &self.app_data_dir
    }

    pub fn get_config(&self) -> AgentConfig {
        self.current_config.lock().unwrap().clone()
    }

    pub fn get_status(&self) -> String {
        self.connection_status.lock().unwrap().clone()
    }

    pub fn configure(&self, app: &AppHandle, config: AgentConfig) -> Result<(), String> {
        save_config(&self.app_data_dir, &config)?;
        {
            let mut current = self.current_config.lock().unwrap();
            *current = config.clone();
        }
        self.apply_autostart(app, config.auto_start)?;
        self.restart(app, config)
    }

    pub fn restart(&self, app: &AppHandle, config: AgentConfig) -> Result<(), String> {
        self.stop_internal();
        if config.device_token.is_empty() {
            *self.connection_status.lock().unwrap() = "offline".to_string();
            let _ = app.emit("agent:connection_status", "offline");
            return Ok(());
        }

        self.stop_flag.store(false, Ordering::SeqCst);
        let stop = self.stop_flag.clone();
        let app_handle = app.clone();
        let idempotency = self.idempotency.clone();
        let handle = tauri::async_runtime::spawn(async move {
            ws::run_agent_loop(app_handle, config, stop, idempotency).await;
        });
        *self.runtime_handle.lock().unwrap() = Some(handle);
        Ok(())
    }

    pub fn stop(&self, app: &AppHandle) {
        self.stop_internal();
        *self.connection_status.lock().unwrap() = "offline".to_string();
        let _ = app.emit("agent:connection_status", "offline");
    }

    fn stop_internal(&self) {
        self.stop_flag.store(true, Ordering::SeqCst);
        if let Some(handle) = self.runtime_handle.lock().unwrap().take() {
            handle.abort();
        }
    }

    pub fn apply_autostart(&self, app: &AppHandle, enabled: bool) -> Result<(), String> {
        let autostart = app.autolaunch();
        if enabled {
            autostart.enable().map_err(|e| e.to_string())?;
            logger::info("已启用开机自启");
        } else {
            autostart.disable().map_err(|e| e.to_string())?;
            logger::info("已关闭开机自启");
        }
        Ok(())
    }

    /// 设置开机自启并持久化到 config.json
    pub fn set_autostart(&self, app: &AppHandle, enabled: bool) -> Result<(), String> {
        self.apply_autostart(app, enabled)?;
        let mut config = self.get_config();
        config.auto_start = enabled;
        save_config(&self.app_data_dir, &config)?;
        {
            let mut current = self.current_config.lock().unwrap();
            *current = config;
        }
        Ok(())
    }

    pub fn is_autostart_enabled(&self, app: &AppHandle) -> Result<bool, String> {
        app.autolaunch().is_enabled().map_err(|e| e.to_string())
    }

    /// 异步测试播报，避免阻塞前端 UI 线程
    pub fn test_tts(&self, text: &str) -> Result<(), String> {
        let config = self.current_config.lock().unwrap().clone();
        let content = text.to_string();
        std::thread::spawn(move || {
            let _ = tts::speak(&content, config.default_volume, config.default_rate);
        });
        Ok(())
    }
}
