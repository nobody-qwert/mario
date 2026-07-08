/**
 * entities.js — Enemies, coins, particles, and floating items
 */

// ── Enemy definitions ────────────────────────────────────
const ENEMY_TYPES = {
  GOOMBA: { emoji: '🍄', speed: 0.8, w: TILE, h: TILE, hp: 1 },
  KOOPA:  { emoji: '🐢', speed: 0.6, w: TILE, h: TILE * 1.2, hp: 1 },
};

/**
 * Spawn enemy data for the level
 */
function spawnEnemies() {
  return [
    { type: 'GOOMBA', x: 22 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 40 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 50 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 51 * TILE, y: 12 * TILE },
    { type: 'KOOPA',  x: 60 * TILE, y: 11 * TILE },
    { type: 'GOOMBA', x: 75 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 80 * TILE, y: 8 * TILE },   // on platform
    { type: 'GOOMBA', x: 90 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 91 * TILE, y: 12 * TILE },
    { type: 'KOOPA',  x: 105 * TILE, y: 11 * TILE },
    { type: 'GOOMBA', x: 115 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 116 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 125 * TILE, y: 12 * TILE },
    { type: 'KOOPA',  x: 140 * TILE, y: 11 * TILE },
    { type: 'GOOMBA', x: 155 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 156 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 170 * TILE, y: 12 * TILE },
  ];
}

/**
 * Coin spawn positions (floating in the air)
 */
function spawnCoins() {
  return [
    { x: 17 * TILE, y: 8 * TILE },
    { x: 22 * TILE, y: 8 * TILE },
    { x: 24 * TILE, y: 8 * TILE },
    { x: 42 * TILE, y: 10 * TILE },
    { x: 43 * TILE, y: 10 * TILE },
    { x: 44 * TILE, y: 10 * TILE },
    { x: 78 * TILE, y: 8 * TILE },
    { x: 95 * TILE, y: 10 * TILE },
    { x: 96 * TILE, y: 10 * TILE },
    { x: 97 * TILE, y: 10 * TILE },
    { x: 110 * TILE, y: 11 * TILE },
    { x: 111 * TILE, y: 11 * TILE },
    { x: 130 * TILE, y: 10 * TILE },
    { x: 131 * TILE, y: 10 * TILE },
    { x: 150 * TILE, y: 11 * TILE },
    { x: 151 * TILE, y: 11 * TILE },
    { x: 165 * TILE, y: 10 * TILE },
  ];
}

// ── Entity classes ───────────────────────────────────────

class Enemy {
  constructor(type, x, y) {
    const def = ENEMY_TYPES[type];
    this.type = type;
    this.emoji = def.emoji;
    this.x = x;
    this.y = y;
    this.w = def.w;
    this.h = def.h;
    this.hp = def.hp;
    this.speed = def.speed;
    this.vx = -this.speed; // walk left
    this.vy = 0;
    this.alive = true;
    this.stomped = false;
    this.stompTimer = 0;
  }

  update(map, dt) {
    if (!this.alive) return;
    if (this.stomped) {
      this.stompTimer -= dt;
      if (this.stompTimer <= 0) this.alive = false;
      return;
    }

    // Gravity
    this.vy += 0.5;
    if (this.vy > 8) this.vy = 8;

    // Move X
    this.x += this.vx;
    this.collideX(map);

    // Move Y
    this.y += this.vy;
    this.collideY(map);

    // Fall into pit
    if (this.y > WORLD_H + 64) this.alive = false;
  }

