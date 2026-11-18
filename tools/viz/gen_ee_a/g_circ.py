from lib import *
import math

def W(x1, y1, x2, y2, c='white'):
    return line(x1, y1, x2, y2, c, 1.6)

def step2(a, w0, z):
    wd = f"{w0}*sqrt(1-({z})^2)"; wh = f"{w0}*sqrt(({z})^2-1)"
    under = f"1-exp(-{a}*x)*(cos({wd}*x)+{a}/({wd})*sin({wd}*x))"
    over = f"1-exp(-{a}*x)*(cosh({wh}*x)+{a}/({wh})*sinh({wh}*x))"
    crit = f"1-(1+{w0}*x)*exp(-{w0}*x)"
    return f"if(abs(({z})-1)<0.03,{crit},if(({z})<1,{under},{over}))"

def build(S):
    S['electrical_basics'] = plot(
        [F('V*x', 'P = V·I', 'accent')],
        'Power is voltage times current: P = V·I, and energy is power times time. Raise either V or I and the dissipated power climbs; a 12 V, 2 A load draws 24 W.',
        x=[0, 5], y=[0, 130], xlabel='current I (A)', ylabel='power (W)',
        points=[{'x': 'I0', 'y': 'V*I0', 'label': '{V*I0} W'}],
        params=[P('V', 'voltage V', 1, 24, 12, 'V'), P('I0', 'current I', 0.1, 5, 2, 'A')],
        readouts=[R('power P = V·I', 'V*I0', 'W'), R('energy per day', 'V*I0*24/1000', 'kWh'), R('resistance V/I', 'V/I0', 'Ω')])

    S['kcl'] = geo([
        circle(0, 0, 0.12, 'white', 'white'),
        arrow(-2.8, 0, -0.2, 0, 'accent', 3), text(-1.5, 0.45, 'I₁ = {I1} A in', 'accent'),
        arrow(0, 2.2, 0, 0.2, 'accent', 3), text(1.0, 1.3, 'I₂ = {I2} A in', 'accent'),
        arrow(0.2, 0, 2.8, 0, 'pink', 3), text(1.6, -0.45, 'I₃ = {I3} A out', 'pink'),
        arrow(0, -0.2, 0, -2.2, 'pink', 3), text(1.1, -1.4, 'I₄ = {I1+I2-I3} A out', 'pink')],
        [-3.2, 3.2, -2.5, 2.5], 'KCL: charge cannot pile up at a node, so what flows in must flow out. Set three currents and the fourth is forced: I₄ = I₁ + I₂ − I₃ (negative means it really flows the other way).',
        params=[P('I1', 'I₁ in', 0, 5, 3, 'A'), P('I2', 'I₂ in', 0, 5, 2, 'A'), P('I3', 'I₃ out', 0, 5, 1.5, 'A')],
        readouts=[R('total in', 'I1+I2', 'A'), R('total out', 'I3+(I1+I2-I3)', 'A'), R('Σ i = 0 check', '(I1+I2)-I3-(I1+I2-I3)', 'A')], aspect=0.6)

    d1, d2, d3 = ['12*R1/(R1+R2+R3)', '12*R2/(R1+R2+R3)', '12*R3/(R1+R2+R3)']
    S['kvl'] = geo([
        *batV(-3, 0), W(-3, 0.7, -3, 1.5), W(-3, -0.7, -3, -1.5),
        W(-3, 1.5, -1.5, 1.5), resH(-1.5, 1.0, 1.5), W(1.0, 1.5, 3, 1.5),
        W(3, 1.5, 3, 0.9), resV(3, -0.9, 0.9), W(3, -0.9, 3, -1.5),
        W(3, -1.5, 1.0, -1.5), resH(-1.0, 1.0, -1.5), W(-1.0, -1.5, -3, -1.5),
        text(-3.7, 0, '12 V', 'pink'), text(-0.25, 2.1, 'R₁: {' + d1 + '} V', 'gold'),
        text(3.5, 0, 'R₂: {' + d2 + '} V', 'gold', align='left'), text(0, -2.1, 'R₃: {' + d3 + '} V', 'gold'),
        arrow(-2.4, 1.0, -1.4, 1.0, 'accent', 2), text(-1.9, 0.7, 'I', 'accent', 10)],
        [-4.5, 6.4, -2.5, 2.6], 'KVL: going once around a loop, the voltage rises (battery) equal the drops (resistors). Change any resistor: the 12 V is shared out in proportion to resistance.',
        params=[P('R1', 'R₁', 10, 1000, 100, 'Ω'), P('R2', 'R₂', 10, 1000, 220, 'Ω'), P('R3', 'R₃', 10, 1000, 330, 'Ω')],
        readouts=[R('current I', '12/(R1+R2+R3)*1000', 'mA'), R('sum of drops', '12', 'V'), R('check: 12 − Σdrops', '12-(' + d1 + '+' + d2 + '+' + d3 + ')', 'V')], aspect=0.55)

    S['series_parallel'] = geo([
        W(-3.4, 1.4, -3.0, 1.4), resH(-3.0, -0.6, 1.4), resH(-0.6, 1.8, 1.4), W(1.8, 1.4, 2.2, 1.4),
        text(-1.8, 2.0, 'R₁ = {R1}', 'gold', 10), text(0.6, 2.0, 'R₂ = {R2}', 'gold', 10), text(3.2, 1.4, 'R_s = {R1+R2}', 'accent'),
        W(-3.4, -1.5, -2.4, -1.5), W(-2.4, -0.7, -2.4, -2.3), resH(-2.4, 1.0, -0.7), resH(-2.4, 1.0, -2.3), W(1.0, -0.7, 1.0, -2.3), W(1.0, -1.5, 1.4, -1.5),
        text(-0.7, -0.15, 'R₁', 'gold', 10), text(-0.7, -2.85, 'R₂', 'gold', 10), text(3.1, -1.5, 'R_p = {R1*R2/(R1+R2)}', 'accent')],
        [-4, 5.5, -3.2, 2.5], 'Series resistors add: R_s = R₁ + R₂. Parallel resistors give more paths, so the total is always smaller than the smallest one: R_p = R₁R₂/(R₁+R₂).',
        params=[P('R1', 'R₁', 10, 1000, 100, 'Ω'), P('R2', 'R₂', 10, 1000, 300, 'Ω')],
        readouts=[R('series', 'R1+R2', 'Ω'), R('parallel', 'R1*R2/(R1+R2)', 'Ω')], aspect=0.6)

    S['voltage_divider'] = plot(
        [F('Vin*x/(R1+x)', 'Vout = Vin·R₂/(R₁+R₂)', 'accent')],
        'Two resistors share the input voltage in proportion to their sizes. Slide R₂: Vout climbs from 0 toward Vin. At R₂ = R₁ it is exactly half.',
        x=[0, 20], y=[0, 12.5], xlabel='R₂ (kΩ)', ylabel='Vout (V)',
        points=[{'x': 'R2', 'y': 'Vin*R2/(R1+R2)', 'label': '{Vin*R2/(R1+R2)} V'}],
        params=[P('Vin', 'Vin', 1, 12, 12, 'V'), P('R1', 'R₁', 1, 10, 5, 'kΩ'), P('R2', 'R₂', 0.1, 20, 5, 'kΩ')],
        readouts=[R('Vout', 'Vin*R2/(R1+R2)', 'V'), R('current', 'Vin/(R1+R2)', 'mA')])

    S['current_divider'] = plot(
        [F('Iin*R2/(x+R2)', 'I₁ (through R₁)', 'accent'), F('Iin*x/(x+R2)', 'I₂ (through R₂)', 'pink'), F('Iin', 'total I', 'dim', dash=True)],
        'Current prefers the easier path: the smaller resistor carries more. The two branch currents always add back to the total, I₁ + I₂ = I.',
        x=[0, 10], y=[0, 105], xlabel='R₁ (kΩ)', ylabel='branch current (mA)',
        points=[{'x': 'R1', 'y': 'Iin*R2/(R1+R2)', 'label': 'I₁'}],
        params=[P('Iin', 'total current', 10, 100, 60, 'mA'), P('R2', 'R₂', 0.5, 10, 2, 'kΩ'), P('R1', 'R₁', 0.1, 10, 1, 'kΩ')],
        readouts=[R('I₁', 'Iin*R2/(R1+R2)', 'mA'), R('I₂', 'Iin*R1/(R1+R2)', 'mA')])

    g11 = '(1/R1+1/R2)'; g12 = '(-1/R2)'; g22 = '(1/R2+1/R3)'; dt = f'({g11}*{g22}-{g12}^2)'
    v1 = f'(3*{g22}-{g12}*1)/{dt}'; v2 = f'({g11}*1-{g12}*3)/{dt}'
    S['nodal_analysis'] = geo([
        W(-3.6, -2, 3.6, -2, 'dim'), *isrc(-3.2, -0.5), W(-3.2, 0.8, -3.2, 0), W(-3.2, -1, -3.2, -2), W(-3.2, 0.8, -1.8, 0.8),
        resV(-1.8, -2, 0.8), resH(-1.8, 1.8, 0.8), resV(1.8, -2, 0.8),
        *isrc(3.2, -0.5), W(3.2, 0.8, 3.2, 0), W(3.2, -1, 3.2, -2), W(3.2, 0.8, 1.8, 0.8),
        text(-3.2, 1.35, '3 mA', 'pink', 10), text(3.2, 1.35, '1 mA', 'pink', 10),
        text(-2.5, -0.5, 'R₁', 'gold', 10), text(0, 1.4, 'R₂', 'gold', 10), text(2.5, -0.5, 'R₃', 'gold', 10),
        point(-1.8, 0.8, 'white', 5), point(1.8, 0.8, 'white', 5),
        text(-1.8, 2.0, 'v₁ = {' + v1 + '} V', 'accent'), text(1.8, 2.0, 'v₂ = {' + v2 + '} V', 'accent')],
        [-4.2, 4.2, -2.6, 2.7], 'Nodal analysis: write KCL at each node and solve G·v = i. Here the conductance matrix is [[1/R₁+1/R₂, −1/R₂], [−1/R₂, 1/R₂+1/R₃]]. Resistors are in kΩ, currents in mA, so voltages come out in V.',
        params=[P('R1', 'R₁', 0.5, 10, 2, 'kΩ'), P('R2', 'R₂', 0.5, 10, 4, 'kΩ'), P('R3', 'R₃', 0.5, 10, 2, 'kΩ')],
        readouts=[R('v₁', v1, 'V'), R('v₂', v2, 'V')], aspect=0.55)

    det = '((R1+R2)*(R2+R3)-R2^2)'
    i1 = f'(10*(R2+R3)-R2*5)/{det}'; i2 = f'(R2*10-(R1+R2)*5)/{det}'
    S['mesh_analysis'] = geo([
        *batV(-3.2, 0), W(-3.2, 0.7, -3.2, 1.6), W(-3.2, -0.7, -3.2, -1.6),
        W(-3.2, 1.6, -2.4, 1.6), resH(-2.4, -0.6, 1.6), W(-0.6, 1.6, 0.6, 1.6), resH(0.6, 2.4, 1.6), W(2.4, 1.6, 3.2, 1.6),
        *batV(3.2, 0), W(3.2, 0.7, 3.2, 1.6), W(3.2, -0.7, 3.2, -1.6),
        W(3.2, -1.6, -3.2, -1.6), W(0, 1.6, 0, 1.1), resV(0, -1.1, 1.1), W(0, -1.1, 0, -1.6),
        point(0, 1.6, 'white', 4), point(0, -1.6, 'white', 4),
        text(-1.5, 2.2, 'R₁', 'gold', 10), text(1.5, 2.2, 'R₃', 'gold', 10), text(0.6, 0, 'R₂', 'gold', 10),
        text(-3.9, 0, '10 V', 'pink', 10), text(3.9, 0, '5 V', 'pink', 10),
        text(-1.6, 0, 'i₁ = {' + i1 + '} mA', 'accent'), text(1.7, -0.6, 'i₂ = {' + i2 + '} mA', 'green'),
        text(-1.6, 0.6, '⟳', 'accent', 16), text(1.7, 0.1, '⟳', 'green', 16)],
        [-4.5, 4.5, -2.4, 2.7], 'Mesh analysis: write KVL around each loop with a loop current, then solve R·i = v. The shared resistor R₂ carries the difference i₁ − i₂. Resistors in kΩ give currents in mA.',
        params=[P('R1', 'R₁', 0.5, 10, 2, 'kΩ'), P('R2', 'R₂', 0.5, 10, 3, 'kΩ'), P('R3', 'R₃', 0.5, 10, 2, 'kΩ')],
        readouts=[R('i₁', i1, 'mA'), R('i₂', i2, 'mA'), R('current in R₂ (i₁−i₂)', f'({i1})-({i2})', 'mA')], aspect=0.55)

    sg = '(1/2+1/1+1/R3)'  # R1=2k, R2=1k
    c1 = f'(V1/2)/{sg}'; c2 = f'(V2/1)/{sg}'
    S['superposition'] = geo([
        line(0.2, 0, 4.6, 0, 'dim', 1),
        rect(0.6, 0, 0.9, c1, 'accent', 'accent', alpha=0.7), text(1.05, -0.8, 'V₁ alone', 'accent', 10),
        rect(1.8, 0, 0.9, c2, 'pink', 'pink', alpha=0.7), text(2.25, -0.8, 'V₂ alone', 'pink', 10),
        rect(3.2, 0, 0.9, c1, 'accent', 'accent', alpha=0.7), rect(3.2, c1, 0.9, c2, 'pink', 'pink', alpha=0.7), text(3.65, -0.8, 'both = sum', 'gold', 10),
        text(2.4, 11.3, 'output voltage at the joined node (V)', 'white')],
        [0, 5, -1.6, 12], 'Superposition: in a linear circuit, the output with both sources on is just the sum of the outputs with each source alone (the other turned off). The two coloured parts stack to the total.',
        params=[P('V1', 'source V₁ (via 2 kΩ)', 0, 10, 8, 'V'), P('V2', 'source V₂ (via 1 kΩ)', 0, 10, 4, 'V'), P('R3', 'load R₃', 0.5, 10, 2, 'kΩ')],
        readouts=[R('from V₁ alone', c1, 'V'), R('from V₂ alone', c2, 'V'), R('both together', f'{c1}+{c2}', 'V')], equal=False, aspect=0.6)

    S['thevenin_norton'] = plot(
        [F('Vth-Rth*x', 'source: V = Vth − Rth·I', 'accent'), F('RL*x', 'load: V = RL·I', 'pink')],
        'Any linear source looks like a voltage Vth behind a resistor Rth (or a current IN = Vth/Rth across it). The operating point is where the source line meets the load line.',
        x=[0, 20], y=[0, 14], xlabel='current (mA)', ylabel='voltage (V)',
        points=[{'x': 'Vth/(Rth+RL)', 'y': 'Vth*RL/(Rth+RL)', 'label': 'operating point'}],
        params=[P('Vth', 'Vth', 2, 12, 10, 'V'), P('Rth', 'Rth', 0.5, 5, 2, 'kΩ'), P('RL', 'load RL', 0.2, 10, 3, 'kΩ')],
        readouts=[R('Norton current IN = Vth/Rth', 'Vth/Rth', 'mA'), R('load voltage', 'Vth*RL/(Rth+RL)', 'V'), R('load current', 'Vth/(Rth+RL)', 'mA')])

    S['max_power_transfer'] = plot(
        [F('Vth^2*x/(Rth+x)^2', 'power in load', 'accent')],
        'Load power is highest when RL = Rth (the load matches the source), and then half of all the power is lost inside the source: efficiency is only 50%.',
        x=[0, 20], xlabel='load RL (kΩ)', ylabel='power (mW)',
        vlines=[{'x': 'Rth', 'label': 'RL = Rth'}],
        points=[{'x': 'RL', 'y': 'Vth^2*RL/(Rth+RL)^2', 'label': '{Vth^2*RL/(Rth+RL)^2} mW'}],
        params=[P('Vth', 'Vth', 2, 12, 10, 'V'), P('Rth', 'Rth', 1, 10, 4, 'kΩ'), P('RL', 'load RL', 0.2, 20, 2, 'kΩ')],
        readouts=[R('max power Vth²/4Rth', 'Vth^2/(4*Rth)', 'mW'), R('efficiency RL/(Rth+RL)', '100*RL/(Rth+RL)', '%')])

    S['source_transformation'] = plot(
        [F('Vs-Rs*x', 'voltage source Vs + Rs', 'accent'), F('(Vs/Rs-x)*Rs', 'current source Is ∥ Rs', 'gold', dash=True)],
        'A voltage source Vs in series with Rs and a current source Is = Vs/Rs in parallel with Rs make the exact same terminal line, so either can replace the other when analysing the rest of the circuit.',
        x=[0, 24], y=[0, 25], xlabel='I (mA)', ylabel='V',
        points=[{'x': 0, 'y': 'Vs', 'label': 'open-circuit Vs'}, {'x': 'Vs/Rs', 'y': 0, 'label': 'short-circuit Is'}],
        params=[P('Vs', 'Vs', 2, 24, 12, 'V'), P('Rs', 'Rs', 0.5, 5, 1.5, 'kΩ')],
        readouts=[R('Is = Vs/Rs', 'Vs/Rs', 'mA')])

    S['dependent_sources'] = plot(
        [F('gm*x', 'i = gm·v (µA)', 'accent')],
        'A dependent source is controlled by another voltage or current: here the current source delivers i = gm·v. Dropping it across a load RL makes a voltage amplifier with gain −gm·RL.',
        x=[0, 10], y=[0, 1050], xlabel='control voltage v (mV)', ylabel='source current (µA)',
        points=[{'x': 'vin', 'y': 'gm*vin', 'label': '{gm*vin} µA'}],
        params=[P('gm', 'transconductance gm', 1, 100, 40, 'mS'), P('RL', 'load RL', 1, 10, 4, 'kΩ'), P('vin', 'input v', 0.1, 10, 2, 'mV')],
        readouts=[R('voltage gain −gm·RL', '-gm*RL'), R('output voltage', '-gm*RL*vin', 'mV')])

    S['capacitor_ee'] = plot(
        [F('sin(2*pi*f*x)', 'voltage v (normalised)', 'accent'), F('cos(2*pi*f*x)', 'current i (normalised)', 'pink')],
        'i = C dv/dt: the current is largest when the voltage is changing fastest, so the capacitor current leads the voltage by 90°. Higher frequency or bigger C lets more current through (smaller reactance).',
        x=[0, 4], y=[-1.4, 1.4], xlabel='time (ms)',
        params=[P('f', 'frequency', 0.2, 3, 1, 'kHz'), P('C', 'capacitance', 0.1, 10, 1, 'µF')],
        readouts=[R('reactance Xc = 1/(2πfC)', '159.15/(f*C)', 'Ω'), R('peak current at 5 V peak', '5/(159.15/(f*C))*1000', 'mA')])

    S['inductor_ee'] = plot(
        [F('sin(2*pi*f*x)', 'current i (normalised)', 'pink'), F('cos(2*pi*f*x)', 'voltage v (normalised)', 'accent')],
        'v = L di/dt: the voltage is largest when the current is changing fastest, so the inductor voltage leads the current by 90°. Higher frequency or bigger L raises the reactance.',
        x=[0, 4], y=[-1.4, 1.4], xlabel='time (ms)',
        params=[P('f', 'frequency', 0.2, 3, 1, 'kHz'), P('L', 'inductance', 1, 100, 10, 'mH')],
        readouts=[R('reactance XL = 2πfL', '2*pi*f*L', 'Ω'), R('peak voltage at 10 mA', '0.01*2*pi*f*L', 'V')])

    S['rc_transient'] = plot(
        [F('Vs*(1-exp(-x/(R*C)))', 'charging', 'accent'), F('Vs*exp(-x/(R*C))', 'discharging', 'pink')],
        'v(t) = Vf + (V₀ − Vf)e^(−t/RC). In one time constant τ = RC the capacitor covers 63% of the way; after 5τ it is essentially done. Bigger R or C slows it.',
        x=[0, 60], y=[0, 5.4], xlabel='time (ms)', ylabel='capacitor voltage (V)',
        vlines=[{'x': 'R*C', 'label': 'τ'}], hlines=[{'y': 'Vs*0.632', 'label': '63%'}],
        points=[{'x': 'mod(t*15,60)', 'y': 'Vs*(1-exp(-mod(t*15,60)/(R*C)))'}],
        params=[P('R', 'R', 1, 20, 10, 'kΩ'), P('C', 'C', 0.1, 5, 1, 'µF'), P('Vs', 'Vs', 1, 5, 5, 'V')],
        readouts=[R('τ = RC', 'R*C', 'ms'), R('settled (5τ)', '5*R*C', 'ms')])

    S['rl_transient_node'] = plot(
        [F('10/R*(1-exp(-x*R/L))', 'inductor current i(t)', 'accent'), F('10/R', 'final value V/R', 'dim', dash=True)],
        'An inductor refuses sudden current changes: i(t) = (V/R)(1 − e^(−tR/L)). The time constant is τ = L/R; more inductance slows the rise, more resistance speeds it up. (V = 10 V.)',
        x=[0, 5], xlabel='time (ms)', ylabel='current (A)',
        vlines=[{'x': 'L/R', 'label': 'τ'}],
        params=[P('R', 'R', 10, 100, 20, 'Ω'), P('L', 'L', 1, 50, 10, 'mH')],
        readouts=[R('τ = L/R', 'L/R', 'ms'), R('final current V/R', '10/R', 'A')])

    a_, w_, z_ = '(0.05*R)', '(10/sqrt(Cu))', '(0.005*R*sqrt(Cu))'
    S['rlc_transient'] = plot(
        [F(step2(a_, w_, z_), 'capacitor voltage', 'accent'), F('1', 'step input', 'dim', dash=True)],
        'A series RLC (L = 10 mH) responds to a 1 V step: s = −α ± √(α²−ω₀²). Low R rings (underdamped) with decay α = R/2L; raise R and the ringing dies, then turns sluggish.',
        x=[0, 3], y=[0, 1.9], xlabel='time (ms)',
        params=[P('R', 'R', 5, 400, 60, 'Ω', step=7), P('Cu', 'C', 0.2, 5, 1, 'µF')],
        readouts=[R('damping ζ = R/2·√(C/L)', z_), R('ω₀ = 1/√(LC)', '1e4/sqrt(Cu)', 'rad/s'), R('decay α = R/2L', '50*R', '1/s')])

    S['damping_regimes'] = plot(
        [F(step2('0.2', '1', '0.2'), 'under ζ=0.2', 'dim'), F(step2('1', '1', '1'), 'critical ζ=1', 'green', dash=True), F(step2('3', '1', '3'), 'over ζ=3', 'dim'),
         F(step2('(z*1)', '1', 'z'), 'your ζ', 'gold', width=3)],
        'Same circuit, three flavours: under-damped rings, critically damped reaches the final value fastest without overshoot, over-damped crawls. Drag ζ to move the gold curve between them.',
        x=[0, 20], y=[0, 1.9], xlabel='time (units of 1/ω₀)',
        params=[P('z', 'damping ζ', 0.1, 3, 0.5, step=0.05)],
        readouts=[R('Q = 1/(2ζ)', '1/(2*z)'), R('overshoot', 'z<1 ? 100*exp(-pi*z/sqrt(1-z^2)) : 0', '%')])

    S['sinusoids_ac'] = plot(
        [F('Vm*cos(2*pi*f*x/1000+rad(phi))', 'v(t) = Vm cos(ωt + φ)', 'accent'), F('Vm*cos(2*pi*f*x/1000)', 'reference', 'dim', dash=True)],
        'A steady AC signal is set by three numbers: amplitude Vm, frequency f and phase φ. Positive φ shifts the wave to the left (it leads). 170 V peak at 60 Hz is the 120 V rms mains.',
        x=[0, 50], y=[-350, 350], xlabel='time (ms)', ylabel='volts',
        points=[{'x': 'mod(t*8,50)', 'y': 'Vm*cos(2*pi*f*mod(t*8,50)/1000+rad(phi))'}],
        params=[P('Vm', 'amplitude Vm', 10, 340, 170, 'V'), P('f', 'frequency f', 20, 100, 60, 'Hz'), P('phi', 'phase φ', -180, 180, 45, '°')],
        readouts=[R('rms = Vm/√2', 'Vm/sqrt(2)', 'V'), R('period', '1000/f', 'ms'), R('ω = 2πf', '2*pi*f', 'rad/s')])

    S['impedance_admittance'] = plot(
        [F('sqrt(R^2+(2*pi*x*L-159.15/(x*C))^2)', '|Z| of series R–L–C', 'accent'), F('R', 'R alone', 'dim', dash=True)],
        'Impedance Z = R + j(ωL − 1/ωC) generalises resistance to AC. Below resonance the capacitor dominates, above it the inductor does; at resonance the reactances cancel and |Z| dips to R.',
        x=[0.1, 5], y=[0, 400], xlabel='frequency (kHz)', ylabel='|Z| (Ω)',
        vlines=[{'x': '5.033/sqrt(L*C)', 'label': 'f₀'}],
        params=[P('R', 'R', 10, 200, 50, 'Ω'), P('L', 'L', 1, 50, 10, 'mH'), P('C', 'C', 0.1, 5, 1, 'µF')],
        readouts=[R('resonant f₀', '5.033/sqrt(L*C)', 'kHz'), R('|Z| at 1 kHz', 'sqrt(R^2+(2*pi*1*L-159.15/(1*C))^2)', 'Ω'), R('admittance 1/|Z| at 1 kHz', '1000/sqrt(R^2+(2*pi*1*L-159.15/(1*C))^2)', 'mS')])

    S['rms_average_power'] = plot(
        [F('Vm*sin(2*pi*x)', 'v(t)', 'accent'), F('Vm^2*sin(2*pi*x)^2/R', 'p(t) = v²/R', 'pink')],
        'The power pulses at twice the line frequency; its average is Vm²/2R, the same as DC at Vrms = Vm/√2. That is why an AC outlet of 230 V rms heats like 230 V DC.',
        x=[0, 2], xlabel='time (cycles)',
        hlines=[{'y': 'Vm^2/(2*R)', 'label': 'average power', 'color': 'gold'}],
        params=[P('Vm', 'peak Vm', 1, 20, 10, 'V'), P('R', 'R', 5, 100, 20, 'Ω')],
        readouts=[R('Vrms = Vm/√2', 'Vm/sqrt(2)', 'V'), R('P_avg = Vm²/2R', 'Vm^2/(2*R)', 'W')])

    S['complex_power'] = geo([
        line(-0.5, 0, 9, 0, 'dim', 1),
        arrow(0, 0, 'Sk*cos(rad(ph))', 0, 'accent', 3), arrow('Sk*cos(rad(ph))', 0, 'Sk*cos(rad(ph))', 'Sk*sin(rad(ph))', 'pink', 3), arrow(0, 0, 'Sk*cos(rad(ph))', 'Sk*sin(rad(ph))', 'gold', 3),
        {'k': 'arc', 'x': 0, 'y': 0, 'r': 1.1, 'a0': 0, 'a1': 'rad(ph)', 'color': 'green'},
        text('Sk*cos(rad(ph))/2', -0.55, 'P = {Sk*cos(rad(ph))} kW', 'accent'),
        text('Sk*cos(rad(ph))+1.2', 'Sk*sin(rad(ph))/2', 'Q = {Sk*sin(rad(ph))} kvar', 'pink', align='left'),
        text('Sk*cos(rad(ph))/2-0.6', 'Sk*sin(rad(ph))/2+0.6', 'S = {Sk} kVA', 'gold'), text(1.7, 0.45, 'φ', 'green')],
        [-0.8, 10.5, -1.2, 8.6], 'Complex power S = P + jQ is a right triangle: P (real) does the work, Q (reactive) sloshes between source and load, and S = VI is what the wires must carry. The angle φ is the load’s phase.',
        params=[P('Sk', 'apparent power S', 1, 8, 6, 'kVA'), P('ph', 'load phase φ', 0, 80, 35, '°')],
        readouts=[R('P = S cosφ', 'Sk*cos(rad(ph))', 'kW'), R('Q = S sinφ', 'Sk*sin(rad(ph))', 'kvar'), R('power factor', 'cos(rad(ph))')], aspect=0.7)

    tn = lambda p: f'(sqrt(1-{p}^2)/{p})'
    S['power_factor_node'] = geo([
        line(-0.5, 0, 6.5, 0, 'dim', 1),
        arrow(0, 0, 5, 0, 'accent', 3), text(2.5, -0.55, 'P = 100 kW', 'accent'),
        arrow(5, 0, 5, f'100*{tn("pf1")}/20', 'pink', 2.5), arrow(0, 0, 5, f'100*{tn("pf1")}/20', 'pink', 2.5, dash=True),
        arrow(5, 0, 5, f'100*{tn("pf2")}/20', 'green', 3), arrow(0, 0, 5, f'100*{tn("pf2")}/20', 'green', 3),
        text(5.3, f'100*{tn("pf1")}/40', 'Q before', 'pink', align='left', size=10), text(5.3, f'100*{tn("pf2")}/40', 'Q after', 'green', align='left', size=10)],
        [-0.6, 7.2, -1.0, 7.8], 'Adding a capacitor bank cancels reactive power Q without changing the real power P, so the apparent power S (and the current in the supply wires) shrinks. Pink = before, green = after.',
        params=[P('pf1', 'power factor before', 0.6, 0.95, 0.7), P('pf2', 'target power factor', 0.8, 1, 0.95)],
        readouts=[R('capacitor needed Qc', f'100*({tn("pf1")}-{tn("pf2")})', 'kvar'), R('line current falls to', '100*pf1/pf2', '%')], aspect=0.75)

    S['three_phase'] = spec('phasor', 'Three sinusoids 120° apart sum to zero, which is why a balanced three-phase system needs no return current. Shrink phase C to unbalance it and a neutral current |1 − m| appears.',
        phasors=[{'mag': 1, 'deg': 0, 'label': 'A'}, {'mag': 1, 'deg': -120, 'label': 'B', 'color': 'pink'}, {'mag': 'mc', 'deg': -240, 'label': 'C', 'color': 'gold'}],
        omega=1.2, sum='neutral',
        params=[P('mc', 'size of phase C', 0.2, 1.5, 1)],
        readouts=[R('neutral current (relative)', 'abs(1-mc)'), R('line voltage √3·230 V', '1.732*230', 'V')])

    S['transfer_function_ee'] = spec('bode', 'H(s) = Vout/Vin tells you how every frequency is scaled and delayed. This second-order response has complex poles: low ζ gives a resonant peak near ωn; high ζ rolls off smoothly.',
        k=1, poles=[['-zt*wn', 'wn*sqrt(1-zt^2)'], ['-zt*wn', '-wn*sqrt(1-zt^2)']], w=[10, 100000], unit='rad/s',
        params=[P('wn', 'natural freq ωn', 100, 3000, 1000, 'rad/s'), P('zt', 'damping ζ', 0.05, 0.95, 0.2)],
        readouts=[R('Q = 1/(2ζ)', '1/(2*zt)'), R('roll-off beyond ωn', '40', 'dB/decade')])

    S['frequency_response_bode'] = spec('bode', 'A Bode plot shows gain (dB) and phase against log frequency. Each pole bends the gain down by 20 dB per decade and adds up to 90° of lag. Move the poles and the gain.',
        k='10^(g/20)', poles=[['-p1', 0], ['-p2k*1000', 0]], w=[1, 10000000], unit='rad/s',
        params=[P('g', 'DC gain', 20, 80, 60, 'dB'), P('p1', 'first pole', 100, 10000, 1000, 'rad/s'), P('p2k', 'second pole', 10, 1000, 100, 'krad/s')],
        readouts=[R('DC gain (V/V)', '10^(g/20)'), R('gain–bandwidth ≈ K·p₁', '10^(g/20)*p1', 'rad/s')])

    S['resonance_q'] = plot(
        [F('1000/sqrt(R^2+(2*pi*x*L-159.15/(x*C))^2)', 'current (mA) for 1 V drive', 'accent')],
        'A series RLC passes the most current at f₀ = 1/(2π√LC). The quality factor Q = ω₀L/R measures how sharp the peak is: low resistance gives a tall, narrow resonance.',
        x=[0.1, 5], xlabel='frequency (kHz)', ylabel='current (mA)',
        vlines=[{'x': '5.033/sqrt(L*C)', 'label': 'f₀'}],
        params=[P('R', 'R', 5, 100, 20, 'Ω'), P('L', 'L', 1, 50, 10, 'mH'), P('C', 'C', 0.1, 5, 1, 'µF')],
        readouts=[R('f₀', '5.033/sqrt(L*C)', 'kHz'), R('Q = ω₀L/R', '2*pi*5.033/sqrt(L*C)*L/R'), R('bandwidth f₀/Q', '5.033/sqrt(L*C)/(2*pi*5.033/sqrt(L*C)*L/R)', 'kHz')])

    S['high_pass_filter'] = spec('bode', 'A high-pass filter H = sRC/(1+sRC) blocks DC and passes fast signals: below the corner 1/RC the gain climbs at +20 dB/decade, above it the gain is flat at 0 dB.',
        num=['R*Cu*1e-6', 0], den=['R*Cu*1e-6', 1], w=[10, 1000000], unit='rad/s',
        params=[P('R', 'R (Ω)', 100, 10000, 1000), P('Cu', 'C (µF)', 0.01, 1, 0.1)],
        readouts=[R('corner ω = 1/RC', '1/(R*Cu*1e-6)', 'rad/s'), R('corner f', '1/(2*pi*R*Cu*1e-6)', 'Hz')])

    S['band_pass_filter'] = spec('bode', 'A band-pass filter passes a window around ω₀ and rejects both lower and higher frequencies. Raising Q narrows the window (bandwidth = ω₀/Q).',
        num=['2*pi*f0/Q', 0], den=[1, '2*pi*f0/Q', '(2*pi*f0)^2'], w=[100, 1000000], unit='rad/s',
        params=[P('f0', 'centre f₀', 200, 5000, 1000, 'Hz'), P('Q', 'quality Q', 0.5, 20, 4)],
        readouts=[R('centre ω₀', '2*pi*f0', 'rad/s'), R('bandwidth f₀/Q', 'f0/Q', 'Hz')])

    S['notch_filter'] = spec('bode', 'A notch filter nulls one frequency, such as 50/60 Hz hum, and leaves everything else alone. A high Q makes the notch narrow so little useful signal is lost.',
        num=[1, 0, '(2*pi*f0)^2'], den=[1, '2*pi*f0/Q', '(2*pi*f0)^2'], w=[100, 1000000], unit='rad/s',
        params=[P('f0', 'notch f₀', 40, 400, 60, 'Hz'), P('Q', 'quality Q', 0.5, 20, 5)],
        readouts=[R('notch ω₀', '2*pi*f0', 'rad/s'), R('notch width f₀/Q', 'f0/Q', 'Hz')])
    # bode w range for the notch should bracket the notch
    S['notch_filter']['w'] = [10, 10000]

    S['two_port_networks'] = geo([
        W(-3.6, 1, -3, 1), resH(-3, -0.8, 1), W(-0.8, 1, 0.8, 1), resH(0.8, 3, 1), W(3, 1, 3.6, 1),
        W(0, 1, 0, 0.7), resV(0, -1.1, 0.7), W(0, -1.1, 0, -1.5),
        W(-3.6, -1.5, 3.6, -1.5), point(0, 1, 'white', 4), point(-3.6, 1, 'white', 6), point(-3.6, -1.5, 'white', 6), point(3.6, 1, 'white', 6), point(3.6, -1.5, 'white', 6),
        text(-1.9, 1.6, 'Ra', 'gold', 10), text(1.9, 1.6, 'Rb', 'gold', 10), text(0.6, -0.3, 'Rc', 'gold', 10),
        text(-3.6, -0.3, 'port 1', 'accent', 10, align='center'), text(3.6, -0.3, 'port 2', 'pink', 10)],
        [-4.5, 4.5, -2.2, 2.2], 'A two-port hides everything inside and keeps only the relations between port voltages and currents. For this T-network the open-circuit impedance parameters follow directly from the resistors.',
        params=[P('Ra', 'Ra', 10, 500, 100, 'Ω'), P('Rb', 'Rb', 10, 500, 200, 'Ω'), P('Rc', 'Rc', 10, 500, 150, 'Ω')],
        readouts=[R('z₁₁ = Ra + Rc', 'Ra+Rc', 'Ω'), R('z₁₂ = z₂₁ = Rc', 'Rc', 'Ω'), R('z₂₂ = Rb + Rc', 'Rb+Rc', 'Ω')], aspect=0.5)

    S['mutual_inductance'] = geo([
        *indV(-1.8, -1.8, 1.8, 'purple', 5), *indV(2.0, -1.8, 1.8, 'accent', 5),
        {'k': 'curve', 'x': '0.1+2.6*cos(s)', 'y': '1.9*sin(s)', 's': [0, 6.2832], 'color': 'gold', 'alpha': 'kk'},
        {'k': 'curve', 'x': '0.1+1.9*cos(s)', 'y': '1.2*sin(s)', 's': [0, 6.2832], 'color': 'gold', 'alpha': 'kk'},
        {'k': 'curve', 'x': '0.1+1.2*cos(s)', 'y': '0.55*sin(s)', 's': [0, 6.2832], 'color': 'gold', 'alpha': 'kk'},
        text(-2.8, 0, 'L₁', 'purple'), text(3.0, 0, 'L₂', 'accent'), text(0.1, -2.5, 'M = k√(L₁L₂) = {kk*sqrt(L1*L2)} mH', 'gold')],
        [-3.6, 3.8, -2.9, 2.5], 'Current changing in coil 1 makes flux that threads coil 2 and induces v₂ = M di₁/dt. The coupling k (0 to 1) is how much of the flux links; the gold flux lines fade as k drops.',
        params=[P('kk', 'coupling k', 0.05, 1, 0.7), P('L1', 'L₁', 1, 50, 10, 'mH'), P('L2', 'L₂', 1, 50, 20, 'mH')],
        readouts=[R('mutual inductance M', 'kk*sqrt(L1*L2)', 'mH'), R('v₂ for di₁/dt = 100 A/s', 'kk*sqrt(L1*L2)*1e-3*100', 'V')], aspect=0.6)

    S['transformer_ideal'] = plot(
        [F('V1*sin(2*pi*x)', 'primary v₁', 'accent'), F('n*V1*sin(2*pi*x)', 'secondary v₂ = n·v₁', 'gold')],
        'An ideal transformer scales voltage by the turns ratio n = N₂/N₁ and current by 1/n, so power in equals power out. Step-up (n > 1) raises voltage and lowers current.',
        x=[0, 2], y=[-330, 330], xlabel='time (cycles)', ylabel='volts',
        points=[{'x': 'mod(t*0.3,2)', 'y': 'n*V1*sin(2*pi*mod(t*0.3,2))'}],
        params=[P('V1', 'primary peak', 50, 100, 100, 'V'), P('n', 'turns ratio N₂/N₁', 0.1, 3, 2), P('RL', 'load', 10, 1000, 100, 'Ω')],
        readouts=[R('V₂ rms', 'n*V1/sqrt(2)', 'V'), R('I₂', 'n*V1/sqrt(2)/RL', 'A'), R('I₁ = n·I₂', 'n*n*V1/sqrt(2)/RL', 'A'), R('power', '(n*V1/sqrt(2))^2/RL', 'W')])

    al = '(0.05*R)'; w0k = '(10/sqrt(Cu))'
    S['laplace_circuit_analysis'] = spec('pz', 'In the s-domain a series RLC (L = 10 mH) becomes algebra with Z_L = sL and Z_C = 1/sC. Its poles are the roots of s² + (R/L)s + 1/LC (units: krad/s): they pair up on the real axis when R is large and split into a complex pair when it is small.',
        range=36, poles=[[f'-{al}+({al}>{w0k} ? sqrt({al}^2-{w0k}^2) : 0)', f'{al}>{w0k} ? 0 : sqrt({w0k}^2-{al}^2)'],
                         [f'-{al}-({al}>{w0k} ? sqrt({al}^2-{w0k}^2) : 0)', f'{al}>{w0k} ? 0 : -sqrt({w0k}^2-{al}^2)']],
        params=[P('R', 'R', 20, 700, 150, 'Ω'), P('Cu', 'C', 0.3, 3, 1, 'µF')],
        readouts=[R('α = R/2L', '0.05*R', 'krad/s'), R('ω₀ = 1/√LC', '10/sqrt(Cu)', 'krad/s')])
