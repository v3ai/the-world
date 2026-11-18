/* Circuit Lab: schematic editor + MNA solver (DC / transient / AC) for the science explorer.
   Plain JS, no dependencies. Solver is importable from node (module.exports) and DOM code is guarded. */
(function (root) {
'use strict';
const VT = 0.025852;

/* ------------------------------------------------------------------ units */
const PFX = [[1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
function fmt(v, u) {
  u = u || '';
  if (v == null || !isFinite(v)) return '–';
  const a = Math.abs(v);
  if (a < 1e-15) return '0 ' + u;
  let q = PFX[PFX.length - 1];
  for (const p of PFX) if (a >= p[0] * 0.99995) { q = p; break; }
  const x = v / q[0], ax = Math.abs(x);
  let s = ax >= 99.95 ? x.toFixed(0) : ax >= 9.995 ? x.toFixed(1) : x.toFixed(2);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s + ' ' + q[1] + u;
}
const MULT = { t: 1e12, g: 1e9, meg: 1e6, k: 1e3, m: 1e-3, u: 1e-6, 'µ': 1e-6, n: 1e-9, p: 1e-12 };
function parseEng(s) {
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(meg|[TGkKMmuµμnp])?/i.exec(String(s));
  if (!m) return NaN;
  let v = parseFloat(m[1]);
  if (m[2]) {
    const p = m[2];
    if (p === 'M') v *= 1e6; else if (p === 'K') v *= 1e3; else if (p === 'T') v *= 1e12; else if (p === 'G') v *= 1e9;
    else v *= MULT[p.toLowerCase()] || MULT[p] || 1;
  }
  return v;
}

/* --------------------------------------------------------------- waveforms */
function wave(w, t) {
  switch (w.k) {
    case 'sin': return w.off + w.amp * Math.sin(2 * Math.PI * w.f * t + w.ph * Math.PI / 180);
    case 'pulse': {
      const T = 1 / w.f, tt = t - w.td;
      if (tt < 0) return w.lo;
      const p = tt - Math.floor(tt / T) * T, th = w.duty * T, tr = w.tr;
      if (p < tr) return w.lo + (w.hi - w.lo) * p / tr;
      if (p < tr + th) return w.hi;
      if (p < tr + th + tr) return w.hi - (w.hi - w.lo) * (p - tr - th) / tr;
      return w.lo;
    }
    default: return w.v;
  }
}
function dcVal(w) { return w.k === 'sin' ? w.off : w.k === 'pulse' ? w.lo : w.v; }
function hasCorner(w, t0, t1) {
  if (w.k !== 'pulse') return false;
  const T = 1 / w.f, th = w.duty * T, c = [0, w.tr, w.tr + th, 2 * w.tr + th];
  for (let k = Math.max(0, Math.floor((t0 - w.td) / T)); w.td + k * T <= t1; k++)
    for (const o of c) { const tc = w.td + k * T + o; if (tc > t0 && tc <= t1) return true; }
  return false;
}
function acStim(w) {
  if (w.k === 'sin') return [w.amp, w.ph * Math.PI / 180];
  if (w.k === 'pulse') return [(w.hi - w.lo) / 2, 0];
  return [0, 0];
}

/* ------------------------------------------------------------ device models */
function expc(x) { return x > 60 ? Math.exp(60) * (1 + x - 60) : Math.exp(x); }
function dexpc(x) { return x > 60 ? Math.exp(60) : Math.exp(x); }
function pnjlim(vn, vo, vt, vc) {
  if (vn > vc && Math.abs(vn - vo) > 2 * vt) {
    if (vo > 0) { const a = (vn - vo) / vt; vn = a > 0 ? vo + vt * (2 + Math.log(a - 2)) : vo - vt * (2 + Math.log(2 - a)); }
    else vn = vt * Math.log(vn / vt);
  } else if (vn < 0) {
    const a = vo > 0 ? -vo - 1 : 2 * vo - 1;
    if (vn < a) vn = a;
  }
  return vn;
}
function clampStep(vn, vo, m) { return vn > vo + m ? vo + m : vn < vo - m ? vo - m : vn; }
const GJ = 1e-12, GJD = 1e-9;   // minimum junction conductances (like SPICE gmin across junctions) keep Newton well conditioned
const NLT = { D: 1, Q: 1, M: 1, OA: 1 };

function devEval(e, u) {
  if (e.t === 'D') {
    const vt = e.nf * VT, ex = expc(u[0] / vt);
    let i = e.Is * (ex - 1) + GJD * u[0], g = e.Is * dexpc(u[0] / vt) / vt + GJD;
    if (e.vz > 0) { const a = expc(-(u[0] + e.vz) / VT) * e.iz; i -= a; g += a / VT; }
    return { i: [i, -i], G: [[g], [-g]] };
  }
  if (e.t === 'Q') {
    const p = e.pol, vbe = p * u[0], vbc = p * u[1];
    const ef = expc(vbe / VT), er = expc(vbc / VT), gf = e.Is * dexpc(vbe / VT) / VT, gr = e.Is * dexpc(vbc / VT) / VT;
    const ic = e.Is * (ef - er) - e.Is / e.brv * (er - 1) - GJ * vbc, ib = e.Is / e.bf * (ef - 1) + e.Is / e.brv * (er - 1) + GJ * (vbe + vbc);
    const dcbe = gf, dcbc = -gr - gr / e.brv - GJ, dbbe = gf / e.bf + GJ, dbbc = gr / e.brv + GJ;
    return {
      i: [p * ic, p * ib, -p * (ic + ib)],
      G: [[dcbe, dcbc], [dbbe, dbbc], [-(dcbe + dbbe), -(dcbc + dbbc)]]
    };
  }
  // MOSFET (square law with channel-length modulation)
  const pol = e.pol;
  let vgs = pol * u[0], vds = pol * u[1], sw = false;
  if (vds < 0) { vgs -= vds; vds = -vds; sw = true; }
  const vov = vgs - e.vt;
  let id = 0, gm = 0, gds = 0;
  if (vov > 0) {
    const lam = 1 + e.lam * vds;
    if (vds < vov) {
      const b = vov * vds - 0.5 * vds * vds;
      id = e.kp * b * lam; gm = e.kp * vds * lam; gds = e.kp * (vov - vds) * lam + e.kp * b * e.lam;
    } else {
      id = 0.5 * e.kp * vov * vov * lam; gm = e.kp * vov * lam; gds = 0.5 * e.kp * vov * vov * e.lam;
    }
  }
  let I = id, gv = gm, gd = gds;
  if (sw) { I = -id; gv = -gm; gd = gm + gds; }
  return { i: [pol * I, 0, -pol * I], G: [[gv, gd], [0, 0], [-gv, -gd]] };
}
const CTRL = { D: [[0, 1]], Q: [[1, 2], [1, 0]], M: [[1, 2], [0, 2]] };

/* ------------------------------------------------------------------ linear algebra */
function lu(M, b, N, sc) {
  for (let k = 0; k < N; k++) {
    let p = k, mx = Math.abs(M[k * N + k]);
    for (let i = k + 1; i < N; i++) { const v = Math.abs(M[i * N + k]); if (v > mx) { mx = v; p = i; } }
    if (mx === 0 || mx <= 1e-14 * sc[k]) { lu.bad = k; return false; }
    if (p !== k) {
      for (let j = k; j < N; j++) { const t = M[k * N + j]; M[k * N + j] = M[p * N + j]; M[p * N + j] = t; }
      const t = b[k]; b[k] = b[p]; b[p] = t;
    }
    const d = M[k * N + k];
    for (let i = k + 1; i < N; i++) {
      const f = M[i * N + k] / d;
      if (f === 0) continue;
      for (let j = k + 1; j < N; j++) M[i * N + j] -= f * M[k * N + j];
      b[i] -= f * b[k];
    }
  }
  for (let i = N - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < N; j++) s -= M[i * N + j] * b[j];
    b[i] = s / M[i * N + i];
  }
  return true;
}
function colScale(M, N) {
  const sc = new Float64Array(N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const v = Math.abs(M[i * N + j]); if (v > sc[j]) sc[j] = v; }
  return sc;
}

/* ------------------------------------------------------------------ simulator */
function Sim(nl) {
  this.nl = nl;
  this.n = nl.n;
  this.elems = nl.elems.map(function (o) { return Object.assign({}, o); });
  let nb = 0;
  const D = {
    D: { Is: 1e-14, nf: 1, vz: 0, iz: 5e-3 }, Q: { Is: 1e-14, bf: 100, brv: 2, pol: 1 },
    M: { kp: 2e-3, vt: 1, lam: 0.02, pol: 1 }, OA: { A: 1e5, vhi: 12, vlo: -12 }, XF: { k: 0.98 }
  };
  for (const e of this.elems) {
    const d = D[e.t];
    if (d) for (const k in d) if (e[k] == null) e[k] = d[k];
    e.br = -1; e.br2 = -1; e.st = {}; e.i = [0, 0, 0, 0]; e.vd = 0;
    if (e.t === 'V' || e.t === 'L' || e.t === 'OA' || e.t === 'AM') e.br = this.n + nb++;
    if (e.t === 'XF') { e.br = this.n + nb++; e.br2 = this.n + nb++; e.M = e.k * Math.sqrt(e.L1 * e.L2); }
    if (e.t === 'AM') e.w = { k: 'dc', v: 0 };
    if (CTRL[e.t]) e.cp = CTRL[e.t];
  }
  this.N = this.n + nb;
  this.A = new Float64Array(this.N * this.N);
  this.b = new Float64Array(this.N);
  this.x = new Float64Array(this.N);
  this.t = 0; this.trap = true; this.forceBE = 0; this.nonlinear = this.elems.some(function (e) { return NLT[e.t]; });
  this.err = null; this.ctx = { mode: 'dc', t: 0, h: 0, trap: false, gmin: 1e-12, src: 1 };
}
Sim.prototype.v = function (nd) { return nd > 0 ? this.x[nd - 1] : 0; };
Sim.prototype.name = function (e) { return e.name || e.t; };
Sim.prototype.nodeName = function (k) { return this.nl.nodeName ? this.nl.nodeName(k) : 'N' + k; };

Sim.prototype._limit = function (e, u) {
  const s = e.st;
  if (!s.u) s.u = e.t === 'D' ? [0] : e.t === 'Q' ? [0.6 * e.pol, 0] : [0, 0];
  const o = s.u, r = u.slice();
  if (e.t === 'D') {
    const vt = e.nf * VT, vc = vt * Math.log(vt / (Math.SQRT2 * e.Is));
    r[0] = pnjlim(u[0], o[0], vt, vc);
    if (e.vz > 0 && r[0] === u[0]) {
      const un = -(u[0] + e.vz), uo = -(o[0] + e.vz), ucr = VT * Math.log(VT / (Math.SQRT2 * e.iz));
      const ul = pnjlim(un, uo, VT, ucr);
      if (ul !== un) r[0] = -(ul + e.vz);
    }
  } else if (e.t === 'Q') {
    const p = e.pol, vc = VT * Math.log(VT / (Math.SQRT2 * e.Is));
    r[0] = p * pnjlim(p * u[0], p * o[0], VT, vc);
    r[1] = p * pnjlim(p * u[1], p * o[1], VT, vc);
  } else { r[0] = clampStep(u[0], o[0], 2); r[1] = clampStep(u[1], o[1], 3); }
  for (let i = 0; i < r.length; i++) if (r[i] !== u[i]) this.lim = true;
  s.u = r;
  return r;
};
Sim.prototype._syncU = function () {
  for (const e of this.elems) if (e.cp) e.st.u = e.cp.map((p) => this.v(e.n[p[0]]) - this.v(e.n[p[1]]));
};
Sim.prototype._stamp = function (ctx, x) {
  const N = this.N, A = this.A, b = this.b, n = this.n;
  A.fill(0); b.fill(0); this.lim = false;
  const ad = function (r, c, v) { if (r >= 0 && c >= 0) A[r * N + c] += v; };
  const ab = function (r, v) { if (r >= 0) b[r] += v; };
  const G = function (a, c, g) { ad(a, a, g); ad(c, c, g); ad(a, c, -g); ad(c, a, -g); };
  const nv = function (nd) { return nd > 0 ? x[nd - 1] : 0; };
  for (let i = 0; i < n; i++) A[i * N + i] += ctx.gmin;
  const tran = ctx.mode === 'tran', h = ctx.h, tr = tran && ctx.trap;
  for (const e of this.elems) {
    const a = e.n[0] - 1, c = e.n[1] - 1, s = e.st;
    switch (e.t) {
      case 'R': G(a, c, 1 / e.v); break;
      case 'C':
        if (tran) {
          const g = (tr ? 2 : 1) * e.v / h, ieq = g * (s.v || 0) + (tr ? (s.i || 0) : 0);
          G(a, c, g); ab(a, ieq); ab(c, -ieq);
        }
        break;
      case 'L': {
        const br = e.br;
        ad(a, br, 1); ad(c, br, -1); ad(br, a, 1); ad(br, c, -1);
        if (tran) {
          const r = (tr ? 2 : 1) * e.v / h;
          ad(br, br, -r); ab(br, -(r * (s.i || 0) + (tr ? (s.v || 0) : 0)));
        } else ad(br, br, -1e-3);
        break;
      }
      case 'V': case 'AM': {
        const br = e.br;
        ad(a, br, 1); ad(c, br, -1); ad(br, a, 1); ad(br, c, -1);
        ab(br, (tran ? wave(e.w, ctx.t) : dcVal(e.w)) * ctx.src);
        break;
      }
      case 'I': {
        const I = (tran ? wave(e.w, ctx.t) : dcVal(e.w)) * ctx.src;
        ab(a, -I); ab(c, I);
        break;
      }
      case 'XF': {
        const p1 = e.n[0] - 1, p2 = e.n[1] - 1, s1 = e.n[2] - 1, s2 = e.n[3] - 1, b1 = e.br, b2 = e.br2;
        ad(p1, b1, 1); ad(p2, b1, -1); ad(b1, p1, 1); ad(b1, p2, -1);
        ad(s1, b2, 1); ad(s2, b2, -1); ad(b2, s1, 1); ad(b2, s2, -1);
        if (tran) {
          const k = tr ? 2 / h : 1 / h;
          ad(b1, b1, -k * e.L1); ad(b1, b2, -k * e.M); ad(b2, b1, -k * e.M); ad(b2, b2, -k * e.L2);
          ab(b1, -(k * (e.L1 * (s.i1 || 0) + e.M * (s.i2 || 0)) + (tr ? (s.v1 || 0) : 0)));
          ab(b2, -(k * (e.M * (s.i1 || 0) + e.L2 * (s.i2 || 0)) + (tr ? (s.v2 || 0) : 0)));
        } else { ad(b1, b1, -1e-3); ad(b2, b2, -1e-3); }
        break;
      }
      case 'OA': {
        const p = e.n[0] - 1, m = e.n[1] - 1, o = e.n[2] - 1, br = e.br;
        const mid = (e.vhi + e.vlo) / 2, am = (e.vhi - e.vlo) / 2;
        const vd = nv(e.n[0]) - nv(e.n[1]);
        const th = Math.tanh(e.A * vd / am), f = mid + am * th, fp = e.A * (1 - th * th) + 1e-9;
        ad(o, br, -1); ad(br, o, 1); ad(br, p, -fp); ad(br, m, fp);
        ab(br, f - fp * vd);
        break;
      }
      default: { // D, Q, M
        const u = [];
        for (const pr of e.cp) u.push(nv(e.n[pr[0]]) - nv(e.n[pr[1]]));
        const ul = this._limit(e, u), ev = devEval(e, ul);
        for (let j = 0; j < ev.i.length; j++) {
          const nj = e.n[j] - 1; let cst = ev.i[j];
          for (let k = 0; k < e.cp.length; k++) {
            const gjk = ev.G[j][k], pr = e.cp[k];
            ad(nj, e.n[pr[0]] - 1, gjk); ad(nj, e.n[pr[1]] - 1, -gjk); cst -= gjk * ul[k];
          }
          ab(nj, -cst);
        }
      }
    }
  }
};

Sim.prototype._singular = function (k) {
  const N = this.n;
  if (k < N) return { kind: 'node', node: k + 1, msg: 'Floating node ' + this.nodeName(k + 1) + ': it has no DC path to ground (or a current source is forcing current into a dead end). Connect it to ground through a resistor.' };
  const el = this.elems.find(function (e) { return e.br === k || e.br2 === k; });
  const nm = el ? this.name(el) : 'a source';
  return { kind: 'branch', elem: el, msg: 'Voltage-source loop: ' + nm + ' is in a loop of ideal voltage sources / inductors / wires that contradicts KVL (or two ideal sources are in parallel). Add a small resistor in the loop.' };
};

/* Newton-Raphson with SPICE-style junction voltage limiting (pnjlim). If the iteration cycles it is progressively under-relaxed. */
Sim.prototype._newton = function (ctx, maxIt) {
  const N = this.N, x = this.x, iters = this.nonlinear ? maxIt : 1;
  for (let it = 0; it < iters; it++) {
    this._stamp(ctx, x);
    const xn = this.b.slice();
    if (!lu(this.A, xn, N, colScale(this.A, N))) { this.err = this._singular(lu.bad); return { ok: false, singular: true }; }
    let conv = !this.lim;
    for (let i = 0; i < N; i++) {
      if (!isFinite(xn[i])) return { ok: false };
      const tol = (i < this.n ? 1e-6 : 1e-10) + 1e-5 * Math.max(Math.abs(xn[i]), Math.abs(x[i]));
      if (Math.abs(xn[i] - x[i]) > tol) conv = false;
    }
    const w = it < 30 ? 1 : it < 60 ? 0.5 : it < 100 ? 0.25 : 0.1;
    if (w === 1) x.set(xn); else for (let i = 0; i < N; i++) x[i] += w * (xn[i] - x[i]);
    if (!this.nonlinear || (conv && it > 0)) return { ok: true, iters: it + 1 };
  }
  return { ok: false };
};
/* Newton, then gmin stepping from the previous solution if that fails */
Sim.prototype._robust = function (ctx, maxIt) {
  const xb = this.x.slice(), g0 = ctx.gmin;
  this._syncU();
  let r = this._newton(ctx, maxIt);
  if (r.ok || r.singular || !this.nonlinear) return r;
  this.x.set(xb); this._syncU();
  for (const g of [1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10, 1e-11, g0]) {
    ctx.gmin = Math.max(g, g0); r = this._newton(ctx, maxIt);
    if (!r.ok) break;
  }
  ctx.gmin = g0;
  return r;
};

Sim.prototype._reset = function () {
  this.x.fill(0);
  for (const e of this.elems) e.st = {};
};

Sim.prototype.dc = function () {
  const ctx = this.ctx; ctx.mode = 'dc'; ctx.t = 0; ctx.src = 1; ctx.gmin = 1e-12;
  this.err = null;
  let r = this._newton(ctx, 200);
  if (!r.ok && !r.singular) {
    let ok = true; this._reset();
    for (const g of [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10, 1e-11, 1e-12]) {
      ctx.gmin = g; r = this._newton(ctx, 200);
      if (!r.ok) { ok = false; break; }
    }
    if (!ok && !r.singular) {
      this._reset(); ctx.gmin = 1e-9; ok = true;
      for (let s = 1; s <= 20; s++) { ctx.src = s / 20; r = this._newton(ctx, 200); if (!r.ok) { ok = false; break; } }
      ctx.src = 1; ctx.gmin = 1e-12;
      if (ok) r = this._newton(ctx, 200);
    }
  }
  if (!r.ok && !r.singular) this.err = { kind: 'nonconv', msg: 'The DC solution did not converge (strongly nonlinear or latch-up circuit). Try changing component values.' };
  this.opOk = !!r.ok;
  this._commit(ctx, true);
  return !!r.ok;
};

Sim.prototype._currents = function (ctx) {
  const x = this.x, self = this, tran = ctx.mode === 'tran', h = ctx.h, tr = tran && ctx.trap;
  for (const e of this.elems) {
    const va = this.v(e.n[0]), vb = e.n[1] != null ? this.v(e.n[1]) : 0, i = e.i;
    e.vd = va - vb;
    switch (e.t) {
      case 'R': i[0] = e.vd / e.v; i[1] = -i[0]; break;
      case 'C':
        i[0] = tran ? (tr ? 2 : 1) * e.v / h * (e.vd - (e.st.v || 0)) - (tr ? (e.st.i || 0) : 0) : 0; i[1] = -i[0]; break;
      case 'L': case 'V': case 'AM': i[0] = x[e.br]; i[1] = -i[0]; break;
      case 'I': i[0] = (tran ? wave(e.w, ctx.t) : dcVal(e.w)) * ctx.src; i[1] = -i[0]; break;
      case 'XF': i[0] = x[e.br]; i[1] = -i[0]; i[2] = x[e.br2]; i[3] = -i[2]; e.vd = va - vb; e.vs = this.v(e.n[2]) - this.v(e.n[3]); break;
      case 'OA': i[0] = 0; i[1] = 0; i[2] = -x[e.br]; e.vd = va - vb; break;
      default: {
        const u = e.cp.map(function (p) { return self.v(e.n[p[0]]) - self.v(e.n[p[1]]); });
        const ev = devEval(e, u);
        for (let j = 0; j < ev.i.length; j++) i[j] = ev.i[j];
        e.u = u;
      }
    }
  }
};

Sim.prototype._commit = function (ctx, init) {
  this._currents(ctx);
  for (const e of this.elems) {
    const s = e.st;
    if (e.t === 'C') { s.v = e.vd; s.i = init ? 0 : e.i[0]; }
    else if (e.t === 'L') { s.i = this.x[e.br]; s.v = e.vd; }
    else if (e.t === 'XF') { s.i1 = this.x[e.br]; s.i2 = this.x[e.br2]; s.v1 = e.vd; s.v2 = e.vs; }
  }
};

Sim.prototype.tranInit = function (o) {
  o = o || {};
  this.t = 0; this.err = null;
  if (o.uic) { this._reset(); this.opOk = true; this._commit({ mode: 'dc', t: 0, h: 0, trap: false, gmin: 1e-12, src: 1 }, true); }
  else this.dc();
  for (const e of this.elems) if (e.t === 'C' && e.ic != null && e.ic !== 0 && !isNaN(e.ic)) { e.st.v = e.ic; e.st.i = 0; this.forceBE = 2; }
  this.forceBE = Math.max(this.forceBE, 1);
};

Sim.prototype.step = function (h, depth) {
  depth = depth || 0;
  const t0 = this.t, t1 = t0 + h;
  let be = this.forceBE > 0 || !this.trap;
  if (!be) for (const e of this.elems) if (e.t === 'V' && hasCorner(e.w, t0, t1)) { be = true; break; }
  const ctx = this.ctx; ctx.mode = 'tran'; ctx.t = t1; ctx.h = h; ctx.trap = !be; ctx.gmin = 1e-12; ctx.src = 1;
  const xb = this.x.slice();
  const r = this._robust(ctx, 80);
  if (!r.ok) {
    this.x.set(xb);
    if (depth < 4 && !r.singular) { this.step(h / 2, depth + 1); this.step(h / 2, depth + 1); return; }
    if (!this.err) this.err = { kind: 'nonconv', msg: 'Transient step did not converge near t = ' + fmt(t0, 's') };
    this.t = t1; return;
  }
  this._commit(ctx);
  if (this.forceBE > 0) this.forceBE--;
  this.t = t1;
};
Sim.prototype.advance = function (T, h, maxMs) {
  const tEnd = this.t + T, t0 = Date.now(); let n = 0;
  while (this.t < tEnd - h * 1e-6) {
    this.step(Math.min(h, tEnd - this.t));
    if (++n % 64 === 0 && maxMs && Date.now() - t0 > maxMs) return false;
  }
  return true;
};

/* AC small-signal at the DC operating point. Real 2N block form [Gr -Gi; Gi Gr]. */
Sim.prototype.ac = function (f, o) {
  o = o || {};
  const N = this.N, N2 = 2 * N, w = 2 * Math.PI * f, n = this.n;
  const M = new Float64Array(N2 * N2), bb = new Float64Array(N2);
  const add = function (r, c, gr, gi) {
    if (r < 0 || c < 0) return;
    M[r * N2 + c] += gr; M[(r + N) * N2 + c + N] += gr;
    if (gi) { M[r * N2 + c + N] -= gi; M[(r + N) * N2 + c] += gi; }
  };
  const G = function (a, c, gr, gi) { add(a, a, gr, gi); add(c, c, gr, gi); add(a, c, -gr, -gi); add(c, a, -gr, -gi); };
  for (let i = 0; i < n; i++) add(i, i, 1e-12, 0);
  const nv = (nd) => nd > 0 ? this.x[nd - 1] : 0;
  for (const e of this.elems) {
    const a = e.n[0] - 1, c = e.n[1] - 1;
    switch (e.t) {
      case 'R': G(a, c, 1 / e.v, 0); break;
      case 'C': G(a, c, 0, w * e.v); break;
      case 'L': add(a, e.br, 1, 0); add(c, e.br, -1, 0); add(e.br, a, 1, 0); add(e.br, c, -1, 0); add(e.br, e.br, -1e-3, -w * e.v); break;
      case 'V': case 'AM': {
        add(a, e.br, 1, 0); add(c, e.br, -1, 0); add(e.br, a, 1, 0); add(e.br, c, -1, 0);
        if (!o.zero && e.t === 'V') { const s = acStim(e.w); bb[e.br] += s[0] * Math.cos(s[1]); bb[e.br + N] += s[0] * Math.sin(s[1]); }
        break;
      }
      case 'XF': {
        const p1 = e.n[0] - 1, p2 = e.n[1] - 1, s1 = e.n[2] - 1, s2 = e.n[3] - 1, b1 = e.br, b2 = e.br2;
        add(p1, b1, 1, 0); add(p2, b1, -1, 0); add(b1, p1, 1, 0); add(b1, p2, -1, 0);
        add(s1, b2, 1, 0); add(s2, b2, -1, 0); add(b2, s1, 1, 0); add(b2, s2, -1, 0);
        add(b1, b1, -1e-3, -w * e.L1); add(b1, b2, 0, -w * e.M); add(b2, b1, 0, -w * e.M); add(b2, b2, -1e-3, -w * e.L2);
        break;
      }
      case 'OA': {
        const vd = nv(e.n[0]) - nv(e.n[1]), am = (e.vhi - e.vlo) / 2, th = Math.tanh(e.A * vd / am), fp = e.A * (1 - th * th) + 1e-9;
        add(e.n[2] - 1, e.br, -1, 0); add(e.br, e.n[2] - 1, 1, 0); add(e.br, e.n[0] - 1, -fp, 0); add(e.br, e.n[1] - 1, fp, 0);
        break;
      }
      case 'I': break;
      default: {
        const u = e.cp.map((p) => nv(e.n[p[0]]) - nv(e.n[p[1]])), ev = devEval(e, u);
        for (let j = 0; j < ev.i.length; j++) for (let k = 0; k < e.cp.length; k++) {
          const g = ev.G[j][k], pr = e.cp[k];
          add(e.n[j] - 1, e.n[pr[0]] - 1, g, 0); add(e.n[j] - 1, e.n[pr[1]] - 1, -g, 0);
        }
      }
    }
  }
  if (o.inj) { const q = o.inj; if (q[0] > 0) bb[q[0] - 1] += q[2]; if (q[1] > 0) bb[q[1] - 1] -= q[2]; }
  const sc = colScale(M, N2);
  if (!lu(M, bb, N2, sc)) { this.err = this._singular(lu.bad % N); return null; }
  return { re: bb.subarray(0, N), im: bb.subarray(N) };
};
/* transfer function between nodes at frequency f: returns [mag, phaseRad] */
Sim.prototype.tf = function (f, nin, nout) {
  const s = this.ac(f); if (!s) return null;
  const g = (nd, k) => nd > 0 ? s[k][nd - 1] : 0;
  const ir = g(nin, 're'), ii = g(nin, 'im'), or = g(nout, 're'), oi = g(nout, 'im');
  const d = ir * ir + ii * ii || 1e-300;
  const hr = (or * ir + oi * ii) / d, hi = (oi * ir - or * ii) / d;
  return [Math.hypot(hr, hi), Math.atan2(hi, hr)];
};

/* Thevenin equivalent seen from nodes a,b. Elements wired directly across a-b are the load and are removed
   (or only `only` index if given). Returns {vth, rth, ino}. */
function thevenin(nl, a, b, only) {
  const keep = [];
  nl.elems.forEach(function (e, i) {
    const two = e.n.length === 2 && e.t !== 'V' && e.t !== 'AM';
    const across = two && ((e.n[0] === a && e.n[1] === b) || (e.n[0] === b && e.n[1] === a));
    if (only != null ? i === only : across) return;
    keep.push(e);
  });
  const sim = new Sim({ n: nl.n, elems: keep, nodeName: nl.nodeName });
  if (!sim.dc()) return { err: sim.err };
  const vth = sim.v(a) - sim.v(b);
  const s = sim.ac(0, { zero: true, inj: [a, b, 1] });
  if (!s) return { err: sim.err };
  const g = (nd) => nd > 0 ? s.re[nd - 1] : 0;
  const rth = g(a) - g(b);
  return { vth: vth, rth: rth, ino: rth > 1e-9 ? vth / rth : Infinity };
}
function timeConstants(nl) {
  const out = [];
  nl.elems.forEach(function (e, i) {
    if (e.t !== 'C' && e.t !== 'L') return;
    const r = thevenin(nl, e.n[0], e.n[1], i);
    if (r.err || !(r.rth > 0)) return;
    out.push({ idx: i, e: e, rth: r.rth, tau: e.t === 'C' ? r.rth * e.v : e.v / r.rth });
  });
  return out;
}
/* choose a transient time step from sources, RC/RL time constants and LC resonances */
function autoStep(nl, window) {
  let dt = Infinity, fmax = 0, Lm = Infinity, Cm = Infinity;
  for (const e of nl.elems) {
    if (e.t === 'V' && e.w.f) { fmax = Math.max(fmax, e.w.f); dt = Math.min(dt, 1 / (e.w.f * 100)); if (e.w.k === 'pulse') dt = Math.min(dt, e.w.tr / 2); }
    if (e.t === 'L') Lm = Math.min(Lm, e.v);
    if (e.t === 'C') Cm = Math.min(Cm, e.v);
    if (e.t === 'XF') Lm = Math.min(Lm, e.L2);
  }
  for (const t of timeConstants(nl)) if (t.tau > 0) dt = Math.min(dt, t.tau / 25);
  if (isFinite(Lm) && isFinite(Cm)) dt = Math.min(dt, 2 * Math.PI * Math.sqrt(Lm * Cm) / 60);
  if (!isFinite(dt)) dt = (window || 1e-2) / 1000;
  const lo = (window || 1e-2) / 20000;
  return Math.max(dt, lo);
}

/* ------------------------------------------------------------- part library */
const P2 = [[0, 0], [4, 0]];
const LEDC = { red: [1.9, '#ff4d4d'], yellow: [2.0, '#ffd84d'], green: [2.1, '#4dff7a'], blue: [3.0, '#4d8dff'], white: [3.1, '#fff4e0'] };
const TY = {
  W: { name: 'Wire', pins: [] },
  R: { name: 'Resistor', pre: 'R', pins: P2, f: [['R', 'Resistance', 'Ω']], d: { R: 1000 } },
  C: { name: 'Capacitor', pre: 'C', pins: P2, f: [['C', 'Capacitance', 'F'], ['ic', 'Initial voltage', 'V']], d: { C: 1e-6, ic: 0 } },
  L: { name: 'Inductor', pre: 'L', pins: P2, f: [['L', 'Inductance', 'H']], d: { L: 1e-3 } },
  V: { name: 'DC voltage source', pre: 'V', pins: P2, f: [['V', 'Voltage', 'V']], d: { V: 5 } },
  VAC: { name: 'AC sine source', pre: 'V', pins: P2, f: [['A', 'Amplitude', 'V'], ['f', 'Frequency', 'Hz'], ['ph', 'Phase', '°'], ['off', 'DC offset', 'V']], d: { A: 1, f: 1000, ph: 0, off: 0 } },
  VP: { name: 'Pulse / square source', pre: 'V', pins: P2, f: [['lo', 'Low level', 'V'], ['hi', 'High level', 'V'], ['f', 'Frequency', 'Hz'], ['duty', 'Duty (0-1)', ''], ['td', 'Delay', 's']], d: { lo: 0, hi: 5, f: 1000, duty: 0.5, td: 0 } },
  I: { name: 'DC current source', pre: 'I', pins: P2, f: [['I', 'Current', 'A']], d: { I: 1e-3 } },
  GND: { name: 'Ground', pre: 'GND', pins: [[0, 0]] },
  SW: { name: 'Switch', pre: 'S', pins: P2, f: [], d: { on: 0 } },
  D: { name: 'Diode', pre: 'D', pins: P2, f: [], d: {} },
  LED: { name: 'LED', pre: 'LED', pins: P2, f: [], d: { color: 'red' } },
  ZD: { name: 'Zener diode', pre: 'Z', pins: P2, f: [['Vz', 'Zener voltage', 'V']], d: { Vz: 5.1 } },
  NPN: { name: 'NPN transistor', pre: 'Q', pins: [[0, 2], [2, 0], [2, 4]], f: [['bf', 'Gain β', '']], d: { bf: 100 } },
  NMOS: { name: 'n-MOSFET', pre: 'M', pins: [[0, 2], [2, 0], [2, 4]], f: [['Vt', 'Threshold Vt', 'V'], ['kp', 'k (A/V²)', ''], ['lam', 'Lambda λ', '1/V']], d: { Vt: 1, kp: 0.02, lam: 0.02 } },
  PMOS: { name: 'p-MOSFET', pre: 'M', pins: [[0, 2], [2, 4], [2, 0]], f: [['Vt', 'Threshold |Vt|', 'V'], ['kp', 'k (A/V²)', ''], ['lam', 'Lambda λ', '1/V']], d: { Vt: 1, kp: 0.02, lam: 0.02 } },
  OA: { name: 'Op-amp', pre: 'U', pins: [[0, 1], [0, 3], [4, 2]], f: [['vhi', 'Positive rail', 'V'], ['vlo', 'Negative rail', 'V']], d: { vhi: 12, vlo: -12 } },
  XF: { name: 'Transformer', pre: 'T', pins: [[0, 0], [0, 4], [4, 0], [4, 4]], f: [['L1', 'Primary L', 'H'], ['n', 'Turns ratio Ns/Np', ''], ['k', 'Coupling k', '']], d: { L1: 1, n: 0.5, k: 0.99 } },
  LAMP: { name: 'Lamp', pre: 'LP', pins: P2, f: [['R', 'Resistance', 'Ω'], ['Pr', 'Rated power', 'W']], d: { R: 100, Pr: 0.25 } },
  VM: { name: 'Voltmeter', pre: 'VM', pins: P2, f: [], d: {} },
  AM: { name: 'Ammeter', pre: 'A', pins: P2, f: [], d: {} }
};
function rot(x, y, r) { r = ((r % 4) + 4) % 4; for (let i = 0; i < r; i++) { const t = x; x = -y; y = t; } return [x, y]; }
function pinPts(p) {
  return TY[p.type].pins.map(function (q) { const r = rot(q[0], q[1], p.rot || 0); return [p.x + r[0], p.y + r[1]]; });
}
const KEY = function (x, y) { return x + ',' + y; };

/* Compile editor circuit {parts, wires} to a netlist + wire graph. */
function compile(circ) {
  const uf = new Map();
  const find = function (k) { let r = k; while (uf.get(r) !== r) r = uf.get(r); let c = k; while (c !== r) { const nx = uf.get(c); uf.set(c, r); c = nx; } return r; };
  const add = function (k) { if (!uf.has(k)) uf.set(k, k); return k; };
  const uni = function (a, b) { a = find(add(a)); b = find(add(b)); if (a !== b) uf.set(a, b); };
  const warnings = [], allPts = new Map();
  const parts = circ.parts.filter(function (p) { return TY[p.type]; });
  for (const p of parts) { p._pp = pinPts(p); for (const q of p._pp) { allPts.set(KEY(q[0], q[1]), q); add(KEY(q[0], q[1])); } }
  const wires = circ.wires.filter(function (w) { return w.x1 !== w.x2 || w.y1 !== w.y2; });
  for (const w of wires) { allPts.set(KEY(w.x1, w.y1), [w.x1, w.y1]); allPts.set(KEY(w.x2, w.y2), [w.x2, w.y2]); }
  const segs = [];
  for (const w of wires) {
    const on = [];
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy;
    allPts.forEach(function (q) {
      const px = q[0] - w.x1, py = q[1] - w.y1;
      if (px * dy - py * dx !== 0) return;
      const tt = (px * dx + py * dy) / L2;
      if (tt >= 0 && tt <= 1) on.push([tt, q]);
    });
    on.sort(function (a, b) { return a[0] - b[0]; });
    for (let i = 0; i + 1 < on.length; i++) {
      const a = on[i][1], b = on[i + 1][1];
      segs.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], ka: KEY(a[0], a[1]), kb: KEY(b[0], b[1]), w: w });
      uni(KEY(a[0], a[1]), KEY(b[0], b[1]));
    }
  }
  // ground
  const gset = new Set();
  for (const p of parts) if (p.type === 'GND') gset.add(find(p._pp[0] && KEY(p._pp[0][0], p._pp[0][1])));
  let gnd = null;
  if (gset.size) { gset.forEach(function (r) { gnd = gnd == null ? r : (uni(gnd, r), find(gnd)); }); gnd = find(gnd); }
  else {
    const src = parts.find(function (p) { return p.type === 'V' || p.type === 'VAC' || p.type === 'VP'; });
    if (src) { gnd = find(KEY(src._pp[1][0], src._pp[1][1])); warnings.push('No ground symbol: using the negative terminal of ' + (src.name || 'the first source') + ' as 0 V. Add a ground part to be explicit.'); }
    else if (parts.length) { const p0 = parts.find(function (p) { return p._pp.length; }); if (p0) { gnd = find(KEY(p0._pp[0][0], p0._pp[0][1])); warnings.push('No ground symbol: add a ground part to set the 0 V reference.'); } }
  }
  const netId = new Map(); if (gnd != null) netId.set(gnd, 0);
  let nn = 0;
  const net = function (k) { const r = find(k); if (!netId.has(r)) netId.set(r, ++nn); return netId.get(r); };
  const elems = [];
  for (const p of parts) {
    const pr = Object.assign({}, TY[p.type].d, p.p || {});
    const nets = p._pp.map(function (q) { return net(KEY(q[0], q[1])); });
    p.nets = nets; p.el = -1;
    let e = null;
    switch (p.type) {
      case 'R': e = { t: 'R', v: Math.max(pr.R, 1e-6) }; break;
      case 'SW': e = { t: 'R', v: pr.on ? 1e-3 : 1e12 }; break;
      case 'LAMP': e = { t: 'R', v: Math.max(pr.R, 1e-3), lamp: true, pr: pr.Pr }; break;
      case 'C': e = { t: 'C', v: Math.max(pr.C, 1e-15), ic: pr.ic }; break;
      case 'L': e = { t: 'L', v: Math.max(pr.L, 1e-12) }; break;
      case 'V': e = { t: 'V', w: { k: 'dc', v: pr.V } }; break;
      case 'VAC': e = { t: 'V', w: { k: 'sin', off: pr.off, amp: pr.A, f: Math.max(pr.f, 1e-6), ph: pr.ph } }; break;
      case 'VP': {
        const f = Math.max(pr.f, 1e-6), duty = Math.min(Math.max(pr.duty, 0.01), 0.98);
        e = { t: 'V', w: { k: 'pulse', lo: pr.lo, hi: pr.hi, f: f, duty: duty * 0.98, td: pr.td || 0, tr: 0.01 / f } }; break;
      }
      case 'I': e = { t: 'I', w: { k: 'dc', v: pr.I } }; break;
      case 'D': e = { t: 'D' }; break;
      case 'LED': { const c = LEDC[pr.color] || LEDC.red; e = { t: 'D', nf: 2, Is: 0.01 / Math.exp(c[0] / (2 * VT)), led: pr.color }; break; }
      case 'ZD': e = { t: 'D', vz: pr.Vz }; break;
      case 'NPN': e = { t: 'Q', bf: pr.bf }; break;
      case 'NMOS': e = { t: 'M', pol: 1, vt: pr.Vt, kp: pr.kp, lam: pr.lam }; break;
      case 'PMOS': e = { t: 'M', pol: -1, vt: pr.Vt, kp: pr.kp, lam: pr.lam }; break;
      case 'OA': e = { t: 'OA', vhi: pr.vhi, vlo: pr.vlo }; break;
      case 'XF': e = { t: 'XF', L1: pr.L1, L2: pr.L1 * pr.n * pr.n, k: Math.min(Math.max(pr.k, 0.01), 0.9999) }; break;
      case 'AM': e = { t: 'AM' }; break;
    }
    if (!e) continue;
    const swap = e.t === 'OA' || e.t === 'Q' || e.t === 'M';   // pin order (B/G, C/D, E/S) -> element order (C/D, B/G, E/S)
    e.n = swap ? [nets[1], nets[0], nets[2]] : nets.slice();
    e.name = p.name || p.type; e.part = p; e.pk = swap ? [p._pp[1], p._pp[0], p._pp[2]] : p._pp;
    p.el = elems.length; elems.push(e);
  }
  const nl = { n: nn, elems: elems, warnings: warnings };
  // node naming
  nl.nodeName = function (k) { return k === 0 ? 'GND' : 'N' + k; };
  // floating-node check (structural)
  const g = new Array(nn + 1); for (let i = 0; i <= nn; i++) g[i] = i;
  const gf = function (a) { while (g[a] !== a) { g[a] = g[g[a]]; a = g[a]; } return a; };
  const gu = function (a, b) { a = gf(a); b = gf(b); if (a !== b) g[a] = b; };
  for (const e of elems) {
    if (e.t === 'M') gu(e.n[0], e.n[2]);
    else if (e.t === 'Q') { gu(e.n[0], e.n[1]); gu(e.n[1], e.n[2]); }
    else if (e.t === 'OA') gu(e.n[2], 0);
    else if (e.t === 'XF') { gu(e.n[0], e.n[1]); gu(e.n[0], e.n[2]); gu(e.n[2], e.n[3]); }
    else gu(e.n[0], e.n[1]);
  }
  const used = new Set(); for (const e of elems) for (const k of e.n) used.add(k);
  const fl = []; used.forEach(function (k) { if (gf(k) !== gf(0)) fl.push(k); });
  if (fl.length) warnings.push('Floating node' + (fl.length > 1 ? 's' : '') + ' ' + fl.map(nl.nodeName).join(', ') + ': no connection to ground.');
  // geometry for visualization
  const pidx = new Map(), pts = [];
  const pi = function (k, x, y) { if (!pidx.has(k)) { pidx.set(k, pts.length); pts.push({ k: k, x: x, y: y, net: net(k) }); } return pidx.get(k); };
  for (const s of segs) { s.a = pi(s.ka, s.x1, s.y1); s.b = pi(s.kb, s.x2, s.y2); s.net = pts[s.a].net; }
  for (const p of parts) for (const q of p._pp) pi(KEY(q[0], q[1]), q[0], q[1]);
  const adj = pts.map(function () { return []; });
  segs.forEach(function (s, i) { adj[s.a].push([s.b, i]); adj[s.b].push([s.a, i]); });
  const seen = new Uint8Array(pts.length), order = [], par = new Int32Array(pts.length).fill(-1), psg = new Int32Array(pts.length).fill(-1);
  for (let r = 0; r < pts.length; r++) {
    if (seen[r]) continue; seen[r] = 1; const q = [r];
    for (let qi = 0; qi < q.length; qi++) {
      const u = q[qi]; order.push(u);
      for (const nb of adj[u]) if (!seen[nb[0]]) { seen[nb[0]] = 1; par[nb[0]] = u; psg[nb[0]] = nb[1]; q.push(nb[0]); }
    }
  }
  nl.pts = pts; nl.pidx = pidx; nl.segs = segs; nl.tree = { order: order, par: par, psg: psg };
  nl.gnd0 = parts.filter(function (p) { return p.type === 'GND'; }).map(function (p) { return pidx.get(KEY(p._pp[0][0], p._pp[0][1])); });
  nl.parts = parts;
  nl.netAt = function (x, y) {
    const k = KEY(x, y); if (pidx.has(k)) return pts[pidx.get(k)].net;
    let best = null, bd = 1e9;
    for (const s of segs) {
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy || 1;
      let t = ((x - s.x1) * dx + (y - s.y1) * dy) / L2; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(s.x1 + t * dx - x, s.y1 + t * dy - y);
      if (d < bd) { bd = d; best = s; }
    }
    return best && bd < 0.5 ? best.net : null;
  };
  return nl;
}
/* current along each wire segment (positive = from (x1,y1) to (x2,y2)) given a solved Sim built from nl */
function wireFlows(nl, sim) {
  const pts = nl.pts, inj = new Float64Array(pts.length), flows = new Float64Array(nl.segs.length);
  for (const e of sim.elems) {
    if (!e.pk) continue;
    for (let j = 0; j < e.pk.length; j++) {
      const id = nl.pidx.get(KEY(e.pk[j][0], e.pk[j][1]));
      if (id != null) inj[id] -= e.i[j] || 0;
    }
  }
  let s0 = 0; pts.forEach(function (p, i) { if (p.net === 0) s0 += inj[i]; });
  if (nl.gnd0.length) inj[nl.gnd0[0]] -= s0;
  const T = nl.tree;
  for (let i = T.order.length - 1; i >= 0; i--) {
    const u = T.order[i], p = T.par[u];
    if (p < 0) continue;
    const sg = nl.segs[T.psg[u]];
    flows[T.psg[u]] = inj[u] * (sg.a === u ? 1 : -1);
    inj[p] += inj[u];
  }
  return flows;
}

