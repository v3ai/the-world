// Surface details (ears, nose, claws, pads, eyes, fur) and the cut-open interiors (eye, ear, nose)
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, bone, place, S, ell, ellA, rod, smoothS, unionS, subS, meshS, SIDES } from './dog_lib.mjs';
import { FORE, HIND } from './dog_rig.mjs';

export const EYE_C = [41.6, 63.4, 4.5], EYE_R = .0108;
export const eyeAxis = s => L.norm([.94, 0, s * .34]);
const spherePatch = (rad, phi0, phi1, th0, th1, nu = 12, nv = 12) => { const m = L.newMesh(); for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const ph = phi0 + (phi1 - phi0) * i / nu, th = th0 + (th1 - th0) * j / nv; m.pos.push(rad * Math.sin(ph) * Math.cos(th), -rad * Math.cos(ph), rad * Math.sin(ph) * Math.sin(th)); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; m.idx.push(a, c, b, b, c, d); } return m; };
const lat = (m, s) => { const a = eyeAxis(s); return place(m, P(...EYE_C.map((v, i) => i === 2 ? s * v : v)), [0, 1, 0], a); };
const R = EYE_R, DEG = Math.PI / 180;

export function eyes() {
  const m = {};
  const globe = s => lat(D.meshS(D.ellA([0, 0, 0], R, R, R), .0016), s);
  m.eye_globe = L.merge(...SIDES.map(s => lat(L.transform(L.lathe([[0, -R], [R * .5, -R * .87], [R * .87, -R * .5], [R, 0], [R * .9, R * .44], [R * .62, R * .78]], { segments: 20, caps: false }), p => p), s)));
  m.eye_front = L.merge(...SIDES.map(s => lat(L.merge(L.lathe([[R * .62, R * .78], [R * .45, R * .9], [R * .25, R * .98], [0, R * 1.0]], { segments: 20, caps: false })), s)));
  // interiors, built in the eye's own frame (axis +y, up +x)
  const perSide = fn => L.merge(...SIDES.map(s => lat(fn(s), s)));
  m.eye_sclera = perSide(() => spherePatch(R, 0, 104 * DEG, 0, 2 * Math.PI, 18, 24));
  m.eye_choroid = perSide(() => spherePatch(R * .975, 4 * DEG, 86 * DEG, 95 * DEG, 265 * DEG, 14, 18));
  m.eye_tapetum = perSide(() => spherePatch(R * .965, 6 * DEG, 78 * DEG, -82 * DEG, 82 * DEG, 14, 18));
  m.eye_retina = perSide(() => spherePatch(R * .95, 0, 106 * DEG, 0, 2 * Math.PI, 18, 24));
  m.eye_vitreous = perSide(() => D.meshS(D.ellA([0, 0, 0], R * .9, R * .9, R * .9), .0016));
  m.eye_lens = perSide(() => D.meshS(D.ellA([0, R * .24, 0], R * .5, R * .34, R * .5), .0012));
  m.eye_cornea = perSide(() => L.lathe([[R * .62, R * .78], [R * .5, R * .9], [R * .26, R * .99], [0, R * 1.02]], { segments: 20, caps: false }));
  m.eye_iris = perSide(() => L.lathe([[R * .17, R * .56], [R * .62, R * .6]], { segments: 22, caps: false }));
  return m;
}
export function ears() {
  const m = {}; const poly = []; const Lh = .11, W = .034;
  for (let i = 0; i <= 16; i++) { const t = i / 16; poly.push([-W * (1 - t * .55) * (t > .88 ? Math.sqrt(1 - ((t - .88) / .12) ** 2 * .9) : 1), -Lh * t]); } for (let i = 16; i >= 0; i--) { const t = i / 16; poly.push([W * (1 - t * .55) * (t > .88 ? Math.sqrt(1 - ((t - .88) / .12) ** 2 * .9) : 1), -Lh * t]); }
  const clean = []; for (const p of poly) if (!clean.length || Math.hypot(p[0] - clean[clean.length - 1][0], p[1] - clean[clean.length - 1][1]) > 1e-5) clean.push(p);
  const side = s => { const o = P(36.2, 67.2, s * 5.2), A = [1, 0, 0], Dn = L.norm([-.12, -.94, s * .3]);
    return L.transform(L.extrudeOutline(clean, .0035), p => { const u = p[0], v = -p[1], w = p[2], fold = .012 * (u / W) ** 2, hang = v / Lh; const base = L.add(o, L.add(L.mul(Dn, v), L.mul(A, u * (1 + .0))));
      return [base[0] + .02 * hang * hang - fold * .3, base[1], base[2] + s * (fold + .025 * Math.sin(hang * 2.2) * 1) + w]; }); };
  m.ears = L.merge(side(1), side(-1));
  return m;
}
export function nose() {
  const m = {}; const nose = ellA(P(52.2, 56.2, 0), .018, .0165, .03), slit = s => ell(P(53.2, 56.2, s * 1.2), [.5, 0, s * 1.0], .008, .0042, .003);
  m.nose = meshS(subS(nose, unionS(slit(1), slit(-1)), .0015), .002);
  return m;
}
export function paws() {
  const m = {}, pads = [], claws = [];
  const addFoot = (s, toe0, toe1, toe2, zc, mcX, mcY, hind) => { for (let d = 0; d < 4; d++) { const zo = (d - 1.5) * 1.5, z0 = s * (zc + zo) * .01; pads.push(D.meshS(D.ell([toe0[0] + .026 + (d === 1 || d === 2 ? .004 : 0), .0075, z0 * 1], [1, 0, 0], .0125, .0072, .0085), .0035));
      claws.push(L.tube([[toe2[0], .006, z0], [toe2[0] + .012, .0035, z0], [toe2[0] + .022, .0004, z0]], t => .0032 * (1 - .85 * t), { sides: 5 })); }
    pads.push(D.meshS(D.ell([mcX * .01 + .008, .0085, s * zc * .01], [1, 0, 0], .018, .0085, .0155), .0035)); };
  for (const s of SIDES) { addFoot(s, [FORE.mcp[0] * .01, 0], 0, [(FORE.mcp[0] + 5.2) * .01, 0], FORE.zP, FORE.mcp[0], 0, false);
    const dc = P(FORE.carpus[0] + 1.2, FORE.carpus[1] - 1.2, s * (FORE.zC - 2.1)); claws.push(L.tube([L.add(dc, [.004, -.039, -s * .013]), L.add(dc, [.007, -.049, -s * .015]), L.add(dc, [.008, -.056, -s * .016])], t => .0028 * (1 - .8 * t), { sides: 5 }));
    pads.push(D.meshS(D.ell(P(FORE.carpus[0] - 1, FORE.carpus[1] - 1.3, s * (FORE.zC + .8)), [0, 1, 0], .008, .007, .006), .002));
    addFoot(s, [HIND.mtp[0] * .01, 0], 0, [(HIND.mtp[0] + 5) * .01, 0], HIND.zP, HIND.mtp[0], 0, true); }
  m.paw_pads = L.merge(...pads); m.claws = L.merge(...claws);
  return m;
}
export function furBlade() { const m = L.newMesh(); m.pos.push(-.0012, 0, 0, .0012, 0, 0, 0, .014, .0014, 0, 0, -.0012, 0, 0, .0012, 0, .014, .0004); m.idx.push(0, 1, 2, 3, 4, 5); return m; }   // unused alias
// fur: short tapered blades lying on the coat, pointing from head to tail
export function fur(coat, n = 12000, seed = 9) {
  const r = L.rng(seed), p = coat.pos, idx = coat.idx, nv = p.length / 3, nrm = new Float32Array(nv * 3);
  for (let i = 0; i < idx.length; i += 3) { const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3, u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]], v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]], q = L.cross(u, v); for (const k of [a, b, c]) { nrm[k] += q[0]; nrm[k + 1] += q[1]; nrm[k + 2] += q[2]; } }
  const inst = new L.Instances('fur_blade'); const step = Math.max(1, Math.floor(nv / n));
  for (let i = 0; i < nv; i += step) { const o = [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]], nn = L.norm([nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]]); if (o[1] < .028) continue;
    let flow = L.norm(L.sub([-1, -.12, 0], L.mul(nn, L.dot([-1, -.12, 0], nn)))); const lean = .9 + r() * .3, dir = L.norm(L.add(L.mul(flow, lean), L.mul(nn, .55)));
    inst.add(L.add(o, L.mul(nn, -.002)), L.quatFromTo([0, 1, 0], dir), .75 + r() * .6); }
  return inst;
}
export function furBladeMesh() { const m = L.newMesh(); const w = .0011, h = .016; m.pos.push(-w, 0, 0, w, 0, 0, 0, h, 0, 0, 0, -w, 0, 0, w, 0, h, 0); m.idx.push(0, 1, 2, 3, 4, 5); return m; }
// ---------- nose cut-open: turbinates, as thin curled plates inside the nasal cavity ----------
export function turbinates() {
  const r = L.rng(21), olf = new L.Instances('turb_plate'), resp = new L.Instances('turb_plate');
  for (let i = 0; i < 46; i++) { const back = i < 28, x = back ? 41.8 + r() * 3.6 : 45.6 + r() * 4.6, ang = r() * Math.PI * 2, rad = .004 + r() * .006, sz = back ? .7 + r() * .5 : .8 + r() * .7;
    const o = P(x, 59.3 + Math.sin(ang) * rad * 100 * .75, Math.cos(ang) * rad * 100 * .9), q = L.quatAxisAngle([1, 0, 0], ang + Math.PI / 2); (back ? olf : resp).add(o, q, sz); }
  return { olf, resp };
}
export function plateMesh() { return L.blade({ length: .036, halfWidth: t => .0055 * Math.sin(Math.PI * (.12 + .88 * t)) ** .6, thickness: .0009, nAlong: 6, nAcross: 3, curlAcross: 2.2 }); }
// rotate blade so its length runs along x
export function plateMeshX() { return L.transform(plateMesh(), p => [p[1], p[0], p[2]]); }
// ---------- ear cut-open: canal, eardrum, bulla, cochlea, canals ----------
export function earInner() {
  const m = {};
  const mk = s => { const z = k => s * k; return {
    canal: L.tube(L.spline([P(36.4, 66, z(6.2)), P(36, 62.5, z(6.5)), P(35.6, 60.4, z(6)), P(35.5, 60.2, z(4.5))]).sample ? L.spline([P(36.4, 66, z(6.2)), P(36, 62.5, z(6.5)), P(35.6, 60.4, z(6)), P(35.5, 60.2, z(4.6))]).sample(18) : [], .0042, { sides: 10 }),
    drum: place(L.lathe([[0, 0], [.0055, 0]], { segments: 14, caps: false }), P(35.5, 60.2, z(4.3)), [0, 1, 0], [0, 0, s]),
    bulla: D.meshS(D.ell(P(35.4, 59.6, z(3.6)), [0, 1, .2 * s], .012, .011, .0105), .0018),
    cochlea: L.tube(L.spline([...Array(22)].map((_, i) => { const t = i / 21, a = t * Math.PI * 5.2, rr = .0048 * (1 - .75 * t); return P(35.4 + Math.cos(a) * rr * 100, 60.7 + t * .5, z(2.9) + Math.sin(a) * rr * 100); })).sample(60), .0013, { sides: 5 }),
    canals: L.merge(...[[0, 0, 1], [1, 0, 0], [0, 1, 0]].map((ax, k) => L.tube(L.spline([...Array(14)].map((_, i) => { const a = i / 13 * Math.PI * 1.7 + .3; return [(35.0 * .01 + Math.cos(a) * .0058 * (ax[0] ? 0 : 1) * (k === 0 ? 1 : .8)), 60.9 * .01 + Math.sin(a) * .0058 * (k === 0 ? 1 : ax[1] ? 0.1 : 1), z(1.8) * .01 + (k === 1 ? Math.cos(a) * .0058 : k === 2 ? Math.sin(a) * .0058 : 0)]; })).sample(30), .0009, { sides: 5 })))
  }; };
  const a = mk(1), b = mk(-1);
  for (const k of Object.keys(a)) m['ear_' + k] = L.merge(a[k], b[k]);
  return m;
}
