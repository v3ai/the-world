from lib import *
import math

# ---------- PHYSIOLOGY ----------
plot('homeostasis', 'Negative feedback restores a set point. After a +2 °C disturbance, the body\'s control loop pulls temperature back to 37 °C; stronger feedback (higher gain) corrects it faster.',
     [F('37+2*exp(-g*x)', 'body temperature', 'accent')], x=[0, 20], y=[36.5, 39.3], xlabel='time after disturbance (min)', ylabel='temperature (°C)', hlines=[dict(y=37, label='set point')],
     params=[P('g', 'feedback gain', 0.05, 1, 0.3, 'per min')], readouts=[R('time to halve the error', 'ln(2)/g', 'min')])

plot('blood_circulation', 'Arterial pressure rises with each heartbeat (systole, ~120 mmHg) and decays in between (diastole, ~80). Faster heart rate packs more beats into the same time and raises cardiac output.',
     [F('mod(x*HR/60,1)<0.3 ? 80+40*sin(1.5708*mod(x*HR/60,1)/0.3) : 80+40*exp(-(mod(x*HR/60,1)-0.3)*3.5)', 'arterial pressure', 'pink')], x=[0, 4], y=[60, 135], xlabel='time (s)', ylabel='pressure (mmHg)',
     params=[P('HR', 'heart rate', 50, 150, 72, 'beats/min')], points=[dict(x='mod(t,4)', y='mod(mod(t,4)*HR/60,1)<0.3 ? 80+40*sin(1.5708*mod(mod(t,4)*HR/60,1)/0.3) : 80+40*exp(-(mod(mod(t,4)*HR/60,1)-0.3)*3.5)')],
     readouts=[R('cardiac output (70 mL stroke)', 'HR*0.07', 'L/min')])

plot('respiratory_physiology', 'Each breath moves tidal volume in and out, but ~150 mL stays in the airways (dead space) and never reaches the alveoli. Shallow fast breaths move the same air but ventilate the lungs less.',
     [F('2.5+0.5*(1-cos(2*pi*x*RR/60))/2*(Vt/0.5)', 'lung volume', 'accent')], x=[0, 12], y=[2.3, 4.1], xlabel='time (s)', ylabel='lung volume (L)',
     params=[P('RR', 'breaths per minute', 6, 40, 12), P('Vt', 'tidal volume', 0.2, 1.2, 0.5, 'L')],
     readouts=[R('total ventilation', 'RR*Vt', 'L/min'), R('alveolar ventilation', 'RR*(Vt-0.15)', 'L/min')])

plot('heme_oxygen', 'Haemoglobin loads oxygen steeply in the lungs (high pO₂) and releases it in tissues (low pO₂): an S-shaped curve thanks to cooperative binding. Myoglobin (dashed) holds on harder. Slide P₅₀ to model acidity or CO₂ (the Bohr shift).',
     [F('x^2.7/(P50^2.7+x^2.7)', 'haemoglobin', 'pink'), F('x/(2.8+x)', 'myoglobin', 'accent', dash=True)], x=[0, 100], y=[0, 1.05], xlabel='oxygen partial pressure (mmHg)', ylabel='saturation',
     params=[P('P50', 'P₅₀ (position)', 18, 40, 26.6, 'mmHg')], vlines=[dict(x=40, label='tissue'), dict(x=100, label='lung')],
     readouts=[R('saturation in tissue (40 mmHg)', 'x_=0*0+40^2.7/(P50^2.7+40^2.7)')])
S['heme_oxygen']['readouts'] = [R('saturation at 40 mmHg (tissue)', '40^2.7/(P50^2.7+40^2.7)'), R('saturation at 100 mmHg (lung)', '100^2.7/(P50^2.7+100^2.7)')]

bars('digestion_renal', 'The kidneys filter about 180 litres of plasma a day but you pass only about 1.5 litres of urine: over 99% of the filtrate is reabsorbed. (Litres per day, adult.)',
     [('filtered', 180, 'accent'), ('reabsorbed', 178.5, 'green'), ('urine', 1.5, 'gold')], logy=True, ylabel='litres per day')

blocks('endocrine_physiology', 'Hormones work in feedback loops. The hypothalamus signals the pituitary (TSH), which signals the thyroid to release T4; high T4 then switches off the upstream signals, holding levels steady.',
       [('h', 'Hypothalamus\n(TRH)', 12, 20, 'accent'), ('p', 'Pituitary (TSH)', 50, 20, 'accent'), ('t', 'Thyroid', 88, 20, 'gold'), ('b', 'T4 in blood', 88, 75, 'pink')],
       [('h', 'p'), ('p', 't'), ('t', 'b'), ('b', 'p', '− inhibits', True), ('b', 'h', '', True)], aspect=0.62)
S['endocrine_physiology']['nodes'][0]['label'] = 'Hypothalamus'

plot('musculoskeletal', 'Hill\'s muscle law: a muscle shortens fast against light loads and slowly against heavy ones. Power (force × speed, gold) peaks at about a third of maximum force. Slide the curvature to model fast- vs slow-twitch fibres.',
     [F('(1-x)/(1+x/k)', 'shortening speed / max', 'accent'), F('4*x*(1-x)/(1+x/k)', 'power (scaled)', 'gold')], x=[0, 1], y=[0, 1.1], xlabel='load / maximum isometric force', ylabel='relative speed / power',
     params=[P('k', 'curvature a/F₀', 0.1, 0.6, 0.25)], readouts=[R('speed at half load (relative)', '0.5/(1+0.5/k)')])

