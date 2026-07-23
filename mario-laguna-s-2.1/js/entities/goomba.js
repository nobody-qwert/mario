/* ========================================
   Super Mario Bros. Web — Goomba Enemy Entity
   ======================================== */

import { PHYSICS, DIMENSIONS, COLORS, KEYS } from '../config.js';
import { resolveCollision } from '../physics.js';
import { soundManager } from '../sound.js';
import { SOUNDS } from '../config.js';
import { randomInt } from '../utils.js';

export class Goomba {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = DIMENSIONS.GOOMBA_WIDTH;
        this.height = DIMENSIONS.GOOMBA_HEIGHT;
        this.vx = -0.5;
        this.vy = 0;
        this.onGround = false;
        this.facing = -1;
        this.stomped = false;
        this.stompTimer = 0;
        this.animTime = 0;
        this.patrolLeft = x - 40;
        this.patrolRight = x + 40;
        this.dead = false;
    }

    update(dt) {
        if (this.stomped) {
            this.stompTimer -= dt || 1;
            if (this.stompTimer <= 0) {
                this.stompTimer = 0;
            }
            return;
        }

        if (this.dead) return;

        this.animTime += dt || 1;

        // Simple AI: walk back and forth
        if (this.facing === -1) {
            this.vx = -0.5;
            if (this.x <= this.patrolLeft) {
                this.facing = 1;
                this.vx = 0.5;
            }
        } else {
            this.vx = 0.5;
            if (this.x >= this.patrolRight) {
                this.facing = -1;
                this.vx = -0.5;
            }
        }

        // Apply gravity
        this.vy += PHYSICS.GRAVITY * (dt || 1);
        this.vy = Math.min(this.vy, PHYSICS.TERMINAL_VELOCITY);

        // Update position
        this.x += this.vx * (dt || 1);
        this.y += this.vy * (dt || 1);
    }

    handleCollisions(platforms) {
        if (this.stomped || this.dead) return;

        this.onGround = false;

        for (const platform of platforms) {
            const side = resolveCollision(this, platform);
            if (side) {
                switch (side) {
                    case 'bottom':
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.onGround = true;
                        break;
                    case 'top':
                        this.y = platform.y + platform.height;
                        this.vy = 0;
                        break;
                    case 'left':
                        this.x = platform.x - this.width;
                        this.vx = -0.5;
                        this.facing = -1;
                        break;
                    case 'right':
                        this.x = platform.x + platform.width;
                        this.vx = 0.5;
                        this.facing = 1;
                        break;
                }
            }
        }
    }

    stomp() {
        this.stomped = true;
        this.stompTimer = 30;
        this.vx = 0;
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const w = this.width;
        const h = this.height;

        if (this.stomped) {
            // Render flattened goomba
            ctx.fillStyle = COLORS.GOOMBA_DARK;
            ctx.fillRect(screenX, screenY + h / 2 - 8, w, 8);
            // Eyes (X marks)
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX + 4, screenY + h / 2 - 6, 3, 3);
            ctx.fillRect(screenX + 12, screenY + h / 2 - 6, 3, 3);
            return;
        }

        if (this.dead) return;

        // Body
        ctx.fillStyle = COLORS.GOOMBA_BROWN;
        ctx.fillRect(screenX, screenY, w, h);

        // Head (slightly narrower)
        ctx.fillStyle = COLORS.GOOMBA_BROWN;
        ctx.fillRect(screenX + 2, screenY - 8, w - 4, 10);

        // Eyes
        ctx.fillStyle = '#000';
        const eyeOffset = Math.floor(Math.sin(this.animTime * 0.3) * 1);
        ctx.fillRect(screenX + 6, screenY - 4, 4, 4);
        ctx.fillRect(screenX + 14, screenY - 4, 4, 4);

        // Eye whites
        ctx.fillStyle = '#FFF';
        ctx.fillRect(screenX + 7, screenY - 3, 2, 2);
        ctx.fillRect(screenX + 15, screenY - 3, 2, 2);

        // Mouth (small line)
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 8, screenY + 8, 6, 2);

        // Feet
        ctx.fillStyle = COLORS.GOOMBA_DARK;
        ctx.fillRect(screenX + 2, screenY + h - 4, 6, 4);
        ctx.fillRect(screenX + w - 8, screenY + h - 4, 6, 4);
    }
}