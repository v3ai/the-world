import json, itertools, math
import numpy as np
from ase.spacegroup import crystal
from ase.build import bulk
from ase import Atoms
from ase.neighborlist import neighbor_list
OUT=[]
def nn(atoms,cut=3.2):
    i,j,d=neighbor_list('ijd',atoms,cut)
    s=atoms.get_chemical_symbols(); res={}
    for a,b,dd in zip(i,j,d):
        k=''.join(sorted([s[a],s[b]])); res.setdefault(k,[]).append(dd)
    return {k:(round(min(v),3),round(float(np.mean([x for x in v if x<min(v)+0.25])),3)) for k,v in res.items()}
def add(id,name,formula,atoms,cut,notes,expect=None):
    cell=[[round(float(x),5) for x in v] for v in atoms.get_cell()]
    sp=atoms.get_scaled_positions(wrap=True)
    basis=[[s,*[round(float(x),5) for x in p]] for s,p in zip(atoms.get_chemical_symbols(),sp)]
    OUT.append(dict(id=id,name=name,formula=formula,lattice=cell,basis=basis,bond_cutoff=cut,notes=notes))
    print(f"{id:12s} atoms={len(atoms):3d} NN(min,mean-shell)={nn(atoms,max(cut+1.2,3.0))} expect={expect}")
cry=lambda *a,**k: crystal(*a,**k)
add('halite','Halite (rock salt)','NaCl',cry(['Na','Cl'],[(0,0,0),(.5,.5,.5)],spacegroup=225,cellpar=[5.640]*3+[90]*3),3.0,'Rock-salt structure: each ion sits in a cube-like octahedral cage of six neighbors of opposite charge; a = 5.64 A.','Na-Cl 2.82')

add('quartz','Alpha quartz','SiO2',cry(['Si','O'],[(0.4697,0,2/3),(0.4135,0.2669,0.7857)],spacegroup=154,cellpar=[4.916,4.916,5.405,90,90,120]),1.8,'Corner-sharing SiO4 tetrahedra wind into helical chains (space group P3_2 21, a = 4.916, c = 5.405 A).','Si-O 1.61')
add('iron_bcc','Iron (bcc, alpha-Fe)','Fe',cry(['Fe'],[(0,0,0)],spacegroup=229,cellpar=[2.866]*3+[90]*3),2.6,'Body-centered cubic iron with a = 2.866 A; each atom has 8 nearest neighbors.','Fe-Fe 2.48')
add('copper_fcc','Copper (fcc)','Cu',cry(['Cu'],[(0,0,0)],spacegroup=225,cellpar=[3.615]*3+[90]*3),2.8,'Face-centered cubic close packing, a = 3.615 A, 12 nearest neighbors.','Cu-Cu 2.56')
add('gold_fcc','Gold (fcc)','Au',cry(['Au'],[(0,0,0)],spacegroup=225,cellpar=[4.078]*3+[90]*3),3.2,'Face-centered cubic gold, a = 4.078 A.','Au-Au 2.88')
add('diamond','Diamond','C',cry(['C'],[(1/8,1/8,1/8)],spacegroup=227,setting=2,cellpar=[3.567]*3+[90]*3),1.7,'Every carbon bonds tetrahedrally to four others (sp3), a = 3.567 A.','C-C 1.54')
add('silicon','Silicon (diamond structure)','Si',cry(['Si'],[(1/8,1/8,1/8)],spacegroup=227,setting=2,cellpar=[5.431]*3+[90]*3),2.6,'The semiconductor crystal in the diamond structure, a = 5.431 A.','Si-Si 2.35')
add('aluminium_fcc','Aluminium (fcc)','Al',cry(['Al'],[(0,0,0)],spacegroup=225,cellpar=[4.05]*3+[90]*3),3.0,'Face-centered cubic aluminium, a = 4.05 A.','Al-Al 2.86')
add('graphite','Graphite','C',cry(['C','C'],[(0,0,.25),(1/3,2/3,.25)],spacegroup=194,cellpar=[2.464,2.464,6.711,90,90,120]),1.7,'Flat honeycomb carbon sheets stacked ABAB with 3.36 A spacing and weak interlayer forces.','C-C 1.42 (in-plane), 3.36 between layers')
add('calcite','Calcite','CaCO3',cry(['Ca','C','O'],[(0,0,0),(0,0,.25),(0.2578,0,.25)],spacegroup=167,cellpar=[4.990,4.990,17.061,90,90,120]),2.5,'Layers of calcium ions alternate with flat CO3 groups (hexagonal setting of R-3c), the mineral of limestone and marble.','C-O 1.28, Ca-O 2.36')
add('hematite','Hematite','Fe2O3',cry(['Fe','O'],[(0,0,0.3553),(0.3059,0,.25)],spacegroup=167,cellpar=[5.038,5.038,13.772,90,90,120]),2.3,'Iron(III) oxide in the corundum structure; Fe sits in distorted octahedra of oxygen (hexagonal setting).','Fe-O 1.95 and 2.11')
add('pyrite','Pyrite','FeS2',cry(['Fe','S'],[(0,0,0),(0.385,0.385,0.385)],spacegroup=205,cellpar=[5.417]*3+[90]*3),2.4,"Fool's gold: Fe2+ ions with S2 pairs on a rock-salt-like arrangement (Pa-3).",'S-S 2.16, Fe-S 2.26')
add('rutile','Rutile','TiO2',cry(['Ti','O'],[(0,0,0),(0.3053,0.3053,0)],spacegroup=136,cellpar=[4.594,4.594,2.959,90,90,90]),2.2,'Titanium dioxide with chains of edge-sharing TiO6 octahedra, a common white pigment.','Ti-O 1.95 and 1.98')
add('fluorite','Fluorite','CaF2',cry(['Ca','F'],[(0,0,0),(.25,.25,.25)],spacegroup=225,cellpar=[5.463]*3+[90]*3),2.6,'Calcium ions in a face-centered cube with fluoride ions filling all tetrahedral holes.','Ca-F 2.37')
add('magnetite','Magnetite','Fe3O4',cry(['Fe','Fe','O'],[(1/8,1/8,1/8),(.5,.5,.5),(0.2549,0.2549,0.2549)],spacegroup=227,setting=2,cellpar=[8.397]*3+[90]*3),2.3,'An inverse spinel; Fe on tetrahedral and octahedral sites (Fe atoms of both kinds are listed as Fe). It is the magnetic iron ore.','Fe(tet)-O 1.88, Fe(oct)-O 2.06')
fo=[(0,0,0),(0.9915,0.2774,0.25),(0.4262,0.0940,0.25),(0.7657,0.0922,0.25),(0.2217,0.4473,0.25),(0.2777,0.1629,0.0331)]
fo=[(y,z,x) for x,y,z in fo]
add('forsterite','Forsterite (olivine, Mg2SiO4)','Mg2SiO4',cry(['Mg','Mg','Si','O','O','O'],fo,spacegroup=62,cellpar=[10.207,5.980,4.756,90,90,90]),2.3,'Isolated SiO4 tetrahedra linked by Mg ions in octahedral sites; the main mineral of the upper mantle. Standard Pbnm structure expressed in the Pnma axis setting (a = 10.207, b = 5.980, c = 4.756 A).','Si-O 1.63, Mg-O 2.1')

