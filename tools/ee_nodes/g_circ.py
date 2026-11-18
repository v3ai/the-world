from lib import *
area('ee_circuits')
AACD="All About Circuits: DC|https://www.allaboutcircuits.com/textbook/direct-current/"
AACA="All About Circuits: AC|https://www.allaboutcircuits.com/textbook/alternating-current/"
n('electrical_basics','Voltage, current, resistance, power, energy','concept','current_resistance_physics electric_potential_ee','The four quantities every circuit is described by.',
  'Voltage is the push, current is the flow, resistance is the opposition and power is how fast energy is used.',
  'Conventional current flows from + to −; a component absorbs power when current enters its + terminal. Energy bills are watts × time.',
  'Passive sign convention; P=VI; units V, A, Ω, W, J (=W·s); a kilowatt-hour is 3.6 MJ. Ideal sources and ground reference define the model world of lumped circuits.',
  f='P = V·I', r='UP2:9.1 UP2:9.5 CPH:20.4', x=AACD, lab='circuit:ohms_law', kn='circuits_ohm')
n('ohms_law_node','Ohm’s law','law','electrical_basics','V = I·R for a resistor.',
  'The current through a resistor is proportional to the voltage across it.',
  'A resistor’s I–V line is straight; non-ohmic devices (diodes, lamps) curve. Resistors dissipate P=I²R as heat.',
  'Ohm’s law is a material property J=σE, valid over a wide but limited range; temperature, high fields and quantum effects bend it.',
  f='V = I R;  P = I²R = V²/R', r='UP2:9.4 CPH:20.2', lab='circuit:ohms_law', kn='circuits_ohm')
n('kcl','Kirchhoff’s current law (KCL)','law','electrical_basics','Currents into a node sum to zero.',
  'Charge does not pile up at a junction: what flows in must flow out.',
  'KCL gives one equation per node; it is charge conservation applied to a node.',
  'Σiₖ=0 on any closed surface for lumped circuits; displacement current extends it to capacitors in Maxwell’s form.',
  f='Σ i = 0', r='UP2:10.3 CPH:21.3', lab='circuit:kvl_kcl')
n('kvl','Kirchhoff’s voltage law (KVL)','law','electrical_basics','Voltage drops around a loop sum to zero.',
  'Go around any closed loop and the rises and drops in voltage must cancel.',
  'KVL gives one equation per independent loop and is energy conservation per unit charge.',
  'Σvₖ=0 around closed paths if no time-varying flux links the loop; otherwise lumped models add an inductor.',
  f='Σ v = 0', r='UP2:10.3 CPH:21.3', lab='circuit:kvl_kcl')
n('series_parallel','Series and parallel circuits','concept','ohms_law_node kcl kvl','Two basic ways to connect components.',
  'Series elements share the same current; parallel elements share the same voltage.',
  'Resistances add in series and conductances add in parallel; capacitors do the opposite of resistors, inductors the same.',
  'R_series=ΣRᵢ; 1/R_par=Σ1/Rᵢ; reductions of ladders step by step; Y–Δ conversion for bridge-type networks.',
  f='R_s = R₁+R₂;  R_p = R₁R₂/(R₁+R₂)', r='UP2:10.2 CPH:21.1', lab='circuit:series_parallel')
n('voltage_divider','Voltage divider','technique','series_parallel','Two resistors split a voltage.',
  'Two series resistors share a voltage in proportion to their sizes, giving a smaller voltage at the middle.',
  'Loading the output changes the ratio; used in sensor interfaces, bias networks and ADC inputs.',
  'Vout=Vin R₂/(R₁+R₂) unloaded; with load, replace R₂ by R₂∥R_L; Thévenin equivalent R₁∥R₂.',
  f='Vout = Vin·R₂/(R₁+R₂)', lab='circuit:voltage_divider')
n('current_divider','Current divider','technique','series_parallel','Parallel branches split a current.',
  'Current prefers the easier path: the smaller resistor takes more of it.',
  'Used for shunt-resistor current sensing and in analysing parallel loads.',
  'I₁=I_T R₂/(R₁+R₂) for two branches; for n branches I_k=I_T G_k/ΣG.',
  f='I₁ = I·R₂/(R₁+R₂)', lab='circuit:current_divider')
