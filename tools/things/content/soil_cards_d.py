# Cards D: the small animals, and the cards of the two tissue-style scenes (a soil crumb, a clay particle and its ions).
from soil_lib import *

# ================= animals =================
N('soil_woodlouse', 'Woodlouse (Oniscus asellus)', 'organism', 0.015, ['soil_block', 'bio_arachnids_crustaceans'],
  "The common woodlouse is not an insect but a land-living crustacean, a relative of crabs and shrimps; it eats dead plants and rotting wood.",
  "Lift a flowerpot or a log and you will often find woodlice. A common woodlouse grows to about 16 millimetres long and 6 wide. It is flat, shiny brown-grey, made of overlapping plates, and has seven pairs of legs and two pairs of feelers (antennae); the second pair is long and the first so short that you can hardly see it. It is a crustacean, so closer to a crab than to a beetle; it breathes with modified limbs under its tail and loses water easily, which is why it gathers in damp places. It eats dead plant matter, especially partly decayed leaves, and also eats its own droppings to extract more from them. In this way it chews litter into small pieces for the fungi and bacteria that follow.",
  "Woodlice (Oniscidea) have a head, a pereon (thorax) of seven segments, each with a pair of legs, and a pleon (abdomen) of five segments plus a pleotelson. Some or all of the five pairs of pleopods are adapted for breathing. Woodlice are mainly detritivores that eat dead plant matter and reingest their faeces (coprophagy). Unlike earthworms, they fragment plant matter into small pieces without grinding it finely, so they contribute little to mineralisation; they are a major contributor to the humification process. They often gather under objects, which reduces moisture loss. Most woodlice cannot roll into a ball.",
  "The model woodlouse is 15 mm long and 6.5 mm wide, with 13 body plates, two eyes, seven pairs of legs, long second antennae and two tail points (uropods); its plates are simplified and the short first antennae and the breathing structures under the tail are not drawn. Its chitin skeleton can be viewed as a molecule unit.",
  [('Length', 'up to 16 mm (model: 15 mm)'), ('Width', '6 mm (model: 6.5 mm)'), ('Legs', '7 pairs'), ('Antennae', '2 pairs'), ('Eats', 'dead plant matter; also its own droppings'), ('Group', 'crustacean (not an insect)')],
  'C1', [R_ART], [W_ONIS, W_WOOD], related=['soil_decomposition', 'bio_arachnids_crustaceans', 'bee_chitin'])

N('soil_springtail', 'Springtails (Collembola)', 'organism', 0.0018, ['soil_block', 'bio_entomology_insects'],
  "Springtails are wingless, six-legged animals 1 to 2 millimetres long that live in huge numbers in leaf litter and soil, eating fungal threads and dead plant matter.",
  "On the litter on the lawn, and in the crumbs of the topsoil, are specks the size of a full stop that jump when disturbed. They are springtails. A soil-living springtail is 1 to 2 millimetres long. Estimates of their numbers reach 100,000 in a square metre of ground. They live in leaf litter and rotting material and most eat fungal threads and spores as well as dead plant matter; a few eat other tiny animals. They are not insects in the strict sense but a related group, and there are more than 9,000 species. In the block there are about 16 of them in the litter and on the crumbs.",
  "Most springtails have a forked 'spring' (furcula) folded under the body and held under tension by a small catch (the retinaculum). When the catch lets go, the furcula snaps against the ground and flings the animal into the air; the whole action takes a few milliseconds. Many have a number of ocelli (simple eyes) from one to eight on each side of the head; blind species, mostly subterranean, lack them. They are free-living and moisture-loving. Atmobiotic (surface-dwelling) species are generally 8 to 10 mm long, hemiedaphic (soil-dwelling) species 1 to 2 mm.",
  "The model springtail is 1.8 mm long, a drawing of an elongated soil species: body in 10 parts, four-segmented antennae drawn as bent tubes, six legs, and a folded spring. Eyes and the other details are not drawn. The spring is a separate part. The positions and the number (16) are illustrative.",
  [('Length', '1 to 2 mm for soil species (model: 1.8 mm)'), ('Legs', '6'), ('Spring', 'furcula held by a catch; a jump takes a few milliseconds'), ('Density (estimate)', 'up to ≈ 100,000 per m²'), ('Species', 'more than 9,000')],
  'C1', [R_ART], [W_SPRING], parts=['soil_springtail_furca'], related=['soil_decomposition', 'soil_hyphae', 'bio_entomology_insects'])

