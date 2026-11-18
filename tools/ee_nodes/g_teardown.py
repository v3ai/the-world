from lib import *
area('ee_teardown')
def T(id,title,kind,parent,at,label,scale,summary,basics,deeper,expert,needs='',area_=None,par=None,**kw):
    if area_: area(area_)
    hs=(parent,at,label) if parent else None
    p = par if par is not None else (parent if parent else 'electrical_engineering')
    if parent and parent not in p.split(): p = parent + ' ' + p
    n(id,title,kind,needs,summary,basics,deeper,expert,par=p,tmpl='teardown',scale=scale,hs=hs,**kw)
    if area_: area('ee_teardown')

# ---- smartphone ----
T('smartphone','Smartphone','device',None,None,None,0.147,'A pocket computer, radio, camera and sensor suite.',
  'A smartphone packs a screen, battery, a main circuit board with the processor and radios, a camera, speaker, and sensors into a slab 7 mm thick.',
  'Most of the volume is battery and display; the circuit board is only about the size of a few postage stamps, folded into layers to save area.',
  'Typical flagship: 6.1-inch OLED, 4,000–5,000 mAh (≈15–19 Wh) Li-ion cell, 3-nm-class SoC with ~15–20 billion transistors, multiple RF bands from 600 MHz to 6 GHz plus mmWave, ~7–8 mm thick, ~170–200 g.',
  fa=[('Size','≈ 71.5 × 147 × 7.8 mm'),('Battery','≈ 15–19 Wh'),('Transistors in SoC','≈ 10¹⁰ – 2×10¹⁰')],
  d='A modern phone has more computing power than the computers that guided the Apollo missions, by factors of millions.',
  proc='how_a_phone_charges how_a_photo_is_taken how_wifi_sends_data how_touchscreen_senses', kn='electronics_logic')
T('phone_display','Display (OLED)','component','smartphone',[0,0.0,0.0033],'Display panel',0.14,'An array of millions of light-emitting pixels.',
  'The screen is a grid of tiny coloured light sources, each controlled by its own transistor.',
  'OLED pixels emit light when current flows through organic layers; a thin-film transistor backplane switches each pixel row by row.',
  'AMOLED: LTPO TFT backplane, 120 Hz adaptive refresh; PWM dimming at ≥240 Hz; MIPI DSI link at several Gb/s; sub-pixel layouts (PenTile).',
  needs='led_photodiode optoelectronic_devices', fa=[('Pixels','≈ 2.5–3 million'),('Peak brightness','≈ 1000–2000 nits')])
T('phone_touchscreen','Touchscreen','component','smartphone',[0,0,0.0037],'Touch sensor layer',0.14,'A transparent grid that senses where fingers are.',
  'A fine grid of transparent electrodes over the display senses the tiny change in electric field when a finger comes near.',
  'Projected-capacitive sensing: a finger adds capacitance at an electrode crossing; a controller scans the grid hundreds of times per second.',
  'Mutual-capacitance Tx/Rx grid ~4–5 mm pitch; ΔC ~ 0.1–1 pF of a ~1–2 pF node; sigma-delta readout, noise rejection near charger frequency; interpolation gives sub-mm position.',
  needs='capacitor_ee electrostatics_dielectrics', proc='how_touchscreen_senses', lab='field:touch_grid')
T('phone_battery','Battery (Li-ion)','component','smartphone',[0,-0.02,-0.0015],'Battery pack',0.07,'Stores about 15–19 Wh of energy.',
  'A lithium-ion pouch cell stores chemical energy that is released as electricity; it takes up half the phone.',
  'Li⁺ ions move between graphite and a lithium-metal-oxide electrode; protection electronics guard against over-charge and heat.',
  'Nominal 3.85 V, up to 4.45 V (high-voltage); energy density ≈ 700 Wh/L; ≈ 500–1000 cycles to 80%; BMS handles cell protection, coulomb counting.',
  needs='battery_storage_systems batteries_electrochem', mol=(), fa=[('Capacity','≈ 4000–5000 mAh'),('Nominal voltage','≈ 3.85 V')], kn='batteries_tech')
T('phone_pcb','Main circuit board (PCB)','structure','smartphone',[0,0.045,-0.0005],'Logic board',0.1,'A multilayer board connecting all chips.',
  'A thin green board whose copper layers connect the processor, memory and radios.',
  'Phone boards have 8–12+ layers with microvias (HDI); stacked boards save area; components are soldered by reflow.',
  'Line/space ≈ 30–40 µm; impedance-controlled traces for LPDDR and MIPI; any-layer HDI; EMI shield cans over RF sections.',
  needs='pcb_design transmission_lines')
T('phone_camera','Camera module','device','smartphone',[-0.018,0.065,-0.003],'Camera module',0.012,'Lens stack plus image sensor.',
  'Several small lenses focus light on a chip of millions of light-sensing pixels.',
  'A CMOS image sensor converts photons to charge in each photodiode; colour filters and processing build a full-colour picture.',
  'Pixel pitch ≈ 0.6–1.4 µm; stacked back-illuminated BSI sensors with ADC per column; OIS voice-coil actuators; MIPI CSI-2 at multiple Gb/s.',
  needs='photodetectors_solar optics_basics', proc='how_a_photo_is_taken', fa=[('Sensor','≈ 12–200 megapixels')])
