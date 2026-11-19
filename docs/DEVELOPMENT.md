# Development guide

## Run and test

- Static site, no build step: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000`.
- Three.js r128, its post-processing examples, and astronomy-engine 2.1.19 load from CDNs (see `index.html`); three-mesh-bvh is vendored in `js/vendor/`. For offline or headless tests, route those URLs to local copies (`npm pack three@0.128.0 astronomy-engine@2.1.19`).
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
| `perf.js` | Loaded first. URL switches, always-on counters, and the performance meter (`?stats=1`, Shift+P). |
| `mesh_worker.js` | A worker that fetches and decodes anatomy files and thing bundles (positions, indices, normals). |
| `vendor/three-mesh-bvh.js` | three-mesh-bvh 0.5.24 (MIT): bounding-volume trees for picking. |

Styles are all in `css/app.css`. Design tokens are at the top: porcelain panels, ink text, one Prussian-blue accent, and the yellow index used only for the ruler needle. The type is Source Serif 4 with IBM Plex Sans. Keep labels in sentence case and use words, not emoji.

## Picking, the body and flights

- **When picks happen.** The hover (highlight and tooltip) is worked out once the pointer has moved and then rested for 70 ms, or when what is under a resting pointer changed (`viewChanged()`: frames arriving, layers peeling), never while the camera moves. A wheel burst keeps its zoom pivot and picks again at most every 150 ms. Picks are accelerated (bounding trees per mesh, per-instance bounds, a sphere per frame): see Performance.
- **Pick rule per frame.** `pickFrame` collects every hit; a frame may define `f.chooseHit(cands, forZoom)` to choose (default: highest `priority`, then nearest). The body frame (`bodyChooseHit`, `js/body_core.js`) takes the nearest part whose layer is showing (opacity at least 0.35), else the nearest drawn; markers (priority 3 or more) keep priority; hidden parts have `visible = false` and so cannot be picked.
- **Core sample.** `bodyCoreSample(F, pick)` casts the click's ray through every body part and returns the stack from the skin inward; the card lists it (`coreHtml`). Region of a skin point: `bodyRegion`: the segment of the nearest skeleton vertex (head, neck, arm, leg ...), and for the torso surface-anatomy bands read from the skeleton meshes: chest above the costal margin (sternum tip at the midline, sloping to the lowest front rib at the side; the 0.06 m above it is "lower chest"), abdomen below it down to the top of the hip bone, then lower abdomen and pelvis; at the back upper back down to the foot of the thoracic spine, lower back to the base of the lumbar spine, then buttock; "shoulder" above y 1.4 m and beyond 7 cm from the midline. Face normals are unoriented, so `bodyRegion` turns the normal toward the viewer (the last pick ray) before deciding front or back. `harness/core/t_regions.py` checks 55 points, front and back, that the region name and the stack under it agree.
- **Overlapping child frames.** `reanchor` enters a child via `pickChild`: the one on the current flight's path, else a frame whose `core` radius holds the target (smallest first), else best fit. A frame with `enterOnly = true` (every cut-open organ view) is entered only when it is on the current flight's path ("Look inside", double-click on a visible organ, a ruler landmark, `goToNode` of the organ or one of its hotspots): scrolling never enters it, zooming out or the breadcrumb leaves it, and scrolling back in does not re-enter it. While a flight runs, children of the flight's target frame that are not on its path are not entered (flying out of the atom to its parent no longer dives back in). `Frame.floorD` (metres) is a zoom floor: the camera cannot sink below it by scrolling (body 1.5 mm, which is inside the tissue frame's 2 mm; organ views 5% of the organ radius). During a flight, an anchor that is off the flight's path but whose parent is on it is left (siblings are reachable). `Frame.center` offsets the content centre from the frame origin.
- **Auto layers (the descent).** `bodyAutoUpdate` (`js/body_core.js`, called from the body's `F.update`, every ~110 ms) casts the camera's view ray (through the zoom target, which is the point under the cursor while you scroll) through every body part: `bodyRayStack`. `bodyPeel` turns the stack into peel amounts: a layer (skin, then muscle, then vessels, then bone) goes see-through when the camera is closer to its surface than `PEEL_K` (12) times the gap to the next deeper kind of layer behind it (at least 8 mm), each deeper layer waits for the one in front (half the distance), and the first organ, vessel or nerve on the ray is never peeled: the descent ends on the surface of what you point at. Because the distances come from the stack, hand, forearm, head and abdomen each peel at their own scale. The skin is a 2 to 3 mm double-sided shell, so a camera inside it is detected by counting passes. Per-class opacities (`peelOpacities`) ease toward the target in `applyMode`; the Auto button names the layer in focus. Hovering never pulls a ghost layer back (a ghost is not highlighted or outlined). Vessels (`VESSEL_ID`) are a layer of their own between muscle and bone. `bodySurface` gives every body part a faint object-space grain so close-ups of smooth parts are legible. `harness/core/t_descent.py` scrolls with real wheel events at 14 places.
- **Reveal (`goToNode`, search, chips).** A body part with its own cut-open view: fly into that view. A hotspot: fly into its organ's view at the hotspot. Any other part with a mesh: stay in the whole-body view, set `FR.body.reveal = {id}` (everything in front of the part along the view ray is peeled, organs in front are ghosted, the part is solid and highlighted), face it from the side it lies on and fly to its centre. `GOTO_NEAR` maps mesh-less nodes (thyroid) to the part they sit against. Cleared by closing the card, a click, or "Show everything". `harness/core/t_goto_all.py` and `run_goto_parallel.py` check every node with a mesh or hotspot.
- **Lungs.** The anatomy data holds the lungs as airway trees only, so `lungShellGeo` wraps each tree in a schematic outline (a star-shaped hull of the tree's reach, pushed out of the heart). It is a child mesh of the body part (`userData.shell`) and a clickable wall in the cut-open view; the card and view say it is schematic (`LUNG_NOTE`).
- **Landmarks** are `{label, D, frame, go(then), side?}`. `frame` is where the camera must end up; `harness/core/t_all_landmarks.py` checks every landmark and every `placeGo` kind. Captions never show raw ids (`humanName`).
- **Tours** walk the non-`side` landmarks one at a time (`startTour`, `nextTour`, tour bar); `cancelTour()` is called by every manual input.
- **Layered frames (things).** Any frame with `layered = true`, `parts`, `hidden`, `sel`, `reveal` gets the body's core sample, "Hide this", "Peel to here" and "Show everything" (`showBodyNode` reads `h.frame.layered`); `F.coreIds()` / `F.coreClip(point)` / `F.coreText` narrow the sample to what is in the current detail tier and not cut away. `js/things.js` (`FT.thing`) is the user: its Auto peel (`thPeel`, `thAutoUpdate`) is `bodyPeel` over the thing's `layers`; its pick rule is `thChooseHit`. Extension points in `js/nodes.js`: `CARD_HOOKS`, `GOTO_HOOKS`, `frame.cardMadeOf`. The hover tooltip is worked out with `PICK_HOVER` set (`js/body_core.js`): when only see-through layers are under the cursor it names nothing instead of the nearest ghost. Details: `tools/things/SCHEMA.md` section 9.
- **Tests:** `/home/rhett/projects/how/.devtools/harness/core/` (`t_body_core.py`, `t_body_cards.py`, `t_organ_views.py`, `t_tours.py`, `t_all_landmarks.py`, `run_landmarks_parallel.py`, `t_descent.py`, `t_goto_all.py`, `run_goto_parallel.py`, `t_review_fixes.py`). Run with the venv Python; `base.py` sets `WT_URL` and `WT_SHOTS`.

## Co-rendering, fades, extension hooks

- **Co-rendered neighbours.** A child with `coRender = true` and the same `unit` as its parent is drawn whenever the parent is (out to `coMax` metres, default `r1`), shares the parent's depth buffer and is picked with it. If it also sets `mergeable = true` it is drawn inside the parent's scene, one render call for all of them (see Performance); a neighbour that is out of view or under about two pixels is not drawn, picked or (seven frames in eight) updated. `computeActive` builds `active` (the camera chain) and `drawn` (chain plus neighbours). `coAlpha(c, inChain)` is its visibility: the parent's alpha times a smooth distance fade (`0.7*coMax .. coMax`); a co-rendered frame in the camera chain gets only the distance fade, not the parent's `r0` fade. The body does its own opacity per layer (`applyMode` multiplies `F.alpha`), so it is `noFade` and still fades out smoothly; its `coMax` (400 m) is inside the park's 420 m sky dome. `reanchor` never disposes a frame that is in `drawn`; `safePlace` guards `place()` of frames not built yet; flight callbacks run through `safeThen`.
- **Extension hooks.** `WORLD_EXT.push(async FR => {...})` runs inside `buildWorld()` after the fixed frames exist; `EXT_LANDMARKS.push({label, D, frame, go(then), side?})` adds a ruler stop (give it `frame` so the landmark test can check it); `FT.<type> = {...}` defines a frame type; `SEARCH_SOURCES.push(source)` adds search results (below).

## Cards, orientation and search (`js/engine_ui.js`)

- **One card.** Scene objects (`INFO`/`userData.info`), explorable topics (`NODE`, `showBodyNode` in `nodes.js`) and knowledge-map topics (`KN`, `showNode`) each build a spec and call `cardHtml(spec)`, so the header (Back, tag, title), figure, tabs (Basics, Deeper, Expert), facts, actions, what it is made of, what it is part of, how it works, textbook sections, open questions and "how certain is this" always come in that order. Spec keys are listed above `cardHtml`. `openPanel(html, {key, reopen})` records the card for Back.
- **No silent clicks.** An id with no card data opens a minimal card ("No description has been written for this yet") and logs `console.warn('No card for pickable id', ...)` once. `auditPickables()` (console) lists, for every drawn frame, the pickable ids with no card; `harness/core/run_audit.py` runs it at every landmark.
- **Where am I.** `updateCrumbs` draws the camera's frame chain in the caption; a step flies out (`crumbGo`: the widest landmark of that frame). `navStack` holds earlier camera and card states (pushed when a card opens and when a flight starts); the Back buttons (`#navBack`, `#cardBack`) pop it. The skin patch (and the cell, DNA and atoms in it) sits on the person in the park, so its chain shows "You" before it. On a phone the ruler strip has no names: tapping it flies to the nearest landmark and says which; the card is a sheet that starts at about a third of the screen and is dragged up by its handle; the tours are in the Library panel (`#tourIn2`, `#tourOut2`); hints that need a keyboard are `.kb` and hidden on touch.
- **Search.** `SEARCH_SOURCES.push(source)`; a source is a function `q => [{title, sub, go, rank?, prio?}]`, or an object `{id, label, search(q)}` (js/particles.js), or `{id, title, items()}` (js/atom.js; items `{id, title, sub, go?}`, called once; an item without `go` whose id is a `NODE` id opens that node, otherwise it is ignored). `q` is lower case; `go()` takes the user somewhere. A source that throws or is malformed is reported once, never per keystroke. Ranking: exact name, then starts with or a word starts with, then contains; within those, places you can fly to (`prio` 0: landmarks, planets, the Sun, the Moon, park objects) before topics, elements, molecules; an element symbol typed exactly ("Fe") is an exact match. Built in: landmarks, elements, molecules, explorer topics, `bodyPlaces()` (planets and the Sun and Moon from `FR`, park objects from `INFO`). With no match the panel says so and offers the topics nearest to the words typed (`noMatchHtml`). Results that go somewhere are listed first, then the knowledge map (title matches first, then whole-word matches in the summary), key terms and textbook sections. `/` focuses search from anywhere; Enter takes the first result.
- **Debug and tests** in `/home/rhett/projects/how/.devtools/harness/core/`: `t_c2_nav.py` (crumbs, Back, search, minimal card, `/`), `t_c2_phone.py` (phone: bottom sheet, pinch, ruler strip, overlaps), `t_c2_fade.py`, `t_regions.py`, `t_audit.py` / `run_audit.py`.

