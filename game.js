// ============================================================
// PACHIN v2.1 — Complete Game Script
// Agentes: PM, Frontend, Backend, Security
// Nuevos: 6 enemigos, 4 sets de habilidades, boss fase 2
// ============================================================

// --- AUTH & API ---
let jwtToken = null;
let loggedUsername = '';
let selectedSkin = 'Pachin poderoso.png';
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '5000' ? '' : 'http://localhost:5000')
    : '';
const authScreen   = document.getElementById('auth-screen');
const authForm     = document.getElementById('auth-form');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authMessage  = document.getElementById('auth-message');
const tabLogin     = document.getElementById('tab-login');
const tabRegister  = document.getElementById('tab-register');
const authSubmit   = document.getElementById('auth-submit');

// DOM - Leaderboard
const leaderboardScreen = document.getElementById('leaderboard-screen');
const leaderboardList   = document.getElementById('leaderboard-list');

// DOM - Timer
const gameTimerText  = document.getElementById('game-timer');
const victoryTimeText = document.getElementById('victory-time-text');
const victoryCharacterText = document.getElementById('victory-character-text');

// --- AUTH TABS ---
let isLoginMode = true;
tabLogin.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    authSubmit.innerText = 'ENTRAR';
});
tabRegister.addEventListener('click', () => {
    isLoginMode = false;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmit.innerText = 'REGISTRAR';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? '/login' : '/register';
    authMessage.innerText = 'Cargando...';
    authMessage.style.color = '#aaa';
    try {
        const res = await fetch(API_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: authUsername.value, password: authPassword.value })
        });
        const data = await res.json();
        if (res.ok) {
            if (isLoginMode) {
                jwtToken = data.token || data.access_token;
                // Fetch skin preference
                try {
                    const meRes = await fetch(API_URL + '/me', {
                        headers: { 'Authorization': 'Bearer ' + jwtToken }
                    });
                    if (meRes.ok) {
                        const me = await meRes.json();
                        selectedSkin = me.skin || 'Pachin poderoso.png';
                        loggedUsername = me.username;
                    }
                } catch (_) {}

                authScreen.style.display = 'none';
                wrapper.style.display = 'block';

                if (imagesLoaded >= totalImages) {
                    showMainMenu();
                } else {
                    loadImages(); // calls showMainMenu() when done
                }
            } else {
                authMessage.innerText = 'Registro exitoso. Ahora inicia sesión.';
                authMessage.style.color = '#00ff00';
            }
        } else {
            authMessage.innerText = data.error || data.message || 'Error de autenticación';
            authMessage.style.color = '#ff5555';
        }
    } catch (_) {
        authMessage.innerText = 'Error de conexión con el servidor.';
        authMessage.style.color = '#ff5555';
    }
});

// --- TIMER ---
let gameStartTime = 0;
let bestTimeMs    = 0;

function updateTimer() {
    if (!gameStartTime) return;
    const diff = Date.now() - gameStartTime;
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    gameTimerText.innerText = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// --- CANVAS & DOM ---
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const wrapper = document.getElementById('game-wrapper');

const screens = {
    loading  : document.getElementById('screen-loading'),
    mainmenu : document.getElementById('screen-mainmenu'),
    intro    : document.getElementById('screen-intro'),
    hud      : document.getElementById('screen-hud'),
    battle   : document.getElementById('screen-battle'),
    gameover : document.getElementById('screen-gameover'),
    victory  : document.getElementById('screen-victory')
};

// Story & HUD elements
const storyTextEl  = document.getElementById('story-text');
const storyImgEl   = document.getElementById('story-image');
const healthFill   = document.getElementById('health-bar-fill');
const healthTrail  = document.getElementById('health-bar-trail');
const healthText   = document.getElementById('health-text');
const logContainer = document.getElementById('log-container');

// Battle UI elements
const enemyBattleName   = document.getElementById('enemy-battle-name');
const enemyBattleLevel  = document.getElementById('enemy-battle-level');
const enemyBattleHpFill = document.getElementById('enemy-battle-hp-fill');
const playerBattleLevel = document.getElementById('player-battle-level');
const playerBattleHpFill  = document.getElementById('player-battle-hp-fill');
const playerBattleHpTrail = document.getElementById('player-battle-hp-trail');
const playerBattleHpText  = document.getElementById('player-battle-hp-text');
const playerBattleXpFill  = document.getElementById('player-battle-xp-fill');
const battleDialog = document.getElementById('battle-dialog');
const battleMenu   = document.getElementById('battle-menu');

// --- PLAYER SKINS (Jugadores folder) ---
const PLAYER_SKINS = [
    { file: 'Pachin poderoso.png', name: 'Pachin Poderoso', path: 'Personajes/Jugadores/' },
    { file: 'pachin espadachin.png', name: 'Espadachín',    path: 'Personajes/Jugadores/' },
    { file: 'pachin ladron.png',    name: 'Ladrón',         path: 'Personajes/Jugadores/' },
    { file: 'pachin mago.png',      name: 'Mago',           path: 'Personajes/Jugadores/' }
];

// --- IMAGE LOADING ---
const images = {};
let imagesLoaded = 0;

const imageManifest = [
    // Story/misc (root Personajes)
    { key: 'Pachin.png',  src: 'Personajes/Pachin.png'  },
    { key: 'Magolo.png',  src: 'Personajes/Magolo.png'  },
    // Player skins
    { key: 'Pachin poderoso.png',   src: 'Personajes/Jugadores/Pachin poderoso.png'   },
    { key: 'pachin espadachin.png', src: 'Personajes/Jugadores/pachin espadachin.png' },
    { key: 'pachin ladron.png',     src: 'Personajes/Jugadores/pachin ladron.png'     },
    { key: 'pachin mago.png',       src: 'Personajes/Jugadores/pachin mago.png'       },
    // Enemies — original
    { key: 'cavernicoli.png', src: 'Personajes/Enemigos/cavernicoli.png' },
    { key: 'esquelitik.png',  src: 'Personajes/Enemigos/esquelitik.png'  },
    { key: 'pulpus.png',      src: 'Personajes/Enemigos/pulpus.png'      },
    // Enemies — nuevos
    { key: 'antgolem.png',  src: 'Personajes/Enemigos/antgolem.png'  },
    { key: 'champifull.png',src: 'Personajes/Enemigos/champifull.png' },
    { key: 'chupchup.png',  src: 'Personajes/Enemigos/chupchup.png'  },
    { key: 'fantman.png',   src: 'Personajes/Enemigos/fantman.png'   },
    { key: 'lavafull.png',  src: 'Personajes/Enemigos/lavafull.png'  },
    { key: 'zomcup.png',    src: 'Personajes/Enemigos/zomcup.png'    },
    // Boss
    { key: 'Fraction.png',   src: 'Personajes/Enemigos/boss/Fraction.png'          },
    { key: 'fraction2.png',  src: 'Personajes/Enemigos/boss/fase 2/fraction2.png'  },
    // Objects
    { key: 'cofre.png',      src: 'objetos/cofre.png'                              },
    // Backgrounds
    { key: 'cueva.png',             src: 'fondos/cueva.png'             },
    { key: 'mazmorra.png',          src: 'fondos/mazmorra.png'          },
    { key: 'pueblo.png',            src: 'fondos/pueblo.png'            },
    { key: 'pelea fraction.png',    src: 'fondos/pelea fraction.png'    },
    { key: 'fase 2 fraction.png',   src: 'fondos/fase 2 fraction.png'   }
];
const totalImages = imageManifest.length;

function loadImages() {
    wrapper.classList.add('blur-canvas');
    const done = () => {
        imagesLoaded++;
        if (imagesLoaded >= totalImages) showMainMenu();
    };
    imageManifest.forEach(({ key, src }) => {
        const img = new Image();
        img.onload  = done;
        img.onerror = () => { console.warn('Missing asset:', src); done(); };
        img.src = src;
        images[key] = img;
    });
}

// --- STATE MACHINE ---
const STATE_LOADING  = 0;
const STATE_INTRO    = 2;
const STATE_PLAYING  = 3;
const STATE_GAMEOVER = 4;
const STATE_VICTORY  = 5;
const STATE_BATTLE   = 6;
const STATE_MAINMENU = 7;
let currentState = STATE_LOADING;

function switchScreen(activeScreen) {
    Object.values(screens).forEach(s => { if (s) s.classList.remove('active'); });
    if (activeScreen) activeScreen.classList.add('active');
    // Blur canvas when on overlay screens
    const blurScreens = [screens.loading, screens.mainmenu, screens.gameover, screens.victory];
    wrapper.classList.toggle('blur-canvas', blurScreens.includes(activeScreen));
}

function showMainMenu() {
    currentState = STATE_MAINMENU;
    switchScreen(screens.mainmenu);
    if (audioManager) audioManager.playBgm('menu');
    const el = document.getElementById('menu-username');
    if (el && loggedUsername) el.innerText = `¡Bienvenido, ${loggedUsername}!`;
    if (!lastTime) requestAnimationFrame(gameLoop);
}

// --- MAIN MENU BUTTONS ---
document.getElementById('btn-play').addEventListener('click', () => {
    switchScreen(screens.intro);
    startStory();
});

document.getElementById('btn-leaderboard-menu').addEventListener('click', fetchAndShowLeaderboard);

document.getElementById('btn-customize').addEventListener('click', openCustomizeModal);

document.getElementById('btn-next-story').addEventListener('click', advanceStory);
document.getElementById('btn-skip-story').addEventListener('click', () => {
    switchScreen(screens.hud);
    initGame();
});

document.getElementById('btn-restart').addEventListener('click', resetGameSession);
document.getElementById('btn-continue').addEventListener('click', resetGameSession);

document.getElementById('btn-view-leaderboard').addEventListener('click', fetchAndShowLeaderboard);
document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
    leaderboardScreen.style.display = 'none';
});

