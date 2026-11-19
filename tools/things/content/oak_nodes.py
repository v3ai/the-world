# Source of the oak cards (data/nodes/park_tree.json) and their figures (data/viz/park.json).
# Run:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/oak_nodes.py   (from the repo root)
import json, os

W_RHD = {'title': 'Quercus robur (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Quercus_robur'}
W_SAP = {'title': 'Sapwood (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Sapwood'}
W_XYL = {'title': 'Xylem (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Xylem'}
W_PHL = {'title': 'Phloem (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Phloem'}
W_LEAF = {'title': 'Leaf (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Leaf'}
W_CHL = {'title': 'Chloroplast (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Chloroplast'}
W_MYC = {'title': 'Mycorrhiza (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Mycorrhiza'}
WT = {'title': 'English oak (Woodland Trust)', 'url': 'https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/british-trees/a-z-of-british-trees/english-oak/'}
EGU = {'title': 'Water use of mature oaks at BIFoR FACE (EGU23-6064, abstract)', 'url': 'https://meetingorganizer.copernicus.org/EGU23/EGU23-6064.html'}
SAPDATA = {'title': 'Sapwood estimates of Quercus robur, SW Pannonian Basin (dataset)', 'url': 'https://data.mendeley.com/datasets/8fyrzzg66d'}
STOM = {'title': 'Stomata and leaf trichome characteristics in Quercus robur genotypes (record)', 'url': 'https://agris.fao.org/search/ru/records/65e0149f63b8185d9cb12d63'}

R = lambda sec, slug: ['BIO', sec, slug]
R301 = R('30.1', '30-1-the-plant-body'); R302 = R('30.2', '30-2-stems'); R303 = R('30.3', '30-3-roots'); R304 = R('30.4', '30-4-leaves'); R305 = R('30.5', '30-5-transport-of-water-and-solutes-in-plants')
R313 = R('31.3', '31-3-nutritional-adaptations-of-plants'); R321 = R('32.1', '32-1-reproductive-development-and-structure'); R322 = R('32.2', '32-2-pollination-and-fertilization')
R263 = R('26.3', '26-3-angiosperms'); R43 = R('4.3', '4-3-eukaryotic-cells'); R81 = R('8.1', '8-1-overview-of-photosynthesis'); R243 = R('24.3', '24-3-ecology-of-fungi')

NODES = []
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, where=None, area='bio_plants'):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': area, 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
         'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if dyk: n['did_you_know'] = dyk
    NODES.append(n)

N('oak_english', 'English oak', 'organism', 20, ['bio_seed_plants'],
  'The English oak (Quercus robur) is a broad-leaved tree of European woods and parks; a mature one is a living tower of wood that stands for hundreds of years.',
  'An oak is a plant that has turned into a tree: it keeps its stem year after year and adds a new layer of wood to it every growing season. Roots below hold it up and drink; the trunk and branches lift the leaves into the light; the leaves make sugar from air, water and sunlight. Click any part of the tree to meet it. The layer buttons show the wood inside the trunk, the roots under the ground, and the water and sugar that flow through the tree.',
  'It is a flowering plant (an angiosperm), in the beech family. Each spring it opens new leaves in about the middle of May in Britain, flowers with long yellow catkins, and in autumn drops acorns, each in a shallow cup. It is deciduous: the leaves fall in autumn and the tree rests through winter. Its wood is dense and long-lasting, which is why oak was used for ships and buildings.',
  'As a tree with secondary growth, its trunk widens through the vascular cambium and its crown extends through apical meristems at the shoot tips. The tree supports a very large community of insects, fungi, birds and mammals.',
  [['Typical height', '≈ 20 m, sometimes up to 40 m'], ['Model height', '≈ 20 m (chosen); trunk diameter ≈ 1.0 m at breast height, girth ≈ 3.1 m; crown ≈ 19 m wide'], ['Lifespan', 'often over 500 years; some believed over 1,000'], ['Species living on it (UK)', '≈ 2,300 estimated']],
  refs=[R263, R301, R302], ext=[W_RHD, WT],
  dyk='Oaks "mast": in some years a tree drops a huge crop of acorns and in others very few. Q. robur is described as bearing a big crop about every other year.',
  openq=['Why do oaks in one area all produce big acorn crops in the same year? Weather cues seem to be involved, but how the trees stay in step is still studied.'],
  parts=['oak_trunk', 'oak_branches', 'oak_leaf', 'oak_acorn', 'oak_roots', 'oak_ecosystem', 'oak_lifespan', 'oak_growth'])

N('oak_trunk', 'Oak trunk', 'structure', 1, ['oak_english'],
  'The trunk holds the crown up and carries water and sugar between roots and leaves. At the base it flares out into buttresses that spread the load.',
  'The trunk is the tree\'s mast and its pipework. The outside is rough bark. Inside, almost all of it is wood: old, dead wood in the middle that only holds things up, and a thin ring of younger wood near the surface that carries water. Choose "Wood" to see a log cut open.',
  'Where the trunk meets the ground it widens into root flares. The widening spreads the load of a heavy crown over more ground and joins the trunk to the big roots. Higher up, the trunk forks into limbs. The total cross-section of the limbs above a fork is roughly the same as the cross-section of the trunk below it, as if the tree were built from a bundle of pipes of fixed size.',
  'The "pipe model" (Shinozaki and colleagues, 1964) treats a tree as a bundle of unit pipes, one for each unit of leaf, so a branch\'s cross-sectional area is about the sum of the areas of the branches it carries. It is an approximation: real trees depart from it with age, species and wind loading. The model oak\'s limbs are built to this rule.',
  [['Model trunk', '≈ 1.0 m across at 1.3 m height (about 3.1 m round), widening to ≈ 1.5 m at the ground'], ['Model fork height', '≈ 2.7 m']],
  cert='C2', refs=[R302], ext=[W_RHD], parts=['oak_bark', 'oak_cork', 'oak_phloem', 'oak_cambium', 'oak_sapwood', 'oak_heartwood', 'oak_growth_rings', 'oak_pith_rays', 'oak_branches'],
  openq=['How closely real branching follows the pipe model, and why, is still debated.'])

N('oak_bark', 'Bark', 'structure', .03, ['oak_trunk'],
  'Bark is everything outside the cambium: a living inner part that carries sugar, and a dead, cracked outer part that protects.',
  'Bark is the tree\'s skin. It keeps water in, keeps fire, insects and fungi out, and cushions the living layers underneath. On an old oak it is thick, grey-brown and cut by deep vertical furrows. The furrows appear because the trunk keeps getting wider and the dead outer bark cannot stretch, so it cracks.',
  'Bark has two main layers. The inner bark is the phloem, which is alive and carries sugar. The outer bark is made mostly of dead cells, including cork, that a thin layer of cells called the cork cambium makes year after year. Old outer bark is pushed outwards and eventually flakes off or stays in ridges.',
  'Botanists call the whole outer protective tissue the periderm: the cork cambium (phellogen) makes cork (phellem) on the outside and a thin living layer (phelloderm) on the inside. Cork cells are coated with suberin, a waxy polymer that blocks water. In older trees new cork cambia form deeper in the bark, cutting off outer layers: this is why oak bark builds up as thick ridges. Bark also contains tannins, which defend against pests and which people used to tan leather.',
  [['Bark colour', 'grey-brown, with close vertical grooves in vertical plates'], ['Model bark thickness', '≈ 3 cm (typical for a trunk this size; not measured on a real tree)']],
  refs=[R302], ext=[W_RHD, WT], parts=['oak_cork', 'oak_phloem'])

