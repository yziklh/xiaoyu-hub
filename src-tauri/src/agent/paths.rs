use std::path::PathBuf;

/// 统一应用数据目录：Windows 为 %APPDATA%/classroom-agent/
pub fn app_data_dir() -> PathBuf {
    if cfg!(target_os = "windows") {
        if let Ok(appdata) = std::env::var("APPDATA") {
            return PathBuf::from(appdata).join("classroom-agent");
        }
    }

    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("classroom-agent")
}
