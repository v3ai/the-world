# The World

The World is a 3D science explorer that runs in a web browser. You zoom in one continuous motion from the cosmic web, through galaxies, the Sun, the Earth and a park in London, down into a body, a cell, DNA, an atom, a nucleus, a proton and the Standard Model particles, about 44 powers of ten in all. You can click any object to read about it, and open many of them to see what they are made of.

It is built on one rule: it tells the truth. Things are drawn at their real size and in their real place, and real data is used wherever data exists (star catalogues, ephemerides, element tables, particle measurements, anatomy meshes). Where a picture is a simplification, a model built from typical proportions, or a stand-in for something not yet built, the screen says so. Cards carry a certainty tag (C1 settled, C2 well supported, C3 debated, C4 speculative) and list open questions where there are any.

It is a static site with no build step: HTML, CSS, JavaScript and JSON files, drawn with three.js r128.

## How to use it

- **Zoom.** Scroll, or pinch on a phone, to move toward whatever is under the pointer. Drag to look around. The arrow keys orbit and + and - zoom. The +/- buttons at the bottom of the scene zoom toward the middle of the view while held.
- **Select.** A single click or tap selects a thing, frames it and shows its card in the one panel on the right. A click on empty space or the sky deselects. A drag is never a click.
- **Look inside.** A double click or double tap, or the "Look inside" button on a card, shows what is inside the thing: its cut-open view if it has one, otherwise the next level down at that point. When nothing has been built there, the panel says "No closer view of this has been built yet". "See it from further out" goes back up one level.
- **The panel.** Everything to read is in the panel: the path of places you are in (each step flies out; Back returns to the previous place and card), a question trail while one plays, the card of the selected thing, the place card, and notes on what the picture is. A card has Basics, Deeper and Expert tabs, facts, what the thing is made of and part of, textbook sections, open questions and the certainty tag. Minimise folds the panel to a tab at the edge; it then stays folded until you click a thing or the tab. On a phone it is a sheet that you drag up by its handle.
- **The scale ruler.** The strip down the left edge shows how big your view is. Click a named place on it (Your skin, London, the Milky Way) to fly there. On a phone, tap the strip to get a list of the places nearby on the scale. The field of view is shown at the bottom left, with a Time button for the clock; the planets are placed for the date and time shown, and the clock can be run faster.
- **Search.** The field at the top right takes everyday words (sugar, a battery, my heart, why is the sky blue, Fe, H2O). Press / or Ctrl/Cmd+K from anywhere to jump to it; Enter takes the first result. Each result says what it will do: fly to a 3D model, or only show a card.
- **Question trails.** The Questions button lists short guided trails that start from a question ("Why is a leaf green?"). Each is five to nine stops, then an answer, what is still unknown and where to go next. Left and Right arrows step, Escape leaves, and you may wander off the trail and return to the stop.
- **Tours.** "Tour in" and "Tour out" at the foot of the ruler fly from stop to stop along the scale, pausing at each. Scrolling, dragging, a double click or Escape cancels a tour. On a phone the tour buttons are in the Library.
- **Library and Tracks.** Library is for browsing: the knowledge map, the places on the scale, tours and the textbook index. Tracks are guided paths through a whole degree in prerequisite order; each card in a track has previous and next buttons, and the track header counts what you have visited (kept in your browser only).
- **Labs.** A card that has a lab shows an "Open in the ..." button. A lab fills the screen over the world; Escape or "Back to the world" returns. Cards for labs that are not built yet say "Planned".
- **The body and other layered things.** Zooming into the human body, or into the dog, robin, bee, pond, soil or ryegrass, peels layers away as you go (for the body: skin, muscle, vessels, bone, organs). A card for a point on the body lists what lies under it, from the skin inward, with "Peel to here", "Hide this" and "Show everything".
- **Labels** can be switched off with the Labels button. Help reopens the short guide.
- **Performance meter.** Press Shift+P, or add `?stats=1` to the address. It shows frames per second, frame-time percentiles, CPU time split into update, picking and drawing, GPU time where the browser supports it (desktop Chrome and Edge), draw calls, triangles, drawing-buffer size and the GPU name, with "Copy report". These URL flags change how it draws (also live from the meter): `fx=low|high`, `bloom=half|full|0`, `dpr=auto|<number>`, `shadows=1|0`, `outline=near|all|0`, `depth=log|tight|vert`, `merge=1|0`, `idle=1|0`. Defaults: `bloom=half`, `dpr=auto`, `shadows=1`, `outline=near`, `depth=log`, `merge=1`, `idle=1`. They are explained in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## What is in it now

