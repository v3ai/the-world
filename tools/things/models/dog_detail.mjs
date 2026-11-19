// Surface details (ears, nose, claws, pads, eyes, fur) and the cut-open interiors (eye, ear, nose)
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, bone, place, S, ell, ellA, rod, smoothS, unionS, subS, meshS, SIDES } from './dog_lib.mjs';
import { FORE, HIND } from './dog_rig.mjs';

import { EYE_C, eyeAxis } from './dog_head.mjs';
export { EYE_C, eyeAxis };
export const EYE_R = .0108;
const spherePatch = (rad, phi0, phi1, th0, th1, nu = 12, nv = 12) => { const m = L.newMesh(); for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const ph = phi0 + (phi1 - phi0) * i / nu, th = th0 + (th1 - th0) * j / nv; m.pos.push(rad * Math.sin(ph) * Math.cos(th), -rad * Math.cos(ph), rad * Math.sin(ph) * Math.sin(th)); }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; m.idx.push(a, c, b, b, c, d); } return m; };
const lat = (m, s) => { const a = eyeAxis(s), e = L.norm(L.sub([0, 1, 0], L.mul(a, a[1]))); return place(m, P(...EYE_C.map((v, i) => i === 2 ? s * v : v)), e, a); };
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
export function plateMesh() { return L.blade({ length: .036, halfWidth: t => .0055 * Math.sin(Math.PI * (.12 + .88 * t)) ** .6, thickness: .0009, nAlong: 6, nAcross: 3, curlAcross: 2.2 }); }
// rotate blade so its length runs along x
export function plateMeshX() { return L.transform(plateMesh(), p => [p[1], p[0], p[2]]); }
