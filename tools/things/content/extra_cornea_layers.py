# Writes data/things/tissues/cornea_layers.json and data/nodes/tissue_cornea_layers.json.  Run from the repo root.
# Sources: see .devtools/notes/tissues/cornea_layers.md.  Lengths in micrometres.
import json, math
import tissue_material as TM
M = dict(epi=52.5, bow=17.7, strom=459.1, desc=7.0, endo=5.0,   # IOVS 2011 (OCT), Indian J Ophthalmol 2018
         lam_n=200, lam_t=2.0)                                 # lamellae: Meek & Knupp 2015
W, Dp = 300, 100   # width and depth of the drawn slab (illustrative window)
y_endo = M['endo']/2; y_desc = M['endo'] + M['desc']/2
s0 = M['endo'] + M['desc']; y_str = s0 + M['strom']/2
b0 = s0 + M['strom']; y_bow = b0 + M['bow']/2
e0 = b0 + M['bow']; top = e0 + M['epi']
def pop(id, name, node, shape, size, color, opacity, arrange, material=None, deeper=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    if material: p['material'] = material
    return p
L = lambda items: {'kind': 'list', 'items': items}
pitch = M['strom'] / M['lam_n']
lam_y = [s0 + (i + .5) * pitch for i in range(M['lam_n'])]
# epithelium: basal 20 um tall, three wing rows of 8, one flat surface row (5 layers; real: 5-7)
base_h = 20.0; sup_h = 5.0; wing_h = (M['epi'] - base_h - sup_h) / 3   # surface cell 2-6 um thick (source A)
pops = [
 pop('sup', 'Surface cell (flat)', 'cornea_epithelium', 'ellipsoid', [50, sup_h, 50], '#d9e6ea', .85,
     {'kind': 'grid', 'origin': [-125, top - sup_h/2, -25], 'n': [6, 1, 2], 'step': [50, 0, 50]}, None, {'type': 'cell', 'cell': 'animal'}),
 pop('wing', 'Wing cell', 'cornea_epithelium', 'ellipsoid', [18, wing_h, 18], '#bcd3dc', .85,
     {'kind': 'grid', 'origin': [-140.6, e0 + base_h + wing_h/2, -37.5], 'n': [16, 3, 5], 'step': [18.75, wing_h, 18.75], 'jitter': .04}, None, {'type': 'cell', 'cell': 'animal'}),
 pop('basal', 'Basal cell', 'cornea_epithelium', 'rbox', [10, base_h, 10], '#9fbfcc', .9,
     {'kind': 'grid', 'origin': [-145, e0 + base_h/2, -45], 'n': [30, 1, 10], 'step': [10, 0, 10]}, None, {'type': 'cell', 'cell': 'animal'}),
 pop('bowman', 'Bowman layer', 'cornea_bowman', 'rbox', [W, M['bow'], Dp], '#e9dfc9', .95, L([{'at': [0, y_bow, 0]}]), 'collagen'),
 pop('lam_a', 'Collagen lamella (running left to right)', 'cornea_stroma', 'rbox', [W, M['lam_t'], 70], '#efe6d2', .55,
     L([{'at': [0, lam_y[i], 0]} for i in range(0, M['lam_n'], 2)]), 'collagen'),
 pop('lam_b', 'Collagen lamella (running front to back)', 'cornea_stroma', 'rbox', [70, M['lam_t'], Dp], '#e3d6bb', .55,
     L([{'at': [0, lam_y[i], 0]} for i in range(1, M['lam_n'], 2)]), 'collagen'),
 pop('kerato', 'Keratocyte', 'cornea_keratocyte', 'ellipsoid', [24, 3, 24], '#7a8f6a', .95,
     {'kind': 'random', 'n': 80, 'min': [-135, s0 + 6, -40], 'max': [135, b0 - 6, 40], 'gap': 1, 'seed': 11}, None, {'type': 'cell', 'cell': 'animal'}),
 pop('desc', 'Descemet membrane', 'cornea_descemet', 'rbox', [W, M['desc'], Dp], '#d8c7a0', .95, L([{'at': [0, y_desc, 0]}]), 'protein'),
 pop('endo', 'Endothelial cell', 'cornea_endothelium', 'rbox', [17, M['endo'], 17], '#c9a7c4', .95,
     {'kind': 'grid', 'origin': [-141, y_endo, -42.5], 'n': [17, 1, 6], 'step': [17.6, 0, 17], 'jitter': .03}, None, {'type': 'cell', 'cell': 'animal'}),
]
scene = {'id': 'cornea_layers', 'tag': 'Inside the cornea', 'cell': 'animal', 'title': 'The cornea in section', 'node': 'cornea_layers_scene', 'bg': '#f3efe6',
 'center': [0, top/2, 0], 'D_um': 720,
 'blurb': 'A slice through the clear front window of the human eye, outside at the top. Five layers: a thin skin of cells, a tough sheet, a thick stack of collagen sheets with a few flat cells, a thin membrane, and a single layer of pump cells. Click a layer.',
 'note': ('Schematic; the scene shows the human cornea only; the dog has no distinct Bowman layer and the robin was not checked, so it must not be attached to them. Classic five-layer description. Real sizes: central thickness of the layers (epithelium 52.5, Bowman layer 17.7, stroma 459.1 micrometres, from an optical-coherence-tomography study of 120-odd... see notes) '
          'Descemet membrane 7 and endothelium 5 micrometres (review article); about 200 collagen lamellae, each up to 0.2 mm broad and 2 micrometres thick; 5-7 epithelial cell layers (5 drawn); basal cell about 20 micrometres tall; surface cells 40-60 micrometres across and 2-6 micrometres thick (5 drawn; the wing cells take up the rest, so their height is illustrative); the surface cells are living and not keratinised; '
          'endothelial cell width 17 micrometres is calculated from a birth density of 3,500 cells per square millimetre (adults have fewer, larger cells). Illustrative: the 300 by 100 micrometre window, the cell widths of basal and wing cells, the keratocyte size and number (80 drawn; real keratocytes may be up to 15 percent of stromal volume), '
          'the alternating lamella directions, and the gaps between lamellae (drawn about 2.6 micrometres wide; in life the sheets lie in contact with thin ground substance and cells). The collagen fibrils inside a lamella (about 31 nanometres wide) are far too thin to draw at this scale. Layer sizes sum to a little more than the measured total because the sources differ (layers 541 against a measured 529 micrometres).'),
 'labels': [{'text': 'Epithelium, about 53 micrometres', 'at': [-150, top - 10, 52], 'pop': 'sup'},
            {'text': 'Bowman layer, about 18', 'at': [-150, y_bow, 52], 'pop': 'bowman'},
            {'text': 'Stroma: about 200 lamellae, 459', 'at': [-150, y_str, 52], 'pop': 'lam_a'},
            {'text': 'Keratocyte (flat cell between lamellae)', 'at': [-150, y_str - 120, 52], 'pop': 'kerato'},
            {'text': 'Descemet membrane, about 7', 'at': [-150, y_desc + 14, 52], 'pop': 'desc'},
            {'text': 'Endothelium, about 5', 'at': [-150, -14, 52], 'pop': 'endo'}],
 'populations': pops}
scene['note'] = scene['note'].replace('from an optical-coherence-tomography study of 120-odd... see notes) ', 'from an optical-coherence-tomography study) ')
json.dump(TM.apply(scene), open('data/things/tissues/cornea_layers.json', 'w'), indent=1)
print('populations', len(pops), 'top', round(top, 1))

# ---------------- cards ----------------
def card(id, title, summary, basics, deeper, expert, facts, parents=('cornea_layers_scene',), parts=(), cert='C2', oq=(), refs=(), kind='structure'):
    return {'id': id, 'title': title, 'kind': kind, 'template': 'tissue', 'scale_m': 5e-4, 'area': 'bio_animals', 'parents': list(parents), 'parts': list(parts), 'processes': [], 'related': [],
            'summary': summary, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': list(oq), 'refs': list(refs),
            'ext': [{'title': 'Anatomy of cornea and ocular surface (Indian Journal of Ophthalmology, 2018)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5819093/'}]}
cards = [
 card('cornea_layers_scene', 'The cornea in section',
  'The cornea is the clear window at the front of the eye, a little over half a millimetre thick, built from five layers.',
  'Light enters the eye through the cornea, and it does most of the bending of that light. From the outside in, the layers are a skin of cells (epithelium), a tough sheet (Bowman layer), a thick stack of collagen sheets (the stroma), a thin membrane (Descemet membrane) and a single layer of cells (endothelium).',
  'The cornea has no blood vessels, which is part of why it is clear. Most of its thickness is the stroma, whose collagen sheets are laid down in a regular way. The thin cell layers on either side protect it and keep it from swelling with water.',
  'This scene is the human cornea, drawn as a flat slice 300 micrometres wide. The sizes of the layers are measured; the cell sizes inside the epithelium and the number of keratocytes are illustrative. The dog has no distinct Bowman layer, and the robin was not checked, so this scene is not for them.',
  [['Total thickness, centre', '≈ 529 µm (range 473–585) by optical coherence tomography; the layers below come from two sources and sum to about 541 µm'], ['Epithelium', '≈ 52.5 µm'], ['Bowman layer', '≈ 17.7 µm'], ['Stroma', '≈ 459 µm'], ['Descemet membrane', '≈ 7 µm'], ['Endothelium', '≈ 5 µm']],
  parents=(), parts=['cornea_epithelium', 'cornea_bowman', 'cornea_stroma', 'cornea_keratocyte', 'cornea_descemet', 'cornea_endothelium'], cert='C2',
  oq=['How the layers compare in the dog and in birds was not checked here, so the scene claims nothing about them.', 'Sources give different thicknesses for Bowman layer and Descemet membrane, because the layers thicken with age and the methods differ.'],
  refs=[['BIO', '36.5', '36-5-vision']], kind='structure'),
 card('cornea_epithelium', 'Corneal epithelium',
  'The outer skin of the cornea: about five to seven layers of cells, roughly 50 micrometres deep.',
  'The outer layer is a skin of cells a few cells thick. It keeps dust and germs out, and its surface cells are flat. Tears spread over it make a smooth surface for light.',
  'The cells form a stack: tall basal cells on the bottom, which divide to renew the layer, rounder wing cells above them, and flat surface cells on top (living, not keratinised as skin is). Cells move upward as they age and are shed from the surface.',
  'In the scene the stack has five layers (the lower end of the real five to seven). The basal cell height and the surface cell width are from a source; the basal and wing cell widths are chosen for the picture.',
  [['Thickness', '≈ 52.5 µm'], ['Cell layers', '5–7 (5 drawn)'], ['Basal cell height', '≈ 20 µm'], ['Surface cell width', '40–60 µm'], ['Surface cell thickness', '≈ 2–6 µm (5 drawn)']], cert='C2'),
 card('cornea_bowman', 'Bowman layer',
  'A tough, cell-free sheet just under the epithelium, about 12 to 18 micrometres thick.',
  'Under the outer skin lies a thin sheet with no cells in it. It is made of tightly packed collagen fibres and gives the front of the cornea a firm base.',
  'Unlike the stroma below it, the sheet has no neat stack of layers. Measurements place it between about 12 and 18 micrometres depending on the method, and thicker toward the edge of the cornea than at the centre.',
  'The scene uses 17.7 micrometres, the central value from a scan study. Another source gives 12 micrometres.',
  [['Thickness, centre', '≈ 17.7 µm (another source: 12 µm)']], cert='C2'),
 card('cornea_stroma', 'Corneal stroma and its lamellae',
  'The bulk of the cornea: about 200 flat sheets of collagen, stacked like plywood, about 459 micrometres in all.',
  'About 85 to 90 percent of the cornea (sources differ) is this layer. It is made of about 200 thin sheets (lamellae) of collagen fibres. Each sheet is about 2 micrometres thick and up to 0.2 millimetres broad.',
  'Within a sheet the fibres all point the same way and all have nearly the same width, about 31 nanometres, with a fixed spacing. That regular spacing is what lets light pass through instead of scattering. Neighbouring sheets run in different directions.',
  'The scene draws 200 sheets in two alternating directions as a stand-in for the real mix of directions. The fibres themselves are far too thin to appear at this scale, and the drawn sheets are cut off at 300 micrometres.',
  [['Thickness, centre', '≈ 459 µm'], ['Lamellae through the thickness', '≈ 200 (another count: 200–250)'], ['Lamella size', 'up to 0.2 mm broad, 2 µm thick'], ['Collagen fibre width', '≈ 31 nm']], cert='C2'),
 card('cornea_keratocyte', 'Keratocyte',
  'A flat cell lying between the collagen sheets of the stroma.',
  'The cells in the stroma are keratocytes. They are flattened to fit between the sheets and look after the collagen around them.',
  'Together such cells could make up as much as 15 percent of the stromal volume. They repair the stroma after injury.',
  'The scene draws 80 of them at 24 micrometres wide and 3 micrometres thick, both chosen for the picture; at the real share by volume there would be many more.',
  [['Share of stromal volume', 'up to ≈ 15 %'], ['Size in scene', 'illustrative']], cert='C3', oq=['The true size and number of keratocytes in a 300 by 100 micrometre slice was not taken from a source.']),
 card('cornea_descemet', 'Descemet membrane',
  'A thin membrane under the stroma, about 7 micrometres thick, that the endothelial cells rest on.',
  'The inner cells of the cornea sit on this thin, strong membrane. It is the layer they build.',
  'It gets thicker through life. The value drawn is one review’s figure for the adult cornea.',
  'Sources give different values; together with the Bowman layer it is under 5 percent of the cornea’s thickness. Its material is drawn here as protein; it is made mainly of type IV collagen and laminin.',
  [['Thickness', '≈ 7 µm']], cert='C2'),
 card('cornea_endothelium', 'Corneal endothelium',
  'A single layer of cells, about 5 micrometres thick, on the inner face of the cornea.',
  'This one-cell layer pumps water out of the stroma, which keeps the cornea clear. Cells in it do not renew well, so their number falls through life.',
  'At birth there are about 3,500 cells in each square millimetre, and the density falls by about 0.6 percent a year in adults.',
  'The scene draws cells 17 micrometres wide, which is the width of a cell at the birth density if each takes an equal share of the area (a calculation, not a measurement). Adult cells are larger and fewer.',
  [['Thickness', '≈ 5 µm'], ['Cell density at birth', '≈ 3,500 per mm²'], ['Yearly loss, adult', '≈ 0.6 %']], cert='C2'),
]
json.dump(cards, open('data/nodes/tissue_cornea_layers.json', 'w'), indent=1); print(len(cards), 'cards')
