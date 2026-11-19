# Cards C: the common earthworm (Lumbricus terrestris): whole animal, outside, inside, movement, and what earthworms do (Darwin).
from soil_lib import *

WORM_PARTS = ['soil_worm_head', 'soil_worm_segments', 'soil_worm_clitellum', 'soil_worm_setae', 'soil_worm_burrow', 'soil_worm_cast', 'soil_worm_circular', 'soil_worm_longitudinal', 'soil_worm_coelom',
              'soil_worm_pharynx', 'soil_worm_oesophagus', 'soil_worm_crop', 'soil_worm_gizzard', 'soil_worm_intestine', 'soil_worm_vessels', 'soil_worm_hearts', 'soil_worm_nerve', 'soil_worm_brain', 'soil_worm_movement']
MN = 'The earthworm is a 170 mm adult drawn from typical measurements; every internal part is simplified and its positions along the body are approximate.'

N('soil_earthworm', 'Common earthworm (Lumbricus terrestris)', 'organism', 0.17, ['soil_block', 'bio_lophotrochozoans'],
  "The common earthworm is a segmented animal that lives in a deep vertical burrow, comes to the surface to feed, and swallows soil and leaves; here it is drawn at true size with its insides.",
  "This is the earthworm of lawns and gardens, also called the nightcrawler. A grown one is about 11 to 20 centimetres long, about the width of a pencil, and made of well over a hundred rings called segments. It has no eyes, no legs and no jaws. It lives in a permanent burrow that runs straight down into the subsoil, with a little heap of earth, a cast, at the entrance. It crawls up to pull leaves down and eat them, and swallows soil as it burrows. It breathes through its skin, which is why it needs moist soil. Click 'Open the earthworm' to see inside: a gut that runs from end to end, five pairs of hearts, a nerve cord, and two layers of muscle.",
  "Lumbricus terrestris is generally 110 to 200 millimetres long (90 to 300 mm when mature), 7 to 10 millimetres wide, with around 120 to 170 segments, often 135 to 150. It is an annelid, a segmented worm. The body is a tube within a tube: an outer body wall (cuticle and skin, circular muscle, longitudinal muscle) around a fluid-filled cavity, the coelom, which contains the gut, the blood vessels and the nerve cord. The fluid works as a hydrostatic skeleton. The animal is hermaphroditic but mates with another worm, and it normally and regularly mates at the surface. Natural lifespan is not known; some have lived six years in captivity. Earthworms make casts of mixed organic and mineral material on the surface, and Lumbricus makes permanent, deep, vertical burrows.",
  "The model draws 150 segments, a 170 mm body of 8 mm diameter, a head lobe without eyes, a swollen clitellum toward the front, eight bristles on each segment but the first, a dorsal and a ventral blood vessel, five pairs of hearts, a ventral nerve cord with a swelling in each segment, and a gut with pharynx, oesophagus and its lime glands, crop, gizzard and intestine. Not drawn: the septa between segments, the typhlosole, the nephridia (excretory tubes), the reproductive organs, and the other blood vessels. The thickness of each body-wall layer is illustrative. " + MN,
  [('Length', '110 to 200 mm usually; 90 to 300 mm when mature (model: 170 mm)'), ('Width', '7 to 10 mm (model: 8 mm)'), ('Segments', '≈ 120 to 170, often 135 to 150 (model: 150)'), ('Hearts', 'five pairs'), ('Eyes', 'none'), ('Burrow', 'permanent, vertical; usually down to 50 cm, deeper in places')],
  'C1', [R_ANN], [W_LT, W_EW, LANDER, UBC, BIOT, DARWIN], parts=WORM_PARTS, related=['soil_darwin', 'soil_decomposition', 'bio_lophotrochozoans', 'heart', 'spinal_cord'],
  dyk="Charles Darwin published a whole book about earthworms in 1881, The Formation of Vegetable Mould through the Action of Worms, and called worms animals that have played an important part in the history of the world.",
  fig=bars([('woodlouse (15 mm)', 15), ('Lumbricus: shortest usual (110 mm)', 110), ('Lumbricus: model (170 mm)', 170), ('Lumbricus: longest usual (200 mm)', 200), ('burrow depth: usual limit (500 mm)', 500)], 'millimetres', 'The earthworm of the block against the usual range of the species and a woodlouse. Burrows reach 50 cm usually and sometimes much deeper.'))

