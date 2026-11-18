from lib import *
import math

# ===== MOLECULAR BIOLOGY =====
dna = [Cv('s', 'sin(2*pi*s/3.4*1.0-t)', [0, 10], 'accent', 3), Cv('s', 'sin(2*pi*s/3.4*1.0-t+pi)', [0, 10], 'pink', 3)]
for k in range(31):
    xx = round(k * 0.3333, 3)
    dna.append(L(xx, 'sin(2*pi*%s/3.4-t)' % xx, xx, '-sin(2*pi*%s/3.4-t)' % xx, 'gold', 1.5, when='abs(sin(2*pi*%s/3.4-t))>0.25' % xx))
dna += [T(5, 1.45, 'sugar–phosphate backbone (antiparallel)', 'dim', 10, 'center'), T(5, -1.5, 'base pairs: A=T (2 H-bonds), G≡C (3 H-bonds); pitch 3.4 nm, 10.5 bp/turn', 'gold', 9, 'center')]
geo('bio_dna_structure', 'Two antiparallel strands wind into a right-handed helix; the rungs are base pairs. Slide the length to convert base pairs into nanometres and mass.',
    [-0.3, 10.3, -1.8, 1.8], dna, params=[P('bp', 'length', 10, 10000, 100, 'bp', 10)], readouts=[R('length', '0.34*bp', 'nm'), R('turns of the helix', 'bp/10.5'), R('mass', '0.65*bp/1000', 'kDa')], aspect=0.5, equal=False)
bars('bio_chromatin_packaging', 'DNA is wound around histones into nucleosomes, then folded into fibres, loops and finally a mitotic chromosome, making it about 10,000 times shorter.',
     [('naked DNA', 1, 'dim'), ('nucleosome', 7, 'accent'), ('30 nm fibre', 40, 'gold'), ('loops', 680, 'pink'), ('mitotic chr.', 10000, 'green')], logy=True, ylabel='compaction (× shorter)', aspect=0.7)
blocks('bio_central_dogma', 'Information normally flows DNA → RNA → protein. Replication copies DNA; reverse transcription (some viruses) and RNA replication are the main exceptions.',
       [('d', 'DNA', 12, 50, 'accent'), ('r', 'RNA', 50, 50, 'gold'), ('p', 'Protein', 88, 50, 'green')],
       [('d', 'r', 'transcribe'), ('r', 'p', 'translate'), ('r', 'd', 'RT', True)], aspect=0.4)
# replication fork: forks & speed
rep = [L(-5, 0.3, 0, 0.3, 'accent', 3), L(-5, -0.3, 0, -0.3, 'pink', 3), L(0, 0.3, 5, 2.1, 'accent', 3), L(0, -0.3, 5, -2.1, 'pink', 3),
       C(0, 0, 0.35, 'gold', 'gold', alpha=0.9), T(0, 0, 'H', 'white', 10, 'center'), T(-0.4, -0.9, 'helicase', 'gold', 9, 'center'),
       L(0.45, 0.35, '0.45+4.4*(0.45+0.55*((t%4)/4))', '0.35+0.36*4.4*(0.45+0.55*((t%4)/4))-0.3', 'green', 4), T(2.8, 2.5, 'leading: continuous', 'green', 9, 'center'),
       C('0.45+4.4*(0.45+0.55*((t%4)/4))', '0.35+0.36*4.4*(0.45+0.55*((t%4)/4))-0.3', 0.17, 'green', 'green')]
for k, (u0, u1) in enumerate([(0.5, 1.6), (1.9, 3.0), (3.3, 4.4)]):
    rep += [A('%s+(%s-%s)*clamp(((t%%4)-%s)/1.2,0,1)' % (u0, u1, u0, 0.6 * k), '-0.35-0.36*%s-0.3+0.36*0.0' % u0, u0, '-0.35-0.36*%s' % u0, 'pink', 0, when='0')]
rep = [x for x in rep if not (x.get('k') == 'arrow')]
for k, (u0, u1) in enumerate([(0.6, 1.5), (1.9, 2.8), (3.2, 4.1)]):
    y0 = -0.5 - 0.36 * u0; y1 = -0.5 - 0.36 * u1
    rep += [L(u1, y1, '%s+(%s-%s)*(1-clamp(((t%%4)-%s)/1.2,0,1))' % (u0, u1, u0, 0.5 * k), '%s+(%s-%s)*(1-clamp(((t%%4)-%s)/1.2,0,1))' % (y0, y1, y0, 0.5 * k), 'pink', 4)]
rep += [T(2.6, -2.6, 'lagging: Okazaki fragments', 'pink', 9, 'center'), T(-2.5, 0.9, 'parental DNA', 'dim', 10, 'center')]
geo('bio_replication_machinery', 'Helicase unzips the parental DNA; the leading strand grows continuously, the lagging strand in short Okazaki fragments. Slide the fork speed to see how long a genome takes.',
    [-5.2, 5.2, -3.0, 3.0], rep, params=[P('v', 'fork speed', 50, 1000, 1000, 'nt/s', 50), P('G', 'genome size', 1, 200, 4.6, 'Mb', 0.5)],
    readouts=[R('time with 2 forks', 'G*1e6/(2*v)/60', 'min')], aspect=0.6)
