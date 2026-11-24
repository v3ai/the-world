#!/usr/bin/env python3
"""Pictures of data/anatomy_f to look at before any app work: each system alone, front and side, and all of it without the skin.
usage: python tools/anatomy/female/preview_f.py [data/anatomy_f] [OUTDIR]   (needs matplotlib)"""
import sys, os, json, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
D = sys.argv[1] if len(sys.argv) > 1 else 'data/anatomy_f'; OUT = sys.argv[2] if len(sys.argv) > 2 else 'work/anatomy_f'
os.makedirs(OUT, exist_ok=True); idx = json.load(open(os.path.join(D, 'index.json')))
def pts(p):
    q = np.array(p['pos'], np.int16).reshape(-1, 3).astype(float) * np.array(p['scale']) + np.array(p['offset'])
    f = np.array(p['idx']).reshape(-1, 3); return np.vstack([q, q[f].mean(1)])
data = {s['id']: [(p, pts(p)) for p in json.load(open(os.path.join(D, s['file'])))['parts'] if not p.get('parent')] for s in idx['systems']}
H = idx['height_m']
def render(name, items):
    fig, ax = plt.subplots(1, 2, figsize=(9, 8))
    for p, P in items:
        ax[0].scatter(P[:, 0], P[:, 1], s=.25, c=p['color'], linewidths=0); ax[1].scatter(P[:, 2], P[:, 1], s=.25, c=p['color'], linewidths=0)
    ax[0].set_title('front (+x her left, at image right) ' + name, fontsize=8); ax[1].set_title('side (+z front, at image right)', fontsize=8)
    for a in ax: a.set_aspect('equal'); a.set_ylim(-.02, H + .03); a.set_facecolor('#222')
    ax[0].set_xlim(-.5, .5); ax[1].set_xlim(-.2, .2); plt.tight_layout(); plt.savefig(os.path.join(OUT, 'preview_%s.png' % name), dpi=70); plt.close()
for s, it in data.items(): render(s, it)
render('all_no_skin', [it for s in data for it in data[s] if s != 'integumentary'])
