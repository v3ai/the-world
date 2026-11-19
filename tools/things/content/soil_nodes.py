# Writes data/nodes/park_soil.json (the soil's cards) and data/viz/park_soil.json (their figures).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/soil_nodes.py
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from soil_lib import *
import soil_cards_a, soil_cards_b, soil_cards_c, soil_cards_d

# the whole-ground card keeps its id (park_ground); its "parts" now lead into the block
N_GROUND = {
  "id": "park_ground", "title": "Ground and soil", "kind": "habitat", "template": "thing", "scale_m": 1, "area": "bio_ecology", "parents": ["park_scene"],
  "parts": ["soil_block", "soil_profile", "soil_formation", "soil_carbon", "soil_handful", "oak_roots", "oak_mycorrhiza"],
  "processes": [],
  "summary": "The ground is covered with grass over soil: a mixture of broken rock, dead plant material, water, air and living things. Zoom into the block of soil by the oak to see inside it.",
  "layers": {
    "basics": "Soil is not just dirt. It holds grains of rock, the remains of dead plants and animals, water, air and an enormous number of living things, from earthworms to microbes. Plant roots anchor in it and drink from it. In this park a block of soil 1.2 metres deep has been cut open beside an oak, so you can see its layers, its stones and roots, the fungal threads and the burrow of an earthworm, and the animals that live in it. Choose \"The soil under your feet\" in the list of parts to go there.",
    "deeper": "Soil grains clump together with the help of humus (dark decayed material), clay, plant roots and fungal threads, and the gaps between the clumps hold air and water. Fungi and bacteria break down dead matter and release nutrients that plants take up. Tree roots reach out through the soil with the help of fungal partners (mycorrhiza). Under the high ground of Greenwich Park lies a pebbly sand, the Blackheath pebble beds, with clays and chalk deeper below.",
    "expert": "The soil block is a model built from typical measurements: the rock below is what the geological survey describes for the Greenwich Park plateau, and the depths of the soil layers are typical, not measured. The park around it is a simplified scene, not a scan of a real place. Away from the block, zooming into the grass shows a simplified generic view of soil grains and organisms, not a sample of real soil."
  },
  "facts": [["Soil is about", "50 % solid, 50 % pores (typical)"], ["Block of soil", "1.5 m across, 1.2 m deep, by the oak"]],
  "certainty": "C1", "open_questions": [], "refs": [["BIO", "31.2", "31-2-the-soil"]], "ext": [{"title": "Soil (Wikipedia)", "url": "https://en.wikipedia.org/wiki/Soil"}]
}
ids = [n['id'] for n in NODES]; assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
json.dump(scrub([N_GROUND] + NODES), open('data/nodes/park_soil.json', 'w'), indent=1, ensure_ascii=False)
json.dump(scrub(FIGS), open('data/viz/park_soil.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES) + 1, 'cards,', len(FIGS), 'figures')
