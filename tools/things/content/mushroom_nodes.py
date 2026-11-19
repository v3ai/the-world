# Source of the fly agaric cards (data/nodes/park_mushroom.json) and their figures (data/viz/park_mushroom.json).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/mushroom_nodes.py
# Every fact below comes from a source listed in the W_* entries (consulted this session) or from a calculation noted in the text; sentences are my own.
import json, math

W_AM = {'title': 'Amanita muscaria (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Amanita_muscaria'}
W_ECM = {'title': 'Ectomycorrhiza (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Ectomycorrhiza'}
W_HYM = {'title': 'Hymenium (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Hymenium'}
W_BAS = {'title': 'Basidium (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Basidium'}
W_MUSH = {'title': 'Mushroom (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Mushroom'}
W_FUN = {'title': 'Fungus (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Fungus'}
W_MUSC = {'title': 'Muscimol (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Muscimol'}
PMC = {'title': 'Review of spore release in fungi (PMC4624964)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4624964'}

R = lambda c, s, slug: [c, s, slug]
R241 = R('BIO', '24.1', '24-1-characteristics-of-fungi'); R242 = R('BIO', '24.2', '24-2-classifications-of-fungi'); R243 = R('BIO', '24.3', '24-3-ecology-of-fungi')
R244 = R('BIO', '24.4', '24-4-fungal-parasites-and-pathogens'); R313 = R('BIO', '31.3', '31-3-nutritional-adaptations-of-plants'); R303 = R('BIO', '30.3', '30-3-roots')
R352 = R('BIO', '35.2', '35-2-how-neurons-communicate'); R32 = R('BIO', '3.2', '3-2-carbohydrates'); R305 = R('BIO', '30.5', '30-5-transport-of-water-and-solutes-in-plants')
R456 = R('BIO', '45.6', '45-6-community-ecology'); R462 = R('BIO', '46.2', '46-2-energy-flow-through-ecosystems')

NODES, F = [], {}
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, mols=None, area='bio_diversity'):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': area, 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
         'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if dyk: n['did_you_know'] = dyk
    if mols: n['molecules'] = mols
    NODES.append(n)

def blocks(nodes, edges, caption, flow=True):
    return {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'color': c} if c else {})} for i, l, x, y, c in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'flow': flow, 'caption': caption}
def bars(items, ylabel, caption, logy=False):
    return {'type': 'bars', 'bars': [{'label': l, 'value': v} for l, v in items], 'ylabel': ylabel, 'logy': logy, 'caption': caption}

MODEL = 'The park model is a reconstruction from typical measurements; sizes, counts and layer thicknesses that the model chooses are said so on the cards.'

# ------------------------------------------------------------------ the whole organism
N('park_mushroom', 'Fly agaric (Amanita muscaria)', 'organism', .14, ['park_scene', 'bio_fungi_basics'],
  'The red mushroom with white warts. What you see is only the fruit of a much larger fungus whose threads run through the soil and partner with the roots of trees.',
  'The fly agaric is a toadstool: a red cap dotted with white warts on a white stem, with a ring on the stem and a swollen base. It is poisonous. The mushroom is not the whole organism. It is the short-lived fruit body that a fungus builds above ground to release spores, the way an apple tree makes apples. The rest of the fungus is a web of fine threads in the soil, and it swaps minerals and water for sugar with the roots of nearby trees. Use the layer buttons: cut it in half, look underground, or follow how it grows from a small white egg.',
  'Fungi are not plants. They have no chlorophyll and cannot make their own food; they absorb it. Their cell walls are made of chitin (the same material as insect shells), and genetically they are closer kin to animals than to plants. This species feeds in partnership: its threads wrap the finest roots of trees (an ectomycorrhiza) and trade. Each fruit body goes through three visible stages: a button wrapped in a white veil, a half-open cap with the veil tearing, and a mature flat cap. The white warts and the ring are what is left of two veils that once enclosed the young mushroom.',
  'Amanita muscaria is a basidiomycete (Agaricales), a mushroom that makes its spores on gill surfaces, four to a spore-making cell (basidium). The fruit body is a small part of the fungal individual; whether the fruit bodies in a patch come from one mycelium or several is not shown. It contains ibotenic acid and muscimol, which act on glutamate and GABA receptors in the nervous system. It is native to temperate and boreal woodland across the northern hemisphere and has been carried to the southern hemisphere with planted trees. '+MODEL,
  [['Cap diameter (species)', '≈ 5–30 cm'], ['Cap diameter (model)', '14 cm (chosen)'], ['Stipe height (species)', '≈ 5–20 cm'], ['Spores', '≈ 9–13 × 6.5–9 µm, white in a spore print'], ['Poison', 'ibotenic acid and muscimol; poisonous, rarely deadly'], ['Partner trees', 'pine, spruce, fir, birch, cedar and oak are named in the species account']],
  cert='C1', refs=[R241, R242, R243], ext=[W_AM, W_MUSH, W_FUN],
  dyk='Its name is thought to come from its old use as a fly killer in milk, but the details of that history are uncertain.' if False else None,
  openq=['How the many fly agaric lineages around the world relate to each other, and how much of the species counts as one species, is still being worked out.'],
  parts=['fa_cap', 'fa_gills', 'fa_stipe', 'fa_ring', 'fa_volva', 'fa_warts', 'fa_button', 'fa_expanding', 'fa_cut_half', 'fa_mycelium', 'fa_host_root', 'fa_ecm', 'fa_toxins', 'fa_chitin', 'fa_ways_of_life', 'fa_poisoning'])
F['park_mushroom'] = blocks([('s', 'Spore lands', 12, 20, None), ('h', 'Thread (hypha) grows', 38, 20, None), ('m', 'Mycelium: threads of two mating types join', 62, 20, 'green'), ('b', 'Button', 88, 20, None), ('f', 'Mature fruit body', 62, 80, 'orange'), ('r', 'Spores released from gills', 25, 80, None)],
  [('s', 'h', None), ('h', 'm', None), ('m', 'b', 'a fruit body forms'), ('b', 'f', 'expands'), ('f', 'r', None), ('r', 's', 'carried by air')],
  'The fungus lives on as threads in the soil; the mushroom is only its spore-making stage. The loop is simplified: what triggers fruiting, and where in the soil a given mycelium extends, varies.')

