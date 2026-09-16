use chrono::Local;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

static LOG_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

/// 初始化文件日志目录
pub fn init(log_dir: PathBuf) {
    let _ = fs::create_dir_all(&log_dir);
    if let Ok(mut guard) = LOG_DIR.lock() {
        *guard = Some(log_dir.clone());
    }
    cleanup_old_logs(&log_dir, 7);
    info("文件日志已初始化");
}

fn log_file_path(log_dir: &Path) -> PathBuf {
    let date = Local::now().format("%Y-%m-%d").to_string();
    log_dir.join(format!("agent-{date}.log"))
}

fn write_line(level: &str, message: &str) {
    let line = format!("[{}] [{}] {}\n", Local::now().format("%Y-%m-%d %H:%M:%S"), level, message);
    println!("{line}");
    if let Ok(guard) = LOG_DIR.lock() {
        if let Some(dir) = guard.as_ref() {
            let path = log_file_path(dir);
            if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
                let _ = file.write_all(line.as_bytes());
            }
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
        let date_part = name.trim_start_matches("agent-").trim_end_matches(".log");
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_part, "%Y-%m-%d") {
            if date < threshold {
                let _ = fs::remove_file(entry.path());
            }
        }
    }
}
