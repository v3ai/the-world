// Traces the side view (the midline section) of the dog model's skin and writes dog_outline.json (centimetres), used by the proportions figure.
// Run from the repo root:  node tools/things/content/dog_outline.mjs
import fs from 'fs';
import { skinShape } from '../models/dog_rig.mjs';
const f = skinShape().f, step = .5, ZS = [-9, -7.5, -6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6, 7.5, 9];     // the silhouette: the union of sections across the body
const X0 = -45, X1 = 56, Y0 = 0, Y1 = 71, nx = Math.round((X1 - X0) / step), ny = Math.round((Y1 - Y0) / step);
const inside = (i, j) => ZS.some(z => f([(X0 + i * step) * .01, (Y0 + j * step) * .01, z * .01]) < 0);
// boundary cells -> ordered outline by walking the silhouette column by column (top edge then bottom edge): the shape has no overhangs in this view except the legs, so use a contour follow
const grid = []; for (let j = 0; j <= ny; j++) { grid.push([]); for (let i = 0; i <= nx; i++) grid[j].push(inside(i, j)); }
// moore-neighbour boundary trace from the left-most inside cell
let start = null; for (let i = 0; i <= nx && !start; i++) for (let j = ny; j >= 0; j--) if (grid[j][i]) { start = [i, j]; break; }
const dirs = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]];
const at = (i, j) => i >= 0 && j >= 0 && i <= nx && j <= ny && grid[j][i];
let cur = start, prev = 4, out = [start.slice()];
for (let n = 0; n < 20000; n++) {
  let found = false;
  for (let k = 0; k < 8; k++) { const d = (prev + 1 + k) % 8, ni = cur[0] + dirs[d][0], nj = cur[1] + dirs[d][1]; if (at(ni, nj)) { prev = (d + 4) % 8; cur = [ni, nj]; found = true; break; } }
  if (!found) break; if (cur[0] === start[0] && cur[1] === start[1]) break; out.push(cur.slice());
}
let pts = out.map(([i, j]) => [X0 + i * step, Y0 + j * step]);
// Douglas-Peucker
const dp = (p, e) => { if (p.length < 3) return p; const a = p[0], b = p[p.length - 1]; let m = 0, k = 0; for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((b[1] - a[1]) * p[i][0] - (b[0] - a[0]) * p[i][1] + b[0] * a[1] - b[1] * a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]); if (d > m) { m = d; k = i; } } return m > e ? [...dp(p.slice(0, k + 1), e).slice(0, -1), ...dp(p.slice(k), e)] : [a, b]; };
pts = dp(pts, .45).map(([x, y]) => [Math.round(x * 2) / 2, Math.round(y * 2) / 2]);
fs.writeFileSync(new URL('./dog_outline.json', import.meta.url), JSON.stringify({ pts, note: 'silhouette of the skin mesh, side view, cm' }));
console.log(pts.length, 'points');
