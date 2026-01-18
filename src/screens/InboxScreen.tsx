import { useEffect, useState } from "react";
import {
  inboxAdd,
  inboxList,
  inboxSetState,
  inboxConvertToTask,
  type InboxItem,
  type InboxState,
} from "../lib/inbox";
import { taskList, type TaskItem } from "../lib/tasks"; // only used to refresh tasks count if you want later

type InboxFilter = InboxState | "all";

export default function InboxScreen() {
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [filter, setFilter] = useState<InboxFilter>("unprocessed");
  const [loading, setLoading] = useState(false);

  async function refresh(nextFilter: InboxFilter = filter) {
    setErr(null);
    try {
      const res =
        nextFilter === "all" ? await inboxList() : await inboxList(nextFilter as InboxState);
      setItems(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh("unprocessed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd() {
    const content = text.trim();
    if (!content) return;

    setLoading(true);
    setErr(null);
    try {
      await inboxAdd(content, "text");
      setText("");
      setFilter("unprocessed");
      await refresh("unprocessed");
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function setState(id: string, state: InboxState) {
    setErr(null);
    try {
      await inboxSetState(id, state);
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  async function convertToTask(id: string) {
    setErr(null);
    try {
      await inboxConvertToTask(id);
      await refresh();
      // optional: could refresh tasks screen via shared state later
      await taskList("todo").catch(() => {});
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 12px" }}>Inbox</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture something…"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button
          onClick={onAdd}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          {loading ? "…" : "Add"}
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#666" }}>View</span>
        <select
          value={filter}
          onChange={async (e) => {
            const v = e.target.value as InboxFilter;
            setFilter(v);
            await refresh(v);
          }}
          style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd" }}
        >
          <option value="unprocessed">Unprocessed</option>
          <option value="processed">Processed</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>

        <button
          onClick={() => refresh()}
          style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, color: "#777" }}>
            Nothing here.
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "#777", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span>{it.state}</span>
                <span>•</span>
                <span>{it.source}</span>
                <span>•</span>
                <span>{new Date(it.created_at).toLocaleString()}</span>
              </div>

              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{it.content}</div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button onClick={() => convertToTask(it.id)} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd" }}>
                  → Task
                </button>
                <button
                  onClick={() => setState(it.id, "processed")}
                  disabled={it.state === "processed"}
                  style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                >
                  Process
                </button>
                <button
                  onClick={() => setState(it.id, "archived")}
                  disabled={it.state === "archived"}
                  style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                >
                  Archive
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}