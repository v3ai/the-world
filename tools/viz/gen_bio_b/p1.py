from lib import *
import math

# ---------------- EVOLUTION ----------------
hub('bio_evolution', 'Five forces change a population over generations: mutation supplies variants, selection sorts them, drift and gene flow shuffle frequencies, and speciation splits lineages.',
    'Evolution', ['Mutation', 'Natural selection', 'Genetic drift', 'Gene flow', 'Speciation', 'Common descent'],
    colors=['purple', 'green', 'orange', 'accent', 'pink', 'blue'], aspect=0.85)

plot('bio_natural_selection', 'Breeder\'s equation: the offspring mean moves by R = h²S, the heritable part of the selection differential. Raise S or h² and the gold curve shifts further from the parents.',
    fns=[F('gauss(x,100,15)', 'parents', 'accent'), F('gauss(x,100+S,15)', 'selected parents', 'dim', True), F('gauss(x,100+h2*S,15)', 'offspring', 'gold', width=2.6)],
    x=[40, 160], xlabel='trait value', ylabel='frequency',
    params=[P('S', 'selection differential S', 0, 25, 12), P('h2', 'heritability h²', 0, 1, 0.5, step=0.05)],
    readouts=[R('response R = h²·S', 'h2*S')], vlines=[{'x': 100, 'label': 'parent mean'}])

plot('bio_selection_modes', 'Three fitness shapes: directional (green) favours one extreme, stabilising (gold) the middle, disruptive (pink) both ends. Slide the population mean and see which mode would raise or lower its fitness.',
    fns=[F('exp(0.9*(x-3))/(1+exp(0.9*(x-3)))', 'directional', 'green'), F('exp(-((x-5)^2)/6)', 'stabilising', 'gold'), F('0.15+0.85*(1-exp(-((x-5)^2)/6))', 'disruptive', 'pink'), F('0.5*gauss(x,m,0.8)/gauss(m,m,0.8)', 'population', 'dim', True)],
    x=[0, 10], y=[0, 1.1], xlabel='trait value', ylabel='relative fitness',
    params=[P('m', 'population mean', 1, 9, 5, step=0.1)],
    readouts=[R('fitness, stabilising', 'exp(-((m-5)^2)/6)'), R('fitness, directional', 'exp(0.9*(m-3))/(1+exp(0.9*(m-3)))')])

plot('bio_sexual_selection', 'A showy trait earns more matings (green, saturating) but costs survival (pink); fitness is their product (gold) and peaks at a compromise. Raise the cost and the optimum shrinks.',
    fns=[F('1-exp(-x/2)', 'mating success', 'green'), F('exp(-c*x^2/10)', 'survival', 'pink'), F('(1-exp(-x/2))*exp(-c*x^2/10)', 'lifetime fitness', 'gold', width=2.8)],
    x=[0, 8], y=[0, 1.05], xlabel='ornament size', ylabel='relative value',
    params=[P('c', 'survival cost of ornament', 0.1, 2, 0.5, step=0.05)])

bars('bio_evidence_for_evolution', 'Amino-acid differences in cytochrome c (104 residues) from the human protein: the more recent the common ancestor, the fewer the differences.',
    [('chimp', 0, 'green'), ('rhesus', 1, 'green'), ('dog', 10, 'accent'), ('hen', 13, 'accent'), ('turtle', 15, 'accent'), ('tuna', 21, 'gold'), ('moth', 31, 'orange'), ('yeast', 44, 'pink')],
    ylabel='cyt c differences from human', aspect=0.7)

hub('bio_species_concepts', 'Biological (interbreeding), morphological (looks), phylogenetic (one clade), ecological (niche) and genetic (DNA gap) concepts emphasise different evidence; they usually agree on well-studied groups and disagree on borderline ones.',
    'Species?', ['Biological', 'Morphological', 'Phylogenetic', 'Ecological', 'Genetic'],
    colors=['green', 'accent', 'purple', 'orange', 'pink'], aspect=0.85)

plot('bio_speciation_mechanisms', 'Genetic differentiation between two populations falls as gene flow rises: Fst ≈ 1/(1 + 4Nm). With fewer than one migrant per generation, populations drift apart and can speciate.',
    fns=[F('1/(1+4*x)', 'Fst = 1/(1+4Nm)', 'accent')], x=[0, 5], y=[0, 1.05], xlabel='migrants per gen, Nm', ylabel='differentiation Fst',
    points=[{'x': 'N*m', 'y': '1/(1+4*N*m)', 'label': 'Fst = {1/(1+4*N*m)}'}],
    params=[P('N', 'population size N', 50, 2000, 500, step=10), P('m', 'migration rate m', 0, 0.01, 0.002, step=0.0002)],
    readouts=[R('Nm', 'N*m', 'migrants/gen')], vlines=[{'x': 1, 'label': 'Nm = 1'}])

