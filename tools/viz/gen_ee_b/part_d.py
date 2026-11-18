from common import *
D = {}
_pl = "10^((x+G)/10)"
D["rf_amplifiers"] = plot([("x+G","ideal linear gain","dim",True),("10*log10(%s/sqrt(1+(%s/10^(Ps/10))^2))"%(_pl,_pl),"real amplifier output","accent",False,2.6)],[-40,10],[-40,40],
  "An RF amplifier is linear only until it nears its saturation power. The 1 dB compression point P1dB, where gain has dropped by 1 dB, marks the top of its useful range.",
  [P("G","small-signal gain",10,30,20,"dB"),P("Ps","saturation power",10,30,20,"dBm")],
  [R("output P1dB","Ps-2.16","dBm"), R("input P1dB","Ps-2.16+1-G","dBm")], xlabel="input power (dBm)", ylabel="output power (dBm)")

D["s_parameters_rf"] = plot([("-10*log10(1+Q^2*(x-1/x)^2)","S21 transmission","accent"),("10*log10((Q^2*(x-1/x)^2+1e-9)/(1+Q^2*(x-1/x)^2))","S11 reflection","pink")],[0.5,1.5],[-40,3],
  "S-parameters are ratios of waves at the ports: S21 is what gets through and S11 what bounces back. For a lossless bandpass filter the two always share the incident power, |S11|² + |S21|² = 1.",
  [P("Q","quality factor Q",2,30,10)], [R("3 dB bandwidth f₀/Q","1/Q","of f₀")], xlabel="frequency / f₀", ylabel="dB")

D["rf_mixers_filters"] = S("signal","A mixer multiplies the RF input by a local oscillator, producing sum and difference frequencies. The difference |f_RF − f_LO| is the intermediate frequency (IF) that a filter then selects.",
  [P("fr","RF frequency",30,80,60,"Hz",1),P("fl","LO frequency",20,50,35,"Hz",1)],
  [R("IF = |f_RF − f_LO|","abs(fr-fl)","Hz"), R("sum f_RF + f_LO","fr+fl","Hz"), R("image frequency","2*fl-fr","Hz")],
  x=[0,1], f="sin(2*pi*fr*x)*sin(2*pi*fl*x)", spectrum=True, fmax=100)

D["vlsi_digital_cmos"] = plot([("x^2","switching energy ∝ V²","accent"),("(x/(x-Vt)^1.3)*(0.7^1.3)","gate delay (norm. to 1 V at V_T = 0.3 V)","pink")],[0.45,1.2],[0,3],
  "Dynamic energy per switch grows as V², while delay grows rapidly as the supply approaches the threshold. Chip designers trade the two by lowering voltage when speed is not needed.",
  [P("Vt","threshold V_T",0.2,0.4,0.3,"V")], [R("energy at 0.6 V vs 1 V","0.36*100","%"), R("relative delay at 0.6 V","(0.6/(0.6-Vt)^1.3)/(1/(1-Vt)^1.3)")],
  xlabel="supply voltage V_DD (V)", ylabel="relative to V_DD = 1 V")

D["vlsi_analog_ic"] = plot([("Iss*tanh(x/(2*26*(1+g)))","differential output current","accent")],[-200,200],None,
  "A differential pair steers its tail current Iss toward whichever input is higher. It is linear only for small differences; emitter or source degeneration (g) trades gain for a wider linear range.",
  [P("Iss","tail current",0.1,2,1,"mA"),P("g","degeneration",0,4,0,"")],
  [R("transconductance g_m","Iss/(4*0.026*(1+g))*1000/1000","mS"), R("linear range ≈ ±","26*(1+g)","mV")], xlabel="input difference (mV)", ylabel="I_out1 − I_out2 (mA)")

D["ic_layout_verification"] = S("geometry","A layout is drawn masks: green diffusion, red polysilicon gate, blue contacts. A transistor forms where poly crosses diffusion. Design-rule checks flag any width below the process minimum (0.1 µm here).",
  [P("L","gate length L",0.05,0.4,0.15,"µm")], [R("gate length","L*1000","nm"), R("rule check (1 = pass)","L>=0.1")],
  range=[-1.5,1.5,-1,1], aspect=0.6, shapes=[
  {"k":"rect","x":-1.2,"y":-0.4,"w":2.4,"h":0.8,"fill":"green","alpha":0.4,"color":"green"},
  {"k":"rect","x":"-L/2","y":-0.75,"w":"L","h":1.5,"fill":"red","alpha":0.7,"color":"red"},
  {"k":"rect","x":-0.9,"y":-0.12,"w":0.24,"h":0.24,"fill":"blue","color":"blue"},{"k":"rect","x":0.66,"y":-0.12,"w":0.24,"h":0.24,"fill":"blue","color":"blue"},
  {"k":"text","x":-0.78,"y":-0.62,"text":"source","color":"dim","size":9},{"k":"text","x":0.78,"y":-0.62,"text":"drain","color":"dim","size":9},{"k":"text","x":0,"y":0.9,"text":"gate L = {L*1000} nm","color":"white"},
  {"k":"text","x":0.9,"y":0.82,"text":"DRC violation","color":"red","when":"L<0.1"}])

