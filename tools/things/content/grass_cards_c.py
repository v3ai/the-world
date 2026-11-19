# Cards C: the flowering stem, spike, florets, pollen, wind pollination and hay fever.
from grass_lib import *

N('grass_culm', 'The flowering stem (culm)', 'structure', 0.5, ['grass_plant'],
  "The tall, slender, jointed stem that some shoots send up in early summer to carry the flower spike.",
  "Most of the shoots in a lawn stay short and make only leaves. Some, left unmown, stretch up a hollow, jointed stem. The stem has a few leaves along it, each with a long sheath round the stem, and ends in the flower spike. Mowing regularly cuts these stems down before the flowers open, which is why a lawn rarely flowers.",
  "Flowering stems of perennial ryegrass are 30-90 cm tall (DELTA); floras give 10-50 cm (NZ Flora) up to 90 cm (Wikipedia). When a shoot flowers its stem lengthens and lifts the growing point; after that the shoot makes no more leaves (Missouri Extension). The stem leaves are shorter than the leaves at the base.",
  "The three flowering stems of the model are 41-52 cm tall and lean slightly; the three nodes drawn are more than the 'one or two (when visible)' that the flora gives. Counts and curvature are choices.",
  [('Height of flowering stems', '30-90 cm (DELTA)'), ('After flowering starts', 'the shoot stops making leaves (Missouri)')],
  'C1', [R_STEM], [DELTA, NZF, W_LP, MO], parts=['grass_node', 'grass_spike', 'grass_sheath'], related=['grass_base_growth', 'rn_stem'])

N('grass_spike', 'The flower spike', 'structure', 0.15, ['grass_culm', 'grass_plant'],
  "A flat spike at the top of the flowering stem, made of small groups of flowers called spikelets set along it in two rows, with their narrow edge to the stem.",
  "The flowers of ryegrass are small and green or yellowish and there are no petals, because the wind, not insects, carries the pollen. They are packed in a flat spike: small clusters called spikelets set one above another along a zigzag axis, alternately on the two sides. The model draws 18 on each spike; real spikes vary, as their length does. The spikelets stand edge-on to the axis, which makes the spike look flat, like a narrow ribbon. Choose the layer 'In flower' to see anthers hanging out.",
  "Spike length is (8-)10-20(-25) cm (DELTA), 4-28 cm (NZ Flora) or 8-30 cm (Cornell). Spikelets alternate on opposite sides of the axis (DELTA; Wikipedia) and are 'conspicuously distichous'. Most descriptions call the head a spike; a few call it a branched spike or panicle.",
  "The model draws 18 spikelets per spike, decreasing in size toward the tip: a choice, not a count taken from a plant. The spikes of three flowering stems are drawn 14-16 cm long.",
  [('Spike length', '(8-)10-20(-25) cm (DELTA)'), ('Spikelets', 'alternate, in two rows, edge-on to the axis'), ('Spikelets per spike in the model', '18 (a choice)')],
  'C1', [R_POLL], [DELTA, NZF, CORNELL, W_LP, VT], parts=['grass_rachis', 'grass_spikelet', 'grass_wind_pollination'], related=['rn_flower', 'bio_plant_reproduction'])

N('grass_rachis', 'The spike axis (rachis)', 'structure', 0.15, ['grass_spike'],
  "The zigzag central axis of the spike, with a notch for each spikelet.", 
  "The spike's central axis is a slender, slightly zigzag rod, and each spikelet sits in a small hollow on one side. Because the spikelets alternate from side to side, the axis zigzags.",
  "In Lolium each spikelet sits edgeways in a notch of the axis. Its single glume is on the outer side, away from the axis, and the axis itself takes the place of the missing glume on the inner side (see the glume card).",
  "The zigzag amplitude (0.6 mm) is illustrative. In the model the spikelets are drawn alternating one by one along the axis, 18 to a spike, each leaning outward from its notch, with its single glume on the outer side.",
  [('Spikelets per node', '1, alternating sides')],
  'C1', [R_POLL], [GGW, COLINHERB, W_LP], related=['grass_spikelet', 'grass_spike'])

