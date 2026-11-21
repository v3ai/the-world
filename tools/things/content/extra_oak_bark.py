# Writes data/things/tissues/oak_bark.json and data/nodes/tissue_oak_bark.json.  Run from the repo root.
# Sizes in micrometres.  S = sourced (see .devtools/notes/tissues/oak_bark.md), I = illustrative.
import json
# ---- numbers ----
CORK_W = 40       # S: phellem cell ~40 um in tangential direction (Quercus suber, Sci Rep 2019)
CORK_H = 20       # I: radial height of a cork cell
CORK_ROWS = 12    # S: periderm usually 10-30 layers of phellem (Quercus, Plants 2024); 12 drawn
PHG_H = 10        # I: phellogen cell height; 2 layers
PD_H, PD_N = 25, 3  # I height; S: phelloderm 2-5 layers (Quercus)
FIB_D = 14        # I: fibre diameter (length 650-850 um is S, along the axis, not drawn)
FIB_BAND = 5      # S: fibre bands about five cells wide (Quercus)
SIEVE_D = 16      # S-derived: sieve tube area 150-300 um2 -> ~14-20 um across if round
RAY_W = 10        # S: broad rays commonly more than 10-seriate (Quercus)
RAY_CELL = 12     # I: width of one ray cell
YW0, YC0 = -200, 0          # I: bottom of drawn wood, cambium base
Y_PH0, Y_OLD0, Y_PD0, Y_PG0, Y_CK0 = 45, 300, 620, 695, 715   # I: layer boundaries (radial, outwards = up)
Y_TOP = Y_CK0 + CORK_ROWS * CORK_H
X0, X1 = -300, 300
RAYX = RAY_W * RAY_CELL // 2 + 6
L = lambda items: {'kind': 'list', 'items': items}
def pop(id, name, node, shape, size, color, opacity, items, deeper=None, material=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'arrange': L([{'at': [round(x, 1), round(y, 1), z]} for x, y, z in items])}
    if deeper: p['deeper'] = deeper
    if material: p['material'] = material
    return p
CELL = {'type': 'cell'}
def row(y, step, off=0, xs=(X0, X1), skip_ray=True, z=0):
    out, x = [], xs[0] + off
    while x <= xs[1]:
        if not (skip_ray and abs(x) < RAYX): out.append((x, y, z))
        x += step
    return out
P = []
# cork
cork = [p for r in range(CORK_ROWS) for p in row(Y_CK0 + CORK_H / 2 + r * CORK_H, CORK_W, (r % 2) * CORK_W / 2, skip_ray=False)]
P.append(pop('cork', 'Cork cell (phellem)', 'oak_bark_phellem', 'rbox', [CORK_W, CORK_H, CORK_W], '#b88a5a', .95, cork, material='bark'))
P.append(pop('phellogen', 'Cork cambium (phellogen)', 'oak_bark_cork_cambium', 'rbox', [CORK_W, PHG_H, CORK_W], '#7fb069', .9, [p for k in range(2) for p in row(Y_PG0 + PHG_H / 2 + k * PHG_H, CORK_W, 0, skip_ray=False)], CELL))
P.append(pop('phelloderm', 'Phelloderm cell', 'oak_bark_phelloderm', 'rbox', [32, PD_H, 32], '#a9c98b', .85, [p for k in range(PD_N) for p in row(Y_PD0 + PD_H / 2 + k * PD_H, 34, (k % 2) * 17)], CELL))
# old phloem: fibre bands, crushed sieve tubes, parenchyma
def band(y0, spans):
    return [p for k in range(FIB_BAND) for a, b in spans for p in row(y0 + FIB_D / 2 + k * FIB_D, FIB_D + 1, (k % 2) * 7, (a, b))]
