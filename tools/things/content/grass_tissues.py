# Writes the grass tissue scenes (data/things/tissues/grass_*.json). Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/grass_tissues.py
# All lengths are micrometres. Sizes with a source are named in each scene note (shown on screen); everything else is declared illustrative there.
import json, math, random
import tissue_material as TM
def pop(id, name, node, shape, size, color, arrange, opacity=1, ink=1, deeper=None, priority=3, rot=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': ink, 'priority': priority, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    if rot: p['rot'] = rot
    return p
grid = lambda origin, n, step, stagger=0, jitter=0, skip=None: {'kind': 'grid', 'origin': origin, 'n': n, 'step': step, **({'stagger': stagger} if stagger else {}), **({'jitter': jitter} if jitter else {}), **({'skip': skip} if skip else {})}
lst = lambda *items: {'kind': 'list', 'items': [i if isinstance(i, dict) else {'at': i} for i in items]}
rnd = lambda n, mn, mx, seed, gap=3, exclude=None, orient=None: {'kind': 'random', 'n': n, 'min': mn, 'max': mx, 'gap': gap, 'seed': seed, **({'exclude': exclude} if exclude else {}), **({'orient': orient} if orient else {})}
inside = lambda of, per, margin=.7, seed=1: {'kind': 'inside', 'of': of, 'per': per, 'margin': margin, 'seed': seed}
mol = lambda m, name, button=None: {'type': 'mol', 'mol': m, 'name': name, 'button': button or 'See the molecule: ' + name.lower()}
NONE = {'type': 'none'}
def write(d):
    d = {'cell': 'plant', **d}
    json.dump(TM.apply(d), open('data/things/tissues/%s.json' % d['id'], 'w'), indent=1, ensure_ascii=False)

# ---------------------------------------------------------------- a ryegrass leaf blade, cut across
BX = [-220, 0, 220]   # three vascular bundles
ring = lambda cx, cy, r, n: [[round(cx + r * math.cos(2 * math.pi * i / n), 1), round(cy + .85 * r * math.sin(2 * math.pi * i / n), 1), 0] for i in range(n)]
write({'id': 'grass_leaf_section', 'tag': 'Inside a grass leaf', 'title': 'Inside a ryegrass leaf blade', 'node': 'grass_blade_upper',
  'blurb': 'A slice 700 micrometres wide through a grass blade, showing three of its parallel veins. The upper surface is at the top. Click a cell or a layer.',
  'note': 'An illustration of the layers of a temperate grass leaf, not a micrograph of ryegrass. The order of the layers and which cell types are present follow published descriptions of the genus (ribbed upper surface; bulliform cells in fans on the upper side; every vascular bundle accompanied by sclerenchyma; bundle sheaths; silica bodies; stomata). The blade thickness (150 µm here), cell sizes, cell counts and the number of chloroplasts per cell are not measured values: they are illustrative. The ribs over the veins are not drawn. Guard cells are shown in cross-section, where they look rounded and bean-like; seen from above (the stoma scene) they are dumbbell-shaped. Stomata are drawn on the lower face only.',
  'bg': '#f3efe6', 'center': [0, 75, 0], 'D_um': 520,
  'labels': [
    {'text': 'Upper epidermis (the ribbed side)', 'at': [-340, 150, 40], 'pop': 'epi_top'},
    {'text': 'Bulliform cells', 'at': [-120, 168, 40], 'pop': 'bulliform'},
    {'text': 'Silica body', 'at': [180, 160, 40], 'pop': 'silica'},
    {'text': 'Mesophyll cells with chloroplasts', 'at': [-340, 80, 40], 'pop': 'mesophyll'},
    {'text': 'Bundle sheath', 'at': [28, 108, 40], 'pop': 'bsheath'},
    {'text': 'Xylem and phloem', 'at': [32, 70, 40], 'pop': 'xylem'},
    {'text': 'Sclerenchyma fibres', 'at': [-20, 142, 40], 'pop': 'scl'},
    {'text': 'Lower epidermis (the glossy side)', 'at': [-340, -6, 40], 'pop': 'epi_bottom'},
    {'text': 'Stoma', 'at': [-132, -10, 40], 'pop': 'guard'}],
  'populations': [
    pop('epi_top', 'Upper epidermis cell', 'grass_epidermis', 'rbox', [28, 12, 26], '#d6ebc4', grid([-345, 138, -13], [25, 1, 2], [28, 0, 26], 0, .03, [{'x': [-140, -90]}, {'x': [90, 140]}, {'x': [-10, 10]}, {'x': [200, 240]}, {'x': [-240, -200]}]), .45, deeper={'type': 'cell'}),
    pop('bulliform', 'Bulliform cell', 'grass_bulliform', 'rbox', [26, 30, 26], '#f1f8dc', lst([-130, 130, 0], [-112, 132, 0], [-95, 130, 0], [-130, 130, 22], [-95, 130, 22], [110, 130, 0], [128, 132, 0], [92, 130, 0], [110, 130, 22]), .55, deeper={'type': 'cell'}),
    pop('silica', 'Silica body (silica cell)', 'grass_silica_body', 'rbox', [22, 10, 26], '#fbfbf5', lst([-220, 143, 0], [0, 143, 0], [220, 143, 0]), 1, deeper=mol('silicic_acid', 'Silicic acid', 'See the dissolved form of silica: silicic acid')),
    pop('epi_bottom', 'Lower epidermis cell', 'grass_epidermis', 'rbox', [30, 12, 26], '#d6ebc4', grid([-345, 0, -13], [23, 1, 2], [31, 0, 26], 0, .03, [{'x': [-165, -100]}]), .45, deeper={'type': 'cell'}),
    pop('guard', 'Guard cell', 'grass_guard_cell', 'bean', [24, 10, 8], '#8fcf6a', lst({'at': [-132, 8, -5]}, {'at': [-132, 8, 5], 'rot': [0, 180, 0]}), .9, deeper=NONE),
    pop('mesophyll', 'Mesophyll cell', 'grass_mesophyll', 'ellipsoid', [26, 20, 22], '#c4e2a6', rnd(58, [-340, 22, -26], [340, 120, 26], 5, 3, [{'min': [-262, 30, -40], 'max': [-178, 124, 40]}, {'min': [-42, 30, -40], 'max': [42, 124, 40]}, {'min': [178, 30, -40], 'max': [262, 124, 40]}, {'min': [-150, 112, -40], 'max': [-75, 125, 40]}]), .36, deeper={'type': 'cell'}),
    pop('chloro', 'Chloroplast', 'bio_chloroplasts_plastids', 'lens', [6, 3, 6], '#2f8f3a', inside('mesophyll', 5, .7, 3), 1, deeper=mol('chlorophyll_a', 'Chlorophyll a', 'See the molecule: chlorophyll a, the green pigment')),
    pop('bsheath', 'Bundle sheath cell', 'grass_bundle_sheath', 'tube_z', [14, 14, 50], '#a9d68a', lst(*[[x, y, 0] for b in BX for x, y, _ in ring(b, 75, 28, 9)]), .6, deeper={'type': 'cell'}),
    pop('xylem', 'Xylem vessel', 'bio_water_transport', 'tube_z', [11, 11, 50], '#4aa3df', lst(*[[b + dx, 84, 0] for b in BX for dx in (-9, 9)]), .85, deeper=mol('water', 'Water', 'See a water molecule')),
    pop('phloem', 'Phloem sieve tube', 'bio_phloem_transport', 'tube_z', [7, 7, 50], '#e0a526', lst(*[[b + dx, 64, 0] for b in BX for dx in (-7, 7)]), .9, deeper=mol('sucrose', 'Sucrose', 'See the molecule: sucrose, the sugar carried in the phloem')),
    pop('scl', 'Sclerenchyma fibre', 'grass_sclerenchyma', 'tube_z', [8, 8, 50], '#b79b6a', lst(*[[b + dx, y, 0] for b in BX for dx in (-9, 0, 9) for y in (122, 28)]), .9),
  ]})

# ---------------------------------------------------------------- a grass stoma
write({'id': 'grass_stoma_scene', 'tag': 'On a grass leaf surface', 'title': 'A grass stoma (leaf pore), seen from above', 'node': 'grass_stoma',
  'blurb': 'A patch of grass leaf surface about 280 micrometres wide: a pore between two dumbbell-shaped guard cells, with a lens-shaped subsidiary cell on each side. Compare the oak leaf stoma, with its two bean-shaped guard cells and no subsidiary cells. Click a cell.',
  'note': 'Schematic. The dumbbell guard cells (bulbous ends, narrow middle) and the two flanking subsidiary cells follow published descriptions of the grass type of stoma; the lengths and widths drawn (a pore about 30 µm long) are illustrative, within the 10 to 80 µm that stomata span across species (Wikipedia: Stoma), and not measured on ryegrass. The elongated epidermal cells and the line of stomata are simplified. In a real leaf the guard cells swell and shrink to open and close the pore; nothing moves here.',
  'bg': '#eef3e6', 'center': [0, 0, 0], 'D_um': 150,
  'labels': [
    {'text': 'Pore (stoma)', 'at': [-28, 0, 30], 'pop': 'pore'},
    {'text': 'Guard cell (dumbbell-shaped)', 'at': [-70, 22, 30], 'pop': 'gc_end'},
    {'text': 'Subsidiary cell', 'at': [-76, 40, 30], 'pop': 'sub'},
    {'text': 'Epidermal cell', 'at': [-100, -62, 30], 'pop': 'epi'}],
  'populations': [
    pop('gc_end', 'Guard cell (bulbous end)', 'grass_guard_cell', 'ellipsoid', [11, 11, 9], '#7cc36a', lst([-9, 4, 0], [9, 4, 0], [-9, -4, 0], [9, -4, 0]), .95, deeper={'type': 'cell'}),
    pop('gc_mid', 'Guard cell (narrow middle)', 'grass_guard_cell', 'tube_x', [14, 3.4, 3.4], '#7cc36a', lst([0, 3, 0], [0, -3, 0]), .95, deeper={'type': 'cell'}),
    pop('pore', 'The pore: gas passes through here', 'grass_stoma', 'ellipsoid', [26, 2.4, 6], '#bcd6e8', lst([0, 0, 0]), .8, deeper=mol('carbon_dioxide', 'Carbon dioxide', 'See the molecule: carbon dioxide, the gas the leaf takes in')),
    pop('sub', 'Subsidiary cell', 'grass_subsidiary_cell', 'lens', [38, 8, 10], '#b8dca0', lst([0, 12, 0], [0, -12, 0]), .6, deeper={'type': 'cell'}),
    pop('epi', 'Epidermal cell', 'grass_epidermis', 'rbox', [58, 22, 14], '#d6ebc4', lst(*[[x, y, -4] for x in (-110, 110) for y in (4,)], *[[x, y, -4] for x in (-72, 0, 72) for y in (-40, 40)], [-110, -40, -4], [110, 40, -4]), .55, deeper={'type': 'cell'}),
  ]})

# ---------------------------------------------------------------- a grass root tip
write({'id': 'grass_root_tip', 'tag': 'In a grass root', 'title': 'The tip of a grass root', 'node': 'grass_root_tip',
  'blurb': 'The last 1.7 mm of a fibrous root, with the tip at the left: root cap, dividing cells, cells that are lengthening, and root hairs further back. Click a part.',
  'note': 'Schematic. The order of the zones (root cap, cell division, elongation, maturation with root hairs) is as in textbook descriptions of roots. The length of each zone and the cell sizes are illustrative. Root hairs are drawn 16 µm wide, as in the published range of 15 to 17 µm, and 500 µm long (published range for root hair cells in general: 80 to 1,500 µm; not measured on ryegrass).',
  'bg': '#efe9dc', 'center': [700, 0, 0], 'D_um': 1700,
  'labels': [
    {'text': 'Root cap', 'at': [20, 105, 30], 'pop': 'cap'},
    {'text': 'Dividing cells', 'at': [240, 105, 30], 'pop': 'meri'},
    {'text': 'Cells lengthening', 'at': [560, 105, 30], 'pop': 'elong'},
    {'text': 'Root hairs', 'at': [1000, 280, 30], 'pop': 'hair'},
    {'text': 'Xylem (water pipes)', 'at': [1050, -10, 30], 'pop': 'xylem'}],
  'populations': [
    pop('cap', 'Root cap cell', 'grass_root_cap', 'ellipsoid', [22, 24, 24], '#e9dcb8', grid([0, -48, -12], [3, 5, 1], [22, 24, 24], 0, .1), .8, deeper={'type': 'cell'}),
    pop('meri', 'Dividing root cell', 'grass_root_tip', 'rbox', [14, 14, 14], '#f2d98a', grid([80, -49, -14], [24, 7, 2], [14, 14, 14], 0, .05), .9, deeper={'type': 'cell'}),
    pop('elong', 'Lengthening root cell', 'grass_root_tip', 'rbox', [38, 16, 16], '#e6dcae', grid([440, -48, -16], [8, 6, 2], [40, 16, 16], 0, .05), .8, deeper={'type': 'cell'}),
    pop('mature', 'Root epidermal cell', 'grass_root_hairs', 'rbox', [90, 16, 16], '#dccfa0', grid([850, -48, -16], [8, 6, 2], [92, 16, 16], 0, .04), .5, deeper={'type': 'cell'}),
    pop('xylem', 'Xylem vessel', 'bio_water_transport', 'tube_x', [900, 8, 8], '#4aa3df', lst([1300, 0, 0]), .85, deeper=mol('water', 'Water', 'See a water molecule')),
    pop('hair', 'Root hair', 'grass_root_hairs', 'cylinder', [16, 500, 16], '#f1e9cf', lst(*[{'at': [1000 + i * 70, 50 + 250 * (1 if i % 2 else -1) * 0 + (270 if i % 2 else -270) * 0, 0], 'rot': [0, 0, 0]} for i in range(0)], *[{'at': [900 + 75 * i, 250 if i % 2 == 0 else -250, (i % 3 - 1) * 20], 'rot': [0, 0, 0]} for i in range(10)]), .9, deeper=mol('cellotriose', 'Cellulose', 'See the molecule: cellulose, the material of the cell wall')),
  ]})

# ---------------------------------------------------------------- the growing point and the tiller base
write({'id': 'grass_apex', 'tag': 'In a grass shoot base', 'title': 'The growing point and the base of a young leaf', 'node': 'grass_meristem',
  'blurb': 'A window about 0.4 mm wide and 0.45 mm tall, at the base of a grass shoot: the dome of dividing cells that is the growing point, the youngest leaf wrapping it, and cells further down that store sugar. Click a part.',
  'note': 'Schematic. What is shown follows textbook and extension descriptions: a dome of dividing cells (the shoot apex), leaf primordia round it, and a zone of dividing cells at the base of each growing leaf. Measured for perennial ryegrass: in a growing leaf, cell division is confined to the basal 0.6 to 0.9 mm and cells keep lengthening over the basal 31 to 36 mm (Lolium perenne, kinematic study, Plant Physiology). Everything else, including the cell sizes (about 10 to 40 µm here), the dome size and the number of cells, is illustrative. Ryegrass stores its reserve sugars as fructans in the leaf sheaths and elongating leaf bases (Lolium perenne papers cited on the card); the storage cells are drawn larger than the dividing cells.',
  'bg': '#f3efe6', 'center': [0, 150, 0], 'D_um': 800,
  'labels': [
    {'text': 'Growing point (dome of dividing cells)', 'at': [-380, 330, 40], 'pop': 'dome'},
    {'text': 'Young leaf primordium', 'at': [-380, 250, 40], 'pop': 'prim'},
    {'text': 'Base of the youngest leaf: cells divide and then lengthen', 'at': [-380, 170, 40], 'pop': 'gz'},
    {'text': 'Cells that store fructan, a sugar reserve', 'at': [-380, 30, 40], 'pop': 'store'}],
  'populations': [
    pop('dome', 'Cell of the growing point', 'grass_meristem', 'ellipsoid', [12, 12, 12], '#f0c94c', grid([-60, 280, -24], [10, 6, 5], [12, 12, 12], 0, .08, [{'x': [-60, -40], 'y': [330, 400]}, {'x': [40, 60], 'y': [330, 400]}]), .95, deeper={'type': 'cell'}),
    pop('prim', 'Cell of a young leaf primordium', 'grass_leaf_primordium', 'ellipsoid', [12, 14, 12], '#d9c25a', grid([-150, 250, -18], [2, 5, 3], [14, 14, 14], 0, .08), .85, deeper={'type': 'cell'}),
    pop('prim2', 'Cell of a young leaf primordium', 'grass_leaf_primordium', 'ellipsoid', [12, 14, 12], '#d9c25a', grid([128, 250, -18], [2, 5, 3], [14, 14, 14], 0, .08), .85, deeper={'type': 'cell'}),
    pop('gz', 'Cell at the base of a growing leaf', 'grass_growth_zone', 'rbox', [18, 20, 18], '#e9a94a', grid([-170, 120, -18], [18, 6, 3], [19, 22, 19], 0, .06), .7, deeper={'type': 'cell'}),
    pop('store', 'Sheath cell that stores fructan', 'grass_fructan', 'rbox', [40, 44, 36], '#e8dfc0', grid([-190, -40, -36], [9, 3, 2], [44, 48, 40], 0, .05), .5, deeper=mol('fructose', 'Fructose', 'See the molecule: fructose, the unit fructan is made of')),
    pop('walls', 'Cell wall', 'bio_cell_wall_ecm', 'rbox', [2, 90, 36], '#a99a6a', lst([-205, 20, 0], [215, 20, 0]), .8, deeper=mol('cellotriose', 'Cellulose', 'See the molecule: cellulose')),
  ]})

# ---------------------------------------------------------------- grass pollen and a stigma
write({'id': 'grass_pollen', 'tag': 'On the wind', 'title': 'Grass pollen caught by a feathery stigma', 'node': 'grass_pollen',
  'blurb': 'A box about 400 micrometres wide: pollen grains of the size of ryegrass pollen, and the branched hairs of a feathery stigma that catch them. Click a grain or a hair.',
  'note': 'Schematic. Ryegrass pollen grains are 26 to 50 µm across, roughly spherical, each with one pore closed by a lid (PalDat, Lolium perenne): the scene draws them 35 to 40 µm. The stigma branch width, hair spacing and the number of grains are illustrative. The tiny particles that burst pollen releases in rain (about 60 to 200 nm, from laboratory work on ryegrass pollen) are far too small to draw at this scale. The allergen proteins (for example Lol p 1) are not in this explorer\'s molecule set.',
  'bg': '#f4f1e6', 'center': [0, 0, 0], 'D_um': 480,
  'labels': [
    {'text': 'Pollen grain (about 40 µm)', 'at': [-250, 120, 40], 'pop': 'grain'},
    {'text': 'Pore with lid', 'at': [-250, 90, 40], 'pop': 'pore'},
    {'text': 'Branch of a feathery stigma', 'at': [-250, -120, 40], 'pop': 'stig'}],
  'populations': [
    pop('grain', 'Grass pollen grain', 'grass_pollen', 'ellipsoid', [38, 38, 38], '#e8d86a', rnd(14, [-200, -60, -60], [200, 160, 60], 5, 10, [{'min': [-210, -200, -80], 'max': [210, -50, 80]}]), .95, deeper=NONE),
    pop('pore', 'Pore with its lid', 'grass_pollen', 'ellipsoid', [8, 8, 4], '#9c8a2a', lst([-195, 60, 19], [60, 100, 19]), 1, ink=0, deeper=NONE),
    pop('stig', 'Stigma branch', 'grass_stigma', 'cylinder', [12, 380, 12], '#d9d6e6', lst({'at': [0, -130, 0], 'rot': [0, 0, 90]}), .9, deeper={'type': 'cell'}),
    pop('hair', 'Stigma hair', 'grass_stigma', 'cylinder', [4, 70, 4], '#e7e4f0', grid([-170, -170, -30], [12, 2, 3], [30, 60, 30], 0, .25), .9, ink=0, deeper={'type': 'cell'}),
  ]})
print('tissues written')
