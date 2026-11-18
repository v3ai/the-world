import sys, json, math
sys.path.insert(0,'.')
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem
import build_mols as B
from mol_list import M
INFO={m[0]:m for m in M}
OUT=B.OUT

def save(r):
    json.dump(r,open(f'{OUT}/{r["id"]}.json','w'),separators=(',',':'))

def recenter(P): return P-P.mean(axis=0)

def setpos(r,P):
    P=recenter(np.array(P,float))
    for a,p in zip(r['atoms'],P): a[1:4]=[round(float(x),3) for x in p]

def bent(d,ang):  # end1, center, end2
    h=math.radians(ang)/2
    return [[-d*math.sin(h),d*math.cos(h)*0-0,0],[0,0,0],[d*math.sin(h),0,0]]
def bentp(d,ang):
    h=math.radians(ang)/2
    return [[d*math.sin(h)*-1,-d*math.cos(h),0],[0,0,0],[d*math.sin(h),-d*math.cos(h),0]]
def line(*ds):  # sequential along x
    x=0;P=[[0,0,0]]
    for d in ds: x+=d;P.append([x,0,0])
    return P

GEOM={
 'hydrogen':line(0.741),'oxygen':line(1.208),'nitrogen':line(1.098),'carbon_monoxide':line(1.128),
 'hydrogen_chloride':line(1.275),'hydrogen_fluoride':line(0.917),'chlorine':line(1.988),'fluorine':line(1.412),'bromine':line(2.281),
 'nitric_oxide':line(1.151),'carbon_dioxide':line(1.162,1.162),'nitrous_oxide':line(1.126,1.186),
 'water':None,'ozone':bentp(1.272,116.8),'nitrogen_dioxide':bentp(1.194,134.1),'sulfur_dioxide':bentp(1.431,119.5),
}
def hcn():  # atoms C,N,H
    return [[0,0,0],[1.153,0,0],[-1.065,0,0]]
def water():
    h=math.radians(104.5)/2; d=0.958
    return [[0,0,0],[d*math.sin(h),d*math.cos(h),0],[-d*math.sin(h),d*math.cos(h),0]]
def h2s():
    h=math.radians(92.1)/2; d=1.336
    return [[0,0,0],[d*math.sin(h),d*math.cos(h),0],[-d*math.sin(h),d*math.cos(h),0]]
def nh3():
    d=1.012;al=math.radians(106.7);c2=(math.cos(al)+0.5)/1.5;ph=math.acos(math.sqrt(c2))
    P=[[0,0,0]]
    for k in range(3):
        t=2*math.pi*k/3;P.append([d*math.sin(ph)*math.cos(t),d*math.sin(ph)*math.sin(t),d*math.cos(ph)])
    return P
GEOM['water']=water();GEOM['hydrogen_cyanide']=hcn();GEOM['hydrogen_sulfide']=h2s();GEOM['ammonia']=nh3()

def load(i): return json.load(open(f'{OUT}/{i}.json'))
for i,P in GEOM.items():
    r=load(i); assert len(r['atoms'])==len(P),(i,len(r['atoms']),len(P)); setpos(r,P); r['method']='experimental geometry'; save(r)

# silicate scaling
for i,t in [('silicate_orthosilicate',1.63),('disilicate',1.625),('silicate_ring_trimer',1.625),('silicate_chain_trimer',1.625),('aluminate_tetrahedron',1.75)]:
    r=load(i);P=np.array([a[1:4] for a in r['atoms']])
    ds=[np.linalg.norm(P[a]-P[b]) for a,b,o in r['bonds']]; s=t/np.mean(ds)
    setpos(r,P*s); r['method']+=' (bond lengths rescaled to typical Si-O / Al-O)'; save(r)

# ---- manual coordinate molecules (dotted SMILES -> explicit bonds)
def manual(i,P,bonds):
    nm=INFO[i]
    mh=Chem.AddHs(Chem.MolFromSmiles(nm[3]))
    q=B.gast(mh); syms=[a.GetSymbol() for a in mh.GetAtoms()]
    return syms,q
