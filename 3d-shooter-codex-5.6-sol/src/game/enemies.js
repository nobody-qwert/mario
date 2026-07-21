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
const MOBILE_PROFILE = window.matchMedia('(pointer: coarse)').matches
  || (navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 1024px)').matches);

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

function mesh(geometry, mat, x, y, z, parent, castsOnMobile = false) {
  const part = new THREE.Mesh(geometry, mat);
  part.position.set(x, y, z);
  // On phones, only silhouette-defining parts enter the costly shadow pass.
  part.castShadow = !MOBILE_PROFILE || castsOnMobile;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}

// Reused geometry keeps the more detailed soldiers inexpensive across waves.
const ENEMY_GEO = {
  torso: new THREE.CylinderGeometry(0.39, 0.29, 0.68, 10),
  abdomen: new THREE.CapsuleGeometry(0.25, 0.25, 5, 10),
  pelvis: new THREE.CylinderGeometry(0.29, 0.25, 0.24, 10),
  neck: new THREE.CylinderGeometry(0.105, 0.12, 0.15, 10),
  head: new THREE.SphereGeometry(1, 16, 12),
  visor: new THREE.CapsuleGeometry(0.055, 0.29, 4, 10),
  shoulder: new THREE.SphereGeometry(1, 12, 8),
  upperArm: new THREE.CapsuleGeometry(0.105, 0.24, 5, 8),
  forearm: new THREE.CapsuleGeometry(0.09, 0.25, 5, 8),
  hand: new THREE.SphereGeometry(0.105, 10, 8),
  upperLeg: new THREE.CapsuleGeometry(0.13, 0.3, 5, 9),
  shin: new THREE.CapsuleGeometry(0.105, 0.31, 5, 9),
  knee: new THREE.SphereGeometry(0.14, 10, 8),
  boot: new THREE.CapsuleGeometry(0.12, 0.18, 5, 9),
  rifleBody: new THREE.CapsuleGeometry(0.075, 0.48, 4, 8),
  rifleBarrel: new THREE.CylinderGeometry(0.027, 0.035, 0.34, 8),
};

