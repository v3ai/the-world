# Writes data/things/tissues/hyaline_cartilage.json and data/nodes/tissue_hyaline_cartilage.json.  Run from the repo root.
# Sizes: chondron volumes and densities by depth zone are measured values (Kestila et al. 2018, healthy human articular
# cartilage, OARSI grade 0-1); the thickness of the cartilage and its water content are from Sophia Fox et al. 2009.
# Everything else (perichondrium thickness, cells in the perichondrium, vessels, fibres, cells inside lacunae) is illustrative.
import json, math, random
SLAB_X, SLAB_Z = 600, 90                   # drawn window, micrometres (illustrative window)
Y_TOP, Y_BOT = 330, -350                   # matrix runs from the perichondrium (top) down
PERI_T = 40                                # illustrative perichondrium thickness
# measured (Kestila 2018, OARSI 0-1): mean chondron volume um^3 (single / cluster) and density per mm^3, zones 1,2,3
VOL_SINGLE = [3465, 4410, 6354]; VOL_CLUSTER = [6589, 7244, 13576]; DENS = [3418, 5131, 4349]
BANDS = [(230, 320), (-60, 230), (-340, -60)]   # y ranges that stand in for zones 1,2,3 (a gradient, not a full joint surface)
SHAPE = [(1.00, 0.60, 0.72), (1.00, 0.83, 0.83), (1.00, 0.85, 0.81)]   # illustrative axis ratios (flatter near the surface); only the volume is measured
GROUP_FRAC = 0.2                           # illustrative share of chondrons that sit in groups
GROUP_N = [2, 3, 4]                        # illustrative cells per group
CELL_FRAC = 0.75                           # illustrative: cell diameter as a share of its lacuna's
def axes(vol, ratio):                      # ellipsoid axes with the given volume (pi/6 abc) and axis ratios
    k = (6 * vol / (math.pi * ratio[0] * ratio[1] * ratio[2])) ** (1 / 3)
    return [round(k * r, 1) for r in ratio]
def pop(id, name, node, shape, size, color, opacity, arrange, material, deeper=None, ink=1, **kw):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'arrange': arrange, 'material': material}
    if ink: p['ink'] = 1
    if deeper: p['deeper'] = deeper
    p.update(kw); return p
L = lambda items: {'kind': 'list', 'items': items}
rnd = random.Random(7); placed = []
def spot(band, size):                      # random centre in the band, not touching any earlier one
    r = max(size[0], size[1]) / 2 + 2
    for _ in range(4000):
        x = rnd.uniform(-SLAB_X / 2 + r, SLAB_X / 2 - r); y = rnd.uniform(band[0] + size[1] / 2, band[1] - size[1] / 2)
        z = rnd.uniform(-SLAB_Z / 2 + size[2] / 2, SLAB_Z / 2 - size[2] / 2)
        if all((x - a) ** 2 + (y - b) ** 2 > (r + rr) ** 2 for a, b, rr in placed):
            placed.append((x, y, r)); return [round(x, 1), round(y, 1), round(z, 1)]
    raise SystemExit('no room')
