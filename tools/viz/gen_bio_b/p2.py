from lib import *
import math

# ---------------- PLANTS ----------------
hub('bio_plants', 'A plant is a system of organs that work together: roots take up water and minerals, leaves make sugar, and the vascular system links them while hormones coordinate growth.',
    'Plant', ['Roots', 'Shoot and leaves', 'Water transport', 'Photosynthesis', 'Hormones', 'Reproduction'],
    colors=['orange', 'green', 'blue', 'gold', 'purple', 'pink'], aspect=0.85)

hub('bio_plant_body_tissues', 'Every plant organ is built from three tissue systems that run through root, stem and leaf: dermal (skin), ground (fills and stores) and vascular (xylem and phloem), grown from meristems at the tips.',
    'Plant body', ['Dermal', 'Ground', 'Vascular', 'Meristems'],
    colors=['accent', 'green', 'blue', 'gold'], aspect=0.8)

geo('bio_leaf_structure_gas_exchange', 'In a leaf cross-section, CO₂ enters and water vapour leaves through stomata. Open the stomata and gas flows; close them and water is saved but photosynthesis slows.',
    [0, 100, 0, 62],
    [Rc(4, 52, 92, 3, 'dim', 'dim', .7), Rc(4, 47, 92, 5, 'green', 'green', .35),
     Rc(4, 34, 92, 13, 'green', 'green', .45), Rc(4, 15, 92, 19, 'accent', 'accent', .15), Rc(4, 11, 92, 4, 'green', 'green', .3),
     Rc(30, 11, 'sg', 4, None, '#0a0e17', 1),
     C(30 - 0, 13, 2.5, 'gold', 'gold'), C(30 + 0, 13, 2.5, 'gold', 'gold'),
     T(7, 58, 'cuticle', 'dim', 10, 'left'), T(7, 49, 'upper epidermis', 'white', 10, 'left'), T(7, 40, 'palisade (light capture)', 'white', 10, 'left'),
     T(7, 24, 'spongy mesophyll (air spaces)', 'white', 10, 'left'), T(60, 8, 'lower epidermis + stomata', 'white', 10, 'left'),
     A(24, 4, 24, '12+sg*0', 'accent', 2, when='g>0.15'), T(12, 1.5, 'CO₂ in', 'accent', 10, 'left'),
     A(36, 12, 36, 4, 'blue', 2, when='g>0.15'), T(38, 1.5, 'H₂O out', 'blue', 10, 'left'),
     T(70, 28, 'gas flux ≈ {g*100}%', 'gold', 11, 'center')],
    params=[P('g', 'stomatal opening', 0, 1, 0.6, step=0.05)], aspect=0.62)
# fix: gap rectangle (stoma) drawn as dark rect of width 8*g centred at 30
S['bio_leaf_structure_gas_exchange']['shapes'][5] = Rc('30-4*g', 11, '8*g', 4, None, '#0a0e17', 1)
S['bio_leaf_structure_gas_exchange']['shapes'][6] = C('30-4*g-1.2', 13, 1.6, 'gold', 'gold')
S['bio_leaf_structure_gas_exchange']['shapes'][7] = C('30+4*g+1.2', 13, 1.6, 'gold', 'gold')
S['bio_leaf_structure_gas_exchange']['shapes'][11]['y2'] = 11.5

plot('bio_water_transport', 'Water potential falls with height: gravity costs about 0.01 MPa per metre, and friction in the xylem adds more when transpiration is strong. Raise the flow loss and the top of a tall tree nears cavitation risk.',
    fns=[F('psoil-0.0098*x-r*x', 'xylem water potential', 'accent', width=2.6)], x=[0, 100], y=[-4, 0.2], xlabel='height (m)', ylabel='Ψ (MPa)',
    hlines=[{'y': -3, 'label': 'cavitation risk (species vary)'}],
    params=[P('psoil', 'soil Ψ (MPa)', -1, 0, -0.1, step=0.05), P('r', 'flow resistance (MPa/m)', 0, 0.03, 0.01, step=0.001)],
    readouts=[R('Ψ at 100 m', 'psoil-0.98-100*r', 'MPa')])

