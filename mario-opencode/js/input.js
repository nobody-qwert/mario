// Input handler - tracks key states for smooth input
class InputHandler {
    constructor() {
        this.keys = {};
        this._justPressedKeys = {};
        this._prevKeys = {};

        window.addEventListener('keydown', (e) => {
            // Prevent scrolling with game keys
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch controls for mobile
        this.touchControls = { left: false, right: false, jump: false };
        this._setupTouch();
    }

    _setupTouch() {
        const container = document.getElementById('game-container');

        // Create touch overlay buttons
        const btnStyle = `position: absolute; width: 60px; height: 60px; 
            background: rgba(255,255,255,0.3); border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; color: white; user-select: none; touch-action: none;`;

        const leftBtn = document.createElement('div');
        leftBtn.className = 'touch-control';
        leftBtn.style.cssText = `${btnStyle} bottom: 15px; left: 15px;`;
        leftBtn.textContent = '◀';
        leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchControls.left = true; });
        leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchControls.left = false; });
        leftBtn.addEventListener('touchcancel', (e) => { this.touchControls.left = false; });

        const rightBtn = document.createElement('div');
        rightBtn.className = 'touch-control';
        rightBtn.style.cssText = `${btnStyle} bottom: 15px; left: 90px;`;
        rightBtn.textContent = '▶';
        rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchControls.right = true; });
        rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchControls.right = false; });
        rightBtn.addEventListener('touchcancel', (e) => { this.touchControls.right = false; });

        const jumpBtn = document.createElement('div');
        jumpBtn.className = 'touch-control';
        jumpBtn.style.cssText = `${btnStyle} bottom: 15px; right: 15px;`;
        jumpBtn.textContent = '⬆';
        jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchControls.jump = true; });
        jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchControls.jump = false; });
        jumpBtn.addEventListener('touchcancel', (e) => { this.touchControls.jump = false; });

        container.appendChild(leftBtn);
        container.appendChild(rightBtn);
        container.appendChild(jumpBtn);
    }

    update() {
        // Track just-pressed keys
        for (const key in this.keys) {
            this._justPressedKeys[key] = this.keys[key] && !this._prevKeys[key];
            this._prevKeys[key] = this.keys[key];
        }
    }

    isDown(keyCode) {
        if (keyCode === 'Space') return !!this.keys['Space'] || this.touchControls.jump;
        if (keyCode === 'ArrowLeft' || keyCode === 'KeyA') return !!this.keys[keyCode] || this.touchControls.left;
        if (keyCode === 'ArrowRight' || keyCode === 'KeyD') return !!this.keys[keyCode] || this.touchControls.right;
        if (keyCode === 'ArrowUp' || keyCode === 'KeyW') return !!this.keys[keyCode] || this.touchControls.jump;
        return !!this.keys[keyCode];
    }

    justPressed(keyCode) {
        const touchKey = keyCode === 'Space' ? 'jump' : keyCode.toLowerCase();
        return (this._justPressedKeys[keyCode] || this.touchControls[touchKey]);
    }

    get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
    get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
    get jump() { return this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW'); }
    get jumpPressed() { return this.justPressed('Space') || this.justPressed('ArrowUp') || this.justPressed('KeyW'); }
}

export const input = new InputHandler();
