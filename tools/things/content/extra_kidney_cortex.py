# Writes data/things/tissues/kidney_cortex.json and data/nodes/tissue_kidney_cortex.json.  Run from the repo root (python3 tools/things/content/extra_kidney_cortex.py).
# All lengths are micrometres. Sourced sizes: glomerulus 201 um (adult men, PMC2375741, from volume assuming a sphere); PCT 44.0 and DCT 40.2 um long outer diameter (mouse, Karger Kidney Blood Press Res 46:229).
# Everything else is illustrative and listed in the scene note.
import json, math, random, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tissue_material as TM
GLOM = 201.0          # source: mean glomerular diameter, human, 720 glomeruli
GAP = 15.0            # illustrative: Bowman space width
CAPS = GLOM + 2 * GAP # illustrative: capsule outer size
PCT_D, DCT_D = 44.0, 40.2   # source: mouse, long outer diameters
CAP_D = 9.0           # illustrative peritubular capillary diameter
SLAB = 70.0           # illustrative thickness of the section
CX, CY = -230.0, 0.0  # corpuscle centre
rnd = random.Random(11)
def pop(id, name, node, shape, size, color, opacity, arrange, priority, deeper=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'priority': priority, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    return p
L = lambda items: {'kind': 'list', 'items': items}
# --- place tubule sections (end-on) without overlap, outside the corpuscle ---
placed = []   # (x, y, r)
def free(x, y, r, pad):
    if math.hypot(x - CX, y - CY) < CAPS / 2 + r + 6: return False
    return all(math.hypot(x - a, y - b) >= r + c + pad for a, b, c in placed)
def put(n, d, pad, first=None):
    out = []
    if first: placed.append((*first, d / 2)); out.append(first)
    g = 0
    while len(out) < n and g < 20000:
        g += 1
        x, y = rnd.uniform(-405, 405), rnd.uniform(-250, 250)
        if free(x, y, d / 2, pad): placed.append((x, y, d / 2)); out.append((x, y))
    return out
pct = put(9, PCT_D, 14, first=(CX + CAPS / 2 + PCT_D / 2 - 2, 8.0))   # first one starts at the urinary pole
dct = put(4, DCT_D, 14)
cap = put(26, CAP_D, 3)
LUM = 20.0
villi = []
for (x, y) in pct:
    for z in (-22, 0, 22):
        for k in range(16):
            a = 2 * math.pi * (k + (0.5 if z else 0)) / 16
            r = LUM / 2 - 2.5
            villi.append({'at': [round(x + r * math.cos(a), 2), round(y + r * math.sin(a), 2), z], 'dir': [round(math.cos(a), 3), round(math.sin(a), 3), 0]})
vx = CX - CAPS / 2   # vascular pole on the left
note = ('Schematic, not a micrograph: shapes are simple solids and the tubules are cut across so that each shows as a ring. Real sizes: the glomerular tuft is drawn 201 micrometres across, the mean of 720 glomeruli in 24 normal adult men, calculated from volume assuming a sphere '
        '(Weibel and Gomez method revisited, PMC2375741); the proximal tubule is drawn 44 and the distal tubule 40 micrometres across, the long outer diameters measured in mouse kidney sections (Kidney and Blood Pressure Research 46:229), '
        'used here as a stand-in because no dog value was found; tubule diameters differ between species and with how they are measured, and in people the proximal tubule is said to be about 60 micrometres across (a textbook summary, not opened here), so the tubules are drawn narrower than human, and a human distal tubule is clearly narrower than the proximal one, which this pair does not show. The glomerulus size is human only: reported dog renal corpuscles are said to be about half as wide (about 120 micrometres for the whole corpuscle; a thesis seen only in a search snippet and not confirmed here), so this scene is not claimed for the dog. Illustrative sizes: the width of Bowman space (15 micrometres), the capsule, the capillary loops inside the tuft, '
        'the two arterioles, the peritubular capillaries (9 micrometres), the clear space inside each tubule, the microvilli of the brush border (drawn 5 micrometres long and 1.2 micrometres thick so that they can be seen; real ones are thought to be shorter, about 1 to 2 micrometres, and far thinner, about 0.1 micrometre, neither measured here), the thickness of the slice (70 micrometres, so the glomerulus is drawn whole and uncut, larger than the thickness of the cut-across tubules), how many tubules are drawn and where they lie. '
        'Human sizes for the glomerulus; other mammals share the shape only. Not drawn: the macula densa, the mesangium, the podocytes, the collecting ducts, the connective tissue between the tubules and the junction of the capsule with the tubule (the first tubule section lies against the capsule on the side opposite the vessels, with no opening drawn). Vessels are drawn as straight stubs that stop at the capsule. A bird kidney differs: most of its nephrons are the loopless, reptilian type (about 75-80 percent in domestic fowl) and only a minority have a loop of Henle; this scene has not been drawn for a robin and no robin sizes were found.')
D = {'id': 'kidney_cortex', 'title': 'Kidney cortex: a glomerulus and its tubules', 'node': 'kidney_cortex_scene', 'tag': 'Inside the kidney cortex', 'cell': 'animal', 'bg': '#f3efe6', 'center': [0, 0, 0], 'D_um': 900,
 'blurb': 'A thin slice of the outer kidney: one renal corpuscle (a tuft of capillaries inside its capsule), tubules cut across with a fuzzy brush border on the proximal ones, and small capillaries between. Glomerulus size is human; a bird kidney differs. Click a part.',
 'note': note,
 'labels': [{'text': 'Glomerulus: tuft of capillaries (about 200 micrometres)', 'at': [CX - 100, 150, 40], 'pop': 'tuft'},
            {'text': 'Bowman capsule and space', 'at': [CX - 105, -135, 40], 'pop': 'capsule'},
            {'text': 'Afferent (wider) and efferent (narrower) arterioles; drawn stopping at the capsule', 'at': [vx - 85, 30, 40], 'pop': 'arterioles'},
            {'text': 'Proximal tubule with brush border', 'at': [pct[1][0] - 40, pct[1][1] + 45, 40], 'pop': 'pct'},
            {'text': 'Distal tubule', 'at': [dct[0][0] - 30, dct[0][1] + 40, 40], 'pop': 'dct'},
            {'text': 'Peritubular capillary', 'at': [cap[0][0] + 12, cap[0][1] + 14, 40], 'pop': 'peri'}],
 'populations': [
  pop('capsule', 'Bowman capsule', 'kidney_cortex_capsule', 'ellipsoid', [CAPS, CAPS, CAPS], '#d9c7e0', .18, L([{'at': [CX, CY, 0]}]), 2),
  pop('tuft', 'Glomerulus (capillary tuft)', 'kidney_cortex_tuft', 'ellipsoid', [GLOM, GLOM, GLOM], '#d98a80', .5, L([{'at': [CX, CY, 0]}]), 3),
  pop('loops', 'Glomerular capillary loop', 'kidney_cortex_tuft', 'ellipsoid', [10, 10, 44], '#b8352f', .95, {'kind': 'inside', 'of': 'tuft', 'per': 16, 'margin': 12, 'seed': 5, 'orient': 'free'}, 4),
  pop('arterioles', 'Afferent arteriole', 'kidney_cortex_arterioles', 'tube_x', [80, 16, 16], '#c9564f', .95, L([{'at': [vx - 35, CY + 22, 0]}]), 4),
  pop('efferent', 'Efferent arteriole', 'kidney_cortex_arterioles', 'tube_x', [80, 12, 12], '#c9564f', .95, L([{'at': [vx - 35, CY - 22, 0]}]), 4),
  pop('pct', 'Proximal convoluted tubule (cut across)', 'kidney_cortex_pct', 'tube_z', [PCT_D, PCT_D, SLAB], '#e0a68a', .95, L([{'at': [x, y, 0]} for x, y in pct]), 3, {'type': 'cell', 'cell': 'animal'}),
  pop('pct_lumen', 'Inside of a proximal tubule', 'kidney_cortex_pct', 'tube_z', [LUM, LUM, SLAB + 4], '#eef4f6', .9, L([{'at': [x, y, 0]} for x, y in pct]), 4),
  pop('brush', 'Brush border (microvilli)', 'kidney_cortex_brush', 'cylinder', [1.2, 5, 1.2], '#7a4b3a', 1, L(villi), 5),
  pop('dct', 'Distal convoluted tubule (cut across)', 'kidney_cortex_dct', 'tube_z', [DCT_D, DCT_D, SLAB], '#c9b0d9', .95, L([{'at': [x, y, 0]} for x, y in dct]), 3, {'type': 'cell', 'cell': 'animal'}),
  pop('dct_lumen', 'Inside of a distal tubule', 'kidney_cortex_dct', 'tube_z', [LUM + 2, LUM + 2, SLAB + 4], '#eef4f6', .9, L([{'at': [x, y, 0]} for x, y in dct]), 4),
  pop('peri', 'Peritubular capillary', 'kidney_cortex_peritubular', 'tube_z', [CAP_D, CAP_D, SLAB], '#c0392b', .95, L([{'at': [x, y, 0]} for x, y in cap]), 4)]}
MAT = {'capsule': 'lining', 'arterioles': 'vessel_wall', 'efferent': 'vessel_wall', 'pct_lumen': 'water', 'brush': 'membrane', 'dct_lumen': 'water'}
for p in D['populations']:
    if p['id'] in MAT: p['material'] = MAT[p['id']]
D = TM.apply(D)
json.dump(D, open('data/things/tissues/kidney_cortex.json', 'w'), indent=1)
print('kidney_cortex', len(D['populations']), 'populations;', len(pct), 'PCT', len(dct), 'DCT', len(cap), 'capillaries', len(villi), 'microvilli')
# ---------------- cards ----------------
def card(id, title, summary, basics, deeper, expert, facts, certainty='C2', oq=None, refs=None, kind='structure'):
    return {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': 2e-4, 'area': 'bio_animals', 'parents': ['kidney_cortex_scene'] if id != 'kidney_cortex_scene' else ['renal_cortex'],
            'parts': [], 'processes': [], 'related': ['nephron', 'glomerulus', 'renal_cortex'], 'summary': summary, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert},
            'facts': facts, 'certainty': certainty, 'open_questions': oq or [], 'refs': refs or [['ANP', '25.4', '25-4-microscopic-anatomy-of-the-kidney']]}