N('oak_cork', 'Cork and cork cambium', 'tissue', .01, ['oak_bark'],
  'Cork is the dead, waterproof outer layer of bark; a thin layer of dividing cells, the cork cambium, makes it.',
  'On the outside of the trunk lies a layer of cells that are dead and filled with air. Their walls are waterproofed with a waxy substance, so the layer works like a raincoat and a draught excluder. A thin sheet of cells just under it keeps dividing to make more.',
  'The dividing sheet is the cork cambium. It makes cork cells outwards, and a few living cells inwards. As the trunk widens, old cork splits, and the cambium renews it. Cork also lets gas through at small pores called lenticels, so living cells under the bark can still breathe.',
  'Cork cell walls carry suberin, a polyester of fatty acids and aromatic compounds, which makes the layer almost impermeable to water. The cork oak (Quercus suber) makes unusually thick cork, which is harvested for stoppers. English oak makes far less, but the principle is the same.',
  [['Cork cells', 'dead at maturity, walls coated with suberin'], ['Gas exchange through bark', 'at pores called lenticels']],
  refs=[R302], ext=[W_RHD])

N('oak_phloem', 'Inner bark (phloem)', 'tissue', .008, ['oak_bark', 'bio_phloem_transport'],
  'The inner bark is the phloem: living tubes that carry sugar solution from the leaves to wherever the tree is growing or storing food.',
  'Right under the dead outer bark is a thin living layer. Its tubes carry a sweet liquid made in the leaves down the trunk to the roots, and up to buds and acorns. If a ring of bark is cut all the way round the trunk, the tree can no longer send sugar to its roots, and it will eventually die.',
  'The tubes are made of sieve tube elements, long cells joined end to end, with pores in the end walls. They have no nucleus when mature, so each one is kept alive by a small neighbour called a companion cell. Sugar, mostly sucrose, is pushed along by pressure: the leaves load sugar in, water follows by osmosis, the pressure rises, and the solution flows towards places where sugar is being used.',
  'Phloem transport is described by the pressure-flow (Münch) hypothesis: loading raises sugar concentration and turgor pressure at the source, unloading lowers it at the sink, and bulk flow follows the pressure gradient. Phloem pressure can reach several megapascals. Flow speeds are far lower than in the xylem, and the exact rates vary with tree, season and method. The figure here is drawn thicker than a real trunk\'s inner bark so it can be seen in the cut log.',
  [['Main sugar carried', 'sucrose'], ['Direction', 'both ways, from sources (leaves) to sinks (roots, buds, acorns)'], ['Pressure', 'positive, up to several MPa']],
  refs=[R305], ext=[W_PHL], parts=['bio_phloem_transport'],
  openq=['Exactly how the very long sieve tubes of tall trees keep their flow balanced and how far the pressure-flow picture holds in the tallest trees are still being tested.'])

N('oak_cambium', 'Vascular cambium', 'tissue', .0005, ['oak_trunk'],
  'The vascular cambium is a thin layer of cells that divide to make new wood inwards and new inner bark outwards. It is how a trunk gets wider.',
  'Between the wood and the bark lies a layer only a few cells thick that never stops dividing while the tree lives. Each year it adds a ring of new wood on its inside and a little new bark on its outside. This is why a trunk grows fatter. The cut log draws this layer much thicker than it is, so you can find it.',
  'The cambium is a ring of meristem, tissue made of cells that stay able to divide. Daughter cells on the inner side become xylem (wood), those on the outer side become phloem. Because wood is added far faster than bark, the cambium is pushed steadily outwards as the trunk thickens. In temperate trees it works in a yearly rhythm: wide pale cells in spring, narrow dense cells later, which gives each year its ring.',
  'The cambium consists of fusiform initials, which make the long cells of the wood and bark, and ray initials, which make the radial rays. Its activity is regulated by hormones, among them auxin from the growing shoots above, and by temperature and water supply. In the model log, the cambium is about 5 mm thick for visibility; in life the dividing zone is a few cell widths, a fraction of a millimetre.',
  [['Thickness in life', 'a few cells (a fraction of a millimetre)'], ['Thickness drawn in the model', '≈ 5 mm, exaggerated on purpose'], ['Yearly growth of circumference', '≈ 2π × ring width (e.g. a 3 mm ring adds ≈ 1.9 cm)']],
  refs=[R302], ext=[W_SAP], parts=['oak_growth'])

N('oak_sapwood', 'Sapwood', 'tissue', .03, ['oak_trunk'],
  'Sapwood is the younger, outer wood of a trunk. It carries water up from the roots and stores food.',
  'The pale wood near the outside of a log is the sapwood. Water rises through it from the roots to the leaves. It also stores sugar and starch that the tree draws on in spring, before new leaves can make food.',
  'The water travels through dead, empty tubes (vessels) that are open like pipes. The living cells among them store food. In oak only the youngest rings do the carrying. A study of 344 samples from 13 sites of the English oak in south-eastern Europe found on average about 13 sapwood rings, with a range of 5 to 32, so the water-carrying zone is a thin outer layer of an old oak. The model log has 13 rings of sapwood.',
  'Oak is ring-porous: the vessels formed in early spring, the earlywood, are very wide (about 0.5 mm across) and carry most of the water, while the narrow vessels of later wood carry less. A vessel is formed from a stack of cells whose end walls break down and whose living contents die, leaving a pipe. Sapwood width depends on the tree: crown size, site and position in the stand all matter. Open-grown trees tend to have wider sapwood for their size.',
  [['Sapwood rings (English oak)', 'mean ≈ 13, range ≈ 5–32 (344 samples from 13 sites)'], ['Earlywood vessel width', '≈ 0.5 mm'], ['Model sapwood', '13 rings, ≈ 2.4 cm thick']],
  refs=[R302, R305], ext=[W_SAP, W_XYL, SAPDATA], parts=['bio_water_transport'])

N('oak_heartwood', 'Heartwood', 'tissue', .3, ['oak_trunk'],
  'Heartwood is the darker, older wood at the centre of a trunk. It no longer carries water, but it holds the tree up and resists rot.',
  'The deep, darker wood in the middle of a log is heartwood. It is not the "living heart" its name suggests. Its job is to hold the tree up. It is darker because the tree stores chemicals in it that make it harder for fungi and insects to feed on it, which is one reason oak timber lasts so long.',
  'As rings get older, the living cells inside them die in a planned process and the wood fills with protective chemicals. A tree can survive with a rotted heart: the active layers are near the surface. Many old oaks are hollow and still alive for centuries.',
  'Heartwood formation is genetically programmed and happens without injury; the transition zone shows the final death of the living cells and the build-up of extractives such as phenolic compounds. Oak heartwood is reported to contain triterpene saponins and is classed as durable. The timber of English oak has a density of about 720 kg per cubic metre.',
  [['Oak timber density', '≈ 720 kg/m³'], ['Role', 'support and decay resistance; no water carrying'], ['Model heartwood radius', '≈ 38 cm of the 49 cm trunk radius']],
  cert='C1', refs=[R302], ext=[W_SAP, W_RHD])