# ------------------------------------------------------------------ cap
N('fa_cap', 'Cap (pileus)', 'structure', .14, ['park_mushroom'],
  'The cap is the umbrella-shaped top of the fruit body: a red skin over white flesh, with the spore-making gills on its underside.',
  'The cap is bright red, sometimes orange or yellowish, and dotted with white warts. It starts as a ball, becomes a dome, and ends nearly flat as the mushroom opens. Its job is to hold the gills up and out in the air so that spores can fall away. A mature cap in the park is 14 cm across, a typical size; the species ranges from about 5 to 30 cm.',
  'From the top down the cap is a thin red skin (the cuticle), a thin yellowish layer under it, and thick white flesh made of tightly packed fungal threads. Underneath hang the gills. The warts are not part of the skin: they are fragments of the veil that once wrapped the whole young mushroom, and they become less obvious as the cap widens and as rain washes them off.',
  'Red varieties are var. muscaria; other forms are yellow to orange (var. guessowii in north-eastern North America) or have yellow warts. The warts keep their size while the cap grows, so they spread apart as the cap expands. The model cap uses a chosen profile (convex, slightly dished underneath) and 150 warts of chosen sizes. '+MODEL,
  [['Cap diameter', '≈ 5–30 cm (model 14 cm)'], ['Shape with age', 'ball, then dome, then nearly flat'], ['Colour', 'bright red; orange or yellow forms exist']],
  refs=[R242], ext=[W_AM, W_MUSH], parts=['fa_cuticle', 'fa_cap_flesh', 'fa_warts', 'fa_gills'])
F['fa_cap'] = bars([('smallest cap (species range)', 5), ('model cap', 14), ('largest cap (species range)', 30)], 'cap diameter (cm)', 'Fly agaric caps range from about 5 to 30 cm across; the park model is 14 cm, a chosen value inside that range.')

N('fa_cuticle', 'Cuticle: the red skin', 'tissue', .001, ['fa_cap'],
  'The skin of the cap is a thin red layer; just under it is a yellowish layer. Together they are far thinner than they look in the cut model.',
  'The bright red skin is the cap\'s surface layer. If you cut a cap, you find a thin yellow layer just beneath the red, and below that, white flesh.',
  'In the cut-open model the red and yellow bands are drawn about a millimetre or two thick so that you can see them; real thicknesses are not given in the sources used here and are not measured in the model. A yellowish layer is also seen under the veil of a young specimen when it is dissected.',
  'The pigments that colour the cap are not described on this card because I did not source them. The cap colour can fade to orange or yellow in some forms and with slow development of a purple pigment; the cause of that difference between populations is not established here.',
  [['Layers', 'red cuticle, yellow layer, white flesh'], ['Thicknesses in the model', 'drawn thick to be visible (not measured)']],
  cert='C2', refs=[R242], ext=[W_AM], openq=['What pigments colour the cap, and why the colour differs between populations, is not covered by the sources used for these cards.'])
F['fa_cuticle'] = blocks([('c', 'Red skin (cuticle)', 50, 15, 'orange'), ('y', 'Yellowish layer', 50, 45, None), ('f', 'White flesh of tight threads', 50, 75, None)], [('c', 'y', None), ('y', 'f', None)], 'Layers of the cap from the outside in. Thicknesses are not to scale.', False)

N('fa_cap_flesh', 'Cap flesh: a tissue made of threads', 'tissue', 1e-3, ['fa_cap'],
  'The white flesh of the cap is not made of cells like an apple\'s: it is a packed felt of fungal threads called hyphae.',
  'Cut a cap and the white flesh looks solid. Under a microscope it is a tangle of very thin tubes, each a few thousandths of a millimetre wide, packed together. Each tube is a hypha. The whole mushroom, like all the rest of the fungus, is built from these threads.',
  'Hyphae are typically 2 to 10 micrometres across and grow at their tips. Their walls are made of chitin and glucans. In the flesh the hyphae are interwoven and pressed together; in the soil the same kind of thread runs loosely as the mycelium. Click a thread in the tissue scene to see chitin\'s building block.',
  'The tissue scene shows threads at true width (2 to 10 µm); the number, direction and layout of the threads are illustrative. The different cell shapes real mushrooms use in different tissues are not shown.',
  [['Hypha width', '≈ 2–10 µm'], ['Wall', 'chitin and glucans, no cellulose']],
  refs=[R241], ext=[W_FUN, W_MUSH], parts=['fa_hypha'])
F['fa_cap_flesh'] = bars([('thinnest hypha (typical range)', 2), ('thickest hypha (typical range)', 10), ('spore length (A. muscaria, mid)', 11)], 'micrometres', 'Fungal threads are 2 to 10 micrometres across, similar to a spore (9 to 13 µm long in this species).', True)

N('fa_hypha', 'Hypha: the fungal thread', 'cell', 5e-6, ['fa_cap_flesh', 'fa_mycelium'],
  'A hypha is one thread of a fungus: a long, thin tube that grows from its tip and has a wall of chitin.',
  'Fungi grow as threads. A hypha lengthens at its tip, branches, and joins with others. It is a tube about 2 to 10 micrometres wide. Fungi feed by releasing digestive enzymes into their surroundings and absorbing what dissolves, and the huge surface area of a web of hyphae makes that efficient.',
  'The tube is walled with chitin (a chain of N-acetylglucosamine units) woven with glucans. Chitin is also what insect shells are made of. Plant walls are made of cellulose instead.',
  'The tissue scene lets you reach the chitin building block (N-acetylglucosamine, `n_acetylglucosamine` in the molecule set) from any thread.',
  [['Diameter', '≈ 2–10 µm'], ['Wall', 'chitin with glucans'], ['Grows at', 'the tip']],
  refs=[R241], ext=[W_FUN], mols=['n_acetylglucosamine'])