geo('bio_phloem_transport', 'In pressure-flow, loading sugar at the source raises turgor and unloading at the sink lowers it, so sap streams down the pressure gradient. Raise the pressure difference to speed the flow.',
    [0, 100, 0, 50],
    [Rc(10, 20, 80, 10, 'accent', 'accent', .12), C(8, 25, 9, 'green', 'green', .3), T(8, 25, 'source', 'green', 10, 'center'),
     C(92, 25, 9, 'orange', 'orange', .3), T(92, 25, 'sink', 'orange', 10, 'center'),
     T(50, 38, 'sieve tube (phloem)', 'dim', 11, 'center'), T(50, 8, 'pressure difference {dP} MPa → ≈ {dP*1.2} m/h', 'gold', 11, 'center')] +
    [dict(k='circle', x='12+mod(t*dP*14+%d,76)' % (k * 9.5), y=25, r=1.6, fill='gold', color='gold') for k in range(8)],
    params=[P('dP', 'pressure difference', 0.1, 1, 0.5, step=0.05, unit='MPa')], aspect=0.45)

bars('bio_plant_nutrition_soil', 'Typical mineral content of dry plant tissue (percent of dry mass): nitrogen and potassium are needed most, but all of these macronutrients are essential.',
    [('N', 1.5, 'green'), ('K', 1.0, 'gold'), ('Ca', 0.5, 'accent'), ('Mg', 0.2, 'purple'), ('P', 0.2, 'orange'), ('S', 0.1, 'pink')], ylabel='% of dry mass', aspect=0.7)

plot('bio_photosynthetic_adaptations', 'C4 plants concentrate CO₂ and so photosynthesise well at low CO₂, with no loss to photorespiration; C3 plants gain more as CO₂ rises. Slide the ambient CO₂ to compare.',
    fns=[F('x>45?30*(1-exp(-(x-45)/250)):0', 'C3 (wheat, rice)', 'green'), F('45*(1-exp(-x/60))', 'C4 (maize, sugarcane)', 'gold')],
    x=[0, 1000], y=[0, 50], xlabel='CO₂ (ppm)', ylabel='CO₂ uptake (µmol/m²/s)',
    points=[{'x': 'co2', 'y': 'co2>45?30*(1-exp(-(co2-45)/250)):0', 'color': 'green'}, {'x': 'co2', 'y': '45*(1-exp(-co2/60))', 'color': 'gold'}],
    params=[P('co2', 'ambient CO₂', 100, 1000, 420, step=10, unit='ppm')],
    readouts=[R('C3 uptake', 'co2>45?30*(1-exp(-(co2-45)/250)):0', 'µmol/m²/s'), R('C4 uptake', '45*(1-exp(-co2/60))', 'µmol/m²/s')])

plot('bio_plant_hormones', 'Auxin promotes stem elongation at concentrations that inhibit roots; roots respond at much lower doses. The curves are schematic. Move the slider to compare the effect at one concentration.',
    fns=[F('100*exp(-((log10(x)+5)^2)/2)-10', 'stem growth', 'green'), F('80*exp(-((log10(x)+10)^2)/1.5)-90/(1+exp(-(log10(x)+8)*2))', 'root growth', 'orange')],
    x=[1e-11, 1e-3], logx=True, y=[-100, 100], xlabel='auxin (M)', ylabel='growth change (%)', hlines=[{'y': 0, 'label': 'no effect'}],
    vlines=[{'x': '10^lc', 'label': 'chosen dose'}],
    params=[P('lc', 'log₁₀ concentration', -11, -3, -7, step=0.1)],
    readouts=[R('stem', '100*exp(-((lc+5)^2)/2)-10', '%'), R('root', '80*exp(-((lc+10)^2)/1.5)-90/(1+exp(-(lc+8)*2))', '%')])

plot('bio_plant_responses', 'Short-day plants flower when nights are longer than a critical length; long-day plants when nights are shorter. It is night length, not day length, that the plant measures.',
    fns=[F('1/(1+exp(-(x-c)*2.5))', 'short-day plant', 'purple'), F('1/(1+exp((x-c)*2.5))', 'long-day plant', 'gold')],
    x=[0, 24], y=[0, 1.05], xlabel='night length (h)', ylabel='flowering response', vlines=[{'x': 'c', 'label': 'critical night'}],
    params=[P('c', 'critical night length', 8, 16, 11, step=0.5, unit='h')])

