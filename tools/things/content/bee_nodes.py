# Source of the honey bee cards (data/nodes/park_bee.json) and their figures (data/viz/park_bee.json).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/bee_nodes.py
# Every number below comes from a source named in `ext`, or from arithmetic shown on the card. Typical values carry a ≈.
import json, os

def X(t, u): return {'title': t, 'url': u}
W_WBH = X('Western honey bee (Wikipedia)', 'https://en.wikipedia.org/wiki/Western_honey_bee')
W_HB = X('Honey bee (Wikipedia)', 'https://en.wikipedia.org/wiki/Honey_bee')
W_IM = X('Insect morphology (Wikipedia)', 'https://en.wikipedia.org/wiki/Insect_morphology')
W_WD = X('Waggle dance (Wikipedia)', 'https://en.wikipedia.org/wiki/Waggle_dance')
W_NAS = X('Nasonov gland (Wikipedia)', 'https://en.wikipedia.org/wiki/Nasonov_gland')
W_NASP = X('Nasonov pheromone (Wikipedia; cites Williams, Pickett and Martin 1981, J. Chem. Ecol. 7: 225-237)', 'https://en.wikipedia.org/wiki/Nasonov_pheromone')
W_LIFE = X('Honey bee life cycle (Wikipedia)', 'https://en.wikipedia.org/wiki/Honey_bee_life_cycle')
W_HONEY = X('Honey (Wikipedia)', 'https://en.wikipedia.org/wiki/Honey')
W_MEL = X('Melittin (Wikipedia)', 'https://en.wikipedia.org/wiki/Melittin')
UNIP = X('UniProt P01501: melittin precursor of Apis mellifera (mature peptide: the last 26 of 70 residues)', 'https://rest.uniprot.org/uniprotkb/P01501.json')
SNO = X('Snodgrass 1910: The Anatomy of the Honey Bee (U.S. Bureau of Entomology Bulletin 18)', 'https://archive.org/details/anatomyofhoneybe00snod')
STR = X('Streinzer et al. 2013: Sex and caste-specific variation in compound eye morphology of five honeybee species (PLOS ONE), Table 1', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3584085/')
LICH = X('Lichtenstein, Grubel and Spaethe 2018: Opsin expression patterns coincide with photoreceptor development during pupal development in the honey bee (BMC Dev. Biol. 18)', 'https://doi.org/10.1186/s12861-018-0162-8')
WEI = X('Wei et al. 2023: Honey bees switch mechanisms to drink deep nectar efficiently (PNAS 120)', 'https://doi.org/10.1073/pnas.2305436120')
LAP = X('Sucking or lapping: facultative feeding mechanisms in honeybees (Biology Letters 2020)', 'https://doi.org/10.1098/rsbl.2020.0449')
INS = X('Nectar feeding by a honey bee\'s hairy tongue: morphology, dynamics, and energy-saving strategies (Insects 12, 2021)', 'https://doi.org/10.3390/insects12090762')
ALT = X('Altshuler, Dickson, Vance, Roberts and Dickinson 2005: Short-amplitude high-frequency wing strokes determine the aerodynamics of honeybee flight (PNAS 102)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1312389')
BAV = X('Baveco et al. 2016: An energetics-based honeybee nectar-foraging model (PeerJ 4: e2293), Table 1 (parameters from Seeley 1985, 1986 and Winston 1987)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4991850')
STAB = X('Stabentheiner and Kovac 2014: Energetic optimisation of foraging honeybees (PLoS ONE 9: e105432)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4146532')
NIC = X('Nicolson 2022: Sweet solutions: nectar chemistry and quality (Phil. Trans. R. Soc. B 377)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9058545')
KHO = X('Khoury, Myerscough and Barron 2011: A quantitative model of honey bee colony population dynamics (PLoS ONE 6: e18491)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3078911')
RUE = X('Rueppell et al. 2007: Regulation of life history determines lifespan of worker honey bees (Exp. Gerontol. 42)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2398712')
KUN = X('Kunc et al. 2019: The year of the honey bee with respect to its physiology and immunity (Insects 10: 244)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6723739')
UDEL = X('Seasonal cycles of activities in the honey bee colony (University of Delaware extension)', 'https://canr.udel.edu/maarec/?p=361')
RIL = X('Riley, Greggers, Smith, Reynolds and Menzel 2005: The flight paths of honeybees recruited by the waggle dance (Nature 435: 205-207)', 'https://doi.org/10.1038/nature03526')
GRU = X('Gruter, Balbuena and Farina 2008: Informational conflicts created by the waggle dance (Proc. R. Soc. B 275)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2602683')
GRF = X('Gruter and Farina 2009: The honeybee waggle dance: can we follow the steps? (Trends Ecol. Evol. 24)', 'https://doi.org/10.1016/j.tree.2008.12.007')
RAM = X('Ramirez-Esquivel and Ravi 2023: Functional anatomy of the worker honeybee stinger (iScience 26: 107103)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10359947')
SHO = X('Shorter and Rueppell 2012: A review on self-destructive defense behaviors in social insects (Insectes Sociaux 59: 1-10)', 'https://doi.org/10.1007/s00040-011-0210-x')
MEN2 = X('Menzel 2012: The honeybee as a model for understanding the basis of cognition (Nature Reviews Neuroscience 13: 758-768)', 'https://doi.org/10.1038/nrn3357')
OSB = X('Insect cuticle layers and circulation (Insect morphology, Wikipedia)', 'https://en.wikipedia.org/wiki/Insect_morphology')
CRAIL = X('Crailsheim et al. 1992: Pollen consumption and utilization in worker honeybees (Apis mellifera carnica): dependence on individual age and function (J. Insect Physiol. 38; abstract)', 'https://agris.fao.org/search/en/records/65dff4ca6eef00c2cea35efe')
IPA = X('Bee alarm pheromone (University of Bristol, Molecule of the Month)', 'https://www.chm.bris.ac.uk/motm/ethylacetate/bee.htm')

def R(sec, slug, book='BIO'): return [book, sec, slug]
R_ART = R('28.6', '28-6-superphylum-ecdysozoa-arthropods'); R_CIRC = R('40.1', '40-1-overview-of-the-circulatory-system'); R_GAS = R('39.1', '39-1-systems-of-gas-exchange')
R_EXC = R('41.3', '41-3-excretion-systems'); R_VIS = R('36.5', '36-5-vision'); R_CNS = R('35.3', '35-3-the-central-nervous-system'); R_DIG = R('34.1', '34-1-digestive-systems')
R_BEH = R('45.7', '45-7-behavioral-biology-proximate-and-ultimate-causes-of-behavior'); R_EUK = R('4.3', '4-3-eukaryotic-cells'); R_CARB = R('3.2', '3-2-carbohydrates'); R_ATP = R('6.4', '6-4-atp-adenosine-triphosphate')
R_POL = R('32.2', '32-2-pollination-and-fertilization'); R_MUS = R('10.2', '10-2-skeletal-muscle', 'ANP'); R_CON = R('10.3', '10-3-muscle-fiber-contraction-and-relaxation', 'ANP')
MODEL = 'A model built from typical proportions, not a scan.'

NODES = []
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, related=None):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': 'bio_ecology', 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
         'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if related: n['related'] = related
    if dyk: n['did_you_know'] = dyk
    NODES.append(n)

# ------------------------------------------------------------------ the whole bee
N('park_bee', 'Honey bee worker', 'organism', .014, ['park_scene'],
  "A western honey bee worker (Apis mellifera): a female, roughly 12 to 15 mm long, that gathers nectar and pollen, builds and cleans the nest and, in her last weeks, forages.",
  "She is a six-legged insect with her body in three parts: a head with big eyes, feelers and a tongue, a middle part (the thorax) that carries the wings and legs, and a rear part (the abdomen) that holds the gut, the heart, the wax glands and the sting. Her skeleton is on the outside, like a suit of armour, and she has no lungs: air reaches her tissues through tubes. Use the layer buttons to peel her, and click any part for its card.",
  "Workers are the female bees that do the work of the colony; the queen lays the eggs and the males (drones) mate. A worker flies on two pairs of wings that beat together because of a row of small hooks, sees ultraviolet light but has no receptor tuned to red, and can tell her sisters where food is by dancing. Her blood is not kept in a closed system of vessels the way yours is: it washes around the organs, pushed forward by a tube along her back.",
  "Taxonomically she is an arthropod, a hexapod, a hymenopteran. A worker is a haplodiploid female developed from a fertilised egg; her ovaries are reduced, though not always functionless. Nearly everything you can click here is one of the structures that textbook arthropod anatomy names, and the cards say where the honey bee departs from the general plan and where the model departs from a real worker.",
  [['Body length', '≈ 12 to 15 mm (workers); the model is ≈ 14 mm'], ['Compound eye', '≈ 5,375 ommatidia per eye in workers (mean of 4 bees)'], ['Wing length', '≈ 9.7 mm; beats ≈ 230 Hz while hovering'], ['Colony', 'some thousands to tens of thousands of workers, depending on season'], ['Model', 'built from the measurements named on each card; proportions otherwise by eye']],
  refs=[R_ART, R_CIRC, R_GAS], ext=[W_WBH, W_HB, W_LIFE, SNO],
  dyk="She has no lungs, and her blood carries almost no oxygen: air is delivered straight to her muscles through branching tubes.",
  parts=['bee_head', 'bee_thorax', 'bee_abdomen', 'bee_hairs', 'bee_wings', 'bee_leg', 'bee_vision', 'bee_flight', 'bee_waggle_dance', 'bee_colony', 'bee_lifespan', 'bee_honey'],
  related=['brain', 'heart', 'vision', 'muscle_contraction', 'respiratory_system', 'digestive_system'])

# ------------------------------------------------------------------ head
N('bee_head', 'Head', 'structure', .0035, ['park_bee'],
  "The head carries the two compound eyes, three small simple eyes, the antennae and the mouthparts, and holds the brain and the glands that make food for larvae.",
  "Nearly everything a bee uses to find food and sense the world is on her head. On the sides sit two big eyes. On top are three tiny extra eyes. In front are two feelers (antennae) that smell, taste and touch, and below them the jaws and the tongue. Inside the hard shell are the brain, the muscles that work the jaws and the glands that make food for the young.",
  "The head capsule is a rigid box of cuticle. The mouthparts combine two tools: a pair of jaws (mandibles) for working wax and handling things, and a tongue with a sheath for drinking, worked by a pump in the head.",
  "Inside the head capsule lie the brain, the muscles of the jaws and of the sucking pump (the cibarial pump), and the hypopharyngeal glands. Head tracheae and air sacs bring air. The compound eyes occupy most of each side; the model eye is 2.4 mm long.",
  [['Head width', '≈ 3.5 mm in the model (proportion chosen by eye)'], ['Eye length', '2.4 mm (workers; Streinzer et al. 2013)']],
  refs=[R_ART], ext=[W_IM, SNO, WEI], parts=['bee_compound_eye', 'bee_ocelli', 'bee_antenna', 'bee_mandibles', 'bee_proboscis', 'bee_brain', 'bee_hypopharyngeal_gland'])

