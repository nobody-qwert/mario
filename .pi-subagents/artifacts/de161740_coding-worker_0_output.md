All acceptance criteria verified. Calls to the extracted functions remain in game.js at the expected locations.

```text
STATUS: COMPLETED
SUMMARY: Extracted aabb(), checkEnemyCollision(), checkCoinCollision(), checkFloatingItemCollision(), and hitBlock() into js/collision.js. Removed their bodies from entities.js and game.js. Added collision.js script tag to index.html between entities.js and sound.js.
FILES_CHANGED:
- js/collision.js: created with 5 collision-checking functions (aabb, hitBlock, checkEnemyCollision, checkCoinCollision, checkFloatingItemCollision)
- js/game.js: removed bodies of 4 collision functions; checkFlag() and checkTransition() left intact
- js/entities.js: removed aabb() function
- index.html: added <script src="js/collision.js"></script> before game.js (after entities.js)
CHECKS:
- grep -c "function aabb" js/collision.js: PASS (1)
- grep "function aabb" js/entities.js | wc -l: PASS (0)
- grep -c "function checkEnemyCollision" js/collision.js: PASS (1)
- grep "function checkEnemyCollision" js/game.js | wc -l: PASS (0)
- grep -c "function checkCoinCollision" js/collision.js: PASS (1)
- grep -c "function checkFloatingItemCollision" js/collision.js: PASS (1)
- grep -c "function hitBlock" js/collision.js: PASS (1)
- grep "collision.js" index.html: PASS (present, before game.js)
- checkFlag still in game.js: PASS (1)
- checkTransition still in game.js: PASS (1)
REMAINING_RISK: none
FAILURE_FINGERPRINT: N/A
NEXT_RECOMMENDATION: N/A
```