N('soil_worm_head', 'Earthworm: head lobe and mouth', 'structure', 0.003, ['soil_earthworm'],
  "At the front of the earthworm is a small lobe over the mouth; the worm has no eyes, no teeth and no jaws, but the front end is its most sensitive part.",
  "The front of the earthworm ends in a small rounded lobe that hangs over the mouth. The worm uses it to grip leaves and to feel its way. It has no eyes, but the front end is the most sensitive part of the body. It has no jaws or teeth of any kind; it pulls food in with its muscular pharynx and grinds it later inside.",
  "Darwin described the lobe (lip) as used for prehension, and the pharynx behind the mouth as pushed forward when the animal eats. The nerve ring around the pharynx, with the brain on top of it, lies just behind the lobe.",
  "The lobe is drawn as an ellipsoid 5 mm wide, simplified; the first true segment, the peristomium, lies behind it.",
  [('Eyes', 'none'), ('Jaws or teeth', 'none (Darwin)'), ('Used for', 'gripping food and sensing')],
  'C1', [R_ANN], [DARWIN, BIOT], related=['soil_worm_pharynx', 'soil_worm_brain'])

N('soil_worm_segments', 'Earthworm: body rings (segments) and skin', 'structure', 0.17, ['soil_earthworm'],
  "The body is a row of about 150 nearly identical rings, or segments, covered with a thin moist skin through which the worm breathes.",
  "Look closely and the worm is made of rings separated by shallow grooves. Each ring is a segment. A worm has the same number of segments all its life: it grows by making the segments larger, not by adding more. The skin is thin, covered with mucus and always moist; the worm breathes through it, so it cannot live in dry air, and it dries out and dies if it is left on dry pavement. Underneath the skin lie the layers of muscle. The rings go all the way along, from the head lobe to the tail point, which is why the animal is so flexible.",
  "A large worm has 100 to 200 almost cylindrical segments (Darwin), around 120 to 170 in Lumbricus terrestris (often 135 to 150). Respiration is cutaneous, through the moist skin and its capillaries. Earthworms have no means of limiting water loss; Lumbricus can tolerate a water loss of up to 70 % of its body weight. Most segments carry bristles and a pair of excretory tubes (nephridia).",
  "Colours are a drawing choice: darker above, paler underneath. The body is drawn with a circular cross-section and gentle taper; the tail end is blunter in real worms and the cross-section can be flattened. The skin scene shows a section of the body wall (1.8 mm field of view).",
  [('Segments', '≈ 120 to 170 (model: 150)'), ('Grows by', 'enlarging existing segments'), ('Breathes through', 'moist skin'), ('Can lose', 'up to 70 % of body weight in water and survive')],
  'C1', [R_ANN], [W_LT, W_EW, UBC, DARWIN, LANDER], parts=['soil_worm_circular', 'soil_worm_longitudinal'], related=['bio_lophotrochozoans', 'skin'])

N('soil_worm_clitellum', 'Earthworm: the clitellum (the saddle)', 'structure', 0.008, ['soil_earthworm'],
  "The clitellum is the swollen, paler band toward the front of an adult earthworm; it makes the cocoon in which the eggs are laid.",
  "Adult earthworms have a smooth, thick band round the body toward the front: the saddle, or clitellum. It is seen only when the worm is sexually mature, and it turns orange when the worm is ready to mate. Gland cells in the band make the cocoon, in which the eggs are stored. Worms are both male and female at once, but they still pair up with another worm and swap sperm.",
  "The clitellum is a glandular section of the body wall found in earthworms and leeches and gives the group its name, the clitellates. It secretes a viscous fluid that forms the cocoon (and in many earthworms an albumin that nourishes the eggs). Lumbricus mates at the surface. Which segments the clitellum covers differs between species and is used to tell them apart.",
  "The clitellum is drawn as a band 9 mm long a little over a fifth of the way back from the head, with a slightly larger diameter and a paler orange-pink colour. Its exact position and extent in the model are approximate.",
  [('Seen when', 'worm is sexually mature'), ('Colour', 'orange when ready to mate'), ('Makes', 'the cocoon in which eggs are stored'), ('Mating', 'worms are hermaphrodites but pair up; Lumbricus mates at the surface')],
  'C1', [R_ANN, R('43.1', '43-1-reproduction-methods')], [W_CLIT, UBC, BIOT], related=['bio_lophotrochozoans'])

