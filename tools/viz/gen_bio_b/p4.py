from lib import *
import math

# ---------------- LAB ----------------
hub('bio_lab', 'Laboratory biology combines hands-on techniques, safe working habits, careful records and honest reporting.',
    'Lab skills', ['Safety', 'Microscopy', 'Measurement', 'Culture and assays', 'Records', 'Ethics'], colors=['red', 'accent', 'gold', 'green', 'orange', 'purple'], aspect=0.85)

bars('bio_lab_safety_biosafety', 'Biosafety levels rise with the risk of the agent: BSL-1 for harmless strains such as lab E. coli K-12, up to BSL-4 for deadly agents with no treatment, such as Ebola.',
    [('BSL-1', 1, 'green'), ('BSL-2', 2, 'gold'), ('BSL-3', 3, 'orange'), ('BSL-4', 4, 'red')], ylabel='containment level', aspect=0.65)

plot('bio_light_microscopy', 'The Abbe limit: the smallest resolvable distance is d = λ/(2·NA). A higher numerical aperture or shorter wavelength resolves finer detail; light microscopes stop near 200 nm.',
    fns=[F('wl/(2*x)', 'resolution d', 'accent', width=2.6)], x=[0.1, 1.5], y=[0, 3500], xlabel='numerical aperture NA', ylabel='d (nm)',
    points=[{'x': 'na', 'y': 'wl/(2*na)', 'label': '{wl/(2*na)} nm'}], vlines=[{'x': 0.65, 'label': '40×'}, {'x': 1.4, 'label': '100× oil'}],
    params=[P('wl', 'wavelength', 400, 700, 550, step=10, unit='nm'), P('na', 'objective NA', 0.1, 1.5, 1.4, step=0.05)], readouts=[R('resolution limit', 'wl/(2*na)', 'nm')])

plot('bio_fluorescence_microscopy', 'A fluorophore absorbs at one wavelength and emits at a longer one (the Stokes shift), which lets filters separate the faint emission from the bright excitation. GFP: excitation 488, emission 509 nm.',
    fns=[F('exp(-((x-ex)/22)^2)', 'excitation', 'blue'), F('exp(-((x-ex-sh)/26)^2)', 'emission', 'green', width=2.6)], x=[400, 700], y=[0, 1.1], xlabel='wavelength (nm)', ylabel='relative intensity',
    vlines=[{'x': 488, 'label': '488 laser'}], params=[P('ex', 'excitation peak', 440, 580, 488, step=1, unit='nm'), P('sh', 'Stokes shift', 10, 80, 21, step=1, unit='nm')],
    readouts=[R('emission peak', 'ex+sh', 'nm')])

plot('bio_electron_microscopy', 'Electrons have a far shorter wavelength than light: λ = h/√(2mₑeV(1+eV/2mₑc²)). At 200 kV it is about 2.5 pm, so resolution is limited by lenses, not wavelength.',
    fns=[F('1226.4/sqrt(x*1000*(1+0.9785e-6*x*1000))', 'electron wavelength', 'accent', width=2.6)], x=[1, 300], logx=True, logy=True, y=[1, 40], xlabel='accelerating voltage (kV)', ylabel='λ (pm)',
    points=[{'x': 'V', 'y': '1226.4/sqrt(V*1000*(1+0.9785e-6*V*1000))', 'label': '{1226.4/sqrt(V*1000*(1+0.9785e-6*V*1000))} pm'}],
    params=[P('V', 'voltage', 10, 300, 200, step=5, unit='kV')], readouts=[R('wavelength', '1226.4/sqrt(V*1000*(1+0.9785e-6*V*1000))', 'pm'), R('light (550 nm) ÷ electron', '550000/(1226.4/sqrt(V*1000*(1+0.9785e-6*V*1000)))')])

