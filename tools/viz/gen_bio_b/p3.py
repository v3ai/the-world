from lib import *
import math

# ---------------- IMMUNOLOGY ----------------
hub('bio_immuno', 'The immune system has a fast, general innate arm and a slower, specific adaptive arm; they cooperate and the adaptive arm remembers.',
    'Immune system', ['Innate defence', 'Adaptive: T cells', 'Adaptive: B cells', 'Memory and vaccines', 'Disorders', 'Cytokine signals'],
    colors=['orange', 'accent', 'green', 'gold', 'red', 'purple'], aspect=0.95)

blocks('bio_innate_immunity', 'Innate defence in seconds to hours: a macrophage senses microbial patterns, releases cytokines, and calls neutrophils to the site, producing the signs of inflammation.',
    [nd('a', 'skin breached', 22, 8, 'red'), nd('b', 'macrophage senses', 74, 8, 'accent'), nd('c', 'cytokines TNF, IL-1', 74, 38, 'purple'), nd('d', 'vessels leak', 20, 66, 'gold'), nd('e', 'neutrophils', 74, 66, 'green'), nd('f', 'phagocytosis', 50, 94, 'green')],
    [('a', 'b'), ('b', 'c'), ('c', 'd'), ('c', 'e'), ('d', 'e'), ('e', 'f')], aspect=0.85)

blocks('bio_antigen_presentation_mhc', 'MHC I shows peptides from inside any cell to killer (CD8) T cells; MHC II shows peptides taken up by antigen-presenting cells to helper (CD4) T cells.',
    [nd('a', 'viral peptide', 10, 12, 'red'), nd('b', 'MHC I', 50, 12, 'accent'), nd('c', 'CD8 T', 88, 12, 'green'),
     nd('d', 'engulfed', 10, 62, 'orange'), nd('e', 'MHC II', 50, 62, 'purple'), nd('f', 'CD4 T', 88, 62, 'gold')],
    [('a', 'b', 'any cell'), ('b', 'c'), ('d', 'e', 'APC'), ('e', 'f')], aspect=0.6)

blocks('bio_t_cell_immunity', 'An antigen-presenting cell activates naïve T cells; helper T cells then coordinate other cells while cytotoxic T cells kill infected ones.',
    [nd('a', 'APC', 8, 50, 'orange'), nd('b', 'naïve T', 36, 50, 'accent'), nd('c', 'helper T', 80, 22, 'gold'), nd('d', 'cytotoxic T', 80, 78, 'red'), nd('e', 'help B cells', 80, 2, 'green'), nd('f', 'kill infected', 80, 98, 'pink')],
    [('a', 'b'), ('b', 'c'), ('b', 'd'), ('c', 'e'), ('d', 'f')], aspect=0.7)

geo('bio_b_cells_antibodies', 'An antibody is Y-shaped: two identical antigen-binding arms (Fab) and a tail (Fc) that signals other immune cells. Move the slider to flex the hinge.',
    [-10, 10, -4, 12],
    [L(0, 0, 0, 5, 'accent', 5), L(0, 5, '-6*sin(h)', '5+6*cos(h)', 'accent', 5), L(0, 5, '6*sin(h)', '5+6*cos(h)', 'accent', 5),
     L('0.8', 0, '0.8', 5, 'green', 3, dash=True), L('-0.8', 0, '-0.8', 5, 'green', 3, dash=True),
     C('-6*sin(h)', '5+6*cos(h)', 0.9, 'gold', 'gold', alpha=.5), C('6*sin(h)', '5+6*cos(h)', 0.9, 'gold', 'gold', alpha=.5),
     T('-6*sin(h)', '5+6*cos(h)+1.6', 'antigen-binding site', 'gold', 10, 'center'), T(0, -1.6, 'Fc tail (effector functions)', 'accent', 10, 'center'),
     T(3, 3.4, 'hinge', 'white', 10, 'left'), T(-9.5, 1.5, 'heavy chain (blue) + light chain (dashed)', 'dim', 9, 'left')],
    params=[P('h', 'hinge angle', 0.2, 1.2, 0.7, step=0.05)], aspect=0.7)

