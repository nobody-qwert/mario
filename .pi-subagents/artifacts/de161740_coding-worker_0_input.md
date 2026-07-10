# Task for coding-worker

TASK_ID: refactor-02-extract-collision

GOAL:
Extract all collision-checking functions from game.js and the aabb helper from entities.js into a new js/collision.js module.

ACCEPTANCE_CRITERIA:
- js/collision.js exists and contains: aabb(), checkEnemyCollision(), checkCoinCollision(), checkFloatingItemCollision(), hitBlock()
- game.js no longer contains the bodies of those 5 functions (only calls to them remain)
- entities.js no longer contains the aabb() function
- collision.js loads before game.js and entities.js in index.html
- All functions reference their dependencies (player, enemies, coins, floatingItems, score, coinCount, lives, particles, Sound, JUMP_FORCE, TILE, T, SOLID, setTile, map) via globals — same as before

ALLOWED_PATHS:
- js/collision.js (create)
- js/game.js (remove 5 function bodies)
- js/entities.js (remove aabb function)
- index.html (add collision.js script tag)

ENTRY_SYMBOLS:
- `function aabb(a, b)` in entities.js (bottom of file)
- `function checkEnemyCollision()` in game.js
- `function checkCoinCollision()` in game.js
- `function checkFloatingItemCollision()` in game.js
- `function hitBlock(col, row, tile)` in game.js
- `function checkFlag()` in game.js — DO NOT MOVE this one, it is game-state logic not pure collision

ACCEPTANCE_COMMANDS:
- grep -c "function aabb" js/collision.js (should be 1)
- grep "function aabb" js/entities.js | wc -l (should be 0)
- grep -c "function checkEnemyCollision" js/collision.js (should be 1)
- grep "function checkEnemyCollision" js/game.js | wc -l (should be 0)
- grep "function checkCoinCollision" js/collision.js (should find 1)
- grep "function checkFloatingItemCollision" js/collision.js (should find 1)
- grep "function hitBlock" js/collision.js (should find 1)
- grep "collision.js" index.html (must exist, before game.js)

CONSTRAINTS:
- Do not change function signatures or internal logic
- Do NOT move checkFlag() — it is game-state logic (flagReached, winTimer, state) and stays in game.js
- Do NOT move checkTransition() — it is map-transition logic and stays in game.js
- Preserve all references to globals exactly as they are (no new imports)
- Do not modify player.js, world.js, input.js, or sound.js

KNOWN_FACTS:
- No build system or tests; verification is grep-based
- Script load order in index.html: input.js, world.js, entities.js, sound.js, player.js, game.js
- collision.js must load after entities.js (aabb is used there conceptually) but before game.js
- hitBlock references: T, SOLID, setTile, map, player, Sound, particles, score
- checkEnemyCollision references: player, enemies, aabb, Sound, particles, score, JUMP_FORCE
- checkCoinCollision references: player, coins, aabb, coinCount, score, Sound, particles, lives
- checkFloatingItemCollision references: player, floatingItems, aabb, coinCount, score, Sound, particles

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