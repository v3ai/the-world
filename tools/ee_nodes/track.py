"""Build data/tracks/ee.json from data/nodes/ee_*.json (order respects `needs`)."""
import json, os
from lib import ROOT, AREAS, AREA_IDS
ORDER = ['ee_hubs','ee_math','ee_physics','ee_programming','ee_circuits','ee_electronics','ee_digital','ee_architecture','ee_signals','ee_dsp',
         'ee_em','ee_devices','ee_control','ee_comm','ee_power','ee_labs','ee_electives','ee_teardown']
nodes = []
for f in ORDER:
    nodes += json.load(open(f'{ROOT}/data/nodes/{f}.json'))
by = {x['id']: x for x in nodes}
idx = {x['id']: i for i, x in enumerate(nodes)}
secdefs = [('Overview', ['electrical_engineering'])]
secs = [(t, a) for a, t in AREAS]
bucket = {}
for x in nodes:
    bucket.setdefault(x['area'], []).append(x['id'])
def order(ids, placed):
    ids = sorted(ids, key=lambda i: idx[i]); out = []; left = list(ids); s = set(ids)
    while left:
        for i in left:
            if all((d in placed) or (d not in s) for d in by[i]['needs']):
                out.append(i); placed.add(i); left.remove(i); break
        else:
            out += left; placed.update(left); break   # cycle inside section: validator will report
    return out
placed = set(); sections = []
sections.append({'title': 'Overview', 'nodes': order(bucket.get('electrical_engineering', []), placed)})
for aid, title in AREAS:
    ids = bucket.get(aid, [])
    hub = [aid]; rest = [i for i in ids if i != aid]
    placed.add(aid)
    sections.append({'title': title, 'area': aid, 'nodes': hub + order(rest, placed)})
sections.append({'title': 'Physical world: teardowns (smartphone, charger)', 'area': 'ee_teardown',
                 'nodes': order([i for i in bucket.get('ee_teardown', []) if by[i]['template'] == 'teardown'], placed)})
sections.append({'title': 'How things work (processes)', 'area': 'ee_processes', 'nodes': order(bucket.get('ee_processes', []), placed)})
track = {'id': 'ee', 'title': 'Electrical Engineering (undergraduate)',
         'description': 'A guided path through an undergraduate electrical-engineering curriculum: mathematics and physics, circuits and electronics, digital systems, signals, fields, control, communications, power and the major electives. Every concept links to what it is, how it works, and where it hides inside a smartphone.',
         'sections': sections}
os.makedirs(f'{ROOT}/data/tracks', exist_ok=True)
json.dump(track, open(f'{ROOT}/data/tracks/ee.json', 'w'), indent=1, ensure_ascii=False)
print('track sections', len(sections), 'nodes', sum(len(s['nodes']) for s in sections))