// --- BATTLE SPEED (only x1 / x2 — Security: no x4 to avoid desync) ---
let battleSpeed = 1;
const btnFastForward = document.getElementById('btn-fast-forward');
btnFastForward.addEventListener('click', () => {
    if (battleSpeed === 1) {
        battleSpeed = 2;
        btnFastForward.innerText = '⏩ x2';
        btnFastForward.classList.add('ff-active');
    } else {
        battleSpeed = 1;
        btnFastForward.innerText = '⏩ x1';
        btnFastForward.classList.remove('ff-active');
    }
});

// --- CUSTOMIZE MODAL ---
function openCustomizeModal() {
    const modal = document.getElementById('modal-customize');
    const grid  = document.getElementById('skin-grid');
    grid.innerHTML = '';

    PLAYER_SKINS.forEach(skin => {
        const card = document.createElement('div');
        card.className = 'skin-card' + (skin.file === selectedSkin ? ' selected' : '');
        card.innerHTML = `
            <img src="${skin.path}${skin.file}" alt="${skin.name}" />
            <span>${skin.name}</span>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedSkin = skin.file;
        });
        grid.appendChild(card);
    });
    modal.style.display = 'flex';
}

document.getElementById('btn-save-skin').addEventListener('click', async () => {
    if (jwtToken) {
        try {
            await fetch(API_URL + '/skin', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + jwtToken
                },
                body: JSON.stringify({ skin: selectedSkin })
            });
        } catch (err) { console.error('Could not save skin:', err); }
    }
    // Update victory screen image to match selection
    const victoryImg = document.getElementById('victory-player-img');
    if (victoryImg) victoryImg.src = 'Personajes/Jugadores/' + selectedSkin;

    document.getElementById('modal-customize').style.display = 'none';
});

document.getElementById('btn-close-customize').addEventListener('click', () => {
    document.getElementById('modal-customize').style.display = 'none';
});

// --- LEADERBOARD ---
async function fetchAndShowLeaderboard() {
    leaderboardScreen.style.display = 'flex';
    leaderboardList.innerHTML = '<li style="color:white;text-align:center;">Cargando...</li>';
    try {
        const res  = await fetch(API_URL + '/leaderboard');
        const data = await res.json();
        leaderboardList.innerHTML = '';
        if (!data.length) {
            leaderboardList.innerHTML = '<li style="color:#aaa;text-align:center;">No hay récords aún.</li>';
            return;
        }
        data.slice(0, 10).forEach((entry, i) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            if (i < 3) li.classList.add(`lb-top${i+1}`);
            const ms = entry.best_time_ms;
            const m  = Math.floor(ms / 60000);
            const s  = Math.floor((ms % 60000) / 1000);
            const cs = Math.floor((ms % 1000) / 10);
            li.innerHTML = `
                <span class="lb-rank">#${i+1}</span>
                <img src="Personajes/Jugadores/${entry.skin || 'Pachin poderoso.png'}" class="lb-avatar" style="width:24px;height:24px;image-rendering:pixelated;vertical-align:middle;margin-right:8px;border-radius:4px;background:rgba(255,255,255,0.05);" />
                <span class="lb-user">${entry.username}</span>
                <span class="lb-time">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(cs).padStart(2,'0')}</span>
            `;
            leaderboardList.appendChild(li);
        });
    } catch (_) {
        leaderboardList.innerHTML = '<li style="color:#ff5555;text-align:center;">Error cargando leaderboard.</li>';
    }
}

// --- CONSTANTS ---
const TILE_SIZE   = 64;
const COLS        = 24;
const ROWS        = 10;
const MAP_OFFSET_X = (1584 - COLS * TILE_SIZE) / 2;
const MAP_OFFSET_Y = (672  - ROWS * TILE_SIZE) / 2;
const AGGRO_RADIUS = 200; // px — distance for enemy to start chasing
const ENEMY_SPEED  = 80;  // px/s
const MAX_PLAYER_SPEED = 300; // px/s — anti-cheat cap

// --- VISUAL EFFECTS ---
let particles    = [];
let floatingTexts = [];
let screenShake  = 0;
let battleTime   = 0;
let lastTime     = 0;

// --- STORY ---
const storyTexts = [
    "Durante generaciones, la aldea fue un remanso de paz. Pachin, un humilde agricultor, dedicaba sus días a labrar la tierra, ajeno a las oscuras sombras que se cernían sobre el mundo.",
    "Pero la paz es efímera. El cielo se tiñó de ceniza cuando el despiadado Fraction descendió con sus legiones. La aldea ardió y la desesperación lo consumió todo.",
    "Pachin apenas logró escapar con vida. Corrió hacia las montañas prohibidas mientras los gritos de su pueblo resonaban a sus espaldas, ocultándose en las entrañas de una cueva milenaria.",
    "En el corazón de la caverna, un frasco antiguo descansaba sobre un altar de piedra. Una voz espectral susurró en su mente: 'Rompe el sello, mortal... y te daré el poder para salvar a los tuyos'.",
    "Sin nada que perder, Pachin rompió el frasco. Una imponente figura emergió de la bruma: Magolo, el hechicero perdido. 'Tu valentía te precede', dijo el mago. 'Recibe mi don'.",
    "Magolo alzó su bastón estelar y un relámpago de energía pura envolvió a Pachin. Sus miedos desaparecieron, reemplazados por una fuerza mágica incalculable. ¡Se había convertido en Pachin Poderoso!",
    "Armado con un nuevo poder, Pachin se adentra en la oscuridad. Debe exterminar a las aberraciones de la cueva para salir a la superficie y cazar a Fraction. Su leyenda comienza ahora."
];
let currentStoryLine = 0;
let storyCharIndex   = 0;
let isTyping         = false;

function startStory() {
    currentState = STATE_INTRO;
    currentStoryLine = 0;
    showStorySlide();
}

function getCurrentStoryText(lineIndex) {
    let text = storyTexts[lineIndex] || '';
    if (lineIndex === 5) {
        const stats = BASE_STATS[selectedSkin] || BASE_STATS['Pachin poderoso.png'];
        text = text.replace("Pachin Poderoso", stats.label);
    }
    return text;
}

function advanceStory() {
    const currentText = getCurrentStoryText(currentStoryLine);
    if (isTyping) {
        storyCharIndex = currentText.length;
        storyTextEl.innerText = currentText;
        isTyping = false;
    } else {
        currentStoryLine++;
        if (currentStoryLine >= storyTexts.length) {
            switchScreen(screens.hud);
            initGame();
        } else {
            showStorySlide();
        }
    }
}

function showStorySlide() {
    storyCharIndex = 0;
    isTyping = true;
    storyTextEl.innerText = '';
    const imgMap = { 
        0: 'Pachin.png', 
        1: 'Fraction.png', 
        2: 'Pachin.png', 
        4: 'Magolo.png', 
        5: selectedSkin, 
        6: selectedSkin 
    };
    const imgKey = imgMap[currentStoryLine];
    if (imgKey && images[imgKey]) {
        storyImgEl.src = images[imgKey].src;
        storyImgEl.style.display = 'block';
        storyImgEl.style.opacity = 0;
    } else {
        storyImgEl.style.display = 'none';
    }
}

// --- MAP ---
let map = [];
let explored = [];
let chests = [];
let traps = [];

function generateMap() {
    map = [];
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) {
            row.push(1);
        }
        map.push(row);
    }

    const rooms = [];
    const minSize = 3;
    const maxSize = 5;
    const numRooms = 7;

    for (let i = 0; i < numRooms; i++) {
        let w = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        let h = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        let rx = Math.floor(Math.random() * (COLS - w - 2)) + 1;
        let ry = Math.floor(Math.random() * (ROWS - h - 2)) + 1;

        if (rx <= 0 || ry <= 0 || rx + w >= COLS - 1 || ry + h >= ROWS - 1) continue;

        let overlap = false;
        for (const r of rooms) {
            if (rx < r.x + r.w && rx + w > r.x && ry < r.y + r.h && ry + h > r.y) {
                overlap = true;
                break;
            }
        }
        if (overlap) continue;

        for (let y = ry; y < ry + h; y++) {
            for (let x = rx; x < rx + w; x++) {
                map[y][x] = 0;
            }
        }

        rooms.push({
            x: rx, y: ry, w: w, h: h,
            cx: Math.floor(rx + w / 2),
            cy: Math.floor(ry + h / 2)
        });
    }

    if (rooms.length === 0) {
        rooms.push({ x: 2, y: 2, w: 4, h: 4, cx: 4, cy: 4 });
        for (let y = 2; y < 6; y++) {
            for (let x = 2; x < 6; x++) {
                map[y][x] = 0;
            }
        }
    }

    function createCorridor(r1, r2) {
        const startX = Math.min(r1.cx, r2.cx);
        const endX = Math.max(r1.cx, r2.cx);
        for (let x = startX; x <= endX; x++) {
            map[r1.cy][x] = 0;
        }

        const startY = Math.min(r1.cy, r2.cy);
        const endY = Math.max(r1.cy, r2.cy);
        for (let y = startY; y <= endY; y++) {
            map[y][r2.cx] = 0;
        }
    }

    // Connect sequentially
    for (let i = 0; i < rooms.length - 1; i++) {
        createCorridor(rooms[i], rooms[i+1]);
    }

    // Connect first and last room to create a loop (non-linear layout)
    if (rooms.length > 2) {
        createCorridor(rooms[0], rooms[rooms.length - 1]);
    }

    const lastRoom = rooms[rooms.length - 1];
    map[lastRoom.cy][lastRoom.cx] = 2; // Portal

    map.playerStart = { x: rooms[0].cx * TILE_SIZE, y: rooms[0].cy * TILE_SIZE };
}

// --- RPG DATA ---
let player = null;
let enemies = [];
let currentBattleEnemy = null;
let currentFloor = 1;

// ★ Cada personaje tiene su propio set de 4 ataques únicos
const MOVES_BY_SKIN = {
    'Pachin poderoso.png': [
        { id:'baton',    name:'Golpe de Bastón',  level:1, type:'phys',  dmg:1.0,           desc:'Golpe físico básico con el bastón.' },
        { id:'juicio',   name:'Juicio Estelar',   level:2, type:'magic', dmg:1.5, crit:0.15, desc:'Llama al poder cósmico.' },
        { id:'curacion', name:'Luz Sanadora',     level:3, type:'heal',  amt:0.5,           desc:'Recupera el 50% de HP máximo.' },
        { id:'nova',     name:'Nova de Energía',  level:5, type:'magic', dmg:2.5, crit:0.25, desc:'Explosión de energía pura devastadora.' }
    ],
    'pachin espadachin.png': [
        { id:'corte',    name:'Corte Veloz',      level:1, type:'phys',  dmg:1.2,           desc:'Tajo rápido con la espada.' },
        { id:'doble',    name:'Doble Golpe',      level:2, type:'phys',  dmg:0.8, hits:2,   desc:'Dos golpes rápidos consecutivos.' },
        { id:'guard',    name:'Postura Guardia',  level:3, type:'heal',  amt:0.3,           desc:'Recupera el 30% de HP y sube defensa.' },
        { id:'frenesi',  name:'Frenesí de Acero', level:5, type:'phys',  dmg:3.0, crit:0.4, desc:'Ataque devastador con toda la fuerza.' }
    ],
    'pachin ladron.png': [
        { id:'punal',    name:'Puñalada Traición', level:1, type:'phys',  dmg:1.0, crit:0.4, desc:'Ataque con alta probabilidad crítica.' },
        { id:'veneno',   name:'Veneno en Daga',   level:2, type:'dot',   dmg:0.5,           desc:'Envenena al enemigo durante 2 turnos.' },
        { id:'sombra',   name:'Paso en Sombras',  level:3, type:'heal',  amt:0.25,          desc:'Se oculta y recupera vida.' },
        { id:'muerte',   name:'Golpe Letal',      level:5, type:'phys',  dmg:2.0, crit:0.6, desc:'El ataque más preciso y mortal.' }
    ],
    'pachin mago.png': [
        { id:'llama',    name:'Bola de Fuego',    level:1, type:'magic', dmg:1.1,           desc:'Bola de fuego concentrada.' },
        { id:'hielo',    name:'Lanza de Hielo',   level:2, type:'magic', dmg:1.3, slow:true, desc:'Ralentiza y daña con hielo.' },
        { id:'mana',     name:'Orbe de Mana',     level:3, type:'heal',  amt:0.4,           desc:'Absorbe energía mágica del entorno.' },
        { id:'tormenta', name:'Tormenta Arcana',  level:5, type:'magic', dmg:3.0, crit:0.3, desc:'Tormenta de energía mágica destructiva.' }
    ]
};

let PLAYER_MOVES = MOVES_BY_SKIN['Pachin poderoso.png']; // se asigna al iniciar juego

// Stats base por personaje (cada clase es diferente)
const BASE_STATS = {
    'Pachin poderoso.png':   { hp: 35, atk: 6,  magic: 12, label: 'Pachin Poderoso' },
    'pachin espadachin.png': { hp: 45, atk: 10, magic: 4,  label: 'Pachin Espadachín' },
    'pachin ladron.png':     { hp: 28, atk: 8,  magic: 5,  label: 'Pachin Ladrón' },
    'pachin mago.png':       { hp: 25, atk: 3,  magic: 16, label: 'Pachin Mago' }
};

function initGame() {
    currentState  = STATE_PLAYING;
    currentFloor  = 1;
    gameStartTime = Date.now();

    // Asignar ataques y stats según skin elegida
    PLAYER_MOVES = MOVES_BY_SKIN[selectedSkin] || MOVES_BY_SKIN['Pachin poderoso.png'];
    const stats  = BASE_STATS[selectedSkin]    || BASE_STATS['Pachin poderoso.png'];

    player = {
        level: 1, exp: 0, maxExp: 30,
        hp: stats.hp, maxHp: stats.hp,
        atk: stats.atk, magic: stats.magic,
        sprite: images[selectedSkin] || images['Pachin poderoso.png']
    };

    // Mostrar nombre del personaje elegido en el HUD
    const nameEl = document.getElementById('hud-player-name');
    if (nameEl) nameEl.innerText = stats.label;

    initFloor();
}

function updateExploration() {
    if (!explored || !player) return;
    const pX = Math.floor((player.pixelX + TILE_SIZE/2) / TILE_SIZE);
    const pY = Math.floor((player.pixelY + TILE_SIZE/2) / TILE_SIZE);
    const radius = 2;
    for (let y = Math.max(0, pY - radius); y <= Math.min(ROWS - 1, pY + radius); y++) {
        for (let x = Math.max(0, pX - radius); x <= Math.min(COLS - 1, pX + radius); x++) {
            if (Math.hypot(x - pX, y - pY) <= radius + 0.5) {
                explored[y][x] = true;
            }
        }
    }
}

function initFloor() {
    generateMap();
    player.pixelX = map.playerStart.x;
    player.pixelY = map.playerStart.y;

    explored = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
    updateExploration();

    // Reproducir música según piso
    if (audioManager) {
        if (currentFloor === 5) {
            audioManager.playBgm('boss');
        } else {
            audioManager.playBgm('dungeon');
        }
    }

    const ALL_ENEMY_TYPES = [
        { name:'Cavernícola', hp:15, atk:3,  level:1, exp:35, sprite:images['cavernicoli.png'], moves:['Garrotazo','Rugido'] },
        { name:'Esquelitik',  hp:12, atk:5,  level:2, exp:45, sprite:images['esquelitik.png'],  moves:['Hueso Punzante','Robavida'] },
        { name:'Pulpus',      hp:25, atk:7,  level:3, exp:60, sprite:images['pulpus.png'],       moves:['Látigo Tentáculo','Tinta Tóxica'] },
        { name:'Ant Golem',   hp:30, atk:8,  level:2, exp:55, sprite:images['antgolem.png'],     moves:['Golpe de Roca','Aplastamiento'] },
        { name:'Champifull',  hp:18, atk:4,  level:1, exp:40, sprite:images['champifull.png'],   moves:['Lluvia de Esporas','Mordisco'] },
        { name:'Chupchup',    hp:10, atk:6,  level:2, exp:42, sprite:images['chupchup.png'],     moves:['Chupar Vida','Picotazo'] },
        { name:'Fantman',     hp:20, atk:9,  level:3, exp:65, sprite:images['fantman.png'],      moves:['Garra Espectral','Maldición'] },
        { name:'Lava Full',   hp:35, atk:10, level:4, exp:80, sprite:images['lavafull.png'],     moves:['Erupcción de Lava','Calor Infernal'] },
        { name:'Zomcup',      hp:22, atk:6,  level:2, exp:48, sprite:images['zomcup.png'],       moves:['Mordisco Zombie','Infección'] }
    ];

    const floorEnemies = ALL_ENEMY_TYPES.filter(e => e.level <= Math.min(currentFloor + 1, 4));

    enemies = [];
    let numEnemies = 2 + currentFloor;
    let attempts = 0;
    while (enemies.length < numEnemies && attempts < 200) {
        attempts++;
        let ex = Math.floor(Math.random() * (COLS-2)) + 1;
        let ey = Math.floor(Math.random() * (ROWS-2)) + 1;
        const distToPlayer = Math.hypot(ex * TILE_SIZE - player.pixelX, ey * TILE_SIZE - player.pixelY);
        if (map[ey][ex] === 0 && distToPlayer > TILE_SIZE * 3.5) {
            const t = floorEnemies[Math.floor(Math.random() * floorEnemies.length)];
            const scale = 1 + (currentFloor - 1) * 0.3;
            enemies.push({
                pixelX: ex * TILE_SIZE, pixelY: ey * TILE_SIZE,
                hp: Math.floor(t.hp * scale), maxHp: Math.floor(t.hp * scale),
                atk: Math.floor(t.atk * (1 + (currentFloor-1) * 0.2)),
                name: t.name, level: t.level + currentFloor - 1,
                expYield: Math.floor(t.exp * (1 + (currentFloor-1) * 0.2)),
                sprite: t.sprite, moves: t.moves, hitFlash: 0
            });
        }
    }

    // Cofres (1 o 2 por piso)
    chests = [];
    let numChests = Math.random() < 0.5 ? 1 : 2;
    attempts = 0;
    while (chests.length < numChests && attempts < 100) {
        attempts++;
        let cx = Math.floor(Math.random() * (COLS-2)) + 1;
        let cy = Math.floor(Math.random() * (ROWS-2)) + 1;
        const distToPlayer = Math.hypot(cx * TILE_SIZE - player.pixelX, cy * TILE_SIZE - player.pixelY);
        const onEnemy = enemies.some(e => Math.floor(e.pixelX/TILE_SIZE) === cx && Math.floor(e.pixelY/TILE_SIZE) === cy);
        if (map[cy][cx] === 0 && distToPlayer > TILE_SIZE * 2 && !onEnemy) {
            chests.push({
                pixelX: cx * TILE_SIZE,
                pixelY: cy * TILE_SIZE,
                type: Math.random() < 0.6 ? 'heal' : 'exp',
                opened: false
            });
        }
    }

    // Trampas (removidas por petición del usuario)
    traps = [];

    logContainer.innerHTML = '';
    particles = []; floatingTexts = []; screenShake = 0;
    updateMapHUDHealth();
    const floorTextEl = document.getElementById('hud-floor-text');
    if (floorTextEl) floorTextEl.innerText = `PISO ${currentFloor} / 5`;
    addHTMLHUDLog(currentFloor === 5 ? '¡La Guarida de Fraction! Último piso.' : `¡Piso ${currentFloor}! Busca la puerta.`);
}

// --- HUD ---
function addHTMLHUDLog(msg) {
    const el = document.createElement('div');
    el.className = 'log-entry';
    el.innerText = msg;
    logContainer.appendChild(el);
    setTimeout(() => {
        el.classList.add('fade-out');
        setTimeout(() => { if (el.parentNode) logContainer.removeChild(el); }, 500);
    }, 4000);
}

function updateMapHUDHealth() {
    const pct = Math.max(0, player.hp / player.maxHp) * 100;
    healthFill.style.width  = pct + '%';
    healthText.innerText    = `${player.hp} / ${player.maxHp} HP`;
    setTimeout(() => { healthTrail.style.width = pct + '%'; }, 300);
}

// --- EFFECTS ---
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.0, vy: -30 });
}
function spawnParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*400, vy: (Math.random()-0.5)*400,
            life: Math.random()*0.5+0.3, maxLife: 0.8,
            color, size: Math.random()*6+4
        });
    }
}

// --- CONTROLS ---
const keys = { w:false, a:false, s:false, d:false };
window.addEventListener('keydown', e => {
    if (e.code==='ArrowUp'    || e.code==='KeyW') keys.w = true;
    if (e.code==='ArrowDown'  || e.code==='KeyS') keys.s = true;
    if (e.code==='ArrowLeft'  || e.code==='KeyA') keys.a = true;
    if (e.code==='ArrowRight' || e.code==='KeyD') keys.d = true;
});
window.addEventListener('keyup', e => {
    if (e.code==='ArrowUp'    || e.code==='KeyW') keys.w = false;
    if (e.code==='ArrowDown'  || e.code==='KeyS') keys.s = false;
    if (e.code==='ArrowLeft'  || e.code==='KeyA') keys.a = false;
    if (e.code==='ArrowRight' || e.code==='KeyD') keys.d = false;
});

// --- BATTLE SYSTEM ---
function initBattle(enemy) {
    currentState = STATE_BATTLE;
    currentBattleEnemy = enemy;
    battleTime = 0;

    if (audioManager) {
        if (enemy.isBoss) {
            audioManager.playBgm('boss');
        } else {
            audioManager.playBgm('battle');
        }
    }

    wrapper.classList.remove('battle-transition');
    void wrapper.offsetWidth;
    wrapper.classList.add('battle-transition');

    setTimeout(() => {
        switchScreen(screens.battle);
        updateBattleHUD();
        setBattleDialog(`¡Un ${enemy.name} salvaje (Nv ${enemy.level}) ataca!`);
        buildBattleMenu();
    }, 500);
}

function updateBattleHUD() {
    enemyBattleName.innerText  = currentBattleEnemy.name;
    enemyBattleLevel.innerText = `Nv ${currentBattleEnemy.level}`;
    enemyBattleHpFill.style.width = Math.max(0, currentBattleEnemy.hp / currentBattleEnemy.maxHp * 100) + '%';

    playerBattleLevel.innerText = `Nv ${player.level}`;
    const pPct = Math.max(0, player.hp / player.maxHp) * 100;
    playerBattleHpFill.style.width  = pPct + '%';
    playerBattleHpText.innerText = `${player.hp} / ${player.maxHp}`;
    setTimeout(() => { playerBattleHpTrail.style.width = pPct + '%'; }, 300);
    playerBattleXpFill.style.width = (player.exp / player.maxExp * 100) + '%';
}

let battleDialogTimeout = null;
let currentBattleDialogText = '';

function setBattleDialog(text) {
    battleDialog.innerHTML = '';
    if (battleDialogTimeout) clearTimeout(battleDialogTimeout);
    currentBattleDialogText = text;
    let i = 0;
    const speed = 20 / battleSpeed; // x2 typewriter is faster too
    function type() {
        if (currentBattleDialogText !== text) return;
        if (i < text.length) {
            battleDialog.innerHTML += text.charAt(i++);
            battleDialogTimeout = setTimeout(type, speed);
        }
    }
    type();
}

function buildBattleMenu() {
    battleMenu.innerHTML = '';
    PLAYER_MOVES.filter(m => m.level <= player.level).forEach(move => {
        const btn = document.createElement('button');
        btn.className = 'battle-btn';
        btn.innerText = move.name;
        btn.onclick = () => executePlayerMove(move);
        battleMenu.appendChild(btn);
    });
}

function setBattleMenuEnabled(enabled) {
    battleMenu.querySelectorAll('.battle-btn').forEach(b => b.disabled = !enabled);
}

// Security: wait() uses battleSpeed only for delays, NEVER for damage calculation
function wait(ms) { return new Promise(r => setTimeout(r, ms / battleSpeed)); }

// --- BOSS PHASE 2 BLACKOUT TRANSITION ---
// Fade to black → show transformation text → fade back
function bossTransformBlackout() {
    return new Promise(resolve => {
        // Create the overlay element
        const overlay = document.createElement('div');
        overlay.id = 'boss-transform-overlay';
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 999; opacity: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 20px;
            transition: opacity 0.8s ease;
            pointer-events: none;
        `;

        const titleEl = document.createElement('div');
        titleEl.style.cssText = `
            font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 900;
            color: #ff0055; letter-spacing: 4px; text-transform: uppercase;
            text-shadow: 0 0 30px #ff0055, 0 0 60px #aa0033;
            opacity: 0; transition: opacity 0.5s ease; text-align: center;
        `;
        titleEl.innerText = '⚡ TRANSFORMACIÓN ⚡';

        const subEl = document.createElement('div');
        subEl.style.cssText = `
            font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700;
            color: #cc00ff; letter-spacing: 2px;
            text-shadow: 0 0 20px #cc00ff;
            opacity: 0; transition: opacity 0.5s ease 0.3s; text-align: center;
        `;
        subEl.innerText = 'FRACTION — FORMA FINAL';

        overlay.appendChild(titleEl);
        overlay.appendChild(subEl);
        wrapper.appendChild(overlay);

        // Fade in to black
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            setTimeout(() => {
                // Show text
                titleEl.style.opacity = '1';
                subEl.style.opacity = '1';

                // Screen shake during transformation
                screenShake = 80;

                // Purple/red particles burst
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        spawnParticles(canvas.width/2, canvas.height/2, '#cc00ff', 30);
                        spawnParticles(canvas.width/2, canvas.height/2, '#ff0055', 20);
                        screenShake = 40;
                    }, i * 200);
                }

                // Hold black screen
                setTimeout(() => {
                    // Fade out
                    titleEl.style.opacity = '0';
                    subEl.style.opacity = '0';
                    overlay.style.opacity = '0';

                    setTimeout(() => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                        resolve();
                    }, 900);
                }, 2500);
            }, 900);
        });
    });
}

