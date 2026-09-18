use crate::agent::config::AgentConfig;
use crate::agent::logger;
use crate::agent::paths;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// 附件处理结果
#[derive(Debug, Clone, Serialize)]
pub struct AttachmentHandleResult {
    pub local_path: String,
    pub should_display: bool,
    pub saved: bool,
    pub message: String,
}

/// 已接收文件元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceivedFileMeta {
    pub file_name: String,
    pub local_path: String,
    pub file_url: String,
    pub mime_type: String,
    pub file_size: u64,
    pub sender_name: String,
    pub received_at: i64,
}

/// 默认保存目录：Documents/FishHub/Received
pub fn get_download_dir() -> PathBuf {
    if let Some(doc) = dirs::document_dir() {
        return doc.join("FishHub").join("Received");
    }
    paths::app_data_dir().join("Received")
}

fn metadata_path() -> PathBuf {
    paths::app_data_dir().join("received-files.json")
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if r#"\/:*?"<>|"#.contains(c) { '_' } else { c })
        .collect::<String>()
        .trim()
        .to_string()
}

fn unique_target_path(dir: &Path, file_name: &str) -> PathBuf {
    let safe = sanitize_filename(file_name);
    let base = if safe.is_empty() {
        "attachment".to_string()
    } else {
        safe
    };
    let mut target = dir.join(&base);
    if !target.exists() {
        return target;
    }
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    if let Some(ext_idx) = base.rfind('.') {
        let (stem, ext) = base.split_at(ext_idx);
        target = dir.join(format!("{stem}_{stamp}{ext}"));
    } else {
        target = dir.join(format!("{base}_{stamp}"));
    }
    target
}

fn resolve_file_url(config: &AgentConfig, url: &str) -> String {
    let trimmed = url.trim();
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return trimmed.to_string();
    }
    format!(
        "{}{}",
        config.api_base_url.trim_end_matches('/'),
        if trimmed.starts_with('/') {
            trimmed.to_string()
        } else {
            format!("/{trimmed}")
        }
    )
}

/// HTTP 下载文件到本地目录
pub async fn download_file(
    config: &AgentConfig,
    url: &str,
    file_name: &str,
) -> Result<PathBuf, String> {
    let dir = get_download_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建目录失败: {e}"))?;
    let target = unique_target_path(&dir, file_name);
    let full_url = resolve_file_url(config, url);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| format!("下载失败: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("下载失败，HTTP {}", resp.status()));
    }
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    std::fs::write(&target, &bytes).map_err(|e| format!("保存文件失败: {e}"))?;
    logger::info(&format!("附件已下载: {}", target.display()));
    Ok(target)
}

/// 使用系统默认程序打开文件
pub fn open_file(path: &str) -> Result<(), String> {
    let path_obj = Path::new(path);
    if !path_obj.exists() {
        return Err("文件不存在".to_string());
    }
    open::that(path_obj).map_err(|e| format!("打开文件失败: {e}"))
}

fn append_received_meta(meta: ReceivedFileMeta) -> Result<(), String> {
    let path = metadata_path();
    let mut list: Vec<ReceivedFileMeta> = if path.exists() {
        let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };
    list.insert(0, meta);
    if list.len() > 200 {
        list.truncate(200);
    }
    let json = serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_received_files() -> Result<Vec<ReceivedFileMeta>, String> {
    let path = metadata_path();
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(serde_json::from_str(&content).unwrap_or_default())
}

/// 处理 PUSH_ATTACHMENT 指令
pub async fn handle_push_attachment(
    config: &AgentConfig,
    data: &Value,
) -> Result<AttachmentHandleResult, String> {
    let action = data
        .get("action")
        .and_then(|v| v.as_str())
        .unwrap_or("BOTH")
        .to_uppercase();
    let url = data
        .get("fileUrl")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "缺少 fileUrl".to_string())?;
    let file_name = data
        .get("fileName")
        .and_then(|v| v.as_str())
        .unwrap_or("attachment");
    let mime_type = data.get("mimeType").and_then(|v| v.as_str()).unwrap_or("");
    let sender_name = data
        .get("senderName")
        .and_then(|v| v.as_str())
        .unwrap_or("系统");
    let file_size = data.get("fileSize").and_then(|v| v.as_u64()).unwrap_or(0);

    let need_save = action == "SAVE" || action == "BOTH";
    let need_display = action == "DISPLAY" || action == "BOTH";
    let is_image = mime_type.starts_with("image/");

    let mut local_path: Option<PathBuf> = None;

    if need_save || need_display {
        local_path = Some(download_file(config, url, file_name).await?);
    }

    let path = local_path
        .as_ref()
        .ok_or_else(|| "附件处理失败".to_string())?;
    let path_str = path.to_string_lossy().to_string();

    if need_save {
        let _ = append_received_meta(ReceivedFileMeta {
            file_name: file_name.to_string(),
            local_path: path_str.clone(),
            file_url: url.to_string(),
            mime_type: mime_type.to_string(),
            file_size,
            sender_name: sender_name.to_string(),
            received_at: chrono::Utc::now().timestamp_millis(),
        });
    }

    let mut should_display = false;
    let mut message = String::new();

    if need_display {
        if is_image {
            should_display = true;
            message = "图片已展示".to_string();
        } else {
            open_file(&path_str)?;
            message = format!("已打开 {file_name}");
        }
    }

    if need_save && message.is_empty() {
        message = format!("已保存 {file_name}");
    } else if need_save && should_display {
        message = format!("图片已展示并保存");
    }

    Ok(AttachmentHandleResult {
        local_path: path_str,
        should_display,
        saved: need_save,
        message,
    })
}
