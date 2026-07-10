/**
 * camera.js — Camera object for viewport tracking
 */

const Camera = {
  x: 0,
  y: 0,
  w: 800,
  h: 480,
  resize(width, height) {
    this.w = width;
    this.h = height;
  },
  centerOn(player) {
    // A small negative bound keeps Mario centered at the start of the level;
    // the exposed area is still painted by the sky background.
    const minX = Math.min(0, player.cx - this.w / 2);
    const maxX = Math.max(minX, WORLD_W - this.w);
    this.x = Math.max(minX, Math.min(player.cx - this.w / 2, maxX));
  },
  follow(player) {
    this.centerOn(player);
  }
};
