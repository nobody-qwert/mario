All checks pass. Script load order is correct: `constants.js` → `levels.js` → `entities.js`.

```text
STATUS: COMPLETED
SUMMARY: Extracted 8 level-design symbols (ENEMY_TYPES, 4 spawn functions, WARP_PIPES, ELEVATORS, MAP_INFO) from entities.js and constants.js into new js/levels.js. Updated index.html script load order.
FILES_CHANGED:
- js/levels.js: created with ENEMY_TYPES, spawnEnemies(), spawnCoins(), spawnEnemiesUnderground(), spawnCoinsUnderground(), WARP_PIPES, ELEVATORS, MAP_INFO
- js/entities.js: removed ENEMY_TYPES and 4 spawn functions; retains Enemy, Coin, FloatingItem, Particle classes
- js/constants.js: removed WARP_PIPES, ELEVATORS, MAP_INFO; retains engine constants (TILE, T, SOLID, physics)
- index.html: added levels.js script tag after constants.js, before input.js
CHECKS:
- grep -c "const ENEMY_TYPES" js/levels.js → 1 (PASS)
- grep "const ENEMY_TYPES" js/entities.js | wc -l → 0 (PASS)
- grep -c "function spawnEnemies" js/levels.js → 2 (PASS)
- grep "function spawnEnemies" js/entities.js | wc -l → 0 (PASS)
- grep -c "function spawnCoins" js/levels.js → 2 (PASS)
- grep "function spawnCoins" js/entities.js | wc -l → 0 (PASS)
- grep -c "const WARP_PIPES" js/levels.js → 1 (PASS)
- grep "const WARP_PIPES" js/constants.js | wc -l → 0 (PASS)
- grep "levels.js" index.html → found before entities.js (PASS)
- grep "spawnEnemies\|spawnCoins" js/game.js → calls only (PASS)
REMAINING_RISK: none
```