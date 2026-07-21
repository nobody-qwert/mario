/**
 * Quake3-style symmetrical arena map builder.
 * Creates floor, outer walls, inner corridors, rooms and cover objects
 * using emoji-based CanvasTextures from src/assets/textures.js.
 */

import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
import {
  createConcreteWallTexture,
  createMetalFloorTexture,
  createWoodCrateTexture,
  createBarrelTexture,
  createDangerSignTexture,
} from '../assets/textures.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARENA_SIZE = 200;          // arena is ARENA_SIZE × ARENA_SIZE
const WALL_HEIGHT = 4;           // wall height in metres
const WALL_THICKNESS = 5;        // outer wall thickness
const CORRIDOR_WIDTH = 8;        // corridor width
const CORRIDOR_LENGTH = 30;      // corridor length from central area edge
const CENTRAL_RADIUS = 25;       // radius of the open central spawn zone

// Player dimensions for collision reference
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a textured box mesh and add it to the scene.
 * @param {THREE.Scene} scene - Three.js scene.
 * @param {number} w - Width (x).
 * @param {number} h - Height (y).
 * @param {number} d - Depth (z).
 * @param {number} x - Position x.
 * @param {number} y - Position y.
 * @param {number} z - Position z.
 * @param {THREE.Texture} texture - CanvasTexture to apply.
 * @returns {{ mesh: THREE.Mesh, bounds: { min: number[], max: number[] } }}
 */
function addBox(scene, w, h, d, x, y, z, texture) {
  const geo = new BoxGeometry(w, h, d);
  const mat = new MeshStandardMaterial({ map: texture });
  const mesh = new Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.userData.mapGeometry = true;
  mesh.castShadow = y > 0;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Compute AABB bounds for collision
  const halfW = w / 2;
  const halfH = h / 2;
  const halfD = d / 2;
  const bounds = {
    min: [x - halfW, y - halfH, z - halfD],
    max: [x + halfW, y + halfH, z + halfD],
  };

  return { mesh, bounds };
}

// ---------------------------------------------------------------------------
// Map building functions
// ---------------------------------------------------------------------------

/**
 * Build the arena floor.
 */
