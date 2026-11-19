# Source of the meadow buttercup cards (data/nodes/park_flower.json) and their figures (data/viz/park_flower.json).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/flower_nodes.py
# Every sentence is written for this project. Facts come from the sources named in each card's `ext` list.
import json, os

W_RA = {'title': 'Ranunculus acris (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Ranunculus_acris'}
W_RAN = {'title': 'Ranunculus (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Ranunculus'}
W_BUT = {'title': 'Buttercup (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Buttercup'}
W_PRO = {'title': 'Protoanemonin (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Protoanemonin'}
KOOI = {'title': 'van der Kooi, Elzenga, Dijksterhuis and Stavenga (2017), Functional optics of glossy buttercup flowers, J. R. Soc. Interface 14: 20160933', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5332578'}
KOOI_PR = {'title': 'University of Groningen news item on the buttercup gloss study (2017)', 'url': 'https://rug.nl/sciencelinx/nieuws/2017/02/20170222_buttercup?lang=en'}
FERNS = {'title': 'Plants For A Future database record, Ranunculus acris (pollinators, toxicity)', 'url': 'https://temperate.theferns.info/plant/Ranunculus+acris'}
GOBOT = {'title': 'Go Botany (Native Plant Trust): Ranunculus acris', 'url': 'https://gobotany.nativeplanttrust.org/species/ranunculus/acris/'}
BURREN = {'title': 'Flora of the Burren (Naturalis): Ranunculus acris description', 'url': 'https://flora-burren.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=38374'}
BBFLORA = {'title': 'Britton and Brown 1913: An Illustrated Flora, Ranunculus (key and genus description)', 'url': 'https://mail.chestofbooks.com/flora-plants/flowers/Illustrated-Flora-2/20-Ranunculus-Tourn-L-Sp-Pl-548-1753.html'}
ILLWF = {'title': 'Illinois Wildflowers: tall buttercup (achene size, visitors, rewards)', 'url': 'https://m.illinoiswildflowers.info/weeds/plants/tall_buttercup.html'}
KOOI_AB = {'title': 'van der Kooi et al. 2017: abstract (Europe PMC record 28228540)', 'url': 'https://europepmc.org/article/MED/28228540'}
EUREKA = {'title': 'News release on the buttercup optics paper (EurekAlert)', 'url': 'https://www.eurekalert.org/news-releases/494495'}
STANTON = {'title': 'Stanton and Galen 1989: Consequences of flower heliotropism for reproduction in an alpine buttercup, Ranunculus adoneus (Oecologia 78: 477-485)', 'url': 'https://doi.org/10.1007/bf00378737'}
GALEN = {'title': 'Galen 2006: Solar furnaces or swamp coolers: costs and benefits of water use by solar-tracking flowers of the alpine snow buttercup (Oecologia 148: 195-201)', 'url': 'https://doi.org/10.1007/s00442-006-0362-y'}
MASSEY = {'title': 'Massey University poisonous plants: meadow buttercup', 'url': 'https://poisonousplants.massey.ac.nz/data/com_meado_bcup/c_m_bcup.html'}
RANRANUN = {'title': 'Ranunculin, protoanemonin and anemonin: pharmacological and chemical perspectives (2025 review; beta-glucosidase step)', 'url': 'https://doi.org/10.2174/0109298673294080240221115830'}
BREW = {'title': 'Brewbaker 1967: The distribution and phylogenetic significance of binucleate and trinucleate pollen grains in the angiosperms (Am. J. Bot. 54: 1069-1083; abstract)', 'url': 'https://scilit.com/publications/8ef82afbe521922eb37ce4cccba1ec72'}
NICOLS = {'title': 'Nicolson 2022: Sweet solutions: nectar chemistry and quality (Phil. Trans. R. Soc. B 377)', 'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9058545'}
CORNELL = {'title': 'Cornell pollen grains blog: meadow buttercup pollen', 'url': 'https://blogs.cornell.edu/pollengrains/tag/ranunculus'}
PALDAT = {'title': 'PalDat: Ranunculus acris pollen (aperture number, cell number at dispersal)', 'url': 'https://www.paldat.org/pub/Ranunculus_acris/111055'}
W_CAR = {'title': 'Carotenoid (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Carotenoid'}

R = lambda sec, slug: ['BIO', sec, slug]
R301 = R('30.1', '30-1-the-plant-body'); R302 = R('30.2', '30-2-stems'); R303 = R('30.3', '30-3-roots'); R304 = R('30.4', '30-4-leaves'); R305 = R('30.5', '30-5-transport-of-water-and-solutes-in-plants')
R321 = R('32.1', '32-1-reproductive-development-and-structure'); R322 = R('32.2', '32-2-pollination-and-fertilization'); R263 = R('26.3', '26-3-angiosperms'); R43 = R('4.3', '4-3-eukaryotic-cells'); R81 = R('8.1', '8-1-overview-of-photosynthesis'); R32 = R('3.2', '3-2-carbohydrates')

NODES = []
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, where=None, area='bio_plants'):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': area, 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
         'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if dyk: n['did_you_know'] = dyk
    if where: n['where'] = where
    NODES.append(n)

# ---------------------------------------------------------------- the plant
N('rn_acris', 'Meadow buttercup', 'organism', .6, ['bio_seed_plants'],
  "The meadow buttercup (Ranunculus acris) is a perennial flowering plant of damp grassland, with deeply divided leaves, branching hairy stems and glossy yellow flowers about 2 cm across.",
  "A buttercup is a whole plant, not just the flower you see. Fibrous roots below the ground drink; a rosette of deeply cut leaves at the base and smaller ones up the stem make sugar from light; the branching stem lifts the flowers up where insects find them. Each flower has five yellow petals that shine like polished metal. After the petals drop, each flower leaves a little head of dry, one-seeded fruits. Use the layer buttons for one flower, a flower cut in half, the fruit, and the roots.",
  "It is a flowering plant (an angiosperm) in the buttercup family, and a perennial: it lives for years, with a short thick underground stem base (rhizome) from which new shoots and daughter plants can grow. A single plant carries flowers at different stages at the same time, from buds to open flowers to ripe fruit. The fresh plant holds a chemical that turns into a blistering irritant when the plant is chewed or crushed, which is why grazing animals leave fresh buttercups alone if they can.",
  "Ranunculus acris is placed in the order Ranunculales, among the early-branching eudicots. The flower is built to a simple, old plan: parts free from each other and arranged in a spiral on a dome. The plant here is a procedural reconstruction, not a scan of a plant: its height and flower width follow floras, and the numbers of stamens, carpels and leaf lobes are model choices.",
  [['Height', '≈ 30–100 cm (model plant 60 cm)'], ['Flower width', '≈ 15–25 mm (model 22 mm)'], ['Life form', 'herbaceous perennial'], ['Flowering stems', 'branched, hairy']],
  refs=[R263, R301], ext=[W_RA, GOBOT, BURREN, W_RAN],
  parts=['rn_roots', 'rn_stock', 'rn_basal_leaf', 'rn_stem_leaf', 'rn_stem', 'rn_hairs', 'rn_flower', 'rn_bud', 'rn_fruit', 'rn_gloss', 'rn_poison', 'rn_pollination', 'rn_fruit_development'])

N('rn_stem', 'Stem, branches and flower stalks', 'structure', .6, ['rn_acris', 'bio_plant_body_tissues'],
  "The upright, ungrooved, hairy stem branches in its upper half; each branch ends in a flower on a slender stalk (a pedicel).",
  "The stem holds the leaves in the light and lifts the flowers where insects can see them. It branches again and again near the top, and every branch ends in a flower. A plant carries flowers at different stages at once. In this model the flower at the very top of the main stem is the oldest and has already set fruit, with newer flowers open on the side branches and the youngest still in bud.",
  "Inside, a ring of vascular bundles carries water up (xylem) and sugar around (phloem). The stem is described as ungrooved (Wikipedia). The hairs on the stem in the model are drawn for show.",
  "The flowering shoot is a branching cluster of flowers (a cyme-like inflorescence): each branch ends in a flower and can fork again. The model branching is generated by a rule (spiral arrangement, branches shorter toward the top), not measured on one plant, and the order of ripening in the model is a modelling choice. The pedicel is the part of the stem under one flower, and its tip swells into the receptacle that carries the flower parts.",
  [['Stem surface', 'ungrooved, hairy'], ['Model height', '60 cm (real plants 30–100 cm)'], ['Flowers per model plant', '4 open, 2 in bud, 2 fruiting heads']],
  refs=[R302], ext=[W_RA, GOBOT], parts=['rn_hairs', 'rn_flower'], cert='C2')

