/* ========================================
   Super Mario Bros. Web — Level 1 Data
   Modular level definition: platforms, enemies, collectibles, flag
   ======================================== */

import { DIMENSIONS as DIMS, COLORS as CLR } from '../config.js';

export const level1 = {
    id: 1,
    name: 'Grassland',
    width: 2000,
    height: 540,
    backgroundColor: CLR.SKY_TOP,
    // Ground platforms: { x, y, width, height, type }
    platforms: [
        // Ground
        { x: 0, y: 490, width: 2000, height: 50, type: 'ground' },

        // === Start area (0-400) ===
        // Small platform with a coin above it
        { x: 150, y: 400, width: 100, height: 30, type: 'platform' },
        // Pipe (vertical) — decorative / obstacle
        { x: 270, y: 420, width: 48, height: 70, type: 'pipe' },
        // Brick block with coin above
        { x: 350, y: 370, width: 32, height: 32, type: 'brick' },
        { x: 400, y: 370, width: 32, height: 32, type: 'brick' },
        { x: 450, y: 370, width: 32, height: 32, type: 'brick' },
        // Platform leading up
        { x: 500, y: 320, width: 100, height: 30, type: 'platform' },

        // === Section 1: Pipes & Goombas (400-800) ===
        // Pipe (vertical) — obstacle
        { x: 600, y: 420, width: 48, height: 70, type: 'pipe' },
        // Platform above the pipe
        { x: 670, y: 370, width: 100, height: 30, type: 'platform' },
        // Brick blocks
        { x: 700, y: 340, width: 32, height: 32, type: 'brick' },
        { x: 740, y: 340, width: 32, height: 32, type: 'brick' },
        // Lower platform
        { x: 780, y: 420, width: 100, height: 30, type: 'platform' },

        // === Section 2: Elevated platforms & star (800-1200) ===
        // High platform
        { x: 850, y: 250, width: 100, height: 30, type: 'platform' },
        // Pipe (vertical) — obstacle
        { x: 970, y: 270, width: 48, height: 70, type: 'pipe' },
        // Platform after the pipe
        { x: 1040, y: 250, width: 100, height: 30, type: 'platform' },
        // Brick blocks with coin
        { x: 1070, y: 220, width: 32, height: 32, type: 'brick' },
        { x: 1110, y: 220, width: 32, height: 32, type: 'brick' },
        // Lower platform
        { x: 1160, y: 370, width: 100, height: 30, type: 'platform' },

        // === Section 3: Final stretch (1200-1800) ===
        // Pipe (vertical) — obstacle
        { x: 1270, y: 420, width: 48, height: 70, type: 'pipe' },
        // Platform above
        { x: 1340, y: 370, width: 100, height: 30, type: 'platform' },
        // Brick blocks
        { x: 1370, y: 340, width: 32, height: 32, type: 'brick' },
        { x: 1410, y: 340, width: 32, height: 32, type: 'brick' },
        { x: 1450, y: 340, width: 32, height: 32, type: 'brick' },
        // Platform
        { x: 1500, y: 250, width: 100, height: 30, type: 'platform' },
        // Pipe (vertical) — obstacle before the flag
        { x: 1620, y: 270, width: 48, height: 70, type: 'pipe' },
        // Platform leading to the flag
        { x: 1690, y: 200, width: 100, height: 30, type: 'platform' },
        // Final platform before flag
        { x: 1800, y: 150, width: 100, height: 30, type: 'platform' },
    ],
    // Enemies: { x, y, type }
    enemies: [
        { x: 230, y: 450, type: 'goomba' },
        { x: 560, y: 450, type: 'goomba' },
        { x: 740, y: 450, type: 'goomba' },
        { x: 810, y: 220, type: 'goomba' },
        { x: 1120, y: 400, type: 'goomba' },
        { x: 1230, y: 450, type: 'goomba' },
        { x: 1460, y: 220, type: 'goomba' },
        { x: 1650, y: 170, type: 'goomba' },
    ],
    // Collectibles: { x, y, type } — emoji artifacts
    collectibles: [
        // Start area coins
        { x: 180, y: 370, type: 'coin' },
        { x: 210, y: 370, type: 'coin' },
        // Coins above brick blocks
        { x: 360, y: 340, type: 'coin' },
        { x: 410, y: 340, type: 'coin' },
        { x: 460, y: 340, type: 'coin' },
        // Section 1 coins
        { x: 710, y: 310, type: 'coin' },
        { x: 750, y: 310, type: 'coin' },
        { x: 810, y: 390, type: 'coin' },
        { x: 840, y: 390, type: 'coin' },
        // Section 2 coins
        { x: 880, y: 220, type: 'coin' },
        { x: 920, y: 220, type: 'coin' },
        { x: 1080, y: 190, type: 'coin' },
        { x: 1120, y: 190, type: 'coin' },
        { x: 1200, y: 340, type: 'coin' },
        { x: 1230, y: 340, type: 'coin' },
        // Section 3 coins
        { x: 1380, y: 310, type: 'coin' },
        { x: 1420, y: 310, type: 'coin' },
        { x: 1460, y: 310, type: 'coin' },
        { x: 1540, y: 220, type: 'coin' },
        { x: 1570, y: 220, type: 'coin' },
        { x: 1730, y: 170, type: 'coin' },
        { x: 1760, y: 170, type: 'coin' },
        { x: 1840, y: 120, type: 'star' },
    ],
    // Flag position
    flag: { x: 1850, y: 120 },
    // Player start
    playerStart: { x: 50, y: 440 },
};