geo('skin_integument', 'Skin has three main layers: the thin epidermis (waterproof barrier, ~0.1 mm), the dermis (collagen, vessels, nerves, glands, 1–2 mm) and the fatty hypodermis that insulates and cushions.',
    [-3, 3, -2.4, 1.2],
    [Rc(-3, 0.5, 6, 0.4, 'accent', 'accent', alpha=0.45), Rc(-3, -0.9, 6, 1.4, 'pink', 'pink', alpha=0.3), Rc(-3, -2.2, 6, 1.3, 'gold', 'gold', alpha=0.3),
     T(0, 0.7, 'epidermis (~0.1 mm): barrier, pigment', 'white', 10), T(0, -0.2, 'dermis (1–2 mm): collagen, vessels, nerves, glands', 'white', 10), T(0, -1.55, 'hypodermis: fat insulation', 'white', 10),
     L(-1.2, 0.9, -1.2, -1.0, 'dim', 3), T(-1.2, 1.05, 'hair follicle', 'dim', 9), L(1.6, 0.5, 1.6, -0.6, 'red', 3), T(1.6, 1.05, 'capillary', 'red', 9)], aspect=0.6)

plot('immune_system', 'The first exposure to a germ triggers a slow, modest antibody response; a second exposure (vaccine booster or reinfection) triggers a much faster and stronger one because memory cells remember. Move the second exposure.',
     [F('(x/10)*exp(1-x/10)', 'first exposure', 'accent'), F('(x/10)*exp(1-x/10)+(x<d2 ? 0 : 9*((x-d2)/4)*exp(1-(x-d2)/4))', 'with second exposure', 'pink')], x=[0, 60], y=[0, 11], xlabel='days', ylabel='antibody level (relative)',
     params=[P('d2', 'second exposure on day', 14, 45, 28)], vlines=[dict(x='d2', label='re-exposure', color='gold')])

plot('vaccines_medicine', 'Herd immunity needs coverage above 1 − 1/R₀, divided by how well the vaccine works. Highly infectious measles (R₀ 12–18) needs ~95% immune; a milder bug needs far fewer. Slide R₀ and vaccine effectiveness.',
     [F('(1-1/x)/VE*100', 'coverage needed (%)', 'accent')], x=[1, 18], y=[0, 105], xlabel='basic reproduction number R₀', ylabel='population to vaccinate (%)',
     params=[P('VE', 'vaccine effectiveness', 0.5, 1, 0.95), P('R0', 'R₀', 1.2, 18, 3, None)], points=[dict(x='R0', y='(1-1/R0)/VE*100', label='{(1-1/R0)/VE*100}%')],
     readouts=[R('coverage needed', '(1-1/R0)/VE*100', '%')])

plot('pharmacology', 'Dose–response is S-shaped on a log axis. EC₅₀ is the dose giving half the maximum effect; a competitive antagonist shifts the curve to the right without lowering the maximum. Add antagonist with the slider.',
     [F('100*x/(ec+x)', 'drug alone', 'accent'), F('100*x/(ec*(1+B)+x)', 'with antagonist', 'pink')], x=[1, 100000], y=[0, 105], logx=True, xlabel='drug concentration (nM)', ylabel='effect (% of maximum)',
     params=[P('ec', 'potency EC₅₀', 10, 1000, 100, 'nM'), P('B', 'antagonist (× its K_d)', 0, 20, 5)], readouts=[R('EC₅₀ with antagonist', 'ec*(1+B)', 'nM')])

plot('cancer_biology', 'Cancer risk climbs steeply with age, roughly as age^k, because several rare mutations must accumulate in one cell lineage (Armitage–Doll). On log axes it is a straight line of slope k.',
     [F('100*(x/50)^k', 'incidence per 100,000', 'accent')], x=[20, 90], y=[1, 10000], logx=True, logy=True, xlabel='age (years)', ylabel='new cases per 100,000 per year',
     params=[P('k', 'rate-limiting steps', 3, 7, 5, step=1)], readouts=[R('risk at 80 vs at 40', '2^k')])

plot('medical_imaging', 'X-rays are absorbed exponentially, I = I₀e^(−μx), and bone (large μ) absorbs far more than soft tissue or lung. That contrast makes the shadow image (values near 60 keV, approximate).',
     [F('exp(-0.57*x)', 'bone', 'gold'), F('exp(-0.206*x)', 'soft tissue / water', 'accent'), F('exp(-0.054*x)', 'lung', 'green')], x=[0, 10], y=[0, 1.05], xlabel='thickness (cm)', ylabel='fraction of X-rays transmitted',
     params=[P('d', 'thickness', 0, 10, 3, 'cm')], readouts=[R('through bone', '100*exp(-0.57*d)', '%'), R('through soft tissue', '100*exp(-0.206*d)', '%')])

plot('mri_tech', 'In MRI, tissue protons realign (T₁ recovery, blue) and lose their signal (T₂ decay, pink) at tissue-specific rates; those differences make the contrast. The scanner frequency is 42.58 MHz per tesla.',
     [F('1-exp(-x/T1)', 'longitudinal recovery', 'accent'), F('exp(-x/T2)', 'transverse decay', 'pink')], x=[0, 3000], y=[0, 1.05], xlabel='time (ms)', ylabel='magnetisation (relative)',
     params=[P('T1', 'T₁', 200, 3000, 900, 'ms'), P('T2', 'T₂', 30, 500, 90, 'ms'), P('B', 'field strength', 0.5, 7, 1.5, 'T')], readouts=[R('Larmor frequency', '42.58*B', 'MHz')])

plot('synapse_plasticity', 'Spike-timing-dependent plasticity: if the sending neuron fires just before the receiving one, the synapse strengthens; if just after, it weakens. "Neurons that fire together, wire together" with timing mattering.',
     [F('x>0 ? exp(-x/tp) : -1.05*exp(x/tm)', 'change in synaptic strength', 'accent')], x=[-80, 80], y=[-1.2, 1.2], xlabel='post-spike minus pre-spike time (ms)', ylabel='change in strength (relative)',
     params=[P('tp', 'strengthening window', 5, 40, 20, 'ms'), P('tm', 'weakening window', 5, 40, 20, 'ms')])

