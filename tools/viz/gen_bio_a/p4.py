from lib import *
import math

# ===== CELL BIOLOGY =====
geo('bio_prokaryote_eukaryote', 'A bacterium (left, ~2 µm) has a nucleoid but no nucleus or organelles; a eukaryotic cell (right, 10–100 µm) has a nucleus and membrane-bound organelles. Not to scale.',
    [-5, 5, -2.6, 2.6],
    [C(-3, 0, 0.5, 'dim', alpha=0.0), Rc(-4.2, -0.6, 2.4, 1.2, 'accent', 'accent', 0.12, 2), C(-4.2, 0, 0.6, 'accent', 'accent', alpha=0.12, width=2), C(-1.8, 0, 0.6, 'accent', 'accent', alpha=0.12, width=2),
     Cv('-3.6+1.2*sin(s*3)*0.3+0.0*s', '0.25*sin(s*5)', [0, 6], 'gold', 2), C(-3.0, 0, 0.12, 'pink', 'pink'), C(-2.6, 0.25, 0.1, 'pink', 'pink'), C(-3.4, -0.3, 0.1, 'pink', 'pink'), C(-2.2, -0.2, 0.1, 'pink', 'pink'),
     T(-3, -1.3, 'prokaryote', 'accent', 10, 'center'), T(-3, -1.8, 'nucleoid + ribosomes', 'dim', 9, 'center'),
     C(2.4, 0, 2.0, 'green', 'green', 2, alpha=0.1), C(2.0, 0.5, 0.8, 'gold', 'gold', alpha=0.3, width=2), C(2.0, 0.5, 0.25, 'orange', 'orange', alpha=0.6),
     Rc(3.2, -1.0, 0.9, 0.4, 'pink', 'pink', 0.4), Rc(1.0, -1.1, 0.8, 0.35, 'pink', 'pink', 0.4), C(3.2, 0.9, 0.3, 'purple', 'purple', alpha=0.4), C(0.9, 0.0, 0.25, 'purple', 'purple', alpha=0.4),
     T(2.4, -2.35, 'eukaryote', 'green', 10, 'center'), T(2.0, 1.6, 'nucleus', 'gold', 9, 'center')], aspect=0.55)
plot('bio_cell_size_limits', 'As a cell grows its surface-to-volume ratio (3/r) falls while diffusion across it slows as r²/6D, so large cells need transport systems. Change the diffusion coefficient.',
     [F('3/x', 'surface/volume (1/µm)', 'accent'), F('x^2/(6*D)', 'diffusion time (s)', 'pink')], x=[0.5, 50], y=[0.01, 30], logx=True, logy=True, xlabel='cell radius (µm)', ylabel='value',
     params=[P('D', 'diffusion coefficient D', 10, 500, 100, 'µm²/s')], vlines=[dict(x=1, label='bacterium'), dict(x=10, label='typical cell')],
     readouts=[R('diffusion time at r = 10 µm', '100/(6*D)', 's'), R('at r = 1 mm', '1e6/(6*D)/3600', 'h')])
fm = [Rc(-4.5, -0.15, 9, 0.3, 'dim', 'dim', 0.01)]
for k in range(9):
    xk = -4.2 + k
    fm += [C('%s+0.1*T*sin(t*1.5+%d)' % (xk, k), '1.4', 0.3, 'gold', 'gold', alpha=0.7), L(xk - 0.1, 1.1, xk - 0.1, 0.1, 'white', 1.5), L(xk + 0.1, 1.1, xk + 0.1, 0.1, 'white', 1.5),
           C('%s+0.1*T*sin(t*1.5+%d+2)' % (xk + 0.5, k), '-1.4', 0.3, 'accent', 'accent', alpha=0.7), L(xk + 0.4, -1.1, xk + 0.4, -0.1, 'white', 1.5), L(xk + 0.6, -1.1, xk + 0.6, -0.1, 'white', 1.5)]
