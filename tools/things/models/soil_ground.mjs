// The soil block's ground: horizons, turf, litter, flint pebbles, crumbs and pores, oak roots, fungal threads, the burrow and the worm cast.
import * as L from '../lib/index.mjs';
import { BLK, bnd, slab, uvSphere, tubeM, spl, place } from './soil_lib.mjs';

export const BURROW_X = -0.28;   // the earthworm's burrow runs straight down here (x, z = 0)
export const CRUMBS = { x: [0.06, 0.42], y: [-0.215, -0.07] };   // the patch of the topsoil face drawn with its crumbs

export default function ground(R) {
  const meshes = {}, instances = {};
  const { w, d } = BLK;

  // ---- the four horizons as closed slabs whose boundaries undulate a little ----
  const H = [['o', 0, 1], ['a', 1, 2], ['b', 2, 3], ['c', 3, 4]];
  for (const [id, k0, k1] of H) {
    const m = slab((x, z) => bnd(k0, x, z) - (k0 === 0 ? .0015 : 0), (x, z) => bnd(k1, x, z), { nx: 30, nz: 10 });
    meshes['hor_' + id] = L.bakeShade(m, (p, n) => .82 + .18 * (.5 + .5 * L.fbm(p[0] * 9, p[1] * 9, p[2] * 9, { octaves: 2, seed: 11 + k0 })));
  }

  // ---- grass: single blades (5 triangles) in tufts; mowed lawn about 4 cm; the density is illustrative ----
  { const blade = L.newMesh(), segs = 3, h = .042, hw = .0016;
    for (let i = 0; i <= segs; i++) { const t = i / segs, y = h * t, zf = .012 * t * t, ww = i === segs ? 0 : hw * (1 - .55 * t); blade.pos.push(-ww, y, zf, ww, y, zf); }
    for (let i = 0; i < segs; i++) { const a = i * 2, b = a + 1, c = a + 2, dd = a + 3; if (i === segs - 1) blade.idx.push(a, b, c); else blade.idx.push(a, b, dd, a, dd, c); }
    meshes.blade = L.bakeShade(blade, (p) => .55 + .45 * p[1] / h);
    const g = new L.Instances('blade'), n = 1000;
    for (let i = 0; i < n; i++) {
      const cx = R.range(-w / 2 + .01, w / 2 - .01), cz = R.range(-d / 2 + .01, d / 2 - .01);
      for (let k = 0; k < 5; k++) { const a = R.range(0, 6.283), r = R.range(0, .012), yy = -.004;
        g.add([cx + Math.cos(a) * r, yy, cz + Math.sin(a) * r], L.quatMul(L.quatAxisAngle([0, 1, 0], R.range(0, 6.283)), L.quatAxisAngle([1, 0, 0], R.range(-.18, .12))), R.range(.75, 1.3)); }
    }
    instances.grass = g;
    // middle distance: a plain tuft card of the same size (2 triangles) so the lawn still reads from a few metres
    const card = L.newMesh(); card.pos.push(-.012, 0, 0, .012, 0, 0, .004, .042, .006, -.004, .042, .006); card.idx.push(0, 1, 2, 0, 2, 3);
    meshes.tuft = L.bakeShade(card, p => .55 + .45 * p[1] / .042);
    const t2 = new L.Instances('tuft'); for (let i = 0; i < 700; i++) t2.add([R.range(-w / 2, w / 2), -.004, R.range(-d / 2, d / 2)], L.quatAxisAngle([0, 1, 0], R.range(0, 6.283)), R.range(.8, 1.4));
    instances.grass_mid = t2; }

  // ---- oak leaves lying on the lawn edge, about 10 cm long (the oak card gives 10 to 12 cm); some half rotted ----
  { const lobed = t => .5 * Math.sin(Math.PI * Math.pow(t, .8)) * (1 + .22 * Math.sin(t * Math.PI * 7));
    meshes.leaf = L.bakeShade(L.blade({ length: 1, halfWidth: t => .42 * lobed(t) / .5 * .8, thickness: .006, nAlong: 6, nAcross: 1, curlAcross: .2, curlAlong: .35 }), (p, n) => .7 + .3 * n[2]);
    const lit = new L.Instances('leaf');
    for (let i = 0; i < 46; i++) { const x = R.range(-.05, w / 2 - .06) + (R.range(0, 1) < .3 ? R.range(-.5, 0) : 0), z = R.range(-d / 2 + .05, d / 2 - .05);
      const q = L.quatMul(L.quatAxisAngle([0, 1, 0], R.range(0, 6.283)), L.quatAxisAngle([1, 0, 0], -Math.PI / 2 + R.range(-.14, .14)));
      lit.add([x, R.range(.002, .012), z], q, R.range(.08, .12)); }
    instances.litter = lit; }

  // ---- flint pebbles: rounded, dark, a few centimetres across (the Blackheath pebbles are rounded flint; the sizes here are a modelling choice) ----
  { const pebble = (rx, ry, rz, seed) => L.noiseDisplace(L.ellipsoid(rx, ry, rz), { amp: .06 * rx, freq: 1 / rx, octaves: 2, seed });
    const merge = (list, name) => { const parts = list.map(({ at, r, seed }) => { const rx = r, ry = r * R.range(.55, .85), rz = r * R.range(.7, 1);
        let m = L.meshSDF(pebble(rx, ry, rz, seed), { min: [-rx * 1.3, -ry * 1.3, -rz * 1.3], max: [rx * 1.3, ry * 1.3, rz * 1.3], cell: Math.max(r / 5, .002), refine: 1 });
        m = L.bakeShade(m, (p, n) => .75 + .25 * L.fbm(p[0] / r * 3, p[1] / r * 3, p[2] / r * 3, { seed: 3 }) * (.8 + .2 * n[1])); return L.transform(m, p => { const c = Math.cos(at[3]), s = Math.sin(at[3]); return [p[0] * c + p[2] * s + at[0], p[1] + at[1], -p[0] * s + p[2] * c + at[2]]; }); });
      meshes[name] = L.merge(...parts); };
    const field = (n, yLo, yHi, rLo, rHi, seed0) => { const o = []; for (let i = 0; i < n; i++) { const r = R.range(rLo, rHi), x = R.range(-w / 2 + r, w / 2 - r), z = R.range(-d / 2 + r, -r * .6 + .02), y = R.range(yLo, yHi); o.push({ at: [x, y, z, R.range(0, 6.28)], r, seed: seed0 + i }); } return o; };
    const near = (a, x0) => a.map(p => p).filter(p => Math.abs(p.at[0] - BURROW_X) > p.r + .02 && !(p.at[0] > .3 && p.at[0] < .5 && p.at[1] > -.4 && p.at[1] < -.27));   // keep clear of the burrow and of the cross-cut root
    merge(near(field(36, -1.15, -.84, .012, .035, 100)), 'flints_c');
    merge(near(field(9, -.74, -.3, .012, .028, 200)), 'flints_b');
    merge(near(field(3, -.22, -.1, .01, .02, 300)), 'flints_a');
    merge([{ at: [-.42, .006, .21, .6], r: .03, seed: 400 }, { at: [.58, .004, -.25, 1.4], r: .02, seed: 401 }], 'flints_s'); }

  // ---- crumbs (aggregates) of the topsoil and the pores between them: a patch of the cut face ----
  { const mk = (seed, nu, nv) => { const m = uvSphere(1, nu, nv), rr = L.rng(seed); return L.bakeShade(L.transform(m, p => { const k = 1 + .22 * (rr() - .5) * 2 + .1 * Math.sin(p[0] * 5 + seed) * Math.cos(p[2] * 4); return [p[0] * k * 1.1, p[1] * k * .92, p[2] * k]; }), (p, n) => .72 + .28 * (.5 + .5 * n[1])); };
    meshes.crumb_a = mk(5, 7, 4); meshes.crumb_b = mk(9, 8, 5);
    const ca = new L.Instances('crumb_a'), cb = new L.Instances('crumb_b'), pw = new L.Instances('droplet'), pts = [];
    const inside = (x, y) => { const cx = (CRUMBS.x[0] + CRUMBS.x[1]) / 2, cy = (CRUMBS.y[0] + CRUMBS.y[1]) / 2, a = (CRUMBS.x[1] - CRUMBS.x[0]) / 2, b = (CRUMBS.y[1] - CRUMBS.y[0]) / 2; const e = Math.hypot((x - cx) / a, (y - cy) / b) + .12 * L.fbm(x * 18, y * 18, 3, { seed: 71, octaves: 2 }); return e < 1; };
    // two layers of crumbs 2 to 4.5 mm in radius (drawn 4 to 9 mm across), in a loose jittered grid so there are gaps between them
    for (let layer = 0; layer < 2; layer++) { const step = .0075; for (let x = CRUMBS.x[0]; x < CRUMBS.x[1]; x += step) for (let y = CRUMBS.y[0]; y < CRUMBS.y[1]; y += step) { const px = x + R.range(-.0022, .0022) + layer * .004, py = y + R.range(-.0022, .0022) + layer * .0035; if (!inside(px, py) || R() < .12) continue;
        const r = R.range(.0022, .0042), z = -(r + .0006) - layer * .0075 + R.range(-.0006, .0006), q = L.quatAxisAngle(R.unitVec(), R.range(0, 6.28));
        (R() < .5 ? ca : cb).add([px, py, z], q, r); if (layer === 0) pts.push([px, py, z, r]); } }
    instances.crumbs_a = ca; instances.crumbs_b = cb;
    meshes.droplet = L.bakeShade(uvSphere(1, 7, 4), (p, n) => .8 + .2 * n[1]);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < Math.min(pts.length, i + 14); j++) { const a = pts[i], b = pts[j], dd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dd < a[3] + b[3] + .0018 && R() < .35) pw.add([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.max(a[2], b[2]) + .0006], [0, 0, 0, 1], R.range(.0008, .0016)); }
    instances.pore_water = pw;
    // the dark back wall of the pore space seen between the crumbs
    const bk = L.newMesh(), cx = (CRUMBS.x[0] + CRUMBS.x[1]) / 2, cy = (CRUMBS.y[0] + CRUMBS.y[1]) / 2, ax = (CRUMBS.x[1] - CRUMBS.x[0]) / 2 + .004, ay = (CRUMBS.y[1] - CRUMBS.y[0]) / 2 + .004; bk.pos.push(cx, cy, -.0225);
    for (let k = 0; k < 40; k++) { const a = k / 40 * 6.2832; bk.pos.push(cx + Math.cos(a) * ax, cy + Math.sin(a) * ay, -.0225); } for (let k = 0; k < 40; k++) bk.idx.push(0, 1 + k, 1 + (k + 1) % 40); meshes.pore_back = bk; }

  // ---- the oak's roots: a coarse root running across the block, one cut across, and branches; closed tubes so the cut shows their cross-section ----
  { const tube = (pts, r0, r1, sides = 8, n = 0) => L.tube(n ? spl(pts, n) : pts, t => r0 + (r1 - r0) * t, { sides, caps: true });
    const roots = [];
    // main root from the oak side (+x) running along x behind the face, tapering; two branches
    roots.push(tube([[.75, -.17, -.13], [.55, -.2, -.12], [.3, -.235, -.14], [.05, -.27, -.1], [-.2, -.31, -.12], [-.5, -.36, -.16], [-.75, -.4, -.2]], .015, .004, 9, 40));
    roots.push(tube([[.3, -.235, -.14], [.18, -.2, -.2], [.1, -.14, -.25], [.02, -.1, -.3]], .005, .0015, 6, 14));
    roots.push(tube([[-.2, -.31, -.12], [-.28, -.4, -.1], [-.33, -.52, -.14], [-.38, -.64, -.18]], .0045, .0013, 6, 14));
    // a second, thicker root that runs front to back across the cut plane: its cross-section shows at the face
    roots.push(tube([[.4, -.33, .4], [.4, -.335, .1], [.405, -.34, -.1], [.38, -.35, -.3], [.3, -.36, -.4]], .011, .008, 10, 20));
    roots.push(tube([[.4, -.34, -.12], [.5, -.42, -.2], [.62, -.5, -.26], [.75, -.58, -.3]], .004, .0013, 6, 16));
    meshes.roots_coarse = L.bakeShade(L.merge(...roots), (p, n) => .8 + .2 * n[1]);
    // fine roots (under 2 mm across): short curved tubes, mostly in the topsoil, density falling with depth
    const fr = L.tube(spl([[0, 0, 0], [.004, .003, .012], [.002, .001, .026], [.006, -.002, .04]], 5), t => .00045 * (1 - .6 * t), { sides: 4, caps: false });
    meshes.froot = L.bakeShade(fr, () => .9); const FI = new L.Instances('froot'), TI = new L.Instances('ecm'), RH = new L.Instances('rhair');
    const tip = L.tube([[0, 0, 0], [0, 0, .0035]], .0006, { sides: 5, caps: true }); meshes.ecm = L.bakeShade(L.merge(tip, L.translateMesh(L.scaleMesh(uvSphere(.0007, 6, 3), [1, 1, 1]), [0, 0, .0035])), () => .95);
    const hair = L.newMesh(); hair.pos.push(-.00004, 0, 0, .00004, 0, 0, 0, .001, .0003); hair.idx.push(0, 1, 2, 0, 2, 1); meshes.rhair = hair;
    for (let i = 0; i < 640; i++) { const y = -(.01 + Math.abs(R.gauss()) * .17), x = R.range(-w / 2 + .03, w / 2 - .03), z = R.range(-.3, -.008); if (y < -.7) continue;
      const q = L.quatAxisAngle(R.unitVec(), R.range(0, 6.28)), s = R.range(.7, 1.6); FI.add([x, y, z], q, s);
      const end = L.add([x, y, z], L.quatRot(q, [.006 * s, -.002 * s, .04 * s]));
      if (R() < .5 && end[2] < -.003) TI.add(end, L.quatMul(q, L.quatAxisAngle([0, 1, 0], 0)), 1);
      else if (R() < .3) for (let k = 0; k < 6; k++) { const t = R.range(.2, .9); RH.add(L.add([x, y, z], L.quatRot(q, [.006 * s * t, -.002 * s * t, .04 * s * t])), L.quatMul(q, L.quatAxisAngle([0, 0, 1], R.range(0, 6.28))), s); } }
    instances.froots = FI; instances.ecm_tips = TI; instances.root_hairs = RH;
    // fungal threads (hyphae) through the litter and the upper topsoil; real hyphae are 4 to 6 micrometres thick, drawn about 0.2 mm
    meshes.hypha = L.bakeShade(L.tube(spl([[0, 0, 0], [.008, .004, .01], [.02, -.002, .02], [.034, .004, .03], [.05, 0, .036]], 6), .0001, { sides: 3, caps: false }), () => 1);
    const HI = new L.Instances('hypha');
    for (let i = 0; i < 520; i++) { const y = -R.range(-.004, .16) * (R() < .7 ? 1 : 3), x = R.range(-w / 2 + .03, w / 2 - .03), z = R.range(-.3, -.005); if (y < -.45) continue; HI.add([x, y, z], L.quatAxisAngle(R.unitVec(), R.range(0, 6.28)), R.range(.6, 1.6)); }
    instances.hyphae = HI; }

  // ---- the earthworm's burrow (an open lining, seen from inside) and the cast at its mouth ----
  { const pts = [[BURROW_X, .004, 0]]; for (let k = 1; k <= 14; k++) { const y = .004 - k * .072; pts.push([BURROW_X + (y < -.3 ? .012 * Math.sin(k * 1.3) : 0), y, y < -.3 ? .01 * Math.cos(k * 1.7) : 0]); }
    meshes.burrow = L.bakeShade(L.tube(pts, .0056, { sides: 12, caps: false }), (p, n) => .8 + .2 * L.fbm(p[0] * 60, p[1] * 60, p[2] * 60, { seed: 4 }));
    const cast = []; for (let i = 0; i < 38; i++) { const a = R.range(0, 6.28), r = Math.abs(R.gauss()) * .012, rr = R.range(.0025, .0055);
      cast.push(place(uvSphere(rr, 7, 4), [BURROW_X + Math.cos(a) * r, rr * .55 + R.range(0, .008) * (1 - r / .03), Math.sin(a) * r])); }
    meshes.cast = L.bakeShade(L.merge(...cast), (p, n) => .75 + .25 * n[1]); }
  return { meshes, instances };
}
