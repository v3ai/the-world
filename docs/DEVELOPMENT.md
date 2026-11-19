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
| `engine_ui.js` | The one panel (path and Back, the card of the selected thing, the place card, scene sections, minimise), library, the scale ruler (`buildRuler`, `updateRuler`), main loop, `startApp()`. |
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
- **Landmarks** are `{label, D, frame, go(then), side?}`. `frame` is where the camera must end up; `harness/core/t_all_landmarks.py` checks every landmark and every `placeGo` kind. Place names never show raw ids (`humanName`).
- **Tours** walk the non-`side` landmarks one at a time (`startTour`, `nextTour`, tour bar); `cancelTour()` is called by every manual input.
- **Layered frames (things).** Any frame with `layered = true`, `parts`, `hidden`, `sel`, `reveal` gets the body's core sample, "Hide this", "Peel to here" and "Show everything" (`showBodyNode` reads `h.frame.layered`); `F.coreIds()` / `F.coreClip(point)` / `F.coreText` narrow the sample to what is in the current detail tier and not cut away. `js/things.js` (`FT.thing`) is the user: its Auto peel (`thPeel`, `thAutoUpdate`) is `bodyPeel` over the thing's `layers`; its pick rule is `thChooseHit`. Extension points in `js/nodes.js`: `CARD_HOOKS`, `GOTO_HOOKS`, `frame.cardMadeOf`. The hover tooltip is worked out with `PICK_HOVER` set (`js/body_core.js`): when only see-through layers are under the cursor it names nothing instead of the nearest ghost. Details: `tools/things/SCHEMA.md` section 9.
- **Going to a part of a thing** (`thFindNode`, `thFlyToNode`, js/things.js). The flight aims at the part's centre (a point on the part when its centre is off the surface; the middle of its paths for a flow part), or, for an instanced part (a leaf, a petal, a hair), at ONE representative instance chosen the same way every time (`thRepInstance`: within reach, outermost). The nearest it goes is `part.fly_m`, else 0.4 m scaled with the thing but at most 4 radii of a small part. `F.spawnHold` stops a flight that ends very close from diving into what the part is made of until you zoom in further. On landing a cut or pivoted view is turned to face the camera, and `thClearView` looks from another side if something of another frame (or, a moment later, a solid part of the thing's own) hides the target. A card about something inside a thing that has no visible marker peels what is in front of the nearest inner part. `noPick` on an object's `userData` makes it unpickable (the park's ground and grass while a thing has made them see-through); `auto.ground_see_through` lets the ray-based Auto do that.
- **Tests:** `/home/rhett/projects/how/.devtools/harness/core/` (`t_body_core.py`, `t_body_cards.py`, `t_organ_views.py`, `t_tours.py`, `t_all_landmarks.py`, `run_landmarks_parallel.py`, `t_descent.py`, `t_goto_all.py`, `run_goto_parallel.py`, `t_review_fixes.py`). Run with the venv Python; `base.py` sets `WT_URL` and `WT_SHOTS`.

## Co-rendering, fades, extension hooks

