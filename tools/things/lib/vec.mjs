// Tiny vector helpers on plain [x,y,z] arrays.
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.hypot(a[0], a[1], a[2]);
export const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const dist = (a, b) => len(sub(a, b));
// rotate v about unit axis k by angle (Rodrigues)
export function rotAxis(v, k, ang) { const c = Math.cos(ang), s = Math.sin(ang), kv = cross(k, v), kd = dot(k, v) * (1 - c); return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd]; }
// any unit vector perpendicular to n
export function perp(n) { const a = Math.abs(n[0]) < .9 ? [1, 0, 0] : [0, 1, 0]; return norm(cross(n, a)); }
// quaternion [x,y,z,w] rotating +Y onto direction d (for oriented instances)
export function quatFromTo(a, b) { a = norm(a); b = norm(b); const d = dot(a, b); if (d < -.999999) { const p = perp(a); return [p[0], p[1], p[2], 0]; } const c = cross(a, b), w = 1 + d, l = Math.hypot(c[0], c[1], c[2], w); return [c[0] / l, c[1] / l, c[2] / l, w / l]; }
export function quatAxisAngle(k, ang) { const s = Math.sin(ang / 2); k = norm(k); return [k[0] * s, k[1] * s, k[2] * s, Math.cos(ang / 2)]; }
export function quatMul(a, b) { return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]]; }
export function quatRot(q, v) { const [x, y, z, w] = q, t = mul(cross([x, y, z], v), 2); return add(add(v, mul(t, w)), cross([x, y, z], t)); }