table('bio_dna_damage_repair', 'Different lesions need different repair crews; defects in these pathways cause cancer-prone syndromes such as xeroderma pigmentosum and Lynch syndrome.',
      ['Damage', 'Cause', 'Repair'],
      [['Thymine dimer', 'UV light', 'NER'], ['Oxidised base', 'ROS', 'BER'], ['Mismatch', 'replication error', 'MMR'], ['Double-strand break', 'radiation', 'NHEJ / HR'], ['Crosslink', 'chemicals', 'Fanconi / NER']], aspect=0.7)
blocks('bio_recombination_transposons', 'Transposons hop: cut-and-paste elements move by a transposase, while retrotransposons copy via RNA and reverse transcriptase, which is why they fill much of our genome.',
       [('t1', 'DNA element', 14, 15), ('t2', 'Cut out', 50, 15), ('t3', 'Re-inserted', 86, 15, 'gold'), ('r1', 'Retro-element', 14, 80), ('r2', 'RNA copy', 50, 80), ('r3', 'New DNA copy', 86, 80, 'gold')],
       [('t1', 't2', 'transposase'), ('t2', 't3'), ('r1', 'r2', 'transcribe'), ('r2', 'r3', 'RT')], aspect=0.6)
table('bio_genetic_code', 'Read the code by first base (row), second base (column) and third base (U, C, A, G within each cell). * is a stop codon; AUG (M) starts translation. Single-letter amino acids.',
      ['1st \\ 2nd', 'U', 'C', 'A', 'G'],
      [['U', 'FFLL', 'SSSS', 'YY**', 'CC*W'], ['C', 'LLLL', 'PPPP', 'HHQQ', 'RRRR'], ['A', 'IIIM', 'TTTT', 'NNKK', 'SSRR'], ['G', 'VVVV', 'AAAA', 'DDEE', 'GGGG']], aspect=0.55)
# transcription bubble animation
tx = [L(-5, 0.6, 5, 0.6, 'accent', 3), L(-5, -0.6, -1.0, -0.6, 'pink', 3), L(1.0, -0.6, 5, -0.6, 'pink', 3),
      Cv('-1.0+(0.5*sin(s)+0.5)*0+s', '-0.6+0.8*sin(pi*(s+1)/2)', [0, 2], 'pink', 3),
      C(0, 0, 0.9, 'gold', 'gold', alpha=0.3, width=2), T(0, 1.4, 'RNA polymerase', 'gold', 10, 'center'),
      T(-4, 1.1, 'template 3′', 'accent', 9), T(4, 1.1, '5′', 'accent', 9), T(0, -2.9, 'transcription bubble ≈ 17 bp  ·  RNA 8–9 nt hybrid', 'dim', 9, 'center')]
tx = [x for x in tx if x.get('k') != 'curve']
tx += [L(0, 0.6, 0, -0.6, 'dim', 0), L(-0.9, -0.6, '-0.9-3.6*r', '-0.6-1.3*r', 'green', 4), T('-0.9-3.6*r', '-0.6-1.3*r-0.45', 'growing mRNA', 'green', 9, 'center')]
tx = [x for x in tx if not (x.get('k') == 'line' and x.get('width') == 0)]
tx = [x for x in tx if x.get('text') != '17 bp']
for x in tx:
    if x.get('k') == 'line' and x.get('color') == 'green': x['x2'] = '-0.9-3.6*clamp((t*sp*0.012)%1.6,0,1)'; x['y2'] = '-0.6-1.3*clamp((t*sp*0.012)%1.6,0,1)'
    if x.get('text') == 'growing mRNA': x['x'] = '-0.9-3.6*clamp((t*sp*0.012)%1.6,0,1)'; x['y'] = '-0.6-1.3*clamp((t*sp*0.012)%1.6,0,1)-0.5'
geo('bio_transcription_prokaryotic', 'The polymerase (σ factor finds the promoter) melts a small bubble and slides along the template, reading 3′→5′ and growing the RNA 5′→3′. Slide the rate to speed it up.',
    [-5.2, 5.2, -3.3, 2.0], tx, params=[P('sp', 'elongation rate', 10, 80, 50, 'nt/s')], readouts=[R('time for a 1 kb gene', '1000/sp', 's'), R('time for 2.5 kb gene', '2500/sp', 's')], aspect=0.6)
chain('bio_transcription_eukaryotic', 'Eukaryotes need general transcription factors before Pol II can start: TFIID binds the TATA box, others recruit Pol II, and TFIIH unwinds DNA and phosphorylates the polymerase tail.',
      ['TFIID binds TATA', 'TFIIA / TFIIB', 'Pol II + TFIIF', 'TFIIE / TFIIH', 'CTD phosphorylation', 'Elongation'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'pink', 'green'], aspect=0.62)