plot('bio_pipetting_solutions', 'Dilution rule C₁V₁ = C₂V₂: the volume of stock needed is V₁ = C₂V₂/C₁. A more concentrated stock needs less volume; the rest is made up with buffer.',
    fns=[F('C2*V2/x', 'stock volume V₁', 'accent', width=2.6)], x=[10, 1000], logx=True, y=[0, 1000], xlabel='stock concentration C₁ (mM)', ylabel='stock needed (µL)',
    points=[{'x': 'C1', 'y': 'C2*V2/C1', 'label': '{C2*V2/C1} µL'}], params=[P('C1', 'stock C₁', 10, 1000, 100, step=10, unit='mM'), P('C2', 'target C₂', 1, 50, 10, step=1, unit='mM'), P('V2', 'final volume V₂', 100, 10000, 1000, step=100, unit='µL')],
    readouts=[R('stock to add', 'C2*V2/C1', 'µL'), R('buffer to add', 'V2-C2*V2/C1', 'µL')])

plot('bio_spectrophotometry', 'Beer–Lambert law: absorbance A = ε·l·c rises in proportion to concentration. Above A ≈ 2 almost no light gets through and the readings become unreliable. Slide the concentration.',
    fns=[F('e*1*x*1e-6', 'A = ε·l·c (l = 1 cm)', 'accent', width=2.6)], x=[0, 300], y=[0, 2.6], xlabel='concentration (µM)', ylabel='absorbance',
    hlines=[{'y': 2, 'label': 'A = 2: too dark'}], points=[{'x': 'c', 'y': 'e*c*1e-6', 'label': 'A = {e*c*1e-6}'}],
    params=[P('e', 'ε (M⁻¹cm⁻¹)', 1000, 30000, 6220, step=100), P('c', 'concentration', 0, 300, 100, step=5, unit='µM')],
    readouts=[R('absorbance', 'e*c*1e-6'), R('transmitted light', '100*10^(-e*c*1e-6)', '%')])

plot('bio_centrifugation_separation', 'Relative centrifugal force grows with the square of speed: RCF = 1.118×10⁻⁵ · r · rpm². Double the rpm and you quadruple the force. Slide the rotor radius and speed.',
    fns=[F('1.118e-5*rad*x^2', 'RCF (× g)', 'accent', width=2.6)], x=[0, 15000], xlabel='speed (rpm)', ylabel='RCF (× g)',
    points=[{'x': 'rpm', 'y': '1.118e-5*rad*rpm^2', 'label': '{1.118e-5*rad*rpm^2} × g'}], params=[P('rad', 'rotor radius', 5, 15, 8.5, step=0.5, unit='cm'), P('rpm', 'speed', 1000, 15000, 13000, step=500, unit='rpm')],
    readouts=[R('RCF', '1.118e-5*rad*rpm^2', '× g')])

plot('bio_cell_culture_aseptic', 'Cultured cells double every td hours until the dish is confluent, then growth stops, so cultures need splitting. Slow cells reach confluence later.',
    fns=[F('min(cap,N0*2^(x/td))', 'cells per dish', 'green', width=2.6)], x=[0, 10], y=[0, 1.1e6], xlabel='days', ylabel='cells',
    hlines=[{'y': 1e6, 'label': 'confluent'}], params=[P('td', 'doubling time', 12, 48, 24, step=1, unit='h'), P('N0', 'seeded cells', 1e4, 3e5, 1e5, step=1e4)],
    readouts=[R('days to confluence', 'td*log2(1e6/N0)/24', 'days')])
S['bio_cell_culture_aseptic']['fns'][0]['f'] = 'min(1e6,N0*2^(24*x/td))'

plot('bio_gfp_reporters', 'After a reporter gene is switched on, the protein must fold and form its chromophore before it glows, so fluorescence lags. Slow-maturing proteins respond later; slide the maturation half-time.',
    fns=[F('1-exp(-ln(2)*x/tm)', 'mature fraction (your protein)', 'green', width=2.6), F('1-exp(-ln(2)*x/25)', 'fast GFP (t½ ≈ 25 min)', 'dim', True)],
    x=[0, 300], y=[0, 1.05], xlabel='minutes after expression', ylabel='fluorescent fraction', params=[P('tm', 'maturation half-time', 5, 120, 40, step=1, unit='min')],
    readouts=[R('time to 90% fluorescent', 'tm*log2(10)', 'min')])