n('nodal_analysis','Nodal analysis','technique','kcl series_parallel matrices_systems','Solve for node voltages with KCL.',
  'Pick a ground, label the other node voltages, and write KCL at each node; then solve the equations.',
  'In matrix form G·v=i with G the conductance matrix; supernodes handle floating voltage sources.',
  'Modified nodal analysis (MNA) adds branch currents for voltage sources and inductors; it is the engine of SPICE.',
  f='G v = i', r='UP2:10.3', lab='circuit:nodal_analysis')
n('mesh_analysis','Mesh analysis','technique','kvl series_parallel matrices_systems','Solve for loop currents with KVL.',
  'Assign a current to each window of a planar circuit and write KVL around it.',
  'Meshes sharing a branch couple through that resistor; supermeshes handle current sources.',
  'R·i=v for planar circuits with R_ii the mesh resistance and R_ij the shared (negative) one; dual of nodal analysis.',
  f='R i = v', lab='circuit:kvl_kcl')
n('superposition','Superposition','law','nodal_analysis','Linear circuits respond to each source separately.',
  'Compute the effect of each source alone (others turned off) and add the results.',
  'Turn off voltage sources by shorting them and current sources by opening. It fails for power, which is non-linear.',
  'Holds for any linear time-invariant circuit; used to split AC and DC and to superpose different frequencies.',
  lab='circuit:superposition')
n('thevenin_norton','Thévenin and Norton equivalents','law','superposition','Any linear one-port is a source plus a resistor.',
  'Any linear two-terminal circuit can be replaced with a single voltage source in series with a resistor (or a current source in parallel).',
  'Find V_th as the open-circuit voltage and R_th by turning sources off. Great for analysing loads and amplifier outputs.',
  'V_th=I_N R_th; extends to impedances Z_th; test-source method works with dependent sources.',
  f='V_th = I_N·R_th', lab='circuit:thevenin', kn='circuits_ohm')
n('max_power_transfer','Maximum power transfer','law','thevenin_norton','A load takes most power when matched to the source.',
  'A load gets the greatest power when its resistance equals the source’s internal resistance.',
  'At matching, only half the total power reaches the load; efficiency is 50%, so power systems avoid matching while RF systems seek it.',
  'P_L=V_th²R_L/(R_th+R_L)² peaks at R_L=R_th; for AC, Z_L=Z_th* (conjugate match).',
  f='R_L = R_th;  Z_L = Z_th*', lab='circuit:max_power')
n('source_transformation','Source transformations','technique','thevenin_norton','Swap a voltage source+R for a current source+R.',
  'A voltage source in series with a resistor behaves the same as a current source in parallel with it, so you can swap them to simplify.',
  'The transformation is a quick pencil-and-paper way to combine sources; only the outside terminals match.',
  'V_s/R_s=I_s; it does not preserve internal dissipation; use with caution around dependent sources.',
  f='I_s = V_s/R_s', lab='circuit:thevenin')
n('dependent_sources','Dependent (controlled) sources','concept','nodal_analysis','Sources whose value depends on another voltage or current.',
  'Transistors and op-amps act like sources controlled by an input, so analysing them needs dependent sources in the circuit model.',
  'Four types: VCVS, VCCS, CCVS, CCCS; keep the control variable in the equations, don’t turn the source off in superposition.',
  'Small-signal BJT: i_c=β i_b (CCCS) or g_m v_be (VCCS); gains of ideal amplifiers are VCVS parameters.',
  f='i_c = g_m v_be', lab='circuit:common_emitter')
n('capacitor_ee','Capacitor in circuits','component','capacitance_physics derivative','Stores energy in an electric field.',
  'A capacitor blocks steady DC but passes changing signals; it holds a charge.',
  'Current is proportional to the rate of change of voltage; the voltage cannot jump. Used for decoupling, filtering, timing.',
  'i=C dv/dt; impedance 1/(jωC); real capacitors add ESR, ESL and leakage; dielectrics (C0G, X7R, electrolytic) differ in stability and loss.',
  f='i = C dv/dt;  U = ½CV²', lab='circuit:rc_charging', r='UP2:8.1 UP2:8.3')
