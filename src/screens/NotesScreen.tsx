import { useEffect, useMemo, useState } from "react";
import { noteAdd, noteDelete, noteList, noteUpdate, type NoteItem } from "../lib/notes";
import { projectList, type ProjectItem } from "../lib/projects";

export default function NotesScreen() {
  const [err, setErr] = useState<string | null>(null);

  const [items, setItems] = useState<NoteItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((n) => n.id === selectedId) ?? null,
    [items, selectedId]
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<ProjectItem[]>([]);

  async function refresh() {
  setErr(null);
  try {
    const res = await noteList();
    setItems(res);

    const ps = await projectList();
    setProjects(ps);

    if (selectedId && !res.some((n) => n.id === selectedId)) {
      setSelectedId(null);
    }
  } catch (e: any) {
    setErr(String(e));
  }
}

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) {
      setTitle("");
      setContent("");
      return;
    }
    setTitle(selected.title);
    setContent(selected.content);
  }, [selected]);

  async function createNew() {
    setErr(null);
    setSaving(true);
    try {
      const id = await noteAdd("New note", "Write something…");
      await refresh();
      setSelectedId(id);
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!selected) return;
    setErr(null);
    setSaving(true);
    try {
      await noteUpdate(selected.id, title, content, selected.area_id, selected.project_id);
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setErr(null);
    setSaving(true);
    try {
      await noteDelete(selected.id);
      setSelectedId(null);
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ margin: "0 0 12px" }}>Notes</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
        {/* Left: list */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", gap: 8 }}>
            <button
              onClick={createNew}
              disabled={saving}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
            >
              + New
            </button>
            <button
              onClick={refresh}
              style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
            >
              Refresh
            </button>
          </div>

          <div style={{ display: "grid" }}>
            {items.length === 0 ? (
              <div style={{ padding: 12, color: "#777" }}>No notes yet.</div>
            ) : (
              items.map((n) => {
                const active = n.id === selectedId;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedId(n.id)}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      border: "none",
                      borderBottom: "1px solid #f2f2f2",
                      background: active ? "#f5f5f5" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    {n.project_id && (
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                            Project: {projects.find((p) => p.id === n.project_id)?.name ?? "—"}
                        </div>
                    )}
                    <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                      Updated {new Date(n.updated_at).toLocaleString()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: editor */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          {!selected ? (
            <div style={{ color: "#777" }}>
              Select a note, or click <b>New</b>.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, color: "#666" }}>Project</label>
                    <select
                        value={selected.project_id ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSelectedId(selected.id);
                            noteUpdate(
                                selected.id,
                                title,
                                content,
                                selected.area_id,
                                 v === "" ? null : v
                            )
                                .then(refresh)
                                .catch((e) => setErr(String(e)));
                        }}
                        style={{
                        marginTop: 4,
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        width: "100%",
                        }}
                    >
                        <option value="">No project</option>
                        {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
            </select>
        </div>
                <div style={{ flex: 1 }}>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      fontWeight: 600,
                    }}
                  />
                  <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
                    Created {new Date(selected.created_at).toLocaleString()} • Updated{" "}
                    {new Date(selected.updated_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button
                    onClick={save}
                    disabled={saving}
                    style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
                  >
                    {saving ? "…" : "Save"}
                  </button>
                  <button
                    onClick={remove}
                    disabled={saving}
                    style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 420,
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}