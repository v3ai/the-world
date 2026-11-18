from lib import *
import math
S = {}

# ---- neuron ----
sh = [ell(-3.3, 0.4, 0.75, 0.7, 'accent', 'accent', 0.25, 0, 2), ell(-3.3, 0.4, 0.3, 0.3, 'gold', 'gold', 0.5)]
for (x, y, bx, by) in [(-4.7, 1.8, -4.1, 1.4), (-4.9, 0.6, -4.1, 0.55), (-4.5, -1.0, -3.9, -0.4), (-3.5, -2.0, -3.4, -0.3), (-3.0, 2.2, -3.2, 1.0)]:
    sh.append(line(-3.3 + (bx + 3.3) * 0.5, 0.4 + (by - 0.4) * 0.5, x, y, 'accent', 2))
    sh.append(line((x + -3.3) / 2, (y + 0.4) / 2, x + 0.25, y + 0.35, 'accent', 1.5))
sh.append(line(-2.55, 0.4, 3.0, 0.4, 'accent', 2))
for i in range(5):
    sh.append(rect(-1.9 + i * 1.0, 0.27, 0.8, 0.26, 'gold', 'gold', 0.55, 1))
for (x, y) in [(3.6, 1.2), (3.8, 0.4), (3.6, -0.5)]:
    sh.append(line(3.0, 0.4, x, y, 'accent', 2)); sh.append(circ(x + 0.12, y, 0.12, 'pink', 'pink'))
sh += [pt('-2.55+mod(t*0.8,1)*5.5', 0.4, 'white', 6), circ('-2.55+mod(t*0.8,1)*5.5', 0.4, 0.28, 'white', None, 0.5)]
sh += [text(-3.9, 2.85, 'dendrites', 'accent', 10), text(-3.3, -0.9, 'soma', 'accent', 10), text(-0.6, 1.1, 'axon (up to 1 m)', 'accent', 10), text(0.5, -0.35, 'myelin sheath', 'gold', 10), text(3.7, -1.4, 'terminals', 'pink', 10),
       text(0, -2.6, 'spike (white dot) travels the axon', 'dim', 10)]
S['neuron'] = geo(sh, 'Dendrites collect signals, the soma integrates them, and the axon sends a spike to terminals that release transmitter. The brain has about 86 billion such cells.', (-5.3, 5.3, -3.0, 3.2))

# ---- astrocyte ----
sh = [rect(-4.8, -3.0, 9.6, 0.7, 'red', 'red', 0.18, 1), line(-4.8, -2.3, 4.8, -2.3, 'red', 2), line(-4.8, -3.0, 4.8, -3.0, 'red', 2), ell(-1.5, -2.65, 0.28, 0.2, 'red', 'red', 0.8), ell(1.9, -2.65, 0.28, 0.2, 'red', 'red', 0.8)]
for k in range(8):
    a = math.radians(22 + 45 * k)
    ex, ey = 2.5 * math.cos(a), 1.6 * math.sin(a) + 0.2
    sh.append(line(0, 0.2, ex, ey, 'purple', 3))
    sh.append(line(ex, ey, ex + 0.45 * math.cos(a + 0.8), ey + 0.45 * math.sin(a + 0.8), 'purple', 2))
    sh.append(line(ex, ey, ex + 0.45 * math.cos(a - 0.8), ey + 0.45 * math.sin(a - 0.8), 'purple', 2))
sh.append(line(0, 0.2, -1.3, -2.3, 'purple', 4)); sh.append(line(0, 0.2, 1.9, -2.3, 'purple', 4))
sh += [ell(0, 0.2, 0.6, 0.55, 'purple', 'purple', 0.45), circ(0, 0.2, 0.22, 'white', 'white', 0.5)]
for x in (-4.2, -3.0, 3.1, 4.3):
    sh.append(circ(x, 1.9 if x < 0 else 1.6, 0.35, 'accent', 'accent', 0.3))
sh += [text(0, 0.95, 'astrocyte', 'purple', 11), text(-3.6, 2.75, 'neurons', 'accent', 10), text(0, -1.5, 'end-feet', 'purple', 10), text(0, -3.3, 'capillary (blood-brain barrier)', 'red', 10),
       text(3.6, 0.2, 'wraps synapses', 'purple', 10, 'center')]
