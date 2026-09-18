use chrono::Local;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

static LOG_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);
const MAX_LOG_FILE_BYTES: u64 = 5 * 1024 * 1024;
const MAX_LOG_TOTAL_BYTES: u64 = 30 * 1024 * 1024;

/// 初始化文件日志目录
pub fn init(log_dir: PathBuf) {
    let _ = fs::create_dir_all(&log_dir);
    if let Ok(mut guard) = LOG_DIR.lock() {
        *guard = Some(log_dir.clone());
    }
    cleanup_old_logs(&log_dir, 7);
    trim_log_size(&log_dir);
    info("文件日志已初始化");
}

fn log_file_path(log_dir: &Path) -> PathBuf {
    let date = Local::now().format("%Y-%m-%d").to_string();
    log_dir.join(format!("agent-{date}.log"))
}

fn write_line(level: &str, message: &str) {
    let safe_message = redact(message);
    let line = format!(
        "[{}] [{}] {}\n",
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        level,
        safe_message
    );
    println!("{line}");
    if let Ok(guard) = LOG_DIR.lock() {
        if let Some(dir) = guard.as_ref() {
            let path = log_file_path(dir);
            rotate_if_oversized(&path, line.len() as u64);
            if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
                let _ = file.write_all(line.as_bytes());
            }
            trim_log_size(dir);
        }
    }
}

pub fn info(message: &str) {
    write_line("INFO", message);
}

pub fn warn(message: &str) {
    write_line("WARN", message);
}

pub fn error(message: &str) {
    write_line("ERROR", message);
}

pub fn redact(value: &str) -> String {
    let mut result = value.to_string();
    for marker in [
        "deviceToken=",
        "Authorization: Bearer ",
        "aesKey=",
    ] {
        if let Some(start) = result.find(marker) {
            let value_start = start + marker.len();
            let end = result[value_start..]
                .find(|item: char| item.is_whitespace() || item == '&' || item == '"')
                .map(|offset| value_start + offset)
                .unwrap_or(result.len());
            result.replace_range(value_start..end, "[REDACTED]");
        }
    }
    result
}

/// 清理超过保留天数的日志文件
fn cleanup_old_logs(log_dir: &Path, keep_days: i64) {
    let Ok(entries) = fs::read_dir(log_dir) else {
        return;
    };
    let threshold = Local::now().date_naive() - chrono::Duration::days(keep_days);
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with("agent-") || !name.ends_with(".log") {
            continue;
        }
        let date_part = name
            .strip_prefix("agent-")
            .and_then(|value| value.get(..10))
            .unwrap_or("");
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_part, "%Y-%m-%d") {
            if date < threshold {
                let _ = fs::remove_file(entry.path());
            }
        }
    }
}

fn rotate_if_oversized(path: &Path, incoming_bytes: u64) {
    let Ok(metadata) = fs::metadata(path) else {
        return;
    };
    if metadata.len().saturating_add(incoming_bytes) <= MAX_LOG_FILE_BYTES {
        return;
    }
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("agent");
    let rotated = path.with_file_name(format!("{}-{}.log", stem, Local::now().format("%H%M%S")));
    let _ = fs::rename(path, rotated);
}

fn trim_log_size(log_dir: &Path) {
    let Ok(entries) = fs::read_dir(log_dir) else {
        return;
    };
    let mut files = entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            let name = path.file_name()?.to_str()?.to_string();
            if !name.starts_with("agent-") || !name.ends_with(".log") {
                return None;
            }
            let metadata = entry.metadata().ok()?;
            Some((path, metadata.len(), metadata.modified().ok()))
        })
        .collect::<Vec<_>>();
    let mut total = files.iter().map(|(_, size, _)| *size).sum::<u64>();
    if total <= MAX_LOG_TOTAL_BYTES {
        return;
    }
    files.sort_by_key(|(_, _, modified)| *modified);
    for (path, size, _) in files {
        if total <= MAX_LOG_TOTAL_BYTES {
            break;
        }
        if fs::remove_file(path).is_ok() {
            total = total.saturating_sub(size);
        }
    }
}