N('rn_hairs', 'Hairs on the stem and leaves', 'structure', 2e-3, ['rn_stem'],
  "Hairs (trichomes) are single cells or short chains of cells that stand out from the surface of a leaf or stem.",
  "The buttercup is hairy. Hairs are tiny outgrowths of the skin of the plant. In many plants hairs make the surface harder to chew or crawl on; what the buttercup's hairs do is not established.",
  "A hair grows from one cell of the outer skin (the epidermis). Some plants have hairs that secrete chemicals or sting. The ones drawn on the stem are schematic: their number and length are chosen for the picture.",
  "Trichomes are an epidermal specialisation, and they can be unicellular or multicellular, glandular or not. Floras describe the plant as hairy; the hairs in the model are illustrative, with no measured length or density.",
  [['Hairs on the plant', 'present on stems and leaves (floras)'], ['Hair size in the model', 'illustrative']], cert='C2', refs=[R304], ext=[W_RA, GOBOT], parts=['bio_plant_body_tissues'])

N('rn_basal_leaf', 'Basal leaf and leaf stalk', 'structure', .06, ['rn_acris', 'bio_leaf_structure_gas_exchange'],
  "The leaves at the base of the plant have long stalks and blades cut deeply into toothed, hairy lobes or segments.",
  "The leaves are the plant's sugar factories. The buttercup's are not smooth ovals: each blade is divided almost to its base into several lobes, and each lobe is cut again, so the outline looks like a hand with many fingers. They are hairy. The long stalk (the petiole) holds the blade out into the light. The leaves higher on the stem are smaller. Click the leaf, then Look at the leaf surface.",
  "Like other leaves, the blade is thin, and it has pores called stomata that let carbon dioxide in and water vapour out. Inside, the layers are like those of other broad leaves: an upper skin, palisade cells packed with chloroplasts, loose spongy cells with air spaces, and a lower skin.",
  "Photosynthesis in the leaf follows the same chemistry as in any C3 plant: chlorophyll in the chloroplasts captures light and the Calvin cycle turns carbon dioxide into sugar. The leaf outline in the model is a procedural palmate shape with 5 primary lobes that are each cut into 3; real blades vary a lot, in lobe number and depth, between plants and from season to season, and floras differ on whether to call the blade lobed or compound.",
  [['Basal leaf blade', 'deeply divided, toothed, hairy (floras)'], ['Model blade width', '≈ 7–11 cm (chosen)']],
  refs=[R304, R81], ext=[W_RA, GOBOT], parts=['rn_leaf_epidermis', 'rn_stoma', 'bio_leaf_structure_gas_exchange', 'bio_chloroplasts_plastids'], cert='C2')

N('rn_stem_leaf', 'Stem leaf', 'structure', .03, ['rn_acris', 'rn_basal_leaf'],
  "Leaves on the flowering stem are smaller and simpler than the basal ones. A small one sits under each branch.",
  "As you go up the stem, the leaves get smaller and simpler, until near the flowers they are only a few narrow strips. A small one sits under each branch in the model.",
  "The change in leaf shape up the stem is normal in many plants. Stem leaves make sugar by photosynthesis like the basal ones, nearer to the flowers.",
  "Stem leaves are drawn here with 3 or 5 main segments and sizes that shrink with height; the numbers are model choices.",
  [['Stem leaves in the model', 'smaller and simpler than the basal leaves']], cert='C2', refs=[R304], ext=[W_RA])

# ---------------------------------------------------------------- the flower
N('rn_flower', 'The buttercup flower', 'structure', .022, ['rn_acris', 'bio_plant_reproduction'],
  "A buttercup flower has five green sepals, five glossy yellow petals, many stamens that make pollen, and many separate carpels that each hold one ovule, all on a domed receptacle.",
  "A flower is the plant's reproductive organ. From outside in: five small green sepals that protected the bud; five big yellow petals that advertise to insects; a ring and spiral of many stamens that make pollen (the male parts); and, in the middle, many small green carpels that each hold a single ovule (the female parts). Everything is attached to the receptacle, a little dome at the top of the flower stalk. Use One flower to look at it and Cut in half to see inside.",
  "The parts are separate from each other and spiral round the dome: stamens low on the dome, carpels at the top. This is an old, simple flower plan, quite different from tulips or foxgloves, whose parts are joined. At the base of every petal is a nectary that makes nectar, a sugar solution that rewards visiting insects. When a pollen grain lands on the stigma of a carpel and grows a tube to the ovule, that carpel can turn into a fruit.",
  "Floras give 5 sepals and 5 petals, numerous free stamens, and a flower 15 to 25 mm across; the number of stamens and of carpels is not fixed, and the model flower draws 50 stamens and 25 carpels as a modelling choice. The flower is hermaphrodite and radially symmetric. The ABC model of flower development explains how gene activity in rings of the young flower decides which organ forms where.",
  [['Sepals', '5, green, spreading'], ['Petals', '5, glossy yellow'], ['Stamens', 'numerous, free (model draws 50)'], ['Carpels', 'many, separate (model draws 25)'], ['Width', '≈ 15–25 mm']],
  refs=[R321, R322], ext=[W_RA, GOBOT, BURREN, W_RAN],
  parts=['rn_sepal', 'rn_petal', 'rn_nectary', 'rn_stamen', 'rn_carpel', 'rn_receptacle', 'rn_pollination', 'bio_plant_development_flower'])

N('rn_sepal', 'Sepals', 'structure', .0065, ['rn_flower'],
  "The five sepals are small, green, hairy leaf-like parts that covered the bud and spread out beneath the open petals; they turn yellow as the flower ages.",
  "Before the flower opens, the sepals wrap the bud like a green coat. In the open flower they are the small green parts just below the petals, spreading outward. As the flower ages they turn yellowish.",
  "Sepals are modified leaves. They are the outermost ring of the flower and are shed or wither when the fruit forms. Together they are called the calyx.",
  "In some buttercups the sepals bend backward (reflexed), which helps tell species apart; in the meadow buttercup floras describe them as spreading, not reflexed. The model draws them held up against the petals, which is a simplification. Their size in the model (6.5 mm) is a chosen value that makes the flower about 22 mm wide.",
  [['Number', '5, alternating with the petals'], ['Position', 'spreading (floras); drawn upright in the model']], cert='C2', refs=[R321], ext=[W_RA, GOBOT, BURREN])

N('rn_petal', 'Petal', 'structure', .0116, ['rn_flower', 'rn_gloss'],
  "Each of the five petals is a thin, rounded, bright yellow sheet with a mirror-smooth upper surface; at its base is a nectary.",
  "The petals are the flower's advertisement. They are yellow because of a pigment, and they shine because the upper surface is smooth and flat. A petal is a thin sheet, about a fifth of a millimetre thick in the model. At the base of each one, on the inside, is a small gland that makes nectar. Click a petal, then Look inside the petal to see its layers.",
  "A petal is a modified leaf. In the model it has four layers: a very thin, flat, pigment-filled upper skin; a thin air gap; a layer of cells packed with starch that scatters light; and a spongy middle and lower skin. The top skin works like a mirror for part of the light, the lower layers scatter the rest back up through the yellow pigment. That combination makes the flower look both shiny and yellow.",
  "The layer order follows the optical study of van der Kooi and colleagues (2017). The layer thicknesses in the model, adding to about 0.18 mm, are model values, not measurements of a petal. The shape (obovate, cupped) and size (≈ 11.6 mm) are drawn by eye to match the width of the open flower.",
  [['Thickness (model)', '≈ 0.18 mm'], ['Colour', 'yellow, from a carotenoid pigment'], ['Surface', 'upper side very flat and glossy; under side matte']],
  refs=[R321], ext=[KOOI_AB, W_RA], parts=['rn_gloss', 'rn_petal_epidermis', 'rn_starch_layer', 'rn_nectary', 'rn_carotenoid'])

N('rn_nectary', 'Nectary', 'structure', .001, ['rn_petal', 'rn_nectar'],
  "At the base of each petal is a small gland (the nectary) that makes nectar; in buttercups it is bare or partly covered by a small scale.",
  "This is the flower's sweet shop. A tiny gland at the base of each petal makes a droplet of nectar, a sugar solution, which insects drink. In many buttercups a little flap, a scale, partly covers it. There are five, one per petal.",
  "Nectar is made by special gland cells and rewards pollen delivery: an insect that comes for the nectar brushes against the stamens and carpels and carries pollen away. In the Ranunculus genus there is usually one nectary at the base of each petal, bare or covered by a scale.",
  "Floras and Wikipedia describe the nectary of Ranunculus as at the base of each petal and either bare or covered by a scale. The model draws a covered pit with a small flap about 1 mm across: a modelled form and a chosen size.",
  [['Number', 'one per petal (5)'], ['Form in the genus', 'a gland, bare or partly covered by a scale'], ['Product', 'nectar (see its card)']],
  cert='C2', refs=[R322], ext=[W_RAN, BBFLORA, BURREN], parts=['rn_nectar'])

