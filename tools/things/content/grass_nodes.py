# Writes data/nodes/park_scene.json (keeps every existing card, replaces grass_* cards) and data/viz/park_grass.json.
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/grass_nodes.py
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from grass_lib import NODES, FIGS
import grass_cards_a, grass_cards_b, grass_cards_c, grass_park
ids = [n['id'] for n in NODES]; assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
old = json.load(open('data/nodes/park_scene.json'))
keep = [n for n in old if not (n['id'].startswith('grass_') or n['id'] == 'park_scene')]
json.dump(keep + NODES, open('data/nodes/park_scene.json', 'w'), indent=1, ensure_ascii=False)
json.dump(FIGS, open('data/viz/park_grass.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'cards,', len(FIGS), 'figures;', len(keep), 'existing cards kept')
