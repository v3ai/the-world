import json,glob,os,collections
ROOT='.'
files=sorted(glob.glob(ROOT+'/data/nodes/body_*.json'))
nodes=[];src={}
for f in files:
    for n in json.load(open(f)): nodes.append(n);src[n['id']]=f
by={n['id']:n for n in nodes}
ids=[n['id'] for n in nodes]
dup=[i for i,c in collections.Counter(ids).items() if c>1]
assert not dup,dup
def add(lst,x):
    if x not in lst: lst.append(x)
# overrides
by['fovea']['made_of']=['nervous_tissue']; by['lens']['made_of']=['epithelial_tissue']
for k,v in {'melanocyte':'epidermis','osteoclast':'bone_tissue','beta_cell':'pancreatic_islets','stem_cell':'bone_marrow','rod_cell':'retina','cone_cell':'retina'}.items():
    add(by[v]['made_of'],k)
for t,c in (('testes','sperm'),('ovaries','egg_cell')): add(by[t]['made_of'],c)
add(by['hypodermis']['made_of'],'adipose_tissue')
# extra parent links
for c,p in [('bone_marrow','lymphatic_immune_system'),('artery','blood_vessels'),('vein','blood_vessels'),('capillary','blood_vessels'),('lymph_nodes','lymphatic_immune_system')]:
    add(by[c]['parents'],p)
# system membership from intent list
mem=json.load(open('/tmp/sysmembers.json'))
repl={'ovaries_uterus':['ovaries','uterus']}
for s,ms in mem.items():
    for m in ms:
        for mm in repl.get(m,[m]):
            if mm in by: add(by[mm]['parents'],s)
            else: print('  intended member missing',s,mm)
# reciprocal parts from parents
for n in nodes:
    for p in n['parents']:
        if p not in by: print('missing parent',n['id'],p); continue
        add(by[p]['parts'],n['id'])
# human_body gets systems (already via parents). process parents
# related: processes <-> focus organs
for n in nodes:
    if n['template']=='process':
        for st in n['steps']:
            for f in st['focus']:
                if f in by and by[f]['kind'] in('organ','system','structure'):
                    add(by[f]['processes'],n['id'])
# validate
err=[]
refkeys=['parents','parts','made_of','processes','related']
for n in nodes:
    for k in refkeys:
        for x in n[k]:
            if x not in by: err.append((n['id'],k,x))
    if n.get('hotspot') and n['hotspot']['of'] not in by: err.append((n['id'],'hotspot',n['hotspot']['of']))
    for st in n.get('steps',[]):
        for x in st['focus']:
            if x not in by: err.append((n['id'],'focus',x))
    if n['template']=='process': assert 4<=len(n['steps'])<=8,n['id']
mols=set(json.load(open(ROOT+'/data/molecules_all.json'))['mols'])|{os.path.basename(p)[:-5] for p in glob.glob(ROOT+'/data/proteins/*.json')}
for n in nodes:
    for m in n.get('molecules',[]):
        if m not in mols: err.append((n['id'],'molecule',m))
books=json.load(open(ROOT+'/data/library/books.json'))
valid={(b['c'],s[0],s[2]) for b in books for ch in b['ch'] for s in ch[2] if s[0]}
for n in nodes:
    if not n['refs']: err.append((n['id'],'norefs'))
    for r in n['refs']:
        if tuple(r) not in valid: err.append((n['id'],'ref',r))
    for kk in ('summary','did_you_know'):
        if not n[kk]: err.append((n['id'],'empty',kk))
kn=set(x['id'] for x in json.load(open(ROOT+'/data/knowledge/nodes.json')))
for n in nodes:
    for x in n.get('kn',[]):
        if x not in kn: err.append((n['id'],'kn',x))
# reachability
seen={'human_body'};st=['human_body']
while st:
    c=st.pop()
    for k in('parts','made_of','processes'):
        for x in by[c][k]:
            if x in by and x not in seen: seen.add(x);st.append(x)
unreach=[i for i in ids if i not in seen]
# write back
out=collections.defaultdict(list)
for n in nodes: out[src[n['id']]].append(n)
for f,l in out.items(): json.dump(l,open(f,'w'),indent=1,ensure_ascii=False)
cnt=collections.Counter(n['kind'] for n in nodes)
mesh=[n['mesh'] for n in nodes if n['mesh']]
print('total',len(nodes),dict(cnt)); print('errors',len(err),err[:40]); print('unreachable',unreach)
print('meshes',len(mesh),'hotspots',sum(1 for n in nodes if n.get('hotspot')),'processes',cnt['process'])
cert=collections.Counter(n['certainty'] for n in nodes);print(cert)
json.dump({'count':len(nodes),'kinds':dict(cnt),'unreach':unreach,'errors':[list(map(str,e)) for e in err],'cert':dict(cert),'meshes':len(mesh),'hot':sum(1 for n in nodes if n.get('hotspot'))},open('/tmp/val.json','w'))