N('soil_springtail_furca', 'Springtail: the spring (furcula)', 'structure', 0.0006, ['soil_springtail'],
  "The spring is a forked tail-like limb folded under the springtail's body; it is held under tension and, when released, flings the animal into the air in a few milliseconds.",
  "The reason springtails have their name is a small forked piece under the end of the body. It is held bent under the belly like a loaded spring. When the animal is startled, it lets go and the fork flicks against the ground, throwing the animal up and away faster than you can follow.",
  "The furcula is held under tension by the retinaculum (also called the tenaculum). When released, it snaps against the substrate and flings the animal into the air; the action takes a few milliseconds.",
  "The model draws two short rods folded under the rear of the animal; real furcula have a base and two slender branches.",
  [('Part of', 'springtails (Collembola)'), ('Held by', 'a small catch (retinaculum)'), ('Action time', 'a few milliseconds')],
  'C1', [R_ART], [W_SPRING], related=['soil_springtail'])

N('soil_mite', 'Oribatid mites (moss mites)', 'organism', 0.0007, ['soil_block', 'bio_arachnids_crustaceans'],
  "Oribatid mites are tiny, hard-shelled, eight-legged soil animals, 0.2 to 1.4 millimetres long, that eat dead plant matter and fungi and help spread fungi through the soil.",
  "On the leaf litter and between the crumbs live mites, relatives of spiders. The oribatid mites are the shiny, brown, dome-shaped ones, 0.2 to 1.4 millimetres long. Many of them have a hard, mineral-strengthened shell, like a tiny armoured beetle. They eat a wide variety of dead plant and fungal material, and are essential for breaking down dead matter and spreading fungi. They develop slowly: from egg to adult may take from several months to two years in forest soil, and the adults live a relatively long time.",
  "Oribatida range from 0.2 to 1.4 mm. Many have a mineralised exoskeleton as adults, some with wing-like flaps (pteromorphae) over the legs, and some can tuck in their legs. They feed on living and dead plant and fungal material (non-parasitic ones; a few are predatory). Density is highest in forests with thick organic layers.",
  "The model mite is 0.7 mm long, a dome with a small head and eight legs, with no further detail; 10 of them are placed on the litter and the crumbs, which is illustrative. Adult mites have eight legs, as arachnids do.",
  [('Length', '0.2 to 1.4 mm (model: 0.7 mm)'), ('Legs (adult)', '8'), ('Shell', 'mineral-strengthened in many'), ('Egg to adult', 'several months to two years (forest soil)'), ('Eats', 'dead plants, fungi')],
  'C1', [R_ART], [W_ORIB], related=['soil_decomposition', 'bio_arachnids_crustaceans'])

N('soil_beetle', 'Ground beetle (Pterostichus madidus)', 'organism', 0.016, ['soil_block', 'bio_entomology_insects'],
  "A black ground beetle 14 to 20 millimetres long, common in gardens and grassland, which hides under stones and in grass and is most often seen in summer.",
  "This glossy black beetle is a common ground beetle of British gardens and grassland. It is usually 14 to 20 millimetres long, black with reddish-brown to black legs, and you will find it under stones, in grass or in loose bark. It is most abundant in summer and breeds in autumn. In Britain it is also called the rain beetle, because it tends to appear when rain is coming. Click its head, its wing cases or its legs for the parts.",
  "The beetle's front wings are hardened into wing cases (elytra) that cover the folded flight wings and the abdomen; here the wing cases carry grooves running lengthwise. The skeleton is on the outside, made of chitin, which can be viewed as a molecule unit. The species is native to Europe.",
  "The model beetle is 16 mm long, drawn from the general form of a ground beetle: head with large eyes, jaws and antennae, a pronotum (the shield over the thorax), wing cases with lengthwise grooves (nine are drawn on each side as a simplification) and three pairs of legs. Details such as the antennal joints and the leg spines are not drawn.",
  [('Length', '14 to 20 mm (model: 16 mm)'), ('Colour', 'black; legs red-brown to black'), ('Habitat', 'gardens, grassland, dry woodland'), ('Season', 'most abundant in summer; breeds in autumn')],
  'C1', [R_ART], [W_PTERO], parts=['soil_beetle_head', 'soil_beetle_legs'], related=['bee_chitin', 'bio_entomology_insects'])

