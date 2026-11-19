# Cards: skin, muscles, skeleton, organs, air sacs and lungs, nerves.
from robin_lib import *
CROP = src('Crop (anatomy) (Wikipedia)', 'https://en.wikipedia.org/wiki/Crop_(anatomy)')
def S(id, title, scale, summary, basics, deeper, expert, facts, **kw): return N(id, title, 'structure', scale, kw.pop('parents', ['robin']), summary, basics, deeper, expert, facts, **kw)

# ------------------------------------------------ layers (the legend and Auto point at these)
S('robin_skin', 'Skin', .15, 'The robin\'s skin is thin and light, and bare between the feather tracts.',
  'Under the feathers a bird\'s skin is thin. Feathers grow from small pits (follicles) in rows. Between the rows the skin is bare, which lets the feathers be raised and lowered by tiny muscles.',
  'Feathers, bill and claws are skin structures made of keratin, in the way that hair and nails are for us.',
  'The model draws the skin as a thin shell. The real skin varies in thickness from place to place.',
  [['Skin derivatives', 'feathers, bill sheath, claws, scales of the legs']], refs=[R_ANTISSUE], ext=[WFE], related=['skin'])
S('robin_muscles', 'Muscles', .1, 'The robin\'s muscles: the very large flight muscles of the breast, with smaller muscles in the neck, back, wing, tail and legs.',
  'A flying bird puts most of its muscle in the breast, close to the centre of the body, so that the wings are light. Muscle drives everything the robin does: beating the wing, turning the head, hopping, and singing.',
  'Click a muscle to read what it does. The flight muscles are the pectoralis and supracoracoideus.', 'The muscle shapes are schematic, drawn as simple solids.', [['Largest', 'pectoralis (downstroke)']], refs=[R_MUSC, R_AMUS], ext=[WBA, FLY], related=['skeletal_muscle_tissue'])
S('robin_fill', 'Soft tissue (a stand-in)', .1, 'In the cut view the pale pink between the organs is a stand-in for fat, connective tissue and the many small parts that are not drawn.',
  'A real bird has no empty spaces inside: between the organs there are fat, connective tissue and fluid. In the cut-open view the model fills the gaps with a pale pink shape so that the cut looks solid. It is a drawing aid and not a tissue.',
  'The fill is a closed shape set a few millimetres inside the skin.', 'It carries no information about the real tissue.', [['Status', 'stand-in, not a structure']], refs=[R_ANTISSUE])
S('robin_skeleton', 'Skeleton', .12, 'A bird\'s skeleton is light and fused: hollow bones, a keeled breastbone, a wishbone, a fused hand, a long neck.',
  'The skeleton holds the robin up and gives the muscles something to pull on. In a bird, many bones that are separate in us are fused into one: the hand, the hip and lower back, the tail tip. The breastbone carries a deep keel and the two collarbones are fused into a wishbone.',
  'Click a bone to read what it is and what it is in a human. A robin has a long neck of 14 bones, very few teeth (none), and ribs with little hooks.',
  'The bone shapes are drawn as simplified rods and plates.', [['Neck vertebrae', '14 (songbirds)'], ['Wing', 'fused hand, three fingers']], refs=[R_SKEL], ext=[WBA, WEB], related=['skeletal_system'])
S('robin_organs', 'Organs', .1, 'The robin\'s organs: heart, liver, stomach and gizzard, intestines, kidneys, eyes, with the lungs and air sacs shown separately.',
  'Inside the body lie the heart, the liver, a two-part stomach, the intestines and the kidneys. A bird has no teeth and no bladder; it grinds food in a muscular stomach, the gizzard, and passes uric acid with its droppings through one opening, the cloaca.',
  'Click an organ to see what it is. The lungs and the air sacs are in their own layer.', 'Organ shapes, sizes and positions are approximate.', [['Single exit', 'cloaca']], refs=[R_DIG, R_EXC], ext=[WBA], related=['digestive_system'] if False else None)

