# Task for coding-worker

TASK_ID: refactor-06-extract-constants

GOAL:
Extract shared constants (TILE, COLS, ROWS, WORLD_W, WORLD_H, T, TILE_EMOJI, SOLID, TRANSITION, MAP_INFO, WARP_PIPES, ELEVATORS, GRAVITY, MAX_FALL, MOVE_SPEED, JUMP_FORCE, GROUND_ROW) into a new js/constants.js module.

ACCEPTANCE_CRITERIA:
- js/constants.js exists and contains all listed constants
- world.js no longer defines TILE, COLS, ROWS, WORLD_W, WORLD_H, T, TILE_EMOJI, SOLID, TRANSITION, MAP_INFO, WARP_PIPES, ELEVATORS
- player.js no longer defines GRAVITY, MAX_FALL, MOVE_SPEED, JUMP_FORCE, GROUND_ROW
- constants.js loads FIRST in index.html (before all other scripts)
- All references to these constants across all files still work via globals

ALLOWED_PATHS:
- js/constants.js (create)
- js/world.js (remove constant definitions — keep buildLevel, buildUnderground, loadMap, getTile, setTile)
- js/player.js (remove GRAVITY, MAX_FALL, MOVE_SPEED, JUMP_FORCE, GROUND_ROW)
- index.html (move constants.js to first script tag)

ENTRY_SYMBOLS:
- `const TILE = 32` in world.js
- `const COLS = 200` in world.js
- `const GRAVITY = 0.6` in player.js
- `const T = { AIR: 0, ... }` in world.js
- `const SOLID = new Set(...)` in world.js
- `const TILE_EMOJI = { ... }` in world.js
- `const MAP_INFO = [...]` in world.js
- `const WARP_PIPES = [...]` in world.js
- `const ELEVATORS = [...]` in world.js

ACCEPTANCE_COMMANDS:
- grep -c "const TILE" js/constants.js (should be 1)
- grep "const TILE" js/world.js | wc -l (should be 0)
- grep -c "const T = " js/constants.js (should be 1)
- grep "const T = " js/world.js | wc -l (should be 0)
- grep -c "const SOLID" js/constants.js (should be 1)
- grep "const SOLID" js/world.js | wc -l (should be 0)
- grep -c "const GRAVITY" js/constants.js (should be 1)
- grep "const GRAVITY" js/player.js | wc -l (should be 0)
- grep "constants.js" index.html (must exist as first script)
- head -30 index.html | grep "script" | head -1 (should be constants.js)

CONSTRAINTS:
- Do not change any constant values
- Keep all constants as globals (no module wrapper)
- world.js must KEEP: buildLevel(), buildUnderground(), loadMap(), getTile(), setTile()
- Do NOT move ENEMY_TYPES or spawn functions — those are in entities.js and handled in task 7
- Do not modify game.js, entities.js, collision.js, sound.js, hud.js, camera.js, or render.js

KNOWN_FACTS:
- TILE used in: player.js (constructor), entities.js (Enemy, Coin, FloatingItem), collision.js (hitBlock), game.js (resizeCanvas, initGame, checkTransition)
- SOLID used in: player.js (collideX, collideY), entities.js (Enemy.collideX, collideY), world.js (getTile not directly but used in collision), collision.js
- T used in: world.js (buildLevel, buildUnderground), collision.js (hitBlock), player.js (indirectly via SOLID)
- GRAVITY used in: player.js (update)
- Script load order currently: input.js, camera.js, world.js, entities.js, collision.js, sound.js, player.js, hud.js, render.js, game.js

KNOWN_FAILED_APPROACHES:
- none

OUTPUT_CONTRACT:
Return status, concise summary, files changed, checks, remaining risk, and a failure fingerprint when incomplete.

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