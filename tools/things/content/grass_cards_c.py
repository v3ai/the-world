# Cards C: the flowering stem, spike, florets, pollen, wind pollination and hay fever.
from grass_lib import *

N('grass_culm', 'The flowering stem (culm)', 'structure', 0.5, ['grass_plant'],
  "The tall, slender, jointed stem that some shoots send up in early summer to carry the flower spike.",
  "Most of the shoots in a lawn stay short and make only leaves. Some, left unmown, stretch up a hollow, jointed stem. The stem has a few leaves along it, each with a long sheath round the stem, and ends in the flower spike. Mowing regularly cuts these stems down before the flowers open, which is why a lawn rarely flowers.",
  "Flowering stems of perennial ryegrass are 30-90 cm tall (DELTA); floras give 10-50 cm (NZ Flora) up to 90 cm (Wikipedia). When a shoot flowers its stem lengthens and lifts the growing point; after that the shoot makes no more leaves (Missouri Extension). The stem leaves are shorter than the leaves at the base.",
  "The three flowering stems of the model are 41-52 cm tall and lean slightly; the nodes drawn (three) exceed DELTA's 'one or two (when visible)'. Counts and curvature are choices.",
  [('Height of flowering stems', '30-90 cm (DELTA)'), ('After flowering starts', 'the shoot stops making leaves (Missouri)')],
  'C1', [R_STEM], [DELTA, NZF, W_LP, MO], parts=['grass_node', 'grass_spike', 'grass_sheath'], related=['grass_base_growth', 'rn_stem'])

N('grass_spike', 'The flower spike', 'structure', 0.15, ['grass_culm', 'grass_plant'],
  "A flat spike at the top of the flowering stem, made of small groups of flowers called spikelets set along it in two rows, with their narrow edge to the stem.",
  "The flowers of ryegrass are small and green or yellowish and there are no petals, because the wind, not insects, carries the pollen. They are packed in a flat spike: about two dozen small clusters called spikelets set one above another along a zigzag axis, alternately on the two sides. The spikelets stand edge-on to the axis, which makes the spike look flat, like a narrow ribbon. Choose the layer 'In flower' to see anthers hanging out.",
  "Spike length is (8-)10-20(-25) cm (DELTA), 4-28 cm (NZ Flora) or 8-30 cm (Cornell). Spikelets alternate on opposite sides of the axis (DELTA; Wikipedia) and are 'conspicuously distichous'. Some descriptions call the head a spike, others a branched spike or panicle (Virginia Tech, Cornell), so 'always a simple spike' is too strong.",
  "The number of spikelets per spike was not found in the sources opened: the model draws 18 per spike, decreasing in size toward the tip, a choice. The spikes of three flowering stems are drawn 14-16 cm long.",
  [('Spike length', '(8-)10-20(-25) cm (DELTA)'), ('Spikelets', 'alternate, in two rows, edge-on to the axis'), ('In the model', '18 per spike (a choice)')],
  'C1', [R_POLL], [DELTA, NZF, CORNELL, W_LP, VT], parts=['grass_rachis', 'grass_spikelet', 'grass_wind_pollination'], related=['rn_flower', 'bio_plant_reproduction'])

N('grass_rachis', 'The spike axis (rachis)', 'structure', 0.15, ['grass_spike'],
  "The zigzag central axis of the spike, with a notch for each spikelet.", 
  "The spike's central axis is a slender, slightly zigzag rod, and each spikelet sits in a small hollow on one side. Because the spikelets alternate from side to side, the axis zigzags.",
  "In Lolium each spikelet sits with a single glume against the axis and the axis itself takes the place of the missing second glume (a standard description; see the glume card).",
  "The zigzag amplitude (0.6 mm) is illustrative.",
  [('Spikelets per node', '1, alternating sides')],
  'C1', [R_POLL], [GGW], related=['grass_spikelet', 'grass_spike'])