rp = []
seg = [('E1', 0, 1.3, 'accent'), ('I1', 1.3, 3.2, 'dim'), ('E2', 3.2, 4.5, 'gold'), ('I2', 4.5, 7.0, 'dim'), ('E3', 7.0, 8.4, 'green')]
for nm, a, b, col_ in seg:
    if nm.startswith('E'):
        rp.append(Rc('(%s)-(sp)*(%s)' % (a, 1.0 if False else '0'), 0, 0, 0))
rp = []
off = {'E1': '0', 'I1': '0', 'E2': '-sp*1.9', 'I2': '-sp*1.9', 'E3': '-sp*4.4'}
for nm, a, b, col_ in seg:
    xs = '%s+(%s)' % (a, off[nm]); w = (b - a)
    if nm.startswith('E'):
        rp.append(Rc(xs, -0.3, w, 0.6, col_, col_, 0.7, 2)); rp.append(T('%s+%s' % (xs, w / 2), 0, nm, 'white', 11, 'center'))
    else:
        # intron: shrinks to zero length and loops
        rp.append(L(xs, 0, '%s+%s*(1-sp)' % (xs, w), 0, 'dim', 3)); rp.append(Cv('%s+%s*(0.5*(1-sp)+0.5*(1-sp)*cos(s))+0*s' % (a, 0), 'sp*0.9*sin(s)*1.0+0*s', [0, 3.14], 'dim', 2, when='0'))
rp = [x for x in rp if x.get('when') != '0']
# exon x positions: E2 start = 3.2 - sp*1.9 ; E3 start = 7.0 - sp*4.4 (since both introns lengths 1.9 and 2.5)
rp += [Pt(0, 0, 'gold', 7), T(-0.1, 0.7, '5′ cap', 'gold', 9, 'center'), Pt('8.4-sp*4.4', 0, 'pink', 7), T('8.5-sp*4.4', 0.7, 'poly(A) tail', 'pink', 9, 'center'),
       C('(4.7+(3.2-sp*1.9+4.5-sp*1.9-3.2)/2*0)-sp*1.9-0.0', '0.45+0.7*sp', '0.3+0.9*sp', 'dim', None, 1, when='sp>0.05', alpha=0.6),
       T(4.3, -1.4, 'introns {sp<0.02 ? 0 : 0}', 'dim', 1)]
rp = [x for x in rp if not (x.get('k') == 'circle')]
rp = [x for x in rp if x.get('size') != 1]
rp += [T(4.2, 1.7, 'mature mRNA length: {1.3+1.3+1.4-0*sp+(1-sp)*4.4} (scaled units)', 'white', 9, 'center')]
rp = [x for x in rp if 'mature' not in str(x.get('text', ''))]
geo('bio_rna_processing', 'Pre-mRNA gets a 5′ cap and a poly(A) tail, and the spliceosome removes introns (grey) and joins the exons. Slide to carry out the splicing.',
    [-0.8, 9.2, -1.6, 1.6], rp, params=[P('sp', 'splicing progress', 0, 1, 0, step=0.02)],
    readouts=[R('transcript length', '4000-sp*2400', 'nt (illustrative)'), R('exon share', '1600/(4000-sp*2400)*100', '%')], aspect=0.4, equal=False)
# ribosome
rb = [L(-5, -0.2, 5, -0.2, 'white', 2), T(-5.2, -0.65, '5′', 'dim', 9), T(5.1, -0.65, '3′', 'dim', 9)]
for k in range(9):
    cx = -4 + k
    rb += [Rc(cx - 0.45, -0.5, 0.9, 0.5, ['gold', 'pink', 'accent'][k % 3], ['gold', 'pink', 'accent'][k % 3], 0.35), T(cx, -0.25, ['AUG', 'GCU', 'GAA', 'UUC', 'CCA', 'AAG', 'UGG', 'CAU', 'UAA'][k], 'white', 8, 'center')]
rb += [Pg([['-1.9+tr', 0.2], ['1.9+tr', 0.2], ['1.9+tr', 2.0], ['-1.9+tr', 2.0]], 'accent', 'accent', 0.22, 2),
       Pg([['-1.9+tr', 0.2], ['1.9+tr', 0.2], ['1.9+tr', -0.9], ['-1.9+tr', -0.9]], 'purple', 'purple', 0.15, 2),
       T('-1.3+tr', 2.3, 'E', 'white', 11, 'center'), T('0.0+tr', 2.3, 'P', 'white', 11, 'center'), T('1.3+tr', 2.3, 'A', 'white', 11, 'center'),
       T('tr', -1.3, 'small subunit (30S/40S)', 'purple', 9, 'center'), T('tr', 2.65, 'large subunit (50S/60S)', 'accent', 9, 'center'),
       L('-1.3+tr', 0.2, '-1.3+tr', 1.7, 'dim', 1, dash=True), L('tr', 0.2, 'tr', 1.7, 'dim', 1, dash=True), L('1.3+tr', 0.2, '1.3+tr', 1.7, 'dim', 1, dash=True),
       C('0.0+tr', 1.0, 0.35, 'pink', 'pink', alpha=0.7), T('tr', 1.0, 'tRNA', 'white', 8, 'center'), C('1.3+tr', 1.0, 0.35, 'gold', 'gold', alpha=0.7), T('1.3+tr', 1.0, 'tRNA', 'white', 8, 'center')]
