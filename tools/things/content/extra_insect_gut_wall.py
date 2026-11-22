# Writes data/things/tissues/insect_gut_wall.json and data/nodes/tissue_insect_gut_wall.json.  Run from the repo root.
# Sizes in micrometres.  S = sourced (see .devtools/notes/tissues/insect_gut_wall.md), I = illustrative.
import json
# ---- numbers ----
EP_H = 40        # S: epithelium height 40 um (stingless bee Friesella) and 38 um (bumble bee Bombus morio); not measured on Apis
CELL_W = 18      # I: width of a digestive cell (its nucleus is ~14 um across, S-derived below)
NUC_D = 14       # S-derived: digestive-cell nuclear area 157 um2 (Bombus, posterior) -> sqrt(4*157/pi) = 14 um if round
MV_H = 12        # S: striated border 11.7 um posterior midgut (Friesella; anterior 23.5 um)
MV_D = 1.2       # I: drawn microvillus width (real ones are far thinner, so they are drawn fatter)
NEST_N, NEST_CELLS = 5, 2   # I nests drawn; S: two central regenerative cells per nest (honey bee queens)
REG_D = 7        # S-derived: regenerative nuclear area 26-44 um2 (Bombus) -> 6-7.5 um if round
BL_T = 1         # I: basal lamina drawn thickness
CM_T, LM_T = 4, 5   # I: circular and longitudinal muscle fibre thickness
PM_T = 10        # S (other insect): peritrophic matrix 9-12.6 um thick in silkworm larvae
TR_D = 1.2       # I: tracheole width drawn
NX = 12          # cells across
W = NX * CELL_W + 14
X0 = -NX * CELL_W / 2
Y_LM, Y_CM, Y_BL, Y_EP0 = -4.5, 1.5, 4.5, 5.5          # centres/bases of layers (I)
Y_EP1 = Y_EP0 + EP_H
Y_PM = Y_EP1 + MV_H + 3 + PM_T / 2
L = lambda items: {'kind': 'list', 'items': items}
cxs = [X0 + CELL_W * (i + .5) for i in range(NX)]
def pop(id, name, node, shape, size, color, opacity, arrange, material, deeper=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'arrange': arrange, 'ink': 1, 'material': material}
    if deeper: p['deeper'] = deeper
    return p
N = 'tissue_igw_'
nests = [X0 + CELL_W * k for k in (2, 4, 6, 9, 11)]   # on the boundaries between digestive cells (x = X0 + 18k)
regs = []
for k, x in enumerate(nests):
    for j in range(NEST_CELLS): regs.append({'at': [x + (j - .5) * 5, Y_EP0 + REG_D / 2 - .5, (j - .5) * 5]})  # pair 7.07 apart, spheres 7 wide, in the gap between cell feet
