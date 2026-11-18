from lib import *
area('ee_electronics')
AAS="All About Circuits: Semiconductors|https://www.allaboutcircuits.com/textbook/semiconductors/"
n('energy_bands_ee','Energy bands and band gap','concept','quantum_intro bonding_materials','Why solids split into conductors, semiconductors, insulators.',
  'In a crystal, allowed electron energies merge into bands separated by gaps. Silicon’s gap is 1.12 eV, small enough to control electrically.',
  'Electrons in the valence band are stuck; those lifted to the conduction band move freely and leave mobile holes behind.',
  'E_g(Si)=1.12 eV, Ge 0.66, GaAs 1.42 (direct), SiC ≈3.3, GaN 3.4; intrinsic concentration nᵢ≈10¹⁰ cm⁻³ for Si at 300 K, nᵢ∝T^{3/2}e^{−E_g/2kT}.',
  f='nᵢ ∝ T^{3/2} e^{−E_g/2kT}', lab='device:bands_formation', kn='band_theory', r='UP3:9.5')
n('doping_pn_material','Doping: n-type and p-type material','concept','energy_bands_ee','Adding impurities to set carrier type.',
  'Adding a few phosphorus atoms gives free electrons (n-type); boron gives holes (p-type). Conductivity can be tuned by a factor of a million.',
  'Dopants of ~10¹⁵–10²⁰ cm⁻³ dominate over intrinsic carriers; mass-action law np=nᵢ² ties electrons and holes.',
  'Donor/acceptor levels sit ~45 meV from band edges for P/B in Si, fully ionised at room temperature; compensation and degenerate doping.',
  f='n·p = nᵢ²', lab='device:n_type', r='UP3:9.6', kn='semiconductors_pn')
n('drift_diffusion_ee','Drift and diffusion currents','concept','doping_pn_material','Two ways carriers move.',
  'Carriers drift in an electric field and diffuse from high to low concentration.',
  'Total current J=qnμE+qD dn/dx; Einstein relation links mobility and diffusion.',
  'D=μkT/q (thermal voltage kT/q≈25.9 mV at 300 K); velocity saturates near 10⁷ cm/s in Si at high fields.',
  f='J = qμnE + qD ∇n', lab='device:drift_diffusion')
n('pn_junction_ee','The PN junction','concept','drift_diffusion_ee','A diode is born where n meets p.',
  'Where p-type meets n-type, carriers diffuse across, leaving a depletion zone with a built-in field; this lets current pass one way only.',
  'Forward bias shrinks the barrier and current grows exponentially; reverse bias widens it and little current flows.',
  'I=I_s(e^{V/nV_T}−1); built-in potential V_bi=V_T ln(N_aN_d/nᵢ²)≈0.7 V for Si; ideality n between 1 and 2.',
  f='I = I_s (e^{V/nV_T} − 1)', lab='device:pn_forward', kn='semiconductors_pn')
n('diode_models','Diode models','concept','pn_junction_ee nodal_analysis','Ideal, constant-drop and exponential.',
  'Simple models: an ideal one-way switch; or a switch with a 0.7 V drop; or the full exponential curve.',
  'Load-line analysis and iterative solving give operating points; small-signal resistance r_d=nV_T/I.',
  'SPICE diode includes series R_s, junction capacitance C_j=C_j0/(1+V_R/V_bi)^m and transit time for charge storage.',
  f='r_d = nV_T/I_D', lab='circuit:led_circuit')
n('rectifiers','Rectifiers','technique','diode_models rms_average_power','AC to pulsating DC.',
  'A diode lets only one half of an AC wave through. A bridge of four diodes uses both halves.',
  'A filter capacitor smooths the ripple; ripple ≈ I/(2fC) for full-wave.',
  'Half-wave: V_dc=Vm/π; full-wave: 2Vm/π; diode peak inverse voltage and conduction angle drive transformer sizing and EMI.',
  f='V_dc = 2Vm/π (full-wave)', lab='circuit:bridge_rectifier')
n('clippers_clampers','Clippers and clampers','technique','diode_models capacitor_ee','Shape waveform levels with diodes.',
  'Clippers trim peaks off a signal; clampers shift its DC level.',
  'Input protection and level shifting; a clamper holds a capacitor charged to a peak.',
  'Biased clippers use reference voltages; clamper time constant must exceed signal period.',
  lab='circuit:half_wave_rectifier')
n('zener_regulation','Zener diodes and regulation','component','diode_models','A diode that holds a steady reverse voltage.',
  'In reverse breakdown, a zener holds nearly constant voltage, so it provides a simple voltage reference.',
  'Series resistor limits current; load and line regulation depend on dynamic resistance.',
  'Zener (<5.5 V, tunnelling) vs avalanche (>5.5 V); temperature coefficient crosses zero near 5.6 V; bandgap references are better.',
  lab='circuit:zener_regulator')
