use crate::db::Db;
use rusqlite::{params, OptionalExtension};
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

#[tauri::command]
pub async fn inbox_convert_to_task(
    db: State<'_, Db>,
    inbox_id: String,
) -> Result<String, String> {
    let conn = db.0.lock().await;

    // 1) Fetch inbox content (must exist + be unprocessed)
    let mut stmt = conn
        .prepare(
            "SELECT content, state
             FROM inbox_items
             WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let row: Option<(String, String)> = stmt
        .query_row(params![inbox_id], |r| Ok((r.get(0)?, r.get(1)?)))
        .optional()
        .map_err(|e| e.to_string())?;

    let (content, state) = match row {
        Some(v) => v,
        None => return Err("Inbox item not found".into()),
    };

    if state != "unprocessed" {
        return Err("Only unprocessed inbox items can be converted".into());
    }

    // 2) Derive a task title from first line
    let first_line = content.lines().next().unwrap_or("").trim();
    let mut title = if first_line.is_empty() {
        "Inbox item".to_string()
    } else {
        first_line.to_string()
    };

    // Optional: clamp length
    if title.len() > 120 {
        title.truncate(120);
    }

    // 3) Insert task (defaults area to Admin/Life)
    let task_id = format!("task_{}", uuid::Uuid::new_v4());
    let area_id = "area_admin_life".to_string();

    conn.execute(
        "INSERT INTO tasks (id, area_id, title) 
         VALUES (?1, ?2, ?3)",
        params![task_id, area_id, title],
    )
    .map_err(|e| e.to_string())?;

    // 4) Mark inbox as processed
    conn.execute(
        "UPDATE inbox_items SET state = 'processed' WHERE id = ?1",
        params![inbox_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(task_id)
}