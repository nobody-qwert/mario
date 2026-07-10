# Task for reviewer

TASK_PACKET:
Goal: Refactor Super Mario Emoji game from 5 files into 12 modular files by extracting concerns from god modules.

CHANGES_SUMMARY:
- js/constants.js (NEW, 64 lines): TILE, T, SOLID, COLS, ROWS, WORLD_W, WORLD_H, TILE_EMOJI, TRANSITION, GRAVITY, MAX_FALL, MOVE_SPEED, JUMP_FORCE, GROUND_ROW
- js/levels.js (NEW, 111 lines): ENEMY_TYPES, spawnEnemies, spawnCoins, spawnEnemiesUnderground, spawnCoinsUnderground, WARP_PIPES, ELEVATORS, MAP_INFO
- js/camera.js (NEW, 19 lines): Camera object (x, y, w, h, follow)
- js/collision.js (NEW, 123 lines): aabb, hitBlock, checkEnemyCollision, checkCoinCollision, checkFloatingItemCollision
- js/sound.js (NEW, 108 lines): Sound IIFE (ensure, tone, noise, play, unlock)
- js/hud.js (NEW, 35 lines): DOM refs for HUD, showOverlay, hideOverlay, updateHUD
- js/render.js (NEW, 40 lines): drawWorld, drawSky
- js/game.js (315 lines, down from ~400): now only canvas setup, game state vars, initGame, resetLevel, checkFlag, checkTransition, transitionToMap, update (state machine), render (orchestration), gameLoop
- js/entities.js (222 lines, down from ~250): only entity classes (Enemy, Coin, FloatingItem, Particle)
- js/world.js (193 lines, down from ~250): only map builders (buildLevel, buildUnderground, loadMap) and tile accessors (getTile, setTile)
- js/player.js (268 lines, down from ~270): only Player class (physics constants moved to constants.js)
- js/input.js (155 lines, unchanged): already well modularized

DEPENDENCY_ORDER (index.html script tags):
1. constants.js (no deps)
2. levels.js (depends: constants.js for TILE)
3. input.js (no deps)
4. camera.js (no deps)
5. world.js (depends: constants.js for T, SOLID, TILE, COLS, ROWS)
6. entities.js (depends: constants.js for TILE; levels.js for ENEMY_TYPES)
7. collision.js (depends: constants.js, entities.js classes, levels.js)
8. sound.js (no deps)
9. player.js (depends: constants.js for GRAVITY etc; world.js for SOLID, getTile; sound.js for Sound)
10. hud.js (no deps)
11. render.js (depends: constants.js, camera.js, levels.js for MAP_INFO)
12. game.js (depends: all above)

VERIFICATION_EVIDENCE (all passed):
- Each extracted function found in new file, removed from old file (grep verified)
- Script load order correct in index.html
- No circular dependencies
- All global references preserved (no API changes)

REVIEW against:
- correctness and missing edge cases
- module ownership and dependency direction
- whether the dependency order in index.html is valid (no forward references)
- error handling and regression risk

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```