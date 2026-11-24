#!/usr/bin/env python3
"""The person's detailed skin and eyes for the realistic look (?look=2): data/anatomy/skin_hd.bin.

What it is. data/anatomy/integumentary.json holds the skin of BodyParts3D 4.0 cut down to 20,000 triangles (about 1.6 cm apart):
no ears, eye openings with no lids, fused-looking fingers. The atlas itself holds much more, and this script takes it:
  - the skin of BodyParts3D 4.0 at its published resolution (FJ2810, 203,382 triangles), for the body, the hands and the feet;
  - the skin of BodyParts3D 3.0 at its finer published resolution (FMA7163, obj_95, 1,586,498 triangles), for the head and neck:
    it has the eyelids, the nostrils and the edges of the lips that 4.0's coarser file lost;
  - the external ears of 4.0 (FJ2811), which 4.0 keeps as a separate part and the app's skin left out;
  - the lips of 4.0 (FJ2814), used only to mark which skin is the red of the lips;
  - the eyes of 4.0 as their own parts: sclera, cornea, iris and lens of each side.
Both releases are the same man's MRI-based model (BodyParts3D is built on the TARO voxel model, 2 mm MRI of a male volunteer; the
atlas's authors then edited it). 4.0 revised some of the surface, and the app's bones, muscles and eyes are 4.0's; so the 3.0 head is
fitted to the 4.0 head by a smooth displacement (scale about 3 cm, at most a centimetre under the jaw): the shape of the face below
that scale (lids, nostrils, lip edges) is 3.0's, its place on the skull is 4.0's.

Steps (all in the app's body metres: +x the body's left, +y up, +z its front, feet at y = 0):
  1. the transform from the atlas's millimetres to the app's metres, fitted against data/anatomy/integumentary.json;
  2. the outer face of each skin shell (the atlas's skin is a closed shell with an inside face): kept where rays leave it;
  3. the 3.0 head fitted to the 4.0 surface (a screened Laplacian, FIT_LAMBDA); the eyes scaled to the average adult size; the lids
     made again round 4.0's eyes and opened to average measurements (fit_lids), with a short strip turned in from each lid edge (the
     lid's margin) so the opening has thickness;
  4. head and body joined along a curve round the neck (y = 1.462 + 9 x^2), sharing one line of vertices; the 4.0 ears added; the
     small openings the atlas's surface has (under 15 mm round: slits where its pieces do not quite meet) closed (fill_holes);
  5. reduced region by region (borders kept, so the regions stay joined): about 50,000 triangles in all;
  6. normals taken from the full-resolution surface (averaged over the reduced mesh's own spacing), so it shades like the fine one;
  7. what each vertex is: the red of the lips, the lids' margins, the brows, the hair of the head;
  8. occlusion baked per vertex (rays, as bake_ao.mjs), and the skin's thickness under each vertex (rays inward: how far light
     can go through it, at the ears, the webs of the fingers and the fingertips); the eyes (sclera, iris, lens; the cornea apart)
     reduced and baked;
  9. the fingernails as plates of their own, laid on the back of each fingertip by rule from published proportions (nails);
  10. written as one binary file (write_bin has the layout); js/body_core.js (BLK.hd) reads it.

usage: python tools/anatomy/skin_hd.py SRC WORK [--out data/anatomy/skin_hd.bin] [--preview]
  SRC holds the atlas files: FJ2810.obj FJ2811.obj FJ2813.obj FJ2814.obj FJ1289.obj FJ1340.obj FJ1297.obj FJ1348.obj FJ1305.obj FJ1356.obj
  FJ1317.obj FJ1368.obj (from https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip) and
  FMA7163_95.obj, FMA12513_95.obj and FMA71098_95.obj (BodyParts3D_3.0_obj_95/FMA*.obj from https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_95.zip).
  WORK is a scratch folder for the stages (kept between runs). Needs numpy, scipy, pyfqmr; node for the ray queries.
"""
import sys, os, json, struct, subprocess, argparse, time
import numpy as np
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
NODE = os.environ.get('NODE', 'node')


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def load_obj(p):
    V, F = [], []
    with open(p) as fh:
        for l in fh:
            if l.startswith('v '):
                V.append(l.split()[1:4])
            elif l.startswith('f '):
                F.append([x.split('/')[0] for x in l.split()[1:4]])
    return np.array(V, float), np.array(F, np.int64) - 1


def weld(V, F, tol=1e-7):
    key = np.round(V / tol).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    F = inv.reshape(-1)[F]
    ok = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])
    return compact(V[first], F[ok])


def compact(V, F):
    used = np.unique(F)
    m = -np.ones(len(V), np.int64); m[used] = np.arange(len(used))
    return V[used], m[F]


def fnormals(V, F):
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    return n  # length = twice the area


def vnormals(V, F):
    fn = fnormals(V, F); n = np.zeros_like(V)
    for k in range(3):
        np.add.at(n, F[:, k], fn)
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-20)


def edges_of(F):
    return np.r_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]


def boundary_edges(F):
    e = np.sort(edges_of(F), axis=1)
    u, c = np.unique(e, axis=0, return_counts=True)
    return u[c == 1]


def adjacency(F, n):
    e = edges_of(F)
    g = coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    return ((g + g.T) > 0).astype(np.float64)


def rays(mode, V, F, P, N, n_rays, maxd, work, tag):
    """the node ray tool: per query point, the share of open directions"""
    fin, fout = os.path.join(work, tag + '_in.bin'), os.path.join(work, tag + '_out.bin')
    with open(fin, 'wb') as fh:
        fh.write(struct.pack('<5If', mode, len(V), len(F), len(P), n_rays, maxd))
        fh.write(V.astype('<f4').tobytes()); fh.write(F.astype('<u4').tobytes())
        fh.write(P.astype('<f4').tobytes()); fh.write(N.astype('<f4').tobytes())
    subprocess.run([NODE, '--max-old-space-size=8000', os.path.join(HERE, 'skin_hd_rays.mjs'), fin, fout], check=True)
    return np.fromfile(fout, '<f4')


