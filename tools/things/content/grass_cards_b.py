# Cards B: inside the leaf, silica, stomata, photosynthesis, monocot and eudicot, roots, below ground, fructan.
from grass_lib import *

N('grass_mesophyll', 'Mesophyll: the green tissue inside the blade', 'tissue', 0.0001, ['grass_blade'],
  "The soft green tissue between the two skins of the leaf, full of chloroplasts: this is where most of the light is caught and sugar is made.",
  "Cut a grass blade across and most of what you see is mesophyll: rounded cells packed with chloroplasts, the green bodies that run photosynthesis, with small air spaces between them so that carbon dioxide can reach every cell. It lies between the upper and lower skin of the leaf (the epidermis) and surrounds the veins.",
  "The chloroplasts hold chlorophyll, which absorbs red and blue light, and the enzymes that turn carbon dioxide and water into sugar (see Photosynthesis overview). Ryegrass is a C3 plant, which means it fixes carbon dioxide directly in these mesophyll cells (see C3 and C4 grasses). The sugar leaves the leaf through the phloem.",
  "Cell sizes, counts and the number of chloroplasts per cell in the tissue scene are illustrative; the scene says so.",
  [('Where', 'between the upper and lower epidermis, around the vascular bundles'), ('Type of photosynthesis', 'C3')],
  'C1', [R_LEAF, R_PHOTO], [GGW, PMC_POOID], parts=['grass_epidermis', 'grass_bundle'], related=['oak_leaf_palisade', 'oak_leaf_spongy', 'bio_chloroplasts_plastids', 'bio_photosynthesis_overview', 'photosynthesis_light_process', 'calvin_cycle_process', 'bio_leaf_structure_gas_exchange'])

N('grass_epidermis', 'Epidermis: the skin of the leaf', 'tissue', 0.00005, ['grass_blade'],
  "The single layer of cells on each face of the leaf. It keeps water in, lets light through, and contains the pores (stomata) and the silica cells.",
  "The epidermis is the skin of the leaf: one layer of cells, covered on the outside by a waxy film. In grasses it contains three special kinds of cell besides the ordinary skin cells: pairs of guard cells round the pores, bulliform cells that fold the leaf in drought, and cells that hold bodies of silica.",
  "Costal cells over the veins are rectangular and the cells between them are longer and spindle-shaped (Grass Genera of the World). The outer wall carries a cuticle. Cell walls are built of cellulose: click a cell and look inside it, and follow it down to the cellulose molecule.",
  "Cell sizes in the cut-open view and tissue scene are illustrative, not measured on ryegrass.",
  [('Layers', 'upper and lower epidermis, one cell thick'), ('Special cells', 'guard, subsidiary, bulliform, silica cells')],
  'C1', [R_LEAF], [GGW], parts=['grass_stoma', 'grass_bulliform', 'grass_silica_body'], related=['oak_leaf_epidermis', 'rn_leaf_epidermis', 'bio_cell_wall_ecm'])

N('grass_bundle', 'A vein: a vascular bundle', 'structure', 0.00005, ['grass_blade', 'grass_mesophyll'],
  "A strand of two kinds of pipe-like tissue, xylem and phloem, running the length of the blade: xylem brings water in, phloem takes sugar out.",
  "The parallel lines you see along a grass blade are its veins. Each vein is a bundle: the xylem carries water and minerals up from the roots into the leaf, and the phloem carries the sugar made in the leaf away to where it is used or stored, including the base of the shoot. Round each bundle is a ring of cells, the bundle sheath, and strengthening fibres.",
  "The xylem works by the cohesion-tension mechanism: water evaporating from the leaf pulls a column of water up through the dead, water-filled xylem tubes. The phloem moves sugar, mostly sucrose, by pressure flow. In Lolium all vascular bundles are accompanied by sclerenchyma (Grass Genera of the World). A ryegrass blade has 10 to 20 veins (DELTA); the cut-open view draws 11 and the tissue scene 3.",
  "A ryegrass blade has 10 to 20 veins in the flora; the cut-open leaf draws 11 (25 times life size) and the zoom-in scene 3. In the scene the xylem lies toward the upper, ribbed face and the phloem below it, the usual arrangement in a leaf; sizes and cell counts are illustrative.",
  [('Veins per blade', '10-20 (DELTA)'), ('Carried', 'xylem: water and minerals; phloem: sugar (mostly sucrose)')],
  'C1', [R_LEAF, R_TRANS], [DELTA, GGW], parts=['grass_bundle_sheath', 'grass_sclerenchyma'], related=['bio_water_transport', 'bio_phloem_transport', 'oak_leaf_vein'])