T('phone_speaker','Speaker','component','smartphone',[0.015,-0.07,0],'Loudspeaker',0.012,'A tiny voice coil moving a membrane.',
  'A coil in a magnetic field moves a thin diaphragm to push air and make sound.',
  'A class-D amplifier drives the coil; the cavity behind it shapes bass response.',
  'Smart-amp with speaker protection (excursion & thermal models); Lorentz force F=B·l·i; MEMS speakers emerging.',
  needs='magnetic_fields_forces output_stages')
T('phone_antenna','Antennas','component','smartphone',[0.0,-0.0725,-0.002],'Antenna',0.05,'Metal parts of the frame act as antennas.',
  'Radio waves go in and out through thin metal strips and gaps in the phone’s frame.',
  'Multiple antennas cover cellular, Wi-Fi, Bluetooth, GPS; tunable matching networks keep each efficient when a hand touches it.',
  'Inverted-F/loop antennas; aperture tuners; MIMO 4×4; mmWave patch arrays in packages with beamforming ICs; SAR limits ≈ 1.6 W/kg (US) / 2.0 W/kg (EU).',
  needs='dipole_antennas antenna_fundamentals')
T('phone_charger_port','USB-C port','component','smartphone',[0,-0.0735,0],'USB-C connector',0.009,'Power and data connector.',
  'A reversible port carries both charging power and data.',
  'CC pins negotiate voltage and current with the charger; high-speed pairs carry data.',
  'USB PD up to 20 V/5 A (100 W) or 48 V/5 A EPR; PPS programmable voltage; 24 pins; e-marker cable ID.',
  needs='usb_protocol', proc='how_a_phone_charges')
T('phone_vibration_motor','Vibration motor (haptics)','component','smartphone',[-0.02,-0.06,-0.002],'Haptic actuator',0.01,'A moving mass shaken by a coil.',
  'A small weight oscillates to make the phone buzz.',
  'Linear resonant actuators (LRA) are driven at their resonance (~170–250 Hz) by a haptic driver.',
  'Resonance f₀=½π√(k/m); drive waveforms tuned for ‘click’ feel; Q and ring-down braking pulses.',
  needs='resonance_q dc_machines')
# ---- PCB parts ----
T('phone_soc','System-on-chip (SoC)','device','phone_pcb',[0,0.015,0.0005],'Application processor',0.012,'The main chip: CPU, GPU, AI engine and more on one die.',
  'One chip contains the processor cores, graphics, AI engine, image processor and memory controllers.',
  'A die of ~100 mm² in a 3–5 nm-class process is stacked under the RAM package.',
  '~10–20 billion transistors; power budget ≈ 5–10 W peak, ≈ 1–3 W sustained; DVFS and thermal throttling manage heat.',
  needs='vlsi_digital_cmos mcu_architecture', fa=[('Die area','≈ 100 mm²'),('Process','≈ 3–5 nm-class')])
T('phone_ram','RAM (LPDDR)','device','phone_pcb',[0,0.015,0.0012],'LPDDR DRAM package',0.012,'Fast working memory.',
  'Short-term memory that holds the apps currently running.',
  'Low-power DRAM stacked on top of the SoC with tiny solder balls to save space.',
  'LPDDR5X up to ≈ 8.5 Gb/s/pin; 8–16 GB; 1T1C cells refreshed every ≈ 32–64 ms.',
  needs='memory_rom_ram')
T('phone_flash','Flash storage (UFS)','device','phone_pcb',[0.015,-0.01,0.0004],'UFS flash',0.012,'Long-term storage that keeps data without power.',
  'Holds your photos, apps and files even when the phone is off.',
  'NAND flash in a package with a controller; talks to the SoC over UFS.',
  '256 GB–1 TB; 3D NAND ≥200 layers; UFS 4.0 ≈ 4 GB/s; wear levelling and ECC in controller.',
  needs='flash_memory')
T('phone_pmic','Power-management IC','component','phone_pcb',[-0.015,-0.005,0.0004],'PMIC',0.004,'Creates every supply voltage the chips need.',
  'Converts battery voltage into many steady voltages, and manages charging.',
  'Contains buck converters, LDOs and a charger; dynamically adjusts voltage to save energy.',
  'Multi-phase buck for SoC core (≈ 0.5–1 V, up to ≈ 10 A), switching 2–5 MHz; separate charger IC (≥ 100 W-class fast charging).',
  needs='buck_converter_node linear_regulators', proc='how_a_phone_charges')
T('phone_rf_frontend','RF front-end','component','phone_pcb',[0.02,-0.03,0.0004],'RF front-end modules',0.006,'Filters, switches and power amplifiers for the radios.',
  'Takes signals from the modem to the antenna and back, filtering out other bands.',
  'Power amplifiers boost transmit; low-noise amps boost receive; BAW/SAW filters pick bands.',
  'PA efficiency ≈ 40–50% at 3 dB back-off; envelope tracking; antenna tuners; dozens of filters for ≥ 30 bands.',
  needs='rf_amplifiers rf_mixers_filters', proc='how_wifi_sends_data')
T('phone_modem','Cellular modem','component','phone_pcb',[-0.012,0.03,0.0004],'5G modem',0.01,'Turns bits into radio waveforms and back.',
  'The cellular modem handles the 4G/5G signal, from coding to modulation.',
  'It does OFDM, MIMO processing and error correction using dedicated hardware.',
  'Multi-Gb/s peak rates; carrier aggregation; LDPC/polar decoders; beam management for mmWave.',
  needs='wireless_5g6g mimo_beamforming error_correcting_codes')
