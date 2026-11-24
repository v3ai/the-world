"""The region of the body each vertex of her skin belongs to (head, neck, torso, upper arm, forearm, hand, thigh, knee, lower leg, foot),
for the name of a clicked spot ("Skin, left forearm"). The man's regions come from his nearest bone; her model has no skull, arm, hand or
foot bones, so hers are set here by rule from her own skin and skeleton (imported by build_f.py; written to index.json as 'regions'):
- the arms: in each 2 cm band of height above 70 cm, her arms hang apart from her trunk; the widest gap in |x| between 10 and 42 cm from the midline (a median over five bands)
  is the edge of the trunk. Above her armpit (no gap) the edge stays where it was at the highest band with one: the shoulder is the arm's.
  Along the arm: the hand below her wrist, the forearm up to her elbow (heights measured on her skin's outline, below);
- the head above the top of her cervical spine, and in front of it down to 3 cm below her teeth; the neck down to the top of her thoracic spine;
- the legs from the nearest of her leg bones (femur, patella, tibia, fibula) against her hip bones and spine, the foot below her tibia.
The torso's bands (chest, abdomen, back ...) are named in the app (js/body_core.js) from the heights given here."""
import numpy as np
from scipy.spatial import cKDTree

SEG = {'H': 'head', 'N': 'neck', 'T': 'torso', 'U': 'upper arm', 'F': 'forearm', 'A': 'hand', 'G': 'thigh', 'K': 'knee', 'L': 'lower leg', 'P': 'foot'}


def regions(by):
    S = by['skin']['v']; ax = np.abs(S[:, 0]); y = S[:, 1]
    code = np.full(len(S), 'T', dtype='<U1')
    # legs, by the nearest bone
    bones = [('G', 'femur_l'), ('G', 'femur_r'), ('K', 'patella_l'), ('K', 'patella_r'), ('L', 'tibia_l'), ('L', 'tibia_r'), ('L', 'fibula_l'), ('L', 'fibula_r'),
             ('T', 'hip_bone_l'), ('T', 'hip_bone_r'), ('T', 'sacrum'), ('T', 'coccyx'), ('T', 'lumbar_spine'), ('T', 'thoracic_spine'), ('T', 'sternum')]
    P = np.vstack([by[b]['v'] for c, b in bones]); C = np.concatenate([[c] * len(by[b]['v']) for c, b in bones])
    _, ix = cKDTree(P).query(S); code[:] = C[ix]
    tib = min(by['tibia_l']['v'][:, 1].min(), by['tibia_r']['v'][:, 1].min())
    code[(y < tib + .01)] = 'P'
    # arms, by the gap between arm and trunk in each band
    edge = np.full(len(S), np.inf); ys = np.arange(.70, 1.5, .02); E = {}
    for y0 in ys:
        a = np.sort(ax[(y >= y0) & (y < y0 + .02)]); a = a[(a > .1) & (a < .42)]
        if len(a) < 4: continue
        g = np.diff(a); k = int(np.argmax(g))
        if g[k] > .02: E[round(y0, 2)] = (a[k] + a[k + 1]) / 2
    ks = sorted(E); med = {k: float(np.median([E[j] for j in ks if abs(j - k) < .05])) for k in ks}   # a median over five bands: one band's stray gap does not count
    top = max(ks)
    for y0 in ys:
        k = round(y0, 2)
        if k < ks[0]: continue
        if k <= top:   # a band without a gap of its own between two with one: the edge between theirs
            lo = max(j for j in ks if j <= k); hi = min(j for j in ks if j >= k); e = med[lo] if lo == hi else med[lo] + (med[hi] - med[lo]) * (k - lo) / (hi - lo)
        elif k < top + .14: e = med[top]   # the shoulder: up to 14 cm above the armpit
        else: continue
        edge[(y >= y0) & (y < y0 + .02)] = e
    arm = ax > edge
    # along the arm: the wrist and the elbow are where the arm's outline is narrowest and where it bends (measured on her skin)
    wrist, elbow = .905, 1.075
    code[arm & (y >= elbow)] = 'U'; code[arm & (y >= wrist) & (y < elbow)] = 'F'; code[arm & (y < wrist)] = 'A'
    # head and neck
    c1 = by['cervical_spine']['v'][:, 1].max(); t1 = by['thoracic_spine']['v'][:, 1].max(); teeth = by['teeth']['v'][:, 1].min()
    z = S[:, 2]; front = z > by['cervical_spine']['v'][:, 2].max()
    nonarm = ~arm
    code[nonarm & (y < c1) & (y >= t1)] = 'N'
    code[nonarm & ((y >= c1) | (front & (y >= teeth - .03)))] = 'H'
    out = {'codes': ''.join(code), 'segs': SEG, 'wrist': wrist, 'elbow': elbow, 'armpit': round(float(top), 3)}
    # the torso's bands: the costal margin from the tip of her breastbone at the midline sloping to the lowest point of the front of her
    # lungs at the side (she has no ribs in the model: the lungs' base stands in for the lowest rib); her back from her spine
    st = by['sternum']['v']; L = np.vstack([by['lung_l']['v'], by['lung_r']['v']]); fr = L[L[:, 2] > np.percentile(L[:, 2], 50)]
    i = int(np.argmin(fr[:, 1]))
    hip = np.vstack([by['hip_bone_l']['v'], by['hip_bone_r']['v']])
    out.update({'xiphY': round(float(st[:, 1].min()), 4), 'lowY': round(float(fr[i, 1]), 4), 'lowX': round(float(max(abs(fr[i, 0]), .05)), 4),
                'thMinY': round(float(by['thoracic_spine']['v'][:, 1].min()), 4), 'luMinY': round(float(by['lumbar_spine']['v'][:, 1].min()), 4),
                'hipMinY': round(float(hip[:, 1].min()), 4), 'hipMaxY': round(float(hip[:, 1].max()), 4), 'shoulderY': round(float(t1 - .04), 4)})
    return out