N('soil_beetle_head', 'Ground beetle: head, jaws and antennae', 'structure', 0.004, ['soil_beetle'],
  "The beetle's head has two large eyes, a pair of jaws that bite sideways, and two antennae for smell and touch.",
  "The head carries two eyes, one on each side, two long feelers (antennae) that taste and smell the air and ground, and the jaws (mandibles), which open and close sideways like pincers.",
  "Beetle mouthparts are chewing mouthparts: the mandibles move sideways, not up and down, and the antennae carry the sense organs for smell and touch. The head is a rigid capsule of chitin.",
  "The model head is 3.6 mm long with eyes, two curved jaws and two antennae; no mouthparts other than the jaws are drawn.",
  [('Eyes', '2'), ('Jaws', '2 mandibles, move sideways'), ('Antennae', '2, for smell and touch')],
  'C1', [R_ART], [W_PTERO], related=['bee_compound_eye', 'bee_chitin'])

N('soil_beetle_legs', 'Ground beetle: legs', 'structure', 0.01, ['soil_beetle'],
  "A ground beetle has three pairs of long legs and runs fast over the ground.",
  "The beetle has six legs, three on each side, long and slender, with reddish-brown to black colour. It is found on the ground, under stones and in grass.",
  "Insects and other arthropods have jointed legs: the segments are joined by hinge joints and moved by muscles inside the hard skeleton.",
  "The legs are drawn as one tapered tube each, without the joints.",
  [('Legs', '6 (3 pairs)'), ('Colour', 'reddish-brown to black')],
  'C1', [R_ART], [W_PTERO], related=['soil_beetle'])

# ================= the crumb scene =================
N('soil_crumb', 'Inside a soil crumb', 'structure', 0.002, ['soil_crumbs', 'soil_horizon_a'],
  "A window of about 2 millimetres into one soil crumb: sand grains, many smaller grains of silt, flakes of clay, dark humus, a film of water, air pores, bacteria, a nematode, a fungal thread and a root hair.",
  "A crumb of topsoil looks like a brown lump, but under a microscope it is a crowded city. The big stones are sand grains. Between them are many smaller grains of silt and, smaller than anything you can see even in this view, flakes of clay. Everything is glued together by dark humus (decayed plant matter), fungal threads and bacterial slime. A thin film of water coats the grains, and the gaps that are not full of water are filled with air. Bacteria live on the film. A nematode, a microscopic worm, grazes on them. A root hair reaches in to drink. All are drawn at their own sizes against a scale bar. Click anything in the scene.",
  "The size classes are standard: sand grains 63 micrometres to 2 mm (fine 63 to 200, medium 200 to 630, coarse 630 to 2,000), silt 2 to 63 micrometres, clay below 2 micrometres. The sand of inland soils is mostly quartz, the most common mineral resistant to weathering. A bacterium is 0.5 to 5 micrometres long; a fungal thread 4 to 6 (2 to 10) micrometres wide; a root hair 15 to 17 micrometres wide and 80 to 1,500 long; free-living nematodes are often under 2.5 mm long, some about 1 mm. Aggregation is helped by humus, clay, iron oxides, fungal hyphae and biofilms.",
  "Drawn to scale: the size classes of the mineral grains, the width of the bacteria, the thread and the root hair. Illustrative: the number and places of every kind of thing (a real crumb holds far more bacteria and far fewer large organisms than this), the thickness of the water film and humus coats, the pore sizes, and the nematode's width. Clay flakes are drawn at 1.8 micrometres, just under the clay limit; real clay particles can be much smaller and thinner. The scene shows a window of the crumb, not the whole crumb, which is 4 to 9 mm across in the block.",
  [('Field of view', '≈ 2.2 mm'), ('Sand', '63 µm to 2 mm (quartz mostly)'), ('Silt', '2 to 63 µm'), ('Clay', 'under 2 µm'), ('Bacteria', '0.5 to 5 µm'), ('Fungal thread', '4 to 6 µm wide'), ('Root hair', '15 to 17 µm wide')],
  'C1', [R_SOIL, R_PROK], [W_GRAIN, W_SAND, W_STRUCT, W_NEM, W_BIO, W_ECM], parts=['soil_sand', 'soil_silt', 'soil_clay', 'soil_humus', 'soil_water_film', 'soil_air_pore', 'soil_bacteria', 'soil_nematode', 'soil_hyphae'], related=['soil_crumbs', 'soil_pores'], tag=None)

