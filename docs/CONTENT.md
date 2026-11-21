# Adding content

Almost everything in The World is data. This guide says, for each kind of content, which files to edit, shows a real entry from the repository, and gives the command that checks it. How the engine works is in [DEVELOPMENT.md](DEVELOPMENT.md).

Run every command from the repository root. `node` is Node.js; the checks that need Python use `python3`. To see a change in the app, serve the repository (`python3 -m http.server 8000`) and open `http://localhost:8000`.

## Things to know first

- **Manifests list the files.** `data/nodes/manifest.json`, `data/viz/manifest.json`, `data/tracks/manifest.json` and `data/trails/manifest.json` name the files the app loads. A new file is not loaded until it is listed. For topic cards and figures a later file overrides an earlier one with the same id.
- **A broken file is skipped silently.** If a card file or a figure file is not valid JSON, the app loads nothing from it and shows no error. Always run the checks below.
- **Generated files are overwritten.** Most existing card and figure files are written by scripts in `tools/` (for example `tools/ee_nodes/run_all.sh` deletes `data/nodes/ee_*.json` before it rebuilds them). Put hand-written cards and figures in new files rather than editing a generated one, unless you also change its generator. In two places the committed data was corrected by hand after its generator last ran: re-running `tools/things/content/bee_nodes.py` changes two links in `data/nodes/park_bee.json`, and re-baking the bee (`node tools/things/bake.mjs bee`) replaces the revised blurb, model note and eleven part names in `data/things/bee/thing.json` with older wording (the older names drop caveats such as "22 drawn as a sample; a worker has about 100"). Check `git diff` after running a generator.
- **Tests that drive a browser** (`tools/trails/test_trails.py`, `tools/search/test_browser.py` and others) need a headless-browser harness that is not in this repository. The checks below run with Node or Python alone.

| to add | files | check |
|---|---|---|
| a topic card | `data/nodes/<file>.json`, `data/nodes/manifest.json` | the card check below, then `node tools/search/build.mjs` |
| a figure | `data/viz/<file>.json`, `data/viz/manifest.json` | `node tools/viz/validate.mjs data/viz/<file>.json` |
| a question trail | `data/trails/<id>.json`, `data/trails/manifest.json` | `node tools/trails/check_trails.mjs` |
| a search alias | `tools/search/aliases_src*.txt` | `node tools/search/build.mjs`, then `node tools/search/test_search.mjs` |
| a park thing | `tools/things/models/<id>.mjs`, `data/things/index.json`, cards | `node tools/things/bake.mjs <id>`, then the thing check below |
| an object outside the park | the same, with `in` in its placement; `data/descent/assign/<id>.json`, close-up scenes | the same, then `node tools/descent/check.mjs` |
| a molecule or crystal | `data/molecules_all.json`, `data/crystals.json` | the molecule check below |

## A topic card

**Files.** A card is one object in an array in a file in `data/nodes/`. Make a new file, for example `data/nodes/extra_my_topic.json`, containing an array, and add its name to the array in `data/nodes/manifest.json`. Do not start the name with `bio_`, `ee_`, `body_`, `park_` or `phys_`: generators and validators use those prefixes.

**Fields.** Required: `id`, `title`, `kind`, `summary`, `layers`, `facts`, `certainty`. The rest are optional.

