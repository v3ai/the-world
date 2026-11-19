# Pass 3: corrections after an independent science review. Imported by dog_nodes.py after dog_pass2.
# Each fix asserts that the old text is present, so a stale edit fails loudly. Every source named here was opened and read
# (see the report of this pass).
from dog_lib import *
import dog_pass2 as P2
from dog_pass2 import BY, fix, fact, drop_fact, ext, table, CATAV, COVASA, QUIG03, QUIG05, UMNEXT, OPTICSRC, SCHIMMING

FIGS = P2.FIGS
BY.update({n['id']: n for n in NODES})

# ------------------------------------------------------------------ helpers
def setl(id, where, text):
    n = BY[id]
    if where == 'summary': n['summary'] = text
    else: n['layers'][where] = text
def facts(id, rows): BY[id]['facts'] = [list(r) for r in rows]
def drop_ext(id, *titles_start):
    BY[id]['ext'] = [e for e in BY[id]['ext'] if not any(e['title'].startswith(t) for t in titles_start)]
def related(id, ids): BY[id]['related'] = list(ids)
def human(id, pairs, old_text=None):
    """set the Compare-with links: pairs = [(human node id, sentence)]; old_text = the old appended sentences to strip from the Deeper layer"""
    n = BY[id]; d = n['layers']['deeper']
    if old_text is not None:
        assert old_text in d, (id, old_text); d = d.replace(old_text, '')
    n['layers']['deeper'] = (d.rstrip() + ' ' + ' '.join(t for _, t in pairs)).strip()
    n['related'] = [h for h, _ in pairs]

# ------------------------------------------------------------------ sources
AKCPDF = src('Labrador retriever breed standard (American Kennel Club, official PDF)', 'https://images.akc.org/pdf/breeds/standards/LabradorRetriever.pdf')
for n in NODES:
    n['ext'] = [AKCPDF if e is AKC else e for e in n['ext']]