N('grass_spikelet', 'A spikelet: a cluster of florets', 'structure', 0.011, ['grass_spike'],
  "The basic unit of a grass flower head: a small, flattened cluster of florets with scales at its base. In ryegrass each spikelet has about 5 to 11 florets in one flora, and up to 14 in other descriptions.",
  "A spikelet is a miniature spike of its own: a short axis with florets arranged in two rows, overlapping like roof tiles, and at the base a single scale called the glume. In the model a spikelet is about 11 mm long. Click the spikelet in the middle distance, or a floret close up, to open the parts; the layer 'A floret opened' separates one floret into its parts.",
  "Spikelet length is (5-)7-15(-20) mm and 3-5 mm wide (DELTA), 6-15 mm (NZ Flora), 5-22 mm (Minnesota Wildflowers). Florets per spikelet: four to 14 (Wikipedia), 5-11 (DELTA), 4-10 (Minnesota Wildflowers). In Lolium there is one glume per spikelet, except that the terminal spikelet has two. The single glume is the upper one and it sits on the outer side of the spikelet, away from the axis; the inner edge, against the axis, has none.",
  "The model's spikelets have 3 to 8 florets, shrinking toward the tip of the spike: at or below the low end of the 5-11 of the flora (and of the 4-14 of other descriptions), so real spikelets are fuller. The glume is drawn on the outer side, as in the flora. About 38 per cent of the florets are drawn open: a choice, not a measurement.",
  [('Spikelet length', '(5-)7-15(-20) mm (DELTA)'), ('Florets per spikelet', '5-11 in one flora; 4-14 in another description (model: 3-8)'), ('Glumes', '1 (terminal spikelet: 2)')],
  'C1', [R_POLL], [DELTA, NZF, MNW, W_LP, GGW, COLINHERB], parts=['grass_glume', 'grass_lemma', 'grass_palea', 'grass_lodicule', 'grass_anther', 'grass_stigma', 'grass_ovary'], related=['grass_spike'],
  fig=bars([('lemma length, lower (4 mm)', 4), ('lemma length, upper (8.5 mm)', 8.5), ('spikelet length, typical lower (7 mm)', 7), ('spikelet length, typical upper (15 mm)', 15), ('anther length (about 3 mm)', 3.1)], 'millimetres', 'Sizes in a ryegrass spikelet from floras: lemma 4-8.5 mm, spikelet 7-15 mm (typical range), anther 2.9-3.4 mm (DELTA).'))

N('grass_glume', 'The glume: one scale at the base', 'structure', 0.008, ['grass_spikelet'],
  "A thin scale at the base of the spikelet. Ryegrass has only one, except in the top spikelet.",
  "Most grasses have two glumes at the foot of each spikelet. Perennial ryegrass has one, set on the outer side of the spikelet away from the spike axis; on the inner side the spikelet fits into a notch of the axis, which fills the place of the missing glume. That is a quick way to recognise a ryegrass spike.",
  "In Lolium there is one glume per spikelet, except that the terminal spikelet has two; the upper glume is 3-7 nerved, membranous and not keeled (Grass Genera of the World). It is 4-10(-12) mm long and about as long as the first lemma (DELTA).",
  "Drawn 8.5 mm long, on the outer side of the spikelet, inside the 4-10(-12) mm of the flora, as a simple curved blade rather than a copy of a real glume. Its position, on the side away from the spike axis, follows the floras.",
  [('Glumes', '1 per spikelet (2 in the terminal one)'), ('Length', '4-10(-12) mm (DELTA)')],
  'C1', [R_POLL], [GGW, DELTA, W_LP, COLINHERB], related=['grass_spikelet', 'grass_lemma'])

