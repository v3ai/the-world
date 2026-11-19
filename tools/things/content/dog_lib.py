# Shared helpers for the dog cards. See dog_nodes.py (the entry point).
NODES = []; FIGS = {}
def src(title, url): return {'title': title, 'url': url}
UKC = src('Labrador retriever breed standard (The Kennel Club, UK)', 'https://www.royalkennelclub.com/breed-standards/gundog/retriever-labrador/')
AKC = src('Labrador retriever breed standard, AKC text reprinted in a book excerpt', 'https://www.dummies.com/article/home-auto-hobbies/pets/dogs/breeds/labrador-retrievers/labrador-retrievers-the-akc-breed-standard-195763/')
VERT = src('Vertebral formula of the dog (open-access paper, Table 2)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11148713/')
DENT = src('Dental formula and carnassial teeth (dvm360 dentistry proceedings)', 'https://www.dvm360.com/view/tighten-your-dentistry-knowledge-proceedings-0')
WDA = src('Dog anatomy (Wikipedia)', 'https://en.wikipedia.org/wiki/Dog_anatomy')
WDS = src('Dog skeleton (Wikipedia)', 'https://en.wikipedia.org/wiki/Dog_skeleton')
WBAC = src('Baculum (Wikipedia)', 'https://en.wikipedia.org/wiki/Baculum')
WHEAR = src('Hearing range (Wikipedia)', 'https://en.wikipedia.org/wiki/Hearing_range')
WTAP = src('Tapetum lucidum (Wikipedia)', 'https://en.wikipedia.org/wiki/Tapetum_lucidum')
WOLF = src('Olfaction (Wikipedia)', 'https://en.wikipedia.org/wiki/Olfaction')
WOR = src('Olfactory receptor (Wikipedia)', 'https://en.wikipedia.org/wiki/Olfactory_receptor')
QUIG = src('Comparison of canine and human olfactory receptor gene repertoires (Quignon et al. 2003, Genome Biology)', 'https://www.jcvi.org/publications/comparison-canine-and-human-olfactory-receptor-gene-repertoires')
OSM363 = src('Taste and smell (OpenStax Biology 2e, 36.3)', 'https://openstax.org/books/biology-2e/pages/36-3-taste-and-smell')
WVNO = src('Vomeronasal organ (Wikipedia)', 'https://en.wikipedia.org/wiki/Vomeronasal_organ')
WRHIN = src('Rhinarium (Wikipedia)', 'https://en.wikipedia.org/wiki/Rhinarium')
WNICT = src('Nictitating membrane (Wikipedia)', 'https://en.wikipedia.org/wiki/Nictitating_membrane')
BEAGLE = src('Cone and rod photoreceptors in the beagle retina (Mol Vis 2008)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2610288')
DVMEYE = src('Vision in dogs and cats (dvm360)', 'https://www.dvm360.com/view/vision-in-dogs-and-cats')
MERCK_SKIN = src('The integumentary system in animals (Merck Veterinary Manual)', 'https://www.merckvetmanual.com/integumentary-system/integumentary-system-introduction/the-integumentary-system-in-animals')
MERCK_T = src('Normal rectal temperature ranges (Merck Veterinary Manual)', 'https://www.merckvetmanual.com/reference-values-and-conversion-tables/reference-guides/normal-rectal-temperature-ranges')
MERCK_HR = src('Resting heart rates (Merck Veterinary Manual)', 'https://www.merckvetmanual.com/reference-values-and-conversion-tables/reference-guides/resting-heart-rates')
MERCK_RR = src('Resting respiratory rates (Merck Veterinary Manual)', 'https://www.merckvetmanual.com/reference-values-and-conversion-tables/reference-guides/resting-respiratory-rates')
MERCK_BV = src('Blood transfusions in animals (Merck Veterinary Manual)', 'https://www.merckvetmanual.com/circulatory-system/blood-groups-and-blood-transfusions/blood-transfusions-in-animals')
HEARTW = src('Heart weight of normal dogs (Veterinaria journal, UFG)', 'https://revistas.ufg.br/vet/article/view/e-43748')
GIPMC = src('Gastrointestinal tract of the dog: stomach and intestine lengths (open-access paper)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9379419')
LIFE = src('Life expectancy of Labrador retrievers in the UK (McGreevy et al. 2018, Canine Genetics and Epidemiology)', 'https://doaj.org/article/3c1bb1583f6a406288e295907487714a')
SCLIP = src('Canine stratum corneum lipids (open-access paper on linoleate and ceramides)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6096565/')
UMN = src('Carnivore muscle lab: thigh muscles (University of Minnesota VANAT)', 'https://vanat.ahc.umn.edu/carnLabs/Lab05/Lab05.html')
MUSC_ARC = src('Muscle fibre area in dog vastus lateralis (Van Boom 2023, Anatomical Record)', 'https://repository.up.ac.za/items/4d4060c4-7be3-4de5-8c78-b6446eabbbb9')
WCOMP = src('Tapetum structure in the dog (Lesiuk and Braekevelt 1983, J Anat)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1171999/')
def R(sec, slug): return ['BIO', sec, slug]
def A(sec, slug): return ['ANP', sec, slug]
def N(id, title, kind, scale, parents, summary, basics, deeper, expert, facts, cert='C1', refs=None, ext=None, dyk=None, openq=None, parts=None, human=None, area='bio_animals'):
    """human: list of (node id of the human card, 'what is the same and what differs')"""
    txt = ''; rel = []
    for h, t in (human or []):
        rel.append(h); txt += ' ' + t
    n = {'id': id, 'title': title, 'kind': kind, 'template': 'thing', 'scale_m': scale, 'area': area, 'parents': parents, 'parts': parts or [], 'processes': [], 'related': rel, 'summary': summary,
         'layers': {'basics': basics, 'deeper': (deeper + txt).strip(), 'expert': expert}, 'facts': facts, 'certainty': cert, 'open_questions': openq or [], 'refs': refs or [], 'ext': ext or []}
    if dyk: n['did_you_know'] = dyk
    NODES.append(n); return n
def blocks(id, nodes, edges, caption, flow=True):
    FIGS[id] = {'type': 'blocks', 'nodes': [{'id': i, 'label': l, 'x': x, 'y': y, **({'color': c} if c else {})} for i, l, x, y, c in nodes], 'edges': [{'from': a, 'to': b, **({'label': lab} if lab else {})} for a, b, lab in edges], 'flow': flow, 'caption': caption}
def bars(id, items, ylabel, caption, logy=False):
    FIGS[id] = {'type': 'bars', 'bars': [{'label': l, 'value': v} for l, v in items], 'ylabel': ylabel, 'caption': caption, **({'logy': True} if logy else {})}
