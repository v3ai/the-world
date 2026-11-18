from lib import *
area('ee_electives')
n('rf_amplifiers','RF and microwave amplifiers','technique','s_parameters_rf impedance_matching bjt_amplifiers','Boosting radio signals.',
  'RF amplifiers boost weak antenna signals (LNAs) or drive antennas (power amplifiers) with matching networks at both ends.',
  'LNAs trade low noise figure for gain; PAs trade efficiency for linearity (Class AB, Doherty).',
  'Stability factors K and Δ; noise figure circles; 1-dB compression, IP3; PA efficiency η=P_out/P_DC; envelope tracking.',
  lab='field:smith_chart')
n('s_parameters_rf','S-parameters','concept','two_port_networks transmission_lines','Reflection and transmission of waves at ports.',
  'S-parameters describe how much of a wave entering a port reflects or passes through to another, measured with a network analyzer.',
  'S11 is input reflection (match), S21 is gain or insertion loss.',
  'b=S a with reference impedance Z₀=50 Ω; cascade via T-parameters; passivity |S|≤1; de-embedding fixtures; Touchstone file format.',
  f='b = S a', lab='field:smith_chart', x=wp('Scattering_parameters'))
n('rf_mixers_filters','Mixers and RF filters','component','s_parameters_rf modulation_basics','Shifting frequency; selecting bands.',
  'A mixer multiplies two signals, producing sum and difference frequencies that shift a band to a different carrier; filters pick the wanted band.',
  'Superheterodyne receivers mix down to a fixed IF where filtering is easy; image rejection matters.',
  'Conversion gain, LO leakage, double-balanced Gilbert cell; SAW/BAW/ceramic filters in phones; direct-conversion and zero-IF issues (DC offset, I/Q mismatch).',
  f='f_IF = |f_RF − f_LO|', lab='signal:mixer_spectrum')
n('vlsi_digital_cmos','VLSI digital CMOS design','concept','cmos_logic_gates hdl_design_flow short_channel_effects','Billions of gates on one die.',
  'VLSI design builds chips from standard cells synthesised from HDL, placed and routed by tools.',
  'Flow: RTL → logic synthesis → floorplan → place → clock tree → route → timing signoff → tape-out.',
  'Power, performance, area (PPA) trade-offs; clock gating; multi-Vt cells; interconnect RC dominates delay; design-for-test (scan chains).',
  lab='device:cmos_vtc')
n('vlsi_analog_ic','Analog IC design','concept','differential_amp current_mirror active_load opamp_nonideal','Amplifiers, references and converters on silicon.',
  'Analog ICs use transistor matching and feedback to make precise circuits; layout symmetry is part of the design.',
  'Bandgap references, op-amps, PLLs, ADCs; gm/Id methodology.',
  'Bandgap V_BG≈1.2 V = V_BE + k·V_T cancelling temperature; matching σ(ΔV_T)=A_VT/√(WL); noise/power/speed triangle.',
  lab='circuit:common_emitter')
n('ic_layout_verification','IC layout and verification','technique','vlsi_digital_cmos fabrication_overview','Drawing the masks and proving them right.',
  'Layout draws the polygons of each mask; verification (DRC, LVS) checks rules and that layout matches the schematic.',
  'Parasitic extraction reveals resistances and capacitances that slow real chips.',
  'Process design kit (PDK); antenna rule; electromigration and IR drop checks; OPC for lithography; formal equivalence; GDSII.',
  lab='device:fab_process')
n('fiber_optics_photonics','Fibre optics','device','reflection_refraction optoelectronic_devices','Light in glass threads.',
  'Light guided by total internal reflection in glass fibre carries most of the world’s long-distance data.',
  'Single-mode fibre has ~0.2 dB/km loss at 1550 nm; erbium amplifiers and wavelength-division multiplexing raise capacity.',
  'Core 9 µm; dispersion D≈17 ps/(nm·km); coherent detection and DSP compensate impairments; capacity limits near Shannon (~100 Tb/s per fibre).',
  lab='field:wave_boundary', kn='fiber_optics')
n('photonic_integrated_circuits','Photonics and lasers','concept','lasers_semiconductor fiber_optics_photonics','Using light for signals and sensing.',
  'Photonic chips guide light on silicon for data links and sensors; lasers provide coherent sources.',
  'Silicon photonics reuses CMOS fabs; modulators, waveguides, ring resonators, Ge photodetectors.',
  'Mach–Zehnder modulator V_π; ring resonator FSR=λ²/(n_g L); co-packaged optics for datacentres; LiDAR with FMCW.',
  c='C2', oq=['Can on-chip lasers be integrated cheaply in silicon at scale?'], kn='led_lasers')
