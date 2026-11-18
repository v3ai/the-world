from lib import *
import math

# ===== GENOMICS =====
sizes = [10000, 5000, 3000, 2000, 1000, 500, 250]
gel = [Rc(-3.2, 0.1, 6.4, 0.7, 'dim', 'dim', 0.15, 1), Rc(-3.2, -4.6, 6.4, 4.7, 'accent', 'accent', 0.06, 1)]
for lane, xx in enumerate([-2.2, 0.0, 2.2]):
    gel.append(Rc(xx - 0.5, 0.0, 1.0, 0.35, 'dim', 'dim', 0.6))
dist = lambda L: '(5.2-log10(%s))*(0.6+0.4*pct)' % L
for L_ in sizes:
    gel += [Rc(-2.7, '-0.6-%s-0.07' % dist(L_), 1.0, 0.14, 'white', 'white', 0.8), T(-3.0, '-0.6-%s' % dist(L_), '%d' % L_, 'dim', 8, 'right')]
gel += [Rc(-0.5, '-0.6-%s-0.07' % dist('Ls'), 1.0, 0.14, 'gold', 'gold', 0.9), Rc(1.7, '-0.6-%s-0.07' % dist('Ls*0.4'), 1.0, 0.14, 'pink', 'pink', 0.9), Rc(1.7, '-0.6-%s-0.07' % dist('Ls*1.7'), 1.0, 0.14, 'pink', 'pink', 0.9),
        T(-2.2, 0.55, 'ladder', 'white', 9, 'center'), T(0, 0.55, 'sample', 'gold', 9, 'center'), T(2.2, 0.55, 'digest', 'pink', 9, 'center'), T(0, -4.9, '− at top (wells), + at bottom: small DNA runs furthest', 'dim', 9, 'center')]
geo('bio_gel_electrophoresis', 'DNA is negatively charged, so it moves toward + through the gel; smaller fragments move further, with distance roughly proportional to −log(size). Change the sample size and the gel percentage.',
    [-3.6, 3.4, -5.2, 1.0], gel, params=[P('Ls', 'sample fragment size', 250, 10000, 1500, 'bp', 50), P('pct', 'agarose', 0.7, 2.0, 1.0, '%', 0.1)],
    readouts=[R('migration of sample', '(5.2-log10(Ls))*(0.6+0.4*pct)', 'cm (relative)')], aspect=0.8, equal=False)
plot('bio_pcr', 'Each cycle can at most double the target: N = N₀(1+E)ⁿ. With 90% efficiency 30 cycles still gives ~10⁸-fold, but small efficiency losses compound. Slide cycles and efficiency.',
     [F('N0*(1+E)^x', 'copies of target', 'accent'), F('N0*2^x', 'perfect doubling', 'dim', True)], x=[0, 40], y=[1, 1e13], logy=True, xlabel='cycle number', ylabel='copies',
     params=[P('E', 'efficiency E', 0.6, 1, 0.9, step=0.01), P('N0', 'starting copies', 1, 10000, 100, step=1), P('cy', 'cycles', 10, 40, 30, step=1)],
     points=[dict(x='cy', y='N0*(1+E)^cy', color='gold')], readouts=[R('copies after cycles', 'N0*(1+E)^cy'), R('fold amplification', '(1+E)^cy')])
chain('bio_restriction_cloning', 'The same restriction enzyme cuts vector and insert, leaving matching sticky ends; DNA ligase seals them, and antibiotic selection finds the bacteria that took up the plasmid.',
      ['Cut vector + insert', 'Sticky ends anneal', 'DNA ligase seals', 'Transform E. coli', 'Select on antibiotic'], per_row=3, colors=['accent', 'gold', 'gold', 'green', 'pink'], aspect=0.62)
chain('bio_recombinant_expression', 'Put the gene behind a strong inducible promoter in a vector, add the inducer (IPTG), then lyse the cells and capture the His-tagged protein on a nickel column.',
      ['Gene in vector', 'Transform E. coli', 'Induce with IPTG', 'Lyse cells', 'Ni column purify', 'Pure protein'], per_row=3, colors=['accent', 'accent', 'gold', 'dim', 'gold', 'green'], aspect=0.62)
