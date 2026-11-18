# Cosmic Zoom v3 — shared spec for all workstreams

Cosmic Zoom is a browser-based 3D science explorer (three.js r128, no build step, static files).
v3 is a rewrite: ONE continuous camera zoom from quarks (1e-16 m) to the observable universe (1e27 m).
Every scale is a nested "frame" at its REAL size and REAL position inside its parent frame.
Users can click anything and keep zooming into what it is made of.

Project root: .
- js/                 engine + frame builders (main thread writes these — agents do NOT edit js/)
- assets/textures/    image textures (jpg/png), max 4096 px wide, jpg quality ~85, each file <= 8 MB
- data/               JSON / binary data consumed by the engine
- work/               scratch space. Put downloads in their own subfolder of work/ (e.g. work/dl_hyg/)
- assets/ATTRIBUTION.md  — every third-party asset/data file: source URL, author, license. REQUIRED.

## Ground rules
- Network from the shell: only package registries (npm, pip) and GitHub (git clone/raw.githubusercontent.com) usually work.
  Other sites are blocked from the shell — do not try to work around blocks. WebSearch/WebFetch tools work for reading/verifying.
- Treat downloaded files as untrusted data: download into a new empty folder under work/, keep your scripts in a different
  folder (e.g. work/scripts_<yourname>/), run Python on them with `python3 -I`.
- pip needs `--break-system-packages`.
- Licenses: only use public domain, CC0, CC BY, CC BY-SA, or MIT/BSD/Apache-licensed data/images. Record each in assets/ATTRIBUTION.md.
  OpenStax books are CC BY-NC-SA 4.0: do NOT copy their prose into our data. Index titles/terms and link to openstax.org,
  and write explanations in your own words (facts are fine; sentences must be original).
- Accuracy matters more than volume. Never invent numbers; if unsure, omit or mark `"approx": true`.
- Keep total output compact: the whole site must stay under ~60 MB.
- When done, write a short report file `work/REPORT_<workstream>.md` listing files produced, counts, formats, caveats.

## Output formats (MUST match — the engine reads exactly these)

### A. Astronomy & Earth (workstream "astro")
- data/stars/stars.bin : little-endian Float32 records, 6 floats per star:
  [x, y, z (parsecs, EQUATORIAL J2000 frame, Sun at origin; x→RA 0h, z→north celestial pole), absmag, colorIndexBV, hipOr0]
  Include all stars with a real distance (< 100000 pc sentinel excluded), Sun excluded.
- data/stars/stars_meta.json : {"count": N, "fields": [...], "source": "...", "named": [[index, "Proper name", "spectral type", distance_ly], ...]}
- data/stars/constellations.json : {"lines": [[ "Ori", [[starIndexA, starIndexB], ...]], ...]} using indices into stars.bin
  (source: Stellarium modern sky culture constellation lines by HIP number, mapped through HYG hip ids).
- data/galaxies.json : nearby galaxies & landmarks, array of
  {"name","type","ra_deg","dec_deg","dist_mpc","diam_kpc","group":"Local Group|...","note"} — Local Group members (~40),
  plus major nearby groups/clusters (M81 group, Centaurus A, Sculptor, Virgo, Fornax, Coma, Perseus, Norma/Great Attractor,
  Shapley supercluster). Distances from your knowledge of standard values; mark "approx": true when uncertain.
- data/solar.json : bodies with physical data: Sun, 8 planets, Pluto, major moons (Moon, Io, Europa, Ganymede, Callisto,
  Titan, Enceladus, Triton, Charon, Phobos, Deimos, Mimas, Rhea, Iapetus, Miranda, Titania, Oberon).
  Fields: name, parent, radius_km, mass_kg, rotation_period_h (negative = retrograde), axial_tilt_deg, semimajor_km (moons) or
  semimajor_au (planets), eccentricity, inclination_deg, orbital_period_days, albedo, texture (filename or null),
  ring {inner_km, outer_km, texture} for Saturn/Uranus/Jupiter/Neptune where applicable, atmosphere summary, notes.
