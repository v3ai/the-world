from lib import *
import math

# ---------- MATERIALS ----------
pts = []
for i in range(-3, 4):
    for j in range(-2, 3):
        pts.append(Pt('%d*a+%d*a*cos(rad(g))' % (i, j), '%d*a*sin(rad(g))' % j, 'accent', 5))
pts.append(Pg([[0, 0], ['a', 0], ['a+a*cos(rad(g))', 'a*sin(rad(g))'], ['a*cos(rad(g))', 'a*sin(rad(g))']], 'gold', 'gold', alpha=0.2, width=2))
pts.append(T(0, -2.6, 'unit-cell area = {a*a*sin(rad(g))}', 'gold', 11))
geo('crystal_lattices', 'A crystal is atoms repeated on a lattice. The shaded cell is repeated by translation to fill the plane. Change the angle: 90° gives a square lattice, 60° a hexagonal (close-packed) one.',
    [-4.6, 4.6, -3, 2.8], pts, params=[P('a', 'lattice spacing', 0.6, 1.2, 1, None), P('g', 'angle between axes', 50, 120, 90, '°')], readouts=[R('cell area', 'a*a*sin(rad(g))')], aspect=0.62)

geo('band_theory', 'Electron energies in a solid form bands. Metals have partly filled bands; insulators have a big gap Eg above a full band; semiconductors have a small gap. The number of thermally excited carriers falls off as e^(−Eg/2kT).',
    [0, 10, -2.2, 8.4],
    [Rc(1, -2, 6, 2, 'accent', 'accent', alpha=0.35), T(4, -1, 'valence band (full)', 'accent', 11),
     Rc(1, 'Eg', 6, 2, 'pink', 'pink', alpha=0.25), T(4, 'Eg+1', 'conduction band (empty)', 'pink', 11),
     A(8.5, 0, 8.5, 'Eg', 'gold', 2), T(9.4, 'Eg/2', 'Eg', 'gold', 12)],
    params=[P('Eg', 'band gap Eg', 0.1, 6, 1.12, 'eV')],
    readouts=[R('carriers vs silicon (300 K)', 'exp(-(Eg-1.12)/(2*0.02585))'), R('conductor / semi / insulator', 'Eg<0.2 ? 0 : Eg<3 ? 1 : 2')], equal=False, aspect=0.6)
S['band_theory']['readouts'] = [R('carrier density vs silicon', 'exp(-(Eg-1.12)/(2*0.02585))')]
S['band_theory']['caption'] = 'Electron energies in a solid form bands. Metals have partly filled bands; insulators have a big gap Eg above a full band; semiconductors have a small gap (silicon: 1.12 eV). Carriers excited across it scale as e^(−Eg/2kT).'

plot('semiconductors_pn', 'A p–n junction conducts one way: current grows exponentially with forward voltage but is tiny in reverse (a diode). A larger band gap means smaller saturation current, so a higher turn-on voltage.',
     [F('1000*10^lis*(exp(x/(1.0*0.02585))-1)', 'current', 'accent')], x=[-0.5, 1.2], y=[-5, 60], xlabel='voltage across diode (V)', ylabel='current (mA)',
     params=[P('lis', 'log₁₀ saturation current', -14, -6, -12, 'A')], readouts=[R('voltage for 10 mA', '0.02585*ln(0.01/10^lis)', 'V')])

plot('superconductivity', 'A normal metal\'s resistance falls with temperature but stays finite; a superconductor drops to exactly zero below its critical temperature T_c. Niobium: 9 K; YBCO: 92 K. The mechanism in high-T_c materials is not settled.',
     [F('x<Tc ? 0 : 0.05+x/160', 'superconductor', 'accent'), F('0.05+x/160', 'ordinary metal', 'pink', dash=True)], x=[0, 150], y=[0, 1.05], xlabel='temperature (K)', ylabel='resistance (relative)',
     params=[P('Tc', 'critical temperature', 4, 130, 92, 'K')], vlines=[dict(x='Tc', label='T_c', color='gold')])

plot('magnetic_materials', 'A ferromagnet\'s magnetisation lags the applied field (hysteresis): the loop area is energy lost each cycle. Soft magnets (transformer cores) have thin loops; hard magnets (permanent magnets) have wide ones.',
     [F('tanh((x-hc)/0.5)', 'field increasing', 'accent'), F('tanh((x+hc)/0.5)', 'field decreasing', 'pink')], x=[-5, 5], y=[-1.2, 1.2], xlabel='applied field H (arb.)', ylabel='magnetisation M / M_sat',
     params=[P('hc', 'coercivity', 0.1, 3, 1)], readouts=[R('loop width ≈ 2·coercivity', '2*hc')])

