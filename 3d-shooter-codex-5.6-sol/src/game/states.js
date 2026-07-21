/**
 * Game state management — enum and transition helpers.
 *
 * States: MENU → PLAYING → GAME_OVER / VICTORY
 */

// ---------------------------------------------------------------------------
// State enum
// ---------------------------------------------------------------------------

export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
};

/**
 * Validate a state transition.
 * @param {string} from - Current state.
 * @param {string} to   - Target state.
 * @returns {boolean} True if the transition is valid.
 */
export function isValidTransition(from, to) {
  const transitions = {
    [GameState.MENU]: [GameState.PLAYING],
    [GameState.PLAYING]: [GameState.GAME_OVER, GameState.VICTORY],
    [GameState.GAME_OVER]: [GameState.MENU],
    [GameState.VICTORY]: [GameState.MENU],
  };

  return (transitions[from] || []).includes(to);
}

/**
 * Create a game state manager.
 * @param {Object} options - Configuration.
 * @param {Function} options.onStateChange - Callback(state) fired on each transition.
 * @returns {{ getState, setState, reset }}
 */
export function createGameStateManager(options = {}) {
  let currentState = GameState.MENU;

  /**
   * Get the current game state.
   * @returns {string} Current state string.
   */
  function getState() {
    return currentState;
  }

  /**
   * Set a new game state (with validation).
   * @param {string} newState - Target state.
   * @returns {boolean} True if the transition was applied.
   */
  function setState(newState) {
    if (!isValidTransition(currentState, newState)) {
      return false;
    }

    const previous = currentState;
    currentState = newState;

    if (options.onStateChange) {
      options.onStateChange(newState);
    }

    return true;
  }

  /**
   * Reset to the initial state.
   */
  function reset() {
    currentState = GameState.MENU;
  }

  return { getState, setState, reset };
}
