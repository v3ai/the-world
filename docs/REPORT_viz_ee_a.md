# Figure report: ee_a (EE hubs, math, physics, programming, circuits, electronics, digital, architecture)

Output: `data/viz/ee_a.json` — 189 specs, 100% of the nodes in `ee_hubs`, `ee_math`, `ee_physics`, `ee_programming`, `ee_circuits`, `ee_electronics`, `ee_digital`, `ee_architecture` that are not already in `samples.json`.
Generator: `tools/viz/gen_ee_a/` (`build.py` runs `g_*.py` modules, one per node file; `lib.py` has helpers and schematic parts). Rebuild with `cd tools/viz/gen_ee_a && python3 build.py`.
Checks: `node tools/viz/validate.mjs data/viz/ee_a.json` reports 0 errors; `tools/viz/gen_ee_a/stress.mjs` (all sliders at min/max/default, readouts and curves finite) 0 issues; a headless-Chrome pass over all 189 cards with every slider driven to min and to max raised no `VIZ_ERRORS`. Every batch was screenshotted and inspected, and the clipped or overlapping figures were fixed.

## Counts by type
plot 92, blocks 33 (17 hub maps + 16 pipelines/protocols), geometry 28 (schematics, sketches), bode 6, field 5, vectors 4, logic 4, signal 3, heatmap 2, dist 2, pz 2, bars 2, bits 2, graph 1, phasor 1, kmap 1, fsm 1.
152 figures have sliders (1–3 each), 151 have live readouts, about 53 animate (t, flow, steps).

## Renderer quirks found (js/viz.js not edited)
- `plot` curves: `fns[].color` given as a name (`"accent"`) is not resolved (the raw string overrides the resolved colour, so the line draws black). The generator therefore writes hex colours for plot fns. Other elements (points, vlines, shapes) accept names fine.
- `plot` `ylabel` is drawn on top of the first legend entry. The build step folds the unit into the first legend label instead (e.g. `power [mW]`).
- `bits` breaks for n ≥ 32 (`1 << n`), and 16 boxes crowd the weight labels, so I used 8-bit figures.
- `fsm` uses a circle layout that clips a self-loop on the top state; the latch figure sets explicit `x`/`y` on its states to avoid that.
- Readout/label numbers are shown to 3 significant digits (e.g. 2¹⁰ shows as 1020), so I chose defaults such as n = 8 where that matters.

## Not done as well as I would like
- Several schematics (KVL, nodal, mesh, series/parallel, two-port, GPIO) and the pipeline Gantt exceed the ~2 KB per spec guideline (up to ~9 KB for `pipelining_hazards`) because they are drawn from many small shapes.
- Some figures are honest simplifications: `oscillators_ee` (start-up growth rate is illustrative), `feedback_stability_margins` (uses the ζ ≈ PM/100 rule of thumb), `bjt_amplifiers` (idealised gains), `stokes_theorem` and `gauss_law_ee` (sketch/curve, not a 3D surface), `latches` (SR latch drawn as a 2-state FSM).
- Hubs are static structural maps (animated flow) without sliders; `bonding_materials` shows orders of magnitude above copper because log bars of sub-1 values rendered poorly.
- `electrical_engineering` and the other hubs show a curated subset of sub-topics, not every child node.
