'use strict';
/* ================= DNA REPLICATION AT A HUMAN REPLICATION FORK (REP) =================
   "Show replication" in the DNA scene (BUILD.dna, js/levels_v2.js) shows the machines that copy DNA, at true size beside the helix, working on
   one clock. Their shapes are measured structures from the Protein Data Bank, reduced to beads by tools/proteins/make_replisome.py
   (data/proteins/rep_*.json) and drawn here as smooth surfaces. Everything drawn is a function of the clock, so stepping back works.

   The picture is drawn in the replisome's own frame: the helicase (CMG) stays put and the DNA flows through it, the parent duplex in from +x,
   the copies out to -x. Units: nanometres, in the DNA frame (unit 1 nm).
     - parent duplex ahead of the fork on the x axis; topoisomerase I sits on it ahead of the fork and the stretch between it and the fork turns
       as it feeds in (the swivel; Keszthelyi et al. 2016).
     - leading strand: its template threads the helicase ring (CMG encircles the leading strand: Burgers and Kunkel 2017), runs about 40
       nucleotides to Pol epsilon's active site (same source) and leaves as a continuous duplex.
     - lagging strand: its template is pushed out of the ring, passes the primase, and lies along a line below; there it is made backwards, in
       Okazaki fragments, primed, extended by Pol delta, the primer removed, the nick sealed. While the primase works and the helicase keeps
       unwinding, the single strand between them grows into a loop (the "priming loop", Jones et al. 2023).
   Base pairing uses the app's colours (A green, T red, G yellow, C blue). Times of the steps are chosen for the picture; speeds are measured
   (see the stage list and the note). */