plot('dislocations_strength', 'Hall–Petch: metals get stronger as grains get smaller, σ = σ₀ + k/√d, because grain boundaries block dislocations. Slide the grain size.',
     [F('s0+600/sqrt(x)', 'yield strength', 'accent')], x=[1, 100], y=[0, 800], xlabel='grain diameter (µm)', ylabel='yield strength (MPa)',
     params=[P('s0', 'friction stress σ₀', 50, 200, 100, 'MPa'), P('d', 'grain size', 1, 100, 10, 'µm')],
     points=[dict(x='d', y='s0+600/sqrt(d)', label='{s0+600/sqrt(d)} MPa')], readouts=[R('yield strength', 's0+600/sqrt(d)', 'MPa')])

bars('engineering_materials', 'Stiffness (Young\'s modulus) of materials spans about five orders of magnitude, from rubber to diamond. Metals are stiff and tough, ceramics very stiff but brittle, polymers flexible.',
     [('rubber', 0.01), ('nylon', 3), ('aluminium', 69), ('steel', 200), ('alumina', 370), ('diamond', 1100, 'gold')], logy=True, ylabel='Young\'s modulus (GPa)')

plot('soft_matter', 'In a liquid crystal the rod-shaped molecules line up (order parameter S > 0) in a range of temperature, losing order abruptly at the clearing point (1.0). Slide the temperature across it.',
     [F('x<1 ? (1-x/1.01)^0.22 : 0', 'orientational order S', 'accent')], x=[0.8, 1.1], y=[0, 1], xlabel='temperature / clearing temperature', ylabel='order parameter S',
     params=[P('T', 'temperature', 0.8, 1.1, 0.9)], points=[dict(x='T', y='T<1 ? (1-T/1.01)^0.22 : 0')], readouts=[R('S', 'T<1 ? (1-T/1.01)^0.22 : 0')])

add('topological_matter', dict(type='surface', f='sqrt(x^2+y^2+d^2)', x=[-2, 2], y=[-2, 2], params=[P('d', 'gap Δ', 0, 1, 0)],
    caption='Electron energy of graphene as a function of momentum (upper band, rotate by dragging): a cone with no gap at Δ = 0 (massless "Dirac" electrons). A gap Δ > 0, as in boron nitride, lifts the tip. The lower band mirrors it.'))

plot('solar_cells', 'A solar cell gives current at low voltage and collapses near its open-circuit voltage; power (gold) peaks at the "knee". Dimmer light cuts current almost in proportion but voltage only a little.',
     [F('9*G-1e-9*(exp(x/(1.2*0.02585))-1)', 'current (A)', 'accent'), F('x*(9*G-1e-9*(exp(x/(1.2*0.02585))-1))', 'power (W)', 'gold')], x=[0, 0.8], y=[0, 10], xlabel='cell voltage (V)', ylabel='current (A) / power (W)',
     params=[P('G', 'sunlight intensity', 0.1, 1.2, 1, 'suns')], readouts=[R('short-circuit current', '9*G', 'A'), R('open-circuit voltage', '1.2*0.02585*ln(9*G/1e-9)', 'V')])

# ---------- BIOCHEMISTRY ----------
nodes = [nd('m1', 'Sugars', 10, 12, 'gold'), nd('m2', 'Amino acids', 10, 37, 'accent'), nd('m3', 'Nucleotides', 10, 62, 'pink'), nd('m4', 'Fatty acids + glycerol', 14, 87, 'green'),
         nd('p1', 'Polysaccharides', 82, 12, 'gold'), nd('p2', 'Proteins', 82, 37, 'accent'), nd('p3', 'DNA / RNA', 82, 62, 'pink'), nd('p4', 'Lipids / membranes', 82, 87, 'green')]
blocks('biomolecules_overview', 'Life is built from four classes of molecules. Small building blocks (left) link into large polymers or assemblies (right): energy stores, enzymes, information and membranes.',
       nodes, [('m1', 'p1'), ('m2', 'p2'), ('m3', 'p3'), ('m4', 'p4')], aspect=0.66)

bars('carbohydrates_energy', 'Energy per gram of nutrient. Fat stores more than twice as much as carbohydrate or protein, which is why it is the body\'s long-term fuel store. (kJ per gram, typical values.)',
     [('carbohydrate', 17, 'gold'), ('protein', 17, 'accent'), ('alcohol', 29), ('fat', 37, 'pink')], ylabel='energy (kJ/g)')

plot('protein_structure', 'A protein folds from a floppy chain into a compact shape set by its sequence. Heating unfolds it: the fraction folded drops from 1 to 0 over a narrow range around the melting temperature T_m. Fold stability varies widely.',
     [F('1/(1+exp(-(dh*1000*(1-(x+273.15)/(tm+273.15)))/(8.314*(x+273.15))))', 'folded fraction', 'accent')], x=[20, 100], y=[0, 1.05], xlabel='temperature (°C)', ylabel='fraction folded',
     params=[P('tm', 'melting temperature T_m', 40, 90, 65, '°C'), P('dh', 'unfolding enthalpy', 200, 600, 400, 'kJ/mol')],
     vlines=[dict(x='tm', label='T_m', color='gold')])
