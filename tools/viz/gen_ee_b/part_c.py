from common import *
D = {}
# ---------------- POWER ----------------
D["magnetic_circuits"] = plot([("1.8*tanh(4e-7*pi*N*x/(g*1e-3+1.5e-4)/1.8)","core flux density B","accent")],[0,5],[0,2],
  "A magnetic circuit obeys the same rule as an electric one: mmf = N·I = Φ·ℜ. An air gap adds a large reluctance, so for the same current the flux is far lower and the core stays out of saturation.",
  [P("g","air gap g",0,3,0.5,"mm",0.1),P("N","turns N",200,1000,500,"",50),P("Ip","current I",0,5,2,"A")],
  [R("gap reluctance ÷ core reluctance","g*1e-3*2000/0.3"), R("flux density at that current","1.8*tanh(4e-7*pi*N*Ip/(g*1e-3+1.5e-4)/1.8)","T")],
  points=[{"x":"Ip","y":"1.8*tanh(4e-7*pi*N*Ip/(g*1e-3+1.5e-4)/1.8)"}], xlabel="current (A)", ylabel="B (T)")

D["power_transformers"] = plot([("100*x/(x+Pfe/100+x^2*Pcu/100)","efficiency","accent")],[0.01,1.2],[80,100],
  "Iron loss is fixed while copper loss grows as load². Efficiency peaks where the two are equal, at load √(P_fe/P_cu), so grid transformers are sized to run near that point.",
  [P("Pfe","core loss (of rating)",0.1,1,0.3,"%"),P("Pcu","full-load copper loss",0.5,3,1,"%")],
  [R("best load fraction","sqrt(Pfe/Pcu)"), R("peak efficiency","100*sqrt(Pfe/Pcu)/(sqrt(Pfe/Pcu)+Pfe/100+(Pfe/Pcu)*Pcu/100)","%")],
  points=[{"x":"sqrt(Pfe/Pcu)","y":"100*sqrt(Pfe/Pcu)/(sqrt(Pfe/Pcu)+Pfe/100+(Pfe/Pcu)*Pcu/100)","label":"peak"}], xlabel="load (fraction of rating)", ylabel="efficiency (%)")

D["dc_machines"] = plot([("max(0,0.1*(V-0.1*x)/R)","motor torque","accent")],[0,500],[0,5],
  "A DC motor's torque falls linearly with speed because its back-EMF E = kω opposes the supply. The operating point is where this line meets the load torque.",
  [P("V","supply V",6,48,24,"V"),P("R","armature R",0.5,4,1.5,"Ω"),P("TL","load torque",0,3,1,"N·m",0.1)],
  [R("speed at this load","max(0,(V-R*TL/0.1)/0.1)*60/(2*pi)","rpm"), R("no-load speed","V/0.1*60/(2*pi)","rpm"), R("stall torque","0.1*V/R","N·m")],
  points=[{"x":"max(0,(V-R*TL/0.1)/0.1)","y":"min(TL,0.1*V/R)","label":"operating point"}], xlabel="speed (rad/s)", ylabel="torque (N·m)")

D["induction_motor"] = plot([("2*2.5/(x/sm+sm/x)","torque (× rated)","accent")],[0.001,1],[0,3],
  "An induction motor's rotor must slip behind the rotating field to get any torque. Torque peaks at the breakdown slip, then falls toward standstill (slip 1); normal running is on the steep left part.",
  [P("sm","breakdown slip",0.05,0.4,0.12),P("s","operating slip s",0.01,0.2,0.03)],
  [R("speed (4-pole, 50 Hz)","1500*(1-s)","rpm"), R("torque at this slip","5/(s/sm+sm/s)","× rated"), R("starting torque","5/(1/sm+sm)","× rated")],
  points=[{"x":"s","y":"5/(s/sm+sm/s)","label":"running"}], xlabel="slip s", ylabel="torque")

D["synchronous_machines"] = plot([("E/Xs*sin(rad(x))","power P = (EV/Xs) sinδ","accent")],[0,180],[0,4],
  "The rotor stays locked to the grid's rotating field, lagging by the load angle δ. Power rises with sinδ up to 90°; beyond that the machine loses synchronism.",
  [P("E","excitation E",0.5,2,1.2,"pu"),P("Xs","reactance Xs",0.5,2,1,"pu"),P("d","load angle δ",0,180,30,"°")],
  [R("maximum power","E/Xs","pu"), R("power at δ","E/Xs*sin(rad(d))","pu")],
  vlines=[{"x":90,"label":"stability limit"}], points=[{"x":"d","y":"E/Xs*sin(rad(d))"}], xlabel="load angle δ (°)", ylabel="power (pu, V = 1)")

