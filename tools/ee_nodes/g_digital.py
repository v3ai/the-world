from lib import *
area('ee_digital')
AACDG="All About Circuits: Digital|https://www.allaboutcircuits.com/textbook/digital/"
n('number_systems','Number systems: binary, hex, two’s complement','concept','logic_boolean_math','How computers write numbers.',
  'Computers use binary (0/1); hexadecimal is shorthand grouping four bits. Two’s complement represents negative numbers so addition works the same.',
  'An n-bit two’s-complement word spans −2ⁿ⁻¹…2ⁿ⁻¹−1; overflow is detected when carry into and out of the top bit differ.',
  'Also BCD, Gray code (single-bit changes), fixed-point Qm.n, IEEE-754 floating point (sign, exponent, mantissa).',
  f='−x = ~x + 1', r='CMA:4.3', x=AACDG, lab='logic:number_converter')
n('boolean_algebra_digital','Boolean algebra for design','technique','logic_boolean_math','Simplifying logic expressions.',
  'Rules like A+AB=A and De Morgan’s laws shrink a logic expression and thus the circuit.',
  'Sum-of-products and product-of-sums forms; any function is built from AND/OR/NOT.',
  'Shannon expansion f=x f_x+x′f_x′; consensus theorem; duality; minimal forms are NP-hard in general.',
  f='A + AB = A', lab='logic:boolean_playground')
n('logic_gates','Logic gates','component','boolean_algebra_digital','AND, OR, NOT, NAND, NOR, XOR.',
  'Gates are the atoms of digital logic. NAND and NOR are universal: any logic can be built from either.',
  'Truth tables define behaviour; gate symbols (ANSI/IEEE); fan-in and fan-out limit practical use.',
  'Propagation delay, noise margin V_IL/V_IH/V_OL/V_OH, logic families (TTL, CMOS, ECL); tristate and open-drain outputs for buses.',
  lab='logic:gate_sandbox', kn='electronics_logic')
n('karnaugh_maps','Karnaugh maps','technique','boolean_algebra_digital','Minimise logic visually.',
  'A K-map arranges a truth table so neighbours differ by one bit; circle groups of 1s to get simple terms.',
  'Works up to ~4–5 variables; don’t-cares enlarge groups; watch for hazards.',
  'Prime implicants and essential prime implicants; static-1 hazards removed by redundant terms.',
  lab='logic:kmap_minimizer')
n('quine_mccluskey','Quine–McCluskey and tool minimisation','technique','karnaugh_maps','Algorithmic logic minimisation.',
  'A tabular algorithm that finds minimal logic for any number of variables; the idea behind synthesis tools.',
  'Step 1: find prime implicants; step 2: pick minimal cover.',
  'Complexity grows exponentially; Espresso heuristic and BDDs are used in practice; ABC for multi-level.',
  lab='logic:kmap_minimizer')
n('muxes_decoders','Multiplexers, decoders and encoders','component','logic_gates','Selecting and decoding.',
  'A multiplexer chooses one of many inputs; a decoder turns a binary code into one active line; an encoder does the reverse.',
  'A 2ⁿ:1 mux is a universal logic element; memories use decoders for addresses.',
  'Mux-based function realisation (Shannon); priority encoders; one-hot vs binary encoding.',
  lab='logic:mux_decoder')
n('adders_arithmetic','Adders and arithmetic circuits','concept','logic_gates number_systems','Adding binary numbers in hardware.',
  'A half adder adds two bits; a full adder includes carry in. Chain them for multi-bit addition.',
  'Ripple-carry is simple but slow; carry-lookahead and prefix adders reduce delay to O(log n).',
  'Sum=A⊕B⊕C, Cout=AB+C(A⊕B); Kogge–Stone prefix adder; subtraction via two’s complement; multipliers (array, Booth, Wallace).',
  f='S = A⊕B⊕Cin;  Cout = AB + Cin(A⊕B)', lab='logic:adder_builder')
n('alu_design','Arithmetic logic unit (ALU)','concept','adders_arithmetic muxes_decoders','The calculator at the heart of a CPU.',
  'An ALU performs add, subtract, AND, OR, shifts and compares on binary words, selected by control bits.',
  'Flags (zero, carry, overflow, negative) report results for branching.',
  'Bit-slice design with mux per bit; barrel shifters; overflow V=C_in⊕C_out for two’s complement.',
  lab='logic:alu_sandbox')