for x in rb:
    for k_, v_ in list(x.items()):
        if isinstance(v_, str) and 'tr' in v_ and k_ != 'text' and k_ != 'k': x[k_] = v_.replace('tr', '(1.0*floor((t*0.5)%4))')
        if k_ == 'x' and v_ == 'tr': x[k_] = '(1.0*floor((t*0.5)%4))'
for x in rb:
    if x.get('k') == 'poly':
        x['pts'] = [[(c.replace('tr', '(1.0*floor((t*0.5)%4))') if isinstance(c, str) else c) for c in p] for p in x['pts']]
geo('bio_trna_translation_machinery', 'The ribosome reads mRNA three bases at a time: tRNAs bring amino acids to the A site, the P site holds the growing chain, and the ribosome then steps one codon along.',
    [-5.3, 5.3, -1.6, 3.2], rb, aspect=0.5, equal=False)
chain('bio_translation_regulation_ptm', 'Cells control how much protein is made (initiation factors, microRNAs) and then tune each protein with chemical tags (phosphate, sugar, ubiquitin) or cleavage.',
      ['mRNA', 'Initiation control', 'Polypeptide', 'PTMs: P, sugar, Ub', 'Active protein'], per_row=3, colors=['accent', 'gold', 'accent', 'gold', 'green'], aspect=0.6)
plot('bio_lac_operon', 'The lac operon turns on only when lactose is present (repressor released) and glucose is low (cAMP–CAP activates). Raise glucose and the induced level drops.',
     [F('1+99*x^2/(0.1^2+x^2)*(1/(1+(Glc/0.2)^2))', 'with glucose slider', 'accent'), F('1+99*x^2/(0.1^2+x^2)', 'no glucose', 'dim', True)], x=[0, 1], y=[0, 105], xlabel='lactose (mM)', ylabel='β-galactosidase (% max)',
     params=[P('Glc', 'glucose', 0, 1, 0.15, 'mM', 0.01)], readouts=[R('expression, 1 mM lactose', '1+99*1/(0.01+1)*(1/(1+(Glc/0.2)^2))', '%'), R('catabolite repression', '1/(1+(Glc/0.2)^2)*100', '% CAP active')])
blocks('bio_eukaryotic_gene_regulation', 'Activators bound to distant enhancers loop DNA to the promoter via Mediator, recruiting Pol II; repressors and silencers do the opposite. Different TF combinations give each cell type its pattern.',
       [('e', 'Enhancer + activators', 15, 15, 'green'), ('m', 'Mediator', 50, 40, 'gold'), ('p', 'Promoter + GTFs', 85, 15), ('pol', 'Pol II', 50, 70), ('t', 'Transcription', 50, 95, 'accent'), ('r', 'Repressor / silencer', 85, 70, 'pink')],
       [('e', 'm', 'DNA loop'), ('p', 'm'), ('m', 'pol', 'recruits'), ('pol', 't'), ('r', 'm', 'blocks', True)], aspect=0.7)
blocks('bio_epigenetics', 'Marks on DNA and histones switch chromatin between open and closed states without changing the sequence: acetylation opens, methylation of CpG islands closes.',
       [('o', 'Open chromatin (active)', 20, 20, 'green'), ('c', 'Closed chromatin (silent)', 80, 80, 'pink'), ('w', 'Writers: HAT', 20, 85), ('e', 'Erasers: HDAC, TET', 80, 15)],
       [('o', 'c', 'DNMT, HDAC'), ('c', 'o', 'HAT, TET', True)], aspect=0.6)
S['bio_epigenetics']['nodes'] = [{'id': 'o', 'label': 'Open (active)', 'x': 18, 'y': 35, 'color': 'green'}, {'id': 'c', 'label': 'Closed (silent)', 'x': 82, 'y': 35, 'color': 'pink'}, {'id': 'a', 'label': 'acetyl, H3K4me3', 'x': 24, 'y': 85}, {'id': 'm', 'label': 'meCpG, H3K27me3', 'x': 76, 'y': 85}]
S['bio_epigenetics']['edges'] += [{'from': 'a', 'to': 'o', 'dashed': True}, {'from': 'm', 'to': 'c', 'dashed': True}]
chain('bio_x_inactivation_imprinting', 'In each female cell one X is randomly silenced by Xist RNA early in development, so women are mosaics (calico cats). Imprinted genes are silenced according to parent of origin.',
      ['Two X chromosomes', 'Xist RNA coats one X', 'Heterochromatin', 'Barr body (stable)'], per_row=2, colors=['accent', 'gold', 'pink', 'dim'], aspect=0.7)
chain('bio_noncoding_rna', 'Precursor miRNAs are trimmed by Drosha and Dicer; the mature strand guides the RISC complex (Argonaute) to matching mRNAs, which are degraded or blocked.',
      ['pri-miRNA', 'Drosha → pre-miRNA', 'Dicer → duplex', 'RISC (Argonaute)', 'Target mRNA silenced'], per_row=3, colors=['accent', 'accent', 'gold', 'gold', 'pink'], aspect=0.62)