D["power_generation"] = chain(["Fuel","Boiler","Turbine","Generator","Transformer","Grid"],
  "Most generation is heat to motion to electricity. Each stage loses energy, and the turbine's thermodynamic limit loses the most, so only about a third of coal's energy reaches the grid.",
  per=3, params=[P("eb","boiler efficiency",0.8,0.95,0.88),P("et","turbine cycle efficiency",0.3,0.6,0.42),P("eg","generator efficiency",0.95,0.99,0.98)],
  readouts=[R("overall efficiency","eb*et*eg*100","%"), R("lost as heat (per 100 units)","100-eb*et*eg*100")])

D["transmission_distribution"] = plot([("100*P*R/x^2","line loss","accent")],[50,800],[0,15],
  "For a given power, current falls as 1/V and I²R loss as 1/V². Raising the voltage fourfold cuts the loss sixteenfold, which is why long lines run at hundreds of kilovolts.",
  [P("P","power carried",50,500,100,"MW"),P("R","line resistance",2,30,10,"Ω"),P("V","line voltage",66,765,230,"kV")],
  [R("loss at this voltage","100*P*R/V^2","%"), R("line current","P/(1.732*V)","kA")],
  points=[{"x":"V","y":"100*P*R/V^2"}], xlabel="transmission voltage (kV)", ylabel="loss (% of power)")

D["per_unit_system"] = plot([("x*S/V^2","Z in per-unit","accent")],[0,400],None,
  "Per-unit quantities divide by a base, so a 345 kV line and a 13.8 kV generator can share one equation. Change the base and the same ohmic impedance becomes a different per-unit number.",
  [P("S","base power",50,500,100,"MVA"),P("V","base voltage",69,345,138,"kV"),P("Zo","impedance",5,300,50,"Ω")],
  [R("base impedance V²/S","V^2/S","Ω"), R("impedance in pu","Zo*S/V^2","pu")],
  points=[{"x":"Zo","y":"Zo*S/V^2"}], xlabel="impedance (Ω)", ylabel="per-unit")

D["power_flow_analysis"] = plot([("sqrt((1+sqrt(1-4*x^2*X^2))/2)","upper (normal) solution","accent"),("sqrt((1-sqrt(1-4*x^2*X^2))/2)","lower (unstable) solution","pink",True)],[0,4],[0,1.05],
  "Voltage at a load falls as it draws more power, down to a nose beyond which no solution exists: voltage collapse. A longer, more reactive line (bigger X) has its nose much earlier.",
  [P("X","line reactance X",0.1,0.5,0.25,"pu"),P("Pl","load P",0.1,3,1,"pu")],
  [R("maximum loadability 1/(2X)","1/(2*X)","pu"), R("voltage at load","sqrt((1+sqrt(1-4*Pl^2*X^2))/2)","pu")],
  points=[{"x":"Pl","y":"sqrt((1+sqrt(1-4*Pl^2*X^2))/2)"}], xlabel="load power P (pu, unity pf)", ylabel="load voltage (pu)")

D["fault_analysis"] = plot([("sin(0.377*x+rad(a)-atan(XR))-exp(-x*0.377/XR)*sin(rad(a)-atan(XR))","fault current (× symmetric peak)","accent",False,2.4),("-exp(-x*0.377/XR)*sin(rad(a)-atan(XR))","decaying DC offset","gold",True)],[0,100],[-2.2,2.2],
  "A short circuit current is a sine plus a decaying DC offset set by the X/R ratio and the instant the fault starts. The first peak can reach nearly twice the steady value, which breakers must withstand.",
  [P("XR","system X/R",1,40,10),P("a","fault inception angle",0,180,0,"°")],
  [R("DC time constant X/(ωR)","XR/0.377","ms"), R("worst-case first-peak factor","1+exp(-pi/XR)")], xlabel="time (ms, 60 Hz)")

D["protection_relays_breakers"] = plot([("T1*0.14/(x^0.02-1)","upstream relay","accent"),("0.1*0.14/(x^0.02-1)","downstream relay","pink")],[1.5,20],[0.05,100],
  "An inverse-time relay trips fast for big faults and slowly for small overloads. Setting the upstream relay slower than the downstream one means only the nearest breaker trips: coordination.",
  [P("T1","upstream time multiplier",0.05,1,0.3),P("I","fault current (× pickup)",1.5,20,10)],
  [R("downstream trips in","0.1*0.14/(I^0.02-1)","s"), R("upstream trips in","T1*0.14/(I^0.02-1)","s"), R("margin (aim ≥ 0.3 s)","(T1-0.1)*0.14/(I^0.02-1)","s")],
  logx=True, logy=True, vlines=[{"x":"I","label":"fault"}], xlabel="current / pickup", ylabel="trip time (s)")

