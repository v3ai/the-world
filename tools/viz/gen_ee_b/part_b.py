from common import *
D = {}
# ---------------- DEVICES ----------------
def crystal():
    sh = []
    layers = {"accent":[(i,j) for i in range(3) for j in range(3)]+[(.5+i,.5+j) for i in range(2) for j in range(2)],
      "blue":[(.5+i,j) for i in range(2) for j in range(3)]+[(i,.5+j) for i in range(3) for j in range(2)],
      "gold":[(.25+i,.25+j) for i in range(2) for j in range(2)]+[(.75+i,.75+j) for i in range(2) for j in range(2)],
      "pink":[(.25+i,.75+j) for i in range(2) for j in range(2)]+[(.75+i,.25+j) for i in range(2) for j in range(2)]}
    fcc = set(layers["accent"]+layers["blue"])
    for (u,v) in layers["gold"]+layers["pink"]:
        for du,dv in [(.25,.25),(.25,-.25),(-.25,.25),(-.25,-.25)]:
            p=(u+du,v+dv)
            if p in fcc: sh.append({"k":"line","x1":"%g*a"%u,"y1":"%g*a"%v,"x2":"%g*a"%p[0],"y2":"%g*a"%p[1],"color":"dim","width":1.2})
    for c,pts in layers.items():
        for (u,v) in pts: sh.append({"k":"point","x":"%g*a"%u,"y":"%g*a"%v,"color":c,"size":5})
    for i in range(2):
        for j in range(2): sh.append({"k":"rect","x":"%d*a"%i,"y":"%d*a"%j,"w":"a","h":"a","color":"white","alpha":0.35,"width":1})
    return sh
D["crystal_structure_ee"] = S("geometry","Top view of the silicon diamond lattice: each atom bonds to four neighbours. Colours show the four heights within a cell (white boxes). Stretch the lattice constant to see density fall.",
  [P("a","lattice constant a",0.4,0.7,0.543,"nm",0.001)],
  [R("atom density 8/a³","0.8/a^3","×10²² cm⁻³"), R("bond length √3a/4","sqrt(3)*a/4","nm")],
  range=[-0.15,1.55,-0.15,1.55], aspect=0.95, shapes=crystal())

D["carrier_statistics"] = plot([("1/(1+exp(x/(8.617e-5*T)))","Fermi–Dirac f(E)","accent")],[-0.4,0.4],[0,1.05],
  "f(E) is the probability that a state at energy E is filled. At low temperature it is a sharp step at the Fermi level; heating smears it over a few kT.",
  [P("T","temperature",50,600,300,"K")], [R("kT","8.617e-5*T","eV"), R("transition width ≈ 4kT","4*8.617e-5*T","eV")],
  hlines=[{"y":0.5,"label":"½ at E_F"}], xlabel="E − E_F (eV)", ylabel="occupation f")

_vbi = "(0.0259*ln(10^p*1e16/1e20))"
def Wf(v): return "1e4*sqrt(2*1.0359e-12*(%s-%s)*(1/10^p+1/1e16)/1.602e-19)"%(_vbi,v)
D["pn_junction_physics"] = plot([(Wf("x"),"depletion width W (µm)","accent")],[-10,0.6],None,
  "Reverse bias widens the depletion region and lowers the junction capacitance C = εA/W; forward bias squeezes it. The lighter-doped side (here 10¹⁶ cm⁻³) takes most of the width.",
  [P("p","log₁₀ N_a (N_d = 10¹⁶)",15,18,17,""), P("Vb","bias voltage",-10,0.5,-3,"V")],
  [R("W at this bias",Wf("Vb"),"µm"), R("capacitance per area","10.359/(%s)"%Wf("Vb"),"nF/cm²"), R("built-in V_bi",_vbi,"V")],
  points=[{"x":"Vb","y":Wf("Vb"),"label":"bias"}], xlabel="applied voltage (V)", ylabel="W (µm)")

_ic = lambda ib: "beta*%g/1000*(1+x/VA)*(1-exp(-x/0.2))"%ib
D["bjt_physics_deep"] = plot([(_ic(i),"I_B = %d µA"%i) for i in (10,20,30,40)],[0,10],[0,17],
  "Collector current is β times the base current, but it creeps upward with V_CE because the base narrows (the Early effect). The slope sets the output resistance r_o = V_A/I_C.",
  [P("beta","gain β",50,300,100),P("VA","Early voltage V_A",30,200,75,"V")],
  [R("r_o at I_B = 30 µA","VA/(beta*0.03)","kΩ"), R("g_m = I_C/V_T","beta*0.03/0.02585","mS")], xlabel="V_CE (V)", ylabel="I_C (mA)")