async function executePlayerMove(move) {
    setBattleMenuEnabled(false);
    const skinData = PLAYER_SKINS.find(s => s.file === selectedSkin);
    const charName = skinData?.name || 'Pachin';
    setBattleDialog(`¡${charName} usa ${move.name}!`);
    await wait(1000);

    if (move.type === 'heal') {
        if (audioManager) audioManager.playHeal();
        const healAmt = Math.floor(player.maxHp * move.amt);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        spawnFloatingText(300, 350, `+${healAmt}`, '#00ff00');
        spawnParticles(300, 450, '#00ff00', 30);
        updateBattleHUD();
        setBattleDialog(`¡${charName} recupera ${healAmt} HP!`);
        await wait(1500);
    } else if (move.type === 'dot') {
        if (audioManager) audioManager.playHit();
        let dmg = Math.floor(player.atk * move.dmg + Math.random() * 2);
        currentBattleEnemy.hp -= dmg;
        currentBattleEnemy.poisoned = 2; // turnos de veneno
        currentBattleEnemy.hitFlash = 10;
        screenShake = 15;
        spawnFloatingText(1200, 200, `-${dmg} ☠`, '#88ff44');
        spawnParticles(1200, 250, '#88ff44', 20);
        updateBattleHUD();
        setBattleDialog(`¡Veneno aplicado! ${dmg} de daño inicial. El enemigo sangrará.`);
        await wait(1500);
    } else {
        if (audioManager) {
            if (move.type === 'magic') audioManager.playMagic();
            else audioManager.playHit();
        }
        let dmg = 0, isCrit = false;
        const hitCount = move.hits || 1;
        if (move.type === 'phys') {
            dmg = Math.floor(player.atk * move.dmg + Math.random() * 2) * hitCount;
        } else {
            dmg = Math.floor(player.magic * move.dmg + Math.random() * 4);
            if (move.crit && Math.random() < move.crit) { dmg = Math.floor(dmg * 2); isCrit = true; }
        }
        currentBattleEnemy.hp -= dmg;
        currentBattleEnemy.hitFlash = 10;
        screenShake = 20;
        const hitColor = isCrit ? '#ffaa00' : (move.type === 'phys' ? '#ff5555' : '#88aaff');
        spawnFloatingText(1200, 200, isCrit ? `¡CRÍTICO! -${dmg}` : `-${dmg}`, hitColor);
        spawnParticles(1200, 250, hitColor, isCrit ? 50 : 20);
        updateBattleHUD();
        let msg = isCrit ? `¡Golpe crítico! ${charName} hizo ${dmg} de daño.` : `${charName} hizo ${dmg} de daño.`;
        if (hitCount > 1) msg = `¡${hitCount} golpes! ${dmg} de daño total.`;
        setBattleDialog(msg);
        await wait(1500);
    }

    if (currentBattleEnemy.hp <= 0) winBattle();
    else executeEnemyMove();
}