| field | meaning |
|---|---|
| `id` | lower case with underscores, unique across all files |
| `title`, `summary` | the card's title and a one-sentence summary shown in bold at the top |
| `kind` | the word in the card's tag line: `concept`, `process`, `structure`, `law`, `technique`, `tool`, `field`, `organism`, `molecule` and others already in use |
| `template` | `concept` for ideas and techniques; other values (`anatomy`, `cell`, `micro`, `teardown`, `thing`, `process`) belong to the scenes that use them |
| `scale_m` | size in metres, or `null`; the tag line reads "about 2 m across" |
| `layers` | `{basics, deeper, expert}`: the same explanation at three depths, shown as tabs. A layer that is empty has no tab. Text may contain simple HTML such as `<sub>` |
| `facts` | `[[label, value], ...]`. Use units, and `≈` for typical values |
| `certainty` | `C1` settled, `C2` well supported with details still being refined, `C3` debated, `C4` speculative |
| `open_questions` | a list of strings: what is not known |
| `parents`, `parts`, `made_of`, `processes`, `related`, `needs` | ids of other cards: what this is part of, its parts, what it is made of, the process cards that explain how it works, cards to compare with, and prerequisites ("Builds on") |
| `refs` | textbook sections: `[book code, section number, page slug]`, for example `["BIO", "3.4", "3-4-proteins"]`. The code is the `c` field of a book in `data/library/books.json` (`BIO` Biology 2e, `ANP` Anatomy and Physiology 2e, `CHE` Chemistry 2e, `UP1` to `UP3` University Physics, and others). Take the section number and slug from that file. A section number that is not in the book silently links to the chapter's first page |
| `ext` | further reading: `[{title, url}, ...]` |
| `kn` | ids of knowledge-map topics in `data/knowledge/nodes.json` |
| `where` | where "Show where it is" and search take you: `mol:<molecule id>`, `crystal:<crystal id>`, `place:` followed by `park`, `human`, `skin`, `cell`, `dna`, `base_pair`, `atom`, `earth`, `leaf`, `pond`, `soil` or `air`, or the id of a card that already has a model |
| `lab` | `{id, preset}`: adds an "Open in the ..." button. Only `circuit` and `device` open a lab; other ids show "Planned" |
| `formula`, `did_you_know` | a formula line and a "Did you know?" note under Basics |
| `steps` | for a process card: `[{title, text, focus: [card ids]}]`, played one step at a time |

**Example**, `bio_protein_folding` in `data/nodes/bio_biochem.json` (with its figure in `data/viz/bio_a.json`):

```json
{
 "id": "bio_protein_folding",
 "title": "Protein folding",
 "kind": "process",
 "template": "concept",
 "scale_m": null,
 "area": "bio_biochem",
 "parents": ["bio_biochem"],
 "parts": [],
 "made_of": [],
 "processes": [],
 "related": ["bio_chaperones_proteostasis"],
 "mesh": null,
 "needs": ["bio_protein_structure", "bio_noncovalent_forces"],
 "summary": "How a chain finds its working shape.",
 "layers": {
  "basics": "A newly made chain folds into its native shape, often within seconds, guided by the amino-acid sequence.",
  "deeper": "Anfinsen showed that sequence alone can specify the fold in vitro. Chaperones help prevent aggregation in crowded cells.",
  "expert": "Levinthal's paradox: random search is impossible, so folding follows a funnel-shaped energy landscape. AlphaFold-class networks now predict many structures from sequence, though kinetics, dynamics and folding pathways remain less well solved."
 },
 "facts": [["Anfinsen experiment", "1960s, ribonuclease A"], ["AlphaFold database", "> 200 million predicted structures"]],
 "certainty": "C2",
 "open_questions": [
  "Predicting folding pathways and kinetics, not just final structures, remains open.",
  "How well structure predictors handle disordered regions, mutations and complexes is still being benchmarked."
 ],
 "refs": [["BIO", "3.4", "3-4-proteins"], ["ORG", "26.9", "26-9-protein-structure"]],
 "kn": ["protein_structure"],
 "where": "mol:aa_gly",
 "ext": [{"title": "Wikipedia: Protein folding", "url": "https://en.wikipedia.org/wiki/Protein_folding"}]
}
```

**Check.** There is no repository-wide card validator: the validators in `tools/bio_nodes/` and `tools/ee_nodes/` check only their own generated sets. This one checks every card in the manifest: required fields, unique ids, certainty values, that every id in `parents`, `parts`, `made_of`, `processes`, `related`, `needs` and `kn` exists, that every `refs` section exists in `books.json`, the shape of `ext` and `facts`, and that `where` names a real molecule or crystal.

