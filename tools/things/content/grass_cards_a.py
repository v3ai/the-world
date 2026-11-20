# Cards A: the plant, the lawn, shoots, growth from the base, leaf parts.
from grass_lib import *
PLANT = ['grass_tiller', 'grass_base_growth', 'grass_blade', 'grass_sheath', 'grass_crown', 'grass_culm', 'grass_spike', 'grass_roots', 'grass_below_ground', 'grass_tillering', 'grass_lawn', 'grass_monocot', 'grass_c3_c4', 'grass_hay_fever']

N('grass_plant', 'A grass plant: perennial ryegrass', 'organism', 0.5, ['park_scene'],
  "Perennial ryegrass (Lolium perenne) is the grass of many British lawns, playing fields and pastures: a tufted plant made of many shoots, each with narrow leaves that grow from their base, and a mass of fine roots.",
  "A grass plant is not one stem but a clump of many small shoots called tillers, all joined at the base. Each tiller has a few narrow leaves, each leaf in two parts: a tube-like sheath wrapped round the stem and a flat blade that spreads outward. The leaves in this model are about 5 to 21 cm long and 3 to 4 mm wide. The growing point of each shoot stays low, tucked inside the sheaths near the ground, which is why a lawn can be mown again and again. Some shoots send up a tall flowering stem with a flat spike of tiny flowers that shed their pollen on the wind. Under the ground is a fibrous root system. The layers above pull one shoot apart, show the flowers, and show the roots; three cut-open views open a leaf, the growing point and a floret.",
  "Perennial ryegrass is a grass (family Poaceae), so a flowering plant and a monocot: one seed leaf, parallel leaf veins, fibrous roots. It is native to Europe, the Middle East, North Africa and eastward into central Asia, and is sown for pasture, lawns and sports pitches (it was used on the Wimbledon courts from 2001). It is a C3 plant, which grows best in cool, moist conditions. Its leaves grow from a zone at their base, its growing points sit near the soil until the plant flowers, and it spreads by making new tillers rather than by creeping stems. Click the parts: every one has its own card, and you can follow the leaf, the growing point or the root down to the cells and molecules they are made of.",
  "Descriptions of the species differ in detail between floras: culm height is given as 30 to 90 cm, up to 90 cm, or 10 to 50 cm; blades as (5-)15-25 cm by 2-4 mm or 6-25 cm by 2-5 mm. The model uses values inside these ranges: tallest flowering stem about 50 cm, blades about 5 to 21 cm, 3.0 to 3.8 mm wide. The chromosome number is given as 2n = 14 (DELTA). The model's counts of tillers, leaves and spikelets are choices (nine tillers where a real tussock has many more); see the notes on each card.",
  [('Species', 'Lolium perenne L., perennial ryegrass; family Poaceae'), ('Leaf blade length', 'floras give about 5-25 cm (model 5-21 cm)'), ('Leaf blade width', '2-4 mm (DELTA)'), ('Flowering stem height', '30-90 cm in floras (model ≈ 50 cm)'), ('Chromosomes', '2n = 14 (diploid; DELTA)'), ('Layers', 'Whole plant · One tiller pulled apart · In flower · Underground · three cut-open views')],
  'C1', [R_PLANT, R_ANGIO], [W_LP, DELTA, NZF, CORNELL],
  dyk="Perennial ryegrass has been used on the Wimbledon courts since 2001 (Wikipedia).",
  parts=PLANT, related=['rn_acris', 'bio_seed_plants', 'bio_plant_body_tissues', 'park_ground'],
  fig=spans([('leaf blade, floras', 5, 25), ('leaf blade, model', 5, 21), ('flowering stem, floras', 10, 90), ('flowering stem, model', 41, 52)], 'cm', 'Sizes in the model against the ranges given in floras, in centimetres. A bar spans the range between plants. The model sits inside the ranges; the floras disagree about stem height (10-50 cm in one, 30-90 cm in another).', 0, 100, ' cm'))

