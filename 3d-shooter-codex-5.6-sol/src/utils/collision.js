/**
 * Axis-Aligned Bounding Box (AABB) collision detection utilities.
 *
 * AABB intersection rule — two boxes overlap when on every axis:
 *   boxA.min < boxB.max  AND  boxA.max > boxB.min
 */

// Player dimensions used for collision expansion
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4; // half-width of the player capsule

/**
 * Compute a player AABB from a world position and the player radius/height.
 * @param {number} x - World X coordinate (center).
 * @param {number} y - World Y coordinate (feet / ground level).
 * @param {number} z - World Z coordinate (center).
 * @returns {{ min: number[], max: number[] }} Player AABB.
 */
function playerAABB(x, y, z) {
  return {
    min: [x - PLAYER_RADIUS, y, z - PLAYER_RADIUS],
    max: [x + PLAYER_RADIUS, y + PLAYER_HEIGHT, z + PLAYER_RADIUS],
  };
}

/**
 * Test whether two AABBs overlap on all three axes.
 * @param {{ min: number[], max: number[] }} boxA
 * @param {{ min: number[], max: number[] }} boxB
 * @returns {boolean} True if the boxes intersect (overlap).
 */
function aabbOverlap(boxA, boxB) {
  return (
    boxA.min[0] < boxB.max[0] &&
    boxA.max[0] > boxB.min[0] &&
    boxA.min[1] < boxB.max[1] &&
    boxA.max[1] > boxB.min[1] &&
    boxA.min[2] < boxB.max[2] &&
    boxA.max[2] > boxB.min[2]
  );
}

/**
 * Check whether a player at the given position collides with any solid bound.
 *
 * @param {{ x: number, y: number, z: number }} position - Player world position (feet).
 * @param {Array<{ min: number[], max: number[] }>} mapBounds - Array of AABB bounds from the map geometry.
 * @returns {boolean} True if the player overlaps at least one solid bound.
 */
export function checkCollision(position, mapBounds) {
  const pBox = playerAABB(position.x, position.y, position.z);

  for (let i = 0; i < mapBounds.length; i++) {
    if (aabbOverlap(pBox, mapBounds[i])) {
      return true; // collision detected
    }
  }

  return false; // no overlap — position is valid
}

/**
 * Check whether two arbitrary AABBs collide.
 * Useful for testing bounds arrays independently of player position.
 *
 * @param {{ min: number[], max: number[] }} boxA
 * @param {{ min: number[], max: number[] }} boxB
 * @returns {boolean} True if the boxes intersect.
 */
export function aabbCollision(boxA, boxB) {
  return aabbOverlap(boxA, boxB);
}
