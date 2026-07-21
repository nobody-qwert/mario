/**
 * Enemy system: animated procedural soldiers, navigation, combat and projectiles.
 * Everything is generated locally so the game works without a model host.
 */

import * as THREE from 'three';
import { playHit, playEnemyDeath } from '../assets/audio.js';

const MAX_ACTIVE_ENEMIES = 12;
const ENEMY_MAX_HP = 100;
const ENEMY_DAMAGE_PER_HIT = 25;
const DETECTION_RANGE = 75;
const ATTACK_RANGE = 20;
const PATROL_SPEED = 2.6;
const CHASE_SPEED = 4.2;
const PROJECTILE_SPEED = 17;
const PROJECTILE_LIFETIME = 4;
const DEATH_REMOVE_DELAY = 1.25;
const ENEMY_RADIUS = 0.48;

const COLOR_PATROL = new THREE.Color(0x5bbbd6);
const COLOR_CHASE = new THREE.Color(0xff8c42);
const COLOR_ATTACK = new THREE.Color(0xff4057);

const STATE = {
  PATROL: 'PATROL',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  DEAD: 'DEAD',
};

// Spawn inside the playable central approaches, not behind the distant arena walls.
const SPAWN_POINTS = [
  { x: -20, z: -18 }, { x: 20, z: -18 },
  { x: -20, z: 18 }, { x: 20, z: 18 },
  { x: 0, z: -20 }, { x: 0, z: 20 },
  { x: -20, z: 0 }, { x: 20, z: 0 },
];

const WAYPOINTS = [
  new THREE.Vector3(-13, 0, -13), new THREE.Vector3(0, 0, -17),
  new THREE.Vector3(13, 0, -13), new THREE.Vector3(17, 0, 0),
  new THREE.Vector3(13, 0, 13), new THREE.Vector3(0, 0, 17),
  new THREE.Vector3(-13, 0, 13), new THREE.Vector3(-17, 0, 0),
];

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.15,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function mesh(geometry, mat, x, y, z, parent) {
  const part = new THREE.Mesh(geometry, mat);
  part.position.set(x, y, z);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

/** Build a clean low-poly rig with pivot groups for code-driven animation. */
function createEnemyModel() {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  // Object3D.lookAt points +Z at its target; the modeled face points -Z.
  rig.rotation.y = Math.PI;
  root.add(rig);

  const armor = material(0x24566b, { metalness: 0.35, roughness: 0.38 });
  const dark = material(0x101923, { metalness: 0.5, roughness: 0.3 });
  const cloth = material(0x26313d, { roughness: 0.85 });
  const visor = material(0xff4c35, {
    metalness: 0.1, roughness: 0.2, emissive: 0xff2200, emissiveIntensity: 2.2,
  });

  // Torso, shoulder plate, belt and head give a readable silhouette.
  mesh(new THREE.BoxGeometry(0.72, 0.78, 0.42), armor, 0, 1.42, 0, rig).userData.tintable = true;
  mesh(new THREE.BoxGeometry(0.86, 0.16, 0.5), dark, 0, 1.72, 0, rig);
  mesh(new THREE.BoxGeometry(0.68, 0.14, 0.44), dark, 0, 1.02, 0, rig);
  mesh(new THREE.BoxGeometry(0.48, 0.44, 0.44), dark, 0, 2.03, 0, rig);
  mesh(new THREE.BoxGeometry(0.39, 0.12, 0.035), visor, 0, 2.07, -0.235, rig);

  function makeLimb(x, y, isArm) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    rig.add(pivot);
    const length = isArm ? 0.72 : 0.88;
    const width = isArm ? 0.2 : 0.25;
    mesh(new THREE.BoxGeometry(width, length, width), isArm ? armor : cloth, 0, -length / 2, 0, pivot);
    if (!isArm) mesh(new THREE.BoxGeometry(0.28, 0.16, 0.45), dark, 0, -length + 0.02, -0.1, pivot);
    return pivot;
  }

  const leftArm = makeLimb(-0.49, 1.7, true);
  const rightArm = makeLimb(0.49, 1.7, true);
  const leftLeg = makeLimb(-0.2, 1.0, false);
  const rightLeg = makeLimb(0.2, 1.0, false);

  // A visible enemy blaster held across the chest.
  const blaster = mesh(new THREE.BoxGeometry(0.14, 0.16, 0.82), dark, 0.37, 1.42, -0.42, rig);
  blaster.rotation.x = -0.08;
  mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8), dark, 0.37, 1.43, -0.98, rig).rotation.x = Math.PI / 2;

  root.userData.rig = { rig, leftArm, rightArm, leftLeg, rightLeg, armor, visor };
  return root;
}