S['protein_structure']['fns'][0]['f'] = '1/(1+exp(-(dh*1000*(1-(x+273.15)/(tm+273.15)))/(8.314*(x+273.15))))'

plot('enzymes', 'Michaelis–Menten: an enzyme\'s rate rises with substrate but saturates at V_max as all the enzyme is busy. K_m is the concentration giving half the maximum; small K_m means tight binding.',
     [F('Vm*x/(Km+x)', 'reaction rate', 'accent')], x=[0, 10], y=[0, 105], xlabel='substrate concentration (mM)', ylabel='rate (µmol/min)',
     params=[P('Vm', 'V_max', 20, 100, 80, 'µmol/min'), P('Km', 'K_m', 0.2, 5, 1.5, 'mM')],
     points=[dict(x='Km', y='Vm/2', label='K_m')], hlines=[dict(y='Vm', label='V_max', color='pink')], readouts=[R('rate at 1 mM', 'Vm/(Km+1)', 'µmol/min')])

blocks('atp_energy', 'Cells recharge ATP from food or light and spend it by splitting off a phosphate, releasing roughly 50 kJ/mol in a cell. You make and recycle about your own body weight of ATP each day.',
       [('atp', 'ATP', 20, 20, 'gold'), ('adp', 'ADP + Pᵢ', 20, 80), ('w', 'Work: muscle, pumps,\nbiosynthesis', 80, 20, 'accent'), ('f', 'Respiration\n(food, light)', 80, 80, 'pink')],
       [('atp', 'adp', 'hydrolysis'), ('adp', 'atp', 'recharge'), ('atp', 'w', 'energy'), ('f', 'adp', 'drives')], aspect=0.6)
S['atp_energy']['edges'] = [{'from': 'atp', 'to': 'w', 'label': 'energy released'}, {'from': 'atp', 'to': 'adp', 'label': 'splits'}, {'from': 'f', 'to': 'atp', 'label': 'recharges'}, {'from': 'adp', 'to': 'f'}]
S['atp_energy']['nodes'][2]['label'] = 'Cell work'; S['atp_energy']['nodes'][3]['label'] = 'Respiration'

chain('metabolism_overview', 'Cells burn glucose in stages: glycolysis (2 ATP), the Krebs cycle (carriers NADH, FADH₂) and finally the electron transport chain, which makes most of the ~30 ATP per glucose.',
      ['Glucose', 'Glycolysis → pyruvate', 'Krebs cycle', 'NADH, FADH₂', 'Electron transport', '~30 ATP + H₂O'], per_row=3, colors=['gold', 'accent', 'accent', 'pink', 'accent', 'gold'])

geo('oxidative_phosphorylation', 'Respiration pumps protons across the inner mitochondrial membrane; their flow back through ATP synthase turns a rotor that makes ATP. The proton-motive force is Δψ + 59·ΔpH (mV).',
    [-3, 3, -2.2, 2.2],
    [Rc(-3, -0.12, 6, 0.24, 'dim', 'dim', alpha=0.5), T(-2.3, 0.45, 'intermembrane space (H⁺ high)', 'dim', 10, 'left'), T(-2.3, -0.45, 'matrix', 'dim', 10, 'left'),
     Rc(-0.5, -0.12, 1, 0.24, 'accent', 'accent', alpha=0.8), C(0, -1.0, 0.55, 'gold', 'gold', alpha=0.3),
     L(0, -1.0, '0.55*cos(t*pmf/30)', '-1+0.55*sin(t*pmf/30)', 'gold', 3), T(0, -1.9, 'ATP synthase rotor', 'gold', 10)] +
    [Pt('-1.8+0.9*%d+0.05*sin(t*3+%d)' % (i, i), '0.5+1.2*mod(t*0.3*pmf/150+%s,1)' % (i * 0.31), 'red', 4) for i in range(5)],
    params=[P('dpsi', 'membrane voltage Δψ', 100, 180, 150, 'mV'), P('dph', 'pH difference ΔpH', 0, 1, 0.5)], readouts=[R('proton-motive force', 'dpsi+59*dph', 'mV')], equal=False, aspect=0.62)
for s in S['oxidative_phosphorylation']['shapes']:
    for k, v in list(s.items()):
        if isinstance(v, str) and 'pmf' in v: s[k] = v.replace('pmf', '(dpsi+59*dph)')
for s in S['oxidative_phosphorylation']['shapes']:
    if s.get('k') == 'text' and s.get('align') == 'left': s['x'] = -2.8
S['oxidative_phosphorylation']['caption'] = 'Respiration pumps protons (red) across the inner mitochondrial membrane; their flow back through ATP synthase spins a rotor that makes ATP. A bigger proton-motive force Δψ + 59·ΔpH drives it faster.'