N('grass_bundle_sheath', 'The bundle sheath', 'tissue', 0.00003, ['grass_bundle'],
  "A ring of cells round each vein. In C4 grasses such as maize these cells do the second half of photosynthesis; in ryegrass they do not.",
  "Every vein in a grass leaf is wrapped in a ring of cells called the bundle sheath. In maize, sugarcane and other C4 grasses this ring holds special chloroplasts and is central to how the plant concentrates carbon dioxide. In ryegrass, which is a C3 plant, the sheath is a plainer ring that surrounds the vein.",
  "In C4 plants the bundle sheath cells are the inner ring of a two-ring Kranz arrangement and hold starch-rich chloroplasts (Wikipedia, C4 carbon fixation). Lolium is C3: it belongs to the grass subfamily Pooideae, which is exclusively C3.",
  "Drawn as nine tube-shaped cells round each bundle: illustrative.",
  [('Role in C4 grasses', 'second stage of carbon fixation'), ('In ryegrass', 'C3: no Kranz specialisation')],
  'C1', [R_LEAF, R_PHOTO], [W_C4, GGW, PMC_POOID], related=['grass_c3_c4', 'bio_photosynthetic_adaptations', 'grass_bundle'])

N('grass_sclerenchyma', 'Sclerenchyma: the stiffening fibres', 'tissue', 0.00003, ['grass_bundle'],
  "Strands of thick-walled, dead fibres that run beside the veins and stiffen the blade.",
  "A grass blade is thin and long, and could flop like a ribbon. Strands of tough fibre cells beside the veins give it stiffness while leaving it flexible enough to bend in the wind. They also make grass leaves tough to chew.",
  "The fibre cells have thick walls strengthened with cellulose and lignin. In Lolium all the vascular bundles are accompanied by sclerenchyma (Grass Genera of the World). Together with silica they add to the toughness of the leaf.",
  "Positions (caps above and below the larger bundles) are illustrative. In Lolium every vascular bundle has sclerenchyma with it; the thickness of the fibre walls is not measured in the model.",
  [('Role', 'support; toughness'), ('Present at', 'every vascular bundle in Lolium (Grass Genera of the World)')],
  'C1', [R_LEAF], [GGW], related=['bio_cell_wall_ecm', 'grass_silica_defence'])

N('grass_bulliform', 'Bulliform cells: the cells that fold the leaf', 'tissue', 0.00004, ['grass_epidermis', 'grass_blade_upper'],
  "Large, thin-walled cells in fans on the upper surface of the leaf. When the plant is short of water they lose water and shrink, and the leaf folds.",
  "On a dry, hot day a grass leaf can roll or fold. The cause is a group of big, empty-looking cells in the furrows of the upper surface. When they lose water they shrink, the two edges of the blade are drawn together, and the leaf closes like a half-shut book. That cuts the area exposed to the air and slows water loss. When water is available again the cells swell and the leaf opens.",
  "Bulliform cells are large, empty and colourless cells on the upper surface, generally near the midvein; the fold when they shrink is the standard explanation, though this has not been confirmed for all monocots. In Lolium they occur in discrete, regular groups on the upper surface, in simple fans (Grass Genera of the World).",
  "Number, size and position of the cells in the drawings are illustrative.",
  [('Where', 'upper surface, in fans in the furrows between ribs'), ('Effect', 'shrink when short of water; blade folds')],
  'C2', [R_LEAF], [W_BULL, GGW], related=['grass_blade_upper', 'bio_plant_hormones'], where='place:park')