# ---------------------------------------------------------------- 1. the transform
def fit_transform(V4):
    """atlas mm (x the body's left, y back, z up) -> app metres: s * (x, z, -y) + t, fitted to the app's own skin"""
    j = json.load(open(os.path.join(ROOT, 'data/anatomy/integumentary.json')))
    p = [q for q in j['parts'] if q['id'] == 'skin'][0]
    A = np.array(p['pos'], float).reshape(-1, 3) * np.array(p['scale']) + np.array(p['offset'])
    B = np.c_[V4[:, 0], V4[:, 2], -V4[:, 1]]
    s = (A[:, 1].max() - A[:, 1].min()) / (B[:, 1].max() - B[:, 1].min()); t = A.mean(0) - s * B.mean(0)
    for _ in range(30):
        d, i = cKDTree(s * B + t).query(A); X = B[i]
        Xm, Am = X.mean(0), A.mean(0); s = ((X - Xm) * (A - Am)).sum() / ((X - Xm) ** 2).sum(); t = Am - s * Xm
    log('transform: scale %.7f, offset %s; app skin to atlas skin: median %.2f mm' % (s, np.round(t, 5).tolist(), np.median(d) * 1e3))
    return s, t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('work')
    ap.add_argument('--out', default=os.path.join(ROOT, 'data/anatomy/skin_hd.bin'))
    ap.add_argument('--stage', default='all')
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    W = lambda n: os.path.join(a.work, n)
    S = lambda n: os.path.join(a.src, n)

    # ---- 1. load and transform
    if not os.path.exists(W('s1.npz')):
        V4, F4 = load_obj(S('FJ2810.obj'))
        s, t = fit_transform(V4)
        X = lambda V: s * np.c_[V[:, 0], V[:, 2], -V[:, 1]] + t
        V4, F4 = weld(X(V4), F4)
        VE, FE = load_obj(S('FJ2811.obj')); VE, FE = weld(X(VE), FE)
        VL, FL = load_obj(S('FJ2814.obj')); VL, FL = weld(X(VL), FL)
        V3, F3 = load_obj(S('FMA7163_95.obj')); V3, F3 = weld(X(V3), F3)
        eyes = {}
        for side, ids in (('l', ('FJ1317', 'FJ1289', 'FJ1297', 'FJ1305')), ('r', ('FJ1368', 'FJ1340', 'FJ1348', 'FJ1356'))):
            for part, fid in zip(('sclera', 'cornea', 'iris', 'lens'), ids):
                v, f = load_obj(S(fid + '.obj')); v, f = weld(X(v), f); eyes[part + '_' + side + '_v'] = v; eyes[part + '_' + side + '_f'] = f
        np.savez(W('s1.npz'), s=s, t=t, V4=V4, F4=F4, VE=VE, FE=FE, VL=VL, FL=FL, V3=V3, F3=F3, **eyes)
        log('stage 1: 4.0 skin %d tris, 3.0 skin %d tris, ears %d, lips %d' % (len(F4), len(F3), len(FE), len(FL)))
    D = dict(np.load(W('s1.npz')))
    s_, t_ = float(D['s']), D['t']
    V4, F4, V3, F3, VE, FE = D['V4'], D['F4'], D['V3'], D['F3'], D['VE'], D['FE']

    # ---- 2. outer faces
    if not os.path.exists(W('s2.npz')):
        # 4.0 body: every triangle; 3.0: the head and neck only (that is all that is kept of it)
        c4 = V4[F4].mean(1); n4 = fnormals(V4, F4); n4 /= np.maximum(np.linalg.norm(n4, axis=1, keepdims=True), 1e-20)
        o4 = rays(0, V4, F4, c4, n4, 64, 10.0, a.work, 'outer4')
        sel3 = np.where(V3[F3][:, :, 1].min(1) > 1.36)[0]
        c3 = V3[F3[sel3]].mean(1); n3 = fnormals(V3, F3[sel3]); n3 /= np.maximum(np.linalg.norm(n3, axis=1, keepdims=True), 1e-20)
        o3 = rays(0, V3, F3, c3, n3, 64, 10.0, a.work, 'outer3')
        np.savez(W('s2.npz'), o4=o4, sel3=sel3, o3=o3)
    E2 = np.load(W('s2.npz'))
    o4, sel3, o3 = E2['o4'], E2['sel3'], E2['o3']
    log('stage 2: 4.0 outer %d of %d; 3.0 head outer %d of %d' % ((o4 > 0).sum(), len(o4), (o3 > 0).sum(), len(o3)))
    if a.stage == '2':
        return

    # outer surfaces, as meshes of their own (small loose pieces dropped: specks of the inside that a ray happened to reach)
    B4V, B4F = compact(V4, F4[o4 > 0]); B4V, B4F = keep_big(B4V, B4F, 2000)
    H3V, H3F = compact(V3, F3[sel3[o3 > 0]]); H3V, H3F = keep_big(H3V, H3F, 2000)
    log('outer: body %d tris, head %d tris' % (len(B4F), len(H3F)))

    # ---- 3. the 3.0 head fitted to the 4.0 surface
    if not os.path.exists(W('s3.npz')):
        np.savez(W('s3pre.npz'), H3V=H3V)
        H3V = fit_head(H3V, H3F, B4V, B4F)
        np.savez(W('s3.npz'), H3V=H3V)
    H3V = np.load(W('s3.npz'))['H3V']
    if a.stage == '3':
        np.savez(W('dbg3.npz'), B4V=B4V, B4F=B4F, H3V=H3V, H3F=H3F); return

    # consistent winding, facing out (the two releases wind their triangles differently)
    B4F = orient_out(B4V, B4F); H3F = orient_out(H3V, H3F)

    # ---- 4a. the eyes: each eye's own parts; the head's surface where it lies on them is the eye seen between the lids
    EYE = {}
    E3 = np.load(os.path.join(a.src, 'FMA12513_95.npz')) if os.path.exists(os.path.join(a.src, 'FMA12513_95.npz')) else None
    if E3 is None:
        v, f = load_obj(S('FMA12513_95.obj')); v, f = weld(s_ * np.c_[v[:, 0], v[:, 2], -v[:, 1]] + t_, f); E3 = dict(V=v)
    for sd in ('l', 'r'):
        parts = {p: (D[p + '_' + sd + '_v'], D[p + '_' + sd + '_f']) for p in ('sclera', 'cornea', 'iris', 'lens')}
        parts = {p: keep_big(*parts[p], 200) for p in parts}   # the right cornea's file carries a few stray vertices on the left side
        c, r = sphere_fit(parts['sclera'][0])
        # the atlas's eye is 26.8 mm across, at the top of the adult range (21 to 27 mm); the average is 24.2 mm (Bekerman, Gottlieb
        # and Vaiman 2014, J Ophthalmol 2014:503645). This person is an average adult, so each eye is scaled about its centre to 24.2.
        allv = np.r_[parts['sclera'][0], parts['cornea'][0]]; k = EYE_MM / (np.ptp(allv[:, 0]) * 1e3)
        parts = {p: (c + (v - c) * k, f) for p, (v, f) in parts.items()}; r *= k
        iv = parts['iris'][0]; ic = iv.mean(0); gz = np.linalg.svd(iv - ic)[2][2]; gz = gz if gz[2] > 0 else -gz
        sgn = 1 if sd == 'l' else -1; e3 = E3['V'][E3['V'][:, 0] * sgn > 0]; c3, r3 = sphere_fit(e3)
        EYE[sd] = dict(parts=parts, c=c, r=r, pupil=ic, gaze=gz, c3=c3, r3=r3, lat=sgn)
        log('eye %s: centre %s, sclera radius %.2f mm; 3.0 eyeball centre %s, radius %.2f mm' % (sd, np.round(c, 4).tolist(), r * 1e3, np.round(c3, 4).tolist(), r3 * 1e3))
    H3V, H3F, lid = fit_lids(H3V, H3F, EYE)

    # ---- 4b. head and body joined round the neck
    V, F, region, lidj = join_neck(H3V, H3F, lid, B4V, B4F)
    log('joined: %d vertices, %d triangles' % (len(V), len(F)))
    np.savez(W('s4.npz'), V=V, F=F, region=region, lid=lidj)
    if a.stage == '4':
        return

    # ---- 4c. the ears (4.0's, which sit where its skull and skin are), less what of them is inside the head
    FE = orient_out(VE, FE)
    ce = VE[FE].mean(1); ne = fnormals(VE, FE); ne /= np.maximum(np.linalg.norm(ne, axis=1, keepdims=True), 1e-20)
    occV = np.r_[V, VE]; occF = np.r_[F, FE + len(V)]
    oe = rays(0, occV, occF, ce, ne, 48, 10.0, a.work, 'ears')
    VE, FE = compact(VE, FE[oe > 0])
    log('ears: %d of %d triangles outside the head' % (len(FE), len(oe)))

    # ---- 5. reduced region by region; borders kept, so the regions join again exactly
    reg = region_of(V, F, region)
    parts = []
    for r_id, target in REGION_TRIS.items():
        m = reg == r_id
        if not m.any():
            continue
        v, f = compact(V, F[m]); n0 = len(f)
        v, f = reduce(v, f, target)
        parts.append((v, f)); log('region %-5s %6d -> %6d triangles' % (r_id, n0, len(f)))
    parts.append((VE, FE))
    SV, SF = merge_exact(parts)
    SV, SF = fill_holes(SV, SF)
    log('skin: %d vertices, %d triangles' % (len(SV), len(SF)))

    # ---- 6. normals from the full-resolution surface (the joined mesh before it was reduced, and the ears)
    FV, FF = np.r_[V, VE], np.r_[F, FE + len(V)]
    SN = transfer_normals(FV, FF, SV, SF)
    # how thick the body is under each vertex (straight in, to the skin on the other side): light comes through only where it is thin
    th = rays(2, SV, SF, SV, SN, 9, .03, a.work, 'thick_skin')

    # ---- 7. what each vertex is: the red of the lips (4.0's lips), the lid's margin, the brows (3.0's set of eyebrows), the hair of the head (4.0)
    mask = np.zeros((len(SV), 4))
    mask[:, 0] = lips_mask(SV, SN, D['VL'], D['FL'])
    dlid = cKDTree(V[lidj > .4]).query(SV)[0] if (lidj > .4).any() else np.ones(len(SV))
    mask[:, 1] = (dlid < 1e-6).astype(float)
    BV, BF = load_obj(S('FMA71098_95.obj')); BV = s_ * np.c_[BV[:, 0], BV[:, 2], -BV[:, 1]] + t_
    BV = follow_head(BV, D, W, EYE)
    PB = surface_samples(BV, BF, .0004)[0]; db = cKDTree(PB).query(SV)[0]
    mask[:, 2] = np.clip((.003 - db) / .002, 0, 1) * (SV[:, 1] > 1.6)
    HV_, HF_ = load_obj(S('FJ2813.obj')); HV_ = s_ * np.c_[HV_[:, 0], HV_[:, 2], -HV_[:, 1]] + t_
    PH = surface_samples(HV_, HF_, .0008)[0]; dh = cKDTree(PH).query(SV)[0]
    mask[:, 3] = np.clip((.005 - dh) / .003, 0, 1) * (SV[:, 1] > 1.55)
    mask = smooth_attr(SF, len(SV), mask, 2)
    log('masks: lips %d, lid margins %d, brows %d, hair %d vertices' % tuple((mask > .5).sum(0)))
    # below the head, channels 2 and 3 carry nothing; the fingernails (the atlas has none) are plates of their own (nails())
    lim = SV[:, 1] < 1.2; mask[lim, 2] = 0; mask[lim, 3] = 0
    NV, NF, NN, NM = nails(SV, SF, SN)

    # ---- 8. occlusion baked per vertex (the skin by itself, as bake_ao.mjs bakes the skin)
    ao = rays(1, SV, SF, SV, SN, 64, .10, a.work, 'ao_skin')
    ao = smooth_attr(SF, len(SV), ao[:, None], 2)[:, 0]

    # ---- 9. the eyes: sclera, iris and lens in one mesh (a code per vertex), the cornea in another (it is clear)
    meshes = [dict(id='skin', V=SV, F=SF, N=SN, ao=ao, mask=mask, thick=th)]
    meshes.append(dict(id='nails', V=NV, F=NF, N=NN, ao=np.ones(len(NV)), mask=NM))
    log('nails: %d vertices, %d triangles' % (len(NV), len(NF)))
    for sd, E in EYE.items():
        P = E['parts']; ev, ef, code = [], [], []
        for i, (pn, tgt) in enumerate((('sclera', 1100), ('iris', 700), ('lens', 120))):   # most of the sclera is behind the lids
            v, f = P[pn]; f = orient_out(v, f) if pn != 'iris' else f
            v, f = reduce(v, f, tgt); f = f + sum(len(x) for x in ev); ev.append(v); ef.append(f); code.append(np.full(len(v), i))
        ev, ef, code = np.concatenate(ev), np.concatenate(ef), np.concatenate(code)
        en = vnormals(ev, ef)
        occV = np.r_[ev, SV]; occF = np.r_[ef, SF + len(ev)]
        eao = rays(1, occV, occF, ev, en, 64, .02, a.work, 'ao_eye_' + sd)
        em = np.zeros((len(ev), 4)); em[:, 0] = code / 2.0
        meshes.append(dict(id='eye_' + sd, V=ev, F=ef, N=en, ao=eao, mask=em))
        cv, cf = P['cornea']; cv, cf = reduce(cv, orient_out(cv, cf), 700); cn = vnormals(cv, cf)
        meshes.append(dict(id='cornea_' + sd, V=cv, F=cf, N=cn, ao=np.ones(len(cv)), mask=np.zeros((len(cv), 4))))
        log('eye %s: %d + %d triangles (cornea)' % (sd, len(ef), len(cf)))
    meta = dict(eyes={sd: dict(centre=np.round(E['c'], 5).tolist(), radius=round(float(E['r']), 5), pupil=np.round(E['pupil'], 5).tolist(), gaze=np.round(E['gaze'], 4).tolist()) for sd, E in EYE.items()},
                eye_mm=EYE_MM, lid=LID, neck=[NECK_Y, NECK_K])
    write_bin(a.out, meshes, meta)


