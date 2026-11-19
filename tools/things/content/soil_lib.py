# Shared helpers for the soil cards (soil_cards_*.py write into NODES and FIGS; soil_nodes.py saves them).
def X(t, u): return {'title': t, 'url': u}
def R(sec, slug, book='BIO'): return [book, sec, slug]

# ---- sources opened for this thing (each is cited in `ext` where it supports a statement) ----
GEOT = X('Greenwich Park Geotrail (London Geodiversity Partnership, 2025), pages 2 to 12', 'https://londongeopartnership.org.uk/wp/wp-content/uploads/2026/05/Greenwich-Park-Geotrail-2025.pdf')
W_HOR = X('Soil horizon (Wikipedia)', 'https://en.wikipedia.org/wiki/Soil_horizon')
W_SOIL = X('Soil (Wikipedia)', 'https://en.wikipedia.org/wiki/Soil')
W_FORM = X('Soil formation (Wikipedia)', 'https://en.wikipedia.org/wiki/Soil_formation')
W_SPF = X('Soil production function (Wikipedia)', 'https://en.wikipedia.org/wiki/Soil_production_function')
W_STRUCT = X('Soil structure (Wikipedia)', 'https://en.wikipedia.org/wiki/Soil_structure')
W_BIO = X('Soil biology (Wikipedia)', 'https://en.wikipedia.org/wiki/Soil_biology')
DARWIN = X('Darwin, The Formation of Vegetable Mould through the Action of Worms (1881), Project Gutenberg', 'https://www.gutenberg.org/ebooks/2355')
IPCC = X('IPCC AR5 Working Group I, chapter 6 (Carbon and other biogeochemical cycles), section 6.1.1 and Figure 6.1', 'https://www.ipcc.ch/site/assets/uploads/2018/02/WG1AR5_Chapter06_FINAL.pdf')
ANTH = X('Anthony, Bender and van der Heijden: Enumerating soil biodiversity (PNAS 2023)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10437432/')
W_LT = X('Lumbricus terrestris (Wikipedia)', 'https://en.wikipedia.org/wiki/Lumbricus_terrestris')
W_EW = X('Earthworm (Wikipedia)', 'https://en.wikipedia.org/wiki/Earthworm')
W_CLIT = X('Clitellum (Wikipedia)', 'https://en.wikipedia.org/wiki/Clitellum')
LANDER = X('Lumbricus terrestris, Invertebrate Anatomy OnLine (Lander University)', 'https://lanwebs.lander.edu/faculty/rsfox/invertebrates/lumbricus.html')
UBC = X('Introduction to the Earthworms (E-Fauna BC, University of British Columbia)', 'https://linnet.geog.ubc.ca/biodiversity/efauna/EarthwormsIntroduction.html')
BIOT = X('Earthworm (Biotopics)', 'https://www.biotopics.co.uk/pot/odds/worm.html')
W_ONIS = X('Oniscus asellus, the common woodlouse (Wikipedia)', 'https://en.wikipedia.org/wiki/Oniscus_asellus')
W_WOOD = X('Woodlouse (Wikipedia)', 'https://en.wikipedia.org/wiki/Woodlouse')
W_SPRING = X('Springtail (Wikipedia)', 'https://en.wikipedia.org/wiki/Springtail')
W_ORIB = X('Oribatida, the oribatid mites (Wikipedia)', 'https://en.wikipedia.org/wiki/Oribatida')
W_PTERO = X('Pterostichus madidus (Wikipedia)', 'https://en.wikipedia.org/wiki/Pterostichus_madidus')
W_NEM = X('Nematode (Wikipedia)', 'https://en.wikipedia.org/wiki/Nematode')
W_NFIX = X('Nitrogen fixation (Wikipedia)', 'https://en.wikipedia.org/wiki/Nitrogen_fixation')
W_NCYC = X('Nitrogen cycle (Wikipedia)', 'https://en.wikipedia.org/wiki/Nitrogen_cycle')
W_ECM = X('Ectomycorrhiza (Wikipedia)', 'https://en.wikipedia.org/wiki/Ectomycorrhiza')
W_CEC = X('Cation-exchange capacity (Wikipedia)', 'https://en.wikipedia.org/wiki/Cation-exchange_capacity')
W_KAOL = X('Kaolinite (Wikipedia)', 'https://en.wikipedia.org/wiki/Kaolinite')
W_CLAYM = X('Clay minerals (Wikipedia)', 'https://en.wikipedia.org/wiki/Clay_minerals')
W_FLINT = X('Flint (Wikipedia)', 'https://en.wikipedia.org/wiki/Flint')
W_SAND = X('Sand (Wikipedia)', 'https://en.wikipedia.org/wiki/Sand')
W_GRAIN = X('Grain size (Wikipedia), ISO 14688-1:2017 classes', 'https://en.wikipedia.org/wiki/Grain_size')
MSU = X('Soil Physical Properties in Healthy Soils (Mississippi State University Extension, P3660)', 'https://extension.msstate.edu/sites/default/files/publications/P3660_web.pdf')

R_SOIL = R('31.2', '31-2-the-soil'); R_NUT = R('31.1', '31-1-nutritional-requirements-of-plants'); R_ADAPT = R('31.3', '31-3-nutritional-adaptations-of-plants')
R_CYC = R('46.3', '46-3-biogeochemical-cycles'); R_FLOW = R('46.2', '46-2-energy-flow-through-ecosystems'); R_ECO = R('46.1', '46-1-ecology-of-ecosystems')
R_ANN = R('28.4', '28-4-superphylum-lophotrochozoa-mollusks-and-annelids'); R_NEM = R('28.5', '28-5-superphylum-ecdysozoa-nematodes-and-tardigrades'); R_ART = R('28.6', '28-6-superphylum-ecdysozoa-arthropods')
R_FUNGI = R('24.3', '24-3-ecology-of-fungi'); R_ROOT = R('30.3', '30-3-roots'); R_PROK = R('22.2', '22-2-structure-of-prokaryotes-bacteria-and-archaea'); R_PMET = R('22.3', '22-3-prokaryotic-metabolism')
R_WATER = R('2.2', '2-2-water'); R_CARB = R('3.2', '3-2-carbohydrates'); R_PHOTO = R('8.1', '8-1-overview-of-photosynthesis'); R_RESP = R('7.1', '7-1-energy-in-living-systems')

NODES = []; FIGS = {}
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, related=None, where='soil_block', fig=None, tag=None):
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
def table(cols, rows, caption): return {'type': 'table', 'cols': cols, 'rows': rows, 'caption': caption}