Every number below was counted from the files in this repository.

- **The scales of space.** 109,400 stars from the HYG catalogue with 88 constellation figures, 69 galaxies, the cosmic web, the Local Group, the Milky Way, the solar neighbourhood, and 36 Solar System bodies (the Sun, eight planets, Pluto, Ceres, Eris, Haumea, Makemake and 22 moons) placed with astronomy-engine. The view runs from the Standard Model view (a few times 10^-17 m across) to the observable universe (2 x 10^27 m).
- **Earth.** A textured globe with day, night, clouds and the Moon, a region view of Greenwich, London, and Greenwich Park at human scale. The Sun in the park follows the clock.
- **The park.** Ten things built from data, 45 placements in all, with 622 named parts between them. Each part has a card, and 158 of them open a closer view (a tissue scene, a crystal or a molecule).

  | thing | placed | parts | close-up scenes |
  |---|---|---|---|
  | Boulder (granite, with moss and lichen) | 2 | 6 | a quartz crystal |
  | English oak | 19 | 26 | 3 |
  | Fly agaric | 1 | 46 | 3 |
  | Dog | 1 | 134 | 4 |
  | Meadow buttercup | 12 | 47 | 4 |
  | Honey bee worker (on a buttercup) | 1 | 68 | 4 |
  | Pond | 1 | 52 | 3, and 9 parts that open a molecule |
  | Robin (on the boulder) | 1 | 130 | 4 |
  | Perennial ryegrass | 6 | 58 | 5 |
  | Soil under the turf | 1 | 55 | 5, and 11 parts that open a crystal or a molecule |

  A close-up scene is a tissue drawn cell by cell at its own scale (33 files in `data/things/tissues`, 32 reached from a part). Many things also have cut-open views and layer modes.
- **The human body.** 122 anatomical parts in 11 systems, from BodyParts3D meshes, with 12 cut-open organ views (heart, brain, both lungs, both kidneys, both eyes, stomach, liver, pancreas, small intestine), automatic layer peeling, and 235 cards for the body, its tissues, cells and organelles.
- **Cells, DNA, molecules and crystals.** A cell, DNA and a base pair at true size; 250 molecules in 13 categories with 3D geometry; 17 crystal lattices; liquids and gases at molecular scale; 5 protein structures (data only, not drawn yet).
- **The atom.** All 118 elements, each with measured or sourced properties, isotopes and spectral lines, and an electron cloud drawn as up to 400,000 dots sampled from the probability density, in five historical and modern models (Dalton, Thomson, Rutherford, Bohr and the quantum picture), with single subshells, any n, l, m, and two-state superpositions.
- **The nucleus, proton and Standard Model view.** A nucleus for any number of protons and neutrons, the inside of a proton or neutron, and the Standard Model view with its 17 particles, 12 hadrons, decays and a mass axis, from the Particle Data Group's 2026 edition. 41 cards.
- **The phone teardown.** The phone in the hand of the person in the park opens into its parts, then a processor die, a CPU core, standard cells, a CMOS inverter, a FinFET and a silicon crystal. 54 teardown cards.
- **Question trails.** 15 trails with 100 stops in all, for example "What am I made of?", "Is a rock really solid?" and "What is inside a black hole?".
- **Topic cards.** 1,838 cards in `data/nodes`: 603 about the park's things, 422 biology, 399 electrical engineering, 235 human body, 179 atoms and particles. Certainty: 1,477 C1, 345 C2, 15 C3, 1 C4.
- **Knowledge map.** 309 topics with Basics, Deeper and Expert text, links to what each topic emerges from and what it explains, evidence, and 24 frontier entries (recent results and open tensions).
- **Figures.** 1,741 interactive figure specifications (plots, fields, phasors, differential-equation models, logic circuits, diagrams) in 19 files drawn by `js/viz.js`. They cover 1,432 of the 1,838 topic cards and 307 of the 309 knowledge cards.
- **Textbooks.** An index of 51 OpenStax textbooks (titles, chapter and section headings, 21,011 glossary terms); cards link to the sections that explain them. No textbook text is copied.
- **Tracks.** Electrical Engineering (19 sections, 399 steps) and Biology (21 sections, 545 steps).
- **Search.** 2,577 findable things, and 591 everyday-word entries with 2,937 phrases.
- **Labs.** Two are built: a Circuit Lab (schematic editor, DC, transient and AC solver, oscilloscope, Bode plotter, 37 presets) and a Semiconductor Device Lab (bands, doping, junctions, transistors, 41 presets). 301 topic cards name a lab, and 108 of them open one of these two.