REGION_TRIS = {'head': 25000, 'hand': 10000, 'foot': 3200, 'body': 9800}   # hands and feet: both of them. With the eyes and the nails,
# about 34,000 triangles more than the coarse skin: the body seen from 1 m stays inside its budget (docs/DEVELOPMENT.md, Performance: 420,000)


NAIL_WL = (1.04, .94, .95, .95, .93)   # width over length of men's fingernails, thumb to little finger (Jung et al. 2015, Fingernail configuration, Arch Plast Surg 42:753)


def nails(SV, SF, SN):
    """the fingernails, laid on the skin by rule: the atlas's skin has the fingertips' shape but no nails. A tip is a point of the skin
    further from the wrist than all the skin within 8 mm of it, with a last bone of a finger of data/anatomy's skeleton under it (a small
    bone; the thumb's is the largest); the axis runs along the middles of the finger's skin 5 and 15 mm back from the tip; the back of a finger faces away from the palm
    (the model stands with its palms forward), the thumb's half turned out to its side. The plate is four fifths as wide as the tip, measured on this model 7 mm from the tip (no wider than 1.3 times the
    tip's depth there, where the thumb's skin runs into a finger's); its length from the width and the published ratio (NAIL_WL); it
    leaves the skin 2.5 mm short of the tip, with a 2 mm free edge; its fold curving back 1.5 mm at the middle. Each nail is a small
    plate of its own (nail_plate), laid on the back of the finger only (the skin's normal within 73 degrees of the finger's back), so
    nothing of it wraps round the pad. Returns the plates as one mesh: vertices, triangles, normals and a mask per vertex (nail_plate).
    Not the toes: the atlas's toes are one piece of skin, and where each nail would lie is not clear in it."""
    plates = []
    sk = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'anatomy', 'skeletal.json')))
    bones = {}
    for p in sk['parts']:
        if p['id'] in ('hand_bones_l', 'hand_bones_r', 'foot_bones_l', 'foot_bones_r'):
            q = np.array(p['pos'], float).reshape(-1, 3) * np.array(p['scale']) + np.array(p['offset']); f = np.array(p['idx']).reshape(-1, 3)
            k, lab = connected_components(adjacency(f, len(q)), directed=False)
            bones[p['id']] = [q[lab == c] for c in range(k)]
    for kind, sd in (('hand', 'l'), ('hand', 'r')):   # not the toes: the atlas's toes are one piece of skin, and where each nail would lie is not clear in it
        sgn = 1 if sd == 'l' else -1
        if kind == 'hand':
            sel = (SV[:, 0] * sgn > .2) & (SV[:, 1] < .95); root = np.array([.24 * sgn, .90, .02]); r = .008; small = 30
        else:
            sel = (SV[:, 0] * sgn > 0) & (SV[:, 1] < .14); root = np.array([.09 * sgn, .03, -.05]); r = .005; small = 32
        idx = np.where(sel)[0]; P = SV[idx]; dist = np.linalg.norm(P - root, axis=1); tr = cKDTree(P)
        cand = [i for i in np.argsort(-dist) if dist[i] >= dist[tr.query_ball_point(P[i], r)].max() - 1e-12]
        B = bones[kind + '_bones_' + sd]; cen = np.array([b.mean(0) for b in B]); used = {}
        for i in cand:
            j = int(np.argmin(np.linalg.norm(cen - P[i], axis=1)))
            if len(B[j]) <= small and np.linalg.norm(cen[j] - P[i]) < .03 and j not in used:
                used[j] = i
            if len(used) == 5:
                break
        thumb = max(used, key=lambda j: len(B[j]))
        rest = sorted([j for j in used if j != thumb], key=lambda j: -abs(cen[j][0]))
        Asub = adjacency(SF, len(SV))[idx][:, idx]
        # the back of the hand: the model stands in the anatomical position, palms forward (+z), thumbs out to the side
        palm = np.array([0, 0, 1.]); tdir = np.array([1. if sd == 'l' else -1., 0, 0])
        geo = []
        for rank, j in enumerate([thumb] + rest):
            T = P[used[j]]; bc = cen[j]; ax = T - bc; ax /= np.linalg.norm(ax)
            ball = (np.linalg.norm(P - T, axis=1) < .025) & ((P - bc) @ ax > -.012); bi = np.where(ball)[0]   # this finger only: the part of the
            k_, lab_ = connected_components(Asub[bi][:, bi], directed=False); near = np.zeros(len(P), bool)   # ball joined to the tip
            near[bi[lab_ == lab_[np.searchsorted(bi, used[j])]]] = True
            for _ in range(2):   # the axis along the finger's own skin: the middles of two slices, 5 and 15 mm back from the tip
                q = (P - T) @ ax; c5, c15 = near & (np.abs(q + .005) < .0015), near & (np.abs(q + .015) < .0015)
                if c5.sum() > 3 and c15.sum() > 3:
                    ax = P[c5].mean(0) - P[c15].mean(0); ax /= np.linalg.norm(ax)
            dv = -palm if rank else tdir - .5 * palm
            dv = dv - ax * (dv @ ax); dv /= np.linalg.norm(dv); lat = np.cross(ax, dv)
            Q = P - T; s_ = Q @ ax; up = Q @ dv; la = Q @ lat
            ctr = near & (np.abs(s_ + .007) < .0015)
            u0 = .5 * (up[ctr].min() + up[ctr].max()); c0 = .5 * (la[ctr].min() + la[ctr].max())
            wid = min(np.ptp(la[ctr]), 1.3 * np.ptp(up[ctr]))   # a fingertip is about as wide as it is deep: where the thumb lies against a finger, the skin is one
            geo.append([rank, near, dv, s_, up, la, u0, c0, wid, T, ax, lat])
        # where the thumb's skin runs into a finger's, its width measured is the two together: no more than 1.35 times the index's (the
        # thumbnail is about 1.33 times as wide as the index's), centred on the tip
        fw = [g[8] for g in geo[1:]]
        if geo and fw and geo[0][8] > 1.35 * fw[0]:
            geo[0][8] = 1.35 * fw[0]; geo[0][7] = 0.0
        for rank, near, dv, s_, up, la, u0, c0, wid, T, ax, lat in geo:
            wl = NAIL_WL[min(rank, 4)]
            nw = .8 * wid; L = nw / wl; sh = -.0025; sp_ = sh - L   # sh: where the plate leaves the skin (the hyponychium), 2.5 mm short of the tip
            back = near & (up > u0) & (SN[idx] @ dv > .3)   # the back of this finger's end
            loc = -np.ones(len(SV), np.int64); loc[idx] = np.arange(len(idx))
            ft = SF[(loc[SF] >= 0).all(1)]; ft = loc[ft]; ft = ft[near[ft].all(1)]   # this finger's own triangles
            v, f, n, mk = nail_plate(np.stack([s_[ft], la[ft], up[ft]], -1), c0, nw, sp_, sh)
            X = T + np.outer(v[:, 0], ax) + np.outer(v[:, 1], lat) + np.outer(v[:, 2], dv)
            Nw = np.outer(n[:, 0], ax) + np.outer(n[:, 1], lat) + np.outer(n[:, 2], dv)
            if (np.cross(X[f[:, 1]] - X[f[:, 0]], X[f[:, 2]] - X[f[:, 0]]) @ dv).sum() < 0:   # (ax, lat, dv) is a left-handed frame: wind the plate to face out of the finger's back
                f = f[:, ::-1]
            plates.append((X, f, Nw, mk))
            log('nail: %s %s %d: %.1f x %.1f mm, on %d vertices of the finger\'s back' % (kind, sd, rank, nw * 1e3, L * 1e3, back.sum()))
    V = np.concatenate([p[0] for p in plates]); N = np.concatenate([p[2] for p in plates]); M = np.concatenate([p[3] for p in plates])
    F = []; o = 0
    for p in plates:
        F.append(p[1] + o); o += len(p[0])
    return V, np.concatenate(F), N / np.linalg.norm(N, axis=1, keepdims=True), M


