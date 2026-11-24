"""Her fingernails, laid on her skin by the rule used for the man (tools/anatomy/skin_hd.py, nails and nail_plate): her atlas's skin has
the fingertips' shape but no nails. Writes data/anatomy_f/nails.json (read by js/body_core.js in the realistic look).

Differences from the man's rule, because her model has no hand bones: a fingertip is a point of the skin further from the wrist (the
middle of the skin 0.90 m above her soles) than all her skin within 14 mm of it, more than 10 cm from the wrist, and at least 13 mm from
another tip (the five furthest such points of each hand); the thumb is the one of the five that ends highest; the other four run from the
outermost (the index) inward. Her arms hang with the palms forward, as the man's: the back of a finger faces backwards, the thumb's half
turned out to its side. The widths, lengths and plate are the man's rule: the plate four fifths as wide as the fingertip 7 mm from its
end, its length from the published ratios of width to length (NAIL_WL in skin_hd.py, measured on men; women's nails are a little longer
for their width, and their ratios were not at hand), the thumb's no wider than 1.35 times the index's.
Run after build_f.py:  python -I tools/anatomy/female/nails_f.py"""
import json, os, sys
import numpy as np
from scipy.spatial import cKDTree
from scipy.sparse.csgraph import connected_components
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, os.path.join(HERE, '..'))
import skin_hd as H   # (its main() runs only as a script)

p = [q for q in json.load(open(os.path.join(ROOT, 'data', 'anatomy_f', 'integumentary.json')))['parts'] if q['id'] == 'skin'][0]
SV = np.array(p['pos'], float).reshape(-1, 3) * np.array(p['scale']) + np.array(p['offset']); SF = np.array(p['idx']).reshape(-1, 3)
plates = []
for sd in 'lr':
    sgn = 1 if sd == 'l' else -1
    idx = np.where((SV[:, 0] * sgn > .30) & (SV[:, 1] < .95))[0]; P = SV[idx]
    root = P[np.abs(P[:, 1] - .90) < .004].mean(0); dist = np.linalg.norm(P - root, axis=1); tr = cKDTree(P)
    cand = [i for i in np.argsort(-dist) if dist[i] >= dist[tr.query_ball_point(P[i], .014)].max() - 1e-12]
    pick = []
    for i in cand:
        if dist[i] > .1 and all(np.linalg.norm(P[i] - P[j]) > .013 for j in pick): pick.append(i)
        if len(pick) == 5: break
    assert len(pick) == 5, 'found %d fingertips on the %s hand' % (len(pick), sd)
    thumb = max(pick, key=lambda i: P[i][1]); rest = sorted([i for i in pick if i != thumb], key=lambda i: -abs(P[i][0]))
    Asub = H.adjacency(SF, len(SV))[idx][:, idx]
    palm = np.array([0, 0, 1.]); tdir = np.array([sgn * 1., 0, 0])
    geo = []
    for rank, ti in enumerate([thumb] + rest):
        T = P[ti]; ax = (T - root) / np.linalg.norm(T - root)
        bi = np.where((np.linalg.norm(P - T, axis=1) < .025) & ((P - T) @ ax > -.02))[0]   # this finger only: the part of the ball joined to the tip
        _, lab = connected_components(Asub[bi][:, bi], directed=False); near = np.zeros(len(P), bool)
        near[bi[lab == lab[np.searchsorted(bi, ti)]]] = True
        for _ in range(2):   # the axis along the finger's own skin: the middles of two slices, 5 and 15 mm back from the tip
            q = (P - T) @ ax; c5, c15 = near & (np.abs(q + .005) < .002), near & (np.abs(q + .015) < .002)
            if c5.sum() > 3 and c15.sum() > 3: ax = P[c5].mean(0) - P[c15].mean(0); ax /= np.linalg.norm(ax)
        dv = -palm if rank else tdir - .5 * palm
        dv = dv - ax * (dv @ ax); dv /= np.linalg.norm(dv); lat = np.cross(ax, dv)
        Q = P - T; s_, up, la = Q @ ax, Q @ dv, Q @ lat
        ctr = near & (np.abs(s_ + .007) < .002)
        c0 = .5 * (la[ctr].min() + la[ctr].max()); wid = min(np.ptp(la[ctr]), 1.3 * np.ptp(up[ctr]))
        geo.append([rank, near, ax, dv, lat, s_, up, la, c0, wid, T])
    if geo[0][9] > 1.35 * geo[1][9]: geo[0][9] = 1.35 * geo[1][9]; geo[0][8] = 0.0
    loc = -np.ones(len(SV), np.int64); loc[idx] = np.arange(len(idx))
    for rank, near, ax, dv, lat, s_, up, la, c0, wid, T in geo:
        nw = .8 * wid; L = nw / H.NAIL_WL[min(rank, 4)]; sh = -.0025
        ft = SF[(loc[SF] >= 0).all(1)]; ft = loc[ft]; ft = ft[near[ft].all(1)]
        v, f, n, mk = H.nail_plate(np.stack([s_[ft], la[ft], up[ft]], -1), c0, nw, sh - L, sh)
        if np.isnan(v[:, 2]).any():   # a row across the nail with no skin under it (her coarse little finger): the height of the nearest row that has
            G = v[:, 2].reshape(-1, 7); ok = np.where(~np.isnan(G).any(1))[0]
            for r in np.where(np.isnan(G).any(1))[0]: G[r] = G[ok[np.argmin(np.abs(ok - r))]]
            v[:, 2] = G.ravel(); n = H.vnormals(v, f); print('nail %s %d: %d rows had no skin under them, given the nearest row\'s height' % (sd, rank, len(G) - len(ok)))
        v[:, 2] += .0007   # her finger skin is coarser than his detailed skin: its facets cut through a plate laid 0.35 mm over it, so it lies 0.7 mm higher
        X = T + np.outer(v[:, 0], ax) + np.outer(v[:, 1], lat) + np.outer(v[:, 2], dv); Nw = np.outer(n[:, 0], ax) + np.outer(n[:, 1], lat) + np.outer(n[:, 2], dv)
        if (np.cross(X[f[:, 1]] - X[f[:, 0]], X[f[:, 2]] - X[f[:, 0]]) @ dv).sum() < 0: f = f[:, ::-1]
        assert np.isfinite(X).all() and np.isfinite(Nw).all()
        plates.append((X, f, Nw, mk)); print('nail %s %d at %s: %.1f x %.1f mm' % (sd, rank, np.round(T, 3).tolist(), nw * 1e3, L * 1e3))
V = np.concatenate([q[0] for q in plates]); N = np.concatenate([q[2] for q in plates]); M = np.concatenate([q[3] for q in plates])
F = []; o = 0
for q in plates: F.append(q[1] + o); o += len(q[0])
F = np.concatenate(F); N /= np.linalg.norm(N, axis=1, keepdims=True)
out = {'about': 'her fingernails, laid on her skin by rule (tools/anatomy/female/nails_f.py); position in metres in her frame, a mask per vertex: across, along from the fold, free edge, 0',
       'pos': np.round(V.ravel(), 5).tolist(), 'normal': np.round(N.ravel(), 3).tolist(), 'mask': np.round(M.ravel(), 3).tolist(), 'idx': F.ravel().astype(int).tolist()}
path = os.path.join(ROOT, 'data', 'anatomy_f', 'nails.json'); json.dump(out, open(path, 'w'), separators=(',', ':'))
print('wrote %s: %d vertices, %d triangles, %d bytes' % (os.path.relpath(path, ROOT), len(V), len(F), os.path.getsize(path)))