N('grass_lawn', 'The lawn: turf of mown grass', 'habitat', 10, ['park_scene', 'grass_plant'],
  "A lawn is grass kept short by repeated mowing. It works because grass leaves grow from their base and its growing points sit low: the mower removes the tops of the blades and leaves the part that makes new leaf.",
  "From a distance the lawn is a green carpet. Close up it is thousands of grass plants, each a clump of narrow leaves, with the cut ends of the blades square rather than pointed. In this park the lawn is drawn in three levels of detail so that it can cover a large area: small clumps of real curved blades within a couple of metres of you, a dense short pile of grass strands out to about 12 m, and a painted surface farther away. The pile is a stand-in: it is drawn in layers rather than blade by blade. The taller plants standing on their own are whole grass plants at true size, left unmown so that you can see how the plant is built. Click the lawn to read about it, or click one of the tall plants to open it.",
  "RHS advice for ordinary domestic lawns is to mow to about 13-25 mm in summer and up to about 40 mm in spring and autumn, never taking off more than a third of the height at one cut; fine lawns are kept at 6-13 mm. Regular mowing cuts the leaf blades above the point where they grow, so the plant regrows them from the base. Regular mowing also removes the flowering stems before they ripen. A sward of perennial ryegrass typically holds 5,000-7,000 tillers per square metre (AHDB).",
  "The lawn in the park is a stand-in, not a measured turf. The clumps of blades near you are drawn 2 to 5 cm high (36 blades per clump, a choice) and are much sparser than the 5,000-7,000 tillers per m² of an established sward; the strand pile (about 240 strands per metre, up to 4 cm) is a visual device, not a count of tillers, and thins out with distance. Beyond about 12 m the lawn is painted ground, and from high above only that texture is drawn. Colour variation across the lawn is a made-up pattern, not a measurement.",
  [('Mowing height, domestic lawn (RHS)', '13-25 mm in summer; up to 40 mm in spring and autumn'), ('Fine lawn (RHS)', '6-13 mm'), ('Tillers in an established sward (AHDB)', '≈ 5,000-7,000 per m²'), ('In the park', 'clumps of 36 blades near you, a layered strand pile to about 12 m, painted ground beyond (a stand-in)')],
  'C1', [R_PLANT], [RHS_MOW, AHDB, W_LP], parts=['grass_plant', 'grass_base_growth', 'grass_tillering', 'grass_blade'], related=['park_ground', 'bio_plant_nutrition_soil'],
  fig=spans([('fine lawn', 6, 13), ('domestic lawn, summer', 13, 25), ('domestic lawn, spring/autumn: up to', 40, 40), ('new lawn: first cut at', 50, 50)], 'mm', 'Recommended mowing heights in millimetres: a bar is a recommended range, a dot is a single recommended value (the most the grass should be left to in spring and autumn, and the height a new lawn should reach before its first cut).', 0, 60, ' mm'))

N('grass_base_growth', 'Why grass survives mowing: it grows from the base', 'process', 0.05, ['grass_plant'],
  "Grass leaves lengthen from a zone at their base, and the growing point of the shoot sits near the soil, wrapped in sheaths. Mowing removes only the old tops, so the plant keeps its growing parts.",
  "Most plants grow at the tips of their shoots, so cutting a tip stops that shoot. A grass leaf grows differently: new cells are made at the bottom of the blade, down inside the tube formed by the older leaf sheaths, and push the blade up and out. The tip of a grass blade is the oldest part of the leaf. When a mower or a grazing animal cuts or bites off the top of the blade, the part that makes new leaf is untouched, and the leaf grows back. The growing point of the whole shoot is also low, near the soil surface, and protected inside the sheaths, so it is out of reach of the mower. Open the layer 'Growing point cut open' to see where it sits.",
  "Two separate growing regions matter. The shoot apical meristem (the growing point) makes new leaves and, later, the flower stalk; in the early part of the season the growing points of grasses are at or near ground level (University of Missouri Extension). The leaf growth zone (an intercalary meristem at the base of each blade, in the collar region) makes the blade lengthen; if a leaf is cut below the collar, through sheath tissue, the blade cannot regrow (Oregon State). The exception is a shoot that is about to flower: the stem lengthens and lifts the growing point up, where a mower or an animal can remove it. About half of the growing points of grasses develop into seed heads this way, and a shoot that has lost its raised growing point can only be replaced by a new tiller from a bud that had been dormant (Missouri).",
  "In a kinematic study of Lolium perenne (cv. Condesa), cell division in a growing leaf was confined to the basal 0.6-0.9 mm, while cells went on lengthening over the basal 31-36 mm (the two values are for high and low phosphorus). Leaf elongation rates were 2.30 ± 0.05 mm/h (high phosphorus) and 1.41 ± 0.05 mm/h (low phosphorus), which is about 55 and 34 mm per day. The rate depends on temperature, water and nutrients; these are values for one cultivar grown under controlled conditions, not for ryegrass in general. The height of a vegetative growing point above the soil is described only as 'at or near ground level', near the soil surface.",
  [('Growing point (shoot apex)', 'at or near ground level in a vegetative shoot (Missouri; Oregon State)'), ('Leaf growth zone, cell division', 'basal 0.6-0.9 mm of the leaf (L. perenne)'), ('Leaf growth zone, cell lengthening', 'basal 31-36 mm of the leaf (L. perenne)'), ('Leaf elongation rate', '2.30 mm/h and 1.41 mm/h in two conditions (≈ 55 and 34 mm/day)'), ('Cut a flowering stem', 'can remove the raised growing point; regrowth then needs a new tiller')],
  'C1', [R_PLANT, R_LEAF], [OSU, MO, PMC_GZ],
  parts=['grass_meristem', 'grass_growth_zone', 'grass_sheath', 'grass_crown', 'grass_tillering', 'grass_lawn'], related=['bio_plant_body_tissues', 'bio_plant_hormones'],
  fig=spans([('cells divide (basal part)', .6, .9), ('cells lengthen (basal part)', 31, 36)], 'mm', 'How far up a growing ryegrass leaf each process reaches, measured from its base, on a log scale (0.1 to 100 millimetres): cells divide only in the lowest 0.6-0.9 mm but keep lengthening over the lowest 31-36 mm. A bar spans the two phosphorus treatments of one cultivar (Condesa).', .1, 100, ' mm', True))