plot('photosynthesis_light', 'Chlorophylls absorb blue and red light but reflect green, which is why leaves look green. Each photon\'s energy is E = hc/λ; slide the wavelength to see how much chlorophyll a absorbs.',
     [F('exp(-((x-430)/22)^2)+0.8*exp(-((x-662)/18)^2)', 'chlorophyll a', 'green'), F('0.9*exp(-((x-453)/22)^2)+0.5*exp(-((x-642)/18)^2)', 'chlorophyll b', 'accent'), F('0.7*exp(-((x-475)/32)^2)', 'carotenoids', 'orange')],
     x=[350, 750], y=[0, 1.15], xlabel='wavelength (nm)', ylabel='relative absorption', params=[P('l', 'wavelength', 400, 700, 550, 'nm')], vlines=[dict(x='l', label='λ', color='white')],
     readouts=[R('photon energy', '1239.84/l', 'eV'), R('chlorophyll a absorbs', '100*(exp(-((l-430)/22)^2)+0.8*exp(-((l-662)/18)^2))', '%')])

geo('dna_structure', 'DNA is two strands twisted into a double helix (pitch 3.4 nm, 10 base pairs per turn), held by base pairs: A–T (two hydrogen bonds) and G–C (three). Replication copies each strand using the other as template.',
    [-1.5, 1.5, 0, 7.4],
    [Cv('0.9*sin(2*pi*s/3.4-2*t*0.5)', 's', [0, 7.2], 'accent', 3), Cv('0.9*sin(2*pi*s/3.4-2*t*0.5+pi)', 's', [0, 7.2], 'pink', 3)] +
    [L('0.9*sin(2*pi*%s/3.4-t)' % round(0.34 * i, 2), round(0.34 * i, 2), '0.9*sin(2*pi*%s/3.4-t+pi)' % round(0.34 * i, 2), round(0.34 * i, 2), 'gold' if i % 3 else 'green', 1.5) for i in range(1, 21)] +
    [T(1.1, 0.4, '3.4 nm / turn', 'dim', 10)], equal=False, aspect=1.1)
for s in S['dna_structure']['shapes']:
    for k, v in list(s.items()):
        if isinstance(v, str) and '-t' in v: pass
for s in S['dna_structure']['shapes']:
    for k in ('x1', 'x2'):
        if k in s: s[k] = s[k].replace('-t', '-t').replace('-t+pi', '-t+pi')
S['dna_structure']['shapes'] = [s for s in S['dna_structure']['shapes']]
S['dna_structure']['aspect'] = 1.0
# keep rungs phase-consistent with curves (-t, since curves use -2*t*0.5 = -t)

chain('central_dogma', 'Information flows DNA → RNA → protein. Transcription copies a gene into messenger RNA; ribosomes translate it, three letters (a codon) per amino acid. DNA also copies itself (replication).',
      ['DNA', 'mRNA', 'Protein'], per_row=3, colors=['accent', 'gold', 'pink'], elabels=['transcription', 'translation'])
S['central_dogma']['edges'].append({'from': 'n0', 'to': 'n0', 'label': 'replication'}); S['central_dogma']['edges'].pop()
S['central_dogma']['aspect'] = 0.4

plot('gene_regulation', 'A gene\'s output is switch-like in the concentration of its activator (Hill function). More cooperative binding (higher n) gives a sharper switch; K sets the threshold. This is the basis of cell decisions.',
     [F('x^n/(K^n+x^n)', 'expression level', 'accent')], x=[0, 5], y=[0, 1.05], xlabel='activator concentration', ylabel='gene expression (fraction of max)',
     params=[P('n', 'cooperativity n', 1, 8, 3, step=1), P('K', 'threshold K', 0.5, 4, 2)], vlines=[dict(x='K', label='K', color='gold')])

bars('chromatin_genome', 'Genome sizes in base pairs. Human DNA is 3.1 billion letters, about 2 m of molecule folded into a nucleus ~6 µm across; genome size does not track complexity (wheat and lungfish are larger).',
     [('E. coli', 4.6e6), ('yeast', 1.2e7), ('fruit fly', 1.4e8), ('human', 3.1e9, 'gold'), ('wheat', 1.6e10)], logy=True, ylabel='base pairs')

blocks('crispr_biotech', 'CRISPR–Cas9: a guide RNA leads the Cas9 enzyme to a matching 20-letter DNA site, where it cuts both strands. The cell\'s repair then either disables the gene or, with a template, writes in a new sequence.',
       [('g', 'Guide RNA + Cas9', 10, 50, 'gold'), ('t', 'Find target\nnext to PAM', 42, 50), ('c', 'Double-strand cut', 72, 50, 'pink'), ('k', 'Repair: gene knocked out', 86, 14, 'accent'), ('i', 'Repair: new sequence inserted', 86, 86, 'green')],
       [('g', 't'), ('t', 'c'), ('c', 'k', 'NHEJ'), ('c', 'i', 'HDR')], aspect=0.62)
