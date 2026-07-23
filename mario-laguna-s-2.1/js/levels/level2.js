/* ========================================
   Super Mario Bros. Web — Level 2 Data
   Underground Caves
   ======================================== */

import { Platform, Coin, Star, Flag } from '../entities/platform.js';
import { Goomba } from '../entities/goomba.js';

export const level2 = {
    name: 'Underground Caves',
    width: 2400,
    height: 540,
    backgroundColor: '#1a1a2e',
    spawnX: 50,
    spawnY: 400,
    platforms: [
        // Ground with gaps
        new Platform(0, 490, 600, 50, 'ground'),
        new Platform(700, 490, 400, 50, 'ground'),
        new Platform(1200, 490, 300, 50, 'ground'),
        new Platform(1600, 490, 800, 50, 'ground'),
        // Bridges over gaps
        new Platform(600, 440, 120, 32, 'platform'),
        new Platform(1100, 440, 120, 32, 'platform'),
        // Elevated platforms
        new Platform(150, 380, 100, 32, 'platform'),
        new Platform(350, 330, 100, 32, 'platform'),
        new Platform(550, 280, 100, 32, 'platform'),
        new Platform(800, 350, 100, 32, 'platform'),
        new Platform(1000, 300, 100, 32, 'platform'),
        new Platform(1300, 350, 100, 32, 'platform'),
        new Platform(1500, 300, 100, 32, 'platform'),
        new Platform(1700, 250, 100, 32, 'platform'),
        new Platform(1900, 300, 100, 32, 'platform'),
        new Platform(2100, 350, 100, 32, 'platform'),
        // Brick blocks
        new Platform(200, 350, 32, 32, 'brick'),
        new Platform(400, 300, 32, 32, 'brick'),
        new Platform(600, 250, 32, 32, 'brick'),
        new Platform(850, 320, 32, 32, 'brick'),
        new Platform(1050, 270, 32, 32, 'brick'),
        new Platform(1350, 320, 32, 32, 'brick'),
        new Platform(1550, 270, 32, 32, 'brick'),
        new Platform(1750, 220, 32, 32, 'brick'),
        new Platform(1950, 270, 32, 32, 'brick'),
        // Pipes
        new Platform(450, 420, 48, 70, 'pipe'),
        new Platform(900, 420, 48, 70, 'pipe'),
        new Platform(1400, 420, 48, 70, 'pipe'),
        // Final platform
        new Platform(2200, 400, 150, 32, 'platform'),
    ],
    coins: [
        new Coin(180, 350),
        new Coin(380, 300),
        new Coin(580, 250),
        new Coin(830, 320),
        new Coin(1030, 270),
        new Coin(1330, 320),
        new Coin(1530, 270),
        new Coin(1730, 220),
        new Coin(1930, 270),
        new Coin(2130, 320),
        new Coin(650, 410),
        new Coin(1150, 410),
        new Coin(2250, 370),
        new Coin(2300, 370),
    ],
    stars: [
        new Star(1050, 270),
        new Star(1750, 220),
    ],
    enemies: [
        new Goomba(200, 460),
        new Goomba(500, 460),
        new Goomba(800, 460),
        new Goomba(1050, 460),
        new Goomba(1350, 460),
        new Goomba(1700, 460),
        new Goomba(2000, 460),
        new Goomba(350, 300),
        new Goomba(1000, 270),
        new Goomba(1700, 220),
    ],
    flag: new Flag(2300, 300),
};
