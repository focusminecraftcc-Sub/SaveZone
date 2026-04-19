const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// On Vercel only /tmp is writable; locally use the db/ directory
const DB_PATH = process.env.VERCEL
  ? '/tmp/savezone.db'
  : path.join(__dirname, 'savezone.db');

let _db = null;

function getDb() {
  if (_db) return _db;
  throw new Error('Database not initialised — call initDb() first');
}

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing db file if it exists
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  // Create tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      search_query TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  persist();
  return _db;
}

// Save the DB to disk after every write
function persist() {
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.warn('DB persist warning:', e.message);
  }
}

// ─── Thin compatibility shim matching the better-sqlite3 API ─────────────────
// Routes use .prepare(sql).get/all/run — we replicate that interface here.

function prepare(sql) {
  return {
    get(...params) {
      const flat = params.flat();
      const stmt = _db.prepare(sql);
      stmt.bind(flat);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return row;
    },
    all(...params) {
      const flat = params.flat();
      const results = [];
      const stmt = _db.prepare(sql);
      stmt.bind(flat);
      while (stmt.step()) results.push(stmt.getAsObject());
      stmt.free();
      return results;
    },
    run(...params) {
      const flat = params.flat();
      _db.run(sql, flat);
      persist();
      // Return last insert rowid
      const info = _db.exec('SELECT last_insert_rowid() AS id');
      return { lastInsertRowid: info[0]?.values[0][0] ?? 0 };
    },
  };
}

module.exports = { initDb, getDb, prepare: (...args) => prepare(...args) };