bars('brain_organization', 'The human brain has about 86 billion neurons, but most (69 billion) are in the small cerebellum, not the cerebral cortex (16 billion), which supports most thought and perception.',
     [('cerebellum', 69, 'accent'), ('cerebral cortex', 16, 'gold'), ('rest of brain', 0.7)], logy=True, ylabel='neurons (billions)')

add('connectome', dict(type='graph', layout='circle', nodes=[dict(id=str(i)) for i in range(12)],
    edges=[[str(i), str((i + 1) % 12)] for i in range(12)] + [[str(i), str((i + 2) % 12)] for i in range(0, 12, 3)] + [['0', '6'], ['3', '9']],
    steps=[['0'], ['1', '11', '2', '6'], ['3', '5', '7', '9', '10']],
    caption='Brain networks are "small-world": mostly local connections with a few long-range shortcuts, so any neuron is only a few steps from any other. Watch a signal spread from node 0. The worm C. elegans (302 neurons) is fully mapped; human maps are partial.'))

bars('sensory_systems', 'How many receptors each sense uses (approximate human counts). Vision uses far more receptor cells than hearing, taste buds or smell receptor types; the brain turns all of them into patterns of spikes.',
     [('rods', 9.2e7), ('cones', 4.6e6), ('smell neurons', 1e7), ('cochlear hair cells', 1.6e4), ('taste buds', 1e4)], logy=True, ylabel='receptor cells')

plot('vision_eye', 'To keep the image on the retina the eye must raise its lens power as objects come closer: power ≈ 1/(eye length) + 1/(object distance). A longer eye (myopia) over-focuses distant objects; the lens can only add about 10 dioptres.',
     [F('1000/L+1/x', 'power needed (dioptres)', 'accent')], x=[0.1, 10], y=[55, 75], logx=True, xlabel='object distance (m)', ylabel='lens power needed (dioptres)',
     params=[P('L', 'eye length', 15, 19, 17, 'mm'), P('d', 'object distance', 0.1, 10, 0.5, 'm')], points=[dict(x='d', y='1000/L+1/d', label='{1000/L+1/d} D')],
     hlines=[dict(y=58.8, label='relaxed lens 58.8 D')], readouts=[R('power needed', '1000/L+1/d', 'D'), R('extra power vs distance vision', '1/d', 'D')])

plot('sound_hearing', 'A pure tone is a pressure wave: higher frequency means higher pitch, bigger amplitude means louder. The decibel scale is logarithmic, so every +20 dB is a 10× increase in pressure.',
     [F('A*sin(2*pi*f*(x/1000-t*0.0005))', 'sound pressure', 'accent')], x=[0, 20], y=[-2.2, 2.2], xlabel='time (ms)', ylabel='pressure (Pa)',
     params=[P('f', 'frequency', 100, 1000, 440, 'Hz'), P('A', 'amplitude', 0.01, 2, 0.2, 'Pa')], readouts=[R('loudness', '20*log10(A/sqrt(2)/2e-5)', 'dB SPL'), R('period', '1000/f', 'ms')])

plot('memory_learning', 'Forgetting follows a curve that drops fast and then slowly (Ebbinghaus). A review resets it and slows the next decline, which is the logic of spaced repetition. Exact curve shapes vary between people and materials.',
     [F('exp(-x/2)', 'no review', 'accent'), F('x<rv ? exp(-x/2) : exp(-(x-rv)/(2*kk))', 'review on day marked', 'pink')], x=[0, 30], y=[0, 1.05], xlabel='days', ylabel='fraction remembered',
     params=[P('rv', 'review on day', 1, 10, 2), P('kk', 'memory gain per review', 1.5, 6, 3)], vlines=[dict(x='rv', label='review', color='gold')],
     readouts=[R('retained after 30 days with review', '100*exp(-(30-rv)/(2*kk))', '%')])

plot('cognition_psychology', 'Hick\'s law: choosing among more alternatives takes longer, in proportion to the information involved, RT = a + b·log₂(n+1). Doubling the choices adds a fixed delay, not double the time.',
     [F('a+b*log2(x+1)', 'reaction time', 'accent')], x=[1, 16], y=[0, 900], xlabel='number of choices', ylabel='reaction time (ms)', params=[P('a', 'base time a', 150, 300, 200, 'ms'), P('b', 'per bit b', 100, 250, 150, 'ms')],
     readouts=[R('8 choices', 'a+b*log2(9)', 'ms')])

plot('replication_crisis', 'If most hypotheses tested are false, a "significant" result is often a false positive. The share of positive findings that are true, PPV = p·power / (p·power + (1−p)·α), is low when power is low or the prior probability p is small.',
     [F('x*pw/(x*pw+(1-x)*al)', 'chance a positive result is true', 'accent')], x=[0, 1], y=[0, 1.05], xlabel='prior probability the hypothesis is true', ylabel='share of positives that are true',
     params=[P('pw', 'statistical power', 0.1, 0.99, 0.35), P('al', 'significance level α', 0.005, 0.1, 0.05)],
     points=[dict(x=0.1, y='0.1*pw/(0.1*pw+0.9*al)', label='10% prior')], readouts=[R('PPV at 10% prior', '0.1*pw/(0.1*pw+0.9*al)')])

hub('consciousness_theories', 'There is no agreed scientific theory of consciousness; leading candidates make different predictions and are being tested against each other.',
    'Consciousness (open)', ['Global workspace', 'Integrated information', 'Higher-order theories', 'Recurrent processing', 'Predictive processing'], colors=['accent'] * 5, aspect=0.9)

blocks('predictive_brain', 'On this view the brain constantly predicts its inputs. Only the mismatch (prediction error) travels up the hierarchy to update the model. The idea fits a lot of data but remains debated as a full account.',
       [('m', 'Internal model\n(predictions)', 12, 22, 'gold'), ('s', 'Sensory input', 12, 78, 'accent'), ('e', 'Compare', 58, 50, None, 'sum'), ('u', 'Prediction error', 88, 50, 'pink')],
       [('m', 'e', 'predict'), ('s', 'e', 'sense'), ('e', 'u'), ('u', 'm', 'update', True)], aspect=0.62)
