import json,numpy as np
D='work/dl_anatomy/oa_dump/'
def load_oa():
    man=json.load(open(D+'manifest.json')); out={}
    for m in man:
        v=np.fromfile(D+m['name']+'.pos.f32',np.float32).reshape(-1,3)
        i=np.fromfile(D+m['name']+'.idx.u32',np.uint32).reshape(-1,3)
        out[m['name']]=(m['group'],v,i)
    return out
