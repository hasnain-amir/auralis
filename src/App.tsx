import { useEffect, useState } from "react";
import { inboxAdd, inboxList, inboxSetState, type InboxItem } from "./lib/inbox";

export default function App() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setErr(null);
    try {
      const res = await inboxList();
      setItems(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onAdd() {
    setErr(null);
    const content = text.trim();
    if (!content) return;

    setLoading(true);
    try {
      await inboxAdd(content, "text");
      setText("");
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h1 style={{ margin: "0 0 12px" }}>Auralis</h1>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add to inbox…"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
          }}
        />
        <button
          onClick={onAdd}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          {loading ? "…" : "Add"}
        </button>
      </div>

      {err && <p style={{ marginTop: 10, color: "crimson" }}>{err}</p>}

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Inbox</h2>
          <button
            onClick={refresh}
            style={{ border: "none", background: "transparent", textDecoration: "underline", cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {items.length === 0 ? (
            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 10, color: "#666" }}>
              Nothing in inbox.
            </div>
          ) : (
            items.map((it) => (
  <div key={it.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontSize: 12, color: "#777", display: "flex", gap: 10 }}>
        <span>{it.source}</span>
        <span>•</span>
        <span>{new Date(it.created_at).toLocaleString()}</span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={async () => {
            setErr(null);
            try {
              await inboxSetState(it.id, "archived");
              await refresh();
            } catch (e: any) {
              setErr(String(e));
            }
          }}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          Archive
        </button>
      </div>
    </div>

    <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{it.content}</div>
  </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}