#!/usr/bin/env python3
"""Compact models of the human replication fork's machines, made from measured structures (Protein Data Bank, CC0).

usage: python -I tools/proteins/make_replisome.py <folder with the .cif.gz files> [out folder, default data/proteins]

Downloads (once, into an empty folder of their own):
    for id in 7PFO 8B9D 5EXR 6TNY 6TNZ 7TID 7TIB 7TI8 1A36 1X9N 4GOP 4M8O; do curl -sf https://files.rcsb.org/download/$id.cif.gz -o $id.cif.gz; done

What it writes: data/proteins/rep_<machine>.json, one per machine. Each holds the machine's subunits (name, chain, structure, residues
modelled) and beads: the centroid of the alpha carbons of every `g` consecutive residues of a chain, in a frame of reference tied to the DNA
the machine holds (below), in units of 0.05 nm (0.5 angstrom), as a flat list x, y, z, subunit. The page builds a smooth surface from the
beads (js/replication.js), so the shape is the structure's at a resolution of about 0.6 nm.

Frames (all in nanometres):
  fork machines (helicase CMG, its partners, Pol epsilon's body, Pol alpha-primase) share one frame: origin at the last base pair of the
    parental duplex (the fork), x along that duplex's axis pointing ahead (away from the helicase, the way the fork moves), y chosen so that
    the primase lies on the -y side, z = x cross y.
  machines on a primer end (Pol delta with PCNA, RFC with PCNA, Pol epsilon's polymerase domain): origin on the duplex axis at the primer's
    3' end, x along the axis in the direction of synthesis, y toward the protein's centroid.
  ligase: origin on the axis at the nick, x in the direction of synthesis of the upstream strand; Topo I: origin at the duplex's middle;
  RPA: origin at the middle of the bound single strand, x from its 5' end to its 3' end.

How machines get onto the DNA (anchors used by the page to move them, so that the DNA never passes through solid protein):
  entry: a direction across the DNA axis along which the machine can be slid onto (or off) the DNA it holds without the DNA passing through it,
    found by sliding the structure's own DNA out 14 nm in each direction and counting DNA atoms inside the protein's surface (the same soft
    spheres as the page's surface). Used for Pol delta and FEN1, and for RFC with the PCNA ring held open.
  RFC and PCNA: three measured states of the same yeast complex (Gaubitz et al. 2022): 7TI8 (PCNA held open, no DNA), 7TIB (open, on
    primer-template DNA) and 7TID (closed round it). Each chain's rigid movement from its 7TID place to its 7TI8 and 7TIB places is stored
    (quaternion and shift, in the RFC frame), with 7TIB placed by its DNA on 7TID's and 7TI8 by its RFC on 7TIB's. The human PCNA of 6TNY is
    superposed on the yeast ring so that the clamp drawn being loaded is the human one, opened by the yeast chains' movements.
  jaw: ligase I and topoisomerase I close right round the DNA, so no straight path exists. The page opens them like a jaw: the beads on the
    entry side of the DNA (s = bead . entry > 0.3 nm) swing 90 degrees about a hinge parallel to the DNA axis. The split and the hinge are
    chosen here so that neither the approach nor the closing passes DNA through protein; how these enzymes really open is not measured.
"""
import sys, os, json, math, itertools
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cif

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'proteins')
_cache = {}


def load(pid):
    if pid not in _cache: _cache[pid] = cif.read(os.path.join(SRC, pid + '.cif.gz'))[0]
    return _cache[pid]


def atoms(pid, ch, names=('CA',), het=False):
    r = {}
    for a in load(pid):
        if a['chain'] == ch and a['name'] in names and (het or a['group'] == 'ATOM'):
            try: k = int(a['seq'])
            except ValueError: continue
            r[k] = np.array([a['x'], a['y'], a['z']])
    return r


def nres(pid, ch):
    return len(atoms(pid, ch))


def kabsch(P, Q):   # R, t with R p + t ~ q
    pc, qc = P.mean(0), Q.mean(0); H = (P - pc).T @ (Q - qc); U, S, Vt = np.linalg.svd(H)
    d = np.sign(np.linalg.det(Vt.T @ U.T)); R = Vt.T @ np.diag([1, 1, d]) @ U.T
    return R, qc - R @ pc


