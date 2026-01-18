use crate::db::Db;
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct TaskItem {
    pub id: String,
    pub area_id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub status: String,   // todo | doing | done | deferred
    pub priority: String, // low | normal | high
    pub due_at: Option<String>,
    pub scheduled_at: Option<String>,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[tauri::command]
pub async fn task_add(
    db: State<'_, Db>,
    title: String,
    area_id: Option<String>,
    project_id: Option<String>,
) -> Result<String, String> {
    let title = title.trim().to_string();
    if title.is_empty() {
        return Err("Title cannot be empty".into());
    }

    // Default to your seeded fallback area
    let area_id = area_id.unwrap_or_else(|| "area_admin_life".to_string());

    let id = format!("task_{}", uuid::Uuid::new_v4());

    let conn = db.0.lock().await;
    conn.execute(
        "INSERT INTO tasks (id, area_id, project_id, title)
         VALUES (?1, ?2, ?3, ?4)",
        params![id, area_id, project_id, title],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn task_list(
    db: State<'_, Db>,
    status: Option<String>,
) -> Result<Vec<TaskItem>, String> {
    let conn = db.0.lock().await;

    let mut items: Vec<TaskItem> = Vec::new();

    match status {
        Some(s) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, area_id, project_id, title, status, priority,
                            due_at, scheduled_at, created_at, completed_at
                     FROM tasks
                     WHERE status = ?1
                     ORDER BY created_at DESC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([s], |row| {
                    Ok(TaskItem {
                        id: row.get(0)?,
                        area_id: row.get(1)?,
                        project_id: row.get(2)?,
                        title: row.get(3)?,
                        status: row.get(4)?,
                        priority: row.get(5)?,
                        due_at: row.get(6)?,
                        scheduled_at: row.get(7)?,
                        created_at: row.get(8)?,
                        completed_at: row.get(9)?,
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
                    "SELECT id, area_id, project_id, title, status, priority,
                            due_at, scheduled_at, created_at, completed_at
                     FROM tasks
                     ORDER BY created_at DESC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(TaskItem {
                        id: row.get(0)?,
                        area_id: row.get(1)?,
                        project_id: row.get(2)?,
                        title: row.get(3)?,
                        status: row.get(4)?,
                        priority: row.get(5)?,
                        due_at: row.get(6)?,
                        scheduled_at: row.get(7)?,
                        created_at: row.get(8)?,
                        completed_at: row.get(9)?,
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
pub async fn task_set_status(
    db: State<'_, Db>,
    id: String,
    status: String, // todo | doing | done | deferred
) -> Result<(), String> {
    if status != "todo" && status != "doing" && status != "done" && status != "deferred" {
        return Err("Invalid status".into());
    }

    let conn = db.0.lock().await;

    // When marking done, set completed_at; otherwise clear it.
    let updated = if status == "done" {
        conn.execute(
            "UPDATE tasks
             SET status = ?1,
                 completed_at = (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
             WHERE id = ?2",
            params![status, id],
        )
    } else {
        conn.execute(
            "UPDATE tasks
             SET status = ?1,
                 completed_at = NULL
             WHERE id = ?2",
            params![status, id],
        )
    }
    .map_err(|e| e.to_string())?;

    if updated == 0 {
        return Err("Task not found".into());
    }

    Ok(())
}