T('phone_wifi_bt','Wi-Fi and Bluetooth chip','component','phone_pcb',[0.018,0.03,0.0004],'Wi-Fi/BT combo',0.004,'Short-range radios.',
  'Connects to Wi-Fi routers, headphones and watches.',
  'Wi-Fi uses OFDM in 2.4/5/6 GHz bands; Bluetooth uses frequency-hopping GFSK or π/4-DQPSK.',
  'Wi-Fi 6E/7 up to 4096-QAM and 320 MHz channels; BLE LE Audio; coexistence arbitration between radios.',
  needs='digital_modulation networking_osi_tcpip', proc='how_wifi_sends_data')
T('phone_sensors','Motion sensors (MEMS)','component','phone_pcb',[-0.02,-0.03,0.0004],'IMU',0.003,'Accelerometer and gyroscope.',
  'Tiny silicon structures sense acceleration and rotation, so the screen can rotate and games can use tilt.',
  'A suspended mass changes capacitance when accelerated; gyros use vibrating structures and Coriolis force.',
  'Typical noise density ≈ 100 µg/√Hz; ±16 g range; gyro bias stability °/h; fused with magnetometer and barometer by the SoC.',
  needs='nanotech_mems interfacing_sensors', lab='field:mems_accelerometer')
T('phone_passives','Passive components','component','phone_pcb',[0.0,-0.02,0.0004],'Capacitors, inductors, resistors',0.0006,'Tens of billions made each year, hundreds per phone.',
  'Hundreds of tiny capacitors, inductors and resistors smooth power and filter signals.',
  'Most are surface-mount parts as small as 0.4×0.2 mm; ceramic capacitors decouple supply noise near chips.',
  'MLCC capacitance falls with DC bias (up to −80%); inductors in DC-DC converters (≈ 0.47 µH); a phone has ~1000 MLCCs.',
  needs='capacitor_ee inductor_ee ohms_law_node', fa=[('Passives per phone','≈ 800–1000')])
T('phone_crystal_osc','Crystal oscillator','component','phone_pcb',[-0.02,0.01,0.0004],'Crystal / timing',0.0016,'A quartz heartbeat.',
  'A tiny quartz crystal vibrates at a very precise frequency, giving every chip a reliable time reference.',
  'The SoC’s 38.4/19.2 MHz clock and a 32.768 kHz real-time clock both use crystals.',
  'Series-resonant quartz with Q ≈ 10⁴–10⁶; ±10 ppm typical, TCXO ±0.5 ppm; PLLs multiply it to GHz.',
  needs='oscillators_ee resonance_q')
# ---- SoC parts ----
T('soc_cpu_cluster','CPU cluster','structure','phone_soc',[-0.002,0.002,0],'CPU cores',0.003,'A group of processor cores with shared cache.',
  'The part of the chip that runs your apps, with a few fast cores and some power-saving cores.',
  'Big.LITTLE style: performance and efficiency cores share a cache and swap work to save battery.',
  '1+3+4 layouts; shared L3 ≈ 8–12 MB; DVFS per cluster; ≈ 3–4 GHz peak.',
  needs='pipelining_hazards cache_memory')
T('soc_gpu','GPU','structure','phone_soc',[0.002,0.002,0],'Graphics processor',0.004,'Thousands of simple units for graphics.',
  'Draws the pixels of games and the interface by doing many simple calculations in parallel.',
  'Shader cores execute the same program on many pixels; tile-based rendering saves bandwidth.',
  '≈ 1–2 TFLOPS FP32; ray-tracing units; shared LPDDR memory.',
  needs='neural_accelerator_hw alu_design')
T('soc_npu','Neural engine (NPU)','structure','phone_soc',[0.003,-0.002,0],'NPU',0.002,'Matrix-multiply hardware for AI.',
  'Specialised circuits run neural networks for photos, voice and text efficiently.',
  'Arrays of multiply–accumulate units with local SRAM reduce memory traffic.',
  '≈ 15–50+ TOPS INT8; ≈ 10 TOPS/W; supports int8/FP16.',
  needs='neural_accelerator_hw machine_learning_engineers')
T('soc_cache','System cache','structure','phone_soc',[0,-0.001,0],'SLC cache',0.002,'Shared SRAM near the cores.',
  'Fast memory on the chip that keeps recently used data close.',
  'Last-level cache shared by CPU, GPU and NPU cuts expensive trips to DRAM.',
  '≈ 8–32 MB SRAM; ≈ 10–30 ns; hit rates determine battery life as DRAM access costs ≈ 100× the energy of a cache hit.',
  needs='cache_memory memory_hierarchy')
T('soc_memory_controller','Memory controller','component','phone_soc',[-0.003,-0.003,0],'LPDDR controller',0.001,'Talks to DRAM.',
  'Schedules reads and writes to the RAM chip.',
  'Reorders requests to keep DRAM rows open and bus busy.',
  '64-bit LPDDR5X interface ≈ 60–100 GB/s; training and calibration of PHY at boot.',
  needs='memory_rom_ram memory_hierarchy')
