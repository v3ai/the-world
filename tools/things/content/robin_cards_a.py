# Cards: the whole robin, the concept cards (flight, song, territory ...) and the outside (plumage, feathers, legs).
from robin_lib import *

N('robin', 'European robin', 'organism', .14, ['park_bird'],
  'The European robin (Erithacus rubecula): a small songbird, about 14 cm long and 19 g, with an orange face and breast.',
  'This is the robin of British gardens and parks: a plump little bird with an orange-red face and breast, a brown back, a pale belly and thin legs. It stands here, alert, on a boulder. Use the layer buttons to peel it: feathers, skin, muscles, skeleton, organs, air sacs and lungs, nerves. Click any part for its card. Everything is drawn at its real size, so zoom right in.',
  'A robin is a passerine, a perching bird. Its body is built for flight with very little weight: hollow bones, a big keel on the breastbone to hold the flight muscles, a fused hand, feathers, and a lung that works with air sacs. Its song, its territory and the orange breast that rivals read as a signal are all part of how it lives. The cards link each part to the human structure it matches (a wing is an arm) and to the molecules at the bottom of the scale.',
  'The model is a procedural reconstruction. Overall size and the published feather counts (10 primaries, 9 secondaries including 3 tertials, 12 tail feathers) are used; the proportions of every part and the size and place of every organ are drawn by eye from photographs and anatomical drawings and are approximate. Colours follow published plumage descriptions. The bird stands still; breathing and the heartbeat are illustrations, not measured movements.',
  [['Length', '12.5 to 14.0 cm (WR)'], ['Mass', '16 to 22 g; adult average ≈ 19 g (females 19.2 g, males 18.5 g; BTO)'], ['Wingspan', '20 to 22 cm'], ['Typical lifespan', '≈ 1 to 2 years; ringing record 8 years 4 months (BTO)'], ['Model', 'built to those sizes; feather counts from Pyle 2008 and the Flight feather and Passerine pages']],
  cert='C1', refs=[R_BIRD, R_CHORD], ext=[WR, BTO, PYLE, WPA],
  dyk='A robin\'s body temperature runs at about 41 °C when it is active (the average for birds in general), a few degrees above ours.',
  parts=['robin_flight', 'robin_wing', 'robin_song', 'robin_night_song', 'robin_territory', 'robin_migration', 'robin_temperature', 'robin_lifespan', 'robin_dinosaur', 'robin_compass', 'robin_keratin', 'robin_pigment', 'robin_breathing', 'robin_perching', 'robin_hollow_bones'],
  related=['heart', 'brain', 'skeletal_system'])

# ---------------------------------------------------------------- concept cards
N('robin_flight', 'How a robin flies', 'process', .2, ['robin'],
  'A flying bird gets lift from air flowing over its wings; flapping tilts that force forward to push the bird along.',
  'Lift is a force at right angles to the air flowing past a wing. The wing is shaped and tilted so that the air curves around it and ends up pushed downward, and by the same exchange the wing is pushed up. It is not enough to say that flapping pushes air down: the wing makes lift because air is moving over it, which is why a bird gliding with its wings still held out stays up. In flapping flight the downstroke makes the lift and most of the forward push; on the upstroke the wing is folded a little to cut the cost.',
  'The muscles that move the wing tilt the lift forward, so part of the force is thrust that beats the drag and raises speed, and the higher speed makes more lift to balance weight. A bird changes the angle of its wing to the air all the time during each beat and as its speed changes. The alula, the small group of feathers at the front of the wrist, helps hold the airflow on the wing at low speed, as when landing. Energy lost to lift-induced drag ends up mainly in vortices shed from the wing tips.',
  'The lift on a wing of area S in air of density ρ at speed v is L = ½ρv²S·C_L, where the lift coefficient C_L rises with the angle of attack up to the stall. Wing loading (weight divided by wing area) sets how fast a bird must fly: a high loading goes with short pointed wings and rapid beats, a low loading with long wings and slow flight. The bird in this model stands still: it is not drawn in flight, and the 3-D wings are folded.',
  [['Downstroke', 'makes lift and provides most of the thrust (Wikipedia, Bird flight)'], ['Upstroke', 'wing folded slightly inward to reduce the energy cost'], ['Alula', 'feathers of the "thumb" that help avoid stalling at low speed']],
  cert='C1', refs=[R_BIRD, R_MUSC], ext=[FLY, WFF], parts=['robin_pectoralis', 'robin_supracoracoideus', 'robin_alula', 'robin_prim'],
  related=['bee_flight', 'bio_evolution_of_flight'])

