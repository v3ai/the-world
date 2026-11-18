from lib import *
area('ee_architecture')
n('isa_risc_cisc','Instruction set architectures: RISC vs CISC','concept','alu_design','The contract between software and hardware.',
  'An ISA defines the instructions a processor understands. RISC uses simple fixed-size instructions; CISC has complex variable ones.',
  'ARM, RISC-V (RISC) and x86 (CISC outside, RISC-like inside) are the common ISAs.',
  'Load/store architecture, register count, addressing modes, endianness; micro-ops decouple CISC from execution; ISA extensions (SIMD, NEON, AVX).',
  lab='code:isa_simulator', x=wp('Instruction_set_architecture;Reduced_instruction_set_computer'.split(';')[0])+';'+wp('Reduced_instruction_set_computer'))
n('assembly_language','Assembly language','technique','isa_risc_cisc','Human-readable machine instructions.',
  'Assembly writes machine instructions as short mnemonics: ADD, LOAD, JUMP.',
  'Used for boot code, interrupt handlers and tight loops; compilers generate it from C.',
  'Calling conventions, stack frames, link register vs push return; reading compiler output reveals optimisation.',
  lab='code:isa_simulator')
n('datapath_control','Datapath and control unit','concept','alu_design registers_counters finite_state_machines isa_risc_cisc','The machine that executes instructions.',
  'A datapath of registers, ALU and buses is steered by a control unit decoding each instruction.',
  'Single-cycle, multi-cycle and pipelined designs trade clock rate and complexity.',
  'Hardwired vs microcoded control; critical path through instruction memory, regfile, ALU, data memory.',
  lab='code:datapath_viewer')
n('pipelining_hazards','Pipelining and hazards','concept','datapath_control','An assembly line for instructions.',
  'Pipelining overlaps instruction stages (fetch, decode, execute, memory, write-back) so one finishes every cycle.',
  'Hazards: structural, data (forward results), control (branch prediction).',
  'Speedup ≈ number of stages minus stalls; forwarding paths; branch predictors reach >95% accuracy; out-of-order and superscalar designs.',
  lab='code:pipeline_sim')
n('cache_memory','Cache memory','concept','memory_rom_ram pipelining_hazards','Small and fast copies of memory.',
  'A cache keeps recently used data near the CPU because programs reuse data (locality).',
  'Organisation: direct-mapped, set-associative; block size; replacement policy.',
  'AMAT=hit time+miss rate×miss penalty; write-through vs write-back; coherence protocols (MESI) in multicores.',
  f='AMAT = t_hit + m·t_miss', lab='code:cache_sim')
n('memory_hierarchy','Memory hierarchy','concept','cache_memory','Registers → cache → DRAM → flash.',
  'Fast memory is small and costly; big memory is slow. The hierarchy gives the illusion of fast and large.',
  'Typical: registers <1 ns, L1 ~1 ns, L2 3–5 ns, L3 10–20 ns, DRAM ~80 ns, flash ~50 µs.',
  'Bandwidth, latency and the memory wall; prefetching; NUMA.',
  lab='code:cache_sim')
n('virtual_memory','Virtual memory','concept','memory_hierarchy','Each program thinks it owns memory.',
  'The OS and hardware map each program’s addresses to physical memory, protecting programs from each other.',
  'Page tables, TLB cache translations; page faults load pages from storage.',
  'Multi-level page tables, huge pages, MMU/IOMMU, address space layout randomisation.')
n('mcu_architecture','Microcontroller architecture (ARM, AVR, PIC)','device','datapath_control embedded_c','A computer on a chip.',
  'A microcontroller bundles a CPU, memory and peripherals (timers, ADC, serial) in one chip for controlling devices.',
  'ARM Cortex-M dominates; AVR (Arduino) and PIC remain common in education and small designs.',
  'Harvard vs von Neumann, NVIC interrupt controller, memory map, flash wait states, clock tree, debug via SWD/JTAG.',
  lab='code:mcu_sim', scale=0.005)
n('gpio','GPIO','technique','mcu_architecture','Pins that read and write bits.',
  'General-purpose input/output pins can be configured as inputs or outputs and used to blink an LED or read a button.',
  'Modes: push-pull, open-drain, pull-up/down, analog, alternate function.',
  'Slew rate, drive strength, Schmitt-trigger inputs, debouncing in hardware/software.',
  lab='code:mcu_sim')
n('interrupts','Interrupts','concept','mcu_architecture','Hardware-initiated attention.',
  'An interrupt pauses the program when something happens (a pin changes, a timer expires) and runs a handler.',
  'Priorities and nesting; keep handlers short; shared data needs protection.',
  'Interrupt latency, vector table, tail-chaining on Cortex-M; priority inversion; volatile and atomic access.',
  lab='code:mcu_sim')
n('timers_pwm','Timers and PWM','concept','mcu_architecture','Counting clocks; fake analog by switching.',
  'A timer counts clock pulses; pulse-width modulation varies how long a pin is high, controlling brightness or motor speed.',
  'Duty cycle D sets average voltage D·Vcc; filters or inertia smooth it.',
  'Input capture, output compare, dead-time insertion for half-bridges; PWM resolution=log₂(f_clk/f_pwm) bits.',
  f='V_avg = D·V_cc', lab='code:pwm_scope')
