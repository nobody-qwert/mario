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

  function setButton(id, pressed) {
    const btn = touchButtons[id];
    if (!btn || btn.pressed === pressed) return;
    btn.pressed = pressed;
    keys[btn.keyName] = pressed;
    if (pressed) {
      btn.justPressed = true;
    }
  }

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
    gameContainer.addEventListener('pointerdown', (e) => {
      // Only fire when the menu/game-over overlay is visible
      if (menuOverlay.classList.contains('hidden')) return;
      const target = e.target;
      if (!target.dataset.btn) {
        if (!keys['Space']) {
          justPressed['Space'] = true;
        }
        keys['Space'] = true;
      }
    });
    gameContainer.addEventListener('pointerup', (e) => {
      if (menuOverlay.classList.contains('hidden')) return;
      const target = e.target;
      if (!target.dataset.btn) {
        keys['Space'] = false;
      }
    });

    // Pointer events update immediately and support two held buttons at once.
    overlay.querySelectorAll('[data-btn]').forEach((button) => {
      const id = button.dataset.btn;
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        button.classList.add('active');
        setButton(id, true);
      });
      const release = (e) => {
        e.preventDefault();
        button.classList.remove('active');
        setButton(id, false);
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', () => {
        button.classList.remove('active');
        setButton(id, false);
      });
    });
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