n('led_photodiode','LEDs and photodiodes','component','pn_junction_ee','Light out, light in.',
  'In an LED, electrons and holes recombine and emit light; a photodiode does the reverse, turning light into current.',
  'LED colour is set by band gap: ~1.9 eV red, ~2.7 eV blue; always limit current with a series resistor.',
  'Direct band-gap materials (GaAs, GaN) radiate efficiently; photodiode in photoconductive (reverse) mode is fast; I_ph=ηqP/hν.',
  f='λ(μm) ≈ 1.24/E_g(eV)', lab='circuit:led_circuit', kn='led_lasers solar_cells')
n('bjt_regions','BJT operation and regions','component','pn_junction_ee','A current-controlled transistor.',
  'A bipolar transistor has three layers (NPN or PNP). A small base current controls a much larger collector current.',
  'Regions: cutoff (off), active (amplifier), saturation (switch on); β=I_C/I_B typically 50–300.',
  'I_C=I_s e^{V_BE/V_T}(1+V_CE/V_A); Ebers–Moll model; transconductance g_m=I_C/V_T.',
  f='I_C = I_s e^{V_BE/V_T}', lab='device:bjt_output', kn='semiconductors_pn')
n('bjt_biasing','BJT DC biasing','technique','bjt_regions voltage_divider','Setting a stable operating point.',
  'Resistors set the transistor’s idle currents so it works as a linear amplifier; the bias must survive temperature and β variation.',
  'Voltage-divider bias with an emitter resistor is the standard stable arrangement.',
  'Q-point on the load line; stability factor S=ΔI_C/ΔI_CO; emitter degeneration reduces sensitivity.',
  lab='circuit:common_emitter')
n('bjt_small_signal','BJT small-signal model','technique','bjt_biasing dependent_sources','Linearising around the bias point.',
  'For small inputs the transistor behaves linearly; its model has r_π, g_m and r_o.',
  'Compute gain from the model by replacing DC sources with zero and capacitors with shorts.',
  'Hybrid-π: r_π=β/g_m, r_o=V_A/I_C; T-model is alternative; high-frequency adds C_π and C_μ.',
  f='A_v = −g_m (r_o ∥ R_C)', lab='circuit:common_emitter')
n('bjt_amplifiers','BJT amplifier configurations','technique','bjt_small_signal','CE, CB and CC stages.',
  'Common-emitter gives voltage gain and inversion; common-collector (emitter follower) buffers; common-base is fast.',
  'Choose by gain, input and output impedance. Follower: gain ≈1, high Z_in, low Z_out.',
  'CE A_v≈−g_mR_C; CC A_v≈g_mR_E/(1+g_mR_E); CB Z_in≈1/g_m; cascode CE+CB improves bandwidth.',
  lab='circuit:common_emitter')
n('bjt_switch_node','BJT as a switch','technique','bjt_regions','On/off driving of loads.',
  'Driving a BJT between cutoff and saturation lets a small control signal switch a larger current.',
  'A base resistor sets drive; V_CE(sat)≈0.2 V; a flyback diode protects against inductive loads.',
  'Storage-time delay in saturation limits speed; Baker clamps and Darlington pairs.',
  lab='circuit:bjt_switch')
n('mosfet_physics_ee','MOSFET device physics','component','doping_pn_material capacitance_physics','Voltage-controlled transistor.',
  'A MOSFET’s gate voltage creates a conducting channel between source and drain; almost no gate current flows.',
  'Above threshold V_T the channel forms; current grows with V_GS and saturates for high V_DS.',
  'MOS capacitor regimes: accumulation, depletion, inversion; threshold V_T=V_FB+2φ_F+Q_dep/C_ox; body effect.',
  f='V_T = V_FB + 2φ_F + Q_dep/C_ox', lab='device:mos_capacitor', kn='semiconductors_pn')
n('mosfet_iv','MOSFET I–V characteristics','concept','mosfet_physics_ee','Triode, saturation, cutoff.',
  'At small V_DS the MOSFET acts as a resistor; at large V_DS the current saturates.',
  'Square-law model I_D=½k(V_GS−V_T)² in saturation; g_m=∂I_D/∂V_GS.',
  'Channel-length modulation λ; velocity saturation makes current linear in overdrive in short channels; subthreshold current exponential.',
  f='I_D = ½ μC_ox (W/L)(V_GS−V_T)²', lab='device:mosfet_output')
