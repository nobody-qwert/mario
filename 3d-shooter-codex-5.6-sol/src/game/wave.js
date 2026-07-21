/**
 * Wave management system — spawns enemies in waves, tracks progress, advances on completion.
 *
 * Exports createWaveSystem(enemySystem, onEnemyKilled callback) returning { startNextWave(), getActiveCount(), getTotalWaves() }.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_WAVES = 10; // total waves before victory
const BASE_ENEMIES_PER_WAVE = 3; // starting enemy count for wave 1
const ENEMY_COUNT_INCREMENT = 1; // +1 enemy per wave
const SPEED_MULTIPLIER_BASE = 1.0;
const SPEED_MULTIPLIER_INCREMENT = 0.5; // +0.5 speed multiplier per wave

// ---------------------------------------------------------------------------
// Wave system factory
// ---------------------------------------------------------------------------

/**
 * Create the wave management system.
 * @param {Object} enemySystem - The enemy system (must have spawnWave, getEnemies).
 * @param {Function} onEnemyKilled - Callback(waveNumber) fired when all enemies in a wave are killed.
 * @returns {{ startNextWave: Function, getActiveCount: Function, getTotalWaves: Function }}
 */
export function createWaveSystem(enemySystem, onEnemyKilled) {
  let currentWave = 0; // 1-indexed wave number (starts at 1 after first startNextWave call)
  let enemiesSpawnedThisWave = 0; // how many enemies were spawned in the current wave
  let isWaveActive = false;

  /**
   * Calculate enemy count for a given wave.
   * @param {number} wave - Wave number (1-indexed).
   * @returns {number} Number of enemies to spawn.
   */
  function getEnemyCountForWave(wave) {
    return BASE_ENEMIES_PER_WAVE + (wave - 1) * ENEMY_COUNT_INCREMENT;
  }

  /**
   * Calculate speed multiplier for a given wave.
   * @param {number} wave - Wave number (1-indexed).
   * @returns {number} Speed multiplier factor.
   */
  function getSpeedMultiplier(wave) {
    return SPEED_MULTIPLIER_BASE + (wave - 1) * SPEED_MULTIPLIER_INCREMENT;
  }

  /**
   * Start the next wave — spawns enemies with wave-scaled difficulty.
   * @returns {boolean} True if a new wave was started.
   */
  function startNextWave() {
    // Check if there are more waves to play
    if (currentWave >= TOTAL_WAVES) {
      return false; // no more waves — victory condition handled externally
    }

    currentWave++;
    enemiesSpawnedThisWave = getEnemyCountForWave(currentWave);

    // Spawn the wave's enemies through the enemy system
    enemySystem.spawnWave(enemiesSpawnedThisWave);

    // Apply wave-based speed multiplier to enemy movement
    enemySystem.setWaveSpeedMultiplier(getSpeedMultiplier(currentWave));

    isWaveActive = true;

    return true;
  }

  /**
   * Check if the current wave has been cleared (all enemies dead).
   * Called each frame from the game loop.
   */
  function checkWaveComplete() {
    if (!isWaveActive) return false;

    const activeEnemies = enemySystem.getEnemies();

    // Wave is complete when no living enemies remain
    if (activeEnemies.length === 0 && currentWave > 0) {
      isWaveActive = false;

      // Notify callback that this wave's enemies were all killed
      if (onEnemyKilled) {
        onEnemyKilled(currentWave);
      }

      return true; // wave was just completed
    }

    return false;
  }

  /**
   * Get the number of currently active (living) enemies.
   * @returns {number} Count of living enemies.
   */
  function getActiveCount() {
    return enemySystem.getEnemies().length;
  }

  /**
   * Get the total number of waves in the game.
   * @returns {number} Total wave count (constant).
   */
  function getTotalWaves() {
    return TOTAL_WAVES;
  }

  /**
   * Get the current wave number.
   * @returns {number} Current wave (0 if no wave started yet).
   */
  function getCurrentWave() {
    return currentWave;
  }

  /**
   * Check if all waves have been completed.
   * @returns {boolean} True if the player has survived all waves.
   */
  function areAllWavesComplete() {
    return currentWave >= TOTAL_WAVES && !isWaveActive;
  }

  /**
   * Reset wave system to initial state.
   */
  function reset() {
    currentWave = 0;
    enemiesSpawnedThisWave = 0;
    isWaveActive = false;
  }

  return { startNextWave, getActiveCount, getTotalWaves, checkWaveComplete, getCurrentWave, areAllWavesComplete, reset };
}

// Export constants for external use
export { TOTAL_WAVES, BASE_ENEMIES_PER_WAVE, ENEMY_COUNT_INCREMENT, SPEED_MULTIPLIER_BASE, SPEED_MULTIPLIER_INCREMENT };
