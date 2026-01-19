use crate::db::Db;
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct NoteItem {
    pub id: String,
    pub title: String,
    pub content: String,
    pub area_id: Option<String>,
    pub project_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn note_add(
    db: State<'_, Db>,
    title: String,
    content: String,
    area_id: Option<String>,
    project_id: Option<String>,
) -> Result<String, String> {
    let title = title.trim().to_string();
    let content = content.trim().to_string();

    if title.is_empty() {
        return Err("Title cannot be empty".into());
    }
    if content.is_empty() {
        return Err("Content cannot be empty".into());
    }

    let id = format!("note_{}", uuid::Uuid::new_v4());

    let conn = db.0.lock().await;
    conn.execute(
        "INSERT INTO notes (id, title, content, area_id, project_id)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, title, content, area_id, project_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn note_list(
    db: State<'_, Db>,
    area_id: Option<String>,
    project_id: Option<String>,
) -> Result<Vec<NoteItem>, String> {
    let conn = db.0.lock().await;
    let mut items: Vec<NoteItem> = Vec::new();

    // priority: project filter > area filter > all
    if let Some(pid) = project_id {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, content, area_id, project_id, created_at, updated_at
                 FROM notes
                 WHERE project_id = ?1
                 ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([pid], |row| {
                Ok(NoteItem {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    area_id: row.get(3)?,
                    project_id: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for r in rows {
            items.push(r.map_err(|e| e.to_string())?);
        }

        return Ok(items);
    }

    if let Some(aid) = area_id {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, content, area_id, project_id, created_at, updated_at
                 FROM notes
                 WHERE area_id = ?1
                 ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([aid], |row| {
                Ok(NoteItem {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    area_id: row.get(3)?,
                    project_id: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for r in rows {
            items.push(r.map_err(|e| e.to_string())?);
        }

        return Ok(items);
    }

    // no filters -> all notes
    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, area_id, project_id, created_at, updated_at
             FROM notes
             ORDER BY updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(NoteItem {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                area_id: row.get(3)?,
                project_id: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    for r in rows {
        items.push(r.map_err(|e| e.to_string())?);
    }

    Ok(items)
}

#[tauri::command]
pub async fn note_update(
    db: State<'_, Db>,
    id: String,
    title: String,
    content: String,
    area_id: Option<String>,
    project_id: Option<String>,
) -> Result<(), String> {
    let title = title.trim().to_string();
    let content = content.trim().to_string();

    if title.is_empty() {
        return Err("Title cannot be empty".into());
    }
    if content.is_empty() {
        return Err("Content cannot be empty".into());
    }

    let conn = db.0.lock().await;

    let updated = conn
        .execute(
            "UPDATE notes
             SET title = ?1, content = ?2, area_id = ?3, project_id = ?4
             WHERE id = ?5",
            params![title, content, area_id, project_id, id],
        )
        .map_err(|e| e.to_string())?;

    if updated == 0 {
        return Err("Note not found".into());
    }

    Ok(())
}

#[tauri::command]
pub async fn note_delete(db: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = db.0.lock().await;

    let deleted = conn
        .execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    if deleted == 0 {
        return Err("Note not found".into());
    }

    Ok(())
}

// Optional helper if you want a single-note view later
#[tauri::command]
pub async fn note_get(db: State<'_, Db>, id: String) -> Result<NoteItem, String> {
    let conn = db.0.lock().await;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, area_id, project_id, created_at, updated_at
             FROM notes
             WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let note = stmt
        .query_row(params![id], |row| {
            Ok(NoteItem {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                area_id: row.get(3)?,
                project_id: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;

    note.ok_or_else(|| "Note not found".into())
}