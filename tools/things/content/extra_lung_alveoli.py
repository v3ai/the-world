# Writes data/things/tissues/lung_alveoli.json and data/nodes/tissue_lung_alveoli.json.  Run from the repo root.
# All lengths are micrometres. Sources are listed in .devtools/notes/tissues/lung_alveoli.md.
import json, math
M = {
  'alveolus': 200,        # OpenStax A&P 2e 22.1: "approximately 200 um in diameter"
  'barrier': 0.6,         # harmonic mean thickness of the blood-air barrier (app card; human, see note file)
  'type1_thick': 0.025,   # OpenStax 22.1 / Wikipedia: type I cell about 25 nm thick
  'rbc_d': 7.5,           # OpenStax 18.3: mean diameter 7-8 um
  'bronchiole': 500,      # Wikipedia Bronchiole: terminal bronchioles 0.5 mm or less
  # illustrative:
  'septum': 10, 'capillary': 8, 'rbc_t': 2, 'type2': 10, 'macro': 20, 'wall': 30, 'epi': 12, 'depth': 60,
}
D = M['alveolus']; gap = M['septum']
pitch = D + gap
C = [(-pitch / 2, 50), (pitch / 2, 50), (0, 50 - pitch * math.sqrt(3) / 2)]
cen = (sum(c[0] for c in C) / 3, sum(c[1] for c in C) / 3)
edge = pitch / math.sqrt(3)                      # septum length in a hexagonal packing
dirs = [(0, 1), (-math.sqrt(3) / 2, -.5), (math.sqrt(3) / 2, -.5)]
angs = [0, 120, -120]                            # degrees to turn +y onto each direction
def nrm(d): return (d[1], -d[0])
def at(i, s, off=0):  # point on septum i, s along from the junction, off across
    d, n = dirs[i], nrm(dirs[i])
    return [round(cen[0] + d[0] * s + n[0] * off, 3), round(cen[1] + d[1] * s + n[1] * off, 3), 0]
def pop(id, name, node, shape, size, color, opacity, items, material, **kw):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity,
         'arrange': {'kind': 'list', 'items': items}, 'ink': 1, 'material': material}
    p.update(kw); return p
P = []
P.append(pop('air', 'Alveolus (air space)', 'lung_alveolus', 'tube_z', [D, D, M['depth'] + 4], '#cfe4f0', .5,
             [{'at': [c[0], c[1], 0]} for c in C], 'air'))
P.append(pop('septum', 'Alveolar wall (septum)', 'lung_septum', 'rbox', [gap, edge, M['depth']], '#e9b9b0', .3,
             [{'at': at(i, edge / 2), 'rot': [0, 0, angs[i]]} for i in range(3)], 'lung_tissue'))
P.append(pop('capillary', 'Capillary (blood-filled)', 'lung_alveolar_capillary', 'cylinder', [M['capillary'], edge - 12, M['capillary']], '#b5463f', .85,
             [{'at': at(i, edge / 2), 'rot': [0, 0, angs[i]]} for i in range(3)], 'blood'))
rb = []
for i in range(3):
    for k, s in enumerate([edge * .18, edge * .36, edge * .6, edge * .8]):
        rb.append({'at': at(i, s, [0.4, -0.5, 0.3, -0.3][k]), 'rot': [0, 0, angs[i] + [10, -15, 20, -5][k]]})
P.append(pop('rbc', 'Red blood cell', 'lung_red_cell', 'ellipsoid', [M['rbc_d'], M['rbc_t'], M['rbc_d']], '#d83a34', 1, rb, 'red_blood_cell'))
bar = M['barrier'] - M['type1_thick']; cap2 = M['capillary'] / 2
bi, ti = [], []
for i in range(3):
    for sgn in (1, -1):
        bi.append({'at': at(i, edge / 2, sgn * (cap2 + bar / 2)), 'rot': [0, 0, angs[i]]})
P.append(pop('barrier', 'Blood-air barrier: capillary lining and basement membrane (0.575 um)', 'lung_blood_air_barrier', 'rbox',
             [bar, edge - 8, M['depth'] - 6], '#c98a80', .95, bi, 'lung_tissue'))
t1 = M['type1_thick']
for i in range(3):
    for sgn in (1, -1):
        for a, b in ((8, edge * .5 - 4), (edge * .5 + 4, edge - 8)):
            L = b - a
            ti.append({'at': at(i, (a + b) / 2, sgn * (cap2 + bar + t1 / 2)), 'rot': [0, 0, angs[i]], '_L': L})
