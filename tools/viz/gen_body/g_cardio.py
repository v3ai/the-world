from lib import *
S = {}
T = '(60/HR)'
U = f'mod(x,{T})'
TS = f'(0.1+0.3*{T})'
R_ = f'({U}/{TS})'  # systolic phase 0..1
SYS = f'({U}<{TS})'

def lv(): return f'{SYS} ? 8+112*pow(sin(pi*{R_}),0.6) : 5+4*({U}-{TS})/({T}-{TS})'
def ao(): return f'{SYS} ? 80+20*{R_}+32*pow(sin(pi*{R_}),0.7) : 80+20*exp(-({U}-{TS})/0.25)'
def la(): return f'8+5*exp(-sq(({U}-({T}-0.08))/0.035))+({SYS}?4*sin(pi*{R_}):0)'
def ra(): return f'3+3*exp(-sq(({U}-({T}-0.08))/0.035))+({SYS}?3*sin(pi*{R_}):0)'
def rv(): return f'{SYS} ? 4+21*pow(sin(pi*{R_}),0.6) : 3+2*({U}-{TS})/({T}-{TS})'
def pa(): return f'{SYS} ? 9+5*{R_}+14*pow(sin(pi*{R_}),0.7) : 9+5*exp(-({U}-{TS})/0.25)'
HRP = P('HR', 'heart rate', 45, 160, 70, 'bpm')
CUR = [{'x': f'mod(t,{T})', 'label': ''}]
RD = [R('cardiac cycle', f'{T}*1000', 'ms'), R('systole', f'{TS}*1000', 'ms'), R('diastole', f'({T}-{TS})*1000', 'ms')]
def cyc(fns, y, cap, extra_rd=None, xmax=2.5):
    return plot(fns, [0, xmax], y, cap, 'time (s)', 'pressure (mmHg)', [HRP], (extra_rd or []) + RD[:1], vlines=[{'x': f'mod(t,{T})+{T}*floor(t/{T})*0', 'label': ''}] if False else None)

S['heart'] = flow(['R atrium', 'R ventricle', 'lungs', 'L atrium', 'L ventricle', 'body'],
    'Blood makes a double loop: the right side pumps to the lungs, the left side to the body. At rest each beat moves about 70 mL, so roughly 5 L per minute from each ventricle.',
    cols=3, colors={2: 'blue', 5: 'pink', 1: 'accent', 4: 'accent'}, extra=[(5, 0, 'returns')], aspect=0.5)
S['heart']['edges'][-1]['dashed'] = True

S['cardiac_cycle'] = plot([fn(lv(), 'left ventricle', 'pink'), fn(ao(), 'aorta', 'white'), fn(la(), 'left atrium', 'accent')], [0, 2.5], [0, 135],
    'Ventricular pressure shoots past aortic pressure to open the valve (systole), then falls below it so the valve shuts. Raise the heart rate: diastole shrinks most.',
    'time (s)', 'pressure (mmHg)', [HRP], RD, vlines=[{'x': f'mod(t,{T})', 'label': ''}])
S['left_atrium'] = plot([fn(la(), 'left atrial pressure', 'accent')], [0, 2.5], [0, 40],
    'The atrium collects blood passively, then adds a small kick (the a wave) just before the ventricle contracts. Typical mean pressure is about 8 mmHg.',
    'time (s)', 'pressure (mmHg)', [HRP], RD[:1])
S['left_atrium']['vlines'] = [{'x': f'mod(t,{T})', 'label': ''}]
S['right_atrium'] = plot([fn(ra(), 'right atrial pressure', 'accent')], [0, 2.5], [0, 30],
    'Right atrial pressure is only about 3 mmHg, the lowest in the heart. The small bump just before ventricular systole is the atrial kick.',
    'time (s)', 'pressure (mmHg)', [HRP], RD[:1])
