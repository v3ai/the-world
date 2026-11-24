# Writes data/things/tissues/dog_{skin,muscle,olfactory_epithelium,retina}.json.  Run from the repo root.
import json
import tissue_material as TM
def pop(id, name, node, shape, size, color, opacity, arrange, deeper=None, ink=1):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'arrange': arrange}
    if ink: p['ink'] = 1
    if deeper: p['deeper'] = deeper
    return p
L = lambda items: {'kind': 'list', 'items': items}
TAGS = {'dog_skin': 'Inside dog skin', 'dog_muscle': 'Inside a dog muscle', 'dog_olfactory_epithelium': 'Inside the smell lining', 'dog_retina': 'Inside the retina'}
def write(id, d):
    d['tag'] = TAGS[id]; d['cell'] = 'animal'
    json.dump(TM.apply(d), open(f'data/things/tissues/{id}.json', 'w'), indent=1); print(id, len(d['populations']), 'populations')
# ---------------- skin ----------------
xs = [-250, 0, 250]
write('dog_skin', {'id': 'dog_skin', 'title': 'Inside a dog\'s skin and coat', 'node': 'dog_skin_scene', 'bg': '#f3efe6', 'center': [0, 190, 0], 'D_um': 1100,
  'blurb': 'A slice through dog skin: a thin barrier layer on top, the thick dermis with three compound hair follicles, and fat below. Drag to turn it; click a layer, a hair or a gland.',
  'note': 'A schematic, not a micrograph. The order of the layers, the compound follicles (a thick guard hair with fine undercoat hairs through one opening) and the gland types are as described for dog skin; every size here is illustrative.',
  'labels': [{'text': 'Barrier layer (dead flattened cells with lipids)', 'at': [-440, 402, 40], 'pop': 'corneum'}, {'text': 'Living epidermis', 'at': [-440, 360, 40], 'pop': 'epi'}, {'text': 'Dermis', 'at': [-440, 250, 40], 'pop': 'dermis'}, {'text': 'Guard hair', 'at': [-262, 470, 20], 'pop': 'guard'}, {'text': 'Fine undercoat hairs', 'at': [-30, 440, 30], 'pop': 'under'}, {'text': 'Hair root (bulb)', 'at': [-300, -60, 40], 'pop': 'bulb'}, {'text': 'Oil gland', 'at': [60, 285, 30], 'pop': 'sebaceous'}, {'text': 'Sweat gland (apocrine type)', 'at': [-170, 125, 30], 'pop': 'apocrine'}, {'text': 'Fat cells', 'at': [-440, -60, 40], 'pop': 'fat'}],
  'populations': [
    pop('corneum', 'Barrier layer (stratum corneum)', 'dog_skin_epidermis', 'rbox', [900, 12, 80], '#e8d9a8', .95, L([{'at': [0, 402, 0]}]), {'type': 'mol', 'mol': 'cholesterol', 'name': 'Cholesterol, one of the lipids of the skin barrier'}),
    pop('epi', 'Living epidermal cell', 'dog_skin_epidermis', 'ellipsoid', [17, 10, 17], '#f0cbb8', .8, {'kind': 'grid', 'origin': [-440, 336, -34], 'n': [50, 5, 4], 'step': [17.5, 10.5, 18], 'jitter': .05}, {'type': 'cell'}),
    pop('dermis', 'Dermis', 'dog_skin_dermis', 'rbox', [900, 300, 80], '#e6b9a4', .42, L([{'at': [0, 180, 0]}])),
    pop('fat', 'Fat cell (adipocyte)', 'adipocyte', 'ellipsoid', [42, 40, 42], '#f5e6a0', .8, {'kind': 'random', 'n': 22, 'min': [-420, -140, -34], 'max': [420, 0, 34], 'gap': 2, 'seed': 4}),
    pop('guard', 'Guard hair', 'dog_fur', 'cylinder', [18, 520, 18], '#caa05a', .95, L([{'at': [x, 220, 0]} for x in xs])),
    pop('under', 'Undercoat hair', 'dog_follicle', 'cylinder', [7, 470, 7], '#e2c58a', .95, L([{'at': [x + dx, 200, dz]} for x in xs for dx, dz in [(-24, -10), (-12, 12), (14, -12), (26, 10), (4, 0)]])),
    pop('bulb', 'Hair root (follicle bulb)', 'dog_follicle', 'ellipsoid', [54, 70, 54], '#c98f78', .85, L([{'at': [x, -40, 0]} for x in xs])),
    pop('sebaceous', 'Oil (sebaceous) gland', 'dog_gland', 'ellipsoid', [46, 56, 46], '#f2d98a', .9, L([{'at': [x + 52, 250, 14]} for x in xs])),
    pop('apocrine', 'Sweat gland (apocrine type)', 'dog_gland', 'ellipsoid', [40, 62, 40], '#a8c7e0', .9, L([{'at': [x - 54, 140, -14]} for x in xs]))]})
