from lib import *
area('ee_power')
n('magnetic_circuits','Magnetic circuits','concept','magnetostatics_materials','Flux through iron paths.',
  'Iron cores guide magnetic flux like wires guide current, with turns×current acting as the push (mmf).',
  'Reluctance ℜ=ℓ/μA; air gaps dominate reluctance; saturation limits flux density near 1.5–2 T for silicon steel.',
  'Core loss = hysteresis + eddy (laminations cut eddy); B–H curves; fringing; inductance L=N²/ℜ.',
  f='mmf = N I = Φ ℜ', lab='field:magnetic_circuit', kn='magnetic_materials')
n('power_transformers','Transformers in power systems','component','transformer_ideal magnetic_circuits','Real transformers at scale.',
  'Power transformers step voltage up for transmission and down for use; efficiency exceeds 99%.',
  'Equivalent circuit: winding resistance, leakage reactance, magnetising branch; tests: open- and short-circuit.',
  'Voltage regulation, per-unit impedance, three-phase connections (Δ–Y); inrush current; cooling classes (ONAN); losses ∝ I² and core loss ∝ B².',
  lab='circuit:transformer', kn='induction_generators')
n('dc_machines','DC machines','device','faraday_lenz magnetic_fields_forces','Motors and generators with commutators.',
  'A DC motor’s coil in a magnetic field feels torque; a commutator flips current to keep it turning.',
  'Torque ∝ flux × armature current; speed ∝ V/flux; brushless DC replaces the mechanical commutator with electronics.',
  'T=k_tΦI_a, E_b=k_eΦω; speed control by armature voltage or field weakening; separately excited, series and shunt types.',
  f='T = k_t I,  E_b = k_e ω', lab='field:motor_torque', kn='electric_motors', r='UP2:13.6')
n('induction_motor','Induction motors','device','three_phase magnetic_circuits','The workhorse motor.',
  'Three-phase currents create a rotating magnetic field; it drags a rotor around by induced currents.',
  'The rotor lags the field by a slip s of a few percent; no brushes needed.',
  'N_s=120f/P; torque–slip curve with peak at s_max; equivalent circuit; V/f control for variable speed.',
  f='N_s = 120 f/P;  s = (N_s − N)/N_s', lab='field:rotating_field', kn='electric_motors')
n('synchronous_machines','Synchronous machines','device','three_phase magnetic_circuits','Rotor locked to the field.',
  'A synchronous machine’s rotor turns exactly in step with the grid frequency; most power plants use huge ones as generators.',
  'Excitation current controls reactive power; load angle controls real power.',
  'Power–angle P=(E V/X_s)sinδ; stability limit at 90°; permanent-magnet synchronous motors common in EVs.',
  f='P = (E V / X_s) sin δ', lab='field:rotating_field', kn='induction_generators')
n('power_generation','Generation of electric power','concept','synchronous_machines energy_momentum','Turning fuel into spin into electricity.',
  'Steam, gas, water or wind turn turbines that spin generators; solar panels make DC directly.',
  'Base-load, peaking and variable plants; efficiency limited by heat-engine (Carnot) theory for thermal plants.',
  'Combined-cycle gas ~60% efficient; hydro >90%; capacity factor; inertia from rotating mass stabilises frequency.',
  kn='energy_systems fission_power')
n('transmission_distribution','Transmission and distribution','concept','power_transformers transmission_lines','Moving power across a continent.',
  'High voltage cuts current for the same power, so wires lose less as heat; substations step voltage down near users.',
  'Typical levels: 765/345/230 kV transmission, 11–35 kV distribution, 120/230 V utilisation.',
  'Line losses I²R; surge-impedance loading; long lines need reactive compensation; HVDC beats AC beyond ~600 km overhead.',
  f='P_loss = I²R', kn='power_grid')