D["mosfet_physics_deep"] = plot([("1e-7*10^((min(x,Vt)-Vt)/(S/1000)) + 1e-4*max(x-Vt,0)^2","drain current","accent")],[0,1],[1e-13,1e-3],
  "On a log scale the subthreshold region is a straight line: current falls one decade per S millivolts of gate voltage. Physics limits S to kT/q·ln10 ≈ 60 mV/dec at room temperature.",
  [P("Vt","threshold V_T",0.2,0.7,0.4,"V"),P("S","swing S",60,120,70,"mV/dec")],
  [R("ideal limit","0.02585*ln(10)*1000","mV/dec"), R("I_on/I_off (V_GS = 1 V)","(1e-7+1e-4*(1-Vt)^2)/(1e-7*10^(-Vt/(S/1000)))")],
  logy=True, xlabel="V_GS (V)", ylabel="I_D (A)", vlines=[{"x":"Vt","label":"V_T"}])

D["short_channel_effects"] = plot([("0.45-0.5*exp(-x/lam)","V_T at low V_DS","accent"),("0.45-0.8*exp(-x/lam)","V_T at high V_DS","pink")],[10,200],[0,0.5],
  "As the channel gets shorter the drain starts to steal control from the gate: threshold voltage rolls off, and a high drain voltage lowers it further (DIBL). A smaller λ means better gate control.",
  [P("lam","control length λ",10,50,25,"nm")], [R("DIBL at L = 30 nm","300*exp(-30/lam)","mV")], xlabel="gate length L (nm)", ylabel="V_T (V)")

D["optoelectronic_devices"] = plot([("exp(-((x-1240/Eg)/(2.55e-5*(1240/Eg)^2))^2/2)","LED emission","accent")],[350,1850],[0,1.1],
  "An LED emits photons with energy near the band gap, so the colour is λ = 1240/Eg nm. Wider-gap materials (GaN) glow blue; narrower ones (GaAs) emit infrared.",
  [P("Eg","band gap",0.7,3.1,1.9,"eV")], [R("peak wavelength","1240/Eg","nm"), R("spectral width (typical)","6e-5*(1240/Eg)^2","nm")],
  vlines=[{"x":400,"label":"violet"},{"x":700,"label":"red"}], xlabel="wavelength (nm)", ylabel="intensity")

_ith = "(10*exp((T-25)/60))"
D["lasers_semiconductor"] = plot([("x<%s ? 0.02*x*x/%s : 0.02*%s+eta*(x-%s)"%(_ith,_ith,_ith,_ith),"optical power","accent")],[0,80],[0,60],
  "Below threshold the diode glows weakly like an LED; above it stimulated emission takes over and power rises steeply. Heat raises the threshold current, so the same drive gives less light.",
  [P("T","temperature",0,100,25,"°C"),P("eta","slope efficiency",0.2,1,0.5,"W/A")],
  [R("threshold current",_ith,"mA"), R("power at 40 mA","40<%s ? 0.02*40*40/%s : 0.02*%s+eta*(40-%s)"%(_ith,_ith,_ith,_ith),"mW")],
  vlines=[{"x":_ith,"label":"I_th"}], xlabel="drive current (mA)", ylabel="light output (mW)")

_J = "(35*G-1e-10*exp(0.085*(T-25))*(exp(x/0.0259)-1))"
D["photodetectors_solar"] = plot([(_J,"current density J","accent"),("x*%s"%_J,"power J·V","gold")],[0,0.8],[0,45],
  "A solar cell is a photodiode run as a generator: light sets the short-circuit current, the diode sets the open-circuit voltage, and the best power is at the knee. Heat lowers voltage and power.",
  [P("G","illumination",0.1,1.2,1,"sun"),P("T","cell temperature",0,80,25,"°C")],
  [R("short-circuit J_sc","35*G","mA/cm²"), R("open-circuit V_oc","0.0259*ln(35*G/(1e-10*exp(0.085*(T-25))))","V"), R("photodiode responsivity (850 nm, η = 0.8)","0.8*850/1240","A/W")],
  xlabel="voltage (V)", ylabel="mA/cm²  |  mW/cm²")

