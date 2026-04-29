import type { DatabaseSync } from 'node:sqlite'

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL CHECK(role IN ('admin', 'graphiste', 'visiteur')),
      suspended   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      filename    TEXT    NOT NULL,
      filepath    TEXT    NOT NULL,
      filetype    TEXT    NOT NULL CHECK(filetype IN ('svg', 'png', 'ico', 'eps')),
      hash        TEXT    NOT NULL,
      version     INTEGER NOT NULL DEFAULT 1,
      status      TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted')),
      deleted_at  TEXT,
      author      TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS asset_metadata (
      asset_id    INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
      brand       TEXT    CHECK(brand IN ('CASANOOV', 'CAZEBOO', 'SICAAN')),
      description TEXT,
      color       TEXT,
      style       TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT    NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS asset_tags (
      asset_id  INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      tag_id    INTEGER NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
      PRIMARY KEY (asset_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS asset_versions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id       INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      filepath       TEXT    NOT NULL,
      hash           TEXT    NOT NULL,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_assets_status   ON assets(status);
    CREATE INDEX IF NOT EXISTS idx_assets_hash     ON assets(hash);
    CREATE INDEX IF NOT EXISTS idx_asset_tags_tag  ON asset_tags(tag_id);
  `)

  // Migrations progressives
  try { db.exec("ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0") } catch { /* déjà présente */ }
}
