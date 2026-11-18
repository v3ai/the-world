// Deterministic random numbers and gradient noise. Every model must be reproducible from its seed.
export function rng(seed = 1) {            // mulberry32
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.int = (lo, hi) => Math.floor(f.range(lo, hi + 1));
  f.gauss = () => { let u = 0, v = 0; while (!u) u = f(); while (!v) v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  f.pick = arr => arr[Math.floor(f() * arr.length) % arr.length];
  f.unitVec = () => { const z = f.range(-1, 1), a = f.range(0, 2 * Math.PI), r = Math.sqrt(1 - z * z); return [r * Math.cos(a), z, r * Math.sin(a)]; };
  return f;
}
// 3D value-gradient noise in [-1,1], lattice hash seeded
function hash3(ix, iy, iz, seed) { let h = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 144665) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
export function noise3(x, y, z, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fade(fx), v = fade(fy), w = fade(fz);
  const g = (a, b, c) => hash3(ix + a, iy + b, iz + c, seed) * 2 - 1;
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(g(0, 0, 0), g(1, 0, 0), u), l(g(0, 1, 0), g(1, 1, 0), u), v), l(l(g(0, 0, 1), g(1, 0, 1), u), l(g(0, 1, 1), g(1, 1, 1), u), v), w);
}
export function fbm(x, y, z, { octaves = 4, lacunarity = 2, gain = .5, seed = 0 } = {}) {
  let s = 0, a = 1, n = 0;
  for (let o = 0; o < octaves; o++) { s += a * noise3(x, y, z, seed + o * 17); n += a; x *= lacunarity; y *= lacunarity; z *= lacunarity; a *= gain; }
  return s / n;
}
