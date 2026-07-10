/**
 * game.js — Main game loop, state machine, entity management
 */

// ── Canvas setup ─────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const CANVAS_W = 800;
const CANVAS_H = 480;

// ── Responsive scaling ───────────────────────────────────
const container = document.getElementById('game-container');

function resizeCanvas() {
  const cssWidth = Input.isMobile ? window.innerWidth : CANVAS_W;
  const cssHeight = Input.isMobile ? window.innerHeight : CANVAS_H;
  const logicalHeight = CANVAS_H;
  const logicalWidth = Input.isMobile
    ? logicalHeight * cssWidth / cssHeight
    : CANVAS_W;
  const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

  container.style.width = cssWidth + 'px';
  container.style.height = cssHeight + 'px';
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = Math.round(cssWidth * pixelRatio);
  canvas.height = Math.round(cssHeight * pixelRatio);
  ctx.setTransform(canvas.width / logicalWidth, 0, 0,
    canvas.height / logicalHeight, 0, 0);
  ctx.imageSmoothingEnabled = false;
  Camera.resize(logicalWidth, logicalHeight);
  if (typeof player !== 'undefined' && player) Camera.centerOn(player);
}

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

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

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
  Camera.y = 0;
  Camera.centerOn(player);
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
  Camera.centerOn(player);
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
        Camera.centerOn(player);
        particles.push(new Particle(player.cx, player.y - 20,
          currentMapIndex === 1 ? '⬇️ Underground!' : '⬆️ Surface!', '#ff0'));
        state = 'PLAYING';
      }
      break;

    case 'DYING':
      deathTimer -= dt;
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (deathTimer <= 0) {
        lives--;
        if (lives <= 0) {
          state = 'GAME_OVER';
          showOverlay('💀 GAME OVER', `Final Score: ${score}`,
            Input.isMobile ? 'Tap JUMP to restart' : 'Press SPACE to restart');
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
        showOverlay('🎉 LEVEL COMPLETE!', `Score: ${score}  Coins: ${coinCount}`,
          Input.isMobile ? 'Tap JUMP to play again' : 'Press SPACE to play again');
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
const STEP_MS = 1000 / 120;
const STEP_DT = STEP_MS / (1000 / 60);
const MAX_FRAME_MS = 100;
let lastTime;
let accumulator = 0;

function gameLoop(timestamp) {
  if (lastTime === undefined) lastTime = timestamp;
  const elapsed = Math.min(timestamp - lastTime, MAX_FRAME_MS);
  lastTime = timestamp;

  accumulator += elapsed;
  while (accumulator >= STEP_MS) {
    update(STEP_DT);
    accumulator -= STEP_MS;
  }

  render();

  requestAnimationFrame(gameLoop);
}

// ── Start ────────────────────────────────────────────────
const startHint = Input.isMobile
  ? 'Tap JUMP to start'
  : 'Press SPACE to start';
showOverlay('🍄 SUPER MARIO EMOJI', 'Touch blue pipes 🟦 to warp, ride elevators 🛗 to return', startHint);
requestAnimationFrame(gameLoop);