P.append(pop('type1', 'Type I cell (flat lining cell, 0.025 um thick)', 'lung_type1_cell', 'rbox', [t1, 50, M['depth'] - 6], '#f2d9a6', 1,
             [{'at': t['at'], 'rot': t['rot']} for t in ti], 'lining'))
t2 = []
for i, (s, sg) in enumerate([(14, 1), (20, -1), (16, 1)]):
    t2.append({'at': at(i, s, sg * (cap2 + bar + t1 + M['type2'] / 2)), 'rot': [0, 0, angs[i]]})
P.append(pop('type2', 'Type II cell (surfactant-making cell)', 'lung_type2_cell', 'rbox', [M['type2'], M['type2'], M['type2']], '#a79ad0', .95, t2, 'animal_cells'))
P.append(pop('macro', 'Alveolar macrophage', 'lung_alveolar_macrophage', 'ellipsoid', [M['macro'], M['macro'] * .9, M['macro']], '#7fae6c', .95,
             [{'at': [at(0, 62, cap2 + bar + t1 + M['macro'] / 2 - 1)[0], at(0, 62)[1], 0]}], 'animal_cells'))
R = M['bronchiole'] / 2; BX, BY = -500, 20
P.append(pop('bwall', 'Bronchiole wall', 'lung_bronchiole', 'tube_z', [2 * (R + M['wall']), 2 * (R + M['wall']), 40], '#d79c91', .9,
             [{'at': [BX, BY, 0]}], 'organ_wall'))
P.append(pop('blumen', 'Bronchiole airway', 'lung_bronchiole', 'tube_z', [2 * (R - M['epi']), 2 * (R - M['epi']), 44], '#cfe4f0', .6,
             [{'at': [BX, BY, 0]}], 'air'))
ring = []
n = 80
for k in range(n):
    a = 2 * math.pi * k / n; r = R - M['epi'] / 2
    ring.append({'at': [round(BX + r * math.cos(a), 3), round(BY + r * math.sin(a), 3), 0], 'rot': [0, 0, round(math.degrees(a) - 90, 3)]})
P.append(pop('bepi', 'Bronchiole lining cell', 'lung_bronchiole', 'rbox', [2 * math.pi * r_ / n * .95 if (r_ := R - M['epi'] / 2) else 0, M['epi'], 48], '#e3c07a', .95, ring, 'lining'))
labels = [
  {'text': 'Alveolus: about 200 micrometres across', 'at': [C[1][0] + 0, C[1][1] + 70, 40], 'pop': 'air'},
  {'text': 'Alveolar wall with capillary', 'at': [at(0, edge)[0] + 8, at(0, edge)[1] + 6, 40], 'pop': 'septum'},
  {'text': 'Red blood cell (7.5 micrometres)', 'at': [at(0, edge * .6)[0] + 12, at(0, edge * .6)[1], 40], 'pop': 'rbc'},
  {'text': 'Type II cell', 'at': [at(0, 14, 25)[0], at(0, 14)[1] - 14, 40], 'pop': 'type2'},
  {'text': 'Alveolar macrophage', 'at': [at(0, 62, 38)[0], at(0, 62)[1] + 14, 40], 'pop': 'macro'},
  {'text': 'Blood-air barrier: about 0.5 to 0.6 micrometres (drawn at 0.6; too thin to see at this zoom)', 'at': [at(2, edge * .5, 30)[0], at(2, edge * .5)[1], 40], 'pop': 'barrier'},
  {'text': 'Small bronchiole (airway, 0.5 mm)', 'at': [BX - 120, BY + R + M['wall'] + 14, 30], 'pop': 'bwall'}]
