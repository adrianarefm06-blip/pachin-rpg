// ============================================================
// PACHIN v2.2 — Web Audio API Retro Synthesizer
// Genera BGM chiptune en bucle y efectos de sonido en tiempo real
// ============================================================

class RetroAudioManager {
    constructor() {
        this.ctx = null;
        this.currentBgm = null;
        this.sequencerInterval = null;
        this.bpm = 120;
        this.volume = 0.15; // Volumen general moderado
        this.bgmVolumeNode = null;
        
        // Melodías predefinidas (Notas en formato [nota, duración_en_semicorcheas])
        // Silencio se denota como null
        this.bgmTracks = {
            menu: {
                bpm: 110,
                scale: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
                notes: [
                    'E4', 2, 'G4', 2, 'C5', 4, 'A4', 2, 'G4', 2, 'E4', 4,
                    'D4', 2, 'E4', 2, 'G4', 4, 'A4', 4, 'G4', 4,
                    'E4', 2, 'G4', 2, 'C5', 4, 'D5', 2, 'C5', 2, 'A4', 4,
                    'G4', 4, 'E4', 4, 'D4', 4, 'C4', 4
                ]
            },
            dungeon: {
                bpm: 85,
                scale: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G#4'],
                notes: [
                    'A3', 4, 'E4', 4, 'C4', 4, 'B3', 4,
                    'F4', 4, 'E4', 4, 'D4', 4, 'G#3', 4,
                    'A3', 4, 'C4', 4, 'E4', 4, 'D4', 4,
                    'C4', 2, 'B3', 2, 'A3', 4, 'E3', 4, 'A3', 4
                ]
            },
            battle: {
                bpm: 135,
                scale: ['D4', 'E4', 'F4', 'G4', 'A4', 'A#4', 'C#5'],
                notes: [
                    'D4', 2, 'D4', 2, 'A4', 2, 'G4', 2, 'F4', 2, 'E4', 2, 'D4', 4,
                    'F4', 2, 'F4', 2, 'A#4', 2, 'A4', 2, 'G4', 2, 'F4', 2, 'E4', 4,
                    'A4', 2, 'G4', 2, 'F4', 2, 'E4', 2, 'D4', 2, 'C#4', 2, 'D4', 4,
                    'E4', 2, 'F4', 2, 'G4', 2, 'A4', 2, 'C#5', 4, 'D5', 4
                ]
            },
            boss: {
                bpm: 150,
                scale: ['E4', 'F4', 'G#4', 'A4', 'B4', 'C5', 'D#5'],
                notes: [
                    'E4', 2, 'F4', 2, 'E4', 2, 'G#4', 2, 'E4', 2, 'A4', 2, 'E4', 2, 'B4', 2,
                    'C5', 2, 'B4', 2, 'C5', 2, 'D#5', 2, 'B4', 4, 'G#4', 4,
                    'A4', 2, 'A4', 2, 'E4', 2, 'F4', 2, 'G#4', 2, 'G#4', 2, 'E4', 2, 'D#4', 2,
                    'E4', 4, 'B4', 4, 'E5', 4, null, 4
                ]
            }
        };

        // Mapeo de frecuencias de notas
        this.noteFreqs = {
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
        };
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            // Nodo de volumen BGM
            this.bgmVolumeNode = this.ctx.createGain();
            this.bgmVolumeNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.bgmVolumeNode.connect(this.ctx.destination);
            
            console.log('AudioContext inicializado correctamente.');
        } catch (e) {
            console.warn('La API de Web Audio no está soportada o está bloqueada.', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- BGM PLAYER (Música en bucle sintetizada mediante osciladores) ---
    playBgm(trackName) {
        this.init();
        this.resume();
        if (!this.ctx) return;

        if (this.currentBgm === trackName) return; // Ya está sonando

        this.stopBgm();
        this.currentBgm = trackName;
        
        const track = this.bgmTracks[trackName];
        if (!track) return;

        let noteIndex = 0;
        const speed = (60 / track.bpm) / 4; // Duración de una semicorchea en segundos

        this.sequencerInterval = setInterval(() => {
            if (this.ctx.state === 'suspended') return;
            
            const currentNote = track.notes[noteIndex];
            const nextNote = track.notes[(noteIndex + 1) % track.notes.length];
            
            if (currentNote !== null) {
                // Synthesize the note
                const osc = this.ctx.createOscillator();
                const gainNode = this.ctx.createGain();
                
                // Configurar oscilador retro (onda triangular para bajos de mazmorra, cuadrada para acción)
                osc.type = (trackName === 'dungeon') ? 'triangle' : 'square';
                osc.frequency.setValueAtTime(this.noteFreqs[currentNote] || 440, this.ctx.currentTime);
                
                // Envolvente de volumen (ataque corto, decaimiento suave)
                gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + speed * 1.8);
                
                osc.connect(gainNode);
                gainNode.connect(this.bgmVolumeNode);
                
                osc.start(this.ctx.currentTime);
                osc.stop(this.ctx.currentTime + speed * 1.9);
            }
            
            noteIndex = (noteIndex + 1) % track.notes.length;
        }, speed * 1000);
    }

    stopBgm() {
        if (this.sequencerInterval) {
            clearInterval(this.sequencerInterval);
            this.sequencerInterval = null;
        }
        this.currentBgm = null;
    }

    // --- SFX GENERATION (Osciladores + Moduladores de Ruido) ---
    
    // ⚔️ Golpe físico (impacto ruidoso)
    playHit() {
        this.resume();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        // Caída rápida de tono (pitch drop)
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    // ✨ Hechizo Mágico (Arpegio supersónico ascendente)
    playMagic() {
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.25);

        // Añadir una modulación sutil para sonido mágico (LFO de vibrato)
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 25; // 25Hz
        lfoGain.gain.value = 40; // Oscilación de frecuencia
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        lfo.start(now);
        osc.start(now);
        
        lfo.stop(now + 0.26);
        osc.stop(now + 0.26);
    }

    // 💖 Curación (Arpegio ascendente suave armónico)
    playHeal() {
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // Arpegio de Do Mayor
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const noteStart = now + idx * 0.05;
            
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);
            
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            osc.start(noteStart);
            osc.stop(noteStart + 0.28);
        });
    }

    // 💰 Moneda / Cofre (Dos tonos metálicos agudos)
    playCoin() {
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Tono 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // Si5
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.09);

        // Tono 2 (empieza un poco después y más agudo)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, now + 0.07); // Mi6
        gain2.gain.setValueAtTime(0.2, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.32);
    }

    // 🕸️ Activación de Trampa (Ruido explosivo agudo y metálico)
    playTrap() {
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);

        gainNode.gain.setValueAtTime(0.35, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    // 🏆 Subir de Nivel (Fanfarria triunfal corta)
    playLevelUp() {
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Do4, Mi4, Sol4, Do5, Mi5, Sol5 (escala triunfal rápida)
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;
            
            const noteStart = now + idx * 0.07;
            const isLast = idx === notes.length - 1;
            const duration = isLast ? 0.6 : 0.15;
            
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);
            
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            osc.start(noteStart);
            osc.stop(noteStart + duration + 0.05);
        });
    }
}

// Inicializar de manera global
const audioManager = new RetroAudioManager();

// Escuchar interacciones para desbloquear el AudioContext de forma transparente
window.addEventListener('click', () => {
    audioManager.init();
    audioManager.resume();
});
window.addEventListener('keydown', () => {
    audioManager.init();
    audioManager.resume();
});
