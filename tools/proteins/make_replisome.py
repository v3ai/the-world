#!/usr/bin/env python3
"""Compact models of the human replication fork's machines, made from measured structures (Protein Data Bank, CC0).

usage: python -I tools/proteins/make_replisome.py <folder with the .cif.gz files> [out folder, default data/proteins]

Downloads (once, into an empty folder of their own):
    for id in 7PFO 8B9D 5EXR 6TNY 6TNZ 7TID 1A36 1X9N 4GOP 4M8O; do curl -sf https://files.rcsb.org/download/$id.cif.gz -o $id.cif.gz; done

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
"""
import sys, os, json, math
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
           'anchors': {k: [round(float(v), 3) for v in a] for k, a in anchors.items()}, 'extent_nm': ext, 'span_nm': round(span, 1)}
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
    anchors = {'ring_centre': mcmc, 'ring_axis_CtoN': F[1] @ rax, 'c_exit': cexit, 'n_face': nface, 'lead_in': lead[0], 'lead_last': lead[-1], 'lag_last': lagN}
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
    write('pold', 'DNA polymerase delta', parts, {'p3': p3(pp[k3], Fd)}, '6TNY (Lancey et al. 2020)')
    parts = []
    for ch, nm in [('E', 'PCNA, subunit 1'), ('F', 'PCNA, subunit 2'), ('G', 'PCNA, subunit 3')]:
        bl, nr = beads('6TNY', ch, Fd, 2); parts.append((nm, 'one of three identical subunits of the ring', '6TNY', ch, nr, bl))
    pc = to_local(centroid('6TNY', 'EFG'), Fd) / 10
    write('pcna', 'PCNA sliding clamp', parts, {'centre': pc}, '6TNY')
    Rf, tf, rmsf, nf = superpose('6TNY', ['E', 'F', 'G'], '6TNZ', ['E', 'F', 'G'])
    print(f'6TNZ onto 6TNY by PCNA: rmsd {rmsf:.2f} A over {nf}')
    bl, nr = beads('6TNZ', 'H', Fd, 2, Rf, tf)
    write('fen1', 'FEN1 flap endonuclease', [('FEN1', 'cuts the flap of displaced primer', '6TNZ', 'H', nr, bl)], {}, '6TNZ, on the same PCNA as Pol delta')
    # ---------------- RFC loading PCNA on a primer end: 7TID (yeast) ----------------
    c, ax, n = duplex_axis('7TID', 'J', 'I'); pp = c1('7TID', 'J'); k3 = max(pp)
    if np.dot(pp[k3] - pp[min(pp)], ax) < 0: ax = -ax
    o = on_axis(c, ax, pp[k3]); Fr = frame(o, ax, centroid('7TID', 'ABCDE') - o)
    parts = []
    for ch, nm in [('A', 'Rfc1'), ('B', 'Rfc4'), ('C', 'Rfc3'), ('D', 'Rfc2'), ('E', 'Rfc5')]:
        bl, nr = beads('7TID', ch, Fr, 2); parts.append((nm, 'one of five subunits of the loader; ATP is bound between them', '7TID', ch, nr, bl))
    for ch, nm in [('F', 'PCNA, subunit 1'), ('G', 'PCNA, subunit 2'), ('H', 'PCNA, subunit 3')]:
        bl, nr = beads('7TID', ch, Fr, 2); parts.append((nm, 'the clamp being loaded', '7TID', ch, nr, bl))
    write('rfc', 'RFC clamp loader holding PCNA', parts, {'pcna_centre': to_local(centroid('7TID', 'FGH'), Fr) / 10, 'p3': p3(pp[k3], Fr)}, '7TID (Gaubitz et al. 2022), yeast')
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
    write('lig1', 'DNA ligase I', [('LIG1', 'seals the nick between neighbouring fragments', '1X9N', 'A', nr, bl)], {'p3': p3(up[max(up)], Fl)}, '1X9N (Pascal et al. 2004)')
    # ---------------- Topoisomerase I: 1A36 ----------------
    c, ax, n = duplex_axis('1A36', 'B', 'C'); Ft = frame(c, ax, centroid('1A36', 'A') - c)
    bl, nr = beads('1A36', 'A', Ft, 2)
    write('top1', 'Topoisomerase I', [('TOP1', 'cuts one strand, lets the DNA turn, and joins it again', '1A36', 'A', nr, bl)], {}, '1A36 (Stewart et al. 1998)')
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