S['astrocyte'] = geo(sh, 'Each star-shaped astrocyte touches thousands to hundreds of thousands of synapses with one set of arms and a capillary with its end-feet, passing nutrients to neurons and mopping up excess K+ and glutamate.', (-5.3, 5.3, -3.6, 3.2))

# ---- red blood cell: oxygen binding ----
S['red_blood_cell'] = plot([fn('100*x^2.7/(P50^2.7+x^2.7)', 'hemoglobin saturation (%)', 'pink')], [0, 120], [0, 105],
    'Each biconcave red cell (7.5 µm wide, about 270 million hemoglobins) loads oxygen in the lungs (PO2 about 100) and unloads it in tissue (about 40). Acid, CO2 or heat shift the curve right so more O2 is released; try it.',
    'oxygen pressure PO2 (mmHg)', '% saturated', [P('P50', 'PO2 for 50% saturation', 18, 40, 27, 'mmHg')], [R('saturation in lung (100)', '100*100^2.7/(P50^2.7+100^2.7)', '%'), R('saturation in tissue (40)', '100*40^2.7/(P50^2.7+40^2.7)', '%')],
    points=[{'x': 100, 'y': '100*100^2.7/(P50^2.7+100^2.7)', 'label': 'lungs'}, {'x': 40, 'y': '100*40^2.7/(P50^2.7+40^2.7)', 'label': 'tissue'}])

S['neutrophil'] = flow(['rolls on vessel', 'sticks and squeezes', 'follows chemicals', 'engulfs bacteria', 'oxidative burst', 'dies as pus'],
    'Neutrophils (about 60% of white cells, 10-12 µm, multilobed nucleus) arrive first at an infection, within an hour, following chemical trails and killing germs with enzymes and reactive oxygen. They live only about a day.', cols=2, colors={3: 'gold', 4: 'red'})
S['macrophage'] = flow(['engulfs germ', 'phagosome forms', 'lysosome fuses', 'germ digested', 'shows antigen', 'calls T cells'],
    'Macrophages are the clean-up and alarm cells: they digest what they swallow, then display fragments on their surface so T cells can recognise the invader. They can live for months.', cols=2, colors={4: 'gold', 5: 'pink'})
# cardiomyocyte AP
APc = pw([(0, -85), (0.01, -85), (2, 30), (4, 20), (8, 8), (60, 10), (200, 5), (240, -20), (270, -70), (290, -85), (400, -85)], dense=4)
S['cardiomyocyte'] = plot([fn(APc.replace('x', 'x'), 'membrane voltage (mV)', 'pink'), fn('-85+120*(x>0)*(x/90)*exp(1-x/90)*(x<400)', 'contraction (scaled)', 'gold', dash=True)], [-20, 400], [-100, 45],
    'Unlike a nerve spike (about 2 ms), the heart-cell action potential has a 200-300 ms plateau held up by calcium entry. The plateau makes the contraction long (dashed) and prevents tetanus, so the heart can refill.',
    'time (ms)', 'mV', hlines=[{'y': -85, 'label': 'rest -85'}])
S['cardiomyocyte']['fns'][0]['f'] = f'(x>=0)*({APc})+(x<0)*(-85)'
# skeletal fiber force-length
FL = 'L<1.27?0:(L<1.67?(L-1.27)/0.4*0.84:(L<2.0?0.84+(L-1.67)/0.33*0.16:(L<2.25?1:(L<3.65?(3.65-L)/1.4:0))))'
S['skeletal_muscle_fiber'] = plot([fn(FL.replace('L', 'x'), 'active force', 'pink')], [1, 4], [0, 1.15],
    'A fiber is strongest near its resting sarcomere length of about 2.2 µm, where thick and thin filaments overlap best. Stretched or squashed too far, they cannot pull. Slide the length.',
    'sarcomere length (µm)', 'relative force', [P('L', 'sarcomere length', 1.2, 3.8, 2.2, 'µm')], [R('force', FL, 'of max')], points=[{'x': 'L', 'y': FL, 'label': ''}])