S['right_atrium']['vlines'] = [{'x': f'mod(t,{T})', 'label': ''}]
S['right_ventricle'] = plot([fn(rv(), 'right ventricle', 'blue'), fn(pa(), 'pulmonary artery', 'white')], [0, 2.5], [0, 40],
    'The right ventricle only has to push blood through the low-resistance lungs, so it peaks near 25 mmHg, about a fifth of the left side.',
    'time (s)', 'pressure (mmHg)', [HRP], RD[:1], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
# PV loop
vol = 's<1 ? ESV+(EDV-ESV)*s : s<2 ? EDV : s<3 ? EDV-(EDV-ESV)*(s-2) : ESV'
pr = 's<1 ? 6+6*s : s<2 ? 12+75*(s-1) : s<3 ? 87+13*(s-2)+25*pow(sin(pi*(s-2)),0.7) : 100-92*(s-3)'
S['left_ventricle'] = {'type': 'parametric', 'range': [20, 180, 0, 140],
    'curves': [{'x': vol, 'y': pr, 's': [0, 4], 'color': 'pink', 'dot': 'mod(t,4)'}],
    'params': [P('EDV', 'end-diastolic volume', 100, 160, 120, 'mL'), P('ESV', 'end-systolic volume', 30, 80, 50, 'mL')],
    'readouts': [R('stroke volume', 'EDV-ESV', 'mL'), R('ejection fraction', '100*(EDV-ESV)/EDV', '%'), R('output at 70 bpm', '70*(EDV-ESV)/1000', 'L/min')],
    'caption': 'The dot traces one beat on a pressure-volume loop: fill, squeeze with valves shut, eject, relax. The loop width is the stroke volume; normal ejection fraction is above 55%.', 'aspect': 0.66}
# septum
S['interventricular_septum'] = bars([('LV wall', 10, 'pink'), ('septum', 10, 'gold'), ('RV wall', 3, 'blue')],
    'The septum belongs to the thick left ventricle and bows toward the right. Wall thickness tracks workload: the left pumps against about 120 mmHg, the right only about 25.', ylabel='wall thickness (mm)', aspect=0.6)
# valves
S['tricuspid_valve'] = plot([fn(ra(), 'right atrium', 'accent'), fn(rv(), 'right ventricle', 'blue')], [0, 2.5], [0, 30],
    'The valve opens whenever atrial pressure exceeds ventricular pressure (filling) and slams shut when the ventricle squeezes. Watch where the curves cross.',
    'time (s)', 'pressure (mmHg)', [HRP], [R('open while', 'RA above RV')][:0] or RD[:1], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
S['mitral_valve'] = plot([fn(la(), 'left atrium', 'accent'), fn(lv(), 'left ventricle', 'pink')], [0, 2.5], [0, 130],
    'The mitral valve is open only when left atrial pressure is above ventricular pressure. At the start of systole the ventricle overtakes the atrium and the valve closes (the first heart sound).',
    'time (s)', 'pressure (mmHg)', [HRP], RD[:1], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
S['aortic_valve'] = plot([fn(lv(), 'left ventricle', 'pink'), fn(ao(), 'aorta', 'white')], [0, 2.5], [0, 135],
    'The aortic valve opens when the ventricle exceeds the aorta, about 80 mmHg, and shuts when it falls below (the second heart sound). A stiff or narrowed valve makes the ventricle work harder.',
    'time (s)', 'pressure (mmHg)', [HRP], RD[:1], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
S['pulmonary_valve'] = plot([fn(rv(), 'right ventricle', 'blue'), fn(pa(), 'pulmonary artery', 'white')], [0, 2.5], [0, 40],
    'The pulmonary valve opens when right-ventricular pressure exceeds the pulmonary artery (about 10 mmHg at rest) and closes when it falls below it.',
    'time (s)', 'pressure (mmHg)', [HRP], RD[:1], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
# ECG
def ecg(PR='0.16'):
    # beats every T; P at 0.1, QRS at 0.1+PR
    u = U; q = f'({PR}+0.1)'
    return (f'0.12*exp(-sq(({u}-0.1)/0.025)) - 0.1*exp(-sq(({u}-{q}+0.03)/0.008)) + 1.0*exp(-sq(({u}-{q})/0.010))'
            f' - 0.2*exp(-sq(({u}-{q}-0.03)/0.010)) + 0.25*exp(-sq(({u}-{q}-0.25)/0.05))')
S['sa_node'] = plot([fn(ecg(), 'ECG', 'green')], [0, 3], [-0.5, 1.3],
    'Each SA-node impulse starts a P wave (atria), then QRS (ventricles), then T (recovery). The node sets the rate: sympathetic nerves speed it up, vagal nerves slow it. Resting 60-100 bpm.',
    'time (s)', 'relative voltage', [HRP], [R('interval between beats', '60000/HR', 'ms')], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
S['av_node'] = plot([fn(ecg('PR'), 'ECG', 'green')], [0, 3], [-0.5, 1.3],
    'The AV node holds the impulse back about 0.12-0.20 s (the PR interval), so the atria finish emptying before the ventricles squeeze. Drag the delay.',
    'time (s)', 'relative voltage', [HRP, P('PR', 'AV-node delay (PR)', 0.08, 0.30, 0.16, 's')], [R('PR interval', 'PR*1000', 'ms')], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
# coronary
cor = f'({SYS} ? 0.35 : 1.0*(0.55+0.45*exp(-({U}-{TS})/0.2)))'
S['coronary_arteries'] = plot([fn(lv(), 'left ventricle pressure', 'pink', dash=True), fn(f'{cor}*100', 'coronary flow (relative)', 'gold')], [0, 2.5], [0, 135],
    'Squeezing ventricular muscle clamps the coronary vessels, so most flow to the heart itself happens during diastole. Raise the heart rate and diastole (and flow time) shrinks.',
    'time (s)', 'mmHg  or  relative flow', [HRP], [R('diastole share of beat', f'100*({T}-{TS})/{T}', '%'), R('coronary flow at rest', '250', 'mL/min')], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
# aorta
S['aorta'] = bars([('aorta', 93, 'pink'), ('arteries', 90, 'pink'), ('arteriole', 60, 'orange'), ('capill.', 25, 'gold'), ('venules', 15, 'blue'), ('veins', 10, 'blue'), ('v. cava', 4, 'blue')],
    'Mean pressure barely falls along the aorta and big arteries, then drops sharply across the arterioles, the main resistance. It is nearly zero by the time blood returns.', ylabel='mean pressure (mmHg)')
# artery compliance
pp = '70/C'
AO0 = ao()
S['artery'] = plot([fn(f'93+({pp}/40)*(({AO0})-93)', 'arterial pressure', 'pink')], [0, 2.5], [40, 200],
    'Elastic arteries stretch with each beat and recoil between beats. Stiffer arteries (lower compliance, as with age) give a bigger pulse pressure for the same 70 mL stroke volume.',
    'time (s)', 'pressure (mmHg)', [P('HR', 'heart rate', 45, 160, 70, 'bpm'), P('C', 'compliance', 0.7, 2.5, 1.75, 'mL/mmHg')],
    [R('pulse pressure', pp, 'mmHg'), R('systolic', f'93+{pp}*0.6', 'mmHg'), R('diastolic', f'93-{pp}*0.4', 'mmHg')], vlines=[{'x': f'mod(t,{T})', 'label': ''}])
S['vein'] = bars([('veins', 64, 'blue'), ('arteries', 13, 'pink'), ('capill.', 7, 'gold'), ('heart', 7, 'accent'), ('lungs', 9, 'purple')],
    'Thin, stretchy veins hold about two-thirds of your blood, so they act as a reservoir. Valves and the muscle pump push it uphill toward the heart.', ylabel='share of blood volume (%)')
S['capillary'] = plot([fn('Pa-(Pa-Pv)*x', 'hydrostatic push out (mmHg)', 'pink'), fn('25', 'oncotic pull in (mmHg)', 'accent'), fn('Pa-(Pa-Pv)*x-25', 'net filtration', 'gold', width=3)], [0, 1], [-15, 40],
    'Along a capillary the pressure pushing fluid out falls from artery to vein while the protein pull stays near 25 mmHg, so fluid leaks out first and is drawn back at the end. Raise venous pressure and see swelling.',
    'artery end to vein end', 'mmHg', [P('Pa', 'arteriolar-end pressure', 25, 45, 35, 'mmHg'), P('Pv', 'venous-end pressure', 8, 30, 15, 'mmHg')], [R('net at start', 'Pa-25', 'mmHg'), R('net at end', 'Pv-25', 'mmHg')], hlines=[{'y': 0, 'label': ''}])
S['vena_cava'] = plot([fn('(Pm-max(x,-2))/1.4', 'venous return', 'blue')], [-4, 10], [0, 10],
    'Return flow to the heart is driven by the gap between mean systemic filling pressure and right atrial pressure. More blood volume (higher Pm) shifts it up; it plateaus when veins collapse below zero.',
    'right atrial pressure (mmHg)', 'venous return (L/min)', [P('Pm', 'mean filling pressure', 5, 12, 7, 'mmHg')], [R('return at RAP = 0', 'Pm/1.4', 'L/min')])
S['carotid_arteries'] = plot([fn('5+95/(1+exp(-(x-110)/18))', 'baroreceptor firing', 'accent')], [40, 220], [0, 105],
    'Pressure sensors in the carotid sinus fire faster as pressure rises, telling the brainstem to slow the heart and widen vessels. Move the pressure and read the reflex.',
    'mean arterial pressure (mmHg)', 'firing (% of max)', [P('MAP', 'blood pressure', 50, 200, 93, 'mmHg')],
    [R('firing', '5+95/(1+exp(-(MAP-110)/18))', '%'), R('expected heart rate', '70+(93-MAP)*0.4', 'bpm')], points=[{'x': 'MAP', 'y': '5+95/(1+exp(-(MAP-110)/18))', 'label': ''}])
V0 = 'CO*1000/60'
S['blood_vessels'] = bars([('aorta', f'{V0}/4.5', 'pink'), ('arteries', f'{V0}/20', 'pink'), ('arteriole', f'{V0}/40', 'orange'), ('capill.', f'{V0}/2500', 'gold'), ('venules', f'{V0}/250', 'blue'), ('veins', f'{V0}/80', 'blue'), ('v. cava', f'{V0}/8', 'blue')],
    'Same flow, different total cross-section: blood speed = flow / area, so it crawls through the huge capillary bed, giving time for exchange. Raise cardiac output to speed everything up.', ylabel='mean speed (cm/s, log)', logy=True,
    params=[P('CO', 'cardiac output', 3, 15, 5, 'L/min')], readouts=[R('capillary speed', f'{V0}/2500*10', 'mm/s')])
S['blood'] = bars([('plasma', '100-Hct-1', 'gold'), ('red cells', 'Hct', 'pink'), ('WBC+plt', 1, 'white')],
    'About 55% of blood is straw-coloured plasma and about 45% red cells. Slide the hematocrit to see how oxygen-carrying capacity follows it.', ylabel='% of volume',
    params=[P('Hct', 'hematocrit', 25, 60, 45, '%')], readouts=[R('hemoglobin', 'Hct/3', 'g/dL'), R('O2 capacity', '1.34*Hct/3', 'mL O2/dL')])
