/**
 * Main entry point — wires together ALL subsystems:
 * camera, renderer, input, map, weapon, enemies, player, wave system, game states.
 *
 * Game loop with requestAnimationFrame drives update + render.
 */

import * as THREE from 'three';

import { createCamera } from './engine/camera.js';
import { createRenderer } from './engine/renderer.js';
import { KEYS, attach as attachInput } from './engine/input.js';
import { createMap } from './game/map.js';
import { checkCollision } from './utils/collision.js';
import { createWeapon } from './game/weapon.js';
import { createParticleSystem } from './game/particles.js';
import { createEnemySystem } from './game/enemies.js';
import { createPlayer, MAX_HP, HP_PER_HEART, MAX_HEARTS } from './game/player.js';
import { createWaveSystem } from './game/wave.js';
import { GameState } from './game/states.js';

// ===========================================================================
// DOM references (index.html — do not modify)
// ===========================================================================
const container = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const victoryScreen = document.getElementById('victory-screen');
const heartsDisplay = document.getElementById('hearts-display');
const healthBarFill = document.getElementById('health-bar-fill');
const ammoHud = document.getElementById('ammo-hud');
const waveHud = document.getElementById('wave-hud');

// ===========================================================================
// Initialise subsystems
// ===========================================================================
const { camera, controls } = createCamera(container);
const { renderer, scene } = createRenderer(container, camera);
// Camera children (the first-person weapon and muzzle effects) only render when
// the camera is part of the scene graph.
scene.add(camera);
attachInput();

// Extend key tracking for Space and Shift (input.js only tracks WASD)
KEYS.Space = false;
KEYS.ShiftLeft = false;
KEYS.ShiftRight = false;

function onGameKeyDown(e) {
  switch (e.code) {
    case 'Space': KEYS.Space = true; break;
    case 'ShiftLeft': KEYS.ShiftLeft = true; break;
    case 'ShiftRight': KEYS.ShiftRight = true; break;
  }
}

function onGameKeyUp(e) {
  switch (e.code) {
    case 'Space': KEYS.Space = false; break;
    case 'ShiftLeft': KEYS.ShiftLeft = false; break;
    case 'ShiftRight': KEYS.ShiftRight = false; break;
  }
}

document.addEventListener('keydown', onGameKeyDown);
document.addEventListener('keyup', onGameKeyUp);

const mapData = createMap(scene);
const weapon = createWeapon(camera);
const particleSystem = createParticleSystem(scene);
const player = createPlayer(scene);
const enemySystem = createEnemySystem(scene, camera, (impactPosition) => {
  player.takeDamage(10);
  particleSystem.spawn(impactPosition || camera.position, 0xff3344, 7);
}, mapData.bounds);
weapon.updateAmmo();

// ===========================================================================
// Game state manager — MENU → PLAYING → GAME_OVER / VICTORY
// ===========================================================================
let currentState = GameState.MENU;

function setState(newState) {
  const validTransitions = {
    [GameState.MENU]: [GameState.PLAYING],
    [GameState.PLAYING]: [GameState.GAME_OVER, GameState.VICTORY],
    [GameState.GAME_OVER]: [GameState.MENU],
    [GameState.VICTORY]: [GameState.MENU],
  };

  if (!validTransitions[currentState]?.includes(newState)) return false;

  const previous = currentState;
  currentState = newState;

  // --- UI visibility transitions ---
  switch (newState) {
    case GameState.PLAYING:
      startScreen.classList.remove('active');
      gameOverScreen.classList.remove('active');
      victoryScreen.classList.remove('active');
      break;
    case GameState.GAME_OVER:
      gameOverScreen.classList.add('active');
      document.body.classList.remove('locked');
      controls.unlock();
      break;
    case GameState.VICTORY:
      victoryScreen.classList.add('active');
      document.body.classList.remove('locked');
      controls.unlock();
      break;
    case GameState.MENU:
      startScreen.classList.add('active');
      gameOverScreen.classList.remove('active');
      victoryScreen.classList.remove('active');
      document.body.classList.remove('locked');
      break;
  }

  return true;
}

// ===========================================================================
// Wave system — auto-starts wave 1 when entering PLAYING state
// ===========================================================================
let waveSystem = null; // created lazily on first start

function initWaveSystem() {
  if (waveSystem) return; // already initialised this session
  waveSystem = createWaveSystem(enemySystem, (waveNumber) => {
    // Wave completed — check for victory or auto-start next wave
    if (waveSystem.areAllWavesComplete()) {
      setState(GameState.VICTORY);
    } else {
      waveSystem.startNextWave();
    }
  });
}