# ------------------------------------------------ muscles
S('robin_pectoralis', 'Pectoralis: the downstroke muscle', .03, 'The pectoralis is the robin\'s biggest muscle, a sheet over the breast that pulls the wing down.',
  'The pectoralis lies on each side of the keel, over the ribs and the underside of the breast. When it contracts it pulls the wing down, and the downstroke makes most of the lift and thrust of a beat. This is why a bird has such a plump breast.',
  'The muscle runs from the keel and the wishbone to the humerus, on its crest. It is the muscle bird-lovers mean by "breast". It is made of fibres packed with mitochondria that supply the energy of flight; click the muscle\'s scene to look inside.',
  'The pectoralis is the larger of the two flight muscles. It is drawn as a thick sheet over the sternum; its size is schematic.',
  [['Job', 'pulls the wing down (downstroke)'], ['Human match', 'pectoralis major']], refs=[R_MUSC, R_AMUS], ext=[WBA, FLY], related=['pectoralis_major', 'robin_flight'], parts=['robin_flight_muscle_scene'])
S('robin_supracoracoideus', 'Supracoracoideus: the upstroke muscle', .02, 'The supracoracoideus lies under the pectoralis, yet it lifts the wing, by pulling a tendon over the shoulder like a rope over a pulley.',
  'It would be natural to put the muscle that lifts the wing on the bird\'s back, but the supracoracoideus lies on the breast, beside the keel, under the pectoralis. A long tendon runs from it up through a gap in the shoulder, the triosseal canal, and over the top to the humerus. The gap acts as a pulley: a pull down in the breast becomes a lift of the wing.',
  'The muscle is the smaller of the two flight muscles. Keeping both heavy muscles low in the body, near the centre of gravity, keeps the bird stable. This arrangement is a feature of modern birds; early birds such as Archaeopteryx may have lacked it.',
  'The tendon passes through the triosseal canal, formed by the coracoid, the scapula and the wishbone. The canal is drawn as a small ring in the cut-open wing view.',
  [['Job', 'raises the wing (upstroke)'], ['Pulley', 'the triosseal canal at the shoulder']], refs=[R_MUSC], ext=[FLY, WBA], related=['robin_canal', 'robin_flight'])
S('robin_sc_tendon', 'Tendon of the supracoracoideus', .02, 'The strong cord that carries the pull of the upstroke muscle over the shoulder to the top of the wing bone.',
  'A tendon is a tough cord that joins muscle to bone. This one starts in the supracoracoideus on the breast, passes up through the shoulder pulley, and ends on the humerus.',
  'Because the tendon is long, the heavy muscle can stay in the breast and only a light cord runs to the wing.', 'Drawn as a thin tube along its true route in outline.',
  [['Route', 'muscle, triosseal canal, top of the humerus']], refs=[R_MUSC], ext=[FLY], related=['tendon', 'robin_canal'])
S('robin_canal', 'Triosseal canal: the shoulder pulley', .005, 'A gap between three bones of the shoulder through which the upstroke tendon runs.',
  'Three bones meet at the shoulder: the coracoid, the scapula and the wishbone. They leave a small opening, the triosseal canal ("three-bone canal"). The tendon of the upstroke muscle runs through it, so that the pull is turned from downward to upward.',
  'It works as a pulley and lets both big flight muscles sit low on the breast.', 'The ring in the model marks the canal; it is simplified.', [['Bones', 'coracoid, scapula, wishbone']], refs=[R_JOINT], ext=[FLY, WBA], related=['robin_supracoracoideus'])
S('robin_neck_muscles', 'Neck, back and tail muscles', .04, 'Long muscles along the neck and back that hold the head and body steady, and a pair at the base of the tail.',
  'A bird\'s head weighs little but its neck is long and flexible. Long muscles along the neck and back move the head and keep the trunk rigid in flight. Short muscles at the base of the tail steer the tail feathers.',
  'The neck has 14 bones; the back is stiff because many of its bones are fused.', 'Drawn as simple tubes and blobs.', [['Neck bones', '14']], refs=[R_MUSC], ext=[WEB, WBA])
S('robin_jaw_muscle', 'Jaw muscle', .01, 'The muscle that closes the lower jaw, a pad behind and below the eye.',
  'The jaw muscle lies on the side of the head, behind the eye, and pulls the lower jaw shut. A robin\'s bill is a delicate tweezer, so this muscle is small.',
  'The jaw hinges at the quadrate bone on each side of the skull.', 'Drawn as an ellipsoid.', [['Job', 'closes the lower jaw']], refs=[R_MUSC], ext=[WBA])