chain('bio_plant_reproduction', 'A flowering plant\'s life cycle: pollen reaches the stigma, grows a tube, and double fertilisation forms the embryo and its food store, all inside a seed.',
      ['pollination', 'pollen tube', 'double fertilisation', 'seed + fruit', 'germination', 'adult plant', 'flower'], loop=True,
      colors=['gold', 'gold', 'pink', 'green', 'accent', 'green', 'pink'])

geo('bio_plant_development_flower', 'The ABC model: A alone makes sepals, A+B petals, B+C stamens, C alone carpels. Switch off A function (apetala2 mutant) and C spreads outward, giving carpel–stamen–stamen–carpel.',
    [-6, 6, -5, 5],
    [C(0, 0, 4.5, 'green', 'green', alpha=.5, when='m<0.5'), C(0, 0, 4.5, 'purple', 'purple', alpha=.55, when='m>0.5'),
     C(0, 0, 3.4, 'pink', 'pink', alpha=.6, when='m<0.5'), C(0, 0, 3.4, 'gold', 'gold', alpha=.6, when='m>0.5'),
     C(0, 0, 2.3, 'gold', 'gold', alpha=.7), C(0, 0, 1.2, 'purple', 'purple', alpha=.8),
     T(-5.9, 4.3, 'whorl 1 {m<0.5?0:0}', 'dim', 9, when=0), T(5.8, 4.3, 'outer → inner', 'dim', 10, 'right'),
     T(5.8, 3.0, '{m<0.5?"sepal":"carpel"}', 'white', 10, 'right', when=0)],
    params=[P('m', 'A function lost (0 = normal, 1 = mutant)', 0, 1, 0, step=1)], aspect=0.7)
sp = S['bio_plant_development_flower']
sp['shapes'] = [x for x in sp['shapes'] if x.get('when') != 0]
sp['shapes'] += [T(-5.8, 4.3, 'whorl 1: sepal', 'green', 10, when='m<0.5'), T(-5.8, 4.3, 'whorl 1: carpel', 'purple', 10, when='m>0.5'),
                 T(-5.8, 3.3, 'whorl 2: petal', 'pink', 10, when='m<0.5'), T(-5.8, 3.3, 'whorl 2: stamen', 'gold', 10, when='m>0.5'),
                 T(-5.8, 2.3, 'whorl 3: stamen', 'gold', 10), T(-5.8, 1.3, 'whorl 4: carpel', 'purple', 10)]

# ---------------- ANIMAL PHYSIOLOGY ----------------
hub('bio_animal_phys', 'Animals solve the same problems — getting food and oxygen, moving them around, removing waste, keeping conditions steady — with different organ systems.',
    'Animal body', ['Digestion', 'Circulation', 'Gas exchange', 'Excretion', 'Thermoregulation', 'Hormones'],
    colors=['orange', 'red', 'accent', 'gold', 'pink', 'purple'], aspect=0.85)

plot('bio_animal_form_scaling', 'Kleiber\'s law: metabolic rate scales as body mass to the power ≈ 0.75, so big animals use less energy per kilogram. Change the exponent and compare with simple proportionality (slope 1).',
    fns=[F('3.4*x^a', 'metabolic rate B = 3.4·Mᵃ', 'accent', width=2.6), F('3.4*x', 'proportional (a = 1)', 'dim', True)],
    x=[0.01, 5000], y=[0.01, 20000], logx=True, logy=True, xlabel='body mass (kg)', ylabel='rate (W)',
    points=[{'x': 0.02, 'y': '3.4*0.02^a', 'label': 'mouse'}, {'x': 70, 'y': '3.4*70^a', 'label': 'human'}, {'x': 4000, 'y': '3.4*4000^a', 'label': 'elephant'}],
    params=[P('a', 'exponent a', 0.5, 1, 0.75, step=0.01)],
    readouts=[R('human (70 kg)', '3.4*70^a', 'W'), R('per kg, mouse ÷ human', '(3.4*0.02^a/0.02)/(3.4*70^a/70)')])

