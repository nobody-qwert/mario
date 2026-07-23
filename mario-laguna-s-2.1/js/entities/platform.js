/* ========================================
   Super Mario Bros. Web — Platform Entity
   ======================================== */

import { DIMENSIONS, COLORS } from '../config.js';

export class Platform {
    constructor(x, y, width, height, type = 'ground') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.solid = type !== 'cloud';
        this.broken = false;
        this.breakTimer = 0;
        this.bounce = 0;
    }

    update(dt) {
        if (this.broken) {
            this.breakTimer -= dt || 1;
            if (this.breakTimer <= 0) {
                this.breakTimer = 0;
            }
        }
        if (this.bounce > 0) {
            this.bounce -= 0.05;
            if (this.bounce < 0) this.bounce = 0;
        }
    }

    break() {
        this.broken = true;
        this.breakTimer = 30;
    }

    render(ctx, cameraX, cameraY) {
        if (this.broken && this.breakTimer > 0) {
            const alpha = this.breakTimer / 30;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.BRICK;
            ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
            ctx.globalAlpha = 1;
            return;
        }

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const w = this.width;
        const h = this.height;

        switch (this.type) {
            case 'ground':
                ctx.fillStyle = COLORS.GRASS;
                ctx.fillRect(screenX, screenY, w, h);
                ctx.fillStyle = COLORS.DIRT;
                ctx.fillRect(screenX, screenY + h - 8, w, 8);
                for (let i = 0; i < Math.floor(w / 8); i++) {
                    ctx.fillStyle = COLORS.GRASS;
                    ctx.fillRect(screenX + i * 8, screenY, 8, 4);
                }
                break;

            case 'platform':
                ctx.fillStyle = COLORS.BRICK;
                ctx.fillRect(screenX, screenY, w, h);
                ctx.strokeStyle = COLORS.DIRT;
                ctx.lineWidth = 1;
                for (let i = 0; i < Math.floor(w / 8); i++) {
                    ctx.beginPath();
                    ctx.moveTo(screenX + i * 8 + 4, screenY);
                    ctx.lineTo(screenX + i * 8 + 4, screenY + h);
                    ctx.stroke();
                }
                ctx.strokeStyle = COLORS.GRASS;
                ctx.beginPath();
                ctx.rect(screenX, screenY, w, h);
                ctx.stroke();
                break;

            case 'brick':
                ctx.fillStyle = COLORS.BRICK;
                ctx.fillRect(screenX, screenY, w, h);
                ctx.strokeStyle = COLORS.DIRT;
                ctx.lineWidth = 1;
                const halfW = w / 2;
                const halfH = h / 2;
                ctx.beginPath();
                ctx.moveTo(screenX + halfW, screenY);
                ctx.lineTo(screenX + halfW, screenY + h);
                ctx.moveTo(screenX, screenY + halfH);
                ctx.lineTo(screenX + w, screenY + halfH);
                ctx.stroke();
                break;

            case 'pipe':
                ctx.fillStyle = COLORS.PIPE_GREEN;
                ctx.fillRect(screenX, screenY, w, h);
                ctx.fillStyle = COLORS.PIPE_DARK;
                ctx.fillRect(screenX, screenY, w, 6);
                ctx.fillRect(screenX, screenY + h - 6, w, 6);
                ctx.fillRect(screenX, screenY, 6, h);
                ctx.fillRect(screenX + w - 6, screenY, 6, h);
                break;

            case 'cloud':
                ctx.strokeStyle = COLORS.CLOUD;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.rect(screenX, screenY, w, h);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
        }
    }
}

// Coin collectible (emoji artifact)
export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = DIMENSIONS.COIN_SIZE;
        this.height = DIMENSIONS.COIN_SIZE;
        this.collected = false;
        this.animTime = 0;
        this.value = 1;
    }

    update(dt) {
        this.animTime += dt || 1;
    }

    render(ctx, cameraX, cameraY) {
        if (this.collected) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const bounce = Math.sin(this.animTime * 0.3) * 3;
        const spin = Math.cos(this.animTime * 0.3) * 0.2 + 0.8;

        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2 + bounce);
        ctx.scale(spin, spin);
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪙', -this.width / 2, -this.height / 2);
        ctx.restore();
    }
}

// Star power-up (emoji artifact)
export class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = DIMENSIONS.COIN_SIZE;
        this.height = DIMENSIONS.COIN_SIZE;
        this.collected = false;
        this.animTime = 0;
        this.vx = 0.5;
        this.vy = 0;
        this.bobTimer = 0;
    }

    update(dt) {
        this.animTime += dt || 1;
        this.bobTimer += dt || 1;
        this.vy += 0.3;
        this.y += this.vy;
        this.x += this.vx;
        if (this.y > 600) {
            this.y = 600 - this.height;
            this.vy = -8;
        }
    }

    render(ctx, cameraX, cameraY) {
        if (this.collected) return;

        const spin = Math.cos(this.animTime * 0.3) * 0.2 + 0.8;
        const bob = Math.sin(this.bobTimer * 0.1) * 5;

        ctx.save();
        ctx.translate(this.x - cameraX + this.width / 2, this.y - cameraY + this.height / 2 + bob);
        ctx.scale(spin, spin);
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', -this.width / 2, -this.height / 2);
        ctx.restore();
    }
}

// Flagpole (level end)
export class Flag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = DIMENSIONS.FLAG_WIDTH;
        this.height = DIMENSIONS.FLAG_HEIGHT;
        this.reached = false;
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX, screenY, 6, this.height);
        // Pole details
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < this.height; i += 10) {
            ctx.fillRect(screenX - 1, screenY + i, 8, 2);
        }

        // Flag
        const flagY = screenY + 20;
        ctx.fillStyle = COLORS.FLAG_RED;
        ctx.beginPath();
        ctx.moveTo(screenX + 6, flagY);
        ctx.lineTo(screenX + 6, flagY + 30);
        ctx.lineTo(screenX + 36, flagY + 20);
        ctx.lineTo(screenX + 36, flagY + 10);
        ctx.closePath();
        ctx.fill();

        // Flag details
        ctx.fillStyle = COLORS.FLAG_WHITE;
        ctx.fillRect(screenX + 10, flagY + 5, 18, 4);
        ctx.fillRect(screenX + 10, flagY + 15, 18, 4);
    }
}