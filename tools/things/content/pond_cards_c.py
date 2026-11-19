# Cards C: the animals (pond skater, water flea, great pond snail, southern hawker larva, common frog tadpole).
from pond_lib import *

# ---------------------------------------------------------------- pond skater
N('pond_skater', 'Pond skater', 'organism', 0.009, ['park_pond', 'pond_surface'],
  "The common pond skater (Gerris lacustris): a slim, dark brown insect, 8 to 10 mm long, that stands and rows on the surface film of still water.",
  "A pond skater is a bug that lives on top of the water. It does not swim; it stands on the surface film on its four long back legs and glides across by rowing with the middle pair. Its feet make shallow dimples in the surface but do not break it. It hunts insects and other small animals that fall on or are just under the surface, with piercing, sucking mouthparts. The one in the model is a true-size 9 mm; its legs reach about 2 cm across, and it twitches now and then.",
  "The front pair of legs is short and holds prey; the middle pair propels the bug by rowing or jumping; the hind pair works as a rudder. The body and legs are covered with tiny hairs with a wax-like coating, so the legs do not get wet. A water strider can move at about 1 m/s or faster. Its mouthparts pierce and suck. Adults emerge around April and May; eggs take 12 to 14 days to develop, and from larva to adult takes about 24 to 30 days across five stages.",
  "Body length 8 to 10 mm, dark brown (Wikipedia, Gerris lacustris). The model's proportions (leg lengths, the position of the legs on the body) are drawn from the general arrangement, not measured on a specimen: the hind legs reach about 10 mm sideways from the body in the model. The twitch is an illustrative motion, shown slowed, not a measured rate. Click the legs and the hairs to find out how it stays up.",
  [('Body length', '8 to 10 mm (model: 9 mm)'), ('Colour', 'dark brown'), ('Legs', 'front (grasp prey), middle (row), hind (steer)'), ('Speed', 'about 1 m/s or faster (water striders)'), ('Eats', 'insects and small invertebrates on or just under the surface'), ('Life cycle', '5 larval stages; ≈ 24 to 30 days from larva to adult')],
  'C1', [R_ART], [W_GERRIS, W_STRIDER],
  parts=['pond_skater_legs', 'pond_surface_film'], related=['bio_entomology_insects', 'bio_nematodes_arthropods', 'bee_chitin'], where='park_pond',
  fig=bars([('body length (model)', 9), ('body length: smallest quoted', 8), ('body length: largest quoted', 10), ('leg span across the water (model, about)', 21)], 'millimetres', 'The pond skater drawn at its quoted body length (8 to 10 mm); the leg span is the model\'s and is not a measurement.'))

N('pond_skater_legs', 'Pond skater legs: rowing, steering and the grasp', 'structure', 0.012, ['pond_skater'],
  "Six legs with three jobs: the short front pair grasps prey, the long middle pair rows, and the long hind pair steers.",
  "A pond skater uses its six legs differently. The front pair is short and stubby and holds the prey it catches. The middle pair is long; pressing back on the water, it rows the insect forward or makes it jump. The hind pair works as a rudder. The legs rest on the surface at their tips, and the pale dimples under the four standing feet in the model show where. Click the middle leg and press the button to look at the hairs that keep it dry.",
  "Rowing works because the middle legs press down and back on the water without breaking the surface: the stroke creates a circular surface wave that provides thrust. The legs are made of cuticle, the hard skeleton material of insects, and their tips are covered with water-repelling hairs. One source disagrees with the others about which legs sense vibration, and that detail is not settled on this card.",
  "In the model each leg is drawn with a coxa at the body, a raised 'knee', a long shin and a foot lying along the surface; the hind and middle legs are about 11 and 12 mm long. These dimensions are a plausible drawing, not a measurement.",
  [('Front legs', 'short; hold prey'), ('Middle legs', 'long; row and jump'), ('Hind legs', 'long; steer like a rudder'), ('Leg material', 'chitin and protein cuticle, with a wax-like coating')],
  'C2', [R_ART], [W_GERRIS, W_STRIDER], openq=['Which legs sense the ripples of struggling prey is described differently in different sources.'], parts=['pond_leg_hairs'], related=['pond_surface_film', 'bee_chitin'], where='park_pond')

