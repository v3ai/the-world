#!/usr/bin/env python3
"""Build the woman's anatomy (data/anatomy_f/) from the Human Reference Atlas female set, as parts_f.tsv lists it.

    WORK=work/anatomy_f sh tools/anatomy/female/fetch.sh          # the three pinned source files, hash-checked
    python tools/anatomy/female/build_f.py --work work/anatomy_f   # writes data/anatomy_f/*.json
    node tools/anatomy/bake_ao.mjs data/anatomy_f                  # her ambient occlusion (ao.json), for the realistic look

What it does, per row of parts_f.tsv: takes the source meshes the row selects (by their path in the source's node tree), keeps those
on the row's side (by position: x of the mesh's centre against her midline), merges them, welds coincident vertices, reduces them to
the row's triangle target (quadric decimation, fast_simplification) and moves them into the app's frame. Nothing is scaled: the
atlas is in metres and already in the app's axes (+y up, +z her front, +x her left). The frame's origin is on the floor (her lowest
skin point is y = 0), on her midline (the mean x of her vertebrae) and in the middle of her skin front to back.
Written in the app's anatomy-v1 format (see data/anatomy/index.json), with two more fields per part: src (where the shape comes from)
and card (the node in data/nodes that explains it). Ids are written without the app's vhf_ prefix (index.json says which prefix).
Also written: the positions of the organ views' markers measured on her parts (index.json, hotspots) and a log of every source name
whose side disagrees with its position (build_f.log in WORK).
"""
import sys, os, re, json, argparse, collections
import numpy as np
import fast_simplification as fs

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)
from glb import GLB

ap = argparse.ArgumentParser()
ap.add_argument('--work', default='work/anatomy_f')
ap.add_argument('--out', default=os.path.join(ROOT, 'data/anatomy_f'))
args = ap.parse_args()
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); print(s); LOG.append(s)

# ---------- sources ----------
SRC = {'u': GLB(os.path.join(args.work, 'src/3d-vh-f-united.glb')).meshes(), 'p': GLB(os.path.join(args.work, 'src/3d-vh-f-pelvis.glb')).meshes()}
log('source meshes: united %d, pelvis %d' % (len(SRC['u']), len(SRC['p'])))
NODES = set()
for f in json.load(open(os.path.join(ROOT, 'data/nodes/manifest.json'))):
    for n in json.load(open(os.path.join(ROOT, 'data/nodes', f))): NODES.add(n['id'])
for f in os.listdir(os.path.join(ROOT, 'data/nodes')):   # cards written for her (listed in the manifest too, once added)
    if f.startswith('body_female'):
        for n in json.load(open(os.path.join(ROOT, 'data/nodes', f))): NODES.add(n['id'])

# her midline: the mean x of the vertebrae's centres (the skin's own middle is pulled by how the arms are held)
vx = [(v.min(0)[0] + v.max(0)[0]) / 2 for n, p, v, f in SRC['u'] if re.search(r'vertebra/(cervical|thoracic|lumbar)_vertebra_\d+$', p)]
MID = float(np.mean(vx)); log('midline x = %.4f m (from %d vertebrae)' % (MID, len(vx)))
SKIN = [v for n, p, v, f in SRC['u'] if p.endswith('integumentary_system/skin')][0]
Y0 = float(SKIN[:, 1].min()); CZ = float((SKIN[:, 2].min() + SKIN[:, 2].max()) / 2)
SHIFT = np.array([MID, Y0, CZ]); log('shift (subtracted, no scaling): %s; she stands %.3f m sole to crown' % (np.round(SHIFT, 4), SKIN[:, 1].max() - Y0))

def side_of(v, dead=.004):
    x = (v.min(0)[0] + v.max(0)[0]) / 2 - MID
    return 'L' if x > dead else 'R' if x < -dead else None
def named_side(name):
    n = name.lower()
    if re.search(r'(^|_)left(_|$)', n) or re.search(r'_l(_[a-z])?$', n): return 'L'
    if re.search(r'(^|_)right(_|$)', n) or re.search(r'_r(_[a-z])?$', n): return 'R'
    return None
