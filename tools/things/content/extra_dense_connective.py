# Writes data/things/tissues/dense_connective.json and data/nodes/tissue_dense_connective.json.  Run from the repo root.
import json, math
S = {  # sizes in micrometres; see .devtools/notes/tissues/dense_connective.md for sources
    'fascicle_w': 288, 'fibre_d': 22, 'pitch': 32, 'crimp_len': 100, 'crimp_deg': 10, 'seg': 50,
    'tenocyte': [8, 27, 8], 'fibril_d': 0.2, 'elastic_d': 1.5, 'capillary_d': 10,
}
def pop(id, name, node, shape, size, color, opacity, arrange, material=None, deeper=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'arrange': arrange}
    if deeper: p['deeper'] = deeper
    if material: p['material'] = material
    return p
L = lambda items: {'kind': 'list', 'items': items}
cols = [-128 + 32 * i for i in range(9)]
zs = [-16, 16]
# crimped fibres: chains of straight pieces that lean alternately left and right (a zig-zag, crimp wavelength about 100 um)
fibres = []
for x in cols:
    for z in zs:
        jx, jy = x, -148.0
        for k in range(6):
            a = math.radians(S['crimp_deg']) * (1 if k % 2 == 0 else -1)
            dx, dy = -math.sin(a), math.cos(a)
            fibres.append({'at': [round(jx + dx * S['seg'] / 2, 2), round(jy + dy * S['seg'] / 2, 2), z], 'rot': [0, 0, round(math.degrees(a), 2)]})
            jx += dx * S['seg']; jy += dy * S['seg']
# tenocytes: stacks on their blunt ends in the gaps between four fibres (x = boundary, z = 0)
cells = [{'at': [c + 16, -135 + 29 * j, 0]} for c in cols[1:7:2] for j in range(10)]
# elastic fibres: a few thin straight fibres in other gaps
elastic = [{'at': [x, 0, 0]} for x in (-48, 16, 112)]  # in gaps between fibre columns, clear of the cell columns at x = -80, -16, 48
fibrils = {'kind': 'random', 'n': 37, 'min': [-12, 152, -12], 'max': [12, 172, 12], 'gap': 0.3, 'seed': 7}
labels = [
 {'text': 'Collagen fibre (crimped)', 'at': [-170, 90, 30], 'pop': 'fibre'},
 {'text': 'Fibroblast (tenocyte)', 'at': [-60, -100, 30], 'pop': 'tenocyte'},
 {'text': 'Elastic fibre', 'at': [-170, 0, 30], 'pop': 'elastic'},
 {'text': 'Inset: collagen fibrils (200 nm, to scale)', 'at': [30, 165, 30], 'pop': 'fibril'},
 {'text': 'Small blood vessel (capillary)', 'at': [-170, -120, 30], 'pop': 'capillary'},
]
pops = [
 pop('ground', 'Ground substance', 'dc_ground', 'rbox', [S['fascicle_w'], 300, 64], '#e9dcc6', .28, L([{'at': [0, 0, 0]}])),
 pop('fibre', 'Collagen fibre', 'dc_fibre', 'cylinder', [S['fibre_d'], S['seg'], S['fibre_d']], '#f3ece0', .95, L(fibres), 'collagen'),
 pop('fibril', 'Collagen fibril', 'dc_fibril', 'cylinder', [S['fibril_d'], 25, S['fibril_d']], '#d9b98a', 1, fibrils, 'collagen'),
 pop('tenocyte', 'Fibroblast (tenocyte)', 'dc_tenocyte', 'ellipsoid', S['tenocyte'], '#a9737a', .95, L(cells), None, {'type': 'cell', 'cell': 'animal'}),
 pop('elastic', 'Elastic fibre', 'dc_elastic', 'cylinder', [S['elastic_d'], 300, S['elastic_d']], '#d8b23c', 1, L(elastic), 'protein'),
 pop('capillary', 'Capillary', 'dc_capillary', 'cylinder', [S['capillary_d'], 300, S['capillary_d']], '#c9544f', .95, L([{'at': [-112, 0, 0]}]), 'vessel_wall'),
]
note = ('Schematic, not a micrograph. Drawn is a tendon-type arrangement: fibres parallel to each other and to the pull. In the sclera of the eye and in the dermis of the skin the same collagen is interwoven in bundles that run in many directions, so those tissues look different from this one. '
 'Real sizes: collagen fibrils 50-500 nm across (the 200 nm fibrils are drawn at that true width, so they look like hairlines until you zoom in), collagen fibres 10-50 um across (22 um drawn), fascicles 100-500 um across (about 290 um drawn), '
 'crimp wavelength about 100 um and fibroblast length about 27 um (both measured in mouse-tail tendon at 6 weeks, a small tendon of another species), and a capillary lumen 5-10 um across (drawn 10 um outer width, wall not drawn separately). '
 'Illustrative: the 10 degree lean of the crimp, the fibroblast width and thickness (8 um), the number and placement of cells (fewer than in mouse tail; cells sit in the gaps between fibre columns, as real tenocytes sit between bundles), the elastic fibre width (1.5 um) and count (three), the position of the capillary and of fibrils (37 shown of many thousands per fibre), the length of fibrils drawn, the depth of the slab and the colours. '
 'Ground substance is drawn as a pale slab and has no material; the fibres are drawn as plain rods although each is a bundle of fibrils, and as short straight pieces joined end to end, whereas real fibres are far longer. Elastic fibres are drawn straight; in real tendon they follow the crimp. '
 'The fibrils at the top are a separate inset showing a few of the fibrils inside one fibre, not part of the slab. The slab has no sheath of loose connective tissue (endotenon) around it, which real fascicles have, and in very small tendons such as mouse tail a fascicle may not exist as a distinct level. '
 'The capillary is drawn inside the slab for clarity; sources do not say where vessels lie, and in real tendon they run in the connective tissue sheaths. This tendon-type scene does not stand for the sclera, which is interwoven in lamellae.')
