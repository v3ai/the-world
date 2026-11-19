# tools/atom: element data

Regenerates `data/elements.json` (118 elements) and `data/atomic/{zeff,isotopes,lines,scf}.json` (`sources.json` is hand-written).

```
pip install mendeleev                       # basic per-element properties and Clementi-Raimondi screening constants
python3 tools/atom/fetch_sources.py CACHE   # downloads NIST, NUBASE2020, CIAAW, PubChem and ~100 NIST line lists into CACHE
ATOM_CACHE=CACHE python3 tools/atom/build_elements.py
python3 tools/atom/check_elements.py CACHE  # must print "all checks passed"
PYTHONPATH=<numpy+scipy> python3 tools/atom/build_scf.py   # cloud sizes (needs numpy and scipy), after build_elements.py
python3 tools/atom/build_nodes.py           # cards and figures, after both
```

Downloaded files are untrusted data: they are parsed, never executed. `CACHE` defaults to `tools/atom/.cache` (git-ignored).

Hand-edited inputs live next to the scripts:

- `overrides.json`: corrections to mendeleev values (electronegativity, density, melting/boiling points, discovery
  years), each group with the source consulted. `null` means "no reliable value: show none".
- `summaries.json`: the plain-language summary for each element.

What `elements.json` gains over the first version (all old keys are kept): `subshells` (ground-state occupancies),
`config` (noble-gas notation, explicit counts), `config_anomaly`, `config_predicted`, `config_source`, `config_note`,
`ground_level`, `mass_uncertainty`/`mass_note`, `ionization_unc_eV`/`ionization_status`, `radius_vdw_source`,
`isotope_basis`, `discovered_note`. `data/atomic/sources.json` says where every field comes from.

`check_elements.py` asserts: electron count = Z, subshell capacities, period/group/block placement, the 20 configurations
that break the filling order against a hand-typed NIST reference, isotope abundances sum to 1, abundance-weighted mass
agrees with the atomic weight, Slater's rules reproduce the textbook Fe values, computed hydrogen lines agree with NIST,
a hand-typed table of NIST ionisation energies and CIAAW weights, and (with the cache) every ionisation energy against
the downloaded NIST table.

## Orbital engine (stage A2)

- `js/atom.js` part 1 (`AQ`): hydrogen-like wavefunctions, tabulated inverse-CDF samplers, the probability current,
  superpositions. Part 2 (`AtomCloud`): the three.js dot-cloud renderer. Part 3: `FT.atomq`, a test frame for the engine.
- `node tools/atom/test_orbitals.mjs` (use the venv node, `/home/rhett/projects/how/.devtools/venv/bin/node`): about
  1000 numerical checks (normalisation, <r>, nodes, orthogonality, spherical harmonics, KS tests of the samplers, the
  current, equivariance of the superposition). Takes about 40 s. Must print "all N checks passed".
- `tools/atom/orbital_test.html` (serve the repo root, open `/tools/atom/orbital_test.html`): any Z, n, l, m, real or
  complex, whole atom, superposition, cutaway, dot count. URL parameters: `mode=orbital|shells|super`, `z`, `n`, `l`,
  `m`, `fam=cos`, `sup=1s2p0|1s2p1|1s2s`, `dots`, `cut=1`, `clean=1` (hide the panel), `az`, `el`.

## Stage A3: topic and element cards

`python3 tools/atom/build_nodes.py` writes `data/nodes/phys_atom.json` (19 topic cards with ids `at_*` and one card `at_el_<Symbol>` per element,
generated from `data/elements.json` and `data/atomic/*.json`) and `data/viz/atom.json` (one figure per topic card). Validate the figures with
`node tools/viz/validate.mjs data/viz/atom.json`.

## Cloud sizes (data/atomic/scf.json) and their validation

`scf.py` is a spherical, non-relativistic, self-consistent central-field atom (Hartree potential of the whole spherical density plus the
local exchange potential -(3 rho/pi)^(1/3); no correlation, no relativity, one-electron hydrogen solved exactly). `build_scf.py` runs it for the
ground-state configuration of all 118 elements and stores the mean radius <r>, the radius of maximum density and the orbital energy of every
occupied subshell. `js/atom.js` draws each subshell as a hydrogen-like function with its n-l-1 nodes, rescaled so that <r> equals the stored value
(Z' = (3n^2 - l(l+1)) / (2 <r>)). The Clementi-Raimondi/Slater table `zeff.json` is kept only for the effective-nuclear-charge card.

Validation, stored in scf.json under `validation` and asserted by `check_elements.py`: hydrogenic test of the solver, grid test, and a comparison
with numerical Hartree-Fock <r> from Table 11 of J. B. Mann, Los Alamos report LA-3691 (1968) (https://www.osti.gov/biblio/4553157).
`parse_mann.py` reads that table from the OCR text layer of the scanned PDF (rows that fail consistency tests are dropped; the result is
`reference/mann1968_raw.json`). To redo it: download https://www.osti.gov/servlets/purl/4553157 into an empty folder, extract the text of all pages
(pypdf), then `python3 parse_mann.py text.txt reference/mann1968_raw.json data/elements.json`.
