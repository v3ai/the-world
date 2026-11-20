# Rewrites of the thin or duplicated part cards (legs, jaws, spine, shoulder, hand, nerves, air sacs, organs, eye parts).
# Run after robin_cards_*.py (robin_nodes.py imports it). Every statement is from a source named in `ext`: the Bird anatomy,
# Bird feet and legs, Bird vision, Gizzard, Furcula, Pygostyle and Cloaca pages (Wikipedia, read as raw text this session),
# Webster and Goff, and the open-access papers named below. "Drawn" sentences say what the model shows, not what the animal has.
from robin_lib import *

def fix(id, **k):
    n = [x for x in NODES if x['id'] == id]
    assert len(n) == 1, id
    n = n[0]
    for key, v in k.items():
        if key in ('basics', 'deeper', 'expert'): n['layers'][key] = v
        elif key == 'facts': n['facts'] = [list(f) for f in v]
        elif key == 'openq': n['open_questions'] = v
        elif key == 'dyk': n['did_you_know'] = v
        elif key == 'cert': n['certainty'] = v
        else: n[key] = v

CROP = src('Crop (anatomy) (Wikipedia)', 'https://en.wikipedia.org/wiki/Crop_(anatomy)')
KINESIS = src('Cranial kinesis (Wikipedia)', 'https://en.wikipedia.org/wiki/Cranial_kinesis')
FURC = src('Furcula (Wikipedia)', 'https://en.wikipedia.org/wiki/Furcula')
PYGO = src('Pygostyle (Wikipedia)', 'https://en.wikipedia.org/wiki/Pygostyle')
SYNS = src('Synsacrum (Wikipedia)', 'https://en.wikipedia.org/wiki/Synsacrum')
GIZ = src('Gizzard (Wikipedia)', 'https://en.wikipedia.org/wiki/Gizzard')
CLO = src('Cloaca (Wikipedia)', 'https://en.wikipedia.org/wiki/Cloaca')
VIS = src('Bird vision (Wikipedia)', 'https://en.wikipedia.org/wiki/Bird_vision')
BRPLEX = src('The Avian-RUM block: an anatomical cadaveric study of wing nerves in birds (Animals 2026)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12838129')
SCIA = src('Sciatic nerve, human (Wikipedia)', 'https://en.wikipedia.org/wiki/Sciatic_nerve')
VAG = src('Vagus nerve, human (Wikipedia)', 'https://en.wikipedia.org/wiki/Vagus_nerve')
HUMAN_NERVES = 'There is no separate card for that nerve in the human body, so the human match is the general Peripheral nerves card.'

# ---------------------------------------------------------------- legs
fix('robin_leg_bones', summary='A bird\'s leg has three long segments: the thigh bone hidden in the body, the shin bone, and a foot bone that stands up as what looks like a lower leg.',
  basics='The thigh bone (femur) is hidden in the belly feathers; below the knee come the shin bone (tibiotarsus) with a thin splint (fibula), and then the tarsometatarsus, a long foot bone. The bend you can see in a bird\'s leg is the ankle, between the shin bone and that foot bone. Click each bone for its own card.',
  deeper='A person has a thigh bone, two shin bones, a set of small ankle bones and five long foot bones. In the bird the upper ankle bones have fused onto the shin bone and the long foot bones have fused into one, which adds a third long segment that humans do not have. The toes then follow.',
  expert='The bones of the lower leg are the tibiotarsus (the tibia with the upper foot bones fused onto it) and the tarsometatarsus (the lower foot bones merged with metatarsals II, III and IV), and the first metatarsal stays separate as the base of the hind toe (Bird feet and legs). The leg bones are the heaviest of a bird\'s skeleton, which keeps its centre of gravity low (Bird anatomy). The model draws all four as plain rods.',
  facts=[['Segments', 'thigh (femur), shin (tibiotarsus, with the fibula), foot bone (tarsometatarsus), toes'], ['Human match', 'femur, tibia and fibula, ankle and foot bones; the bird fuses several of them'], ['Visible joint that bends backward', 'the ankle']],
  ext=[FEET, WBA], related=['femur_r', 'tibia_fibula_r', 'foot_bones_r'])
fix('robin_femur', summary='The thigh bone, from the hip socket to the knee, hidden inside the body feathers.',
  basics='The femur runs from the hip socket in the fused pelvis to the knee. The knee points forward, as yours does, but it is hidden in the feathers, so the joint you see bending backward lower down is the ankle and not the knee.',
  deeper='This is the same bone as the human thigh bone. At the knee it meets the tibiotarsus and the fibula. Because it sits inside the body outline, a robin looks as if its leg starts at the belly.',
  expert='The femur fits into the hip socket (acetabulum), where the ilium, ischium and pubis meet; in some flightless birds (ostrich, emu) the femur is hollow and air-filled. The model draws it as a rod whose length and angle are chosen by eye.',
  facts=[['Hip end', 'hip socket (acetabulum) of the pelvis'], ['Knee end', 'joins the tibiotarsus and fibula; the knee points forward, hidden in feathers'], ['Human match', 'femur']],
  ext=[WBA, FEET], related=['femur_r', 'robin_pelvis', 'robin_thigh_muscles'])
fix('robin_tibiotarsus', summary='The shin bone: the tibia fused with the upper ankle bones, the longest bare-looking segment of the leg.',
  basics='The tibiotarsus is a bird\'s shin bone. Its name says what it is: the tibia fused with the upper bones of the ankle. At its top, next to the knee, it has a raised ridge called the cnemial crest.',
  deeper='In a human the shin bone is the tibia alone, and the ankle is a cluster of separate small bones below it. In the robin those upper ankle bones are part of the shin bone, so the ankle joint lies at the bottom of the tibiotarsus, between it and the foot bone.',
  expert='The upper foot bones are fused onto the tibia, and one set of ankle bones (the centralia) is missing altogether (Bird feet and legs). The ankle joint within the tarsus is also found in some reptiles. The model draws the bone as a rod with no crest.',
  facts=[['Formed by', 'tibia fused with the upper ankle bones'], ['Ridge at the knee', 'cnemial crest'], ['Human match', 'tibia (shin bone); the ankle bones are separate in a human']],
  ext=[FEET, WBA], related=['tibia_fibula_r', 'robin_leg_shin', 'robin_leg_ankle'])
fix('robin_fibula', summary='The thin bone that lies against the shin bone; in birds it is much reduced.',
  basics='Birds have a fibula, but it is a thin splint pressed against the shin bone. It runs alongside the tibiotarsus for part of its length and does not reach the ankle.',
  deeper='In a human the fibula is a slender but complete bone beside the tibia, reaching the ankle. In most birds it has shrunk, and only penguins keep a full-length one. Birds put the strength of the lower leg into the one fused shin bone.',
  expert='The fibula is reduced and stuck to the tibia, and usually runs about two thirds of its length; only penguins keep a full-length fibula (Bird feet and legs). The model draws a thin rod beside the shin bone, which is hard to click for that reason.',
  facts=[['Length', 'usually about two thirds of the shin bone'], ['Full-length fibula', 'penguins only (among birds)'], ['Human match', 'fibula, which is complete in a human']],
  ext=[FEET, WBA], related=['tibia_fibula_r', 'robin_tibiotarsus'])
