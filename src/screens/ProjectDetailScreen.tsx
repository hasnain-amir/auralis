import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  projectGet,
  projectSetStatus,
  type ProjectItem,
  type ProjectStatus,
} from "../lib/projects";
import {
  taskAdd,
  taskSetStatus,
  taskListByProject,
  type TaskItem,
  type TaskStatus,
} from "../lib/tasks";
import { noteList, noteAdd, type NoteItem } from "../lib/notes";

export default function ProjectDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";

  const [err, setErr] = useState<string | null>(null);

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [taskText, setTaskText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");

  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!projectId) return;
    setErr(null);

    try {
      const p = await projectGet(projectId);
      setProject(p);

      const t = await taskListByProject(projectId);
      setTasks(t);

      // Notes filtered by project_id
      const ns = await noteList(null, projectId);
      setNotes(ns);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function addTaskToProject() {
    const title = taskText.trim();
    if (!title || !project) return;

    setLoading(true);
    setErr(null);
    try {
      // Create task linked to this project + inherits project area
      await taskAdd(title, project.area_id, project.id);
      setTaskText("");
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function setProjectStatus(status: ProjectStatus) {
    if (!project) return;

    setErr(null);
    try {
      await projectSetStatus(project.id, status);
      await refresh();
    } catch (e: any) {
      // DB trigger errors (e.g. activate without open task) show here
      setErr(String(e));
    }
  }

  async function setTask(id: string, status: TaskStatus) {
    setErr(null);
    try {
      await taskSetStatus(id, status);
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function addNoteToProject() {
    const t = noteTitle.trim();
    if (!t || !project) return;

    setLoading(true);
    setErr(null);
    try {
      // If your backend requires non-empty content, keep "…" as placeholder.
      await noteAdd(t, "…", null, project.id);
      setNoteTitle("");
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 12px" }}>Project</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!project ? (
        <div
          style={{
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 12,
            color: "#777",
          }}
        >
          Loading…
        </div>
      ) : (
        <>
          {/* Project header */}
          <div
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18 }}>{project.name}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}>
              {project.status} • Area: {project.area_id} •{" "}
              {new Date(project.created_at).toLocaleString()}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={() => setProjectStatus("paused")}
                disabled={project.status === "paused"}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                }}
              >
                Pause
              </button>
              <button
                onClick={() => setProjectStatus("active")}
                disabled={project.status === "active"}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                }}
              >
                Activate
              </button>
              <button
                onClick={() => setProjectStatus("completed")}
                disabled={project.status === "completed"}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                }}
              >
                Complete
              </button>

              <button
                onClick={refresh}
                style={{
                  marginLeft: "auto",
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tasks */}
          <h2 style={{ marginTop: 18, fontSize: 16 }}>Tasks</h2>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Add task to this project…"
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
              onKeyDown={(e) => e.key === "Enter" && addTaskToProject()}
            />
            <button
              onClick={addTaskToProject}
              disabled={loading}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
            >
              {loading ? "…" : "Add"}
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {tasks.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 12,
                  color: "#777",
                }}
              >
                No tasks for this project yet.
              </div>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#777" }}>
                    {t.status} • {new Date(t.created_at).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6 }}>{t.title}</div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setTask(t.id, "todo")}
                      disabled={t.status === "todo"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                      }}
                    >
                      Todo
                    </button>
                    <button
                      onClick={() => setTask(t.id, "doing")}
                      disabled={t.status === "doing"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                      }}
                    >
                      Doing
                    </button>
                    <button
                      onClick={() => setTask(t.id, "done")}
                      disabled={t.status === "done"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <h2 style={{ marginTop: 22, fontSize: 16 }}>Notes</h2>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="New note title…"
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
              onKeyDown={(e) => e.key === "Enter" && addNoteToProject()}
            />
            <button
              onClick={addNoteToProject}
              disabled={loading}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
              }}
            >
              {loading ? "…" : "Add"}
            </button>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {notes.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 12,
                  color: "#777",
                }}
              >
                No notes for this project yet.
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    Updated {new Date(n.updated_at).toLocaleString()}
                  </div>

                  {n.content && (
                    <div
                      style={{
                        marginTop: 8,
                        color: "#444",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {n.content.slice(0, 220)}
                      {n.content.length > 220 ? "…" : ""}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}