plot('bio_antibody_diversity', 'V(D)J recombination picks one segment from each gene pool, so a few hundred gene segments give millions of distinct antibodies. Change the pool sizes and watch the total multiply.',
    fns=[F('V*D*Jh*x', 'heavy × light combinations', 'accent', width=2.6)], x=[0, 100], logy=True, y=[1000, 1e9], xlabel='light-chain variants', ylabel='distinct antibodies',
    points=[{'x': 'Lc', 'y': 'V*D*Jh*Lc', 'label': '{V*D*Jh*Lc}'}],
    params=[P('V', 'V segments', 20, 60, 40, step=1), P('D', 'D segments', 10, 30, 25, step=1), P('Jh', 'J segments', 4, 8, 6, step=1), P('Lc', 'light-chain variants', 10, 100, 70, step=1)],
    readouts=[R('heavy-chain combinations', 'V*D*Jh'), R('total (before junction diversity)', 'V*D*Jh*Lc')])

plot('bio_immune_memory_clonal', 'The first exposure gives a slow, low IgM response; a second exposure meets memory cells, so antibody rises faster, higher and lasts longer. Move the slider for the second dose.',
    fns=[F('10^(3*exp(-((x-14)/6)^2)*(x>5)+0*x)', 'x', 'dim')], x=[0, 60], logy=True, y=[1, 100000], xlabel='days', ylabel='antibody titre',
    vlines=[{'x': 0, 'label': '1st dose'}, {'x': 'g', 'label': '2nd dose'}], params=[P('g', 'second exposure', 20, 40, 28, step=1, unit='day')])
S['bio_immune_memory_clonal']['fns'] = [F('10^(1+2*exp(-((x-14)/6)^2))*(x>4)+0*x', 'primary (mostly IgM)', 'accent', width=2.6)]
S['bio_immune_memory_clonal']['fns'].append(F('(x>g+1.5)*10^(1+3.6*exp(-((x-g-7)/8)^2))+0*x', 'secondary (IgG)', 'gold', width=2.6))
S['bio_immune_memory_clonal']['fns'][0]['f'] = '(x>4)*10^(1+2*exp(-((x-14)/6)^2))+(x<=4)*10'

plot('bio_vaccines', 'Herd immunity threshold: when a fraction 1 − 1/R₀ of the population is immune, each case infects fewer than one other person. Diseases with higher R₀ need higher coverage.',
    fns=[F('100*(1-1/x)', 'threshold = 1 − 1/R₀', 'accent', width=2.6)], x=[1, 20], y=[0, 100], xlabel='R₀', ylabel='% immune needed',
    points=[{'x': 'R0', 'y': '100*(1-1/R0)', 'label': '{100*(1-1/R0)}%'}],
    params=[P('R0', 'basic reproduction number R₀', 1.2, 20, 15, step=0.1)], readouts=[R('threshold', '100*(1-1/R0)', '%')])

hub('bio_hypersensitivity_autoimmunity', 'Hypersensitivity reactions are grouped by mechanism, from immediate IgE allergy to delayed T-cell reactions; autoimmunity is the same machinery aimed at self.',
    'Overreaction', ['I: IgE', 'II: antibody', 'III: complex', 'IV: T cell', 'Autoimmune'],
    colors=['red', 'orange', 'gold', 'green', 'purple'], aspect=1.0)

blocks('bio_immunodeficiency_transplant', 'Host T cells recognise the graft\'s foreign MHC and attack it; immunosuppressants such as cyclosporine block IL-2 signalling and so T-cell activation.',
    [nd('a', 'foreign donor MHC', 30, 10, 'orange'), nd('b', 'host T cells', 22, 50, 'accent'), nd('c', 'graft attacked', 80, 50, 'red'), nd('d', 'cyclosporine', 50, 90, 'green')],
    [('a', 'b'), ('b', 'c'), {'from': 'd', 'to': 'b', 'label': 'blocks IL-2', 'dashed': True, 'color': 'green'}], aspect=0.65)

blocks('bio_cancer_immunotherapy', 'Tumours can switch T cells off by displaying PD-L1 to the PD-1 receptor. Checkpoint-blocking antibodies release the brake so the T cell can kill again.',
    [nd('t', 'tumour PD-L1', 15, 15, 'red'), nd('c', 'T cell PD-1', 80, 15, 'accent'), nd('a', 'anti-PD-1', 80, 80, 'green'), nd('k', 'tumour killed', 15, 80, 'gold')],
    [{'from': 't', 'to': 'c', 'label': 'inhibits', 'color': 'red'}, {'from': 'a', 'to': 'c', 'label': 'blocks', 'dashed': True, 'color': 'green'}, {'from': 'c', 'to': 'k'}], aspect=0.65)