N('robin_song', 'Song, and how a bird sings two notes at once', 'process', .2, ['robin'],
  'A robin sings with its syrinx, a voice box at the base of the windpipe that has two sides which can work separately.',
  'A bird does not sing with its throat the way you do. The sound is made deep in the chest, where the windpipe splits in two to go to the lungs. That organ is the syrinx. Because each of the two branches has its own vibrating membranes and its own muscles, the two sides can be controlled separately, and some songbirds use this to make more than one sound at the same time. The mouth and windpipe above then shape the sound.',
  'In songbirds the syrinx lies where the windpipe forks (the tracheobronchial form). Sound comes from vibration of thin membranes and of the pessulus, a median bony wedge, as air from the lungs passes. Muscles on each bronchus tension the membranes of that side independently; a study of the intact syrinx measured the contributions of the left and right sides separately (Suthers 1990). Songbirds (oscines) have the finest control of these muscles of any birds. Both sexes sing, all year round; the winter song is more plaintive, and a male starts morning song about an hour before sunrise.',
  'The demonstration of independent left and right contributions comes from other songbirds, so it is a statement about songbirds in general. The model\'s syrinx (cut-open view) is a simplified drawing at true size.',
  [['Where', 'at the fork of the windpipe, above the lungs'], ['Sides', 'two, with independent muscles (Suthers 1990)'], ['Morning song', 'starts about an hour before civil sunrise (WR)'], ['Season', 'both sexes sing, all year (WR)']],
  cert='C2', refs=[R_BIRD, R_HEAR], ext=[SYR, WR, WPA],
  openq=['How much do robins use both sides of the syrinx at once? The independent-sides result comes from other songbirds.'], parts=['robin_syrinx'], related=['larynx'])

N('robin_night_song', 'Why robins sing at night in cities', 'process', .2, ['robin'],
  'In a Sheffield survey, robins sang at night at the places that were noisiest by day; street lights explained little once noise was counted.',
  'A robin that sings at night near a street light is a familiar puzzle. One careful study in the English city of Sheffield found that the places where robins sang at night were the places that were much noisier during the day. Light at night did not explain the pattern once the daytime noise was taken into account.',
  'The study (Fuller, Warren and Gaston 2007) visited 121 locations once by day and once at night. Robins sang by day at 67 of them and at night at 18 of those. Night-singing sites were louder by day: about 63 dB against about 53 dB. Light was higher at night-singing sites too, but that effect vanished when daytime noise was entered into the analysis. The authors suggest that robins may sing at night to avoid being drowned out by day, or because the night is quiet enough to be heard; their data cannot tell these apart.',
  'A logistic regression gave a significant effect of daytime noise (p = 0.002) and none of light (p = 0.947). Song output per session did not differ between day and night. Other studies have examined light as a cause; how much each of light and noise matters, and whether it differs between cities, is not settled.',
  [['Sites surveyed', '121 (Sheffield, 12 April to 16 June)'], ['Day singing', '67 sites (76 robins)'], ['Night singing', '18 of those sites (20 robins)'], ['Daytime noise', '≈ 63 dB at night-singing sites, ≈ 53 dB at day-only sites']],
  cert='C3', refs=[R_BEH], ext=[FUL, WR],
  openq=['Is night singing in towns a response to daytime noise, to artificial light, or both? Do the birds sing at night to avoid daytime noise or to use the quiet?'], related=['robin_song'])

N('robin_territory', 'Territory, and the red breast as a signal', 'process', .2, ['robin'],
  'A robin defends a territory, and the orange breast is what a rival responds to: in David Lack\'s experiments a bundle of red feathers could provoke an attack.',
  'Male robins defend a patch of ground fiercely against other males, and sometimes against other small birds and even their own reflection. The orange breast is the signal. David Lack put stuffed robins into the territories of living ones. The residents attacked them, and some birds even attacked a bundle of red feathers on its own.',
  'Lack\'s fieldwork was at Dartington Hall; his book The Life of the Robin appeared in 1943. In the account of his experiments, one hen robin attacked the empty space where red feathers had been. Fights are costly: territorial disputes cause up to about 10 % of adult deaths in some areas. Both sexes sing and defend ground, and song is a second signal that tells neighbours where a territory\'s owner is.',
  'The experiment shows that red feathers released the aggressive response in those birds, which fits the idea that the breast works as a signal of an intruder. It does not by itself show why red evolved or what the breast colour says about the bird, and the details of Lack\'s original tests are better read in his book than in summaries.',
  [['Fights', 'territorial disputes account for up to ≈ 10 % of adult deaths in some areas (WR)'], ['Lack\'s experiments', 'stuffed robins in territories; a bundle of red feathers could provoke attack'], ['Book', 'The Life of the Robin (Lack, 1943)']],
  cert='C2', refs=[R_BEH], ext=[LAC, WR], openq=['What does the colour and size of the red patch tell a rival, and how did it evolve as a signal?'], related=['robin_breast', 'robin_song'])