scene = {'id': 'dense_connective', 'title': 'Dense connective tissue (tendon)', 'node': 'dense_connective_scene', 'tag': 'Inside a tendon', 'cell': 'animal',
 'blurb': 'A slice of one tendon bundle (fascicle): wavy collagen fibres lie side by side, with rows of flat fibroblasts, a few elastic fibres and little blood supply. Click a part.',
 'note': note, 'bg': '#f3efe6', 'center': [0, 10, 0], 'D_um': 420, 'labels': labels, 'populations': pops}
json.dump(scene, open('data/things/tissues/dense_connective.json', 'w'), indent=1)

def card(id, title, summary, basics, deeper, expert, facts, cert, oq=(), refs=(), parents=('dense_connective_scene',), related=(), ext=()):
    return {'id': id, 'title': title, 'kind': 'tissue', 'template': 'thing', 'scale_m': 0.001, 'area': 'bio_animals', 'parents': list(parents), 'parts': [], 'processes': [],
            'related': list(related), 'summary': summary, 'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': [list(f) for f in facts],
            'certainty': cert, 'open_questions': list(oq), 'refs': [list(r) for r in refs], 'ext': list(ext)}
R43 = ('ANP', '4.3', '4-3-connective-tissue-supports-and-protects')
cards = [
 card('dense_connective_scene', 'Dense connective tissue (tendon)',
  'Tissue that is mostly collagen: in a tendon the collagen runs in parallel to carry a pull, in the white of the eye and the skin it is woven in many directions.',
  'Tendons, ligaments, the white of the eye (sclera), the tough layer of skin (dermis) and the sheets around muscles are made mostly of collagen, a strong protein rope. Very few cells live in it. This scene shows a tendon, where the ropes lie side by side along the direction of the pull. Click a part to meet it.',
  'Collagen is built in steps. Molecules pack into fibrils, fibrils into fibres, fibres into bundles called fascicles. Between them lies a gel called ground substance, and flat cells called fibroblasts (tenocytes in a tendon) sit in rows along the fibres and make all of it. A tendon with parallel fibres is called dense regular tissue. The sclera and the dermis are dense irregular tissue: the same collagen, but the bundles cross and interweave, so they resist pulling from any direction. A tendon gets much less blood than muscle does.',
  'Fibres are crimped, a regular zig-zag that straightens when the tendon is first stretched. Sizes at each level vary with species, age and the tendon chosen, and the ranges in the facts come from reviews that do not always name the species; several numbers are from mice. The drawn cell density and elastic fibre count are illustrative.',
  [('Fibril width', '50-500 nm'), ('Fibre width', '10-50 um'), ('Fascicle width', '100-500 um'), ('Arrangement drawn', 'parallel (tendon); sclera and dermis are interwoven')], 'C2',
  ['What sets the final width of a collagen fibril in each tissue?'], [R43], ('tendon',), ('tendon', 'dense_connective_tissue', 'dermis'),
  [{'title': 'Review of tendon hierarchy: fibrils 50-500 nm, fibres 10-50 um, fascicles 100-500 um', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6454883'}]),
 card('dc_fibre', 'Collagen fibre', 'A collagen fibre is a wavy bundle of fibrils, 10 to 50 micrometres across.',
  'Each rod is a collagen fibre, a bundle of many thinner fibrils. Collagen is very strong when pulled and hardly stretches. The fibres here lie side by side along the pull of the tendon, and they zig-zag a little.',
  'The zig-zag is called crimp. When a tendon is first stretched the crimp straightens before the collagen itself takes the load, which gives a soft start. In the mouse-tail tendon the crimp wavelength grew from about 14 micrometres at birth to nearly 100 micrometres at six weeks (it depends strongly on age); the drawn wavelength of about 100 micrometres copies the six-week value. Fibre width of 22 micrometres is a choice inside the reported range.',
  'In the sclera and the dermis the fibres are not parallel but branch and intertwine, so the same fibre is drawn there with a wider spread of directions. The lean of the crimp in the picture (10 degrees) is illustrative. Crimp numbers in a tendon fall by nearly half on stretching in one reported case.',
  [('Fibre width', '10-50 um (drawn: 22 um)'), ('Crimp wavelength, mouse tail tendon at 6 weeks', '≈ 100 um'), ('Crimp lean drawn', '10 degrees (illustrative)')], 'C2',
  ['How much does crimp length differ between human tendons?'], [R43], related=('tendon',),
  ext=[{'title': 'Review of tendon hierarchy', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6454883'}, {'title': 'Mouse tail tendon development, crimp wavelength about 100 um at 6 weeks (eLife 2015)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4438642'}]),
 card('dc_fibril', 'Collagen fibril', 'A fibril is a thread of collagen molecules, hundreds of times thinner than a fibre.',
  'The finest threads in the tendon are fibrils. Hundreds of them make one fibre. At the true width they are far too thin to see at this zoom, so the few drawn here look like hairlines. Zoom in to see them.',
  'Fibrils are built of rope-like collagen molecules that overlap in a staggered pattern repeating every 67 nanometres. In tendon the fibrils are wide, 50 to 500 nanometres across; in the clear cornea they are narrow and uniform, about 25 to 31 nanometres, while in the sclera they range from 25 to 230 nanometres. Mouse tendon switches from thin fibrils (about 35 nm) to a mix of thin and thick (35 to 400 nm) soon after birth.',
  'Sclera fibrils vary widely in width and the bundles are interwoven, so they scatter light and the sclera looks white. Cornea fibrils are narrow and even, and the cornea is clear. Drawn fibrils are 200 nanometres wide, a choice within the reported range; their number, 37, is illustrative: a real fibre holds a very large number.',
  [('Fibril width, tendon', '50-500 nm'), ('Axial repeat', '≈ 67 nm'), ('Fibril width, human sclera', '25-230 nm'), ('Fibril width, human cornea', '≈ 25-31 nm')], 'C2',
  [], [R43], ('dc_fibre',), (),
  [{'title': 'Collagen structure of tendon relates to function: D-period about 67 nm', 'url': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5901217/'},
   {'title': 'Human cornea and sclera collagen organisation (1991): cornea fibrils about 25 nm, sclera 25-230 nm, bundles entangled', 'url': 'https://pubmed.ncbi.nlm.nih.gov/2071337/'}]),
 card('dc_tenocyte', 'Fibroblast (tenocyte)', 'The flat cell that makes and repairs the collagen of a tendon, lying in rows between the fibres.',
  'The only cells in the tissue are fibroblasts. In a tendon they are called tenocytes. They are few, flat and long, and they sit in rows along the fibres. They make the collagen and the gel around it.',
  'In the adult mouse-tail tendon at six weeks the cell body is about 27 micrometres long (cells are about twice as long, 55 micrometres, in a newborn mouse), with thin wing-like extensions reaching between fibres, and the cells are stacked in rows on their blunt ends. Cells are far fewer than in a young tendon: about 0.14 cells per 1,000 cubic micrometres at six weeks, against 0.91 at birth. The scene draws fewer cells than that, as an illustration.',
  'The cell width and thickness drawn are illustrative, and the real shape is stellate in cross-section. Values are from the mouse tail tendon; human tenocyte length has not been measured in these sources.',
  [('Cell length, mouse tail tendon at 6 weeks', '≈ 27 um'), ('Cell density, mouse tail tendon at 6 weeks', '≈ 0.14 per 1,000 um3'), ('Distance between cell nuclei along a row, mouse tail tendon at 6 weeks', '≈ 27.5 um')], 'C2',
  ['How long are human tenocytes and how many lie in a given volume of adult tendon?'], [R43], related=('fibroblast',),
  ext=[{'title': 'Mouse tail tendon development, cell length, density and stacking (eLife 2015)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4438642'}]),
 card('dc_elastic', 'Elastic fibre', 'A thin springy fibre of elastin that lets the tissue return to shape after stretching.',
  'A few thin yellow fibres are elastic fibres. Collagen hardly stretches; elastin does, and springs back. A tendon has very little of it.',
  'Elastin is about 1 to 4 percent of the dry weight of tendon and 4 to 9 percent of a typical ligament, but more than 70 percent in some highly extensible ligaments. In the skin, elastic fibres run through the dermis among the collagen and help it spring back.',
  'The fibre width drawn (1.5 micrometres) and the count of three are illustrative. The fibres are drawn straight; in real tendon they follow the crimp of the collagen.',
  [('Elastin share of dry weight, tendon', '≈ 1-4 %'), ('Elastin share of dry weight, typical ligament', '≈ 4-9 %')], 'C2', [], [R43], related=('tendon',),
  ext=[{'title': 'Review of tendon hierarchy and composition', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6454883'}]),
 card('dc_ground', 'Ground substance', 'The watery gel between the fibres, made of long sugar-chain molecules and proteins.',
  'Between the fibres lies a clear gel, the ground substance. It is mostly water held by large molecules. It lets fibres slide a little against each other and carries nutrients to the cells.',
  'It is made by the fibroblasts from polysaccharides, especially hyaluronic acid, and proteins. In tendon, proteoglycans in this matrix are mainly responsible for how it flows and recovers (viscoelastic behaviour), and any sliding of fibrils or fascicles must take place within it.',
  'Drawn as a pale slab; its thickness has no meaning.',
  [('Main parts', 'water, hyaluronic acid, proteoglycans, proteins')], 'C2', [], [R43],
  ext=[{'title': 'Anatomical review of tendon: proteoglycans and viscoelastic behaviour', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2408985'}]),
 card('dc_capillary', 'Small blood vessel', 'A capillary: tendons have far less blood supply than muscle.',
  'One small blood vessel is drawn among the fibres (its position is illustrative). A tendon is poorly supplied with blood compared with muscle, so it heals slowly. The skin dermis and the eye wall are different: the dermis is well supplied, and parts of the eye tissue are not.',
  'A capillary is a tube about 5 to 10 micrometres across, just wide enough for one red blood cell at a time, with a wall of one cell layer and a thin base layer. The number of vessels in the scene is illustrative.',
  'Where the vessel lies in a real tendon is not given by the sources used for this card; position is illustrative. The drawn width of 10 micrometres is the outer width, with the wall not drawn separately.',
  [('Capillary lumen', '5-10 um (drawn outer width: 10 um)')], 'C2', [], [R43, ('ANP', '5.1', '5-1-layers-of-the-skin')], related=('capillary',),
  ext=[{'title': 'Anatomical review of tendon: blood supply less than muscle', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2408985'}]),
]
json.dump(cards, open('data/nodes/tissue_dense_connective.json', 'w'), indent=1, ensure_ascii=False)
print(len(pops), 'populations;', len(fibres), 'fibre pieces;', len(cells), 'cells;', len(cards), 'cards')
