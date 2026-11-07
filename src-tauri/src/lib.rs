use serde::Serialize;

#[derive(Serialize)]
pub struct SystemDetails {
    os: &'static str,
    arch: &'static str,
    family: &'static str,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust on macOS!", name)
}

#[tauri::command]
fn get_system_info() -> SystemDetails {
    SystemDetails {
        os: std::env::consts::OS,
        arch: std::env::consts::ARCH,
        family: std::env::consts::FAMILY,
    }
}

#[tauri::command]
fn save_pdf_report(filename: String, pdf_bytes: Vec<u8>) -> Result<String, String> {
    use std::fs;
    use std::path::{Path, PathBuf};

    // Sanitize filename to prevent directory traversal attacks
    let clean_name = Path::new(&filename)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("TEF_Canada_Report.pdf");

    // Ensure the filename ends with .pdf
    let final_filename = if clean_name.to_lowercase().ends_with(".pdf") {
        clean_name.to_string()
    } else {
        format!("{}.pdf", clean_name)
    };

    // Resolve user home/downloads directory cross-platform
    let home_dir = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| format!("Could not resolve user home directory: {}", e))?;

    let mut path = PathBuf::from(home_dir);
    path.push("Downloads");
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("Could not create Downloads directory: {}", e))?;
    }
    path.push(final_filename);

    fs::write(&path, &pdf_bytes).map_err(|e| format!("Failed to write PDF file: {}", e))?;

    let path_str = path.to_string_lossy().to_string();

    // Automatically open the exported PDF in system viewer (macOS Preview / default PDF viewer)
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(&path_str).spawn();

    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd").args(["/c", "start", "", &path_str]).spawn();

    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(&path_str).spawn();

    Ok(path_str)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_system_info, save_pdf_report])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
