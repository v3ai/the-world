import sys,json,math
sys.path.insert(0,'.')
import numpy as np
from scipy.optimize import minimize
from rdkit import Chem
from rdkit.Chem import AllChem
import build_mols as B
OUT=B.OUT
# smiles with atom maps on H-bonding heavy atoms (map = role)
BASES={
 'A':("[NH2:1]c1[n:2]cnc2[nH]cnc12"),
 'T':("Cc1c[nH]c(=O)[nH:2]c1=[O:1]"),   # map1=O4 (pairs N6), map2=N3 (pairs N1)
 'G':("[NH2:3]c1nc2[nH]cnc2c(=[O:1])[nH:2]1"),  # 1=O6, 2=N1, 3=N2
 'C':("[NH2:1]c1cc[nH]c(=[O:3])[n:2]1"),   # 1=N4, 2=N3, 3=O2
}
def build(sm):
    m=Chem.MolFromSmiles(sm)
    maps={a.GetAtomMapNum():a.GetIdx() for a in m.GetAtoms() if a.GetAtomMapNum()}
    for a in m.GetAtoms(): a.SetAtomMapNum(0)
    mh=Chem.AddHs(m)
    AllChem.EmbedMolecule(mh,AllChem.ETKDGv3()); AllChem.MMFFOptimizeMolecule(mh,maxIters=5000)
    P=mh.GetConformer().GetPositions(); P=P-P.mean(0)
    # plane via SVD
    u,s,vt=np.linalg.svd(P); R=vt  # rows = principal axes
    P2=P@R.T
    if np.linalg.det(R)<0: P2[:,2]*=-1
    return mh,P2,maps
def place(P,ang,t,flipx):
    Q=P.copy()
    if flipx: Q[:,0]*=-1
    c,s=math.cos(ang),math.sin(ang)
    Rz=np.array([[c,-s,0],[s,c,0],[0,0,1]])
    Q=Q@Rz.T; Q[:,0]+=t[0];Q[:,1]+=t[1]
    return Q
