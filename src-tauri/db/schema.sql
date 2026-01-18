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

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_area_name
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

CREATE INDEX IF NOT EXISTS idx_tasks_area_status
  ON tasks(area_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_due_at
  ON tasks(due_at);

CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at
  ON tasks(scheduled_at);

-- INBOX
CREATE TABLE IF NOT EXISTS inbox_items (
    id          TEXT PRIMARY KEY,
    content     TEXT NOT NULL,
    source      TEXT NOT NULL CHECK (source IN ('text', 'voice')),
    state       TEXT NOT NULL DEFAULT 'unprocessed'
                           CHECK (state IN ('unprocessed', 'processed', 'archived')),
    audio_path  TEXT,
    transcript_confidence REAL
      CHECK ((transcript_confidence >= 0.0 AND transcript_confidence <= 1.0)
             OR transcript_confidence IS NULL),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_inbox_state_created
  ON inbox_items(state, created_at);

-- NOTES
CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    area_id    TEXT,
    project_id TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    FOREIGN KEY (area_id) REFERENCES areas(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_area ON notes(area_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);

CREATE TRIGGER IF NOT EXISTS trg_notes_touch_updated_at
AFTER UPDATE OF title, content, area_id, project_id ON notes
FOR EACH ROW
BEGIN
  UPDATE notes
    SET updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    WHERE id = NEW.id;
END;

-- CALENDAR
CREATE TABLE IF NOT EXISTS calendar_events (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    start_at    TEXT NOT NULL,
    end_at      TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'event' CHECK (type IN ('event', 'block')),
    task_id     TEXT,
    area_id     TEXT,
    location    TEXT,
    recurrence  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

    FOREIGN KEY (task_id) REFERENCES tasks(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    FOREIGN KEY (area_id) REFERENCES areas(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start
    ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task
    ON calendar_events(task_id);


-- RULE ENFORCEMENT TRIGGERS

CREATE TRIGGER IF NOT EXISTS trg_projects_prevent_active_without_next_action
BEFORE UPDATE OF status ON projects
FOR EACH ROW
WHEN NEW.status = 'active'
  AND (SELECT COUNT(1)
       FROM tasks
       WHERE project_id = NEW.id
         AND status IN ('todo', 'doing')) = 0
BEGIN
  SELECT RAISE(ABORT, 'Cannot activate project without an open task (next action required).');
END;

CREATE TRIGGER IF NOT EXISTS trg_projects_prevent_active_on_insert_without_next_action
BEFORE INSERT ON projects
FOR EACH ROW
WHEN NEW.status = 'active'
BEGIN
  SELECT RAISE(ABORT, 'Cannot create an active project without an open task. Create the project as paused, then add a task and activate.');
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_prevent_closing_last_open_task_in_active_project
BEFORE UPDATE OF status ON tasks
FOR EACH ROW
WHEN OLD.project_id IS NOT NULL
  AND OLD.status IN ('todo', 'doing')
  AND NEW.status IN ('done', 'deferred')
  AND (SELECT status FROM projects WHERE id = OLD.project_id) = 'active'
  AND (SELECT COUNT(1)
       FROM tasks
       WHERE project_id = OLD.project_id
         AND status IN ('todo', 'doing')
         AND id != OLD.id) = 0
BEGIN
  SELECT RAISE(ABORT, 'Active project must keep at least one open task. Add a next action or pause/complete the project first.');
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_prevent_deleting_last_open_task_in_active_project
BEFORE DELETE ON tasks
FOR EACH ROW
WHEN OLD.project_id IS NOT NULL
  AND OLD.status IN ('todo', 'doing')
  AND (SELECT status FROM projects WHERE id = OLD.project_id) = 'active'
  AND (SELECT COUNT(1)
       FROM tasks
       WHERE project_id = OLD.project_id
         AND status IN ('todo', 'doing')
         AND id != OLD.id) = 0
BEGIN
  SELECT RAISE(ABORT, 'Cannot delete last open task in an active project. Add a next action or pause/complete the project first.');
END;

-- SEED DEFAULTS
INSERT OR IGNORE INTO areas (id, name, active)
VALUES ('area_admin_life', 'Admin / Life', 1);