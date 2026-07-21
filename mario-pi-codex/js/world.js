/**
 * world.js — Tilemap level data, camera, and world rendering
 */

/**
 * Build the level map (2D array: map[row][col])
 * Inspired by World 1-1
 */
function buildLevel() {
  const map = Array.from({ length: ROWS }, () => new Int8Array(COLS));

  // ── Ground (rows 13-14, with gaps) ──
  for (let c = 0; c < COLS; c++) {
    // Gaps at columns 69-71 and 86-88
    if ((c >= 69 && c <= 71) || (c >= 86 && c <= 88)) continue;
    map[13][c] = T.GROUND;
    map[14][c] = T.GROUND;
  }

  // ── Pipes ──
  function placePipe(col, height) {
    const baseRow = 13 - height;
    map[baseRow][col] = T.PIPE_LT;
    map[baseRow][col + 1] = T.PIPE_RT;
    for (let r = baseRow + 1; r < 13; r++) {
      map[r][col] = T.PIPE_LB;
      map[r][col + 1] = T.PIPE_RB;
    }
  }
  placePipe(28, 2);
  placePipe(38, 3);
  placePipe(46, 4);
  placePipe(57, 4);
  placePipe(163, 2);

  // ── Warp pipes (enter to go underground) ──
  WARP_PIPES.filter(w => w.map === 0).forEach(w => {
    for (let r = w.topRow; r <= w.bottomRow; r++) {
      map[r][w.col] = T.WARP_PIPE;
      map[r][w.col + 1] = T.WARP_PIPE;
    }
  });

  function placeBlocks(row, layout) {
    layout.forEach(([col, tile]) => {
      map[row][col] = tile;
    });
  }

  // ── Floating block lanes ──
  // Row 9 is the normal ground-jump target: two empty rows above Mario's head.
  placeBlocks(9, [
    [16, T.QUESTION],
    [21, T.QUESTION], [22, T.BRICK], [23, T.QUESTION],
    [24, T.BRICK], [25, T.QUESTION], [26, T.BRICK],
    [77, T.BRICK], [78, T.QUESTION], [79, T.BRICK],
    [96, T.BRICK], [97, T.BRICK], [98, T.QUESTION], [99, T.BRICK],
    [112, T.QUESTION], [113, T.BRICK], [114, T.QUESTION],
  ]);

  // Higher blocks are placed above open space or lower block lanes, not at body level.
  placeBlocks(5, [
    [23, T.QUESTION],
    [80, T.QUESTION], [81, T.QUESTION],
    [97, T.QUESTION],
    [113, T.BRICK],
  ]);

  // Short midair ledges give enemies/coins readable places without crowding Mario.
  placeBlocks(8, [
    [82, T.BRICK], [83, T.BRICK], [84, T.BRICK],
    [145, T.BRICK], [146, T.QUESTION], [147, T.BRICK],
  ]);

  // Staircase near end (columns 134-142)
  for (let step = 0; step < 4; step++) {
    for (let r = 12 - step; r < 13; r++) {
      map[r][134 + step] = T.HARD;
    }
  }
  // Descending staircase
  for (let step = 0; step < 4; step++) {
    for (let r = 9 + step; r < 13; r++) {
      map[r][141 - step] = T.HARD;
    }
  }

  // Final staircase to flag
  for (let step = 0; step < 8; step++) {
    for (let r = 12 - step; r < 13; r++) {
      map[r][185 + step] = T.HARD;
    }
  }

  // ── Flag ──
  map[4][193] = T.FLAG_TOP;
  for (let r = 5; r < 13; r++) {
    map[r][193] = T.FLAG;
  }

  // ── Decorations (clouds) ──
  const clouds = [
    { r: 2, c: 10 }, { r: 2, c: 11 }, { r: 2, c: 12 },
    { r: 2, c: 30 }, { r: 2, c: 31 },
    { r: 1, c: 50 }, { r: 1, c: 51 }, { r: 1, c: 52 },
    { r: 2, c: 70 }, { r: 2, c: 71 },
    { r: 1, c: 95 }, { r: 1, c: 96 }, { r: 1, c: 97 },
    { r: 2, c: 120 }, { r: 2, c: 121 },
    { r: 1, c: 150 }, { r: 1, c: 151 },
    { r: 2, c: 175 }, { r: 2, c: 176 },
  ];
  clouds.forEach(({ r, c }) => { map[r][c] = T.CLOUD; });

  // Bushes
  const bushes = [
    { r: 12, c: 15 }, { r: 12, c: 16 },
    { r: 12, c: 45 },
    { r: 12, c: 100 }, { r: 12, c: 101 }, { r: 12, c: 102 },
    { r: 12, c: 160 },
  ];
  bushes.forEach(({ r, c }) => { map[r][c] = T.BUSH; });

  return map;
}

/**
 * Build the underground level map
 */
function buildUnderground() {
  const map = Array.from({ length: ROWS }, () => new Int8Array(COLS));

  // Ground (rows 13-14, with gaps)
  for (let c = 0; c < COLS; c++) {
    if ((c >= 40 && c <= 42) || (c >= 90 && c <= 92)) continue;
    map[13][c] = T.DARK_GROUND;
    map[14][c] = T.DARK_GROUND;
  }

  // Platforms
  for (let c = 15; c <= 20; c++) map[10][c] = T.BRICK;
  for (let c = 30; c <= 35; c++) map[8][c] = T.BRICK;
  for (let c = 50; c <= 55; c++) map[10][c] = T.BRICK;
  for (let c = 65; c <= 70; c++) map[9][c] = T.BRICK;
  for (let c = 100; c <= 105; c++) map[10][c] = T.BRICK;
  for (let c = 115; c <= 120; c++) map[8][c] = T.BRICK;

  // Question blocks stay in true air lanes, leaving headroom above platforms.
  [[18, 7], [33, 5], [53, 7], [68, 6], [103, 7], [118, 5], [132, 9]]
    .forEach(([col, row]) => { map[row][col] = T.QUESTION; });

  // Elevator (ride to go back to surface)
  const elev = ELEVATORS.find(e => e.map === 1);
  if (elev) {
    map[elev.row][elev.col] = T.ELEVATOR;
    map[elev.row][elev.col + 1] = T.ELEVATOR;

    // Stop the underground route at the elevator so players cannot skip it
    // and continue into the unused low-level world.
    for (let r = 0; r <= 12; r++) {
      map[r][elev.col + 3] = T.HARD;
    }
  }

  return map;
}

/**
 * Load a map by index (0 = surface, 1 = underground)
 */
function loadMap(index) {
  if (index === 1) return buildUnderground();
  return buildLevel();
}

/**
 * Get tile at world coordinates
 */
function getTile(map, wx, wy) {
  const col = Math.floor(wx / TILE);
  const row = Math.floor(wy / TILE);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return T.AIR;
  return map[row][col];
}

/**
 * Set tile in map
 */
function setTile(map, col, row, value) {
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    map[row][col] = value;
  }
}