F['fa_hypha'] = blocks([('g', 'N-acetylglucosamine (a sugar unit)', 15, 20, None), ('c', 'Chitin: long chains of the unit', 50, 50, 'orange'), ('w', 'Wall of the thread, with glucans', 85, 20, None), ('h', 'Thread (hypha) 2–10 µm wide', 50, 85, 'green')], [('g', 'c', 'linked'), ('c', 'w', None), ('w', 'h', 'encloses')], 'From a sugar unit to a thread: the chitin in the wall is a chain of one repeating unit.', False)

N('fa_warts', 'Warts: remnants of the universal veil', 'structure', .004, ['fa_cap'],
  'The white warts are pieces of a veil that once wrapped the whole young mushroom. They are not part of the cap itself.',
  'When a fly agaric is a small white egg, it is wrapped in a skin called the universal veil. As the mushroom grows, the veil stretches and breaks. Bits of it stay on the cap as white or yellowish warts, and bits stay at the base. Rain and age can wash the warts off, so an old cap can be nearly bare.',
  'The warts are small pyramid-shaped patches. They do not grow with the cap, so on a young cap they sit close together and on an old cap they are far apart. Other Amanita species have warts too, which is why wart patterns are not enough to identify a mushroom.',
  'The model places 150 warts of chosen size on the mature cap and the same layout on the half-open one, which is why they are denser there. A real cap\'s count varies. Wart colour in the species is white to yellow.',
  [['Origin', 'universal veil'], ['Shape', 'small pyramids, white to yellow'], ['Behaviour', 'keep their size; less prominent as the cap expands; wash off']],
  refs=[R242], ext=[W_AM, W_MUSH])
F['fa_warts'] = blocks([('e', 'Button: veil covers everything', 12, 25, None), ('t', 'Veil breaks as the cap swells', 45, 25, None), ('w', 'Bits left on the cap: warts', 80, 25, 'orange'), ('v', 'Bits left at the base: scales', 80, 80, None)], [('e', 't', None), ('t', 'w', None), ('t', 'v', None)], 'The universal veil splits as the mushroom grows. What remains on the cap is the warts; what remains at the base is the volva.', False)

# ------------------------------------------------------------------ gills and spores
N('fa_gills', 'Gills (lamellae)', 'structure', .01, ['fa_cap'],
  'Gills are the thin vertical plates under the cap. Their surface is covered by the cells that make spores.',
  'Look under a mature cap and you see dozens of thin white plates fanned out from the stem to the rim. These are the gills. Each plate is lined on both sides with tiny spore-making cells. Packing many thin plates under a cap gives far more surface for spores than a smooth underside would. Fly agaric gills are white and do not touch the stem: there is a small gap, which is what "free" means.',
  'The plates are not all the same length. Long gills run from near the stem to the rim, and shorter ones lie between them near the rim. The model uses 56 long gills, 56 of two-thirds length and 112 of two-fifths length (224 in all, a chosen count). A gilled cap offers roughly a quarter more spore-bearing surface than a pored (tube) cap of the same width.',
  'The gill count is the model\'s: real counts vary and were not found in a source. Spore colour in a deposit (spore print) is white in this species. The gill plates are drawn about half a millimetre thick, a chosen value.',
  [['Attachment', 'free (not joined to the stem)'], ['Colour', 'white'], ['Spore print', 'white'], ['Model gills', '224 (56 long, 56 medium, 112 short; chosen)']],
  refs=[R242], ext=[W_AM, W_HYM], parts=['fa_gill_inside', 'fa_spores'])
# a quarter of the cap seen from below: radial gill lines in three lengths
shapes = [{'k': 'circle', 'x': 0, 'y': 0, 'r': 1}, {'k': 'circle', 'x': 0, 'y': 0, 'r': .18}]
for k in range(28):
    for off, f in ((0, 1.0), (.5, .66), (.25, .4), (.75, .4)):
        a = 2 * math.pi * (k + off) / 56
        if a > math.pi / 2 + 1e-6: continue
        r1 = .985; r0 = r1 - (r1 - .18) * f
        shapes.append({'k': 'line', 'x1': round(r0 * math.cos(a), 4), 'y1': round(r0 * math.sin(a), 4), 'x2': round(r1 * math.cos(a), 4), 'y2': round(r1 * math.sin(a), 4)})
F['fa_gills'] = {'type': 'geometry', 'range': [-.1, 1.1, -.1, 1.1], 'shapes': shapes, 'caption': 'The cap seen from below, one quarter of it, with the gills of the model: long ones reach in towards the stem, shorter ones fill the gaps near the rim. The inner circle is the stem.'}

N('fa_gill_inside', 'Inside a gill: the spore-making layer (hymenium)', 'tissue', 1e-4, ['fa_gills'],
  'A gill is a thin sheet of threads with a skin of spore-making cells on each face. Each of these cells, a basidium, makes four spores.',
  'Cut across a gill and you see three parts. In the middle is a thin core of loose threads that holds the gill up. On each side is a layer of small supporting cells, and on the outside a crowded layer of club-shaped cells called basidia. This outer layer is the hymenium. Each basidium puts out four tiny prongs, and a spore grows on the tip of each.',
  'A basidium usually carries four spores, though two or eight happen in other species. When a spore is ripe, a drop of water forms at its tip and another on its side. When the two drops merge, the sudden change in surface tension launches the spore at an acceleration estimated at about 10,000 times gravity. The spore flies a very short distance, clear of the gill, and then falls down between the plates and out from under the cap into the air.',
  'In the tissue scene the spore length (about 11 µm; the species range is 9–13 × 6.5–9 µm) and thread width are true to the sources; the size of the basidia and the thickness of the gill layers are illustrative, and a real gill carries enormous numbers of basidia. The fine structure of the gill\'s core (how its threads are arranged) is not claimed here.',
  [['Spore-making cell', 'basidium'], ['Spores per basidium', 'usually 4 (2 or 8 sometimes)'], ['Spore size', '≈ 9–13 × 6.5–9 µm'], ['Launch', 'surface-tension catapult, ≈ 10,000 g']],
  refs=[R241, R242], ext=[W_HYM, W_BAS, W_AM], mols=['n_acetylglucosamine'], parts=['fa_spores', 'fa_hypha'])