_load = "(22+6*exp(-((x-19)/2.5)^2)+3*exp(-((x-8)/2.5)^2))"; _sol = "Sc*max(0,sin(pi*(x-6)/12))^1.5"
D["grid_renewables_smart"] = plot([(_load,"demand","dim"),("%s-%s"%(_load,_sol),"net load (demand − solar)","accent",False,2.8),(_sol,"solar output","gold",True)],[0,24],[0,35],
  "Solar covers the midday peak but not the evening one, carving a 'duck curve' in what other plants must supply. The steep evening ramp is why storage and flexible demand matter.",
  [P("Sc","solar capacity",0,25,12,"GW")],
  [R("midday net load","22+6*exp(-((13-19)/2.5)^2)+3*exp(-((13-8)/2.5)^2)-Sc*sin(pi*7/12)^1.5","GW"), R("evening ramp 17→20 h","(22+6*exp(-((20-19)/2.5)^2)+3*exp(-((20-8)/2.5)^2))-(22+6*exp(-((17-19)/2.5)^2)+3*exp(-((17-8)/2.5)^2))+Sc*max(0,sin(pi*11/12))^1.5*0+Sc*0","GW")],
  xlabel="hour of day", ylabel="power (GW)")
D["grid_renewables_smart"]["readouts"][1]["value"]="((22+6*exp(-((20-19)/2.5)^2)+3*exp(-((20-8)/2.5)^2))-Sc*max(0,sin(pi*14/12))^1.5)-((22+6*exp(-((17-19)/2.5)^2)+3*exp(-((17-8)/2.5)^2))-Sc*max(0,sin(pi*11/12))^1.5)"

D["rectifiers_inverters"] = plot([("sin(2*pi*x)","AC input","dim",True),("max(abs(sin(2*pi*x)),exp(-mod(x-0.25,0.5)/tau))","rectified + filter capacitor","accent",False,2.8)],[0,2],[-1.15,1.15],
  "A bridge rectifier flips the negative half-cycles; a capacitor then holds the voltage between peaks. A bigger RC (τ, in mains cycles) gives smoother DC. An inverter runs the same idea in reverse.",
  [P("tau","RC time constant",0.05,3,0.6,"cycles")], [R("ripple (peak-to-peak) ≲","100*(1-exp(-0.5/tau))","% of peak")], xlabel="time (mains cycles)")

D["buck_converter_node"] = plot([("12*(mod(x,10)<10*D)","switch node V_sw","pink"),("2-(12*D*(1-D)*10/L)/2+(mod(x,10)<10*D ? (12-12*D)/L*mod(x,10) : (12-12*D)/L*10*D-12*D/L*(mod(x,10)-10*D))","inductor current I_L","accent",False,2.6)],[0,30],[-1,14],
  "A switch chops 12 V into pulses and an inductor averages them to V_out = D·V_in. The inductor current ramps up while the switch is on and down while it is off; a bigger L shrinks the ripple.",
  [P("D","duty cycle D",0.1,0.9,0.42),P("L","inductance L",10,100,22,"µH")],
  [R("output voltage","12*D","V"), R("current ripple ΔI","12*D*(1-D)*10/L","A p-p")], xlabel="time (µs, 100 kHz switching)", ylabel="V  |  A")

D["boost_buckboost"] = plot([("1/(1-x)","boost 1/(1−D)","accent"),("x/(1-x)","buck-boost |D/(1−D)|","gold"),("x","buck D","dim"),("1/(1-x)/(1+r/(1-x)^2)","real boost with losses","pink",True)],[0,0.9],[0,10],
  "A boost converter steps voltage up by 1/(1−D). Real inductor resistance (r) makes the gain collapse at high duty cycle, so practical converters stay below about 0.8.",
  [P("D","duty cycle D",0.05,0.9,0.5),P("r","loss ratio R_L/R",0,0.1,0.02)],
  [R("ideal boost output (12 V in)","12/(1-D)","V"), R("real boost output","12/(1-D)/(1+r/(1-D)^2)","V")],
  points=[{"x":"D","y":"1/(1-D)","color":"accent"}], xlabel="duty cycle D", ylabel="V_out / V_in")