N('rn_stamen', 'Stamens', 'structure', .006, ['rn_flower'],
  "The stamens are the male parts: each is a thin stalk (the filament) with an anther on top that holds the pollen. A buttercup has many, in a spiral.",
  "Around the middle of the flower are dozens of thin stalks with yellow tips. Each tip is an anther, a little case of pollen. They are arranged in a spiral on the dome of the receptacle, with the carpels in the middle. Together all the stamens are called the androecium.",
  "Insects pick up the pollen on their bodies as they walk over the flower. Floras describe the stamens as numerous, indefinite in number and free from each other.",
  "The model flower has 50 stamens, a chosen number. Their arrangement in the model follows the golden angle (about 137.5 degrees from one to the next), a standard way of drawing a spiral; a real flower's spiral is set by its own growth, and the model does not claim it is the same.",
  [['Count', 'numerous, free (model draws 50)'], ['Arrangement', 'spiral on the receptacle, below the carpels']],
  cert='C2', refs=[R321], ext=[BURREN, W_RAN], parts=['rn_filament', 'rn_anther'])

N('rn_filament', 'Filament', 'structure', .004, ['rn_stamen'],
  "The filament is the thin stalk of a stamen. It holds the anther up where visiting insects will brush against it.",
  "A filament is a very thin thread of cells. It is just a support: the pollen is made in the anther at its tip. Fresh buttercup filaments are pale yellow.",
  "In flowers generally, a filament carries a vascular strand to the anther. In the model, the filament is a tapering thread of about 3.5 to 4.6 mm, a chosen length that keeps the stamens shorter than the petals.",
  "The model length is a chosen, plausible value, not a measured one.",
  [['Role', 'holds the anther'], ['Model length', '≈ 3.4–4.6 mm (chosen)']], cert='C2', refs=[R321], ext=[W_RAN])

N('rn_anther', 'Anther', 'structure', .0019, ['rn_stamen'],
  "The anther is the pollen case at the tip of a stamen. It has four pollen sacs, each full of pollen grains, and splits open to release them.",
  "An anther looks like a small orange-yellow sausage. Inside it are four long chambers called pollen sacs. Each one makes a great many pollen grains. When the anther is ripe the wall dries and splits, and the yellow powder is free. Click an anther, then Look inside the anther for a cut-open view.",
  "The anther wall has several layers. The inner one, the tapetum, feeds the developing pollen and then breaks down. A layer under the skin, the endothecium, has thick-walled cells that dry and pull the wall open, like a spring. Pollen starts as cells that divide by meiosis (see the card on meiosis), so each grain is a new, genetically unique male gametophyte.",
  "In the model the anther is about 1.9 mm long and 0.5 mm wide: sizes chosen to fit the flower, not measured. Pollen sac size in the cross-section scene is illustrative. What is measured for the grain is its size, about 27 by 26 µm, and it has about six furrows (a pollen database gives six, varying up to twelve).",
  [['Pollen sacs', '4 per anther (typical flowering plant)'], ['Opening', 'wall splits (dehiscence)'], ['Pollen colour', 'yellow']],
  cert='C2', refs=[R321, R322], ext=[W_RAN, PALDAT, CORNELL], parts=['rn_pollen_sac', 'rn_pollen_grain', 'rn_anther_wall', 'bio_meiosis_variation'])

N('rn_pollen_sac', 'Pollen sac', 'structure', 3e-4, ['rn_anther'],
  "A pollen sac (microsporangium) is one of the four chambers of an anther. It is where pollen grains form.",
  "Each chamber of the anther is packed with developing pollen. In the cut-open view the four chambers are the yellow-filled spaces and the pollen grains inside them are the small round balls.",
  "Each chamber starts with cells that divide by meiosis to make four spores, and each spore grows a tough wall and becomes a pollen grain. A nourishing layer (the tapetum) around the sac feeds them.",
  "The grains drawn in the cut-open view are a small sample of the many a real sac holds.",
  [['Number per anther', '4 (typical)'], ['Contents', 'developing pollen grains']], cert='C1', refs=[R322], ext=[W_RAN], parts=['rn_pollen_grain'])

N('rn_anther_wall', 'Anther wall', 'tissue', 3e-5, ['rn_anther'],
  "The anther wall is a few layers of cells that protect the pollen, feed it while it forms, and then dry and split to let it out.",
  "The outer skin protects, and the layer under it (endothecium) has cells with ring-like thickenings. When the anther dries, these cells shrink unevenly and pull the wall open along a line, and the pollen spills out.",
  "Inside is the tapetum, a nursing layer that gives the grains nutrients and the material for their wall, and then dies on schedule.",
  "These layers are standard for flowering plants. The model draws the whole wall as one translucent shell; its thickness in the picture is illustrative.",
  [['Layers', 'epidermis, endothecium, middle layers, tapetum']], cert='C1', refs=[R322], ext=[W_RAN])

N('rn_pollen_grain', 'Pollen grain', 'cell', 2.7e-5, ['rn_pollen_sac', 'bio_plant_reproduction'],
  "A pollen grain is a tiny capsule, about 27 micrometres across in the meadow buttercup, that carries the plant's male cells.",
  "A pollen grain is not a seed or a cell of the plant's body: it is a tiny, tough-walled, separate living thing (a male gametophyte) that makes the plant's sperm cells. Its wall is sculpted and made of a very tough material called sporopollenin, which is why pollen survives in mud for thousands of years. If it lands on the stigma of a buttercup flower, it can grow a thin tube down to the ovule.",
  "Grains of the meadow buttercup are about 27 by 26 micrometres, roughly spherical, with six long furrows (colpi) in the wall (a database says the number varies from 6 to 12) through which the tube can emerge. When shed, this grain is listed as two-celled: a tube cell and a generative cell. The generative cell divides to make the two sperm cells, which in a two-celled grain happens later, in the growing pollen tube. The sperm cells of flowering plants have no tail: the pollen tube carries them to the egg.",
  "The grain is the male gametophyte generation of the life cycle (alternation of generations), made small enough to be carried by insects. In flowering plants in general about 70 percent of the species studied shed two-celled pollen, the rest three-celled, with two sperm already formed (Brewbaker 1967); for R. acris the database entry gives two cells. The size (27.4 ± 0.7 by 25.7 ± 0.7 µm) is from one pollen reference collection; sizes depend on how the grains were prepared.",
  [['Size', '≈ 27 × 26 µm'], ['Shape', 'roughly spherical, furrowed'], ['Furrows', '6 (varies 6–12 in the database)'], ['Cells when shed', '2 (tube cell and generative cell); the sperm form later']],
  cert='C2', refs=[R322], ext=[CORNELL, PALDAT, BREW], parts=['sperm', 'bio_fertilization', 'bio_meiosis_variation'],
  dyk="Sporopollenin is so tough that grains can survive in sediments for millions of years, which is how scientists read the plant history of a lake from its mud.")

N('rn_carpel', 'Carpels', 'structure', .0019, ['rn_flower'],
  "Each carpel is a separate small female unit: an ovary containing one ovule, a short style, and a stigma that catches pollen. A buttercup has many on its dome.",
  "At the very centre of the flower is a green knob made of many tiny carpels. Each carpel is like a small flask: at the bottom the ovary holds one ovule (which could become a seed), and on top a short style leads up to the stigma, a sticky tip that catches pollen. Each carpel can ripen into its own fruit. Click one and then Look inside the carpel.",
  "The carpels are not joined together, which is old-fashioned among flowering plants: tulips and many other flowers have them fused into one ovary. In the buttercup they stay separate, so one flower makes a head of separate small fruits. Each has just one ovule.",
  "The number of carpels per flower varies; the model uses 25, a chosen number. The ovary is drawn about 1.5 mm tall; fruits (achenes) are 2 to 3 mm. The inside of the carpel in the cut-open view (cavity, ovule, embryo sac) is drawn from the typical flowering plant plan with an illustrative size.",
  [['Count', 'many, separate (model draws 25)'], ['Ovules per carpel', '1'], ['Arrangement', 'spiral on a domed receptacle; separate, not joined']],
  cert='C2', refs=[R321, R322], ext=[W_RAN, ILLWF], parts=['rn_ovule', 'rn_style_stigma', 'rn_embryo_sac', 'rn_fruit_development'])