def make(pid,name,b1,b2,pairs,targets,note):
    m1,P1,k1=build(BASES[b1]); m2,P2,k2=build(BASES[b2])
    n1=len(P1)
    heavy1=[i for i,a in enumerate(m1.GetAtoms()) if a.GetSymbol()!='H']
    heavy2=[i for i,a in enumerate(m2.GetAtoms()) if a.GetSymbol()!='H']
    best=None
    for flip in (0,1):
        for ang0 in np.linspace(0,2*math.pi,12,endpoint=False):
            for t0 in ([3,0],[-3,0],[0,3],[0,-3]):
                def cost(x):
                    Q=place(P2,x[0],x[1:3],flip)
                    c=0
                    for (r1,r2),tg in zip(pairs,targets):
                        c+=(np.linalg.norm(P1[k1[r1]]-Q[k2[r2]])-tg)**2
                    # repulsion between heavy atoms
                    D=np.linalg.norm(P1[heavy1][:,None]-Q[heavy2][None],axis=2)
                    c+=np.sum(np.clip(2.6-D,0,None)**2)*0.5  # heavy atoms not H-bonded should be > ~2.6
                    # allowed H-bond heavy atoms excluded: they are targeted ~2.9 so no penalty
                    return c
                r=minimize(cost,[ang0,*t0],method='Nelder-Mead',options=dict(xatol=1e-5,fatol=1e-9,maxiter=4000))
                if best is None or r.fun<best[0]: best=(r.fun,flip,r.x)
    f,flip,x=best
    Q=place(P2,x[0],x[1:3],flip)
    allp=np.vstack([P1,Q])
    allp-=allp.mean(0)
    syms=[a.GetSymbol() for a in m1.GetAtoms()]+[a.GetSymbol() for a in m2.GetAtoms()]
    q=B.gast(m1)+B.gast(m2)
    atoms=[[s,round(float(p[0]),3),round(float(p[1]),3),round(float(p[2]),3),round(c,3)] for s,p,c in zip(syms,allp,q)]
    bonds=[]
    def addb(m,off):
        for b in m.GetBonds():
            bt=b.GetBondType();o=1.5 if bt==Chem.BondType.AROMATIC else 2 if bt==Chem.BondType.DOUBLE else 3 if bt==Chem.BondType.TRIPLE else 1
            bonds.append([b.GetBeginAtomIdx()+off,b.GetEndAtomIdx()+off,o])
    addb(m1,0);addb(m2,n1)
    smi=BASES[b1].replace(':1]',']').replace(':2]',']').replace(':3]',']')+'.'+BASES[b2].replace(':1]',']').replace(':2]',']').replace(':3]',']')
    smi=Chem.MolToSmiles(Chem.MolFromSmiles(smi.replace('[NH2]','N').replace('[nH]','[nH]')))
    mol=Chem.CombineMols(m1,m2)
    from rdkit.Chem import Descriptors,rdMolDescriptors
    rec=dict(id=pid,name=name,formula=rdMolDescriptors.CalcMolFormula(mol),smiles=smi,mw=round(Descriptors.MolWt(mol),3),category='nucleotide',atoms=atoms,bonds=bonds,notes=note,method='ETKDGv3+MMFF94 bases, rigid in-plane Watson-Crick docking',
        hbonds=[[k1[r1],n1+k2[r2]] for r1,r2 in pairs])
    # verification
    P=np.array([a[1:4] for a in atoms])
    rep=[]
    for (r1,r2),tg in zip(pairs,targets):
        i=k1[r1];j=n1+k2[r2]; rep.append((syms[i]+str(i),syms[j]+str(j),round(float(np.linalg.norm(P[i]-P[j])),3),tg))
    # H-bond H...acceptor and angle
    det=[]
    for (i,j,_,_) in [(int(r[0][1:]),int(r[1][1:]),0,0) for r in rep]:
        for don,acc in ((i,j),(j,i)):
            hs=[nb.GetIdx() for nb in (m1 if don<n1 else m2).GetAtomWithIdx(don if don<n1 else don-n1).GetNeighbors() if nb.GetSymbol()=='H']
            for h in hs:
                hh=h if don<n1 else h+n1
                dist=np.linalg.norm(P[hh]-P[acc])
                v1=P[don]-P[hh];v2=P[acc]-P[hh]
                ang=math.degrees(math.acos(np.dot(v1,v2)/np.linalg.norm(v1)/np.linalg.norm(v2)))
                if dist<2.4: det.append((syms[don]+str(don),'H···',syms[acc]+str(acc),round(float(dist),2),round(ang,1)))
    def n9(m,off):
        ri=m.GetRingInfo()
        for a in m.GetAtoms():
            if a.GetSymbol()=='N' and a.GetTotalNumHs(includeNeighbors=True)==1 and any(len(r)==5 and a.GetIdx() in r for r in ri.AtomRings()): return a.GetIdx()+off
    def n1p(m,off):
        for a in m.GetAtoms():
            if a.GetSymbol()=='N' and a.GetTotalNumHs(includeNeighbors=True)==1 and any(nb.GetSymbol()=='C' and nb.GetTotalNumHs(includeNeighbors=True)==1 for nb in a.GetNeighbors()): return a.GetIdx()+off
    gl=(n9(m1,0),n1p(m2,n1)); print('  glycosidic N9...N1 distance',round(float(np.linalg.norm(P[gl[0]]-P[gl[1]])),2),'A (expected ~8.9-9.0)')
    zrms=float(np.sqrt(np.mean(P[:,2]**2)))
    return rec,rep,det,zrms,f
res={}
for pid,name,b1,b2,pairs,tg,note in [
 ('bp_AT','Adenine-thymine Watson-Crick base pair','A','T',[(1,1),(2,2)],[2.95,2.82],"Two hydrogen bonds hold adenine to thymine in the DNA double helix, with the bases lying flat in one plane."),
 ('bp_GC','Guanine-cytosine Watson-Crick base pair','G','C',[(1,1),(2,2),(3,3)],[2.91,2.95,2.86],"Three hydrogen bonds hold guanine to cytosine, making G-C pairs stronger than A-T pairs.")]:
    rec,rep,det,z,f=make(pid,name,b1,b2,pairs,tg,note)
    json.dump(rec,open(f'{OUT}/{pid}.json','w'),separators=(',',':'))
    print(pid,'cost',round(f,5),'heavy-atom distances (actual vs target):',rep)
    print('  H-bond H...A distance / D-H...A angle:',det,' planarity z-rms Å:',round(z,3))
    res[pid]=dict(dist=rep,hb=det)
json.dump(res,open('work/scripts_chem/bp_check.json','w'))