note = ('A schematic, not a micrograph: three alveoli packed together, cut across, with a small bronchiole at the left edge, drawn there for scale only; in life it reaches the sacs through respiratory bronchioles and alveolar ducts, not directly. REAL sizes: the alveolus (about 200 micrometres across), '
        'the blood-air barrier (0.6 micrometres, drawn as a sheet of that thickness on each side of each capillary: 0.575 for the capillary lining and basement membrane plus 0.025 for the flat type I cell), '
        'the red cell diameter (7.5 micrometres) and the bronchiole (about 0.5 mm across, the upper limit given for a terminal bronchiole). The alveolar and barrier figures are human; '
        'no dog-specific size could be confirmed (a secondary summary of Siegwart et al. 1971 suggests a dog harmonic mean near 0.5 micrometres, not opened), so the dog lung is drawn with the same numbers and may differ. The 0.6 micrometre figure is drawn as a round value within the 0.5 to 0.6 range given by the sources opened (0.5 in OpenStax, 0.57 harmonic mean in rat, less than 1 in Knudsen 2023); a human harmonic mean of 0.6 was not confirmed from an opened source. A harmonic mean is the thickness that matters for diffusion; the average thickness is larger and the thinnest parts about 0.2-0.3 micrometres. '
        'ILLUSTRATIVE: the wall thickness (10), the capillary width (8), the red cell thickness (2), the type II cell size (10), the macrophage size (20), the bronchiole wall and lining thickness, the number and placement of cells, and the straight, flat capillaries (real ones form a net across the wall). '
        'NOT DRAWN: the surfactant film, the pores between neighbouring sacs, elastic fibres and the cells of the connective tissue in the wall. The sacs are drawn round and shallow (scene depth about 60 micrometres); real ones are many-sided. '
        'Birds have no alveoli: their lungs exchange gas in air capillaries a few micrometres wide, so this scene is for the lungs of mammals such as people and dogs, not for birds.')
scene = {'id': 'lung_alveoli', 'title': 'Lung: alveoli and capillaries', 'node': 'lung_alveoli_scene', 'tag': 'Inside the lung', 'cell': 'animal', 'bg': '#f3efe6',
         'center': [0, -41, 0], 'D_um': 1250,   # the middle of the three sacs: a scene is entered looking at its center from about 0.4 mm (js/descent.js VIEW_D), so the airway is at the left edge
         'blurb': 'A slice through three air sacs (alveoli) of a lung and a small airway. The thin wall between air and blood holds a capillary with red cells in single file. Zoom into the wall to reach the barrier, drawn 0.6 micrometres thick. Click a part.',
         'note': note, 'labels': labels, 'populations': P}
json.dump(scene, open('data/things/tissues/lung_alveoli.json', 'w'), indent=1)

def card(id, title, scale, summary, basics, deeper, expert, facts, certainty='C2', refs=None, related=None, parents=None, oq=None, ext=None):
    return {'id': id, 'title': title, 'kind': 'tissue', 'template': 'thing', 'scale_m': scale, 'area': 'body_systems',
            'parents': parents or ['lung_alveoli_scene'], 'parts': [], 'processes': [], 'related': related or [], 'summary': summary,
            'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': certainty,
            'open_questions': oq or [], 'refs': refs or [['ANP', '22.2', '22-2-the-lungs']], 'ext': ext or []}