# every source name that says a side, and whose counterpart (the same name with the other side) exists: are the two the right way
# round? (A name on an organ that lies off the midline, such as the right ventricle, can sit left of the midline and still be right.)
mism = []
for tag in 'up':
    pos = {p.split('/')[-1]: (v.min(0)[0] + v.max(0)[0]) / 2 - MID for n, p, v, f in SRC[tag]}
    for nm, x in pos.items():
        if named_side(nm) != 'L': continue
        for a, b in (('_L', '_R'), ('left', 'right')):
            other = nm[:-2] + '_R' if a == '_L' and nm.endswith('_L') else nm.replace('left', 'right') if a == 'left' and 'left' in nm else None
            if other and other in pos and x < pos[other]: mism.append('%s (x %+.0f mm) / %s (x %+.0f mm)' % (nm, x * 1e3, other, pos[other] * 1e3))
log('pairs named the wrong way round (left lies to her right of right), %d; sides are taken from position:\n  ' % len(set(mism)) + '\n  '.join(sorted(set(mism))))

# ---------- mesh helpers (as tools/anatomy/build.py) ----------
def merge(ms):
    vs, fs_, o = [], [], 0
    for v, f in ms: vs.append(v); fs_.append(f + o); o += len(v)
    return np.vstack(vs), np.vstack(fs_)
def compact(v, f):
    used = np.unique(f); m = -np.ones(len(v), np.int64); m[used] = np.arange(len(used)); return v[used], m[f]
def clean(v, f, tol=1e-5):
    key = np.round(v / tol).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True); inv = inv.reshape(-1)
    v2 = v[first]; f2 = inv[f]
    ok = (f2[:, 0] != f2[:, 1]) & (f2[:, 1] != f2[:, 2]) & (f2[:, 0] != f2[:, 2]); f2 = f2[ok]
    _, ui = np.unique(np.sort(f2, axis=1), axis=0, return_index=True); f2 = f2[np.sort(ui)]
    return compact(v2, f2)
def decimate(v, f, target):
    v, f = clean(v, f)
    if len(f) <= target: return v, f
    v2, f2 = fs.simplify(v.astype(np.float64), f.astype(np.int64), target_reduction=1 - target / len(f), agg=5)
    return compact(v2, f2)

def pretty(node):
    s = re.sub(r'_(L|R)$', '', node); s = s.replace('bronchopulmonary_segm', 'bronchopulmonary_segment').replace('segmennt', 'segment').replace('segmentent', 'segment')
    s = s.replace('_', ' ').strip()
    s = re.sub(r'\bsegment1$', 'segment (upper part)', s)
    return s[0].upper() + s[1:]

# ---------- the table ----------
rows = []
for line in open(os.path.join(HERE, 'parts_f.tsv')):
    if line.startswith('#') or not line.strip() or line.startswith('id\t'): continue
    c = line.rstrip('\n').split('\t'); assert len(c) == 12, line
    rows.append(dict(zip('id name system side match exclude file tris src card parent flags'.split(), c)))

PARTS = []
def card_for(card, sd):
    if sd and card + '_' + sd.lower() in NODES: return card + '_' + sd.lower()
    return card
def add(pid, name, system, side, sel, target, src, card, parent, whole):
    v, f = merge([(m[2], m[3]) for m in sel])
    v, f = decimate(v, f, target)
    v = v - SHIFT
    d = dict(id=pid, name=name, system=system, side=side, v=v, f=f, src=src, card=card, nodes=sorted(m[1].split('/')[-1] for m in sel))
    if parent: d['parent'] = parent
    if whole: d['whole'] = True
    PARTS.append(d)