N('grass_spikelet', 'A spikelet: a cluster of florets', 'structure', 0.011, ['grass_spike'],
  "The basic unit of a grass flower head: a small, flattened cluster of florets with scales at its base. In ryegrass each spikelet has 4 to 14 florets.",
  "A spikelet is a miniature spike of its own: a short axis with florets arranged in two rows, overlapping like roof tiles, and at the base a single scale called the glume. In the model a spikelet is about 11 mm long. Click the spikelet in the middle distance, or a floret close up, to open the parts; the layer 'A floret opened' separates one floret into its parts.",
  "Spikelet length is (5-)7-15(-20) mm and 3-5 mm wide (DELTA), 6-15 mm (NZ Flora), 5-22 mm (Minnesota Wildflowers). Florets per spikelet: four to 14 (Wikipedia), 5-11 (DELTA), 4-10 (Minnesota Wildflowers). In Lolium there is one glume per spikelet, except that the terminal spikelet has two, and the glumes face the rachis (Grass Genera of the World); Wikipedia describes the glume as on the side away from the stem.",
  "The model's spikelets have 3 to 8 florets, shrinking toward the tip of the spike. About 38 per cent of the florets are drawn open: a choice, not a measurement.",
  [('Spikelet length', '(5-)7-15(-20) mm (DELTA)'), ('Florets per spikelet', '4-14 (Wikipedia); 5-11 (DELTA)'), ('Glumes', '1 (terminal spikelet: 2)')],
  'C1', [R_POLL], [DELTA, NZF, MNW, W_LP, GGW], parts=['grass_glume', 'grass_lemma', 'grass_palea', 'grass_lodicule', 'grass_anther', 'grass_stigma', 'grass_ovary'], related=['grass_spike'],
  fig=bars([('lemma length, lower (4 mm)', 4), ('lemma length, upper (8.5 mm)', 8.5), ('spikelet length, typical lower (7 mm)', 7), ('spikelet length, typical upper (15 mm)', 15), ('anther length (about 3 mm)', 3.1)], 'millimetres', 'Sizes in a ryegrass spikelet from floras: lemma 4-8.5 mm, spikelet 7-15 mm (typical range), anther 2.9-3.4 mm (DELTA).'))

N('grass_glume', 'The glume: one scale at the base', 'structure', 0.008, ['grass_spikelet'],
  "A thin scale at the base of the spikelet. Ryegrass has only one, except in the top spikelet.",
  "Most grasses have two glumes at the foot of each spikelet. Perennial ryegrass has one, set on the side of the spikelet away from the stem, and the spike axis itself fills the place of the missing one. That is a quick way to recognise a ryegrass spike.",
  "In Lolium there is one glume per spikelet, except that the terminal spikelet has two; the upper glume is 3-7 nerved, membranous and not keeled (Grass Genera of the World). It is 4-10(-12) mm long and about as long as the first lemma (DELTA).",
  "Drawn 8.5 mm long.",
  [('Glumes', '1 per spikelet (2 in the terminal one)'), ('Length', '4-10(-12) mm (DELTA)')],
  'C1', [R_POLL], [GGW, DELTA, W_LP], related=['grass_spikelet', 'grass_lemma'])

N('grass_lemma', 'The lemma: the outer scale of a floret', 'structure', 0.006, ['grass_spikelet'],
  "The boat-shaped scale that covers the outside of each floret. Ryegrass lemmas are usually without a bristle (an awn).",
  "Each floret is closed between two scales: a bigger outer one, the lemma, and a smaller inner one, the palea. The lemma has five fine veins and is 5 to 7 mm long. In ryegrass it usually has no awn, the bristle found on barley or wild oat, though some plants have a short one.",
  "Lemma length is (4-)5-7 mm with 5 veins and an awn of 0-0.2 mm (DELTA); (4.5)-5-7-(8.5) mm, muticous or occasionally minutely awned to 1 mm (NZ Flora); 3.5-9 mm and mostly awnless (Minnesota Wildflowers, which also notes some awns up to 8 mm).",
  "Drawn 6 mm long and awnless.",
  [('Length', '5-7 mm (DELTA)'), ('Veins', '5'), ('Awn', 'usually none')],
  'C1', [R_POLL], [DELTA, NZF, MNW], related=['grass_palea', 'grass_spikelet'])

