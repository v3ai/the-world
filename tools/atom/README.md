# tools/atom: element data

Regenerates `data/elements.json` (118 elements) and `data/atomic/{zeff,isotopes,lines,sources}.json`.

```
pip install mendeleev                       # basic per-element properties and Clementi-Raimondi screening constants
python3 tools/atom/fetch_sources.py CACHE   # downloads NIST, NUBASE2020, CIAAW, PubChem and ~100 NIST line lists into CACHE
ATOM_CACHE=CACHE python3 tools/atom/build_elements.py
python3 tools/atom/check_elements.py CACHE  # must print "all checks passed"
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