```
node --input-type=module - <<'EOF'
import fs from 'fs';
const j = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const nodes = j('data/nodes/manifest.json').flatMap(f => j('data/nodes/' + f));
const ids = new Set(nodes.map(n => n.id)), kn = new Set(j('data/knowledge/nodes.json').map(k => k.id));
const mols = new Set(j('data/molecules_all.json').index.map(m => m.id)), cry = new Set(j('data/crystals.json').map(c => c.id));
const secs = new Set(j('data/library/books.json').flatMap(b => b.ch.flatMap(c => c[2].map(s => b.c + ' ' + s[0]))));
const bad = [], seen = new Set();
for (const n of nodes) {
  const e = m => bad.push(n.id + ': ' + m);
  if (seen.has(n.id)) e('duplicate id'); seen.add(n.id);
  for (const k of ['id', 'title', 'kind', 'summary', 'layers', 'facts', 'certainty']) if (n[k] === undefined) e('missing ' + k);
  if (!/^C[1-4]$/.test(n.certainty)) e('certainty ' + n.certainty);
  if (!(n.layers && n.layers.basics)) e('no layers.basics');
  for (const k of ['parents', 'parts', 'made_of', 'processes', 'related', 'needs']) for (const i of n[k] || []) if (!ids.has(i)) e(k + ' -> unknown ' + i);
  for (const k of n.kn || []) if (!kn.has(k)) e('kn -> unknown ' + k);
  for (const r of n.refs || []) if (!secs.has(r[0] + ' ' + r[1])) e('ref not in books.json: ' + r.join(' '));
  for (const x of n.ext || []) if (!x.title || !/^https?:/.test(x.url)) e('bad ext entry');
  for (const f of n.facts || []) if (!Array.isArray(f) || f.length !== 2) e('fact is not [label, value]');
  const w = n.where;
  if (w && !/^place:/.test(w) && !(/^mol:/.test(w) ? mols.has(w.slice(4)) : /^crystal:/.test(w) ? cry.has(w.slice(8)) : true)) e('where -> unknown ' + w);
}
console.log(nodes.length + ' cards, ' + bad.length + ' problems'); bad.forEach(b => console.log('  ' + b)); process.exit(bad.length ? 1 : 0);
EOF
```

On the current data it prints `1838 cards, 2 problems`: the cards `teeth` and `tongue` list a knowledge-map id, `digestive_system`, that does not exist. Adding a made-up card with certainty `C9`, a missing `related` target and a section that is not in the book made it report all three.

After adding cards, rebuild the search index so they can be found (`node tools/search/build.mjs`, see "A search alias"). A new card is offered as a card, not as a model, until `tools/search/snapshot.py` is run against the running app (it needs a browser harness) to record what the app can fly to. Give the card a figure (next section) when a picture would help. For a process card, `tools/bio_nodes/validate.py` shows what a stricter set of rules looks like (2 to 5 facts per card); on the current data it exits 1, reporting two biology cards with a single fact (`bio_evolution_misconceptions` and `bio_plant_secondary_metabolites`). It also rewrites `tools/bio_nodes/validate_out.json`.

## A figure

**Files.** A figure file is an object mapping a card id to a figure spec. Add a new file such as `data/viz/extra_my_topic.json` and list it in `data/viz/manifest.json`. Files are loaded in manifest order and later ones override earlier ones, so `curated.json` comes last. The key is the id of a topic card or a knowledge-map card.

**Spec.** The full reference is [VIZ_SPEC.md](VIZ_SPEC.md): the figure types (`plot`, `parametric`, `field`, `ode`, `logic`, `blocks`, `geometry` and others), the expression language, sliders (`params`), live numbers (`readouts`) and a caption. Working examples of every type are in `data/viz/samples.json`. Keep a spec under about 2 KB and always give a caption that tells the reader what to try.

**Example**, the figure for the card above (`data/viz/bio_a.json`):

```json
{"bio_protein_folding": {"type":"plot","caption":"In urea a protein unfolds sharply, like a two-state switch. A more stable protein (bigger ΔG) needs more denaturant to reach the 50% midpoint.","x":[0,10],"y":[0,100],"fns":[{"f":"100/(1+exp(-(dG-m*x)/2.58))","label":"folded (%)","color":"#6ee7ff"}],"params":[{"id":"dG","label":"stability ΔG(H₂O)","min":10,"max":60,"value":30,"unit":"kJ/mol"},{"id":"m","label":"m-value","min":4,"max":12,"value":8,"unit":"kJ/mol/M"}],"readouts":[{"label":"midpoint Cm = ΔG/m","value":"dG/m","unit":"M urea"}],"xlabel":"urea (M)","ylabel":"folded protein (%)","vlines":[{"x":"dG/m","label":"midpoint"}]}}
```

**Check.** The validator loads `js/viz.js` in Node, then checks, for each spec, that the type is known, every expression parses and gives finite numbers, every slider has `min` and `max`, and the readouts evaluate at their defaults.

```
node tools/viz/validate.mjs data/viz/<file>.json
```