tree('bio_adaptive_radiation', 'Darwin\'s finches radiated from one ancestor into species that specialise in different foods, each with a matching beak.',
     ('Ancestor', [('Ground finches', [('seeds', [], 'gold'), ('cactus', [], 'gold')]), ('Tree finches', [('insects', [], 'green'), ('tools', [], 'green')]), ('Warbler finch', [('small prey', [], 'pink')])]))

tree('bio_phylogeny_cladistics', 'A cladogram groups organisms by shared derived traits: each node is a common ancestor, and each clade includes all of its descendants.',
     ('Chordates', [('Lamprey', []), ('Jawed', [('Sharks', []), ('Bony', [('Trout', []), ('Human', [])])])]))
plot('bio_molecular_clock', 'If mutations accumulate at a steady rate, sequence divergence is a clock: d = 2μt (both lineages change). Read off the time of the split from the observed divergence.',
    fns=[F('2*r*x/100', 'expected divergence', 'accent')], x=[0, 100], y=[0, 0.5], xlabel='time since split (Myr)', ylabel='divergence per site',
    hlines=[{'y': 'D', 'label': 'observed D'}], points=[{'x': 'D*100/(2*r)', 'y': 'D', 'label': 'split ≈ {D*100/(2*r)} Myr'}],
    params=[P('r', 'rate μ (% per Myr per lineage)', 0.2, 2, 1, step=0.05), P('D', 'observed divergence', 0.01, 0.4, 0.1, step=0.005)],
    readouts=[R('divergence time t = D/2μ', 'D*100/(2*r)', 'Myr')])

bars('bio_geologic_time', 'Earth is 4.54 Gyr old; the animal-rich Phanerozoic is only the last 12% of it. Bars show the length of each eon.',
    [('Hadean', 0.54, 'red'), ('Archean', 1.5, 'orange'), ('Proterozoic', 1.96, 'gold'), ('Phanerozoic', 0.54, 'green')], ylabel='duration (billion years)', aspect=0.7)

bars('bio_mass_extinctions', 'Estimated share of marine species lost in each of the five mass extinctions, at about 445, 372, 252, 201 and 66 Ma (approximate); the end-Permian was the worst.',
    [('Ordov.', 85, 'accent'), ('Devon.', 75, 'accent'), ('Permian', 96, 'red'), ('Triassic', 80, 'accent'), ('Cretac.', 76, 'accent')], ylabel='% marine species lost', aspect=0.75)

chain('bio_macroevolution_evodevo', 'Small changes in regulatory genes such as Hox can reshape the whole body plan, because they set what each segment becomes.',
      ['Hox genes on', 'head–tail axis', 'segment identity', 'regulatory change', 'new body plan'], colors=['purple', 'purple', 'accent', 'gold', 'green'])

plot('bio_neutral_theory_drift', 'For a neutral allele starting at frequency 0.5, random drift spreads the frequency out over time: the ±2 SD band widens faster in small populations. Slide N to see the difference.',
    fns=[F('min(1,0.5+2*sqrt(0.25*(1-(1-1/(2*N))^x)))', '+2 SD', 'accent'), F('max(0,0.5-2*sqrt(0.25*(1-(1-1/(2*N))^x)))', '−2 SD', 'accent'), F('min(1,0.5+sqrt(0.25*(1-(1-1/(2*N))^x)))', '+1 SD', 'gold'), F('max(0,0.5-sqrt(0.25*(1-(1-1/(2*N))^x)))', '−1 SD', 'gold')],
    x=[0, 400], y=[0, 1], xlabel='generations', ylabel='allele frequency p',
    params=[P('N', 'population size N', 10, 500, 100, step=5)], readouts=[R('approx. time to fixation 4N', '4*N', 'generations')])

plot('bio_kin_selection_behavior_evo', 'Hamilton\'s rule: a helping gene spreads when r·b > c. The curve is the minimum benefit b = c/r needed; closer relatives (higher r) need less.',
    fns=[F('c/x', 'b needed = c/r', 'accent')], x=[0.05, 1], y=[0, 20], xlabel='relatedness r', ylabel='benefit b',
    vlines=[{'x': 0.5, 'label': 'sibling'}, {'x': 0.25, 'label': 'half-sib'}, {'x': 0.125, 'label': 'cousin'}],
    params=[P('c', 'cost c', 0.5, 4, 1, step=0.1)], readouts=[R('benefit needed (sibling)', 'c/0.5'), R('benefit needed (cousin)', 'c/0.125')])