for r in rows:
    meshes = SRC[r['file']]
    sel = [m for m in meshes if re.search(r['match'], m[1]) and not (r['exclude'] != '-' and re.search(r['exclude'], m[1]))]
    flags = r['flags'].split(',') if r['flags'] != '-' else []
    sides = ['L', 'R'] if r['side'] == 'LR' else [r['side'] if r['side'] != '-' else None]
    tris = [int(t) for t in r['tris'].split('/')]
    for k, sd in enumerate(sides):
        s2 = [m for m in sel if sd is None or side_of(m[2], 0) == sd]
        if not s2: log('NO MATCH', r['id'], sd); continue
        sx = '_' + sd.lower() if r['side'] == 'LR' else ''
        nm = r['name'].replace('{Side}', {'L': 'Left', 'R': 'Right'}.get(sd, '')).replace('{side}', {'L': 'left', 'R': 'right'}.get(sd, ''))
        parent = r['parent'] if r['parent'] != '-' else None
        if parent and r['side'] == 'LR': parent += sx
        card = card_for(r['card'], sd if r['side'] in ('LR', 'L', 'R') else None)
        if 'each' in flags:
            for m in s2:
                node = m[1].split('/')[-1]; base = re.sub(r'_(L|R)$', '', node).lower()
                pid = r['id'] + ('_' + sd.lower() if sd else '') + '_' + re.sub(r'[^a-z0-9]+', '_', base).strip('_')
                add(pid, pretty(node) + ({'L': ' (left lung)', 'R': ' (right lung)'}.get(sd, '') if r['system'] == 'respiratory' else ''), r['system'], sd, [m], tris[min(k, len(tris) - 1)], r['src'], card, parent, False)
        else:
            add(r['id'] + sx, nm, r['system'], sd, s2, tris[min(k, len(tris) - 1)], r['src'], card, parent, 'whole' in flags)

ids = [p['id'] for p in PARTS]; assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
by = {p['id']: p for p in PARTS}
cen = lambda pid: (by[pid]['v'].min(0) + by[pid]['v'].max(0)) / 2
# checks of the frame: her left is +x (heart's apex, left kidney, left breast), her front is +z (nipples in front of the spine)
assert cen('left_ventricle')[0] > cen('right_atrium')[0], 'heart: the left ventricle should lie to her left of the right atrium'
assert cen('kidney_l')[0] > 0 > cen('kidney_r')[0] and cen('breast_fat_l')[0] > 0 > cen('breast_fat_r')[0] and cen('ovary_l')[0] > 0 > cen('ovary_r')[0]
assert cen('nipple_areola_l')[2] > cen('thoracic_spine')[2] + .1, 'front is +z'
for p in PARTS:
    if p['side'] and not p.get('parent'):
        x = cen(p['id'])[0]; assert (x > 0) == (p['side'] == 'L'), (p['id'], x)
H = float(by['skin']['v'][:, 1].max()); log('height (sole to crown, reduced skin): %.4f m' % H)
tw = sum(len(p['f']) for p in PARTS if not p.get('parent')); td = sum(len(p['f']) for p in PARTS if p.get('parent'))
log('%d parts (%d whole-body, %d detail); triangles %d whole-body + %d detail = %d' % (len(PARTS), sum(1 for p in PARTS if not p.get('parent')), sum(1 for p in PARTS if p.get('parent')), tw, td, tw + td))

# ---------- the organ views' markers, measured on her parts ----------
# For an organ with a cut-open view, the app puts a marker for each hotspot node (data/nodes, hotspot.of) at an offset from the
# organ's centre (the mean of the centres of the organ's whole-body parts, as makeOrganFrames computes it). The man's offsets were
# set on his model; hers are measured here: the centre of the part that is that structure, or of the source node that is.
ORG = {'heart': ['heart'], 'brain': ['cerebrum_l', 'cerebrum_r'], 'eye_r': ['eyeball_r'], 'eye_l': ['eyeball_l'], 'kidney_r': ['kidney_r'], 'kidney_l': ['kidney_l'],
       'lung_r': ['lung_r'], 'lung_l': ['lung_l'], 'liver': ['liver'], 'pancreas': ['pancreas'], 'small_intestine': ['small_intestine'],
       'uterus': ['uterus'], 'breast': ['breast_fat_l']}
# her two cut-open views that the man has no counterpart of: which parts each shows (meshes: the organ itself, its detail parts if it
# has any; with: whole parts shown beside it). The breast view is of her left breast.
ORGAN_VIEWS = {'uterus': {'meshes': ['uterus'], 'with': ['cervix', 'uterine_tube_l', 'uterine_tube_r', 'ovary_l', 'ovary_r', 'broad_ligament', 'uterine_ligaments', 'vagina']},
               'breast': {'meshes': ['breast_fat_l'], 'with': ['breast_lobes_l', 'lactiferous_ducts_l', 'nipple_areola_l', 'breast_ligaments_l']}}