# ---------------------------------------------------------------- water flea
N('pond_daphnia', 'Water flea (Daphnia)', 'organism', 0.0025, ['park_pond', 'pond_water'],
  "A water flea (Daphnia): a transparent crustacean about 2.5 mm long that swims in jerks with its big antennae and filters tiny algae from the water.",
  "Water fleas are not insects and not fleas: they are small crustaceans, relatives of crabs and shrimp, and they swim by jerky hops, rowing with their large second antennae. A shell of two translucent halves covers most of the body, so you can see the organs through it: a dark eye, a gut, eggs in a pouch and, behind the head, a heart that beats about 180 times a minute. This is why Daphnia is a favourite of school microscopes. The model is 2.5 mm long; the shell is drawn translucent so the heart shows.",
  "Daphnia feed by filtering: the second and third pairs of legs strain food from the water, mainly single-celled algae and also bits of dead matter, protists and bacteria. Most species reproduce by cyclical parthenogenesis: females make eggs that develop without fertilisation, and the young are mostly female. When conditions worsen (crowding, for example), some young become males, and females make eggs that need fertilising and are protected in a tough case. Eggs hatch within about a day of being laid and stay in the female's brood pouch for about three days at 20 °C. In many species the carapace is translucent so that the heart and other organs are visible. Daphnia produce haemoglobin when oxygen is low.",
  "Daphnia are usually 1 to 5 mm long; the genus ranges from 0.2 to 6 mm (Wikipedia, Daphnia). The model is a 2.5 mm female. The heart rate is about 180 per minute (3 per second) under normal conditions; the model beats it at half speed, as the screen says. The hop is an illustrative motion. Lifespan depends on temperature and predators, typically under five or six months, and up to 13 to 14 months in some cold lakes without fish.",
  [('Length', '1 to 5 mm typical (model: 2.5 mm)'), ('Heart rate', 'about 180 per minute'), ('Eats', 'single-celled algae, bacteria and fine dead matter, by filtering'), ('Reproduces', 'cyclical parthenogenesis'), ('Lifespan', 'typically under 5 to 6 months')],
  'C1', [R_ART, R_FLOW], [W_DAPH],
  parts=['pond_daphnia_head', 'pond_daphnia_antennae', 'pond_daphnia_heart', 'pond_daphnia_gut', 'pond_daphnia_eggs', 'pond_daphnia_limbs'], related=['bio_arachnids_crustaceans', 'bio_nematodes_arthropods', 'bee_chitin'], where='park_pond',
  fig=bars([('Daphnia genus: smallest', 0.2), ('typical: smallest', 1), ('model', 2.5), ('typical: largest', 5), ('genus: largest', 6)], 'millimetres', 'Size of Daphnia: the model against the recorded ranges (Wikipedia, Daphnia).'))

N('pond_daphnia_head', 'Water flea: head and eye', 'structure', 0.0006, ['pond_daphnia'],
  "The head carries one large compound eye and the mouth; it is a rounded cap at the front, outside the shell.",
  "A water flea's head is at the front, rounded, with the dark eye on it. A compound eye is made of many tiny light-sensing units, like an insect's eye. The eye is moved by tiny muscles, which can be seen under a low-power microscope. The model draws the head as a simple rounded shape.",
  "The eye is among the most prominent features of the body and is moved by ciliary muscles, visible under low-power microscopy (Wikipedia, Daphnia). The model draws a single dark spherical eye on the front of the head; its detail (number of facets) is not drawn.",
  "In the model the head is 1.2 mm long and the eye 0.34 mm across, drawn as a simple sphere.",
  [('Eye', 'compound; moved by muscles'), ('Model eye size', '0.34 mm')], 'C2', [R_ART], [W_DAPH], related=['bee_compound_eye'], where='park_pond')

N('pond_daphnia_antennae', 'Water flea: the swimming antennae', 'structure', 0.002, ['pond_daphnia'],
  "The second pair of antennae are big, branched limbs that power swimming; each stroke sends the animal forward in a small jump.",
  "The water flea does not use its legs to swim. It rows with a pair of large branched limbs on its head, called the second antennae. Each stroke makes the animal lunge, which gives it its jerky, flea-like hops. In the model they are drawn as two stalks with two branches each, and they move to and fro for illustration.",
  "Swimming is powered mainly by the second set of antennae, which are larger than the first pair; the movement resembles flea-like jumping (Wikipedia, Daphnia).",
  "The motion of the model's antennae is an illustration, not a measured stroke rate; the screen says so.",
  [('Job', 'swimming (rowing)'), ('Resulting movement', 'jerky, flea-like hops')], 'C1', [R_ART], [W_DAPH], where='park_pond')