## Panels, labels and the free area (engine)

- **Free area.** `updateViewOffset` (js/engine.js, called every frame) measures the Tracks panel, the ruler and the open card and shifts the projection (`viewOff`, pixels, applied with `setViewOffset` in `placeFrameCam`) so the camera target sits in the middle of the part of the screen that is not under a panel. On a phone the card is a sheet at the bottom and the shift is vertical. Picking, labels and the zoom pivot all go through `f.cam`, so they follow.
- **Caption.** It folds to one line (`#caption.min`) while a card is open or about 14 s after you arrive; the Hide details / Show details button overrides that for the current place. Frames may set `F.note` (shown in italics) and `F.device = true` (hides the clock).
- **Labels.** The label layer forwards the mouse wheel to the canvas (zoom works over a label). `declutterLabels` runs every 160 ms in every scene: where labels collide the one with the higher `data-pri` stays, the rest get the class `lblhide`. A label made with `{pick: obj}` opens the card of `obj` (the part it names).
- **Object destinations.** `userData.zoomTo(h)` on a picked object overrides what Zoom in and double-click do (return `false` to fall back).
- **Ruler name.** `updateRuler` bolds a landmark's name only if its frame is on the camera's path; the scale tick always shows.
- **Teardown descent.** `tearAttract(F, dt, target, D1, rad)` (js/teardown.js) drifts the camera target to the next level's centre inside `rad` once D is below `D1`, so scrolling reaches the next frame whatever the cursor precision; `Frame.floorD` stops the camera sinking into empty space inside one frame.

