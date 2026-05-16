const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db;

function getDb() {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "promptly.db");
  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

function seed() {
  const d = getDb();
  const count = d.prepare("SELECT COUNT(*) as n FROM prompts").get().n;
  if (count > 0) return;

  const insert = d.prepare(
    "INSERT INTO prompts (name, text, sort_order) VALUES (?, ?, ?)"
  );

  const seedData = d.transaction(() => {
    insert.run(
      "Plan",
      "Thoroughly review our plan to make sure it is 100% correct and there are no bugs or edge cases missed or security issues or inefficiencies or bad practices",
      0
    );
    insert.run(
      "Implement",
      "Could you thoroughly review our implementation to make sure it is 100% correct and there are no bugs or edge cases missed or security issues or inefficiencies or bad practices?",
      1
    );
    insert.run(
      "Test",
      "Could you double check to make sure the tests we added or updated are fully correct and comprehensive with no unnecessary tests",
      2
    );
    insert.run(
      "Stage",
      "I often work on multiple tasks in parallel on main.\n\nCheck the files touched by this task and determine whether any of them contain uncommitted changes unrelated to this task.\n\nIf no, stage only the files touched by this task.\nIf yes, do not stage anything.\n\nOutput:\n\nSafe to stage: yes / no\n\nTouched files:\n- ...\n\nBlocked files:\n- ...\n\nWhy:\n- ...",
      3
    );
  });

  seedData();
}

function getAllPrompts() {
  return getDb()
    .prepare("SELECT id, name, text FROM prompts ORDER BY sort_order")
    .all();
}

function searchPrompts(query) {
  const pattern = `%${query}%`;
  return getDb()
    .prepare(
      "SELECT id, name, text FROM prompts WHERE name LIKE ? OR text LIKE ? ORDER BY sort_order"
    )
    .all(pattern, pattern);
}

function createPrompt(name, text) {
  const d = getDb();
  const maxOrder = d
    .prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM prompts")
    .get().m;
  return d
    .prepare("INSERT INTO prompts (name, text, sort_order) VALUES (?, ?, ?)")
    .run(name, text, maxOrder + 1);
}

function updatePrompt(id, name, text) {
  return getDb()
    .prepare("UPDATE prompts SET name = ?, text = ? WHERE id = ?")
    .run(name, text, id);
}

function deletePrompt(id) {
  return getDb().prepare("DELETE FROM prompts WHERE id = ?").run(id);
}

function reorderPrompts(orderedIds) {
  const d = getDb();
  const update = d.prepare("UPDATE prompts SET sort_order = ? WHERE id = ?");
  d.transaction(() => {
    orderedIds.forEach((id, index) => update.run(index, id));
  })();
}

function getSetting(key) {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  getDb().prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

module.exports = { seed, getAllPrompts, searchPrompts, createPrompt, updatePrompt, deletePrompt, reorderPrompts, getSetting, setSetting };