fm += [Rc('-2+0.5*T*sin(t)', -1.7, 1.0, 3.4, 'pink', 'pink', 0.55), T('-1.5+0.5*T*sin(t)', 1.95, 'channel', 'pink', 9, 'center'),
       Rc('2.2-0.4*T*sin(t*0.8)', -1.0, 0.9, 2.0, 'green', 'green', 0.55), T('2.65-0.4*T*sin(t*0.8)', 1.2, 'receptor', 'green', 9, 'center'),
       C(0.2, 0.55, 0.28, 'orange', 'orange', alpha=0.8), T(0.2, 0.55, 'chol', 'white', 8, 'center'), C(-3.4, -0.55, 0.28, 'orange', 'orange', alpha=0.8)]
geo('bio_fluid_mosaic', 'The bilayer is a fluid with proteins floating in it, cholesterol tucked between lipids. Raise the temperature slider to make everything jiggle more (more fluid).',
    [-4.6, 4.6, -2.4, 2.4], fm, params=[P('T', 'temperature', 0.2, 2, 1, '(relative)')], aspect=0.55)
S['bio_fluid_mosaic']['params'][0]['unit'] = '×'
plot('bio_diffusion_osmosis', 'Diffusion spreads a concentration step: the front moves only as √(Dt), so doubling the distance takes four times as long. Slide time to watch the profile flatten.',
     [F('50*(1-erf(x/(2*sqrt(D*tt))))', 'concentration at time t', 'accent')], x=[0, 100], y=[0, 100], xlabel='distance (µm)', ylabel='concentration (% of source)',
     params=[P('D', 'D (small molecule)', 20, 1000, 100, 'µm²/s'), P('tt', 'time', 0.1, 60, 5, 's')],
     readouts=[R('typical spread √(2Dt)', 'sqrt(2*D*tt)', 'µm'), R('time to cross 100 µm', '100^2/(2*D)', 's')])
S['bio_diffusion_osmosis']['fns'][0]['f'] = '100*(1-erf(x/(2*sqrt(D*tt))))'
plot('bio_facilitated_transport', 'Simple diffusion rises linearly with the gradient; a carrier saturates (like an enzyme) at Vmax because only so many proteins exist. Change the carrier\'s Km.',
     [F('0.4*x', 'simple diffusion', 'dim', True), F('Vmax*x/(Km+x)', 'carrier (GLUT1)', 'accent')], x=[0, 20], y=[0, 12], xlabel='outside glucose (mM)', ylabel='uptake rate (relative)',
     params=[P('Vmax', 'Vmax', 4, 12, 8), P('Km', 'Km', 1, 15, 1.5, 'mM')], readouts=[R('carrier at 5 mM', 'Vmax*5/(Km+5)'), R('half-max at', 'Km', 'mM')])
chain('bio_active_transport', 'Each pump cycle exports 3 Na⁺ and imports 2 K⁺ for one ATP, building the gradients (Na⁺ 145 vs 12 mM, K⁺ 5 vs 140 mM) that power signalling and transport.',
      ['3 Na⁺ bind inside', 'ATP phosphorylates', 'Na⁺ released out', '2 K⁺ bind outside', 'dephosphorylation', 'K⁺ released inside'], per_row=3, loop=True, colors=['accent', 'gold', 'accent', 'pink', 'gold', 'pink'],
      params=[P('n', 'pump cycles', 1, 100, 10, step=1)], readouts=[R('ATP used', 'n'), R('Na⁺ out / K⁺ in', '3*n', 'out'), R('net charge moved', '-n', 'e')], aspect=0.75)
