# Writes the buttercup tissue scenes (data/things/tissues/flower_*.json). Lengths in micrometres. Run from the repo root.
import json, random
import tissue_material as TM
OUT = 'data/things/tissues/'
def pop(id, name, node, shape, size, color, opacity, arrange, ink=1, deeper=None, priority=None):
    d = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': ink, 'arrange': arrange}
    if deeper: d['deeper'] = deeper
    if priority: d['priority'] = priority
    return d
L = lambda *items: {'kind': 'list', 'items': [{'at': list(i[:3]), **({'rotY': i[3]} if len(i) > 3 else {})} for i in items]}
TAGS = {'flower_anther': 'Inside an anther', 'flower_carpel': 'Inside a carpel', 'flower_leaf': 'On a leaf surface', 'flower_petal': 'Inside a petal'}
def write(id, d):
    d = {'tag': TAGS[id], 'cell': 'plant', **d}   # scene tag shown in front of each card's kind line; cell type of the scene
    json.dump(TM.apply(d), open(OUT + id + '.json', 'w'), indent=1); print(id, len(d['populations']), 'populations')

# ---------- petal: cross-section through the four layers, true layer thicknesses ----------
# stack from the bottom: lower epidermis 0-40, mesophyll 40-140, starch layer 140-178, air gap 178-182, upper epidermis 182-184.7 (thicknesses from van der Kooi et al. 2017, model values)
write('flower_petal', {
  'id': 'flower_petal', 'title': 'Inside a buttercup petal', 'node': 'rn_gloss',
  'blurb': 'A slice through a petal about 0.18 mm thick, with its layers in the order found in glossy buttercups. The shiny top skin is the thin flat sheet at the top. Drag to turn it. Click a layer.',
  'note': 'The order of the layers follows the optical study of glossy buttercup petals by van der Kooi and colleagues (2017). The layer thicknesses (upper skin 2.7 micrometres, starch layer 38, spongy layer 100, lower skin 40, air gap 4) are model values for the picture, not measurements of a petal. Cell widths, the size and number of starch grains and the cell layout are illustrative.',
  'bg': '#f3efe6', 'center': [0, 92, 0], 'D_um': 300,
  'labels': [
    {'text': 'Flat upper skin with yellow pigment: 2.7 µm (the mirror)', 'at': [-300, 186, 40], 'pop': 'epi_top'},
    {'text': 'Air gap', 'at': [-300, 180, 40], 'pop': 'airgap'},
    {'text': 'Starch layer: 38 µm (scatters light)', 'at': [-300, 159, 40], 'pop': 'starch_cell'},
    {'text': 'Spongy middle: 100 µm', 'at': [-300, 90, 40], 'pop': 'meso'},
    {'text': 'Lower skin: 40 µm (not glossy)', 'at': [-300, 20, 40], 'pop': 'epi_bottom'}],
  'populations': [
    pop('epi_top', 'Upper epidermis cell (pigment, mirror)', 'rn_petal_epidermis', 'rbox', [25, 2.7, 25], '#f6c40b', 0.95, {'kind': 'grid', 'origin': [-250, 182, -25], 'n': [20, 1, 2], 'step': [25.6, 0, 25.6]}, deeper={'type': 'mol', 'mol': 'beta_carotene', 'name': 'Beta-carotene, an example of the carotenoid class that colours the petal'}),
    pop('airgap', 'Air gap under the upper skin', 'rn_gloss', 'rbox', [520, 4, 60], '#ffffff', 0.35, L((0, 180, 0)), ink=0),
    pop('starch_cell', 'Starch-layer cell', 'rn_starch_layer', 'rbox', [22, 38, 22], '#fbf2c7', 0.5, {'kind': 'grid', 'origin': [-250, 159, -22], 'n': [22, 1, 2], 'step': [23, 0, 23], 'jitter': 0.03}),
    pop('starch_grain', 'Starch grain', 'rn_starch', 'ellipsoid', [5, 4, 5], '#ffffff', 1, {'kind': 'inside', 'of': 'starch_cell', 'per': 5, 'margin': 0.8, 'seed': 21}, deeper={'type': 'mol', 'mol': 'glucose_alpha', 'name': 'Alpha-glucose, the unit starch is built from'}),
    pop('meso', 'Mesophyll cell', 'rn_petal_mesophyll', 'ellipsoid', [30, 20, 26], '#f3e7a0', 0.5, {'kind': 'random', 'n': 52, 'min': [-250, 44, -28], 'max': [250, 136, 28], 'gap': 4, 'seed': 5}, deeper={'type': 'cell'}),
    pop('epi_bottom', 'Lower epidermis cell (convex)', 'rn_petal_mesophyll', 'ellipsoid', [26, 40, 26], '#f0dc78', 0.6, {'kind': 'grid', 'origin': [-250, 20, -26], 'n': [19, 1, 2], 'step': [27, 0, 27], 'jitter': 0.03}, deeper={'type': 'cell'}),
  ]})