plot('bio_sanger_sequencing', 'A small fraction r of nucleotides are chain-terminating ddNTPs, so each fragment length n appears with probability r(1−r)ⁿ⁻¹. Lower r gives longer reads but fewer short ones.',
     [F('r*(1-r)^(x-1)*100', 'share of fragments of length n (%)', 'accent')], x=[1, 1000], y=[0, 3], xlabel='fragment length n (nt)', ylabel='% of fragments',
     params=[P('r', 'ddNTP fraction r', 0.002, 0.03, 0.005, step=0.001)], readouts=[R('mean read length 1/r', '1/r', 'nt')])
bars('bio_ngs', 'Next-generation sequencers read millions of molecules in parallel: output per run is up to ten million times a Sanger capillary run.',
     [('Sanger', 0.0001, 'dim'), ('MiSeq', 15, 'accent'), ('PacBio', 90, 'gold'), ('Nanopore', 100, 'pink'), ('NovaSeq', 3000, 'green')], logy=True, ylabel='output per run (Gb, approx.)', aspect=0.7)
plot('bio_genome_assembly', 'Reads land randomly, so the fraction of the genome covered is 1 − e^(−c) (Lander–Waterman). Coverage c = N·L/G; slide the read count to see when gaps disappear.',
     [F('100*(1-exp(-x))', 'genome covered (%)', 'accent')], x=[0, 12], y=[0, 100], xlabel='coverage c (×)', ylabel='genome covered (%)',
     points=[dict(x='N*L/G', y='100*(1-exp(-N*L/G))', color='gold')],
     params=[P('N', 'reads', 1, 400, 100, 'million', 1), P('L', 'read length', 50, 300, 150, 'bp', 10), P('G', 'genome size', 5, 3000, 3000, 'Mb', 5)],
     readouts=[R('coverage', 'N*L/G', '×'), R('uncovered', '100*exp(-N*L/G)', '%')])
chain('bio_transcriptomics', 'RNA-seq turns the set of active transcripts into counts: isolate RNA, make cDNA, sequence, align reads to the genome, count per gene and test for differences between conditions.',
      ['Isolate RNA', 'Make cDNA library', 'Sequence', 'Align to genome', 'Count per gene', 'Differential expression'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'green', 'pink'], aspect=0.62)
chain('bio_proteomics_omics', 'Omics layers build on each other: the genome is the same in every cell, while transcripts, proteins and metabolites change; integrating them is systems biology.',
      ['Genome', 'Transcriptome', 'Proteome', 'Metabolome', 'Phenotype'], per_row=3, colors=['accent', 'gold', 'green', 'pink', 'orange'], aspect=0.55)
blocks('bio_crispr_cas9', 'A guide RNA leads Cas9 to a 20-nt match next to an NGG PAM; Cas9 cuts both strands, and repair either breaks the gene (NHEJ) or copies in a supplied edit (HDR).',
       [('g', 'Guide RNA + Cas9', 15, 12, 'gold'), ('p', 'Finds target + PAM', 62, 12), ('c', 'Double-strand cut', 38, 50, 'pink'), ('n', 'NHEJ: knockout', 15, 90, 'accent'), ('h', 'HDR: precise edit', 75, 90, 'green')],
       [('g', 'p'), ('p', 'c'), ('c', 'n', 'no template'), ('c', 'h', 'template')], aspect=0.7)
chain('bio_gmo_transgenics', 'A gene of interest is delivered (Agrobacterium or gene gun) into plant cells, which are regenerated into whole plants; every cell then carries the transgene.',
      ['Gene of interest', 'Vector / Agrobacterium', 'Plant cell', 'Regenerate plant', 'Transgenic crop'], per_row=3, colors=['accent', 'gold', 'dim', 'green', 'green'], aspect=0.62)
blocks('bio_gene_therapy', 'A harmless virus (often AAV) delivers a working gene. In vivo it is injected into the body; ex vivo the patient\'s cells are corrected in the lab and returned.',
       [('v', 'Viral vector + gene', 15, 15, 'gold'), ('i', 'In vivo: inject', 15, 55), ('e', 'Ex vivo: edit cells', 80, 55), ('t', 'Target cells make protein', 50, 90, 'green')],
       [('v', 'i'), ('v', 'e'), ('i', 't'), ('e', 't', 'return cells')], aspect=0.6)