T('soc_isp','Image signal processor','structure','phone_soc',[0.0035,0.0035,0],'ISP',0.002,'Turns raw sensor data into photos.',
  'Hardware that cleans up raw camera data: removes noise, fixes colour, and stitches HDR.',
  'Pipeline: demosaic, denoise, white balance, tone map, sharpen; runs at video rates with low power.',
  '≥ 4–6 Gpixel/s; multi-frame fusion with NPU; local tone mapping.',
  needs='image_video_processing dsp_applications', proc='how_a_photo_is_taken')
T('soc_interconnect','On-chip interconnect','component','phone_soc',[0,0,0],'Network-on-chip',0.0005,'A tiny network joining the blocks.',
  'Wires and switches that let the processor, GPU and memory talk to each other.',
  'Packet-switched networks-on-chip with quality-of-service for real-time blocks.',
  'AMBA AXI/CHI coherence; ≈ TB/s aggregate; arbitration and power gating of idle blocks.',
  needs='memory_hierarchy')
# ---- CPU core ----
T('cpu_core','CPU core','structure','soc_cpu_cluster',[0,0,0],'One core',0.0015,'One processor core: fetch, decode, execute.',
  'A single core executes instructions one after another, but many at once inside via pipelining.',
  'Out-of-order superscalar cores decode 6–8 instructions per cycle and track hundreds in flight.',
  'ARMv9-A; ROB ≈ 500 entries; ≈ 6–10 execution ports; L1 64 KB; IPC ≈ 4–8 on favourable code.',
  needs='pipelining_hazards isa_risc_cisc', proc='instruction_execution')
T('core_fetch','Instruction fetch','component','cpu_core',[-0.0005,0.0005,0],'Fetch',0.0003,'Reads the next instructions.',
  'Pulls the next instructions from memory using the program counter.',
  'Fetches several instructions per cycle from the instruction cache.',
  'Fetch width 8–16 bytes; uop cache; next-line prefetch; steered by branch predictor.',
  needs='datapath_control cache_memory', proc='instruction_execution')
T('core_decode','Instruction decode','component','cpu_core',[0,0.0005,0],'Decode',0.0003,'Understands each instruction.',
  'Works out what each instruction means: which operation and which registers.',
  'Breaks into micro-operations and renames registers to find parallelism.',
  'Register renaming removes WAR/WAW hazards; decode width up to 8; macro-op fusion.',
  needs='datapath_control assembly_language', proc='instruction_execution')
T('core_alu','Arithmetic logic unit','component','cpu_core',[0.0004,-0.0003,0],'ALU',0.0003,'Does the arithmetic and logic.',
  'Adds, subtracts, compares and shifts numbers.',
  'Several ALUs per core operate in parallel; each is built from adders and multiplexers.',
  '64-bit ALU ≈ 1 cycle (≈ 250–300 ps); Kogge–Stone adder in the critical path; separate multiply/divide units.',
  needs='alu_design', proc='instruction_execution')
T('core_registers','Register file','component','cpu_core',[-0.0004,-0.0003,0],'Registers',0.0003,'Fastest storage in the machine.',
  'A few dozen super-fast storage slots that hold the numbers being worked on.',
  'Multi-ported SRAM allowing many reads/writes each cycle.',
  '31 architectural 64-bit registers (ARMv8) mapped to ≈ 300+ physical; ≈ 10 read ports.',
  needs='registers_counters', proc='instruction_execution')
T('core_l1_cache','L1 cache','component','cpu_core',[0,-0.0006,0],'L1 caches',0.0003,'The nearest memory.',
  'A small, extremely quick memory holding the data and instructions in current use.',
  'Split instruction and data caches; ≈ 3–4 cycle latency.',
  '64–192 KB each; 4–12 way set-associative; VIPT; ≈ 95–99% hit rate typically.',
  needs='cache_memory', proc='instruction_execution')
T('core_branch_predictor','Branch predictor','component','cpu_core',[-0.0006,0.0006,0],'Branch predictor',0.0002,'Guesses where the program goes next.',
  'Guesses which way an if-statement will go so the pipeline stays full.',
  'Uses history of past branches; wrong guesses flush work (≈ 15–20 cycle penalty).',
  'TAGE-like predictors with ≥ 95–99% accuracy; BTB, return-address stack; speculation side channels (Spectre).',
  needs='pipelining_hazards', proc='instruction_execution')
T('core_pipeline','Pipeline','structure','cpu_core',[0,0,0],'Pipeline stages',0.001,'An assembly line for instructions.',
  'Instructions pass through stages so several are in progress at once.',
  'Fetch, decode, rename, issue, execute, memory, retire; hazards cause stalls.',
  '≈ 12–15 stages; out-of-order issue, in-order retire; ROB ensures precise exceptions.',
  needs='pipelining_hazards', proc='instruction_execution')
# ---- logic chain (areas span syllabus) ----
T('logic_adder','Full adder','structure','core_alu',[0,0,0],'Full adder cell',1e-5,'Adds three bits.',
  'A full adder adds two bits plus a carry from the previous column; 64 of them (cleverly connected) make a 64-bit adder.',
  'It uses XOR and AND/OR gates: sum = A⊕B⊕Cin, carry = AB+Cin(A⊕B).',
  'About 28 transistors in static CMOS (mirror adder); prefix trees hide the carry delay.',
  needs='adders_arithmetic', area_='ee_digital', par='core_alu ee_digital', f='S = A⊕B⊕Cin;  Cout = AB + Cin(A⊕B)', lab='logic:adder_builder')