F['fa_gill_inside'] = blocks([('t', 'Core of threads (trama)', 15, 50, None), ('s', 'Supporting cells (subhymenium)', 40, 50, None), ('b', 'Basidia: club-shaped cells (hymenium)', 70, 50, 'orange'), ('p', 'Four spores per basidium', 88, 20, None), ('a', 'Air between gills', 88, 85, None)], [('t', 's', None), ('s', 'b', None) if False else ('s', 'b', None), ('b', 'p', None), ('p', 'a', 'launched, then fall')], 'A gill in cross-section, from the core to the air. Not to scale.', False)

N('fa_spores', 'Spores: how many and how far', 'cell', 1.1e-5, ['fa_gill_inside'],
  'A mushroom releases an enormous number of spores. Each is a single cell with a tough wall that can ride the air to new places.',
  'A spore is the fungus\'s seed-like unit: one cell, much smaller than a seed, that can grow into a new network of threads if it lands somewhere good. The fly agaric\'s spores are white, oval and about 11 micrometres long. Most land and die; a few find the right soil and a root. A gilled mushroom is thought to shed around thirty thousand spores every second (a figure for gilled mushrooms in general, not measured on this species), which adds up to billions a day.',
  'Calculation: 30,000 per second × 86,400 seconds is about 2.6 × 10⁹ per day. This is an order-of-magnitude figure for gilled mushrooms in general, quoted from a search summary of a review (not read in full); a real mushroom\'s rate depends on its size, age and weather. Spores do not turn blue in iodine (an identification test in this genus).',
  'Spores are the haploid products of meiosis in the basidium; two compatible threads grown from different spores must fuse for the mushroom stage to form.',
  [['Spore size (A. muscaria)', '≈ 9–13 × 6.5–9 µm'], ['Release (gilled mushrooms in general)', '≈ 30,000 per second'], ['Per day (calculated)', '≈ 2.6 × 10⁹']],
  cert='C2', refs=[R241, R242], ext=[PMC, W_AM], openq=['Per-species spore output is not known for the fly agaric from the sources used here; the figure is for gilled mushrooms in general.'])
F['fa_spores'] = {'type': 'plot', 'x': [0, 24], 'y': [0, 3], 'params': [{'id': 'rate', 'label': 'spores per second', 'min': 5000, 'max': 50000, 'value': 30000, 'step': 1000}], 'fns': [{'f': 'rate*3600*x/1e9', 'label': 'billions of spores released'}],
  'xlabel': 'hours', 'ylabel': 'billions of spores', 'readouts': [{'label': 'In one day', 'value': 'rate*86400/1e9', 'unit': 'billion'}], 'caption': 'About 30,000 per second (a figure for gilled mushrooms in general) is billions per day. Move the slider to see how the total depends on the rate.'}

# ------------------------------------------------------------------ stem, ring, base
N('fa_stipe', 'Stipe (stem)', 'structure', .14, ['park_mushroom'],
  'The stem lifts the cap into the air so that spores can fall clear and be carried by the wind.',
  'The white stem holds the cap high above the ground. In a mature fly agaric it is 5 to 20 cm tall and 1 to 2 cm wide, a little brittle and fibrous. It widens into a swollen base at the soil. Inside, it is made of threads like those of the cap.',
  'The ring partway up and the scales at the base are leftovers of the veils. How fast and by what mechanism the stem lengthens is not covered by the sources used for these cards.',
  'The model\'s stem is 14 cm tall (chosen in the range 5–20 cm), 1.7 cm wide under the cap (range 1–2 cm), with a swollen base 4 cm wide (chosen). Whether the stem is solid or hollow is not described on this card.',
  [['Height', '≈ 5–20 cm (model 14 cm)'], ['Width', '≈ 1–2 cm (model 1.7 cm)'], ['Colour', 'white']],
  refs=[R242], ext=[W_AM], parts=['fa_ring', 'fa_volva'])
F['fa_stipe'] = bars([('stipe height, species lower end', 5), ('model stipe height', 14), ('stipe height, species upper end', 20)], 'height (cm)', 'The stipe of a fly agaric is 5 to 20 cm tall; the model is 14 cm, a chosen value.')

N('fa_ring', 'Ring (annulus) and partial veil', 'structure', .035, ['fa_stipe'],
  'The ring is a skirt of thin white tissue on the stem: what is left of a second veil that covered the gills of the young mushroom.',
  'A young mushroom has a second protective sheet, the partial veil, stretched from the rim of the cap to the stem. It covers the gills while the spores ripen. When the cap opens, the sheet tears away from the rim and hangs on the stem as a ring. With age it often droops and goes floppy. In the half-open specimen in the park you can see the veil still joined to the cap rim.',
  'The universal veil wrapped the whole button; the partial veil is a separate, inner layer that protects only the gills. This difference is why a fly agaric has two kinds of leftover: warts and base scales from the first, the ring from the second.',
  'The ring is white and can be wide. The model draws a scalloped skirt with a chosen radius of 3.4 cm and thickness; the scalloping is a stylistic choice, as the real rim varies.',
  [['Origin', 'partial veil'], ['Colour', 'white'], ['Change with age', 'becomes floppy']],
  refs=[R242], ext=[W_AM, W_MUSH])
F['fa_ring'] = blocks([('p', 'Partial veil stretches from rim to stem', 20, 25, None), ('o', 'Cap opens, veil tears at the rim', 50, 55, None), ('r', 'Remnant on the stem: the ring', 80, 85, 'orange')], [('p', 'o', None), ('o', 'r', None)], 'The partial veil protects the young gills; the ring is what remains on the stem.', False)

