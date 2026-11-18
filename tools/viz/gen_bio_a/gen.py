import sys, json, os, glob, importlib
sys.path.insert(0, os.path.dirname(__file__))
mods = [m for m in sys.argv[1:]] or ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
for m in mods:
    if os.path.exists(os.path.join(os.path.dirname(__file__), m + '.py')): importlib.import_module(m)
from lib import S
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
skip = set()
for f in glob.glob(root + '/data/viz/*.json'):
    if not f.endswith('bio_a.json'): skip |= set(json.load(open(f)))
todo = []
for f in ['bio_hubs', 'bio_foundations_chem', 'bio_biochem', 'bio_cell', 'bio_molecular_genetics', 'bio_genomics_micro', 'bio_dev_part']:
    todo += [n['id'] for n in json.load(open(root + '/data/nodes/%s.json' % f)) if n['id'] not in skip]
miss = [i for i in todo if i not in S]; extra = [i for i in S if i not in todo]
print('todo', len(todo), 'have', len(S), 'missing', len(miss), 'extra', extra); open('/tmp/missing.txt','w').write(' '.join(miss))
COL = dict(accent='#6ee7ff', gold='#ffd166', pink='#ff8fb1', green='#9be37b', purple='#b388ff', orange='#ffa94d', red='#ff6b6b', blue='#5b9cff', white='#e8ecf5', dim='#98a2b8')
for sp in S.values():
    if sp['type'] == 'plot':
        for f in sp.get('fns', []):
            if f.get('color') in COL: f['color'] = COL[f['color']]
out = {i: S[i] for i in todo if i in S}
json.dump(out, open(root + '/data/viz/bio_a.json', 'w'), ensure_ascii=False, indent=1)
print('wrote', len(out), os.path.getsize(root + '/data/viz/bio_a.json'))