N('rn_style_stigma', 'Style and stigma', 'structure', 5e-4, ['rn_carpel'],
  "The stigma is the tip of the carpel where pollen lands and sticks; the style is the short stalk under it.",
  "The stigma is the landing pad for pollen. If a grain of buttercup pollen sticks there, it grows a thin tube that creeps down through the style to the ovule. In the model the tip of each style is slightly curved.",
  "Stigmas are often sticky or feathery so that pollen stays on them. Many plants also have chemical checks to accept pollen of the right species and reject the wrong one.",
  "Style length in the model (< 1 mm) is a chosen size.",
  [['Job', 'catch pollen, guide the pollen tube']], cert='C2', refs=[R322], ext=[W_RAN], parts=['bio_fertilization'])

N('rn_ovule', 'Ovule', 'structure', 5e-4, ['rn_carpel', 'bio_fertilization'],
  "The ovule is the small structure inside the ovary that becomes the seed once it is fertilised. Each buttercup carpel holds one.",
  "The ovule is wrapped in its own coats and sits at the bottom of the ovary. Deep inside it is the embryo sac, which contains the egg cell. When the pollen tube arrives and fertilisation happens, the ovule becomes a seed and the wall of the ovary dries to form the fruit around it.",
  "One ovule per carpel is why buttercup fruits are small, dry, one-seeded nuts. The ovule has one or two coats (integuments) with a tiny opening at one end, the micropyle, where the pollen tube enters.",
  "The ovule drawn in the cut-open carpel is of the usual flowering-plant plan, with an illustrative size of about half a millimetre.",
  [['Ovules per carpel', '1'], ['Becomes', 'the seed']], cert='C2', refs=[R322], ext=[W_RAN], parts=['rn_embryo_sac', 'bio_fertilization', 'bio_plant_embryogenesis_note', 'egg_cell'])

N('rn_embryo_sac', 'Embryo sac', 'cell', 1.5e-4, ['rn_ovule'],
  "The embryo sac is the female gametophyte inside the ovule. In the typical flowering plant it has seven cells and eight nuclei, one of which is the egg cell.",
  "Inside the ovule is a tiny sac that is the plant's female generation. In the most common pattern it holds an egg cell with two helper cells next to it at the end where the pollen tube arrives, a big central cell with two nuclei, and three cells at the far end. When fertilisation happens, one sperm cell joins the egg and the other joins the central cell: double fertilisation.",
  "The egg joins one sperm to make the embryo (the baby plant). The central cell joins the other sperm to make the food store of the seed, the endosperm. This double event is characteristic of flowering plants. The human equivalent of the egg is the egg cell, but the plant egg sits in a tiny multicellular body that grows from a spore.",
  "This card describes the pattern typical for flowering plants (the Polygonum type, the most common), which is what the picture draws. The buttercup family is known to include variants of the embryo sac, so a given species may differ in detail. The cell sizes in the scene are illustrative.",
  [['Cells', '7 (typical)'], ['Nuclei', '8 (typical)'], ['Fertilisation', 'double: egg + sperm, and central cell + sperm']],
  cert='C2', refs=[R322], ext=[W_RAN], parts=['bio_fertilization', 'egg_cell', 'sperm', 'bio_plant_embryogenesis_note'])

N('rn_receptacle', 'Receptacle', 'structure', .004, ['rn_flower'],
  "The receptacle is the little dome at the top of the flower stalk to which all the flower parts are attached.",
  "The receptacle is the base of the flower, like the plinth of a statue. Sepals, petals and stamens are fixed round its lower part, and the carpels sit over its dome. After the flower has been fertilised, the fruits sit on it.",
  "Botanically it is the swollen tip of the flower stalk. Its dome shape is why buttercups are a favourite for showing a flower with many separate parts in a spiral.",
  "The dome in the model has a radius of about 2.1 mm, a chosen size. The fruiting head in the model has a taller receptacle than the flower; the amount of lengthening is a modelling choice.",
  [['Shape', 'dome, lengthening in fruit (model)']], cert='C2', refs=[R321], ext=[W_RAN], parts=['rn_carpel', 'rn_stamen'])

N('rn_bud', 'Flower bud', 'structure', .01, ['rn_stem', 'rn_flower'],
  "A bud is a flower not yet open, with its petals folded inside the green sepals.",
  "Before a flower opens it is a little green ball on its stalk. Inside, the petals and the stamens are folded up. The flower opens when the weather and the age of the bud are right.",
  "The flower buds are described as beginning to develop in late summer of the year before flowering (Wikipedia, Ranunculus acris).",
  "The bud in the model is a plain oval with a pointed tip, standing for any closed bud; the hairs on the sepals are not drawn.",
  [['When formed', 'late summer of the year before flowering (Wikipedia)']], cert='C2', refs=[R321], ext=[W_RA])

# ---------------------------------------------------------------- fruit
N('rn_fruit', 'Fruiting head', 'structure', .01, ['rn_acris', 'rn_fruit_development'],
  'After the petals fall, the receptacle holds a round head of many small dry fruits (achenes), one from each fertilised carpel.',
  'When a flower has been pollinated and fertilised, the petals and stamens drop, and the many tiny carpels swell into hard little fruits packed together on the receptacle like beads on a ball. This is called a fruiting head. A buttercup plant carries such heads at the same time as open flowers.',
  'This is an "aggregate" of separate fruits that come from one flower with many carpels, as opposed to a single fruit like a pea pod. Each fruit, an achene, holds one seed.',
  'The model head has 24 achenes on an elongated receptacle; a real head has as many as the flower had fertilised carpels.',
  [['Fruits per head', '≈ as many as fertilised carpels (model 24)']], cert='C1', refs=[R321], ext=[W_RAN], parts=['rn_achene', 'rn_fruit_development'])

N('rn_achene', 'Achene', 'structure', .0028, ['rn_fruit'],
  "An achene is a small, dry, one-seeded fruit that does not split open. The meadow buttercup's are 2 to 3 mm long, flattened, and end in a short beak.",
  "Each fruit is hard, dry and about the size of a pinhead. The thin wall of the old ovary is the shell and a single seed is inside. It does not open: the seed is shed inside it. The short point at one end is the remains of the style.",
  "The model achenes are slightly flattened with a short beak. Floras give the length as 2 to 3 mm, hairless, with a short or hooked beak depending on the flora.",
  "The model draws a short beak; the descriptions disagree on whether the beak is short or hooked, which is part of how floras tell the species from look-alikes.",
  [['Length', '≈ 2–3 mm'], ['Seeds', '1']], cert='C2', refs=[R321], ext=[BURREN, ILLWF, BBFLORA])

N('rn_fruit_development', 'How a flower becomes a fruit', 'process', .02, ['rn_flower', 'bio_plant_reproduction'],
  'Pollen lands on a stigma, grows a tube to the ovule, fertilisation follows, and the ovule becomes a seed while the carpel wall becomes the fruit wall.',
  'A pollen grain sticks to a stigma. It grows a thin tube down through the style to the ovule. Two sperm cells reach the embryo sac: one fertilises the egg, which becomes the embryo, and the other helps make the seed\'s food store. The petals and stamens, no longer needed, drop. The ovule becomes a seed and the wall of the carpel dries into the hard fruit wall: the achene.',
  'In the buttercup every carpel has one ovule, so every carpel that is fertilised becomes one achene, and an unfertilised carpel can wither.',
  'In the flowering-plant life cycle the pollen grain and embryo sac are tiny gametophytes. Double fertilisation produces a diploid embryo and a triploid endosperm. The achene wall is the ovary wall (pericarp), which is dry at maturity and does not open.',
  [['Step 1', 'pollination: pollen lands on the stigma'], ['Step 2', 'pollen tube grows to the ovule'], ['Step 3', 'double fertilisation'], ['Step 4', 'ovule becomes the seed; ovary wall becomes the achene']],
  cert='C1', refs=[R322], ext=[W_RAN], parts=['bio_fertilization', 'bio_plant_embryogenesis_note', 'bio_plant_reproduction'])

