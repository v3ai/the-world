import sys, json, re, glob, os, collections
sys.path.insert(0,'work/scripts_knowledge')
import importlib, kn
for f in sorted(glob.glob('work/scripts_knowledge/kn/k*.py')):
    importlib.import_module('kn.'+os.path.basename(f)[:-3])
L=json.load(open('data/library/books.json'))
B={b['c']:b for b in L}
SIMS=set("""cosmos cmb localgroup milkyway sgrA neighborhood star solarsystem sun planet:mercury planet:venus planet:earth planet:mars planet:jupiter planet:saturn planet:uranus planet:neptune dwarf:pluto moon asteroidbelt kuiper oort heliosphere region park human dog tree leaf flower bee bird mushroom pond cloud air soil rock skin tissue cell:animal cell:plant cell:bacterium mitochondrion chloroplast membrane ribosome er golgi lysosome nucleus_cell chromatin nucleosome dna rna protein molecule crystal liquid:water gas:air plasma atom orbital nucleus proton neutron quark gluon electron photon blackhole galaxy exoplanet""".split())
FREFS=set("hubble_tension desi_dark_energy katrin_neutrino juno_oscillation lz_dark_matter lz_248kev muon_g2 gw250114 willow_qec bennu_samples luca_age cogitate navier_stokes_ai little_red_dots exoplanet_count co2_ppm amoc climate_sensitivity lhcb_baryon_cp flywire_connectome alphafold_limits moon_origin earth_water".split())
LEVELS=set([str(i) for i in range(12)]+['X'])
errs=[]
def resolve(raw,nid,title=''):
    p=raw.split(None,2); code=p[0]; ch=int(p[1]); kw=p[2].lower() if len(p)>2 else None
    b=B.get(code)
    if not b or ch>len(b['ch']): errs.append((nid,'bad ref',raw)); return None
    secs=b['ch'][ch-1][2]
    if kw:
        for s in secs:
            if kw in s[1].lower() and s[0]: return [code,s[0]]
    words=[w for w in re.findall(r'[a-z]{4,}',(title+' '+nid.replace('_',' ')).lower())]
    best=None;bs=0
    for s in secs:
        if not s[0]: continue
        sc=sum(1 for w in set(words) if w[:5] in s[1].lower())
        if sc>bs: best,bs=s,sc
    if best: return [code,best[0]]
    for s in secs:
        if s[0]: return [code,s[0]]
    return [code,str(ch)] if secs else None
nodes=kn.N

EXTRA_SIM={"protein_structure":"protein","enzymes":"protein","dna_structure":"dna","central_dogma":"rna ribosome","cell_cycle":"chromatin","chemical_bonding":"molecule","molecular_shapes":"molecule","liquid_water_properties":"liquid:water","crystal_lattices":"crystal","band_theory":"crystal","quantum_orbitals":"atom orbital","periodic_table":"atom","plant_physiology":"tree leaf","ecology_energy":"pond","plate_tectonics":"planet:earth","earth_interior":"planet:earth","weather_dynamics":"cloud","tsunami_hazards":"liquid:water","tides":"moon","hydrostatic_balance":"star","stellar_evolution":"star","stellar_death":"star","big_bang":"cosmos","cmb":"cmb","inflation":"cosmos","dark_energy_node":"cosmos","galaxies":"galaxy","milky_way":"milkyway","black_holes":"blackhole","exoplanets":"exoplanet","small_bodies":"asteroidbelt","solar_system_formation":"solarsystem","immune_system":"cell:animal","action_potential":"cell:animal","brain_organization":"human","blood_circulation":"human","viruses":"rna","nucleus_note":"nucleus","nuclear_force":"nucleus","protons_neutrons":"proton neutron","qcd":"gluon","standard_model":"quark electron","spin_pauli":"electron","tunneling":"electron","wave_particle":"electron photon","photon_node":"photon","plasma_physics":"plasma","kinetic_theory":"gas:air","weather_prediction":"cloud","ice_sheets":"rock","soil_biology":"soil","skin_integument":"skin","cell_types":"tissue","oceans_circulation":"liquid:water","water_cycle":"cloud pond","atmosphere_structure":"air","greenhouse_effect":"air","carbon_cycle_climate":"air","humans":"human","heme_oxygen":"protein","ribosome":"ribosome","mitochondria_org":"mitochondrion","organelles_overview":"er golgi lysosome","observable_universe":"cosmos","cosmic_web":"cosmos","expansion_hubble":"cosmos","hubble_tension_node":"cosmos"}
for x in nodes:
    if not x['sim'] and x['id'] in EXTRA_SIM: x['sim']=EXTRA_SIM[x['id']].split()