S['predictive_brain']['nodes'][0]['label'] = 'Internal model'

plot('sleep_circadian', 'The two-process model: sleep pressure (pink) builds while awake and drains during sleep, while the body clock (blue) cycles every 24 h independently. We sleep when pressure is high and the clock agrees. Idealised; slide the wake-up time.',
     [F('mod(x-w,24)<16 ? 1-0.9*exp(-mod(x-w,24)/18.2) : (1-0.9*exp(-16/18.2))*exp(-(mod(x-w,24)-16)/4.2)', 'sleep pressure', 'pink'), F('0.5+0.3*cos(2*pi*(x-17)/24)', 'circadian alertness drive', 'accent')],
     x=[0, 48], y=[0, 1.1], xlabel='hour (0 = midnight, two days)', ylabel='level (relative)', params=[P('w', 'wake-up time', 5, 10, 7, 'h')])

# ---------- ECOLOGY ----------
bars('ecology_energy', 'Only a fraction (about 10%) of energy passes up each step of a food chain, so food chains are short and top predators are rare. Change the transfer efficiency and watch the pyramid.',
     [('producers', '10000', 'green'), ('herbivores', '10000*e1', 'accent'), ('carnivores', '10000*e1^2', 'gold'), ('top predators', '10000*e1^3', 'pink')], logy=True, ylabel='energy (kJ)', params=[P('e1', 'transfer efficiency', 0.05, 0.25, 0.1)])
for b in S['ecology_energy']['bars']: b['value'] = b['value'] if isinstance(b['value'], str) else b['value']

plot('population_dynamics', 'Logistic growth: populations grow exponentially at first (dashed) and then level off at the carrying capacity K as resources run short. Higher r grows faster. The dot replays the growth.',
     [F('K/(1+(K-10)/10*exp(-r*x))', 'logistic', 'accent'), F('10*exp(r*x)', 'unlimited (exponential)', 'pink', dash=True)], x=[0, 30], y=[0, 1200], xlabel='time', ylabel='population',
     params=[P('r', 'growth rate r', 0.1, 0.8, 0.3), P('K', 'carrying capacity K', 200, 1000, 800)], points=[dict(x='mod(t*3,30)', y='K/(1+(K-10)/10*exp(-r*mod(t*3,30)))')],
     readouts=[R('fastest growth at N = K/2', 'K/2'), R('doubling time (early)', 'ln(2)/r')])

bars('biodiversity_conservation', 'Share of assessed species at risk of extinction (IUCN Red List, approximate). Amphibians are the most threatened vertebrates; many groups remain poorly assessed.',
     [('amphibians', 41, 'pink'), ('sharks & rays', 37), ('conifers', 34), ('mammals', 27), ('reptiles', 21), ('birds', 12)], ylabel='% threatened')

plot('biosphere_energy', 'Free oxygen was almost absent until cyanobacteria changed the air: the Great Oxidation (~2.4 Ga), then a second rise (~0.8–0.4 Ga) that allowed large animals. A schematic of oxygen versus time, not exact levels.',
     [F('0.001+0.03/(1+exp(-(x+2.3)*8))+0.5/(1+exp(-(x+0.6)*5))+0.3/(1+exp(-(x+0.45)*12))', 'atmospheric O₂ (fraction of today)', 'accent')], x=[-4.5, 0], y=[0, 1.2], xlabel='billions of years ago (negative = past)', ylabel='relative O₂',
     vlines=[dict(x=-2.4, label='Great Oxidation', color='gold'), dict(x=-0.55, label='animals', color='pink')], params=[P('tt', 'time', -4.5, 0, -2.4, 'Ga')])
S['biosphere_energy']['params'] = []

chain('minerals_rocks', 'The rock cycle: magma cools into igneous rock; weathering and burial make sedimentary rock; heat and pressure make metamorphic rock; and melting returns it to magma. The cycle takes tens to hundreds of millions of years.',
      ['Magma', 'Igneous rock', 'Sediment', 'Sedimentary rock', 'Metamorphic rock'], per_row=3, colors=['pink', 'accent', 'gold', 'gold', 'green'], elabels=['cooling', 'weathering', 'burial', 'heat + pressure', 'melting'], loop=True)

vp = [('Vp mantle', 'accent', [(35, 8.0), (410, 9.0), (660, 10.8), (2891, 13.7)]), ('Vp crust', 'accent', [(0, 6.0), (35, 6.5)]), ('Vp outer core', 'accent', [(2891, 8.0), (5150, 10.3)]), ('Vp inner core', 'accent', [(5150, 11.0), (6371, 11.26)])]
vs = [('Vs mantle', 'pink', [(35, 4.5), (410, 5.0), (660, 6.0), (2891, 7.3)]), ('Vs crust', 'pink', [(0, 3.5), (35, 3.9)]), ('Vs inner core', 'pink', [(5150, 3.5), (6371, 3.67)])]
fns = []
for k, (lab, c, p) in enumerate(vp + vs):
    fns.append(F(pwl(p), 'P waves' if k == 0 else ('S waves' if k == 4 else None), c))
plot('earth_interior', 'Seismic waves reveal the layers. P waves (blue) travel through everything; S waves (pink) stop in the liquid outer core (2891–5150 km), proving it is liquid. Speeds jump at the crust–mantle, mantle–core and outer–inner core boundaries (PREM-like values, approximate).',
     fns, x=[0, 6371], y=[0, 15], xlabel='depth (km)', ylabel='wave speed (km/s)', vlines=[dict(x=35, label='Moho'), dict(x=2891, label='core'), dict(x=5150, label='inner core')],
     params=[P('dp', 'depth', 0, 6371, 2891, 'km')], readouts=[R('distance from centre', '6371-dp', 'km'), R('pressure ≈ (rough)', 'dp<2891 ? dp*0.0265+dp^2*1.0e-6*0.6 : 130+(dp-2891)*0.0674', 'GPa')])