n('mosfet_biasing','MOSFET biasing','technique','mosfet_iv voltage_divider','Setting the operating point.',
  'Resistor dividers or a current source set the gate voltage so the MOSFET stays in saturation.',
  'Source degeneration and constant-current biasing improve stability.',
  'IC design uses bias currents from mirrors and gm/Id methodology rather than hand-picked resistors.',
  lab='device:mosfet_transfer')
n('mosfet_amplifiers','MOSFET amplifier configurations','technique','mosfet_biasing dependent_sources','CS, CG and CD stages.',
  'Common-source gives gain; common-drain (source follower) buffers; common-gate suits high-frequency.',
  'A_v≈−g_m(r_o∥R_D) for CS; follower gain<1 and no inversion.',
  'Cascode, folded cascode, and active loads boost gain g_m r_o; gain per stage in modern CMOS is only ~10–30 due to low r_o.',
  f='A_v ≈ −g_m (r_o ∥ R_D)', lab='circuit:common_emitter')
n('mosfet_switch_node','MOSFET as a switch','technique','mosfet_iv','Gate drives a low-resistance on-state.',
  'A MOSFET fully on acts like a small resistor R_DS(on) and off like an open circuit; it is the basis of digital logic and power converters.',
  'Switching loss comes from gate charge and overlapping V and I during transitions.',
  'P_cond=I²R_DS(on); P_sw≈½V I (t_r+t_f) f_sw+Q_g V_g f_sw; body-diode recovery matters in bridges.',
  f='P_cond = I²R_DS(on)', lab='circuit:mosfet_switch')
n('cmos_logic_gates','CMOS logic gates','concept','mosfet_switch_node','Complementary pull-up and pull-down networks.',
  'In CMOS each gate has PMOS transistors that pull the output up and NMOS that pull it down; only one network conducts at once so static power is tiny.',
  'NAND = series NMOS + parallel PMOS; NOR the opposite. Dynamic power ≈ αCV²f.',
  'Noise margins, propagation delay t_p≈0.69RC, logical effort; leakage now rivals dynamic power in deep-submicron nodes.',
  f='P_dyn = α C V² f', lab='device:cmos_nand')
n('amp_specs','Gain, impedances and frequency response','concept','transfer_function_ee','Specifying an amplifier.',
  'Gain says how much bigger the output is; input/output impedance say how it loads and is loaded.',
  'Gain in dB, bandwidth, and gain-bandwidth trade-offs determine suitability.',
  'Two-port model with R_in, R_out, A_v; frequency roll-off set by coupling capacitors (low) and parasitics (high).',
  f='A_dB = 20 log₁₀|A_v|')
n('miller_effect','Miller effect','concept','amp_specs bjt_small_signal','Feedback capacitance looks bigger at the input.',
  'A capacitor bridging an inverting amplifier looks (1+A) times larger from the input, which cuts bandwidth.',
  'Cascodes avoid it by keeping the voltage at the amplifier’s inner node nearly constant.',
  'C_M=C_μ(1+|A_v|); dominant pole f_p≈1/(2π R_s C_M); pole splitting also stabilises op-amps.',
  f='C_M = C_μ (1 + |A_v|)', lab='circuit:common_emitter')
n('differential_amp','Differential amplifier','concept','bjt_amplifiers mosfet_amplifiers','Amplify the difference of two inputs.',
  'A differential pair amplifies the difference between two inputs and rejects what both share (noise).',
  'Common-mode rejection ratio CMRR measures this; the tail current source sets the gain.',
  'A_d=g_m R_D; A_cm≈−R_D/2R_tail; the long-tailed pair is the input stage of nearly every op-amp.',
  f='CMRR = |A_d/A_cm|')
n('current_mirror','Current mirrors','technique','mosfet_amplifiers','Copy a current.',
  'A pair of matched transistors copies a reference current to another branch.',
  'Used for bias in ICs and as active loads that give large gain.',
  'Mirror error from λ and mismatch; Wilson/cascode mirrors raise output resistance.',
  lab='circuit:common_emitter')
n('active_load','Active loads','technique','current_mirror differential_amp','Transistors replace resistors as loads.',
  'A current-mirror load gives high gain in little chip area.',
  'Small-signal gain g_m r_o, single-ended conversion.',
  'Output resistance r_o∥r_o; limits of headroom; common-mode feedback required in fully differential stages.')
n('multistage_amps','Multistage amplifiers','concept','differential_amp','Cascading stages.',
  'Stages are chained for more gain, with input, gain and output stages.',
  'Gain multiplies, bandwidth shrinks, loading between stages matters.',
  'Two-stage Miller-compensated op-amp is the textbook design; bandwidth shrinkage factor √(2^{1/n}−1).')
