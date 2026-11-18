from lib import *
import math

bars('bio_genome_organization', 'Genome size in megabases (log scale, approximate): size does not track complexity, since much of a large genome is repeats and non-coding DNA.',
    [('E. coli', 4.6, 'accent'), ('yeast', 12, 'purple'), ('worm', 100, 'green'), ('fly', 140, 'orange'), ('human', 3100, 'gold'), ('wheat', 16000, 'pink'), ('Paris', 150000, 'red')], logy=True, ylabel='Mb (log)', aspect=0.75)

plot('bio_mitochondrial_genome', 'Each cell holds many mtDNA copies, mutant and normal (heteroplasmy). Disease appears only once the mutant fraction passes a threshold, often 60–90%. Slide the threshold.',
    fns=[F('100/(1+exp(-(x-thr)/5))', 'respiratory defect', 'red', width=2.6)], x=[0, 100], y=[0, 105], xlabel='% mutant mtDNA', ylabel='% defect', vlines=[{'x': 'thr', 'label': 'threshold'}],
    params=[P('thr', 'threshold', 50, 90, 70, step=1, unit='%')])

plot('bio_riboswitches_ribozymes', 'A riboswitch is an RNA that binds a small molecule and changes shape, switching its own gene off. Expression falls as ligand rises, with half-point at Kd.',
    fns=[F('100/(1+(x/kd)^n)', 'gene expression', 'purple', width=2.6)], x=[0.01, 1000], logx=True, y=[0, 105], xlabel='ligand (µM)', ylabel='% expression', vlines=[{'x': 'kd', 'label': 'Kd'}],
    params=[P('kd', 'Kd', 0.1, 100, 5, step=0.1, unit='µM'), P('n', 'cooperativity', 1, 3, 1, step=0.1)])

chain('bio_translation_steps', 'Translation: the ribosome assembles on the start codon, then repeatedly adds amino acids (about 15–20 per second in bacteria) until a stop codon recruits release factors.',
      ['initiation', 'tRNA enters A site', 'peptide bond', 'translocation', 'termination'], colors=['green', 'accent', 'gold', 'orange', 'red'])
S['bio_translation_steps']['edges'].append({'from': 'n3', 'to': 'n1', 'label': 'repeat', 'dashed': True})
S['bio_translation_steps']['edges'][3:4] = [e for e in S['bio_translation_steps']['edges'][3:4]]

blocks('bio_chromatin_remodeling_histone_code', 'Writers add histone marks, erasers remove them, and readers bind marks to open or close chromatin. Acetylation generally opens it; H3K9me3 closes it.',
    [nd('w', 'writer (HAT, HMT)', 20, 12, 'green'), nd('m', 'histone mark', 50, 50, 'gold'), nd('e', 'eraser (HDAC)', 80, 12, 'red'), nd('r', 'reader', 20, 88, 'accent'), nd('o', 'gene on / off', 80, 88, 'purple')],
    [('w', 'm', 'adds'), ('e', 'm', 'removes'), ('m', 'r'), ('r', 'o')], aspect=0.75)

plot('bio_genetic_counseling_screening', 'For a recessive disease with incidence 1 in n, carrier frequency is 2q(1−q) with q = 1/√n; carriers are far more common than patients. Slide the incidence.',
    fns=[F('2*(1/sqrt(x))*(1-1/sqrt(x))', 'carrier frequency', 'accent', width=2.6)], x=[100, 1000000], logx=True, logy=True, y=[0.0005, 0.3], xlabel='1 affected in n births', ylabel='carrier fraction',
    points=[{'x': 'n', 'y': '2/sqrt(n)*(1-1/sqrt(n))', 'label': '1 in {1/(2/sqrt(n)*(1-1/sqrt(n)))}'}], params=[P('n', 'disease incidence 1 in', 100, 100000, 2500, step=100)],
    readouts=[R('carriers', '1/(2/sqrt(n)*(1-1/sqrt(n)))', 'people per 1 carrier')])

