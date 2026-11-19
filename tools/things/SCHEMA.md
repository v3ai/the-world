# Things: data schema, toolkit and how to add a thing

A **thing** is an organism or object in the park (boulder, oak, dog, bee ...) built from data and drawn by generic
code (`js/things.js`). Adding the next one means a model script, a few node cards and an index entry. No new
rendering code.

```
tools/things/lib/*.mjs        generator toolkit (Node ESM, no dependencies)
tools/things/models/<id>.mjs  one model script per thing: its schema + a build() that makes the meshes
tools/things/bake.mjs         node tools/things/bake.mjs <id>   ->  data/things/<id>/{thing.json,mesh.json}
tools/things/preview.html     http://127.0.0.1:<port>/tools/things/preview.html?thing=<id>
tools/things/test/            node --test tools/things/test/
data/things/index.json        which things stand where in the park
data/things/<id>/thing.json   the description (small, readable; written by bake from the model script)
data/things/<id>/mesh.json    index of the geometry (offsets, scales, flows)   data/things/<id>/mesh.bin   the numbers (format 2, section 9)
data/nodes/park_*.json        the cards (nodes) the parts point at
```

## 1. Files

### data/things/index.json
```json
{ "things": [ { "id": "boulder", "placements": [ { "at": [-4.6, 3.4], "rot": 20, "scale": 1, "y": 0 } ] } ] }
```
`at` = [x, z] metres in the park (park origin = where the person stands, +y up), `rot` degrees about the vertical,
`scale` uniform, `y` height of the base above the ground (default 0; it is part of the frame's position, so a thing may stand on a table or a flower).
Each placement becomes one frame (`FT.thing`, a co-rendered child of the park, same unit = metres). Several placements of one thing share
geometry and data. A placement with a `seed` varies (section 9: `variation`); `"on": {thing, placement, at:[x,y,z]}` replaces `at`/`y` and stands the thing
on another placement's point given in the host's own coordinates (the bee on a buttercup flower).

### data/things/<id>/thing.json
Everything is hand-written in the model script's `thing` object; `bake` adds `center`, `radius`, `tris`, `count`
to each part and a `stats` block. Coordinates are thing-local metres, **base at y = 0, up = +y**.

| field | meaning |
|---|---|
| `id`, `title`, `label` | slug, display name, text of the floating name label |
| `scientific` | scientific name or `null` |
| `node` | card id of the whole thing |
| `main_part` | part id the name label opens |
| `blurb` | one line shown in the caption bar when the camera is at the thing |
| `model_note` | **required honesty line**, shown in the caption and at the top of every card of this thing: "A model built from typical measurements, not a scan ..." |
| `size_m`, `height_m`, `radius_m` | true size in metres; `radius_m` = farthest extent from the base point (sets the frame radius, hover/zoom sizes) |
| `draw_m` | distance (m) at which the thing fades from the park view (default 400) |
| `systems` | `[{id, label}]` layers a part can belong to ("rock", "bark", "roots" ...) |
| `modes` | layer buttons, see below |
| `auto` | optional "Auto" button. Three forms (section 9): `{label, near_m, near, far}` (two modes, one distance), `{label, stages:[{max_m, mode}, ..., {mode}]}` (a list of stages by distance), `{label, layers: true, always:{system:opacity}, scale?, active_m?}` (the human's ray-based peel over `def.layers`) |
| `lod` | `{near_m}`: below this camera distance parts marked `"lod":"near"` show, above it `"far"` ones (hysteresis 0.9x / 1.15x) |
| `shadow` | `{radius_m, opacity, offset?}` soft contact shadow disc on the ground |
| `cut` | cut-open definition, see below |
| `hotspots` | `[{id, node, at:[x,y,z], label, r?, modes?, pivot?, deeper?}]` yellow markers shown in cut-open modes; each opens its card (and offers its `deeper` button, like a part) |
| `anim` | animation as data: sway, swing (a tail wag), wag/flap/sweep, breathe/pulse; see section 9 |
| `layers` | `[{id, label, systems:[...], ghost, see_through?}]` outermost first: what Auto peels, what the core sample, "Hide this" and "Peel to here" work on (section 9) |
| `variation` | per-placement variation from the placement's `seed` (section 9) |
| `pivots`, `label_m`, `ruler` | pivot centres; the distance a far name label shows from; a ruler stop (section 9) |
| `parts` | see below |
| `ink_w` | default outline width (0.0018) |
| `seed`, `stats` | informational |

**parts**: `{id, name, system, node, color, mesh | instances, ...}`

* `mesh`: key in `mesh.json.meshes`. `instances`: key in `mesh.json.instances` (one small mesh plus many transforms).
* `node`: card id. Several parts may share one node. Every part must have an existing card; `bake` checks that the id is
  given, the runtime warns in the console when `NODE[node]` is missing.
* `lod`: `"near"` or `"far"` or absent (both). The far stand-in is just another part with `"lod":"far"` (`far_of` names what it replaces).
* `parent`: a detail part shown only in cut-open modes (the way `data/anatomy` marks organ interiors).
* `solid`: default true. Closed meshes get inside faces painted with the cut-face pattern in cut-open modes; set false for open sheets.
* `cutFace`: key into `cut.faces` for the pattern of this part's cut face (default `cut.default`).
* `tint`: for instanced parts, per-instance brightness variation 0..1. `double`: draw both sides (leaves).
* `priority`: pick priority (default 1.5, details 2). `ink_w`, `noink`: outline control.
* `deeper`: what it is made of at the next level down: `{type:'crystal', id:'quartz'}` (an existing crystal frame),
  `{type:'micro', kind:'leaf'}` (an existing micro scene), `{type:'tissue', id:'<node or tissue id>', organ}`; plus
  `button` (label) and `D` (view distance in metres to end at). The card then shows a "See what it is made of" button,
  and zooming into the part spawns that frame.

**modes** (the layer buttons): `{id, label, show:{<system>:opacity, '*':opacity}, cut?: true | {at, normal?}, pivot?: <name>, hotspots?: true, legend?, groundSeeThrough?}`.
Opacity 0 hides the system. Transitions are smooth.

**cut**: `{default, at:[x,y,z], faces:{<key>: face}}`. A cut-open mode clips the thing with a plane through its own point `at` (`mode.cut.at`, else `cut.at`).
The plane faces the camera (horizontal, through `at`, keeping the far half) when the mode is chosen ("Turn the cut to face me" re-aims it); `mode.cut.normal`
[x,y,z] gives a fixed plane instead (a true sagittal or transverse cut: the dog's midline, the bee's three body cuts; the sign is chosen so the far half stays). A `face` is the
pattern painted where the solid is cut: `{kind:'grains', cell, edge, palette:[[hex, weight] x1..4], legend:[{name,color,node}], note}`
(Voronoi cells, `cell` metres across) or `{kind:'plain', palette:[[hex,1]]}`. `legend` becomes a row of clickable swatches
under the layer buttons. Geometry-based cuts (annual rings, a wedge with real parts) use `parent` detail parts instead.

### data/things/<id>/mesh.json
```
{ "format": 1,
  "meshes":    { key: { scale:[sx,sy,sz], offset:[ox,oy,oz], pos:[int16 x3 per vertex], idx:[triangles], shade?:[uint8 per vertex] } },
  "instances": { key: { mesh: key, stride: 8 | 10, n, t: [flat floats] } } }
```
Position = `pos * scale + offset` (identical to `data/anatomy`; `decodePart` reads it). `shade` is a baked per-vertex brightness
(ambient occlusion, staining) that multiplies the part colour. An instance is `x y z  qx qy qz qw  s` (stride 8, uniform scale)
or `... sx sy sz` (stride 10). Normals are computed at load.

## 2. Conventions shared with the human body

Every pickable part group has `userData = {id, node, part:{id,name,system,center,radius,parent}, priority, center(h?), radius(h?), madeOf}`
and `F.parts[id] = {g, p}`, exactly like `FT.body`, so CORE features that work on body parts ("what is under here", "Hide this")
can apply unchanged. Differences CORE should know: instanced parts (`g` is an `InstancedMesh`, `g.userData.resolve` returns the part id;
the hit carries `hit.instanceId`); a part with a baked outline has `g.userData.ol`, instanced ones have none; `center(h)` returns the
**clicked point** (so double-click flies to where you clicked), or the part centre when called without a hit.
The model note is shown on every card of a thing, and the caption (`F.blurb`, `F.note`).

## 3. The generator toolkit (tools/things/lib)

All shapes are arrays `[x,y,z]` in metres. Import everything from `lib/index.mjs`.

* **sdf.mjs**: primitives `sphere, ellipsoid, capsule, roundCone, box(round), torus, halfSpace, cylinder`; transforms `translate, scale, rotate, rotateEuler`;
  booleans `union, intersect, subtract, smoothUnion(k, ...), smoothIntersect, smoothSubtract`; deformations `mirror, round, shell, bend, twist,
  displace, noiseDisplace, ridgeDisplace`; queries `surfaceHit(sdf, origin, dir)`, `normalAt(sdf, p)` (to put things *on* a surface).
* **mesh.mjs**: `meshSDF(sdf, {min, max, cell | res, refine})` (surface nets, outward winding), `weld, smooth (Taubin), simplify (vertex clustering, for far LODs),
  merge, transform, flip, bounds, stats (closed? Euler number, volume, area, degenerates), bakeShade(mesh, (p, n) => 0..1)`.
* **sweep.mjs**: `spline, tube(path, radius(t), {sides, caps})` (parallel transport, no twist), `lathe`, `blade({length, halfWidth(t), thickness, curlAlong, curlAcross, fold})`
  for leaves, petals, wings, `extrudeOutline(polygon, thickness, {warp})`.
* **grow.mjs**: `spaceColonize` (branching toward attractor points), `pipeRadii` (cross-section conserved at forks), `treeToMesh`, `phyllotaxis`, `GOLDEN_ANGLE`.
* **instance.mjs**: `new Instances(meshKey).add(p, quat, scale)`; `rng.mjs`: seeded `rng(seed)`, `noise3`, `fbm`; `vec.mjs`: vector and quaternion helpers.
* **export.mjs**: `quantize`, `assemble` (also validates: unknown meshes, undeclared systems, missing nodes/names).

Limits to know: surface nets can leave a rare non-manifold edge where two thin sheets pass within one cell (`stats().nonManifold`); round sharp thin
edges (`box(..., round)`) and keep features at least 2-3 cells thick. Distances under bend/twist/noise are approximate, which is fine for meshing.
Meshes are procedural reconstructions, not scans: say so in `model_note`.

## 4. How to add a thing (the checklist)

1. **Research first.** Find the real measurements (size, counts, proportions) and cite them in your notes. Do not invent numbers.
2. **Copy `models/boulder.mjs`** to `models/<id>.mjs`. Write `thing` (systems, modes, parts, `model_note`, size) and `build(L)` returning
   `{ meshes: {key: Mesh}, instances: {key: Instances}, thing? }` (return `thing` if the schema depends on computed data, as the boulder's hotspot does).
   Keep the near view under about 150k triangles; give every thing a far stand-in (`simplify`) and use instances for repeated organs (leaves, hairs, scales).
3. **Bake**: `node tools/things/bake.mjs <id>` prints triangles per part and any problems. Then open `tools/things/preview.html?thing=<id>`:
   orbit, try every layer, the cut-open view, near and far LOD; click each part and check the card it names.
4. **Cards**: one node per part in `data/nodes/park_<name>.json`. Reuse existing `bio_*` and body nodes where they fit (search `data/nodes/*.json`);
   write only the missing ones, with sourced facts, `≈` for typical values, `certainty`, `open_questions`, plain basics then deeper then expert.
   The cards of this thing show `model_note` automatically.
5. **Place it**: add an entry to `data/things/index.json`. Nothing else: `WORLD_EXT` in `js/things.js` creates the frames.
6. **Replace the old primitive version** in `BUILD.life` (levels_v2.js, the part this workstream owns) only when the data version exists and is better, and make
   sure the old click target is gone so each click opens exactly one right card.
7. **Test in the app** with the harness: `jumpTo(FR.thing_<id>, new V3(0, h, 0), D)`, then click every part, check zero console errors, screenshots at
   desktop and phone width, and the frame rate with all placements.
8. **Write notes** with sources, what is approximate, and what is not done.

Runtime pieces you can call: `thLoadDef(id)`, `thLoadBundle(id)`, `new ThingObj(def, bundle, {scale, rotY})` (pure three.js; used by the preview),
`FR.things` (all placement frames), `FR.thing_<id>` (the first placement), `FR.thing_<id>.T` (its ThingObj: `setMode(id)`, `parts`, `near`).

## 5. Added with the oak (T1d)

**Mode extras** (`modes[]`): `legend: {title, items:[{name,color,node}], note}` (the swatch row under the layer buttons; each swatch opens a card; a mode without
`legend` and without `cut` shows none); `pivot: '<name>'` (parts with `"pivot":"<name>"` live in a sub-group that turns about the vertical axis through `def.pivots[<name>].at` ([x, z], default the origin), once per mode choice, so its opening faces the
camera; the "Turn the cut to face me" button repeats it. The name is free: nothing is tied to `wood`); `groundSeeThrough: true` (the park ground fades to 16 % and the grass hides while this mode is on:
the Roots view); `hotspots: true` (show the yellow markers); `flowOn` is informational. A mode's `show` map may name a system with opacity 0..1.
**Hotspots**: `{id, node, at, label, r?, modes?}`: `r` is the marker radius in metres, `modes` limits it to those mode ids (a hotspot rides on the pivot named by its own `pivot` field, else on the pivot of the first of its `modes` that has one).
**Part extras**: `opacity_max` (cap the opacity in any mode: translucent soil), `pivot`, `card: {kind:'lobed_leaf', lobes, depth, aspect, base_lobes, veins}`
(an alpha-cut picture on a flat quad, for leaves: 16 triangles each; the runtime draws the outline into a canvas texture and derives UVs from the mesh's
xy box; x across, y along), `flow: '<key>'` (a flow part, below), `label_first_only` on the thing (only the first placement carries the floating name).
**Flows** (`mesh.json.flows`, written by passing `flows` from `build()`): `{key: {mesh, dir: 1|-1, speed, ring, paths:[{p:[x,y,z,...], r:[radius per point]}], markers:[[pathIndex, u0 (0..1), angle]]}}`.
Instanced markers of `mesh` travel along the polylines at `speed` (visual metres/second, not real speed), offset from the axis by `ring` x the local radius
at the given angle; `dir -1` runs against the path. Use it for sap, blood, nerve impulses. A diagram of flow: the model note and the legend must say it is not to scale in speed.
**Tissue scenes** (`data/things/tissues/<id>.json`, drawn by `FT.tissue2`; reached with a part's `deeper: {type:'tissue2', id, D (metres), button}`):
`{id, title, node, blurb, note, bg, center:[x,y,z] (µm, the point the camera looks at), labels:[{text, at, pop}], populations:[...]}`. All lengths are micrometres.
A population: `{id, name, node (card), shape: rbox|ellipsoid|lens|tube_z|cylinder|bean, size:[sx,sy,sz], color, opacity, ink:1, priority, deeper, arrange}`
with `arrange` one of `{kind:'list', items:[{at, rotY}]}`, `{kind:'grid', origin, n:[nx,ny,nz], step, jitter, stagger, skip:[{x:[a,b]}]}`,
`{kind:'random', n, min, max, gap, seed, exclude:[{min,max}]}`, `{kind:'inside', of:<population id>, per, margin, seed}` (children scattered inside each parent cell).
A population's `deeper` is `{type:'cell', cell?}` (a cell frame of the scene's own kind), `{type:'mol', mol:<id in molecules_all.json>, name}` or `{type:'none'}`; with no `deeper` there is no button.
Clicking a population opens its `node` card. **Scene fields added in pass 2:** `tag` (the card tag of every population, e.g. "Inside a leaf"; a population may override it with its own `tag`; default "Inside the tissue"),
`cell` (`'plant'` | `'animal'` | `'fungal'`: what `deeper:{type:'cell'}` opens; a `deeper.cell` overrides; default plant). There is no fungal cell scene yet, so `fungal` opens the generic animal-cell scene,
named "Fungal cell (generic stand-in)" with a note on screen that says so. **Orientation:** a `list` item may give `rot: [rx, ry, rz]` (degrees, full 3-D) or `dir: [x, y, z]` (where the shape's long axis points: z for `tube_z`, x for `tube_x`, y otherwise) instead of `rotY`;
`random` and `inside` arrangements take `orient: 'free'` (a random 3-D orientation); a population's own `rot: [rx, ry, rz]` is its rest orientation. Hyphae and fibres can lie in any direction.
Every tissue scene must say in `note` which sizes are real and which are illustrative.

## 6. Adding a thing: what the oak taught (read with section 4)
* Put the numbers you chose at the top of the model script as one object (`M`), say them on the cards, and print counts (leaves, triangles) from the script.
* Content as data: cards and figures are written by a script in `tools/things/content/` (the oak's is `oak_nodes.py`, which writes `data/nodes/park_<name>.json` and merges the figures into `data/viz/park.json`). Run `node tools/viz/validate.mjs data/viz/park.json`.
* Make parts that are cut open (a log, an organ) from analytic geometry rather than from a signed-distance mesh, so the layer plates meet the outer surface exactly.
* Keep per-placement variation in `data/things/index.json` (`rot`, `scale`, `seed`), not in the model.
* Instanced parts cost triangles x count: a 16-triangle card with an alpha-cut texture beats a 48-triangle modelled leaf for foliage.
* Every part needs a `node`; reuse existing `bio_*` or body cards where one fits and list them in the parent card's `parts`.


## 7. Level of detail, performance numbers, and the park wiring (added in T1d finish)

**Three detail tiers.** `thing.lod = { near_m, far_m }` (metres from the thing, with hysteresis). A part's `lod` is `'near'`, `'mid'`, `'far'` or a union such as `'near+mid'`;
a part with no `lod` is drawn at every distance. Tier 0 (closer than `near_m`) is full detail; tier 1 (between) the middle stand-in; tier 2 (beyond `far_m`) the far stand-in.
With no `far_m` the middle tier acts as the far one (the boulder). Parts swap at once, never fading, so two tiers are never drawn together. The bake prints triangles per part;
`stats.nearTris / midTris / farTris` in thing.json give the totals that a placement draws in the default mode (the preview page lists them).
Budget used by the oak: near about 150-200k triangles (only the one or two oaks within 22 m), middle about 15k (trunk, main limbs, 2,000 leaf-tuft cards), far about 9k (blobs). All 19 oaks together
draw well under one million triangles in a typical park view. Instanced parts share one set of instance buffers between all placements of a thing (built once, in `TH.inst`), so the number of placements costs draw calls, not memory or load time.
Do not put per-leaf geometry above 4 triangles; use `card` textures (`lobed_leaf` for one leaf, `leaf_cluster` for a tuft).

**Cards for the park objects.** Park objects that are not yet things (pond, flowers, bee, mushroom, clouds, birds, sun, sky, ground) get their card from `userData.node`, set at the end of
`BUILD.life` from a table (`PN`) of pick id to node id; the cards live in `data/nodes/park_*.json` and are written by `tools/things/content/park_nodes.py`. When you convert one of them to a thing, delete its row from `PN`
and its primitive from `BUILD.life`. Where "Zoom in" on a park object goes is `F.spawn` of `FT.park` in `js/world_matter.js`: a micro surface (`microFrame(kind)`) or a tissue scene
(`tissue2Frame(id, T)`, used for the mushroom and the bee).

## 8. How to add a thing: a worked recipe (read this first; it is meant to be enough on its own)

Example target: **a dog**. The same steps give a bee, a flower, a mushroom or a bird; the notes in brackets say what changes.

1. **Decide the truth.** Write the numbers at the top of `tools/things/models/dog.mjs` as one object `M` (shoulder height, body length, mass, number of teeth, bones...), each with its source in a comment
   (fetch the source; do not recall numbers). Decide what is *modelled* (a typical medium dog, not a breed or an individual) and say so in `model_note`.
   [Bee: body length, wing span, number of ommatidia, from a published description. Flower: petal count, floret count in the head.]
2. **Name the layers (systems).** For a dog: `coat`, `muscles`, `skeleton`, `organs`. For a bee: `cuticle`, `wings`, `muscles`, `organs`. For a flower: `petals`, `stem`, `reproductive parts`, `roots`.
   One system = one set of parts that appear together. Write `modes[]`: each has `id`, a plain-language `label` ("Show the skeleton"), and `show: {system: opacity}`; optional `cut`, `legend`, `hotspots`, `groundSeeThrough`, `pivot`.
3. **Write the model script** `models/dog.mjs` (declare `layers` and `auto` so Auto, the core sample and Hide work; `anim` where a movement is true; section 9), `export default function build()` returning `{ thing, meshes, instances, flows? }` (see `oak.mjs` for a large one, `boulder.mjs` for a small one).
   Meshes come from the toolkit: `sphere/ellipsoid/capsule/roundCone` SDFs with `smoothUnion`, meshed by `surfaceNets` (bodies, heads, organs); `tube` along `spline` (legs, tail, vessels, antennae, roots);
   `lathe` (acorns, bones' shafts, stems); `blade`/`extrudeOutline` (petals, wings, ears); `spaceColonize` + `pipeRadii` or a recursive grower (the oak's `grow`) for branching systems;
   `Instances` for repeated organs (fur tufts as 2-triangle cards, scales, teeth, florets). Parts that are cut open must be analytic geometry (see section 6).
   Each part entry: `{id, name, system, node, color, mesh | instances | flow, lod?, parent?, deeper?, ink_w?, noink?}` (`priority` is not needed). `parent` marks a detail part drawn only in cut views; `deeper` says what it is made of
   (`{type:'tissue2', id, D, button}`; or `crystal`, `micro`, `tissue` of the body).
4. **Make the three detail tiers** (section 7): full detail, a middle version (`simplify`, fewer sides, fewer instances scaled up), a far blob. Keep near under about 200k triangles.
5. **Bake and look**: `node tools/things/bake.mjs dog` (prints triangles per part, problems); open `tools/things/preview.html?thing=dog` (orbit, layers, tiers, click parts). Fix proportions against photographs or drawings.
6. **Cards**: write `tools/things/content/dog_nodes.py` modelled on `oak_nodes.py`: one node per part (whole animal, coat, skull, heart...), summary + basics/deeper/expert, `facts` with units and `≈`, `certainty`, `open_questions`,
   `refs` to OpenStax sections that exist, `ext` links to the sources you consulted. Reuse existing `bio_*` and body nodes (search `data/nodes/*.json`) and link them in `parts`. Add a figure per card to `data/viz/park.json` and run
   `node tools/viz/validate.mjs data/viz/park.json`. Put the "model, not a scan" sentence in `model_note` (shown at the top of every card).
7. **Tissue scenes** for what the parts are made of: write `data/things/tissues/<id>.json` (section 5): populations of cells with real sizes (cite them; mark illustrative ones in `note`), arranged with
   `list`/`grid`/`random`/`inside`; each population names its card and a `deeper` (`cell`, or a molecule from `data/molecules_all.json`). Reach it from the part with `deeper: {type:'tissue2', ...}`.
   Check the whole path in the browser: click the part, press its button, click a cell, press its button, until you reach a molecule.
8. **Place it**: add `{id, placements:[{at:[x,z], y?, rot, scale, seed}]}` to `data/things/index.json` (`y` to stand above the ground; `on` to stand on another thing; section 9). Nothing else is needed for it to appear, hide, be clicked and have layer buttons.
9. **Remove the old primitive** (`makeDog` etc. in `BUILD.life`) and its `PN` row, only after the data version is better. Make sure there is exactly one click target per object and that it opens the right card.
10. **Test** with the harness: `jumpTo(FR.thing_dog, new V3(0, 0.5, 0), 3)`; `FR.thing_dog.T.setMode('skeleton')` (settle a few seconds after jumpTo first: `T` exists once the frame has been drawn once);
    scan with `pickAt` for each part id, click it, read `#info h2`; `renderer.info.render` for triangles and `performance.now()` around two `requestAnimationFrame`s for frame time. Screenshots at 1280x800 and 390x844.
    Software rendering takes tens of seconds per frame with many things: hide other placements (`FR.things.forEach(f => f !== FR.thing_dog && f.T && (f.T.holder.visible = false))`) and pass `timeout=180000` to the screenshot.
11. **Write notes** (`/home/rhett/projects/how/.devtools/notes/<workstream>.md`): files, how to see it, every source with what it supported, what is approximate and where the screen says so, known gaps.

Animation is data (section 9): declare `anim` for a breeze, a tail wag, a wing beat, a heartbeat, and say on screen which of them are slowed or illustrative. Declare `layers` so Auto, the core sample, "Hide this" and "Peel to here" know your layers.


## 9. Framework pass 2: what a thing can now declare (read with sections 1 and 5)

**Cut views.** `mode.cut = true | {at, normal?}`: the plane passes through the mode's own point `at` (thing-local metres; else `cut.at`). Without `normal` it faces the camera (horizontal) when the mode is chosen;
with `normal: [x,y,z]` it is fixed (any direction, not only vertical) and the half on the far side from the camera stays. Several modes may cut at different places or in different directions (the bee's head, thorax and abdomen cuts;
the dog's midline). Nothing is keyed to a mode named `wood` any more. **Pivots:** `mode.pivot: '<name>'`; parts with `"pivot": "<name>"` turn (about the vertical axis through `def.pivots[<name>].at`, [x, z]) so that their opening faces the camera.
Hotspots take `pivot: '<name>'`, or ride the pivot of the first of their `modes` that has one. `hotspot.deeper` gives a marker the same "See what it is made of" button as a part.

**Layers and Auto.** `def.layers = [{id, label, systems, ghost (opacity when peeled, default 0.1), see_through? (opacity while something deeper is behind it on the ray)}]`, outermost first. With `def.auto = {layers: true, always: {system: opacity}, scale?, active_m?}`
the Auto button peels like the human: the camera looks along a ray through the zoom target; a layer turns see-through when the camera is nearer than about 12 times the gap to the next layer on that ray (the constants are the human's, scaled by
`auto.scale`, default height/1.75 m); the innermost layer found on the ray is never peeled; beyond `active_m` (default 2.5 radii) the outermost layer shows. Other forms: `auto.stages = [{max_m, mode}, ..., {mode}]` picks a mode by distance;
`{near_m, near, far}` still works. Without `layers` a thing has one layer made of whatever its first mode shows, which is enough for the core sample and Hide.

**Body features on every thing.** The frame sets `layered = true` and works with `js/body_core.js`: click a part and the card lists every part under that point from the outside inward (parts in the current detail tier, not clipped by a cut), each with "Peel to here";
the card has "Hide this"; a "Show everything" button appears while anything is hidden or revealed. `goToNode(id)` (search, chips, "Show where it is") flies to the thing, switches to a mode that shows the part if needed, peels what is in front of it,
highlights it and opens its card. Scrolling toward a point peels the layers (Auto) and then spawns the tissue scene of the part that is *visibly* under the point (not of the one that was under the cursor before the layers peeled).
The hover name is the nearest visible, un-clipped part; a peeled (see-through) layer is never named. Picking is the nearest visible, un-clipped hit, not the highest `priority` (markers, priority 3 and up, still win, so per-layer priorities are no longer needed and are ignored); a click in a cut view on the cut face opens the part that is cut.

**Hooks (js/nodes.js).** `CARD_HOOKS.push((id, h, node) => ...)` runs after a node card is built; `GOTO_HOOKS.push(id => handled)` runs first in `goToNode`; a frame may define `cardMadeOf(h, node)` returning `{label, go}` or `null` to replace the card's
"See what it is made of" button, and `layered`, `coreIds()`, `coreClip(point)`, `coreText` for the core sample. Nothing wraps `showBodyNode` or `goToNode` any more. A node's `related` list is drawn as a "Compare with" row of links.

**Placement.** `y` is part of the frame position, so a thing may stand above the ground. `on: {thing, placement, at}` stands a thing on another placement's point (the host's coordinates, following its scale, heading, lean and variation).
`def.variation = {scale:[min,max], yaw: true, lean_deg, groups:[{id, n, keep:[min,max], always:[group indices], members:{<instances key>: <instances per group>}}]}`: a placement with a `seed` gets a size, heading (if it gave no `rot`), lean, and
a seeded choice of which groups of instances it keeps (which of the four flowers are open; the `always` ones never go). Placements without a `seed` are exactly as written. All of it is deterministic and costs nothing at run time beyond one
copy of the kept instance rows.

**Sizes scale with the thing.** The smallest pick radius, the hotspot marker size, the contact shadow height, the name label's lift, the nearest fly-to distance (cards, search hits) and the tissue spawn distance were absolute metres; they now scale with
min(1, radius_m x scale / 0.5 m), so a 14 mm bee behaves like a dog. `def.label_m` sets how far away the name label shows (default 25 radii); `def.ruler = {label, D, at}` adds a ruler stop.

**Animation (`def.anim`).** All of it is cheap: sway and swing run in the vertex shader (no per-frame work); the rigid kinds move a handful of groups.
`{kind:'sway', systems|parts, from_y, to_y, amp_m, hz, label}`: a light breeze moves free ends (oak leaves, buttercup stems, flowers).
`{kind:'swing', systems|parts, pivot, dir, from, to, axis, amp_deg, hz?, shown_hz, lat_axis, lat:[r0,r1], label}`: the far end of a long part bends back and forth about `axis` through `pivot`, growing from 0 at `from` to full at `to` metres along `dir`
(the dog's tail: the coat is one mesh, so the bend is done in the shader for every part that reaches into the tail).
`{kind:'wag'|'flap'|'sweep', part|parts, pivot, axis, amp_deg, hz, shown_hz, phase, mirror:[part ids that turn the other way]}`: a part turns about an axis through a point. `{kind:'breathe'|'pulse', part, pivot, amp, hz, shown_hz}`: a part swells and shrinks.
`hz` is the real frequency when known; if `shown_hz` is lower, the frame states the slow-motion factor on screen (it is added to the "Field of view" line of the caption); an entry without a real `hz` is stated as illustrative.
Animation runs only in the near and middle tiers and while the frame is drawn.

**Mesh format 2 (compact binary).** `bake.mjs` writes `mesh.json` (an index: for each mesh its scale, offset, vertex and index counts and byte ranges; instance sets; flows) and `mesh.bin`. Positions are int16 (position = value x scale + offset),
triangle indices are delta + zigzag + varint coded (about 1.2 bytes per index), shade is uint8, instance positions are int16 within the set's range, quaternions int16, scales float32. The loader (`thLoadBundle`, `thGeo`, `thInst` in js/things.js) decodes a mesh when its
part is first built; format 1 (all numbers in `mesh.json`) still loads. Budget: under 3 MB on disk per thing (the oak 2.9 MB, the dog 2.7 MB; the numbers with gzip are printed by `bake.mjs`).
