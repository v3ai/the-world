// The common earthworm (Lumbricus terrestris) in its vertical burrow: head up, dorsal side toward +x.
// Built in millimetres along y (head at y = 0, tail at y = -L), then scaled to metres and placed in the block.
import * as L from '../lib/index.mjs';
import { uvSphere, place, tubeM, spl } from './soil_lib.mjs';
import { BURROW_X } from './soil_ground.mjs';

export const WORM = {
  len: 170,        // mm: Lumbricus terrestris is "generally 110-200 mm" (Wikipedia) and 90-300 mm when mature (E-Fauna BC); a 170 mm adult is drawn
  diam: 8,         // mm: "about 7-10 mm in diameter" (Wikipedia, Lumbricus terrestris)
  segs: 150,       // "around 120-170 segments, often 135-150" (Wikipedia)
  y0: -.045,       // m: where the head sits below the surface
  clit: [36, 45],  // mm along the body: a swollen band toward the front (the card gives no segment numbers)
  hearts: [7, 11], // five pairs in segments 7 to 11 (Wikipedia, Earthworm)
};
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default function worm(R) {
  const meshes = {}, instances = {}, { len: Ln, segs: N } = WORM, seg = Ln / N, rBody = WORM.diam / 2;
  const R0 = s => { const front = .3 + .7 * sm(0, 16, s), rear = 1 - .78 * Math.pow(sm(Ln - 38, Ln, s), 1.1); return rBody * Math.min(front, rear) * (1 + .03 * Math.sin(s / Ln * 6.28)); };
  const groove = s => { const u = (s / seg) % 1; return 1 - .04 * Math.pow(.5 + .5 * Math.cos(u * 6.2832), 5); };
  const clitBump = s => 1 + .07 * sm(WORM.clit[0], WORM.clit[0] + 2, s) * (1 - sm(WORM.clit[1] - 2, WORM.clit[1], s));
  const lat = (rf, s0, s1, ns, sides = 16) => { const prof = []; for (let i = 0; i <= ns; i++) { const s = s1 - (s1 - s0) * i / ns; prof.push([Math.max(rf(s), 1e-4), -s]); } let m = L.lathe(prof, { segments: sides, caps: true }); m = L.weld(m, 1e-7); return L.signedVolume(m) < 0 ? L.flip(m) : m; };
  const put = m => place(L.scaleMesh(m, .001), [BURROW_X, WORM.y0, 0]);
  const dorsalShade = (p, n) => .66 + .34 * (.5 + .5 * n[0]);   // darker on the back (+x), paler underneath

  // ---- outside: skin with its segment furrows, the head lobe, the clitellum band, the setae ----
  meshes.worm_skin = L.bakeShade(put(lat(s => R0(s) * groove(s) * clitBump(s), 1.4, Ln, N * 5, 16)), dorsalShade);
  { const head = L.translateMesh(L.scaleMesh(uvSphere(1, 14, 8), [2.5, 1.9, 2.5]), [0, 0, 0]);   // the prostomium: a lobe in front of the mouth (the worm has no eyes)
    meshes.worm_head = L.bakeShade(put(L.translateMesh(head, [0, -.6, 0])), dorsalShade); }
  { const [c0, c1] = WORM.clit; meshes.worm_clitellum = L.bakeShade(put(lat(s => R0(s) * clitBump(s) * 1.035 * (.88 + .12 * sm(c0, c0 + 1.5, s) * (1 - sm(c1 - 1.5, c1, s))), c0, c1, 24, 20)), (p, n) => .78 + .22 * (.5 + .5 * n[0])); }
  { // seta: a short curved bristle, 3 sides, 0.5 mm long
    meshes.seta = L.tube([[0, 0, 0], [0, -.0003, .0005]], .00006, { sides: 3, caps: false });
    const si = new L.Instances('seta'), ang = [10, 26, 58, 76].flatMap(a => [a, -a]).map(a => a * Math.PI / 180);
    for (let n = 1; n < N; n++) { const s = (n + .55) * seg; if (s > Ln - 3) break; const r = R0(s) * clitBump(s) * .985 / 1000;
      for (const a of ang) { // a = 0 points to the underside (-x); the bristle leans backwards (toward the tail, -y)
        const out = [-Math.cos(a), 0, Math.sin(a)], dir = L.norm([out[0], -.35, out[2]]);
        si.add([BURROW_X + out[0] * r, WORM.y0 - s / 1000, out[2] * r], L.quatFromTo([0, 0, 1], dir), 1); } }
    instances.worm_setae = si; }

  // ---- inside (drawn only in cut views): body wall in three layers, the coelom, the gut, vessels, hearts, nerve cord, brain ----
  const wall = { skin: 0, circ: .08, long: .24, coel: .66 };   // radial depths in mm of each layer's inner face: illustrative proportions, thin circular layer outside a thicker longitudinal layer
  meshes.worm_circ = put(lat(s => Math.max(R0(s) - wall.circ, .05), 1.6, Ln - .5, 70, 16));
  meshes.worm_long = put(lat(s => Math.max(R0(s) - wall.long, .05), 1.8, Ln - .8, 70, 16));
  meshes.worm_coelom = put(lat(s => Math.max(R0(s) - wall.coel, .05), 2.0, Ln - 1.2, 70, 16));
  const gutR = s => (s < 2.3 ? 0 : s < 5.7 ? 1.55 * Math.sin((s - 2.3) / 3.4 * Math.PI * .5 + .6) : s < 14 ? .72 : s < 19.5 ? .55 + 1.45 * sm(14, 15.6, s) * (1 - sm(18.4, 19.5, s)) : s < 23.5 ? 1.7 : Math.min(1.55, R0(s) * .38));
  const part = (s0, s1, rf, ns = 24, sides = 14) => put(lat(rf, s0, s1, ns, sides));
  meshes.worm_pharynx = part(2.3, 5.7, s => 1.5 * Math.sin((s - 2.0) / 3.7 * Math.PI) + .35, 14);
  { const o = [part(5.7, 14, s => .72, 12, 10)];   // the oesophagus with its two pairs of lime pouches (calciferous glands), the second pair behind the fifth heart
    for (const [s, r, zz] of [[10.6, .62, 1.0], [10.6, .62, -1.0], [12.8, .66, 1.1], [12.8, .66, -1.1]]) o.push(put(L.translateMesh(L.scaleMesh(uvSphere(1, 10, 6), [r * .9, r * 1.35, r * .9]), [0, -s, zz])));
    meshes.worm_oesophagus = L.merge(...o); }
  meshes.worm_crop = part(14, 19.5, s => .6 + 1.4 * sm(14, 15.6, s) * (1 - sm(18.4, 19.5, s)), 14);
  meshes.worm_gizzard = part(19.5, 23.5, s => 1.7 * (.85 + .15 * Math.sin((s - 19.5) / 4 * 3.14)), 10);
  meshes.worm_intestine = part(23.5, Ln - 4, s => Math.min(1.45, R0(s) * .36 + .1), 80, 12);
  meshes.worm_gutcontent = part(24, Ln - 6, s => Math.min(1.45, R0(s) * .36 + .1) * .55, 70, 10);
  // blood vessels: dorsal vessel (blood runs toward the head) and ventral vessel (toward the tail), with the five pairs of hearts looping round the oesophagus
  const xd = s => gutR(s) + .38 + (s > 24 ? 0 : 0);
  meshes.worm_dorsal_vessel = put(L.tube(Array.from({ length: 60 }, (_, i) => { const s = 6 + (Ln - 12) * i / 59; return [Math.max(gutR(s), 1.0) + .22, -s, 0]; }), .27, { sides: 8, caps: true }));
  meshes.worm_ventral_vessel = put(L.tube(Array.from({ length: 60 }, (_, i) => { const s = 5 + (Ln - 10) * i / 59; return [-(Math.max(gutR(s), 1.0) + .22), -s, 0]; }), .3, { sides: 8, caps: true }));
  { const hs = []; for (let n = WORM.hearts[0]; n <= WORM.hearts[1]; n++) { const s = (n - .5) * seg; for (const side of [1, -1]) { const pts = []; for (let k = 0; k <= 14; k++) { const th = k / 14 * Math.PI, Rr = .72 + .36; pts.push([Math.cos(th) * (Rr + .15), -s - .14 * Math.sin(th), Math.sin(th) * Rr * side * 1.0]); } hs.push(L.tube(pts, .26, { sides: 7, caps: true })); } }
    meshes.worm_hearts = put(L.merge(...hs)); }
  { const pts = Array.from({ length: 140 }, (_, i) => { const s = 4.2 + (Ln - 9) * i / 139; return [-(Math.max(gutR(s), 1.0) + .9), -s, 0]; });
    meshes.worm_nerve_cord = put(L.tube(pts, t => { const s = 4.2 + (Ln - 9) * t, u = (s / seg) % 1; return .26 + .13 * Math.pow(Math.cos((u - .5) * 3.14), 2) * (s > 5 * seg ? 1 : .4); }, { sides: 8, caps: true })); }
  { const b = [], ell = (c, r) => L.translateMesh(L.scaleMesh(uvSphere(1, 10, 6), r), c);
    b.push(ell([.9, -2.7, .75], [.5, .45, .55]), ell([.9, -2.7, -.75], [.5, .45, .55]));            // the brain: a pair of cerebral ganglia on top of the pharynx (segment 3)
    b.push(ell([-1.7, -4.3, 0], [.6, .55, .7]));                                                       // the ganglion under the pharynx
    for (const sd of [1, -1]) b.push(L.tube(spl([[.9, -2.7, .75 * sd], [1.5, -3.4, 1.35 * sd], [.1, -4.0, 1.7 * sd], [-1.5, -4.2, .8 * sd]], 8), .2, { sides: 6, caps: true }));   // the two connectives around the pharynx
    meshes.worm_brain = put(L.merge(...b)); }
  return { meshes, instances };
}