It exits 1 and lists the problems if any are found. Two cautions: with no file argument it checks nothing and prints `0 specs, 0 errors`; and `data/viz/manifest.json` is not a figure file, so a glob such as `data/viz/*.json` reports errors for it. To check everything:

```
node tools/viz/validate.mjs $(ls data/viz/*.json | grep -v manifest)
```

On the current data this prints `1741 specs, 0 errors`. The validator does not check that the key is a real card id. This does:

```
node -e "
const fs=require('fs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ids=new Set([...j('data/nodes/manifest.json').flatMap(f=>j('data/nodes/'+f)),...j('data/knowledge/nodes.json')].map(n=>n.id));
const bad=j('data/viz/manifest.json').flatMap(f=>Object.keys(j('data/viz/'+f))).filter(k=>!ids.has(k));
console.log(bad.length+' figure keys with no card'); bad.forEach(k=>console.log('  '+k));"
```

It prints `0 figure keys with no card` on the current data. To look at figures, serve the repository and open `tools/viz/viztest.html?file=<file>.json&from=0&n=24`, which draws 24 specs from a file in `data/viz/` at a time.

## A question trail

**Files.** One file per trail in `data/trails/<id>.json`, listed in the `files` array of `data/trails/manifest.json`. A trail is a question, five to nine stops, an answer in one or two sentences, what is still unknown, and two or three trails to go to next. The player is generic: no code is needed. The header comment of `js/trails.js` is the reference for stops (`where`, `do`, `expect`, `deeper`).

**Example**, the top level and the first stop of `data/trails/is_a_rock_really_solid.json`. The long texts and lists are shortened with "..." here; the file has them in full, and its other stops have the same fields.

```json
{
 "id": "is_a_rock_really_solid",
 "order": 34,
 "theme": "Forces and matter",
 "question": "Is a rock really solid?",
 "teaser": "Go from a boulder to its crystals and its atoms, to find out why you cannot push two atoms into one place.",
 "keywords": ["rock", "solid", "boulder", "..."],
 "scales": ["a boulder", "a nucleus"],
 "minutes": 6,
 "stops": [
  {
   "title": "A boulder",
   "scale": "about 1.5 m",
   "where": {"view": {"frame": "thing_boulder", "point": [0, 0.3, 0], "D": 3.2}},
   "do": [{"mode": "whole", "thing": "boulder"}],
   "expect": {"thing": "boulder"},
   "text": ["This boulder is modelled as granite, ... What does solid actually mean?"],
   "model": "A procedural model of a typical granite boulder, not a scan. Choosing granite is a modelling choice.",
   "notice": "Click the rock, the moss and the lichen. Each opens its own card.",
   "deeper": [{"label": "Boulder", "node": "boulder"}]
  }
 ],
 "answer": "A rock is solid because its atoms are bound into a rigid arrangement, ...",
 "unknown": "Nothing here is in doubt. ...",
 "next": ["what_holds_everything_together", "how_does_my_phone_think", "what_am_i_made_of"],
 "sources": ["Cards: boulder (...)", "..."]
}
```

Each stop has exactly one `where` out of `landmark`, `node`, `place`, `view`, `deep`, `sm` and `scene`, and says in `model` what on the screen is exact and what is a model. Set `"starter": true` on a trail to offer it on the first-visit help screen (three trails do).

**Check.**

```
node tools/trails/check_trails.mjs
```

It works without a browser and exits 1 on any error. It checks the schema, 5 to 9 stops, 2 or 3 existing `next` trails, every landmark label, card id, place key, molecule, crystal, frame, thing part, mode, tissue scene, element and Standard Model mode named, and warns about long text, a missing source and a question that does not end with "?". Landmark labels, frame keys and scene-object card ids that exist only at run time are read from `tools/trails/registry.json`, which `tools/trails/dump_registry.py` writes from the running app; a trail that uses a new one fails until the registry has it. On the current data it prints `15 trails, 100 stops` and `OK: no errors`. Add the trail to the search index afterwards (`node tools/search/build.mjs`); trails are search results.

`tools/trails/test_trails.py` (every stop in a browser) and `tools/trails/test_ui.py` (the player) need the browser harness.

## A search alias

**Files.** Everyday words are written in `tools/search/aliases_src.txt` and in any `tools/search/aliases_src_*.txt` file (the existing ones are for the body, devices, Earth and space, and extras). `tools/search/build.mjs` reads them all and writes `data/search/aliases.json` and `data/search/index.json`. Do not edit those two by hand.

