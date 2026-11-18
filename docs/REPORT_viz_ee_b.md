# Figure report: ee_b (EE signals, DSP, EM, devices, control, comm, power, labs, electives, teardown)

- Output: `data/viz/ee_b.json` — 186 specs, covering 100% of the nodes in `ee_signals`, `ee_dsp`, `ee_em`, `ee_devices`, `ee_control`, `ee_comm`, `ee_power`, `ee_labs`, `ee_electives`, `ee_teardown` (ids already in `samples.json` were skipped).
- Generator: `tools/viz/gen_ee_b/` (`common.py` helpers, `part_a..e.py` specs, `build.py` writes the JSON; `shoot.py` and `card.py` are Playwright render helpers). Rebuild with `python3 tools/viz/gen_ee_b/build.py`.
- Validation: `node tools/viz/validate.mjs data/viz/ee_b.json` gives 186 specs, 0 errors. All 8 preview batches (`viztest.html?file=ee_b.json&from=N&n=24`) rendered with no `VIZ_ERRORS`, and every batch was inspected visually.

## Types used
plot (about 85), signal (15, many with spectrum), geometry (28), blocks (36 incl. all 8 process nodes), pz and bode (control and DSP), field, vectors, parametric (polar antenna patterns, polarisation), heatmap, bars, fsm, logic, graph.

## Notes
- Interactive: nearly every figure has 1–3 sliders and readouts with the governing formula; dynamic ones use `t` (pulses on a line, standing waves, EM wave, gradient descent, Bluetooth hopping, electrons in the MOSFET channel, rotating FOC frame).
- Renderer quirk found: in `plot`, a curve's `color` given as a name (`accent`, `pink`...) is not resolved (the raw string overrides the palette), so named colours are drawn as invisible. The generator converts curve colours to hex. Named colours do work elsewhere (shapes, points, bars, blocks). Existing `samples.json` `waves_interference` has the same issue (not touched).
- Plots with `logy` need an explicit `y` range: the automatic padding goes negative and nothing is drawn.
- Some specs exceed the ~2 KB guideline (Smith chart, QAM, crystal lattice, breadboard, pipeline) because they are built from many shapes.
- Approximations to know about: power-semiconductor Ron·A limits are order-of-magnitude theoretical values; flyback power readout assumes full energy transfer; rectifier ripple readout is a rough upper bound; NPU energy bars are Horowitz-style 45 nm figures.