N('grass_stoma', 'A grass stoma: a pore with dumbbell guard cells', 'structure', 0.00003, ['grass_epidermis', 'grass_blade_under'],
  "A microscopic pore in the leaf skin, framed by two dumbbell-shaped guard cells and two flanking cells. Carbon dioxide goes in and water vapour goes out through it.",
  "Leaves breathe through pores called stomata. In most plants, including the oak, each pore is flanked by two bean-shaped guard cells. Grass stomata are different: the two guard cells are shaped like dumbbells, with swollen ends and a narrow middle, and on each side of the pair sits another cell, a subsidiary cell. Click 'Look inside the leaf blade' for the section, or the pore in the scene to follow the carbon dioxide down to the molecule.",
  "Grass guard cells are 'narrower in the middle and bulbous on each end' and flanked by two lens-shaped subsidiary cells (Wikipedia, Stoma). Dumbbell guard cells open and close faster than kidney-shaped ones: in a comparison of four stomatal types, wheat's dumbbell stomata showed very rapid movements, which the authors attribute to their form and to a see-saw of pressure between guard and subsidiary cells (Franks and Farquhar 2007); a later review reports that graminoid stomata were on average faster by 10 minutes than the elliptical type, and that subsidiary cells are as important as guard cells. The Grass Genera of the World description records stomata as common on the lower surface of the Lolium blade.",
  "Stoma length is 10 to 80 micrometres across plant species; the scene's 30 µm pore is illustrative, not measured on ryegrass. The leaf-section scene shows guard cells in cross-section, where they look rounded rather than dumbbell-shaped.",
  [('Guard cells', 'dumbbell-shaped, with two subsidiary cells'), ('Compare the oak', 'kidney-shaped guard cells, no subsidiary cells'), ('Length across species', '10-80 µm (Wikipedia)')],
  'C1', [R_LEAF, R_PHOTO], [W_STOMA, FRANKS, PMC_STOMA_REV, GGW], parts=['grass_guard_cell', 'grass_subsidiary_cell'], related=['oak_leaf_stoma', 'rn_stoma', 'bio_leaf_structure_gas_exchange'],
  openq=["Why the dumbbell type is faster, and how much of the speed comes from the subsidiary cells, is still being worked out."],
  fig=spans([('stoma length, across plant species', 10, 80), ('ryegrass pollen grain, for scale', 26, 50)], 'µm', 'How big a stoma is, in micrometres (log scale): 10 to 80 across plant species, compared with a ryegrass pollen grain of 26 to 50. The first bar is the spread between species, not a measurement of ryegrass stomata.', 1, 100, ' µm', True))

N('grass_guard_cell', 'A dumbbell-shaped guard cell', 'structure', 0.00003, ['grass_stoma'],
  "One of the pair of cells that open and close the pore. In grasses each is shaped like a dumbbell.",
  "When the guard cells swell with water the pore opens; when they lose water it closes. The swollen ends of a grass guard cell and its narrow middle are what give the type its name.",
  "The pressure in guard cells and in their subsidiary cells changes in opposite directions as the pore moves; this see-saw is thought to underlie the fast movements (Franks and Farquhar 2007).",
  "Drawn with 11 µm bulbous ends and a 3.4 µm middle, an illustrative size. In wheat, a grass with the same dumbbell type, guard and subsidiary cells were found to move in a see-saw of pressure, which is the proposed reason for the fast stomatal movements of grasses; whether ryegrass behaves the same way has not been tested.",
  [('Shape', 'dumbbell: bulbous ends, narrow middle')],
  'C1', [R_LEAF], [W_STOMA, FRANKS], related=['grass_stoma', 'grass_subsidiary_cell', 'oak_leaf_stoma'])