N('oak_growth_rings', 'Annual growth rings', 'structure', .003, ['oak_trunk'],
  'Each ring in a cut trunk is one year of wood. Count the rings and you know the tree\'s age at that height.',
  'In places with seasons, a tree grows in a yearly rhythm: in spring it builds wide cells for lots of water flow, later it builds smaller, denser ones. On a cut trunk this shows as a pale band and then a darker band, together one ring. Count them from the middle out and you have the number of years. Wide rings mean good years, narrow rings mean poor ones. The cut log has about 150 rings.',
  'Ring widths are a record of the weather and of the tree\'s own history, such as a crowded youth or a gap opening in the forest canopy. Scientists match the ring patterns of many trees and old timbers to date wood to the exact year; this is called dendrochronology. Counting at the base tells how old the tree is only if the cut is at ground level, because the tree took some years to reach the height of the cut.',
  'In oak, the earlywood vessels are large and form a clear pore ring, the latewood is dense and darker. Rings are not always one per year: drought or insect defoliation can produce a partial or missing ring, which is why dendrochronologists cross-date against reference series. The model has 150 rings whose widths are random around a plausible trend (wider when young, narrower later); they are not a real tree\'s record.',
  [['One ring', '= one growing season'], ['Rings in the cut log', '150 (model)'], ['Mean ring width in the model', '≈ 2.7 mm']],
  refs=[R302], ext=[W_SAP], dyk='Because wide and narrow years follow the weather, ring patterns from living trees and old beams can be lined up like a barcode to give an exact year for a piece of timber.')

N('oak_pith_rays', 'Pith and wood rays', 'structure', .006, ['oak_trunk'],
  'The pith is the soft core where the shoot began. Rays are thin sheets of living cells that run across the wood from the centre outwards.',
  'At the very middle of a trunk is the pith, a small core of soft tissue that was the centre of the tiny seedling stem. Fine lines run outwards from the middle like the spokes of a wheel. These are rays, sheets of living cells that carry food sideways across the rings and store it.',
  'Rays are the one part of the wood that runs radially (outwards) and not up and down. They let sugar from the inner bark reach the living cells deep in the sapwood, and they let the tree send water sideways. In oak some rays are broad enough to see without a lens, and they make the silvery "fleck" pattern in quarter-sawn oak boards.',
  'Wood rays are made by the ray initials of the cambium. Oak has two kinds, narrow rays about 0.1 mm thick and a few wide aggregate rays. In the model log the rays are drawn as pale radial streaks on the cut faces; their number, length and spacing are illustrative.',
  [['Narrow ray thickness', '≈ 0.1 mm'], ['Pith in the model', '≈ 1.2 cm across (drawn, real pith is a few mm)']],
  cert='C1', refs=[R302], ext=[W_RHD])

N('oak_branches', 'Oak branches', 'structure', 10, ['oak_english'],
  'Branches carry leaves out into the light. An oak in the open spreads wide, with a few huge limbs low down.',
  'An oak grown in the open has thick, crooked limbs that reach out sideways and form a wide dome, because there is light on all sides. An oak in a dense wood grows tall and straight with a narrow crown as it competes upward. Each branch splits again and again until the twigs that carry leaves.',
  'Each branch grows at its tip, and new side branches grow from buds. A branch\'s thickness matches the amount of branching it carries, so thick limbs near the trunk thin step by step to twigs. The model\'s branches are grown by a computer rule in which each tip grows toward free space with light, then thickened by the pipe rule.',
  'The shape of the crown comes from apical dominance, shedding of shaded lower branches, and repeated damage and regrowth that give the crooked, massive look of old oaks. The branching in this model is generated by space colonisation, an algorithm that grows a skeleton toward points scattered in a crown-shaped volume, not from measurements of one real tree.',
  [['Model crown', '≈ 19 m across, ≈ 15 m deep'], ['Branch skeleton', 'procedurally generated'], ['Typical crown (Wikipedia)', 'wide, unevenly domed, with massive lower branches']],
  cert='C2', refs=[R302], ext=[W_RHD], parts=['oak_twigs_buds'])

N('oak_twigs_buds', 'Twigs and buds', 'structure', .3, ['oak_branches'],
  'Twigs are this year\'s thin shoots. Each ends in a cluster of buds that hold next year\'s growth folded up inside.',
  'A twig is a young branch. At its tip sits a bud: a tiny package of unopened leaves wrapped in scales. In winter the tree is bare and the buds wait. In spring they swell and open. Oaks have buds grouped in a cluster at the end of each twig.',
  'Each bud holds a miniature shoot with leaves already formed, which is why a tree can open its leaves in days. Buds at the tip carry on the main shoot; buds along the side make branches. Scars left where bud scales fell away mark the year\'s boundary on the twig, so you can read the age of a twig.',
  'Buds contain apical meristems. Dormancy is set by day length and temperature: a tree needs enough cold in winter and then warmth in spring before it breaks bud, which is why a warming climate changes the date of leaf-out. Bud burst for oak in Britain is reported around mid-May. The leaves, buds and twigs in the model are drawn to typical sizes and are placed by a rule, not copied from a real branch.',
  [['Bud position', 'clustered at the shoot tip'], ['Leaf-burst (Britain)', 'mid-May']],
  refs=[R302, R301], ext=[WT])

N('oak_leaf', 'Oak leaf', 'organ', .11, ['oak_english'],
  'The leaf is a thin, flat solar panel and chemical factory: it takes in carbon dioxide and light and makes sugar. Click Look inside to see its layers.',
  'An oak leaf is shaped like a long paddle with rounded lobes along each side. It is about 10 cm long and held on a very short stalk. Its flat shape catches light. Its green colour comes from chlorophyll, the molecule that captures sunlight. Inside, the leaf is only a fraction of a millimetre thick. Choose "Look inside the leaf" to go there.',
  'The leaf takes in carbon dioxide through tiny pores, mostly on its underside, and uses light energy to join the carbon to water, making sugar and releasing oxygen. A network of veins brings water in and carries sugar out. The lobes of the English oak\'s leaf are rounded and cut in no deeper than halfway to the midrib. It drops its leaves in autumn.',
  'English oak leaves are about 10–12 cm long and 7–8 cm wide, with 3–6 rounded lobes, and a leaf stalk (petiole) of only 2–3 mm. The leaf is hypostomatous, meaning the stomata are on the underside; one study of 17 genotypes counted 530–791 per square millimetre. The model has about 9,500 leaves; a real oak this size has many more, but no count was found, so none is stated here.',
  [['Leaf size', '≈ 10–12 cm long, 7–8 cm wide'], ['Leaf stalk', '≈ 2–3 mm'], ['Lobes', '3–6, rounded, cut no deeper than halfway'], ['Stomata (underside)', '≈ 530–791 per mm² (study of 17 genotypes)']],
  refs=[R304, R81], ext=[W_RHD, W_LEAF, STOM], parts=['bio_leaf_structure_gas_exchange', 'oak_leaf_epidermis', 'oak_leaf_palisade', 'oak_leaf_spongy', 'oak_leaf_stoma', 'oak_leaf_vein', 'bio_chloroplasts_plastids', 'bio_photosynthesis_overview'])