N('rn_pollination', 'Who pollinates a buttercup', 'process', .02, ['rn_flower', 'bio_pollination_networks'],
  "Meadow buttercups are visited by many kinds of insects, mainly bees and flies, including honey bees, and less often by butterflies and beetles.",
  "A buttercup does not depend on a single partner. The open, bowl-shaped yellow flower is easy to land on, so bees and flies, and sometimes butterflies and beetles, visit it for nectar and pollen. Each visitor brushes against the anthers and stigmas and carries pollen with it.",
  "Flowers of this open type are called generalist flowers: many species can reach the nectar. Specialised flowers (long tubes, for example) limit the visitors. The shine of the petal has been proposed as a signal to insects, and the proposal has not been tested in the field.",
  "Visitors are listed from a wildflower guide (bees and flies including honey bees; butterflies and beetles less common) and a plant database. The card does not rank the pollinators.",
  [['Visitors', 'bees and flies mostly; butterflies and beetles less often'], ['Reward', 'nectar and pollen'], ['Flower type', 'open bowl, generalist']],
  cert='C2', refs=[R322], ext=[ILLWF, FERNS, KOOI_AB], parts=['park_bee', 'bio_entomology_insects', 'bio_pollination_networks', 'rn_nectar'])

N('rn_nectar', 'Nectar and sucrose', 'molecule', 1e-9, ['rn_nectary', 'bio_phloem_transport'],
  "Nectar is a sweet liquid whose main solute is usually sugar, often sucrose. The buttercup makes it at the base of its petals.",
  "Nectar is the flower's reward to visitors. It is mostly water with sugars dissolved in it. The sugar is made in the leaves by photosynthesis, sent down the plant in the phloem as sucrose (ordinary table sugar) and then released by the gland cells of the nectary. The molecule shown is sucrose: one glucose joined to one fructose.",
  "Sucrose is a disaccharide: a glucose and a fructose joined by a bond between their first and second carbons. Some nectars contain mostly sucrose and others mostly glucose and fructose, and sugar concentrations in floral nectar range from about 10 to 70 percent by weight.",
  "The sucrose molecule used in the viewer is the standard one from the project's molecule data. It stands for a typical nectar sugar, not for a measurement of buttercup nectar.",
  [['Main sugar in phloem', 'sucrose'], ['Floral nectar sugar content (all species)', '≈ 10 to 70 % w/w']],
  cert='C2', refs=[R305], ext=[W_RAN, NICOLS], parts=['bio_phloem_transport'], where='mol:sucrose')

# ---------------------------------------------------------------- the gloss and pigments
N('rn_gloss', 'Why buttercup petals shine', 'process', 1.8e-4, ['rn_petal'],
  "The upper surface of a buttercup petal is a very flat, smooth, pigment-filled layer of cells that works like a thin mirror film; the layers below scatter light back and give the yellow.",
  "A buttercup looks as if it has been varnished. The reason is not a coating of wax or oil. The skin on top of the petal is extremely flat and smooth, so it reflects some of the light like a little mirror, in one direction, and that is the shine. Under it, a layer of cells packed with starch scatters the rest of the light, which passes through the yellow pigment on its way out and comes out yellow. Click a petal, then Look inside the petal.",
  "A 2017 study measured petals of several glossy buttercup species, including the meadow buttercup. The top cell layer is a single, very flat, pigment-filled layer thin enough to act as an optical thin film, in the way an oil film on water does. Below it lie an air gap, a strongly scattering starch-filled layer, a spongy layer and a lower skin. The gloss is strongest where the mirror angle matches the light and your eye. The authors propose two likely uses of the gloss: a strong visual signal to insect pollinators, and reflecting extra sunlight toward the flower centre to warm the reproductive organs. Both are proposals, not demonstrated results.",
  "On flower warming: the sun-tracking and warming were measured in the alpine snow buttercup, Ranunculus adoneus, whose flowers follow the sun from early morning to mid-afternoon and reach temperatures several degrees above the air when facing it (Stanton and Galen 1989; Galen 2006). A press release for the optics paper says buttercups in general follow the sun and that the cup shape could focus light on the centre, and that the researchers were still measuring it; wind shelter by the petals could also explain warmer centres. Whether the meadow buttercup tracks the sun, or gains warmth this way, has not been shown here.",
  [['Top skin', 'one layer of very flat cells, pigment-filled, acts as a thin film'], ['Layers below', 'air gap, starch layer, spongy layer, lower skin'], ['Proposed uses of the gloss', 'signal to pollinators; warming the flower centre (both proposals)'], ['Sun-tracking shown in', 'Ranunculus adoneus (alpine snow buttercup)']],
  cert='C2', refs=[R321], ext=[KOOI_AB, EUREKA, STANTON, GALEN], parts=['rn_petal_epidermis', 'rn_starch_layer', 'rn_carotenoid', 'rn_petal_mesophyll'],
  openq=["Does the warmth from a dish-shaped, glossy flower help pollen or seeds mature, and does the gloss attract more pollinators? Both are proposals; in the meadow buttercup neither has been shown."],
  dyk="In an alpine buttercup, Ranunculus adoneus, the flowers follow the sun across the sky and the flower centre was found to be several degrees warmer than the air around it, which fits the idea that the dish-shaped petals gather sunlight.")

N('rn_petal_epidermis', 'Upper epidermis of the petal', 'tissue', 2.7e-6, ['rn_gloss'],
  "The top layer of the petal: a single layer of very flat cells, filled with yellow carotenoid pigment.",
  "This is the mirror. Its cells are flat and tightly fitted, and the surface is very smooth. It reflects a little of the light as a shine, and its yellow pigment filters the light that comes back up from the layers beneath, so the colour is a clear yellow.",
  "Because the layer is thin enough to act as a thin film, the light waves reflected from its top and bottom surfaces interfere, as in an oil film. The layer is both the source of the gloss and a colour filter for the light scattered from below (van der Kooi et al. 2017).",
  "The thickness drawn in the tissue scene is a model value, as is the cell width (25 µm).",
  [['Layers', 'one cell layer, very flat'], ['Pigment', 'carotenoid']],
  cert='C2', refs=[R321, R43], ext=[KOOI_AB], parts=['rn_carotenoid', 'rn_cellulose'])

N('rn_starch_layer', 'Starch layer of the petal', 'tissue', 3.8e-5, ['rn_gloss'],
  "Under the top skin is a layer whose cells hold starch grains. It scatters light strongly and sends it back through the pigment.",
  "Starch is a store of sugar that plants keep as tiny grains. Here the grains are not for food: they bounce the light around like a layer of white paint. That scattered light goes up through the yellow top skin and out, which makes the petal look a strong, bright yellow rather than dull.",
  "Scattering is strongest where there are many surfaces with different refractive indexes: starch grains, cell walls and air. The spongy tissue below scatters less.",
  "The layer thickness and the starch grain sizes drawn in the tissue scene are illustrative.",
  [['Role', 'strong light scatterer behind the yellow skin']],
  cert='C2', refs=[R321], ext=[KOOI_AB], parts=['rn_starch'])

N('rn_starch', 'Starch', 'molecule', 1e-9, ['rn_starch_layer', 'bio_polysaccharides'],
  "Starch is a polymer of glucose that plants store as grains. Its building block is alpha-glucose.",
  "Starch is chains of glucose joined end to end. Plants store it in grains inside cells, as a reserve of sugar. The molecule shown is the single glucose unit that the chains are built from.",
  "Starch is a mix of two kinds of chain: unbranched amylose and branched amylopectin. Here the unit shown is alpha-D-glucopyranose. Cellulose, in cell walls, is also a glucose polymer, but with the units joined in the beta form.",
  "In the petal, the starch layer works as a light scatterer, not just a food store.",
  [['Unit', 'alpha-D-glucose'], ['Kinds of chain', 'amylose (unbranched), amylopectin (branched)']], cert='C1', refs=[R32], ext=[KOOI_AB], where='mol:glucose_alpha')

N('rn_petal_mesophyll', 'Petal mesophyll', 'tissue', 1e-4, ['rn_gloss'],
  "The spongy middle of the petal, made of loosely packed cells with air gaps between them.",
  "The middle of the petal is a soft layer of rounded cells with air between them. The air gaps scatter some of the light.",
  "Because water and cell contents have refractive indexes close to each other, while air is very different, the air gaps are what scatter light here.",
  "The mesophyll cells in the scene are drawn illustratively (sizes not measured).",
  [['Role', 'scatters some light']], cert='C2', refs=[R321], ext=[KOOI_AB])