N('soil_worm_setae', 'Earthworm: bristles (setae)', 'structure', 0.0005, ['soil_earthworm', 'soil_worm_segments'],
  "Each segment except the first carries eight tiny bristles, in four pairs, that the worm sticks into the soil as anchors.",
  "On the underside and sides of every ring (except the very first) there are eight small bristles. A worm can poke them out and dig them into the burrow wall. They are the worm's grip: when the front of the worm stretches forward, the bristles of the back part hold on so that the worm is pulled forward and not just slid back.",
  "Each segment (except the first) bears eight chaetae in four pairs, two on each side, named a to d from the underside to the top. In crawling, shortened parts of the body are anchored by the bristles while other parts lengthen.",
  "The 1,168 bristles are drawn 0.5 mm long, three-sided and leaning backwards; their exact positions around the body are approximate (angles 10 to 76 degrees each side of the underside).",
  [('Per segment', '8 (4 pairs), except the first'), ('Used for', 'anchoring while crawling and burrowing'), ('Model', '1,168 bristles, 0.5 mm long')],
  'C1', [R_ANN], [LANDER, W_EW], related=['soil_worm_movement'])

N('soil_worm_burrow', 'The earthworm burrow', 'structure', 1, ['soil_earthworm', 'soil_horizon_a'],
  "The burrow of Lumbricus terrestris is a permanent tunnel that runs straight down, usually to about half a metre and sometimes much deeper; it lets in air and rain and carries roots down.",
  "Unlike garden worms that wander through the topsoil, this worm digs a permanent vertical tunnel and lives in it for years. It comes to the mouth at night, pulls in leaves and sometimes mates there. Burrows like this do three jobs: they let air into the soil, they let rainwater drain deep instead of running off, and they give roots an easy path down through hard soil. In the block the burrow goes straight down through every layer to about a metre.",
  "Burrow depth is usually up to 50 cm but may be up to 2.5 m, and worms go deeper in cold, dry weather. Endogeic species, by contrast, make horizontal burrows in the upper 10 to 30 cm. Burrows improve aeration, drainage and root penetration. Darwin found that worms can retreat into their burrows with extraordinary rapidity by the aid of their affixed tails.",
  "The model burrow is 11 mm wide (the worm is 8 mm) and 1 m deep with a slight wobble below 30 cm: both are drawing choices. The lining is drawn as a dark, semi-transparent tube so you can see the worm inside it in the 'Life only' view.",
  [('Type', 'permanent, vertical'), ('Depth', 'usually up to 50 cm; up to 2.5 m (deeper in cold, dry weather)'), ('Does', 'air in, water down, a path for roots')],
  'C1', [R_ANN], [BIOT, W_EW, UBC, DARWIN], related=['soil_darwin'])

N('soil_worm_cast', 'Earthworm cast', 'structure', 0.03, ['soil_earthworm'],
  "A cast is the small heap of fine earth that an earthworm leaves at the mouth of its burrow: soil that has passed through its gut.",
  "The little heap of crumbly earth at the top of the burrow is the worm's waste: soil and leaf matter that went through its body. Darwin collected and weighed them. He found that a single full-sized cast at the mouth of a burrow often weighs more than an ounce (about 28 grams), and that over a year the worms on a field bring up several tons of earth per acre. Casts are richer in nitrogen than the soil around them and are a fine crumbly material, and rain slowly spreads them out.",
  "Casts are mixed organic and mineral material deposited on the soil surface. Darwin collected the castings from two square yards at Leith Hill Place, Surrey, for a year and calculated 7.56 and 16.1 tons per acre of dried earth (about 19 and 40 tonnes per hectare, my conversion). A lawn analysed by Dr Gilbert gave castings with 0.35 (per cent) nitrogen, two to three times as much as ordinary arable surface soil.",
  "The cast is drawn as a heap of 38 pellets 3 to 7 mm across at the mouth of the burrow. Darwin noted that the amount he collected was somewhat less than the worms had ejected, because rain washes away some of the finest earth.",
  [('A full cast', 'often more than 1 oz (≈ 28 g) (Darwin)'), ('Castings (Darwin, 2 measured sites)', '7.56 and 16.1 tons per acre per year'), ('Nitrogen (lawn castings)', '0.35 %, 2 to 3 times arable topsoil')],
  'C1', [R_ANN], [DARWIN, W_LT], related=['soil_darwin', 'soil_nitrogen'])