def superpose(pa, chains_a, pb, chains_b):
    """transform taking structure pb onto pa, from the alpha carbons of residues numbered alike in the paired chains"""
    P, Q = [], []
    for ca_, cb in zip(chains_a, chains_b):
        a, b = atoms(pa, ca_), atoms(pb, cb)
        for k in a:
            if k in b: P.append(b[k]); Q.append(a[k])
    P, Q = np.array(P), np.array(Q); R, t = kabsch(P, Q)
    rms = float(np.sqrt(((P @ R.T + t - Q) ** 2).sum(1).mean()))
    return R, t, rms, len(P)


def c1(pid, ch):
    return atoms(pid, ch, ("C1'",), het=True)


def duplex_axis(pid, s1, s2):
    """axis of the paired part of two strands: a line through the midpoints of paired C1' atoms (8 to 11.5 angstroms apart)"""
    a, b = c1(pid, s1), c1(pid, s2); mids = []
    for k, p in a.items():
        j = min(b, key=lambda q: np.linalg.norm(b[q] - p)); d = np.linalg.norm(b[j] - p)
        if 8 < d < 11.8: mids.append((p + b[j]) / 2)
    M = np.array(mids); c = M.mean(0); _, _, vt = np.linalg.svd(M - c)
    return c, vt[0], len(mids)


def frame(origin, x, ytoward):
    x = x / np.linalg.norm(x); y = ytoward - np.dot(ytoward, x) * x; y /= np.linalg.norm(y); z = np.cross(x, y)
    return origin, np.array([x, y, z])


def to_local(p, F):
    o, B = F; return B @ (p - o)


def p3(p, F):
    """where the primer's 3'-end nucleotide sits round the duplex axis: its C1' atom's angle from y toward z, in radians, and its distance from the axis in nm"""
    q = to_local(p, F); return [math.atan2(q[2], q[1]), math.hypot(q[1], q[2]) / 10]


def on_axis(c, ax, p):
    return c + np.dot(p - c, ax) * ax


def beads(pid, ch, F, g, R=None, t=None, lo=None, hi=None):
    d = atoms(pid, ch); ks = [k for k in sorted(d) if (lo is None or k >= lo) and (hi is None or k <= hi)]
    out = []
    for i in range(0, len(ks), g):
        grp = ks[i:i + g]; p = np.mean([d[k] for k in grp], 0)
        if R is not None: p = R @ p + t
        out.append(to_local(p, F) / 10.0)   # nm
    return out, len(ks)


def centroid(pid, chains, R=None, t=None):
    P = np.array([p for ch in chains for p in atoms(pid, ch).values()])
    if R is not None: P = P @ R.T + t
    return P.mean(0)


FIELD_R = .62   # the page's soft-sphere radius for these machines (js/replication.js machine())


def field(pts, bl, R=FIELD_R):
    """the page's surface function at points: a sum of soft spheres on the beads; inside the protein where it exceeds 1"""
    out = np.zeros(len(pts))
    for i in range(0, len(bl), 512):
        b = bl[i:i + 512]; d2 = ((pts[:, None, :] - b[None, :, :]) ** 2).sum(2) / (R * R)
        out += np.where(d2 < 4.4, np.exp(-2.2 * (d2 - 1)), 0).sum(1)
    return out


def inside(pts, bl): return int((field(pts, bl) > 1).sum())


def dna_points(pid, chains, F, R=None, t=None):
    P = np.array([[a['x'], a['y'], a['z']] for a in load(pid) if a['chain'] in chains and a['name'] in ("P", "C1'", "C4'", "N1", "N3")])
    if R is not None: P = P @ R.T + t
    return (P - F[0]) @ F[1].T / 10.0


def unit(th): return np.array([0, math.cos(math.radians(th)), math.sin(math.radians(th))])


