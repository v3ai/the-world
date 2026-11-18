from lib import *
import math

hub('bio_processes', 'Life runs on a handful of step-by-step processes, from copying and reading genes to extracting energy, building sugar, dividing, and passing signals.',
    'Processes of life', ['Gene copying and expression', 'Energy: glycolysis to ATP', 'Photosynthesis', 'Cell division', 'Evolution', 'Cycles of matter'],
    colors=['purple', 'orange', 'green', 'accent', 'pink', 'blue'], aspect=0.95)
S['bio_processes']['nodes'][1]['label'] = 'Genes'; S['bio_processes']['nodes'][2]['label'] = 'Energy'

def pchain(i, cap, **kw):
    chain(i, cap, steps_of(i), **kw)

pchain('dna_replication_process', 'DNA replication follows six steps: the helicase opens the origin, primase starts each strand, and the lagging strand is made in Okazaki fragments joined by ligase.', colors=['accent', 'orange', 'gold', 'green', 'green', 'purple'])
pchain('transcription_process', 'RNA polymerase binds the promoter, opens the DNA, elongates the RNA, and stops; in eukaryotes the transcript is then capped, tailed, spliced and exported.', colors=['accent', 'orange', 'green', 'red', 'gold', 'purple'])
pchain('glycolysis_process', 'Glycolysis invests 2 ATP, splits a six-carbon sugar into two three-carbon pieces and recovers 4 ATP, a net gain of 2 ATP and 2 NADH per glucose.', colors=['orange', 'orange', 'gold', 'green', 'green', 'purple'])
pchain('krebs_cycle_process', 'The citric acid cycle is a loop: acetyl-CoA joins oxaloacetate, two carbons leave as CO₂, and oxaloacetate is regenerated, yielding 3 NADH, 1 FADH₂ and 1 ATP per turn.', loop=True, colors=['gold', 'orange', 'red', 'red', 'green', 'purple'])
pchain('oxidative_phosphorylation_process', 'NADH and FADH₂ give electrons to the chain, which pumps protons to build a gradient; protons flowing back through ATP synthase make ≈ 2.5 ATP per NADH.', colors=['orange', 'accent', 'gold', 'red', 'blue', 'green'])
pchain('photosynthesis_light_process', 'Light excites photosystems, splitting water and releasing O₂; the electron flow pumps protons for ATP and finally reduces NADP⁺ to NADPH.', colors=['gold', 'blue', 'accent', 'gold', 'green', 'orange'])
pchain('calvin_cycle_process', 'Rubisco fixes CO₂ onto RuBP, ATP and NADPH reduce it, one G3P in six leaves as sugar, and the rest regenerates RuBP: 3 turns fix 3 CO₂ for 1 G3P.', loop=True, colors=['green', 'gold', 'orange', 'pink', 'accent', 'purple'])

# meiosis DNA content plot
plot('meiosis_process', 'DNA content per cell (C) over meiosis: replication doubles it, meiosis I halves the chromosome number, and meiosis II halves it again to give four haploid gametes.',
    fns=[F(pwl([(0, 2), (1, 2), (1.5, 4), (3, 4), (3.2, 2), (4.2, 2), (4.4, 1), (6, 1)]), 'DNA per cell (C)', 'accent', width=2.6)],
    x=[0, 6], y=[0, 4.6], xlabel='stage', ylabel='DNA content (C)',
    points=[{'x': 0.5, 'y': 2, 'label': 'G1'}, {'x': 1.5, 'y': 4, 'label': 'S'}, {'x': 2.3, 'y': 4, 'label': 'meiosis I'}, {'x': 3.7, 'y': 2, 'label': 'meiosis II'}, {'x': 5.2, 'y': 1, 'label': 'gametes'}])

plot('pcr_process', 'Each PCR cycle (denature, anneal, extend) ideally doubles the DNA: copies = N₀(1 + E)ⁿ. Lower efficiency E slows the climb; 30 cycles from one molecule gives about a billion.',
    fns=[F('N0*(1+E)^x', 'copies', 'accent', width=2.6)], x=[0, 40], logy=True, y=[1, 1e13], xlabel='cycle number', ylabel='copies',
    points=[{'x': 'cyc', 'y': 'N0*(1+E)^cyc', 'label': '{N0*(1+E)^cyc}'}], params=[P('E', 'efficiency E', 0.7, 1, 0.95, step=0.01), P('N0', 'starting copies', 1, 1000, 1, step=1), P('cyc', 'cycles', 0, 40, 30, step=1)],
    readouts=[R('copies after cycles', 'N0*(1+E)^cyc')])

chain('crispr_editing_process', 'A guide RNA leads Cas9 to a matching DNA site next to a PAM; Cas9 cuts both strands and the cell repairs the break, either imprecisely (knockout) or from a template (edit).', steps_of('crispr_editing_process'), colors=['accent', 'orange', 'gold', 'red', 'green', 'purple'])

