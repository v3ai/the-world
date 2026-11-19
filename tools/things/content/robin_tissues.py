# Writes the robin tissue scenes (data/things/tissues/robin_*.json). Run from the repo root:
#   /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/robin_tissues.py
# All lengths are micrometres. Only the barbule spacing (8 to 16 um, J. R. Soc. Interface 2025) is a published size; every other size is declared illustrative in each scene's note.
import json
def pop(id, name, node, shape, size, color, arrange, opacity=1, ink=1, deeper=None, priority=3, **kw):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': ink, 'priority': priority, 'arrange': arrange, **kw}
    if deeper: p['deeper'] = deeper
    return p
grid = lambda origin, n, step, stagger=0, jitter=0: {'kind': 'grid', 'origin': origin, 'n': n, 'step': step, **({'stagger': stagger} if stagger else {}), **({'jitter': jitter} if jitter else {})}
lst = lambda *items: {'kind': 'list', 'items': [({'at': i} if isinstance(i, list) else i) for i in items]}
def write(d):
    d = {'cell': 'animal', **d}
    json.dump(d, open('data/things/tissues/%s.json' % d['id'], 'w'), indent=1, ensure_ascii=False)

# ---- feather: shaft, barbs, barbules and their hooks (rachis up the left; barbs run right; barbules run up and down between barbs) ----
write({'id': 'robin_feather', 'tag': 'Inside a feather', 'title': "Inside a robin's flight feather", 'node': 'robin_feather_scene',
  'blurb': 'A piece of a flight feather: the central shaft (rachis), the barbs that grow from it, their barbules with hooklets, and pigment granules. Click a part.',
  'note': 'The spacing of the barbules (8 to 16 micrometres, drawn as 12) is a published measurement for the flight feathers of birds from hummingbirds to condors. Everything else is illustrative: the length and thickness of the barbs and barbules, the number of hooklets, and the size and number of pigment granules. The keratin filaments in the shaft are 3 nanometres across and are too small to draw.',
  'bg': '#f2eee6', 'center': [0, 0, 0], 'D_um': 430,
  'labels': [{'text': 'Rachis: the shaft', 'at': [-190, 175, 30], 'pop': 'rachis'}, {'text': 'Barbs', 'at': [60, 160, 30], 'pop': 'barb'}, {'text': 'Barbules, 8 to 16 µm apart', 'at': [-60, -165, 30], 'pop': 'barbule'}, {'text': 'Hooklets', 'at': [110, -165, 30], 'pop': 'hooklet'}, {'text': 'Pigment granules', 'at': [130, 100, 30], 'pop': 'granule'}],
  'populations': [
    pop('rachis', 'Rachis (shaft)', 'robin_rach', 'cylinder', [70, 380, 70], '#b9ab8d', lst([-170, 0, 0]), 1, priority=1),
    pop('barb', 'Barb', 'robin_barb', 'tube_x', [330, 14, 14], '#8d7b5a', grid([-5, -140, 0], [1, 11, 1], [1, 28, 1]), 1, priority=3),
    pop('barbule', 'Barbule', 'robin_barbule', 'cylinder', [3.4, 50, 3.4], '#b29f78', grid([-125, -140, 0], [26, 11, 1], [12, 28, 1]), .95, priority=4, deeper={'type': 'mol', 'mol': 'cystine', 'name': 'Cystine, the sulfur bridge of keratin', 'button': 'See the molecule: cystine, the sulfur-to-sulfur bridge that locks keratin'}),
    pop('hooklet', 'Hooklet', 'robin_hooklet', 'ellipsoid', [4.5, 4.5, 4.5], '#4a3a26', grid([-125, -112, 0], [13, 11, 1], [24, 28, 1]), 1, priority=5),
    pop('granule', 'Pigment granule', 'robin_pigment_granule', 'ellipsoid', [4, 2.6, 2.6], '#3b2a1c', {'kind': 'inside', 'of': 'barb', 'per': 3, 'margin': .6, 'seed': 14}, 1, ink=0, priority=6, deeper={'type': 'mol', 'mol': 'l_dopa', 'name': 'L-DOPA, a step on the way to melanin', 'button': 'See the molecule: L-DOPA, a step on the way to melanin'}),
  ]})

# ---- flight muscle: fibres packed with mitochondria, with capillaries between them ----
write({'id': 'robin_flight_muscle', 'tag': 'Inside a flight muscle', 'title': "Inside a robin's flight muscle", 'node': 'robin_flight_muscle_scene',
  'blurb': 'Muscle fibres running side by side, each packed with energy-making mitochondria, with fine blood vessels between them. Click a fibre, a mitochondrion or a vessel.',
  'note': 'Schematic. The sizes, the number of fibres and the number of mitochondria drawn are illustrative, not measurements. What is true to the animal: the fibres are striated muscle, flight muscle is packed with mitochondria, and fine blood vessels run between the fibres.',
  'bg': '#f2eee6', 'center': [0, 0, 0], 'D_um': 330,
  'labels': [{'text': 'Muscle fibre', 'at': [-120, 70, 80], 'pop': 'fibre'}, {'text': 'Mitochondria', 'at': [-120, 0, 80], 'pop': 'mito'}, {'text': 'Capillary (blood vessel)', 'at': [-120, -70, 80], 'pop': 'capillary'}],
  'populations': [
    pop('fibre', 'Flight muscle fibre', 'robin_muscle_fibre', 'tube_z', [34, 34, 220], '#d9776a', grid([-100, -50, -110], [5, 4, 1], [40, 40, 1], 0, .02), .55, priority=1, deeper={'type': 'cell', 'cell': 'animal'}),
    pop('mito', 'Mitochondrion', 'robin_mito', 'ellipsoid', [8, 6, 14], '#e8a04a', {'kind': 'inside', 'of': 'fibre', 'per': 9, 'margin': .75, 'seed': 5}, 1, ink=0, deeper={'type': 'mol', 'mol': 'atp', 'name': 'ATP', 'button': 'See the molecule: ATP, the energy currency'}, priority=4),
    pop('capillary', 'Capillary', 'robin_flight_muscle_scene', 'tube_z', [6, 6, 230], '#c0504a', grid([-80, -30, -115], [4, 3, 1], [40, 40, 1], 0, .01), .9),
  ]})