chain('bio_lab_notebook_reports', 'Good records let someone repeat your work: plan it, do it, write down exactly what happened, analyse, and report, then refine the plan.',
      ['plan', 'do', 'record', 'analyse', 'report'], loop=True, colors=['accent', 'green', 'gold', 'purple', 'orange'])

chain('bio_literature_scientific_writing', 'A research paper follows the IMRaD structure: Introduction (why), Methods (how), Results (what), Discussion (so what).',
      ['Introduction', 'Methods', 'Results', 'Discussion'], colors=['accent', 'green', 'gold', 'purple'])

hub('bio_research_ethics', 'Research ethics rests on respect for persons, benefit over harm and fairness, plus honest reporting and the 3Rs for animals: replace, reduce, refine.',
    'Ethical research', ['Respect: consent', 'Beneficence', 'Justice', 'Integrity', '3Rs for animals'], colors=['accent', 'green', 'gold', 'purple', 'orange'], aspect=0.95)

# quadrat sampling
import random
random.seed(11)
pts = [(round(random.uniform(1, 49), 1), round(random.uniform(1, 29), 1)) for _ in range(70)]
cnt = '+'.join('(abs(%s-cx)<=h&&abs(%s-cy)<=h)' % (px, py) for px, py in pts)
sh = [Rc(0, 0, 50, 30, 'green', 'green', .1)] + [Pt(px, py, 'green', 2.2) for px, py in pts]
sh += [dict(k='poly', pts=[['cx-h', 'cy-h'], ['cx+h', 'cy-h'], ['cx+h', 'cy+h'], ['cx-h', 'cy+h']], color='gold', width=2.5, fill='gold', alpha=.15),
       T(25, 32.5, 'count {%s} in {4*h*h} m² → density ≈ {(%s)/(4*h*h)} per m²' % (cnt, cnt), 'gold', 10, 'center')]
add('bio_field_methods', dict(type='geometry', range=[-1, 51, -1, 35], shapes=sh, params=[P('h', 'quadrat half-width', 2, 10, 5, step=0.5, unit='m'), P('cx', 'quadrat x', 5, 45, 22, step=1), P('cy', 'quadrat y', 5, 25, 15, step=1)],
    readouts=[R('count in quadrat', cnt), R('true density', '70/1500')], aspect=0.66,
    caption='Sample a small square (quadrat) and scale up. Move it around: counts vary between spots, which is why several random quadrats are needed. The true density is 70 plants per 1500 m².'))

# ---------------- ELECTIVES ----------------
hub('bio_electives', 'Elective topics apply the core ideas to specific problems: oceans, cancer, drugs, epidemics, engineered life and life elsewhere.',
    'Electives', ['Marine biology', 'Cancer', 'Pharmacology', 'Epidemics', 'Synthetic biology', 'Astrobiology'], colors=['blue', 'red', 'green', 'orange', 'purple', 'accent'], aspect=0.85)

plot('bio_marine_biology', 'Light fades with depth as I = I₀e^(−kz). Photosynthesis needs more than 1% of surface light, so the sunlit zone is only about 4.6/k deep: ≈ 115 m in clear ocean, ≈ 20 m in murky coastal water.',
    fns=[F('100*exp(-k*x)', 'light remaining', 'gold', width=2.6)], x=[0, 200], y=[0, 100], xlabel='depth (m)', ylabel='% surface light', hlines=[{'y': 1, 'label': '1% (euphotic limit)'}],
    vlines=[{'x': '4.6/k', 'label': 'limit'}], params=[P('k', 'attenuation k', 0.02, 0.25, 0.04, step=0.005, unit='per m')], readouts=[R('euphotic depth', '4.6/k', 'm')])

plot('bio_cancer_hallmarks', 'Tumour growth follows a Gompertz curve: exponential at first, then slowing as nutrients and space limit it. Compare it with unchecked exponential growth (dashed).',
    fns=[F('V0*exp(a/b*(1-exp(-b*x)))', 'Gompertz', 'red', width=2.6), F('V0*exp(a*x)', 'exponential', 'dim', True)], x=[0, 40], y=[0, 3000], xlabel='weeks', ylabel='tumour cells (millions)',
    params=[P('a', 'initial growth rate a', 0.05, 0.4, 0.2, step=0.01), P('b', 'slowing rate b', 0.02, 0.3, 0.08, step=0.01), P('V0', 'initial V₀', 1, 20, 5, step=1)],
    readouts=[R('plateau V₀·e^(a/b)', 'V0*exp(a/b)', 'million')])

