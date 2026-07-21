/**
 * Hitscan weapon system — gun model, raycasting shooting, muzzle flash, ammo HUD, recoil.
 *
 * Exports createWeapon(camera) returning { group, fire(), updateAmmo(), update() }.
 */

import * as THREE from 'three';
import { playGunshot } from '../assets/audio.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAGAZINE_CAPACITY = 30;
const RELOAD_DURATION = 1.5; // seconds
const MUZZLE_FLASH_DURATION = 0.045;
const MUZZLE_LIGHT_DISTANCE = 8;
const MUZZLE_LIGHT_INTENSITY = 2;

// Recoil animation
const RECOIL_KICKBACK = 0.08; // metres the gun kicks back on fire
const RECOIL_RECOVERY = 0.15; // seconds to smoothly return to rest position

// Gun model dimensions (metres)
const BODY_WIDTH = 0.14;
const BODY_HEIGHT = 0.16;
const BODY_DEPTH = 0.55;
const BARREL_RADIUS = 0.035;
const BARREL_LENGTH = 0.32;

// Gun offset from camera (right, down) — first-person perspective
const GUN_OFFSET_X = 0.32;
const GUN_OFFSET_Y = -0.26;
const GUN_OFFSET_Z = -0.52;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a small glow sprite for the muzzle flash.
 */
function createMuzzleFlashSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Radial gradient: bright yellow-white center fading to transparent orange
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.8)');
  gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.14, 0.14, 1);

  return sprite;
}

// ---------------------------------------------------------------------------
// Gun model builder
// ---------------------------------------------------------------------------

/**
 * Build the gun group from Three.js primitives and attach it to the camera.
 */
function buildGunModel(camera) {
  const group = new THREE.Group();

  // --- Body (BoxGeometry) ---
  const bodyGeo = new THREE.BoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x202833, metalness: 0.75, roughness: 0.25 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);

  // --- Barrel (CylinderGeometry) ---
  const barrelGeo = new THREE.CylinderGeometry(BARREL_RADIUS, BARREL_RADIUS, BARREL_LENGTH, 12);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x090d12, metalness: 0.9, roughness: 0.18 });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.rotation.x = Math.PI / 2; // point along -Z (forward)
  barrel.position.z = -BODY_DEPTH / 2 - BARREL_LENGTH / 2 + 0.05;

  // --- Grip hint (small box below body) ---
  const gripGeo = new THREE.BoxGeometry(BODY_WIDTH * 0.8, BODY_HEIGHT * 1.2, BODY_DEPTH * 0.3);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x151a20, roughness: 0.8 });
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.set(0, -BODY_HEIGHT / 2 - BODY_HEIGHT * 0.6, BODY_DEPTH * 0.15);

  // Bright receiver strip and sights keep the silhouette readable in dark areas.
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xff8a24, emissive: 0xff3c00, emissiveIntensity: 1.1,
    metalness: 0.35, roughness: 0.3,
  });
  const accent = new THREE.Mesh(new THREE.BoxGeometry(BODY_WIDTH * 1.05, 0.025, BODY_DEPTH * 0.62), accentMat);
  accent.position.set(0, BODY_HEIGHT / 2 + 0.006, -0.03);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.065, 0.035), accentMat);
  sight.position.set(0, BODY_HEIGHT / 2 + 0.04, -BODY_DEPTH / 2 + 0.04);

  // A simple gloved hand anchors the weapon to the first-person view.
  const handMat = new THREE.MeshStandardMaterial({ color: 0x6f4936, roughness: 0.9 });
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.18), handMat);
  hand.position.set(0.02, -0.17, 0.1);
  hand.rotation.x = -0.25;

  group.add(body);
  group.add(barrel);
  group.add(grip);
  group.add(accent);
  group.add(sight);
  group.add(hand);

  // Position the gun relative to camera (right-hand side, slightly down)
  group.position.set(GUN_OFFSET_X, GUN_OFFSET_Y, GUN_OFFSET_Z);

  // Attach as child of camera so it follows view direction
  camera.add(group);

  return group;
}