D["smps_switching_supplies"] = blocks([N("ac","AC in",11,18),N("br","bridge",36,18),N("sw","switch",61,18,color="gold"),N("tx","xfmr",86,18),N("r2","rectify",86,52),N("lc","LC filter",61,52),N("out","DC out",36,52,color="green"),N("pw","PWM control",61,86,color="pink")],
  [E("ac","br"),E("br","sw"),E("sw","tx"),E("tx","r2"),E("r2","lc"),E("lc","out"),E("out","pw","opto feedback"),E("pw","sw","duty")],
  "A switching supply rectifies the mains, chops it at high frequency through a small transformer, rectifies again and filters. Feedback to the PWM controller adjusts the duty cycle to hold the output steady.", aspect=0.72)

D["motor_drives"] = plot([("min(1,x/fb)","voltage (pu)","accent"),("min(1,fb/x)","flux and torque capability (pu)","pink")],[0.5,100],[0,1.2],
  "Constant volts-per-hertz control keeps the motor's magnetic flux, and so its torque, constant up to the base frequency. Above it the voltage is maxed out and torque falls ('field weakening').",
  [P("fb","base frequency",30,60,50,"Hz"),P("f","output frequency",5,100,30,"Hz")],
  [R("speed (4-pole)","120*f/4","rpm"), R("voltage needed","min(1,f/fb)*100","% of rated")],
  points=[{"x":"f","y":"min(1,f/fb)","color":"accent"}], xlabel="frequency (Hz)")

D["power_semiconductors"] = plot([("5.9e-9*x^2.5","silicon","dim"),("2e-11*x^2.5","SiC","accent"),("4e-12*x^2.5","GaN","pink")],[100,5000],[1e-6,100],
  "A switch that blocks more voltage needs a thicker, more lightly doped region, so its on-resistance rises roughly as V^2.5. SiC and GaN tolerate far stronger fields and beat silicon's theoretical limit by orders of magnitude.",
  [P("Vr","voltage rating",100,3000,650,"V")], [R("silicon limit","5.9e-9*Vr^2.5*1000","mΩ·cm²"), R("SiC limit","2e-11*Vr^2.5*1000","mΩ·cm²"), R("GaN limit","4e-12*Vr^2.5*1000","mΩ·cm²")],
  logx=True, logy=True, vlines=[{"x":"Vr","label":"rating"}], xlabel="breakdown voltage (V)", ylabel="specific R_on (Ω·cm²)")

# ---------------- LABS ----------------
D["oscilloscope"] = S("signal","An oscilloscope plots voltage against time on a grid of 10 × 8 divisions. Turn the timebase to see more or fewer cycles and the volts/div knob to fill the screen without clipping.",
  [P("tdiv","timebase",0.1,1,0.25,"ms/div"),P("vdiv","vertical scale",0.2,2,0.5,"V/div"),P("A","signal amplitude",0.2,3,1.5,"V")],
  [R("cycles on screen (1 kHz)","10*tdiv"), R("peak-to-peak","2*A","V"), R("fills","A/vdiv","divisions")],
  x=[0,"10*tdiv"], y=["-4*vdiv","4*vdiv"], f="A*sin(2*pi*x)", xlabel="time (ms)")

D["multimeter"] = plot([("100/(1+x/(Rm*1000))","reading as % of true voltage","accent")],[1,10000],[0,105],
  "A voltmeter is a resistor in parallel with the circuit. When the source resistance is comparable to the meter's input resistance, the reading falls below the true voltage: loading error.",
  [P("Rm","meter input resistance",1,100,10,"MΩ"),P("Rs","source resistance",10,5000,1000,"kΩ")],
  [R("reading error","100*Rs/(Rs+Rm*1000)","%")],
  points=[{"x":"Rs","y":"100/(1+Rs/(Rm*1000))"}], logx=True, xlabel="source resistance (kΩ)", ylabel="meter reading (%)")

D["function_generator"] = S("signal","A function generator makes sine, square, triangle and sawtooth waves of chosen frequency, amplitude and offset. The spectrum shows why a square wave sounds harsher: it carries odd harmonics.",
  [P("sh","0 sine · 1 square · 2 triangle · 3 saw",0,3,1,"",1),P("fr","frequency",1,6,2,"kHz",0.5),P("A","amplitude",0.5,5,2,"V"),P("off","DC offset",-2,2,0,"V")],
  [R("period","1/fr","ms"), R("peak-to-peak","2*A","V")],
  x=[0,2], y=[-7.5,7.5], f="off+A*(sh==0 ? sin(2*pi*fr*x) : (sh==1 ? square(2*pi*fr*x) : (sh==2 ? tri(2*pi*fr*x) : saw(2*pi*fr*x))))", spectrum=True, fmax=25, xlabel="time (ms)")