plot('bio_immunoassays', 'An ELISA standard curve is S-shaped (4-parameter logistic). Read a sample\'s absorbance on the curve to find its concentration; the readout inverts the curve.',
    fns=[F('0.05+(2.5-0.05)/(1+(50/x)^1.2)', 'OD at 450 nm', 'accent', width=2.6)], x=[1, 1000], logx=True, y=[0, 2.8], xlabel='concentration (ng/mL)', ylabel='absorbance',
    hlines=[{'y': 'od', 'label': 'sample OD'}], points=[{'x': '50*((od-0.05)/(2.5-od))^(1/1.2)', 'y': 'od', 'label': '{50*((od-0.05)/(2.5-od))^(1/1.2)} ng/mL'}],
    params=[P('od', 'sample absorbance', 0.1, 2.3, 1, step=0.05)], readouts=[R('concentration', '50*((od-0.05)/(2.5-od))^(1/1.2)', 'ng/mL')])

# ---------------- ECOLOGY ----------------
chain('bio_ecology', 'Ecology studies life at nested levels: individuals form populations, which form communities, which with their environment make ecosystems and the biosphere.',
      ['organism', 'population', 'community', 'ecosystem', 'biosphere'], colors=['green', 'accent', 'gold', 'orange', 'purple'])

plot('bio_ecology_scope', 'Two species use a resource gradient (food size, say). As their niche centres move apart, overlap shrinks and competition weakens. Slide the separation.',
    fns=[F('gauss(x,5-d/2,1)', 'species A', 'accent'), F('gauss(x,5+d/2,1)', 'species B', 'pink')], x=[0, 10], xlabel='resource gradient', ylabel='use',
    params=[P('d', 'niche separation', 0, 6, 1.5, step=0.1)], readouts=[R('niche overlap', '1-erf(d/(2*sqrt(2)))', None)])

plot('bio_population_structure', 'Survivorship curves: type I (humans) die late, type II (birds) at a constant rate, type III (oysters, fish) die mostly when young. The y-axis is logarithmic.',
    fns=[F('1000*(1-(x/100)^4)', 'type I', 'green'), F('1000*exp(-x/35)', 'type II', 'gold'), F('1000*exp(-5*x/100)*(1-x/100)+0*x+1', 'type III', 'pink')],
    x=[0, 100], logy=True, y=[1, 1000], xlabel='percent of life span', ylabel='survivors per 1000')
S['bio_population_structure']['fns'][0]['f'] = '1000*(1-(x/100)^4)+0.1'
S['bio_population_structure']['fns'][2]['f'] = '1000*exp(-0.065*x)+1'

plot('bio_exponential_logistic_growth', 'Unlimited growth is exponential (dashed); resources limit it to a logistic S-curve that levels off at the carrying capacity K. Growth is fastest at K/2.',
    fns=[F('N0*exp(r*x)', 'exponential', 'dim', True), F('K/(1+((K-N0)/N0)*exp(-r*x))', 'logistic', 'accent', width=2.6)], x=[0, 30], y=[0, 1200], xlabel='time (generations)', ylabel='population N',
    hlines=[{'y': 'K', 'label': 'K'}], params=[P('r', 'growth rate r', 0.05, 0.8, 0.3, step=0.01), P('K', 'carrying capacity K', 200, 1000, 800, step=10), P('N0', 'start N₀', 5, 100, 20, step=1)],
    readouts=[R('doubling time', 'ln(2)/r', 'gen'), R('max growth rate rK/4', 'r*K/4', 'per gen')])

plot('bio_life_history_regulation', 'Density dependence: birth rate falls and death rate rises as the population grows. They cross at the carrying capacity K, where growth stops. Raise the baseline birth rate to raise K.',
    fns=[F('b0-0.0004*x', 'birth rate', 'green'), F('0.1+0.0003*x', 'death rate', 'red')], x=[0, 1000], y=[0, 0.8], xlabel='population size N', ylabel='per capita rate',
    vlines=[{'x': '(b0-0.1)/0.0007', 'label': 'K'}], params=[P('b0', 'baseline births', 0.3, 0.7, 0.5, step=0.01)], readouts=[R('equilibrium K', '(b0-0.1)/0.0007')])

