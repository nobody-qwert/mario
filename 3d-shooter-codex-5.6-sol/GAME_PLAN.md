# 3D First-Person Shooter — Project Plan

## Overview

A **single-page, static HTML** first-person shooter built with Three.js, deployable to GitHub Pages. No server-side code required. All assets (textures, models) are generated procedurally or via inline data — no external file hosting needed beyond the CDN-loaded Three.js library.

---

## Architecture

### File Structure
```
/index.html          # Main game entry point (single HTML with embedded JS/CSS)
/assets/             # Optional: small inline SVGs, if any
  └── README         # "All assets are procedural — no files needed"
```

The entire game lives in **one `index.html` file** (~15–30 KB of hand-written code + Three.js from CDN). This is the most GitHub Pages-friendly approach.

### Dependencies (CDN only)
| Library | Purpose | CDN Source |
|---------|---------|------------|
| **Three.js r160+** | 3D rendering engine | `unpkg.com` or `cdnjs.cloudflare.com` |
| **PointerLockControls** | FPS mouse-look (built into Three.js addons) | Same CDN as above |

No build step, no bundler, no npm install. Just `<script type="module">` imports from CDN.

---

## Core Systems

### 1. Rendering & Scene Setup
- Three.js `WebGLRenderer` with shadow maps enabled
- Perspective camera at eye level (1.7m height)
- Hemisphere light + directional light for basic shading
- Fog for atmosphere and to hide draw distance

### 2. Quake3-Like Map
A **procedurally generated arena** using Three.js `BoxGeometry` walls, floors, and ceilings:

```
Map Design Principles (Quake3 inspired):
├── Large open central arena with cover objects
├── Multiple corridors connecting rooms
├── Elevated platforms / catwalks
├── Pillars for cover
├── Symmetrical layout for fair gameplay
└── Visible enemy spawn points from multiple angles
```

**Map implementation:**
- Floor: large flat plane (100×100 units)
- Walls: box geometries arranged in a symmetrical arena layout
- Cover objects: crates, barrels, pillars scattered throughout
- All geometry uses `MeshStandardMaterial` with procedural textures

### 3. Procedural Emoji Textures
All textures are generated from emoji characters rendered to off-screen `<canvas>` elements, then converted to Three.js `CanvasTexture`:

| Texture | Emoji Source | Technique |
|---------|-------------|-----------|
| **Concrete walls** | 🧱🏗️ | Tile a grid of brick/building emojis on canvas |
| **Metal floor** | ⚙️🔩 | Metallic gradient with gear emoji accents |
| **Wood crates** | 📦 | Brown gradient with box emoji pattern |
| **Barrels** | 🛢️ | Cylindrical texture from barrel emoji |
| **Danger signs** | ⚠️🚧 | Warning stripe pattern on cover objects |
| **Blood splatter** | 🔴💥 | Red/orange radial gradient for hit effects |

**Implementation:** Each texture is a function that draws to an offscreen canvas at 256×256 or 512×512, then creates a `CanvasTexture` with `wrapS/wrapT = RepeatWrapping`.

### 4. First-Person Camera & Controls
- **Pointer Lock API** for mouse capture (standard FPS pattern)
- WASD movement with collision detection against map geometry
- Space to jump, shift to sprint
- Mouse look with pitch/yaw rotation
- Crosshair overlay (CSS-based, centered on screen)

### 5. Weapon System
A simple **pistol/assault rifle** rendered as a low-poly model attached to the camera:

```
Weapon Model:
├── Gun body: BoxGeometry (dark gray material)
├── Barrel: CylinderGeometry
├── Muzzle flash: PointLight + sprite (yellow/orange glow)
└── Recoil animation: slight camera shake on fire
```

**Shooting mechanics:**
- Left click → raycast from camera center
- Hitscan weapon (instant hit detection, not projectile-based)
- Visual feedback: muzzle flash light, bullet tracer line, impact particle
- Ammo counter in HUD (resets when empty, auto-reload)

### 6. Enemy AI Characters
3D humanoid enemies that patrol and chase the player:

```
Enemy Model (procedural low-poly):
├── Body: BoxGeometry (colored material)
├── Head: SphereGeometry
├── Arms: CylinderGeometry
└── Legs: CylinderGeometry
    All assembled in a THREE.Group for animation
```

**AI Behavior States:**
| State | Trigger | Action |
|-------|---------|--------|
| **Patrol** | Default | Walk between waypoints |
| **Chase** | Player spotted (line-of-sight check) | Move toward player |
| **Attack** | Player in range + line of sight | Fire projectiles at player |
| **Dead** | Health reaches 0 | Fall over animation, disappear after delay |

**Enemy properties:**
- Health: 100 HP per enemy
- Damage on hit: 10–25 (varies by distance)
- Speed: moderate walking pace
- Spawn points: 4–6 positions around the map edges
- Wave system: enemies respawn in waves after all are killed

