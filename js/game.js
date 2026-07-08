/**
 * game.js — Main game loop, state machine, entity management
 */

// ── Canvas setup ─────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 480;

// ── HUD elements ─────────────────────────────────────────
const elScore = document.getElementById('score');
const elCoins = document.getElementById('coins');
const elTime = document.getElementById('time');
const elLives = document.getElementById('lives');
const elWorld = document.getElementById('world');
const elOverlay = document.getElementById('overlay');
const elTitle = document.getElementById('overlay-title');
const elSubtitle = document.getElementById('overlay-subtitle');
const elAction = document.getElementById('overlay-action');

// ── Game state ───────────────────────────────────────────
let state = 'MENU'; // MENU | PLAYING | PAUSED | GAME_OVER | WIN | DYING
let map;
let player;
let enemies = [];
let coins = [];
let floatingItems = [];
let particles = [];
let score = 0;
let coinCount = 0;
let lives = 3;
let timeLeft = 400;
let timeAccum = 0;
let deathTimer = 0;
let winTimer = 0;
let flagReached = false;
let currentMapIndex = 0;
let warpTimer = 0;
let warpTargetMap = 0;
let warpTargetCol = 0;

// ── Sound effects ────────────────────────────────────────
const Sound = (() => {
  let ctx;
  let master;
  let unlocked = false;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type, gain, slideTo) {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }

  function noise(duration, gain) {
    const audio = ensure();
    if (!audio) return;
    const now = audio.currentTime;
    const buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = audio.createBufferSource();
    const amp = audio.createGain();
    source.buffer = buffer;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(amp);
    amp.connect(master);
    source.start(now);
  }

  return {
    unlock() {
      if (unlocked) return;
      ensure();
      unlocked = true;
    },
    play(name) {
      switch (name) {
        case 'start':
          tone(523, 0.08, 'square', 0.12);
          setTimeout(() => tone(784, 0.12, 'square', 0.12), 70);
          break;
        case 'jump':
          tone(330, 0.16, 'square', 0.10, 660);
          break;
        case 'coin':
          tone(988, 0.07, 'square', 0.10);
          setTimeout(() => tone(1319, 0.08, 'square', 0.08), 45);
          break;
        case 'powerup':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => tone(freq, 0.08, 'triangle', 0.10), i * 55);
          });
          break;
        case 'bump':
          tone(180, 0.08, 'square', 0.10, 110);
          break;
        case 'break':
          noise(0.12, 0.12);
          tone(120, 0.09, 'sawtooth', 0.08, 70);
          break;
        case 'stomp':
          tone(220, 0.08, 'square', 0.10, 110);
          break;
        case 'hurt':
          tone(196, 0.20, 'sawtooth', 0.11, 80);
          break;
        case 'warp':
          tone(440, 0.28, 'triangle', 0.10, 110);
          break;
        case 'win':
          [523, 659, 784, 1047, 784, 1047].forEach((freq, i) => {
            setTimeout(() => tone(freq, 0.12, 'square', 0.09), i * 90);
          });
          break;
      }
    }
  };
})();

window.addEventListener('keydown', () => Sound.unlock(), { once: true });
window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

// ── Init / Reset ─────────────────────────────────────────
function initGame() {
  currentMapIndex = 0;
  map = loadMap(currentMapIndex);
  player = new Player(3 * TILE, 11 * TILE);
  enemies = spawnEnemies().map(e => new Enemy(e.type, e.x, e.y));
  coins = spawnCoins().map(c => new Coin(c.x, c.y));
  floatingItems = [];
  particles = [];
  score = 0;
  coinCount = 0;
  lives = 3;
  timeLeft = 400;
  timeAccum = 0;
  flagReached = false;
  Camera.x = 0;
  Camera.y = 0;
}

