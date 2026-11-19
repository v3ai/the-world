# Cards for the park objects that are not yet full things (pond, flowers, bee, mushroom, clouds, birds, sun, sky, ground).
# Run from the repo root:  python3 tools/things/content/park_nodes.py   (writes data/nodes/park_{pond,flower,bee,mushroom,bird,sky,soil}.json)
import json
WH = lambda t, u: {'title': t, 'url': u}
W_HYPHA = WH('Hypha (Wikipedia)', 'https://en.wikipedia.org/wiki/Hypha')
W_BASIDIO = WH('Basidiospore (Wikipedia)', 'https://en.wikipedia.org/wiki/Basidiospore')
W_EYE = WH('Compound eye (Wikipedia)', 'https://en.wikipedia.org/wiki/Compound_eye')
W_CLOUD = WH('Cloud (Wikipedia)', 'https://en.wikipedia.org/wiki/Cloud')
def N(id, title, kind, scale, parents, summary, b, d, x, facts, cert='C1', ext=None, openq=None, parts=None, area='bio_ecology'):
    return {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': area, 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
            'layers': {'basics': b, 'deeper': d, 'expert': x}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': [], 'ext': ext or []}
MODEL = 'The park is a simplified scene, not a scan of a real place.'
files = {
'park_pond': [N('park_pond', 'Pond', 'habitat', 5, ['park_scene'],
  'A small pond: still fresh water that holds a community of tiny plants, animals and microbes.',
  'A pond is a small, usually shallow patch of still water. Sunlight can reach the bottom, so plants and algae grow, and they feed snails, insects and fish. Most of the living things in it are too small to see. Zoom in and you meet some of them.',
  'The water is crowded with algae that make sugar from light, bacteria that break down dead material, and tiny animals that eat both. Ponds are usually shallow enough that light reaches much of the bottom (the line between a pond and a lake is not sharp).',
  'Pond life is a food web: light energy enters through photosynthesis in algae and plants, and passes to grazers and then predators; microbes recycle what dies. ' + MODEL,
  [['What is real', 'The kinds of life shown at the close-up are typical pond organisms; the picture is a simplified model'], ['Scale of the scene', 'a few metres across']], ext=[])],
'park_flower': [N('park_flower', 'Flower patch', 'habitat', 1, ['park_scene'],
  'A patch of wild flowers: the part of a plant that makes seeds, and a meeting place for insects.',
  'A flower is how many plants reproduce. The coloured petals and the scent advertise to insects. A visiting bee collects sugary nectar and sticky pollen, and carries pollen from flower to flower, which lets the plants make seeds.',
  'Pollen carries the plant\'s male cells; the part of the flower that receives it leads to the seed. When an insect moves pollen between flowers of the same kind, that is pollination. Close-up, the leaf and stem surfaces are covered in tiny pores and hairs.',
  'Flowering plants (angiosperms) are the largest group of land plants. The close-up here shows a generic leaf surface, not the flowers drawn. ' + MODEL,
  [['Shown here', '16 flowers in one patch (a simplified model)']], ext=[], parts=['oak_leaf'])],
'park_bee': [N('park_bee', 'Bee', 'organism', .015, ['park_scene'],
  'A bee: a flying insect that feeds on nectar and pollen and pollinates flowers as it goes.',
  'The bee flits between flowers. Its body is covered in branched hairs that catch pollen. Its big eyes are not like ours: each is made of thousands of tiny lenses packed side by side. Zoom in to see a simplified picture of that.',
  'Each of the two big eyes is a compound eye: a mosaic of many separate light-sensing units called ommatidia, each with its own lens. Together they give the bee a coarse image but very quick reaction to movement.',
  'In an ommatidium a lens (cornea and crystalline cone) focuses light on a bundle of photoreceptor cells. The size and number of facets in the close-up are illustrative, not measured on a particular species.',
  [['Compound eye', 'thousands of ommatidia per eye (the number depends on the species)'], ['Close-up shown', 'a schematic pattern of facets, sizes illustrative']], ext=[W_EYE])],
'park_mushroom': [N('park_mushroom', 'Mushroom', 'organism', .12, ['park_scene'],
  'A mushroom is the spore-making part of a fungus; the rest of the fungus is a hidden web of threads in the soil.',
  'What you see is only the fruit. Underground the fungus is a network of fine threads that digests dead material and absorbs the nutrients. The cap makes dust-like spores that drift away to start new fungi. Zoom in to the underside of a cap.',
  'The threads are called hyphae and together they form a mycelium. Under a gilled cap, the thin plates called gills are lined with club-shaped cells (basidia) that each carry spores on tiny stalks.',
  'Hyphae are tubes enclosed in a cell wall whose main structural polymer is typically chitin. Basidia typically bear four spores, which are shot off by a drop of water that condenses at the spore\'s base. ' + MODEL,
  [['Hypha diameter', '≈ 4–6 µm on average'], ['Basidiospore length', '≈ 5–10 µm (some as small as ≈ 2 µm)'], ['Spores per basidium', 'typically 4 (range 1–8)']], ext=[W_HYPHA, W_BASIDIO], parts=['oak_mycorrhiza'])],
'park_bird': [N('park_bird', 'Bird', 'organism', .3, ['park_scene'],
  'A bird: a feathered animal; most birds fly by flapping their wings.',
  'The three dark shapes circling over the park are birds. In a flying bird the wings push air downwards and backwards, and the air pushes the bird up and forwards (not every bird flies). Zoom in and you move into the air around it.',
  'Flight needs a light body and strong wing muscles, and feathers that are both stiff and very light. The close-up here is of the air, which is mostly nitrogen and oxygen molecules.',
  'The birds in the park are simple dark shapes, not a model of any species. ' + MODEL,
  [['Shown here', '3 birds circling (simplified model)']], cert='C1')],
'park_sky': [
  N('park_cloud', 'Cloud', 'phenomenon', 1000, ['park_scene'],
    'A cloud is a mass of tiny water droplets or ice crystals floating in the air.',
    'Clouds form when air containing water vapour cools. The vapour condenses into droplets so small that they float. What looks like a solid white shape is a huge number of droplets scattering sunlight in every direction.',
    'Condensation usually happens on tiny particles of dust or salt in the air, called cloud condensation nuclei. The drifting clouds in the park are simple shapes, not a weather model.',
    'Water vapour normally condenses to form cloud drops on cloud condensation nuclei such as small salt or dust particles. ' + MODEL,
    [['What a cloud is made of', 'liquid droplets and/or ice crystals']], ext=[W_CLOUD], area='bio_ecology'),
  N('park_sun', 'The Sun', 'star', 1.39e9, ['park_scene'],
    'The Sun is the star that lights and warms the Earth.',
    'Nearly all the energy that living things use arrives as sunlight. Plants and algae turn some of it into sugar, and animals eat the plants. The Sun in the sky of the park is a drawn disc, not to scale.',
    'Light takes about 8 minutes to cross the 150 million kilometres between the Sun and the Earth (a result of dividing one astronomical unit, 1.496 × 10^11 m, by the speed of light, 2.998 × 10^8 m/s: ≈ 499 s).',
    'The Sun\'s diameter is about 109 Earth diameters; use the Solar system view for the real thing. The disc shown in the park is a glowing sprite whose size is chosen for the look of the scene.',
    [['Light travel time to Earth', '≈ 499 s ≈ 8.3 min (calculated)']], cert='C1'),
  N('park_sky', 'Sky and air', 'phenomenon', 1e4, ['park_scene'],
    'The sky is the air above us. Air is a mixture of gases, mostly nitrogen and oxygen.',
    'You cannot see air, but it is there: a sea of molecules, each far smaller than the thickness of a hair. The blue of the sky is sunlight scattered by those molecules. Zoom in to see a simple picture of air at a very small scale.',
    'Dry air is about 78% nitrogen and 21% oxygen by volume, with about 1% argon and small amounts of carbon dioxide and other gases.',
    'The close-up is an illustration of molecules in air and not to scale in spacing. ' + MODEL,
    [['Composition of dry air', '≈ 78% nitrogen, ≈ 21% oxygen (by volume)']])],
'park_soil': [N('park_ground', 'Ground and soil', 'habitat', 1, ['park_scene'],
  'The ground is covered with grass over soil: a mixture of broken rock, dead plant material and living things.',
  'Soil is not just dirt. It holds tiny grains of rock, the remains of dead plants and animals, water, air, and an enormous number of living things, from earthworms to microbes. Plant roots anchor in it and drink from it. Zoom in to see the grains.',
  'Soil grains clump together with the help of humus (dark decayed material), clay, plant roots and fungal threads. Fungi and bacteria break down dead matter and release nutrients that plants take up. Tree roots reach out through the soil with the help of fungal partners (mycorrhiza).',
  'The close-up is a simplified view of soil grains and organisms, not a sample of real soil. ' + MODEL,
  [['Shown here', 'grass over soil (simplified model)']], parts=['oak_roots', 'oak_mycorrhiza'])],
}
import os, glob
# Each thing's own generator (<thing>_nodes.py) owns its nodes file: do not overwrite a file another script in this folder writes
mine = os.path.abspath(__file__)
def owned(name):
    for f in glob.glob(os.path.join(os.path.dirname(mine), '*_nodes.py')):
        if os.path.abspath(f) != mine and ('data/nodes/' + name + '.json') in open(f).read(): return os.path.basename(f)
for name, nodes in files.items():
    o = owned(name)
    if o: print('skipped', name, '(written by', o + ')'); continue
    json.dump(nodes, open(os.path.join('data/nodes', name + '.json'), 'w'), indent=1, ensure_ascii=False)
print({k: [n['id'] for n in v] for k, v in files.items()})
