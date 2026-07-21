// Audio module - retro sound effects via Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not supported');
            this.enabled = false;
        }
    }

    play(type, duration = 0.15) {
        if (!this.enabled || !this.ctx) return;

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;

        switch(type) {
            case 'jump': this._playJump(now); break;
            case 'coin': this._playCoin(now); break;
            case 'stomp': this._playStomp(now); break;
            case 'die': this._playDie(now); break;
            case 'powerup': this._playPowerUp(now); break;
            case 'bump': this._playBump(now); break;
            case 'flagpole': this._playFlagPole(now); break;
            case 'gameover': this._playGameOver(now); break;
            case 'win': this._playWin(now); break;
            case 'kick': this._playKick(now); break;
        }
    }

    _createOscillator(freq, type = 'square', startTime, dur, volume = 0.15) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + dur);
        return { osc, gain };
    }

    _playJump(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, time);
        osc.frequency.linearRampToValueAtTime(600, time + 0.12);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    _playCoin(time) {
        this._createOscillator(988, 'square', time, 0.06, 0.1);
        setTimeout(() => {
            if (this.ctx && this.ctx.state !== 'closed') {
                this._createOscillator(1319, 'square', this.ctx.currentTime, 0.25, 0.1);
            }
        }, 70);
    }

    _playStomp(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, time);
        osc.frequency.linearRampToValueAtTime(150, time + 0.1);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.12);
    }

    _playDie(time) {
        const notes = [523, 494, 466, 440, 370];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                if (this.ctx && this.ctx.state !== 'closed') {
                    this._createOscillator(freq, 'square', this.ctx.currentTime, 0.15, 0.12);
                }
            }, i * 130);
        });
    }

    _playPowerUp(time) {
        const notes = [392, 440, 494, 523, 587, 659, 698, 784];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                if (this.ctx && this.ctx.state !== 'closed') {
                    this._createOscillator(freq, 'square', this.ctx.currentTime, 0.12, 0.1);
                }
            }, i * 70);
        });
    }

    _playBump(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.linearRampToValueAtTime(100, time + 0.08);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
    }

    _playFlagPole(time) {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                if (this.ctx && this.ctx.state !== 'closed') {
                    this._createOscillator(freq, 'square', this.ctx.currentTime, 0.2, 0.12);
                }
            }, i * 150);
        });
    }

    _playGameOver(time) {
        const notes = [392, 370, 349, 330, 262, 220];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                if (this.ctx && this.ctx.state !== 'closed') {
                    this._createOscillator(freq, 'square', this.ctx.currentTime, 0.35, 0.12);
                }
            }, i * 280);
        });
    }

    _playWin(time) {
        const melody = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                if (this.ctx && this.ctx.state !== 'closed') {
                    this._createOscillator(freq, 'square', this.ctx.currentTime, 0.2, 0.13);
                }
            }, i * 140);
        });
    }

    _playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.linearRampToValueAtTime(40, time + 0.2);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    stop() {
        if (this.ctx) {
            this.ctx.close();
            this.initialized = false;
        }
    }
}

export const audioManager = new AudioManager();
