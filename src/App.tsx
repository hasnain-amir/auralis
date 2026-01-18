import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./app/AppShell";
import InboxScreen from "./screens/InboxScreen";
import TasksScreen from "./screens/TasksScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/tasks" element={<TasksScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}