N('grass_subsidiary_cell', 'A subsidiary cell', 'structure', 0.00004, ['grass_stoma'],
  "One of the two cells that lie beside the guard cells. They are a mark of the grass type of stoma.",
  "The oak's stoma has no cells like these. In grasses the two flanking cells have a lens shape and lie parallel to the pore. They help the pore move quickly.",
  "A review states that the role of subsidiary cells is as important as that of guard cells in regulating how quickly the pore moves; dumbbell guard cells are always flanked by subsidiary cells of this kind (Plant Physiology review).",
  "Drawn 38 µm long beside a 26 µm pore: sizes are illustrative, within the 10-80 µm that stomata span across plant species, and not measured on ryegrass.",
  [('Number', '2 per stoma'), ('Shape', 'lens-shaped, parallel to the pore')],
  'C1', [R_LEAF], [PMC_STOMA_REV, W_STOMA], related=['grass_stoma', 'grass_guard_cell'])

N('grass_silica_body', 'Silica bodies: glass in the leaf', 'structure', 0.00002, ['grass_epidermis', 'grass_silica_defence'],
  "Tiny hard particles of silica, a glass-like mineral, laid down in cells of the leaf skin. They make the leaf more abrasive, and in experiments they harmed the insects and voles that ate it.",
  "Grass takes up silicon from the soil, dissolved in water as silicic acid, and deposits it in and between cells as hard, glassy silica. The silica forms little bodies in certain skin cells over the veins. A mouthful of grass is therefore slightly gritty. In experiments, more silica made leaves harder on the mouthparts and digestion of caterpillars and voles. Whether it wears the teeth of large grazing mammals is still argued over (see the card on silica as a defence).",
  "Silicon is taken up from the soil as monosilicic acid, Si(OH)4, through transporters in the root (Lsi1 on the outer side, Lsi2 moving it inward in rice), and deposited as amorphous silica, called phytolith opal (PMC8066056; PMC6724085). Silicon content ranges from practically zero in some plants to 5 % of dry weight or more in grasses (PMC8066056). In Lolium the silica bodies are horizontally elongated or rounded (Grass Genera of the World).",
  "The scene draws one body above each vein; positions and sizes are illustrative. The silicic acid molecule in this explorer's data is orthosilicic acid.",
  [('Taken up as', 'silicic acid, Si(OH)4'), ('Deposited as', 'amorphous silica (opal) in cells')],
  'C1', [R_NUT], [PMC_SI, PMC_PHYT, GGW], related=['grass_silica_defence', 'grass_epidermis'])