N('soil_sand', 'Sand grains', 'structure', 0.0004, ['soil_crumb'],
  "Sand grains are the big mineral grains of soil, 63 micrometres to 2 millimetres across; in soils like this one they are mostly quartz.",
  "These are the large, rounded lumps in the crumb. Each is a piece of rock that weathering has broken off. In most inland soils the sand is mostly quartz, because quartz does not dissolve or crumble easily and so outlasts other minerals. Sand does not hold much water or nutrients, but it gives soil its framework and its pores. The quartz crystal can be viewed from the pebble bed of the block.",
  "ISO 14688 grades sand as fine (63 to 200 micrometres), medium (200 to 630) and coarse (630 to 2,000). Silica as quartz is the most common component of sand in inland settings, because of its chemical inertness and hardness; calcium carbonate is the second most common type, and the composition is highly variable.",
  "The three grains are drawn 650, 420 and 500 micrometres across, which is coarse and medium sand.",
  [('Size', '63 µm to 2 mm'), ('Mostly', 'quartz (SiO₂) in inland soils'), ('Holds', 'little water and few nutrients')],
  'C1', [R_SOIL], [W_GRAIN, W_SAND], related=['rock_grains', 'soil_silt'])

N('soil_silt', 'Silt grains', 'structure', 0.00003, ['soil_crumb'],
  "Silt grains are mineral grains between 2 and 63 micrometres: too small to feel as separate grains, they give soil a smooth, floury feel.",
  "Silt is the in-between size: finer than sand, coarser than clay. The grains are the small angular specks packed around the sand grains. You can feel silt as smoothness when you rub a damp soil between your fingers.",
  "On the ISO scale silt is 2 to 63 micrometres. Silt, sand and clay together make up the mineral part of the soil, and their proportions give a soil its texture.",
  "The scene draws 60 grains between 14 and 40 micrometres; the number and shapes are illustrative.",
  [('Size', '2 to 63 µm'), ('Feel', 'smooth, floury')],
  'C1', [R_SOIL], [W_GRAIN], related=['soil_sand', 'soil_clay'])

N('soil_humus', 'Humus coats', 'structure', 0.00001, ['soil_crumb'],
  "Humus is the dark, sticky, decayed remains of plants and animals that coats the grains and glues crumbs together.",
  "The dark film on the grains in the crumb is humus. It is what is left of dead matter when the decomposers have taken what they can: a complex mixture, not a single substance. It sticks the mineral grains together, holds water and nutrient ions, and gives topsoil its dark colour.",
  "Most soil organic matter is a complex assemblage of small organic molecules collectively called humus. It holds more nutrients and water per gram than clay minerals, and most soil cation-exchange capacity comes from carboxylic groups on organic matter (100 to 300 meq per 100 g for humus). Organic matter favours aggregation by forming stable bridges between mineral particles.",
  "The coats are drawn as thin dark shells; their thickness is illustrative. Humus is a mixture with no single molecule, so no molecule button is offered.",
  [('Is', 'a complex mixture of decayed organic matter'), ('Does', 'binds grains, holds water and nutrients'), ('CEC', '≈ 100 to 300 meq per 100 g')],
  'C1', [R_SOIL], [W_SOIL, W_STRUCT], related=['soil_cec', 'soil_decomposition'])

