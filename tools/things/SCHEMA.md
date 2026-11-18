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
data/things/<id>/mesh.json    all geometry and instance lists of that thing
data/nodes/park_*.json        the cards (nodes) the parts point at
```

## 1. Files

### data/things/index.json
```json
{ "things": [ { "id": "boulder", "placements": [ { "at": [-4.6, 3.4], "rot": 20, "scale": 1, "y": 0 } ] } ] }
```
`at` = [x, z] metres in the park (park origin = where the person stands, +y up), `rot` degrees about the vertical,
`scale` uniform, `y` height of the base above the ground (default 0). Each placement becomes one frame
(`FT.thing`, a co-rendered child of the park, same unit = metres). Several placements of one thing share
geometry and data. A placement may add `"seed"` (reserved for per-instance variation).

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
| `auto` | optional `{label, near_m, near: modeId, far: modeId}`: an "Auto" button that picks the mode by camera distance |
| `lod` | `{near_m}`: below this camera distance parts marked `"lod":"near"` show, above it `"far"` ones (hysteresis 0.9x / 1.15x) |
| `shadow` | `{radius_m, opacity, offset?}` soft contact shadow disc on the ground |
| `cut` | cut-open definition, see below |
| `hotspots` | `[{id, node, at:[x,y,z], label}]` yellow markers shown in cut-open modes; each opens its card |
| `anim` | RESERVED, not implemented in the runtime yet (T1d). Planned shape: `[{part, kind:'sway'|'wag'|'flap'|'flow', axis, amp_deg, hz, phase}]`, per-part and data-only; the runtime will ignore it until then, so a thing may already carry it. |
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

**modes** (the layer buttons): `{id, label, show:{<system>:opacity, '*':opacity}, cut?: true | {at, normal}, hotspots?: true}`.
Opacity 0 hides the system. Transitions are smooth.

**cut**: `{default, at:[x,y,z], faces:{<key>: face}}`. A cut-open mode clips the thing with a plane through `at`,
normal pointing away from the camera when the mode is chosen ("Turn the cut to face me" re-aims it). A `face` is the
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