n('latches','Latches','component','logic_gates','The simplest memory.',
  'Two cross-coupled gates hold a bit; that is an SR latch. A gated D-latch stores whatever D was while enabled.',
  'Level sensitivity makes them tricky in clocked systems; used in clock gating and some high-speed design.',
  'Metastability when S and R de-assert together; transparent latch timing, time-borrowing.',
  lab='logic:latch_flipflop')
n('flip_flops','Flip-flops (D, JK, T)','component','latches','Edge-triggered one-bit memory.',
  'A flip-flop samples its input on a clock edge and holds the value until the next edge.',
  'D stores data; T toggles; JK is a generalised version. Two latches back-to-back (master–slave) make an edge-triggered D FF.',
  'Setup/hold constraints; clock-to-Q delay; metastability MTBF=e^{t_r/τ}/(T₀ f_c f_d).',
  lab='logic:latch_flipflop')
n('registers_counters','Registers and counters','component','flip_flops','Groups of flip-flops.',
  'A register stores a multi-bit word; a counter steps through binary values with each clock.',
  'Shift registers move bits sideways (serial/parallel conversion); synchronous counters avoid ripple delays.',
  'LFSR counters give pseudo-random sequences for test and CDMA; Johnson and Gray counters limit glitches.',
  lab='logic:counter_register')
n('finite_state_machines','Finite state machines (Moore and Mealy)','concept','registers_counters','Digital sequences with memory.',
  'An FSM has a finite set of states and rules for moving between them based on inputs. Moore outputs depend on state only; Mealy on state and input.',
  'Design: state diagram → state table → encode → next-state and output logic.',
  'State encoding (binary, one-hot, Gray) trades area and speed; unreachable states and safe recovery; FSMs written in HDL with case statements.',
  lab='logic:fsm_designer')
n('timing_analysis','Timing: setup, hold and clocking','concept','flip_flops','Making sure signals arrive in time.',
  'A signal must be stable for a short time before (setup) and after (hold) the clock edge; the slowest path sets the maximum clock.',
  'T_clk ≥ t_cq + t_logic + t_setup + t_skew; hold violations are fixed by adding delay, not by slowing the clock.',
  'Static timing analysis, clock domain crossing (two-flop synchroniser), clock trees, jitter, on-chip variation; PVT corners.',
  f='T_clk ≥ t_cq + t_logic + t_setup + t_skew', lab='logic:timing_diagram')
n('memory_rom_ram','Memory types: ROM, SRAM, DRAM','concept','flip_flops muxes_decoders','Storing many bits.',
  'ROM keeps data without power; SRAM uses six transistors per bit and is fast; DRAM uses one transistor plus a capacitor, is dense but needs refreshing.',
  'Address decoders select rows/columns; sense amplifiers read tiny charges.',
  'SRAM 6T cell stability (SNM); DRAM cell ~6F², refresh every 64 ms; DDR5 transfer rates >6 Gb/s/pin.',
  lab='logic:memory_array')
n('flash_memory','Flash memory','device','memory_rom_ram mosfet_physics_ee','Charge trapped on a floating gate.',
  'Flash stores bits as charge trapped in a floating gate or charge-trap layer in a transistor; it remains without power.',
  'Writes use Fowler–Nordheim tunnelling and cause wear; NAND flash is stacked in 3D to hundreds of layers.',
  'SLC/MLC/TLC/QLC store 1–4 bits per cell using 2ⁿ threshold levels; endurance falls from 100k to ~1k cycles; wear levelling and ECC in controllers.',
  lab='device:flash_cell', kn='tunneling')
n('programmable_logic','Programmable logic: FPGAs and CPLDs','concept','muxes_decoders registers_counters','Reconfigurable hardware.',
  'An FPGA contains many small lookup tables and flip-flops joined by programmable wiring; you configure it to be any digital circuit.',
  'CPLDs are smaller, simpler and non-volatile; FPGAs add block RAM, DSP slices and transceivers.',
  'LUT-4/6 implements any function of its inputs; configuration SRAM bitstream; place-and-route, timing closure.',
  lab='logic:fpga_lut', x=wp('Field-programmable_gate_array'))
n('hdl_design_flow','HDL-based design flow','technique','programmable_logic hdl_verilog_vhdl finite_state_machines','From code to gates.',
  'Write RTL in Verilog/VHDL, simulate it, synthesize it to gates, place and route, then program the chip.',
  'Testbenches and waveforms verify before hardware; constraints supply clocks and pins.',
  'Synthesis → mapping → P&R → bitstream; timing closure iterations; formal verification and coverage-driven testbenches for ASICs.',
  lab='logic:verilog_sim')
save('ee_digital')