# ---------- anther: cross-section, four pollen sacs, pollen grains 27 um ----------
write('flower_anther', {
  'id': 'flower_anther', 'title': 'Inside a buttercup anther', 'node': 'rn_anther',
  'blurb': 'A slice across an anther: a wall around four pollen sacs, each full of pollen grains. The grains are drawn at their real size (about 27 micrometres); the anther is about half a millimetre wide. Click a part.',
  'note': 'The pollen grain size (about 27 by 26 micrometres) is from a pollen reference collection. The anther width, the shape of the sacs and the number of grains drawn are illustrative: a real sac holds far more grains than are shown.',
  'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 800,
  'labels': [
    {'text': 'Anther wall (skin, endothecium, tapetum)', 'at': [-300, 175, 100], 'pop': 'wall'},
    {'text': 'Pollen sac (one of four)', 'at': [-340, 70, 100], 'pop': 'sac'},
    {'text': 'Pollen grain, about 27 µm', 'at': [150, -60, 100], 'pop': 'grain'},
    {'text': 'Connective with a vascular strand', 'at': [10, -190, 100], 'pop': 'strand'}],
  'populations': [
    pop('wall', 'Anther wall', 'rn_anther_wall', 'tube_z', [540, 340, 420], '#e59d14', 0.28, L((0, 0, 0)), ink=1),
    pop('sac', 'Pollen sac', 'rn_pollen_sac', 'tube_z', [190, 130, 380], '#f6d84a', 0.5, L((-115, 75, 0), (115, 75, 0), (-115, -75, 0), (115, -75, 0)), ink=1),
    pop('connective', 'Connective tissue', 'rn_anther', 'tube_z', [60, 230, 390], '#f2e5a0', 0.9, L((0, 0, 0))),
    pop('strand', 'Vascular strand', 'bio_water_transport', 'tube_z', [26, 26, 410], '#4aa3df', 0.95, L((0, 0, 0)), deeper={'type': 'mol', 'mol': 'cellotriose', 'name': 'Cellulose, the main material of plant cell walls'}),
    pop('grain', 'Pollen grain', 'rn_pollen_grain', 'ellipsoid', [27, 26, 27], '#f9e24a', 1, {'kind': 'inside', 'of': 'sac', 'per': 26, 'margin': 0.8, 'seed': 31}),
  ]})

