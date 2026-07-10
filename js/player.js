/**
 * player.js — Mario: movement, jumping, gravity, tile collision
 */

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = TILE * 0.9;
    this.h = TILE * 0.9;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.alive = true;
    this.invincible = 0; // frames of invincibility
    this.big = false;    // grew from mushroom
    this.runFrame = 0;
    this.runTimer = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(map, dt) {
    if (!this.alive) return;

    // Invincibility countdown
    if (this.invincible > 0) this.invincible -= dt;

    // ── Horizontal movement ──
    let targetVx = 0;
    if (Input.get('ArrowLeft') || Input.get('KeyA')) {
      targetVx = -MOVE_SPEED;
      this.facing = -1;
    }
    if (Input.get('ArrowRight') || Input.get('KeyD')) {
      targetVx = MOVE_SPEED;
      this.facing = 1;
    }

    // Acceleration / deceleration
    if (targetVx !== 0) {
      this.vx += (targetVx - this.vx) * 0.3;
      this.runTimer += dt;
      if (this.runTimer > 6) {
        this.runTimer = 0;
        this.runFrame = (this.runFrame + 1) % 2;
      }
    } else {
      this.vx *= 0.75;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      this.runFrame = 0;
    }

    // ── Jump ──
    if ((Input.once('Space') || Input.once('ArrowUp') || Input.once('KeyW')) && this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
      if (typeof Sound !== 'undefined') Sound.play('jump');
    }

    // Variable jump height (release to fall faster)
    if (!Input.get('Space') && !Input.get('ArrowUp') && !Input.get('KeyW') && this.vy < -3) {
      this.vy *= 0.9;
    }

    // ── Gravity ──
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    // ── Move X + collide ──
    this.x += this.vx;
    this.collideX(map);

    // Clamp to world left edge
    if (this.x < 0) this.x = 0;

    // ── Move Y + collide ──
    this.y += this.vy;
    this.onGround = false;
    const hit = this.collideY(map);

    // Fall into pit
    if (this.y > WORLD_H + 32) {
      this.die();
    }

    return hit; // block hit from below
  }

  collideX(map) {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 0.5) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 0.5) / TILE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        const tile = getTile(map, c * TILE, r * TILE);
        if (SOLID.has(tile)) {
          if (this.vx > 0) {
            this.x = c * TILE - this.w;
            this.vx = 0;
          } else if (this.vx < 0) {
            this.x = (c + 1) * TILE;
            this.vx = 0;
          }
          return;
        }
      }
    }
  }

  collideY(map) {
    const left = Math.floor(this.x / TILE);
    const right = Math.floor((this.x + this.w - 0.5) / TILE);
    const top = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 0.5) / TILE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        const tile = getTile(map, c * TILE, r * TILE);
        if (SOLID.has(tile)) {
          if (this.vy > 0) {
            // Landing on top
            this.y = r * TILE - this.h;
            this.vy = 0;
            this.onGround = true;
          } else if (this.vy < 0) {
            // Hitting block from below
            this.y = (r + 1) * TILE;
            this.vy = 1;
            // Hit block event
            return { col: c, row: r, tile };
          }
          return null;
        }
      }
    }
    return null;
  }

  die() {
    if (this.invincible > 0) return;
    this.alive = false;
  }

  hit() {
    if (this.invincible > 0) return;
    if (this.big) {
      this.big = false;
      this.h = TILE * 0.9;
      this.invincible = 90;
    } else {
      this.die();
    }
  }

  grow() {
    if (!this.big) {
      this.big = true;
      this.h = TILE * 1.3;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    const sx = this.x - Camera.x;
    const sy = this.y - Camera.y;
    const w = this.w;
    const h = this.h;

    // Invincibility flicker
    if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) return;

    ctx.save();

    // Flip for direction
    const cx = sx + w / 2;
    const cy = sy + h / 2;
    ctx.translate(cx, cy);
    ctx.scale(this.facing, 1);

    const big = this.big;
    const scale = big ? 1.3 : 1.0;

    // ── Colors ──
    const skin = '#f9a45e';
    const hat  = '#e52521';
    const shirt = '#e52521';
    const pants = '#3028a0';
    const shoe  = '#6b3300';
    const over  = '#e52521'; // overalls strap

    // ── Proportions ──
    const headH = h * 0.22 * scale;
    const bodyH = h * 0.30 * scale;
    const legH  = h * 0.28 * scale;
    const headY = -h / 2 + h * 0.05;
    const bodyY = headY + headH - 2;
    const legY  = bodyY + bodyH;

    const bodyW = w * 0.55;
    const headW = w * 0.5;
    const legW  = w * 0.2;

    // ── Hat (cap) ──
    ctx.fillStyle = hat;
    ctx.fillRect(-headW / 2 - 2, headY - 2, headW + 4, headH * 0.45);
    // Brim
    ctx.fillRect(headW / 2 - 2, headY + headH * 0.35, headW * 0.35, headH * 0.2);

    // ── Head (face) ──
    ctx.fillStyle = skin;
    ctx.fillRect(-headW / 2, headY + headH * 0.4, headW, headH * 0.6);

    // ── Eye ──
    ctx.fillStyle = '#000';
    ctx.fillRect(headW * 0.1, headY + headH * 0.5, 3, 3);

    // ── Mustache ──
    ctx.fillStyle = '#4a2a0a';
    ctx.fillRect(headW * 0.05, headY + headH * 0.7, headW * 0.4, 2);

    // ── Body (shirt + overalls) ──
    ctx.fillStyle = shirt;
    ctx.fillRect(-bodyW / 2, bodyY, bodyW, bodyH);

    // Overalls (blue pants part on body)
    ctx.fillStyle = pants;
    ctx.fillRect(-bodyW / 2, bodyY + bodyH * 0.4, bodyW, bodyH * 0.6);

    // Overall straps
    ctx.fillStyle = pants;
    ctx.fillRect(-bodyW / 2 + 2, bodyY, bodyW * 0.15, bodyH * 0.5);
    ctx.fillRect(bodyW / 2 - bodyW * 0.15 - 2, bodyY, bodyW * 0.15, bodyH * 0.5);

    // ── Legs ──
    const moving = Math.abs(this.vx) > 0.5;
    const walkOffset = moving ? Math.sin(this.runTimer * 0.5) * 4 : 0;

    // Left leg
    ctx.fillStyle = pants;
    ctx.fillRect(-bodyW / 2 - 1, legY, legW, legH * 0.6 + walkOffset);
    // Left shoe
    ctx.fillStyle = shoe;
    ctx.fillRect(-bodyW / 2 - 1, legY + legH * 0.6 + walkOffset, legW + 2, legH * 0.35 - walkOffset);

    // Right leg
    ctx.fillStyle = pants;
    ctx.fillRect(bodyW / 2 - legW + 1, legY, legW, legH * 0.6 - walkOffset);
    // Right shoe
    ctx.fillStyle = shoe;
    ctx.fillRect(bodyW / 2 - legW + 1, legY + legH * 0.6 - walkOffset, legW + 2, legH * 0.35 + walkOffset);

    // ── Arms ──
    const armW = w * 0.12;
    const armH = bodyH * 0.7;
    ctx.fillStyle = skin;
    // Left arm
    ctx.fillRect(-bodyW / 2 - armW, bodyY + 2, armW, armH);
    // Right arm
    ctx.fillRect(bodyW / 2, bodyY + 2, armW, armH);

    ctx.restore();
  }
}