N('grass_tiller', 'A tiller: one shoot of the grass plant', 'structure', 0.2, ['grass_plant'],
  "A tiller is a complete shoot: a short stem with its growing point at the bottom, a few leaves wrapped round each other, and roots from its base. A grass plant is a crowd of tillers.",
  "Look at one shoot and you see a stack: the outside leaf is the oldest, and each younger leaf grows up through the middle of the older ones. The layer 'One tiller pulled apart' separates three leaves from the stem so that you can see their sheaths opened out, the ligule and auricles where each sheath meets its blade, and the very short stem with its growing point. In the real plant the sheaths stay wrapped round the stem and round each other, forming a tube about the thickness of a pencil lead.",
  "A tiller consists of a growing point (apical meristem), a stem, leaves and roots (Missouri Extension). The stem is compressed into a short crown at the base; its nodes are packed close together, and a leaf grows from each. The new tillers of a grass plant arise at the base of leaves; see Tillers: how a grass plant spreads. A tiller that flowers elongates its stem and stops making leaves.",
  "The leaves of this tiller are modelled from the typical shapes in floras: sheaths of 3.4 to 4.8 cm, blades of 11, 15 and 19 cm. A published phyllochron (the time between the appearance of successive leaves) for Lolium perenne cv. Aberdart in hydroponics was 9.22 days in spring and 4.44 days in autumn (PMC8399834). Since a leaf lasts about three to four phyllochrons and a new one appears each phyllochron, a tiller carries around three or four leaves at a time; the model draws three.",
  [('A tiller has', 'growing point, short stem with nodes, leaves, roots'), ('Phyllochron, spring and autumn (hydroponics)', '9.22 and 4.44 days (cv. Aberdart)'), ('Drawn', 'three leaves pulled away from the stem; life size')],
  'C1', [R_PLANT], [MO, PMC_PHYL], parts=['grass_sheath', 'grass_blade', 'grass_ligule', 'grass_auricle', 'grass_crown', 'grass_meristem', 'grass_node'], related=['grass_tillering', 'grass_base_growth'])

