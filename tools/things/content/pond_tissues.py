# Writes the pond's tissue-style scenes (data/things/tissues/pond_*.json).  Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/pond_tissues.py
# All lengths are micrometres.  Sizes with a source are named in the scene note (shown on screen); everything else is declared illustrative there.
import json
def pop(id, name, node, shape, size, color, arrange, opacity=1, ink=1, deeper=None, priority=3, rot=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': ink, 'priority': priority, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    if rot: p['rot'] = rot
    return p
grid = lambda origin, n, step, stagger=0, jitter=0: {'kind': 'grid', 'origin': origin, 'n': n, 'step': step, **({'stagger': stagger} if stagger else {}), **({'jitter': jitter} if jitter else {})}
lst = lambda *items: {'kind': 'list', 'items': [i if isinstance(i, dict) else {'at': i} for i in items]}
rnd = lambda n, mn, mx, seed, gap=3, exclude=None, orient=None: {'kind': 'random', 'n': n, 'min': mn, 'max': mx, 'gap': gap, 'seed': seed, **({'exclude': exclude} if exclude else {}), **({'orient': orient} if orient else {})}
mol = lambda m, name, button=None: {'type': 'mol', 'mol': m, 'name': name, 'button': button or 'See the molecule: ' + name.lower()}
def write(d):
    d = {'cell': 'plant', **d}
    json.dump(d, open('data/things/tissues/%s.json' % d['id'], 'w'), indent=1, ensure_ascii=False)

# ---------------------------------------------------------------- a drop of pond water
write({'id': 'pond_drop', 'tag': 'In a drop of pond water', 'title': 'A drop of pond water', 'node': 'pond_drop',
  'blurb': 'A box of pond water about 0.6 mm wide and 0.33 mm tall under a microscope: green algae, glass-shelled diatoms, a ciliate, a rotifer and bacteria, each drawn at its own size against a 100 micrometre bar. Click anything.',
  'note': 'Sizes are typical for each group, drawn once at a size inside the usual range: Chlamydomonas about 10 µm; a Volvox colony (V. carteri) 100 to 500 µm, drawn 250 µm; diatoms 20 to 200 µm for most species, drawn 70 µm and 40 µm; Paramecium species 60 to 300 µm, drawn 200 µm; rotifers mostly 100 to 500 µm, drawn 250 µm; bacteria 0.5 to 5 µm. The numbers of each and where they sit are illustrative: a real drop holds far fewer large organisms than this. The organisms sit in a box about 0.6 mm wide and 0.33 mm tall; a water flea (about 2.5 mm long) would be more than four times as long as the box is wide, and is not drawn. Shapes are simplified.',
  'bg': '#eaf1f2', 'center': [0, 0, 0], 'D_um': 600,
  'labels': [
    {'text': '100 µm', 'at': [-258, -160, 0], 'pop': 'scale'},
    {'text': 'Volvox colony (a hollow ball of cells)', 'at': [-175, 118, 40], 'pop': 'volvox'},
    {'text': 'Diatom (glass shell)', 'at': [105, 120, 30], 'pop': 'diatom'},
    {'text': 'Paramecium (one cell)', 'at': [135, -100, 30], 'pop': 'paramecium'},
    {'text': 'Rotifer (an animal)', 'at': [-215, -88, 40], 'pop': 'rotifer'},
    {'text': 'Chlamydomonas (one cell)', 'at': [200, 40, 30], 'pop': 'chlamy'}],
  'populations': [
    pop('scale', 'Scale bar: 100 micrometres', 'pond_drop', 'rbox', [100, 3, 3], '#1e2a38', lst([-205, -145, 0]), 1, ink=0, deeper={'type': 'none'}),
    pop('volvox', 'Volvox colony', 'pond_volvox', 'ellipsoid', [250, 250, 250], '#9fd67c', lst([-120, 20, -20]), .3, deeper={'type': 'none'}, priority=1),
    pop('volvox_cell', 'Volvox cell', 'pond_volvox', 'ellipsoid', [9, 9, 9], '#3f9a2f', {'kind': 'inside', 'of': 'volvox', 'per': 70, 'margin': .93, 'seed': 4}, 1, ink=0, deeper=mol('chlorophyll_a', 'Chlorophyll a', 'See the green pigment: chlorophyll a')),
    pop('chlamy', 'Chlamydomonas (a green alga)', 'pond_chlamydomonas', 'ellipsoid', [10, 12, 10], '#4caa3a', rnd(16, [-60, -110, -60], [280, 150, 60], 7, 6, [{'min': [-260, -150, -100], 'max': [-0, 150, 100]}]), 1, deeper=mol('chlorophyll_a', 'Chlorophyll a', 'See the green pigment: chlorophyll a')),
    pop('diatom', 'Diatom (long, boat-shaped)', 'pond_diatom', 'ellipsoid', [70, 13, 10], '#c9a24a', lst({'at': [110, 95, 10], 'rot': [0, 20, 0]}, {'at': [40, -40, -30], 'rot': [0, 70, 0]}, {'at': [250, -120, 20], 'rot': [0, -30, 0]}), .9, deeper=mol('silicic_acid', 'Silicic acid', 'See the dissolved form of the glass: silicic acid')),
    pop('diatom_round', 'Diatom (round, drum-shaped)', 'pond_diatom', 'cylinder', [40, 14, 40], '#d7b25c', lst({'at': [200, 120, -20], 'rot': [70, 0, 0]}, {'at': [-10, 105, 30], 'rot': [80, 0, 30]}), .9, deeper=mol('silicic_acid', 'Silicic acid', 'See the dissolved form of the glass: silicic acid')),
    pop('paramecium', 'Paramecium (a ciliate)', 'pond_paramecium', 'ellipsoid', [200, 55, 55], '#d8d3c0', lst({'at': [130, -55, 10], 'rot': [0, 0, 12]}), .6, deeper={'type': 'none'}),
    pop('paramecium_nucleus', 'Paramecium macronucleus', 'pond_paramecium', 'ellipsoid', [40, 24, 24], '#9a7aa8', lst({'at': [125, -52, 10], 'rot': [0, 0, 12]}), 1, ink=0, deeper={'type': 'none'}),
    pop('rotifer', 'Rotifer', 'pond_rotifer', 'ellipsoid', [250, 50, 50], '#e6c7a6', lst({'at': [-170, -88, 50], 'rot': [0, 0, -8]}), .7, deeper={'type': 'none'}),
    pop('rotifer_corona', 'Rotifer corona (the wheel of cilia)', 'pond_rotifer', 'ellipsoid', [16, 52, 52], '#c9d9e8', lst({'at': [-292, -80, 50], 'rot': [0, 0, -8]}), .8, ink=0, deeper={'type': 'none'}),
    pop('bacteria', 'Bacteria', 'pond_bacteria', 'cylinder', [1.4, 3.2, 1.4], '#6f7f4c', rnd(130, [-290, -165, -90], [290, 165, 90], 11, 1.5), 1, ink=0, deeper={'type': 'none'}, priority=2),
    pop('detritus', 'Bits of dead plant (detritus)', 'pond_detritus', 'rbox', [20, 6, 13], '#6e5a3c', rnd(18, [-290, -165, -90], [290, 165, 90], 13, 6), 1, deeper={'type': 'none'}),
  ]})

# ---------------------------------------------------------------- the surface film and a skater's leg
write({'id': 'pond_film', 'tag': 'At the surface film', 'title': 'The surface film and a skater\'s leg', 'node': 'pond_surface_film',
  'blurb': 'A cut through the water surface where a pond skater\'s leg rests on it: the leg, its water-repelling hairs and the water below. Click each part.',
  'note': 'Schematic and not to scale in the parts that matter. The leg width, the hair length and thickness and their number are illustrative (the real hairs are needle-like, about 30 µm long, 12,000 to 16,000 to each square millimetre in the genus Gerris, and carry grooves about 400 nm wide, far finer than this scene can draw; the scene draws them 3 µm thick and 10 µm apart). The water is a block: its molecules are about 0.3 nm across, ten thousand times smaller than the finest thing here. The surface film is not a skin of different stuff; it is the top few layers of water molecules, held together by hydrogen bonds. Click the water to see one of its molecules.',
  'bg': '#eaf1f2', 'center': [0, 5, 0], 'D_um': 300,
  'labels': [
    {'text': 'Leg of a pond skater', 'at': [-120, 75, 40], 'pop': 'leg'},
    {'text': 'Water-repelling hairs', 'at': [-120, 25, 40], 'pop': 'hairs'},
    {'text': 'The surface film', 'at': [-120, -6, 40], 'pop': 'film'},
    {'text': 'Water', 'at': [-120, -40, 40], 'pop': 'water'}],
  'populations': [
    pop('leg', 'Leg of a pond skater', 'pond_skater_legs', 'tube_x', [240, 60, 60], '#4a3b2c', lst([0, 60, 0]), 1, deeper={'type': 'none'}),
    pop('hairs', 'Water-repelling hairs on the leg', 'pond_leg_hairs', 'cylinder', [3, 30, 3], '#7a6650', grid([-100, 14, -45], [21, 1, 10], [10, 1, 10], 0, .35), 1, ink=0, deeper=mol('n_acetylglucosamine', 'N-acetylglucosamine', 'See the molecule: the unit of chitin, the leg\'s skeleton material')),
    pop('film', 'The surface film', 'pond_surface_film', 'rbox', [250, 2, 130], '#e4f1f6', lst([0, -1, 0]), .9, deeper=mol('water', 'Water', 'See a water molecule')),
    pop('water', 'Water below the film', 'pond_surface_film', 'rbox', [250, 80, 130], '#8ec5d6', lst([0, -42, 0]), .4, deeper=mol('water', 'Water', 'See a water molecule')),
  ]})

# ---------------------------------------------------------------- the mud
write({'id': 'pond_mud', 'tag': 'Inside pond mud', 'title': 'Inside the mud', 'node': 'pond_mud',
  'blurb': 'A thin slice of pond mud: mineral grains, a rotting leaf, bacteria that feed on it, the archaea that make methane from what the bacteria leave, and a gas bubble. Click anything.',
  'note': 'Schematic. The grains, the leaf piece and the bubble are drawn at sizes inside the ranges for silt, sand and a single leaf fragment, but their numbers and positions are illustrative (silt grains are 2 to 63 µm, drawn 14 µm; sand grains are 63 to 2,000 µm, drawn 120 µm; ISO 14688-1); the microbes are drawn at about 1 to 3 micrometres (bacteria are typically 0.5 to 5 µm), far fewer than a real gram of mud holds. The bubble is drawn about 100 µm across to fit the scene; bubbles that leave the mud are millimetres across. Methane-making archaea live only where there is no oxygen, so the scene shows a place deeper in the mud, below the thin surface layer that oxygen reaches.',
  'bg': '#efe9de', 'center': [0, 0, 0], 'D_um': 330,
  'labels': [
    {'text': 'Mineral grains (silt and sand)', 'at': [-140, 85, 50], 'pop': 'sand'},
    {'text': 'Rotting leaf piece', 'at': [-140, 30, 50], 'pop': 'leaf'},
    {'text': 'Bacteria on the leaf', 'at': [-140, -20, 50], 'pop': 'bact'},
    {'text': 'Methane-making archaea', 'at': [-140, -80, 50], 'pop': 'archaea'},
    {'text': 'Gas bubble (mostly methane)', 'at': [80, 85, 50], 'pop': 'bubble'}],
  'populations': [
    pop('sand', 'Mineral grains', 'pond_mud_grains', 'ellipsoid', [120, 90, 100], '#c9b48e', rnd(4, [-150, -100, -60], [150, 100, 60], 3, 8, [{'min': [-70, -25, -80], 'max': [70, 45, 80]}]), 1, deeper={'type': 'none'}),
    pop('silt', 'Silt grains', 'pond_mud_grains', 'ellipsoid', [14, 10, 12], '#a08c6a', rnd(70, [-150, -100, -60], [150, 100, 60], 5, 2), 1, ink=0, deeper={'type': 'none'}, priority=2),
    pop('leaf', 'A rotting leaf fragment', 'pond_leaf_litter', 'rbox', [150, 9, 70], '#7a5a32', lst({'at': [-5, 10, 0], 'rot': [0, 15, 4]}), 1, deeper=mol('cellotriose', 'Cellotriose', 'See the cellulose of the leaf: a piece of its chain')),
    pop('bact', 'Bacteria feeding on the leaf', 'pond_mud_bacteria', 'cylinder', [1.6, 3.5, 1.6], '#6f7f4c', rnd(120, [-70, 12, -30], [70, 22, 30], 21, 2), 1, ink=0, deeper=mol('acetate', 'Acetate', 'See a molecule such microbes make: acetate'), priority=2),
    pop('archaea', 'Methane-making archaea', 'pond_methanogens', 'ellipsoid', [2, 2, 2], '#b0507a', rnd(60, [-110, -110, -50], [110, -40, 50], 23, 2), 1, ink=0, deeper=mol('methane', 'Methane', 'See the molecule they make: methane'), priority=2),
    pop('bubble', 'A gas bubble', 'pond_gas_bubbles', 'ellipsoid', [90, 90, 90], '#dcecf3', lst([95, -25, -10]), .55, deeper=mol('methane', 'Methane', 'See the main gas in it: methane')),
  ]})
print('pond tissue scenes written')
