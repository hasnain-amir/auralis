import { NavLink, Outlet } from "react-router-dom";

const linkStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: "inherit",
};

export default function AppShell() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "100vh" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Auralis</div>

        <nav style={{ display: "grid", gap: 6 }}>
          <NavLink
            to="/inbox"
            style={({ isActive }) => ({
              ...linkStyle,
              border: "1px solid #eee",
              background: isActive ? "#f5f5f5" : "transparent",
            })}
          >
            Inbox
          </NavLink>

          <NavLink
            to="/tasks"
            style={({ isActive }) => ({
              ...linkStyle,
              border: "1px solid #eee",
              background: isActive ? "#f5f5f5" : "transparent",
            })}
          >
            Tasks
          </NavLink>
          <NavLink
            to="/areas"
            style={({ isActive }) => ({
            ...linkStyle,
            border: "1px solid #eee",
            background: isActive ? "#f5f5f5" : "transparent",
            })}
          >
            Areas
          </NavLink>

          <NavLink
            to="/projects"
            style={({ isActive }) => ({
            ...linkStyle,
            border: "1px solid #eee",
            background: isActive ? "#f5f5f5" : "transparent",
            })}
          >
            Projects
          </NavLink>

          <NavLink
            to="/notes"
            style={({ isActive }) => ({
            ...linkStyle,
            border: "1px solid #eee",
            background: isActive ? "#f5f5f5" : "transparent",
            })}
          >
            Notes
          </NavLink>

          <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>Coming soon</div>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ ...linkStyle, border: "1px dashed #eee", color: "#999" }}>Projects</div>
            <div style={{ ...linkStyle, border: "1px dashed #eee", color: "#999" }}>Notes</div>
            <div style={{ ...linkStyle, border: "1px dashed #eee", color: "#999" }}>Calendar</div>
          </div>
        </nav>
      </aside>

      <main style={{ padding: 16, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}