S['earth_interior']['params'] = [P('dp', 'depth', 0, 6371, 2891, 'km')]
S['earth_interior']['readouts'] = [R('distance from the centre', '6371-dp', 'km')]

plot('plate_tectonics', 'Seafloor spreads away from mid-ocean ridges, so the ocean crust gets older with distance: age = distance / rate. The Atlantic opens at ~2.5 cm/yr (full rate); the East Pacific Rise spreads over five times faster.',
     [F('x/(5*v)', 'seafloor age', 'accent')], x=[0, 2000], y=[0, 200], xlabel='distance from the ridge (km, each side)', ylabel='crust age (million years)',
     params=[P('v', 'full spreading rate', 2, 15, 2.5, 'cm/yr')], hlines=[dict(y=180, label='oldest ocean crust ~180 Myr')],
     readouts=[R('age 1000 km out', '1000/(5*v)', 'Myr')])

plot('seismology', 'Earthquakes send P waves (faster) and S waves (slower). The delay between their arrivals tells you how far away the quake was: distance = (tS − tP) / (1/vS − 1/vP). Crustal speeds shown.',
     [F('x/vp', 'P wave', 'accent'), F('x/vs', 'S wave', 'pink')], x=[0, 1500], y=[0, 450], xlabel='distance from the earthquake (km)', ylabel='arrival time (s)',
     params=[P('vp', 'P speed', 5.5, 8, 6.5, 'km/s'), P('vs', 'S speed', 3, 4.6, 3.7, 'km/s'), P('d', 'station distance', 50, 1500, 500, 'km')],
     points=[dict(x='d', y='d/vp', color='accent'), dict(x='d', y='d/vs', color='pink')], readouts=[R('S–P delay', 'd/vs-d/vp', 's'), R('distance from delay', '(d/vs-d/vp)/(1/vs-1/vp)', 'km')])

plot('volcanism', 'Silica-rich magma is thousands to billions of times more viscous than basalt. Runny basalt lets gas escape (gentle lava flows); sticky rhyolite traps gas and erupts explosively. Values approximate.',
     [F('10^(2+0.35*(x-50))', 'magma viscosity', 'accent')], x=[45, 78], y=[10, 1e12], logy=True, xlabel='silica content (wt% SiO₂)', ylabel='viscosity (Pa·s)',
     vlines=[dict(x=50, label='basalt', color='gold'), dict(x=60, label='andesite', color='gold'), dict(x=72, label='rhyolite', color='gold')], params=[P('si', 'silica', 45, 78, 52, '%')],
     points=[dict(x='si', y='10^(2+0.35*(si-50))')], readouts=[R('viscosity', '10^(2+0.35*(si-50))', 'Pa·s')])

geo('mountain_building', 'Crust floats on the denser mantle like an iceberg: a mountain of height h has a root about 5–6 times deeper (Airy isostasy). Raise the mountain and see the root. Continental crust is ~35 km thick normally.',
    [-30, 30, -90, 15],
    [Rc(-30, -90, 60, 55, 'gold', 'gold', alpha=0.15), T(-26, -80, 'mantle (3300 kg/m³)', 'gold', 10, 'left'),
     Pg([[-30, 0], [-12, 0], [0, 'h'], [12, 0], [30, 0], [30, -35], [12, -35], [0, '-35-h*2800/500'], [-12, -35], [-30, -35]], 'accent', 'accent', alpha=0.35),
     T(-26, -16, 'crust (2800 kg/m³)', 'accent', 10, 'left'), T(0, 'h+4', 'height {h} km', 'white', 10), T(0, '-35-h*2800/500-6', 'root {h*5.6} km deeper', 'pink', 10)],
    params=[P('h', 'mountain height', 0, 8, 4, 'km')], readouts=[R('root depth below normal crust', 'h*2800/(3300-2800)', 'km'), R('total crust thickness', '35+h+h*2800/500', 'km')], equal=False, aspect=0.9)

plot('weathering_erosion', 'Rivers and wind sort grains by settling speed (Stokes: v ∝ d²). Fine clay stays suspended for ages, sand drops quickly, which is why sediments pile up in layers sorted by size.',
     [F('9.0e-7*(rs-1000)/1650*x^2', 'settling speed in water', 'accent')], x=[1, 300], y=[1e-6, 1], logx=True, logy=True, xlabel='grain diameter (µm)', ylabel='settling speed (m/s)',
     vlines=[dict(x=4, label='clay | silt', color='gold'), dict(x=63, label='silt | sand', color='gold')], params=[P('rs', 'grain density', 1500, 3500, 2650, 'kg/m³')],
     readouts=[R('100 µm sand grain falls at', '9.0e-7*(rs-1000)/1650*100^2*1000', 'mm/s')])

bars('soil_biology', 'A gram of healthy soil is crowded with life, mostly invisible: a billion bacteria, fungal threads, protozoa and a few nematodes. Soil organisms drive decomposition and nutrient cycling. (Approximate counts per gram.)',
     [('bacteria', 1e9, 'accent'), ('actinomycetes', 1e8), ('fungal propagules', 1e6, 'gold'), ('protozoa', 1e5, 'green'), ('nematodes', 10, 'pink')], logy=True, ylabel='organisms per gram')

bars('deep_time', 'How long ago things happened: Earth formed 4.54 billion years ago; complex animals only appeared ~0.57 Ga, and our species ~0.3 million years ago, a sliver of the whole.',
     [('Earth forms', 4.54, 'gold'), ('earliest life', 3.7), ('oxygen rises', 2.4), ('animals', 0.57), ('dinosaurs', 0.23), ('H. sapiens', 0.0003, 'pink')], logy=True, ylabel='billions of years ago')

