import json, sys
sys.path.insert(0,'.')
from sums import S
from mendeleev import element
S[104]=S[104].replace("its isotopes live seconds at most","its isotopes are short-lived")
S[105]=S[105].replace("very short-lived","short-lived")
S[106]=S[106].replace("decay within seconds","are short-lived")
S[107]=S[107].replace("produced a few atoms at a time","produced only a few atoms at a time")
gas={1,2,7,8,9,10,17,18,36,54,86}; liquid={35,80}
unk=set(range(112,119))
out=[]
disc_fix={}
for Z in range(1,119):
    e=element(Z)
    iso=[[i.mass_number, round(i.abundance/100,6)] for i in e.isotopes if i.abundance]
    mA=None
    if iso: mA=max(iso,key=lambda x:x[1])[0]
    else:
        hl=[(i.half_life or 0,i.mass_number) for i in e.isotopes if getattr(i,'half_life',None)]
        if hl: mA=max(hl)[1]
    ph='gas' if Z in gas else 'liquid' if Z in liquid else 'unknown' if Z in unk else 'solid'
    dy=e.discovery_year
    disc = int(dy) if dy else ('antiquity' if (e.discoverers or '').lower().startswith('known') else (e.discoverers or None))
    ion=e.ionenergies.get(1)
    cfg=e.econf
    out.append(dict(Z=Z,symbol=e.symbol,name=e.name,mass=e.atomic_weight,category=(e.series or '').lower() if False else e.series,
      group=e.group_id,period=e.period,block=e.block,config=cfg,electronegativity=e.en_pauling,
      radius_covalent_pm=round(e.covalent_radius_cordero or e.covalent_radius_pyykko),
      radius_vdw_pm=e.vdw_radius, radius_atomic_pm=e.atomic_radius,
      ionization_eV=ion, density=e.density, melt_K=e.melting_point, boil_K=e.boiling_point, phase_stp=ph,
      color_cpk=e.cpk_color or e.jmol_color or '#ff1493', isotopes=iso, mostAbundantA=mA, discovered=disc, summary=S[Z]))
    if mA is None and not iso: pass
fix={15:(317.3,553.0),16:(388.36,717.8),34:(494.0,958.0),50:(505.08,2875.0)}
for o in out:
    if o['Z'] in fix:
        o['melt_K'],o['boil_K']=fix[o['Z']]
json.dump(out,open('data/elements.json','w'),separators=(',',':'),ensure_ascii=False)
import collections
print(len(out), collections.Counter(o['category'] for o in out))
for k in ['electronegativity','radius_covalent_pm','radius_vdw_pm','radius_atomic_pm','ionization_eV','density','melt_K','boil_K','group','mostAbundantA','discovered','color_cpk','config']:
    print(k,[o['Z'] for o in out if o[k] is None][:60])
print(out[25])