nuc = [{'at': [x, Y_EP0 + 24, z]} for x in cxs for z in (-14, 14)]
cells = {'kind': 'grid', 'origin': [cxs[0], Y_EP0 + EP_H / 2, -14], 'n': [NX, 1, 2], 'step': [CELL_W, 0, 28], 'jitter': 0}
mv_n = int(NX * CELL_W / (MV_D * 2.2))
scene = {'id': 'insect_gut_wall', 'title': 'Inside the wall of a honey bee\'s midgut', 'node': N + 'scene', 'bg': '#f3efe6', 'center': [0, 42, 0], 'D_um': 300,
  'tag': 'Inside a bee gut', 'cell': 'animal',
  'blurb': 'A slice through the wall of the honey bee\'s midgut. Food and the net-like peritrophic matrix are at the top, one layer of tall absorbing cells with a brush border is in the middle, and two thin muscle layers with air tubes lie below. Click a layer.',
  'note': 'Schematic, not a micrograph. Real sizes: the epithelium is about 40 micrometres tall (a stingless bee, 40 um; a bumble bee, 38 um; not measured in the honey bee), the brush border about 12 micrometres (stingless bee, rear midgut), the digestive-cell nucleus about 14 to 17 micrometres across (rear to front) and the regenerative-cell nucleus 6 to 7.5 micrometres (worked out from nucleus areas in a bumble bee), two regenerative cells per nest (honey bee queens), and the peritrophic matrix about 10 micrometres (silkworm larvae, a different insect). Illustrative: cell width, the number of cells and nests, the microvilli (drawn about ten times too thick and far too few), the basal lamina, the muscle and air-tube sizes, the food grains, and the layout. Cells are drawn as separate boxes; real cells touch and are joined along their sides. Regenerative cells are drawn in the gaps between the feet of digestive cells. Other cell types (endocrine cells) are not shown. The food is shown as pollen grains only; nectar and honey fill much of the gut but are not drawn. The scene is the honey bee midgut; other insects have a similar plan but differ in size.',
  'labels': [{'text': 'Food in the gut cavity', 'at': [-120, 96, 30], 'pop': 'food'}, {'text': 'Peritrophic matrix (chitin net round the food)', 'at': [-120, round(Y_PM), 30], 'pop': 'pm'}, {'text': 'Brush border (microvilli)', 'at': [-120, Y_EP1 + MV_H / 2, 30], 'pop': 'mv'}, {'text': 'Digestive cell (columnar)', 'at': [-120, Y_EP0 + 30, 30], 'pop': 'cells'}, {'text': 'Nest of regenerative cells', 'at': [-120, Y_EP0 + 4, 30], 'pop': 'regen'}, {'text': 'Basal lamina', 'at': [-120, Y_BL - 1, 30], 'pop': 'bl'}, {'text': 'Circular muscle', 'at': [-120, Y_CM - 2, 30], 'pop': 'cm'}, {'text': 'Longitudinal muscle', 'at': [-120, Y_LM - 3, 30], 'pop': 'lm'}, {'text': 'Tracheoles (air tubes)', 'at': [-120, -14, 30], 'pop': 'tr'}],
  'populations': [
    pop('food', 'Pollen grains in the gut cavity', N + 'food', 'ellipsoid', [16, 12, 16], '#e8c34a', .9, {'kind': 'random', 'n': 9, 'min': [-100, Y_PM + 10, -26], 'max': [100, Y_PM + 38, 26], 'gap': 2, 'seed': 7}, 'pollen'),
    pop('pm', 'Peritrophic matrix', N + 'pm', 'rbox', [W, PM_T, 64], '#bfd8e0', .5, L([{'at': [0, Y_PM, 0]}]), 'chitin', {'type': 'mol', 'mol': 'n_acetylglucosamine', 'name': 'N-acetylglucosamine, the unit that chitin chains are built from'}),
    pop('mv', 'Microvilli (brush border)', N + 'microvilli', 'cylinder', [MV_D, MV_H, MV_D], '#e29a7a', .95, {'kind': 'grid', 'origin': [X0 + 2, Y_EP1 + MV_H / 2, -18], 'n': [mv_n, 1, 3], 'step': [MV_D * 2.2, 0, 18], 'jitter': .15}, 'membrane'),
    pop('cells', 'Digestive cell (columnar)', N + 'digestive_cell', 'rbox', [CELL_W - .6, EP_H, 26], '#f0c8b4', .55, cells, 'animal_cells', {'type': 'cell'}),
    pop('nuc', 'Digestive-cell nucleus', N + 'digestive_cell', 'ellipsoid', [NUC_D, NUC_D + 3, NUC_D], '#6b4f86', .95, L(nuc), 'cell_nucleus'),
    pop('regen', 'Regenerative cell (in a nest)', N + 'regenerative', 'ellipsoid', [REG_D, REG_D - 1, REG_D], '#7aa3c8', .95, L(regs), 'animal_cells', {'type': 'cell'}),
    pop('bl', 'Basal lamina', N + 'basal_lamina', 'rbox', [W, BL_T, 64], '#8a6f4e', .9, L([{'at': [0, Y_BL, 0]}]), 'collagen'),
    pop('cm', 'Circular muscle fibre', N + 'muscle', 'tube_x', [W, CM_T, CM_T], '#c0574b', .92, L([{'at': [0, Y_CM, z]} for z in (-22, -8, 6, 20)]), 'muscle_fibre'),
    pop('lm', 'Longitudinal muscle fibre', N + 'muscle', 'tube_z', [LM_T, LM_T, 64], '#a8463c', .92, L([{'at': [x, Y_LM, 0]} for x in (-96, -66, -36, -6, 24, 54, 84)]), 'muscle_fibre'),
    pop('tr', 'Tracheole (air tube)', N + 'tracheole', 'tube_x', [W * .7, TR_D, TR_D], '#7a8c6a', .95, L([{'at': [-10, Y_LM - 4.5, -10]}, {'at': [20, Y_LM - 3.5, 12]}, {'at': [0, Y_BL - 1.5, 30]}]), 'insect_air_tube')]}
