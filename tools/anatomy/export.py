import pickle,json,numpy as np,os,collections
PARTS=pickle.load(open('work/anatomy/parts_built.pkl','rb'))
OUT='data/anatomy/'
for f in os.listdir(OUT): os.remove(OUT+f)
SYS=[('integumentary','Integumentary (skin)','#e6cdb9'),('skeletal','Skeletal','#efe6cf'),('muscular','Muscular','#b24a4a'),
('nervous','Nervous','#f0cf45'),('cardiovascular','Cardiovascular','#c0392b'),('respiratory','Respiratory','#eaa3b2'),
('digestive','Digestive','#d9a066'),('urinary','Urinary','#8e2f45'),('endocrine','Endocrine','#8e5bb5'),
('lymphatic','Lymphatic / immune','#5fa86b'),('sensory','Sensory (eyes)','#4f93c9')]
COL={'liver':'#7a3b2e','kidney_l':'#8b2e3a','kidney_r':'#8b2e3a','lung_l':'#eaa3b2','lung_r':'#eaa3b2','heart':'#b5303a','left_atrium':'#b5303a','right_atrium':'#b5303a','left_ventricle':'#a02a34','right_ventricle':'#a02a34','heart_valves':'#e8d27a','papillary_muscles':'#c05a5a','lv_cavity':'#8a1c24','rv_cavity':'#5b6fb0','stomach':'#e0a070','gallbladder':'#6b8e23','spleen':'#7a2e5a','tongue':'#d9707a','bladder':'#e0b070','cerebrum_l':'#e8b5b0','cerebrum_r':'#e8b5b0','cerebellum':'#d9a09a','brainstem':'#e0c070','trachea':'#9fb7d6','bronchi':'#9fb7d6','larynx':'#9fb7d6','thymus':'#5fa86b','pituitary':'#8e5bb5','teeth':'#fbf8ee','eyeball_l':'#f4f4f4','eyeball_r':'#f4f4f4','intervertebral_discs':'#9fc4c8','pulmonary_trunk':'#5b7fb5'}
sc={k:c for k,_,c in SYS}
def r(x,n): return round(float(x),n)
index=[];files=collections.OrderedDict()
tot=0
for sysid,sname,scol in SYS:
    parts=[]
    for p in PARTS:
        if p['system']!=sysid: continue
        v=p['v']; f=p['f']
        mn,mx=v.min(0),v.max(0); off=(mn+mx)/2
        half=np.maximum((mx-mn)/2,1e-6); scale=half/32767
        q=np.round((v-off)/scale).astype(np.int64); assert abs(q).max()<=32767
        center=((mn+mx)/2); rad=float(np.linalg.norm(v-center,axis=1).max())
        col=p.get('color') or COL.get(p['id']) or scol
        d={'id':p['id'],'name':p['name'],'fma':p['fma'],'system':sysid,'side':p['side'],'color':col}
        for k in ('parent','whole','detail'):
            if p.get(k): d[k]=p[k]
        d.update({'center':[r(c,4) for c in center],'radius':r(rad,4),'tris':int(len(f)),
          'pos':q.reshape(-1).tolist(),'scale':[float('%.6g'%s) for s in scale],'offset':[r(o,5) for o in off],'idx':f.reshape(-1).astype(np.int64).tolist()})
        parts.append(d)
        e={k:d[k] for k in ('id','name','system','side','fma','color','center','radius','tris')}
        for k in ('parent','whole','detail'):
            if k in d: e[k]=d[k]
        e['file']=sysid+'.json'; index.append(e)
    s=json.dumps({'system':sysid,'parts':parts},separators=(',',':'))
    open(OUT+sysid+'.json','w').write(s); tot+=len(s)
    print(sysid,len(parts),len(s)/1e6,'MB')
idx={'format':'anatomy-v1','units':'m','up':'+Y','front':'+Z','left':'+X','height_m':1.75,
 'decode':'p = pos_int*scale + offset (per part, per axis); pos is flat int16 xyz; idx is flat uint32 triangles; compute normals in browser',
 'systems':[{'id':a,'name':b,'color':c,'count':sum(1 for e in index if e['system']==a),'file':a+'.json'} for a,b,c in SYS],
 'parts':index}
open(OUT+'index.json','w').write(json.dumps(idx,separators=(',',':')))
print('total MB',(tot+os.path.getsize(OUT+'index.json'))/1e6, len(index))