S('robin_wing_muscles', 'Wing muscles', .04, 'Small, slim muscles in the upper and lower arm that fold and unfold the wing; the big ones are in the breast.',
  'The wing itself has few muscles: the big flight muscles are in the chest, and long tendons run to the wing. The small muscles in the arm fold and spread the wing and adjust the angle of the feathers.',
  'Keeping weight out of the wing makes it easier to flap.', 'Drawn as two tapering muscle bellies on each side.', [['Position', 'upper arm and forearm']], refs=[R_MUSC], ext=[FLY], related=['forearm_muscles'])
S('robin_thigh_muscles', 'Thigh muscles', .025, 'The thick thigh muscles, inside the belly feathers, that swing the leg.',
  'The legs of a bird are thin below but powerful above. The thigh muscles are hidden under the belly feathers; they drive hopping and take off.',
  'Long tendons run from the muscles to the toes.', 'Drawn as a capsule from the hip to the knee.', [['Where', 'hip to knee, hidden under feathers']], refs=[R_MUSC], ext=[FEET])
S('robin_shank_muscles', 'Shank muscles', .02, 'Muscles of the shin that move the foot by long tendons.',
  'The muscles that curl the toes and extend the foot lie high on the shin, near the knee, so the lower leg can be thin and light. Long tendons run down the back of the ankle.',
  'The toe-flexor tendon is the one that locks the toes on a perch.', 'Drawn as a tapering capsule.', [['Position', 'high on the shin']], refs=[R_MUSC], ext=[FEET], related=['robin_tendon'])
S('robin_tail_muscles', 'Tail muscles', .008, 'Small muscles at the root of the tail that spread, fold and tilt the tail feathers.',
  'The twelve tail feathers are held by a pad of muscle and fat at the base, round the pygostyle. These muscles can spread the tail like a fan and swing it up and down.',
  'The pygostyle gives them a rigid anchor.', 'Two small ellipsoids are drawn.', [['Anchor', 'the pygostyle']], refs=[R_MUSC], ext=[WBA], related=['robin_pygostyle'])
S('robin_tendon', 'Perching tendon', .03, 'A long tendon runs behind the ankle to the toes; bending the ankle tightens it and curls the toes without effort.',
  'This is the tendon that makes a perch grip easy. It runs from the shin muscles, behind the ankle joint and down the back of the foot, where it splits to the toes. When the ankle bends, the tendon is stretched and pulls the toes shut. The tendon and the tissue around it are rough, so the grip holds until the leg straightens.',
  'Because the lock needs no continuous muscle effort, a bird can hold on while resting.', 'In the model the tendon is drawn with ridges where it passes the ankle, to stand for the rough surface; the real ridges and sheath are finer.',
  [['Route', 'shin muscle, behind the ankle, down the back of the foot, to the toes'], ['Release', 'when the leg straightens']], cert='C2', refs=[R_JOINT], ext=[src('Why don\'t birds fall off branches when they sleep (Science ABC)', 'https://www.scienceabc.com/nature/animals/why-dont-birds-fall-off-branches-when-they-sleep.html'), FEET],
  openq=['How much do birds rely on the lock while perching and sleeping? A study of starlings found sleeping birds did not bend the leg enough to engage it.'], related=['tendon', 'robin_perching'])

# ------------------------------------------------ skeleton
S('robin_skull', 'Skull', .025, 'A light, toothless skull with huge eye sockets.',
  'The skull is a thin shell of fused bone with no teeth. Most of its side is taken by the two eye sockets (orbits). The bill is the jaw bones sheathed in horn.',
  'The braincase holds the brain; behind the eyes, the jaw muscles attach. The skull sits on the first neck vertebra by one round joint, which lets the head turn far.',
  'Drawn as a smooth braincase with two sockets; sutures are not shown.', [['Teeth', 'none']], refs=[R_BIRD], ext=[WBA], related=['skull'])
S('robin_upper_jaw', 'Upper jaw bone', .015, 'The slender bone inside the upper half of the bill.',
  'The upper bill has a bone core, the premaxilla, covered with a sheath of horn. The two nostrils open on it.', 'The bone is fused to the skull.', 'Drawn as a thin cone.', [['Covered by', 'horny sheath of keratin']], refs=[R_BIRD], ext=[WBA], related=['robin_bill'])