bars('bio_energy_budgets_nutrition', 'Energy released per gram of food: fat packs more than twice the energy of carbohydrate or protein.',
    [('carbs', 17, 'gold'), ('protein', 17, 'pink'), ('alcohol', 29, 'purple'), ('fat', 37, 'orange')], ylabel='kJ per gram', aspect=0.65)

blocks('bio_comparative_digestion', 'A ruminant digests grass in four stomach chambers; food returns to the mouth as cud so microbes in the rumen can ferment cellulose.',
    [nd('m', 'mouth', 12, 20, 'accent'), nd('r', 'rumen', 45, 20, 'green'), nd('t', 'reticulum', 80, 20, 'green'), nd('o', 'omasum', 80, 52, 'green'), nd('a', 'abomasum', 45, 52, 'gold'), nd('i', 'intestine', 12, 52, 'orange')],
    [('m', 'r'), ('r', 't'), ('t', 'o'), ('o', 'a'), ('a', 'i'), {'from': 'r', 'to': 'm', 'label': 'cud', 'dashed': True}], aspect=0.5)

blocks('bio_comparative_circulation', 'Mammals and birds have double circulation: the right heart pumps blood to the lungs, the left heart to the body, so tissues receive fully oxygenated blood at high pressure.',
    [nd('rh', 'right heart', 12, 50, 'blue'), nd('l', 'lungs', 50, 15, 'accent'), nd('lh', 'left heart', 88, 50, 'red'), nd('b', 'body tissues', 50, 85, 'orange')],
    [{'from': 'rh', 'to': 'l', 'label': 'low O₂', 'color': 'blue'}, {'from': 'l', 'to': 'lh', 'label': 'high O₂', 'color': 'red'}, {'from': 'lh', 'to': 'b', 'color': 'red'}, {'from': 'b', 'to': 'rh', 'color': 'blue'}], aspect=0.6)

plot('bio_comparative_respiration', 'Fick\'s law: diffusion rate ∝ surface area × pressure difference ÷ thickness. Gills and lungs are thin and folded for exactly this reason. Increase the area or thin the barrier to raise gas flux.',
    fns=[F('k*A*dP/x', 'gas flux', 'accent', width=2.6)], x=[0.2, 10], y=[0, 3000], xlabel='barrier thickness (µm)', ylabel='relative flux',
    points=[{'x': 'd', 'y': 'k*A*dP/d', 'label': 'flux {k*A*dP/d}'}],
    params=[P('A', 'surface area (relative)', 1, 100, 40, step=1), P('dP', 'pressure difference (relative)', 1, 10, 4, step=0.5), P('d', 'thickness', 0.2, 10, 2, step=0.1, unit='µm')],
    readouts=[R('relative flux', 'k*A*dP/d')], k=1)
S['bio_comparative_respiration']['fns'][0]['f'] = 'A*dP/x'
S['bio_comparative_respiration']['points'][0].update(y='A*dP/d', label='flux {A*dP/d}')
S['bio_comparative_respiration']['readouts'][0]['value'] = 'A*dP/d'
del S['bio_comparative_respiration']['k']
S['bio_comparative_respiration'].pop('y')

plot('bio_oxygen_transport_diving', 'Myoglobin grabs oxygen at far lower PO₂ than haemoglobin, storing it in muscle for diving. Shift haemoglobin\'s P50 (higher in acid or heat, lower in e.g. llamas) and watch the curve move.',
    fns=[F('100*x^2.7/(x^2.7+p50^2.7)', 'haemoglobin', 'red', width=2.6), F('100*x/(x+2.8)', 'myoglobin', 'purple', width=2.6)],
    x=[0, 100], y=[0, 105], xlabel='PO₂ (mmHg)', ylabel='% saturation',
    points=[{'x': 'po2', 'y': '100*po2^2.7/(po2^2.7+p50^2.7)', 'color': 'red'}, {'x': 'po2', 'y': '100*po2/(po2+2.8)', 'color': 'purple'}],
    params=[P('p50', 'Hb P50', 15, 45, 26, step=1, unit='mmHg'), P('po2', 'tissue PO₂', 1, 100, 40, step=1, unit='mmHg')],
    readouts=[R('Hb saturation', '100*po2^2.7/(po2^2.7+p50^2.7)', '%'), R('Mb saturation', '100*po2/(po2+2.8)', '%')])