def nail_plate(T3, c0, nw, sp, sh, nu=7, nv=11):
    """one nail as a plate of its own, in the finger's frame (s along the finger, 0 at the tip; l across it; h out of its back), laid
    on the back of the finger's skin: T3 are the finger's own triangles in that frame, (n, 3 corners, (s, l, h)), and the skin's height
    under a point (s, l) is that of the highest triangle over it, as a ray straight down onto the finger's back would find it. The
    proximal edge an arc under the fold of skin; each row no wider than 0.72 of the finger there (seen from its back), so the plate narrows with the
    fingertip and its sides stay in the lateral folds (sunk 0.8 mm), the free edge a little narrower; the plate 0.35 mm above the skin over the bed, then leaving the
    skin at `sh` and running on straight for 2 mm (the free edge) along the slope of the bed. Returns the vertices (s, l, h),
    triangles, normals and a mask per vertex: across the nail (0..1), along it from the fold (0..1), the free edge (1 past the
    hyponychium), 0."""
    A, B, C = T3[:, 0], T3[:, 1], T3[:, 2]
    den = (B[:, 1] - C[:, 1]) * (A[:, 0] - C[:, 0]) + (C[:, 0] - B[:, 0]) * (A[:, 1] - C[:, 1])
    ok = np.abs(den) > 1e-14; A, B, C, den = A[ok], B[ok], C[ok], den[ok]

    def H(qs, ql):
        qs, ql = np.atleast_1d(qs).ravel(), np.atleast_1d(ql).ravel(); out = np.full(len(qs), np.nan)
        for i in range(len(qs)):
            w1 = ((B[:, 1] - C[:, 1]) * (qs[i] - C[:, 0]) + (C[:, 0] - B[:, 0]) * (ql[i] - C[:, 1])) / den
            w2 = ((C[:, 1] - A[:, 1]) * (qs[i] - C[:, 0]) + (A[:, 0] - C[:, 0]) * (ql[i] - C[:, 1])) / den
            w3 = 1 - w1 - w2; m = (w1 >= -1e-9) & (w2 >= -1e-9) & (w3 >= -1e-9)
            if m.any():
                out[i] = (w1[m] * A[m, 2] + w2[m] * B[m, 2] + w3[m] * C[m, 2]).max()
        return out

    se = sh + .002
    ln = np.linspace(-1, 1, nu); tv = np.linspace(0, 1, nv)
    LN, TV = np.meshgrid(ln, tv)   # rows along the nail, columns across
    s0 = sp - .0015 * (1 - LN ** 2)   # the fold's arc, its middle 1.5 mm further back
    s1 = se + .0006 * (1 - LN ** 2) - .0012 * LN ** 4   # the free edge, rounded, its corners further back
    S = s0 + TV * (s1 - s0)
    # each row's half width: no more than 0.42 of the finger's width there (seen from above), centred where the finger is
    probe = np.linspace(-nw, nw, 61) + c0; HW = np.zeros(nv); CC = np.zeros(nv)
    for i in range(nv):
        sr = min(S[i].mean(), sh); hit = ~np.isnan(H(np.full(len(probe), sr), probe))
        lo, hi = (probe[hit].min(), probe[hit].max()) if hit.any() else (c0 - nw / 2, c0 + nw / 2)
        HW[i] = min(nw / 2, .36 * (hi - lo)) * (1 - .1 * sm_(sh - .001, sh + .002, S[i].mean())); CC[i] = np.clip(c0, lo + HW[i], hi - HW[i]) if hi - lo > 2 * HW[i] else (lo + hi) / 2
    Lw = CC[:, None] + LN * HW[:, None]
    L = sh - sp; Sb = np.minimum(S, sh); Hb = H(Sb, Lw).reshape(S.shape)
    if np.isnan(Hb).any():   # a corner the finger does not reach under: the row's own height
        rowm = np.nanmean(np.where(np.isnan(Hb), np.nan, Hb), axis=1, keepdims=True); Hb = np.where(np.isnan(Hb), np.nanmin(Hb, axis=1, keepdims=True) if not np.isnan(rowm).all() else 0, Hb)
    i1, i0 = np.argmin(np.abs(S[:, nu // 2] - (sh - .25 * L))), np.argmin(np.abs(S[:, nu // 2] - (sp + .33 * L)))
    slope = np.clip((Hb[i1] - Hb[i0]) / max(S[i1, nu // 2] - S[i0, nu // 2], 1e-4), -.35, .1)   # the bed's own slope, per column (a nail does not turn up)
    ish = np.argmin(np.abs(S[:, nu // 2] - sh))
    Hp = np.where(S > sh, Hb[ish][None, :] + slope[None, :] * (S - S[ish][None, :]), Hb)
    off = .00035 - .0012 * (1 - sm_(.0, .12, TV)) - .0008 * sm_(.62, 1.0, np.abs(LN))   # sunk under the fold (steeply, so the skin's edge over it is clean) and into the lateral folds
    Hp = Hp + off
    V = np.c_[S.ravel(), Lw.ravel(), Hp.ravel()]
    F = []
    for i in range(nv - 1):
        for j in range(nu - 1):
            a = i * nu + j; b = a + 1; c = a + nu; d = c + 1
            F += [[a, c, b], [b, c, d]]
    F = np.array(F, np.int64)
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    if fn[:, 2].mean() < 0:
        F = F[:, ::-1]
    N = vnormals(V, F)
    M = np.c_[(LN.ravel() + 1) / 2, TV.ravel(), sm_(sh - .0003, sh + .0003, S.ravel()), np.zeros(V.shape[0])]
    return V, F, N, M


def sm_(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def front_profile(P, y0, y1, step=.0005):
    ys = np.arange(y0, y1, step); z = np.full(len(ys), -np.inf); m = np.abs(P[:, 0]) < .003
    for i, y in enumerate(ys):
        k = m & (np.abs(P[:, 1] - y) < step * .75)
        if k.any():
            z[i] = P[k, 2].max()
    return ys, z


def parting(P, lower, upper):
    """where the lips meet at the middle: the deepest point of the front profile between the lower lip's fullest point (searched in
    `lower`, a y range) and the upper lip's (in `upper`)"""
    ys, z = front_profile(P, lower[0], upper[1])
    il = np.where((ys >= lower[0]) & (ys <= lower[1]))[0]; iu = np.where((ys >= upper[0]) & (ys <= upper[1]))[0]
    a = il[np.argmax(z[il])]; b = iu[np.argmax(z[iu])]
    seg = z[a:b + 1].copy(); seg[~np.isfinite(seg)] = np.inf
    return ys[a + int(np.argmin(seg))], ys[a], ys[b]


def lips_mask(SV, SN, VL, FL, cell=.0002):
    """the red of the lips: the outline of the atlas's lips (4.0, FJ2814) seen from the front, moved up or down so that where its lips meet
    is where this head's do (the head is 3.0's, whose mouth sits higher), laid on the front of the skin; soft over 0.8 mm at the edge"""
    from scipy import ndimage
    ys, _, yup = parting(SV, (1.556, 1.571), (1.574, 1.588)); yl = parting(VL, (1.553, 1.5595), (1.562, 1.571))[0]
    # the upper lip's red ends at its border, the lip's most forward line (its fullest point at the middle): the atlas's upper lip is
    # stretched to reach it, the lower lip kept as the atlas has it
    k = (yup - ys) / (VL[:, 1].max() - yl)
    log('lips: the skin\'s lips meet at y %.4f, the atlas lips at %.4f: outline moved %+.1f mm, its upper lip x %.2f' % (ys, yl, (ys - yl) * 1e3, k))
    P = surface_samples(VL, FL, cell * .7)[0]; up = P[:, 1] > yl
    P[:, 1] = np.where(up, ys + (P[:, 1] - yl) * k, ys + (P[:, 1] - yl))
    lo = P[:, :2].min(0) - .003; n = np.ceil((P[:, :2].max(0) + .003 - lo) / cell).astype(int) + 1
    G = np.zeros(n[::-1], bool); ij = ((P[:, :2] - lo) / cell).astype(int); G[ij[:, 1], ij[:, 0]] = True
    G = ndimage.binary_fill_holes(ndimage.binary_closing(G, iterations=3))
    din = ndimage.distance_transform_edt(G) * cell
    q = ((SV[:, :2] - lo) / cell).astype(int); ok = (q >= 0).all(1) & (q[:, 0] < n[0]) & (q[:, 1] < n[1])
    m = np.zeros(len(SV)); m[ok] = np.clip(din[q[ok, 1], q[ok, 0]] / .0008, 0, 1)
    m *= (SV[:, 2] > .07) & (SN[:, 2] > -.2)   # the front of the face only
    return m


def region_of(V, F, region):
    c = V[F].mean(1); head = region[F].mean(1) > .5
    hand = (np.abs(c[:, 0]) > .2) & (c[:, 1] < .92)
    foot = c[:, 1] < .12
    r = np.where(head, 'head', np.where(hand, 'hand', np.where(foot, 'foot', 'body')))
    return r


def reduce(V, F, target):
    """quadric reduction to about `target` triangles; the borders of the piece are not touched (so pieces still meet)"""
    import pyfqmr
    if len(F) <= target:
        return V, F
    m = pyfqmr.Simplify(); m.setMesh(V.astype(np.float64), F.astype(np.int32))
    m.simplify_mesh(target_count=int(target), aggressiveness=5, preserve_border=True, verbose=False)
    v, f, _ = m.getMesh()
    return compact(np.asarray(v, float), np.asarray(f, np.int64))


def merge_exact(parts):
    """pieces whose borders were kept: weld vertices at exactly the same place"""
    V = np.concatenate([p[0] for p in parts]); F = []; o = 0
    for v, f in parts:
        F.append(f + o); o += len(v)
    return weld(V, np.concatenate(F), 1e-9)


def transfer_normals(FV, FF, SV, SF, step=.0012):
    """each vertex's normal: the fine surface's own (smooth) normal round it: the fine surface sampled every `step` with its vertex
    normals interpolated, averaged over a disc as wide as the reduced mesh's own triangles there (half the mean length of the vertex's
    edges, at least the 8 nearest samples), leaving out samples that face away from the reduced mesh's own normal (so the two sides of
    a thin fold, a lid's margin or an ear, do not mix). Over the trunk the reduced triangles are 2 cm across: a normal taken from a few
    millimetres of the fine surface there was a bump the triangle cannot hold, and the belly shaded as a patchwork."""
    FN = vnormals(FV, FF); own = vnormals(SV, SF)
    A = np.linalg.norm(fnormals(FV, FF), axis=1) / 2
    n = np.maximum(1, np.ceil(A / (step * step * .5)).astype(int)); tri = np.repeat(np.arange(len(FF)), n)
    r1, r2 = np.random.default_rng(2).random((2, len(tri))); sq = np.sqrt(r1); u, v = 1 - sq, sq * (1 - r2); w = sq * r2
    f = FF[tri]
    P = np.r_[FV, FV[f[:, 0]] * u[:, None] + FV[f[:, 1]] * v[:, None] + FV[f[:, 2]] * w[:, None]]
    Q = np.r_[FN, FN[f[:, 0]] * u[:, None] + FN[f[:, 1]] * v[:, None] + FN[f[:, 2]] * w[:, None]]
    E = edges_of(SF); el = np.linalg.norm(SV[E[:, 0]] - SV[E[:, 1]], axis=1)
    rad = (np.bincount(E[:, 0], el, len(SV)) + np.bincount(E[:, 1], el, len(SV))) / np.maximum(np.bincount(E[:, 0], None, len(SV)) + np.bincount(E[:, 1], None, len(SV)), 1) * .5
    tr = cKDTree(P); d8, j8 = tr.query(SV, k=8); N = np.zeros_like(SV)
    for i in range(len(SV)):
        J = j8[i] if rad[i] <= d8[i, -1] else np.array(tr.query_ball_point(SV[i], rad[i]))
        nq = Q[J]; ok = nq @ own[i] > .3
        if not ok.any():
            N[i] = own[i]; continue
        dd = np.linalg.norm(P[J] - SV[i], axis=1); wt = ok * np.clip(1 - dd / max(rad[i], d8[i, -1]) * .7, .05, 1)
        N[i] = (nq * wt[:, None]).sum(0)
    N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-20)
    return N


def fill_holes(V, F, maxext=.015):
    """close the small openings the outer-surface pass and the reductions left (a missing triangle, a slit by a lid, a gap in the
    groin): each boundary loop less than `maxext` across is closed by a fan round a new vertex at its middle. The eye openings and
    the ears' bases, which are meant to be open, are larger."""
    E = np.r_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]
    key = np.sort(E, axis=1); u, inv, c = np.unique(key, axis=0, return_inverse=True, return_counts=True)
    be = E[c[inv.ravel()] == 1]   # directed, as they run in their faces
    if not len(be):
        return V, F
    nodes = np.unique(be); m = {x: i for i, x in enumerate(nodes)}
    k, lab = connected_components(coo_matrix((np.ones(len(be)), ([m[a] for a in be[:, 0]], [m[b] for b in be[:, 1]])), shape=(len(nodes),) * 2), directed=False)
    newV, newF, n0 = [], [], 0
    for comp in range(k):
        vs = nodes[lab == comp]
        if np.ptp(V[vs], 0).max() >= maxext:
            continue
        ci = len(V) + len(newV); newV.append(V[vs].mean(0))
        for a, b in be[np.isin(be[:, 0], vs)]:
            newF.append([b, a, ci])
        n0 += 1
    log('holes: %d of %d openings closed (%d triangles)' % (n0, k, len(newF)))
    if not newV:
        return V, F
    return np.r_[V, np.array(newV)], np.r_[F, np.array(newF, np.int64)]


def smooth_attr(F, n, X, rounds):
    A = adjacency(F, n); deg = np.asarray(A.sum(1)).ravel()
    for _ in range(rounds):
        X = (X * 2 + A @ X) / (2 + deg)[:, None]
    return X


def follow_head(P, D, W, EYE):
    """move points made for the 3.0 head (its brows) the way the head was moved: the fit to 4.0, then the lids' shift with the eye"""
    G = np.load(W('dbg3.npz')) if os.path.exists(W('dbg3.npz')) else None
    pre = np.load(W('s3pre.npz'))['H3V']; post = np.load(W('s3.npz'))['H3V']
    d, i = cKDTree(pre).query(P, k=8); w = 1 / np.maximum(d, 1e-5); w /= w.sum(1, keepdims=True)
    P = P + ((post - pre)[i] * w[:, :, None]).sum(1)
    for E in EYE.values():
        dd = np.linalg.norm(P - E['c3'], axis=1); ww = np.clip((E['r3'] + .015 - dd) / .015, 0, 1); ww = ww * ww * (3 - 2 * ww)
        P = P + ((E['c'] + (P - E['c3']) * (E['r'] / E['r3'])) - P) * ww[:, None]
    return P


def oct_encode(N):
    bad = ~np.isfinite(N).all(1) | (np.abs(N).sum(1) < 1e-6)
    if bad.any():
        raise ValueError('%d vertices without a normal' % bad.sum())
    n = N / np.abs(N).sum(1, keepdims=True)
    x, y = n[:, 0].copy(), n[:, 1].copy()
    neg = n[:, 2] < 0
    x[neg], y[neg] = (1 - np.abs(n[neg, 1])) * np.sign(n[neg, 0] + 1e-30), (1 - np.abs(n[neg, 0])) * np.sign(n[neg, 1] + 1e-30)
    return np.clip(np.round(np.c_[x, y] * 127), -127, 127).astype(np.int8)


def write_bin(path, meshes, meta):
    """'SKHD', uint32 header length, the header (JSON), then per mesh, each block 4-byte aligned: positions int16 x3 (over the mesh's
    box), normals int8 x2 (octahedral), occlusion uint8 (255 = closed), masks uint8 x4, if the mesh's header says `thick`: the thickness
    under each vertex uint8 (0.1 mm, up to 25.5 mm), then indices uint16 (or uint32 if 65,536 vertices or more)"""
    blobs = []; head = dict(format='skin-hd-2', units='m', meshes=[], **meta)
    for m in meshes:
        V, F = m['V'], m['F']; lo, hi = V.min(0), V.max(0); sc = (hi - lo) / 65534
        N = m['N']; bad = ~np.isfinite(N).all(1) | (np.abs(N).sum(1) < 1e-6)
        if bad.any():   # a vertex only on triangles of no area: the mean of its neighbours' normals
            A = adjacency(F, len(V)); Nb = A @ np.where(bad[:, None], 0, N); N = N.copy(); N[bad] = Nb[bad] / np.maximum(np.linalg.norm(Nb[bad], axis=1, keepdims=True), 1e-20)
            log('%s: %d vertices took their neighbours\' normal' % (m['id'], bad.sum())); m['N'] = N
        q = np.round((V - lo) / sc - 32767).astype('<i2')
        occ = np.round(255 * (1 - np.clip(m['ao'], 0, 1))).astype(np.uint8)
        mk = np.round(255 * np.clip(m['mask'], 0, 1)).astype(np.uint8)
        it = '<u2' if len(V) < 65536 else '<u4'
        parts = [q.tobytes(), oct_encode(m['N']).tobytes(), occ.tobytes(), mk.tobytes()]
        hm = dict(id=m['id'], vertices=len(V), triangles=len(F), scale=sc.tolist(), offset=(lo + sc * 32767).tolist(), index=it[1:])
        if m.get('thick') is not None:
            parts.append(np.round(np.clip(m['thick'] * 1e4, 0, 255)).astype(np.uint8).tobytes()); hm['thick'] = 1
        parts.append(F.astype(it).tobytes())
        head['meshes'].append(hm)
        blobs.append(parts)
    hj = json.dumps(head, separators=(',', ':')).encode(); hj += b' ' * (-len(hj) % 4)
    with open(path, 'wb') as fh:
        fh.write(b'SKHD'); fh.write(struct.pack('<I', len(hj))); fh.write(hj)
        for parts in blobs:
            for b in parts:
                fh.write(b); fh.write(b'\0' * (-len(b) % 4))
    log('wrote %s: %d bytes' % (path, os.path.getsize(path)))


EYE_MM = 24.2
NECK_Y, NECK_K = 1.462, 9.0   # the seam: y = NECK_Y + NECK_K x^2 (low at the throat and the nape, rising at the sides above the trapezius)


def neck_phi(V):
    return V[:, 1] - NECK_Y - NECK_K * V[:, 0] ** 2


def orient_out(V, F):
    """make every connected piece's winding consistent (a walk over shared edges), then turn it so the enclosed volume is positive"""
    F = F.copy(); nf = len(F)
    e = np.c_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]].reshape(-1, 2)
    key = np.sort(e, axis=1); key = key[:, 0] * (len(V) + 1) + key[:, 1]
    order = np.argsort(key); ks = key[order]
    same = np.where(ks[1:] == ks[:-1])[0]
    a_, b_ = order[same] // 3, order[same + 1] // 3
    ea, eb = e[order[same]], e[order[same + 1]]
    agree = ~((ea[:, 0] == eb[:, 0]) & (ea[:, 1] == eb[:, 1]))   # neighbours agree when they run the shared edge in opposite directions
    nbr = [[] for _ in range(nf)]
    for x, y, g in zip(a_, b_, agree):
        nbr[x].append((y, g)); nbr[y].append((x, g))
    flip = np.zeros(nf, bool); seen = np.zeros(nf, bool); comp = -np.ones(nf, int); k = 0
    for s in range(nf):
        if seen[s]:
            continue
        stack = [s]; seen[s] = True; comp[s] = k
        while stack:
            t = stack.pop()
            for u, g in nbr[t]:
                if not seen[u]:
                    seen[u] = True; comp[u] = k; flip[u] = flip[t] ^ (not g); stack.append(u)
        k += 1
    F[flip] = F[flip][:, ::-1]
    for c in range(k):
        m = comp == c
        if m.sum() < 50:
            continue
        P = V[F[m]]; vol = np.einsum('ij,ij->i', P[:, 0], np.cross(P[:, 1], P[:, 2])).sum()
        # an open piece (the head cut at the neck): judge by the faces' normals against the direction from the piece's middle
        fn = fnormals(V, F[m]); out = (fn * (P.mean(1) - P.reshape(-1, 3).mean(0))).sum()
        if (out < 0):
            F[m] = F[m][:, ::-1]
    return F


def sphere_fit(P):
    A = np.c_[2 * P, np.ones(len(P))]; b = (P ** 2).sum(1)
    x = np.linalg.lstsq(A, b, rcond=None)[0]; c = x[:3]
    return c, np.sqrt(x[3] + (c ** 2).sum())


def cut_eyes(V, F, EYE, gap=.0012):
    """remove the head's surface where it lies on an eye (within `gap` of the sclera or cornea): what is left is the lids, ending at
    their margins. Each margin is then turned in towards the eye by a strip that ends just off the eye's surface, so the lid has an
    edge, not a paper-thin rim, and nothing behind it shows through."""
    lid = np.zeros(len(V))
    drop = np.zeros(len(V), bool)
    eyeP = []
    for sd, E in EYE.items():
        Ps = [surface_samples(*E['parts'][p], .0004)[0] for p in ('sclera', 'cornea')]
        P = np.r_[Ps[0], Ps[1]]; eyeP.append(P)
        near = np.linalg.norm(V - E['c'], axis=1) < E['r'] + .012
        d = cKDTree(P).query(V[near])[0]
        idx = np.where(near)[0]; drop[idx[d < gap]] = True
    keepF = ~drop[F].any(1)
    V2, F2 = compact(V, F[keepF])
    V2, F2 = keep_big(V2, F2, 2000)
    # the margins: boundary loops near an eye
    be = boundary_edges(F2)
    tree = cKDTree(np.concatenate(eyeP))
    allP = np.concatenate(eyeP)
    rim = np.unique(be)
    rim = rim[np.linalg.norm(V2[rim][:, None, :] - np.array([EYE['l']['c'], EYE['r']['c']])[None], axis=2).min(1) < .03]
    # the oriented boundary edges as they run in the faces (so the strip is wound like the surface it continues)
    fe = np.c_[F2[:, [0, 1]], F2[:, [1, 2]], F2[:, [2, 0]]].reshape(-1, 2)
    bset = set(map(tuple, np.sort(be, axis=1)))
    rimset = set(rim.tolist())
    oe = [tuple(x) for x in fe if tuple(sorted(x)) in bset and x[0] in rimset and x[1] in rimset]
    newV = []; mapq = {}
    for v in rim:
        d, j = tree.query(V2[v]); q = allP[j]
        n = (V2[v] - q); n = n / max(np.linalg.norm(n), 1e-9)
        mapq[v] = len(V2) + len(newV); newV.append(q + n * .00015)
    V3 = np.r_[V2, np.array(newV)]
    strip = []
    for a_, b_ in oe:
        qa, qb = mapq[a_], mapq[b_]
        strip += [[b_, a_, qa], [b_, qa, qb]]
    F3 = np.r_[F2, np.array(strip, np.int64)]
    lid = np.zeros(len(V3)); lid[len(V2):] = 1
    log('eyes: %d vertices on the eyes removed; lid margins %d edges' % (drop.sum(), len(oe)))
    return V3, F3, lid


LID_RELAX = int(os.environ.get('LID_RELAX', 40))
LID = dict(a=.0130, up=.0035, lo=.0055, ledge=.0016)
"""The open eye (both sides). The lids of the 3.0 head were wrapped round 3.0's eyeball, which 4.0 corrected (31.7 mm across and 9 mm
too high and 6 mm too far forward there; 25.8 mm and inside the orbit in 4.0), so as scanned they leave the 4.0 eye covered but for a
slit above the pupil. They are moved with the eye (the same shift and scale, fading out over 1.5 cm), and the opening between them is
set to the measured average for adult men: upper lid margin 3.5 mm above the pupil's centre, lower 5.5 mm below (MRD1 and MRD2), the
corners 26 mm apart (Rana et al. 2023, Int Ophthalmol 43:2695, men: MRD1 3.5, MRD2 5.5, horizontal aperture 26.1 mm). The curve of
each margin between those points is a smooth arc (approximate). Each margin is a ledge 1.6 mm deep, turned in to the eye's surface."""


def subdivide(V, F, mask=None):
    """split every triangle (or those with all three vertices in `mask`... here: all) in four at the midpoints of its edges"""
    e = np.sort(np.r_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]], axis=1)
    u, inv = np.unique(e, axis=0, return_inverse=True); inv = inv.reshape(3, -1).T
    mid = len(V) + inv
    V2 = np.r_[V, (V[u[:, 0]] + V[u[:, 1]]) / 2]
    a, b, c = F[:, 0], F[:, 1], F[:, 2]; ab, bc, ca = mid[:, 0], mid[:, 1], mid[:, 2]
    F2 = np.r_[np.c_[a, ab, ca], np.c_[ab, b, bc], np.c_[ca, bc, c], np.c_[ab, bc, ca]]
    return V2, F2


def eye_local(P, E):
    ez = E['gaze']; ex = np.array([1.0, 0, 0]) - ez * ez[0]; ex /= np.linalg.norm(ex); ey = np.cross(ez, ex)
    Q = P - E['pupil']
    return Q @ ex, Q @ ey, Q @ ez, (ex, ey, ez)


def almond(u, v, E):
    """positive inside the opening between the lids (in the eye's own frame, metres)"""
    k = np.clip(1 - (u / LID['a']) ** 2, 0, None)
    yu = LID['up'] * k ** .6; yl = -LID['lo'] * k ** .8
    return np.where(np.abs(u) < LID['a'], np.minimum(yu - v, v - yl), -np.abs(u) + LID['a'] - 1e-4)


def fit_lids(V, F, EYE):
    from scipy.sparse import diags
    from scipy.sparse.linalg import cg
    V = V.copy()
    # 1. the lids follow the eye they were made round: 3.0's eyeball -> 4.0's (shift and scale about it), fading out from 1.2 to 2.7 cm off its centre
    for E in EYE.values():
        d = np.linalg.norm(V - E['c3'], axis=1); w = np.clip((E['r3'] + .015 - d) / .015, 0, 1); w = w * w * (3 - 2 * w)
        tgt = E['c'] + (V - E['c3']) * (E['r'] / E['r3'])
        V += (tgt - V) * w[:, None]
    # 2. finer triangles round the eyes (twice split in four), so the opening's edge is smooth
    for _ in range(2):
        near = np.zeros(len(V), bool)
        for E in EYE.values():
            near |= np.linalg.norm(V - E['c'], axis=1) < .032
        sel = near[F].all(1)
        if not sel.any():
            break
        Vs, Fs = subdivide(V, F[sel])
        # the triangles round the subdivided patch would get T-junctions: split them by fan to the new midpoints of their shared edges
        V, F = stitch_subdivided(V, F, sel, Vs, Fs)
    # 3. the opening: cut along the almond in each eye's frame
    s = -np.ones(len(V))
    for E in EYE.values():
        u, v, w, _ = eye_local(V, E); m = (V - E['c']) @ E['gaze'] > -E['r'] * .3   # the front of the eye: the lids, and what of 3.0's skin lay inside its larger eyeball
        m &= np.linalg.norm(V - E['c'], axis=1) < .03
        s[m] = np.maximum(s[m], almond(u[m], v[m], E))
    V, F, on, _ = clip(V, F, s, False)
    # 4. the rim onto the eye: each rim vertex to the eye's surface at its place in the opening plus the ledge; the lids round it follow
    target = np.zeros_like(V); pin = np.zeros(len(V))
    eyeS = {}
    for sd, E in EYE.items():
        P = np.r_[surface_samples(*E['parts']['sclera'], .0003)[0], surface_samples(*E['parts']['cornea'], .0003)[0]]
        pu, pv, pw, _ = eye_local(P, E); front = pw > -.003; eyeS[sd] = (P[front], cKDTree(np.c_[pu, pv][front]), P, cKDTree(P))
        u, v, w, _ = eye_local(V, E); m = on & (np.linalg.norm(V - E['c'], axis=1) < .03)
        dq, j = eyeS[sd][1].query(np.c_[u[m], v[m]], k=8); wq = 1 / np.maximum(dq, 1e-5); wq /= wq.sum(1, keepdims=True)
        q = (eyeS[sd][0][j] * wq[:, :, None]).sum(1)   # the eye's surface at that place (a few samples averaged: no steps of the sampling)
        n = q - E['c']; n /= np.linalg.norm(n, axis=1, keepdims=True)
        target[m] = q + n * LID['ledge'] - V[m]; pin[m] = 1
    far = np.ones(len(V), bool)
    for E in EYE.values():
        far &= np.linalg.norm(V - E['c'], axis=1) > .026
    pin[far] = 1
    n = len(V); A = adjacency(F, n); Lp = diags(np.asarray(A.sum(1)).ravel()) - A
    M = (diags(pin * 1e3 + 1e-9) + Lp).tocsr()
    U = np.zeros_like(V)
    for k in range(3):
        U[:, k], _ = cg(M, target[:, k] * pin * 1e3, maxiter=6000, rtol=1e-9)
    V = V + U
    # 5. nothing of the lids inside the eye; then the lids relaxed (Taubin's smoothing, which does not shrink): 3.0's lids were folded
    #    round its larger eyeball, and moving them onto this one left creases. The rim stays where step 4 put it.
    def out_of_eye(V):
        for sd, E in EYE.items():
            _, _, P, tr = eyeS[sd]; m = (np.linalg.norm(V - E['c'], axis=1) < E['r'] + .004) & ~on
            if m.any():
                d, j = tr.query(V[m]); q = P[j]; nrm = q - E['c']; nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)
                inside = ((V[m] - q) * nrm).sum(1) < .0006
                idx = np.where(m)[0][inside]; V[idx] = q[inside] + nrm[inside] * .0006
        return V
    V = out_of_eye(V)
    wz = np.zeros(len(V))
    for E in EYE.values():
        d = np.linalg.norm(V - E['c'], axis=1); wz = np.maximum(wz, np.clip((.029 - d) / .007, 0, 1))
    wz[on] = 0
    deg = np.asarray(A.sum(1)).ravel()
    for it in range(LID_RELAX):
        for lam in (.5, -.53):
            V = V + lam * wz[:, None] * ((A @ V) / np.maximum(deg, 1)[:, None] - V)
        if it % 10 == 9:
            V = out_of_eye(V)
    V = out_of_eye(V)
    # 6. the margin: a strip from the rim in to just off the eye
    fe = np.c_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]].reshape(-1, 2)
    bset = set(map(tuple, np.sort(boundary_edges(F), axis=1)))
    oe = [tuple(x) for x in fe if on[x[0]] and on[x[1]] and tuple(sorted(x)) in bset]
    rim = sorted(set([x for e in oe for x in e]))
    newV = []; mq = {}
    for sd, E in EYE.items():
        _, _, P, tr = eyeS[sd]
        for v in rim:
            if np.linalg.norm(V[v] - E['c']) < .03 and v not in mq:
                rv = np.linalg.norm(V[v] - E['c']); nn = (V[v] - E['c']) / rv   # the rim stands `ledge` off the eye: the strip goes in to just off it
                mq[v] = len(V) + len(newV); newV.append(E['c'] + nn * (rv - LID['ledge'] + .00015))
    V2 = np.r_[V, np.array(newV)]
    strip = []
    for a_, b_ in oe:
        strip += [[b_, a_, mq[a_]], [b_, mq[a_], mq[b_]]]
    F2 = np.r_[F, np.array(strip, np.int64)]
    lid = np.zeros(len(V2)); lid[len(V):] = 1; lid[rim] = .5
    log('lids: fitted to the eyes; opening %.0f x %.1f mm; margin %d edges' % (2 * LID['a'] * 1e3, (LID['up'] + LID['lo']) * 1e3, len(oe)))
    return V2, F2, lid


def stitch_subdivided(V, F, sel, Vs, Fs):
    """put a subdivided patch back into its mesh: the triangles outside it that share a split edge are split to match"""
    nV = len(V)
    # midpoints were appended in Vs after the first nV entries, keyed by their edge
    e = np.sort(np.r_[F[sel][:, [0, 1]], F[sel][:, [1, 2]], F[sel][:, [2, 0]]], axis=1)
    u = np.unique(e, axis=0); midof = {(int(a), int(b)): nV + i for i, (a, b) in enumerate(u)}
    out = [Fs]; rest = F[~sel]; tri = []
    keep = []
    for f in rest:
        ms = [midof.get((min(f[k], f[(k + 1) % 3]), max(f[k], f[(k + 1) % 3]))) for k in range(3)]
        cnt = sum(m is not None for m in ms)
        if cnt == 0:
            keep.append(f); continue
        # a fan from one of the new midpoints (a fan from a corner next to a split edge would make a flat triangle)
        poly = []
        for k in range(3):
            poly.append(f[k])
            if ms[k] is not None:
                poly.append(ms[k])
        i0 = next(i for i, x in enumerate(poly) if x >= nV); poly = poly[i0:] + poly[:i0]
        for k in range(1, len(poly) - 1):
            tri.append([poly[0], poly[k], poly[k + 1]])
    out.append(np.array(keep, np.int64).reshape(-1, 3))
    if tri:
        out.append(np.array(tri, np.int64))
    return Vs, np.concatenate(out)


def clip(V, F, s, keep_pos, X=None):
    """the part of a mesh where s >= 0 (keep_pos) or s < 0, triangles cut along s = 0 (new vertices exactly on it, shared per edge);
    X: a value per vertex carried along (interpolated on the cut)"""
    sg = s >= 0 if keep_pos else s < 0
    inside = sg[F]; full = inside.all(1); part = inside.any(1) & ~full
    out = [F[full]]; newV = []; newX = []; emap = {}; Xa = np.zeros(len(V)) if X is None else X
    def cutv(i, j):
        k = (min(i, j), max(i, j))
        if k not in emap:
            t = s[i] / (s[i] - s[j]); emap[k] = len(V) + len(newV); newV.append(V[i] + (V[j] - V[i]) * t); newX.append(Xa[i] + (Xa[j] - Xa[i]) * t)
        return emap[k]
    tri = []
    for f in F[part]:
        ins = sg[f]
        # rotate so the pattern starts at a fixed place
        for r in range(3):
            g = np.roll(f, -r); m = sg[g]
            if m[0] and not m[1] and not m[2]:
                a, b, c = g; tri.append([a, cutv(a, b), cutv(a, c)]); break
            if m[0] and m[1] and not m[2]:
                a, b, c = g; ab, ac = cutv(b, c), cutv(a, c); tri += [[a, b, ab], [a, ab, ac]]; break
    if tri:
        out.append(np.array(tri, np.int64))
    V2 = np.r_[V, np.array(newV).reshape(-1, 3)]
    on = np.zeros(len(V2), bool); on[len(V):] = True
    F2 = np.concatenate(out)
    used = np.unique(F2); m = -np.ones(len(V2), np.int64); m[used] = np.arange(len(used))
    X2 = np.r_[Xa, np.array(newX)][used]
    return V2[used], m[F2], on[used], X2


def loop_of(F, on):
    """the boundary loop made of the vertices on the cut, in the order it runs (following the faces' winding)"""
    fe = np.c_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]].reshape(-1, 2)
    be = set(map(tuple, np.sort(boundary_edges(F), axis=1)))
    nxt = {}
    for a, b in fe:
        if on[a] and on[b] and (min(a, b), max(a, b)) in be:
            nxt[a] = b
    loops = []; seen = set()
    for s in nxt:
        if s in seen:
            continue
        L = [s]; seen.add(s); v = nxt[s]
        while v != s and v in nxt and v not in seen:
            L.append(v); seen.add(v); v = nxt[v]
        loops.append(L)
    return max(loops, key=len), len(loops)