N('grass_silica_defence', 'Silica as a defence: grass that is hard to eat', 'process', 0.001, ['grass_blade'],
  "Grasses with more silica in their leaves are more abrasive and harder to digest: in experiments, voles and caterpillars fed on high-silica grass grew more slowly. Whether silica also wears the teeth of large grazing mammals is debated.",
  "Grass cannot run away from being eaten, so it has other defences. One is silica: a grass plant given more silicon packs more silica into its leaves. In experiments, voles given such grass fed less on it and grew more slowly, and caterpillars that ate it converted their food less well and wore down their jaws. What this does to the teeth of cattle, sheep or horses is a different and unsettled question, dealt with below.",
  "In perennial ryegrass (Lolium perenne) leaf silica was about 0.54 % of dry mass in a low-silica treatment and 4.68 % in a high-silica one; plants collected in the field ranged 0.58-4.52 % (Massey and Hartley 2006). In that study raised silica made grass more abrasive and deterred feeding by field voles, and reduced vole growth by lowering the nitrogen they absorbed. In insects, silica addition made leaves more abrasive in four of five grass species and deterred two leaf-chewing species, but did not affect a sap-feeding aphid (Massey, Ennos and Hartley 2006). In the armyworm Spodoptera exempta, high-silica diets wore the mandibles within a single growth stage, and lowered food conversion and nitrogen uptake; part of the lasting effect on growth was explained by mandible wear (Massey and Hartley 2009). Mammal teeth are the debated part (certainty: actively debated). The long-standing idea is that phytolith-rich grass wears the teeth of large grazers and drove the evolution of high-crowned teeth as grasslands spread. That is now questioned: the hardness of phytoliths compared with enamel has been challenged, grit and dust on leaves can wear enamel as well, and work on grassland phytoliths in South America found that high-crowned teeth evolved before open grasslands (summarised by Sanson 2023). Laboratory work in 2025 found that artificial leaves containing phytoliths increased pre-existing wear on enamel; rabbits fed quartz grit lost more tooth height with more and larger grit (Martin and colleagues 2022). Both phytoliths and grit may contribute; how much each does in wild grazers is unresolved.",
  "The experiments were on particular herbivores (field voles, armyworm caterpillars, desert locusts, an aphid) and controlled silica levels, not on wild grazing mammals. The ryegrass silica values come from plants grown in a glasshouse in perlite.",
  [('Leaf silica, L. perenne, low and high treatment', '0.54 % and 4.68 % of dry mass'), ('Field plants, L. perenne', '0.58-4.52 %'), ('Experiments (voles, caterpillars)', 'more abrasive leaves; reduced growth'), ('Wear of large mammals\' teeth by phytoliths', 'debated (phytoliths versus grit)')],
  'C2', [R_NUT], [MASSEY06, MASSEY_JAE, MASSEY09, SANSON, LAKHAL, MARTIN22, PMC_SI], related=['grass_silica_body', 'grass_sclerenchyma'],
  openq=['Do the silica bodies of grass, or the grit and dust on its leaves, do most of the wear to the teeth of grazing mammals, and did grasses drive the evolution of high-crowned teeth? Studies disagree.'],
  fig=bars([('ryegrass, low-silica treatment', .54), ('ryegrass, high-silica treatment', 4.68), ('sheep\'s fescue, low treatment', .52), ('sheep\'s fescue, high treatment', 2.44)], 'silica, per cent of dry mass', 'Leaf silica in two grasses grown with a low or a high supply of silicon in a glasshouse (Massey and Hartley 2006, Table 1). Field-grown ryegrass ranged from 0.58 to 4.52 per cent. Each bar is a treatment mean.'))

N('grass_c3_c4', 'C3 ryegrass and C4 maize: two ways to photosynthesise', 'process', 0.001, ['grass_plant', 'grass_mesophyll'],
  "Perennial ryegrass uses the C3 type of photosynthesis, best in cool, moist weather. Maize, sugarcane and many tropical grasses use C4, which does better in heat and bright light.",
  "All green plants turn carbon dioxide and water into sugar using light. Plants differ in how they first capture the carbon dioxide. In C3 plants such as ryegrass, wheat and oak, the capture happens in the main leaf cells. In C4 plants such as maize, an extra first step happens in one set of cells and the carbon dioxide is then handed to the cells round the veins. That helps in hot, bright, dry weather. This is why ryegrass is a cool-season grass that grows best in spring and autumn, while maize is a summer crop.",
  "About 8,100 plant species use C4 carbon fixation, about 3 % of terrestrial plant species; 46 % of grasses are C4 and they make up 61 % of C4 species; C4 plants are about 5 % of Earth's plant biomass and about 23 % of terrestrial carbon fixation (Wikipedia, C4 carbon fixation). The grass subfamily that contains Lolium (Pooideae) is exclusively C3 (PMC10184452). Optimum soil temperature for shoot growth of perennial ryegrass is 16-24 °C (60-75 °F), and for root growth about 10-18 °C (University of Minnesota turf).",
  "The C4 percentages are rounded figures from a general reference and differ between estimates.",
  [('Ryegrass', 'C3, cool-season: shoot growth best at 16-24 °C soil temperature (Minnesota turf)'), ('Maize, sugarcane, sorghum', 'C4 (Wikipedia)'), ('Grass species that are C4', '≈ 46 % (Wikipedia)'), ('Share of terrestrial carbon fixation by C4 plants', '≈ 23 % (Wikipedia)')],
  'C1', [], [W_C4, PMC_POOID, UMN], parts=['grass_bundle_sheath', 'grass_mesophyll'], related=['bio_photosynthetic_adaptations', 'bio_photosynthesis_overview', 'calvin_cycle_process', 'photosynthesis_light_process'],
  fig=bars([('C4 plants, share of terrestrial plant species (%)', 3), ('C4 plants, share of plant biomass (%)', 5), ('C4 plants, share of terrestrial carbon fixation (%)', 23), ('grass species that are C4 (%)', 46)], 'per cent', 'C4 photosynthesis: rare among plant species but common among grasses and responsible for about a quarter of land photosynthesis (Wikipedia, C4 carbon fixation).'))

