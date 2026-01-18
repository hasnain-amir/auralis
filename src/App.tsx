import { useEffect, useState } from "react";
import {
  inboxAdd,
  inboxList,
  inboxSetState,
  type InboxItem,
  type InboxState,
} from "./lib/inbox";
import {
  taskAdd,
  taskList,
  taskSetStatus,
  type TaskItem,
  type TaskStatus,
} from "./lib/tasks";

type InboxFilter = InboxState | "all";
type TaskFilter = TaskStatus | "all";

export default function App() {
  // ---------- Shared ----------
  const [err, setErr] = useState<string | null>(null);

  // ---------- Inbox ----------
  const [inboxText, setInboxText] = useState("");
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("unprocessed");

  async function refreshInbox(nextFilter: InboxFilter = inboxFilter) {
    setErr(null);
    try {
      const res =
        nextFilter === "all"
          ? await inboxList()
          : await inboxList(nextFilter as InboxState);
      setInboxItems(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function onInboxAdd() {
    setErr(null);
    const content = inboxText.trim();
    if (!content) return;

    setInboxLoading(true);
    try {
      await inboxAdd(content, "text");
      setInboxText("");
      setInboxFilter("unprocessed");
      await refreshInbox("unprocessed");
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setInboxLoading(false);
    }
  }

  async function inboxSet(id: string, state: InboxState) {
    setErr(null);
    try {
      await inboxSetState(id, state);
      await refreshInbox();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  // ---------- Tasks ----------
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("todo");

  async function refreshTasks(nextFilter: TaskFilter = taskFilter) {
    setErr(null);
    try {
      const res =
        nextFilter === "all"
          ? await taskList()
          : await taskList(nextFilter as TaskStatus);
      setTasks(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function onTaskAdd() {
    setErr(null);
    const title = taskText.trim();
    if (!title) return;

    setTaskLoading(true);
    try {
      await taskAdd(title); // defaults to Admin/Life area
      setTaskText("");
      setTaskFilter("todo");
      await refreshTasks("todo");
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setTaskLoading(false);
    }
  }

  async function setTaskStatus(id: string, status: TaskStatus) {
    setErr(null);
    try {
      await taskSetStatus(id, status);
      await refreshTasks();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  // ---------- Initial load ----------
  useEffect(() => {
    refreshInbox("unprocessed");
    refreshTasks("todo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 12px" }}>Auralis</h1>

      {err && <p style={{ marginTop: 10, color: "crimson" }}>{err}</p>}

      {/* ===================== INBOX ===================== */}
      <section style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>Inbox</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "#666" }}>View</label>
            <select
              value={inboxFilter}
              onChange={async (e) => {
                const v = e.target.value as InboxFilter;
                setInboxFilter(v);
                await refreshInbox(v);
              }}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="unprocessed">Unprocessed</option>
              <option value="processed">Processed</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>

            <button
              onClick={() => refreshInbox()}
              style={{
                border: "1px solid #ddd",
                background: "transparent",
                borderRadius: 8,
                padding: "8px 10px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={inboxText}
            onChange={(e) => setInboxText(e.target.value)}
            placeholder="Add to inbox…"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onInboxAdd();
            }}
          />
          <button
            onClick={onInboxAdd}
            disabled={inboxLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          >
            {inboxLoading ? "…" : "Add"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {inboxItems.length === 0 ? (
            <div
              style={{
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 10,
                color: "#666",
              }}
            >
              Nothing here.
            </div>
          ) : (
            inboxItems.map((it) => (
              <div
                key={it.id}
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "baseline",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#777",
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{it.state}</span>
                    <span>•</span>
                    <span>{it.source}</span>
                    <span>•</span>
                    <span>{new Date(it.created_at).toLocaleString()}</span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => inboxSet(it.id, "processed")}
                      disabled={it.state === "processed"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    >
                      Process
                    </button>
                    <button
                      onClick={() => inboxSet(it.id, "archived")}
                      disabled={it.state === "archived"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                  {it.content}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===================== TASKS ===================== */}
      <section style={{ marginTop: 26 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>Tasks</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "#666" }}>View</label>
            <select
              value={taskFilter}
              onChange={async (e) => {
                const v = e.target.value as TaskFilter;
                setTaskFilter(v);
                await refreshTasks(v);
              }}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="todo">Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
              <option value="deferred">Deferred</option>
              <option value="all">All</option>
            </select>

            <button
              onClick={() => refreshTasks()}
              style={{
                border: "1px solid #ddd",
                background: "transparent",
                borderRadius: 8,
                padding: "8px 10px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Add task…"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onTaskAdd();
            }}
          />
          <button
            onClick={onTaskAdd}
            disabled={taskLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          >
            {taskLoading ? "…" : "Add"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {tasks.length === 0 ? (
            <div
              style={{
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 10,
                color: "#666",
              }}
            >
              No tasks in this view.
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "baseline",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 12, color: "#777" }}>
                      {t.status} • {new Date(t.created_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 14 }}>{t.title}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setTaskStatus(t.id, "todo")}
                      disabled={t.status === "todo"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    >
                      Todo
                    </button>
                    <button
                      onClick={() => setTaskStatus(t.id, "doing")}
                      disabled={t.status === "doing"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    >
                      Doing
                    </button>
                    <button
                      onClick={() => setTaskStatus(t.id, "done")}
                      disabled={t.status === "done"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}