N('fa_volva', 'Swollen base and the volva', 'structure', .04, ['fa_stipe'],
  'The base of the stem is swollen, and its surface carries rings of scales: the remains of the lower part of the first veil.',
  'At the soil, the stem swells into a bulb. When the young mushroom pushed out of its white egg, the lower part of the egg\'s skin broke and stayed behind. On a fly agaric it stays attached as a few rings of scales around the bulb rather than a cup. This is a good clue when identifying Amanita mushrooms, because some of them have a cup (volva) at the base.',
  'The species account describes the bulb as having universal veil remnants in the form of two to four distinct rings or ruffs. The model draws three rings of small scales on the bulb, a chosen count.',
  'The scales are drawn as small recurved flakes; their real shape and size vary.',
  [['Rings or ruffs on the bulb', '2 to 4 (model 3, chosen)'], ['Origin', 'universal veil']],
  refs=[R242], ext=[W_AM, W_MUSH])
F['fa_volva'] = blocks([('u', 'Universal veil around the button', 15, 25, None), ('b', 'Tears as the stem lengthens', 50, 55, None), ('s', 'Rings of scales around the bulb', 85, 85, 'orange')], [('u', 'b', None), ('b', 's', None)], 'The universal veil leaves rings on the base of this species.', False)

# ------------------------------------------------------------------ stages
N('fa_button', 'Button (egg) stage', 'organism', .047, ['park_mushroom'],
  'The young fly agaric emerges as a white egg-shaped lump. Inside, the cap, gills and stem are already formed, tiny and folded.',
  'The first sign of a mushroom is a tiny knob in the soil. It grows into a white egg-shaped button wrapped in the universal veil. If you cut a button in half, there is a small red cap pressed against a short stem, with the young gills in a chamber below, and a thick white veil around it all. The cut button in the park is drawn from this description.',
  'The very first stage, the primordium, is a nodule under 2 mm across; it expands into the button. Dissecting a young specimen shows a yellowish layer of skin under the veil. The thickness of the veil in the cut model is a chosen 2.6 mm; real veils vary.',
  'The button in the park is 4.7 cm tall (chosen). The inner arrangement drawn in the cut view is schematic: the proportions come from the model, not a section of a real button.',
  [['Primordium', '< 2 mm'], ['Button in the model', '≈ 4.7 cm tall (chosen)'], ['Cover', 'universal veil, white']],
  refs=[R242], ext=[W_AM, W_MUSH])
F['fa_button'] = bars([('primordium (upper limit)', 2), ('model button height', 47), ('model mature cap width', 140)], 'millimetres', 'Sizes in mm: a primordium is under 2 mm; the model button is 47 mm tall and the mature cap 140 mm wide (chosen). Log scale.', True)

N('fa_expanding', 'Half-open stage: the veil tears', 'organism', .09, ['park_mushroom'],
  'In the middle stage the cap is a dome and the veils are splitting; the gills are still hidden behind the partial veil.',
  'As the stem lengthens and the cap swells, the white egg skin splits and slips down, leaving warts on the cap. The cap is still a dome, folded down around the stem, and the partial veil still hides the gills. Later the cap flattens, the veil tears from its rim, and the gills are open to the air.',
  'In the park, three separate fruit bodies stand side by side to show the sequence; they are not one mushroom over time. The half-open one has the same 150 warts as the mature one on a smaller cap, which is why they are closer together.',
  'The timing from button to open cap is not given by the sources used here and is not modelled. The proportions of the half-open specimen are a chosen interpolation between the button and the mature cap.',
  [['Cap in the model', '≈ 7 cm across (chosen)'], ['Veil state', 'partial veil still joined'], ['Warts', 'present; denser than on the mature cap']],
  cert='C2', refs=[R242], ext=[W_AM, W_MUSH])
F['fa_expanding'] = blocks([('1', 'Button: all in the egg', 12, 50, None), ('2', 'Veils splitting, cap domed', 50, 50, 'orange'), ('3', 'Cap flat, ring on stem', 88, 50, None)], [('1', '2', None), ('2', '3', None)], 'Three stages of one kind of fruit body. The park shows three fruit bodies, not one over time.')

N('fa_cut_half', 'A fly agaric cut in half', 'structure', .14, ['park_mushroom'],
  'Cut in half, the mushroom shows a thin red skin, white flesh, gills hanging free of the stem, and a solid white stem with a ring and a swollen base.',
  'Slice a fly agaric from top to bottom and you see its layers at once: the thin red skin of the cap, a yellowish layer under it, thick white flesh, and the gills hanging in the space below the cap. The stem runs straight up the middle and swells at the base. The ring is a thin skirt that sticks out from the stem. Click a part of the cut surface, or a yellow marker.',
  'This is a model cut, not a photograph. The gill in the cutting plane is drawn lengthwise; the other gills in the kept half are drawn behind it. The bands of skin are drawn a millimetre or so thick to be visible. The button beside it is cut the same way, to show the young structures inside its veil.',
  'Cut-open views in this park are reconstructions from the proportions chosen for the model. A real cut mushroom shows more variation (insect tunnels, moisture, discolouring).',
  [['Layers of the cap', 'red skin, yellow layer, white flesh'], ['Gills', 'free of the stem']],
  refs=[R242], ext=[W_AM], parts=['fa_cuticle', 'fa_cap_flesh', 'fa_gill_inside', 'fa_stipe', 'fa_ring', 'fa_volva'])
F['fa_cut_half'] = blocks([('c', 'Cap: skin, yellow layer, flesh', 50, 12, 'orange'), ('g', 'Gills hang free', 50, 38, None), ('r', 'Ring on the stem', 50, 62, None), ('b', 'Swollen base with scales', 50, 88, None)], [('c', 'g', None), ('g', 'r', None), ('r', 'b', None)], 'From the top of a fly agaric to the soil: what the cut shows, in order.', False)

