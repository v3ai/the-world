# Shared helpers and sources for the robin cards. Entry point: robin_nodes.py
NODES = []; FIGS = {}
def src(title, url): return {'title': title, 'url': url}
WR = src('European robin (Wikipedia)', 'https://en.wikipedia.org/wiki/European_robin')
BTO = src('Robin: BirdFacts (British Trust for Ornithology)', 'https://www.bto.org/understanding-birds/birdfacts/robin')
WBA = src('Bird anatomy (Wikipedia)', 'https://en.wikipedia.org/wiki/Bird_anatomy')
WFF = src('Flight feather (Wikipedia)', 'https://en.wikipedia.org/wiki/Flight_feather')
WFE = src('Feather (Wikipedia)', 'https://en.wikipedia.org/wiki/Feather')
WPA = src('Passerine (Wikipedia)', 'https://en.wikipedia.org/wiki/Passerine')
PYLE = src('Pyle 2008: A molt primer for birders (Birding), feather tracts and counts', 'https://calgarybirdbandingsociety.org/wp-content/uploads/2024/01/Molt-primer-PYLE-Birding-2008-min.pdf')
WEB = src('Webster and Goff: Variation in the vertebral column and ribs of songbirds (Proc. Indiana Acad. Sci.; 159 birds of 47 species)', 'https://journals.indianapolis.iu.edu/index.php/ias/article/download/8537/8622/14795')
DEL = src('Delhey et al. 2010: Seasonal changes in colour (PLoS ONE; robin, blackbird, blue tit, great tit)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2904367')
FUL = src('Fuller, Warren and Gaston 2007: Daytime noise predicts nocturnal singing in urban robins (Biology Letters)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2390663')
LAC = src('The robins of Dartington (Great British Life), on David Lack\'s fieldwork', 'https://www.greatbritishlife.co.uk/things-to-do/wildlife/robins-of-dartington-7091084')
AIR = src('Airflow through the avian respiratory system, a tracer-gas study of zebra finches and blackbirds (open-access paper)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3763801')
WONG = src('Photochemistry of robin cryptochrome 4a (open-access paper that discusses Xu et al. 2021)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8580466')
XU = src('Xu et al. 2021: Magnetic sensitivity of cryptochrome 4 from a migratory songbird (Nature 594: 535-540)', 'https://doi.org/10.1038/s41586-021-03618-9')
HORE = src('Hore and Mouritsen 2016: The radical-pair mechanism of magnetoreception (Annual Review of Biophysics 45: 299-344)', 'https://doi.org/10.1146/annurev-biophys-032116-094545')
PECT = src('Pecten oculi (Wikipedia)', 'https://en.wikipedia.org/wiki/Pecten_oculi')
SCL = src('Scleral ring (Wikipedia)', 'https://en.wikipedia.org/wiki/Sclerotic_ring')
FEET = src('Bird feet and legs (Wikipedia)', 'https://en.wikipedia.org/wiki/Bird_feet_and_legs')
ORI = src('Origin of birds (Wikipedia)', 'https://en.wikipedia.org/wiki/Origin_of_birds')
BIRD = src('Bird (Wikipedia)', 'https://en.wikipedia.org/wiki/Bird')
PRZ = src('Prinzinger, Pressmar and Schleucher 1991: Body temperature in birds (Comp. Biochem. Physiol. 99A: 499-506)', 'https://www.gwern.net/doc/psychology/animal/bird/1991-prinzinger.pdf')
SYR = src('Syrinx (bird anatomy) (Wikipedia)', 'https://en.wikipedia.org/wiki/Syrinx_(bird_anatomy)')
FLY = src('Bird flight (Wikipedia)', 'https://en.wikipedia.org/wiki/Bird_flight')
UNC = src('Uncinate processes of ribs (Wikipedia)', 'https://en.wikipedia.org/wiki/Uncinate_processes_of_ribs')
KER = src('Keratin (Wikipedia)', 'https://en.wikipedia.org/wiki/Keratin')
STE = src('Steiger et al. 2009: Heart-rate telemetry of a small tropical bird, the spotted antbird (Physiol. Biochem. Zool.)', 'https://doi.org/10.1086/597010')
JRSI = src('The feather\'s multi-functional structure across nano to macro scales inspires hierarchical design (J. R. Soc. Interface 22(225), 2025)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12014240/')
def R(sec, slug, book='BIO'): return [book, sec, slug]
R_BIRD = R('29.5', '29-5-birds'); R_REPT = R('29.4', '29-4-reptiles'); R_GAS = R('39.1', '39-1-systems-of-gas-exchange'); R_BREATH = R('39.3', '39-3-breathing'); R_CIRC = R('40.1', '40-1-overview-of-the-circulatory-system')
R_DIG = R('34.1', '34-1-digestive-systems'); R_VIS = R('36.5', '36-5-vision'); R_CNS = R('35.3', '35-3-the-central-nervous-system'); R_SKEL = R('38.1', '38-1-types-of-skeletal-systems'); R_BONE = R('38.2', '38-2-bone')
R_JOINT = R('38.3', '38-3-joints-and-skeletal-movement'); R_MUSC = R('38.4', '38-4-muscle-contraction-and-locomotion'); R_ATP = R('6.4', '6-4-atp-adenosine-triphosphate'); R_OX = R('7.4', '7-4-oxidative-phosphorylation')
R_EXC = R('41.3', '41-3-excretion-systems'); R_BEH = R('45.7', '45-7-behavioral-biology-proximate-and-ultimate-causes-of-behavior'); R_PRO = R('3.4', '3-4-proteins'); R_HOM = R('33.3', '33-3-homeostasis'); R_ANTISSUE = R('33.2', '33-2-animal-primary-tissues')
R_NEUR = R('35.2', '35-2-how-neurons-communicate'); R_EUK = R('4.3', '4-3-eukaryotic-cells'); R_SENS = R('36.1', '36-1-sensory-processes'); R_HEAR = R('36.4', '36-4-hearing-and-vestibular-sensation'); R_REPR = R('43.1', '43-1-reproduction-methods')
R_AMUS = R('10.2', '10-2-skeletal-muscle', 'ANP'); R_ACON = R('10.3', '10-3-muscle-fiber-contraction-and-relaxation', 'ANP'); R_ABONE = R('6.3', '6-3-bone-structure', 'ANP'); R_ARESP = R('22.1', '22-1-organs-and-structures-of-the-respiratory-system', 'ANP'); R_ADIG = R('23.1', '23-1-overview-of-the-digestive-system', 'ANP')
R_CHORD = R('29.1', '29-1-chordates'); R_PHYL = R('20.2', '20-2-determining-evolutionary-relationships')
MODEL = 'A model built from typical proportions, not a scan.'

def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, related=None, tag=None):
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': 'bio_ecology', 'parents': parents, 'parts': parts or [], 'processes': [], 'summary': summary,
         'layers': {'basics': basics, 'deeper': deeper, 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if related: n['related'] = related
    if dyk: n['did_you_know'] = dyk
    NODES.append(n); return n
