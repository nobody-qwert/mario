/**
 * Player health system — HP tracking, damage, and death detection.
 *
 * Exports createPlayer(scene) returning { takeDamage(amount), getHealth(), getPosition() }.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HEARTS = 5;
const HP_PER_HEART = 10;
const MAX_HP = MAX_HEARTS * HP_PER_HEART; // 50 HP total
const DAMAGE_FLASH_DURATION = 0.3; // seconds for health bar flash effect

// ---------------------------------------------------------------------------
// Player factory
// ---------------------------------------------------------------------------

/**
 * Create a player entity with health tracking.
 * @param {THREE.Scene} scene - Three.js scene (for potential visual effects).
 * @returns {{ takeDamage: Function, getHealth: Function, getPosition: Function }}
 */
export function createPlayer(scene) {
  // Player position — starts at origin on ground level
  const position = new THREE.Vector3(0, 0, 5);

  // Health state
  let currentHP = MAX_HP;
  let isDead = false;

  // Damage flash tracking
  let flashTimer = null;
  let flashStartTime = 0;

  /**
   * Apply damage to the player.
   * @param {number} amount - Damage points to subtract (must be positive).
   * @returns {boolean} True if the player died from this hit.
   */
  function takeDamage(amount) {
    if (isDead) return false;

    currentHP = Math.max(0, currentHP - amount);

    // Trigger damage flash effect on health bar
    triggerDamageFlash();

    // Check for death
    if (currentHP <= 0) {
      isDead = true;
      return true; // player died
    }

    return false; // player survived
  }

  /**
   * Trigger a red edge flash on the health bar.
   */
  function triggerDamageFlash() {
    const healthBar = document.getElementById('health-bar');
    const damageOverlay = document.getElementById('damage-overlay');
    if (!healthBar) return;

    // Clear any existing timer
    if (flashTimer) clearTimeout(flashTimer);

    // Apply red border flash
    healthBar.style.boxShadow = '0 0 12px 4px rgba(255, 0, 0, 0.9), inset 0 0 8px rgba(255, 0, 0, 0.3)';
    damageOverlay?.classList.add('active');

    flashStartTime = performance.now();
    flashTimer = setTimeout(() => {
      healthBar.style.boxShadow = '';
      damageOverlay?.classList.remove('active');
      flashTimer = null;
    }, DAMAGE_FLASH_DURATION * 1000);
  }

  /**
   * Get the current HP value.
   * @returns {number} Current health points (0 to MAX_HP).
   */
  function getHealth() {
    return currentHP;
  }

  /**
   * Check if the player is dead.
   * @returns {boolean} True if HP has reached zero.
   */
  function isPlayerDead() {
    return isDead;
  }

  /**
   * Get the player's world position.
   * @returns {THREE.Vector3} Player position vector.
   */
  function getPosition() {
    return position.clone();
  }

  /**
   * Set the player's world position (called by main loop from camera).
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {number} z - Z coordinate.
   */
  function setPosition(x, y, z) {
    position.set(x, y, z);
  }

  /**
   * Reset player to full health and initial state.
   */
  function reset() {
    currentHP = MAX_HP;
    isDead = false;
    position.set(0, 0, 5);
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = null;
    const healthBar = document.getElementById('health-bar');
    if (healthBar) {
      healthBar.style.boxShadow = '';
    }
    document.getElementById('damage-overlay')?.classList.remove('active');
  }

  return { takeDamage, getHealth, getPosition, isPlayerDead, setPosition, reset };
}

// Export constants for external use
export { MAX_HP, HP_PER_HEART, MAX_HEARTS };