function tintEnemy(enemy, color) {
  enemy.model.userData.rig.armor.color.lerp(color, 0.12);
}

function animateEnemy(enemy, deltaTime, moving) {
  enemy.animTime += deltaTime * (moving ? 8.5 : 2.5);
  const rig = enemy.model.userData.rig;
  const stride = moving ? Math.sin(enemy.animTime) * 0.72 : 0;
  const settle = moving ? Math.abs(Math.sin(enemy.animTime * 2)) * 0.055 : Math.sin(enemy.animTime) * 0.018;

  rig.leftLeg.rotation.x = stride;
  rig.rightLeg.rotation.x = -stride;
  rig.leftArm.rotation.x = -stride * 0.7 - 0.35;
  rig.rightArm.rotation.x = stride * 0.7 - 0.35;
  rig.rig.position.y = settle;
  rig.rig.rotation.z = moving ? Math.sin(enemy.animTime) * 0.035 : 0;
}

function isBlocked(position, bounds) {
  if (!bounds?.length) return false;
  return bounds.some((box) =>
    position.x + ENEMY_RADIUS > box.min[0] && position.x - ENEMY_RADIUS < box.max[0] &&
    0 < box.max[1] && 2.25 > box.min[1] &&
    position.z + ENEMY_RADIUS > box.min[2] && position.z - ENEMY_RADIUS < box.max[2]
  );
}

function moveEnemy(enemy, direction, distance, bounds) {
  const oldX = enemy.position.x;
  const oldZ = enemy.position.z;
  enemy.position.x += direction.x * distance;
  if (isBlocked(enemy.position, bounds)) enemy.position.x = oldX;
  enemy.position.z += direction.z * distance;
  if (isBlocked(enemy.position, bounds)) enemy.position.z = oldZ;
}

function checkLineOfSight(enemyPosition, playerPosition, obstacles) {
  const from = enemyPosition.clone().add(new THREE.Vector3(0, 1.35, 0));
  const to = playerPosition.clone();
  to.y = Math.max(to.y, 1.35);
  const offset = to.clone().sub(from);
  const distance = offset.length();
  const raycaster = new THREE.Raycaster(from, offset.normalize(), 0.1, distance - 0.35);
  return raycaster.intersectObjects(obstacles, false).length === 0;
}

function createProjectile(scene, origin, target) {
  const group = new THREE.Group();
  const glow = mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    material(0xff4422, { emissive: 0xff2200, emissiveIntensity: 3 }),
    0, 0, 0, group,
  );
  const light = new THREE.PointLight(0xff3311, 2.5, 5);
  group.add(light);
  group.position.copy(origin);
  scene.add(group);
  return {
    mesh: group,
    glow,
    velocity: target.clone().sub(origin).normalize().multiplyScalar(PROJECTILE_SPEED),
    lifetime: PROJECTILE_LIFETIME,
    previous: origin.clone(),
  };
}