N('robin_migration', 'Migration: some robins travel, many stay', 'process', .2, ['robin'],
  'British and Irish robins mostly stay put; robins from Scandinavia and Russia move west and south for the winter.',
  'In Britain and Ireland most robins are residents all year. A small minority, mostly females, leave for southern Europe, some as far as Spain. Robins breeding in Scandinavia and Russia are the long-distance ones: they migrate to Britain and western Europe to escape harsher winters, which is why there are more robins in British gardens in winter.',
  'A population can contain both residents and migrants, so migration is a habit that varies within a species, not a single trait. The robin is also the best-known test animal for the question of how migrating birds keep direction, which leads to the compass card.',
  'The shares of residents and migrants vary between populations and years. Migrants are described as greyer above and duller orange below than residents.',
  [['British and Irish robins', 'largely resident; a small minority (usually females) goes to southern Europe, some to Spain'], ['Scandinavian and Russian robins', 'migrate to Britain and western Europe for winter']],
  cert='C1', refs=[R_BEH], ext=[WR, BTO], related=['bio_migration_navigation', 'robin_compass'])

N('robin_temperature', 'Body temperature and heart rate', 'process', .2, ['robin'],
  'Birds run hotter than mammals: about 41 °C when active, and a small songbird\'s heart beats several hundred times a minute.',
  'A robin is warm-blooded and runs hotter than you: birds in general average about 38.5 °C at rest and about 41 °C when active. Its heart is small and very fast. For scale, a similar-sized songbird, the tropical spotted antbird of about 17 g, was measured in the wild at between 260 beats a minute at night and 824 a minute by day.',
  'In a review of body temperatures in birds, the mean was 38.54 ± 0.96 °C in the resting phase (203 birds), 41.02 ± 1.29 °C in the active phase (724) and 43.85 ± 0.94 °C in high activity (74). Passerines run slightly high in the active phase. The animation of the heart in this model is an illustration with no real rate. For scale, a ruby-throated hummingbird\'s heart can beat up to 1,200 times a minute.',
  'Heart rate and oxygen use rise together, so a heart-rate record can stand in for the energy a bird spends. Many birds lower their body temperature a little at night as a way to save energy. The antbird numbers are for another species in a rain forest, not a measurement on robins.',
  [['Body temperature, resting phase', '≈ 38.5 °C (all birds; mean of 203)'], ['Active', '≈ 41.0 °C (all birds; mean of 724)'], ['High activity', '≈ 43.9 °C (all birds; mean of 74)'], ['Heart rate, spotted antbird (≈ 17 g)', '260 to 824 beats/min, mean 492 (Steiger et al. 2009)']],
  cert='C2', refs=[R_HOM, R_CIRC], ext=[PRZ, STE, WBA],
  openq=['What is a robin\'s own heart rate at rest, in flight and in winter? The values on this card are for birds in general and for a similar-sized tropical songbird.'], related=['heart'])

N('robin_lifespan', 'How long a robin lives', 'process', .2, ['robin'],
  'Most robins die in their first year: the average life expectancy is about 1.1 years, though a few live many years.',
  'Robins have a short average life because so many die in their first year. Birds that reach breeding age typically live about two years. The oldest ringed wild robin on the British record reached 8 years, 4 months and 30 days (ringed bird, 1977). A longer record of 19 years is quoted in other places.',
  'Life expectancy at the start (about 1.1 years) is much lower than the typical age of birds that survive to breed (about 2 years) because of heavy first-year mortality. Very low winter temperatures raise mortality, and fighting over territory accounts for up to about 10 % of adult deaths in some areas.',
  'The two sources disagree on the record age (8 years 4 months from the British ringing scheme, 19 years in Wikipedia); the card gives both rather than choosing.',
  [['Average life expectancy', '≈ 1.1 years (WR)'], ['Typical age if it reaches breeding', '≈ 2 years (BTO)'], ['Ringing record', '8 years 4 months 30 days (BTO); 19 years quoted by WR'], ['Broods', 'usually 2 a year, 4 to 5 eggs (2 to 9), incubation 14 to 16 days, fledging at 12.5 to 16 days (BTO)']],
  cert='C2', refs=[R_REPR], ext=[WR, BTO], openq=['Which record is right? The ringing record and the longer quoted age differ.'])

