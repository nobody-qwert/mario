import { input } from './input.js';
import { audioManager } from './audio.js';
import { Collision } from './collision.js';

// Entity base class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
        this.removed = false;
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    get bottom() { return this.y + this.height; }
    get right() { return this.x + this.width; }

    update(dt, levels) {}
    render(ctx, cameraX) {}
}

// Player class - Mario with animated sprite
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 28, 36);
        // Tighter collision hitbox (smaller than visual sprite)
        this.hitboxPadding = { left: 5, right: 5, top: 4, bottom: 4 };
        this.speed = 225;
        this.jumpForce = -649;
        this.gravity = 1350;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.facing = 1; // 1=right, -1=left
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.invincible = 0;
        this.dead = false;
        this.deathTimer = 0;
        this.winAnim = false;
        this.winTimer = 0;

        // Leg animation frames: { leftOffset, rightOffset }
        this.legFrames = [
            { left: -4, right: 0 },   // standing still
            { left: -5, right: 4 },   // walk frame 1
            { left: 4, right: -5 },   // walk frame 2
            { left: -3, right: 3 },   // jump tuck pose
        ];

        this.currentLegFrame = 0;
    }

    update(dt, levels) {
        if (this.dead) {
            // Death animation: fly up then fall down
            this.deathTimer += dt;
            this.vy += this.gravity * dt;
            this.y += this.vy * dt;
            return;
        }

        if (this.winAnim) {
            this.winTimer += dt;
            // Victory spin animation
            return;
        }

        // Invincibility frames countdown
        if (this.invincible > 0) {
            this.invincible -= dt;
        }

        // --- Horizontal movement with acceleration ---
        const accel = this.grounded ? 1550 : 950;
        const decel = this.grounded ? 1900 : 500;
        const maxSpeed = this.speed;

        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.vx -= accel * dt;
            this.facing = -1;
        } else if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.vx += accel * dt;
            this.facing = 1;
        } else {
            // Friction when no input
            if (this.vx > 0) {
                this.vx -= decel * dt;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += decel * dt;
                if (this.vx > 0) this.vx = 0;
            }
        }

        // Clamp speed
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        // --- Walking animation timing ---
        if (Math.abs(this.vx) > 15 && this.grounded) {
            this.walkTimer += dt;
            const walkCycle = 0.12;
            if (this.walkTimer >= walkCycle) {
                this.walkTimer -= walkCycle;
                // Cycle through frames: 0=stand, 1&2=walk left/right
                this.currentLegFrame = (this.currentLegFrame % 2 === 0) ? 1 : 2;
            }
        } else if (!this.grounded) {
            this.currentLegFrame = 3; // jump tuck
        } else {
            this.walkTimer = 0;
            this.currentLegFrame = 0; // standing still
        }

        // --- Jumping: input buffering + coyote time keep controls responsive ---
        this.coyoteTimer = this.grounded ? 0.1 : Math.max(0, this.coyoteTimer - dt);
        if (input.jumpPressed) this.jumpBufferTimer = 0.12;
        else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

        if (this.jumpBufferTimer > 0 && (this.grounded || this.coyoteTimer > 0)) {
            this.vy = this.jumpForce;
            this.grounded = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            audioManager.play('jump');
        }

        // Variable jump height: release space early for shorter jumps
        if (!(input.isDown('Space') || input.isDown('ArrowUp') || input.isDown('KeyW')) && this.vy < -120) {
            this.vy *= Math.pow(0.70, dt * 60);
        }

        // --- Apply gravity ---
        this.vy += this.gravity * dt;
        this.vy = Math.min(this.vy, 720); // terminal velocity cap

        // --- Move & resolve collisions ---
        
        // Horizontal movement + collision
        this.x += this.vx * dt;
        this._resolveCollisionsH(levels.solidBlocks);

        // Vertical movement + collision
        this.y += this.vy * dt;
        this.grounded = false;
        this._resolveCollisionsV(levels.solidBlocks);

        // Keep player from going left of screen start
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }

        // Fall into pit = death
        if (this.y > 600) {
            this.die();
        }
    }

    _resolveCollisionsH(blocks) {
        for (let b of blocks) {
            if (b.type === 'pole' || b.type === 'pipe') continue;
            
            if (this.x < b.x + b.w && this.x + this.width > b.x &&
                this.y < b.y + b.h && this.y + this.height > b.y) {
                
                if (this.vx > 0) {
                    // Moving right, hit left side of block
                    this.x = b.x - this.width;
                } else if (this.vx < 0) {
                    // Moving left, hit right side of block
                    this.x = b.x + b.w;
                }
                this.vx = 0;
            }
        }
    }

    _resolveCollisionsV(blocks) {
        for (let b of blocks) {
            if (b.type === 'pole' || b.type === 'pipe') continue;
            
            if (this.x < b.x + b.w && this.x + this.width > b.x &&
                this.y < b.y + b.h && this.y + this.height > b.y) {
                
                const overlapTop = (this.y + this.height) - b.y;
                const overlapBottom = (b.y + b.h) - this.y;

                if (overlapTop < overlapBottom && this.vy >= 0) {
                    // Landing on top of block
                    this.y = b.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    
                    // Hit question block from below? No, we're landing ON it.
                } else if (overlapBottom < overlapTop && this.vy < 0) {
                    // Hitting bottom of block from underneath
                    this.y = b.y + b.h;
                    this.vy = 0;
                    
                    // Question block: spawn coin if not already hit
                    if (b.type === 'question' && !b.hit) {
                        b.hit = true;
                    } else if (b.type === 'brick') {
                        // Brick bump effect could go here
                    }
                }
            }
        }
    }

    die() {
        this.dead = true;
        this.vy = -400; // Launch upward on death
        audioManager.play('die');
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        const sy = this.y;

        // Blink during invincibility
        if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 0) return;

        ctx.save();
        ctx.translate(sx + this.width / 2, sy);
        ctx.scale(this.facing, 1);
        ctx.translate(-this.width / 2, 0);

        if (this.dead) {
            this._drawMario(ctx, 0, 0, 'dead');
        } else if (this.winAnim) {
            // Victory: jump in place with arms up
            const bounce = Math.abs(Math.sin(this.winTimer * 8)) * 5;
            this._drawMario(ctx, 0, -bounce, 'jump');
        } else {
            const leg = this.legFrames[this.currentLegFrame] || this.legFrames[0];
            this._drawMario(ctx, leg.left, leg.right, 
                Math.abs(this.vx) > 15 ? 'walk' : 'stand');
        }

        ctx.restore();
    }

    // Draw Mario character with pixel-art style rectangles
    _drawMario(ctx, leftLegOff, rightLegOff, state) {
        const w = this.width;
        
        // === HAT (red) ===
        ctx.fillStyle = '#E52521';
        ctx.fillRect(4, 0, w - 6, 8);           // hat top
        ctx.fillRect(0, 5, w - 1, 3);            // brim

        // === FACE (skin) ===
        ctx.fillStyle = '#FBB587';
        ctx.fillRect(4, 8, w - 8, 10);           // face area

        // Hair/sideburns
        ctx.fillStyle = '#6B3200';
        ctx.fillRect(2, 8, 4, 8);                // left hair
        ctx.fillRect(w - 6, 8, 4, 5);            // right hair (shorter)

        // Mustache
        ctx.fillStyle = '#6B3200';
        ctx.fillRect(9, 14, w - 13, 3);          // mustache

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(15, 10, 3, 3);              // eye

        // === BODY (red shirt) ===
        ctx.fillStyle = '#E52521';
        ctx.fillRect(4, 18, w - 8, 6);           // torso

        // Arms with animation
        if (state === 'walk') {
            const swing = Math.sin(Date.now() * 0.02) * 3;
            ctx.fillStyle = '#E52521';
            ctx.fillRect(-1, 18 + swing, 6, 5);    // left arm
            ctx.fillRect(w - 5, 18 - swing, 6, 5); // right arm
            
            // Hands (skin)
            ctx.fillStyle = '#FBB587';
            ctx.fillRect(-2, 22 + swing, 4, 3);
            ctx.fillRect(w - 2, 22 - swing, 4, 3);
        } else if (state === 'jump') {
            // Arms raised in victory/jump pose
            ctx.fillStyle = '#E52521';
            ctx.fillRect(0, 14, 5, 6);
            ctx.fillRect(w - 5, 14, 5, 6);
            
            ctx.fillStyle = '#FBB587';
            ctx.fillRect(-1, 12, 4, 3);
            ctx.fillRect(w - 3, 12, 4, 3);
        } else {
            // Idle arms at sides
            ctx.fillStyle = '#E52521';
            ctx.fillRect(0, 19, 5, 5);
            ctx.fillRect(w - 5, 19, 5, 5);
            
            ctx.fillStyle = '#FBB587';
            ctx.fillRect(-1, 23, 4, 3);
            ctx.fillRect(w - 3, 23, 4, 3);
        }

        // === OVERALLS (blue) ===
        ctx.fillStyle = '#049CD8';
        ctx.fillRect(6, 24, w - 12, 6);          // overall body

        // Overall straps
        ctx.fillStyle = '#049CD8';
        ctx.fillRect(6, 22, 3, 5);               // left strap
        ctx.fillRect(w - 9, 22, 3, 5);           // right strap

        // Buttons (yellow)
        ctx.fillStyle = '#FBD007';
        ctx.fillRect(10, 24, 2, 2);              // left button
        ctx.fillRect(w - 12, 24, 2, 2);          // right button

        // === LEGS + SHOES (animated) ===
        if (state === 'dead') {
            // Dead: legs kicked up
            ctx.fillStyle = '#049CD8';
            ctx.fillRect(5, 26, 7, 5);
            ctx.fillRect(w - 12, 26, 7, 5);
            
            ctx.fillStyle = '#6B3200';
            ctx.fillRect(4, 24, 8, 3);
            ctx.fillRect(w - 12, 24, 8, 3);

        } else if (state === 'walk') {
            // Walking legs with animated offset
            const legH = 7;
            
            // Left leg + shoe
            ctx.fillStyle = '#049CD8';
            ctx.fillRect(6 + leftLegOff, 30, 7, legH);
            ctx.fillStyle = '#6B3200';
            ctx.fillRect(5 + leftLegOff, 36, 9, 3);

            // Right leg + shoe
            ctx.fillStyle = '#049CD8';
            ctx.fillRect(w - 13 + rightLegOff, 30, 7, legH);
            ctx.fillStyle = '#6B3200';
            ctx.fillRect(w - 14 + rightLegOff, 36, 9, 3);

        } else if (state === 'jump') {
            // Jump tuck: legs bent up
            ctx.fillStyle = '#049CD8';
            ctx.fillRect(5, 28, 7, 5);
            ctx.fillRect(w - 12, 28, 7, 5);
            
            ctx.fillStyle = '#6B3200';
            ctx.fillRect(3, 32, 8, 3);
            ctx.fillRect(w - 11, 30, 8, 3);

        } else {
            // Standing still: both legs down
            ctx.fillStyle = '#049CD8';
            ctx.fillRect(6, 30, 7, 5);
            ctx.fillRect(w - 13, 30, 7, 5);
            
            ctx.fillStyle = '#6B3200';
            ctx.fillRect(5, 34, 9, 3);
            ctx.fillRect(w - 14, 34, 9, 3);
        }
    }
}

