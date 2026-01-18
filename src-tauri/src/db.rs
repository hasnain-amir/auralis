use rusqlite::Connection;
use std::{fs, path::PathBuf};
use tauri::Manager;
use tokio::sync::Mutex;

pub struct Db(pub Mutex<Connection>);

fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;

    fs::create_dir_all(&app_data_dir).map_err(|e| format!("Failed to create app data dir: {e}"))?;

    Ok(app_data_dir.join("auralis.db"))
}

pub fn init_db(app: &tauri::AppHandle) -> Result<Db, String> {
    let path = db_path(app)?;

    let conn =
        Connection::open(&path).map_err(|e| format!("Failed to open DB at {:?}: {e}", path))?;

    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| format!("Failed to enable foreign_keys: {e}"))?;
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| format!("Failed to set journal_mode=WAL: {e}"))?;
    conn.pragma_update(None, "synchronous", "NORMAL")
        .map_err(|e| format!("Failed to set synchronous=NORMAL: {e}"))?;

    let schema_sql = include_str!("../db/schema.sql");

    conn.execute_batch(schema_sql)
        .map_err(|e| format!("Failed to execute schema.sql: {e}"))?;

    Ok(Db(Mutex::new(conn)))
}