fix('robin_tarsometatarsus', summary='The long, upright foot bone: a segment of leg found only in birds, which gives the leg its extra lever length.',
  basics='What looks like a robin\'s lower leg is really part of its foot. The long bone, the tarsometatarsus, stands upright, and the bird walks on its toes. It is covered with scales and no feathers.',
  deeper='A human foot has seven ankle bones and five long foot bones that lie flat on the ground. In the bird the lower ankle bones and three of the long foot bones have fused into one bone, which stands up and adds a whole extra segment to the leg. This lengthens the leg like a longer lever.',
  expert='The tarsometatarsus is made of the lower ankle bones merged with metatarsals II, III and IV, and metatarsal I stays separate as the base of the hind toe (Bird feet and legs). Most birds are digitigrade, walking on the toes. Scales of the bare lower leg are keratin (Bird anatomy). The model draws the bone as a rod.',
  facts=[['Formed by', 'lower ankle bones and metatarsals II, III and IV fused'], ['Found in', 'birds only'], ['Human match', 'ankle and long foot bones, which stay separate in a human']],
  ext=[FEET, WBA], related=['foot_bones_r', 'robin_leg_tarsus', 'robin_leg_toes'])
fix('robin_toe_bones', basics='Each toe is a chain of small bones: three in the inner front toe, four in the middle one, five in the outer one, and two in the hind toe. The last bone of each toe carries the claw.',
  deeper='A human big toe has two bones and the other toes three; the robin\'s hind toe (the hallux) matches the big toe and also has two. The extra bones in the outer front toes make them longer and more flexible, which helps them close round a perch.',
  expert='The 3, 4, 5, 2 pattern is stated for a typical perching bird (Bird feet and legs), not measured on a robin; the hallux is the same bone as the human big toe. The model draws the bones in that number as short rods.',
  facts=[['Bones', '3, 4, 5 (toes II, III, IV) and 2 (toe I)'], ['Human match', 'toe bones; the hind toe matches the big toe']], ext=[FEET], related=['foot_bones_r', 'robin_leg_toes'])
fix('robin_leg_hallux', basics='The hind toe points backward and is the first toe, the equivalent of our big toe. It has two bones. On a perch it closes against the three front toes.',
  deeper='The hallux is the same bone as the human big toe (Bird feet and legs). In a perching bird it is on the opposite side of the foot from the three forward toes, which is what makes the grip a pincer.',
  expert='Its claw is a keratin sheath over the last toe bone; the base of the hind toe is the unfused first metatarsal. The model draws it with a long curved claw, by eye.',
  facts=[['Bones', '2'], ['Human match', 'big toe (hallux)']], ext=[FEET], related=['robin_leg_toes', 'foot_bones_r'])
fix('robin_leg_claws', basics='Each toe ends in a claw: a sheath of keratin over the last toe bone, strong enough to grip bark and rock. A human nail covers the end of a finger in the same way, but a claw curves round the toe.',
  deeper='Bird claws, bills and the scales of the lower leg are all made of keratin; bird scales are beta-keratin, and some foot structures once thought to be scales are alpha-keratin (Bird anatomy). Claws grow and wear down in use.',
  expert='The exact keratin type of a robin\'s claw is not given here: the Keratin page says beta-keratin is found in the feathers, beaks and claws of birds and reptiles, while alpha-keratin also occurs in birds. The curve in the model is drawn by eye.',
  facts=[['Material', 'keratin over the last toe bone'], ['Human match', 'fingernail (also keratin)']], ext=[KER, WBA], related=['robin_keratin'])

# ---------------------------------------------------------------- head and jaws
fix('robin_skull', basics='The skull is a thin shell of bone with no teeth, and the two eye sockets take up much of its side. The bill is the jaw bones sheathed in horn. A bird\'s skull weighs only about 1 % of its body weight.',
  deeper='A bird skull is made of many small bones that do not overlap, like the juvenile skull of its dinosaur ancestors. The skull sits on the first neck vertebra by a single round knob (the occipital condyle), which lets the head turn far.',
  expert='The skull has five major bones (frontal, parietal, premaxillary, nasal and the mandible) and the eye is ringed by small bones (the scleral ring) (Bird anatomy). Birds have lost the bone behind the eye and the teeth. The model draws a smooth braincase with two sockets; the joints between the bones are not shown.',
  facts=[['Weight', 'about 1 % of body weight (Bird anatomy)'], ['Teeth', 'none']], ext=[WBA], related=['skull'])
fix('robin_upper_jaw', summary='The bone inside the upper half of the bill: the premaxilla, with the horny sheath over it.',
  basics='The upper bill has a bone core, the premaxilla, with a sheath of horn over it. The nostrils open at its base. In birds this one bone has grown large and become the upper bill, while the upper jaw bone behind it (the maxilla) is small.',
  deeper='All living birds can move the upper jaw relative to the braincase, a trait called cranial kinesis; it is easiest to see in parrots. In songbirds the upper bill can swing a little about a flexible zone at its base, but this card does not state how far a robin\'s bill moves.',
  expert='The premaxilla has enlarged to form the bill while the maxilla has shrunk. The bill is covered by the rhamphotheca, a thin keratin layer. The bone is not rigidly fixed to the skull. The model draws a thin cone.',
  facts=[['Core of the upper bill', 'premaxilla'], ['Covering', 'keratin sheath (rhamphotheca)'], ['Movement', 'upper jaw moves relative to the braincase in all living birds (cranial kinesis)']],
  ext=[WBA, KINESIS], related=['robin_bill'])
fix('robin_mandible', basics='The lower jaw is made of two slender bones, joined at the tip, that hinge on the skull at the quadrate bones. A horny sheath covers it.',
  deeper='In a human the lower jaw hinges straight on the skull; in a bird a separate bone, the quadrate, sits in the hinge. The quadrate also takes part in the movement of the upper bill, so opening the mouth and lifting the upper bill are linked.',
  expert='The mandible is one of the five major bones of the skull. The model draws two thin rods. The link between quadrate and upper bill is part of cranial kinesis, which differs between groups.',
  facts=[['Hinge', 'the quadrate bone'], ['Human match', 'mandible, which hinges directly on the skull']], ext=[WBA, KINESIS], related=['mandible'])
fix('robin_jaw_muscle', basics='The jaw muscle lies on the side of the head, behind the eye, and pulls the lower jaw shut. The muscles that close the jaws attach on the skull behind the eye.',
  deeper='The muscles that move the jaws attach on the skull behind the eyes. A bird has no teeth to power, so the jaw muscles are small beside the flight muscles.',
  expert='In birds the space for jaw muscles in the skull has been reduced. The model draws one ellipsoid on each side. Its mass is not given here.',
  facts=[['Job', 'closes the lower jaw']], ext=[WBA])
fix('robin_nostrils', basics='Birds breathe in through two small openings, the nares, near the base of the upper bill. They lead into the nasal passages, then down the windpipe.',
  deeper='Air entering through the nostrils is warmed, moistened and filtered in the nasal passages and the upper windpipe before it reaches the lungs (Bird anatomy). Many birds have a feather-covered flap over the opening; a robin has none that matters here.',
  expert='The nostrils open on the upper bill, not at its tip as in a mammal, which is a description, not an explanation: the reason for the position is not given on this card. The model draws two small ovals.',
  facts=[['Number', '2'], ['Leads to', 'nasal passages and the windpipe']], ext=[WBA])
fix('robin_neck_muscles', basics='Long muscles along the neck and back move the head and keep the trunk steady in flight; short, strong muscles at the base of the tail spread and steer the tail feathers.',
  deeper='A bird\'s neck is long and flexible and its muscles do the jobs for the head that other animals do with their front limbs. The skin muscles also adjust the feathers.',
  expert='The neck is long and has complex muscles, because the head does jobs that other animals do with their front limbs; the few trunk and tail muscles, such as the lateralis caudae and levator caudae, are strong and control the spreading of the tail feathers. The model draws simple tubes.',
  facts=[['Neck vertebrae', 'typically 14 in songbirds (see the Neck vertebrae card)']], ext=[WBA], related=['cervical_spine'])

