# Writes the three tissue scenes of the fly agaric: data/things/tissues/mushroom_{gill,flesh,ecm}.json  (all lengths in micrometres).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/mushroom_tissues.py
import json, math, random
import tissue_material as TM
HALF = math.pi / 2
rnd = random.Random(5)
NAG = {'type': 'mol', 'mol': 'n_acetylglucosamine', 'name': 'N-acetylglucosamine, the unit of chitin'}
def pop(id, name, node, shape, size, color, items, deeper=None, opacity=1, priority=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'arrange': {'kind': 'list', 'items': items}}
    if deeper: p['deeper'] = deeper
    if priority: p['priority'] = priority
    return p
def it(x, y, z, rotY=0): return {'at': [round(x, 1), round(y, 1), round(z, 1)], **({'rotY': rotY} if rotY else {})}

# ---------------------------------------------------------------- gill cross-section
trama, sub, bas, ster, spo = [], [], [], [], []
for i in range(7):
    for k in range(3):
        trama.append(it(-24 + i * 8 + rnd.uniform(-1, 1), 0 + rnd.uniform(-10, 10), -16 + k * 16 + (i % 2) * 6))
rows = [-120 + 26 * j for j in range(10)]
for sgn in (1, -1):
    for j, y in enumerate(rows):
        for k in range(3):
            z = -18 + 18 * k + (j % 2) * 7
            sub.append(it(sgn * 38, y + 9, z)); sub.append(it(sgn * 38, y - 4, z + 5))
            by = y + (j % 2) * 3
            bas.append(it(sgn * 62, by, z))
            ster.append(it(sgn * 82.5, by, z, HALF))
            for sy, sz in ((-4, -4), (4, -4), (-4, 4), (4, 4)):
                spo.append(it(sgn * 91, by + sy * .8, z + sz * .8)) if (sy, sz) in ((-4, -4), (4, 4)) or True else None
gill = {
    'id': 'mushroom_gill', 'title': 'Inside a gill', 'node': 'fa_gill_inside',
    'blurb': 'A gill cut across. A core of threads in the middle, small supporting cells, and on each face a crowd of club-shaped spore-making cells with spores on their tips. Click a part.',
    'note': 'Spore size (about 11 micrometres long; the species range is 9 to 13 by 6.5 to 9) and thread width (2 to 10 micrometres) are published values. The sizes of the club-shaped cells, the thickness of each layer and the number and arrangement of all cells are illustrative; a real gill has vastly more basidia than shown, and the pattern of its core threads is not shown.',
    'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 620,
    'labels': [{'text': 'Core of threads (trama)', 'at': [-8, 105, 30], 'pop': 'trama'}, {'text': 'Supporting cells', 'at': [-42, -138, 30], 'pop': 'subhymenium'},
               {'text': 'Basidium: spore-making cell', 'at': [-62, 150, 30], 'pop': 'basidium'}, {'text': 'Spore (about 11 µm)', 'at': [96, 112, 30], 'pop': 'spore'}],
    'populations': [
        pop('trama', 'Thread in the core of the gill', 'fa_hypha', 'cylinder', [6, 250, 6], '#f4f0e4', trama, NAG),
        pop('subhymenium', 'Supporting cell (subhymenium)', 'fa_gill_inside', 'ellipsoid', [14, 14, 14], '#eadfc5', sub),
        pop('basidium', 'Basidium (spore-making cell)', 'fa_gill_inside', 'ellipsoid', [38, 11, 11], '#d9b97a', bas),
        pop('sterigma', 'Prong holding a spore', 'fa_gill_inside', 'tube_z', [2.5, 2.5, 8], '#c9a766', ster),
        pop('spore', 'Basidiospore', 'fa_spores', 'ellipsoid', [11, 7.5, 7.5], '#f6f3ec', spo),
    ]}
# ---------------------------------------------------------------- cap flesh
flesh, cut_h, sub_h = [], [], []
for i in range(150):
    flesh.append(it(rnd.uniform(-150, 150), rnd.uniform(-70, 50), rnd.uniform(-30, 30), rnd.uniform(0, 6.28)))
for r_, y in enumerate((74, 84)):
    for i in range(7): cut_h.append(it(-160 + i * 52 + (r_ * 24), y, rnd.uniform(-20, 20), HALF))
for r_, y in enumerate((60, 50)):
    for i in range(7): sub_h.append(it(-160 + i * 52 + (r_ * 18), y, rnd.uniform(-20, 20), HALF))
fl = {
    'id': 'mushroom_flesh', 'title': 'Inside the cap', 'node': 'fa_cap_flesh',
    'blurb': 'A slice through the cap: a red skin on top, a yellowish layer under it, and below that the white flesh, made of fungal threads. Click a thread.',
    'note': 'Thread width (2 to 10 micrometres) is the usual range for fungal hyphae in general; the threads are drawn about 6 micrometres wide. The number, direction and layout of the threads are illustrative, and real caps also contain other kinds of cell, such as swollen cells, which are not drawn; the skin layers are drawn thicker than real.',
    'bg': '#f3efe6', 'center': [0, 20, 0], 'D_um': 520,
    'labels': [{'text': 'Red skin (cuticle)', 'at': [-185, 92, 30], 'pop': 'cuticle'}, {'text': 'Yellowish layer', 'at': [-185, 56, 30], 'pop': 'subcuticle'}, {'text': 'Flesh: a mass of threads', 'at': [-185, -20, 30], 'pop': 'flesh'}],
    'populations': [
        pop('cuticle', 'Threads of the red skin (illustrative)', 'fa_cuticle', 'tube_z', [6, 6, 60], '#c8261b', cut_h),
        pop('subcuticle', 'Threads of the yellowish layer (illustrative)', 'fa_cuticle', 'tube_z', [6, 6, 60], '#e8c24a', sub_h),
        pop('flesh', 'Thread (hypha) of the flesh', 'fa_hypha', 'tube_z', [6, 6, 80], '#f4f0e4', flesh, NAG),
    ]}