bars('bio_osmoregulation', 'Approximate osmolarity (mOsm/L): freshwater fish must pump out water and keep salt, while marine fish keep blood saltier than their body but far below seawater.',
    [('pond', 5, 'blue'), ('fish (fresh)', 300, 'green'), ('human', 290, 'accent'), ('fish (sea)', 350, 'orange'), ('sea', 1000, 'purple'), ('urine max', 1200, 'gold')], ylabel='mOsm/L', aspect=0.75)

chain('bio_excretion_nitrogen', 'Animals excrete nitrogen as ammonia (cheap but toxic, needs lots of water), urea (less toxic) or uric acid (a paste that saves water).',
      ['ammonia: aquatic', 'urea: mammals', 'uric acid: birds, insects'], per_row=3, colors=['blue', 'gold', 'orange'], elabels=['more water-saving →', '→'])

plot('bio_thermoregulation_animals', 'An endotherm\'s metabolism rises in the cold and heat; an ectotherm\'s rate follows temperature with a Q10 effect. Move the slider to compare the two at one body or air temperature.',
    fns=[F('x<tlc?(1+0.12*(tlc-x)):(x>tuc?1+0.15*(x-tuc):1)', 'endotherm (relative)', 'red', width=2.6), F('0.15*q10^((x-20)/10)', 'ectotherm (relative)', 'accent', width=2.6)],
    x=[0, 45], y=[0, 4], xlabel='temperature (°C)', ylabel='metabolic rate', vlines=[{'x': 'tc', 'label': 'chosen °C'}],
    params=[P('q10', 'Q10', 1.5, 4, 2.5, step=0.1), P('tlc', 'lower critical temp', 10, 28, 20, step=1, unit='°C'), P('tc', 'temperature', 0, 45, 30, step=1, unit='°C')],
    readouts=[R('endotherm', 'tc<tlc?(1+0.12*(tlc-tc)):(tc>tlc+12?1+0.15*(tc-tlc-12):1)'), R('ectotherm', '0.15*q10^((tc-20)/10)')])
S['bio_thermoregulation_animals']['fns'][0]['f'] = 'x<tlc?(1+0.12*(tlc-x)):(x>tlc+12?1+0.15*(x-tlc-12):1)'

geo('bio_locomotion_skeletons', 'The forearm is a third-class lever: the biceps pulls close to the elbow, so it must pull much harder than the weight it holds. Move the attachment point to change the force needed.',
    [-5, 45, -12, 17],
    [C(0, 0, 1.2, 'white', 'white'), Rc(-2, -1.2, 34, 2.4, 'dim', 'dim', .5), T(0, -3.5, 'elbow', 'white', 10, 'center'),
     A('d', 11, 'd', 1.3, 'red', 3), T('d', 12.5, 'biceps pulls {W*30/d} N', 'red', 11, 'center'),
     A(30, 7, 30, 1.3, 'gold', 3), T(30, 9, 'load {W} N at 30 cm', 'gold', 11, 'center'),
     L(0, 6, 'd', 11, 'red', 2, dash=True), T(22, -8, 'force ratio = 30/d = {30/d}', 'accent', 11, 'center')],
    params=[P('d', 'biceps attachment distance', 2, 8, 4, step=0.5, unit='cm'), P('W', 'load', 10, 100, 50, step=5, unit='N')], aspect=0.55)

blocks('bio_endocrine_comparative', 'The hypothalamus–pituitary–thyroid axis is a negative-feedback loop: the final hormone (T4) switches off its own drivers, holding the level steady.',
    [nd('h', 'hypothalamus', 20, 12, 'purple'), nd('p', 'pituitary', 78, 12, 'purple'), nd('t', 'thyroid', 78, 50, 'gold'), nd('x', 'T3 / T4 in blood', 30, 85, 'green')],
    [('h', 'p', 'TRH'), ('p', 't', 'TSH'), ('t', 'x', 'T4'), {'from': 'x', 'to': 'h', 'label': '−', 'dashed': True, 'color': 'red'}, {'from': 'x', 'to': 'p', 'label': '−', 'dashed': True, 'color': 'red'}], aspect=0.65)

