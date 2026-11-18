# Semiconductor Device Lab — build report

Files: `js/labs/device.js` (≈1,140 lines, plain JS, no dependencies), `data/labs/device_presets.json` (41 presets), `tools/labtest/device.html` (standalone test page; `?preset=<id>` opens a preset). No existing file was changed.

API: `LABS.device = { title, open(container, presetId) -> { close(), loadPreset(id) } }`. Presets are fetched from `data/labs/device_presets.json` (URL resolved relative to the script, so it works from the host page and from the test page). A "Presets…" dropdown in the tab bar also exposes them. `LABS.device._phys` exposes the physics core (also `module.exports` under Node) for testing.

## Features (8 tabs; each has "What you're seeing", live readouts, "Key equations", sliders/toggles)
1. **Crystal & bands** – rotating diamond-cubic unit cell (18 atoms, 2.35 Å bonds); N=8 level splitting into s/p-derived bands vs interatomic spacing (toy two-band model with avoided crossing, gap 1.12 eV at the Si bond length); metal / semiconductor / insulator pictures; Fermi–Dirac plot with temperature and probe energy.
2. **Doping & carriers** – donors/acceptors with incomplete ionisation (45 meV levels), exact charge-neutrality solve for E_F, n(T) with freeze-out/extrinsic/intrinsic regions, n,p vs N_D, Caughey–Thomas mobilities with T-dependence, σ, animated drift (E-field) and diffusion (imposed gradient) with J readouts.
3. **PN junction** – depletion approximation (V_bi, W, x_n/x_p, E_max, C_j), optional numeric 1-D Poisson solution (graded-mesh Newton/Thomas, separate quasi-Fermi levels), ρ/E/ψ plots, band diagram with E_Fn/E_Fp, I–V (Shockley long-diode I_s, depletion generation, series R_s, avalanche/Zener breakdown, lin/log), animated carriers.
4. **Diodes in use** – LED (GaAs, AlGaAs, AlGaInP, GaP:N, InGaN with bowing, GaN, Si indirect; photon colour, spectrum, load line, EQE), solar cell/photodiode (I–V in 4th quadrant, V_oc, I_sc, MPP, FF, efficiency, R_s/R_sh, T, V_oc vs intensity), Zener (tunnelling vs avalanche, regulator load line, V_out–V_in).
5. **BJT** – n-p-n cartoon with animated injection/recombination, band diagram from actual V_BE/V_BC, Ebers–Moll with Early effect and β_R, output family with load line, Q-point and shaded cutoff/active/saturation, Gummel plot.
6. **MOSFET** – cross-section with tapering channel and pinch-off, exact 1-D MOS surface potential (accumulation/depletion/inversion band diagram), I_D–V_GS (lin/log) and I_D–V_DS families, V_T from gate material/N_A/t_ox, square law + CLM + EKV-style weak-inversion smoothing, optional velocity saturation + DIBL, isometric planar / FinFET / GAA drawings and DIBL-vs-L from the natural-length scaling.
7. **CMOS** – VTC from nMOS/pMOS current balance, unity-gain points, noise margins, load-line intersection, real transient integration of C·dV/dt (t_pHL/t_pLH), animated switching, NAND/NOR transistor schematics with conduction paths + truth table, dynamic-power calculator α·C·V²·f.
8. **Fabrication** – 15-step simplified n-MOS process drawn to scale (nm) with animated oxidation, CVD, resist, exposure through a mask, develop, plasma etch, implant, ILD, CMP, contact etch, metal fill, CMP, Cu damascene; step list (clickable), slider, auto-play, scale bar, plain-language captions.

## Constants used (silicon, 300 K)
E_g = 1.12 eV (Varshni shift with T), **n_i = 1.00×10¹⁰ cm⁻³**, N_C = 2.86×10¹⁹, N_V = 2.285×10¹⁹ cm⁻³ (N_V is tuned so that n_i = √(N_C N_V)·e^(−E_g/2kT) is exactly 1.0×10¹⁰; textbook N_V = 2.66×10¹⁹ would give 1.08×10¹⁰), ε_r = 11.7, SiO₂ ε_r = 3.9, kT = 25.852 meV.

## Verification (node check script + headless Chrome)
Node checks (all PASS): V_bi(1e16/1e16) = 0.7143 V; W(0 V) = 0.4298 µm; x_n = 0.215 µm; E_max = 3.32×10⁴ V/cm; C_j = 24.1 nF/cm²; W(−5 V) = 1.2157 µm; intrinsic n = p = 1.0×10¹⁰ and E_F = E_i (0.003 eV below midgap, as expected from N_V < N_C); (E_c−E_i)+(E_i−E_v) = E_g; n_i(600 K)/n_i(300 K) = 3.5×10⁵; mass action n·p = n_i²; E_F − E_i = kT ln(n/n_i); μ_n, μ_p(1e16) = 1186, 429 cm²/Vs; forward slope 59.5 mV/dec; solar V_oc 0.631 V, FF 0.80; φ_F = 0.417 V, C_ox = 1.151 µF/cm², V_T(mid-gap gate) = 0.561 V, ψ_s(V_T) = 2φ_F; BJT I_C = 4.30 mA at I_B = 40 µA (β=100); numeric Poisson potential drop = V_bi, peak field within 4 % (0 V) / 0.5 % (−5 V) of the depletion approximation. Breakdown estimates: V_br(1e17/1e17) = 11.0 V, 1e16 → 61.6 V, 1e18 → 1.95 V (Zener).
Browser: served with `python3 -m http.server 8791`, rendered in headless Chrome (SwiftShader); screenshots of every tab (≥ 25 presets) were inspected and layout issues fixed (label overlaps, band-diagram connectors, legends). A script loaded all 41 presets, clicked all tabs and moved every slider to min/max/mid: no console errors, no NaN/undefined in readouts; `close()` removes all DOM.

## Limits / honest caveats
- Educational models: Boltzmann statistics (not degenerate-aware above ~10¹⁸ cm⁻³), no band-gap narrowing, long-diode I_s, no recombination in the forward ideality factor (n = 1), simple breakdown formulas.
- Numeric Poisson assumes low injection with quasi-Fermi levels flat across the depletion region; the depletion approximation and numeric result differ when one side is thinner than a Debye length (e.g. p⁺n 10¹⁸/10¹⁵ — shown deliberately in the `pn_one_sided` preset). Depletion approximation is clamped above ≈ 0.96 V_bi.
- Band-formation tab is a toy tight-binding-like two-band model (qualitative, gap tuned to 1.12 eV at 2.35 Å).
- MOSFET: per-µm width, one effective mobility with vertical-field degradation, simplified short-channel model; FinFET/GAA DIBL curves use idealised natural-length scaling without halo implants.
- CMOS transient uses the same compact model, a lumped C and no wire RC; chip power assumes every gate drives the same load.
- Fabrication is a schematic, to-scale-in-x/y cartoon of a single transistor, not a process-accurate flow.
- Canvas has a minimum size of 900×560 (scrolls if the container is smaller); layout is tuned for ≥ 1280×720.
