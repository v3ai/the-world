import json
D='data/'
sun=dict(name="Sun",parent=None,radius_km=695700,mass_kg=1.9885e30,rotation_period_h=609.12,axial_tilt_deg=7.25,semimajor_au=None,eccentricity=None,inclination_deg=None,orbital_period_days=None,albedo=None,texture="sun.jpg",ring=None,atmosphere="Photosphere ~5772 K effective; chromosphere and corona (~1-2 million K) above; composition ~73% H, 25% He by mass.",notes="G2V star. Rotation: Carrington synodic-sidereal ~25.38 d at 26 deg latitude; faster at equator (~24.5 d), slower at poles (~34 d). Axial tilt is relative to the ecliptic. Luminosity 3.828e26 W.",approx=False)
def P(name,a,e,i,per,rot,tilt,R,M,alb,tex,ring,atm,notes,approx=False,**kw):
    d=dict(name=name,parent="Sun",radius_km=R,mass_kg=M,rotation_period_h=rot,axial_tilt_deg=tilt,semimajor_au=a,eccentricity=e,inclination_deg=i,orbital_period_days=per,albedo=alb,albedo_type="Bond",texture=tex,ring=ring,atmosphere=atm,notes=notes,approx=approx); d.update(kw); return d
planets=[
P("Mercury",0.38710,0.2056,7.005,87.969,1407.6,0.034,2439.7,3.3011e23,0.088,"mercury.jpg",None,"Exosphere only (traces of O, Na, H, He, K); surface pressure ~1e-14 bar.","3:2 spin-orbit resonance; one solar day = ~176 Earth days. Radius is mean radius. Inclination to the ecliptic."),
P("Venus",0.72333,0.0068,3.395,224.701,-5832.5,177.36,6051.8,4.8675e24,0.76,"venus_surface.jpg",None,"96.5% CO2, 3.5% N2; surface pressure ~92 bar, surface ~737 K; sulfuric-acid cloud decks.","Retrograde rotation (243 d). Surface texture is a radar-derived/artistic map; atmosphere texture in venus_atmosphere.jpg.",texture_atmosphere="venus_atmosphere.jpg"),
P("Earth",1.00000,0.0167,0.0,365.256,23.9345,23.44,6371.0,5.9722e24,0.306,"earth_day.jpg",None,"78% N2, 21% O2, 0.9% Ar, ~0.04% CO2, variable H2O; surface pressure 1.013 bar.","Mean radius. Sidereal rotation 23h 56m 4s. Orbit is the ecliptic by definition (semimajor axis of Earth-Moon barycenter).",textures=dict(day="earth_day.jpg",night="earth_night.jpg",clouds="earth_clouds.png",water_mask="earth_water_mask.png",bump="earth_bump.jpg")),
P("Mars",1.52368,0.0934,1.850,686.980,24.6229,25.19,3389.5,6.4171e23,0.25,"mars.jpg",None,"~95% CO2, 2.8% N2, 2% Ar; surface pressure ~0.006 bar.","Mean radius (equatorial 3396.2 km, polar 3376.2 km)."),
P("Jupiter",5.2026,0.0489,1.303,4332.59,9.925,3.13,69911,1.8982e27,0.503,"jupiter.jpg",dict(inner_km=122500,outer_km=129000,texture=None,note="Faint main ring plus halo/gossamer rings out to ~226000 km; no texture supplied.",approx=True),"~90% H2, ~10% He by number; ammonia, water and ammonium hydrosulfide clouds; Great Red Spot.","Radius is the 1-bar mean radius (equatorial 71492 km). Rotation is System III."),
P("Saturn",9.5549,0.0565,2.489,10759.22,10.656,26.73,58232,5.6834e26,0.342,"saturn.jpg",dict(inner_km=74500,outer_km=136780,texture="saturn_ring.png",note="Spans the C, B and A rings (D ring starts ~66900 km, F ring ~140200 km). Gaps: Cassini Division, Encke Gap.",approx=True),"~96% H2, ~3% He; ammonia ice clouds; polar hexagon.","Radius is the 1-bar mean radius (equatorial 60268 km). Mean density 687 kg/m3, less than water."),
P("Uranus",19.2184,0.0472,0.773,30688.5,-17.24,97.77,25362,8.6810e25,0.300,"uranus.jpg",dict(inner_km=41837,outer_km=51149,texture=None,note="13 known narrow rings from the 6 ring to the epsilon ring plus dusty inner rings; no texture supplied.",approx=True),"~83% H2, ~15% He, ~2% CH4 (gives the cyan colour).","Rotates on its side; retrograde. Radius is the 1-bar mean radius (equatorial 25559 km)."),
P("Neptune",30.1104,0.0086,1.770,60182,16.11,28.32,24622,1.02413e26,0.290,"neptune.jpg",dict(inner_km=41900,outer_km=62933,texture=None,note="Galle, Le Verrier, Lassell/Arago and Adams rings (with arcs); faint, dusty; no texture supplied.",approx=True),"~80% H2, ~19% He, ~1.5% CH4; fastest winds in the Solar System (~2000 km/h).","Radius is the 1-bar mean radius (equatorial 24764 km)."),
P("Pluto",39.482,0.2488,17.16,90560,-153.29,122.53,1188.3,1.303e22,0.72,"pluto.jpg",None,"Thin N2 atmosphere with CH4 and CO; surface pressure ~1 Pa (~10 microbar) and varies seasonally.","Dwarf planet. Orbit semi-major axis, eccentricity and inclination vary noticeably over time (osculating, approximate). Pluto-Charon barycentre lies outside Pluto. Albedo is approx (Bond estimates range ~0.4-0.7).",approx=True,dwarf=True),
]
def M(name,parent,R,Mass,a,e,i,per,alb,tex,atm,notes,retro=False,approx=False,tilt=0.0):
    rot=per*24.0
    return dict(name=name,parent=parent,radius_km=R,mass_kg=Mass,rotation_period_h=(-rot if retro else rot) if name!="Moon" else 655.72,axial_tilt_deg=tilt,semimajor_km=a,eccentricity=e,inclination_deg=i,orbital_period_days=(-per if retro else per),albedo=alb,albedo_type="geometric",texture=tex,ring=None,atmosphere=atm,notes=notes+" Rotation is synchronous with the orbit (tilt assumed ~0 relative to the orbital plane).",approx=approx)
