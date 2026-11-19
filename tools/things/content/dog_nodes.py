# Writes data/nodes/park_dog.json and data/viz/park_dog.json.  Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/dog_nodes.py
import json, os, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
import dog_lib
import dog_cards_a, dog_cards_b, dog_cards_c, dog_cards_d
import dog_pass2
import dog_pass3
NODES, FIGS = dog_lib.NODES, dog_lib.FIGS
ids = {n['id'] for n in NODES}
assert len(ids) == len(NODES), 'duplicate ids'
other = set()
for f in glob.glob('data/nodes/*.json'):
    if f.endswith('park_dog.json'): continue
    for n in json.load(open(f)):
        if isinstance(n, dict) and 'id' in n: other.add(n['id'])
bad = []
for n in NODES:
    for k in ('parents', 'parts', 'related'):
        for r in n.get(k, []):
            if r not in ids and r not in other: bad.append((n['id'], k, r))
if bad: print('UNRESOLVED LINKS', bad)
json.dump(NODES, open('data/nodes/park_dog.json', 'w'), indent=1, ensure_ascii=False)
json.dump(FIGS, open('data/viz/park_dog.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'nodes,', len(FIGS), 'figures')