D["fiber_optics_photonics"] = S("geometry","Light stays in the glass core by total internal reflection. Only rays entering within the acceptance angle (sinθ ≤ NA = √(n₁²−n₂²)) are guided; steeper ones leak into the cladding and are lost.",
  [P("n1","core index n₁",1.46,1.52,1.48,"",0.005),P("n2","cladding index n₂",1.42,1.47,1.46,"",0.005),P("th","launch angle",0,30,8,"°")],
  [R("numerical aperture","sqrt(n1^2-n2^2)"), R("acceptance half-angle","deg(asin(min(1,sqrt(n1^2-n2^2))))","°"), R("guided? (1 = yes)","sin(rad(th))<=sqrt(n1^2-n2^2)")],
  range=[0,10,-1.4,1.4], aspect=0.45, shapes=[
  {"k":"rect","x":0,"y":0.5,"w":10,"h":0.9,"fill":"purple","alpha":0.2,"color":"purple"},{"k":"rect","x":0,"y":-1.4,"w":10,"h":0.9,"fill":"purple","alpha":0.2,"color":"purple"},
  {"k":"rect","x":0,"y":-0.5,"w":10,"h":1,"fill":"accent","alpha":0.12,"color":"accent"},
  {"k":"curve","x":"s","y":"asin(sin(pi*(s*tan(asin(sin(rad(th))/n1))-0.5)))/pi","s":[0,10],"color":"gold","width":2.2,"when":"sin(rad(th))<=sqrt(n1^2-n2^2)"},
  {"k":"curve","x":"s","y":"s*tan(asin(sin(rad(th))/n1))*(s<0.5/tan(asin(sin(rad(th))/n1)))","s":[0,10],"color":"red","width":2.2,"when":"sin(rad(th))>sqrt(n1^2-n2^2)"},
  {"k":"text","x":5,"y":0.95,"text":"cladding n₂ = {n2}","color":"purple","size":10},{"k":"text","x":1.2,"y":-0.25,"text":"core n₁ = {n1}","color":"accent","size":10},
  {"k":"text","x":7,"y":-0.95,"text":"leaks out","color":"red","when":"sin(rad(th))>sqrt(n1^2-n2^2)"}])

D["photonic_integrated_circuits"] = plot([("cos(pi*x/(2*Vp)+rad(b))^2","Mach–Zehnder output power","accent")],[-6,6],[0,1.05],
  "A Mach–Zehnder modulator splits light, shifts the phase in one arm with a voltage, and recombines it. Interference turns the phase shift into brightness; V_π is the voltage for a full on-off swing.",
  [P("Vp","V_π",1,6,3,"V"),P("b","bias phase",-90,90,-45,"°")], [R("swing for 0 → V_π","1","(on to off)")],
  xlabel="drive voltage (V)", ylabel="output / input power")
D["photonic_integrated_circuits"]["readouts"]=[R("V_π (full swing)","Vp","V")]

D["wireless_5g6g"] = plot([("L*20*log2(1+10^(x/10))","4G: 20 MHz","dim"),("L*100*log2(1+10^(x/10))","5G mid-band: 100 MHz","accent"),("L*800*log2(1+10^(x/10))","5G mmWave: 800 MHz","pink")],[0,30],[10,1e5],
  "Peak rate is bandwidth × spectral efficiency × spatial layers. 5G gets its speed mainly from much wider channels (mmWave) and more MIMO layers, not from cleverer modulation.",
  [P("L","MIMO layers",1,8,2,"",1)], [R("mid-band at 20 dB SNR","L*100*log2(1+100)","Mbit/s"), R("mmWave at 20 dB","L*800*log2(1+100)/1000","Gbit/s")],
  logy=True, xlabel="SNR (dB)", ylabel="rate (Mbit/s, Shannon limit)")