plot('bio_twin_family_studies', 'Falconer\'s formula: heritability h² ≈ 2(r_MZ − r_DZ). Identical twins share all genes, fraternal twins half; the bigger the gap between their correlations, the more genetic the trait.',
    fns=[F('rmz*x', 'x', 'dim')], x=[0, 1], y=[0, 1], params=[P('rmz', 'identical twin correlation', 0.2, 1, 0.8, step=0.01), P('rdz', 'fraternal twin correlation', 0.1, 0.9, 0.5, step=0.01)],
    readouts=[R('heritability h²', 'min(1,max(0,2*(rmz-rdz)))'), R('shared environment c²', 'max(0,2*rdz-rmz)'), R('unique environment e²', '1-rmz')])
_tw = S.pop('bio_twin_family_studies')
add('bio_twin_family_studies', dict(type='bars', bars=[dict(label='identical (MZ)', value='rmz', color='green'), dict(label='fraternal (DZ)', value='rdz', color='orange'), dict(label='h²', value='min(1,max(0,2*(rmz-rdz)))', color='gold'), dict(label='c²', value='max(0,2*rdz-rmz)', color='accent'), dict(label='e²', value='1-rmz', color='pink')],
    ylabel='correlation / share', params=_tw['params'], readouts=_tw['readouts'], caption=_tw['caption']))

blocks('bio_genetic_screens', 'Forward genetics starts from a phenotype and finds the gene; reverse genetics starts from a gene and finds its phenotype.',
    [nd('a', 'mutagenise', 14, 8, 'orange'), nd('b', 'screen', 50, 8, 'gold'), nd('c', 'map gene', 86, 8, 'green'),
     nd('d', 'pick gene', 14, 82, 'accent'), nd('e', 'knock out', 50, 82, 'red'), nd('f', 'phenotype', 86, 82, 'purple')],
    [('a', 'b', 'forward'), ('b', 'c'), ('d', 'e', 'reverse'), ('e', 'f')], aspect=0.62)

plot('bio_roots_mycorrhiza', 'Nutrient uptake saturates like an enzyme: I = Imax·C/(Km + C). Mycorrhizal fungi extend the absorbing surface, raising Imax, which helps most where soil phosphate is scarce.',
    fns=[F('mult*10*x/(5+x)', 'uptake with fungi', 'green', width=2.6), F('10*x/(5+x)', 'uptake, roots alone', 'dim', True)], x=[0, 50], y=[0, 45], xlabel='soil nutrient (µM)', ylabel='uptake (relative)',
    params=[P('mult', 'surface multiplier from hyphae', 1, 4, 2.5, step=0.1)], readouts=[R('gain at 5 µM', 'mult')])

bars('bio_plant_secondary_metabolites', 'Known plant secondary metabolites by class (thousands, approximate): terpenoids are the largest group; caffeine and nicotine are alkaloids, menthol a terpenoid.',
    [('terpenoids', 40, 'green'), ('alkaloids', 12, 'purple'), ('phenolics', 8, 'orange')], ylabel='thousand compounds', aspect=0.65)

plot('bio_plant_stress_drought', 'As soil dries, abscisic acid closes the stomata: conductance drops sharply near a threshold water potential, saving water but limiting CO₂. Shift the threshold for a drought-tolerant plant.',
    fns=[F('100/(1+exp(-(x-p50)*4))', 'stomatal conductance', 'blue', width=2.6)], x=[-3, 0], y=[0, 105], xlabel='soil Ψ (MPa)', ylabel='% of maximum', vlines=[{'x': 'p50', 'label': 'closing point'}],
    params=[P('p50', 'closing point', -2.5, -0.5, -1.2, step=0.1, unit='MPa')])

bars('bio_crop_domestication', 'Domestication changed yield traits (approximate): wild teosinte carries about 10 kernels per ear, modern maize hundreds; wild tomato fruit weigh a gram or so, cultivated ones hundreds.',
    [('teosinte', 10, 'orange'), ('maize', 500, 'gold'), ('wild tomato', 1, 'orange'), ('big tomato', 300, 'gold')], logy=True, ylabel='kernels per ear / fruit mass (g)', aspect=0.7)