N('rn_carotenoid', 'The yellow pigment: a carotenoid', 'molecule', 3e-9, ['rn_petal_epidermis', 'bio_plant_secondary_metabolites'],
  "The yellow of the petal comes from carotenoid pigments in its top skin. The molecule shown is beta-carotene, a typical carotenoid; the buttercup's own carotenoids are not all beta-carotene.",
  "Carotenoids are long, chain-like molecules that absorb blue and violet light and let yellow, orange and red light through, so things that contain them look yellow to red. They are what colour carrots, egg yolks and many flowers. In the buttercup the pigment sits in the flat top skin of the petal. The molecule shown is beta-carotene, the best known carotenoid.",
  "Carotenoids generally absorb light from about 400 to 550 nm. The optical study found that the pigment in the buttercup top skin filters the light that comes up from below. Which carotenoids exactly the petals contain is not named here, so beta-carotene is shown as an example of the class.",
  "The chain of alternating single and double bonds in the carotenoid (conjugated polyene) is what absorbs blue light. In animals beta-carotene is split to make vitamin A, from which retinal is made in the eye (the card for retinal exists in the viewer). Carotenoids are fat-soluble, so in plants they sit in plastids called chromoplasts and in oily droplets and membranes, not dissolved in the watery cell sap.",
  [['Absorbs', 'blue and violet light, about 400–550 nm'], ['Appearance', 'yellow'], ['Molecule shown', 'beta-carotene, C40H56 (an example of the class)']],
  cert='C2', refs=[R43], ext=[KOOI_AB, W_CAR], where='mol:beta_carotene', parts=['bio_chloroplasts_plastids', 'bio_plant_secondary_metabolites', 'retina'])

N('rn_cellulose', 'Cellulose: the cell wall', 'molecule', 1e-8, ['rn_petal_epidermis', 'bio_cell_wall_ecm'],
  'Every plant cell, including the buttercup\'s petal and leaf cells, is wrapped in a wall made mainly of cellulose.',
  'Plant cells have walls, and the main material of the wall is cellulose: long chains of glucose bundled into strong fibres. The walls give the petal and leaf their shape and stop the cells from bursting when they take up water. The molecule shown is a short piece of the chain.',
  'The units in cellulose are beta-glucose, turned alternately, which lets the chains lie straight and bond sideways. Many chains line up into microfibrils. Wood adds lignin to the wall; a petal has thin walls and no wood.',
  'The viewer shows cellotriose, a fragment of three glucose units, which is a model of the repeating unit and not a whole cellulose chain, which has thousands of units.',
  [['Building unit', 'beta-glucose'], ['Shown', 'cellotriose, three units']], cert='C1', refs=[R43], ext=[{'title': 'Cellulose (Wikipedia)', 'url': 'https://en.wikipedia.org/wiki/Cellulose'}], where='mol:cellotriose', parts=['bio_cell_wall_ecm', 'bio_polysaccharides', 'oak_lignin_cellulose'])

# ---------------------------------------------------------------- the chemistry of defence
N('rn_poison', 'Why buttercups are poisonous when fresh', 'process', 1e-9, ['rn_acris', 'bio_plant_secondary_metabolites'],
  "Buttercups contain a harmless-looking compound, ranunculin, that is turned into the blistering irritant protoanemonin when the plant is chewed or crushed. In hay the irritant changes into a much less harmful compound.",
  "Fresh buttercup leaves and stems are bitter and acrid. If an animal bites one, it breaks the plant's cells, and a chemical, ranunculin, is turned into another one, protoanemonin, which blisters the lips and tongue and, if a lot is swallowed, upsets the gut. That is a good reason for a grazing cow or horse to avoid them. Cattle leave buttercups when they have other food, and poisoning mostly happens in overgrazed fields where there is little else. The sap can also blister the skin of people, and fresh plants should not be eaten.",
  "The plant stores ranunculin (a glycoside, a sugar attached to another molecule) safely. When tissue is wounded, an enzyme, a beta-glucosidase, releases the sugar (glucose) and the rest of the molecule becomes protoanemonin, a reactive compound that irritates skin and mucous membranes (a vesicant). Left at room temperature it pairs up into anemonin, which has lost the reactive ring and is far less harmful. That is why dried hay containing buttercups is regarded as much less hazardous than the fresh plant.",
  "This is a two-part defence: a stored, inactive precursor and an enzyme that is kept apart from it until the cell is damaged. It is a typical plant secondary metabolite strategy. Effects reported include blistering of the tongue, lips and skin, drooling, gut upset and diarrhoea in livestock; toxicity is highest in spring at flowering. No doses are given here. The molecules ranunculin and protoanemonin are not in the project's molecule data, so no structure is shown.",
  [['Stored compound', 'ranunculin (a glycoside)'], ['Enzyme that releases the irritant', 'a beta-glucosidase'], ['Irritant formed when chewed or crushed', 'protoanemonin'], ['After drying or standing', 'protoanemonin pairs up to anemonin (much less harmful)'], ['Typical effects', 'blistering of mouth and skin; gut upset']],
  cert='C2', refs=[R304], ext=[W_PRO, MASSEY, RANRANUN, W_RA, FERNS], parts=['bio_plant_secondary_metabolites', 'bio_plant_pathogens_defense', 'bio_plant_responses'])

# ---------------------------------------------------------------- tissue scenes: leaf
N('rn_leaf_epidermis', 'Leaf epidermis', 'tissue', 5e-5, ['rn_basal_leaf', 'bio_leaf_structure_gas_exchange'],
  "The epidermis is the skin of the leaf: a single layer of flat cells, covered with a waxy cuticle, with pores (stomata) and hairs.",
  "The skin of the leaf is a thin sheet of closely fitting, flattish cells. It keeps water in, lets light through, and carries hairs. Among its cells there are pores, the stomata.",
  "Because it is a single layer, the leaf skin is easy to peel and look at under a microscope. The cuticle is a waxy film that the cells make on the outside.",
  "The cell sizes and hair length in the leaf-surface scene are illustrative; the plant is described as hairy, but no measured cell sizes or hair dimensions are given for it.",
  [['Layers', 'one cell thick'], ['Contains', 'stomata and hairs']], cert='C2', refs=[R304], ext=[W_RA], parts=['rn_stoma', 'rn_hairs'])

N('rn_stoma', 'Stoma and guard cells', 'structure', 2.5e-5, ['rn_leaf_epidermis', 'bio_leaf_structure_gas_exchange'],
  'A stoma is a pore in the leaf skin, opened and closed by a pair of guard cells, that lets carbon dioxide in and water vapour out.',
  'The leaf needs carbon dioxide from the air to make sugar. The air gets in through tiny pores, each flanked by two bean-shaped guard cells. When the guard cells fill with water they swell and bend apart and the pore opens; when the plant is short of water they relax and the pore closes.',
  'The open pore is also where the plant loses water, so the plant has to balance gas intake against water loss. The sizes in this scene are illustrative.',
  'Stomata respond to light, carbon dioxide level, water supply and plant hormones such as abscisic acid. A detailed card about leaf gas exchange is in the plant biology topics.',
  [['Made of', 'two guard cells'], ['Job', 'gas exchange, water control']], cert='C1', refs=[R304], ext=[W_RA], parts=['bio_leaf_structure_gas_exchange', 'bio_plant_stress_drought'])

# ---------------------------------------------------------------- roots
N('rn_roots', 'Fibrous roots', 'structure', .2, ['rn_acris', 'bio_roots_mycorrhiza'],
  "Below the ground the buttercup has many thin, branching, fibrous roots that take up water and minerals and anchor the plant.",
  "The roots are the plant's drinking and anchoring system. A buttercup has a mass of fine, branching roots spreading out from the base of the stem, not one big taproot. They take up water and dissolved minerals, and finer branches and root hairs do most of the absorbing.",
  "Most plants also partner with fungi in or around their roots (see the mycorrhiza card); no fungal partners are drawn in this model. The roots here are a schematic of a fibrous root system: about 30 roots, 9 to 24 cm long.",
  "The count and length are chosen values; real roots vary with the soil.",
  [['Root type', 'fibrous, spreading from the stock'], ['Model', '30 main roots, 9–24 cm long (schematic)']], cert='C2', refs=[R303], ext=[W_RA, BBFLORA], parts=['rn_stock', 'bio_roots_mycorrhiza', 'bio_water_transport', 'bio_plant_nutrition_soil'])

N('rn_stock', 'Stock (the thick base of the stem)', 'structure', .03, ['rn_roots'],
  "The stock is a short, thick, underground base of the stem from which the roots and new shoots grow. It lets the buttercup live for years and form daughter plants.",
  "Where the stem meets the roots there is a thick, short piece of stem at or just under the ground. In spring, new leaves and flowering stems grow from it. A part can break off and grow into a new plant.",
  "Wikipedia describes the species as growing from seeds and from short, thick rhizomes that can split to form daughter plants. A creeping buttercup, by contrast, spreads by long runners above ground.",
  "The stock in the model is a short tapering stub about 4 cm long, a chosen size.",
  [['Form', 'short, thick, upright'], ['Spreads by', 'seeds and splitting of rhizomes']], cert='C2', refs=[R302], ext=[W_RA])