plot('bio_dna_fingerprinting_blotting', 'Each STR locus gives a genotype shared by only a few percent of people; independent loci multiply. With 13 CODIS loci the random-match probability is about 10⁻¹⁵.',
     [F('p^x', 'random match probability', 'accent')], x=[1, 20], y=[1e-20, 1], logy=True, xlabel='number of loci', ylabel='match probability',
     params=[P('p', 'typical genotype frequency', 0.02, 0.2, 0.08, step=0.01)], vlines=[dict(x=13, label='13 CODIS loci')], readouts=[R('at 13 loci', 'p^13'), R('one in', '1/p^13')])
table('bio_sequence_alignment', 'An alignment is scored: matches add, mismatches and gaps subtract. Change the scores and see how the total alignment score changes.',
      ['Pos', 'Seq 1', 'Seq 2', 'Score'],
      [['1', 'G', 'G', '{m}'], ['2', 'A', '–', '{gp}'], ['3', 'T', 'T', '{m}'], ['4', 'T', 'T', '{m}'], ['5', 'A', 'G', '{mm}'], ['6', 'C', 'C', '{m}'], ['7', 'A', 'A', '{m}']],
      aspect=0.85, params=[P('m', 'match', 0, 5, 2, step=1), P('mm', 'mismatch', -5, 0, -1, step=1), P('gp', 'gap', -5, 0, -2, step=1)], readouts=[R('total score', '5*m+mm+gp')])
plot('bio_blast_databases', 'BLAST reports an E-value, the number of hits expected by chance: E ≈ m·n·2⁻ˢ. A bigger database or longer query needs a higher bit score to be significant.',
     [F('m*10^dbl*2^(-x)', 'E-value', 'accent')], x=[10, 100], y=[1e-20, 1e10], logy=True, xlabel='bit score S', ylabel='expected chance hits E',
     hlines=[dict(y=1e-5, label='E = 10⁻⁵')], params=[P('m', 'query length', 50, 1000, 300, 'aa', 10), P('dbl', 'log₁₀ database size', 6, 12, 9, 'letters', 0.5)],
     readouts=[R('score needed for E = 10⁻⁵', 'log2(m*10^dbl/1e-5)', 'bits')])
tree('bio_phylogenetic_methods', 'Clustering by similarity builds a tree: the two closest sequences (human, chimp) join first, then others are added in order of distance. Press play to follow the order of joining.',
     [('r', 'root'), ('n4', ''), ('n3', ''), ('n2', ''), ('n1', ''), ('gib', 'gibbon'), ('ora', 'orangutan'), ('gor', 'gorilla'), ('hum', 'human'), ('chi', 'chimp')],
     [('r', 'gib'), ('r', 'n4'), ('n4', 'ora'), ('n4', 'n3'), ('n3', 'gor'), ('n3', 'n2'), ('n2', 'hum'), ('n2', 'chi')], aspect=0.75, steps=[['hum', 'chi'], ['n2'], ['gor', 'n3'], ['ora', 'n4'], ['gib', 'r']])
S['bio_phylogenetic_methods']['edges'] = [e for e in S['bio_phylogenetic_methods']['edges'] if e[0] != 'n1']; S['bio_phylogenetic_methods']['nodes'] = [n for n in S['bio_phylogenetic_methods']['nodes'] if n['id'] != 'n1']
bars('bio_comparative_human_genomics', 'The more recently two species shared an ancestor, the more alike their DNA: chimpanzees differ from us by only ~1–2% in aligned sequence.',
     [('chimp', 98.8, 'accent'), ('gorilla', 98.4, 'accent'), ('macaque', 93, 'gold'), ('mouse', 85, 'pink'), ('chicken', 70, 'green')], ylabel='sequence identity (%, approx.)', aspect=0.7)