  collideX(map) {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (SOLID.has(getTile(map, c * TILE, r * TILE))) {
          if (this.vx < 0) {
            this.x = (c + 1) * TILE;
          } else if (this.vx > 0) {
            this.x = c * TILE - this.w;
          }
          this.vx = -this.vx;
          return;
        }
      }
    }
  }

  collideY(map) {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 1) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (SOLID.has(getTile(map, c * TILE, r * TILE))) {
          if (this.vy > 0) {
            this.y = r * TILE - this.h;
            this.vy = 0;
          } else if (this.vy < 0) {
            this.y = (r + 1) * TILE;
            this.vy = 0;
          }
          return;
        }
      }
    }
  }

  stomp() {
    if (this.stomped) return;
    this.stomped = true;
    this.stompTimer = 30;
    this.h = TILE / 2;
  }

  draw(ctx) {
    if (!this.alive) return;
    const sx = this.x - Camera.x;
    const sy = this.y - Camera.y;
    ctx.font = `${this.stomped ? TILE - 8 : TILE - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = this.stomped ? 0.5 : 1;
    ctx.fillText(this.emoji, sx + this.w / 2, sy + this.h / 2);
    ctx.globalAlpha = 1;
  }
}

// ── Coin ──────────────────────────────────────────────────

class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = TILE * 0.8;
    this.h = TILE * 0.8;
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bobPhase += dt * 0.05;
  }

  draw(ctx) {
    if (this.collected) return;
    const bob = Math.sin(this.bobPhase) * 3;
    const sx = this.x - Camera.x;
    const sy = this.y - Camera.y + bob;
    ctx.font = `${TILE - 4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙', sx + this.w / 2, sy + this.h / 2);
  }
}

// ── Floating Item (from question blocks) ─────────────────

class FloatingItem {
  constructor(type, x, y) {
    this.type = type; // 'coin' or 'mushroom'
    this.emoji = type === 'coin' ? '🪙' : '🍄';
    this.x = x;
    this.y = y;
    this.w = TILE;
    this.h = TILE;
    this.vy = -4;
    this.alive = true;
    this.timer = 0;
  }

  update(dt) {
    this.vy += 0.3;
    this.y += this.vy;
    this.timer += dt;
    if (this.timer > 60) this.alive = false;
  }

  draw(ctx) {
    if (!this.alive) return;
    const sx = this.x - Camera.x;
    const sy = this.y - Camera.y;
    ctx.font = `${TILE - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, sx + this.w / 2, sy + this.h / 2);
  }
}

// ── Particle (score popup, effects) ──────────────────────

class Particle {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color || '#fff';
    this.vy = -1.5;
    this.life = 40;
    this.alive = true;
  }

  update(dt) {
    this.y += this.vy;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    if (!this.alive) return;
    const sx = this.x - Camera.x;
    const sy = this.y - Camera.y;
    ctx.globalAlpha = Math.min(1, this.life / 15);
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, sx, sy);
    ctx.globalAlpha = 1;
  }
}

// ── Underground spawn data ───────────────────────────────

function spawnEnemiesUnderground() {
  return [
    { type: 'GOOMBA', x: 10 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 25 * TILE, y: 12 * TILE },
    { type: 'KOOPA',  x: 35 * TILE, y: 11 * TILE },
    { type: 'GOOMBA', x: 45 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 55 * TILE, y: 9 * TILE },
    { type: 'GOOMBA', x: 70 * TILE, y: 12 * TILE },
    { type: 'KOOPA',  x: 85 * TILE, y: 11 * TILE },
    { type: 'GOOMBA', x: 100 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 110 * TILE, y: 12 * TILE },
    { type: 'GOOMBA', x: 125 * TILE, y: 7 * TILE },
    { type: 'KOOPA',  x: 135 * TILE, y: 11 * TILE },
  ];
}

function spawnCoinsUnderground() {
  return [
    { x: 17 * TILE, y: 9 * TILE },
    { x: 32 * TILE, y: 7 * TILE },
    { x: 33 * TILE, y: 7 * TILE },
    { x: 52 * TILE, y: 9 * TILE },
    { x: 53 * TILE, y: 9 * TILE },
    { x: 68 * TILE, y: 8 * TILE },
    { x: 95 * TILE, y: 10 * TILE },
    { x: 96 * TILE, y: 10 * TILE },
    { x: 103 * TILE, y: 9 * TILE },
    { x: 118 * TILE, y: 7 * TILE },
    { x: 130 * TILE, y: 10 * TILE },
    { x: 131 * TILE, y: 10 * TILE },
    { x: 140 * TILE, y: 11 * TILE },
  ];
}

// ── AABB helper ──────────────────────────────────────────

function aabb(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
