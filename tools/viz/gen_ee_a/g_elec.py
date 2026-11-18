from lib import *
from g_circ import W
import math

def build(S):
    S['energy_bands_ee'] = geo([
        rect(-2.6, -1.4, 3.6, 1.4, 'blue', 'blue', alpha=0.45), text(-0.8, -0.7, 'valence band (full of electrons)', 'white', 10),
        rect(-2.6, 'Eg', 3.6, 1.4, 'accent', 'accent', alpha=0.4), text(-0.8, 'Eg+0.7', 'conduction band (free electrons)', 'white', 10),
        arrow(1.5, 0, 1.5, 'Eg', 'gold', 2.5), line(1.3, 0, 1.7, 0, 'gold', 2), line(1.3, 'Eg', 1.7, 'Eg', 'gold', 2),
        text(2.6, 'Eg/2', 'Eg = {Eg} eV', 'gold', align='left'),
        text(-3.45, 1.12, 'Si', 'dim', 10), line(-3.2, 1.12, -2.6, 1.12, 'dim', 1), text(-3.1, 5.95, 'diamond', 'dim', 10), line(-3.4, 5.5, -2.6, 5.5, 'dim', 1)],
        [-3.8, 4.8, -1.7, 7.7], 'A solid’s band gap Eg decides its character: near 0 it is a metal, ~1 eV a semiconductor (silicon is 1.12 eV), several eV an insulator. Heat lifts electrons across the gap, ∝ e^(−Eg/2kT).',
        params=[P('Eg', 'band gap Eg', 0.2, 6, 1.12, 'eV'), P('T', 'temperature', 200, 500, 300, 'K')],
        readouts=[R('intrinsic carriers vs Si at 300 K', 'pow(T/300,1.5)*exp(-Eg/(2*8.617e-5*T)+1.12/(2*8.617e-5*300))'), R('kT', '8.617e-5*T*1000', 'meV')], aspect=1.0)

    ni = '(1e10*pow(T/300,1.5)*exp(-(1.12/(2*8.617e-5))*(1/T-1/300)))'
    S['doping_pn_material'] = plot(
        [F('x', 'electrons n (n-type)', 'accent'), F(f'{ni}^2/x', 'holes p = nᵢ²/N', 'pink')],
        'Doping floods the crystal with one carrier type (n ≈ N_d), which suppresses the other through n·p = nᵢ². Heat raises nᵢ, so minority carriers grow with temperature.',
        x=[1e14, 1e18], y=[1e2, 1e19], logx=True, logy=True, xlabel='donor doping N_d (cm⁻³)',
        points=[{'x': 'Nd', 'y': f'{ni}^2/Nd', 'label': 'p = {' + ni + '^2/Nd} cm⁻³'}],
        params=[P('T', 'temperature', 250, 450, 300, 'K'), P('Nd', 'doping N_d', 1e14, 1e18, 1e16, 'cm⁻³', step=1e14)],
        readouts=[R('nᵢ at this T', ni, 'cm⁻³'), R('n·p', f'Nd*{ni}^2/Nd', 'cm⁻⁶')])

    S['drift_diffusion_ee'] = plot(
        [F('559/L*exp(-x/L)', 'diffusion J (A/cm²)', 'accent'), F('2.163*E*exp(-x/L)', 'drift J (A/cm²)', 'pink'), F('(559/L+2.163*E)*exp(-x/L)', 'total', 'gold', width=2.6)],
        'Carriers move two ways: drift down an electric field E (J = qμnE) and diffusion down a concentration gradient (J = qD dn/dx). Here n falls off with length L from n₀ = 10¹⁶ cm⁻³ (electrons in Si, μ = 1350 cm²/Vs).',
        x=[0, 5], xlabel='distance x (µm)',
        params=[P('L', 'diffusion length L', 0.5, 5, 1.5, 'µm'), P('E', 'electric field E', 0, 500, 100, 'V/cm')],
        readouts=[R('Einstein D = μkT/q', '1350*0.02585', 'cm²/s'), R('J_diff at x=0', '559/L', 'A/cm²'), R('J_drift at x=0', '2.163*E', 'A/cm²')])

    S['pn_junction_ee'] = plot(
        [F('Is*1e-9*(exp(x/(n*0.02585))-1)', 'I = Is(e^(V/nVT) − 1)', 'accent')],
        'Forward bias (right) lowers the barrier and current explodes exponentially; reverse bias (left) leaves only the tiny saturation current. Doubling Is or n shifts the knee.',
        x=[-0.5, 0.8], y=[-5, 60], xlabel='voltage across diode (V)',
        vlines=[{'x': 0.7, 'label': '0.7 V'}],
        points=[{'x': 'Vd', 'y': 'Is*1e-9*(exp(Vd/(n*0.02585))-1)', 'label': '{Is*1e-9*(exp(Vd/(n*0.02585))-1)} mA'}],
        params=[P('Is', 'saturation current Is', 0.01, 100, 1, 'pA'), P('n', 'ideality n', 1, 2, 1), P('Vd', 'bias V', -0.4, 0.7, 0.6)],
        readouts=[R('current', 'Is*1e-9*(exp(Vd/(n*0.02585))-1)', 'mA'), R('small-signal rd = nVT/I', 'n*0.02585/(Is*1e-12*(exp(Vd/(n*0.02585))-1)+1e-15)', 'Ω')])

    S['diode_models'] = plot(
        [F('x<0 ? 0 : x*1000', 'ideal', 'dim'), F('x<Vd ? 0 : (x-Vd)*1000', 'constant drop', 'green'), F('1e-9*(exp(x/0.02585)-1)', 'exponential (Is = 1 pA)', 'accent')],
        'Three models of the same diode: ideal (a one-way switch), constant-drop (a switch plus ~0.7 V) and exponential (the real curve). The small-signal resistance r_d = nV_T/I_D shrinks as current rises.',
        x=[0, 1], y=[0, 30], xlabel='diode voltage (V)',
        params=[P('Vd', 'drop of constant-drop model', 0.5, 0.8, 0.7), P('Id', 'bias current I_D', 0.1, 30, 5, 'mA')],
        readouts=[R('r_d = 25.85 mV / I_D', '25.85/Id', 'Ω')])

    S['rectifiers'] = plot(
        [F('Vm*sin(2*pi*x/20)', 'AC input', 'dim'), F('max(0,Vm*sin(2*pi*x/20)-Vd)', 'half-wave', 'pink', dash=True), F('max(0,abs(Vm*sin(2*pi*x/20))-2*Vd)', 'full-wave bridge', 'accent', width=2.6)],
        'A diode passes only one polarity. A half-wave rectifier keeps half the cycle; a bridge flips the negative half, doubling the ripple frequency. Each diode steals about 0.7 V.',
        x=[0, 40], y=[-21, 21], xlabel='time (ms, 50 Hz)',
        points=[{'x': 'mod(t*6,40)', 'y': 'max(0,abs(Vm*sin(2*pi*mod(t*6,40)/20))-2*Vd)'}],
        params=[P('Vm', 'peak input', 5, 20, 12, 'V'), P('Vd', 'diode drop', 0.3, 1, 0.7, 'V')],
        readouts=[R('bridge average Vdc ≈ 2(Vm−2Vd)/π', '2*(Vm-2*Vd)/pi', 'V'), R('half-wave average (Vm−Vd)/π', '(Vm-Vd)/pi', 'V'), R('output ripple frequency', '100', 'Hz')])

    S['clippers_clampers'] = plot(
        [F('Vm*sin(2*pi*x)', 'input', 'dim'), F('min(Vm*sin(2*pi*x),Vc)', 'clipper (cuts above Vc)', 'accent', width=2.6), F('Vm*sin(2*pi*x)+Vm-0.7', 'clamper (negative peak at 0 V)', 'pink', dash=True)],
        'A clipper slices off everything above (or below) a chosen level; a clamper adds a DC shift so the whole waveform sits above, say, 0 V. Both are just diodes plus a reference or a capacitor.',
        x=[0, 2], y=[-6, 12.5], xlabel='time (cycles)',
        hlines=[{'y': 'Vc', 'label': 'clip level', 'color': 'gold'}],
        params=[P('Vm', 'input peak', 2, 5, 5, 'V'), P('Vc', 'clip level Vc', -3, 4, 2, 'V')],
        readouts=[R('clamped positive peak', '2*Vm-0.7', 'V')])

    S['zener_regulation'] = plot(
        [F('min(Vz,x*RL/(Rs+RL))', 'regulated output', 'accent'), F('x*RL/(Rs+RL)', 'no zener', 'dim', dash=True)],
        'Above its breakdown voltage the zener clamps the output at Vz. Below the point where the divider reaches Vz it does nothing. Load and series resistance set where regulation starts.',
        x=[0, 20], y=[0, 14], xlabel='input voltage (V)', hlines=[{'y': 'Vz', 'label': 'Vz', 'color': 'gold'}],
        points=[{'x': 12, 'y': 'min(Vz,12*RL/(Rs+RL))', 'label': 'at 12 V in'}],
        params=[P('Vz', 'zener Vz', 3.3, 12, 5.1, 'V'), P('Rs', 'series Rs', 50, 500, 150, 'Ω'), P('RL', 'load RL', 100, 2000, 500, 'Ω')],
        readouts=[R('regulation starts at Vin ≥', 'Vz*(Rs+RL)/RL', 'V'), R('zener current at 12 V in', 'max(0,(12-Vz)/Rs-Vz/RL)*1000', 'mA')])

    S['led_photodiode'] = plot(
        [F('1240/x', 'emitted wavelength λ = 1240/Eg', 'accent')],
        'An LED’s colour is its band gap: λ(nm) = 1240/Eg(eV). A 1.9 eV gap gives red (650 nm); 2.7 eV blue; infrared needs under 1.7 eV. A photodiode runs this in reverse: absorbed photons make current.',
        x=[0.5, 4], y=[250, 2500], xlabel='band gap Eg (eV)',
        hlines=[{'y': 700, 'label': 'red edge 700 nm', 'color': 'red'}, {'y': 400, 'label': 'violet edge 400 nm', 'color': 'purple'}],
        points=[{'x': 'Eg', 'y': '1240/Eg', 'label': '{1240/Eg} nm'}],
        params=[P('Eg', 'band gap Eg', 0.5, 4, 1.9, 'eV')],
        readouts=[R('wavelength', '1240/Eg', 'nm'), R('turn-on voltage ≈ Eg', 'Eg', 'V')])

    S['bjt_regions'] = plot(
        [F(f'beta*{k}*Ib/2*0.001*(1-exp(-x/0.15))*(1+x/VA)', f'IB = {{{k}*Ib/2}} µA', c) for k, c in zip([1, 2, 3, 4], ['#98a2b8', '#6ee7ff', '#ffd166', '#ff8fb1'])],
        'A BJT’s collector current is β times the base current once VCE exceeds ~0.2 V (active region); below that it saturates. The slight upward tilt is the Early effect. Cutoff is IB = 0.',
        x=[0, 10], xlabel='V_CE (V)', ylabel='mA',
        vlines=[{'x': 0.2, 'label': 'sat | active'}],
        params=[P('beta', 'current gain β', 50, 300, 100, step=10), P('Ib', 'base-current step', 10, 100, 20, 'µA'), P('VA', 'Early voltage', 30, 200, 80, 'V')],
        readouts=[R('I_C at 2·step (V_CE = 5 V)', 'beta*Ib*0.001*(1+5/VA)', 'mA')])

    S['bjt_biasing'] = plot(
        [F('(12-x)/(Rc+Re)', 'DC load line', 'accent')],
        'A voltage-divider bias fixes V_B ≈ 12·R₂/(R₁+R₂) (R₁ = 47 kΩ), so I_E ≈ (V_B − 0.7)/R_E barely depends on β. The operating (Q) point sits where that current meets the load line.',
        x=[0, 12], y=[0, 6], xlabel='V_CE (V)', ylabel='mA',
        points=[{'x': '12-(12*R2/(47+R2)-0.7)/Re*(Rc+Re)', 'y': '(12*R2/(47+R2)-0.7)/Re', 'label': 'Q'}],
        params=[P('R2', 'R₂', 5, 22, 10, 'kΩ'), P('Re', 'R_E', 0.5, 3, 1, 'kΩ'), P('Rc', 'R_C', 0.5, 5, 2, 'kΩ')],
        readouts=[R('V_B', '12*R2/(47+R2)', 'V'), R('I_C ≈ I_E', '(12*R2/(47+R2)-0.7)/Re', 'mA'), R('V_CE', '12-(12*R2/(47+R2)-0.7)/Re*(Rc+Re)', 'V')])

    S['bjt_small_signal'] = plot(
        [F('x/0.02585', 'gm = I_C/V_T', 'accent')],
        'Around a bias current the BJT behaves like a controlled source: gm = I_C/V_T (about 39 mS per mA), r_π = β/gm, and a collector resistor turns it into gain A_v = −gm(r_o ∥ R_C).',
        x=[0, 10], xlabel='bias current I_C (mA)', ylabel='mS',
        points=[{'x': 'Ic', 'y': 'Ic/0.02585', 'label': '{Ic/0.02585} mS'}],
        params=[P('Ic', 'bias I_C', 0.1, 10, 1, 'mA'), P('Rc', 'R_C', 0.5, 10, 4, 'kΩ'), P('beta', 'β', 50, 300, 100, step=10)],
        readouts=[R('gm', 'Ic/0.02585', 'mS'), R('r_π = β/gm', 'beta*0.02585/Ic', 'kΩ'), R('A_v = −gm(r_o∥R_C), V_A = 75 V', '-Ic/0.02585*((75/Ic*Rc)/(75/Ic+Rc))')])

    S['bjt_amplifiers'] = plot(
        [F('50*sin(2*pi*x)', 'input (mV)', 'dim'), F('(cfg<1.5 ? -g : (cfg<2.5 ? 0.98 : g))*50*sin(2*pi*x)', 'output (mV)', 'gold', width=2.6)],
        'Same transistor, three connections. Common emitter (1) gives large gain and flips the sign; common collector/emitter follower (2) has gain just under 1 and a low output impedance; common base (3) gives gain without inversion.',
        x=[0, 2], y=[-800, 800], xlabel='time (cycles)',
        params=[P('cfg', 'stage: 1 = CE, 2 = CC, 3 = CB', 1, 3, 1, step=1), P('g', 'voltage gain size g', 2, 15, 10)],
        readouts=[R('gain', 'cfg<1.5 ? -g : (cfg<2.5 ? 0.98 : g)')])

    S['bjt_switch_node'] = plot(
        [F('max(0.2,5-min(beta*max(0,(x-0.7)/Rb),(5-0.2)/Rc)*Rc)', 'V_out', 'accent')],
        'As a switch the BJT is either cut off (V_in < 0.7 V, output = 5 V) or driven hard into saturation (output ≈ 0.2 V). Enough base current (small R_B) guarantees saturation.',
        x=[0, 5], y=[0, 5.5], xlabel='V_in (V)',
        points=[{'x': 5, 'y': 'max(0.2,5-min(beta*(5-0.7)/Rb,(5-0.2)/Rc)*Rc)', 'label': 'at 5 V in'}],
        params=[P('Rb', 'R_B', 1, 100, 10, 'kΩ'), P('Rc', 'R_C', 0.1, 2, 0.5, 'kΩ'), P('beta', 'β', 20, 300, 100, step=10)],
        readouts=[R('saturated? (1 = yes)', 'beta*(5-0.7)/Rb>(5-0.2)/Rc ? 1 : 0'), R('forced β = I_C/I_B', '((5-0.2)/Rc)/((5-0.7)/Rb)'), R('load current', '(5-0.2)/Rc', 'mA')])

    S['mosfet_physics_ee'] = geo([
        rect(-3.2, -2, 6.4, 1.6, 'blue', 'blue', alpha=0.35), text(0, -1.4, 'p-type substrate', 'white', 10),
        rect(-3.2, -0.4, 1.4, 0.4, 'accent', 'accent', alpha=0.6), text(-2.5, -0.2, 'n+', 'white', 10), text(-2.5, 0.4, 'source', 'dim', 9),
        rect(1.8, -0.4, 1.4, 0.4, 'accent', 'accent', alpha=0.6), text(2.5, -0.2, 'n+', 'white', 10), text(2.5, 0.4, 'drain', 'dim', 9),
        rect(-1.8, 0, 3.6, 0.15, 'white', 'white', alpha=0.4), rect(-1.8, 0.15, 3.6, 0.45, 'gold', 'gold', alpha=0.7), text(0, 1.0, 'gate: V_GS = {Vgs} V', 'gold'),
        rect(-1.8, '-0.08-0.12*(Vgs-Vt)', 3.6, '0.08+0.12*(Vgs-Vt)', 'accent', 'accent', alpha=0.85, when='Vgs>Vt'),
        text(0, -0.55, 'channel', 'white', 9, when='Vgs>Vt'), text(0, -0.55, 'no channel', 'dim', 9, when='Vgs<=Vt')],
        [-3.6, 3.6, -2.2, 1.5], 'A positive gate voltage pulls electrons to the surface under the oxide. Once V_GS passes the threshold V_T an n-type channel connects source to drain, and a thicker channel (bigger overdrive) conducts more.',
        params=[P('Vgs', 'gate voltage V_GS', 0, 3, 1.5, 'V'), P('Vt', 'threshold V_T', 0.4, 1.2, 0.7, 'V')],
        readouts=[R('overdrive V_GS − V_T', 'max(0,Vgs-Vt)', 'V'), R('state (1 = on)', 'Vgs>Vt ? 1 : 0')], aspect=0.62)

    def idf(vgs):
        v = f'({vgs}-Vt)'
        return f'if({v}<=0,0,if(x<{v},k*({v}*x-x^2/2),0.5*k*{v}^2))'
    S['mosfet_iv'] = plot(
        [F(idf(g), f'V_GS = {g} V', c) for g, c in zip([1.0, 1.5, 2.0, 2.5], ['#98a2b8', '#6ee7ff', '#ffd166', '#ff8fb1'])] + [F('0.5*k*x^2', 'triode | saturation boundary', '#5b9cff', dash=True)],
        'Below V_DS = V_GS − V_T the MOSFET acts like a voltage-controlled resistor (triode); above it the current saturates at ½k(V_GS−V_T)² and the curves go flat. Raise V_T or lower k to shrink them.',
        x=[0, 3], y=[0, 8], xlabel='V_DS (V)', ylabel='mA',
        params=[P('k', 'k = μCox·W/L', 0.5, 5, 2, 'mA/V²'), P('Vt', 'threshold V_T', 0.3, 1.2, 0.7, 'V')],
        readouts=[R('I_D (sat) at V_GS = 2 V', 'max(0,0.5*k*(2-Vt)^2)', 'mA'), R('gm at V_GS = 2 V', 'max(0,k*(2-Vt))', 'mS')])

    vov = '((-1+sqrt(1+2*k*Rs*(Vg-0.7)))/(k*Rs))'
    S['mosfet_biasing'] = plot(
        [F('x<=0.7 ? 0 : 0.5*k*(x-0.7)^2', 'device: I_D = ½k(V_GS−V_T)²', 'accent'), F('max(0,(Vg-x)/Rs)', 'bias line: (V_G − V_GS)/R_S', 'pink')],
        'Source degeneration stabilises the bias: the device curve and the resistor line cross at the operating point. If the transistor tried to draw more current, the drop across R_S would cut V_GS back. (V_T = 0.7 V)',
        x=[0, 4], y=[0, 4], xlabel='V_GS (V)', ylabel='mA',
        points=[{'x': f'0.7+{vov}', 'y': f'0.5*k*{vov}^2', 'label': 'Q'}],
        params=[P('Vg', 'gate bias V_G', 1.2, 4, 2.5, 'V'), P('Rs', 'R_S', 0.2, 5, 1, 'kΩ'), P('k', 'k', 0.5, 5, 2, 'mA/V²')],
        readouts=[R('V_GS', f'0.7+{vov}', 'V'), R('I_D', f'0.5*k*{vov}^2', 'mA')])

    S['mosfet_amplifiers'] = plot(
        [F('max(0.05,5-RD*(x<=0.7 ? 0 : 0.5*k*(x-0.7)^2))', 'V_out(V_in)', 'accent')],
        'A common-source stage is an amplifier because its transfer curve is steep: the slope at the bias point (the gold tangent) is the gain, A_v ≈ −g_m R_D. Biasing near the steepest part of the curve gives the most gain.',
        x=[0, 3], y=[0, 5.5], xlabel='V_in = V_GS (V)', ylabel='V',
        tangent={'at': 'Vq'},
        params=[P('Vq', 'bias point V_GS', 0.8, 2.2, 1.2, 'V'), P('RD', 'R_D', 0.5, 5, 2, 'kΩ'), P('k', 'k', 0.5, 5, 2, 'mA/V²')],
        readouts=[R('g_m = k(V_GS−V_T)', 'k*(Vq-0.7)', 'mS'), R('gain −g_m R_D (if saturated)', '-k*(Vq-0.7)*RD')])

    S['mosfet_switch_node'] = plot(
        [F('I^2*Rds/1000+9.6e-4*I*x', 'total loss', 'gold', width=2.8), F('I^2*Rds/1000+0*x', 'conduction I²R_DS(on)', 'accent', dash=True), F('9.6e-4*I*x', 'switching loss', 'pink', dash=True)],
        'A MOSFET switch loses power two ways: conduction I²R_DS(on) while on, and switching loss each time it changes state, which grows with frequency. This sets the practical limit on converter frequency. (48 V bus, 20 ns edges.)',
        x=[0, 500], xlabel='switching frequency (kHz)', ylabel='W',
        params=[P('I', 'load current', 1, 30, 10, 'A'), P('Rds', 'R_DS(on)', 5, 200, 20, 'mΩ')],
        readouts=[R('conduction loss', 'I^2*Rds/1000', 'W'), R('switching loss at 100 kHz', '9.6e-4*I*100', 'W')])

    S['cmos_logic_gates'] = blocks([
        ('vdd', 'V_DD', 50, 4, 'red'), ('pu', 'PMOS pull-up: A ∥ B', 50, 28, 'pink'), ('out', 'OUT = NAND(A,B)', 50, 52, 'gold'),
        ('pd', 'NMOS pull-down: A – B in series', 50, 76, 'accent'), ('gnd', 'GND', 50, 96, 'dim'), ('a', 'A', 8, 52), ('b', 'B', 92, 52)],
        [('vdd', 'pu'), ('pu', 'out', 'any input 0'), ('out', 'pd', 'both inputs 1'), ('pd', 'gnd'), ('a', 'pu', None, True), ('a', 'pd', None, True), ('b', 'pu', None, True), ('b', 'pd', None, True)],
        'CMOS gates pair a pull-up and a pull-down network that are never on together. NAND: any 0 on an input turns on a PMOS and pulls the output high; both inputs 1 turns on the series NMOS pair and pulls it low. Only switching draws power (P = αCV²f).', aspect=0.95)

    S['amp_specs'] = blocks([
        ('src', 'Rs = 1 kΩ', 24, 8, 'dim'), ('rin', 'Rin = {Rin} kΩ', 24, 32, 'accent'), ('amp', 'A_v = 100', 24, 56, 'gold'), ('rout', 'Rout = {Rout} kΩ', 76, 56, 'accent'), ('rl', 'RL = {RL} kΩ', 76, 32, 'pink'),
        ('g', 'overall {100*Rin/(1+Rin)*RL/(RL+Rout)} V/V = {20*log10(100*Rin/(1+Rin)*RL/(RL+Rout))} dB', 50, 90, 'green')],
        [('src', 'rin'), ('rin', 'amp'), ('amp', 'rout'), ('rout', 'rl'), ('rl', 'g', None, True)],
        'Real amplifiers lose gain at both ends: the input divides between Rs and Rin, the output between Rout and the load. High Rin and low Rout are the goal: then the overall gain approaches the no-load A_v.',
        params=[P('Rin', 'input resistance', 1, 100, 10, 'kΩ'), P('Rout', 'output resistance', 0.01, 5, 1, 'kΩ'), P('RL', 'load', 0.1, 20, 2, 'kΩ')],
        readouts=[R('input divider Rin/(Rs+Rin)', 'Rin/(1+Rin)'), R('output divider RL/(RL+Rout)', 'RL/(RL+Rout)'), R('overall gain', '100*Rin/(1+Rin)*RL/(RL+Rout)', 'V/V')], aspect=0.8, flow=True)
    S['miller_effect'] = plot(
        [F('159.15/(Rs*(10+Cu*(1+x)))', 'input bandwidth f₃dB (MHz)', 'accent')],
        'A small capacitor across an inverting amplifier looks (1 + |A_v|) times bigger at the input: C_M = Cμ(1 + |A_v|). That slows the input pole, so high gain costs bandwidth. (C_π = 10 pF.)',
        x=[0, 300], xlabel='voltage gain |A_v|', ylabel='MHz',
        points=[{'x': 'Av', 'y': '159.15/(Rs*(10+Cu*(1+Av)))', 'label': '{159.15/(Rs*(10+Cu*(1+Av)))} MHz'}],
        params=[P('Av', 'gain |A_v|', 1, 300, 100), P('Cu', 'feedback C μ', 0.5, 5, 2, 'pF'), P('Rs', 'source R_s', 1, 20, 5, 'kΩ')],
        readouts=[R('Miller capacitance C_M', 'Cu*(1+Av)', 'pF'), R('total input C', '10+Cu*(1+Av)', 'pF'), R('f₃dB', '159.15/(Rs*(10+Cu*(1+Av)))', 'MHz')])

    S['differential_amp'] = plot(
        [F('Iss*tanh(x/(2*0.02585))', 'I_C1 − I_C2', 'accent'), F('clamp(Iss*x/(2*0.02585),-Iss,Iss)', 'linear small-signal', 'dim', dash=True)],
        'A differential pair steers the tail current Iss toward whichever input is higher. Only the difference V_id matters: output ∝ tanh(V_id/2V_T), linear for |V_id| below about 20 mV.',
        x=[-0.15, 0.15], y=[-5.2, 5.2], xlabel='differential input V_id (V)', ylabel='mA',
        params=[P('Iss', 'tail current Iss', 0.5, 5, 2, 'mA')],
        readouts=[R('g_m per side = Iss/(4V_T)', 'Iss/(4*0.02585)', 'mS'), R('linear range ≈ ±', '26', 'mV'), R('CMRR for 80 dB', '10^(80/20)')])

    S['current_mirror'] = plot(
        [F('x<0.2 ? m*Iref*x/0.2 : m*Iref*(1+(x-0.2)/VA)', 'I_out', 'accent'), F('m*Iref', 'ideal copy', 'dim', dash=True)],
        'A current mirror copies I_ref (times the W/L ratio m) to the output. It stays near-constant once V_out passes the compliance voltage; the slope is 1/r_o with r_o ≈ V_A/I.',
        x=[0, 5], xlabel='output voltage V_out (V)', ylabel='µA',
        params=[P('Iref', 'reference current', 10, 200, 100, 'µA'), P('m', 'mirror ratio', 1, 4, 1, step=1), P('VA', 'Early voltage', 10, 100, 40, 'V')],
        readouts=[R('I_out at 3 V', 'm*Iref*(1+(3-0.2)/VA)', 'µA'), R('output resistance V_A/I', 'VA/(m*Iref*0.001)', 'kΩ')])

    S['active_load'] = plot(
        [F('2*sqrt(x)*RD', 'resistor load (RD)', 'pink'), F('2*sqrt(x)/(2*lam*x)', 'active load (current source)', 'accent')],
        'Replacing the drain resistor with a current source makes the load resistance r_o instead of R_D, so gain jumps from g_m·R_D to about g_m·r_o/2: tens or hundreds instead of single digits.',
        x=[0.05, 2], xlabel='bias current I_D (mA)', ylabel='gain',
        params=[P('lam', 'channel-length λ', 0.01, 0.1, 0.05, '1/V'), P('RD', 'resistor R_D', 2, 20, 10, 'kΩ')],
        readouts=[R('active-load gain at 0.2 mA', '2*sqrt(0.2)/(2*lam*0.2)'), R('resistor gain at 0.2 mA', '2*sqrt(0.2)*RD')])

    S['multistage_amps'] = blocks([
        ('v', 'input', 50, 5, 'dim'), ('a1', 'stage 1: {g1} dB', 50, 27, 'accent'), ('a2', 'stage 2: {g2} dB', 50, 49, 'accent'), ('a3', 'stage 3: {g3} dB', 50, 71, 'accent'),
        ('t', 'total {g1+g2+g3} dB = {10^((g1+g2+g3)/20)} V/V', 50, 94, 'gold')],
        [('v', 'a1'), ('a1', 'a2'), ('a2', 'a3'), ('a3', 't')],
        'Gains of cascaded stages multiply, so in decibels they simply add. But every stage adds its own bandwidth limit: three identical stages shrink the overall bandwidth to about 0.51 of one stage.',
        params=[P('g1', 'stage 1', 0, 40, 20, 'dB'), P('g2', 'stage 2', 0, 40, 20, 'dB'), P('g3', 'stage 3', 0, 40, 10, 'dB')],
        readouts=[R('total gain', 'g1+g2+g3', 'dB'), R('overall V/V', '10^((g1+g2+g3)/20)'), R('bandwidth of 3 equal stages', '0.51', '× one stage')], aspect=0.8)
    S['output_stages'] = plot(
        [F('Vp*sin(2*pi*x)', 'input', 'dim'), F('(Vp*sin(2*pi*x)>0 ? 1 : -1)*max(0,abs(Vp*sin(2*pi*x))-(0.7-Vb))', 'class AB output (bias Vb)', 'accent', width=2.6)],
        'A class B push–pull stage is efficient (up to π/4 = 78.5%) but both transistors are off around zero, so the output has a dead zone: crossover distortion. A little bias (class AB, Vb→0.7 V) closes the gap at some cost in efficiency.',
        x=[0, 2], y=[-11, 11], xlabel='time (cycles)',
        params=[P('Vp', 'signal peak', 2, 10, 5, 'V'), P('Vb', 'bias voltage Vb', 0, 0.7, 0.1, 'V')],
        readouts=[R('dead zone width', '2*(0.7-Vb)', 'V'), R('class B efficiency at this peak (Vcc = 10 V)', '78.5*Vp/10', '%')])

    S['opamp_ideal'] = plot(
        [F('clamp(Ak*1000*x*1e-3,-12,12)', 'V_out = A·(V₊ − V₋), limited to ±12 V', 'accent')],
        'An op-amp multiplies the tiny difference between its inputs by a huge gain A and then saturates at the supply. In negative feedback the output adjusts until V₊ ≈ V₋: that is the first golden rule.',
        x=[-0.3, 0.3], y=[-14, 14], xlabel='V₊ − V₋ (mV)', ylabel='V',
        params=[P('Ak', 'open-loop gain A', 10, 1000, 100, '×10³')],
        readouts=[R('linear range ±(12 V / A)', '12/(Ak*1000)*1e6', 'µV')])

    for key, gg, cap, rows in [
        ('inverting_amp_node', '-Rf/Rin', 'Gain = −Rf/Rin: the output is an inverted, scaled copy of the input, and the inverting input stays at a virtual ground. Make Rf/Rin large enough and the output clips at the supply (±13 V).', [P('Rf', 'R_f', 1, 100, 40, 'kΩ'), P('Rin', 'R_in', 1, 20, 4, 'kΩ'), P('Vi', 'input amplitude', 0.1, 2, 0.5, 'V')]),
        ('non_inverting_amp_node', '1+Rf/Rg', 'Gain = 1 + Rf/Rg: the output follows the input in phase and is never smaller than the input. Rg → ∞ gives a unity-gain buffer. Large gains clip at the supply (±13 V).', [P('Rf', 'R_f', 1, 100, 40, 'kΩ'), P('Rg', 'R_g', 1, 20, 5, 'kΩ'), P('Vi', 'input amplitude', 0.1, 2, 0.5, 'V')])]:
        S[key] = plot(
            [F('Vi*sin(2*pi*x)', 'input', 'dim'), F(f'clamp(({gg})*Vi*sin(2*pi*x),-13,13)', 'output', 'accent', width=2.6)],
            cap, x=[0, 2], y=[-14, 14], xlabel='time (cycles)',
            params=rows, readouts=[R('gain', gg), R('output peak', f'min(13,abs({gg})*Vi)', 'V')])

    S['summing_amp_node'] = plot(
        [F('sin(2*pi*x)', 'V₁ (1 V peak)', 'dim'), F('v2*sin(6*pi*x)', 'V₂', 'dim'), F('-(g1*sin(2*pi*x)+g2*v2*sin(6*pi*x))', 'V_out = −(g₁V₁ + g₂V₂)', 'gold', width=2.6)],
        'Each input sees its own gain Rf/Rᵢ, and the output is the inverted weighted sum. This is how audio mixers and DACs add signals. Change the gains to rebalance the mix.',
        x=[0, 2], y=[-4.5, 4.5], xlabel='time (cycles)',
        params=[P('g1', 'g₁ = R_f/R₁', 0.2, 3, 1), P('g2', 'g₂ = R_f/R₂', 0.2, 3, 2), P('v2', 'V₂ peak', 0.2, 1.5, 0.5, 'V')],
        readouts=[R('largest possible output', 'g1+g2*v2', 'V')])

    S['integrator_node'] = plot(
        [F('sign(sin(2*pi*f*x))', 'input square wave (±1 V)', 'dim'), F('clamp(asin(cos(2*pi*f*x))/(2*pi*f*R*C),-13,13)', 'output triangle', 'gold', width=2.6)],
        'Output = −(1/RC)∫V_in dt: a constant input makes the output ramp at a steady slope, so a square wave becomes a triangle. A bigger RC gives a smaller, slower ramp.',
        x=[0, 4], y=[-3.5, 3.5], xlabel='time (ms)',
        params=[P('R', 'R', 1, 100, 10, 'kΩ'), P('C', 'C', 0.01, 1, 0.05, 'µF'), P('f', 'frequency', 0.2, 2, 1, 'kHz')],
        readouts=[R('ramp slope 1/RC', '1/(R*C)', 'V/ms'), R('triangle peak-to-peak', '1/(2*f*R*C)', 'V')])

    S['differentiator_node'] = plot(
        [F('2/pi*asin(sin(2*pi*f*x))', 'input triangle (±1 V)', 'dim'), F('clamp(-R*C*f*4*sign(cos(2*pi*f*x)),-13,13)', 'output square', 'gold', width=2.6)],
        'Output = −RC·dV_in/dt: the output is proportional to the input’s slope, so a triangle (constant slope) becomes a square wave. Fast edges and noise are amplified, which is why real differentiators add a small series resistor.',
        x=[0, 4], y=[-6.5, 6.5], xlabel='time (ms)',
        params=[P('R', 'R', 1, 100, 10, 'kΩ'), P('C', 'C', 0.01, 1, 0.1, 'µF'), P('f', 'frequency', 0.2, 2, 1, 'kHz')],
        readouts=[R('output amplitude 4RCf·V', '4*R*C*f', 'V')])

    S['instrumentation_amp'] = plot(
        [F('1*sin(2*pi*x/20)+0.01*sin(2*pi*x/5)/2', 'input V₊ (hum + signal)', 'dim'), F('1*sin(2*pi*x/20)-0.01*sin(2*pi*x/5)/2', 'input V₋', 'dim', dash=True),
         F('(1+50000/RG)*(0.01*sin(2*pi*x/5)+1*sin(2*pi*x/20)/10^(cm/20))', 'output', 'gold', width=2.6)],
        'Both inputs carry 1 V of 50 Hz hum, but the signal is only a 10 mV difference. The instrumentation amp multiplies just the difference by G = 1 + 2R/R_G and rejects the common part by its CMRR.',
        x=[0, 40], y=[-1.4, 1.4], xlabel='time (ms)',
        params=[P('RG', 'gain resistor R_G', 100, 5000, 500, 'Ω'), P('cm', 'CMRR', 40, 120, 100, 'dB')],
        readouts=[R('gain G = 1 + 50 kΩ / R_G', '1+50000/RG'), R('hum left at output', '(1+50000/RG)/10^(cm/20)', 'V')])

    S['comparator_node'] = plot(
        [F('Vp*sin(2*pi*x)', 'input', 'dim'), F('Vp*sin(2*pi*x)>Vref ? 5 : 0', 'comparator output', 'gold', width=2.6)],
        'A comparator has no feedback: it just reports which input is larger, swinging fully to the rail either way. Move the reference and the pulse width changes, which is the basis of PWM generators and zero-crossing detectors.',
        x=[0, 2], y=[-5.5, 6], xlabel='time (cycles)',
        hlines=[{'y': 'Vref', 'label': 'V_ref', 'color': 'pink'}],
        params=[P('Vref', 'reference V_ref', -2.5, 2.5, 0.5, 'V'), P('Vp', 'input peak', 1, 5, 3, 'V')],
        readouts=[R('high for fraction of cycle', 'abs(Vref)>=Vp ? (Vref<0 ? 100 : 0) : 100*(0.5-asin(Vref/Vp)/pi)', '%')])

    vh = '(5*R1/(R1+R2))'
    S['schmitt_trigger_node'] = plot(
        [F(f'x>{vh} ? 5 : -5', 'rising input path', 'accent', width=2.6), F(f'x>-{vh} ? 5 : -5', 'falling input path', 'pink', dash=True)],
        'A Schmitt trigger has two thresholds ±V_H = ±5·R₁/(R₁+R₂). The output only flips high above +V_H and low below −V_H, so noise near a single threshold cannot make it chatter. The gap between paths is the hysteresis loop.',
        x=[-4, 4], y=[-6.5, 6.5], xlabel='input voltage (V)', ylabel='V',
        vlines=[{'x': vh, 'label': '+V_H'}, {'x': f'-{vh}', 'label': '−V_H'}],
        params=[P('R1', 'R₁', 1, 20, 5, 'kΩ'), P('R2', 'R₂', 5, 50, 15, 'kΩ')],
        readouts=[R('threshold ±V_H', vh, 'V'), R('hysteresis width 2V_H', f'2*{vh}', 'V')])

    S['opamp_nonideal'] = plot(
        [F('min(13,SR*1e6/(2*pi*x))', 'max undistorted amplitude (V)', 'accent')],
        'A real op-amp output cannot change faster than its slew rate SR. For a sine of peak Vp that limits full-power bandwidth to f = SR/(2πVp). Gain-bandwidth GBW also trades gain for speed: BW = GBW/gain.',
        x=[1000, 10000000], y=[0.05, 20], logx=True, logy=True, xlabel='frequency (Hz)',
        vlines=[{'x': 'SR*1e6/(2*pi*Vp)', 'label': 'f_FP'}],
        params=[P('SR', 'slew rate', 0.1, 20, 0.5, 'V/µs'), P('Vp', 'desired peak output', 1, 12, 10, 'V'), P('G', 'closed-loop gain', 1, 100, 10, step=1)],
        readouts=[R('full-power bandwidth SR/2πVp', 'SR*1e6/(2*pi*Vp)/1000', 'kHz'), R('small-signal bandwidth 1 MHz / G', '1000/G', 'kHz')])

    S['negative_feedback_ee'] = plot(
        [F('x/(1+x*b)', 'closed-loop gain A/(1+Aβ)', 'accent')],
        'Negative feedback trades raw gain for precision: once Aβ ≫ 1 the closed-loop gain locks to 1/β no matter how large or drifty the open-loop gain A is.',
        x=[1, 1000000], y=[0, 105], logx=True, xlabel='open-loop gain A',
        hlines=[{'y': '1/b', 'label': '1/β', 'color': 'gold'}],
        points=[{'x': 'A', 'y': 'A/(1+A*b)', 'label': '{A/(1+A*b)}'}],
        params=[P('b', 'feedback fraction β', 0.01, 0.5, 0.1), P('A', 'open-loop gain A', 10, 1000000, 10000, step=10)],
        readouts=[R('closed-loop gain A_f', 'A/(1+A*b)'), R('ideal 1/β', '1/b'), R('desensitivity 1+Aβ', '1+A*b')])

    S['feedback_stability_margins'] = plot(
        [F('if(pm<89, 1-exp(-(pm/100)*x)*(cos(sqrt(1-(pm/100)^2)*x)+(pm/100)/sqrt(1-(pm/100)^2)*sin(sqrt(1-(pm/100)^2)*x)), 1-exp(-0.9*x)*(cos(0.436*x)+0.9/0.436*sin(0.436*x)))', 'closed-loop step response', 'accent'), F('1', None, 'dim', dash=True)],
        'Phase margin tells you how far the loop is from oscillating. Rule of thumb ζ ≈ PM/100: at 20° the step response rings hard, at 60° it is well behaved, at 0° it would oscillate forever.',
        x=[0, 20], y=[0, 2], xlabel='time (units of 1/ωc)',
        params=[P('pm', 'phase margin', 15, 85, 45, '°')],
        readouts=[R('overshoot', '100*exp(-pi*(pm/100)/sqrt(1-(pm/100)^2))', '%'), R('damping ζ ≈ PM/100', 'pm/100')])

    S['oscillators_ee'] = plot(
        [F('clamp(0.01*exp(20*(G-3)*x)*sin(2*pi*159.155/(R*C)*x),-5,5)', 'oscillator output (V)', 'accent')],
        'A Wien-bridge oscillator needs loop gain 1 at f = 1/(2πRC): amplifier gain of 3. Slightly more (G > 3) lets a tiny noise signal grow until the output clips; slightly less and it dies out.',
        x=[0, 10], y=[-6, 6], xlabel='time (ms)',
        params=[P('R', 'R', 2, 50, 10, 'kΩ'), P('C', 'C', 2, 100, 10, 'nF'), P('G', 'amplifier gain G', 2.6, 3.4, 3.1)],
        readouts=[R('f = 1/(2πRC)', '159155/(R*C)', 'Hz'), R('start-up?', 'G>3 ? 1 : 0', '(1 = oscillates)')])

    S['active_filters'] = spec('bode', 'A Sallen–Key low-pass uses one op-amp (gain K) to turn a passive RC ladder into a sharp 2nd-order filter with Q = 1/(3 − K). Raising K peaks the response at the cut-off; K → 3 oscillates.',
        k='K', poles=[['-w0/(2*(1/(3-K)))', 'w0*sqrt(1-1/(4*(1/(3-K))^2))'], ['-w0/(2*(1/(3-K)))', '-w0*sqrt(1-1/(4*(1/(3-K))^2))']], w=[100, 1000000], unit='rad/s',
        params=[P('w0', 'cut-off ω₀', 1000, 100000, 10000, 'rad/s', step=500), P('K', 'amplifier gain K', 1.1, 2.9, 1.586)],
        readouts=[R('Q = 1/(3 − K)', '1/(3-K)'), R('cut-off f₀', 'w0/(2*pi)', 'Hz')])

    S['adc_basics'] = plot(
        [F('0.95*sin(2*pi*x)', 'analog input', 'dim'), F('round(0.95*sin(2*pi*x)*2^(nb-1))/2^(nb-1)', 'quantised output', 'gold', width=2.6)],
        'An ADC rounds the voltage to one of 2ᴺ levels. Each extra bit halves the step (the LSB), reducing quantisation noise by 6 dB: SNR = 6.02N + 1.76 dB for a full-scale sine.',
        x=[0, 1], y=[-1.15, 1.15], xlabel='time (cycles), full scale = ±1',
        params=[P('nb', 'resolution N', 2, 8, 3, 'bits', step=1)],
        readouts=[R('levels 2ᴺ', '2^nb'), R('LSB for 3.3 V range', '3300/2^nb', 'mV'), R('ideal SNR', '6.02*nb+1.76', 'dB')])

    S['dac_basics'] = plot(
        [F('min(floor(x),15)/16*Vref', 'analog output', 'accent', width=2.6), F('x/16*Vref', 'ideal straight line', 'dim', dash=True)],
        'A 4-bit DAC turns each code 0–15 into one of 16 voltages (code/16)·V_ref. The steps are the converter’s resolution: more bits, finer steps. (A binary-weighted or R-2R ladder sums currents to do this.)',
        x=[0, 16], y=[0, 3.6], xlabel='input code',
        points=[{'x': 'code', 'y': 'code/16*Vref', 'label': '{code/16*Vref} V'}],
        params=[P('Vref', 'reference V_ref', 1, 3.3, 3.3, 'V'), P('code', 'digital code', 0, 15, 9, step=1)],
        readouts=[R('output code/16·V_ref', 'code/16*Vref', 'V'), R('LSB', 'Vref/16*1000', 'mV')])

    S['linear_regulators'] = plot(
        [F('Vo*x*0.001', 'useful output power', 'accent'), F('(Vin-Vo)*x*0.001', 'heat in regulator', 'pink')],
        'A linear regulator holds V_out by burning the excess voltage as heat: P = (V_in − V_out)·I. Its efficiency is just V_out/V_in, so a big input-to-output gap at high current gets hot quickly.',
        x=[0, 1000], xlabel='load current (mA)', ylabel='W',
        points=[{'x': 'I', 'y': '(Vin-Vo)*I*0.001', 'label': '{(Vin-Vo)*I*0.001} W heat'}],
        params=[P('Vin', 'input V_in', 5, 24, 12, 'V'), P('Vo', 'output V_out', 1.8, 5, 3.3, 'V'), P('I', 'load current', 10, 1000, 300, 'mA')],
        readouts=[R('efficiency V_out/V_in', '100*Vo/Vin', '%'), R('heat', '(Vin-Vo)*I*0.001', 'W')])