S['bio_comparative_human_genomics']['bars'][4]['value'] = 70
plot('bio_metagenomics', 'The more DNA you sequence from a community, the more species you find, with diminishing returns (rarefaction). Rare species need very deep sequencing.',
     [F('Sr*(1-exp(-x/k))', 'species detected', 'accent'), F('Sr+0*x', 'true richness', 'dim', True)], x=[0, 1000], y=[0, 520], xlabel='sequencing effort (thousand reads)', ylabel='species observed',
     params=[P('Sr', 'true richness', 50, 500, 300, 'species', 10), P('k', 'evenness (higher = more rare species)', 50, 400, 150, step=10)],
     readouts=[R('found with 100k reads', 'Sr*(1-exp(-100/k))'), R('reads for 95%', '3*k', 'thousand')])

# ===== MICROBIOLOGY =====
bac = [Rc(-3.0, -1.0, 6.0, 2.0, 'green', 'green', 0.1, 2), C(-3.0, 0, 1.0, 'green', 'green', 2, alpha=0.1), C(3.0, 0, 1.0, 'green', 'green', 2, alpha=0.1),
       Rc(-3.0, -0.8, 6.0, 1.6, 'accent', None, None, 1.5), C(-3.0, 0, 0.8, 'accent', width=1.5), C(3.0, 0, 0.8, 'accent', width=1.5),
       Cv('-1.5+3*s', '0.3*sin(6*s)+0.2*cos(11*s)', [0, 1], 'gold', 2), C(-1.0, 0.1, 0.1, 'pink', 'pink'), C(0.3, -0.35, 0.1, 'pink', 'pink'), C(1.6, 0.3, 0.1, 'pink', 'pink'), C(2.0, -0.2, 0.1, 'pink', 'pink'), C(-2.2, -0.3, 0.1, 'pink', 'pink'),
       Cv('4.0+2.2*s', '0.35*sin(7*s*2.2-3*t)*s', [0, 1], 'orange', 2), L(-4.0, 0.4, -2.9, 0.4, 'accent', 1, dash=True),
       T(0, 1.55, 'cell wall (peptidoglycan)', 'green', 10, 'center'), T(0, -1.45, 'plasma membrane  ·  nucleoid (gold)  ·  ribosomes (pink)', 'dim', 9, 'center'), T(5.0, 0.9, 'flagellum', 'orange', 9, 'center'), T(-3.9, 0.75, 'pili', 'accent', 9, 'center')]
geo('bio_bacterial_structure', 'A rod-shaped bacterium: a peptidoglycan wall around the membrane, a nucleoid without a nuclear envelope, ribosomes, pili for attachment and a flagellum whose wave drives swimming.',
    [-4.6, 6.4, -2.0, 2.0], bac, aspect=0.45)
plot('bio_microbial_growth', 'Growth has four phases: lag, exponential (log) growth, stationary and death. A shorter generation time makes a steeper log phase; the lag depends on conditions.',
     [F('min(N0+max(0,x-lag)*0.301/g, 9.2)-max(0,x-td)*0.4', 'log₁₀ cells/mL', 'accent')], x=[0, 30], y=[2, 10], xlabel='time (h)', ylabel='log₁₀ cells per mL',
     params=[P('g', 'generation time', 0.3, 3, 0.5, 'h', 0.1), P('lag', 'lag phase', 0, 6, 2, 'h', 0.5), P('N0', 'log₁₀ start', 3, 6, 4, step=0.5), P('td', 'death begins', 12, 28, 20, 'h')],
     readouts=[R('doublings per hour', '1/g'), R('cells after 10 h', 'N0+max(0,10-lag)*0.301/g', 'log₁₀')])
S['bio_microbial_growth']['fns'][0]['f'] = 'min(N0+max(0,x-lag)*0.301/g, 9.2)-max(0,x-td)*0.4'
table('bio_microbial_metabolism', 'Microbes are classified by where they get energy (light or chemicals) and carbon (CO₂ or organic molecules); humans are chemoheterotrophs.',
      ['Type', 'Energy', 'Carbon'],
      [['Photo-auto', 'light', 'CO₂'], ['Photo-hetero', 'light', 'organic'], ['Chemo-auto', 'inorganic', 'CO₂'], ['Chemo-hetero', 'organic', 'organic']], aspect=0.55)
