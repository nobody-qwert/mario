# Task for coding-worker

TASK_ID: refactor-01-extract-sound

GOAL:
Extract the Sound IIFE module from game.js into a new js/sound.js so game.js no longer owns audio synthesis.

ACCEPTANCE_CRITERIA:
- js/sound.js exists and contains the full Sound IIFE (ensure, tone, noise, play, unlock)
- game.js no longer contains the Sound IIFE or the window event listeners that call Sound.unlock()
- js/sound.js registers its own window event listeners for unlock (keydown + pointerdown, once each)
- The game still loads correctly: sound.js must load BEFORE game.js and player.js in index.html
- player.js's `typeof Sound !== 'undefined'` check still works (Sound is a global)

ALLOWED_PATHS:
- js/game.js (remove Sound IIFE + unlock listeners)
- js/sound.js (create)
- index.html (add sound.js script tag before game.js and player.js)

ENTRY_SYMBOLS:
- `Sound` IIFE in game.js (lines ~70-160)
- `window.addEventListener('keydown', ...)` and `window.addEventListener('pointerdown', ...)` unlock lines in game.js
- Script tags in index.html

ACCEPTANCE_COMMANDS:
- No build/lint commands exist. Verify by: (a) grep -c "Sound" js/sound.js (should be >5), (b) grep "Sound" js/game.js should show zero matches for the IIFE body (only OK if game.js still calls Sound.play()), (c) grep "sound.js" index.html (must exist), (d) check script load order in index.html has sound.js before player.js and game.js

CONSTRAINTS:
- Do not change the Sound API (unlock, play) — it must remain identical
- Do not modify player.js or any other file except the three listed
- Preserve the Sound IIFE's internal behavior exactly (same tone/noise parameters, same switch cases)

KNOWN_FACTS:
- project is a pure browser game with no build system or tests
- index.html loads scripts in order: input.js, world.js, entities.js, player.js, game.js
- player.js references Sound via `typeof Sound !== 'undefined'` guard
- Sound IIFE in game.js spans from `const Sound = (() => {` to the closing `})();` plus two window event listeners

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