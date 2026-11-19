# Cards: wing and tail feathers, legs and feet.
from robin_lib import *

def F(id, title, summary, basics, deeper, expert, facts, scale=.04, **kw): N(id, title, 'structure', scale, ['robin_wing'] if id in ('robin_prim', 'robin_sec', 'robin_tert', 'robin_coverts', 'robin_alula') else ['robin'], summary, basics, deeper, expert, facts, **kw)
N('robin_wing', 'Wing: the arm that became a wing', 'structure', .1, ['robin'],
  'A bird\'s wing is an arm: the same bones as ours, with the wrist and hand fused and the fingers reduced, and feathers in place of skin.',
  'Fold your arm and compare. The wing has an upper arm bone (humerus), two forearm bones (radius and ulna), and a hand. The wrist and hand bones are fused into one hand bone, and only three fingers remain, one of them carrying the alula. The big feathers are attached to the forearm and hand bones. Use the "Cut open: the wing" view to see the bones and compare them with the human arm.',
  'Bones and muscles are the same family as ours; evolution kept the pattern and changed the proportions. The primaries are attached to the hand, the secondaries to the forearm, the tertials near the elbow; coverts overlay their roots. Muscles in the chest move the whole wing; very few muscles lie in the wing itself, which keeps the wing light.',
  'Which three digits the bird hand keeps is debated: the fossils suggest I-II-III, the embryo II-III-IV. The model draws the bones of the folded wing in simplified form.',
  [['Primaries', '10 in most passerines, the outermost tiny (WFF, Pyle)'], ['Secondaries', '9 including 3 tertials (Pyle)'], ['Bones', 'humerus, radius, ulna, fused hand bone, three fingers']],
  cert='C1', refs=[R_JOINT, R_SKEL], ext=[WFF, PYLE, WBA, ORI],
  parts=['robin_humerus', 'robin_radius', 'robin_ulna', 'robin_carpometacarpus', 'robin_digits', 'robin_prim', 'robin_sec', 'robin_tert', 'robin_coverts', 'robin_alula', 'robin_wing_muscles'],
  related=['humerus_r', 'radius_ulna_r', 'hand_bones_r'])

F('robin_prim', 'Primaries: the main flight feathers', 'The primaries are the long flight feathers of the hand, the main thrust of a wing; most songbirds have ten, the outermost small.',
  'These are the long, stiff feathers at the tip of the wing. They are attached to the hand and do most of the work of flying. A robin has ten, of which the outermost is tiny; the model draws all ten per wing, overlapping like the slats of a blind. Click one to read how it is built.',
  'Each feather has a central shaft, the rachis, with a flat vane on each side made of side branches (barbs), which carry smaller branches (barbules) with tiny hooks. The hooks fasten neighbouring barbs together like Velcro, so the vane is a smooth surface that air cannot pass through. The base of the shaft, the hollow quill (calamus), sits in the skin and is anchored by ligaments to the bone.',
  'Most modern passerines have ten primaries, and a few have only nine, lacking the tiny outer one. Each primary can be replaced in moult. The vane, rachis and barbules are made of beta-keratin.',
  [['Primaries per wing', '10 in most modern passerines; the outermost is tiny'], ['Barbule spacing', '8 to 16 µm between neighbouring barbules on flight feathers of species from a hummingbird to a condor (J. R. Soc. Interface 2025)']],
  scale=.06, refs=[R_BIRD], ext=[WFF, PYLE, WFE, JRSI], related=['robin_barb', 'robin_keratin'], parts=['robin_rach'])
F('robin_sec', 'Secondaries', 'The secondaries are the flight feathers of the forearm; a passerine has nine including three tertials.',
  'The secondaries make up the inner part of the wing and form its broad surface. They are attached to the forearm bone, the ulna. A robin has nine in all, counting the three innermost ones, the tertials. The model draws six secondaries.',
  'Together the secondaries and primaries make a continuous, curved surface. The secondaries are symmetrical and shorter than the primaries, built for lift more than thrust.',
  'In passerines the secondaries number nine counting the tertials; other birds range from six (hummingbirds) to as many as 40 (some albatrosses).',
  [['Secondaries', '9 including 3 tertials in most passerines (Pyle)'], ['Range in birds', '6 (hummingbirds) to ≈ 40 (some albatrosses) (WFF)']], scale=.045, refs=[R_BIRD], ext=[WFF, PYLE])
