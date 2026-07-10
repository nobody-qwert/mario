/**
 * constants.js — Shared game constants
 * Loaded first so all other modules can use these globals.
 */

// ── Tile & world dimensions ──
const TILE = 32;
const COLS = 200;
const ROWS = 15;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

// Tile types
const T = {
  AIR: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE_LB: 4,   // pipe left-bottom
  PIPE_RB: 5,   // pipe right-bottom
  PIPE_LT: 6,   // pipe left-top
  PIPE_RT: 7,   // pipe right-top
  FLAG: 8,      // flag pole
  FLAG_TOP: 9,  // flag top (with flag)
  HARD: 10,     // indestructible block
  USED: 11,     // used question block
  WARP_PIPE: 12, // warp pipe (enter to go to another map)
  ELEVATOR: 13,  // elevator (ride to go back up)
  DARK_GROUND: 14, // underground ground
  CLOUD: -1,    // decoration (not solid)
  BUSH: -2      // decoration (not solid)
};

// Emoji map for tiles
const TILE_EMOJI = {
  [T.GROUND]: '🟫',
  [T.BRICK]: '🧱',
  [T.QUESTION]: '❓',
  [T.PIPE_LB]: '🟩',
  [T.PIPE_RB]: '🟩',
  [T.PIPE_LT]: '🟩',
  [T.PIPE_RT]: '🟩',
  [T.FLAG]: '🏁',
  [T.FLAG_TOP]: '🚩',
  [T.HARD]: '⬛',
  [T.USED]: '🔲',
  [T.WARP_PIPE]: '🟦',
  [T.ELEVATOR]: '🛗',
  [T.DARK_GROUND]: '🟪',
  [T.CLOUD]: '☁️',
  [T.BUSH]: '🌳'
};

// Solid tiles (for collision)
const SOLID = new Set([T.GROUND, T.BRICK, T.QUESTION, T.PIPE_LB, T.PIPE_RB, T.PIPE_LT, T.PIPE_RT, T.HARD, T.USED, T.DARK_GROUND]);

const TRANSITION = new Set([T.WARP_PIPE, T.ELEVATOR]);

// ── Player physics ──
const GRAVITY = 0.6;
const MAX_FALL = 12;
const MOVE_SPEED = 3.2;
const JUMP_FORCE = -13.5;
const GROUND_ROW = 13;