# ---------------------------------------------------------------- spine, ribs, shoulder
fix('robin_cervical', title='Neck vertebrae (typically 14)', summary='A songbird\'s neck typically has 14 vertebrae, about twice as many as a person\'s seven.',
  basics='A robin\'s neck is flexible because it is made of many small vertebrae: songbirds typically have 14, where a human has seven. It lets the bird reach its whole body with its bill to preen and turn its head far to look back.',
  deeper='In a study of 159 birds of 47 songbird species, all but two had 14 neck vertebrae when the last two, which carry short floating ribs (cervico-dorsal vertebrae), were counted. Whether those two count as neck or back bones is a matter of convention, so published counts of 13 and 14 both exist; the robin itself is not named in the study.',
  expert='Across all birds the count ranges from 8 to as many as 25 in some swans (Bird anatomy). The model draws 14 beads. The two floating ribs are not drawn. The count is therefore a typical songbird value, not a measurement of a robin.',
  facts=[['Neck vertebrae, typical songbird', '14 in all but 2 of 159 birds of 47 species, counting 2 cervico-dorsal (Webster and Goff)'], ['Range in birds', '8 to 25 (Bird anatomy)'], ['Human', '7']], cert='C2')
fix('robin_nape', basics='The nape is the back of the neck. It is brown like the crown and back. Under the feathers lies a long, flexible neck made of many small vertebrae, typically 14 in songbirds against seven in a person.',
  facts=[['Neck vertebrae, typical songbird', '14 (Webster and Goff: 47 songbird species; the robin itself is not named)']])
fix('robin_skeleton', basics='The skeleton holds the robin up and gives the muscles something to pull on. In a bird many bones that are separate in us are fused: the hand, the hip and lower back, the tail tip. The breastbone carries a deep keel and the two collarbones are fused into a wishbone.',
  deeper='Click a bone to read what it is and what it is in a human. Songbirds typically have a long neck of 14 vertebrae, no teeth, and ribs with small hooks. The skeleton is only about 5 % of a bird\'s body weight.',
  facts=[['Neck vertebrae', 'typically 14 in songbirds'], ['Skeleton share of body weight', 'about 5 % of a bird (Bird anatomy)'], ['Wing', 'fused hand, three fingers']], ext=[WBA, WEB])
fix('robin_neck_muscles', facts=[['Neck vertebrae', 'typically 14 in songbirds']])
fix('robin_thoracic', summary='The chest vertebrae carry the ribs; in birds several of them are fused, so the back is stiff.',
  basics='The vertebrae of the chest carry the ribs. In many birds the front ones are fused into a stiff block, so the body is a rigid frame that the wings can pull against.',
  deeper='Birds have between five and ten thoracic vertebrae. The first thoracic vertebra is the one whose rib reaches the breastbone; the ribs of the neck vertebrae are free.',
  expert='In the one house sparrow skeleton described by Webster and Goff the ribs that join the breastbone are on vertebrae 15 to 18; the robin was not measured. The model draws five beads and five pairs of ribs, a choice of the model.',
  facts=[['Thoracic vertebrae in birds', '5 to 10 (Bird anatomy)'], ['Ribs reaching the breastbone, house sparrow', '4 (Webster and Goff); the robin was not measured']], ext=[WBA, WEB], )
fix('robin_synsacrum', basics='In a bird many vertebrae of the lower back and hip are fused into a single bone, the synsacrum, which is also fused to the hip bones. It makes a stiff, strong platform for the legs.',
  deeper='The synsacrum is one piece made of thoracic, lumbar, sacral and sacro-caudal vertebrae. When the bird is not in flight it is the main support for the rest of the body. A human has a similar fused sacrum but only five vertebrae are fused in it.',
  expert='The usual description of the fused synsacrum is one thoracic, six lumbar, two sacral and five sacro-caudal vertebrae fused (Bird anatomy), a general pattern for birds that is not measured on a robin; Webster and Goff report that the front part of the songbird synsacrum includes three or four thoraco-dorsal vertebrae, so the count varies. The model draws a tapering bar with a plate on each side.',
  facts=[['Fused vertebrae, general bird pattern', '1 thoracic + 6 lumbar + 2 sacral + 5 sacro-caudal (varies between birds)']], cert='C2', ext=[WBA, WEB, SYNS], related=['sacrum', 'pelvis'])
fix('robin_caudal', basics='A bird has a short chain of free tail bones between the fused hip and the pygostyle. Birds have between five and eight free tail vertebrae; the robin\'s own number is not given here.',
  deeper='These free vertebrae give the tail some movement near its root. They are the bird version of the human coccyx, the remains of a tail.',
  expert='The model draws six beads, matching the six free tail vertebrae that Webster and Goff figure for a house sparrow; this is a drawing choice, not a count on a robin.',
  facts=[['Free caudal vertebrae in birds', '5 to 8 (Bird anatomy)'], ['House sparrow figure', '6 (Webster and Goff)']], ext=[WBA, WEB])
fix('robin_pygostyle', basics='Unlike a mammal, a bird has no long tail of bones. The last few tail vertebrae are fused into a flat plate called the pygostyle, and the tail feathers are fastened round it. The tail is feathers, not bone.',
  deeper='The pygostyle gives the tail feathers and the small tail muscles a firm anchor, so the tail can be spread and tilted as one unit for steering.',
  expert='The pygostyle is made of the last four caudal vertebrae, though some sources count up to ten (Bird anatomy). The model draws a small plate.',
  facts=[['Fused vertebrae', 'the last four (up to ten by some counts)']], ext=[WBA, PYGO], related=['robin_tail', 'robin_tail_muscles'])
fix('robin_tail_muscles', basics='Small muscles at the root of the tail spread, fold and tilt the tail feathers. They pull on the pygostyle and on the feather bases.',
  deeper='Two of them are the lateralis caudae and the levator caudae, which control the tail and spread the feathers, increasing the tail\'s area, which helps in turning.',
  expert='The model draws two small ellipsoids. Their size and exact attachments are not described here.', facts=[['Named muscles', 'lateralis caudae, levator caudae']], ext=[WBA], related=['robin_pygostyle'])
fix('robin_sternum', summary='The breastbone carries a deep keel, a blade to which the flight muscles attach.',
  deeper='A deeper keel gives the muscles more area to attach to. Flying birds have a sternum about as wide as it is tall, walking birds a long one and swimming birds a wide one.',
  expert='The keel gives the muscles for flying or swimming a place to attach, and flightless birds such as ostriches lack a keel and have denser, heavier bones. The model draws the keel and plate smooth and oversized.',
  facts=[['Keel', 'carries the flight muscles; absent in ostriches'], ['Human match', 'sternum, which has no keel']], ext=[WBA])
fix('robin_furcula', basics='A bird\'s collarbones are joined into one bone, the furcula or wishbone, a V or U-shaped bone at the front of the chest. Birds are the only living vertebrates with fused collarbones. It lies between the two shoulders and holds them apart.',
  deeper='A human has two separate collarbones. In the bird the wishbone also forms one side of the shoulder pulley (see Triosseal canal). Its flexing as the wings beat has been proposed to act like a spring; this card does not rely on that idea.',
  expert='The wishbone and the coracoid, with the scapula, form the pectoral girdle. The wishbone is homologous to the fused clavicles of theropod dinosaurs, which is one of the features that link birds to them. The model draws a U.',
  facts=[['Fused collarbones', 'only in living birds (among living vertebrates)'], ['Human match', 'two separate clavicles']], ext=[WBA, FURC], related=['clavicle_r', 'robin_canal'])