n('output_stages','Output stages (Class A, B, AB, D)','concept','bjt_amplifiers','Delivering power to a load.',
  'Class A conducts all the time (clean, wasteful); class B splits the wave between two transistors; AB adds bias to avoid crossover distortion; D switches fully on/off.',
  'Efficiencies: A≤25–50%, B≤78.5%, D>90%.',
  'Class D PWM + LC filter; switching frequencies 300 kHz–1 MHz; thermal design; crossover distortion cured by Vbe-multiplier bias.',
  f='η_B max = π/4 ≈ 78.5%')
n('opamp_ideal','Ideal op-amp','component','differential_amp','A high-gain amplifier with two golden rules.',
  'With negative feedback, an op-amp adjusts its output so its two inputs are at the same voltage and draw no current.',
  'Infinite gain, infinite input resistance, zero output resistance: analysis becomes simple algebra.',
  'Virtual short and zero input current; A_OL≈10⁵–10⁶ gives closed-loop gain 1/β.',
  f='V₊ = V₋;  i₊ = i₋ = 0', lab='circuit:inverting_amp')
n('inverting_amp_node','Inverting amplifier','technique','opamp_ideal','Gain = −Rf/Rin.',
  'Feed the input through a resistor to the − terminal and connect Rf from output back; the output is an inverted, scaled copy.',
  'Virtual ground at the − input makes input impedance equal Rin.',
  'Closed-loop BW=GBW/(1+Rf/Rin); noise gain 1+Rf/Rin.',
  f='Vout = −(Rf/Rin) Vin', lab='circuit:inverting_amp')
n('non_inverting_amp_node','Non-inverting amplifier','technique','opamp_ideal','Gain = 1 + Rf/Rg.',
  'Input goes to the + terminal and feedback divides output to the − terminal; gain is at least 1, input impedance very high.',
  'The voltage follower (gain 1) buffers a source.',
  'BW=GBW/(1+Rf/Rg); input impedance boosted by loop gain.',
  f='Vout = (1 + Rf/Rg) Vin', lab='circuit:non_inverting_amp')
n('summing_amp_node','Summing amplifier','technique','inverting_amp_node','Add signals.',
  'Several inputs through resistors into the inverting node give an output that is their weighted sum, inverted.',
  'Basis of a simple DAC and audio mixer.',
  'Vout=−Rf Σ(Vi/Ri); inputs are isolated by virtual ground.',
  f='Vout = −Rf Σ Vᵢ/Rᵢ', lab='circuit:summing_amp')
n('integrator_node','Op-amp integrator','technique','inverting_amp_node rc_transient','Output is the integral of the input.',
  'Replacing Rf with a capacitor makes the output the running integral of the input.',
  'Used in analog computing, ramp generators and ADCs; needs a reset or drift resistor.',
  'H(s)=−1/(sRC); DC offset leads to saturation without a high-value feedback resistor.',
  f='Vout = −(1/RC) ∫Vin dt', lab='circuit:integrator')
n('differentiator_node','Op-amp differentiator','technique','inverting_amp_node','Output is the derivative of the input.',
  'Swapping R and C yields an output proportional to the input’s slope; amplifies high-frequency noise.',
  'Practical versions add a series resistor to cap the high-frequency gain.',
  'H(s)=−sRC; stability needs a pole to limit loop gain.',
  f='Vout = −RC dVin/dt', lab='circuit:differentiator')
n('instrumentation_amp','Instrumentation amplifier','component','differential_amp opamp_ideal','Precise amplification of small differential signals.',
  'Three op-amps and a gain resistor amplify the tiny difference from sensors like bridges and ECG electrodes, with high input impedance and CMRR.',
  'One resistor sets the gain, and matched resistors determine CMRR.',
  'G=1+2R/R_G; CMRR >100 dB in modern ICs; chopper stabilisation cancels offset.',
  f='G = 1 + 2R/R_G')
n('comparator_node','Comparator','component','opamp_ideal','Decides which input is larger.',
  'A comparator outputs high or low depending on which input is greater; it is a 1-bit ADC.',
  'It uses no feedback or positive feedback; noise at the threshold causes chatter.',
  'Propagation delay, overdrive, input offset, open-collector vs push-pull outputs.',
  lab='circuit:comparator')
n('schmitt_trigger_node','Schmitt trigger','component','comparator_node','A comparator with hysteresis.',
  'Positive feedback creates two thresholds so noise does not cause chatter.',
  'Used for debouncing and cleaning slow edges into clean logic.',
  'V_T±=±V_sat R₁/(R₁+R₂); hysteresis width = 2V_sat R₁/(R₁+R₂).',
  lab='circuit:schmitt_trigger')