async function executeEnemyMove() {
    const moveName = currentBattleEnemy.moves[Math.floor(Math.random() * currentBattleEnemy.moves.length)];
    setBattleDialog(`¡${currentBattleEnemy.name} usa ${moveName}!`);
    await wait(1000);

    let dmg = Math.floor(currentBattleEnemy.atk * 0.8 + Math.random() * 2);

    if (moveName === 'Robavida' || moveName === 'Chupar Vida') {
        if (audioManager) audioManager.playHeal();
        const heal = Math.floor(dmg / 2);
        currentBattleEnemy.hp = Math.min(currentBattleEnemy.maxHp, currentBattleEnemy.hp + heal);
        spawnFloatingText(1200, 200, `+${heal}`, '#00ff00');
        updateBattleHUD();
    }
    if (moveName === 'Infección' || moveName === 'Tinta Tóxica') {
        dmg = Math.floor(dmg * 1.2);
        spawnParticles(300, 350, '#88ff44', 15);
    }
    if (moveName === 'Maldición' || moveName === 'Garra Espectral') {
        dmg = Math.floor(dmg * 1.3);
        spawnParticles(300, 350, '#aa00ff', 20);
    }

    if (currentBattleEnemy.poisoned > 0) {
        const poisonDmg = Math.floor(currentBattleEnemy.maxHp * 0.06);
        currentBattleEnemy.hp -= poisonDmg;
        currentBattleEnemy.poisoned--;
        spawnFloatingText(1200, 280, `☠ -${poisonDmg}`, '#88ff44');
        updateBattleHUD();
        if (currentBattleEnemy.hp <= 0) { winBattle(); return; }
    }

    if (audioManager) {
        if (moveName === 'Maldición' || moveName === 'Garra Espectral' || moveName === 'Tinta Tóxica' || moveName === 'Rugido') {
            audioManager.playMagic();
        } else {
            audioManager.playHit();
        }
    }

    player.hp -= dmg;
    screenShake = 30;
    wrapper.classList.remove('flash-red');
    void wrapper.offsetWidth;
    wrapper.classList.add('flash-red');
    spawnFloatingText(300, 350, `-${dmg}`, '#ff0000');
    spawnParticles(300, 450, 'red', 20);
    updateBattleHUD();

    const skinData = PLAYER_SKINS.find(s => s.file === selectedSkin);
    const charName = skinData?.name || 'Pachin';
    if (player.hp <= 0) {
        if (audioManager) audioManager.stopBgm();
        setBattleDialog(`¡${charName} ha sido derrotado!`);
        await wait(1500);
        currentState = STATE_GAMEOVER;
        switchScreen(screens.gameover);
    } else {
        setBattleMenuEnabled(true);
        setBattleDialog(`¿Qué debería hacer ${charName}?`);
    }
}