**Line format**, documented at the top of `aliases_src.txt`:

```
phrase, phrase, ... => target, target, ... // note shown under the first result // hint: line shown above the results // near: target // src: source ids
```

A target is `mol:<id>`, `crystal:<id>`, `el:<Symbol>`, `node:<id>` (or a bare card id), `kn:<id>`, `lm:<landmark label>`, `pl:<name>`, `trail:<id>` or `lab:<lab>/<preset>`. List the best target first. Every line needs `src:` with ids from the `@src` lines at the top of the file. An alias must be true: a common name goes to what it really is, and `near:` marks a target that is only the nearest thing the explorer has (the result then says "Nearest model we have").

**Example**, from `aliases_src.txt`:

```
milk sugar, lactose => mol:lactose // Milk sugar is lactose: one glucose unit joined to one galactose unit. // src: pubchem
```

**Check.** Rebuild, then run the tests:

```
node tools/search/build.mjs
node tools/search/test_search.mjs
```

On the current data the build prints `entities 2577 {"el":118,"mol":250,"crystal":17,"node":1720,"kn":309,"lm":24,"pl":45,"act":1,"trail":15,"lab":78}` and `aliases 591 entries, 2937 phrases, pointing at 1056 distinct things; sources 16`, and the tests print `269 query tests + 7 checks: 276 passed, 0 failed`. A target that does not exist makes the build exit 1 with the line number (for example `unknown target "mol:nonexistent"`) and write nothing. Adding `milk powder => mol:lactose // src: pubchem` built cleanly, and `node tools/search/q.mjs "milk powder"` then ranked Lactose first. `q.mjs` takes any queries and prints the ranked results. To keep an alias from regressing, add a row `['phrase', 'mol:lactose']` to the list in `test_search.mjs`.

Other inputs: `tools/search/force_card.txt` lists cards that search should show as cards even though the app places them at a loosely related part; `tools/search/queries.txt` and `node tools/search/coverage.mjs` make a report of which everyday queries find a model, a card or nothing. `tools/search/test_browser.py` and `snapshot.py` need the browser harness.

## A park thing

**Files.** A thing is an organism or object built from data and drawn by generic code. [tools/things/SCHEMA.md](../tools/things/SCHEMA.md) is the reference; section 4 is the checklist and section 8 is a worked recipe. In outline:

1. Write a model script `tools/things/models/<id>.mjs`, copying `boulder.mjs` (the simplest) or a larger one. It exports the `thing` description (systems, layer modes, parts, a `model_note`) and a `build()` that makes the meshes with the toolkit in `tools/things/lib/`.
2. Bake it: `node tools/things/bake.mjs <id>` writes `data/things/<id>/thing.json`, `mesh.json` and `mesh.bin`, and prints triangles per part and any problems (it exits 1 if there are problems). Edit the model script, not `thing.json`.
3. Write one card per part in a card file (see "A topic card"). The existing things use a Python script in `tools/things/content/` for this, for example `python3 tools/things/content/oak_nodes.py`, which writes `data/nodes/park_tree.json` and its figures into `data/viz/park.json`.
4. Place it by adding an entry to `data/things/index.json`. Nothing else is needed for it to appear, be picked and have layer buttons.
5. Close-up scenes for what a part is made of are `data/things/tissues/<id>.json` (SCHEMA.md section 5), reached from a part's `deeper`.

**Example**, the boulder's entry in `data/things/index.json`, which puts two boulders in the park (`at` is `[x, z]` in metres from where the person stands, `rot` is degrees, `scale` is a multiplier):

```json
{"id": "boulder", "placements": [{"at": [-4.6, 3.4], "rot": 20, "scale": 1}, {"at": [9.5, 7.5], "rot": 200, "scale": 0.55}]}
```

and the boulder's first part in `data/things/boulder/thing.json`. `node` is the card it opens; `deeper` is the button for a closer view; `center`, `radius` and `tris` are written by the bake.

```json
{
 "id": "rock", "name": "Rock", "system": "rock", "node": "boulder", "color": "#7f7c75", "mesh": "rock",
 "lod": "near", "ink_w": 0.0012, "priority": 1.4,
 "deeper": {"type": "crystal", "id": "quartz", "D": 4e-9, "button": "See a crystal of quartz, one of its minerals"},
 "center": [-0.0046, 0.3129, -0.0099], "radius": 0.7969, "tris": 27500
}
```