- **Co-rendered neighbours.** A child with `coRender = true` and the same `unit` as its parent is drawn whenever the parent is (out to `coMax` metres, default `r1`), shares the parent's depth buffer and is picked with it. If it also sets `mergeable = true` it is drawn inside the parent's scene, one render call for all of them (see Performance); a neighbour that is out of view or under about two pixels is not drawn, picked or (seven frames in eight) updated. `computeActive` builds `active` (the camera chain) and `drawn` (chain plus neighbours). `coAlpha(c, inChain)` is its visibility: the parent's alpha times a smooth distance fade (`0.7*coMax .. coMax`); a co-rendered frame in the camera chain gets only the distance fade, not the parent's `r0` fade. **Neighbours get out of the way of a close-up.** When the camera is anchored in (or inside) one co-rendered thing and within 5 sizes of it (`cam.D < 5 * radius`), every other co-rendered neighbour fades out with its distance from the camera: gone beyond 24 times the viewing distance, untouched inside 10 times it (`coAlpha`, js/engine.js, `_coHost`). At the bee (D 1 cm) the person 4 m away is not drawn at all; pulling back past 5 sizes brings everything back smoothly. It is general: no trail or card has to hide the body (the trails' `hideBody` action still works and is still needed only for the phone, which sits in the hand of the body itself). The body does its own opacity per layer (`applyMode` multiplies `F.alpha`), so it is `noFade` and still fades out smoothly; its `coMax` (400 m) is inside the park's 420 m sky dome. `reanchor` never disposes a frame that is in `drawn`; `safePlace` guards `place()` of frames not built yet; flight callbacks run through `safeThen`.
- **Extension hooks.** `WORLD_EXT.push(async FR => {...})` runs inside `buildWorld()` after the fixed frames exist; `EXT_LANDMARKS.push({label, D, frame, go(then), side?})` adds a ruler stop (give it `frame` so the landmark test can check it); `FT.<type> = {...}` defines a frame type; `SEARCH_SOURCES.push(source)` adds search results (below).

## The panel, click and double-click

There is one place to read: the panel on the right (`#panel` in `index.html`, `ONE PANEL` in `css/app.css`, `THE PANEL` in `js/engine_ui.js`). Nothing else on the page is an information box; a scene must not build one.

- **What it holds, top to bottom.** The path (`#crumbs`: each step flies out) with Back and Minimise; a question trail while one plays (`#trail`, js/trails.js) and the steps of a process (`#proc`, js/nodes.js); the card of the selected thing (`#info`, drawn by `openPanel`) or, with nothing selected, the place card (`#place`: `F.name`, `F.blurb`, the honest note `F.note`, what moves `F.timeNote`, and the buttons Look inside and See it from further out); under a card the place shrinks to its name and note. Then the scene's own explanations as sections, then Time (the clock: `#timebar`; `F.device = true` hides it). The field of view is one line at the bottom left (`#fov`), with a small Time button that opens the panel at its Time section.
- **Scene sections.** A frame's interface elements (`seg`, `actBtn`, `uiEl`) go to the control row at the top of the scene (`#controls`), except an element with `data-sec="Title"`: `updateControls` (js/engine.js) mounts it in the panel as a folding section (`panelSection`). It is open the first time it is met and folded once it has been on screen for 20 s (`data-sec-open="always"` keeps a working panel open, such as the Standard Model view's or a cut view's legend); the visitor's own fold is remembered (`store` key `panelSecs`, by `data-sec-key`). A section whose element is empty or `display: none` is not shown. Users: the atom's "What this picture is" and "Light from this atom" (js/atom.js), the keys of the proton and the nucleus and the Standard Model panel (`PX.el`, js/particles.js), the legend of a thing's cut view (js/things.js).
- **Minimise.** `panelMinimise()` folds the panel to `#panelTab`, a slim tab at the right edge (a pill at the bottom on a phone); the state is remembered (`store` key `panelMin`). While minimised it never opens by itself: `panelShow(why)` is the only way in and is called only from something the visitor did: a click on a thing (after the double-click window), a result in search or a link in a list (the Library, Tracks, the Questions list, the starter questions: one capture listener in `startApp`), the tab, the clock button, a trail's "Show text". A flight, a change of frame, a tour, a trail step, a double click: the tab shows the new title and a quiet dot, nothing opens. `PANEL.opened` lists what opened it, for the tests. On a first visit the panel is open with a one-line hint (`#panelHint`), dismissed by the first click on a thing.
- **Free area.** `freeArea()` (js/engine.js) is the part of the screen between the ruler (or Tracks) and the open panel; on a phone, between the top buttons and the bottom sheet (36% of the height, dragged up by its handle to 82%). `updateViewOffset` shifts the projection (`viewOff`) so the camera target sits at its centre (`viewCentre()`); picking, labels and the zoom pivot go through `f.cam`, so they follow. The atom centres its cloud itself against the same area.
- **Click.** A click on a thing (`onClick` → `clickThing`, js/engine.js; a label is its thing) selects it: `selectHit` draws its card and highlights it at once (the body and things outline the part via `F.sel`; other materials glow; a thing that cannot glow, a star or a marker, gets the ring `#selMark`), and after the double-click window (`DBL_MS`, 300 ms) `frameSelected` flies to frame it: its whole extent (`hitExtent`: `userData.extent(h)`, else `center`/`radius`, else its bounding box) at `fitD` in the free area. Already framed: no move. More than 2.5 times larger than the view (the skin, the ground): no move. No size of its own (a point, a marker, one of a crowd): brought to the middle at the distance you are at. A click on nothing or on the sky (`isBackdrop`) deselects and does not move the camera. A drag is never a click (6 px).
- **Double-click, and "Look inside".** Two clicks within `DBL_MS` (or within `DBL_LATE_MS`, 480 ms, on the same thing), by the events' own time stamps, call `lookInside(h)` (js/engine.js) with the hit of the first click; the card's Look inside button calls it with the same hit. It never does nothing; a double click on nothing does nothing. `lastInside` records what happened (`{how, frame}`).
  1. *A cut-open view first* (`cutOpenOf`): `userData.cutOpen(h, peek)` or `frame.cutOpen(h, peek)` (the Sun's cut-away; a thing's cut or sample mode nearest the point, `thCutOpen`; the phone opened to the part; `peek` only asks whether there is one, and `false` passes), then a cut-open organ view. A scene may instead give its whole own answer with `userData.lookInside(h)` (a Standard Model particle plays its decay or says that no parts are known: `showNoParts`).
  2. *Otherwise the next level down at the point*, which belongs to the descent module when it is loaded: `DESCENT.inside(h)` returns `{ok: true, title, note}` (it has flown there; `note` is shown on the new place) or `{ok: false, reason, card}` (`showNotBuilt(h, reason, card)` shows the sentence in the panel, on that card). `wireLookBtns` asks `DESCENT.describe(h)` to name the button ("Look inside: muscle tissue") and to show a stand-in note; `goFurtherOut` calls `DESCENT.up()`. Every call is guarded with `typeof DESCENT !== 'undefined'`.
  3. *Without that module* (`insideFallback`), today's entry points in this order: `userData.zoomTo(h)` (the frame the object stands for: a star, a planet, Sgr A*, the park's marker; skipped when the camera is already there), `userData.inner(h)` (the atom's nucleus), `frame.cardMadeOf` (a part of a thing with a closer view: `thGoDeeper`), `frame.spawn(point, hit)` (the engine's descent at the clicked point), a frame that already sits inside the object at the point, `diveMaterial` (`userData.madeOf`). If nothing answers, `notBuilt` flies as close as the view allows and `showNotBuilt` says "No closer view of this has been built yet" in the panel (on the card of what the thing is made of when one exists) and in a toast.
  When the answer is another frame, the card stays for the flight and the place takes the panel on arrival (`selLeave`); flights that belong to the selection go through `flyKeep` / `flyKeepDo`.