def join_neck(HV, HF, lid, BV, BF):
    """the head above the seam and the body below it, joined along one shared line of vertices"""
    hv, hf, hon, hlid = clip(HV, HF, neck_phi(HV), True, lid)
    bv, bf, bon, _ = clip(BV, BF, neck_phi(BV), False)
    lh, nh = loop_of(hf, hon); lb, nb = loop_of(bf, bon)
    log('neck seam: head loop %d vertices (%d loops), body loop %d (%d loops)' % (len(lh), nh, len(lb), nb))
    # the head's cut edge onto the body's (the nearest point of the body's cut line; they are within 2 mm after the fit), the head
    # above it following over 1.5 cm; then the head's edge vertices are put into the body's edge (its triangles there split in fans), so
    # the two share one line of vertices: no strip, no fold, no line round the neck
    lb = np.asarray(lb); a0, a1 = bv[lb], bv[np.roll(lb, -1)]; P = hv[lh]; best = np.zeros_like(P); bd = np.full(len(P), np.inf)
    ek = np.zeros(len(P), int); et = np.zeros(len(P))
    for k in range(len(a0)):
        e = a1[k] - a0[k]; t = np.clip(((P - a0[k]) @ e) / max(e @ e, 1e-20), 0, 1); q = a0[k] + t[:, None] * e; d = np.linalg.norm(P - q, axis=1)
        m = d < bd; bd[m] = d[m]; best[m] = q[m]; ek[m] = k; et[m] = t[m]
    D = best - P; log('   head edge moved onto the body\'s: median %.2f mm, max %.2f mm' % (np.median(bd) * 1e3, bd.max() * 1e3))
    dd, j = cKDTree(P).query(hv, k=4); w = 1 / np.maximum(dd, 1e-6); w /= w.sum(1, keepdims=True)
    fall = np.clip(1 - neck_phi(hv) / .015, 0, 1); fall = fall * fall * (3 - 2 * fall)
    hv = hv + (D[j] * w[:, :, None]).sum(1) * fall[:, None]; hv[lh] = best
    off = len(hv); V = np.r_[hv, bv]
    # head edge vertices at a body vertex (or on top of another): one vertex
    remap = np.arange(len(V)); ins = {k: [] for k in range(len(lb))}; seen = {}
    for i, v in enumerate(lh):
        t = et[i]; k = ek[i]
        if t < 1e-3:
            remap[v] = lb[k] + off; continue
        if t > 1 - 1e-3:
            remap[v] = lb[(k + 1) % len(lb)] + off; continue
        key = (k, round(t, 4))
        if key in seen:
            remap[v] = seen[key]; continue
        seen[key] = v; ins[k].append((t, v))
    # the two edges as one line: each vertex's place along the body's edge (body vertex k at k, a head vertex between). Each edge of either
    # side gets the other side's vertices that lie along it, and the triangle on that edge is fanned from a new vertex at its middle
    nb_ = len(lb); sh = (ek + et) % nb_
    sh[et < 1e-3] = ek[et < 1e-3]; sh[et > 1 - 1e-3] = (ek[et > 1 - 1e-3] + 1) % nb_
    pos = {}
    for k, lst in ins.items():
        if lst:
            a, b = lb[k] + off, lb[(k + 1) % nb_] + off; lst.sort(); pts = [v for _, v in lst]
            pos[(a, b)] = pts; pos[(b, a)] = pts[::-1]
    back = 0
    for i in range(len(lh)):
        j = (i + 1) % len(lh); sa, sb = sh[i], sh[j]; d = (sb - sa + nb_ / 2) % nb_ - nb_ / 2
        back += d < 0
        ks = [int(k) % nb_ for k in (np.arange(np.floor(sa) + 1, np.ceil(sa + d)) if d > 0 else np.arange(np.ceil(sa) - 1, np.floor(sa + d), -1)) if abs(k - sa) > 1e-9 and abs(k - (sa + d)) > 1e-9]
        if ks:
            ha, hb = remap[lh[i]], remap[lh[j]]; pts = [lb[k] + off for k in ks]
            pos[(ha, hb)] = pts; pos[(hb, ha)] = pts[::-1]
    log('   head edge: %d vertices into the body\'s edge, %d of the body\'s into the head\'s; it runs %s along the body\'s' % (
        len(seen), sum(len(v) for k, v in pos.items() if k[0] < off or k[1] < off) // 2, 'back' if back > len(lh) / 2 else 'forward'))
    Fall = np.concatenate([remap[hf], bf + off]); drop = []; fan = []; extra = []
    for ti, (x, y, z) in enumerate(Fall):
        if not ((x, y) in pos or (y, z) in pos or (z, x) in pos):
            continue
        poly = []
        for a, b in ((x, y), (y, z), (z, x)):
            poly += [a] + pos.get((a, b), [])
        c = len(V) + len(extra); extra.append(V[[x, y, z]].mean(0))
        drop.append(ti); fan += [[poly[q], poly[(q + 1) % len(poly)], c] for q in range(len(poly))]
    V = np.r_[V, np.array(extra).reshape(-1, 3)]
    keep = np.ones(len(Fall), bool); keep[drop] = False
    F = np.concatenate([Fall[keep], np.array(fan, np.int64)])
    V, F = compact(V, F); F = F[(F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 2] != F[:, 0])]
    # what came from the head: by position (compact renumbered)
    hset = cKDTree(hv).query(V)[0] < 1e-9
    region = hset.astype(int)   # 1: from the 3.0 head
    lidj = np.zeros(len(V)); d, j = cKDTree(hv).query(V); lidj[hset] = hlid[j[hset]]
    return V, F, region, lidj


def keep_big(V, F, minf):
    n = len(V); k, lab = connected_components(adjacency(F, n), directed=False)
    cnt = np.bincount(lab[F[:, 0]], minlength=k)
    return compact(V, F[cnt[lab[F[:, 0]]] >= minf])


def surface_samples(V, F, step):
    """points spread over the triangles about `step` apart (with the triangle each lies on)"""
    A = np.linalg.norm(fnormals(V, F), axis=1) / 2
    n = np.maximum(1, np.ceil(A / (step * step * .5)).astype(int))
    tri = np.repeat(np.arange(len(F)), n)
    r1, r2 = np.random.default_rng(1).random((2, len(tri)))
    s = np.sqrt(r1); u, v = 1 - s, s * (1 - r2); w = s * r2
    P = V[F[tri, 0]] * u[:, None] + V[F[tri, 1]] * v[:, None] + V[F[tri, 2]] * w[:, None]
    return np.r_[V, P], np.r_[-np.ones(len(V), int), tri]


def fit_head(HV, HF, BV, BF, scale_edges=float(os.environ.get("FIT_LAMBDA", 60))):
    """move the 3.0 head onto the 4.0 surface by a smooth field: each point's offset to the 4.0 surface, smoothed over the mesh
    (a screened Laplacian, about 3 cm), leaving out points whose nearest 4.0 point is at an opening of 4.0's skin (its eye holes) or far"""
    from scipy.sparse import diags
    from scipy.sparse.linalg import cg
    sel = BF[BV[BF][:, :, 1].min(1) > 1.30]
    P, tri = surface_samples(BV, sel, .0006)
    # 4.0's openings: points within 4 mm of a boundary edge of its outer surface
    be = boundary_edges(sel); bp = np.r_[BV[be[:, 0]], BV[be[:, 1]], (BV[be[:, 0]] + BV[be[:, 1]]) / 2]
    near_open = cKDTree(bp).query(P)[0] < .004 if len(bp) else np.zeros(len(P), bool)
    d, i = cKDTree(P).query(HV)
    w = ((d < .015) & ~near_open[i] & (HV[:, 1] > 1.33)).astype(float)
    w *= 1 + 40 * (np.abs(neck_phi(HV)) < .025)   # held hard at the seam round the neck, where the head meets the 4.0 body
    tgt = (P[i] - HV) * w[:, None]
    n = len(HV); A = adjacency(HF, n); L = diags(np.asarray(A.sum(1)).ravel()) - A
    M = (diags(w + 1e-6) + scale_edges * L).tocsr()
    U = np.zeros_like(HV)
    for k in range(3):
        U[:, k], _ = cg(M, tgt[:, k], maxiter=4000, rtol=1e-8)
    log('head fit: %d of %d points matched; offsets median %.2f mm, 95%% %.2f mm, max %.2f mm; left after the fit: median %.2f mm' % (
        (w > 0).sum(), n, np.median(np.linalg.norm(U, axis=1)) * 1e3, np.percentile(np.linalg.norm(U, axis=1), 95) * 1e3, np.linalg.norm(U, axis=1).max() * 1e3,
        np.median(cKDTree(P).query(HV + U)[0][w > 0]) * 1e3))
    seam = (np.abs(neck_phi(HV + U)) < .01) & (w > 0)
    log('   at the seam: %.2f mm median, %.2f mm max' % (np.median(cKDTree(P).query((HV + U)[seam])[0]) * 1e3, cKDTree(P).query((HV + U)[seam])[0].max() * 1e3))
    return HV + U


if __name__ == '__main__':
    main()