## What is not done, or is approximate

- **Models, not scans.** The park's things are procedural models built from typical proportions and published measurements. Each card says so in a model note, and says which sizes are measured. The body meshes are simplified and merged from BodyParts3D, scaled to a 1.75 m adult. The lungs are a schematic outline around the airway trees in the data. Left lung, kidney and eye reuse the right-hand organ's marker positions, mirrored. Region names on the skin come from the model and are approximate.
- **Stand-ins.** The cosmic web, the cosmic microwave background colours, the Milky Way's arms and halo, the black hole's disc and orbits, and the shading of star surfaces are illustrations, labelled as such on screen. Star temperature, luminosity and radius are estimated from colour and brightness except for the few stars with measured values; temperatures of hot stars come out too low. The atom's electron cloud uses hydrogen-like shapes resized for each element from a non-relativistic calculation; relativity is left out. The proton is a cartoon. A fungal cell has no scene of its own and opens a generic animal cell, labelled as a stand-in. Element cards share generated Deeper and Expert text.
- **Places where zooming stops.** A part with no closer view says "No closer view has been built for this part yet: the model stops here". Body parts without a cut-open view open an illustration of the kind of tissue. The body stops at 1.5 mm and organ views at 5 percent of the organ's size. On a phone, organ views land too close to fit. The charger and the power grid are topics only, with no 3D scene. There is no protein renderer.
- **Search and cards.** 189 cards are placed at a generic place (the pond, a cell, DNA, the park) and search shows them as cards, not models. Search is English only. Some everyday-word equivalences in the alias table were not re-fetched from their sources.
- **Labs.** Thirteen planned labs (signals, logic and CPU, control, fields, math, code, networks, genetics, population, microscope, molecule, enzyme, ecosystem) are not built.
- **Performance is not measured on a GPU.** All development and testing used software rendering, so draw-call and triangle counts are exact but frame times are not representative. Nothing has been run on a real phone, only at phone size. The park view with the dog is the heaviest (884 thousand triangles, mostly fur). The first use of a cut view pauses while its shader compiles.
- **Review debt.** The prose and numbers have not had review by outside experts, and the `ext` links on cards have not been checked. Several generator scripts under `tools/` read download folders that are not in the repository, so they document how data was made but cannot be re-run from a clone.
- **Tests that need a browser** are not part of this repository. The checks that run with Node or Python alone are listed in [docs/CONTENT.md](docs/CONTENT.md).

## Run locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server works, from the repository root. The browser needs WebGL.

Loaded from CDNs at run time: three.js r128 (cdnjs), its post-processing examples (`Pass`, `CopyShader`, `LuminosityHighPassShader`, `UnrealBloomPass`, from jsDelivr), astronomy-engine 2.1.19 (jsDelivr) and the Source Serif 4 and IBM Plex Sans fonts (Google Fonts). Vendored in the repository: three-mesh-bvh 0.5.24 (`js/vendor/`, MIT). Everything else, including all data, is served from the repository. If three.js fails to load, the page says so. For offline use, route the CDN URLs to local copies; `docs/DEVELOPMENT.md` describes this.

The repository root is laid out to be served by GitHub Pages (`.nojekyll` is present); Pages has to be enabled in the repository settings.

## Repository layout

```
index.html           the page: panel, ruler, help, and the script load order
.nojekyll            tells GitHub Pages not to run Jekyll
css/                 styles
js/                  the engine, the scenes and the interface
data/                all content as data
assets/              textures and the attribution file
docs/                development guide, figure spec, content guide, build reports
tools/               scripts that made and check the data
```

`css/`: `app.css` (interface, design tokens, the panel), `atom.css`, `particles.css`, `things.css`, `trails.css`, `search.css`.

`js/` (files load in the order shown in `index.html`):

