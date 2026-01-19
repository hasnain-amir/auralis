import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./app/AppShell";
import InboxScreen from "./screens/InboxScreen";
import TasksScreen from "./screens/TasksScreen";
import AreasScreen from "./screens/AreasScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/tasks" element={<TasksScreen />} />
          <Route path="/areas" element={<AreasScreen />} />
          <Route path="/projects" element={<ProjectsScreen />} />
          <Route path="/projects/:id" element={<ProjectDetailScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}