bars('bio_reproduction_strategies', 'Eggs or offspring per female per breeding event (log scale, approximate): some animals invest in one offspring, others broadcast millions.',
    [('human', 1, 'green'), ('dog', 6, 'accent'), ('frog', 2000, 'gold'), ('salmon', 5000, 'orange'), ('sunfish', 300000000, 'pink')], logy=True, ylabel='offspring (log)', aspect=0.7)

# ---------------- NEUROSCIENCE ----------------
hub('bio_neuro', 'Neuroscience spans levels from ion channels to behaviour: cells and signals at the bottom, circuits and brain regions above, and the senses and behaviour they produce.',
    'Nervous system', ['Neurons and glia', 'Action potentials', 'Synapses', 'Senses', 'Brain regions', 'Behaviour'],
    colors=['accent', 'gold', 'pink', 'green', 'purple', 'orange'], aspect=0.85)

geo('bio_neuron_glia', 'A neuron receives signals on dendrites, integrates them in the soma and sends a spike down the myelinated axon to its terminals. Watch the impulse travel; it jumps between gaps in the myelin.',
    [0, 100, 0, 46],
    [Cv('14+s*10*cos(%g)+0*s' % (a), '23+s*10*sin(%g)' % (a), [0, 1], 'accent', 2) for a in (2.5, 3.14, 3.8, 2.8, 3.5)] +
    [C(22, 23, 5, 'accent', 'accent', alpha=.35), T(22, 31, 'soma', 'white', 10, 'center'), T(7, 40, 'dendrites', 'dim', 10)] +
    [L(27, 23, 82, 23, 'dim', 2)] + [Rc(31 + 11 * k, 20.8, 8, 4.4, 'gold', 'gold', .45) for k in range(5)] +
    [T(55, 14, 'myelin sheath (nodes between)', 'gold', 10, 'center')] +
    [Cv('82+s*8', '23+%g*s' % (d), [0, 1], 'accent', 2) for d in (-8, -3, 3, 8)] + [T(92, 38, 'terminals', 'white', 10, 'center'),
     C('27+mod(t*14,56)', 23, 2.4, 'white', 'white')],
    aspect=0.5)

plot('bio_action_potential_channels', 'An all-or-none spike: depolarise past the −55 mV threshold and voltage-gated Na⁺ channels trigger a full action potential; a smaller stimulus fades away. Increase the stimulus to cross threshold.',
    fns=[F('(stim>=15)?(-70+110*exp(-((x-2)/0.55)^2)-18*exp(-((x-3.6)/0.9)^2)+0*x):-70+stim*exp(-((x-2)/1.6)^2)', 'membrane potential', 'accent', width=2.6)],
    x=[0, 8], y=[-90, 50], xlabel='time (ms)', ylabel='mV', hlines=[{'y': -55, 'label': 'threshold −55 mV'}, {'y': -70, 'label': 'rest −70 mV'}],
    params=[P('stim', 'stimulus depolarisation', 2, 30, 20, step=1, unit='mV')],
    readouts=[R('stimulus reaches', 'stim-70', 'mV'), R('spike fires?', 'stim>=15')])

plot('bio_synapse_neurotransmitters', 'One EPSP is too small to fire the neuron, but two arriving close together add up (temporal summation) and cross threshold. Shrink the gap between inputs to see summation grow.',
    fns=[F('-70+a*((x>1)*((x-1)/2)*exp(1-(x-1)/2)+(x>1+dt)*((x-1-dt)/2)*exp(1-(x-1-dt)/2))', 'membrane potential', 'accent', width=2.6)],
    x=[0, 25], y=[-80, -40], xlabel='time (ms)', ylabel='mV', hlines=[{'y': -55, 'label': 'threshold'}],
    params=[P('a', 'EPSP size', 3, 10, 7, step=0.5, unit='mV'), P('dt', 'gap between inputs', 0, 20, 3, step=0.5, unit='ms')],
    readouts=[R('single EPSP peak', 'a', 'mV')])