n('wireless_5g6g','Wireless communications: 5G and 6G','concept','digital_modulation wireless_channels_fading multiplexing_access','Mobile networks.',
  '5G uses wider bandwidths, millimetre waves and massive antenna arrays; 6G research aims at sub-THz bands and AI-native networks.',
  'NR air interface uses OFDM with flexible numerology; slicing and edge computing serve latency-sensitive services.',
  '5G NR: 410 MHz–7.125 GHz (FR1) and 24–52 GHz (FR2); 6G targets (≈2030) not yet standardised: THz links, integrated sensing and communication, reconfigurable intelligent surfaces.',
  c='C2', oq=['Which 6G spectrum and architecture will be standardised?','Are sub-THz links practical outdoors?'], kn='radio_comm')
n('mimo_beamforming','MIMO and beamforming','technique','antenna_arrays wireless_channels_fading matrix_decompositions','Many antennas, more capacity.',
  'Using several antennas at both ends sends parallel data streams over the same spectrum.',
  'Capacity grows roughly with min(Nt,Nr) in rich scattering; beamforming focuses energy on users.',
  'SVD of channel H splits into parallel eigenchannels; C=Σlog₂(1+σᵢ²P/N₀); massive MIMO exploits channel hardening; precoding (ZF, MMSE).',
  f='C = Σ log₂(1 + σᵢ² P/N₀)', lab='network:mimo_capacity')
n('radar_systems','Radar','concept','antenna_fundamentals dsp_applications','Seeing with radio.',
  'Radar sends a pulse and measures the echo’s delay (range) and Doppler shift (speed).',
  'Radar equation gives detection range; pulse compression improves resolution; automotive radars use FMCW at 77 GHz.',
  'R=cτ/2; Doppler f_d=2v/λ; P_r=P_tG²λ²σ/((4π)³R⁴); CFAR detection; synthetic aperture imaging.',
  f='R = cτ/2;  f_d = 2v/λ', lab='signal:radar_range_doppler')
n('robotics_mechatronics','Robotics and mechatronics','concept','pid_controller interfacing_motors state_space','Machines that sense, think and move.',
  'Robots combine sensors, actuators, electronics and control software.',
  'Kinematics, motor control, sensor fusion, path planning.',
  'Jacobian-based inverse kinematics; SLAM; trajectory optimisation; torque control and impedance control.',
  lab='control:mass_spring_damper')
n('machine_learning_engineers','Machine learning and AI for engineers','concept','estimation_theory matrix_decompositions algorithms_complexity','Learning models from data.',
  'ML fits models to data; engineers use it for signal classification, predictive maintenance and control.',
  'Regression, classification, neural networks, training by gradient descent; careful validation avoids overfitting.',
  'Backpropagation; CNNs/transformers; quantisation to int8; edge AI on microcontrollers (TinyML); data-centre accelerators dominated by matrix multiply energy.',
  r='DSC:6.1 DSC:7.1 DSC:7.2', kn='neural_nets', lab='code:python_sandbox')
n('neural_accelerator_hw','AI accelerators','device','machine_learning_engineers memory_hierarchy','Hardware for matrix multiplication.',
  'GPUs, TPUs and NPUs have thousands of multiply–accumulate units and wide memory links to run neural networks efficiently.',
  'Energy is dominated by moving data, not arithmetic; systolic arrays minimise it.',
  'Roofline model; int8/FP8 formats; HBM bandwidth ~1–3 TB/s; sparsity; in-memory computing proposals.',
  lab='code:cache_sim')
n('image_video_processing','Image and video processing','concept','dtft_dft','Pixels as 2D signals.',
  'Images are 2D arrays; filters blur, sharpen and find edges; video exploits similarity between frames.',
  'JPEG uses the DCT; H.264/AV1 add motion compensation.',
  '2D convolution and separable kernels; demosaicing; Canny edges; DCT energy compaction; rate–distortion.',
  lab='signal:image_filter')
n('biomedical_instrumentation','Biomedical instrumentation: ECG, EEG, sensors','concept','instrumentation_amp active_filters noise_modeling','Measuring the body.',
  'Electrodes pick up microvolt-to-millivolt signals from heart and brain; amplifiers must reject mains hum and motion noise.',
  'ECG ~1 mV, EEG ~10–100 µV; differential amplification, filtering 0.05–150 Hz, isolation for safety.',
  'Right-leg drive reduces common-mode; electrode half-cell potentials; patient leakage <10 µA; IEC 60601; pulse oximetry uses two wavelengths.',
  kn='action_potential medical_imaging', r='CPH:20.7')
n('medical_devices','Medical devices','device','biomedical_instrumentation','Pacemakers, imaging and more.',
  'Devices like pacemakers, defibrillators, and MRI scanners rely on precise electronics under strict safety rules.',
  'Regulatory classes and risk analysis shape design; MRI uses RF coils and gradient amplifiers.',
  'Defibrillator: ~200 J biphasic shock; pacemaker µW-level power for >10 years; MRI RF at 42.58 MHz/T for protons.',
  kn='mri_tech medical_imaging')