## Performance

The target is 60 frames a second on a mid-range laptop GPU and a usable frame rate on a phone. The rules below are what keeps it there; `harness/core/t_perf_budget.py` fails when the start view breaks its budget.

### Measure first: the meter and the switches (`js/perf.js`)

- **Meter:** add `?stats=1` to the URL or press Shift+P. It shows frames per second and frame-time percentiles, CPU ms split into update, picking, drawing and other, GPU ms where the browser has `EXT_disjoint_timer_query_webgl2` (desktop Chrome and Edge), draw calls, triangles, scenes, the drawing-buffer size and scale, and the GPU's name. If the name is a software renderer (SwiftShader, llvmpipe, "Basic Render") the meter says so: then the fix is in the browser's settings, not in the app. "Copy report" puts all of it on the clipboard.
- **Switches** (URL, and live from the meter; `depth` reloads the page):

| switch | values (default first) | what it does |
|---|---|---|
| `bloom` | `half`, `full`, `0` | glow: from a quarter-size bright target, from a half-size one, off |
| `dpr` | `auto`, a number | render scale relative to CSS pixels: adapted to the frame time, or fixed |
| `shadows` | `1`, `0` | the park's sun shadow |
| `outline` | `near`, `all`, `0` | ink outlines: near things, everything, only the part pointed at or selected |
| `depth` | `log`, `tight`, `vert` | depth buffer: logarithmic per fragment, ordinary depth in slices, logarithmic per vertex |
| `merge` | `1`, `0` | draw co-rendered things inside their parent's scene |
| `idle` | `1`, `0` | about 30 frames a second when nothing moves |
| `fx` | none, `low`, `high` | preset: `low` = no bloom, no shadow, outline 0, scale at most 1; `high` = full bloom, all outlines |

