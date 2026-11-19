# Entry point for the robin cards and figures. Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/robin_nodes.py
# Writes data/nodes/park_bird.json (the robin's cards and the park-level card `park_bird`) and data/viz/park_robin.json; checks every link.
import json, glob, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import robin_lib
import robin_cards_a, robin_cards_b, robin_cards_c, robin_cards_d, robin_cards_e, robin_figs
import robin_fix_a, robin_fix_b, robin_fix_c
import re
from robin_lib import NODES, FIGS
TAG = re.compile(r'\s*\((?:WR|WBA|WFE|WFF|WPA|SYR|Wikipedia[^()]*|Bird anatomy|Bird feet and legs|Bird vision|Origin of birds|WFF; Bird flight)\)')
def _clean(o):
    if isinstance(o, str): return TAG.sub('', o)
    if isinstance(o, list): return [_clean(x) for x in o]
    if isinstance(o, dict): return {k: _clean(v) for k, v in o.items()}
    return o
NODES[:] = [_clean(n) for n in NODES]
for _k in list(FIGS): FIGS[_k] = _clean(FIGS[_k])
mine = {n['id'] for n in NODES}
other = set()
for f in glob.glob('data/nodes/*.json'):
    if f.endswith('park_bird.json'): continue
    d = json.load(open(f)); d = d.get('nodes', list(d.values())) if isinstance(d, dict) else d
    for n in d:
        if isinstance(n, dict) and 'id' in n: other.add(n['id'])
allids = mine | other
dups = [i for i in mine if sum(1 for n in NODES if n['id'] == i) > 1]
assert not dups, dups
bad = 0
for n in NODES:
    for k in ('related', 'parts', 'parents'):
        if k not in n: continue
        keep = []
        for i in n[k]:
            if i in allids or i == 'park_scene': keep.append(i)
            else: print('  dropped missing %s link %s on %s' % (k, i, n['id'])); bad += 1
        n[k] = keep
        if not keep: del n[k]
json.dump(NODES, open('data/nodes/park_bird.json', 'w'), indent=1, ensure_ascii=False)
# figures only for nodes that exist
figs = {k: v for k, v in FIGS.items() if k in mine}
json.dump(figs, open('data/viz/park_robin.json', 'w'), indent=1, ensure_ascii=False)
m = json.load(open('data/viz/manifest.json'))
if 'park_robin.json' not in m:
    m.insert(m.index('curated.json'), 'park_robin.json'); json.dump(m, open('data/viz/manifest.json', 'w'), indent=1)
# every node a part, hotspot or legend swatch of the thing points at must exist
t = json.load(open('data/things/robin/thing.json')); need = set([t['node']]) | {p['node'] for p in t['parts']} | {h['node'] for h in t['hotspots']}
for md in t['modes']:
    for it in (md.get('legend') or {}).get('items', []): need.add(it['node'])
miss = sorted(need - allids)
print('cards', len(NODES), 'figures', len(figs), 'links dropped', bad, 'thing nodes missing:', miss)