N('robin_dinosaur', 'Birds are living dinosaurs', 'process', 1, ['robin'],
  'Birds are theropod dinosaurs: the robin is a descendant of feathered dinosaurs that lived over 150 million years ago.',
  'A robin is a dinosaur, in the same way you are a mammal. Birds belong to the theropods, the group that includes Velociraptor and Tyrannosaurus, and many theropods had feathers. Fossils of more than thirty feathered non-bird dinosaurs have been collected, many in Liaoning in China. Features that robins share with those dinosaurs include hollow, air-filled bones, a gizzard, and a habit of nest-building and brooding.',
  'The present consensus is that birds are maniraptoran theropods that originated in the Mesozoic. Sinosauropteryx (found in 1996) was covered in simple filaments, and later work showed that its filaments had a central shaft with barbs. Anchiornis, a small feathered dinosaur with long arm and leg feathers, lived before Archaeopteryx. Archaeopteryx, from the Late Jurassic limestone of Solnhofen in Germany, is about 155 million years old.',
  'Debated within that consensus: the exact sequence of changes among the maniraptorans; which digits the bird hand keeps (II-III-IV on the embryo, I-II-III in the fossils); whether the earliest flapping evolved from the ground up, from the trees down or with wing-assisted running up slopes. A small minority argues that birds did not come from dinosaurs at all.',
  [['Descent', 'birds are maniraptoran theropod dinosaurs (consensus)'], ['Feathered non-bird dinosaurs', 'more than 30 species with preserved feathers'], ['Archaeopteryx', '≈ 155 million years old (Late Jurassic)'], ['Shared with theropods', 'pneumatic bones, gizzard stones, nest-building, brooding']],
  cert='C1', refs=[R_REPT, R_BIRD, R_PHYL], ext=[ORI, BIRD],
  openq=['Which digits of the bird hand are which (II-III-IV from embryos, I-II-III from fossils)?', 'How did flight begin: from the ground up, from the trees down, or by running up slopes?'], related=['bio_reptiles_birds', 'bio_evolution_of_flight'])

N('robin_compass', 'A magnetic compass sense', 'process', 1e-6, ['robin'],
  'Robins appear to sense Earth\'s magnetic field; one idea is that a light-sensitive protein in the eye, cryptochrome, is the sensor. This is not proved.',
  'The European robin is one of the migratory songbirds used to test the idea that birds have a compass in their eyes. The leading hypothesis says that when light hits a protein called cryptochrome, two electrons are moved and a pair of molecules, each with an unpaired electron, forms. Earth\'s magnetic field, weak as it is, could change how long that pair lasts, and so change a signal the bird sees. Whether this is really how robins sense direction is an open question.',
  'In 2021 Xu and colleagues reported that cryptochrome 4 from the European robin, made in the laboratory, has a chain of four tryptophan amino-acid residues along which light moves electrons in four steps, forming four radical pairs. Radicals lasting more than 100 nanoseconds were found, long enough to be sensitive to a magnetic field, and the protein carries its flavin (FAD) fully. The results are from purified protein in a test tube; conditions in a living eye differ, and the work did not show the effect in a bird.',
  'The radical-pair mechanism is accepted as real chemistry. What is unproved is that cryptochrome 4 in the robin\'s eye is the compass, how the radical pairs would be read out by the nervous system, and how the weak signal survives the noisy environment of a living cell. Tests would need to link the molecule to the bird\'s behaviour.',
  [['Candidate molecule', 'cryptochrome 4 (robin), carrying the cofactor FAD'], ['Electron transfers', 'four, along a tryptophan chain (in vitro)'], ['Radical lifetime', 'over 100 ns in the wild-type protein (in vitro)'], ['Status', 'hypothesis: not shown in a living bird']],
  cert='C3', refs=[R_SENS, R_VIS], ext=[XU, WONG, HORE],
  openq=['Is cryptochrome 4 the robin\'s magnetic sensor in the living eye?', 'How is a magnetically sensitive chemical signal read out by the nerves, and how does it survive in a living cell?'], related=['bio_migration_navigation', 'magnetic_fields_forces'])