N('grass_tillering', 'Tillers: how a grass plant spreads', 'process', 0.3, ['grass_plant'],
  "A grass plant spreads by making new tillers at the base of its leaves. Ryegrass has no creeping stems: the clump thickens and widens, and a lawn fills up.",
  "Each new tiller starts as a small bud in the angle between a leaf and the stem, at the base of the plant. The bud grows into a shoot of its own, with its own leaves, growing point and roots. Two young tillers are drawn at the edge of the clump. Because the plant keeps making tillers, mowing does not thin it: a mown lawn gets denser.",
  "Daughter tillers begin to appear once the third or fourth leaf has formed on the main tiller (AHDB). Perennial ryegrass has no rhizomes (horizontal underground stems): floras state that horizontal rooting stems are absent, unlike quackgrass, which has rhizomes. An established sward typically holds 5,000-7,000 tillers per square metre (AHDB).",
  "Tiller buds sit in the angle between a leaf and the stem. The model draws young tillers at the edge of the clump, a simplification of how they emerge. Seeding is the other route to spread: seed from the flowers.",
  [('Tillers in an established sward (AHDB)', '≈ 5,000-7,000 per m²'), ('When daughter tillers appear (AHDB)', 'once the main tiller has a third or fourth leaf'), ('Creeping stems (rhizomes)', 'absent (DELTA; Cornell)')],
  'C1', [R_PLANT], [AHDB, DELTA, CORNELL], parts=['grass_tiller', 'grass_lawn'], related=['grass_base_growth', 'bio_plant_hormones'],
  fig={'type': 'plot', 'x': [4000, 8000], 'y': [0, 3], 'xlabel': 'tillers per square metre', 'ylabel': 'ground per tiller (cm²)', 'fns': [{'f': '10000/x', 'label': 'ground per tiller'}], 'vlines': [{'x': 5000, 'label': '5,000'}, {'x': 7000, 'label': '7,000'}],
       'params': [{'id': 'n', 'label': 'Tillers per square metre', 'min': 4000, 'max': 8000, 'value': 6000, 'step': 100}],
       'readouts': [{'label': 'Ground per tiller', 'value': '10000/n', 'unit': 'cm²'}, {'label': 'Side of that square', 'value': 'sqrt(10000/n)*10', 'unit': 'mm'}],
       'caption': 'An established ryegrass sward holds 5,000 to 7,000 tillers in each square metre (10,000 cm²), so each tiller has only 1.4 to 2 cm² of ground, a square about 12 to 14 mm on a side. Slide the density and watch the room per shoot.'})

N('grass_meristem', 'The growing point (shoot apex)', 'structure', 0.0006, ['grass_tiller', 'grass_base_growth'],
  "A tiny dome of dividing cells at the top of the short stem, at the base of the shoot. It makes every new leaf, and, later, the flower stalk.",
  "The growing point is a tiny dome of cells. It sits low, near the soil, deep inside the sheaths, so the mower never touches it. New leaves start as small ridges round the dome and grow upward inside the older leaves. Click 'Look inside the growing point' to see its cells.",
  "The shoot apical meristem is a group of cells that divide and make the tissues of the shoot. In grasses the leaves arise one at a time on alternate sides of the stem. While the plant is vegetative the dome stays at the base of the shoot (Missouri). When the plant is triggered to flower the apex changes into the start of the flower stalk, the stem lengthens, and the growing point is lifted up: after that a cut can kill the shoot.",
  "The dome is drawn at about 1 mm tall in the cut-open view and about 0.3 mm across: illustrative sizes. The tissue scene shows cells of about 12 µm, also illustrative. ",
  [('Where', 'at the top of the compressed stem, inside the sheaths, near ground level in a vegetative shoot'), ('Makes', 'leaves; later the flowering stem'), ('Drawn size', 'illustrative: dome ≈ 0.3 mm')],
  'C1', [R_PLANT], [MO, OSU], parts=['grass_leaf_primordium', 'grass_growth_zone', 'grass_crown'], related=['bio_plant_body_tissues', 'bio_plant_development_flower', 'grass_base_growth'], where='place:park')

N('grass_leaf_primordium', 'A young leaf starting to grow', 'structure', 0.0003, ['grass_meristem'],
  "A small ridge of cells beside the growing point that will become a leaf: the youngest leaf of the shoot, still tiny and wrapped up.",
  "Every leaf begins as a bump on the side of the growing point. It grows up as a hood that closes round the dome, then lengthens into the sheath and blade. The oldest leaves are on the outside, the youngest in the middle.",
  "Primordia form in a regular sequence at the apex; the next leaf starts on the opposite side of the stem. The base of each growing leaf keeps dividing (the growth zone) while the older parts of it stretch.",
  "The primordia in the tissue scene are illustrative cells and arrangement, not measurements.",
  [('Arrangement of leaves', 'two ranks, on opposite sides of the stem (floras: spikelets distichous; leaves alternate)')],
  'C1', [R_PLANT], [OSU], related=['grass_growth_zone', 'grass_meristem'])