plot('bio_metapopulations_human_growth', 'Levins\' model: patches are colonised at rate c and go extinct at rate e. The fraction occupied settles at p* = 1 − e/c, and falls to zero if extinction outpaces colonisation.',
    fns=[F('c*x*(1-x)-e*x', 'dp/dt', 'accent', width=2.6)], x=[0, 1], xlabel='fraction of patches occupied p', ylabel='dp/dt', hlines=[{'y': 0, 'label': ''}],
    vlines=[{'x': 'max(0,1-e/c)', 'label': 'p*'}], params=[P('c', 'colonisation c', 0.1, 1, 0.5, step=0.01), P('e', 'extinction e', 0.02, 0.8, 0.15, step=0.01)],
    readouts=[R('equilibrium p*', 'max(0,1-e/c)')])

plot('bio_competition_predation', 'Lotka–Volterra predators and prey rise and fall out of step: prey (green) peak first, predators (pink) follow. This small-cycle approximation has period 2π/√(αγ). Change the rates and watch the beat.',
    fns=[F('(g/dl)*(1+A*cos(sqrt(al*g)*x))', 'prey', 'green', width=2.6), F('(al/be)*(1+A*sqrt(g/al)*sin(sqrt(al*g)*x))', 'predator', 'pink', width=2.6)],
    x=[0, 40], y=[0, 3], xlabel='time', ylabel='population (scaled)',
    points=[{'x': 'mod(t*3,40)', 'y': '(g/dl)*(1+A*cos(sqrt(al*g)*mod(t*3,40)))', 'color': 'green'}, {'x': 'mod(t*3,40)', 'y': '(al/be)*(1+A*sqrt(g/al)*sin(sqrt(al*g)*mod(t*3,40)))', 'color': 'pink'}],
    params=[P('al', 'prey growth α', 0.3, 1.2, 0.6, step=0.05), P('g', 'predator death γ', 0.3, 1.2, 0.5, step=0.05), P('A', 'cycle size', 0.1, 0.6, 0.4, step=0.05)],
    readouts=[R('cycle period', '2*pi/sqrt(al*g)', 'time units')], dl=1, be=1)
sp = S['bio_competition_predation']
for k in ('dl', 'be'): del sp[k]
for f in sp['fns']: f['f'] = f['f'].replace('g/dl', 'g').replace('al/be', 'al')
for p in sp['points']: p['y'] = p['y'].replace('g/dl', 'g').replace('al/be', 'al')

hub('bio_symbiosis', 'Symbiosis covers close, long-term partnerships classed by who gains: both (mutualism), one at no cost to the other (commensalism), or one at the other\'s expense (parasitism).',
    'Symbiosis', ['Mutualism +/+', 'Commensal +/0', 'Parasitism +/−'], colors=['green', 'accent', 'red'], aspect=0.7)

plot('bio_community_structure', 'Shannon diversity H = −Σ pᵢ ln pᵢ with one dominant species at share p and the rest equal. H is highest when all S species are equally common (p = 1/S, H = ln S).',
    fns=[F('-x*ln(x)-(1-x)*ln((1-x)/(S-1))', 'H', 'accent', width=2.6)], x=[0.05, 0.98], y=[0, 3.2], xlabel='share of the dominant species p', ylabel='H (nats)',
    hlines=[{'y': 'ln(S)', 'label': 'max = ln S'}], vlines=[{'x': '1/S', 'label': '1/S'}], params=[P('S', 'species richness S', 2, 20, 8, step=1)], readouts=[R('max H = ln S', 'ln(S)')])

plot('bio_succession_disturbance', 'Intermediate disturbance hypothesis: richness peaks at moderate disturbance, where neither dominants nor pioneers take over. Shift the peak to match a different habitat.',
    fns=[F('6+34*exp(-((x-m)/0.22)^2)', 'species richness', 'green', width=2.6)], x=[0, 1], y=[0, 45], xlabel='disturbance frequency / intensity', ylabel='species',
    params=[P('m', 'peak position', 0.3, 0.7, 0.5, step=0.05)])

bars('bio_food_webs_energy_flow', 'Energy passed up a food chain falls by about 90% at each step (the 10% rule). Slide the transfer efficiency to see how quickly top predators run out of energy.',
    [('plants', 10000, 'green'), ('herbivores', '10000*e', 'gold'), ('carnivores', '10000*e^2', 'orange'), ('top', '10000*e^3', 'red')], ylabel='kJ per m² per year', params=[P('e', 'transfer efficiency', 0.05, 0.3, 0.1, step=0.01)], aspect=0.75)