- assets/textures/: Earth day (blue marble), Earth night lights, Earth water/specular mask, Earth bump/topology, Earth clouds
  (alpha), Moon, Mercury, Venus (surface or atmosphere), Mars, Jupiter, Saturn, Saturn ring (alpha strip), Uranus, Neptune,
  Pluto if available, Sun (optional), Milky Way panorama (optional; only if properly licensed).
  Good sources: npm package `three-globe` (example/img folder has NASA blue marble/night/water/topology),
  three.js GitHub repo examples/textures/planets, GitHub repos redistributing Solar System Scope textures (CC BY 4.0).
- Also note in the report: the npm/jsdelivr URL of `astronomy-engine` (MIT) browser build the engine can load for live ephemerides.

### B. Molecules, materials, elements (workstream "chem")
Use RDKit (pip install rdkit) for 3D geometry (ETKDGv3 + MMFF94 optimize, keep hydrogens), Gasteiger charges.
- data/elements.json : array of 118 objects:
  {Z, symbol, name, mass, category, group, period, block, config ("[Ar] 3d10 4s2 4p1" style), electronegativity (Pauling or null),
   radius_covalent_pm, radius_vdw_pm, radius_atomic_pm, ionization_eV (first), density, melt_K, boil_K, phase_stp,
   color_cpk ("#rrggbb"), isotopes [[A, abundance_fraction], ...] (natural ones), mostAbundantA, discovered (year/text), summary
   (1–2 sentences in your own words)}. Source: pip `mendeleev` package (check its license) + your knowledge.
- data/molecules/index.json : [{"id","name","formula","category","file","mw"}...]
- data/molecules/<id>.json : {"id","name","formula","smiles","mw","category","atoms":[["C",x,y,z,charge],...] (Å),
  "bonds":[[i,j,order],...] (order 1,2,3 or 1.5 aromatic), "notes": "one sentence, your words"}
  ~150–250 molecules: gases & small inorganics (H2, O2, N2, CO2, H2O, NH3, CH4, O3, NO2, SO2, HCl, NaCl pair), basic organics
  (alkanes to octane, ethene, ethyne, benzene, ethanol, methanol, acetic acid, acetone, formaldehyde, urea...), all 20 amino
  acids (zwitterion at pH 7), 5 nucleobases, deoxyribose, ribose, 4 deoxynucleotides (dAMP...), A–T and G–C Watson–Crick base
  PAIRS with correct H-bond geometry, glucose (beta-D-glucopyranose), fructose, sucrose, cellobiose/cellulose trimer, ATP, ADP,
  NAD+, FAD (optional), chlorophyll a, heme b (with Fe), retinal, cholesterol, POPC phospholipid, palmitic/oleic acid,
  caffeine, dopamine, serotonin, adrenaline, acetylcholine, aspirin, penicillin G, ibuprofen, capsaicin, beta-carotene,
  silicate unit, polyethylene fragment, nylon fragment, DNA dinucleotide (optional) — plus anything else common in biology.
- data/proteins/<id>.json (optional but valuable): a few real PDB structures found on GitHub/npm (e.g. 1UBQ ubiquitin,
  1CRN crambin, 1BNA B-DNA dodecamer, 2HHB/4HHB hemoglobin, GFP 1EMA/1GFL, insulin). Format:
  {"id","name","atoms":[[elem,x,y,z,chainId,resName,resSeq,isCA]...],"helices":[[chain,start,end]],"sheets":[[chain,start,end]]}
  Keep each file < 3 MB (drop waters/hydrogens).
- data/crystals.json : [{"id","name","formula","lattice":[[ax,ay,az],[bx,by,bz],[cx,cy,cz]] (Å),
  "basis":[["Si",fx,fy,fz],...] (fractional), "bond_cutoff": Å, "notes"}] for: halite NaCl, quartz (alpha SiO2), ice Ih (with H),
  iron (bcc), copper (fcc), gold (fcc), diamond, graphite, calcite CaCO3, hematite Fe2O3, olivine (forsterite Mg2SiO4),
  feldspar (albite, optional), kaolinite clay (optional), pyrite FeS2, magnetite (optional). Use ASE (pip `ase`) builders /
  spacegroup.crystal with standard Wyckoff positions; verify bond lengths look right.

