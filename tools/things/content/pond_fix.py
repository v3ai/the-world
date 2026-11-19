# Corrections to the pond's cards after the science referee's report (notes/review_pondrobin_science.md).
# Imported by pond_nodes.py after pond_cards_a..d. fix() replaces fields of a card, sub() replaces a phrase inside one layer.
# Sources opened for these corrections are named in each card's `ext`; the full list is in notes/review_fixes_pondrobin.md.
from pond_lib import *
import re

def card(id):
    n = [x for x in NODES if x['id'] == id]
    assert len(n) == 1, id
    return n[0]
def fix(id, **k):
    n = card(id)
    for key, v in k.items():
        if key in ('basics', 'deeper', 'expert'): n['layers'][key] = v
        elif key == 'facts': n['facts'] = [list(f) for f in v]
        elif key == 'openq': n['open_questions'] = v
        elif key == 'dyk':
            n['did_you_know'] = v
        elif key == 'cert': n['certainty'] = v
        else: n[key] = v
def sub(id, layer, old, new):
    n = card(id)
    if layer in ('basics', 'deeper', 'expert'): d, key = n['layers'], layer
    elif layer == 'dyk': d, key = n, 'did_you_know'
    else: d, key = n, layer
    assert old in d[key], (id, layer, old[:50])
    d[key] = d[key].replace(old, new)