function createEnemy(scene, spawnPoint, index) {
  const model = createEnemyModel();
  model.position.set(spawnPoint.x, 0, spawnPoint.z);
  scene.add(model);
  return {
    model,
    position: model.position.clone(),
    state: STATE.PATROL,
    hp: ENEMY_MAX_HP,
    waypointIndex: index % WAYPOINTS.length,
    attackCooldown: 0.5 + Math.random() * 0.7,
    deathTimer: 0,
    isDead: false,
    animTime: Math.random() * Math.PI * 2,
  };
}

export function createEnemySystem(scene, camera, onPlayerHit, mapBounds = []) {
  const enemies = [];
  const projectiles = [];
  let speedMultiplier = 1;
  let spawnCursor = 0;
  let obstacles = [];

  function refreshObstacles() {
    const enemyModels = new Set(enemies.map((enemy) => enemy.model));
    const projectileModels = new Set(projectiles.map((projectile) => projectile.mesh));
    obstacles = scene.children.filter((child) =>
      child.isMesh && !enemyModels.has(child) && !projectileModels.has(child) && child !== camera
    );
  }

  function spawnWave(count) {
    const toSpawn = Math.min(count, MAX_ACTIVE_ENEMIES - enemies.length);
    for (let i = 0; i < toSpawn; i++) {
      const point = SPAWN_POINTS[spawnCursor % SPAWN_POINTS.length];
      const enemy = createEnemy(scene, point, spawnCursor);
      enemies.push(enemy);
      spawnCursor++;
    }
    refreshObstacles();
  }

  function killEnemy(enemy) {
    if (enemy.isDead) return;
    enemy.state = STATE.DEAD;
    enemy.isDead = true;
    enemy.deathTimer = 0;
    playEnemyDeath();
  }

  function damageEnemy(enemy) {
    if (!enemy || enemy.isDead) return false;
    enemy.hp -= ENEMY_DAMAGE_PER_HIT;
    enemy.state = STATE.CHASE;
    playHit();
    const rig = enemy.model.userData.rig;
    rig.visor.emissiveIntensity = 7;
    rig.armor.emissive.setHex(0xffffff);
    rig.armor.emissiveIntensity = 1.5;
    enemy.hitFlash = 0.1;
    if (enemy.hp <= 0) killEnemy(enemy);
    return true;
  }

  function raycast(raycaster, maxDistance = Infinity) {
    const living = enemies.filter((enemy) => !enemy.isDead);
    const hits = raycaster.intersectObjects(living.map((enemy) => enemy.model), true);
    if (!hits.length || hits[0].distance >= maxDistance) return null;
    let node = hits[0].object;
    while (node.parent && !living.some((enemy) => enemy.model === node)) node = node.parent;
    const enemy = living.find((candidate) => candidate.model === node);
    if (!enemy) return null;
    damageEnemy(enemy);
    return { enemy, point: hits[0].point.clone() };
  }

  function updateEnemy(enemy, deltaTime, playerPos) {
    if (enemy.hitFlash > 0) {
      enemy.hitFlash -= deltaTime;
      if (enemy.hitFlash <= 0) {
        enemy.model.userData.rig.armor.emissiveIntensity = 0;
        enemy.model.userData.rig.visor.emissiveIntensity = 2.2;
      }
    }

    const offsetToPlayer = playerPos.clone().sub(enemy.position);
    offsetToPlayer.y = 0;
    const distance = offsetToPlayer.length();
    const canSeePlayer = distance < DETECTION_RANGE && checkLineOfSight(enemy.position, playerPos, obstacles);
    let moving = false;

    if (canSeePlayer && distance <= ATTACK_RANGE) enemy.state = STATE.ATTACK;
    else if (canSeePlayer) enemy.state = STATE.CHASE;
    else if (enemy.state !== STATE.PATROL) enemy.state = STATE.PATROL;

    if (enemy.state === STATE.PATROL) {
      const waypoint = WAYPOINTS[enemy.waypointIndex];
      const direction = waypoint.clone().sub(enemy.position);
      direction.y = 0;
      if (direction.length() < 1) enemy.waypointIndex = (enemy.waypointIndex + 1) % WAYPOINTS.length;
      else {
        direction.normalize();
        moveEnemy(enemy, direction, PATROL_SPEED * Math.min(speedMultiplier, 2.1) * deltaTime, mapBounds);
        enemy.model.lookAt(waypoint.x, enemy.position.y, waypoint.z);
        moving = true;
      }
      tintEnemy(enemy, COLOR_PATROL);
    } else if (enemy.state === STATE.CHASE) {
      const direction = offsetToPlayer.normalize();
      moveEnemy(enemy, direction, CHASE_SPEED * Math.min(speedMultiplier, 2.1) * deltaTime, mapBounds);
      enemy.model.lookAt(playerPos.x, enemy.position.y, playerPos.z);
      tintEnemy(enemy, COLOR_CHASE);
      moving = true;
    } else if (enemy.state === STATE.ATTACK) {
      enemy.model.lookAt(playerPos.x, enemy.position.y, playerPos.z);
      enemy.attackCooldown -= deltaTime;
      if (enemy.attackCooldown <= 0) {
        const origin = enemy.position.clone().add(new THREE.Vector3(0, 1.45, 0));
        const aim = playerPos.clone();
        aim.x += (Math.random() - 0.5) * 0.65;
        aim.y += (Math.random() - 0.5) * 0.35;
        aim.z += (Math.random() - 0.5) * 0.65;
        projectiles.push(createProjectile(scene, origin, aim));
        enemy.attackCooldown = Math.max(0.75, 1.45 / Math.sqrt(speedMultiplier));
      }
      tintEnemy(enemy, COLOR_ATTACK);
    }

    animateEnemy(enemy, deltaTime, moving);
    enemy.model.position.copy(enemy.position);
  }

  function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      projectile.previous.copy(projectile.mesh.position);
      projectile.mesh.position.addScaledVector(projectile.velocity, deltaTime);
      projectile.mesh.rotation.z += deltaTime * 12;
      projectile.lifetime -= deltaTime;

      const segment = new THREE.Line3(projectile.previous, projectile.mesh.position);
      const closest = new THREE.Vector3();
      segment.closestPointToPoint(camera.position, true, closest);
      const hitPlayer = closest.distanceTo(camera.position) < 0.65;

      if (hitPlayer || projectile.lifetime <= 0) {
        scene.remove(projectile.mesh);
        projectiles.splice(i, 1);
        if (hitPlayer && onPlayerHit) onPlayerHit(projectile.mesh.position.clone());
      }
    }
  }

  function update(deltaTime) {
    const playerPos = camera.position.clone();
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (enemy.isDead) {
        enemy.deathTimer += deltaTime;
        const t = Math.min(enemy.deathTimer / 0.55, 1);
        enemy.model.rotation.z = THREE.MathUtils.smoothstep(t, 0, 1) * -Math.PI / 2;
        enemy.model.position.y = -0.1 * t;
        enemy.model.scale.setScalar(1 - Math.max(0, enemy.deathTimer - 0.7) * 0.5);
        if (enemy.deathTimer >= DEATH_REMOVE_DELAY) {
          scene.remove(enemy.model);
          enemies.splice(i, 1);
        }
        continue;
      }
      updateEnemy(enemy, deltaTime, playerPos);
    }
    updateProjectiles(deltaTime);
  }

  function getEnemies() {
    return enemies.filter((enemy) => !enemy.isDead);
  }

  function clear() {
    for (const enemy of enemies) scene.remove(enemy.model);
    for (const projectile of projectiles) scene.remove(projectile.mesh);
    enemies.length = 0;
    projectiles.length = 0;
    spawnCursor = 0;
    speedMultiplier = 1;
    refreshObstacles();
  }

  function setWaveSpeedMultiplier(multiplier) {
    speedMultiplier = multiplier;
  }

  return { spawnWave, update, getEnemies, setWaveSpeedMultiplier, raycast, clear };
}

export { STATE as ENEMY_STATE };
