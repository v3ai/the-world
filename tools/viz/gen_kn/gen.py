import sys, json, os, glob
sys.path.insert(0, os.path.dirname(__file__))
import p1, p2, p3, p4, p5, p6, p7
from lib import S
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
nodes = json.load(open(root + '/data/knowledge/nodes.json'))
skip = set(json.load(open(root + '/data/viz/samples.json')))
def ids(o):
    if isinstance(o, dict):
        if isinstance(o.get('id'), str): skip.add(o['id'])
        for v in o.values(): ids(v)
    elif isinstance(o, list):
        for v in o: ids(v)
for f in glob.glob(root + '/data/nodes/*.json'): ids(json.load(open(f)))
todo = [x['id'] for x in nodes if x['id'] not in skip]
miss = [i for i in todo if i not in S]; extra = [i for i in S if i not in todo]
print('todo', len(todo), 'have', len(S), 'missing', miss, 'extra', extra)
COL = dict(accent='#6ee7ff', gold='#ffd166', pink='#ff8fb1', green='#9be37b', purple='#b388ff', orange='#ffa94d', red='#ff6b6b', blue='#5b9cff', white='#e8ecf5', dim='#98a2b8')
for sp in S.values():
    if sp['type'] == 'plot':
        for f in sp.get('fns', []):
            if f.get('color') in COL: f['color'] = COL[f['color']]
out = {i: S[i] for i in todo if i in S}
json.dump(out, open(root + '/data/viz/kn.json', 'w'), ensure_ascii=False, indent=1)
print('wrote', len(out), os.path.getsize(root + '/data/viz/kn.json'))