# ---------------- muscle ----------------
fib = [(-151.5 + 50 * i, -100 + 50 * j) for i in range(8) for j in range(5)]
caps = [(-126.5, -75), (-26.5, -25), (73.5, -75), (123.5, 25), (-76.5, 75), (23.5, 25)]
write('dog_muscle', {'id': 'dog_muscle', 'title': 'Inside a dog muscle', 'node': 'dog_muscle_scene', 'bg': '#f3efe6', 'center': [0, 25, 0], 'D_um': 600,
  'blurb': 'Muscle fibres seen end-on in a small bundle: each circle is one long cell about 47 micrometres across. Click a fibre or the nerve ending.',
  'note': 'The fibre width is drawn from the mean fibre cross-section measured in 35 adult dogs of 16 breeds (about 1,760 square micrometres, about 47 micrometres across if round; triceps brachii and vastus lateralis, Van Boom et al. 2023). The layout, the capillaries, the nuclei and the nerve ending are illustrative, as are their sizes.',
  'labels': [{'text': 'Muscle fibre (one long cell)', 'at': [-190, 110, 210], 'pop': 'fibre'}, {'text': 'Capillary', 'at': [128, 33, 210], 'pop': 'capillary'}, {'text': 'Nerve ending: the neuromuscular junction', 'at': [-60, 150, -230], 'pop': 'nmj'}],
  'populations': [
    pop('fibre', 'Muscle fibre', 'dog_muscle_fibre', 'tube_z', [47, 47, 400], '#c0574b', .92, L([{'at': [x, y, 0]} for x, y in fib])),
    pop('capillary', 'Capillary', 'capillary', 'tube_z', [8, 8, 400], '#8fb4d8', .9, L([{'at': [x, y, 0]} for x, y in caps])),
    dict(pop('rbc', 'Red blood cell', 'red_blood_cell', 'ellipsoid', [7, 7, 3], '#c9302c', 1, L([{'at': [x, y, z]} for (x, y), z in zip(caps, [60, -80, 120, -30, 10, -140])])), priority=4),   # in its capillary: what a click through the capillary's wall finds
    pop('nuclei', 'Muscle cell nucleus', 'dog_muscle_fibre', 'ellipsoid', [9, 6, 18], '#4d3a63', .95, L([{'at': [x + 21, y, z]} for (x, y), z in zip(fib[::5], [-120, 60, 150, -40, 100, 0, -90, 30])])),
    pop('axon', 'Motor nerve fibre', 'dog_nmj', 'tube_z', [6, 6, 200], '#efd66a', .95, L([{'at': [fib[4][0], fib[4][1], -345]}])),
    pop('nmj', 'Neuromuscular junction (nerve ending)', 'dog_nmj', 'ellipsoid', [26, 14, 34], '#e8b83a', .95, L([{'at': [fib[4][0], fib[4][1], -224]}]), {'type': 'mol', 'mol': 'acetylcholine', 'name': 'Acetylcholine, the messenger that tells muscle to contract'})]})
