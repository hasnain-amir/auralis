use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ChatReq {
    model: String,
    messages: Vec<Message>,
    stream: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatResp {
    message: Option<Message>,
}

pub async fn chat(model: &str, system: &str, user: &str) -> Result<String, String> {
    let body = ChatReq {
        model: model.to_string(),
        messages: vec![
            Message {
                role: "system".into(),
                content: system.into(),
            },
            Message {
                role: "user".into(),
                content: user.into(),
            },
        ],
        stream: false,
    };

    let client = reqwest::Client::new();
    let res = client
        .post("http://127.0.0.1:11434/api/chat")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {e}"))?;

    // IMPORTANT: capture status BEFORE consuming response
    let status = res.status();

    if !status.is_success() {
        let txt = res.text().await.unwrap_or_default();
        return Err(format!("Ollama returned {}: {}", status, txt));
    }

    let parsed: ChatResp = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {e}"))?;

    let content = parsed
        .message
        .map(|m| m.content)
        .unwrap_or_default()
        .trim()
        .to_string();

    if content.is_empty() {
        return Err("Ollama returned empty response".into());
    }

    Ok(content)
}