blocks('bio_plant_pathogens_defense', 'Plants have two layers: PAMP-triggered immunity catches common microbial patterns, and effector-triggered immunity, via R proteins, recognises specific effectors and can cause a localised hypersensitive cell death.',
    [nd('a', 'pathogen PAMP', 20, 12, 'red'), nd('b', 'PTI: basal defence', 78, 12, 'green'), nd('c', 'effector delivered', 20, 55, 'orange'), nd('d', 'R protein (ETI)', 78, 55, 'accent'), nd('e', 'hypersensitive response', 50, 92, 'gold')],
    [('a', 'b'), ('b', 'c', 'pathogen overcomes'), ('c', 'd'), ('d', 'e')], aspect=0.8)

blocks('bio_plant_polyploidy', 'Bread wheat arose by two hybridisations with genome doubling: AA × BB gave tetraploid emmer (28 chromosomes), and emmer × DD gave hexaploid bread wheat (42).',
    [nd('a', 'AA (14)', 12, 12, 'green'), nd('b', 'BB (14)', 12, 50, 'orange'), nd('c', 'AABB emmer (28)', 50, 31, 'gold'), nd('d', 'DD (14)', 50, 78, 'purple'), nd('e', 'AABBDD bread (42)', 82, 55, 'pink')],
    [('a', 'c'), ('b', 'c'), ('c', 'e'), ('d', 'e')], aspect=0.75)

tree('bio_arachnids_crustaceans', 'Chelicerates (spiders, scorpions, mites) have eight legs and no antennae; crustaceans have two pairs of antennae and branched limbs.',
     ('Arthropods', [('Chelicerates', [('Spiders', []), ('Scorpions', []), ('Mites, ticks', [])]), ('Crustaceans', [('Crabs, shrimp', []), ('Barnacles', []), ('Copepods', [])])]))

add('bio_parasites_helminths', dict(type='plot', fns=[F('exp(-x/m)/m', 'random (exponential)', 'dim', True), F('exp((k-1)*ln(x)-k*x/m+k*ln(k/m)-%s)' % lg('k'), 'aggregated (gamma)', 'orange', width=2.6)],
    x=[0.02, 20], y=[0, 0.6], xlabel='parasites per host', ylabel='share of hosts', params=[P('m', 'mean burden', 2, 10, 5, step=0.5), P('k', 'aggregation k (low = clumped)', 0.5, 5, 1, step=0.1)],
    readouts=[R('SD of burden', 'sqrt(m+m^2/k)')],
    caption='Most hosts carry few worms while a few carry many (aggregation). Lower k makes the distribution more skewed, so treating the heavily infected few has an outsized effect.'))
S['bio_parasites_helminths']['fns'].pop(0)

plot('bio_evolution_of_flight', 'Lift balances weight: the minimum flight speed is v = √(2W/(ρ·S·C_L)). Larger animals have higher wing loading and must fly faster, which limits flying animals to about 15 kg.',
    fns=[F('sqrt(2*x*9.81/(1.225*wa*x^(2/3)*1.2))', 'stall speed', 'accent', width=2.6)], x=[0.003, 15], logx=True, y=[0, 25], xlabel='body mass (kg)', ylabel='min. speed (m/s)',
    points=[{'x': 0.004, 'y': 'sqrt(2*0.004*9.81/(1.225*wa*0.004^(2/3)*1.2))', 'label': 'hummingbird'}, {'x': 0.35, 'y': 'sqrt(2*0.35*9.81/(1.225*wa*0.35^(2/3)*1.2))', 'label': 'pigeon'}, {'x': 10, 'y': 'sqrt(2*10*9.81/(1.225*wa*10^(2/3)*1.2))', 'label': 'swan'}],
    params=[P('wa', 'wing area factor S/M^(2/3)', 0.08, 0.2, 0.14, step=0.01)])