plot('viral_replication_process', 'One-step growth curve: after attachment and entry the virus seems to disappear (the eclipse), then a burst releases new particles. Slide the latent period and burst size.',
    fns=[F('1+(B-1)/(1+exp(-(x-lat)*1.2))', 'infectious particles per cell', 'red', width=2.6)], x=[0, 12], logy=True, y=[0.5, 1000], xlabel='hours after infection', ylabel='plaque-forming units per cell',
    vlines=[{'x': 'lat', 'label': 'burst'}], params=[P('lat', 'latent period', 2, 10, 5, step=0.5, unit='h'), P('B', 'burst size', 10, 500, 100, step=10)])

plot('natural_selection_process', 'Variation, differential survival and inheritance shift allele frequency: p(t) = p₀(1+s)ᵗ / (1 − p₀ + p₀(1+s)ᵗ). A bigger advantage s means faster change.',
    fns=[F('p0*(1+s)^x/(1-p0+p0*(1+s)^x)', 'favoured allele frequency', 'green', width=2.6)], x=[0, 200], y=[0, 1.02], xlabel='generations', ylabel='allele frequency p',
    params=[P('s', 'selection advantage s', 0.005, 0.2, 0.05, step=0.005), P('p0', 'start frequency p₀', 0.001, 0.5, 0.02, step=0.001)],
    readouts=[R('generations from 10% to 90%', '2*ln(9)/ln(1+s)')])

plot('speciation_process', 'After populations are separated, they drift and adapt to different conditions; their trait distributions pull apart and the overlap, where hybrids would form, shrinks. Slide the time apart.',
    fns=[F('gauss(x,-D,1.2)', 'population A', 'accent', width=2.6), F('gauss(x,D,1.2)', 'population B', 'pink', width=2.6)], x=[-8, 8], xlabel='trait value', ylabel='frequency',
    params=[P('D', 'divergence (time apart →)', 0, 5, 1.5, step=0.1)], readouts=[R('distribution overlap', '1-erf(D/(1.2*sqrt(2)))', None)])
S['speciation_process']['readouts'] = [R('distribution overlap', '1-erf(D/1.2/sqrt(2))')]

blocks('nitrogen_cycle_process', 'Nitrogen gas is fixed by bacteria into ammonium, nitrified to nitrate, taken up by plants, returned by decay (ammonification) and finally denitrified back to N₂.',
    [nd('a', 'N₂ in air', 50, 6, 'accent'), nd('b', 'NH₄⁺ (fixation)', 12, 36, 'green'), nd('c', 'NO₃⁻ (nitrification)', 80, 36, 'gold'), nd('d', 'plants, animals', 80, 70, 'green'), nd('e', 'decay: NH₄⁺', 20, 86, 'orange')],
    [('a', 'b', 'fixation'), ('b', 'c', 'nitrify'), ('c', 'd', 'uptake'), ('d', 'e', 'death'), ('e', 'b'), {'from': 'c', 'to': 'a', 'label': 'denitrify', 'dashed': True}], aspect=0.85)

blocks('carbon_cycle_process', 'Arrows: photosynthesis and respiration, litter and decay, dissolving and outgassing. Carbon moves between air (≈ 880 GtC), plants (≈ 550), soil (≈ 1,500+), oceans (≈ 38,000 mostly deep) and rock. Burning fossil fuels moves stored carbon into the air faster than sinks absorb it.',
    [nd('a', 'air ≈ 880', 50, 8, 'accent'), nd('b', 'plants ≈ 550', 14, 45, 'green'), nd('c', 'soil ≈ 1500+', 14, 85, 'orange'), nd('d', 'ocean ≈ 38000', 86, 45, 'blue'), nd('e', 'fossil fuels', 86, 85, 'red')],
    [('a', 'b'), ('b', 'a'), ('b', 'c'), ('c', 'a'), ('a', 'd'), ('d', 'a'), {'from': 'e', 'to': 'a', 'label': 'burning', 'color': 'red'}], aspect=0.95)

plot('signal_transduction_process', 'A kinase cascade amplifies a signal: if each activated enzyme activates m copies of the next, n steps give mⁿ activated molecules from a single receptor event.',
    fns=[F('m^x', 'activated molecules', 'purple', width=2.6)], x=[0, 5], logy=True, y=[1, 1e6], xlabel='cascade step', ylabel='activated molecules',
    points=[{'x': 'n', 'y': 'm^n', 'label': '{m^n}'}], params=[P('m', 'fold per step m', 2, 20, 10, step=1), P('n', 'steps n', 0, 5, 3, step=1)], readouts=[R('amplification', 'm^n', '×')])

chain('vaccine_immunity_process', 'A vaccine shows the immune system a harmless antigen: it is taken up, presented, activates T and B cells, and leaves long-lived memory cells without causing disease.', steps_of('vaccine_immunity_process'), colors=['accent', 'orange', 'gold', 'green', 'purple', 'pink'])
chain('gastrulation_process', 'In gastrulation a two-layer disc is reorganised into three germ layers: cells ingress through the primitive streak to form endoderm and mesoderm, leaving ectoderm on top.', steps_of('gastrulation_process'), colors=['accent', 'orange', 'gold', 'green', 'purple', 'pink'])
chain('sanger_ngs_sequencing_process', 'Sanger reads one fragment at a time by chain termination; next-generation sequencing reads millions of clusters in parallel and assembles them by computer.', steps_of('sanger_ngs_sequencing_process'), colors=['accent', 'orange', 'gold', 'green', 'purple', 'pink'])
