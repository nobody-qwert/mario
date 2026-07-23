/* ========================================
   Super Mario Bros. Web — Game Engine
   Main game loop, state management, level loading
   ======================================== */

import { CONFIG, PHYSICS, DIMENSIONS, COLORS, GAME_STATE, SOUNDS, KEYS } from './config.js';
import { Mario } from './entities/mario.js';
import { Goomba } from './entities/goomba.js';
import { Platform, Coin, Star, Flag } from './entities/platform.js';
import { getLevel, getTotalLevels } from './levels/index.js';
import { Renderer } from './renderer.js';
import { inputManager } from './input.js';
import { soundManager } from './sound.js';
import { checkCollision } from './physics.js';
import { ParticleSystem, EventEmitter } from './utils.js';

export class Game extends EventEmitter {
    constructor(canvas) {
        super();
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.state = GAME_STATE.MENU;
        this.currentLevelIndex = 0;
        this.lives = 3;
        this.coins = 0;
        this.totalCoins = 0;
        this.timer = 0;
        this.particles = new ParticleSystem();

        this.mario = null;
        this.platforms = [];
        this.enemies = [];
        this.coinsList = [];
        this.stars = [];
        this.flag = null;
        this.levelData = null;

        this._boundPauseHandler = this._handlePause.bind(this);
        window.addEventListener('keydown', this._boundPauseHandler);
    }

    init() {
        this.renderer.resize();
        window.addEventListener('resize', () => this.renderer.resize());
        this._gameLoop = this._gameLoop.bind(this);
        requestAnimationFrame(this._gameLoop);
    }

    destroy() {
        window.removeEventListener('keydown', this._boundPauseHandler);
    }

    _handlePause(event) {
        if (event.code === KEYS.PAUSE) {
            if (this.state === GAME_STATE.PLAYING) {
                this.pause();
            } else if (this.state === GAME_STATE.PAUSED) {
                this.resume();
            }
        }
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        this.levelData = getLevel(index);
        if (!this.levelData) return;

        this.platforms = [];
        this.enemies = [];
        this.coinsList = [];
        this.stars = [];
        this.particles = new ParticleSystem();

        if (this.levelData.platforms) {
            if (Array.isArray(this.levelData.platforms)) {
                if (this.levelData.platforms[0] instanceof Platform) {
                    this.platforms = [...this.levelData.platforms];
                } else {
                    this.levelData.platforms.forEach(p => {
                        this.platforms.push(new Platform(p.x, p.y, p.width, p.height, p.type));
                    });
                }
            }
        }

        if (this.levelData.enemies) {
            if (this.levelData.enemies[0] instanceof Goomba) {
                this.enemies = [...this.levelData.enemies];
            } else {
                this.levelData.enemies.forEach(e => {
                    if (e.type === 'goomba') {
                        this.enemies.push(new Goomba(e.x, e.y));
                    }
                });
            }
        }

        if (this.levelData.coins) {
            this.coinsList = [...this.levelData.coins];
        } else if (this.levelData.collectibles) {
            this.levelData.collectibles.forEach(c => {
                if (c.type === 'coin') {
                    this.coinsList.push(new Coin(c.x, c.y));
                } else if (c.type === 'star') {
                    this.stars.push(new Star(c.x, c.y));
                }
            });
        }

        if (this.levelData.stars) {
            this.stars = [...this.levelData.stars];
        }

        if (this.levelData.flag) {
            if (this.levelData.flag instanceof Flag) {
                this.flag = this.levelData.flag;
            } else {
                this.flag = new Flag(this.levelData.flag.x, this.levelData.flag.y);
            }
        }

        const spawnX = this.levelData.spawnX || this.levelData.playerStart?.x || 50;
        const spawnY = this.levelData.spawnY || this.levelData.playerStart?.y || 400;

        if (!this.mario) {
            this.mario = new Mario(spawnX, spawnY);
        } else {
            this.mario.respawn(spawnX, spawnY);
        }

        this.renderer.cameraX = 0;
        this.renderer.cameraY = 0;
        this.timer = 0;
    }

    start() {
        this.lives = 3;
        this.coins = 0;
        this.totalCoins = 0;
        this.currentLevelIndex = 0;
        this.loadLevel(0);
        this.state = GAME_STATE.PLAYING;
        soundManager.init();
        this.emit('stateChange', this.state);
    }

    pause() {
        this.state = GAME_STATE.PAUSED;
        this.emit('stateChange', this.state);
    }

    resume() {
        this.state = GAME_STATE.PLAYING;
        this.emit('stateChange', this.state);
    }