blocks('bio_lichens_fungal_biotech', 'In a lichen the fungus gives protection, water and minerals; the alga or cyanobacterium returns sugars from photosynthesis.',
    [nd('a', 'fungus', 18, 50, 'purple'), nd('b', 'alga / cyanobacterium', 78, 50, 'green')],
    [{'from': 'a', 'to': 'b', 'label': 'shelter, water'}, {'from': 'b', 'to': 'a', 'label': 'sugars'}], aspect=0.4)
S['bio_lichens_fungal_biotech']['edges'][1]['to'] = 'a'

blocks('bio_deuterostome_protostome', 'In protostomes the first opening of the embryo (blastopore) becomes the mouth; in deuterostomes it becomes the anus and the mouth forms second.',
    [nd('b', 'blastopore', 50, 8, 'gold'), nd('p', 'protostome', 20, 50, 'orange'), nd('d', 'deuterostome', 80, 50, 'green'), nd('p2', 'snails, insects', 20, 92, 'orange'), nd('d2', 'starfish, humans', 80, 92, 'green')],
    [('b', 'p'), ('b', 'd'), ('p', 'p2'), ('d', 'd2')], aspect=0.8)

plot('bio_countercurrent_exchange', 'In a fish gill, water and blood flow in opposite directions so water always has more O₂ than the blood beside it and exchange continues along the whole lamella. In concurrent flow they equalise at 50%.',
    fns=[F('100-80*x', 'water PO₂', 'blue', width=2), F('90-80*x', 'blood, countercurrent', 'red', width=2.6), F('50*(1-exp(-k*x))', 'blood, concurrent', 'dim', True)], x=[0, 1], y=[0, 105], xlabel='position along lamella', ylabel='PO₂ (% of water inlet)',
    params=[P('k', 'exchange rate (concurrent)', 2, 10, 5, step=0.5)], readouts=[R('countercurrent blood out', '90', '%'), R('concurrent blood out', '50*(1-exp(-k))', '%')])
S['bio_countercurrent_exchange']['fns'][1]['f'] = '10+80*x'
S['bio_countercurrent_exchange']['fns'][2]['f'] = '50*(1-exp(-k*x))'
S['bio_countercurrent_exchange']['fns'][0]['f'] = '100-80*x'
S['bio_countercurrent_exchange']['caption'] = 'Water (blue) loses O₂ as it flows 0→1; blood in counter-current flows 1→0 and so is always a little lower than the water beside it (red), leaving at ≈ 90%. In concurrent flow (dashed) blood levels off near 50%.'

plot('bio_acid_base_physiology', 'Henderson–Hasselbalch: pH = 6.1 + log₁₀[HCO₃⁻]/(0.03·PCO₂). Breathing out less CO₂ (high PCO₂) lowers pH; kidneys adjust bicarbonate. Normal: 40 mmHg, 24 mM, pH 7.40.',
    fns=[F('6.1+log10(hco3/(0.03*x))', 'blood pH', 'accent', width=2.6)], x=[20, 100], y=[6.8, 7.8], xlabel='PCO₂ (mmHg)', ylabel='pH', hlines=[{'y': 7.4, 'label': 'normal'}],
    points=[{'x': 'pco2', 'y': '6.1+log10(hco3/(0.03*pco2))', 'label': 'pH {6.1+log10(hco3/(0.03*pco2))}'}],
    params=[P('hco3', 'bicarbonate', 10, 40, 24, step=1, unit='mM'), P('pco2', 'PCO₂', 20, 100, 40, step=1, unit='mmHg')], readouts=[R('pH', '6.1+log10(hco3/(0.03*pco2))')])

