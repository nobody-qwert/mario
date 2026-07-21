// Game Engine - main loop and state management
import { input } from './input.js';
import { audioManager } from './audio.js';
import { Player, Goomba, Coin as CoinObj, FlagPole, Particle } from './entities.js';
import { Collision } from './collision.js';
import { levels, getDecorations } from './levels.js';
import { Renderer } from './renderer.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 500;

        // Game state
        this.state = 'title';
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.levelIndex = 0;
        
        // Entities
        this.player = null;
        this.goombas = [];
        this.coinObjects = [];
        this.flagPole = null;
        this.particles = [];
        
        // Level data
        this.currentLevelData = null;
        this.decorations = { clouds: [], bushes: [] };
        
        // Camera
        this.cameraX = 0;

        // Timers
        this.countdownTime = 0.65;
        this.levelCompleteTimer = 0;
        this.gameOverTimer = 0;
        this.winTimer = 0;
        this.dyingTimer = 0;

        // HUD elements
        this.scoreEl = document.getElementById('score-display');
        this.coinsEl = document.getElementById('coins-display');
        this.livesEl = document.getElementById('lives-display');
        this.levelEl = document.getElementById('level-display');
        this.hudEl = document.getElementById('hud');

        // Timing
        this.lastTime = 0;
        
        requestAnimationFrame(this.loop.bind(this));
    }

    initLevel(index) {
        if (index >= levels.length) {
            this.state = 'win';
            this.winTimer = 0;
            audioManager.play('win');
            return;
        }

        this.levelIndex = index;
        
        // Deep clone level data so we can modify it (question blocks, etc.)
        const rawLevel = levels[index];
        this.currentLevelData = JSON.parse(JSON.stringify(rawLevel));

        // Reconstruct solid blocks with proper hit state for question blocks
        this.solidBlocks = [];
        for (let block of this.currentLevelData.solidBlocks) {
            if (block.type === 'question') {
                this.solidBlocks.push({ ...block, hit: false });
            } else {
                this.solidBlocks.push({ ...block });
            }
        }

        // Create player at spawn point - Y set to start high enough to not overlap any blocks
        const marioY = 150; // Start above ground, gravity brings Mario down safely
        this.player = new Player(this.currentLevelData.marioX || 96, marioY);

        // Create goombas from level data
        this.goombas = [];
        for (let enemy of this.currentLevelData.enemies) {
            this.goombas.push(new Goomba(enemy.x, enemy.y));
        }

        // Create coins from level data
        this.coinObjects = [];
        for (let coin of this.currentLevelData.coins) {
            this.coinObjects.push(new CoinObj(coin.x, coin.y));
        }

        // Create flag pole from level definition
        if (this.currentLevelData.flagPoleData) {
            const fp = this.currentLevelData.flagPoleData;
            this.flagPole = new FlagPole(fp.x, fp.y);
            this.flagPole.height = fp.height;
            
            // Add pole segments to solid blocks for collision
            for (let r = 0; r < Math.floor(fp.height / TILE); r++) {
                const py = fp.y + r * TILE;
                this.solidBlocks.push({ 
                    x: fp.x, y: py, w: 8, h: TILE, type: 'pole' 
                });
            }
        }

        // Get decorations for this level
        this.decorations = getDecorations(index);

        // Reset camera to start of level
        this.cameraX = 0;

        this.updateHUD();
    }

    loop(timestamp) {
        requestAnimationFrame(this.loop.bind(this));

        // Calculate delta time in seconds, capped to prevent physics explosions
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Cap at 50ms (handles tab switching, etc.)
        dt = Math.min(dt, 0.05);

        // Update input state tracking
        input.update();

        // Process based on current game state
        switch(this.state) {
            case 'title':         this._onTitle(dt); break;
            case 'countdown':     this._onCountdown(dt); break;
            case 'playing':       this._onPlaying(dt); break;
            case 'dying':         this._onDying(dt); break;
            case 'gameover':      this._onGameOver(dt); break;
            case 'levelComplete': this._onLevelComplete(dt); break;
            case 'win':           this._onWin(dt); break;
        }

        // Render current frame
        this._render();
    }

    // ====== STATE HANDLERS ======

    _onTitle(dt) {
        if (input.jumpPressed || input.justPressed('Enter')) {
            audioManager.init();
            audioManager.play('powerup');
            this.score = 0;
            this.coins = 0;
            this.lives = 3;
            this.levelIndex = 0;
            this.state = 'countdown';
            this.countdownTime = 0.65;
            this.initLevel(this.levelIndex);
        }
    }

    _onCountdown(dt) {
        this.countdownTime -= dt;
        
        if (this.countdownTime <= -0.15) {
            // Start the level after countdown finishes
            this.state = 'playing';
        }
    }

    _onPlaying(dt) {
        if (!this.player) return;

        // --- Update entities ---
        
        // Player physics & collision
        this.player.update(dt, { solidBlocks: this.solidBlocks });

        // Reward newly-hit question blocks. Keeping this here lets level blocks
        // remain simple data while still producing immediate game feedback.
        for (const block of this.solidBlocks) {
            if (block.type === 'question' && block.hit && !block.rewarded) {
                block.rewarded = true;
                this.coins++;
                this.score += 100;
                audioManager.play('coin');
                this.particles.push(new Particle(block.x + 16, block.y, 'score'));
            }
        }

        // Goombas AI & collision
        for (let goomba of this.goombas) {
            goomba.update(dt, { solidBlocks: this.solidBlocks });
        }

        // Coins animation
        for (let coin of this.coinObjects) {
            coin.update(dt);
        }

        // Particles update
        for (let particle of this.particles) {
            particle.update(dt);
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // --- Collision checks ---

        // Player vs Coins
        for (let coin of this.coinObjects) {
            if (!coin.collected && this._playerTouchesCoin(coin)) {
                coin.collected = true;
                this.coins++;
                this.score += 100;
                audioManager.play('coin');
                this.particles.push(new Particle(coin.x, coin.y, 'score'));
            }
        }

        // Player vs Goombas
        for (let goomba of this.goombas) {
            if (!goomba.alive || goomba.removed) continue;

            // Use tighter hitboxes for player-enemy collision
            const ph = this.player.hitboxPadding;
            const gh = goomba.hitboxPadding;
            const playerHitbox = {
                x: this.player.x + ph.left,
                y: this.player.y + ph.top,
                width: this.player.width - ph.left - ph.right,
                height: this.player.height - ph.top - ph.bottom
            };
            const goombaHitbox = {
                x: goomba.x + gh.left,
                y: goomba.y + gh.top,
                width: goomba.width - gh.left - gh.right,
                height: goomba.height - gh.top - gh.bottom
            };

            const touching = Collision.checkAABB(playerHitbox, goombaHitbox);
            if (touching && !this.player.dead) {
                const playerBottom = playerHitbox.y + playerHitbox.height;
                const playerCenterY = playerHitbox.y + playerHitbox.height / 2;
                const goombaTop = goombaHitbox.y;
                const goombaCenterY = goombaHitbox.y + goombaHitbox.height / 2;

                // A small top band makes stomps readable without allowing side hits.
                const stompDepth = playerBottom - goombaTop;
                if (this.player.vy > 40 && stompDepth >= 0 && stompDepth <= 13 &&
                    playerCenterY < goombaCenterY) {
                    goomba.squish();
                    this.player.y = goombaTop - playerHitbox.height - ph.top;
                    this.player.vy = -410; // Bounce up
                    this.score += 200;
                    audioManager.play('stomp');
                    this.particles.push(new Particle(goomba.x, goomba.y, 'score'));
                } else {
                    // Any other collision with a live enemy = death
                    this.player.die();
                }
            }
        }

        // Player vs Flag Pole (level end)
        if (this.flagPole && !this.flagPole.reached) {
            const reached = Collision.checkAABB(this.player, { 
                x: this.flagPole.x - 10, y: this.flagPole.y, 
                w: this.flagPole.width + 20, h: this.flagPole.height 
            });
            
            if (reached) {
                this.state = 'levelComplete';
                this.levelCompleteTimer = 0;
                audioManager.play('flagpole');
                
                // Height bonus
                const heightBonus = Math.max(0, Math.floor((this.flagPole.y + this.flagPole.height - this.player.y) / 15));
                this.score += heightBonus;
            }
        }

        // Player death check (fell in pit or hit enemy)
        if (this.player.dead && this.player.deathTimer > 2.0) {
            this.lives--;

            if (this.lives <= 0) {
                this.state = 'gameover';
                this.gameOverTimer = 0;
                audioManager.play('gameover');
            } else {
                this.state = 'dying';
                this.dyingTimer = 0;
            }
        }

        // --- Camera follow (lock camera during death animation) ---
        if (!this.player.dead) {
            const targetX = this.player.x - this.canvas.width * 0.3;
            this.cameraX += (Math.max(0, targetX) - this.cameraX) * 6 * dt;
        }

        // Update HUD display
        this.updateHUD();
    }

    _onGameOver(dt) {
        this.gameOverTimer += dt;
        
        if (input.jumpPressed && this.gameOverTimer > 1.0) {
            audioManager.play('coin');
            this.state = 'title';
        }
    }

    _onLevelComplete(dt) {
        this.levelCompleteTimer += dt;

        // Player walks to flag, then does a little victory animation
        if (this.player && !this.player.winAnim) {
            const dx = this.flagPole.x - this.player.x;
            
            if (Math.abs(dx) > 5) {
                this.player.vx = Math.sign(dx) * 80;
                this.player.facing = Math.sign(dx);
                this.player.vy += 800 * dt; // gravity
                
                // Resolve ground collision manually during walk animation
                for (let block of this.solidBlocks) {
                    if (block.type === 'pole') continue;
                    const ox = this.player.x < block.x + block.w && 
                               this.player.x + this.player.width > block.x &&
                               this.player.y < block.y + block.h && 
                               this.player.y + this.player.height > block.y;
                    
                    if (ox && this.player.vy >= 0) {
                        this.player.y = block.y - this.player.height;
                        this.player.vy = 0;
                        this.player.grounded = true;
                    }
                }
            } else {
                // Reached flag, do victory spin
                this.player.winAnim = true;
                this.player.vx = 0;
            }
        }

        if (this.levelCompleteTimer > 2.5) {
            this.levelIndex++;
            this.initLevel(this.levelIndex);
            this.state = 'countdown';
                this.countdownTime = 0.65;
        }
    }

    _onWin(dt) {
        this.winTimer += dt;

        if (input.jumpPressed && this.winTimer > 1.0) {
            audioManager.init();
            audioManager.play('powerup');
            this.state = 'title';
        }
    }

    _onDying(dt) {
        this.dyingTimer += dt;

        // Continue death animation physics
        if (this.player) {
            this.player.update(dt, { solidBlocks: this.solidBlocks });
        }

        // After short pause, restart the level
        if (this.dyingTimer > 0.5) {
            this.initLevel(this.levelIndex);
            this.state = 'countdown';
            this.countdownTime = 0.45;
        }
    }

    // ====== COLLISION HELPERS ======

    _playerTouchesCoin(coin) {
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        const cx = coin.x + coin.width / 2;
        const cy = coin.y + coin.height / 2;
        
        return Collision.dist(px, py, cx, cy) < 24;
    }

    // ====== RENDERING ======

    _render() {
        const ctx = this.renderer.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.hudEl) {
            this.hudEl.style.opacity = this.state === 'title' ? '0' : '1';
        }

        switch(this.state) {
            case 'title': {
                const bgLevel = levels[0];
                if (!bgLevel) return;
                
                // Draw background
                this.renderer.drawBackground(bgLevel, 0);
                
                // Two-line title with a crisp arcade shadow
                const ctx = this.renderer.ctx;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 58px Arial Black, sans-serif';
                ctx.fillStyle = '#9D1714';
                ctx.fillText('SUPER MARIO', this.canvas.width/2 + 4, 126);
                ctx.fillStyle = '#E52521';
                ctx.fillText('SUPER MARIO', this.canvas.width/2, 121);

                ctx.font = 'bold 22px Courier New';
                ctx.fillStyle = '#172866';
                ctx.fillText('EMOJI EDITION', this.canvas.width/2 + 2, 168);
                ctx.fillStyle = '#FBD007';
                ctx.fillText('EMOJI EDITION', this.canvas.width/2, 166);

                // Decorative line
                ctx.font = '25px serif';
                ctx.fillText('🍄  🪙  👾  🏁  ⭐', this.canvas.width/2, 213);

                // Start prompt with pulse
                const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
                ctx.globalAlpha = pulse;
                ctx.font = 'bold 20px Courier New';
                ctx.fillStyle = '#FFF';
                ctx.fillText('PRESS SPACE TO START', this.canvas.width/2, 278);
                ctx.globalAlpha = 1;

                // Controls info
                ctx.font = '14px Courier New';
                ctx.fillStyle = '#CCC';
                ctx.fillText('← → / A D  MOVE     •     SPACE / ↑ / W  JUMP', this.canvas.width/2, 342);
                
                ctx.fillStyle = '#999';
                ctx.font = '12px Courier New';
                ctx.fillText('4 LEVELS  •  STOMP ENEMIES  •  COLLECT COINS  •  REACH THE FLAG', this.canvas.width/2, 406);
                ctx.textBaseline = 'top';
                break;
            }

            case 'countdown': {
                if (this.currentLevelData) {
                    this._drawGameWorld();
                } else {
                    this.renderer.drawBackground(levels[0], 0);
                }
                this.renderer.drawUI({ state: 'countdown', countdownTime: this.countdownTime }, 
                                     0, 0, this.lives, this.levelIndex);
                break;
            }

            case 'playing': {
                if (this.player) {
                    this._drawGameWorld();
                    
                    // Coins
                    for (let coin of this.coinObjects) {
                        coin.render(ctx, this.cameraX);
                    }
                    
                    // Goombas
                    for (let goomba of this.goombas) {
                        if (!goomba.removed) {
                            goomba.render(ctx, this.cameraX);
                        }
                    }
                    
                    // Flag pole
                    if (this.flagPole) {
                        this.flagPole.render(ctx, this.cameraX);
                    }
                    
                    // Particles
                    for (let particle of this.particles) {
                        particle.render(ctx, this.cameraX);
                    }
                    
                    // Player
                    this.player.render(ctx, this.cameraX);
                }
                break;
            }

            case 'dying': {
                if (this.currentLevelData) {
                    this._drawGameWorld();

                    for (let coin of this.coinObjects) {
                        coin.render(ctx, this.cameraX);
                    }
                    for (let goomba of this.goombas) {
                        if (!goomba.removed) goomba.render(ctx, this.cameraX);
                    }
                    if (this.flagPole) this.flagPole.render(ctx, this.cameraX);
                    for (let particle of this.particles) {
                        particle.render(ctx, this.cameraX);
                    }
                    this.player.render(ctx, this.cameraX);
                }
                break;
            }

            case 'gameover': {
                if (this.currentLevelData) {
                    this._drawGameWorld();
                } else {
                    this.renderer.drawBackground(levels[0], 0);
                }
                this.renderer.drawUI({ state: 'gameover' }, this.score, this.coins, this.lives, this.levelIndex);
                break;
            }

            case 'levelComplete': {
                if (this.currentLevelData && this.player) {
                    this._drawGameWorld();
                    
                    for (let coin of this.coinObjects) {
                        coin.render(ctx, this.cameraX);
                    }
                    for (let goomba of this.goombas) {
                        if (!goomba.removed) goomba.render(ctx, this.cameraX);
                    }
                    if (this.flagPole) this.flagPole.render(ctx, this.cameraX);
                    this.player.render(ctx, this.cameraX);
                }
                this.renderer.drawUI({ state: 'levelComplete' }, this.score, this.coins, this.lives, this.levelIndex);
                break;
            }

            case 'win': {
                this.renderer.drawBackground(levels[0], 0);
                this.renderer.drawUI({ state: 'win' }, this.score, this.coins, this.lives, this.levelIndex);
                break;
            }
        }
    }

    _drawGameWorld() {
        if (!this.currentLevelData) return;
        
        const ctx = this.renderer.ctx;
        
        // Background layer (sky color + gradient)
        this.renderer.drawBackground(this.currentLevelData, this.cameraX);
        
        // Parallax decorations (clouds, bushes, mountains)
        this.renderer.drawDecorations(this.decorations, this.cameraX);

        // Pipes
        if (this.currentLevelData.pipes && this.currentLevelData.pipes.length > 0) {
            this.renderer.drawPipes(this.currentLevelData.pipes, this.cameraX);
        }

        // Solid blocks (ground, question blocks, bricks)
        for (let block of this.solidBlocks) {
            if (block.type === 'pole') continue;
            
            const sx = Math.floor(block.x - this.cameraX);
            if (sx < -TILE || sx > this.canvas.width + TILE) continue;

            switch(block.type) {
                case 'ground':
                    this.renderer._drawGround(ctx, sx, block.y, block.color);
                    break;
                case 'question':
                    this.renderer._drawQuestion(ctx, sx, block.y, block.hit);
                    break;
                case 'brick':
                    this.renderer._drawBrick(ctx, sx, block.y, block.color);
                    break;
            }
        }

        // Flag pole
        if (this.flagPole) {
            this.renderer.drawFlagPole(this.flagPole, this.cameraX);
        }
    }

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = `SCORE: ${this.score}`;
        if (this.coinsEl) this.coinsEl.textContent = `COINS: ${this.coins}`;
        if (this.livesEl) this.livesEl.textContent = `LIVES: ${this.lives}`;
        if (this.levelEl) this.levelEl.textContent = `LEVEL: ${this.levelIndex + 1}`;
    }
}

const TILE = 32;

document.addEventListener('DOMContentLoaded', () => {
    new GameEngine();
});
