# Writes the bee tissue scenes (data/things/tissues/bee_*.json).  Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/bee_tissues.py
# All lengths are micrometres.  Only the facet width (25.2 um, Streinzer et al. 2013) is a measured size; every other size is declared illustrative in each scene's note.
import json
def pop(id, name, node, shape, size, color, arrange, opacity=1, ink=1, deeper=None, priority=3):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': ink, 'priority': priority, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    return p
grid = lambda origin, n, step, stagger=0, jitter=0: {'kind': 'grid', 'origin': origin, 'n': n, 'step': step, **({'stagger': stagger} if stagger else {}), **({'jitter': jitter} if jitter else {})}
lst = lambda *items: {'kind': 'list', 'items': [{'at': i} for i in items]}
def write(d): json.dump(d, open('data/things/tissues/%s.json' % d['id'], 'w'), indent=1, ensure_ascii=False)

# ---- compound eye: a vertical slice through a patch of ommatidia ----
P = 25.2; N = 13; x0 = -P * N / 2
write({'id': 'bee_eye', 'title': "Inside a honey bee's compound eye", 'node': 'bee_compound_eye',
  'blurb': 'A slice through a patch of a worker bee\'s compound eye. Each lens (facet) is one of about five thousand; under each lies its own light-sensing unit, an ommatidium. Click a lens, a cone, or a column of light-sensing cells.',
  'note': 'The facet width (25.2 micrometres) is measured (Streinzer and colleagues, 2013). The depth, the width of the cone and the cells, and the number of cells drawn are simplified and not to scale with each other; a real ommatidium has more light-sensing cells than are drawn here. Colours are only a code.',
  'bg': '#f3efe6', 'center': [0, -85, 0], 'D_um': 400,
  'labels': [{'text': 'Lens (facet), 25 µm wide', 'at': [-170, 12, 30], 'pop': 'facet'}, {'text': 'Crystalline cone', 'at': [-170, -22, 30], 'pop': 'cone'}, {'text': 'Light-sensing cells and rhabdom', 'at': [-170, -95, 30], 'pop': 'rhabdom'}, {'text': 'Dark screening pigment cells', 'at': [-170, -60, 30], 'pop': 'pigment'}, {'text': 'Nerve fibres to the brain', 'at': [-170, -185, 30], 'pop': 'axon'}],
  'populations': [
    pop('facet', 'Lens of an ommatidium (facet)', 'bee_facet', 'lens', [P - 1.5, 13, P - 1.5], '#d9b45a', grid([x0, 0, -22], [N, 1, 3], [P, 1, 21.8], .5), .92, deeper={'type': 'mol', 'mol': 'n_acetylglucosamine', 'name': 'N-acetylglucosamine (the unit of chitin)', 'button': 'See the molecule: N-acetylglucosamine, the unit of chitin'}),
    pop('cone', 'Crystalline cone', 'bee_ommatidium', 'ellipsoid', [11, 24, 11], '#f2e6b8', grid([x0 + 7, -20, -22], [N, 1, 3], [P, 1, 21.8], .5), .85),
    pop('pigment', 'Screening pigment cell', 'bee_ommatidium', 'cylinder', [5, 105, 5], '#3b2a26', grid([x0 + 22, -62, -22], [N, 1, 3], [P, 1, 21.8], .5), .9),
    pop('retinula', 'Light-sensing cell (photoreceptor)', 'bee_photoreceptor', 'cylinder', [7, 120, 7], '#8fb6d6', grid([x0 + 3.5, -100, -22], [N, 1, 3], [P, 1, 21.8], .5), .75, deeper={'type': 'mol', 'mol': 'retinal', 'name': 'Retinal (the light-catching molecule)', 'button': 'See the molecule: retinal, the light-catching part of a visual pigment'}),
    pop('rhabdom', 'Rhabdom (where light is caught)', 'bee_rhabdom', 'cylinder', [3, 110, 3], '#e7a13a', grid([x0 + 8.5, -97, -22], [N, 1, 3], [P, 1, 21.8], .5), 1, deeper={'type': 'mol', 'mol': 'retinal', 'name': 'Retinal (the light-catching molecule)', 'button': 'See the molecule: retinal, the light-catching part of a visual pigment'}, priority=2.5),
    pop('axon', 'Nerve fibre from one ommatidium', 'bee_photoreceptor', 'cylinder', [2.5, 70, 2.5], '#e9dfc4', grid([x0 + 8.5, -190, -22], [N, 1, 3], [P, 1, 21.8], .5), 1),
  ]})

