from lib import *
import math

# ===== HUBS =====
grid('biology_degree', 'The degree runs from atoms to ecosystems; each box is a field you can open from the map.',
     ['Foundations', 'Chemistry', 'Biochem', 'Cells', 'Molecular', 'Genetics', 'Genomics', 'Microbio', 'Evolution', 'Diversity', 'Plants', 'Animals', 'Neuro', 'Immuno', 'Develop.', 'Ecology', 'Biostats', 'Lab skills', 'Electives', 'Processes'],
     cols=4, center='Biology (B.S.)', colors=['accent'] * 3 + ['green'] * 4 + ['purple'] + ['gold'] * 2 + ['orange', 'pink', 'pink', 'pink', 'green', 'orange', 'dim', 'dim', 'dim', 'dim'])
grid('bio_foundations', 'Foundations are the habits and big ideas of the whole science, from the scientific method to its history.',
     ['Sci. method', 'Themes', 'Levels', 'Life traits', 'Cell theory', 'Homeostasis', 'Models', 'Taxonomy', 'Controls', 'History'],
     cols=3, center='Foundations')
grid('bio_chem_life', 'Life runs on a short list of chemical rules: bonds, water, pH, and energy.',
     ['Atoms', 'Shells', 'Bonds', 'H-bonds', 'Weak forces', 'Water', 'Solutions', 'pH', 'Buffers', 'Molarity', 'Equilibrium', 'Kinetics',
      'Thermo', 'Free energy', 'Redox', 'ATP', 'Ions', 'Carbon', 'Dehydration'], cols=4, center='Chemistry of life',
     colors=['accent'] * 6 + ['green'] * 4 + ['gold'] * 5 + ['pink'] * 4)
grid('bio_orgchem', 'Organic chemistry gives the vocabulary (groups, shapes) and the verbs (reaction types) that biochemistry uses.',
     ['Func. groups', 'Isomers', 'Chirality', 'Sugar rings', 'Conformation', 'pKa', 'Nu / E', 'Substitution', 'Carbonyl', 'Acyl transfer', 'Phosphoryl', 'Redox', 'Resonance', 'Spectroscopy'],
     cols=3, center='Organic chem', colors=['accent'] * 5 + ['gold'] * 8 + ['green'])
grid('bio_biochem', 'The molecules (sugars, lipids, proteins, nucleic acids), the catalysts that act on them, and the pathways that link them.',
     ['Sugars', 'Lipids', 'Amino acids', 'Proteins', 'Nucleic acids', 'Enzymes', 'Kinetics', 'Regulation', 'Glycolysis', 'Krebs cycle', 'Resp. chain', 'Photosynth.', 'Fat & N use', 'Integration'],
     cols=3, center='Biochemistry', colors=['accent'] * 5 + ['gold'] * 3 + ['green'] * 6)
grid('bio_cell_biology', 'A cell is a membrane-bound compartment with transport, organelles, a skeleton, signalling and a life cycle.',
     ['Cell types', 'Membrane', 'Transport', 'Nucleus', 'Secretion', 'Organelles', 'Wall / ECM', 'Cytoskeleton', 'Signalling', 'Cell cycle', 'Apoptosis', 'Stem cells', 'Telomeres'],
     cols=3, center='Cell biology', colors=['accent'] * 3 + ['green'] * 4 + ['gold'] * 2 + ['pink'] * 4)
grid('bio_molecular', 'DNA is stored, copied, repaired, transcribed, translated, and regulated; each stage has its own machinery.',
     ['DNA structure', 'Chromatin', 'Replication', 'Repair', 'Recombination', 'Genetic code', 'Transcription', 'RNA splicing', 'Translation', 'Operons', 'Euk. control', 'Epigenetics', 'ncRNA', 'Cancer genes'],
     cols=3, center='Molecular biology', colors=['accent'] * 5 + ['gold'] * 4 + ['green'] * 5)