N('robin_keratin', 'Keratin: the protein of feathers, bill and claws', 'molecule-group', 1e-9, ['robin'],
  'Feathers, beak and claws are made of beta-keratin, a tough protein held together by sulfur bridges between cysteine units.',
  'The hard, light stuff of a feather is a protein called keratin. In birds and reptiles it is a special kind, beta-keratin, built of sheets that are twisted together and locked by sulfur-to-sulfur bridges. Those bridges come from the amino acid cysteine. The keratin molecule itself is not in this explorer\'s molecule data; its building block, cysteine, and the linked pair, cystine, are.',
  'Beta-keratins are found only in birds and reptiles. In feathers, beaks and claws they are formed mainly as beta-pleated sheets, stabilised by disulfide bridges between cysteine residues. Hair and horn in mammals are made of a different protein family, alpha-keratin. Because a bridge cannot be undone without a chemical reaction, a feather is a long-lived, heat-stable material.',
  'The sauropsid beta-keratins are encoded by a different gene family from alpha-keratins; the name "corneous beta proteins" has been proposed to avoid the confusion. Human hair is about 14 % cysteine for comparison (not measured on feathers).',
  [['Where', 'feather, bill, claw'], ['Cross-links', 'disulfide bridges between cysteines'], ['Not in the molecule data', 'keratin itself; cysteine and cystine are']],
  cert='C1', refs=[R_PRO], ext=[KER, WFE], parts=['robin_barbule'], related=['hair_follicle'])

N('robin_pigment', 'What colours the robin\'s feathers', 'process', 1e-6, ['robin'],
  'Brown feathers get their colour from melanin; the orange of the breast is classed as melanin-based in one study, but its pigment has not been shown by chemical analysis.',
  'Feather colour comes from pigments and from structure. The two common pigment groups are melanins (browns and blacks) and carotenoids (reds, oranges and yellows that a bird gets from its food). The robin\'s brown back is melanin. For the orange breast, a study that measured the colour of four European songbirds grouped the robin\'s breast with the melanin-based colours; the authors say this is the main mechanism and that the classification rested on the usual understanding, not on chemical tests.',
  'The paper (Delhey and colleagues 2010) measured 236 robin samples over three years. It suggests that a red feather may be coloured by phaeomelanin, the reddish form of melanin, which is the dominant pigment in many red plumages. A carotenoid colour cannot be ruled out without extracting the pigment from robin breast feathers. For that reason this explorer does not draw a carotenoid molecule here.',
  'Melanin is made from the amino acid tyrosine through L-DOPA; the molecule data has L-DOPA, tyrosine, and also beta-carotene, which is only an example of the carotenoid group. Birds cannot make carotenoids and take them in food; whether a robin does so for its breast is not shown.',
  [['Back', 'brown, melanin-based (Delhey et al. 2010)'], ['Breast', 'classed melanin-based; pigment not tested by chemistry'], ['Study', '236 robin samples, April 2005 to January 2008']],
  cert='C3', refs=[R_PRO], ext=[DEL, WFE], parts=['robin_pigment_granule'],
  openq=['Which pigment colours the robin\'s orange breast: phaeomelanin, a carotenoid, or both? It needs chemical analysis of the feathers.'])

N('robin_breathing', 'How a robin breathes: air that flows one way', 'process', .05, ['robin'],
  'A bird\'s lungs are fed by air sacs, so air flows through the lung in one direction, in and out, and a single breath stays in the body for two breath cycles.',
  'You breathe in and out through the same tubes, and the air in your lungs goes back and forth. A bird does not. Air passes through its lungs in one direction all the time, because the lungs are connected to a set of balloon-like air sacs that act as bellows. Fresh air goes first to the sacs at the back, then through the lung, then to the sacs at the front, and out. A little of each breath is in the bird for two breath cycles before it is breathed out.',
  'The air sacs do not exchange gas themselves; the lung tubes (parabronchi) do. Aerodynamic valves and narrowing of the airways keep the flow in one direction, so the lung gets fresh air during both the breathing-in and the breathing-out. In a tracer-gas study of zebra finches and yellow-headed blackbirds, the anterior sacs were ventilated differently during calling and flapping, and the tracer reached the front sacs faster than the simple model predicts, so the picture still has details to be worked out.',
  'Birds have typically nine air sacs (range 7 to 12). Wikipedia says passerines have seven, so descriptions differ. The model draws nine in the usual textbook arrangement.',
  [['Air sacs', 'typically nine (range 7 to 12); the model draws nine'], ['One breath', 'stays about two breath cycles (duck model)'], ['Breathing rate in the tracer-gas study', 'calling raised it from 1.5 to 2.3 breaths per second; wing flapping reached 3.5']],
  cert='C2', refs=[R_GAS, R_BREATH, R_ARESP], ext=[AIR, WBA], parts=['robin_lungs', 'robin_air_sacs'],
  openq=['How exactly do valves and airway shapes keep the flow in one direction, and how do the front sacs behave during calling and flapping?'], related=['lung_r', 'diaphragm'])