plot('bio_synaptic_plasticity_memory', 'After a brief high-frequency burst (t = 0), synaptic strength jumps (LTP). Early LTP fades in about an hour; with protein synthesis the late phase lasts. Slide the decay time to compare.',
    fns=[F('x<0?100:100+A*exp(-x/tau)', 'synaptic strength', 'green', width=2.6)], x=[-20, 300], y=[80, 260], xlabel='minutes after stimulation', ylabel='% of baseline',
    hlines=[{'y': 100, 'label': 'baseline'}],
    params=[P('A', 'LTP size', 20, 150, 100, step=5, unit='%'), P('tau', 'decay time constant', 20, 600, 90, step=10, unit='min')],
    readouts=[R('strength after 2 h', '100+A*exp(-120/tau)', '%')])

plot('bio_sensory_transduction', 'Stevens\' power law: perceived intensity = k·Sᵃ. Brightness (a≈0.33) compresses a huge range; electric shock (a≈3.5) expands it. Slide the exponent to see the curve bend.',
    fns=[F('x^0.33', 'brightness, a = 0.33', 'gold'), F('x^0.67', 'loudness, a = 0.67', 'accent'), F('x^a', 'your exponent a', 'pink', width=2.6)],
    x=[0, 10], y=[0, 10], xlabel='stimulus intensity', ylabel='perceived magnitude', params=[P('a', 'exponent a', 0.2, 3.5, 1.5, step=0.05)])

plot('bio_vision_photoreception', 'Three cone types absorb different wavelengths, and the brain compares their outputs to see colour; rods peak near 498 nm. Slide the wavelength and read each cone\'s response.',
    fns=[F('exp(-((x-420)/32)^2)', 'S cone', 'blue'), F('exp(-((x-534)/42)^2)', 'M cone', 'green'), F('exp(-((x-564)/45)^2)', 'L cone', 'red'), F('exp(-((x-498)/38)^2)', 'rod', 'dim', True)],
    x=[380, 700], y=[0, 1.1], xlabel='wavelength (nm)', ylabel='relative absorbance', vlines=[{'x': 'w', 'label': 'light'}],
    params=[P('w', 'wavelength', 400, 680, 550, step=5, unit='nm')],
    readouts=[R('S', 'exp(-((w-420)/32)^2)'), R('M', 'exp(-((w-534)/42)^2)'), R('L', 'exp(-((w-564)/45)^2)')])

plot('bio_hearing_chemosense', 'The cochlea is a frequency map (Greenwood function): high pitches vibrate the base, low pitches the apex. Slide along the basilar membrane to read the frequency at each point.',
    fns=[F('165.4*(10^(2.1*x)-0.88)', 'best frequency', 'accent', width=2.6)], x=[0, 1], logy=True, y=[20, 25000], xlabel='position (0 = apex, 1 = base)', ylabel='Hz',
    points=[{'x': 'pos', 'y': '165.4*(10^(2.1*pos)-0.88)', 'label': '{165.4*(10^(2.1*pos)-0.88)} Hz'}],
    params=[P('pos', 'position along cochlea', 0.02, 1, 0.5, step=0.01)], readouts=[R('frequency', '165.4*(10^(2.1*pos)-0.88)', 'Hz')])

hub('bio_brain_organization', 'The central nervous system divides into regions with broad roles, from reflex and life-support circuits in the brainstem to planning in the cortex.',
    'Brain', ['Cerebral cortex', 'Cerebellum', 'Brainstem', 'Thalamus', 'Hypothalamus', 'Hippocampus'],
    colors=['accent', 'orange', 'red', 'gold', 'purple', 'green'], aspect=0.85)

chain('bio_autonomic_reflexes', 'A reflex arc is the shortest loop in the nervous system: stimulus, sensor, spinal cord, motor neuron and muscle, with no brain needed for the fast response.',
      ['stimulus', 'sensory neuron', 'spinal cord interneuron', 'motor neuron', 'muscle responds'], loop=False, colors=['gold', 'accent', 'purple', 'accent', 'green'])

plot('bio_sleep_circadian', 'Two-process model: sleep pressure (S, gold) builds while awake and dissipates in sleep, while the body clock (C, blue) rises and falls on a 24 h cycle. Lengthen wakefulness to see pressure climb.',
    fns=[F('x<W?0.15+0.75*(1-exp(-x/18)):(mod(x,24)>=W?(0.15+0.75*(1-exp(-W/18)))*exp(-(mod(x,24)-W)/4):0.15)', 'sleep pressure S', 'gold', width=2.6),
         F('0.5+0.4*cos(2*pi*(x-10)/24)', 'circadian alertness C', 'accent', width=2.6)],
    x=[0, 24], y=[0, 1.05], xlabel='hours after waking', ylabel='relative level', vlines=[{'x': 'W', 'label': 'sleep'}],
    params=[P('W', 'hours awake', 12, 22, 16, step=1, unit='h')])