N('grass_lemma', 'The lemma: the outer scale of a floret', 'structure', 0.006, ['grass_spikelet'],
  "The boat-shaped scale that covers the outside of each floret. Ryegrass lemmas are usually without a bristle (an awn).",
  "Each floret is closed between two scales: a bigger outer one, the lemma, and a smaller inner one, the palea. The lemma has five fine veins and is 5 to 7 mm long. In ryegrass it usually has no awn, the bristle found on barley or wild oat, though some plants have a short one.",
  "Lemma length is (4-)5-7 mm with 5 veins and an awn of 0-0.2 mm (DELTA); (4.5)-5-7-(8.5) mm, muticous or occasionally minutely awned to 1 mm (NZ Flora); 3.5-9 mm and mostly awnless (Minnesota Wildflowers notes that some plants have awns up to 8 mm).",
  "Drawn 6 mm long and awnless, a boat-shaped blade that curls slightly across and along its length, in the middle of the 4-8.5 mm that floras give for the lemma. The five veins are not drawn.",
  [('Length', '5-7 mm (DELTA)'), ('Veins', '5'), ('Awn', 'usually none')],
  'C1', [R_POLL], [DELTA, NZF, MNW], related=['grass_palea', 'grass_spikelet'])

N('grass_palea', 'The palea: the inner scale', 'structure', 0.0055, ['grass_spikelet'],
  "A thin scale tucked against the stem side of the floret, opposite the lemma.",
  "Inside the lemma sits the palea, a smaller, thinner scale. Together the two enclose the real flower parts: the stamens and the ovary.",
  "The flora gives the palea as about as long as the lemma, with two rough keels. Together lemma and palea close round the stamens and the ovary, and the lodicules between them open the pair apart when the floret flowers.",
  "The model draws the palea slightly shorter and narrower than the lemma, a choice that departs from the floras, which describe the two as about equal in length. Its size is not measured.",
  [('Position', 'inner bract of the floret')],
  'C1', [R_POLL], [W_POACEAE], related=['grass_lemma', 'grass_lodicule'])

N('grass_lodicule', 'Lodicules: the scales that open the floret', 'structure', 0.0008, ['grass_spikelet'],
  "Two tiny scales inside a grass floret, in the place where petals would be and probably the grass equivalent of petals. They swell and push the lemma and palea apart so that the anthers and stigmas can come out.",
  "A grass flower has no showy petals. Instead there are two tiny scales at the base of the floret, the lodicules. When they take up water and swell, they spread the lemma and palea and the floret opens. Botanists now think they are the grass version of petals, much reduced.",
  "In grasses the perianth is reduced to two lodicules, which expand and contract to spread the lemma and palea. Older books called them modified sepals. Developmental genetics points the other way: in maize, mutations in the B-function gene silky1 turn stamens into carpels and lodicules into lemma- and palea-like structures, the pattern expected if lodicules are petals, since B-function genes specify petals and stamens in eudicots; the authors called this compelling developmental evidence for recognising lodicules as modified petals (Ambrose and colleagues 2000). That evidence is from maize; ryegrass lodicules have not been tested the same way. In Lolium they are 2, free, membranous and hairless.",
  "Drawn 0.8 mm tall, two to a floret; the size is a choice, not a measurement on ryegrass. The developmental evidence that lodicules are petal equivalents comes from maize mutants, not from ryegrass, so the identification in ryegrass rests on the close relationship of the grasses.",
  [('Number', '2, free, membranous'), ('Role', 'swell and open the floret'), ('What they are', 'most likely reduced petals (older texts: sepals)')],
  'C2', [R_POLL], [AMBROSE, W_POACEAE, GGW], related=['grass_lemma', 'rn_petal', 'grass_monocot'])

