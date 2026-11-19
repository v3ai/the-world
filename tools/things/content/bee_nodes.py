# Source of the honey bee cards (data/nodes/park_bee.json) and their figures (data/viz/park_bee.json).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/bee_nodes.py
# Every number below comes from a source named in `ext` or in notes/bee.md, or from arithmetic shown on the card. Typical values carry a ≈.
import json, os

def X(t, u): return {'title': t, 'url': u}
W_WBH = X('Western honey bee (Wikipedia)', 'https://en.wikipedia.org/wiki/Western_honey_bee')
W_HB = X('Honey bee (Wikipedia)', 'https://en.wikipedia.org/wiki/Honey_bee')
W_IM = X('Insect morphology (Wikipedia)', 'https://en.wikipedia.org/wiki/Insect_morphology')
W_WD = X('Waggle dance (Wikipedia)', 'https://en.wikipedia.org/wiki/Waggle_dance')
W_NAS = X('Nasonov gland (Wikipedia)', 'https://en.wikipedia.org/wiki/Nasonov_gland')
W_LIFE = X('Honey bee life cycle (Wikipedia)', 'https://Www.wikipedia.org/wiki/Honey_bee_life_cycle')
STR = X('Streinzer et al. 2013: Sex and caste-specific variation in compound eye morphology of five honeybee species (PLOS ONE)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3584085/')
MEN = X('Hempel de Ibarra, Vorobyev, Menzel 2014: Mechanisms, functions and ecology of colour vision in the honeybee', 'https://link.springer.com/doi/10.1007/s00359-014-0915-1')
COLL = X('Collison 2016: Wings and flight (honey bee wing coupling and wingbeat)', 'https://static1.squarespace.com/static/522b22f2e4b04879e6b51037/t/6161b093d301b565753367ca/1633792151834/Wings+and+Flight++-++Clarence+Collison++-++2016.pdf')
ALT = X('Honeybee hovering: about 230 Hz at about 90 degrees stroke amplitude (search summary of Altshuler et al. 2005, PNAS; paper itself not opened)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1312389')
BUZ = X('Honey bee anatomy (Buzz About Bees)', 'https://buzzaboutbees.net/honey-bee-anatomy.html')
ANT = X('Bee antennae (Buzz About Bees)', 'https://buzzaboutbees.net/bee-antennae.html')
PRB = X('Proboscis length of honey bee workers, Egyptian study', 'https://jppp.journals.ekb.eg/article_376650_73741fbc699d2723e243700581b85765.pdf')
BAM = X('Bamidele et al. 2021: morphometrics of A. mellifera in three ecological zones (Bulletin of Insectology 74)', 'https://archive.bulletinofinsectology.org/pdfarticles/vol74-2021-019-026bamidele.pdf')
IPA = X('Bee alarm pheromone (University of Bristol, Molecule of the Month)', 'https://www.chm.bris.ac.uk/motm/ethylacetate/bee.htm')
RAD = X('Harmonic radar tracking of honey bee flight (air speed about 5 m/s; summary of an early study)', 'https://www.nature.com/articles/35000564')
STG = X('Bee stingers work like saws to pump venom (Popular Science)', 'https://www.popsci.com/?p=788953')

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
  'A western honey bee worker (Apis mellifera): a female, about 12 to 15 mm long, that gathers nectar and pollen, builds and cleans the nest and, in her last weeks, forages.',
  'She is a six-legged insect with her body in three parts: a head with big eyes, feelers and a tongue, a middle part (the thorax) that carries the wings and legs, and a rear part (the abdomen) that holds the gut, the heart, the wax glands and the sting. Her skeleton is on the outside, like a suit of armour, and she has no lungs: air reaches her tissues through tubes. Use the layer buttons to peel her, and click any part for its card.',
  'Workers are the female bees that do the work of the colony; the queen lays the eggs and the males (drones) mate. A worker flies on two pairs of wings that beat together because of a row of small hooks, sees ultraviolet light but not red, and tells her sisters where food is by dancing. Her blood is not kept in a closed system of vessels the way yours is: it washes around the organs, pushed forward by a tube along her back.',
  'Taxonomically she is an arthropod, a hexapod, a hymenopteran. Bees are part of the wasp lineage that turned to flowers for food. A worker is a haplodiploid female developed from a fertilised egg; her ovaries are reduced, though not always functionless. Nearly everything you can click here is one of the structures that textbook arthropod anatomy names, and the cards say where the honey bee departs from the general plan.',
  [['Body length', '≈ 12 to 15 mm (workers); the model is ≈ 14 mm'], ['Compound eye', '≈ 5,375 ommatidia per eye in workers (mean of 4 bees)'], ['Wing', 'forewing ≈ 9.7 mm long; beats ≈ 230 Hz while hovering'], ['Colony', '≈ 40,000 to 80,000 bees in midsummer'], ['Model', 'built from the measurements named on each card; proportions otherwise by eye']],
  refs=[R_ART, R_CIRC, R_GAS], ext=[W_WBH, W_HB, W_LIFE],
  dyk='She has no lungs and her blood carries no oxygen: air is delivered straight to her muscles through branching tubes.',
  parts=['bee_head', 'bee_thorax', 'bee_abdomen', 'bee_hairs', 'bee_wings', 'bee_leg', 'bee_vision', 'bee_flight', 'bee_waggle_dance', 'bee_colony', 'bee_lifespan', 'bee_honey'],
  related=['brain', 'heart', 'vision', 'muscle_contraction', 'respiratory_system', 'digestive_system'])

# ------------------------------------------------------------------ head
N('bee_head', 'Head', 'structure', .0035, ['park_bee'],
  'The head carries the two compound eyes, three small simple eyes, the antennae and the mouthparts, and holds the brain and the glands that make food for larvae.',
  'Nearly everything a bee uses to find food and sense the world is on her head. On the sides sit two big eyes. On top are three tiny extra eyes. In front are two feelers (antennae) that smell, taste and touch, and below them the jaws and the tongue. Inside the hard shell are the brain, the muscles that work the jaws and the glands that make food for the young.',
  'The head capsule is a rigid box of cuticle. The face looks forward and down, which is a good arrangement for reaching into flowers. The mouthparts are of the "chewing-lapping" kind: jaws that can chew wax and pollen, and a tongue that laps nectar.',
  'Inside the head capsule lie the brain, the muscles of the jaws and of the sucking pump, and the hypopharyngeal glands. Head tracheae and air sacs bring air. The compound eyes occupy most of each side; the model eye is 2.4 mm long.',
  [['Head width', '≈ 3.5 mm in the model (proportion chosen by eye)'], ['Eye length', '2.4 mm (workers; Streinzer et al. 2013)']],
  refs=[R_ART], ext=[W_IM, BUZ], parts=['bee_compound_eye', 'bee_ocelli', 'bee_antenna', 'bee_mandibles', 'bee_proboscis', 'bee_brain', 'bee_hypopharyngeal_gland'])

N('bee_compound_eye', 'Compound eye', 'structure', .0024, ['bee_head', 'bee_vision'],
  'Each of her two big eyes is a mosaic of about five thousand tiny lenses, each feeding its own light-sensing unit.',
  'You have one lens per eye that makes a sharp picture on a screen at the back. A bee\'s eye is built differently: it is made of thousands of separate little eyes packed side by side, called ommatidia. Each one looks at one tiny patch of the world, and together they make a coarse picture, a bit like a screen of pixels. The picture is not sharp, but it is very fast, which suits an animal that flies and has to notice movement.',
  'A worker\'s eye has about 5,375 ommatidia (a drone\'s eye has about 10,000, a queen\'s about 4,500). Each lens, called a facet, is about 25 micrometres across. Under it a crystalline cone and a small bundle of light-sensing cells make up the ommatidium. Her eye sees three colour channels: ultraviolet, blue and green. Click the button to look inside.',
  'Worker (Apis mellifera): ommatidia 5,375 ± 143 (n = 4), facet diameter 25.2 ± 0.3 µm (n = 3), eye length 2.4 ± 0.1 mm, eye surface area 2.5 ± 0.1 mm² (Streinzer et al. 2013). Compared with a camera eye, resolution is far lower: the angle between neighbouring ommatidia sets the finest detail she can see, and it is some degrees, not a fraction of a degree. The honey bee eye also carries fine hairs between the facets.',
  [['Ommatidia per eye (worker)', '5,375 ± 143'], ['Facet diameter', '25.2 ± 0.3 µm'], ['Eye length', '2.4 ± 0.1 mm'], ['Eye surface area', '2.5 ± 0.1 mm²'], ['Colour channels', '3: ultraviolet, blue, green']],
  refs=[R_VIS], ext=[STR, MEN], parts=['bee_facet', 'bee_ommatidium', 'bee_photoreceptor', 'bee_rhabdom', 'bee_vision'], related=['eye_l', 'vision', 'bio_vision_photoreception'],
  dyk='Her eye has hairs growing between the lenses, and the facets are so small that 40 of them would fit across a pinhead one millimetre wide.',
  openq=['How much detail she can really use, and how her brain combines the 5,000 patches into a picture, is still studied.'])

N('bee_facet', 'Lens (facet)', 'structure', 2.5e-5, ['bee_compound_eye'],
  'The outer lens of one ommatidium: a clear plate of cuticle about 25 micrometres across.',
  'On the surface of the eye each tiny six-sided window is a lens. It is clear but made of the same hard stuff as the rest of her skeleton, which is built from chitin.',
  'The lens is part of the cuticle, made transparent. It focuses light on the crystalline cone below. Neighbouring lenses are packed in a honeycomb of hexagons, the same shape that bees make with wax.',
  'Facet diameter in workers 25.2 ± 0.3 µm (Streinzer et al. 2013). Chitin is a polymer of N-acetylglucosamine; click the molecule button to see its unit.',
  [['Width', '25.2 µm (workers)']], refs=[R_CARB], ext=[STR, W_IM], related=['bee_chitin'])