# ---------------- olfactory epithelium ----------------
ox = [-100 + 25 * i for i in range(9)]
write('dog_olfactory_epithelium', {'id': 'dog_olfactory_epithelium', 'title': 'Inside the smell lining', 'node': 'dog_olfactory_epithelium', 'bg': '#f3efe6', 'center': [0, 40, 0], 'D_um': 330,
  'blurb': 'A slice through the smell lining of the nose: the air is at the top. Click a smell neuron, its cilia, a supporting cell, a stem cell or a mucus gland.',
  'note': 'A schematic of the layers and cell types of the lining of a mammal\'s nose, as the textbooks describe them. All sizes and the number of cells are illustrative. A real smell neuron has many more cilia than drawn.',
  'labels': [{'text': 'Mucus (odour molecules dissolve here)', 'at': [-130, 128, 30], 'pop': 'mucus'}, {'text': 'Cilia with the smell receptors', 'at': [-130, 112, 30], 'pop': 'cilia'}, {'text': 'Smell neuron', 'at': [-130, 56, 30], 'pop': 'osn'}, {'text': 'Supporting cell', 'at': [-130, 82, 30], 'pop': 'sust'}, {'text': 'Stem cell', 'at': [-130, 8, 30], 'pop': 'basal'}, {'text': 'Mucus gland', 'at': [-130, -30, 30], 'pop': 'gland'}, {'text': 'Nerve fibres to the brain', 'at': [-130, -58, 30], 'pop': 'axons'}],
  'populations': [
    pop('mucus', 'Mucus layer', 'dog_bowman', 'rbox', [280, 8, 40], '#cfe6ee', .55, L([{'at': [0, 126, 0]}])),
    pop('cilia', 'Cilia with odour receptors', 'dog_osn', 'tube_z', [1.4, 1.4, 50], '#e8a98c', .95, L([{'at': [x, 108 + 4 * k, 0], 'rotY': 1.5708} for x in ox for k in range(3)]), {'type': 'mol', 'mol': 'camp', 'name': 'Cyclic AMP, the messenger inside a smell neuron'}),
    pop('knob', 'Dendrite knob', 'dog_osn', 'ellipsoid', [6, 6, 6], '#e5a07f', .95, L([{'at': [x, 102, 0]} for x in ox]), {'type': 'mol', 'mol': 'camp', 'name': 'Cyclic AMP, the messenger inside a smell neuron'}),
    pop('dendrite', 'Dendrite', 'dog_osn', 'cylinder', [2.6, 36, 2.6], '#e5a07f', .95, L([{'at': [x, 82, 0]} for x in ox])),
    pop('osn', 'Smell neuron (cell body)', 'dog_osn', 'ellipsoid', [11, 13, 11], '#e5a07f', .95, L([{'at': [x, 58, 0]} for x in ox]), {'type': 'mol', 'mol': 'camp', 'name': 'Cyclic AMP, the messenger inside a smell neuron'}),
    pop('sust', 'Supporting cell', 'dog_sustentacular', 'rbox', [11, 96, 11], '#b9d4a8', .6, L([{'at': [x + 12.5, 56, 0]} for x in ox[:-1]])),
    pop('basal', 'Basal (stem) cell', 'dog_basal', 'ellipsoid', [10, 7, 10], '#b79bd1', .95, L([{'at': [x + 6, 6, 4]} for x in ox[:-1]])),
    pop('lamina', 'Connective layer', 'dog_axons', 'rbox', [280, 70, 40], '#ecd5c6', .4, L([{'at': [0, -35, 0]}])),
    pop('gland', 'Mucus gland (Bowman\'s gland)', 'dog_bowman', 'ellipsoid', [34, 24, 30], '#e8d27a', .9, L([{'at': [-60, -22, 0]}, {'at': [55, -28, 0]}])),
    pop('axons', 'Nerve fibres to the brain', 'dog_axons', 'tube_z', [5, 5, 150], '#efd66a', .95, L([{'at': [0, -52, 0]}, {'at': [-30, -48, 0]}, {'at': [40, -54, 0]}]))]})