add('geodynamo', dict(type='field', range=[-3, 3, -3, 3], mode='stream', vx='(3*(sin(a)*x+cos(a)*y)*x-sin(a)*(x^2+y^2))/(x^2+y^2)^2.5', vy='(3*(sin(a)*x+cos(a)*y)*y-cos(a)*(x^2+y^2))/(x^2+y^2)^2.5',
    shapes=[C(0, 0, 0.8, 'gold', 'gold', alpha=0.25), T(0, 0, 'core', 'gold', 10)], params=[P('a', 'dipole tilt', 0, 3.1416, 0.2, 'rad')],
    readouts=[R('tilt', 'deg(a)', '°')],
    caption='Earth\'s magnetic field is roughly a dipole made by flowing liquid iron in the outer core. Field lines are shown outside the core. Slide the tilt to π (180°) for a reversal: the field has flipped many times, most recently ~780,000 years ago.'))

blocks('oceans_circulation', 'Ocean currents form a global conveyor: warm surface water flows poleward, cools and sinks near Greenland and Antarctica, flows back along the deep ocean, and rises elsewhere. A full loop takes ~1000 years.',
       [('w', 'Warm surface current', 14, 20, 'pink'), ('c', 'Cools, sinks (N Atlantic)', 86, 20, 'accent'), ('d', 'Deep return flow', 86, 80, 'accent'), ('u', 'Upwelling', 14, 80, 'green')],
       [('w', 'c'), ('c', 'd'), ('d', 'u'), ('u', 'w')], aspect=0.6)
S['oceans_circulation']['nodes'][1]['label'] = 'Sinks (N Atlantic)'

plot('tides', 'The Moon and Sun each raise tides with different periods (12.42 h and 12.00 h). When they line up we get big spring tides; half a month later they oppose and tides are small (neap). Change the Sun\'s strength to see the beat.',
     [F('cos(2*pi*x/12.42)+r*cos(2*pi*x/12)', 'tide height', 'accent')], x=[0, 360], xlabel='time (hours, ~15 days)', ylabel='relative tide height', params=[P('r', 'Sun / Moon tide ratio', 0.2, 1, 0.46)],
     readouts=[R('spring/neap range ratio', '(1+r)/(1-r)')])

add('coriolis_effect', dict(type='parametric', range=[-5.2, 5.2, -5.2, 5.2], curves=[dict(x='s*cos(om*s)', y='-s*sin(om*s)', s=[0, 5], color='accent', dot='mod(t*0.8,5)')],
    shapes=[T(0, 0, 'centre', 'dim', 10), T(-2.5, 5, 'path seen by someone on the turntable', 'dim', 10)], params=[P('om', 'rotation rate Ω', 0, 0.6, 0.25)],
    readouts=[R('Coriolis acceleration 2Ωv (v = 1)', '2*om')],
    caption='Roll a ball straight outward from the centre of a spinning turntable: it moves straight for an outside observer, but along a curve for someone standing on the turntable. That apparent deflection is the Coriolis effect, which bends winds and ocean currents on rotating Earth.'))

alt = [(0, 15), (11, -56.5), (20, -56.5), (32, -44.5), (47, -2.5), (51, -2.5), (71, -58.5), (86, -86.3)]
plot('atmosphere_structure', 'Temperature falls with height in the troposphere (weather layer, ~6.5 °C/km), rises in the stratosphere (the ozone layer absorbs UV), then falls again in the mesosphere. Standard-atmosphere values.',
     [F(pwl(alt), 'temperature', 'accent')], x=[0, 86], y=[-100, 30], xlabel='altitude (km)', ylabel='temperature (°C)',
     vlines=[dict(x=11, label='tropopause', color='gold'), dict(x=50, label='stratopause', color='gold'), dict(x=85, label='mesopause', color='gold')], params=[P('z', 'altitude', 0, 86, 11, 'km')],
     points=[dict(x='z', y=pwl(alt).replace('x', 'z'))])
S['atmosphere_structure']['readouts'] = [R('temperature', pwl(alt).replace('x', 'z'), '°C')]

plot('greenhouse_effect', 'Without an atmosphere Earth would sit at about −18 °C. A layer that absorbs part (ε) of the infrared leaving the surface warms it: with ε ≈ 0.78 the surface is ~15 °C. Slide ε and the albedo.',
     [F('(1361*(1-al)/(4*5.670374e-8))^0.25*(2/(2-x))^0.25-273.15', 'surface temperature', 'accent')], x=[0, 1], xlabel='infrared absorption by the atmosphere ε', ylabel='surface temperature (°C)',
     params=[P('al', 'albedo', 0.1, 0.5, 0.3), P('ep', 'atmosphere ε', 0, 1, 0.78)], points=[dict(x='ep', y='(1361*(1-al)/(4*5.670374e-8))^0.25*(2/(2-ep))^0.25-273.15', label='{(1361*(1-al)/(4*5.670374e-8))^0.25*(2/(2-ep))^0.25-273.15} °C')],
     readouts=[R('no atmosphere', '(1361*(1-al)/(4*5.670374e-8))^0.25-273.15', '°C'), R('with this atmosphere', '(1361*(1-al)/(4*5.670374e-8))^0.25*(2/(2-ep))^0.25-273.15', '°C')])

plot('atmospheric_circulation', 'Three cells per hemisphere give belts of high and low pressure with trade winds and westerlies in between. Pressure (blue, relative to average) is low at the equator and 60°, high near 30° and the poles. The thermal equator shifts with the seasons.',
     [F('-6*cos(2*pi*(x-sh)/60)', 'sea-level pressure anomaly (hPa)', 'accent'), F('-6*sin(2*pi*(x-sh)/60)', 'surface east–west wind (m/s, + = westerly)', 'pink')], x=[0, 90], y=[-8, 8], xlabel='latitude (°N)', ylabel='anomaly',
     params=[P('sh', 'seasonal shift of the belts', 0, 10, 0, '°')], vlines=[dict(x=30, label='subtropical high'), dict(x=60, label='subpolar low')])

