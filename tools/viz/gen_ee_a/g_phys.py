from lib import *
import math

def build(S):
    # ---- projectile / kinematics ----
    T = '(2*v*sin(rad(an))/9.81)'
    S['mechanics_kinematics'] = geo([
        line(0, 0, 100, 0, 'dim', 2),
        curve(f'v*cos(rad(an))*{T}*s', f'v*sin(rad(an))*{T}*s-4.905*({T}*s)^2', [0, 1], 'accent'),
        point(f'v*cos(rad(an))*mod(t,{T})', f'v*sin(rad(an))*mod(t,{T})-4.905*mod(t,{T})^2', 'gold', 7),
        arrow(0, 0, 'v*cos(rad(an))*1.2', 'v*sin(rad(an))*1.2', 'pink', 2.5),
        arrow(f'v*cos(rad(an))*mod(t,{T})', f'v*sin(rad(an))*mod(t,{T})-4.905*mod(t,{T})^2', f'v*cos(rad(an))*mod(t,{T})', f'v*sin(rad(an))*mod(t,{T})-4.905*mod(t,{T})^2-6', 'orange', 2)],
        [-4, 100, -6, 46], 'Newton’s F = ma with only gravity acting: horizontal speed stays constant while vertical speed changes by 9.81 m/s every second. Change launch speed and angle.',
        params=[P('v', 'launch speed', 5, 30, 22, 'm/s'), P('an', 'launch angle', 10, 80, 45, '°')],
        readouts=[R('range v²sin2θ/g', 'v^2*sin(2*rad(an))/9.81', 'm'), R('peak height', 'v^2*sin(rad(an))^2/19.62', 'm'), R('flight time', T, 's')], aspect=0.5)

    S['energy_momentum'] = plot(
        [F('0.5*100*x^2', 'potential ½kx²', 'accent'), F('0.5*100*(A^2-x^2)', 'kinetic', 'pink'), F('0.5*100*A^2', 'total E', 'dim', dash=True)],
        'A mass on a spring swaps energy between potential and kinetic while the total stays fixed (k = 100 N/m). The dots show the swap live; power is the rate this energy moves, P = dE/dt.',
        x=[-1, 1], y=[0, 55], xlabel='position x (m)', ylabel='energy (J)',
        points=[{'x': 'A*cos(3*t)', 'y': '0.5*100*(A*cos(3*t))^2', 'label': 'PE', 'color': 'accent'},
                {'x': 'A*cos(3*t)', 'y': '0.5*100*(A^2-(A*cos(3*t))^2)', 'label': 'KE', 'color': 'pink'}],
        params=[P('A', 'amplitude A', 0.2, 1, 0.7, 'm')],
        readouts=[R('total energy ½kA²', '0.5*100*A^2', 'J'), R('peak speed A√(k/m), m=1 kg', 'A*10', 'm/s')])

    S['gauss_law_ee'] = plot(
        [F('x<R ? 8.99*Q*x/R^3 : 8.99*Q/x^2', 'E(r)', 'accent')],
        'For a uniformly charged ball, Gauss’s law gives E growing linearly inside and falling as 1/r² outside, as if all the charge sat at the centre. The total flux is always Q/ε₀.',
        x=[0, 0.5], xlabel='distance from centre r (m)', ylabel='E (V/m)',
        vlines=[{'x': 'R', 'label': 'R'}],
        params=[P('Q', 'charge Q', 1, 10, 5, 'nC'), P('R', 'ball radius R', 0.05, 0.2, 0.1, 'm')],
        readouts=[R('E at surface', '8.99*Q/R^2', 'V/m'), R('flux Q/ε₀', 'Q*1e-9/8.854e-12', 'V·m')])

    S['capacitance_physics'] = geo([
        rect('-sqrt(A)*0.18', 'dd*0.3', 'sqrt(A)*0.36', 0.15, 'accent', 'accent'),
        rect('-sqrt(A)*0.18', '-dd*0.3-0.15', 'sqrt(A)*0.36', 0.15, 'pink', 'pink'),
        rect('-sqrt(A)*0.18', '-dd*0.3', 'sqrt(A)*0.36', 'dd*0.6', 'gold', 'gold', alpha='0.04*er', stroke=False),
        *[arrow(f'{x}*sqrt(A)*0.1', '-dd*0.3', f'{x}*sqrt(A)*0.1', 'dd*0.3', 'white', 1.5) for x in (-1.5, -0.5, 0.5, 1.5)],
        text(0, 1.75, '+Q', 'accent'), text(0, -1.75, '−Q', 'pink'),
        text(2.4, 0, 'd = {dd} mm', 'white', 10), text(-2.4, 0, 'εr = {er}', 'gold', 10)],
        [-3.3, 3.3, -2, 2], 'C = εA/d: bigger plates, a smaller gap or a dielectric (εr) all store more charge per volt. The energy at 10 V is ½CV².',
        params=[P('A', 'plate area', 10, 100, 40, 'cm²'), P('dd', 'gap d', 0.5, 5, 2, 'mm'), P('er', 'dielectric εr', 1, 10, 1, step=0.5)],
        readouts=[R('C = ε₀εrA/d', '0.8854*er*A/dd', 'pF'), R('charge at 10 V', '8.854*er*A/dd', 'pC'), R('energy ½CV² at 10 V', '0.5*0.8854*er*A/dd*100*1e-3', 'nJ')], aspect=0.6)

    S['current_resistance_physics'] = geo([
        rect(-3, '-d0*0.5', 'LL*0.05', 'd0', 'gold', 'gold', alpha=0.5),
        text(0, 1.5, 'wire:  L = {LL} m,  d = {d0} mm', 'white'),
        arrow(-3.5, 0, -3.05, 0, 'accent', 3), text(-3.4, 0.4, 'I', 'accent', 10)],
        [-4, 4.2, -2, 2], 'R = ρL/A: a longer, thinner or more resistive wire resists current more. Copper is 17 nΩ·m; nichrome heater wire is about 1100 nΩ·m.',
        params=[P('LL', 'length L', 1, 100, 30, 'm'), P('d0', 'diameter d', 0.2, 2, 0.8, 'mm'), P('rho', 'resistivity ρ', 10, 1100, 17, 'nΩ·m')],
        readouts=[R('area A', 'pi*d0^2/4', 'mm²'), R('R = ρL/A', 'rho*1e-9*LL/(pi*(d0*1e-3)^2/4)', 'Ω'), R('drop at 5 A', '5*rho*1e-9*LL/(pi*(d0*1e-3)^2/4)', 'V')], aspect=0.4)

    xs = [(-20 + 10 * i, -12 + 8 * j) for i in range(5) for j in range(3)]
    S['magnetic_fields_forces'] = geo([
        *[text(a, b, '×', 'dim', 12) for a, b in xs],
        circle(0, 0, '5.69*vM/B', 'accent', alpha=0.8),
        point('5.69*vM/B*cos(1.5*t)', '5.69*vM/B*sin(1.5*t)', 'gold', 8),
        arrow('5.69*vM/B*cos(1.5*t)', '5.69*vM/B*sin(1.5*t)', '5.69*vM/B*cos(1.5*t)-4*sin(1.5*t)', '5.69*vM/B*sin(1.5*t)+4*cos(1.5*t)', 'pink', 2.5),
        text(0, -15.5, 'B into page (×),  electron circles at r = mv/qB', 'dim', 10)],
        [-26, 26, -17, 17], 'The magnetic force F = qv×B is always sideways to the motion, so it only turns the electron: circular orbit of radius r = mv/(eB). More B or less speed tightens the circle.',
        params=[P('vM', 'electron speed', 1, 3, 2, '×10⁶ m/s'), P('B', 'field B', 1.5, 6, 3, 'mT')],
        readouts=[R('orbit radius', '5.69*vM/B', 'mm'), R('cyclotron freq', '28*B', 'MHz')], aspect=0.6)

    S['faraday_lenz'] = plot(
        [F('N*B*0.01*1000*cos(2*pi*f*x)', 'flux linkage NΦ (mWb)', 'accent'), F('N*B*0.01*2*pi*f*1000*sin(2*pi*f*x)/1000', 'emf = −dΦ/dt (V)', 'gold', width=2.6)],
        'A coil spinning in a field has flux that varies as cos; the induced voltage is its negative slope, so it is a sine 90° ahead. Faster spin, stronger B or more turns give more emf.',
        x=[0, 0.04], xlabel='time (s)',
        points=[{'x': 'mod(t*0.02,0.04)', 'y': 'N*B*0.01*2*pi*f*sin(2*pi*f*mod(t*0.02,0.04))', 'label': 'emf now'}],
        params=[P('B', 'field B', 0.05, 0.5, 0.2, 'T'), P('f', 'rotation freq', 10, 100, 50, 'Hz'), P('N', 'turns N', 1, 100, 10, step=1)],
        readouts=[R('peak emf N B A ω (A = 0.01 m²)', 'N*B*0.01*2*pi*f', 'V')])

    S['inductance_physics'] = plot(
        [F('0.5*(4*pi*1e-7*mur*N^2*3.14e-4/0.1)*1000*x^2', 'U = ½LI²  (mJ)', 'accent')],
        'A solenoid’s inductance is L = μ₀μr N²A/ℓ: more turns (squared!) or an iron core (μr large) multiply the energy ½LI² stored in its magnetic field. Here A = 3.14 cm², ℓ = 10 cm.',
        x=[0, 2], xlabel='current I (A)', ylabel='stored energy (mJ)',
        points=[{'x': 'I0', 'y': '0.5*(4*pi*1e-7*mur*N^2*3.14e-4/0.1)*1000*I0^2', 'label': '{0.5*(4*pi*1e-7*mur*N^2*3.14e-4/0.1)*1000*I0^2} mJ'}],
        params=[P('N', 'turns N', 20, 500, 100, step=10), P('mur', 'core μr', 1, 500, 1, step=1), P('I0', 'current I', 0.1, 2, 1, 'A')],
        readouts=[R('L = μ₀μr N²A/ℓ', '4*pi*1e-7*mur*N^2*3.14e-4/0.1*1000', 'mH')])

    s2 = 'n1*sin(rad(th1))/n2'
    S['optics_basics'] = geo([
        rect(-4, -3, 8, 3, 'accent', 'accent', alpha='0.04*n2', stroke=False),
        rect(-4, 0, 8, 3, 'gold', 'gold', alpha='0.04*n1', stroke=False),
        line(-4, 0, 4, 0, 'white', 1.5), line(0, -3, 0, 3, 'dim', 1, dash=True),
        line('-3*sin(rad(th1))', '3*cos(rad(th1))', 0, 0, 'gold', 3),
        line(0, 0, f'3*({s2})', f'-3*sqrt(1-({s2})^2)', 'accent', 3, when=f'({s2})<=1'),
        line(0, 0, '3*sin(rad(th1))', '3*cos(rad(th1))', 'pink', 3, when=f'({s2})>1'),
        text(-3, 2.6, 'n₁ = {n1}', 'gold'), text(-3, -2.6, 'n₂ = {n2}', 'accent'),
        text(2.5, 1.2, f'when TIR: all reflected', 'pink', 10, when=f'({s2})>1')],
        [-4, 4, -3, 3], 'Snell’s law n₁ sinθ₁ = n₂ sinθ₂: light bends toward the normal when entering a denser medium. Going from dense to less dense at a steep angle there is no refracted ray at all: total internal reflection.',
        params=[P('th1', 'incident angle θ₁', 0, 85, 40, '°'), P('n1', 'n₁ (top)', 1, 2, 1.5), P('n2', 'n₂ (bottom)', 1, 2, 1)],
        readouts=[R('θ₂ (0 = no refracted ray)', f'({s2})<=1 ? deg(asin({s2})) : 0', '°'), R('critical angle (if n₁>n₂)', 'n1>n2 ? deg(asin(n2/n1)) : 90', '°')], aspect=0.75)

    S['photoelectric_effect'] = plot(
        [F('max(0,0.4136*x-phi)', 'kinetic energy of electrons', 'accent')],
        'Light arrives as photons of energy E = hf. Below the threshold frequency no electrons escape at all, however bright; above it each photon frees one electron with kinetic energy hf − φ.',
        x=[0, 15], y=[0, 6.5], xlabel='light frequency (×10¹⁴ Hz)', ylabel='max electron KE (eV)',
        vlines=[{'x': 'phi/0.4136', 'label': 'threshold'}],
        points=[{'x': 'fp', 'y': 'max(0,0.4136*fp-phi)', 'label': '{max(0,0.4136*fp-phi)} eV'}],
        params=[P('phi', 'work function φ', 1, 5, 2.3, 'eV'), P('fp', 'light frequency', 1, 15, 8, '×10¹⁴ Hz')],
        readouts=[R('photon energy hf', '0.4136*fp', 'eV'), R('threshold frequency φ/h', 'phi/0.4136', '×10¹⁴ Hz')])

    sh = lambda r, cnt, off: [point(f'{r}*cos({2*math.pi*i/8:.4f}+{off}*t)', f'{r}*sin({2*math.pi*i/8:.4f}+{off}*t)', 'gold', 5, when=f'{i}<({cnt})') for i in range(8)]
    S['atomic_structure_ee'] = geo([
        circle(0, 0, 0.35, 'pink', 'pink'), text(0, 0, '+{Z}', 'white', 9),
        circle(0, 0, 1.0, 'dim', alpha=0.6), circle(0, 0, 1.8, 'dim', alpha=0.6), circle(0, 0, 2.6, 'dim', alpha=0.6),
        *sh(1.0, 'min(Z,2)', 1.4), *sh(1.8, 'min(max(Z-2,0),8)', 0.8), *sh(2.6, 'min(max(Z-10,0),8)', 0.5),
        text(0, -3.0, 'shells hold 2, 8, 8 electrons', 'dim', 10)],
        [-3.4, 3.4, -3.3, 3.1], 'Electrons fill shells from the inside out. Chemistry and conduction are set by the outer (valence) electrons: step Z from 10 (neon) to 11 (sodium) to 14 (silicon, 4 valence).',
        params=[P('Z', 'atomic number Z', 1, 18, 14, step=1)],
        readouts=[R('electrons in outer shell', 'Z<=2 ? Z : (Z<=10 ? Z-2 : Z-10)')], aspect=0.8)

    S['bonding_materials'] = spec('bars', 'Resistivity spans over 25 orders of magnitude, set by how freely electrons can move: metals share a sea of electrons, semiconductors have a small gap, insulators a huge one. Bars show powers of ten above copper (NiCr = nichrome, n-Si = doped silicon) (1.7×10⁻⁸ Ω·m).',
        bars=[{'label': 'Ag', 'value': 0, 'color': 'accent'}, {'label': 'Cu', 'value': 0, 'color': 'accent'}, {'label': 'NiCr', 'value': 1.8, 'color': 'accent'},
              {'label': 'n-Si', 'value': 6.2, 'color': 'gold'}, {'label': 'Si', 'value': 11.1, 'color': 'gold'}, {'label': 'glass', 'value': 18.8, 'color': 'pink'}, {'label': 'SiO₂', 'value': 24.6, 'color': 'pink'}],
        ylabel='orders of magnitude above copper')

    S['batteries_electrochem'] = plot(
        [F('E0-(8.617e-5*T/nn)*ln(x)', 'cell voltage E', 'accent')],
        'The Nernst equation E = E° − (RT/nF) ln Q: cell voltage sags as reaction products build up (Q rises) and is E° when Q = 1. Hotter cells and fewer transferred electrons change the slope.',
        x=[0.001, 1000], logx=True, xlabel='reaction quotient Q', ylabel='E (V)',
        points=[{'x': 1, 'y': 'E0', 'label': 'E° = {E0} V'}],
        params=[P('E0', 'standard potential E°', 0.5, 1.6, 1.1, 'V'), P('T', 'temperature', 273, 333, 298, 'K'), P('nn', 'electrons n', 1, 3, 2, step=1)],
        readouts=[R('change per decade of Q', '-0.19844*T/nn', 'mV')])
