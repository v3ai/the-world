import json,numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
D='data/anatomy/'
idx=json.load(open(D+'index.json'))
def tri_pts(p):
    q=np.array(p['pos'],np.int16).reshape(-1,3).astype(float)*np.array(p['scale'])+np.array(p['offset'])
    f=np.array(p['idx'],np.uint32).reshape(-1,3)
    # sample points on triangles (centroids + vertices) for denser look
    return np.vstack([q,q[f].mean(1)])
data={}
for s in idx['systems']:
    j=json.load(open(D+s['file'])); data[s['id']]=[(p,tri_pts(p)) for p in j['parts']]
def render(name,items,color_override=None):
    fig,ax=plt.subplots(1,2,figsize=(9,8))
    for p,pts in items:
        c=color_override or p['color']
        ax[0].scatter(pts[:,0],pts[:,1],s=0.25,c=c,linewidths=0)
        ax[1].scatter(pts[:,2],pts[:,1],s=0.25,c=c,linewidths=0)
    ax[0].set_title('front view (+X = body left, at image right) '+name,fontsize=8); ax[1].set_title('side view (+Z = front, at image right)',fontsize=8)
    for a in ax: a.set_aspect('equal'); a.set_ylim(-0.02,1.8); a.set_facecolor('#222')
    ax[0].set_xlim(-0.45,0.45); ax[1].set_xlim(-0.2,0.2)
    plt.tight_layout(); plt.savefig(f'work/anatomy/preview_{name}.png',dpi=70); plt.close()
for s,items in data.items(): render(s,items)
allit=[it for s in data for it in data[s] if s!='integumentary']
render('all_no_skin',allit)
