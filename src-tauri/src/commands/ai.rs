use crate::ai::ollama;
use crate::db::Db;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub async fn ai_summarise_note(db: State<'_, Db>, note_id: String) -> Result<String, String> {
    // 1) Load note content
    let conn = db.0.lock().await;

    let (title, content): (String, String) = conn
        .query_row(
            "SELECT title, content FROM notes WHERE id = ?1",
            params![note_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    drop(conn); // release DB lock before network call

    // 2) Call Ollama
    let system = r#"You are Auralis, a personal command-center assistant.

        Your job is to transform raw notes into clear, non-redundant thinking.

        Rules:
        - Do NOT use meta language (e.g. "this note", "the author", "the writer").
        - Do NOT repeat points or restate the same idea in different words.
        - Group related ideas together.
        - Ignore filler, repetition, and emotional venting unless it affects decisions.
        - Prefer concrete details (deadlines, commitments, constraints).
        - Limit Possible actions to the most important 5.
        - If any actions are time-sensitive, prefix them with "[Soon]".

        Output format (strict):

        Summary:
        - 5–8 concise bullets grouped by theme.
        - Each bullet should represent a distinct idea.

        Possible actions:
        - Up to 5 clear, actionable next steps inferred from the note.
        - Actions should be phrased as commands (e.g. "Check…", "Decide…", "Prepare…").

        Do not add anything else."#;
    let user = format!(
        "Summarise this note.\n\nTitle: {}\n\nContent:\n{}",
        title, content
    );

    // Set your default model here
    let model = "llama3.1:8b";
    let summary = ollama::chat(model, system, &user).await?;

    Ok(summary)
}