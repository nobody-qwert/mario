/**
 * Simple particle-effect system for impact sparks, explosions, and muzzle flash debris.
 *
 * Exports createParticleSystem(scene) returning { spawn(position, color, count), update(deltaTime) }.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const GRAVITY = -5;
const DEFAULT_COUNT = 5;
const PARTICLE_SIZE = 0.045;
const VELOCITY_SPREAD = 3.5;
const LIFETIME_MIN = 0.12;
const LIFETIME_MAX = 0.32;

// ---------------------------------------------------------------------------
// Particle factory
// ---------------------------------------------------------------------------

/**
 * Create the particle system manager.
 * @param {THREE.Scene} scene - Scene to add particles to.
 * @returns {{ spawn: Function, update: Function }}
 */
export function createParticleSystem(scene) {
  const active = []; // { mesh: THREE.Mesh, velocity: THREE.Vector3, lifetime: number, maxLifetime: number }
  const tracers = [];

  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.width = 32;
  sparkCanvas.height = 32;
  const sparkContext = sparkCanvas.getContext('2d');
  const sparkGradient = sparkContext.createRadialGradient(16, 16, 0, 16, 16, 16);
  sparkGradient.addColorStop(0, 'rgba(255,255,255,1)');
  sparkGradient.addColorStop(0.2, 'rgba(255,220,125,.95)');
  sparkGradient.addColorStop(0.55, 'rgba(255,120,35,.45)');
  sparkGradient.addColorStop(1, 'rgba(255,80,15,0)');
  sparkContext.fillStyle = sparkGradient;
  sparkContext.fillRect(0, 0, 32, 32);
  const sparkTexture = new THREE.CanvasTexture(sparkCanvas);

  /**
   * Spawn a burst of particles at a world position.
   * @param {THREE.Vector3} position - World-space origin.
   * @param {number} color - Hex colour (e.g. 0xffaa33).
   * @param {number} [count] - Number of particles (default DEFAULT_COUNT).
   */
  function spawn(position, color, count = DEFAULT_COUNT) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: sparkTexture,
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Sprite(mat);
      mesh.position.copy(position);
      const size = PARTICLE_SIZE * (0.65 + Math.random() * 0.7);
      mesh.scale.set(size, size, 1);

      // Random velocity in a hemisphere (mostly upward + spread)
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * VELOCITY_SPREAD,
        (Math.random() - 0.15) * VELOCITY_SPREAD,
        (Math.random() - 0.5) * VELOCITY_SPREAD
      );

      const maxLifetime = LIFETIME_MIN + Math.random() * (LIFETIME_MAX - LIFETIME_MIN);

      scene.add(mesh);
      active.push({ mesh, velocity, lifetime: maxLifetime, maxLifetime });
    }
  }

  /** Draw a brief additive streak from the muzzle to the impact point. */
  function spawnTracer(start, end) {
    const direction = end.clone().sub(start);
    const length = direction.length();
    if (length <= 0.01) return;

    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({
      color: 0xffd36a,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tracer = new THREE.Line(geometry, material);
    scene.add(tracer);
    tracers.push({ mesh: tracer, lifetime: 0.045, maxLifetime: 0.045 });
  }

  /**
   * Update all active particles for the given delta time.
   * Removes expired particles from the scene and internal array.
   * @param {number} deltaTime - Time since last frame in seconds.
   */
  function update(deltaTime) {
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];

      // Apply gravity
      p.velocity.y += GRAVITY * deltaTime;

      // Move
      p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));

      // Age
      p.lifetime -= deltaTime;

      // Fade opacity based on remaining lifetime
      const t = Math.max(0, p.lifetime / p.maxLifetime);
      p.mesh.material.opacity = t;

      // Remove expired
      if (p.lifetime <= 0) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        active.splice(i, 1);
      }
    }

    for (let i = tracers.length - 1; i >= 0; i--) {
      const tracer = tracers[i];
      tracer.lifetime -= deltaTime;
      tracer.mesh.material.opacity = Math.max(0, tracer.lifetime / tracer.maxLifetime) * 0.38;
      if (tracer.lifetime <= 0) {
        scene.remove(tracer.mesh);
        tracer.mesh.geometry.dispose();
        tracer.mesh.material.dispose();
        tracers.splice(i, 1);
      }
    }
  }

  return { spawn, spawnTracer, update };
}