    gameOver() {
        this.state = GAME_STATE.GAME_OVER;
        this.emit('stateChange', this.state);
    }

    levelComplete() {
        this.state = GAME_STATE.LEVEL_COMPLETE;
        this.emit('stateChange', this.state);
    }

    nextLevel() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex >= getTotalLevels()) {
            this.currentLevelIndex = 0;
        }
        this.loadLevel(this.currentLevelIndex);
        this.state = GAME_STATE.PLAYING;
        this.emit('stateChange', this.state);
    }

    restart() {
        this.lives = 3;
        this.coins = 0;
        this.totalCoins = 0;
        this.currentLevelIndex = 0;
        this.loadLevel(0);
        this.state = GAME_STATE.PLAYING;
        this.emit('stateChange', this.state);
    }

goToMenu() {
        this.state = GAME_STATE.MENU;
        this.emit('stateChange', this.state);
    }

    _gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const rawDt = Math.min(timestamp - this.lastTime, CONFIG.MAX_DELTA_TIME);
        this.lastTime = timestamp;
        const dt = rawDt / (1000 / CONFIG.TARGET_FPS);

        if (this.state === GAME_STATE.PLAYING) {
            this.update(dt);
        }

        this.render();
        inputManager.endFrame();
        requestAnimationFrame(this._gameLoop);
    }

    update(dt) {
        this.timer += dt;

        this.mario.update(dt);
        this.mario.handleCollisions(this.platforms);

        this.platforms.forEach(p => p.update(dt));

        this.enemies.forEach(enemy => {
            enemy.update(dt);
            enemy.handleCollisions(this.platforms);
        });

        this.enemies = this.enemies.filter(e => !e.stomped || e.stompTimer > 0);

        this.coinsList.forEach(coin => {
            coin.update(dt);
            if (!coin.collected && checkCollision(this.mario, coin)) {
                coin.collected = true;
                this.coins++;
                this.totalCoins++;
                soundManager.play(SOUNDS.COIN);
                this._spawnParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, COLORS.COIN, 8);
            }
        });

        this.stars.forEach(star => {
            star.update(dt);
            if (!star.collected && checkCollision(this.mario, star)) {
                star.collected = true;
                this.mario.invincible = true;
                this.mario.invincibleTimer = 300;
                soundManager.play(SOUNDS.POWERUP);
                this._spawnParticles(star.x + star.width / 2, star.y + star.height / 2, '#FFD700', 15);
            }
        });

        this.enemies.forEach(enemy => {
            if (!enemy.dead && !enemy.stomped) {
                this.mario.handleEnemyCollision(enemy);
            }
        });

        if (this.mario.dead && this.mario.deathTimer <= 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                const spawnX = this.levelData.spawnX || this.levelData.playerStart?.x || 50;
                const spawnY = this.levelData.spawnY || this.levelData.playerStart?.y || 400;
                this.mario.respawn(spawnX, spawnY);
            }
        }

        if (this.flag && !this.flag.reached) {
            if (checkCollision(this.mario, this.flag)) {
                this.flag.reached = true;
                this.levelComplete();
            }
        }

        if (!this.mario.dead && this.mario.y > CONFIG.CANVAS_HEIGHT + 100) {
            this.mario.die();
        }

        this.particles.update(dt);

        this.renderer.updateCamera(
            this.mario.x + this.mario.width / 2,
            this.mario.y + this.mario.height / 2,
            this.levelData.width || 2000,
            this.levelData.height || 540
        );

        this.emit('update', {
            lives: this.lives,
            coins: this.coins,
            level: this.currentLevelIndex + 1,
            timer: this.timer,
        });
    }

    render() {
        const ctx = this.renderer.ctx;
        const bgColor = this.levelData?.backgroundColor || COLORS.SKY_TOP;

        this.renderer.clear(bgColor);
        this.renderer.drawClouds();
        this.renderer.drawHills(this.levelData?.width || 2000);

        if (this.state !== GAME_STATE.MENU) {
            this.renderer.renderPlatforms(this.platforms);
            this.renderer.renderCoins(this.coinsList);
            this.renderer.renderStars(this.stars);
            if (this.flag) this.renderer.renderFlag(this.flag);
            this.renderer.renderEnemies(this.enemies);
            if (this.mario) this.mario.render(ctx, this.renderer.cameraX, this.renderer.cameraY);
            this.renderer.renderParticles(this.particles);
        }
    }

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            this.particles.add(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2,
                30 + Math.random() * 20,
                color,
                3 + Math.random() * 3
            );
        }
    }
}