grid('bio_genetics', 'Genetics starts with Mendel and crosses, adds chromosomes, mutation and pedigrees, then scales up to populations.',
     ['Mendel', 'Alleles', 'Probability', 'Punnett', 'Dihybrid', 'Dominance', 'Epistasis', 'Meiosis', 'Linkage', 'Sex-linked', 'Pedigrees', 'Mutations', 'Aberrations', 'Disorders', 'Polygenic', 'GWAS', 'H-W law', 'Drift'],
     cols=3, center='Genetics', colors=['accent'] * 7 + ['gold'] * 4 + ['pink'] * 3 + ['green'] * 4)
grid('bio_genomics', 'Biotechnology reads, copies, cuts and edits DNA, and bioinformatics makes sense of the data.',
     ['Gel', 'PCR', 'Cloning', 'Expression', 'Sanger', 'NGS', 'Assembly', 'RNA-seq', 'Omics', 'CRISPR', 'GMOs', 'Gene therapy', 'DNA profile', 'Alignment', 'BLAST', 'Phylogeny', 'Genomes', 'Metagenome'],
     cols=3, center='Genomics', colors=['accent'] * 4 + ['gold'] * 5 + ['pink'] * 4 + ['green'] * 5)
grid('bio_microbiology', 'Microbiology covers bacteria, archaea, viruses and microbial eukaryotes, plus infection, drugs and control.',
     ['Bact. cell', 'Growth', 'Metabolism', 'Gene transfer', 'Diversity', 'Archaea', 'Virus form', 'Viral cycle', 'Phages', 'HIV', 'Prions', 'Emerging', 'Protists', 'Microbiome', 'Pathogens', 'Antibiotics', 'Resistance', 'Sterilise', 'Biofilms'],
     cols=3, center='Microbiology', colors=['accent'] * 6 + ['purple'] * 6 + ['green'] * 2 + ['pink'] * 5)
grid('bio_development', 'Development runs from fertilisation through cleavage and gastrulation to organs, guided by gradients and gene switches.',
     ['Fertilisation', 'Cleavage', 'Gastrulation', 'Neurulation', 'Morphogens', 'Hox genes', 'Signalling', 'Regeneration', 'Prenatal', 'Plant embryo'],
     cols=3, center='Development', colors=['accent'] * 4 + ['gold'] * 3 + ['green'] * 3)

# ===== FOUNDATIONS =====
chain('bio_scientific_method', 'Science is a loop: a hypothesis makes a prediction, the experiment tests it, and the result sends you back to refine the idea.',
      ['Observe', 'Question', 'Hypothesis', 'Predict', 'Experiment', 'Analyse', 'Conclude'], per_row=4, loop=True,
      colors=['accent', 'accent', 'gold', 'gold', 'green', 'green', 'pink'], aspect=0.62)
hub('bio_themes_of_life', 'Six ideas keep coming back in every chapter of biology; try to spot which one each new topic illustrates.',
    'Life', ['Information', 'Energy', 'Structure-function', 'Evolution', 'Interactions', 'Emergence'],
    colors=['accent', 'gold', 'green', 'pink', 'orange', 'purple'], aspect=0.85)
bars('bio_levels_organization', 'Each level of organisation is bigger than the last; on a log scale it spans about 17 orders of magnitude.',
     [('atom', 1e-10, 'accent'), ('protein', 5e-9, 'accent'), ('mito', 1e-6, 'green'), ('cell', 2e-5, 'green'), ('organ', 0.1, 'gold'), ('human', 1.7, 'pink'), ('forest', 1e4, 'orange'), ('Earth', 1.3e7, 'orange')], logy=True, ylabel='typical size (m)', aspect=0.75)
hub('bio_characteristics_life', 'Living things tick all of these boxes; a virus or a crystal fails at least one, which is why they are borderline cases.',
    'Alive?', ['Cells', 'Metabolism', 'Homeostasis', 'Growth', 'Reproduction', 'Response', 'Evolution'],
    colors=['accent', 'gold', 'green', 'green', 'pink', 'orange', 'purple'], aspect=0.85)
