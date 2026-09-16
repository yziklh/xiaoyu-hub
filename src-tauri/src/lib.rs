#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;
mod commands;
mod system;

use agent::paths;
use agent::AgentManager;
use agent::logger;
use system::SystemService;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, WindowEvent,
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_app_data_dir() -> String {
    paths::app_data_dir().to_string_lossy().to_string()
}

fn init_tray(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "tray_show", "打开", true, None::<&str>)?;
    let test_item = MenuItem::with_id(app, "tray_test_tts", "测试声音", true, None::<&str>)?;
    let about_item = MenuItem::with_id(app, "tray_about", "关于", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "tray_quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &test_item, &about_item, &quit_item])?;

    let icon = app
        .default_window_icon()
        .ok_or("缺少应用图标")?
        .clone();

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("教室小助手")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "tray_show" => show_main_window(app),
                "tray_test_tts" => {
                    if let Some(manager) = app.try_state::<AgentManager>() {
                        let _ = manager.test_tts("教室小助手语音测试");
                    }
                }
                "tray_about" => show_main_window(app),
                "tray_quit" => {
                    if let Some(manager) = app.try_state::<AgentManager>() {
                        manager.stop(app);
                    }
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// 唤起主窗口（macOS 需先激活应用，再 show + focus）
fn show_main_window(app: &tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let _ = app.set_activation_policy(ActivationPolicy::Regular);
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 单实例：重复打开时唤起已有窗口（需注册在其它 plugin 之前）
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let app_data_dir = paths::app_data_dir();
            let log_dir = app_data_dir.join("logs");
            logger::init(log_dir);
            logger::info("教室小助手启动");

            let agent_manager = AgentManager::new(app_data_dir);
            app.manage(agent_manager);

            let system_service = SystemService::new();
            app.manage(system_service);

            init_tray(app.handle())?;
            logger::info("系统托盘已初始化");

            // 关闭窗口时最小化到托盘，保持 Rust 常驻连接
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(win) = app_handle.get_webview_window("main") {
                            let _ = win.hide();
                        }
                    }
                });
            }

            // WebSocket 由前端 bootstrap 统一触发，避免与 Rust 重复连接
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_app_data_dir,
            agent::commands::agent_get_status,
            agent::commands::agent_get_config,
            agent::commands::agent_configure,
            agent::commands::agent_stop,
            agent::commands::agent_test_tts,
            agent::commands::agent_set_autostart,
            agent::commands::agent_is_autostart_enabled,
            agent::commands::updater_check,
            agent::commands::updater_download_install,
            commands::system_read_file,
            commands::system_write_file,
            commands::system_file_exists,
            commands::system_get_info,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            // macOS 点击 Dock 图标时唤起隐藏到后台的窗口
            #[cfg(target_os = "macos")]
            if let RunEvent::Reopen { .. } = event {
                show_main_window(app_handle);
            }
        });
}