bars('bio_human_evolution', 'Average cranial capacity of hominins (approximate): brains roughly tripled over about 3.5 million years.',
    [('afarensis', 450, 'orange'), ('habilis', 610, 'gold'), ('erectus', 950, 'green'), ('sapiens', 1350, 'accent'), ('neander.', 1500, 'pink')], ylabel='brain volume (cm³)', aspect=0.75)

bars('bio_origin_of_life', 'Key dates in billions of years ago: Earth forms, oceans, first life, photosynthesis, oxygen rise, eukaryotes, animals. Life is almost as old as the oceans; animals arrived late.',
    [('Earth', 4.54, 'red'), ('ocean', 4.4, 'blue'), ('life', 3.7, 'green'), ('photo-syn.', 3.0, 'gold'), ('O₂', 2.4, 'orange'), ('euk.', 1.8, 'purple'), ('animals', 0.6, 'pink')], ylabel='billion years ago', aspect=0.75)

chain('bio_rna_world_luca', 'A likely route from chemistry to cells: self-copying RNA, then encapsulation, then DNA and proteins, ending in the last universal common ancestor.',
      ['RNA replicators', 'RNA in protocells', 'proteins evolve', 'DNA genome', 'LUCA ≈ 4 Ga'], colors=['orange', 'gold', 'green', 'accent', 'purple'])

blocks('bio_evolution_misconceptions', 'Mutation is random but selection is not, and evolution has no goal: populations adapt to the conditions they actually face.',
    [nd('a', 'random variation', 28, 15, 'purple'), nd('b', 'selection', 72, 15, 'green'), nd('c', 'adaptation', 72, 55, 'gold'), nd('d', 'foresight or goal', 28, 55, 'red')],
    [('a', 'b'), ('b', 'c'), {'from': 'd', 'to': 'b', 'label': 'no role', 'dashed': True, 'color': 'red'}], aspect=0.6, flow=True)

plot('bio_experimental_evolution', 'In Lenski\'s long-term E. coli experiment, fitness relative to the ancestor keeps rising for tens of thousands of generations, with diminishing returns. The curve is schematic.',
    fns=[F('1+W*x/(x+h)', 'relative fitness', 'green', width=2.6)], x=[0, 60000], y=[1, 2], xlabel='generations', ylabel='relative fitness',
    params=[P('W', 'total gain', 0.3, 1, 0.7, step=0.05), P('h', 'half-gain generation', 2000, 20000, 8000, step=500)],
    readouts=[R('fitness at 50,000 gen', '1+W*50000/(50000+h)')])

# ---------------- DIVERSITY ----------------
bars('bio_diversity', 'Described species per group, in thousands (approximate): insects alone outnumber all plants, fungi and vertebrates together.',
    [('insects', 1000, 'orange'), ('plants', 300, 'green'), ('fungi', 150, 'purple'), ('spiders', 110, 'pink'), ('mollusks', 85, 'accent'), ('verteb.', 70, 'gold')], ylabel='thousand species', aspect=0.75)

chain('bio_fungi_basics', 'A fungus lives as a network of hyphae (mycelium), absorbing food from outside; fruiting bodies are only the reproductive tip.',
      ['spore', 'hypha', 'mycelium', 'fruiting body', 'spores released'], loop=True, colors=['accent', 'green', 'green', 'gold', 'accent'], elabels=['germinates', 'branches', 'mates', 'sporulates', 'disperse'])

hub('bio_fungal_ecology', 'Fungi play several ecological roles: they recycle dead matter, partner with roots and algae, and can attack hosts.',
    'Fungus', ['Decomposer', 'Mycorrhiza', 'Lichen partner', 'Pathogen', 'Endophyte'], colors=['orange', 'green', 'accent', 'red', 'purple'], aspect=0.85)

tree('bio_algae_green_origin', 'Land plants arose from a group of freshwater green algae (charophytes), and later lineages added vascular tissue, seeds and flowers.',
     ('Green algae', [('Chlorophytes', []), ('Charophytes', [('Mosses', []), ('Ferns', []), ('Seed plants', [])])]))
chain('bio_bryophytes_seedless', 'Plants alternate between a haploid gametophyte (n) and a diploid sporophyte (2n). In mosses the gametophyte dominates; in ferns the sporophyte does.',
      ['spores (n)', 'gametophyte (n)', 'gametes (n)', 'zygote (2n)', 'sporophyte (2n)'], loop=True, colors=['accent', 'green', 'gold', 'pink', 'purple'], elabels=['mitosis', 'mitosis', 'fertilise', 'mitosis', 'meiosis'])

tree('bio_seed_plants', 'Seed plants split into naked-seed gymnosperms and flowering angiosperms, whose seeds develop inside a fruit.',
     ('Seed plants', [('Gymnosperms', [('Conifers', []), ('Cycads', []), ('Ginkgo', [])]), ('Angiosperms', [('Monocots', []), ('Eudicots', []), ('Magnoliids', [])])]))

