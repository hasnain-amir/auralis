import { useEffect, useState } from "react";
import { taskAdd, taskList, taskSetStatus, type TaskItem, type TaskStatus } from "../lib/tasks";

type TaskFilter = TaskStatus | "all";

export default function TasksScreen() {
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [items, setItems] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("todo");
  const [loading, setLoading] = useState(false);

  async function refresh(nextFilter: TaskFilter = filter) {
    setErr(null);
    try {
      const res = nextFilter === "all" ? await taskList() : await taskList(nextFilter as TaskStatus);
      setItems(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh("todo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd() {
    const title = text.trim();
    if (!title) return;

    setLoading(true);
    setErr(null);
    try {
      await taskAdd(title);
      setText("");
      setFilter("todo");
      await refresh("todo");
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: TaskStatus) {
    setErr(null);
    try {
      await taskSetStatus(id, status);
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 12px" }}>Tasks</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add task…"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button onClick={onAdd} disabled={loading} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}>
          {loading ? "…" : "Add"}
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#666" }}>View</span>
        <select
          value={filter}
          onChange={async (e) => {
            const v = e.target.value as TaskFilter;
            setFilter(v);
            await refresh(v);
          }}
          style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd" }}
        >
          <option value="todo">Todo</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
          <option value="deferred">Deferred</option>
          <option value="all">All</option>
        </select>

        <button onClick={() => refresh()} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}>
          Refresh
        </button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, color: "#777" }}>
            No tasks here.
          </div>
        ) : (
          items.map((t) => (
            <div key={t.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#777" }}>
                {t.status} • {new Date(t.created_at).toLocaleString()}
              </div>
              <div style={{ marginTop: 6 }}>{t.title}</div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button onClick={() => setStatus(t.id, "todo")} disabled={t.status === "todo"} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd" }}>
                  Todo
                </button>
                <button onClick={() => setStatus(t.id, "doing")} disabled={t.status === "doing"} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd" }}>
                  Doing
                </button>
                <button onClick={() => setStatus(t.id, "done")} disabled={t.status === "done"} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd" }}>
                  Done
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}