S['bio_food_webs_energy_flow']['logy'] = True

plot('bio_primary_production_decomposition', 'Litter decays exponentially, M = M₀e^(−kt): fast in warm, wet tropics and slow in cold bogs. Slide k to compare habitats.',
    fns=[F('100*exp(-k*x)', 'mass remaining', 'orange', width=2.6)], x=[0, 20], y=[0, 105], xlabel='years', ylabel='% litter remaining',
    params=[P('k', 'decay constant k', 0.05, 3, 0.3, step=0.05, unit='per yr')], readouts=[R('half-life', 'ln(2)/k', 'years')])

blocks('bio_biogeochemical_cycles_concept', 'Elements cycle between reservoirs: atmosphere, living things, soil and sediment, and water. Most cycles are closed loops powered by life, light and geology.',
    [nd('a', 'atmosphere', 50, 8, 'accent'), nd('b', 'organisms', 12, 50, 'green'), nd('c', 'soil / sediment', 50, 92, 'orange'), nd('d', 'oceans', 88, 50, 'blue')],
    [('a', 'b', 'uptake'), ('b', 'c', 'death'), ('c', 'd', 'runoff'), ('d', 'a', 'exchange'), ('c', 'b', 'nutrients'), ('b', 'a', 'respiration')], aspect=0.75)

plot('bio_biomes', 'Climate sets biomes: temperature and rainfall place each major biome on this map (approximate annual averages).',
    x=[-15, 40], y=[0, 340], xlabel='mean annual temperature (°C)', ylabel='rainfall (cm/yr)',
    points=[{'x': -10, 'y': 25, 'label': 'tundra'}, {'x': -2, 'y': 55, 'label': 'boreal forest'}, {'x': 9, 'y': 120, 'label': 'temperate forest'}, {'x': 8, 'y': 45, 'label': 'grassland'}, {'x': 24, 'y': 10, 'label': 'desert'}, {'x': 25, 'y': 100, 'label': 'savanna'}, {'x': 26, 'y': 280, 'label': 'rainforest'}])

plot('bio_biogeography_island', 'The species–area relationship S = c·Aᶻ: each tenfold increase in island area multiplies species by 10ᶻ. On log axes it is a straight line; the slope z is typically 0.15–0.35.',
    fns=[F('c*x^z', 'S = c·Aᶻ', 'green', width=2.6)], x=[1, 100000], y=[1, 1000], logx=True, logy=True, xlabel='island area (km²)', ylabel='species',
    params=[P('z', 'exponent z', 0.1, 0.4, 0.25, step=0.01), P('c', 'constant c', 1, 10, 3, step=0.5)], readouts=[R('×10 area gives species ×', '10^z')])

plot('bio_climate_change_biology', 'Warming rises with the logarithm of CO₂: each doubling adds the same warming (the climate sensitivity). The dot marks about 420 ppm, relative to a pre-industrial 280 ppm.',
    fns=[F('ECS*log2(x/280)', 'equilibrium warming', 'red', width=2.6)], x=[280, 1000], y=[0, 8], xlabel='atmospheric CO₂ (ppm)', ylabel='warming (°C)',
    points=[{'x': 420, 'y': 'ECS*log2(420/280)', 'label': 'now ≈ {ECS*log2(420/280)} °C'}], params=[P('ECS', 'warming per CO₂ doubling', 2, 4.5, 3, step=0.1, unit='°C')],
    readouts=[R('at 560 ppm (2×)', 'ECS', '°C')])

plot('bio_biodiversity_crisis', 'Species–area scaling predicts that losing habitat loses species, but less than proportionally at first: S/S₀ = (A/A₀)ᶻ. Slide z to see how sensitive the species are.',
    fns=[F('100*(x/100)^z', 'species remaining', 'pink', width=2.6), F('x', 'proportional', 'dim', True)], x=[0, 100], y=[0, 100], xlabel='habitat remaining (%)', ylabel='species remaining (%)',
    points=[{'x': 'h', 'y': '100*(h/100)^z'}], params=[P('z', 'exponent z', 0.15, 0.4, 0.25, step=0.01), P('h', 'habitat remaining', 5, 100, 50, step=1, unit='%')],
    readouts=[R('species remaining', '100*(h/100)^z', '%')])