| file | role |
|---|---|
| `perf.js` | URL switches, always-on counters and the performance meter; loaded first |
| `engine.js` | nested real-scale frames, camera, zoom to cursor, picking, labels |
| `helpers.js` | shared drawing helpers: canvas textures, materials, point clouds |
| `content.js`, `content_extra.js` | cards for scene objects written as code (`INFO`) |
| `refs.js` | generated table of OpenStax section links |
| `engine_ui.js` | the panel, cards, library, scale ruler, tours, main loop, `startApp()` |
| `world_common.js` | adapter for older scene builders, plus the extension points `WORLD_EXT` and `EXT_LANDMARKS` |
| `levels_v2.js` | builders for molecules, DNA, the cell, the park's lawn and life, Earth textures, the solar system, galaxy, black hole and universe |
| `world_space.js` | the cosmos down to Earth and the Sun, using real data |
| `world_matter.js` | molecules, crystals, liquids, gases, plasma, micro scenes, landscapes and Greenwich |
| `viz.js` | the figure language and its renderer |
| `nodes.js` | the topic graph, the human body, organ views, tissues, processes, `goToNode` |
| `body_core.js` | how a click on the body is answered: pick rule, core sample, layer peeling |
| `teardown.js` | the phone and the chain down to a silicon crystal |
| `labs/host.js` | lab overlay and Tracks |
| `labs/circuit.js` | Circuit Lab and its solver |
| `labs/device.js` | Semiconductor Device Lab |
| `atom.js` | orbital mathematics, the dot-cloud renderer, the 118-element atom |
| `particles.js` | proton, nucleus and the Standard Model view |
| `things.js` | the park's things built from data, layer modes, cut-open views, tissue scenes |
| `trails.js` | the question-trail player |
| `search.js` | search: matching and ranking, and the field |
| `world_build.js` | assembles the frames and landmarks and sets the start view |
| `mesh_worker.js` | web worker that fetches and decodes anatomy and thing meshes |
| `vendor/three-mesh-bvh.js` | bounding-volume trees for fast picking (MIT) |

`data/`: `nodes/` (topic cards; `manifest.json` lists the files), `viz/` (figures), `trails/`, `tracks/`, `knowledge/` (knowledge map and frontier), `library/` (textbook index), `search/` (generated index and aliases), `things/` (park things, meshes and tissue scenes), `anatomy/` (body meshes), `atomic/` (isotopes, spectral lines, orbital sizes), `labs/` (lab presets), `stars/`, `proteins/`, and single files `elements.json`, `particles.json`, `particles_binding.json`, `molecules_all.json`, `crystals.json`, `galaxies.json` and `solar.json`.

`docs/`: `DEVELOPMENT.md` (architecture, picking, panel, performance), `VIZ_SPEC.md` (figure language), `CONTENT.md` (adding content), and `REPORT_*.md` (how each data set was made, with sources, checks and known gaps).

`tools/`: `anatomy` (body meshes), `astro` (stars, galaxies, solar system, textures), `atom` (elements, orbitals, orbital sizes), `bio_nodes`, `ee_nodes`, `nodes`, `knowledge` (card and library generators), `chem` (molecules, crystals, proteins), `particles` (Standard Model data), `things` (model toolkit, bake script, preview, content scripts), `trails` (validator and tests), `search` (index builder and tests), `viz` (figure validator and generators), `labtest` (lab solver tests). `tools/SPEC.md` is the original shared brief.

## Adding content without touching the engine

Most content is data. [docs/CONTENT.md](docs/CONTENT.md) explains, with a real example and the command that checks each, how to add a topic card, a figure, a question trail, a search alias, a park thing, and a molecule or crystal. How the engine works is in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Data sources and licences

Every third-party data set, texture and model is credited in [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md). In summary:

- **Anatomy** meshes are derived from BodyParts3D (DBCLS). The data is published under CC BY 4.0, and its original files carry CC BY-SA 2.1 Japan, so the derived meshes are distributed under share-alike terms.
- **Stars and constellations** come from the HYG database v4.1 (CC BY-SA 4.0) and Stellarium's modern sky culture (CC BY-SA 4.0).
- **Textures** are from Solar System Scope (CC BY 4.0); the Earth bump and water maps come from the three-globe package (MIT) and the Pluto and Charon maps from NASA New Horizons imagery.
- **Elements** use the `mendeleev` package (MIT); `data/atomic/sources.json` records the sources of the finer fields (NIST, NUBASE2020, CIAAW).
- **Molecules** are computed with RDKit (BSD-3-Clause). **Crystals** are built with ASE from published lattice parameters. **Proteins** are wwPDB entries (CC0).
- **Textbooks.** Titles, headings and glossary terms are indexed from OpenStax books (CC BY and CC BY-NC-SA 4.0); explanations here are original and link to openstax.org.
- **Software.** three-mesh-bvh (MIT, vendored) and astronomy-engine (MIT, loaded from a CDN).
- **Own text.** The knowledge map and the topic cards are original text. Solar System and galaxy tables are compiled from published reference values.
- **Particles.** The Standard Model data uses the Particle Data Group's 2026 review (CC BY 4.0); `tools/particles/SOURCES.md` lists every source. This is not yet in the attribution file.