N('pond_daphnia_heart', 'Water flea: the beating heart', 'structure', 0.0003, ['pond_daphnia'],
  "A water flea's heart is a small sac on its back, just behind the head, that you can see beating through the shell.",
  "Behind the head, at the top of the back, the heart pumps the animal's blood. Because the shell is clear, you can see it beat: about 180 times a minute (three beats per second) in normal conditions. It is the classic view of a water flea under a microscope. In the model the heart beats at half that speed so that you can watch it, and the screen says so.",
  "Because of their size, Daphnia use both diffusion and circulation to move oxygen about; they make haemoglobin when oxygen is low. Heart rate depends on temperature and conditions: about 180 beats a minute is the average in normal conditions. A heart is a muscular pump in every animal that has one, including us; a human heart is a far bigger muscular pump, but it works on the same principle: heart muscle cells contract together. Press the button to see ATP, the molecule that fuels every muscle cell.",
  "The heart is at the top of the back just behind the head (Wikipedia, Daphnia). In the model it is an ellipsoid 0.4 mm long, shown pulsing at 1.5 beats per second against the real 3 per second.",
  [('Heart rate', 'about 180 per minute, about 3 per second'), ('Where', 'top of the back, behind the head'), ('In the model', 'pulses at half speed')], 'C1', [R_ART], [W_DAPH], related=['heart', 'cardiomyocyte', 'bee_heart'], where='park_pond')

N('pond_daphnia_gut', 'Water flea: the gut', 'structure', 0.002, ['pond_daphnia'],
  "The gut is a tube from the mouth to the tail; you can see green food moving through it.",
  "Food strained from the water is pushed into the gut, where it forms a ball that moves along the tube until it is passed out at the animal's tail end. Because the shell is clear, the gut can be seen through it. In the model the gut is a green tube with a pair of small pouches at the front.",
  "Leg beating draws food particles into the digestive tract, where they form a bolus (a ball) that moves down until it is voided through the anus on the underside of the end of the body (Wikipedia, Daphnia). The pouches at the front of the model's gut are a simplification of the real gut's form.",
  "The gut is drawn 2 mm long and about 0.2 mm wide.",
  [('Passes food', 'mouth to anus on the underside of the tail'), ('Looks green', 'after eating algae')], 'C2', [R_ART], [W_DAPH], where='park_pond')

N('pond_daphnia_eggs', 'Water flea: eggs in the brood pouch', 'structure', 0.0004, ['pond_daphnia'],
  "A female carries her eggs in a pouch on her back under the shell, where they develop without being fertilised.",
  "A mature female water flea carries her young-to-be in a pouch under the shell, on her back. In good conditions the eggs need no father: each develops into a female that is a copy of her mother. Small species may carry only one or two eggs, and larger species such as Daphnia magna can carry over a hundred. The model shows four.",
  "Eggs hatch within a day and the young stay in the brood pouch for about three days at 20 °C before being released (Wikipedia, Daphnia). Reproduction without fertilisation is called parthenogenesis. When conditions worsen, females make eggs that must be fertilised, protected by a chitinous covering (the ephippium).",
  "The model shows four eggs, each 0.34 mm across; the number and the positions are illustrative.",
  [('Eggs per clutch', '1 or 2 in small species; over 100 in larger ones'), ('In the pouch', 'about 3 days at 20 °C'), ('Model', '4 eggs, 0.34 mm each')], 'C1', [R_ART], [W_DAPH], where='park_pond',
  fig=bars([('small species (e.g. D. cucullata), at most', 2), ('model', 4), ('larger species (e.g. D. magna), more than', 100)], 'eggs in one clutch', 'How many eggs a Daphnia may carry (Wikipedia, Daphnia): a few in small species, over a hundred in large ones; the model shows four.'))