D["fabrication_lithography"] = plot([("k1*193/x","193 nm immersion DUV","accent"),("k1*13.5/x","13.5 nm EUV","pink")],[0.3,1.4],[0,100],
  "The smallest printable feature is CD = k₁λ/NA. Shorter wavelengths and larger numerical aperture shrink it; EUV at 13.5 nm prints lines DUV can only reach with multiple exposures.",
  [P("k1","process factor k₁",0.25,0.5,0.35)], [R("DUV, NA 1.35","k1*193/1.35","nm"), R("EUV, NA 0.33","k1*13.5/0.33","nm"), R("high-NA EUV, 0.55","k1*13.5/0.55","nm")],
  points=[{"x":1.35,"y":"k1*193/1.35","color":"accent"},{"x":0.33,"y":"k1*13.5/0.33","color":"pink"},{"x":0.55,"y":"k1*13.5/0.55","color":"pink"}], xlabel="numerical aperture NA", ylabel="minimum feature CD (nm)")

D["fabrication_overview"] = chain(["Sand","Ingot","Wafer","Layers x80","Dice","Package"], "Silicon is purified, grown into a crystal, sliced into wafers, then built up layer by layer (about 80 times) before being cut into chips and packaged.", per=3)

_sg = "sqrt((0.35*Rp)^2+sd^2)"
D["doping_implantation"] = plot([("39.9/%s*exp(-(x-Rp)^2/(2*(%s)^2))"%(_sg,_sg),"dopant concentration","accent")],[0,400],None,
  "Implantation drops dopants in a bell-shaped profile at the projected range Rp (set by ion energy). Annealing makes them diffuse, widening and lowering the peak while the total dose stays 10¹⁴ cm⁻².",
  [P("Rp","projected range Rp",20,200,80,"nm"),P("sd","diffusion length √(2Dt)",0,50,10,"nm")],
  [R("peak concentration","39.9/%s"%_sg,"×10¹⁹ cm⁻³"), R("profile spread σ",_sg,"nm")], xlabel="depth (nm)", ylabel="concentration (10¹⁹ cm⁻³)")

_A="(0.165+0.061*w)"; _B="(0.0117+0.2753*w)"
D["oxidation_process"] = plot([("%s/2*(sqrt(1+4*%s*x/%s^2)-1)"%(_A,_B,_A),"oxide thickness","accent"),("%s/%s*x"%(_B,_A),"linear regime","dim",True),("sqrt(%s*x)"%_B,"parabolic regime","pink",True)],[0,10],[0,1.8],
  "Thermal oxide grows linearly at first (reaction-limited), then more slowly as oxidant must diffuse through the oxide already there (x² + Ax = Bt). Steam (w = 1) grows it much faster than dry O₂.",
  [P("w","0 = dry O₂, 1 = steam",0,1,1,"",1),P("tt","oxidation time",0.1,10,2,"h")],
  [R("thickness at that time","%s/2*(sqrt(1+4*%s*tt/%s^2)-1)*1000"%(_A,_B,_A),"nm")],
  points=[{"x":"tt","y":"%s/2*(sqrt(1+4*%s*tt/%s^2)-1)"%(_A,_B,_A)}], xlabel="time (h, 1000 °C)", ylabel="thickness (µm)")

D["etching_process"] = S("geometry","A mask protects the silicon while the etch removes the rest. Isotropic (wet) etching also eats sideways under the mask; anisotropic (plasma) etching goes nearly straight down.",
  [P("d","etch depth",0.1,1,0.6,"µm"),P("A","anisotropy A",0,1,0.9)], [R("undercut per side","(1-A)*d","µm")],
  range=[-2.2,2.2,-1.3,0.6], aspect=0.62, shapes=[
  {"k":"rect","x":-2.2,"y":-1.3,"w":4.4,"h":1.3,"fill":"white","alpha":0.18},
  {"k":"poly","pts":[["-0.5-(1-A)*d",0],["0.5+(1-A)*d",0],["0.5+0.6*(1-A)*d","-0.6*d"],[0.5,"-d"],[-0.5,"-d"],["-0.5-0.6*(1-A)*d","-0.6*d"]],"fill":"#0a0e17","color":"accent"},
  {"k":"rect","x":-2.2,"y":0,"w":1.7,"h":0.25,"fill":"gold","alpha":0.55},{"k":"rect","x":0.5,"y":0,"w":1.7,"h":0.25,"fill":"gold","alpha":0.55},
  {"k":"text","x":-1.35,"y":0.4,"text":"mask","color":"gold"},{"k":"text","x":1.35,"y":0.4,"text":"mask","color":"gold"},{"k":"text","x":0,"y":-1.1,"text":"silicon","color":"white","size":10}])