# ---- flight muscle: fibres with many mitochondria ----
write({'id': 'bee_flight_muscle', 'title': 'Inside a bee\'s flight muscle', 'node': 'bee_flight_muscles',
  'blurb': 'Flight muscle fibres running side by side, each packed with energy-making mitochondria, with air tubes (tracheoles) running between them. Click a fibre, a mitochondrion or an air tube.',
  'note': 'Schematic. The sizes, the number of fibres and the number of mitochondria drawn are illustrative, not measurements. What is true to the animal: the fibres are striated muscle, the mitochondria are very numerous, and air reaches the muscle through fine tubes that end among the fibres.',
  'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 320,
  'labels': [{'text': 'Muscle fibre (striated)', 'at': [-120, 62, 80], 'pop': 'fibre'}, {'text': 'Mitochondria', 'at': [-120, 0, 80], 'pop': 'mito'}, {'text': 'Tracheole: air tube', 'at': [-120, -62, 80], 'pop': 'tracheole'}],
  'populations': [
    pop('fibre', 'Flight muscle fibre', 'bee_flight_fibre', 'tube_z', [34, 34, 220], '#d9776a', grid([-100, -50, -110], [5, 4, 1], [40, 40, 1], .0, .02), .55),
    pop('mito', 'Mitochondrion', 'bee_mitochondria', 'ellipsoid', [8, 6, 14], '#e8a04a', {'kind': 'inside', 'of': 'fibre', 'per': 9, 'margin': .75, 'seed': 5}, 1, ink=0, deeper={'type': 'mol', 'mol': 'atp', 'name': 'ATP', 'button': 'See the molecule: ATP, the energy currency'}, priority=2.5),
    pop('tracheole', 'Tracheole', 'bee_tracheae', 'tube_z', [3, 3, 230], '#cfe6ef', grid([-80, -30, -115], [4, 3, 1], [40, 40, 1], 0, .01), .9),
  ]})

# ---- cuticle ----
write({'id': 'bee_cuticle', 'title': 'Inside the exoskeleton', 'node': 'bee_cuticle',
  'blurb': 'A slice through the bee\'s outer skin: a waxy skin, a hard outer layer, a tougher layered inner layer, and the living cells that build it all. Click a layer.',
  'note': 'Schematic. The order of the layers is as in insects generally: a thin waxy epicuticle on the outside, then the exocuticle, then the endocuticle, over a single layer of living cells (the epidermis). The thicknesses are illustrative, not measured on a bee. Chitin is drawn as stacked sheets; in life it is bundled into fibres embedded in protein.',
  'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 160,
  'labels': [{'text': 'Epicuticle (wax, no chitin)', 'at': [-120, 40, 40], 'pop': 'epi'}, {'text': 'Exocuticle (hard, darkened)', 'at': [-120, 24, 40], 'pop': 'exo'}, {'text': 'Endocuticle: stacked chitin sheets', 'at': [-120, 2, 40], 'pop': 'chitin'}, {'text': 'Epidermis: the living cells', 'at': [-120, -30, 40], 'pop': 'epidermis'}],
  'populations': [
    pop('epi', 'Epicuticle', 'bee_cuticle', 'rbox', [260, 1.5, 70], '#e6d8a0', lst([0, 40, 0]), 1),
    pop('exo', 'Exocuticle', 'bee_cuticle', 'rbox', [260, 12, 70], '#7a4f2a', lst([0, 33, 0]), 1),
    pop('chitin', 'Chitin sheet', 'bee_chitin', 'rbox', [260, 2.2, 70], '#e8d79a', grid([-130, -4, -35], [1, 8, 1], [1, 3.4, 1]), 1, deeper={'type': 'mol', 'mol': 'n_acetylglucosamine', 'name': 'N-acetylglucosamine (the unit of chitin)', 'button': 'See the molecule: N-acetylglucosamine, the unit of chitin'}, priority=2.5),
    pop('endo_matrix', 'Endocuticle (protein between the sheets)', 'bee_cuticle', 'rbox', [260, 30, 70], '#c9b27a', lst([0, 12, 0]), .35, ink=0, priority=4),
    pop('epidermis', 'Epidermal cell', 'bee_cuticle', 'rbox', [16, 16, 16], '#c7d9b6', grid([-125, -22, -30], [15, 1, 3], [17, 1, 20]), .6),
  ]})

