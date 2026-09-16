use std::fs;
use std::path::Path;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub os_version: String,
}

pub struct SystemService;

impl SystemService {
    pub fn new() -> Self {
        SystemService
    }

    pub fn read_file(&self, path: &str) -> Result<String, String> {
        fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))
    }
    
    pub fn write_file(&self, path: &str, content: &str) -> Result<(), String> {
        fs::write(path, content)
            .map_err(|e| format!("Failed to write file: {}", e))
    }
    
    pub fn file_exists(&self, path: &str) -> bool {
        Path::new(path).exists()
    }

    pub fn get_system_info(&self) -> SystemInfo {
        SystemInfo {
            os: std::env::consts::OS.to_string(),
            arch: std::env::consts::ARCH.to_string(),
            os_version: Self::get_os_version(),
        }
    }

    fn get_os_version() -> String {
        #[cfg(target_os = "macos")]
        {
            if let Ok(output) = Command::new("sw_vers").arg("-productVersion").output() {
                return String::from_utf8_lossy(&output.stdout).trim().to_string();
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Ok(output) = Command::new("cmd").args(&["/C", "ver"]).output() {
                return String::from_utf8_lossy(&output.stdout).trim().to_string();
            }
        }

        #[cfg(target_os = "linux")]
        {
            if let Ok(content) = fs::read_to_string("/etc/os-release") {
                for line in content.lines() {
                    if line.starts_with("PRETTY_NAME=") {
                        return line.replace("PRETTY_NAME=", "").trim_matches('"').to_string();
                    }
                }
            }
        }

        "Unknown".to_string()
    }
}