moons=[
M("Moon","Earth",1737.4,7.342e22,384399,0.0549,5.145,27.3217,0.12,"moon.jpg","Essentially none (tenuous exosphere).","Inclination is to the ecliptic; axial tilt 1.54 deg to the ecliptic (6.68 deg to its orbit). Semimajor axis changes ~3.8 cm/yr.",tilt=1.54),
M("Phobos","Mars",11.267,1.0659e16,9376,0.0151,1.08,0.31891,0.07,None,"None.","Mean radius; irregular (27 x 22 x 18 km). Orbits below synchronous altitude and spirals inward.",approx=True),
M("Deimos","Mars",6.2,1.4762e15,23463,0.0002,1.79,1.2624,0.07,None,"None.","Mean radius; irregular (15 x 12 x 10 km).",approx=True),
M("Io","Jupiter",1821.6,8.9319e22,421700,0.0041,0.036,1.769138,0.63,None,"Thin SO2 atmosphere from volcanism.","Most volcanically active body known; tidally heated."),
M("Europa","Jupiter",1560.8,4.7998e22,671034,0.0094,0.466,3.551181,0.67,None,"Very thin O2 exosphere.","Ice shell over a global subsurface ocean."),
M("Ganymede","Jupiter",2634.1,1.4819e23,1070412,0.0013,0.177,7.154553,0.43,None,"Very thin O2 exosphere.","Largest moon in the Solar System; has an intrinsic magnetic field."),
M("Callisto","Jupiter",2410.3,1.0759e23,1882709,0.0074,0.192,16.689018,0.22,None,"Very thin CO2 exosphere.","Heavily cratered; possibly partially differentiated."),
M("Titan","Saturn",2574.7,1.3452e23,1221870,0.0288,0.348,15.945,0.22,None,"~95% N2, ~5% CH4; surface pressure ~1.47 bar.","Only moon with a dense atmosphere; liquid methane/ethane lakes. Albedo approximate (opaque haze).",approx=True),
M("Enceladus","Saturn",252.1,1.08e20,237948,0.0047,0.009,1.370218,1.38,None,"Thin water-vapour plume over the south pole.","Geysers feed Saturn's E ring; subsurface ocean."),
M("Mimas","Saturn",198.2,3.7493e19,185539,0.0196,1.574,0.942422,0.96,None,"None.","Large Herschel crater."),
M("Rhea","Saturn",763.8,2.306e21,527108,0.0012,0.345,4.5175,0.95,None,"Very thin O2/CO2 exosphere.","Second largest moon of Saturn."),
M("Iapetus","Saturn",734.5,1.806e21,3560820,0.0286,15.47,79.3215,None,None,"None.","Two-tone surface: leading hemisphere very dark (albedo ~0.03-0.05), trailing hemisphere bright (~0.5-0.6); equatorial ridge. Inclination is to the Laplace plane.",approx=True),
M("Miranda","Uranus",235.8,6.4e19,129390,0.0013,4.232,1.413479,0.32,None,"None.","Mean radius; patchwork terrain, Verona Rupes cliff. Mass approximate.",approx=True),
M("Titania","Uranus",788.4,3.527e21,435910,0.0011,0.079,8.7058,0.27,None,"None.","Largest moon of Uranus."),
M("Oberon","Uranus",761.4,3.014e21,583520,0.0014,0.068,13.4632,0.23,None,"None.","Outermost major moon of Uranus."),
M("Triton","Neptune",1353.4,2.139e22,354759,0.00002,156.885,5.876854,0.76,None,"Tenuous N2 atmosphere (~1.4 Pa).","Retrograde orbit (likely captured Kuiper-belt object); nitrogen geysers. Inclination >90 deg = retrograde.",retro=True),
M("Charon","Pluto",606,1.586e21,19591,0.0002,0.0,6.3872,0.35,"charon.jpg","None.","Pluto and Charon are mutually tidally locked (double synchronous). Axial tilt relative to its orbit ~0.",approx=True),
]
moons[-1]["rotation_period_h"]=153.29
out=dict(units=dict(distance_planet="au",distance_moon="km",angle="deg",time_period_h="hours (negative = retrograde)"),epoch="J2000 mean/approximate elements; use astronomy-engine for live positions",bodies=[sun]+planets+moons)
json.dump(out["bodies"],open(D+"solar.json","w"),indent=1)
print(len(out['bodies']))