N('robin_perching', 'How a robin keeps hold of a twig', 'process', .02, ['robin'],
  'A tendon behind the ankle tightens when the leg bends, curling the toes round a perch with little effort.',
  'A bird can stand on a twig all night without tiring. When it squats, the ankle bends and a long tendon is pulled tight; the tendon pulls the toes shut around the perch. The tendon and the tissue around it are rough, which locks the grip until the leg straightens again. The ankle is the joint that looks like a backward knee. In the standing pose shown here, the toes rest flat on the boulder, so the lock is not engaged.',
  'A robin\'s foot has three toes pointing forward (toes II, III and IV) and one back (the hind toe, toe I): the usual arrangement in perching birds and nearly all songbirds. The toe bones number 3, 4 and 5 in the three forward toes and 2 in the hind toe.',
  'A 2012 study of European starlings found that sleeping birds bent their knees only slightly, not enough to engage the lock, and balanced on the central pad of the foot, so the lock may matter less than the popular explanation says.',
  [['Toe bones', '3, 4, 5 (toes II, III, IV) and 2 (toe I)'], ['Ankle', 'the joint between the tibiotarsus and tarsometatarsus']],
  cert='C2', refs=[R_JOINT], ext=[FEET, src('Why don\'t birds fall off branches when they sleep (Science ABC)', 'https://www.scienceabc.com/nature/animals/why-dont-birds-fall-off-branches-when-they-sleep.html')],
  openq=['How much do birds depend on the tendon lock while perching and sleeping?'], parts=['robin_tendon', 'robin_leg_ankle', 'robin_leg_toes'])

N('robin_hollow_bones', 'Hollow bones with struts', 'process', 1e-3, ['robin'],
  'Many bird bones are hollow and air-filled, braced inside by thin struts: light, but stiff.',
  'A bird\'s skeleton has to be light enough to fly. Many of its bones are hollow tubes filled with air, with thin struts across the inside like the braces in a bridge. The air comes from the air sacs, which reach into some bones. A feathered bird\'s plumage can weigh two or three times as much as its skeleton. Not every bird has hollow bones: penguins, loons, puffins and kiwis do not.',
  'Pneumatised bones are shared with the theropod dinosaurs that birds came from. In a tube, strength comes from the wall and from the distance of material from the axis, so a thin hollow wall can match a solid rod of much greater mass.',
  'The extent of pneumatisation differs between species and between bones; in small songbirds some bones carry little air. How far pneumatisation reaches in a small songbird varies from bone to bone; the tissue scene is a general picture of a hollow bird bone, not a measurement on a robin.',
  [['Plumage vs skeleton', 'plumage can weigh 2 to 3 times as much as the skeleton (WFE)'], ['No hollow bones', 'penguins, loons, puffins, kiwis (WBA)']],
  cert='C1', refs=[R_BONE, R_ABONE], ext=[WBA, WFE, ORI], parts=['robin_humerus', 'robin_bone_scene'], related=['long_bone', 'compact_bone'])

# ---------------------------------------------------------------- outside: plumage regions
def reg(id, title, summary, basics, deeper, expert, facts, **kw): N(id, title, 'structure', .03, ['robin'], summary, basics, deeper, expert, facts, **kw)
FE = 'robin_feather_scene'
reg('robin_crown', 'Crown', 'The top of the head: olive-brown, running back from just above the forehead.',
  'The crown is brown, with an olive tinge in British birds, and sits like a cap above the orange face. Click a part and look at the layer buttons to see what lies under it: skin, then the skull.',
  'The head feathers are small contour feathers laid like tiles. Like those of the nape and back, they are coloured by melanin. Young robins are spotted brown and white, and the orange appears gradually.',
  'The borders between the brown crown and the orange face and the grey neck are drawn jagged on purpose; in life they are the edges of feather tracts and the feathers overlap.',
  [['Colour', 'brownish, olive-tinged in British birds (WR)'], ['Juvenile', 'spotted brown and white; orange appears gradually (WR)']], refs=[R_BIRD], ext=[WR])