D["deposition_processes"] = plot([("g*floor(x)","ALD: g per cycle","accent",False,2.6),("r*x","CVD: continuous rate","pink")],[0,20],[0,10],
  "CVD grows a film continuously at a rate set by gas flow and temperature; atomic layer deposition adds one self-limiting atomic layer per cycle, giving exact thickness control but slower growth.",
  [P("r","CVD rate",0.1,0.8,0.4,"nm/s"),P("g","ALD growth per cycle",0.05,0.2,0.1,"nm")],
  [R("CVD after 20 s","20*r","nm"), R("ALD after 20 cycles","20*g","nm")], xlabel="time / cycles (1 s each)", ylabel="thickness (nm)")

# ---------------- CONTROL ----------------
D["system_modeling"] = plot([("1-exp(-(R/200)*10*x)/sqrt(1-(R/200)^2)*sin(10*sqrt(1-(R/200)^2)*x+acos(R/200))","capacitor voltage after a step","accent")],[0,3],[0,1.8],
  "A series RLC circuit (L = 10 mH, C = 1 µF) has the same equation as a mass on a spring with damper: more resistance means more damping and less overshoot.",
  [P("R","resistance R",10,150,40,"Ω")], [R("natural frequency ωn","1/sqrt(0.01*1e-6)","rad/s"), R("damping ratio ζ = R/2·√(C/L)","R/200"), R("overshoot","100*exp(-pi*(R/200)/sqrt(1-(R/200)^2))","%")],
  hlines=[{"y":1,"label":"final value"}], xlabel="time (ms)")

D["block_diagrams_mason"] = blocks([N("r","R(s)",8,50),N("e","",27,50,shape="sum"),N("g","G(s)",52,50,color="gold"),N("c","C(s)",92,50),N("h","H(s)",52,88,color="pink")],
  [E("r","e"),E("e","g","E"),E("g","c"),E("c","h"),E("h","e","−")],
  "Reduce a feedback loop to one transfer function: C/R = G/(1 + GH). With a large forward gain the loop behaves like 1/H, set by the feedback part alone.",
  [P("G","forward gain G",1,100,10),P("H","feedback H",0.1,2,1)], [R("closed loop G/(1+GH)","G/(1+G*H)"), R("ideal 1/H","1/H")], aspect=0.6)

_z="z"
D["time_domain_specs"] = plot([("1-exp(-z*wn*x)/sqrt(1-z^2)*sin(wn*sqrt(1-z^2)*x+acos(z))","step response","accent",False,2.6)],[0,10],[0,1.8],
  "Overshoot, peak time, rise time and settling time describe how a response looks. Less damping (small ζ) is faster to rise but overshoots and rings for longer.",
  [P("z","damping ratio ζ",0.05,0.95,0.3),P("wn","natural frequency ωn",1,5,2,"rad/s")],
  [R("overshoot","100*exp(-pi*z/sqrt(1-z^2))","%"), R("peak time π/ωd","pi/(wn*sqrt(1-z^2))","s"), R("2% settling ≈ 4/(ζωn)","4/(z*wn)","s"), R("rise time ≈","(1.76*z^3-0.417*z^2+1.039*z+1)/wn","s")],
  hlines=[{"y":1,"label":"final"},{"y":1.02,"label":"+2%","color":"gold"},{"y":0.98,"label":"−2%","color":"gold"}],
  points=[{"x":"pi/(wn*sqrt(1-z^2))","y":"1+exp(-pi*z/sqrt(1-z^2))","label":"peak"}], xlabel="time (s)")

D["routh_hurwitz"] = S("pz","For the loop with characteristic equation s³ + 6s² + 11s + 6 + K = 0, Routh's table says the system is stable only for K < 60. Raise K and watch two poles cross the imaginary axis exactly there.",
  [P("K","gain K",0,100,20)], [R("Routh first-column entry (60−K)/6","(60-K)/6"), R("stable? (1 = yes)","K<60")],
  range=5, rootlocus={"num":[1],"den":[1,6,11,6],"K":"K"}, poles=[[-1,0],[-2,0],[-3,0]])