hub('bio_horizontal_gene_transfer', 'Bacteria swap genes sideways in three ways: through a pilus (conjugation), by taking up free DNA (transformation), or carried by phages (transduction).',
    'Donor DNA → recipient', ['Conjugation', 'Transformation', 'Transduction'], colors=['accent', 'gold', 'pink'], aspect=0.7)
tree('bio_bacterial_diversity', 'Bacteria include many phyla; a few big ones hold most cultured species: Proteobacteria (E. coli), Firmicutes (Bacillus), Actinobacteria (M. tuberculosis) and Cyanobacteria.',
     [('b', 'Bacteria'), ('p', 'Proteo'), ('f', 'Firmi'), ('a', 'Actino'), ('c', 'Cyano'), ('e', 'E. coli'), ('ba', 'Bacillus'), ('m', 'M. tb')],
     [('b', 'p'), ('b', 'f'), ('b', 'a'), ('b', 'c'), ('p', 'e'), ('f', 'ba'), ('a', 'm')], aspect=0.8)
plot('bio_archaea', 'Archaea thrive where most life cannot. Growth rate peaks at an optimum and collapses just above it; a mesophile, a thermophile and a hyperthermophile have optima 70 °C apart. Slide a custom optimum.',
     [F('x<Ta ? exp(-((x-Ta)/12)^2) : exp(-((x-Ta)/3)^2)', 'E. coli (37 °C)', 'dim').replace('Ta', '37') if False else F('(x<37 ? exp(-((x-37)/12)^2) : exp(-((x-37)/3.5)^2))', 'E. coli (37 °C)', 'dim'),
      F('(x<70 ? exp(-((x-70)/14)^2) : exp(-((x-70)/4)^2))', 'Thermus (70 °C)', 'gold'), F('(x<106 ? exp(-((x-106)/16)^2) : exp(-((x-106)/2.5)^2))', 'Pyrolobus (106 °C)', 'pink'),
      F('(x<To ? exp(-((x-To)/14)^2) : exp(-((x-To)/3)^2))', 'custom', 'accent', True)], x=[0, 120], y=[0, 1.1], xlabel='temperature (°C)', ylabel='relative growth',
     params=[P('To', 'custom optimum', 20, 110, 85, '°C')])
virus = [Pg([[-3.5, 0.0], [-3.0, 0.87], [-2.0, 0.87], [-1.5, 0.0], [-2.0, -0.87], [-3.0, -0.87]], 'accent', 'accent', 0.15, 3), C(-2.5, 0, 0.45, 'gold', 'gold', alpha=0.3), T(-2.5, -1.3, 'naked icosahedral', 'accent', 9, 'center'), T(-2.5, 1.3, 'capsid + genome', 'dim', 9, 'center'),
         C(2, 0, 1.2, 'pink', width=3), C(2, 0, 0.95, 'purple', 'purple', alpha=0.2, width=2), C(2, 0, 0.5, 'gold', 'gold', alpha=0.3), T(2, -1.9, 'enveloped', 'pink', 9, 'center')]
for k in range(12):
    a = k * math.pi / 6 + 0.2
    virus += [L(round(2 + 1.2 * math.cos(a), 3), round(1.2 * math.sin(a), 3), round(2 + 1.55 * math.cos(a), 3), round(1.55 * math.sin(a), 3), 'green', 2)]
virus += [T(2, 1.9, 'spike proteins', 'green', 9, 'center')]
geo('bio_viruses_structure', 'A virus is a genome (DNA or RNA) in a protein capsid, sometimes wrapped in a lipid envelope studded with spike proteins. Typical sizes are 20–300 nm; the envelope makes it fragile to soap.',
    [-4.5, 4.5, -2.3, 2.3], virus, aspect=0.5)
chain('bio_viral_life_cycles', 'Every virus must attach to a host cell, get in, copy its genome and make capsid proteins using host machinery, assemble new particles, and leave by lysis or budding.',
      ['Attach', 'Enter', 'Uncoat', 'Replicate + translate', 'Assemble', 'Release'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'green', 'pink'], aspect=0.62)
