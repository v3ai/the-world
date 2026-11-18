from lib import *
import math
S = {}

# ---------- lateral brain ----------
def Eb(a): return (4.3 * math.cos(math.radians(a)), 0.2 + 2.6 * math.sin(math.radians(a)))
def arcpts(a0, a1, n=14): return [Eb(a0 + (a1 - a0) * i / n) for i in range(n + 1)]
LS = [(-4.04, -0.69), (-2.5, -0.5), (-1.0, -0.15), (-0.1, 0.2), (1.4, 0.6), (2.6, 0.95)]
TOP = Eb(75); PO = Eb(40)
LOBES = {
    'frontal': arcpts(75, 200) + LS[1:4] + [(0.5, 1.5)],
    'parietal': [TOP, (0.5, 1.5), LS[3], LS[4], LS[5], (3.25, 0.9), PO] + arcpts(40, 75, 6)[::-1][1:-1],
    'temporal': arcpts(200, 325) + [(3.2, -0.4), (3.25, 0.9)] + LS[::-1][:-1],
    'occipital': [PO] + arcpts(40, -35, 14) + [(3.2, -0.4), (3.25, 0.9)],
}
LCOL = {'frontal': 'accent', 'parietal': 'gold', 'temporal': 'green', 'occipital': 'pink'}
LTXT = {'frontal': ('Frontal', -2.0, 1.2), 'parietal': ('Parietal', 1.7, 1.6), 'temporal': ('Temporal', -0.8, -1.3), 'occipital': ('Occip.', 3.75, 0.7)}
CER = ellpts(2.7, -2.15, 1.35, 0.75, -12)
BST = [(1.0, -1.45), (1.7, -1.5), (1.9, -3.2), (1.2, -3.3)]

def brain(hl, note, hl2=None, extra=None):
    sh = []
    for k, p in LOBES.items():
        on = (k == hl) or (hl2 and k == hl2)
        sh.append(poly(p, LCOL[k], LCOL[k], 0.78 if on else 0.16, 2 if on else 1))
    sh.append(poly(ellpts(0.2, 0.2, 4.3, 2.6), 'white', None, 0.5, 1.5))
    sh.append(poly(CER, 'purple', 'purple', 0.78 if hl == 'cerebellum' else 0.16, 2 if hl == 'cerebellum' else 1))
    sh.append(poly(BST, 'orange', 'orange', 0.78 if hl == 'brainstem' else 0.16, 2 if hl == 'brainstem' else 1))
    for k, (lab, x, y) in LTXT.items():
        sh.append(text(x, y, lab, 'white', 11))
    sh.append(text(2.7, -2.35, 'Cerebellum', 'white', 9))
    sh.append(text(1.5, -3.45, 'Brainstem', 'white', 9, 'center'))
    sh.append(text(-3.9, 2.95, 'front', 'dim', 10, 'left'))
    sh.append(text(3.9, 2.95, 'back', 'dim', 10, 'right'))
    sh += (extra or [])
    return sh

def brainfig(hl, cap, hl2=None, extra=None):
    return geo(brain(hl, '', hl2, extra), cap, (-5, 5, -3.7, 3.3))

S['frontal_lobe'] = brainfig('frontal', 'Seen from the left: the frontal lobe (cyan) is the largest, about a third of the cortex, and handles planning, decisions, speech production and voluntary movement through the motor strip at its back edge.')
S['parietal_lobe'] = brainfig('parietal', 'The parietal lobe (gold) sits behind the central sulcus: it receives touch and body-position signals and builds your sense of where things are in space.')
S['temporal_lobe'] = brainfig('temporal', 'The temporal lobe (green) lies below the lateral sulcus, next to the ears: hearing, understanding language, and (deep inside) memory.')
S['occipital_lobe'] = brainfig('occipital', 'The occipital lobe (pink) at the back is dominated by the primary visual cortex; damage here can cause blindness even with healthy eyes.')
S['brain'] = bars([('mass', 2, 'accent'), ('blood flow', 15, 'pink'), ('oxygen use', 20, 'gold')],
    'The brain is only about 2% of body weight yet uses about 20% of the body\'s resting energy and oxygen and about 15% of blood flow, which is why it fails within seconds without blood.', ylabel='% of the whole body')
S['cerebral_cortex'] = bars([('mouse', 1, 'dim'), ('rat', 6, 'dim'), ('cat', 83, 'accent'), ('macaque', 250, 'accent'), ('human', 2400, 'gold'), ('elephant', 6000, 'dim')],
    'Folding packs a large sheet (about 2,400 cm², 2-4 mm thick) into the skull. Surface area grows much faster than brain volume across species (approximate values).', ylabel='cortex area (cm², log)', logy=True)
