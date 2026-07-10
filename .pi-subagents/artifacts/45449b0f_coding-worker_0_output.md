All changes are clean and correct. Pre-existing uncommitted changes in `index.html` (adding collision.js, sound.js, hud.js) are human-owned and untouched by me.

```text
STATUS: COMPLETED
SUMMARY: Extracted Camera object from world.js into new js/camera.js, added camera.js script tag before world.js in index.html. All 23 existing Camera references across game.js, player.js, entities.js, and world.js remain intact.
FILES_CHANGED:
- js/camera.js: new module containing the Camera object (x, y, w, h, follow)
- js/world.js: removed Camera object definition (19 lines deleted)
- index.html: added <script src="js/camera.js"></script> before world.js
CHECKS:
- grep -c "const Camera" js/camera.js → 1 (PASS)
- grep "const Camera" js/world.js | wc -l → 0 (PASS)
- grep "camera.js" index.html → found (PASS)
- grep -rn "Camera\." js/ --include="*.js" | wc -l → 23, >0 (PASS)
REMAINING_RISK: none
```