plot('bio_post_transcriptional_control', 'After transcription starts, mRNA level rises toward k·t½/ln2. Short-lived mRNAs respond fast and decline fast; stable ones respond slowly. Change the half-life.',
     [F('ks*hl/ln(2)*(1-exp(-ln(2)*x/hl))', 'mRNA level', 'accent'), F('ks*hl/ln(2)*(1-exp(-ln(2)*x/hl))*0+ks*30/ln(2)*(1-exp(-ln(2)*x/30))', 'stable mRNA (t½ = 30 min)', 'dim', True)], x=[0, 180], y=[0, 60], xlabel='time after induction (min)', ylabel='mRNA (relative)',
     params=[P('hl', 'mRNA half-life', 2, 120, 10, 'min'), P('ks', 'synthesis rate', 0.5, 1.5, 1, '×')], readouts=[R('steady state', 'ks*hl/ln(2)'), R('time to 50% of steady state', 'hl', 'min')])
S['bio_post_transcriptional_control']['fns'][1]['f'] = 'ks*30/ln(2)*(1-exp(-ln(2)*x/30))'
blocks('bio_cancer_gene_regulation', 'Proto-oncogenes are accelerators: one gain-of-function mutation makes them stuck on. Tumour suppressors (p53, Rb) are brakes: usually both copies must be lost.',
       [('po', 'Proto-oncogene (accelerator)', 20, 15), ('on', 'Oncogene: always on', 20, 75, 'pink'), ('ts', 'Tumour suppressor (brake)', 80, 15), ('lo', 'Both copies lost', 80, 75, 'pink'), ('c', 'Uncontrolled growth', 50, 95, 'gold')],
       [('po', 'on', 'gain of function'), ('ts', 'lo', 'loss of function'), ('on', 'c'), ('lo', 'c')], aspect=0.7)
S['bio_cancer_gene_regulation']['nodes'][0]['label'] = 'Proto-oncogene'; S['bio_cancer_gene_regulation']['nodes'][2]['label'] = 'Tumour suppressor'; S['bio_cancer_gene_regulation']['nodes'][1]['label'] = 'Oncogene (on)'

# ===== GENETICS =====
dist_ = dict(type='dist', kind='binomial', n='n', p='p', shade=['k0', 'n'], sample=False)
add('bio_mendel_laws', dict(type='dist', kind='binomial', n='n', p=0.75, shade=['k0', 'n'],
    params=[P('n', 'offspring n', 4, 40, 12, step=1), P('k0', 'at least k with dominant trait', 0, 40, 9, step=1)],
    readouts=[R('expected dominant', 'n*0.75'), R('expected recessive', 'n*0.25')],
    caption='Aa × Aa gives each offspring a 3/4 chance of the dominant phenotype. The bars show how many of n offspring show it; the shaded part is P(at least k).'))
geo('bio_alleles_genotype', 'Each gene sits at the same locus on two homologous chromosomes. Choose the allele combination: only aa shows the recessive phenotype.',
    [-3, 3, -2.8, 2.8],
    [Rc(-1.5, -2, 0.7, 4, 'accent', 'accent', 0.2, 2), Rc(0.8, -2, 0.7, 4, 'pink', 'pink', 0.2, 2), Rc(-1.5, 0.5, 0.7, 0.4, 'gold', 'gold', 0.6), Rc(0.8, 0.5, 0.7, 0.4, 'gold', 'gold', 0.6),
     T(-1.15, 1.2, 'A', 'green', 16, 'center', when='g<=1'), T(-1.15, 1.2, 'a', 'orange', 16, 'center', when='g>=2'), T(1.15, 1.2, 'A', 'green', 16, 'center', when='g==0'), T(1.15, 1.2, 'a', 'orange', 16, 'center', when='g>=1'),
     T(-1.15, -2.4, 'from mother', 'dim', 9, 'center'), T(1.15, -2.4, 'from father', 'dim', 9, 'center'), T(2.2, 0.7, 'locus', 'gold', 9, 'left'),
     T(0, 2.45, 'genotype AA (homozygous dominant)', 'green', 11, 'center', when='g==0'), T(0, 2.45, 'genotype Aa (heterozygous)', 'gold', 11, 'center', when='g==1'), T(0, 2.45, 'genotype aa (homozygous recessive)', 'orange', 11, 'center', when='g==2')],
    params=[P('g', 'genotype (0 AA, 1 Aa, 2 aa)', 0, 2, 1, step=1)], readouts=[R('dominant phenotype shown? (1 = yes)', 'g<2')], aspect=0.75)
plot('bio_genetics_probability', 'Independent events multiply, alternatives add. For a 1/4 risk per child, the chance that at least one of n children is affected is 1 − (3/4)ⁿ. Change the per-child risk.',
     [F('100*(1-(1-p)^x)', 'P(at least one affected)', 'accent')], x=[0, 10], y=[0, 100], xlabel='number of children n', ylabel='probability (%)',
     points=[dict(x=1, y='100*p', label='1 child'), dict(x=3, y='100*(1-(1-p)^3)', color='gold')], params=[P('p', 'risk per child', 0.05, 0.75, 0.25, step=0.01)],
     readouts=[R('both of 2 children affected', '100*p^2', '%'), R('at least 1 of 3', '100*(1-(1-p)^3)', '%')])