N('bee_ommatidium', 'Ommatidium', 'structure', 3e-4, ['bee_compound_eye'],
  'One of the thousands of separate light-sensing units that make up a compound eye.',
  'Think of it as a tiny tube that looks in one direction. Light enters through its lens, is guided down a cone, and reaches a bundle of light-sensing cells that tell the brain how bright, and which colour, that one patch is. Dark cells around it stop light leaking in from the neighbours.',
  'An ommatidium has a lens, a crystalline cone, a bundle of photoreceptor cells that form a central light-catching rod (the rhabdom), and pigment cells that screen it. The photoreceptors are of three main spectral types in the honey bee, tuned to ultraviolet, blue and green.',
  'Spectral sensitivity peaks of the three honey bee receptor types: about 344 nm (ultraviolet), 436 nm (blue) and 544 nm (green; some papers give 556 nm) (Hempel de Ibarra, Vorobyev and Menzel 2014). The depth and cell sizes in the picture are illustrative.',
  [['Receptor peaks', '≈ 344, 436, 544 nm']], refs=[R_VIS], ext=[MEN, STR], parts=['bee_photoreceptor', 'bee_rhabdom'], related=['vision'])

N('bee_photoreceptor', 'Light-sensing cells (photoreceptors)', 'cell', 2e-5, ['bee_ommatidium'],
  'The cells under the lens that turn light into nerve signals; they come in three kinds, tuned to ultraviolet, blue and green.',
  'These long thin cells are the bee\'s "pixels". Each one holds a pigment that changes shape when light hits it, and that starts a signal that runs to the brain. Cells tuned to ultraviolet, to blue and to green let her tell flowers apart by colour, including patterns that only show up in ultraviolet.',
  'They are the same kind of cell as your own rods and cones in principle: a light-catching molecule inside a membrane-rich region, and an electrical signal on the other side. In insects, though, the light-catching region sits on the side of the cell facing the light, and the cell signals by a graded voltage change, not by the same chain as in vertebrate rods.',
  'The pigment is a visual pigment (an opsin protein holding a retinal chromophore). Honey bee peaks: UV ≈ 344 nm, blue ≈ 436 nm, green ≈ 544 nm. Bees have no receptor for red light, so a pure red flower looks dark to them unless it also reflects other colours.',
  [['Types', 'ultraviolet, blue, green (trichromatic)']], refs=[R_VIS], ext=[MEN], related=['vision', 'bio_vision_photoreception'])

N('bee_rhabdom', 'Rhabdom', 'structure', 1e-5, ['bee_ommatidium'],
  'The thin central rod in an ommatidium where the visual pigment is packed and light is caught.',
  'Each ommatidium has a thin glassy rod down its middle where the light-catching molecules are packed together, a bit like the strip inside a fibre-optic cable. Light that reaches it is absorbed and turned into a signal.',
  'The rhabdom is built from the folded membranes of the photoreceptor cells, so the light meets as many pigment molecules as possible on its way down. The pigment is an opsin holding retinal, the same small molecule, a form of vitamin A, that sits in your own eyes.',
  'The chromophore is retinal. Absorption of a photon changes its shape and activates the opsin. Click the molecule button to see retinal.',
  [['Chromophore', 'retinal (from vitamin A)']], refs=[R_VIS], ext=[MEN], related=['vision'])

N('bee_ocelli', 'Ocelli (simple eyes)', 'structure', 3e-4, ['bee_head', 'bee_vision'],
  'Three small simple eyes on the top of her head, each a single lens about 0.3 mm across.',
  'Besides the big eyes she has three tiny extra eyes arranged in a triangle on top of her head. They do not see pictures. They sense how bright the sky is and help her keep level and steady in flight.',
  'Each ocellus is a single lens over a layer of light-sensing cells. The median ocellus is about 0.30 mm across and the lateral ones about 0.28 mm in workers. They are used to detect the horizon and changes of light, and probably help stabilise flight and set the daily rhythm of foraging.',
  'Median ocellus 0.30 ± 0.01 mm; lateral 0.28 ± 0.01 mm (Streinzer et al. 2013). The function in stabilising flight is well supported in several insects; the finer details in bees are still studied.',
  [['Number', '3'], ['Diameter', '0.30 mm median, 0.28 mm lateral']], cert='C2', refs=[R_VIS], ext=[STR, BUZ])

N('bee_antenna', 'Antenna', 'structure', .0065, ['bee_head'],
  'Her two feelers: long, jointed, covered with sensors for smell, taste, touch and air movement. A worker\'s antenna has 12 segments: a long scape, a short pedicel and the flagellum.',
  'The antennae are her nose, her fingertips and part of her tongue. They are covered with microscopic pits and hairs that pick up smells in the air, taste what she touches, and feel vibration and air movement. When she meets another bee, she sniffs her with them.',
  'The first segment, the scape, is the longest and is set in a socket so that it swings. The second, the pedicel, is short and houses a sensory organ that senses movement of the rest. The remaining ten segments are the flagellum, which carries most of the smell sensors. Drones have 13 segments.',
  'Sources disagree slightly on how the segments are counted: most give 12 in total for females (scape, pedicel and ten flagellar segments). The model draws the three parts with correct order and relative lengths, but the exact lengths are proportions chosen by eye.',
  [['Segments (worker)', '12: scape, pedicel, 10 in the flagellum'], ['Antenna cleaning', 'by the foreleg notch (see Antenna cleaner)']],
  refs=[R_ART], ext=[ANT, BUZ], parts=['bee_antenna_cleaner'])

N('bee_mandibles', 'Mandibles (jaws)', 'structure', .001, ['bee_head'],
  'Her two jaws: strong, spoon-shaped, used to work wax, handle pollen, groom and defend, rather than to chew solid food.',
  'The jaws open sideways, not up and down like yours. A worker uses them to mould and nibble wax when she builds comb, to carry things, to clean the nest and to bite an enemy.',
  'The mandibles are driven by large muscles inside the head. They sit either side of the mouth, and the tongue and its sheath lie between and below them.',
  'In bees the mandibles are for manipulation, wax and defence; feeding on liquids is done by the proboscis.',
  [['Number', '2, opening sideways']], refs=[R_ART], ext=[BUZ, W_IM], related=['masseter'])

N('bee_proboscis', 'Proboscis (tongue and sheath)', 'structure', .0057, ['bee_head', 'bee_honey'],
  'Her drinking straw: a long hairy tongue (the glossa) inside a sheath made from the second maxillae and the labial palps. In the picture it is partly extended into the flower.',
  'Bees do not suck nectar through a hole like a straw. The tongue is a hairy rod that is dipped in the nectar, gets coated by it, and is then drawn back up in the sheath, where the nectar is squeezed up toward the mouth. When she is not feeding, the whole thing folds back under her head.',
  'The glossa is long and tipped with a small spoon. It moves in and out quickly, and the sheath around it forms a food canal. Honey bees are "long-tongued" bees, and that is what lets them reach nectar deep in many flowers.',
  'Proboscis length varies between populations: one study found 5.4 to 5.9 mm (mean 5.69 mm), another a mean of 6.29 mm over several populations. The model shows it extended to about 3.9 mm, which is a choice for the picture.',
  [['Length (fully extended)', '≈ 5.4 to 6.3 mm depending on the population'], ['Shown in the model', '≈ 3.9 mm, partly extended']],
  refs=[R_ART], ext=[PRB, BUZ])

# ------------------------------------------------------------------ thorax and wings
N('bee_thorax', 'Thorax', 'structure', .0045, ['park_bee'],
  'The middle section that carries all six legs and both pairs of wings, and is almost entirely filled with flight muscle. It has three segments.',
  'The thorax is the bee\'s engine room. Three segments are joined into a solid box: the front one (prothorax) carries the front legs, the middle one (mesothorax) the front wings and middle legs, and the rear one (metathorax) the back wings and hind legs. Inside is a block of muscle that shakes the box to beat the wings.',
  'The two wing-bearing segments are fused into one rigid unit called the pterothorax. In a bee the first segment of the abdomen is also fused to the thorax, which is why a bee\'s "waist" lies between the first and second abdominal segments. Three pairs of breathing pores (spiracles) open on the thorax.',
  'The thoracic exoskeleton acts as a mechanical resonator: the indirect flight muscles deform the box, and the wing hinge turns that small deformation into a large wing stroke.',
  [['Segments', '3: prothorax, mesothorax, metathorax'], ['Thoracic spiracles', '3 pairs']],
  refs=[R_ART], ext=[W_IM, BUZ], parts=['bee_wings', 'bee_flight_muscles', 'bee_leg', 'bee_wing_hinge', 'bee_hairs'])

N('bee_wings', 'Wings', 'structure', .0097, ['bee_thorax', 'bee_flight'],
  'Two pairs of thin membrane wings, stiffened by veins. The forewing is about 9.7 mm long; the smaller hindwing hooks onto it in flight. Here they are folded back, as at rest.',
  'A bee has four wings, but she flies as if she had two, because the small hind wing is hooked onto the large front wing. The wings are thin sheets held by a framework of veins, a bit like a kite. The veins are hollow tubes that also carry blood, air and nerves.',
  'Wings are outgrowths of the exoskeleton: a double layer of cuticle with veins between. They are not moved by muscles inside them. Instead, muscles in the thorax deform the thorax, and the wing hinge turns that into a stroke. The pattern of veins forms closed cells, and the arrangement is used to tell bee species and races apart.',
  'Average wing length 9.7 mm in honey bees (quoted from a PNAS-related study; the model\'s forewing is 9.7 mm). Veins in the model are a simplified pattern: the real forewing has several submarginal cells and the model draws three.',
  [['Forewing length', '≈ 9.7 mm'], ['Number', '4: two forewings, two hindwings']],
  refs=[R_ART], ext=[COLL, ALT], parts=['bee_hamuli', 'bee_wing_hinge'], related=['bee_flight'], cert='C1')