geo('bio_cell_theory', 'Watch the cell divide: every new cell comes from a pre-existing cell, never from nothing.',
    [-4, 4, -2, 2],
    [C('-1.6*clamp(((t%7)-2.5)/2.5,0,1)', 0, '1.5-0.25*clamp(((t%7)-2.5)/2.5,0,1)', 'accent', 'accent', 2, alpha=0.18),
     C('1.6*clamp(((t%7)-2.5)/2.5,0,1)', 0, '1.5-0.25*clamp(((t%7)-2.5)/2.5,0,1)', 'accent', 'accent', 2, alpha=0.18, when='(t%7)>2.5'),
     C('-1.6*clamp(((t%7)-2.5)/2.5,0,1)', 0, 0.45, 'pink', 'pink', alpha=0.6),
     C('1.6*clamp(((t%7)-2.5)/2.5,0,1)', 0, 0.45, 'pink', 'pink', alpha=0.6, when='(t%7)>2.5'),
     T(0, -1.85, 'one cell  →  two cells (never from non-living matter)', 'gold', 11)], aspect=0.45, equal=False)
plot('bio_homeostasis_concept', 'With negative feedback (higher gain) the same disturbance causes a much smaller, but never zero, shift from the set point. Slide the gain.',
     [F('37+D*(1-exp(-x/tau))', 'no feedback', 'pink', True), F('37+D/(1+G)*(1-exp(-(1+G)*x/tau))', 'with feedback', 'accent')],
     x=[0, 60], y=[36, 43], xlabel='time after disturbance (min)', ylabel='core temperature (°C)',
     params=[P('G', 'feedback gain', 0, 20, 5), P('D', 'heat load', 1, 6, 5, '°C')], 
     readouts=[R('steady-state shift', 'D/(1+G)', '°C'), R('control improvement', '1+G', '×')], hlines=[dict(y=37, label='set point 37 °C')])
S['bio_homeostasis_concept']['params'][1]['unit'] = '°C'
S['bio_homeostasis_concept']['fns'][0]['f'] = '37+D*(1-exp(-x/tau))'
S['bio_homeostasis_concept']['params'].append(P('tau', 'time constant', 5, 30, 15, 'min'))
bars('bio_model_organisms', 'Model organisms span 3 orders of magnitude in genome size, but all share core biology such as DNA, ribosomes and cell cycles.',
     [('E.coli', 4.6, 'accent'), ('yeast', 12, 'accent'), ('worm', 100, 'green'), ('cress', 135, 'green'), ('fly', 140, 'gold'), ('zebrafish', 1400, 'pink'), ('mouse', 2700, 'pink'), ('human', 3100, 'orange')], logy=True, ylabel='genome size (Mb)', aspect=0.75)
tree('bio_taxonomy_intro', 'Taxonomy nests groups inside groups: three domains, then kingdoms below the eukaryotes. Every species sits at a leaf.',
     [('life', 'Life'), ('bac', 'Bacteria'), ('arc', 'Archaea'), ('euk', 'Eukarya'), ('ani', 'Animals'), ('pla', 'Plants'), ('fun', 'Fungi'), ('pro', 'Protists'), ('hum', 'Homo sapiens'), ('oak', 'Quercus robur')],
     [('life', 'bac'), ('life', 'arc'), ('life', 'euk'), ('euk', 'ani'), ('euk', 'pla'), ('euk', 'fun'), ('euk', 'pro'), ('ani', 'hum'), ('pla', 'oak')], aspect=0.8)
plot('bio_experimental_basics', 'The uncertainty of a mean shrinks as 1/sqrt(n): more replicates help, but with diminishing returns. Move the slider to change the variability.',
     [F('sd/sqrt(x)', 'standard error', 'accent'), F('1.96*sd/sqrt(x)', '95% margin', 'gold', True)], x=[1, 30], y=[0, 12],
     xlabel='replicates n', ylabel='error of the mean', params=[P('sd', 'standard deviation', 2, 12, 8)],
     readouts=[R('SE at n = 3', 'sd/sqrt(3)'), R('SE at n = 12', 'sd/sqrt(12)')])