**Checks.** Bake and run the toolkit tests:

```
node tools/things/bake.mjs boulder
node --test tools/things/test/
```

`bake` printed `boulder: 6 parts, 37559 unique triangles, mesh.bin 300 kB + mesh.json 2 kB on disk (301 kB), gzip 200 kB` and the toolkit tests printed `pass 21`, `fail 0`. Baking `boulder`, `oak`, `mushroom`, `flower`, `pond`, `grass`, `soil`, `dog` and `robin` again left the files unchanged; `bee` differs from the committed file (see "Things to know first"). `bake` only checks that a part names a card. This checks that every part and hotspot of every thing in `data/things/index.json` names a card that exists and that every tissue scene named by a `deeper` exists:

```
node --input-type=module - <<'EOF'
import fs from 'fs';
const j = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ids = new Set(j('data/nodes/manifest.json').flatMap(f => j('data/nodes/' + f)).map(n => n.id));
const tissues = new Set(fs.readdirSync('data/things/tissues').map(f => f.replace('.json', '')));
let bad = 0, parts = 0;
for (const t of j('data/things/index.json').things) {
  const d = j('data/things/' + t.id + '/thing.json');
  for (const p of d.parts) {
    parts++;
    if (!ids.has(p.node)) { bad++; console.log(t.id + '.' + p.id + ': no card ' + p.node); }
    if (p.deeper && p.deeper.type === 'tissue2' && !tissues.has(p.deeper.id)) { bad++; console.log(t.id + '.' + p.id + ': no tissue scene ' + p.deeper.id); }
  }
  for (const h of d.hotspots || []) if (!ids.has(h.node)) { bad++; console.log(t.id + ' hotspot ' + h.id + ': no card ' + h.node); }
}
console.log(parts + ' parts checked, ' + bad + ' problems'); process.exit(bad ? 1 : 0);
EOF
```

It prints `622 parts checked, 0 problems`. To see a thing, serve the repository and open `tools/things/preview.html?thing=<id>` (orbit, layers, detail tiers, click a part to see which card it names). A trail can name a thing's parts and modes, and `node tools/trails/check_trails.mjs` then checks them.

## An object that lives outside the park

A thing can stand anywhere, not only on the park's lawn: inside the phone, in the body or an organ view, at a latitude and longitude on the Earth, in orbit, in any fixed frame, or (when the world has no place for it yet) "floating" on a neutral ground with a scale bar. The model script, the bake and the cards are as for a park thing; only the placement differs. [tools/things/SCHEMA.md](../tools/things/SCHEMA.md) section 10 lists the places and their fields and gives the full recipe.

**Example**, the lithium-ion cell that takes the place of the phone's battery block (`data/things/index.json`):

```json
{"id": "li_cell", "placements": [{"in": "phone", "part": "phone_battery"}]}
```

and three other placements, as they would be written (the first is how an object with no home yet is shown; the others are examples of the fields):

```json
{"in": "floating"}
{"in": "earth", "lat": 27.99, "lon": 86.93, "place": "Everest base camp", "biome": "rock", "at": [3, 2], "rot": 40}
{"in": "orbit", "alt_km": 400, "incl_deg": 51.6, "period_min": 92.9}
```

**Step by step** (the cell is the worked example: `tools/things/models/li_cell.mjs`, `tools/things/content/li_cell_content.py`):

1. Open sources for every number and material; put the numbers, with their sources, in one object at the top of the model script. A number no source gives is said to be the model's choice, in the script and in `model_note`.
2. Choose the place: the host and, inside a device, the part the object replaces. Write the model in the host's axes (for the phone: x across, y along the long edge, z out of the screen). If it has no home yet, use `floating`.
3. Write the model script and bake it (`node tools/things/bake.mjs <id>`). Layers are drawn at their true thickness; a view that pulls things apart says so in its legend. Give cut views a `view` so they open face on, and give the thing a far detail tier that looks like the block it replaces.
4. Declare motion as `flows` or `anim`, and say in the legend what a marker's size and speed do not mean.
5. Write the close-up scenes (`data/things/tissues/<id>.json`), the materials (`data/descent/materials.json`), any missing crystals (`data/crystals.json`, with the structure and its source in `notes`) and the assignment file (`data/descent/assign/<id>.json`, listed under `assign`). Every part must lead to atoms or to an honest `stop` sentence.
6. Write the cards and figures with a content script into `data/nodes/thing_<id>.json` and `data/viz/thing_<id>.json`, and list the two files in their manifests. Give the thing a card id of its own; if an older card already stands for it, name that card under `answers` in the thing, do not reuse its id (the search build refuses duplicate ids).
7. Add the placement to `data/things/index.json`, everyday words to `tools/search/aliases_src_things.txt`, and rebuild the search index.