N('grass_monocot', 'Grass and buttercup: a monocot and a eudicot', 'process', 0.5, ['grass_plant', 'rn_acris'],
  "Grasses are monocots; the buttercup in the park is a eudicot. They are both flowering plants, but differ in seed leaves, leaf veins, flower parts and roots.",
  "Flowering plants fall into two big groups. A grass has one seed leaf, long narrow leaves with parallel veins, and a mass of fine roots of similar size. A buttercup has two seed leaves, leaves with a branching network of veins, and flower parts in fives (its five petals). Textbooks add that many eudicots have a main root, but the park's buttercup does not: like the grass, it has a mass of fine roots. Grass flowers, being pollinated by wind, are tiny and have no showy petals.",
  "From the OpenStax table of monocot and eudicot characteristics: cotyledons, one or two; leaf veins, parallel (monocot) or a network (eudicot); floral parts in multiples of three (monocot) or of four or five (eudicot); roots fibrous (monocot) or often a main root (eudicot); stem vascular bundles scattered (monocot) or in a ring (eudicot); pollen with one furrow (monocot) or three (most eudicots). None of these traits is exclusive to one group, and the root difference is only a tendency: the meadow buttercup is a eudicot with fibrous roots. A grass flower is reduced: its showy petals are gone and only two small scales, the lodicules, remain at the base of the flower.",
  "The meadow buttercup in the park is a eudicot and the grass stands near it; follow the 'Compare with' links. The 'floral parts in threes' trait is not obvious in grass because the flower is so reduced (three stamens, two stigmas, two lodicules).",
  [('Seed leaves', 'grass: 1; buttercup: 2'), ('Leaf veins', 'grass: parallel; buttercup: net'), ('Flower parts', 'grass: reduced (3 stamens, 2 lodicules); buttercup: 5 petals, 5 sepals, many stamens'), ('Roots', 'grass: fibrous; buttercup: also fibrous (see its card); a main root is typical of many other eudicots')],
  'C1', [R_ANGIO, R_PLANT], [OS_ANGIO, W_MONO, GGW], related=['rn_acris', 'rn_basal_leaf', 'rn_flower', 'rn_roots', 'bio_seed_plants'])

N('grass_roots', 'The fibrous root system', 'structure', 0.25, ['grass_plant', 'grass_below_ground'],
  "A mass of thin roots, all about the same size, spreading from the base of the plant. They anchor it and take up water and minerals.",
  "A grass has no single main root. Instead, many thin roots grow out from the lowest nodes of every tiller, each branching into finer roots. Together they form a dense mat in the top layer of the soil. New roots grow with new tillers, so the root system grows as the clump grows. Select the layer 'Underground' to see them.",
  "Most of the roots of a perennial ryegrass sward are shallow: root mass is typically concentrated in the top 10 cm of soil (Troughton 1957, cited in a Grassland Congress abstract). In one hydroponic study (cv. Aberdart) there were typically two roots per leaf-unit of the shoot (range 0 to 6), and the main root axis measured 36.9 cm in spring and 26.3 cm in autumn: that is a length in solution, not a depth in soil. Ryegrass is usually associated with arbuscular mycorrhizal fungi (Wikipedia).",
  "The model's roots reach about 26 cm and are a schematic: number, course and branching differ in a real plant. Real swards differ in how deep their roots go.",
  [('Root mass of a ryegrass sward', 'typically in the top 10 cm (Troughton 1957)'), ('Main root axis in hydroponics', '36.9 cm (spring); 26.3 cm (autumn)'), ('Type', 'fibrous: no main tap root')],
  'C1', [R_ROOT], [UKY, PMC_PHYL, OS_ROOTS, W_LP], parts=['grass_root_tip', 'grass_root_hairs', 'grass_soil'], related=['rn_roots', 'oak_roots', 'bio_roots_mycorrhiza', 'bio_plant_nutrition_soil', 'grass_below_ground'])

