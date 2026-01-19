import { invoke } from "@tauri-apps/api/core";

export type AreaItem = {
  id: string;
  name: string;
  active: number; // 0/1
  created_at: string;
};

// Note: Tauri args often want camelCase. If you get an "invalid args" error,
// it will tell you the exact key it expects.
export function areaAdd(name: string) {
  return invoke<string>("area_add", { name });
}

export function areaList(onlyActive?: boolean) {
  return invoke<AreaItem[]>("area_list", { onlyActive: onlyActive ?? null });
}

export function areaSetActive(id: string, active: boolean) {
  return invoke<void>("area_set_active", { id, active });
}