T('logic_gate_nand','NAND gate','component','logic_adder',[0,0,0],'NAND gate',1e-6,'The universal building block.',
  'A NAND outputs 0 only when both inputs are 1. Every other logic function can be built from NANDs.',
  'In CMOS, two PMOS in parallel on top, two NMOS in series on the bottom.',
  'Logical effort of NAND2 = 4/3; delay ≈ 10–20 ps in advanced nodes; layout uses shared diffusion.',
  needs='logic_gates cmos_logic_gates', area_='ee_digital', par='logic_adder ee_digital', lab='device:cmos_nand')
T('cmos_inverter','CMOS inverter','component','logic_gate_nand',[0,0,0],'Inverter',5e-7,'One PMOS and one NMOS: the heart of digital chips.',
  'When the input is high the NMOS conducts and pulls the output low; when low the PMOS pulls it high. Hardly any current flows between switches.',
  'Voltage transfer curve is very steep around V_DD/2, giving high gain that restores digital levels.',
  'Switching energy ≈ C V_DD²; short-circuit current during transitions; V_M=(V_DD−|V_Tp|+r V_Tn)/(1+r); leakage grows as V_T falls.',
  needs='cmos_logic_gates mosfet_switch_node', area_='ee_electronics', par='logic_gate_nand ee_electronics', lab='circuit:cmos_inverter', f='E_sw ≈ C·V_DD²')
T('finfet_transistor','FinFET transistor','component','cmos_inverter',[0,0,0],'FinFET',1e-7,'A transistor shaped like a fin.',
  'The channel is a thin vertical fin of silicon with the gate wrapping around three sides for better control.',
  'Wrapped gates reduce leakage at short channel lengths; designers pick the number of fins for drive strength.',
  'Fin pitch ≈ 25–30 nm, fin width ≈ 5–7 nm, gate pitch ≈ 45–55 nm; successors: gate-all-around nanosheets from the ≈ 3-nm era.',
  needs='short_channel_effects mosfet_physics_deep', area_='ee_devices', par='cmos_inverter ee_devices', lab='device:finfet')
T('silicon_channel','Silicon channel','structure','finfet_transistor',[0,0,0],'Silicon channel',1e-8,'A few nanometres of crystalline silicon.',
  'The part of the transistor where current actually flows is a sliver of near-perfect silicon crystal.',
  'Doped source and drain on both ends, an undoped channel between; the gate oxide just a few atoms thick.',
  'Si diamond lattice a=0.543 nm; channel width ≈ 5–7 nm ≈ 10–13 lattice cells; strain engineering (SiGe) lifts hole mobility.',
  needs='crystal_structure_ee doping_pn_material', area_='ee_devices', par='finfet_transistor ee_devices', made='silicon', mol=(), lab='device:bands_formation', kn='crystal_lattices band_theory')

# ---- charger ----
T('usb_c_charger','USB-C wall charger','device',None,None,None,0.04,'A mains-to-5–20 V converter in the size of a matchbox.',
  'The charger turns 120/230 V AC mains into low-voltage DC, using a high-frequency switching converter instead of a heavy transformer.',
  'The chain: mains rectifier → switching MOSFET chopping at 50–150 kHz → small flyback transformer for isolation → optocoupler feedback → output stage.',
  'GaN-based chargers reach ≈ 95% efficiency at 65–140 W with power density ≈ 1 W/cm³; USB-PD chip negotiates voltage over CC wire; QR (quasi-resonant) flyback or ACF topologies.',
  needs='smps_switching_supplies usb_protocol', par='electrical_engineering', proc='how_a_phone_charges', area_='ee_teardown')
T('rectifier_bridge','Bridge rectifier','component','usb_c_charger',[-0.008,0.008,0],'Bridge rectifier',0.005,'Four diodes that flip AC into pulsating DC.',
  'The bridge makes both halves of the AC wave flow the same way; a big capacitor smooths it into ~325 V DC.',
  'Four diodes conduct in pairs; the bulk capacitor sets ripple.',
  'V_pk=√2·V_rms; bulk capacitor ripple ≈ I/(2fC); inrush limiter (NTC).',
  needs='rectifiers', lab='circuit:bridge_rectifier')
T('flyback_transformer','Flyback transformer','component','usb_c_charger',[0.004,0,0],'Flyback transformer',0.015,'Stores then releases energy; isolates mains.',
  'A coupled inductor that stores energy while the switch is on and delivers it to the output when off, keeping the output electrically isolated from the mains.',
  'Primary-to-secondary insulation withstands >3 kV for safety; gapped ferrite core stores the energy.',
  'Energy per cycle ½L_pI_pk²; turns ratio sets reflected voltage; leakage inductance spikes need snubbers; triple-insulated wire.',
  needs='power_transformers smps_switching_supplies', lab='circuit:flyback_converter')
T('switching_mosfet','Switching MOSFET (primary)','component','usb_c_charger',[-0.004,-0.006,0],'Primary switch',0.008,'Chops the high-voltage DC.',
  'A fast transistor turns the high-voltage DC on and off tens of thousands of times a second.',
  'Gate driver from controller IC; GaN HEMTs switch faster with lower losses.',
  '650 V rating; R_DS(on) ≈ 100–500 mΩ; switching loss ∝ f; valley switching reduces loss.',
  needs='mosfet_switch_node power_semiconductors', lab='circuit:mosfet_switch')