# Mg(OH)2: atoms order O,O,Mg,H,H
syms,q=manual('magnesium_hydroxide_unit',None,None)
r=load('magnesium_hydroxide_unit'); assert [a[0] for a in r['atoms']]==syms
setpos(r,[[-1.96,0,0],[1.96,0,0],[0,0,0],[-2.92,0,0],[2.92,0,0]]); r['bonds']=[[0,2,1],[1,2,1],[0,3,1],[1,4,1]]; r['method']='idealized linear geometry (Mg-O 1.96 A)'; save(r)
# calcium carbonate: atoms Ca,O,C,O,O
r=load('calcium_carbonate_unit'); print([a[0] for a in r['atoms']])
setpos(r,[[0,0,0],[2.02,1.1,0],[2.66,0,0],[2.02,-1.1,0],[3.94,0,0]]); r['bonds']=[[0,1,1],[0,3,1],[1,2,1],[2,3,1],[2,4,2]]; r['method']='idealized bidentate geometry'; save(r)
# cisplatin: atoms from N[Pt](N)(Cl)Cl : N,Pt,N,Cl,Cl,H*6
r=load('cisplatin'); print([a[0] for a in r['atoms']],r['bonds'])
Pt=[0,0,0]; N1=[-2.05,0,0]; N2=[0,-2.05,0]; C1=[2.33,0,0]; C2=[0,2.33,0]
def hs(N,away):
    away=np.array(away,float);away/=np.linalg.norm(away)
    # build tetrahedral-ish: one H in plane-normal pair
    perp=np.cross(away,[0,0,1]);perp/=np.linalg.norm(perp)
    z=np.array([0,0,1.0]);c=math.cos(math.radians(70.5));
    Hs=[]
    for k in range(3):
        t=2*math.pi*k/3
        d=0.34*away+0.94*(math.cos(t)*perp+math.sin(t)*z)
        Hs.append(np.array(N)+1.01*d/np.linalg.norm(d))
    return Hs
H=hs(N1,[-1,0,0])+hs(N2,[0,-1,0])
# order of H follows heavy atoms order: first N (idx0) hs, then N idx2
P=[N1,Pt,N2,C1,C2]+H
r['atoms'][0][0]; assert len(P)==len(r['atoms'])
setpos(r,P); r['method']='idealized square-planar geometry'; save(r)

# ---- metalloporphyrins
FREE={'heme_b':"CC1=C(C=C)C2=CC3=C(C)C(C=C)=C(N3)C=C4C(C)=C(CCC(=O)O)C(=N4)C=C5C(CCC(=O)O)=C(C)C(=N5)C=C1N2",
 'chlorophyll_a':"CC1=C(C=C)C2=CC3=C(C)C(CC)=C(N3)C=C4C(C)=C(C(=O)C%10C(=O)OC)C(=N4)C%10=C5C(CCC(=O)"+B.PHYT+")C(C)C(=N5)C=C1N2"}
for i,(sym,chg,dmean) in {'heme_b':('Fe',-2,2.0),'chlorophyll_a':('Mg',-2,2.07)}.items():
    mh,cid,meth=B.embed(FREE[i])
    rw=Chem.RWMol(mh)
    Ns=[a.GetIdx() for a in rw.GetAtoms() if a.GetSymbol()=='N']
    rm=[]
    for n in Ns:
        hh=[x.GetIdx() for x in rw.GetAtomWithIdx(n).GetNeighbors() if x.GetSymbol()=='H']
        rm+=hh
        if not hh: rw.GetAtomWithIdx(n).SetFormalCharge(1)
    conf=rw.GetConformer(cid); pos=np.array(conf.GetPositions())
    cen=pos[Ns].mean(axis=0)
    mi=rw.AddAtom(Chem.Atom(sym)); rw.GetAtomWithIdx(mi).SetFormalCharge(chg)
    # re-fetch conformer positions
    for n in Ns: rw.AddBond(n,mi,Chem.BondType.SINGLE)
    # set position
    conf=rw.GetConformer(cid)
    from rdkit.Geometry import Point3D
    conf.SetAtomPosition(mi,Point3D(*cen))
    for h in sorted(rm,reverse=True): rw.RemoveAtom(h)
    m2=rw.GetMol(); m2.UpdatePropertyCache(strict=False)
    Chem.SanitizeMol(m2,Chem.SANITIZE_ALL^Chem.SANITIZE_PROPERTIES,catchErrors=True)
    nm=INFO[i]
    r=B.to_record(i,nm[1],nm[2],B.SPECIAL[nm[3]],nm[4],m2,cid,meth+' (free-base ring, metal placed at N4 centroid)')
    P=np.array([a[1:4] for a in r['atoms']]); mi2=len(P)-1 if r['atoms'][-1][0]==sym else [k for k,a in enumerate(r['atoms']) if a[0]==sym][0]
    dd=[np.linalg.norm(P[mi2]-P[n]) for n in Ns if n<mi2 or True and False] 
    print(i,r['formula'],'M-N:',[round(float(np.linalg.norm(P[b]-P[a])),2) for a,b,o in r['bonds'] if r['atoms'][a][0]==sym or r['atoms'][b][0]==sym])
    save(r)