N('oak_leaf_epidermis', 'Leaf cuticle and epidermis', 'tissue', .00002, ['oak_leaf'],
  'The outer skin of a leaf: a waxy waterproof coat and a single layer of flat cells beneath it.',
  'A leaf must let light and air in but keep water from escaping. The outer cells form a skin, and on top of it is a thin waxy layer, the cuticle. Together they are a raincoat for the leaf. The cuticle is thicker on the top (sun) side than the underside.',
  'The epidermis is one layer of tightly joined cells without chloroplasts, except for the pairs of guard cells. Being clear and flat, they let light through to the cells below. The cuticle is made of cutin and wax and is thinner on the lower epidermis than on the upper in most leaves.',
  'Epidermal cells secrete the cuticle. Leaves in dry climates tend to have a thicker cuticle. The scene\'s dimensions are illustrative: the layers are drawn at relative sizes typical of a broadleaf leaf, not measured on oak.',
  [['Layers (top to bottom)', 'cuticle, upper epidermis, palisade, spongy mesophyll, lower epidermis, cuticle'], ['Chloroplasts in epidermis', 'none, except in guard cells']],
  refs=[R304], ext=[W_LEAF])

N('oak_leaf_palisade', 'Palisade mesophyll', 'tissue', .00005, ['oak_leaf'],
  'Tall, tightly packed cells just under the top surface, filled with chloroplasts: the main light-catching layer.',
  'Right below the top skin stand rows of tall, narrow cells, like fence posts, packed shoulder to shoulder. They face the sun and are crammed with chloroplasts, the green parts that capture light. This is where most of the leaf\'s sugar-making happens.',
  'Their column shape lets light pass down the long cells while the chloroplasts line the walls. Most flowering plants have one to two layers of palisade cells; leaves in full sun can have more. In the scene each palisade cell holds only a few chloroplasts to keep the picture readable.',
  'Chloroplast number varies from one in some algae to many dozens (up to about 100 in Arabidopsis and wheat) per mesophyll cell. Light is absorbed as it passes down the leaf so the upper layers do most of the photosynthesis and the lower layers use light scattered by the cell walls. The proportions drawn are typical, not measured on oak.',
  [['Palisade layers', '1–2 cells thick in most flowering plants'], ['Chloroplasts per cell (real)', 'many dozens, up to ≈ 100 in some species'], ['Chloroplasts per cell drawn', '9 (simplified)']],
  refs=[R304, R43], ext=[W_LEAF, W_CHL])

N('oak_leaf_spongy', 'Spongy mesophyll', 'tissue', .00005, ['oak_leaf'],
  'Loosely packed cells with air gaps between them, below the palisade layer, where gases move through the leaf.',
  'Below the fence-post cells lies a looser layer of rounder cells with air gaps between them. Carbon dioxide comes in through the pores below and spreads through these gaps to reach every cell, and oxygen and water vapour leave the same way. These cells also have chloroplasts.',
  'The gaps form a connected network of air spaces so gases can reach cells deep in the leaf. Gases dissolve in the thin film of water on the cell walls, then enter the cell. Water leaving the leaf as vapour comes out through the same spaces.',
  'The air spaces make up a large share of the leaf\'s internal volume; the total area of the cell walls facing the air is many times the area of the leaf itself, which is what makes gas uptake fast enough. The exact internal-space fraction varies with the species and the light the leaf grew in.',
  [['Function', 'gas exchange between pores and cells'], ['Chloroplasts', 'present, fewer than in palisade cells']],
  refs=[R304], ext=[W_LEAF])

N('oak_leaf_stoma', 'Stoma and guard cells', 'structure', .00003, ['oak_leaf'],
  'A stoma is a pore in the leaf skin between two bean-shaped guard cells that open and close it.',
  'Stomata (one is a stoma) are the leaf\'s breathing holes. Two curved cells, the guard cells, sit side by side. When they swell with water they bend apart and open a gap. When they lose water they straighten and shut it. Open, the leaf takes in carbon dioxide but loses water vapour. Closed, it saves water but cannot make sugar.',
  'Guard cells respond to light, to the leaf\'s water supply and to the carbon dioxide level inside. In the daytime, with enough water, they open. In a drought, a plant hormone tells them to close. Guard cells are the only cells of the epidermis with chloroplasts. English oak has its stomata on the underside, hundreds per square millimetre.',
  'Opening works by osmosis: potassium and other ions flow into the guard cells, water follows, and the cells swell. Their walls are stiffer on the side facing the pore, so swelling bends the cell apart. Stomatal density across species ranges widely (1,000 to 100,000 per cm² in general; 530–791 per mm² measured across 17 pedunculate oak genotypes).',
  [['Position in oak', 'underside only (hypostomatous)'], ['Density in oak', '≈ 530–791 per mm²'], ['Guard cells', 'the only epidermal cells with chloroplasts']],
  refs=[R304], ext=[W_LEAF, STOM])

N('oak_leaf_vein', 'Leaf vein', 'structure', .0001, ['oak_leaf'],
  'A vein is a small bundle of pipes in the leaf: water arrives in the xylem, sugar leaves in the phloem.',
  'Veins are the leaf\'s plumbing. Each one holds two kinds of tubes side by side. The ones on the top side bring in water from the twig. The ones on the underside carry the sugar made in the leaf out to the rest of the tree. Veins branch into a fine net so that no cell is far from one.',
  'The xylem sits on the upper side of the bundle and the phloem on the lower side. A sheath of cells around the bundle controls what passes between the veins and the leaf cells. Water leaving the vein spreads through the cell walls to the cells that need it.',
  'The xylem conduits are dead, empty tubes, so water in them flows by the pull of evaporation at the leaf, not by pushing. Phloem sieve tubes are living but lack a nucleus and are served by companion cells. A vessel\'s capacity to carry water rises with the fourth power of its diameter, so a few wide tubes carry a great deal.',
  [['Xylem position', 'upper side of the bundle'], ['Phloem position', 'lower side of the bundle'], ['Vessel flow', 'rises with diameter to the 4th power']],
  refs=[R304, R305], ext=[W_LEAF, W_XYL])

