/**
 * camera.js — Camera object for viewport tracking
 */

const Camera = {
  x: 0,
  y: 0,
  w: 800,
  h: 480,
  follow(player) {
    // Deadzone: camera only moves when player passes 1/3 of screen
    const target = player.x - this.w * 0.35;
    if (target > this.x) {
      this.x = target;
    }
    // Clamp to world bounds
    this.x = Math.max(0, Math.min(this.x, WORLD_W - this.w));
  }
};
