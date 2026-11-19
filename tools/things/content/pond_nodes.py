# Writes data/nodes/park_pond.json (the pond's cards) and data/viz/park_pond.json (their figures).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/pond_nodes.py
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pond_lib import NODES, FIGS
import pond_cards_a, pond_cards_b, pond_cards_c, pond_cards_d, pond_fix
ids = [n['id'] for n in NODES]; assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
for n in NODES:
    for k in ('parents', 'parts'):
        pass
json.dump(NODES, open('data/nodes/park_pond.json', 'w'), indent=1, ensure_ascii=False)
json.dump(FIGS, open('data/viz/park_pond.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'cards,', len(FIGS), 'figures')