N('grass_root_tip', 'The root tip and root cap', 'structure', 0.0015, ['grass_roots'],
  "The end of a root: a protective cap, a zone where cells divide, a zone where they lengthen, and then root hairs.",
  "A root grows only at its tip. The very end is covered by a root cap that is rubbed away as the root pushes through the soil and is replaced. Behind it is a small zone where cells divide, then a zone where they lengthen and push the tip forward. Further back the cells are mature and some grow root hairs.",
  "The zones, from the tip: root cap (continuously replaced because it is damaged easily), zone of cell division (the root meristem), zone of elongation, and zone of maturation, where cells differentiate, starting at the first root hair (OpenStax Biology 2e 30.3).",
  "The zoom-in scene draws about 1.7 mm of root: cap cells about 22 µm, dividing cells 14 µm, lengthening cells up to 38 µm, mature surface cells 90 µm long, and root hairs 16 µm wide and 500 µm long. Only the hair width (15-17 µm in general) comes from a published range; the zone lengths and other sizes are illustrative.",
  [('Zones, tip to base', 'root cap · cell division · elongation · maturation with root hairs')],
  'C1', [R_ROOT], [OS_ROOTS], parts=['grass_root_cap', 'grass_root_hairs'], related=['oak_root_hairs', 'bio_roots_mycorrhiza'])

N('grass_root_cap', 'The root cap', 'structure', 0.0003, ['grass_root_tip'],
  "A thimble of loose cells over the tip of the root, protecting the growing cells behind it.",
  "As the root pushes through soil, the cap cells at the front are scraped off and constantly replaced by new ones.",
  "The root cap is continuously replaced because it gets damaged easily as the root pushes through the soil (OpenStax Biology 2e 30.3).",
  "In the zoom-in scene the cap is drawn as a stack of about fifteen cells 22-24 µm wide, an illustrative size. Cells at the front are the ones that wear away, so the dividing cells behind them are shielded as the tip pushes through the soil.",
  [('Fate', 'continuously worn away and replaced')],
  'C1', [R_ROOT], [OS_ROOTS], related=['grass_root_tip'])

N('grass_root_hairs', 'Root hairs', 'structure', 0.0005, ['grass_root_tip', 'grass_roots'],
  "Tiny hair-like extensions of single root skin cells, which greatly increase the surface through which water and minerals are taken up.",
  "Just behind the growing tip, some skin cells of the root put out a thin tube, the root hair. Each is one cell's extension, too small to see without magnification. They reach into the spaces between soil grains and take up water and dissolved minerals. They are drawn only on the tips of the roots and at an illustrative length.",
  "Root hair cells vary between 15 and 17 µm in diameter, and 80 to 1,500 µm in length (Wikipedia, Root hair; values for root hairs in general, not ryegrass). Root hairs are found only in the zone of maturation (OpenStax Biology 2e 30.3). Fibrous roots near the soil surface are typical of monocots.",
  "The model's hairs (about 0.7 mm long, 36 per root tip) are illustrative: they are not measured ryegrass values.",
  [('Diameter', '15-17 µm (general; Wikipedia)'), ('Length', '80-1,500 µm (general; Wikipedia)'), ('Drawn', 'illustrative length')],
  'C1', [R_ROOT], [W_ROOTHAIR, OS_ROOTS], related=['oak_root_hairs', 'bio_roots_mycorrhiza', 'bio_plant_nutrition_soil'])

