# Task for coding-worker

TASK_ID: refactor-04-extract-camera

GOAL:
Extract the Camera object from world.js into a new js/camera.js module.

ACCEPTANCE_CRITERIA:
- js/camera.js exists and contains the Camera object (x, y, w, h, follow method)
- world.js no longer contains the Camera object definition
- camera.js loads before world.js in index.html (so Camera is available when world.js and other modules reference it)
- All existing Camera.x, Camera.y, Camera.w, Camera.h, Camera.follow() references across all files still work

ALLOWED_PATHS:
- js/camera.js (create)
- js/world.js (remove Camera object)
- index.html (add camera.js script tag)

ENTRY_SYMBOLS:
- `const Camera = { x: 0, y: 0, w: 800, h: 480, follow(player) { ... } }` in world.js

ACCEPTANCE_COMMANDS:
- grep -c "const Camera" js/camera.js (should be 1)
- grep "const Camera" js/world.js | wc -l (should be 0)
- grep "camera.js" index.html (must exist)
- grep -rn "Camera\." js/ --include="*.js" | wc -l (should be >0 — references still exist in game.js, player.js, entities.js, world.js render functions)

CONSTRAINTS:
- Do not change the Camera API (x, y, w, h, follow)
- Do not modify any file other than the three listed
- Keep Camera as a global (no module wrapper needed)

KNOWN_FACTS:
- Camera is referenced in: game.js (initGame, resetLevel, WARPING state), player.js (draw), entities.js (Enemy.draw, Coin.draw, FloatingItem.draw, Particle.draw), world.js (drawWorld)
- Camera uses Camera.w (800) which equals CANVAS_W from game.js, but Camera currently hardcodes 800
- Script load order: input.js, world.js, entities.js, collision.js, sound.js, hud.js, player.js, game.js

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