# ---------------------------------------------------------------- mycorrhizal root tip, in section
ox, oy, oz, st = -250, -200, -45, (36, 46, 36)
cell_c = lambda i, m, k: (ox + st[0] * i + 15, oy + st[1] * m, oz + st[2] * k + 15)
cells = [it(*cell_c(i, m, k)) for m in range(5) for k in range(3) for i in range(9)]
hartig = []
for m in (3, 4):
    for k in range(3):
        for i in range(8):
            x, y, z = cell_c(i, m, k); hartig.append(it(x + 18, y, z))          # vertical thread in the gap to the right of a cell
        for i in range(9):
            x, y, z = cell_c(i, m, k); hartig.append(it(x, y + 23, z, HALF))      # horizontal thread in the gap above a cell
mantle = []
for r_, y in enumerate((12, 22, 32, 42)):
    for k in range(3):
        for i in range(6): mantle.append(it(-262 + i * 58 + (r_ % 2) * 28, y, -40 + k * 40 + rnd.uniform(-3, 3), HALF))
soilh = [it(-240 + i * 40 + rnd.uniform(-8, 8), 130 + rnd.uniform(-10, 10), rnd.uniform(-30, 30)) for i in range(9)]
soil = [it(-250 + i * 70 + rnd.uniform(-15, 15), 215 + rnd.uniform(-10, 20), rnd.uniform(-40, 40)) for i in range(5)]
sugar = [it(*[cell_c(i, 4, k)[0] + 9, cell_c(i, 4, k)[1] + 16, cell_c(i, 4, k)[2]]) for i, k in ((1, 0), (3, 1), (5, 2), (7, 0), (2, 2), (6, 1))]
phos = [it(-235 + i * 52, 68 + rnd.uniform(-6, 6), rnd.uniform(-35, 35)) for i in range(6)]
ecm = {
    'id': 'mushroom_ecm', 'title': 'A root tip and its fungal partner', 'node': 'fa_ecm',
    'blurb': 'The outer layers of a mycorrhizal root tip. Soil at the top, then the fungal sleeve (mantle), then the root cells with fungal threads in the gaps between them (Hartig net). Click a part.',
    'note': 'Real values: a fungal thread is about 5 micrometres wide (range 2 to 10). The sleeve (mantle) is drawn as four rows of threads; its real thickness varies with the fungus and the tree. Everything else is illustrative: root cell size and shape, the number of cells, the depth of the net, the position of the sugar and phosphate particles, and the size of those particles (drawn far too large). Real cells are not boxes.',
    'bg': '#f3efe6', 'center': [-88, 20, 0], 'D_um': 700,
    'labels': [{'text': 'Thread in the soil', 'at': [-230, 190, 50], 'pop': 'soil_hypha'}, {'text': 'Mantle: the fungal sleeve', 'at': [-290, 70, 55], 'pop': 'mantle'},
               {'text': 'Hartig net: threads between root cells', 'at': [-290, -20, 55], 'pop': 'hartig'}, {'text': 'Root cell', 'at': [-290, -140, 55], 'pop': 'root_cell'},
               {'text': 'Sugar from the tree (illustrative)', 'at': [10, -10, 55], 'pop': 'sugar'}, {'text': 'Phosphate to the tree (illustrative)', 'at': [-20, 90, 55], 'pop': 'phosphate'}],
    'populations': [
        pop('root_cell', 'Root cell (tree)', 'oak_roots', 'rbox', [30, 40, 30], '#d6c28f', cells, {'type': 'cell'}),
        pop('hartig', 'Hartig net: fungal thread between root cells', 'fa_hartig', 'cylinder', [5, 46, 5], '#efe1b8', [h for h in hartig if 'rotY' not in h]),
        pop('hartig_h', 'Hartig net: fungal thread between root cells', 'fa_hartig', 'tube_z', [5, 5, 36], '#efe1b8', [h for h in hartig if 'rotY' in h]),
        pop('mantle', 'Mantle thread (fungal sleeve)', 'fa_mantle', 'tube_z', [8, 8, 60], '#e6d6a6', mantle),
        pop('soil_hypha', 'Thread in the soil', 'fa_mycelium', 'cylinder', [5, 150, 5], '#f6f3ea', soilh, NAG),
        pop('soil_grain', 'Soil particle', 'bio_soil_ecology', 'rbox', [48, 30, 40], '#8a6a48', soil),
        pop('sugar', 'Sugar from the tree (drawn as sucrose; fungi take up its glucose and fructose; illustrative)', 'fa_trade', 'ellipsoid', [9, 9, 9], '#e0a526', sugar, {'type': 'mol', 'mol': 'sucrose', 'name': 'Sucrose, the sugar a tree moves in its phloem'}),
        pop('phosphate', 'Phosphate going to the tree (illustrative)', 'fa_trade', 'ellipsoid', [9, 9, 9], '#4aa3df', phos, {'type': 'mol', 'mol': 'phosphate', 'name': 'Phosphate ion'}),
    ]}
for d in (gill, fl, ecm):
    json.dump(TM.apply(d), open(f"data/things/tissues/{d['id']}.json", 'w'), indent=1)
print({d['id']: sum(len(p['arrange']['items']) for p in d['populations']) for d in (gill, fl, ecm)})
