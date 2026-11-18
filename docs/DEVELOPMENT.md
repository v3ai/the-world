# Development guide

## Run and test

- Static site, no build step: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000`.
- Three.js r128, its post-processing examples, and astronomy-engine 2.1.19 load from CDNs (see `index.html`). For offline or headless tests, route those URLs to local copies (`npm pack three@0.128.0 astronomy-engine@2.1.19`).
- Headless Chrome needs `--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL; expect about 8 fps, so flights take tens of seconds.
- Debug helpers in the console:
  - `jumpTo(frame, new V3(), D)` teleports the camera; frames are in `FR` (for example `FR.earth`, `FR.die`, `FR.cell`).
  - `goToNode(id)` flies to a topic and opens its card; `showBodyNode(id, null)` opens a card only.
  - `openLab('circuit', 'thevenin')` and `openTracks()`.

## Architecture (js/)

| file | role |
|---|---|
| `engine.js` | Nested frames, each with its own unit (metres per local unit), rendered relative to the eye with depth clears between frames. Also: camera (anchor frame A, target T, distance D in metres), zoom to cursor, re-anchoring, dynamic child frames created by `spawn(T, hint)`, picking, labels. |
| `engine_ui.js` | Info card, library, the scale ruler (`buildRuler`, `updateRuler`), caption, main loop, `startApp()`. |
| `world_space.js` | The cosmos down to Earth, using real data (HYG stars, galaxies, astronomy-engine). |
| `world_matter.js` | Molecules, crystals, liquids and gases, atoms, nuclei, micro-scale scenes, landscapes and the park. |
| `levels_v2.js` | Older hand-built scenes wrapped at true scale (park, cell, DNA, atom, proton, black hole). |
| `body_core.js` | How a click on the body is answered: pick rule, core sample, regions, hide. |
| `nodes.js` | The topic graph (`NODE`), anatomy body and organs, tissues, processes, `goToNode`, `placeGo` (the `where` field). |
| `teardown.js` | Phone, then processor die, CPU core, gates, inverter, FinFET and silicon. |
| `viz.js` | Figure language and renderer. The spec is in `docs/VIZ_SPEC.md`; validate with `node tools/viz/validate.mjs <file>`, preview with `tools/viz/viztest.html?file=<file>`. |
| `labs/host.js` | Lab overlay, plus Tracks with previous/next navigation. Labs register `LABS.<id>.open(container, preset)`. |
| `world_build.js` | Assembles frames and landmarks; `startView()`. |

Styles are all in `css/app.css`. Design tokens are at the top: porcelain panels, ink text, one Prussian-blue accent, and the yellow index used only for the ruler needle. The type is Source Serif 4 with IBM Plex Sans. Keep labels in sentence case and use words, not emoji.

## Picking, the body and flights

- **Pick rule per frame.** `pickFrame` collects every hit; a frame may define `f.chooseHit(cands, forZoom)` to choose (default: highest `priority`, then nearest). The body frame (`bodyChooseHit`, `js/body_core.js`) takes the nearest part whose layer is showing (opacity at least 0.35), else the nearest drawn; markers (priority 3 or more) keep priority; hidden parts have `visible = false` and so cannot be picked.
- **Core sample.** `bodyCoreSample(F, pick)` casts the click's ray through every body part and returns the stack from the skin inward; the card lists it (`coreHtml`). Region of a skin point: `bodyRegion`: the segment of the nearest skeleton vertex (head, neck, arm, leg ...), and for the torso surface-anatomy bands read from the skeleton meshes: chest above the costal margin (sternum tip at the midline, sloping to the lowest front rib at the side; the 0.06 m above it is "lower chest"), abdomen below it down to the top of the hip bone, then lower abdomen and pelvis; at the back upper back down to the foot of the thoracic spine, lower back to the base of the lumbar spine, then buttock; "shoulder" above y 1.4 m and beyond 7 cm from the midline. Face normals are unoriented, so `bodyRegion` turns the normal toward the viewer (the last pick ray) before deciding front or back. `harness/core/t_regions.py` checks 55 points, front and back, that the region name and the stack under it agree.
- **Overlapping child frames.** `reanchor` enters a child via `pickChild`: the one on the current flight's path, else a frame whose `core` radius holds the target (smallest first), else best fit. During a flight, an anchor that is off the flight's path but whose parent is on it is left (siblings are reachable). `Frame.center` offsets the content centre from the frame origin.
- **Landmarks** are `{label, D, frame, go(then), side?}`. `frame` is where the camera must end up; `harness/core/t_all_landmarks.py` checks every landmark and every `placeGo` kind. Captions never show raw ids (`humanName`).
- **Tours** walk the non-`side` landmarks one at a time (`startTour`, `nextTour`, tour bar); `cancelTour()` is called by every manual input.
- **Tests:** `/home/rhett/projects/how/.devtools/harness/core/` (`t_body_core.py`, `t_body_cards.py`, `t_organ_views.py`, `t_tours.py`, `t_all_landmarks.py`, `run_landmarks_parallel.py`). Run with the venv Python; `base.py` sets `WT_URL` and `WT_SHOTS`.