# ------------------------------------------------------------------ underground
N('fa_mycelium', 'Mycelium: the hidden fungus', 'structure', 1, ['park_mushroom', 'bio_fungi_basics'],
  'Under the mushroom is the fungus itself: a spreading web of fine threads that may be much larger than the mushroom and last much longer.',
  'The mushroom is only the fruit. The fungus is the web of threads (the mycelium) in the soil, which absorbs water and nutrients and reaches the roots of trees. A mycelium can be far bigger than the mushroom it produces. In the underground view, the white lines are the web, drawn about a thousand times too thick for you to see them.',
  'Each thread is a hypha, 2 to 10 micrometres across; hyphae can bunch into thicker cords, which let a mycelium move water and nutrients over distance. Some are drawn here as cords linking the three fruit bodies to a hub and spreading outwards; some run to the root tips of the host tree. The layout is a drawing of the idea, not a map of a real mycelium.',
  'The thinnest threads drawn are about 2 mm wide against a real width of about 5 µm: several hundred times too thick. The largest known fungal individual is a honey fungus (Armillaria) mycelium in Oregon, about 9 km² in area, with an estimated age of 2,000 years or more (source: the park\'s fungi card), which shows how large and old a mycelium can become.',
  [['Thread width (real)', '≈ 2–10 µm'], ['Thread width (drawn)', '≈ 2–4.5 mm, several hundred times too thick'], ['Largest known fungus (Armillaria, for scale)', '≈ 9 km²']],
  refs=[R241, R243], ext=[W_FUN, W_ECM], parts=['fa_hypha', 'fa_host_root', 'fa_ecm', 'fa_trade'], openq=['How far a single fly agaric mycelium spreads, and how many fruit bodies in a patch belong to one individual, are not covered by the sources used here.'])
F['fa_mycelium'] = bars([('real thread width, typical (µm)', 5), ('thinnest drawn thread (µm)', 2200), ('thickest drawn cord (µm)', 4550)], 'micrometres', 'A real hypha is about 5 µm across (range 2–10). The threads drawn in the underground view are 2,200 to 4,550 µm: several hundred times too thick. Log scale.', True)

N('fa_host_root', 'Root of a partner tree', 'structure', .5, ['fa_mycelium', 'oak_roots'],
  'The fly agaric forms a partnership with the roots of certain trees. The root shown stands for a pine or birch, which are classic partners.',
  'This fungus does not live alone. Its threads attach to the fine roots of living trees and swap goods with them. The species account names pine, spruce, fir, birch, cedar and oak among its hosts, and silver birch and pines in particular in places where the fungus has been introduced. The root in the underground view is a generic root of such a tree; the tree itself is off the edge of the model.',
  'This fungus is a partner of living trees rather than a decomposer of dead wood, which is why it is found in woods and under trees. The nearest oak in this park is about 16 m from the mushroom, too far to tell you anything about a partnership; see the oak\'s own card on its mycorrhiza.',
  'The hosts listed come from the species account on Wikipedia, which names oak among them. I did not find a primary study of oak as a host in this session, so how strong that partnership is has not been checked: pine and birch are the best-documented hosts. Fly agaric has spread to the southern hemisphere on planted pines and under southern beech (Nothofagus).',
  [['Named host trees', 'pine, spruce, fir, birch, cedar, oak (secondary source)'], ['Classic hosts', 'birch and pine'], ['In the model', 'a generic root; the tree is off the model']],
  cert='C2', refs=[R313, R303], ext=[W_AM, W_ECM], parts=['fa_ecm', 'oak_mycorrhiza'], openq=['Which trees any one fly agaric mycelium is joined to, and how that varies between regions, is not established by the sources used here.'])
F['fa_host_root'] = blocks([('t', 'Tree: makes sugar in leaves', 15, 20, 'green'), ('r', 'Root and fine root tips', 50, 55, None), ('f', 'Fungus: threads in the soil', 85, 85, 'orange')], [('t', 'r', 'sugar down'), ('r', 'f', 'sugar to fungus'), ('f', 'r', 'minerals and water to root')], 'The partnership at its simplest: sugar one way, minerals and water the other.')

N('fa_ecm', 'Mycorrhizal root tip (ectomycorrhiza)', 'structure', 3e-3, ['fa_host_root', 'oak_mycorrhiza'],
  'A mycorrhizal root tip is a tree\'s finest root wrapped in a sleeve of fungus, with fungal threads growing between its outer cells.',
  'The very ends of the tree\'s finest roots do not look bare. Each is covered by a sheath of fungal threads, the mantle, and more threads reach outwards into the soil. Inside, the fungus grows between the root\'s outer cells (never into them), in a net where tree and fungus touch. The tips in the park are drawn much larger than life so you can see them.',
  'The sheath (mantle) can be up to about 40 micrometres thick. The inner net of threads between the root cells is the Hartig net. In this type of partnership, called ectomycorrhiza, the fungus never enters the root cells. About 2 per cent of plant species form it, mostly woody plants, and the fungi are mainly basidiomycetes and ascomycetes. Click the tissue scene to see mantle, net and cells.',
  'In flowering trees like eucalyptus and alder the net stays in the outer cell layer; in most conifers it reaches deeper cell layers. The tissue scene is schematic: real tips are rounded and branched, and the cells are not boxes.',
  [['Mantle thickness', 'up to ≈ 40 µm'], ['Where the fungus grows', 'around the root and between cells, not inside them'], ['Plants that form it', '≈ 2 % of species, mostly woody']],
  cert='C1', refs=[R313, R243], ext=[W_ECM], parts=['fa_mantle', 'fa_hartig', 'fa_trade'])
F['fa_ecm'] = bars([('hypha width, typical (µm)', 5), ('spore length, A. muscaria (µm)', 11), ('mantle thickness, up to (µm)', 40)], 'micrometres', 'The fungal sheath around a root tip is up to about 40 µm thick, only a few times the width of a hypha or the length of a spore.', True)

N('fa_mantle', 'Mantle: the fungal sleeve', 'tissue', 4e-5, ['fa_ecm'],
  'The mantle is a layer of tightly woven fungal threads that covers the tip of the root.',
  'The mantle is the outer part of the partnership: a sleeve of fungus around the root tip. It is dense, so that the root surface is covered. From its outside, the threads reach out into the soil and make up the mycelium.',
  'Mantle thickness is up to about 40 micrometres in the sources used; in the tissue scene, the mantle is drawn as four rows of threads, a schematic choice. Threads in the soil can carry water to the mantle, and some cords carry it over larger distances.',
  'How the mantle regulates what passes between soil and root is not described here.',
  [['Thickness', 'up to ≈ 40 µm']], refs=[R313], ext=[W_ECM])
