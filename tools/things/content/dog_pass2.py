# Pass 2: corrections to the first-draft cards, new sourced facts, new cards (gait, the soft-tissue stand-in) and figures.
# Imported by dog_nodes.py after dog_cards_a..d. Every correction asserts that the old text is present, so a stale edit fails loudly.
import json, os
from dog_lib import *

BY = {n['id']: n for n in NODES}
def fix(id, where, old, new):
    n = BY[id]
    if where == 'summary': assert old in n['summary'], (id, old); n['summary'] = n['summary'].replace(old, new)
    else:
        t = n['layers'][where]; assert old in t, (id, where, old); n['layers'][where] = t.replace(old, new)
def fact(id, label, value):
    n = BY[id]
    for f in n['facts']:
        if f[0] == label: f[1] = value; return
    n['facts'].append([label, value])
def drop_fact(id, label): BY[id]['facts'] = [f for f in BY[id]['facts'] if f[0] != label]
def ext(id, *srcs):
    for s in srcs:
        if s not in BY[id]['ext']: BY[id]['ext'].append(s)

CATAV = src('Planar covariation of hindlimb and forelimb elevation angles in dogs (Catavitello, Ivanenko and Lacquaniti 2015, PLoS One): six Labrador and Golden Retrievers, 35 kg and 57 cm at the withers', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4517757')
COVASA = src('Transitional, fused and supernumerary vertebrae in the lumbosacrocaudal spine of domestic mammals (Covasa et al. 2024, Veterinarni Medicina): dog vertebral formula, Table 2', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11148713/')
QUIG03 = src('Comparison of the canine and human olfactory receptor gene repertoires (Quignon et al. 2003, Genome Biology 4:R80)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC329419')
QUIG05 = src('The canine olfactory subgenome (Quignon et al. 2005, Genome Biology 6:R83): 1,094 genes, about 20 % pseudogenes', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1257466')
UMNEXT = src('Dog and cat anatomy lab guide, extrinsic muscles (University of Minnesota Libraries, Pressbooks)', 'https://pressbooks.umn.edu/dogcatanatomylabguide/chapter/part-2-extrinsic-muscles-and-associated-structures/')
OPTICSRC = src('Optic nerve head area and retinal nerve fibre layer in beagles (2025 open-access paper; cites 115,000-150,000 axons in the canine optic nerve)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12353270/')
SCHIMMING = src('Craniometric measurements in dogs: mesaticephalic skulls (Schimming and Pinto e Silva 2013, Braz J Vet Res Anim Sci): 25 skulls, mean length about 178 mm, zygomatic width about 95 mm', 'https://revistas.usp.br/bjvras/article/view/55818')
MANDSYM = src('The mandibular symphysis of the dog (Frontiers in Veterinary Science 2023, 10.3389/fvets.2023.1260451)', 'https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2023.1260451/pdf')
HEARING = WHEAR

# ---------------------------------------------------------------- corrections
# the whole dog
fix('dog', 'expert', 'The model is a Labrador-type male, 57 cm tall at the withers (the top of the shoulders) and 30 kg, inside the breed-standard ranges.',
    'The model is a Labrador-type male, 57 cm tall at the withers (the top of the shoulders) and 30 kg, inside the breed-standard ranges; six Labrador and Golden Retrievers in one 2015 gait study averaged 35 kg and 57 cm. The body is drawn to the standard\'s proportions (see the figure on the card "The dog\'s outside"): a little longer than tall, with the brisket (the breast) at the level of the elbow, half the height above the ground.')
ext('dog', CATAV)
fact('dog', 'Height at withers (model)', '≈ 57 cm (UK Kennel Club: dogs 56-57 cm; AKC: 57-62 cm); measured on the model coat: ≈ 57 cm')
fact('dog', 'Body length (model)', '≈ 67 cm from the point of the shoulder to the point of the buttock, about 1.18 times the height (AKC: equal to or slightly longer than the height)')
fact('dog', 'Elbow and brisket height (model)', '≈ 29 cm, half the height (AKC: elbow to ground equals half the height at the withers)')
fact('dog', 'Tail (model)', '≈ 32 cm along its curve, very thick at the base and tapering, the "otter" tail (AKC: no longer than the hock)')
# skeleton and vertebrae
n = BY['dog_skeleton']; n['layers']['expert'] = n['layers']['expert'].replace('the tail vertebrae are about 20 but may be 19-23', 'the tail vertebrae are about 20 (20-23 in the vertebral-formula table cited)')
ext('dog_skeleton', COVASA)
for i in ('dog_caudal',):
    n = BY[i]
    for k in ('deeper', 'expert', 'basics'): n['layers'][k] = n['layers'][k].replace('19-23', '20-23')
    n['summary'] = n['summary'].replace('19-23', '20-23')
    for f in n['facts']: f[1] = f[1].replace('19-23', '20-23')
    ext(i, COVASA)
fix('dog_ribs', 'summary', 'form the dog\'s deep, narrow chest', 'form the dog\'s deep chest')
fix('dog_mandible', 'summary', 'The lower jaw is a single hinge of bone that opens and closes to bite and carry.', 'The lower jaw is a pair of long bones, joined at the chin, that hinge on the skull to open and close the mouth for biting and carrying.')
fix('dog_mandible', 'deeper', 'The jaw is the same bone as the human mandible;', 'Each half is the same bone as the human mandible (in people the two halves fuse in the first year of life; in dogs the joint at the chin, the mandibular symphysis, is described as a fibrous or cartilage joint with only rare bony fusion, and the sources disagree on its class);')
ext('dog_mandible', MANDSYM)
fix('dog_mandible', 'expert', 'The model draws the jaw as a rod and a ramus on each side, a simplified outline.', 'The model draws each half as a rod with a rising branch (the ramus, with the coronoid process and the condyle) and joins them at the chin; the lower teeth sit in a ridge along the top of the body of the jaw and meet the upper teeth in a scissor bite.')
# skull: measured against a published mean
fact('dog_skull', 'Skull length', '≈ 21 cm in this model (modelled from proportions; 25 mesaticephalic mongrel skulls averaged ≈ 17.8 cm and 9.5 cm wide across the cheekbones: Labradors are bigger dogs, but this model may be a little large)')
ext('dog_skull', SCHIMMING)
fix('dog_skull', 'expert', 'In the model the skull is a single solid with a hollow braincase and a nasal cavity, so a cut shows them.', 'In the model the skull is a single solid with a hollow braincase, a nasal cavity and open eye sockets, and the 42 teeth sit in their rows so that the upper and lower crowns meet; a cut shows the hollows. The length of the skull from the back to the stop is drawn about equal to the length of the muzzle from the stop to the nose.')
# fur strokes
fact('dog_fur', 'Model strokes drawn', '≈ 16,000 (a real coat has far more hairs)')
# triceps and brachiocephalicus
fix('dog_m_triceps', 'deeper', 'The same muscle as in people, with the same long, lateral and medial heads.', 'The same muscle as in people, but with four heads in the dog (long, lateral, medial and a small accessory head); people have three.')
fact('dog_m_brachiocephalicus', 'Parts', '3: the cleidobrachialis (to the upper arm) and two parts of the cleidocephalicus (to the neck and to the skull), joined at a faint line, the clavicular intersection')
fix('dog_m_brachiocephalicus', 'deeper', 'A tiny collarbone remnant sits inside it.', 'A tiny collarbone remnant sits inside it: a study of 50 adult dogs found a thin clavicle in 96 % of them, attached to this muscle.')
ext('dog_m_brachiocephalicus', UMNEXT)
# optic nerve
fix('dog_optic', 'summary', 'a cable of about a hundred thousand fibres', 'a cable of on the order of 100,000 or more fibres')
fact('dog_optic', 'Fibres in the optic nerve', '≈ 115,000-150,000 (a range cited in a 2025 beagle paper; one older count of retinal ganglion cells gave about 81,000, so estimates differ)')
ext('dog_optic', OPTICSRC)
# ear
fix('dog_ear', 'deeper', 'Eighteen or more muscles move a dog\'s ear (according to a standard reference), so a dog with prick ears can swivel them toward a sound.', 'Many small muscles move a dog\'s ear (a popular source says 18; I could not check the number in a veterinary anatomy text), so a dog with prick ears can swivel them toward a sound.')
fact('dog_ear', 'Ear muscles', 'many (18 is often quoted; not checked in a veterinary text)')
fix('dog_ear', 'deeper', 'Floppy ears like the Labrador\'s are a trait selected during domestication; the cartilage of the flap is the same.', 'Floppy ears like the Labrador\'s are common in domesticated animals and are thought to be a by-product of domestication (an idea that is still debated); the cartilage of the flap is the same.')
fix('dog_radius_ulna', 'deeper', 'The radius and ulna are fixed together so the dog\'s forearm twists very little, unlike yours; the two bones lock into one stiff post for running.', 'The radius and ulna are tied together by a tough ligament so the dog\'s forearm can twist only a little, unlike yours; the two bones act as one stiff post for running.')
# smell genes
GENES = '≈ 870 intact genes in the dog (1,094 genes, about 20 % of them pseudogenes) against ≈ 330 in a person (about 900 genes, about 63 % pseudogenes); calculated from the two papers'
for i in ('dog_turb_olf', 'dog_osn'):
    for f in BY[i]['facts']:
        if f[0].startswith('Receptor genes'): f[0] = 'Intact receptor genes'; f[1] = GENES
    ext(i, QUIG03, QUIG05)
fix('dog_turb_olf', 'deeper', 'A dog has about 800 working smell receptor genes, people about 400.', 'A dog has about 870 intact smell-receptor genes, people about 330 (calculated from gene counts and pseudogene fractions in two papers); the rest are pseudogenes, broken copies.')
fix('dog_osn', 'deeper', 'A dog has about 800 working receptor genes, a person about 400.', 'A dog has about 870 intact receptor genes, a person about 330 (calculated from gene counts and pseudogene fractions in two papers).')

# ---------------------------------------------------------------- new cards
N('dog_fill', 'Soft tissue (the stand-in in the cut view)', 'structure', .5, ['dog_muscles'],
  'In the "Cut in half" view the grey-pink filling between the drawn organs, muscles and bones stands for everything the model does not draw: fat, connective tissue, small vessels, glands and lymph nodes.',
  'A real dog is not hollow, and between the big organs there is no empty space. The model draws about 130 named parts, and the rest of the volume is shown as one plain colour so that the cut face looks like a solid body, not a shell.',
  'In a real section these spaces hold the thin fatty and fibrous sheets that wrap organs and muscles (fasciae), the lymph nodes, nerves and small vessels. None of them is drawn as a separate part here, and the colour is a stand-in, not a measurement.',
  'The filling is a single closed shape a little inside the skin. It exists only so that the cut face is painted; it has no tissue structure, and it is not a statement about how much of a dog is fat.',
  [['What it is', 'a stand-in, not a measured tissue']], cert='C2', refs=[R('33.1', '33-1-animal-form-and-function')], ext=[WDA],
  human=[('human_body', 'The human body in this park shows its organs the same way: named parts, with the rest left out.')])
BY['dog_muscles']['parts'].append('dog_fill')
N('dog_gait', 'Walk, trot and gallop', 'process', .6, ['dog'],
  'A dog changes how it moves its legs as it speeds up: a four-beat walk, a two-beat trot in which opposite legs move together, and a bounding gallop.',
  'At a walk a dog always has at least two feet on the ground, and the feet land one after another. At a trot, the left front foot and the right hind foot land together, then the right front and the left hind. At a gallop all four feet leave the ground for a moment.',
  'At the walk the order of footfalls is "lateral": a hind foot, then the front foot on the same side, then the other hind foot, then the other front foot. The trot is "diagonal": the two feet of a diagonal pair move together. At the gallop the dog bounds: the back flexes and stretches, and there is a moment with no foot on the ground. How long each foot stays down (the duty factor) is more than half the stride at a walk and less than half at a trot or a gallop.',
  'In a study of six Labrador and Golden Retrievers (about 35 kg and 57 cm at the withers) the dogs walked with a lateral sequence of footfalls, trotted with synchronized diagonal limbs and galloped transversely; the stance part of the cycle was more than half of it in walking and less than half in the other gaits. The figure draws idealised timing (even spacing of the walk footfalls, and 65 % and 45 % stance), which is illustrative: real strides vary with speed, breed and the individual dog. The model does not animate legs; only the tail wag and the breathing and heartbeat are moved.',
  [['Gaits shown', 'walk (lateral sequence), trot (diagonal), gallop (transverse)'], ['Stance part of the cycle', 'more than 50 % at a walk, less than 50 % in the trot and gallop (Catavitello et al. 2015)']], cert='C2',
  refs=[R('38.4', '38-4-muscle-contraction-and-locomotion')], ext=[CATAV], human=[('skeletal_system', 'People walk on two legs with the heel on the ground; a dog walks on its toes (digitigrade) on four, which is why its "knee" in front is the wrist.')], parts=['dog_scapula', 'dog_femur'])
BY['dog']['parts'].append('dog_gait')

# ---------------------------------------------------------------- figures
def table(id, cols, rows, caption): FIGS[id] = {'type': 'table', 'cols': cols, 'rows': rows, 'caption': caption}
def bars2(id, items, ylabel, caption, logy=False): bars(id, items, ylabel, caption, logy)

# proportions (the silhouette is the model's own side view)
o = json.load(open(os.path.join(os.path.dirname(__file__), 'dog_outline.json')))['pts']
S = [{'k': 'poly', 'pts': [[round(x, 1), round(y, 1)] for x, y in o], 'fill': '#d9b36f', 'alpha': .35, 'closed': True, 'color': 'dim'},
     {'k': 'line', 'x1': -44, 'y1': 58, 'x2': 22, 'y2': 58, 'color': 'accent', 'dash': 4}, {'k': 'text', 'x': -44, 'y': 61, 'text': 'height at the withers ≈ 57 cm', 'size': 11, 'align': 'left'},
     {'k': 'line', 'x1': -20, 'y1': 29, 'x2': 20, 'y2': 29, 'color': 'orange', 'dash': 4}, {'k': 'text', 'x': -44, 'y': 31.5, 'text': 'brisket and elbow ≈ 29 cm: half the height (0.51)', 'size': 11, 'align': 'left'},
     {'k': 'arrow', 'x1': 25.5, 'y1': -5, 'x2': -41.5, 'y2': -5, 'color': 'green'}, {'k': 'arrow', 'x1': -41.5, 'y1': -5, 'x2': 25.5, 'y2': -5, 'color': 'green'}, {'k': 'text', 'x': -8, 'y': -9, 'text': 'point of shoulder to buttock ≈ 67 cm (1.18 × the height)', 'size': 11, 'align': 'center'},
     {'k': 'line', 'x1': -4, 'y1': 0, 'x2': -4, 'y2': 58, 'color': 'dim', 'dash': 2}]
FIGS['dog_coat_group'] = {'type': 'geometry', 'range': [-48, 62, -13, 72], 'shapes': S, 'caption': 'The model\'s own side view with the breed standard\'s proportions: a dog a little longer than tall, with the elbow at half the height. Heights and lengths are measured on the model (a 3-D reconstruction from typical proportions); the standard says "equal to or slightly longer than" and "elbow to ground equal to one half of the height" (AKC) and 56-57 cm (UK Kennel Club).', 'aspect': .62}

# footfalls: walk (lateral sequence) and trot (diagonal pairs), idealised
def stance(y, start, duty, col):
    s = start % 1; e = s + duty; out = []
    if e <= 1: out.append({'k': 'rect', 'x': round(s * 100, 1), 'y': y, 'w': round(duty * 100, 1), 'h': 4, 'fill': col})
    else: out += [{'k': 'rect', 'x': round(s * 100, 1), 'y': y, 'w': round((1 - s) * 100, 1), 'h': 4, 'fill': col}, {'k': 'rect', 'x': 0, 'y': y, 'w': round((e - 1) * 100, 1), 'h': 4, 'fill': col}]
    return out
G = []; names = ['left front', 'right front', 'left hind', 'right hind']
walk = {'left front': .25, 'right front': .75, 'left hind': 0, 'right hind': .5}; trot = {'left front': 0, 'right front': .5, 'left hind': .5, 'right hind': 0}
for gi, (title, ph, duty, y0) in enumerate([('Walk (lateral sequence): stance about 65 % of the stride', walk, .65, 52), ('Trot (diagonal pairs): stance about 45 % of the stride', trot, .45, 20)]):
    G.append({'k': 'text', 'x': 0, 'y': y0 + 15, 'text': title, 'size': 11, 'align': 'left'})
    for i, nm in enumerate(names):
        y = y0 + 10 - i * 5.2; G.append({'k': 'text', 'x': -2, 'y': y + .8, 'text': nm, 'size': 9, 'align': 'right'}); G += stance(y, ph[nm], duty, 'accent' if 'front' in nm else 'orange')
FIGS['dog_gait'] = {'type': 'geometry', 'range': [-22, 104, 8, 72], 'shapes': G, 'caption': 'Idealised footfall timing over one stride (left to right, 0-100 %); a bar is a foot on the ground. Only the order (lateral walk, diagonal trot) and "stance over half the stride at the walk, under half at the trot" come from the study cited; the exact percentages and even spacing are illustrative.', 'aspect': .62}

# dentition as a table
table('dog_teeth', ['', 'Incisors', 'Canines', 'Premolars', 'Molars', 'Total'], [['Dog, upper, each side', '3', '1', '4', '2', '10'], ['Dog, lower, each side', '3', '1', '4', '3', '11'], ['Dog, whole mouth', '12', '4', '16', '10', '42'], ['Person, whole mouth', '8', '4', '8', '12', '32']],
      'Adult teeth by type (dvm360 dentistry proceedings for the dog; the human count is on the human teeth cards). The upper fourth premolar and the lower first molar are the carnassials that shear meat.')

# heart rate by species (Merck): mid-points of the listed resting ranges
bars2('dog_heart', [('horse 28-40', 34), ('dog 70-120', 95), ('cat 120-140', 130), ('rat 250-400', 325), ('mouse 450-750', 600)], 'beats per minute (mid-point)',
      'Resting heart rate falls as animals get bigger: the bars are the mid-points of the ranges listed in the Merck Veterinary Manual (listed from the heaviest to the lightest animal). A dog sits at 70-120 per minute; a person is 60-100.', logy=True)
bars2('dog_lungs', [('horse 10-14', 12), ('dog 18-34', 26), ('cat 16-40', 28), ('sheep 16-34', 25), ('pig 32-58', 45)], 'breaths per minute (mid-point)',
      'Resting breaths per minute, mid-points of the ranges in the Merck Veterinary Manual. A dog at rest breathes about 18-34 times a minute; panting is much faster and shallower.')
bars2('dog_cochlea', [('elephant', 12000), ('human', 20000), ('dog', 45000), ('cat', 79000), ('mouse', 70000)], 'highest audible sound (Hz)',
      'Upper limit of hearing from the Hearing range reference (elephant 12 kHz, human 20 kHz, dog 45 kHz, cat 79 kHz, mouse 70 kHz). The ranges depend on how they were measured and on the individual.', logy=True)
bars2('dog_small_intestine', [('dog 5 kg', 2.4), ('dog 33 kg', 6.4)], 'length of the small intestine (m)', 'Small intestine length in two dogs from an open-access measurement study of dogs of different sizes: the tube is longer in a bigger dog.')
bars2('dog_large_intestine', [('miniature poodle', 32), ('Great Dane', 99)], 'length of the large intestine (cm)', 'Large intestine length in the smallest and largest dog in the same open-access study.')
bars2('dog_turb_olf', [('dog (intact genes, ≈)', 870), ('human (intact genes, ≈)', 330)], 'intact smell-receptor genes', 'Calculated from the gene counts and pseudogene fractions in Quignon et al. 2003 and 2005: dog about 1,094 genes with about 20 % broken copies, human about 900 with about 63 %. The lining area (about 170 cm² in a dog, about 10 cm² in a person) is in the text.')
# cone sensitivity: only the peaks are data
FIGS['dog_retina'] = {'type': 'plot', 'x': [380, 700], 'y': [0, 1.1], 'xlabel': 'wavelength (nm)', 'ylabel': 'relative sensitivity (shape illustrative)',
  'fns': [{'f': 'gauss(x,429,38)/gauss(429,429,38)', 'label': 'dog blue cone (peak ≈ 429 nm)', 'color': 'blue'}, {'f': 'gauss(x,555,55)/gauss(555,555,55)', 'label': 'dog green-yellow cone (peak ≈ 555 nm)', 'color': 'green'}],
  'vlines': [{'x': 429, 'label': '429'}, {'x': 555, 'label': '555'}], 'caption': 'A dog has two kinds of cone. Only the peaks (about 429 and 555 nm, beagle retina, Mol Vis 2008) are measured values; the bell-curve shapes and widths are drawn for illustration. A person has three kinds, so a dog sees colour like a person with red-green colour blindness.'}
# flow diagrams
blocks('dog_osn', [('o', 'Odour molecule', 8, 50, None), ('r', 'Receptor on the cilium', 28, 50, None), ('g', 'G protein', 46, 22, None), ('a', 'Adenylyl cyclase', 46, 78, None), ('c', 'cAMP made', 66, 50, 'orange'), ('i', 'Ion channel opens', 82, 22, None), ('f', 'Neuron fires', 92, 78, 'green')],
       [('o', 'r', 'binds'), ('r', 'g', 'activates'), ('g', 'a', None), ('a', 'c', 'ATP to cAMP'), ('c', 'i', None), ('i', 'f', 'Ca²⁺ and Na⁺ in')], 'How a smell cell turns a molecule into a nerve signal (the textbook scheme for mammalian olfactory neurons).')
blocks('dog_axons', [('n', 'Nostril: sniff', 6, 50, None), ('t', 'Turbinate scrolls', 28, 50, None), ('e', 'Smell lining', 50, 50, 'orange'), ('a', 'Nerve fibres through the sieve plate', 72, 22, None), ('b', 'Olfactory bulb', 90, 50, 'green'), ('c', 'Brain', 72, 80, None)],
       [('n', 't', 'air in'), ('t', 'e', None), ('e', 'a', 'signals'), ('a', 'b', None), ('b', 'c', None)], 'The route of a smell, from the nostril to the brain. Positions are schematic.')
blocks('dog_nmj', [('a', 'Nerve impulse arrives', 10, 50, None), ('r', 'Acetylcholine released', 33, 50, 'orange'), ('b', 'Binds receptors on the fibre', 56, 50, None), ('d', 'Channels open, fibre fires', 78, 25, None), ('m', 'Fibre contracts', 90, 75, 'green')],
       [('a', 'r', None), ('r', 'b', None), ('b', 'd', None), ('d', 'm', None)], 'The steps at a neuromuscular junction, the same in a dog as in a person.')
blocks('dog_valves', [('ra', 'Right atrium', 12, 25, 'blue'), ('rv', 'Right ventricle', 40, 25, 'blue'), ('lu', 'Lungs', 66, 25, None), ('la', 'Left atrium', 88, 25, 'red'), ('lv', 'Left ventricle', 66, 75, 'red'), ('bo', 'Body', 30, 75, None)],
       [('ra', 'rv', 'tricuspid valve'), ('rv', 'lu', 'pulmonary valve'), ('lu', 'la', None), ('la', 'lv', 'mitral valve'), ('lv', 'bo', 'aortic valve'), ('bo', 'ra', None)], 'The path of blood through the four chambers and four valves; blue is oxygen-poor and red oxygen-rich blood.')
blocks('dog_skin_scene', [('e', 'Epidermis: barrier of dead cells over living layers', 50, 12, None), ('d', 'Dermis: follicles, glands, vessels, nerves', 50, 42, 'orange'), ('s', 'Subcutis: fat and connective tissue', 50, 72, None)], [('e', 'd', None), ('d', 's', None)], 'The three layers of dog skin, outside to inside (a schematic; sizes are in the scene).', False)
blocks('dog_tapetum', [('l', 'Light enters the eye', 10, 50, None), ('r', 'Passes the retina: some is absorbed', 36, 22, None), ('t', 'Tapetum reflects the rest', 62, 50, 'green'), ('r2', 'Second pass through the retina', 82, 22, None), ('o', 'Some leaves: eyeshine', 90, 78, 'orange')],
       [('l', 'r', None), ('r', 't', None), ('t', 'r2', 'reflected'), ('r2', 'o', None)], 'Why a dog\'s eyes glow in a torch beam: the shiny layer behind the retina sends light back for a second chance to be caught.')
blocks('dog_arteries', [('h', 'Heart: left ventricle', 10, 50, 'red'), ('a', 'Aorta', 32, 50, None), ('b', 'Branches to head, legs, organs', 58, 22, None), ('c', 'Capillaries: oxygen delivered', 82, 50, 'orange'), ('v', 'Veins carry blood back', 58, 80, 'blue')],
       [('h', 'a', None), ('a', 'b', None), ('b', 'c', None), ('c', 'v', None)], 'Arteries carry blood away from the heart, veins carry it back; the capillaries between them are where the exchange happens.')

# more flow diagrams (textbook sequences; no numbers)
blocks('dog_eye', [('c', 'Cornea', 8, 50, None), ('i', 'Pupil (iris)', 26, 50, None), ('l', 'Lens', 44, 50, None), ('v', 'Vitreous gel', 62, 50, None), ('r', 'Retina (and tapetum behind)', 80, 25, 'orange'), ('n', 'Optic nerve to the brain', 90, 78, 'green')],
       [('c', 'i', 'light'), ('i', 'l', None), ('l', 'v', None), ('v', 'r', None), ('r', 'n', 'signals')], 'The path of light through a dog\'s eye: the same order of parts as in a human eye.')
blocks('dog_bulbs', [('r', 'Receptor cells of one type', 12, 25, None), ('g', 'One cluster (glomerulus)', 40, 25, 'orange'), ('m', 'Relay neurons of the bulb', 66, 25, None), ('b', 'Brain: smell areas', 88, 25, 'green'), ('x', 'Many receptor types, many clusters: a pattern for each smell', 50, 75, None)],
       [('r', 'g', 'same-type fibres converge'), ('g', 'm', None), ('m', 'b', None), ('g', 'x', None)], 'How the olfactory bulb sorts smells: fibres from receptor cells of the same type meet in the same cluster, so each smell makes its own pattern of clusters.')
blocks('dog_trachea', [('n', 'Nose and mouth', 8, 50, None), ('p', 'Throat and larynx', 28, 50, None), ('t', 'Windpipe (trachea)', 50, 50, 'orange'), ('b', 'Two bronchi', 70, 50, None), ('a', 'Air sacs (alveoli): gas exchange', 90, 50, 'green')],
       [('n', 'p', 'air in'), ('p', 't', None), ('t', 'b', None), ('b', 'a', None)], 'The path of breathed air from the nose to the air sacs of the lungs.')
blocks('dog_kidneys', [('a', 'Blood from the renal artery', 10, 30, 'red'), ('f', 'Filtered in the nephrons', 38, 30, 'orange'), ('u', 'Urine in the ureters', 66, 30, None), ('b', 'Bladder stores it', 88, 30, None), ('v', 'Cleaned blood to the renal vein', 38, 75, 'blue'), ('e', 'Urethra: leaves the body', 88, 75, None)],
       [('a', 'f', None), ('f', 'u', None), ('u', 'b', None), ('f', 'v', None), ('b', 'e', None)], 'What a kidney does with blood: filter it, return what is needed, and send the waste as urine to the bladder.')
blocks('dog_stomach', [('m', 'Mouth', 6, 50, None), ('o', 'Gullet', 24, 50, None), ('s', 'Stomach', 42, 50, 'orange'), ('i', 'Small intestine', 62, 50, None), ('l', 'Large intestine', 80, 50, None), ('r', 'Rectum and anus', 94, 50, None)],
       [('m', 'o', 'swallow'), ('o', 's', None), ('s', 'i', None), ('i', 'l', 'nutrients absorbed'), ('l', 'r', 'water taken back')], 'The path of food through a dog\'s gut.')
blocks('dog_spinal_cord', [('s', 'Sensory nerve ending', 8, 50, None), ('d', 'Sensory fibre to the cord', 30, 50, None), ('c', 'Spinal cord: connection', 52, 50, 'orange'), ('m', 'Motor fibre', 72, 50, None), ('u', 'Muscle contracts', 92, 50, 'green')],
       [('s', 'd', None), ('d', 'c', None), ('c', 'm', None), ('m', 'u', None)], 'A reflex: the simplest route through the spinal cord, from a sensing ending to a muscle, without waiting for the brain.')
blocks('dog_turb_resp', [('n', 'Cold, dry air in', 10, 50, None), ('t', 'Maxilloturbinates warm and wet it', 36, 50, 'orange'), ('l', 'Warm, moist air to the lungs', 66, 25, None), ('s', 'A share goes to the smell region', 66, 78, 'green'), ('o', 'Exhaled air returns some heat and water', 90, 50, None)],
       [('n', 't', None), ('t', 'l', None), ('t', 's', None), ('l', 'o', None)], 'What the front scrolls of the nose do to the air on its way in (a schematic of the flow; the real folds are far finer).')
blocks('dog_tongue', [('h', 'Dog is hot', 10, 50, None), ('p', 'Panting: fast, shallow breaths', 32, 50, None), ('e', 'Water evaporates from tongue and nose lining', 60, 50, 'orange'), ('c', 'Heat leaves with the vapour: blood cools', 86, 50, 'green')],
       [('h', 'p', None), ('p', 'e', None), ('e', 'c', None)], 'How a dog cools by panting: a dog has sweat glands only on its pads, so evaporation from the wet surfaces of the mouth and nose does most of the work.')
blocks('dog_diaphragm', [('d', 'Diaphragm contracts and flattens', 14, 50, 'orange'), ('v', 'Chest space grows', 40, 50, None), ('p', 'Air pressure in the lungs falls', 64, 50, None), ('a', 'Air flows in', 88, 50, 'green')],
       [('d', 'v', None), ('v', 'p', None), ('p', 'a', None)], 'How the diaphragm draws a breath in; the ribs help, and the diaphragm relaxes to let the air out.')
