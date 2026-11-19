# Shared helpers for the pond's cards (pond_cards_*.py write into NODES and FIGS; pond_nodes.py saves them).
def X(t, u): return {'title': t, 'url': u}
def R(sec, slug, book='BIO'): return [book, sec, slug]

# ---- sources opened for this thing (each is cited in `ext` where it supports a statement) ----
W_POND = X('Pond (Wikipedia)', 'https://en.wikipedia.org/wiki/Pond')
W_LEMNA = X('Lemna minor (Wikipedia)', 'https://en.wikipedia.org/wiki/Lemna_minor')
W_LEMNOID = X('Lemnoideae, the duckweeds (Wikipedia)', 'https://en.wikipedia.org/wiki/Lemnoideae')
W_GERRIS = X('Gerris lacustris, the common pond skater (Wikipedia)', 'https://en.wikipedia.org/wiki/Gerris_lacustris')
W_STRIDER = X('Water strider (Wikipedia)', 'https://en.wikipedia.org/wiki/Water_strider')
W_ST = X('Surface tension (Wikipedia)', 'https://en.wikipedia.org/wiki/Surface_tension')
W_LYM = X('Lymnaea stagnalis, the great pond snail (Wikipedia)', 'https://en.wikipedia.org/wiki/Lymnaea_stagnalis')
W_PULM = X('Pulmonata (Wikipedia)', 'https://en.wikipedia.org/wiki/Pulmonata')
W_RAD = X('Radula (Wikipedia)', 'https://en.wikipedia.org/wiki/Radula')
W_DAPH = X('Daphnia (Wikipedia)', 'https://en.wikipedia.org/wiki/Daphnia')
W_AESH = X('Aeshna cyanea, the southern hawker (Wikipedia)', 'https://en.wikipedia.org/wiki/Aeshna_cyanea')
BDS = X('Southern hawker (British Dragonfly Society species page)', 'https://british-dragonflies.org.uk/species/southern-hawker/')
W_DRAGON = X('Dragonfly (Wikipedia)', 'https://en.wikipedia.org/wiki/Dragonfly')
W_FROG = X('Common frog (Wikipedia)', 'https://en.wikipedia.org/wiki/Common_frog')
FROGLIFE = X('Common frog (Froglife)', 'https://www.froglife.org/info-advice/amphibians-and-reptiles/common-frog/')
ARC = X('Common frog (Amphibian and Reptile Conservation Trust)', 'https://www.arc-trust.org/common-frog')
W_TAD = X('Tadpole (Wikipedia)', 'https://en.wikipedia.org/wiki/Tadpole')
BLAND = X('Bland: Delayed metamorphosis of frog tadpoles at high altitude in Perthshire (The Glasgow Naturalist), Tables 1 and 2', 'https://glasgownaturalhistory.org.uk/gn25_1/bland_delayedmetamorphosis.pdf')
W_CERA = X('Ceratophyllum demersum, rigid hornwort (Wikipedia)', 'https://en.wikipedia.org/wiki/Ceratophyllum_demersum')
W_CERAG = X('Ceratophyllum, the hornworts (Wikipedia)', 'https://en.wikipedia.org/wiki/Ceratophyllum')
W_IRIS = X('Iris pseudacorus, the yellow flag (Wikipedia)', 'https://en.wikipedia.org/wiki/Iris_pseudacorus')
W_AQP = X('Aquatic plant (Wikipedia)', 'https://en.wikipedia.org/wiki/Aquatic_plant')
USGS = X('Dissolved oxygen and water (USGS Water Science School)', 'https://www.usgs.gov/special-topics/water-science-school/science/dissolved-oxygen-and-water')
ETB = X('Oxygen solubility in water (Engineering ToolBox), fresh water at 1 bar', 'https://www.engineeringtoolbox.com/oxygen-solubility-water-d_841.html')
W_OXY = X('Oxygenation, environmental (Wikipedia)', 'https://en.wikipedia.org/wiki/Oxygenation_(environmental)')
W_EUT = X('Cultural eutrophication (Wikipedia)', 'https://en.wikipedia.org/wiki/Cultural_eutrophication')
W_BLOOM = X('Cyanobacterial bloom (Wikipedia)', 'https://en.wikipedia.org/wiki/Cyanobacterial_bloom')
W_STRAT = X('Lake stratification (Wikipedia)', 'https://en.wikipedia.org/wiki/Lake_stratification')
W_MARSH = X('Marsh gas (Wikipedia)', 'https://en.wikipedia.org/wiki/Marsh_gas')
W_METH = X('Methanogenesis (Wikipedia)', 'https://en.wikipedia.org/wiki/Methanogenesis')
PMC_SED = X('Effects of chironomid larvae density and mosquito biocide on methane and carbon dioxide dynamics in freshwater sediments (PLoS ONE 2024)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11125464')
W_VOLVOX = X('Volvox (Wikipedia)', 'https://en.wikipedia.org/wiki/Volvox')
PMC_VOLVOX = X('The microalga Volvox carteri as a cell supportive building block for tissue engineering (PMC10923841), introduction and results 3.3', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10923841')
W_CHLAM = X('Chlamydomonas (Wikipedia)', 'https://en.wikipedia.org/wiki/Chlamydomonas')
W_CHLAMR = X('Chlamydomonas reinhardtii (Wikipedia)', 'https://en.wikipedia.org/wiki/Chlamydomonas_reinhardtii')
W_PARA = X('Paramecium (Wikipedia)', 'https://en.wikipedia.org/wiki/Paramecium')
W_ROT = X('Rotifer (Wikipedia)', 'https://en.wikipedia.org/wiki/Rotifer')
W_DIAT = X('Diatom (Wikipedia)', 'https://en.wikipedia.org/wiki/Diatom')
W_BACT = X('Bacteria (Wikipedia)', 'https://en.wikipedia.org/wiki/Bacteria')
W_GRAIN = X('Grain size (Wikipedia), ISO 14688-1:2017 classes', 'https://en.wikipedia.org/wiki/Grain_size')
PMC_INSECT = X('Staying dry and clean: an insect\'s guide to hydrophobicity (Insects 2022)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9861782')

R_WATER = R('2.2', '2-2-water'); R_PHOTO = R('8.1', '8-1-overview-of-photosynthesis'); R_LIGHT = R('8.2', '8-2-the-light-dependent-reactions-of-photosynthesis')
R_AQ = R('44.4', '44-4-aquatic-biomes'); R_ECO = R('46.1', '46-1-ecology-of-ecosystems'); R_FLOW = R('46.2', '46-2-energy-flow-through-ecosystems'); R_CYC = R('46.3', '46-3-biogeochemical-cycles')
R_COMM = R('45.6', '45-6-community-ecology'); R_ART = R('28.6', '28-6-superphylum-ecdysozoa-arthropods'); R_MOL = R('28.4', '28-4-superphylum-lophotrochozoa-mollusks-and-annelids')
R_AMPH = R('29.3', '29-3-amphibians'); R_PROT = R('23.2', '23-2-characteristics-of-protists'); R_PROTG = R('23.3', '23-3-groups-of-protists'); R_PROK = R('22.2', '22-2-structure-of-prokaryotes-bacteria-and-archaea')
R_GREEN = R('25.2', '25-2-green-algae-precursors-of-land-plants'); R_GAS = R('39.2', '39-2-gas-exchange-across-respiratory-surfaces'); R_PLANT = R('30.1', '30-1-the-plant-body'); R_NUT = R('31.1', '31-1-nutritional-requirements-of-plants')
R_ANAER = R('7.5', '7-5-metabolism-without-oxygen'); R_SEED = R('26.1', '26-1-evolution-of-seed-plants'); R_FISH = R('29.2', '29-2-fishes')

NODES = []; FIGS = {}
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, related=None, where=None, fig=None):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': 'bio_ecology', 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
         'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': [list(f) for f in facts], 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if related: n['related'] = related
    if dyk: n['did_you_know'] = dyk
    if where: n['where'] = where
    NODES.append(n)
    if fig: FIGS[id] = fig
def bars(rows, ylabel, caption, logy=False):
    return {'type': 'bars', 'bars': [{'label': l, 'value': v} for l, v in rows], 'ylabel': ylabel, 'logy': logy, 'caption': caption}
def blocks(nodes, edges, caption, flow=False):
    d = {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'shape': s} if s else {})} for i, l, x, y, s in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'caption': caption}
    if flow: d['flow'] = True
    return d