S['crispr_biotech']['nodes'][1]['label'] = 'Find target'; S['crispr_biotech']['nodes'][3]['label'] = 'Gene knocked out'; S['crispr_biotech']['nodes'][4]['label'] = 'New DNA inserted'
S['crispr_biotech']['nodes'][0]['x'] = 14; S['crispr_biotech']['nodes'][1]['x'] = 44; S['crispr_biotech']['nodes'][2]['x'] = 66

# membrane
sh = []
for i in range(12):
    x0 = round(-2.6 + i * 0.47, 2)
    for sgn in (1, -1):
        w = 'fl*0.1*sin(t*%s+%d)' % (round(2 + (i % 4) * 0.7, 1), i * 2 + (1 if sgn < 0 else 0))
        sh.append(C('%s+%s' % (x0, w), sgn * 1.25, 0.17, 'accent' if sgn > 0 else 'pink', 'accent' if sgn > 0 else 'pink', alpha=0.8))
        for dx in (-0.06, 0.06):
            sh.append(L('%s+%s' % (x0 + dx, w), sgn * 1.08, '%s+%s' % (x0 + dx, w), sgn * 0.08, 'dim', 1.5))
sh += [T(0, 0, 'hydrophobic tails (~4 nm thick bilayer)', 'dim', 10), T(-2.2, 1.85, 'outside (water)', 'dim', 10, 'left'), T(-2.2, -1.85, 'inside (water)', 'dim', 10, 'left')]
geo('membrane_structure', 'The cell membrane is a double layer of lipids with water-loving heads (circles) outside and oily tails inside, about 4 nm thick. It is fluid: lipids jiggle sideways. Raise the temperature for more motion.',
    [-3, 3, -2.2, 2.2], sh, params=[P('fl', 'temperature (fluidity)', 0, 3, 1, None)], equal=False, aspect=0.62)

plot('membrane_transport', 'Ion gradients make membrane voltages. The Nernst equation gives the potential at which an ion\'s diffusion is balanced by its electric pull: E = 61.5 mV·log₁₀(out/in) at body temperature. K⁺ (5 mM out, 140 in) gives about −90 mV.',
     [F('61.5*log10(x/Kin)', 'equilibrium potential for K⁺', 'accent')], x=[1, 100], y=[-150, 60], logx=True, xlabel='outside K⁺ concentration (mM)', ylabel='potential (mV)',
     params=[P('Kin', 'inside K⁺', 50, 300, 140, 'mM'), P('Ko', 'outside K⁺', 1, 100, 5, 'mM')], points=[dict(x='Ko', y='61.5*log10(Ko/Kin)', label='{61.5*log10(Ko/Kin)} mV')],
     readouts=[R('potassium equilibrium potential', '61.5*log10(Ko/Kin)', 'mV')])

bars('cell_biology_intro', 'Sizes of biological things on a log scale: a typical animal cell is ~20 µm, a thousand times bigger than a ribosome and ten times a bacterium. Everything alive is built from cells.',
     [('ribosome', 0.025), ('virus', 0.1), ('bacterium', 2), ('red blood cell', 7), ('animal cell', 20, 'gold'), ('frog egg', 1000)], logy=True, ylabel='size (µm)')

chain('organelles_overview', 'The secretory pathway: the gene is copied in the nucleus, the protein is made and folded in the rough ER, finished in the Golgi, and shipped in vesicles to the membrane or to lysosomes.',
      ['Nucleus (mRNA)', 'Rough ER (make protein)', 'Golgi (modify, sort)', 'Vesicle → membrane / lysosome'], per_row=2, colors=['accent', 'gold', 'pink', 'green'])

blocks('mitochondria_org', 'Mitochondria descend from a bacterium engulfed by an ancestral host cell about 2 billion years ago. They still have their own small circular DNA (16.6 kb in humans), their own ribosomes and a double membrane.',
       [('h', 'Archaeal host cell', 12, 18, 'accent'), ('b', 'α-proteobacterium', 12, 82, 'pink'), ('e', 'Endosymbiosis', 50, 50), ('m', 'Eukaryote with\nmitochondria', 86, 50, 'gold')],
       [('h', 'e'), ('b', 'e'), ('e', 'm')], aspect=0.55)
S['mitochondria_org']['nodes'][3]['label'] = 'Mitochondrion'

chain('chloroplast_org', 'Chloroplasts are former cyanobacteria. Light reactions in the thylakoid membranes make ATP and NADPH; the Calvin cycle in the surrounding stroma uses them to fix CO₂ into sugar.',
      ['Light + H₂O', 'Thylakoid: light reactions', 'ATP + NADPH', 'Stroma: Calvin cycle', 'Sugar + O₂'], per_row=2, colors=['gold', 'green', 'pink', 'green', 'gold'])