S['smooth_muscle_cell'] = flow(['Ca2+ rises', 'binds calmodulin', 'MLCK turns on', 'myosin P added', 'slow cross-bridges', 'sustained tension'],
    'Smooth muscle cells are spindle-shaped (about 5 µm wide, 200 µm long). They contract by a chemical cascade rather than the rapid trigger of skeletal muscle, which lets them hold tension for long periods at low energy cost.', cols=2, colors={0: 'gold'})
sh = [rect(-0.9, -2.4, 1.8, 4.0, 'accent', 'accent', 0.18, 2), ell(0, -1.4, 0.55, 0.5, 'gold', 'gold', 0.5)]
for i in range(9):
    sh.append(rect(-0.8 + i * 0.2, 1.6, 0.08, 0.8, 'accent', 'accent', 0.8, 1))
sh += [text(0, 2.75, 'brush border: ~1000 microvilli', 'accent', 10), text(0, -1.4, 'nucleus', 'gold', 9), arrow(-2.3, 2.6, -1.0, 1.6, 'green', 2), text(-3.3, 2.0, 'glucose + Na+', 'green', 10),
       text(0.0, 0.2, 'mitochondria, ATP', 'dim', 9), line(-0.9, 1.5, -0.9, 1.7, 'white', 5), line(0.9, 1.5, 0.9, 1.7, 'white', 5), text(2.6, 1.5, 'tight junction', 'white', 10), line(1.5, 1.5, 0.95, 1.6, 'dim', 1),
       arrow(0.5, -2.4, 0.5, -3.1, 'green', 2), text(1.6, -2.8, 'to blood (GLUT2)', 'green', 10), text(-2.7, -1.5, 'Na/K pump keeps\nNa+ low', 'dim', 9)]
sh[-1]['text'] = 'Na/K pump on the base'
S['enterocyte'] = geo(sh, 'Nutrients are taken up across the brush border (a sodium-linked transporter pulls glucose in) and leave through the cell base into the blood. Tight junctions keep the gut contents out.', (-4.5, 4.5, -3.4, 3.3))
S['osteocyte'] = flow(['bone is loaded', 'fluid flows in canaliculi', 'osteocyte senses strain', 'sends signals (sclerostin, RANKL)', 'osteoblasts and osteoclasts respond'],
    'Osteocytes make up about 90-95% of bone cells. Each sits in a tiny cavity and reaches neighbours through thin channels, acting as the bone\'s strain sensors that tell it where to add or remove material.', cols=1, colors={2: 'gold'})
S['osteoblast'] = flow(['stem cell matures', 'secretes collagen (osteoid)', 'adds calcium phosphate', 'bone hardens', 'becomes osteocyte or lining cell'],
    'Osteoblasts build bone: they lay down collagen and then trigger mineral (hydroxyapatite) crystals to form. About 10-20% become buried as osteocytes.', cols=1, colors={1: 'gold'})
S['osteoclast'] = flow(['attaches to bone', 'seals a pit', 'pumps in acid (pH ~4.5)', 'enzymes cut collagen', 'releases calcium to blood'],
    'Osteoclasts are large, multinucleated cells that dissolve bone: acid removes the mineral and enzymes (cathepsin K) digest the collagen. They work together with osteoblasts to renew the skeleton.', cols=1, colors={2: 'red'})
S['chondrocyte'] = flow(['joint moves, fluid squeezed', 'nutrients diffuse in', 'chondrocyte in lacuna', 'makes collagen II + aggrecan', 'matrix stays springy'],
    'Cartilage has no blood vessels, so its cells (chondrocytes) feed by diffusion from joint fluid, and movement pumps fluid through the matrix. That is why cartilage heals slowly.', cols=1, colors={2: 'gold'})
S['keratinocyte'] = flow(['basal layer divides (day 0)', 'spinous layer, joined', 'granular layer, keratin', 'dies, flat, about day 14', 'shed from surface (~day 28)'],
    'Keratinocytes make up about 90% of the epidermis. They are born at the base, fill with keratin and die as they climb to the surface over roughly four weeks, where they form the waterproof outer layer.', cols=1, colors={3: 'orange'})
S['fibroblast'] = flow(['tissue is wounded', 'activated', 'divides, migrates', 'makes collagen', 'contracts the wound', 'scar remodels'],
    'Fibroblasts are the connective-tissue builders: after an injury they multiply, lay down collagen and pull the wound edges together. Too much activity leaves a scar.', cols=2, colors={3: 'gold'})
