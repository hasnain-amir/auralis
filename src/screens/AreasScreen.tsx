import { useEffect, useState } from "react";
import { areaAdd, areaList, areaSetActive, type AreaItem } from "../lib/areas";

export default function AreasScreen() {
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [items, setItems] = useState<AreaItem[]>([]);
  const [onlyActive, setOnlyActive] = useState(false);
  const [loading, setLoading] = useState(false);

  async function refresh(nextOnlyActive: boolean = onlyActive) {
    setErr(null);
    try {
      const res = await areaList(nextOnlyActive ? true : undefined);
      setItems(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd() {
    const v = name.trim();
    if (!v) return;

    setLoading(true);
    setErr(null);
    try {
      await areaAdd(v);
      setName("");
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    setErr(null);
    try {
      await areaSetActive(id, active);
      await refresh();
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 12px" }}>Areas</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an area… (e.g. Uni, Freelance, Family)"
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
        <label style={{ fontSize: 12, color: "#666" }}>
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={async (e) => {
              const v = e.target.checked;
              setOnlyActive(v);
              await refresh(v);
            }}
            style={{ marginRight: 8 }}
          />
          Only active
        </label>

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
            No areas yet.
          </div>
        ) : (
          items.map((a) => (
            <div key={a.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "#777" }}>
                    {a.active ? "Active" : "Inactive"} • {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => toggle(a.id, a.active ? false : true)}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                >
                  {a.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}