N('pond_daphnia_limbs', 'Water flea: the filtering limbs', 'structure', 0.0006, ['pond_daphnia'],
  "Five or six pairs of leaf-like legs beat under the shell, creating a current and straining food from it.",
  "Under the shell, between the two halves, a water flea has five or six pairs of flattened legs. They are not for walking. They beat steadily, drawing a stream of water through the shell. Two of the pairs do the filter feeding; the others help make the current.",
  "Five or six pairs of legs lie in a gap on the underside beneath the carapace; the second and third pairs are used in filter feeding and the others create the incoming current (Wikipedia, Daphnia). The model draws five pairs as small flattened lobes plus a tail piece.",
  "Each lobe is 0.18 × 0.6 mm in the model.",
  [('Pairs', 'five or six'), ('Used for', 'filter feeding (two pairs) and making the current (the rest)')], 'C1', [R_ART], [W_DAPH], where='park_pond')

# ---------------------------------------------------------------- great pond snail
N('pond_snail', 'Great pond snail', 'organism', 0.05, ['park_pond', 'pond_water'],
  "The great pond snail (Lymnaea stagnalis): a large freshwater snail with a spiral shell 4.5 to 6 cm tall, that breathes air at the surface.",
  "This is one of the biggest snails in British ponds. Its tall, pointed, spiral shell is brown and can be 45 to 60 mm tall and 20 to 30 mm wide. Unlike a fish it has no gills: it has a lung and breathes air. It crawls over plants and mud on one broad muscular foot. In the model the snail is true size, crawling on the mud with its two tentacles forward.",
  "The great pond snail belongs to the pulmonates, snails whose mantle cavity has no gills and is instead a blood-vessel-lined lung. Each snail is both male and female at once (a simultaneous hermaphrodite), though it plays only one role in a mating. It is air-breathing. In aquaria it eats vegetables, leaves, algae and other snails' eggs. It is a model organism in neuroscience and parasitology: its nerve cells are large, up to about 100 µm across, and it is an intermediate host for several flatworm parasites. The shell in the model is a spiral of 6 turns made by sweeping an oval along a logarithmic coil; it is an illustration of the shape, not a measured shell.",
  "Shell height 45 to 60 mm, width 20 to 30 mm; rarely 70 mm (Wikipedia, Lymnaea stagnalis). The model's shell is 50 mm tall, 26 to 30 mm wide. The body size and posture are illustrative.",
  [('Shell height', '45 to 60 mm (model: 50 mm)'), ('Shell width', '20 to 30 mm'), ('Breathes', 'air, with a lung'), ('Sexes', 'both at once (hermaphrodite)'), ('Nerve cells', 'large, up to about 100 µm')],
  'C1', [R_MOL, R_GAS], [W_LYM, W_PULM],
  parts=['pond_snail_body', 'pond_snail_senses'], related=['bio_lophotrochozoans', 'bio_model_organisms', 'bio_protists'], where='park_pond',
  fig=bars([('shell height: smallest adult', 45), ('shell height (model)', 50), ('shell height: largest typical', 60), ('shell width (model, about)', 27)], 'millimetres', 'Great pond snail shell size: adults are 45 to 60 mm tall and 20 to 30 mm wide (Wikipedia, Lymnaea stagnalis).'))

N('pond_snail_body', 'Great pond snail: foot, head and lung', 'structure', 0.04, ['pond_snail'],
  "The soft body: a broad muscular foot to crawl on, a head with the mouth, and a lung under the shell.",
  "Under the shell sits the snail's soft body. The foot is a single broad muscle that carries it along on a film of slime. The head has the mouth, which holds a ribbon of tiny teeth, the radula, that scrapes food. Behind the head, under the shell, is a chamber that works as a lung. The snail goes to the surface to fill it with air.",
  "A radula is a minutely toothed, chitinous ribbon that scrapes or cuts food before it reaches the oesophagus; most molluscs have one. In many snail lineages it rakes microscopic algae from surfaces. In pulmonate snails the mantle cavity has lost its gills and has become a lung lined with blood vessels. This model draws the visible parts only: foot, head and a collar of mantle at the shell's mouth; the lung is not drawn.",
  "In the model the foot is about 36 mm long and 12 mm wide. The proportions are illustrative.",
  [('Foot', 'one broad muscle'), ('Mouth', 'with a radula, a toothed ribbon of chitin'), ('Breathing organ', 'a lung in the mantle cavity (not drawn)')], 'C1', [R_MOL], [W_LYM, W_PULM, W_RAD], related=['bio_lophotrochozoans', 'bee_chitin'], where='park_pond')

