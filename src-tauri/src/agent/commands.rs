use crate::agent::config::AgentConfig;
use crate::agent::updater::{self, UpdateCheckResult};
use crate::agent::AgentManager;
use tauri::State;

const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

#[tauri::command]
pub fn agent_get_status(manager: State<'_, AgentManager>) -> String {
    manager.get_status()
}

#[tauri::command]
pub fn agent_get_config(manager: State<'_, AgentManager>) -> AgentConfig {
    manager.get_config()
}

#[tauri::command]
pub fn agent_configure(
    app: tauri::AppHandle,
    manager: State<'_, AgentManager>,
    config: AgentConfig,
) -> Result<(), String> {
    manager.configure(&app, config)
}

#[tauri::command]
pub fn agent_stop(app: tauri::AppHandle, manager: State<'_, AgentManager>) {
    manager.stop(&app);
}

#[tauri::command]
pub fn agent_test_tts(manager: State<'_, AgentManager>, text: String) -> Result<(), String> {
    manager.test_tts(&text)
}

#[tauri::command]
pub fn agent_set_autostart(
    app: tauri::AppHandle,
    manager: State<'_, AgentManager>,
    enabled: bool,
) -> Result<(), String> {
    manager.set_autostart(&app, enabled)
}

#[tauri::command]
pub fn agent_is_autostart_enabled(
    app: tauri::AppHandle,
    manager: State<'_, AgentManager>,
) -> Result<bool, String> {
    manager.is_autostart_enabled(&app)
}

/// 检查客户端更新（对接管理端 client_version）
#[tauri::command]
pub async fn updater_check(
    app: tauri::AppHandle,
    manager: State<'_, AgentManager>,
) -> Result<UpdateCheckResult, String> {
    let config = manager.get_config();
    let result = updater::check_update(&config, APP_VERSION).await?;

    // 管理端配置了签名包时，优先走 tauri-plugin-updater
    if result.has_update && result.signature.as_ref().is_some_and(|s| !s.is_empty()) {
        let endpoint = format!(
            "{}/api/device/update-manifest?version={}&platform=windows&target=windows&arch=x86_64",
            config.api_base_url.trim_end_matches('/'),
            urlencoding::encode(APP_VERSION)
        );
        if updater::check_with_plugin(&app, &endpoint).await? {
            return Ok(result);
        }
    }

    Ok(result)
}

/// 下载并安装更新包
#[tauri::command]
pub async fn updater_download_install(
    app: tauri::AppHandle,
    manager: State<'_, AgentManager>,
    download_url: String,
) -> Result<(), String> {
    updater::download_and_install(&app, &download_url, manager.app_data_dir()).await
}