pun = []
for i in range(2):
    for j in range(2):
        x0 = -1.0 + 1.1 * j * 1.0; y0 = 0.9 - 1.1 * i
        xc = x0 + 0.55; yc = y0 - 0.55
        pun += [Rc(x0 + 0.0, y0 - 1.1, 1.1, 1.1, 'white', None, None, 1)]
        gi = '(g1==2 || (g1==1 && %d==0))' % i  # row gamete i is A?
        gj = '(g2==2 || (g2==1 && %d==0))' % j
        cnt = '(%s+%s)' % (gi, gj)
        pun += [Rc(x0 + 0.03, y0 - 1.07, 1.04, 1.04, 'gold', 'gold', 0.28, 0, when='%s>=1' % cnt), Rc(x0 + 0.03, y0 - 1.07, 1.04, 1.04, 'pink', 'pink', 0.28, 0, when='%s==0' % cnt),
                T(xc, yc, 'AA', 'white', 14, 'center', when='%s==2' % cnt), T(xc, yc, 'Aa', 'white', 14, 'center', when='%s==1' % cnt), T(xc, yc, 'aa', 'white', 14, 'center', when='%s==0' % cnt)]
for j in range(2):
    gj = '(g2==2 || (g2==1 && %d==0))' % j
    pun += [T(-1.0 + 1.1 * j + 0.55, 1.2, 'A', 'accent', 14, 'center', when=gj), T(-1.0 + 1.1 * j + 0.55, 1.2, 'a', 'accent', 14, 'center', when='!%s' % gj)]
for i in range(2):
    gi = '(g1==2 || (g1==1 && %d==0))' % i
    pun += [T(-1.35, 0.9 - 1.1 * i - 0.55, 'A', 'pink', 14, 'center', when=gi), T(-1.35, 0.9 - 1.1 * i - 0.55, 'a', 'pink', 14, 'center', when='!%s' % gi)]
pun += [T(1.9, 0.2, 'gold = dominant phenotype', 'gold', 9, 'left'), T(1.9, -0.2, 'pink = recessive phenotype', 'pink', 9, 'left')]
geo('bio_punnett_squares', 'Each parent\'s gametes go along an edge; the squares show every offspring genotype. Choose the parental genotypes (0 = aa, 1 = Aa, 2 = AA) and read the ratio.',
    [-2.0, 4.5, -1.7, 1.6], pun, params=[P('g1', 'parent 1 (0 aa, 1 Aa, 2 AA)', 0, 2, 1, step=1), P('g2', 'parent 2 (0 aa, 1 Aa, 2 AA)', 0, 2, 1, step=1)],
    readouts=[R('dominant offspring', '100*(1-(1-g1/2)*(1-g2/2))', '%'), R('recessive offspring', '100*(1-g1/2)*(1-g2/2)', '%')], aspect=0.5)
table('bio_dihybrid_assortment', 'Crossing two double heterozygotes (AaBb × AaBb) gives four phenotypes in 9:3:3:1. Change the number of offspring to see the expected counts.',
      ['Phenotype', 'Ratio', 'Expected count'],
      [['A_ B_', '9/16', '{9*N/16}'], ['A_ bb', '3/16', '{3*N/16}'], ['aa B_', '3/16', '{3*N/16}'], ['aa bb', '1/16', '{N/16}']],
      aspect=0.55, params=[P('N', 'offspring', 16, 1600, 160, step=16)])
plot('bio_dominance_extensions', 'Phenotype versus the number of A alleles: with complete dominance the heterozygote matches AA; with incomplete dominance it sits halfway; slide h to move between them.',
     [F('x<=1 ? h*x : h+(1-h)*(x-1)', 'phenotype of 0, 1, 2 copies of A', 'accent')], x=[0, 2], y=[0, 1.1], xlabel='copies of allele A (0 = aa, 1 = Aa, 2 = AA)', ylabel='phenotype (relative)',
     points=[dict(x=0, y=0, label='aa'), dict(x=1, y='h', label='Aa', color='gold'), dict(x=2, y=1, label='AA')], params=[P('h', 'heterozygote level h', 0, 1, 0.5, step=0.05)],
     readouts=[R('Aa is', 'h*100', '% of the AA phenotype')])
chain('bio_epistasis_pleiotropy', 'In Labradors gene E (pigment deposition) is epistatic to gene B (black or brown): ee dogs are yellow whatever B they carry, giving a 9:3:4 ratio.',
      ['Precursor', 'Gene E: deposit pigment', 'Gene B: black or brown', 'ee: yellow (hidden B)'], per_row=2, colors=['dim', 'gold', 'accent', 'pink'], aspect=0.7)