# ---- new sources (each was opened this session; the report says what each supported)
HB = X('Hu and Bush 2010: The hydrodynamics of water-walking arthropods (J. Fluid Mech. 644: 5-33)', 'https://thales.mit.edu/bush/wp-content/uploads/2012/04/striders-JFM.pdf')
MITN = X('Water strider locomotion (MIT News, on Hu, Chan and Bush 2003, Nature 424: 663)', 'https://news.mit.edu/2003/robostrider')
BUSHL = X('Water strider locomotion: paradox lost (Bush lab, MIT)', 'https://thales.mit.edu/bush/index.php/2003/04/14/water-strider-locomotion-paradox-lost')
NATC = X('Nature Communications 2018, diatoms fix about 20 % of photosynthetic carbon on Earth (PMC5838239)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5838239')
EOS = X('Eos: Ocean acidification may drive diatom decline (up to 40 % of marine primary production)', 'https://eos.org/articles/ocean-acidification-may-drive-diatom-decline')
SIS = X('Science in School: hands-on experiments with Daphnia', 'https://scienceinschool.org/article/2022/hands-on-experiments-daphnia')
DZS = X('Daphnia magna raised on Scenedesmus and Chlorella (Zoological Studies 2015, PMC6661295)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6661295')
NATSPOT = X('Great pond snail (NatureSpot)', 'https://www.naturespot.org/species/great-pond-snail')
NHM = X('Frogspawn, tadpoles and froglets (Natural History Museum)', 'https://nhm.ac.uk/discover/frogspawn-tadpoles-and-froglets.html')
FROGLIFE2 = X('Common frog (Froglife)', 'https://www.froglife.org/info-advice/amphibians-and-reptiles/common-frog-2/')
WILDT = X('Common pond skater (The Wildlife Trusts)', 'https://www.wildlifetrusts.org/node/769')
BUGL = X('Common pond skater (Buglife)', 'https://buglife.org.uk/bugs/bug-directory/common-pond-skater')
DURH = X('Water strider life history, five nymphal instars after Southwood and Leston 1959 (Durham University thesis)', 'https://etheses.durham.ac.uk/id/eprint/9227/1/9227_6158.PDF')
FIRSTN = X('Southern hawker, Aeshna cyanea (First Nature)', 'https://www.first-nature.com/insects/o-aeshna-cyanea.php')
ELSER = X('Elser et al. 2007: Global analysis of nitrogen and phosphorus limitation of primary producers (Ecology Letters 10: 1135-1142), abstract', 'https://doi.org/10.1111/j.1461-0248.2007.01113.x')
OECD221 = X('Ziegler et al. 2025 on the OECD 221 duckweed test (J. Xenobiotics, PMC12028534): control doubling time under 2.5 days', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12028534')
NEWM = X('Newman et al. 2015: leaf litter decomposition in a Georgia stream (PLoS ONE, PMC4476575)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4476575')
W_METHANOT = X('Methanotroph (Wikipedia)', 'https://en.wikipedia.org/wiki/Methanotroph')
R_ROT = R('28.3', '28-3-superphylum-lophotrochozoa-flatworms-rotifers-and-nemerteans')

# ---------------------------------------------------------------- the whole pond
sub('park_pond', 'basics', 'Every plant and animal here is drawn at its true size, so the smallest (a water flea about 2.5 mm long) is very small beside the pond itself (about 6 m across).',
    'The plants and animals are drawn at typical sizes for their kind (the hornwort stems are shortened to fit this shallow pond), so the smallest (a water flea about 2.5 mm long) is very small beside the pond itself (about 6 m across).')
sub('park_pond', 'expert', 'the sizes of the organisms are typical measured sizes, quoted on their cards.', 'the sizes of the organisms are typical sizes for each kind, quoted on their cards; hornwort stems are drawn shorter than real ones.')

# ---------------------------------------------------------------- surface film and leg hairs
fix('pond_surface_film',
    dyk='The "film" is not a separate layer. It is the water\'s own surface, and the force that holds a skater up acts along the line where each leg meets the water.',
    expert='A skater\'s weight is carried by the curved surface round each leg. Hu and Bush (2010) give typical strider weights of 3 to 10 dynes (30 to 100 micronewtons) and leg widths of 20 to 80 µm, so surface tension supports the insect almost entirely; the force acts along the contact line where leg and water meet. Surface tension of pure water is 72.8 mN/m at 20 °C and 71.97 mN/m at 25 °C. The dimples drawn here are about 6 mm across for illustration and are not measured shapes.',
    ext=[W_ST, HB, W_STRIDER])
fix('pond_leg_hairs',
    summary='Needle-like hairs, some ten thousand to every square millimetre, cover a pond skater\'s legs and keep water from wetting them.',
    expert='In the measurements summarised by Hu and Bush (2010) for water striders of the genus Gerris, the hairs are about 30 µm long and 1 to 3 µm thick at the base, tapering, tilted about 30 degrees, at a density of 12,000 to 16,000 per square millimetre; each hair carries grooves about 400 nm wide along its length. Gao and Jiang (2004) measured a contact angle of about 168 degrees on strider legs. The tissue scene draws hairs 3 µm thick and 30 µm long about 10 µm apart (about 10,000 per square millimetre), a simplified picture.',
    facts=[('Hairs', 'about 12,000 to 16,000 per mm² (Gerris, Hu and Bush 2010)'), ('Hair size', 'about 30 µm long, 1 to 3 µm thick at the base'), ('Shape', 'tapered, tilted, with grooves about 400 nm wide'), ('Skeleton material', 'chitin, a polymer of N-acetylglucosamine')],
    ext=[HB, PMC_INSECT, W_GERRIS],
    openq=['How much the nanogrooves and trapped air add to water repellence compared with the wax-like coating alone is still being studied in the physics of surfaces.'])
sub('pond_leg_hairs', 'deeper', 'In a water strider (Gerris remigis), electron microscopy shows needle-shaped, oriented microsetae carrying fine grooves (nanogrooves) of a still smaller scale.', 'Electron microscopy of water striders shows needle-shaped, oriented microsetae carrying fine grooves (nanogrooves) of a still smaller scale.')

# ---------------------------------------------------------------- water and oxygen
n = card('pond_water')
n['facts'] = [list(f) for f in [('Water in the model', '≈ 21.7 m² × up to 0.6 m (a closed volume)'), ('Most dissolved oxygen fresh water can hold, 20 °C', '9.1 mg/L'), ('Surface water in summer', 'often above 8 mg/L (USGS); it can fall far lower at night'), ('Hypoxic', 'less than 2 mg/L'), ('See the drop', 'a drop of pond water, with a 100 µm bar')]]
FIGS['pond_water'] = bars([('0 °C', 14.6), ('10 °C', 11.3), ('20 °C', 9.1), ('30 °C', 7.6), ('hypoxic below (USGS)', 2)], 'dissolved oxygen, mg per litre', 'The most oxygen fresh water can hold at 1 bar falls as it warms (Engineering ToolBox); the USGS calls water below 2 mg/L hypoxic. Real ponds are often below these maxima, especially at night.')
sub('pond_water', 'expert', 'the USGS gives typical summer surface-water values above 8 mg/L and calls water hypoxic below 2 mg/L.', 'the USGS reports summer surface water typically above 8 mg/L and calls water hypoxic below 2 mg/L. The values given are the most the water can hold at each temperature; a real pond is often below them.')
fix('pond_oxygen', summary='The oxygen that pond animals breathe comes from two places: the air above, and plants and algae in the water making it from light. At 20 °C, air holds about thirty times more oxygen per litre than water does.')
sub('pond_oxygen', 'basics', 'Fish and water fleas, snails and dragonfly larvae all need dissolved oxygen, just as we need oxygen from air.', 'Fish, water fleas, tadpoles and dragonfly larvae all need dissolved oxygen, just as we need oxygen from air (the great pond snail is different: it breathes air at the surface).')
sub('pond_oxygen', 'basics', 'a litre of air holds about 30 times more oxygen than a litre of water, so aquatic animals have little to spare.', 'at 20 °C a litre of air holds about 30 times more oxygen than a litre of water that is holding all the oxygen it can, so aquatic animals have little to spare.')
fix('pond_green_water', cert='C2')
sub('pond_green_water', 'basics', 'In fresh water phosphorus is usually the shortage that limits growth, so a little extra can make a big difference.', 'Phosphorus or nitrogen, and often both together, can be the shortage that limits growth, so a little extra can make a big difference.')
sub('pond_green_water', 'deeper', ' A duckweed raft shades the water, which can reduce light-driven algal growth (Wikipedia, Duckweed).', ' A thick raft of duckweed shades the water, which can reduce light-driven algal growth.')
sub('pond_green_water', 'expert', 'In most freshwater ecosystems phosphorus is the limiting nutrient for plant growth (in the sea it is usually nitrogen). ', 'A global analysis of nutrient-addition experiments (Elser et al. 2007) found that nitrogen limitation and phosphorus limitation are about equally common and strong in fresh water, in the sea and on land, and that adding both together often gives a bigger response than either alone; the older rule that phosphorus is the usual limit in fresh water is too simple. ')
fix('pond_green_water', facts=[('Which nutrient limits algae', 'phosphorus, nitrogen or both; co-limitation is common (Elser et al. 2007)'), ('A scum on the water', 'may be toxic cyanobacteria: keep dogs and children out'), ('After a bloom dies', 'decay uses oxygen and can leave the water hypoxic'), ('First step in recovery', 'cut the supply of nutrients')], ext=[W_EUT, W_BLOOM, ELSER])
fix('pond_stratification', openq=[])
fix('pond_bank', refs=[R_AQ, R_PLANT])
sub('pond_bank', 'expert', "; the bank ring is 1.22 times the water's width.", '; the bank is a ring of wet soil round the water.')

# ---------------------------------------------------------------- mud, leaves, gas
fix('pond_mud', summary='The soft sediment on the bottom: tiny mineral grains mixed with rotting plant matter, where microbes use up the oxygen and, deeper, archaea make methane.',
    ext=[PMC_SED, W_METH, W_GRAIN, W_METHANOT])
sub('pond_mud', 'deeper', 'The upper few millimetres or so have oxygen from the water above and different, oxygen-using microbes;', 'The thin top layer has oxygen from the water above and different, oxygen-using microbes (mostly bacteria), and methane rising through it can be eaten by methane-oxidising bacteria, which combine it with oxygen;')
fix('pond_mud_oxygen', cert='C1', openq=[])
sub('pond_mud_oxygen', 'expert', ' and traces of phosphine (Wikipedia, Marsh gas).', ' and traces of phosphine (Marsh gas article).')
sub('pond_leaf_litter', 'basics', 'Over weeks they soften and are eaten by bacteria and fungi, until only fine dark fragments are left.', 'Over months they soften and are eaten by bacteria and fungi, until only fine dark fragments are left. Tough leaves last longest: in one stream study, water-oak leaves still held about three quarters of their organic mass after 128 days.')
fix('pond_leaf_litter', refs=[R_ECO, R_FLOW], ext=[W_BACT, NEWM])
fix('pond_gas_bubbles', openq=[], cert='C2')
sub('pond_gas_bubbles', 'deeper', 'It is an important route for methane to leave wetlands: about 45 % of the annual methane flux from freshwater marshes goes as bubbles (Wikipedia, Marsh gas). Marsh gas is mainly methane with some hydrogen sulfide and carbon dioxide. The share of methane in bubbles varies with place, time and temperature and is not a single number.', 'Bubbles are one route by which methane leaves wetlands; the rest dissolves and escapes at the surface. Marsh gas is mainly methane with some hydrogen sulfide and carbon dioxide, and the share of methane in a bubble varies with place, time and temperature.')
sub('pond_gas_bubbles', 'expert', ' Acetate accounts for about two thirds of global methane production by this route.', '')
fix('pond_gas_bubbles', facts=[('Main gas', 'methane (CH₄)'), ('Other gases', 'hydrogen sulfide, carbon dioxide'), ('Bubbles in the model', '≈ 7 mm across, enlarged for visibility')])
fix('pond_mud_bacteria', expert='Bacterial cells are typically 0.5 to 5 µm; the scene draws them at about 1.6 × 3.5 µm, and shows only a few hundred, far fewer than real mud holds.')
sub('pond_mud_bacteria', 'basics', 'Bacteria are single-celled living things without a nucleus, typically 0.5 to 5 micrometres long.', 'Bacteria are single-celled living things without a nucleus, typically 0.5 to 5 micrometres long, and the first to use the oxygen that reaches the mud.')

# ---------------------------------------------------------------- plants
fix('pond_duckweed', refs=[R_PLANT, R_PHOTO])
sub('pond_duckweed', 'deeper', 'Duckweed can double its biomass in about four and a half days under good conditions, which is among the fastest growth of any flowering plant. A thick mat shades the water below it and can reduce light-driven algal growth. It floats best in water of pH 6.5 to 8 and grows between about 6 and 33 °C.', 'In laboratory tests under good conditions duckweed doubles its biomass in under about 2.5 days (the standard OECD test 221 requires this of healthy controls); outdoors it grows more slowly. A thick mat shades the water below it and can reduce light-driven algal growth.')
sub('pond_duckweed', 'expert', ' Duckweed is used as animal feed, with a protein content of 20 to 40 %.', '')
sub('pond_duckweed', 'expert', 'Frond 1 to 8 mm long and 0.6 to 5 mm broad; root 1 to 2 cm (Wikipedia, Lemna minor).', 'Typical frond 1 to 8 mm long and 0.6 to 5 mm broad; root 1 to 2 cm (general descriptions).')
fix('pond_duckweed', facts=[('Frond size', 'typically 1 to 8 mm long, 0.6 to 5 mm broad (model: 3 × 2.4 mm)'), ('Root', 'one per frond, typically 1 to 2 cm long (model: 12 mm)'), ('Fronds per plant', 'one to four'), ('Growth', 'biomass doubles in under about 2.5 days in lab tests under good conditions'), ('Fronds in the model', '≈ 2,300')],
    ext=[W_LEMNA, W_LEMNOID, OECD221])
sub('pond_hornwort', 'deeper', 'Hornwort releases substances that inhibit algae and cyanobacteria, and it can crowd out other submerged plants.', 'Laboratory experiments report that hornwort can slow the growth of some algae and cyanobacteria; how much it does so in a real pond is less certain. It can also crowd out other submerged plants.')
sub('pond_hornwort', 'basics', 'Stems of a real plant can reach 1 to 3 m.', 'Stems of a real plant are commonly a metre or more long.')
sub('pond_hornwort', 'expert', 'stems 1 to 3 m (Wikipedia, Ceratophyllum demersum).', 'stems often 1 m or more, up to about 3 m (general descriptions).')
fix('pond_hornwort', facts=[('Roots', 'none'), ('Leaves per whorl', 'typically 6 to 12 (model: 6)'), ('Leaf length', 'typically 8 to 40 mm'), ('Stem length', 'a metre or more (model: up to 0.5 m, shortened to fit the pond)'), ('Winter', 'turions sink and sprout in spring')])
sub('pond_iris', 'expert', 'Height 100 to 150 cm (rarely 2 m); leaves up to 90 cm long and 3 cm wide; flowers 7 to 10 cm across (Wikipedia, Iris pseudacorus).', 'Typical height 100 to 150 cm; leaves up to 90 cm long and 3 cm wide; flowers 7 to 10 cm across (general descriptions).')
fix('pond_iris_flower',
    summary='A yellow flag flower is a large iris bloom, 7 to 10 cm across, held above the water on a tall stalk.',
    basics='The flowers are bright yellow and shaped like other irises: three broad outer segments that fold outward and down (the falls), three smaller inner ones that stand up (the standards), and three arching branches of the style that cover the stamens. In the model each flower has nine parts. The flower is the plant\'s way of making seed.',
    expert='Typical flower width 7 to 10 cm; the model flower is 8.5 cm across. The falls and standards are outer and inner tepals, a name for petal-like parts that are not all true petals. The stamens, the ovary and the markings on the falls are not drawn.')
sub('pond_iris_rhizome', 'deeper', 'The cut-away slice marks the rhizome with a hotspot. ', 'The cut-away slice marks the rhizome with a hotspot.')
sub('pond_iris_rhizome', 'expert', 'Rhizomes can survive prolonged dry conditions (Wikipedia, Iris pseudacorus). The model', 'Rhizomes can survive prolonged dry conditions. The model')

# ---------------------------------------------------------------- skater
fix('pond_skater',
    summary='The common pond skater (Gerris lacustris): a slim, dark brown bug, roughly 1 cm long, that stands and rows on the surface film of still water.',
    basics='A pond skater is a bug that lives on top of the water. It does not swim; it stands on the surface film on its four long back legs and glides across by rowing with the middle pair. Its feet make shallow dimples in the surface but do not break it. It hunts insects that fall onto the water, with piercing, sucking mouthparts. The one in the model has a 9 mm body; its legs reach about 2 cm across, and it twitches now and then.',
    deeper='The short front legs hold prey; the middle pair row the bug along; the hind pair steer. The legs are covered with tiny hairs with a wax-like coating, so they do not get wet. Water striders can reach about 1.5 m/s. Adults come out of hibernation in spring and lay eggs; the young are nymphs (bugs have no larval stage), which pass through five nymphal stages before they are adults; from egg to adult takes about six weeks.',
    expert='Adult length is given as up to about 15 mm (Wildlife Trusts, Buglife), with 8 to 10 mm quoted in a general reference, so the 9 mm model sits in the lower part of the range. The model\'s leg lengths and stance are drawn from the general arrangement, not measured on a specimen. The twitch is an illustrative motion, shown slowed, not a measured rate. Click the legs and the hairs to find out how it stays up.',
    facts=[('Body length', 'about 8 to 15 mm depending on source (model: 9 mm)'), ('Colour', 'dark brown'), ('Legs', 'front (grasp prey), middle (row), hind (steer)'), ('Speed', 'up to about 1.5 m/s (water striders; MIT News)'), ('Eats', 'insects that fall onto the water, caught on the surface'), ('Young', 'nymphs: five nymphal stages; about six weeks from egg to adult (Buglife)'), ('Adults', 'seen from April; hibernate over winter')],
    ext=[W_GERRIS, WILDT, BUGL, DURH, MITN], cert='C1')
FIGS['pond_skater'] = bars([('body length (model)', 9), ('body length: smaller figure quoted', 8), ('body length: larger figure quoted', 15)], 'millimetres', 'The pond skater drawn at 9 mm; adult body length is quoted as about 8 to 10 mm in a general reference and as up to 15 mm by the Wildlife Trusts and Buglife.')
fix('pond_skater_legs',
    deeper='Rowing works because the middle legs press back on the surface without breaking it. The stroke dents the surface like an oar and sheds swirls of water (vortices) just below it, and it is these vortices that carry the momentum which drives the insect forward. Hu, Chan and Bush (2003) showed that the small ripples the legs make play only a minor part; this answered the old puzzle (Denny\'s paradox) of how young striders, whose legs move too slowly to make waves, can move at all. One source says the middle and hind legs, not the front ones, sense the vibrations of struggling prey. The legs are cuticle, the hard skeleton material of insects, covered with water-repelling hairs.',
    expert='In the measurements summarised by Hu and Bush (2010) an adult strider\'s rowing leg is about 1.5 cm long and the driving stroke lasts about 0.01 s. In the model each leg is drawn with a coxa at the body, a raised knee, a long shin and a foot lying along the surface; the hind and middle legs are about 11 and 12 mm long. These dimensions are a plausible drawing, not a measurement.',
    openq=[], cert='C2', ext=[HB, MITN, BUSHL, W_GERRIS])

# ---------------------------------------------------------------- water flea
fix('pond_daphnia',
    basics='Water fleas are not insects and not fleas: they are small crustaceans, relatives of crabs and shrimp, and they swim by jerky hops, rowing with their large second antennae. A shell of two translucent halves covers most of the body, so you can see the organs through it: a dark eye, a gut, eggs in a pouch and, behind the head, a heart that beats a few hundred times a minute. This is why Daphnia is a favourite of school microscopes. The model is 2.5 mm long; the shell is drawn translucent so the heart shows.',
    deeper='Daphnia feed by filtering: the second and third pairs of legs strain food from the water, mainly single-celled algae (laboratories raise them on green algae such as Scenedesmus and Chlorella) and also bits of dead matter, protists and bacteria. Most species reproduce by cyclical parthenogenesis: females make eggs that develop without fertilisation, and the young are mostly female. When conditions worsen, some young become males, and females make eggs that need fertilising and are protected in a tough case. Daphnia can make haemoglobin when oxygen is low.',
    expert='Body length is about 2 to 5 mm in teaching sources (Science in School); the genus is reported from 0.2 to 6 mm. The model is a 2.5 mm female. Heart rates counted at room temperature range from about 200 to over 350 per minute and rise with temperature, so the model animates the heart at 1.5 beats per second as a clearly slowed, illustrative rhythm, not a measurement. The hop is an illustrative motion.',
    facts=[('Length', 'about 2 to 5 mm (model: 2.5 mm)'), ('Heart rate', 'about 200 to 350 per minute near room temperature; varies with temperature'), ('Eats', 'single-celled algae, bacteria and fine dead matter, by filtering'), ('Reproduces', 'cyclical parthenogenesis')],
    ext=[W_DAPH, SIS, DZS])
FIGS['pond_daphnia'] = bars([('typical: smallest', 2), ('model', 2.5), ('typical: largest', 5)], 'millimetres', 'Size of Daphnia in teaching sources (Science in School: 2 to 5 mm) against the model.')
fix('pond_daphnia_heart',
    basics='Behind the head, at the top of the back, the heart pumps the animal\'s blood. Because the shell is clear, you can see it beat: a few hundred times a minute at room temperature, faster when warmer. It is the classic view of a water flea under a microscope. In the model the heart beats about once every two thirds of a second so that you can watch it, and the screen says so.',
    deeper='Because of their size, Daphnia use both diffusion and circulation to move oxygen about; they make haemoglobin when oxygen is low. A heart is a muscular pump in every animal that has one, including us; a human heart is a far bigger pump, but it works on the same principle: heart muscle cells contract together. Press the button to see ATP, the molecule that fuels every muscle cell.',
    expert='The heart is at the top of the back just behind the head. Counted rates near room temperature run from about 200 to over 350 beats per minute depending on the animal and temperature. In the model the heart is an ellipsoid 0.4 mm long, pulsing at 1.5 beats per second, a slowed illustration.',
    facts=[('Heart rate', 'about 200 to 350 per minute near room temperature'), ('Where', 'top of the back, behind the head'), ('In the model', 'pulses slowly, for illustration')], ext=[W_DAPH, SIS])
sub('pond_daphnia_eggs', 'deeper', 'Eggs hatch within a day and the young stay in the brood pouch for about three days at 20 °C before being released (Wikipedia, Daphnia). Reproduction', 'The young develop in the brood pouch for a few days before being released. Reproduction')
sub('pond_daphnia_eggs', 'expert', 'The model shows four eggs, each 0.34 mm across; the number and the positions are illustrative.', 'The model shows four eggs, each 0.34 mm across, as an illustration of a brood.')
fix('pond_daphnia_eggs', facts=[('Eggs per clutch', 'a few in small species; many in larger ones'), ('Model', '4 eggs, 0.34 mm each')])
FIGS.pop('pond_daphnia_eggs', None)
sub('pond_daphnia_eggs', 'basics', 'Small species may carry only one or two eggs, and larger species such as Daphnia magna can carry over a hundred. The model shows four.', 'Small species carry only a few eggs, larger species many more. The model shows four.')
sub('pond_daphnia_head', 'deeper', 'The eye is among the most prominent features of the body and is moved by ciliary muscles, visible under low-power microscopy (Wikipedia, Daphnia). The model', 'The eye is among the most prominent features of the body and is moved by small muscles that can be seen under a low-power microscope. The model')
sub('pond_daphnia_antennae', 'deeper', 'the movement resembles flea-like jumping (Wikipedia, Daphnia).', 'the movement resembles flea-like jumping.')
sub('pond_daphnia_gut', 'deeper', 'voided through the anus on the underside of the end of the body (Wikipedia, Daphnia). The pouches', 'voided through the anus on the underside of the end of the body. The pouches')
sub('pond_daphnia_limbs', 'deeper', 'the others create the incoming current (Wikipedia, Daphnia). The model', 'the others create the incoming current. The model')

# ---------------------------------------------------------------- snail
fix('pond_snail',
    summary='The great pond snail (Lymnaea stagnalis): a large freshwater snail with a spiral shell about 4.5 to 6 cm tall, that breathes air at the surface.',
    basics='This is one of the biggest snails in British ponds. Its tall, pointed, spiral shell is brown and about 4.5 to 6 cm tall. Unlike a fish it has no gills: it has a lung and breathes air. It crawls over plants and mud on one broad muscular foot. In the model the snail is drawn at a typical size, crawling on the mud with its two tentacles forward.',
    deeper='The great pond snail belongs to the pulmonates, snails whose mantle cavity has no gills and is instead a blood-vessel-lined lung. Each snail is both male and female at once (a simultaneous hermaphrodite), though it plays only one role in a mating. In aquaria it is fed on vegetables, leaves, algae and the eggs of other snails; this card does not describe its diet in a wild pond. It is a model organism in neuroscience and parasitology: its nerve cells are large, up to about 100 µm across, and it is an intermediate host for several flatworm parasites. The shell in the model is a spiral of 6 turns made by sweeping an oval along a logarithmic coil; it illustrates the shape and is not a measured shell.',
    expert='Shell height about 4.5 to 6 cm (NatureSpot); a general reference gives 45 to 60 mm and a width of 20 to 30 mm. The model\'s shell is 50 mm tall, 26 to 30 mm wide. The body size and posture are illustrative.',
    facts=[('Shell height', 'about 4.5 to 6 cm (model: 5 cm)'), ('Breathes', 'air, with a lung'), ('Sexes', 'both at once (hermaphrodite)'), ('Nerve cells', 'large, up to about 100 µm'), ('Fed in aquaria on', 'vegetables, leaves, algae, other snails\' eggs')],
    ext=[NATSPOT, W_LYM, W_PULM])
FIGS['pond_snail'] = bars([('shell height: smallest quoted', 45), ('shell height (model)', 50), ('shell height: largest quoted', 60)], 'millimetres', 'Great pond snail shell height: about 4.5 to 6 cm (NatureSpot) against the model.')

# ---------------------------------------------------------------- dragonfly larva
fix('pond_dragonfly_larva',
    basics='A dragonfly spends most of its life under water as a larva (the young stage is also called a nymph). The southern hawker\'s larva is 38 to 48 mm long, with big eyes, six legs, wing pads on the back of the middle part of the body and a long tapering abdomen ending in a point. It is a predator that strikes with a folded lip (the mask) that shoots out to grab prey. It eats other water insects, small invertebrates and tadpoles. It lives like this for about three years in one source (two to three in another), then climbs a plant stem out of the water and the adult dragonfly emerges.',
    deeper='The larva grows by moulting, shedding its skin many times (6 to 15, depending on the species). Southern hawkers emerge as adults in summer and fly from about June to October; the adult is about 70 mm long with a wingspan of up to 110 mm. The adults breed in well-vegetated small ponds, often garden ponds. When the larva is ready, it stops feeding, goes to the surface, generally at night, climbs a reed or other plant out of the water and moults for the last time.',
    expert='Larva 38 to 48 mm (British Dragonfly Society); development takes about three years (First Nature) or two to three years (a general reference). The model is 42 mm long. The proportions of the head, legs and wing pads are drawn from the general form of a hawker larva and are not measured on a specimen.',
    facts=[('Larva length', '38 to 48 mm (model: 42 mm)'), ('Larval life', 'about three years (First Nature); two to three (general reference)'), ('Moults', '6 to 15, depending on species'), ('Eats', 'aquatic insects and other invertebrates, tadpoles'), ('Adult', '≈ 70 mm long, wingspan up to 110 mm; flies from about June to October')],
    ext=[BDS, FIRSTN, W_AESH, W_DRAGON])
sub('pond_larva_mask', 'expert', 'No figure for the speed or reach of the strike is quoted on this card.', 'How far and how fast the mask strikes is not given in the sources used; the model draws it folded and does not animate it.')
sub('pond_larva_mask', 'deeper', 'extensible lower lip armed with hooks and spines, folded under the body at rest and struck out at great speed by hydraulic pressure created by the abdominal muscles (Wikipedia, Dragonfly).', 'extensible lower lip armed with hooks and spines, folded under the body at rest and struck out at great speed by hydraulic pressure created by the abdominal muscles.')
sub('pond_larva_mask', 'deeper', ' The mask in the model is a flat plate with two hooks, drawn folded; its extension is not animated.', ' The model\'s mask is a flat plate with two hooks, drawn folded.')
fix('pond_larva_thorax',
    summary='The middle part of the body, which carries the legs and the wing pads: the folded beginnings of the adult\'s wings.',
    basics='Behind the head is the thorax, the part that holds the muscles for the legs. On its back lie small flat cases, the wing pads. Inside them the adult\'s wings are growing, folded. The model draws two pairs, as an adult dragonfly has four wings. When the larva climbs out of the water and sheds its skin for the last time, the wings unfold and harden.',
    deeper='The wing pads grow with each moult. When ready, the larva stops feeding, goes to the surface, generally at night, climbs a reed or other plant and moults.',
    facts=[('Parts', 'thorax; wing pads (drawn as two pairs)'), ('Turns into', 'the adult wings at the last moult')])
sub('pond_larva_abdomen', 'deeper', 'by suddenly expelling water through the anus (Wikipedia, Dragonfly).', 'by suddenly expelling water through the anus.')

# ---------------------------------------------------------------- tadpole and the life cycles
fix('pond_tadpole',
    basics='Frogs lay clumps of eggs (spawn) in ponds in spring, and the eggs hatch into tadpoles. A tadpole is built for water: it breathes with gills, swims by waving its tail from side to side, and eats algae and water fleas, and later leaves, moss and small insects. The one in the model has grown hind legs. Tadpoles are black at hatching and later become speckled with gold or brown. Many are eaten by fish, diving beetles, dragonfly larvae and birds. Those that survive lose the tail and leave the pond as tiny froglets, usually in early summer but sometimes as late as September.',
    deeper='A common frog spawns from January in the south to as late as June, generally peaking in April; a clump holds a few hundred to 5,000 eggs. Tadpoles hatch two to four weeks after spawning (about three weeks in the Natural History Museum\'s account). About 16 weeks after hatching they begin to grow hind legs, then front legs (Natural History Museum; Froglife). The timing depends on the temperature, so it varies between ponds and years. Early tadpoles have external gills that are later covered by skin, and the internal gills vent through small openings (spiracles). The gut is long and spiral and the tail is flattened from side to side. At metamorphosis the tail is absorbed, lungs develop and the gut shortens.',
    expert='In a Perthshire study of upland tadpoles with hind legs, body length was 10 to 17.5 mm and tail 15 to 27.5 mm, with hind limbs 2 to 9 mm (Bland, The Glasgow Naturalist); those were unusually large, over-wintering tadpoles at 865 m, so they are a guide rather than the norm for a garden pond. The model has a 14 mm body, a 20 mm tail and 4 mm hind legs. Adult common frogs are up to about 9 cm (males) and 13 cm (females) according to Froglife; the model shows none.',
    facts=[('Spawn clump', 'a few hundred to 5,000 eggs'), ('Hatching', 'two to four weeks after spawning'), ('Hind legs begin', 'about 16 weeks after hatching (temperature-dependent)'), ('Froglets leave the pond', 'usually early summer, sometimes as late as September'), ('Size, hind-leg stage (upland study)', 'body 10 to 17.5 mm, tail 15 to 27.5 mm'), ('Eats', 'algae and water fleas; later leaves, moss, small insects'), ('Eaten by', 'fish, diving beetles, dragonfly larvae, birds')],
    ext=[FROGLIFE2, NHM, W_FROG, W_TAD, BLAND, ARC])
fix('pond_life_cycles',
    deeper='Common frogs hibernate from late October to January and may leave hibernation as early as February to migrate to garden ponds. They spawn from January in the south-west of England to as late as June, generally peaking in April. The eggs hatch two to four weeks after spawning; the tadpoles begin growing hind legs about 16 weeks after hatching, and froglets leave the water usually in early summer and sometimes as late as September, depending on the weather and when the eggs were laid. Adult frogs are up to about 9 cm (males) and 13 cm (females) long. A southern hawker larva is 38 to 48 mm long and takes about three years to develop; the adult is a land-and-air predator, so the dragonfly moves energy from the pond\'s food web to the air.',
    facts=[('Frog: spawn to froglet', 'hatch two to four weeks after spawning; hind legs begin about 16 weeks after hatching; froglets leave usually in early summer, sometimes as late as September'), ('Frog: adult', 'up to about 9 cm (male), 13 cm (female); damp places near ponds'), ('Dragonfly: larval life', 'about three years (First Nature); two to three (general reference)'), ('Dragonfly: adults', 'fly from about June to October')],
    ext=[FROGLIFE2, NHM, W_FROG, ARC, W_AESH, BDS, FIRSTN, W_DRAGON])
sub('pond_life_cycles', 'basics', 'the larva spends two or three years under water', 'the larva spends about three years under water')
FIGS['pond_life_cycles'] = blocks([('f1', 'frog spawn in the pond (January to June)', 12, 14, None), ('f2', 'tadpoles hatch 2 to 4 weeks later: gills, tail, eat algae', 38, 14, None), ('f3', 'hind legs begin about 16 weeks after hatching, then front legs', 64, 14, None), ('f4', 'froglet leaves the pond (usually early summer, up to September)', 90, 14, None), ('f5', 'adult frog on land; returns to breed', 90, 40, None),
              ('d1', 'eggs laid in plants at the water\'s edge', 12, 66, None), ('d2', 'larva in the pond: about 3 years, many moults', 38, 66, None), ('d3', 'climbs a plant at night, adult emerges (summer)', 64, 66, None), ('d4', 'adult flies (June to October); returns to breed', 90, 66, None)],
             [('f1', 'f2', None), ('f2', 'f3', None), ('f3', 'f4', None), ('f4', 'f5', None), ('d1', 'd2', None), ('d2', 'd3', None), ('d3', 'd4', None)],
             'Two life cycles that link pond and land. Each frog interval is measured from the previous step. Timings are from Froglife, the Natural History Museum, First Nature and the British Dragonfly Society; they vary with weather and place.')

# ---------------------------------------------------------------- the food web, from each organism's own sourced diet
fix('pond_food_web',
    summary='Who eats whom among the organisms in this pond, using only feeding links found in a source: tiny algae feed the water flea, rotifer and tadpole; the dragonfly larva eats tadpoles; bacteria break down dead matter.',
    basics='A food web is a map of what eats what. In this pond it starts with sunlight. Single-celled algae turn light into food, and water fleas, rotifers and Paramecium feed on them, on bacteria and on bits of dead matter. A tadpole eats algae and water fleas; a dragonfly larva hunts other water animals, including tadpoles; and the pond skater, on top, eats insects that land on the water. Everything that dies is broken down by bacteria, which return nutrients to the water. Duckweed and hornwort are also food-makers, but this card draws no animal eating them because none of the sources used says so. Only a few of the pond\'s many links are drawn.',
    deeper='Energy flows one way through a food web: it enters as sunlight and, at each step, most is lost as heat, so there are fewer hunters than grazers. Nutrients, by contrast, go round and round. Water fleas filter single-celled algae and bits of dead matter, protists and bacteria; rotifers eat dead matter, bacteria, algae and single-celled animals; Paramecium eats bacteria, algae and yeasts; tadpoles eat algae and water fleas, and later leaves, moss and small insects; a dragonfly larva eats other water insects, invertebrates and tadpoles. The great pond snail is fed on vegetables, leaves, algae and other snails\' eggs in aquaria; what it eats in a pond is not settled by the sources used, so it appears with its aquarium food only. Adult frogs eat land invertebrates and are not part of this pond model.',
    expert='Each link in the figure is from a source on that organism\'s own card. Real food webs have many more links (omnivory, cannibalism, seasonal diet changes), and an organism\'s diet changes as it grows, as the tadpole\'s does. Not drawn: the fish and diving beetles that eat tadpoles (not modelled), birds, and the insects that fall on the surface for the skater to eat.',
    facts=[('Producers', 'single-celled algae; duckweed, hornwort and the iris (no eater is drawn)'), ('Grazers and filter-feeders', 'water flea, rotifer, Paramecium, tadpole'), ('Hunters', 'dragonfly larva, pond skater'), ('Recyclers', 'bacteria (and fungi) in the water and mud'), ('Energy', 'enters as sunlight; most is lost at each step')],
    ext=[W_DAPH, DZS, W_ROT, W_PARA, FROGLIFE2, NHM, FIRSTN, WILDT, W_LYM], parts=['pond_daphnia', 'pond_tadpole', 'pond_snail', 'pond_dragonfly_larva', 'pond_skater', 'pond_duckweed', 'pond_hornwort', 'pond_rotifer', 'pond_paramecium', 'pond_drop'])
FIGS['pond_food_web'] = blocks([('sun', 'sunlight', 5, 10, None), ('alg', 'single-celled algae (in the drop)', 28, 10, None), ('plant', 'duckweed, hornwort (no eater drawn)', 28, 34, None),
              ('det', 'dead leaves and detritus', 14, 56, None), ('bac', 'bacteria (recyclers)', 14, 88, None),
              ('daph', 'water flea', 50, 30, None), ('rot', 'rotifer', 50, 56, None), ('para', 'Paramecium', 50, 84, None), ('snail', 'great pond snail (aquarium diet only)', 74, 56, None),
              ('tad', 'tadpole', 74, 20, None), ('larva', 'dragonfly larva', 92, 36, None), ('skater', 'pond skater', 92, 80, None), ('out', 'insects that land on the water (not modelled)', 74, 92, None)],
             [('sun', 'alg', 'light'), ('sun', 'plant', 'light'), ('alg', 'daph', None), ('bac', 'daph', None), ('det', 'daph', None), ('alg', 'rot', None), ('bac', 'rot', None), ('det', 'rot', None), ('alg', 'para', None), ('bac', 'para', None), ('det', 'bac', 'broken down by'), ('alg', 'snail', 'in aquaria'),
              ('alg', 'tad', None), ('daph', 'tad', None), ('tad', 'larva', None), ('out', 'skater', None)],
             'Who eats whom among the organisms in this pond. An arrow points from the food to the animal that eats it. Every link is from a source on that organism\'s card; it is a small sample, not the whole food web.')

# ---------------------------------------------------------------- the drop
fix('pond_drop',
    summary='A single drop of pond water holds green algae, glass-shelled diatoms, single-celled hunters, tiny animals and bacteria: a small world, each member a different size.',
    basics='A drop of pond water looks like nothing, but under a microscope it teems with life. In the scene you see green algae (Chlamydomonas, and a ball-shaped colony called Volvox), diatoms with shells of glass, a Paramecium (a single cell that hunts), a rotifer (a tiny animal with a wheel of beating hairs) and many bacteria, with bits of dead plant. They are drawn against a 100 micrometre bar, one tenth of a millimetre, so you can see how much bigger some are than others: a bacterium is about 30 times shorter than the bar, and a rotifer about two and a half times longer. Click anything to find out what it is.',
    deeper='These organisms make up the plankton of a pond: life that drifts with the water (many of these cells swim a little with beating hairs, but not against a current). Green ones are producers, using light to make sugar; others eat bacteria, algae and dead matter; bacteria recycle what dies. The algae are what makes the water green when there are enough of them (see why ponds turn green). The scene is simplified: a real drop holds far fewer large organisms, and which species are present varies from pond to pond and season to season. The scene places its organisms in a box about 0.6 mm wide and 0.33 mm tall; a water flea, at about 2.5 mm, would be more than four times as long as the box is wide.',
    expert='Typical sizes: Chlamydomonas about 10 µm (cells 10 to 22 µm long); Volvox carteri colonies 100 to 500 µm with about 2,000 to 4,000 body cells; diatom cells 2 to 2,000 µm, most 20 to 200 µm; Paramecium 60 to 300 µm; rotifers mostly 100 to 500 µm; bacteria 0.5 to 5 µm. The scene draws each at one size within its range and uses far fewer individuals than a real drop has.',
    facts=[('Scale bar', '100 µm = 0.1 mm'), ('Smallest', 'bacteria, typically 0.5 to 5 µm'), ('Largest in the scene', 'a Volvox colony and a rotifer, ≈ 250 µm'), ('Field of the scene', 'organisms placed in a box ≈ 0.6 mm wide and 0.33 mm tall'), ('Not in the scene', 'a water flea (≈ 2.5 mm) is more than four box-widths long')])
fix('pond_chlamydomonas',
    basics='Chlamydomonas is a single green cell, about a hundredth of a millimetre across. It swims with two whiplike flagella at the front. Inside is a cup-shaped green chloroplast, where light is turned to sugar, and a red-orange eyespot that helps the cell find the light. The genus lives in still water and damp soil. The green pigment that catches the light is chlorophyll a; press the button to see the molecule.',
    expert='C. reinhardtii, the species studied most in laboratories, is typically 10 to 22 µm long and 8 to 22 µm wide. The cell is drawn as a 10 × 12 µm ellipsoid.')
fix('pond_diatom',
    deeper='Each diatom cell is enclosed in a hard, porous wall of silica (hydrated silicon dioxide) called a frustule. Diatoms with radial symmetry are called centric, and those with bilateral symmetry are pennate. When a diatom divides each daughter gets one half of the frustule and makes a new, smaller half, so the average size of a population slowly falls until sexual reproduction restores it. Diatoms in the sea and in lakes together fix about 20 % of the carbon that photosynthesis fixes on Earth each year, and up to about 40 % of marine primary production; the diatoms of one pond are a tiny part of that. Because oxygen is released in step with the carbon fixed, they release about a fifth of the oxygen that photosynthesis puts out each year, which is a share of a yearly flow and not of the oxygen in the air.',
    expert='Cells are 2 to 2,000 µm, mostly about 20 to 200 µm; about 12,000 species have been described. The scene draws a boat-shaped cell 70 µm long and a round one 40 µm across.',
    facts=[('Size', '2 to 2,000 µm; most 20 to 200 µm'), ('Shell', 'silica (hydrated silicon dioxide), the frustule'), ('Shapes', 'centric (round) and pennate (boat-shaped)'), ('Share of global primary production', 'about 20 % (carbon fixed by photosynthesis on Earth each year)'), ('Share of marine primary production', 'up to about 40 %')],
    cert='C1', openq=[], ext=[W_DIAT, NATC, EOS])
fix('pond_rotifer', refs=[R_ROT])
fix('pond_bacteria', expert='Cells in the scene are drawn 1.4 × 3.2 µm, which is within the range, and only about 130 are shown; a real drop holds many more.', deeper='Bacterial cells are typically 0.5 to 5 µm in length. Bacteria take part in many stages of nutrient cycles, including fixing nitrogen from the air, and are responsible for much of the breakdown of dead matter.')

sub('pond_duckweed', 'basics', 'the fronds and roots are true size', 'the fronds and roots are drawn at typical size')
# ---------------------------------------------------------------- wording clean-ups
sub('pond_green_water', 'expert', "The article for cyanobacterial blooms notes that blooms 'can look like foam, scum or mats or like paint floating on the surface of the water, but they are not always visible'.", 'Blooms can look like foam, scum, mats or floating paint, but they are not always visible.')
sub('pond_green_water', 'expert', ' The model shows a clear pond; this card is about what could happen to it.', ' The model shows a clear pond; this is what could happen to a real one.')
sub('pond_stratification', 'deeper', 'For ponds in general the Pond article says they stratify like lakes if deep enough or protected from the wind, and in winter under ice the layering reverses.', 'Ponds stratify like lakes if they are deep enough or protected from the wind, and in winter under ice the layering reverses.')
sub('pond_snail', 'deeper', 'In aquaria it is fed on vegetables, leaves, algae and the eggs of other snails; this card does not describe its diet in a wild pond.', 'In aquaria it is fed on vegetables, leaves, algae and the eggs of other snails.')
sub('pond_larva_mask', 'expert', 'How far and how fast the mask strikes is not given in the sources used; the model draws it folded and does not animate it.', 'The model draws the mask folded and does not animate the strike.')
sub('pond_food_web', 'basics', 'Duckweed and hornwort are also food-makers, but this card draws no animal eating them because none of the sources used says so.', 'Duckweed and hornwort also make food, but no animal is drawn eating them because no feeding link to them is established for this pond.')
sub('pond_food_web', 'deeper', 'what it eats in a pond is not settled by the sources used, so it appears with its aquarium food only.', 'its diet in a wild pond is not drawn, only its aquarium food.')
sub('pond_water', 'expert', ' how quickly depends on the water\'s clarity and is not given for this model.', ' how quickly depends on the water\'s clarity, and the model does not simulate it.') if False else None

# ---------------------------------------------------------------- reader-facing text: strip inline source tags
TAG = re.compile(r'\s*\((?:Wikipedia|WR)[^()]*\)')
def clean(s):
    s2 = TAG.sub('', s)
    return s2
def walk(o):
    if isinstance(o, str): return clean(o)
    if isinstance(o, list): return [walk(x) for x in o]
    if isinstance(o, dict): return {k: walk(v) for k, v in o.items()}
    return o
for i, n in enumerate(NODES): NODES[i] = walk(n)
for k in list(FIGS): FIGS[k] = walk(FIGS[k])