S('robin_mandible', 'Lower jaw bone', .02, 'The two-pronged bone of the lower bill, hinged on each side of the skull.',
  'The lower jaw is made of two slender bones, joined at the tip, that hinge on the skull at the quadrate bones. A horny sheath covers it.', 'In humans the lower jaw hinges directly on the skull; in a bird a separate bone, the quadrate, sits in the hinge.', 'Drawn as two thin rods.', [['Hinge', 'the quadrate bone']], refs=[R_BIRD], ext=[WBA], related=['mandible'])
S('robin_cervical', 'Neck vertebrae (14)', .04, 'A songbird\'s neck has 14 vertebrae, twice as many as a person\'s.',
  'A robin\'s neck is flexible because it has 14 small vertebrae, where a human has seven. The neck lets the bird reach its whole body with its bill to preen, and turn its head far to look back.',
  'In a study of 159 songbird skeletons from 47 species, all but two had 14 neck vertebrae, counting the last two, which carry short floating ribs (the cervico-dorsal vertebrae). Birds in general range from 8 to as many as 25 (swans).',
  'The model draws 14 beads. Vertebrae 13 and 14 carry small floating ribs in most songbirds; these are not drawn.',
  [['Neck vertebrae', '14 in all but 2 of 159 songbirds (Webster and Goff)'], ['Range in birds', '8 to 25 (WBA)'], ['Human', '7']], refs=[R_SKEL], ext=[WEB, WBA], related=['skeletal_system'])
S('robin_thoracic', 'Chest vertebrae', .03, 'The vertebrae of the back that carry the ribs.',
  'The vertebrae of the chest carry the ribs. In birds they are stiffer than in us, so the body is a rigid frame that the wings can pull against.',
  'In a house sparrow the ribs that join the breastbone are on vertebrae 15 to 18; one or two more ribs hang from the front of the fused hip bone.', 'The model draws five beads.', [['Ribs that reach the breastbone', '4 in a house sparrow (Webster and Goff)']], refs=[R_SKEL], ext=[WEB])
S('robin_synsacrum', 'Synsacrum: the fused lower back and hip', .03, 'The lower back and hip bones are fused into one rigid piece, the synsacrum.',
  'In a bird many vertebrae of the lower back and hip are fused into a single bone, the synsacrum, together with the hip bones. It makes a stiff, strong platform for the legs, and a stiff trunk helps in flight.',
  'In birds in general it includes one thoracic, six lumbar, two sacral and five sacro-caudal vertebrae fused to the hip bone (ilium). In songbirds the front part includes three or four thoracodorsal vertebrae.',
  'Drawn as a tapering bar with a flat plate on each side.', [['Fused vertebrae', '14 in birds in general (1 + 6 + 2 + 5) (WBA)']], refs=[R_SKEL], ext=[WBA, WEB], related=['sacrum', 'pelvis'])
S('robin_caudal', 'Tail vertebrae', .015, 'A short chain of free tail bones between the hip and the pygostyle.',
  'A robin has only a few free tail bones, and they end in the pygostyle. A house sparrow has six free tail vertebrae (a figure in a songbird skeleton study); the model draws six.',
  'These bones give the tail some movement near its root.', 'Drawn as six small beads.', [['Free tail vertebrae', '6 in a house sparrow (Webster and Goff)']], refs=[R_SKEL], ext=[WEB])
S('robin_pygostyle', 'Pygostyle: the tail plate', .005, 'The last tail bones are fused into a small plate, the pygostyle, which holds the tail feathers.',
  'Unlike a mammal, a bird has no long tail of bones. The last few tail vertebrae are fused into a flat plate called the pygostyle ("rump pole"), and the tail feathers are fastened round it. The tail is feathers, not bone.',
  'The pygostyle is formed from the last four caudal vertebrae, although some sources say up to ten.', 'Drawn as a small plate.', [['Fused vertebrae', 'the last ≈ 4 (up to 10 by some counts) (WBA)']], refs=[R_SKEL], ext=[WBA], related=['robin_tail'])
