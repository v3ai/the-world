import sys,re,json,os,numpy as np
sys.path.insert(0,'work/anatomy')
from load import load as load_d
from oa import load_oa
import fast_simplification as fs
from scipy.spatial import cKDTree

A,DG=load_d(); OA=load_oa()
OUT='data/anatomy/'
os.makedirs(OUT,exist_ok=True)

# ---------- helpers ----------
def dname(k): return DG[k][0]['name']
def dcx(k):
    v=DG[k][1]; return (v[:,0].min()+v[:,0].max())/2
def dside(k):
    n=dname(k).lower()
    if re.search(r'\bleft\b',n): return 'L'
    if re.search(r'\bright\b',n): return 'R'
    x=dcx(k)
    return 'L' if x>0.004 else ('R' if x<-0.004 else None)
def Dsel(rx,side=None,notrx=None,ids=None):
    out=[]
    for k,(p,v,i) in DG.items():
        n=p['name'].lower()
        if ids is not None:
            if k in ids: out.append(k)
            continue
        if not re.search(rx,n): continue
        if notrx and re.search(notrx,n): continue
        if side and dside(k)!=side: continue
        out.append(k)
    return out
def merge(meshes):
    vs=[];fs_=[];o=0
    for v,f in meshes:
        vs.append(v.astype(np.float64)); fs_.append(f.astype(np.int64)+o); o+=len(v)
    return np.vstack(vs),np.vstack(fs_)
def clean(v,f,tol=1e-5):
    # weld vertices
    key=np.round(v/tol).astype(np.int64)
    _,first,inv=np.unique(key,axis=0,return_index=True,return_inverse=True)
    inv=inv.reshape(-1)
    v2=v[first]; f2=inv[f]
    ok=(f2[:,0]!=f2[:,1])&(f2[:,1]!=f2[:,2])&(f2[:,0]!=f2[:,2])
    f2=f2[ok]
    # dedupe faces (identical duplicates, any winding)
    s=np.sort(f2,axis=1)
    _,ui=np.unique(s,axis=0,return_index=True)
    f2=f2[np.sort(ui)]
    return compact(v2,f2)
def compact(v,f):
    used=np.unique(f); m=-np.ones(len(v),np.int64); m[used]=np.arange(len(used))
    return v[used],m[f]
def decimate(v,f,target):
    if len(f)<=target: return v,f
    v,f=clean(v,f)
    if len(f)<=target: return v,f
    red=1-target/len(f)
    v2,f2=fs.simplify(v.astype(np.float64),f.astype(np.int64),target_reduction=red,agg=5)
    return compact(v2,f2)
def Dmesh(ids): return merge([(DG[k][1],DG[k][2]) for k in ids])
def Omesh(names): return merge([(OA[k][1],OA[k][2]) for k in names])
def fma_of(ids):
    s=set(DG[k][0]['conceptId'] for k in ids)
    return s.pop() if len(s)==1 else None

PARTS=[]   # dicts with v,f
def add(id,name,system,side,v,f,target,fma=None,color=None,extra=None):
    if len(f)==0: print('EMPTY',id); return
    v,f=decimate(v,f,target)
    d=dict(id=id,name=name,system=system,side=side,fma=fma,v=v,f=f,color=color)
    if extra: d.update(extra)
    PARTS.append(d)
def addD(id,name,system,side,ids,target,fma='auto',color=None,extra=None):
    if not ids: print('NO MATCH',id); return
    v,f=Dmesh(ids)
    add(id,name,system,side,v,f,target,fma_of(ids) if fma=='auto' else fma,color,extra)
def addO(id,name,system,side,names,target,fma=None,color=None,extra=None):
    v,f=Omesh(names); add(id,name,system,side,v,f,target,fma,color,extra)

SIDES=[('L','Left','_l'),('R','Right','_r')]
# ---------- skin ----------
addD('skin','Skin','integumentary',None,['FJ2810'],20000)