S['bio_active_transport']['readouts'] = [R('ATP used', 'n'), R('Na⁺ pumped out', '3*n'), R('K⁺ pumped in', '2*n'), R('net charge moved out', 'n', 'e')]
blocks('bio_bulk_transport', 'Endocytosis pinches the membrane inward to take in cargo; exocytosis fuses vesicles with the membrane to release it. Both are driven by coats, SNAREs and the cytoskeleton.',
       [('m', 'Pit', 12, 15), ('v', 'Vesicle', 38, 15, 'accent'), ('e', 'Endosome', 66, 15), ('l', 'Lysosome', 90, 15, 'pink'),
        ('g', 'Golgi', 12, 80), ('sv', 'Vesicle', 38, 80, 'gold'), ('f', 'Fusion', 66, 80), ('o', 'Released', 90, 80, 'green')],
       [('m', 'v', 'endocytosis'), ('v', 'e'), ('e', 'l'), ('g', 'sv', 'exocytosis'), ('sv', 'f'), ('f', 'o')], aspect=0.65)
plot('bio_membrane_potential', 'The resting potential lies between E_K (≈ −90 mV) and E_Na (≈ +60 mV), weighted by relative permeability (GHK equation). Open Na⁺ channels (higher pNa/pK) and the membrane depolarises.',
     [F('61.5*log10((x*Ko+145)/(x*0+1*0+(140)+x*12*0+x*12)*0+ (Ko+x*145)/(140+x*12))', 'GHK', 'accent')], x=[0.001, 100], logx=True, y=[-100, 70], xlabel='pNa / pK (relative permeability)', ylabel='membrane potential (mV)',
     params=[P('Ko', 'outside K⁺', 3, 10, 5, 'mM')], hlines=[dict(y=0, label='')], vlines=[dict(x=0.02, label='resting'), dict(x=20, label='action potential peak')],
     readouts=[R('Vm at pNa/pK = 0.02', '61.5*log10((Ko+0.02*145)/(140+0.02*12))', 'mV'), R('Vm at pNa/pK = 20', '61.5*log10((Ko+20*145)/(140+20*12))', 'mV')])
S['bio_membrane_potential']['fns'][0]['f'] = '61.5*log10((Ko+x*145)/(140+x*12))'
# nucleus
nu = [C(0, 0, 2.3, 'accent', 'accent', 2, alpha=0.08), C(0, 0, 2.0, 'accent', width=1.5), C(0.7, 0.5, 0.65, 'orange', 'orange', alpha=0.5), T(0.7, 0.5, 'nucleolus', 'white', 8, 'center'),
      Cv('-0.8*cos(s)+0.4*sin(3*s)', '0.9*sin(s)-0.3*cos(2*s)', [0, 6.28], 'gold', 1.5), Cv('-1.2*cos(s)+0.3*sin(4*s)', '-0.2+0.8*sin(s)+0.2*cos(3*s)', [0, 6.28], 'gold', 1.5, dash=True),
      T(0, 2.9, 'nuclear envelope (double membrane) with pores', 'accent', 10, 'center'), T(-1.1, -1.1, 'chromatin', 'gold', 9, 'center')]
for k in range(8):
    a = k * math.pi / 4 + 0.4
    nu += [Pt(round(2.15 * math.cos(a), 3), round(2.15 * math.sin(a), 3), 'white', 6)]
nu += [C('-3.6+(t*0.8)%3.2', 1.1, 0.12, 'pink', 'pink'), C('3.6-(t*0.8+1.0)%3.2', -1.1, 0.12, 'green', 'green'),
       T(-3.9, 1.5, 'proteins in', 'pink', 9), T(2.1, -1.6, 'RNA out', 'green', 9)]
geo('bio_nuclear_organization', 'The nuclear envelope is perforated by pores; proteins with a nuclear-localisation signal enter and mRNA/ribosome subunits leave. The nucleolus builds ribosomes.',
    [-4.4, 4.4, -3.2, 3.4], nu, aspect=0.8)