pops = [pop('matrix', 'Cartilage matrix', 'hc_matrix', 'rbox', [SLAB_X, Y_TOP - Y_BOT, SLAB_Z], '#c9dde2', .30, L([{'at': [0, (Y_TOP + Y_BOT) / 2, 0]}]), 'cartilage_matrix')]
counts = []
for z in range(3):
    band = BANDS[z]; vol = SLAB_X * SLAB_Z * (band[1] - band[0]) * 1e-9          # mm^3
    n = round(DENS[z] * vol); ng = round(n * GROUP_FRAC); ns = n - ng; counts.append((n, ng, ns))
    s_ax = axes(VOL_SINGLE[z], SHAPE[z]); g_ax = axes(VOL_CLUSTER[z], SHAPE[z])
    items = [{'at': spot(band, s_ax), 'rotY': round(rnd.uniform(0, 3.14), 2) if z else 0} for _ in range(ns)]
    pops.append(pop(f'lacuna{z+1}', 'Chondron: a cell with its space', 'hc_lacuna', 'ellipsoid', s_ax, '#e3eef0', .55, L(items), 'cartilage_matrix', ink=0))
    pops.append(pop(f'cell{z+1}', 'Chondrocyte', 'hc_chondrocyte', 'ellipsoid', [round(a * CELL_FRAC, 1) for a in s_ax], '#8f6fb0', .95,
        L([{'at': i['at'], 'rotY': i['rotY']} for i in items]), 'animal_cells', {'type': 'cell'}, priority=3))
    gitems = [{'at': spot(band, g_ax), 'rotY': round(rnd.uniform(0, 3.14), 2) if z else 0} for _ in range(ng)]
    pops.append(pop(f'group{z+1}', 'Isogenous group (cells from one cell, one shared space)', 'hc_group', 'ellipsoid', g_ax, '#d3e4e8', .5, L(gitems), 'cartilage_matrix', ink=0))
    d = round((6 * 0.5 * VOL_CLUSTER[z] / (GROUP_N[z] * math.pi)) ** (1 / 3), 1)
    pops.append(pop(f'gcell{z+1}', 'Chondrocyte in a group', 'hc_chondrocyte', 'ellipsoid', [d, round(d * .9, 1), round(d * .9, 1)], '#8f6fb0', .95,
        {'kind': 'inside', 'of': f'group{z+1}', 'per': GROUP_N[z], 'margin': .55, 'seed': 11 + z}, 'animal_cells', {'type': 'cell'}, priority=3))
# perichondrium at the top edge (illustrative thickness and contents)
yp = Y_TOP + PERI_T / 2
pops.append(pop('peri', 'Perichondrium', 'hc_perichondrium', 'rbox', [SLAB_X, PERI_T, SLAB_Z], '#e9c9b0', .45, L([{'at': [0, yp, 0]}]), 'collagen'))
pops.append(pop('pfibre', 'Collagen fibre bundle of the perichondrium', 'hc_perichondrium', 'cylinder', [3, SLAB_X - 20, 3], '#d9a66f', .95,
    L([{'at': [0, Y_TOP + 8 + 6 * k, -30 + 15 * k], 'dir': [1, 0, 0]} for k in range(5)]), 'collagen', ink=0))
pops.append(pop('fibroblast', 'Perichondrium fibroblast', 'hc_fibroblast', 'ellipsoid', [32, 6, 14], '#b58a6a', .95,
    L([{'at': [x, Y_TOP + 28 + (4 if i % 2 else 0), (-20 if i % 2 else 18)]} for i, x in enumerate(range(-250, 300, 100))]), 'animal_cells', {'type': 'cell'}))
pops.append(pop('capillary', 'Capillary in the perichondrium', 'hc_capillary', 'tube_z', [8, 8, SLAB_Z], '#d8645a', .95, L([{'at': [-160, Y_TOP + 20, 0]}, {'at': [190, Y_TOP + 22, 0]}]), 'vessel_wall'))
NOTE = ('Schematic, not a micrograph. Real: the size of one cartilage cell with its surrounding space (chondron) and how many sit in a cubic millimetre, from 3D X-ray imaging of healthy human knee cartilage '
  '(about 3,500 to 6,400 cubic micrometres for a single one, 6,600 to 13,600 for a cluster, 3,400 to 5,100 per cubic millimetre, by depth zone); the shapes drawn are ellipsoids of exactly those volumes, with axis ratios that are illustrative (flatter near the edge). '
  'Also real: joint-surface cartilage has no blood vessels (not sourced for rib cartilage), nutrients reach the cells through the matrix, and joint-surface cartilage has no perichondrium. Illustrative: the 600 micrometre window, the 40 micrometre perichondrium, its fibroblasts, fibres and capillaries, '
  'the cell inside each space (three quarters of its width), 2 to 4 cells per group, the share of cells in groups (one in five), the positions, and all colours. '
  'The three depth bands stand in for the three zones of joint-surface cartilage, which spans 2 to 4 mm, so this window is a thin slice of one kind, not a whole joint surface; the perichondrium belongs to windpipe, rib and nose cartilage. The capillary uses the vessel_wall material, which on zooming in shows a larger vessel wall with smooth muscle; a real capillary wall is a single lining cell layer.')
