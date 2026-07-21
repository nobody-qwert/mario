/**
 * Keyboard state tracking for WASD movement.
 * Exports a mutable key-state object and attach/detach listeners.
 */

const KEYS = { w: false, a: false, s: false, d: false };

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW': KEYS.w = true; break;
    case 'KeyA': KEYS.a = true; break;
    case 'KeyS': KEYS.s = true; break;
    case 'KeyD': KEYS.d = true; break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW': KEYS.w = false; break;
    case 'KeyA': KEYS.a = false; break;
    case 'KeyS': KEYS.s = false; break;
    case 'KeyD': KEYS.d = false; break;
  }
}

/** Attach keyboard event listeners to the document. */
function attach() {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

/** Remove keyboard event listeners from the document. */
function detach() {
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
}

export { KEYS, attach, detach };