const REP = (() => {
  const PI = Math.PI, TAU2 = 2 * PI;
  const NT = .34, TW = TAU2 / 10.5, OFF = 125 * PI / 180, RB = .8;   // rise per base pair (nm), twist per base pair, angle between the strands' backbones (minor groove), backbone radius
  const V = 680 / 60;           // fork speed, nucleotides per second: mean 0.68 kb per minute in HeLa cells (Guilbaud et al. 2011)
  const L = 168;                // Okazaki fragment drawn: 168 nt, 16 turns of 10.5 bp, so the picture repeats exactly every fragment
  const T = L / V;              // seconds per lagging-strand cycle
  const SLOW = 3;               // shown this many times slower than in the cell
  const VD = 50;                // Pol delta with PCNA at physiological nucleotide levels, nt/s (Burgers and Kunkel 2017)
  const VP = 20;                // priming drawn at 20 nt/s (not measured)
  const NLEAD = 40;             // nt between unwinding and Pol epsilon's active site (Burgers and Kunkel 2017)
  const NRNA = 10, NPRIM = 30, NREM = 12, MERR = 100;   // RNA primer ~10 nt, + ~20 nt of DNA by Pol alpha; nucleotides replaced in primer removal; where the shown error happens
  const SS0 = .25;              // rest spacing of single strand coated with RPA, nm per nucleotide (drawn)
  // the timeline of one Okazaki fragment, seconds from the start of its priming
  const tRna = NRNA / VP, tPrim = NPRIM / VP, tRelax = tPrim + .9;
  const tRfcIn = tRelax, tRfcOn = tRfcIn + .2, tShut = tRfcOn + .4, tRfcOut = tShut + .4;
  const tDin = tRfcOut, tSyn = tDin + .3;
  const tErr = tSyn + (MERR - NPRIM) / VD, tExc = tErr + .25, tFix = tErr + .5;
  const tRem0 = tFix + (L - MERR) / VD, DTREM = .1, tRemEnd = tRem0 + NREM * DTREM, CUT = .06, DRIFT = .7;
  const tOut = tRemEnd + .3, tLigIn = tRemEnd + .15, tLigOn = tLigIn + .2, tSeal = tLigOn + .2, tLigOff = tSeal + .2, tLigGone = tLigOff + .25;
  const IN = .35, PPI = .45;    // seconds a nucleotide is drawn arriving, and its pyrophosphate leaving
  const STAGES = [
    [0, 'Priming', 'Primase, one half of Pol α–primase, starts a new piece of the lagging strand with an RNA primer about 10 nucleotides long, and Pol α adds about 20 nucleotides of DNA to it. The helicase keeps unwinding meanwhile, so the single strand between it and the primase bulges into a loop.'],
    [tPrim, 'Primer released', 'Pol α–primase lets go of the finished primer, and the loop of single strand pays out. Single-strand binding protein (RPA) coats the bare strand so it cannot fold back on itself.'],
    [tRfcIn, 'Clamp loading', 'RFC, the clamp loader, finds the place where the primer ends and threads the ring-shaped clamp PCNA onto the DNA there. Closing the ring needs no ATP to be split; letting go of it does.'],
    [tDin, 'Pol δ binds', 'DNA polymerase δ grips PCNA and the primer’s 3′ end. The ring round the DNA keeps it on, so it can add many nucleotides without falling off.'],
    [tSyn, 'Okazaki fragment', 'Pol δ adds DNA nucleotides to the primer’s 3′ end, about 50 a second, moving away from the fork. A polymerase can only add to a 3′ end, and on this strand the 3′ end points away from the fork: that is why the lagging strand is made backwards, in pieces.'],
    [tErr, 'Proofreading', 'A wrong nucleotide has been added (shown once a fragment; before proofreading it happens about once in 10,000 to 100,000). Pol δ moves the mismatched end to a second site that cuts it off, then adds the right one.'],
    [tFix, 'Reaching the last fragment', 'Pol δ carries on until it runs into the RNA primer at the start of the previous fragment. At the fork the helicase and Pol ε keep going without a break.'],
    [tRem0, 'Primer removal', 'Pol δ pushes into the previous fragment and peels its start off as a short flap, and FEN1 cuts each flap off, a nucleotide or two at a time. When the RNA and a little of Pol α’s DNA have been replaced, one break in the backbone, a nick, is left.'],
    [tRemEnd, 'Ligation', 'DNA ligase I closes the nick with energy from ATP, joining the new fragment to the previous one. The lagging strand is now one continuous strand like the leading one.'],
    [tLigGone, 'The fork moves on', 'The machines leave, and the fork moves on, laying bare more single strand for the next primer. The clamp is left on the DNA; how and when it comes off is not shown.'],
  ];
  const MACH = ['cmg', 'partners', 'pole', 'polecat', 'pola', 'pold', 'pcna', 'rfc', 'fen1', 'lig1', 'top1', 'rpa'];
  const NODE_OF = { cmg: 'rep_cmg', partners: 'rep_fork_partners', pole: 'rep_pol_epsilon', polecat: 'rep_pol_epsilon', pola: 'rep_pol_alpha_primase', pold: 'rep_pol_delta', pcna: 'rep_pcna', rfc: 'rep_rfc', fen1: 'rep_fen1', lig1: 'rep_ligase', top1: 'rep_topo1', rpa: 'rep_rpa' };
  const NAME = { cmg: 'CMG helicase', partners: 'Fork partners: AND-1, Timeless–Tipin, Claspin', pole: 'Pol ε (DNA polymerase epsilon)', polecat: 'Pol ε, polymerase domain', pola: 'Pol α–primase', pold: 'Pol δ (DNA polymerase delta)', pcna: 'PCNA sliding clamp', rfc: 'RFC clamp loader', fen1: 'FEN1 flap endonuclease', lig1: 'DNA ligase I', top1: 'Topoisomerase I', rpa: 'RPA single-strand binding protein' };
  const LABEL = { cmg: 'CMG helicase', partners: 'AND-1, Timeless, Claspin', pole: 'Pol ε', pola: 'Pol α–primase', pold: 'Pol δ', pcna: 'PCNA', rfc: 'RFC', fen1: 'FEN1', lig1: 'Ligase I', top1: 'Topoisomerase I', rpa: 'RPA' };
  /* subunit colours: one hue per machine, its subunits told apart by small steps of tone (inside a machine, by stronger steps) */
  const HUE = { cmg: [0x7fae9f, 0x6f9f92, 0x8dbbaa, 0x76a596, 0x86b4a5, 0x699689, 0xc2a46e, 0xa48fbe, 0x9a86b6, 0xae99c6, 0x947fad], partners: [0x9aa3ad, 0xa3acb6, 0x919aa4, 0xb99a85, 0xcaa98f, 0x8e9dbf],
    pole: [0xcc8a6c, 0xdba184], polecat: [0xcc8a6c], pola: [0xd4b25e, 0xc8a24f, 0xb59f73, 0xd9bd7a, 0xe2c784, 0xbf9a4a], pold: [0x9283c2, 0xa597cf, 0x8274b5, 0xb3a7d6],
    pcna: [0x6e9fd0, 0x5f91c4, 0x7dabd9], rfc: [0x93b874, 0x86ad68, 0xa0c482, 0x7ba25e, 0xadcd90, 0x6e9fd0, 0x5f91c4, 0x7dabd9], fen1: [0xd77f98], lig1: [0xd9a04f], top1: [0x5fb0c4], rpa: [0xc3bfa7, 0xb2ae95, 0xd2cfb9] };
  const DNA = () => (typeof MD !== 'undefined' && MD.on) ? { A: MD.DNA.A, T: MD.DNA.T, G: MD.DNA.G, C: MD.DNA.C, old: MD.DNA.tube, nw: MD.DNA.tubeNew, rna: 0xa98bc4 }
    : { A: 0x4ade80, T: 0xf87171, G: 0xfacc15, C: 0x60a5fa, old: 0xf2c38b, nw: 0x7dd3fc, rna: 0xc4a1f0 };
  const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' }, WRONG = { A: 'G', T: 'C', G: 'A', C: 'T' };
  const SEQ = (() => { const r = rng(1953), s = []; for (let i = 0; i < L; i++) s.push('ATGC'[Math.floor(r() * 4)]); return s; })();   // an invented sequence, repeated every fragment
  const seqA = j => SEQ[((j % L) + L) % L];          // the leading strand's template (the strand the helicase encircles), at chromosome position j
  const seqB = j => COMP[seqA(j)];                   // the lagging strand's template
  const hash = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const sat = x => x < 0 ? 0 : x > 1 ? 1 : x, ease = x => { x = sat(x); return x * x * (3 - 2 * x); };

  /* ---------- paths: a curve through control points, resampled evenly, with frames carried along it (parallel transport) ---------- */
  const DS = .2;
  function Path(max) { this.max = max; this.n = 0; this.P = new Float32Array(max * 3); this.Tg = new Float32Array(max * 3); this.N = new Float32Array(max * 3); this.B = new Float32Array(max * 3); this.len = 0; this._d = new Float32Array(4096 * 4); }
  Path.prototype.build = function (C, fromEnd, n0) {   // C: control points [x,y,z,...]; frames start at the start (or at the end, fromEnd) with normal n0 (or any)
    const m = C.length / 3, S = 48, d = this._d; let k = 0, len = 0, px = 0, py = 0, pz = 0;
    for (let s = 0; s < m - 1; s++) for (let i = 0; i < S || (s === m - 2 && i === S); i++) {
      const u = i / S, a = Math.max(0, s - 1) * 3, b = s * 3, c = (s + 1) * 3, e = Math.min(m - 1, s + 2) * 3, u2 = u * u, u3 = u2 * u;
      const w0 = -.5 * u3 + u2 - .5 * u, w1 = 1.5 * u3 - 2.5 * u2 + 1, w2 = -1.5 * u3 + 2 * u2 + .5 * u, w3 = .5 * u3 - .5 * u2;
      const x = w0 * C[a] + w1 * C[b] + w2 * C[c] + w3 * C[e], y = w0 * C[a + 1] + w1 * C[b + 1] + w2 * C[c + 1] + w3 * C[e + 1], z = w0 * C[a + 2] + w1 * C[b + 2] + w2 * C[c + 2] + w3 * C[e + 2];
      if (k) len += Math.hypot(x - px, y - py, z - pz);
      d[k * 4] = x; d[k * 4 + 1] = y; d[k * 4 + 2] = z; d[k * 4 + 3] = len; px = x; py = y; pz = z; k++; if (k >= 4096) break;
    }
    const n = Math.min(this.max, Math.floor(len / DS) + 1); this.n = n; this.len = (n - 1) * DS; const P = this.P;
    for (let i = 0, q = 0; i < n; i++) {
      const s = i * DS; while (q < k - 2 && d[(q + 1) * 4 + 3] < s) q++;
      const s0 = d[q * 4 + 3], s1 = d[(q + 1) * 4 + 3], f = s1 > s0 ? (s - s0) / (s1 - s0) : 0;
      for (let c = 0; c < 3; c++) P[i * 3 + c] = d[q * 4 + c] + (d[(q + 1) * 4 + c] - d[q * 4 + c]) * f;
    }
    const Tg = this.Tg, N = this.N, B = this.B;
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1) * 3, b = Math.min(n - 1, i + 1) * 3; let x = P[b] - P[a], y = P[b + 1] - P[a + 1], z = P[b + 2] - P[a + 2]; const l = Math.hypot(x, y, z) || 1; Tg[i * 3] = x / l; Tg[i * 3 + 1] = y / l; Tg[i * 3 + 2] = z / l; }
    const i0 = fromEnd ? n - 1 : 0, st = fromEnd ? -1 : 1;
    let nx = n0 ? n0[0] : 0, ny = n0 ? n0[1] : 0, nz = n0 ? n0[2] : 1;
    for (let it = 0, i = i0; it < n; it++, i += st) {
      const tx = Tg[i * 3], ty = Tg[i * 3 + 1], tz = Tg[i * 3 + 2], dd = nx * tx + ny * ty + nz * tz;
      nx -= dd * tx; ny -= dd * ty; nz -= dd * tz; let l = Math.hypot(nx, ny, nz);
      if (l < 1e-4) { nx = -ty; ny = tx; nz = 0; l = Math.hypot(nx, ny, nz) || 1; if (l < 1e-4) { nx = 0; ny = -tz; nz = ty; l = Math.hypot(ny, nz); } }
      nx /= l; ny /= l; nz /= l; N[i * 3] = nx; N[i * 3 + 1] = ny; N[i * 3 + 2] = nz;
      B[i * 3] = ty * nz - tz * ny; B[i * 3 + 1] = tz * nx - tx * nz; B[i * 3 + 2] = tx * ny - ty * nx;
    }
    return this;
  };
  /* position and frame at arc length s (beyond the ends: straight on) into o = {p, t, n, b} (Float arrays of 3) */
  Path.prototype.at = function (s, o) {
    const n = this.n, f = s / DS; let i = Math.floor(f); if (i < 0) i = 0; if (i > n - 2) i = n - 2; const r = f - i, P = this.P;
    for (let c = 0; c < 3; c++) { const a = i * 3 + c; o.p[c] = P[a] + (P[a + 3] - P[a]) * r; o.t[c] = this.Tg[a] + (this.Tg[a + 3] - this.Tg[a]) * (r < 0 ? 0 : r > 1 ? 1 : r); o.n[c] = this.N[a] + (this.N[a + 3] - this.N[a]) * (r < 0 ? 0 : r > 1 ? 1 : r); o.b[c] = this.B[a] + (this.B[a + 3] - this.B[a]) * (r < 0 ? 0 : r > 1 ? 1 : r); }
    return o;
  };
  const fr = () => ({ p: new Float32Array(3), t: new Float32Array(3), n: new Float32Array(3), b: new Float32Array(3) });

  /* ---------- smooth surfaces from the beads (a sum of soft spheres, cut at one level: surface nets) ---------- */
  function surface(D, opts) {
    const bd = D.beads, h = opts.h || .5, R = opts.R || .75, keep = opts.keep, col = opts.cols, K = 2.2, cut = 2.1 * R;
    const pts = []; for (let i = 0; i < bd.length; i += 4) { const s = bd[i + 3]; if (keep && !keep(s)) continue; pts.push(bd[i] / 20, bd[i + 1] / 20, bd[i + 2] / 20, s); }
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < pts.length; i += 4) { x0 = Math.min(x0, pts[i]); y0 = Math.min(y0, pts[i + 1]); z0 = Math.min(z0, pts[i + 2]); x1 = Math.max(x1, pts[i]); y1 = Math.max(y1, pts[i + 1]); z1 = Math.max(z1, pts[i + 2]); }
    x0 -= cut + h; y0 -= cut + h; z0 -= cut + h;
    const nx = Math.ceil((x1 + cut + h - x0) / h) + 1, ny = Math.ceil((y1 + cut + h - y0) / h) + 1, nz = Math.ceil((z1 + cut + h - z0) / h) + 1, NN = nx * ny * nz;
    const F = new Float32Array(NN), best = new Float32Array(NN), own = new Int16Array(NN).fill(-1), id = (i, j, k) => (k * ny + j) * nx + i, r = Math.ceil(cut / h);
    for (let q = 0; q < pts.length; q += 4) {
      const px = pts[q], py = pts[q + 1], pz = pts[q + 2], ci = Math.round((px - x0) / h), cj = Math.round((py - y0) / h), ck = Math.round((pz - z0) / h);
      for (let k = Math.max(0, ck - r); k <= Math.min(nz - 1, ck + r); k++) for (let j = Math.max(0, cj - r); j <= Math.min(ny - 1, cj + r); j++) for (let i = Math.max(0, ci - r); i <= Math.min(nx - 1, ci + r); i++) {
        const dx = x0 + i * h - px, dy = y0 + j * h - py, dz = z0 + k * h - pz, d2 = (dx * dx + dy * dy + dz * dz) / (R * R); if (d2 > 4.4) continue;
        const w = Math.exp(-K * (d2 - 1)), c = id(i, j, k); F[c] += w; if (w > best[c]) { best[c] = w; own[c] = pts[q + 3]; }
      }
    }
    const vid = new Int32Array(NN).fill(-1), pos = [], colA = [], idx = [], E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], cc = new THREE.Color();
    const corner = (i, j, k, c) => id(i + (c & 1), j + (c >> 1 & 1), k + (c >> 2 & 1));
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      let mask = 0; for (let c = 0; c < 8; c++) if (F[corner(i, j, k, c)] > 1) mask |= 1 << c;
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, ne = 0;
      for (const [a, b] of E) { const fa = F[corner(i, j, k, a)] - 1, fb = F[corner(i, j, k, b)] - 1; if ((fa > 0) === (fb > 0)) continue; const t = fa / (fa - fb);
        sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += (a >> 1 & 1) + ((b >> 1 & 1) - (a >> 1 & 1)) * t; sz += (a >> 2 & 1) + ((b >> 2 & 1) - (a >> 2 & 1)) * t; ne++; }
      const vx = i + sx / ne, vy = j + sy / ne, vz = k + sz / ne; vid[id(i, j, k)] = pos.length / 3; pos.push(x0 + vx * h, y0 + vy * h, z0 + vz * h);
      let o = own[id(Math.round(vx), Math.round(vy), Math.round(vz))]; if (o < 0) { let bw = -1; for (let c = 0; c < 8; c++) { const q = corner(i, j, k, c); if (best[q] > bw) { bw = best[q]; o = own[q]; } } }
      cc.setHex(col[Math.max(0, o) % col.length]); colA.push(cc.r, cc.g, cc.b);
    }
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const inside = F[id(i, j, k)] > 1;
      for (let ax = 0; ax < 3; ax++) {
        const i2 = i + (ax === 0), j2 = j + (ax === 1), k2 = k + (ax === 2); if (i2 >= nx || j2 >= ny || k2 >= nz) continue;
        if ((F[id(i2, j2, k2)] > 1) === inside) continue;
        let q; if (ax === 0) q = [id(i, j - 1, k - 1), id(i, j, k - 1), id(i, j, k), id(i, j - 1, k)]; else if (ax === 1) q = [id(i - 1, j, k - 1), id(i - 1, j, k), id(i, j, k), id(i, j, k - 1)]; else q = [id(i - 1, j - 1, k), id(i, j - 1, k), id(i, j, k), id(i - 1, j, k)];
        const v = q.map(c => vid[c]); if (v.some(x => x < 0)) continue;
        if (inside) idx.push(v[0], v[1], v[2], v[0], v[2], v[3]); else idx.push(v[0], v[2], v[1], v[0], v[3], v[2]);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3)); g.setIndex(idx);
    // outward normals: if most faces point inward, flip them all
    let s = 0; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    for (let f = 0; f < idx.length; f += 3) { const a = idx[f] * 3, b = idx[f + 1] * 3, c = idx[f + 2] * 3; const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
      s += (uy * wz - uz * wy) * (pos[a] - cx) + (uz * wx - ux * wz) * (pos[a + 1] - cy) + (ux * wy - uy * wx) * (pos[a + 2] - cz); }
    if (s < 0) { for (let f = 0; f < idx.length; f += 3) { const t = idx[f + 1]; idx[f + 1] = idx[f + 2]; idx[f + 2] = t; } g.setIndex(idx); }
    g.computeVertexNormals(); g.computeBoundingSphere(); return g;
  }

  /* ---------- state ---------- */
  const S = { on: false, built: false, loading: null, D: {}, c: null, F: null, clk: 0, play: true, stage: -1, root: null, procI: -1, dirty: true, hide: null, blurb0: '', r1: 0, rad: 0 };
  const M = {};                 // machine meshes
  let DR = null;                // instanced DNA
  const FILES = ['cmg', 'partners', 'pole', 'polecat', 'pola', 'pold', 'pcna', 'rfc', 'fen1', 'lig1', 'top1', 'rpa'];
  function load() {
    if (S.loading) return S.loading;
    S.loading = Promise.all(FILES.map(f => getJSON('data/proteins/rep_' + f + '.json').then(d => { S.D[f] = d; })).concat(getJSON('data/proteins/rep_dntp.json').then(d => { S.D.dntp = d; })));
    return S.loading;
  }
  const v3 = a => new V3(a[0], a[1], a[2]);

  /* ---------- the layout (nm, the fork frame of tools/proteins/make_replisome.py) ---------- */
  const G = {};
  function layout() {
    const A = S.D.cmg.anchors, rax = v3(A.ring_axis_CtoN).normalize();
    G.rax = rax; G.PE = v3(A.c_exit).addScaledVector(rax, -12.5);   // Pol epsilon's active site 12.5 nm beyond the exit of the ring (110 to 140 angstroms: Jones et al. 2021)
    G.phi0 = -37 * PI / 180;                                         // the fork's base pair: the leading template's backbone toward the ring's entry
    const bA = [0, RB * Math.cos(G.phi0), RB * Math.sin(G.phi0)], bB = [0, RB * Math.cos(G.phi0 + OFF), RB * Math.sin(G.phi0 + OFF)];
    G.lead = new Path(400).build([...bA, ...A.lead_in, ...A.lead_last, ...A.c_exit, G.PE.x, G.PE.y, G.PE.z]);
    const pe = G.PE, q1 = pe.clone().addScaledVector(rax, -6);
    G.leadD = new Path(1400).build([pe.x, pe.y, pe.z, q1.x, q1.y, q1.z, -31, 19.5, -.6, -46, 22, -.2, -70, 22.5, 0, -260, 22.5, 0], false, [0, 0, 1]);
    G.prim = v3(S.D.pola.anchors.primase_site);
    G.lagB = new Path(1600).build([G.prim.x, G.prim.y, G.prim.z, 6.2, -12, 2, 7.2, -19, 3, 3.5, -25.5, 2, -4, -29.8, .5, -12, -30.8, 0, -24, -31, 0, -260, -31, 0], false, [0, 0, 1]);
    G.lenB = arcNear(G.lagB, -12, -30.8);   // where the single strand reaches the line the copies lie on
    G.lagA = new Path(600); G.bA = bB; G.bulgeN = new V3(.75, -.25, -.62).normalize();
    G.lenA = []; for (let i = 0; i <= 200; i++) G.lenA.push(buildA(i * .1).len);   // arc length of the loop's path for each bulge
    G.nA0 = Math.round(G.lenA[0] / SS0); G.nB0 = Math.round(G.lenB / SS0); G.Dc = G.nA0 + G.nB0;
    // the polymerase domain of Pol epsilon: on the active site, synthesis toward the helicase (rax); its body turned up, away from the rest
    const X = rax, up = new V3(0, 1, 0), Y0 = up.clone().addScaledVector(X, -up.dot(X)).normalize();
    G.peX = X; G.peY = Y0; G.peZ = new V3().crossVectors(X, Y0);
    // the leading duplex's twist is fixed so that its backbone meets the model's at the primer end (its 3' nucleotide's angle in the model frame)
    const f = fr(); G.leadD.at(0, f); const n = v3(f.n), b = v3(f.b);   // frame of the leading duplex at the active site; its tangent is -X
    const nP = n, bP = b.clone().negate();                              // the same in the polymerase's frame (x = X): (n, -b)
    const aY = Math.atan2(Y0.dot(bP), Y0.dot(nP)), aNewP = S.D.polecat.anchors.p3[0] + aY;   // the model's 3' nucleotide angle, carried into (nP, bP)
    G.cLead = -aNewP - OFF;                                              // template angle at the active site, in the duplex's own frame
    G.topoRoll = 0;
  }
  function arcNear(P, x, y) { let best = 0, bd = Infinity; for (let i = 0; i < P.n; i++) { const d = Math.hypot(P.P[i * 3] - x, P.P[i * 3 + 1] - y); if (d < bd) { bd = d; best = i; } } return best * DS; }
  const _cA = new Float32Array(15), _wA = [0, .55, 1, .55, 0], _fA0 = fr();
  function buildA(beta) {   // the stretch from the fork to the primase: nearly straight at rest, a loop when it holds more single strand
    const a = G.bA, p = G.prim, N = G.bulgeN, cx = p.x - a[0], cy = p.y - a[1], cz = p.z - a[2];
    for (let i = 0; i < 5; i++) { const f = i / 4 + (i - 2) * .022 * beta * _wA[i], w = beta * _wA[i];
      _cA[i * 3] = a[0] + cx * f + N.x * w; _cA[i * 3 + 1] = a[1] + cy * f + N.y * w; _cA[i * 3 + 2] = a[2] + cz * f + N.z * w; }
    G.lagB.at(0, _fA0);
    return G.lagA.build(_cA, true, _fA0.n);   // its frames are carried back from the primase, so a duplex passing from it onto the next stretch keeps its twist
  }
  function betaFor(len) { const t = G.lenA; if (len <= t[0]) return 0; for (let i = 1; i < t.length; i++) if (t[i] >= len) return (i - 1 + (len - t[i - 1]) / (t[i] - t[i - 1])) * .1; return (t.length - 1) * .1; }

  /* ---------- what is made when: the lagging strand ---------- */
  const tMade = m => m < NPRIM ? (m + .5) / VP : m < MERR ? tSyn + (m - NPRIM + .5) / VD : m === MERR ? tFix : m < L ? tFix + (m - MERR) / VD : tRem0 + (m - L) * DTREM;
  const jp = k => k * L - G.nA0;    // template position (chromosome) of fragment k's first nucleotide
  /* the partner of lagging template j at time t: 0 none; 1 RNA; 2 DNA (Pol alpha); 3 DNA (Pol delta); 4 a wrong nucleotide. Sets LP.own (fragment), LP.flap (0, or the time since displaced) */
  const LP = { own: 0, m: 0, flap: -1, cut: -1 };
  function lagPartner(j, t) {
    const k = Math.ceil((j + G.nA0) / L), m = jp(k) - j, dt = t - k * T; LP.own = k; LP.m = m; LP.flap = -1; LP.cut = -1;
    if (m < NREM) {
      const tD = T + tRem0 + m * DTREM;
      if (dt >= tD) { LP.own = k + 1; if (dt < tD + CUT) LP.flap = dt - tD; else if (dt < tD + CUT + DRIFT) LP.cut = dt - tD - CUT; return 3; }
      return dt >= tMade(m) ? (m < NRNA ? 1 : 2) : 0;
    }
    if (m === MERR) return dt >= tFix ? 3 : (dt >= tErr && dt < tExc ? 4 : 0);
    return dt >= tMade(m) ? (m < NPRIM ? 2 : 3) : 0;
  }
  /* how much single strand the loop between the helicase and the primase holds, nucleotides */
  function nA(t) {
    const k = Math.floor(t / T), dt = t - k * T, E = (V + VP) * tPrim;
    if (dt < tPrim) return G.nA0 + (V + VP) * dt;
    if (dt < tRelax) return G.nA0 + E * (1 - ease((dt - tPrim) / (tRelax - tPrim)));
    return G.nA0;
  }
  /* where Pol delta's 3' end is, as a nucleotide count from its fragment's start (fractional), or -1 when it is not on the DNA */
  function polDm(dt) {
    if (dt < tDin || dt > tOut + .3) return -1;
    if (dt < tSyn) return NPRIM - .5;
    if (dt < tErr) return NPRIM - .5 + (dt - tSyn) * VD;
    if (dt < tFix) return MERR + (dt < tExc ? .5 : -.5) - (dt > tErr + .08 && dt < tExc + .1 ? .9 * Math.sin(PI * sat((dt - tErr - .08) / (tExc + .1 - tErr - .08))) : 0);   // the mismatched end slips back toward the proofreading site, then returns
    if (dt < tRem0) return MERR + .5 + (dt - tFix) * VD;
    if (dt < tRemEnd) return L - .5 + (dt - tRem0) / DTREM;
    return L + NREM - .5;
  }

  /* ---------- instanced DNA ---------- */
  function makeDR(F) {
    const C = DNA(), mk = (geo, color, cap, ud) => { const m = new THREE.InstancedMesh(geo, smat(color, { kind: 'plastic', roughness: .45 }), cap); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; if (ud) { m.userData = ud; F.pickables.push(m); } S.root.add(m); m._n = 0; m._prev = 0; return m; };
    const bead = new THREE.IcosahedronGeometry(1, 0), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const d = {
      bead: { o: mk(bead, C.old, 1600, { id: 'rep_template', node: 'rep_template', title: 'Parent strand (the template)', priority: .8 }), n: mk(bead, C.nw, 1100, { id: 'rep_newdna', node: 'rep_okazaki', title: 'New DNA strand', priority: .8 }), r: mk(bead, C.rna, 80, { id: 'rep_primer', node: 'rep_rna_primer', title: 'RNA primer', priority: .9 }) },
      base: {}, link: { o: mk(cyl, C.old, 1600), n: mk(cyl, C.nw, 1100), r: mk(cyl, C.rna, 80) },
    };
    for (const k of 'ATGC') d.base[k] = mk(box, C[k], 900, { id: 'base_' + k, priority: .7 });
    d.bead.n.userData.infoFn = null; d.bead.n.userData.role = new Uint8Array(1100);   // which new strand each bead is: 0 leading, 1 lagging
    d.all = [d.bead.o, d.bead.n, d.bead.r, d.link.o, d.link.n, d.link.r, d.base.A, d.base.T, d.base.G, d.base.C];
    return d;
  }
  function put16(m, a, b, c, d, e, f, g, h, i, x, y, z) {   // one instance's matrix: columns (a b c), (d e f), (g h i), translation
    if (m._n >= m.instanceMatrix.count) return -1; const o = m._n * 16, A = m.instanceMatrix.array;
    A[o] = a; A[o + 1] = b; A[o + 2] = c; A[o + 3] = 0; A[o + 4] = d; A[o + 5] = e; A[o + 6] = f; A[o + 7] = 0; A[o + 8] = g; A[o + 9] = h; A[o + 10] = i; A[o + 11] = 0; A[o + 12] = x; A[o + 13] = y; A[o + 14] = z; A[o + 15] = 1;
    return m._n++;
  }
  const BEAD = .27, BASEW = .34, BASET = .13, LINK = .1;
  function bead(m, x, y, z, s) { s = BEAD * (s === undefined ? 1 : s); return put16(m, s, 0, 0, 0, s, 0, 0, 0, s, x, y, z); }
  function link(m, ax, ay, az, bx, by, bz) {
    let dx = bx - ax, dy = by - ay, dz = bz - az; const l = Math.hypot(dx, dy, dz); if (l < 1e-3 || l > 3) return;
    dx /= l; dy /= l; dz /= l; let px = -dy, py = dx, pz = 0, pl = Math.hypot(px, py); if (pl < .1) { px = 0; py = -dz; pz = dy; pl = Math.hypot(py, pz); } px /= pl; py /= pl; pz /= pl;
    const qx = dy * pz - dz * py, qy = dz * px - dx * pz, qz = dx * py - dy * px;
    put16(m, px * LINK, py * LINK, pz * LINK, dx * l, dy * l, dz * l, qx * LINK, qy * LINK, qz * LINK, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  }
  function base(letter, ax, ay, az, bx, by, bz, tx, ty, tz, s) {   // a slab from the backbone (a) toward its partner (b); its thin side along the axis (t)
    const m = DR.base[letter]; let dx = bx - ax, dy = by - ay, dz = bz - az; const l = Math.hypot(dx, dy, dz); if (l < 1e-3) return -1; dx /= l; dy /= l; dz /= l;
    let px = dy * tz - dz * ty, py = dz * tx - dx * tz, pz = dx * ty - dy * tx, pl = Math.hypot(px, py, pz); if (pl < 1e-3) { px = -dy; py = dx; pz = 0; pl = Math.hypot(px, py) || 1; } px /= pl; py /= pl; pz /= pl;
    const zx = py * dz - pz * dy, zy = pz * dx - px * dz, zz = px * dy - py * dx;   // the slab's thin side: across both, close to the helix axis
    s = s === undefined ? 1 : s; const w = BASEW * s, th = BASET * s;
    return put16(m, px * w, py * w, pz * w, dx * l, dy * l, dz * l, zx * th, zy * th, zz * th, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  }
  const PAIRS = [];   // the base pairs drawn this frame that the tests may sample: [template letter, partner letter, base mesh of the template, its instance, base mesh of the partner, its instance]
  function finishDR() {
    for (const m of DR.all) {
      const n = m._n; if (n < m._prev) { const A = m.instanceMatrix.array; for (let i = n * 16; i < m._prev * 16; i++) A[i] = 0; }
      m.count = Math.max(n, 1); if (n === 0) { const A = m.instanceMatrix.array; for (let i = 0; i < 16; i++) A[i] = 0; }
      m._prev = n; m.instanceMatrix.needsUpdate = true; m._n = 0;
    }
  }

  /* ---------- machines ---------- */
  function machine(id, h, opts) {
    const D = S.D[id], g = surface(D, { h: h || .55, R: id === 'cmg' || id === 'partners' || id === 'pola' || id === 'pole' ? .78 : .62, cols: HUE[id], keep: opts && opts.keep });
    return g;
  }
  function meshFor(F, id, geo, label) {
    const m = new THREE.Mesh(geo, smat(0xffffff, { vertexColors: true, kind: 'plastic', roughness: .62 }));
    m.matrixAutoUpdate = false; m.userData = { id: 'rep_' + id, node: NODE_OF[id], title: NAME[id], priority: 1.2, lookInside: h => enter(id, h) };
    S.root.add(m); F.pickables.push(m); M[id] = m;
    if (label) { geo.computeBoundingBox(); const bb = geo.boundingBox, a = new THREE.Object3D(); a.position.set((bb.min.x + bb.max.x) / 2, bb.max.y + .6, (bb.min.z + bb.max.z) / 2); m.add(a); a.userData = m.userData; a.matrixAutoUpdate = true; F.label(a, label, { pick: m }); }
    return m;
  }
  function instFor(F, id, geo, cap) {
    const m = new THREE.InstancedMesh(geo, smat(0xffffff, { vertexColors: true, kind: 'plastic', roughness: .62 }), cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; m._n = 0; m._prev = 0;
    m.userData = { id: 'rep_' + id, node: NODE_OF[id], title: NAME[id], priority: 1.1, lookInside: h => enter(id, h) }; S.root.add(m); F.pickables.push(m); M[id] = m; return m;
  }
  const _X = new V3(), _Y = new V3(), _Z = new V3(), _O = new V3(), _m4 = new THREE.Matrix4();
  function setPose(m, o, X, Y, Z, show) {
    if (!show) { if (m.visible) m.visible = false; return; }
    m.visible = true; m.matrix.set(X.x, Y.x, Z.x, o.x, X.y, Y.y, Z.y, o.y, X.z, Y.z, Z.z, o.z, 0, 0, 0, 1); m.matrixWorldNeedsUpdate = true;
  }
  function putInst(m, o, X, Y, Z, s) {
    if (m._n >= m.instanceMatrix.count) return; s = s === undefined ? 1 : s; const A = m.instanceMatrix.array, q = m._n * 16;
    A[q] = X.x * s; A[q + 1] = X.y * s; A[q + 2] = X.z * s; A[q + 3] = 0; A[q + 4] = Y.x * s; A[q + 5] = Y.y * s; A[q + 6] = Y.z * s; A[q + 7] = 0; A[q + 8] = Z.x * s; A[q + 9] = Z.y * s; A[q + 10] = Z.z * s; A[q + 11] = 0; A[q + 12] = o.x; A[q + 13] = o.y; A[q + 14] = o.z; A[q + 15] = 1; m._n++;
  }
  function finishInst(m) { const n = m._n; if (n < m._prev) m.instanceMatrix.array.fill(0, n * 16, m._prev * 16); m.count = n; m._prev = n; m._n = 0; m.instanceMatrix.needsUpdate = true; m.visible = n > 0; }

  /* the incoming nucleotide (the dATP of 4M8O, as bound in Pol epsilon's active site) and the pyrophosphate it leaves behind */
  function dntpGeos() {
    const at = S.D.dntp.atoms, PPI_AT = new Set(['O3A', 'PB', 'O1B', 'O2B', 'O3B', 'PG', 'O1G', 'O2G', 'O3G']), SUG = /'|^P|^O[12]A$|^O5/;
    const parts = { base: [], sug: [], ppi: [] }; let cx = 0, cy = 0, cz = 0; at.forEach(a => { cx += a[2]; cy += a[3]; cz += a[4]; }); cx /= at.length; cy /= at.length; cz /= at.length;
    G.dntpC = new V3(cx / 10, cy / 10, cz / 10);   // its centre, in the polymerase's primer-end frame (nm)
    const C = DNA(), CPK = (typeof MD !== 'undefined' && MD.on) ? { P: MD.CPK.P, O: MD.CPK.O, C: MD.CPK.C, N: MD.CPK.N } : { P: 0xff8c1a, O: 0xff3030, C: 0x9aa0a6, N: 0x3a5cff };
    at.forEach(a => { const k = PPI_AT.has(a[0]) ? 'ppi' : SUG.test(a[0]) ? 'sug' : 'base'; parts[k].push(a); });
    const geo = (list, colorOf) => { const g0 = new THREE.IcosahedronGeometry(1, 0), P = g0.attributes.position, pos = [], col = [], c = new THREE.Color();
      list.forEach(a => { const r = (a[1] === 'P' ? .19 : a[1] === 'O' ? .15 : .16); c.setHex(colorOf(a)); for (let i = 0; i < P.count; i++) { pos.push(a[2] / 10 - cx / 10 + P.getX(i) * r, a[3] / 10 - cy / 10 + P.getY(i) * r, a[4] / 10 - cz / 10 + P.getZ(i) * r); col.push(c.r, c.g, c.b); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g; };
    return { base: geo(parts.base, () => 0xffffff), sug: geo(parts.sug, a => a[1] === 'P' ? CPK.P : a[1] === 'O' ? CPK.O : C.old), ppi: geo(parts.ppi, a => a[1] === 'P' ? CPK.P : CPK.O) };
  }

  /* ---------- build (once, the first time replication is shown) ---------- */
  function build() {
    const F = S.F; S.root = new THREE.Group(); S.root.visible = false; F.add(S.root);
    if (!(typeof MD !== 'undefined' && MD.on)) {   // the drawn look: a light of their own for the machines (the realistic look lights every scene itself)
      S.root.add(new THREE.HemisphereLight(0xe6eefc, 0x3a3446, .3)); const dl = new THREE.DirectionalLight(0xffffff, .3); dl.position.set(-.3, .5, 1); S.root.add(dl); }
    layout(); DR = makeDR(F);
    for (const id of ['cmg', 'partners', 'pole', 'pola']) { const m = meshFor(F, id, machine(id), LABEL[id]); m.matrix.identity(); }
    meshFor(F, 'polecat', machine('polecat'), null); M.polecat.userData.title = NAME.pole;
    for (const id of ['pold', 'fen1', 'lig1']) meshFor(F, id, machine(id), LABEL[id]);
    meshFor(F, 'rfc', machine('rfc', .55, { keep: s => s < 5 }), LABEL.rfc);
    const tg = machine('top1'); meshFor(F, 'top1', tg, LABEL.top1); M.top1b = new THREE.Mesh(tg, M.top1.material); M.top1b.matrixAutoUpdate = false; M.top1b.userData = M.top1.userData; S.root.add(M.top1b); F.pickables.push(M.top1b);
    instFor(F, 'pcna', machine('pcna'), 4); instFor(F, 'rpa', machine('rpa'), 24);
    { const a = new THREE.Object3D(); S.root.add(a); M.pcnaA = a; a.userData = M.pcna.userData; F.label(a, LABEL.pcna, { pick: M.pcna }); }
    { const a = new THREE.Object3D(); S.root.add(a); M.rpaA = a; a.userData = M.rpa.userData; F.label(a, LABEL.rpa, { pick: M.rpa }); }
    // Pol epsilon's flexible linker between its two halves: not resolved in any structure, drawn as a thin tube
    const pc = S.D.polecat.beads, last = new V3(pc[pc.length - 4] / 20, pc[pc.length - 3] / 20, pc[pc.length - 2] / 20);
    const tip = G.PE.clone().addScaledVector(G.peX, last.x).addScaledVector(G.peY, last.y).addScaledVector(G.peZ, last.z), ls = v3(S.D.pole.anchors.linker_start);
    const mid = tip.clone().add(ls).multiplyScalar(.5).add(new V3(0, 1.5, 2));
    const lk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([tip, mid, ls]), 24, .32, 6, false), smat(HUE.pole[0], { kind: 'plastic', roughness: .62 }));
    lk.userData = Object.assign({}, M.pole.userData, { title: 'Pol ε: flexible linker (not resolved; drawn)' }); S.root.add(lk); F.pickables.push(lk);
    setPose(M.polecat, G.PE, G.peX, G.peY, G.peZ, true);
    // nucleotides arriving and pyrophosphate leaving
    const dg = dntpGeos(), mkD = (geo, ud) => { const m = new THREE.InstancedMesh(geo, smat(0xffffff, { vertexColors: true, kind: 'plastic', roughness: .5 }), 48); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; m._n = 0; m._prev = 0; m.userData = ud; S.root.add(m); F.pickables.push(m); return m; };
    const ud = { id: 'rep_dntp', node: 'rep_dntp', title: 'Nucleotide arriving (dNTP)', priority: 1 };
    M.dnB = mkD(dg.base, ud); M.dnS = mkD(dg.sug, ud); M.ppi = mkD(dg.ppi, { id: 'rep_ppi', node: 'rep_dntp', title: 'Pyrophosphate leaving (PPi)', priority: 1 });
    M.dnB.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(48 * 3).fill(1), 3); M.dnB.instanceColor.setUsage(THREE.DynamicDrawUsage);
    // names of the strands
    S.lbl = {};
    for (const [k, t, ud2] of [['lead', 'Leading strand (made continuously)', DR.bead.n.userData], ['lag', 'Lagging strand (made in pieces)', DR.bead.n.userData], ['par', 'Parent DNA', DR.bead.o.userData], ['prim', 'RNA primer', DR.bead.r.userData], ['frag', 'Okazaki fragment', DR.bead.n.userData], ['nick', 'Nick', DR.bead.n.userData]]) {
      const a = new THREE.Object3D(); a.userData = ud2; S.root.add(a); S.lbl[k] = a; F.label(a, t, { pick: k === 'par' ? DR.bead.o : k === 'prim' ? DR.bead.r : DR.bead.n });
    }
    S.lbl.lead.position.set(-48, 25.5, 0); S.lbl.par.position.set(30, 2.6, 0); S.lbl.lag.position.set(-70, -27.8, 0);
    S.built = true;
  }


  /* ---------- one picture at clock time t (seconds of the cell's time) ---------- */
  const NPAR = 135, NLD = 380, LAGN = 640;
  const lu = new Float32Array(LAGN), lcode = new Uint8Array(LAGN), lown = new Int32Array(LAGN), lm = new Int32Array(LAGN), lflap = new Float32Array(LAGN), lcut = new Float32Array(LAGN), lreg = new Uint8Array(LAGN), lpair = new Uint8Array(LAGN), larc = new Float32Array(LAGN);
  const lc = new Float32Array(LAGN * 3), lt = new Float32Array(LAGN * 3), ln = new Float32Array(LAGN * 3), lb = new Float32Array(LAGN * 3), lpos = new Float32Array(LAGN * 3), lpar = new Float32Array(LAGN * 3);
  const fA = fr(), fB = fr(), fC = fr();
  function lagCompute(t) {
    const sf = V * t, nAt = nA(t), jTop = Math.floor(sf), n = Math.min(LAGN, Math.floor(G.Dc + 330)); G._sf = sf; G._nA = nAt; G._jTop = jTop; G._n = n; G._u0 = sf - jTop;
    let PA = 0, UA = 0, PB = 0, UB = 0;
    for (let i = 0; i < n; i++) {
      const j = jTop - i, u = sf - j, code = lagPartner(j, t), r = u <= nAt ? 0 : u <= G.Dc ? 1 : 2, p = code > 0 ? 1 : 0;
      lu[i] = u; lcode[i] = code; lown[i] = LP.own; lm[i] = LP.m; lflap[i] = LP.flap; lcut[i] = LP.cut; lreg[i] = r; lpair[i] = p;
      if (r === 0) { if (p) PA++; else UA++; } else if (r === 1) { if (p) PB++; else UB++; }
    }
    buildA(betaFor(Math.max(G.lenA[0], NT * PA + SS0 * UA))); const lenA = G.lagA.len;
    const sA = UA > 0 ? Math.max(.12, (lenA - NT * PA) / UA) : NT, sB = UB > 0 ? Math.max(.12, (G.lenB - NT * PB) / UB) : NT;
    // arc of each nucleotide along its stretch; each curved stretch is then fitted exactly between its ends
    let a = 0, first = [-1, -1], last = [-1, -1];
    for (let i = 0; i < n; i++) {
      const r = lreg[i], w = lpair[i] ? NT : r === 0 ? sA : sB;
      if (r === 2) { larc[i] = G.lenB + (lu[i] - G.Dc) * NT; continue; }
      if (first[r] < 0) { first[r] = i; a = (r === 0 ? lu[i] : lu[i] - nAt) * w; } else a += w;
      larc[i] = a; last[r] = i;
    }
    for (let r = 0; r < 2; r++) { if (first[r] < 0) continue; const i0 = first[r], i1 = last[r], w1 = lpair[i1] ? NT : r === 0 ? sA : sB;
      const end = larc[i1] + ((r === 0 ? nAt : G.Dc) - lu[i1]) * w1, len = r === 0 ? lenA : G.lenB; if (end > 1e-3) { const k = len / end; for (let i = i0; i <= i1; i++) larc[i] *= k; } }
    for (let i = 0; i < n; i++) {
      (lreg[i] === 0 ? G.lagA : G.lagB).at(larc[i], fA);
      let pr = 0; for (let q = i - 2; q <= i + 2; q++) pr += q >= 0 && q < n ? lpair[q] : lpair[i]; pr = ease(pr / 5);
      const j = jTop - i, ang = -j * TW, r = RB * pr, ca = Math.cos(ang), sa = Math.sin(ang), c2 = Math.cos(ang - OFF), s2 = Math.sin(ang - OFF);
      for (let c = 0; c < 3; c++) { const k = i * 3 + c; lc[k] = fA.p[c]; lt[k] = fA.t[c]; ln[k] = fA.n[c]; lb[k] = fA.b[c];
        lpos[k] = fA.p[c] + r * (ca * fA.n[c] + sa * fA.b[c]); lpar[k] = fA.p[c] + RB * (c2 * fA.n[c] + s2 * fA.b[c]); }
    }
  }
  function lagFrame(u, o) {   // the lagging duplex's axis point and frame at a continuous template position u
    const f = u - G._u0; let i = Math.floor(f); if (i < 0) i = 0; if (i > G._n - 2) i = G._n - 2; const r = Math.max(0, Math.min(1, f - i));
    for (let c = 0; c < 3; c++) { const a = i * 3 + c, b = a + 3; o.p[c] = lc[a] + (lc[b] - lc[a]) * r; o.t[c] = lt[a] + (lt[b] - lt[a]) * r; o.n[c] = ln[a] + (ln[b] - ln[a]) * r; o.b[c] = lb[a] + (lb[b] - lb[a]) * r; }
    nrm(o.t); nrm(o.n); nrm(o.b); return o;
  }
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; v[0] /= l; v[1] /= l; v[2] /= l; };
  /* a machine that grips a primer end: origin on the axis, x along the path (the direction of synthesis), turned so that the model's 3' nucleotide
     sits where the drawn one is (aNew: its angle round the axis in the path's frame; p3: the model's) */
  function gripPose(o, aNew, p3, O, X, Y, Z) {
    O.set(o.p[0], o.p[1], o.p[2]); X.set(o.t[0], o.t[1], o.t[2]); const d = aNew - p3, c = Math.cos(d), s = Math.sin(d);
    Y.set(c * o.n[0] + s * o.b[0], c * o.n[1] + s * o.b[1], c * o.n[2] + s * o.b[2]); Z.crossVectors(X, Y);
  }
  const PO = { O: new V3(), X: new V3(), Y: new V3(), Z: new V3() }, P2 = { O: new V3(), X: new V3(), Y: new V3(), Z: new V3() };
  function polDPose(t, out) {   // Pol delta's pose now, or false when it is not on the DNA
    const k = Math.floor(t / T), dt = t - k * T; if (dt < tDin || dt > tOut) return false;
    const m = polDm(dt), u3 = (G._sf - jp(k)) + m; lagFrame(u3, fC);
    gripPose(fC, -(G._sf - u3) * TW - OFF, S.D.pold.anchors.p3[0], out.O, out.X, out.Y, out.Z);
    const away = dt < tSyn ? 1 - ease((dt - tDin) / (tSyn - tDin)) : dt > tRemEnd ? ease((dt - tRemEnd) / (tOut - tRemEnd)) : 0;
    if (away > 0) out.O.addScaledVector(out.Y, 14 * away);
    out.away = away; return true;
  }
  function primerEndPose(t, k, m, p3, out) { const u3 = (G._sf - jp(k)) + m; lagFrame(u3, fC); gripPose(fC, -(G._sf - u3) * TW - OFF, p3, out.O, out.X, out.Y, out.Z); return out; }

  let pairsN = 0; const pairs = new Int32Array(64 * 4); let pairsSeen = 0;
  function notePair(mA, iA, mB, iB) {   // keeps an even sample of the drawn base pairs for the tests (reservoir)
    if (iA < 0 || iB < 0) return; pairsSeen++; let k = pairsN < 64 ? pairsN++ : Math.floor(hash(pairsSeen) * pairsSeen); if (k >= 64) return;
    pairs[k * 4] = 'ATGC'.indexOf(mA); pairs[k * 4 + 1] = iA; pairs[k * 4 + 2] = 'ATGC'.indexOf(mB); pairs[k * 4 + 3] = iB;
  }
  function draw(t) {
    const sf = V * t, jTop = Math.floor(sf), C = DNA(); pairsN = 0; pairsSeen = 0;
    lagCompute(t);
    const nTopo = Math.floor(sf / 84) + 1, jT = 84 * nTopo + 30;
    let px = 0, py = 0, pz = 0, has = false, qx = 0, qy = 0, qz = 0, hasN = false;
    /* strand A: the parent strand the helicase encircles, then the leading strand's template; its partner is the new leading strand */
    const fl = G.lead.len / NLEAD;
    for (let j = jTop + NPAR; j > jTop - NLEAD - NLD; j--) {
      const u = sf - j, L1 = seqA(j), fade = ease((NLEAD + NLD - u) / 20) * ease((u + NPAR) / 8);
      let ax, ay, az, mx, my, mz, tx = 1, ty = 0, tz = 0, paired = true, nb = null;
      if (u < 0) {
        const ang = (j < jT ? (j - sf) * TW : j * TW) + G.phi0, x = -u * NT;
        ax = x; ay = RB * Math.cos(ang); az = RB * Math.sin(ang); const by = RB * Math.cos(ang + OFF), bz = RB * Math.sin(ang + OFF);
        mx = x; my = (ay + by) / 2; mz = (az + bz) / 2;
        const iB = base(seqB(j), x, by, bz, mx, my, mz, 1, 0, 0, fade), iA = base(L1, ax, ay, az, mx, my, mz, 1, 0, 0, fade); notePair(L1, iA, seqB(j), iB);
      } else if (u < NLEAD) {
        G.lead.at(u * fl, fA); ax = fA.p[0]; ay = fA.p[1]; az = fA.p[2]; tx = fA.t[0]; ty = fA.t[1]; tz = fA.t[2]; paired = false;
        const ang = j * TW * .6; mx = ax + .55 * (Math.cos(ang) * fA.n[0] + Math.sin(ang) * fA.b[0]); my = ay + .55 * (Math.cos(ang) * fA.n[1] + Math.sin(ang) * fA.b[1]); mz = az + .55 * (Math.cos(ang) * fA.n[2] + Math.sin(ang) * fA.b[2]);
        base(L1, ax, ay, az, mx, my, mz, tx, ty, tz, fade);
      } else {
        G.leadD.at((u - NLEAD) * NT, fA); const ang = G.cLead + (u - NLEAD) * TW, c1 = Math.cos(ang), s1 = Math.sin(ang), c2 = Math.cos(ang + OFF), s2 = Math.sin(ang + OFF);
        ax = fA.p[0] + RB * (c1 * fA.n[0] + s1 * fA.b[0]); ay = fA.p[1] + RB * (c1 * fA.n[1] + s1 * fA.b[1]); az = fA.p[2] + RB * (c1 * fA.n[2] + s1 * fA.b[2]);
        const bx = fA.p[0] + RB * (c2 * fA.n[0] + s2 * fA.b[0]), by = fA.p[1] + RB * (c2 * fA.n[1] + s2 * fA.b[1]), bz = fA.p[2] + RB * (c2 * fA.n[2] + s2 * fA.b[2]);
        mx = (ax + bx) / 2; my = (ay + by) / 2; mz = (az + bz) / 2; tx = fA.t[0]; ty = fA.t[1]; tz = fA.t[2];
        const iA = base(L1, ax, ay, az, mx, my, mz, tx, ty, tz, fade), iB = base(seqB(j), bx, by, bz, mx, my, mz, tx, ty, tz, fade); notePair(L1, iA, seqB(j), iB);
        const k = bead(DR.bead.n, bx, by, bz, fade); if (k >= 0) DR.bead.n.userData.role[k] = 0;
        if (hasN) link(DR.link.n, qx, qy, qz, bx, by, bz); qx = bx; qy = by; qz = bz; hasN = true;
      }
      bead(DR.bead.o, ax, ay, az, fade); if (has) link(DR.link.o, px, py, pz, ax, ay, az); px = ax; py = ay; pz = az; has = true;
    }
    /* strand B: the parent strand pushed out of the ring, then the lagging strand's template; its partners are the primers and Okazaki fragments */
    has = false; hasN = false; let prevCode = 0, prevOwn = 0, prevFlap = false;
    for (let j = jTop + NPAR; j > jTop - G._n; j--) {
      const u = sf - j, L1 = seqB(j), fade = ease((G._n - 1 - (jTop - j)) / 20) * ease((u + NPAR) / 8);
      let ax, ay, az;
      if (u < 0) {
        const ang = (j < jT ? (j - sf) * TW : j * TW) + G.phi0 + OFF, x = -u * NT; ax = x; ay = RB * Math.cos(ang); az = RB * Math.sin(ang);
        bead(DR.bead.o, ax, ay, az, fade); if (has) link(DR.link.o, px, py, pz, ax, ay, az); px = ax; py = ay; pz = az; has = true; continue;
      }
      const i = jTop - j, k3 = i * 3, code = lcode[i];
      ax = lpos[k3]; ay = lpos[k3 + 1]; az = lpos[k3 + 2];
      bead(DR.bead.o, ax, ay, az, fade); if (has) link(DR.link.o, px, py, pz, ax, ay, az); px = ax; py = ay; pz = az; has = true;
      const tx = lt[k3], ty = lt[k3 + 1], tz = lt[k3 + 2];
      if (code > 0) {
        const bx = lpar[k3], by = lpar[k3 + 1], bz = lpar[k3 + 2], mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2, P1 = code === 4 ? WRONG[seqA(j)] : seqA(j);
        const iA = base(L1, ax, ay, az, mx, my, mz, tx, ty, tz, fade), iB = base(P1, bx, by, bz, code === 4 ? mx + (mx - bx) * -.25 : mx, code === 4 ? my + (my - by) * -.25 : my, code === 4 ? mz + (mz - bz) * -.25 : mz, tx, ty, tz, fade);
        if (code !== 4) notePair(L1, iA, P1, iB);
        const mesh = code === 1 ? DR.bead.r : DR.bead.n, k = bead(mesh, bx, by, bz, fade); if (code !== 1 && k >= 0) DR.bead.n.userData.role[k] = 1;
        if (hasN && prevCode > 0 && !prevFlap && (lown[i] === prevOwn || (prevOwn === lown[i] + 1 && t >= prevOwn * T + tSeal))) link(code === 1 && prevCode === 1 ? DR.link.r : DR.link.n, qx, qy, qz, bx, by, bz);
        qx = bx; qy = by; qz = bz; hasN = true; prevCode = code; prevOwn = lown[i]; prevFlap = false;
        if (lflap[i] >= 0 || lcut[i] >= 0) {   // the old start of the previous fragment, peeled off as a flap and cut away
          const old = lm[i] < NRNA, ox = bx - lc[k3], oy = by - lc[k3 + 1], oz = bz - lc[k3 + 2], ol = Math.hypot(ox, oy, oz) || 1;
          const d = lflap[i] >= 0 ? .8 + 1.2 * lflap[i] / CUT : 2 + 7 * ease(lcut[i] / DRIFT), hx = hash(j) - .5, hy = hash(j + 7) - .5, hz = hash(j + 13) - .5;
          const fx = bx + ox / ol * d + (lcut[i] >= 0 ? hx * d : 0), fy = by + oy / ol * d + (lcut[i] >= 0 ? hy * d : 0), fz = bz + oz / ol * d + (lcut[i] >= 0 ? hz * d : 0), sc = lcut[i] >= 0 ? 1 - ease(lcut[i] / DRIFT) : 1;
          bead(old ? DR.bead.r : DR.bead.n, fx, fy, fz, sc); base(seqA(j), fx, fy, fz, fx + ox / ol * .6, fy + oy / ol * .6, fz + oz / ol * .6, tx, ty, tz, sc);
        }
      } else {
        prevCode = 0;
        const ang = j * TW * .6 + (lreg[i] === 2 ? 0 : 1), mx = lc[k3] + .6 * (Math.cos(ang) * ln[k3] + Math.sin(ang) * lb[k3]), my = lc[k3 + 1] + .6 * (Math.cos(ang) * ln[k3 + 1] + Math.sin(ang) * lb[k3 + 1]), mz = lc[k3 + 2] + .6 * (Math.cos(ang) * ln[k3 + 2] + Math.sin(ang) * lb[k3 + 2]);
        const rr = Math.hypot(ax - lc[k3], ay - lc[k3 + 1], az - lc[k3 + 2]);
        if (rr > .3) base(L1, ax, ay, az, lc[k3], lc[k3 + 1], lc[k3 + 2], tx, ty, tz, fade * .9); else base(L1, ax, ay, az, mx, my, mz, tx, ty, tz, fade);
      }
    }
    finishDR();
    drawMachines(t);
  }

  /* ---------- the machines at time t ---------- */
  function drawMachines(t) {
    const sf = G._sf, k = Math.floor(t / T), dt = t - k * T;
    // Topoisomerase I ahead of the fork: one binds about 39 nm ahead, rides in with the DNA, lets go near the helicase (every 84 nt: 8 turns)
    for (let q = 0; q < 2; q++) {
      const nT = Math.floor(sf / 84) + 1 - q, jT = 84 * nT + 30, x = (jT - sf) * NT, m = nT % 2 ? M.top1b : M.top1, ph = sf / 84 - Math.floor(sf / 84);
      let up = q === 0 ? 1 - ease(ph * 84 / V / .5) : ease((ph * 84 / V) / .6), show = q === 0 || ph * 84 / V < .6;
      const r = jT * TW + G.phi0; _Y.set(0, Math.cos(r), Math.sin(r)); _X.set(1, 0, 0); _Z.crossVectors(_X, _Y); _O.set(x, 0, 0).addScaledVector(_Y, 16 * up);
      setPose(m, _O, _X, _Y, _Z, show && x > 6);
    }
    // the primer end that RFC and PCNA find, and Pol delta
    const pd = polDPose(t, PO); setPose(M.pold, PO.O, PO.X, PO.Y, PO.Z, pd);
    if (pd) S.polD = PO.O; else S.polD = null;
    { const on = dt > tRem0 - .3 && dt < tRemEnd + .25 && pd, away = dt < tRem0 ? 1 - ease((dt - tRem0 + .3) / .3) : dt > tRemEnd ? ease((dt - tRemEnd) / .25) : 0;
      if (on) { P2.O.copy(PO.O).addScaledVector(PO.Y, 10 * away); setPose(M.fen1, P2.O, PO.X, PO.Y, PO.Z, true); } else setPose(M.fen1, PO.O, PO.X, PO.Y, PO.Z, false); }
    { const on = dt >= tRfcIn && dt <= tRfcOut, away = dt < tRfcOn ? 1 - ease((dt - tRfcIn) / (tRfcOn - tRfcIn)) : dt > tShut ? ease((dt - tShut) / (tRfcOut - tShut)) : 0;
      if (on) { primerEndPose(t, k, NPRIM - .5, S.D.rfc.anchors.p3[0], P2); P2.O.addScaledVector(P2.Y, 14 * away); setPose(M.rfc, P2.O, P2.X, P2.Y, P2.Z, true); } else setPose(M.rfc, P2.O, P2.X, P2.Y, P2.Z, false); }
    // PCNA: the one being loaded (it arrives on RFC), the one Pol delta rides, and those left on finished fragments
    const pc = M.pcna; let lab = null;
    for (let kk = k; kk >= k - 2; kk--) {
      const d2 = t - kk * T; if (d2 < tRfcIn) continue;
      let O, X, Y, Z, s = 1;
      if (kk === k && d2 < tSyn) { primerEndPose(t, kk, NPRIM - .5, S.D.pold.anchors.p3[0], P2); if (d2 < tRfcOn) P2.O.addScaledVector(P2.Y, 14 * (1 - ease((d2 - tRfcIn) / (tRfcOn - tRfcIn)))); O = P2.O; X = P2.X; Y = P2.Y; Z = P2.Z; }
      else if (kk === k && pd && dt < tRemEnd) { primerEndPose(t, kk, polDm(dt), S.D.pold.anchors.p3[0], P2); O = P2.O; X = P2.X; Y = P2.Y; Z = P2.Z; }
      else { const u3 = (sf - jp(kk)) + L + NREM - .5; if (u3 > G.Dc + 300) continue; primerEndPose(t, kk, L + NREM - .5, S.D.pold.anchors.p3[0], P2); O = P2.O; X = P2.X; Y = P2.Y; Z = P2.Z; s = ease((G.Dc + 300 - u3) / 15); }
      putInst(pc, O, X, Y, Z, s); if (!lab && kk === k) { lab = 1; M.pcnaA.position.copy(O).addScaledVector(Y, -6.5); }
    }
    finishInst(pc); M.pcnaA.visible = !!lab;
    // DNA ligase I on the nick between this fragment and the previous one
    { const on = dt >= tLigIn && dt <= tLigGone, away = dt < tLigOn ? 1 - ease((dt - tLigIn) / (tLigOn - tLigIn)) : dt > tLigOff ? ease((dt - tLigOff) / (tLigGone - tLigOff)) : 0;
      if (on) { const jn = jp(k - 1) - NREM, u = sf - (jn + .5); lagFrame(u, fC); gripPose(fC, -(jn + 1) * TW - OFF, S.D.lig1.anchors.p3[0], P2.O, P2.X, P2.Y, P2.Z); P2.O.addScaledVector(P2.Y, 12 * away); setPose(M.lig1, P2.O, P2.X, P2.Y, P2.Z, true); }
      else setPose(M.lig1, P2.O, P2.X, P2.Y, P2.Z, false); }
    // RPA on bare single strand of the lagging template (about 30 nucleotides each)
    const rp = M.rpa; let rlab = null;
    for (let kk = k + 1; kk >= k - 3; kk--) for (let w = 0; w < 5; w++) {
      const jw = jp(kk) - 2 - 33 * w, uTop = sf - jw; if (uTop < G._nA + 3 || uTop + 29 > G.Dc + 300) continue;
      let ok = true, next = Infinity;
      for (let q = 0; q < 30 && ok; q++) { const j = jw - q, kq = Math.ceil((j + G.nA0) / L), m = jp(kq) - j, tm = kq * T + (m === MERR ? tErr : tMade(m)); if (lagPartner(j, t) > 0) ok = false; else next = Math.min(next, tm - t); }
      if (!ok) continue;
      const s = ease((uTop - G._nA - 3) / 6) * ease(next / .25); if (s < .02) continue;
      lagFrame(uTop + 14.5, fC); const th = -jw * TW; _X.set(-fC.t[0], -fC.t[1], -fC.t[2]); _Y.set(Math.cos(th) * fC.n[0] + Math.sin(th) * fC.b[0], Math.cos(th) * fC.n[1] + Math.sin(th) * fC.b[1], Math.cos(th) * fC.n[2] + Math.sin(th) * fC.b[2]); _Z.crossVectors(_X, _Y); _O.set(fC.p[0], fC.p[1], fC.p[2]);
      putInst(rp, _O, _X, _Y, _Z, s); if (!rlab && uTop > G.nB0 * .6) { rlab = 1; M.rpaA.position.set(_O.x, _O.y - 5.5, _O.z); }
    }
    finishInst(rp); M.rpaA.visible = !!rlab;
    drawNucleotides(t, pd);
    // names that follow the strands
    { const u = (sf - jp(k)) + 5; S.lbl.prim.visible = dt > .3 && dt < tRem0 + T * 0; if (S.lbl.prim.visible) { lagFrame(Math.min(u, G._n - 3), fC); S.lbl.prim.position.set(fC.p[0] + 2, fC.p[1] - 1.5, fC.p[2]); }
      const uf = (sf - jp(k - 1)) + 84; S.lbl.frag.visible = uf < G._n - 20; if (S.lbl.frag.visible) { lagFrame(uf, fC); S.lbl.frag.position.set(fC.p[0], fC.p[1] - 2.2, fC.p[2]); }
      S.lbl.nick.visible = dt > tRemEnd && dt < tSeal; if (S.lbl.nick.visible) { const un = sf - (jp(k - 1) - NREM + .5); lagFrame(un, fC); S.lbl.nick.position.set(fC.p[0], fC.p[1] + 2, fC.p[2]); } }
  }

  /* ---------- nucleotides arriving at each polymerase, and the pyrophosphate each leaves ---------- */
  const _tq = new THREE.Quaternion(), _ax = new V3(), _X2 = new V3(), _Y2 = new V3(), _Z2 = new V3(), _B = new V3();
  function flight(o, X, Y, Z, seed, p, out, letter, ppiOnly) {   // p < 1: arriving (0 far, 1 bound); p >= 1: pyrophosphate leaving (p - 1 from 0 to 1)
    _B.copy(o).addScaledVector(X, G.dntpC.x).addScaledVector(Y, G.dntpC.y).addScaledVector(Z, G.dntpC.z);
    const arriving = p < 1, f = arriving ? 1 - ease(p) : ease(p - 1), sd = arriving ? seed : seed + 3.1;
    _ax.set(hash(sd) - .5, hash(sd + 1) - .5, hash(sd + 2) - .5).normalize(); _B.addScaledVector(_ax, 9 * f);
    _tq.setFromAxisAngle(_ax.set(hash(sd + 3) - .5, hash(sd + 4) - .5, hash(sd + 5) - .5).normalize(), 4 * f);
    _X2.copy(X).applyQuaternion(_tq); _Y2.copy(Y).applyQuaternion(_tq); _Z2.copy(Z).applyQuaternion(_tq);
    const sc = arriving ? 1 : 1 - ease((p - 1 - .7) / .3);
    if (arriving) { const n = M.dnB._n; putInst(M.dnB, _B, _X2, _Y2, _Z2, sc); _c.setHex(DNA()[letter === 'U' ? 'T' : letter]); if (n < 48) M.dnB.instanceColor.setXYZ(n, _c.r, _c.g, _c.b); putInst(M.dnS, _B, _X2, _Y2, _Z2, sc); }
    putInst(M.ppi, _B, _X2, _Y2, _Z2, sc);
  }
  const _c = new THREE.Color(), PP = { O: new V3(), X: new V3(), Y: new V3(), Z: new V3() };
  function drawNucleotides(t, pd) {
    const sf = G._sf;
    // Pol epsilon, leading strand: nucleotide j is added when it reaches the active site
    for (let j = Math.ceil(V * (t - PPI) - NLEAD); j <= Math.floor(V * (t + IN) - NLEAD); j++) { const tj = (j + NLEAD) / V, p = t < tj ? 1 - (tj - t) / IN : 1 + (t - tj) / PPI; if (p < 0 || p > 2) continue; flight(G.PE, G.peX, G.peY, G.peZ, j * 1.7, p, null, seqB(j)); }
    // primase and Pol alpha (at the primase's site), Pol delta: lagging strand
    G.lagB.at(0, fB); PP.O.copy(G.prim); PP.X.set(fB.t[0], fB.t[1], fB.t[2]); PP.Y.set(fB.n[0], fB.n[1], fB.n[2]); PP.Z.set(fB.b[0], fB.b[1], fB.b[2]);
    const k0 = Math.floor(t / T);
    for (let kk = k0 - 1; kk <= k0 + 1; kk++) {
      const dt = t - kk * T; if (dt < -IN || dt > tRemEnd + PPI) continue;
      let lo = 0, hi = L + NREM - 1;   // first m whose time is after dt - PPI
      while (lo < hi) { const mid = (lo + hi) >> 1; if (tMade(mid) < dt - PPI) lo = mid + 1; else hi = mid; }
      for (let m = lo; m < L + NREM && tMade(m) <= dt + IN; m++) {
        const tm = tMade(m), p = dt < tm ? 1 - (tm - dt) / IN : 1 + (dt - tm) / PPI; if (p < 0 || p > 2) continue;
        const j = jp(kk) - m, letter = m < NRNA ? (seqA(j) === 'T' ? 'U' : seqA(j)) : seqA(j);
        if (m < NPRIM) flight(PP.O, PP.X, PP.Y, PP.Z, j * 2.3 + 11, p, null, letter);
        else if (kk === k0 && pd) flight(PO.O, PO.X, PO.Y, PO.Z, j * 2.3 + 11, p, null, letter);
      }
      if (kk === k0 && pd) { const p = dt < tErr ? 1 - (tErr - dt) / IN : 1 + (dt - tErr) / PPI; if (p >= 0 && p <= 2) flight(PO.O, PO.X, PO.Y, PO.Z, 977, p, null, WRONG[seqA(jp(kk) - MERR)]); }
    }
    finishInst(M.dnB); finishInst(M.dnS); finishInst(M.ppi); M.dnB.instanceColor.needsUpdate = true;
  }

  /* ---------- clock, stages and the panel ---------- */
  const stageAt = t => { let i = 0; for (let q = 0; q < STAGES.length; q++) if (t >= STAGES[q][0]) i = q; return i; };
  let UI = null;
  function ui(c) {
    const el = document.createElement('div'); el.className = 'repCtl'; el.dataset.sec = 'Replication, step by step'; el.dataset.secKey = 'rep'; el.dataset.secOpen = 'always'; el.style.display = 'none';
    el.innerHTML = `<p class="repNow"><span class="repN"></span> <b class="repT"></b></p><div class="repBar"><button type="button" data-a="back" title="Go back to the previous step">Back</button><button type="button" data-a="play" title="Pause or play">Pause</button><button type="button" data-a="next" title="Go on to the next step">Next</button></div>`
      + `<div class="repTrack" aria-hidden="true"><i></i></div><ol class="repList">${STAGES.map((s, i) => `<li><button type="button" data-i="${i}">${s[1]}</button></li>`).join('')}</ol>`
      + `<p class="repSpeed">Real speed: the fork moves about ${Math.round(V)} nucleotides a second (0.68 kb a minute, the mean measured in HeLa cells); Pol δ adds about ${VD} a second. Shown ${SLOW} times slower. One Okazaki fragment of ${L} nucleotides takes ${T.toFixed(1)} s in the cell, ${(T * SLOW).toFixed(0)} s here. The times of the separate steps are chosen to show them, not measured.</p>`;
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.i !== undefined) return goStage(+b.dataset.i);
      const a = b.dataset.a; if (a === 'play') { S.play = !S.play; S.dirty = true; syncUI(true); } else if (a === 'next') step(1); else if (a === 'back') step(-1); });
    if (!document.getElementById('repCss')) { const st = document.createElement('style'); st.id = 'repCss'; st.textContent = `
.repCtl { font-size: 12.5px; color: var(--ink-2); line-height: 1.45 }
.repCtl .repNow { margin: 0 0 8px } .repCtl .repN { color: var(--muted) }
.repCtl .repBar { display: flex; gap: 6px; margin: 0 0 8px }
.repCtl .repBar button, .repCtl .repList button { border: 1px solid var(--rule); background: var(--paper); color: var(--ink); border-radius: var(--r-ctl); padding: 6px 12px; font: 500 12.5px var(--sans); cursor: pointer }
.repCtl .repBar button:hover, .repCtl .repList button:hover { background: var(--paper-2) }
.repCtl .repTrack { height: 3px; background: var(--rule); border-radius: 2px; margin: 0 0 8px; overflow: hidden } .repCtl .repTrack i { display: block; height: 100%; width: 0; background: var(--accent) }
.repCtl .repList { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-wrap: wrap; gap: 4px }
.repCtl .repList button { padding: 4px 8px; font-size: 12px; color: var(--ink-2) }
.repCtl .repList button.on { border-color: var(--accent); color: var(--ink); font-weight: 600; box-shadow: inset 0 -2px 0 var(--accent) }
.repCtl .repSpeed { margin: 0; color: var(--muted); font-size: 12px }`; document.head.appendChild(st); }
    uiEl(el); return { el, n: el.querySelector('.repN'), t: el.querySelector('.repT'), play: el.querySelector('[data-a=play]'), bar: el.querySelector('.repTrack i'), list: [...el.querySelectorAll('.repList button')] };
  }
  let lastBar = -1;
  function syncUI(force) {
    if (!UI) return; const i = stageAt(S.clk);
    if (i !== S.stage || force) {
      S.stage = i; UI.n.textContent = `Step ${i + 1} of ${STAGES.length}:`; UI.t.textContent = STAGES[i][1]; UI.list.forEach((b, q) => { b.classList.toggle('on', q === i); b.setAttribute('aria-pressed', q === i ? 'true' : 'false'); });
      if (S.c) sceneNote(S.c, NOTE(), STAGES[i][2]);
    }
    UI.play.textContent = S.play ? 'Pause' : 'Play';
    const w = Math.round(S.clk / T * 400); if (w !== lastBar) { lastBar = w; UI.bar.style.width = (w / 4) + '%'; }
  }
  function goStage(i) { S.clk = STAGES[(i + STAGES.length) % STAGES.length][0] + .001; S.play = false; S.dirty = true; syncUI(true); }
  function step(d) { const i = stageAt(S.clk); if (d < 0 && S.clk - STAGES[i][0] > .25 * SLOW / SLOW + .05) return goStage(i); goStage(i + d); }
  const NOTE = () => 'Model: a human replication fork at true size. The machines’ shapes are measured structures (Protein Data Bank 7PFO, 8B9D, 5EXR, 6TNY, 6TNZ, 7TID, 4M8O, 1X9N, 1A36, 4GOP), drawn as smooth surfaces about 0.6 nm fine; the DNA’s width (2 nm) and its 0.34 nm per base pair are to scale, and its atoms are not drawn. '
    + `Time is not to scale: shown ${SLOW} times slower, and the times of the steps are chosen. Where the flexible parts sit (Pol ε’s polymerase half, the path and loop of the lagging strand, where RFC, Pol δ and ligase work) is drawn, not measured. Single strand is drawn at 0.25 nm per nucleotide and one Okazaki fragment is ${L} nucleotides; the sequence is invented. Colours are a code: A green, T red, G yellow, C blue; old strands pale, new DNA blue, RNA violet.`;

  /* ---------- show and hide (the DNA scene's button) ---------- */
  function fitView() {
    const F = S.F, A = typeof freeArea === 'function' ? freeArea() : { w: W, h: H }, k = 2 * Math.tan(25 * PI / 180);
    const D = Math.max(132 / (k * Math.max(.2, A.w / H)), 66 / (k * Math.max(.2, A.h / H)));
    flyTo(F, new V3(-24, -4, 0), D * 1e-9);
  }
  function show(on, quiet) {
    const F = S.F, c = S.c; if (!F || on === S.on) return S.loading;
    S.on = on; if (S.hooks) S.hooks.hide(on);
    if (UI) UI.el.style.display = on ? '' : 'none';
    if (on) {
      S.blurb0 = F.blurb; S.r1 = F.r1; S.rad = F.radius; F.r1 = 6e-7; F.radius = 150;
      sceneNote(c, 'Model: loading the replication machines…');
      return load().then(() => { if (!S.on || S.F !== F) return; if (!S.built) build(); S.root.visible = true; S.dirty = true; S.stage = -1; syncUI(true); if (!quiet) fitView(); });
    }
    if (S.root) S.root.visible = false; F.r1 = S.r1 || F.r1; F.radius = S.rad || F.radius;
    sceneNote(c, S.hooks && S.hooks.note ? S.hooks.note() : '', S.blurb0 || F.blurb);
    if (!quiet) flyTo(F, new V3(), 2.6e-8);
    return Promise.resolve();
  }
  function update(dt) {
    if (!S.on || !S.built) return;
    if (typeof PROC !== 'undefined' && PROC.active && PROC.active.id === 'dna_replication' && PROC.i !== S.procI) { S.procI = PROC.i; goStage(PROC.i); }
    if (S.play) { S.clk = (S.clk + Math.min(dt, .1) / SLOW) % T; S.dirty = true; }
    if (S.dirty) { S.dirty = false; draw(S.clk); syncUI(false); }
  }
  /* BUILD.dna calls this while it builds: the panel section is made now (it belongs to the frame), the machines when first shown */
  function attach(c, hooks) {
    S.c = c; S.F = c.frame; S.hooks = hooks; S.on = false; S.built = false; S.root = null; for (const k in M) delete M[k]; S.clk = 0; S.play = true; S.procI = -1;
    UI = ui(c); return { show: (on, q) => show(on, q), update, on: () => S.on };
  }

  /* ---------- inside a machine: its subunits as separate parts ---------- */
  const SUBC = [0x6f9fc7, 0xd7a25b, 0x86b97a, 0xc77d86, 0x9a86c4, 0x5fb3b0, 0xd2b866, 0xb88b6a, 0x7f97d6, 0xc99ac0, 0x8fb0a0, 0xd39a7a];
  function enter(id, h) {
    const F = S.F; if (!F || !S.built) return false;
    const src = id === 'polecat' ? 'polecat' : id, D = S.D[src]; let c;
    if (h && h.obj && h.obj.isInstancedMesh && h.hit && h.hit.instanceId != null) { h.obj.getMatrixAt(h.hit.instanceId, _m4); c = new V3().setFromMatrixPosition(_m4); }
    else { const m = M[id] || (h && h.obj); m.geometry.computeBoundingSphere(); c = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrix); }
    const R = Math.max(6, D.span_nm / 2 + 1.5), ch = new Frame({ type: 'repm', name: id === 'polecat' ? 'Pol ε, polymerase domain' : NAME[id], unit: 1e-9, radius: R * 1.4, r1: R * 1e-8, pos: c, pinned: true, opts: { m: src } });
    ch.dynamic = true; ch.keep = performance.now() + 6e4; F.addChild(ch); ch.ensure();
    flyTo(ch, new V3(), Math.max(fitD(ch, R * .95), 4e-9));
    return 'inner';
  }
  FT.repm = {
    build(F, o) {
      const id = o.m; F.env = { opaque: true, bg: 0x060b14 };
      F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.0)); const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(5, 8, 6); F.add(dl);
      const holder = new THREE.Group(); F.add(holder);
      if (typeof MD !== 'undefined') { MD.kind(F, 'Model'); MD.stage(F, { near: .7, far: 2.6 }); }
      F.note = 'Model: each part is one protein chain of a measured structure, drawn as a smooth surface about 0.4 nm fine, in place as the structure has it. Colours tell the chains apart; they are not real colours. Parts the structure does not resolve (flexible ends and loops) are missing.';
      F.blurb = 'The parts of one machine of DNA replication. Click a part for its name and job; double-click it to go on into the protein it is made of.';
      load().then(() => {
        if (!F.built) return; const D = S.D[id]; if (!D) return;
        let cx = 0, cy = 0, cz = 0; const b = D.beads, nb = b.length / 4; for (let i = 0; i < b.length; i += 4) { cx += b[i]; cy += b[i + 1]; cz += b[i + 2]; } cx /= 20 * nb; cy /= 20 * nb; cz /= 20 * nb;
        D.subunits.forEach((su, i) => {
          if (id === 'rfc' && false) return;
          const g = surface(D, { h: .42, R: id === 'cmg' || id === 'partners' || id === 'pola' || id === 'pole' ? .78 : .62, keep: s => s === i, cols: [SUBC[i % SUBC.length]] }); g.translate(-cx, -cy, -cz); g.computeBoundingSphere();
          const m = new THREE.Mesh(g, smat(0xffffff, { vertexColors: true, kind: 'plastic', roughness: .55 })); holder.add(m);
          m.userData = { id: 'repsub', title: su.name, priority: 1, info: { title: su.name, tag: `Protein chain · part of ${NAME[id] || F.name}`, body: `<p>${su.role[0].toUpperCase() + su.role.slice(1)}.</p><p class="mini">Shape from the Protein Data Bank entry ${su.pdb}, chain ${su.chain}: the ${su.residues} amino acids the structure resolves, drawn as a smooth surface. Double-click to go on into the protein it is made of.</p>`,
            facts: [['Structure', `PDB ${su.pdb}, chain ${su.chain}`], ['Amino acids drawn', String(su.residues)], ['Machine', NAME[id] || F.name]] } };
          F.pickables.push(m);
          const a = new THREE.Object3D(); a.position.copy(g.boundingSphere.center); m.add(a); F.label(a, su.name.replace(/ \(.*\)$/, ''), { pick: m });
        });
        F.name = id === 'polecat' ? 'Pol ε, polymerase domain' : NAME[id];
      });
    }
  };

  /* ---------- the DNA frame's descent, the cards' "Show where it is" ---------- */
  function spawn(F, T0, hint) {   // a zoom into a machine: the machine's parts
    const id = hint && hint.id || ''; if (!S.on || !/^rep_/.test(id)) return null;
    const mid = id.slice(4); if (!S.D[mid] || !M[mid]) return null;
    const D = S.D[mid], R = Math.max(6, D.span_nm / 2 + 1.5);
    return new Frame({ type: 'repm', name: NAME[mid], unit: 1e-9, radius: R * 1.4, r1: R * 1e-8, pos: T0.clone(), pinned: true, opts: { m: mid } });
  }
  const IDS = new Set(['dna_replication']); Object.values(NODE_OF).forEach(i => IDS.add(i)); ['rep_template', 'rep_okazaki', 'rep_rna_primer', 'rep_leading', 'rep_dntp', 'rep_fidelity'].forEach(i => IDS.add(i));
  function goto(id) {
    if (!IDS.has(id) || typeof NODE === 'undefined' || !NODE[id] || typeof FR === 'undefined' || !FR.dna) return false;
    FR.dna.ensure(); const F = FR.dna; if (S.F !== F) return false;
    if (S.hooks && S.hooks.button) S.hooks.button(true);
    const mid = Object.keys(NODE_OF).find(k => NODE_OF[k] === id);
    const p = S.on ? Promise.resolve() : show(true, true);
    flyTo(F, new V3(-24, -4, 0), 1.2e-7);
    p.then(() => {
      if (!mid || !M[mid]) { fitView(); showBodyNode(id, null); return; }
      if (!M[mid].visible && !M[mid].isInstancedMesh) { const st = { pold: 4, fen1: 7, lig1: 8, rfc: 2 }[mid]; if (st !== undefined) goStage(st); }
      draw(S.clk);
      const m = M[mid], c = new V3(); if (m.isInstancedMesh) { if (m.count) { m.getMatrixAt(0, _m4); c.setFromMatrixPosition(_m4); } } else { m.geometry.computeBoundingSphere(); c.copy(m.geometry.boundingSphere.center).applyMatrix4(m.matrix); }
      flyTo(F, c, Math.max(fitD(F, (S.D[mid].span_nm || 10) * .7), 2e-8));
      showBodyNode(id, { frame: F, obj: m, id: m.userData.id, pointLocal: c.clone(), hit: null });
    });
    return true;
  }
  if (typeof GOTO_HOOKS !== 'undefined') GOTO_HOOKS.push(goto);

  /* for the tests: where things are, and the base pairs drawn */
  function probe() {
    if (!S.built) return { on: S.on, built: false };
    const vis = {}; for (const k of MACH) { const m = M[k]; vis[k] = !!(m && m.visible && (!m.isInstancedMesh || m.count > 0)); }
    const pr = []; for (let i = 0; i < pairsN; i++) pr.push(['ATGC'[pairs[i * 4]], pairs[i * 4 + 1], 'ATGC'[pairs[i * 4 + 2]], pairs[i * 4 + 3]]);
    return { on: S.on, built: true, clk: S.clk, T, stage: stageAt(S.clk), play: S.play, visible: vis, pairs: pr, dntp: M.dnB.count, ppi: M.ppi.count };
  }
  function screenOf(id) {   // a point on the screen over the machine (or null), for clicking it
    const m = M[id]; if (!m || !m.visible || !S.F || !S.F.cam) return null; const c = new V3();
    if (m.isInstancedMesh) { if (!m.count) return null; m.getMatrixAt(0, _m4); c.setFromMatrixPosition(_m4); } else { m.geometry.computeBoundingSphere(); c.copy(m.geometry.boundingSphere.center).applyMatrix4(m.matrix); }
    c.applyMatrix4(S.root.matrixWorld); const v = c.project(S.F.cam); return v.z < 1 ? { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H } : null;
  }
  return { attach, spawn, goto, probe, screenOf, goStage, setClock: t => { S.clk = ((t % T) + T) % T; S.dirty = true; S.play = false; }, play: on => { S.play = on; S.dirty = true; }, STAGES, NAME, NODE_OF, MACH, T, V, SLOW, L, M, S };
})();
