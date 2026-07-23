/* ========================================
   Super Mario Bros. Web — Mario Entity
   Handles Mario's movement, animation, and state
   ======================================== */

import { PHYSICS, DIMENSIONS, COLORS, KEYS } from '../config.js';
import { applyGravity, resolveCollision } from '../physics.js';
import { inputManager } from '../input.js';
import { soundManager } from '../sound.js';
import { SOUNDS } from '../config.js';
import { clamp } from '../utils.js';

export class Mario {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = DIMENSIONS.MARIO_WIDTH;
        this.height = DIMENSIONS.MARIO_HEIGHT;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1;
        this.state = 'idle';
        this.animTime = 0;
        this.jumpBoostTime = 0;
        this.maxJumps = 1;
        this.jumpsRemaining = 1;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.dead = false;
        this.deathTimer = 0;
        this.lastGroundY = y;
    }

    update(dt) {
        if (this.dead) {
            this.deathTimer -= dt || 1;
            if (this.deathTimer <= 0) {
                this.deathTimer = 0;
            }
            return;
        }

        const input = inputManager;
        const wasPressed = (k) => input.wasPressed(k);
        const isDown = (k) => input.isDown(k);

        const moveLeft = isDown([KEYS.LEFT, KEYS.A]);
        const moveRight = isDown([KEYS.RIGHT, KEYS.D]);
        const jumpPressed = wasPressed([KEYS.JUMP, KEYS.JUMP_ALT, KEYS.W]);

        if (jumpPressed) {
            this.jumpBufferTimer = 10;
        }
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= dt || 1;
            if (this.jumpBufferTimer < 0) this.jumpBufferTimer = 0;
        }

        if (this.onGround) {
            this.coyoteTimer = 8;
            this.jumpsRemaining = this.maxJumps;
        }
        if (this.coyoteTimer > 0) {
            this.coyoteTimer -= dt || 1;
            if (this.coyoteTimer < 0) this.coyoteTimer = 0;
        }

        if (this.jumpBufferTimer > 0 && (this.coyoteTimer > 0 || this.jumpsRemaining > 0)) {
            this.vy = PHYSICS.JUMP_FORCE;
            this.onGround = false;
            this.jumpsRemaining--;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this.jumpBoostTime = PHYSICS.JUMP_BOOST_DURATION;
            soundManager.play(SOUNDS.JUMP);
        }

        if (this.jumpBoostTime > 0 && isDown([KEYS.JUMP, KEYS.JUMP_ALT, KEYS.W])) {
            this.vy += PHYSICS.JUMP_BOOST_FORCE;
            this.jumpBoostTime -= dt || 1;
            if (this.jumpBoostTime < 0) this.jumpBoostTime = 0;
        }

        if (moveLeft) {
            this.facing = -1;
            this.vx -= PHYSICS.ACCELERATION * (dt || 1);
            if (this.onGround) {
                this.state = 'walking';
            }
            this.animTime += dt || 1;
        } else if (moveRight) {
            this.facing = 1;
            this.vx += PHYSICS.ACCELERATION * (dt || 1);
            if (this.onGround) {
                this.state = 'walking';
            }
            this.animTime += dt || 1;
        } else {
            if (this.onGround) {
                this.state = 'idle';
            }
            if (this.vx > 0) {
                this.vx -= PHYSICS.DECELERATION * (dt || 1);
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += PHYSICS.DECELERATION * (dt || 1);
                if (this.vx > 0) this.vx = 0;
            }
            this.animTime = 0;
        }

        const maxSpeed = this.onGround ? PHYSICS.RUN_SPEED : PHYSICS.WALK_SPEED;
        this.vx = clamp(this.vx, -maxSpeed, maxSpeed);

        applyGravity(this, dt || 1);

        if (this.vy > 0 && !this.onGround) {
            this.state = 'falling';
        } else if (this.vy < 0) {
            this.state = 'jumping';
        }

        if (this.invincible) {
            this.invincibleTimer -= dt || 1;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        this.x += this.vx * (dt || 1);
        this.y += this.vy * (dt || 1);

        if (this.x < -50) this.x = -50;
        if (this.x > 10000) this.x = 10000;
        if (this.y < -50) { this.y = -50; this.vy = 0; }
    }

    handleCollisions(platforms) {
        if (this.dead) return;

        this.onGround = false;

        for (const platform of platforms) {
            const side = resolveCollision(this, platform);
            if (side) {
                switch (side) {
                    case 'bottom':
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.onGround = true;
                        this.lastGroundY = this.y;
                        break;
                    case 'top':
                        this.y = platform.y + platform.height;
                        this.vy = 0;
                        break;
                    case 'left':
                        this.x = platform.x - this.width;
                        this.vx = 0;
                        break;
                    case 'right':
                        this.x = platform.x + platform.width;
                        this.vx = 0;
                        break;
                }
            }
        }
    }

    handleEnemyCollision(enemy) {
        if (this.dead || this.invincible) return false;

        const side = resolveCollision(this, enemy);
        if (side === 'bottom' && this.vy > PHYSICS.BOUNCE_THRESHOLD) {
            this.vy = PHYSICS.JUMP_FORCE * 0.7;
            enemy.stomp();
            soundManager.play(SOUNDS.STOMP);
            return true;
        } else if (side) {
            if (!this.invincible) {
                this.die();
                return true;
            }
        }
        return false;
    }

    die() {
        this.dead = true;
        this.deathTimer = 60;
        this.vy = -8;
        this.vx = 0;
        soundManager.play(SOUNDS.DEATH);
    }

    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.dead = false;
        this.deathTimer = 0;
        this.state = 'idle';
        this.animTime = 0;
        this.facing = 1;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.jumpsRemaining = this.maxJumps;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const w = this.width;
        const h = this.height;
        const f = this.facing;

        if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            return;
        }

        if (this.dead) {
            this._renderDead(ctx, screenX, screenY, w, h);
            return;
        }

        const bodyY = screenY + 8;
        const bodyHeight = h - 16;

        // --- Head ---
        ctx.fillStyle = COLORS.MARIO_SKIN;
        ctx.fillRect(screenX + 6, bodyY - 14, 20, 16);
        // Hat brim
        ctx.fillStyle = COLORS.MARIO_BLUE;
        ctx.fillRect(screenX + 4, bodyY - 16, 24, 6);
        // Eyes
        ctx.fillStyle = '#000';
        const eyeX = screenX + 10 + (f > 0 ? 0 : 12);
        ctx.fillRect(eyeX, bodyY - 10, 3, 3);
        ctx.fillRect(eyeX + 8, bodyY - 10, 3, 3);
        // Nose
        ctx.fillStyle = COLORS.MARIO_SKIN;
        ctx.fillRect(screenX + 14, bodyY - 6, 4, 4);
        // Mouth
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(screenX + 12, bodyY - 2, 8, 3);

        // --- Torso ---
        ctx.fillStyle = COLORS.MARIO_RED;
        ctx.fillRect(screenX + 6, bodyY, 20, 18);
        // Overalls
        ctx.fillStyle = COLORS.MARIO_BLUE;
        ctx.fillRect(screenX + 4, bodyY + 4, 8, 8);
        ctx.fillRect(screenX + 20, bodyY + 4, 8, 8);
        // Buttons
        ctx.fillStyle = '#0000CC';
        ctx.fillRect(screenX + 7, bodyY + 7, 3, 3);
        ctx.fillRect(screenX + 21, bodyY + 7, 3, 3);

        // --- Arms ---
        const armY = bodyY + 8;
        const armSwing = Math.sin(this.animTime * 0.5) * 3;
        ctx.fillStyle = COLORS.MARIO_SKIN;
        if (this.state === 'walking') {
            ctx.fillRect(screenX + 4 - f * 2, armY - armSwing, 6, 4);
            ctx.fillRect(screenX + 22 + f * 2, armY + armSwing, 6, 4);
        } else {
            ctx.fillRect(screenX + 4, armY - 2, 6, 4);
            ctx.fillRect(screenX + 22, armY - 2, 6, 4);
        }

        // --- Legs (animated when walking) ---
        this._renderLegs(ctx, screenX, bodyY, h);
    }

    _renderDead(ctx, x, y, w, h) {
        const bodyY = y + 8;
        // Head
        ctx.fillStyle = COLORS.MARIO_SKIN;
        ctx.fillRect(x + 6, bodyY - 14, 20, 16);
        ctx.fillStyle = COLORS.MARIO_BLUE;
        ctx.fillRect(x + 4, bodyY - 16, 24, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 10, bodyY - 10, 3, 3);
        ctx.fillRect(x + 20, bodyY - 10, 3, 3);
        // Body (falling)
        ctx.fillStyle = COLORS.MARIO_RED;
        ctx.fillRect(x + 6, bodyY, 20, 18);
        ctx.fillStyle = COLORS.MARIO_BLUE;
        ctx.fillRect(x + 4, bodyY + 4, 8, 8);
        ctx.fillRect(x + 20, bodyY + 4, 8, 8);
        ctx.fillStyle = COLORS.MARIO_SKIN;
        ctx.fillRect(x + 4, bodyY - 2, 6, 4);
        ctx.fillRect(x + 22, bodyY - 2, 6, 4);
        // Legs
        ctx.fillStyle = COLORS.MARIO_BLUE;
        ctx.fillRect(x + 8, bodyY + 22, 6, h - 30);
        ctx.fillRect(x + 18, bodyY + 22, 6, h - 30);
    }

    _renderLegs(ctx, screenX, bodyY, h) {
        const legY = bodyY + 22;
        const legHeight = h - 30;
        const legW = 6;

        if (this.state === 'walking') {
            const swing = Math.sin(this.animTime * 0.5) * 3;
            const swing2 = Math.sin(this.animTime * 0.5 + Math.PI) * 3;
            ctx.fillStyle = COLORS.MARIO_BLUE;
            ctx.fillRect(screenX + 8, legY + swing, legW, legHeight);
            ctx.fillRect(screenX + 18, legY + swing2, legW, legHeight);
            ctx.fillStyle = COLORS.MARIO_SKIN;
            ctx.fillRect(screenX + 8, legY + swing + legHeight - 2, legW, 2);
            ctx.fillRect(screenX + 18, legY + swing2 + legHeight - 2, legW, 2);
        } else {
            ctx.fillStyle = COLORS.MARIO_BLUE;
            ctx.fillRect(screenX + 8, legY, legW, legHeight);
            ctx.fillRect(screenX + 18, legY, legW, legHeight);
            ctx.fillStyle = COLORS.MARIO_SKIN;
            ctx.fillRect(screenX + 8, legY + legHeight - 2, legW, 2);
            ctx.fillRect(screenX + 18, legY + legHeight - 2, legW, 2);
        }
    }
}