# ---- ice Ih with proton-ordered (zero net dipole, ice-rule) orthohexagonal cell
a=4.52;c=7.37
cellv=np.array([[a,0,0],[0,a*math.sqrt(3),0],[0,0,c]])
hexc=crystal(['O'],[(1/3,2/3,0.0629)],spacegroup=194,cellpar=[a,a,c,90,90,120])
# O at 2c (1/3,2/3,1/4) -> use ase to get 4 O in hex cell, then build orthohex via cartesian replication
hexO=hexc.get_positions()
hc=hexc.get_cell()
pts=[]
for n1 in range(-2,3):
  for n2 in range(-2,3):
    for p in hexO:
      r=p+n1*hc[0]+n2*hc[1]
      f=np.linalg.solve(cellv.T,r)
      f-=np.floor(f+1e-9)
      if not any(np.allclose(f,g,atol=1e-4) or np.allclose((f-g)-np.round(f-g),0,atol=1e-4) for g in pts): pts.append(f)
Of=np.array(pts); print('ice O in ortho cell:',len(Of))
Oat=Atoms('O'*len(Of),scaled_positions=Of,cell=cellv,pbc=True)
i,j,d,S=neighbor_list('ijdS',Oat,3.0)
mask=d<3.0
edges=[(a_,b_,S_) for a_,b_,S_ in zip(i,j,S) if a_<b_ or (a_==b_ and tuple(S_)>(0,0,0))]
# each undirected edge appears twice (i,j,S) and (j,i,-S); keep one
seen=set();E=[]
for a_,b_,S_ in zip(i,j,S):
    key=(a_,b_,tuple(S_)); rkey=(b_,a_,tuple(-S_))
    if rkey in seen: continue
    seen.add(key); E.append((a_,b_,np.array(S_)))
print('edges',len(E),'(expect 2 per O =',2*len(Of),')')
cart=Oat.get_positions()
def vec(e): a_,b_,S_=e; return cart[b_]+S_@cellv-cart[a_]
best=None
nO=len(Of)
for bits in range(2**len(E)):
    out=[0]*nO; 
    for k,e in enumerate(E):
        don = e[0] if (bits>>k)&1 else e[1]   # O that donates its H along this bond
        out[don]+=1
    if any(o!=2 for o in out): continue
    # molecular dipole: sum over molecules of sum of OH unit vectors
    dip=np.zeros(3)
    for k,e in enumerate(E):
        v=vec(e); u=v/np.linalg.norm(v)
        dip += u if (bits>>k)&1 else -u
    sc=np.linalg.norm(dip)
    if best is None or sc<best[0]: best=(sc,bits)
        
print('best net dipole (unit-vector sum)',round(best[0],3))
bits=best[1]
atoms=list(Oat.get_chemical_symbols()); pos=list(cart)
for k,e in enumerate(E):
    v=vec(e); L=np.linalg.norm(v); u=v/L
    don = e[0] if (bits>>k)&1 else e[1]
    base = cart[e[0]] if don==e[0] else cart[e[1]]
    direction = u if don==e[0] else -u
    atoms.append('H'); pos.append(base+0.98*direction)
ice=Atoms(atoms,positions=pos,cell=cellv,pbc=True)
ice.wrap()
add('ice_ih','Ice Ih (ordinary ice)','H2O',ice,1.2,'Hexagonal ice: every water is hydrogen-bonded to four neighbors in a puckered honeycomb, with open channels that make ice less dense than water. The orthohexagonal cell holds 8 molecules; protons are placed with one arrangement obeying the ice rules (real ice is proton-disordered). O-H 0.98 A covalent; O...O 2.76 A between molecules.','O-O 2.76 (O-H 0.98, H...O 1.78)')
json.dump(OUT,open('data/crystals.json','w'),separators=(',',':'))
print(len(OUT),'crystals written')