chain('bio_protein_targeting_secretory', 'Proteins with a signal peptide enter the ER while being made, then travel ER → Golgi → vesicles to the cell surface or lysosome; proteins without it stay in the cytosol.',
      ['Ribosome + signal', 'Rough ER', 'ER vesicle', 'Golgi (cis→trans)', 'Secretory vesicle', 'Plasma membrane'], per_row=3, colors=['accent', 'gold', 'gold', 'green', 'green', 'pink'], aspect=0.62)
chain('bio_autophagy', 'When starved, cells wrap parts of themselves in a double membrane (autophagosome) and deliver it to lysosomes, recycling the building blocks.',
      ['Starvation / stress', 'Phagophore forms', 'Autophagosome', '+ Lysosome', 'Autolysosome', 'Recycled monomers'], per_row=3, colors=['pink', 'accent', 'accent', 'gold', 'gold', 'green'], aspect=0.62)
blocks('bio_endosymbiosis', 'Mitochondria and chloroplasts descend from engulfed bacteria. Evidence: own circular DNA, 70S-like ribosomes, double membranes, and division by fission.',
       [('h', 'Archaeal host', 20, 10), ('a', 'α-proteobacterium', 78, 10, 'gold'), ('m', 'Mito. eukaryote', 45, 50, 'green'), ('c', 'Cyanobacterium', 80, 70, 'accent'), ('p', 'Plant / algal cell', 45, 90, 'green')],
       [('h', 'm', 'engulfs'), ('a', 'm', 'mitochondrion'), ('m', 'p', 'engulfs'), ('c', 'p', 'chloroplast')], aspect=0.7)
cp = [Pg([[-4, 0], [-3.5, 1.5], [0, 2.1], [3.5, 1.5], [4, 0], [3.5, -1.5], [0, -2.1], [-3.5, -1.5]], 'green', 'green', 0.12, 2), Pg([[-3.6, 0], [-3.2, 1.2], [0, 1.75], [3.2, 1.2], [3.6, 0], [3.2, -1.2], [0, -1.75], [-3.2, -1.2]], 'green', None, None, 1)]
for gx in (-2.0, 0.0, 2.0):
    for k in range(4):
        cp += [Rc(gx - 0.55, -0.55 + 0.35 * k, 1.1, 0.22, 'accent', 'accent', 0.5)]
cp += [L(-1.45, 0.3, -0.55, 0.3, 'accent', 1), L(0.55, 0.3, 1.45, 0.3, 'accent', 1), T(0, 2.5, 'chloroplast: double membrane', 'green', 10, 'center'), T(-2.0, -1.2, 'granum', 'accent', 10, 'center'),
       T(0, -2.5, 'stroma (Calvin cycle)  ·  thylakoids (light reactions)', 'dim', 10, 'center'), C(3.0, -0.6, 0.22, 'gold', 'gold', alpha=0.5), T(3.0, -1.0, 'starch', 'gold', 9, 'center')]
geo('bio_chloroplasts_plastids', 'Thylakoid membranes stack into grana inside a stroma; light reactions occur in the stacks and the Calvin cycle in the stroma. Other plastids store starch or pigments.',
    [-4.6, 4.6, -2.9, 2.9], cp, aspect=0.6)
table('bio_cell_wall_ecm', 'Each kingdom builds its outside layer from a different polymer; animal cells instead secrete a flexible extracellular matrix.',
      ['Group', 'Material', 'Role'],
      [['Plants', 'cellulose', 'rigid wall'], ['Fungi', 'chitin', 'tough wall'], ['Bacteria', 'peptidoglycan', 'resists lysis'], ['Archaea', 'S-layer', 'shape'], ['Animals', 'collagen', 'ECM scaffold']], aspect=0.7)
hub('bio_cell_junctions', 'Four main junctions between animal cells: seal the sheet, anchor to neighbours, link to the skeleton, or open channels for sharing small molecules.',
    'Cell junctions', ['Tight (seal)', 'Adherens (actin)', 'Desmosome (keratin)', 'Gap (1.5 nm pore)'], colors=['accent', 'gold', 'green', 'pink'], aspect=0.8)
