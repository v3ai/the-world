# More figures for the robin's cards (data/viz/park_robin.json). Each one shows something that is in the card's text and says where it comes from.
from robin_figs import FIGS, blocks, bars, table

LEG = table(['Segment', 'Human', 'Robin'], [['Thigh', 'femur', 'femur (hidden in the body feathers)'], ['Shin', 'tibia, with a full-length fibula beside it', 'tibiotarsus: the tibia fused with the upper ankle bones; the fibula is a thin splint'], ['Ankle and foot', 'ankle bones and five long foot bones, lying flat', 'one extra long segment, the tarsometatarsus (fused lower ankle bones and three long foot bones)'], ['Toes', 'five', 'four: three forward, one back']],
            'The leg of a bird compared with a human leg (Bird feet and legs; Bird anatomy). The visible joint that bends backward in a bird is the ankle, not the knee.')
for k in ('robin_leg_bones', 'robin_femur', 'robin_tibiotarsus', 'robin_fibula', 'robin_tarsometatarsus', 'robin_leg_shin', 'robin_leg_tarsus'): FIGS[k] = LEG
FIGS['robin_leg_hallux'] = FIGS['robin_leg_toes']
FIGS['robin_skeleton'] = bars([('whole skeleton', 5), ('skull', 1)], 'percent of body weight', 'A bird\'s skeleton is only about 5 % of its body weight and the skull about 1 % (Bird anatomy, general figures for birds).')
FIGS['robin_skull'] = FIGS['robin_skeleton']
FIGS['robin_sternum'] = table(['Way of life', 'Shape of the breastbone'], [['Flying birds', 'width and height about equal, with a keel'], ['Walking birds', 'long'], ['Swimming birds', 'wide'], ['Ostrich and other flightless birds', 'no keel']], 'The breastbone differs with how a bird moves (Bird anatomy). The robin is a flying bird.')
FIGS['robin_furcula'] = table(['', 'Collarbones'], [['Human', 'two separate clavicles'], ['Birds', 'fused into one wishbone (furcula): the only living vertebrates with fused collarbones']], 'The wishbone is the bird\'s fused pair of collarbones (Bird anatomy; Furcula).')
FIGS['robin_digits'] = table(['Evidence', 'Digits the bird hand keeps'], [['Fossils of theropod dinosaurs', 'I, II, III'], ['Embryos of living birds', 'II, III, IV']], 'The two sources disagree and the question is open (Origin of birds).')
FIGS['robin_peripheral_nerves'] = table(['Nerve', 'Supplies', 'Human counterpart'], [['Brachial plexus', 'the wing', 'brachial plexus (the arm)'], ['Sciatic nerve', 'the leg', 'sciatic nerve, the longest and widest nerve of the body'], ['Vagus nerves', 'chest and gut', 'vagus nerve (cranial nerve X)']], 'Nerves of the robin and the nerves a person has with the same names (human nerve pages; avian wing-nerve anatomy study).')
for k in ('robin_brachial', 'robin_sciatic', 'robin_vagus'): FIGS[k] = FIGS['robin_peripheral_nerves']
SAC = table(['Air-sac group', 'Sacs (as drawn)', 'What it does'], [['Front (anterior)', 'interclavicular (1), cervical (2), anterior thoracic (2)', 'fill with air that has already crossed the lung; empty by the windpipe'], ['Rear (posterior)', 'posterior thoracic (2), abdominal (2)', 'fill with fresh air; empty it into the lung']], 'Nine sacs are drawn; passerines are counted as having seven because the clavicular sac may be joined to the anterior thoracic sacs (Bird anatomy).')
FIGS['robin_air_sacs'] = SAC
for k in ('robin_sac_interclav', 'robin_sac_cervical', 'robin_sac_ant', 'robin_sac_post', 'robin_sac_abd'): FIGS[k] = SAC
FIGS['robin_lungs'] = bars([('bird: air sacs, share of body volume', 15), ('mammal: alveoli, share of body volume', 7)], 'percent of body volume', 'The bird\'s air sacs fill about 15 % of the body; the alveoli of a mammal about 7 % (Bird anatomy, general figures).')
FIGS['robin_trachea'] = bars([('mammal of the same size', 1), ('bird (average)', 4.5)], 'dead-space volume, relative', 'The windpipe is dead space that holds stale air: in a bird it is on average 4.5 times larger than in a mammal of the same size (Bird anatomy).')
FIGS['robin_muscles'] = bars([('pectoralis, low estimate', 15), ('pectoralis, high estimate', 25), ('both flight muscles, low', 25), ('both flight muscles, high', 40)], 'percent of body weight', 'Flight muscles in a flighted bird, general ranges (Bird anatomy); not measured on a robin.')
FIGS['robin_pectoralis'] = FIGS['robin_muscles']
FIGS['robin_caudal'] = bars([('fewest', 5), ('most', 8)], 'free tail vertebrae', 'Birds have between five and eight free tail vertebrae (Bird anatomy); a house sparrow has six (Webster and Goff).')
FIGS['robin_thoracic'] = bars([('fewest', 5), ('most', 10)], 'thoracic vertebrae', 'Birds have between five and ten thoracic vertebrae (Bird anatomy).')
FIGS['robin_neck_muscles'] = FIGS['robin_cervical']
FIGS['robin_retina'] = bars([('human', 200000), ('house sparrow', 400000), ('common buzzard', 1000000)], 'photoreceptors per square millimetre', 'Density of light-sensing cells in the retina: a human, a house sparrow and a common buzzard (Bird vision). A robin was not counted.')
FIGS['robin_eyeballs'] = blocks([('c', 'Cornea: bends the light', 8, 50, None), ('l', 'Lens: focuses it', 30, 50, None), ('v', 'Vitreous jelly', 52, 50, None), ('r', 'Retina: photoreceptors', 74, 50, 'orange'), ('o', 'Optic nerve to the brain', 92, 15, 'green')], [('c', 'l', None), ('l', 'v', None), ('v', 'r', None), ('r', 'o', 'signals')], 'The route of light through a bird\'s eye (Bird vision).')
for k in ('robin_cornea', 'robin_lens', 'robin_vitreous', 'robin_optic_nerve', 'robin_iris', 'robin_eye'): FIGS[k] = FIGS['robin_eyeballs']
FIGS['robin_optic_nerves'] = FIGS['robin_eyeballs']
FIGS['robin_pancreas'] = table(['Cell type', 'Hormone', 'Job'], [['A cells', 'glucagon', 'raises blood sugar'], ['B cells', 'insulin', 'lowers blood sugar'], ['D cells', 'somatostatin', 'damps the other islet hormones'], ['PP cells', 'pancreatic polypeptide', 'slows gut movement; gives a feeling of fullness']], 'The islet cells of the bird pancreas (Bird anatomy).')
FIGS['robin_pelvis'] = table(['Bone', 'Position'], [['Ilium', 'top of the hip'], ['Ischium', 'sides of the hip'], ['Pubis', 'front of the hip']], 'The three hip bones, fused in a bird (Bird anatomy).')
FIGS['robin_tendon'] = blocks([('a', 'Ankle bends as the bird squats', 12, 50, None), ('t', 'Toe-flexor tendon is stretched', 40, 50, None), ('c', 'Toes curl round the perch', 68, 50, 'orange'), ('r', 'Straightening the leg releases them', 90, 20, None)], [('a', 't', None), ('t', 'c', None), ('c', 'r', None)], 'The popular account of the perching grip; a 2012 starling study found sleeping birds did not bend the leg enough to engage it, so how much birds rely on it is debated.')
FIGS['robin_sc_tendon'] = FIGS['robin_supracoracoideus']
FIGS['robin_barb'] = FIGS['robin_feather_scene']; FIGS['robin_hooklet'] = FIGS['robin_feather_scene']
for k in ('robin_bone_scene', 'robin_bone_wall', 'robin_bone_strut', 'robin_osteocyte', 'robin_humerus'): FIGS[k] = FIGS['robin_hollow_bones']
FIGS['robin_muscle_fibre'] = FIGS['robin_mito']
FIGS['robin_retina_scene'] = FIGS['robin_compass']
FIGS['robin_tail_coverts'] = FIGS['robin_prim']
FIGS['robin_vent'] = FIGS['robin_cloaca']
for k in ('robin_lv', 'robin_rv', 'robin_la', 'robin_ra'): FIGS[k] = FIGS['robin_heart']
FIGS['robin_radius'] = FIGS['robin_wing']; FIGS['robin_ulna'] = FIGS['robin_wing']
FIGS['robin_shoulder_girdle'] = FIGS['robin_supracoracoideus']
FIGS['robin_nape'] = FIGS['robin_cervical']
FIGS['robin_proventriculus'] = FIGS['robin_oesophagus']; FIGS['robin_rectum'] = FIGS['robin_cloaca']
FIGS['robin_intestines'] = FIGS['robin_oesophagus']