### 7. HUD / UI Overlay (HTML/CSS, not Three.js)
```
┌──────────────────────────────────┐
│  WAVE: 3    ENEMIES LEFT: 4      │ ← Top bar
│                                  │
│              🎯                  │ ← Center crosshair
│                                  │
│  ❤️❤️❤️❤️❤️   🔫 AMMO: 12/30  │ ← Bottom bar
└──────────────────────────────────┘
```

- Health: heart icons or health bar (5 hearts = full)
- Ammo counter with current/magazine format
- Wave indicator and enemy count
- Damage flash overlay (red screen edge when hit)
- Game over / victory screens

### 8. Audio (Web Audio API — no files needed)
All sounds generated procedurally:

| Sound | Generation Method |
|-------|-------------------|
| **Gunshot** | White noise burst + low-frequency decay |
| **Hit** | Short high-pitch beep |
| **Enemy death** | Descending tone sweep |
| **Jump** | Rising sine wave chirp |
| **Background ambience** | Low drone oscillator |

---

## Game Loop Flow

```
1. Player enters page → "Click to Start" overlay with instructions
2. Pointer lock activates → FPS controls engage
3. Wave 1 begins → enemies spawn at designated positions
4. Player eliminates all enemies → wave complete
5. Next wave spawns (more enemies, slightly faster)
6. Game over if player health reaches 0
7. Victory screen after surviving N waves (e.g., 10 waves)
```

---

## Technical Implementation Order

### Phase 1: Foundation (index.html skeleton)
- [ ] HTML structure with canvas container and HUD overlay
- [ ] Three.js import from CDN via ES modules
- [ ] Renderer, scene, camera setup
- [ ] PointerLockControls integration
- [ ] Basic WASD + mouse look movement

### Phase 2: Map & Textures
- [ ] Procedural emoji texture generator (canvas → CanvasTexture)
- [ ] Arena geometry: floor, walls, cover objects
- [ ] Collision detection against map geometry
- [ ] Lighting setup with shadows

### Phase 3: Weapon & Shooting
- [ ] Gun model attached to camera
- [ ] Raycasting for hitscan shooting
- [ ] Muzzle flash visual effect
- [ ] Ammo system and HUD display
- [ ] Procedural gunshot sound

### Phase 4: Enemies
- [ ] Low-poly humanoid enemy model (procedural geometry)
- [ ] Enemy spawning system with waypoints
- [ ] AI state machine (patrol → chase → attack → dead)
- [ ] Line-of-sight detection for player spotting
- [ ] Enemy projectile system
- [ ] Health and damage system

### Phase 5: Game Systems
- [ ] Wave management (spawn, track kills, advance)
- [ ] Player health system with damage feedback
- [ ] HUD updates (health, ammo, wave, enemies left)
- [ ] Damage flash overlay
- [ ] Start screen, game over screen, victory screen

### Phase 6: Polish
- [ ] Particle effects for impacts and explosions
- [ ] Enemy death animation (fall over + fade out)
- [ ] Procedural ambient sound loop
- [ ] Performance optimization (frustum culling, LOD if needed)
- [ ] Responsive layout for different screen sizes

---

## File Size Budget

| Component | Estimated Lines |
|-----------|----------------|
| HTML/CSS structure | ~150 lines |
| Three.js setup & controls | ~200 lines |
| Map generation + textures | ~300 lines |
| Weapon system | ~250 lines |
| Enemy AI + models | ~400 lines |
| Game logic + HUD | ~300 lines |
| Audio + polish | ~200 lines |
| **Total** | **~1,800 lines of JS** |

This is well within a single file's practical limits. Three.js itself (~600 KB minified) comes from CDN and is cached by browsers.

---

## GitHub Pages Deployment

1. Push `index.html` to a repository
2. Enable GitHub Pages in repo settings (source: main branch, `/` folder)
3. Game is live at `https://<username>.github.io/<repo>/`

No build step, no server configuration needed.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| CDN availability | Include fallback CDN or inline minimal Three.js core if needed |
| Mobile support | Pointer Lock API doesn't work on mobile — add touch controls as optional fallback |
| Performance with many enemies | Limit to 8–12 active enemies; use simple geometry (boxes/cylinders only) |
| Emoji texture quality at distance | Use higher-res canvas textures (512×512); add basic fog to mask detail loss |

---

## Success Criteria

- [ ] Game loads and runs in any modern browser from GitHub Pages
- [ ] FPS controls work (WASD + mouse look via Pointer Lock)
- [ ] Quake3-style arena map is navigable with collision detection
- [ ] All textures are procedurally generated from emoji/unicode characters
- [ ] Player can shoot enemies and see visual feedback
- [ ] Enemies have basic AI (patrol, chase, attack)
- [ ] Wave system works through at least 5 waves
- [ ] HUD displays health, ammo, wave info
- [ ] Game has start screen, game over, and victory states
- [ ] All audio is procedurally generated (no external files)
- [ ] Single `index.html` file — no build step required
