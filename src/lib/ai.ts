import { invoke } from "@tauri-apps/api/core";

export function aiSummariseNote(noteId: string) {
  return invoke<string>("ai_summarise_note", { noteId });
}