kin = [Rc(-4.5, -0.3, 9, 0.6, 'accent', 'accent', 0.3, 2), T(0, -0.9, 'microtubule (+ end at right)', 'accent', 10, 'center'),
       Rc(-4.5, -1.9, 9, 0.5, 'dim', 'dim', 0.0), L('-4.5+(v*t*0.004)%9', 0.55, '-4.5+(v*t*0.004)%9', 1.4, 'gold', 2), C('-4.5+(v*t*0.004)%9', 1.8, 0.4, 'pink', 'pink', alpha=0.8), T('-4.5+(v*t*0.004)%9', 1.8, 'cargo', 'white', 8, 'center'),
       C('-4.5+(v*t*0.004)%9-0.15', 0.45, 0.18, 'gold', 'gold'), C('-4.5+(v*t*0.004)%9+0.15', 0.45, 0.18, 'gold', 'gold'), T('-4.5+(v*t*0.004)%9', 1.2, '', 'gold', 8),
       L('4.5-(v*t*0.002)%9', -0.4, '4.5-(v*t*0.002)%9', -1.2, 'green', 2), C('4.5-(v*t*0.002)%9', -1.5, 0.35, 'green', 'green', alpha=0.8), T('4.5-(v*t*0.002)%9', -1.5, 'dynein', 'white', 8, 'center'),
       T(-4.0, 2.6, 'kinesin → + end', 'gold', 10), T(4.6, -2.5, 'dynein → − end', 'green', 10, 'right')]
kin = [x for x in kin if x.get('text') != '']
geo('bio_microtubules_motors', 'Kinesin walks cargo toward the + end in 8 nm steps, and dynein walks the other way. Lower the ATP slider and the motors slow down (Michaelis–Menten).',
    [-4.8, 4.8, -3.0, 3.0], kin, params=[P('atp', 'ATP', 5, 1000, 1000, 'µM')], readouts=[R('kinesin speed', '800*atp/(50+atp)', 'nm/s'), R('steps per second', '100*atp/(50+atp)')], aspect=0.6)
S['bio_microtubules_motors']['shapes'] = json_ = [json_ for json_ in S['bio_microtubules_motors']['shapes']]
for sh_ in S['bio_microtubules_motors']['shapes']:
    for k_, v_ in list(sh_.items()):
        if isinstance(v_, str): sh_[k_] = v_.replace('v*t', '(800*atp/(50+atp))*t')
bars('bio_actin_intermediate', 'The three filament systems differ in thickness and job: thin actin for shape and movement, mid-sized intermediate filaments for mechanical strength, thick microtubules for tracks.',
     [('actin', 7, 'accent'), ('intermediate', 10, 'gold'), ('microtubule', 25, 'pink')], ylabel='filament diameter (nm)', aspect=0.7)
chain('bio_signaling_overview', 'A signal is received, relayed through a chain of molecules and answered; each relay step amplifies. Change how many molecules each step activates.',
      ['Ligand', 'Receptor', 'Relay (kinases)', 'Amplified signal', 'Response'], per_row=3, colors=['pink', 'accent', 'gold', 'gold', 'green'],
      params=[P('m', 'molecules per step', 2, 50, 10, step=1), P('k', 'relay steps', 1, 4, 3, step=1)], readouts=[R('molecules activated', 'm^k')], aspect=0.7)
chain('bio_gpcr_signaling', 'A ligand activates a GPCR, which swaps GDP for GTP on a G protein; the G protein turns on adenylyl cyclase to make cAMP, which activates PKA. GTP hydrolysis turns it off.',
      ['Ligand', 'GPCR', 'G protein (GTP)', 'Adenylyl cyclase', 'cAMP', 'PKA → response'], per_row=3, colors=['pink', 'accent', 'gold', 'gold', 'green', 'green'], aspect=0.62)