/* ======================================================================= UI */
const API = { devEval, fmt, parseEng, Sim, compile, thevenin, timeConstants, autoStep, wireFlows, TY, LEDC, wave, pinPts, rot, KEY };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.CircuitSolver = API;
if (typeof document === 'undefined') return;

const LABS = root.LABS = root.LABS || {};
const CSS = `
.cl-root{position:absolute;inset:0;display:flex;flex-direction:column;background:#060914;color:var(--text,#e8ecf5);font:13px Inter,system-ui,sans-serif;overflow:hidden;outline:none;-webkit-user-select:none;user-select:none}
.cl-root *{box-sizing:border-box}
.cl-root button,.cl-root select,.cl-root input{font:inherit;color:inherit}
.cl-bar{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--line,rgba(255,255,255,.12));background:rgba(10,14,26,.92);flex-wrap:wrap;flex:none}
.cl-btn{background:rgba(255,255,255,.05);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:9px;padding:5px 10px;cursor:pointer;white-space:nowrap;transition:border-color .15s,background .15s}
.cl-btn:hover{border-color:rgba(255,255,255,.35)}
.cl-btn.on{background:rgba(110,231,255,.16);border-color:var(--accent,#6ee7ff);color:#fff}
.cl-seg{display:flex;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:999px;padding:2px;gap:2px;background:rgba(255,255,255,.03)}
.cl-seg button{border:0;background:none;padding:4px 12px;border-radius:999px;cursor:pointer;color:var(--dim,#98a2b8)}
.cl-seg button.on{background:rgba(110,231,255,.18);color:#fff}
.cl-sel{background:#0d1222;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:9px;padding:5px 8px;max-width:210px}
.cl-sp{flex:1}
.cl-lab{color:var(--dim,#98a2b8);font-size:12px}
.cl-main{flex:1;display:flex;min-height:0}
.cl-pal{width:140px;flex:none;overflow-y:auto;padding:8px 6px;border-right:1px solid var(--line,rgba(255,255,255,.12));background:rgba(10,14,26,.7);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;align-content:start}
.cl-pb{display:flex;flex-direction:column;align-items:center;gap:1px;padding:3px 2px 2px;border-radius:9px;border:1px solid transparent;background:rgba(255,255,255,.035);cursor:pointer;font-size:9.5px;color:var(--dim,#98a2b8);min-height:56px}
.cl-pb:hover{border-color:rgba(255,255,255,.28);color:#fff}
.cl-pb.on{border-color:var(--accent,#6ee7ff);background:rgba(110,231,255,.14);color:#fff}
.cl-pb{overflow:visible;height:56px}.cl-pb span{line-height:14px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cl-pb canvas{width:46px;height:30px;pointer-events:none}
.cl-stage{flex:1;position:relative;min-width:0;overflow:hidden}
.cl-cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.cl-glass{background:var(--panel,rgba(10,14,26,.78));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--line,rgba(255,255,255,.12));border-radius:14px}
.cl-explain{position:absolute;left:10px;top:10px;width:min(350px,calc(100% - 20px));max-height:58%;overflow:auto;padding:10px 12px;font-size:12.5px;line-height:1.5}
.cl-explain h4{margin:0 0 5px;font:600 11px 'Space Grotesk',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--accent,#6ee7ff);display:flex;align-items:center;justify-content:space-between}
.cl-explain h4 span{cursor:pointer;color:var(--dim,#98a2b8);letter-spacing:0}
.cl-explain .t{font:600 14px 'Space Grotesk',sans-serif;margin-bottom:2px}
.cl-explain p{margin:3px 0;color:#c5cde0}
.cl-explain .try{border-left:3px solid var(--gold,#ffd166);background:rgba(255,209,102,.07);padding:6px 9px;border-radius:0 9px 9px 0;color:#f1e6c8;margin:4px 0 8px}
.cl-explain ul{margin:4px 0 0;padding:0;list-style:none}
.cl-explain li{padding:3px 0;border-top:1px solid rgba(255,255,255,.06);color:#d7def0}
.cl-explain li b{color:var(--gold,#ffd166);font-weight:600}
.cl-explain .mini{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}
.cl-props{position:absolute;right:10px;top:10px;width:236px;max-height:calc(100% - 20px);overflow:auto;padding:10px 12px;display:none}
.cl-props h4{margin:0 0 6px;font:600 14px 'Space Grotesk',sans-serif}
.cl-row{display:flex;align-items:center;gap:6px;margin:5px 0}
.cl-row label{flex:0 0 92px;color:var(--dim,#98a2b8);font-size:12px}
.cl-row input[type=text],.cl-row select{flex:1;min-width:0;background:#0d1222;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:7px;padding:4px 7px;-webkit-user-select:text;user-select:text}
.cl-row input[type=range]{flex:1;min-width:0;accent-color:#6ee7ff}
.cl-read{font-size:12px;color:#c5cde0;line-height:1.55;margin-top:6px;border-top:1px solid rgba(255,255,255,.08);padding-top:6px}
.cl-read b{color:var(--accent,#6ee7ff);font-weight:500}
.cl-banner{position:absolute;left:50%;top:8px;transform:translateX(-50%);max-width:min(620px,60%);padding:7px 12px;border-radius:11px;font-size:12.5px;display:none;z-index:3;text-align:center}
.cl-banner.err{background:rgba(255,77,94,.16);border:1px solid rgba(255,77,94,.5);color:#ffc9cf}
.cl-banner.info{background:rgba(110,231,255,.14);border:1px solid rgba(110,231,255,.45);color:#cdf5ff}
.cl-tip{position:absolute;pointer-events:none;padding:5px 8px;border-radius:8px;background:rgba(8,12,24,.92);border:1px solid var(--line,rgba(255,255,255,.18));font-size:12px;line-height:1.4;white-space:nowrap;display:none;z-index:4}
.cl-legend{position:absolute;right:12px;bottom:10px;width:150px;padding:6px 9px 5px;font-size:10.5px;color:var(--dim,#98a2b8);pointer-events:none}
.cl-legend i{display:block;height:8px;border-radius:4px;margin:3px 0 2px;background:linear-gradient(90deg,#3b6cff,#31c7d8,#ffd166,#ff4d5e)}
.cl-legend div{display:flex;justify-content:space-between}
.cl-try{position:absolute;left:10px;bottom:10px;width:min(340px,calc(100% - 180px));padding:8px 11px;display:none}
.cl-try .cl-row label{flex:0 0 86px}
.cl-try .v{flex:0 0 66px;text-align:right;color:var(--gold,#ffd166);font-variant-numeric:tabular-nums}
.cl-drawer{flex:none;height:var(--cl-dh,262px);border-top:1px solid var(--line,rgba(255,255,255,.12));background:rgba(10,14,26,.94);display:flex;flex-direction:column;min-height:0}
.cl-tabs{display:flex;gap:2px;padding:4px 8px 0;border-bottom:1px solid var(--line,rgba(255,255,255,.12));flex:none;align-items:flex-end}
.cl-tab{padding:5px 13px;border:1px solid transparent;border-bottom:0;border-radius:9px 9px 0 0;cursor:pointer;color:var(--dim,#98a2b8);background:none}
.cl-tab.on{background:rgba(110,231,255,.1);border-color:var(--line,rgba(255,255,255,.12));color:#fff}
.cl-pane{flex:1;min-height:0;display:none;padding:8px 10px;gap:10px}
.cl-pane.on{display:flex}
.cl-pane canvas{flex:1;min-width:0;height:100%;display:block;border-radius:9px;background:#05070f;border:1px solid rgba(255,255,255,.08)}
.cl-ctl{flex:0 0 206px;overflow-y:auto;font-size:12px}
.cl-ctl .cl-row label{flex:0 0 60px}
.cl-ctl .cl-btn{padding:3px 8px;font-size:12px}
.cl-ctl .ch1{color:#ffd166}.cl-ctl .ch2{color:#6ee7ff}
.cl-stat{margin-top:6px;font-size:11.5px;color:#aeb8cf;line-height:1.5;font-variant-numeric:tabular-nums}
.cl-dmm{display:flex;flex-direction:column;gap:6px;flex:1;justify-content:center;align-items:flex-start;padding-left:10px}
.cl-dmm .big{font:600 44px 'Space Grotesk',sans-serif;color:#9dff9d;background:#06140a;border:1px solid #1d3b24;border-radius:10px;padding:2px 16px;letter-spacing:.03em;min-width:300px;text-shadow:0 0 14px rgba(120,255,120,.45)}
.cl-dmm .sm{color:var(--dim,#98a2b8);font-size:12.5px;display:flex;gap:18px;flex-wrap:wrap}
.cl-dmm .sm b{color:#e8ecf5;font-weight:500}
.cl-tbl{flex:1;overflow:auto;display:flex;gap:18px;align-items:flex-start}
.cl-tbl table{border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.cl-tbl th{font:600 10.5px 'Space Grotesk',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--accent,#6ee7ff);text-align:left;padding:2px 12px 4px 0;position:sticky;top:0;background:#0a0e1a}
.cl-tbl td{padding:2px 12px 2px 0;border-top:1px solid rgba(255,255,255,.06);color:#d7def0}
.cl-tbl td.n{color:var(--dim,#98a2b8)}
@media (max-width:760px){.cl-main{flex-direction:column}.cl-pal{width:auto;flex-direction:row;display:flex;overflow-x:auto;overflow-y:hidden;border-right:0;border-bottom:1px solid var(--line,rgba(255,255,255,.12))}.cl-pb{flex:0 0 54px}.cl-explain{max-height:40%}.cl-drawer{--cl-dh:230px}.cl-ctl{flex-basis:150px}}
`;