# sperm
sh = [curve('-3.4+s', '0.5*sin(1.6*s-f*t)*min(s/2.5,1)', [0, 8.2], 'pink', 3), ell(-3.95, 0, 0.6, 0.38, 'gold', 'gold', 0.6), ell(-4.3, 0, 0.22, 0.34, 'accent', 'accent', 0.8),
      rect(-3.4, -0.12, 0.8, 0.24, 'green', 'green', 0.8, 1),
      text(-3.9, 1.3, 'head: DNA\n(23 chromosomes)', 'gold', 10), text(-2.8, -1.1, 'midpiece:', 'green', 10, 'left'), text(2.0, 1.5, 'tail (flagellum) ~50 µm', 'pink', 10), text(-4.3, 0.75, 'acrosome', 'accent', 9, 'left')]
sh[4]['text'] = 'head: DNA'; sh[5]['text'] = 'mitochondria'; sh[5]['x'] = -2.1; sh[5]['y'] = -0.9; sh[5]['align'] = 'center'
S['sperm'] = geo(sh, 'A sperm is a swimmer: the head carries half a set of chromosomes (and an enzyme cap, the acrosome), the midpiece\'s mitochondria power the tail, which beats about 10-15 times a second to reach about 3 mm per minute.', (-5, 5, -2.2, 2.2),
    params=[P('f', 'tail beat (shown slowed)', 2, 10, 5, '')])
# egg
sh = [circ(0, 0, 2.5, 'orange', 'orange', 0.1, 1.5), circ(0, 0, 2.1, 'gold', 'gold', 0.22, 2), circ(0, 0, 1.8, 'pink', 'pink', 0.3, 2), circ(-0.5, 0.3, 0.45, 'white', 'white', 0.4)]
for k in range(10):
    a = 2 * math.pi * k / 10
    sh.append(circ(2.45 * math.cos(a), 2.45 * math.sin(a), 0.2, 'orange', 'orange', 0.45))
    a2 = 2 * math.pi * (k + 0.5) / 10
    sh.append(circ(1.62 * math.cos(a2), 1.62 * math.sin(a2), 0.07, 'accent', 'accent', 0.9))
sh += [text(-0.5, 0.3, 'nucleus', 'white', 9), text(3.0, 1.6, 'corona radiata', 'orange', 10, 'left'), text(3.0, 0.6, 'zona pellucida', 'gold', 10, 'left'),
       text(3.0, -0.4, 'cytoplasm, 120 µm', 'pink', 10, 'left'), text(3.0, -0.9, '(largest human cell)', 'pink', 10, 'left'), text(3.0, -1.7, 'cortical granules', 'accent', 10, 'left')]
S['egg_cell'] = geo(sh, 'The egg is about 0.12 mm across, visible to the naked eye, and wrapped in layers. A sperm must cross the helper cells and zona; contact triggers the cortical granules to harden the coat so only one sperm enters.', (-3, 7.2, -3.0, 3.0))
S['beta_cell'] = plot([fn('100*x^4/(8^4+x^4)', 'insulin secretion (% of max)', 'gold')], [2, 20], [0, 105],
    'Beta cells sense glucose directly: more glucose means more ATP inside, which closes K+ channels, opens calcium channels and releases insulin. Secretion switches on steeply above the fasting level of about 5 mM. Slide the blood glucose.',
    'blood glucose (mM)', '% of maximum', [P('g', 'blood glucose', 2, 20, 5, 'mM')], [R('insulin release', '100*g^4/(8^4+g^4)', '% of max'), R('in mg/dL', 'g*18', 'mg/dL')], points=[{'x': 'g', 'y': '100*g^4/(8^4+g^4)', 'label': ''}], vlines=[{'x': 5, 'label': 'fasting'}])

# ---- organelles ----
S['nucleus'] = bars([('nucleus', 6, 'accent'), ('cell', 20, 'gold'), ('DNA, stretched', 2000000, 'pink')],
    'A human cell\'s DNA is about 2 m long (6 billion base pairs) but is coiled around histones into a nucleus only 6 µm wide: a compaction of about 300,000 times.', ylabel='length (µm, log)', logy=True)