geo('weather_dynamics', 'A rising air parcel cools 9.8 °C/km until its temperature hits the dew point; there water vapour condenses into cloud (the lifting condensation level, ~125 m per degree of gap). Above that it cools more slowly.',
    [0, 1, 0, 1], [], aspect=0.5)
del S['weather_dynamics']
plot('weather_dynamics', 'A rising air parcel cools 9.8 °C/km until it reaches its dew point, where vapour condenses into cloud (cloud base ≈ 125 m for each °C of gap). Above that it cools more slowly (~5 °C/km) as condensation releases heat.',
     [F('x<0.125*(T0-Td) ? T0-9.8*x : T0-9.8*0.125*(T0-Td)-5*(x-0.125*(T0-Td))', 'rising parcel', 'accent'), F('T0-6.5*x', 'surrounding air', 'pink', dash=True), F('x<0.125*(T0-Td) ? Td-1.8*x : 0/0', 'dew point', 'green', dash=True)],
     x=[0, 6], y=[-40, 35], xlabel='height (km)', ylabel='temperature (°C)', params=[P('T0', 'surface temperature', 10, 35, 25, '°C'), P('Td', 'surface dew point', 0, 25, 15, '°C')],
     vlines=[dict(x='0.125*(T0-Td)', label='cloud base', color='gold')], readouts=[R('cloud base', '125*(T0-Td)', 'm')])
S['weather_dynamics']['fns'][2]['f'] = 'sqrt(0.125*(T0-Td)-x)*0+Td-1.8*x'

plot('weather_prediction', 'Small errors in the starting state grow roughly exponentially (error doubling in ~1.5–3 days), so forecasts lose skill after about 1–2 weeks regardless of computing power. Cutting initial error by 10× buys only a few extra days.',
     [F('1/(1+(1/e0-1)*exp(-ln(2)*x/dd))', 'forecast error', 'pink')], x=[0, 21], y=[0, 1.05], xlabel='forecast lead time (days)', ylabel='error (fraction of saturation)',
     params=[P('e0', 'initial error', 0.00001, 0.05, 0.001), P('dd', 'error doubling time', 1, 4, 2, 'days')], hlines=[dict(y=0.5, label='forecast useless')],
     readouts=[R('days until error reaches 50%', 'dd/ln(2)*ln((1-e0)/e0)', 'days')])

plot('hurricanes_storms', 'A deeper low-pressure centre means stronger winds (Atkinson–Holliday: v ≈ 6.7 (1010 − p)^0.644 kt). Saffir–Simpson categories mark wind thresholds from 64 to 137 knots.',
     [F('6.7*(1010-x)^0.644', 'maximum wind', 'accent')], x=[880, 1005], y=[0, 190], xlabel='central pressure (hPa)', ylabel='wind speed (knots)',
     hlines=[dict(y=64, label='Cat 1'), dict(y=83, label='Cat 2'), dict(y=96, label='Cat 3'), dict(y=113, label='Cat 4'), dict(y=137, label='Cat 5')], params=[P('p', 'central pressure', 880, 1005, 940, 'hPa')],
     points=[dict(x='p', y='6.7*(1010-p)^0.644')], readouts=[R('wind', '6.7*(1010-p)^0.644', 'kt'), R('wind', '6.7*(1010-p)^0.644*1.852', 'km/h')])

blocks('water_cycle', 'Earth\'s water cycle in thousands of km³ per year: the ocean loses more by evaporation than it gains from rain, and the surplus returns by river runoff. Ocean: −434 + 398 + 36 = 0.',
       [('o', 'Ocean', 14, 82, 'accent'), ('a', 'Atmosphere', 50, 12, 'gold'), ('l', 'Land', 86, 82, 'green')],
       [('o', 'a', 'evap 434'), ('a', 'o', 'rain 398'), ('l', 'a', 'ET 71'), ('a', 'l', 'rain 107'), ('l', 'o', 'runoff 36')], aspect=0.62)

blocks('biogeochemical_cycles', 'Carbon moves between reservoirs (GtC per year, approximate): plants take up ~120 and ecosystems return ~120; oceans trade ~90 each way; burning fossil fuels adds ~10 net, which is why atmospheric CO₂ rises.',
       [('at', 'Atmosphere (~875 GtC)', 50, 10, 'gold'), ('la', 'Land plants + soil', 12, 70, 'green'), ('oc', 'Ocean', 88, 70, 'accent'), ('ff', 'Fossil fuels', 50, 92, 'pink')],
       [('at', 'la', 'photosynthesis 120'), ('la', 'at', 'respiration 120'), ('at', 'oc', 'dissolves 90'), ('oc', 'at', 'out-gasses 90'), ('ff', 'at', 'burning ~10')], aspect=0.7)
S['biogeochemical_cycles']['nodes'][0]['label'] = 'Atmosphere'
S['biogeochemical_cycles']['edges'] = [{'from': 'at', 'to': 'la', 'label': '120'}, {'from': 'la', 'to': 'at', 'label': '120'}, {'from': 'at', 'to': 'oc', 'label': '90'}, {'from': 'oc', 'to': 'at', 'label': '90'}, {'from': 'ff', 'to': 'at', 'label': '~10'}]
S['biogeochemical_cycles']['caption'] = 'Carbon moves between reservoirs (GtC per year, approximate): plants and ecosystems swap ~120, oceans trade ~90 each way, and burning fossil fuels adds ~10 net, which is why atmospheric CO₂ rises.'

blocks('nitrogen_cycle', 'Nitrogen gas (78% of air) is useless to most life until fixed. Bacteria, lightning and industry (Haber–Bosch) fix it; microbes convert it through ammonium and nitrate; denitrifiers return it to the air.',
       [('n2', 'N₂ in air', 50, 8, 'gold'), ('nh', 'Ammonium NH₄⁺', 88, 50), ('no', 'Nitrate NO₃⁻', 50, 92), ('or', 'Organic N (living things)', 12, 50, 'green')],
       [('n2', 'nh', 'fixation'), ('nh', 'no', 'nitrification'), ('no', 'n2', 'denitrification'), ('no', 'or', 'uptake'), ('or', 'nh', 'decay')], aspect=0.7)