# Alias card for the old flower patch: still opens and flies to the new plants.
N('park_flower', 'Flower patch', 'habitat', 1, ['park_scene'],
  'A patch of meadow buttercups (Ranunculus acris), about a dozen plants in the park, each a whole plant with roots, leaves, stems, buds, flowers and fruit.',
  'This patch of wild flowers is made of meadow buttercups. Each plant carries flowers at different stages, from buds to open flowers to fruit. Click a plant to see its parts, and use the layer buttons for one flower, a flower cut in half, the fruit and the roots.',
  'The flowers are the way these plants reproduce. Insects that visit for nectar carry pollen from flower to flower. The patch is a simplified scene: the plants are copies of one modelled plant that differ only in size and direction.',
  'The park is a model, not a scan of a real place. The plant is a procedural reconstruction from published measurements of the species (see its card).',
  [['Plants shown', '12 (copies of one modelled plant)']], cert='C1', refs=[], ext=[W_RA], parts=['rn_acris'], where='rn_acris', area='bio_ecology')

json.dump(NODES, open('data/nodes/park_flower.json', 'w'), indent=1, ensure_ascii=False)
print(len(NODES), 'nodes')

# ---------------------------------------------------------------- figures
def blocks(nodes, edges, caption, flow=True):
    return {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'color': c} if c else {})} for i, l, x, y, c in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'flow': flow, 'caption': caption}
def bars(items, ylabel, caption, logy=False):
    d = {'type': 'bars', 'bars': [{'label': l, 'value': v} for l, v in items], 'ylabel': ylabel, 'caption': caption}
    if logy: d['logy'] = True
    return d