def ocen(o):
    cs = [(by[i]['v'].min(0) + by[i]['v'].max(0)) / 2 for i in ORG[o]]; return np.mean(cs, 0)
def node_cen(pat):
    ms = [m for m in SRC['u'] if re.search(pat, m[1])]
    if not ms: return None
    v = np.vstack([m[2] for m in ms]) - SHIFT; return (v.min(0) + v.max(0)) / 2
def near_point(pid, toward):   # the point of a part nearest a given point
    v = by[pid]['v']; return v[np.argmin(np.linalg.norm(v - toward, axis=1))]
HOT = {}
def hot(o, nid, P):
    if P is None: return
    HOT.setdefault(o, {})[nid] = [round(float(x), 4) for x in (np.asarray(P) - ocen(o))]
for nid in ['left_atrium', 'right_atrium', 'left_ventricle', 'right_ventricle', 'interventricular_septum', 'aortic_valve', 'pulmonary_valve', 'mitral_valve', 'tricuspid_valve']:
    hot('heart', nid, cen(nid))
hot('heart', 'coronary_arteries', near_point('coronary_arteries', ocen('heart') + np.array([0, 0, .1])))
svc = by['superior_vena_cava']['v']; svc_low = svc[np.argmin(svc[:, 1])]
hot('heart', 'sa_node', near_point('right_atrium', svc_low))   # the sinoatrial node lies in the right atrium's wall where the superior vena cava enters it
hot('heart', 'av_node', near_point('interventricular_septum', cen('right_atrium')))   # the atrioventricular node: at the base of the septum next to the right atrium (approximate)
for sd in 'lr':
    E = 'eye_' + sd
    for nid, pid in [('cornea', 'cornea'), ('iris', 'iris'), ('lens', 'lens'), ('vitreous_humor', 'vitreous_humor'), ('retina', 'retina')]:
        hot(E, nid, cen(pid + '_' + sd))
    hot(E, 'fovea', node_cen(r'eye_%s/retina_%s/fovea_%s$' % (sd.upper(), sd.upper(), sd.upper())))
    hot(E, 'optic_nerve', node_cen(r'eye_%s/retina_%s/optic_disc_%s$' % (sd.upper(), sd.upper(), sd.upper())))
for nid, pid in [('frontal_lobe', 'frontal_lobe_r'), ('parietal_lobe', 'parietal_lobe_r'), ('temporal_lobe', 'temporal_lobe_r'), ('occipital_lobe', 'occipital_lobe_r'),
                 ('cerebral_cortex', 'cingulate_insula_r'), ('hippocampus', 'hippocampus'), ('hypothalamus', 'hypothalamus'), ('corpus_callosum', 'corpus_callosum'),
                 ('thalamus', 'thalamus'), ('amygdala', 'amygdala'), ('basal_ganglia', 'basal_ganglia')]:
    hot('brain', nid, cen(pid))
hot('brain', 'pineal_gland', node_cen(r'Allen_pineal_body_.$'))   # the pineal body is in the Allen atlas; the pituitary gland is not (no marker for it in her brain)
for sd in 'lr':
    K = 'kidney_' + sd
    hot(K, 'renal_cortex', near_point('kidney_cortex_' + sd, ocen(K) + np.array([(1 if sd == 'l' else -1) * .1, 0, 0])))
    hot(K, 'renal_medulla', cen('renal_pyramids_' + sd)); hot(K, 'renal_pelvis', cen('renal_pelvis_' + sd))
hot('lung_r', 'bronchi', near_point('bronchi', ocen('lung_r')))
# the uterus view: the wall's layers on the front wall, the cervix, tubes, ovaries and ligaments at their own parts
hot('uterus', 'endometrium', cen('uterus_body')); hot('uterus', 'myometrium', near_point('uterus_wall_front', cen('uterus') + np.array([0, .02, .03])))
for nid, pid in [('cervix', 'cervix'), ('uterine_tubes', 'uterine_tube_l'), ('ovaries', 'ovary_l'), ('broad_ligament', 'broad_ligament'), ('vagina', 'vagina')]:
    hot('uterus', nid, cen(pid))
