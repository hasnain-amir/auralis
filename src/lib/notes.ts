import { invoke } from "@tauri-apps/api/core";

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  area_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

export function noteAdd(
  title: string,
  content: string,
  areaId?: string | null,
  projectId?: string | null
) {
  // Keys in invoke: if you get an "invalid args" error,
  // change areaId->area_id / projectId->project_id based on the message.
  return invoke<string>("note_add", {
    title,
    content,
    areaId: areaId ?? null,
    projectId: projectId ?? null,
  });
}

export function noteList(areaId?: string | null, projectId?: string | null) {
  return invoke<NoteItem[]>("note_list", {
    areaId: areaId ?? null,
    projectId: projectId ?? null,
  });
}

export function noteUpdate(
  id: string,
  title: string,
  content: string,
  areaId?: string | null,
  projectId?: string | null
) {
  return invoke<void>("note_update", {
    id,
    title,
    content,
    areaId: areaId ?? null,
    projectId: projectId ?? null,
  });
}

export function noteDelete(id: string) {
  return invoke<void>("note_delete", { id });
}

export function noteGet(id: string) {
  return invoke<NoteItem>("note_get", { id });
}