N('pond_snail_senses', 'Great pond snail: tentacles and eyes', 'structure', 0.006, ['pond_snail'],
  "Two tentacles at the front of the head carry the snail's senses; small dark eyes sit at their base.",
  "The model gives the snail two tentacles on its head and a pair of small eyes. The model draws the tentacles as broad flat triangles and the eyes as black dots at the inner side of their bases.",
  "The shapes in the model are simplified; sensory detail is not drawn.",
  "In the model the tentacles are 5.6 mm long and the eyes 1.2 mm across.",
  [('Tentacles', 'two, on the head'), ('Eyes', 'two, simple, at the base of the tentacles')], 'C2', [R_MOL], [W_LYM], where='park_pond')

# ---------------------------------------------------------------- dragonfly larva
N('pond_dragonfly_larva', 'Dragonfly larva (southern hawker)', 'organism', 0.042, ['park_pond', 'pond_water'],
  "The underwater young of a southern hawker dragonfly (Aeshna cyanea): a brown-green hunter, about 4 cm long, that catches prey with a hinged lip shot out at lightning speed.",
  "A dragonfly spends most of its life under water as a larva. The southern hawker's larva is 38 to 48 mm long, with big eyes, six legs, two small wing pads on the middle part of the body and a long tapering abdomen ending in a point. It is a predator that strikes with a folded lip (the mask) that shoots out to grab prey. It eats other water insects, small tadpoles and small fish. It lives like this for two or three years, then climbs a plant stem out of the water and the adult dragonfly emerges.",
  "The larva grows by moulting, shedding its skin between 6 and 15 times depending on the species. Southern hawkers emerge as adults in July and August and fly from June to October; the adult is about 70 mm long with a wingspan of up to 110 mm. The adults breed in well-vegetated small ponds, often garden ponds. When the larva is ready, it stops feeding, goes to the surface, generally at night, climbs a reed or other plant out of the water and moults for the last time.",
  "Larva 38 to 48 mm (British Dragonfly Society); development 'two to three years' (Wikipedia, Aeshna cyanea). The model is 42 mm long. The proportions of the head, legs and wing pads are drawn from the general form of a hawker larva and are not measured on a specimen.",
  [('Larva length', '38 to 48 mm (model: 42 mm)'), ('Larval life', 'two to three years'), ('Moults', '6 to 15, depending on species'), ('Eats', 'aquatic insects, small tadpoles, other invertebrates, small fish'), ('Adult', '≈ 70 mm long, wingspan up to 110 mm; flies June to October')],
  'C1', [R_ART, R_FLOW], [W_AESH, BDS, W_DRAGON],
  parts=['pond_larva_head', 'pond_larva_mask', 'pond_larva_legs', 'pond_larva_abdomen', 'pond_life_cycles'], related=['bio_entomology_insects', 'bio_organoids_regeneration', 'bee_chitin'], where='park_pond',
  fig=bars([('larva, smallest', 38), ('larva (model)', 42), ('larva, largest', 48), ('adult body length', 70), ('adult wingspan, up to', 110)], 'millimetres', 'A southern hawker larva against the adult: larva 38 to 48 mm; adult about 70 mm with a wingspan up to 110 mm (British Dragonfly Society; Wikipedia).'))

N('pond_larva_head', 'Dragonfly larva: head and eyes', 'structure', 0.007, ['pond_dragonfly_larva'],
  "A big head with two large compound eyes, set at the front.",
  "The head carries two large compound eyes. Under the head lies the folded lip, which it uses like a hand.",
  "Each compound eye is made of many tiny lenses, like those in the bee's eye. The model draws the eyes as two bulging green ovals; their facets are too small to draw.",
  "In the model the head is 7 mm wide across the eyes.",
  [('Eyes', 'two compound eyes'), ('Head width (model)', '≈ 7 mm')], 'C2', [R_ART], [W_AESH], related=['bee_compound_eye'], where='park_pond')