- **"See it from further out"** (`goFurtherOut`) is `DESCENT.up()` when the descent module is loaded, else the step before the last one in the path (`crumbGo`).
- **Touch.** A tap is a click and a double tap looks inside; the canvas has `touch-action: none` and the viewport does not scale, so the browser does not zoom on a double tap.
- **Tests:** `harness/core/t_ui_clicks.py` (click and double-click in each scene of `ui_scenes.py`; `--phone`), `t_ui_panel.py` (the panel rules; `--phone`).

## Cards, orientation and search (`js/engine_ui.js`)

- **One card.** Scene objects (`INFO`/`userData.info`), explorable topics (`NODE`, `showBodyNode` in `nodes.js`) and knowledge-map topics (`KN`, `showNode`) each build a spec and call `cardHtml(spec)`, so the header (tag, title), figure, tabs (Basics, Deeper, Expert), facts, actions, what it is made of, what it is part of, how it works, textbook sections, open questions and "how certain is this" always come in that order. Spec keys are listed above `cardHtml`. `openPanel(html, {key, reopen})` draws it in the panel's `#info` section and records it for Back (the one Back button is in the panel's head); `closeInfo()` deselects, and the panel shows the place again. The card of a clicked thing has Look inside and See it from further out (`LOOK_BTNS`).
- **A deliberate jump keeps its card.** `openPanel` marks the card as fresh for the rest of the current run of code; `flyTo` (wrapped in js/engine_ui.js) closes the open card only when it was not opened by the same call: so `goToNode`, "Show where it is", a chip, a search result or a trail stop that opens a card and then flies keep the card, the highlight and the peeled layers; a flight started on its own closes a stale card; the flights that belong to a selection (framing it, looking inside it) go through `flyKeep`. `goToNode(id, then)` calls `then` when its flight ends (`afterFlight`). A result inside the phone (a battery, a chip) opens the phone exploded and highlights the part while its card is open (`FT.phone` `F.showPart`). Looking somewhere from a script: `setCamDir(dir)` sets the direction and levels `up` at once.
- **No silent clicks.** An id with no card data opens a minimal card ("No description has been written for this yet") and logs `console.warn('No card for pickable id', ...)` once. `auditPickables()` (console) lists, for every drawn frame, the pickable ids with no card; `harness/core/run_audit.py` runs it at every landmark.
- **Where am I.** `updateCrumbs` draws the camera's frame chain in the panel's head, on one line (the root, the last four steps and a way to show the rest); a step flies out (`crumbGo`: the widest landmark of that frame, else a little outside its content, `frameOverviewD`). `navStack` holds earlier camera and card states (pushed when a card opens and when a flight starts); Back (`#navBack`) pops it. The skin patch (and the cell, DNA and atoms in it) sits on the person in the park, so its chain shows "You" before it. On a phone the ruler strip has no names: tapping it opens a short list of the places on the scale around the tap (`openScalePop`; the one you are at is in bold) and choosing one flies there; the panel is a sheet that starts at about a third of the screen and is dragged up by its handle; the tours are in the Library panel (`#tourIn2`, `#tourOut2`); hints that need a keyboard are `.kb` and hidden on touch.
- **Search.** `SEARCH_SOURCES.push(source)`; a source is a function `q => [{title, sub, go, rank?, prio?}]`, or an object `{id, label, search(q)}` (js/particles.js), or `{id, title, items()}` (js/atom.js; items `{id, title, sub, go?}`, called once; an item without `go` whose id is a `NODE` id opens that node, otherwise it is ignored). `q` is lower case; `go()` takes the user somewhere. A source that throws or is malformed is reported once, never per keystroke. Ranking: exact name, then starts with or a word starts with, then contains; within those, places you can fly to (`prio` 0: landmarks, planets, the Sun, the Moon, park objects) before topics, elements, molecules; an element symbol typed exactly ("Fe") is an exact match. Built in: landmarks, elements, molecules, explorer topics, `bodyPlaces()` (planets and the Sun and Moon from `FR`, park objects from `INFO`). With no match the panel says so and offers the topics nearest to the words typed (`noMatchHtml`). Results that go somewhere are listed first, then the knowledge map (title matches first, then whole-word matches in the summary), key terms and textbook sections. `/` (or Ctrl/Cmd+K) focuses the one search field (js/search.js) from anywhere; Enter takes the first result. The Library panel is for browsing (knowledge map, places, tours, textbooks) and has a button that jumps to the field; `SEARCH_SOURCES` is the older source list and now feeds nothing visible. The field has a reserved row in css/app.css (`--srch-row`; on a phone `--srch-btn-w` is the Search button's width).
- **Debug and tests** in `/home/rhett/projects/how/.devtools/harness/core/`: `t_c2_nav.py` (crumbs, Back, search, minimal card, `/`), `t_c2_phone.py` (phone: bottom sheet, pinch, ruler strip, overlaps), `t_c2_fade.py`, `t_regions.py`, `t_audit.py` / `run_audit.py`.

## Labels, place notes and destinations (engine)

- **Place card.** Frames may set `F.blurb`, `F.note` (the honest note, in italics), `F.timeNote` and `F.device = true` (hides the clock); `updateCaption` writes them to `#place` (see The panel).
- **Labels.** The label layer forwards the mouse wheel to the canvas (zoom works over a label). `declutterLabels` runs every 160 ms in every scene: where labels collide the one with the higher `data-pri` stays, the rest get the class `lblhide`. A label made with `{pick: obj}` opens the card of `obj` (the part it names).
- **Object destinations.** `userData.zoomTo(h)` on a picked object names the frame it stands for: a double click (or Look inside) flies there (return `false` to fall back). See The panel, click and double-click for the whole order.
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

Limits per view at 1280 × 800, device pixel ratio 1, enforced by `t_perf_budget.py` (counts are about a quarter above what the views cost today):

| view | scenes | full-screen passes | draw calls | triangles | points | CPU drawing ms | CPU update ms |
|---|---|---|---|---|---|---|---|
| start (the park, 7 m) | 3 | 0 | 260 | 760 thousand | 0 | 9 | 4 |
| park at 30 m | 3 | 0 | 330 | 860 thousand | 0 | 9 | 4 |
| body at 1 m | 3 | 0 | 130 | 420 thousand | 0 | 6 | 4 |
| at an oak, 12 m | 2 | 0 | 70 | 800 thousand | 0 | 4 | 4 |
| atom | 1 | 0 | 10 | 2 thousand | 260 thousand | 2 | 2 |
| Standard Model | 1 | 0 | 90 | 92 thousand | 0 | 3 | 2 |
| cell | 1 | 11 | 225 | 160 thousand | 0 | 4 | 2 |
| Earth | 6 | 11 | 60 | 101 thousand | 270 thousand | 3 | 2 |
| inner planets | 5 | 11 | 65 | 53 thousand | 270 thousand | 3 | 2 |

Today's figures for the start view: 2 scenes, 0 passes, 205 draw calls, 608 thousand triangles; a pick takes 0.1 to 0.2 ms. The counts are exact. The CPU limits are about three times what a quiet run shows, because the test machine is shared: they catch gross regressions only. The view at the dog (318 draw calls, 884 thousand triangles, most of them fur) is the heaviest in the park and is not in the test only because one frame of it takes many seconds on the test machine's software renderer.

A new scene should cost no more than the cell does: one scene, under 225 draw calls, under 160 thousand triangles, under 4 ms of CPU for drawing. If it needs more, give it detail tiers.

### Rules

- **No per-frame raycasts.** Hover is worked out only after the pointer has moved and rested (70 ms) or the view under it changed (`viewChanged()`), never while the camera moves. A wheel burst re-uses its pivot. Anything that casts rays from an update hook must be keyed on what it depends on and rate-limited, as `bodyAutoUpdate` is (camera position and target, at most every 110 ms).
- **Picking is accelerated; keep it that way.** Every mesh of 64 triangles or more gets a bounding-volume tree (three-mesh-bvh, `js/vendor/`), built in idle slices (`pkIdle`); an `InstancedMesh` gets per-instance bounds in a tree (`pkInstAccel`) and is tested nearest instance first, stopping after four hits that are not cut away by the material's clipping planes (so only the nearest hits of a crowd are returned); a frame's pickables are skipped when the ray misses their bounding sphere. A geometry whose positions are rewritten every frame, or that uses `setDrawRange`, is tested the plain way: keep such geometry small or out of `pickables`. An object with its own `raycast` method switches the frame's sphere test off.
- **Opaque by default.** `illoMat` materials are opaque while their opacity is 1 and blend only while something lowers it. Do not create a material with `transparent: true` unless it is always see-through, additive, or part of a construction that relies on render order (the cut-open organ parts, the markers). Layers that must be painted in a fixed order whatever their depth use `paintedInOrder` (the body).
- **No per-frame geometry rebuilds and no allocations in update hooks.** Reuse vectors and matrices; move things in the vertex shader where you can (the things' sway).
- **Instance crowds.** Anything that repeats more than a few dozen times is an `InstancedMesh`. Give the frame a detail tier that drops it with distance.
- **Three detail tiers** for anything large (`lod` in a thing's data: near, mid, far), and no ink on the far tier.
- **Static parts set `matrixAutoUpdate = false`** (after `updateMatrix()`).
- **One scene where possible.** A frame type that is co-rendered with its parent and can live with the parent's lights sets `mergeable = true` and hides its own lights in `onMerge(on)`; the engine then draws it inside the parent's scene. A frame that needs its own lights (the body) stays a scene of its own.
- **Glow is opt-out by nature of the scene:** an illustrated frame (`illo`) seen close and a daylight frame that fills the view (`daylight`) take none; then no full-screen pass runs at all.
- **Shadows:** a shadow-casting light sets `shadow.autoUpdate = false` and asks for an update only when the light or a caster has moved (see `shadowStep` in `js/world_matter.js`, which also shifts the shadow matrix with the scene origin).
- **Lights do not swim.** Scenes are shifted so the eye is at the origin, and three.js takes a hemisphere light's direction from its position in the scene; `fixSceneLights` (js/engine.js, in `placeFrameCam`) moves each hemisphere light (and each shadowless directional light without a target) by the opposite shift, so a hemisphere light always points the way the frame gave it (up) wherever the camera is. A scene's own sun that casts a shadow is left alone.
- **Custom shaders** wrap GLSL with `LDV()`/`LDF()` as before; that keeps them right in all three depth modes.
- **Point sizes** in a shader multiply by the shared uniform `PIXK` (js/engine.js), so they keep their size on screen when the render scale adapts.

### What the engine does for you

- **Culling:** a co-rendered neighbour whose content is out of view or under about two pixels is not drawn or picked, and its update hook runs every eighth frame.
- **Render scale:** capped at about 2.8 million pixels and adapted to the frame time (`RENDER SCALE` in js/engine.js). Under browser automation it is fixed unless `dpr=auto` is in the URL.
- **Resting:** after 1.5 s with nothing moving, every other frame is skipped; hidden tabs and open labs draw nothing.
- **Shader compile:** a frame built before it is first drawn (the path of a flight) has its shaders compiled then (`compileStep`), so the stall comes at the click, not mid-flight. Hidden variants (other layer modes, cut views) compile when first shown: compiling blocks in three r128, and doing it ahead for everything cost seconds at start-up.
- **Loading:** anatomy files and thing bundles are fetched and decoded in `js/mesh_worker.js`; `loadNote(label, promise)` names what is still arriving.

### Performance tests

Run with the venv Python from `harness/core/`:

- `t_perf_budget.py`: the budgets above; fails if the start view (or another listed view) exceeds them.
- `t_perf_pick.py`: the pointer moving for five seconds while zooming, in three places; worst single pick, most picking in one frame, and that the zoom pivot is re-used.
- `t_perf_scale.py`: the render-scale rules with made-up frame times, then the real page with `?dpr=auto`.
- `t_perf_rest.py`: the resting frame rate, input ending it at once, and no drawing while a lab covers the canvas.
- `t_goto_things.py` / `run_goto_things.py 2`: `goToNode` for every part and hotspot card of every thing (including the dog), from the start view with real flights: anchored at the right thing, card open, part highlighted, on screen, close to ONE instance for instanced parts.
- `t_ui_clicks.py [--phone] [scene ...]` and `t_ui_panel.py [--phone]`: click and double-click in every scene, and the panel rules (see The panel, click and double-click).
- `t_followups.py [fade|search|light|sun|space|skin|phone|meter]`: neighbours fading out of close-ups, one search field, the card kept across a jump, the phone opened to the battery, lights independent of the camera, the Sun moving in the park, the skin flight, phone ruler list, phone meter.
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