yr = lambda y: 'yr>=%d' % y
ev = [(1665, 'Hooke 1665', 0.5), (1859, 'Darwin 1859', -0.5), (1865, 'Mendel 1865', 1.1), (1953, 'DNA 1953', -1.1), (1977, 'Sanger 1977', 0.5), (2003, 'Genome 2003', -0.5), (2012, 'CRISPR 2012', 1.1)]
sh = [L(1640, 0, 2030, 0, 'dim', 2)]
for y0, lab, side in ev:
    sh += [Pt(y0, 0, 'gold', 5, when='yr>=%d' % y0), L(y0, 0, y0, side * 0.8, 'accent', 1, when='yr>=%d' % y0), T(y0, side, lab, 'white', 9, 'center', when='yr>=%d' % y0)]
sh.append(Pt('yr', 0, 'pink', 8))
geo('bio_history_of_biology', 'Slide the year forward to reveal milestones; discoveries came faster and faster once the molecular tools arrived.',
    [1610, 2060, -1.5, 1.5], sh, params=[P('yr', 'year', 1640, 2025, 2025, step=1)], readouts=[R('milestones so far', '(yr>=1665)+(yr>=1859)+(yr>=1865)+(yr>=1953)+(yr>=1977)+(yr>=2003)+(yr>=2012)')], aspect=0.5, equal=False)

# ===== CHEMISTRY OF LIFE =====
shells = []
for sh_i, (r, cap_) in enumerate([(0.9, 2), (1.8, 8), (2.7, 8)]):
    shells.append(C(0, 0, r, 'dim', width=1, dash=True))
cnt = 0
for sh_i, (r, cap_) in enumerate([(0.9, 2), (1.8, 8), (2.7, 8)]):
    for k in range(cap_):
        cnt += 1
        a0 = 2 * math.pi * k / cap_
        w = (1.6, 0.9, 0.55)[sh_i]
        # fill shell 1 first, then shell 2, then shell 3 (valid to Z=18)
        shells.append(C('%s*cos(%s+t*%s)' % (r, round(a0, 3), w), '%s*sin(%s+t*%s)' % (r, round(a0, 3), w), 0.16, ('accent', 'gold', 'pink')[sh_i], ('accent', 'gold', 'pink')[sh_i], when='Z>=%d' % cnt))
shells += [C(0, 0, 0.45, 'red', 'red', alpha=0.7), T(0, 0, '{Z}+', 'white', 11), T(0, -3.45, 'valence electrons (outer shell): {Z<=2 ? Z : (Z<=10 ? Z-2 : Z-10)}', 'gold', 11)]
geo('bio_electron_shells', 'Electrons fill shells of 2, 8, 8. Raise the atomic number Z and watch the outer shell: carbon (6) has 4 valence electrons, neon (10) a full shell.',
    [-3.6, 3.6, -3.7, 3.4], shells, params=[P('Z', 'atomic number Z', 1, 18, 6, step=1)],
    readouts=[R('valence electrons', 'Z<=2 ? Z : (Z<=10 ? Z-2 : Z-10)'), R('bonds wanted (octet)', 'Z<=2 ? 2-Z : (Z<=10 ? 10-Z : 18-Z)')], aspect=0.95)
# isotopes
nuc = []
pos = [(0, 0), (0.55, 0), (-0.55, 0), (0.27, 0.48), (-0.27, 0.48), (0.27, -0.48), (-0.27, -0.48), (0, 0.9), (0, -0.9), (0.85, 0.5), (-0.85, 0.5), (0.85, -0.5), (-0.85, -0.5), (1.1, 0), (-1.1, 0)]
for k, (px, py) in enumerate(pos[:6 + 3]):
    pass