plot('bio_bacteriophages', 'In a one-step growth curve the phage titre stays flat during the eclipse and latent period, then jumps by the burst size when cells lyse. Slide both.',
     [F('1+(B-1)/(1+exp(-(x-Lp)/1.5))', 'free phage per infected cell', 'accent')], x=[0, 60], y=[0, 210], xlabel='time after infection (min)', ylabel='phage per infected cell',
     params=[P('Lp', 'latent period', 15, 45, 25, 'min'), P('B', 'burst size', 20, 200, 100)], readouts=[R('phage per cell at 60 min', 'B'), R('lysis at', 'Lp', 'min')])
chain('bio_retroviruses_hiv', 'HIV binds CD4 and a co-receptor, its RNA is copied to DNA by reverse transcriptase, integrase inserts it into our genome as a provirus, and new virions bud out. Drugs target RT, integrase and protease.',
      ['gp120 binds CD4', 'Fusion + entry', 'RT: RNA → DNA', 'Integrase: provirus', 'Transcribe + assemble', 'Bud (protease)'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'green', 'pink'], aspect=0.62)
table('bio_viroids_prions', 'Viroids are bare circular RNAs; prions are misfolded proteins with no nucleic acid; viruses carry a genome in a capsid. All three can be infectious.',
      ['Agent', 'Genetic material', 'Size'],
      [['Virus', 'DNA / RNA', '20–300 nm'], ['Viroid', 'circular RNA', '~300 nt'], ['Prion', 'none (PrP)', 'protein']], aspect=0.5)
plot('bio_emerging_viruses', 'Early in an outbreak cases grow exponentially at rate (R₀ − 1)/Tg. A higher R₀ gives a much faster rise and a higher herd-immunity threshold 1 − 1/R₀.',
     [F('min(I0*exp((R0-1)*x/Tg),1e7)', 'new infections', 'accent')], x=[0, 60], y=[1, 1e7], logy=True, xlabel='days', ylabel='cases (log scale)',
     params=[P('R0', 'R₀', 1.1, 6, 2.5, step=0.1), P('Tg', 'generation time', 2, 10, 5, 'days'), P('I0', 'initial cases', 1, 100, 10)],
     readouts=[R('doubling time', 'ln(2)*Tg/(R0-1)', 'days'), R('herd-immunity threshold', '100*(1-1/R0)', '%')])
hub('bio_protists', 'Protists are not one group but several eukaryotic lineages: amoebae, alveolates (ciliates, Plasmodium), stramenopiles (diatoms, kelp) and excavates (Giardia, trypanosomes).',
    'Protists', ['Amoebozoa', 'Alveolata', 'Stramenopiles', 'Excavata'], colors=['accent', 'pink', 'green', 'gold'], aspect=0.8)
bars('bio_human_microbiome', 'Microbial density rises dramatically down the gut: the stomach is nearly sterile while the colon holds about 10¹¹ cells per gram.',
     [('skin (cm²)', 1e4, 'accent'), ('stomach', 1e3, 'gold'), ('saliva', 1e8, 'pink'), ('ileum', 1e8, 'green'), ('colon', 1e11, 'orange')], logy=True, ylabel='microbes per g or mL (approx.)', aspect=0.7)
plot('bio_pathogenesis', 'The chance of infection rises with dose, P = 1 − e^(−r·dose). The ID₅₀ (dose infecting half of hosts) is ln2 / r, so highly virulent pathogens have a tiny ID₅₀.',
     [F('100*(1-exp(-r*x))', 'P(infection)', 'accent')], x=[1, 1e6], logx=True, y=[0, 100], xlabel='dose (organisms)', ylabel='infected (%)',
     params=[P('r', 'infectivity r (per organism)', 0.00001, 0.1, 0.001, step=0.00001)], vlines=[dict(x='ln(2)/r', label='ID50')], readouts=[R('ID50', 'ln(2)/r', 'organisms')])