hot('uterus', 'ligaments_of_uterus', near_point('uterine_ligaments', cen('uterus') + np.array([.06, 0, .02])))
for nid, pid in [('mammary_lobes', 'breast_lobes_l'), ('lactiferous_ducts', 'lactiferous_ducts_l'), ('nipple_areola', 'nipple_areola_l'), ('suspensory_ligaments_breast', 'breast_ligaments_l')]:
    hot('breast', nid, cen(pid))
hot('breast', 'adipose_tissue', near_point('breast_fat_l', ocen('breast') + np.array([.05, .04, 0])))
log('markers measured on her parts: ' + ', '.join('%s %d' % (o, len(v)) for o, v in HOT.items()))

# ---------- the man's parts that her atlas does not have ----------
# Base ids of parts of the man's model (data/anatomy) with no counterpart in either source file: the app says so on their cards ("Not in
# her model"). Each is checked here against every node name of both files, so the claim stays true for the files this was built from.
ABSENT = {'skull': r'skull|cranium|frontal_bone|occipital_bone|parietal_bone|temporal_bone', 'mandible': r'(^|/)mandible', 'hyoid': r'hyoid', 'ribs': r'(^|_|/)ribs?(_|$)|costal_cartilage',
          'clavicle': r'clavic', 'scapula': r'scapul', 'humerus': r'humer', 'radius': r'(^|_|/)radius', 'ulna': r'ulna', 'hand_bones': r'carpal|metacarp|phalan',
          'foot_bones': r'tarsal|calcane|talus|metatars', 'pectoralis_major': r'pectoral', 'deltoid': r'deltoid', 'biceps_brachii': r'biceps', 'triceps_brachii': r'triceps',
          'trapezius': r'trapez', 'sternocleidomastoid': r'sternocleido', 'gluteus_maximus': r'glute', 'hamstrings': r'hamstring|semitend|semimemb|biceps_fem',
          'gastrocnemius': r'gastrocnem', 'forearm_muscles': r'flexor_carpi|extensor_carpi|brachiorad|pronator', 'back_muscles': r'erector|latissimus|multifid',
          'diaphragm': r'(^|/)diaphragm(_|$)', 'abdominal_muscles': r'abdominis|external_oblique|internal_oblique', 'esophagus': r'(^|/)(o)?esophagus', 'stomach': r'(^|/)stomach|pylor|cardia_of|fundus_of_stomach',
          'adrenal': r'adrenal|suprarenal_gland', 'pituitary': r'pituitar|hypophys'}
for b, rx in ABSENT.items():
    hit = [p for t in 'up' for n, p, v, f in SRC[t] if re.search(rx, p, re.I)]
    assert not hit, (b, hit[:3])
log('absent from her atlas (checked by name): ' + ', '.join(ABSENT))

# ---------- the regions of her skin (see regions_f.py) ----------
from regions_f import regions
REG = regions(by)
log('skin regions: ' + ', '.join('%s %d' % (v, REG['codes'].count(k)) for k, v in REG['segs'].items()) + '; armpit at %.2f m' % REG['armpit'])

# ---------- write data/anatomy_f ----------
OUT = args.out; os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.json') and f not in ('measured.json', 'ao.json'): os.remove(os.path.join(OUT, f))
SYS = [('integumentary', 'Integumentary (skin)', '#e6cdb9'), ('skeletal', 'Skeletal', '#efe6cf'), ('muscular', 'Muscular', '#b24a4a'),
       ('nervous', 'Nervous', '#f0cf45'), ('cardiovascular', 'Cardiovascular', '#c0392b'), ('respiratory', 'Respiratory', '#eaa3b2'),
       ('digestive', 'Digestive', '#d9a066'), ('urinary', 'Urinary', '#8e2f45'), ('reproductive', 'Reproductive', '#d98cb3'),
       ('lymphatic', 'Lymphatic / immune', '#5fa86b'), ('sensory', 'Sensory (eyes)', '#4f93c9')]
