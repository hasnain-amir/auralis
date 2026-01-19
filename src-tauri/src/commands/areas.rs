use crate::db::Db;
use rusqlite::params;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct AreaItem {
    pub id: String,
    pub name: String,
    pub active: i64, // sqlite integer 0/1
    pub created_at: String,
}

#[tauri::command]
pub async fn area_add(db: State<'_, Db>, name: String) -> Result<String, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Name cannot be empty".into());
    }

    let id = format!("area_{}", uuid::Uuid::new_v4());

    let conn = db.0.lock().await;
    conn.execute(
        "INSERT INTO areas (id, name, active) VALUES (?1, ?2, 1)",
        params![id, name],
    )
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn area_list(db: State<'_, Db>, only_active: Option<bool>) -> Result<Vec<AreaItem>, String> {
    let conn = db.0.lock().await;

    let mut items: Vec<AreaItem> = Vec::new();

    match only_active {
        Some(true) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, name, active, created_at
                     FROM areas
                     WHERE active = 1
                     ORDER BY name ASC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(AreaItem {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        active: row.get(2)?,
                        created_at: row.get(3)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            for r in rows {
                items.push(r.map_err(|e| e.to_string())?);
            }
        }
        _ => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, name, active, created_at
                     FROM areas
                     ORDER BY name ASC",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], |row| {
                    Ok(AreaItem {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        active: row.get(2)?,
                        created_at: row.get(3)?,
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
pub async fn area_set_active(db: State<'_, Db>, id: String, active: bool) -> Result<(), String> {
    let conn = db.0.lock().await;

    let updated = conn
        .execute(
            "UPDATE areas SET active = ?1 WHERE id = ?2",
            params![if active { 1 } else { 0 }, id],
        )
        .map_err(|e| e.to_string())?;

    if updated == 0 {
        return Err("Area not found".into());
    }

    Ok(())
}