def entry_dir(bl, dl, step=10):
    """the direction (in the y-z plane) along which the DNA can leave the machine passing through the fewest beads; returns (unit, worst, docked)"""
    best = None
    for th in range(0, 360, step):
        g = unit(th); w = max(inside(dl + g * d, bl) for d in np.arange(.5, 14.01, .5))
        if best is None or w < best[0]: best = (w, th)
    return unit(best[1]), best[0], inside(dl, bl)


def rotx(P, h, ang):
    c, s = math.cos(ang), math.sin(ang); Q = P.copy(); y = P[:, 1] - h[0]; z = P[:, 2] - h[1]
    Q[:, 1] = h[0] + c * y - s * z; Q[:, 2] = h[1] + s * y + c * z; return Q


def jaw_search(bl, dl, step=15, open_deg=90):
    """a jaw for a machine that encircles its DNA: [entry y, entry z, hinge y, hinge z, sign of opening, degrees], and its counts"""
    base = inside(dl, bl); cands = []
    for th in range(0, 360, step):
        g = unit(th); q = np.array([0, -g[2], g[1]]); s = bl @ g; lid = s > .3
        edge = bl[lid & (np.abs(s - .3) < 1.2)]
        if not len(edge): continue
        for side in (1, -1):
            h = (q * side * (edge @ q * side).max() + g * .3)[1:]; a = math.radians(open_deg) * side; rest = bl[~lid]
            appr = max(inside(dl + g * d, np.vstack([rest, rotx(bl[lid], h, a)])) for d in np.arange(.5, 14.01, 1))
            close = max(inside(dl, np.vstack([rest, rotx(bl[lid], h, a * f)])) for f in np.linspace(0, 1, 9))
            if close <= base and appr <= max(1, base / 10): cands.append((int(lid.sum()), appr, th, side, h))
    cands.sort(key=lambda c: (c[0], c[1])); n, appr, th, side, h = cands[0]; g = unit(th)
    return [g[1], g[2], h[0], h[1], side, open_deg], appr, base, n


def quat(R):
    w = math.sqrt(max(0, 1 + R[0, 0] + R[1, 1] + R[2, 2])) / 2; x = math.copysign(math.sqrt(max(0, 1 + R[0, 0] - R[1, 1] - R[2, 2])) / 2, R[2, 1] - R[1, 2])
    y = math.copysign(math.sqrt(max(0, 1 - R[0, 0] + R[1, 1] - R[2, 2])) / 2, R[0, 2] - R[2, 0]); z = math.copysign(math.sqrt(max(0, 1 - R[0, 0] - R[1, 1] + R[2, 2])) / 2, R[1, 0] - R[0, 1])
    return [x, y, z, w]


def local_motion(R, t, F):
    """a rigid movement in the structure's frame (angstroms), expressed in a machine frame (nm): [qx, qy, qz, qw, tx, ty, tz]"""
    o, B = F; Rl = B @ R @ B.T; tl = B @ (R @ o + t - o) / 10.0
    return quat(Rl) + [float(v) for v in tl]


