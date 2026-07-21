/**
 * Landscape-phone input: virtual movement stick, drag-to-look and action buttons.
 * Pointer events let the controls support both single-touch and multi-touch play.
 */

const LOOK_SENSITIVITY = 0.0032;
const MAX_PITCH = Math.PI / 2 - 0.08;
const STICK_RADIUS = 46;
const FIRE_INTERVAL = 0.105;

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches
    || (navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 1024px)').matches);
}

export function createMobileInput(camera, { onFire, onReload }) {
  const enabled = isTouchDevice();
  const state = {
    moveX: 0,
    moveY: 0,
    sprint: false,
    jump: false,
    fire: false,
  };

  if (!enabled) {
    return {
      enabled: false,
      state,
      update() {},
      enterGameplay() {},
      leaveGameplay() {},
      isLandscape: () => true,
    };
  }

  document.body.classList.add('touch-device');
  camera.rotation.order = 'YXZ';

  const moveZone = document.getElementById('move-zone');
  const moveStick = document.getElementById('move-stick');
  const lookZone = document.getElementById('look-zone');
  const fireButton = document.getElementById('fire-btn');
  const jumpButton = document.getElementById('jump-btn');
  const sprintButton = document.getElementById('sprint-btn');
  const reloadButton = document.getElementById('reload-btn');

  let movePointer = null;
  let lookPointer = null;
  let lookX = 0;
  let lookY = 0;
  let fireCooldown = 0;
  let playing = false;

  function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function updateStick(clientX, clientY) {
    const rect = moveZone.getBoundingClientRect();
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > STICK_RADIUS) {
      dx *= STICK_RADIUS / distance;
      dy *= STICK_RADIUS / distance;
    }

    state.moveX = dx / STICK_RADIUS;
    state.moveY = -dy / STICK_RADIUS;
    moveStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  function resetStick() {
    movePointer = null;
    state.moveX = 0;
    state.moveY = 0;
    moveStick.style.transform = 'translate(-50%, -50%)';
  }

  moveZone.addEventListener('pointerdown', (event) => {
    if (movePointer !== null) return;
    stopEvent(event);
    movePointer = event.pointerId;
    moveZone.setPointerCapture(event.pointerId);
    updateStick(event.clientX, event.clientY);
  });
  moveZone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== movePointer) return;
    stopEvent(event);
    updateStick(event.clientX, event.clientY);
  });
  moveZone.addEventListener('pointerup', (event) => {
    if (event.pointerId !== movePointer) return;
    stopEvent(event);
    resetStick();
  });
  moveZone.addEventListener('pointercancel', (event) => {
    if (event.pointerId === movePointer) resetStick();
  });

  lookZone.addEventListener('pointerdown', (event) => {
    if (lookPointer !== null) return;
    stopEvent(event);
    lookPointer = event.pointerId;
    lookX = event.clientX;
    lookY = event.clientY;
    lookZone.setPointerCapture(event.pointerId);
  });
  lookZone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== lookPointer || !playing) return;
    stopEvent(event);
    const dx = event.clientX - lookX;
    const dy = event.clientY - lookY;
    lookX = event.clientX;
    lookY = event.clientY;

    camera.rotation.y -= dx * LOOK_SENSITIVITY;
    camera.rotation.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH,
      camera.rotation.x - dy * LOOK_SENSITIVITY));
  });
  const endLook = (event) => {
    if (event.pointerId !== lookPointer) return;
    stopEvent(event);
    lookPointer = null;
  };
  lookZone.addEventListener('pointerup', endLook);
  lookZone.addEventListener('pointercancel', (event) => {
    if (event.pointerId === lookPointer) lookPointer = null;
  });

  function bindHeldButton(button, stateKey) {
    const release = (event) => {
      stopEvent(event);
      state[stateKey] = false;
      button.classList.remove('active');
    };
    button.addEventListener('pointerdown', (event) => {
      stopEvent(event);
      button.setPointerCapture(event.pointerId);
      state[stateKey] = true;
      button.classList.add('active');
      if (stateKey === 'fire') {
        fireCooldown = 0;
        onFire();
        fireCooldown = FIRE_INTERVAL;
      }
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  bindHeldButton(fireButton, 'fire');
  bindHeldButton(jumpButton, 'jump');
  bindHeldButton(sprintButton, 'sprint');

  reloadButton.addEventListener('pointerdown', (event) => {
    stopEvent(event);
    reloadButton.setPointerCapture(event.pointerId);
    reloadButton.classList.add('active');
    onReload();
  });
  const releaseReload = (event) => {
    stopEvent(event);
    reloadButton.classList.remove('active');
  };
  reloadButton.addEventListener('pointerup', releaseReload);
  reloadButton.addEventListener('pointercancel', releaseReload);

  function clearState() {
    resetStick();
    lookPointer = null;
    state.sprint = false;
    state.jump = false;
    state.fire = false;
    fireButton.classList.remove('active');
    jumpButton.classList.remove('active');
    sprintButton.classList.remove('active');
    reloadButton.classList.remove('active');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearState();
  });
  window.addEventListener('blur', clearState);
  window.addEventListener('orientationchange', clearState);
  document.addEventListener('contextmenu', (event) => event.preventDefault());

  function update(deltaTime) {
    if (!playing || !state.fire) return;
    fireCooldown -= deltaTime;
    while (fireCooldown <= 0) {
      onFire();
      fireCooldown += FIRE_INTERVAL;
    }
  }

  function enterGameplay() {
    playing = true;
    document.body.classList.add('playing', 'locked');

    // Supported Android browsers can hide browser chrome and lock landscape.
    // iOS safely ignores these optional APIs while CSS still handles orientation.
    const fullscreenRequest = document.fullscreenElement
      ? Promise.resolve()
      : document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    Promise.resolve(fullscreenRequest)
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  }

  function leaveGameplay() {
    playing = false;
    clearState();
    document.body.classList.remove('playing', 'locked');
  }

  const isLandscape = () => window.innerWidth > window.innerHeight;

  return { enabled, state, update, enterGameplay, leaveGameplay, isLandscape };
}