## Co-rendering, fades, extension hooks

- **Co-rendered neighbours.** A child with `coRender = true` and the same `unit` as its parent is drawn whenever the parent is (out to `coMax` metres, default `r1`), shares the parent's depth buffer and is picked with it. `computeActive` builds `active` (the camera chain) and `drawn` (chain plus neighbours). `coAlpha(c, inChain)` is its visibility: the parent's alpha times a smooth distance fade (`0.7*coMax .. coMax`); a co-rendered frame in the camera chain gets only the distance fade, not the parent's `r0` fade. The body does its own opacity per layer (`applyMode` multiplies `F.alpha`), so it is `noFade` and still fades out smoothly; its `coMax` (400 m) is inside the park's 420 m sky dome. `reanchor` never disposes a frame that is in `drawn`; `safePlace` guards `place()` of frames not built yet; flight callbacks run through `safeThen`.
- **Extension hooks.** `WORLD_EXT.push(async FR => {...})` runs inside `buildWorld()` after the fixed frames exist; `EXT_LANDMARKS.push({label, D, frame, go(then), side?})` adds a ruler stop (give it `frame` so the landmark test can check it); `FT.<type> = {...}` defines a frame type; `SEARCH_SOURCES.push(q => [{title, sub, go, rank?}])` adds search results (below).

## Cards, orientation and search (`js/engine_ui.js`)

- **One card.** Scene objects (`INFO`/`userData.info`), explorable topics (`NODE`, `showBodyNode` in `nodes.js`) and knowledge-map topics (`KN`, `showNode`) each build a spec and call `cardHtml(spec)`, so the header (Back, tag, title), figure, tabs (Basics, Deeper, Expert), facts, actions, what it is made of, what it is part of, how it works, textbook sections, open questions and "how certain is this" always come in that order. Spec keys are listed above `cardHtml`. `openPanel(html, {key, reopen})` records the card for Back.
- **No silent clicks.** An id with no card data opens a minimal card ("No description has been written for this yet") and logs `console.warn('No card for pickable id', ...)` once. `auditPickables()` (console) lists, for every drawn frame, the pickable ids with no card; `harness/core/run_audit.py` runs it at every landmark.
- **Where am I.** `updateCrumbs` draws the camera's frame chain in the caption; a step flies out (`crumbGo`: the widest landmark of that frame). `navStack` holds earlier camera and card states (pushed when a card opens and when a flight starts); the Back buttons (`#navBack`, `#cardBack`) pop it. On a phone the ruler strip has no names: tapping it flies to the nearest landmark and says which.
- **Search.** `SEARCH_SOURCES.push(q => [{title, sub, go, rank?}])`; `q` is lower case; `go()` takes the user somewhere. Built in: landmarks, elements (`ELJ`, name or symbol), molecules (`data/molecules_all.json`), explorer topics. Results that go somewhere are listed first, then the knowledge map, key terms and textbook sections. `/` focuses search from anywhere; Enter takes the first result.
- **Debug and tests** in `/home/rhett/projects/how/.devtools/harness/core/`: `t_c2_nav.py` (crumbs, Back, search, minimal card, `/`), `t_c2_phone.py` (phone: bottom sheet, pinch, ruler strip, overlaps), `t_c2_fade.py`, `t_regions.py`, `t_audit.py` / `run_audit.py`.

## Content is data

- **Topics:** `data/nodes/*.json`, listed in `manifest.json`. The schema is in the README; the generators are in `tools/*_nodes/`.
- **Tracks:** `data/tracks/*.json`, listed in `manifest.json`.
- **Figures:** `data/viz/*.json`, mapping node id to spec, listed in `manifest.json`. Later files override earlier ones, so `curated.json` comes last.
- **Lab presets:** `data/labs/*.json`.
- **Reports:** `docs/REPORT_*.md` record each data set: sources, checks and known gaps.

## Open work

- **Labs:** 92 EE lab presets and 49 biology presets are specified but not built (`docs/REPORT_ee_nodes.md`, `docs/REPORT_bio_nodes.md`).
  - EE: signal, logic/CPU, control, field, math, probability, code, network.
  - Biology: genetics, population, microscope, molecule, enzyme, ecosystem.
- **Review:** the prose and numbers need expert review, and the `ext` links haven't been checked.
- **Scenes:** the charger and power grid are topics only, with no 3D scenes yet. There is also no protein renderer; `data/proteins/` is unused.
- **Licensing:** the repo has no licence yet. The anatomy meshes are share-alike (see `assets/ATTRIBUTION.md`).
- **Hosting:** GitHub Pages must be enabled in the repository settings.