async function winBattle() {
    setBattleDialog(`¡${currentBattleEnemy.name} derrotado!`);
    await wait(1500);

    if (currentBattleEnemy.isBoss && !currentBattleEnemy.isPhase2) {
        // ══════════════════════════════════════════════
        // ★ BOSS FASE 2 — Diálogo + Transformación
        // ══════════════════════════════════════════════
        setBattleMenuEnabled(false);
        await wait(800);
        setBattleDialog('...');
        await wait(1200);
        setBattleDialog('«¡Eso... eso no es suficiente para detenerme!»');
        await wait(2000);
        setBattleDialog('«¡Aún no has acabado conmigo, miserable! ¡Despierta, mi verdadero poder!»');
        await wait(2500);

        // Transición en negro con CSS
        await bossTransformBlackout();

        // Substituir al enemigo por fase 2
        currentBattleEnemy = {
            name: 'Fraction — Forma Final',
            hp: 450, maxHp: 450, atk: 30, level: 15, expYield: 1000,
            sprite: images['fraction2.png'],
            color: '#8800ff',
            moves: ['Ira Cósmica', 'Vacio Absoluto', 'Juicio Final', 'Consumir Alma'],
            hitFlash: 0, isBoss: true, isPhase2: true
        };

        setBattleDialog('¡FRACTION LIBERA SU VERDADERO PODER! ¡La batalla final comienza!');
        spawnParticles(900, 300, '#ff00aa', 80);
        spawnParticles(1100, 300, '#8800ff', 80);
        screenShake = 60;
        updateBattleHUD();
        await wait(2000);
        setBattleMenuEnabled(true);
        setBattleDialog(`¡Derrota a ${currentBattleEnemy.name} para salvar a tu aldea!`);
        buildBattleMenu();
        return; // No continuar con el flujo normal
    }

    if (currentBattleEnemy.isBoss && currentBattleEnemy.isPhase2) {
        // Fraction Fase 2 vencida → Victoria
        setBattleDialog('«...Imposible... ¡Maldito seas, Pachin...!»');
        await wait(2500);
        setBattleDialog('¡Fraction ha sido eliminado para siempre! ¡La aldea está a salvo!');
        await wait(2000);

        bestTimeMs = Date.now() - gameStartTime;
        const m  = Math.floor(bestTimeMs / 60000);
        const s  = Math.floor((bestTimeMs % 60000) / 1000);
        const cs = Math.floor((bestTimeMs % 1000) / 10);
        victoryTimeText.innerText = `Tiempo: ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(cs).padStart(2,'0')}`;

        const stats = BASE_STATS[selectedSkin] || BASE_STATS['Pachin poderoso.png'];
        if (victoryCharacterText) {
            victoryCharacterText.innerText = `Personaje: ${stats.label}`;
        }

        currentState = STATE_VICTORY;
        switchScreen(screens.victory);

        const vImg = document.getElementById('victory-player-img');
        if (vImg) vImg.src = 'Personajes/Jugadores/' + selectedSkin;

        if (jwtToken) {
            try {
                await fetch(API_URL + '/leaderboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwtToken },
                    body: JSON.stringify({ best_time_ms: bestTimeMs, skin: selectedSkin })
                });
            } catch (err) { console.error('Leaderboard save error:', err); }
        }
        return;
    }

    const xpGained = currentBattleEnemy.expYield;
    player.exp += xpGained;
    setBattleDialog(`¡Ganaste ${xpGained} puntos de experiencia!`);
    updateBattleHUD();
    spawnFloatingText(250, 400, `+${xpGained} EXP`, '#00d2ff');
    await wait(1500);

    if (player.exp >= player.maxExp) { levelUp(); await wait(2000); }

    // El jugador ya no se cura automáticamente al ganar
    enemies = enemies.filter(e => e !== currentBattleEnemy);
    currentBattleEnemy = null;

    if (audioManager) {
        audioManager.playBgm('dungeon');
    }

    switchScreen(screens.hud);
    currentState = STATE_PLAYING;
    updateMapHUDHealth();
}