# ---------- skeletal ----------
S='skeletal'
addD('skull','Skull (cranium and face)',S,None,Dsel(r'^(frontal bone|occipital bone|sphenoid bone|ethmoid|vomer|(left|right) (parietal bone|temporal bone|zygomatic bone|maxilla|nasal bone|palatine bone|lacrimal bone|inferior nasal concha))$'),6500,'FMA46565')
addD('mandible','Mandible',S,None,['FJ3289'],1500)
addD('teeth','Teeth',S,None,Dsel(r'tooth$'),3000,'FMA12516')
addD('hyoid','Hyoid bone',S,None,['FJ2772'],500,'FMA52749')
cerv=Dsel(r'^(atlas|axis|(third|fourth|fifth|sixth|seventh) cervical vertebra)$')
thor=Dsel(r'^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) thoracic vertebra$')
lumb=Dsel(r'^(first|second|third|fourth|fifth) lumbar vertebra$')
addD('cervical_spine','Cervical vertebrae (C1-C7)',S,None,cerv,2200,'FMA24138')
addD('thoracic_spine','Thoracic vertebrae (T1-T12)',S,None,thor,3500,'FMA9140')
addD('lumbar_spine','Lumbar vertebrae (L1-L5)',S,None,lumb,2500,'FMA16203')
addD('sacrum','Sacrum',S,None,Dsel(r'^sacrum$'),1000,'FMA16202')
addD('intervertebral_discs','Intervertebral discs',S,None,Dsel(r'^intervertebral disk'),1500)
addD('sternum','Sternum',S,None,Dsel(r'^(manubrium|body of sternum|xiphoid process)$'),1300,'FMA7485')
for s,nm,sf in SIDES:
    sl=s
    addD('ribs'+sf,f'Ribs and costal cartilages ({nm})',S,s,Dsel(r'^%s \w+ (rib|costal cartilage)$'%nm.lower()),2800)
    addD('clavicle'+sf,f'Clavicle ({nm})',S,s,Dsel(r'^%s clavicle$'%nm.lower()),500)
    addD('scapula'+sf,f'Scapula ({nm})',S,s,Dsel(r'^%s scapula$'%nm.lower()),1100)
    addD('humerus'+sf,f'Humerus ({nm})',S,s,Dsel(r'^%s humerus$'%nm.lower()),900)
    addD('radius'+sf,f'Radius ({nm})',S,s,Dsel(r'^%s radius$'%nm.lower()),450)
    addD('ulna'+sf,f'Ulna ({nm})',S,s,Dsel(r'^%s ulna$'%nm.lower()),500)
    addD('hand_bones'+sf,f'Hand bones ({nm})',S,s,Dsel(r'(phalanx of %s (thumb|\w+ finger)|^%s (\w+ )?metacarpal bone|^%s (capitate|hamate|lunate|pisiform|scaphoid|trapezium|trapezoid|triquetral)$)'%(nm.lower(),nm.lower(),nm.lower())),1800)
    addD('hip_bone'+sf,f'Hip bone ({nm})',S,s,Dsel(r'^%s hip bone$'%nm.lower()),1800)
    addD('femur'+sf,f'Femur ({nm})',S,s,Dsel(r'^%s femur$'%nm.lower()),1000)
    addD('patella'+sf,f'Patella ({nm})',S,s,Dsel(r'^%s patella$'%nm.lower()),300)
    addD('tibia'+sf,f'Tibia ({nm})',S,s,Dsel(r'^%s tibia$'%nm.lower()),700)
    addD('fibula'+sf,f'Fibula ({nm})',S,s,Dsel(r'^%s fibula$'%nm.lower()),450)
    addD('foot_bones'+sf,f'Foot bones ({nm})',S,s,Dsel(r'(phalanx of %s .*toe|^%s (\w+ )?metatarsal bone|^%s (talus|calcaneus|cuboid bone|\w+ cuneiform bone|navicular bone)$|(navicular|sesamoid) bone of %s foot)'%((nm.lower(),)*4)),2200)

# ---------- muscular ----------
M='muscular'
for s,nm,sf in SIDES:
    n=nm.lower()
    addD('pectoralis_major'+sf,f'Pectoralis major ({nm})',M,s,Dsel(r'pectoralis major',side=s),1400,'auto')
    addD('deltoid'+sf,f'Deltoid ({nm})',M,s,[k for k in Dsel(r'deltoid',side=s) if DG[k][0]['system']=='muscular'],1400)
    addD('biceps_brachii'+sf,f'Biceps brachii ({nm})',M,s,Dsel(r'biceps brachii',side=s),900)
    addD('triceps_brachii'+sf,f'Triceps brachii ({nm})',M,s,Dsel(r'triceps brachii',side=s),1100)
    addD('trapezius'+sf,f'Trapezius ({nm})',M,s,Dsel(r'trapezius',side=s),1800)
    addD('sternocleidomastoid'+sf,f'Sternocleidomastoid ({nm})',M,s,Dsel(r'^%s sternocleidomastoid$'%n),700,'FMA13407')
    addD('gluteus_maximus'+sf,f'Gluteus maximus ({nm})',M,s,Dsel(r'^%s gluteus maximus$'%n),1300,'FMA22314')
    addD('quadriceps'+sf,f'Quadriceps femoris ({nm})',M,s,Dsel(r'^%s (rectus femoris|vastus \w+)$'%n),2200)
    addD('hamstrings'+sf,f'Hamstrings ({nm})',M,s,Dsel(r'(semitendinosus|semimembranosus|biceps femoris)',side=s),1800)
    addD('gastrocnemius'+sf,f'Gastrocnemius ({nm})',M,s,Dsel(r'gastrocnemius',side=s),1000)
    addO('forearm_muscles'+sf,f'Forearm muscles ({nm})',M,s,['forearm_muscles'+sf],3000)
    addO('back_muscles'+sf,f'Back muscles incl. latissimus dorsi ({nm})',M,s,['back_muscles'+sf],4000)
