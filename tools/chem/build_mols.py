import sys, json, os, math, warnings
sys.path.insert(0,'.')
import numpy as np
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors
RDLogger.DisableLog('rdApp.*')
from mol_list import M
OUT='data/molecules'
os.makedirs(OUT,exist_ok=True)
PHYT="OCC=C(C)CCCC(C)CCCC(C)CCCC(C)C"
HEME_SMI="CC1=C(C=C)C2=CC3=C(C)C(C=C)=C([N]3%12)C=C4C(C)=C(CCC(=O)O)C(=[N+]4%13)C=C5C(CCC(=O)O)=C(C)C(=[N+]5%14)C=C1[N]2%11.[Fe-2]%11%12%13%14"
# fix: ring numbers 2/3/4/5 already used for ring closures; use explicit tagging
HEME_SMI="CC1=C(C=C)C2=CC3=C(C)C(C=C)=C(N3%12)C=C4C(C)=C(CCC(=O)O)C(=[N+]4%13)C=C5C(CCC(=O)O)=C(C)C(=[N+]5%14)C=C1N2%11.[Fe-2]%11%12%13%14"
CHL_SMI="CC1=C(C=C)C2=CC3=C(C)C(CC)=C(N3%12)C=C4C(C)=C(C(=O)C%10C(=O)OC)C(=[N+]4%13)C%10=C5C(CCC(=O)"+PHYT+")C(C)C(=[N+]5%14)C=C1N2%11.[Mg-2]%11%12%13%14"
SPECIAL={"@HEME":HEME_SMI,"@CHL":CHL_SMI}

def gast(m):
    AllChem.ComputeGasteigerCharges(m)
    q=[]
    for a in m.GetAtoms():
        v=a.GetDoubleProp('_GasteigerCharge') if a.HasProp('_GasteigerCharge') else 0.0
        if not math.isfinite(v): v=0.0
        q.append(v)
    return q

def embed(smi, seed=7):
    m=Chem.MolFromSmiles(smi)
    if m is None:
        # allow unsanitized (metal complexes)
        m=Chem.MolFromSmiles(smi,sanitize=False)
        m.UpdatePropertyCache(strict=False)
        Chem.SanitizeMol(m,Chem.SANITIZE_ALL^Chem.SANITIZE_PROPERTIES,catchErrors=True)
    mh=Chem.AddHs(m)
    nh=mh.GetNumAtoms()
    ncf=1 if nh<4 else (30 if nh<40 else (12 if nh<80 else 6))
    ps=AllChem.ETKDGv3(); ps.randomSeed=seed; ps.useRandomCoords = nh>60; ps.maxIterations=2000
    cids=list(AllChem.EmbedMultipleConfs(mh,ncf,ps))
    if not cids:
        ps.useRandomCoords=True
        cids=list(AllChem.EmbedMultipleConfs(mh,max(2,ncf//2),ps))
    if not cids: raise RuntimeError("embed failed")
    method='MMFF94'
    try:
        ok=AllChem.MMFFHasAllMoleculeParams(mh)
    except Exception: ok=False
    best=None;be=1e18
    if ok:
        res=AllChem.MMFFOptimizeMoleculeConfs(mh,maxIters=5000,mmffVariant='MMFF94')
        for cid,(c,e) in zip(cids,res):
            if e<be: be=e;best=cid
    else:
        method='UFF'
        res=AllChem.UFFOptimizeMoleculeConfs(mh,maxIters=5000)
        for cid,(c,e) in zip(cids,res):
            if e<be: be=e;best=cid
    return mh,best,method

def to_record(i,name,cat,smi,note,mh,cid,method):
    pos=mh.GetConformer(cid).GetPositions()
    pos=pos-pos.mean(axis=0)
    q=gast(mh)
    atoms=[[a.GetSymbol(),round(float(pos[k][0]),3),round(float(pos[k][1]),3),round(float(pos[k][2]),3),round(q[k],3)] for k,a in enumerate(mh.GetAtoms())]
    bonds=[]
    for b in mh.GetBonds():
        bt=b.GetBondType()
        o=1.5 if bt==Chem.BondType.AROMATIC else (2 if bt==Chem.BondType.DOUBLE else 3 if bt==Chem.BondType.TRIPLE else 1)
        bonds.append([b.GetBeginAtomIdx(),b.GetEndAtomIdx(),o])
    try: formula=rdMolDescriptors.CalcMolFormula(mh)
    except Exception: formula=""
    mw=round(Descriptors.MolWt(mh),3)
    return dict(id=i,name=name,formula=formula,smiles=smi,mw=mw,category=cat,atoms=atoms,bonds=bonds,notes=note,method=method)

def manual_pair(i,name,cat,smi,note,sym,d,charges):
    pos=np.array([[-d/2,0,0],[d/2,0,0]])
    atoms=[[sym[0],round(-d/2,3),0.0,0.0,charges[0]],[sym[1],round(d/2,3),0.0,0.0,charges[1]]]
    mw=round(sum(Chem.GetPeriodicTable().GetAtomicWeight(Chem.GetPeriodicTable().GetAtomicNumber(s)) for s in sym),3)
    return dict(id=i,name=name,formula=sym[0]+sym[1],smiles=smi,mw=mw,category=cat,atoms=atoms,bonds=[[0,1,1]],notes=note,method='experimental bond length')

MANUAL={"nacl_pair":(("Na","Cl"),2.361,(1.0,-1.0)),"kcl_pair":(("K","Cl"),2.667,(1.0,-1.0)),"sodium_atom_pair_na2":(("Na","Na"),3.08,(0.0,0.0))}
if __name__=='__main__':
    only=sys.argv[1:]
    fails=[]; recs=[]
    for (i,name,cat,smi,note) in M:
        if only and i not in only: continue
        try:
            if i in MANUAL:
                s,d,c=MANUAL[i]; r=manual_pair(i,name,cat,smi,note,s,d,c)
            else:
                s=SPECIAL.get(smi,smi)
                mh,cid,meth=embed(s)
                r=to_record(i,name,cat,s if smi in SPECIAL else smi,note,mh,cid,meth)
            json.dump(r,open(f'{OUT}/{i}.json','w'),separators=(',',':'))
            recs.append(r)
        except Exception as e:
            fails.append((i,str(e)[:100]))
    print(len(recs),'ok; fails:',fails)
