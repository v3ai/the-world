from lib import *
area('ee_programming')
n('intro_programming','Introductory programming (C, C++, Python)','concept','logic_boolean_math','Variables, control flow, functions, arrays.',
  'A program stores values in variables, makes decisions with if/else, repeats with loops, and packages steps into functions.',
  'C gives close control of memory and is the language of firmware; Python is fast to write and good for analysis and test automation.',
  'Static vs dynamic typing; value vs reference semantics; stack frames; arrays are contiguous memory and indexing is pointer arithmetic.',
  f=None, x='Python tutorial|https://docs.python.org/3/tutorial/')
n('c_language','The C language','technique','intro_programming','The lingua franca of hardware-near code.',
  'C maps almost directly to machine instructions; you manage memory yourself.',
  'Pointers, structs, bit operations and the preprocessor are the everyday tools of firmware developers.',
  'Undefined behaviour (signed overflow, out-of-bounds, strict aliasing) is why careful style standards such as MISRA C exist.',
  x=wp('C_(programming_language)'))
n('data_structures','Data structures','concept','intro_programming','Lists, stacks, queues, trees, hash tables.',
  'A data structure organises data so common operations are fast: arrays for indexing, linked lists for insertion, trees for ordered search.',
  'Embedded code favours fixed-size ring buffers and state tables; simulators use sparse matrices.',
  'Amortised analysis; balanced trees O(log n); hash tables O(1) average; ring buffer is the standard UART/DMA queue.',
  r='CMA:12.10', x=wp('Data_structure'))
n('algorithms_complexity','Algorithms, sorting and complexity','concept','data_structures','How work grows with problem size.',
  'Algorithms are recipes; complexity says how running time grows as inputs grow. Sorting is the classic example.',
  'FFT turns an O(N²) DFT into O(N log N), which is why spectrum analysers and OFDM radios are practical.',
  'Big-O/Θ/Ω; comparison sort lower bound Ω(n log n); divide and conquer master theorem; P vs NP.',
  f='T(n) = 2T(n/2) + O(n) ⇒ O(n log n)', kn='computation p_vs_np')
n('matlab_python_sim','MATLAB and Python for simulation','tool','intro_programming matrices_systems','Numerical computing and plotting.',
  'Array-based languages make it easy to simulate signals and systems and to plot results.',
  'Scripts compute filter responses, FFTs and Monte Carlo noise studies; NumPy/SciPy and MATLAB cover similar ground.',
  'Vectorisation avoids interpreted loops; sparse and BLAS-backed linear algebra; toolboxes for control, signals and communications; reproducible notebooks.',
  lab='code:python_sandbox', x='NumPy documentation|https://numpy.org/doc/')
n('embedded_c','Embedded C: pointers, memory, registers','technique','c_language','Programming bare metal.',
  'In embedded C you write directly to hardware registers via pointers and work within a few kilobytes of memory.',
  'Memory-mapped I/O, volatile, bit masks, interrupt service routines and linker scripts define the style.',
  'Stack, heap, .data, .bss, .text sections; volatile prevents optimisation of device reads; atomicity of shared variables between ISR and main loop; alignment and endianness.',
  f='REG |= (1<<n);  REG &= ~(1<<n)', lab='code:register_bitfiddle', x=wp('Memory-mapped_I/O_and_port-mapped_I/O'))
n('hdl_verilog_vhdl','Hardware description languages (Verilog/VHDL)','technique','logic_boolean_math','Describing circuits as text.',
  'An HDL describes digital hardware, not a sequence of steps: everything described runs in parallel.',
  'Synthesis tools turn the description into gates on an FPGA or ASIC; testbenches simulate it first.',
  'RTL style: always @(posedge clk) for registers, continuous assignments for logic; blocking vs non-blocking assignments; inferred latches as classic bug; SystemVerilog assertions for verification.',
  lab='logic:verilog_sim', x=wp('Verilog;VHDL'.split(';')[0]) + ';' + wp('VHDL'))
n('simulation_tools','Simulation tools (SPICE, LTspice, Simulink)','tool','ode_solvers hdl_verilog_vhdl','Virtual lab benches.',
  'Circuit simulators solve the circuit equations numerically so you can test a design before building it.',
  'SPICE (also LTspice, Multisim) models devices and runs DC, AC, transient and noise analyses; Simulink models block-diagram systems.',
  'Modified nodal analysis assembles one matrix of KCL equations; Newton–Raphson per timestep; device models (BSIM, Gummel–Poon) are only as good as their parameters. COMSOL and HFSS solve field problems by finite elements.',
  x=wp('SPICE;LTspice'.split(';')[0]) + ';' + wp('LTspice'), lab='circuit:ohms_law')
n('field_solvers','Field solvers (COMSOL, HFSS)','tool','simulation_tools pde_intro','Finite-element simulation of fields.',
  'Field solvers divide a physical structure into small elements and solve Maxwell’s or heat equations numerically.',
  'Used for antennas, PCB traces, magnetic cores and thermal design where closed forms do not exist.',
  'Mesh refinement and convergence; port definitions; absorbing boundaries (PML); FDTD vs FEM vs method of moments trade-offs.',
  lab='field:fem_demo', x=wp('Finite_element_method'))
save('ee_programming')