N('bee_hamuli', 'Hamuli (wing-coupling hooks)', 'structure', 1.5e-4, ['bee_wings'],
  'A row of tiny hooks on the front edge of each hindwing that catch a fold on the back edge of the forewing, so the two wings beat as one.',
  'Before flying, a bee locks her back wing to her front wing with a row of little hooks. They catch a groove on the front wing like a zip. Once hooked, the two wings act as one larger wing. When she lands the hooks release and the wings fold back.',
  'The hooks are the hamuli (singular hamulus). They engage the decurved rear margin of the forewing. The coupling makes the two wings a single aerofoil, so the bee beats them in step.',
  'The number of hamuli varies between bees and has been used as a measured trait in morphometric studies; the model draws 20 on each hindwing as an illustration, not a count. The wings are drawn folded, hence the hooks lie under the forewing and are shown disengaged.',
  [['Role', 'couples hindwing to forewing in flight'], ['Count in the model', '20 per hindwing (illustrative)']],
  refs=[R_ART], ext=[COLL], cert='C1')

N('bee_wing_hinge', 'Wing hinge and tegulae', 'structure', 1e-3, ['bee_thorax', 'bee_flight'],
  'The small hard plates at the base of each wing, where the wing is joined to the thorax and where thoracic motion becomes wing motion.',
  'Her wings join the body at a tiny, complicated joint. Small plates of hard cuticle, connected by elastic bands, make the wing swing up and down when the thorax is squeezed and released. Over each joint sits a small scale, the tegula.',
  'The hinge is made of several small cuticle plates (axillary sclerites) joined by elastic cuticle. The up-and-down movement of the thorax roof is turned into a flapping motion of the wing, which also twists as it goes.',
  'The detailed mechanics of the honey bee hinge are not drawn in detail here; the model shows the plates as small blocks at the right place, not as a mechanical reconstruction.',
  [['Role', 'turns thorax movement into wing stroke']], refs=[R_ART], ext=[W_IM])

N('bee_flight', 'How a bee flies', 'process', .014, ['park_bee'],
  'A hovering worker beats her wings about 230 times a second, with a short, fast stroke of about 90 degrees.',
  'Bees fly by a trick. Her muscles do not pull the wings directly. They squeeze the thorax up and down, and the stiff little box flexes, driving the wing hinge. Because the muscles contract on a stretch rhythm, they can beat much faster than a nerve signal could ask them to. The result is a buzz: the wing flaps about 230 times a second.',
  'The wing moves on a short stroke (about 90 degrees) at a high frequency (about 230 Hz). Foragers loaded with nectar beat at a lower frequency. A foraging flight over open ground has been measured at roughly 5 m/s air speed with harmonic radar.',
  'The average wing tip speed follows from the numbers above: tip path per stroke = 9.7 mm × 1.57 rad ≈ 15.2 mm; two strokes per cycle at 230 cycles per second gives about 7 m/s. That is arithmetic on the quoted values, not a separate measurement. The wing beats are far faster than the nerve impulses that command them, which is why the muscles are of the "asynchronous" kind.',
  [['Wingbeat frequency', '≈ 230 Hz (hovering)'], ['Stroke amplitude', '≈ 90°'], ['Air speed in foraging flight', '≈ 5 m/s (≈ 18 km/h), early harmonic-radar mean'], ['Average wing tip speed', '≈ 7 m/s (calculated)']],
  cert='C2', refs=[R_ART, R_CON], ext=[ALT, COLL, RAD], parts=['bee_flight_muscles', 'bee_wings', 'bee_wing_hinge', 'bee_hamuli'],
  dyk='A beat every 4 milliseconds: in the time it takes you to blink, her wings have gone round about 70 times.',
  openq=['The detail of how the muscle\'s stretch-activated rhythm is tuned to the thorax as it loads up with nectar is still being worked out.'])

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
  'The sizes in the tissue picture are illustrative; real fibres are of the order of tens of micrometres across.',
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
  'Six legs, each made of the same named pieces: coxa, trochanter, femur, tibia, tarsus and the foot (pretarsus). The hind pair carries the pollen baskets.',
  'Insects have six legs, three on each side. A leg is a chain of tubes joined by hinges: the coxa is the hip, a short trochanter follows, then a long thigh (femur), a shin (tibia) and a foot made of small segments (the tarsus), ending in a pair of claws. The front legs clean the antennae, the middle legs clean and carry, and the hind legs have the pollen baskets.',
  'The muscles that bend each joint are inside the leg, pulling on the inner side of the hard cuticle. Each pair of legs is a little different: the hind leg is the longest and its tibia and first tarsal segment are broad and flat. Her feet have claws to grip rough surfaces and a soft pad that sticks to smooth ones.',
  'The model\'s hind tibia is 2.9 mm long; the measured range is 2.7 to 3.0 mm in one study. Other segment lengths are proportions chosen by eye, and the three leg pairs share one card.',
  [['Legs', '6'], ['Segments', 'coxa, trochanter, femur, tibia, tarsus, pretarsus'], ['Hind tibia', '≈ 2.7 to 3.0 mm']],
  refs=[R_ART], ext=[W_IM, PRB], parts=['bee_foot', 'bee_pollen_basket', 'bee_antenna_cleaner'], related=['femur_r', 'tibia_r'])

N('bee_foot', 'Foot: tarsus, claws and pad', 'structure', 1e-3, ['bee_leg'],
  'The end of each leg: a chain of small tarsal segments, two claws, and a soft pad between them.',
  'At the tip of each leg are two tiny claws and between them a soft sticky pad. The claws hook rough surfaces; the pad grips smooth ones such as petals and glass. The foot also tastes: it has sensors that let her taste what she stands on.',
  'The part at the end is the pretarsus. The tarsus before it is divided into small segments with no muscles of their own; the first, longest segment is called the basitarsus.',
  'The pad is a wet adhesive pad; the exact mechanism of attachment is still under study in insects generally.',
  [['Claws', '2 per foot']], cert='C2', refs=[R_ART], ext=[W_IM])

N('bee_pollen_basket', 'Pollen basket (corbicula)', 'structure', .0022, ['bee_leg', 'bee_pollen_load'],
  'A smooth, shallow hollow on the outside of each hind leg\'s tibia, fringed with long curved hairs, in which she carries a packed ball of pollen.',
  'On the outer face of each back leg is a smooth dish ringed with stiff curved hairs. She packs pollen, moistened with a little nectar, into it until she has a ball on each leg. Then she flies home with her cargo.',
  'The dish is called the corbicula. The hairs form a basket that holds the pellet in place. Only the hind legs have one. The first tarsal segment has combs that brush pollen off her body and a press that squeezes it up into the basket.',
  'The corbicula is a feature of true honey bees, bumble bees and their relatives; many other bees carry pollen in hairs under the abdomen or on the legs instead. The pellet in the model is a loose illustration.',
  [['Where', 'outer face of each hind tibia']], refs=[R_POL], ext=[BUZ, W_WBH], parts=['bee_pollen_load'])

N('bee_pollen_load', 'Pollen load', 'structure', .0025, ['bee_pollen_basket'],
  'The pellet of pollen she carries home in the basket. Pollen is the flower\'s male cell packaging, and her main source of protein.',
  'Pollen grains are dust-like packages made by the male part of a flower. A bee eats pollen as her protein, and feeds it to her young. While she gathers it she also carries some from flower to flower, which is how she pollinates.',
  'The pollen is packed in with a little nectar so that it sticks together. Adult workers eat about 3.4 to 4.3 mg of pollen a day; most of it goes to feed the brood and make royal jelly.',
  'The size and colour of the model\'s pellet are illustrative: real pellets come in many colours depending on the plant.',
  [['Adult pollen intake', '≈ 3.4 to 4.3 mg per day']], refs=[R_POL], ext=[W_HB], related=['park_flower'])

N('bee_antenna_cleaner', 'Antenna cleaner', 'structure', 5e-4, ['bee_leg', 'bee_antenna'],
  'A small notch and comb on each foreleg, closed by a spur, through which she pulls her antenna to clean it.',
  'She keeps her feelers clean with a built-in comb. Each front leg has a semicircular notch lined with fine bristles. She bends the leg, passes her antenna through the notch and pulls it through, like drawing a thread through your fingers.',
  'The notch is on the first tarsal segment and the spur is on the end of the tibia; together they close into a ring around the antenna. Clean antennae matter because smell is the sense she relies on most.',
  'The model draws the cleaner schematically, as a small ring and spur, not as an exact reconstruction of the bristles.',
  [['Position', 'foreleg, where tibia meets tarsus']], refs=[R_ART], ext=[BUZ])

# ------------------------------------------------------------------ abdomen
N('bee_abdomen', 'Abdomen', 'structure', .0065, ['park_bee'],
  'The rear section: six visible segments (the first is fused into the thorax), packed with the honey stomach, midgut, heart, wax glands, and at the tip the sting.',
  'The abdomen is the back part of the bee. Its hard plates overlap like a roll-top desk, so that it can swell when the honey stomach is full. Inside are the gut, the heart, the wax glands, the venom sac and the sting.',
  'Each segment has a hard plate on the back (tergite) and one on the belly (sternite), joined by soft folds that let the abdomen stretch and bend. The wax glands are on the belly, the Nasonov gland on the back near the tip, and the sting is inside the tip.',
  'The count of visible segments depends on how one counts; the first abdominal segment is fused into the thorax (the propodeum) and the last segments are folded inside. The model shows six overlapping visible segments with a banded colour.',
  [['Visible segments', '6 in the model']], refs=[R_ART], ext=[W_IM, BUZ], parts=['bee_crop', 'bee_midgut', 'bee_heart', 'bee_wax_glands', 'bee_sting', 'bee_nasonov', 'bee_ovaries'])