D["bench_power_supply"] = plot([("x<=Ilim ? Vs : max(0,Vs-(x-Ilim)*80)","supply output","accent",False,2.6),("R*x","load line V = R·I","pink")],[0,3],[0,16],
  "A bench supply holds the set voltage (constant voltage) until the load tries to draw more than the current limit; then it holds the current instead (constant current) and the voltage drops. The dot is where supply and load meet.",
  [P("Vs","set voltage",1,15,5,"V"),P("Ilim","current limit",0.1,3,1,"A",0.1),P("R","load resistance",1,30,8,"Ω")],
  [R("output current","min(Vs/R,Ilim)","A"), R("output voltage","R*min(Vs/R,Ilim)","V"), R("current-limited? (1 = yes)","Vs/R>Ilim")],
  points=[{"x":"min(Vs/R,Ilim)","y":"R*min(Vs/R,Ilim)","label":"operating point"}], xlabel="current (A)", ylabel="voltage (V)")

D["logic_analyzer"] = plot([("3.4+0.8*(mod(x,1)>=0.5)","CLK","gold"),("1.7+0.8*mod(floor(P/2^floor(x)),2)","DATA","accent"),("0.8*(x>7.95||x<0.05)","CS","pink")],[0,8],[-0.4,4.6],
  "A logic analyzer records many digital lines at once. Here a serial byte is clocked out LSB first; the gold dots mark where each bit is sampled (rising clock edge). Change the byte and read the waveform.",
  [P("P","byte sent",0,255,178,"",1)], [R("decoded value","P")],
  points=[{"x":k+0.5,"y":"1.7+0.8*mod(floor(P/2^%d),2)"%k,"color":"gold"} for k in range(8)], xlabel="clock cycle")

D["spectrum_analyzer"] = plot([("10*log10(exp(-((x-10)/rb)^2)+10^(hd/10)*exp(-((x-20)/rb)^2)+10^((hd-12)/10)*exp(-((x-30)/rb)^2)+1e-9*rb/0.1)","displayed spectrum","accent")],[0,40],[-100,5],
  "A spectrum analyzer shows power versus frequency in dB. A 10 MHz carrier has weak harmonics at 20 and 30 MHz. A narrower resolution bandwidth sharpens peaks and lowers the noise floor, but sweeps more slowly.",
  [P("rb","resolution bandwidth",0.05,2,0.3,"MHz"),P("hd","2nd harmonic",-70,-20,-45,"dBc")],
  [R("noise floor","10*log10(1e-9*rb/0.1)","dBc"), R("3rd harmonic","hd-12","dBc")], xlabel="frequency (MHz)", ylabel="level (dB rel. carrier)")

def bb():
    sh=[{"k":"rect","x":-0.8,"y":-0.9,"w":10,"h":8,"fill":"white","alpha":0.06,"color":"dim","width":1},{"k":"text","x":4.2,"y":3.3,"text":"centre gap","color":"dim","size":9}]
    for i in range(8):
        for j in range(5):
            sh.append({"k":"point","x":round(i*1.2,2),"y":round(3.7+0.6*j,2),"color":"white","size":3,"alpha":0.5})
            sh.append({"k":"point","x":round(i*1.2,2),"y":round(2.9-0.6*j,2),"color":"white","size":3,"alpha":0.5})
    sh.append({"k":"rect","x":"(col-1)*1.2-0.3","y":"h==0 ? 3.4 : 0.2","w":0.6,"h":3,"fill":"gold","alpha":0.3,"color":"gold"})
    for j in range(5):
        sh.append({"k":"point","x":"(col-1)*1.2","y":round(3.7+0.6*j,2),"color":"gold","size":5,"when":"h==0"})
        sh.append({"k":"point","x":"(col-1)*1.2","y":round(2.9-0.6*j,2),"color":"gold","size":5,"when":"h==1"})
    return sh
D["breadboarding"] = S("geometry","Inside a breadboard the five holes of each column strip are connected, and the two halves are separate across the centre gap. Pick a column and half to see which holes share a node.",
  [P("col","column",1,8,3,"",1),P("h","0 = top half, 1 = bottom half",0,1,0,"",1)], [R("holes in the strip","5")],
  range=[-1,9.4,-1.2,7.4], aspect=0.85, shapes=bb())