F['fa_mantle'] = blocks([('s', 'Soil threads', 50, 15, None), ('m', 'Mantle: woven sleeve', 50, 50, 'orange'), ('r', 'Root cells', 50, 85, 'green')], [('s', 'm', 'water, minerals in'), ('m', 'r', None)], 'The mantle sits between the soil and the root.', False)

N('fa_hartig', 'Hartig net: where tree and fungus meet', 'tissue', 4e-5, ['fa_ecm'],
  'The Hartig net is fungal threads that grow between the outer cells of the root: the surface where the swap happens.',
  'Between the tree\'s root cells, the fungus pushes thin threads that wind around each cell like a net. These do not enter the cells: the fungus stays outside and touches the walls. The tree and the fungus pass materials across this shared surface.',
  'In the roots of conifers, the net usually goes down to the cortex or even the layer beyond; in eucalyptus and alder it stays in the outermost layer. The net greatly increases the contact surface between partners.',
  'The exact molecules and transporters that cross the interface are an active research area and are not listed here.',
  [['Position', 'between root cells, not inside them']], refs=[R313], ext=[W_ECM], mols=['phosphate'])
F['fa_hartig'] = blocks([('f', 'Fungal threads', 15, 50, 'orange'), ('i', 'Interface between the cells', 50, 50, None), ('t', 'Tree root cells', 85, 50, 'green')], [('f', 'i', 'minerals'), ('i', 'f', 'sugar')], 'The Hartig net is the contact surface where the swap takes place.')

N('fa_trade', 'The swap: sugar for minerals', 'process', 1e-3, ['fa_ecm', 'bio_roots_mycorrhiza'],
  'The tree gives the fungus sugar; the fungus gives the tree water and minerals such as nitrogen and phosphate. Each could not do as well alone.',
  'A tree makes sugar in its leaves by photosynthesis, and it sends some of it down to its roots. The fungus cannot make sugar from sunlight, but it is far better than a root at gathering minerals and water from the soil, because its threads are so thin and so numerous. So the two trade. The tree pays with sugar; the fungus pays with nitrogen, phosphorus and water.',
  'Estimates in the sources used: the fungi receive about 15 per cent of the host\'s food product, and can supply up to 86 per cent of a host\'s nitrogen. Phosphorus is handed over largely as phosphate ions. Tree sugar travels in the phloem as sucrose.',
  'Whether trees share much carbon or chemical signals through fungal networks that connect several trees is debated; experiments exist, but how much it matters in a real forest is not settled. The molecules in the tissue scene (sucrose for the tree\'s sugar, phosphate for the minerals) are named because they are the standard forms; the scene is schematic.',
  [['Fungus receives', '≈ 15 % of the host\'s food product'], ['Fungus can supply', 'up to ≈ 86 % of a host\'s nitrogen'], ['Phosphorus form', 'largely phosphate']],
  cert='C2', refs=[R313, R305], ext=[W_ECM], mols=['sucrose', 'phosphate'],
  openq=['Do trees share meaningful amounts of carbon and chemical signals through fungal networks that join them? How much this matters in a real forest is still debated.'])
F['fa_trade'] = blocks([('l', 'Leaves make sugar', 15, 15, 'green'), ('r', 'Roots', 50, 50, None), ('f', 'Fungal threads in soil', 85, 85, 'orange'), ('p', 'Soil: nitrogen, phosphate, water', 85, 15, None)], [('l', 'r', 'sugar (sucrose) down'), ('r', 'f', 'about 15 % of the host\'s food product'), ('p', 'f', None), ('f', 'r', 'nitrogen up to 86 %, phosphate, water')], 'The swap at a mycorrhizal root tip, with the figures from the sources used.')

N('fa_ways_of_life', 'Two ways to make a living: rot or partner', 'process', 1, ['park_mushroom', 'bio_fungal_ecology'],
  'Some fungi feed on dead material and some trade with living trees. The fly agaric is in the second group.',
  'Many fungi are decomposers: they digest dead wood, leaves and dung, and return nutrients to the soil. Others, like the fly agaric, partner with living plants. The two lifestyles use the same kind of threads but have opposite needs: a decomposer needs dead food, while a partner needs a living tree and pays with minerals.',
  'Fungi are described as the principal decomposers in ecosystems, and more than 90 per cent of plants depend on mycorrhizal partnerships. Fly agaric is a partner of living trees.',
  'The line between the lifestyles is not sharp: some partner fungi can also release enzymes that digest organic matter, and some decomposers occasionally partner with plants. That nuance is not detailed in the sources used here.',
  [['Decomposers', 'feed on dead organic matter'], ['Mycorrhizal fungi', 'trade with living plant roots'], ['Plants with mycorrhizal partners', '> 90 % (Wikipedia, Fungus)']],
  refs=[R243, R462], ext=[W_FUN, W_ECM])
F['fa_ways_of_life'] = blocks([('d', 'Decomposer: digests dead matter', 25, 25, None), ('m', 'Partner: trades with a living tree', 75, 25, 'orange'), ('s', 'Soil nutrients cycle back', 25, 80, None), ('t', 'Tree gets minerals and water', 75, 80, 'green')], [('d', 's', None), ('m', 't', None)], 'Two lifestyles of fungi. The fly agaric is a partner.', False)

