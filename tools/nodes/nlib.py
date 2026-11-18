import json, os
ROOT='.'
BOOKS=json.load(open(ROOT+'/data/library/books.json'))
SEC={}
for b in BOOKS:
    for n,t,secs in b['ch']:
        for s in secs:
            if s[0]: SEC[(b['c'],s[0])]=s[2]
def N(id,title,kind,tmpl,scale,summary,basics,deeper,expert,facts,dyk,par=(),made=(),proc=(),rel=(),mesh=None,hs=None,refs=(),kn=(),cert="C1",oq=None,mol=None,steps=None,parts=()):
    d={"id":id,"title":title,"kind":kind,"template":tmpl,"scale_m":scale,"parents":list(par),"parts":list(parts),
       "made_of":list(made),"processes":list(proc),"related":list(rel),"mesh":mesh}
    if hs: d["hotspot"]={"of":hs[0],"at":list(hs[1]),"label":hs[2]}
    d.update({"summary":summary,"layers":{"basics":basics,"deeper":deeper,"expert":expert},"facts":[list(f) for f in facts],
       "did_you_know":dyk,"certainty":cert})
    if oq: d["open_questions"]=oq
    d["refs"]=[[b,s,SEC[(b,s)]] for b,s in refs]
    if kn: d["kn"]=list(kn)
    if mol: d["molecules"]=list(mol)
    if steps: d["steps"]=[{"title":a,"text":b,"focus":list(c)} for a,b,c in steps]
    return d
def save(name,nodes):
    json.dump(nodes,open(f'{ROOT}/data/nodes/{name}.json','w'),indent=1,ensure_ascii=False)
    print(name,len(nodes))