N('pond_larva_mask', 'Dragonfly larva: the extending lip (the mask)', 'structure', 0.008, ['pond_dragonfly_larva'],
  "A hinged, hooked lower lip folded under the head, that shoots out to seize prey and snaps back.",
  "The larva's most remarkable tool is the mask: a long, hinged lower lip folded under its head and body. When prey comes within reach, water pressure made by muscles in the abdomen drives it forward in a flash, and two hooks at its end grab the prey, which is pulled back to the mouth. In the model the mask is drawn folded.",
  "The labium is a huge, extensible lower lip armed with hooks and spines, folded under the body at rest and struck out at great speed by hydraulic pressure created by the abdominal muscles (Wikipedia, Dragonfly). In southern hawkers the mask is thin, more than 3.5 times as long as it is wide (British Dragonfly Society). The mask in the model is a flat plate with two hooks, drawn folded; its extension is not animated.",
  "No figure for the speed or reach of the strike is quoted on this card.",
  [('Folded under', 'the head and thorax'), ('Driven out by', 'hydraulic pressure from abdominal muscles'), ('Shape in southern hawkers', 'thin: more than 3.5 times as long as wide')], 'C1', [R_ART], [W_DRAGON, BDS], where='park_pond')

N('pond_larva_thorax', 'Dragonfly larva: thorax and wing pads', 'structure', 0.01, ['pond_dragonfly_larva'],
  "The middle part of the body, which carries the legs and, in older larvae, two pairs of small wing pads that will become the wings.",
  "Behind the head is the thorax, the part that holds the muscles for the legs. On its back lie two pairs of small flat cases, the wing pads. Inside them the adult's wings are growing, folded. When the larva climbs out of the water and sheds its skin for the last time, the wings unfold and harden.",
  "The wing pads grow with each moult. When ready, the larva stops feeding, goes to the surface, generally at night, climbs a reed or other plant and moults.",
  "The wing pads in the model are two pairs of flat lobes about 5 to 6 mm long. Their size is illustrative.",
  [('Parts', 'thorax; two pairs of wing pads'), ('Turns into', 'the adult wings at the last moult')], 'C1', [R_ART], [W_DRAGON, W_AESH], related=['bio_organoids_regeneration'], where='park_pond')

N('pond_larva_legs', 'Dragonfly larva: legs', 'structure', 0.012, ['pond_dragonfly_larva'],
  "Six jointed legs for crawling over mud and plants.",
  "The larva walks on six legs, three on each side. All insects have three pairs of legs on the thorax; each is jointed, with a thigh, a shin and a foot.",
  "The legs are made of the same hard cuticle as the rest of the body (chitin and protein). The model draws all six splayed as when crawling.",
  "In the model each leg is about 11 mm long, with a thick thigh tapering to a fine foot.",
  [('Legs', 'six, in three pairs')], 'C1', [R_ART], [W_AESH], related=['bee_chitin'], where='park_pond')

N('pond_larva_abdomen', 'Dragonfly larva: abdomen, rectal gills and jet propulsion', 'structure', 0.024, ['pond_dragonfly_larva'],
  "The tapering abdomen holds the gills, which are inside the rectum, and ends in a pointed tail. The larva shoots water out of the tail end to jet itself away.",
  "A dragonfly larva breathes through gills in its rear end. Water is drawn in and out of the tail end, passing over the gills inside. If the larva is alarmed, it can squirt the water out hard and shoot forward in a jet. The abdomen has ten segments, and at its tip are the pointed cerci and other tail points.",
  "Larvae breathe through gills in their rectum and can rapidly propel themselves by suddenly expelling water through the anus (Wikipedia, Dragonfly). Water is pumped through an opening at the tip of the abdomen. The abdomen's ten ring-shaped segments are drawn with a groove at each joint; the model draws three pointed tail appendages.",
  "The abdomen is 24 mm long in the model.",
  [('Gills', 'inside the rear end (rectal gills)'), ('Jet propulsion', 'water expelled through the tail end'), ('Segments', 'ten')], 'C1', [R_ART, R_GAS], [W_DRAGON], where='park_pond')