json.dump(scene, open('data/things/tissues/insect_gut_wall.json', 'w'), indent=1)
print('insect_gut_wall', len(scene['populations']), 'populations')
# ---- cards ----
EXT = [{'title': 'Midgut of the honey bee after an insecticide, control bees (ACS Environ Au 2026)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13003356'},
       {'title': 'Morphology and morphometry of the midgut in the stingless bee Friesella schrottkyi (Insects 2019)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6468588'}]
def card(id, title, summary, basics, deeper, expert, facts, parents=None, parts=None, ext=None, cert='C2', oq=None, refs=None, scale=4e-05):
    return {'id': N + id, 'title': title, 'kind': 'tissue', 'template': 'thing', 'scale_m': scale, 'area': 'bio_animals', 'parents': parents or [N + 'scene'], 'parts': parts or [], 'processes': [], 'related': ['bee_midgut'],
            'summary': summary, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': oq or [],
            'refs': refs if refs is not None else [['ANP', '4.2', '4-2-epithelial-tissue']], 'ext': ext if ext is not None else EXT}
PM_EXT = EXT + [{'title': 'Characteristics of the peritrophic matrix of the silkworm (Insects 2021)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8227122'}]
cards = [
 card('scene', 'Honey bee midgut wall in section', 'A slice through the wall of the midgut, where most digestion and absorption happens: a net round the food, one layer of tall cells, and thin muscle and air tubes below.',
  'The midgut is the part of the gut where food is broken down and the products are taken up. Its wall is thin. A net-like lining wraps the food, a single layer of tall cells does the work, and two thin muscle layers squeeze the food along.',
  'From the gut cavity outwards the layers are: food, the peritrophic matrix, the brush border, one layer of columnar digestive cells with small nests of regenerative cells at their feet, the basal lamina, circular muscle, longitudinal muscle. Air tubes (tracheoles) run in the space outside the muscle and bring oxygen to it. Many other insects have a similar plan, with different sizes and, in some groups, a different arrangement.',
  'In the honey bee the midgut epithelium is simple, with columnar digestive cells that have a well-developed brush border and basal nests of regenerative cells, and the matrix lies in the lumen as organised layers. Heights and lengths are known from other bees and are marked as such on the screen note. In flies the muscles and the epithelium share a basement membrane, and the muscles are a circular layer with longitudinal fibres over it.',
  [['Layers', 'matrix, brush border, one cell layer, basal lamina, two muscle layers'], ['Epithelium height', '≈ 40 µm (stingless bee; not measured in honey bee)'], ['Brush border', '≈ 12 µm (stingless bee, rear midgut)'], ['Shown', 'schematic; sizes marked on the screen note']],
  parents=['bee_midgut'], parts=[N + x for x in ('digestive_cell', 'microvilli', 'regenerative', 'pm', 'basal_lamina', 'muscle', 'tracheole', 'food')], ext=PM_EXT, scale=0.0003,
  oq=['The height of the honey bee midgut epithelium, the length of its brush border and the thickness of its peritrophic matrix have not been published; the values shown come from other bees and a silkworm.']),
 card('digestive_cell', 'Digestive cell of the midgut', 'The tall absorbing cell that forms the single cell layer of the midgut wall.',
  'These cells are tall, narrow and packed side by side in one layer. The top faces the food and carries a dense fringe of fingers. They make digestive enzymes, take up the products and pass them on to the body fluid.',
  'Each cell has one large round nucleus about 14 to 17 micrometres across (bumble bee) and is about 40 micrometres tall (stingless and bumble bees). The cell is replaced over time by cells that grow from the regenerative nests at its base.',
  'In bees the nucleus of a digestive cell is larger in the front of the midgut (area about 238 square micrometres) than in the rear (about 157), and the cells are more numerous per field in the rear. The diameter shown is worked out from the area, assuming a round section.',
  [['Height', '≈ 38 to 40 µm (bumble and stingless bee)'], ['Nucleus', '≈ 14 to 17 µm across (from area, bumble bee)'], ['Width', '18 µm (illustrative)']],
  ext=EXT + [{'title': 'Ultrastructure and immunofluorescence of the midgut of Bombus morio (C R Biologies 2014)', 'url': 'https://comptes-rendus.academie-sciences.fr/biologies/articles/10.1016/j.crvi.2014.04.002/'}]),
 card('microvilli', 'Brush border of microvilli', 'The dense fringe of finger-like cell extensions that faces the food and multiplies the surface for absorption.',
  'Each digestive cell is covered at the top with thousands of tiny fingers. Together they look like a brush, and they greatly enlarge the surface that touches the food.',
  'In a stingless bee the brush border is about 24 micrometres long in the front midgut and about 12 in the rear; in the bumble bee Bombus morio the rear brush border is about 8 micrometres. A stingless-bee study quotes an estimate of about a 200-fold increase in cell surface.',
  'Here the fingers are drawn about ten times too thick and far too few, since true ones are only a fraction of a micrometre wide and would blur the picture. The length shown is the rear-midgut value of a stingless bee, not a honey bee measurement.',
  [['Length', '≈ 12 µm (rear midgut), ≈ 24 µm (front), stingless bee'], ['Surface gain', 'about 200-fold (an estimate quoted in a stingless-bee study)'], ['Drawn width', '1.2 µm (illustrative)']],
  oq=['The front-to-rear difference in length has not been measured in the honey bee.']),
 card('regenerative', 'Regenerative cell nest', 'Small groups of unspecialised cells at the base of the epithelium that replace worn digestive cells.',
  'Between the feet of the tall cells sit small clusters of small, rounded cells. They do not reach the gut cavity. When digestive cells wear out, these cells grow into new ones.',
  'In honey bee queens each nest was found to hold two central regenerative cells, and the number of nests seen per section fell from about 14 in young queens to about 5 at 25 months. Nests are found along the whole midgut of bees.',
  'The nuclei of regenerative cells in a bumble bee are small, with an area of 26 to 44 square micrometres, which gives about 6 to 7.5 micrometres across if round; nests there held 4 to 20 nuclei. The count and layout drawn here are illustrative.',
  [['Cells per nest', '2 central cells (honey bee queens)'], ['Nest count', '≈ 14 to ≈ 5 per section, young to old queens'], ['Nucleus', '≈ 6 to 7.5 µm across (from area, bumble bee)']],
  ext=EXT + [{'title': 'Regenerative cells in the midgut of honey bee queens of different ages (Braz Arch Biol Technol 2024)', 'url': 'https://www.scielo.br/j/babt/a/z49MQyNxm5yCB4YSXVrPcPJ/?lang=en'}]),
 card('pm', 'Peritrophic matrix', 'A porous net of chitin and proteins that wraps the food inside the midgut and protects the cells.',
  'The food in the midgut is wrapped in a thin, tough, porous bag. It lets small digested molecules through to the cells but keeps rough particles and many germs away from the wall.',
  'It is built from chitin fibres held together by proteins and sugar-rich proteins. In a silkworm it is about 9 to 12.6 micrometres thick and gets thicker as the larva grows. In honey bees it is seen as organised layers in the gut cavity.',
  'Whether it is made along the whole midgut or in a ring at its front differs between insects. The thickness shown comes from a silkworm, not from a bee.',
  [['Thickness', '≈ 9 to 12.6 µm (silkworm larvae, not bee)'], ['Made of', 'chitin fibres, proteins']],
  ext=PM_EXT, refs=[], oq=['The thickness of the honey bee peritrophic matrix is not known; the silkworm value is shown.']),
 card('basal_lamina', 'Basal lamina', 'A thin sheet of fibrous protein under the epithelium, on which the cells sit.',
  'Under the cell layer lies a very thin sheet of protein fibres. The cells rest on it and it separates them from the muscle below.',
  'In the fruit fly this sheet is made of type IV collagen, laminin, nidogen and perlecan; the same is expected, but not shown, for bees. In flies it lies between the epithelium and the muscle layers and surrounds the muscle fibres.',
  'The thickness drawn (1 micrometre) is illustrative, not measured. Collagen is a stand-in material: this sheet holds type IV collagen, not rope-like fibres.',
  [['Made of', 'collagen IV, laminin, nidogen, perlecan (fly)'], ['Thickness', '1 µm drawn (illustrative)']],
  ext=[{'title': 'Epithelial cell polarity during Drosophila midgut development (Front Cell Dev Biol 2022)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9281564'}], refs=[['ANP', '4.2', '4-2-epithelial-tissue']]),
 card('muscle', 'Gut muscle layers', 'Two thin muscle layers around the midgut that squeeze and mix the food.',
  'Around the gut wall run thin muscle fibres: one layer circles the gut, another runs along its length. Their squeezing mixes the food and moves it on.',
  'In flies the circular fibres lie against the epithelium and the longitudinal fibres lie over them, and both share a sheet with the cell layer below. The honey bee gut is described with the same two layers, but the thickness of the honey bee gut muscle layers is not known.',
  'Fibre sizes drawn here (4 to 5 micrometres) are illustrative.',
  [['Layers', 'circular and longitudinal'], ['Fibre width', '4 to 5 µm (illustrative)']],
  ext=[{'title': 'Mmp2 and basement membrane remodeling of the visceral muscle in Drosophila (Sci Rep 2026)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12953612'}], refs=[['ANP', '4.4', '4-4-muscle-tissue-and-motion']]),
 card('tracheole', 'Tracheoles', 'The finest air tubes of an insect, bringing oxygen to the gut wall and its muscle.',
  'Insects breathe through a network of air tubes that branch finer and finer. The finest ones, tracheoles, reach the gut wall and carry air very near the cells that need it.',
  'Tracheoles are the thinnest, fluid-ended ends of the tubes. They are a side branch of the tubes that open to the outside through the body wall.',
  'The width and positions drawn here are illustrative.',
  [['Width', '1.2 µm drawn (illustrative)']], ext=[], refs=[], oq=['The width of the finest air tubes in the bee gut has not been measured; the width drawn is a stand-in.']),
 card('food', 'Food in the gut cavity', 'Pollen grains being digested, held inside the net-like matrix. Nectar and honey are not drawn.',
  'A bee eats nectar and pollen. In the midgut the pollen grains are broken open and their contents are digested and taken up.',
  'The grains drawn are tens of micrometres across in real life; their size here is illustrative. Nectar and honey fill much of the gut of a bee but are not drawn.',
  'The grain size and number drawn are illustrative.', [['Shown', 'pollen grains only, illustrative sizes']], ext=[], refs=[], cert='C1')]
json.dump(cards, open('data/nodes/tissue_insect_gut_wall.json', 'w'), indent=1)
print(len(cards), 'cards')