/** Build an articulated armored soldier with pivot groups for animation. */
function createEnemyModel() {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  // Parts are authored toward -Z, then flipped so root.lookAt's +Z faces its target.
  rig.rotation.y = Math.PI;
  root.add(rig);

  const armor = material(0x24566b, { metalness: 0.35, roughness: 0.38 });
  const dark = material(0x101923, { metalness: 0.5, roughness: 0.3 });
  const cloth = material(0x202b35, { roughness: 0.9 });
  const skin = material(0x8f6048, { roughness: 0.82 });
  const visor = material(0xff4c35, {
    metalness: 0.1, roughness: 0.2, emissive: 0xff2200, emissiveIntensity: 2.2,
  });
  const weaponMetal = material(0x080c11, { metalness: 0.78, roughness: 0.24 });

  // Tapered torso over a softer undersuit makes the body read as anatomy, not a box.
  const torso = mesh(ENEMY_GEO.torso, armor, 0, 1.48, 0, rig, true);
  torso.scale.z = 0.68;
  torso.userData.tintable = true;
  const abdomen = mesh(ENEMY_GEO.abdomen, cloth, 0, 1.15, 0, rig);
  abdomen.scale.z = 0.72;
  const pelvis = mesh(ENEMY_GEO.pelvis, dark, 0, 0.98, 0, rig);
  pelvis.scale.z = 0.78;
  mesh(new THREE.TorusGeometry(0.275, 0.035, 6, 16), dark, 0, 1.08, 0, rig).rotation.x = Math.PI / 2;

  // Neck, head and layered helmet/face pieces.
  mesh(ENEMY_GEO.neck, skin, 0, 1.9, 0, rig);
  const head = mesh(ENEMY_GEO.head, skin, 0, 2.08, -0.005, rig);
  head.scale.set(0.235, 0.29, 0.22);
  const helmet = mesh(ENEMY_GEO.head, dark, 0, 2.15, 0.015, rig, true);
  helmet.scale.set(0.27, 0.24, 0.25);
  const visorMesh = mesh(ENEMY_GEO.visor, visor, 0, 2.11, -0.225, rig);
  visorMesh.rotation.z = Math.PI / 2;
  const jawGuard = mesh(new THREE.CylinderGeometry(0.16, 0.205, 0.16, 8), dark, 0, 1.94, -0.105, rig);
  jawGuard.rotation.x = Math.PI / 2;
  jawGuard.scale.z = 0.65;

  // Rounded shoulder shells bridge the torso and articulated arms.
  for (const side of [-1, 1]) {
    const shoulder = mesh(ENEMY_GEO.shoulder, armor, side * 0.43, 1.73, 0, rig);
    shoulder.scale.set(0.22, 0.16, 0.26);
  }

  function makeArm(side) {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(side * 0.46, 1.72, 0);
    shoulderPivot.rotation.z = -side * 0.24;
    rig.add(shoulderPivot);
    mesh(ENEMY_GEO.upperArm, armor, 0, -0.22, 0, shoulderPivot, true);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.46, 0);
    elbow.rotation.x = 0.92;
    shoulderPivot.add(elbow);
    mesh(ENEMY_GEO.forearm, cloth, 0, -0.215, 0, elbow);
    const hand = mesh(ENEMY_GEO.hand, dark, 0, -0.46, 0, elbow);
    hand.scale.set(0.9, 1.15, 0.9);
    return { pivot: shoulderPivot, elbow };
  }

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.18, 0.98, 0);
    rig.add(hip);
    mesh(ENEMY_GEO.upperLeg, cloth, 0, -0.24, 0, hip, true);

    const knee = new THREE.Group();
    knee.position.set(0, -0.48, 0);
    hip.add(knee);
    const kneePad = mesh(ENEMY_GEO.knee, armor, 0, 0, -0.075, knee);
    kneePad.scale.set(0.9, 0.75, 0.55);
    mesh(ENEMY_GEO.shin, dark, 0, -0.23, 0, knee, true);
    const boot = mesh(ENEMY_GEO.boot, dark, 0, -0.38, -0.105, knee);
    boot.rotation.x = Math.PI / 2;
    boot.scale.set(1.05, 1, 0.9);
    return { pivot: hip, knee };
  }

  const leftArmRig = makeArm(-1);
  const rightArmRig = makeArm(1);
  const leftLegRig = makeLeg(-1);
  const rightLegRig = makeLeg(1);

  // A compact rifle with cylindrical receiver, barrel, optic and magazine.
  const rifle = mesh(ENEMY_GEO.rifleBody, weaponMetal, 0.15, 1.45, -0.43, rig, true);
  rifle.rotation.x = Math.PI / 2;
  const enemyBarrel = mesh(ENEMY_GEO.rifleBarrel, weaponMetal, 0.15, 1.46, -0.87, rig);
  enemyBarrel.rotation.x = Math.PI / 2;
  mesh(new THREE.CapsuleGeometry(0.045, 0.13, 4, 8), dark, 0.15, 1.29, -0.35, rig).rotation.z = 0.15;
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.11, 8), visor, 0.15, 1.57, -0.51, rig).rotation.x = Math.PI / 2;
  const magazine = mesh(new THREE.CapsuleGeometry(0.055, 0.16, 4, 8), dark, 0.15, 1.27, -0.49, rig);
  magazine.rotation.z = 0.12;

  // Small backpack breaks up the rear silhouette without affecting collision.
  const backpack = mesh(new THREE.CapsuleGeometry(0.17, 0.28, 5, 10), dark, 0, 1.5, 0.27, rig);
  backpack.scale.x = 1.25;

  root.userData.rig = {
    rig,
    leftArm: leftArmRig.pivot,
    rightArm: rightArmRig.pivot,
    leftLeg: leftLegRig.pivot,
    rightLeg: rightLegRig.pivot,
    leftKnee: leftLegRig.knee,
    rightKnee: rightLegRig.knee,
    armor,
    visor,
  };
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
  rig.leftKnee.rotation.x = Math.max(0, -stride) * 0.55;
  rig.rightKnee.rotation.x = Math.max(0, stride) * 0.55;
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