fib = band(Y_OLD0 + 75, [(-300, -150), (110, 300)]) + band(Y_OLD0 + 220, [(-300, -210), (-150, -80), (90, 220)])
P.append(pop('fibre', 'Phloem fibre', 'oak_bark_phloem_fibres', 'tube_z', [FIB_D, FIB_D, 60], '#e6d9a8', 1, fib, material='cellulose'))
crushed = [p for y in (352, 358, 508, 514) for p in row(y, 30, (y % 4) * 5)]
P.append(pop('crushed', 'Crushed sieve tube', 'oak_bark_crushed_sieve', 'rbox', [24, 4, 40], '#b9a77d', .95, crushed, material='plant_wall'))
oldpar = [p for y in (312, 336, 468, 492, 607) for p in row(y, 34, (y % 3) * 8)]
P.append(pop('oldpar', 'Phloem parenchyma cell', 'oak_bark_phloem_parenchyma', 'ellipsoid', [26, 22, 26], '#d9c27a', .85, oldpar, CELL))
# living phloem
sv, cc, pc = [], [], []
for i in range(10):
    y = Y_PH0 + 14 + 24 * i
    for x, _, _ in row(y, 40, (i % 2) * 20, (X0, X1 - 30)):
        sv.append((x, y, 0)); cc.append((x + 14, y, 0)); pc.append((x + 27, y, 0))
P.append(pop('sieve', 'Sieve tube element', 'oak_bark_sieve_tube', 'tube_z', [SIEVE_D, SIEVE_D, 60], '#8fd0c8', .9, sv, CELL))
P.append(pop('companion', 'Companion cell', 'oak_bark_sieve_tube', 'tube_z', [8, 8, 60], '#e8b04a', .95, cc, CELL))
P.append(pop('phpar', 'Phloem parenchyma cell', 'oak_bark_phloem_parenchyma', 'ellipsoid', [10, 16, 10], '#d9c27a', .85, pc, CELL))
# vascular cambium
P.append(pop('cambium', 'Vascular cambium cell', 'oak_bark_vascular_cambium', 'rbox', [36, 10, 36], '#4f9d6a', .9, [p for k in range(4) for p in row(YC0 + 5 + k * 10, 38, (k % 2) * 19)], CELL))
# ray
ray = [(-RAY_W * RAY_CELL / 2 + RAY_CELL / 2 + i * RAY_CELL, y, 0) for i in range(RAY_W) for y in [YW0 + 14 + 28 * j for j in range(int((Y_PD0 - YW0) / 28))]]
P.append(pop('ray', 'Ray (living cells running outwards)', 'oak_bark_ray', 'rbox', [RAY_CELL, 26, RAY_CELL], '#c78fa6', .9, ray, CELL))
# first wood
vess = [(-190, -95, 0), (195, -90, 0)]
fx = [(x, y, 0) for k in range(int(-YW0 / 15)) for (x, y, _) in row(-8 - 15 * k, 16, (k % 2) * 8) if abs(x) >= RAYX and all((x - vx) ** 2 + (y - vy) ** 2 > 72 ** 2 for vx, vy, _ in vess)]
P.append(pop('vessel', 'Wood vessel (first wood)', 'oak_bark_first_wood', 'tube_z', [120, 120, 60], '#5aa0d8', .6, vess, material='wood'))
P.append(pop('woodfibre', 'Wood fibre', 'oak_bark_first_wood', 'tube_z', [13, 13, 60], '#c9a36a', 1, fx, material='wood'))
scene = {'id': 'oak_bark', 'tag': 'Inside oak bark', 'cell': 'plant', 'title': 'Bark of a young oak stem in section', 'node': 'oak_bark_scene', 'bg': '#f3efe6', 'center': [0, 380, 0], 'D_um': 1350,
  'blurb': 'A slice from the outside of a young oak stem, with one cork layer, into the wood. Dead cork on top, then the cork-making layer, then old phloem with fibres and crushed tubes, the living phloem, the cambium and the first wood. A ray runs from the wood through the cambium and the phloem. Click a layer.',
  'note': 'Schematic, not a micrograph; the cells are simple boxes and tubes. Real or sourced: a cork cell about 40 micrometres across and 1 micrometre wall (cork oak), 10 to 30 layers of cork cells, 2 to 5 layers of phelloderm, phloem fibre bands about 5 cells wide (fibres 650 to 850 micrometres long, along the axis, not shown), sieve tubes of 150 to 300 square micrometres in section (about 16 micrometres across if round), rays more than 10 cells wide (in some Chinese Quercus species only; the same paper also reports uniseriate phloem rays). The 10 to 30 cork layers and 2 to 5 phelloderm layers are typical values; some species have far more. Shows a young stem with one periderm: old oak bark (rhytidome) is thicker and furrowed, with several periderms and dead phloem between them. Cork cell numbers are from cork oak, the other numbers from Chinese oak species; none measured on English oak. The ray is drawn as a broad one, which is not true of every oak, and it stops in the old phloem below the phelloderm. Illustrative: the height of each cork cell, every layer thickness (the layers are drawn about 1 mm in all, a real bark is far thicker), fibre and wood-cell widths, the vessel size, the number and position of cells, and the ray width in micrometres.',
  'labels': [{'text': 'Dead cork cells (phellem), in radial rows', 'at': [-470, 840, 40], 'pop': 'cork'}, {'text': 'Cork cambium (phellogen)', 'at': [-470, 705, 40], 'pop': 'phellogen'}, {'text': 'Phelloderm', 'at': [-470, 657, 40], 'pop': 'phelloderm'}, {'text': 'Old phloem: fibre band', 'at': [-470, 410, 40], 'pop': 'fibre'}, {'text': 'Crushed sieve tubes', 'at': [-470, 355, 40], 'pop': 'crushed'}, {'text': 'Living phloem: sieve tubes', 'at': [-470, 170, 40], 'pop': 'sieve'}, {'text': 'Vascular cambium', 'at': [-470, 20, 40], 'pop': 'cambium'}, {'text': 'First wood: vessel and fibres', 'at': [-470, -100, 40], 'pop': 'vessel'}, {'text': 'Ray', 'at': [80, 520, 40], 'pop': 'ray'}],
  'populations': P}
