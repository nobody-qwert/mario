# Task for coding-worker

TASK_ID: refactor-07-extract-levels

GOAL:
Extract all level-design data (spawn functions, ENEMY_TYPES, WARP_PIPES, ELEVATORS, MAP_INFO) from entities.js and constants.js into a new js/levels.js module.

ACCEPTANCE_CRITERIA:
- js/levels.js exists and contains: ENEMY_TYPES, spawnEnemies(), spawnCoins(), spawnEnemiesUnderground(), spawnCoinsUnderground()
- entities.js no longer contains ENEMY_TYPES or the 4 spawn functions
- levels.js loads after constants.js (which has TILE, T, etc.) but before entities.js in index.html
- All spawn function calls in game.js still work (they reference spawnEnemies, spawnCoins, etc. as globals)
- Enemy class in entities.js still references ENEMY_TYPES via global

ALLOWED_PATHS:
- js/levels.js (create)
- js/entities.js (remove ENEMY_TYPES and 4 spawn functions)
- js/constants.js (remove WARP_PIPES, ELEVATORS, MAP_INFO — move to levels.js)
- index.html (add levels.js script tag)

ENTRY_SYMBOLS:
- `const ENEMY_TYPES = { GOOMBA: ..., KOOPA: ... }` in entities.js
- `function spawnEnemies()` in entities.js
- `function spawnCoins()` in entities.js
- `function spawnEnemiesUnderground()` in entities.js
- `function spawnCoinsUnderground()` in entities.js
- `const WARP_PIPES` in constants.js (moved from world.js in task 6)
- `const ELEVATORS` in constants.js
- `const MAP_INFO` in constants.js

ACCEPTANCE_COMMANDS:
- grep -c "const ENEMY_TYPES" js/levels.js (should be 1)
- grep "const ENEMY_TYPES" js/entities.js | wc -l (should be 0)
- grep -c "function spawnEnemies" js/levels.js (should be 2 — spawnEnemies + spawnEnemiesUnderground)
- grep "function spawnEnemies" js/entities.js | wc -l (should be 0)
- grep -c "function spawnCoins" js/levels.js (should be 2 — spawnCoins + spawnCoinsUnderground)
- grep "function spawnCoins" js/entities.js | wc -l (should be 0)
- grep -c "const WARP_PIPES" js/levels.js (should be 1)
- grep "const WARP_PIPES" js/constants.js | wc -l (should be 0)
- grep "levels.js" index.html (must exist, before entities.js)
- grep "spawnEnemies\|spawnCoins" js/game.js (should find calls only)

CONSTRAINTS:
- Do not change function signatures or data contents
- ENEMY_TYPES is used by Enemy class constructor in entities.js — must remain a global
- WARP_PIPES and ELEVATORS are used by checkTransition() in game.js — must remain globals
- MAP_INFO is used by drawSky() in render.js — must remain a global
- Keep Enemy, Coin, FloatingItem, Particle classes in entities.js
- Do not modify game.js, collision.js, sound.js, hud.js, camera.js, render.js, player.js, or world.js

KNOWN_FACTS:
- spawnEnemies returns array of {type, x, y} objects using TILE constant
- ENEMY_TYPES is read by Enemy constructor: `const def = ENEMY_TYPES[type]`
- WARP_PIPES and ELEVATORS were moved to constants.js in task 6; now moving to levels.js since they are level design data, not engine constants
- MAP_INFO was also moved to constants.js in task 6; it describes map themes so belongs in levels.js
- Script load order: constants.js, input.js, camera.js, world.js, entities.js, collision.js, sound.js, player.js, hud.js, render.js, game.js

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