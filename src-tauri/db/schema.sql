-- Auralis V1 - SQLite Schema

PRAGMA foreign_keys = ON;

-- AREAS
CREATE TABLE IF NOT EXISTS areas (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    area_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    goal        TEXT,
    deadline_at TEXT,
    priority    TEXT CHECK (priority IN ('low', 'normal', 'high') OR priority IS NULL),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    completed_at TEXT,

    FOREIGN KEY (area_id) REFERENCES areas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proijects_area_name
    ON projects(area_id, name);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    area_id     TEXT NOT NULL,
    project_id  TEXT,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'deferred')),
    priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    due_at      TEXT,
    scheduled_at TEXT,
    estimate_minutes INTEGER CHECK (estimate_minutes >= 0 OR estimate_minutes IS NULL),
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    completed_at TEXT,

  FOREIGN KEY (area_id) REFERENCES areas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (project_id) REFERENCES projects(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);


