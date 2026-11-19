// Growth helpers: space-colonisation branching (trees, roots, veins), pipe-model radii, phyllotaxis.
import { add, sub, mul, norm, len, dist, lerp3 } from './vec.mjs';
import { newMesh, merge } from './mesh.mjs';
import { tube, spline } from './sweep.mjs';

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));   // about 137.5 degrees
// Vogel spiral: n points of a sunflower-style spiral. Returns [{r (0..1), theta, x, y, i}] with r = sqrt(i/n).
export function phyllotaxis(n, { angle = GOLDEN_ANGLE, c = 1 } = {}) { const o = []; for (let i = 0; i < n; i++) { const r = Math.sqrt((i + .5) / n) * c, th = i * angle; o.push({ i, r, theta: th, x: r * Math.cos(th), y: r * Math.sin(th) }); } return o; }
// Leaves/shoots around a stem: i-th organ at height i*step, rotated by the golden angle each time.
export function phyllotaxisAlongStem(n, step) { const o = []; for (let i = 0; i < n; i++) o.push({ i, h: i * step, theta: i * GOLDEN_ANGLE }); return o; }

// Space colonisation (Runions et al. 2007). attractors: points the structure grows toward. root: start point.
// Returns nodes [{p, parent (index or -1), children, radius, depth}].
export function spaceColonize({ attractors, root, step = .1, influence = 1, kill = .2, maxIter = 400, rand, bias = [0, 0, 0], biasWeight = 0 }) {
  const nodes = [{ p: root.slice(), parent: -1, children: [], depth: 0 }];
  let att = attractors.map(p => ({ p, closest: -1, d: Infinity })), alive = att;
  for (let it = 0; it < maxIter && alive.length; it++) {
    for (const a of alive) { a.closest = -1; a.d = influence; }
    for (let ni = 0; ni < nodes.length; ni++) for (const a of alive) { const d = dist(a.p, nodes[ni].p); if (d < a.d) { a.d = d; a.closest = ni; } }
    const push = new Map();
    for (const a of alive) if (a.closest >= 0) { const dir = norm(sub(a.p, nodes[a.closest].p)); const s = push.get(a.closest) || [0, 0, 0]; push.set(a.closest, add(s, dir)); }
    if (!push.size) break;
    const before = nodes.length;
    for (const [ni, s] of push) {
      let dir = norm(s); if (biasWeight) dir = norm(add(dir, mul(bias, biasWeight)));
      if (rand) dir = norm(add(dir, mul(rand.unitVec(), .06)));
      const p = add(nodes[ni].p, mul(dir, step));
      nodes.push({ p, parent: ni, children: [], depth: nodes[ni].depth + 1 }); nodes[ni].children.push(nodes.length - 1);
    }
    alive = alive.filter(a => !nodes.some((n, i) => i >= before && dist(a.p, n.p) < kill));
    if (nodes.length === before) break;
  }
  return nodes;
}
// Pipe model (Shinozaki): a branch's cross-section equals the sum of its children's. radius^e = sum(child radius^e).
export function pipeRadii(nodes, tipRadius = .01, exponent = 2) {
  for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; n.radius = n.children.length ? Math.pow(n.children.reduce((s, c) => s + Math.pow(nodes[c].radius, exponent), 0), 1 / exponent) : tipRadius; }
  return nodes;
}
// Turn a node tree into one tube mesh per chain (a chain continues through single-child nodes and along the thickest child at forks).
export function treeToMesh(nodes, { sides = 6, smoothSteps = 2 } = {}) {
  const parts = [], visited = new Set();
  const chains = [];
  const walk = start => {
    const chain = [start]; let cur = start;
    while (nodes[cur].children.length) { const ch = nodes[cur].children.slice().sort((a, b) => nodes[b].radius - nodes[a].radius); chain.push(ch[0]); for (const o of ch.slice(1)) walk2.push([cur, o]); cur = ch[0]; }
    chains.push(chain);
  };
  const walk2 = [[-1, 0]];
  while (walk2.length) { const [from, s] = walk2.pop(); walk(s); if (from >= 0) chains[chains.length - 1].unshift(from); }
  for (const ch of chains) {
    if (ch.length < 2) continue;
    let pts = ch.map(i => nodes[i].p), rad = ch.map(i => nodes[i].radius);
    if (smoothSteps && pts.length > 2) { const sp = spline(pts), k = (pts.length - 1) * smoothSteps; const rr = x => { const f = x * (rad.length - 1), i = Math.min(rad.length - 2, Math.floor(f)); return rad[i] + (rad[i + 1] - rad[i]) * (f - i); }; parts.push(tube(sp.sample(k), rr, { sides, caps: true })); }
    else parts.push(tube(pts, t => { const f = t * (rad.length - 1), i = Math.min(rad.length - 2, Math.floor(f)); return rad[i] + (rad[i + 1] - rad[i]) * (f - i); }, { sides, caps: true }));
  }
  return merge(...parts);
}
