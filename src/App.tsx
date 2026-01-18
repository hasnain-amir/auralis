import { useState } from "react";
import { inboxAdd } from "./lib/inbox";

export default function App() {
  const [text, setText] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onAdd() {
    setErr(null);
    try {
      const id = await inboxAdd(text, "text");
      setLastId(id);
      setText("");
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Auralis</h1>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add to inbox…"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={onAdd} style={{ padding: "8px 12px" }}>
          Add
        </button>
      </div>

      {lastId && <p>Inserted: {lastId}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}