scene = {'id': 'hyaline_cartilage', 'title': 'Inside hyaline cartilage', 'node': 'hc_scene', 'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 800, 'tag': 'Inside cartilage', 'cell': 'animal',
  'blurb': 'A slice of glassy (hyaline) cartilage, as in the windpipe rings, ribs and nose. Cells sit alone or in small groups inside spaces in a matrix with no blood vessels, under a skin of connective tissue at the top. Click a cell, a group, the matrix or the skin.',
  'note': NOTE,
  'labels': [{'text': 'Perichondrium (the skin of the cartilage, with blood vessels)', 'at': [-300, 390, 50], 'pop': 'peri'}, {'text': 'Capillary: the only blood supply, outside the cartilage', 'at': [-300, 360, 50], 'pop': 'capillary'},
    {'text': 'Flattened cells near the edge', 'at': [-300, 275, 50], 'pop': 'cell1'}, {'text': 'Chondron: a cell with its space', 'at': [-300, 130, 50], 'pop': 'lacuna2'},
    {'text': 'Isogenous group: cells from one cell dividing', 'at': [-300, 0, 50], 'pop': 'group2'}, {'text': 'Matrix: no vessels (joint cartilage), no fibres you can see', 'at': [-300, -120, 50], 'pop': 'matrix'},
    {'text': 'Larger cells deeper in', 'at': [-300, -250, 50], 'pop': 'cell3'}],
  'populations': pops}
json.dump(scene, open('data/things/tissues/hyaline_cartilage.json', 'w'), indent=1)
print('populations', len(pops), 'chondrons by band (total, in groups, single):', counts, 'total', sum(c[0] for c in counts))
# ---------------- cards ----------------
SRC = 'Kestila et al. 2018; Sophia Fox et al. 2009'
def card(id, title, parents, scale, summary, basics, deeper, expert, facts, cert, oq=(), related=(), parts=()):
    return {'id': id, 'title': title, 'kind': 'tissue', 'template': 'thing', 'scale_m': scale, 'area': 'bio_animals', 'parents': list(parents), 'parts': list(parts), 'processes': [], 'related': list(related),
      'summary': summary, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': list(oq),
      'refs': [['ANP', '4.3', '4-3-connective-tissue-supports-and-protects']], 'ext': []}
