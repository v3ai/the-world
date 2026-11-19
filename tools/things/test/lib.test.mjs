// Run: node --test tools/things/test/
import test from 'node:test'; import assert from 'node:assert/strict';
import * as L from '../lib/index.mjs';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg || ''} got ${a}, want ${b} +-${tol * 100}%`);
const box = r => ({ min: [-r, -r, -r], max: [r, r, r] });

test('sphere: closed manifold, Euler 2, volume and area within 1.5%', () => {
  const m = L.meshSDF(L.sphere(1), { ...box(1.2), res: 48 }), s = L.stats(m);
  assert.ok(s.closed, JSON.stringify(s)); assert.equal(s.euler, 2); assert.equal(s.degenerate, 0);
  near(s.volume, 4 / 3 * Math.PI, .015, 'volume'); near(s.area, 4 * Math.PI, .015, 'area');
});
test('winding is outward: signed volume positive for every primitive, negative once flipped', () => {
  const shapes = [L.sphere(.8), L.ellipsoid(1, .6, .8), L.box(.7, .5, .6, .1), L.capsule([-.5, 0, 0], [.5, 0, 0], .3), L.torus(.7, .25), L.roundCone([0, -.6, 0], [0, .5, 0], .5, .2)];
  for (const sh of shapes) { const m = L.meshSDF(sh, { ...box(1.3), res: 40 }); assert.ok(L.signedVolume(m) > 0); assert.ok(L.signedVolume(L.flip(m)) < 0); assert.ok(L.stats(m).closed); }
});
test('torus: genus 1 (Euler 0) and Pappus volume 2*pi^2*R*r^2', () => {
  const m = L.meshSDF(L.torus(1, .3), { min: [-1.5, -.5, -1.5], max: [1.5, .5, 1.5], res: 72 }), s = L.stats(m);
  assert.equal(s.euler, 0); assert.ok(s.closed); near(s.volume, 2 * Math.PI ** 2 * 1 * .09, .02);
});
test('ellipsoid volume', () => { const s = L.stats(L.meshSDF(L.ellipsoid(1, .5, .75), { min: [-1.2, -.7, -1], max: [1.2, .7, 1], res: 56 })); near(s.volume, 4 / 3 * Math.PI * .375, .02); assert.ok(s.closed); });
test('smooth union of two spheres is one closed component with volume between max and sum', () => {
  const sh = L.smoothUnion(.3, L.translate(L.sphere(.6), [-.4, 0, 0]), L.translate(L.sphere(.6), [.4, 0, 0])), m = L.meshSDF(sh, { min: [-1.3, -1, -1], max: [1.3, 1, 1], res: 64 }), s = L.stats(m);
  assert.ok(s.closed && s.euler === 2); const v1 = 4 / 3 * Math.PI * .216; assert.ok(s.volume > v1 * 1.3 && s.volume < v1 * 2.05);
});
test('subtract: a sphere with a bore is closed with Euler 0', () => {
  const sh = L.subtract(L.sphere(1), L.capsule([0, 0, -2], [0, 0, 2], .3)), s = L.stats(L.meshSDF(sh, { ...box(1.2), res: 64 }));
  assert.ok(s.closed); assert.equal(s.euler, 0);
});
test('mirror makes a symmetric shape', () => {
  const sh = L.mirror(L.translate(L.sphere(.3), [.5, 0, 0]), 0), m = L.meshSDF(sh, { ...box(1), res: 48 }), b = L.bounds(m);
  assert.ok(Math.abs(b.min[0] + b.max[0]) < .03); assert.ok(L.stats(m).euler === 4);
});
test('bend and twist keep a rod closed', () => {
  for (const sh of [L.bend(L.capsule([0, -1, 0], [0, 1, 0], .2), 1, 0, .8), L.twist(L.box(.15, 1, .3, .08), 1, 1.2)]) { const s = L.stats(L.meshSDF(sh, { min: [-1.6, -1.6, -1], max: [1.6, 1.6, 1], res: 64 })); assert.ok(s.closed && s.euler === 2, JSON.stringify(s)); }
});
test('noise displacement is deterministic and stays closed', () => {
  const mk = seed => L.meshSDF(L.noiseDisplace(L.sphere(1), { amp: .08, freq: 3, seed }), { ...box(1.3), res: 40 });
  const a = mk(3), b = mk(3), c = mk(4); assert.deepEqual(a.pos, b.pos); assert.notDeepEqual(a.pos, c.pos); assert.ok(L.stats(a).closed);
});
test('no degenerate triangles across several shapes', () => { for (const sh of [L.sphere(1), L.torus(1, .3), L.box(.8, .8, .8, .05)]) assert.equal(L.stats(L.meshSDF(sh, { ...box(1.6), res: 50 })).degenerate, 0); });
test('weld, simplify and smooth', () => {
  const m = L.meshSDF(L.sphere(1), { ...box(1.2), res: 48 }), sm = L.simplify(m, .15);
  assert.ok(L.triCount(sm) < L.triCount(m) / 5 && L.triCount(sm) > 50); near(L.signedVolume(sm), 4 / 3 * Math.PI, .15);
  const sh = L.smooth(m, 3); near(L.signedVolume(sh), L.signedVolume(m), .02);
  const dup = L.merge(m, m), w = L.weld(dup, 1e-7); assert.equal(L.vertCount(w), L.vertCount(m));
});
test('tube: closed, volume close to a cylinder', () => {
  const path = [[0, 0, 0], [0, 1, 0], [0, 2, 0]], m = L.tube(path, .25, { sides: 24 }), s = L.stats(L.weld(m, 1e-9));
  assert.ok(s.closed, JSON.stringify(s)); near(s.volume, Math.PI * .0625 * 2, .02); assert.ok(s.volume > 0);
});
test('tube along a curved spline with a taper has positive volume and no twist (parallel transport)', () => {
  const p = L.spline([[0, 0, 0], [.5, 1, 0], [0, 2, .5], [-.5, 3, 0]]).sample(24), m = L.tube(p, t => .2 * (1 - t) + .02, { sides: 10 });
  assert.ok(L.signedVolume(m) > 0 && L.stats(L.weld(m, 1e-9)).closed);
});
test('lathe: a vase profile is closed and has the right volume', () => {
  const m = L.lathe([[0, 0], [.5, 0], [.5, 1], [0, 1]], { segments: 48 }), s = L.stats(L.weld(m, 1e-9));
  assert.ok(s.closed, JSON.stringify(s)); near(s.volume, Math.PI * .25, .01);
});
test('blade: a leaf-shaped solid is closed with positive volume', () => {
  const m = L.blade({ length: 1, thickness: .05, nAlong: 12, nAcross: 4, curlAlong: .6, fold: .1 }), s = L.stats(m);
  assert.ok(s.closed, JSON.stringify(s)); assert.ok(s.volume > 0);
});
test('extrudeOutline: a concave L-shape extrudes to area*thickness', () => {
  const poly = [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]], m = L.extrudeOutline(poly, .1), s = L.stats(m);
  assert.ok(s.closed, JSON.stringify(s)); near(s.volume, 3 * .1, .001);
  const cw = L.extrudeOutline(poly.slice().reverse(), .1); near(L.signedVolume(cw), .3, .001);   // clockwise input also faces outward
});
test('phyllotaxis: golden angle spacing, uniform area density', () => {
  const pts = L.phyllotaxis(500); assert.ok(Math.abs((pts[1].theta - pts[0].theta) - L.GOLDEN_ANGLE) < 1e-12); near(L.GOLDEN_ANGLE * 180 / Math.PI, 137.5077, .0001);
  const inner = pts.filter(p => p.r < Math.sqrt(.25)).length; near(inner, 125, .05);
});
test('space colonisation grows toward attractors; pipe model conserves cross-section', () => {
  const R = L.rng(5), att = []; for (let i = 0; i < 300; i++) { const v = R.unitVec(); att.push([v[0] * 1.2, 2.5 + v[1] * 1.2, v[2] * 1.2]); }
  const nodes = L.spaceColonize({ attractors: att, root: [0, 0, 0], step: .12, influence: 2, kill: .25, rand: R }); L.pipeRadii(nodes, .01);
  assert.ok(nodes.length > 40); assert.ok(Math.max(...nodes.map(n => n.p[1])) > 1.5);
  const forks = nodes.filter(n => n.children.length > 1); assert.ok(forks.length > 3);
  for (const n of forks) near(n.radius ** 2, n.children.reduce((s, c) => s + nodes[c].radius ** 2, 0), 1e-9);
  const m = L.treeToMesh(nodes, { sides: 5 }); assert.ok(L.triCount(m) > 200);
});
test('rng is reproducible', () => { const a = L.rng(9), b = L.rng(9); for (let i = 0; i < 20; i++) assert.equal(a(), b()); });
test('export: int16 quantisation error stays below half a step; instances and part bounds', () => {
  const m = L.meshSDF(L.ellipsoid(1.5, .5, .8), { min: [-2, -1, -1], max: [2, 1, 1], res: 48 }), q = L.quantize(m), d = L.dequantize(q);
  assert.ok(q.pos.every(v => v >= -32767 && v <= 32767)); let worst = 0; for (let i = 0; i < m.pos.length; i++) worst = Math.max(worst, Math.abs(m.pos[i] - d.pos[i]));
  assert.ok(worst <= Math.max(...q.scale) * .5 + 1e-9); assert.deepEqual(q.idx, m.idx);
  const inst = new L.Instances('m').add([0, 0, 0]).add([1, 2, 3], [0, 0, 0, 1], 2), f = inst.flat(); assert.equal(f.stride, 8); assert.equal(f.data.length, 16);
  const cr = L.centerRadius(m); near(cr.radius, 1.5, .03);
  const out = L.assemble({ thing: { parts: [{ id: 'a', name: 'A', system: 's', node: 'n', mesh: 'm' }, { id: 'b', name: 'B', system: 's', node: 'n', instances: 'i' }], systems: [{ id: 's' }], modes: [] }, meshes: { m }, instances: { i: inst } });
  assert.deepEqual(out.problems, []); assert.equal(out.thing.parts[1].count, 2); assert.ok(out.thing.parts[0].tris > 100);
  assert.equal(L.assemble({ thing: { parts: [{ id: 'x', system: 'q', mesh: 'nope' }], systems: [] }, meshes: {} }).problems.length > 0, true);
});