N('bee_compound_eye', 'Compound eye', 'structure', .0024, ['bee_head', 'bee_vision'],
  "Each of her two big eyes is a mosaic of about 5,400 tiny lenses (a worker has 5,375 ± 143 per eye), each feeding its own light-sensing unit.",
  "You have one lens per eye that makes a sharp picture on a screen at the back. A bee's eye is built differently: it is made of thousands of separate little eyes packed side by side, called ommatidia. Each one looks at one small patch of the world, and together they make a coarse picture, a bit like a screen of pixels. The picture is not sharp, but it is quick to follow movement, which suits an animal that flies.",
  "A worker's eye has about 5,375 ommatidia (a drone's eye has about 10,000, a queen's about 4,500). Each lens, called a facet, is about 25 micrometres across. Under it a crystalline cone and a small bundle of light-sensing cells make up the ommatidium: nine light-sensing cells in each, eight long and one short, whose inner edges form the central rod (the rhabdom). Her eye has three colour channels: ultraviolet, blue and green. Click the button to look inside.",
  "Worker (Apis mellifera): ommatidia 5,375 ± 143 (n = 4), facet diameter 25.2 ± 0.3 µm (n = 3), eye length 2.4 ± 0.1 mm, eye surface area 2.5 ± 0.1 mm² (Streinzer et al. 2013, Table 1). Queen 4,460 ± 55 (n = 2); drone 9,993 ± 483 (n = 4). The finest detail a bee can resolve is set by how far apart neighbouring ommatidia point, so it is much coarser than a camera eye of the same size. The cornea carries fine hairs (Snodgrass 1910). The tissue scene draws fewer than nine cells per ommatidium.",
  [['Ommatidia per eye (worker)', '5,375 ± 143'], ['Ommatidia per eye (queen, drone)', '4,460 ± 55; 9,993 ± 483'], ['Facet diameter', '25.2 ± 0.3 µm'], ['Eye length', '2.4 ± 0.1 mm'], ['Eye surface area', '2.5 ± 0.1 mm²'], ['Light-sensing cells per ommatidium', '9 (8 long, 1 short)'], ['Colour channels', '3: ultraviolet, blue, green']],
  refs=[R_VIS], ext=[STR, LICH, SNO], parts=['bee_facet', 'bee_ommatidium', 'bee_photoreceptor', 'bee_rhabdom', 'bee_vision'], related=['eye_l', 'vision', 'bio_vision_photoreception'],
  dyk="Her eye has hairs growing between the lenses, and the facets are so small that about 40 of them would fit side by side across one millimetre.",
  openq=["How much detail she can really use, and how her brain combines the 5,000 patches into a picture, is still studied."])

N('bee_facet', 'Lens (facet)', 'structure', 2.5e-5, ['bee_compound_eye'],
  'The outer lens of one ommatidium: a clear plate of cuticle about 25 micrometres across.',
  'On the surface of the eye each tiny six-sided window is a lens. It is clear but made of the same hard stuff as the rest of her skeleton, which is built from chitin.',
  'The lens is part of the cuticle, made transparent. It focuses light on the crystalline cone below. Neighbouring lenses are packed in a honeycomb of hexagons, the same shape that bees make with wax.',
  'Facet diameter in workers 25.2 ± 0.3 µm (Streinzer et al. 2013). Chitin is a polymer of N-acetylglucosamine; click the molecule button to see its unit.',
  [['Width', '25.2 µm (workers)']], refs=[R_CARB], ext=[STR, W_IM], related=['bee_chitin'])

N('bee_ommatidium', 'Ommatidium', 'structure', 3e-4, ['bee_compound_eye'],
  "One of the thousands of separate light-sensing units that make up a compound eye.",
  "Think of it as a tiny tube that looks in one direction. Light enters through its lens, is guided down a cone, and reaches a bundle of light-sensing cells that tell the brain how bright, and which colour, that one patch is. Dark cells around it stop light leaking in from the neighbours.",
  "An ommatidium has a lens, a crystalline cone, nine photoreceptor cells (eight long and one short) whose inner edges form a central light-catching rod (the rhabdom), and pigment cells that screen it. In a worker each ommatidium has six green-sensitive cells plus two more that are either ultraviolet or blue, in one of three combinations scattered across the eye; the sensitivity of the short ninth cell is not known (Lichtenstein et al. 2018).",
  "Spectral sensitivity peaks of the three honey bee receptor types are at about 340 nm (ultraviolet), 430 nm (blue) and 540 nm (green) (Lichtenstein et al. 2018). Snodgrass (1910) counted eight or nine cells around the rod. The depth and cell sizes in the picture are illustrative, and the picture draws fewer cells than a real ommatidium has.",
  [['Receptor peaks', '≈ 340, 430, 540 nm'], ['Photoreceptor cells', '9 per ommatidium (8 long, 1 short)']], refs=[R_VIS], ext=[LICH, SNO, STR], parts=['bee_photoreceptor', 'bee_rhabdom'], related=['vision'])

N('bee_photoreceptor', 'Light-sensing cells (photoreceptors)', 'cell', 2e-5, ['bee_ommatidium'],
  "The cells under the lens that turn light into nerve signals; they come in three kinds, tuned to ultraviolet, blue and green.",
  "These long thin cells are the bee's pixels. Each one holds a pigment that changes shape when light hits it, and that starts a signal that runs to the brain. Cells tuned to ultraviolet, to blue and to green let her tell flowers apart by colour, including patterns that only show up in ultraviolet.",
  "They are the same kind of cell as your own rods and cones in principle: a light-catching molecule packed into a membrane-rich region (here the rhabdom), with an electrical signal on the other side. The chain of events after the photon differs. In a vertebrate rod, light-activated rhodopsin turns on transducin and an enzyme that breaks down cGMP, channels close and the cell becomes more negative. In insect photoreceptors, as worked out mainly in fruit flies, light-activated rhodopsin turns on a Gq protein and the enzyme phospholipase C, TRP channels open and the cell becomes less negative (depolarises). Both kinds of cell give graded responses.",
  "The pigment is a visual pigment (an opsin protein holding a retinal chromophore). Honey bee peaks: UV ≈ 340 nm, blue ≈ 430 nm, green ≈ 540 nm (Lichtenstein et al. 2018). The cascade is described from Drosophila; this card does not claim every step has been shown in the honey bee. Bees have no receptor with its peak in the red; how a red flower looks to a bee depends on what else it reflects, for example ultraviolet or blue.",
  [['Types', 'ultraviolet, blue, green (trichromatic)'], ['Cascade in insects', 'rhodopsin, Gq, phospholipase C, TRP channels open (depolarising)'], ['Cascade in vertebrate rods', 'rhodopsin, transducin, cGMP breakdown, channels close (hyperpolarising)']], refs=[R_VIS], ext=[LICH], related=['vision', 'bio_vision_photoreception'])

N('bee_rhabdom', 'Rhabdom', 'structure', 1e-5, ['bee_ommatidium'],
  'The thin central rod in an ommatidium where the visual pigment is packed and light is caught.',
  'Each ommatidium has a thin glassy rod down its middle where the light-catching molecules are packed together, a bit like the strip inside a fibre-optic cable. Light that reaches it is absorbed and turned into a signal.',
  'The rhabdom is built from the folded membranes of the photoreceptor cells, so the light meets as many pigment molecules as possible on its way down. The pigment is an opsin holding retinal, the same small molecule, a form of vitamin A, that sits in your own eyes.',
  'The chromophore is retinal. Absorption of a photon changes its shape and activates the opsin. Click the molecule button to see retinal.',
  [['Chromophore', 'retinal (from vitamin A)']], refs=[R_VIS], ext=[LICH], related=['vision'])

N('bee_ocelli', 'Ocelli (simple eyes)', 'structure', 3e-4, ['bee_head', 'bee_vision'],
  "Three small simple eyes on the top of her head, each a single lens about 0.3 mm across.",
  "Besides the big eyes she has three tiny extra eyes arranged in a triangle on top of her head. They do not see pictures. They respond to light levels and are thought to help her keep steady in flight.",
  "Each ocellus is a single lens over a layer of light-sensing cells. The median ocellus is about 0.30 mm across and the lateral ones about 0.28 mm in workers. In insects the ocelli are generally linked to flight stability and horizon detection; their exact job in the honey bee is not settled.",
  "Median ocellus 0.30 ± 0.01 mm; lateral 0.28 ± 0.01 mm (Streinzer et al. 2013, Table 1). Snodgrass (1910) noted that the bee's ocelli had not been carefully studied.",
  [['Number', '3'], ['Diameter', '0.30 mm median, 0.28 mm lateral']], cert='C2', refs=[R_VIS], ext=[STR, SNO],
  openq=["What exactly the ocelli contribute in the honey bee (horizon detection, stabilising flight, setting the daily rhythm) is not settled."])

N('bee_antenna', 'Antenna', 'structure', .0065, ['bee_head'],
  "Her two feelers: long, jointed, covered with sensors for smell, taste, touch and air movement. A worker's antenna has 12 segments: a long scape, a short pedicel and a flagellum of ten.",
  "The antennae are her nose, her fingertips and part of her tongue. They are covered with microscopic pits and hairs that pick up smells in the air, taste what she touches, and feel vibration and air movement. When she meets another bee, she sniffs her with them.",
  "The first segment, the scape, is the longest and is set in a socket so that it swings. The second, the pedicel, is short and houses a sensory organ that senses movement of the rest. The remaining ten segments are the flagellum, which carries most of the smell sensors. Drones have 13 segments.",
  "Snodgrass (1910) counted the scape plus a flagellum of 11 small joints in workers and queens (12 in drones): 12 joints in all in females, 13 in males. In the modern way of counting, the first of those 11 is the pedicel, leaving ten flagellar segments. The model draws the three parts in correct order with relative lengths chosen by eye.",
  [['Segments (worker)', '12: scape, pedicel, 10 in the flagellum'], ['Segments (drone)', '13'], ['Antenna cleaning', 'by the foreleg notch (see Antenna cleaner)']],
  refs=[R_ART], ext=[SNO], parts=['bee_antenna_cleaner'])

N('bee_mandibles', 'Mandibles (jaws)', 'structure', .001, ['bee_head'],
  "Her two jaws: strong, spoon-shaped tools used to work wax, handle pollen and other material, groom and defend. She does not drink with them.",
  "The jaws open sideways, not up and down like yours. A worker uses them to mould and nibble wax when she builds comb, to carry things, to clean the nest and to bite an enemy. Nectar is drunk through the tongue, not chewed.",
  "The mandibles are driven by large muscles inside the head. They sit either side of the mouth, and the tongue and its sheath lie between and below them. Bees take pollen into the mouth, but Snodgrass (1910) found that pollen grains pass through the gut undamaged: the jaws do not crush them.",
  "In bees the mandibles are for manipulation, wax and defence; feeding on liquids is done by the proboscis and the pump behind it.",
  [['Number', '2, opening sideways']], refs=[R_ART], ext=[SNO, W_IM], related=['masseter'])

N('bee_proboscis', 'Proboscis (tongue and sheath)', 'structure', .0057, ['bee_head', 'bee_honey'],
  "Her drinking tool: a long hairy tongue (the glossa) inside a tube formed by the paired galeae (from the first maxillae) and the labial palps (part of the labium). She both laps and sucks. In the picture it is partly extended into the flower.",
  "A bee drinks in two ways. She can lap: the hairy tongue is pushed out, dips into the nectar, picks up a coat of it and is pulled back into the tube, where it is released. Or she can suck: the tongue stays still and a pump in her head draws nectar up through the tube. She switches between the two. Thin, watery nectar (about 10 percent sugar) is mostly sucked; thick nectar (about 50 percent) is lapped; at about 30 percent she starts by lapping and changes to suction as the nectar level drops out of reach. When she is not feeding the whole thing folds back under her head.",
  "The mouthparts are made from three paired pieces. The two galeae are the blade-like outer lobes of the first maxillae; the two labial palps belong to the labium, which is the pair of second maxillae fused together; the glossa is the central tongue of the labium. Together the galeae and palps form a tube around the glossa, and nectar travels up the tube to the pump. The glossa is covered in rings of hairs that stand up near full extension to load nectar. Viscosity seems to be the cue she uses to choose a method: thinned 10 percent sugar solution that was as thick as 50 percent was mostly lapped.",
  "In the high-speed video study, bees fed on 10, 30 and 50 percent (w/w) sucrose; at 10 percent they used suction until the liquid was out of reach, at 50 percent they lapped throughout, and lapping is the more efficient method for 50 percent solution when the liquid is within about 3.5 mm of the galea tips (Wei et al. 2023). The tongue of those bees was about 3.5 mm long; another study gives about 2 mm for the glossa, so published lengths depend on the bees and on how the tongue is measured. The model shows the tongue extended to about 3.9 mm, a choice made for the picture.",
  [['Mouthparts of the tube', 'paired galeae (first maxillae) and labial palps (labium)'], ['Tongue', 'glossa, with rings of hairs'], ['Methods of drinking', 'lapping and suction (switches with sugar concentration and depth)'], ['Tongue length', '≈ 3.5 mm in the bees of Wei et al. 2023'], ['Shown in the model', '≈ 3.9 mm, partly extended']],
  cert='C2', refs=[R_ART], ext=[WEI, LAP, INS, SNO])

