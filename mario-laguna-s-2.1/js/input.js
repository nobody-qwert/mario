/* ========================================
   Super Mario Bros. Web — Input Manager
   Handles keyboard input with responsive controls
   ======================================== */

import { KEYS } from './config.js';

export class InputManager {
    constructor() {
        this.keys = new Set();
        this.pressed = new Set();       // keys pressed this frame
        this.released = new Set();      // keys released this frame
        this.lastPressed = new Map();   // timestamp of last press
        this.enabled = true;
        this._boundKeyDown = this._handleKeyDown.bind(this);
        this._boundKeyUp = this._handleKeyUp.bind(this);
    }

    init() {
        window.addEventListener('keydown', this._boundKeyDown, { passive: false });
        window.addEventListener('keyup', this._boundKeyUp, { passive: false });
    }

    destroy() {
        window.removeEventListener('keydown', this._boundKeyDown);
        window.removeEventListener('keyup', this._boundKeyUp);
    }

    _handleKeyDown(event) {
        if (!this.enabled) return;
        const key = event.code;
        if (!this.keys.has(key)) {
            this.pressed.add(key);
            this.lastPressed.set(key, performance.now());
        }
        this.keys.add(key);
        // Prevent scrolling with arrow keys / space
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key) ||
            ['KeyW', 'KeyA', 'KeyD'].includes(key)) {
            event.preventDefault();
        }
    }

    _handleKeyUp(event) {
        const key = event.code;
        this.keys.delete(key);
        this.released.add(key);
    }

    // Check if a key is currently held down
    isDown(keyCode) {
        if (Array.isArray(keyCode)) {
            return keyCode.some(k => this.keys.has(k));
        }
        return this.keys.has(keyCode);
    }

    // Check if a key was just pressed this frame
    wasPressed(keyCode) {
        if (Array.isArray(keyCode)) {
            return keyCode.some(k => this.pressed.has(k));
        }
        return this.pressed.has(keyCode);
    }

    // Check if a key was just released this frame
    wasReleased(keyCode) {
        if (Array.isArray(keyCode)) {
            return keyCode.some(k => this.released.has(k));
        }
        return this.released.has(keyCode);
    }

    // Get how long a key has been held (ms)
    getHoldTime(keyCode) {
        const time = this.lastPressed.get(keyCode);
        if (!time) return 0;
        return performance.now() - time;
    }

    // Clear per-frame state (call at end of each frame)
    endFrame() {
        this.pressed.clear();
        this.released.clear();
    }

    // Enable/disable input
    setEnabled(value) {
        this.enabled = value;
        if (!value) {
            this.keys.clear();
            this.pressed.clear();
            this.released.clear();
        }
    }
}

// Singleton instance
export const inputManager = new InputManager();