S['bio_pathogenesis']['params'][0]['min'] = 1e-5; S['bio_pathogenesis']['params'][0]['step'] = 1e-5
plot('bio_antibiotics', 'Above the MIC the kill rate beats the growth rate and the population falls; below it bacteria keep growing. Slide the dose as a multiple of the MIC.',
     [F('6+(0.9-3*Cm^2/(1+Cm^2))*x/2.303', 'log₁₀ CFU/mL', 'accent'), F('6+0.9*x/2.303', 'no drug', 'dim', True)], x=[0, 24], y=[0, 10], xlabel='hours', ylabel='log₁₀ CFU per mL',
     params=[P('Cm', 'dose (× MIC)', 0, 8, 2, step=0.25)], readouts=[R('net rate per hour', '0.9-3*Cm^2/(1+Cm^2)'), R('log reduction at 24 h', '-(0.9-3*Cm^2/(1+Cm^2))*24/2.303')])
plot('bio_antibiotic_resistance', 'Under drug pressure a tiny resistant minority takes over: p(t) follows the logistic curve with selection s. Higher selection or a larger starting fraction shortens the time.',
     [F('100*p0*exp(s*x)/(1-p0+p0*exp(s*x))', 'resistant fraction (%)', 'pink')], x=[0, 60], y=[0, 100], xlabel='days of treatment', ylabel='% resistant',
     params=[P('s', 'selection advantage', 0.1, 1.5, 0.5, '/day', 0.05), P('lp', 'start: 1 in 10^k', 4, 9, 6, step=1)], readouts=[R('days to reach 50%', 'ln(10^lp)/s')])
S['bio_antibiotic_resistance']['fns'][0]['f'] = '100*10^(-lp)*exp(s*x)/(1-10^(-lp)+10^(-lp)*exp(s*x))'
plot('bio_microbial_control', 'Heat kills exponentially: log₁₀N falls by 1 every D minutes, and D shrinks tenfold for every z °C. Raise the temperature to sterilise faster.',
     [F('12-x/(D121*10^((121-T)/10))', 'log₁₀ survivors', 'accent')], x=[0, 30], y=[-2, 12], xlabel='time (min)', ylabel='log₁₀ spores per mL', hlines=[dict(y=0, label='1 survivor')],
     params=[P('T', 'temperature', 100, 130, 121, '°C'), P('D121', 'D-value at 121 °C', 0.5, 3, 1.5, 'min', 0.1)],
     readouts=[R('D at this T', 'D121*10^((121-T)/10)', 'min'), R('time for 12-log kill', '12*D121*10^((121-T)/10)', 'min')])
plot('bio_biofilms_quorum', 'Cells release autoinducer, so its level tracks population density; a gene switches on abruptly past a threshold density (quorum sensing). Slide the threshold and sharpness.',
     [F('100*x^n/((10^lc)^n+x^n)', 'gene activation (%)', 'accent')], x=[1e5, 1e10], logx=True, y=[0, 100], xlabel='cell density (cells/mL)', ylabel='activation (%)',
     params=[P('lc', 'log₁₀ threshold', 6, 9, 8, step=0.1), P('n', 'cooperativity', 1, 4, 2, step=0.5)], vlines=[dict(x='10^lc', label='quorum')], readouts=[R('threshold', '10^lc', 'cells/mL')])

# ===== DEVELOPMENT =====
chain('bio_fertilization', 'The sperm crosses the egg coat after an acrosome reaction; fusion triggers a calcium wave that hardens the coat and blocks other sperm, then the pronuclei merge.',
      ['Sperm binds zona', 'Acrosome reaction', 'Membranes fuse', 'Ca²⁺ wave', 'Block to polyspermy', 'Pronuclei fuse'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'pink', 'green'], aspect=0.62)
plot('bio_cleavage_blastula', 'Cleavage divides the egg into more and more cells without growth, so each cell gets smaller as 1/2ⁿ. Slide the number of divisions.',
     [F('2^x', 'cell number', 'accent'), F('100/2^x', 'cell volume (% of zygote)', 'pink')], x=[0, 8], y=[0.1, 400], logy=True, xlabel='cleavage divisions', ylabel='cells  /  % volume',
     params=[P('nd', 'divisions', 0, 8, 4, step=1)], points=[dict(x='nd', y='2^nd', color='gold')], readouts=[R('cells', '2^nd'), R('each cell volume', '100/2^nd', '% of egg')])
