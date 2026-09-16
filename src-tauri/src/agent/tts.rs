use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

static SPEAKING: Mutex<bool> = Mutex::new(false);

#[cfg(target_os = "macos")]
static SAY_CHILD: Mutex<Option<std::process::Child>> = Mutex::new(None);

/// 停止当前播报
pub fn stop_speak() {
    if let Ok(mut guard) = SPEAKING.lock() {
        *guard = false;
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(mut child_guard) = SAY_CHILD.lock() {
            if let Some(mut child) = child_guard.take() {
                let _ = child.kill();
            }
        }
        let _ = Command::new("killall").args(["-q", "say"]).status();
    }

    #[cfg(target_os = "windows")]
    {
        let _ = windows_sapi::stop();
    }
}

/// 文字转语音
pub fn speak(text: &str, volume: u32, rate: f32) -> Result<(), String> {
    let content = text.trim();
    if content.is_empty() {
        return Ok(());
    }

    if let Ok(mut guard) = SPEAKING.lock() {
        *guard = true;
    }

    let result = {
        #[cfg(target_os = "windows")]
        {
            windows_sapi::speak(content, volume, rate)
        }
        #[cfg(target_os = "macos")]
        {
            macos_say::speak(content, volume, rate)
        }
        #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
        {
            generic_tts::speak(content, volume, rate)
        }
    };

    if let Ok(mut guard) = SPEAKING.lock() {
        *guard = false;
    }
    result
}

/// 选择中文语音（Windows SAPI / 通用 tts）
#[cfg(any(target_os = "windows", not(target_os = "macos")))]
fn pick_chinese_voice(tts: &tts::Tts) -> Option<tts::Voice> {
    let voices = tts.voices().ok()?;

    // 优先 zh-CN 普通话
    for v in &voices {
        let lang = v.language().to_string().to_lowercase();
        if lang.starts_with("zh-cn") || lang.starts_with("zh-hans") {
            return Some(v.clone());
        }
    }
    // 其次任意中文
    for v in &voices {
        let lang = v.language().to_string().to_lowercase();
        if lang.starts_with("zh") {
            return Some(v.clone());
        }
    }
    // 按常见中文语音名称匹配
    for v in &voices {
        let name = v.name().to_lowercase();
        if name.contains("huihui")
            || name.contains("kangkang")
            || name.contains("yaoyao")
            || name.contains("tingting")
            || name.contains("chinese")
            || name.contains("中文")
        {
            return Some(v.clone());
        }
    }
    None
}

#[cfg(target_os = "windows")]
mod windows_sapi {
    use super::*;
    use tts::Tts;

    pub fn stop() -> Result<(), String> {
        Ok(())
    }

    pub fn speak(text: &str, volume: u32, rate: f32) -> Result<(), String> {
        let mut tts = Tts::default().map_err(|e| format!("初始化 TTS 失败: {e}"))?;

        if let Some(voice) = pick_chinese_voice(&tts) {
            tts.set_voice(&voice)
                .map_err(|e| format!("设置中文语音失败: {e}"))?;
        }

        tts.set_volume((volume.min(100)) as f32 / 100.0)
            .map_err(|e| format!("设置音量失败: {e}"))?;
        let _ = tts.set_rate(rate.clamp(0.5, 2.0));

        tts.speak(text, false)
            .map_err(|e| format!("播报失败: {e}"))?;

        loop {
            if let Ok(guard) = SPEAKING.lock() {
                if !*guard {
                    let _ = tts.stop();
                    return Ok(());
                }
            }
            match tts.is_speaking() {
                Ok(false) => break,
                Ok(true) => thread::sleep(Duration::from_millis(120)),
                Err(e) => return Err(format!("检测播报状态失败: {e}")),
            }
        }
        Ok(())
    }
}

#[cfg(target_os = "macos")]
mod macos_say {
    use super::*;

    /// 教室场景默认中文语音，按优先级尝试
    const CHINESE_VOICES: &[&str] = &["Tingting", "Meijia", "Sinji"];

    fn pick_voice() -> &'static str {
        // 教室喊话固定使用简体中文语音
        CHINESE_VOICES[0]
    }

    pub fn speak(text: &str, volume: u32, rate: f32) -> Result<(), String> {
        if let Ok(mut child_guard) = SAY_CHILD.lock() {
            if let Some(mut c) = child_guard.take() {
                let _ = c.kill();
            }
        }
        let _ = Command::new("killall").args(["-q", "say"]).status();

        let wpm = (175.0 * rate.clamp(0.5, 2.0)) as u32;
        let _ = (pick_voice(), volume);

        let mut last_err = String::new();
        for try_voice in CHINESE_VOICES {
            match spawn_say(try_voice, wpm, text) {
                Ok(()) => return Ok(()),
                Err(err) => last_err = err,
            }
        }
        Err(if last_err.is_empty() {
            "中文语音播报失败".to_string()
        } else {
            last_err
        })
    }

    fn spawn_say(voice: &str, wpm: u32, text: &str) -> Result<(), String> {
        let child = Command::new("say")
            .env("LANG", "zh_CN.UTF-8")
            .arg("-v")
            .arg(voice)
            .arg("-r")
            .arg(wpm.to_string())
            .arg(text)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("启动 say 失败({voice}): {e}"))?;

        if let Ok(mut guard) = SAY_CHILD.lock() {
            *guard = Some(child);
        }

        loop {
            if let Ok(guard) = SPEAKING.lock() {
                if !*guard {
                    if let Ok(mut child_guard) = SAY_CHILD.lock() {
                        if let Some(mut c) = child_guard.take() {
                            let _ = c.kill();
                        }
                    }
                    return Ok(());
                }
            }

            let finished = {
                let mut child_guard = SAY_CHILD.lock().map_err(|e| e.to_string())?;
                if let Some(child) = child_guard.as_mut() {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            *child_guard = None;
                            if status.success() {
                                None
                            } else {
                                Some(Err(format!("say({voice}) 退出异常: {status}")))
                            }
                        }
                        Ok(None) => Some(Ok(())),
                        Err(e) => Some(Err(format!("等待 say 失败: {e}"))),
                    }
                } else {
                    None
                }
            };

            match finished {
                None => return Ok(()),
                Some(Ok(())) => thread::sleep(Duration::from_millis(120)),
                Some(Err(err)) => return Err(err),
            }
        }
    }
}

#[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
mod generic_tts {
    use super::*;
    use tts::Tts;

    pub fn speak(text: &str, volume: u32, rate: f32) -> Result<(), String> {
        let mut tts = Tts::default().map_err(|e| format!("初始化 TTS 失败: {e}"))?;

        if let Some(voice) = pick_chinese_voice(&tts) {
            let _ = tts.set_voice(&voice);
        }

        tts.set_volume((volume.min(100)) as f32 / 100.0)
            .map_err(|e| format!("设置音量失败: {e}"))?;
        let _ = tts.set_rate(rate.clamp(0.5, 2.0));
        tts.speak(text, false)
            .map_err(|e| format!("播报失败: {e}"))?;

        loop {
            if let Ok(guard) = SPEAKING.lock() {
                if !*guard {
                    let _ = tts.stop();
                    return Ok(());
                }
            }
            match tts.is_speaking() {
                Ok(false) => break,
                Ok(true) => thread::sleep(Duration::from_millis(120)),
                Err(e) => return Err(format!("检测播报状态失败: {e}")),
            }
        }
        Ok(())
    }
}
