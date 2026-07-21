/**
 * Camera and PointerLockControls setup.
 * Exports { camera, controls } for use by the main loop.
 */

import { PerspectiveCamera } from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const CAMERA_HEIGHT = 1.7; // eye-level in metres

/**
 * Create a perspective camera and PointerLockControls bound to it.
 * @param {HTMLElement} container - DOM element the renderer is attached to.
 * @returns {{ camera: PerspectiveCamera, controls: PointerLockControls }}
 */
export function createCamera(container) {
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, CAMERA_HEIGHT, 5);

  const controls = new PointerLockControls(camera, container);

  return { camera, controls };
}