# ------------------------------------------------------------------ thorax and wings
N('bee_thorax', 'Thorax', 'structure', .0045, ['park_bee'],
  "The middle section that carries all six legs and both pairs of wings, and is almost entirely filled with flight muscle. It has three segments.",
  "The thorax is the bee's engine room. Three segments are joined into a solid box: the front one (prothorax) carries the front legs, the middle one (mesothorax) the front wings and middle legs, and the rear one (metathorax) the back wings and hind legs. Inside is a block of muscle that shakes the box to beat the wings.",
  "The two wing-bearing segments are fused into one rigid unit called the pterothorax. In a bee the first segment of the abdomen (the propodeum) is also fused to the thorax, which is why a bee's waist lies between the first and second abdominal segments. Two pairs of breathing pores (spiracles) open on the true thorax, and a third pair on the propodeum.",
  "The thoracic exoskeleton acts as a mechanical resonator: the indirect flight muscles deform the box, and the wing hinge turns that small deformation into a large wing stroke. The thorax of a bee is therefore really thorax plus the first abdominal segment (Snodgrass 1910).",
  [['Segments', '3: prothorax, mesothorax, metathorax (plus the fused first abdominal segment)'], ['Spiracles on the thorax', '2 pairs, plus 1 pair on the fused first abdominal segment']],
  refs=[R_ART], ext=[SNO, W_IM], parts=['bee_wings', 'bee_flight_muscles', 'bee_leg', 'bee_wing_hinge', 'bee_hairs'])

N('bee_wings', 'Wings', 'structure', .0097, ['bee_thorax', 'bee_flight'],
  "Two pairs of thin membrane wings, stiffened by veins. The wing is about 9.7 mm long on average; the smaller hindwing hooks onto the forewing in flight. Here they are folded back, as at rest.",
  "A bee has four wings, but she flies as if she had two, because the small hind wing is hooked onto the large front wing. The wings are thin sheets held by a framework of veins, a bit like a kite. The veins are hollow tubes that also carry blood, air and nerves.",
  "Wings are outgrowths of the exoskeleton: a double layer of cuticle with veins between. They are not moved by muscles inside them. Instead, muscles in the thorax deform the thorax, and the wing hinge turns that into a stroke. The pattern of veins forms closed cells, and the arrangement is used to tell bee species and races apart.",
  "Average wing length 9.7 mm in honey bees (Altshuler et al. 2005, citing Sotavalta 1952); published forewing lengths from morphometric studies vary with the population and with how the wing is measured. The model forewing is 9.7 mm. Veins in the model are a simplified pattern: the real forewing has several submarginal cells and the model draws three.",
  [['Wing length (average)', '≈ 9.7 mm'], ['Number', '4: two forewings, two hindwings']],
  refs=[R_ART], ext=[ALT, SNO], parts=['bee_hamuli', 'bee_wing_hinge'], related=['bee_flight'], cert='C1')

N('bee_hamuli', 'Hamuli (wing-coupling hooks)', 'structure', 1.5e-4, ['bee_wings'],
  "A row of tiny hooks on the front edge of each hindwing that catch a fold on the back edge of the forewing, so the two wings beat as one.",
  "Before flying, a bee locks her back wing to her front wing with a row of little hooks. They catch a groove on the front wing like a zip. Once hooked, the two wings act as one larger wing. When she lands the hooks release and the wings fold back.",
  "The hooks are the hamuli (singular hamulus). They engage the decurved rear margin of the forewing. The coupling makes the two wings a single aerofoil, so the bee beats them in step.",
  "The number of hamuli varies between bees and has been used as a measured trait in morphometric studies, where counts of roughly 11 to 22 per hindwing have been reported in different populations. The model draws 20 on each hindwing as an illustration, not a count. The wings are drawn folded, hence the hooks lie under the forewing and are shown disengaged.",
  [['Role', 'couples hindwing to forewing in flight'], ['Count in the model', '20 per hindwing (illustrative)']],
  refs=[R_ART], ext=[SNO], cert='C1')

N('bee_wing_hinge', 'Wing hinge and tegulae', 'structure', 1e-3, ['bee_thorax', 'bee_flight'],
  'The small hard plates at the base of each wing, where the wing is joined to the thorax and where thoracic motion becomes wing motion.',
  'Her wings join the body at a tiny, complicated joint. Small plates of hard cuticle, connected by elastic bands, make the wing swing up and down when the thorax is squeezed and released. Over each joint sits a small scale, the tegula.',
  'The hinge is made of several small cuticle plates (axillary sclerites) joined by elastic cuticle. The up-and-down movement of the thorax roof is turned into a flapping motion of the wing, which also twists as it goes.',
  'The detailed mechanics of the honey bee hinge are not drawn in detail here; the model shows the plates as small blocks at the right place, not as a mechanical reconstruction.',
  [['Role', 'turns thorax movement into wing stroke']], refs=[R_ART], ext=[W_IM])

N('bee_flight', 'How a bee flies', 'process', .014, ['park_bee'],
  "A hovering worker beats her wings about 230 times a second, with a short, fast stroke of about 90 degrees.",
  "Bees fly by a trick. Her muscles do not pull the wings directly. They squeeze the thorax up and down, and the stiff little box flexes, driving the wing hinge. Because the muscles are stretch-activated, they can beat much faster than a nerve signal could ask them to. The result is a buzz: the wing flaps about 230 times a second.",
  "The wing moves on a short stroke (about 90 degrees) at a high frequency (about 230 Hz). In hovering experiments in thinner air (a helium and oxygen mixture, which makes hovering cost more power), the bees kept the frequency nearly constant (about 2 percent higher) and raised the stroke amplitude by close to 50 percent. A foraging flight over open ground has been tracked with harmonic radar, but the speed is not given here.",
  "Hovering bees in normal air: 229.8 ± 11.0 Hz and 90.8 ± 8.6° stroke amplitude (Altshuler et al. 2005, Table 1). The average wing-tip speed follows from the numbers above: tip path per stroke = 9.7 mm × 1.57 rad ≈ 15.2 mm; two strokes per cycle at 230 cycles per second gives about 7 m/s. That is arithmetic on the quoted values, not a separate measurement. The wing beats are far faster than the nerve impulses that command them, which is why the muscles are of the asynchronous kind.",
  [['Wingbeat frequency', '≈ 230 Hz (hovering): 229.8 ± 11.0 Hz'], ['Stroke amplitude', '≈ 90°: 90.8 ± 8.6°'], ['Average wing tip speed', '≈ 7 m/s (calculated)']],
  cert='C2', refs=[R_ART, R_CON], ext=[ALT], parts=['bee_flight_muscles', 'bee_wings', 'bee_wing_hinge', 'bee_hamuli'],
  dyk="A beat every 4 milliseconds: in the time it takes you to blink, her wings have gone round about 70 times.",
  openq=["How the stretch-activated rhythm of the muscle is tuned to the thorax as a bee loads up with nectar is still being worked out."])

# ------------------------------------------------------------------ muscles
N('bee_flight_muscles', 'Flight muscles', 'structure', .004, ['bee_thorax', 'bee_flight'],
  'Two sets of big muscles fill the thorax: one running front to back, one running up and down. They do not attach to the wings; they shake the thorax box.',
  'These are the biggest muscles a bee has, and the thorax is almost full of them. When the up-and-down muscles shorten, the roof of the box is pulled down and the wings flip up; when the front-to-back muscles shorten, the roof bows up and the wings flip down. They work in turn, like two people pushing a swing.',
  'They are called indirect flight muscles because they act on the thorax, not on the wing. They are striated, like your skeletal muscles, and in bees they are of the fast "asynchronous" type: one nerve impulse can cause several contractions, because the muscle contracts again when it is stretched. This lets them beat at a few hundred times a second. Click "Look inside flight muscle" to see the fibres and their mitochondria.',
  'The muscle is made of the same actin and myosin filaments in sarcomeres as human skeletal muscle (see the human sarcomere card), but is packed with mitochondria and fed by tracheoles that end among the fibres. Their energy comes from sugar, which is why a flying bee burns through nectar fast.',
  [['Type', 'indirect, striated; two sets'], ['Energy', 'sugar, burned in mitochondria']],
  refs=[R_MUS, R_CON, R_ATP], ext=[W_IM, ALT], parts=['bee_flight_fibre', 'bee_mitochondria'], related=['skeletal_muscle_tissue', 'muscle_contraction', 'sarcomere', 'mitochondrion'])

N('bee_flight_fibre', 'Flight muscle fibre', 'cell', 3e-5, ['bee_flight_muscles'],
  'One long muscle cell of the flight muscle, with the striped pattern of actin and myosin that you also see in human muscle.',
  'A muscle fibre is a long cell that can shorten. It has rows of tiny repeating units, the sarcomeres, and in each unit two kinds of protein thread slide past each other. The bee fibres are the same basic machine as yours, but built for speed.',
  'The sliding-filament mechanism is the same as in vertebrate skeletal muscle (see "Muscle contraction (sliding filament)" in the human body). Insect flight fibres are a specialised "fibrillar" type that can beat far faster than their nerve input.',
  'The sizes in the tissue picture are illustrative, not measurements.',
  [['Mechanism', 'sliding filaments: actin and myosin']], refs=[R_MUS, R_CON], ext=[W_IM], related=['skeletal_muscle_fiber', 'sarcomere', 'muscle_contraction'])

N('bee_mitochondria', 'Mitochondria of the flight muscle', 'organelle', 1e-5, ['bee_flight_fibre'],
  'The power plants packed into flight muscle. They burn sugar with oxygen and make ATP.',
  'A flying bee uses energy faster than almost any animal. Her muscles are crammed with mitochondria, the cell\'s power plants, which burn sugar with oxygen to make ATP, the molecule that muscle uses as fuel.',
  'The oxygen they need comes straight through the air tubes, ending among the fibres as tracheoles. This direct delivery is what lets an insect breathe without lungs or blood-carried oxygen.',
  'ATP is the energy currency of the cell; each mitochondrion makes it by oxidative phosphorylation. Click the molecule button to see ATP.',
  [['Product', 'ATP']], refs=[R_EUK, R_ATP], ext=[W_IM], related=['mitochondrion', 'cellular_respiration'])

N('bee_other_muscles', 'Leg and jaw muscles', 'structure', .002, ['bee_thorax', 'bee_head'],
  'Smaller muscles move the legs from inside the thorax and close the jaws inside the head.',
  'Besides the flight muscles she has muscles that swing each leg at the hip, set in the thorax, and strong muscles inside the head that close her jaws. Muscles in the legs themselves bend each joint.',
  'Arthropod muscles pull on the inside of the exoskeleton, so they are attached to it from within. Because the skeleton is outside, the muscles are inside it, the reverse of your own arrangement.',
  'The model draws the large muscles at the hip of each leg and one mass in each side of the head for the jaw closers; the many small muscles are not drawn.',
  [['Attachment', 'inside the exoskeleton']], refs=[R_ART], ext=[W_IM])

# ------------------------------------------------------------------ legs
N('bee_leg', 'Legs', 'structure', .008, ['bee_thorax'],
  "Six legs, each made of the same named pieces: coxa, trochanter, femur, tibia, tarsus and the foot (pretarsus). The hind pair carries the pollen baskets.",
  "Insects have six legs, three on each side. A leg is a chain of tubes joined by hinges: the coxa is the hip, a short trochanter follows, then a long thigh (femur), a shin (tibia) and a foot made of small segments (the tarsus), ending in a pair of claws. The front legs clean the antennae, and the hind legs have the pollen baskets.",
  "The muscles that bend each joint are inside the leg, pulling on the inner side of the hard cuticle. Each pair of legs is a little different: the hind leg is the longest and its tibia and first tarsal segment are broad and flat (Snodgrass 1910).",
  "The model's hind tibia is 2.9 mm long; the other segment lengths are proportions chosen by eye, and the three leg pairs share one card.",
  [['Legs', '6'], ['Segments', 'coxa, trochanter, femur, tibia, tarsus, pretarsus'], ['Hind tibia in the model', '2.9 mm']],
  refs=[R_ART], ext=[SNO, W_IM], parts=['bee_foot', 'bee_pollen_basket', 'bee_antenna_cleaner'])