function levelUp() {
    if (audioManager) audioManager.playLevelUp();
    player.level++;
    player.exp   -= player.maxExp;
    player.maxExp = Math.floor(player.maxExp * 1.5);
    player.maxHp += 10; player.hp = player.maxHp;
    player.atk   += 2;  player.magic += 2;
    updateBattleHUD();
    spawnParticles(300, 450, '#ffd700', 60);
    setBattleDialog(`¡NIVEL UP! Ahora eres Nivel ${player.level}. Salud restaurada.`);
}

// --- RESET SESSION (Security: cleans all game variables for fresh run) ---
function resetGameSession() {
    currentFloor  = 1;
    gameStartTime = 0;
    bestTimeMs    = 0;
    enemies       = [];
    particles     = [];
    floatingTexts = [];
    currentBattleEnemy = null;
    // Security: reset speed to x1 so damage/delay never desync next game
    battleSpeed = 1;
    btnFastForward.innerText = '⏩ x1';
    btnFastForward.classList.remove('ff-active');
    player = null;
    // jwtToken is kept (user stays logged in)
    showMainMenu();
}

// --- COLLISION (Security: separate X/Y axes prevent diagonal wall pass-through) ---
function checkWallCollision(px, py) {
    const m = 4; // margin so character doesn't hug wall exactly
    const corners = [
        { x: px + m,           y: py + m           },
        { x: px + TILE_SIZE-m, y: py + m           },
        { x: px + m,           y: py + TILE_SIZE-m },
        { x: px + TILE_SIZE-m, y: py + TILE_SIZE-m }
    ];
    for (const c of corners) {
        const col = Math.floor(c.x / TILE_SIZE);
        const row = Math.floor(c.y / TILE_SIZE);
        if (col >= 0 && col < COLS && row >= 0 && row < ROWS && map[row][col] === 1) return true;
    }
    return false;
}