n('per_unit_system','Per-unit system','technique','power_transformers','Normalising power system quantities.',
  'Expressing voltages, currents and impedances as fractions of chosen base values simplifies calculations across transformers.',
  'Choose S_base and V_base; Z_base=V_base²/S_base.',
  'Per-unit transformer impedance is the same on both sides; change of base Z_pu,new=Z_pu,old(S_new/S_old)(V_old/V_new)².',
  f='Z_base = V_base²/S_base')
n('power_flow_analysis','Power flow analysis','technique','per_unit_system matrices_systems','Solving for voltages and flows in a grid.',
  'Power-flow studies compute bus voltages and line flows for given generation and load, using iterative solvers.',
  'Gauss–Seidel, Newton–Raphson; bus types: slack, PV, PQ.',
  'Y_bus matrix; NR Jacobian; DC power flow approximation P=Bθ; optimal power flow adds cost minimisation.',
  f='S_i = V_i Σ Y*_ik V*_k', lab='network:power_flow_grid')
n('fault_analysis','Fault analysis','technique','per_unit_system three_phase','What happens in a short circuit.',
  'A fault creates huge currents; analysis predicts them so equipment can be sized and protected.',
  'Faults: three-phase, line-to-ground, line-to-line; symmetrical components simplify unbalanced faults.',
  'Zero, positive and negative sequence networks; fault current I_f=V/Z_th; breaker interrupting rating and X/R ratio.',
  f='I_f = V_th / Z_th', lab='network:power_flow_grid')
n('protection_relays_breakers','Protection: relays and circuit breakers','device','fault_analysis','Cutting the power safely and fast.',
  'Relays sense abnormal currents and trip breakers that interrupt them within a few cycles.',
  'Overcurrent, differential and distance relays; breakers quench the arc with SF₆, vacuum, or air.',
  'Coordination curves; zones of protection; arc extinction at current zero in AC; DC breakers are harder (no zero crossing).',
  lab='network:power_flow_grid')
n('grid_renewables_smart','Power grid, renewables and smart grid','concept','transmission_distribution protection_relays_breakers','Balancing a continent-sized machine.',
  'Supply and demand must match every instant; wind and solar vary, so storage, flexible demand and communication help.',
  'Inverters feed solar into the grid; grid-forming inverters replace the inertia of spinning generators; smart meters enable demand response.',
  'Frequency control (primary, secondary), RoCoF, duck curve; synchrophasor measurement; microgrids; cybersecurity of grid control.',
  c='C2', oq=['How to keep inertia-free grids stable at very high renewable share?','What storage mix is cheapest for multi-day lulls?'], lab='network:power_flow_grid', kn='power_grid energy_systems')
n('rectifiers_inverters','Power rectifiers and inverters','concept','rectifiers mosfet_switch_node','AC↔DC converters.',
  'Controlled rectifiers convert AC to adjustable DC; inverters create AC from DC using fast switches and PWM.',
  'H-bridge with sine-weighted PWM; three-phase inverters drive motors and feed solar into the grid.',
  'SPWM, space-vector modulation, THD; thyristor phase control; active front end and PFC; DC-link capacitors.',
  lab='circuit:inverter_bridge')
n('buck_converter_node','Buck converter','technique','inductor_ee mosfet_switch_node','Step down efficiently.',
  'A switch chops the input and an inductor–capacitor filter averages it, giving a lower output with little loss.',
  'V_out=D·V_in in continuous conduction; ripple from L and C.',
  'ΔI_L=(V_in−V_out)D T/L; CCM/DCM boundary; synchronous rectification; control by voltage-mode or current-mode.',
  f='Vout = D Vin', lab='circuit:buck_converter')
n('boost_buckboost','Boost and buck-boost converters','technique','buck_converter_node','Step up, or step up and down.',
  'Boost: output above input. Buck-boost: output of either size, inverted.',
  'Boost V_out=V_in/(1−D); inductor stores energy while the switch is on and releases it through a diode.',
  'RHP zero in boost control loop; flyback derived from buck-boost with a coupled inductor; efficiency 85–98%.',
  f='Vout = Vin/(1−D)', lab='circuit:boost_converter')
