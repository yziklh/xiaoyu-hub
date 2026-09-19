use crate::agent::config::AgentConfig;
use crate::agent::logger;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

/// 检查更新结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub has_update: bool,
    pub version: Option<String>,
    pub download_url: Option<String>,
    pub release_notes: Option<String>,
    pub force_update: bool,
    pub signature: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    code: i32,
    data: Option<T>,
    message: Option<String>,
    msg: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CheckUpdateData {
    has_update: Option<bool>,
    version: Option<String>,
    download_url: Option<String>,
    release_notes: Option<String>,
    force_update: Option<i32>,
    signature: Option<String>,
}

/// 当前运行平台（与管理端 client_version.platform 一致）
pub fn current_platform() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

/// Tauri Updater 清单参数
pub fn current_updater_target() -> (&'static str, &'static str) {
    if cfg!(target_os = "windows") {
        ("windows", "x86_64")
    } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            ("darwin", "aarch64")
        } else {
            ("darwin", "x86_64")
        }
    } else {
        ("linux", "x86_64")
    }
}

/// 调用管理端 check-update 接口
pub async fn check_update(
    config: &AgentConfig,
    current_version: &str,
) -> Result<UpdateCheckResult, String> {
    let platform = current_platform();
    let url = format!(
        "{}/api/device/check-update?version={}&platform={}",
        config.api_base_url.trim_end_matches('/'),
        urlencoding::encode(current_version),
        urlencoding::encode(platform)
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {e}"))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("检查更新请求失败: {e}"))?;

    let body: ApiResponse<CheckUpdateData> = resp
        .json()
        .await
        .map_err(|e| format!("解析更新响应失败: {e}"))?;

    if body.code != 200 && body.code != 0 {
        let msg = body
            .message
            .or(body.msg)
            .unwrap_or_else(|| "检查更新失败".to_string());
        return Err(msg);
    }

    let data = body.data.unwrap_or(CheckUpdateData {
        has_update: Some(false),
        version: None,
        download_url: None,
        release_notes: None,
        force_update: Some(0),
        signature: None,
    });

    Ok(UpdateCheckResult {
        has_update: data.has_update.unwrap_or(false),
        version: data.version,
        download_url: data.download_url,
        release_notes: data.release_notes,
        force_update: data.force_update.unwrap_or(0) == 1,
        signature: data.signature,
    })
}

/// 下载安装包并启动安装程序
pub async fn download_and_install(
    app: &AppHandle,
    download_url: &str,
    app_data_dir: &PathBuf,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {e}"))?;

    logger::info(&format!("开始下载更新包: {download_url}"));
    let _ = app.emit("updater:status", "downloading");

    let response = client
        .get(download_url)
        .send()
        .await
        .map_err(|e| format!("下载更新包失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("下载更新包失败: HTTP {}", response.status()));
    }

    let total = response.content_length().unwrap_or(0);
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取更新包失败: {e}"))?;
    let downloaded = bytes.len() as u64;

    let _ = app.emit(
        "updater:progress",
        serde_json::json!({
            "downloaded": downloaded,
            "total": total.max(downloaded)
        }),
    );

    std::fs::create_dir_all(app_data_dir).map_err(|e| e.to_string())?;
    let file_name = download_url
        .split('?')
        .next()
        .and_then(|u| u.rsplit('/').next())
        .filter(|n| !n.is_empty())
        .unwrap_or("classroom-agent-update.exe");
    let installer_path = app_data_dir.join("updates").join(file_name);
    if let Some(parent) = installer_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&installer_path, &bytes).map_err(|e| format!("保存更新包失败: {e}"))?;

    logger::info(&format!("更新包已保存: {}", installer_path.display()));
    let _ = app.emit("updater:status", "installing");

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new(&installer_path)
            .arg("/S")
            .spawn()
            .map_err(|e| format!("启动安装程序失败: {e}"))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("open")
            .arg(&installer_path)
            .spawn()
            .map_err(|e| format!("启动安装程序失败: {e}"))?;
    }

    let _ = app.emit("updater:status", "restarting");
    app.exit(0);
    Ok(())
}

/// 通过 tauri-plugin-updater 检查并安装（需管理端提供签名包）
pub async fn check_with_plugin(app: &AppHandle, endpoint: &str) -> Result<bool, String> {
    use tauri_plugin_updater::UpdaterExt;

    let endpoint_url = reqwest::Url::parse(endpoint).map_err(|e| format!("更新地址无效: {e}"))?;
    let update = app
        .updater_builder()
        .endpoints(vec![endpoint_url])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| format!("Updater 检查失败: {e}"))?;

    if let Some(update) = update {
        logger::info(&format!("发现 Updater 更新: {}", update.version));
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| format!("Updater 安装失败: {e}"))?;
        return Ok(true);
    }

    Ok(false)
}