N('soil_water_film', 'The water film', 'structure', 0.00001, ['soil_crumb', 'soil_pores'],
  "A thin film of water coats the grains; the dissolved nutrients in it are what roots take up.",
  "The grains are wet: water sticks to them in a thin film. In it are dissolved the nutrients the plants need. When the soil is moist the film is thick and the small gaps are full; when the soil dries the film thins, and the water left is held so tightly that roots cannot get it. Water is also where bacteria and nematodes swim and feed. Click the water for one of its molecules.",
  "Water that remains after drainage is the field capacity; water below the wilting point is unavailable to plants. Water is a solvent for the ions (ammonium, nitrate, potassium and so on) that plants need.",
  "The film is drawn as a thin translucent coat on the big grain; its thickness (10 micrometres here) is much greater than a real film on dry soil and is only illustrative.",
  [('Holds', 'dissolved nutrients'), ('Thickness', 'varies with how wet the soil is')],
  'C1', [R_SOIL, R_WATER], [MSU], related=['soil_pore_water', 'bio_water_properties'])

N('soil_air_pore', 'An air pore', 'structure', 0.0001, ['soil_crumb', 'soil_pores'],
  "A pore that is not full of water is full of air: the air in soil has more carbon dioxide and less oxygen than the air above it, because roots and soil life breathe in it.",
  "The dark gaps in the crumb are air pores. Roots, fungi, bacteria and animals all breathe the soil air. They use up oxygen and give off carbon dioxide, so soil air is richer in carbon dioxide than the air above ground. Click the pore to see the carbon dioxide molecule.",
  "Water and gas share the pore space; as soil wets, air is displaced; compaction reduces pore space so that air and water do not reach roots and organisms. Respiration by roots and decomposers releases carbon dioxide into the pores. Darwin noted a great excess of carbonic acid (carbon dioxide) in all soils, especially rich ones.",
  "The pore is drawn as a dark lens 200 micrometres across; the sizes of real pores range widely.",
  [('Holds', 'air: oxygen in, carbon dioxide out'), ('Competes with', 'water for the same space')],
  'C1', [R_SOIL], [W_SOIL, MSU, DARWIN], related=['soil_pores', 'cellular_respiration'])

N('soil_bacteria', 'Soil bacteria', 'organism', 0.000002, ['soil_crumb', 'soil_handful'],
  "Bacteria are single-celled organisms 0.5 to 5 micrometres long; they do most of the chemical work of the soil and there are about a hundred million in a gram.",
  "The tiny rods and dots on the grain surfaces are bacteria. They are the most numerous living things in soil: about a hundred million in a gram on average. They live in the film of water, feed on dead matter, and break it down: they are the chief recyclers, along with fungi. Some change nitrogen into forms plants can use. When they break down proteins they release ammonium; click one to see that molecule.",
  "Mean prokaryote density is roughly 10^8 per gram of soil, and a teaspoon of productive soil may hold 100 million to 3 billion. Bacteria carry out the steps of the nitrogen cycle in soil: some fix nitrogen gas, some release ammonium from dead matter (ammonification), Nitrosomonas and Nitrobacter oxidise ammonium to nitrate, and others turn nitrate back to nitrogen gas without oxygen. Nematodes can eat up to 5,000 bacteria a minute.",
  "The scene draws about 120 rods 1.6 by 3.5 micrometres; the number is far smaller than in real soil and their positions are illustrative. The bacteria are not identified by species.",
  [('Size', '0.5 to 5 µm'), ('Number', '≈ 10⁸ per gram (mean)'), ('Does', 'decomposes; nitrogen steps')],
  'C1', [R_PROK, R_PMET], [W_SOIL, W_BIO, W_NCYC, W_NEM], related=['bio_bacterial_structure', 'bio_bacterial_diversity', 'nitrogen_cycle_process', 'soil_nitrogen'])