S('robin_sternum', 'Breastbone with its keel', .03, 'The breastbone carries a deep keel, a blade that the flight muscles are anchored to.',
  'The sternum is a broad plate with a deep ridge down the middle, the keel, like the keel of a boat. The big flight muscles are attached on both sides of it. Flightless birds such as ostriches have no keel.',
  'A deeper keel gives more area for muscle. The keel gives the breast its shape in a plucked bird.',
  'The keel and the plate are drawn smooth; the real sternum has notches and a hole pattern that differ by species.',
  [['Keel', 'carries the flight muscles; absent in ostriches (WBA)']], refs=[R_SKEL], ext=[WBA], related=['sternum'])
S('robin_furcula', 'Wishbone (furcula)', .02, 'The two collarbones are fused into a V or U, the wishbone, which springs as the wings beat.',
  'A bird\'s collarbones are joined into one bone, the furcula or wishbone. Birds are the only living vertebrates with fused collarbones. It braces the shoulders apart against the pull of the flight muscles and can flex like a spring.',
  'Humans have two separate collarbones.', 'Drawn as a U.', [['Fused collarbones', 'only in birds among living vertebrates (WBA)']], refs=[R_SKEL], ext=[WBA], related=['clavicle_r'])
S('robin_shoulder_girdle', 'Coracoids and shoulder blades', .02, 'The coracoid is a strong strut from the shoulder to the breastbone; the shoulder blade is a slender blade along the ribs.',
  'The coracoids brace the shoulder against the breastbone and take the force of the wing beat. The shoulder blades are long and thin and lie along the back of the ribs. Together with the wishbone they make the shoulder pulley.',
  'In humans the coracoid is a small hook on the shoulder blade.', 'Drawn as rods.', [['Coracoid', 'strut between shoulder and breastbone']], refs=[R_SKEL], ext=[WBA], related=['scapula_r'], parents=['robin_skeleton'])
S('robin_ribs', 'Ribs and their hooks', .03, 'The ribs have small hooks, the uncinate processes, that overlap the next rib and stiffen the cage.',
  'The ribs form a stiff cage round the lungs, heart and liver. Each has a little backward hook, the uncinate process, that overlaps the next rib. Only birds have bony hooks of this kind.',
  'The processes brace the rib cage, anchor muscles of the shoulder blade, and help breathing. In a house sparrow, uncinate processes lie on ribs 14 to 18.',
  'The model draws five pairs of ribs; the real count varies.', [['Uncinate processes', 'bony in birds only (crocodiles have cartilage) (Wikipedia)']], refs=[R_SKEL], ext=[UNC, WEB], parts=['robin_uncinate'], related=['dog_ribs'] if False else None)
S('robin_uncinate', 'Uncinate processes', .006, 'Little bony hooks on the ribs.', 'See the Ribs card: each rib has one that overlaps the next rib.', 'Birds only.', 'Drawn as short rods.', [['In birds', 'bony']], refs=[R_SKEL], ext=[UNC], parents=['robin_ribs'])
S('robin_pelvis', 'Pelvis', .03, 'The hip bones are fused to the lower back; the joint for the leg is in the middle of the side.',
  'The three hip bones (ilium, ischium, pubis) are fused to the synsacrum. The socket for the thigh bone is in the middle.',
  'In humans the hip bones form a bowl closed in front.', 'Drawn as plates.', [['Bones', 'ilium, ischium, pubis']], refs=[R_SKEL], ext=[WBA], related=['pelvis'])
S('robin_humerus', 'Humerus: the upper arm', .02, 'The upper arm bone of the wing, the same bone as in your upper arm.',
  'The humerus runs from the shoulder to the elbow. In the folded wing it lies back along the body. It is the bone you feel in your upper arm; a bird\'s is hollow and light.',
  'It is one of the bones that may be air-filled. The tendon of the upstroke muscle ends on its upper end.', 'Drawn as a rod with bulbous ends.',
  [['Human match', 'humerus']], refs=[R_SKEL], ext=[WBA, FLY], related=['humerus_r'], parts=['robin_bone_scene'])