N('oak_acorn', 'Acorn and oak reproduction', 'organ', .025, ['oak_english'],
  'An acorn is an oak\'s fruit: a single nut holding one seed, sitting in a scaly cup. Each one could grow into a new tree.',
  'In spring an oak makes two kinds of flowers on the same tree. Long yellow catkins hang down and shed pollen on the wind. Tiny female flowers further up the twig receive it. By autumn the fertilised flowers have become acorns, each in a cup. Most acorns are eaten by animals, and a few are buried and forgotten, and sprout.',
  'The wind-blown pollen is the male half of the cell\'s genes; the female flower holds the egg. After fertilisation the seed forms inside the nut, with a store of food that feeds the seedling. Jays and squirrels bury acorns and help the oak spread. English oak acorns are 1.5–4 cm long and hang on a stalk of 4–8 cm, two or three together. Some years the tree makes many acorns, and some years almost none.',
  'The oak is monoecious and wind-pollinated. Mast seeding (large synchronised crops) swamps seed predators so that some seeds survive. The species is described as alternate bearing, with a big crop about every other year. Acorn length reported on one page is 1.5–4 cm and on another 2–2.5 cm, and the model uses a nut about 2.5 cm long.',
  [['Acorn length', '≈ 1.5–4 cm'], ['Stalk length', '≈ 4–8 cm'], ['Model acorns', 'a few hundred, hung on the sprigs']],
  refs=[R321, R322], ext=[W_RHD, WT], dyk='A single acorn contains an entire oak: a small root, shoot and a store of food, packaged in a nut.')

N('oak_roots', 'Oak roots', 'structure', 8, ['oak_english'],
  'Roots anchor the tree and take up water and minerals from the soil. Most of the root system is far thinner than you can see.',
  'Below ground, an oak has roots that reach as far across as the crown does above ground, or further. Big roots near the trunk hold the tree and carry water; smaller ones branch off them and, at the ends, are very fine roots that do the drinking. Choose "Roots" to see through the ground.',
  'The very fine roots, finer than a pencil lead, take up almost all the water and minerals. They are short-lived and are replaced all the time. The big roots store sugar and hold the tree upright against the wind. The root system draws its shape from the soil: roots go where the water and nutrients are.',
  'Roots take up water by osmosis, with the greatest absorption near the tips where root hairs form. Many trees put most of their roots into the upper layers of soil, where oxygen, water and nutrients are, but the pattern varies with soil and species. The root system in the model is a schematic made by a growth rule, not a map of a real tree\'s roots, and the fine roots are far fewer than in real life.',
  [['Root uptake', 'water and dissolved minerals, mostly at fine root tips'], ['Model', 'schematic; real oak root systems differ with soil']],
  cert='C2', refs=[R303], ext=[W_RHD], parts=['oak_root_hairs', 'oak_mycorrhiza', 'bio_roots_mycorrhiza'],
  openq=['How the total mass of fine roots in a forest changes through the seasons and with a warming climate is hard to measure and still being studied.'])

N('oak_root_hairs', 'Root tip and root hairs', 'structure', .0001, ['oak_roots'],
  'Root hairs are tiny tubes growing from the cells of a young root that multiply its surface for taking up water.',
  'Just behind the tip of a young root, some skin cells grow a thin, hair-like tube out into the soil. Each is a single cell. A root covered in hairs touches far more soil than a bare root could, so it can reach more water in the soil between grains.',
  'The root tip is protected by a cap and has a growing zone behind it where cells divide and then lengthen. Root hairs form a little further back in the zone where cells mature. They live only days to weeks. Oaks, like most trees, rely heavily on a fungus partner to do part of this job.',
  'Root hairs are outgrowths of epidermal cells. They greatly increase the root surface area and so the uptake of water and mineral ions, particularly phosphate that moves slowly in soil. In many trees, ectomycorrhizal roots form short, branched tips that are covered with fungus and produce few or no root hairs.',
  [['Root hair', 'one cell, lives days to weeks'], ['Function', 'larger surface for water and mineral uptake']],
  refs=[R303], ext=[W_MYC])

N('oak_mycorrhiza', 'Mycorrhiza: the oak\'s fungal partners', 'process', .01, ['oak_roots', 'bio_roots_mycorrhiza'],
  'Oaks trade sugar with underground fungi that act as extensions of their roots.',
  'Oak roots are wrapped in a sheath of fungus. The fungus sends fine white threads out into the soil, far beyond the root, where they collect water and minerals. The tree pays for this with sugar made in its leaves. Neither side could do as well alone.',
  'This kind of partnership is called ectomycorrhiza. The fungus makes a mantle around the root tip and grows between the root cells without entering them. The oak family and the pine family are among the plants that do this. A tree typically has 15 or more fungal partners at once. Some of them make the mushrooms you find under oaks in autumn.',
  'The fungus supplies water and minerals such as phosphorus, nitrogen and zinc and receives photosynthetic carbon. Ectomycorrhizal fungi total an estimated 20,000–25,000 species, about 2% of plant species form this partnership, and most of those are dominant trees. How much carbon and information moves between trees through shared fungal networks is under active debate.',
  [['Partnership type', 'ectomycorrhiza (fungus around and between root cells)'], ['Fungal partners per tree', '≈ 15 or more'], ['Trade', 'sugar from the tree; water and minerals from the fungus']],
  cert='C2', refs=[R313, R243], ext=[W_MYC],
  openq=['Do trees share meaningful amounts of carbon and chemical signals through the fungal networks that join them? Experiments exist, but how much it matters in a real forest is still being argued.'])

N('oak_lignin_cellulose', 'Cellulose and lignin: what wood is made of', 'molecule', 1e-8, ['oak_sapwood', 'bio_polysaccharides'],
  'Wood is mainly cellulose fibres glued and stiffened by lignin.',
  'The strength of wood comes from two materials. Cellulose is long chains of sugar molecules bundled into tough fibres. Lignin is a hard, brown, glue-like substance that fills the spaces between the fibres and makes the wall rigid and waterproof. It is rather like steel rods set in concrete.',
  'Every plant cell wall has cellulose. Wood cells, after they finish growing, build a thick second wall with lignin and then usually die, leaving a hard empty shell. Lignin makes vessels strong enough to hold water under strong pull without collapsing.',
  'Cellulose is a polymer of β-glucose units, shown in the molecule viewer as the three-sugar fragment cellotriose; microfibrils of many chains are held by hydrogen bonds. Lignin is a cross-linked polymer built from phenolic alcohols and is one of the most abundant organic polymers on Earth after cellulose.',
  [['Cellulose', 'polymer of glucose'], ['Lignin', 'cross-linked phenolic polymer that stiffens cell walls']],
  refs=[R302, R305], ext=[{'title': 'Cellulose (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Cellulose'}, {'title': 'Lignin (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Lignin'}], where='mol:cellotriose')

N('oak_water_lift', 'How an oak lifts water 20 metres', 'process', 20, ['oak_sapwood', 'bio_water_transport'],
  'Water climbs through the oak because evaporation from the leaves pulls on a continuous chain of water molecules; the tree uses no pump.',
  'Water evaporates from the leaves. Because water molecules stick to each other, the evaporation pulls the whole column of water in the wood upwards, like sucking a drink through a straw. The tree does not push the water from below; it is pulled from above, using the energy of sunlight that drives the evaporation.',
  'The pulling puts the water in the wood under tension, a negative pressure. This is possible because the narrow tubes are lined with wall that water sticks to and water molecules cohere strongly. Lifting a column 20 m against gravity alone needs a pressure difference of about 0.2 MPa; the real pull is bigger, because the water also has to be forced through the narrow tubes.',
  'The weight of a water column is about 9.8 kPa per metre of height (density times gravitational acceleration), so 20 m needs about 0.2 MPa: this is a calculation, not a measurement of an oak. Real xylem tensions in trees are several times larger because of friction. A study of 18 mature English oaks at a UK site found daily water use of about 2.4 litres per millimetre of stem radius, with peak sap flow around 0.04 litres per second.',
  [['Gravity alone, 20 m', '≈ 0.2 MPa (calculated: 9.8 kPa per m × 20 m)'], ['Daily water use, mature oak (UK study)', '≈ 2.4 L per mm of trunk radius'], ['Peak sap flow (UK study)', '≈ 0.04 L/s'], ['Typical tension in xylem', '≈ −1 to −3 MPa (existing card)']],
  cert='C2', refs=[R305], ext=[EGU, W_XYL],
  openq=['The tallest trees push the cohesion–tension limit; how they avoid or repair air bubbles in their water columns is still being researched.'], parts=['bio_water_transport'])