plot('bio_conservation_strategies', 'With an Allee effect, a population below a threshold A declines to extinction even though it would grow if larger. Raise A and more populations are in danger.',
    fns=[F('0.04*x*(1-x/100)*(x/A-1)', 'growth rate dN/dt', 'green', width=2.6)], x=[0, 110], y=[-1.5, 2], xlabel='population size N', ylabel='dN/dt', hlines=[{'y': 0, 'label': ''}],
    vlines=[{'x': 'A', 'label': 'threshold A'}, {'x': 100, 'label': 'K'}], params=[P('A', 'Allee threshold A', 5, 50, 20, step=1)])

hub('bio_ecosystem_services', 'Nature supplies four kinds of service that societies depend on, from food and water to climate regulation, recreation and soil formation.',
    'Ecosystem services', ['Provisioning', 'Regulating', 'Cultural', 'Supporting'], colors=['green', 'accent', 'pink', 'orange'], aspect=0.8)

# ---------------- BIOSTATS ----------------
chain('bio_biostats', 'A typical analysis moves from describing the data to making inferences about the population and then to models that explain it.',
      ['describe data', 'estimate ± error', 'test a hypothesis', 'model relationships'], colors=['accent', 'green', 'gold', 'purple'])

dist_spec = dict(type='dist', kind='normal', mu='m', sigma='sd', shade=['m-sd', 'm+sd'],
    params=[P('m', 'mean', 30, 70, 50, step=1, unit='mm'), P('sd', 'standard deviation', 2, 15, 8, step=0.5, unit='mm'), P('n', 'sample size n', 2, 200, 25, step=1)],
    readouts=[R('SE of the mean = s/√n', 'sd/sqrt(n)', 'mm'), R('variance s²', 'sd^2', 'mm²')],
    caption='About 68% of values lie within one SD of the mean. The standard error s/√n measures how precisely a sample of n estimates that mean; it shrinks as n grows.')
add('bio_descriptive_statistics', dist_spec)

add('bio_distributions_biology', dict(type='dist', kind='binomial', n='n', p='p', params=[P('n', 'trials n', 5, 40, 20, step=1), P('p', 'success probability p', 0.05, 0.95, 0.3, step=0.05)],
    readouts=[R('mean np', 'n*p'), R('SD √(np(1−p))', 'sqrt(n*p*(1-p))')],
    caption='The binomial counts successes in n yes/no trials, such as mutant offspring out of n. It becomes bell-shaped as n grows.'))

plot('bio_sampling_clt', 'Even though individual values are skewed (exponential, dashed), the mean of n of them is nearly normal (blue) and gets narrower as n grows. Slide n.',
    fns=[F('exp(-x)', 'individuals (skewed)', 'dim', True), F('exp(n*ln(n)+(n-1)*ln(x)-n*x-%s)' % lg('n'), 'sample mean', 'gold', width=2.6), F('gauss(x,1,1/sqrt(n))', 'normal approx.', 'accent')],
    x=[0.02, 3], y=[0, 3], xlabel='value', ylabel='density', params=[P('n', 'sample size n', 1, 40, 5, step=1)], readouts=[R('SD of the mean', '1/sqrt(n)')])

# confidence intervals: 20 simulated samples
shapes = []
for i in range(20):
    y = 0.5 + i * 0.5
    z = '(rand(%d)+rand(%d)+rand(%d)+rand(%d)-2)*1.732' % (i * 4 + 1, i * 4 + 2, i * 4 + 3, i * 4 + 4)
    mean = '(%s)/sqrt(n)*10' % z
    hw = 'zc*10/sqrt(n)'
    ok = 'abs(%s)<=%s' % (mean, hw)
    shapes.append(dict(k='line', x1='(%s)-%s' % (mean, hw), x2='(%s)+%s' % (mean, hw), y1=y, y2=y, color='green', width=2, when=ok))
    shapes.append(dict(k='line', x1='(%s)-%s' % (mean, hw), x2='(%s)+%s' % (mean, hw), y1=y, y2=y, color='red', width=2, when='!(%s)' % ok))
    shapes.append(dict(k='point', x=mean, y=y, color='white', size=2.5))
