import json,gzip,sys,numpy as np
M='work/dl_anatomy/dagno/x/package/model/'
def load():
    a=json.load(open(M+'atlas.json'))
    ch={}
    out={}
    for p in a['parts']:
        c=p['chunk']
        if c not in ch: ch[c]=gzip.open(M+a['chunks'][c]['gzip']).read()
        b=ch[c]
        v=np.frombuffer(b,np.float32,p['vertexCount']*3,p['positions']).reshape(-1,3)
        i=np.frombuffer(b,np.uint32,p['indexCount'],p['indices']).reshape(-1,3)
        out[p['id']]=(p,v.copy(),i.copy())
    return a,out
if __name__=='__main__':
    a,o=load()
    with open('work/anatomy/parts.tsv','w') as f:
        for k,(p,v,i) in o.items():
            c=(v.min(0)+v.max(0))/2
            f.write('\t'.join([k,p['name'],p['conceptId'],p['system'],str(len(i))]+['%.3f'%x for x in c])+'\n')
