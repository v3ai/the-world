import sys, json, glob, importlib, os
sys.path.insert(0, os.path.dirname(__file__))
root = '.'
S = {}
for m in ['g_cardio', 'g_resp', 'g_nerv', 'g_cell', 'g_msk', 'g_organs', 'g_sys', 'g_fix']:
    try:
        mod = importlib.import_module(m)
    except ModuleNotFoundError as e:
        if e.name == m: continue
        raise
    S.update(mod.S)
ids = []
for f in sorted(glob.glob(root + '/data/nodes/body_*.json')):
    ids += [d['id'] for d in json.load(open(f))]
# paired nodes share specs
for a, b in [('lung_l', 'lung_r'), ('eye_l', 'eye_r'), ('kidney_l', 'kidney_r')]:
    if a in S and b not in S: S[b] = S[a]
    if b in S and a not in S: S[a] = S[b]
for side in ['clavicle', 'scapula', 'humerus', 'radius_ulna', 'hand_bones', 'femur', 'patella', 'tibia_fibula', 'foot_bones']:
    if side + '_l' in S and side + '_r' not in S: S[side + '_r'] = S[side + '_l']
out = {i: S[i] for i in ids if i in S}
extra = [k for k in S if k not in ids and k not in ('_',)]
missing = [i for i in ids if i not in S]
json.dump(out, open(root + '/data/viz/body.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('nodes', len(ids), 'covered', len(out), 'missing', len(missing), 'extra', extra)
if missing: print('MISSING', missing)

# ---- layout checker for blocks ----
W = 330
def chk(k, sp):
    if sp.get('type') != 'blocks': return
    H = W * sp.get('aspect', 0.62)
    R = []
    for n in sp['nodes']:
        lab = n.get('label', n['id'])
        w = 5.9 * len(lab) / 2 + 10 if n.get('shape') not in ('circle', 'sum') else 15
        x = 28 + n['x'] * (W - 56) / 100; y = 28 + n['y'] * (H - 56) / 100
        hh = 14
        R.append((n['id'], lab, x - w, x + w, y - hh, y + hh))
    for i, a in enumerate(R):
        if a[2] < 0 or a[3] > W: print('BOUNDS', k, a[1])
        for b in R[i + 1:]:
            if a[2] < b[3] + 8 and b[2] < a[3] + 8 and a[4] < b[5] + 4 and b[4] < a[5] + 4: print('OVERLAP', k, a[1], '|', b[1])
for k, v in out.items(): chk(k, v)
