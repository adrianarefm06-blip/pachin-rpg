const db = require('./database');

const DbService = {
    /**
     * Finds a user by their username (case-insensitive)
     */
    async getUserByUsername(username) {
        return await db.queryOne(
            'SELECT id, username, password, skin, created_at, last_login FROM users WHERE username = ? COLLATE NOCASE',
            [username]
        );
    },

    /**
     * Finds a user by ID
     */
    async getUserById(userId) {
        return await db.queryOne(
            'SELECT id, username, skin, created_at, last_login FROM users WHERE id = ?',
            [userId]
        );
    },

    /**
     * Creates a new user record
     */
    async createUser(username, hashedPassword, skin = 'Pachin poderoso.png') {
        const result = await db.execute(
            'INSERT INTO users (username, password, skin, created_at, last_login) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [username, hashedPassword, skin]
        );
        return { userId: result.lastID, username, skin };
    },

    /**
     * Updates the last login timestamp for a user
     */
    async updateUserLogin(userId) {
        return await db.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
    },

    /**
     * Updates the selected skin for a user
     */
    async updateUserSkin(userId, skin) {
        return await db.execute(
            'UPDATE users SET skin = ? WHERE id = ?',
            [skin, userId]
        );
    },

    /**
     * Saves a completed game run score
     */
    async saveScore(userId, bestTimeMs, skin = 'Pachin poderoso.png') {
        const result = await db.execute(
            'INSERT INTO leaderboard (user_id, best_time_ms, skin, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [userId, bestTimeMs, skin]
        );
        return { scoreId: result.lastID };
    },

    /**
     * Retrieves the top leaderboard (fast indexed query)
     */
    async getTopLeaderboard(limit = 10) {
        const query = `
            SELECT u.username, MIN(l.best_time_ms) AS best_time_ms, l.skin
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            GROUP BY u.id
            ORDER BY best_time_ms ASC
            LIMIT ?
        `;
        return await db.queryAll(query, [limit]);
    },

    /**
     * Retrieves personal best score for a specific user
     */
    async getUserBestScore(userId) {
        return await db.queryOne(
            'SELECT MIN(best_time_ms) as best_time_ms, skin FROM leaderboard WHERE user_id = ?',
            [userId]
        );
    }
};

module.exports = DbService;