S['nitrogen_cycle']['nodes'][3]['label'] = 'Organic N'

plot('carbon_cycle_climate', 'Atmospheric CO₂ has risen from about 280 ppm before industry to over 420 ppm today. The seasonal wiggle is the Northern Hemisphere\'s plants breathing in and out. A smooth fit to the Mauna Loa record (approximate).',
     [F('280+35*exp((x-1958)/46.6)+3*sin(2*pi*(x-0.3))', 'CO₂ (ppm)', 'accent')], x=[1958, 2024], y=[300, 430], xlabel='year', ylabel='CO₂ (parts per million)', hlines=[dict(y=280, label='pre-industrial 280')],
     params=[P('yr', 'year', 1958, 2024, 2023)], points=[dict(x='yr', y='280+35*exp((yr-1958)/46.6)')], readouts=[R('CO₂ in that year (trend)', '280+35*exp((yr-1958)/46.6)', 'ppm')])

plot('ocean_acidification', 'The ocean absorbs about a quarter of our CO₂, which lowers its pH (more acidic) and makes it harder for shells and corals to form. Surface pH has dropped by ~0.1, a ~30% rise in H⁺. Approximate relation.',
     [F('8.17-0.8*log10(x/280)', 'surface ocean pH', 'accent')], x=[250, 1000], y=[7.6, 8.25], xlabel='atmospheric CO₂ (ppm)', ylabel='surface ocean pH',
     params=[P('c', 'atmospheric CO₂', 250, 1000, 420, 'ppm')], points=[dict(x='c', y='8.17-0.8*log10(c/280)')],
     readouts=[R('pH', '8.17-0.8*log10(c/280)'), R('H⁺ increase vs pre-industrial', '(10^(0.8*log10(c/280))-1)*100', '%')])

plot('climate_system', 'Doubling CO₂ adds ~3.7 W/m² of forcing; the warming that results is the climate sensitivity (likely 2.5–4 °C per doubling; best estimate ~3). Equilibrium warming grows with each doubling, i.e. with log₂(CO₂).',
     [F('ecs*log2(x/280)', 'equilibrium warming', 'accent')], x=[280, 840], y=[0, 5], xlabel='CO₂ (ppm)', ylabel='warming vs pre-industrial (°C)',
     params=[P('ecs', 'sensitivity per doubling', 1.5, 5, 3, '°C'), P('c', 'CO₂', 280, 840, 420, 'ppm')], points=[dict(x='c', y='ecs*log2(c/280)', label='{ecs*log2(c/280)} °C')],
     readouts=[R('forcing 5.35 ln(C/C₀)', '5.35*ln(c/280)', 'W/m²'), R('eventual warming', 'ecs*log2(c/280)', '°C')])

plot('milankovitch', 'Slow wobbles in Earth\'s orbit pace the ice ages: tilt every 41 kyr, precession every 23 kyr (strength modulated by the ~100 kyr eccentricity cycle). Add them to see the combined insolation-like signal (idealised).',
     [F('a*cos(2*pi*x/41)', 'tilt (41 kyr)', 'accent'), F('b*(1+0.6*cos(2*pi*x/100))*cos(2*pi*x/23)', 'precession (23 kyr)', 'pink'), F('a*cos(2*pi*x/41)+b*(1+0.6*cos(2*pi*x/100))*cos(2*pi*x/23)', 'sum', 'gold', width=3)],
     x=[-400, 0], xlabel='time (thousand years before present)', ylabel='relative summer insolation', params=[P('a', 'tilt weight', 0, 1, 0.6), P('b', 'precession weight', 0, 1, 0.6)])

bars('ice_sheets', 'If an ice sheet melted entirely, sea level would rise by about: East Antarctica 53 m, Greenland 7 m, West Antarctica 5 m, all mountain glaciers only ~0.4 m. Melting takes centuries to millennia.',
     [('mountain glaciers', 0.4), ('West Antarctica', 5.3, 'pink'), ('Greenland', 7.4, 'accent'), ('East Antarctica', 53, 'gold')], ylabel='potential sea-level rise (m)')

add('amoc_node', dict(type='parametric', range=[-1.2, 1.2, -1.5, 1.5], equal=False, curves=[dict(x='s-s^3', y='s', s=[-1.3, 1.3], color='accent')],
    shapes=[L('F', -1.5, 'F', 1.5, 'gold', 2), T('F', 1.35, 'now', 'gold', 10), T(0.75, 1.2, 'strong circulation', 'accent', 10), T(-0.75, -1.2, 'collapsed', 'pink', 10), T(0, 0, 'unstable', 'dim', 10)],
    params=[P('F', 'freshwater input', -0.6, 0.6, 0.2)], readouts=[R('tipping point at', '0.385')],
    caption='A toy model of the Atlantic overturning: two stable states (strong, collapsed) joined by an unstable middle branch. Past the fold (here at 0.385) the strong branch ends and the system jumps. Whether and when the real AMOC could tip is uncertain.'))

plot('ozone_layer', 'Ozone is concentrated in the stratosphere (peak near 22 km) where it absorbs harmful UV. Chlorine from CFCs destroys it, most dramatically at 14–20 km over Antarctica in spring (the ozone hole). Slide the depletion.',
     [F('14*exp(-((x-22)/6)^2)', 'normal ozone', 'accent'), F('14*exp(-((x-22)/6)^2)*(1-dp*exp(-((x-17)/3.5)^2))', 'with depletion', 'pink')], x=[0, 45], y=[0, 16], xlabel='altitude (km)', ylabel='ozone partial pressure (mPa)',
     params=[P('dp', 'depletion', 0, 0.95, 0.9)], readouts=[R('ozone left at 17 km', '100*(1-dp)', '%')])