# ---- crop: nectar being carried ----
write({'id': 'bee_crop', 'title': 'Inside the honey stomach', 'node': 'bee_crop',
  'blurb': 'The wall of the crop and the nectar it carries. Nectar is mostly water with dissolved sugars: sucrose, glucose and fructose. Click a droplet to meet its sugar.',
  'note': 'Schematic. Nectar fills the crop as a liquid, not as separate droplets; droplets are drawn so that the sugars can be told apart. Sizes and numbers are illustrative. The sugars named are the main ones in nectar; their proportions vary from plant to plant.',
  'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 450,
  'labels': [{'text': 'Sucrose', 'at': [-170, 90, 60], 'pop': 'sucrose'}, {'text': 'Glucose', 'at': [-170, 60, 60], 'pop': 'glucose'}, {'text': 'Fructose', 'at': [-170, 30, 60], 'pop': 'fructose'}, {'text': 'Crop wall: thin lining and living cells', 'at': [-170, -40, 60], 'pop': 'crop_cell'}],
  'populations': [
    pop('lining', 'Inner lining of the crop (cuticle)', 'bee_crop', 'rbox', [380, 3, 120], '#d9c07a', lst([0, -12, 0]), 1),
    pop('crop_cell', 'Cell of the crop wall', 'bee_crop', 'rbox', [28, 18, 28], '#cfe0b8', grid([-180, -34, -50], [13, 1, 4], [29, 1, 29]), .65),
    pop('sucrose', 'Sucrose droplet', 'bee_nectar', 'ellipsoid', [30, 30, 30], '#f6dc7a', {'kind': 'random', 'n': 9, 'min': [-170, 10, -45], 'max': [170, 120, 45], 'gap': 4, 'seed': 3}, .8, deeper={'type': 'mol', 'mol': 'sucrose', 'name': 'Sucrose', 'button': 'See the molecule: sucrose'}),
    pop('glucose', 'Glucose droplet', 'bee_nectar', 'ellipsoid', [26, 26, 26], '#f3c26a', {'kind': 'random', 'n': 7, 'min': [-170, 10, -45], 'max': [170, 120, 45], 'gap': 4, 'seed': 8}, .8, deeper={'type': 'mol', 'mol': 'glucose_alpha', 'name': 'Glucose', 'button': 'See the molecule: glucose'}),
    pop('fructose', 'Fructose droplet', 'bee_nectar', 'ellipsoid', [26, 26, 26], '#eda35c', {'kind': 'random', 'n': 7, 'min': [-170, 10, -45], 'max': [170, 120, 45], 'gap': 4, 'seed': 12}, .8, deeper={'type': 'mol', 'mol': 'fructose', 'name': 'Fructose', 'button': 'See the molecule: fructose'}),
  ]})
print('tissues written')