plot('bio_meiosis_variation', 'With n chromosome pairs, independent assortment alone gives 2ⁿ different gametes; humans (n = 23) make 8.4 million before crossing over adds far more.',
     [F('2^x', 'distinct gametes 2ⁿ', 'accent')], x=[1, 30], y=[1, 1e9], logy=True, xlabel='chromosome pairs n', ylabel='possible gametes',
     points=[dict(x=23, y='2^23', label='human'), dict(x=4, y=16, label='Drosophila'), dict(x='n', y='2^n', color='gold')], params=[P('n', 'chromosome pairs', 1, 30, 23, step=1)],
     readouts=[R('gametes', '2^n'), R('zygote combinations (2ⁿ × 2ⁿ)', '4^n')])
table('bio_chromosome_theory', 'Sutton and Boveri noticed that Mendel\'s hereditary factors behave exactly like chromosomes; Morgan\'s white-eyed flies tied one gene to the X chromosome.',
      ['Mendelian idea', 'Chromosome behaviour'],
      [['Factors in pairs', 'homologous pairs'], ['Segregation', 'homologs separate'], ['Independent assort.', 'random orientation'], ['Sex-linked traits', 'genes on the X'], ['Linked genes', 'same chromosome']], aspect=0.7)
plot('bio_linkage_mapping', 'Genes close together are rarely separated by crossing over, so recombination frequency is nearly equal to map distance; it saturates at 50% (unlinked). Slide the distance.',
     [F('50*(1-exp(-2*x/100))', 'observed recombination (Haldane)', 'accent'), F('min(x,50)', 'map distance (cM)', 'dim', True)], x=[0, 150], y=[0, 60], xlabel='map distance between genes (cM)', ylabel='recombinant offspring (%)',
     params=[P('d', 'gene distance', 0, 150, 20, 'cM')], points=[dict(x='d', y='50*(1-exp(-2*d/100))', color='gold')], hlines=[dict(y=50, label='50% = unlinked')],
     readouts=[R('recombinants', '50*(1-exp(-2*d/100))', '%'), R('parental types', '100-50*(1-exp(-2*d/100))', '%')])
add('bio_sex_linkage', dict(type='bars', bars=[dict(label='daughters carrier', value='25+0*f', color='gold'), dict(label='daughters affected', value='25*f', color='pink'), dict(label='sons affected', value='25+25*f', color='pink'), dict(label='unaffected', value='50-25*f-25*0+0*f', color='accent')],
    ylabel='% of offspring', params=[P('f', 'father affected? (0 no, 1 yes)', 0, 1, 0, step=1)],
    caption='X-linked recessive trait with a carrier mother: sons get one X, so half are affected. If the father is affected too, daughters can also be affected.'))
S['bio_sex_linkage']['bars'] = [dict(label='carrier ♀', value='f==0 ? 25 : 25', color='gold'), dict(label='affected ♀', value='25*f+0.001', color='pink'),
                                dict(label='affected ♂', value='25', color='orange'), dict(label='normal ♂', value='25', color='accent'), dict(label='normal ♀', value='f==0 ? 25 : 0.001', color='green')]
tree('bio_pedigree_analysis', 'Squares are males, circles females. Two unaffected carriers (Aa) have an affected child (aa): the trait skips a generation, typical of recessive inheritance. Press play to trace it.',
     [('I1', 'Aa'), ('I2', 'Aa'), ('II1', 'AA'), ('II2', 'Aa'), ('II3', 'aa'), ('III1', 'Aa'), ('III2', 'aa')],
     [('I1', 'II1'), ('I2', 'II1'), ('I1', 'II2'), ('I2', 'II2'), ('I1', 'II3'), ('I2', 'II3'), ('II2', 'III1'), ('II2', 'III2')], aspect=0.75, steps=[['I1', 'I2'], ['II1', 'II2', 'II3'], ['II3'], ['III1', 'III2'], ['III2']])
table('bio_mutations', 'Point mutations are classified by what they do to the protein: silent, missense (sickle-cell: Glu→Val), nonsense (early stop), or frameshift (indel not a multiple of 3).',
      ['Type', 'Example', 'Effect'],
      [['Silent', 'GAA → GAG', 'Glu → Glu'], ['Missense', 'GAG → GUG', 'Glu → Val'], ['Nonsense', 'CAG → UAG', 'Gln → stop'], ['Frameshift', '+1 base', 'all codons change'], ['In-frame del.', '−3 bases', 'one aa lost']], aspect=0.7)
plot('bio_chromosomal_aberrations', 'The risk of a child with trisomy 21 rises steeply with maternal age because eggs sit arrested in meiosis for decades. Slide the age to read the risk.',
     [F('0.65+0.041*exp(0.267*(x-20))', 'risk per 1,000 births', 'accent')], x=[20, 45], y=[0, 40], xlabel='maternal age (years)', ylabel='per 1,000 births',
     points=[dict(x='ag', y='0.65+0.041*exp(0.267*(ag-20))', color='gold')], params=[P('ag', 'maternal age', 20, 45, 35, 'years', 1)],
     readouts=[R('risk', '0.65+0.041*exp(0.267*(ag-20))', 'per 1,000'), R('about 1 in', '1000/(0.65+0.041*exp(0.267*(ag-20)))')])
