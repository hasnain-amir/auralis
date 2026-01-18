mod commands;
mod db;

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            // Initialise SQLite DB (creates auralis.db + runs schema.sql)
            let db = db::init_db(&handle)?;

            // Make DB available to all commands via app state
            app.manage(db);

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, commands::inbox::inbox_add])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