N('grass_growth_zone', 'The leaf growth zone', 'structure', 0.03, ['grass_base_growth', 'grass_blade'],
  "The base of each growing blade, inside the sheaths, where new cells are made and then stretch. This is why a leaf keeps growing after its tip is cut.",
  "Only the bottom few centimetres of a growing leaf are growing. Cells are made in the lowest millimetre; above that they swell and lengthen, and the blade is pushed up and out of the tube. Higher up, the blade is finished and does not grow any more. Cutting the top off does no harm to the zone.",
  "This is an intercalary meristem: growth in the middle of an organ rather than at its tip. In perennial ryegrass cell division is confined to the basal 0.6-0.9 mm of a growing leaf and cell lengthening occurs over the basal 31-36 mm (Plant Physiology, kinematic study). The collar region includes the zone that accounts for blade growth (Oregon State). A cut through the sheath below the collar removes this zone and the blade cannot regrow.",
  "Measured values are for one cultivar (Condesa) in controlled conditions; the zone in the cut-open view is drawn 34 mm tall, inside the 31-36 mm measured for that cultivar; where exactly it starts and how its edges look are drawn by eye, and the dividing part (under 1 mm) is too small to show separately.",
  [('Cell division', 'basal 0.6-0.9 mm'), ('Cell lengthening', 'basal 31-36 mm'), ('Cells produced by one cell file (high and low phosphorus)', '1.91 and 1.52 per hour')],
  'C1', [R_LEAF], [PMC_GZ, OSU], related=['grass_base_growth', 'grass_meristem'])

N('grass_crown', 'The stem base (crown) and its nodes', 'structure', 0.004, ['grass_tiller'],
  "The very short stem at the base of a vegetative shoot. Its nodes are packed together, each bearing a leaf, and roots grow from it.",
  "The stem of a vegetative grass shoot is only a few millimetres long. Where a leaf attaches there is a node; because the stem does not stretch, the nodes sit one above another like the layers of a stack of washers. The roots grow from the lowest nodes. The sugar reserves of the plant are stored in this base and in the sheaths.",
  "Perennial ryegrass accumulates large amounts of fructans, its storage carbohydrate, in the tiller base, made up of the leaf sheaths and the elongating leaf bases (Plant Physiol and Frontiers papers). The base is where regrowth begins after cutting. The stem only lengthens when the plant flowers.",
  "The model's crown is 2 cm tall and 3.4 mm wide, and its four visible nodes are drawn 3.5 mm apart: illustrative sizes within a few millimetres.",
  [('Length of the stem in a vegetative shoot (model)', '≈ 2 cm, illustrative'), ('Stores', 'fructan reserves, in sheaths and leaf bases')],
  'C1', [R_STEM], [PMC_FRUC, FRONT_FRUC], parts=['grass_node', 'grass_fructan'], related=['grass_roots', 'bio_polysaccharides'])

N('grass_node', 'A node: where a leaf joins the stem', 'structure', 0.003, ['grass_crown', 'grass_culm'],
  "A node is a swelling on a stem where a leaf is attached. On the flowering stem the nodes are visible as dark rings; at the base they are crowded together.",
  "A grass stem is divided into nodes, the points where leaves are attached, and the lengths of stem between them (internodes). On the tall flowering stem one or two nodes may show as dark swellings; often they are hidden inside the sheaths. The model draws two rings so that you can find them. At the base of the plant the nodes are too close to tell apart.",
  "The Grasses of North America flora describes the culm nodes of Lolium perenne as 'never exposed or becoming exposed, 1 or 2 (when visible)', so the model's two exposed rings are within what a real stem shows.",
  "Two rings are drawn on each flowering stem at 24 and 55 per cent of its height (a choice).",
  [('Exposed nodes on the flowering stem', '1 or 2, when visible'), ('Drawn', '2 rings')],
  'C1', [R_STEM], [DELTA], related=['grass_culm', 'grass_crown'])