N('grass_palea', 'The palea: the inner scale', 'structure', 0.0055, ['grass_spikelet'],
  "A thin scale tucked against the stem side of the floret, opposite the lemma.",
  "Inside the lemma sits the palea, a smaller, thinner scale. Together the two enclose the real flower parts: the stamens and the ovary.",
  "A floret has two bracts round the flower: one external, the lemma, and one internal, the palea (Wikipedia, Poaceae).",
  "The palea is drawn slightly shorter than the lemma and narrower: not measured.",
  [('Position', 'inner bract of the floret')],
  'C1', [R_POLL], [W_POACEAE], related=['grass_lemma', 'grass_lodicule'])

N('grass_lodicule', 'Lodicules: the scales that open the floret', 'structure', 0.0008, ['grass_spikelet'],
  "Two tiny scales inside a grass floret in place of petals. They swell and push the lemma and palea apart so that the anthers and stigmas can come out.",
  "A grass flower has no petals. Instead there are two tiny scales at the base of the floret. When they take up water and swell, they spread the lemma and palea and the floret opens.",
  "In grasses the perianth is reduced to two scales, the lodicules, which expand and contract to spread the lemma and palea; they are generally interpreted as modified sepals (Wikipedia, Poaceae). In Lolium they are 2, free, membranous and hairless (Grass Genera of the World).",
  "Drawn 0.8 mm tall.",
  [('Number', '2, free, membranous (GGW)'), ('Role', 'swell and open the floret')],
  'C1', [R_POLL], [W_POACEAE, GGW], related=['grass_lemma', 'rn_petal', 'grass_monocot'])

N('grass_filament', 'The filament: the thread that holds the anther out', 'structure', 0.0035, ['grass_anther'],
  "A very thin thread that carries each anther, long enough to hang it out of the floret into the wind.",
  "The anthers of a ryegrass flower do not stay inside. The thread-like filaments lengthen and let them hang down outside the floret, where they can swing and shed pollen into passing air.",
  "Long, well-exposed stamens are a typical feature of wind-pollinated plants (Wikipedia, Anemophily).",
  "Drawn 3.5 mm long, a choice.",
  [('Role', 'holds the anther clear of the floret')],
  'C1', [R_POLL], [W_ANEMO], related=['grass_anther', 'grass_wind_pollination'])

N('grass_anther', 'The anthers: where the pollen is made', 'structure', 0.0031, ['grass_spikelet', 'grass_wind_pollination'],
  "Each ryegrass floret has three pale yellow anthers, each about 3 mm long, that hang out on thread-like filaments and shed pollen to the wind.",
  "An anther is the pollen-making part of a flower. In ryegrass there are three per floret, and they hang out of the floret on thin threads. Each is a small, pale yellow pouch that splits and releases a cloud of tiny pollen grains. The numbers of grains are huge. Click 'Look at grass pollen' to see grains the size of ryegrass pollen.",
  "Stamens: 3 (Grass Genera of the World). Anther length: 2.9-3.4 mm (DELTA), (1.5)-2.5-4 mm (NZ Flora), 1.3-4.5 mm (Grass Genera of the World); anthers are pale yellow (Wikipedia). The pollen grains are 26-50 µm, spheroidal, with one pore (PalDat).",
  "The model draws 3.1 mm anthers and opens about 38 per cent of the florets; how many open at once on a real spike, and in what order along it, was not found in the sources opened.",
  [('Stamens per floret', '3'), ('Anther length', '2.9-3.4 mm (DELTA); 1.3-4.5 mm in the genus'), ('Colour', 'pale yellow')],
  'C1', [R_POLL], [GGW, DELTA, NZF, W_LP, PALDAT], parts=['grass_filament', 'grass_pollen'], related=['rn_anther', 'rn_stamen', 'rn_pollen_grain'])

