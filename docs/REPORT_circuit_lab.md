# Circuit Lab report

Files: `js/labs/circuit.js` (~1700 lines, self-contained, `LABS.circuit.open(container, presetId)` -> `{close, loadPreset}`),
`data/labs/circuit_presets.json` (37 presets), `tools/labtest/circuit.html` (standalone page, `?preset=id`),
`tools/labtest/circuit_solver_test.mjs` (node solver tests). No existing file was modified.

## Features
- Grid canvas editor (DPR-crisp, wheel/drag/pinch pan-zoom), 20 parts + wire tool, place/rotate (R)/delete/drag, properties panel with engineering units (4.7k, 100n, 10m).
- Solver: MNA, DC Newton (junction limiting, damping, gmin + source stepping), trapezoidal transient with real-time playback/speed/pause, AC small-signal sweep, singular-matrix reports (floating node, source loop).
- Visualisation: voltage-coloured wires + legend, animated current dots, hover V/I, glowing LEDs and lamps, probe readouts.
- Instruments: 2-ch scope (probes with optional reference, time/div, V/div, trigger, auto-set), DMM, Bode plotter (peak, -3 dB, Q), values table.
- "What's happening?": part-specific explanation, KCL at a node, Thevenin/Norton between picked nodes, tau = RC, resonance/zeta, power balance. Preset "try it" sliders.

## Verification
- Node: 67 PASS / 0 FAIL (divider, Thevenin, RC 63.2% at tau, RLC natural frequency, low-pass -3 dB at 1/(2 pi RC), half-wave peak, CMOS inverter switching, inverting-amp gain, all 37 presets compile/solve/run).
- Headless Chrome screenshots of rc_charging, low_pass (Bode), common_emitter, wien_oscillator, thevenin, half_wave_rectifier: render cleanly, no page errors; Bode corner read 998 Hz for a 1 kHz filter.

## Known limits
- Thevenin removes parts wired directly across A-B (treated as the load).
- Op-amp is ideal-ish (gain 1e5, tanh rails); no slew/bandwidth.
- Newton on deeply saturated BJTs relies on limiting + gmin stepping; extreme circuits may report non-convergence.
- No PNP in palette (model supports it); dragging a part stretches attached wire ends only.
- Scope shows "rolling" until one full window has elapsed or no trigger edge exists.
- Test page overrides `LABS.circuit.presetUrl`; host default is `data/labs/circuit_presets.json`.