chain('bio_rtk_cascades', 'Growth factor binding dimerises the receptor, which phosphorylates itself; adaptor proteins switch on Ras, and a three-kinase cascade (Raf, MEK, ERK) carries the message to the nucleus.',
      ['Growth factor', 'RTK dimer (P)', 'Grb2 / SOS', 'Ras-GTP', 'Raf → MEK → ERK', 'Gene transcription'], per_row=3, colors=['pink', 'accent', 'accent', 'gold', 'gold', 'green'], aspect=0.62)
plot('bio_second_messengers', 'Calcium signals are spikes: resting ≈ 100 nM jumps ~10-fold then is pumped back. A stronger stimulus makes the cell spike more often (frequency coding).',
     [F('0.1+0.9*(1-exp(-mod(x,P)/0.3))*exp(-mod(x,P)/2.0)/0.72', '[Ca²⁺] (µM)', 'accent')], x=[0, 60], y=[0, 1.3], xlabel='time (s)', ylabel='cytosolic Ca²⁺ (µM)',
     params=[P('P', 'spike interval (weaker ← → stronger)', 4, 30, 12, 's')], hlines=[dict(y=0.1, label='resting 0.1 µM')], readouts=[R('spike frequency', '60/P', 'per min')])
chain('bio_nuclear_receptors', 'Steroid hormones are lipid-soluble: they cross the membrane, bind a receptor that moves to the nucleus, and the receptor then switches genes on at hormone response elements.',
      ['Steroid hormone', 'Crosses membrane', 'Binds receptor', 'Receptor dimer to nucleus', 'Binds DNA (HRE)', 'New mRNA / protein'], per_row=3, colors=['pink', 'dim', 'accent', 'accent', 'gold', 'green'], aspect=0.62)
# cell cycle
cc = []
segs = [('G1', 'G1', 'accent'), ('S', 'S', 'gold'), ('G2', 'G2', 'green'), ('M', 'M', 'pink')]
tot = '(G1+S+G2+M)'
a0 = ['0', 'G1', 'G1+S', 'G1+S+G2']; a1 = ['G1', 'G1+S', 'G1+S+G2', 'G1+S+G2+M']
for (nm, _, col_), s0, s1 in zip(segs, a0, a1):
    cc.append(dict(k='arc', x=0, y=0, r=1.7, a0='pi/2-2*pi*(%s)/%s' % (s1, tot), a1='pi/2-2*pi*(%s)/%s' % (s0, tot), color=col_, width=14))
    cc.append(T('1.7*cos(pi/2-pi*((%s)+(%s))/%s)*1.0' % (s0, s1, tot), '1.7*sin(pi/2-pi*((%s)+(%s))/%s)*1.0' % (s0, s1, tot), nm, 'white', 11, 'center'))
cc += [C('1.7*cos(pi/2-2*pi*((t*3)%{0})/{0})'.format(tot), '1.7*sin(pi/2-2*pi*((t*3)%{0})/{0})'.format(tot), 0.18, 'white', 'white'), T(0, 0.15, '{G1+S+G2+M} h', 'gold', 14, 'center'), T(0, -0.3, 'cycle time', 'dim', 10, 'center')]
geo('bio_cell_cycle', 'The cycle has four phases: G1 (grow), S (copy DNA), G2 (prepare), M (divide). Most of the difference between fast- and slow-dividing cells is in G1; slide it.',
    [-2.5, 2.5, -2.3, 2.3], cc, params=[P('G1', 'G1', 1, 20, 11, 'h', 0.5), P('S', 'S', 6, 10, 8, 'h', 0.5), P('G2', 'G2', 2, 6, 4, 'h', 0.5), P('M', 'M', 0.5, 1.5, 1, 'h', 0.5)],
    readouts=[R('fraction in interphase', '(G1+S+G2)/(G1+S+G2+M)*100', '%')], aspect=0.9)