N('bee_wax_glands', 'Wax glands', 'structure', 1e-3, ['bee_abdomen'],
  'Glands on the underside of the abdomen that ooze liquid wax, which hardens into flakes and is used to build the comb. The model draws four pairs.',
  'Honeycomb is made of wax that she makes herself. In mature workers wax oozes from glands on the underside of her abdomen, hardens into thin flakes on small smooth patches, and is picked off with the legs and chewed into shape.',
  'Mature workers secrete beeswax from glands on the abdomen (Western honey bee, Wikipedia). The flakes are worked with the jaws and legs into the comb; the details of that are general beekeeping knowledge and were not checked against a source here.',
  'Beeswax is a mixture of esters and long-chain hydrocarbons and fatty acids; the exact composition is not covered by a source consulted here.',
  [['Position', 'underside of the abdomen']], refs=[R_ART], ext=[W_WBH], cert='C1')

N('bee_nasonov', 'Nasonov gland', 'structure', 1e-3, ['bee_abdomen'],
  'A gland on the back at the tip of the abdomen that releases a scent used to call other bees: to a swarm, to a hive entrance, to water.',
  'When a bee lifts the tip of her abdomen and fans her wings, she is releasing a lemony-smelling "come here" scent from this gland. Other bees follow it home.',
  'It is a pheromone gland opening on the back at the base of the last visible tergite. Bees use it to attract workers to a settled swarm, to guide lost bees to the hive, to mark water and food that has little scent of its own.',
  'The article consulted does not list the chemicals in it. The model draws the gland as an orange band at the correct position; in life it is exposed only when the abdomen tip is curled down.',
  [['Position', 'back, at the rear edge of the last tergite']], cert='C1', refs=[R_BEH], ext=[W_NAS])

N('bee_sting', 'Sting', 'structure', .0025, ['bee_abdomen'],
  'The sting is a modified egg-laying tool. A worker\'s sting has barbs, so that when it lodges in skin of a mammal it stays behind, still pumping venom.',
  'Only females can sting, because the sting is a rearranged egg-laying organ. A worker\'s sting is a hollow shaft and two sliding, barbed blades. When she stings a mammal the barbs catch in the skin. As she pulls away, the whole sting, the venom sac and part of her abdomen tear free, and she dies. The sting goes on pumping venom for a few minutes.',
  'The two blades (lancets) slide alternately, like a saw, each time driving the sting deeper and pumping venom through a valve-and-piston arrangement. Muscles and a tiny nerve ganglion are attached to it, so it continues to work after it is torn away. A bee that stings another insect can usually withdraw her sting and survive. It also gives off an alarm pheromone, isopentyl acetate, that excites other bees.',
  'Worker stingers are barbed and the barbs do not always catch. The "why she dies" is a trade: for the colony, a deeper and longer-lasting dose of venom and an alarm signal. How that evolved is a question of kin selection (a worker\'s sisters share many of her genes). The sting is shown retracted inside the abdomen tip, as at rest; the barb counts drawn are illustrative.',
  [['Origin', 'a modified egg-laying organ (ovipositor)'], ['Alarm pheromone', 'isopentyl acetate'], ['After stinging a mammal', 'the sting tears free; the worker dies']],
  refs=[R_ART], ext=[W_WBH, STG, IPA, BUZ], parts=['bee_venom_sac'],
  dyk='Only the workers that sting mammals die. A queen\'s sting is not barbed, so she can sting again.',
  openq=['Exactly how often a stung bee dies in the wild, and what the stinging bee gains, are still debated; the "kin selection" account is widely accepted but not the whole story.'])

N('bee_venom_sac', 'Venom sac', 'structure', 1e-3, ['bee_sting'],
  'A small reservoir that stores venom and feeds it down to the sting.',
  'The venom is made in a gland and stored in a small sac. When the sting goes in, the venom is pumped out of the sac, through the sting and into the victim.',
  'The sac stays attached to the sting when it is torn free, so the sting can keep injecting venom after the bee has gone. The main component of honey bee venom is melittin, a small protein that damages cell membranes (no molecule file for melittin exists in this explorer).',
  'Melittin is a peptide of 26 amino acids; this detail was not checked against a source in this session and is left out of the facts.',
  [['Contents', 'venom, with a peptide called melittin as the main component']], cert='C1', refs=[R_ART], ext=[W_WBH, STG])

N('bee_ovaries', 'Ovaries (reduced)', 'structure', 1e-3, ['bee_abdomen'],
  'A worker has a pair of ovaries but they are small and normally do not develop; the queen\'s are large.',
  'Workers are females that do not usually lay eggs. Their ovaries are much smaller than a queen\'s, and are held back by pheromones from the queen and brood.',
  'Under some conditions (for instance a colony without a queen) some workers\' ovaries can develop and the workers lay unfertilised eggs, which grow into males.',
  'The drawn ovaries are small plates; the number of tubes in them is not shown.',
  [['Worker', 'reduced ovaries']], refs=[R_ART], ext=[W_HB])

# ------------------------------------------------------------------ gut and glands
N('bee_oesophagus', 'Oesophagus', 'structure', .01, ['bee_abdomen'],
  'The narrow tube that carries food from the mouth through the thorax to the honey stomach.',
  'It runs from the mouth back through the whole thorax and the narrow waist before opening into the crop in the abdomen. Nectar passes down it on its way to being carried home.',
  'It is part of the foregut, which is lined with a thin layer of chitin.',
  'In the model, the oesophagus runs through the thorax between the two flight muscle masses.',
  [['Part of', 'foregut']], refs=[R_DIG], ext=[W_IM], related=['digestive_system'])

N('bee_crop', 'Crop (honey stomach)', 'structure', .003, ['bee_abdomen', 'bee_honey'],
  'A stretchy bag in the front of the abdomen where she carries nectar home. It holds about 75 mg of nectar.',
  'This is her honey stomach, though no honey is made in it as such. She sucks up nectar and stores it here, separate from her own digestion, then flies home and gives it to other workers. Nectar starts changing into honey as soon as it is in her crop, because she adds enzymes to it.',
  'The crop is part of the foregut. A valve at its end (the proventriculus) lets her keep the nectar for the colony or let a little pass into the midgut when she needs fuel.',
  'The crop carries about 75 mg of nectar; sugar need of an adult worker is about 4 mg per day (Honey bee, Wikipedia). Her own digestion happens in the midgut, so the nectar in the crop is cargo, not food, until she lets some through.',
  [['Capacity', '≈ 75 mg of nectar'], ['Adult sugar need', '≈ 4 mg per day']], refs=[R_DIG], ext=[BUZ, W_HB], parts=['bee_nectar', 'bee_proventriculus'], related=['digestive_system', 'stomach'])

N('bee_proventriculus', 'Proventriculus', 'structure', 1e-3, ['bee_crop'],
  'A small valve between the crop and the midgut that lets her pass nectar on or keep it.',
  'It is a small muscular gate at the end of the honey stomach. It lets her hold the nectar in the crop for the colony, and release some to the midgut when she needs food.',
  'In bees it is also a filter: pollen grains can be removed from the nectar there. It is the last part of the foregut.',
  'The details of the valve action are not drawn; the model shows a small bulb and a short lip at the right place.',
  [['Function', 'valve at the end of the crop']], refs=[R_DIG], ext=[W_IM])

N('bee_midgut', 'Midgut', 'structure', .004, ['bee_abdomen'],
  'The part of the gut where food is digested and absorbed.',
  'Most of her own digestion happens here. Enzymes break the food down and the gut wall takes up the sugars and other nutrients, which go into her blood to be carried to the rest of the body.',
  'The wall is lined with microvilli that give a large surface for absorption. In insects the midgut is also protected from its contents by a thin tube, the peritrophic membrane.',
  'Peritrophic membrane is general insect knowledge and not specifically verified for the honey bee in the sources consulted.',
  [['Function', 'digestion and absorption']], refs=[R_DIG], ext=[W_IM], related=['small_intestine', 'digestive_system'])

N('bee_malpighian', 'Malpighian tubules', 'structure', 1e-3, ['bee_abdomen'],
  'Fine tubes that clean her blood: they lie in the body cavity and pour waste into the gut, where the water is mostly taken back.',
  'She has no kidneys. Instead many thin tubes float in her blood, take up waste and extra salts, and empty them into the gut at the point where midgut meets hindgut. Waste leaves with the droppings, mostly as dry uric acid so little water is lost.',
  'The tubes attach at the junction of the midgut and hindgut. Insects have between two and over a hundred, depending on the species. The model shows 22 as a sample, not a count.',
  'Insects can reclaim most of the water from their waste in the rectum. The number in the honey bee was not verified here, so the model draws a sample.',
  [['Position', 'where midgut meets hindgut'], ['Number in insects', '2 to over 100 depending on species']], refs=[R_EXC], ext=[W_IM], related=['kidney', 'bio_excretion_nitrogen'])

N('bee_hindgut', 'Hindgut and rectum', 'structure', .003, ['bee_abdomen'],
  'The last part of the gut, where water is taken back before the waste leaves.',
  'The hindgut collects what she cannot use. In the rectum most of the water is absorbed back, and the dry droppings leave through the anus. Bees prefer not to soil the hive, and can hold a great deal of waste in the rectum until a flight.',
  'The hindgut is lined with chitin. The rectum has thickened pads that absorb water; about 90% of the water in the waste can be recovered in many insects.',
  'The 90% figure is for insects in general (Insect morphology, Wikipedia), not measured for honey bees.',
  [['Function', 'water recovery and waste']], refs=[R_EXC, R_DIG], ext=[W_IM], related=['large_intestine'])

N('bee_heart', 'Dorsal vessel (the "heart")', 'structure', .01, ['bee_abdomen'],
  'A tube along the back with a chambered rear part (the heart) and a narrow front part (the aorta). It pushes blood forward into the body cavity, where it flows freely around the organs.',
  'A bee\'s blood is called haemolymph and it does not travel in closed vessels. The heart is a long tube in the back of the abdomen. It pulses, sucks blood in through small valved slits and pushes it forward through the thorax to the head, where it spills out into the body and washes slowly back around the organs. It does not carry oxygen, because bees breathe through tubes.',
  'This is an open circulatory system. A human has a closed one: blood stays inside vessels and the heart pumps it round a circuit. In a bee the haemolymph carries nutrients, waste, hormones and immune cells but not oxygen, so there is no need to circulate it quickly.',
  'The dorsal vessel has one-way valves (ostia) in its heart part and pulses peristaltically. The honey bee blood has no red blood cells. Chambers in the model are schematic.',
  [['Circulation', 'open'], ['Oxygen', 'not carried by the blood; supplied by tracheae']], refs=[R_CIRC], ext=[W_IM], related=['heart', 'bio_comparative_circulation'],
  dyk='Cut a bee\'s heart out and her muscles would still get oxygen: air goes straight to them.')