S['hypothalamus'] = plot([fn('37+0.45*sin(2*pi*(x-11)/24)', 'core temperature (°C)', 'orange')], [0, 24], [36, 38],
    'The hypothalamus holds temperature near 37 °C, but its internal clock lets it swing about 0.5 °C a day: lowest around 5 am, highest in the early evening.',
    'time of day (hours)', '°C', [P('h', 'time', 0, 24, 8, 'h')], [R('temperature now', '37+0.45*sin(2*pi*(h-11)/24)', '°C')], points=[{'x': 'h', 'y': '37+0.45*sin(2*pi*(h-11)/24)', 'label': ''}], hlines=[{'y': 37, 'label': 'set point 37 °C'}])
S['corpus_callosum'] = net([('l', 'left hemisphere', 14, 40, 'accent'), ('r', 'right hemisphere', 86, 40, 'pink'), ('rv', 'right visual field', 14, 90), ('lv', 'left visual field', 86, 90)],
    [('l', 'r', '200 M fibers'), ('r', 'l'), ('rv', 'l', 'crosses over'), ('lv', 'r', 'crosses over')],
    'The corpus callosum is a bundle of about 200 million fibers that lets the two hemispheres share information. Each half of the visual field is processed by the opposite hemisphere, so the callosum is needed to join the picture.', aspect=0.6)
S['thalamus'] = net([('s1', 'vision', 8, 12), ('s2', 'hearing', 8, 38), ('s3', 'touch', 8, 64), ('s4', 'smell', 8, 90, 'dim'), ('t', 'THALAMUS', 50, 40, 'gold'), ('c', 'cortex', 90, 40, 'accent')],
    [('s1', 't'), ('s2', 't'), ('s3', 't'), ('t', 'c', 'relay'), ('c', 't', 'feedback', True), ('s4', 'c', 'bypasses', True)],
    'Almost every sense passes through the thalamus on its way to the cortex, like a switchboard that also gates attention. Smell is the exception: it reaches the cortex directly.', aspect=0.66)
S['amygdala'] = net([('st', 'threat', 9, 50), ('th', 'thalamus', 36, 50), ('cx', 'cortex', 60, 12, 'accent'), ('am', 'AMYGDALA', 84, 50, 'red'), ('fr', 'fight or flight', 84, 90, 'orange')],
    [('st', 'th'), ('th', 'am', 'fast'), ('th', 'cx'), ('cx', 'am', 'slow'), ('am', 'fr')],
    'A fast route sends a crude alert straight from the thalamus to the amygdala, before the cortex has finished identifying the object; the slower cortical route can then confirm or cancel the alarm.', aspect=0.66)
S['basal_ganglia'] = net([('cx', 'cortex', 20, 12, 'accent'), ('st', 'striatum', 20, 50), ('gp', 'GPi (brake)', 80, 50, 'red'), ('th', 'thalamus', 80, 12), ('sn', 'dopamine (SN)', 20, 90, 'gold')],
    [('cx', 'st', 'plan'), ('st', 'gp', 'inhibits'), ('gp', 'th', 'inhibits'), ('th', 'cx', 'go'), ('sn', 'st')],
    'The basal ganglia hold a constant brake on movement. When the striatum lifts the brake (by inhibiting the GPi), the thalamus is freed and the cortex can act. Dopamine loss, as in Parkinson disease, makes starting movement hard.', aspect=0.7)
S['cerebellum'] = net([('mc', 'motor cortex', 12, 14, 'accent'), ('cb', 'CEREBELLUM', 50, 50, 'purple'), ('mv', 'movement', 88, 14), ('se', 'sense feedback', 50, 90, 'green')],
    [('mc', 'cb', 'intended'), ('mc', 'mv', ''), ('mv', 'se', ''), ('se', 'cb', 'actual'), ('cb', 'mc', 'correction')],
    'The cerebellum holds about 80% of the brain\'s neurons. It compares the intended movement with sensory feedback of what actually happened and sends corrections within milliseconds, making movements smooth.', aspect=0.7)
S['spinal_cord'] = flow(['tendon tapped', 'sensory neuron', 'spinal cord', 'motor neuron', 'muscle jerks'],
    'In a reflex, such as the knee jerk, the signal turns around in the spinal cord and never waits for the brain, so the response takes only about 30-50 ms.', cols=2, colors={2: 'gold'})