plot('bio_nervous_disorders', 'In Parkinson\'s disease, symptoms appear only after most dopamine neurons are lost, since the circuit compensates until a threshold. Slide the threshold to see how late the decline shows.',
    fns=[F('100/(1+exp((x-thr)/6))', 'motor function', 'pink', width=2.6)], x=[0, 100], y=[0, 105], xlabel='dopamine neurons lost (%)', ylabel='motor function (%)',
    vlines=[{'x': 'thr', 'label': 'threshold'}], params=[P('thr', 'threshold for symptoms', 40, 80, 60, step=1, unit='%')],
    readouts=[R('function at 30% loss', '100/(1+exp((30-thr)/6))', '%')])

blocks('bio_behavior_proximate_ultimate', 'Tinbergen\'s four questions about any behaviour: two ask how it happens (mechanism such as hormones and brain circuits; development such as learning), two ask why it exists (function such as attracting mates; evolutionary history).',
    [nd('c', 'Why does a bird sing?', 50, 50, 'gold'), nd('a', 'Mechanism', 20, 12, 'accent'), nd('b', 'Development', 80, 12, 'accent'), nd('d', 'Function', 20, 88, 'green'), nd('e', 'Evolution', 80, 88, 'green')],
    [('c', 'a'), ('c', 'b'), ('c', 'd'), ('c', 'e')], flow=False, aspect=0.8)

plot('bio_learning_social_behavior', 'Marginal value theorem: a forager should leave a patch when its average rate of gain, counting travel time, is highest. Longer travel between patches means staying longer in each.',
    fns=[F('G*(1-exp(-x/tau))/(x+T)', 'average intake rate', 'green', width=2.6), F('G*(1-exp(-x/tau))/20', 'gain in patch (scaled)', 'dim', True)],
    x=[0.1, 30], xlabel='time spent in patch (min)', ylabel='intake rate',
    params=[P('T', 'travel time between patches', 1, 20, 5, step=1, unit='min'), P('G', 'patch yield', 10, 30, 20, step=1), P('tau', 'depletion time', 2, 12, 5, step=0.5, unit='min')])

geo('bio_migration_navigation', 'A migrating bird that heads straight at the goal is pushed sideways by wind; it must compensate. Change the wind to see the drift and the resulting ground speed.',
    [-12, 12, -3, 12],
    [A(0, 0, 0, '10*air/12', 'green', 3), T(0.5, '5*air/12', 'heading ({air} m/s)', 'green', 10, 'left'),
     A('0', '10*air/12', '(wind*sin(wd))*0.8', '10*air/12+(wind*cos(wd))*0.8', 'accent', 2), T(0, 11.4, 'wind {wind} m/s', 'accent', 10, 'center'),
     A(0, 0, '(wind*sin(wd))*0.8', '10*air/12+(wind*cos(wd))*0.8', 'gold', 3), Pt(0, 0, 'white', 4),
     T(-11.5, 0.2, 'ground speed = {hypot(wind*sin(wd),air+wind*cos(wd))} m/s', 'gold', 10, 'left')],
    params=[P('air', 'airspeed', 8, 14, 12, step=0.5, unit='m/s'), P('wind', 'wind speed', 0, 10, 4, step=0.5, unit='m/s'), P('wd', 'wind direction (rad)', -3.1, 3.1, 1.2, step=0.1)], aspect=0.8)

bars('bio_neuro_methods', 'Typical spatial resolution of methods (mm, log scale, approximate): from single-cell recordings to whole-head EEG, there is a trade-off between detail and coverage.',
    [('patch', 0.01, 'green'), ('2-photon', 0.001, 'green'), ('fMRI', 1, 'gold'), ('PET', 4, 'orange'), ('EEG', 10, 'pink')], logy=True, ylabel='resolution (mm)', aspect=0.7)