# atlas colours, as the man's (tools/anatomy/export.py), with hers added
COL = {'liver': '#7a3b2e', 'kidney_l': '#8b2e3a', 'kidney_r': '#8b2e3a', 'lung_l': '#eaa3b2', 'lung_r': '#eaa3b2', 'heart': '#b5303a', 'left_atrium': '#b5303a', 'right_atrium': '#b5303a',
       'left_ventricle': '#a02a34', 'right_ventricle': '#a02a34', 'interventricular_septum': '#a8323a', 'aortic_valve': '#e8d27a', 'pulmonary_valve': '#e8d27a', 'mitral_valve': '#e8d27a',
       'tricuspid_valve': '#e8d27a', 'papillary_muscles': '#c05a5a', 'gallbladder': '#6b8e23', 'spleen': '#7a2e5a', 'tongue': '#d9707a', 'bladder': '#e0b070',
       'cerebellum': '#d9a09a', 'brainstem': '#e0c070', 'trachea': '#9fb7d6', 'bronchi': '#9fb7d6', 'larynx': '#9fb7d6', 'thymus': '#5fa86b', 'teeth': '#fbf8ee',
       'intervertebral_discs': '#9fc4c8', 'pulmonary_trunk': '#5b7fb5', 'aorta': '#c0392b', 'coronary_arteries': '#c0392b', 'arteries_thorax': '#c0392b', 'arteries_abdomen': '#c0392b',
       'superior_vena_cava': '#2e5fa3', 'inferior_vena_cava': '#2e5fa3', 'veins_abdomen': '#2e5fa3', 'cardiac_veins': '#2e5fa3', 'pulmonary_vessels': '#8a6fb0', 'uterine_vessels': '#a0457a',
       'uterus': '#c9727a', 'cervix': '#d4949a', 'vagina': '#d4878f', 'broad_ligament': '#e6c3c8', 'uterine_ligaments': '#e8d8c8', 'uterovesical_pouch': '#e8c8cc',
       'biliary_tree': '#7f9f3a', 'omentum': '#f0d890', 'gums_palate': '#d98a8a', 'salivary_glands': '#d8b080', 'spinal_cord': '#f2c94c', 'optic_nerves': '#f2d76c',
       'knee_cartilage': '#bcd8e6', 'knee_ligaments': '#e8e2cc', 'coccyx': '#efe6cf', 'pancreas': '#e8c070', 'small_intestine': '#e8a878', 'colon': '#d89a68', 'rectum': '#d89a68', 'appendix': '#d89a68'}
PAT = [(r'^breast_fat', '#f2d38a'), (r'^breast_lobes', '#e8a8a0'), (r'^lactiferous', '#d98cb3'), (r'^nipple_areola', '#a8685a'), (r'^breast_ligaments', '#ece4d4'),
       (r'^uterus_', '#c9727a'), (r'^uterine_tube', '#e0a0b0'), (r'^ovary', '#e8c8b0'), (r'^cerebrum|_lobe_|^cingulate', '#e8b5b0'), (r'^cerebral_white', '#f4ece0'),
       (r'^(thalamus|basal_ganglia|hippocampus|amygdala|hypothalamus|corpus_callosum)', '#d8a0c0'), (r'^eyeball|^sclera', '#f4f4f4'), (r'^cornea', '#d8eef8'), (r'^iris', '#7a5a3a'),
       (r'^lens', '#e8e0b0'), (r'^retina', '#e89a7a'), (r'^choroid', '#7a3a3a'), (r'^ciliary', '#9a5a4a'), (r'^vitreous', '#e8f0f0'), (r'^ocular_vessels', '#c0392b'),
       (r'^lseg', '#eaa3b2'), (r'^lvseg', '#8a4535'), (r'^kidney_cortex', '#9a3a44'), (r'^renal_pyramids', '#6e2632'), (r'^renal_pelvis', '#e0c090'), (r'^kidney_capsule', '#8b2e3a'),
       (r'^ureter', '#e0b070'), (r'^rectus_femoris|^extraocular', '#b24a4a')]
def color_of(p):
    if p['id'] in COL: return COL[p['id']]
    for rx, c in PAT:
        if re.search(rx, p['id']): return c
    return dict((a, c) for a, _, c in SYS)[p['system']]
