const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');
const dbService = require('./db-service');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security: JWT_SECRET from environment with safe fallback
const JWT_SECRET = process.env.JWT_SECRET || 'pachin_super_secret_key_2026';
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set in .env, using default key.');
}

// Security: Helmet for secure HTTP headers with custom CSP for Google Fonts
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "https://*.adrianweb.es", "http://localhost:*", "ws:", "wss:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Security: Restrict CORS to local development and adrianweb.es domains
app.use(cors({
    origin: function(origin, callback) {
        if (
            !origin ||
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
            /^https?:\/\/([a-zA-Z0-9-]+\.)*adrianweb\.es$/.test(origin) ||
            origin === 'null'
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Security: Rate Limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Relaxed for development testing
    message: { error: 'Too many requests from this IP, please try again after 1 minute' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Security: Rate Limiting for public leaderboard
const leaderboardLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    message: { error: 'Too many requests for the leaderboard from this IP, please try again after a minute' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Security: Input validation to prevent DoS via large inputs
const validateCredentials = (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length > 50) {
        return res.status(400).json({ error: 'Username too long (max 50 characters)' });
    }

    // Security: Sanitización usando regex para admitir solo caracteres alfanuméricos
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain alphanumeric characters' });
    }

    // bcrypt has a max length limit of 72 bytes
    if (Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'Password too long (max 72 bytes)' });
    }

    next();
};

// POST /register
app.post('/register', authLimiter, validateCredentials, async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await dbService.createUser(username, hashedPassword);
        res.status(201).json({ message: 'User registered successfully', userId: newUser.userId });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /login
app.post('/login', authLimiter, validateCredentials, async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await dbService.getUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Update last login timestamp asynchronously
        dbService.updateUserLogin(user.id).catch(console.error);

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            message: 'Login successful',
            token,
            username: user.username,
            skin: user.skin || 'Pachin poderoso.png'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /leaderboard
app.post('/leaderboard', authenticateToken, async (req, res) => {
    const { best_time_ms, skin } = req.body;
    const userId = req.user.userId;

    if (best_time_ms === undefined || typeof best_time_ms !== 'number' || best_time_ms <= 0) {
        return res.status(400).json({ error: 'best_time_ms is required and must be a positive number' });
    }

    const validSkins = ['Pachin poderoso.png', 'pachin espadachin.png', 'pachin ladron.png', 'pachin mago.png'];
    const scoreSkin = skin && validSkins.includes(skin) ? skin : 'Pachin poderoso.png';

    try {
        const result = await dbService.saveScore(userId, best_time_ms, scoreSkin);
        res.status(201).json({ message: 'Score saved successfully', scoreId: result.scoreId });
    } catch (error) {
        console.error('Leaderboard save error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /leaderboard
app.get('/leaderboard', leaderboardLimiter, async (req, res) => {
    try {
        const rows = await dbService.getTopLeaderboard(10);
        res.json(rows);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /me - Returns logged user profile
app.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await dbService.getUserById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            username: user.username,
            skin: user.skin || 'Pachin poderoso.png',
            created_at: user.created_at,
            last_login: user.last_login
        });
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /skin - Save user skin preference
const validSkins = ['Pachin poderoso.png', 'pachin espadachin.png', 'pachin ladron.png', 'pachin mago.png'];
app.put('/skin', authenticateToken, async (req, res) => {
    const { skin } = req.body;
    if (!skin || !validSkins.includes(skin)) {
        return res.status(400).json({ error: 'Invalid skin selection' });
    }
    try {
        await dbService.updateUserSkin(req.user.userId, skin);
        res.json({ message: 'Skin updated successfully', skin });
    } catch (error) {
        console.error('Skin update error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Serve Static Game Files (Production / Standalone Mode) ---
const staticPath = fs.existsSync(path.join(__dirname, 'index.html'))
    ? __dirname
    : path.join(__dirname, '..');

app.use('/Personajes', express.static(path.join(staticPath, 'Personajes')));
app.use('/fondos', express.static(path.join(staticPath, 'fondos')));
app.use('/objetos', express.static(path.join(staticPath, 'objetos')));
app.get('/style.css', (req, res) => res.sendFile(path.join(staticPath, 'style.css')));
app.get('/game.js', (req, res) => res.sendFile(path.join(staticPath, 'game.js')));
app.get('/audio.js', (req, res) => res.sendFile(path.join(staticPath, 'audio.js')));
app.get('/', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