/* ---------- symbol drawing (local grid coordinates; caller sets stroke/lineWidth) ---------- */
function ln(c, a) { c.beginPath(); c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); c.stroke(); }
function circ(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, 7); if (fill) c.fill(); else c.stroke(); }
function head(c, x1, y1, x2, y2, s) {
  const a = Math.atan2(y2 - y1, x2 - x1); c.beginPath(); c.moveTo(x2, y2);
  c.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)); c.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)); c.closePath(); c.fill();
}
const LEAD = { R: [1, 3], C: [1.8, 2.2], L: [1, 3], V: [1.7, 2.3], VAC: [1.2, 2.8], VP: [1.2, 2.8], I: [1.2, 2.8], LAMP: [1.25, 2.75], VM: [1.2, 2.8], AM: [1.2, 2.8], D: [1.4, 2.6], LED: [1.4, 2.6], ZD: [1.4, 2.6], SW: [1, 3] };
const SYM = {
  R(c) { ln(c, [1, 0, 1.2, -.4, 1.6, .4, 2, -.4, 2.4, .4, 2.8, -.4, 3, 0]); },
  C(c) { ln(c, [1.8, -.75, 1.8, .75]); ln(c, [2.2, -.75, 2.2, .75]); },
  L(c) { c.beginPath(); c.moveTo(1, 0); for (let i = 0; i < 4; i++) c.arc(1.25 + .5 * i, 0, .25, Math.PI, 0); c.stroke(); },
  V(c) { ln(c, [1.7, -.8, 1.7, .8]); ln(c, [2.3, -.4, 2.3, .4]); },
  VAC(c) { circ(c, 2, 0, .8); c.beginPath(); c.moveTo(1.5, 0); c.bezierCurveTo(1.65, -.65, 1.85, -.65, 2, 0); c.bezierCurveTo(2.15, .65, 2.35, .65, 2.5, 0); c.stroke(); },
  VP(c) { circ(c, 2, 0, .8); ln(c, [1.5, .3, 1.5, -.3, 2, -.3, 2, .3, 2.5, .3, 2.5, -.3]); },
  I(c) { circ(c, 2, 0, .8); ln(c, [1.45, 0, 2.45, 0]); head(c, 1.5, 0, 2.55, 0, .32); },
  LAMP(c) { circ(c, 2, 0, .75); ln(c, [1.47, -.53, 2.53, .53]); ln(c, [1.47, .53, 2.53, -.53]); },
  VM(c) { circ(c, 2, 0, .8); }, AM(c) { circ(c, 2, 0, .8); },
  D(c) { c.beginPath(); c.moveTo(1.4, -.6); c.lineTo(1.4, .6); c.lineTo(2.6, 0); c.closePath(); c.stroke(); ln(c, [2.6, -.6, 2.6, .6]); },
  LED(c) { SYM.D(c); ln(c, [1.9, -.85, 2.45, -1.4]); head(c, 1.9, -.85, 2.5, -1.45, .26); ln(c, [2.4, -.65, 2.95, -1.2]); head(c, 2.4, -.65, 3, -1.25, .26); },
  ZD(c) { c.beginPath(); c.moveTo(1.4, -.6); c.lineTo(1.4, .6); c.lineTo(2.6, 0); c.closePath(); c.stroke(); ln(c, [2.95, -.6, 2.6, -.6, 2.6, .6, 2.25, .6]); },
  SW(c, p) { circ(c, 1, 0, .1, true); circ(c, 3, 0, .1, true); ln(c, p && p.on ? [1, 0, 3, 0] : [1, 0, 2.8, -.9]); },
  GND(c) { ln(c, [0, 0, 0, .5]); ln(c, [-.6, .5, .6, .5]); ln(c, [-.4, .78, .4, .78]); ln(c, [-.18, 1.05, .18, 1.05]); },
  NPN(c) { ln(c, [0, 2, .9, 2]); ln(c, [.9, 1.1, .9, 2.9]); ln(c, [.9, 1.5, 2, .7, 2, 0]); ln(c, [.9, 2.5, 2, 3.3, 2, 4]); head(c, .9, 2.5, 1.9, 3.23, .3); c.globalAlpha *= .35; circ(c, 1.25, 2, 1.7); },
  NMOS(c) { ln(c, [0, 2, .6, 2]); ln(c, [.6, 1, .6, 3]); ln(c, [1, .7, 1, 1.4]); ln(c, [1, 1.65, 1, 2.35]); ln(c, [1, 2.6, 1, 3.3]); ln(c, [1, 1, 2, 1, 2, 0]); ln(c, [1, 3, 2, 3, 2, 4]); ln(c, [1, 2, 1.6, 2]); head(c, 1.6, 2, 1, 2, .28); },
  PMOS(c) { ln(c, [0, 2, .3, 2]); circ(c, .45, 2, .15); ln(c, [.6, 1, .6, 3]); ln(c, [1, .7, 1, 1.4]); ln(c, [1, 1.65, 1, 2.35]); ln(c, [1, 2.6, 1, 3.3]); ln(c, [1, 1, 2, 1, 2, 0]); ln(c, [1, 3, 2, 3, 2, 4]); ln(c, [1, 2, 1.6, 2]); head(c, 1, 2, 1.6, 2, .28); },
  OA(c) { ln(c, [.5, 0, .5, 4, 3.5, 2, .5, 0]); ln(c, [0, 1, .5, 1]); ln(c, [0, 3, .5, 3]); ln(c, [3.5, 2, 4, 2]); ln(c, [.75, 1, 1.1, 1]); ln(c, [.75, 3, 1.1, 3]); ln(c, [.925, 2.825, .925, 3.175]); },
  XF(c) {
    ln(c, [0, 0, .8, 0]); ln(c, [0, 4, .8, 4]); ln(c, [3.2, 0, 4, 0]); ln(c, [3.2, 4, 4, 4]); ln(c, [1.9, 0, 1.9, 4]); ln(c, [2.1, 0, 2.1, 4]);
    c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(.8, i); c.arc(.8, i + .5, .5, -Math.PI / 2, Math.PI / 2); } c.stroke();
    c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(3.2, i); c.arc(3.2, i + .5, .5, -Math.PI / 2, Math.PI / 2, true); } c.stroke();
    circ(c, 1.45, .3, .08, true); circ(c, 2.55, .3, .08, true);
  }
};
const BB = { NPN: [0, -.3, 2.4, 4.3], NMOS: [0, -.3, 2.4, 4.3], PMOS: [0, -.3, 2.4, 4.3], OA: [0, -.3, 4, 4.3], XF: [0, -.3, 4, 4.3], GND: [-.8, -.2, .8, 1.3], LED: [0, -1.5, 4, 1], default: [0, -1, 4, 1] };
const PALETTE = ['R', 'C', 'L', 'V', 'VAC', 'VP', 'I', 'GND', 'SW', 'D', 'LED', 'ZD', 'NPN', 'NMOS', 'PMOS', 'OA', 'XF', 'LAMP', 'VM', 'AM'];
const SHORT = { R: 'Resistor', C: 'Capacitor', L: 'Inductor', V: 'DC source', VAC: 'AC source', VP: 'Pulse src', I: 'Current src', GND: 'Ground', SW: 'Switch', D: 'Diode', LED: 'LED', ZD: 'Zener', NPN: 'NPN', NMOS: 'n-MOS', PMOS: 'p-MOS', OA: 'Op-amp', XF: 'Transformer', LAMP: 'Lamp', VM: 'Voltmeter', AM: 'Ammeter' };
const G = (p, k) => p.p && p.p[k] != null ? p.p[k] : (TY[p.type].d || {})[k];
function plabel(p) {
  switch (p.type) {
    case 'R': case 'LAMP': return fmt(G(p, 'R'), 'Ω'); case 'C': return fmt(G(p, 'C'), 'F'); case 'L': return fmt(G(p, 'L'), 'H'); case 'V': return fmt(G(p, 'V'), 'V');
    case 'VAC': return fmt(G(p, 'A'), 'V') + ' ' + fmt(G(p, 'f'), 'Hz'); case 'VP': return fmt(G(p, 'lo'), 'V') + '..' + fmt(G(p, 'hi'), 'V') + ' ' + fmt(G(p, 'f'), 'Hz');
    case 'I': return fmt(G(p, 'I'), 'A'); case 'ZD': return fmt(G(p, 'Vz'), 'V'); case 'SW': return G(p, 'on') ? 'closed' : 'open'; case 'NPN': return 'β ' + G(p, 'bf');
    case 'NMOS': case 'PMOS': return 'Vt ' + fmt(G(p, 'Vt'), 'V'); case 'XF': return '1:' + (+G(p, 'n')).toFixed(2); case 'LED': return G(p, 'color'); default: return '';
  }
}
function vcolor(t) {
  t = Math.max(0, Math.min(1, t)); const S = [[59, 108, 255], [49, 199, 216], [255, 209, 102], [255, 77, 94]], x = t * 3, i = Math.min(2, Math.floor(x)), f = x - i;
  return 'rgb(' + S[i].map(function (a, k) { return Math.round(a + (S[i + 1][k] - a) * f); }).join(',') + ')';
}
function snap125(v, list) { let b = list[0]; for (const x of list) if (Math.abs(Math.log(x / v)) < Math.abs(Math.log(b / v))) b = x; return b; }
const TDIVS = [], VDIVS = [];
for (let e = -6; e <= 0; e++) for (const m of [1, 2, 5]) TDIVS.push(m * Math.pow(10, e));
for (let e = -3; e <= 2; e++) for (const m of [1, 2, 5]) VDIVS.push(m * Math.pow(10, e));
let presetCache = null;
function loadPresets() {
  if (!presetCache) presetCache = fetch((LABS.circuit && LABS.circuit.presetUrl) || 'data/labs/circuit_presets.json').then(function (r) { return r.json(); }).catch(function () { return []; });
  return presetCache;
}