T('feedback_optocoupler','Feedback optocoupler','component','usb_c_charger',[0.008,-0.008,0],'Optocoupler',0.004,'Sends feedback across the safety barrier with light.',
  'An LED and a phototransistor in one package pass the output-voltage error signal without a wire connection.',
  'Isolates mains side from the user side; the controller adjusts switching to hold the output steady.',
  'CTR ≈ 50–300% and ages; TL431 shunt reference on secondary; ≈ 5 kV isolation.',
  needs='led_photodiode negative_feedback_ee', lab='circuit:led_circuit')
T('buck_converter','Output buck stage','component','usb_c_charger',[0.01,0.01,0],'Buck converter',0.008,'Trims the output to the requested voltage.',
  'A buck stage steps the voltage down efficiently when the phone asks for a lower voltage.',
  'Programmable power supply (PPS) uses buck regulation for fine voltage steps of 20 mV.',
  'Synchronous buck with MOSFET bridge, L ≈ 1–4.7 µH, fsw 300 kHz–1 MHz.',
  needs='buck_converter_node', lab='circuit:buck_converter')

# ---- grid ----
T('electric_power_grid','Electric power grid','structure',None,None,None,1e5,'A continent-scale machine from generator to outlet.',
  'Power plants, wires, transformers and substations deliver electricity to every outlet, with supply matching demand second by second.',
  'Seven stages: power plant → generator → step-up transformer → transmission line → substation → distribution transformer → wall outlet.',
  'Synchronous AC grid at 50/60 Hz; frequency is the real-time measure of balance; ≈ 5–8% losses end to end.',
  needs='transmission_distribution power_generation', par='electrical_engineering', area_='ee_power',
  parts='power_plant generator step_up_transformer transmission_line substation distribution_transformer wall_outlet', proc='power_grid_delivery', kn='power_grid')
G=dict(area_='ee_power', par='electric_power_grid')
T('power_plant','Power plant','structure','electric_power_grid',[-40000,0,0],'Power plant',500,'Where fuel, wind, water or sunlight becomes mechanical or electrical power.',
  'A power plant converts energy from fuel, flowing water, wind or sunlight into electricity.',
  'Thermal plants boil water to drive a steam turbine; hydro and wind turn turbines directly; solar skips the spin.',
  'Carnot limit η≤1−T_c/T_h; combined-cycle gas ≈ 60%; nuclear ≈ 33–37%; typical unit ratings 100 MW–1.4 GW.',
  needs='power_generation', **G)
T('generator','Generator','device','power_plant',[60,0,0],'Turbo-generator',15,'A huge synchronous machine turning rotation into AC.',
  'A rotating magnet inside coils of copper induces a voltage by Faraday’s law; the rotor spins at exactly 3000/3600 rpm for two-pole machines.',
  'The rotor is fed DC to make its magnetic field; three-phase windings in the stator produce the output at ≈ 11–25 kV.',
  'Hydrogen-cooled ≈ 98.5–99% efficient; synchronous reactance and excitation; inertia constant H ≈ 3–9 s underpins frequency stability.',
  needs='synchronous_machines faraday_lenz', **G)
T('step_up_transformer','Step-up transformer','device','electric_power_grid',[-34000,0,0],'GSU transformer',8,'Raises generator voltage to hundreds of kV.',
  'A large transformer raises the voltage so that long lines carry less current and waste less power.',
  'Oil-immersed, three-phase; 20 kV in, 345–765 kV out; ≈ 99.7% efficient.',
  'Mass ≈ 200–400 t for 500 MVA; cooling by oil/forced air; insulation (BIL) rated to lightning impulses of ≈ 1–2 MV.',
  needs='power_transformers', **G)
T('transmission_line','Transmission line','structure','electric_power_grid',[0,0,0],'High-voltage line',60000,'Wires carrying power across regions.',
  'High-voltage overhead lines carry power hundreds of kilometres with only a few percent loss.',
  'Bundled conductors reduce corona; towers keep spacing for insulation.',
  'Losses I²R; surge impedance ≈ 250–400 Ω; Ferranti rise; HVDC for >600 km or undersea.',
  needs='transmission_distribution transmission_lines', **G)
T('substation','Substation','structure','electric_power_grid',[35000,0,0],'Substation',100,'Switching and transformation yard.',
  'A substation steps voltage down, routes power between lines and houses protective equipment.',
  'Contains transformers, busbars, circuit breakers, disconnect switches and relays.',
  'Gas-insulated (GIS) vs air-insulated; protection zones; SCADA; reactive compensation.',
  needs='protection_relays_breakers power_transformers', **G)
T('distribution_transformer','Distribution transformer','device','electric_power_grid',[42000,0,0],'Pole/pad transformer',1.5,'The last step down to household voltage.',
  'The grey cylinder on a pole or the green box on the ground steps medium voltage (≈ 11–35 kV) to 120/240 V or 230/400 V.',
  'A centre-tapped secondary gives 120/240 V in North America.',
  '≈ 25–2500 kVA; efficiency ≈ 98–99%; no-load losses run 24/7; overloaded units age by insulation hot-spot temperature.',
  needs='power_transformers', **G)