R1 = [['ANP', '22.1', '22-1-organs-and-structures-of-the-respiratory-system']]
cards = [
 card('lung_alveoli_scene', 'Lung: alveoli and capillaries', 2e-4,
  'Air sacs about 200 micrometres wide, each wall holding a blood capillary, so that air and blood are only about 0.5 to 0.6 micrometres apart.',
  'The lung ends in hundreds of millions of tiny air sacs called alveoli. Their walls are shared between neighbours and are full of capillaries. Red blood cells squeeze through one at a time, less than a micrometre from the air, about a hundred times thinner than a hair. Click a part.',
  'The sizes of the alveolus, the red cell and the bronchiole are drawn at real size, and the barrier is drawn at its real thickness, which is too thin to see until you zoom in a long way. The picture is of a mammal lung, such as a person or a dog. Birds have no alveoli: their lungs exchange gas in narrow air capillaries instead. The shapes, the flat capillaries and the cell positions are schematic.',
  'Human values are used for both species. The human barrier figure is a round value within the 0.5 to 0.6 micrometre range from the sources opened. Dog lungs have the same layers (alveolar lining cells, a thin layer of tissue and capillary lining), but the dog-specific dimensions were not read for this scene, so the dog may differ in alveolar size and barrier thickness.',
  [['Alveolus diameter', '≈ 200 µm'], ['Blood-air barrier', '≈ 0.5-0.6 µm (harmonic mean; 0.57 µm in rat); drawn at 0.6'], ['Scene width', '≈ 1.25 mm']], 'C2',
  R1 + [['ANP', '22.4', '22-4-gas-exchange']], ['alveoli', 'capillary'], ['alveoli'],
  ['The dog barrier thickness is not confirmed here; a secondary summary of Siegwart et al. 1971 suggests a harmonic mean near 0.5 µm.'],
  [{'title': 'Respiratory system: organs and structures (OpenStax Anatomy and Physiology 2e)', 'url': 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system'}]),
 card('lung_alveolus', 'Alveolus (air sac)', 2e-4,
  'One air sac of the lung, about 200 micrometres across, where fresh air meets the blood.',
  'Air flows in and out of each alveolus as you breathe. Its wall is thin and stretchy, and neighbouring sacs share walls.',
  'An alveolus is about 200 micrometres across, with elastic walls that stretch on breathing in. A human lung holds hundreds of millions of them, about 480 million in a typical pair of lungs, which gives a large surface for gas exchange. Small openings join neighbouring sacs.',
  'Sizes quoted in the literature range from about 200 to 500 micrometres depending on the method and on how far the lung is inflated.',
  [['Diameter', '≈ 200 µm (up to ≈ 500 µm in other sources)'], ['Number in a human lung pair', '≈ 480 million']], 'C2', R1, ['alveoli'], None,
  ['Sizes vary with inflation of the lung and with species.'],
  [{'title': 'OpenStax Anatomy and Physiology 2e, 22.1', 'url': 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system'}]),
 card('lung_septum', 'Alveolar wall (septum)', 1e-5,
  'The shared wall between two air sacs: a thin sheet of tissue with a capillary net inside it.',
  'Each wall has air on both sides. Between the two air-facing layers lie the capillaries, elastic fibres and a little connective tissue.',
  'A fine mesh of capillaries wraps each alveolus. Because the wall is shared, the blood in one capillary can exchange gas with the air on both sides. In the scene the wall is drawn 10 micrometres thick as an illustrative value.',
  'The wall is protected from strain on breathing by its elastic fibre network and by the surfactant film.',
  [['Wall thickness drawn', '10 µm (illustrative)']], 'C1', R1, ['alveoli', 'capillary'], None, ['The drawn thickness is not a measurement.'], []),
 card('lung_alveolar_capillary', 'Alveolar capillary', 8e-6,
  'A blood vessel only about as wide as one red cell, running in the wall of the air sacs.',
  'The capillaries here are so narrow that red cells pass through in single file, close against the air-facing wall.',
  'Capillaries are about 5 to 10 micrometres wide (a general figure, OpenStax 20.1) and are lined by one layer of flat cells. In the lung they form a dense net across each wall instead of the branching tree seen in other organs. The scene draws straight tubes, 8 micrometres wide as an illustrative value.',
  'The scene draws straight tubes; the real net is a mesh of short segments.',
  [['Width', '≈ 5-10 µm; 8 µm drawn']], 'C2', [['ANP', '20.1', '20-1-structure-and-function-of-blood-vessels']], ['capillary'], None, [], []),
 card('lung_red_cell', 'Red blood cell in a lung capillary', 7.5e-6,
  'A disc-shaped red cell about 7.5 micrometres across, picking up oxygen as it passes the air sac.',
  'Red cells are filled with haemoglobin, a red protein that binds oxygen. In the lung they take oxygen up, and later release it in the tissues.',
  'The mean diameter is about 7 to 8 micrometres. The thickness drawn (2 micrometres) is an illustrative value, and the cell is drawn as a plain disc rather than the dimpled shape of a real cell.',
  'A real red cell is dimpled on both faces; the scene draws a plain disc.',
  [['Diameter', '≈ 7-8 µm'], ['Thickness drawn', '2 µm (illustrative)']], 'C2', [['ANP', '18.3', '18-3-erythrocytes']], ['red_blood_cell']),
 card('lung_blood_air_barrier', 'Blood-air barrier', 6e-7,
  'The layers between air and blood: together about 0.5 to 0.6 micrometres thick on a diffusion-weighted average.',
  'Oxygen has only to cross a flat lining cell, a thin basement membrane and the capillary lining. That is why the lung exchanges gas so quickly.',
  'The figure of 0.5 to 0.6 micrometres is a harmonic mean, which is the thickness that matters for diffusion because thin spots carry most of the flow. The ordinary average is larger, about 2.2 micrometres (arithmetic mean, adult human lungs, Schierz et al. 2024), and the thinnest parts are only about 0.2 to 0.3 micrometres. OpenStax rounds the thickness to 0.5 micrometres. The scene draws the layer at 0.6 micrometres, a round value, not a measurement: 0.575 for the capillary lining and basement membrane, and 0.025 for the type I cell.',
  'Measured values differ with species, with the method of preserving the lung and with how far it was inflated. A value measured in rat lungs, 0.57 micrometres, is close to the figure used for people; the dog value was not confirmed for this scene.',
  [['Harmonic mean thickness', '≈ 0.5-0.6 µm (≈ 0.57 µm in rat); drawn at 0.6'], ['Arithmetic mean', '≈ 2.2 µm (adult human, Schierz et al. 2024)'], ['Thinnest parts', '≈ 0.2-0.3 µm']], 'C2',
  [['ANP', '22.4', '22-4-gas-exchange']], ['alveoli'], None,
  ['The harmonic mean for the human and dog lung is not confirmed from an opened source.'],
  [{'title': 'Weibel and Knight 1964, thickness of the air-blood barrier (rat)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2106384'}]),
 card('lung_type1_cell', 'Type I alveolar cell', 5e-5,
  'A huge, ultra-thin cell that spreads over most of the air-facing surface of the wall.',
  'These flat cells line almost the whole air sac and let gases pass through them.',
  'Type I cells cover about 95 to 97 per cent of the surface and are only about 25 nanometres thick where they cover a capillary. Their nuclei sit in thicker parts away from the capillaries. The widths drawn for each cell are illustrative.',
  'The cell bodies and nuclei lie in the thicker parts of the wall, away from the capillaries.',
  [['Thickness', '≈ 25 nm'], ['Share of surface', '≈ 95-97 %']], 'C2', R1, ['alveoli'], None, []),
 card('lung_type2_cell', 'Type II alveolar cell', 1e-5,
  'A small cube-shaped cell that makes surfactant, the film that keeps air sacs open.',
  'Surfactant lowers the surface tension of the wet lining so that the sacs do not collapse. Type II cells sit in the corners where walls meet.',
  'They are cuboidal and much smaller than type I cells, and cover only about 5 per cent of the surface (Europe PMC PMC7151878). The 10 micrometre size is an illustrative value.',
  'The three cells drawn are an illustrative number, not counted from a sample.',
  [['Share of surface', '≈ 5 %'], ['Size drawn', '10 µm (illustrative)']], 'C2', R1, ['alveoli'], None, []),
 card('lung_alveolar_macrophage', 'Alveolar macrophage', 2e-5,
  'A roaming clean-up cell that eats dust and microbes in the air sac.',
  'It crawls over the inside of the wall and swallows what the breath brings in.',
  'It is one of the few cells that live on the air side of the lining. It is drawn at 20 micrometres, an illustrative size; that figure and its placement here are not measured values.',
  'Its size and the place it is drawn are not measured values.',
  [['Size drawn', '≈ 20 µm (illustrative)']], 'C1', [['ANP', '21.2', '21-2-barrier-defenses-and-the-innate-immune-response'], ['ANP', '22.1', '22-1-organs-and-structures-of-the-respiratory-system']], ['macrophage'], None, ['The size is not measured here.']),
 card('lung_bronchiole', 'Small bronchiole', 5e-4,
  'A small airway about half a millimetre wide, with no cartilage, that leads air to the sacs.',
  'Bronchioles branch from the windpipe again and again. This one is cut across, and its wall can tighten to narrow the airway.',
  'A terminal bronchiole is 0.5 mm or less across, has no cartilage and is lined by ciliated cuboidal cells and club cells. It is drawn beside the sacs for scale only: in life it opens into them through respiratory bronchioles and alveolar ducts. The wall thickness and cell size in the scene are illustrative.',
  'Beyond it, respiratory bronchioles are lined partly by air sacs and so take part in gas exchange.',
  [['Terminal bronchiole', '≤ 0.5 mm across']], 'C2', [['ANP', '22.1', '22-1-organs-and-structures-of-the-respiratory-system']], ['bronchioles'], None, []),
]
json.dump(cards, open('data/nodes/tissue_lung_alveoli.json', 'w'), indent=1, ensure_ascii=False)
print(len(P), 'populations', len(cards), 'cards')