N('grass_blade', 'A leaf blade', 'structure', 0.15, ['grass_plant', 'grass_tiller'],
  "The flat, narrow, ribbed part of a grass leaf. It catches light, takes in carbon dioxide and gives off water vapour, and its veins run in parallel along its length.",
  "A grass blade is long and narrow, 2 to 4 mm wide in this species, with a pointed tip and a fold down the middle on its underside. Its upper surface is ribbed and its underside is smooth and shiny. The veins run side by side from base to tip, the pattern of a monocot, unlike the branching network of a buttercup or oak leaf. Click the upper surface or the underside, or open the cut-open view 'Leaf blade cut across' to see inside.",
  "Perennial ryegrass blades are (5-)15-25 cm long and 2-4 mm wide with 10-20 veins (DELTA); other floras give 6-25 cm by 2-5 mm (Cornell). They are folded in the bud (Wikipedia; Virginia Tech), which distinguishes them from the rolled young leaves of Italian ryegrass. The blade grows from its base (see Why grass survives mowing). In Lolium all vascular bundles are accompanied by sclerenchyma and the upper surface has prominent ribs of constant size (Grass Genera of the World).",
  "The model blades are 5 to 21 cm long by 3.0 to 3.8 mm wide, built as two sheets 0.22 mm apart with 9 ribs drawn 0.06 mm high: the thickness and rib height are illustrative.",
  [('Length', '(5-)15-25 cm (DELTA); 6-25 cm (Cornell)'), ('Width', '2-4 mm (DELTA)'), ('Veins', '10-20, parallel (DELTA)'), ('Folded in the bud', 'yes (Wikipedia; Virginia Tech)')],
  'C1', [R_LEAF], [DELTA, CORNELL, VT, GGW, W_LP], parts=['grass_blade_upper', 'grass_blade_under', 'grass_ligule', 'grass_auricle', 'grass_growth_zone', 'grass_mesophyll'], related=['oak_leaf', 'rn_basal_leaf', 'bio_leaf_structure_gas_exchange', 'grass_monocot'],
  fig=table(['Part of the leaf', 'Size or number in floras', 'In the model'], [['Blade length', '(5-)15-25 cm; other floras 6-25 cm', '5-21 cm'], ['Blade width', '2-4 mm; other floras 2-5 mm', '3.0-3.8 mm'], ['Veins', '10-20, parallel', '9 ribs drawn on the upper face'], ['Sheath', 'open for over half its length', '3.4-4.8 cm long'], ['Ligule', '1-2 mm, no hairs', '1.5 mm'], ['Auricles', 'small, variable', 'two 2 mm claws']], 'The parts of a ryegrass leaf: what floras give, and what the model draws. Floras differ from one another, so the ranges are wide.'))

N('grass_blade_upper', 'The upper surface of the blade: ribbed', 'structure', 0.003, ['grass_blade'],
  "The side of the blade that faces the sky when the leaf stands up: dull, with fine parallel ribs along its length.",
  "Run a finger along the blade lengthways and you can feel parallel ridges on the upper side. The ridges lie over the veins. Between them, in the furrows, are special cells that shrink in dry weather and make the blade fold. The underside is smooth and shiny.",
  "The ribs are prominent and about constant in size in Lolium (Grass Genera of the World). Under each rib is a vascular bundle with sclerenchyma; in the furrows are fans of bulliform cells. The cut-open view shows the ribs as the bumps on the upper surface of the section.",
  "Rib number and height in the model (9 across, 0.06 mm high) are illustrative; the flora gives 10-20 veins.",
  [('Ribs', 'prominent, parallel, over the veins (Wikipedia; Grass Genera of the World)')],
  'C1', [R_LEAF], [GGW, W_LP], related=['grass_bulliform', 'grass_blade_under', 'grass_bundle'])

N('grass_blade_under', 'The underside of the blade: smooth and glossy', 'structure', 0.003, ['grass_blade'],
  "The outer surface of the blade, smooth and shiny, with a fold or keel down the middle.",
  "Turn a ryegrass blade over and the underside is smooth and glossy, while the upper side is ribbed and dull. This difference is one of the features used to tell ryegrass from other lawn grasses. The shine comes from the surface of the epidermis; the model draws the underside paler to show it.",
  "Descriptions of the species give the lower surface as smooth and glossy and the upper surface as having prominent parallel veins, with a strong central keel and a prominent white midrib. The Grass Genera of the World description records stomata as common on this surface.",
  "The shine cannot be drawn by the renderer, so a lighter colour stands in for it.",
  [('Surface', 'smooth, glossy; strong central keel (Wikipedia)')],
  'C1', [R_LEAF], [W_LP, VT, GGW], related=['grass_blade_upper', 'grass_stoma'])

