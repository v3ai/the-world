# Report: interactive figures for knowledge nodes (kn.json)

Coverage: 307 of 307 nodes (all ids in data/knowledge/nodes.json except those in data/nodes/*.json and data/viz/samples.json).
Output: data/viz/kn.json (about 346 KB, one object id -> spec).
Validation: `node tools/viz/validate.mjs data/viz/kn.json` reports 307 specs, 0 errors. All 13 viztest batches (n=24) were rendered with Playwright/Chrome (swiftshader) and showed 0 VIZ_ERRORS and no empty figures.

Types used: plot (most), blocks, bars, geometry, surface, parametric, heatmap, field, graph, dist, signal, logic.
Each figure has 1-3 sliders with live readouts where useful, a 1-2 sentence caption; frontier (C3/C4) topics show competing ideas and say the question is open.

Generator: tools/viz/gen_kn/ (lib.py helpers, p1-p6.py content by domain, p7.py post-QA overrides, gen.py builds kn.json, shot.py/split.py for screenshots). Run `python3 tools/viz/gen_kn/gen.py`.

Renderer quirks handled: named plot colours are converted to hex in gen.py; geometry rects distort when non-equal, so rectangles are emitted as polys; log axes label every decade, so many figures use log10 values on linear axes (labelled as log10).

Caveats: many curves are schematic or approximate fits (stated in captions). A few tick or in-plot labels overlap slightly at default slider values (e.g. some log-axis plots, bar value labels at the top of tall bars, a few blocks labels near edges); nothing is empty or unreadable. No existing files were edited and nothing was committed.