D["bode_nyquist_margins"] = S("bode","For L(s) = K/[s(s+1)(s+10)] the phase reaches −180° at ω = 3.16 rad/s. The gain margin is how far the gain can rise before it equals 0 dB there; a negative margin means the loop is unstable.",
  [P("K","loop gain K",1,200,30)], [R("gain margin","20*log10(110/K)","dB"), R("phase-crossover ω","sqrt(10)","rad/s")],
  num=["K"], den=[1,11,10,0], w=[0.01,100], unit="rad/s")

D["lead_lag_compensators"] = S("bode","A lead compensator (1+sT)/(1+αTs) adds phase between its zero and pole, buying phase margin at the cost of higher high-frequency gain. Smaller α gives more lead.",
  [P("a","α",0.02,0.9,0.1)], [R("max phase lead","deg(asin((1-a)/(1+a)))","°"), R("at ω = 1/(T√α)","1/sqrt(a)","rad/s"), R("high-frequency gain","20*log10(1/a)","dB")],
  k=1, zeros=[[-1,0]], poles=[["-1/a",0]], w=[0.01,1000], unit="rad/s")

D["state_space"] = S("field","State-space trajectories: each arrow shows how the state (position x₁, velocity x₂) of a mass–spring–damper moves. A damped system spirals into the origin; no damping gives closed loops.",
  [P("k","stiffness k",0.5,9,4),P("c","damping c",0,3,0.6)], [R("eigenvalue real part −c/2","-c/2"), R("oscillation ωd","sqrt(max(k-c^2/4,0))","rad/s")],
  range=[-3,3,-3,3], vx="y", vy="-k*x-c*y", streamlines=True, density=13)

D["controllability_observability"] = S("vectors","The states reachable by input B are spanned by B and AB. When these two arrows line up (b = 0) the rank [B AB] drops to 1 and one mode can no longer be steered.",
  [P("b","input to state 2, b",-1,1,0.6,"",0.05)], [R("det [B AB]","-b"), R("rank (2 = controllable)","abs(b)>0.01 ? 2 : 1")],
  range=3, vectors=[{"x":1,"y":"b","label":"B","color":"gold"},{"x":-1,"y":"-2*b","label":"AB","color":"pink"}])

D["pole_placement"] = S("pz","State feedback u = −Kx on a double integrator gives the closed-loop equation s² + k₂s + k₁ = 0. Choose the gains and the poles land exactly where you want.",
  [P("k1","gain k₁",0.5,25,4),P("k2","gain k₂",0,10,2)], [R("natural frequency √k₁","sqrt(k1)","rad/s"), R("damping ratio k₂/(2√k₁)","k2/(2*sqrt(k1))")],
  range=6, poles=[["-k2/2+(k2^2>4*k1 ? sqrt(k2^2-4*k1)/2 : 0)","k2^2<4*k1 ? sqrt(4*k1-k2^2)/2 : 0"],["-k2/2-(k2^2>4*k1 ? sqrt(k2^2-4*k1)/2 : 0)","k2^2<4*k1 ? -sqrt(4*k1-k2^2)/2 : 0"]])

D["digital_control"] = plot([("sin(2*pi*3*x)","plant signal","dim"),("sin(2*pi*3*floor(x/Ts)*Ts)","held by the computer (zero-order hold)","accent"),("sin(2*pi*3*(x-Ts/2))","≈ delayed by Ts/2","gold",True)],[0,1],[-1.3,1.3],
  "A digital controller only updates every Ts seconds and holds the value between. The staircase is on average half a sample late, which erodes phase margin.",
  [P("Ts","sample time Ts",0.01,0.12,0.05,"s")], [R("sample rate","1/Ts","Hz"), R("delay Ts/2","Ts/2*1000","ms"), R("phase lag at 3 Hz","360*3*Ts/2","°")], xlabel="time (s)")

# ---------------- COMM ----------------
D["analog_modulation"] = S("signal","In FM the message changes the carrier's frequency. A larger modulation index β puts energy into more sidebands (spaced by fm), widening the bandwidth to about 2fm(β+1) (Carson's rule).",
  [P("b","modulation index β",0,8,2),P("fm","message frequency",1,5,2,"Hz",1)], [R("frequency deviation β·fm","b*fm","Hz"), R("Carson bandwidth","2*fm*(b+1)","Hz")],
  x=[0,1], y=[-1.3,1.3], f="cos(2*pi*40*x+b*sin(2*pi*fm*x))", spectrum=True, fmax=70)