ILL = 'Illustrative, not measured'
cards = [
 card('kidney_cortex_scene', 'Inside the kidney cortex', 'A thin slice of the outer part of a mammalian kidney: one renal corpuscle where blood is filtered, the tubules that carry the filtrate away, and the small blood vessels between them.',
  'Blood is filtered in a tuft of capillaries called the glomerulus. The fluid that leaves it runs into a tubule, which changes it into urine. Click the tuft, the capsule, a tubule with a fuzzy edge or a small capillary.',
  'The scene is a mammalian cortex, drawn at human glomerulus size (the dog glomerulus is about half as wide, so the sizes do not fit the dog). A bird kidney differs: most of its nephrons are the loopless, reptilian type and only a minority have a loop of Henle, so a robin kidney would show fewer long loops running into the inner kidney. The glomerulus is drawn whole while the tubules are cut across so each looks like a ring. The first tubule section lies against the capsule at the end opposite the vessels, but no opening is drawn. Not drawn: the macula densa, the mesangium, the podocytes, the collecting ducts and the tissue between the tubules. Only a few sizes are measured; the rest are drawn to look right and are listed in the note on the scene.',
  'The glomerulus size is the mean of adult men, from volume assuming a sphere; it is not a dog value. The tubule diameters are mouse values used as a stand-in, because a figure for the human or the dog was not found. Fowl is the only bird with a proportion of loopless nephrons on record here (about 75-80 percent; 70 to 90 percent across bird orders), and nothing was found for the robin itself.',
  [['Glomerulus diameter', '≈ 201 µm (adult men, mean, SD 28; range 110-276)'], ['Proximal tubule, long outer diameter', '≈ 44 µm (mouse)'], ['Distal tubule, long outer diameter', '≈ 40 µm (mouse)'], ['Loopless nephrons in domestic fowl', '≈ 75-80 %']],
  'C2', ['How wide are the proximal and distal tubules in human and dog kidneys, measured the same way?', 'What do the glomeruli and tubules of a robin measure?', 'How wide is the dog glomerulus (reported near 120 micrometres for the whole corpuscle, unconfirmed)?'], kind='tissue'),
 card('kidney_cortex_tuft', 'Glomerulus', 'A ball of looping capillaries, about 200 micrometres across in people, where a part of the blood plasma is pushed through a fine filter.',
  'Blood enters the ball through one small vessel and leaves through another. The thin walls of the loops let water and small molecules out and keep blood cells and large proteins in.',
  'The wall of each loop has three layers: a capillary lining with pores, a thick jelly-like membrane, and cells with fine feet called podocytes. The pores are about 70 nanometres wide. The loops in the scene are drawn as short rods inside a translucent ball; real loops are a branching tangle. Descending shows the whole kidney tissue only if at all; the filter itself is not yet a scene.',
  'The ball is drawn at the mean measured size of glomeruli in normal adult men (201 micrometres; the largest in the sample was 276 and the smallest 110). The loops, their number and their width are illustrative.',
  [['Diameter', '≈ 201 µm (adult men, mean)'], ['Pores in the filter', '≈ 70 nm'], ['Loops drawn', ILL]], 'C1'),
 card('kidney_cortex_capsule', 'Bowman capsule and space', 'A thin double-walled cup around the glomerulus; the narrow space inside it collects the filtered fluid and passes it on to the tubule.',
  'The capsule is a thin skin of flat cells that wraps the glomerulus like a balloon around a fist. Fluid that is filtered out of the capillaries lands in the gap between the two layers.',
  'The gap is called Bowman space. It opens at one end into the first tubule, the proximal tubule. The vessels enter and leave at the opposite end (the urinary pole, where the tubule begins, is on the side away from the vessels; no opening is drawn). In the scene the capsule is drawn as a clear shell.',
  'The width of the gap (15 micrometres on each side) and the size of the capsule are illustrative; the glomerulus inside is at its measured size.',
  [['Space width', ILL], ['Outer size drawn', '≈ 231 µm (illustrative)']], 'C2'),
 card('kidney_cortex_arterioles', 'Afferent and efferent arterioles', 'The two small vessels at the glomerulus: one brings blood in and one carries it out.',
  'Blood flows into the glomerulus through the afferent arteriole and leaves through the efferent arteriole. The outgoing vessel then feeds the small capillaries around the tubules.',
  'Because the outgoing vessel is typically narrower, pressure stays high in the tuft and drives filtration; in the scene the efferent is drawn 12 and the afferent 16 micrometres wide, both illustrative. Muscle in their walls adjusts the flow.',
  'Their size and position here are illustrative. They are drawn as two short straight tubes that stop at the capsule, not entering it.',
  [['Size drawn', ILL]], 'C2'),
 card('kidney_cortex_pct', 'Proximal convoluted tubule', 'The first and longest winding tubule: it takes back most of the water, salts and sugar that the filter let through.',
  'The tubule is a tube of one layer of cells. Because it is cut across in a slice, each section shows as a ring round a small clear space. Its inner surface carries a fuzzy brush border.',
  'Its cells are packed with mitochondria and take back most of the filtered water, sodium and all of the glucose. In the scene it is drawn 44 micrometres across; this is a mouse measurement used as a stand-in.',
  'Tubule widths vary with the species, with the part of the tubule and with how the section is cut: a section across a winding tube is often an ellipse, which is why the long diameter is used. The clear space inside is illustrative.',
  [['Outer diameter, long axis', '≈ 44 µm (mouse)'], ['Clear space', ILL]], 'C2', ['What is the diameter of the human and dog proximal tubule?']),
 card('kidney_cortex_brush', 'Brush border', 'A dense fringe of tiny finger-like folds on the inner surface of the proximal tubule cells.',
  'The folds are called microvilli. They multiply the surface that touches the passing fluid, so more can be taken back into the cells.',
  'The distal tubule has few of them, which is one way to tell the two apart in a slice. In the scene a ring of short rods lines each proximal tubule.',
  'Real microvilli are far thinner (about 0.1 micrometre) and, at about 1 to 2 micrometres, shorter than the 5 micrometres drawn (not measured here), and more numerous. The rods are drawn thick and long enough to be seen at this scale; their size and number are illustrative.',
  [['Rod size drawn', ILL]], 'C2'),
 card('kidney_cortex_dct', 'Distal convoluted tubule', 'A shorter winding tubule after the loop of Henle that fine-tunes the salts and acidity of the fluid.',
  'It looks like the proximal tubule in a slice, but it is a little narrower, its cells are smaller, and it has a clean inner edge with few microvilli.',
  'Hormones act here to set how much sodium and calcium is taken back. In the scene it is drawn 40 micrometres across; this is a mouse measurement used as a stand-in.',
  'The clear space inside each section is illustrative. How many sections lie in one slice depends on the cut.',
  [['Outer diameter, long axis', '≈ 40 µm (mouse)'], ['Clear space', ILL]], 'C2', ['What is the diameter of the human and dog distal tubule?']),
 card('kidney_cortex_peritubular', 'Peritubular capillary', 'A small blood vessel wound between the tubules that takes up what the tubules give back.',
  'Water, salts and sugar taken back from the tubule pass into these vessels and return to the blood. Their wall is a thin lining on a basement membrane, with no muscle. They are narrow that red cells go through in single file.',
  'They are fed by the vessel that leaves the glomerulus, so blood reaches them after it has already been filtered once.',
  'The width drawn (9 micrometres) lies within the usual 5-10 micrometre range of capillaries but is illustrative for this vessel; their number and layout are illustrative.',
  [['Width drawn', ILL]], 'C2')]
json.dump(cards, open('data/nodes/tissue_kidney_cortex.json', 'w'), indent=1)
print(len(cards), 'cards')