def write(mid, title, parts, anchors, note):
    """parts: list of (name, role, pid, chain, nres, bead list)"""
    flat, subs = [], []
    for i, (name, role, pid, ch, n, bl) in enumerate(parts):
        subs.append({'name': name, 'role': role, 'pdb': pid, 'chain': ch, 'residues': n})
        for p in bl: flat += [int(round(v * 20)) for v in p] + [i]   # 0.05 nm units
    P = np.array([[flat[k], flat[k + 1], flat[k + 2]] for k in range(0, len(flat), 4)]) / 20.0
    ext = (P.max(0) - P.min(0)).round(1).tolist()
    span = float(max(np.linalg.norm(P[i] - P[j]) for i in range(0, len(P), max(1, len(P) // 300)) for j in range(0, len(P), max(1, len(P) // 300))))
    doc = {'id': mid, 'title': title, 'unit': 'nm/20', 'note': note, 'subunits': subs, 'beads': flat,
           'anchors': {k: ([[round(float(v), 3) for v in r] for r in a] if len(a) and hasattr(a[0], '__len__') else [round(float(v), 3) for v in a]) for k, a in anchors.items()}, 'extent_nm': ext, 'span_nm': round(span, 1)}
    path = os.path.join(OUT, 'rep_' + mid + '.json')
    with open(path, 'w') as f: json.dump(doc, f, separators=(',', ':'))
    print(f'{mid:9s} beads {len(flat) // 4:5d}  residues {sum(p[4] for p in parts):6d}  extent {ext} nm  span {span:.1f} nm  {os.path.getsize(path):7d} bytes')
    return doc


def main():
    os.makedirs(OUT, exist_ok=True)
    # ---------------- the fork: 7PFO (human CMG, Pol epsilon body, AND-1, Timeless-Tipin, Claspin, fork DNA) ----------------
    MCM = [str(i) for i in range(2, 8)]
    c, ax, n = duplex_axis('7PFO', 'M', 'N')
    m, nn = c1('7PFO', 'M'), c1('7PFO', 'N')
    # the fork: the paired nucleotide of the lagging-strand template nearest the helicase (N15 pairs with M46)
    j0 = on_axis(c, ax, (nn[15] + m[46]) / 2)
    ring = centroid('7PFO', MCM)
    if np.dot(c - ring, ax) < 0: ax = -ax     # x points from the helicase toward the duplex ahead
    # Pol alpha-primase from 8B9D (human replisome with Pol alpha-primase), placed by its Mcm2-7 onto 7PFO's
    R8, t8, rms8, n8 = superpose('7PFO', MCM, '8B9D', MCM)
    prim = centroid('8B9D', ['O'], R8, t8)
    F = frame(j0, ax, -(prim - j0))            # primase on -y
    print(f'fork frame: duplex pairs {n}; 8B9D onto 7PFO by Mcm2-7: rmsd {rms8:.2f} A over {n8} CA')
    G = 3
    names = {'2': 'Mcm2', '3': 'Mcm3', '4': 'Mcm4', '5': 'Mcm5', '6': 'Mcm6', '7': 'Mcm7', 'C': 'Cdc45', 'D': 'Psf1 (GINS)', 'E': 'Psf2 (GINS)', 'F': 'Psf3 (GINS)', 'G': 'Sld5 (GINS)'}
    roles = {'Mcm': 'one of the six motor subunits of the ring; ATP is bound and used between neighbouring subunits', 'Cdc45': 'binds across the ring and holds it shut with GINS', 'GINS': 'one of four small proteins that, with Cdc45, brace the ring and dock Pol epsilon'}
    parts = []
    for ch, nm in names.items():
        bl, nr = beads('7PFO', ch, F, G); parts.append((nm, roles['Mcm' if nm.startswith('Mcm') else 'Cdc45' if nm == 'Cdc45' else 'GINS'], '7PFO', ch, nr, bl))
    mcmc = to_local(ring, F) / 10
    nC = np.mean([p for ch in MCM for k, p in atoms('7PFO', ch).items() if k < sorted(atoms('7PFO', ch))[len(atoms('7PFO', ch)) // 2]], 0)
    cC = np.mean([p for ch in MCM for k, p in atoms('7PFO', ch).items() if k >= sorted(atoms('7PFO', ch))[len(atoms('7PFO', ch)) // 2]], 0)
    rax = (nC - cC) / np.linalg.norm(nC - cC)
    allm = np.array([p for ch in MCM for p in atoms('7PFO', ch).values()]); pr = (allm - ring) @ rax
    cexit = to_local(ring + pr.min() * rax, F) / 10; nface = to_local(ring + pr.max() * rax, F) / 10
    lead = [to_local(m[k], F) / 10 for k in sorted(m) if k >= 51]   # the leading-strand template inside the channel
    lagN = to_local(nn[15], F) / 10
    anchors = {'ring_centre': mcmc, 'ring_axis_CtoN': F[1] @ rax, 'c_exit': cexit, 'n_face': nface, 'lead_in': lead[0], 'lead_last': lead[-1], 'lag_last': lagN,
               'dna_m': [to_local(m[k], F) / 10 for k in sorted(m)], 'dna_n': [to_local(nn[k], F) / 10 for k in sorted(nn)]}   # the DNA as the structure has it (C1' atoms), for the inside view
    write('cmg', 'CMG helicase (Cdc45, Mcm2-7, GINS)', parts, anchors, '7PFO: human CMG at a fork (Jones et al. 2021)')
    # partners
    parts = []
    for ch, nm, role in [('H', 'AND-1, copy 1', 'AND-1 forms a ring of three copies that links the helicase to Pol alpha-primase'), ('I', 'AND-1, copy 2', 'see copy 1'), ('J', 'AND-1, copy 3', 'see copy 1'),
                         ('K', 'Timeless', 'with Tipin, grips the DNA ahead of the helicase and keeps unwinding and synthesis coupled'), ('L', 'Tipin', 'partner of Timeless'), ('Q', 'Claspin', 'links the helicase to the checkpoint that answers a stalled fork')]:
        bl, nr = beads('7PFO', ch, F, G); parts.append((nm, role, '7PFO', ch, nr, bl))
    write('partners', 'Fork partners: AND-1, Timeless-Tipin and Claspin', parts, {}, '7PFO')
    # Pol epsilon body on the helicase
    parts = []
    for ch, nm, role in [('B', 'POLE1, C-terminal half', 'the inactive copy of the polymerase fold, docked on the helicase; the active half hangs from it on a flexible linker'), ('A', 'POLE2', 'second subunit; binds the helicase\'s GINS')]:
        bl, nr = beads('7PFO', ch, F, G); parts.append((nm, role, '7PFO', ch, nr, bl))
    pole1n = to_local(atoms('7PFO', 'B')[min(atoms('7PFO', 'B'))], F) / 10
    write('pole', 'DNA polymerase epsilon (body on the helicase)', parts, {'linker_start': pole1n}, '7PFO; POLE3 and POLE4 not resolved')
    # Pol alpha-primase: the resolved parts from 8B9D, and the polymerase core and primase large subunit's end from the crystal structure 5EXR,
    # placed by superposing 5EXR's POLA2 and POLA1 C-terminal domain on 8B9D's
    R5, t5, rms5, n5 = superpose('8B9D', ['A', 'B'], '5EXR', ['D', 'C'])
    R5b, t5b = R8 @ R5, R8 @ t5 + t8
    print(f'5EXR onto 8B9D by POLA2 + POLA1 CTD: rmsd {rms5:.2f} A over {n5} CA')
    parts = []
    for ch, nm, role, lo, hi, pid, Rx, tx in [
        ('O', 'PRIM1 (primase)', 'makes the RNA primer', None, None, '8B9D', R8, t8),
        ('P', 'PRIM2, N-terminal part', 'holds the primer\'s start and hands it to the polymerase', None, None, '8B9D', R8, t8),
        ('A', 'POLA2', 'links the complex to AND-1 and the helicase', None, None, '8B9D', R8, t8),
        ('B', 'POLA1, C-terminal domain', 'anchors the polymerase subunit in the complex', None, None, '8B9D', R8, t8),
        ('C', 'POLA1, polymerase core', 'extends the RNA primer with about 20 nucleotides of DNA; no proofreading', 338, 1265, '5EXR', R5b, t5b),
        ('B', 'PRIM2, C-terminal domain', 'binds the template and the primer\'s 5\' end', 256, 460, '5EXR', R5b, t5b)]:
        bl, nr = beads(pid, ch, F, G, Rx, tx, lo, hi); parts.append((nm, role, pid, ch, nr, bl))
    act = to_local(R8 @ np.mean([atoms('8B9D', 'O')[k] for k in (109, 111) if k in atoms('8B9D', 'O')], 0) + t8, F) / 10
    write('pola', 'DNA polymerase alpha-primase', parts, {'primase_site': act}, '8B9D (placed on 7PFO by Mcm2-7) and 5EXR (placed by POLA2)')
    # ---------------- Pol delta with PCNA on a primer end: 6TNY; FEN1 from 6TNZ ----------------
    c, ax, n = duplex_axis('6TNY', 'P', 'T'); pp = c1('6TNY', 'P'); k3 = max(pp)
    if np.dot(pp[k3] - pp[min(pp)], ax) < 0: ax = -ax
    o = on_axis(c, ax, pp[k3]); Fd = frame(o, ax, centroid('6TNY', 'ABCD') - o)
    parts = []
    for ch, nm, role in [('A', 'POLD1 (catalytic)', 'polymerase and proofreading exonuclease'), ('B', 'POLD2', 'scaffold; binds PCNA'), ('C', 'POLD3', 'binds PCNA; a long flexible tail'), ('D', 'POLD4', 'small subunit')]:
        bl, nr = beads('6TNY', ch, Fd, 2); parts.append((nm, role, '6TNY', ch, nr, bl))
    dd = dna_points('6TNY', 'PT', Fd); bl = np.array([b for pt in parts for b in pt[5]])
    ent, w, base = entry_dir(bl, dd); print(f'Pol delta entry {ent.round(2)}: DNA atoms inside {w} (docked {base})')
    exo = to_local(np.mean([atoms('6TNY', 'A')[k] for k in (316, 318)], 0), Fd) / 10   # D316, E318: the exonuclease's catalytic residues (Liu et al. 2017: the proofreading-deficient D316A;E318A)
    write('pold', 'DNA polymerase delta', parts, {'p3': p3(pp[k3], Fd), 'entry': ent, 'exo': exo}, '6TNY (Lancey et al. 2020)')
    parts = []
    for ch, nm in [('E', 'PCNA, subunit 1'), ('F', 'PCNA, subunit 2'), ('G', 'PCNA, subunit 3')]:
        bl, nr = beads('6TNY', ch, Fd, 2); parts.append((nm, 'one of three identical subunits of the ring', '6TNY', ch, nr, bl))
    pc = to_local(centroid('6TNY', 'EFG'), Fd) / 10
    write('pcna', 'PCNA sliding clamp', parts, {'centre': pc}, '6TNY')
    Rf, tf, rmsf, nf = superpose('6TNY', ['E', 'F', 'G'], '6TNZ', ['E', 'F', 'G'])
    print(f'6TNZ onto 6TNY by PCNA: rmsd {rmsf:.2f} A over {nf}')
    bl, nr = beads('6TNZ', 'H', Fd, 2, Rf, tf)
    ent, w, base = entry_dir(np.array(bl), dd); print(f'FEN1 entry {ent.round(2)}: DNA atoms inside {w} (docked {base})')
    write('fen1', 'FEN1 flap endonuclease', [('FEN1', 'cuts the flap of displaced primer', '6TNZ', 'H', nr, bl)], {'entry': ent}, '6TNZ, on the same PCNA as Pol delta')
    # ---------------- RFC loading PCNA on a primer end: 7TID (yeast) ----------------
    c, ax, n = duplex_axis('7TID', 'J', 'I'); pp = c1('7TID', 'J'); k3 = max(pp)
    if np.dot(pp[k3] - pp[min(pp)], ax) < 0: ax = -ax
    o = on_axis(c, ax, pp[k3]); Fr = frame(o, ax, centroid('7TID', 'ABCDE') - o)
    parts = []
    for ch, nm in [('A', 'Rfc1'), ('B', 'Rfc4'), ('C', 'Rfc3'), ('D', 'Rfc2'), ('E', 'Rfc5')]:
        bl, nr = beads('7TID', ch, Fr, 2); parts.append((nm, 'one of five subunits of the loader; ATP is bound between them', '7TID', ch, nr, bl))
    for ch, nm in [('F', 'PCNA, subunit 1'), ('G', 'PCNA, subunit 2'), ('H', 'PCNA, subunit 3')]:
        bl, nr = beads('7TID', ch, Fr, 2); parts.append((nm, 'the clamp being loaded', '7TID', ch, nr, bl))
    # the open states: 7TIB placed on 7TID by its DNA, 7TI8 (no DNA) on 7TIB by RFC
    def dna_atoms(pid):
        return {(a['chain'], a['seq'], a['name']): np.array([a['x'], a['y'], a['z']]) for a in load(pid) if a['chain'] in 'IJ' and a['name'] in ("P", "C1'", "C4'")}
    da, db = dna_atoms('7TID'), dna_atoms('7TIB'); ks = [k for k in da if k in db]
    Rb, tb = kabsch(np.array([db[k] for k in ks]), np.array([da[k] for k in ks]))
    R8, t8, rms8, n8 = superpose('7TIB', list('ABCDE'), '7TI8', list('ABCDE')); R8b, t8b = Rb @ R8, Rb @ t8 + tb
    print(f'7TIB onto 7TID by DNA ({len(ks)} atoms); 7TI8 onto 7TIB by RFC: rmsd {rms8:.2f} A over {n8} CA')
    st = {}
    for key, pid, Rx, tx in [('st_dna', '7TIB', Rb, tb), ('st_open', '7TI8', R8b, t8b)]:
        rows = []
        for ch in 'ABCDEFGH':
            A, Bc = atoms('7TID', ch), atoms(pid, ch); kk = [k for k in A if k in Bc]
            R, t = kabsch(np.array([A[k] for k in kk]), np.array([Bc[k] for k in kk]) @ Rx.T + tx); rows.append(local_motion(R, t, Fr))
        st[key] = rows
    # where the DNA can come in: through the open ring and RFC's gate (7TI8's shape at 7TIB's place)
    bo = np.array([to_local(R8b @ p + t8b, Fr) / 10 for ch in 'ABCDEFGH' for p in [np.mean([atoms('7TI8', ch)[k] for k in sorted(atoms('7TI8', ch))[i:i + 2]], 0) for i in range(0, len(atoms('7TI8', ch)), 2)]])
    dr = dna_points('7TID', 'IJ', Fr); ent, w, base = entry_dir(bo, dr)
    bc = np.array([b for pt in parts for b in pt[5]]); wc = max(inside(dr + ent * d, bc) for d in np.arange(.5, 14.01, .5))
    print(f'RFC entry {ent.round(2)}: DNA atoms inside {w} with PCNA open (docked {base}); {wc} if the ring stayed closed')
    # the human ring (6TNY, in the Pol delta frame) on the yeast ring: which human chain is which, and the transform into the RFC frame
    best = None
    for perm in itertools.permutations('EFG'):   # all six: the human chains' numbering runs the other way round the ring from the yeast's
        Rh, th_, rmsh, nh = superpose('7TID', ['F', 'G', 'H'], '6TNY', list(perm))
        if best is None or rmsh < best[2]: best = (Rh, th_, rmsh, nh, perm)
    Rh, th_, rmsh, nh, perm = best; print(f'6TNY PCNA onto 7TID PCNA: chains {perm} -> F G H, rmsd {rmsh:.2f} A over {nh} CA')
    # human-PCNA local (Pol delta frame) -> RFC local: x_r = B_r (Rh (o_d + B_d^T x_d 10) + th - o_r) / 10
    Mrot = Fr[1] @ Rh @ Fd[1].T; Mt = Fr[1] @ (Rh @ Fd[0] + th_ - Fr[0]) / 10
    hmap = [{'E': 0, 'F': 1, 'G': 2}[c] for c in perm]   # yeast F, G, H -> human subunit index in rep_pcna.json
    anchors = {'pcna_centre': to_local(centroid('7TID', 'FGH'), Fr) / 10, 'p3': p3(pp[k3], Fr), 'entry': ent, 'st_dna': st['st_dna'], 'st_open': st['st_open'],
               'pcna_h': [list(Mrot[0]) + [Mt[0]], list(Mrot[1]) + [Mt[1]], list(Mrot[2]) + [Mt[2]]], 'pcna_h_map': hmap}
    write('rfc', 'RFC clamp loader holding PCNA', parts, anchors, '7TID (Gaubitz et al. 2022), yeast; open states 7TIB and 7TI8 as chain movements')
    # ---------------- Pol epsilon's polymerase domain: 4M8O (yeast), with its incoming dATP ----------------
    c, ax, n = duplex_axis('4M8O', 'P', 'T'); pp = c1('4M8O', 'P'); k3 = max(pp)
    if np.dot(pp[k3] - pp[min(pp)], ax) < 0: ax = -ax
    o = on_axis(c, ax, pp[k3]); Fe = frame(o, ax, centroid('4M8O', 'A') - o)
    bl, nr = beads('4M8O', 'A', Fe, 2)
    write('polecat', 'DNA polymerase epsilon, polymerase domain', [('Pol2, polymerase and exonuclease domain', 'adds nucleotides to the leading strand and proofreads them', '4M8O', 'A', nr, bl)], {'p3': p3(pp[k3], Fe)}, '4M8O (Hogg et al. 2014), yeast')
    dtp = [a for a in load('4M8O') if a['res'] == 'DTP' and a['el'] != 'H']
    nuc = {'atoms': [[a['name'], a['el']] + [round(float(v), 2) for v in to_local(np.array([a['x'], a['y'], a['z']]), Fe)] for a in dtp]}
    with open(os.path.join(OUT, 'rep_dntp.json'), 'w') as f: json.dump(nuc, f, separators=(',', ':'))
    print('dATP atoms', len(dtp))
    # ---------------- DNA ligase I on a nick: 1X9N ----------------
    c, ax, n = duplex_axis('1X9N', 'B', 'D'); up, dn = c1('1X9N', 'B'), c1('1X9N', 'C')
    nick = (up[max(up)] + dn[min(dn)]) / 2
    if np.dot(dn[min(dn)] - up[max(up)], ax) < 0: ax = -ax
    o = on_axis(c, ax, nick); Fl = frame(o, ax, centroid('1X9N', 'A') - o)
    bl, nr = beads('1X9N', 'A', Fl, 2)
    jw, appr, base, nl = jaw_search(np.array(bl), dna_points('1X9N', 'BCD', Fl)); print(f'ligase jaw {np.round(jw, 2).tolist()}: lid {nl} of {len(bl)} beads, DNA atoms inside {appr} on the way in (docked {base})')
    write('lig1', 'DNA ligase I', [('LIG1', 'seals the nick between neighbouring fragments', '1X9N', 'A', nr, bl)], {'p3': p3(up[max(up)], Fl), 'jaw': jw}, '1X9N (Pascal et al. 2004)')
    # ---------------- Topoisomerase I: 1A36 ----------------
    c, ax, n = duplex_axis('1A36', 'B', 'C'); Ft = frame(c, ax, centroid('1A36', 'A') - c)
    bl, nr = beads('1A36', 'A', Ft, 2)
    jw, appr, base, nl = jaw_search(np.array(bl), dna_points('1A36', 'BC', Ft)); print(f'topo I jaw {np.round(jw, 2).tolist()}: lid {nl} of {len(bl)} beads, DNA atoms inside {appr} on the way in (docked {base})')
    write('top1', 'Topoisomerase I', [('TOP1', 'cuts one strand, lets the DNA turn, and joins it again', '1A36', 'A', nr, bl)], {'jaw': jw}, '1A36 (Stewart et al. 1998)')
    # ---------------- RPA on single-stranded DNA: 4GOP (Ustilago maydis) ----------------
    k = c1('4GOP', 'K'); ks = sorted(k); P = np.array([k[q] for q in ks]); cc = P.mean(0); _, _, vt = np.linalg.svd(P - cc); x = vt[0]
    if np.dot(P[-1] - P[0], x) < 0: x = -x
    Fp = frame(cc, x, centroid('4GOP', 'ABC') - cc)
    parts = []
    for ch, nm, role in [('C', 'Rfa1 (RPA70)', 'carries three of the four DNA-binding domains'), ('B', 'Rfa2 (RPA32)', 'one DNA-binding domain'), ('A', 'Rfa3 (RPA14)', 'holds the three together')]:
        bl, nr = beads('4GOP', ch, Fp, 2); parts.append((nm, role, '4GOP', ch, nr, bl))
    ssd = (np.array([to_local(k[q], Fp) for q in ks]) / 10)
    write('rpa', 'RPA single-strand binding protein', parts, {'ss_first': ssd[0], 'ss_last': ssd[-1]}, '4GOP (Fan and Pavletich 2012), Ustilago maydis; chains C, B, A with DNA chain K')
    print('RPA ssDNA span', round(float(np.linalg.norm(ssd[-1] - ssd[0])), 2), 'nm over', len(ks), 'nt')


if __name__ == '__main__':
    main()
