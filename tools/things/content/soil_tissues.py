# Writes the soil's tissue-style scenes (data/things/tissues/soil_*.json).  Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/soil_tissues.py
# All lengths are micrometres.  Sizes with a source are named in the scene note (shown on screen); everything else is declared illustrative there.
import json, math, random
import tissue_material as TM
def pop(id, name, node, shape, size, color, arrange, opacity=1, ink=1, deeper=None, priority=3, rot=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': ink, 'priority': priority, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    if rot: p['rot'] = rot
    return p
lst = lambda *items: {'kind': 'list', 'items': [i if isinstance(i, dict) else {'at': i} for i in items]}
rnd = lambda n, mn, mx, seed, gap=3, exclude=None, orient=None: {'kind': 'random', 'n': n, 'min': mn, 'max': mx, 'gap': gap, 'seed': seed, **({'exclude': exclude} if exclude else {}), **({'orient': orient} if orient else {})}
mol = lambda m, name, button=None: {'type': 'mol', 'mol': m, 'name': name, 'button': button or 'See the molecule: ' + name.lower()}
def write(d):
    d = {'cell': 'plant', **d}
    json.dump(TM.apply(d), open('data/things/tissues/%s.json' % d['id'], 'w'), indent=1, ensure_ascii=False)

# ---------------------------------------------------------------- one soil crumb (a window about 2 mm wide)
SAND = [((-480, 110, 0), (650, 560, 600)), ((230, -260, 0), (420, 380, 400)), ((470, 290, 0), (500, 430, 450))]
ex = [{'min': [c[0] - s[0] / 2 - 6, c[1] - s[1] / 2 - 6, -400], 'max': [c[0] + s[0] / 2 + 6, c[1] + s[1] / 2 + 6, 400]} for c, s in SAND]
ex += [{'min': [-1000, -500, -400], 'max': [200, -440, 400]}]   # keep the strip with the nematode clear of silt
write({'id': 'soil_crumb', 'tag': 'Inside a soil crumb', 'title': 'Inside a soil crumb', 'node': 'soil_crumb',
  'blurb': 'A window about 2 mm wide into one crumb of topsoil: three sand grains, silt, clay flakes, dark humus coats, a water film, air pores, bacteria, a nematode, a fungal thread and a root hair, at their own sizes. Click anything.',
  'note': 'Drawn to scale: the sand grains (420 to 650 micrometres: medium and coarse sand, ISO 63 micrometres to 2 mm), the silt grains (about 14 to 40 micrometres, ISO 2 to 63), the clay flakes (1.8 micrometres, just under the ISO clay limit of 2), the bacteria (1.6 by 3.5 micrometres; real 0.5 to 5), the fungal thread (5 micrometres wide, real 4 to 6), the root hair (16 micrometres wide, real 15 to 17) and the nematode (800 micrometres long, real often under 2.5 mm). Illustrative: how many of each there are and where they sit (a real crumb holds far more bacteria and far fewer large things), the thickness of the water film and humus coats, the sizes of the pores and the width of the nematode. A real crumb is 4 to 9 mm across in the block; this is a window onto part of it.',
  'bg': '#efe9de', 'center': [0, 0, 0], 'D_um': 2200,
  'labels': [
    {'text': '500 µm', 'at': [-760, -640, 0], 'pop': 'scale'},
    {'text': 'Sand grain', 'at': [-480, 440, 0], 'pop': 'sand'},
    {'text': 'Humus coat', 'at': [-790, 70, 0], 'pop': 'humus'},
    {'text': 'Water film', 'at': [-120, -60, 0], 'pop': 'film'},
    {'text': 'Silt grains', 'at': [-60, 480, 0], 'pop': 'silt'},
    {'text': 'Air pore', 'at': [-20, 330, 0], 'pop': 'air'},
    {'text': 'Nematode (a microscopic worm)', 'at': [-450, -520, 0], 'pop': 'nematode'},
    {'text': 'Fungal thread', 'at': [630, -120, 0], 'pop': 'hypha'},
    {'text': 'Root hair', 'at': [700, 600, 0], 'pop': 'rhair'}],
  'populations': [
    pop('scale', 'Scale bar: 500 micrometres', 'soil_crumb', 'tube_x', [500, 8, 8], '#1e2a38', lst([-760, -600, 0]), 1, ink=0, deeper={'type': 'none'}),
    pop('humus', 'Humus coat', 'soil_humus', 'ellipsoid', [676, 586, 626], '#3b2a1c', lst(*[c for c, s in SAND[:1]]), .5, ink=0, deeper={'type': 'none'}, priority=1),
    pop('humus2', 'Humus coat', 'soil_humus', 'ellipsoid', [446, 406, 426], '#3b2a1c', lst(SAND[1][0]), .5, ink=0, deeper={'type': 'none'}, priority=1),
    pop('humus3', 'Humus coat', 'soil_humus', 'ellipsoid', [526, 456, 476], '#3b2a1c', lst(SAND[2][0]), .5, ink=0, deeper={'type': 'none'}, priority=1),
    pop('film', 'Water film', 'soil_water_film', 'ellipsoid', [740, 650, 690], '#74b4de', lst(SAND[0][0]), .22, ink=0, deeper=mol('water', 'Water', 'See a water molecule'), priority=1),
    pop('film2', 'Water film', 'soil_water_film', 'ellipsoid', [500, 460, 480], '#74b4de', lst(SAND[1][0]), .22, ink=0, deeper=mol('water', 'Water', 'See a water molecule'), priority=1),
    pop('sand', 'Sand grains (quartz)', 'soil_sand', 'ellipsoid', [650, 560, 600], '#d8c9a3', lst({'at': SAND[0][0], 'rot': [10, 20, 15]}), 1, deeper={'type': 'none'}),
    pop('sand2', 'Sand grains (quartz)', 'soil_sand', 'ellipsoid', [420, 380, 400], '#cdbb92', lst({'at': SAND[1][0], 'rot': [0, 30, -20]}), 1, deeper={'type': 'none'}),
    pop('sand3', 'Sand grains (quartz)', 'soil_sand', 'ellipsoid', [500, 430, 450], '#dccfab', lst({'at': SAND[2][0], 'rot': [20, 0, 40]}), 1, deeper={'type': 'none'}),
    pop('silt', 'Silt grains', 'soil_silt', 'ellipsoid', [30, 22, 26], '#a8936e', rnd(70, [-1000, -440, -60], [1000, 640, 60], 5, 3, ex, 'free'), 1, ink=0, deeper={'type': 'none'}, priority=2),
    pop('clay', 'Clay flakes', 'soil_clay', 'cylinder', [1.8, .25, 1.8], '#8a5a3a', rnd(500, [-1000, -440, -60], [1000, 640, 60], 9, .5, ex, 'free'), 1, ink=0, deeper=mol('silicate_orthosilicate', 'Silica tetrahedron', 'See the building block of the clay sheets: a silica tetrahedron'), priority=2),
    pop('air', 'Air pore', 'soil_air_pore', 'lens', [320, 180, 200], '#e9eff3', lst({'at': [-10, 330, -30], 'rot': [0, 0, 10]}, {'at': [-760, -250, -30], 'rot': [0, 0, -30]}, {'at': [860, -150, -30], 'rot': [0, 0, 70]}), .55, deeper=mol('carbon_dioxide', 'Carbon dioxide', 'See a molecule of the gas that soil life breathes out: carbon dioxide'), priority=2),
    pop('bacteria', 'Bacteria', 'soil_bacteria', 'cylinder', [1.6, 3.5, 1.6], '#6f7f4c', rnd(120, [-1000, -440, -60], [1000, 640, 60], 11, 1.5, ex, 'free'), 1, ink=0, deeper=mol('ammonium', 'Ammonium', 'See a molecule bacteria release from dead matter: ammonium'), priority=2),
    pop('nematode', 'A nematode (roundworm)', 'soil_nematode', 'tube_x', [800, 25, 25], '#e6d9c4', lst({'at': [-250, -520, 20], 'rot': [0, 0, 6]}), 1, deeper={'type': 'none'}),
    pop('hypha', 'A fungal thread (hypha)', 'soil_hyphae', 'tube_x', [700, 5, 5], '#f4f0e6', lst({'at': [560, 20, 10], 'rot': [0, 0, 62]}, {'at': [-130, 10, 10], 'rot': [0, 0, -10]}), 1, deeper={'type': 'cell', 'cell': 'fungal'}),
    pop('rhair', 'A root hair', 'oak_root_hairs', 'tube_x', [900, 16, 16], '#d9c9a0', lst({'at': [650, 450, 10], 'rot': [0, 0, -18]}), 1, deeper={'type': 'cell', 'cell': 'plant', 'button': 'Look inside this cell (a root hair is one cell)'}),
  ]})

# ---------------------------------------------------------------- a clay particle and the ions it holds
rr = random.Random(41)
def ions_on(c, rot, size, n, kinds):
    th = rot * math.pi / 180; out = {k: [] for k in kinds}
    for i in range(n):
        k = rr.choice(kinds); u = rr.uniform(-.42, .42) * size[0]; v = rr.uniform(-.42, .42) * size[2]; side = rr.choice([-1, 1]); off = size[1] / 2 + rr.uniform(.1, .22)
        x, y = u, side * off
        out[k].append([round(c[0] + x * math.cos(th) - y * math.sin(th), 3), round(c[1] + x * math.sin(th) + y * math.cos(th), 3), round(v, 3)])
    return out
P = [((-1.4, 0.9, 0), 15, (1.8, .08, 1.7)), ((1.5, -0.7, 0), -20, (1.6, .08, 1.5)), ((-0.6, -2.0, 0), 5, (1.4, .08, 1.3))]
kinds = ['Ca', 'Mg', 'K', 'NH4']; ions = {k: [] for k in kinds}
for c, r, s in P:
    d = ions_on(c, r, s, 16, kinds)
    for k in kinds: ions[k] += d[k]
nitrate = []
for i in range(14):
    for _ in range(100):
        x, y = rr.uniform(-3.4, 3.4), rr.uniform(-2.6, 2.6)
        if all(math.hypot(x - c[0], y - c[1]) > 1.5 for c, r, s in P): nitrate.append([round(x, 3), round(y, 3), round(rr.uniform(-.6, .6), 3)]); break
col = {'Ca': '#4caf50', 'Mg': '#f09a20', 'K': '#9c4fc0', 'NH4': '#2a7fd4'}; nm = {'Ca': 'Calcium ion (Ca²⁺)', 'Mg': 'Magnesium ion (Mg²⁺)', 'K': 'Potassium ion (K⁺)', 'NH4': 'Ammonium ion (NH₄⁺)'}
sz = {'Ca': [.15] * 3, 'Mg': [.12] * 3, 'K': [.16] * 3, 'NH4': [.15] * 3}
pops = [pop('scale', 'Scale bar: 1 micrometre', 'soil_clay', 'tube_x', [1, .04, .04], '#1e2a38', lst([-3.2, -2.9, 0]), 1, ink=0, deeper={'type': 'none'})]
for i, (c, r, s) in enumerate(P):
    pops.append(pop('plate%d' % i, 'Clay plate', 'soil_clay', 'cylinder', list(s), '#a98462', lst({'at': list(c), 'rot': [0, 0, r]}), 1, deeper=mol('silicate_orthosilicate', 'Silica tetrahedron', 'See the building block of the clay sheets: a silica tetrahedron')))
for k in kinds:
    pops.append(pop('ion_' + k, nm[k], 'soil_cations', 'ellipsoid', sz[k], col[k], lst(*ions[k]), 1, ink=0, deeper=mol('ammonium', 'Ammonium', 'See the ammonium ion') if k == 'NH4' else {'type': 'none'}, priority=4))
pops.append(pop('nitrate', 'Nitrate ion (NO₃⁻)', 'soil_nitrate', 'ellipsoid', [.15, .15, .15], '#d6392f', lst(*nitrate), 1, ink=0, deeper=mol('nitrate', 'Nitrate', 'See the nitrate ion'), priority=4))
write({'id': 'soil_clay_ions', 'tag': 'On clay', 'title': 'A clay plate and the ions it holds', 'node': 'soil_cec',
  'blurb': 'Three flat clay plates, 1.4 to 1.8 micrometres across (inside the clay size range), in a box of soil water about 7 micrometres wide, with the positive nutrient ions held at their surfaces (calcium, magnesium, potassium, ammonium) and nitrate ions drifting free. Click an ion or a plate.',
  'note': 'Not to scale where it matters. The plates are drawn 1.4 to 1.8 micrometres wide, inside the ISO clay range of under 2 micrometres (some systems put the limit at 4), and 0.08 micrometres thick; real clay particles can be much smaller and thinner, and kaolinite plates are pseudohexagonal, drawn here as discs. The ions are drawn about 0.15 micrometres (150 nanometres) across, roughly 200 times larger than a real hydrated ion, which is a fraction of a nanometre, so that they can be seen at all. How many ions there are, and which kind sits where, is illustrative: a real plate holds enormously more ions than this. The nitrate ions (negative) are drawn away from the plates because the plates are negatively charged and repel them. Water molecules are not drawn.',
  'bg': '#eef2f2', 'center': [0, 0, 0], 'D_um': 8,
  'labels': [{'text': '1 µm', 'at': [-3.2, -3.15, 0], 'pop': 'scale'}, {'text': 'Clay plate', 'at': [-2.5, 2.0, 0], 'pop': 'plate0'}, {'text': 'Calcium', 'at': [-0.3, 1.7, 0], 'pop': 'ion_Ca'}, {'text': 'Ammonium', 'at': [2.4, 0.2, 0], 'pop': 'ion_NH4'}, {'text': 'Nitrate (free in the water)', 'at': [nitrate[0][0], nitrate[0][1] + .35, 0], 'pop': 'nitrate'}],
  'populations': pops})
print('soil tissue scenes written')