N('soil_worm_circular', 'Earthworm: circular muscle', 'structure', 0.0008, ['soil_earthworm', 'soil_worm_segments'],
  "Just under the skin is a thin layer of muscle whose fibres run around the body like hoops; when it tightens, the segment gets thinner and longer.",
  "The worm has two layers of muscle that work against each other. The outer, thin one runs around the body in rings. When a stretch of the body tightens these hoops, the fluid inside has nowhere to go but along the body, so that stretch becomes long and thin and pushes forward through the soil, like a tube of toothpaste squeezed in the middle. The other layer, the longitudinal muscle, does the opposite.",
  "Each segment has a thin outer layer of circular muscle and a thicker inner layer of longitudinal muscle. The coelomic fluid acts as a hydrostatic skeleton: a fluid cannot be squeezed to a smaller volume, so when circular muscle narrows a segment it must lengthen. Waves of contraction travelling along the body alternately shorten and lengthen it, and shortened segments are anchored by the bristles. In fresh dissections this layer looks thick and reddish-brown.",
  "The layer is drawn as a tube 0.08 to 0.24 mm deep under the skin; the proportions of the muscle layers are illustrative. Fresh specimens show it divided into rings by the segment grooves, which the model does not draw.",
  [('Fibres run', 'around the body'), ('When it contracts', 'segment becomes longer and thinner'), ('Works against', 'the longitudinal muscle (antagonists)')],
  'C1', [R_ANN], [W_EW, LANDER], related=['soil_worm_longitudinal', 'soil_worm_movement', 'bio_comparative_circulation'])

N('soil_worm_longitudinal', 'Earthworm: longitudinal muscle', 'structure', 0.001, ['soil_earthworm', 'soil_worm_segments'],
  "Under the circular muscle is a thick layer of muscle running from head to tail; when it tightens, the segment gets shorter and fatter and grips the burrow.",
  "The inner layer of muscle runs along the body, from head to tail, in several bundles. When a stretch of it tightens, that part of the worm shortens and bulges outward, pressing against the burrow wall and gripping it with the bristles. Shortened, fat stretches act as anchors, while the stretches ahead are pushed forward by the circular muscle. A wave of this, repeated along the body, is how the worm moves. A touch triggers a reflex that tightens the whole longitudinal layer at once, which is why a worm wriggles.",
  "In fresh specimens the longitudinal muscle is white or grey and is not interrupted at the segment boundaries. The touch reflex that contracts the longitudinal muscles does not require the central nervous system. Giant nerve fibres run the length of the body to carry the escape signal quickly (see the nerve cord card). The muscle scene shows the layers of the body wall as a block (1.8 mm field of view).",
  "The layer is drawn between 0.24 and 0.66 mm below the surface; the thickness is illustrative. The scene of the body wall is built from typical animal muscle cell sizes and is marked illustrative.",
  [('Fibres run', 'along the body'), ('When it contracts', 'segment becomes shorter and fatter'), ('Reflex', 'a touch makes it contract (does not need the brain)')],
  'C1', [R_ANN], [W_EW, LANDER], related=['soil_worm_circular', 'soil_worm_movement', 'skeletal_muscle_fiber'])

N('soil_worm_coelom', 'Earthworm: the body cavity (coelom)', 'structure', 0.0012, ['soil_earthworm'],
  "Between the body wall and the gut is a cavity filled with fluid; the fluid is the worm's skeleton.",
  "An earthworm has no bones. Its stiffness comes from a liquid-filled space running its whole length, the coelom, divided into compartments by thin walls between the segments. Because the liquid cannot be squashed, the muscles can use it like a hydraulic system: squeezing one end makes the other end stretch. This kind of skeleton is called a hydrostatic skeleton, and many soft animals use it.",
  "The coelomic fluid functions as the hydrostatic skeleton. The coelom is divided by septa between the segments. It is lined with a membrane (the peritoneum) on the inner surface of the body wall, and the nephridia open into it. In the model the cavity is drawn as a pale tube between the muscle and the gut.",
  "The coelom is drawn as a solid pale shape for the cut face; in life it is fluid and contains the gut, vessels and nerve cord. The septa are not drawn.",
  [('Contains', 'fluid; the gut, vessels and nerve cord run through it'), ('Divided into', 'compartments by septa between segments'), ('Acts as', 'a hydrostatic skeleton')],
  'C1', [R_ANN], [W_EW, LANDER, UBC], related=['soil_worm_movement'])