F('robin_tert', 'Tertials', 'The three innermost secondaries, which lie over the folded wing like a roof.',
  'The tertials are the three feathers nearest the body, attached near the elbow. When the wing is folded they cover the bases of the primaries and the elbow.',
  'Technically the tertials are part of the secondary tract; they differ in having shafts set into the tissue near the elbow joint rather than into the ulna.',
  'They are drawn shorter and broader than the other secondaries.',
  [['Number', '3 (Pyle)']], scale=.03, refs=[R_BIRD], ext=[PYLE, WFF])
F('robin_coverts', 'Coverts: small feathers over the flight feathers', 'The coverts are short feathers that cover the shafts of the flight feathers and smooth the wing surface; there are several rows.',
  'Over the roots of the long feathers lie rows of shorter ones: the primary coverts, the greater, median and lesser coverts. They protect the shafts and smooth the airflow. In first-winter robins the tips of the coverts are yellow-brown and more obvious, which helps tell young birds from old.',
  'Coverts lie above and below the flight feathers: at least one layer on each side. In the model each of the four groups is drawn, from the long greater coverts to the small lesser coverts, as a set of overlapping blades.',
  'The number of coverts in each row is not given in the sources used; the model\'s counts are drawn to make the rows look right.',
  [['Rows', 'primary, greater, median, lesser coverts'], ['First winter', 'yellow-brown covert tips (WR)']], scale=.02, refs=[R_BIRD], ext=[WFF, WR])
F('robin_alula', 'Alula', 'The alula is a small group of feathers on the bird\'s "thumb", used like a slat on an aircraft wing for slow flight and landing.',
  'The alula is a few small feathers at the front of the wrist. When a bird slows down to land, it lifts the alula and the air stays smoothly attached to the wing instead of breaking away. The model draws three.',
  'The alula is borne by the first finger. It is not a flight feather in the strict sense, but it acts like the slats on an airplane wing, which keep lift at high angles of attack.',
  'The alula works like a leading-edge slat; the number of its feathers varies by species, and three are drawn.',
  [['Role', 'avoids stalling at low speed, as when landing (WFF; Bird flight)']], scale=.012, refs=[R_BIRD], ext=[WFF, FLY], related=['robin_flight'])
N('robin_rach', 'Rachis: the shaft of a feather', 'structure', .06, ['robin_prim'], 'The rachis is the stiff, tapering central shaft of a feather, with the vane growing out on each side.',
  'The rachis runs the length of the feather. It is a light, springy rod that bends and springs back. Below the vane it becomes the hollow quill that fits into the skin.',
  'The barbs are fused to the rachis in a row on each side. The rachis is thickest at the base, where it is cylindrical and hollow, and tapers to the tip.',
  'It is made of beta-keratin. In the model it is drawn as a thin tube, scaled by the feather length.',
  [['Material', 'beta-keratin (WFE)']], refs=[R_PRO], ext=[WFE], related=['robin_keratin'])
N('robin_tail', 'Tail feathers (12)', 'structure', .055, ['robin'],
  'The tail is a fan of twelve long feathers, which steers and brakes the bird in flight.',
  'Most passerines have twelve tail feathers, six on each side, and so does a robin. They are called rectrices (the singular is rectrix). The middle pair lies on top when the tail is closed. In flight the tail spreads to give lift and to steer. The feathers are anchored to the pygostyle, a small plate of fused tail bones.',
  'The tail feathers are held by a pad of muscle and fat at the base. Their count is not fixed in all birds: some passerines have 10, 8 or even 6, the superb lyrebird has 16.',
  'In the model the tail is drawn closed, with twelve feathers lying in a slightly rounded fan.',
  [['Tail feathers', '12 in most passerines (WPA)']], refs=[R_BIRD], ext=[WPA, WFF, PYLE], related=['robin_pygostyle'])
N('robin_tail_coverts', 'Tail coverts', 'structure', .025, ['robin'], 'Short feathers that cover the roots of the tail feathers from above and below.',
  'Over and under the base of the tail, rows of shorter feathers cover the roots of the twelve tail feathers. The upper ones are brown like the back; the under ones are pale buff.',
  'Like the wing coverts, they smooth the airflow and protect the shafts, with at least one layer above and below.',
  'Two rows each are drawn; the number is approximate.',
  [['Rows', 'upper and under, two drawn each']], refs=[R_BIRD], ext=[WFF])