plot('bio_blood_pressure_control', 'Mean arterial pressure = cardiac output × resistance, with CO = HR × SV. Raise heart rate or stroke volume, or constrict vessels (higher resistance), and pressure goes up.',
    fns=[F('hr*sv/1000*x', 'MAP at this cardiac output', 'red', width=2.6)], x=[5, 30], y=[0, 200], xlabel='vascular resistance (mmHg·min/L)', ylabel='MAP (mmHg)', hlines=[{'y': 93, 'label': 'normal ≈ 93'}],
    points=[{'x': 'svr', 'y': 'hr*sv/1000*svr'}], params=[P('hr', 'heart rate', 40, 180, 72, step=1, unit='bpm'), P('sv', 'stroke volume', 40, 120, 70, step=1, unit='mL'), P('svr', 'resistance', 5, 30, 18, step=0.5)],
    readouts=[R('cardiac output', 'hr*sv/1000', 'L/min'), R('MAP', 'hr*sv/1000*svr', 'mmHg')])

plot('bio_exercise_physiology', 'Energy systems hand over: stored phosphagens power the first seconds, glycolysis the next minute or two, and aerobic metabolism takes over for longer efforts. Shares are approximate.',
    fns=[F('100/(1+(x/8)^2.5)', 'phosphagen (ATP–PCr)', 'gold', width=2.6), F('100*max(0,1-1/(1+(x/8)^2.5)-1/(1+(60/x)^2.5))', 'glycolytic', 'orange', width=2.6), F('100/(1+(60/x)^2.5)', 'aerobic', 'green', width=2.6)],
    x=[1, 1000], logx=True, y=[0, 105], xlabel='duration of effort (s)', ylabel='% of energy')

plot('bio_torpor_hibernation', 'Metabolic rate falls about Q10-fold for each 10 °C drop in body temperature; torpor adds active suppression on top. At 5 °C a hibernator runs at a few percent of its normal rate.',
    fns=[F('100*q10^((x-37)/10)', 'relative metabolic rate', 'blue', width=2.6)], x=[-3, 40], y=[0, 105], xlabel='body temperature (°C)', ylabel='% of normal rate',
    points=[{'x': 'tb', 'y': '100*q10^((tb-37)/10)'}], params=[P('q10', 'Q10', 2, 4, 2.5, step=0.1), P('tb', 'body temperature', -3, 37, 5, step=1, unit='°C')], readouts=[R('metabolic rate', '100*q10^((tb-37)/10)', '%')])

plot('bio_cytokines_chemokines', 'Cells follow a chemokine gradient toward its source. Concentration falls as e^(−x/λ) with distance; a larger diffusion length λ gives a longer-range signal. The dot is a neutrophil migrating up the gradient.',
    fns=[F('100*exp(-x/lam)', 'chemokine', 'purple', width=2.6)], x=[0, 400], y=[0, 105], xlabel='distance from infection (µm)', ylabel='relative concentration',
    points=[{'x': '400-mod(t*30,400)', 'y': '100*exp(-(400-mod(t*30,400))/lam)', 'color': 'gold', 'label': 'neutrophil'}], params=[P('lam', 'diffusion length λ', 20, 200, 80, step=5, unit='µm')])

tree('bio_hematopoiesis', 'All blood cells descend from haematopoietic stem cells in bone marrow, which split into myeloid and lymphoid lineages.',
     ('HSC', [('Myeloid', [('Red cells', []), ('Platelets', []), ('Neutrophils', []), ('Monocytes', [])]), ('Lymphoid', [('T cells', []), ('B cells', []), ('NK cells', [])])]))

blocks('bio_complement_system', 'Three pathways converge on C3 cleavage; the products tag microbes (opsonisation), attract phagocytes (C5a) and assemble the membrane attack complex.',
    [nd('a', 'classical / lectin / alternative', 50, 6, 'accent'), nd('b', 'C3 convertase', 50, 32, 'gold'), nd('c', 'opsonise', 14, 62, 'green'), nd('d', 'C5a recruits', 50, 62, 'orange'), nd('e', 'MAC lyses', 86, 62, 'red'), nd('f', 'microbe cleared', 50, 94, 'purple')],
    [('a', 'b'), ('b', 'c'), ('b', 'd'), ('b', 'e'), ('c', 'f'), ('d', 'f'), ('e', 'f')], aspect=0.85)

