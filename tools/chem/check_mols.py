import json,glob,math,sys
import numpy as np
from rdkit import Chem
bad=[]
for f in sorted(glob.glob('data/molecules/*.json')):
    if f.endswith('index.json'): continue
    r=json.load(open(f)); P=np.array([a[1:4] for a in r['atoms']])
    bset=set()
    for i,j,o in r['bonds']:
        d=np.linalg.norm(P[i]-P[j]); bset.add((i,j)); bset.add((j,i))
        if (d>2.3 or d<0.85) and r['id'] not in('nacl_pair','kcl_pair','sodium_atom_pair_na2'):
            bad.append((r['id'],'bondlen',round(d,2),r['atoms'][i][0],r['atoms'][j][0]))
    D=np.linalg.norm(P[:,None]-P[None],axis=2)
    n=len(P)
    for i in range(n):
        for j in range(i+1,n):
            if (i,j) not in bset and D[i,j]<1.2 and not (r['atoms'][i][0]=='H' and r['atoms'][j][0]=='H' and D[i,j]>0.9):
                bad.append((r['id'],'clash',round(D[i,j],2),r['atoms'][i][0],r['atoms'][j][0]));break
print(bad[:40],len(bad))
for k in ['heme_b','chlorophyll_a','fad','nad_plus','atp','glucose_beta','cellotriose','sucrose','popc','cholesterol','aa_arg','aa_pro','water','benzene','nitrogen_dioxide']:
    r=json.load(open(f'data/molecules/{k}.json')); print(k,r['formula'],r['mw'],len(r['atoms']),r['method'])
# CIP checks
for k,exp in [('glucose_beta','C6H12O6'),('glucose_alpha',None),('aa_ala',None)]:
    m=Chem.MolFromSmiles(json.load(open(f'data/molecules/{k}.json'))['smiles'])
    from rdkit.Chem import rdCIPLabeler; rdCIPLabeler.AssignCIPLabels(m)
    print(k,[(a.GetIdx(),a.GetSymbol(),a.GetProp('_CIPCode')) for a in m.GetAtoms() if a.HasProp('_CIPCode')])