plot('bio_pharmacology_adme', 'After an IV dose, concentration decays exponentially: C = (Dose/Vd)·e^(−kt) with k = CL/Vd, half-life t½ = 0.693·Vd/CL. Higher clearance or smaller volume shortens it.',
    fns=[F('(D/Vd)*exp(-(CL/Vd)*x)', 'plasma concentration', 'accent', width=2.6)], x=[0, 24], xlabel='hours after dose', ylabel='mg/L',
    hlines=[{'y': 1, 'label': 'minimum effective'}], params=[P('D', 'dose', 100, 1000, 500, step=50, unit='mg'), P('Vd', 'volume of distribution', 10, 200, 50, step=5, unit='L'), P('CL', 'clearance', 1, 20, 5, step=0.5, unit='L/h')],
    readouts=[R('half-life', '0.693*Vd/CL', 'h'), R('initial concentration', 'D/Vd', 'mg/L')])

plot('bio_toxicology', 'The dose makes the poison: response rises as an S-curve against log dose. LD₅₀ is the dose that kills half the animals; a steeper curve means a narrower safety margin.',
    fns=[F('100/(1+(ld/x)^h)', 'effect', 'pink', width=2.6)], x=[0.1, 1000], logx=True, y=[0, 105], xlabel='dose (mg/kg)', ylabel='% responding', hlines=[{'y': 50, 'label': '50%'}], vlines=[{'x': 'ld', 'label': 'LD₅₀'}],
    params=[P('ld', 'LD₅₀', 1, 500, 50, step=1, unit='mg/kg'), P('h', 'slope', 0.5, 5, 2, step=0.1)], readouts=[R('response at 10 mg/kg', '100/(1+(ld/10)^h)', '%')])

add('bio_epidemiology', dict(type='geometry', range=[-1, 11, -1, 9], shapes=[
    Rc(0.5, 0, 4, 'r1/10', 'red', 'red', .45), Rc(5.5, 0, 4, 'r0/10', 'accent', 'accent', .45),
    T(2.5, -0.7, 'exposed', 'white', 10, 'center'), T(7.5, -0.7, 'unexposed', 'white', 10, 'center'),
    T(2.5, 'r1/10+0.5', '{r1}% sick', 'red', 10, 'center'), T(7.5, 'r0/10+0.5', '{r0}% sick', 'accent', 10, 'center')],
    params=[P('r1', 'disease risk, exposed', 1, 60, 30, step=1, unit='%'), P('r0', 'disease risk, unexposed', 1, 60, 10, step=1, unit='%')],
    readouts=[R('risk ratio RR', 'r1/r0'), R('odds ratio OR', '(r1/(100-r1))/(r0/(100-r0))')], equal=False, aspect=0.6,
    caption='Compare disease risk in exposed and unexposed groups. The risk ratio is the ratio of the bars; the odds ratio (a·d)/(b·c) is similar to it when disease is rare and drifts higher when it is common.'))

plot('bio_epidemic_modeling', 'In the SIR model the infected fraction i depends on the susceptible fraction s as i = 1 − s + ln(s)/R₀ (starting from nearly everyone susceptible). Epidemics peak where s = 1/R₀. Raise β to raise R₀ = β/γ.',
    fns=[F('1-x+ln(x)/(b/g)+0.001', 'infected i', 'red', width=2.6)], x=[0.02, 1], y=[0, 0.5], xlabel='susceptible fraction s', ylabel='infected fraction i',
    vlines=[{'x': '1/(b/g)', 'label': 's = 1/R₀ (peak)'}], params=[P('b', 'transmission β', 0.1, 1, 0.5, step=0.01, unit='per day'), P('g', 'recovery γ', 0.05, 0.5, 0.2, step=0.01, unit='per day')],
    readouts=[R('R₀ = β/γ', 'b/g'), R('peak infected', 'max(0,1-(1+ln(b/g))/(b/g))'), R('herd threshold', 'max(0,1-g/b)')])

