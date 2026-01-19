import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  projectAdd,
  projectList,
  projectSetStatus,
  type ProjectItem,
  type ProjectStatus,
} from "../lib/projects";

type Filter = ProjectStatus | "all";

export default function ProjectsScreen() {
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [filter, setFilter] = useState<Filter>("paused");
  const [loading, setLoading] = useState(false);

  async function refresh(next: Filter = filter) {
    setErr(null);
    try {
      const res =
        next === "all" ? await projectList() : await projectList(next);
      setItems(res);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh("paused");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAdd() {
    const v = name.trim();
    if (!v) return;

    setLoading(true);
    setErr(null);
    try {
      await projectAdd(v); // defaults to Admin/Life area
      setName("");
      setFilter("paused");
      await refresh("paused");
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: ProjectStatus) {
    setErr(null);
    try {
      await projectSetStatus(id, status);
      await refresh();
    } catch (e: any) {
      // DB trigger errors (e.g. activating without open task) land here
      setErr(String(e));
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ margin: "0 0 12px" }}>Projects</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* Add project */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a project…"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button
          onClick={onAdd}
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

      {/* Filter */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "#666" }}>View</span>
        <select
          value={filter}
          onChange={async (e) => {
            const v = e.target.value as Filter;
            setFilter(v);
            await refresh(v);
          }}
          style={{
            padding: 8,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        >
          <option value="paused">Paused</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>

        <button
          onClick={() => refresh()}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        >
          Refresh
        </button>
      </div>

      {/* List */}
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 12,
              color: "#777",
            }}
          >
            No projects here.
          </div>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    <Link
                      to={`/projects/${p.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {p.name}
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#777" }}>
                    {p.status} • {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setStatus(p.id, "paused")}
                    disabled={p.status === "paused"}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => setStatus(p.id, "active")}
                    disabled={p.status === "active"}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => setStatus(p.id, "completed")}
                    disabled={p.status === "completed"}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  >
                    Complete
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                Area: {p.area_id}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}