fix('robin_shoulder_girdle', basics='The coracoid is a strong strut from the shoulder to the breastbone, and the shoulder blade (scapula) is a long, thin blade that lies along the ribs. With the wishbone they hold the shoulder joint and form the pulley for the upstroke tendon.',
  deeper='In a human the coracoid is only a small hook on the shoulder blade, and the collarbone braces the shoulder. In the bird the coracoid is a full bone that takes the force of the wing beat.',
  expert='The furcula, coracoid and scapula together make up the pectoral girdle. The model draws the coracoid and scapula as rods. The pulley they form is described on the Triosseal canal card.',
  facts=[['Coracoid', 'strut from shoulder to breastbone'], ['Human match', 'scapula (shoulder blade); the human coracoid is a small process on it']], ext=[WBA], related=['scapula_r', 'robin_canal'])
fix('robin_ribs', basics='The ribs form a stiff cage round the lungs, heart and liver. Each has a small bony hook, the uncinate process, that overlaps the rib behind it.',
  deeper='Birds are the only living animals with bony uncinate processes of this kind, though the tuatara also has them. They strengthen the cage and anchor muscles used in breathing.',
  expert='In the house sparrow in Webster and Goff the uncinate processes lie on ribs 14 to 18, which is not a robin count. The model draws five pairs of ribs and the real number varies.',
  facts=[['Uncinate processes', 'in birds and the tuatara'], ['Human match', 'ribs, which have no hooks']], ext=[UNC, WEB, WBA], related=['ribcage'])
fix('robin_uncinate', basics='Each rib carries a small backward hook of bone that lies over the next rib. Together the hooks stiffen the rib cage so that it can take the pull of the muscles that work the breathing.',
  deeper='They are hooked extensions of bone that overlap the rib behind. They are found in birds and in the tuatara, not in mammals.',
  expert='They begin as cartilage and turn to bone in birds; in crocodiles they stay cartilage. The model draws short rods on five pairs of ribs.',
  facts=[['In birds', 'bony'], ['In crocodiles', 'cartilage']], ext=[UNC, WBA], related=['ribcage'])
fix('robin_pelvis', basics='The three hip bones (ilium, ischium and pubis) are fused into one on each side and to the synsacrum. The socket for the thigh bone, the acetabulum, is where they meet.',
  deeper='In a human the two hip bones close in front to form a bowl that holds organs. The bird pelvis is not closed in a bowl in the same way.',
  expert='The fused bones (the innominate bone) are important in evolution because the open, fused pelvis lets birds lay eggs. The model draws plates, not the real shapes.',
  facts=[['Bones', 'ilium, ischium, pubis, fused'], ['Human match', 'hip bone (os coxae)']], ext=[WBA], related=['pelvis'])

# ---------------------------------------------------------------- wing bones
fix('robin_humerus', basics='The humerus runs from the shoulder to the elbow. It is the bone you feel in your upper arm, and a bird\'s is light because many bird bones are hollow and braced with struts. In a folded wing it lies back along the body.',
  deeper='The tendon of the upstroke muscle ends on its upper end, and the big breast muscle pulls on a crest of the bone. Whether a robin\'s humerus is air-filled is not stated here: it is the bone shown in the hollow-bone scene as a general picture.',
  expert='The shoulder is made of the scapula, coracoid and humerus, and the humerus meets the radius and ulna at the elbow. The model draws a rod with swollen ends.',
  facts=[['Human match', 'humerus'], ['Joins', 'shoulder to elbow']], ext=[WBA, FLY], related=['humerus_r'])
fix('robin_radius', summary='The radius, the thinner of the two forearm bones, beside the ulna.',
  basics='The wing\'s forearm has two bones, the radius and the ulna, as yours does. The radius is the slimmer one and lies on the front edge of the wing.',
  deeper='In a human the radius is the forearm bone on the thumb side. The secondary flight feathers attach to the ulna, not the radius.',
  expert='The model draws two thin rods, the radius the slimmer; the real thicknesses are not given on this card.',
  facts=[['Human match', 'radius']], ext=[WBA, PYLE], related=['radius_ulna_r', 'robin_ulna'])
fix('robin_ulna', basics='The ulna is the larger forearm bone. The secondary flight feathers are attached along it, so it carries most of the broad inner part of the wing.',
  deeper='The tertials, the three feathers nearest the body, are attached close to the elbow. In a human the ulna is the forearm bone on the little-finger side.',
  expert='The attachment of the secondaries to the ulna is described in Pyle 2008 and the Flight feather page. The model draws a rod; the small bumps where real feather bases attach are not drawn.',
  facts=[['Carries', 'the secondary flight feathers'], ['Human match', 'ulna']], ext=[PYLE, WFF], related=['radius_ulna_r', 'robin_radius'])
fix('robin_carpometacarpus', basics='In your hand the wrist has eight small bones and the palm has five long bones. In a bird the wrist and palm bones are fused into one bone, the carpometacarpus, which carries the main flight feathers (the primaries).',
  deeper='The fusion makes a stiff, light support for the long feathers. A few small wrist bones stay free, as in the bird\'s two bones at the wrist joint (the radiale and ulnare).',
  expert='The wrist and palm bones form the bird\'s wrist and hand, and the finger bones are fused together. The model draws the carpometacarpus as one rod and the free wrist bones are not drawn. The statement that two wrist bones stay free is general anatomy of birds and not measured on a robin.',
  facts=[['Human match', 'wrist bones (carpals) and palm bones (metacarpals), partly fused in the bird']], cert='C2', ext=[WBA, FLY], related=['hand_bones_r'])
fix('robin_digits', basics='A bird\'s hand has three digits. The short thumb carries the alula, and the longest finger holds the outer primary feathers. Which three of the original five digits these are is still debated.',
  deeper='The fossils of theropod dinosaurs suggest digits I, II and III, while the embryos of living birds suggest II, III and IV. This is one of the real open problems in the origin of birds.',
  expert='This difference is called the frame-shift question and is listed among the debated points in Origin of birds. The model draws two thin rods and a stub; the identity of the digits is not shown.',
  facts=[['Digits', '3'], ['Identity', 'debated: I-II-III from fossils, II-III-IV from embryos']], cert='C3', ext=[ORI], related=['hand_bones_r'])

# ---------------------------------------------------------------- muscles and tendon
fix('robin_sc_tendon', basics='A tendon is a tough cord that joins muscle to bone. This one starts in the upstroke muscle on the breast, passes up through the shoulder pulley, and ends on the top of the humerus.',
  deeper='Because the tendon is long and thin, the heavy muscle can stay low in the body while only a light cord runs to the wing.',
  expert='The route is: muscle, through the triosseal canal (the gap between coracoid, scapula and furcula), and over the shoulder to the humerus. The model draws it as a thin tube along that route.',
  facts=[['Route', 'supracoracoideus, triosseal canal, top of the humerus']], ext=[FLY, WBA], related=['tendon', 'robin_canal'])
fix('robin_canal', basics='Three bones meet at the shoulder: the coracoid, the scapula and the wishbone. They leave a small opening, the triosseal canal. The tendon of the upstroke muscle runs through it, which turns a downward pull in the breast into an upward lift of the wing.',
  deeper='The pulley lets both of the big flight muscles lie low on the breast, near the bird\'s centre of gravity. In most vertebrates the muscles that lift the arm lie on the back.',
  expert='Attaching both muscles to the keel is unusual, because in other vertebrates the muscles that raise the upper limb are generally attached on the back. The ring in the model marks the canal and is simplified.',
  facts=[['Formed by', 'coracoid, scapula and furcula']], ext=[WBA, FLY], related=['robin_supracoracoideus'])