N('oak_growth', 'How an oak grows wider and taller', 'process', 20, ['oak_english'],
  'A tree grows taller from the tips of its shoots and wider from a thin layer under the bark.',
  'An oak gets taller and longer-limbed because the tips of its shoots and roots keep growing. It gets wider because the layer just under the bark, the cambium, keeps adding a new ring of wood each year. Taller growth happens in spring and early summer; wider growth continues until autumn.',
  'The two kinds of growth use two different groups of dividing cells. At the tips are apical meristems, which add length. Along the trunk, branches and roots is the vascular cambium, which adds width. In Britain the tree breaks bud in mid-May. Wood laid down in earlier years does not move: a nail hammered into the trunk stays at the same height as the tree grows taller.',
  'Primary growth (from apical meristems) makes the new shoots and roots; secondary growth (from the vascular and cork cambia) thickens them. The share of the year\'s carbon spent on wood, leaves, roots and acorns is a balance the tree adjusts with the season and with stress, and is not the same every year.',
  [['Lengthening', 'apical meristems at shoot and root tips'], ['Widening', 'vascular cambium, one ring a year']],
  refs=[R301, R302], ext=[W_SAP])

N('oak_ecosystem', 'What lives on an oak', 'concept', 20, ['oak_english'],
  'A single oak is a whole community: insects, fungi, lichens, birds and mammals live in or on it.',
  'An old oak is like a small town. Caterpillars and beetles eat the leaves and wood. Birds nest in its holes and eat the insects. Jays and squirrels bury its acorns. Lichens and mosses grow on the bark. Fungi live in its roots and rot its dead heartwood, making cavities for bats and owls.',
  'Estimates for Britain say that over 2,300 species are associated with the English oak, and at least 400 of them are plant-eating insects, about 35 of them gall-formers: insects that trick the leaf into growing a ball around their egg. Dead and dying oak wood is also a habitat in its own right.',
  'Counts of "associated species" depend on how association is defined and on how well each group has been surveyed, and Britain\'s figures cannot be transferred to other parts of Europe without caution. A 2019 estimate gave about 2,300 associated species in the UK.',
  [['Species associated (UK estimate, 2019)', '≈ 2,300'], ['Plant-eating insects', '≥ 400'], ['Gall-forming species', '≈ 35']],
  cert='C2', refs=[R243], ext=[W_RHD, WT])

N('oak_lifespan', 'How long oaks live', 'concept', 20, ['oak_english'],
  'English oaks often live over 500 years, and a few may live much longer.',
  'An oak that has been left to grow can see many human generations. Many English oaks are over 500 years old. A few ancient trees are believed to be more than 1,000 years old. They get there partly by letting parts of themselves die: old oaks often lose branches and heartwood and keep growing from what is left.',
  'The age of very old oaks is usually an estimate, because their centres are hollow and their rings cannot be counted. Age is then estimated from the trunk\'s girth and from the size of younger trees with known ages, which carries large uncertainty.',
  'Two named trees, the Stelmužė Oak and the Granit Oak, are estimated at more than 1,500 years old. These are estimates, not countable rings. Heart rot hollows the trunk, which removes the oldest rings, so the true age of a hollow oak is not directly knowable.',
  [['Typical old age', '> 500 years'], ['Believed oldest', '> 1,000 years; two estimated > 1,500']],
  cert='C2', refs=[R301], ext=[W_RHD], openq=['How old is the oldest oak? For a hollow tree the answer is an estimate, and different methods disagree.'])

json.dump(NODES, open('data/nodes/park_tree.json', 'w'), indent=1, ensure_ascii=False)

# ---------------- figures ----------------
F = {}
def blocks(nodes, edges, caption, flow=True):
    return {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'color': c} if c else {})} for i, l, x, y, c in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'flow': flow, 'caption': caption}
