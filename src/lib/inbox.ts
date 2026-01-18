import { invoke } from "@tauri-apps/api/core";

export type InboxSource = "text" | "voice";
export type InboxState = "unprocessed" | "processed" | "archived";

export type InboxItem = {
  id: string;
  content: string;
  source: InboxSource;
  state: InboxState;
  created_at: string;
};

export function inboxAdd(content: string, source: InboxSource = "text") {
  return invoke<string>("inbox_add", { content, source });
}

export function inboxList(state?: InboxState) {
  return invoke<InboxItem[]>("inbox_list", { state: state ?? null });
}

export function inboxSetState(id: string, state: InboxState) {
  return invoke<void>("inbox_set_state", { id, state });
}

export function inboxConvertToTask(inboxId: string) {
  return invoke<string>("inbox_convert_to_task", { inboxId });
}