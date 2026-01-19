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
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::inbox::inbox_add,
            commands::inbox::inbox_list,
            commands::inbox::inbox_set_state,
            commands::tasks::task_add,
            commands::tasks::task_list,
            commands::tasks::task_set_status,
            commands::inbox::inbox_convert_to_task,
            commands::areas::area_add,
            commands::areas::area_list,
            commands::areas::area_set_active,
            commands::projects::project_add,
            commands::projects::project_list,
            commands::projects::project_set_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
