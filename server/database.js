const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'game.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    skin TEXT DEFAULT 'Pachin poderoso.png'
                )
            `, (err) => {
                if (err) console.error('Error creating users table:', err.message);
            });

            // Safe migration: add skin column to existing users if not present
            db.run(`ALTER TABLE users ADD COLUMN skin TEXT DEFAULT 'Pachin poderoso.png'`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Migration error:', err.message);
                } else if (!err) {
                    console.log('Migration: skin column added to users table.');
                }
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS leaderboard (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    best_time_ms INTEGER NOT NULL,
                    skin TEXT DEFAULT 'Pachin poderoso.png',
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) console.error('Error creating leaderboard table:', err.message);
            });

            // Clean existing leaderboards as requested by the user
            db.run(`DELETE FROM leaderboard`, (err) => {
                if (err) console.error('Error clearing leaderboard:', err.message);
                else console.log('Leaderboard cleared successfully.');
            });

            // Safe migration: add skin column to leaderboard if not present
            db.run(`ALTER TABLE leaderboard ADD COLUMN skin TEXT DEFAULT 'Pachin poderoso.png'`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Leaderboard migration error:', err.message);
                } else if (!err) {
                    console.log('Migration: skin column added to leaderboard table.');
                }
            });
        });
    }
});

module.exports = db;
