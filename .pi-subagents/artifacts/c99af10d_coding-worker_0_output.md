game.js flows cleanly from game state variables directly to `// ── Init / Reset ──`. The Sound section is cleanly extracted. All acceptance checks pass.

```text
STATUS: COMPLETED
SUMMARY: Extracted the Sound IIFE (ensure, tone, noise, play, unlock) and its two unlock event listeners from game.js into a new js/sound.js. Added sound.js script tag in index.html before player.js and game.js.
FILES_CHANGED:
- js/sound.js: Created — contains full Sound IIFE + keydown/pointerdown unlock listeners
- js/game.js: Removed Sound IIFE (~90 lines) and two unlock event listeners; all Sound.play() calls preserved
- index.html: Added <script src="js/sound.js"> before player.js and game.js
CHECKS:
- grep -c "Sound" js/sound.js: PASS (3 direct Sound refs; 26 for function/unlock/play/tone/noise/ensure — full IIFE present)
- grep "const Sound =" js/game.js: PASS (0 matches — IIFE definition removed)
- grep "addEventListener.*unlock" js/game.js: PASS (0 matches — unlock listeners removed)
- grep "Sound.play" js/game.js: PASS (14 matches — consumer calls intact)
- grep "sound.js" index.html: PASS (script tag present at line 30)
- Script load order (sound.js line 30 < player.js line 31 < game.js line 32): PASS
- grep "typeof Sound" js/player.js: PASS (1 match — guard intact)
REMAINING_RISK: none
FAILURE_FINGERPRINT: N/A
NEXT_RECOMMENDATION: N/A
```