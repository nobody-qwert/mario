/**
 * input.js — Keyboard input state tracker
 */
const Input = (() => {
  const keys = {};
  const justPressed = {};

  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;
    // Prevent scrolling
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  return {
    get(key) { return !!keys[key]; },
    once(key) {
      const pressed = justPressed[key];
      justPressed[key] = false;
      return pressed;
    },
    clear() {
      Object.keys(justPressed).forEach(k => justPressed[k] = false);
    }
  };
})();