tree('bio_gastrulation_germ_layers', 'Gastrulation produces three germ layers; every organ derives from one of them. Ectoderm makes skin and nerves, mesoderm muscle and blood, endoderm the gut lining and liver.',
     [('g', 'Gastrula'), ('ec', 'Ectoderm'), ('me', 'Mesoderm'), ('en', 'Endoderm'), ('a', 'Skin'), ('b', 'Muscle'), ('c', 'Gut')],
     [('g', 'ec'), ('g', 'me'), ('g', 'en'), ('ec', 'a'), ('me', 'b'), ('en', 'c')], aspect=0.7)
chain('bio_neurulation_organogenesis', 'The notochord induces the neural plate, whose edges fold up and fuse into the neural tube (future brain and spinal cord); neural crest cells migrate out and somites form beside it.',
      ['Notochord signals', 'Neural plate', 'Neural folds rise', 'Neural tube closes', 'Crest + somites'], per_row=3, colors=['gold', 'accent', 'accent', 'green', 'pink'], aspect=0.62)
plot('bio_morphogens_gradients', 'A morphogen decays exponentially from its source, C = C₀e^(−x/λ). Cells read thresholds: high = one fate, medium = another, low = a third (the French-flag model). Change λ or the source strength.',
     [F('C0*exp(-x/lam)', 'morphogen concentration', 'accent')], x=[0, 500], y=[0, 105], xlabel='distance from source (µm)', ylabel='concentration (% of source)',
     hlines=[dict(y=50, label='threshold 1'), dict(y=15, label='threshold 2')], vlines=[dict(x='lam*ln(C0/50)', label='boundary 1'), dict(x='lam*ln(C0/15)', label='boundary 2')],
     params=[P('lam', 'decay length λ', 30, 200, 100, 'µm'), P('C0', 'source level', 60, 100, 100, '%')], readouts=[R('blue/red boundary at', 'lam*ln(C0/50)', 'µm'), R('red/white boundary at', 'lam*ln(C0/15)', 'µm')])
grid('bio_hox_developmental_genes', 'Hox genes lie on the chromosome in the same order as the body regions they pattern (colinearity): front genes specify the head end, rear genes the tail end.',
     ['Hox1–3 head', 'Hox4–5 neck', 'Hox6–8 chest', 'Hox9 arms', 'Hox10 lumbar', 'Hox13 tail'], cols=3, colors=['accent', 'accent', 'gold', 'green', 'green', 'pink'], aspect=0.6)
table('bio_developmental_signaling', 'A handful of conserved pathways run the whole embryo, reused in different tissues to set axes, make boundaries and tell cells what to become.',
      ['Pathway', 'Key role'],
      [['Wnt', 'body axis, stem cells'], ['Hedgehog', 'neural tube, limb patterning'], ['Notch', 'neighbour decisions'], ['BMP / TGF-β', 'dorsal-ventral axis'], ['FGF', 'limb outgrowth, induction']], aspect=0.65)
chain('bio_organoids_regeneration', 'After amputation a salamander forms a blastema of dedifferentiated cells that re-grows the limb; metamorphosis is a hormone-triggered remodelling, e.g. tadpole to frog.',
      ['Injury', 'Wound epidermis', 'Blastema forms', 'Cells proliferate', 'Pattern restored'], per_row=3, colors=['pink', 'dim', 'gold', 'gold', 'green'], aspect=0.62)
table('bio_human_prenatal_development', 'Human development is dated from fertilisation; the embryonic period (weeks 3–8) builds all the organ systems, and later growth refines them.',
      ['Week', 'Event'],
      [['1', 'cleavage, blastocyst'], ['2', 'implantation'], ['3', 'gastrulation'], ['4', 'neural tube closes'], ['8', 'all major organs formed'], ['24', 'viability threshold'], ['38', 'full term']], aspect=0.75)
chain('bio_plant_embryogenesis_note', 'The plant zygote divides asymmetrically to make an embryo (globular, heart, torpedo stages) with a root and shoot pole; the seed dries and stays dormant until water triggers germination.',
      ['Zygote', 'Asymmetric division', 'Globular', 'Heart (cotyledons)', 'Dormant seed', 'Germination'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'dim', 'green'], aspect=0.62)