// Goomba enemy with walking animation
class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        // Tighter collision hitbox
        this.hitboxPadding = { left: 3, right: 3, top: 6, bottom: 1 };
        this.speed = 58;
        this.direction = -1; // faces left initially
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.squishTimer = 0;
        this.alive = true;
    }

    update(dt, levels) {
        if (!this.alive) {
            // Squished animation timer
            this.squishTimer += dt;
            return;
        }

        // Gravity
        this.vy += 1200 * dt;

        // Horizontal movement
        const prevX = this.x;
        this.x += this.speed * this.direction * dt;

        // Check wall collisions - reverse direction on hit
        for (let block of levels.solidBlocks) {
            if (block.type === 'pole' || block.type === 'pipe') continue;
            
            if (this.x < block.x + block.w && this.x + this.width > block.x &&
                this.y < block.y + block.h && this.y + this.height > block.y) {
                
                // Reverse direction and push back
                this.direction *= -1;
                this.x = prevX;
            }
        }

        // Vertical movement (gravity + ground collision)
        const prevY = this.y;
        this.y += this.vy * dt;

        for (let block of levels.solidBlocks) {
            if (block.type === 'pole' || block.type === 'pipe') continue;
            
            if (this.x < block.x + block.w && this.x + this.width > block.x &&
                this.y < block.y + block.h && this.y + this.height > block.y) {
                
                if (this.vy > 0) {
                    // Landed on ground
                    this.y = block.y - this.height;
                    this.vy = 0;
                }
            }
        }

        // Walk animation cycling
        this.walkTimer += dt;
        if (this.walkTimer >= 0.25) {
            this.walkTimer = 0;
            this.walkFrame = (this.walkFrame + 1) % 2;
        }

        // Fall off screen = remove
        if (this.y > 600) {
            this.removed = true;
        }
    }

    squish() {
        if (!this.alive) return;
        this.alive = false;
        this.squishTimer = 0;
        audioManager.play('stomp');
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;
        const sy = this.y;

        ctx.save();
        ctx.translate(sx + this.width / 2, sy);

        if (!this.alive) {
            // Squished goomba (flat on ground)
            ctx.globalAlpha = Math.max(0, 1 - this.squishTimer * 3);
            this._drawSquished(ctx);
        } else {
            this._drawGoomba(ctx, this.walkFrame);
        }

        ctx.restore();
    }

    _drawGoomba(ctx, frame) {
        const w = this.width;

        // Body (brown mushroom cap shape)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(w/2, 9, w/2 - 2, 10, 0, Math.PI, 0);
        ctx.fill();

        // Darker top of cap
        ctx.fillStyle = '#6B3410';
        ctx.beginPath();
        ctx.ellipse(w/2, 7, w/2 - 5, 8, 0, Math.PI, 0);
        ctx.fill();

        // Face area (lighter)
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(4, 9, w - 8, 11);

        // Angry eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(6, 10, 5, 5);       // left eye
        ctx.fillRect(w - 11, 10, 5, 5);  // right eye

        // Eyebrows (angry downward slant)
        ctx.strokeStyle = '#3D1F00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, 9);
        ctx.lineTo(12, 11.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(w - 5, 9);
        ctx.lineTo(w - 12, 11.5);
        ctx.stroke();

        // Mouth (frown)
        ctx.fillStyle = '#3D1F00';
        ctx.fillRect(8, 17, w - 16, 2);

        // Feet with walking animation
        const footShift = frame === 0 ? -2 : 2;
        
        // Left foot
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(w/2 - 5 + footShift, 26, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right foot
        ctx.beginPath();
        ctx.ellipse(w/2 + 5 - footShift, 26, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSquished(ctx) {
        // Flat squished goomba
        const w = this.width;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(2, 24, w - 4, 5);

        ctx.fillStyle = '#6B3410';
        ctx.fillRect(6, 24, w - 12, 3);

        // Tiny eyes still visible
        ctx.fillStyle = '#FFF';
        ctx.fillRect(7, 25, 3, 2);
        ctx.fillRect(w - 10, 25, 3, 2);
    }
}

// Collectible coin with spinning animation
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.animTimer = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.animTimer += dt * 5; // spin speed
    }

    render(ctx, cameraX) {
        if (this.collected) return;
        
        const sx = this.x - cameraX + this.width / 2;
        const sy = this.y + this.height / 2;
        
        // Spinning effect: scale X based on sine of timer
        const scaleX = Math.abs(Math.cos(this.animTimer));

        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(scaleX, 1);

        // Draw coin emoji
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪙', 0, 0);

        ctx.restore();
    }

    checkCollision(player) {
        if (this.collected || player.dead) return false;
        
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        // Simple distance check (generous hit area)
        return Collision.dist(px, py, cx, cy) < 24;
    }
}

// Flag pole marking level end
class FlagPole {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = TILE * 10;
        this.reached = false;
    }

    render(ctx, cameraX) {
        const sx = this.x - cameraX;

        // Pole shadow
        ctx.fillStyle = '#555';
        ctx.fillRect(sx + 3, this.y, 4, this.height);

        // Main pole
        ctx.fillStyle = '#999';
        ctx.fillRect(sx + 2, this.y, 4, this.height);

        // Pole highlight
        ctx.fillStyle = '#CCC';
        ctx.fillRect(sx + 3, this.y, 1, this.height);

        // Top ball (gold)
        ctx.fillStyle = '#E5B800';
        ctx.beginPath();
        ctx.arc(sx + 4, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + 3, this.y - 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Flag (animated wave if not reached)
        if (!this.reached) {
            const wave = Math.sin(Date.now() * 0.005) * 4;
            
            ctx.fillStyle = '#33CC33';
            ctx.beginPath();
            ctx.moveTo(sx + 6, this.y + 8);
            ctx.lineTo(sx + 32 + wave, this.y + 20);
            ctx.lineTo(sx + 6, this.y + 34);
            ctx.closePath();
            ctx.fill();

            // Star on flag
            ctx.fillStyle = '#FBD007';
            ctx.font = '15px serif';
            ctx.textAlign = 'center';
            ctx.fillText('⭐', sx + 17 + wave/2, this.y + 24);
        }
    }
}

// Floating score text particle
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'score' or 'brick'
        this.life = 0.6;

        if (type === 'score') {
            this.vy = -120;
            this.text = '+100';
        } else if (type === 'brick') {
            this.vx1 = -80 + Math.random() * 40;
            this.vx2 = 40 + Math.random() * 40;
            this.vy = -300 - Math.random() * 100;
        }
    }

    update(dt) {
        this.life -= dt;

        if (this.type === 'score') {
            this.y += this.vy * dt; // Float upward
        } else if (this.type === 'brick') {
            this.x += this.vx1 * dt;
            this.y += this.vy * dt;
            this.vy += 800 * dt; // gravity on fragments
        }
    }

    render(ctx, cameraX) {
        const alpha = Math.max(0, this.life / 0.6);
        ctx.globalAlpha = alpha;

        if (this.type === 'score') {
            ctx.fillStyle = '#FBD007';
            ctx.font = 'bold 13px Courier New';
            ctx.fillText(this.text, this.x - cameraX, this.y);
        } else if (this.type === 'brick') {
            ctx.fillStyle = '#C84C09';
            ctx.fillRect(this.x - cameraX, this.y, 6, 6);
        }

        ctx.globalAlpha = 1;
    }
}

const TILE = 32;

export { Player, Goomba, Coin, FlagPole, Particle };
