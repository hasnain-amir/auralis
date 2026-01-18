import { invoke } from "@tauri-apps/api/core";

export type InboxSource = "text" | "voice";

export function inboxAdd(content: string, source: InboxSource = "text") {
  return invoke<string>("inbox_add", { content, source });
}