reg('robin_nape', 'Nape and neck', 'The back of the head and the neck: olive-brown, over the long neck bones.',
  'The nape is the back of the neck. It is brown like the crown and back. Under the feathers lies a long, flexible neck: a songbird has 14 neck vertebrae, twice as many as a person.',
  'The feathers sit in rows (tracts) on bare skin between them. The neck lets the robin turn its head far back to preen and to look along its body with each eye.',
  'The neck is covered by contour feathers and downy feathers beneath; the model draws only one smooth outline for the neck feathers.',
  [['Neck vertebrae', '14 in all but 2 of 159 songbirds in a study of 47 species (Webster and Goff)']], refs=[R_BIRD, R_SKEL], ext=[WR, WEB], related=['skeletal_system'])
reg('robin_face', 'Face and throat', 'The orange face, chin and throat: the front of the signal patch, edged with grey on the sides of the neck.',
  'The face is orange from the forehead and the eye down to the chin and throat, and runs on into the breast. Males and females look alike. The eye sits in the orange, with a thin pale ring round it.',
  'In Lack\'s experiments a bundle of red feathers could provoke territorial attack, so the orange front of a robin is treated as a signal to rivals. How the pigment is made is not proved (see the colour card).',
  'The face is made of small feathers that end in bristle-like tips around the bill base (rictal bristles) in many birds; the model draws only the smooth outline.',
  [['Colour', 'orange face and breast, edged with bluish grey (WR)'], ['Sexes', 'look alike (WR)']], cert='C2', refs=[R_BEH], ext=[WR, LAC, DEL], related=['robin_territory', 'robin_pigment'])
reg('robin_breast', 'Breast', 'The orange breast: the robin\'s famous signal, bordered by grey at the sides.',
  'This is the orange-red that gives the robin its name. It sits over the large flight muscles of the breast. Rivals read it as a threat, and a bundle of red feathers alone could provoke an attack in Lack\'s experiments.',
  'The breast feathers overlap like roof tiles and are thick enough to hold a layer of air against the skin. Their colour was classed as melanin-based by Delhey et al. 2010, without a chemical test.',
  'Under the feathers and skin the large pectoral muscles cover the keeled breastbone. The shape of the breast changes as the bird fluffs its feathers.',
  [['Colour', 'orange; classed melanin-based (unproven)'], ['Signal', 'a bundle of red feathers could provoke attack (Lack)']], cert='C2', refs=[R_BEH], ext=[WR, DEL, LAC], related=['robin_territory', 'robin_pigment', 'robin_pectoralis'])
reg('robin_grey', 'Grey border of the breast', 'A band of bluish grey between the orange breast and the brown back, on the sides of the neck and chest.',
  'The orange face and breast are edged on the sides of the neck and chest with bluish grey. The grey makes the orange stand out.',
  'Grey in feathers is usually a dilute black melanin. Blue-looking colours in feathers can also come from fine structure that scatters light, so the origin of the blue tinge is a separate question.',
  'The colour in the model is a flat grey; the real band is feathered and graded.',
  [['Colour', 'bluish grey (WR)']], refs=[R_BIRD], ext=[WR, WFE])
reg('robin_back', 'Back (mantle and scapulars)', 'The olive-brown upper back and the long shoulder feathers that cover the folded wing\'s root.',
  'The back is olive-brown: camouflage when the robin is on the ground or in a hedge. Its folded wings lie over the sides of it.',
  'The scapular feathers are long feathers growing along the shoulder blade; they lie over the base of the folded wing.',
  'The brown is melanin-based in the Delhey et al. 2010 classification.',
  [['Colour', 'brown, olive-tinged in British birds (WR)']], refs=[R_BIRD], ext=[WR, DEL])
reg('robin_rump', 'Rump', 'The lower back above the tail, where the tail feathers are anchored.',
  'The rump is the rear of the back, just in front of the tail. Under its feathers the fused hip bones and the stub of the tail bones lie.',
  'The upper tail coverts spring from here and cover the roots of the tail feathers. The preen gland (uropygial gland) of many birds lies on the rump; it is not drawn in this model.',
  'The rump plumage is slightly warmer brown in the model.',
  [['Role', 'plumage over the pelvis, the base of the tail']], refs=[R_BIRD], ext=[WR])
reg('robin_flank', 'Flank', 'The side of the body between the wing and the belly: buff-brown.',
  'The flank is the side of the belly, below the folded wing and above the leg. The thigh is hidden under these feathers; only the lower leg shows.',
  'The leg has a "knee" hidden in the flank plumage: what looks like a backward knee below it is the ankle.',
  'Flank feathers are loose and fluff out; they help insulate the thigh.',
  [['Colour', 'buff-brown (drawn)']], refs=[R_BIRD], ext=[WR])
