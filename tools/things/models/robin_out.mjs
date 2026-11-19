// The outside of the robin: plumage regions, head, bill, eye, feathers (instanced), legs and feet.
import { L, ball, EZ, S2, add, sub, mul, norm, cross, dot, len, lerp3, bnd, sp, tubeM, fin, zs, rot2, D2R, quatBasis, frameYZ, splitMesh } from './robin_lib.mjs';
import { bodySdf, headSdf, HC, HB, headLocal, headInv, LEG, WING, TAIL, surfZ } from './robin_shape.mjs';

export const COL = {
  crown: '#7c6a46', nape: '#8a7a58', face: '#d9692a', breast: '#dd6e2b', grey: '#98a0a2', back: '#7a6844', rump: '#8a7650', flank: '#a89472', belly: '#ebe5d6', vent: '#ddd3bd',
  bill: '#2b2622', eye: '#0f0d0c', ring: '#a89a78', leg: '#8d6a58', claw: '#4a3a32',
  prim: '#5e4c33', sec: '#66523a', tert: '#6b583c', covert: '#7b6946', alula: '#4a3d2b', tail: '#5f4f38', utc: '#7d6c48', undertc: '#d6ccb4',
};
// ---- plumage regions of the body shell (the shell is the outline of the body plumage; each region is its own clickable piece) ----
export function bodyRegions(R) {
  const m = bnd(bodySdf, [-45, 23, -22], [45, 113, 22], .9, 1, 1);
  const C = [-2, 58], a = -38 * D2R, ca = Math.cos(a), sa = Math.sin(a);
  const noise = (p, f = .18, amp = 2.2) => amp * L.fbm(p[0] * f, p[1] * f, p[2] * f, { octaves: 2, seed: 31 });
  const cls = (p, n) => {
    const h = headInv(p), hh = Math.hypot(h[0] / 14, h[1] / 13, h[2] / 11.5), nh = rot2(n, -HB);
    const u = (p[0] - C[0]) * ca - (p[1] - C[1]) * sa, v = (p[0] - C[0]) * sa + (p[1] - C[1]) * ca, az = Math.abs(p[2]);
    const nz = Math.abs(n[2]), nn = noise(p);
    if (hh < 1.12 + .01 * nn) {   // head
      if (nh[1] > .5 && h[0] < 6.5 + nn) return 'crown';
      if (h[0] < -4.5 + nn && nh[1] > -.2) return 'nape';
      if (h[0] < -7 + nn) return 'nape';
      return 'face';
    }
    if (p[1] > 75 && h[0] < -2 && nh[1] > -.1 && p[2] * 0 === 0 && dot(n, [-.6, .8, 0]) > .25) return 'nape';    // back of the neck
    if (p[1] > 69 && az > 8.5 && p[0] > 12 && p[0] < 24 && n[1] < .5) return 'grey';          // side of the neck and shoulder
    // below the neck: breast, sides, belly, back
    if (n[1] > .45 && u < 26) return u < -15 ? 'rump' : 'back';
    if (v < -9 + nn && u < 14) return u < -17 + nn ? 'vent' : 'belly';
    if (p[1] > 47 && p[0] > -2 && az < 8.5 + nn * 1.4 && n[0] > -.2) return 'breast';
    if (p[1] > 53 && p[0] > 12 && az >= 9.5 + nn * 1.4 && az < 15) return 'grey';
    if (u > 6 && v < -2) return 'breast';
    if (az > 8 && p[1] > 39 && u > -6) return 'flank';
    if (u < -17 && v > -8) return 'rump';
    return v < -4 ? 'belly' : 'flank';
  };
  const parts = splitMesh(m, cls); const out = {};
  for (const [k, mm] of Object.entries(parts)) { L.bakeShade(mm, (p, n) => .78 + .22 * Math.max(0, n[1] * .6 + .55) + .06 * L.fbm(p[0] * .5, p[1] * .5, p[2] * .5, { octaves: 2, seed: 3 })); out[k] = fin(mm); }
  return { regions: out, shell: m };
}
// ---- bill, eye, eye ring, nostrils (built in head-local millimetres, then placed) ----
const toW = m => L.transform(m, p => headLocal(p));
const hl = p => headSdf(headLocal(p));          // the head's SDF in head-local coordinates
export function billEye() {
  const o = {};
  const up = L.intersect(L.roundCone([8, .9, 0], [25.2, -.55, 0], 2.7, .42), L.halfSpace([0, -1, 0], .75)), lo = L.intersect(L.roundCone([7.5, -2.1, 0], [23.6, -1.5, 0], 2.15, .38), L.halfSpace([0, 1, 0], -.95));
  o.bill_up = toW(bnd(L.scale(up, [1, 1, .95]), [7, -4.2, -3.6], [27, 4.2, 3.6], .42, 1, 1)); o.bill_lo = toW(bnd(lo, [6, -5, -3], [26, 1.5, 3], .42, 1, 1));
  L.bakeShade(o.bill_up, (p, n) => .8 + .2 * n[1]); L.bakeShade(o.bill_lo, (p, n) => .8 + .2 * n[1]);
  const nos = S2.map(s => bnd(L.translate(L.ellipsoid(1.0, .5, .3), [11.3, 1.2, s * 2.55]), [9.8, .4, s > 0 ? 2.0 : -3.2], [12.8, 2.1, s > 0 ? 3.2 : -2.0], .22, 1, 0));
  o.nostrils = toW(L.merge(...nos));
  const eyes = [], rings = [], ec = [];
  for (const s of S2) {
    const h = L.surfaceHit(hl, [4.4, 2.6, s * 30], [0, 0, -s], 40), c = h ? h.p : [4.4, 2.6, s * 10.4], nn = h ? L.normalAt(hl, c) : [0, 0, s]; ec.push(c);
    const ctr = sub(c, mul(nn, .45));
    eyes.push(ball(3.05, ctr, 22, 14));
    const ax = norm(nn), px = L.perp(ax), py = cross(ax, px), pts = []; for (let i = 0; i <= 28; i++) { const t = i / 28 * 2 * Math.PI; pts.push(add(add(add(ctr, mul(ax, 1.5)), mul(px, Math.cos(t) * 3.6)), mul(py, Math.sin(t) * 3.6))); }
    rings.push(L.tube(pts, .4, { sides: 5, caps: false }));
  }
  o.eye = toW(L.merge(...eyes)); o.eye_ring = toW(L.merge(...rings)); o.eyeC = ec.map(c => headLocal(c));
  return o;
}
// ---- feathers: one blade mesh (1 mm long, 1 mm wide) and a rachis, instanced with per-feather length and width ----
export function featherMeshes() {
  const w = t => { const m = .5; return t < .34 ? m * (.2 + .8 * Math.pow(t / .34, .65)) : m * Math.sqrt(Math.max(0, 1 - Math.pow((t - .34) / .66, 2.2))); };
  const blade = L.blade({ length: 1, halfWidth: w, thickness: .012, nAlong: 6, nAcross: 2, curlAlong: -.16, curlAcross: .3 });
  const shaft = L.tube([[0, -.02, 0], [0, .5, 0], [0, 1, 0]], t => 1.0 - .75 * t, { sides: 4, caps: false });
  return { feather: blade, rachis: shaft };
}
export function placeFeather(I, bx, by, bz0, dirDeg, lenMm, widMm, lift, side, tiltDeg = 0, nrmBlend = 1) {
  const zs0 = surfZ(bodySdf, bx, by, side); const bz = (zs0 === null ? Math.abs(bz0) : zs0) + lift;
  const P = [bx, by, side * bz], n0 = L.normalAt(bodySdf, [bx, by, side * (bz - lift)]);
  const dir0 = [Math.cos(dirDeg * D2R), Math.sin(dirDeg * D2R), 0];
  const nrm = norm(add(mul(n0, nrmBlend), mul([0, 0, side], 1 - nrmBlend)));
  const fr = frameYZ(dir0, nrm), q = quatBasis(fr.x, fr.y, fr.z);
  I.add(P.map(v => v * .001), q, [widMm, lenMm, 1]);
  return { P, fr };
}
export function wingFeathers(rnd) {
  const I = { prim: new L.Instances('feather'), sec: new L.Instances('feather'), tert: new L.Instances('feather'), pcov: new L.Instances('feather'), gcov: new L.Instances('feather'), mcov: new L.Instances('feather'), lcov: new L.Instances('feather'), alula: new L.Instances('feather'),
    tail: new L.Instances('feather'), utc: new L.Instances('feather'), undertc: new L.Instances('feather'), rach: new L.Instances('rachis') };
  const D = WING.dirDeg, a = [Math.cos(D * D2R), Math.sin(D * D2R)], perp = [-a[1], a[0]];   // perp points down-forward
  const rach = (P, fr, lenMm, r) => I.rach.add(P.map(v => v * .001), quatBasis(fr.x, fr.y, fr.z), [r, lenMm, r]);
  for (const s of S2) {
    const W = WING.wrist, H = WING.handEnd, El = WING.elbow;
    // primaries 1..9 (P10, the tiny outer one, is drawn too); bases along the hand from the wrist to its end
    const plen = [42, 47, 52, 55, 57, 57, 54, 50, 42], pw = [8.6, 8.8, 8.6, 8.4, 8.2, 7.9, 7.4, 6.6, 5.6];
    for (let i = 0; i < 9; i++) {
      const t = (i + .5) / 9.5, b = lerp3(W, H, t * .86 + .06), off = (i - 4) * .7;
      const bx = b[0] + perp[0] * off, by = b[1] + perp[1] * off, r = placeFeather(I.prim, bx, by, 15, D + (i - 4) * .9, plen[i], pw[i], .5 + i * .06, s);
      rach(r.P, r.fr, plen[i] * .98, .38);
    }
    { const b = lerp3(W, H, .97); const r = placeFeather(I.prim, b[0], b[1], 15, D - 6, 9, 3.2, .4, s); }   // the tiny tenth primary
    // secondaries: six along the forearm (ulna), outermost first; nearest the wrist
    const slen = [37, 38.5, 40, 40.5, 40, 38], sw = [9, 9.4, 9.6, 9.6, 9.4, 9];
    for (let i = 0; i < 6; i++) { const t = (i + .5) / 9.2, b = lerp3(W, El, t); const r = placeFeather(I.sec, b[0], b[1] - .6, 15, D + 2 + i * .4, slen[i], sw[i], 1.6 + i * .05, s); rach(r.P, r.fr, slen[i] * .98, .36); }
    // tertials: the three innermost secondaries, near the elbow
    const tlen = [30, 28.5, 27]; for (let i = 0; i < 3; i++) { const t = (6.2 + i) / 9.2, b = lerp3(W, El, Math.min(1, t)); const r = placeFeather(I.tert, b[0], b[1] - .3, 15, D + 6 + i * 3, tlen[i], 10.4, 2.3 + i * .08, s); rach(r.P, r.fr, tlen[i] * .98, .36); }
    // primary coverts: short feathers over the bases of the primaries
    for (let i = 0; i < 9; i++) { const t = (i + .5) / 9.5, b = lerp3(W, H, t * .86 + .06); placeFeather(I.pcov, b[0] + a[0] * -1.5, b[1] + a[1] * -1.5 + perp[1] * (i - 4) * .5, 15, D + (i - 4) * .8, 17 - i * .3, 5.2, 1.3 + i * .05, s); }
    // greater, median and lesser coverts over the secondaries, in three rows
    for (let i = 0; i < 9; i++) { const t = (i + .5) / 9.5, b = lerp3(W, El, t); placeFeather(I.gcov, b[0] + a[0] * 2, b[1] + a[1] * 2, 15, D + 4, 21 - i * .2, 6.4, 2.3 + i * .03, s); }
    for (let i = 0; i < 10; i++) { const t = (i + .5) / 10.2, b = lerp3(W, El, t); placeFeather(I.mcov, b[0] + a[0] * 1 + perp[0] * -2.8, b[1] + a[1] * 1 + perp[1] * -2.8, 15, D + 4, 14, 5.4, 2.9, s); }
    for (let i = 0; i < 16; i++) { const t = (i % 8 + .5) / 8.5, row = Math.floor(i / 8), b = lerp3(W, El, t); placeFeather(I.lcov, b[0] + perp[0] * (-5.2 - row * 2.6) + a[0] * (row * 1.2), b[1] + perp[1] * (-5.2 - row * 2.6) + a[1] * (row * 1.2), 15, D + 5, 9.5, 4.6, 3.4 + row * .1, s); }
    // alula: three small feathers on the thumb, at the front of the wrist
    for (let i = 0; i < 3; i++) placeFeather(I.alula, W[0] + 1.5 - i * 1.6, W[1] + .6 - i * .5, 15, D + 8 + i * 4, [11.5, 10, 8.5][i], 3.6 - i * .3, 2.6 + i * .12, s);
  }
  // tail: twelve rectrices in a closed fan; the middle pair on top
  const T = TAIL.base, td = TAIL.dirDeg, sdir = [Math.cos(td * D2R), Math.sin(td * D2R), 0], nT = [sdir[1], -sdir[0], 0];
  for (let i = 0; i < 12; i++) {
    const side = i < 6 ? 1 : -1, kk = i < 6 ? i : 11 - i, lenT = 55 - kk * .8;
    const dvec = L.rotAxis(sdir, nT, side * kk * 1.7 * D2R), fr = frameYZ(dvec, L.rotAxis(nT, sdir, side * (18 + kk * 3) * D2R)), q = quatBasis(fr.x, fr.y, fr.z);
    const P = add(add(T, mul(nT, -kk * .45 + 1.2)), [0, 0, side * (.9 + kk * 1.55)]);
    I.tail.add(P.map(v => v * .001), q, [11.5 - kk * .3, lenT, 1]); I.rach.add(P.map(v => v * .001), q, [.4, lenT * .98, .4]);
  }
  // upper tail coverts (over the base of the tail) and under tail coverts: two rows each
  for (let i = 0; i < 10; i++) { const f = (i - 4.5) / 4.5, row = i % 2; const dv = norm([Math.cos((td - 8) * D2R), Math.sin((td - 8) * D2R), f * .18]), fr = frameYZ(dv, [-.3, .95, 0]); I.utc.add([(-30 - row * 1.2) * .001, (44.5 + row * -.4) * .001, f * 8.5 * .001], quatBasis(fr.x, fr.y, fr.z), [6.2, 22 - row * 4, 1]); }
  for (let i = 0; i < 10; i++) { const f = (i - 4.5) / 4.5, row = i % 2; const dv = norm([Math.cos((td + 2) * D2R), Math.sin((td + 2) * D2R), f * .2]), fr = frameYZ(dv, [.25, -.95, 0]); I.undertc.add([(-28 - row * 1.5) * .001, (36.5 - row * .4) * .001, f * 8 * .001], quatBasis(fr.x, fr.y, fr.z), [6, 21 - row * 4, 1]); }
  return I;
}
// ---- legs and feet (right side built, left mirrored). The ankle is the visible joint ("backward knee"); the knee is hidden in the belly plumage. ----
export function legsFeet() {
  const o = { shin: [], ankle: [], tarsus: [], toes: [], hallux: [], claws: [] }, A0 = LEG.ankle, M0 = LEG.mtp;
  for (const s of S2) {
    const Z = p => [p[0], p[1], p[2] * s], A = Z(A0), M = Z(M0), K = Z(LEG.knee);
    o.shin.push(L.tube(sp([A, [A[0] + 6, 35, A[2] * .95], [K[0] - 2, 46, K[2] * .9]], 14), t => 1.55 + .75 * t, { sides: 8, caps: false }));
    o.ankle.push(ball(1.75, A, 14, 9));
    o.tarsus.push(L.tube(sp([A, lerp3(A, M, .5), M], 18), t => 1.0 + .08 * Math.sin(t * 6.28 * 4) - .12 * t, { sides: 8, caps: true }));
    const toe = (pts, r0, r1, k) => { const path = sp(pts.map(Z), 26); return L.tube(path, t => (r0 + (r1 - r0) * t) * (1 + .14 * Math.sin(t * Math.PI * k)), { sides: 7, caps: true }); };
    const claw = (tip, dir, ln, rr, curve) => { const d = norm(dir), pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([tip[0] + d[0] * ln * t, tip[1] + d[1] * ln * t - ln * curve * t * t * .55, tip[2] + d[2] * ln * t]); } return L.tube(pts, t => rr * (1 - t * .92) + .03, { sides: 6, caps: true }); };
    const F = [[[1, 3.2, 11], [6, 1.9, 8.5], [10.5, 1.2, 7.2], [14.5, .8, 6.6]], [[1, 3.2, 11], [7, 2, 11], [13, 1.2, 11], [18.5, .8, 11]], [[1, 3.2, 11], [6, 1.9, 13.8], [10.5, 1.2, 15.4], [15.5, .8, 15.9]]];
    for (let i = 0; i < 3; i++) { o.toes.push(toe(F[i], .85, .55, 3 + i)); const e = F[i][3], d0 = sub(F[i][3], F[i][2]); o.claws.push(claw(Z(e), [d0[0], d0[1], d0[2] * s], 3.2, .5, .9)); }
    const Hx = [[1, 3.2, 11], [-2.5, 2.4, 10.8], [-6.5, 1.4, 10.6], [-9.6, .9, 10.5]]; o.hallux.push(toe(Hx, .95, .6, 2)); o.claws.push(claw(Z(Hx[3]), [-1, -.25, 0], 6.6, .6, 1.1));
  }
  const out = {}; for (const k of Object.keys(o)) out[k] = fin(L.merge(...o[k]));
  return out;
}