- The counters behind the meter are always on: `PERF.cpu`, `PERF.calls`, `PERF.tris`, `PERF.renders` (scenes drawn), `PERF.passes`, `PERF.pickPct()`, `PERF.report()`.
- No GPU on the test machine: Chromium draws with SwiftShader there, so only counts and CPU times mean anything. Reason from counts, CPU time and passes, and say which numbers are measured and which are expected.

### Budgets

Measured at 1280 × 800, device pixel ratio 1, by `t_perf_budget.py` (limits are about a quarter above what the views cost today):

BUDGET_TABLE

A new scene should fit the "other views" row: one scene, under 200 draw calls, under 150 thousand triangles, under 3 ms of CPU.

### Rules

- **No per-frame raycasts.** Hover is worked out only after the pointer has moved and rested (70 ms) or the view under it changed (`viewChanged()`), never while the camera moves. A wheel burst re-uses its pivot. Anything that casts rays from an update hook must be keyed on what it depends on and rate-limited, as `bodyAutoUpdate` is (camera position and target, at most every 110 ms).
- **Picking is accelerated; keep it that way.** Every mesh of 64 triangles or more gets a bounding-volume tree (three-mesh-bvh, `js/vendor/`), built in idle slices (`pkIdle`); an `InstancedMesh` gets per-instance bounds in a tree (`pkInstAccel`); a frame's pickables are skipped when the ray misses their bounding sphere. A geometry whose positions are rewritten every frame, or that uses `setDrawRange`, is tested the plain way: keep such geometry small or out of `pickables`. An object with its own `raycast` method switches the frame's sphere test off.
- **Opaque by default.** `illoMat` materials are opaque while their opacity is 1 and blend only while something lowers it. Do not create a material with `transparent: true` unless it is always see-through, additive, or part of a construction that relies on render order (the cut-open organ parts, the markers). Layers that must be painted in a fixed order whatever their depth use `paintedInOrder` (the body).
- **No per-frame geometry rebuilds and no allocations in update hooks.** Reuse vectors and matrices; move things in the vertex shader where you can (the things' sway).
- **Instance crowds.** Anything that repeats more than a few dozen times is an `InstancedMesh`. Give the frame a detail tier that drops it with distance.
- **Three detail tiers** for anything large (`lod` in a thing's data: near, mid, far), and no ink on the far tier.
- **Static parts set `matrixAutoUpdate = false`** (after `updateMatrix()`).
- **One scene where possible.** A frame type that is co-rendered with its parent and can live with the parent's lights sets `mergeable = true` and hides its own lights in `onMerge(on)`; the engine then draws it inside the parent's scene. A frame that needs its own lights (the body) stays a scene of its own.
- **Glow is opt-out by nature of the scene:** an illustrated frame (`illo`) seen close and a daylight frame that fills the view (`daylight`) take none; then no full-screen pass runs at all.
- **Shadows:** a shadow-casting light sets `shadow.autoUpdate = false` and asks for an update only when the light or a caster has moved (see `shadowStep` in `js/world_matter.js`, which also shifts the shadow matrix with the scene origin).
- **Custom shaders** wrap GLSL with `LDV()`/`LDF()` as before; that keeps them right in all three depth modes.
- **Point sizes** in a shader multiply by the shared uniform `PIXK` (js/engine.js), so they keep their size on screen when the render scale adapts.

### What the engine does for you

- **Culling:** a co-rendered neighbour whose content is out of view or under about two pixels is not drawn or picked, and its update hook runs every eighth frame.
- **Render scale:** capped at about 2.8 million pixels and adapted to the frame time (`RENDER SCALE` in js/engine.js). Under browser automation it is fixed unless `dpr=auto` is in the URL.
- **Resting:** after 1.5 s with nothing moving, every other frame is skipped; hidden tabs and open labs draw nothing.
- **Shader compile:** `renderer.compile` runs when a frame is built and again when its content arrives.
- **Loading:** anatomy files and thing bundles are fetched and decoded in `js/mesh_worker.js`; `loadNote(label, promise)` names what is still arriving.

### Performance tests

Run with the venv Python from `harness/core/`:

- `t_perf_budget.py`: the budgets above; fails if the start view (or another listed view) exceeds them.
- `t_perf_pick.py`: the pointer moving for five seconds while zooming, in three places; worst single pick, most picking in one frame, and that the zoom pivot is re-used.
- `t_perf_scale.py`: the render-scale rules with made-up frame times, then the real page with `?dpr=auto`.
- `t_prof.py start body1m park30 oak atom sm earth solar cell`: ms per frame by function, draw calls, triangles and scenes for named views.

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