fix('robin_wing_muscles', basics='The wing has few muscles of its own: the big flight muscles are in the chest and long tendons run to the wing. Small muscles in the upper arm and forearm extend or fold the elbow, move the wing as a whole and move the fingers.',
  deeper='Keeping muscle in the chest and not in the wing leaves the wing light, which makes flapping cheaper. Skin muscles attached to the feather bases adjust the feathers.',
  expert='The wing muscles work mainly by straightening or bending the elbow, moving the whole wing, or straightening or bending particular fingers. The model draws two tapering muscle bellies on each side.',
  facts=[['Position', 'upper arm and forearm']], ext=[WBA], related=['forearm_muscles'])
fix('robin_thigh_muscles', basics='The thigh muscles are hidden under the belly feathers. They swing the leg for hopping and for take-off, and long tendons run from them down the leg to the toes.',
  deeper='Putting the leg muscles high and close to the body leaves the lower leg thin and light, which is why a bird\'s leg looks so slim below the feathers.',
  expert='The model draws one capsule from hip to knee. Its mass is not stated here; in a bird the pectoral muscles are the largest muscles and the leg muscles are much smaller.',
  facts=[['Where', 'hip to knee, hidden in the feathers']], ext=[WBA, FEET])
fix('robin_shank_muscles', basics='The muscles that curl the toes lie high on the shin, near the knee, so the lower leg can be thin. Their long tendons run down behind the ankle to the toes.',
  deeper='The toe-flexor tendon is the one that tightens when the ankle bends, which helps a perching bird hold on (see the perching card).',
  expert='The model draws one tapering capsule on the shin. Individual muscles are not drawn.', facts=[['Position', 'high on the shin']], ext=[FEET, WBA], related=['robin_tendon'])
fix('robin_jaw_muscle', facts=[['Job', 'closes the lower jaw']])

# ---------------------------------------------------------------- air sacs and breathing
SACS = {
 'robin_sac_interclav': ('The single air sac in the middle of the chest, in the front group of sacs.',
   'This is the interclavicular sac, the one air sac that is not paired; it lies in the middle of the front of the chest between the collarbones. It belongs to the front group of sacs, which empty out through the windpipe.',
   'It is one of three anterior sacs (interclavicular, cervical and anterior thoracic). In passerines the interclavicular, or clavicular, sac may be joined or fused with the anterior thoracic sacs, which is one reason the number of sacs in a songbird is given as seven.',
   'The model draws it as a single smooth bag in the front of the chest. Where its walls end and a neighbour begins is a drawing choice.',
   [['Group', 'anterior (front)'], ['Drawn as', '1 sac'], ['In passerines', 'may be fused with the anterior thoracic sacs']]),
 'robin_sac_cervical': ('A pair of air sacs at the base of the neck, in the front group.',
   'The cervical sacs are small sacs at the base of the neck. They belong to the front group of air sacs, which fill with air that has already passed through the lungs and empty out through the windpipe.',
   'Air sacs form air pockets inside the semi-hollow bones in many birds, so a sac at the base of the neck can reach the neck vertebrae; which bones a robin\'s sacs enter is not stated here. The sacs have poor blood supply and so do not exchange gas themselves.',
   'The model draws two small bags. Whether a robin has separate cervical sacs is part of the naming and counting convention explained on the Air sacs card.',
   [['Group', 'anterior (front)'], ['Drawn as', '2 sacs (a pair)'], ['Gas exchange', 'none: the walls have a poor blood supply']]),
 'robin_sac_ant': ('A pair of air sacs in the front of the chest, in the front group.',
   'The anterior thoracic sacs lie in the front of the chest. They are part of the front group: on breathing out they release air that has already crossed the lung and send it up the windpipe.',
   'During inhalation both groups of sacs expand: the posterior sacs fill with fresh air, and the anterior sacs fill with air that has already passed through the lungs. In songbirds these sacs may be joined with the clavicular sac.',
   'The model draws two bags. The fusion with the interclavicular sac in passerines is one reason textbooks differ on the count.',
   [['Group', 'anterior (front)'], ['Drawn as', '2 sacs (a pair)'], ['On inhaling', 'fill with air that has already passed through the lungs']]),
 'robin_sac_post': ('A pair of air sacs in the rear of the chest, in the rear group, that take fresh air first.',
   'The posterior thoracic sacs lie in the rear of the chest. They belong to the rear group, which fills with fresh air when the bird breathes in and empties it forward through the lungs when the bird breathes out.',
   'This is the step that keeps the flow through the lung going one way. The air that leaves a rear sac enters the lung from the rear end and flows through the parabronchi in the same direction as on the way in.',
   'The model draws two bags. The tracer-gas study of zebra finches and blackbirds found the details of the flow differ from the simple textbook pattern (Airflow through the avian respiratory system).',
   [['Group', 'posterior (rear)'], ['Drawn as', '2 sacs (a pair)'], ['On breathing out', 'empty into the lungs']]),
 'robin_sac_abd': ('A pair of large air sacs among the gut, at the rear of the body.',
   'The abdominal sacs are the rearmost air sacs, lying among the gut inside the belly. They are in the rear group: they fill with fresh air on breathing in and push it through the lungs on breathing out.',
   'Birds have no diaphragm; they change the volume of all their air sacs together by moving the ribs and the belly wall. Breathing out is the active phase.',
   'The model draws two large bags. Real sac shapes are more irregular and wrap round neighbouring organs.',
   [['Group', 'posterior (rear)'], ['Drawn as', '2 sacs (a pair)'], ['Driven by', 'rib and belly muscles; birds have no diaphragm']]),
}
for _id, (s, b, d, e, f) in SACS.items():
    fix(_id, summary=s, basics=b, deeper=d, expert=e, facts=f, ext=[AIR, WBA], cert='C1')
fix('robin_air_sacs', summary='Thin-walled air sacs fill much of the body and work as bellows, so that air flows through the lung in one direction.',
  basics='Air sacs are thin bags among the organs, and some enter the bones. They act as bellows: fresh air goes first into the rear sacs, then through the lungs, then to the front sacs and out. A bird typically has nine; in passerines the clavicular sac may be joined to the anterior thoracic sacs, so passerines are counted as having seven.',
  deeper='The sacs are in two groups: the front group (interclavicular, cervical and anterior thoracic) and the rear group (posterior thoracic and abdominal). The sac walls have a poor blood supply, so no gas exchange happens in them. The air sacs account for about 15 % of the body volume, where the alveoli of a mammal lung take about 7 %.',
  expert='The count is a naming convention, not an unknown: nine is the textbook count of five groups (1 + 2 + 2 + 2 + 2), and passerines are counted as having seven because the clavicular air sacs may be joined to or fused with the anterior thoracic sacs. The model draws nine so that each group can be clicked. The count can range from seven to twelve across birds.',
  facts=[['Air sacs, typical bird', 'nine (range 7 to 12)'], ['Air sacs, passerine', 'seven, because the clavicular and anterior thoracic sacs may be fused'], ['Drawn', 'nine, in five groups']], cert='C1', openq=[],
  ext=[AIR, WBA])