D["mimo_beamforming"] = plot([("N*log2(1+10^(x/10)/N)","N×N MIMO","accent",False,2.6),("log2(1+10^(x/10))","single antenna","dim",True)],[0,30],[0,60],
  "With N antennas at each end the channel splits into N parallel streams, so capacity grows about N-fold with no extra bandwidth or power (ideal case, equal channel gains).",
  [P("N","antennas N",1,8,4,"",1)], [R("capacity at 20 dB","N*log2(1+100/N)","bit/s/Hz"), R("gain vs one antenna","N*log2(1+100/N)/log2(101)")], xlabel="SNR (dB)", ylabel="bit/s per Hz")

D["radar_systems"] = plot([("exp(-((x-6.67*R)/12)^2)","transmitted pulse (t = 0)","dim"),("exp(-((x-6.67*R)/12)^2)","echo","gold",False,2.8)],[0,1000],[0,1.2],
  "Radar measures the delay τ = 2R/c between sending a pulse and hearing its echo: every kilometre adds 6.7 µs. The Doppler shift f_d = 2v/λ of the echo gives the target's speed.",
  [P("R","target range R",1,150,60,"km"),P("v","speed v",0,300,100,"m/s")],
  [R("echo delay 2R/c","6.67*R","µs"), R("Doppler shift (10 GHz)","2*v/0.03","Hz"), R("echo power vs 10 km","-40*log10(R/10)","dB")], xlabel="time (µs)")
D["radar_systems"]["fns"][0]["f"]="exp(-(x/12)^2)"

D["robotics_mechatronics"] = S("geometry","A two-link robot arm: each joint angle moves the end effector. Forward kinematics gives its position, x = L₁cosθ₁ + L₂cos(θ₁+θ₂); the controller solves the reverse problem.",
  [P("t1","shoulder angle θ₁",-30,120,40,"°"),P("t2","elbow angle θ₂",-120,120,60,"°")],
  [R("end effector x","1*cos(rad(t1))+0.8*cos(rad(t1+t2))","m"), R("end effector y","1*sin(rad(t1))+0.8*sin(rad(t1+t2))","m")],
  range=[-2,2,-0.5,2], aspect=0.62, shapes=[
  {"k":"line","x1":0,"y1":0,"x2":"cos(rad(t1))","y2":"sin(rad(t1))","color":"accent","width":5},
  {"k":"line","x1":"cos(rad(t1))","y1":"sin(rad(t1))","x2":"cos(rad(t1))+0.8*cos(rad(t1+t2))","y2":"sin(rad(t1))+0.8*sin(rad(t1+t2))","color":"pink","width":4},
  {"k":"circle","x":0,"y":0,"r":0.07,"fill":"white"},{"k":"circle","x":"cos(rad(t1))","y":"sin(rad(t1))","r":0.06,"fill":"white"},
  {"k":"point","x":"cos(rad(t1))+0.8*cos(rad(t1+t2))","y":"sin(rad(t1))+0.8*sin(rad(t1+t2))","color":"gold","size":7},{"k":"line","x1":-2,"y1":0,"x2":2,"y2":0,"color":"dim","width":1}])

D["machine_learning_engineers"] = plot([("x^2","loss L(w) = w²","accent")],[-2.2,2.2],[0,5],
  "Training is gradient descent: step downhill on the loss, w ← w − η·dL/dw. A small learning rate crawls, a good one converges, and one above 1 overshoots and diverges. Watch the dot.",
  [P("lr","learning rate η",0.02,1.05,0.3)], [R("shrink per step 1−2η","abs(1-2*lr)"), R("step","floor(mod(t,10))")],
  points=[{"x":"2*(1-2*lr)^floor(mod(t,10))","y":"(2*(1-2*lr)^floor(mod(t,10)))^2","label":"w"}], xlabel="weight w", ylabel="loss")
D["machine_learning_engineers"]["readouts"][1]["label"]="iteration"

nodes=[N("a%d"%i,"x%d"%(i+1),6,18+i*32) for i in range(3)]+[N("w%d"%j,"w%d"%(j+1),24+j*26,5) for j in range(3)]
ed=[];nn=[]
for i in range(3):
    for j in range(3):
        nn.append(N("m%d%d"%(i,j),"MAC",24+j*26,22+i*30,color="gold"))
        ed.append(E("a%d"%i if j==0 else "m%d%d"%(i,j-1),"m%d%d"%(i,j)))
        ed.append(E("w%d"%j if i==0 else "m%d%d"%(i-1,j),"m%d%d"%(i,j)))