function updatePlayerMovement(dt) {
    let dx = 0, dy = 0;
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;

        let speed = player.speed || MAX_PLAYER_SPEED;
        if (speed > MAX_PLAYER_SPEED) {
            console.warn('[Anti-Cheat] Speed anomaly detected. Resetting.');
            speed = MAX_PLAYER_SPEED;
            player.speed = MAX_PLAYER_SPEED;
        }

        const nextX = player.pixelX + dx * speed * dt;
        const nextY = player.pixelY + dy * speed * dt;

        if (!checkWallCollision(nextX, player.pixelY)) player.pixelX = nextX;
        if (!checkWallCollision(player.pixelX, nextY)) player.pixelY = nextY;

        player.pixelX = Math.max(0, Math.min(player.pixelX, (COLS-1)*TILE_SIZE));
        player.pixelY = Math.max(0, Math.min(player.pixelY, (ROWS-1)*TILE_SIZE));

        updateExploration();
    }
}

function checkEntityCollisions() {
    const pCX = player.pixelX + TILE_SIZE/2;
    const pCY = player.pixelY + TILE_SIZE/2;

    // Portal dinámico (buscar en mapa valor 2)
    let portalX = -1, portalY = -1;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 2) {
                portalX = x;
                portalY = y;
                break;
            }
        }
    }

    if (portalX !== -1) {
        const eCX = portalX * TILE_SIZE + TILE_SIZE/2;
        const eCY = portalY * TILE_SIZE + TILE_SIZE/2;
        if (Math.hypot(pCX-eCX, pCY-eCY) < TILE_SIZE/1.5) {
            if (currentFloor === 5) {
                initBattle({
                    name:'Fraction', hp:300, maxHp:300, atk:20, level:10, expYield:500,
                    sprite:images['Fraction.png'], color:'red',
                    moves:['Garrotazo','Juicio Estelar'], hitFlash:0, isBoss:true
                });
            } else {
                currentFloor++;
                initFloor();
            }
            return true;
        }
    }

    // Colisión con Cofres (curación / exp)
    for (let i = chests.length - 1; i >= 0; i--) {
        const c = chests[i];
        if (!c.opened && Math.hypot(pCX - (c.pixelX + TILE_SIZE/2), pCY - (c.pixelY + TILE_SIZE/2)) < TILE_SIZE/1.5) {
            c.opened = true;
            if (audioManager) audioManager.playCoin();
            if (c.type === 'heal') {
                const healAmt = 15;
                player.hp = Math.min(player.maxHp, player.hp + healAmt);
                spawnFloatingText(pCX, pCY - 20, `+${healAmt} HP`, '#00ff00');
                addHTMLHUDLog(`¡Abriste un cofre! Curado +${healAmt} HP.`);
            } else {
                const expAmt = 20;
                player.exp += expAmt;
                spawnFloatingText(pCX, pCY - 20, `+${expAmt} EXP`, '#00d2ff');
                addHTMLHUDLog(`¡Abriste un cofre! Ganaste +${expAmt} EXP.`);
                if (player.exp >= player.maxExp) {
                    levelUp();
                }
            }
            chests.splice(i, 1);
            updateMapHUDHealth();
            return true;
        }
    }

    // Trampas removidas

    // Enemigos (contacto = combate)
    for (const enemy of enemies) {
        if (Math.hypot(pCX - (enemy.pixelX+TILE_SIZE/2), pCY - (enemy.pixelY+TILE_SIZE/2)) < TILE_SIZE/1.5) {
            initBattle(enemy);
            return true;
        }
    }
    return false;
}

// --- ENEMY AGGRO AI (smooth pixel movement) ---
function updateEnemies(dt) {
    const pCX = player.pixelX + TILE_SIZE/2;
    const pCY = player.pixelY + TILE_SIZE/2;

    enemies.forEach(enemy => {
        const eCX = enemy.pixelX + TILE_SIZE/2;
        const eCY = enemy.pixelY + TILE_SIZE/2;
        const dx  = pCX - eCX;
        const dy  = pCY - eCY;
        const dist = Math.hypot(dx, dy);

        if (dist < AGGRO_RADIUS && dist > TILE_SIZE*0.5) {
            // Move smoothly towards player (separate axes for wall sliding)
            const nx = enemy.pixelX + (dx/dist) * ENEMY_SPEED * dt;
            const ny = enemy.pixelY + (dy/dist) * ENEMY_SPEED * dt;
            // Enemy uses same wall collision logic as player
            if (!checkWallCollision(nx, enemy.pixelY)) enemy.pixelX = nx;
            if (!checkWallCollision(enemy.pixelX, ny)) enemy.pixelY = ny;
        }
    });
}

// --- DRAW LIGHT AURA (canvas radial gradient around player with torch flicker) ---
function drawLightAura() {
    const pCX = player.pixelX + MAP_OFFSET_X + TILE_SIZE/2;
    const pCY = player.pixelY + MAP_OFFSET_Y + TILE_SIZE/2;

    const flicker = Math.sin(Date.now() / 150) * 12 + (Math.random() - 0.5) * 8;
    const innerRad = Math.max(20, TILE_SIZE * 1.5 + flicker);
    const outerRad = Math.max(100, TILE_SIZE * 5 + flicker * 2);

    const grad = ctx.createRadialGradient(pCX, pCY, innerRad, pCX, pCY, outerRad);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- DRAW MAP (no grid lines on floor tiles, fully visible) ---
function drawMap() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.strokeRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// --- DRAW MINIMAP (top right glassmorphic overlay for active radar exploration) ---
function drawMinimap() {
    if (!explored || !player) return;
    
    const size = 110;
    const padding = 10;
    const mmX = canvas.width - size - padding;
    const mmY = padding;
    
    ctx.save();
    
    ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mmX, mmY, size, size, 10);
    ctx.fill();
    ctx.stroke();
    
    const cellW = size / COLS;
    const cellH = size / ROWS;
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (explored[y][x]) {
                if (map[y][x] === 1) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.fillRect(mmX + x*cellW, mmY + y*cellH, cellW-0.5, cellH-0.5);
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                    ctx.fillRect(mmX + x*cellW, mmY + y*cellH, cellW-0.5, cellH-0.5);
                }
                
                if (map[y][x] === 2) {
                    ctx.fillStyle = '#00aaff';
                    ctx.fillRect(mmX + x*cellW, mmY + y*cellH, cellW, cellH);
                }
            }
        }
    }
    
    enemies.forEach(e => {
        const ex = Math.floor((e.pixelX + TILE_SIZE/2)/TILE_SIZE);
        const ey = Math.floor((e.pixelY + TILE_SIZE/2)/TILE_SIZE);
        if (explored[ey][ex]) {
            ctx.fillStyle = '#ff3366';
            ctx.beginPath();
            ctx.arc(mmX + ex*cellW + cellW/2, mmY + ey*cellH + cellH/2, cellW/2.5, 0, Math.PI*2);
            ctx.fill();
        }
    });

    chests.forEach(c => {
        const cx = Math.floor((c.pixelX + TILE_SIZE/2)/TILE_SIZE);
        const cy = Math.floor((c.pixelY + TILE_SIZE/2)/TILE_SIZE);
        if (explored[cy][cx] && !c.opened) {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(mmX + cx*cellW + 1, mmY + cy*cellH + 1, cellW - 2, cellH - 2);
        }
    });
    
    const pX = Math.floor((player.pixelX + TILE_SIZE/2) / TILE_SIZE);
    const pY = Math.floor((player.pixelY + TILE_SIZE/2) / TILE_SIZE);
    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(mmX + pX*cellW + cellW/2, mmY + pY*cellH + cellH/2, cellW/2.2, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
}

function updateAndDrawEffects(dt) {
    for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt;
        if (p.life <= 0) { particles.splice(i,1); continue; }
        ctx.fillStyle  = p.color;
        ctx.globalAlpha = p.life/p.maxLife;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    }
    for (let i = floatingTexts.length-1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy*dt; ft.life -= dt;
        if (ft.life <= 0) { floatingTexts.splice(i,1); continue; }
        ctx.globalAlpha = ft.life;
        ctx.fillStyle  = ft.color;
        ctx.font = "900 36px 'Outfit', sans-serif";
        ctx.textAlign  = 'center';
        ctx.shadowColor = 'black'; ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
}