# ---------------------------------------------------------------- frog tadpole
N('pond_tadpole', 'Common frog tadpole', 'organism', 0.034, ['park_pond', 'pond_water'],
  "A tadpole of the common frog (Rana temporaria): a dark, speckled swimmer with a round body, a tail with a fin, and, at this age, a pair of small hind legs.",
  "Frogs lay clumps of eggs (spawn) in ponds in spring, and the eggs hatch into tadpoles. A tadpole is built for water: it breathes with gills, swims by waving its tail from side to side, and eats algae and rotting plants. The one in the model has grown hind legs, which is a stage about halfway to becoming a frog. Tadpoles are black at hatching and later become speckled with gold or brown. Many are eaten by fish, diving beetles, dragonfly larvae and birds. Those that survive lose the tail and leave the pond as tiny froglets in early summer, sometimes as late as September.",
  "A common frog spawns from January in the south to as late as June, generally peaking in April; a clump holds a few hundred to 5,000 eggs. The eggs usually hatch after 2 to 3 weeks (2 to 4 weeks according to the weather). About 16 weeks later the tadpoles begin growing back legs and then front legs. Early tadpoles have external gills that are later covered by skin. A chamber then forms, and the internal gills vent through small openings (spiracles). The gut is long and spiral, built for plant food, and the tail is flattened from side to side. When legs develop the diet changes to animal food; at metamorphosis the tail is absorbed, lungs develop and the gut shortens.",
  "In a Perthshire study of upland tadpoles with hind legs, body length was 10 to 17.5 mm and tail 15 to 27.5 mm, with hind limbs 2 to 9 mm (Bland, The Glasgow Naturalist); those were unusually large, over-wintering tadpoles at 865 m, so they are a guide rather than the norm for a garden pond. The model has a 14 mm body, a 20 mm tail and 4 mm hind legs. Adult common frogs are up to 9 cm (males) and 13 cm (females) according to Froglife, and the model shows none.",
  [('Spawn clump', 'a few hundred to 5,000 eggs'), ('Hatch', '2 to 4 weeks after spawning'), ('Hind legs', 'about 16 weeks after hatching'), ('Size, hind-leg stage', 'body 10 to 17.5 mm, tail 15 to 27.5 mm (Perthshire study)'), ('Eats', 'algae and rotting plants; later animal food'), ('Eaten by', 'fish, diving beetles, dragonfly larvae, birds')],
  'C1', [R_AMPH, R_FLOW], [W_FROG, FROGLIFE, ARC, W_TAD, BLAND],
  parts=['pond_tadpole_tail', 'pond_tadpole_legs', 'pond_life_cycles'], related=['bio_fishes_amphibians', 'bio_organoids_regeneration', 'bio_deuterostome_protostome'], where='park_pond',
  fig=bars([('body, smallest in the study', 10), ('body (model)', 14), ('body, largest', 17.5), ('tail, smallest', 15), ('tail (model)', 20), ('tail, largest', 27.5)], 'millimetres', 'Tadpoles with hind legs from a Perthshire study (Bland): body 10 to 17.5 mm and tail 15 to 27.5 mm; the model sits inside both ranges.'))

N('pond_tadpole_tail', 'Tadpole: the tail', 'structure', 0.02, ['pond_tadpole'],
  "A strong, flattened tail with a thin fin along its top and bottom edges drives the tadpole through the water, and is absorbed when it becomes a frog.",
  "The tail is the tadpole's engine. It is flattened from side to side and ends in a thin fin. Muscle inside it bends it from side to side, so the tadpole swims by wriggling like a fish. When the young frog is ready to leave the water, the tail shrinks and its material is taken back into the body.",
  "Tadpoles swim by lateral undulation, with a laterally compressed tail, like fishes; the tail is absorbed into the body at metamorphosis (Wikipedia, Tadpole). The model draws the tail as a tapered muscle with a flat fin sheet above and below it.",
  "The tail in the model is 20 mm long, with a fin about 8 mm deep at its deepest.",
  [('Used for', 'swimming by side-to-side waving'), ('At metamorphosis', 'absorbed into the body')], 'C1', [R_AMPH], [W_TAD, BLAND], where='park_pond')

N('pond_tadpole_legs', 'Tadpole: hind legs', 'structure', 0.004, ['pond_tadpole'],
  "Small hind legs grow from the base of the tail at about this age; they will later power the frog's jump.",
  "Hind legs are the first sign that the tadpole is turning into a frog. They start as tiny buds near the base of the tail and grow longer and longer; later the front legs appear. In the model the legs are about 4 mm long.",
  "In upland tadpoles measured in a Scottish study the hind legs were 2 to 9 mm long at different stages; forelimbs appeared on the larger ones (Bland, The Glasgow Naturalist). The model draws them as small jointed rods ending in a folded foot.",
  "Hind limb length in the study: 2 to 9 mm. The model's are 4 mm.",
  [('Hind limb length (study)', '2 to 9 mm'), ('Model', '4 mm')], 'C1', [R_AMPH], [BLAND, FROGLIFE], where='park_pond')
