import { useEffect, useState } from "react";
import {
  inboxAdd,
  inboxList,
  inboxSetState,
  inboxConvertToTask,
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
  const [err, setErr] = useState<string | null>(null);

  // ===================== INBOX =====================
  const [inboxText, setInboxText] = useState("");
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("unprocessed");
  const [inboxLoading, setInboxLoading] = useState(false);

  async function refreshInbox(filter: InboxFilter = inboxFilter) {
    setErr(null);
    try {
      const items =
        filter === "all"
          ? await inboxList()
          : await inboxList(filter as InboxState);
      setInboxItems(items);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function addInboxItem() {
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

  async function setInboxItem(id: string, state: InboxState) {
    setErr(null);
    try {
      await inboxSetState(id, state);
      await refreshInbox();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function convertInboxToTask(id: string) {
    setErr(null);
    try {
      await inboxConvertToTask(id);
      await refreshInbox();
      await refreshTasks();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  // ===================== TASKS =====================
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("todo");
  const [taskLoading, setTaskLoading] = useState(false);

  async function refreshTasks(filter: TaskFilter = taskFilter) {
    setErr(null);
    try {
      const items =
        filter === "all"
          ? await taskList()
          : await taskList(filter as TaskStatus);
      setTasks(items);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function addTask() {
    const title = taskText.trim();
    if (!title) return;

    setTaskLoading(true);
    try {
      await taskAdd(title);
      setTaskText("");
      setTaskFilter("todo");
      await refreshTasks("todo");
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setTaskLoading(false);
    }
  }

  async function setTask(id: string, status: TaskStatus) {
    setErr(null);
    try {
      await taskSetStatus(id, status);
      await refreshTasks();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  // ===================== INIT =====================
  useEffect(() => {
    refreshInbox("unprocessed");
    refreshTasks("todo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 12 }}>Auralis</h1>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* ===================== INBOX ===================== */}
      <section>
        <h2>Inbox</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={inboxText}
            onChange={(e) => setInboxText(e.target.value)}
            placeholder="Capture something…"
            style={{ flex: 1, padding: 8 }}
            onKeyDown={(e) => e.key === "Enter" && addInboxItem()}
          />
          <button onClick={addInboxItem} disabled={inboxLoading}>
            {inboxLoading ? "…" : "Add"}
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <select
            value={inboxFilter}
            onChange={async (e) => {
              const v = e.target.value as InboxFilter;
              setInboxFilter(v);
              await refreshInbox(v);
            }}
          >
            <option value="unprocessed">Unprocessed</option>
            <option value="processed">Processed</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {inboxItems.map((it) => (
            <div
              key={it.id}
              style={{ border: "1px solid #ddd", padding: 10 }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>
                {it.state} • {new Date(it.created_at).toLocaleString()}
              </div>

              <div style={{ marginTop: 6 }}>{it.content}</div>

              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button onClick={() => convertInboxToTask(it.id)}>→ Task</button>
                <button onClick={() => setInboxItem(it.id, "processed")}>
                  Process
                </button>
                <button onClick={() => setInboxItem(it.id, "archived")}>
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== TASKS ===================== */}
      <section style={{ marginTop: 32 }}>
        <h2>Tasks</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Add task…"
            style={{ flex: 1, padding: 8 }}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button onClick={addTask} disabled={taskLoading}>
            {taskLoading ? "…" : "Add"}
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <select
            value={taskFilter}
            onChange={async (e) => {
              const v = e.target.value as TaskFilter;
              setTaskFilter(v);
              await refreshTasks(v);
            }}
          >
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
            <option value="deferred">Deferred</option>
            <option value="all">All</option>
          </select>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {tasks.map((t) => (
            <div key={t.id} style={{ border: "1px solid #ddd", padding: 10 }}>
              <div style={{ fontSize: 12, color: "#666" }}>
                {t.status} • {new Date(t.created_at).toLocaleString()}
              </div>

              <div style={{ marginTop: 4 }}>{t.title}</div>

              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button onClick={() => setTask(t.id, "todo")}>Todo</button>
                <button onClick={() => setTask(t.id, "doing")}>Doing</button>
                <button onClick={() => setTask(t.id, "done")}>Done</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}