S('robin_radius', 'Radius and ulna', .02, 'The two forearm bones, as in your forearm; the ulna carries the secondary flight feathers.',
  'The forearm has two bones, the radius and the ulna, as yours does. The secondary feathers are attached to the ulna.',
  'The ulna is thicker than the radius.', 'Drawn as two thin rods.', [['Human match', 'radius and ulna']], refs=[R_SKEL], ext=[WBA, PYLE], related=['radius_ulna_r'])
S('robin_ulna', 'Ulna', .02, 'The thicker forearm bone, with the secondary feathers attached.', 'See the Radius and ulna card.', 'The secondaries are attached to the ulna; the tertials to the tissue at the elbow.', 'Drawn as a rod.', [['Feathers', 'secondaries']], refs=[R_SKEL], ext=[PYLE], related=['radius_ulna_r'])
S('robin_carpometacarpus', 'Fused hand bone (carpometacarpus)', .015, 'The wrist and palm bones are fused into one hand bone that carries the primary flight feathers.',
  'In your hand the wrist has eight small bones and the palm has five. In a bird the wrist bones and palm bones are fused into one, the carpometacarpus. It carries the primary feathers and is the part of the wing that makes the main thrust.',
  'The fused hand gives a rigid support to the long feathers.', 'Drawn as a rod.', [['Human match', 'wrist and palm (carpals and metacarpals)']], refs=[R_SKEL], ext=[WBA, FLY], related=['hand_bones_r'])
S('robin_digits', 'Finger bones and the alular digit', .01, 'Only three fingers remain; the "thumb" carries the alula.',
  'A bird\'s hand has three digits. The short thumb carries the alula; the longest finger holds the outer primaries. Which digits of the original five these are is debated.',
  'Fossils suggest digits I-II-III; the embryo suggests II-III-IV.', 'Drawn as two thin rods and a stub.', [['Digits', '3'], ['Identity', 'debated']], cert='C3', refs=[R_SKEL], ext=[ORI],
  openq=['Which digits does the bird hand keep: I-II-III (fossils) or II-III-IV (embryos)?'], related=['hand_bones_r'])
S('robin_leg_bones', 'Leg bones: femur, tibiotarsus, fibula, tarsometatarsus', .03, 'The thigh bone lies inside the body; the long shin bone and the foot bone make the thin legs.',
  'Inside the belly feathers the thigh bone (femur) runs forward to the knee. Below the knee is the shin bone, the tibiotarsus, with a thin splint (the fibula). The next long bone is the foot bone, the tarsometatarsus, which stands up from the ground and makes what looks like a lower leg.',
  'The joint between the tibiotarsus and the tarsometatarsus is the ankle.', 'Drawn as rods.', [['Human match', 'femur, tibia and fibula; the foot bones are fused'], ['Ankle', 'between tibiotarsus and tarsometatarsus']], refs=[R_SKEL], ext=[FEET],
  related=['femur_r', 'tibia_fibula_r', 'foot_bones_r'], parts=['robin_femur', 'robin_tibiotarsus', 'robin_fibula', 'robin_tarsometatarsus'])
for _id, _t, _s in [('robin_femur', 'Thigh bone (femur)', 'The thigh bone, inside the belly feathers.'), ('robin_tibiotarsus', 'Shin bone (tibiotarsus)', 'The long shin bone.'), ('robin_fibula', 'Fibula', 'A thin splint beside the shin bone.'), ('robin_tarsometatarsus', 'Foot bone (tarsometatarsus)', 'The long, upright foot bone.')]:
    S(_id, _t, .03, _s, 'See the Leg bones card for how the leg bones fit together.', 'It is part of the leg: femur, tibiotarsus, fibula, tarsometatarsus.', 'Drawn as a rod.', [['Part of', 'leg bones']], refs=[R_SKEL], ext=[FEET], parents=['robin_leg_bones'], related=['femur_r'])
S('robin_toe_bones', 'Toe bones', .018, 'The toes have 3, 4 and 5 bones in the three front toes and 2 in the hind toe.',
  'Each toe is a chain of small bones. In a perching bird the three front toes have 3, 4 and 5 bones and the hind toe has two.', 'The last bone carries the claw.', 'Drawn as short rods end to end.', [['Bones', '3, 4, 5 and 2']], refs=[R_SKEL], ext=[FEET], related=['foot_bones_r'])