shapes.append(L(0, 0, 0, 10.5, 'gold', 2, dash=True)); shapes.append(T(0, 10.9, 'true mean', 'gold', 10, 'center'))
add('bio_confidence_intervals', dict(type='geometry', range=[-12, 12, -0.5, 11.5], shapes=shapes, equal=False,
    params=[P('zc', 'width multiplier z', 0.5, 3, 1.96, step=0.01), P('n', 'sample size n', 5, 100, 20, step=1)],
    readouts=[R('expected coverage', 'erf(zc/sqrt(2))*100', '%')], aspect=0.8,
    caption='Each bar is the confidence interval from one simulated sample. A 95% interval (z = 1.96) misses the true mean in about 1 of 20 samples (red). Widen it and fewer miss.'))

add('bio_hypothesis_testing', dict(type='dist', kind='normal', mu=0, sigma=1, shade=['zobs', 6], params=[P('zobs', 'observed test statistic z', 0, 4, 1.96, step=0.05)],
    readouts=[R('one-sided p', '1-%s' % Phi('zobs')), R('two-sided p', '2*(1-%s)' % Phi('zobs'))],
    caption='If the null hypothesis is true, the p-value is the chance of a result at least this extreme: the shaded tail (double it for a two-sided test). Larger z means smaller p.'))

plot('bio_t_tests', 'With few samples the t distribution has fatter tails than the normal, so the cutoff for significance is larger. Raise the degrees of freedom and it converges to the normal.',
    fns=[F('exp(%s-%s-0.5*ln(df*pi)-((df+1)/2)*ln(1+x^2/df))' % (lg('(df+1)/2'), lg('df/2')), 't distribution', 'gold', width=2.6), F('gauss(x,0,1)', 'normal', 'accent', True)],
    x=[-5, 5], xlabel='t', ylabel='density', params=[P('df', 'degrees of freedom', 2, 60, 5, step=1)],
    readouts=[R('5% two-sided cutoff t*', '1.96+(1.96^3+1.96)/(4*df)+(5*1.96^5+16*1.96^3+3*1.96)/(96*df^2)')])

add('bio_chi_square_tests', dict(type='dist', kind='custom', f='exp((k/2-1)*ln(x)-x/2-(k/2)*ln(2)-%s)' % lg('k/2'), x=[0.01, 30], shade=['chi', 30],
    params=[P('k', 'degrees of freedom', 2, 10, 3, step=1), P('chi', 'observed χ²', 1, 25, 7.8, step=0.1)],
    readouts=[R('5% critical value', 'k*(1-2/(9*k)+1.645*sqrt(2/(9*k)))^3')],
    caption='The chi-square distribution describes how far observed counts stray from expectation by chance. The shaded area beyond your χ² is the p-value.'))

add('bio_anova', dict(type='plot', fns=[F('gauss(x,-d,s)', 'group 1', 'accent'), F('gauss(x,0,s)', 'group 2', 'gold'), F('gauss(x,d,s)', 'group 3', 'pink')],
    x=[-10, 10], xlabel='measurement', ylabel='density', params=[P('d', 'spacing of group means', 0, 5, 2, step=0.1), P('s', 'spread within groups', 0.8, 3, 1.5, step=0.1), P('n', 'n per group', 3, 30, 10, step=1)],
    readouts=[R('F = n·d²/s²', 'n*d^2/s^2')],
    caption='ANOVA compares the spread between group means to the spread within groups. Pull the groups apart or tighten them and F rises; overlapping groups give F near 1.'))

import random
random.seed(3)
xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
ys = [round(2.0 + 0.8 * x + random.gauss(0, 1.1), 2) for x in xs]
n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
bb = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs); aa = my - bb * mx
sse = '+'.join('(%s-a-b*%s)^2' % (y, x) for x, y in zip(xs, ys))
add('bio_regression_correlation', dict(type='plot', fns=[F('a+b*x', 'fitted line', 'gold', width=2.6)], x=[0, 11], y=[0, 14], xlabel='predictor x', ylabel='response y',
    points=[{'x': x, 'y': y} for x, y in zip(xs, ys)],
    params=[P('a', 'intercept a', 0, 6, 1, step=0.1), P('b', 'slope b', 0, 2, 0.4, step=0.05)], readouts=[R('sum of squared errors', sse)],
    caption='Least-squares regression picks the line that minimises the squared vertical distances to the points. Move a and b to lower the error; the minimum is near a = %.1f, b = %.2f.' % (aa, bb)))