N('bee_hypopharyngeal_gland', 'Hypopharyngeal glands', 'structure', .002, ['bee_head'],
  'Two long, coiled, bead-like glands in the head of a young worker. They make the protein-rich food, part of royal jelly, with which nurse bees feed larvae.',
  'Young workers called nurse bees feed the grubs. They make a rich, milky food from glands in their heads, and feed it to larvae, the queen and the drones. When a bee gets older and turns to foraging, these glands shrink and she makes other secretions.',
  'The glands are tube-shaped organs covered with small clusters of secretory cells, which is what makes them look like strings of beads. They are important in royal jelly production and in feeding.',
  'The glands are drawn in the model as two coiled beaded strings; real glands are larger, with thousands of tiny acini, and shrink with age.',
  [['Position', 'head, in front of the brain'], ['Product', 'protein secretion fed to larvae, queens and drones']], refs=[R_DIG], ext=[BUZ], related=['salivary_glands'])

# ------------------------------------------------------------------ nervous system
N('bee_brain', 'Brain', 'structure', .0015, ['bee_head', 'bee_nerve_cord'],
  'A bee\'s brain is smaller than a sesame seed but runs flight, vision, smell, memory and the dance. It has large optic lobes and antennal lobes, and mushroom bodies for learning.',
  'The bee brain sits in the head behind her face. It is tiny but remarkably capable: bees learn flower colours and scents, remember routes, tell the time of day and communicate with a dance. Two big lumps at the sides, the optic lobes, deal with what the eyes see. Two smaller ones in front, the antennal lobes, deal with smell.',
  'Insect brains are built differently from yours. Visual and smell information are processed in dedicated lobes, then combined in the mushroom bodies, which are important for learning and memory. The brain is joined to a ventral nerve cord that runs through the body.',
  'The brain is a supraoesophageal ganglion: the gut passes through a ring of nerve tissue around the oesophagus, the other half of which is the suboesophageal ganglion. The sizes in the model are proportions, not measurements.',
  [['Position', 'head, above the oesophagus']], refs=[R_CNS], ext=[BUZ, W_WBH], parts=['bee_mushroom_bodies', 'bee_nerve_cord'], related=['brain', 'bio_brain_organization', 'neuron'])

N('bee_mushroom_bodies', 'Mushroom bodies', 'structure', 1e-3, ['bee_brain'],
  'Cup-shaped structures in the brain, two per side, where smell and sight are combined; they are central to learning and memory.',
  'These are mushroom-shaped clumps of nerve cells in the upper part of the brain. In a bee they are where she learns which flower colours and scents mean food, and where she keeps her memory of them.',
  'Each mushroom body has cups (calyces) that receive input from the senses, and stalks that carry output to lobes. They are large in bees and wasps, which is linked to their rich learning and navigation.',
  'In the model the mushroom bodies are drawn as two cups and a stalk per side, a simplified outline.',
  [['Role', 'learning and memory']], cert='C2', refs=[R_CNS], ext=[BUZ], related=['hippocampus', 'brain'])

N('bee_nerve_cord', 'Ventral nerve cord and ganglia', 'structure', .01, ['bee_brain'],
  'A chain of nerve knots (ganglia) joined by paired cords along the belly, from the head to the tip of the abdomen. Each ganglion runs the part of the body it sits in.',
  'Instead of a spinal cord along her back, as you have, a bee has a nerve cord along her belly. It has swellings, ganglia, in each region. Each controls its own legs, wings or segments with some independence, with the brain giving the orders.',
  'The first ganglion under the oesophagus, the suboesophageal ganglion, controls the mouthparts. The thoracic ganglia run legs and wings. The last abdominal ganglion runs the sting.',
  'The number of ganglia in the model is schematic: a suboesophageal, two thoracic and four abdominal ganglia are drawn.',
  [['Position', 'belly (ventral)']], refs=[R_CNS], ext=[W_IM], related=['neuron', 'spinal_cord'])

# ------------------------------------------------------------------ breathing
N('bee_tracheae', 'Tracheae (breathing tubes)', 'structure', .006, ['park_bee'],
  'A bee has no lungs. Air enters through pores in her sides and goes along branching tubes that end in fine tubules at the cells.',
  'A bee breathes through tubes. Small pores in her sides (spiracles) open to tubes that branch and branch again until the smallest touch individual cells. Oxygen goes straight from the air to the tissue, not through the blood.',
  'The tubes, called tracheae, are lined with a spiral of stiffening chitin that keeps them from collapsing. At the muscles they end in tracheoles, thin enough to push in between the cells. Large thin-walled air sacs act as bellows and as stores of air.',
  'Gas moves partly by diffusion and partly by the pumping of the abdomen. This is why insects of this size are possible: diffusion through air works over short distances. The model has a trunk on each side with branches to the legs, wings, and head.',
  [['Lungs', 'none'], ['Entry', 'spiracles']], refs=[R_GAS], ext=[W_IM], parts=['bee_spiracles', 'bee_air_sacs'], related=['trachea', 'respiratory_system', 'bio_comparative_respiration'],
  dyk='Her whole body is the lung: every muscle fibre has air delivered to it directly.')

N('bee_spiracles', 'Spiracles (breathing pores)', 'structure', 2e-4, ['bee_tracheae'],
  'Small closable pores along each side that let air into the tracheae. There are three pairs on the thorax and more on the abdomen.',
  'These are the doors to her air tubes. Each has a valve that can close it to save water. In the model, small dark rings along her sides mark them.',
  'The spiracles are on the sides of the thorax (three pairs) and the abdomen. The number on the abdomen is not given in the sources consulted here; the model shows six pairs.',
  'Closing the spiracles reduces water loss through breathing, which matters in a dry, hot day of flying.',
  [['Thoracic spiracles', '3 pairs'], ['Abdominal spiracles in the model', '6 pairs (schematic)']], refs=[R_GAS], ext=[BUZ, W_IM])

N('bee_air_sacs', 'Air sacs', 'structure', .002, ['bee_tracheae'],
  'Large, thin-walled bags of air in the abdomen, thorax and head that connect to the tracheae. They act as bellows and air stores.',
  'Some of her air tubes widen into big bags. Her abdomen squeezes and expands like a bellows, pushing air in and out. The sacs also give her a little buoyancy and take up space in the head and thorax.',
  'Unlike tracheae, air sacs have no stiffening spiral, so they collapse and re-inflate. The abdomen pumps them.',
  'The positions drawn are approximate: a pair in the abdomen, a pair behind the thorax, and head sacs.',
  [['Function', 'ventilation']], refs=[R_GAS], ext=[W_IM])

# ------------------------------------------------------------------ exoskeleton, hairs, tissue-level cards
N('bee_cuticle', 'Exoskeleton (cuticle)', 'tissue', 2e-5, ['park_bee'],
  'Her hard outer skin: layers of chitin and protein with a waxy skin on top, laid down by a single layer of living cells below.',
  'A bee\'s skeleton is on the outside. It is the skin itself, hardened. On the outside is a thin waxy skin that keeps water in. Under it is a hard layer, then a tougher layered one, all made by living cells at the bottom. To grow, an insect has to shed it; an adult bee no longer does.',
  'The outer waxy layer is the epicuticle and it has no chitin. Under it the procuticle has two parts: the hard, darkened exocuticle outside and the tougher, flexible endocuticle inside. Chitin is a polymer of N-acetylglucosamine, embedded in protein. Where the cuticle is thin and soft it forms the joints.',
  'In this picture the thicknesses of the layers are illustrative; the order is right. Click a chitin sheet and the molecule button to see its unit.',
  [['Layers (outside in)', 'epicuticle, exocuticle, endocuticle, epidermis'], ['Main polymer', 'chitin']], refs=[R_ART, R_CARB], ext=[W_IM], parts=['bee_chitin'], related=['skin', 'bio_nematodes_arthropods'])

N('bee_chitin', 'Chitin', 'molecule', 1e-9, ['bee_cuticle'],
  'A tough, fibre-forming sugar polymer: long chains of N-acetylglucosamine. It is the main structural material of insect cuticle and of fungal walls.',
  'Chitin is like cellulose but with a small nitrogen-containing group on each sugar unit. The chains line up into fibres that, with protein around them, make a material both strong and light, like the fibres in fibreglass. It is also the material of crab shells and mushroom walls.',
  'The unit that repeats along the chain is N-acetylglucosamine. The sugar rings are linked by β-1,4 bonds and the chains pack side by side held by hydrogen bonds. In cuticle the chains lie in layers whose direction rotates a little from layer to layer.',
  'Chitin: poly(β-1,4-N-acetylglucosamine). Click the molecule button to see the unit.',
  [['Unit', 'N-acetylglucosamine'], ['Found in', 'insect cuticle, crustacean shell, fungal cell wall']], refs=[R_CARB], ext=[W_IM])

N('bee_hairs', 'Body hairs', 'structure', .001, ['park_bee'],
  'Her body is covered with hairs that are themselves branched, like tiny feathers. They catch pollen, sense air movement and keep her warm.',
  'Bees are furry. The hairs are not smooth; each has side branches, which is what makes a bee such a good pollen collector: pollen grains stick and tangle in them. She grooms the pollen from her hairs with the combs on her legs and packs it into the baskets.',
  'The hairs also insulate the thorax, which must be warm to fly, and some of them are sensory, bending when air or touch moves them (general insect biology; not checked against a source here).',
  'The model draws about 3,000 hairs as a shaft with side barbs; a real bee has far more. Their position and density are approximate.',
  [['Hair type', 'branched (plumose)'], ['Model count', '≈ 3,000 (real: many more)']], refs=[R_POL, R_ART], ext=[W_WBH])

