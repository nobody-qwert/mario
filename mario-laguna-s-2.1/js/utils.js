/* ========================================
   Super Mario Bros. Web — Utilities
   ======================================== */

// Simple EventEmitter for decoupled communication
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
        return this;
    }

    emit(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(cb => cb(...args));
        return true;
    }
}

// Simple timer / stopwatch
export class Timer {
    constructor() {
        this.elapsed = 0;
        this.lastTime = 0;
    }

    update(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.elapsed += delta;
        return delta;
    }

    reset() {
        this.elapsed = 0;
        this.lastTime = 0;
    }
}

// Simple RNG
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

// Clamp a value
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Linear interpolation
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Simple easing functions
export const easing = {
    easeOutQuad: t => 1 - Math.pow(1 - t, 2),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
};

// Simple particle system
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    add(x, y, vx, vy, life, color, size = 4) {
        this.particles.push({ x, y, vx, vy, life, maxLife: life, color, size });
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.vy += 0.3;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt || 1;
        });
    }

    render(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    }
}