N('grass_stigma', 'The stigmas: feathery pollen traps', 'structure', 0.003, ['grass_spikelet', 'grass_wind_pollination'],
  "Each floret has two white stigmas that stick out of the floret; wind-pollinated plants like grasses have large, feathery ones that catch pollen from the air.",
  "The stigma is the part of the flower that receives pollen. A grass has two on each flower, and they stick out of the floret, branched like tiny feathers, so that a pollen grain drifting past is likely to touch one.",
  "Stigmas: 2, white (Grass Genera of the World). Wind-pollinated flowers typically have large feathery stigmas (Wikipedia, Anemophily); the sources opened for ryegrass do not describe the branching in detail.",
  "The feather branches in the model are drawn as 14 small hairs per stigma, illustrative. Their number and length are not measurements.",
  [('Number per floret', '2, white'), ('Shape', 'feathery (wind-pollinated type)')],
  'C1', [R_POLL], [GGW, W_ANEMO], related=['rn_style_stigma', 'grass_ovary'])

N('grass_ovary', 'The ovary: where the seed grows', 'structure', 0.0023, ['grass_spikelet'],
  "The small rounded base of the pistil in the middle of the floret. After pollination one seed grows in it; the seed and its thin coat form the grain.",
  "Pollen landing on a stigma sends a tube down to the ovary and fertilises the ovule. The ovary then ripens into a grass fruit in which the seed and the fruit wall are joined into one, a grain (technically a caryopsis).",
  "The ryegrass grain is 2-4 mm long by 0.7-1.5 mm wide (NZ Flora), about 3-4 mm long (DELTA). Grass fruit are described as compressed with a groove along them (Grass Genera of the World).",
  "The model draws the ovary at 2.3 mm tall; not measured.",
  [('Grain', '2-4 × 0.7-1.5 mm (NZ Flora)')],
  'C1', [R_POLL], [NZF, DELTA, GGW], related=['rn_carpel', 'rn_ovule', 'rn_achene'])

N('grass_wind_pollination', 'Wind pollination: flowers without petals', 'process', 1, ['grass_spike'],
  "Grass flowers are pollinated by the wind, not by insects: they have no scent or nectar or showy petals, but many anthers on long threads and feathery stigmas.",
  "Insect-pollinated flowers like the buttercup advertise with colour and nectar. Grasses do the opposite: they save the cost of petals and rely on wind. For that to work, the plant has to make a huge amount of light pollen, hold its anthers in the wind, and have stigmas that can catch a grain from the air.",
  "Wind-pollinated flowers have smooth, light, non-sticky pollen made in enormous numbers, long well-exposed stamens and large feathery stigmas; grasses are the most important producers of airborne allergens in most temperate regions (Wikipedia, Anemophily). In grasses the perianth is reduced to two lodicules (Wikipedia, Poaceae).",
  "The sources opened here give no figure for the amount of pollen per anther or per plant.",
  [('Pollen type', 'light, smooth, non-sticky, abundant'), ('Stamens', 'long, well exposed'), ('Stigmas', 'large, feathery')],
  'C1', [R_POLL], [W_ANEMO, W_POACEAE], parts=['grass_anther', 'grass_stigma', 'grass_pollen', 'grass_hay_fever'], related=['rn_pollination', 'bio_pollination_networks', 'bio_plant_reproduction', 'rn_acris'])

N('grass_pollen', 'Grass pollen', 'structure', 0.00004, ['grass_anther', 'grass_hay_fever'],
  "A ryegrass pollen grain is a rough sphere about 26 to 50 micrometres across, with a single pore. Each carries the male cells of the plant and, on its surface and inside, proteins that cause hay fever.",
  "Pollen grains are the male half of the plant's reproduction. They are narrower than a human hair (a hair is 50-100 µm thick), and are carried on the wind. Most land nowhere useful. The scene shows ryegrass-sized grains and a feathery stigma branch.",
  "PalDat describes Lolium perenne pollen as medium-sized (26-50 µm), spheroidal, with one pore with a thickened ring (annulus) and a lid (operculum), three-celled, without a pollen coat. In rain the grains can swell and burst: in laboratory work on ryegrass pollen, osmotic pressure from water makes grains break apart and release sub-pollen particles mostly between 60 and 200 nm across.",
  "The grains in the scene are drawn at 35-40 µm and are fewer than a real cloud; sub-pollen particles are not drawn (too small for the scene).",
  [('Diameter', '26-50 µm (PalDat)'), ('Pore', 'one, with annulus and operculum'), ('Sub-pollen particles from bursting', '≈ 60-200 nm (laboratory study)')],
  'C1', [R_POLL], [PALDAT, PMC_STORM], related=['grass_hay_fever', 'rn_pollen_grain', 'bio_hypersensitivity_autoimmunity'],
  fig=bars([('sub-pollen particle (0.1 µm)', .1), ('ryegrass pollen, lower (26 µm)', 26), ('ryegrass pollen, upper (50 µm)', 50), ('human hair, lower (50 µm)', 50)], 'micrometres', 'Pollen grain size: 26-50 µm (PalDat); the sub-pollen particles released in rain are about 60-200 nm (0.06-0.2 µm); a human hair is 50-100 µm (Skin card).', True))

