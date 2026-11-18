import sys, json, os, glob
sys.path.insert(0, os.path.dirname(__file__))
import lib
from lib import S, NODES, _root as root
import importlib
for m in ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']:
    if os.path.exists(os.path.join(os.path.dirname(__file__), m + '.py')): importlib.import_module(m)
have = set()
for f in glob.glob(root + '/data/viz/*.json'):
    if f.endswith('manifest.json') or f.endswith('bio_b.json'): continue
    have |= set(json.load(open(f)))
todo = [i for i in NODES if i not in have]
miss = [i for i in todo if i not in S]; extra = [i for i in S if i not in todo]
print('todo', len(todo), 'have', len(S), 'missing', len(miss), 'extra', extra)
out = {i: S[i] for i in todo if i in S}
json.dump(out, open(root + '/data/viz/bio_b.json', 'w'), ensure_ascii=False, indent=1)
print('wrote', len(out), os.path.getsize(root + '/data/viz/bio_b.json'))

# ---- overlap lint for blocks ----
def lint():
    bad = 0
    for i, sp in out.items():
        if sp['type'] != 'blocks': continue
        W = 312; H = sp.get('aspect', .62) * W; r = {}
        for n in sp['nodes']:
            lab = n.get('label', n['id']) or ''
            w = 15 if n.get('shape') in ('circle', 'sum') else max(28, len(lab) * 5.9 / 2 + 10); h = 15 if n.get('shape') in ('circle', 'sum') else 14
            x = 28 + n['x'] / 100 * (W - 56); y = 28 + n['y'] / 100 * (H - 56)
            r[n['id']] = (x - w, x + w, y - h, y + h)
        ids = list(r); msgs = []
        for a in range(len(ids)):
            A = r[ids[a]]
            if A[0] < 0 or A[1] > W: msgs.append('clip ' + ids[a])
            for b in range(a + 1, len(ids)):
                B = r[ids[b]]
                if A[0] < B[1] and B[0] < A[1] and A[2] < B[3] and B[2] < A[3]: msgs.append('%s/%s' % (ids[a], ids[b]))
        if msgs: bad += 1; print('LINT', i, msgs)
    print('lint blocks issues:', bad)
lint()