plot('bio_spemann_induction', 'The organiser secretes BMP inhibitors, so BMP activity is lowest next to it and rises away from it. Tissues read thresholds: low BMP → neural, middle → mesoderm, high → epidermis. Raise the inhibitor strength to push the boundaries outward.',
    fns=[F('1/(1+I*exp(-x/60))', 'BMP activity', 'orange', width=2.6)], x=[0, 300], y=[0, 1.05], xlabel='distance from organiser (µm)', ylabel='relative BMP activity',
    hlines=[{'y': 0.2, 'label': 'neural < 0.2'}, {'y': 0.6, 'label': 'epidermis > 0.6'}], params=[P('I', 'organiser inhibitor strength', 1, 20, 6, step=0.5)])

add('bio_sex_determination_development', dict(type='blocks', flow=True, nodes=[nd('x', 'XY embryo', 16, 15, 'accent'), nd('s', 'SRY → SOX9', 56, 15, 'gold'), nd('t', 'testis', 88, 15, 'blue'), nd('m', 'testosterone + AMH → male ducts', 50, 38, 'blue'),
    nd('o', 'XX, no SRY', 16, 70, 'accent'), nd('v', 'ovary', 50, 70, 'pink'), nd('f', 'Müllerian ducts → female tract', 50, 92, 'pink')],
    edges=[dict(**{'from': 'x', 'to': 's'}), dict(**{'from': 's', 'to': 't'}), dict(**{'from': 't', 'to': 'm'}), dict(**{'from': 'o', 'to': 'v'}), dict(**{'from': 'v', 'to': 'f'})], aspect=0.85,
    caption='A single Y-linked gene, SRY, switches the gonad toward testis; without it the gonad becomes an ovary, and the hormones each gonad makes direct the rest of development.'))

plot('bio_axis_symmetry_breaking', 'Bicoid mRNA is localised at the embryo\'s front and its protein forms a gradient, c = e^(−x/λ). Hunchback turns on where Bicoid exceeds a threshold, so doubling the Bicoid dose moves the boundary toward the back by λ·ln2.',
    fns=[F('copies*exp(-x/20)', 'Bicoid', 'gold', width=2.6)], x=[0, 100], y=[0, 4.2], xlabel='position (% egg length from front)', ylabel='relative Bicoid',
    hlines=[{'y': 0.3, 'label': 'Hunchback threshold'}], vlines=[{'x': '20*ln(copies/0.3)', 'label': 'boundary'}], params=[P('copies', 'bicoid gene copies', 1, 4, 2, step=1)],
    readouts=[R('boundary position', '20*ln(copies/0.3)', '% EL')])

add('bio_flow_cytometry', dict(type='heatmap', f='0.5*exp(-((x-30)/9)^2-((y-20)/8)^2)+0.8*exp(-((x-45)/12)^2-((y-40)/12)^2)+0.7*exp(-((x-60)/12)^2-((y-70)/14)^2)',
    x=[0, 100], y=[0, 100], equal=False, xlabel='forward scatter (size)', ylabel='side scatter (granularity)',
    shapes=[dict(k='poly', pts=[['gx', 'gy'], [100, 'gy'], [100, 100], ['gx', 100]], color='gold', width=2, fill='gold', alpha=.12), T(52, 4, 'gate: {100*(0.3*0.5*(1-erf((gx-30)/(9*sqrt(2))))*0.5*(1-erf((gy-20)/(8*sqrt(2))))+0.45*0.5*(1-erf((gx-45)/(12*sqrt(2))))*0.5*(1-erf((gy-40)/(12*sqrt(2))))+0.25*0.5*(1-erf((gx-60)/(12*sqrt(2))))*0.5*(1-erf((gy-70)/(14*sqrt(2)))))}% of cells', 'gold', 10, 'center')],
    params=[P('gx', 'gate: forward scatter above', 0, 80, 40, step=1), P('gy', 'gate: side scatter above', 0, 80, 30, step=1)], aspect=0.8,
    caption='Each cell is a point in scatter space; clusters are cell types (lymphocytes small and smooth, monocytes mid, granulocytes large and granular). Draw a gate to count or sort one population.'))