// --- GAME LOOP ---
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (currentState === STATE_PLAYING || currentState === STATE_BATTLE) updateTimer();

    let offsetX = 0, offsetY = 0;
    if (screenShake > 0) {
        offsetX = (Math.random()-0.5)*screenShake;
        offsetY = (Math.random()-0.5)*screenShake;
        screenShake -= dt*100; if (screenShake < 0) screenShake = 0;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ---- MAIN MENU / LOADING ----
    if (currentState === STATE_MAINMENU || currentState === STATE_LOADING) {
        const bg = images['pueblo.png'];
        if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // ---- STORY ----
    } else if (currentState === STATE_INTRO) {
        const bg = currentStoryLine < 2 ? images['pueblo.png'] : images['cueva.png'];
        if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        if (isTyping) {
            storyCharIndex += dt * 60;
            const currentText = getCurrentStoryText(currentStoryLine);
            storyTextEl.innerText = currentText.substring(0, Math.floor(storyCharIndex));
            if (storyCharIndex >= 20) storyImgEl.style.opacity = Math.min(1, (storyCharIndex-20)/20);
            if (storyCharIndex >= currentText.length) { isTyping = false; storyImgEl.style.opacity = 1; }
        }

    // ---- BATTLE ----
    } else if (currentState === STATE_BATTLE) {
        let bg = images['mazmorra.png'];
        if (currentBattleEnemy && currentBattleEnemy.isBoss) {
            if (currentBattleEnemy.isPhase2) {
                bg = images['fase 2 fraction.png'] || bg;
            } else {
                bg = images['pelea fraction.png'] || bg;
            }
        }
        if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        battleTime += dt;
        if (player?.sprite) ctx.drawImage(player.sprite, 200, 150 + Math.sin(battleTime*3)*5, 350, 350);
        if (currentBattleEnemy?.sprite) {
            const img = currentBattleEnemy.sprite;
            const hOff = currentBattleEnemy.hitFlash > 0 ? (currentBattleEnemy.hitFlash--, (Math.random()-0.5)*20) : 0;
            if (hOff !== 0) ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
            
            if (img.width && img.height) {
                const maxSize = 350;
                const maxDim = Math.max(img.width, img.height);
                const scale = maxSize / maxDim;
                const drawW = img.width * scale;
                const drawH = img.height * scale;
                const drawX = 1000 + hOff + (maxSize - drawW) / 2;
                const drawY = 100 + (maxSize - drawH) + Math.sin(battleTime*2)*10;
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
                ctx.drawImage(img, 1000+hOff, 100 + Math.sin(battleTime*2)*10, 350, 350);
            }
            ctx.filter = 'none';
        }
        updateAndDrawEffects(dt);

    // ---- PLAYING / GAMEOVER ----
    } else if (currentState === STATE_PLAYING || currentState === STATE_GAMEOVER) {
        const bg = images['mazmorra.png'];
        if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(MAP_OFFSET_X, MAP_OFFSET_Y);
        drawMap();

        // Portal dinámico (siempre visible)
        let portalX = -1, portalY = -1;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (map[y][x] === 2) {
                    portalX = x;
                    portalY = y;
                    break;
                }
            }
        }
        if (portalX !== -1) {
            const exitX = portalX * TILE_SIZE, exitY = portalY * TILE_SIZE;
            ctx.save();
            const isBossFloor = currentFloor === 5;
            ctx.fillStyle   = isBossFloor ? 'rgba(255,0,0,0.4)'     : 'rgba(0,150,255,0.4)';
            ctx.shadowColor = isBossFloor ? '#ff0000'               : '#0096ff';
            ctx.shadowBlur  = (isBossFloor ? 20 : 15) + Math.sin(Date.now()/200)*8;
            ctx.beginPath();
            ctx.arc(exitX+TILE_SIZE/2, exitY+TILE_SIZE/2, TILE_SIZE/2.5, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Outfit';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10; ctx.shadowColor = '#000';
            ctx.fillText(isBossFloor ? 'JEFE' : 'BAJAR', exitX+TILE_SIZE/2, exitY+TILE_SIZE/2);
            ctx.restore();
        }

        // Dibujar Cofres (siempre visibles)
        chests.forEach(c => {
            const img = images['cofre.png'];
            if (img && img.width && img.height) {
                const maxDim = Math.max(img.width, img.height);
                const scale = TILE_SIZE / maxDim;
                const drawW = img.width * scale;
                const drawH = img.height * scale;
                const drawX = c.pixelX + (TILE_SIZE - drawW) / 2;
                const drawY = c.pixelY + (TILE_SIZE - drawH) / 2;
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
                ctx.save();
                ctx.fillStyle = '#8B4513'; // Saddle brown body
                ctx.fillRect(c.pixelX + 8, c.pixelY + 12, TILE_SIZE - 16, TILE_SIZE - 20);
                
                ctx.fillStyle = '#ffd700'; // Gold lid/details
                ctx.fillRect(c.pixelX + 8, c.pixelY + 12, TILE_SIZE - 16, 6);
                ctx.fillRect(c.pixelX + (TILE_SIZE/2) - 3, c.pixelY + 18, 6, 6);
                
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(c.pixelX + 8, c.pixelY + 12, TILE_SIZE - 16, TILE_SIZE - 20);
                ctx.restore();
            }
        });



        // Update logic (only in PLAYING, not GAMEOVER)
        if (currentState === STATE_PLAYING && player) {
            updatePlayerMovement(dt);
            if (!checkEntityCollisions()) updateEnemies(dt);
        }

        // Draw enemies with HP bar (siempre visibles)
        enemies.forEach(e => {
            if (e.sprite) ctx.drawImage(e.sprite, e.pixelX, e.pixelY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255,0,0,0.8)';
            ctx.fillRect(e.pixelX, e.pixelY-8, TILE_SIZE, 5);
            ctx.fillStyle = 'rgba(0,255,0,0.8)';
            ctx.fillRect(e.pixelX, e.pixelY-8, (e.hp/e.maxHp)*TILE_SIZE, 5);
        });

        // Draw player
        if (player?.sprite) ctx.drawImage(player.sprite, player.pixelX, player.pixelY, TILE_SIZE, TILE_SIZE);

        ctx.restore(); // undo MAP_OFFSET

        // ★ Light aura (drawn AFTER scene, BEFORE HUD overlay)
        if (currentState === STATE_PLAYING && player) {
            drawLightAura();
        }

        // HTML HUD manages the floor indicator now

        updateAndDrawEffects(dt);

    // ---- VICTORY / GAMEOVER overlays ----
    } else if (currentState === STATE_VICTORY) {
        const bg = images['pueblo.png'];
        if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
}

// --- PUBLIC LEADERBOARD on auth screen ---
async function fetchAndShowPublicLeaderboard() {
    const list = document.getElementById('public-leaderboard-list');
    if (!list) return;
    try {
        const res  = await fetch(API_URL + '/leaderboard');
        const data = await res.json();
        list.innerHTML = '';
        if (!data.length) {
            list.innerHTML = '<li style="color:#aaa;text-align:center;">No hay récords aún.</li>';
            return;
        }
        data.slice(0, 10).forEach((entry, i) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            if (i < 3) li.classList.add(`lb-top${i+1}`);
            const ms = entry.best_time_ms;
            const m  = Math.floor(ms/60000);
            const s  = Math.floor((ms%60000)/1000);
            const cs = Math.floor((ms%1000)/10);
            li.innerHTML = `
                <span class="lb-rank">#${i+1}</span>
                <img src="Personajes/Jugadores/${entry.skin || 'Pachin poderoso.png'}" class="lb-avatar" style="width:24px;height:24px;image-rendering:pixelated;vertical-align:middle;margin-right:8px;border-radius:4px;background:rgba(255,255,255,0.05);" />
                <span class="lb-user">${entry.username}</span>
                <span class="lb-time">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(cs).padStart(2,'0')}</span>
            `;
            list.appendChild(li);
        });
    } catch (_) {
        list.innerHTML = '<li style="color:#ff5555;text-align:center;">Error cargando leaderboard.</li>';
    }
}

// --- INIT ---
fetchAndShowPublicLeaderboard();
requestAnimationFrame(gameLoop); // Start loop for animated auth bg
// loadImages() is called after successful login