blocks('cell_cycle', 'A dividing cell cycles through growth (G1), DNA copying (S), preparation (G2) and mitosis (M). Checkpoints between phases halt the cycle if something is wrong; cells that stop dividing sit in G0.',
       [('g1', 'G1 growth', 50, 8, 'accent'), ('s', 'S: copy DNA', 90, 50, 'pink'), ('g2', 'G2 prepare', 50, 92, 'gold'), ('m', 'M: mitosis', 10, 50, 'green')],
       [('g1', 's', 'checkpoint'), ('s', 'g2'), ('g2', 'm', 'checkpoint'), ('m', 'g1', 'divide')], aspect=0.75)

blocks('cell_signaling', 'A signal molecule binds a receptor, a relay chain of enzymes amplifies it, and the cell responds: change gene activity, move, divide, or (if damaged beyond repair) trigger programmed death (apoptosis).',
       [('l', 'Signal (ligand)', 10, 50, 'gold'), ('r', 'Receptor', 36, 50), ('k', 'Kinase cascade\n(amplifies)', 62, 50, 'accent'), ('x', 'Gene response', 90, 20, 'green'), ('a', 'Apoptosis', 90, 82, 'pink')],
       [('l', 'r'), ('r', 'k'), ('k', 'x', 'survive / grow'), ('k', 'a', 'severe damage')], aspect=0.6)
S['cell_signaling']['nodes'][2]['label'] = 'Kinase cascade'

geo('cytoskeleton_motors', 'Kinesin walks along a microtubule in 8 nm steps, one head after the other, burning one ATP per step and hauling a cargo. Speed saturates at high ATP (Michaelis–Menten). Animation is slowed down.',
    [-1, 13, -2.2, 3.2],
    [Rc(-1, -0.6, 14, 0.6, 'accent', 'accent', alpha=0.35), T(6, -1.5, 'microtubule', 'accent', 10),
     C('(16*floor((k+1)/2)*0.5)+0.4', 0.1, 0.35, 'gold', 'gold', alpha=0.8), C('(16*floor(k/2)*0.5)+4.4', 0.1, 0.35, 'gold', 'gold', alpha=0.8),
     L('(16*floor((k+1)/2)*0.5)+0.4', 0.3, '(16*floor(k/2)*0.5)+2.2+4*0-0.3+2.4', 1.5, 'gold', 2), L('(16*floor(k/2)*0.5)+4.4', 0.3, '(16*floor(k/2)*0.5)+2.2+4*0-0.3+2.4', 1.5, 'gold', 2),
     C('(16*floor(k/2)*0.5)+4.4/2+2.2/2+1', 2.2, 0.6, 'pink', 'pink', alpha=0.6), T('(16*floor(k/2)*0.5)+4.4/2+2.2/2+1', 2.2, 'cargo', 'white', 10)],
    params=[P('atp', 'ATP concentration', 5, 1000, 100, 'µM')],
    readouts=[R('stepping rate', '100*atp/(50+atp)', 'steps/s'), R('speed', '8*100*atp/(50+atp)', 'nm/s')], equal=False, aspect=0.55)
S['cytoskeleton_motors']['shapes'] = [
    Rc(-1, -0.6, 14, 0.6, 'accent', 'accent', alpha=0.35), T(6, -1.5, 'microtubule  (8 nm per step)', 'accent', 10),
    C('2*mod(floor(kk/2)*2+1+(1-mod(kk,2))*0,12)+1', 0.1, 0.35, 'gold', 'gold', alpha=0.8)]
S['cytoskeleton_motors']['shapes'] = []
# simpler: leading and trailing heads alternate every step; body of cargo at midpoint
kk = 'floor(mod(t*0.06*100*atp/(50+atp),12))'
lead = '(1+%s)' % kk  # step index
S['cytoskeleton_motors']['shapes'] = [
    Rc(-1, -0.6, 14, 0.6, 'accent', 'accent', alpha=0.35), T(6, -1.5, 'microtubule: one step = 8 nm', 'accent', 10),
    C('mod(%s,2)==0 ? %s+1 : %s' % (kk, kk, kk), 0.1, 0.35, 'gold', 'gold', alpha=0.9),
    C('mod(%s,2)==0 ? %s : %s+1' % (kk, kk, kk), 0.1, 0.35, 'pink', 'pink', alpha=0.9),
    L('mod(%s,2)==0 ? %s+1 : %s' % (kk, kk, kk), 0.1, '%s+0.5' % kk, 1.6, 'white', 2),
    L('mod(%s,2)==0 ? %s : %s+1' % (kk, kk, kk), 0.1, '%s+0.5' % kk, 1.6, 'white', 2),
    C('%s+0.5' % kk, 2.3, 0.7, 'green', 'green', alpha=0.5), T('%s+0.5' % kk, 2.3, 'cargo', 'white', 10)]

