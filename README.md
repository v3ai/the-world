# The World

An explorable, true-scale model of everything science knows — from quarks inside a proton to the cosmic web — that you can zoom through continuously, click on, and open up to see what things are made of and how they work.

## What's in it

- **One continuous zoom** across ~42 powers of ten, with real sizes and distances: an oxygen atom in your DNA, your cells and organs, a park in Greenwich, the real Earth turning under the real Sun, the planets where they are today (astronomy-engine), 109,000 real stars (HYG catalog), the Milky Way, the Local Group and the cosmic web.
- **Explorable nodes** — things you can click, open and drill into. The first domain is the human body: 114 anatomical structures (BodyParts3D), cut-away organs with labeled inner parts, tissues, cells and step-by-step processes.
- **Matter at every scale** — 250 molecules, 17 crystal lattices, liquid water and air at molecular scale, atoms with quantum orbitals and true-size nuclei, protons with quarks and gluons.
- **A knowledge map** (309 topics with certainty levels and open questions) and a **library** indexing 51 OpenStax textbooks; every explanation links to the relevant textbook section.

## Run locally

It's a static site with no build step:

```
python3 -m http.server 8000
# open http://localhost:8000
```

Three.js r128, its post-processing examples, and astronomy-engine load from public CDNs.

## Layout

```
index.html          app shell and styles
js/engine.js        nested real-scale frames, camera, zoom-to-cursor, picking, labels
js/engine_ui.js     info panel, library, scale ruler, tours, main loop
js/world_space.js   cosmos, galaxies, stars, solar system, planets, Earth
js/world_matter.js  molecules, crystals, liquids, gases, atoms, nuclei, micro-scale scenes, landscapes
js/nodes.js         explorable node system: anatomy, organs, tissues, processes
js/world_build.js   assembles the world, landmarks, start view
js/levels_v2.js     earlier hand-built scenes reused inside the zoom (park, cell, DNA, atom, proton, black hole)
data/               all content as data (nodes, anatomy meshes, stars, molecules, elements, library index…)
assets/             textures and ATTRIBUTION.md
tools/              scripts that generated the data
docs/               build reports for each data set (sources, checks, known gaps)
```

## Adding content

Most content is data, not code. An explorable thing is a node in `data/nodes/*.json` (listed in `data/nodes/manifest.json`):

```json
{
  "id": "heart", "title": "Heart", "kind": "organ", "template": "organ",
  "parents": ["cardiovascular_system"], "parts": ["left_ventricle", "..."],
  "made_of": ["cardiac_muscle_tissue"], "processes": ["cardiac_cycle"],
  "summary": "...", "layers": {"basics": "...", "deeper": "...", "expert": "..."},
  "facts": [["Weight", "≈ 300 g"]], "certainty": "C1", "refs": [["ANP", "19.1", "19-1-heart-anatomy"]]
}
```

## Sources and licences

Every third-party data set, texture and model is credited in [`assets/ATTRIBUTION.md`](assets/ATTRIBUTION.md). Notably:

- Anatomy meshes are derived from **BodyParts3D** (DBCLS) and are shared under its share-alike terms.
- Textbook titles and terms are indexed from **OpenStax** books; explanations here are original and link to the books rather than copying them.
- Stars from the **HYG database**; molecules computed with **RDKit**; element data from **mendeleev**; protein structures from the **wwPDB**.