n('smps_switching_supplies','Switching power supplies','concept','boost_buckboost power_transformers','Compact, efficient power conversion.',
  'Switch-mode supplies chop DC at 50 kHz–2 MHz through small transformers and inductors, replacing bulky 50/60 Hz parts.',
  'Topologies: flyback, forward, half/full bridge, LLC; isolation via transformer and optocoupler or secondary-side control.',
  'Magnetics design (area product); snubbers; EMI filters; soft switching (ZVS) improves efficiency; GaN enables MHz operation.',
  lab='circuit:flyback_converter')
n('motor_drives','Motor drives','concept','induction_motor rectifiers_inverters','Controlling speed and torque electronically.',
  'A drive turns fixed mains into variable-frequency variable-voltage power, so motors run at any speed efficiently.',
  'V/f control for simple loads; field-oriented control for high performance.',
  'FOC decouples torque and flux through Clarke/Park transforms; encoders or sensorless estimation; regenerative braking.',
  lab='field:rotating_field')
n('power_semiconductors','Power semiconductors: IGBT, SiC, GaN','component','mosfet_switch_node pn_junction_physics','Switches for kilowatts and above.',
  'Power MOSFETs, IGBTs and wide-band-gap SiC and GaN devices handle high voltage and current with low loss.',
  'IGBT: MOS gate with BJT conduction for 600 V–6.5 kV; SiC MOSFET and GaN HEMT switch faster with lower loss.',
  'Wide band gap raises breakdown field (SiC 2.8 MV/cm vs Si 0.3), allowing thinner drift layers; figure of merit R_on·Q_g; thermal limits and packaging.',
  f='V_BR ∝ E_crit²', lab='device:pn_breakdown')
save('ee_power')

area('ee_labs')
n('oscilloscope','Oscilloscope','tool','sinusoids_ac','See voltages vs time.',
  'The oscilloscope plots voltage against time, showing waveform shape, amplitude and frequency.',
  'Key controls: timebase, volts/div, trigger. Use a 10× probe with proper compensation.',
  'Bandwidth ≥5× signal; rise time t_r=0.35/BW; sample rate vs memory depth; probe loading C≈10 pF; ground lead inductance causes ringing.',
  f='t_r ≈ 0.35/BW', lab='signal:scope_panel')
n('multimeter','Multimeter','tool','ohms_law_node','Measure V, I and R.',
  'A multimeter measures voltage, current and resistance; always connect it correctly (current meters in series, voltmeters in parallel).',
  'Meters have finite input resistance (10 MΩ) that can load high-impedance circuits.',
  'True-RMS vs average-responding; CAT safety ratings; accuracy in % of reading + digits; four-wire resistance measurements.',
  lab='circuit:ohms_law')
n('function_generator','Function generator','tool','sinusoids_ac','Create test signals.',
  'Produces sine, square, triangle and pulse signals at set frequency and amplitude.',
  'Output impedance is usually 50 Ω, which affects the load voltage unless matched.',
  'Direct digital synthesis, phase accumulator, frequency resolution f_clk/2ᴺ; arbitrary waveforms.',
  lab='signal:signal_builder')
n('bench_power_supply','Bench power supply','tool','ohms_law_node','Adjustable DC power.',
  'A bench supply gives adjustable voltage with a current limit to protect circuits.',
  'Set the current limit before connecting; constant-voltage vs constant-current modes.',
  'Linear vs switching; remote sense; programmable supplies; ripple and load regulation specs.',
  lab='circuit:ohms_law')
