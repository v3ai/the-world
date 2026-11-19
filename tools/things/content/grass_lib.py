# Shared helpers for the grass cards (grass_cards_*.py write into NODES and FIGS; grass_nodes.py saves them).
def X(t, u): return {'title': t, 'url': u}
def R(sec, slug, book='BIO'): return [book, sec, slug]

# ---- sources opened for this thing (each is cited in `ext` where it supports a statement) ----
W_LP = X('Lolium perenne, perennial ryegrass (Wikipedia)', 'https://en.wikipedia.org/wiki/Lolium_perenne')
DELTA = X('Lolium perenne in Grasses of North America, Festuca group (DELTA)', 'https://www.delta-intkey.com/festucna/www/lope.htm')
GGW = X('Lolium in Grass Genera of the World (DELTA, University of Hamburg)', 'https://www-archiv.fdm.uni-hamburg.de/b-online/delta/grass/www/lolium.htm')
NZF = X('Lolium perenne (NZ Flora factsheet)', 'https://www.nzflora.info/factsheet/taxon/Lolium-perenne.html')
CORNELL = X('Perennial ryegrass (Cornell Weed ID)', 'https://blogs.cornell.edu/weedid/?p=5329')
VT = X('Perennial ryegrass (Virginia Tech Weed ID)', 'https://weedid.cals.vt.edu/profile/450/')
MNW = X('Perennial ryegrass (Minnesota Wildflowers)', 'https://minnesotawildflowers.info/grass-sedge-rush/perennial-ryegrass')
OSU = X('Grass growth and structure (Oregon State University Forage Information System)', 'https://forages.oregonstate.edu/node/1627')
MO = X('Grass growth and management: M182 (University of Missouri Extension)', 'https://extension.missouri.edu/publications/m182')
PMC_GZ = X('Leaf growth zone of Lolium perenne, kinematic study (Plant Physiology, PMC1475472)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1475472')
AHDB = X('Grassland management tips for the first season (AHDB)', 'https://ahdb.org.uk/knowledge-library/grassland-management-tips-for-first-season')
RHS_MOW = X('Mowing lawns (Royal Horticultural Society)', 'https://www.rhs.org.uk/lawns/mowing')
PMC_FRUC = X('Fructans in Lolium perenne (PMC3060680)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3060680')
FRONT_FRUC = X('Abeynayake et al. 2015, fructans in perennial ryegrass (Frontiers in Plant Science)', 'https://frontiersin.org/articles/10.3389/fpls.2015.00329/full')
UKY = X('Root mass of a perennial ryegrass sward (Univ. of Kentucky, International Grassland Congress abstract)', 'https://uknowledge.uky.edu/igc/20/themeA/18')
PMC_PHYL = X('Phyllochron and root numbers in Lolium perenne cv. Aberdart (PMC8399834)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8399834/')
UMN = X('Perennial ryegrass growth and temperature (University of Minnesota turf)', 'https://turf.umn.edu/seed-production-newsletter-april-29-2025')
MET23 = X('What is the pollen forecast this year? (Met Office, 2023)', 'https://www.metoffice.gov.uk/blog/2023/whats-the-pollen-forecast-this-year')
MET22 = X('A change in the pollen season (Met Office, 2022)', 'https://www.metoffice.gov.uk/blog/2022/a-change-in-the-pollen-season-but-is-it-worse-than-normal')
ALUK = X('Pollen levels and hay fever (Asthma + Lung UK press release)', 'https://www.asthmaandlung.org.uk/media/press-releases/high-pollen-levels-could-put-lives-millions-risk-charity-warns-11')
RMET = X('Achoo! A guide to hay fever and the pollen season (Royal Meteorological Society)', 'https://www.rmets.org/metmatters/achoo-metmatters-guide-hay-fever-and-pollen-season')
ALLUK = X('Allergic rhinitis and hay fever fact sheet (Allergy UK)', 'https://www.allergyuk.org/resources/allergic-rhinitis-and-hay-fever-fact-sheet/')
PALDAT = X('Lolium perenne pollen (PalDat)', 'https://www.paldat.org/en/pub/Lolium_perenne/102928')
W_ANEMO = X('Anemophily, wind pollination (Wikipedia)', 'https://en.wikipedia.org/wiki/Anemophily')
ALLERGEN = X('WHO/IUIS allergen nomenclature: Lol p', 'https://www.allergen.org/search.php?allergenname=Lol+p&allergensource=&TaxSource=&TaxOrder=&foodallerg=all&bioname=')
PMC_IGE = X('Grass pollen allergen sensitisation (Int J Mol Sci, PMC12898073)', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12898073/fullTextXML')
PMC_STORM = X('Ryegrass pollen rupture and thunderstorm asthma (Sci Rep, PMC13421526)', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13421526/fullTextXML')
OS_HYPER = X('Hypersensitivities (OpenStax Microbiology, 19.1)', 'https://openstax.org/books/microbiology/pages/19-1-hypersensitivities')
W_BULL = X('Bulliform cell (Wikipedia)', 'https://en.wikipedia.org/wiki/Bulliform_cell')
W_STOMA = X('Stoma (Wikipedia)', 'https://en.wikipedia.org/wiki/Stoma')
FRANKS = X('Franks and Farquhar 2007, The mechanical diversity of stomata (Plant Physiology; abstract via Europe PMC)', 'https://doi.org/10.1104/pp.106.089367')
PMC_STOMA_REV = X('Franks and Farquhar (2007) and beyond (Plant Physiology review, PMC13711088)', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13711088/fullTextXML')
MASSEY06 = X('Massey and Hartley 2006: antiherbivore effects of silica in grasses (Proc R Soc B, PMC1636089)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1636089')
MASSEY_JAE = X('Massey, Ennos and Hartley 2006: silica in grasses as a defence against insect herbivores (J Anim Ecol)', 'https://doi.org/10.1111/j.1365-2656.2006.01082.x')
MASSEY09 = X('Massey and Hartley 2009: physical defences wear you down (J Anim Ecol)', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Physical%20defences%20wear%20you%20down%22&format=json')
PMC_SI = X('Silicon in grasses (review, PMC8066056)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8066056/')
PMC_PHYT = X('Phytoliths in grasses (PMC6724085)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6724085/')
OS_ROOTS = X('Roots (OpenStax Biology 2e, 30.3)', 'https://openstax.org/books/biology-2e/pages/30-3-roots')
W_ROOTHAIR = X('Root hair (Wikipedia)', 'https://en.wikipedia.org/wiki/Root_hair')
OS_ANGIO = X('Angiosperms, Table 26.1 monocots and eudicots (OpenStax Biology 2e, 26.3)', 'https://openstax.org/books/biology-2e/pages/26-3-angiosperms')
W_MONO = X('Monocotyledon (Wikipedia)', 'https://en.wikipedia.org/wiki/Monocotyledon')
W_C4 = X('C4 carbon fixation (Wikipedia)', 'https://en.wikipedia.org/wiki/C4_carbon_fixation')
PMC_POOID = X('Pooideae are exclusively C3 (PMC10184452)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10184452/')
LEHMANN = X('Functional diversification enabled grassy biomes to fill global climate space (bioRxiv preprint, not peer reviewed)', 'https://eprints.whiterose.ac.uk/184960/1/583625v1.full.pdf')
W_POACEAE = X('Poaceae, the grass family (Wikipedia)', 'https://en.wikipedia.org/wiki/Poaceae')

SANSON = X('Sanson 2023: Reassessing assumptions about the evolution of herbivore teeth (PNAS)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9926241/')
LAKHAL = X('Lakhal et al. 2025: Novel experimental methods to investigate the effects of plant phytoliths on tooth enamel wear (J R Soc Interface)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12212993/')
MARTIN22 = X('Martin et al. 2022: Macrowear effects of external quartz abrasives of different size and concentration in rabbits (J Exp Zool B)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9787991/')
AMBROSE = X('Ambrose et al. 2000: Molecular and genetic analyses of the silky1 gene reveal conservation in floral organ specification between eudicots and monocots (Molecular Cell)', 'https://doi.org/10.1016/S1097-2765(00)80450-5')
PARKSGARD = X('Greenwich Park (Parks & Gardens UK, from the Register of Parks and Gardens of Special Historic Interest)', 'https://parksandgardens.org/places/greenwich-park')
MALYS = X('Malys et al. 2015: Why the Greenwich meridian moved (Journal of Geodesy)', 'https://link.springer.com/article/10.1007/s00190-015-0844-y')
COLINHERB = X('Lolium perenne (Colin Herb, Poaceae key)', 'https://colinherb.com/Poaceae/Lolium/Perenne/Lolium_perenne_2184_048.htm')
R_PLANT = R('30.1', '30-1-the-plant-body'); R_STEM = R('30.2', '30-2-stems'); R_ROOT = R('30.3', '30-3-roots'); R_LEAF = R('30.4', '30-4-leaves'); R_TRANS = R('30.5', '30-5-transport-of-water-and-solutes-in-plants')
R_ANGIO = R('26.3', '26-3-angiosperms'); R_POLL = R('32.2', '32-2-pollination-and-fertilization'); R_PHOTO = R('8.1', '8-1-overview-of-photosynthesis'); R_NUT = R('31.1', '31-1-nutritional-requirements-of-plants')
R_ECO = R('46.2', '46-2-energy-flow-through-ecosystems'); R_HYP = R('19.1', '19-1-hypersensitivities', 'MIC'); R_SEEDROLE = R('26.4', '26-4-the-role-of-seed-plants')


# ---- clean-up applied to every card and figure before it is written (attribution lives in `ext`, not in the prose) ----
import re as _re
_ATTR = ('Wikipedia', 'DELTA', 'GGW', 'Grass Genera', 'NZ Flora', 'Cornell', 'Virginia Tech', 'Minnesota', 'Missouri', 'Oregon State', 'AHDB', 'RHS', 'PMC', 'Troughton', 'Frontiers',
         'Plant Physiol', 'Franks', 'Met Office', 'RMetS', 'Royal Met', 'Asthma', 'Allergy UK', 'PalDat', 'OpenStax', 'Massey', 'Anthony', 'Donahue', 'Bridge and Spooner', 'Hoorman', 'via ', 'Grasses of North America')
def _scrub_str(s):
    def f(m):
        toks = [t.strip() for t in _re.split(r'[;,]', m.group(1))]
        if any(any(a in t for a in _ATTR) for t in toks) and all(len(t.split()) <= 6 and not _re.search(r'\d{2,}', t.replace('PMC', '')) or any(a in t for a in _ATTR) for t in toks): return ''
        return m.group(0)
    prev = None
    while prev != s:
        prev = s; s = _re.sub(r'\s*\(([^()]*)\)', f, s)
    return s.replace(' ,', ',').replace(' .', '.').replace(' ;', ';')
def scrub(o):
    if isinstance(o, str): return _scrub_str(o)
    if isinstance(o, list): return [scrub(x) for x in o]
    if isinstance(o, dict): return {k: (v if k in ('url', 'id', 'from', 'to', 'k', 'type', 'ext', 'refs', 'parents', 'parts', 'related', 'where') else scrub(v)) for k, v in o.items()}
    return o
def spans(rows, xlabel, caption, lo, hi, unit='', log=False, tick_labels=None):
    """Horizontal range chart as a geometry figure: each row is (label, low, high); a span is drawn from low to high on a (log) axis."""
    import math
    f = (lambda v: math.log10(v)) if log else (lambda v: v)
    a, b = f(lo), f(hi); X0, X1 = 36, 96
    px = lambda v: X0 + (f(v) - a) / (b - a) * (X1 - X0)
    n = len(rows); H = 12 * n + 16; sh = []
    ticks = [10 ** k for k in range(math.ceil(a), math.floor(b) + 1)] if log else [lo + (hi - lo) * i / 5 for i in range(6)]
    if tick_labels: ticks = [v for v, _ in tick_labels]
    for t in ticks:
        sh.append({'k': 'line', 'x1': round(px(t), 2), 'y1': 8, 'x2': round(px(t), 2), 'y2': H - 4, 'color': 'dim', 'width': 0.5})
        sh.append({'k': 'text', 'x': round(px(t), 2), 'y': 3, 'text': (dict(tick_labels)[t] if tick_labels else ('%g' % t) + unit), 'size': 10, 'align': 'center'})
    for i, (lab, l, h) in enumerate(rows):
        y = H - 12 - 12 * i
        sh.append({'k': 'text', 'x': 2, 'y': y, 'text': lab, 'size': 10, 'align': 'left'})
        x1, x2 = px(l), px(h)
        if h == l: sh.append({'k': 'circle', 'x': round(x1, 2), 'y': y + 1.5, 'r': 1.1, 'fill': 'accent'})
        else: sh.append({'k': 'rect', 'x': round(x1, 2), 'y': y - 0.5, 'w': round(max(x2 - x1, 0.8), 2), 'h': 4, 'fill': 'accent'})
    return {'type': 'geometry', 'range': [0, 100, 0, H], 'shapes': sh, 'caption': caption}

NODES = []; FIGS = {}
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, related=None, where=None, fig=None, tag=None):
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
