/**
 * hud.js — HUD DOM references and overlay helpers
 */

// ── HUD elements ─────────────────────────────────────────
const elScore = document.getElementById('score');
const elCoins = document.getElementById('coins');
const elTime = document.getElementById('time');
const elLives = document.getElementById('lives');
const elWorld = document.getElementById('world');
const elOverlay = document.getElementById('overlay');
const elTitle = document.getElementById('overlay-title');
const elSubtitle = document.getElementById('overlay-subtitle');
const elAction = document.getElementById('overlay-action');

// ── Overlay helpers ──────────────────────────────────────
function showOverlay(title, subtitle, action) {
  elTitle.textContent = title;
  elSubtitle.textContent = subtitle || '';
  elAction.textContent = action || '';
  elOverlay.classList.remove('hidden');
}

function hideOverlay() {
  elOverlay.classList.add('hidden');
}

// ── HUD update ───────────────────────────────────────────
function updateHUD() {
  elScore.textContent = String(score).padStart(6, '0');
  elCoins.textContent = String(coinCount).padStart(2, '0');
  elTime.textContent = String(Math.max(0, Math.floor(timeLeft)));
  elLives.textContent = lives;
  elWorld.textContent = currentMapIndex === 1 ? '1-2' : '1-1';
}