def r_(x, n): return round(float(x), n)
index = []; tot = 0; per = collections.OrderedDict()
for sysid, sname, scol in SYS:
    parts = []
    for p in PARTS:
        if p['system'] != sysid: continue
        v, f = p['v'], p['f']; mn, mx = v.min(0), v.max(0); off = (mn + mx) / 2
        half = np.maximum((mx - mn) / 2, 1e-6); scale = half / 32767
        q = np.round((v - off) / scale).astype(np.int64); assert abs(q).max() <= 32767
        center = (mn + mx) / 2; rad = float(np.linalg.norm(v - center, axis=1).max())
        d = {'id': p['id'], 'name': p['name'], 'system': sysid, 'side': p['side'], 'color': color_of(p), 'src': p['src'], 'card': p['card']}
        for k in ('parent', 'whole'):
            if p.get(k): d[k] = p[k]
        d.update({'center': [r_(c, 4) for c in center], 'radius': r_(rad, 4), 'tris': int(len(f)), 'pos': q.reshape(-1).tolist(),
                  'scale': [float('%.6g' % s) for s in scale], 'offset': [r_(o, 5) for o in off], 'idx': f.reshape(-1).astype(np.int64).tolist()})
        parts.append(d)
        e = {k: d[k] for k in ('id', 'name', 'system', 'side', 'color', 'src', 'card', 'center', 'radius', 'tris')}
        for k in ('parent', 'whole'):
            if k in d: e[k] = d[k]
        e['file'] = sysid + '.json'; index.append(e)
    s = json.dumps({'system': sysid, 'parts': parts}, separators=(',', ':'))
    open(os.path.join(OUT, sysid + '.json'), 'w').write(s); tot += len(s); per[sysid] = len(s)
idx = {'format': 'anatomy-v1', 'units': 'm', 'up': '+Y', 'front': '+Z', 'left': '+X', 'prefix': 'vhf_', 'height_m': round(H, 3),
       'decode': 'p = pos_int*scale + offset (per part, per axis); pos is flat int16 xyz; idx is flat uint32 triangles; compute normals in browser',
       'subject': {'who': 'woman', 'name': 'Visible Human Female', 'age': 59, 'recorded_height_m': 1.712,
                   'note': 'One woman: the U.S. National Library of Medicine Visible Human Female (59 years old; recorded height 171.2 cm), from the Human Reference Atlas 3D models of her frozen sections. Not scaled.'},
       'source': {'attribution': 'Woman: Visible Human Female (U.S. National Library of Medicine), 3D models by K. Browne and H. Schlehlein, Human Reference Atlas, 3D Reference Organ Set for Female v1.10 and Pelvis, Female v1.3 (CC BY 4.0, https://creativecommons.org/licenses/by/4.0/); brain from the Allen human brain reference atlas (Ding et al. 2016) as fitted by the HRA. Selected, merged, simplified, re-centred and recoloured for this site.',
                  'doi': ['https://doi.org/10.48539/HBM637.DWBM.744', 'https://doi.org/10.48539/HBM853.VCFM.778'], 'licence': 'CC BY 4.0',
                  'files': {'3d-vh-f-united.glb': '95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422', '3d-vh-f-pelvis.glb': '6ef3436e42b7203afcdfa075e57098e97c4e1aaaec08cfdacf6300ba3d5a551d'}},
       'frame': {'shift_m': [r_(x, 5) for x in SHIFT], 'scale': 1},
       'hotspots': HOT, 'organ_views': ORGAN_VIEWS, 'regions': REG, 'absent': sorted(ABSENT),
       'systems': [{'id': a, 'name': b, 'color': c, 'count': sum(1 for e in index if e['system'] == a), 'file': a + '.json'} for a, b, c in SYS],
       'parts': index}
open(os.path.join(OUT, 'index.json'), 'w').write(json.dumps(idx, separators=(',', ':')))
tot += os.path.getsize(os.path.join(OUT, 'index.json'))
log('written to %s: %s; total %.3f MB' % (OUT, ', '.join('%s %.0f kB' % (k, v / 1e3) for k, v in per.items()), tot / 1e6))
open(os.path.join(args.work, 'build_f.log'), 'w').write('\n'.join(LOG) + '\n')