fix('robin_lungs', basics='A bird\'s lungs are small and firm, pressed against the back of the rib cage. They do not swell and shrink: the air sacs do the pumping. Gas exchange takes place in tiny tubes, the parabronchi, through which the air flows one way.',
  deeper='The lungs are smaller than a mammal\'s of the same body mass, yet the respiratory surface is larger and the barrier between air and blood is thinner. Blood flows across the parabronchi at right angles to the air, a cross-current arrangement.',
  expert='Birds have a respiratory surface about 15 % greater, a capillary blood volume 2.5 to 3 times larger and a blood-gas barrier 56 to 67 % thinner than in a mammal of similar mass, as general figures for birds, not a robin measurement. The lung is drawn as a wedge on each side of the spine.',
  cert='C1', ext=[AIR, WBA], related=['lung_r', 'robin_breathing'])
fix('robin_breathing', summary='A bird\'s lungs are fed by air sacs, so air flows through the lung in one direction during both breathing in and breathing out.',
  basics='You breathe in and out through the same tubes, so the air in your lungs goes back and forth. A bird\'s air passes through its lungs in one direction all the time, because the lungs are connected to air sacs that act as bellows. Fresh air goes first to the sacs at the back, then through the lung, then to the sacs at the front and out.',
  deeper='The air sacs do not exchange gas; the lung tubes (parabronchi) do. Flow irreversibility at the junctions of the airways keeps the flow in one direction, so the lung gets fresh air during both the breath in and the breath out. A tracer in a duck stayed in the bird for two breath cycles.',
  cert='C1', openq=['How exactly do the shape of the airways and the valve-like effects of the airflow keep the flow one-way, and how do the front sacs behave while the bird is calling or flapping?'],
  expert='Birds typically have nine air sacs; passerines are counted as having seven because two sacs may be fused. The model draws nine. In a tracer-gas study of zebra finches and blackbirds, breathing rates rose from 1.5 to 2.3 breaths per second in calling and to 3.5 in wing-flapping.')

# ---------------------------------------------------------------- organs
fix('robin_heart', basics='The heart has four chambers: two atria that receive blood and two ventricles that pump it. The right side sends blood to the lungs; the left side sends it round the body, and the two sides do not mix. Use "Cut open: the heart" to see the chambers.',
  deeper='Oxygen-poor blood enters the right atrium, passes to the right ventricle and goes to the lungs; it returns to the left atrium and is pumped by the left ventricle round the body. The wall of the left ventricle is the thickest. The animation is an illustration with no real rate.',
  expert='A four-chambered heart is shared with mammals and crocodilians (Bird anatomy). A small tropical songbird of 17 g in the wild ranged from 260 to 824 beats a minute (Steiger et al. 2009); no heart rate was measured on a robin. The model heart has no valves.',
  ext=[WBA, STE])
fix('robin_rv', basics='The right ventricle wraps round part of the left one and sends oxygen-poor blood to the lungs. Its wall is thinner than that of the left ventricle, because the lung circuit needs less pressure than the body circuit.',
  deeper='In the bird the right ventricle is crescent-shaped when cut across. Blood leaves it by the pulmonary artery to the lungs.',
  expert='The crescent in the model follows the usual drawing of a bird heart; the real wall thickness is not given here.', facts=[['Blood', 'oxygen-poor, to the lungs'], ['Human match', 'right ventricle']])
fix('robin_la', basics='The left atrium receives oxygen-rich blood from the lungs and passes it to the left ventricle. Its wall is thin.',
  deeper='It is the same chamber as the human left atrium.',
  expert='The atria are thin-walled receiving chambers. The model draws a small ellipsoid; the valve between atrium and ventricle is not drawn.', facts=[['Blood', 'oxygen-rich, from the lungs'], ['Human match', 'left atrium']])
fix('robin_ra', basics='The right atrium receives oxygen-poor blood from the body and passes it to the right ventricle. Its wall is thin.',
  deeper='In chickens and some other birds the great vein that brings blood from the upper body is double, so there are two openings into the right atrium instead of one.',
  expert='In chickens the great vein from the upper body is double. Whether a robin\'s is double is not stated here. The model draws one ellipsoid.', facts=[['Blood', 'oxygen-poor, from the body'], ['Human match', 'right atrium']])
fix('robin_lv', facts=[['Blood', 'oxygen-rich, to the body'], ['Human match', 'left ventricle']], expert='The cavity is drawn as an ellipsoid inside the heart muscle; the valves are not drawn. The thicker wall is the standard description of the bird heart and no wall thickness is given on this card.')
fix('robin_liver', basics='The liver is the largest gland of the body. It makes bile, which helps digest fat, stores sugar and cleans the blood. In birds it has two lobes.',
  deeper='It lies just behind the heart, in front of the stomach.',
  expert='The model draws two lobes, the right slightly bigger. Their size is drawn by eye; the liver\'s mass is not given here.', facts=[['Lobes', '2'], ['Human match', 'liver, which has more lobes']])
fix('robin_proventriculus', basics='A bird\'s stomach has two parts. The first, the proventriculus, makes the digestive juices: hydrochloric acid and the enzyme pepsin. The second part is the muscular gizzard.',
  deeper='The proventriculus is a short tube between the gullet and the gizzard that secretes hydrochloric acid and pepsinogen; the acid turns pepsinogen into pepsin, which cuts proteins into peptides. The juices are mixed with the food by the gizzard\'s contractions.',
  expert='This is the general bird pattern; the model draws a small oval in the place where the glandular stomach lies.', facts=[['Stomach parts', '2: glandular (proventriculus) and muscular (gizzard)']], ext=[WBA], related=['stomach'])
fix('robin_gizzard', basics='Birds have no teeth; they grind food in the gizzard, a thick-walled muscular stomach. Some birds swallow grit to help.',
  deeper='The gizzard is made of four muscular bands that rotate and crush the food, passing it from one area to another. In seed-eating birds such as turkeys and quails it holds swallowed grit or stone, called gastroliths. Whether a robin keeps grit is not stated here.',
  expert='Gastroliths have also been found as trace fossils with other dinosaurs, so using gizzard stones is a similarity between birds and some dinosaurs; it is not a feature of every theropod. The model draws a rounded disc.',
  facts=[['Muscle bands', '4'], ['Grit', 'swallowed by some birds']], ext=[WBA, GIZ], related=['stomach'])
fix('robin_spleen', basics='The spleen is a small round organ near the stomach. It filters the blood and is part of the immune system, which makes and stores immune cells.',
  deeper='Birds also have an immune organ at the cloaca, the bursa of Fabricius, which helps make B lymphocytes.',
  expert='The model draws a small ball next to the stomach; its size is drawn by eye.',
  facts=[['Where', 'next to the stomach']], ext=[WBA], related=['spleen'])
fix('robin_pancreas', basics='The pancreas makes digestive enzymes that go into the gut and hormones such as insulin and glucagon. In a bird it hangs between the limbs of the first loop of the small intestine (the duodenum).',
  deeper='Compared with a mammal, a bird\'s blood sugar is high and its pancreas makes much more glucagon, which raises blood sugar, than insulin. Birds do not use glucose to trigger insulin release in the same way.',
  expert='FASTING_PLACEHOLDER',
  facts=[['Hormones', 'insulin and glucagon (and others)'], ['Position', 'between the limbs of the duodenum']], cert='C2', ext=[WBA], related=['pancreas'])
fix('robin_intestines', basics='Food passes from the gizzard along the small intestine, where it is digested and absorbed, to a short large intestine and the cloaca. A bird\'s gut is short, which keeps its weight down.',
  deeper='Enzymes from the pancreas and the intestine finish the digestion, and the products are absorbed into the blood. Many birds regurgitate undigested hard bits as pellets, but not through the cloaca.',
  expert='The model draws a coiled tube; the real gut is more folded. The shortness of a bird\'s gut is a general description in the Bird anatomy page.', facts=[['Ends in', 'cloaca']], ext=[WBA], related=['small_intestine', 'large_intestine'])