N('grass_hay_fever', 'Grass pollen and hay fever', 'process', 0.00004, ['grass_pollen', 'grass_plant'],
  "Hay fever is an allergy to pollen. In Britain grass pollen is the commonest trigger, and its season is mainly from May to July.",
  "In most people pollen causes nothing. In people with hay fever, the immune system treats harmless pollen proteins as a threat, and the result is sneezing, a runny nose and itchy eyes. About one in five people in the UK has hay fever, and the large majority of them are allergic to grass pollen. The grass pollen season can start as early as May and usually peaks in June and July; there are often two peaks, one in the first half of June and one in early July. Counts are often highest in the early morning, between about 5 and 10 am. Dry, windy weather keeps pollen in the air; rain usually washes it out for a while.",
  "The immune system makes IgE antibodies against a pollen protein. The IgE sits on mast cells; when pollen protein cross-links it, the mast cells release histamine and other chemicals (OpenStax Microbiology 19.1). Allergen proteins of perennial ryegrass in the WHO/IUIS list include Lol p 1 (27 kDa, a beta-expansin), Lol p 2 (11 kDa), Lol p 5 (31 kDa). In timothy grass, allergen groups 1 and 5 together account for sensitisation with a prevalence above 90 % (the figures are for timothy, not ryegrass). In thunderstorms, rain can make grains swell and burst into tiny particles that reach deeper into the lungs: 'thunderstorm asthma'.",
  "Prevalence figures differ by source and year: about 1 in 5 (Met Office); about 13 million people (Royal Meteorological Society); 26 % of adults and 10-15 % of children (Allergy UK). Asthma + Lung UK and the Royal Meteorological Society say grass pollen affects about 95 % of hay fever sufferers; the Met Office says 'the majority' and 'the vast majority'. Mowing: the sources opened do not say that mowing releases pollen or that regular mowing prevents flowering, so this card does not claim it (but mown grass does not flower).",
  [('Season (Met Office)', 'can start in May; generally peaks in June and July; two peaks, first half of June and early July'), ('Grass pollen among hay fever sufferers', '≈ 95 % (Asthma + Lung UK; RMetS); "the vast majority" (Met Office)'), ('Hay fever in the UK', '≈ 1 in 5 people (Met Office)'), ('Ryegrass allergens', 'Lol p 1 (27 kDa), Lol p 2 (11 kDa), Lol p 5 (31 kDa)'), ('Daily peak', 'early morning, about 5-10 am (RMetS)')],
  'C1', [R_HYP, R_POLL], [MET22, MET23, ALUK, RMET, ALLUK, ALLERGEN, PMC_IGE, PMC_STORM, OS_HYPER], related=['bio_hypersensitivity_autoimmunity', 'grass_pollen', 'grass_wind_pollination'],
  openq=["Why prevalence figures vary so much between sources, and how climate change will alter the grass pollen season in Britain: not settled by the sources used here."],
  fig=bars([('Met Office: peak, month 6 (June)', 6), ('Met Office: peak, month 7 (July)', 7), ('Asthma + Lung UK: levels often highest from month 5 (mid-May)', 5), ('and until month 7 (July)', 7)], 'month of the year (5 = May)', 'Grass pollen season in Britain: it can start as early as May and generally peaks in June and July (Met Office); levels are often highest between mid-May and July (Asthma + Lung UK).'))