addD('diaphragm','Diaphragm',M,None,['FJ3131'],2500,'FMA13295')
addO('abdominal_muscles','Abdominal wall muscles (rectus abdominis, obliques)',M,None,['abdominal_muscles'],4500)

# ---------- nervous ----------
N='nervous'
bv,bf=OA['brain'][1].astype(np.float64),OA['brain'][2]
cx=bv[bf].mean(1)[:,0]
for s,nm,sf in SIDES:
    msk=(cx>0) if s=='L' else (cx<=0)
    v,f=compact(bv,bf[msk])
    add('cerebrum'+sf,f'Cerebral hemisphere ({nm})',N,s,v,f,4500,'FMA61819' if s=='L' else 'FMA67292')
addD('cerebellum','Cerebellum',N,None,Dsel(r'^cerebellum$'),2200,'FMA67944')
addD('brainstem','Brainstem (midbrain, pons, medulla)',N,None,Dsel(r'^(midbrain|pons|medulla oblongata)$'),1800,'FMA79876')
for s,nm,sf in SIDES:
    pass

# ---------- cardiovascular: heart ----------
C='cardiovascular'
wall=['FJ2428','FJ2438','FJ2439']
addD('heart','Heart',C,None,wall,5500,'FMA7088',extra=dict(whole=True))
addD('left_atrium','Left atrium',C,'L',['FJ2438'],1500,'FMA7097',extra=dict(parent='heart'))
addD('right_atrium','Right atrium',C,'R',['FJ2439'],1500,'FMA7096',extra=dict(parent='heart'))
# split ventricular wall by nearest cavity
vw,fw=DG['FJ2428'][1].astype(np.float64),DG['FJ2428'][2]
tL=cKDTree(DG['FJ2422'][1]); tR=cKDTree(DG['FJ2423'][1])
cen=vw[fw].mean(1)
dL=tL.query(cen)[0]; dR=tR.query(cen)[0]
for s,nm,sf,m in [('L','Left','left',dL<dR),('R','Right','right',dR<=dL)]:
    v,f=compact(vw,fw[m])
    add(sf+'_ventricle',f'{nm} ventricle (wall)',C,s,v,f,1800,'FMA7101' if s=='L' else 'FMA7098',extra=dict(parent='heart'))
valves=Dsel(r'(cusp of (aortic|pulmonary) valve|(leaflet) of (mitral|tricuspid) valve)')
addD('heart_valves','Heart valves (aortic, pulmonary, mitral, tricuspid)',C,None,valves,2500,None,extra=dict(parent='heart',detail=True))
addD('papillary_muscles','Papillary muscles',C,None,Dsel(r'papillary muscle'),1500,None,extra=dict(parent='heart',detail=True))
for id_,nm,fid in [('lv_cavity','Left ventricle cavity (blood pool)','FJ2422'),('rv_cavity','Right ventricle cavity (blood pool)','FJ2423')]:
    addD(id_,nm,C,None,[fid],700,'auto',extra=dict(parent='heart',detail=True))
# vessels
addD('aorta','Aorta',C,None,['FJ3413','FJ3411','FJ1931','FJ1932','FJ3427'],1800,'FMA3734',color='#c0392b')
addD('pulmonary_trunk','Pulmonary trunk',C,None,['FJ2966'],700,'FMA8612',color='#5b7fb5')
addD('superior_vena_cava','Superior vena cava',C,None,Dsel(r'^superior vena cava$'),500,'FMA4720',color='#2e5fa3')
addD('inferior_vena_cava','Inferior vena cava',C,None,Dsel(r'^inferior vena cava$'),600,'FMA10951',color='#2e5fa3')
addO('coronary_arteries','Coronary arteries',C,None,['coronary_arteries'],1800,color='#c0392b')
addO('pulmonary_vessels','Pulmonary vessels',C,None,['pulmonary_vessels'],1500)
for s,nm,sf in SIDES:
    addO('carotid'+sf,f'Common carotid artery ({nm})',C,s,['carotid'+sf],400,color='#c0392b')
    addO('arteries_arm'+sf,f'Arm arteries ({nm})',C,s,['arteries_arm'+sf],2000,color='#c0392b')
    addO('arteries_leg'+sf,f'Leg arteries incl. femoral ({nm})',C,s,['arteries_leg'+sf],2800,color='#c0392b')
    addO('veins_leg'+sf,f'Leg veins incl. femoral ({nm})',C,s,['veins_leg'+sf],3000,color='#2e5fa3')
