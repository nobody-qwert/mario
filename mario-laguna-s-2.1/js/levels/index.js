/* ========================================
   Super Mario Bros. Web — Levels Index
   Exports all available levels
   ======================================== */

import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';

export const levels = [level1, level2, level3];

export function getLevel(index) {
    if (index < 0 || index >= levels.length) return null;
    return levels[index];
}

export function getTotalLevels() {
    return levels.length;
}