**Checks.**

```
node tools/things/bake.mjs li_cell
python3 tools/things/content/li_cell_content.py
node tools/viz/validate.mjs data/viz/thing_li_cell.json
node tools/descent/check.mjs
node tools/search/build.mjs && node tools/search/test_search.mjs
```

The bake printed `li_cell: 25 parts, 2040 unique triangles`; the content script `18 cards, 5 figures, 3 scenes, 2 crystals, 10 materials written`; the figure check `5 specs, 0 errors`; the descent check `OK: every material resolves ...`. The thing check of the previous section also covers things outside the park (it reads `data/things/index.json`). In the app, `goToNode('li_cell')` flies there; `thLoadDef('boulder').then(d => thPlace('boulder', d, {in: 'floating'}, 9))` tries a placement from the console.

## A molecule or a crystal

**Files.** Molecules are in `data/molecules_all.json`, an object with two parts that must agree: `index`, a list of `{id, name, formula, category, file, mw}` used for the picker and search, and `mols`, an object keyed by id with the geometry. Crystals are in `data/crystals.json`, a list. The scripts in `tools/chem/` (`build_mols.py` with RDKit, `crystals.py` with ASE) made these from lists of SMILES strings and lattice parameters, but the step that merges the per-molecule files into `molecules_all.json` is not in the repository, so add an entry by editing the two files directly. Each entry is also a search result: rebuild the index with `node tools/search/build.mjs`.

**A molecule** has `id`, `name`, `formula`, `smiles`, `mw` (g/mol), `category` (one of the 13 in use: `gas`, `inorganic`, `organic`, `amino_acid`, `nucleotide`, `sugar`, `lipid`, `cofactor`, `pigment`, `hormone_neuro`, `drug`, `polymer`, `mineral_unit`), `atoms` (rows of `[element symbol, x, y, z, partial charge]`, positions in angstroms), `bonds` (rows of `[atom index, atom index, bond order]`), `notes` (one sentence) and `method` (how the geometry was obtained). Example, water, in `mols`:

```json
{"id":"water","name":"Water","formula":"H2O","smiles":"O","mw":18.015,"category":"gas","atoms":[["O",0,-0.391,0,-0.412],["H",0.757,0.196,0,0.206],["H",-0.757,0.196,0,0.206]],"bonds":[[0,1,1],[0,2,1]],"notes":"A bent polar molecule whose hydrogen bonds give liquid water its remarkable properties.","method":"experimental geometry"}
```

and its row in `index` (the `file` field is not read by the app):

```json
{"id":"water","name":"Water","formula":"H2O","category":"gas","file":"water.json","mw":18.015}
```

**A crystal** has `id`, `name`, `formula`, `lattice` (three vectors, in angstroms), `basis` (rows of `[element symbol, x, y, z]` in fractions of the lattice), `bond_cutoff` (angstroms; the distance below which two atoms are joined by a bond in the picture) and `notes`. Example, `halite`:

```json
{"id":"halite","name":"Halite (rock salt)","formula":"NaCl","lattice":[[5.64,0,0],[0,5.64,0],[0,0,5.64]],"basis":[["Na",0,0,0],["Na",0,0.5,0.5],["Na",0.5,0,0.5],["Na",0.5,0.5,0],["Cl",0.5,0.5,0.5],["Cl",0.5,0,0],["Cl",0,0.5,0],["Cl",0,0,0.5]],"bond_cutoff":3,"notes":"Rock-salt structure: each ion sits in a cube-like octahedral cage of six neighbors of opposite charge; a = 5.64 A."}
```

**Check.** The scripts in `tools/chem/` expect download and output folders that are not in the repository, so this checks the files as they are: the two parts of `molecules_all.json` list the same ids, every atom's element exists in `data/elements.json`, every bond refers to two different atoms of the molecule with a positive order, and every crystal has three lattice vectors and well-formed basis rows.