S['peripheral_nerves'] = plot([fn('6*x', 'myelinated (m/s)', 'accent'), fn('1.6*sqrt(x)', 'unmyelinated (m/s)', 'orange')], [0.2, 20], None,
    'Fatter axons conduct faster, and myelin (insulation) multiplies the speed: big myelinated fibers reach about 100 m/s, thin unmyelinated pain fibers only 1-2 m/s.',
    'fiber diameter (µm)', 'conduction speed (m/s)', [P('d', 'fiber diameter', 0.5, 20, 10, 'µm')], [R('myelinated speed', '6*d', 'm/s'), R('unmyelinated speed', '1.6*sqrt(d)', 'm/s'), R('time for 1 m (myelinated)', '1000/(6*d)', 'ms')], logx=True, logy=True)
S['peripheral_nerves']['y'] = [0.5, 200]

# ---------- eye ----------
S['eye_l'] = flow(['cornea', 'aqueous', 'pupil', 'lens', 'vitreous', 'retina', 'optic nerve'],
    'Light is bent mostly by the cornea (about 43 D) and fine-tuned by the lens (about 17-30 D), passes the pupil, crosses the vitreous gel and lands on the retina, which sends signals down the optic nerve.', cols=3, colors={5: 'pink', 3: 'accent'})
S['cornea'] = bars([('cornea', 43, 'accent'), ('lens', 17, 'gold'), ('whole eye', 60, 'white')],
    'The cornea does about two-thirds of the eye\'s focusing (about 43 diopters of roughly 60), because light bends most where it enters from air. The lens adds the adjustable remainder.', ylabel='focusing power (diopters)')
S['iris'] = plot([fn('4.9-3*tanh(0.4*(log10(x)+1))', 'pupil diameter (mm)', 'gold')], [1e-4, 1e5], [1.5, 8.5],
    'The iris widens the pupil to about 8 mm in the dark and shrinks it to 2 mm in bright light, changing the light let in by up to 16 times. Slide the brightness.',
    'scene luminance (cd/m², log scale)', 'mm', [P('L', 'brightness (log10 cd/m²)', -4, 5, 2, '')], [R('pupil', '4.9-3*tanh(0.4*(L+1))', 'mm'), R('light vs 8 mm pupil', '100*(4.9-3*tanh(0.4*(L+1)))^2/64', '%')], logx=True, points=[{'x': '10^L', 'y': '4.9-3*tanh(0.4*(L+1))', 'label': ''}])
S['lens'] = plot([fn('max(18.5-0.3*x,0)', 'focusing range available (D)', 'accent')], [0, 70], [0, 20],
    'Focusing near means squeezing the lens fatter. With age the lens stiffens, so the range falls from about 15 diopters in a child to nearly zero by 55-60 (presbyopia). Slide age.',
    'age (years)', 'diopters', [P('age', 'age', 5, 70, 20, 'years')], [R('range', 'max(18.5-0.3*age,0)', 'D'), R('closest sharp focus', '100/max(18.5-0.3*age,0.5)', 'cm')], points=[{'x': 'age', 'y': 'max(18.5-0.3*age,0)', 'label': ''}])
S['vitreous_humor'] = bars([('vitreous', 4.0, 'accent'), ('lens', 0.2, 'gold'), ('aqueous', 0.3, 'pink')],
    'The clear vitreous gel is 98-99% water and fills about 80% of the eye, about 4 mL, holding the retina against the back of the eye and keeping the eyeball round.', ylabel='volume (mL)')
S['retina'] = plot([fn('150000*exp(-abs(x)/1.2)+5000', 'cones (per mm²)', 'gold'), fn('(abs(x)>3)*(150000*exp(-sq((abs(x)-18)/16)))*(1-exp(-(abs(x)-3)/2))', 'rods (per mm²)', 'accent')], [-30, 30], [0, 170000],
    'Cones (color, detail) crowd into the center, the fovea; rods (dim light) peak about 18 degrees away and are absent from the fovea. That is why a faint star vanishes when you look straight at it.',
    'angle from the fovea (°)', 'cells per mm²')
S['fovea'] = plot([fn('100/(1+abs(x)/2)', 'relative visual acuity (%)', 'accent')], [-30, 30], [0, 105],
    'Sharp vision lives in a tiny pit about 1.5 mm wide. Acuity falls to half at only 2 degrees (about the width of your thumbnail at arm\'s length) and is poor in the periphery. Slide the angle.',
    'angle from the point you look at (°)', '% of best', [P('a', 'angle', 0, 30, 2, '°')], [R('acuity', '100/(1+a/2)', '%')], points=[{'x': 'a', 'y': '100/(1+a/2)', 'label': ''}])
S['optic_nerve'] = net([('re', 'right retina', 10, 12), ('le', 'left retina', 10, 88), ('ch', 'chiasm', 36, 50, 'gold'), ('lg', 'LGN', 62, 50), ('v1', 'V1 cortex', 87, 50, 'accent')],
    [('re', 'ch'), ('le', 'ch'), ('ch', 'lg'), ('lg', 'v1')],
    'The optic nerve carries about 1 million fibers from each eye to the thalamus (LGN) and on to visual cortex V1. At the chiasm the inner (nasal) half of each retina crosses over, so each hemisphere sees the opposite half of the world.', aspect=0.66)
