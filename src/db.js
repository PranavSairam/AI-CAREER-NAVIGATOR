const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;

function getDb() {
  return db;
}

function initDatabase(dbPath) {
  db = new sqlite3.Database(dbPath, err => {
    if (err) {
      console.error('Database connection error:', err.message);
      process.exit(1);
    }
    console.log(`✅ Connected to SQLite: ${path.basename(dbPath)}`);
  });
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCb(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        email      TEXT    UNIQUE NOT NULL,
        password   TEXT    NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id          INTEGER UNIQUE NOT NULL,
        age              INTEGER,
        education        TEXT DEFAULT '',
        skills           TEXT DEFAULT '',
        interests        TEXT DEFAULT '',
        updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS career_recommendations (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id      INTEGER NOT NULL,
        career_title TEXT    NOT NULL,
        match_score  INTEGER DEFAULT 0,
        description  TEXT,
        learning_path TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS saved_careers (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id      INTEGER NOT NULL,
        career_title TEXT    NOT NULL,
        notes        TEXT    DEFAULT '',
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, career_title),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS learning_progress (
        user_id      INTEGER NOT NULL,
        career_title TEXT    NOT NULL,
        step_index   INTEGER NOT NULL,
        done         INTEGER NOT NULL DEFAULT 0,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, career_title, step_index),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS recommendation_feedback (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id            INTEGER NOT NULL,
        recommendation_id  INTEGER NOT NULL,
        rating             INTEGER,
        comment            TEXT,
        created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, recommendation_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recommendation_id) REFERENCES career_recommendations(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS user_goals (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id      INTEGER NOT NULL,
        title        TEXT NOT NULL,
        career_title TEXT,
        due_date     TEXT,
        completed    INTEGER NOT NULL DEFAULT 0,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL,
        action     TEXT    NOT NULL,
        meta       TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS recommendation_runs (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id              INTEGER NOT NULL,
        top_career           TEXT    NOT NULL,
        average_score        INTEGER NOT NULL,
        recommendation_count INTEGER NOT NULL DEFAULT 0,
        created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run(`CREATE INDEX IF NOT EXISTS idx_rec_user ON career_recommendations(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_goals_user ON user_goals(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rec_runs_user ON recommendation_runs(user_id)`);

      db.run('SELECT 1', err => {
        if (err) reject(err);
        else {
          console.log('✅ Database tables ready.');
          resolve();
        }
      });
    });
  });
}

async function logActivity(userId, action, meta = null) {
  try {
    await dbRun(
      'INSERT INTO activity_log (user_id, action, meta) VALUES (?, ?, ?)',
      [userId, action, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) {
    console.error('activity_log:', e.message);
  }
}

module.exports = {
  initDatabase,
  getDb,
  createTables,
  dbRun,
  dbGet,
  dbAll,
  logActivity
};