vs, vc, de = VOL_SINGLE, VOL_CLUSTER, DENS
cards = [
 card('hc_scene', 'Inside hyaline cartilage', ['cartilage_tissue'], 0.001,
  'Glassy cartilage as seen in a thin slice: round cells alone or in small groups, each in its own space, in a firm matrix with no blood vessels.',
  'Hyaline cartilage lines the surfaces of moving joints and forms the rings of the windpipe, the ends of the ribs and the nose. Under the microscope it looks smooth and glassy because the matrix hides its fibres. The cells are few and far apart. Click a cell, a group, the matrix or the skin at the top.',
  'The cells (chondrocytes) make everything around them. Each sits in a small space called a lacuna. When a cell divides it stays close to its daughters, so cells often appear in small groups from one parent, called isogenous groups. In joint-surface cartilage there are no blood vessels in the matrix: food and oxygen soak in from the blood vessels of the perichondrium, or in a joint from the fluid in the joint, so cells live on little oxygen and the tissue heals slowly. In joint-surface cartilage the cells change with depth: flatter and smaller near the surface, rounder in the middle and larger deeper down. The slice drawn here shows that gradient in three bands but is only a thin piece; cartilage on a joint is 2 to 4 millimetres thick in people.',
  'Sizes in the scene: single cells with their surrounding space take 3,500 to 6,400 cubic micrometres from the surface band to the deepest band, groups 6,600 to 13,600, and cells are 3,400 to 5,100 per cubic millimetre, from imaging healthy human knee cartilage; the axis ratios of the drawn shapes are illustrative. These figures were measured in human knee cartilage. They are not known for windpipe, rib or nose cartilage, where the cell sizes and numbers may differ. The perichondrium thickness, its cells, fibres and capillaries, the group sizes and the cell inside each space are illustrative.',
  [['Cell with its space, single', f'about {vs[0]:,} to {vs[2]:,} cubic micrometres by depth (human knee cartilage, healthy)'], ['Cells in a cluster', f'about {vc[0]:,} to {vc[2]:,} cubic micrometres by depth'], ['Density', f'about {de[0]:,} to {de[1]:,} per cubic millimetre'], ['Cartilage thickness, joint surface', '2 to 4 mm'], ['Water in the cartilage', 'about 65% to 80% of its weight'], ['Cells share of volume (joint-surface cartilage)', 'about 2%'], ['Blood vessels in the matrix', 'none']],
  'C2', ['Do windpipe, rib and nose cartilage have the same cell sizes and densities as joint cartilage?'], ['cartilage_tissue', 'chondrocyte'], ['hc_matrix', 'hc_lacuna', 'hc_chondrocyte', 'hc_group', 'hc_perichondrium']),
 card('hc_matrix', 'Cartilage matrix', ['hc_scene'], 1e-4,
  'The firm, wet material between the cells, made of fine collagen fibres and large sugar-rich molecules that hold water.',
  'The matrix is most of the tissue: in joint-surface cartilage the cells are only about 2% of it. It is mostly water held by large molecules, with thin collagen fibres that you cannot see in a normal slice, which is why the tissue looks glassy. In joint-surface cartilage it has no blood vessels.',
  'The matrix near each cell differs from the matrix between cells. A thin shell around the cell is the pericellular matrix, a wider shell around it the territorial matrix, and the rest, the interterritorial matrix, fills most of the space. Water makes up 65% to 80% of the weight, and the collagen and the large proteoglycan molecules make up the rest of the dry weight. The pores of the matrix are very small, about 6 nanometres on average, so only small molecules such as food and oxygen move through it, and slowly.',
  'The water content falls from about 80% near the joint surface to about 65% in the deep zone. The drawn matrix is a plain translucent block; its collagen and proteoglycan content is not drawn.',
  [['Water', '65% to 80% of the weight (joint-surface cartilage)'], ['Average pore size', 'about 6 nm'], ['Blood vessels (joint-surface cartilage)', 'none']], 'C2', []),
 card('hc_lacuna', 'Lacuna: the space around a cartilage cell', ['hc_scene'], 2.5e-5,
  'A small cavity in the matrix that holds one cell.',
  'Each lacuna is a small hollow in the matrix. A living cell fills it, with a thin layer of special matrix around the cell. In stained slices the cell often shrinks and leaves a gap, which can make the space look empty.',
  'In the scene the space has the measured volume of a cell with its surrounding matrix (a chondron): about 3,500 cubic micrometres near the surface, about 4,400 in the middle and about 6,400 deeper down for single ones. They are drawn as ellipsoids of that volume, a little squashed and flatter near the surface; the axis ratios are illustrative.',
  'The volumes were measured in 3D on healthy human knee cartilage; the reported sphericity (0.81, 0.81 and 0.78 for single ones in the three depth zones) comes from a segmentation method and is not reproduced by the drawn shapes. Whether these numbers hold for other cartilage is not known from this source.',
  [['Volume, single', f'about {vs[0]:,} / {vs[1]:,} / {vs[2]:,} cubic micrometres (surface / middle / deep zone)'], ['Sphericity as reported', '0.78 to 0.81 (singles)']], 'C2', ['Are the spaces of windpipe and rib cartilage the same size as those of the knee?'], ['chondrocyte']),
 card('hc_chondrocyte', 'Chondrocyte in its space', ['hc_scene'], 1.5e-5,
  'The only kind of cell in cartilage: it makes and keeps the matrix around it.',
  'A chondrocyte is a rounded cell that sits in its space and makes the collagen and the water-holding molecules of the matrix. It lives on little oxygen, because there are no vessels nearby. Click it to look inside the cell.',
  'In joint-surface cartilage, cells make up about 2% of the volume. There, cells near the surface are flatter and smaller and closer together, and deeper ones are larger and rounder. Without blood vessels, they get most of their energy without oxygen. When cartilage is damaged, the few cells and their slow supply of food are one reason it heals poorly.',
  'The cell drawn in each space is three quarters of the width of its space, an illustrative choice; the measured volume is that of the cell together with its space.',
  [['Share of the tissue volume (joint-surface cartilage)', 'about 2%'], ['Energy', 'mostly without oxygen (anaerobic)']], 'C2', [], ['chondrocyte']),
 card('hc_group', 'Isogenous group', ['hc_scene'], 3.5e-5,
  'A small cluster of cartilage cells that came from the division of one cell and share one space.',
  'When a cartilage cell divides, its daughters cannot move far through the firm matrix, so they stay together and build a new wall of matrix between them. The result is a nest of two or more cells, called an isogenous group (from the Greek for the same origin).',
  'In the scene the whole nest has the measured volume of a cluster: about 6,600 cubic micrometres near the surface, about 7,200 in the middle and about 13,600 deeper down, which is roughly twice the volume of a single cell with its space. Two cells are drawn near the surface, three in the middle band and four in the deepest; the numbers of cells are illustrative.',
  'Clusters were distinguished from single cells in 3D images of healthy human knee cartilage, and are larger and a little less spherical (sphericity 0.72 to 0.78) than single ones. The share of cells in groups is not taken from the source; one in five is illustrative.',
  [['Volume of a cluster', f'about {vc[0]:,} / {vc[1]:,} / {vc[2]:,} cubic micrometres (surface / middle / deep zone)'], ['Cells per group in the scene', '2 to 4 (illustrative)']], 'C2', ['How many cells does a typical group hold, and does it depend on the cartilage?'], ['hc_chondrocyte']),
 card('hc_perichondrium', 'Perichondrium', ['hc_scene'], 4e-5,
  'The tough connective skin around most cartilage, which carries the blood vessels that feed it.',
  'The perichondrium wraps the cartilage of the windpipe, ribs and nose. It is made of dense connective tissue with many collagen fibres, flat cells between them and small blood vessels. The cartilage itself has none in these kinds, so its food comes from here by seeping through the matrix. Cartilage on the surface of a moving joint has no perichondrium.',
  'The thickness of 40 micrometres drawn here is illustrative; the fibres, flat cells and capillaries are schematic.',
  'The perichondrium is described as a layer of dense irregular connective tissue that encapsulates the cartilage. The thickness is not from the sources used for this scene.',
  [['Tissue type', 'dense irregular connective tissue'], ['Thickness in the scene', '40 micrometres (illustrative)']], 'C2', ['What is the thickness of the perichondrium in the windpipe, rib and nose?'], ['capillary']),
 card('hc_fibroblast', 'Perichondrium fibroblast', ['hc_perichondrium'], 3e-5,
  'A flat cell lying between the collagen fibres of the perichondrium.',
  'Fibroblasts make the collagen fibres of connective tissue. In the perichondrium they are flattened and lie parallel to the surface, along the fibres. Click to look inside the cell.',
  'The size and number drawn are illustrative.', 'Not measured here.',
  [['Size in the scene', '32 x 14 x 6 micrometres (illustrative)']], 'C3'),
 card('hc_capillary', 'Capillary beside the cartilage', ['hc_perichondrium'], 8e-6,
  'A tiny blood vessel in the perichondrium; nothing like it runs through the cartilage matrix.',
  'The cartilage is fed from vessels like this one in the perichondrium. Oxygen and food seep from here through the matrix to the cells, which is slow, so cells deep in the cartilage live on very little.',
  'In the scene the vessels are 8 micrometres across, an illustrative width, and there are two of them. No vessel is drawn in the matrix, as in joint-surface cartilage.',
  'Small vessels run in canals in the growing cartilage of young animals and in shark and ray cartilage. The blood supply of ordinary adult cartilage of the windpipe, ribs and nose lies in the perichondrium. The vessel wall shown on zooming in is that of a larger vessel: a real capillary wall is a single lining cell layer with no smooth muscle.',
  [['Vessels inside the matrix (joint-surface cartilage)', 'none']], 'C2'),
]
json.dump(cards, open('data/nodes/tissue_hyaline_cartilage.json', 'w'), indent=1)
print(len(cards), 'cards')