N('soil_worm_pharynx', 'Earthworm: pharynx', 'structure', 0.0035, ['soil_earthworm', 'soil_worm_head'],
  "The pharynx is a strong muscular pump behind the mouth that sucks in leaves and soil.",
  "Behind the mouth is a thick, muscular bulb. When the worm eats, it pushes the bulb forward and pulls it back like a pump, drawing in bits of leaf and earth. It has no teeth; whatever it swallows goes on to be softened and ground inside.",
  "The pharynx has thick, muscular walls with radial muscles; the buccal cavity before it covers about the first three segments and the pharynx itself about segments 3 to 5. Darwin noted that the pharynx is pushed forward when the animal eats and compared it to the protrusible trunk of other annelids.",
  "The pharynx is drawn as a bulb about 3.4 mm long and 3 mm wide, in the head end of the body; the nerve ring and brain lie around it.",
  [('Position', 'about segments 3 to 5'), ('Does', 'draws food in'), ('Wall', 'thick, muscular')],
  'C1', [R_ANN], [LANDER, DARWIN], related=['soil_worm_oesophagus', 'soil_worm_brain'])

N('soil_worm_oesophagus', 'Earthworm: oesophagus and its lime glands', 'structure', 0.009, ['soil_earthworm'],
  "The oesophagus carries food back from the pharynx; on its sides are glands that make lime (calcium carbonate) and help the worm control calcium and acidity.",
  "The gullet is a narrow tube about 8 millimetres long in the model. Along it are pouches and glands that put chalk (calcium carbonate) into the food. Darwin was struck by them: he found that nothing like them was known in any other animal, and discussed what they were for. The modern account is that they help the worm keep the level of calcium and the acidity of its blood in balance,.",
  "Segments 6 to 12 are the oesophagus; esophageal pouches lie around segments 10 to 11 and two pairs of calciferous glands lie behind them, just behind the fifth heart. Darwin described three pairs of large glands that secrete a surprising amount of carbonate of lime. They help to regulate calcium and pH.",
  "The model draws two pairs of pouch-like glands, not three, as a simplification; descriptions of the number differ between Darwin (three pairs) and the modern anatomy text (two pairs of glands behind the pouches). Their position is approximate.",
  [('Position', 'segments 6 to 12'), ('Glands', 'calciferous (lime) glands; Darwin counted three pairs'), ('Make', 'calcium carbonate'), ('Role today', 'help regulate calcium and pH')],
  'C2', [R_ANN], [LANDER, DARWIN, W_EW], related=['soil_worm_crop'])

N('soil_worm_crop', 'Earthworm: crop', 'structure', 0.006, ['soil_earthworm'],
  "The crop is a thin-walled storage pouch where swallowed food waits before it is ground.",
  "Further back, the gullet widens into a thin-walled bag in which food waits. The next chamber, the gizzard, grinds it.",
  "In most earthworm species the oesophagus is enlarged into a crop in front of the gizzard (Darwin). The crop joins the oesophagus at about segment 12 and extends back through several segments.",
  "The crop is drawn as a pouch 5.5 mm long behind the oesophagus; segment numbers are approximate in the model.",
  [('Position', 'between the oesophagus and the gizzard'), ('Does', 'stores swallowed food')],
  'C1', [R_ANN], [DARWIN, LANDER], related=['soil_worm_gizzard'])