sh = [ell(0, 0, 3.7, 1.9, 'orange', 'orange', 0.14, 0, 2.5), ell(0, 0, 3.35, 1.6, 'accent', 'accent', 0.12, 0, 2)]
for i in range(5):
    x = -2.4 + i * 1.2
    if i % 2 == 0: sh.append(line(x, 1.55, x, 0.2, 'accent', 3))
    else: sh.append(line(x, -1.55, x, -0.2, 'accent', 3))
sh.append(line(-3.1, -0.0, 3.1, 0.0, 'dim', 1, True, alpha=0.0))
for i in range(6):
    sh.append(pt(f'-2.8+mod(t*0.5+{i/6},1)*5.6', f'-0.6+0.25*sin({i}+t)', 'white', 3, when=None))
for i in range(3):
    sh.append(rect(-1.2 + i * 1.2 - 0.12, 1.5, 0.24, 0.1, 'gold', 'gold', 0.9, 1))
sh += [text(-2.9, 2.5, 'outer membrane', 'orange', 10, 'left'), text(2.0, -2.5, 'inner membrane: cristae', 'accent', 10), text(0, 0.9, 'matrix (Krebs cycle)', 'white', 10), text(0, 2.0, 'intermembrane space', 'dim', 9),
       text(0.0, -2.9, 'protons pumped out (dots) flow back through ATP synthase', 'gold', 10)]
sh[-1] = text(-0.1, -3.1, 'ATP synthase (gold) turns the proton flow into ATP', 'gold', 10)
S['mitochondrion'] = geo(sh, 'The electron-transport chain pumps protons across the inner membrane; their return flow through ATP synthase makes about 90% of the cell\'s ATP (roughly 26-28 of the ~30 per glucose). Folding into cristae increases the area.', (-4.2, 4.2, -3.5, 3.0))
S['mitochondrion']['shapes'] = [x for x in S['mitochondrion']['shapes'] if not (x['k'] == 'line' and x.get('alpha') == 0.0)]
S['ribosome'] = plot([fn('x/5/60', 'eukaryote, 5 aa/s (min)', 'accent'), fn('x/20/60', 'bacterium, 20 aa/s (min)', 'gold')], [0, 1000], [0, 3.5],
    'A ribosome adds amino acids one at a time (about 5 per second in human cells, 20 in bacteria). An average 400-amino-acid protein takes about 80 seconds; the 34,000-amino-acid giant titin takes about two hours.',
    'protein length (amino acids)', 'minutes to build', [P('n', 'protein length', 50, 1000, 400, 'aa')], [R('human ribosome', 'n/5', 's'), R('bacterial ribosome', 'n/20', 's')], points=[{'x': 'n', 'y': 'n/5/60', 'label': ''}])
S['endoplasmic_reticulum'] = flow(['ribosome on rough ER', 'protein enters ER lumen', 'folds and is checked', 'vesicle buds off', 'moves to Golgi'],
    'The rough ER (studded with ribosomes) makes proteins for export and membranes; the smooth ER makes lipids and stores calcium. About a third of all proteins pass through it.', cols=1, colors={2: 'gold'})
S['golgi_apparatus'] = flow(['vesicle arrives', 'sugars trimmed', 'proteins sorted', 'to lysosomes', 'to the cell surface', 'secreted out'],
    'The Golgi is the cell\'s post office: proteins are tagged with sugars and address labels as they move through the stack, then packaged in vesicles bound for the membrane, lysosomes or secretion.', cols=2, colors={2: 'gold'})
S['peroxisome'] = flow(['long fatty acids', 'beta-oxidation', 'makes H2O2', 'catalase', 'H2O2 to H2O + O2', 'acetyl-CoA exported'],
    'Peroxisomes break down very long fatty acids and some toxins. They make hydrogen peroxide as a by-product, then safely split it with catalase, one of the fastest enzymes known (millions of reactions per second).', cols=2, colors={2: 'red', 3: 'gold'})
