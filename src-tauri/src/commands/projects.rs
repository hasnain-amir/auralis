use crate::db::Db;
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct ProjectItem {
    pub id: String,
    pub area_id: String,
    pub name: String,
    pub status: String, // paused | active | completed
    pub created_at: String,
}

#[tauri::command]
pub async fn project_add(
    db: State<'_, Db>,
    name: String,
    area_id: Option<String>,
) -> Result<String, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Name cannot be empty".into());
    }

    let id = format!("project_{}", uuid::Uuid::new_v4());
    let area_id = area_id.unwrap_or_else(|| "area_admin_life".to_string());

    let conn = db.0.lock().await;
    conn.execute(
        "INSERT INTO projects (id, area_id, name, status)
         VALUES (?1, ?2, ?3, 'paused')",
        params![id, area_id, name],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn project_list(
    db: State<'_, Db>,
    status: Option<String>, // paused | active | completed
) -> Result<Vec<ProjectItem>, String> {
    let conn = db.0.lock().await;
    let mut items: Vec<ProjectItem> = Vec::new();

    match status {
        Some(s) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, area_id, name, status, created_at
                     FROM projects
                     WHERE status = ?1
                     ORDER BY created_at DESC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([s], |row| {
                    Ok(ProjectItem {
                        id: row.get(0)?,
                        area_id: row.get(1)?,
                        name: row.get(2)?,
                        status: row.get(3)?,
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
                    "SELECT id, area_id, name, status, created_at
                     FROM projects
                     ORDER BY created_at DESC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(ProjectItem {
                        id: row.get(0)?,
                        area_id: row.get(1)?,
                        name: row.get(2)?,
                        status: row.get(3)?,
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
pub async fn project_set_status(
    db: State<'_, Db>,
    id: String,
    status: String, // paused | active | completed
) -> Result<(), String> {
    if status != "paused" && status != "active" && status != "completed" {
        return Err("Invalid status".into());
    }

    let conn = db.0.lock().await;

    let updated = conn
        .execute(
            "UPDATE projects SET status = ?1 WHERE id = ?2",
            params![status, id],
        )
        .map_err(|e| e.to_string())?;

    if updated == 0 {
        return Err("Project not found".into());
    }

    Ok(())
}