N('bee_foot', 'Foot: tarsus, claws and pad', 'structure', 1e-3, ['bee_leg'],
  "The end of each leg: a chain of small tarsal segments, two claws, and a soft pad between them.",
  "At the tip of each leg are two tiny claws and between them a soft pad. The claws hook rough surfaces; the pad is for smooth ones such as petals and glass.",
  "The part at the end is the pretarsus. The tarsus before it is divided into small segments with no muscles of their own; the first, longest segment is called the basitarsus.",
  "How the pad grips smooth surfaces is still under study in insects generally.",
  [['Claws', '2 per foot']], cert='C2', refs=[R_ART], ext=[W_IM])

N('bee_pollen_basket', 'Pollen basket (corbicula)', 'structure', .0022, ['bee_leg', 'bee_pollen_load'],
  "A smooth, shallow hollow on the outside of each hind leg's tibia, fringed with long curved hairs, in which she carries a packed ball of pollen.",
  "On the outer face of each back leg is a smooth dish ringed with stiff curved hairs. She packs pollen, moistened with a little nectar, into it until she has a ball on each leg. Then she flies home with her cargo.",
  "The dish is called the corbicula. The hairs form a basket that holds the pellet in place. Workers have one; Snodgrass (1910) notes that the queen and drone have the flattened leg but no special use for it. The inner face of the first tarsal segment carries rows of stiff spines that form a brush for gathering pollen from the body.",
  "The pellet in the model is a loose illustration.",
  [['Where', 'outer face of each hind tibia']], refs=[], ext=[SNO], parts=['bee_pollen_load'])

N('bee_pollen_load', 'Pollen load', 'structure', .0025, ['bee_pollen_basket'],
  "The pellet of pollen she carries home in the basket. Pollen is the flower's male cell packaging, and her main source of protein.",
  "Pollen grains are dust-like packages made by the male part of a flower. A bee eats pollen as her protein, and feeds it to her young. While she gathers it she also carries some from flower to flower, which is how she pollinates.",
  "The pollen is packed in with a little nectar so that it sticks together. How much pollen a worker has in her gut depends on her age and job: in one study it was highest in nurse bees about nine days old and lowest in foragers (Crailsheim et al. 1992).",
  "The size and colour of the model's pellet are illustrative: real pellets come in many colours depending on the plant.",
  [['Pollen in the gut by age', 'highest in nurse bees, lowest in foragers']], refs=[R_POL], ext=[CRAIL, W_HB], related=['park_flower'])

N('bee_antenna_cleaner', 'Antenna cleaner', 'structure', 5e-4, ['bee_leg', 'bee_antenna'],
  "A small notch and comb on each foreleg, closed by a spur, through which she pulls her antenna to clean it.",
  "She keeps her feelers clean with a built-in comb. Each front leg has a semicircular notch lined with fine bristles. She bends the leg, passes her antenna through the notch and pulls it through, like drawing a thread through your fingers.",
  "The notch is at the base of the first tarsal segment and a spur on the end of the tibia closes over it when the tarsus is bent toward the tibia; together they close into a ring around the antenna (Snodgrass 1910).",
  "The model draws the cleaner schematically, as a small ring and spur, not as an exact reconstruction of the bristles.",
  [['Position', 'foreleg, where tibia meets tarsus']], refs=[R_ART], ext=[SNO])

# ------------------------------------------------------------------ abdomen
N('bee_abdomen', 'Abdomen', 'structure', .0065, ['park_bee'],
  "The rear section: six visible segments (the first abdominal segment is fused into the thorax), packed with the honey stomach, midgut, heart, wax glands, and at the tip the sting.",
  "The abdomen is the back part of the bee. Its hard plates overlap like a roll-top desk, so that it can swell when the honey stomach is full. Inside are the gut, the heart, the wax glands, the venom sac and the sting.",
  "Each segment has a hard plate on the back (tergite) and one on the belly (sternite), joined by soft folds that let the abdomen stretch and bend. The wax glands are on the belly, the Nasonov gland on the back near the tip, and the sting is inside the tip.",
  "The first abdominal segment is fused into the thorax (the propodeum), so the six segments you can see are abdominal segments 2 to 7, and the last segments are folded inside (Snodgrass 1910). The parts in the model are named by visible segment (1 to 6) and by true abdominal segment (2 to 7). The model shows six overlapping visible segments with a banded colour.",
  [['Visible segments', '6 (abdominal segments 2 to 7); 6 in the model']], refs=[R_ART], ext=[SNO, W_IM], parts=['bee_crop', 'bee_midgut', 'bee_heart', 'bee_wax_glands', 'bee_sting', 'bee_nasonov', 'bee_ovaries'])

N('bee_wax_glands', 'Wax glands', 'structure', 1e-3, ['bee_abdomen'],
  "Glands on the underside of the abdomen that make liquid wax, which hardens into flakes and is used to build the comb. They lie over four pairs of smooth plates, the wax mirrors.",
  "Honeycomb is made of wax that she makes herself. In mature workers wax is made by a layer of gland cells over smooth patches on the underside of her abdomen, collects in a pocket under the next plate, hardens into thin flakes, and is picked off with the legs and worked into shape.",
  "The wax-forming cells lie over the smooth, shiny front part of the belly plates (the wax mirrors) of the four hindmost visible segments, abdominal segments 4 to 7 (Snodgrass 1910). The flakes are worked with the jaws and legs into the comb.",
  "In the model the wax glands are drawn as four pairs of patches under the abdomen, one pair for each of those segments.",
  [['Position', 'underside of the abdomen, segments 4 to 7'], ['Number', '4 pairs']], refs=[R_ART], ext=[SNO, W_WBH], cert='C1')

N('bee_nasonov', 'Nasonov gland', 'structure', 1e-3, ['bee_abdomen'],
  "A gland on the back at the tip of the abdomen that releases a scent used to call other bees: to a swarm, to a hive entrance, to water.",
  "When a bee lifts the tip of her abdomen and fans her wings, she is releasing a lemony-smelling come-here scent from this gland. Other bees follow it home.",
  "It is a pheromone gland whose opening is on the upper side at the base (front edge) of the last visible tergite, at the tip of the abdomen. Bees use the scent to orient foragers back to the colony, to attract workers to a settled swarm, and to mark entrances and flowers.",
  "The scent is a mixture of terpenoids including geraniol, nerolic acid, citral and geranic acid. A synthetic lure of citral and geraniol in a 2:1 ratio is used to attract swarms to empty hives. The model draws the gland as an orange band at the position described; in life it is exposed only when the abdomen tip is curled down.",
  [['Position', 'upper side, at the front (base) edge of the last visible tergite'], ['Main components', 'geraniol, nerolic acid, citral, geranic acid']], cert='C1', refs=[R_BEH], ext=[W_NAS, W_NASP])

N('bee_sting', 'Sting', 'structure', .0025, ['bee_abdomen'],
  "The sting is a modified egg-laying tool. A worker's sting has barbs, so that when it lodges in the skin of a mammal it can be left behind, still working.",
  "Only females can sting, because the sting is a rearranged egg-laying organ. A worker's sting is a hollow shaft and two sliding, barbed blades. When she stings a mammal the barbs catch in the skin. As she pulls away, the whole sting, the venom sac and part of her abdomen can tear free, and she dies. The detached sting goes on working for a short time.",
  "The two blades (lancets) slide alternately, out of step with each other, each time driving the sting deeper. Muscles on the plates at the base of the sting move the lancets, and venom is delivered by the valves on the lancets rather than leaving through the tip like a hypodermic needle. A tiny nerve ganglion goes with the sting, with its connections intact, which is why it keeps working after it is torn away. The sting also carries an alarm pheromone, isopentyl acetate, that is left at the sting site and excites other bees to join in.",
  "Each lancet carries about 10 barbs, facing backward; the stylet has smaller, more variable barbs (Ramirez-Esquivel and Ravi 2023). Losing the sting is costly, yet effective as a defence. Why it evolved is a hypothesis, not a measured fact: the usual proposal is that a worker's death can pay off through the survival of her sisters, which share many of her genes (kin selection), and that leaving the sting behind may deliver more venom and more alarm signal. The sting is shown retracted inside the abdomen tip, as at rest; the barb count drawn in the model (18) is illustrative.",
  [['Origin', 'a modified egg-laying organ (ovipositor)'], ['Barbs', '≈ 10 per lancet (Ramirez-Esquivel and Ravi 2023)'], ['Alarm pheromone', 'isopentyl acetate'], ['After stinging a mammal', 'the sting can tear free; the worker usually dies']],
  cert='C2', refs=[R_ART], ext=[RAM, SHO, SNO, IPA], parts=['bee_venom_sac'],
  dyk="A queen's sting is smoother and less barbed than a worker's.",
  openq=["Why the sting autotomy evolved is a hypothesis: kin selection is the usual explanation, but how often a stung bee dies in the wild and what the colony gains are still being worked out."])

N('bee_venom_sac', 'Venom sac', 'structure', 1e-3, ['bee_sting'],
  "A small reservoir that stores venom made by two glands and feeds it down to the sting.",
  "The venom is made in glands and stored in a small sac. When the sting goes in, venom flows from the sac into the sting and into the victim.",
  "The sac is not muscular: the sting's own muscles and sliding blades drive the venom, not the sac (Snodgrass 1910). The sac stays attached to the sting when it is torn free. The main component of honey bee venom is melittin, a peptide that damages cell membranes.",
  "Melittin is a peptide of 26 amino acids (the mature peptide cut from a 70-residue precursor) and makes up about 40 to 60 percent of the dry weight of the venom. No molecule file for melittin exists in this explorer.",
  [['Contents', 'venom, with the peptide melittin (26 amino acids) as the main component']], cert='C1', refs=[R_ART], ext=[SNO, W_MEL, UNIP, RAM])

N('bee_ovaries', 'Ovaries (reduced)', 'structure', 1e-3, ['bee_abdomen'],
  "A worker has a pair of ovaries but they are small and normally do not develop; the queen's are large.",
  "Workers are females that do not usually lay eggs. Their ovaries are much smaller than a queen's, and are held back by pheromones from the queen and brood.",
  "Under some conditions (for instance a colony without a queen) some workers' ovaries can develop and the workers lay unfertilised eggs, which grow into males.",
  "The drawn ovaries are small plates; the number of tubes in them is not shown.",
  [['Worker', 'reduced ovaries']], refs=[R_ART], ext=[W_HB])

# ------------------------------------------------------------------ gut and glands
N('bee_oesophagus', 'Oesophagus', 'structure', .01, ['bee_abdomen'],
  'The narrow tube that carries food from the mouth through the thorax to the honey stomach.',
  'It runs from the mouth back through the whole thorax and the narrow waist before opening into the crop in the abdomen. Nectar passes down it on its way to being carried home.',
  'It is part of the foregut, which is lined with a thin layer of chitin.',
  'In the model, the oesophagus runs through the thorax between the two flight muscle masses.',
  [['Part of', 'foregut']], refs=[R_DIG], ext=[W_IM], related=['digestive_system'])

N('bee_crop', 'Crop (honey stomach)', 'structure', .003, ['bee_abdomen', 'bee_honey'],
  "A stretchy bag in the front of the abdomen where she carries nectar home. A full load is tens of milligrams.",
  "This is her honey stomach, though no honey is made in it as such. She sucks up nectar and stores it here, separate from her own digestion, then flies home and gives it to other workers. Nectar starts changing into honey as soon as it is in her crop, because she adds enzymes to it.",
  "The crop is part of the foregut. A valve at its end (the proventriculus) lets her keep the nectar for the colony or let a little pass into the midgut when she needs fuel. How full the crop is varies: a forager's crop leaves the hive nearly empty or with a little fuel, and returns with a load that depends on the flower and the sugar concentration.",
  "Published numbers for full loads differ with the bees and the method: a maximum load of 32.5 mg is the figure used in a foraging model (Winston 1987, as tabulated by Baveco et al. 2016), and bees at an artificial flower with 1.5 M sucrose took up about 65 mg in a lab-style test (Stabentheiner and Kovac 2014). Flight is fuelled by sugar: a forager's flight costs about 0.037 J per second unloaded and 0.075 J per second loaded, and sugar holds about 17.2 J per mg (Seeley 1985, 1986, in Baveco et al. 2016). That is about 8 mg of sugar an hour unloaded and about 16 mg an hour loaded (calculated here: 0.037 / 17.2 × 3600 and 0.075 / 17.2 × 3600). Her own digestion happens in the midgut, so the nectar in the crop is cargo, not food, until she lets some through.",
  [['Full load of nectar', '≈ 30 to 65 mg depending on the study'], ['Flight cost, unloaded / loaded', '≈ 0.037 / 0.075 J per second (foragers)'], ['Sugar burned in flight', '≈ 8 / 16 mg per hour (calculated)']], refs=[R_DIG], ext=[BAV, STAB, SNO], parts=['bee_nectar', 'bee_proventriculus'], related=['digestive_system', 'stomach'])

