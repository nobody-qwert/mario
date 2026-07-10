# Task for coding-worker

TASK_ID: refactor-03-extract-hud

GOAL:
Extract all HUD DOM references and helper functions from game.js into a new js/hud.js module.

ACCEPTANCE_CRITERIA:
- js/hud.js exists and contains: all HUD DOM element refs (elScore, elCoins, elTime, elLives, elWorld, elOverlay, elTitle, elSubtitle, elAction), showOverlay(), hideOverlay(), updateHUD()
- game.js no longer contains those DOM refs or function bodies (only calls to showOverlay/hideOverlay/updateHUD remain)
- hud.js loads before game.js in index.html
- updateHUD() still reads global score, coinCount, timeLeft, lives, currentMapIndex

ALLOWED_PATHS:
- js/hud.js (create)
- js/game.js (remove HUD DOM refs and 3 HUD functions)
- index.html (add hud.js script tag)

ENTRY_SYMBOLS:
- `const elScore = document.getElementById('score')` block in game.js (lines ~43-50)
- `function showOverlay(title, subtitle, action)` in game.js
- `function hideOverlay()` in game.js
- `function updateHUD()` in game.js

ACCEPTANCE_COMMANDS:
- grep -c "elScore" js/hud.js (should be >= 2, one in getElementById, one in updateHUD)
- grep "const elScore" js/game.js | wc -l (should be 0)
- grep -c "function showOverlay" js/hud.js (should be 1)
- grep "function showOverlay" js/game.js | wc -l (should be 0)
- grep -c "function updateHUD" js/hud.js (should be 1)
- grep "hud.js" index.html (must exist, before game.js)
- grep "showOverlay\|hideOverlay\|updateHUD" js/game.js (should find calls only, not definitions)

CONSTRAINTS:
- Do not change function signatures
- Do NOT move the resizeCanvas function or canvas setup — those are rendering, handled in a later task
- Preserve all global variable reads in updateHUD (score, coinCount, timeLeft, lives, currentMapIndex)
- Do not modify any file other than the three listed

KNOWN_FACTS:
- Script load order: input.js, world.js, entities.js, collision.js, sound.js, player.js, game.js
- HUD elements are DOM elements from index.html: #score, #coins, #time, #lives, #world, #overlay, #overlay-title, #overlay-subtitle, #overlay-action
- showOverlay/hideOverlay are called from game.js state machine

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