json.dump(scene, open('data/things/tissues/oak_bark.json', 'w'), indent=1); print('oak_bark', len(P), 'populations', sum(len(p['arrange']['items']) for p in P), 'cells', 'top', Y_TOP)
# ---- cards ----
def card(id, title, parent, scale, summary, basics, deeper, expert, facts, cert, refs=None, oq=None, related=None, kind='tissue'):
    return {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': 'bio_ecology', 'parents': [parent], 'parts': [], 'processes': [], 'related': related or [], 'summary': summary,
            'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': oq or [], 'refs': refs or [['BIO', '30.2', '30-2-stems']]}
R = lambda *a: [list(x) for x in a]
S = 'oak_bark_scene'
cards = [
 card(S, 'Bark of a young oak stem in section', 'oak_bark', 0.001, 'A slice through oak bark from the outside in: dead cork, the cork-making layer, old phloem with tough fibres, the living phloem, the cambium and the first wood.',
  'Bark is everything outside the wood. Its outer part is dead and protective; its inner part, the phloem, carries sugar down from the leaves. Between the phloem and the wood a thin layer of dividing cells, the cambium, adds wood inward and phloem outward. Click a layer.',
  'Oak bark is built in rings of time. The cork-making layer adds cork to the outside, and as the trunk swells the outer phloem is stretched, crushed and stiffened with fibres. In oaks the layer of working phloem is narrow, and a wide ray of living cells runs through the whole bark like a spoke, carrying sugar sideways.',
  'Only some sizes in the scene are measured. The cork cell width, the number of cork layers, the layers of phelloderm, the width of the fibre bands, the sieve tube section and the ray width come from published work on oaks. All layer thicknesses, the height of cork cells and the wood cells are illustrative, and the whole slice is far thinner than the bark of an old trunk. It shows a young stem with one cork layer; old oak bark has several cork layers with dead phloem between them and is deeply furrowed. Cork cell size is from cork oak and the other numbers from Chinese oak species, none from English oak.',
  R(['Cork layers', 'typically 10 to 30 (Quercus, Chinese species study; some species have far more)'], ['Phelloderm layers', 'typically 2 to 5 (some species up to ten or more)'], ['Shown', 'schematic; sizes marked on the screen note']), 'C2', related=['oak_bark', 'oak_cambium']),
 card('oak_bark_phellem', 'Cork cells (phellem)', S, 4e-5, 'Dead, box-shaped cells stacked in radial rows, with walls sealed by a waxy polymer, forming the outer skin of the bark.',
  'Each cork cell is dead and filled with air. Its wall is coated with suberin, a waxy material that keeps water and gases out, which is why cork floats and insulates.',
  'Every cell in one radial row came from a single cell of the cork cambium, so the rows are straight and the cells have no gaps between them. Seen from above they look like honeycomb hexagons; seen in section, like a brick wall. All the rows are drawn alike.',
  'In cork oak the wall is about 1 micrometre thick and about 40 micrometres across tangentially; the wall is mostly suberin with lignin and polysaccharides. The radial height drawn here is illustrative.',
  R(['Width of a cell (tangential)', '≈ 40 µm (cork oak)'], ['Wall thickness', '≈ 1 µm (cork oak)'], ['Layers', 'typically 10 to 30 (some oaks far more)'], ['Height of a cell as drawn', '20 µm (illustrative)']), 'C2', related=['oak_cork']),
 card('oak_bark_cork_cambium', 'Cork cambium (phellogen)', S, 1e-5, 'A thin layer of dividing cells that makes cork outward and phelloderm inward.',
  'These are the only living, dividing cells near the surface. They split to add dead cork cells on the outside and a few living cells on the inside.',
  'Because it divides in two directions, the cork cambium makes far more cork than phelloderm. When the bark cracks or a new cork layer starts deeper in the phloem, the old one is cut off with everything outside it, and that dead mass becomes the rough outer bark.',
  'Drawn as two flat layers; the real number of layers and their height are illustrative.',
  R(['Layers drawn', '2 (illustrative)']), 'C1', related=['oak_cork']),
 card('oak_bark_phelloderm', 'Phelloderm', S, 3e-5, 'A few layers of living, thin-walled cells on the inner side of the cork cambium.',
  'Phelloderm cells are alive and look like ordinary round storage cells. They sit between the cork cambium and the phloem.',
  'They are the inward product of the cork cambium. They are living parenchyma cells, which may store starch.',
  'Two to five layers are typical in Quercus, though some species have up to ten or more; three are drawn, each 25 micrometres tall as an illustrative height.',
  R(['Layers', 'typically 2 to 5 (some oaks more)'], ['Height of a layer as drawn', '25 µm (illustrative)']), 'C2'),
 card('oak_bark_phloem_fibres', 'Phloem fibres', S, 1.5e-5, 'Long, thick-walled dead cells in tangential bands that stiffen the bark.',
  'Fibres are like tiny ropes. In the old phloem they form bands that run around the trunk, making the bark tough and hard to tear.',
  'The bands are about five cells wide and are broken up as the trunk grows. The inner part of a fibre wall is a thick layer rich in cellulose. Each fibre is far longer than wide, so a section shows only its round end.',
  'Fibres from oak bark are about 650 to 850 micrometres long; the diameter and the gaps in the bands drawn here are illustrative.',
  R(['Fibre length', '650 to 850 µm (oaks)'], ['Band width', '≈ 5 cells (oaks)'], ['Fibre diameter as drawn', '14 µm (illustrative)']), 'C2', refs=R(['BIO', '30.2', '30-2-stems'])),
 card('oak_bark_crushed_sieve', 'Crushed sieve tubes', S, 1e-5, 'Old sugar-carrying tubes that have been flattened and no longer work.',
  'A sieve tube works for a short time. Once the bark behind it grows outward, the tube is squashed flat and its place is taken by newer tubes nearer the cambium.',
  'In oaks the working phloem is narrow, and collapsed sieve tubes lie close to the cambium. The flattened walls stay as thin dark lines between the fibre bands and parenchyma cells.',
  'The flat shape and number drawn are illustrative.', R(['Thickness as drawn', '≈ 4 µm (illustrative)']), 'C1', refs=R(['BIO', '30.5', '30-5-transport-of-water-and-solutes-in-plants'])),
 card('oak_bark_phloem_parenchyma', 'Phloem parenchyma', S, 2e-5, 'Living storage cells scattered between the tubes and fibres of the phloem.',
  'These round cells store starch and other food and pass sugar sideways. They stay alive far longer than the tubes beside them.',
  'In the old phloem some of these cells swell and divide so that the bark can stretch around a thickening trunk.',
  'Size and number drawn are illustrative.', R(['Size as drawn', '≈ 25 µm (illustrative)']), 'C1'),
 card('oak_bark_sieve_tube', 'Sieve tubes and companion cells', S, 1.6e-5, 'Living tubes that carry sugar-rich sap down the trunk, each with a small helper cell beside it.',
  'A sieve tube is a living cell with its inside emptied out to leave an open pipe. Its small companion cell keeps it running. Together they carry sugar from the leaves to the rest of the tree.',
  'Sieve tube elements are joined end to end through perforated plates. In oaks each element is about 200 to 350 micrometres long. Their cross-section is small, so the tubes are narrow compared with the vessels of the wood.',
  'Sieve tube cross-section is 150 to 300 square micrometres in most oaks measured, which is about 14 to 20 micrometres across if round; 16 is drawn. Companion cells are drawn at 8 micrometres, which is illustrative.',
  R(['Length of a tube element', '200 to 350 µm (oaks)'], ['Cross-section', '150 to 300 µm² (most oaks)'], ['Diameter if round (calculated)', '≈ 14 to 20 µm']), 'C2', refs=R(['BIO', '30.5', '30-5-transport-of-water-and-solutes-in-plants'])),
 card('oak_bark_vascular_cambium', 'Vascular cambium', S, 1e-5, 'The thin layer of dividing cells that makes new wood inward and new phloem outward.',
  'The cambium is a ring of cells that never stop dividing. Cells it cuts off inward become wood; cells cut off outward become phloem. This is how a trunk gets thicker.',
  'The ray cells of the bark and wood come from the same cambial cells, so a ray is one continuous strip through the cambium. A single year\'s cambium makes much more wood than phloem.',
  'The drawn thickness (four flat cell layers) is illustrative. In cork oak the average yearly growth is about 4.1 millimetres of wood and 0.43 millimetres of phloem.',
  R(['Wood made per year (cork oak)', '≈ 4.1 mm'], ['Phloem made per year (cork oak)', '≈ 0.43 mm'], ['Layers drawn', '4 (illustrative)']), 'C2', related=['oak_cambium']),
 card('oak_bark_ray', 'Ray', S, 1.2e-4, 'A broad strip of living cells that runs sideways from the wood through the cambium into the bark.',
  'Rays are the trunk\'s spokes. Living cells in them carry sugar and stored food sideways, between the phloem and the wood, and store food.',
  'In some oaks the rays are broad, more than ten cells across, and over a millimetre tall; the same study also found narrow one-cell-wide phloem rays. In the outer bark the ray widens like a fan to make room for the growing trunk, and many of its cells stiffen into stone cells.',
  'The ray is drawn as a broad one, ten cells wide, the minimum for broad rays in some oaks, so it is not typical of every oak; the cell width of 12 micrometres, and the straight edge drawn, are illustrative.',
  R(['Width', 'more than 10 cells in some Chinese oak species (Plants 2024); the same paper also reports uniseriate phloem rays'], ['Height', 'more than 1 mm in broad rays of some oak species'], ['Cell width as drawn', '12 µm (illustrative)']), 'C2'),
 card('oak_bark_first_wood', 'First wood: vessel and fibres', S, 1.2e-4, 'The newest wood next to the cambium: wide water pipes among dense, thick-walled fibres.',
  'Wood carries water up the tree. The wide holes are vessels, empty dead tubes that water rises in. The small thick-walled cells around them give strength.',
  'Oak is ring-porous: large vessels form in spring and sit in a ring next to smaller cells, so the first wood of a season has the widest pipes.',
  'The vessel and fibre sizes and positions are illustrative here.', R(['Vessel width as drawn', '120 µm (illustrative)'], ['Fibre width as drawn', '13 µm (illustrative)']), 'C1', refs=R(['BIO', '30.5', '30-5-transport-of-water-and-solutes-in-plants']), related=['oak_growth_rings']),
]
EXT = {'oak_bark_scene': [('Comparative anatomy of bark in 10 Quercus species (Plants 2024)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11244080/')],
       'oak_bark_phellem': [('Four hundred years of cork imaging (Sci Rep 2019)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6928211')],
       'oak_bark_vascular_cambium': [('Chemical characterization of cork, phloem and wood of Quercus suber (2019)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6909139')]}
for c in cards:
    if c['id'] in EXT: c['ext'] = [{'title': t, 'url': u} for t, u in EXT[c['id']]]
json.dump(cards, open('data/nodes/tissue_oak_bark.json', 'w'), indent=1); print(len(cards), 'cards')