S['cell_membrane'] = plot([fn('61.5*log10((x+b*145)/(140+b*12))', 'resting membrane voltage (mV)', 'accent')], [1, 20], [-110, 0],
    'The membrane voltage comes from unequal ion concentrations and selective leaks. Outside K+ is normally about 4 mM; raise it (hyperkalemia) and the cell depolarizes. More Na+ leak (higher b) also pulls it toward zero.',
    'outside K+ concentration (mM)', 'mV', [P('b', 'Na+ vs K+ permeability', 0, 0.1, 0.04, ''), P('K', 'outside K+', 1, 20, 4, 'mM')], [R('resting voltage', '61.5*log10((K+b*145)/(140+b*12))', 'mV')], points=[{'x': 'K', 'y': '61.5*log10((K+b*145)/(140+b*12))', 'label': ''}])
S['cytoskeleton'] = bars([('actin', 7, 'accent'), ('intermediate', 10, 'gold'), ('microtubule', 25, 'pink')],
    'Three filament systems give a cell its shape: thin actin (7 nm) for movement and the cell cortex, ropelike intermediate filaments (10 nm) for strength, and hollow microtubules (25 nm) that act as rails for motor proteins moving cargo at about 1 µm per second.', ylabel='filament diameter (nm)')
LS_ = '(2.4+0.7*sin(1.2*t))'
sh = []
for sgn in (-1, 1):
    sh.append(line(f'{sgn}*{LS_}/2', -1.3, f'{sgn}*{LS_}/2', 1.3, 'white', 4))
    for y in (0.85, 0.0, -0.85):
        if sgn < 0: sh.append(rect(f'-{LS_}/2', y - 0.05, 1.0, 0.1, 'accent', 'accent', 0.9, 1))
        else: sh.append(rect(f'{LS_}/2-1.0', y - 0.05, 1.0, 0.1, 'accent', 'accent', 0.9, 1))
for y in (0.42, -0.42):
    sh.append(rect(-0.8, y - 0.11, 1.6, 0.22, 'pink', 'pink', 0.85, 1))
sh += [text(f'-{LS_}/2', 1.55, 'Z', 'white', 11), text(f'{LS_}/2', 1.55, 'Z', 'white', 11), text(0, -1.6, 'myosin (thick) pulls actin (thin) toward the center', 'dim', 10),
       text(-2.2, -1.1, 'actin', 'accent', 10), text(0, 0.0, 'A band: 1.6 µm', 'white', 9, when=None)]
sh.pop()
S['sarcomere'] = geo(sh, 'Filaments do not shorten; they slide. Z discs (white) are pulled together as myosin heads walk along actin, so the sarcomere shortens from about 2.6 to 1.8 µm. Thousands in a row make a muscle shorten.', (-2.9, 2.9, -1.9, 1.9),
    readouts=[R('sarcomere length', LS_, 'µm'), R('relative force', FL.replace('L', LS_), 'of max')])
S['muscle_contraction'] = flow(['Ca2+ frees actin sites', 'myosin head binds', 'power stroke pulls actin', 'ATP binds, head lets go', 'ATP split, head re-cocks'],
    'Each cycle moves the thin filament about 10 nm and costs one ATP. A muscle runs this cycle in millions of heads at once. Without ATP the heads stay locked (rigor mortis).', cols=1, colors={2: 'gold'}, extra=[(4, 1, 'repeat')])
S['cellular_respiration'] = flow(['glucose', 'glycolysis (2 ATP)', 'pyruvate', 'Krebs cycle (2 ATP)', 'electron transport', 'about 26-28 ATP'],
    'Burning one glucose with oxygen yields about 30 ATP, 15 times more than glycolysis alone. Cut off the oxygen and the cell is left with just the 2 ATP from glycolysis.', cols=2, colors={4: 'gold', 5: 'green'})
S['protein_synthesis'] = flow(['DNA gene', 'transcription: mRNA', 'mRNA leaves nucleus', 'ribosome reads', 'amino acids added', 'folded protein'],
    'DNA is copied to mRNA (about 50 bases per second), then a ribosome reads it three bases at a time, adding one amino acid per codon (about 5 per second).', cols=2, colors={1: 'accent', 3: 'gold'})
S['mitosis'] = flow(['interphase: DNA copied', 'prophase: chromosomes condense', 'metaphase: line up', 'anaphase: pulled apart', 'telophase: two nuclei', 'cytokinesis: two cells'],
    'Mitosis itself takes only about an hour of a roughly 24-hour cell cycle. Each daughter cell receives an identical set of 46 chromosomes.', cols=1, colors={3: 'gold'}, extra=[(5, 0, 'next cycle')])