N('grass_soil', 'The soil round the roots', 'habitat', 0.3, ['grass_roots'],
  "Soil: mineral grains, dead plant material and living things. Grass roots grow through it and hold it together.",
  "This block of soil is drawn see-through so that you can see the roots. The roots of grass are so many and so fine that they bind soil grains together, which is why turf holds firm.",
  "See the Ground and soil card for what soil is made of; the nutrients grass takes from it are covered in Plant nutrition and soil.",
  "The block is 0.6 m across and 0.32 m deep and is not a sample of real soil.",
  [('Drawn', 'see-through block, 0.6 m × 0.32 m')],
  'C1', [R_NUT], [OS_ROOTS], related=['park_ground', 'bio_plant_nutrition_soil', 'bio_roots_mycorrhiza'])

N('grass_below_ground', 'How much of the grass plant is below ground?', 'process', 0.3, ['grass_plant', 'grass_roots'],
  "In many grasslands a large part of a plant's living material is underground; the roots of a ryegrass sward are concentrated in the top 10 cm.",
  "What you see above the soil is only part of the plant. The roots are hidden. Because they sit in the top layer of soil, the underground part of a lawn is a thin, dense mat. Mowing cuts only the above-ground leaf and leaves the roots.",
  "Root mass of a perennial ryegrass sward is typically shallow, concentrated in the top 10 cm of soil (Troughton 1957). Grazing advice from the University of Missouri is that plants keep their roots vigorous if no more than half the leaf area is removed at each grazing.",
  "No single fraction of ryegrass biomass below ground is given, because it varies with the sward, the season and how it is cut.",
  [('Root mass of a sward', 'concentrated in the top 10 cm (Troughton 1957)'), ('Keeping root vigour (Missouri, for grazing)', 'remove no more than half the leaf area at each grazing')],
  'C2', [R_ROOT], [UKY, MO], related=['grass_roots', 'grass_lawn', 'bio_ecosystem_stability'])

N('grass_fructan', 'Fructan: the sugar store of ryegrass', 'process', 0.00005, ['grass_crown', 'grass_sheath'],
  "Ryegrass keeps its spare sugar not as starch but as fructan, a chain of fructose units, stored in the leaf sheaths and the base of the shoot.",
  "When a plant makes more sugar than it uses, it stores some. Many plants store starch. Perennial ryegrass keeps a large store as fructan: a chain of fructose sugar units joined to a sucrose end. It is kept in the sheaths and the base of the shoot, the part that survives mowing, and is a reserve for regrowth, and fructans are thought to help in cold and drought.",
  "The main storage compounds in Lolium perenne are fructans with mainly β(2-6) linkages, which are sucrose-derived fructose polymers; perennial ryegrass accumulates large amounts of them in the tiller base, made up of leaf sheaths and elongating leaf bases (PMC3060680). Fructans are believed to confer cold and drought tolerance. In one study chain lengths up to 70 units were found, and fructans up to length 8 were well characterised; those with more than 8 units made up 75 % of the fructans that had an internal glucose (PMC3060680; Frontiers 2015). Root fructan can be used for rapid growth in early spring (Frontiers 2015).",
  "The molecule set of this explorer has no fructan: the scene ends at fructose, the sugar unit. Fructans are its main storage compounds.",
  [('Main storage compounds', 'fructans (β(2-6) linkages)'), ('Stored in', 'tiller base: leaf sheaths and elongating leaf bases'), ('Chain length found', 'up to 70 units (Frontiers 2015)')],
  'C1', [], [PMC_FRUC, FRONT_FRUC], related=['bio_polysaccharides', 'grass_crown', 'grass_base_growth'])