bars('bio_single_gene_disorders', 'The chance an offspring is affected depends on the mode of inheritance: recessive (both parents carriers) 25%, dominant 50%, X-linked recessive sons of a carrier 50%, mitochondrial from an affected mother nearly 100%.',
     [('auto. rec.', 25, 'accent'), ('auto. dom.', 50, 'gold'), ('X-linked ♂', 50, 'pink'), ('mito', 100, 'green')], ylabel='risk to child (%)', aspect=0.7)
plot('bio_quantitative_traits', 'Parents who are above average have offspring above average, but regressed toward the mean by (1 − h²). The slope of this line is the narrow-sense heritability h².',
     [F('h2*x', 'offspring mean', 'accent'), F('x', 'if h² = 1', 'dim', True)], x=[-3, 3], y=[-3, 3], equal=True, xlabel='mid-parent value (SD from population mean)', ylabel='offspring value (SD)',
     params=[P('h2', 'heritability h²', 0, 1, 0.8, step=0.05)], readouts=[R('selection response R = h²S', 'h2*2', 'SD (if S = 2)')])
plot('bio_gwas', 'Each point is a variant; the height is −log₁₀ p. Real associations stand above the genome-wide significance line (p = 5×10⁻⁸); larger samples reveal weaker loci. Increase the sample size.',
     [F('-log10(max(rand(floor(x*12)),0.0005))*0.6+3.6*N/100000*exp(-((x-6)/0.25)^2)*2+ 2.0*N/100000*exp(-((x-14)/0.25)^2)*2', '−log₁₀ p', 'accent')], x=[0, 20], y=[0, 14], xlabel='genomic position (arbitrary)', ylabel='−log₁₀ p',
     hlines=[dict(y=7.3, label='genome-wide significance')], params=[P('N', 'sample size', 10000, 500000, 100000, 'people', 10000)])
tbl = []
table('bio_population_genetics', 'Allele frequencies come from genotype counts: each AA carries two A alleles, each Aa one. Enter the counts to calculate p and q.',
      ['Genotype', 'Count', 'Share'], [['AA', '{nAA}', '{100*nAA/(nAA+nAa+naa)} %'], ['Aa', '{nAa}', '{100*nAa/(nAA+nAa+naa)} %'], ['aa', '{naa}', '{100*naa/(nAA+nAa+naa)} %']],
      aspect=0.4, params=[P('nAA', 'AA individuals', 0, 500, 360, step=10), P('nAa', 'Aa individuals', 0, 500, 480, step=10), P('naa', 'aa individuals', 0, 500, 160, step=10)],
      readouts=[R('p = f(A)', '(2*nAA+nAa)/(2*(nAA+nAa+naa))'), R('q = f(a)', '(2*naa+nAa)/(2*(nAA+nAa+naa))')])
plot('bio_hardy_weinberg', 'With random mating and no evolution, genotype frequencies settle at p², 2pq and q² after one generation. Heterozygotes peak at 50% when p = q = 0.5.',
     [F('x^2', 'AA = p²', 'green'), F('2*x*(1-x)', 'Aa = 2pq', 'gold'), F('(1-x)^2', 'aa = q²', 'pink')], x=[0, 1], y=[0, 1], xlabel='allele frequency p of A', ylabel='genotype frequency',
     vlines=[dict(x='p', label='')], params=[P('p', 'p (allele A)', 0, 1, 0.7, step=0.01)], readouts=[R('AA', 'p^2'), R('Aa (carriers)', '2*p*(1-p)'), R('aa', '(1-p)^2')])
plot('bio_drift_flow_selection_pop', 'Natural selection with advantage s changes allele frequency along an S-curve: p(t) = p₀eˢᵗ / (1 − p₀ + p₀eˢᵗ). Slide s and p₀; with s = 0 nothing moves (drift aside).',
     [F('p0*exp(s*x)/(1-p0+p0*exp(s*x))', 'allele frequency under selection', 'accent'), F('p0+0*x', 'no selection', 'dim', True)], x=[0, 300], y=[0, 1], xlabel='generations', ylabel='frequency of favoured allele',
     params=[P('s', 'selection advantage s', 0, 0.1, 0.03, step=0.005), P('p0', 'starting frequency', 0.01, 0.5, 0.05, step=0.01)], readouts=[R('generations to reach 50%', 's>0 ? ln((1-p0)/p0)/s : 0')])
plot('bio_inbreeding_conservation_genetics', 'In a small population inbreeding rises each generation (F = 1 − (1 − 1/2N)ᵗ) and fitness falls (exp(−B·F)). Smaller N means faster loss.',
     [F('100*(1-(1-1/(2*N))^x)', 'inbreeding F (%)', 'pink'), F('100*exp(-B*(1-(1-1/(2*N))^x))', 'relative fitness (%)', 'accent')], x=[0, 100], y=[0, 100], xlabel='generations', ylabel='%',
     params=[P('N', 'effective population size', 10, 500, 50, step=5), P('B', 'lethal equivalents B', 0, 6, 3, step=0.5)], readouts=[R('loss per generation', '100/(2*N)', '% heterozygosity'), R('F after 50 generations', '100*(1-(1-1/(2*N))^50)', '%')])