plot('bio_calibration_standard_curves', 'A standard curve converts signal to concentration. The limit of detection LOD ≈ 3.3σ/slope falls as the noise σ falls. Increase the blank noise to see detection get worse.',
    fns=[F('0.05+0.02*x', 'calibration line', 'accent', width=2.6)], x=[0, 50], y=[0, 1.1], xlabel='standard concentration (µM)', ylabel='signal',
    points=[{'x': 0, 'y': 0.05}, {'x': 5, 'y': 0.16}, {'x': 10, 'y': 0.24}, {'x': 20, 'y': 0.46}, {'x': 30, 'y': 0.64}, {'x': 40, 'y': 0.86}, {'x': 50, 'y': 1.04}],
    vlines=[{'x': '3.3*sg/0.02', 'label': 'LOD'}], params=[P('sg', 'noise σ (blank)', 0.002, 0.05, 0.01, step=0.001)],
    readouts=[R('LOD = 3.3σ/slope', '3.3*sg/0.02', 'µM'), R('LOQ = 10σ/slope', '10*sg/0.02', 'µM')])

chain('bio_western_blot_elisa_protocols', 'A Western blot: separate proteins by size, transfer them to a membrane, block, probe with antibodies, and image the bands.',
      ['lysate', 'SDS-PAGE', 'transfer', 'block', 'primary Ab', 'secondary-HRP', 'detect + quantify'])

plot('bio_ecosystem_stability', 'Net growth of a lake or rangeland under grazing or nutrient load c: dx/dt = rx(1 − x/K) − c·x²/(1 + x²). Raise c and the stable states vanish at a tipping point; the system jumps to a degraded state.',
    fns=[F('x*(1-x/10)-c*x^2/(1+x^2)', 'dx/dt', 'accent', width=2.6)], x=[0, 10], y=[-1, 1.3], xlabel='vegetation / biomass x', ylabel='net growth', hlines=[{'y': 0, 'label': ''}],
    params=[P('c', 'grazing / loading c', 1.5, 3, 2.2, step=0.05)])

add('bio_pollination_networks', dict(type='graph', nodes=[dict(id='p%d' % i, label='P%d' % (i + 1), color='green', x=16, y=10 + i * 25) for i in range(4)] + [dict(id='a%d' % i, label='A%d' % (i + 1), color='gold', x=84, y=6 + i * 19) for i in range(5)],
    edges=[['p0', 'a0'], ['p0', 'a1'], ['p0', 'a2'], ['p0', 'a3'], ['p1', 'a0'], ['p1', 'a1'], ['p1', 'a2'], ['p2', 'a0'], ['p2', 'a1'], ['p3', 'a0'], ['p0', 'a4']],
    steps=[['p0'], ['a0', 'a1', 'a2', 'a3', 'a4'], ['p1'], ['p2', 'p3']], aspect=0.7,
    caption='Plants (green) and pollinators (gold) form a nested web: specialists (P3, P4; A4, A5) tie to generalists (P1, A1). Watch the links light up; losing a generalist hurts many partners.'))

blocks('bio_soil_ecology', 'The soil food web: plant litter feeds bacteria and fungi, which are eaten by protozoa and nematodes, which in turn feed mites and larger predators, releasing nutrients to plants.',
    [nd('a', 'plant litter, roots', 50, 6, 'green'), nd('b', 'bacteria, fungi', 50, 28, 'purple'), nd('c', 'protozoa, nematodes', 50, 50, 'orange'), nd('d', 'mites, predators', 50, 72, 'red'), nd('e', 'nutrients for plants', 50, 94, 'accent')],
    [('a', 'b'), ('b', 'c'), ('c', 'd'), ('c', 'e', 'mineralise'), ('b', 'e')], aspect=0.95)