REFO={"magnetic_materials":"UP2 12 matter","symmetry_breaking":"UP3 11 conservation","solar_cells":"UP3 9 devices","led_lasers":"UP3 9 devices","topological_matter":"UP3 9 band","fiber_optics":"UP3 1 refraction; UP3 2","plasma_physics":"AST 15; UP2 2","ozone_layer":"CHE 12; AST 8 atmosphere","oceans_circulation":"BIO 44 climate","atmosphere_structure":"AST 8 atmosphere; AST 10 atmosphere","weather_dynamics":"BIO 44 climate","hurricanes_storms":"BIO 44 climate","enso":"BIO 44 climate","amoc_node":"BIO 44 climate","ice_sheets":"BIO 44 climate","dislocations_strength":"UP1 12 stress","soft_matter":"CHE 11 colloids","networks_complexity":"CMA 12; BIO 45","energy_systems":"CHE 5; UP2 3","flight_tech":"UP1 14 bernoulli","electric_motors":"UP2 11 applications","mri_tech":"UP3 10 medical","quantum_computing":"UP3 7 ; DSC 7","superfluidity":"UP3 9 superconductivity","antihydrogen":"UP3 11 conservation","tunneling":"UP3 7 tunneling; UP3 10 decay","entanglement":"UP3 7 wave","quantum_orbitals":"UP3 8 hydrogen; CHE 6 quantum; CAF 3 quantum","connectome":"ANP 13; BIO 35","synapse_plasticity":"ANP 12 synapse; BIO 35 synaptic; PSY 3 neuron","mitochondria_org":"BIO 4 eukaryotic; BIO 7; COB 3 eukaryotic","organelles_overview":"BIO 4 eukaryotic; COB 3 eukaryotic","chloroplast_org":"BIO 4 eukaryotic; BIO 8; COB 3 eukaryotic","cell_biology_intro":"BIO 4 prokaryotic; COB 3 prokaryotic; ANP 3 cytoplasm","rna_world":"BIO 15; COB 9","luca":"BIO 20 phylogenetic","origin_of_life":"BIO 2 water; AST 30 astrobiology","human_evolution":"BIO 29 primates","minerals_rocks":"AST 8 crust","plate_tectonics":"AST 8 global","volcanism":"AST 8 crust; AST 10 venus","mountain_building":"AST 8 crust","oceans_circulation_dummy":"BIO 44"}
for x in nodes:
    if x['id'] in REFO: x['refs_raw']=[r.strip() for r in REFO[x['id']].split(';') if r.strip()]

ids={x['id'] for x in nodes}
for x in nodes:
    refs=[]
    for r in x.pop('refs_raw'):
        v=resolve(r,x['id'],x['title'])
        if v and v not in refs: refs.append(v)
    x['refs']=refs
    x['emerges_from']=list(dict.fromkeys(x['emerges_from']))
    for k in ('emerges_from','explains'):
        for t in x[k]:
            if t not in ids: errs.append((x['id'],'bad link',t))
    for s in x['sim']:
        if s not in SIMS: errs.append((x['id'],'bad sim',s))
    for f in x['frontier_ref']:
        if f not in FREFS: errs.append((x['id'],'bad fref',f))
    if x['level'] not in LEVELS: errs.append((x['id'],'bad level'))
    if x['certainty'] not in ('C1','C2','C3','C4'): errs.append((x['id'],'bad certainty'))
    for fld in ('basics','deeper','expert','regime'):
        if not x[fld]: errs.append((x['id'],'empty',fld))
    if x['scale_m']:
        assert len(x['scale_m'])==2 and x['scale_m'][0]<=x['scale_m'][1],x['id']
# explains = declared + inverse of emerges_from
byid={x['id']:x for x in nodes}
for x in nodes:
    for e in x['emerges_from']:
        if x['id'] not in byid[e]['explains']: byid[e]['explains'].append(x['id'])
    # explains should not self-reference
for x in nodes:
    x['explains']=[t for t in dict.fromkeys(x['explains']) if t!=x['id']]
    x['emerges_from']=[t for t in x['emerges_from'] if t!=x['id']]
    if not x['refs']: errs.append((x['id'],'no refs (warn)'))
# cycles in emerges_from: warn only
order=['id','title','level','scale_m','certainty','domain','basics','deeper','expert','regime','emerges_from','explains','evidence','frontier','refs','sim','frontier_ref']
out=[{k:x[k] for k in order if not (k=='frontier_ref' and not x[k])} for x in nodes]
os.makedirs('data/knowledge',exist_ok=True)
json.dump(out,open('data/knowledge/nodes.json','w'),ensure_ascii=False,indent=0)
print('nodes',len(out),'bytes',os.path.getsize('data/knowledge/nodes.json'))
print('ERRORS',errs)
lv=collections.Counter(x['level'] for x in out); print('levels',dict(sorted(lv.items(),key=lambda t:(t[0]=='X',int(t[0]) if t[0]!='X' else 99))))
print('certainty',dict(sorted(collections.Counter(x['certainty'] for x in out).items())))
print('with frontier_ref',sum(1 for x in out if 'frontier_ref' in x),'refs total',sum(len(x['refs']) for x in out))
used={f for x in out for f in x.get('frontier_ref',[])}; print('unused planned frontier ids',sorted(FREFS-used))
print('nodes without sim',sum(1 for x in out if not x['sim']))
# connectivity: nodes with no links
print('isolated',[x['id'] for x in out if not x['emerges_from'] and not x['explains']])