# ---------------- retina and tapetum ----------------
rx = [(-118 + 6 * i, -12 + 6 * k) for i in range(40) for k in range(4)]
cones = [(-110, -6), (-80, 6), (-50, -6), (-20, 6), (10, -6), (40, 6), (70, -6), (100, 6)]
write('dog_retina', {'id': 'dog_retina', 'title': 'Inside the retina and tapetum', 'node': 'dog_retina_scene', 'bg': '#f3efe6', 'center': [0, 70, 0], 'D_um': 330,
  'blurb': 'A slice through the back of the eye. Light comes from the top, passes the nerve cells, reaches the rods and cones, and the part that gets through is reflected back by the tapetum. Click a layer.',
  'note': 'A schematic of the order of the layers in a dog\'s eye. The cell numbers and thicknesses are illustrative. Two numbers come from sources: about 23 rods per cone at the sharpest spot in a beagle retina (the scene draws about 20 to 1) and 9-20 cell layers in the tapetum (3 are drawn).',
  'labels': [{'text': 'Ganglion cells (their fibres form the optic nerve)', 'at': [-135, 168, 30], 'pop': 'gang'}, {'text': 'Bipolar cells', 'at': [-135, 128, 30], 'pop': 'bip'}, {'text': 'Rods (dim light)', 'at': [-135, 80, 30], 'pop': 'rods'}, {'text': 'Cones (colour)', 'at': [-135, 96, 30], 'pop': 'cones'}, {'text': 'Pigment layer', 'at': [-135, 44, 30], 'pop': 'rpe'}, {'text': 'Tapetum lucidum (shiny layer)', 'at': [-135, 28, 30], 'pop': 'tap'}, {'text': 'Choroid (dark)', 'at': [-135, 4, 30], 'pop': 'choroid'}, {'text': 'Sclera', 'at': [-135, -12, 30], 'pop': 'sclera'}],
  'populations': [
    pop('gang', 'Ganglion cell', 'neuron', 'ellipsoid', [14, 14, 14], '#d6a7a0', .9, {'kind': 'grid', 'origin': [-130, 160, -20], 'n': [14, 1, 3], 'step': [19, 0, 14], 'jitter': .1}, {'type': 'cell'}),
    pop('bip', 'Bipolar cell', 'neuron', 'ellipsoid', [10, 14, 10], '#cba0c9', .9, {'kind': 'grid', 'origin': [-130, 120, -20], 'n': [18, 1, 3], 'step': [14.5, 0, 14], 'jitter': .1}),
    pop('rods', 'Rod cell', 'dog_rod', 'cylinder', [3, 42, 3], '#7da7b8', .95, L([{'at': [x, 70, z]} for x, z in rx]), {'type': 'mol', 'mol': 'retinal', 'name': 'Retinal, the light-catching molecule in a rod'}),
    pop('cones', 'Cone cell', 'dog_cone', 'cylinder', [5, 52, 5], '#e0a050', .95, L([{'at': [x, 74, z]} for x, z in cones])),
    pop('rpe', 'Pigment layer', 'dog_rpe', 'rbox', [290, 8, 40], '#5a463c', .95, L([{'at': [0, 44, 0]}])),
    pop('tap', 'Tapetal cell', 'dog_tapetal_cells', 'rbox', [26, 6, 26], '#5ac27c', .85, {'kind': 'grid', 'origin': [-140, 22, -20], 'n': [10, 3, 1], 'step': [28, 7, 0], 'jitter': .03}),
    pop('choroid', 'Choroid', 'dog_choroid', 'rbox', [290, 16, 40], '#33271f', .95, L([{'at': [0, 4, 0]}])),
    pop('sclera', 'Sclera', 'dog_sclera', 'rbox', [290, 14, 40], '#d6c9ae', .95, L([{'at': [0, -12, 0]}]))]})