D["neural_accelerator_hw"] = blocks([N("a%d"%i,"x%d"%(i+1),6,22+i*30) for i in range(3)]+[N("w%d"%j,"w%d"%(j+1),24+j*26,5,color="pink") for j in range(3)]+nn,ed,
  "A systolic array: inputs flow in from the left and weights from the top, and each multiply-accumulate (MAC) cell passes data on to its neighbours. Thousands of MACs work in lock-step on matrix multiplication.", aspect=0.8)

D["image_video_processing"] = S("heatmap","A blurred disc (left) and the edges found by differentiating it (right, m = 1). Edge detectors respond where intensity changes quickly; more blur (σ) means weaker, wider edges.",
  [P("s","blur σ",0.05,0.6,0.15),P("m","0 = image, 1 = edges",0,1,0,"",1)], [R("edge strength (peak)","m>0.5 ? 1/(s*sqrt(pi)) : 1","")],
  f="m<0.5 ? 0.5*(1-erf((hypot(x,y)-1)/s)) : exp(-((hypot(x,y)-1)/s)^2)", x=[-1.6,1.6], y=[-1.6,1.6], equal=True)

D["biomedical_instrumentation"] = S("signal","An ECG records the heart's electrical cycle: P wave, QRS spike, T wave. Mains interference (60 Hz) can swamp it, which is why instrumentation amplifiers reject common-mode noise.",
  [P("hr","heart rate",40,180,75,"bpm"),P("nz","60 Hz pickup",0,0.4,0,"mV")], [R("beat interval","60/hr","s")],
  x=[0,4], y=[-0.6,1.4], f="0.12*exp(-((mod(x*hr/60,1)-0.2)/0.025)^2)-0.1*exp(-((mod(x*hr/60,1)-0.3)/0.01)^2)+1.0*exp(-((mod(x*hr/60,1)-0.32)/0.012)^2)-0.2*exp(-((mod(x*hr/60,1)-0.34)/0.012)^2)+0.3*exp(-((mod(x*hr/60,1)-0.55)/0.05)^2)+nz*sin(2*pi*60*x)", xlabel="time (s)", ylabel="mV")

D["medical_devices"] = blocks([N("h","heart",12,16,color="red"),N("s","sense",42,16),N("d","detect",72,16),N("t","timer",88,50,color="gold"),N("o","pulse out",60,84,color="pink"),N("l","lead",22,84)],
  [E("h","s"),E("s","d"),E("d","t"),E("t","o"),E("o","l"),E("l","h")],
  "A demand pacemaker senses the heart's own signal and only fires a pulse if no beat arrives in time. Sensing, timing and stimulation form a closed loop with the tissue.", aspect=0.75)

D["solar_pv_systems"] = blocks([N("sun","sun",8,16),N("pv","panels",32,16,color="gold"),N("mp","MPPT",57,16),N("inv","inverter",86,16),N("bat","battery",44,82,color="green"),N("grid","home + grid",82,82,color="pink")],
  [E("sun","pv"),E("pv","mp"),E("mp","inv"),E("inv","grid"),E("mp","bat",dashed=True),E("bat","inv",dashed=True)],
  "Panels make DC, a maximum-power-point tracker keeps them at their best voltage, and an inverter turns it into AC for the house or grid. Daily energy = size × sun hours × performance ratio.",
  [P("kw","array size",1,10,5,"kWp"),P("sh","peak sun hours",2,7,4.5,"h"),P("pr","performance ratio",0.6,0.9,0.78)],
  [R("energy per day","kw*sh*pr","kWh"), R("per year","kw*sh*pr*365","kWh")], aspect=0.62)

D["wind_energy_systems"] = plot([("(x<3||x>25) ? 0 : min(Pr,0.5*1.225*3.14159*D^2/4*Cp*x^3/1e6)","turbine output","accent",False,2.6),("(x<3||x>25) ? 0 : 0.5*1.225*3.14159*D^2/4*0.593*x^3/1e6","Betz limit (Cp = 0.593)","dim",True)],[0,30],[0,16],
  "Wind power grows with v³, so doubling wind speed gives eight times the power, until the turbine caps it at its rating by pitching the blades. Bigger rotors catch more wind at every speed.",
  [P("D","rotor diameter",50,180,120,"m"),P("Cp","power coefficient Cp",0.2,0.5,0.45),P("Pr","rated power",1,15,8,"MW")],
  [R("wind needed for rated power","(Pr*1e6/(0.5*1.225*3.14159*D^2/4*Cp))^(1/3)","m/s")], xlabel="wind speed (m/s)", ylabel="power (MW)")