plot('bio_advanced_endocrinology', 'Thyroid feedback: pituitary TSH rises exponentially as free T4 falls, so a small drop in T4 gives a large TSH change. Shift the set-point to model a disorder.',
    fns=[F('1.5*exp(-0.35*(x-sp))', 'TSH', 'purple', width=2.6)], x=[5, 30], logy=True, y=[0.01, 100], xlabel='free T4 (pmol/L)', ylabel='TSH (mIU/L)',
    hlines=[{'y': 0.4, 'label': 'normal TSH 0.4–4'}, {'y': 4, 'label': ''}], params=[P('sp', 'T4 set-point', 12, 20, 16, step=0.5, unit='pmol/L')],
    readouts=[R('TSH at T4 = 10', '1.5*exp(-0.35*(10-sp))', 'mIU/L'), R('TSH at T4 = 22', '1.5*exp(-0.35*(22-sp))', 'mIU/L')])

plot('bio_virology_advanced', 'The chance a genome copy is error-free is e^(−μL). RNA viruses mutate about 10⁴ times more per site than DNA viruses and sit near their error limit L ≈ 1/μ, which limits genome size.',
    fns=[F('exp(-(10^m)*x*1000)', 'error-free fraction', 'accent', width=2.6)], x=[1, 200], logx=True, y=[0, 1.05], xlabel='genome length (kb)', ylabel='error-free copies',
    vlines=[{'x': 30, 'label': 'SARS-CoV-2'}, {'x': 9.7, 'label': 'HIV'}], params=[P('m', 'log₁₀ mutation rate per site', -8, -3, -5, step=0.1)],
    readouts=[R('max genome ≈ 1/μ', '1/10^m/1000', 'kb')])

add('bio_bioinformatics_advanced', dict(type='parametric', range=[0, 1, 0, 1], curves=[dict(x='0.5*(1-erf(s/sqrt(2)))', y='0.5*(1-erf((s-d)/sqrt(2)))', s=[-4, 6], color='accent', dot='th'), dict(x='s', y='s', s=[0, 1], color='dim')],
    xlabel='false-positive rate', ylabel='true-positive rate', params=[P('d', 'classifier quality d′', 0, 4, 1.5, step=0.1), P('th', 'decision threshold', -2, 4, 1, step=0.1)],
    readouts=[R('AUC', '0.5*(1+erf(d/2))'), R('TPR at threshold', '0.5*(1-erf((th-d)/sqrt(2)))'), R('FPR at threshold', '0.5*(1-erf(th/sqrt(2)))')],
    caption='A ROC curve shows the trade-off between catching true positives and raising false alarms as the threshold moves. Better classifiers bow toward the top-left (higher AUC); the diagonal is guessing.', aspect=0.85))

plot('bio_conservation_genomics', 'Small populations lose genetic diversity by drift: heterozygosity decays as H = H₀(1 − 1/2Nₑ)ᵗ. A small effective size erodes variation quickly and leaves the species less adaptable.',
    fns=[F('100*(1-1/(2*Ne))^x', 'heterozygosity remaining', 'green', width=2.6)], x=[0, 200], y=[0, 105], xlabel='generations', ylabel='% of original',
    params=[P('Ne', 'effective size Nₑ', 10, 500, 50, step=5)], readouts=[R('left after 100 generations', '100*(1-1/(2*Ne))^100', '%')])

blocks('bio_synthetic_biology', 'A genetic toggle switch: two repressor genes each shut off the other, so the cell settles stably into one state or the other, an engineered memory.',
    [nd('a', 'gene A (LacI)', 20, 20, 'green'), nd('b', 'gene B (TetR)', 80, 20, 'orange'), nd('c', 'output: GFP', 20, 80, 'accent'), nd('d', 'output: RFP', 80, 80, 'pink')],
    [{'from': 'a', 'to': 'b', 'label': 'represses', 'color': 'red', 'dashed': True}, {'from': 'b', 'to': 'a', 'label': '', 'color': 'red', 'dashed': True}, ('a', 'c'), ('b', 'd')], aspect=0.7)
