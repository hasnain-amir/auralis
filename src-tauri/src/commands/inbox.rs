use crate::db::Db;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub async fn inbox_add(
    db: State<'_, Db>,
    content: String,
    source: String, // "text" | "voice"
) -> Result<String, String> {
    let content = content.trim().to_string();
    if content.is_empty() {
        return Err("Content cannot be empty".into());
    }
    if source != "text" && source != "voice" {
        return Err("Invalid source (must be 'text' or 'voice')".into());
    }

    let id = format!("inbox_{}", uuid::Uuid::new_v4());

    // Lock DB connection and insert
    let conn = db.0.lock().await;
    conn.execute(
        "INSERT INTO inbox_items (id, content, source, state) VALUES (?1, ?2, ?3, 'unprocessed')",
        params![id, content, source],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}