N('bee_proventriculus', 'Proventriculus', 'structure', 1e-3, ['bee_crop'],
  "A small valve between the crop and the midgut that passes food on or keeps it in the crop.",
  "It is a small muscular gate at the end of the honey stomach. It lets her hold the nectar in the crop for the colony, and release some to the midgut when she needs food.",
  "It projects into the back of the honey stomach, with an X-shaped mouth of four thick lips. Old books say it picks pollen grains out of the nectar; Snodgrass (1910) argued this was never shown, and that it is simply the ordinary valve through which an insect passes food from the crop to the stomach. It is the last part of the foregut.",
  "The details of the valve action are not drawn; the model shows a small bulb and a short lip at the right place.",
  [['Function', 'valve at the end of the crop']], refs=[R_DIG], ext=[SNO, W_IM])

N('bee_midgut', 'Midgut', 'structure', .004, ['bee_abdomen'],
  "The part of the gut where food is digested and absorbed.",
  "Most of her own digestion happens here. Enzymes break the food down and the gut wall takes up the sugars and other nutrients, which go into her blood to be carried to the rest of the body.",
  "The midgut (the ventriculus in older books) is a large U-shaped part with thick walls. In the honey bee its contents, partly digested pollen among them, are wrapped in thin peritrophic membranes that the wall sheds (Snodgrass 1910).",
  "The model draws the midgut as a looped tube; folds and microscopic structure are not shown.",
  [['Function', 'digestion and absorption']], refs=[R_DIG], ext=[SNO, W_IM], related=['small_intestine', 'digestive_system'])

N('bee_malpighian', 'Malpighian tubules', 'structure', 1e-3, ['bee_abdomen'],
  "Fine tubes that clean her blood: they lie in the body cavity and pour waste into the gut at the junction of midgut and hindgut.",
  "She has no kidneys. Instead many thin tubes float in her blood, take up waste and extra salts, and empty them into the gut at the point where midgut meets hindgut. Waste leaves with the droppings, mostly as dry uric acid so little water is lost.",
  "The tubes attach at the junction of the midgut and the small intestine. A worker has about 100 of them, each a very long threadlike tube coiled among the organs, each opening separately into the gut (Snodgrass 1910). The model draws 22 as a sample, not a count.",
  "Insects overall have anywhere from two to more than a hundred; the honey bee is at the high end. The rectum then takes water back from the wastes.",
  [['Position', 'where midgut meets small intestine'], ['Number in a worker', '≈ 100'], ['Number in the model', '22 (a sample)']], refs=[R_EXC], ext=[SNO, W_IM], related=['kidney', 'bio_excretion_nitrogen'])

N('bee_hindgut', 'Hindgut and rectum', 'structure', .003, ['bee_abdomen'],
  "The last part of the gut, where water is taken back before the waste leaves.",
  "The hindgut collects what she cannot use. In the rectum water is absorbed back, and the dry droppings leave through the anus. Bees prefer not to soil the hive, and the rectum can swell into a large sac that fills much of the abdomen until she can make a flight.",
  "The hindgut is lined with chitin. The rectum has six thick bands, the rectal glands, at its front end (Snodgrass 1910).",
  "In insects in general the rectum recovers most of the water from the waste (about 90 percent is the figure quoted for insects as a group; it has not been measured for the honey bee).",
  [['Function', 'water recovery and waste']], refs=[R_EXC, R_DIG], ext=[SNO, W_IM], related=['large_intestine'])

N('bee_heart', 'Dorsal vessel (the "heart")', 'structure', .01, ['bee_abdomen'],
  "A tube along the back with a chambered rear part (the heart) and a narrow front part (the aorta). It pushes blood forward into the body cavity, where it flows freely around the organs.",
  "A bee's blood is called haemolymph and it does not travel in closed vessels. The heart is a long tube in the back of the abdomen. It pulses, sucks blood in through small valved slits and pushes it forward through the thorax to the head, where it spills out into the body and washes slowly back around the organs. It carries very little oxygen, because bees breathe through tubes.",
  "This is an open circulatory system. A human has a closed one: blood stays inside vessels and the heart pumps it round a circuit. In a bee the haemolymph carries nutrients, waste, hormones and immune cells and has no red blood cells, so it has little capacity for oxygen; the air tubes do that job.",
  "The dorsal vessel has one-way valves (ostia) in its heart part and pulses from back to front. The honey bee heart has four chambers in abdominal segments 3 to 6 and a looped front end where it passes the waist; the aorta runs forward through the thorax into the head (Snodgrass 1910). Chambers in the model are schematic.",
  [['Circulation', 'open'], ['Oxygen', 'little carried by the blood; supplied by tracheae'], ['Heart chambers', '4']], refs=[R_CIRC], ext=[SNO, W_IM], related=['heart', 'bio_comparative_circulation'],
  dyk="Cut a bee's heart out and her muscles would still get oxygen: air goes straight to them.")

N('bee_hypopharyngeal_gland', 'Hypopharyngeal glands', 'structure', .002, ['bee_head'],
  "Two long, coiled, bead-like glands in the head of a young worker. They make part of royal jelly, the protein-rich food with which nurse bees feed larvae.",
  "Young workers called nurse bees feed the grubs. They make a rich, milky food from glands in their heads, and feed it to larvae and the queen. When a bee gets older and turns to foraging, these glands shrink and she makes other secretions.",
  "The glands are tube-shaped organs covered with small clusters of secretory cells, which is what makes them look like strings of beads. Royal jelly is made in the hypopharyngeal and mandibular glands of nurse bees. The same glands add enzymes to nectar when it is being turned into honey.",
  "The glands are drawn in the model as two coiled beaded strings; real glands are larger, with thousands of tiny acini, and shrink with age.",
  [['Position', 'head, in front of the brain'], ['Product', 'protein secretion fed to larvae and queens']], refs=[], ext=[W_HB, W_HONEY], related=['salivary_glands'])

# ------------------------------------------------------------------ nervous system
N('bee_brain', 'Brain', 'structure', .0015, ['bee_head', 'bee_nerve_cord'],
  "A bee's brain is tiny but runs flight, vision, smell, learning and the dance. It has large optic lobes and antennal lobes, and mushroom bodies where senses are combined.",
  "The bee brain sits in the head behind her face. It is tiny but remarkably capable: bees learn flower colours and scents, remember routes, tell the time of day and communicate with a dance. Two big lumps at the sides, the optic lobes, deal with what the eyes see. Two smaller ones in front, the antennal lobes, deal with smell.",
  "Insect brains are built differently from yours. Visual and smell information are processed in dedicated lobes, then combined in the mushroom bodies, which are important for learning and memory. The brain is joined to a ventral nerve cord that runs through the body.",
  "The brain is a supraoesophageal ganglion: the gut passes through a ring of nerve tissue around the oesophagus, the other half of which is the suboesophageal ganglion. The sizes in the model are proportions, not measurements.",
  [['Position', 'head, above the oesophagus']], refs=[R_CNS], ext=[MEN2, SNO], parts=['bee_mushroom_bodies', 'bee_nerve_cord'], related=['brain', 'bio_brain_organization', 'neuron'])

N('bee_mushroom_bodies', 'Mushroom bodies', 'structure', 1e-3, ['bee_brain'],
  "Cup-shaped structures in the brain, two per side, where smell and sight are combined; they are central to learning, and memory traces also lie elsewhere.",
  "These are mushroom-shaped clumps of nerve cells in the upper part of the brain. They take in smell, sight and other senses, and are where she links a flower's colour or scent with food. Memory is not stored in one spot: traces of what she has learned lie in several places in the brain, mushroom bodies among them.",
  "Each mushroom body has cups (calyces) that receive input from the senses, and stalks that carry output to lobes. They are described as high-order integration centres for the senses (Menzel 2012).",
  "In the model the mushroom bodies are drawn as two cups and a stalk per side, a simplified outline.",
  [['Role', 'integrating the senses; learning and memory']], cert='C2', refs=[R_CNS], ext=[MEN2], related=['brain'])

N('bee_nerve_cord', 'Ventral nerve cord and ganglia', 'structure', .01, ['bee_brain'],
  "A chain of nerve knots (ganglia) joined by paired cords along the belly, from the head to the tip of the abdomen. Each ganglion runs the part of the body it sits in.",
  "Instead of a spinal cord along her back, as you have, a bee has a nerve cord along her belly. It has swellings, ganglia, in each region. Each controls its own legs, wings or segments with some independence, with the brain giving the orders.",
  "The first ganglion under the oesophagus, the suboesophageal ganglion, controls the mouthparts. The thoracic ganglia run legs and wings. The last abdominal ganglion runs the sting.",
  "A real worker has, behind the head, two ganglia in the thorax (the second is a compound of the mesothoracic and metathoracic ganglia and the first two abdominal ones, because the first abdominal segment is fused to the thorax) and five in the abdomen, the last a compound of several segments' ganglia (Snodgrass 1910). The model draws a suboesophageal, two thoracic and four abdominal ganglia: one abdominal ganglion fewer than a real worker.",
  [['Position', 'belly (ventral)'], ['Ganglia behind the head, real worker', '2 in the thorax + 5 in the abdomen'], ['Drawn in the model', '2 in the thorax + 4 in the abdomen']], refs=[R_CNS], ext=[SNO, W_IM], related=['neuron', 'spinal_cord'])

# ------------------------------------------------------------------ breathing
N('bee_tracheae', 'Tracheae (breathing tubes)', 'structure', .006, ['park_bee'],
  "A bee has no lungs. Air enters through pores in her sides and goes along branching tubes that end in fine tubules at the cells.",
  "A bee breathes through tubes. Small pores in her sides (spiracles) open to tubes that branch and branch again until the smallest touch individual cells. Oxygen goes straight from the air to the tissue, not through the blood.",
  "The tubes, called tracheae, are lined with a spiral of stiffening chitin that keeps them from collapsing. At the muscles they end in tracheoles, thin enough to push in between the cells. Large thin-walled air sacs act as bellows and as stores of air.",
  "Gas moves partly by diffusion and partly by the pumping of the abdomen. Diffusion through air works over short distances, which is part of why insects of this size can breathe this way. The model has a trunk on each side with branches to the legs, wings, and head.",
  [['Lungs', 'none'], ['Entry', 'spiracles (10 pairs in a worker)']], refs=[R_GAS], ext=[SNO, W_IM], parts=['bee_spiracles', 'bee_air_sacs'], related=['trachea', 'respiratory_system', 'bio_comparative_respiration'],
  dyk="Her whole body is the lung: every muscle fibre has air delivered to it directly.")

N('bee_spiracles', 'Spiracles (breathing pores)', 'structure', 2e-4, ['bee_tracheae'],
  "Small closable pores along each side that let air into the tracheae. A worker has ten pairs: two on the thorax, one on the fused first abdominal segment and seven on the abdomen behind.",
  "These are the doors to her air tubes. Each has a valve that can close it to save water. In the model, small dark rings along her sides mark them.",
  "Insects usually have ten pairs of spiracles. In the honey bee two pairs lie on the true thorax (one in front of the mesothorax, one between mesothorax and metathorax) and eight on the abdomen, the first of them on the propodeum, which looks like part of the thorax, and the last on the eighth tergite (Snodgrass 1910). So the apparent thorax carries three pairs, and the visible abdomen seven.",
  "The model draws 3 pairs on the thorax and 6 on the abdomen (9 pairs, 18 pores): one pair fewer than a real worker. Closing the spiracles reduces water loss through breathing.",
  [['Pairs in a worker', '10: 2 thoracic, 1 on the propodeum, 7 abdominal'], ['Pairs drawn in the model', '9: 3 on the thorax and propodeum, 6 on the abdomen']], refs=[R_GAS], ext=[SNO, W_IM])