# ---------- carpel: longitudinal section, ovule, embryo sac, style, stigma, pollen tube ----------
write('flower_carpel', {
  'id': 'flower_carpel', 'title': 'Inside a buttercup carpel', 'node': 'rn_carpel',
  'blurb': 'One carpel opened lengthwise: the ovary wall, the single ovule, and inside the ovule the embryo sac with its egg cell. A pollen tube is shown growing from the stigma down the style to the ovule. Click a part.',
  'note': 'A diagram built from the usual flowering-plant plan. Sizes are illustrative (a carpel about 1.5 millimetres tall; the ovule about 0.5 mm; the embryo sac about 0.15 mm); the embryo sac drawn is the seven-celled pattern typical for flowering plants. The pollen tube is drawn thicker than a real one so you can see it.',
  'bg': '#f3efe6', 'center': [0, 650, 0], 'D_um': 1700,
  'labels': [
    {'text': 'Stigma (catches pollen)', 'at': [-300, 1330, 100], 'pop': 'stigma'},
    {'text': 'Style', 'at': [-300, 1100, 100], 'pop': 'style'},
    {'text': 'Ovary wall', 'at': [-520, 700, 100], 'pop': 'wall'},
    {'text': 'Ovule (becomes the seed)', 'at': [-520, 330, 100], 'pop': 'ovule'},
    {'text': 'Embryo sac', 'at': [230, 460, 100], 'pop': 'sac'},
    {'text': 'Pollen tube', 'at': [160, 950, 100], 'pop': 'tube'}],
  'populations': [
    pop('wall', 'Ovary wall', 'rn_carpel', 'ellipsoid', [820, 960, 700], '#8ab34a', 0.28, L((0, 450, 0))),
    pop('ovule', 'Ovule', 'rn_ovule', 'ellipsoid', [420, 540, 380], '#f1d98a', 0.7, L((0, 320, 0))),
    pop('sac', 'Embryo sac', 'rn_embryo_sac', 'ellipsoid', [120, 190, 110], '#fffdf0', 0.95, L((0, 410, 0))),
    pop('egg', 'Egg cell', 'egg_cell', 'ellipsoid', [26, 34, 26], '#ffb347', 1, L((0, 470, 0))),
    pop('syn', 'Helper cell (synergid)', 'rn_embryo_sac', 'ellipsoid', [20, 30, 20], '#fcd29a', 1, L((-24, 490, 0), (24, 490, 0))),
    pop('central', 'Central cell', 'rn_embryo_sac', 'ellipsoid', [70, 70, 70], '#e9f2c8', 1, L((0, 410, 0))),
    pop('anti', 'Antipodal cell', 'rn_embryo_sac', 'ellipsoid', [22, 22, 22], '#d7e3a8', 1, L((-26, 340, 0), (26, 340, 0), (0, 332, 22))),
    pop('style', 'Style', 'rn_style_stigma', 'cylinder', [70, 380, 70], '#b9d36a', 0.4, L((0, 1090, 0))),
    pop('stigma', 'Stigma', 'rn_style_stigma', 'ellipsoid', [150, 90, 120], '#dbe58a', 0.95, L((0, 1320, 0))),
    pop('pollen', 'Pollen grain on the stigma', 'rn_pollen_grain', 'ellipsoid', [27, 26, 27], '#f9e24a', 1, L((-30, 1355, 20), (30, 1350, -15))),
    pop('tube', 'Pollen tube', 'rn_fruit_development', 'cylinder', [9, 860, 9], '#fff1a8', 1, L((0, 830, 0))),
  ]})

# ---------- leaf surface: epidermal cells, stomata, hairs ----------
random.seed(4)
cells = []
write('flower_leaf', {
  'id': 'flower_leaf', 'title': 'The surface of a buttercup leaf', 'node': 'rn_leaf_epidermis',
  'blurb': 'The skin of a leaf seen from above and a little to the side: flat cells, pairs of guard cells around pores (stomata), and hairs standing up. Drag to turn it. Click a cell, a pore or a hair.',
  'note': 'Illustrative. The species is described as hairy and, like other leaves, has stomata; the sizes in this scene are model values, not measurements. The cells here are drawn about 40 micrometres across, the guard-cell pairs about 25 micrometres long, the hairs 15 micrometres wide and 400 to 800 micrometres long.',
  'bg': '#f3efe6', 'center': [0, 150, 0], 'D_um': 900,
  'labels': [
    {'text': 'Hair (trichome)', 'at': [-260, 430, 40], 'pop': 'hair'},
    {'text': 'Stoma: two guard cells around a pore', 'at': [-240, 40, 120], 'pop': 'guard'},
    {'text': 'Skin cell (epidermis)', 'at': [260, 20, 120], 'pop': 'cell'}],
  'populations': [
    pop('cell', 'Epidermis cell', 'rn_leaf_epidermis', 'rbox', [40, 12, 40], '#cfe6b4', 0.55, {'kind': 'grid', 'origin': [-300, 0, -200], 'n': [14, 1, 10], 'step': [43, 0, 43], 'stagger': 0.5, 'jitter': 0.06, 'skip': [{'x': [-215, -165]}]}),
    pop('guard', 'Guard cell', 'rn_stoma', 'bean', [26, 12, 9], '#7fc45a', 0.9, L((-190, 8, -4, 0), (-190, 8, 5, 3.14159), (30, 8, 60, 0), (30, 8, 69, 3.14159), (150, 8, -110, 0), (150, 8, -101, 3.14159)), deeper={'type': 'cell'}),
    pop('hair', 'Hair', 'rn_hairs', 'cylinder', [15, 500, 15], '#efe9cf', 0.95, L((-120, 250, -60), (-250, 300, 80), (110, 300, 30), (220, 400, -100)), deeper={'type': 'cell'}),
    pop('chloro', 'Chloroplast', 'bio_chloroplasts_plastids', 'lens', [6, 3, 6], '#2f8f3a', 1, {'kind': 'inside', 'of': 'cell', 'per': 2, 'margin': 0.6, 'seed': 41}, deeper={'type': 'mol', 'mol': 'chlorophyll_a', 'name': 'Chlorophyll a, the green pigment'}),
  ]})