plot('bio_cell_cycle_control', 'Cyclins rise and fall in sequence, switching on CDKs that push the cycle forward. Raise DNA damage and p53 blocks the later cyclins, arresting the cell.',
     [F('1.0*exp(-((x-5)/1.8)^2)', 'cyclin D (G1)', 'accent'), F('(1-0.9*dmg)*exp(-((x-10)/1.2)^2)', 'cyclin E (G1/S)', 'gold'), F('(1-0.9*dmg)*exp(-((x-16)/2.5)^2)', 'cyclin A (S/G2)', 'green'), F('(1-0.9*dmg)*exp(-((x-22.5)/1.0)^2)', 'cyclin B (M)', 'pink')],
     x=[0, 24], y=[0, 1.1], xlabel='time in cycle (h)', ylabel='relative cyclin level', params=[P('dmg', 'DNA damage', 0, 1, 0, step=0.05)],
     readouts=[R('cyclin B at mitosis', '(1-0.9*dmg)*100', '%')])
chain('bio_cytokinesis_prokaryotic_division', 'In binary fission the cell elongates, copies its DNA, and a ring of FtsZ constricts the middle until two identical cells separate; animal cells use an actin–myosin ring instead.',
      ['Elongate + copy DNA', 'FtsZ ring forms', 'Septum constricts', 'Two daughter cells'], per_row=2, colors=['accent', 'gold', 'gold', 'green'], aspect=0.9)
blocks('bio_apoptosis', 'Intrinsic (mitochondrial) and extrinsic (death-receptor) pathways converge on executioner caspases, which dismantle the cell neatly so neighbours aren\'t harmed.',
       [('d', 'DNA damage', 12, 10, 'pink'), ('mt', 'Cyt c release', 12, 40), ('c9', 'Caspase-9', 12, 70), ('f', 'Fas ligand', 85, 10, 'pink'), ('dr', 'Death receptor', 85, 40), ('c8', 'Caspase-8', 85, 70), ('c3', 'Caspase-3', 48, 90, 'gold'), ('e', 'Cell shrinks, phagocytosed', 48, 100, 'green')],
       [('d', 'mt'), ('mt', 'c9', 'apoptosome'), ('c9', 'c3'), ('f', 'dr'), ('dr', 'c8'), ('c8', 'c3')], aspect=0.7)
S['bio_apoptosis']['nodes'] = [n for n in S['bio_apoptosis']['nodes'] if n['id'] != 'e']
tree('bio_stem_cells_differentiation', 'Potency narrows as cells specialise: the zygote can make everything, embryonic stem cells any body cell, adult stem cells only their tissue\'s cell types.',
     [('z', 'Zygote'), ('es', 'Pluripotent ESC'), ('ec', 'Ectoderm'), ('me', 'Mesoderm'), ('en', 'Endoderm'), ('n', 'Neuron'), ('m', 'Muscle'), ('b', 'Blood'), ('g', 'Gut')],
     [('z', 'es'), ('es', 'ec'), ('es', 'me'), ('es', 'en'), ('ec', 'n'), ('me', 'm'), ('me', 'b'), ('en', 'g')], aspect=0.8)
plot('bio_telomeres_senescence', 'Telomeres shorten with each division until they hit a critical length and the cell stops (the Hayflick limit). Active telomerase slows the loss.',
     [F('max(0,L0-loss*x*(1-tel)/1000)', 'telomere length (kb)', 'accent')], x=[0, 120], y=[0, 12], xlabel='cell divisions', ylabel='telomere length (kb)', hlines=[dict(y=5, label='critical ~5 kb')],
     params=[P('L0', 'starting length', 8, 12, 10, 'kb', 0.5), P('loss', 'loss per division', 30, 150, 70, 'bp'), P('tel', 'telomerase activity', 0, 1, 0, step=0.05)],
     readouts=[R('divisions to senescence', 'tel>=0.99 ? 999 : (L0-5)*1000/(loss*(1-tel))')])