n('inductor_ee','Inductor in circuits','component','inductance_physics derivative','Stores energy in a magnetic field.',
  'An inductor resists changes in current; it passes steady DC and opposes fast changes.',
  'Voltage is proportional to the rate of change of current; the current cannot jump. Switching an inductor off produces a voltage spike.',
  'v=L di/dt; impedance jωL; real inductors saturate and have winding resistance and parasitic capacitance; flyback spikes are tamed with diodes or snubbers.',
  f='v = L di/dt;  U = ½LI²', lab='circuit:rl_transient', r='UP2:14.2 UP2:14.3')
n('rc_transient','RC transient response','concept','capacitor_ee ode_first_order','Exponential charging and discharging.',
  'When a capacitor charges through a resistor, the voltage rises fast then levels off; the time constant is R×C.',
  'After one time constant the capacitor is 63% charged; after five it is effectively full. Used for timers, debouncing and filters.',
  'v(t)=V_f+(V_0−V_f)e^{−t/τ}, τ=RC. Energy delivered by the source is CV²: half stored, half dissipated in R regardless of R.',
  f='v(t) = V_f + (V₀−V_f) e^{−t/RC}', lab='circuit:rc_charging', r='UP2:10.5 CPH:21.6')
n('rl_transient_node','RL transient response','concept','inductor_ee ode_first_order','Current builds up gradually in a coil.',
  'Current in a coil rises over a time L/R after a switch closes.',
  'It mirrors the RC case with current and voltage roles swapped.',
  'i(t)=I_f+(I₀−I_f)e^{−tR/L}; opening a switch on an inductive load forces large di/dt unless a path is provided.',
  f='i(t) = I_f + (I₀−I_f) e^{−tR/L}', lab='circuit:rl_transient', r='UP2:14.4 CPH:23.10')
n('rlc_transient','RLC natural and step response','concept','rc_transient rl_transient_node ode_second_order','Ringing circuits.',
  'A circuit with R, L and C can oscillate as energy sloshes between capacitor and inductor, while R drains it.',
  'Parameters ζ=R/2√(C/L) for series RLC decide whether the response overshoots and rings or creeps to its final value.',
  'Characteristic roots s=−α±√(α²−ω₀²); α=R/2L, ω₀=1/√LC. Natural response (no source) and step response (DC drive) share roots, differ by forced term.',
  f='s = −α ± √(α² − ω₀²)', lab='circuit:rlc_damping', r='UP2:14.6 UP2:14.5')
n('damping_regimes','Overdamped, underdamped and critically damped','concept','rlc_transient','Three flavours of second-order response.',
  'Overdamped: slow smooth return. Underdamped: oscillating and decaying. Critically damped: the fastest return without ringing.',
  'α>ω₀ gives two real roots, α=ω₀ a double root, α<ω₀ complex roots with damped frequency ω_d.',
  'Q=ω₀/2α; underdamped overshoot exp(−πζ/√(1−ζ²)); settling time ≈4/α; critical damping is a design target for sensors and shock absorbers.',
  f='ζ = α/ω₀;  Q = 1/(2ζ)', lab='circuit:rlc_damping', r='UP1:15.5')
n('sinusoids_ac','Sinusoidal AC and phasors','concept','phasors_math capacitor_ee inductor_ee','Steady alternating signals as complex numbers.',
  'Mains power is a sine wave. Phasors let you handle amplitude and phase with simple complex arithmetic.',
  'In the phasor domain, inductors and capacitors behave like complex resistors; Kirchhoff and Ohm still apply.',
  'v=Vm cos(ωt+φ) ↔ V=Vm∠φ; ω=2πf; phase leads and lags; valid for linear steady-state.',
  f='v = Vm cos(ωt+φ)', lab='circuit:ac_phasors', r='UP2:15.1 UP2:15.2', x=AACA)