protons = pos[:6]; neuts = pos[6:15]
nuc = [C(x_ * 0.9, y_ * 0.9, 0.38, 'red', 'red', alpha=0.85) for x_, y_ in protons]
nuc += [C(x_ * 0.9, y_ * 0.9, 0.38, 'dim', 'dim', alpha=0.85, when='N>=%d' % (k + 1)) for k, (x_, y_) in enumerate(neuts[:9])]
nuc += [T(0, -2.3, 'carbon-{6+N}: 6 protons + {N} neutrons', 'gold', 12), T(0, 2.0, 'red = protons, grey = neutrons', 'white', 10)]
geo('bio_atoms_isotopes', 'Isotopes of one element differ only in neutrons. Carbon-12 and carbon-13 are stable; carbon-14 is radioactive (half-life 5,730 years).',
    [-3, 3, -2.8, 2.6], nuc, params=[P('N', 'neutrons', 6, 8, 6, step=1)],
    readouts=[R('mass number', '6+N'), R('half-life (years)', 'N==8 ? 5730 : 0'), R('atomic number', '6')], aspect=0.8)
S['bio_atoms_isotopes']['readouts'][1] = R('radioactive? (1 = yes)', 'N==8 ? 1 : 0')
plot('bio_ionic_covalent', 'The bigger the electronegativity difference, the more a bond shifts from shared (covalent) to transferred (ionic). Slide Δχ to read the ionic character.',
     [F('100*(1-exp(-x^2/4))', 'ionic character', 'accent')], x=[0, 3.2], y=[0, 100], xlabel='electronegativity difference Δχ', ylabel='ionic character (%)',
     points=[dict(x=0, y=0, label='H–H'), dict(x=0.35, y='100*(1-exp(-0.35^2/4))', label='C–H'), dict(x=1.24, y='100*(1-exp(-1.24^2/4))', label='O–H'), dict(x=2.23, y='100*(1-exp(-2.23^2/4))', label='Na–Cl'),
             dict(x='dx', y='100*(1-exp(-dx^2/4))', color='gold')],
     params=[P('dx', 'Δχ', 0, 3.2, 1.24)], readouts=[R('ionic character', '100*(1-exp(-dx^2/4))', '%')])
geo('bio_polarity_hbonds', 'Water is polar (O is δ−, H is δ+), so neighbours attract. A hydrogen bond (dashed) is ~20 kJ/mol, about 5% of an O–H bond. Pull the molecules apart past ~2.6 Å to break it.',
    [-1.5, 5.5, -1.6, 1.6],
    [L(0, 0, 0.96, 0, 'white', 2), L(0, 0, -0.24, 0.93, 'white', 2),
     C(0, 0, 0.5, 'red', 'red', alpha=0.85), T(0, 0, 'O', 'white', 11), C(0.96, 0, 0.3, 'white', 'white', alpha=0.8), C(-0.24, 0.93, 0.3, 'white', 'white', alpha=0.8),
     T(-0.3, -0.75, 'δ−', 'red', 12), T(1.1, 0.55, 'δ+', 'accent', 12),
     L('0.96+d', 0, '1.56+d', 0.75, 'white', 2), L('0.96+d', 0, '1.56+d', -0.75, 'white', 2),
     C('0.96+d', 0, 0.5, 'red', 'red', alpha=0.85), T('0.96+d', 0, 'O', 'white', 11), C('1.56+d', 0.75, 0.3, 'white', 'white', alpha=0.8), C('1.56+d', -0.75, 0.3, 'white', 'white', alpha=0.8),
     L(1.3, 0, '0.96+d-0.5', 0, 'gold', 3, dash=True, when='d<2.6'),
     T(3.0, 1.3, 'H···O = {d} Å', 'gold', 11), T(3.0, -1.3, 'bond broken beyond ~2.6 Å', 'dim', 10, when='d>=2.6')],
    params=[P('d', 'H···O distance', 1.6, 3.4, 1.9, 'Å', 0.05)], readouts=[R('H-bond strength', 'd<2.6 ? 20*exp(-(d-1.9)*1.2) : 0', 'kJ/mol'), R('covalent O–H', '460', 'kJ/mol')], aspect=0.5)
