use crate::db::Db;
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct InboxItem {
    pub id: String,
    pub content: String,
    pub source: String, // "text" | "voice"
    pub state: String,  // "unprocessed" | "processed" | "archived"
    pub created_at: String,
}

#[tauri::command]
pub async fn inbox_add(
    db: State<'_, Db>,
    content: String,
    source: String,
) -> Result<String, String> {
    let content = content.trim().to_string();
    if content.is_empty() {
        return Err("Content cannot be empty".into());
    }

    if source != "text" && source != "voice" {
        return Err("Invalid source (must be 'text' or 'voice')".into());
    }

    let id = format!("inbox_{}", uuid::Uuid::new_v4());

    let conn = db.0.lock().await;
    conn.execute(
        "INSERT INTO inbox_items (id, content, source, state)
         VALUES (?1, ?2, ?3, 'unprocessed')",
        params![id, content, source],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn inbox_list(
    db: State<'_, Db>,
    state: Option<String>,
) -> Result<Vec<InboxItem>, String> {
    let conn = db.0.lock().await;

    let mut items: Vec<InboxItem> = Vec::new();

    match state {
        Some(s) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, content, source, state, created_at
                     FROM inbox_items
                     WHERE state = ?1
                     ORDER BY created_at DESC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([s], |row| {
                    Ok(InboxItem {
                        id: row.get(0)?,
                        content: row.get(1)?,
                        source: row.get(2)?,
                        state: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            for r in rows {
                items.push(r.map_err(|e| e.to_string())?);
            }
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, content, source, state, created_at
                     FROM inbox_items
                     ORDER BY created_at DESC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(InboxItem {
                        id: row.get(0)?,
                        content: row.get(1)?,
                        source: row.get(2)?,
                        state: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            for r in rows {
                items.push(r.map_err(|e| e.to_string())?);
            }
        }
    }

    Ok(items)
}

#[tauri::command]
pub async fn inbox_set_state(
    db: State<'_, Db>,
    id: String,
    state: String, // "unprocessed" | "processed" | "archived"
) -> Result<(), String> {
    if state != "unprocessed" && state != "processed" && state != "archived" {
        return Err("Invalid state".into());
    }

    let conn = db.0.lock().await;

    let updated = conn
        .execute(
            "UPDATE inbox_items SET state = ?1 WHERE id = ?2",
            params![state, id],
        )
        .map_err(|e| e.to_string())?;

    if updated == 0 {
        return Err("Inbox item not found".into());
    }

    Ok(())
}