/* ================================================================ app instance */
function createLab(container, presetId) {
  if (!document.getElementById('cl-style')) { const st = document.createElement('style'); st.id = 'cl-style'; st.textContent = CSS; document.head.appendChild(st); }
  const R = document.createElement('div'); R.className = 'cl-root'; R.tabIndex = 0;
  R.innerHTML = `
  <div class="cl-bar">
    <select class="cl-sel" data-k="preset" title="Example circuits"></select>
    <div class="cl-seg" data-k="mode"><button data-m="dc" title="DC operating point">DC</button><button data-m="tran" title="Transient (time) simulation">Transient</button><button data-m="ac" title="AC small-signal sweep (Bode)">AC</button></div>
    <button class="cl-btn" data-k="run" title="Run / pause the time simulation (Space)">Pause</button>
    <button class="cl-btn" data-k="reset" title="Restart the simulation from t = 0">Restart</button>
    <span class="cl-lab">speed</span><input type="range" data-k="speed" min="-1.5" max="1.5" step="0.05" value="0" style="width:86px;accent-color:#6ee7ff" title="Simulation speed">
    <span class="cl-lab" data-k="tnow"></span>
    <span class="cl-sp"></span>
    <button class="cl-btn" data-k="rot" title="Rotate selected part (R)">Rotate</button>
    <button class="cl-btn" data-k="del" title="Delete selected (Del)">Delete</button>
    <button class="cl-btn" data-k="fit" title="Fit circuit to view (F)">Fit</button>
    <button class="cl-btn" data-k="clear" title="Remove everything">Clear</button>
    <button class="cl-btn on" data-k="explain" title="Plain-language explanation">What's happening?</button>
  </div>
  <div class="cl-main">
    <div class="cl-pal" data-k="pal"></div>
    <div class="cl-stage" data-k="stage">
      <canvas class="cl-cv" data-k="cv"></canvas>
      <div class="cl-banner" data-k="banner"></div>
      <div class="cl-explain cl-glass" data-k="exp"></div>
      <div class="cl-props cl-glass" data-k="props"></div>
      <div class="cl-try cl-glass" data-k="try"></div>
      <div class="cl-legend cl-glass"><div><span>node voltage</span></div><i></i><div><span data-k="lmin">0 V</span><span data-k="lmax">5 V</span></div></div>
      <div class="cl-tip" data-k="tip"></div>
    </div>
  </div>
  <div class="cl-drawer" data-k="drawer">
    <div class="cl-tabs"><button class="cl-tab on" data-t="scope">Oscilloscope</button><button class="cl-tab" data-t="bode">Bode plotter</button><button class="cl-tab" data-t="meter">Multimeter</button><button class="cl-tab" data-t="values">Values</button><span class="cl-sp"></span><button class="cl-tab" data-t="hide" title="Collapse / expand">&#9662;</button></div>
    <div class="cl-pane on" data-p="scope"><canvas data-k="scv"></canvas><div class="cl-ctl" data-k="sctl"></div></div>
    <div class="cl-pane" data-p="bode"><canvas data-k="bcv"></canvas><div class="cl-ctl" data-k="bctl"></div></div>
    <div class="cl-pane" data-p="meter" data-k="mpane"></div>
    <div class="cl-pane" data-p="values"><div class="cl-tbl" data-k="vtbl"></div></div>
  </div>`;
  container.appendChild(R);
  const q = function (k) { return R.querySelector('[data-k="' + k + '"]'); };
  const E = {}; ['preset', 'mode', 'run', 'reset', 'speed', 'tnow', 'rot', 'del', 'fit', 'clear', 'explain', 'pal', 'stage', 'cv', 'banner', 'exp', 'props', 'try', 'lmin', 'lmax', 'tip', 'drawer', 'scv', 'sctl', 'bcv', 'bctl', 'mpane', 'vtbl'].forEach(function (k) { E[k] = q(k); });
  const cx = E.cv.getContext('2d');

  /* ---------------- state ---------------- */
  const A = {
    parts: [], wires: [], nextId: 1, sel: null, view: { ox: 60, oy: 60, s: 28 }, tool: 'select', place: null, placeRot: 0, wstart: null, mouse: { gx: 0, gy: 0, px: 0, py: 0, in: false },
    nl: null, sim: null, mode: 'dc', running: true, speed: 1, uic: false, h: 1e-5, hist: { t: [], a: [], b: [], c: [] }, flows: null, dot: null, fref: 1e-9,
    sc: { tdiv: 1e-3, v1: 1, v2: 1, trig: 0 }, pr: { c1: null, r1: null, c2: null, r2: null, da: null, db: null }, pn: {}, bode: { in: null, out: null, fmin: 10, fmax: 1e5 }, bd: null,
    thev: { a: null, b: null }, pick: null, preset: null, sliders: [], expOn: true, tab: 'scope', vmin: 0, vmax: 1, dirty: true, err: null, expNode: null, tvx: 0, closed: false, lastExp: 0, presets: []
  };
  const view = A.view;
  const pos = function (e) { const r = E.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const toG = function (px, py) { return [(px - view.ox) / view.s, (py - view.oy) / view.s]; };
  const toP = function (gx, gy) { return [gx * view.s + view.ox, gy * view.s + view.oy]; };

  /* ---------------- build / compile ---------------- */
  function winLen() { return 10 * A.sc.tdiv; }
  function resolveProbes() {
    const nl = A.nl, n = function (p) { return p ? nl.netAt(p[0], p[1]) : null; }, P = A.pr;
    A.pn = { a1: n(P.c1), r1: P.r1 ? n(P.r1) : 0, a2: n(P.c2), r2: P.r2 ? n(P.r2) : 0, da: n(P.da), db: P.db ? n(P.db) : 0 };
  }
  function resetHist() { A.hist = { t: [], a: [], b: [], c: [] }; }
  function recompile(keep) {
    const old = A.sim;
    A.nl = compile({ parts: A.parts, wires: A.wires });
    A.sim = new Sim(A.nl);
    A.h = autoStep(A.nl, winLen());
    let reuse = keep && old && old.elems.length === A.sim.elems.length && old.elems.every(function (e, i) { return e.t === A.sim.elems[i].t; }) && A.mode === 'tran';
    if (A.mode === 'tran') {
      if (reuse) { A.sim.x.set(old.x); A.sim.t = old.t; A.sim.forceBE = 2; A.sim.elems.forEach(function (e, i) { e.st = old.elems[i].st; }); A.sim._commit(A.sim.ctx); }
      else { A.sim.tranInit({ uic: A.uic }); resetHist(); }
    } else A.sim.dc();
    if (!A.dot || A.dot.length !== A.nl.segs.length) A.dot = new Float64Array(A.nl.segs.length);
    resolveProbes();
    A.err = A.sim.err; A.dirty = true; A.bd = null; A.lastExp = 0;
    if (A.mode === 'ac' || A.tab === 'bode') scheduleBode();
    refreshProps();
  }
  let bodeTimer = 0;
  function scheduleBode() { clearTimeout(bodeTimer); bodeTimer = setTimeout(runBode, 120); }

  /* ---------------- presets ---------------- */
  function loadPresetData(p) {
    A.parts = p.parts.map(function (q) { return { id: A.nextId++, type: q.type, x: q.x, y: q.y, rot: q.rot || 0, p: q.p ? Object.assign({}, q.p) : {}, name: q.name }; });
    A.wires = p.wires.map(function (w) { return { x1: w[0], y1: w[1], x2: w[2], y2: w[3] }; });
    A.preset = p; A.sel = null; A.sliders = p.sliders || [];
    A.mode = p.analysis || 'dc'; A.uic = !!(p.tran && p.tran.uic);
    A.sc = Object.assign({ tdiv: 1e-3, v1: 1, v2: 1, trig: 0 }, p.scope || {});
    const P = { c1: null, r1: null, c2: null, r2: null, da: null, db: null };
    (p.probes || []).forEach(function (pb) { if (pb.ch === 1) { P.c1 = pb.at; P.r1 = pb.ref || null; } else { P.c2 = pb.at; P.r2 = pb.ref || null; } });
    if (p.dmm) { P.da = p.dmm.a; P.db = p.dmm.b; }
    A.pr = P;
    A.bode = p.bode ? Object.assign({}, p.bode) : { in: P.c1, out: P.c2, fmin: 10, fmax: 1e5 };
    A.thev = p.thev ? { a: p.thev.a, b: p.thev.b } : { a: null, b: null };
    A.expNode = p.explainNode || null; A.running = true; A.speed = 1; E.speed.value = 0;
    E.preset.value = p.id; fitView(); buildTry(); syncUI(); recompile(false);
    setTab(A.mode === 'ac' ? 'bode' : A.mode === 'tran' ? 'scope' : 'values'); buildScopeCtl(); buildBodeCtl(); buildMeter();
    A.expOn = true; E.exp.style.display = ''; E.explain.classList.add('on'); A.lastExp = 0;
  }
  function loadPreset(id) {
    return loadPresets().then(function (list) {
      A.presets = list; fillPresetSelect();
      const p = list.find(function (x) { return x.id === id; });
      if (p) loadPresetData(p); else { clearAll(); }
    });
  }
  function fillPresetSelect() {
    E.preset.innerHTML = '<option value="">Empty breadboard</option>' + A.presets.map(function (p) { return '<option value="' + p.id + '">' + p.title + '</option>'; }).join('');
    E.preset.value = A.preset ? A.preset.id : '';
  }
  function clearAll() {
    A.parts = []; A.wires = []; A.preset = null; A.sel = null; A.sliders = []; A.pr = { c1: null, r1: null, c2: null, r2: null, da: null, db: null }; A.thev = { a: null, b: null }; A.bode.in = A.bode.out = null; A.expNode = null;
    A.mode = 'tran'; A.sc = { tdiv: 1e-3, v1: 1, v2: 1, trig: 0 }; A.uic = false; E.preset.value = ''; buildTry(); syncUI(); recompile(false); buildScopeCtl(); buildBodeCtl(); buildMeter(); fitView();
  }

  /* ---------------- view ---------------- */
  function fitView() {
    const W = E.cv.clientWidth || 800, H = E.cv.clientHeight || 500;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = function (x, y) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    A.parts.forEach(function (p) { pinPts(p).forEach(function (q) { add(q[0], q[1]); }); add(p.x, p.y + (p.type === 'GND' ? 1 : 0)); });
    A.wires.forEach(function (w) { add(w.x1, w.y1); add(w.x2, w.y2); });
    if (x0 > x1) { x0 = 0; y0 = 0; x1 = 16; y1 = 10; }
    const padX = 3, padY = 3, bw = x1 - x0 + 2 * padX, bh = y1 - y0 + 2 * padY;
    const cl = A.expOn && W > 700 ? 0 : 0;
    view.s = Math.max(12, Math.min(46, Math.min((W - cl) / bw, H / bh)));
    view.ox = W / 2 - (x0 + x1) / 2 * view.s + cl / 2; view.oy = H / 2 - (y0 + y1) / 2 * view.s;
    A.dirty = true;
  }
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    [[E.cv, 1], [E.scv, 1], [E.bcv, 1]].forEach(function (pair) {
      const c = pair[0], w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    });
    A.dirty = true;
  }

  /* ---------------- helpers on circuit ---------------- */
  const netV = function (n) { return n == null ? 0 : A.sim.v(n); };
  function partEl(p) { return p.el >= 0 && A.sim ? A.sim.elems[p.el] : null; }
  function partVI(p) { // [V across pin0-pin1, I through pin0->pin1]
    const e = partEl(p);
    if (e) return [e.vd, e.i[0]];
    if (p.type === 'VM' && p.nets) return [netV(p.nets[0]) - netV(p.nets[1]), 0];
    return [0, 0];
  }
  function nearestPoint(gx, gy, maxd) {
    let best = null, bd = maxd * maxd;
    A.nl.pts.forEach(function (p) { const d = (p.x - gx) * (p.x - gx) + (p.y - gy) * (p.y - gy); if (d < bd) { bd = d; best = [p.x, p.y]; } });
    if (best) return best;
    for (const s of A.nl.segs) {
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy || 1; let t = ((gx - s.x1) * dx + (gy - s.y1) * dy) / L2; t = Math.max(0, Math.min(1, t));
      const px = s.x1 + t * dx, py = s.y1 + t * dy, d = (px - gx) * (px - gx) + (py - gy) * (py - gy);
      if (d < bd) { bd = d; best = [Math.round(px), Math.round(py)]; }
    }
    return best;
  }
  function hitPart(gx, gy) {
    for (let i = A.parts.length - 1; i >= 0; i--) {
      const p = A.parts[i], pp = pinPts(p); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      pp.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
      if (p.type === 'GND') { x0 -= .6; x1 += .6; y1 += 1.1; } else if (pp.length === 2) { if (y0 === y1) { x0 += 1; x1 -= 1; y0 -= .8; y1 += .8; } else { y0 += 1; y1 -= 1; x0 -= .8; x1 += .8; } } else { x0 -= .3; y0 -= .3; x1 += .3; y1 += .3; }
      if (gx >= x0 && gx <= x1 && gy >= y0 && gy <= y1) return p;
    }
    return null;
  }
  function hitWire(gx, gy) {
    let best = null, bd = 0.35;
    A.wires.forEach(function (w) {
      const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy || 1; let t = ((gx - w.x1) * dx + (gy - w.y1) * dy) / L2; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(w.x1 + t * dx - gx, w.y1 + t * dy - gy); if (d < bd) { bd = d; best = w; }
    });
    return best;
  }
  function movePart(p, nx, ny, nr) {
    const old = pinPts(p); p.x = nx; p.y = ny; p.rot = nr; const nw = pinPts(p);
    old.forEach(function (o, i) {
      if (o[0] === nw[i][0] && o[1] === nw[i][1]) return;
      A.wires.forEach(function (w) { if (w.x1 === o[0] && w.y1 === o[1]) { w.x1 = nw[i][0]; w.y1 = nw[i][1]; } if (w.x2 === o[0] && w.y2 === o[1]) { w.x2 = nw[i][0]; w.y2 = nw[i][1]; } });
    });
  }
  function newPart(type, x, y, r) {
    const pre = TY[type].pre; let n = 1; A.parts.forEach(function (p) { if (TY[p.type].pre === pre) { const m = /(\d+)$/.exec(p.name || ''); if (m) n = Math.max(n, +m[1] + 1); } });
    return { id: A.nextId++, type: type, x: x, y: y, rot: r || 0, p: {}, name: type === 'GND' ? 'GND' : pre + n };
  }
  function delSel() {
    if (!A.sel) return;
    if (A.sel.kind === 'part') A.parts = A.parts.filter(function (p) { return p !== A.sel.p; }); else A.wires = A.wires.filter(function (w) { return w !== A.sel.w; });
    A.sel = null; recompile(false);
  }
  function rotSel() {
    if (A.tool === 'place') { A.placeRot = (A.placeRot + 1) & 3; return; }
    if (A.sel && A.sel.kind === 'part') { movePart(A.sel.p, A.sel.p.x, A.sel.p.y, (A.sel.p.rot + 1) & 3); recompile(false); }
  }

  /* ---------------- rendering ---------------- */
  function netColor(n) { const sp = A.vmax - A.vmin; return vcolor(sp < 1e-3 ? 0.5 : (netV(n) - A.vmin) / sp); }
  function drawPart(p, hot) {
    const c = cx, s = view.s, pp = pinPts(p), t = TY[p.type];
    c.save(); c.translate(p.x * s + view.ox, p.y * s + view.oy); c.rotate((p.rot || 0) * Math.PI / 2); c.scale(s, s);
    c.lineWidth = 2.2 / s; c.lineCap = 'round'; c.lineJoin = 'round';
    const col = hot === 2 ? '#6ee7ff' : hot === 1 ? '#bfefff' : '#d0d9ee';
    const ld = LEAD[p.type];
    if (ld && A.sim && p.nets) {
      c.strokeStyle = netColor(p.nets[0]); ln(c, [0, 0, ld[0], 0]);
      c.strokeStyle = netColor(p.nets[1]); ln(c, [ld[1], 0, 4, 0]);
    } else if (ld) { c.strokeStyle = '#7d89a6'; ln(c, [0, 0, ld[0], 0]); ln(c, [ld[1], 0, 4, 0]); }
    c.strokeStyle = col; c.fillStyle = col;
    // glows
    const vi = partVI(p), e = partEl(p);
    if (p.type === 'LED' && e) {
      const i = Math.max(0, e.i[0]), a = Math.min(1, Math.sqrt(i / 0.012)), lc = (LEDC[G(p, 'color')] || LEDC.red)[1];
      if (a > 0.02) { const gr = c.createRadialGradient(2, 0, 0, 2, 0, 2.6); gr.addColorStop(0, lc); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalAlpha = a * .95; c.fillStyle = gr; circ(c, 2, 0, 2.6, true); c.restore(); c.fillStyle = col; }
      if (a > .02) { c.save(); c.globalAlpha = a; c.fillStyle = lc; c.beginPath(); c.moveTo(1.4, -.6); c.lineTo(1.4, .6); c.lineTo(2.6, 0); c.closePath(); c.fill(); c.restore(); }
    }
    if (p.type === 'LAMP' && e) {
      const a = Math.min(1.3, Math.max(0, vi[0] * vi[1]) / (G(p, 'Pr') || 0.25));
      const gr = c.createRadialGradient(2, 0, 0, 2, 0, 2.8); gr.addColorStop(0, 'rgba(255,230,140,1)'); gr.addColorStop(.4, 'rgba(255,190,70,.55)'); gr.addColorStop(1, 'rgba(255,150,40,0)');
      c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = gr; circ(c, 2, 0, 2.8 + .5 * Math.min(a, 1.3), true); c.restore();
      c.save(); c.globalAlpha = Math.min(1, a) * .9; c.fillStyle = '#ffe9a8'; circ(c, 2, 0, .72, true); c.restore();
    }
    if (p.type === 'NPN' || p.type === 'NMOS' || p.type === 'PMOS' || p.type === 'OA' || p.type === 'XF' || p.type === 'GND') {
      if (p.nets && A.sim && p.type !== 'GND') {
        c.save(); c.globalAlpha = 1; pp.forEach(function (q, i) { c.save(); c.strokeStyle = netColor(p.nets[i]); c.restore(); }); c.restore();
      }
    }
    c.save(); t.sym = SYM[p.type]; SYM[p.type](c, { on: G(p, 'on') }); c.restore();
    // small colored pin dots
    c.restore();
    if (p.nets && A.sim) { pp.forEach(function (q, i) { const pt = toP(q[0], q[1]); cx.fillStyle = netColor(p.nets[i]); cx.beginPath(); cx.arc(pt[0], pt[1], 2.6, 0, 7); cx.fill(); }); }
    // text labels (upright)
    const c0 = toP(p.x, p.y);
    let mx = 0, my = 0; pp.forEach(function (q) { mx += q[0]; my += q[1]; }); mx /= pp.length; my /= pp.length;
    const vert = pp.length === 2 && pp[0][0] === pp[1][0];
    cx.font = '500 11px Inter,sans-serif'; cx.textBaseline = 'alphabetic';
    if (p.type !== 'GND') {
      const mp = toP(mx, my); let tx = mp[0], ty = mp[1];
      const big = pp.length > 2;
      if (vert) { tx += s * 1.0; cx.textAlign = 'left'; ty -= 2; } else if (big) { tx = toP(Math.max.apply(null, pp.map(function (q) { return q[0]; })), my)[0] + 6; cx.textAlign = 'left'; ty = mp[1] - s * .5; } else { ty -= s * (p.type === 'LED' ? 1.5 : 1.0); cx.textAlign = 'center'; }
      cx.fillStyle = '#e8ecf5'; cx.fillText(p.name || '', tx, ty);
      cx.fillStyle = '#98a2b8'; cx.fillText(plabel(p), tx, ty + 13);
    }
    if (p.type === 'VM' || p.type === 'AM') {
      const mp = toP(mx, my); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#9dff9d'; cx.font = '600 ' + Math.max(9, s * .42) + 'px Space Grotesk,sans-serif';
      const vv = p.type === 'VM' ? vi[0] : vi[1]; cx.fillText(fmt(vv, p.type === 'VM' ? 'V' : 'A'), mp[0], mp[1]); cx.textBaseline = 'alphabetic';
    }
    if (p.type === 'V' || p.type === 'VAC' || p.type === 'VP' || p.type === 'I' || p.type === 'OA') {
      cx.font = '600 11px Inter'; cx.textAlign = 'center'; cx.fillStyle = '#ffd166';
      if (p.type === 'OA') { const a = toP(pp[0][0] + .6, pp[0][1] - .25), b = toP(pp[1][0] + .6, pp[1][1] - .25); cx.fillText('−', a[0], a[1]); cx.fillText('+', b[0], b[1]); }
      else { const dx = pp[1][0] - pp[0][0], dy = pp[1][1] - pp[0][1], d = Math.hypot(dx, dy) || 1, a = toP(pp[0][0] + dx / d * .55 - dy / d * .45, pp[0][1] + dy / d * .55 + dx / d * .45); if (p.type !== 'I') cx.fillText('+', a[0], a[1] + 3); }
    }
    // current dots along two-terminal bodies
    if (e && pp.length === 2 && A.sim && p.type !== 'VM' && p.type !== 'C') drawBodyDots(p, pp, e.i[0]);
  }
  function drawBodyDots(p, pp, i) {
    const a = toP(pp[0][0], pp[0][1]), b = toP(pp[1][0], pp[1][1]);
    dotsAlong(a[0], a[1], b[0], b[1], i, p.id * 7);
  }
  function dotSpeed(i) { const r = Math.abs(i) / A.fref; if (Math.abs(i) < 1e-13) return 0; return Math.sign(i) * Math.max(4, Math.min(130, r * 90)); }
  let frameDt = 0.016;
  const dotPh = {};
  function dotsAlong(x1, y1, x2, y2, i, key) {
    const sp = dotSpeed(i); if (!sp) return;
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 4) return;
    const gap = 15; dotPh[key] = ((dotPh[key] || 0) + sp * frameDt) % gap;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len; let o = dotPh[key]; if (o < 0) o += gap;
    cx.fillStyle = 'rgba(255,244,200,.95)';
    for (let d = o; d < len; d += gap) { cx.beginPath(); cx.arc(x1 + ux * d, y1 + uy * d, 2.1, 0, 7); cx.fill(); }
  }
  function render(now) {
    const dpr = window.devicePixelRatio || 1, W = E.cv.clientWidth, H = E.cv.clientHeight, c = cx, s = view.s;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const bg = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * .7); bg.addColorStop(0, '#0b1124'); bg.addColorStop(1, '#05070f'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // grid
    const gx0 = Math.floor(-view.ox / s) - 1, gx1 = Math.ceil((W - view.ox) / s) + 1, gy0 = Math.floor(-view.oy / s) - 1, gy1 = Math.ceil((H - view.oy) / s) + 1;
    if (s > 9) { c.fillStyle = 'rgba(160,180,220,.16)'; for (let x = gx0; x <= gx1; x++) for (let y = gy0; y <= gy1; y++) c.fillRect(x * s + view.ox - .75, y * s + view.oy - .75, 1.5, 1.5); }
    if (!A.nl) return;
    // node voltage range
    let lo = 0, hi = 0; if (A.sim) for (let k = 1; k <= A.nl.n; k++) { const v = A.sim.v(k); if (v < lo) lo = v; if (v > hi) hi = v; }
    if (hi - lo < 0.2) { hi = Math.max(hi, lo + 0.2); }
    A.vmin += (lo - A.vmin) * .25; A.vmax += (hi - A.vmax) * .25;
    // current reference
    let mxf = 1e-12; if (A.flows) for (let i = 0; i < A.flows.length; i++) mxf = Math.max(mxf, Math.abs(A.flows[i])); A.sim && A.sim.elems.forEach(function (e) { mxf = Math.max(mxf, Math.abs(e.i[0] || 0)); });
    A.fref = mxf;
    // wires
    c.lineCap = 'round';
    A.nl.segs.forEach(function (sg, i) {
      const a = toP(sg.x1, sg.y1), b = toP(sg.x2, sg.y2), sel = A.sel && A.sel.kind === 'wire' && A.sel.w === sg.w;
      if (sel) { c.strokeStyle = 'rgba(110,231,255,.35)'; c.lineWidth = 8; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      c.strokeStyle = netColor(sg.net); c.lineWidth = 2.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      if (A.flows) dotsAlong(a[0], a[1], b[0], b[1], A.flows[i], 'w' + i);
    });
    // junctions
    const deg = {}; A.nl.segs.forEach(function (sg) { deg[sg.ka] = (deg[sg.ka] || 0) + 1; deg[sg.kb] = (deg[sg.kb] || 0) + 1; });
    A.parts.forEach(function (p) { pinPts(p).forEach(function (q) { const k = KEY(q[0], q[1]); deg[k] = (deg[k] || 0) + 1; }); });
    A.nl.pts.forEach(function (pt) { if ((deg[pt.k] || 0) >= 3) { const q = toP(pt.x, pt.y); c.fillStyle = netColor(pt.net); c.beginPath(); c.arc(q[0], q[1], 4, 0, 7); c.fill(); } });
    // parts
    const hov = A.hover && A.hover.kind === 'part' ? A.hover.p : null;
    A.parts.forEach(function (p) { drawPart(p, A.sel && A.sel.kind === 'part' && A.sel.p === p ? 2 : hov === p ? 1 : 0); });
    // selection box
    if (A.sel && A.sel.kind === 'part') {
      const pp = pinPts(A.sel.p); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pp.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
      const a = toP(x0 - .35, y0 - .9), b = toP(x1 + .35, y1 + .9); c.strokeStyle = 'rgba(110,231,255,.5)'; c.setLineDash([4, 4]); c.lineWidth = 1; c.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); c.setLineDash([]);
    }
    // markers
    const mark = function (pt, label, col) { if (!pt) return; const q = toP(pt[0], pt[1]); c.fillStyle = col; c.strokeStyle = '#000'; c.lineWidth = 1; c.beginPath(); c.arc(q[0], q[1], 8, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#06101a'; c.font = '700 10px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, q[0], q[1] + .5); c.textBaseline = 'alphabetic'; };
    const P = A.pr; mark(P.c1, '1', '#ffd166'); mark(P.r1, '−', '#ffd166'); mark(P.c2, '2', '#6ee7ff'); mark(P.r2, '−', '#6ee7ff'); mark(P.da, '+', '#ff8c8c'); mark(P.db, '−', '#b9c2d6');
    if (A.bode.in && A.tab === 'bode') mark(A.bode.in, 'in', '#b388ff'); if (A.bode.out && A.tab === 'bode') mark(A.bode.out, 'out', '#b388ff');
    mark(A.thev.a, 'A', '#7dffb2'); mark(A.thev.b, 'B', '#7dffb2');
    // placing ghost / wire preview
    if (A.mouse.in) {
      if (A.tool === 'place' && A.place) {
        const gh = { type: A.place, x: A.mouse.gx, y: A.mouse.gy, rot: A.placeRot, p: {}, nets: null, name: '' }; c.save(); c.globalAlpha = .6; drawPart(gh, 2); c.restore();
      }
      if (A.tool === 'wire') {
        const m = toP(A.mouse.gx, A.mouse.gy); c.fillStyle = '#6ee7ff'; c.beginPath(); c.arc(m[0], m[1], 4, 0, 7); c.fill();
        if (A.wstart) { const pts = route(A.wstart, [A.mouse.gx, A.mouse.gy]); c.strokeStyle = '#6ee7ff'; c.lineWidth = 2.4; c.setLineDash([6, 4]); c.beginPath(); pts.forEach(function (q, i) { const z = toP(q[0], q[1]); i ? c.lineTo(z[0], z[1]) : c.moveTo(z[0], z[1]); }); c.stroke(); c.setLineDash([]); }
      }
    }
    // legend
    E.lmin.textContent = fmt(A.vmin, 'V'); E.lmax.textContent = fmt(A.vmax, 'V');
  }
  function route(a, b) {
    if (a[0] === b[0] || a[1] === b[1]) return [a, b];
    return Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? [a, [b[0], a[1]], b] : [a, [a[0], b[1]], b];
  }

  /* ---------------- interaction ---------------- */
  const ptrs = new Map(); let drag = null, pinch = null, downInfo = null;
  function setTool(t, place) {
    A.tool = t; A.place = place || null; A.wstart = null;
    E.pal.querySelectorAll('.cl-pb').forEach(function (b) { b.classList.toggle('on', b.dataset.t === (t === 'place' ? place : t)); });
    E.cv.style.cursor = t === 'select' ? 'default' : 'crosshair'; A.dirty = true;
  }
  function endPick(pt) {
    const k = A.pick; A.pick = null; E.cv.style.cursor = 'default'; showBanner(null);
    if (pt) {
      if (k === 'c1' || k === 'c2' || k === 'r1' || k === 'r2') { A.pr[k] = pt; resolveProbes(); resetHist(); }
      else if (k === 'da' || k === 'db') { A.pr[k] = pt; resolveProbes(); resetHist(); }
      else if (k === 'bi') A.bode.in = pt; else if (k === 'bo') A.bode.out = pt;
      else if (k === 'ta') A.thev.a = pt; else if (k === 'tb') A.thev.b = pt;
      if (k === 'bi' || k === 'bo') scheduleBode(); A.lastExp = 0; buildScopeCtl(); buildBodeCtl(); buildMeter();
    }
  }
  const PICKNAME = { c1: 'CH1 probe', r1: 'CH1 reference', c2: 'CH2 probe', r2: 'CH2 reference', da: 'multimeter red lead', db: 'multimeter black lead', bi: 'Bode input node', bo: 'Bode output node', ta: 'Thevenin terminal A', tb: 'Thevenin terminal B' };
  function startPick(k) { A.pick = k; setTool('select'); E.cv.style.cursor = 'crosshair'; showBanner('Click a wire or terminal to attach the ' + PICKNAME[k] + '  (Esc to cancel)', 'info'); }
  function showBanner(msg, cls) { if (!msg) { E.banner.style.display = 'none'; E.banner.textContent = ''; return; } E.banner.className = 'cl-banner ' + (cls || 'err'); E.banner.textContent = msg; E.banner.style.display = 'block'; }

  E.cv.addEventListener('pointerdown', function (e) {
    R.focus({ preventScroll: true }); E.cv.setPointerCapture(e.pointerId);
    const [px, py] = pos(e); ptrs.set(e.pointerId, { x: px, y: py });
    if (ptrs.size === 2) { const v = Array.from(ptrs.values()); pinch = { d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), s: view.s, cx: (v[0].x + v[1].x) / 2, cy: (v[0].y + v[1].y) / 2, ox: view.ox, oy: view.oy }; drag = null; downInfo = null; return; }
    if (e.button === 2) return;
    const g = toG(px, py);
    downInfo = { px, py, moved: false, g: g };
    if (A.tool === 'select' && !A.pick) {
      const p = hitPart(g[0], g[1]);
      if (p) { drag = { kind: 'part', p: p, sx: Math.round(g[0]), sy: Math.round(g[1]), ox: p.x, oy: p.y, started: false }; }
      else drag = { kind: 'pan', ox: view.ox, oy: view.oy, px: px, py: py };
    } else drag = { kind: 'pan', ox: view.ox, oy: view.oy, px: px, py: py };
  });
  E.cv.addEventListener('pointermove', function (e) {
    const [px, py] = pos(e), g = toG(px, py); A.mouse = { gx: Math.round(g[0]), gy: Math.round(g[1]), px: px, py: py, in: true }; A.dirty = true;
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: px, y: py });
    if (pinch && ptrs.size >= 2) {
      const v = Array.from(ptrs.values()), d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), cxn = (v[0].x + v[1].x) / 2, cyn = (v[0].y + v[1].y) / 2;
      const ns = Math.max(6, Math.min(90, pinch.s * d / pinch.d)), gx = (pinch.cx - pinch.ox) / pinch.s, gy = (pinch.cy - pinch.oy) / pinch.s;
      view.s = ns; view.ox = cxn - gx * ns; view.oy = cyn - gy * ns; return;
    }
    if (downInfo && Math.hypot(px - downInfo.px, py - downInfo.py) > 5) downInfo.moved = true;
    if (drag && downInfo && downInfo.moved) {
      if (drag.kind === 'pan') { view.ox = drag.ox + px - drag.px; view.oy = drag.oy + py - drag.py; }
      else if (drag.kind === 'part') {
        const nx = drag.ox + Math.round(g[0]) - drag.sx, ny = drag.oy + Math.round(g[1]) - drag.sy;
        if (nx !== drag.p.x || ny !== drag.p.y) { movePart(drag.p, nx, ny, drag.p.rot); A.sel = { kind: 'part', p: drag.p }; drag.started = true; A.nl = compile({ parts: A.parts, wires: A.wires }); }
      }
    }
    hoverUpdate(px, py, g);
  });
  function endPointer(e) {
    const [px, py] = pos(e); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (!downInfo) { drag = null; return; }
    const info = downInfo, d = drag; downInfo = null; drag = null;
    if (e.type === 'pointercancel') return;
    if (d && d.kind === 'part' && d.started) { recompile(false); return; }
    if (info.moved) return;
    clickAt(info.g, e);
  }
  E.cv.addEventListener('pointerup', endPointer); E.cv.addEventListener('pointercancel', endPointer);
  E.cv.addEventListener('pointerleave', function () { A.mouse.in = false; E.tip.style.display = 'none'; A.hover = null; A.dirty = true; });
  E.cv.addEventListener('contextmenu', function (e) { e.preventDefault(); if (A.pick) endPick(null); else if (A.wstart) A.wstart = null; else setTool('select'); });
  E.cv.addEventListener('wheel', function (e) {
    e.preventDefault(); const [px, py] = pos(e), g = toG(px, py), f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
    view.s = Math.max(6, Math.min(90, view.s * f)); view.ox = px - g[0] * view.s; view.oy = py - g[1] * view.s; A.dirty = true;
  }, { passive: false });
  E.cv.addEventListener('dblclick', function () { if (A.tool === 'wire') A.wstart = null; });

  function clickAt(g, e) {
    const gx = Math.round(g[0]), gy = Math.round(g[1]);
    if (A.pick) { const pt = nearestPoint(g[0], g[1], 1.2); if (pt) endPick(pt); else showBanner('No wire or terminal there. Click on a wire or a component pin.', 'err'); return; }
    if (A.tool === 'place') {
      const p = newPart(A.place, gx, gy, A.placeRot); A.parts.push(p); A.sel = { kind: 'part', p: p }; recompile(false); return;
    }
    if (A.tool === 'wire') {
      if (!A.wstart) { A.wstart = [gx, gy]; return; }
      if (gx === A.wstart[0] && gy === A.wstart[1]) { A.wstart = null; return; }
      const pts = route(A.wstart, [gx, gy]);
      for (let i = 0; i + 1 < pts.length; i++) A.wires.push({ x1: pts[i][0], y1: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1] });
      const key = KEY(gx, gy); let ends = false;
      A.parts.forEach(function (p) { pinPts(p).forEach(function (q) { if (KEY(q[0], q[1]) === key) ends = true; }); });
      A.wires.slice(0, -1).forEach(function (w) { if ((w.x1 === gx && w.y1 === gy) || (w.x2 === gx && w.y2 === gy)) ends = true; });
      A.wstart = ends ? null : [gx, gy]; recompile(false); return;
    }
    const p = hitPart(g[0], g[1]);
    if (p) {
      if (p.type === 'SW') { p.p.on = G(p, 'on') ? 0 : 1; A.sel = { kind: 'part', p: p }; recompile(true); return; }
      A.sel = { kind: 'part', p: p }; refreshProps(); return;
    }
    const w = hitWire(g[0], g[1]); A.sel = w ? { kind: 'wire', w: w } : null; refreshProps();
  }
  function hoverUpdate(px, py, g) {
    if (!A.sim || drag && drag.kind === 'part') { E.tip.style.display = 'none'; return; }
    let h = null; const p = hitPart(g[0], g[1]);
    if (p) h = { kind: 'part', p: p };
    else { const w = hitWire(g[0], g[1]); if (w) h = { kind: 'wire', w: w }; else { const pt = nearestPoint(g[0], g[1], .35); if (pt) h = { kind: 'pt', pt: pt }; } }
    A.hover = h;
    if (!h || A.tool === 'place') { E.tip.style.display = 'none'; return; }
    let html = '';
    if (h.kind === 'part') {
      const q = h.p, vi = partVI(q), e = partEl(q);
      html = '<b>' + q.name + '</b> ' + TY[q.type].name + (plabel(q) ? ' · ' + plabel(q) : '');
      if (q.type !== 'GND') { html += '<br>V = ' + fmt(vi[0], 'V'); if (q.type !== 'VM') html += ' &nbsp; I = ' + fmt(vi[1], 'A') + '<br>P = ' + fmt(vi[0] * vi[1], 'W'); }
      if (e && (e.t === 'Q' || e.t === 'M')) html += '<br>Ic/Id = ' + fmt(e.i[0], 'A');
    } else {
      const pt = h.kind === 'pt' ? h.pt : null;
      let net = null, cur = null;
      if (h.kind === 'wire') { const sg = A.nl.segs.find(function (s) { return s.w === h.w; }); if (sg) { net = sg.net; const i = A.nl.segs.indexOf(sg); const best = A.nl.segs.filter(function (s) { return s.w === h.w; }); let fl = 0, bd = 1e9; best.forEach(function (s) { const j = A.nl.segs.indexOf(s), mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2, d = Math.hypot(mx - g[0], my - g[1]); if (d < bd) { bd = d; fl = A.flows ? A.flows[j] : 0; } }); cur = fl; } }
      else if (pt) net = A.nl.netAt(pt[0], pt[1]);
      if (net != null) html = '<b>' + A.nl.nodeName(net) + '</b> · V = ' + fmt(netV(net), 'V') + (cur != null ? '<br>I = ' + fmt(Math.abs(cur), 'A') + (Math.abs(cur) > 1e-12 ? ' (arrow = conventional current)' : '') : '');
    }
    if (!html) { E.tip.style.display = 'none'; return; }
    E.tip.innerHTML = html; E.tip.style.display = 'block';
    const W = E.stage.clientWidth; let tx = px + 14, ty = py + 14; const tw = E.tip.offsetWidth; if (tx + tw > W - 4) tx = px - tw - 10; E.tip.style.left = tx + 'px'; E.tip.style.top = ty + 'px';
  }
  R.addEventListener('keydown', function (e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.key !== 'Escape') return;
    const k = e.key;
    if (k === 'r' || k === 'R') { rotSel(); e.preventDefault(); }
    else if (k === 'Delete' || k === 'Backspace') { delSel(); e.preventDefault(); }
    else if (k === 'Escape') { if (A.pick) endPick(null); else if (A.wstart) A.wstart = null; else { setTool('select'); A.sel = null; refreshProps(); } }
    else if (k === 'w' || k === 'W') setTool('wire'); else if (k === 'v' || k === 'V') setTool('select');
    else if (k === 'f' || k === 'F') fitView(); else if (k === ' ') { A.running = !A.running; syncUI(); e.preventDefault(); }
    e.stopPropagation();
  });

  /* ---------------- palette & toolbar ---------------- */
  function icon(type) {
    const c = document.createElement('canvas'); c.width = 92; c.height = 60; const g = c.getContext('2d'), bb = BB[type] || BB.default, sc = Math.min(84 / (bb[2] - bb[0]), 52 / (bb[3] - bb[1]));
    g.translate(46 - (bb[0] + bb[2]) / 2 * sc, 30 - (bb[1] + bb[3]) / 2 * sc); g.scale(sc, sc); g.lineWidth = 2.2 / sc; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#cfd8ee'; g.fillStyle = '#cfd8ee';
    const ld = LEAD[type]; if (ld) { ln(g, [0, 0, ld[0], 0]); ln(g, [ld[1], 0, 4, 0]); } SYM[type](g, { on: 0 }); return c;
  }
  function buildPalette() {
    const mk = function (t, label, tip, drawer) { const b = document.createElement('button'); b.className = 'cl-pb'; b.dataset.t = t; b.title = tip; b.appendChild(drawer); const s = document.createElement('span'); s.textContent = label; b.appendChild(s); E.pal.appendChild(b); return b; };
    const ci = document.createElement('canvas'); ci.width = 92; ci.height = 60; let g = ci.getContext('2d'); g.strokeStyle = '#cfd8ee'; g.fillStyle = '#cfd8ee'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 42); g.lineTo(40, 35); g.lineTo(47, 49); g.lineTo(53, 46); g.lineTo(46, 33); g.lineTo(56, 32); g.closePath(); g.stroke();
    mk('select', 'Select', 'Select / move / pan (V)', ci);
    const wi = document.createElement('canvas'); wi.width = 92; wi.height = 60; g = wi.getContext('2d'); g.strokeStyle = '#6ee7ff'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(14, 44); g.lineTo(14, 20); g.lineTo(78, 20); g.stroke(); g.fillStyle = '#6ee7ff'; [[14, 44], [78, 20]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 4.5, 0, 7); g.fill(); });
    mk('wire', 'Wire', 'Draw wires (W). Click points; click a pin to finish, Esc to stop', wi);
    PALETTE.forEach(function (t) { mk(t, SHORT[t], TY[t].name + ' (click, then click on the grid to place; R rotates)', icon(t)); });
    E.pal.addEventListener('click', function (e) { const b = e.target.closest('.cl-pb'); if (!b) return; const t = b.dataset.t; A.placeRot = 0; if (t === 'select' || t === 'wire') setTool(t); else setTool('place', t); R.focus(); });
    setTool('select');
  }
  function syncUI() {
    E.mode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === A.mode); });
    E.run.textContent = A.running ? 'Pause' : 'Run'; E.run.classList.toggle('on', !A.running); E.run.style.display = A.mode === 'tran' ? '' : 'none'; E.reset.style.display = A.mode === 'tran' ? '' : 'none';
    E.speed.style.display = A.mode === 'tran' ? '' : 'none'; E.speed.previousElementSibling.style.display = A.mode === 'tran' ? '' : 'none';
  }
  function setMode(m) { if (A.mode === m) return; A.mode = m; syncUI(); recompile(false); setTab(m === 'ac' ? 'bode' : m === 'tran' ? 'scope' : 'values'); }
  E.mode.addEventListener('click', function (e) { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });
  E.run.onclick = function () { A.running = !A.running; syncUI(); };
  E.reset.onclick = function () { recompile(false); };
  E.speed.oninput = function () { A.speed = Math.pow(10, +E.speed.value); };
  E.rot.onclick = rotSel; E.del.onclick = delSel; E.fit.onclick = fitView; E.clear.onclick = function () { if (!A.parts.length || confirm('Remove all parts and wires?')) clearAll(); };
  E.explain.onclick = function () { A.expOn = !A.expOn; E.exp.style.display = A.expOn ? '' : 'none'; E.explain.classList.toggle('on', A.expOn); A.lastExp = 0; };
  E.preset.onchange = function () { if (E.preset.value) { const p = A.presets.find(function (x) { return x.id === E.preset.value; }); if (p) loadPresetData(p); } else clearAll(); };

  /* ---------------- "try it" sliders ---------------- */
  function findPart(name) { return A.parts.find(function (p) { return p.name === name; }); }
  function buildTry() {
    E.try.style.display = A.sliders.length ? 'block' : 'none';
    E.try.innerHTML = A.sliders.map(function (s, i) {
      const p = findPart(s.part); if (!p) return ''; const v = +G(p, s.prop);
      const pos = s.log ? Math.log(v / s.min) / Math.log(s.max / s.min) : (v - s.min) / (s.max - s.min);
      return '<div class="cl-row"><label>' + s.label + '</label><input type="range" min="0" max="1000" step="1" value="' + Math.round(Math.max(0, Math.min(1, pos)) * 1000) + '" data-i="' + i + '"><span class="v" data-v="' + i + '">' + fmtProp(p, s.prop, v) + '</span></div>';
    }).join('');
    E.try.querySelectorAll('input').forEach(function (inp) {
      inp.oninput = function () {
        const s = A.sliders[+inp.dataset.i], p = findPart(s.part), t = +inp.value / 1000; if (!p) return;
        let v = s.log ? s.min * Math.pow(s.max / s.min, t) : s.min + (s.max - s.min) * t;
        if (s.log) { const m = Math.pow(10, Math.floor(Math.log10(v)) - 1); v = Math.round(v / m) * m; }
        p.p = p.p || {}; p.p[s.prop] = v; E.try.querySelector('[data-v="' + inp.dataset.i + '"]').textContent = fmtProp(p, s.prop, v); recompile(true);
      };
    });
  }
  function fmtProp(p, k, v) { const f = (TY[p.type].f || []).find(function (a) { return a[0] === k; }); return fmt(v, f ? f[2] : ''); }

  /* ---------------- properties panel ---------------- */
  function refreshProps() {
    const s = A.sel; if (!s) { E.props.style.display = 'none'; return; }
    E.props.style.display = 'block';
    if (s.kind === 'wire') { E.props.innerHTML = '<h4>Wire</h4><div class="cl-read" data-r></div><div class="cl-row"><button class="cl-btn" data-act="del">Delete wire</button></div>'; E.props.querySelector('[data-act=del]').onclick = delSel; updateProps(); return; }
    const p = s.p, t = TY[p.type]; let html = '<h4>' + t.name + '</h4>';
    html += '<div class="cl-row"><label>Name</label><input type="text" data-k="name" value="' + (p.name || '') + '"></div>';
    (t.f || []).forEach(function (f, i) { html += '<div class="cl-row"><label>' + f[1] + '</label><input type="text" data-f="' + f[0] + '" value="' + fmtRaw(G(p, f[0])) + '" title="Engineering units: 4.7k, 100n, 10m, 2.2Meg ..."><span class="cl-lab">' + f[2] + '</span></div>'; });
    if (p.type === 'SW') html += '<div class="cl-row"><button class="cl-btn" data-act="tog">' + (G(p, 'on') ? 'Open the switch' : 'Close the switch') + '</button></div>';
    if (p.type === 'LED') html += '<div class="cl-row"><label>Colour</label><select data-f="color">' + Object.keys(LEDC).map(function (c) { return '<option' + (G(p, 'color') === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>';
    const f0 = (t.f || [])[0]; if (f0 && f0[0] !== 'ic') html += '<div class="cl-row"><label>Slide</label><input type="range" min="0" max="1000" value="500" data-sl="1"></div>';
    html += '<div class="cl-read" data-r></div><div class="cl-row"><button class="cl-btn" data-act="rot">Rotate</button><button class="cl-btn" data-act="del">Delete</button></div>';
    E.props.innerHTML = html;
    E.props.querySelectorAll('input[type=text],select').forEach(function (inp) {
      inp.onchange = function () {
        if (inp.dataset.k === 'name') { p.name = inp.value; recompile(true); return; }
        const k = inp.dataset.f; if (!k) return; p.p = p.p || {};
        if (k === 'color') p.p.color = inp.value; else { const v = parseEng(inp.value); if (isNaN(v)) { inp.value = fmtRaw(G(p, k)); return; } p.p[k] = v; inp.value = fmtRaw(v); }
        buildTry(); recompile(true);
      };
      inp.onkeydown = function (ev) { ev.stopPropagation(); if (ev.key === 'Enter') inp.blur(); };
    });
    const sl = E.props.querySelector('[data-sl]');
    if (sl) { const k = f0[0], base = +G(p, k) || 1; sl.oninput = function () { const v = base * Math.pow(100, (+sl.value - 500) / 500); p.p = p.p || {}; p.p[k] = +v.toPrecision(3); E.props.querySelector('[data-f="' + k + '"]').value = fmtRaw(p.p[k]); recompile(true); }; }
    E.props.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () { const a = b.dataset.act; if (a === 'del') delSel(); else if (a === 'rot') rotSel(); else if (a === 'tog') { p.p.on = G(p, 'on') ? 0 : 1; refreshProps(); recompile(true); } }; });
    updateProps();
  }
  function fmtRaw(v) { return typeof v === 'number' ? fmt(v, '').trim() : v; }
  function updateProps() {
    const s = A.sel, r = E.props.querySelector('[data-r]'); if (!s || !r || !A.sim) return;
    if (s.kind === 'part') {
      const p = s.p, vi = partVI(p), e = partEl(p); let h = '';
      if (p.type === 'GND') h = 'Reference node, 0 V.';
      else { h = 'Voltage <b>' + fmt(vi[0], 'V') + '</b>'; if (p.type !== 'VM') h += '<br>Current <b>' + fmt(vi[1], 'A') + '</b> (pin 1 → pin 2)<br>Power <b>' + fmt(vi[0] * vi[1], 'W') + '</b>'; }
      if (p.nets) h += '<br>Nodes: ' + p.nets.map(function (n) { return A.nl.nodeName(n) + ' (' + fmt(netV(n), 'V') + ')'; }).join(', ');
      if (e && e.t === 'M') h += '<br>Vgs <b>' + fmt(e.u[0], 'V') + '</b>, Vds <b>' + fmt(e.u[1], 'V') + '</b>'; if (e && e.t === 'Q') h += '<br>Vbe <b>' + fmt(e.u[0], 'V') + '</b>, Vce <b>' + fmt(netV(e.n[0]) - netV(e.n[2]), 'V') + '</b>';
      r.innerHTML = h;
    } else { const sg = A.nl.segs.find(function (z) { return z.w === s.w; }); r.innerHTML = sg ? A.nl.nodeName(sg.net) + ': <b>' + fmt(netV(sg.net), 'V') + '</b>' : ''; }
  }

  /* ---------------- explain ---------------- */
  function netElems(net) {
    const out = [];
    A.sim.elems.forEach(function (e) { e.n.forEach(function (nn, j) { if (nn === net && e.part) out.push({ e: e, j: j, i: e.i[j] || 0 }); }); });
    return out;
  }
  function explainHTML() {
    const nl = A.nl, sim = A.sim, L = []; if (!sim) return '';
    const sel = A.sel && A.sel.kind === 'part' ? A.sel.p : null;
    if (sel && sel.type !== 'GND') {
      const vi = partVI(sel), e = partEl(sel);
      let s = '<b>' + sel.name + '</b>: ' + fmt(Math.abs(vi[0]), 'V') + ' across, ' + fmt(Math.abs(vi[1]), 'A') + ' through';
      if (sel.type === 'R' || sel.type === 'LAMP') s += ', so ' + fmt(Math.abs(vi[0]), 'V') + ' / ' + fmt(G(sel, 'R'), 'Ω') + ' = ' + fmt(Math.abs(vi[1]), 'A') + ' (Ohm) and it dissipates ' + fmt(Math.abs(vi[0] * vi[1]), 'W') + ' as heat.';
      else if (e && e.t === 'D') s += e.led ? ' — ' + (vi[1] > 1e-4 ? 'the LED is lit' : 'the LED is off') + ' (forward drop ' + fmt(vi[0], 'V') + ').' : (e.vz > 0 && vi[0] < -e.vz * .9 ? ' — the Zener is in breakdown and clamping at about ' + fmt(-vi[0], 'V') + '.' : vi[0] > 0.4 ? ' — forward biased, drop ' + fmt(vi[0], 'V') + '.' : ' — blocking (reverse or below ~0.6 V).');
      else if (e && e.t === 'Q') { const vce = netV(e.n[0]) - netV(e.n[2]); s = '<b>' + sel.name + '</b>: ' + (e.u[0] < 0.45 ? 'cut off (Vbe ' + fmt(e.u[0], 'V') + ' is too low, so no collector current).' : vce < 0.35 ? 'saturated: Vce is only ' + fmt(vce, 'V') + ' so it acts like a closed switch (Ic = ' + fmt(e.i[0], 'A') + ').' : 'in the active region: Ic = ' + fmt(e.i[0], 'A') + ' ≈ β × Ib = ' + e.bf + ' × ' + fmt(e.i[1], 'A') + '.'); }
      else if (e && e.t === 'M') s = '<b>' + sel.name + '</b>: ' + (e.u[0] * e.pol < e.vt ? 'off (|Vgs| = ' + fmt(Math.abs(e.u[0]), 'V') + ' is below the threshold ' + fmt(e.vt, 'V') + ').' : Math.abs(e.u[1]) < Math.abs(e.u[0]) - e.vt ? 'on, in the triode (resistive) region, Id = ' + fmt(Math.abs(e.i[0]), 'A') + '.' : 'on, in saturation: Id = ' + fmt(Math.abs(e.i[0]), 'A') + ' is set by Vgs.');
      else if (e && e.t === 'OA') { const am = (e.vhi - e.vlo) / 2, vo = netV(e.n[2]); s = '<b>' + sel.name + '</b>: ' + (Math.abs(vo - (e.vhi + e.vlo) / 2) > am * .97 ? 'output is clipped at the ' + (vo > 0 ? 'positive' : 'negative') + ' rail (' + fmt(vo, 'V') + ').' : 'feedback holds V+ − V− = ' + fmt(e.vd, 'V') + ' ≈ 0 (virtual short); output ' + fmt(vo, 'V') + '.'); }
      else if (e && e.t === 'C') s += '. Stored energy ½ C V² = ' + fmt(.5 * e.v * vi[0] * vi[0], 'J') + '.'; else if (e && e.t === 'L') s += '. Stored energy ½ L I² = ' + fmt(.5 * e.v * vi[1] * vi[1], 'J') + '.';
      L.push(s);
    }
    // KCL
    let kn = null;
    if (A.sel && A.sel.kind === 'wire') { const sg = nl.segs.find(function (z) { return z.w === A.sel.w; }); if (sg) kn = sg.net; }
    if (kn == null && A.expNode) kn = nl.netAt(A.expNode[0], A.expNode[1]);
    if (kn == null && A.hover && A.hover.kind === 'wire') { const sg = nl.segs.find(function (z) { return z.w === A.hover.w; }); if (sg) kn = sg.net; }
    if (kn == null || kn === 0) { let bc = 0; for (let k = 1; k <= nl.n; k++) { const c = netElems(k).length; if (c > bc && c >= 3) { bc = c; kn = k; } } }
    if (kn != null && kn !== 0) {
      const items = netElems(kn).filter(function (it) { return Math.abs(it.i) > 1e-12 && !(it.e.t === 'OA' && it.j < 2); });
      const out = items.filter(function (it) { return it.i > 0; }), inn = items.filter(function (it) { return it.i < 0; });
      const sum = function (a) { return a.reduce(function (s, it) { return s + Math.abs(it.i); }, 0); };
      if (items.length >= 2) L.push('<b>KCL at ' + nl.nodeName(kn) + '</b> (' + fmt(netV(kn), 'V') + '): ' + fmt(sum(inn), 'A') + ' in = ' + fmt(sum(out), 'A') + ' out. In from ' + (inn.map(function (it) { return it.e.name + ' ' + fmt(Math.abs(it.i), 'A'); }).join(', ') || 'nothing') + '; out to ' + (out.map(function (it) { return it.e.name + ' ' + fmt(it.i, 'A'); }).join(', ') || 'nothing') + '.');
    }
    // Thevenin
    if (A.thev.a && A.thev.b) {
      const a = nl.netAt(A.thev.a[0], A.thev.a[1]), b = nl.netAt(A.thev.b[0], A.thev.b[1]);
      if (a != null && b != null && a !== b) {
        const t = thevenin(nl, a, b);
        if (t.err) L.push('Thevenin: ' + t.err.msg); else {
          const rs = Math.abs(t.rth) > 1e9 ? '∞' : fmt(t.rth, 'Ω'), now = netV(a) - netV(b);
          L.push('<b>Thévenin equivalent seen from A–B</b> (parts wired directly across A–B count as the load and are removed): Vth = ' + fmt(t.vth, 'V') + ', Rth = ' + rs + (isFinite(t.ino) ? '; Norton In = ' + fmt(t.ino, 'A') : '') + '. With the present load, V(A–B) = ' + fmt(now, 'V') + (t.rth > 0 && Math.abs(t.vth) > 1e-9 ? ' (a load equal to Rth would get Vth/2 = ' + fmt(t.vth / 2, 'V') + ' and the maximum power ' + fmt(t.vth * t.vth / (4 * t.rth), 'W') + ')' : '') + '.');
        }
      }
    }
    // time constants / resonance
    const tcs = A.tcs || (A.tcs = timeConstants(nl));
    let n = 0;
    tcs.forEach(function (tc) {
      if (n >= 2) return; n++;
      const e = nl.elems[tc.idx];
      L.push(e.t === 'C' ? '<b>Time constant</b> τ = R·C = ' + fmt(tc.rth, 'Ω') + ' × ' + fmt(e.v, 'F') + ' = ' + fmt(tc.tau, 's') + ' for ' + e.name + ' (63% charged after τ, ~99% after 5τ = ' + fmt(5 * tc.tau, 's') + ').' : '<b>Time constant</b> τ = L/R = ' + fmt(e.v, 'H') + ' / ' + fmt(tc.rth, 'Ω') + ' = ' + fmt(tc.tau, 's') + ' for ' + e.name + '.');
    });
    const Ls = nl.elems.filter(function (e) { return e.t === 'L'; }), Cs = nl.elems.filter(function (e) { return e.t === 'C'; });
    if (Ls.length === 1 && Cs.length === 1) {
      const f0 = 1 / (2 * Math.PI * Math.sqrt(Ls[0].v * Cs[0].v)); let s = '<b>Resonance</b> f₀ = 1/(2π√LC) = ' + fmt(f0, 'Hz') + ' (√(L/C) = ' + fmt(Math.sqrt(Ls[0].v / Cs[0].v), 'Ω') + ')';
      const tc = tcs.find(function (z) { return nl.elems[z.idx].t === 'C'; });
      if (tc && tc.rth > 0) { const z = tc.rth / 2 * Math.sqrt(Cs[0].v / Ls[0].v); s += '; series damping ζ = (R/2)√(C/L) = ' + z.toFixed(2) + ' → ' + (z < 0.95 ? 'under-damped (rings at ' + fmt(f0 * Math.sqrt(Math.max(0, 1 - z * z)), 'Hz') + '), Q ≈ ' + (1 / (2 * z)).toFixed(1) : z < 1.05 ? 'critically damped (fastest settling, no ringing)' : 'over-damped (slow, no ringing)'); }
      L.push(s + '.');
    }
    const srcs = nl.elems.filter(function (e) { return e.t === 'V' && e.w.k !== 'dc' && e.part; });
    if (srcs.length) { const e = srcs[0]; L.push(e.w.k === 'sin' ? '<b>' + e.name + '</b>: ' + fmt(e.w.amp, 'V') + ' peak = ' + fmt(e.w.amp / Math.SQRT2, 'V') + ' rms at ' + fmt(e.w.f, 'Hz') + ' (period ' + fmt(1 / e.w.f, 's') + ').' : '<b>' + e.name + '</b>: square wave ' + fmt(e.w.lo, 'V') + ' to ' + fmt(e.w.hi, 'V') + ' at ' + fmt(e.w.f, 'Hz') + '.'); }
    // power balance
    let pin = 0, pdis = 0; sim.elems.forEach(function (e) { if (!e.part) return; const p = e.vd * (e.i[0] || 0); if (e.t === 'V' || e.t === 'I') { if (p < 0) pin -= p; } else if (e.t === 'R' || e.t === 'D') pdis += Math.max(0, p); });
    if (pin > 1e-9) L.push('<b>Power</b>: sources deliver ' + fmt(pin, 'W') + ', resistive parts and diodes dissipate ' + fmt(pdis, 'W') + (A.mode === 'tran' ? ' (instantaneous)' : '') + '.');
    return '<ul>' + L.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
  }
  function updateExplain(now) {
    if (!A.expOn || now - A.lastExp < 250) return; A.lastExp = now;
    let h = '<h4>What’s happening? <span data-x>hide</span></h4>';
    if (A.preset) h += '<div class="t">' + A.preset.title + '</div><div class="try">' + A.preset.text + '</div>';
    else h += '<p>Empty breadboard. Pick a part on the left and click the grid to place it, join terminals with the Wire tool, and add a ground. Or load an example from the menu at the top.</p>';
    h += explainHTML();
    h += '<div class="mini"><button class="cl-btn" data-pk="ta">Set Thévenin A</button><button class="cl-btn" data-pk="tb">Set Thévenin B</button>' + (A.thev.a ? '<button class="cl-btn" data-pk="tx">Clear</button>' : '') + '</div>';
    if (E.exp._h !== h) {
      E.exp._h = h; E.exp.innerHTML = h;
      E.exp.querySelector('[data-x]').onclick = function () { E.explain.click(); };
      E.exp.querySelectorAll('[data-pk]').forEach(function (b) { b.onclick = function () { if (b.dataset.pk === 'tx') { A.thev = { a: null, b: null }; A.lastExp = 0; } else startPick(b.dataset.pk); }; });
    }
  }

  /* ---------------- instruments: tabs ---------------- */
  function setTab(t) {
    if (t === 'hide') { const hid = E.drawer.style.getPropertyValue('--cl-dh') === '34px'; E.drawer.style.setProperty('--cl-dh', hid ? '' : '34px'); setTimeout(resize, 30); return; }
    A.tab = t;
    R.querySelectorAll('.cl-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
    R.querySelectorAll('.cl-pane').forEach(function (p) { p.classList.toggle('on', p.dataset.p === t); });
    if (E.drawer.style.getPropertyValue('--cl-dh') === '34px') E.drawer.style.setProperty('--cl-dh', '');
    resize(); if (t === 'bode') scheduleBode(); A.dirty = true;
  }
  R.querySelector('.cl-tabs').addEventListener('click', function (e) { const b = e.target.closest('.cl-tab'); if (b) setTab(b.dataset.t); });

  /* ---- scope ---- */
  function optList(list, cur, unit) { return list.map(function (v) { return '<option value="' + v + '"' + (Math.abs(Math.log(v / cur)) < 1e-6 ? ' selected' : '') + '>' + fmt(v, unit) + '</option>'; }).join(''); }
  function buildScopeCtl() {
    const S = A.sc, P = A.pr;
    E.sctl.innerHTML = '<div class="cl-row"><label class="ch1">CH1</label><button class="cl-btn" data-pk="c1">' + (P.c1 ? 'move' : 'attach') + '</button><button class="cl-btn" data-pk="r1" title="Optional reference node (differential probe)">ref</button></div>' +
      '<div class="cl-row"><label class="ch2">CH2</label><button class="cl-btn" data-pk="c2">' + (P.c2 ? 'move' : 'attach') + '</button><button class="cl-btn" data-pk="r2">ref</button></div>' +
      '<div class="cl-row"><label>time/div</label><select data-s="tdiv">' + optList(TDIVS, snap125(S.tdiv, TDIVS), 's') + '</select></div>' +
      '<div class="cl-row"><label class="ch1">CH1 V/div</label><select data-s="v1">' + optList(VDIVS, snap125(S.v1, VDIVS), 'V') + '</select></div>' +
      '<div class="cl-row"><label class="ch2">CH2 V/div</label><select data-s="v2">' + optList(VDIVS, snap125(S.v2, VDIVS), 'V') + '</select></div>' +
      '<div class="cl-row"><label>trigger</label><input type="range" min="-1" max="1" step="0.02" value="' + (S.trig / (S.v1 * 4) || 0) + '" data-s="trig"></div>' +
      '<div class="cl-row"><button class="cl-btn" data-s="auto">Auto-set</button><button class="cl-btn" data-s="clr">Clear</button></div><div class="cl-stat" data-k="sst"></div>';
    E.sctl.querySelectorAll('[data-pk]').forEach(function (b) { b.onclick = function () { startPick(b.dataset.pk); }; });
    E.sctl.querySelectorAll('select').forEach(function (sl) { sl.onchange = function () { S[sl.dataset.s] = +sl.value; if (sl.dataset.s === 'tdiv') A.h = autoStep(A.nl, winLen()); }; });
    E.sctl.querySelector('input').oninput = function (e) { S.trig = +e.target.value * S.v1 * 4; };
    E.sctl.querySelector('[data-s=auto]').onclick = autoSet; E.sctl.querySelector('[data-s=clr]').onclick = resetHist;
  }
  function autoSet() {
    const H = A.hist, n = H.t.length; if (n < 20) return;
    const est = function (arr) {
      const i0 = Math.max(0, n - Math.min(n, 4000)); let mn = 1e9, mx = -1e9; for (let i = i0; i < n; i++) { mn = Math.min(mn, arr[i]); mx = Math.max(mx, arr[i]); }
      const mid = (mn + mx) / 2; let cr = [], i = i0 + 1; for (; i < n; i++) if (arr[i - 1] < mid && arr[i] >= mid) cr.push(H.t[i]);
      return { mn: mn, mx: mx, per: cr.length >= 3 ? (cr[cr.length - 1] - cr[0]) / (cr.length - 1) : cr.length === 2 ? cr[1] - cr[0] : 0 };
    };
    const a = est(H.a), b = est(H.b);
    if (a.per || b.per) A.sc.tdiv = snap125(Math.max(a.per, b.per) / 2.5 * (a.per && b.per ? 1 : 1), TDIVS);
    A.sc.v1 = snap125(Math.max((a.mx - a.mn) / 6, 1e-3), VDIVS); A.sc.v2 = snap125(Math.max((b.mx - b.mn) / 6, 1e-3), VDIVS); A.sc.trig = (a.mx + a.mn) / 2;
    A.h = autoStep(A.nl, winLen()); buildScopeCtl();
  }
  function drawScope() {
    const c = E.scv.getContext('2d'), dpr = window.devicePixelRatio || 1, W = E.scv.clientWidth, Hh = E.scv.clientHeight; if (!W || !Hh) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#04060c'; c.fillRect(0, 0, W, Hh);
    const m = { l: 8, r: 8, t: 8, b: 20 }, pw = W - m.l - m.r, ph = Hh - m.t - m.b, S = A.sc;
    c.strokeStyle = 'rgba(110,231,255,.13)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i <= 10; i++) { const x = Math.round(m.l + pw * i / 10) + .5; c.moveTo(x, m.t); c.lineTo(x, m.t + ph); }
    for (let j = 0; j <= 8; j++) { const y = Math.round(m.t + ph * j / 8) + .5; c.moveTo(m.l, y); c.lineTo(m.l + pw, y); } c.stroke();
    c.strokeStyle = 'rgba(110,231,255,.3)'; c.beginPath(); c.moveTo(m.l, m.t + ph / 2 + .5); c.lineTo(m.l + pw, m.t + ph / 2 + .5); c.moveTo(m.l + pw / 2 + .5, m.t); c.lineTo(m.l + pw / 2 + .5, m.t + ph); c.stroke();
    c.fillStyle = '#7b87a3'; c.font = '10.5px Inter'; c.textAlign = 'left'; c.fillText(fmt(S.tdiv, 's') + '/div', m.l + 2, Hh - 6); c.textAlign = 'right'; c.fillStyle = '#ffd166'; c.fillText('CH1 ' + fmt(S.v1, 'V') + '/div', m.l + pw * .62, Hh - 6); c.fillStyle = '#6ee7ff'; c.fillText('CH2 ' + fmt(S.v2, 'V') + '/div', m.l + pw, Hh - 6);
    const st = [];
    if (A.mode !== 'tran' || !A.sim) { c.fillStyle = '#7b87a3'; c.textAlign = 'center'; c.fillText(A.mode === 'tran' ? '' : 'Switch to Transient mode to use the oscilloscope', m.l + pw / 2, m.t + ph / 2); return; }
    const H = A.hist, n = H.t.length; if (n < 2) return;
    const win = winLen(), tn = H.t[n - 1];
    // trigger: latest rising crossing of CH1 with a full window after it
    let t0 = Math.max(0, tn - win), roll = true;
    if (A.pn.a1 != null) {
      let i = n - 1; while (i > 0 && H.t[i] > tn - win) i--;
      for (let k = 0, lim = 400000; i > 0 && k < lim; i--, k++) { if (H.a[i - 1] < S.trig && H.a[i] >= S.trig) { t0 = H.t[i]; roll = false; break; } if (H.t[i] < tn - 3 * win - 1e-12) break; }
      if (roll && tn < win) t0 = 0;
    } else if (tn < win) t0 = 0;
    const trL = m.t + ph / 2 - S.trig / S.v1 * ph / 8; if (A.pn.a1 != null) { c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(m.l, trL - 4); c.lineTo(m.l + 7, trL); c.lineTo(m.l, trL + 4); c.fill(); }
    // find start index via binary search
    let lo = 0, hi = n - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (H.t[mid] < t0) lo = mid + 1; else hi = mid; }
    const chans = [['a', S.v1, '#ffd166', A.pn.a1 != null], ['b', S.v2, '#6ee7ff', A.pn.a2 != null]];
    chans.forEach(function (ch) {
      if (!ch[3]) return; const arr = H[ch[0]]; c.strokeStyle = ch[2]; c.lineWidth = 1.6; c.shadowColor = ch[2]; c.shadowBlur = 5; c.beginPath(); let started = false;
      const colMin = new Float64Array(Math.ceil(pw) + 2).fill(Infinity), colMax = new Float64Array(Math.ceil(pw) + 2).fill(-Infinity);
      for (let i = lo; i < n; i++) { const x = (H.t[i] - t0) / win * pw; if (x > pw) break; const cI = Math.max(0, Math.floor(x)); if (arr[i] < colMin[cI]) colMin[cI] = arr[i]; if (arr[i] > colMax[cI]) colMax[cI] = arr[i]; }
      let last = null;
      for (let k = 0; k < colMin.length; k++) { if (colMin[k] === Infinity) continue; const yA = m.t + ph / 2 - colMin[k] / ch[1] * ph / 8, yB = m.t + ph / 2 - colMax[k] / ch[1] * ph / 8, x = m.l + k + .5; if (!started) { c.moveTo(x, Math.max(m.t, Math.min(m.t + ph, yA))); started = true; } else c.lineTo(x, Math.max(m.t, Math.min(m.t + ph, last))); c.lineTo(x, Math.max(m.t, Math.min(m.t + ph, yA))); c.lineTo(x, Math.max(m.t, Math.min(m.t + ph, yB))); last = yB; }
      c.stroke(); c.shadowBlur = 0;
      // stats over displayed window
      let mn = 1e9, mx = -1e9, sum = 0, sq = 0, cnt = 0, cross = []; for (let i = lo; i < n; i++) { if (H.t[i] > t0 + win) break; const v = arr[i]; mn = Math.min(mn, v); mx = Math.max(mx, v); sum += v; sq += v * v; cnt++; if (i > lo && arr[i - 1] < (mx + mn) / 2 && v >= (mx + mn) / 2) cross.push(H.t[i]); }
      if (cnt > 2) { const mean = sum / cnt, f = cross.length >= 2 ? (cross.length - 1) / (cross[cross.length - 1] - cross[0]) : 0; st.push('<span class="' + (ch[0] === 'a' ? 'ch1' : 'ch2') + '">' + (ch[0] === 'a' ? 'CH1' : 'CH2') + '</span> Vpp ' + fmt(mx - mn, 'V') + ' &middot; mean ' + fmt(mean, 'V') + ' &middot; rms ' + fmt(Math.sqrt(sq / cnt), 'V') + (f ? ' &middot; ' + fmt(f, 'Hz') : '')); }
    });
    c.fillStyle = '#7b87a3'; c.textAlign = 'left'; if (roll && A.pn.a1 != null) c.fillText('(no trigger: rolling)', m.l + 4, m.t + 12);
    const el = E.sctl.querySelector('[data-k=sst]'); if (el) { const h = st.join('<br>') || 'Attach a probe, then click a wire or pin.'; if (el._h !== h) { el._h = h; el.innerHTML = h; } }
  }

  /* ---- Bode ---- */
  function buildBodeCtl() {
    const B = A.bode;
    E.bctl.innerHTML = '<div class="cl-row"><label>Input</label><button class="cl-btn" data-pk="bi">' + (B.in ? 'move' : 'pick node') + '</button></div><div class="cl-row"><label>Output</label><button class="cl-btn" data-pk="bo">' + (B.out ? 'move' : 'pick node') + '</button></div>' +
      '<div class="cl-row"><label>f min</label><input type="text" data-b="fmin" value="' + fmtRaw(B.fmin) + '"></div><div class="cl-row"><label>f max</label><input type="text" data-b="fmax" value="' + fmtRaw(B.fmax) + '"></div>' +
      '<div class="cl-row"><button class="cl-btn" data-b="run">Run sweep</button></div><div class="cl-stat" data-k="bst"></div>';
    E.bctl.querySelectorAll('[data-pk]').forEach(function (b) { b.onclick = function () { startPick(b.dataset.pk); }; });
    E.bctl.querySelectorAll('input').forEach(function (i) { i.onchange = function () { const v = parseEng(i.value); if (v > 0) B[i.dataset.b] = v; i.value = fmtRaw(B[i.dataset.b]); scheduleBode(); }; i.onkeydown = function (e) { e.stopPropagation(); }; });
    E.bctl.querySelector('[data-b=run]').onclick = runBode;
  }
  function runBode() {
    const B = A.bode; A.bd = null; if (!A.nl || !B.in || !B.out) { A.bdMsg = 'Pick an input and an output node.'; A.dirty = true; return; }
    const ni = A.nl.netAt(B.in[0], B.in[1]), no = A.nl.netAt(B.out[0], B.out[1]);
    if (ni == null || no == null) { A.bdMsg = 'Input/output node not found on the circuit.'; return; }
    const sim = new Sim(A.nl); if (!sim.dc()) { A.bdMsg = sim.err ? sim.err.msg : 'No DC operating point.'; return; }
    if (!sim.elems.some(function (e) { return e.t === 'V' && e.w.k !== 'dc'; })) { A.bdMsg = 'The AC sweep needs an AC (sine) or pulse source as the stimulus.'; return; }
    const f = [], m = [], p = [], ppd = 30, dec = Math.log10(B.fmax / B.fmin); let prev = null, off = 0;
    for (let i = 0, N = Math.max(8, Math.round(dec * ppd)); i <= N; i++) {
      const fr = B.fmin * Math.pow(10, dec * i / N), t = sim.tf(fr, ni, no); if (!t) { A.bdMsg = sim.err ? sim.err.msg : 'Singular AC matrix.'; return; }
      let ph = t[1] * 180 / Math.PI + off; if (prev != null) { while (ph - prev > 180) { ph -= 360; off -= 360; } while (ph - prev < -180) { ph += 360; off += 360; } } prev = ph;
      f.push(fr); m.push(20 * Math.log10(Math.max(t[0], 1e-12))); p.push(ph);
    }
    A.bd = { f: f, m: m, p: p }; A.bdMsg = ''; A.dirty = true;
    // readout
    let pk = 0; m.forEach(function (v, i) { if (v > m[pk]) pk = i; });
    const cross = function (target, from, dir) { for (let i = from; i + dir >= 0 && i + dir < m.length; i += dir) { const a = m[i], b = m[i + dir]; if ((a - target) * (b - target) <= 0 && a !== b) { const t = (target - a) / (b - a); return Math.pow(10, Math.log10(f[i]) + t * (Math.log10(f[i + dir]) - Math.log10(f[i]))); } } return null; };
    const fl = cross(m[pk] - 3, pk, -1), fh = cross(m[pk] - 3, pk, 1);
    let s = 'Peak ' + m[pk].toFixed(1) + ' dB at ' + fmt(f[pk], 'Hz');
    if (fl && fh) s += '<br>&minus;3 dB band ' + fmt(fl, 'Hz') + ' &ndash; ' + fmt(fh, 'Hz') + '<br>Q &asymp; ' + (f[pk] / (fh - fl)).toFixed(1);
    else if (fh) s += '<br>&minus;3 dB corner (low-pass): <b>' + fmt(fh, 'Hz') + '</b>'; else if (fl) s += '<br>&minus;3 dB corner (high-pass): <b>' + fmt(fl, 'Hz') + '</b>';
    A.bdTxt = s;
  }
  function drawBode() {
    const cv = E.bcv, c = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#04060c'; c.fillRect(0, 0, W, H);
    const el = E.bctl.querySelector('[data-k=bst]'); const B = A.bode;
    if (!A.bd) { c.fillStyle = '#7b87a3'; c.font = '12px Inter'; c.textAlign = 'center'; c.fillText(A.bdMsg || 'Computing...', W / 2, H / 2); if (el) el.textContent = ''; return; }
    if (el && el._h !== A.bdTxt) { el._h = A.bdTxt; el.innerHTML = A.bdTxt; }
    const D = A.bd, m = { l: 46, r: 12, t: 10, b: 20 }, pw = W - m.l - m.r, ph = (H - m.t - m.b - 14) / 2;
    const lx0 = Math.log10(D.f[0]), lx1 = Math.log10(D.f[D.f.length - 1]), X = function (f) { return m.l + (Math.log10(f) - lx0) / (lx1 - lx0) * pw; };
    const mx = Math.max.apply(null, D.m), mn = Math.min.apply(null, D.m), ymax = Math.ceil((mx + 2) / 10) * 10, ymin = Math.max(Math.floor(mn / 10) * 10, ymax - 80);
    const pmx = Math.max.apply(null, D.p), pmn = Math.min.apply(null, D.p), pTop = Math.ceil(Math.max(pmx, 0) / 45) * 45 + (pmx > 0 ? 0 : 0), pBot = Math.floor(Math.min(pmn, 0) / 45) * 45;
    const panels = [{ y0: m.t, arr: D.m, lo: ymin, hi: ymax, step: 10, col: '#ffd166', unit: 'dB' }, { y0: m.t + ph + 14, arr: D.p, lo: pBot === pTop ? pBot - 45 : pBot, hi: pTop === pBot ? pTop + 45 : pTop, step: 45, col: '#6ee7ff', unit: '°' }];
    panels.forEach(function (P) {
      const Y = function (v) { return P.y0 + ph - (v - P.lo) / (P.hi - P.lo) * ph; };
      c.strokeStyle = 'rgba(110,231,255,.12)'; c.lineWidth = 1; c.fillStyle = '#7b87a3'; c.font = '10px Inter'; c.textAlign = 'right';
      const stp = (P.hi - P.lo) / P.step > 8 ? P.step * 2 : P.step; for (let v = Math.ceil(P.lo / stp) * stp; v <= P.hi + 1e-9; v += stp) { const y = Math.round(Y(v)) + .5; c.beginPath(); c.moveTo(m.l, y); c.lineTo(m.l + pw, y); c.stroke(); c.fillText(v.toFixed(0) + P.unit, m.l - 4, y + 3); }
      for (let e = Math.ceil(lx0); e <= lx1; e++) for (let k = 1; k < 10; k++) { const f = k * Math.pow(10, e); if (Math.log10(f) > lx1) break; if (Math.log10(f) < lx0) continue; const x = Math.round(X(f)) + .5; c.strokeStyle = k === 1 ? 'rgba(110,231,255,.2)' : 'rgba(110,231,255,.07)'; c.beginPath(); c.moveTo(x, P.y0); c.lineTo(x, P.y0 + ph); c.stroke(); if (k === 1 && P === panels[1]) { c.fillStyle = '#7b87a3'; c.textAlign = 'center'; c.fillText(fmt(f, 'Hz'), x, P.y0 + ph + 12); } }
      c.strokeStyle = P.col; c.lineWidth = 1.8; c.shadowColor = P.col; c.shadowBlur = 4; c.beginPath(); P.arr.forEach(function (v, i) { const x = X(D.f[i]), y = Math.max(P.y0, Math.min(P.y0 + ph, Y(v))); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = P.col; c.textAlign = 'left'; c.fillText(P === panels[0] ? 'magnitude' : 'phase', m.l + 4, P.y0 + 11);
    });
    // -3 dB line
    const pkv = mx; const y3 = panels[0].y0 + ph - (pkv - 3 - ymin) / (ymax - ymin) * ph; if (y3 > m.t && y3 < m.t + ph) { c.strokeStyle = 'rgba(255,255,255,.3)'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(m.l, y3); c.lineTo(m.l + pw, y3); c.stroke(); c.setLineDash([]); }
    if (A.bodeHover != null) { const x = A.bodeHover; if (x >= m.l && x <= m.l + pw) { const f = Math.pow(10, lx0 + (x - m.l) / pw * (lx1 - lx0)); let bi = 0, bd = 1e9; D.f.forEach(function (ff, i) { const d = Math.abs(Math.log(ff / f)); if (d < bd) { bd = d; bi = i; } }); c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(x + .5, m.t); c.lineTo(x + .5, H - m.b); c.stroke(); c.fillStyle = '#fff'; c.textAlign = x > W / 2 ? 'right' : 'left'; c.fillText(fmt(D.f[bi], 'Hz') + '  ' + D.m[bi].toFixed(1) + ' dB  ' + D.p[bi].toFixed(0) + '°', x + (x > W / 2 ? -6 : 6), m.t + 24); } }
  }
  E.bcv.addEventListener('pointermove', function (e) { A.bodeHover = e.clientX - E.bcv.getBoundingClientRect().left; });
  E.bcv.addEventListener('pointerleave', function () { A.bodeHover = null; });

  /* ---- multimeter & values ---- */
  function buildMeter() {
    E.mpane.innerHTML = '<div class="cl-ctl"><div class="cl-row"><label style="color:#ff8c8c">Red (+)</label><button class="cl-btn" data-pk="da">' + (A.pr.da ? 'move' : 'attach') + '</button></div><div class="cl-row"><label>Black (−)</label><button class="cl-btn" data-pk="db">' + (A.pr.db ? 'move' : 'ground') + '</button></div><div class="cl-stat">Click a lead button, then click a wire or pin. Leave black unset to measure to ground.</div></div><div class="cl-dmm"><div class="big" data-k="dv">--</div><div class="sm" data-k="ds"></div></div>';
    E.mpane.querySelectorAll('[data-pk]').forEach(function (b) { b.onclick = function () { startPick(b.dataset.pk); }; });
  }
  function updateMeter() {
    const dv = E.mpane.querySelector('[data-k=dv]'); if (!dv || !A.sim) return;
    if (A.pn.da == null) { dv.textContent = '--'; E.mpane.querySelector('[data-k=ds]').innerHTML = 'No red lead attached.'; return; }
    const v = netV(A.pn.da) - netV(A.pn.db); dv.textContent = fmt(v, 'V');
    let mean = v, rms = Math.abs(v), pp = 0, txt = '';
    if (A.mode === 'tran' && A.hist.t.length > 10) {
      const H = A.hist, n = H.t.length, win = Math.max(winLen(), 1e-6); let i = n - 1; while (i > 0 && H.t[i] > H.t[n - 1] - win) i--;
      let s = 0, q = 0, mn = 1e9, mx = -1e9, k = 0; for (let j = i; j < n; j++) { const x = H.c[j]; s += x; q += x * x; mn = Math.min(mn, x); mx = Math.max(mx, x); k++; }
      mean = s / k; rms = Math.sqrt(q / k); pp = mx - mn; txt = '<span>DC (mean) <b>' + fmt(mean, 'V') + '</b></span><span>AC rms <b>' + fmt(Math.sqrt(Math.max(0, rms * rms - mean * mean)), 'V') + '</b></span><span>true rms <b>' + fmt(rms, 'V') + '</b></span><span>peak-peak <b>' + fmt(pp, 'V') + '</b></span>';
    } else txt = '<span>DC value <b>' + fmt(v, 'V') + '</b></span><span>' + (A.mode === 'tran' ? '' : 'steady-state operating point') + '</span>';
    const el = E.mpane.querySelector('[data-k=ds]'); if (el._h !== txt) { el._h = txt; el.innerHTML = txt; }
  }
  function updateValues() {
    if (A.tab !== 'values' || !A.sim) return;
    let h = '<table><tr><th>Node</th><th>Voltage</th></tr>';
    for (let k = 0; k <= A.nl.n; k++) h += '<tr><td class="n">' + A.nl.nodeName(k) + '</td><td>' + fmt(netV(k), 'V') + '</td></tr>'; h += '</table><table><tr><th>Part</th><th>Type</th><th>V across</th><th>Current</th><th>Power</th></tr>';
    A.sim.elems.forEach(function (e) { if (!e.part) return; h += '<tr><td>' + e.name + '</td><td class="n">' + TY[e.part.type].name + '</td><td>' + fmt(e.vd, 'V') + '</td><td>' + fmt(e.i[0], 'A') + '</td><td>' + fmt(e.vd * e.i[0], 'W') + '</td></tr>'; });
    h += '</table>'; if (E.vtbl._h !== h) { E.vtbl._h = h; E.vtbl.innerHTML = h; }
  }

  /* ---------------- main loop ---------------- */
  let raf = 0, last = 0, uiT = 0;
  function pushSample() {
    const H = A.hist, s = A.sim, P = A.pn;
    H.t.push(s.t); H.a.push(P.a1 != null ? s.v(P.a1) - s.v(P.r1) : 0); H.b.push(P.a2 != null ? s.v(P.a2) - s.v(P.r2) : 0); H.c.push(P.da != null ? s.v(P.da) - s.v(P.db) : 0);
    if (H.t.length > 360000) { for (const k of ['t', 'a', 'b', 'c']) H[k].splice(0, 120000); }
  }
  function loop(now) {
    if (A.closed) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now; frameDt = dt;
    const sim = A.sim;
    if (sim && A.mode === 'tran' && A.running && !(sim.err && sim.err.kind !== 'nonconv')) {
      const rate = winLen() / 5 * A.speed, tEnd = sim.t + dt * rate, t0 = performance.now(), h = A.h;
      let n = 0;
      while (sim.t < tEnd - h * 1e-6) { sim.step(Math.min(h, tEnd - sim.t)); pushSample(); if ((++n & 31) === 0 && performance.now() - t0 > 11) break; }
      if (sim.err && sim.err.kind === 'nonconv') { A.err = sim.err; sim.err = null; }
    }
    if (sim && A.nl) {
      // wire flows
      A.flows = wireFlows(A.nl, sim);
    }
    if (A.err && A.err.kind !== 'nonconv') showBanner(A.err.msg, 'err');
    else if (A.nl && A.nl.warnings.length && !A.pick) showBanner(A.nl.warnings[0], 'info'); else if (!A.pick) showBanner(A.err ? A.err.msg : null, 'err');
    E.tnow.textContent = A.mode === 'tran' && sim ? 't = ' + fmt(sim.t, 's') : '';
    render(now);
    if (now - uiT > 120) {
      uiT = now; updateExplain(now); updateProps(); updateMeter(); updateValues();
      if (A.tab === 'scope') drawScope();
    }
    if (A.tab === 'scope' && A.mode === 'tran' && A.running) drawScope();
    if (A.tab === 'bode') drawBode();
  }

  /* ---------------- boot ---------------- */
  buildPalette(); resize(); buildScopeCtl(); buildBodeCtl(); buildMeter(); syncUI();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () { resize(); }) : null; if (ro) { ro.observe(E.stage); ro.observe(E.drawer); }
  window.addEventListener('resize', resize);
  recompile(false); fitView();
  loadPresets().then(function (list) { A.presets = list; fillPresetSelect(); });
  if (presetId) loadPreset(presetId);
  last = performance.now(); raf = requestAnimationFrame(loop);
  setTimeout(function () { resize(); if (!A.parts.length) fitView(); }, 60);

  return {
    close: function () { A.closed = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); window.removeEventListener('resize', resize); clearTimeout(bodeTimer); R.remove(); },
    loadPreset: loadPreset,
    _state: A, _el: R
  };
}

LABS.circuit = { title: 'Circuit Lab', presetUrl: 'data/labs/circuit_presets.json', solver: API, open: createLab };
})(typeof window !== "undefined" ? window : globalThis);