N('grass_filament', 'The filament: the thread that holds the anther out', 'structure', 0.0035, ['grass_anther'],
  "A very thin thread that carries each anther, long enough to hang it out of the floret into the wind.",
  "The anthers of a ryegrass flower do not stay inside. The thread-like filaments lengthen and let them hang down outside the floret, where they can swing and shed pollen into passing air.",
  "Long, well-exposed stamens are a typical feature of wind-pollinated plants. In ryegrass the anther hangs from the filament so that it can swing in moving air and shed pollen. The flora gives the anther length as 2.9-3.4 mm.",
  "Drawn 3.5 mm long, about as long as the anther itself. That length is illustrative, not measured on ryegrass.",
  [('Role', 'holds the anther clear of the floret')],
  'C1', [R_POLL], [W_ANEMO], related=['grass_anther', 'grass_wind_pollination'])

N('grass_anther', 'The anthers: where the pollen is made', 'structure', 0.0031, ['grass_spikelet', 'grass_wind_pollination'],
  "Each ryegrass floret has three pale yellow anthers, each about 3 mm long, that hang out on thread-like filaments and shed pollen to the wind.",
  "An anther is the pollen-making part of a flower. In ryegrass there are three per floret, and they hang out of the floret on thin threads. Each is a small, pale yellow pouch that splits and releases a cloud of tiny pollen grains. The numbers of grains are huge. Click 'Look at grass pollen' to see grains the size of ryegrass pollen.",
  "Stamens: 3 (Grass Genera of the World). Anther length is 2.9-3.4 mm in one flora, (1.5)-2.5-4 mm in another and 1.3-4.5 mm for the genus; anthers are pale yellow. The pollen grains are 26-50 µm, spheroidal, with one pore (PalDat).",
  "The model draws 3.1 mm anthers and opens about 38 per cent of the florets, a choice.",
  [('Stamens per floret', '3'), ('Anther length', '2.9-3.4 mm (DELTA); 1.3-4.5 mm in the genus'), ('Colour', 'pale yellow')],
  'C1', [R_POLL], [GGW, DELTA, NZF, W_LP, PALDAT], parts=['grass_filament', 'grass_pollen'], related=['rn_anther', 'rn_stamen', 'rn_pollen_grain'])

N('grass_stigma', 'The stigmas: feathery pollen traps', 'structure', 0.003, ['grass_spikelet', 'grass_wind_pollination'],
  "Each floret has two white stigmas that stick out of the floret; wind-pollinated plants like grasses have large, feathery ones that catch pollen from the air.",
  "The stigma is the part of the flower that receives pollen. A grass has two on each flower, and they stick out of the floret, branched like tiny feathers, so that a pollen grain drifting past is likely to touch one.",
  "Stigmas: 2, white (Grass Genera of the World). Wind-pollinated flowers typically have large feathery stigmas.",
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
  "The model does not draw pollen release; the amount of pollen per anther or per plant is not given.",
  [('Pollen type', 'light, smooth, non-sticky, abundant'), ('Stamens', 'long, well exposed'), ('Stigmas', 'large, feathery')],
  'C1', [R_POLL], [W_ANEMO, W_POACEAE], parts=['grass_anther', 'grass_stigma', 'grass_pollen', 'grass_hay_fever'], related=['rn_pollination', 'bio_pollination_networks', 'bio_plant_reproduction', 'rn_acris'])

N('grass_pollen', 'Grass pollen', 'structure', 0.00004, ['grass_anther', 'grass_hay_fever'],
  "A ryegrass pollen grain is a rough sphere about 26 to 50 micrometres across, with a single pore. Each carries the male cells of the plant and, on its surface and inside, proteins that cause hay fever.",
  "Pollen grains are the male half of the plant's reproduction. They are tiny, far too small to see singly, and are carried on the wind. Most land nowhere useful. The scene shows ryegrass-sized grains and a feathery stigma branch.",
  "PalDat describes Lolium perenne pollen as medium-sized (26-50 µm), spheroidal, with one pore with a thickened ring (annulus) and a lid (operculum), three-celled, without a pollen coat. In rain the grains can swell and burst: in laboratory work on ryegrass pollen, osmotic pressure from water makes grains break apart and release sub-pollen particles mostly between 60 and 200 nm across.",
  "The grains in the scene are drawn at 35-40 µm and are fewer than a real cloud; sub-pollen particles are not drawn (too small for the scene).",
  [('Diameter', '26-50 µm (PalDat)'), ('Pore', 'one, with annulus and operculum'), ('Sub-pollen particles from bursting', '≈ 60-200 nm (laboratory study)')],
  'C1', [R_POLL], [PALDAT, PMC_STORM], related=['grass_hay_fever', 'rn_pollen_grain', 'bio_hypersensitivity_autoimmunity'],
  fig=spans([('sub-pollen particles from bursting grains', .06, .2), ('ryegrass pollen grain', 26, 50)], 'µm', 'Size in micrometres on a log scale (0.01 to 100): a ryegrass pollen grain is 26 to 50 micrometres across; the fine particles that a burst grain releases in rain, in laboratory work, are 0.06 to 0.2 micrometres, a few hundred times smaller.', .01, 100, ' µm', True))

