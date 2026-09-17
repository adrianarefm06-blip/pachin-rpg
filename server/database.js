const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'game.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        
        db.serialize(() => {
            // Enable WAL mode for high performance and concurrency
            db.run(`PRAGMA journal_mode = WAL;`, (err) => {
                if (err) console.warn('Could not enable WAL mode:', err.message);
            });

            // Enable foreign key enforcement
            db.run(`PRAGMA foreign_keys = ON;`);

            // Synchronous NORMAL for optimal balance of speed and safety
            db.run(`PRAGMA synchronous = NORMAL;`);

            // 1. Users Table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                    password TEXT NOT NULL,
                    skin TEXT NOT NULL DEFAULT 'Pachin poderoso.png',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('Error creating users table:', err.message);
            });

            // Safe migrations for users
            db.run(`ALTER TABLE users ADD COLUMN skin TEXT NOT NULL DEFAULT 'Pachin poderoso.png'`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Migration error (users.skin):', err.message);
                }
            });
            db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME`, (err) => {
                if (!err) db.run(`UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`);
            });
            db.run(`ALTER TABLE users ADD COLUMN last_login DATETIME`, (err) => {
                if (!err) db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE last_login IS NULL`);
            });

            // 2. Leaderboard Table
            db.run(`
                CREATE TABLE IF NOT EXISTS leaderboard (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    best_time_ms INTEGER NOT NULL,
                    skin TEXT NOT NULL DEFAULT 'Pachin poderoso.png',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('Error creating leaderboard table:', err.message);
            });

            // Safe migrations for leaderboard
            db.run(`ALTER TABLE leaderboard ADD COLUMN skin TEXT NOT NULL DEFAULT 'Pachin poderoso.png'`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Migration error (leaderboard.skin):', err.message);
                }
            });
            db.run(`ALTER TABLE leaderboard ADD COLUMN created_at DATETIME`, (err) => {
                if (!err) db.run(`UPDATE leaderboard SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`);
            });

            // 3. High-Performance Indexes
            db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboard_time ON leaderboard(best_time_ms ASC);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE);`);
        });
    }
});

// Promisified helper methods for clean async/await
db.queryOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.queryAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

db.execute = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

module.exports = db;
