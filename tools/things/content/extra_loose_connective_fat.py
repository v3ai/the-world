# Writes data/things/tissues/loose_connective_fat.json and data/nodes/tissue_loose_connective_fat.json.  Run from the repo root.
# Sources and the illustrative list: .devtools/notes/tissues/loose_connective_fat.md
import json, math, random
import tissue_material as TM
R = random.Random(11)
def pop(id, name, node, shape, size, color, opacity, arrange, material=None, deeper=None, extra=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    if material: p['material'] = material
    if extra: p.update(extra)
    return p
L = lambda items: {'kind': 'list', 'items': items}
# ---- numbers ----
D_FAT = 78.0                       # um, lean human mean adipocyte diameter 75-80 (source)
DROP = D_FAT * 0.9 ** (1 / 3)      # droplet diameter if it holds 90 % of cell volume (source), concentric sphere
D_RBC = 7.5                        # um, 7-8 (source)
D_CAP = 8.0                        # um lumen, range 5-10 (source); wall 1 um is illustrative
D_COL = 5.0                        # um collagen fibre, 2-10 (source)
D_MAST = 11.5                      # um, 10-13 (source)
D_GRAN = 1.2                       # um, granules 0.3-2 (source)
D_MAC = 20.0                       # um, 10-30 (source)
SEPT_H = 56.0                      # septum thickness: illustrative
# ---- adipocytes: lobules above and below a connective septum, two layers deep ----
cells = []
for side in (1, -1):
    for layer, zc in ((0, 0.0), (1, -68.0)):
        for row in range(4):
            y = side * (SEPT_H / 2 + D_FAT / 2 + 4 + row * 67.5 + (34 if layer else 0))
            for i in range(9):
                x = -320 + i * 80 + (40 if (row + layer) % 2 else 0) + R.uniform(-4, 4)
                cells.append((round(x, 1), round(y + R.uniform(-3, 3), 1), round(zc + R.uniform(-8, 8), 1)))
nuc = []
for (x, y, z) in cells:
    th = R.uniform(0, 2 * math.pi)
    r = D_FAT / 2 - 1.2
    nuc.append({'at': [round(x + r * math.cos(th), 1), round(y + r * math.sin(th), 1), z], 'rot': [0, 0, round(math.degrees(th), 1)]})
# ---- fibres in the septum ----
# Fibres are kept nearly parallel to the septum so that, whatever the rotation convention, no end reaches a fat-cell
# sphere (cell surfaces start at |y| about 32): |y0| + half-length * (sin dev + sin tilt) stays under about 28.
col, ela = [], []
for k in range(38):
    col.append({'at': [round(R.uniform(-300, 300), 1), round(R.uniform(-6, 6), 1), round(R.uniform(-45, 35), 1)],
                'rot': [round(R.uniform(-4, 4), 1), 0, round(90 + R.uniform(-6, 6), 1)], 'ln': 220})
for k in range(30):
    ela.append({'at': [round(R.uniform(-300, 300), 1), round(R.uniform(-8, 8), 1), round(R.uniform(-45, 35), 1)],
                'rot': [round(R.uniform(-4, 4), 1), 0, round(90 + R.uniform(-5, 5), 1)]})
col_items = [{'at': c['at'], 'rot': c['rot']} for c in col]
fib = [{'at': [x, y, z], 'rot': [0, 0, a]} for x, y, z, a in [(-230, 8, 30, 8), (-110, -14, -30, -12), (-20, 12, 36, 20), (90, -10, 28, -6), (190, 14, -34, 14), (260, -6, 20, 0)]]
cap_y, cap_z = 4.0, 6.0
rbc_x = [-210, -140, -85, 20, 70, 150, 215]
mast = [{'at': [-60, 16, 38]}]
mac = [{'at': [140, 18, 40], 'rot': [0, 0, 15]}, {'at': [-250, -16, 38], 'rot': [0, 0, -20]}]
pops = [
 pop('adipocyte', 'Fat cell (white adipocyte)', 'lcf_adipocyte', 'ellipsoid', [D_FAT] * 3, '#f4e7a8', .38, L([{'at': list(c)} for c in cells]), 'animal_cells', {'type': 'cell'}, {'priority': 1}),
 pop('droplet', 'Lipid droplet', 'lcf_lipid_droplet', 'ellipsoid', [round(DROP, 1)] * 3, '#f7d94c', .8, L([{'at': list(c)} for c in cells]), 'fat', {'type': 'mol', 'mol': 'tripalmitin', 'name': 'Tripalmitin, a typical fat (triglyceride) of a lipid droplet'}, {'priority': 2}),
 pop('nucleus', 'Nucleus pushed to the rim', 'lcf_adipocyte_nucleus', 'ellipsoid', [4, 14, 14], '#6b4f86', .95, L(nuc), 'cell_nucleus', None, {'priority': 4}),
 pop('collagen', 'Collagen fibre', 'lcf_collagen', 'cylinder', [D_COL, 220, D_COL], '#f1ece0', .9, L(col_items), 'collagen', None, {'priority': 3}),
 pop('elastic', 'Elastic fibre', 'lcf_elastic', 'cylinder', [1.5, 160, 1.5], '#c79a3a', .95, L(ela), 'protein', None, {'priority': 3}),
 pop('fibroblast', 'Fibroblast', 'lcf_fibroblast', 'ellipsoid', [44, 6, 12], '#c98a7a', .9, L(fib), 'animal_cells', {'type': 'cell'}, {'priority': 4}),
 pop('capillary', 'Capillary', 'lcf_capillary', 'tube_z', [D_CAP + 2, D_CAP + 2, 640], '#c4636a', .45, L([{'at': [0, cap_y, cap_z], 'rotY': 1.5708}]), None, None, {'priority': 3}),
 pop('rbc', 'Red blood cell', 'lcf_rbc', 'ellipsoid', [D_RBC, D_RBC, 2.0], '#c9302c', 1, L([{'at': [x, cap_y + R.uniform(-.4, .4), cap_z], 'rotY': 1.5708} for x in rbc_x]), 'red_blood_cell', {'type': 'mol', 'mol': 'heme_b', 'name': 'Haem, the iron-holding part of haemoglobin'}, {'priority': 5}),
 pop('mast', 'Mast cell', 'lcf_mast', 'ellipsoid', [D_MAST] * 3, '#7a5fa3', .75, L(mast), 'animal_cells', {'type': 'cell'}, {'priority': 4}),
 pop('granule', 'Mast cell granule', 'lcf_mast_granule', 'ellipsoid', [D_GRAN] * 3, '#e0b84a', 1, {'kind': 'inside', 'of': 'mast', 'per': 14, 'margin': .2, 'seed': 3}, None, {'type': 'mol', 'mol': 'histamine', 'name': 'Histamine, stored in the granules'}, {'priority': 5}),
 pop('macrophage', 'Macrophage', 'lcf_macrophage', 'ellipsoid', [D_MAC, 14, 16], '#8fb08a', .8, L(mac), 'animal_cells', {'type': 'cell'}, {'priority': 4}),
]
vol_fat = len(cells) * 4 / 3 * math.pi * (D_FAT / 2) ** 3
scene = {'id': 'loose_connective_fat', 'title': 'Inside fat and loose connective tissue', 'node': 'lcf_scene', 'tag': 'Inside fat tissue', 'cell': 'animal',
 'blurb': 'Two lobes of white fat cells with a thin sheet of loose connective tissue between them. Each fat cell is one big droplet with its nucleus squeezed to the edge; the sheet holds fibres, fibroblasts, a capillary with red blood cells, a mast cell and macrophages. Click anything.',
 'note': 'Schematic: shapes are simple solids and the fibres are straight. Sizes from sources: fat cell about 78 micrometres across (mean of 75-80 in lean people) with a droplet taking about 90 percent of the cell volume; collagen fibre 2-10 (drawn 5); capillary lumen 5-10 (drawn 8); red blood cell 7-8 (drawn 7.5); mast cell 10-13 (drawn 11.5) with granules 0.3-2 (drawn 1.2); macrophage 10-30 (drawn 20). Illustrative: every fat cell is drawn the same size (real ones vary widely), the layout and the thickness of the sheet (56), the lengths and number of fibres, the elastic fibre width (1.5), the fibroblast and nucleus sizes and shapes, the capillary wall (1), red cell thickness (2), the number of cells and where the cells sit. Collagen fibrils (50-90 nm) are far too thin to draw. Sizes are for people; other animals differ. In real fat only about one cell in five is a fat cell (the rest are supporting, immune and vessel cells); far fewer of those are drawn here, so the count of other cells is too low, though fat cells do take most of the volume as in life. Packed fat cells press into polygons; here they are spheres. Not drawn: the gel between the fibres, nerves, lymph vessels and the fine reticular fibres that wrap each fat cell.',
 'bg': '#f6f1e4', 'center': [0, 0, -20], 'D_um': 720,
 'labels': [{'text': 'Fat cell (white adipocyte)', 'at': [-330, 150, 40], 'pop': 'adipocyte'}, {'text': 'Lipid droplet', 'at': [-330, 215, 40], 'pop': 'droplet'}, {'text': 'Nucleus at the rim', 'at': [330, 120, 40], 'pop': 'nucleus'}, {'text': 'Collagen fibre', 'at': [-330, 30, 40], 'pop': 'collagen'}, {'text': 'Elastic fibre', 'at': [200, 32, 40], 'pop': 'elastic'}, {'text': 'Fibroblast', 'at': [-230, -34, 40], 'pop': 'fibroblast'}, {'text': 'Capillary with red blood cells', 'at': [-330, -4, 40], 'pop': 'capillary'}, {'text': 'Mast cell', 'at': [-60, 40, 40], 'pop': 'mast'}, {'text': 'Macrophage', 'at': [140, 44, 40], 'pop': 'macrophage'}],
 'populations': pops}
json.dump(TM.apply(scene), open('data/things/tissues/loose_connective_fat.json', 'w'), indent=1)
print('populations', len(pops), 'fat cells', len(cells), 'collagen', len(col), 'elastic', len(ela))
# ---------------- cards ----------------
SRC_OS = {'title': 'Connective Tissue Supports and Protects (OpenStax Anatomy and Physiology 2e, 4.3)', 'url': 'https://openstax.org/books/anatomy-and-physiology-2e/pages/4-3-connective-tissue-supports-and-protects'}
SRC_FR = {'title': 'Adipocyte size: lean mean 75-80 um (Frontiers in Cell and Developmental Biology review, 2022)', 'url': 'https://www.frontiersin.org/journals/cell-and-developmental-biology/articles/10.3389/fcell.2022.1003219/full'}
SRC_AO = {'title': 'The Adipose Organ Is a Unitary Structure in Mice and Humans (PMC9496043): droplet about 90% of cell volume', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9496043/'}
SRC_SC = {'title': 'Dissecting human adipose tissue heterogeneity (PMC11437900): fat cells are about 20% of cells but most of the volume', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11437900'}
SRC_HM = {'title': 'Connective tissue histology notes (howMed): fibre, cell and granule sizes', 'url': 'https://howmed.net/anatomy/histology/connective-tissue/'}
SRC_MC = {'title': 'Mast cells in human superficial fascia (PMC10380524): near vessel walls, among collagen bundles and elastic fibres, in loose connective tissue', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10380524/'}
SRC_OSF = {'title': 'Figure descriptions 4.12 and 4.13 on the same OpenStax 4.3 page (nucleus squeezed to one side, close to the cell membrane)', 'url': SRC_OS['url']}
SRC_RB = {'title': 'Erythrocytes (OpenStax Anatomy and Physiology 2e, 18.3)', 'url': 'https://openstax.org/books/anatomy-and-physiology-2e/pages/18-3-erythrocytes'}
SRC_BV = {'title': 'Structure and Function of Blood Vessels (OpenStax Anatomy and Physiology 2e, 20.1)', 'url': 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels'}
CT = ['ANP', '4.3', '4-3-connective-tissue-supports-and-protects']
def card(id, title, summ, basics, deeper, expert, facts, cert, refs, ext, oq=None, parents=('lcf_scene',), scale=1e-5, parts=(), related=()):
    return {'id': id, 'title': title, 'kind': 'tissue' if id == 'lcf_scene' else 'structure', 'template': 'thing', 'scale_m': scale, 'area': 'bio_animals', 'parents': list(parents), 'parts': list(parts), 'processes': [], 'related': list(related),
            'summary': summ, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': oq or [], 'refs': refs, 'ext': ext}
cards = [
 card('lcf_scene', 'Inside fat and loose connective tissue',
  'The layer under the skin and the padding round organs: big fat cells packed in lobes, and between them a thin web of fibres, small cells and blood vessels.',
  'Most of this tissue is fat cells, each one almost entirely a single droplet of fat. They sit in lobes. Between the lobes runs a thin sheet of loose connective tissue, a web of fibres with a few cells and a blood vessel. The fat cells store energy and cushion and insulate; the web holds them in place and brings food and oxygen.',
  'Fat cells are about 20 percent of the cells in white fat but take up most of its volume, because each one is so big. The other cells are mostly the supporting kind (fibroblasts and their young forms), immune cells and cells of the vessels. Sizes are for people. The loose connective tissue between lobes is the same kind that fills spaces between muscles and organs: random, web-like and with all the usual cells and fibres. Fat tissue has many capillaries so that fat can be stored and released quickly.',
  'In people the layer under the skin and the fat round many organs are mainly white fat, one big droplet per cell; the same plan is found in other mammals, but the sizes drawn are human. Brown fat, with many small droplets, is a different tissue and is not drawn. The scene is schematic: all fat cells are the same size and the fibres are straight. Real fat cells range from about 20 micrometres to several hundred, and size rises with body fat.',
  [['Fat cell diameter', '≈ 75-80 µm (mean, lean people); drawn 78 µm'], ['Fat cells among cells', '≈ 20% of cells, most of the volume'], ['Lipid droplet', '≈ 90% of the cell volume']],
  'C1', [CT], [SRC_OS, SRC_SC, SRC_FR],
  ['How many fat cells a body keeps through adult life, and how fast they turn over, differs between studies and between fat depots.'],
  parents=('adipose_tissue',), scale=7e-4, parts=['lcf_adipocyte', 'lcf_lipid_droplet', 'lcf_adipocyte_nucleus', 'lcf_collagen', 'lcf_elastic', 'lcf_fibroblast', 'lcf_capillary', 'lcf_rbc', 'lcf_mast', 'lcf_mast_granule', 'lcf_macrophage'], related=['adipose_tissue', 'adipocyte', 'fibroblast', 'capillary', 'macrophage']),
 card('lcf_adipocyte', 'Fat cell (white adipocyte)', 'A round cell filled almost entirely by one droplet of fat, with a thin rim of cytoplasm and a flattened nucleus at the edge.',
  'A white fat cell stores energy as fat. It swells as it fills and shrinks as the fat is used. Nearly all of its inside is one large droplet.',
  'The droplet pushes the rest of the cell into a thin rim, so the nucleus ends up flattened against the edge. In a stained slice this looks like a ring with a small bead on it. The cell is about as wide as a muscle fibre.',
  'Size depends on the body and the place: a mean of about 75-80 micrometres in lean people, rising with body fat to a plateau near 120. Size also differs between depots, and the cell can grow to several hundred micrometres. The scene draws every cell at 78 micrometres.',
  [['Diameter', '≈ 75-80 µm mean in lean people; range 20 to several hundred µm'], ['Drawn', '78 µm, all cells equal (illustrative)']], 'C1', [CT], [SRC_FR, SRC_OS], related=['adipocyte']),
 card('lcf_lipid_droplet', 'Lipid droplet', 'The single fat droplet that fills a white fat cell.',
  'The droplet is the cell\'s fuel store. It is made of fats called triglycerides, and it takes up almost the whole cell.',
  'A triglyceride is three fatty acids joined to one glycerol. The droplet is a liquid at body temperature. When the body needs energy, enzymes at its surface release fatty acids into the blood.',
  'About 90 percent of the volume of a white fat cell is the droplet. The scene draws a sphere of that volume share, about 96 percent of the cell diameter.',
  [['Share of cell volume', '≈ 90%'], ['Drawn diameter', '≈ 75 µm (0.9 of the cell volume as a sphere)']], 'C1', [CT], [SRC_AO]),
 card('lcf_adipocyte_nucleus', 'Nucleus of a fat cell', 'The cell nucleus, flattened and pushed to the edge of the cell by the droplet.',
  'Every fat cell has one nucleus. The big droplet squeezes it against the cell edge, so it looks like a thin crescent.',
  'The nucleus holds the cell\'s DNA and directs how it stores and releases fat. Because the droplet takes the middle, the nucleus is a flat lens against the membrane.',
  'Its position is the same in every cell of this kind; its size and shape in the scene (4 by 14 by 14 micrometres) are illustrative.',
  [['Position', 'at the rim, against the membrane'], ['Drawn size', '4 × 14 × 14 µm (illustrative)']], 'C1', [CT], [SRC_OS, SRC_OSF]),
 card('lcf_collagen', 'Collagen fibre', 'A strong, flexible rope of protein that holds loose connective tissue together.',
  'Collagen fibres are the main strong fibres of connective tissue. They resist stretching and hold tissues together as the body moves.',
  'Each fibre is a bundle of much thinner fibrils, 50 to 90 nanometres across, which are too small to draw. In loose tissue the fibres are thin, wavy and run in all directions, leaving spaces for fluid and cells.',
  'Fibre width is variable, about 2 to 10 micrometres; the scene draws 5. Lengths, directions and the number of fibres are illustrative.',
  [['Fibre width', '≈ 2-10 µm (drawn 5 µm)'], ['Fibril width inside', '≈ 50-90 nm (not drawn)']], 'C1', [CT], [SRC_OS, SRC_HM]),
 card('lcf_elastic', 'Elastic fibre', 'A thin stretchy fibre that lets connective tissue spring back.',
  'Elastic fibres are made mostly of a protein called elastin. After being stretched or squashed they return to their shape.',
  'They are thinner than collagen fibres and run among them. They are plentiful in skin, where they let it recoil.',
  'The width in the scene (1.5 micrometres) is illustrative; real widths vary.',
  [['Main protein', 'elastin'], ['Drawn width', '1.5 µm (illustrative)']], 'C1', [CT], [SRC_OS]),
 card('lcf_fibroblast', 'Fibroblast', 'The most common cell of connective tissue: it makes the fibres and the gel between them.',
  'Fibroblasts are long thin cells that lie along the fibres. They build and repair the web.',
  'They make collagen, elastic and reticular fibres and the gel of sugars and proteins in which the fibres sit. Their long narrow nucleus is typical. A resting one is smaller than an active one.',
  'The size and shape drawn (44 by 6 by 12 micrometres) are illustrative.',
  [['Makes', 'collagen, elastic and reticular fibres'], ['Drawn size', '44 × 6 × 12 µm (illustrative)']], 'C1', [CT], [SRC_OS], related=['fibroblast']),
 card('lcf_capillary', 'Capillary', 'The smallest blood vessel: a tube so narrow that red cells pass in single file.',
  'Capillaries bring oxygen and food to the fat cells and carry fat and waste away. Fat tissue has many of them.',
  'The wall is a single thin layer of cells on a base layer, so gases and small molecules pass through. Red blood cells squeeze through one at a time.',
  'The hollow is 5 to 10 micrometres across; the scene draws 8 with a wall of 1 (illustrative).',
  [['Hollow width', '≈ 5-10 µm (drawn 8 µm)'], ['Wall', 'one cell layer on a base layer; drawn 1 µm (illustrative)']], 'C1', [['ANP', '20.1', '20-1-structure-and-function-of-blood-vessels']], [SRC_BV, SRC_OS], related=['capillary']),
 card('lcf_rbc', 'Red blood cell', 'A disc of haemoglobin that carries oxygen, drawn at true width inside the capillary.',
  'Red blood cells carry oxygen. They are about as wide as the capillary they travel in.',
  'They are biconcave discs: plump at the rim and very thin in the middle. In the narrowest vessels they bend to pass.',
  'Mean diameter is 7 to 8 micrometres; the scene draws 7.5 and a thickness of 2 (illustrative). Real ones fold and bend in a capillary; here they stay flat.',
  [['Diameter', '≈ 7-8 µm (drawn 7.5)'], ['Shape', 'biconcave disc']], 'C1', [['ANP', '18.3', '18-3-erythrocytes']], [SRC_RB], related=['red_blood_cell']),
 card('lcf_mast', 'Mast cell', 'A small immune cell full of granules that raises the alarm when tissue is hurt.',
  'Mast cells are found in loose connective tissue, including around vessels. When irritated or damaged, they release histamine, which widens vessels and starts inflammation.',
  'Their granules hold histamine and heparin. Mast cells come from the same stem cells as blood cells and belong to the immune system.',
  'About 10 to 13 micrometres across; the scene draws 11.5 and a few granules for clarity (the real number is far larger).',
  [['Diameter', '≈ 10-13 µm (drawn 11.5)'], ['Granules drawn', '14 per cell (illustrative)']], 'C1', [CT], [SRC_OS, SRC_HM, SRC_MC]),
 card('lcf_mast_granule', 'Mast cell granule', 'A packet inside a mast cell that stores histamine and heparin.',
  'The granules are small bags. When the cell is triggered they are released.',
  'They hold histamine, which widens vessels and makes them leaky, and heparin.',
  'Granules are 0.3 to 2 micrometres; the scene draws 1.2. Their count is illustrative.',
  [['Size', '≈ 0.3-2 µm (drawn 1.2)']], 'C1', [CT], [SRC_OS, SRC_HM]),
 card('lcf_macrophage', 'Macrophage', 'A large roaming cell that eats debris and germs.',
  'Macrophages engulf germs and cell waste. Some move through the tissue; some stay in place.',
  'They come from a blood cell called a monocyte. When stimulated they release small signal proteins called cytokines. In fat tissue they are among the immune cells.',
  'Size ranges from 10 to 30 micrometres; the scene draws about 20 by 14 by 16, and places two. The shape is illustrative.',
  [['Diameter', '≈ 10-30 µm (drawn ≈ 20)']], 'C1', [['ANP', '21.2', '21-2-barrier-defenses-and-the-innate-immune-response'], CT], [SRC_OS, SRC_HM], related=['macrophage']),
]
json.dump(cards, open('data/nodes/tissue_loose_connective_fat.json', 'w'), indent=1)
print(len(cards), 'cards')
