use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let api_base = read_api_base_from_env_files();
    println!("cargo:rustc-env=DEFAULT_API_BASE={api_base}");
    println!("cargo:rerun-if-changed=../.env");
    println!("cargo:rerun-if-changed=../.env.local");
    println!("cargo:rerun-if-changed=../.env.development");
    println!("cargo:rerun-if-changed=../.env.production");
    tauri_build::build()
}

/// 与 Vite 一致：按 profile 读取 .env.*，Rust 默认值与前端共用同一套配置
fn read_api_base_from_env_files() -> String {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string());
    let root = Path::new(&manifest_dir).join("..");
    let profile = env::var("PROFILE").unwrap_or_default();
    let is_release = profile == "release";

    let candidates = if is_release {
        [".env.production", ".env.local", ".env"]
    } else {
        [".env.development", ".env.local", ".env"]
    };

    for name in candidates {
        let path = root.join(name);
        if let Some(value) = parse_env_value(&path, "VITE_API_BASE") {
            return value;
        }
    }

    "https://fishhub.cc".to_string()
}

fn parse_env_value(path: &Path, key: &str) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((name, value)) = line.split_once('=') else {
            continue;
        };
        if name.trim() != key {
            continue;
        }
        let value = value.trim().trim_matches('"').trim_matches('\'');
        if !value.is_empty() {
            return Some(value.to_string());
        }
    }
    None
}
