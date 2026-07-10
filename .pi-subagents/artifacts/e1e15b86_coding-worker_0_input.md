# Task for coding-worker

TASK_ID: refactor-05-extract-render

GOAL:
Extract drawWorld() and drawSky() from world.js into a new js/render.js module.

ACCEPTANCE_CRITERIA:
- js/render.js exists and contains drawWorld() and drawSky()
- world.js no longer contains drawWorld() or drawSky()
- render.js loads before game.js in index.html
- game.js's render() function still calls drawSky() and drawWorld() successfully

ALLOWED_PATHS:
- js/render.js (create)
- js/world.js (remove drawWorld and drawSky)
- index.html (add render.js script tag)

ENTRY_SYMBOLS:
- `function drawWorld(ctx, map)` in world.js
- `function drawSky(ctx, mapIndex)` in world.js

ACCEPTANCE_COMMANDS:
- grep -c "function drawWorld" js/render.js (should be 1)
- grep "function drawWorld" js/world.js | wc -l (should be 0)
- grep -c "function drawSky" js/render.js (should be 1)
- grep "function drawSky" js/world.js | wc -l (should be 0)
- grep "render.js" index.html (must exist, before game.js)
- grep "drawWorld\|drawSky" js/game.js (should find calls only)

CONSTRAINTS:
- Do not change function signatures
- drawWorld references: Camera, TILE, T, TILE_EMOJI, COLS, ROWS — all from world.js globals, must remain accessible
- drawSky references: Camera, MAP_INFO — all from world.js globals
- Do NOT move the resizeCanvas function from game.js — that stays for now
- Do not modify any file other than the three listed

KNOWN_FACTS:
- drawWorld uses: Camera.x, Camera.w, Camera.y, Camera.h, TILE, T.AIR, TILE_EMOJI, COLS, ROWS
- drawSky uses: Camera.h, Camera.w, MAP_INFO
- Both functions are called from game.js render()
- world.js still retains: TILE, COLS, ROWS, WORLD_W, WORLD_H, T, TILE_EMOJI, SOLID, TRANSITION, MAP_INFO, WARP_PIPES, ELEVATORS, buildLevel, buildUnderground, loadMap, getTile, setTile

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