N('soil_worm_gizzard', 'Earthworm: gizzard', 'structure', 0.004, ['soil_earthworm'],
  "The gizzard is a tough muscular grinder lined with a hard membrane; the worm swallows grains of sand and small stones that work like millstones inside it.",
  "Because the worm has no teeth, its food is ground inside. The gizzard has thick muscular walls and a hard lining, and it squeezes and grinds the food together with grains of sand and tiny stones that the worm has swallowed. Darwin found stones between about 1.3 and 2.5 millimetres across in the gizzards and intestines of worms, and he thought they work like millstones.",
  "Darwin's description: the gizzard is lined with a smooth thick chitinous membrane and surrounded by weak longitudinal and powerful transverse muscles. Perrier saw these muscles in energetic action, so the grinding must be done chiefly by this organ. Grains of sand and small stones from 1/20 to a little more than 1/10 inch in diameter (1.3 to 2.6 mm) are generally found in the gizzards and intestines. The gizzard opens into the intestine.",
  "The gizzard is drawn as a barrel 4 mm long and 3.4 mm wide; its position is approximate.",
  [('Wall', 'thick, muscular, with a hard lining'), ('Grinds with', 'sand grains and small stones (1.3 to 2.6 mm, Darwin)'), ('No', 'jaws or teeth anywhere')],
  'C1', [R_ANN], [DARWIN, LANDER], related=['soil_worm_intestine'])

N('soil_worm_intestine', 'Earthworm: intestine and the soil inside it', 'structure', 0.14, ['soil_earthworm'],
  "The intestine runs straight from the gizzard to the vent at the tail; in it the ground food is digested and absorbed, leaving the cast.",
  "Behind the gizzard the gut becomes a long, straight, thin-walled tube that runs almost to the tail. Here the food, which is mostly soil with bits of decayed leaf in it, is digested and the nutrients pass into the blood. A fold runs along the roof of the tube to give more surface to absorb through. What remains passes out at the tail end and is the cast. The dark filling in the model is the soil that is being digested.",
  "Darwin described the intestine as running in a straight course to the vent, with a remarkable structure, the typhlosole, a deep longitudinal involution of its walls that gives an extensive absorbent surface; the dorsal wall is invaginated in the intestine and the typhlosole is absent from the rectum. The earthworm swallows large amounts of soil; its casts are richer in nitrogen than the soil around them.",
  "The typhlosole is not drawn; the intestine is shown as a simple tube 1.45 mm wide, with the soil inside drawn as an inner dark tube. The thickness of the wall is illustrative.",
  [('Runs', 'straight, from gizzard to vent'), ('Extra surface', 'the typhlosole fold (not drawn)'), ('Contents', 'soil and decayed plant matter')],
  'C1', [R_ANN], [DARWIN, LANDER, W_EW], related=['soil_worm_cast', 'soil_nitrogen'])

N('soil_worm_vessels', 'Earthworm: the blood vessels', 'structure', 0.15, ['soil_earthworm'],
  "Two long blood vessels run the length of the gut, one above and one below, joined by the hearts; the blood is red because it carries haemoglobin.",
  "The worm's blood travels in closed tubes. The big one above the gut, the dorsal vessel, carries blood forward toward the head; the big one below, the ventral vessel, carries it backward toward the tail. Short vessels in each segment link them. The blood carries oxygen picked up through the skin, in a red pigment (haemoglobin) dissolved directly in the blood and not packed in cells.",
  "There are five main closed vessels: dorsal, ventral, subneural and two lateroneural; each segment also has a pair of pallial vessels. Blood contains haemocytes and dissolved haemoglobin. In the dorsal vessel blood flows toward the head and in the ventral vessel toward the tail. Only the dorsal and ventral vessels are drawn.",
  "The vessels are drawn 0.54 and 0.6 mm wide and in the same simple course from head to tail; their size is illustrative.",
  [('Dorsal vessel', 'blood flows toward the head'), ('Ventral vessel', 'blood flows toward the tail'), ('Pigment', 'haemoglobin, dissolved in the blood')],
  'C1', [R_ANN], [W_EW, LANDER], related=['soil_worm_hearts', 'bio_comparative_circulation', 'bio_hemoglobin_cooperativity'])