n('opamp_nonideal','Op-amp non-idealities','concept','opamp_ideal','Offset, slew rate, gain-bandwidth.',
  'Real op-amps have offset voltage, finite speed and finite gain; these limit accuracy and bandwidth.',
  'Slew rate SR limits large signals: full-power bandwidth f=SR/(2πV_p); GBW fixes small-signal bandwidth.',
  'Bias current, offset drift, CMRR, PSRR, input noise density (nV/√Hz), output swing; rule: closed-loop BW=GBW/noise gain.',
  f='f_FP = SR/(2πV_p);  GBW = A_v·BW')
n('negative_feedback_ee','Negative feedback','concept','amp_specs','Trade gain for accuracy.',
  'Feeding part of the output back to subtract from the input makes the gain predictable and cuts distortion.',
  'Four topologies (series/shunt, voltage/current) change input and output impedances.',
  'A_f=A/(1+Aβ); desensitivity; bandwidth extends by (1+Aβ); improves linearity by the same factor.',
  f='A_f = A/(1 + Aβ)', lab='circuit:non_inverting_amp')
n('feedback_stability_margins','Stability, gain and phase margins','concept','negative_feedback_ee frequency_response_bode','Will the loop oscillate?',
  'If the loop gain reaches 1 at a frequency where the phase has swung 180°, a feedback amplifier oscillates; margins measure how far from this we are.',
  'Phase margin >45° (60° preferred) is the rule of thumb for a well-damped step response.',
  'PM=180°+∠L(jω_c); GM=−20log|L(jω_180)|; compensation by dominant pole or lead networks.',
  f='PM = 180° + ∠L(jω_c)', lab='control:bode_margins')
n('oscillators_ee','Oscillators: Wien, Colpitts, crystal','concept','feedback_stability_margins resonance_q','Self-sustaining oscillation.',
  'An oscillator is an amplifier whose output is fed back with exactly the right phase and gain to sustain a sine wave.',
  'Barkhausen criterion: loop gain 1 and phase 0°. Wien bridge uses RC; Colpitts uses LC; crystals give accurate frequency.',
  'Wien: f=1/2πRC with gain 3; Colpitts f=1/2π√(L C₁C₂/(C₁+C₂)); quartz Q~10⁴–10⁶, stability ~ppm; amplitude limited by non-linearity.',
  f='f_Wien = 1/(2πRC)', lab='circuit:wien_oscillator')
n('active_filters','Active filters','technique','opamp_ideal low_pass_filter','Filters with gain using op-amps.',
  'Op-amps with RC networks make filters without inductors, with gain and sharp responses.',
  'Sallen–Key and multiple-feedback second-order sections cascade into higher orders.',
  'Butterworth maximally flat, Chebyshev ripple for sharper edge, Bessel linear phase; Q set by component ratios and op-amp GBW.',
  lab='circuit:low_pass')
n('adc_basics','Analog-to-digital converters','concept','comparator_node','Measuring a voltage as a number.',
  'An ADC samples a voltage and turns it into a binary number; more bits, finer steps.',
  'Architectures: flash (fast), SAR (balanced), sigma-delta (precise), pipeline.',
  'LSB=V_ref/2ᴺ; ideal SNR=6.02N+1.76 dB; INL/DNL; aperture jitter limits SNR at high input frequency; oversampling gains 3 dB/octave in sigma-delta.',
  f='SNR = 6.02N + 1.76 dB', lab='signal:adc_quantizer', rel='sampling_theorem')
n('dac_basics','Digital-to-analog converters','concept','summing_amp_node','Turning numbers into voltages.',
  'A DAC converts a binary code into a voltage or current using a weighted network of resistors or capacitors.',
  'R-2R ladders give accurate binary weighting; PWM plus a filter is a cheap DAC.',
  'Settling time, glitch energy, DNL; reconstruction filter removes images; sigma-delta DACs use noise shaping.',
  lab='signal:dac_ladder')
n('linear_regulators','Linear regulators (LDO)','component','bjt_regions negative_feedback_ee zener_regulation','Steady voltage by burning the excess.',
  'A linear regulator uses a pass transistor and feedback to hold a fixed output; the excess voltage is dissipated as heat.',
  'Low dropout (LDO) regulators work close to input voltage; low noise makes them good for analog.',
  'Dropout, PSRR, quiescent current, stability with output-cap ESR; P_diss=(Vin−Vout)I.',
  f='P = (V_in − V_out) I')
save('ee_electronics')