N('bee_air_sacs', 'Air sacs', 'structure', .002, ['bee_tracheae'],
  "Large, thin-walled bags of air in the abdomen, thorax and head that connect to the tracheae. They act as bellows and air stores.",
  "Some of her air tubes widen into big bags. Her abdomen squeezes and expands like a bellows, pushing air in and out of them.",
  "Unlike tracheae, air sacs have no stiffening spiral, so they collapse and re-inflate. The abdomen pumps them (Snodgrass 1910).",
  "The positions drawn are approximate: a pair in the abdomen, a pair behind the thorax, and head sacs.",
  [['Function', 'ventilation']], refs=[R_GAS], ext=[SNO, W_IM])

# ------------------------------------------------------------------ exoskeleton, hairs, tissue-level cards
N('bee_cuticle', 'Exoskeleton (cuticle)', 'tissue', 2e-5, ['park_bee'],
  "Her hard outer skin: layers of chitin and protein with a waxy skin on top, laid down by a single layer of living cells below.",
  "A bee's skeleton is on the outside. It is the skin itself, hardened. On the outside is a thin waxy skin that keeps water in. Under it is a hard, darkened layer, then a softer, flexible layered one, all made by living cells at the bottom. To grow, an insect has to shed it; an adult bee no longer does.",
  "The outer waxy layer is the epicuticle and it has no chitin. Under it the procuticle has two parts: the rigid, hardened, darkened exocuticle outside and the tough but more flexible endocuticle inside, built of many layers of chitin fibres and protein with the fibres crisscrossing from layer to layer. Chitin is a polymer of N-acetylglucosamine, embedded in protein. Where the cuticle is thin and soft it forms the joints.",
  "In this picture the thicknesses of the layers are illustrative; the order is right. The stacked chitin sheets are drawn in the endocuticle. Click a chitin sheet and the molecule button to see its unit.",
  [['Layers (outside in)', 'epicuticle, exocuticle, endocuticle, epidermis'], ['Main polymer', 'chitin']], refs=[R_ART, R_CARB], ext=[W_IM], parts=['bee_chitin'], related=['skin', 'bio_nematodes_arthropods'])

N('bee_chitin', 'Chitin', 'molecule', 1e-9, ['bee_cuticle'],
  "A tough, fibre-forming sugar polymer: long chains of N-acetylglucosamine. It is the main structural material of insect cuticle and of fungal walls.",
  "Chitin is like cellulose but with a small nitrogen-containing group on each sugar unit. The chains line up into fibres that, with protein around them, make a material both strong and light, like the fibres in fibreglass. It is also the material of crab shells and mushroom walls.",
  "The unit that repeats along the chain is N-acetylglucosamine. The sugar rings are linked by β-1,4 bonds and the chains pack side by side held by hydrogen bonds. In insect cuticle the fibres lie in layers, with the direction changing from layer to layer.",
  "Chitin: poly(β-1,4-N-acetylglucosamine). Click the molecule button to see the unit.",
  [['Unit', 'N-acetylglucosamine'], ['Found in', 'insect cuticle, crustacean shell, fungal cell wall']], refs=[R_CARB], ext=[W_IM])

N('bee_hairs', 'Body hairs', 'structure', .001, ['park_bee'],
  "Her body is covered with hairs, many of them branched, like tiny feathers. They catch pollen, and some are touch sensors.",
  "Bees are furry. The hairs are not smooth; many have side branches, which is what makes a bee such a good pollen collector: pollen grains tangle in them. She grooms the pollen from her hairs with the brushes on her legs and packs it into the baskets.",
  "Snodgrass (1910) found bits of feathered bee hairs in the gut and described some hairs as touch sensors: hairs with a nerve ending at their base bend when something brushes them. Other hairs have no nerve and are not sensory.",
  "The model draws about 3,500 hairs as a shaft with side barbs on the near view and about 900 on the middle view; a real bee has far more. Their position and density are approximate.",
  [['Hair type', 'branched ("feathered")'], ['Model count', '≈ 3,500 (real: many more)']], refs=[R_ART], ext=[SNO])

# ------------------------------------------------------------------ nectar and honey
N('bee_nectar', 'Nectar and its sugars', 'substance', 1e-3, ['bee_crop', 'bee_honey'],
  "The sweet liquid flowers make that bees collect. Its sugar content ranges from about 10 to 70 percent by weight; the sugars are mainly sucrose, glucose and fructose.",
  "Nectar is sugar water. A flower makes it so that bees will visit and carry pollen. For the bee it is fuel: sugar for her flight muscles.",
  "The main sugars are sucrose (table sugar, made of one glucose and one fructose joined) and the two simple sugars glucose and fructose. The bee adds an enzyme that splits sucrose into glucose and fructose. How watery nectar is depends on the plant and the weather: nectar of about 20 percent sugar is therefore about 80 percent water, but other nectars are far thicker or thinner.",
  "Floral nectar ranges from about 10 to 70 percent sugar by weight (Nicolson 2022). Foragers have been found to return with crop sugar concentrations about twice that of the nectar they collected. The proportions of the sugars vary from plant to plant.",
  [['Sugar concentration', '≈ 10 to 70 % w/w (varies by plant)'], ['Main sugars', 'sucrose, glucose, fructose']], refs=[R_CARB], ext=[NIC, W_HONEY])

N('bee_honey', 'How nectar becomes honey', 'process', .001, ['park_bee'],
  "Workers dry nectar and add enzymes that split its sugars; the thick result, with a water content of about 15 to 18 percent, is capped in wax.",
  "A forager brings nectar home in her crop and hands it to a house bee. The house bees pass it mouth to mouth, adding enzymes. They then spread it in the wax cells, evaporate water with the warm air and wing beats, and cap the cells with wax when it is thick.",
  "The enzymes split sucrose into glucose and fructose. Evaporation drives off the water: nectar is often described as 70 to 80 percent water, though the range is wider, and finished honey reaches about 15.5 to 18 percent. Honey is thick enough, and sugary enough, that microbes cannot easily grow in it.",
  "Worker bees digest the nectar for about 30 minutes before it is dried to under 20 percent water (Western honey bee, Wikipedia). Honey is also acidic (average pH about 3.9) and contains hydrogen peroxide made by an enzyme the bees add, which together with the sugar concentration holds microbes back (Honey, Wikipedia).",
  [['Nectar water', 'varies with the plant: about 30 to 90 % (follows from 10 to 70 % sugar)'], ['Honey water', '≈ 15.5 to 18 %']], refs=[R_CARB], ext=[W_HONEY, W_WBH, NIC], parts=['bee_nectar', 'bee_crop'])

# ------------------------------------------------------------------ behaviour and colony
N('bee_vision', 'What a bee sees', 'process', .0024, ['park_bee'],
  "Bees see three colours, as people do, but a different three: ultraviolet, blue and green. They have no receptor tuned to red.",
  "A bee sees a flower differently from you. Many flowers have patterns that reflect ultraviolet light, which is invisible to us, and which can act as landing guides for bees. Bees have no receptor with its peak in the red, so red looks very different to them. Their world is coarse and quick: each eye has about 5,400 ommatidia, each looking at one patch.",
  "The three receptor types peak at about 340 nm (ultraviolet), 430 nm (blue) and 540 nm (green). Her ocelli add a measure of the brightness of the sky. Each facet of the compound eye has a lens that focuses light onto its own light-sensing cells, but the eye has no single lens that forms one image: the ommatidia point in slightly different directions and each reports one patch.",
  "The bee's three colour channels support trichromatic colour vision, but a bee's colour space is not ours. Human vision uses a different set of receptors, so the colours a bee distinguishes are not the colours we see.",
  [['Receptor peaks', '≈ 340, 430, 540 nm'], ['Red', 'no receptor peaking in the red']], cert='C1', refs=[R_VIS], ext=[LICH, STR], parts=['bee_compound_eye', 'bee_ocelli'], related=['vision', 'bio_vision_photoreception'])

N('bee_waggle_dance', 'The waggle dance', 'process', .1, ['park_bee'],
  "A forager that has found a good patch of flowers dances on the comb in the dark: the angle of her waggle run correlates with the direction of the food, and its length with the distance.",
  "Back in the hive a bee that has found food can tell her sisters where. She walks a straight line while shaking her abdomen from side to side (the waggle run), then loops back and repeats. The angle of the run from straight up on the comb matches the angle between the food and the sun, and a longer waggle goes with a farther place. Nearby sisters follow her closely and can fly off toward the food.",
  "A run straight up the comb means toward the sun. A run 45° to the right means 45° to the right of the sun. For food close to the hive a bee may dance a simple round dance with no direction. The code was worked out by Karl von Frisch. Radar tracking of recruits that had followed a dance found that most flew straight to the neighbourhood of the feeder, and recruits taken to other release sites flew in the direction the dance indicated, not to the feeder itself (Riley et al. 2005).",
  "What is debated is how much followers use the dance in everyday foraging. In a test set up so that a dance pointed to a place that conflicted with what experienced foragers already knew, 93 percent of those cases ended with the follower relying on her own private information, and 7 percent (3 of 43) used the dance (Gruter et al. 2008). The proposal from that line of work is that the dance location is often a backup used when a bee lacks reliable information of her own (Gruter and Farina 2009). Both findings stand: recruits can fly the vector, and experienced bees often do not use it.",
  [['Angle of the run from vertical', 'angle between food and sun'], ['Length of waggle', 'distance to food'], ['Round dance', 'food close to the hive']], cert='C2', refs=[R_BEH], ext=[RIL, GRU, GRF, W_WD],
  dyk="She keeps adjusting the angle as the sun moves across the sky, so her dance stays right all day.",
  openq=["How much of the dance information followers really use in the wild, and how they read it in the dark, is still studied."])

N('bee_colony', 'The colony', 'structure', .5, ['park_bee'],
  "A colony is one queen, a few to several hundred males in season, and thousands to tens of thousands of sister workers living as one.",
  "No bee lives alone. A colony changes in size through the year, from some thousands of bees in winter to a peak in early summer that sources put at up to about 60,000 workers (some quote up to 80,000). They share the nest, the young, the honey and the work: cleaning, nursing, building, guarding, foraging.",
  "A worker takes about 21 days from egg to adult, a drone 24, a queen 15 to 16. A queen can lay up to about 2,000 eggs a day at her peak. Workers keep the brood warm at about 34 °C (93 °F), and in cold weather the bees cluster to keep each other warm. Worker lifespan is on the card A worker's life.",
  "The colony model of Khoury and colleagues (2011) assumes 2,000 eggs a day and a three-week development time. Numbers are for the western honey bee in temperate climates; sizes differ between wild nests, managed hives and races.",
  [['Workers at the early-summer peak', 'up to ≈ 60,000 (some sources say 80,000)'], ['Drones', 'a few to several hundred, in season'], ['Queen egg laying', 'up to ≈ 2,000 eggs a day'], ['Development, egg to adult', 'worker 21 days; drone 24; queen 15 to 16'], ['Brood temperature', '≈ 34 °C']], refs=[R_BEH], ext=[UDEL, KHO, W_LIFE, W_WBH], parts=['bee_lifespan'], related=['bio_learning_social_behavior', 'bio_pollination_networks'])

N('bee_lifespan', "A worker's life", 'process', .014, ['bee_colony'],
  "A summer worker lives a few weeks; a worker born in autumn can live many months to carry the colony through winter.",
  "A summer worker wears herself out. Workers born in spring and summer live only a few weeks, flying more and more as they age. Workers born in autumn do little flying, stay in the warm cluster and live for months, until spring.",
  "A worker begins adult life inside the hive, cleaning cells and feeding larvae, then builds comb, then guards, and only in her last weeks forages. The age at which she starts to forage is the main thing that sets her lifespan (Rueppell et al. 2007). In a healthy colony a bee forages for about a week.",
  "Summer workers have been reported to live 3 to 4 weeks (Rueppell et al. 2007) or 15 to 48 days (Kunc et al. 2019), and in the colony model's data a worker's observed lifespan was 22 to 27 days with a flying life of 6.5 to 8.8 days (Khoury et al. 2011, Table 1). Winter workers live from over 6 months to up to 8 months in those reviews. The values depend on season, race, and workload.",
  [['Spring and summer worker', '≈ 2 to 7 weeks (reports vary)'], ['Autumn and winter worker', '≈ 6 to 8 months'], ['Time spent foraging', '≈ 1 week (6.5 to 8.8 days observed)']], cert='C1', refs=[R_BEH], ext=[RUE, KUN, KHO])