N('grass_sheath', 'The leaf sheath', 'structure', 0.04, ['grass_tiller', 'grass_blade'],
  "The lower part of a grass leaf: a tube-like sheet that wraps round the stem and the younger leaves, protecting them and the growing point.",
  "Where the blade of a tree leaf is joined to the twig by a short stalk, a grass leaf has a sheath: the leaf's base is rolled round the stem like a sheet of paper round a pencil. The sheaths of the older leaves fit around the younger ones, forming a stiff tube near the ground, inside which the youngest leaves and the growing point are hidden. In perennial ryegrass the base of the sheaths is often tinged pink or purple.",
  "The sheath is hairless and not fully closed: the Grasses of North America flora says the sheaths are hairless and open (split) for more than half their length; the margins overlap. They are usually tinged pink at the base. The sheath bases hold the plant's sugar stores, fructans (see Fructan).",
  "Sheath lengths in the model are 3.4 to 4.8 cm, chosen. The colour at the base is not drawn.",
  [('Sheath', 'open for more than half its length, hairless (DELTA)'), ('Base colour', 'usually tinged pink (Wikipedia); purplish tiller bases (DELTA)')],
  'C1', [R_LEAF], [DELTA, W_LP], parts=['grass_ligule', 'grass_auricle', 'grass_fructan'], related=['grass_base_growth', 'grass_tiller'])

N('grass_ligule', 'The ligule: a tiny membrane at the junction', 'structure', 0.0015, ['grass_sheath', 'grass_blade'],
  "A thin, short, transparent flap of tissue where the blade meets the sheath, on the inside of the leaf. Botanists use it to tell grasses apart.",
  "If you pull a grass leaf away from the stem, a tiny skirt-like membrane stands at the top of the sheath, against the stem. In ryegrass it is very short, about 1 to 2 mm, with a blunt, jagged top edge and no hairs. Its job is probably to keep rain and dirt from running down between the sheath and the stem.",
  "Floras give the ligule of Lolium perenne as 1-2 mm, 'very short and truncated', less than 1 mm to 2 mm, 3 mm; no hairs (cilia). That the ligule keeps water out of the sheath is a general idea about grass ligules, not tested in ryegrass.",
  "Drawn at 1.5 mm, inside the 1-2 mm that floras give, with a blunt top and no hairs (the flora records the ligule as without cilia). The ligule is one of the features floras use to identify grasses, and its length differs between floras, from under 1 mm to 3 mm.",
  [('Length', '1-2 mm; floras vary from under 1 to 3 mm'), ('Edge', 'truncated, jagged, without hairs')],
  'C1', [R_LEAF], [DELTA, MNW, W_LP, VT, CORNELL], related=['grass_auricle', 'grass_sheath'])

N('grass_auricle', 'Auricles: the small claws at the base of the blade', 'structure', 0.002, ['grass_blade', 'grass_sheath'],
  "Two tiny pointed projections at the base of the blade, one on each side, where it meets the sheath. In ryegrass they are small and variable.",
  "At the top of the sheath, on either side of where the blade begins, ryegrass has a pair of little ears or claws that may grip the stem. They are small, and whether they are present and how they look differs between descriptions. Botanists check the ligule and the auricles together to identify a grass.",
  "Descriptions differ: some floras call the auricles small, white and gripping the stem; others claw-like and tapering, short and not clasping, straight to pointed or clasping, or absent or poorly developed. Ryegrass auricles are small and variable.",
  "Drawn as two 2 mm horns curving round the stem; this is a choice within that variation.",
  [('Auricles in L. perenne', 'small and variable: present or poorly developed; descriptions differ')],
  'C2', [R_LEAF], [W_LP, DELTA, VT, CORNELL, MNW], related=['grass_ligule', 'grass_sheath'],
)

N('grass_dead_leaf', 'Dead leaves at the base', 'structure', 0.08, ['grass_plant'],
  "Old leaves that have died and turned straw-coloured, lying at the base of the clump.",
  "Each leaf lives for a limited time. After it has grown and worked for a while it yellows and dies from the tip down, and the plant keeps going with newer leaves in the middle. The dead leaf eventually breaks down into the soil.",
  "Leaf development and senescence take about three to four phyllochrons in ryegrass (PMC8399834); at the phyllochrons measured there (4.44 to 9.22 days) that works out at about 13-37 days.",
  "Number and shape of the dead leaves in the model are illustrative. ",
  [('Leaf life: development to senescence', '≈ 3-4 phyllochrons (PMC8399834)')],
  'C2', [R_LEAF], [PMC_PHYL], related=['carbon_cycle_process', 'grass_tiller'])