BOTIGUE = src('Ancient European dog genomes reveal continuity since the Early Neolithic (Botigué et al. 2017, Nature Communications)', 'https://www.nature.com/articles/ncomms16082')
BERG = src('Grey wolf genomic history reveals a dual ancestry of dogs (Bergström et al. 2022, Nature)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9279150/')
LSU = src('How well do dogs and other animals hear? (LSU School of Veterinary Medicine; table of approximate hearing ranges after Fay 1988 and Warfield 1973, dog data from Heffner 1983)', 'https://lsu.edu/vetmed/deafness/hearingrange.php')
MALNIC = src('The human olfactory receptor gene family (Malnic, Godfrey and Buck 2004, PNAS)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC356993/')
JENDRNY = src('Canine olfactory detection and its relevance to medical detection (Jendrny et al. 2021, BMC Infectious Diseases): Table 3', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8375464/')
MCGANN = src('Poor human olfaction is a 19th-century myth (McGann 2017, Science)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5512720/')
FOLIA = src('Hepatic veins of the dog, corrosion casts of 18 livers (Folia Morphologica 2014): the canine liver in six lobes', 'https://journals.viamedica.pl/folia_morphologica/article/view/FM.2014.0071/34254')
CONUS = src('Variation in the position of the conus medullaris and dural sac in adult dogs (Khan et al. 2019, Veterinary Record; MRI of 101 dogs)', 'https://pubmed.ncbi.nlm.nih.gov/31092707/')
CKCS = src('Spinal cord termination in Cavalier King Charles spaniels (J Vet Intern Med 2021): cord ended at L7 in 31 of 48 dogs', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7848331/')
BELTRAN = src('Canine retina has a primate fovea-like bouquet of cone photoreceptors (Beltran et al. 2014, PNAS)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3944008/')
DVMVIS = src('Vision in domestic animals (dvm360 proceedings)', 'https://dvm360.com/view/vision-domestic-animals-proceedings')
IMAIOS = src('Brachiocephalic muscle (IMAIOS vet-anatomy atlas)', 'https://www.imaios.cn/en/vet-anatomy/anatomical-structures/brachiocephalic-muscle-11077963028')
CLAV = src('Anatomic and radiologic observations of the clavicle of adult dogs (McCarthy and Wood 1988, Am J Vet Res)', 'https://pubmed.ncbi.nlm.nih.gov/3400932/')
WYLIE = src('Wylie cephalometric analysis in Labrador retrievers (CT of 146 Labrador heads)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13624093/')
SKULLBASE = src('Labrador retriever skull, specimen data (Skull Base)', 'http://skullbase.info/skulls/dogs/labrador_retriever.php')
OSM191 = src('Heart anatomy (OpenStax Anatomy and Physiology 2e, 19.1)', 'https://openstax.org/books/anatomy-and-physiology/pages/19-1-heart-anatomy')
# corrections to sources defined earlier (same objects are shared by many cards)
QUIG05['title'] = 'The dog and rat olfactory receptor repertoires (Quignon et al. 2005, Genome Biology 6:R83): 1,094 dog genes, 20.3 % of them pseudogenes'
WCOMP['title'] = 'Fine structure of the canine tapetum lucidum (Lesiuk and Braekevelt 1983, Journal of Anatomy)'; WCOMP['url'] = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1171936/'
MUSC_ARC['title'] = 'Fiber type and metabolic characteristics of skeletal muscle in 16 breeds of domestic dogs (Van Boom et al. 2023, Anatomical Record): mean fibre area 1,763 ± 697 µm²'
SCHIMMING['title'] = 'Craniometric measurements in dogs: mesaticephalic skulls (Schimming and Pinto e Silva 2013): 25 mongrel skulls, mean length about 178 mm'
WHEAR['title'] = 'Hearing range (Wikipedia)'

# ------------------------------------------------------------------ 1. whole dog: domestication
BY['dog']['did_you_know'] = 'Dogs share an extinct wolf-like ancestor with today\'s wolves, not the wolf you can meet now. The oldest remains that researchers accept as dogs are about 14,000-15,000 years old (a jaw from Bonn-Oberkassel, Germany). Genetic estimates put the origin earlier, and when, where and in how many events it happened is still debated.'
BY['dog']['open_questions'] = ['When, where and in how many events were dogs first domesticated? Genetic estimates of 20,000-40,000 years ago (Botigué 2017) are older than the oldest remains everyone accepts, and a 2022 study of 72 ancient wolf genomes found that dogs trace to eastern Eurasian wolves but that none of the ancient genomes is a direct match for their ancestors.']
ext('dog', BOTIGUE, BERG)
fix('dog', 'deeper', 'It cools itself by panting, not by sweating.', 'It cools itself mainly by panting, much more than by sweating.')
fix('dog', 'basics', 'Almost every bone and organ has a counterpart in you, so each card says what is the same and what differs.', 'Almost every bone and organ has a counterpart in you, so each card says what is the same and what differs; where the human explorer has no matching card, it says so in words.')
FIGS['dog']['caption'] = 'One species, a huge range of sizes. The model stands for a medium, athletic breed; the body plan is the same in all. Dogs descend from an extinct wolf-like population that no living wolf represents exactly; the date, place and number of domestication events are debated.'
FIGS['dog']['nodes'][0]['label'] = 'Extinct wolf-like ancestor'
for f in BY['dog']['facts']:
    if f[0] == 'Vertebrae': f[1] = '7 neck, 13 chest, 7 lower back, 3 fused sacral, about 20-23 tail'

# ------------------------------------------------------------------ 2. spinal cord
setl('dog_spinal_cord', 'summary', 'A cable of nerve tissue runs inside the backbone from the brain to the lower back, carrying signals both ways; nerves for the hind legs and tail leave it and run on backward.')
setl('dog_spinal_cord', 'deeper', 'It is protected by the vertebrae. In dogs the working cord ends in the lower back, at about the junction of the sixth and seventh lumbar vertebrae, about one vertebra further back in small dogs (under 7 kg). Beyond its end the nerve roots for the hind legs and tail stream backward inside the vertebral canal as a bundle, the cauda equina.')
setl('dog_spinal_cord', 'expert', 'The cord tapers to a point (the conus medullaris) and ends in a thin thread (the filum terminale) inside a sac of the membrane around it (the dural sac), which ends further back. In an MRI study of 101 dogs the end of the cord lay further forward as the dog\'s body weight rose, while the end of the sac stayed at about the same place; in 48 Cavalier King Charles spaniels, a breed whose cord is known to end further back than in other dogs, it ended at the sixth lumbar vertebra in one, the seventh in 31 and in the sacrum in 15. The model draws a smooth tube of one width from the skull to the last lumbar vertebra; the real cord is thicker where the nerves for the limbs leave it, in the neck and in the lower back.')
facts('dog_spinal_cord', [['Where the cord ends', 'lower back, about L6-L7, further forward in larger dogs'], ['Role', 'two-way signal cable']])
UMNSC = src('Spinal cord gross anatomy (University of Minnesota veterinary anatomy, neuroanatomy lab)', 'https://vanat.ahc.umn.edu/neurLab2/SpCdGross.html')
ext('dog_spinal_cord', UMNSC, CONUS, CKCS)
human('dog_spinal_cord', [('spinal_cord', 'In people: the same organ, 31 pairs of nerves.')])

# ------------------------------------------------------------------ 3. sweat glands (Merck Veterinary Manual: integumentary system)
setl('dog_gland', 'summary', 'Two kinds of gland open into the follicles: oil glands and sweat glands of the apocrine type. The other kind of sweat gland, the one people cool with, is found only on the paw pads.')
setl('dog_gland', 'basics', 'The oil from sebaceous glands waterproofs hair. Apocrine (epitrichial) sweat glands are attached to the follicles over the body. The paw pads have the other kind of sweat gland, which opens straight onto the skin.')
setl('dog_gland', 'deeper', 'A dog does have sweat glands in the body skin: apocrine (also called epitrichial) glands lie with the hair follicles, while the other kind (atrichial, the type people have all over their skin) is present only on the paw pads. Some clinical evidence suggests that limited sweating occurs in dogs and may play a minor part in cooling; dogs cool mainly by panting and drooling.')
facts('dog_gland', [['Sweat glands at the follicles', 'apocrine (epitrichial), over the hairy skin'], ['Sweat glands opening on the skin surface', 'paw pads only']])
ext('dog_gland', MERCK_SKIN)
setl('dog_follicle', 'deeper', 'Each follicle has a root bulb where cells divide, a sebaceous gland that oils the hair, and an apocrine sweat gland. The follicle cycles between growth, rest and shedding. A central hair is surrounded by about 3-15 smaller hairs, all leaving through one pore.')
setl('dog_follicle', 'expert', 'In people, sweat glands of the apocrine kind are limited to a few regions; in dogs they lie with the follicles over most of the body.')
fix('dog_coat', 'deeper', 'Sweat glands of the usual (merocrine) kind exist on the paw pads only; the glands that come with the hair follicles are of the scent-producing (apocrine) kind, so dogs do not cool by sweating over the body.',
    'Sweat glands that open straight onto the skin (the atrichial kind, like most human ones) exist on the paw pads only; the sweat glands that come with the hair follicles are of the apocrine kind. Some clinical evidence suggests limited sweating in dogs plays a minor part in cooling, and dogs cool mainly by panting.')
fix('dog_coat', 'deeper', 'about 3-15 smaller hairs may join one central hair', 'a central hair is surrounded by about 3-15 smaller hairs (Merck Veterinary Manual)')
fix('dog_coat', 'deeper', ' Hair follows a growth cycle (growing, regressing, resting), and dogs shed mostly in early spring and early autumn.', ' Hair follows a growth cycle (growing, regressing, resting).')
fix('dog_coat', 'basics', ' A Labrador\'s coat is short and dense and sheds water, which is why the breed can swim in cold water for long periods.', ' A Labrador\'s coat is short, dense and water-resistant (breed standard).')
facts('dog_coat', [['Coat', 'short, dense, weather-resistant double coat (breed standard)'], ['Hairs per compound follicle', 'one central hair with about 3-15 smaller hairs (Merck)'], ['Sweat glands', 'atrichial type on the paw pads only; apocrine type at the follicles']])
setl('dog_undercoat', 'basics', 'It traps a layer of air, so it insulates. Dogs shed it in cycles.')
fix('dog_pads', 'deeper', 'They are the only place a dog has the ordinary kind of sweat gland (merocrine), so wet pawprints on a hot day or when stressed are sweat.', 'They are the only place on a dog\'s body with sweat glands of the atrichial kind, which open straight onto the skin.')
fix('dog_pads', 'expert', 'The paws are a route for losing a little heat, but panting does most of the cooling.', 'Dogs cool mainly by panting.')
fix('dog_tongue', 'deeper', 'this is how dogs cool themselves because they can sweat only through their pads.', 'this is how dogs cool themselves, because sweating plays at most a minor part (the sweat glands that open on the skin are only on the pads).')
FIGS['dog_tongue']['nodes'][2]['label'] = 'Water evaporates from tongue, mouth and nose lining'
FIGS['dog_tongue']['caption'] = 'How a dog cools by panting: sweating plays at most a minor part in a dog, so evaporation from the wet surfaces of the mouth and nose does most of the work.'
# the human link: apocrine glands exist in people too, so say what is the same
human('dog_gland', [('sweat_gland', 'In people: sweat glands all over the skin of the atrichial (eccrine) kind are the main way people cool.')])
# ------------------------------------------------------------------ 4. liver
setl('dog_liver', 'deeper', 'The same organ as in people, with the same functions. Most descriptions divide the dog\'s liver by deep fissures into six lobes: left lateral, left medial, quadrate, right medial, right lateral and caudate (other textbooks group them differently, as four lobes with sub-lobes).')
setl('dog_liver', 'expert', 'The model draws three lobes fused, a simplification of the six real lobes; its shape and size are approximate.')
facts('dog_liver', [['Lobes', '6 in a dog (the model draws 3, fused)'], ['Role', 'metabolism, bile, detoxification']])
ext('dog_liver', FOLIA)
human('dog_liver', [('liver', 'In people: the same organ with the same functions, but divided differently into lobes.')])
# ------------------------------------------------------------------ 5, 6. smell genes, area and cells
GENES = '≈ 870 intact genes in the dog (1,094 genes, 20.3 % pseudogenes; Quignon 2005) against ≈ 330-340 in a person (≈ 900 genes with 63 % pseudogenes, Quignon 2003; 339 intact genes counted directly, Malnic 2004). The counts come from different genomes and methods.'
for i in ('dog_turb_olf', 'dog_osn'):
    for f in BY[i]['facts']:
        if f[0].startswith('Intact receptor genes'): f[1] = GENES
    ext(i, MALNIC)
fix('dog_turb_olf', 'deeper', 'A dog has about 870 intact smell-receptor genes, people about 330 (calculated from gene counts and pseudogene fractions in two papers); the rest are pseudogenes, broken copies.',
    'A dog has about 870 intact smell-receptor genes (1,094 genes in the sequenced boxer genome, of which 20.3 % are pseudogenes, broken copies; an earlier estimate was about 1,300 genes). People have about 330-340 intact genes: one paper counted about 900 genes with 63 % pseudogenes, another counted 339 intact genes directly. The dog and human counts come from different genomes and methods, so they are approximate.')
fix('dog_osn', 'deeper', 'A dog has about 870 intact receptor genes, a person about 330 (calculated from gene counts and pseudogene fractions in two papers).', 'A dog has about 870 intact receptor genes and a person about 330-340 (see the Turbinates card for where these counts come from and how uncertain they are).')
setl('dog_turb_olf', 'deeper', BY['dog_turb_olf']['layers']['deeper'].replace('In a dog the lining area is about 170 cm² (one reference) compared with about 5-10 cm² in a person, and the lining holds hundreds of millions of receptor cells (a secondary source gives about 125-300 million for dogs and about 5 million for people).',
    'The area of a dog\'s smell lining depends on the breed: about 95-126 cm² is quoted for German shepherds in a 2021 review and about 170 cm² for some dogs, against about 5 cm² (OpenStax) to 10 cm² (Wikipedia) in a person. The number of receptor cells is uncertain: the review gives 200-300 million for dogs, a textbook about 1 billion for most dogs and about 12 million for people.'))
assert 'German shepherds' in BY['dog_turb_olf']['layers']['deeper']
setl('dog_turb_olf', 'expert', 'Dogs sniff in short bursts, and the nasal passage divides the air into a route for smell and a route to the lungs.')
facts('dog_turb_olf', [['Lining area', '≈ 95-170 cm² in dogs (varies with breed) vs ≈ 5-10 cm² in a person'], ['Receptor cells', '≈ 200 million to ≈ 1 billion in dogs (sources differ) vs ≈ 12 million in a person (textbook)'], ['Intact receptor genes', GENES]])
BY['dog_turb_olf']['open_questions'] = ['How many receptor cells does a dog have? Published estimates differ by a factor of about five (200-300 million in a 2021 review, about 1 billion in a textbook) and are old.']
ext('dog_turb_olf', JENDRNY)
drop_ext('dog_turb_olf', 'The sense of smell: dogs or us (RAPS)')
FIGS['dog_turb_olf'] = {'type': 'bars', 'bars': [{'label': 'dog (intact genes, ≈)', 'value': 870}, {'label': 'human (intact genes, ≈)', 'value': 339}], 'ylabel': 'intact smell-receptor genes',
  'caption': 'Dog: about 870, calculated from Quignon et al. 2005 (1,094 genes, 20.3 % of them pseudogenes). Human: 339 intact genes counted directly by Malnic et al. 2004; Quignon et al. 2003 give about 900 genes with 63 % pseudogenes, which is about 330 intact. The dog and human counts come from different genomes and methods, so treat them as approximate. The lining area is in the text.'}
# ------------------------------------------------------------------ 7. tapetum
setl('dog_tapetum', 'basics', 'This is something you do not have. Light that passes through the retina without being caught hits the tapetum and is reflected back through the retina for a second chance. That is why dog eyes glow yellow-green in a torch beam or car headlights.')
setl('dog_tapetum', 'deeper', 'The tapetum of a dog lies in the upper half of the back of the eye, between the choroid and the retinal pigment layer (it is in the choroid, not in the retina itself). In summaries of the structure it has 9-20 layers of flat, rectangular cells holding zinc-rich rods lined up in parallel. It looks yellow-green in adult dogs and blue in puppies until about four months old. Cats\' tapeta contain riboflavin as well as zinc; the dog\'s rods contain zinc.')
setl('dog_tapetum', 'expert', 'In the dog the reflecting rods (rodlets) are about as big as a cat\'s but more closely packed, which sets the wavelength they reflect best, and they are less precisely lined up than in the cat, which appears to make the reflection less efficient (Lesiuk and Braekevelt 1983). The reflecting layer thins toward the edge of the eye. The tapetum scene is reached with the button on the retina or tapetum card.')
facts('dog_tapetum', [['Position', 'upper half of the fundus'], ['Layers', '9-20 cell layers'], ['Cell contents', 'zinc-rich rodlets'], ['Colour', 'typically yellow-green in adults, blue in puppies']])
BY['dog_tapetum']['open_questions'] = []
setl('dog_tapetal_cells', 'expert', 'In the scene the cells are drawn flat and rectangular; their sizes there are illustrative.')
BY['dog_tapetal_cells']['open_questions'] = []
drop_ext('dog_tapetum', 'Tapetum lucidum (Wikipedia)'); ext('dog_tapetum', WTAP)
# ------------------------------------------------------------------ 8. muscle fibre size
FIBRE = '≈ 1,760 µm² (mean of 1,763 ± 697 SD; triceps and vastus lateralis together; 35 adult dogs of 16 breeds)'
fact('dog_m_quadriceps', 'Fibre cross-section (vastus lateralis)', FIBRE)
BY['dog_m_quadriceps']['facts'][0][0] = 'Muscle fibre cross-section'
fact('dog_muscle_fibre', 'Cross-section', FIBRE)
fact('dog_muscle_scene', 'Fibre cross-section', FIBRE)
for f in BY['dog_muscle_scene']['facts']:
    if f[0].startswith('Equivalent diameter'): f[1] = '≈ 47 µm (calculated from the mean area)'
setl('dog_muscle_scene', 'basics', 'A muscle is a bundle of bundles. Each fibre is a single long cell with many nuclei along its edge, packed with contracting threads. Nerves tell it to contract; capillaries bring oxygen. Click a fibre.')
setl('dog_muscle_scene', 'deeper', 'The fibre widths in the scene are drawn from the mean fibre area measured in muscle samples from 35 adult dogs of 16 breeds (1,763 ± 697 µm², triceps brachii and vastus lateralis together, so about 47 µm across if round; Van Boom et al. 2023). Fibres in dogs are smaller than in people, and there was a large spread between dogs and breeds. Everything else in the scene is illustrative.')
fix('dog_muscle_scene', 'expert', 'Fibre types (slow I, fast IIA, IIX) did not differ in size in the study cited.', 'Fibre types (slow I, fast IIA, IIX) did not differ in size in the study cited, and the two muscles did not differ.')
# ------------------------------------------------------------------ 9. skull and jaw
facts('dog_skull', [['Skull length', '≈ 20 cm in this model, back of the skull to the front teeth (published skull lengths depend on breed and landmark: 17.8 ± 1.6 cm in 25 mesaticephalic mongrels; 24.2 cm in one adult male Labrador)'], ['Skull width', '≈ 11 cm across the cheekbones in this model (9.5 cm in the mongrels, 13.0 cm in the Labrador)'], ['Teeth', '42']])
ext('dog_skull', SKULLBASE, WYLIE)
fix('dog_skull', 'expert', 'The length of the skull from the back to the stop is drawn about equal to the length of the muzzle from the stop to the nose.', 'The length of the skull from the back to the stop is drawn about equal to the length of the muzzle from the stop to the nose (breed standard: skull and foreface of approximately equal length). The model\'s lower jaw is about 16 cm from the hinge to the chin; a CT study of 146 Labrador heads gives about 15.5 cm for that distance.')
fix('dog_mandible', 'expert', 'the lower teeth sit', 'the model\'s jaw is about 16 cm long from the hinge to the chin (a CT reference for Labradors: about 15.5 cm), and the lower teeth sit')
ext('dog_mandible', WYLIE)
# ------------------------------------------------------------------ 10. olfactory bulbs
setl('dog_bulbs', 'expert', 'A dog\'s olfactory bulbs are proportionally larger than a person\'s. But the human bulb is large in absolute terms and holds a similar number of neurons to the bulbs of other mammals (McGann 2017, a review), so the dog\'s better sense of smell is not explained by bulb size alone. The number of receptor genes and cells, the area of the lining and what the rest of the brain does with the signal all matter, and how much each contributes is debated.')
drop_ext('dog_bulbs', 'The human nose knows more'); ext('dog_bulbs', MCGANN, JENDRNY)
# ------------------------------------------------------------------ 11. process voice
setl('dog_ear', 'deeper', 'Many small muscles move a dog\'s ear, so a dog with prick ears can swivel them toward a sound. In one comparison table dogs hear from about 67 Hz to about 45 kHz and people from about 64 Hz to about 23 kHz, both on the same cut-off criteria (the often-quoted human range is 20 Hz to 20 kHz). The range depends on how loud the test tone is: a loud enough tone can be heard outside it, and the dog values come from one dog of each of four breeds (Heffner 1983). Floppy ears like the Labrador\'s are common in domesticated animals and are thought to be a by-product of domestication (an idea that is still debated); the cartilage of the flap is the same.')
setl('dog_ear', 'expert', 'The pinna is elastic cartilage covered in skin and hair. Sound waves are funnelled into the vertical and then horizontal parts of the ear canal to the eardrum.')
facts('dog_ear', [['Hearing range, dog', '≈ 67 Hz to 45 kHz (one dog each of four breeds; depends on the loudness of the test tone)'], ['Hearing range, human', '≈ 64 Hz to 23 kHz on the same criteria (the usual round figure is 20 Hz to 20 kHz)']])
ext('dog_ear', LSU); drop_ext('dog_ear', 'Hearing range (Wikipedia)')
bars('dog_ear', [('dog: lowest sound (Hz)', 67), ('human: lowest sound (Hz)', 64), ('dog: highest sound (Hz)', 45000), ('human: highest sound (Hz)', 23000)], 'frequency (Hz)', 'Approximate range of hearing from one comparison table that applies the same cut-off criteria to every species (LSU School of Veterinary Medicine). Dogs hear higher sounds than people; the low end is about the same. Ranges depend on the loudness of the test tone and on the individual.', logy=True)
setl('dog_cochlea', 'deeper', 'In one comparison table a dog hears from about 67 Hz to about 45 kHz, a wider range than a person (about 64 Hz to 23 kHz on the same criteria). The range depends on the loudness of the test tone and on the individual.')
facts('dog_cochlea', [['Hearing range', '≈ 67 Hz to 45 kHz (depends on the test tone and the dog)']])
ext('dog_cochlea', LSU); drop_ext('dog_cochlea', 'Hearing range (Wikipedia)')
bars('dog_cochlea', [('elephant', 12000), ('human', 23000), ('dog', 45000), ('cat', 64000), ('mouse', 91000)], 'highest audible sound (Hz)', 'Upper limit of hearing from one comparison table that applies the same cut-off criteria to every species (LSU School of Veterinary Medicine: elephant 12 kHz, human 23 kHz, dog 45 kHz, cat 64 kHz, mouse 91 kHz). The limits depend on the loudness of the test tone, the method and the individual.', logy=True)
setl('dog_ear_canal', 'basics', 'Sound goes down the vertical part of the canal and then turns inward.')
setl('dog_eye', 'summary', 'The dog\'s eye works like yours, with a mirror layer behind the retina that gives dogs better vision in dim light.')
fix('dog_eye', 'deeper', 'A dog\'s sharpness (acuity) is lower than a person\'s, about 20/75 in a common estimate.', 'A dog\'s sharpness (acuity) is lower than a person\'s, about 20/75 in a common estimate. The retina has an area of higher cone density (the area centralis) but no foveal pit; in a dog the cones there are packed about as densely as at a primate fovea.')
fix('dog_eye', 'expert', 'so the field of view is wide with a smaller region seen by both eyes (the numbers were not checked here).', 'so the field of view is wide with a smaller region seen by both eyes than in people.')
facts('dog_eye', [['Eyeball width (model)', '2.2 cm (the size drawn, not measured on a real dog)'], ['Cone types', '2 (peaks ≈ 429 and ≈ 555 nm)'], ['Visual acuity', '≈ 20/75 (estimate)']])
ext('dog_eye', BELTRAN, DVMVIS)
setl('dog_lens', 'basics', 'The cornea does most of the bending of light; the lens adds the finer, adjustable focus.')
setl('dog_lens', 'deeper', 'The same structure as the human lens.')
drop_fact('dog_muscles', 'Skeletal muscle share of body mass')
setl('dog_brain', 'expert', 'The model is built from a typical shape of the brain; its size, folds and relative proportions are approximate.')
setl('dog_kidneys', 'expert', 'The model draws two simple bean shapes.')
setl('dog_fur', 'expert', 'Keratin is a family of fibrous proteins that form bundles called intermediate filaments, held together by disulfide bonds. The same proteins make claws and the outer skin.')
setl('dog_skin_scene', 'expert', 'Every size in the scene is illustrative. What is real is the arrangement of the layers, the compound follicles and the types of gland.')
setl('dog_olfactory_epithelium', 'expert', 'All sizes are illustrative. The layers and cell types are as in a mammal\'s smell lining.')
setl('dog_follicle', 'expert', 'All the hairs of one follicle leave through a common pore.')
# ------------------------------------------------------------------ 12. gait
BY['dog_gait']['facts'] = [['Gaits described', 'walk (lateral sequence), trot (diagonal), gallop (transverse); the figure draws only the walk and the trot'], ['Stance part of the cycle', '≈ 58 % at a walk (mean of six dogs); shorter at the trot and gallop (Catavitello et al. 2015)']]
fix('dog_gait', 'deeper', 'How long each foot stays down (the duty factor) is more than half the stride at a walk and less than half at a trot or a gallop.', 'How long each foot stays down (the stance part of the stride) is longest at the walk and shorter at the trot and the gallop.')
setl('dog_gait', 'expert', 'In a study of six Labrador and Golden Retrievers (about 35 kg and 57 cm at the withers) the dogs walked with a lateral sequence of footfalls, trotted with synchronized diagonal limbs and galloped transversely, with an aerial phase; the stance lasted about 58 % of the walking cycle and was shorter in the other gaits. The figure draws idealised timing for the walk (even spacing of the four footfalls and the 58 % stance) and for a fast trot (the 45 % stance is illustrative); real strides vary with speed, breed and the individual dog, and the gallop is described here but not drawn. The model does not animate legs; only the tail wag and the breathing and heartbeat are moved.')
# the figure: walk 58 %, fast trot
for sh in FIGS['dog_gait']['shapes']:
    if sh.get('k') == 'text' and sh.get('text', '').startswith('Walk'): sh['text'] = 'Walk (lateral sequence): stance about 58 % of the stride'
    if sh.get('k') == 'text' and sh.get('text', '').startswith('Trot'): sh['text'] = 'Fast trot (diagonal pairs): stance about 45 % (illustrative)'
FIGS['dog_gait']['shapes'] = [s for s in FIGS['dog_gait']['shapes'] if s.get('k') != 'rect' or s['y'] < 40]
_st = P2.stance
_new = []
_walk = {'left front': .25, 'right front': .75, 'left hind': 0, 'right hind': .5}
for i, nm in enumerate(['left front', 'right front', 'left hind', 'right hind']):
    y = 52 + 10 - i * 5.2; _new += _st(y, _walk[nm], .58, 'accent' if 'front' in nm else 'orange')
FIGS['dog_gait']['shapes'] += _new
FIGS['dog_gait']['caption'] = 'Idealised footfall timing over one stride (left to right, 0-100 %); a bar is a foot on the ground. Only the order of the footfalls (lateral walk, diagonal trot) and the walking stance of about 58 % come from the study cited; the even spacing and the trot\'s 45 % are illustrative. The gallop is described on the card but not drawn.'

# ------------------------------------------------------------------ 13. tarsus (model now draws 7 bones)
setl('dog_tarsus', 'expert', 'The model draws all seven tarsal bones as simple shapes: the heel bone (calcaneus), the talus, a central bone and four small distal bones (the small ones are balls).')
# ------------------------------------------------------------------ 14. brachiocephalicus
setl('dog_m_brachiocephalicus', 'deeper', 'It is not special to dogs: it is found in dogs and other animals that have no working collarbone, where it joins the neck and head to the arm. A thin remnant of the collarbone lies in a faint line across the muscle, the clavicular intersection: in a study of 50 adult dogs of 10 breeds the clavicle had ossified in 96 %, attached to this intersection.')
drop_ext('dog_m_brachiocephalicus', 'Dog and cat anatomy lab guide'); ext('dog_m_brachiocephalicus', IMAIOS, CLAV)
facts('dog_m_brachiocephalicus', [['Parts', '3: the cleidobrachialis (to the upper arm) and two parts of the cleidocephalicus (to the neck and to the skull), joined at the clavicular intersection']])
human('dog_m_brachiocephalicus', [('deltoid', 'In people: no single equivalent. The part to the arm (the cleidobrachialis) is counted as the clavicular part of the deltoid, and the part to the head compares with the collarbone head of the sternocleidomastoid; the human explorer has cards for the deltoid and the sternocleidomastoid.')])
related('dog_m_brachiocephalicus', ['deltoid', 'sternocleidomastoid'])
# ------------------------------------------------------------------ minor findings
setl('dog_organs', 'deeper', 'A dog has the same main organs as you, though the model leaves some out (the pancreas, gall bladder, thyroid and adrenal glands). The main difference is posture: they hang from a horizontal spine, not stacked on a vertical one.')
fix('dog_small_intestine', 'deeper', ', shorter in proportion to the body than a plant eater\'s because meat is easy to digest.', '.')
fix('dog_veins', 'basics', 'Blood in them has lost most of its oxygen, except in the pulmonary veins from the lungs.', 'Blood in them has less oxygen than blood in the arteries, except in the pulmonary veins from the lungs.')
fix('dog_rv', 'deeper', 'Its wall is thinner than the left because the lungs are close and the pressure is lower.', 'Its wall is thinner than the left because the circuit to the lungs is shorter and offers less resistance, so the pressure is lower.')
ext('dog_rv', OSM191)
fact('dog_heart', 'Heart mass / body mass', '0.6-1.1 % (30 adult dogs, mostly mixed breeds)')
setl('dog_trachea', 'deeper', 'It has the same design as the human windpipe: C-shaped rings of cartilage with a soft muscle strip on the back. The number of rings varies from dog to dog.')
setl('dog_trachea', 'expert', 'The model draws 35 rings, a typical-looking number, not a measured one.')
facts('dog_trachea', [['Rings', 'C-shaped cartilage rings (the model draws 35)']])
drop_ext('dog_trachea', 'Dog organ anatomy (AnatomyLearner)')
fix('dog_lungs', 'expert', 'Resting breathing is 18-34 breaths a minute, normal body temperature about 37.5-39.2 C. The lungs', 'Resting breathing is 18-34 breaths a minute. The lungs')
drop_ext('dog_lungs', 'Normal rectal temperature')
setl('dog_scapula', 'deeper', 'Same bone as in people. A ridge (the spine of the scapula) runs along the blade; the shoulder joint is at the lower end of the blade itself, not on the ridge. In people the scapula is on the back and braced by the collarbone; in the dog it stands on the side of the chest.')
setl('dog_dewclaw', 'summary', 'The dewclaw is the dog\'s thumb: a small toe on the inner side of the foreleg, set higher up than the other toes.')
fix('dog_claws', 'deeper', ' The dewclaw (the first toe) on the inner side of the foreleg often does not touch the ground.', ' The dewclaw (the first toe) sits higher on the inner side of the foreleg than the other toes.')
fix('dog_thoracic', 'deeper', 'The thoracic vertebrae are alike from dog to dog (13)', 'The thoracic vertebrae number 13 in almost every dog')
setl('dog_lumbar', 'expert', 'In one study of 89 dogs, 4 (4.5 %) had a transitional or extra lumbar vertebra (a supernumerary L8, or the last lumbar vertebra fused with the sacrum).')
BY['dog_baculum']['refs'] = []
# hearing: no true human counterpart card for the ear parts; say so in words
for i, t in [('dog_ear', 'In people the outer ear is a smaller, fixed flap; few people can move it. The human explorer has no card for the ear yet.'),
             ('dog_ear_canal', 'In people the canal is shorter and almost straight. The human explorer has no card for the ear yet.'),
             ('dog_eardrum', 'In people: the same part. The human explorer has no card for the ear yet.'),
             ('dog_bulla', 'In people: the same chain of three bones; there is no bulla bulge. The human explorer has no card for the ear yet.'),
             ('dog_cochlea', 'In people: the same inner ear, with a narrower range of hearing. The human explorer has no card for the ear yet.')]:
    n = BY[i]
    d = n['layers']['deeper']
    for old in ['In people the outer ear is a smaller, fixed flap; few people can move it.', 'In people the canal is shorter and almost straight.', 'In people: the same part.', 'In people: the same chain of three bones; there is no bulla bulge.', 'In people: the same inner ear; the range of hearing is narrower.']:
        d = d.replace(' ' + old, '')
    n['layers']['deeper'] = (d.rstrip() + ' ' + t).strip(); n['related'] = []
# muscles: only true counterparts are linked
def nolink(id, text, old):
    n = BY[id]; d = n['layers']['deeper']; assert old in d, (id, old); n['layers']['deeper'] = (d.replace(' ' + old, '') + ' ' + text).strip(); n['related'] = []
nolink('dog_m_face_muscles', 'In people: the muscles of facial expression, in the same place but more finely controlled. The human explorer has no card for them yet.', 'In people: the muscles of facial expression, in the same place but more finely controlled.')
nolink('dog_m_neck_dorsal', 'In people the equivalent neck extensors (such as the splenius) are smaller because the head balances on top of the spine; the human explorer has no card for them yet.', 'In people: the equivalent neck extensors are smaller because the head balances on top of the spine.')
nolink('dog_m_adductors', 'In people: the adductors on the inner thigh; the human explorer has no card for them yet.', 'In people: the adductors on the inner thigh.')
nolink('dog_m_supraspinatus', 'In people: the supraspinatus and infraspinatus are part of the rotator cuff; the human explorer has no card for the rotator cuff yet.', 'In people: the supraspinatus and infraspinatus are part of the rotator cuff.')
nolink('dog_m_tail_muscles', 'In people there are only small muscles in the pelvic floor; the human explorer has no card for them yet.', 'In people: only small muscles in the pelvic floor.')
nolink('dog_m_tensor', 'In people: the tensor fasciae latae and sartorius are in the same area; the human explorer has no card for them yet.', 'In people: the tensor fasciae latae and sartorius are in the same area.')
nolink('dog_m_back_extensors', 'In people: the erector spinae along the spine; the human explorer has no card for them yet.', 'In people: the erector spinae along the spine.')
nolink('dog_m_shin_muscles', 'In people: the same group on the shin; the human explorer has no card for it yet.', 'In people: the same group on the shin.')
nolink('dog_m_chest_wall', 'In people: the intercostal muscles move the ribs as well, but the serratus anterior is smaller; the human explorer has no card for them yet.', 'In people: the intercostal muscles move the ribs as well, but the serratus anterior is smaller.')
nolink('dog_m_temporalis', 'In people: the temporalis closes the jaw too, but chewing is grinding, so sideways muscles matter more; the human explorer has no card for the chewing muscles yet.', 'In people: the temporalis closes the jaw too, but chewing is grinding, so sideways muscles matter more.')
nolink('dog_m_masseter', 'In people: also the masseter; the human explorer has no card for it yet.', 'In people: also the masseter.')
nolink('dog_baculum', 'People have no baculum.', 'No counterpart in people.')
nolink('dog_caudal', 'In people the tailbone (coccyx) is the equivalent, a few small fused bones at the end of the sacrum; the human explorer has no card for it yet.', 'In people the tailbone (coccyx) is the equivalent, a few small fused bones inside the pelvis.')
nolink('dog_claws', 'People have flat nails on the same last toe bones; the human explorer has no card for nails yet.', 'People have flat nails on the same last toe bones.')
nolink('dog_basal', 'The human explorer has no card for the stem cells of the smell lining (its stem cell card is about blood-forming stem cells).', 'Compare the human stem cell.')
# padding facts that only repeat the title
for n in NODES:
    if n['id'].startswith('dog_m_'):
        n['facts'] = [f for f in n['facts'] if not (f[0] == 'Muscle' and f[1] == n['title'])]
for i in ('dog_lv', 'dog_rv', 'dog_la', 'dog_ra'): BY[i]['facts'] = [f for f in BY[i]['facts'] if f[0] != 'Chamber']
for n in NODES: n['facts'] = [f for f in n['facts'] if not (f[0] == 'Counterpart' and str(f[1]).startswith('human '))]
# muscle basics that claimed more than the sources say
setl('dog_m_fore_flexors', 'basics', 'They bend the wrist and the toes.')
# the retina scene
fix('dog_retina_scene', 'deeper', 'the numbers of cells and the thickness are illustrative, except for the ratio of rods to cones (about 23 to 1 at the sharpest spot), drawn as about 20 to 1.', 'the numbers of cells and the thickness are illustrative, except that the ratio of rods to cones (about 23 to 1 at the sharpest spot) is drawn as about 20 to 1.')
# the whole-dog size labels
for f in BY['dog']['facts']:
    if f[0] == 'Body length (model)': f[1] = '≈ 67 cm from the point of the shoulder to the point of the buttock, about 1.18 times the height (AKC: equal to or slightly longer than the height); about 1.15 m from nose to tail tip'

# ------------------------------------------------------------------ source hygiene
drop_ext('dog_turb_olf', 'Comparison of canine and human olfactory receptor gene repertoires (Quignon et al. 2003, Genome Biology)')
drop_ext('dog_osn', 'Comparison of canine and human olfactory receptor gene repertoires (Quignon et al. 2003, Genome Biology)')
ext('dog_ear', WHEAR); ext('dog_cochlea', WHEAR)
for i in ('dog_ear', 'dog_cochlea'):
    BY[i]['layers']['deeper'] = BY[i]['layers']['deeper'].replace('and the dog values come from one dog of each of four breeds (Heffner 1983)', 'and it varies with the breed and the age of the dog')
BY['dog_ear']['facts'][0][1] = '≈ 67 Hz to 45 kHz (varies with breed and age, and with the loudness of the test tone)'
BY['dog_gland']['layers']['deeper'] = BY['dog_gland']['layers']['deeper'].replace('(atrichial, the type people have all over their skin)', '(atrichial; people have this kind all over their skin)')
THIGH = {'dog_m_biceps_femoris', 'dog_m_hamstrings', 'dog_m_quadriceps', 'dog_m_adductors', 'dog_m_tensor'}
for n in NODES:
    if n['id'].startswith('dog_m_') and n['id'] not in THIGH: drop_ext(n['id'], 'Carnivore muscle lab: thigh muscles')

# ------------------------------------------------------------------ remaining just-so wording
fix('dog_claws', 'basics', 'They are blunt compared with a cat\'s because they are always out and wear down on the ground.', 'They are blunt compared with a cat\'s and wear down on the ground.')
fix('dog_sclera', 'basics', 'A dog\'s sclera shows much less white than a person\'s because the iris fills most of the opening.', 'A dog\'s sclera shows less white than a person\'s.')
fix('dog_sacrum', 'basics', 'It is firm because the weight of the hindquarters pushes through it.', 'The weight of the hindquarters is carried through it.')
fix('dog_m_triceps', 'basics', 'It is large in dogs because it holds up the front of the body when standing and pushes during running.', 'It is a large muscle in dogs: it holds up the front of the body when standing and pushes during running.')
fix('dog_m_neck_dorsal', 'deeper', 'In people the equivalent neck extensors (such as the splenius) are smaller because the head balances on top of the spine;', 'In people the equivalent neck extensors (such as the splenius) are smaller, since the head balances on top of the spine;')
