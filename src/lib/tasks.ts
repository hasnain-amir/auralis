import { invoke } from "@tauri-apps/api/core";

export type TaskStatus = "todo" | "doing" | "done" | "deferred";

export type TaskItem = {
  id: string;
  area_id: string;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  priority: "low" | "normal" | "high";
  due_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  completed_at: string | null;
};

export function taskAdd(title: string, areaId?: string, projectId?: string) {
  return invoke<string>("task_add", {
    title,
    area_id: areaId ?? null,
    project_id: projectId ?? null,
  });
}

export function taskList(status?: TaskStatus) {
  return invoke<TaskItem[]>("task_list", { status: status ?? null });
}

export function taskSetStatus(id: string, status: TaskStatus) {
  return invoke<void>("task_set_status", { id, status });
}