```
node --input-type=module - <<'EOF'
import fs from 'fs';
const j = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const M = j('data/molecules_all.json'), crystals = j('data/crystals.json'), bad = [];
const EL = new Set(j('data/elements.json').map(e => e.symbol));
const idx = new Map(M.index.map(m => [m.id, m]));
if (idx.size !== M.index.length) bad.push('duplicate id in index');
for (const m of M.index) if (!M.mols[m.id]) bad.push(m.id + ': in index, not in mols');
for (const [id, m] of Object.entries(M.mols)) {
  if (!idx.has(id)) bad.push(id + ': in mols, not in index');
  if (m.id !== id) bad.push(id + ': id field is ' + m.id);
  for (const k of ['name', 'formula', 'category', 'atoms', 'bonds']) if (m[k] === undefined) bad.push(id + ': missing ' + k);
  const n = (m.atoms || []).length;
  for (const a of m.atoms || []) if (typeof a[0] !== 'string' || a.slice(1, 4).some(x => typeof x !== 'number')) bad.push(id + ': bad atom row'); else if (!EL.has(a[0])) bad.push(id + ': unknown element ' + a[0]);
  for (const [i, k, o] of m.bonds || []) if (!(i >= 0 && i < n && k >= 0 && k < n && i !== k && o > 0)) bad.push(id + ': bad bond ' + [i, k, o]);
}
const cs = new Set();
for (const c of crystals) {
  if (cs.has(c.id)) bad.push(c.id + ': duplicate crystal'); cs.add(c.id);
  for (const k of ['name', 'formula', 'lattice', 'basis']) if (c[k] === undefined) bad.push(c.id + ': missing ' + k);
  if (!(c.lattice && c.lattice.length === 3 && c.lattice.every(v => v.length === 3))) bad.push(c.id + ': lattice must be three vectors');
  for (const b of c.basis || []) if (typeof b[0] !== 'string' || b.length !== 4) bad.push(c.id + ': bad basis row'); else if (!EL.has(b[0])) bad.push(c.id + ': unknown element ' + b[0]);
}
console.log(M.index.length + ' molecules, ' + crystals.length + ' crystals, ' + bad.length + ' problems'); bad.forEach(b => console.log('  ' + b)); process.exit(bad.length ? 1 : 0);
EOF
```

It prints `250 molecules, 17 crystals, 0 problems`. The check does not test the chemistry. `tools/chem/check_mols.py` does compare bond lengths with RDKit, but it reads a `data/molecules/` folder that is not in the repository.

## Other checks that run without a browser

These were run on the current data. All exit 0 unless noted.

| command | result |
|---|---|
| `node tools/viz/validate.mjs $(ls data/viz/*.json \| grep -v manifest)` | `1741 specs, 0 errors` |
| `node tools/trails/check_trails.mjs` | `15 trails, 100 stops`, `OK: no errors` |
| `node tools/search/test_search.mjs` | `276 passed, 0 failed` |
| `node --test tools/things/test/` | 21 tests, 21 pass |
| `node tools/atom/test_orbitals.mjs` | `all 1068 checks passed` (about 20 s) |
| `python3 tools/atom/check_elements.py` | `elements checked: 118 \| anomalies: 20`, `all checks passed` |
| `python3 tools/particles/check_particles.py` | `OK: 17 particles, 12 hadrons, 31 decays balanced, 41 nodes, 41 figures, all references resolve` |
| `node tools/labtest/circuit_solver_test.mjs` | `67 passed, 0 failed` |
| `python3 tools/bio_nodes/validate.py` | exits 1: two biology cards have one fact where the rule is 2 to 5 |

Not usable from a clone: `tools/ee_nodes/validate.py` reads a syllabus file from `/mnt/user-data/`, and `tools/knowledge/check.py` and `tools/knowledge/build_nodes.py` read `work/scripts_knowledge/`, which does not exist (`check.py` then checks nothing and prints `0 0`). Knowledge-map cards (`data/knowledge/nodes.json`) have no working generator or validator in the repository; edit the file directly and keep the fields of an existing entry (`id`, `title`, `level`, `scale_m`, `certainty`, `domain`, `basics`, `deeper`, `expert`, `regime`, `emerges_from`, `explains`, `evidence`, `frontier`, `refs`, `sim`). The card check above reads this file only to confirm that `kn` links resolve.