plot('bio_multiple_testing_pvalues', 'Test many hypotheses and false positives pile up: the chance of at least one is 1 − (1 − α)^m. Bonferroni fixes it by testing each at α/m.',
    fns=[F('1-(1-al)^x', 'P(≥1 false positive)', 'red', width=2.6), F('1-(1-al/x)^x', 'with Bonferroni', 'green', width=2.6)], x=[1, 100], y=[0, 1.05], xlabel='number of tests m', ylabel='family-wise error',
    params=[P('al', 'per-test α', 0.01, 0.1, 0.05, step=0.01), P('mm', 'tests m', 1, 100, 20, step=1)], readouts=[R('P(≥1 false positive)', '1-(1-al)^mm'), R('Bonferroni α/m', 'al/mm')])

plot('bio_experimental_design_stats', 'Power is the chance of detecting a real effect. It rises with sample size and effect size d. Slide d to see how many animals per group reach 80% power.',
    fns=[F('%s' % Phi('d*sqrt(x/2)-1.96'), 'power (α = 0.05)', 'accent', width=2.6)], x=[2, 200], y=[0, 1.02], xlabel='n per group', ylabel='power', hlines=[{'y': 0.8, 'label': '80%'}],
    params=[P('d', 'effect size d (Cohen)', 0.2, 1.5, 0.5, step=0.05)], readouts=[R('n for 80% power', '2*(1.96+0.84)^2/d^2', 'per group')])

plot('bio_bayesian_inference_bio', 'Bayes\' theorem: even a good test gives many false positives when the condition is rare. The chance a positive is real depends heavily on prevalence.',
    fns=[F('se*x/(se*x+(1-sp)*(1-x))', 'P(disease | positive)', 'accent', width=2.6)], x=[0, 0.3], y=[0, 1.02], xlabel='prevalence', ylabel='posterior probability',
    points=[{'x': 'pv', 'y': 'se*pv/(se*pv+(1-sp)*(1-pv))', 'label': '{100*se*pv/(se*pv+(1-sp)*(1-pv))}%'}],
    params=[P('se', 'sensitivity', 0.5, 1, 0.95, step=0.01), P('sp', 'specificity', 0.5, 1, 0.95, step=0.01), P('pv', 'prevalence', 0.001, 0.3, 0.02, step=0.001)],
    readouts=[R('P(disease | positive)', '100*se*pv/(se*pv+(1-sp)*(1-pv))', '%')])

plot('bio_ode_models_biology', 'First-order decay, dC/dt = −kC, has the solution C = C₀e^(−kt). Each half-life t½ = ln2/k halves the amount. Slide k.',
    fns=[F('C0*exp(-k*x)', 'C(t)', 'accent', width=2.6)], x=[0, 20], y=[0, 105], xlabel='time', ylabel='concentration',
    points=[{'x': 'ln(2)/k', 'y': 'C0/2', 'label': 't½'}], params=[P('k', 'rate constant k', 0.05, 1, 0.3, step=0.01, unit='per unit time'), P('C0', 'initial C₀', 20, 100, 100, step=5)],
    readouts=[R('half-life', 'ln(2)/k')])

plot('bio_matrix_population_models', 'A two-stage Leslie matrix: juveniles survive with probability s, adults have fecundity f. The population grows as λᵗ, where λ is the dominant eigenvalue. Is λ above 1?',
    fns=[F('100*lam^x', 'population N(t)', 'green', width=2.6), F('100', 'N = 100 (λ = 1)', 'dim', True)], x=[0, 20], y=[0, 800], xlabel='years', ylabel='individuals',
    params=[P('f', 'adult fecundity f', 0.2, 4, 2.5, step=0.1), P('s', 'juvenile survival s', 0.1, 0.9, 0.4, step=0.05), P('f1', 'juvenile fecundity', 0, 1, 0.2, step=0.05)],
    readouts=[R('growth factor λ', '(f1+sqrt(f1^2+4*f*s))/2')])
S['bio_matrix_population_models']['fns'][0]['f'] = '100*((f1+sqrt(f1^2+4*f*s))/2)^x'

chain('bio_bioinformatics_data_analysis', 'A reproducible workflow keeps raw data untouched, scripts under version control, and every figure regenerable from code.',
      ['raw data', 'clean + QC', 'analyse (R, Python)', 'plot', 'report + share'], colors=['orange', 'accent', 'green', 'gold', 'purple'])