T('wall_outlet','Wall outlet','component','electric_power_grid',[46000,0,0],'Socket',0.08,'The user’s end of the grid.',
  'The wall socket delivers 120 V/60 Hz or 230 V/50 Hz AC with a protective earth connection.',
  'Breakers and RCD/GFCI devices protect against overload and shock; plug types vary worldwide.',
  'RMS voltage tolerances ±5–10%; circuit breakers trip magnetically at ≈ 5–10×I_rated; GFCI trips at ≈ 5 mA imbalance.',
  needs='protection_relays_breakers', rel='lab_electrical_safety', **G)

# ---- processes ----
area('ee_processes')
def P(id,title,area_hub,needs,summary,basics,deeper,expert,steps,**kw):
    n(id,title,'process',needs,summary,basics,deeper,expert,par=area_hub,tmpl='process',scale=kw.pop('scale',None),steps=steps,**kw)
P('how_a_phone_charges','How a phone charges','electrical_engineering','smps_switching_supplies battery_storage_systems usb_protocol',
  'From the wall socket to lithium ions in the cell.',
  'Mains AC is converted to DC, stepped down, and pushed into the battery by the phone’s charger chip, which watches current, voltage and temperature.',
  'Constant-current phase until about 4.2–4.45 V, then constant-voltage phase while current tapers; fast charging uses higher voltage to keep current manageable.',
  'USB PD negotiation over CC lines sets the voltage (e.g., 9 V/3 A); charge pumps (2:1/3:1) convert at ≈ 97% efficiency; cell protection and temperature limits dominate the final stages.',
  [('Rectify the mains','The charger’s diode bridge converts the 230 V AC (peak 325 V) into DC held up by a bulk capacitor.','usb_c_charger rectifier_bridge'),
   ('Chop and isolate','A fast switching transistor chops the DC at tens of kHz and a small flyback transformer passes energy to the low-voltage side while isolating the user.','switching_mosfet flyback_transformer'),
   ('Regulate by light','The output voltage is compared to a reference; an optocoupler passes the error across the barrier so the controller adjusts the duty cycle.','feedback_optocoupler'),
   ('Negotiate','The phone and charger talk over the USB-C CC wire to agree on voltage and current.','phone_charger_port usb_c_charger'),
   ('Convert and control','The phone’s charger IC and PMIC convert to the battery voltage and apply constant current, then constant voltage.','phone_pmic buck_converter'),
   ('Ions move','Lithium ions travel through the electrolyte and insert into the graphite anode; the BMS watches temperature and cell voltage.','phone_battery')])
P('how_a_transistor_switches','How a transistor switches','ee_devices','mosfet_switch_node mosfet_physics_ee',
  'A voltage on the gate turns a channel on or off.',
  'In an NMOS, raising the gate voltage above threshold attracts electrons to the surface, forming a conducting channel between source and drain.',
  'Below threshold, a depletion region isolates source from drain; above it an inversion layer forms and current flows.',
  'Switching delay is limited by charging the gate and load capacitance: t≈0.69RC; subthreshold leakage ∝ 10^{(V_GS−V_T)/S}; short-channel devices need gate-all-around geometry for control.',
  [('Gate low','With V_GS=0 the p-type body has few electrons; source and drain are separated by two back-to-back junctions.','finfet_transistor silicon_channel'),
   ('Raise the gate','Positive gate voltage repels holes and attracts electrons toward the oxide interface.','finfet_transistor'),
   ('Inversion','Above threshold, enough electrons gather to form an n-type channel linking source and drain.','silicon_channel'),
   ('Current flows','A drain voltage drives electrons through the channel; the gate barely draws any current.','silicon_channel finfet_transistor'),
   ('Complementary pair','In a CMOS inverter, the PMOS and NMOS take turns so the output swings fully high or low.','cmos_inverter')],
  lab='device:mosfet_transfer')
P('instruction_execution','Instruction execution: fetch, decode, execute','ee_architecture','pipelining_hazards datapath_control',
  'How a CPU runs one instruction.',
  'The CPU repeatedly fetches an instruction, works out what it means, does it, and stores the result; billions of times per second.',
  'Pipelining overlaps these steps; branch prediction guesses the path to keep it full.',
  'Superscalar out-of-order cores rename registers, track instructions in a reorder buffer, and retire in program order to give precise exceptions.',
  [('Fetch','The program counter addresses the L1 instruction cache; a few instructions are read.','core_fetch core_l1_cache core_branch_predictor'),
   ('Decode','Instructions are translated to micro-operations; register names are mapped.','core_decode'),
   ('Read registers','Operands come from the register file or are forwarded from earlier results.','core_registers'),
   ('Execute','The ALU computes the result; a memory instruction computes an address instead.','core_alu logic_adder'),
   ('Memory access','Loads and stores go to the L1 data cache, falling through to L2/L3/DRAM on a miss.','core_l1_cache soc_cache'),
   ('Write back and retire','Results are written to registers and the instruction retires; wrong-path work is discarded.','core_registers core_pipeline')],
  lab='code:pipeline_sim')
