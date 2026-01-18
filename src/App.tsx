import { useEffect, useState } from "react";
import {
  inboxAdd,
  inboxList,
  inboxSetState,
  type InboxItem,
  type InboxState,
} from "./lib/inbox";

type Filter = InboxState | "all";

export default function App() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("unprocessed");

  async function refresh(nextFilter: Filter = filter) {
    setErr(null);
    try {
      const res =
        nextFilter === "all"
          ? await inboxList()
          : await inboxList(nextFilter as InboxState);
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
    setErr(null);
    const content = text.trim();
    if (!content) return;

    setLoading(true);
    try {
      await inboxAdd(content, "text");
      setText("");
      // After adding, show unprocessed by default so you see it.
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

  return (
    <div style={{ padding: 16, maxWidth: 920 }}>
      <h1 style={{ margin: "0 0 12px" }}>Auralis</h1>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add to inbox…"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
          }}
        />
        <button
          onClick={onAdd}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          {loading ? "…" : "Add"}
        </button>
      </div>

      {err && <p style={{ marginTop: 10, color: "crimson" }}>{err}</p>}

      <div style={{ marginTop: 18 }}>
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
              value={filter}
              onChange={async (e) => {
                const v = e.target.value as Filter;
                setFilter(v);
                await refresh(v);
              }}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="unprocessed">Unprocessed</option>
              <option value="processed">Processed</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>

            <button
              onClick={() => refresh()}
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

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {items.length === 0 ? (
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
            items.map((it) => (
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
                      onClick={() => setState(it.id, "processed")}
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
                      onClick={() => setState(it.id, "archived")}
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
      </div>
    </div>
  );
}