addO('arteries_head','Arteries of head and neck',C,None,['arteries_head'],3000,color='#c0392b')
addO('arteries_thorax','Arteries of thorax (subclavian, brachiocephalic...)',C,None,['arteries_thorax'],3000,color='#c0392b')
addO('arteries_abdomen','Arteries of abdomen and pelvis',C,None,['arteries_abdomen','arteries_pelvis'],4000,color='#c0392b')
addO('veins_thorax','Veins of thorax',C,None,['veins_thorax'],3000,color='#2e5fa3')
addO('veins_abdomen','Veins of abdomen and pelvis (incl. portal system)',C,None,['veins_abdomen','veins_pelvis'],4500,color='#2e5fa3')

# ---------- respiratory ----------
R='respiratory'
addO('lung_l','Left lung',R,'L',['lung_l'],5000,'FMA7310')
addO('lung_r','Right lung',R,'R',['lung_r'],6000,'FMA7309')
addD('trachea','Trachea',R,None,['FJ2562'] if 'FJ2562' in DG and dname('FJ2562')=='Trachea' else Dsel(r'^trachea$'),900,'FMA7394')
addD('bronchi','Bronchial tree',R,None,Dsel(r'bronch'),3500)
addD('larynx','Larynx (thyroid, cricoid, epiglottis, arytenoid cartilages)',R,None,Dsel(r'^(thyroid cartilage|cricoid cartilage|epiglottis|(left|right) (arytenoid|corniculate|cuneiform) cartilage)$'),2500)

# ---------- digestive ----------
G='digestive'
addD('esophagus','Esophagus',G,None,Dsel(r'^esophagus$'),700,'FMA7131')
addD('stomach','Stomach',G,None,Dsel(r'^stomach$'),1800,'FMA7148')
addO('liver','Liver',G,None,['liver'],4500,'FMA7197')
addD('gallbladder','Gallbladder',G,None,Dsel(r'^gallbladder$'),500,'FMA7202')
addD('pancreas','Pancreas',G,None,['FJ1895'],1500,'FMA7198')
addD('small_intestine','Small intestine (duodenum, jejunum, ileum)',G,None,Dsel(r'^(duodenum|(proximal|middle|distal) part of (jejunum|ileum))$'),6000,'FMA7200')
addD('colon','Colon (ascending, transverse, descending)',G,None,Dsel(r'^(ascending colon|transverse colon|descending colon|ileocecal junction)$'),3500,'FMA7201')
addD('rectum','Rectum',G,None,Dsel(r'^rectum$'),600,'FMA14544')
addD('appendix','Appendix',G,None,Dsel(r'^appendix$'),300,'FMA14542')
addD('tongue','Tongue',G,None,Dsel(r'^tongue$'),1200,'FMA54640')

# ---------- urinary / endocrine / lymphatic / sensory ----------
U='urinary'
for s,nm,sf in SIDES:
    addD('kidney'+sf,f'Kidney ({nm})',U,s,Dsel(r'^%s kidney$'%nm.lower()),1500,'FMA7205' if s=='L' else 'FMA7204')
    addD('ureter'+sf,f'Ureter ({nm})',U,s,Dsel(r'^%s ureter$'%nm.lower()),400)
    addD('adrenal'+sf,f'Adrenal gland ({nm})',U if False else 'endocrine',s,Dsel(r'^%s adrenal gland$'%nm.lower()),500)
    addD('eyeball'+sf,f'Eyeball ({nm})','sensory',s,Dsel(r'^%s (sclera|cornea|iris|lens|vitreous body)$'%nm.lower()),1500)
addD('bladder','Urinary bladder',U,None,Dsel(r'^urinary bladder$'),800,'FMA15900')
addD('pituitary','Pituitary gland','endocrine',None,Dsel(r'^pituitary gland$'),400,'FMA13889')
addD('spleen','Spleen','lymphatic',None,Dsel(r'^spleen$'),1000,'FMA7196')
addD('thymus','Thymus','lymphatic',None,Dsel(r'lobe of thymus'),700,'FMA9607')

# ---------- transform ----------
sk=[p for p in PARTS if p['id']=='skin'][0]['v']
H=sk[:,1].max()-sk[:,1].min(); s=1.75/H
cxz=np.array([(sk[:,0].min()+sk[:,0].max())/2,0,(sk[:,2].min()+sk[:,2].max())/2])
y0=sk[:,1].min()
print('source height',H,'scale',s)
for p in PARTS:
    v=p['v']-np.array([cxz[0],y0,cxz[2]]); p['v']=v*s
import pickle
pickle.dump(PARTS,open('work/anatomy/parts_built.pkl','wb'))
print(len(PARTS),'parts', sum(len(p['f']) for p in PARTS),'tris')
for p in PARTS: print(p['id'],len(p['f']),end='; ')