P('how_wifi_sends_data','How Wi-Fi sends data','ee_comm','digital_modulation wireless_channels_fading',
  'Bits become radio waves, cross the air, and become bits again.',
  'The phone turns bits into a radio waveform, amplifies it and radiates it; the router reverses the steps.',
  'OFDM spreads bits over many subcarriers; error-correcting codes protect against fades.',
  'Pipeline: scrambler → LDPC encoder → QAM mapper → IFFT + cyclic prefix → DAC → mixer to 5 GHz → PA → antenna; receiver does AGC, sync, FFT, equalise, LDPC decode.',
  [('Packetise','Software splits data into frames and adds headers and a checksum.','phone_soc phone_wifi_bt'),
   ('Encode and map','Error-correcting bits are added; groups of bits map onto QAM constellation points.','phone_wifi_bt'),
   ('OFDM','An inverse FFT combines many subcarriers into one time-domain waveform.','phone_wifi_bt'),
   ('Up-convert and amplify','A mixer shifts it to 2.4/5/6 GHz; the power amplifier boosts it.','phone_rf_frontend'),
   ('Radiate','Currents on the antenna launch a wave that reflects around the room.','phone_antenna'),
   ('Receive','The router’s antenna, LNA, mixer and ADC capture the signal and the FFT/decoder recover the bits.','phone_rf_frontend phone_wifi_bt')],
  lab='signal:constellation')
P('how_a_photo_is_taken','How a photo is taken','electrical_engineering','photodetectors_solar image_video_processing',
  'Light to pixels.',
  'The lens focuses light onto the sensor; each pixel turns light into an electrical charge, which is read out, digitised and processed into a picture.',
  'Colour filters make each pixel see only red, green or blue; the ISP reconstructs full colour.',
  'Photon shot noise limits SNR (√N); read noise, full-well capacity and dynamic range; multi-frame HDR fuses exposures; rolling shutter timing.',
  [('Focus','The voice-coil actuator moves the lens; stabilisation compensates shake.','phone_camera'),
   ('Collect photons','Photodiodes convert photons into electron–hole pairs and store charge.','phone_camera'),
   ('Read out','Column ADCs convert each pixel’s voltage into 10–14 bit numbers.','phone_camera'),
   ('Image processing','The ISP demosaics, denoises, corrects colour and tone-maps.','soc_isp'),
   ('Neural enhancement','The NPU adds scene detection, HDR fusion and portrait depth.','soc_npu soc_isp'),
   ('Store','The result is compressed and written to flash.','phone_flash phone_soc')])
P('chip_fabrication','Chip fabrication','ee_devices','fabrication_overview fabrication_lithography',
  'From sand to a processor.',
  'A silicon wafer goes through hundreds of cycles of adding a layer, printing a pattern and etching it, building billions of transistors.',
  'Cleanroom steps: grow oxide, coat resist, expose, develop, etch, implant, deposit metal, repeat; then dice and package.',
  'Front-end (transistors, ≈ 1000+ steps) and back-end (≈ 10–15 copper metal layers); EUV layers ≈ 20; yield learning; test, binning and packaging with TSVs and hybrid bonding.',
  [('Wafer','Sand is purified to 99.9999999% silicon, grown as a single crystal and sliced into wafers.','silicon_channel'),
   ('Oxidise and deposit','Thin insulating and conducting films are grown or deposited.','finfet_transistor'),
   ('Pattern','Light through a mask exposes resist; UV or EUV prints features smaller than 20 nm.','finfet_transistor'),
   ('Etch and implant','Plasma etching carves fins; ion implantation sets n- and p-type regions.','silicon_channel finfet_transistor'),
   ('Wire it up','Copper interconnects are built layer by layer above the transistors.','soc_interconnect phone_soc'),
   ('Test and package','Wafers are tested, diced and packaged into chips like the SoC.','phone_soc')],
  lab='device:fab_process')
P('power_grid_delivery','Power grid delivery','ee_power','transmission_distribution power_generation',
  'From a power plant to your outlet.',
  'Electricity is generated, boosted to high voltage, sent over long wires, stepped down at substations and finally lowered to household voltage.',
  'Supply and demand must always balance; frequency tells operators if they do.',
  'Steady-state AC grids are synchronised; power flows follow impedance, not contracts; contingency planning (N−1) protects against single failures.',
  [('Generate','Turbines spin generators producing AC at about 20 kV.','power_plant generator'),
   ('Step up','A transformer raises the voltage to hundreds of kV, reducing current.','step_up_transformer'),
   ('Transmit','Overhead lines carry power across regions.','transmission_line'),
   ('Step down','Substations reduce the voltage and split power among feeders.','substation'),
   ('Distribute','Local lines carry 11–35 kV to the street.','distribution_transformer'),
   ('Deliver','The final transformer provides 120/230 V to the outlet.','wall_outlet')],
  lab='network:power_flow_grid')
P('how_touchscreen_senses','How a touchscreen senses touch','ee_electives','capacitor_ee',
  'A finger changes capacitance.',
  'A grid of electrodes lies under the glass; a finger nearby changes the electric field, and the controller finds where.',
  'The controller drives rows and senses columns; a touch reduces the mutual capacitance at the crossing.',
  'ΔC/C ≈ 10–30%; noise from display and charger is filtered; palm rejection; hover sensing; stylus uses active signalling.',
  [('Drive','The controller sends a signal on each row electrode in turn.','phone_touchscreen'),
   ('Couple','The signal couples capacitively to the column electrodes across each crossing.','phone_touchscreen'),
   ('Finger perturbs','A finger diverts some field lines to the body, reducing the coupled signal at nearby crossings.','phone_touchscreen'),
   ('Measure','Sense circuits digitise each node’s change.','phone_touchscreen phone_soc'),
   ('Locate','The controller interpolates between nodes to get sub-millimetre position and reports it.','phone_soc phone_touchscreen')],
  lab='field:touch_grid')
save('ee_teardown')