reg('robin_belly', 'Belly', 'The pale belly: whitish, in contrast with the orange breast above it.',
  'The belly is whitish. It covers the soft organs: the gizzard, liver and intestines, with the air sacs round them.',
  'The belly feathers are denser at the sides; a bird in cold weather fluffs them to trap air.',
  'Under the belly lies the posterior part of the body cavity; the keel of the breastbone does not reach the rear.',
  [['Colour', 'whitish (WR)']], refs=[R_BIRD], ext=[WR])
reg('robin_vent', 'Vent and undertail area', 'The feathers round the single opening for gut, kidneys and reproduction, the cloaca.',
  'The vent is the area around the cloaca: birds use one opening for droppings, urine and reproduction. The feathers of the undertail cover the base of the tail from below.',
  'The kidneys excrete nitrogen as uric acid, which is semi-solid; it leaves with the faeces.',
  'The cloaca is also the opening of the reproductive tract; the same opening serves the reproductive tract.',
  [['Opening', 'one: the cloaca']], refs=[R_EXC], ext=[WBA], related=['robin_cloaca'])

N('robin_bill', 'Bill: upper and lower mandible', 'structure', .013, ['robin'],
  'The bill is a thin, pointed horny sheath over the jaw bones: the robin\'s tweezers for picking up small food.',
  'The bill has two halves, the upper and lower mandible. They are covered with a hard, horny sheath of keratin and are black in a robin. A robin uses its bill like tweezers to pick up small food. Birds have no teeth: the bill and the gizzard do the work.',
  'The horn sheath is a living tissue that grows continuously and wears at the tip. Inside, the upper jaw is a slender bone (the premaxilla) fused to the skull, and the lower jaw hinges at the quadrate bone. The nostrils open on the top of the upper mandible near its base.',
  'The sheath is beta-keratin, like feathers and claws. Birds can move the upper jaw a little on the skull (cranial kinesis), a trait that varies by group; its extent in robins is not described here.',
  [['Colour', 'black (WR)'], ['Material', 'keratin over bone']], refs=[R_BIRD], ext=[WR, WBA], related=['robin_keratin', 'robin_upper_jaw'])
N('robin_nostrils', 'Nostrils', 'structure', .001, ['robin'], 'The two small openings in the upper bill near its base, through which air reaches the nose.',
  'Birds breathe in through two small nostrils, near the base of the upper bill. They lead into the nasal cavity and then down the windpipe.',
  'The openings are often partly covered by feathers or a flap. They are not at the tip of the bill, as in a mammal, but at its base, so that the bill can probe without clogging them.',
  'The nostrils are drawn as small ovals at true size.',
  [['Number', '2']], refs=[R_BIRD], ext=[WBA])
N('robin_eye', 'Eye', 'structure', .008, ['robin'],
  'A robin\'s eye is dark and large for the size of its head.',
  'The black bead you see is the front of the eye: the dark pupil and the iris round it. The whole eyeball is about 8 mm across in the model and fills much of the head. Each eye points sideways, so the robin sees a wide area at once, and it turns its head to look at things with both eyes.',
  'The cut-open view shows the layers: the cornea, the iris, the lens, the vitreous, the retina, and the pecten, a pleated fold that is only found in birds. Click the retina to look inside it.',
  'The eye is drawn about 8 mm across; the real size varies by individual. The visible dark dome in the plumage is the cornea and pupil; the iris is dark brown to black in a robin.',
  [['Eyeball (model)', '≈ 8 mm across'], ['Colour', 'dark, "black" (WR)']], refs=[R_VIS], ext=[WR, PECT, SCL], related=['robin_retina', 'cornea', 'iris'], parts=['robin_eye_ring', 'robin_cornea'])
N('robin_eye_ring', 'Eye ring', 'structure', .008, ['robin'], 'A thin pale ring round the eye: the rim of the eyelids with a ring of tiny feathers.',
  'Many birds have a ring round the eye, made of the eyelid rim and small feathers. In a robin it is faint.',
  'The ring follows the edge of the eyelids, which close over the eye.',
  'The ring is drawn as a thin tube; in life it is graded and feathered.',
  [['Where', 'round the eye, on the edge of the eyelids']], refs=[R_VIS], ext=[WR], related=['robin_eye'])