# ------------------------------------------------------------------ chemistry, kinship, poison
N('fa_chitin', 'Chitin: the fungal wall and our kinship', 'concept', 1e-9, ['park_mushroom', 'bio_polysaccharides'],
  'Fungal walls are made of chitin, the same material as insect shells. Fungi are closer relatives of animals than of plants.',
  'A mushroom looks like a plant that stands still, but it is not one. It cannot make its own food, it absorbs it. Its cell walls are made of chitin, which animals such as insects and crabs use for their hard shells, not the cellulose plants use. And when biologists compare genes, fungi turn out to be more closely related to animals than to plants.',
  'Chitin is a long chain of N-acetylglucosamine units. Fungal walls combine chitin with glucans, a pairing found in no other group of organisms. Fungi and animals appear to have split from plants roughly a billion years ago.',
  'The molecule appears in this app as N-acetylglucosamine (the repeating unit). You can reach it from any thread in the tissue scenes by pressing the molecule button.',
  [['Wall', 'chitin and glucans; no cellulose'], ['Chitin unit', 'N-acetylglucosamine, C8H15NO6'], ['Divergence from animals and plants', '≈ 1 billion years ago']],
  refs=[R32, R241], ext=[W_FUN], mols=['n_acetylglucosamine'], area='bio_biochem')
F['fa_chitin'] = blocks([('f', 'Fungi', 50, 20, 'orange'), ('a', 'Animals', 25, 60, None), ('p', 'Plants', 75, 60, 'green'), ('c', 'Fungi and animals share a closer ancestor than either shares with plants', 50, 90, None)], [('f', 'a', 'closer kin'), ('f', 'p', 'more distant')], 'Fungi are genetically closer to animals than to plants. Branch lengths are not to scale.', False)

N('fa_toxins', 'Ibotenic acid and muscimol', 'concept', 1e-9, ['park_mushroom'],
  'The fly agaric contains two chemicals that act on the brain: ibotenic acid, which excites nerve cells, and muscimol, which dampens them. They make the mushroom poisonous.',
  'These two substances are made by the mushroom and they disturb how nerve cells talk to each other. Ibotenic acid looks like the brain\'s main excitatory messenger (glutamate). Muscimol looks like the brain\'s main calming messenger (GABA). In a person who eats the mushroom, the result can be confusion, nausea, twitching, hallucinations and, in severe cases, seizures or coma. This is poisoning, not a treat: do not eat any wild mushroom you cannot identify with certainty.',
  'Ibotenic acid changes (loses a carbon dioxide) into muscimol, which is a potent agonist of GABA type A receptors: it opens chloride channels and quiets neurons. Ibotenic acid acts like glutamate at NMDA receptors. Muscimol is C4H6N2O2, molar mass about 114 g/mol. Drying and storage can change the balance between the two compounds. Muscarine, the substance the species is named after, is present at levels too low to explain the poisoning, and the deadly amatoxins of some other Amanita species are not present.',
  'Two molecules are missing from this app\'s molecule set: ibotenic acid and muscimol; their shape is not shown. GABA, which muscimol imitates, is present and is linked here. The amount of toxin varies strongly with season and place.',
  [['Muscimol', 'C4H6N2O2, ≈ 114 g/mol; GABA-A receptor agonist'], ['Ibotenic acid', 'prodrug; glutamate-like, NMDA receptor agonist'], ['Amatoxins', 'not present']],
  cert='C1', refs=[R352], ext=[W_AM, W_MUSC], mols=['gaba'], area='bio_physio_neuro', parts=['fa_poisoning', 'bio_synapse_neurotransmitters'],
  openq=['The balance and amounts of ibotenic acid and muscimol vary widely between mushrooms and seasons, and the reasons are not well understood.'])
F['fa_toxins'] = blocks([('i', 'Ibotenic acid: glutamate-like, excites', 20, 25, 'orange'), ('m', 'Muscimol: GABA-like, calms', 80, 25, 'orange'), ('g', 'Glutamate receptors (NMDA)', 20, 80, None), ('a', 'GABA-A receptors', 80, 80, None)], [('i', 'm', 'loses CO₂'), ('i', 'g', 'acts on'), ('m', 'a', 'acts on')], 'Two chemicals, two targets in the brain. This shows the idea, not doses.', False)

N('fa_poisoning', 'Poisoning: what is known, and what to do', 'concept', 1, ['fa_toxins', 'park_mushroom'],
  'Poisoning by fly agaric is real but deaths are rare. Do not eat it, and do not eat any wild mushroom you cannot identify with certainty.',
  'Fly agaric poisoning happens: to small children who put things in their mouths, to people who confuse it with edible mushrooms, and to people who try it on purpose. Symptoms usually start within about an hour or two. They can include nausea, twitching, confusion and hallucination, and in severe cases seizures or coma. Most people recover within a day. There is no antidote; doctors treat the symptoms. If someone may have eaten one, call a poison centre or emergency services at once.',
  'Historical deaths are reported, but modern fatal poisoning is described as extremely rare, and one mycological society reported no reliably documented death from these toxins in a hundred years. The mushroom is not the same as the deadly Amanita species, which contain different poisons.',
  'This card gives no instructions of any kind for preparation or use, and none will be added. Quantities that cause effects are deliberately not given.',
  [['Onset', '≈ 30–90 minutes'], ['Recovery in most cases', '≈ 12–24 hours'], ['Antidote', 'none; treatment is supportive']],
  cert='C2', refs=[R244], ext=[W_AM, W_MUSC], openq=['How often poisonings occur worldwide is not reliably recorded in the sources used here.'])
F['fa_poisoning'] = blocks([('e', 'Eaten by accident or on purpose', 15, 20, None), ('o', 'Symptoms begin ≈ 30–90 min', 50, 40, 'orange'), ('p', 'Peak within ≈ 3 hours', 80, 65, None), ('r', 'Most recover within ≈ 12–24 h', 50, 90, 'green')], [('e', 'o', None), ('o', 'p', None), ('p', 'r', 'treatment is supportive')], 'The usual time course. No antidote exists. If someone may have eaten one, call a poison centre or emergency services.', False)

# ------------------------------------------------------------------ write
for n in NODES: n['mesh'] = None
json.dump(NODES, open('data/nodes/park_mushroom.json', 'w'), indent=1, ensure_ascii=False)
path = 'data/viz/park_mushroom.json'
json.dump(F, open(path, 'w'), indent=1, ensure_ascii=False)
ids = {n['id'] for n in NODES}
missing = [k for k in ids if k not in F]
print(len(NODES), 'nodes,', len(F), 'figures; nodes without a figure:', missing)