n('solar_pv_systems','Solar photovoltaic systems','concept','photodetectors_solar rectifiers_inverters','Sunlight to grid.',
  'PV panels produce DC; inverters convert it to AC, and MPPT electronics extract the most power.',
  'Panel I–V curve has a knee; maximum power point shifts with light and temperature.',
  'MPPT via perturb-and-observe; module efficiency 20–24%; PR (performance ratio); string vs micro-inverters; bypass diodes.',
  lab='device:solar_cell', kn='solar_cells energy_systems')
n('wind_energy_systems','Wind energy','concept','synchronous_machines rectifiers_inverters','Turbines and converters.',
  'Wind turns blades connected to a generator; power electronics adapt variable speed to a fixed grid frequency.',
  'Power ∝ v³; Betz limit 59% of wind’s kinetic power.',
  'P=½ρAv³C_p; DFIG vs full-converter machines; pitch control; capacity factors 30–55% offshore.',
  f='P = ½ ρ A v³ C_p', kn='energy_systems')
n('battery_storage_systems','Battery storage','concept','batteries_electrochem rectifiers_inverters','Storing electricity.',
  'Batteries store energy chemically; battery management systems keep cells within safe voltage, current and temperature.',
  'Li-ion energy density ~150–270 Wh/kg; cycle life 1000–5000; state-of-charge estimation by coulomb counting and Kalman filters.',
  'Equivalent-circuit (Thevenin) models; thermal runaway; sodium-ion and solid-state developments; grid storage economics.',
  kn='batteries_tech')
n('ev_motor_control','Electric vehicles and motor control','concept','motor_drives battery_storage_systems power_semiconductors','EV powertrains.',
  'An EV has a battery pack, inverter and motor; the inverter controls torque, and braking recovers energy.',
  'Permanent-magnet synchronous motors with field-oriented control; 400 V or 800 V pack architectures.',
  'Efficiency maps; SiC inverters cut losses ~70% vs Si IGBTs; onboard charger and DC fast charging (CCS ≤350 kW); thermal management.',
  kn='electric_motors batteries_tech')
n('nanotech_mems','Nanotechnology and MEMS','device','crystal_structure_ee fabrication_overview','Machines at micrometre scale.',
  'MEMS are tiny mechanical structures etched in silicon that sense motion, pressure or sound, such as phone accelerometers and microphones.',
  'A proof mass on springs shifts a capacitance when accelerated; readout electronics convert it to voltage.',
  'Capacitive sensing ΔC/C; gyroscopes use Coriolis coupling between vibration modes; scaling laws favour surface forces; nanomaterials (graphene, nanowires, 2D semiconductors).',
  f='ΔC ∝ Δd/d', scale=0.001, lab='field:mems_accelerometer')
n('quantum_computing_hardware','Quantum engineering and quantum computing hardware','device','quantum_intro oscillators_ee fabrication_overview','Engineering qubits.',
  'Quantum computers use qubits (superconducting circuits, trapped ions, spins in silicon, photons) that can be in superpositions; hardware is cooled and shielded to preserve fragile states.',
  'Superconducting qubits operate at ~10 mK; gate fidelities of 99.5–99.9%; error correction needs thousands of physical qubits per logical qubit.',
  'Coherence times T₁,T₂ from µs to ms (superconducting) to seconds (ions); surface codes with threshold ≈1%; scaling bottlenecks: wiring, cryo-electronics, fabrication yield.',
  c='C3', oq=['Which qubit platform will scale to fault-tolerant machines?','Can error-correction overhead be reduced enough for practical applications?'],
  kn='quantum_computing entanglement decoherence', lab='code:qubit_bloch')
n('computer_networks_iot','Computer networks and the Internet of Things','concept','networking_osi_tcpip low_power_design interfacing_sensors','Billions of connected devices.',
  'IoT devices sense and communicate over Wi-Fi, Bluetooth Low Energy, LoRa or cellular, usually on batteries.',
  'Protocols such as MQTT, CoAP; trade-off between range, data rate and power.',
  'LoRa sensitivity −137 dBm; BLE connection events; over-the-air updates; edge computing; device identity and lifecycle management.',
  lab='network:packet_flow')
n('hardware_security','Hardware security','concept','memory_rom_ram cache_memory number_systems','Trust in chips.',
  'Chips can leak secrets through power use, timing or electromagnetic emissions; secure designs protect keys.',
  'Secure boot, hardware roots of trust, physically unclonable functions (PUFs), tamper resistance.',
  'Side-channel attacks (DPA, timing), fault injection, Spectre-class microarchitectural leaks, hardware trojans, supply-chain verification.',
  c='C2', oq=['How can speculative-execution leaks be eliminated without large performance losses?'], lab='code:timing_leak_demo')
save('ee_electives')
