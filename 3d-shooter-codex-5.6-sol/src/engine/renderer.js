/**
 * Renderer and scene setup.
 * Exports { renderer, scene } for the main loop.
 */

import {
  WebGLRenderer, Scene, HemisphereLight, DirectionalLight, AmbientLight, Color, Fog,
  ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap,
} from 'three';

/**
 * Create a WebGL renderer and a basic scene with lighting.
 * @param {HTMLElement} container - DOM element to attach the canvas to.
 * @param {PerspectiveCamera} [camera] - Optional camera for resize aspect updates.
 * @returns {{ renderer: WebGLRenderer, scene: Scene }}
 */
export function createRenderer(container, camera) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  container.appendChild(renderer.domElement);

  // --- scene -----------------------------------------------------------
  const scene = new Scene();
  scene.background = new Color(0x17384b);
  scene.fog = new Fog(0x17384b, 55, 145);

  // Hemisphere light for ambient fill
  const hemiLight = new HemisphereLight(0xc8f2ff, 0x35434b, 2.35);
  scene.add(hemiLight);

  // Soft fill keeps weapon and enemies readable even when facing away from the sun.
  scene.add(new AmbientLight(0xb9dce8, 0.7));

  // Directional light for shading
  const dirLight = new DirectionalLight(0xffe2bd, 3.2);
  dirLight.position.set(18, 35, 12);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.left = -45;
  dirLight.shadow.camera.right = 45;
  dirLight.shadow.camera.top = 45;
  dirLight.shadow.camera.bottom = -45;
  scene.add(dirLight);

  // Floor is built by map.js (createMap) with proper texture.
  // Sky is handled by scene.background color set above.

  // Handle resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (camera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  });

  return { renderer, scene };
}