chain('viruses', 'A virus cannot reproduce alone: it attaches to a host cell, injects its genome, makes the cell build copies, assembles new particles and bursts out. Each cycle can release hundreds of virions.',
      ['Attach', 'Enter + release genome', 'Host copies genome & proteins', 'Assemble', 'Release (new virions)'], per_row=3, colors=['accent', 'accent', 'pink', 'gold', 'green'], loop=False)
S['viruses']['edges'].append({'from': 'n4', 'to': 'n0', 'label': 'next cell', 'dashed': True})

plot('bacteria_archaea', 'A bacterial culture doubles every generation (as fast as every 20 min for E. coli) until nutrients run out, then it levels off. Pick the doubling time; the vertical axis is logarithmic.',
     [F('1e9/(1+(1e9/1e3-1)*exp(-ln(2)*x/Td))', 'cells per mL', 'accent')], x=[0, 24], y=[100, 1e10], logy=True, xlabel='time (hours)', ylabel='cells per mL',
     params=[P('Td', 'doubling time', 0.33, 3, 0.5, 'h')], readouts=[R('generations in 10 h', '10/Td'), R('growth rate', 'ln(2)/Td', 'per h')])

add('genetics_inheritance', dict(type='dist', kind='binomial', n='n', p=0.75, sample=True, shade=['0.75*n-1', '0.75*n+1'],
    params=[P('n', 'offspring', 4, 40, 12, step=1)], readouts=[R('expected dominant offspring', '0.75*n')],
    caption='Cross two Aa parents: each offspring shows the dominant trait with probability 3/4 (Mendel\'s 3 : 1). The number of dominant offspring in a litter of n follows this distribution; the pink draws build up as you wait.'))

plot('natural_selection', 'A variant that gives a small advantage s spreads through a population by selection: its frequency follows a logistic S-curve, slowly at first, then quickly. The dot replays the generations.',
     [F('p0*exp(s*x)/(1-p0+p0*exp(s*x))', 'variant frequency', 'accent')], x=[0, 300], y=[0, 1.05], xlabel='generations', ylabel='frequency of the beneficial variant',
     params=[P('s', 'selective advantage s', 0.01, 0.15, 0.05), P('p0', 'starting frequency', 0.001, 0.1, 0.01)],
     points=[dict(x='mod(t*20,300)', y='p0*exp(s*mod(t*20,300))/(1-p0+p0*exp(s*mod(t*20,300)))')],
     readouts=[R('generations to reach 50%', 'ln((1-p0)/p0)/s')])

blocks('common_descent', 'All living things share ancestors. Each split in the tree is a population that diverged; closeness on the tree means more recent common ancestry. Branch lengths and details are simplified here.',
       [('l', 'LUCA', 8, 50, 'gold'), ('b', 'Bacteria', 40, 18, 'accent'), ('a', 'Archaea', 40, 50, 'accent'), ('e', 'Eukaryotes', 40, 82, 'accent'),
        ('p', 'Plants', 82, 54), ('f', 'Fungi', 82, 70), ('an', 'Animals', 82, 86, 'pink'), ('v', 'Vertebrates', 82, 100, 'green')], 
       [('l', 'b'), ('l', 'a'), ('a', 'e', 'host lineage'), ('e', 'p'), ('e', 'f'), ('e', 'an'), ('an', 'v')], flow=False, aspect=0.75)
del S['common_descent']
blocks('common_descent', 'All living things share ancestors. Each split in the tree is a population that diverged; closeness on the tree means more recent common ancestry. Simplified: the true tree has millions of tips.',
       [('l', 'LUCA', 10, 50, 'gold'), ('b', 'Bacteria', 40, 12, 'accent'), ('a', 'Archaea', 40, 50, 'accent'), ('e', 'Eukaryotes', 70, 50, 'accent'),
        ('p', 'Plants', 90, 20, 'green'), ('f', 'Fungi', 92, 50), ('an', 'Animals', 90, 82, 'pink')],
       [('l', 'b'), ('l', 'a'), ('a', 'e'), ('e', 'p'), ('e', 'f'), ('e', 'an')], flow=False, aspect=0.7)

plot('speciation_biodiversity', 'Larger areas hold more species: S = cA^z with z ≈ 0.15–0.35. On log axes it is a straight line. Cutting a habitat to 10% of its area eventually loses a predictable share of its species.',
     [F('10*x^z', 'species richness', 'accent')], x=[1, 1e6], y=[10, 1e4], logx=True, logy=True, xlabel='habitat area (km²)', ylabel='number of species',
     params=[P('z', 'exponent z', 0.15, 0.35, 0.25)], readouts=[R('species lost if habitat cut to 10%', '100*(1-0.1^z)', '%'), R('doubling area adds', '100*(2^z-1)', '% species')])

bars('mass_extinctions', 'Five mass extinctions have each wiped out most marine species. The end-Permian "Great Dying" (252 Ma) was the worst, with about 96% lost. Percentages are approximate estimates of marine species.',
     [('End-Ordovician 445 Ma', 85), ('Late Devonian 372 Ma', 75), ('End-Permian 252 Ma', 96, 'pink'), ('End-Triassic 201 Ma', 80), ('K–Pg 66 Ma', 76)], ylabel='marine species lost (%)')