# ------------------------------------------------------------------ nectar and honey
N('bee_nectar', 'Nectar and its sugars', 'substance', 1e-9, ['bee_crop', 'bee_honey'],
  'The sweet liquid flowers make to pay bees. It is about 80 percent water with sugars, mainly sucrose, glucose and fructose.',
  'Nectar is sugar water. A flower makes it so that bees will visit and carry pollen. For the bee it is fuel: sugar for her flight muscles.',
  'The main sugars are sucrose (table sugar, made of one glucose and one fructose joined) and the two simple sugars glucose and fructose. The bee adds an enzyme that splits sucrose into glucose and fructose.',
  'Nectar is nearly 80% water (Western honey bee, Wikipedia). The proportions of the sugars vary from plant to plant.',
  [['Water', '≈ 80%'], ['Main sugars', 'sucrose, glucose, fructose']], refs=[R_CARB], ext=[W_WBH])

N('bee_honey', 'How nectar becomes honey', 'process', .001, ['park_bee'],
  'Workers dry nectar from about 80 percent water to under 20 percent, and add enzymes that split its sugars; the thick result is capped in wax.',
  'A forager brings nectar home in her crop and hands it to a house bee. The house bees pass it mouth to mouth for around half an hour, adding enzymes. They then spread it in the wax cells, fan it with their wings to drive off water, and cap the cells with wax when it is thick.',
  'The enzymes split sucrose into glucose and fructose. Evaporation drops the water content from about 80% in nectar to under 20% in honey, which is thick enough that microbes cannot grow in it.',
  'Digestion of nectar takes about 30 minutes and drying brings the water to under 20% (Western honey bee, Wikipedia). Honey is stored energy for the colony: in temperate climates a colony eats 15 to 50 kg through the winter (Honey bee, Wikipedia).',
  [['Nectar water', '≈ 80%'], ['Honey water', '< 20%'], ['Winter honey eaten', '≈ 15 to 50 kg (temperate)']], refs=[R_CARB], ext=[W_WBH, W_HB], parts=['bee_nectar', 'bee_crop'])

# ------------------------------------------------------------------ behaviour and colony
N('bee_vision', 'What a bee sees', 'process', .0024, ['park_bee'],
  'Bees see three colours, as people do, but a different three: ultraviolet, blue and green. They do not see red as a colour.',
  'A bee sees a flower differently from you. Many flowers have patterns that reflect ultraviolet light, which is invisible to us, and which act as landing guides for bees. Bees do not have a receptor for red, so a plain red flower looks dark to them. Their world is coarse and quick: about 5,000 separate patches per eye.',
  'The three receptor types peak at about 344 nm (ultraviolet), 436 nm (blue) and 544 nm (green) (some papers give 556 nm). Her ocelli add a measure of the brightness of the sky. Compared with a human eye, hers has no single lens and focuses nothing: the ommatidia point in slightly different directions and each reports one patch.',
  'The bee\'s three colour channels support trichromatic colour vision with properties similar to human colour vision. Human vision uses a different set, so the colours a bee distinguishes are not the colours we see.',
  [['Receptor peaks', '≈ 344, 436, 544 nm'], ['Red', 'no red receptor']], cert='C1', refs=[R_VIS], ext=[MEN, STR], parts=['bee_compound_eye', 'bee_ocelli'], related=['vision', 'bio_vision_photoreception'])

N('bee_waggle_dance', 'The waggle dance', 'process', .1, ['park_bee'],
  'A forager that has found a good patch of flowers dances on the comb in the dark: the angle of her waggle run shows the direction, and its length shows the distance.',
  'Back in the hive a bee that has found food can tell her sisters where. She walks a straight line while shaking her abdomen from side to side (the waggle run), then loops back and repeats. The angle of the run from straight up on the comb is the angle between the food and the sun, and a longer waggle means a farther place. Nearby sisters follow her closely, smell the flower scent on her and fly off.',
  'A run straight up the comb means "toward the sun". A run 45° to the right means 45° to the right of the sun. For food close to the hive a bee may dance a simple round dance with no direction. This was decoded by Karl von Frisch.',
  'Not every follower uses the information: in one study, 93% of foragers that closely followed a dance ignored its direction and location and returned to a patch they already knew. In another, displaced bees followed the path to a feeder as the dance told them.',
  [['Angle of the run from vertical', 'angle between food and sun'], ['Length of waggle', 'distance to food'], ['Round dance', 'food close to the hive']], cert='C2', refs=[R_BEH], ext=[W_WD, W_WBH],
  dyk='She keeps adjusting the angle as the sun moves across the sky, so her dance stays right all day.',
  openq=['How much of the dance information followers really use, and how they decode it in the dark, is still studied.'])
NODES[-1]['did_you_know'] = 'The dance is performed in the dark on a vertical comb, so "up" stands for "toward the sun".'

N('bee_colony', 'The colony', 'structure', .5, ['park_bee'],
  'A colony is one queen, some hundreds of males in season, and tens of thousands of sister workers living as one.',
  'No bee lives alone. A healthy hive in midsummer may hold 40,000 to 80,000 bees, nearly all of them workers. They share the nest, the young, the honey and the work: cleaning, nursing, building, guarding, foraging.',
  'The queen lays up to 2,000 eggs a day in the season. A worker takes 21 days from egg to adult, a drone 24, a queen 16. The workers regulate the hive\'s temperature: in winter they cluster, with the centre about 27 °C at the start of winter and the edge about 8 to 9 °C.',
  'Workers are replaced about every four months, as about 1% die naturally each day. Numbers are for the western honey bee in temperate climates.',
  [['Midsummer population', '≈ 40,000 to 80,000'], ['Queen egg laying', 'up to ≈ 2,000 eggs a day'], ['Worker development', '21 days'], ['Winter cluster', 'centre ≈ 27 °C, edge ≈ 8 to 9 °C']], refs=[R_BEH], ext=[W_WBH, W_HB], parts=['bee_lifespan'], related=['bio_learning_social_behavior', 'bio_pollination_networks'])

N('bee_lifespan', 'A worker\'s life', 'process', .014, ['bee_colony'],
  'A summer worker lives a few weeks; a worker born in autumn can live several months to carry the colony through winter.',
  'A summer worker wears herself out. Workers born in spring and summer live only a few weeks, flying more and more as they age. Workers born in autumn do little flying, stay in the warm cluster and live for several months, until spring.',
  'A worker begins adult life inside the hive, cleaning cells and feeding larvae, then builds comb, then guards, and only in her last weeks forages. About 1% of workers die naturally each day, and the whole set of workers is replaced about every four months.',
  'The figure "a few weeks" is the qualitative statement from the source consulted; precise values vary with the season, the race, and the workload.',
  [['Spring and summer worker', 'a few weeks'], ['Autumn worker', 'several months'], ['Daily natural loss', '≈ 1%']], cert='C1', refs=[R_BEH], ext=[W_WBH])

# ------------------------------------------------------------------ figures
F = {}
def blocks(nodes, edges, caption, flow=True):
    return {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'color': c} if c else {})} for i, l, x, y, c in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'flow': flow, 'caption': caption}
def bars(rows, ylabel, caption, logy=False):
    return {'type': 'bars', 'bars': [{'label': a, 'value': b} for a, b in rows], 'ylabel': ylabel, 'logy': logy, 'caption': caption}

