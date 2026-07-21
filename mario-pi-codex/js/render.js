/**
 * render.js — World and sky rendering
 */

/**
 * Draw the world (tiles + decorations)
 */
function drawWorld(ctx, map) {
  const startCol = Math.max(0, Math.floor(Camera.x / TILE));
  const endCol = Math.min(COLS - 1, Math.ceil((Camera.x + Camera.w) / TILE));
  const startRow = Math.max(0, Math.floor(Camera.y / TILE));
  const endRow = Math.min(ROWS - 1, Math.ceil((Camera.y + Camera.h) / TILE));

  ctx.font = `${TILE - 2}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const tile = map[r][c];
      if (tile === T.AIR) continue;
      const x = c * TILE - Camera.x + TILE / 2;
      const y = r * TILE - Camera.y + TILE / 2;
      ctx.fillText(TILE_EMOJI[tile] || '❓', x, y);
    }
  }
}

/**
 * Sky gradient background
 */
function drawSky(ctx, mapIndex) {
  const info = MAP_INFO[mapIndex] || MAP_INFO[0];
  const grad = ctx.createLinearGradient(0, 0, 0, Camera.h);
  grad.addColorStop(0, info.skyTop);
  grad.addColorStop(0.7, info.skyMid);
  grad.addColorStop(1, info.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, Camera.w, Camera.h);
}