// ---------------------------------------------------------------------------
// Muzzle flash system
// ---------------------------------------------------------------------------

/**
 * Create the muzzle flash visual effect (PointLight + sprite).
 */
function createMuzzleFlash(group) {
  const light = new THREE.PointLight(0xffaa33, MUZZLE_LIGHT_INTENSITY, MUZZLE_LIGHT_DISTANCE);
  const sprite = createMuzzleFlashSprite();
  const tipZ = -BODY_DEPTH / 2 - BARREL_LENGTH + 0.05;
  light.position.set(0, 0, tipZ);
  sprite.position.set(0, 0, tipZ);
  light.intensity = 0;
  sprite.visible = false;
  group.add(light, sprite);

  return { light, sprite };
}

// ---------------------------------------------------------------------------
// Weapon factory
// ---------------------------------------------------------------------------

/**
 * Create a hitscan weapon attached to the given camera.
 * @param {THREE.Camera} camera - The FPS camera (with PointerLockControls).
 * @returns {{ group: THREE.Group, fire: Function, updateAmmo: Function }}
 */
export function createWeapon(camera) {
  // --- Build gun model ---
  const group = buildGunModel(camera);

  // --- Muzzle flash ---
  const muzzleFlash = createMuzzleFlash(group);

  // --- Ammo state machine ---
  let currentMagazine = MAGAZINE_CAPACITY;
  let isReloading = false;
  let reloadTimer = null;
  let reloadElapsed = 0;

  // --- Recoil animation state ---
  let recoilOffset = 0;       // current Z offset from rest position
  let recoilRecoveryTime = 0; // remaining recovery time
  let motionTime = 0;
  const restPosition = new THREE.Vector3(GUN_OFFSET_X, GUN_OFFSET_Y, GUN_OFFSET_Z);

  function updateAmmo() {
    const hudEl = document.getElementById('ammo-hud');
    if (hudEl) {
      hudEl.textContent = `AMMO: ${currentMagazine}/${MAGAZINE_CAPACITY}`;
    }
  }

  /**
   * Trigger a reload. Takes RELOAD_DURATION seconds.
   */
  function startReload() {
    if (isReloading || currentMagazine === MAGAZINE_CAPACITY) return;
    isReloading = true;
    reloadElapsed = 0;

    // Visual feedback: dim the gun slightly during reload
    group.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material._origEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
        if (child.material.emissive) {
          child.material.emissive.setHex(0x331100);
        }
      }
    });

    reloadTimer = setTimeout(() => {
      currentMagazine = MAGAZINE_CAPACITY;
      isReloading = false;
      reloadElapsed = 0;
      updateAmmo();

      // Restore emissive
      group.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.setHex(child.material._origEmissive || 0);
        }
      });
    }, RELOAD_DURATION * 1000);
  }

  /**
   * Trigger muzzle flash effect — light on briefly, then fade.
   */
  function triggerMuzzleFlash() {
    // Turn on the light and sprite
    muzzleFlash.light.intensity = MUZZLE_LIGHT_INTENSITY;
    muzzleFlash.sprite.visible = true;
    muzzleFlash.sprite.material.opacity = 1;

    // Fade out after a brief moment
    setTimeout(() => {
      muzzleFlash.light.intensity = 0;
      muzzleFlash.sprite.material.opacity = 0;
    }, MUZZLE_FLASH_DURATION * 1000);
  }

  /**
   * Trigger recoil — gun kicks back along its local Z axis.
   */
  function triggerRecoil() {
    recoilOffset = Math.min(recoilOffset + RECOIL_KICKBACK, RECOIL_KICKBACK * 1.8);
    recoilRecoveryTime = RECOIL_RECOVERY;
  }

  /**
   * Fire the weapon — hitscan raycast from camera center.
   */
  function fire() {
    // Can't fire while reloading or if empty
    if (isReloading || currentMagazine <= 0) {
      if (!isReloading && currentMagazine <= 0) {
        startReload();
      }
      return;
    }

    // Decrement ammo
    currentMagazine--;
    updateAmmo();

    // Play gunshot audio
    playGunshot();

    // Trigger muzzle flash visual effect
    triggerMuzzleFlash();

    // Trigger recoil animation (after flash so tip position is correct)
    triggerRecoil();

    // --- Hitscan raycast ---
    const raycaster = new THREE.Raycaster();

    // Ray origin: slightly offset from camera center (gun position) in world space
    const gunWorldPos = new THREE.Vector3(GUN_OFFSET_X, GUN_OFFSET_Y, GUN_OFFSET_Z);
    gunWorldPos.applyMatrix4(camera.matrixWorld);

    // Converge the muzzle ray on the screen centre so hits match the crosshair.
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const aimPoint = camera.position.clone().addScaledVector(cameraForward, 100);
    const direction = aimPoint.sub(gunWorldPos).normalize();

    raycaster.set(gunWorldPos, direction);

    // The fire method returns hit info so callers can use the raycaster
    // to detect enemy hits. External code should call:
    //   const result = weapon.fire();
    //   const intersects = result.raycaster.intersectObjects(sceneObjects);
    // Return hit information for external processing.
    return {
      origin: gunWorldPos.clone(),
      direction: direction.clone(),
      raycaster,
    };
  }

  /**
   * Update recoil animation each frame.
   * @param {number} deltaTime - Time since last frame in seconds.
   */
  function update(deltaTime, movementAmount = 0) {
    motionTime += deltaTime * (movementAmount > 0 ? 9 : 2);
    recoilRecoveryTime = Math.max(0, recoilRecoveryTime - deltaTime);
    recoilOffset = THREE.MathUtils.damp(recoilOffset, 0, 18, deltaTime);
    const bob = Math.min(1, movementAmount);
    group.position.x = restPosition.x + Math.sin(motionTime) * 0.012 * bob;
    group.position.y = restPosition.y + Math.abs(Math.cos(motionTime)) * 0.012 * bob;
    group.position.z = restPosition.z + recoilOffset;
    if (isReloading) {
      reloadElapsed += deltaTime;
      const reloadProgress = Math.min(reloadElapsed / RELOAD_DURATION, 1);
      group.rotation.x = Math.sin(reloadProgress * Math.PI) * 0.42;
      group.rotation.z = -Math.sin(reloadProgress * Math.PI) * 0.22;
    } else {
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0, 18, deltaTime);
      group.rotation.z = Math.sin(motionTime * 0.5) * 0.012 * bob;
    }
  }

  /**
   * Get the muzzle tip position in world space.
   * @returns {THREE.Vector3}
   */
  function getMuzzleTipWorldPos() {
    const tipLocal = new THREE.Vector3(
      0, 0, -BODY_DEPTH / 2 - BARREL_LENGTH + 0.05
    );
    return tipLocal.clone().applyMatrix4(group.matrixWorld);
  }

  function reset() {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = null;
    currentMagazine = MAGAZINE_CAPACITY;
    isReloading = false;
    reloadElapsed = 0;
    recoilOffset = 0;
    recoilRecoveryTime = 0;
    group.position.copy(restPosition);
    group.rotation.set(0, 0, 0);
    group.visible = true;
    muzzleFlash.light.intensity = 0;
    muzzleFlash.sprite.visible = false;
    group.traverse((child) => {
      if (child.isMesh && child.material?.emissive && child.material._origEmissive !== undefined) {
        child.material.emissive.setHex(child.material._origEmissive);
      }
    });
    updateAmmo();
  }

  return {
    group, fire, updateAmmo, update, getMuzzleTipWorldPos,
    reload: startReload, reset,
  };
}