def qam():
    sh = [{"k":"line","x1":-1.3,"y1":0,"x2":1.3,"y2":0,"color":"dim","width":1},{"k":"line","x1":0,"y1":-1.3,"x2":0,"y2":1.3,"color":"dim","width":1},
      {"k":"text","x":1.2,"y":-0.1,"text":"I","color":"dim"},{"k":"text","x":0.1,"y":1.2,"text":"Q","color":"dim"}]
    for i in range(-7,8,2):
        for j in range(-7,8,2):
            sh.append({"k":"point","x":"%d/sqrt(2*(2^k-1)/3)"%i,"y":"%d/sqrt(2*(2^k-1)/3)"%j,"color":"accent","size":4,"when":"max(%d,%d)<=2^(k/2)-1"%(abs(i),abs(j))})
    return sh
D["digital_modulation"] = S("geometry","Each dot is one symbol (a bit pattern) as an amplitude and phase. Packing more dots carries more bits per symbol but brings them closer, so less noise is needed to confuse them.",
  [P("k","bits per symbol",2,6,4,"",2)], [R("constellation size M = 2^k","2^k"), R("minimum distance (unit power)","2/sqrt(2*(2^k-1)/3)")],
  range=[-1.4,1.4,-1.4,1.4], aspect=0.8, shapes=qam())

D["noise_snr_ber"] = plot([("0.5*(1-erf(sqrt(10^(x/10))))","BPSK / QPSK","accent"),("0.375*(1-erf(sqrt(0.4*10^(x/10))))","16-QAM","pink")],[0,10],[1e-5,1],
  "Noise occasionally pushes a symbol across the decision boundary. The bit error rate falls steeply as Eb/N₀ rises, and denser constellations (16-QAM) need about 4 dB more.",
  [P("snr","Eb/N₀",0,10,5,"dB")], [R("BPSK bit error rate","0.5*(1-erf(sqrt(10^(snr/10))))")],
  logy=True, points=[{"x":"snr","y":"0.5*(1-erf(sqrt(10^(snr/10))))"}], xlabel="Eb/N₀ (dB)", ylabel="bit error rate")

D["information_entropy_capacity"] = plot([("log2(1+10^(x/10))","C/B = log₂(1+S/N)","accent")],[-10,30],[0,11],
  "Shannon's limit C = B·log₂(1+S/N): capacity grows with bandwidth but only logarithmically with signal-to-noise ratio. Every 3 dB of SNR buys about one extra bit per hertz at high SNR.",
  [P("B","bandwidth B",1,100,20,"MHz"),P("snr","SNR",-10,30,15,"dB")], [R("capacity C","B*log2(1+10^(snr/10))","Mbit/s"), R("spectral efficiency","log2(1+10^(snr/10))","bit/s/Hz")],
  points=[{"x":"snr","y":"log2(1+10^(snr/10))"}], xlabel="SNR (dB)", ylabel="bit/s per Hz")

D["error_correcting_codes"] = S("geometry","Codewords are spaced a Hamming distance d apart. Any received word within t = ⌊(d−1)/2⌋ errors of one codeword snaps back to it; between the circles an error is detected but not correctable.",
  [P("d","code distance d_min",1,9,5,"",1),P("rp","received word position",0,9,1,"",0.5)], [R("correctable errors t","floor((d-1)/2)"), R("detectable errors","d-1")],
  range=[-5,14,-5,5], aspect=0.55, shapes=[
  {"k":"circle","x":0,"y":0,"r":"floor((d-1)/2)","fill":"accent","alpha":0.15,"color":"accent","when":"d>2"},{"k":"circle","x":"d","y":0,"r":"floor((d-1)/2)","fill":"pink","alpha":0.15,"color":"pink","when":"d>2"},
  {"k":"line","x1":0,"y1":0,"x2":"d","y2":0,"color":"dim","width":1},
  {"k":"point","x":0,"y":0,"color":"accent","size":7},{"k":"point","x":"d","y":0,"color":"pink","size":7},{"k":"point","x":"rp","y":0,"color":"gold","size":5},
  {"k":"text","x":0,"y":-4.5,"text":"codeword A","color":"accent"},{"k":"text","x":"d","y":-4.5,"text":"codeword B","color":"pink"},{"k":"text","x":"rp","y":1.3,"text":"received","color":"gold","size":10},
  {"k":"text","x":4.5,"y":3.8,"text":"decoded as A (corrected)","color":"green","when":"rp<=floor((d-1)/2)"},
  {"k":"text","x":4.5,"y":3.8,"text":"decoded as B (corrected)","color":"green","when":"rp>=d-floor((d-1)/2)"},
  {"k":"text","x":4.5,"y":3.8,"text":"error detected, not correctable","color":"red","when":"rp>floor((d-1)/2) && rp<d-floor((d-1)/2)"}])