fix('robin_rectum', basics='The rectum is the last short piece of the gut. It opens into the cloaca.',
  deeper='Droppings and the white uric-acid paste of the urine leave together through the cloaca. In some birds urine from the cloaca is also moved back into the rectum.',
  expert='Bird anatomy says urine from the kidney reaches the cloaca by the ureters and then back up into the colon. The model draws a short tube.', facts=[['Opens into', 'the cloaca']], ext=[WBA], related=['large_intestine', 'robin_cloaca'])
fix('robin_cloaca', basics='A bird has one exit for droppings, urine, eggs and sperm. The white part of a dropping is uric acid, the waste of the nitrogen in the diet, and it needs little water to get rid of.',
  deeper='The urine is formed by the kidneys and goes down the ureters into the cloaca. A young bird has a pouch on the top of the cloaca, the bursa of Fabricius, which helps make B lymphocytes, a kind of immune cell.',
  expert='In most male birds there is no penis; the sperm is passed when the two cloacae touch. This is the general bird pattern. The model draws a small chamber.',
  facts=[['Openings', 'gut, kidneys, reproductive tract']], ext=[WBA, CLO], related=['robin_vent'])
fix('robin_kidneys', basics='The two kidneys filter waste from the blood and lie on either side of the backbone against the lower back and pelvis. Birds pass their nitrogen waste as uric acid.',
  deeper='Each kidney has three sections. Birds have two kinds of nephron (the filtering unit), one like a reptile\'s and one like a mammal\'s. There is no bladder; urine goes to the cloaca.',
  expert='The concentration gradient in the avian kidney is made by salt and not by urea, as it is in mammals. The model draws three lobes on each side.',
  facts=[['Sections', '3 on each side'], ['Human match', 'kidney']], ext=[WBA], related=['kidney_r'])
fix('robin_oesophagus', summary='The tube from the throat to the stomach. Many birds have a crop on it; the model does not draw one on the robin.',
  basics='Food goes from the throat to the stomach down the gullet, behind the windpipe. In many birds a crop, a muscular pouch, softens and stores food on the way. The model draws the gullet as a tube without a crop.',
  deeper='A crop is an enlarged part of the oesophagus, and not all birds have one. Doves and pigeons make crop milk in it to feed their young.',
  expert='The model\'s choice of no crop is a modelling decision. Whether a robin has a crop or only a slight widening of the gullet is a matter for an avian anatomy text that this card did not open; the question is not known to be unsettled in science.',
  cert='C2', openq=[], facts=[['Crop', 'present in many birds, absent in owls; not drawn here for the robin']], ext=[CROP, WBA], related=['esophagus'])
fix('robin_trachea', basics='The windpipe carries air from the throat to the lungs, down the front of the neck. It is held open by rings of cartilage. At its lower end it splits in two at the syrinx.',
  deeper='A bird\'s windpipe is dead space: the oxygen-poor air in it at the end of a breath is the first air to re-enter the lungs and air sacs. In a bird this dead space is on average 4.5 times larger than in a mammal of the same size.',
  expert='The tracheal rings are mostly complete rings, and the bronchi have C-shaped rings. The model draws a smooth tube; the rings show in the cut-open syrinx.', ext=[SYR, WBA], related=['trachea', 'robin_syrinx'])

# ---------------------------------------------------------------- nerves
fix('robin_brain', basics='Much of the bird brain deals with sight: the optic lobes at the sides are large because vision matters to a bird. The cerebellum at the back helps control balance and movement.',
  deeper='A bird has a large brain for its body mass, and its surface is smooth, without the deep folds of a human brain.',
  expert='The brain is drawn by eye from a typical songbird brain. Its mass and the sizes of its parts are not given here; Only a large brain-to-body-mass ratio is stated for birds in general: a large brain-to-body-mass ratio.',
  facts=[['Parts drawn', 'cerebrum, cerebellum, optic lobes']], ext=[WBA], related=['brain', 'bio_brain_organization'])
fix('robin_optic_lobes', basics='The optic lobes are two bulges at the sides of the midbrain. They receive most of the signals from the optic nerves, and they are large in birds.',
  deeper='They are the bird\'s main visual centre in the midbrain, and are called the optic tectum. The visual centres in a mammal\'s cerebral cortex do much of the same work.',
  expert='The model draws two ellipsoids. The sizes are drawn by eye.',
  facts=[['Receives', 'the optic nerves'], ['Human match', 'the optic tectum is the superior colliculus in mammals']], ext=[WBA, VIS], related=['optic_nerve'])
fix('robin_optic_nerves', basics='Each optic nerve leaves the back of the eye and runs to the brain. It carries the signals of all the retina\'s ganglion cells.',
  deeper='Birds have a high number of neurons in the optic nerve, which is one reason their eyesight is acute. In a bird the nerve leaves the eye where the pecten stands.',
  expert='The model draws two thin cables. In a human the optic nerve also leaves at a blind spot with no photoreceptors, the optic disc.', facts=[['Number', '2']], ext=[VIS], related=['optic_nerve'])
fix('robin_spinal_cord', basics='The spinal cord runs from the brain down through a canal in the vertebrae. It carries signals between the brain and the body, and nerves leave it between the vertebrae to the wings, legs and muscles.',
  deeper='In a bird the neck part is long and the part in the fused back is held in a rigid canal. The cord ends in the tail region.',
  expert='The model draws a tube. Its length and the places where nerves leave are not drawn from a dissection.', facts=[['Where', 'inside the vertebral column']], ext=[WBA], related=['spinal_cord'])
fix('robin_peripheral_nerves', basics='Nerves branch from the spinal cord to the wings and legs, and the vagus nerves run between the brain and the chest and gut. Click one of the three nerve cards for its job.',
  deeper='The wing is supplied through a bundle called the brachial plexus. The leg is supplied by the sciatic nerve, and the vagus supplies the organs of the chest and belly.',
  expert='The model draws thin cables of three kinds; the real branching is far more complex. ' + HUMAN_NERVES,
  facts=[['Wing', 'brachial plexus'], ['Leg', 'sciatic nerve'], ['Chest and belly', 'vagus nerves']], ext=[BRPLEX, WBA], related=['peripheral_nerves', 'spinal_cord'])
fix('robin_brachial', summary='The bundle of nerves that supplies the wing, branching from the spinal cord near the shoulder.',
  basics='The nerves to the wing come from a network near the shoulder called the brachial plexus. Its branches carry movement commands to the wing muscles and bring back touch signals from the wing.',
  deeper='In birds the forelimb is mostly supplied by two nerves, the radial nerve and the median-ulnar nerve, which are main branches of the plexus. Humans also have a brachial plexus, supplying the arm.',
  expert='The branching pattern differs between bird species. Which spinal nerves form the plexus in a robin is not given here. ' + HUMAN_NERVES,
  facts=[['Supplies', 'the wing'], ['Main branches', 'radial and median-ulnar nerves (birds in general)']], ext=[BRPLEX], related=['peripheral_nerves', 'spinal_cord'])
