/* ========================================
   Super Mario Bros. Web — Sound System
   Uses Web Audio API for synthesized sound effects
   No external audio files needed — works on GitHub Pages
   ======================================== */

import { SOUNDS } from './config.js';

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
        this.sounds = new Map();
    }

    // Initialize the audio context (must be called after user interaction)
    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
            this.initialized = true;
            this._generateAllSounds();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.initialized = false;
        }
    }

    // Generate all sound effects programmatically
    _generateAllSounds() {
        const ctx = this.audioContext;
        if (!ctx) return;

        // Jump sound: short upward chirp
        this.sounds.set(SOUNDS.JUMP, () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        });

        // Coin sound: pleasant blip
        this.sounds.set(SOUNDS.COIN, () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        });

        // Stomp sound: short low thud
        this.sounds.set(SOUNDS.STOMP, () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        });

        // Death sound: descending tone
        this.sounds.set(SOUNDS.DEATH, () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.0);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1.0);
        });

        // Level complete: ascending arpeggio
        this.sounds.set(SOUNDS.LEVEL_COMPLETE, () => {
            const now = ctx.currentTime;
            const notes = [523, 659, 784, 1047]; // C E G C
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.15);
                gain.gain.setValueAtTime(0.2, now + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.3);
            });
        });

        // Pipe sound: sliding down
        this.sounds.set(SOUNDS.PIPE, () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        });

        // Power-up sound: ascending blip
        this.sounds.set(SOUNDS.POWERUP, () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        });
    }

    // Play a sound effect
    play(soundName) {
        if (!this.initialized) return;
        const sound = this.sounds.get(soundName);
        if (sound) sound();
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.initialized = false;
    }
}

// Singleton instance
export const soundManager = new SoundManager();