N('soil_nematode', 'A nematode', 'organism', 0.0008, ['soil_crumb', 'soil_handful'],
  "Nematodes are microscopic roundworms, often less than 2.5 millimetres long, that graze on bacteria, fungi and other small things in the water film of the soil.",
  "The long thin worm in the crumb is a nematode, a roundworm. It is not an earthworm, and it is far smaller: most free-living nematodes are less than 2.5 millimetres long and some only about a millimetre. They are very common in soil: often more than a million in a square metre, mostly in the top 15 centimetres. They swim in the film of water around the grains and eat bacteria, fungi, algae and other small things; one can eat up to 5,000 bacteria a minute.",
  "Nematodes are very small, slender worms, bilaterally symmetrical, and often with ridges, rings or bristles on the body. The topsoil of the world holds about 4.4 × 10^20 nematodes. Some soil nematodes reach up to 7 mm.",
  "The nematode is drawn 800 micrometres long and 25 micrometres wide, as a plain tube; its width and shape are illustrative.",
  [('Length', 'often under 2.5 mm; some ≈ 1 mm; some up to 7 mm'), ('Number', 'often over 10⁶ per m²'), ('Where', '≈ 90 % in the top 15 cm'), ('Rate of eating', 'up to 5,000 bacteria a minute')],
  'C1', [R_NEM], [W_NEM], related=['bio_nematodes_arthropods', 'soil_decomposition'])

# ================= the clay and cation-exchange scene =================
N('soil_cations', 'Positive ions held on clay', 'structure', 1e-7, ['soil_cec'],
  "Calcium, magnesium, potassium and ammonium ions cling to the negatively charged surfaces of clay plates, held loosely enough that roots and water can swap them for others.",
  "The coloured balls in the scene near the clay plates are positive ions of plant nutrients: calcium (Ca²⁺), magnesium (Mg²⁺), potassium (K⁺) and ammonium (NH₄⁺). Each is held by the plate's negative charge, together with its shell of water molecules. They are not stuck for good: if another ion arrives in the water they can swap. This is how the clay acts as a store that releases nutrients gradually. Click an ammonium ion to see the molecule.",
  "Cations are held electrostatically in the diffuse layer, keeping their water shells, and are easily displaced by other cations in solution. Calcium, magnesium, potassium and sodium are the base cations; their share of the exchange capacity is the base saturation, which indicates weathering and nutrient availability. A lower pH (more hydrogen ions) reduces variable charge, and so the capacity.",
  "The ions are drawn about 200 times larger than real so that you can see them; a hydrated ion is a fraction of a nanometre across. The number, kind and place of the ions are illustrative.",
  [('Held', 'Ca²⁺, Mg²⁺, K⁺, Na⁺, NH₄⁺ (and H⁺)'), ('Held by', 'negative charge on clay and humus'), ('Exchangeable', 'yes: swapped with the soil water')],
  'C1', [R_SOIL, R_NUT], [W_CEC], related=['soil_cec', 'soil_nitrogen'])

N('soil_nitrate', 'Nitrate in the soil water', 'structure', 1e-7, ['soil_cec', 'soil_nitrogen'],
  "Nitrate carries a negative charge, so clay does not hold it; it stays in the water, where roots take it up and where rain can wash it away.",
  "The red balls drifting away from the plates are nitrate ions, the form of nitrogen that roots take up most easily. Their charge is negative, like the clay's, so the clay pushes them away instead of holding them. This is why nitrate is easily washed out of the soil by heavy rain into streams and groundwater. Click one to see the nitrate molecule.",
  "Nitrate is highly soluble and soils are highly unable to retain anions, so it can leach to groundwater. It is made by nitrifying bacteria from ammonium and can be turned back to nitrogen gas by denitrifying bacteria in oxygen-poor soil.",
  "Ion sizes are exaggerated as on the card of the positive ions; the number and places of the nitrate ions are illustrative.",
  [('Charge', 'negative (NO₃⁻)'), ('Held by clay', 'no (repelled)'), ('Fate', 'taken up by roots, leached, or denitrified')],
  'C1', [R_CYC], [W_NCYC, W_CEC], related=['soil_nitrogen', 'nitrogen_cycle_process'])