N('soil_worm_hearts', 'Earthworm: five pairs of hearts', 'structure', 0.003, ['soil_earthworm', 'soil_worm_vessels'],
  "Five pairs of muscular loops, one pair in each of five segments just behind the head, ring the oesophagus and pump blood from the top vessel to the bottom one.",
  "An earthworm has ten hearts: five pairs, in a row just behind the head. Each is a muscular loop that goes around the gullet and joins the vessel above the gut to the vessel below. Together they pump the blood. They are not like our heart: they are simple muscular tubes that squeeze.",
  "The hearts are a pair of aortic arches in segments seven through eleven, which ring the coelom and act as hearts; they are large, contractile, segmental blood vessels encircling the oesophagus. Blood is moved forward in the dorsal vessel and backward in the ventral.",
  "The hearts are drawn as ten loops 0.5 mm thick around the oesophagus at segments 7 to 11. They are drawn at rest. The ATP button leads to the molecule that muscle cells use as fuel.",
  [('Hearts', '5 pairs'), ('Segments', '7 to 11'), ('Shape', 'loops around the oesophagus'), ('Joins', 'dorsal vessel to ventral vessel')],
  'C1', [R_ANN], [W_EW, LANDER], related=['heart', 'bee_heart', 'pond_daphnia_heart', 'bio_comparative_circulation'])

N('soil_worm_nerve', 'Earthworm: ventral nerve cord', 'structure', 0.15, ['soil_earthworm'],
  "A solid nerve cord runs along the underside of the body, with a small cluster of nerve cells in each segment and giant fibres for a fast escape.",
  "The worm's nervous system is a cord running along the belly, not the back as in us. In each segment (from about the fifth) the cord swells into a small knot of nerve cells that controls that ring and sends nerves to its muscles and skin. A few very thick nerve fibres run the whole length of the cord and carry the alarm signal very quickly, so that a touch can make the whole worm withdraw.",
  "The cord is double and solid, with a segmental ganglion in each segment from the fifth to the last and three pairs of segmental nerves from each ganglion. The giant axons: the medial giant axon is 0.07 mm across and conducts at 32.2 m/s, and the two lateral giant axons are 0.05 mm across and conduct at 12.6 m/s.",
  "The cord is drawn as a tube 0.5 mm wide with a swelling per segment from the fifth; the giant axons are not drawn separately. The cord is on the underside (to the left in the sagittal view).",
  [('Position', 'underside (ventral)'), ('Ganglia', 'one per segment from segment 5'), ('Medial giant axon', '0.07 mm wide, 32.2 m/s'), ('Lateral giant axons', '0.05 mm wide, 12.6 m/s')],
  'C1', [R_ANN], [W_EW, LANDER], related=['spinal_cord', 'bio_action_potential_channels'])

N('soil_worm_brain', 'Earthworm: brain and nerve ring', 'structure', 0.003, ['soil_earthworm'],
  "The earthworm's brain is a pair of small nerve-cell clusters on top of the pharynx, joined by two collars round it to a second cluster underneath.",
  "A worm does not have much of a brain: a pair of tiny knots of nerve cells sits on top of the pharynx, and two nerve bands curve around the pharynx to join a second knot beneath it. From there the nerve cord runs down the belly.",
  "Paired cerebral ganglia (the brain) lie in segment 3, sub-pharyngeal ganglia in segment 4, joined by circum-pharyngeal connectives into a nerve ring.",
  "The model draws two ganglia 1 mm wide and a smaller one under the pharynx.",
  [('Brain', 'cerebral ganglia, segment 3'), ('Second knot', 'sub-pharyngeal ganglion, segment 4'), ('Joined by', 'nerve ring round the pharynx')],
  'C1', [R_ANN], [W_EW, LANDER], related=['soil_worm_nerve', 'brain'])