function resetLevel() {
  map = loadMap(currentMapIndex);
  player = new Player(3 * TILE, 11 * TILE);
  enemies = currentMapIndex === 1
    ? spawnEnemiesUnderground().map(e => new Enemy(e.type, e.x, e.y))
    : spawnEnemies().map(e => new Enemy(e.type, e.x, e.y));
  coins = currentMapIndex === 1
    ? spawnCoinsUnderground().map(c => new Coin(c.x, c.y))
    : spawnCoins().map(c => new Coin(c.x, c.y));
  floatingItems = [];
  particles = [];
  timeLeft = 400;
  timeAccum = 0;
  flagReached = false;
  Camera.x = 0;
}

// ── Overlay helpers ──────────────────────────────────────
function showOverlay(title, subtitle, action) {
  elTitle.textContent = title;
  elSubtitle.textContent = subtitle || '';
  elAction.textContent = action || '';
  elOverlay.classList.remove('hidden');
}

function hideOverlay() {
  elOverlay.classList.add('hidden');
}

// ── HUD update ───────────────────────────────────────────
function updateHUD() {
  elScore.textContent = String(score).padStart(6, '0');
  elCoins.textContent = String(coinCount).padStart(2, '0');
  elTime.textContent = String(Math.max(0, Math.floor(timeLeft)));
  elLives.textContent = lives;
  elWorld.textContent = currentMapIndex === 1 ? '1-2' : '1-1';
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

// ── Flag check ───────────────────────────────────────────
function checkFlag() {
  if (!player.alive || flagReached || currentMapIndex !== 0) return;
  const flagCol = 193;
  if (player.x + player.w >= flagCol * TILE && player.x <= (flagCol + 1) * TILE) {
    flagReached = true;
    state = 'WIN';
    winTimer = 180;
    score += Math.floor(timeLeft) * 50; // time bonus
    Sound.play('win');
    particles.push(new Particle(player.cx, player.y - 20, '🎉 YOU WIN!', '#ff0'));
  }
}

// ── Map transition (warp pipes & elevators) ──────────────
function checkTransition() {
  if (!player.alive || state !== 'PLAYING') return;

  const playerCol = Math.floor(player.cx / TILE);
  const playerRow = Math.floor(player.cy / TILE);

  // Check warp pipes
  for (const wp of WARP_PIPES) {
    if (wp.map !== currentMapIndex) continue;
    if (playerCol >= wp.col && playerCol <= wp.col + 1 &&
        playerRow >= wp.topRow && playerRow <= wp.bottomRow) {
      transitionToMap(wp.targetMap, wp.targetCol);
      return;
    }
  }

  // Check elevators
  for (const elev of ELEVATORS) {
    if (elev.map !== currentMapIndex) continue;
    if (playerCol >= elev.col && playerCol <= elev.col + 1 &&
        playerRow >= elev.row && playerRow <= elev.row + 1) {
      transitionToMap(elev.targetMap, elev.targetCol);
      return;
    }
  }
}

function transitionToMap(mapIndex, spawnCol) {
  state = 'WARPING';
  warpTimer = 30;
  warpTargetMap = mapIndex;
  warpTargetCol = spawnCol;
  Sound.play('warp');
  particles.push(new Particle(player.cx, player.y - 20,
    mapIndex === 1 ? '⬇️ Warp!' : '⬆️ Elevator!', '#ff0'));
}

// ── Main update ──────────────────────────────────────────
function update(dt) {
  switch (state) {
    case 'MENU':
      if (Input.once('Space') || Input.once('Enter')) {
        Sound.unlock();
        Sound.play('start');
        initGame();
        state = 'PLAYING';
        hideOverlay();
      }
      break;

    case 'PLAYING':
      // Timer
      timeAccum += dt;
      if (timeAccum >= 60) {
        timeAccum -= 60;
        timeLeft--;
        if (timeLeft <= 0) {
          player.die();
          Sound.play('hurt');
          state = 'DYING';
          deathTimer = 90;
        }
      }

      // Update player (returns block hit from below)
      const hitResult = player.update(map, dt);
      if (hitResult) {
        hitBlock(hitResult.col, hitResult.row, hitResult.tile);
      }

      // Update entities
      enemies.forEach(e => e.update(map, dt));
      coins.forEach(c => c.update(dt));
      floatingItems.forEach(f => f.update(dt));
      particles.forEach(p => p.update(dt));

      // Collisions
      checkEnemyCollision();
      checkCoinCollision();
      checkFloatingItemCollision();
      checkFlag();
      checkTransition();

      // Camera
      Camera.follow(player);

      // Cleanup dead entities
      enemies = enemies.filter(e => e.alive);
      floatingItems = floatingItems.filter(f => f.alive);
      particles = particles.filter(p => p.alive);

      updateHUD();
      break;

    case 'WARPING':
      warpTimer -= dt;
      particles.forEach(p => p.update(dt));
      particles = particles.filter(p => p.alive);
      if (warpTimer <= 0) {
        currentMapIndex = warpTargetMap;
        map = loadMap(currentMapIndex);
        player = new Player(warpTargetCol * TILE, 11 * TILE);
        enemies = currentMapIndex === 1
          ? spawnEnemiesUnderground().map(e => new Enemy(e.type, e.x, e.y))
          : spawnEnemies().map(e => new Enemy(e.type, e.x, e.y));
        coins = currentMapIndex === 1
          ? spawnCoinsUnderground().map(c => new Coin(c.x, c.y))
          : spawnCoins().map(c => new Coin(c.x, c.y));
        floatingItems = [];
        Camera.x = Math.max(0, warpTargetCol * TILE - Camera.w * 0.35);
        particles.push(new Particle(player.cx, player.y - 20,
          currentMapIndex === 1 ? '⬇️ Underground!' : '⬆️ Surface!', '#ff0'));
        state = 'PLAYING';
      }
      break;

    case 'DYING':
      deathTimer -= dt;
      player.vy += GRAVITY;
      player.y += player.vy;
      if (deathTimer <= 0) {
        lives--;
        if (lives <= 0) {
          state = 'GAME_OVER';
          showOverlay('💀 GAME OVER', `Final Score: ${score}`, 'Press SPACE to restart');
        } else {
          resetLevel();
          state = 'PLAYING';
        }
      }
      break;

    case 'WIN':
      winTimer -= dt;
      particles.forEach(p => p.update(dt));
      particles = particles.filter(p => p.alive);
      if (winTimer <= 0) {
        state = 'GAME_OVER'; // reuse for "level complete" screen
        showOverlay('🎉 LEVEL COMPLETE!', `Score: ${score}  Coins: ${coinCount}`, 'Press SPACE to play again');
      }
      break;

    case 'GAME_OVER':
      if (Input.once('Space') || Input.once('Enter')) {
        Sound.unlock();
        Sound.play('start');
        initGame();
        state = 'PLAYING';
        hideOverlay();
      }
      break;
  }

  Input.clear();
}

// ── Main render ──────────────────────────────────────────
function render() {
  // Sky
  drawSky(ctx, currentMapIndex);

  if (state === 'MENU') return; // nothing else to draw yet

  // World
  drawWorld(ctx, map);

  // Coins
  coins.forEach(c => c.draw(ctx));

  // Floating items
  floatingItems.forEach(f => f.draw(ctx));

  // Enemies
  enemies.forEach(e => e.draw(ctx));

  // Player
  player.draw(ctx);

  // Particles
  particles.forEach(p => p.draw(ctx));
}

// ── Game loop ────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 16.67, 3); // normalize to ~60fps, cap at 3x
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ── Start ────────────────────────────────────────────────
showOverlay('🍄 SUPER MARIO EMOJI', 'Arrow Keys / WASD to move, Space to jump\nTouch blue pipes 🟦 to warp, ride elevators 🛗 to return', 'Press SPACE to start');
requestAnimationFrame(gameLoop);
