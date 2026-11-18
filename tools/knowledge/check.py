import sys; sys.path.insert(0,'work/scripts_knowledge')
import importlib, kn, glob, os
for f in sorted(glob.glob('work/scripts_knowledge/kn/k*.py')):
    importlib.import_module('kn.'+os.path.basename(f)[:-3])
ids=[x['id'] for x in kn.N]; print(len(ids), len(set(ids)))
import collections
print([i for i,c in collections.Counter(ids).items() if c>1])
S=set(ids); bad=collections.defaultdict(list)
for x in kn.N:
    for l in x['emerges_from']+x['explains']:
        if l not in S: bad[l].append(x['id'])
print({k:v[:2] for k,v in sorted(bad.items())})