F['oak_english'] = blocks([('r', 'Roots', 15, 82, None), ('t', 'Trunk', 15, 50, None), ('b', 'Branches', 50, 30, None), ('l', 'Leaves', 85, 15, 'green')], [('r', 't', 'water and minerals up'), ('t', 'b', None), ('b', 'l', None), ('l', 'r', 'sugar down')], 'Two flows run through the whole tree: water and minerals rise from the roots to the leaves, and sugar made in the leaves is sent down and out to where it is used.')
F['oak_trunk'] = {'type': 'plot', 'x': [0, 1], 'y': [0, 2], 'params': [{'id': 'r1', 'label': 'limb 1 radius', 'min': 2, 'max': 30, 'value': 12, 'unit': 'cm'}, {'id': 'r2', 'label': 'limb 2 radius', 'min': 2, 'max': 30, 'value': 16, 'unit': 'cm'}], 'fns': [{'f': 'sqrt(r1^2+r2^2)/10', 'label': 'trunk radius by the pipe model (×10 cm)'}], 'readouts': [{'label': 'Trunk radius if the pipe model holds', 'value': 'sqrt(r1^2+r2^2)', 'unit': 'cm'}, {'label': 'Cross-section of the two limbs', 'value': 'pi*(r1^2+r2^2)', 'unit': 'cm²'}], 'caption': 'The pipe model: the trunk below a fork has about the same cross-section as the limbs above it added together, so its radius is the square root of the sum of the squares. An approximation, not an exact law.'}
F['oak_bark'] = blocks([('o', 'Dead outer bark and cork', 15, 20, None), ('c', 'Cork cambium makes cork', 15, 50, None), ('p', 'Inner bark (phloem), living', 55, 50, 'orange'), ('v', 'Vascular cambium', 55, 80, 'green'), ('w', 'Wood', 15, 80, None)], [('c', 'o', 'cork outwards'), ('v', 'p', 'phloem outwards'), ('v', 'w', 'wood inwards')], 'Bark is everything outside the vascular cambium. Two thin sheets of dividing cells make it: one makes cork, one makes sugar-carrying phloem.', False)
F['oak_cork'] = {'type': 'plot', 'x': [0, 10], 'y': [0, 20], 'params': [{'id': 'k', 'label': 'years of trunk widening', 'min': 1, 'max': 10, 'value': 5, 'unit': 'yr'}], 'fns': [{'f': '2*pi*0.3*x', 'label': 'extra trunk circumference (cm) for 3 mm rings'}], 'vlines': [{'x': 'k', 'label': 'now'}], 'readouts': [{'label': 'Circumference gained by the trunk', 'value': '2*pi*0.3*k', 'unit': 'cm'}], 'caption': 'As the trunk gets wider, the outer bark must stretch or crack. Each year of 3 mm of wood adds about 1.9 cm to the circumference, which the cork cannot stretch to match: the furrows open.'}
F['oak_phloem'] = blocks([('s', 'Leaf (source): sugar loaded in', 80, 15, 'green'), ('t', 'Sieve tubes carry the solution', 50, 50, 'orange'), ('k1', 'Roots (sink)', 15, 85, None), ('k2', 'Buds and acorns (sink)', 85, 85, None)], [('s', 't', 'water follows sugar in'), ('t', 'k1', 'flow to low pressure'), ('t', 'k2', None)], 'Pressure flow: sugar loaded at the leaves raises the pressure there, and the solution flows toward the places where sugar is being taken out.')
F['oak_cambium'] = {'type': 'plot', 'x': [1, 6], 'y': [0, 4], 'params': [{'id': 'w', 'label': 'ring width', 'min': 1, 'max': 6, 'value': 3, 'unit': 'mm'}], 'fns': [{'f': '2*pi*x*0.1', 'label': 'extra circumference (cm)'}], 'vlines': [{'x': 'w', 'label': 'chosen ring'}], 'readouts': [{'label': 'Circumference added in a year', 'value': '2*pi*w*0.1', 'unit': 'cm'}, {'label': 'Diameter added in a year', 'value': '2*w*0.1', 'unit': 'cm'}], 'xlabel': 'ring width (mm)', 'ylabel': 'cm gained', 'caption': 'The cambium adds a ring of wood one ring-width thick all round the trunk. A ring of width w makes the circumference grow by 2πw. Slide w.'}
F['oak_sapwood'] = {'type': 'plot', 'x': [1, 6], 'y': [0, 8], 'params': [{'id': 'n', 'label': 'sapwood rings', 'min': 5, 'max': 32, 'value': 13, 'step': 1}], 'fns': [{'f': 'n*x/10', 'label': 'sapwood thickness (cm)'}], 'readouts': [{'label': 'Sapwood thickness at 2.7 mm per ring', 'value': 'n*0.27', 'unit': 'cm'}], 'xlabel': 'ring width (mm)', 'ylabel': 'sapwood thickness (cm)', 'caption': 'Sapwood is a fixed number of recent rings (5 to 32 in a study of English oaks, 13 on average), so its thickness is the number of rings times the ring width.'}
F['oak_heartwood'] = blocks([('a', 'Living sapwood: carries water, stores food', 20, 20, 'blue'), ('b', 'Cells die, chemicals deposited', 50, 50, 'orange'), ('c', 'Heartwood: support, decay resistance', 80, 80, None)], [('a', 'b', 'as the ring gets older'), ('b', 'c', None)], 'A ring starts as sapwood. After about a dozen years in oak it changes into heartwood: a planned process, not damage.', False)
F['oak_growth_rings'] = {'type': 'plot', 'x': [0, 200], 'y': [0, 80], 'params': [{'id': 'w', 'label': 'average ring width', 'min': 1, 'max': 6, 'value': 2.7, 'step': .1, 'unit': 'mm'}], 'fns': [{'f': 'x*w/10', 'label': 'trunk radius (cm)'}], 'vlines': [{'x': 150, 'label': 'model log: 150 rings'}], 'readouts': [{'label': 'Radius of wood after 150 rings', 'value': '150*w/10', 'unit': 'cm'}], 'xlabel': 'rings counted (years)', 'ylabel': 'wood radius (cm)', 'caption': 'The number of rings is the age; the width of a ring is how well that year went. 150 rings at 2.7 mm each give about 40 cm of wood radius, as in the model log.'}
F['oak_pith_rays'] = blocks([('p', 'Pith (centre)', 15, 50, None), ('r', 'Ray: living cells running outwards', 50, 50, 'green'), ('b', 'Inner bark (sugar supply)', 85, 50, 'orange')], [('b', 'r', 'sugar in'), ('r', 'p', 'to inner rings')], 'Rays are the tree\'s side streets: they carry sugar from the bark sideways to living cells in the wood.')
F['oak_branches'] = {'type': 'plot', 'x': [1, 400], 'y': [0, 30], 'params': [{'id': 'rt', 'label': 'twig-end radius', 'min': .2, 'max': 1, 'value': .5, 'step': .05, 'unit': 'cm'}], 'fns': [{'f': 'rt*sqrt(x)', 'label': 'limb radius (cm)'}], 'xlabel': 'number of twig ends the limb carries', 'ylabel': 'limb radius (cm)', 'caption': 'If every twig end has the same size, a limb carrying N of them has radius r×√N under the pipe model: a limb carrying 400 twig ends is 20 times as wide as one twig.'}
F['oak_twigs_buds'] = blocks([('w', 'Winter: bud scales close', 15, 20, None), ('s', 'Spring: bud swells and opens', 50, 20, 'green'), ('g', 'Shoot grows, new leaves', 85, 50, 'green'), ('n', 'Summer: new buds form at the tip', 50, 80, None)], [('w', 's', None), ('s', 'g', None), ('g', 'n', None), ('n', 'w', None)], 'The yearly cycle of a twig: next year\'s growth is already folded inside the bud before winter.')
F['oak_leaf'] = {'type': 'geometry', 'range': [-5, 5, -1, 11], 'params': [{'id': 'd', 'label': 'how deep the cuts go (0 = smooth)', 'min': 0, 'max': .5, 'value': .4, 'step': .05}], 'shapes': [{'k': 'curve', 'x': '(3.4*pow(s,.85)*pow(1-s,.55)*(1-d*(.5-.5*cos(25.13*s)))*(1.0))*1.0/0.55', 'y': '10*s', 's': [0, 1], 'color': 'green'}, {'k': 'curve', 'x': '-(3.4*pow(s,.85)*pow(1-s,.55)*(1-d*(.5-.5*cos(25.13*s))))/0.55', 'y': '10*s', 's': [0, 1], 'color': 'green'}, {'k': 'line', 'x1': 0, 'y1': 0, 'x2': 0, 'y2': 10, 'color': 'dim'}, {'k': 'text', 'x': 0, 'y': 10.6, 'text': 'about 10 cm', 'align': 'center'}], 'caption': 'An English oak leaf: rounded lobes cut in no deeper than halfway to the midrib (cut depth up to 0.5). A drawing from a formula, not a tracing of a real leaf.'}
F['oak_leaf_epidermis'] = blocks([('c', 'Cuticle: wax, stops water loss', 50, 15, 'orange'), ('e', 'Epidermis: clear, flat cells', 50, 50, None), ('m', 'Mesophyll: light is used here', 50, 85, 'green')], [('c', 'e', 'light passes through'), ('e', 'm', None)], 'The leaf\'s skin lets light through to the cells beneath while holding water in.', False)
F['oak_leaf_palisade'] = {'type': 'plot', 'x': [0, 200], 'y': [0, 1], 'params': [{'id': 'k', 'label': 'absorption (per 100 µm)', 'min': .2, 'max': 3, 'value': 1.2, 'step': .1}], 'fns': [{'f': 'exp(-k*x/100)', 'label': 'light left at depth x'}], 'xlabel': 'depth below the top surface (µm)', 'ylabel': 'fraction of light left', 'caption': 'Light fades as it goes down through a leaf, so the top layer does most of the work. The absorption rate here is a chosen example, not a measurement of oak.'}
F['oak_leaf_spongy'] = blocks([('s', 'Stoma (underside)', 15, 80, None), ('a', 'Air spaces between cells', 50, 50, 'blue'), ('c', 'Cells: CO₂ dissolves into wall water', 85, 20, 'green')], [('s', 'a', 'CO₂ in'), ('a', 'c', None), ('c', 'a', 'O₂, water vapour out'), ('a', 's', None)], 'Gas takes the route of least resistance: through open pores, along the air gaps, into the cells.')
F['oak_leaf_stoma'] = blocks([('t', 'Water flows into guard cells', 15, 20, 'blue'), ('o', 'Guard cells swell and bend apart: pore open', 50, 50, 'green'), ('i', 'CO₂ in, water vapour out', 85, 80, None), ('d', 'Drought hormone: guard cells lose water, pore closes', 15, 80, 'orange')], [('t', 'o', None), ('o', 'i', None), ('d', 'o', None)], 'Opening and closing of a stoma is osmosis: guard cells swell with water to open and shrink to close.', False)
F['oak_leaf_vein'] = {'type': 'plot', 'x': [5, 100], 'y': [0, 1], 'params': [{'id': 'D', 'label': 'reference vessel diameter', 'min': 10, 'max': 100, 'value': 50, 'unit': 'µm'}], 'fns': [{'f': 'pow(x/D,4)', 'label': 'relative flow in a vessel of diameter x'}], 'logy': False, 'xlabel': 'vessel diameter (µm)', 'ylabel': 'flow relative to a 50 µm vessel', 'caption': 'Flow through a tube rises with the fourth power of its diameter: a vessel twice as wide carries sixteen times as much water. This is why oak\'s wide vessels carry so much.'}
F['oak_acorn'] = blocks([('c', 'Male catkins shed pollen', 15, 20, None), ('f', 'Female flower pollinated by wind', 50, 20, None), ('a', 'Acorn grows, ripens in the cup', 85, 50, 'orange'), ('d', 'Animals bury some acorns', 50, 80, None), ('s', 'Seedling', 15, 80, 'green')], [('c', 'f', None), ('f', 'a', None), ('a', 'd', None), ('d', 's', None)], 'An oak\'s life cycle: wind carries the pollen, the fertilised flower becomes an acorn, and a few acorns survive to become seedlings.')
F['oak_roots'] = blocks([('s', 'Soil water and minerals', 15, 50, 'blue'), ('f', 'Fine roots and fungal partners', 45, 50, None), ('t', 'Big roots', 70, 50, None), ('k', 'Trunk, xylem upward', 90, 20, 'green')], [('s', 'f', 'uptake'), ('f', 't', None), ('t', 'k', None)], 'Uptake happens at the thinnest roots; the thick roots are for transport, storage and anchorage.')
F['oak_root_hairs'] = {'type': 'plot', 'x': [0, 200], 'y': [0, 20], 'params': [{'id': 'L', 'label': 'root hair length', 'min': .2, 'max': 1.5, 'value': .8, 'step': .1, 'unit': 'mm'}], 'fns': [{'f': '(1+x*(pi*0.012*L)/(pi*0.4))', 'label': 'surface area compared with bare root'}], 'xlabel': 'root hairs per mm of root', 'ylabel': 'area ÷ area of a bare root', 'caption': 'Example arithmetic (example sizes, not oak measurements): a root 0.4 mm across with hairs 12 µm across gains surface with every hair it grows. Slide the hair length.'}
F['oak_mycorrhiza'] = blocks([('t', 'Oak leaves: sugar', 85, 15, 'green'), ('r', 'Oak root tip with fungal sheath', 50, 50, None), ('f', 'Fungal threads in soil', 15, 85, 'orange')], [('t', 'r', 'sugar down'), ('r', 'f', 'sugar to fungus'), ('f', 'r', 'water, phosphorus, nitrogen')], 'A trade: the tree pays in sugar and the fungus delivers water and minerals from a far larger volume of soil than the roots reach.')
F['oak_lignin_cellulose'] = blocks([('g', 'Glucose', 15, 20, None), ('c', 'Cellulose fibres', 15, 80, 'green'), ('p', 'Phenolic alcohols', 85, 20, None), ('l', 'Lignin glue', 85, 80, 'orange'), ('w', 'Wood cell wall', 50, 50, None)], [('g', 'c', None), ('p', 'l', None), ('c', 'w', None), ('l', 'w', None)], 'Wood is a composite: strong cellulose fibres embedded in a rigid lignin matrix.', False)
F['oak_water_lift'] = {'type': 'plot', 'x': [0, 40], 'y': [0, .5], 'fns': [{'f': '0.0098*x', 'label': 'pressure needed to hold up water against gravity (MPa)'}], 'vlines': [{'x': 20, 'label': 'model oak, 20 m'}], 'xlabel': 'height (m)', 'ylabel': 'pressure difference (MPa)', 'readouts': [{'label': 'Gravity alone at 20 m', 'value': '0.0098*20', 'unit': 'MPa'}], 'caption': 'Holding a column of water up costs 9.8 kPa for every metre: about 0.2 MPa at 20 m. This is only the gravity part; friction in the narrow tubes adds more.'}
F['oak_growth'] = blocks([('a', 'Apical meristems at shoot and root tips', 20, 25, 'green'), ('v', 'Vascular cambium under the bark', 20, 75, 'orange'), ('l', 'Longer shoots and roots', 80, 25, None), ('w', 'Wider trunk: one ring a year', 80, 75, None)], [('a', 'l', None), ('v', 'w', None)], 'Two sets of dividing cells: tips for length, cambium for width.', False)
F['oak_ecosystem'] = {'type': 'bars', 'bars': [{'label': 'species associated with oak (UK)', 'value': 2300}, {'label': 'plant-eating insect species (at least)', 'value': 400}, {'label': 'gall-forming species', 'value': 35}], 'ylabel': 'species', 'logy': True, 'caption': 'Estimates for English oak in the UK (2019): over 2,300 associated species, at least 400 insects that eat it, and about 35 that make galls. A log scale is used.'}
F['oak_lifespan'] = {'type': 'bars', 'bars': [{'label': 'typical old oak', 'value': 500}, {'label': 'believed oldest', 'value': 1000}, {'label': 'estimates for two named oaks', 'value': 1500}], 'ylabel': 'years', 'caption': 'Estimated ages, in years, for English oak: often over 500, some believed over 1,000, and two trees estimated at over 1,500. For hollow trees these are estimates, not counted rings.'}

path = 'data/viz/park.json'
cur = json.load(open(path)) if os.path.exists(path) else {}
cur.update(F)
json.dump(cur, open(path, 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'nodes,', len(F), 'figures')
