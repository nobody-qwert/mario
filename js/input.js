/**
 * input.js — Keyboard + Touch input state tracker
 *
 * Detects mobile on load; on mobile, touch buttons feed into the same
 * keys map as keyboard so Input.get() / Input.once() work identically.
 */
const Input = (() => {
  const keys = {};
  const justPressed = {};

  // ── Mobile detection ──────────────────────────────────
  const isMobile = (() => {
    const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const smallScreen = window.innerWidth < 1024;
    const mobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return hasTouch && (smallScreen || mobileUA);
  })();

  // ── Virtual touch buttons ─────────────────────────────
  // keyName is the same key code used by keyboard (ArrowLeft, Space, …)
  const touchButtons = {
    left:  { keyName: 'ArrowLeft',  pressed: false, justPressed: false },
    right: { keyName: 'ArrowRight', pressed: false, justPressed: false },
    jump:  { keyName: 'Space',      pressed: false, justPressed: false },
  };

  // ── Keyboard listeners ────────────────────────────────
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // ── Touch listeners (only active on mobile) ───────────
  if (isMobile) {
    const overlay = document.createElement('div');
    overlay.id = 'touch-controls';
    overlay.innerHTML = `
      <div class="touch-dpad">
        <button data-btn="left"  aria-label="Move left">&#9664;</button>
        <button data-btn="right" aria-label="Move right">&#9654;</button>
      </div>
      <button class="touch-jump" data-btn="jump" aria-label="Jump">JUMP</button>
    `;
    document.getElementById('game-container').appendChild(overlay);

    // Tap anywhere triggers Space (for menu / game-over screens where overlay covers buttons)
    const gameContainer = document.getElementById('game-container');
    const menuOverlay = document.getElementById('overlay');
    gameContainer.addEventListener('touchstart', (e) => {
      // Only fire when the menu/game-over overlay is visible
      if (menuOverlay.classList.contains('hidden')) return;
      const target = e.target;
      if (!target.dataset.btn) {
        if (!keys['Space']) {
          justPressed['Space'] = true;
        }
        keys['Space'] = true;
      }
    }, { passive: true });
    gameContainer.addEventListener('touchend', (e) => {
      if (menuOverlay.classList.contains('hidden')) return;
      const target = e.target;
      if (!target.dataset.btn) {
        keys['Space'] = false;
      }
    }, { passive: true });

    // Prevent default touch actions on the button overlay
    overlay.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    overlay.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
    overlay.addEventListener('touchcancel', (e) => e.preventDefault(), { passive: false });

    function handleTouch(e) {
      // Determine which buttons each changed touch hit
      for (const touch of e.changedTouches) {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!el || !el.dataset.btn) continue;
        const btn = touchButtons[el.dataset.btn];
        if (!btn) continue;

        if (e.type === 'touchstart' || e.type === 'touchcancel') {
          if (e.type === 'touchstart' && !btn.pressed) {
            btn.pressed = true;
            btn.justPressed = true;
            keys[btn.keyName] = true;
          }
        }
      }

      // After start/end/cancel, sync all buttons to current active touches
      const activeIds = new Set();
      for (const touch of e.touches) {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.dataset.btn && touchButtons[el.dataset.btn]) {
          activeIds.add(el.dataset.btn);
        }
      }
      for (const id in touchButtons) {
        const btn = touchButtons[id];
        const isActive = activeIds.has(id);
        if (isActive && !btn.pressed) {
          // Safety: finger slid onto button
          btn.pressed = true;
          keys[btn.keyName] = true;
        } else if (!isActive && btn.pressed) {
          btn.pressed = false;
          keys[btn.keyName] = false;
        }
      }
    }

    overlay.addEventListener('touchstart', handleTouch, { passive: false });
    overlay.addEventListener('touchend', handleTouch, { passive: false });
    overlay.addEventListener('touchcancel', handleTouch, { passive: false });
  }

  // ── Public API ────────────────────────────────────────
  return {
    get isMobile() { return isMobile; },

    get(key) { return !!keys[key]; },

    once(key) {
      // Check virtual button just-pressed first
      for (const id in touchButtons) {
        const btn = touchButtons[id];
        if (btn.keyName === key && btn.justPressed) {
          btn.justPressed = false;
          return true;
        }
      }

      const pressed = justPressed[key];
      justPressed[key] = false;
      return pressed;
    },

    clear() {
      Object.keys(justPressed).forEach(k => justPressed[k] = false);
      for (const id in touchButtons) {
        touchButtons[id].justPressed = false;
      }
    }
  };
})();