tree('bio_animal_features', 'Animals branch by body symmetry, number of germ layers and how the mouth forms, from asymmetric sponges to bilateral deuterostomes.',
     ('Animals', [('Sponges', []), ('Cnidarians', []), ('Bilateria', [('Protostomes', []), ('Deuterostomes', [])])]))

geo('bio_sponges_cnidarians', 'A cnidarian polyp has radial symmetry: tentacles ring a single mouth that leads to a gut with one opening. Use the slider to extend the tentacles.',
    [0, 100, 0, 62],
    [Rc(40, 6, 20, 5, 'dim', 'dim', .5), Pg([[42, 11], [58, 11], [56, 36], [44, 36]], 'accent', 'accent', .22),
     T(50, 22, 'gut', 'accent', 11, 'center'), L(44, 36, 56, 36, 'gold', 3), T(66, 36, 'mouth', 'gold', 11),
     Pt(50, 36, 'gold', 3)] +
    [Cv('%g+(%g)*s*L+2.5*s*sin(1.2*t+%g)' % (50 + 4 * (k - 2.5), (k - 2.5) * 0.75, k * 1.1), '36+s*L*0.55', [0, 1], 'green', 2.5) for k in range(6)] +
    [T(50, 4, 'radial symmetry', 'dim', 11, 'center')],
    params=[P('L', 'tentacle length', 5, 30, 20, step=1)], aspect=0.62)

tree('bio_lophotrochozoans', 'Lophotrochozoans include flatworms, annelids (segmented worms) and mollusks, which share a trochophore-type larva or a lophophore.',
     ('Lophotrochozoa', [('Flatworms', []), ('Annelids', []), ('Mollusks', [('Snails', []), ('Clams', []), ('Squid', [])])]))

tree('bio_nematodes_arthropods', 'Ecdysozoans molt their cuticle. Arthropods, the largest animal phylum, split into four main lineages.',
     ('Ecdysozoa', [('Nematodes', []), ('Arthropods', [('Chelicerates', []), ('Myriapods', []), ('Crustaceans', []), ('Insects', [])])]))

bars('bio_entomology_insects', 'Described species per insect order, in thousands (approximate): beetles dominate, which is why Haldane quipped about the Creator\'s "inordinate fondness for beetles".',
    [('beetles', 400, 'orange'), ('moths', 160, 'pink'), ('flies', 155, 'accent'), ('wasps', 150, 'gold'), ('bugs', 100, 'green'), ('locusts', 25, 'purple')], ylabel='thousand species', aspect=0.75)

tree('bio_echinoderms_chordates', 'Echinoderms and chordates are both deuterostomes. Chordates include tunicates, lancelets and vertebrates, all sharing a notochord at some stage.',
     ('Deuterostomes', [('Echinoderms', []), ('Hemichordates', []), ('Chordates', [('Tunicates', []), ('Lancelets', []), ('Vertebrates', [])])]))

tree('bio_fishes_amphibians', 'Tetrapods arose from lobe-finned fishes; amphibians are the first lineage to live on land, still tied to water to breed.',
     ('Bony fishes', [('Ray-finned', []), ('Lobe-finned', [('Coelacanth', []), ('Lungfish', []), ('Amphibians', [])])]))
tree('bio_reptiles_birds', 'Birds are living dinosaurs: they nest within the archosaur branch alongside crocodilians, and share an amniotic egg with all reptiles and mammals.',
     ('Amniotes', [('Mammals', []), ('Reptiles', [('Lizards', []), ('Turtles', []), ('Archosaurs', [('Crocodiles', []), ('Birds', [])])])]))
tree('bio_mammals_primates', 'Mammals split into egg-laying monotremes, pouched marsupials and placentals; primates (monkeys, apes and humans) are one placental branch.',
     ('Mammals', [('Monotremes', []), ('Marsupials', []), ('Rodents', []), ('Primates', [])]))
plot('bio_zoology_taxonomy_methods', 'Lincoln–Petersen mark–recapture: mark M animals, later catch C and find R already marked; then N ≈ M·C/R. Fewer recaptures means a bigger population.',
    fns=[F('M*C/x', 'N = M·C/R', 'accent')], x=[2, 40], y=[0, 1500], xlabel='marked animals recaptured, R', ylabel='population estimate N',
    points=[{'x': 'Rr', 'y': 'M*C/Rr', 'label': 'N ≈ {M*C/Rr}'}],
    params=[P('M', 'marked first (M)', 10, 100, 50, step=1), P('C', 'caught second (C)', 10, 100, 40, step=1), P('Rr', 'recaptured (R)', 2, 40, 10, step=1)],
    readouts=[R('estimated N', 'M*C/Rr', 'animals')])