N('grass_hay_fever', 'Grass pollen and hay fever', 'process', 0.00004, ['grass_pollen', 'grass_plant'],
  "Hay fever is an allergy to pollen. In Britain grass pollen is the commonest trigger, and its season is mainly from May to July.",
  "In most people pollen causes nothing. In people with hay fever, the immune system treats harmless pollen proteins as a threat, and the result is sneezing, a runny nose and itchy eyes. About one in five people in the UK has hay fever, and the large majority of them are allergic to grass pollen. The grass pollen season can start as early as May and usually peaks in June and July; there are often two peaks, one in the first half of June and one in early July. Counts are often highest in the early morning, between about 5 and 10 am. Dry, windy weather keeps pollen in the air; rain usually washes it out for a while.",
  "The immune system makes IgE antibodies against a pollen protein. The IgE sits on mast cells; when pollen protein cross-links it, the mast cells release histamine and other chemicals (OpenStax Microbiology 19.1). Allergen proteins of perennial ryegrass are catalogued by WHO and IUIS and named Lol p 1, Lol p 2, Lol p 5 and so on. In timothy grass, allergen groups 1 and 5 together account for sensitisation with a prevalence above 90 % (the figure is for timothy, not ryegrass). In thunderstorms, rain can make grains swell and burst into tiny particles that reach deeper into the lungs: 'thunderstorm asthma'.",
  "Prevalence figures differ by source and year: about 1 in 5 (Met Office); about 13 million people (Royal Meteorological Society); 26 % of adults and 10-15 % of children (Allergy UK). Asthma + Lung UK and the Royal Meteorological Society say grass pollen affects about 95 % of hay fever sufferers; the Met Office says 'the majority' and 'the vast majority'. A lawn that is mown often rarely flowers, so it releases little pollen.",
  [('Season (Met Office)', 'can start in May; generally peaks in June and July; two peaks, first half of June and early July'), ('Grass pollen among hay fever sufferers', '≈ 95 % (Asthma + Lung UK; RMetS); "the vast majority" (Met Office)'), ('Hay fever in the UK', '≈ 1 in 5 people (Met Office)'), ('Ryegrass allergens', 'named Lol p 1, Lol p 2, Lol p 5 and others'), ('Daily peak', 'early morning, about 5-10 am (RMetS)')],
  'C1', [R_HYP, R_POLL], [MET22, MET23, ALUK, RMET, ALLUK, ALLERGEN, PMC_IGE, PMC_STORM, OS_HYPER], related=['bio_hypersensitivity_autoimmunity', 'grass_pollen', 'grass_wind_pollination'],
  fig=spans([('grass pollen season (can start in May)', 5, 8), ('usual peak (June and July)', 6, 8)], 'month (initial letters, January to December)', 'When grass pollen is in the air in Britain: it can start as early as May and generally peaks in June and July. Each bar runs from the start of its first month to the end of its last. The exact dates change from year to year with the weather.', 1, 13, '', False, tick_labels=[(i + 1, m) for i, m in enumerate('JFMAMJJASOND')]))
