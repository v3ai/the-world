import sys,json,os
sys.path.insert(0,'.')
import bcif
from Bio.PDB.MMCIF2Dict import MMCIF2Dict
D='work/dl_pdb/'
OUT='data/proteins'; os.makedirs(OUT,exist_ok=True)
NUC={'A','C','G','T','U','DA','DC','DG','DT','DU','DI','I'}
def asl(x): return x if isinstance(x,list) else [x]
def from_cif(path):
    d=MMCIF2Dict(path); g=lambda k:asl(d[k]) if k in d else []
    A=dict(grp=g('_atom_site.group_PDB'),el=g('_atom_site.type_symbol'),x=g('_atom_site.Cartn_x'),y=g('_atom_site.Cartn_y'),z=g('_atom_site.Cartn_z'),
      ch=g('_atom_site.auth_asym_id'),res=g('_atom_site.auth_comp_id'),seq=g('_atom_site.auth_seq_id'),name=g('_atom_site.label_atom_id'),
      model=g('_atom_site.pdbx_PDB_model_num'),alt=g('_atom_site.label_alt_id'))
    hel=list(zip(g('_struct_conf.beg_auth_asym_id'),g('_struct_conf.beg_auth_seq_id'),g('_struct_conf.end_auth_seq_id'))) if '_struct_conf.id' in d else []
    sh=list(zip(g('_struct_sheet_range.beg_auth_asym_id'),g('_struct_sheet_range.beg_auth_seq_id'),g('_struct_sheet_range.end_auth_seq_id')))
    title=asl(d.get('_struct.title',['']))[0]
    return A,hel,sh,title
def from_bcif(path):
    c=bcif.load(path); f=lambda n:bcif.col(c,'atom_site',n)
    A=dict(grp=f('group_PDB'),el=f('type_symbol'),x=f('Cartn_x'),y=f('Cartn_y'),z=f('Cartn_z'),ch=f('auth_asym_id'),res=f('auth_comp_id'),seq=f('auth_seq_id'),name=f('label_atom_id'),model=f('pdbx_PDB_model_num'),alt=f('label_alt_id'))
    hel=list(zip(bcif.col(c,'struct_conf','beg_auth_asym_id'),bcif.col(c,'struct_conf','beg_auth_seq_id'),bcif.col(c,'struct_conf','end_auth_seq_id')))
    sh=list(zip(bcif.col(c,'struct_sheet_range','beg_auth_asym_id'),bcif.col(c,'struct_sheet_range','beg_auth_seq_id'),bcif.col(c,'struct_sheet_range','end_auth_seq_id'))) if 'struct_sheet_range' in c else []
    title=bcif.col(c,'struct','title')[0]
    return A,hel,sh,title
def from_pdb(path):
    A={k:[] for k in 'grp el x y z ch res seq name model alt'.split()}
    hel=[];sh=[];title=[];model=1
    for l in open(path):
        r=l[:6].strip()
        if r=='TITLE': title.append(l[10:].strip())
        elif r=='MODEL': model=int(l[10:14])
        elif r=='HELIX': hel.append((l[19],int(l[21:25]),int(l[33:37])))
        elif r=='SHEET': sh.append((l[21],int(l[22:26]),int(l[33:37])))
        elif r in('ATOM','HETATM'):
            A['grp'].append(r);A['name'].append(l[12:16].strip());A['alt'].append(l[16].strip() or '.');A['res'].append(l[17:20].strip());A['ch'].append(l[21]);A['seq'].append(l[22:26]);
            A['x'].append(l[30:38]);A['y'].append(l[38:46]);A['z'].append(l[46:54]);A['el'].append((l[76:78].strip() or l[12:16].strip()[0]));A['model'].append(model)
    return A,hel,sh,' '.join(title)
def conv(pid,name,path,kind,note):
    A,hel,sh,title=dict(cif=from_cif,bcif=from_bcif,pdb=from_pdb)[kind](path)
    atoms=[];nH=nW=0
    n=len(A['x'])
    for i in range(n):
        if str(A['model'][i]) not in('1',): continue
        if str(A['alt'][i]) not in('.','A','',' ','?'): continue
        el=str(A['el'][i]).strip().capitalize()
        if el in('H','D'): nH+=1;continue
        if A['res'][i] in('HOH','WAT','DOD'): nW+=1;continue
        nm=A['name'][i]; res=A['res'][i]
        isca = (nm=='CA' and el=='C') or (nm=="P" and res in NUC)
        atoms.append([el,round(float(A['x'][i]),3),round(float(A['y'][i]),3),round(float(A['z'][i]),3),A['ch'][i],res,int(A['seq'][i]),bool(isca)])
    helices=sorted({(c,int(a),int(b)) for c,a,b in hel}); sheets=sorted({(c,int(a),int(b)) for c,a,b in sh})
    rec=dict(id=pid,name=name,title=title,atoms=atoms,helices=[list(h) for h in helices],sheets=[list(s) for s in sheets],notes=note,source=path.split('/')[-1])
    json.dump(rec,open(f'{OUT}/{pid}.json','w'),separators=(',',':'))
    chains=sorted(set(a[4] for a in atoms)); het=sorted({a[5] for a in atoms}-set('ALA ARG ASN ASP CYS GLN GLU GLY HIS ILE LEU LYS MET PHE PRO SER THR TRP TYR VAL'.split())-NUC)
    print(f"{pid}: {len(atoms)} atoms (dropped {nH} H, {nW} water), chains {chains}, CA/P {sum(a[7] for a in atoms)}, helices {len(helices)}, sheets {len(sheets)}, non-standard res {het}, {os.path.getsize(f'{OUT}/{pid}.json')//1024} KB")
conv('1ubq','Ubiquitin (1UBQ)',D+'3dmol_1ubq.cif','cif','76-residue regulatory protein that tags other proteins for degradation; X-ray structure.')
conv('1crn','Crambin (1CRN)',D+'ngl_1crn.pdb','pdb','46-residue plant seed protein, one of the smallest well-studied proteins, solved at very high resolution.')
conv('1bna','B-DNA dodecamer (1BNA)',D+'molstar_1bna.cif','cif','The Dickerson-Drew dodecamer CGCGAATTCGCG, the first crystal structure of B-form DNA. Backbone trace atoms (isCA) are the phosphorus atoms.')
conv('1ema','Green fluorescent protein (1EMA)',D+'ngl_1ema.cif','cif','GFP from Aequorea victoria: an 11-strand beta barrel around a chromophore (CRO residue).')
conv('4hhb','Human deoxyhemoglobin (4HHB)',D+'3dmol_4hhb.bcif','bcif','Tetramer of two alpha and two beta chains, each holding a heme group (HEM) that binds oxygen.')
