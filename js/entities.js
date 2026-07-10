/**
 * entities.js — Enemies, coins, particles, and floating items
 */

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

    // Reverse direction at edge of a gap (prevent self-defeat by falling)
    if (this.vy > 0) {
      // Enemy is falling — check if there is ground ahead in the current direction
      const lookAheadCol = this.vx < 0
        ? Math.floor(this.x / TILE)
        : Math.floor((this.x + this.w) / TILE);
      const feetRow = Math.floor((this.y + this.h) / TILE);
      const tileAhead = getTile(map, lookAheadCol * TILE, feetRow * TILE);
      if (!SOLID.has(tileAhead)) {
        // No ground ahead — reverse
        this.vx = -this.vx;
        this.x += this.vx * 2; // step back
      }
    }

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