# ------------------------------------------------------------------ figures
F = {}
def blocks(nodes, edges, caption, flow=True):
    return {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'color': c} if c else {})} for i, l, x, y, c in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'flow': flow, 'caption': caption}
def bars(rows, ylabel, caption, logy=False):
    return {'type': 'bars', 'bars': [{'label': a, 'value': b} for a, b in rows], 'ylabel': ylabel, 'logy': logy, 'caption': caption}

F['park_bee'] = bars([('facet width', 25.2), ('ocellus', 300), ('eye length', 2400), ('wing length', 9700), ('body (model)', 14000)], 'micrometres', 'Sizes on a honey bee worker, in micrometres, on a log scale: facet width, ocellus and eye length from Streinzer and colleagues (2013), average wing length 9.7 mm (Altshuler and colleagues 2005), body about 14 mm in the model.', True)
F['bee_head'] = blocks([('e', 'Eyes and ocelli: light', 15, 20, None), ('a', 'Antennae: smell, taste, touch', 15, 50, None), ('m', 'Jaws and tongue: feeding, wax', 15, 80, None), ('b', 'Brain: decides', 60, 50, 'orange'), ('g', 'Glands: food for the young', 85, 80, None)], [('e', 'b', None), ('a', 'b', None), ('b', 'm', None), ('g', 'm', None)], 'What the head does: sensors on the outside feed the brain, which drives the mouthparts; the glands make food for larvae.', False)
F['bee_compound_eye'] = bars([('queen', 4460), ('worker', 5375), ('drone', 9993)], 'ommatidia per eye', 'Ommatidia per eye in Apis mellifera (Streinzer et al. 2013, Table 1): queen 4,460, worker 5,375, drone 9,993.')
F['bee_facet'] = {'type': 'plot', 'x': [0, 3], 'y': [0, 130], 'params': [{'id': 'd', 'label': 'eye length', 'min': 1, 'max': 3, 'value': 2.4, 'step': .1, 'unit': 'mm'}], 'fns': [{'f': 'x*1000/25.2', 'label': 'facets that fit along a length x (mm)'}], 'vlines': [{'x': 'd', 'label': 'eye length'}], 'readouts': [{'label': 'Facets along the eye if packed side by side', 'value': 'd*1000/25.2', 'unit': 'facets'}], 'xlabel': 'length (mm)', 'ylabel': 'facets of 25.2 µm', 'caption': 'Arithmetic: with facets 25.2 µm wide, about 95 would fit end to end along the 2.4 mm eye (the real count along any line is a little different because of the hexagonal packing and the curve).'}
F['bee_ommatidium'] = blocks([('l', 'Lens', 50, 12, None), ('c', 'Crystalline cone', 50, 38, None), ('r', 'Light-sensing cells and rhabdom', 50, 64, 'orange'), ('n', 'Nerve fibre to brain', 50, 90, None)], [('l', 'c', 'light in'), ('c', 'r', None), ('r', 'n', 'signal out')], 'One ommatidium: light enters a lens, is guided down a cone to a bundle of light-sensing cells, and a nerve fibre carries the signal away.')
F['bee_photoreceptor'] = {'type': 'plot', 'x': [300, 650], 'y': [0, 1.1], 'fns': [{'f': 'exp(-((x-340)/45)^2)', 'label': 'ultraviolet receptor (peak about 340 nm)'}, {'f': 'exp(-((x-430)/55)^2)', 'label': 'blue receptor (peak about 430 nm)'}, {'f': 'exp(-((x-540)/70)^2)', 'label': 'green receptor (peak about 540 nm)'}], 'xlabel': 'wavelength (nm)', 'ylabel': 'relative sensitivity', 'caption': 'Schematic bell curves centred on the approximate peaks of the three honey bee receptors (about 340, 430 and 540 nm; Lichtenstein and colleagues 2018). The widths are drawn by eye; real curves are not symmetric.'}
F['bee_rhabdom'] = blocks([('p', 'Photon of light', 15, 50, None), ('o', 'Opsin with retinal', 50, 50, 'orange'), ('s', 'Shape change: signal starts', 85, 50, 'green')], [('p', 'o', None), ('o', 's', None)], 'The first step of seeing: a photon changes the shape of retinal inside the opsin protein, and that starts a nerve signal.', False)
F['bee_ocelli'] = bars([('median ocellus', .30), ('lateral ocellus', .28), ('one facet', .0252)], 'millimetres', 'Ocelli are about 0.3 mm across: about twelve times the width of one facet (25.2 µm), still smaller than a grain of sand.')
F['bee_antenna'] = blocks([('s', 'Scape: long, swings in the socket', 15, 20, None), ('p', 'Pedicel: short, senses movement', 50, 50, None), ('f', 'Flagellum: 10 segments, many smell sensors', 85, 80, 'orange')], [('s', 'p', None), ('p', 'f', None)], 'A worker antenna: three named parts, 12 segments in all.', False)
F['bee_mandibles'] = blocks([('m', 'Muscles in the head', 15, 50, None), ('j', 'Jaws open and close sideways', 50, 50, None), ('w', 'Wax, pollen, grooming, defence', 85, 50, 'green')], [('m', 'j', None), ('j', 'w', None)], 'Jaws are tools: muscles in the head drive them to work wax and handle things. Liquids are taken by the tongue.', False)
F['bee_proboscis'] = bars([('tongue (glossa), bees of Wei et al. 2023', 3.5), ('shown extended in the model', 3.9)], 'millimetres', 'Tongue length of the bees in the PNAS study (about 3.5 mm) and the 3.9 mm shown partly extended in the model. Another study gives about 2 mm for the glossa, so lengths depend on the bees and the method.')
F['bee_thorax'] = blocks([('p', 'Prothorax: front legs', 15, 25, None), ('m', 'Mesothorax: forewings, middle legs', 50, 50, 'orange'), ('t', 'Metathorax: hindwings, hind legs', 85, 75, None)], [('p', 'm', None), ('m', 't', None)], 'The thorax has three segments; the middle two are fused into a rigid flight box.', False)
F['bee_wings'] = bars([('forewing length', 9.7), ('body length (model)', 14), ('hind tibia (model)', 2.9)], 'millimetres', 'Average wing length 9.7 mm (Altshuler et al. 2005); the body about 14 mm and the hind tibia 2.9 mm are the model\'s sizes.')
F['bee_hamuli'] = blocks([('h', 'Hindwing hooks (hamuli)', 15, 50, None), ('f', 'Fold on rear edge of forewing', 50, 50, None), ('w', 'One wide wing: both beat together', 85, 50, 'green')], [('h', 'f', 'catch'), ('f', 'w', None)], 'In flight the hooks on the hindwing catch the fold of the forewing; at rest they let go and the wings fold.', False)
F['bee_wing_hinge'] = blocks([('m', 'Thorax squeezed by muscles', 15, 50, None), ('h', 'Hinge plates and elastic cuticle', 50, 50, 'orange'), ('w', 'Wing stroke', 85, 50, None)], [('m', 'h', None), ('h', 'w', 'small motion, big stroke')], 'The wing hinge turns a small deformation of the thorax into a large wing stroke.')
F['bee_flight'] = {'type': 'plot', 'x': [100, 300], 'y': [0, 12], 'params': [{'id': 'A', 'label': 'stroke amplitude', 'min': 60, 'max': 120, 'value': 90, 'step': 5, 'unit': '°'}], 'fns': [{'f': '2*0.0097*(A*pi/180)*x', 'label': 'average wing-tip speed (m/s)'}], 'vlines': [{'x': 230, 'label': '≈ 230 Hz'}], 'readouts': [{'label': 'Average tip speed at 230 Hz', 'value': '2*0.0097*(A*pi/180)*230', 'unit': 'm/s'}], 'xlabel': 'wingbeat frequency (Hz)', 'ylabel': 'average wing-tip speed (m/s)', 'caption': 'Arithmetic on published values (average wing length 9.7 mm, about 90 degrees and 230 beats per second; Altshuler and colleagues 2005): a wing swept through an angle A twice per beat has an average tip speed of about 7 m/s at 90 degrees. It is a calculation, not a measurement.'}
F['bee_flight_muscles'] = blocks([('d', 'Up-and-down muscles shorten: roof pulled down', 15, 25, None), ('u', 'Wings flip up', 15, 75, 'green'), ('l', 'Front-to-back muscles shorten: roof bows up', 85, 25, None), ('w', 'Wings flip down', 85, 75, 'green')], [('d', 'u', None), ('l', 'w', None), ('u', 'l', 'stretch triggers the next'), ('w', 'd', 'stretch triggers the next')], 'Two sets of muscles take turns on the thorax box; each one stretches the other and triggers its contraction.')
F['bee_flight_fibre'] = blocks([('n', 'Nerve impulse', 15, 50, None), ('c', 'Calcium released', 50, 50, None), ('s', 'Filaments slide: fibre shortens', 85, 50, 'orange')], [('n', 'c', None), ('c', 's', None)], 'Sliding filaments: the same machine as in human muscle, tuned for speed.', False)
F['bee_mitochondria'] = blocks([('s', 'Sugar from the crop', 15, 20, None), ('o', 'Oxygen from the air tubes', 15, 80, 'blue'), ('m', 'Mitochondrion', 55, 50, 'orange'), ('a', 'ATP: fuel for the muscle', 90, 50, 'green')], [('s', 'm', None), ('o', 'm', None), ('m', 'a', None)], 'Mitochondria burn sugar with oxygen to make ATP; in flight muscle the oxygen arrives through air tubes.')
F['bee_other_muscles'] = blocks([('m', 'Muscles inside the skeleton', 20, 50, None), ('p', 'Pull on the inner side of the cuticle', 55, 50, None), ('j', 'Joint bends', 90, 50, 'green')], [('m', 'p', None), ('p', 'j', None)], 'An arthropod muscle works from inside the skeleton, pulling on the inner side of the cuticle.', False)
F['bee_leg'] = blocks([('c', 'Coxa (hip)', 10, 20, None), ('t', 'Trochanter', 30, 35, None), ('f', 'Femur (thigh)', 50, 50, None), ('b', 'Tibia (shin)', 70, 65, None), ('a', 'Tarsus and pretarsus (foot)', 90, 80, 'orange')], [('c', 't', None), ('t', 'f', None), ('f', 'b', None), ('b', 'a', None)], 'The six named parts of every insect leg, from hip to claws.', False)
F['bee_foot'] = blocks([('t', 'Tarsal segments', 20, 30, None), ('c', 'Two claws: grip rough surfaces', 20, 70, None), ('p', 'Soft pad: for smooth surfaces', 80, 50, 'orange')], [('t', 'p', None), ('c', 'p', None)], 'The foot has two ways to hold on.', False)
F['bee_pollen_basket'] = blocks([('c', 'Combs brush pollen from hairs', 15, 25, None), ('p', 'Press squeezes it up', 50, 50, None), ('b', 'Basket holds the pellet', 85, 75, 'orange')], [('c', 'p', None), ('p', 'b', None)], 'Pollen moves from body to comb to press to basket.')
F['bee_pollen_load'] = blocks([('h', 'Pollen catches in branched hairs', 15, 25, None), ('p', 'Packed with a little nectar', 50, 50, None), ('b', 'Carried home in the basket', 85, 75, 'orange')], [('h', 'p', None), ('p', 'b', None)], 'From flower to basket to nest: the pollen is the colony\'s protein.', False)
F['bee_antenna_cleaner'] = blocks([('a', 'Antenna drawn through the notch', 20, 50, None), ('b', 'Bristles comb off dirt', 55, 50, None), ('c', 'Clean antenna: better smell', 90, 50, 'green')], [('a', 'b', None), ('b', 'c', None)], 'How the foreleg cleans an antenna.', False)
F['bee_abdomen'] = blocks([('c', 'Crop: carries nectar', 20, 20, None), ('m', 'Midgut: digests', 55, 20, None), ('h', 'Heart: moves blood', 20, 55, 'orange'), ('w', 'Wax glands, underneath', 55, 55, None), ('s', 'Sting, at the tip', 90, 80, None)], [('c', 'm', None), ('m', 's', None)], 'What the abdomen holds, roughly from front to back.', False)
F['bee_wax_glands'] = blocks([('g', 'Wax glands over the wax mirrors, segments 4 to 7', 20, 50, 'orange'), ('f', 'Flakes collect in pockets on the underside', 55, 50, None), ('c', 'Picked off and worked into comb', 90, 50, 'green')], [('g', 'f', None), ('f', 'c', None)], 'From gland to comb.', False)
F['bee_nasonov'] = blocks([('g', 'Nasonov gland on the back', 15, 50, 'orange'), ('s', 'Scent fanned by wings', 50, 50, None), ('b', 'Other bees follow it', 85, 50, 'green')], [('g', 's', None), ('s', 'b', None)], 'A scent beacon: swarm, hive entrance, water.', False)
F['bee_sting'] = blocks([('b', 'Barbs catch in mammal skin', 15, 20, None), ('p', 'Bee pulls away: sting, sac and part of abdomen can tear free', 50, 50, None), ('v', 'Detached sting keeps working for a short time', 85, 50, 'orange'), ('a', 'Alarm pheromone alerts nestmates', 85, 85, None)], [('b', 'p', None), ('p', 'v', None), ('p', 'a', None)], 'What happens when a worker stings a mammal. Why the sting autotomy evolved is a hypothesis (kin selection is the usual one).')
F['bee_venom_sac'] = blocks([('g', 'Venom gland', 15, 50, None), ('s', 'Venom sac stores it', 50, 50, 'orange'), ('n', 'Pumped through the sting', 85, 50, None)], [('g', 's', None), ('s', 'n', None)], 'Venom: made, stored, pumped.', False)
F['bee_ovaries'] = blocks([('q', 'Queen: large ovaries, lays the eggs', 20, 25, 'orange'), ('w', 'Worker: ovaries reduced, held back by queen and brood', 50, 55, None), ('n', 'No queen: some workers\' ovaries develop; unfertilised eggs become males', 80, 85, None)], [('q', 'w', None), ('w', 'n', None)], 'Reproduction in a colony: the queen lays; workers normally do not.', False)
F['bee_oesophagus'] = blocks([('m', 'Mouth', 15, 50, None), ('t', 'Oesophagus through thorax', 50, 50, None), ('c', 'Crop', 85, 50, 'orange')], [('m', 't', None), ('t', 'c', None)], 'The path of nectar from the mouth to the honey stomach.')
F['bee_crop'] = bars([('maximum load in a foraging model (Winston 1987)', 32.5), ('uptake of 1.5 M sucrose at an artificial flower (Stabentheiner and Kovac 2014)', 64.9)], 'milligrams of nectar', 'Two published figures for how much a forager can carry: they differ with the bees, the method and the solution, so the card gives a range of about 30 to 65 mg.')
F['bee_proventriculus'] = blocks([('c', 'Crop: nectar for the colony', 15, 30, 'orange'), ('v', 'Proventriculus: valve', 50, 50, None), ('m', 'Midgut: her own food', 85, 70, None)], [('c', 'v', None), ('v', 'm', 'a little, when she needs fuel')], 'A valve decides whether nectar stays cargo or becomes her food.', False)
F['bee_midgut'] = blocks([('f', 'Food and enzymes', 15, 50, None), ('d', 'Digestion', 50, 50, None), ('a', 'Absorption into the blood', 85, 50, 'green')], [('f', 'd', None), ('d', 'a', None)], 'Digestion and absorption happen in the midgut.')
F['bee_malpighian'] = blocks([('b', 'Waste in the blood', 15, 50, None), ('m', 'Malpighian tubules', 50, 50, 'orange'), ('g', 'Hindgut: water taken back', 85, 50, None)], [('b', 'm', 'taken up'), ('m', 'g', 'emptied')], 'Her kidney substitute: tubes in the blood that empty into the gut.')
F['bee_hindgut'] = blocks([('w', 'Waste from tubules and midgut', 15, 50, None), ('r', 'Rectum: water reabsorbed', 50, 50, 'blue'), ('d', 'Dry droppings leave', 85, 50, None)], [('w', 'r', None), ('r', 'd', None)], 'The last stage: water is saved.')
F['bee_heart'] = blocks([('h', 'Heart (abdomen): pulses', 15, 70, 'orange'), ('a', 'Aorta through thorax', 50, 40, None), ('b', 'Head: blood spills out', 85, 20, None), ('o', 'Body cavity: blood washes organs', 50, 90, 'blue')], [('h', 'a', 'forward'), ('a', 'b', None), ('b', 'o', None), ('o', 'h', 'back in through slits')], 'An open circulation: the blood is pumped forward, then flows freely back among the organs and re-enters the heart through valved slits.')
F['bee_hypopharyngeal_gland'] = blocks([('p', 'Pollen and honey eaten by a nurse', 15, 50, None), ('g', 'Hypopharyngeal glands', 50, 50, 'orange'), ('f', 'Food for larvae and queen', 85, 50, 'green')], [('p', 'g', None), ('g', 'f', None)], 'A nurse bee turns pollen and honey into larval food in her head.')
F['bee_brain'] = blocks([('o', 'Optic lobes: sight', 15, 30, None), ('a', 'Antennal lobes: smell', 15, 70, None), ('m', 'Mushroom bodies: learning', 55, 50, 'orange'), ('c', 'Motor output: flight, legs, dance', 90, 50, 'green')], [('o', 'm', None), ('a', 'm', None), ('m', 'c', None)], 'How the brain\'s parts work together.')
F['bee_mushroom_bodies'] = blocks([('s', 'Smell and sight arrive at the cups', 15, 50, None), ('m', 'Mushroom body: association', 50, 50, 'orange'), ('l', 'Learned link: this colour or scent means food (memory also lies elsewhere)', 85, 50, 'green')], [('s', 'm', None), ('m', 'l', None)], 'The mushroom bodies take part in associative learning.', False)
F['bee_nerve_cord'] = blocks([('b', 'Brain', 15, 50, None), ('s', 'Suboesophageal ganglion: mouthparts', 35, 50, None), ('t', 'Thoracic ganglia (2): legs, wings', 60, 50, None), ('a', 'Abdominal ganglia (5): segments and sting', 85, 50, None)], [('b', 's', None), ('s', 't', None), ('t', 'a', None)], 'The chain of ganglia from head to sting in a real worker. The model draws four abdominal ganglia.', False)
F['bee_tracheae'] = blocks([('s', 'Spiracle opens', 15, 50, None), ('t', 'Tracheae branch', 40, 50, 'blue'), ('l', 'Tracheoles reach the muscle cells', 65, 50, None), ('o', 'Oxygen goes straight into cells', 90, 50, 'green')], [('s', 't', 'air in'), ('t', 'l', None), ('l', 'o', None)], 'No lungs: air is piped to the cells.')
F['bee_spiracles'] = bars([('real worker: thorax and propodeum', 3), ('real worker: abdomen behind', 7), ('model: thorax and propodeum', 3), ('model: abdomen', 6)], 'pairs of spiracles', 'A worker has 10 pairs (Snodgrass 1910): 3 on the apparent thorax (2 true thoracic and 1 on the propodeum) and 7 on the abdomen. The model draws 9.')
F['bee_air_sacs'] = blocks([('a', 'Abdomen squeezes', 15, 50, None), ('s', 'Air sacs: bellows', 50, 50, 'blue'), ('t', 'Air pushed through the tubes', 85, 50, None)], [('a', 's', None), ('s', 't', None)], 'Air sacs act as bellows.', False)
F['bee_cuticle'] = blocks([('e', 'Epicuticle: wax, no chitin', 50, 10, None), ('x', 'Exocuticle: rigid, darkened', 50, 35, 'orange'), ('n', 'Endocuticle: layered chitin, tough and flexible', 50, 60, None), ('d', 'Epidermis: living cells', 50, 85, 'green')], [('d', 'n', 'builds'), ('d', 'x', None), ('d', 'e', None)], 'Layers of the exoskeleton, from outside to the cells that make it.', False)
F['bee_chitin'] = blocks([('g', 'Glucose', 15, 25, None), ('n', 'N-acetylglucosamine', 50, 50, 'orange'), ('c', 'Chitin chain', 85, 75, None)], [('g', 'n', 'modified'), ('n', 'c', 'joined end to end')], 'Chitin is a chain of N-acetylglucosamine units.')
F['bee_hairs'] = blocks([('h', 'Branched hair', 15, 50, None), ('p', 'Pollen tangles in it', 85, 25, 'orange'), ('s', 'Some hairs sense touch', 85, 75, None)], [('h', 'p', None), ('h', 's', None)], 'Branched hairs catch pollen; some hairs are touch sensors.', False)
F['bee_nectar'] = bars([('nectar sugar, low end of the range', 10), ('nectar sugar, high end of the range', 70)], 'percent sugar by weight', 'Floral nectar ranges from about 10 to 70 percent sugar by weight (Nicolson 2022); water makes up the rest, so about 30 to 90 percent.')
F['bee_honey'] = bars([('nectar water, if nectar is 70% sugar', 30), ('nectar water, if nectar is 10% sugar', 90), ('finished honey water, lower figure', 15.5), ('finished honey water, upper figure', 18)], 'percent water', 'Water in nectar spans about 30 to 90 percent (the rest of the 10 to 70 percent sugar range); finished honey holds about 15.5 to 18 percent (Honey, Wikipedia).')
F['bee_vision'] = F['bee_photoreceptor'].copy(); F['bee_vision']['caption'] = 'The three colour channels of a honey bee: ultraviolet, blue and green. There is no receptor for red. The curves are schematic bell shapes centred on the approximate peaks.'
F['bee_waggle_dance'] = {'type': 'plot', 'x': [-90, 90], 'y': [-90, 90], 'fns': [{'f': 'x', 'label': 'angle of the waggle run from straight up'}], 'xlabel': 'angle of the food to the right of the sun direction (degrees)', 'ylabel': 'angle of the waggle run to the right of straight up (degrees)', 'caption': 'The rule: the waggle run is tilted from vertical by the same angle as the food is from the sun. 45 degrees right of the sun gives a run 45 degrees right of up. This is the rule of the dance; how much followers use it is debated.'}
F['bee_colony'] = bars([('workers, upper figure (Delaware extension)', 60000), ('midsummer, upper figure quoted by Wikipedia', 80000)], 'bees', 'Upper figures quoted for the number of workers in a colony at its peak. Colonies vary from some thousands in winter to tens of thousands in summer.')
F['bee_lifespan'] = blocks([('h', 'In the hive: clean, nurse', 15, 25, None), ('b', 'Build comb, guard', 50, 50, None), ('f', 'Forage: the last weeks', 85, 75, 'orange'), ('w', 'Autumn workers: stay warm, live months', 50, 90, 'blue')], [('h', 'b', None), ('b', 'f', None)], 'Jobs change with age; autumn workers live much longer than summer ones.')
F['bee_wing_note'] = None
F.pop('bee_wing_note')
F['bee_compound_eye']['caption'] = F['bee_compound_eye']['caption']
import glob
TITLE = {}
for fn in glob.glob('data/nodes/*.json'):
    if fn.endswith('park_bee.json'): continue
    for x in json.load(open(fn)):
        if isinstance(x, dict) and 'id' in x: TITLE[x['id']] = x['title']
# homology links: the node's `related` list is not drawn by the card yet (see the report), so the same links are also written as a fact line in words
for n in NODES:
    rel = [r for r in n.get('related', []) if r in TITLE]
    n['related'] = rel
    if rel: n['facts'].append(['Compare with the human', '; '.join(TITLE[r] for r in rel) + ' (open these cards from Library search)'])
for n in NODES:
    if n['id'] not in F: print('no figure for', n['id'])
os.makedirs('data/nodes', exist_ok=True)
json.dump(NODES, open('data/nodes/park_bee.json', 'w'), indent=1, ensure_ascii=False)
json.dump(F, open('data/viz/park_bee.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'nodes,', len(F), 'figures')