F = {}
F['rn_acris'] = bars([('plant height, shortest', 30), ('model plant', 60), ('plant height, tallest', 100)], 'cm', 'Height of the meadow buttercup: floras and Wikipedia give about 30 to 100 cm. The model plant is 60 cm, a chosen value within that range.')
F['rn_stem'] = blocks([('m', 'Main stem: first flower opens and sets fruit', 50, 15, None), ('b', 'Side branches: next flowers open', 25, 50, 'green'), ('f', 'Forks of the branches: youngest buds', 75, 85, 'orange')], [('m', 'b', 'branches arise below'), ('b', 'f', None)], 'The flowering shoot branches. Flowers of the earlier branching order are older, so a plant shows buds, open flowers and fruit at the same time.', False)
F['rn_hairs'] = blocks([('e', 'Epidermis cell', 50, 85, None), ('h', 'Hair (trichome) grows out of it', 50, 50, 'green')], [('e', 'h', None)], 'A hair is an outgrowth of one skin cell. What the buttercup\'s hairs do is not established.', False)
F['rn_basal_leaf'] = bars([('primary lobes in the model blade', 5), ('cuts per lobe in the model', 3)], 'count (model)', 'How the model blade is built: 5 primary lobes, each cut into 3. Real blades vary in lobe number and depth.')
F['rn_stem_leaf'] = bars([('basal leaf blade (model)', 9), ('stem leaf low on stem (model)', 7), ('stem leaf under top branch (model)', 3)], 'cm across (model values)', 'Leaves get smaller up the stem. The sizes shown are the model\'s chosen values, not measurements.')
F['rn_flower'] = bars([('sepals', 5), ('petals', 5), ('stamens (model)', 50), ('carpels (model)', 25)], 'number of parts', 'Parts of the model flower. Floras give 5 sepals and 5 petals and describe numerous stamens and many carpels; the model picks 50 and 25.')
F['rn_sepal'] = blocks([('b', 'Bud: sepals enclose the petals', 20, 50, None), ('o', 'Open flower: sepals spread beneath the petals', 50, 50, 'green'), ('a', 'Older flower: sepals yellow, then fall', 80, 50, 'orange')], [('b', 'o', None), ('o', 'a', None)], 'The life of a sepal.', False)
F['rn_petal'] = blocks([('u', 'Upper skin: one very flat, pigment-filled cell layer', 50, 10, 'orange'), ('a', 'Thin air gap', 50, 35, 'blue'), ('s', 'Starch layer: scatters light', 50, 60, None), ('m', 'Spongy layer and lower skin', 50, 85, 'green')], [('u', 'a', None), ('a', 's', None), ('s', 'm', None)], 'The layers of a buttercup petal, top to bottom (order after van der Kooi and colleagues 2017). The thicknesses in the model, about 0.18 mm in all, are model values.', False)
F['rn_nectary'] = blocks([('s', 'Sugar made in the leaves', 15, 20, 'green'), ('p', 'Carried in the phloem', 50, 50, 'orange'), ('n', 'Nectary pit at the petal base', 85, 80, None)], [('s', 'p', None), ('p', 'n', 'sugar delivered'), ], 'Nectar sugar starts as photosynthesis in the leaves, travels in the phloem and is released by the gland cells of the nectary.', True)
F['rn_stamen'] = {'type': 'plot', 'x': [0, 80], 'y': [0, 30], 'params': [{'id': 'n', 'label': 'stamens in the model flower', 'min': 20, 'max': 80, 'value': 50, 'step': 1}], 'fns': [{'f': 'x*137.5/360', 'label': 'turns of the spiral for x stamens'}], 'readouts': [{'label': 'Turns of the spiral at the golden angle (137.5 degrees each)', 'value': 'n*137.5/360', 'unit': 'turns'}, {'label': 'Pollen sacs in all (4 per anther)', 'value': '4*n', 'unit': 'sacs'}], 'xlabel': 'stamens', 'ylabel': '', 'caption': 'Slide the number of stamens (floras say only numerous; the model uses 50): each one adds 137.5 degrees to the spiral and four pollen sacs.'}
F['rn_filament'] = bars([('filament, model', 4.0), ('petal, model', 11.6), ('flower width, model', 22)], 'mm', 'The filament is shorter than the petal, so the anthers sit inside the bowl of the flower. Sizes are the model\'s chosen values.')
F['rn_anther'] = blocks([('w', 'Wall: skin, endothecium, tapetum', 20, 20, None), ('s', 'Four pollen sacs', 50, 50, 'orange'), ('g', 'Pollen grains, about 27 µm', 80, 80, 'green')], [('w', 's', 'encloses'), ('s', 'g', 'make and hold')], 'An anther in outline: the wall encloses four sacs that make and hold the pollen.', False)
F['rn_pollen_sac'] = blocks([('m', 'Cells divide by meiosis', 15, 20, None), ('s', 'Four spores from each', 50, 50, 'orange'), ('p', 'Each spore becomes a pollen grain', 85, 80, 'green')], [('m', 's', None), ('s', 'p', None)], 'How a pollen sac makes pollen.', False)
F['rn_anther_wall'] = blocks([('t', 'Tapetum feeds the pollen, then breaks down', 20, 80, 'orange'), ('e', 'Endothecium: ring-thickened cells', 50, 50, None), ('s', 'Skin protects', 80, 20, None)], [('t', 'e', 'dries'), ('e', 's', 'pulls the wall open')], 'Layers of the anther wall, inside to outside, and what each one does.', False)
F['rn_pollen_grain'] = bars([('buttercup pollen, length', 27.4), ('buttercup pollen, width', 25.7), ('human red blood cell, width (about)', 7.5)], 'micrometres', 'Size of a meadow buttercup pollen grain (27.4 × 25.7 µm in one reference collection) beside a red blood cell, which is about 7 to 8 µm across.')
F['rn_carpel'] = bars([('carpels in the model flower', 25), ('achenes in the model fruiting head', 24)], 'count (model)', 'Floras say a flower has many separate carpels; the model draws 25, and its fruiting head 24 achenes.')
F['rn_style_stigma'] = blocks([('g', 'Pollen grain lands on the stigma', 50, 15, 'orange'), ('t', 'Pollen tube grows down the style', 50, 50, None), ('o', 'Tube reaches the ovule', 50, 85, 'green')], [('g', 't', None), ('t', 'o', None)], 'The route of a pollen tube.', False)
F['rn_ovule'] = blocks([('o', 'Ovule', 20, 50, None), ('f', 'Fertilised', 50, 50, 'orange'), ('s', 'Seed', 80, 50, 'green')], [('o', 'f', 'pollen tube arrives'), ('f', 's', 'matures')], 'An ovule becomes a seed after fertilisation. A buttercup carpel has one ovule, so it makes one seed.', False)
F['rn_embryo_sac'] = bars([('cells in a typical embryo sac', 7), ('nuclei in a typical embryo sac', 8), ('sperm cells that reach it', 2)], 'count', 'The typical (seven-celled, eight-nucleus) embryo sac of flowering plants and the two sperm cells that take part in double fertilisation.')
F['rn_receptacle'] = blocks([('s', 'Flower stalk tip swells', 20, 80, None), ('r', 'Receptacle dome', 50, 50, 'green'), ('p', 'Stamens low, carpels on top', 80, 20, 'orange')], [('s', 'r', None), ('r', 'p', 'carries')], 'The receptacle is the base that carries all the flower parts.', False)
F['rn_bud'] = blocks([('d', 'Late summer: bud begins to form', 20, 20, None), ('o', 'Next year: flowering', 80, 80, 'green')], [('d', 'o', None)], 'Flower buds are described as starting to form in late summer of the year before flowering.', False)
F['rn_fruit'] = bars([('carpels in the flower (model)', 25), ('achenes in the model fruiting head', 24)], 'count', 'Each fertilised carpel becomes one achene, so the fruiting head carries up to about as many fruits as the flower had carpels. Model values.')
F['rn_achene'] = bars([('achene length, low', 2), ('achene length, high', 3), ('pinhead (about)', 2)], 'mm', 'Achene length is about 2 to 3 mm (floras); a pinhead is about 2 mm across for scale.')
F['rn_fruit_development'] = blocks([('p', 'Pollen lands on stigma', 15, 15, None), ('t', 'Pollen tube grows to the ovule', 50, 15, None), ('d', 'Double fertilisation', 85, 15, 'orange'), ('s', 'Ovule becomes seed', 15, 80, 'green'), ('a', 'Carpel wall becomes achene wall', 50, 80, 'green'), ('l', 'Petals and stamens fall', 85, 80, None)], [('p', 't', None), ('t', 'd', None), ('d', 's', None), ('d', 'a', None), ('d', 'l', None)], 'From flower to fruit.', True)
F['rn_pollination'] = blocks([('v', 'Bees and flies visit most; butterflies and beetles less often', 20, 30, None), ('r', 'Reward: nectar and pollen', 55, 55, 'orange'), ('p', 'Pollen carried to other flowers', 85, 80, 'green')], [('v', 'r', None), ('r', 'p', None)], 'Visitors of the meadow buttercup and what they gain and carry. No ranking of pollinators is implied.', False)
F['rn_nectar'] = blocks([('g', 'Glucose', 15, 30, None), ('f', 'Fructose', 15, 70, None), ('s', 'Sucrose: glucose joined to fructose', 60, 50, 'orange')], [('g', 's', None), ('f', 's', None)], 'Sucrose is one glucose joined to one fructose; it is the sugar carried in the phloem and a common nectar sugar.', False)
F['rn_gloss'] = blocks([('s', 'Sunlight', 15, 15, None), ('m', 'Flat pigment-filled top skin: thin-film mirror', 50, 35, 'orange'), ('g', 'Gloss: mirror-like reflection', 85, 15, 'green'), ('b', 'Starch and spongy layers scatter light back up', 50, 75, None), ('y', 'Light filtered by the pigment: matte yellow', 85, 75, 'green')], [('s', 'm', None), ('m', 'g', 'reflected'), ('m', 'b', 'passes in'), ('b', 'y', 'scattered out')], 'Two kinds of colour in a buttercup petal: a structural gloss from the top skin and a yellow from pigment filtering the scattered light.', True)
F['rn_petal_epidermis'] = blocks([('f', 'Very flat cells', 20, 50, None), ('t', 'Thin-film reflection: the gloss', 50, 25, 'orange'), ('p', 'Carotenoid filter: the yellow', 50, 75, 'green')], [('f', 't', None), ('f', 'p', None)], 'What the flat top skin of the petal does.', False)
F['rn_starch_layer'] = blocks([('l', 'Light enters', 15, 50, None), ('s', 'Starch grains scatter it', 50, 50, 'orange'), ('o', 'Scattered light goes back up', 85, 50, 'green')], [('l', 's', None), ('s', 'o', None)], 'The starch layer works like white paint behind the yellow skin.', False)
F['rn_starch'] = blocks([('g', 'Glucose units', 20, 50, None), ('c', 'Amylose: unbranched chain', 55, 25, 'orange'), ('b', 'Amylopectin: branched chain', 55, 75, 'orange'), ('s', 'Starch grain', 90, 50, 'green')], [('g', 'c', None), ('g', 'b', None), ('c', 's', None), ('b', 's', None)], 'Starch grains are made of two kinds of glucose polymer.', False)
F['rn_petal_mesophyll'] = blocks([('c', 'Loose cells with air gaps', 20, 50, None), ('a', 'Air and cell contents differ in refractive index', 55, 50, 'orange'), ('s', 'Light is scattered', 90, 50, 'green')], [('c', 'a', None), ('a', 's', None)], 'Why the spongy layer scatters light.', False)
F['rn_carotenoid'] = {'type': 'plot', 'x': [380, 560], 'y': [0, 1.6], 'params': [{'id': 'p', 'label': 'main absorption peak (illustrative)', 'min': 430, 'max': 470, 'value': 450, 'step': 2, 'unit': 'nm'}], 'fns': [{'f': '1.4*exp(-((x-p)/30)^2)', 'label': 'absorbance of a blue-absorbing carotenoid (illustrative)'}], 'xlabel': 'wavelength (nm)', 'ylabel': 'absorbance', 'caption': 'Carotenoids take out blue and violet light (they absorb from about 400 to 550 nm), which leaves yellow. The curve is an illustrative smooth peak, not a measured spectrum of the petal pigment.'}
F['rn_cellulose'] = blocks([('g', 'beta-glucose units', 15, 50, None), ('c', 'Cellulose chain', 45, 50, 'orange'), ('m', 'Microfibril of many chains', 75, 30, 'green'), ('w', 'Cell wall', 85, 80, None)], [('g', 'c', None), ('c', 'm', None), ('m', 'w', None)], 'Cellulose chains bundle into fibrils that make the cell wall.', False)
F['rn_poison'] = blocks([('r', 'Ranunculin stored in the cell', 15, 20, None), ('b', 'Bite or crush: cells break', 50, 20, 'orange'), ('p', 'Protoanemonin: blistering irritant', 85, 20, 'orange'), ('d', 'Drying or standing: pairs up to anemonin', 85, 80, 'green')], [('r', 'b', None), ('b', 'p', 'enzyme acts'), ('p', 'd', 'hay'), ], 'What happens to the chemical defence of a buttercup when it is damaged, and then dried.', True)
F['rn_leaf_epidermis'] = blocks([('c', 'Cuticle (wax)', 50, 15, 'orange'), ('e', 'Epidermis: one layer of cells', 50, 50, None), ('m', 'Mesophyll below', 50, 85, 'green')], [('c', 'e', None), ('e', 'm', None)], 'The skin of a leaf: wax film, one layer of cells, then the working tissue.', False)
F['rn_stoma'] = blocks([('w', 'Guard cells fill with water', 15, 20, 'blue'), ('o', 'Pore opens', 50, 50, 'green'), ('g', 'CO2 in, water vapour out', 85, 80, None), ('d', 'Short of water: pore closes', 15, 80, 'orange')], [('w', 'o', None), ('o', 'g', None), ('d', 'o', None)], 'A stoma opens and closes by osmosis in its two guard cells.', False)
F['rn_roots'] = blocks([('s', 'Soil water and minerals', 15, 50, 'blue'), ('f', 'Fine roots and root hairs', 45, 50, None), ('k', 'Stock and stem upward', 85, 20, 'green')], [('s', 'f', 'uptake'), ('f', 'k', 'xylem')], 'Uptake happens at the finest roots; the water then travels up the stem.', True)
F['rn_stock'] = blocks([('a', 'Leaves make sugar', 85, 15, 'green'), ('s', 'Stock stores food over winter', 50, 50, 'orange'), ('n', 'New shoots and roots in spring', 15, 85, None)], [('a', 's', 'sugar down'), ('s', 'n', 'food used')], 'The stock is a storage and growth base.', True)
F['park_flower'] = bars([('plants in the patch', 12), ('open flowers per model plant', 4), ('buds per model plant', 2), ('fruiting heads per model plant', 2)], 'count', 'The flower patch: 12 copies of one modelled plant.')

path = 'data/viz/park_flower.json'
json.dump(F, open(path, 'w'), indent=1, ensure_ascii=False)
print(len(F), 'figures')