n('impedance_admittance','Impedance and admittance','concept','sinusoids_ac','Resistance generalised to AC.',
  'Impedance Z combines resistance and reactance; it says how much a component opposes AC and shifts its phase.',
  'Z_R=R, Z_L=jωL, Z_C=1/(jωC). Admittance Y=1/Z is handy in parallel circuits.',
  'Z=R+jX; |Z|=√(R²+X²); series impedances add, parallel admittances add; Kirchhoff’s laws hold unchanged for phasors.',
  f='Z_L = jωL;  Z_C = 1/(jωC)', lab='circuit:ac_phasors', r='UP2:15.3 CPH:23.11')
n('rms_average_power','RMS and average power','concept','sinusoids_ac integral_ftc','The DC-equivalent of an AC waveform.',
  'RMS (root-mean-square) tells the DC value that would heat a resistor equally. Mains of 230 V RMS peaks at 325 V.',
  'Average power in a resistor is V_rms·I_rms; reactive elements store and return energy without net consumption.',
  'V_rms=√(1/T∫v²dt); for a sine Vm/√2; for non-sinusoids use true-RMS meters.',
  f='V_rms = Vm/√2', lab='circuit:power_factor', r='UP2:15.4')
n('complex_power','Real, reactive and complex power','concept','rms_average_power impedance_admittance','P, Q and S: what is used, what sloshes, what is carried.',
  'Real power P does work; reactive power Q flows back and forth; apparent power S is the product V_rms·I_rms.',
  'S=P+jQ with units W, var and VA; the power triangle relates them; utilities bill and size equipment on VA.',
  'S=VI*; P=VI cosφ, Q=VI sinφ; Tellegen’s theorem ensures ΣS=0 over a network.',
  f='S = P + jQ = V I*', lab='circuit:power_factor')
n('power_factor_node','Power factor and correction','concept','complex_power','How efficiently current is used.',
  'Power factor is the fraction of apparent power that does real work. Motors lower it; capacitors bring it back.',
  'Low PF means extra current, extra line losses and bigger cables; factories add capacitor banks.',
  'pf=cosφ; correction capacitance C=P(tanφ₁−tanφ₂)/(ωV²); non-linear loads add distortion PF, solved by PFC converters.',
  f='pf = cosφ = P/S', lab='circuit:power_factor')
n('three_phase','Three-phase circuits (wye and delta)','concept','complex_power','Three sinusoids 120° apart.',
  'Three-phase power uses three conductors carrying sine waves offset by 120°, giving constant total power and smaller wires.',
  'Wye (star) and delta connections link sources and loads: line voltage is √3 times phase voltage in wye.',
  'P_total=√3 V_L I_L cosφ; balanced systems analysed per-phase; unbalanced via symmetrical components; rotating field for motors.',
  f='P = √3 V_L I_L cosφ', lab='circuit:three_phase', kn='power_grid')
n('transfer_function_ee','Transfer functions','concept','impedance_admittance poles_zeros','Output over input as a function of frequency.',
  'A transfer function H tells how a circuit scales and shifts each frequency.',
  'It is a ratio of polynomials in s; its poles set natural responses.',
  'H(s)=Vout(s)/Vin(s); for impedance-based networks follow from divider formulas with Z(s).',
  f='H(s) = Vout/Vin', lab='circuit:low_pass')
n('frequency_response_bode','Frequency response and Bode plots','technique','transfer_function_ee','Gain and phase on log axes.',
  'A Bode plot shows gain (in dB) and phase against log frequency, revealing a circuit’s character at a glance.',
  'Each pole bends the gain slope by −20 dB/decade and the phase by −90° (over a decade or two).',
  'Asymptotic approximation: corner at ω=1/τ, −3 dB there and −45° phase; composite plots by adding contributions of poles and zeros.',
  f='|H| dB = 20 log₁₀|H(jω)|', lab='circuit:low_pass')
n('resonance_q','Resonance and quality factor','concept','impedance_admittance','Tuning and sharpness.',
  'An RLC circuit responds strongly near one frequency, its resonance; Q measures how narrow the peak is.',
  'Radio tuners pick one station using this. High Q means narrow bandwidth and long ringing.',
  'ω₀=1/√LC; series Q=ω₀L/R; bandwidth B=ω₀/Q; at resonance reactances cancel, series Z=R.',
  f='ω₀ = 1/√(LC);  Q = ω₀L/R', lab='circuit:resonance_q', r='UP2:15.5 CPH:23.12')