fix('robin_sciatic', summary='The main nerve of the leg, running from the lower spinal cord down the thigh to the foot.',
  basics='The sciatic nerve carries commands to the muscles of the leg and the signals of touch back from it. It is the large nerve of the hind limb, running down the leg from the hip region.',
  deeper='A human also has a sciatic nerve, the longest and widest single nerve of the body, formed from spinal nerves of the lower back and sacrum and supplying the back of the thigh, the lower leg and the foot.',
  expert='The model draws a thin cable down the leg. Its exact route and branches in a robin are not drawn from a dissection. ' + HUMAN_NERVES,
  facts=[['Supplies', 'the muscles and skin of the leg'], ['In humans', 'longest and widest nerve of the body']], ext=[SCIA], related=['peripheral_nerves', 'spinal_cord'])
fix('robin_vagus', summary='The tenth cranial nerve: a long pair of nerves from the brain to the organs of the chest and gut.',
  basics='The two vagus nerves run from the brain down the neck. They carry signals that slow the heart, and they also supply the lungs and the gut. They are not wing or leg nerves: they lead from the brain itself and not from the spinal cord.',
  deeper='In humans the vagus supplies parasympathetic (calming, "rest and digest") nerve fibres to almost all the organs from the neck to the transverse colon from the neck to the transverse colon; its right branch slows the heart. The same general plan holds for other vertebrates, but this card does not describe a robin\'s vagus in detail.',
  expert='The model draws a thin cable on each side of the neck; the real nerve has many branches. ' + HUMAN_NERVES,
  facts=[['Origin', 'the brain (cranial nerve X)'], ['Supplies', 'heart, lungs and gut (in humans; the general vertebrate plan)']], cert='C2', ext=[VAG], related=['peripheral_nerves'])

# ---------------------------------------------------------------- eye parts
fix('robin_eyeballs', basics='The two eyeballs fill a large part of the head. Each eye has a cornea, a lens and a retina, and in a bird a small pleated organ, the pecten, projects into the jelly from the point where the optic nerve enters. Use "Cut open: the eye" to look inside one.',
  deeper='A ring of small bones in the front of the eye supports its shape. Birds have the largest eyes for their body size of any animals, though much of the eye is hidden in the skull, and eye movements are small, so birds turn the head instead.',
  expert='The eye is drawn about 8 mm across by eye from the head proportions; it is not a measured value.', ext=[VIS, SCL, PECT])
fix('robin_eye_sclera', basics='The sclera is the tough outer wall of the eyeball, made of collagen fibres. It supports and protects the eye and is the part that shows white in a human eye.',
  deeper='In a bird the front of the sclera holds the ring of small bones. A bird\'s eye is not round but flatter, and the ring and sclera hold that shape rigid.',
  expert='The sclera has two layers in birds. The model draws it as a shell, whose thickness is exaggerated.', facts=[['Material', 'tough fibrous collagen'], ['Human match', 'sclera']], ext=[VIS])
fix('robin_scleral_ring', basics='In the front of a bird\'s eye there is a ring of thin overlapping bony plates (scleral ossicles) set in the sclera. They hold the shape of the eye and give the focusing muscles something to pull on.',
  deeper='A ring is also seen in reptiles and some other vertebrates; mammals lack it. The ossicles lie on the border between the sclera and the cornea and have mechanical roles in focusing by moving the cornea and lens.',
  expert='Birds have 12 to 18 plates, 14 most commonly, but this was not counted on a robin. The model draws one ring.', facts=[['Plates', '12 to 18 in birds, most often 14'], ['Human match', 'none: mammals lack a scleral ring']], ext=[VIS, SCL], cert='C1')
fix('robin_cornea', basics='The cornea is the clear front window of the eye. Light passes through it first, and it bends the light as it enters the eye.',
  deeper='Some birds also have a second set of muscles that change the curve of the cornea, giving them a wider range of focus than mammals have.',
  expert='The shell of the cornea is exaggerated in thickness in the model. Whether a robin has those muscles is not stated here.', facts=[['Job', 'bends light into the eye']], cert='C1', ext=[VIS], related=['cornea'])
fix('robin_iris', basics='The iris is the ring of muscle round the pupil that sets how much light enters. A robin\'s eye looks black, with a dark brown iris.',
  deeper='In birds the iris muscles also help move the lens and cornea to focus. A bird\'s iris can be coloured in many species; the robin\'s is dark.',
  expert='The model draws a flat ring. The iris colour is from the Wikipedia robin page.', facts=[['Colour', 'dark brown to black'], ['Human match', 'iris']], ext=[VIS, WR], related=['iris'])
fix('robin_lens', basics='The lens sits behind the pupil and focuses light on the retina. Muscles round it change its shape to focus on near and far.',
  deeper='Birds have ciliary muscles that change the shape of the lens quickly and more than in mammals. These muscles attach to the lens capsule by fibres and are anchored on the ring of small bones.',
  expert='The lens is drawn as an ellipsoid. In a bird the lens is pushed far forward, which increases the size of the image on the retina.', facts=[['Job', 'focuses light'], ['Human match', 'lens']], ext=[VIS], related=['lens'])
fix('robin_vitreous', basics='The vitreous is the clear jelly that fills most of the eyeball behind the lens. It holds the retina in place and light passes through it.',
  deeper='The eye is divided by the lens into a front part, filled with a watery fluid, and a back part filled with the vitreous. The pecten reaches into the vitreous.',
  expert='The model draws a translucent sphere.', facts=[['Filling', 'clear jelly'], ['Human match', 'vitreous humour']], ext=[VIS], related=['robin_pecten'])
fix('robin_choroid', basics='The choroid is a dark layer between the retina and the sclera that is rich in blood vessels. The vessels feed the outer retina, and the dark pigment (melanin) cuts down reflections inside the eye.',
  deeper='A bird\'s retina is largely free of its own blood vessels, so it depends on the choroid and the pecten for supply.',
  expert='The model draws a thin dark shell. The thickness is not drawn to scale.', facts=[['Feeds', 'the outer retina'], ['Pigment', 'melanin']], ext=[VIS, PECT])
fix('robin_retina', basics='The retina is the screen at the back of the eye. It is made of cells that respond to light and pass signals along the optic nerve. Use the button to look inside it.',
  deeper='A bird\'s retina has rods for dim light and cones for colour; most birds have four kinds of cone. It is largely free of blood vessels, which are in the choroid and the pecten instead.',
  expert='The scene shows a photoreceptor and a cryptochrome hypothesis (see that card). Photoreceptor densities are known for other birds (house sparrow about 400,000 per square millimetre) but this card gives none for a robin.',
  facts=[['Photoreceptors', 'rods and cones (about four cone kinds in most birds)'], ['Human match', 'retina']], ext=[VIS, PECT], related=['retina'])
fix('robin_pecten', basics='In birds a pleated, blood-rich fold, the pecten, stands out from where the optic nerve enters the eye and reaches into the jelly. It is found in birds only, and its job is still debated.',
  deeper='It has blood vessels and dark pigment cells and no muscle or nerve fibres. The pleated type has 5 to 30 pleats. Ideas for its job: feeding the retina, shading it from glare, and helping detect moving objects.',
  expert='The Bird vision page calls the pecten "a poorly understood body". The model draws seven pleats, a choice. The question of its main job is real and open.',
  facts=[['Pleats', '5 to 30 in the pleated type'], ['Found in', 'birds only']], ext=[PECT, VIS], cert='C2')
fix('robin_optic_nerve', basics='The optic nerve is the cable of nerve fibres that carries signals from the retina to the brain. It leaves the back of the eye where the pecten stands.',
  deeper='Birds have a high number of neurons in the optic nerve. The place where it leaves the retina has no photoreceptors, the blind spot.',
  expert='The model draws a cable. The real fibre count is not given on this card.', facts=[['Job', 'carries signals to the brain'], ['Human match', 'optic nerve']], ext=[VIS], related=['optic_nerve'])