# ---- hollow bone: a thin wall, an air-filled space, struts and bone cells ----
write({'id': 'robin_bone', 'tag': 'Inside a bone', 'title': 'Inside a hollow bird bone', 'node': 'robin_bone_scene',
  'blurb': 'A slice across the hollow of a bird bone: two thin walls of dense bone, the air-filled space between them, struts across it and bone cells in the wall. Click a part.',
  'note': 'Schematic. The thickness of the wall, the width of the hollow, the number and thickness of struts and the size and number of bone cells are illustrative, not measurements on a robin. The air-filled space is shown empty.',
  'bg': '#f2eee6', 'center': [0, 0, 0], 'D_um': 1400,
  'labels': [{'text': 'Wall of compact bone', 'at': [-420, 260, 60], 'pop': 'wall'}, {'text': 'Air-filled space', 'at': [-420, 0, 60], 'pop': 'wall'}, {'text': 'Strut', 'at': [-120, 60, 60], 'pop': 'strut'}, {'text': 'Bone cell', 'at': [200, 300, 60], 'pop': 'cell'}],
  'populations': [
    pop('wall', 'Wall of compact bone', 'robin_bone_wall', 'rbox', [1000, 110, 160], '#e6dcc3', lst([0, 235, 0], [0, -235, 0]), .5, priority=2),
    pop('strut', 'Strut', 'robin_bone_strut', 'rbox', [14, 400, 90], '#ddd2b6', lst({'at': [-250, 0, 0], 'rot': [0, 0, 20]}, {'at': [-20, 0, 0], 'rot': [0, 0, -25]}, {'at': [220, 0, 0], 'rot': [0, 0, 15]}), 1, priority=3),
    pop('cell', 'Bone cell (osteocyte)', 'robin_osteocyte', 'ellipsoid', [26, 12, 12], '#9a7c56', {'kind': 'inside', 'of': 'wall', 'per': 7, 'margin': .8, 'seed': 9}, 1, ink=0, priority=5, deeper={'type': 'cell', 'cell': 'animal'}),
  ]})

# ---- retina: photoreceptors, with the cryptochrome hypothesis ----
write({'id': 'robin_retina', 'tag': 'Inside the retina', 'title': "Inside a robin's retina", 'node': 'robin_retina_scene',
  'blurb': 'Light-sensing cells (photoreceptors) of the retina, with fibres below them that run to the optic nerve. Click a cell or the small blue spheres that stand for cryptochrome.',
  'note': 'Schematic. The cell shapes and sizes, and the numbers drawn, are illustrative. Cryptochrome is drawn as small spheres inside the photoreceptors to show a hypothesis (a magnetic sensor): where it sits in the living retina is not shown by this picture, and the idea is not proved.',
  'bg': '#f2eee6', 'center': [0, 0, 0], 'D_um': 300,
  'labels': [{'text': 'Photoreceptor cell', 'at': [-120, 70, 30], 'pop': 'photoreceptor'}, {'text': 'Cryptochrome (hypothesis)', 'at': [-120, 20, 30], 'pop': 'cry'}, {'text': 'Nerve fibres to the optic nerve', 'at': [-120, -80, 30], 'pop': 'fibre'}],
  'populations': [
    pop('photoreceptor', 'Photoreceptor cell', 'robin_photoreceptor', 'cylinder', [9, 90, 9], '#c9a05a', grid([-90, 20, -30], [10, 1, 4], [18, 1, 18], 0, .02), .8, priority=2, deeper={'type': 'mol', 'mol': 'retinal', 'name': 'Retinal, the light-catching molecule', 'button': 'See the molecule: retinal, the light-catching molecule'}),
    pop('cry', 'Cryptochrome 4 (hypothesis)', 'robin_cryptochrome', 'ellipsoid', [4, 4, 4], '#4f6fb5', {'kind': 'inside', 'of': 'photoreceptor', 'per': 2, 'margin': .7, 'seed': 6}, 1, ink=0, priority=6, deeper={'type': 'mol', 'mol': 'fad', 'name': 'FAD, the light-absorbing cofactor of cryptochrome', 'button': 'See the molecule: FAD, the cofactor that absorbs the light'}),
    pop('fibre', 'Nerve fibres', 'robin_retina_scene', 'tube_x', [220, 5, 5], '#e9dfc4', grid([0, -90, -30], [1, 3, 4], [1, 12, 18], 0, .02), .9, priority=1),
  ]})
print('tissues written')