D["battery_storage_systems"] = plot([("3.5+0.7*(1-x)-0.6*exp(-15*(1-x))-r*C","terminal voltage","accent")],[0,1],[2.5,4.4],
  "A cell's voltage falls as it empties, and falls further when discharged fast because current flows through its internal resistance. Higher C-rates deliver less usable energy before reaching the cut-off.",
  [P("C","discharge rate",0.2,3,1,"C"),P("r","resistance drop",0.02,0.15,0.06,"V per C")],
  [R("voltage sag","r*C","V"), R("heat loss as % of power","100*r*C/3.7","%")],
  hlines=[{"y":3,"label":"cut-off 3.0 V","color":"red"}], xlabel="capacity delivered (fraction)", ylabel="voltage (V)")

D["ev_motor_control"] = S("geometry","Field-oriented control views the motor from the rotating rotor frame (d, q). The stator current is steered relative to the d axis; the q-axis part makes torque. Raise γ and the torque component grows.",
  [P("I","current magnitude",0.2,1,0.8,"pu"),P("g","current angle γ from d axis",0,90,60,"°")],
  [R("d-axis current I_d","I*cos(rad(g))","pu"), R("q-axis current I_q (torque)","I*sin(rad(g))","pu")],
  range=[-1.5,1.5,-1.3,1.3], aspect=0.75, shapes=[
  {"k":"circle","x":0,"y":0,"r":1,"color":"dim","width":1},
  {"k":"arrow","x1":0,"y1":0,"x2":"cos(2*t)","y2":"sin(2*t)","color":"accent","width":2.5},{"k":"text","x":"1.15*cos(2*t)","y":"1.15*sin(2*t)","text":"d","color":"accent"},
  {"k":"arrow","x1":0,"y1":0,"x2":"-sin(2*t)*0.7","y2":"cos(2*t)*0.7","color":"green","width":2},{"k":"text","x":"-0.85*sin(2*t)","y":"0.85*cos(2*t)","text":"q","color":"green"},
  {"k":"arrow","x1":0,"y1":0,"x2":"I*cos(2*t+rad(g))","y2":"I*sin(2*t+rad(g))","color":"gold","width":3},{"k":"text","x":"(I+0.12)*cos(2*t+rad(g))","y":"(I+0.12)*sin(2*t+rad(g))","text":"I","color":"gold"}])

D["nanotech_mems"] = plot([("100*x*9.81/(2*pi*f0*1000)^2/(d*1e-6)","(C₁ − C₂)/(C₁ + C₂)","accent")],[-20,20],None,
  "A MEMS accelerometer is a proof mass on springs between capacitor plates. Acceleration moves the mass, one gap shrinks and the other grows, and the capacitance difference ΔC/C ≈ Δd/d measures it.",
  [P("f0","resonance f₀",2,10,5,"kHz"),P("d","gap d",1,4,2,"µm")],
  [R("mass shift per g","9.81/(2*pi*f0*1000)^2*1e9","nm"), R("rest capacitance (100 µm plate)","88.54/d","fF")], xlabel="acceleration (g)", ylabel="ΔC/C (%)")

D["quantum_computing_hardware"] = plot([("0.5*(1-exp(-x/T2)*cos(W*x))","probability of |1⟩","accent")],[0,10],[0,1.05],
  "Driving a qubit makes it oscillate between |0⟩ and |1⟩ (Rabi oscillation). Decoherence damps the oscillation over the coherence time T₂, which limits how many operations fit before the information is lost.",
  [P("W","drive Rabi frequency",1,10,4,"rad/µs"),P("T2","coherence time T₂",1,20,6,"µs")],
  [R("π-pulse (flip) time","pi/W","µs"), R("flips before decay","T2*W/pi")], xlabel="time (µs)")

D["computer_networks_iot"] = blocks([N("s1","sensor",9,12),N("s2","sensor",9,50),N("s3","sensor",9,88),N("gw","gateway",36,50,color="gold"),N("net","internet",65,50),N("cl","cloud",91,18,color="accent"),N("ap","app",91,82,color="green")],
  [E("s1","gw","radio"),E("s2","gw"),E("s3","gw"),E("gw","net","IP"),E("net","cl"),E("net","ap")],
  "Many tiny low-power sensors talk by radio to a gateway, which forwards their data over the internet to cloud services and apps. Billions of such nodes form the Internet of Things.", aspect=0.65)

D["hardware_security"] = chain(["Boot ROM","Bootloader","Kernel","App"],
  "A chain of trust: immutable ROM code verifies the bootloader's signature, which verifies the kernel, and so on. A tampered stage fails its check and the device refuses to start it.",
  per=2, colors={0:"gold"}, edge_labels={0:"verify",1:"verify",2:"verify"})