n('low_pass_filter','Low-pass filter','technique','frequency_response_bode','Pass slow, block fast.',
  'A resistor and a capacitor in series, outputting across the capacitor, pass low frequencies and attenuate high ones.',
  'Cutoff f_c=1/(2πRC); used for anti-aliasing and removing noise.',
  'First-order −20 dB/dec; higher order by cascading or active designs (Butterworth, Chebyshev).',
  f='f_c = 1/(2πRC)', lab='circuit:low_pass')
n('high_pass_filter','High-pass filter','technique','frequency_response_bode','Pass fast, block slow.',
  'Swapping the R and C passes high frequencies and blocks DC.',
  'Used for AC coupling and removing drift.',
  'H(s)=sRC/(1+sRC); phase leads by up to +90° at low frequency.',
  f='H(s) = sRC/(1+sRC)', lab='circuit:high_pass')
n('band_pass_filter','Band-pass filter','technique','resonance_q','Pass one band.',
  'Combine high- and low-pass sections, or use a resonant circuit, to pass only a band of frequencies.',
  'Centre f₀ and bandwidth set selectivity; radios and EEG front-ends use band-pass stages.',
  'Second-order H=(ω₀/Q)s/(s²+(ω₀/Q)s+ω₀²).',
  lab='circuit:band_pass')
n('notch_filter','Notch (band-stop) filter','technique','resonance_q','Remove one frequency.',
  'A notch filter blocks a narrow band, such as 50/60 Hz mains hum, and passes everything else.',
  'Twin-T and bridged networks create the notch; ECG instruments rely on them.',
  'Zeros on jω axis at ω₀ with Q controlling width; digital notches use z-plane zeros on the unit circle.',
  lab='circuit:notch')
n('two_port_networks','Two-port networks','concept','transfer_function_ee','Black-box description of a circuit with input and output.',
  'A two-port is characterised by a small matrix relating input and output voltages and currents.',
  'Z, Y, h, ABCD and S parameters are different ways to write the same relation; cascaded stages multiply ABCD matrices.',
  'Reciprocity (Z12=Z21) holds for passive linear networks; S-parameters are used at RF where open/short measurement is hard.',
  f='[V₁;V₂]=[Z][I₁;I₂]', x=wp('Two-port_network'))
n('mutual_inductance','Mutual inductance','concept','inductor_ee','Coupled coils.',
  'Two coils near each other share magnetic flux, so current in one induces voltage in the other.',
  'The coupling M=k√(L₁L₂); the dot convention gives the sign of the induced voltage.',
  'v₁=L₁di₁/dt+M di₂/dt; leakage inductance and magnetising inductance model non-ideal coupling.',
  f='v₂ = M di₁/dt', lab='circuit:transformer', r='UP2:14.1')
n('transformer_ideal','Ideal transformer','component','mutual_inductance','Changes voltage and current levels.',
  'A transformer swaps voltage for current using two coils on a shared core; V₂/V₁ equals turns ratio.',
  'Power is preserved; impedances are scaled by the ratio squared; it only works with AC.',
  'V₂/V₁=N₂/N₁, I₂/I₁=N₁/N₂, Z_in=(N₁/N₂)²Z_L; real transformers have winding resistance, leakage, core loss, saturation.',
  f='V₂/V₁ = N₂/N₁', lab='circuit:transformer', r='UP2:15.6 CPH:23.7')
n('laplace_circuit_analysis','Laplace-domain circuit analysis','technique','laplace_math impedance_admittance rlc_transient','Circuits with initial conditions, as algebra.',
  'Replace each element with its s-domain impedance and add small sources for initial conditions; solve like a resistor network.',
  'It handles transients and non-sinusoidal inputs; inverse transform returns the time response.',
  'Z_R=R, Z_L=sL (+L i₀ source), Z_C=1/sC (+v₀/s source); convolution in time ↔ product in s.',
  f='Z_L = sL;  Z_C = 1/(sC)', lab='circuit:rlc_damping')
save('ee_circuits')