function resetGame() {
  // Reset all systems
  player.reset();
  weapon.reset();

  if (waveSystem) {
    waveSystem.reset();
    waveSystem = null;
  }

  // Remove all enemies from scene
  enemySystem.clear();
  isJumping = false;
  verticalVelocity = 0;

  setState(GameState.MENU);
}

// ===========================================================================
// HUD update — only updates DOM when values change
// ===========================================================================
let prevHealth = -1;
let prevAmmo = '30/30';
let prevWaveInfo = '';

function updateHUD() {
  const health = player.getHealth();

  // --- Hearts display (♥ filled / ♡ empty) ---
  if (health !== prevHealth) {
    const fullHearts = Math.floor(health / HP_PER_HEART);
    const emptyHearts = MAX_HEARTS - fullHearts;
    heartsDisplay.innerHTML =
      '<span class="heart-filled">' + '♥'.repeat(fullHearts) + '</span>' +
      '<span class="heart-empty">' + '♡'.repeat(emptyHearts) + '</span>';
    prevHealth = health;
  }

  // --- Health bar fill width % ---
  const pct = (health / MAX_HP) * 100;
  if (pct !== parseFloat(healthBarFill.style.width)) {
    healthBarFill.style.width = pct + '%';
  }

  // --- Ammo counter ---
  const currentAmmoText = ammoHud.textContent;
  if (currentAmmoText !== prevAmmo) {
    prevAmmo = currentAmmoText;
  }

  // --- Wave / enemy count ---
  const waveNum = waveSystem ? waveSystem.getCurrentWave() : 0;
  const activeEnemies = waveSystem ? waveSystem.getActiveCount() : 0;
  const waveInfo = `WAVE ${waveNum} / 10 — Enemies: ${activeEnemies}`;

  if (waveInfo !== prevWaveInfo) {
    waveHud.textContent = waveInfo;
    prevWaveInfo = waveInfo;
  }
}

// ===========================================================================
// Jump physics (Space key) with gravity ~20 m/s², jump velocity ~7 m/s
// ===========================================================================
const GRAVITY = 20;          // metres per second squared
const JUMP_VELOCITY = 7;     // initial upward velocity in m/s
let isJumping = false;       // whether player is currently airborne
let verticalVelocity = 0;    // current Y velocity (positive = up)

// ===========================================================================
// Movement speed — sprint multiplier
// ===========================================================================
const MOVE_SPEED = 8;        // metres per second (normal)
const SPRINT_MULTIPLIER = 1.5;

// ===========================================================================
// Start screen click → transition to PLAYING, activate pointer lock
// ===========================================================================
startScreen.addEventListener('click', () => {
  if (currentState === GameState.MENU) {
    setState(GameState.PLAYING);
    initWaveSystem();
    waveSystem.startNextWave(); // Wave 1 spawns automatically (speed multiplier applied internally)
    controls.lock();
  }
});

// ===========================================================================
// Weapon fire integration — raycast hits passed to enemySystem.applyDamage()
// The weapon module's fire() method is called exclusively by this mousedown handler.
// ===========================================================================
document.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (currentState !== GameState.PLAYING || !controls.isLocked) return;

  // Fire weapon — handles ammo decrement, muzzle flash, and returns raycast data
  const fireResult = weapon.fire();
  if (!fireResult) return; // can't fire (reloading or empty)

  // A wall blocks enemies behind it; otherwise damage the exact rig that was hit.
  const worldHit = fireResult.raycaster.intersectObjects(mapData.meshes, false)[0];
  const enemyHit = enemySystem.raycast(
    fireResult.raycaster,
    worldHit ? worldHit.distance : Infinity,
  );
  const impactPoint = enemyHit?.point || worldHit?.point;
  if (impactPoint) {
    particleSystem.spawn(impactPoint, enemyHit ? 0xff3344 : 0xffb347, enemyHit ? 8 : 5);
    particleSystem.spawnTracer(fireResult.origin, impactPoint);
  } else {
    const tracerEnd = fireResult.origin.clone().addScaledVector(fireResult.direction, 45);
    particleSystem.spawnTracer(fireResult.origin, tracerEnd);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && currentState === GameState.PLAYING) weapon.reload();
});

// ===========================================================================
// Pointer lock callbacks — crosshair visibility
// ===========================================================================
controls.addEventListener('lock', () => {
  container.style.cursor = 'none';
  document.body.classList.add('locked');
});

controls.addEventListener('unlock', () => {
  document.body.classList.remove('locked');
  if (currentState === GameState.PLAYING) {
    // Player unlocked during gameplay — keep playing but show cursor
    container.style.cursor = '';
  } else {
    container.style.cursor = '';
  }
});

container.addEventListener('click', () => {
  if (currentState === GameState.PLAYING && !controls.isLocked) controls.lock();
});

// ===========================================================================
// Restart buttons — reset all systems, return to MENU state
// ===========================================================================
document.getElementById('restart-btn-gameover').addEventListener('click', () => {
  resetGame();
});

