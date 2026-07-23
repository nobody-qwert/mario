/* ========================================
   Super Mario Bros. Web — Level Data
   Level 3: The Sky Castle
   ======================================== */

import { Platform, Coin, Star, Flag } from '../entities/platform.js';
import { Goomba } from '../entities/goomba.js';

export const level3 = {
    name: 'The Sky Castle',
    width: 2000,
    height: 540,
    backgroundColor: '#87CEEB',
    spawnX: 100,
    spawnY: 300,
    platforms: [
        // Ground
        new Platform(0, 490, 2000, 50, 'ground'),
        // Sky platforms - increasingly challenging
        new Platform(150, 400, 80, 32, 'platform'),
        new Platform(300, 350, 80, 32, 'platform'),
        new Platform(450, 300, 80, 32, 'platform'),
        new Platform(600, 250, 80, 32, 'platform'),
        new Platform(750, 200, 80, 32, 'platform'),
        new Platform(900, 150, 80, 32, 'platform'),
        new Platform(1050, 100, 80, 32, 'platform'),
        new Platform(1200, 150, 80, 32, 'platform'),
        new Platform(1350, 200, 80, 32, 'platform'),
        new Platform(1500, 250, 80, 32, 'platform'),
        new Platform(1650, 300, 80, 32, 'platform'),
        new Platform(1800, 350, 80, 32, 'platform'),
        // Brick blocks
        new Platform(200, 370, 32, 32, 'brick'),
        new Platform(350, 320, 32, 32, 'brick'),
        new Platform(500, 270, 32, 32, 'brick'),
        new Platform(650, 220, 32, 32, 'brick'),
        new Platform(800, 170, 32, 32, 'brick'),
        new Platform(950, 120, 32, 32, 'brick'),
        new Platform(1100, 70, 32, 32, 'brick'),
        new Platform(1250, 120, 32, 32, 'brick'),
        new Platform(1400, 170, 32, 32, 'brick'),
        new Platform(1550, 220, 32, 32, 'brick'),
        new Platform(1700, 270, 32, 32, 'brick'),
        new Platform(1850, 320, 32, 32, 'brick'),
        // Pipes
        new Platform(1000, 420, 48, 70, 'pipe'),
        new Platform(1300, 420, 48, 70, 'pipe'),
        // Cloud platforms
        new Platform(500, 80, 60, 20, 'cloud'),
        new Platform(800, 50, 60, 20, 'cloud'),
        new Platform(1100, 30, 60, 20, 'cloud'),
        new Platform(1400, 50, 60, 20, 'cloud'),
        new Platform(1700, 80, 60, 20, 'cloud'),
        // Flag area
        new Platform(1900, 400, 100, 32, 'platform'),
    ],
    coins: [
        new Coin(200, 370),
        new Coin(250, 370),
        new Coin(350, 320),
        new Coin(400, 320),
        new Coin(500, 270),
        new Coin(550, 270),
        new Coin(650, 220),
        new Coin(700, 220),
        new Coin(800, 170),
        new Coin(850, 170),
        new Coin(950, 120),
        new Coin(1000, 120),
        new Coin(1100, 70),
        new Coin(1150, 70),
        new Coin(1250, 120),
        new Coin(1300, 120),
        new Coin(1400, 170),
        new Coin(1450, 170),
        new Coin(1550, 220),
        new Coin(1600, 220),
        new Coin(1700, 270),
        new Coin(1750, 270),
        new Coin(1850, 320),
        new Coin(1900, 320),
        new Coin(1950, 320),
    ],
    stars: [
        new Star(800, 150),
        new Star(1100, 30),
        new Star(1700, 250),
    ],
    enemies: [
        new Goomba(200, 370),
        new Goomba(350, 320),
        new Goomba(500, 270),
        new Goomba(650, 220),
        new Goomba(800, 170),
        new Goomba(950, 120),
        new Goomba(1100, 70),
        new Goomba(1250, 120),
        new Goomba(1400, 170),
        new Goomba(1550, 220),
        new Goomba(1700, 270),
        new Goomba(1850, 320),
    ],
    flag: new Flag(1950, 290),
};