D["soldering"] = plot([("Tiron-(Tiron-25)*exp(-x/tau)","joint temperature","accent")],[0,10],[0,420],
  "Solder only flows once the joint itself is above its melting point (217 °C for lead-free). A bigger pad or ground plane (larger time constant) takes longer to heat, so a hotter iron or more patience is needed.",
  [P("Tiron","iron temperature",250,400,330,"°C"),P("tau","thermal time constant",0.3,5,1.5,"s")],
  [R("time to melt solder","-tau*ln((Tiron-217)/(Tiron-25))","s")],
  hlines=[{"y":217,"label":"lead-free solder melts","color":"gold"}], xlabel="time on joint (s)", ylabel="temperature (°C)")

D["troubleshooting"] = chain(["Symptom","Check power","Check signals","Split in half","Fix","Verify"],
  "Troubleshoot methodically: start with power, then trace signals, and halve the circuit to isolate the fault. After the fix, verify; if it still fails, go back to the symptom.",
  per=3, extra=[(5,0,"still failing?")], colors={4:"green"})

D["pcb_design"] = chain(["Schematic","Netlist","Placement","Routing","DRC","Gerbers","Fab"],
  "A board starts as a schematic, becomes a netlist of connections, then components are placed and traces routed. Design-rule checks catch errors before Gerber files go to the fab.", per=3, colors={5:"gold"}, extra=[(4,2,"fix")])

_dat = [(1,0.14),(2,0.17),(3,0.33),(4,0.36),(5,0.55),(6,0.58)]
_n=len(_dat); _sx=sum(x for x,y in _dat); _sy=sum(y for x,y in _dat); _sxx=sum(x*x for x,y in _dat); _sxy=sum(x*y for x,y in _dat)
_mb=(_n*_sxy-_sx*_sy)/(_n*_sxx-_sx**2); _bb=(_sy-_mb*_sx)/_n
_best=sum((y-(_mb*x+_bb))**2 for x,y in _dat)*1000
_ssr="1000*("+"+".join("(%g-(m*%d+b))^2"%(y,x) for x,y in _dat)+")"
D["lab_reports_data"] = plot([("m*x+b","your fitted line","gold")],[0,7],[0,0.75],
  "Plot measured points with a fitted line and quantify the fit. Adjust slope and intercept by hand to minimise the sum of squared residuals; least squares finds the exact best line.",
  [P("m","slope m",0,0.2,0.07,"V/mA",0.005),P("b","intercept b",-0.1,0.2,0.1,"V",0.005)],
  [R("sum of squared residuals",_ssr,"×10⁻³ V²"), R("least-squares minimum","%.3f"%_best,"×10⁻³ V²"), R("resistance from slope","m*1000","Ω")],
  points=[{"x":x,"y":y,"color":"accent","r":5} for x,y in _dat], xlabel="current (mA)", ylabel="voltage (V)")

D["measurement_error"] = plot([("gauss(x,5,sd)","single reading","pink"),("gauss(x,5,sd/sqrt(N))","average of N readings","accent",False,2.6)],[4.5,5.5],None,
  "Repeated readings scatter around the true value with spread σ. Averaging N of them shrinks the uncertainty of the mean to σ/√N, so four times the readings halve the error.",
  [P("sd","spread σ of one reading",0.02,0.2,0.1,"V"),P("N","readings averaged N",1,100,16,"",1)],
  [R("uncertainty of mean σ/√N","sd/sqrt(N)","V"), R("relative uncertainty","sd/sqrt(N)/5*100","%"), R("95 % interval ±","2*sd/sqrt(N)","V")],
  vlines=[{"x":5,"label":"true 5.00 V"}], xlabel="measured voltage (V)", ylabel="probability density")

D["lab_electrical_safety"] = S("bars","Current, not voltage, hurts, and a few tens of milliamps across the chest can be fatal. Body resistance sets the current: wet skin can be a hundred times worse than dry. The pink bar is your chosen case.",
  [P("V","touch voltage",12,240,120,"V"),P("Rb","body resistance",1,100,10,"kΩ")], [R("current through body","V/Rb","mA")],
  bars=[{"label":"tingle","value":1},{"label":"can't let go","value":10},{"label":"breathing","value":30},{"label":"fibrillation","value":100},{"label":"your case","value":"V/Rb","color":"pink"}], logy=True, ylabel="mA (log scale)")