for b in S['mass_extinctions']['bars']: b['label'] = b['label'].split(' ')[0].replace('End-', '').replace('Late', 'L.')[:9] + ' ' + b['label'].split(' ')[-2]
S['mass_extinctions']['bars'][4]['label'] = 'K–Pg 66'

pts = [(-3.5, 450, 'A. afarensis'), (-2.0, 610, 'H. habilis'), (-1.5, 850, 'H. erectus'), (-0.5, 1200, 'H. heidelbergensis'), (-0.2, 1350, 'H. sapiens'), (-0.1, 1500, 'Neanderthal')]
plot('human_evolution', 'Brain size grew roughly threefold over about 3.5 million years of hominin evolution, with several coexisting species rather than a single line. Values are approximate species averages in cm³; interpretations are still debated.',
     [], x=[-4, 0.3], y=[300, 1700], xlabel='millions of years ago (negative = past)', ylabel='cranial capacity (cm³)',
     points=[dict(x=x, y=y, label=l, color='gold' if 'sap' in l else 'accent') for x, y, l in pts])
for p in S['human_evolution']['points']: 
    if p['label'] in ('H. heidelbergensis',): p['label'] = 'H. heid.'

hub('origin_of_life', 'How non-living chemistry became life is unknown. Several settings have been proposed, each with partial lab support, and none is established. Earliest evidence of life is ≳3.5 billion years ago, only ~1 billion years after Earth formed.',
    'First self-copying chemistry?', ['Hydrothermal vents', 'Warm ponds (wet–dry)', 'Primordial soup', 'Ice / mineral surfaces', 'Delivery from space'], colors=['pink'] * 5, aspect=0.85)

chain('rna_world', 'RNA can both carry information and catalyse reactions (ribozymes), so it could have run early life before DNA and proteins. Later, proteins took over catalysis and DNA took over storage. Supported by lab evidence but not proven.',
      ['Self-copying RNA', 'RNA + peptides', 'DNA stores, protein works'], per_row=3, colors=['pink', 'accent', 'gold'], elabels=['ribozymes', 'specialisation'])

blocks('luca', 'The last common ancestor of all life lived roughly 4 billion years ago and was already complex (it had DNA, ribosomes, ATP). Eukaryotes arose from an archaeon that merged with a bacterium; the root and timing of the tree are debated.',
       [('l', 'LUCA', 10, 50, 'gold'), ('b', 'Bacteria', 45, 14, 'accent'), ('a', 'Archaea', 45, 60, 'accent'), ('e', 'Eukaryotes', 85, 60, 'accent')],
       [('l', 'b'), ('l', 'a'), ('a', 'e', 'host'), ('b', 'e', 'mitochondrion', True)], aspect=0.55)

add('cell_types', dict(type='surface', f='(x^2-max(0,y))^2-0.12*y', x=[-1.6, 1.6], y=[-1, 1.4],
    caption='Waddington\'s landscape: a developing cell (a ball) rolls downhill (forward in y). Early on there is one valley; later it splits into two, each a different cell fate. Rotate it to see how valleys force a choice.'))

plot('development_biology', 'A morphogen is made at one end and decays with distance, so cells read their position from its concentration: high = one fate, medium = another, low = a third. Change the decay length to move the boundaries.',
     [F('exp(-x/lam)', 'morphogen concentration', 'accent')], x=[0, 10], y=[0, 1.05], xlabel='distance from the source (cell diameters)', ylabel='concentration (relative)',
     params=[P('lam', 'decay length λ', 1, 5, 2.5)], hlines=[dict(y=0.5, label='threshold 1'), dict(y=0.15, label='threshold 2')],
     vlines=[dict(x='lam*ln(2)', label='fate boundary 1', color='gold'), dict(x='lam*ln(1/0.15)', label='boundary 2', color='gold')],
     readouts=[R('boundary 1', 'lam*ln(2)', 'cells'), R('boundary 2', 'lam*ln(1/0.15)', 'cells')])

plot('aging_biology', 'Human death rates roughly double every 8 years after early adulthood (Gompertz law). Why we age is still debated (competing evolutionary and mechanistic theories), though the statistical pattern is robust.',
     [F('0.001*2^((x-30)/dt)', 'annual risk of death', 'accent')], x=[30, 100], y=[0.0003, 1], logy=True, xlabel='age (years)', ylabel='annual mortality rate',
     params=[P('dt', 'doubling time', 5, 12, 8, 'years'), P('age', 'age', 30, 100, 70)], points=[dict(x='age', y='0.001*2^((age-30)/dt)')],
     readouts=[R('risk at that age', '100*0.001*2^((age-30)/dt)', '% per year')])
S['aging_biology']['y'] = [0.0003, 3]