def mux():
    cols=["accent","gold","pink","green","purple","orange"]; sh=[]
    for i in range(6):
        c=cols[i]
        sh.append({"k":"rect","x":0,"y":"%d*8/N"%i,"w":10,"h":"8/N","fill":c,"alpha":0.5,"color":c,"when":"m==0 && %d<N"%i})
        sh.append({"k":"text","x":5,"y":"(%d+0.5)*8/N"%i,"text":"user %d"%(i+1),"color":"white","when":"m==0 && %d<N"%i})
        sh.append({"k":"rect","x":"%d*10/N"%i,"y":0,"w":"10/N","h":8,"fill":c,"alpha":0.5,"color":c,"when":"m==1 && %d<N"%i})
        sh.append({"k":"text","x":"(%d+0.5)*10/N"%i,"y":4,"text":"U%d"%(i+1),"color":"white","when":"m==1 && %d<N"%i})
    sh += [{"k":"arrow","x1":0,"y1":-0.6,"x2":10.5,"y2":-0.6,"color":"dim","width":1.2},{"k":"text","x":5,"y":-1.2,"text":"time →","color":"dim"},
      {"k":"arrow","x1":-0.6,"y1":0,"x2":-0.6,"y2":8.5,"color":"dim","width":1.2},{"k":"text","x":-0.6,"y":9.1,"text":"frequency","color":"dim"}]
    return sh
D["multiplexing_access"] = S("geometry","Several users share one channel's time–frequency plane. FDM gives each user its own frequency band all the time; TDM gives each user the whole band in turn. CDMA overlays everyone using different codes.",
  [P("N","users N",2,6,4,"",1),P("m","0 = FDM, 1 = TDM",0,1,0,"",1)], [R("share per user","100/N","%")],
  range=[-1.5,11,-1.8,9.8], aspect=0.8, shapes=mux())

D["wireless_channels_fading"] = plot([("Pt-(20*log10(4*pi*fG/0.3)+10*n*log10(x))","received power","accent",False,2.6),("Pt-(20*log10(4*pi*fG/0.3)+20*log10(x))","free space (n = 2)","dim",True)],[1,1000],[-150,25],
  "Received power falls as 10·n·log₁₀(distance); free space has n = 2 but walls and ground push n to 3–4. The link works until power drops below the receiver's sensitivity.",
  [P("n","path-loss exponent n",2,4.5,3),P("fG","frequency",0.7,6,2.4,"GHz"),P("Pt","transmit power",0,30,20,"dBm")],
  [R("loss at 1 m","20*log10(4*pi*fG/0.3)","dB"), R("range to −90 dBm","10^((Pt-20*log10(4*pi*fG/0.3)+90)/(10*n))","m")],
  logx=True, hlines=[{"y":-90,"label":"sensitivity −90 dBm","color":"red"}], xlabel="distance (m)", ylabel="power (dBm)")

osi=["Application","Presentation","Session","Transport","Network","Data link","Physical"]
D["networking_osi_tcpip"] = blocks([N("o%d"%i,l,22,6+i*88/6) for i,l in enumerate(osi)]+[N("t1","HTTP, DNS",80,16,color="gold"),N("t2","TCP / UDP",80,44,color="gold"),N("t3","IP",80,63,color="gold"),N("t4","Ethernet / Wi-Fi",80,86,color="gold")],
  [E("o%d"%i,"o%d"%(i+1)) for i in range(6)]+[E("t1","o1",dashed=True,color="gold"),E("t2","o3",dashed=True,color="gold"),E("t3","o4",dashed=True,color="gold"),E("t4","o5",dashed=True,color="gold")],
  "Data moves down the layers on the sender, picking up a header at each, and back up on the receiver. Gold: the four TCP/IP layers that the internet actually uses.", aspect=1.0)
