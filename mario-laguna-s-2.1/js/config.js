/* ========================================
   Super Mario Bros. Web — Configuration
   All game constants in one place for easy tuning
   ======================================== */

// Canvas / display
export const CONFIG = {
    // Canvas dimensions (virtual resolution)
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 540,

    // Scale factor for rendering (pixel-perfect upscale)
    SCALE: 2,

    // Frame rate target (we use time-based movement, not frame-based)
    TARGET_FPS: 60,
    FRAME_DURATION: 1000 / 60,

    // Time scaling for consistent speed across CPUs
    // Movement is calculated using delta time, not frame count
    MAX_DELTA_TIME: 33, // max ~33ms per frame (30fps fallback)
    TIME_SCALE: 1.0,    // global time scale (can be used for slow-mo)
};

// Physics constants
export const PHYSICS = {
    GRAVITY: 0.6,
    MAX_FALL_SPEED: 12,
    WALK_SPEED: 2.2,
    RUN_SPEED: 3.2,
    ACCELERATION: 0.3,
    DECELERATION: 0.4,
    JUMP_FORCE: -5,
    JUMP_BOOST_FORCE: -1.0,     // small upward boost per frame while holding jump
    JUMP_BOOST_DURATION: 8,     // frames of boost while holding jump
    AIR_CONTROL: 0.7,
    TERMINAL_VELOCITY: 12,
    BOUNCE_THRESHOLD: -6,       // min downward speed to stomp an enemy
};

// Entity dimensions
export const DIMENSIONS = {
    MARIO_WIDTH: 32,
    MARIO_HEIGHT: 48,
    GOOMBA_WIDTH: 32,
    GOOMBA_HEIGHT: 32,
    PLATFORM_HEIGHT: 32,
    COIN_SIZE: 24,
    FLAG_WIDTH: 32,
    FLAG_HEIGHT: 200,
};

// Colors (for simple rendering fallback)
export const COLORS = {
    SKY_TOP: '#87CEEB',
    SKY_BOTTOM: '#87CEEB',
    CLOUD: '#FFFFFF',
    GRASS: '#4CAF50',
    DIRT: '#8D633A',
    BRICK: '#D2691E',
    PIPE_GREEN: '#228B22',
    PIPE_DARK: '#006400',
    MARIO_RED: '#CC0000',
    MARIO_BLUE: '#0000CC',
    MARIO_SKIN: '#FDBCB4',
    MARIO_BROWN: '#8D633A',
    GOOMBA_BROWN: '#8B4513',
    GOOMBA_DARK: '#654321',
    COIN: '#FFD700',
    FLAG_RED: '#CC0000',
    FLAG_WHITE: '#FFFFFF',
    BACKGROUND: '#000000',
};

// Layer rendering order (z-index equivalent)
export const LAYERS = {
    BACKGROUND: 0,
    PLATFORMS: 1,
    ENTITIES: 2,
    PARTICLES: 3,
    HUD: 4,
};

// Input keys
export const KEYS = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    JUMP: 'Space',
    JUMP_ALT: 'ArrowUp',
    PAUSE: 'Escape',
    UP: 'ArrowUp',
    W: 'KeyW',
    A: 'KeyA',
    D: 'KeyD',
};

// Game states
export const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    LEVEL_COMPLETE: 'level_complete',
};

// Sound effect names
export const SOUNDS = {
    JUMP: 'jump',
    COIN: 'coin',
    STOMP: 'stomp',
    DEATH: 'death',
    LEVEL_COMPLETE: 'level_complete',
    MUS_LEVEL: 'mus_level',
    MUS_OVERWORLD: 'mus_overworld',
    MUS_GAME_OVER: 'mus_game_over',
    MUS_VICTORY: 'mus_victory',
    PIPE: 'pipe',
    POWERUP: 'powerup',
};