# ---------------------------------------------------------------- legs and feet
N('robin_leg_shin', 'Shin (tibiotarsus)', 'structure', .035, ['robin'], 'The lowest part of the shin, where the long leg bone comes out of the belly feathers.',
  'The upper leg of a bird is hidden by the body feathers: the thigh bone and the knee are inside. What shows first is the shin, the tibiotarsus, which is the shin bone fused with some ankle bones. It is covered with a feathered or smooth skin that runs down to the ankle.',
  'The tibiotarsus is the longest leg bone of a robin. Its muscles, in the shin, sit high, close to the body, and long tendons run down to the toes, so the lower leg is light and thin.',
  'The shape and length of the visible shin depend on how the belly feathers are fluffed.',
  [['Bone', 'tibiotarsus: tibia fused with proximal tarsal bones']], refs=[R_BIRD], ext=[FEET], related=['robin_tibiotarsus'])
N('robin_leg_ankle', 'Ankle: the "backward knee"', 'structure', .004, ['robin'], 'The joint that looks like a backward knee is the ankle; the real knee is hidden in the belly feathers.',
  'The bend in a bird\'s leg that points backward is not the knee. It is the ankle (the heel). Birds walk on their toes, so their foot bones, the tarsus, are long and stand almost upright. The true knee is hidden in the feathers higher up and bends forward like yours.',
  'The ankle is the joint between the tibiotarsus and the tarsometatarsus. When a perching bird squats, bending the ankle tightens the toe-flexor tendon that runs behind it and curls the toes around the perch.',
  'The ankle (intertarsal) joint is a hinge. It is drawn as a small ball.',
  [['Joint', 'between the tibiotarsus and tarsometatarsus (Wikipedia)']], refs=[R_JOINT], ext=[FEET], related=['robin_perching'])
N('robin_leg_tarsus', 'Tarsus: the scaly foot bone', 'structure', .025, ['robin'], 'The tarsus is the long, scaly part of the leg, a foot bone that has become a leg segment.',
  'What looks like the lower leg of a bird is part of its foot. The long, thin tarsus is the fused foot bones (the tarsometatarsus), covered in horny scales. It adds an extra segment to the leg and lengthens the stride.',
  'The tarsometatarsus is a segment specific to birds; it gives the leg extra lever length. A robin has long legs for a bird of its size and hops on the ground.',
  'The tarsus is a straight rod with faint rings for the scales; real scales are in rows called scutes.',
  [['Bone', 'tarsometatarsus: fused foot bones, specific to birds (Wikipedia)']], refs=[R_BIRD], ext=[FEET], related=['robin_tarsometatarsus'])
N('robin_leg_toes', 'Toes: three forward, one back', 'structure', .018, ['robin'], 'A robin\'s foot has three toes pointing forward and one pointing back, the usual arrangement of a perching bird.',
  'Three toes point forward and one, the hind toe or hallux, points back. This is the arrangement of nearly all songbirds and most other perching birds, called anisodactyl. The toes have 3, 4 and 5 bones in the inner, middle and outer front toes and 2 in the hind toe.',
  'On a branch, the toes close around the perch from front and back. In this model the bird stands on a boulder, so its toes are spread on the rock.',
  'The toe bones number 3, 4, 5 and 2 in a typical perching bird. The model draws them with bones of that number.',
  [['Arrangement', 'anisodactyl: toes II, III, IV forward, toe I back'], ['Toe bones', '3, 4, 5 (II, III, IV) and 2 (I)']], refs=[R_BIRD], ext=[FEET, WBA], related=['robin_perching', 'robin_toe_bones'], parts=['robin_leg_hallux', 'robin_leg_claws'])
N('robin_leg_hallux', 'Hind toe (hallux)', 'structure', .01, ['robin'], 'The single toe pointing backward: the one that closes against the front toes in a perching grip.',
  'The hind toe points backward and is the first toe, the equivalent of our big toe. It is strong and ends in a long claw. When the robin perches, it closes against the three front toes.',
  'It has two bones. The claw is longer than those of the front toes.',
  'Drawn with a long, curved claw.',
  [['Bones', '2']], refs=[R_BIRD], ext=[FEET], related=['robin_leg_toes'])
N('robin_leg_claws', 'Claws', 'structure', .004, ['robin'], 'Each toe ends in a curved claw, a sheath of keratin over the last toe bone.',
  'The claws are the horny nails of the toes, strong enough to grip bark and rock. They are made of keratin like feathers and the bill, and they grow and wear.',
  'Each claw is a sheath of keratin over the last bone of the toe, as a human nail covers the end of a finger.',
  'The curve is drawn by eye.',
  [['Material', 'keratin']], refs=[R_BIRD], ext=[KER], related=['robin_keratin'])