N('soil_worm_movement', 'How an earthworm moves', 'process', 0.17, ['soil_earthworm'],
  "An earthworm crawls by waves of squeezing along its body: fat, short parts grip with their bristles while thin, long parts push ahead, so it can move through a tunnel exactly its own width.",
  "Try to picture a tube full of water that you can squeeze with rings. Squeeze a ring and the water goes along the tube, making it longer and thinner ahead of it. Let go and the tube relaxes and shortens. A worm does this along its body in a wave from head to tail: stretches that are short and fat grip the walls with their bristles, stretches that are long and thin reach forward. It can crawl backwards as well as forwards, and Darwin noted that it can retreat into its burrow with extraordinary rapidity by the aid of its affixed tail. On smooth moist ground one was reported to move at about 20 metres per hour, which is about 5.6 millimetres per second.",
  "Peristalsis uses two sets of muscle in opposition against a fluid skeleton: contraction of the circular muscle lengthens and thins a segment, contraction of the longitudinal muscle shortens and fattens it. The shortened segments are anchored by their bristles. The speed given is a reported figure for surface movement on moist, flat terrain; it is not the speed of burrowing, which is slower and depends on the soil. Nocturnal forays at the surface were estimated to reach 19 m.",
  "The worm in the block is drawn at rest. The conversion from 20 m/h to millimetres per second is mine.",
  [('Muscles', 'circular and longitudinal, opposing'), ('Skeleton', 'fluid-filled coelom'), ('Anchors', 'bristles on shortened segments'), ('Reported surface speed', '≈ 20 m/h (≈ 5.6 mm/s) on moist flat ground'), ('Direction', 'forwards or backwards')],
  'C2', [R_ANN], [W_EW, W_LT, DARWIN], related=['soil_worm_circular', 'soil_worm_longitudinal', 'soil_worm_setae'])

N('soil_darwin', 'Why earthworms matter: Darwin\'s measurements', 'concept', 1, ['soil_block', 'soil_earthworm'],
  "Charles Darwin measured how much earth worms bring up and found that in a few decades they bury objects on a field several inches deep.",
  "In 1881 Darwin published a book, The Formation of Vegetable Mould through the Action of Worms, after years of watching them. He found that earthworms swallow soil below and leave it on the surface as casts, and that over the years this buries things. On a field of his near Down, he had spread chalk on the grass, and when he dug a trench 29 years later he found a line of chalk lumps 7 inches (18 cm) below the surface: the soil had risen at an average of 0.22 inch (5.6 mm) a year. He weighed casts collected for a year on two square yards at Leith Hill, Surrey, and calculated 7.56 and 16.1 tons of dry earth per acre per year. He concluded that it may be doubted whether there are many other animals which have played so important a part in the history of the world as these lowly organised creatures.",
  "How many worms? Darwin quoted Hensen's count of 53,767 worms to the acre (133,000 per hectare) in a garden (Hensen believed twice as many as in corn fields) and noted that worms in old pasture had not been counted. Taking 15 tons of casts per acre a year and half Hensen's number of worms, he calculated that each worm would eject about 20 ounces a year. Objects strewn on grass fields were buried 1.9 to 2.2 inches in 10 years in four fields (sandy, swampy and argillaceous pastures) and 0.83 inch in a poor one. He also estimated that worms live chiefly in the surface mould, usually 4 or 5 to 10 and even 12 inches thick, and from time to time burrow far deeper and bring up earth from below. Worms do not work in dry weather in summer, or in winter in severe frosts.",
  "Darwin's figures are from a few English sites around 1870 and depend on the soil, the weather and the worm species present (he did not separate species); the density counts are from gardens. Modern work confirms that earthworms improve soil structure, for example in new polders where they had been absent. The sums above are Darwin's own, except the conversion of tons per acre to tonnes per hectare, which are mine (7.56 and 16.1 long tons per acre are about 19 and 40 tonnes per hectare).",
  [('Chalk buried at Down', '7 inches in 29 years (≈ 0.22 inch a year ≈ 5.6 mm a year)'), ('Castings (Leith Hill)', '7.56 and 16.1 tons per acre per year'), ('Hensen\'s count (a garden)', '53,767 worms per acre (133,000 per hectare)'), ('Objects buried in 10 years', '0.83 to 2.2 inches'), ('Year', '1881')],
  'C1', [R_ANN, R_SOIL], [DARWIN, W_STRUCT], parts=['soil_worm_cast', 'soil_formation'], related=['soil_formation', 'soil_decomposition', 'bio_soil_ecology'],
  fig=bars([('objects buried in 10 years: poor pasture', .83), ('objects buried in 10 years: good pasture, Down', 2.2), ('Leith Hill castings, spread out over 10 years (terrace)', .9), ('Leith Hill castings, spread out over 10 years (common)', 1.43)], 'inches in ten years', 'How deep Darwin found worm castings bury things in ten years, from burial of objects on fields and from weighed castings (The Formation of Vegetable Mould, 1881, chapter 3).'))