F['park_bee'] = bars([('facet width', 25.2), ('ocellus', 300), ('eye length', 2400), ('forewing', 9700), ('body (model)', 14000)], 'micrometres', 'Sizes on a honey bee worker, in micrometres, on a log scale: facet width, ocellus and eye length from Streinzer and colleagues (2013), forewing length 9.7 mm, body about 14 mm.', True)
F['bee_head'] = blocks([('e', 'Eyes and ocelli: light', 15, 20, None), ('a', 'Antennae: smell, taste, touch', 15, 50, None), ('m', 'Jaws and tongue: feeding, wax', 15, 80, None), ('b', 'Brain: decides', 60, 50, 'orange'), ('g', 'Glands: food for the young', 85, 80, None)], [('e', 'b', None), ('a', 'b', None), ('b', 'm', None), ('g', 'm', None)], 'What the head does: sensors on the outside feed the brain, which drives the mouthparts; the glands make food for larvae.', False)
F['bee_compound_eye'] = bars([('queen', 4460), ('worker', 5375), ('drone', 9993)], 'ommatidia per eye', 'Ommatidia per eye in Apis mellifera (Streinzer et al. 2013, Table 1): worker 5,375, drone 9,993 (the queen figure is from a search summary of the same table).')
F['bee_facet'] = {'type': 'plot', 'x': [0, 3], 'y': [0, 130], 'params': [{'id': 'd', 'label': 'eye length', 'min': 1, 'max': 3, 'value': 2.4, 'step': .1, 'unit': 'mm'}], 'fns': [{'f': 'x*1000/25.2', 'label': 'facets that fit along a length x (mm)'}], 'vlines': [{'x': 'd', 'label': 'eye length'}], 'readouts': [{'label': 'Facets along the eye if packed side by side', 'value': 'd*1000/25.2', 'unit': 'facets'}], 'xlabel': 'length (mm)', 'ylabel': 'facets of 25.2 µm', 'caption': 'Arithmetic: with facets 25.2 µm wide, about 95 would fit end to end along the 2.4 mm eye (the real count along any line is a little different because of the hexagonal packing and the curve).'}
F['bee_ommatidium'] = blocks([('l', 'Lens', 50, 12, None), ('c', 'Crystalline cone', 50, 38, None), ('r', 'Light-sensing cells and rhabdom', 50, 64, 'orange'), ('n', 'Nerve fibre to brain', 50, 90, None)], [('l', 'c', 'light in'), ('c', 'r', None), ('r', 'n', 'signal out')], 'One ommatidium: light enters a lens, is guided down a cone to a bundle of light-sensing cells, and a nerve fibre carries the signal away.')
F['bee_photoreceptor'] = {'type': 'plot', 'x': [300, 650], 'y': [0, 1.1], 'fns': [{'f': 'exp(-((x-344)/45)^2)', 'label': 'ultraviolet receptor (peak 344 nm)'}, {'f': 'exp(-((x-436)/55)^2)', 'label': 'blue receptor (peak 436 nm)'}, {'f': 'exp(-((x-544)/70)^2)', 'label': 'green receptor (peak 544 nm)'}], 'xlabel': 'wavelength (nm)', 'ylabel': 'relative sensitivity', 'caption': 'Schematic bell curves centred on the measured peaks of the three honey bee receptors (344, 436 and about 544 nm; Hempel de Ibarra and colleagues 2014). The widths are drawn by eye; real curves are not symmetric.'}
F['bee_rhabdom'] = blocks([('p', 'Photon of light', 15, 50, None), ('o', 'Opsin with retinal', 50, 50, 'orange'), ('s', 'Shape change: signal starts', 85, 50, 'green')], [('p', 'o', None), ('o', 's', None)], 'The first step of seeing: a photon changes the shape of retinal inside the opsin protein, and that starts a nerve signal.', False)
F['bee_ocelli'] = bars([('median ocellus', .30), ('lateral ocellus', .28), ('one facet', .0252)], 'millimetres', 'Ocelli are about 0.3 mm across: about twelve times the width of one facet (25.2 µm), still smaller than a grain of sand.')
F['bee_antenna'] = blocks([('s', 'Scape: long, swings in the socket', 15, 20, None), ('p', 'Pedicel: short, senses movement', 50, 50, None), ('f', 'Flagellum: 10 segments, many smell sensors', 85, 80, 'orange')], [('s', 'p', None), ('p', 'f', None)], 'A worker antenna: three named parts, 12 segments in all.', False)
F['bee_mandibles'] = blocks([('m', 'Muscles in the head', 15, 50, None), ('j', 'Jaws open and close sideways', 50, 50, None), ('w', 'Wax, pollen, grooming, defence', 85, 50, 'green')], [('m', 'j', None), ('j', 'w', None)], 'Jaws are tools: muscles in the head drive them to work wax and handle things.', False)
F['bee_proboscis'] = bars([('proboscis, Egyptian bees', 5.69), ('proboscis, Himalayan bees (mean)', 6.29), ('shown extended in the model', 3.9)], 'millimetres', 'Proboscis length in two studies (5.69 mm and 6.29 mm) and the 3.9 mm shown partly extended in the model.')
F['bee_thorax'] = blocks([('p', 'Prothorax: front legs', 15, 25, None), ('m', 'Mesothorax: forewings, middle legs', 50, 50, 'orange'), ('t', 'Metathorax: hindwings, hind legs', 85, 75, None)], [('p', 'm', None), ('m', 't', None)], 'The thorax has three segments; the middle two are fused into a rigid flight box.', False)
F['bee_wings'] = bars([('forewing length', 9.7), ('body length (model)', 14), ('hind tibia (model)', 2.9)], 'millimetres', 'The forewing is about 9.7 mm long; the body about 14 mm (model); the hind tibia 2.9 mm (measured range 2.7 to 3.0 mm).')
F['bee_hamuli'] = blocks([('h', 'Hindwing hooks (hamuli)', 15, 50, None), ('f', 'Fold on rear edge of forewing', 50, 50, None), ('w', 'One wide wing: both beat together', 85, 50, 'green')], [('h', 'f', 'catch'), ('f', 'w', None)], 'In flight the hooks on the hindwing catch the fold of the forewing; at rest they let go and the wings fold.', False)
F['bee_wing_hinge'] = blocks([('m', 'Thorax squeezed by muscles', 15, 50, None), ('h', 'Hinge plates and elastic cuticle', 50, 50, 'orange'), ('w', 'Wing stroke', 85, 50, None)], [('m', 'h', None), ('h', 'w', 'small motion, big stroke')], 'The wing hinge turns a small deformation of the thorax into a large wing stroke.')
F['bee_flight'] = {'type': 'plot', 'x': [100, 300], 'y': [0, 12], 'params': [{'id': 'A', 'label': 'stroke amplitude', 'min': 60, 'max': 120, 'value': 90, 'step': 5, 'unit': '°'}], 'fns': [{'f': '2*0.0097*(A*pi/180)*x', 'label': 'average wing-tip speed (m/s)'}], 'vlines': [{'x': 230, 'label': '≈ 230 Hz'}], 'readouts': [{'label': 'Average tip speed at 230 Hz', 'value': '2*0.0097*(A*pi/180)*230', 'unit': 'm/s'}], 'xlabel': 'wingbeat frequency (Hz)', 'ylabel': 'average wing-tip speed (m/s)', 'caption': 'Arithmetic on sourced values: a wing 9.7 mm long, swept through an angle A twice per beat, at 230 beats per second, has an average tip speed of about 7 m/s at 90°. It is a calculation, not a measurement.'}
F['bee_flight_muscles'] = blocks([('d', 'Up-and-down muscles shorten: roof pulled down', 15, 25, None), ('u', 'Wings flip up', 15, 75, 'green'), ('l', 'Front-to-back muscles shorten: roof bows up', 85, 25, None), ('w', 'Wings flip down', 85, 75, 'green')], [('d', 'u', None), ('l', 'w', None), ('u', 'l', 'stretch triggers the next'), ('w', 'd', 'stretch triggers the next')], 'Two sets of muscles take turns on the thorax box; each one stretches the other and triggers its contraction.')
F['bee_flight_fibre'] = blocks([('n', 'Nerve impulse', 15, 50, None), ('c', 'Calcium released', 50, 50, None), ('s', 'Filaments slide: fibre shortens', 85, 50, 'orange')], [('n', 'c', None), ('c', 's', None)], 'Sliding filaments: the same machine as in human muscle, tuned for speed.', False)
F['bee_mitochondria'] = blocks([('s', 'Sugar from the crop', 15, 20, None), ('o', 'Oxygen from the air tubes', 15, 80, 'blue'), ('m', 'Mitochondrion', 55, 50, 'orange'), ('a', 'ATP: fuel for the muscle', 90, 50, 'green')], [('s', 'm', None), ('o', 'm', None), ('m', 'a', None)], 'Mitochondria burn sugar with oxygen to make ATP; in flight muscle the oxygen arrives through air tubes.')
F['bee_other_muscles'] = blocks([('m', 'Muscles inside the skeleton', 20, 50, None), ('p', 'Pull on the inner side of the cuticle', 55, 50, None), ('j', 'Joint bends', 90, 50, 'green')], [('m', 'p', None), ('p', 'j', None)], 'An arthropod muscle works from inside the skeleton, pulling on the inner side of the cuticle.', False)
F['bee_leg'] = blocks([('c', 'Coxa (hip)', 10, 20, None), ('t', 'Trochanter', 30, 35, None), ('f', 'Femur (thigh)', 50, 50, None), ('b', 'Tibia (shin)', 70, 65, None), ('a', 'Tarsus and pretarsus (foot)', 90, 80, 'orange')], [('c', 't', None), ('t', 'f', None), ('f', 'b', None), ('b', 'a', None)], 'The six named parts of every insect leg, from hip to claws.', False)
F['bee_foot'] = blocks([('t', 'Tarsal segments (taste and feel)', 20, 30, None), ('c', 'Two claws: grip rough surfaces', 20, 70, None), ('p', 'Sticky pad: grips smooth surfaces', 80, 50, 'orange')], [('t', 'p', None), ('c', 'p', None)], 'The foot has two ways to hold on.', False)
F['bee_pollen_basket'] = blocks([('c', 'Combs brush pollen from hairs', 15, 25, None), ('p', 'Press squeezes it up', 50, 50, None), ('b', 'Basket holds the pellet', 85, 75, 'orange')], [('c', 'p', None), ('p', 'b', None)], 'Pollen moves from body to comb to press to basket.')
F['bee_pollen_load'] = bars([('pollen eaten by an adult worker per day (low)', 3.4), ('pollen eaten per day (high)', 4.3), ('sugar needed per day', 4)], 'milligrams per day', 'An adult worker eats about 3.4 to 4.3 mg of pollen and needs about 4 mg of sugar per day (Honey bee, Wikipedia).')
F['bee_antenna_cleaner'] = blocks([('a', 'Antenna drawn through the notch', 20, 50, None), ('b', 'Bristles comb off dirt', 55, 50, None), ('c', 'Clean antenna: better smell', 90, 50, 'green')], [('a', 'b', None), ('b', 'c', None)], 'How the foreleg cleans an antenna.', False)
F['bee_abdomen'] = blocks([('c', 'Crop: carries nectar', 20, 20, None), ('m', 'Midgut: digests', 55, 20, None), ('h', 'Heart: moves blood', 20, 55, 'orange'), ('w', 'Wax glands, underneath', 55, 55, None), ('s', 'Sting, at the tip', 90, 80, None)], [('c', 'm', None), ('m', 's', None)], 'What the abdomen holds, roughly from front to back.', False)
F['bee_wax_glands'] = blocks([('h', 'Honey and pollen eaten', 15, 50, None), ('g', 'Wax glands make wax', 50, 50, 'orange'), ('f', 'Flakes on the underside', 70, 50, None), ('c', 'Chewed into comb', 90, 50, 'green')], [('h', 'g', None), ('g', 'f', None), ('f', 'c', None)], 'From food to comb.', False)
F['bee_nasonov'] = blocks([('g', 'Nasonov gland on the back', 15, 50, 'orange'), ('s', 'Scent fanned by wings', 50, 50, None), ('b', 'Other bees follow it', 85, 50, 'green')], [('g', 's', None), ('s', 'b', None)], 'A scent beacon: swarm, hive entrance, water.', False)
F['bee_sting'] = blocks([('b', 'Barbs catch in mammal skin', 15, 20, None), ('p', 'Bee pulls away: sting, sac and part of abdomen tear free', 50, 50, None), ('v', 'Sting keeps pumping venom', 85, 50, 'orange'), ('a', 'Alarm pheromone alerts nestmates', 85, 85, None)], [('b', 'p', None), ('p', 'v', None), ('p', 'a', None)], 'Why a worker dies after stinging a mammal: the barbed sting stays behind and keeps working.')
F['bee_venom_sac'] = blocks([('g', 'Venom gland', 15, 50, None), ('s', 'Venom sac stores it', 50, 50, 'orange'), ('n', 'Pumped through the sting', 85, 50, None)], [('g', 's', None), ('s', 'n', None)], 'Venom: made, stored, pumped.', False)
F['bee_ovaries'] = bars([('worker ovaries (reduced)', 1), ('queen ovaries (large)', 10)], 'relative size (schematic)', 'Schematic: a worker\'s ovaries are small and a queen\'s large. The numbers are only a code for "small" and "large", not measurements.')
F['bee_oesophagus'] = blocks([('m', 'Mouth', 15, 50, None), ('t', 'Oesophagus through thorax', 50, 50, None), ('c', 'Crop', 85, 50, 'orange')], [('m', 't', None), ('t', 'c', None)], 'The path of nectar from the mouth to the honey stomach.')
F['bee_crop'] = bars([('nectar carried in the crop', 75), ('daily sugar need of an adult', 4)], 'milligrams', 'One crop holds about 75 mg of nectar, many times an adult worker\'s daily sugar need (about 4 mg).')
F['bee_proventriculus'] = blocks([('c', 'Crop: nectar for the colony', 15, 30, 'orange'), ('v', 'Proventriculus: valve', 50, 50, None), ('m', 'Midgut: her own food', 85, 70, None)], [('c', 'v', None), ('v', 'm', 'a little, when she needs fuel')], 'A valve decides whether nectar stays cargo or becomes her food.', False)
F['bee_midgut'] = blocks([('f', 'Food and enzymes', 15, 50, None), ('d', 'Digestion', 50, 50, None), ('a', 'Absorption into the blood', 85, 50, 'green')], [('f', 'd', None), ('d', 'a', None)], 'Digestion and absorption happen in the midgut.')
F['bee_malpighian'] = blocks([('b', 'Waste in the blood', 15, 50, None), ('m', 'Malpighian tubules', 50, 50, 'orange'), ('g', 'Hindgut: water taken back', 85, 50, None)], [('b', 'm', 'taken up'), ('m', 'g', 'emptied')], 'Her kidney substitute: tubes in the blood that empty into the gut.')
F['bee_hindgut'] = blocks([('w', 'Waste from tubules and midgut', 15, 50, None), ('r', 'Rectum: water reabsorbed', 50, 50, 'blue'), ('d', 'Dry droppings leave', 85, 50, None)], [('w', 'r', None), ('r', 'd', None)], 'The last stage: water is saved.')
F['bee_heart'] = blocks([('h', 'Heart (abdomen): pulses', 15, 70, 'orange'), ('a', 'Aorta through thorax', 50, 40, None), ('b', 'Head: blood spills out', 85, 20, None), ('o', 'Body cavity: blood washes organs', 50, 90, 'blue')], [('h', 'a', 'forward'), ('a', 'b', None), ('b', 'o', None), ('o', 'h', 'back in through slits')], 'An open circulation: the blood is pumped forward, then flows freely back among the organs and re-enters the heart through valved slits.')
F['bee_hypopharyngeal_gland'] = blocks([('p', 'Pollen and honey eaten by a nurse', 15, 50, None), ('g', 'Hypopharyngeal glands', 50, 50, 'orange'), ('f', 'Food for larvae and queen', 85, 50, 'green')], [('p', 'g', None), ('g', 'f', None)], 'A nurse bee turns pollen and honey into larval food in her head.')
F['bee_brain'] = blocks([('o', 'Optic lobes: sight', 15, 30, None), ('a', 'Antennal lobes: smell', 15, 70, None), ('m', 'Mushroom bodies: learning', 55, 50, 'orange'), ('c', 'Motor output: flight, legs, dance', 90, 50, 'green')], [('o', 'm', None), ('a', 'm', None), ('m', 'c', None)], 'How the brain\'s parts work together.')
F['bee_mushroom_bodies'] = blocks([('s', 'Sight and smell arrive at the cups', 15, 50, None), ('m', 'Mushroom body: association', 50, 50, 'orange'), ('l', 'Memory: this colour or scent means food', 85, 50, 'green')], [('s', 'm', None), ('m', 'l', None)], 'Associative learning is the job of the mushroom bodies.', False)
F['bee_nerve_cord'] = blocks([('b', 'Brain', 15, 50, None), ('s', 'Suboesophageal ganglion: mouthparts', 35, 50, None), ('t', 'Thoracic ganglia: legs, wings', 60, 50, None), ('a', 'Abdominal ganglia: segments and sting', 85, 50, None)], [('b', 's', None), ('s', 't', None), ('t', 'a', None)], 'The chain of ganglia from head to sting.', False)
F['bee_tracheae'] = blocks([('s', 'Spiracle opens', 15, 50, None), ('t', 'Tracheae branch', 40, 50, 'blue'), ('l', 'Tracheoles reach the muscle cells', 65, 50, None), ('o', 'Oxygen goes straight into cells', 90, 50, 'green')], [('s', 't', 'air in'), ('t', 'l', None), ('l', 'o', None)], 'No lungs: air is piped to the cells.')
F['bee_spiracles'] = bars([('thoracic pairs', 3), ('abdominal pairs drawn in the model', 6)], 'pairs', 'Three pairs of spiracles are on the thorax (Buzz About Bees); the model shows six on the abdomen as a schematic, the real number was not confirmed.')
F['bee_air_sacs'] = blocks([('a', 'Abdomen squeezes', 15, 50, None), ('s', 'Air sacs: bellows', 50, 50, 'blue'), ('t', 'Air pushed through the tubes', 85, 50, None)], [('a', 's', None), ('s', 't', None)], 'Air sacs act as bellows.', False)
F['bee_cuticle'] = blocks([('e', 'Epicuticle: wax, no chitin', 50, 10, None), ('x', 'Exocuticle: hard', 50, 35, 'orange'), ('n', 'Endocuticle: layered chitin', 50, 60, None), ('d', 'Epidermis: living cells', 50, 85, 'green')], [('d', 'n', 'builds'), ('d', 'x', None), ('d', 'e', None)], 'Layers of the exoskeleton, from outside to the cells that make it.', False)
F['bee_chitin'] = blocks([('g', 'Glucose', 15, 25, None), ('n', 'N-acetylglucosamine', 50, 50, 'orange'), ('c', 'Chitin chain', 85, 75, None)], [('g', 'n', 'modified'), ('n', 'c', 'joined end to end')], 'Chitin is a chain of N-acetylglucosamine units.')
F['bee_hairs'] = blocks([('h', 'Branched hair', 15, 50, None), ('p', 'Catches pollen', 50, 25, 'orange'), ('w', 'Keeps thorax warm', 50, 75, None), ('s', 'Senses air and touch', 85, 50, None)], [('h', 'p', None), ('h', 'w', None), ('h', 's', None)], 'Branched hairs do several jobs.', False)
F['bee_nectar'] = bars([('water', 80), ('sugars and the rest', 20)], 'percent of nectar (about)', 'Nectar is nearly 80% water (Western honey bee, Wikipedia).')
F['bee_honey'] = bars([('nectar: water content', 80), ('honey: water content (below)', 20)], 'percent water', 'Honey is dried below 20% water; nectar starts at about 80% (Western honey bee, Wikipedia).')
F['bee_vision'] = F['bee_photoreceptor'].copy(); F['bee_vision']['caption'] = 'The three colour channels of a honey bee: ultraviolet, blue and green. There is no receptor for red. The curves are schematic bell shapes centred on the measured peaks.'
F['bee_waggle_dance'] = {'type': 'plot', 'x': [0, 180], 'y': [-180, 180], 'params': [{'id': 'a', 'label': 'angle of the food from the sun', 'min': -90, 'max': 90, 'value': 45, 'step': 5, 'unit': '°'}], 'fns': [{'f': 'a', 'label': 'angle of the waggle run from straight up (°)'}], 'readouts': [{'label': 'Waggle run from vertical', 'value': 'a', 'unit': '°, right if positive'}], 'xlabel': 'time (arbitrary)', 'ylabel': 'angle (°)', 'caption': 'The rule: the waggle run is tilted from vertical by the same angle as the food is from the sun. 45° right of the sun gives a run 45° right of up.'}
F['bee_colony'] = bars([('midsummer colony (low)', 40000), ('midsummer colony (high)', 80000), ('workers in a large hive (Wikipedia: "as many as")', 60000)], 'bees', 'Colony sizes quoted in two sources: 40,000 to 80,000 in midsummer; "as many as 60,000" workers.')
F['bee_lifespan'] = blocks([('h', 'In the hive: clean, nurse', 15, 25, None), ('b', 'Build comb, guard', 50, 50, None), ('f', 'Forage: the last weeks', 85, 75, 'orange'), ('w', 'Autumn workers: stay warm, live months', 50, 90, 'blue')], [('h', 'b', None), ('b', 'f', None)], 'Jobs change with age; autumn workers live much longer than summer ones.')
F['bee_wing_note'] = None
F.pop('bee_wing_note')
F['bee_compound_eye']['caption'] = F['bee_compound_eye']['caption']
for n in NODES:
    if n['id'] not in F: print('no figure for', n['id'])
os.makedirs('data/nodes', exist_ok=True)
json.dump(NODES, open('data/nodes/park_bee.json', 'w'), indent=1, ensure_ascii=False)
json.dump(F, open('data/viz/park_bee.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'nodes,', len(F), 'figures')