function buildFloor(scene) {
  const texture = createMetalFloorTexture();
  const { mesh } = addBox(scene, ARENA_SIZE, 0.2, ARENA_SIZE, 0, -0.1, 0, texture);
  mesh.receiveShadow = true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the full Quake3-style symmetrical arena map and add geometry to the scene.
 * @param {THREE.Scene} scene - Three.js scene to populate.
 * @returns {{ bounds: Array<{ min: number[], max: number[] }> }} All solid AABB bounds for collision detection.
 */
export function createMap(scene) {
  const allBounds = [];

  // Floor (non-solid for player — just visual ground)
  buildFloor(scene);

  // Outer walls (solid)
  const outerWallsResult = buildOuterWalls(scene, allBounds);
  allBounds.push(...outerWallsResult);

  // Inner corridor/room walls (solid)
  const innerWallsResult = buildInnerWalls(scene, allBounds);
  allBounds.push(...innerWallsResult);

  // Cover objects — crates (📦)
  const crateResult = buildCrates(scene, allBounds);
  allBounds.push(...crateResult);

  // Cover objects — pillars (barrel-textured)
  const pillarResult = buildPillars(scene, allBounds);
  allBounds.push(...pillarResult);

  // Cover objects — barrels (🛢️)
  const barrelResult = buildBarrels(scene, allBounds);
  allBounds.push(...barrelResult);

  // Cover objects — danger barriers (⚠️)
  const dangerResult = buildDangerBarriers(scene, allBounds);
  allBounds.push(...dangerResult);

  return {
    bounds: allBounds,
    meshes: scene.children.filter((child) => child.isMesh && child.userData.mapGeometry),
  };
}

/**
 * Build outer walls and collect their AABB bounds.
 */
function buildOuterWalls(scene, bounds) {
  const texture = createConcreteWallTexture();
  const halfArena = ARENA_SIZE / 2;
  const wallH = WALL_HEIGHT;
  const wallT = WALL_THICKNESS;

  const results = [];
  results.push(addBox(scene, ARENA_SIZE, wallH, wallT, 0, wallH / 2, -halfArena + wallT / 2, texture));
  results.push(addBox(scene, ARENA_SIZE, wallH, wallT, 0, wallH / 2, halfArena - wallT / 2, texture));
  results.push(addBox(scene, wallT, wallH, ARENA_SIZE, halfArena - wallT / 2, wallH / 2, 0, texture));
  results.push(addBox(scene, wallT, wallH, ARENA_SIZE, -halfArena + wallT / 2, wallH / 2, 0, texture));

  return results.map(r => r.bounds);
}

/**
 * Build inner walls and collect their AABB bounds.
 */
function buildInnerWalls(scene, bounds) {
  const texture = createConcreteWallTexture();
  const wallH = WALL_HEIGHT;
  const halfCorridor = CORRIDOR_WIDTH / 2;
  const corridorStart = CENTRAL_RADIUS + 0.5;

  const results = [];

  // North corridor walls
  results.push(addBox(scene, 1, wallH, CORRIDOR_LENGTH, -halfCorridor, wallH / 2, -corridorStart - CORRIDOR_LENGTH / 2, texture));
  results.push(addBox(scene, 1, wallH, CORRIDOR_LENGTH, halfCorridor, wallH / 2, -corridorStart - CORRIDOR_LENGTH / 2, texture));

  // South corridor walls
  results.push(addBox(scene, 1, wallH, CORRIDOR_LENGTH, -halfCorridor, wallH / 2, corridorStart + CORRIDOR_LENGTH / 2, texture));
  results.push(addBox(scene, 1, wallH, CORRIDOR_LENGTH, halfCorridor, wallH / 2, corridorStart + CORRIDOR_LENGTH / 2, texture));

  // East corridor walls
  results.push(addBox(scene, CORRIDOR_LENGTH, wallH, 1, corridorStart + CORRIDOR_LENGTH / 2, wallH / 2, -halfCorridor, texture));
  results.push(addBox(scene, CORRIDOR_LENGTH, wallH, 1, corridorStart + CORRIDOR_LENGTH / 2, wallH / 2, halfCorridor, texture));

  // West corridor walls
  results.push(addBox(scene, CORRIDOR_LENGTH, wallH, 1, -corridorStart - CORRIDOR_LENGTH / 2, wallH / 2, -halfCorridor, texture));
  results.push(addBox(scene, CORRIDOR_LENGTH, wallH, 1, -corridorStart - CORRIDOR_LENGTH / 2, wallH / 2, halfCorridor, texture));

  // Corner room divider walls
  const cornerOffset = CENTRAL_RADIUS + CORRIDOR_LENGTH + 5;
  const divLen = 10;

  results.push(addBox(scene, divLen, wallH, 1, -cornerOffset - divLen / 2, wallH / 2, -cornerOffset, texture));
  results.push(addBox(scene, 1, wallH, divLen, -cornerOffset, wallH / 2, -cornerOffset - divLen / 2, texture));

  results.push(addBox(scene, divLen, wallH, 1, cornerOffset + divLen / 2, wallH / 2, -cornerOffset, texture));
  results.push(addBox(scene, 1, wallH, divLen, cornerOffset, wallH / 2, -cornerOffset - divLen / 2, texture));

  results.push(addBox(scene, divLen, wallH, 1, -cornerOffset - divLen / 2, wallH / 2, cornerOffset, texture));
  results.push(addBox(scene, 1, wallH, divLen, -cornerOffset, wallH / 2, cornerOffset + divLen / 2, texture));

  results.push(addBox(scene, divLen, wallH, 1, cornerOffset + divLen / 2, wallH / 2, cornerOffset, texture));
  results.push(addBox(scene, 1, wallH, divLen, cornerOffset, wallH / 2, cornerOffset + divLen / 2, texture));

  // Central zone ring barriers
  const ringRadius = CENTRAL_RADIUS;
  const barrierW = 3;
  const barrierD = 1.5;
  const barrierH = 1.2;

  results.push(addBox(scene, barrierW, barrierH, barrierD, 0, barrierH / 2, -ringRadius, texture));
  results.push(addBox(scene, barrierW, barrierH, barrierD, 0, barrierH / 2, ringRadius, texture));
  results.push(addBox(scene, barrierD, barrierH, barrierW, -ringRadius, barrierH / 2, 0, texture));
  results.push(addBox(scene, barrierD, barrierH, barrierW, ringRadius, barrierH / 2, 0, texture));

  return results.map(r => r.bounds);
}

/**
 * Build crates and collect their AABB bounds.
 */
function buildCrates(scene, bounds) {
  const texture = createWoodCrateTexture();
  const crateSize = 1.5;
  const half = crateSize / 2;

  const results = [];

  // NW quadrant
  results.push(addBox(scene, crateSize, crateSize * 2, crateSize, -60, crateSize, -60, texture));
  results.push(addBox(scene, crateSize, crateSize, crateSize, -55, half, -55, texture));

  // NE quadrant
  results.push(addBox(scene, crateSize, crateSize * 2, crateSize, 60, crateSize, -60, texture));
  results.push(addBox(scene, crateSize, crateSize, crateSize, 55, half, -55, texture));

  // SW quadrant
  results.push(addBox(scene, crateSize, crateSize * 2, crateSize, -60, crateSize, 60, texture));
  results.push(addBox(scene, crateSize, crateSize, crateSize, -55, half, 55, texture));

  // SE quadrant
  results.push(addBox(scene, crateSize, crateSize * 2, crateSize, 60, crateSize, 60, texture));
  results.push(addBox(scene, crateSize, crateSize, crateSize, 55, half, 55, texture));

  return results.map(r => r.bounds);
}

/**
 * Build pillars and collect their AABB bounds.
 */
function buildPillars(scene, bounds) {
  const texture = createBarrelTexture();
  const radius = 0.8;
  const height = WALL_HEIGHT;

  const results = [];

  // NW corridor entrance
  results.push(addBox(scene, radius * 2, height, radius * 2, -CORRIDOR_WIDTH / 2 - 1, height / 2, -CENTRAL_RADIUS - 3, texture));
  results.push(addBox(scene, radius * 2, height, radius * 2, CORRIDOR_WIDTH / 2 + 1, height / 2, -CENTRAL_RADIUS - 3, texture));

  // NE corridor entrance
  results.push(addBox(scene, radius * 2, height, radius * 2, -CORRIDOR_WIDTH / 2 - 1, height / 2, CENTRAL_RADIUS + 3, texture));
  results.push(addBox(scene, radius * 2, height, radius * 2, CORRIDOR_WIDTH / 2 + 1, height / 2, CENTRAL_RADIUS + 3, texture));

  // SW corridor entrance
  results.push(addBox(scene, radius * 2, height, radius * 2, -CENTRAL_RADIUS - 3, height / 2, -CORRIDOR_WIDTH / 2 - 1, texture));
  results.push(addBox(scene, radius * 2, height, radius * 2, CENTRAL_RADIUS + 3, height / 2, -CORRIDOR_WIDTH / 2 - 1, texture));

  // SE corridor entrance
  results.push(addBox(scene, radius * 2, height, radius * 2, -CENTRAL_RADIUS - 3, height / 2, CORRIDOR_WIDTH / 2 + 1, texture));
  results.push(addBox(scene, radius * 2, height, radius * 2, CENTRAL_RADIUS + 3, height / 2, CORRIDOR_WIDTH / 2 + 1, texture));

  return results.map(r => r.bounds);
}

/**
 * Build barrels and collect their AABB bounds.
 */
function buildBarrels(scene, bounds) {
  const texture = createBarrelTexture();
  const barrelW = 1.2;
  const barrelH = 1.4;
  const barrelD = 1.2;

  const results = [];

  // NW quadrant
  results.push(addBox(scene, barrelW, barrelH, barrelD, -70, barrelH / 2, -50, texture));
  results.push(addBox(scene, barrelW, barrelH, barrelD, -68, barrelH / 2, -48, texture));

  // NE quadrant
  results.push(addBox(scene, barrelW, barrelH, barrelD, 70, barrelH / 2, -50, texture));
  results.push(addBox(scene, barrelW, barrelH, barrelD, 68, barrelH / 2, -48, texture));

  // SW quadrant
  results.push(addBox(scene, barrelW, barrelH, barrelD, -70, barrelH / 2, 50, texture));
  results.push(addBox(scene, barrelW, barrelH, barrelD, -68, barrelH / 2, 48, texture));

  // SE quadrant
  results.push(addBox(scene, barrelW, barrelH, barrelD, 70, barrelH / 2, 50, texture));
  results.push(addBox(scene, barrelW, barrelH, barrelD, 68, barrelH / 2, 48, texture));

  return results.map(r => r.bounds);
}

/**
 * Build danger barriers and collect their AABB bounds.
 */
function buildDangerBarriers(scene, bounds) {
  const texture = createDangerSignTexture();
  const barrierW = 0.5;
  const barrierH = 2;
  const barrierD = 3;

  const results = [];

  // Central zone diagonal barriers
  results.push(addBox(scene, barrierW, barrierH, barrierD, -18, barrierH / 2, -18, texture));
  results.push(addBox(scene, barrierW, barrierH, barrierD, 18, barrierH / 2, -18, texture));
  results.push(addBox(scene, barrierW, barrierH, barrierD, -18, barrierH / 2, 18, texture));
  results.push(addBox(scene, barrierW, barrierH, barrierD, 18, barrierH / 2, 18, texture));

  // Corridor mid-point barriers
  results.push(addBox(scene, barrierD, barrierH, barrierW, -35, barrierH / 2, 0, texture));
  results.push(addBox(scene, barrierD, barrierH, barrierW, 35, barrierH / 2, 0, texture));
  results.push(addBox(scene, barrierW, barrierH, barrierD, 0, barrierH / 2, -35, texture));
  results.push(addBox(scene, barrierW, barrierH, barrierD, 0, barrierH / 2, 35, texture));

  return results.map(r => r.bounds);
}