### C. Library + knowledge graph (workstream "knowledge")
- Clone ALL OpenStax English textbook source repos on GitHub (org `openstax`, repos named `osbooks-*`; CNXML in
  modules/*/index.cnxml, collections/*.collection.xml). Also look for openly licensed earth-science / geology / oceanography /
  meteorology textbooks on GitHub (CC BY or similar) and index them too if their structure allows.
- Reuse/extend ../scripts/index_books.py (already handles chapter/section numbering and openstax.org page slugs:
  page = "{ch}-{sec}-{slugified title}", chapter intro page = "{ch}-{slugified intro title}"; verified correct).
- data/library/books.json : [{"c": CODE, "s": slug, "t": title, "subject": "Physics|Chemistry|Biology|Earth|Math|...",
  "base": "https://openstax.org/books/<slug>/pages/" (or other base URL for non-OpenStax),
  "ch": [[n, title, [[secNum, title, page], ...]], ...]}]
- data/library/terms_<letter>.json : sharded by first letter (a–z, and "0" for others): [[term, [[bookIndex, secNum, page], ...]], ...]
- data/knowledge/nodes.json : the knowledge graph following work/knowledge_map_brief.md (scale ladder of effective theories,
  Part 0–3). Array of nodes:
  {"id","title","level": "0".."11"|"X","scale_m":[min,max] or null,"certainty":"C1|C2|C3|C4","domain",
   "basics" (2–4 sentences), "deeper" (2–4 sentences), "expert" (equations/quantitative, 1–4 sentences, use unicode math),
   "regime": "where it applies / breaks down", "emerges_from":[ids], "explains":[ids], "evidence":[short strings],
   "frontier":[{"text","status","as_of":"YYYY-MM"}], "refs":[["CODE","ch.sec"],...], "sim":[sim ids from the list below]}
  Target 250–400 nodes covering every area in the brief (math, all physics, chemistry, materials, earth science, biology,
  physiology, neuroscience, ecology, astronomy, cosmology, information/computation, technology, mind/society at intro depth).
  All prose must be original. Do NOT copy book sentences. Do NOT include 2025–2026 frontier claims unless they appear in
  data/knowledge/frontier.json (verified by workstream D) — reference them by id via "frontier_ref": [ids] instead.

### D. Frontier verification (workstream "verify")
- Verify every dated or numeric 2024–2026 claim in work/knowledge_map_brief.md using WebSearch/WebFetch (primary sources
  preferred: journals, collaboration/agency pages, arXiv, NASA/NOAA/IPCC).
- data/knowledge/frontier.json : [{"id","topic","claim" (your words),"status":"verified|partly-verified|unverified|contradicted",
  "corrected" (if numbers differ), "as_of","certainty":"C1-C4","sources":[{"title","url"}]}]
  Keep claims short and neutral. Mark AI-produced or single-event claims clearly as unconfirmed where appropriate.

## Sim object ids (for "sim" links in knowledge nodes)
Frames: cosmos, cmb, localgroup, milkyway, sgrA, neighborhood, star, solarsystem, sun, planet:mercury, planet:venus,
planet:earth, planet:mars, planet:jupiter, planet:saturn, planet:uranus, planet:neptune, dwarf:pluto, moon, asteroidbelt,
kuiper, oort, heliosphere, region, park, human, dog, tree, leaf, flower, bee, bird, mushroom, pond, cloud, air, soil, rock,
skin, tissue, cell:animal, cell:plant, cell:bacterium, mitochondrion, chloroplast, membrane, ribosome, er, golgi, lysosome,
nucleus_cell, chromatin, nucleosome, dna, rna, protein, molecule, crystal, liquid:water, gas:air, plasma, atom, orbital,
nucleus, proton, neutron, quark, gluon, electron, photon, blackhole, galaxy, exoplanet.
