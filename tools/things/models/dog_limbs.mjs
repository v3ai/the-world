// Limb bones, pelvis, shoulder blade, baculum
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, bone, place, S, ell, rod, smoothS, unionS, subS, meshS, SIDES } from './dog_lib.mjs';
import { FORE, HIND, SPINE, DX } from './dog_rig.mjs';

const z = (p, s, zc) => P(p[0], p[1], s * zc);
export function limbBones() {
  const meshes = {};
  const F = FORE, H = HIND;
  const side = (s, build) => build(s);
  // ---- forelimb (per side) ----
  for (const s of SIDES) {
    const k = s > 0 ? 'r' : 'l';
    const sh = z(F.glen, s, F.zS), dorsal = z(F.sc0, s, 3.2), el = z(F.elbow, s, F.zE), ca = z(F.carpus, s, F.zC), mc = z(F.mcp, s, F.zP);
    // scapula: a flat blade with a spine along its length and an acromion at the shoulder end
    { const ax = L.norm(L.sub(sh, dorsal)), len = L.len(L.sub(sh, dorsal));
      const poly = [[0, -.012], [.2 * len, -.034], [.7 * len, -.03], [len * 1.0, -.017], [len * 1.04, 0], [len * .96, .017], [.7 * len, .038], [.18 * len, .046], [-.004, .03], [-.008, 0]];
      let b = L.extrudeOutline(poly.map(([a, c]) => [a, c]), .004);
      const spineRidge = bone([.03, .004, 0], [len * .98, .0, 0], .004, .006, .006, { sides: 5, n: 8 });
      b = L.merge(b, L.transform(spineRidge, p => [p[0], p[1], p[2] + .005 * 1]));
      const placed = place(b, dorsal, ax, [0, 0, s]);   // blade lies in the plane spanned by the axis and `y`; plane normal points sideways
      meshes['scapula_' + k] = placed; }
    meshes['humerus_' + k] = L.merge(bone(sh, el, .0085, .015, .013, { sides: 10, e: .2, bow: .06, bowDir: [0, 0, -s] }));
    { const r = bone(z(F.elbow, s, F.zE - .5), ca, .0085, .011, .0125, { sides: 9, e: .18, bow: .03, bowDir: [1, 0, 0] });
      const u = bone(P(F.elbow[0] - 2.3, F.elbow[1] + 3.2, s * (F.zE + .3)), z([F.carpus[0] - .8, F.carpus[1] + .8], s, F.zC + 1.4), .0055, .012, .007, { sides: 8, e: .15 });
      meshes['radius_ulna_' + k] = L.merge(r, u); }
    { const cb = []; const base = z(F.carpus, s, F.zC); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cb.push(D.meshS(D.sphereS(L.add(base, [Math.cos(a) * .006 * (i < 6 ? 1 : 0), Math.sin(a) * .004, (i < 6 ? (i % 3 - 1) * .006 * s : 0) + (i === 6 ? -.009 : 0)]), .0052), .0022)); }
      meshes['carpus_' + k] = L.merge(...cb); }
    { const m = []; for (let d = 0; d < 4; d++) { const zo = (d - 1.5) * 1.5, a = z([F.carpus[0] + .4, F.carpus[1] - 1, 0], s, F.zP + zo * .8 + 0), b = z(F.mcp, s, F.zP + zo); m.push(bone([a[0], a[1], s * (F.zC * .01 + zo * .01 * .9)], [b[0] + 0, b[1], s * (F.zP * .01 + zo * .01)], .0036, .0052, .0058, { sides: 7, e: .22, n: 5 })); }
      meshes['metacarpals_' + k] = L.merge(...m); }
    { const ph = []; for (let d = 0; d < 4; d++) { const zo = (d - 1.5) * 1.5, o = [F.mcp[0], F.mcp[1], 0]; const p0 = [o[0] * .01, o[1] * .01, s * (F.zP + zo) * .01], p1 = [(o[0] + 3.2) * .01, (o[1] - 2.2) * .01, p0[2] + s * .004 * (d - 1.5) * .3], p2 = [(o[0] + 5.2) * .01, .018, p1[2]], p3 = [(o[0] + 6.6) * .01, .013, p1[2] + s * .0012 * (d - 1.5)];
        ph.push(bone(p0, p1, .0036, .0046, .0042, { sides: 6, n: 4 })); ph.push(bone(p1, p2, .0033, .0042, .0036, { sides: 6, n: 4 })); ph.push(L.tube([p2, p3], t => .0034 * (1 - .85 * t), { sides: 6 })); }
      meshes['phalanges_f_' + k] = L.merge(...ph); }
    { const dc = z([F.carpus[0] + 1.2, F.carpus[1] - 1.2], s, F.zC - 2.1); const d0 = dc, d1 = L.add(dc, [.003, -.025, -s * .008]), d2 = L.add(d1, [.002, -.014, -s * .005]);
      meshes['dewclaw_' + k] = L.merge(bone(d0, d1, .0034, .0046, .004, { sides: 6, n: 3 }), L.tube([d1, d2], t => .0034 * (1 - .8 * t), { sides: 6 })); }
    // ---- hindlimb ----
    const hip = z(H.hip, s, H.zH), kn = z(H.stifle, s, H.zK), hk = z(H.hock, s, H.zT), mt = z(H.mtp, s, H.zP);
    meshes['femur_' + k] = bone(hip, kn, .0105, .018, .017, { sides: 10, e: .2, bow: .04, bowDir: [1, 0, 0] });
    meshes['patella_' + k] = D.meshS(D.ell(L.add(kn, [.021, .004, 0]), [0, 1, 0], .009, .0065, .0045), .0025);
    { const t = bone(kn, hk, .0085, .015, .011, { sides: 9, e: .18, bow: .03, bowDir: [1, 0, 0] }), f = bone(L.add(kn, [-.006, -.01, s * .006]), L.add(hk, [.003, .008, s * .006]), .0025, .004, .004, { sides: 5, n: 8 });
      meshes['tibia_fibula_' + k] = L.merge(t, f); }
    { const cal = bone(L.add(hk, [-.003, .0, 0]), z(H.heel, s, H.zT + .2), .0072, .008, .0105, { sides: 8, e: .25, n: 6 });
      const tal = D.meshS(D.ell(L.add(hk, [.011, .004, 0]), [1, 0, 0], .011, .0095, .008), .0028);
      const oth = []; for (let i = 0; i < 4; i++) oth.push(D.meshS(D.sphereS(L.add(hk, [.004 + (i % 2) * .008, -.014 - Math.floor(i / 2) * .006, (i - 1.5) * .0045 * s]), .0045), .0024));
      meshes['tarsus_' + k] = L.merge(cal, tal, ...oth); }
    { const m = []; for (let d = 0; d < 4; d++) { const zo = (d - 1.5) * 1.5; m.push(bone([hk[0] + .0, hk[1] - .016, s * (H.zT + zo * .8) * .01], [mt[0], mt[1] + .0, s * (H.zP + zo) * .01], .0036, .005, .0055, { sides: 7, e: .22, n: 5 })); }
      meshes['metatarsals_' + k] = L.merge(...m); }
    { const ph = []; for (let d = 0; d < 4; d++) { const zo = (d - 1.5) * 1.5, p0 = [mt[0], mt[1], s * (H.zP + zo) * .01], p1 = [mt[0] + .031, mt[1] - .021, p0[2] + s * .0006 * (d - 1.5)], p2 = [mt[0] + .05, .018, p1[2]], p3 = [mt[0] + .063, .013, p1[2]];
        ph.push(bone(p0, p1, .0036, .0046, .0042, { sides: 6, n: 4 })); ph.push(bone(p1, p2, .0033, .0042, .0036, { sides: 6, n: 4 })); ph.push(L.tube([p2, p3], t => .0034 * (1 - .85 * t), { sides: 6 })); }
      meshes['phalanges_h_' + k] = L.merge(...ph); }
  }
  // ---- pelvis: ilium wing, acetabulum, ischium, pubis; two halves joined at the symphysis ----
  { const half = s => { const sh = [];
      sh.push(ell(P(-30 + DX, 46.5, s * 6.8), [.45, .35, 0], .062, .035, .005));            // ilium wing (a flat blade, tilted)
      sh.push(ell(P(-31 + DX, 44, s * 5.6), [1, -.2, 0], .045, .015, .007));                    // iliac body
      sh.push(ell(P(-34.5 + DX, 39.8, s * 7.4), [1, 0, 0], .014, .014, .012));                 // acetabulum
      sh.push(rod(P(-35 + DX, 40.5, s * 6.5), P(-42.8 + DX, 42.5, s * 3.6), .006, .009));            // ischium
      sh.push(rod(P(-35 + DX, 39, s * 6), P(-36.6 + DX, 36.5, s * 1.5), .005, .005));                // pubis
      sh.push(rod(P(-36.6 + DX, 36.5, s * 1.5), P(-43.2 + DX, 40.2, s * 1.2), .0055, .0075));        // symphysis plate
      return smoothS(.006, ...sh); };
    const both = L.merge(meshS(half(1), .0036), meshS(half(-1), .0036)); meshes.pelvis = both; }
  // ---- baculum (os penis): a grooved rod in the penis under the abdomen ----
  meshes.baculum = bone(P(-12.5, 32.2, 0), P(-21.5, 34.6, 0), .0034, .0045, .0034, { sides: 7, e: .25, n: 6 });
  return meshes;
}
