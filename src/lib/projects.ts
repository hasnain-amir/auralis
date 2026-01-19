import { invoke } from "@tauri-apps/api/core";

export type ProjectStatus = "paused" | "active" | "completed";

export type ProjectItem = {
    id: string;
    area_id: string;
    name: string;
    status: ProjectStatus;
    created_at: string;
};

export function projectAdd(name: string, areaId?: string) {
    return invoke<string>("project_add", {
        name,
        areaId: areaId ?? null,
    });
}

export function projectList(status?: ProjectStatus) {
    return invoke<ProjectItem[]>("project_list", { status: status ?? null });
}

export function projectSetStatus(id: string, status: ProjectStatus) {
    return invoke<void>("project_set_status", { id, status });
}