S['vision'] = flow(['photon absorbed', 'transducin on', 'PDE cuts cGMP', 'Na+ channels shut', 'cell hyperpolarizes', 'less glutamate', 'bipolar cell fires'],
    'Unusually, a photoreceptor is active in the dark and switches off in light: one photon can eventually close hundreds of channels, which makes the rod able to detect a single photon.', cols=2, colors={0: 'gold'})
S['rod_cell'] = plot([fn(pw([(0, 4.8), (2, 3.5), (5, 3.1), (10, 2.9), (40, 2.8)]), 'cone adaptation', 'gold'), fn(pw([(0, 7), (5, 5.3), (8, 3.5), (15, 1.5), (25, 0.7), (40, 0.4)]), 'rod adaptation', 'accent')], [0, 40], [0, 6],
    'Walk from sunlight into a dark room: cones adapt first, then at about 7-10 minutes the rods take over and sensitivity keeps improving for 30 minutes or more (the lower the curve, the dimmer the light you can detect).',
    'minutes in the dark', 'detection threshold (log units)')
S['cone_cell'] = plot([fn('exp(-sq((x-420)/35))', 'S cone (blue)', 'blue'), fn('exp(-sq((x-534)/48))', 'M cone (green)', 'green'), fn('exp(-sq((x-564)/52))', 'L cone (red)', 'red'), fn('exp(-sq((x-498)/45))', 'rods', 'dim', dash=True)], [380, 700], [0, 1.1],
    'Three cone types, each peaking at a different wavelength, let the brain compare their responses to see color. Rods (dashed) peak near 498 nm and give no color. Slide the wavelength.',
    'wavelength (nm)', 'relative sensitivity', [P('wl', 'wavelength', 400, 680, 550, 'nm')], [R('S', 'exp(-sq((wl-420)/35))'), R('M', 'exp(-sq((wl-534)/48))'), R('L', 'exp(-sq((wl-564)/52))')], vlines=[{'x': 'wl', 'label': ''}])

# ---------- electrophysiology ----------
AP = pw([(0, -70), (1, -70), (1.3, -62), (1.55, -52), (1.8, -35), (2.1, 5), (2.4, 32), (2.75, 28), (3.3, 0), (3.9, -45), (4.5, -76), (5.5, -80), (7, -76), (10, -71), (14, -70)], dense=5)
S['action_potential'] = plot([fn(f'if(S>=15,{AP},-70+S*step(x-1)*exp(-(x-1)/1.5))', 'membrane voltage (mV)', 'accent')], [0, 12], [-95, 50],
    'A stimulus that lifts the voltage above threshold (about -55 mV) triggers a full spike to about +30 mV and an undershoot; a weaker one just fades. This is the all-or-none rule. Slide the stimulus.',
    'time (ms)', 'mV', [P('S', 'stimulus depolarization', 0, 40, 25, 'mV')], [R('peak voltage', '-70+S', 'mV'), R('fires a spike (1 = yes)', 'S>=15')], hlines=[{'y': -55, 'label': 'threshold -55'}, {'y': -70, 'label': 'rest -70'}])
S['action_potential']['fns'][0]['f'] = f'if(S>=15,{AP},-70+S*step(x-1)*exp(-(x-1)/1.5))'
S['action_potential']['readouts'][0] = R('stimulus depolarizes to', '-70+S', 'mV')
S['synaptic_transmission'] = flow(['spike arrives', 'Ca2+ enters', 'vesicles fuse', 'transmitter crosses', 'receptors open', 'potential changes', 'transmitter cleared'],
    'The whole chemical hop takes only about 0.5-1 ms. Calcium entry is the trigger: block it and the signal stops. Cleaning up the transmitter afterwards resets the synapse.', cols=2, colors={1: 'gold', 3: 'accent'})
S['neuromuscular_junction'] = plot([fn('-70+60*f*1.64*(exp(-x/2)-exp(-x/0.3))', 'end-plate potential (mV)', 'accent')], [0, 10], [-80, -5],
    'One motor-neuron spike releases acetylcholine and produces an end-plate potential about 3-4 times bigger than needed to fire the muscle. In myasthenia gravis receptors are lost: slide the receptors down until it fails.',
    'time (ms)', 'mV', [P('f', 'working receptors', 0.1, 1, 1, 'fraction')], [R('peak depolarization', '60*f', 'mV'), R('safety factor (need 15 mV)', '60*f/15')], hlines=[{'y': -55, 'label': 'fires muscle: -55'}])