document.getElementById('restart-btn-victory').addEventListener('click', () => {
  resetGame();
});

// ===========================================================================
// Game loop — requestAnimationFrame driving update + render
// ===========================================================================
let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaTime = Math.min((now - prevTime) / 1000, 0.1); // cap at 100ms to avoid spiral of death
  prevTime = now;

  if (currentState === GameState.PLAYING && controls.isLocked) {
    updatePlayer(deltaTime);
    enemySystem.update(deltaTime);
    const movementAmount = KEYS.w || KEYS.a || KEYS.s || KEYS.d ? 1 : 0;
    weapon.update(deltaTime, movementAmount);
    checkWaveCompletion();
    checkGameStateTransitions();
  }

  // Update particle system every frame (even outside PLAYING to drain particles)
  particleSystem.update(deltaTime);

  // Sync camera Y with player position for jump visual
  const playerPos = player.getPosition();
  camera.position.y = playerPos.y + 1.7; // eye height above feet

  updateHUD();
  renderer.render(scene, camera);
}

// ===========================================================================
// Player movement — WASD + collision detection + jump + sprint
// ===========================================================================
function updatePlayer(deltaTime) {
  const directionX = (KEYS.d ? 1 : 0) - (KEYS.a ? 1 : 0); // right - left
  const directionZ = (KEYS.w ? 1 : 0) - (KEYS.s ? 1 : 0); // forward - back

  // Sprint: Shift key increases movement speed by 1.5×
  let currentSpeed = MOVE_SPEED;
  if (KEYS.ShiftLeft || KEYS.ShiftRight) {
    currentSpeed *= SPRINT_MULTIPLIER;
  }

  // Compute desired movement in camera-relative space
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  forward.y = 0; // keep movement horizontal (no flying)
  forward.normalize();

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  right.y = 0;
  right.normalize();

  let moveX = 0;
  let moveZ = 0;

  if (directionZ !== 0) {
    moveX += forward.x * directionZ * currentSpeed * deltaTime;
    moveZ += forward.z * directionZ * currentSpeed * deltaTime;
  }
  if (directionX !== 0) {
    moveX += right.x * directionX * currentSpeed * deltaTime;
    moveZ += right.z * directionX * currentSpeed * deltaTime;
  }

  // Prevent diagonal input from moving faster than a single direction.
  const requestedDistance = Math.hypot(moveX, moveZ);
  const maxDistance = currentSpeed * deltaTime;
  if (requestedDistance > maxDistance) {
    const scale = maxDistance / requestedDistance;
    moveX *= scale;
    moveZ *= scale;
  }

  // --- Collision detection applied to movement before applying position change ---
  const playerPos = player.getPosition();
  let newX = playerPos.x + moveX;
  let newZ = playerPos.z + moveZ;
  let finalX = playerPos.x;
  let finalZ = playerPos.z;

  // Test X movement independently (slide along walls)
  if (!checkCollision({ x: newX, y: playerPos.y, z: playerPos.z }, mapData.bounds)) {
    finalX = newX;
  }

  // Test Z movement independently (slide along walls)
  if (!checkCollision({ x: finalX, y: playerPos.y, z: newZ }, mapData.bounds)) {
    finalZ = newZ;
  }

  // --- Jump physics (Space key) with gravity ---
  let finalY = playerPos.y;
  if (KEYS.Space && !isJumping) {
    isJumping = true;
    verticalVelocity = JUMP_VELOCITY;
  }

  // Apply gravity
  verticalVelocity -= GRAVITY * deltaTime;
  finalY += verticalVelocity * deltaTime;

  // Ground check at y=0 — prevent falling through floor
  if (finalY <= 0) {
    finalY = 0;
    isJumping = false;
    verticalVelocity = 0;
  }

  // Commit new position to player entity
  player.setPosition(finalX, finalY, finalZ);

  // Sync camera to player position
  camera.position.x = finalX;
  camera.position.z = finalZ;
  camera.position.y = finalY + 1.7; // eye height
}

// ===========================================================================
// Wave completion check — triggered each frame during PLAYING state
// ===========================================================================
function checkWaveCompletion() {
  if (!waveSystem) return;

  const completed = waveSystem.checkWaveComplete();
  // If callback already handled the transition (victory), don't double-trigger
}

// ===========================================================================
// Game state transitions — death → game over, victory after all waves
// ===========================================================================
function checkGameStateTransitions() {
  if (player.isPlayerDead()) {
    setState(GameState.GAME_OVER);
  } else if (waveSystem && waveSystem.areAllWavesComplete()) {
    setState(GameState.VICTORY);
  }
}

// ===========================================================================
// Start the render loop
// ===========================================================================
animate();