S['bio_synthetic_biology']['edges'][1]['to'] = 'a'

geo('bio_astrobiology', 'The habitable zone is where liquid water can exist on a planet\'s surface. It moves outward for brighter stars (distance scales as √L). Slide the star\'s luminosity.',
    [-3.4, 3.4, -2.4, 2.4],
    [C(0, 0, '1.67*sqrt(Lum)', 'green', 'green', alpha=.2), C(0, 0, '0.95*sqrt(Lum)', 'dim', '#0a0e17', alpha=1), C(0, 0, '0.95*sqrt(Lum)', 'green', None, width=1.5), C(0, 0, '1.67*sqrt(Lum)', 'green', None, width=1.5),
     C(0, 0, 0.18, 'gold', 'gold'), C(0.72, 0, 0.06, 'orange', 'orange'), C(1.0, 0, 0.07, 'blue', 'blue'), C(1.52, 0, 0.05, 'red', 'red'),
     T(0.72, 0.28, 'Venus', 'orange', 9, 'center'), T(1.0, -0.3, 'Earth', 'blue', 9, 'center'), T(1.52, 0.28, 'Mars', 'red', 9, 'center'),
     T(0, -2.1, 'habitable zone {0.95*sqrt(Lum)}–{1.67*sqrt(Lum)} AU', 'green', 11, 'center')],
    params=[P('Lum', 'star luminosity', 0.1, 3, 1, step=0.05, unit='L☉')], aspect=0.7)

blocks('bio_systems_biology_networks', 'Regulatory networks contain recurring motifs. In a feed-forward loop, X controls Z both directly and through Y, which filters out brief noisy signals.',
    [nd('x', 'X (signal)', 12, 50, 'accent'), nd('y', 'Y', 50, 15, 'gold'), nd('z', 'Z (output)', 88, 50, 'green')],
    [('x', 'y', '+'), ('y', 'z', '+'), ('x', 'z', '+')], aspect=0.55)

plot('bio_biophysics_elective', 'Thermal energy kBT ≈ 4.1 pN·nm at 25 °C sets the scale of molecular life. The Boltzmann factor e^(−ε/kBT) gives the odds of a state costing energy ε; an ATP hydrolysis (≈ 80 pN·nm) is ≈ 20 kBT.',
    fns=[F('exp(-x/(0.0138*T))', 'fraction e^(−ε/kBT)', 'accent', width=2.6)], x=[0, 40], y=[0, 1.05], xlabel='energy ε (pN·nm)', ylabel='relative probability',
    vlines=[{'x': '0.0138*T', 'label': 'kBT'}], params=[P('T', 'temperature', 273, 330, 298, step=1, unit='K')], readouts=[R('kBT', '0.0138*T', 'pN·nm'), R('odds at ε = 10 pN·nm', 'exp(-10/(0.0138*T))')])

plot('bio_microbial_ecology_elective', 'Monod kinetics: growth rate μ = μmax·S/(Ks + S) saturates when the nutrient is plentiful. Ks is the nutrient level at half the maximum rate.',
    fns=[F('mu*x/(ks+x)', 'growth rate', 'green', width=2.6)], x=[0, 200], y=[0, 1.3], xlabel='nutrient concentration S (µM)', ylabel='growth rate (per h)',
    hlines=[{'y': 'mu', 'label': 'μmax'}], vlines=[{'x': 'ks', 'label': 'Ks'}], params=[P('mu', 'μmax', 0.2, 1.2, 0.8, step=0.05, unit='per h'), P('ks', 'Ks', 5, 100, 20, step=1, unit='µM')], readouts=[R('doubling time at saturation', 'ln(2)/mu', 'h')])

hub('bio_bioethics_society', 'Biotechnology raises questions that biology alone cannot settle; four principles help structure the discussion.',
    'Bioethics', ['Autonomy', 'Beneficence', 'Non-maleficence', 'Justice'], colors=['accent', 'green', 'red', 'gold'], aspect=0.75)
