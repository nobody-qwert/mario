/**
 * collision.js — Collision-checking helpers
 * All functions reference globals (player, enemies, coins, floatingItems,
 * score, coinCount, lives, particles, Sound, JUMP_FORCE, TILE, T, SOLID,
 * setTile, map) exactly as they did before extraction.
 */

// ── AABB helper ──────────────────────────────────────────

function aabb(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// ── Hit block from below ─────────────────────────────────
function hitBlock(col, row, tile) {
  if (tile === T.QUESTION) {
    setTile(map, col, row, T.USED);
    // Spawn coin or mushroom
    const isMushroom = Math.random() < 0.3;
    floatingItems.push(new FloatingItem(
      isMushroom ? 'mushroom' : 'coin',
      col * TILE, (row - 1) * TILE
    ));
    Sound.play(isMushroom ? 'powerup' : 'coin');
    particles.push(new Particle(col * TILE + TILE / 2, row * TILE, isMushroom ? '🍄' : '+1', '#ffcc00'));
  } else if (tile === T.BRICK) {
    if (player.big) {
      setTile(map, col, row, T.AIR);
      Sound.play('break');
      // Break effect
      for (let i = 0; i < 4; i++) {
        particles.push(new Particle(
          col * TILE + (i % 2) * 16,
          row * TILE + Math.floor(i / 2) * 16,
          '🧱', '#c84'
        ));
      }
      score += 10;
    } else {
      // Just bounce
      Sound.play('bump');
      particles.push(new Particle(col * TILE + TILE / 2, row * TILE - 8, '🔨', '#fff'));
    }
  }
}

// ── Player-enemy collision ──────────────────────────────
function checkEnemyCollision() {
  if (!player.alive) return;

  for (const enemy of enemies) {
    if (!enemy.alive || enemy.stomped) continue;

    if (!aabb(player, enemy)) continue;

    // Check if stomping (player falling, above enemy)
    const playerBottom = player.y + player.h;
    const enemyTop = enemy.y;
    if (player.vy > 0 && playerBottom < enemyTop + enemy.h * 0.6) {
      // Stomp!
      enemy.stomp();
      player.vy = JUMP_FORCE * 0.6; // bounce
      score += 100;
      Sound.play('stomp');
      particles.push(new Particle(enemy.x + enemy.w / 2, enemy.y - 10, '+100', '#fff'));
    } else {
      // Player hit
      Sound.play('hurt');
      player.hit();
      if (!player.alive) {
        state = 'DYING';
        deathTimer = 90;
      }
    }
  }
}

// ── Player-coin collision ────────────────────────────────
function checkCoinCollision() {
  if (!player.alive) return;

  for (const coin of coins) {
    if (coin.collected) continue;
    if (aabb(player, coin)) {
      coin.collected = true;
      coinCount++;
      score += 200;
      Sound.play('coin');
      if (coinCount % 10 === 0) {
        lives++; // extra life every 10 coins
        Sound.play('powerup');
        particles.push(new Particle(player.cx, player.y - 20, '1UP!', '#0f0'));
      }
      particles.push(new Particle(coin.x + coin.w / 2, coin.y - 10, '+200', '#ffcc00'));
    }
  }
}

// ── Player-floating item collision ───────────────────────
function checkFloatingItemCollision() {
  if (!player.alive) return;

  for (const item of floatingItems) {
    if (!item.alive) continue;
    if (aabb(player, item)) {
      item.alive = false;
      if (item.type === 'coin') {
        coinCount++;
        score += 200;
        Sound.play('coin');
        particles.push(new Particle(item.x + item.w / 2, item.y - 10, '+200', '#ffcc00'));
      } else if (item.type === 'mushroom') {
        player.grow();
        score += 1000;
        Sound.play('powerup');
        particles.push(new Particle(item.x + item.w / 2, item.y - 10, '+1000', '#f80'));
      }
    }
  }
}
