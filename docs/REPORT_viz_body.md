# Report: body figures (data/viz/body.json)

**Coverage:** 230 / 230 nodes in `data/nodes/body_*.json` have a figure. `node tools/viz/validate.mjs data/viz/body.json` reports 0 errors, and rendering all 230 in headless Chrome gives 0 `VIZ_ERRORS`. Every spec has a caption; 105 have sliders. Left/right pairs share a spec (lungs, eyes, kidneys, clavicles, scapulae, humeri, forearms, hands, femurs, patellae, shins, feet).

| type | count |
|---|---|
| plot | 79 |
| blocks | 69 |
| bars | 48 |
| geometry | 33 |
| parametric | 1 |

## What each family shows
- **Heart and vessels:** cardiac-cycle pressure traces with a heart-rate slider and a moving cursor (chambers, valves, aorta); left-ventricle pressure-volume loop with EDV/ESV sliders; ECG for the SA and AV nodes (adjustable PR delay); coronary flow in diastole; compliance and pulse pressure for arteries; Starling forces in capillaries; Guyton venous return; baroreceptor curve; vessel speeds from flow = speed x area.
- **Lungs:** spirogram with rate and depth sliders, pleural and alveolar pressures, PO2 along the capillary, airway branching (1/r^4 resistance), Laplace law with surfactant.
- **Nerves, brain, eye:** all-or-none action potential with a stimulus slider, neuromuscular-junction safety factor, conduction speed versus fibre diameter, lobe map of the brain, pathway diagrams (thalamus, amygdala, basal ganglia, cerebellum), pupil, accommodation and photoreceptor-density plots.
- **Cells and organelles:** schematics (neuron with travelling spike, astrocyte, sperm with beating tail, egg, platelet activation, adipocyte, mitochondrion with proton flow, animated sarcomere) and function plots (O2-Hb curve, cardiac action potential, force-length, GHK membrane potential, ribosome speed).
- **Muscles:** a joint-lever model with real vector geometry (13 muscles). The angle and force sliders give muscle length, moment arm and torque.
- **Skeleton and tissues:** bone-count bars, long-bone section, osteon, stature ratios, hip and patellar loads, spongy-bone strength-density law, growth-plate velocity, tissue-specific plots.
- **Organs:** digestive, renal (filtration, glucose transport maximum, countercurrent gradient, ADH), endocrine feedback (TSH-T4, PTH-Ca, cortisol and melatonin rhythms, glucose-insulin), reproductive cycle plots, thermoregulation (sweat, skin flow, fat insulation).
- **Systems and processes:** block-flow maps and step sequences with realistic numbers.

## Files
- `data/viz/body.json`: the output. The `fns` colours are hex because `js/viz.js` passes `fns[].color` straight to canvas, so names like `accent` do not work there.
- `tools/viz/gen_body/`: the generator. `lib.py` holds the helpers (`pw` hinge-spline curves, `flow`, `net`, `hub`, `bars`, `plot`, `geo`, `jointfig`). The `g_*.py` modules hold the data per body region; `g_fix.py` holds the layouts tuned to narrow cards. `build.py` merges everything, checks coverage and runs a block-diagram overlap/bounds check. `shoot.py` makes the review screenshots.
- Regenerate with `python3 tools/viz/gen_body/build.py`.

## Notes and caveats
- A few specs exceed the soft 2 KB guideline because of drawn cells (29 over 2.5 KB; the largest is the stratified epithelium at about 13 KB). The total is 282 KB.
- Some values are approximate textbook figures and are labelled as such in captions (patellofemoral force, collagen share of dry weight, cortex area across species, disc pressure by posture, thymic involution rate).
- The muscle figures are simplified 2D side views, so the muscle line sits beside the bone rather than wrapping it.