n('logic_analyzer','Logic analyzer','tool','timing_analysis','See many digital lines at once.',
  'Captures dozens of digital channels and shows timing diagrams; decodes buses such as I²C and SPI.',
  'Trigger on patterns; sample rate must exceed the fastest edges.',
  'State vs timing mode; setup/hold checks; threshold selection; protocol decoders.',
  lab='code:serial_decoder')
n('spectrum_analyzer','Spectrum analyzer','tool','fourier_transform_ee','See signals in frequency.',
  'Shows signal strength vs frequency, revealing carriers, harmonics and noise.',
  'Resolution bandwidth sets frequency detail and noise floor; swept or FFT-based.',
  'Dynamic range, displayed average noise level, phase noise; VNAs measure S-parameters with a source and receivers.',
  lab='signal:spectrum_analyzer')
n('breadboarding','Breadboarding','technique','','Building circuits without solder.',
  'A solderless breadboard connects parts through spring contacts in rows; wires link them.',
  'Good for low-frequency prototypes; avoid for high-speed or RF because of stray capacitance.',
  'Contact resistance, ~2–10 pF between rows, power rail splits; ground discipline; modular dev boards.')
n('soldering','Soldering','technique','','Joining parts permanently.',
  'A hot iron melts solder that wets the pad and lead, forming a metal bond.',
  'Heat both pad and lead; use flux; shiny, concave joint is good. Wear eye protection and ventilate.',
  'Leaded (Sn63/Pb37 183 °C) vs lead-free SAC305 (217 °C); reflow profiles, tombstoning, cold joints; ESD-safe handling.')
n('troubleshooting','Troubleshooting','technique','multimeter oscilloscope','Finding what is wrong.',
  'Check power first, then signals stage by stage; compare against expectations; change one thing at a time.',
  'Divide and conquer; look at the simplest causes first; document each test.',
  'Half-split method; injecting known signals; thermal imaging; comparing with a known-good board.')
n('pcb_design','PCB design: schematic capture, layout, manufacturing files','technique','breadboarding transmission_lines','From schematic to board.',
  'Draw the schematic in a tool like KiCad, assign footprints, place parts, route traces, and export Gerber files for the manufacturer.',
  'Design rules (trace width, spacing), ground planes, decoupling close to ICs, controlled impedance for fast signals.',
  'Stack-up design; return-path continuity; differential pairs; DFM/DFA; IPC-2221 current capacity; ERC/DRC checks.',
  x='KiCad documentation|https://docs.kicad.org/', lab='field:pcb_traces')
n('lab_reports_data','Lab reports and data analysis','technique','error_analysis','Communicating results.',
  'A good lab report states purpose, method, data, analysis and conclusion so others can reproduce it.',
  'Plot data with error bars; compare measurement with theory and explain differences.',
  'Uncertainty budgets per GUM; propagation; fitting with confidence intervals; reproducibility.',
  r='IST:2.8 IST:8.1')
n('measurement_error','Measurement error and uncertainty','concept','error_analysis expectation_variance','No measurement is exact.',
  'Every instrument has accuracy limits; repeated readings reveal random scatter, calibration reveals bias.',
  'Quote results with uncertainty; combine independent errors in quadrature.',
  'Type A vs type B uncertainty; u_c=√Σ(∂f/∂xᵢ uᵢ)²; resolution vs accuracy; traceability to SI.',
  f='u_c = √Σ(∂f/∂xᵢ·uᵢ)²', r='UP1:1.6')
n('lab_electrical_safety','Lab and electrical safety','concept','electrical_basics','Respect energy.',
  'Mains voltage can kill; currents of ~10 mA through the body cause muscle lock and ~100 mA can stop the heart.',
  'Use isolated supplies, GFCI protection, one hand rule for high voltage, and discharge capacitors before touching.',
  'Body resistance 1 kΩ–100 kΩ depending on skin; arc-flash energy; lockout–tagout; lithium battery hazards; laser safety classes.',
  r='UP2:10.6 CPH:20.6 CPH:23.8')
save('ee_labs')
