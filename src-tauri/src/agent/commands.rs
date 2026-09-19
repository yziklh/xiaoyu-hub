use crate::agent::attachment::{self, ReceivedFileMeta};
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
pub fn agent_get_settings(manager: State<'_, AgentManager>) -> crate::agent::config::AgentSettings {
    manager.get_settings()
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
        let platform = updater::current_platform();
        let (target, arch) = updater::current_updater_target();
        let endpoint = format!(
            "{}/api/device/update-manifest?version={}&platform={}&target={}&arch={}",
            config.api_base_url.trim_end_matches('/'),
            urlencoding::encode(APP_VERSION),
            urlencoding::encode(platform),
            urlencoding::encode(target),
            urlencoding::encode(arch)
        );
        if updater::check_with_plugin(&app, &endpoint).await? {
            return Ok(result);
        }
    }

    Ok(result)
}

/// 获取附件默认保存目录
#[tauri::command]
pub fn attachment_get_download_dir() -> String {
    attachment::get_download_dir().to_string_lossy().to_string()
}

/// 列出已接收附件
#[tauri::command]
pub fn attachment_list_files() -> Result<Vec<ReceivedFileMeta>, String> {
    attachment::list_received_files()
}

/// 打开本地文件
#[tauri::command]
pub fn attachment_open_file(path: String) -> Result<(), String> {
    attachment::open_file(&path)
}

/// 下载远程文件到本地目录
#[tauri::command]
pub async fn attachment_download_file(
    manager: State<'_, AgentManager>,
    url: String,
    file_name: String,
) -> Result<String, String> {
    let config = manager.get_config();
    let path = attachment::download_file(&config, &url, &file_name).await?;
    Ok(path.to_string_lossy().to_string())
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
