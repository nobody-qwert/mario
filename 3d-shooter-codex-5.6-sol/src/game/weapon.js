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

const MUZZLE_TIP_Z = -1.16;

// Gun offset from camera (right, down) — first-person perspective
const GUN_OFFSET_X = 0.34;
const GUN_OFFSET_Y = -0.28;
const GUN_OFFSET_Z = -0.48;

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

/** Make a compact beveled box without loading an external model or addon. */
function roundedBoxGeometry(width, height, depth, radius = 0.02) {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const shape = new THREE.Shape();
  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
  shape.lineTo(halfW, halfH - r);
  shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
  shape.lineTo(-halfW + r, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
  shape.lineTo(-halfW, -halfH + r);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);

  const bevel = Math.min(0.012, r * 0.45);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 3,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addPart(parent, geometry, mat, position, rotation = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, mat);
  part.position.set(...position);
  part.rotation.set(...rotation);
  parent.add(part);
  return part;
}

/**
 * Build the gun group from Three.js primitives and attach it to the camera.
 */
function buildGunModel(camera) {
  const group = new THREE.Group();
  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x222a31, metalness: 0.86, roughness: 0.24 });
  const blackMetal = new THREE.MeshStandardMaterial({ color: 0x080b0e, metalness: 0.92, roughness: 0.2 });
  const polymer = new THREE.MeshStandardMaterial({ color: 0x151b20, metalness: 0.15, roughness: 0.72 });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xff8a24, emissive: 0xff3c00, emissiveIntensity: 1.1,
    metalness: 0.35, roughness: 0.3,
  });
  const glove = new THREE.MeshStandardMaterial({ color: 0x30383c, roughness: 0.92 });
  const sleeve = new THREE.MeshStandardMaterial({ color: 0x29343b, roughness: 0.88 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x67dffa, emissive: 0x126f86, emissiveIntensity: 0.75,
    metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.55,
  });

  // Layered, beveled receiver and tapered stock establish the rifle silhouette.
  addPart(group, roundedBoxGeometry(0.2, 0.17, 0.5, 0.035), gunmetal, [0, 0, -0.22]);
  addPart(group, roundedBoxGeometry(0.165, 0.105, 0.62, 0.025), blackMetal, [0, 0.09, -0.35]);
  addPart(group, roundedBoxGeometry(0.17, 0.11, 0.27, 0.025), polymer, [0, -0.085, -0.055]);
  addPart(group, roundedBoxGeometry(0.16, 0.17, 0.25, 0.035), polymer, [0, -0.005, 0.155]);
  addPart(group, roundedBoxGeometry(0.19, 0.2, 0.055, 0.025), blackMetal, [0, -0.005, 0.305]);

  // Angled pistol grip, curved-looking magazine and trigger guard.
  addPart(group, new THREE.CapsuleGeometry(0.058, 0.14, 5, 10), polymer,
    [0, -0.18, 0.04], [-0.2, 0, 0]);
  addPart(group, roundedBoxGeometry(0.125, 0.27, 0.13, 0.035), blackMetal,
    [0, -0.225, -0.2], [-0.13, 0, 0]);
  addPart(group, new THREE.TorusGeometry(0.065, 0.011, 6, 18), blackMetal,
    [0, -0.115, -0.015]);

  // Faceted handguard, exposed barrel, gas tube and muzzle brake.
  addPart(group, new THREE.CylinderGeometry(0.09, 0.105, 0.36, 12), polymer,
    [0, 0.005, -0.73], [Math.PI / 2, 0, 0]);
  addPart(group, new THREE.CylinderGeometry(0.024, 0.029, 0.23, 12), blackMetal,
    [0, 0.008, -1.005], [Math.PI / 2, 0, 0]);
  addPart(group, new THREE.CylinderGeometry(0.047, 0.047, 0.115, 12), blackMetal,
    [0, 0.008, -1.105], [Math.PI / 2, 0, 0]);
  addPart(group, new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), gunmetal,
    [0, 0.105, -0.73], [Math.PI / 2, 0, 0]);

  // Cooling vents and top-rail teeth add scale cues without expensive textures.
  for (let i = 0; i < 4; i++) {
    addPart(group, roundedBoxGeometry(0.012, 0.034, 0.075, 0.004), blackMetal,
      [-0.101, 0.01, -0.61 - i * 0.075]);
    addPart(group, roundedBoxGeometry(0.012, 0.034, 0.075, 0.004), blackMetal,
      [0.101, 0.01, -0.61 - i * 0.075]);
  }
  for (let i = 0; i < 7; i++) {
    addPart(group, new THREE.BoxGeometry(0.14, 0.018, 0.035), gunmetal,
      [0, 0.157, -0.12 - i * 0.075]);
  }

  // Holographic optic with a translucent lens and protected illuminated reticle.
  addPart(group, roundedBoxGeometry(0.14, 0.035, 0.2, 0.012), blackMetal, [0, 0.18, -0.34]);
  addPart(group, roundedBoxGeometry(0.024, 0.14, 0.035, 0.008), blackMetal, [-0.065, 0.25, -0.38]);
  addPart(group, roundedBoxGeometry(0.024, 0.14, 0.035, 0.008), blackMetal, [0.065, 0.25, -0.38]);
  addPart(group, roundedBoxGeometry(0.14, 0.025, 0.035, 0.008), blackMetal, [0, 0.32, -0.38]);
  addPart(group, new THREE.PlaneGeometry(0.105, 0.09), glass, [0, 0.255, -0.397]);
  addPart(group, new THREE.RingGeometry(0.012, 0.016, 16), accent, [0, 0.255, -0.4]);

  // Charging handle and selector give the near side some mechanical detail.
  addPart(group, new THREE.CylinderGeometry(0.015, 0.015, 0.24, 10), blackMetal,
    [0, 0.075, -0.08], [0, 0, Math.PI / 2]);
  addPart(group, new THREE.CylinderGeometry(0.026, 0.026, 0.012, 10), accent,
    [0.108, -0.01, -0.08], [0, 0, Math.PI / 2]);

  // Two rounded hands and sleeves visually connect the rifle to the player.
  addPart(group, new THREE.CapsuleGeometry(0.068, 0.105, 5, 10), glove,
    [0.025, -0.22, 0.055], [-0.23, 0, 0]);
  addPart(group, new THREE.CapsuleGeometry(0.085, 0.25, 5, 10), sleeve,
    [0.08, -0.39, 0.2], [-0.43, 0, -0.08]);
  addPart(group, new THREE.CapsuleGeometry(0.07, 0.11, 5, 10), glove,
    [-0.035, -0.07, -0.7], [Math.PI / 2, 0, 0]);
  addPart(group, new THREE.CapsuleGeometry(0.085, 0.28, 5, 10), sleeve,
    [-0.11, -0.25, -0.5], [-0.62, 0, 0.18]);

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
  light.position.set(0, 0.008, MUZZLE_TIP_Z);
  sprite.position.set(0, 0.008, MUZZLE_TIP_Z);
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

    // Visual feedback: dim each shared material once during reload.
    const reloadMaterials = new Set();
    group.traverse((child) => {
      const mat = child.isMesh ? child.material : null;
      if (!mat?.emissive || reloadMaterials.has(mat)) return;
      reloadMaterials.add(mat);
      mat.userData.reloadEmissive = mat.emissive.getHex();
      mat.emissive.setHex(0x331100);
    });

    reloadTimer = setTimeout(() => {
      currentMagazine = MAGAZINE_CAPACITY;
      isReloading = false;
      reloadElapsed = 0;
      updateAmmo();

      // Restore emissive
      const restoredMaterials = new Set();
      group.traverse((child) => {
        const mat = child.isMesh ? child.material : null;
        if (!mat?.emissive || restoredMaterials.has(mat)) return;
        restoredMaterials.add(mat);
        mat.emissive.setHex(mat.userData.reloadEmissive ?? 0);
        delete mat.userData.reloadEmissive;
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

    // Raycast from the camera so a muzzle extending past a nearby wall cannot shoot through it.
    camera.updateMatrixWorld(true);
    group.updateWorldMatrix(true, false);
    const gunWorldPos = new THREE.Vector3(0, 0.008, MUZZLE_TIP_Z).applyMatrix4(group.matrixWorld);
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const direction = cameraForward.normalize();

    raycaster.set(camera.position, direction);

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
    const tipLocal = new THREE.Vector3(0, 0.008, MUZZLE_TIP_Z);
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
    const restoredMaterials = new Set();
    group.traverse((child) => {
      const mat = child.isMesh ? child.material : null;
      if (!mat?.emissive || restoredMaterials.has(mat)) return;
      restoredMaterials.add(mat);
      if (mat.userData.reloadEmissive !== undefined) {
        mat.emissive.setHex(mat.userData.reloadEmissive);
        delete mat.userData.reloadEmissive;
      }
    });
    updateAmmo();
  }

  return {
    group, fire, updateAmmo, update, getMuzzleTipWorldPos,
    reload: startReload, reset,
  };
}
