/**
 * levels.js — Level design data (enemy types, spawn positions, warp pipes, elevators, map info)
 * Loaded after constants.js (needs TILE) but before entities.js (provides ENEMY_TYPES as global).
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

// ── Map / level metadata ──
const MAP_INFO = [
  { name: 'Surface', skyTop: '#5c94fc', skyMid: '#87ceeb', skyBot: '#b0e0ff' },
  { name: 'Underground', skyTop: '#1a1a2e', skyMid: '#16213e', skyBot: '#0f3460' },
];

const WARP_PIPES = [
  { map: 0, col: 53, topRow: 11, bottomRow: 12, targetMap: 1, targetCol: 3 },
  { map: 0, col: 120, topRow: 11, bottomRow: 12, targetMap: 1, targetCol: 80 },
];

const ELEVATORS = [
  { map: 1, col: 150, row: 12, targetMap: 0, targetCol: 58 },
];