n('mcu_adc_dac','ADC and DAC peripherals','technique','mcu_architecture adc_basics dac_basics','Reading and writing analog on a microcontroller.',
  'Built-in ADCs read sensor voltages; DACs or PWM output them.',
  'Sample time, reference voltage and source impedance affect accuracy; DMA streams samples.',
  'Oversampling+decimation raise effective bits; anti-alias filters; ratiometric measurement cancels reference drift.',
  lab='code:mcu_sim')
n('uart_serial','UART','technique','mcu_architecture','Simple asynchronous serial.',
  'UART sends bytes one bit at a time on a wire with agreed speed (baud), framed by start and stop bits.',
  'Used for consoles, GPS modules and Bluetooth modules; RS-232/RS-485 levels extend range.',
  'Baud error tolerance ≈ ±3%; oversampling receiver; flow control RTS/CTS.',
  lab='code:serial_decoder')
n('spi_bus','SPI','technique','mcu_architecture','Fast four-wire synchronous bus.',
  'SPI uses a clock, two data lines and a chip select to move bytes fast between a master and peripherals.',
  'Modes 0–3 define clock polarity and phase; used for flash, displays, ADCs.',
  'Full-duplex shift-register exchange; speeds to 50+ MHz; daisy-chain topologies.',
  lab='code:serial_decoder')
n('i2c_bus','I²C','technique','mcu_architecture','Two wires, many devices.',
  'I²C connects many chips on two wires (clock and data), each with its own address.',
  'Open-drain lines with pull-up resistors; speeds 100 kHz–3.4 MHz; ACK bits confirm delivery.',
  'Arbitration and clock stretching; bus capacitance limits to 400 pF; rise-time requirement sets pull-up value.',
  lab='code:serial_decoder')
n('can_bus','CAN bus','technique','mcu_architecture','Robust differential bus for vehicles and industry.',
  'CAN is a two-wire differential bus where many nodes share messages; messages carry priority.',
  'Used in cars (engine, brakes, battery); non-destructive arbitration on message ID.',
  'Dominant/recessive bits, bit stuffing, CRC-15, error confinement, CAN-FD to 5–8 Mbit/s.',
  lab='code:serial_decoder')
n('usb_protocol','USB','technique','mcu_architecture','A universal cable and protocol.',
  'USB carries data and power over one cable; the host polls devices which present descriptors.',
  'Speeds 480 Mb/s (USB 2) to 40 Gb/s (USB4); USB-C adds orientation-independent connector and Power Delivery.',
  'Differential signalling; enumeration; PD negotiates 5–48 V up to 240 W (EPR); CC pins carry configuration.',
  f='P = V·I (PD up to 240 W)', lab='code:serial_decoder')
n('rtos','Real-time operating systems','concept','interrupts','Scheduling tasks with deadlines.',
  'An RTOS switches between tasks predictably so deadlines are met.',
  'Priority-based preemptive scheduling, semaphores, queues; FreeRTOS and Zephyr are common.',
  'Rate-monotonic analysis (utilisation bound n(2^{1/n}−1)), priority inheritance, worst-case execution time.',
  f='U ≤ n(2^{1/n} − 1)')
n('low_power_design','Low-power design','technique','mcu_architecture','Making batteries last.',
  'Sleep modes, slower clocks and turning off unused parts reduce power by factors of thousands.',
  'Duty-cycled devices spend most time asleep at µA; energy per task matters.',
  'Dynamic voltage and frequency scaling P∝CV²f; leakage in deep sleep; energy harvesting; battery life=capacity/average current.',
  f='P_dyn = C V² f', lab='code:power_profile')
n('device_drivers','Device drivers','technique','interrupts embedded_c','Software that talks to hardware.',
  'A driver hides a peripheral’s registers behind a clean software interface.',
  'Layering: register access → driver → application; DMA and interrupts keep the CPU free.',
  'HAL vs LL libraries; kernel-space drivers on Linux; memory barriers; device-tree description.')
n('interfacing_sensors','Interfacing sensors','technique','mcu_adc_dac i2c_bus spi_bus','Reading the physical world.',
  'Sensors give voltages or digital values; conditioning circuits (amplify, filter, level-shift) prepare them for the microcontroller.',
  'Examples: thermistor in divider, Hall sensor, accelerometer over I²C.',
  'Bridge circuits and instrumentation amps; calibration and drift; sensor fusion filters.',
  lab='code:mcu_sim')
n('interfacing_motors','Interfacing motors','technique','timers_pwm mosfet_switch_node','Driving actuators.',
  'Motors need more current than a pin supplies: use a transistor or H-bridge and a flyback diode, with PWM for speed.',
  'DC, stepper and servo motors each need a different driver.',
  'H-bridge dead-time to avoid shoot-through; current sensing; back-EMF; encoder feedback closes the loop.',
  lab='circuit:mosfet_switch')
n('interfacing_displays','Interfacing displays','technique','spi_bus i2c_bus','Showing information.',
  'LED, LCD and OLED displays connect over parallel, SPI or I²C buses; a frame buffer holds pixels.',
  'Multiplexing LED matrices cuts pins; OLED pixels emit light, LCDs modulate a backlight.',
  'Refresh rate and bandwidth; MIPI DSI for phone displays; display controllers with DMA.',
  lab='code:mcu_sim')
save('ee_architecture')
