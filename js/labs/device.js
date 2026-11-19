/* ===== SEMICONDUCTOR DEVICE LAB — plain JS, 2D canvas + DOM, no dependencies =====
   Physics core (silicon @300 K): Eg 1.12 eV, ni 1.00e10 cm^-3, NC 2.86e19, NV 2.28e19 (tuned so ni is consistent), er 11.7. */
(function () {
'use strict';
var G = typeof window !== 'undefined' ? window : globalThis;
G.LABS = G.LABS || {};
var SCRIPT_SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '';

/* ---------- constants & silicon parameters ---------- */
var Q = 1.602176634e-19, KB = 8.617333262e-5, EPS0 = 8.8541878128e-14, ESI = 11.7 * EPS0, EOX = 3.9 * EPS0;
var SI = { Eg300: 1.12, ni300: 1.0e10, NC300: 2.86e19, Ed: 0.045, Ea: 0.045 };
SI.NV300 = SI.ni300 * SI.ni300 * Math.exp(SI.Eg300 / (KB * 300)) / SI.NC300;   // makes ni = sqrt(NC*NV) exp(-Eg/2kT) exactly 1e10 at 300 K
function Eg(T) { var v = function (t) { return 4.73e-4 * t * t / (t + 636); }; return SI.Eg300 + v(300) - v(T); }  // Varshni shift
function NC(T) { return SI.NC300 * Math.pow(T / 300, 1.5); }
function NV(T) { return SI.NV300 * Math.pow(T / 300, 1.5); }
function ni(T) { return Math.sqrt(NC(T) * NV(T)) * Math.exp(-Eg(T) / (2 * KB * T)); }
function asinh(x) { return Math.log(x + Math.sqrt(x * x + 1)); }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function ex(x) { return Math.exp(Math.min(x, 80)); }

/* Caughey–Thomas mobility (cm^2/Vs), total ionized impurity N, lattice ~ T^-2.4 / T^-2.2 */
function mobility(N, T, hole) {
  var P = hole ? { mn: 44.9, mx: 470.5, Nr: 2.23e17, a: 0.719, tx: -2.2 } : { mn: 68.5, mx: 1417, Nr: 9.2e16, a: 0.711, tx: -2.4 };
  return P.mn + (P.mx * Math.pow(T / 300, P.tx) - P.mn) / (1 + Math.pow(Math.max(N, 1) / P.Nr, P.a));
}

/* charge neutrality with incomplete ionization (P donors 45 meV, B acceptors 45 meV); energies measured from Ev */
function carriers(ND, NA, T) {
  var kT = KB * T, eg = Eg(T), nc = NC(T), nv = NV(T), ed = eg - SI.Ed, ea = SI.Ea;
  function g(EF) {
    var p = nv * ex(-EF / kT), n = nc * ex((EF - eg) / kT);
    return p + ND / (1 + 2 * ex((EF - ed) / kT)) - n - NA / (1 + 4 * ex((ea - EF) / kT));
  }
  var lo = -0.4, hi = eg + 0.4, i, mid;
  for (i = 0; i < 100; i++) { mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
  var EF = (lo + hi) / 2, n = nc * ex((EF - eg) / kT), p = nv * ex(-EF / kT), nI = ni(T);
  return { n: n, p: p, EF: EF, Ei: eg - kT * Math.log(nc / nI), Ec: eg, Ev: 0, Ed: ed, Ea: ea, eg: eg, kT: kT, nc: nc, nv: nv, ni: nI,
    ndp: ND / (1 + 2 * ex((EF - ed) / kT)), nam: NA / (1 + 4 * ex((ea - EF) / kT)) };
}

/* ---------- PN junction ---------- */
function pnDep(NA, ND, V, T) {
  T = T || 300; var vt = KB * T, n_i = ni(T), Vbi = vt * Math.log(NA * ND / (n_i * n_i));
  var Vb = Math.max(Vbi - V, 0.04 * Vbi);
  var W = Math.sqrt(2 * ESI * Vb / Q * (1 / NA + 1 / ND)), xn = W * NA / (NA + ND), xp = W * ND / (NA + ND);
  return { Vbi: Vbi, Vb: Vb, W: W, xn: xn, xp: xp, Emax: Q * ND * xn / ESI, Cj: ESI / W, vt: vt, ni: n_i };
}
function Vbreak(NA, ND, T) {   // avalanche (Sze) vs Zener tunnelling (field 1e6 V/cm) — whichever is lower
  var NB = Math.min(NA, ND), Nz = NA * ND / (NA + ND);
  var va = 60 * Math.pow(Eg(T || 300) / 1.1, 1.5) * Math.pow(NB / 1e16, -0.75);
  var vz = ESI * 1e12 / (2 * Q * Nz);
  return Math.min(va, vz);
}
/* 1-D Poisson (Boltzmann statistics, quasi-Fermi levels ramp across the depletion region); returns arrays in cm / V / C cm^-3 / V cm^-1 */
function poisson(NA, ND, V, T, xL, xR, Np) {
  T = T || 300; var vt = KB * T, n_i = ni(T), M = Math.floor((Np || 400) / 2), N = 2 * M + 1, i, it, beta = 6, sb = Math.sinh(beta);
  var d = pnDep(NA, ND, Math.min(V, 0.92 * pnDep(NA, ND, 0, T).Vbi), T);
  var pL = -vt * asinh(NA / (2 * n_i)), pR = vt * asinh(ND / (2 * n_i)) - V;
  var x = [], psi = [], dop = [], phi = [], php = [], rho = [], E = [], nn = [], pp = [];
  for (i = 0; i < N; i++) {       // graded mesh, finest at the metallurgical junction
    var xi = i <= M ? xL * Math.sinh(beta * (1 - i / M)) / sb : xR * Math.sinh(beta * (i - M) / M) / sb;
    x.push(xi); dop.push(xi < 0 ? -NA : xi > 0 ? ND : (ND - NA) / 2);
    var f = xi <= -d.xp ? 0 : xi >= d.xn ? 1 : (xi < 0 ? 0.5 * Math.pow((xi + d.xp) / d.xp, 2) : 1 - 0.5 * Math.pow((d.xn - xi) / d.xn, 2));
    psi.push(pL + (pR - pL) * f);
    var Lv = 0.6 * d.W;   // quasi-Fermi potentials: flat through the depletion region, relaxing to the contact value over a (cartoon) diffusion length Lv
    phi.push(xi >= -d.xp ? -V : -V * Math.exp((xi + d.xp) / Lv)); php.push(xi <= d.xn ? 0 : -V * (1 - Math.exp(-(xi - d.xn) / Lv)));
  }
  var a = new Array(N), b = new Array(N), c = new Array(N), F = new Array(N), dl = new Array(N), cp = new Array(N), dp = new Array(N);
  for (it = 0; it < 80; it++) {
    var mx = 0;
    for (i = 1; i < N - 1; i++) {
      var n = n_i * ex((psi[i] - phi[i]) / vt), p = n_i * ex(-(psi[i] - php[i]) / vt), hl = x[i] - x[i - 1], hr = x[i + 1] - x[i];
      a[i] = 2 * ESI / (hl * (hl + hr)); c[i] = 2 * ESI / (hr * (hl + hr));
      F[i] = a[i] * (psi[i - 1] - psi[i]) + c[i] * (psi[i + 1] - psi[i]) + Q * (p - n + dop[i]);
      b[i] = -(a[i] + c[i]) - Q / vt * (p + n);
    }
    cp[1] = c[1] / b[1]; dp[1] = -F[1] / b[1];
    for (i = 2; i < N - 1; i++) { var m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (-F[i] - a[i] * dp[i - 1]) / m; }
    dl[N - 2] = dp[N - 2]; for (i = N - 3; i >= 1; i--) dl[i] = dp[i] - cp[i] * dl[i + 1];
    for (i = 1; i < N - 1; i++) { var s = clamp(dl[i], -0.1, 0.1); psi[i] += s; mx = Math.max(mx, Math.abs(s)); }
    if (mx < 1e-9) break;
  }
  psi[0] = pL; psi[N - 1] = pR;
  for (i = 0; i < N; i++) {
    nn.push(n_i * ex((psi[i] - phi[i]) / vt)); pp.push(n_i * ex(-(psi[i] - php[i]) / vt)); rho.push(Q * (pp[i] - nn[i] + dop[i]));
    var j0 = Math.max(i - 1, 0), j1 = Math.min(i + 1, N - 1); E.push(-(psi[j1] - psi[j0]) / (x[j1] - x[j0]));
  }
  return { x: x, psi: psi, rho: rho, E: E, n: nn, p: pp, phin: phi, phip: php, pL: pL, pR: pR };
}

/* diode I(V) with long-diode Is, depletion generation, optional breakdown, series resistance */
function diodeParams(NA, ND, T, o) {
  o = o || {}; var A = o.A || 1e-4, tau = o.tau || 1e-6, n_i = ni(T), vt = KB * T;
  var mun = mobility(NA + ND, T, false), mup = mobility(NA + ND, T, true), Dn = mun * vt, Dp = mup * vt;
  var Ln = Math.sqrt(Dn * tau), Lp = Math.sqrt(Dp * tau);
  var Is = A * Q * n_i * n_i * (Dp / (Lp * ND) + Dn / (Ln * NA));
  return { Is: Is, A: A, T: T, vt: vt, n: 1, tau: tau, ni: n_i, NA: NA, ND: ND, Vbi: vt * Math.log(NA * ND / (n_i * n_i)), Vbr: Vbreak(NA, ND, T), bd: !!o.bd, Rs: o.Rs || 0, Dn: Dn, Dp: Dp, Ln: Ln, Lp: Lp };
}
function diodeI(Vj, P) {
  var I = P.Is * (ex(Vj / (P.n * P.vt)) - 1);
  if (Vj < 0) { var W = pnDep(P.NA, P.ND, Vj, P.T).W; I -= Q * P.A * P.ni * W / (2 * P.tau); }
  if (P.bd && Vj < 0) I -= 1e-3 * ex((-Vj - P.Vbr) / 0.04);
  return I;
}
function solveDiode(Vapp, P) {
  var lo = -400, hi = 6, i, m;
  for (i = 0; i < 90; i++) { m = (lo + hi) / 2; if (m + diodeI(m, P) * P.Rs > Vapp) hi = m; else lo = m; }
  var Vj = (lo + hi) / 2; return { Vj: Vj, I: diodeI(Vj, P) };
}

/* ---------- solar cell (J in A/cm^2, generator convention J>0 = power out) ---------- */
function cellJ(V, c) {
  var vt = KB * c.T, lo = -20, hi = 20, i, m;
  for (i = 0; i < 80; i++) { m = (lo + hi) / 2; var Vd = V + m * c.Rs; var r = c.Jph - c.J0 * (ex(Vd / (c.n * vt)) - 1) - Vd / c.Rsh; if (m - r > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
function cellStats(c) {
  var lo = 0, hi = 1.5, i, m;
  for (i = 0; i < 60; i++) { m = (lo + hi) / 2; if (cellJ(m, c) > 0) lo = m; else hi = m; }
  var Voc = lo, Jsc = cellJ(0, c), best = 0, Vm = 0, Jm = 0;
  for (i = 0; i <= 300; i++) { var v = Voc * i / 300, j = cellJ(v, c); if (v * j > best) { best = v * j; Vm = v; Jm = j; } }
  return { Voc: Voc, Jsc: Jsc, Pmax: best, Vm: Vm, Jm: Jm, FF: Voc * Jsc > 0 ? best / (Voc * Jsc) : 0 };
}

/* ---------- Ebers–Moll BJT (n-p-n), transport form with Early effect ---------- */
function bjtI(VBE, VBC, P) {
  var e1 = ex(VBE / P.vt) - 1, e2 = ex(VBC / P.vt) - 1, VCE = VBE - VBC;
  var IT = P.Is * (e1 - e2) * (1 + Math.max(VCE, 0) / P.VA);
  return { IC: IT - P.Is / P.br * e2, IB: P.Is / P.bf * e1 + P.Is / P.br * e2 };
}
function bjtVBE(IB, VCE, P) {
  var lo = -1, hi = 1.1, i, m;
  for (i = 0; i < 70; i++) { m = (lo + hi) / 2; if (bjtI(m, m - VCE, P).IB > IB) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
function bjtOp(IB, VCC, RC, P) {
  var lo = 0, hi = VCC, i, m;
  for (i = 0; i < 60; i++) { m = (lo + hi) / 2; var VBE = bjtVBE(IB, m, P); if (bjtI(VBE, VBE - m, P).IC - (VCC - m) / RC > 0) hi = m; else lo = m; }
  var VCE = (lo + hi) / 2, VBE2 = bjtVBE(IB, VCE, P), r = bjtI(VBE2, VBE2 - VCE, P);
  return { VCE: VCE, VBE: VBE2, IC: r.IC, IB: IB };
}

/* ---------- MOS capacitor & MOSFET ---------- */
function mosParams(o) {  // o: NA (cm^-3), tox (nm), gate: 'n'|'mid'|'p', T
  var T = o.T || 300, vt = KB * T, n_i = ni(T), pF = vt * Math.log(o.NA / n_i), Cox = EOX / (o.tox * 1e-7);
  var VFB = o.gate === 'n' ? -(Eg(T) / 2 + pF) : o.gate === 'p' ? Eg(T) / 2 - pF : -pF;
  var Qd = Math.sqrt(2 * ESI * Q * o.NA * 2 * pF);
  return { T: T, vt: vt, ni: n_i, phiF: pF, Cox: Cox, VFB: VFB, VT: VFB + 2 * pF + Qd / Cox, Wmax: Math.sqrt(4 * ESI * pF / (Q * o.NA)), NA: o.NA };
}
function mosSurface(VG, m) {   // exact 1-D MOS (p-type): solve VG = VFB + psi_s + |Qs|/Cox for psi_s
  var vt = m.vt, r2 = Math.pow(m.ni / m.NA, 2), lo = -1.2, hi = 2.2, i, s;
  function Qs(ps) {
    var F = Math.sqrt(Math.max(0, (ex(-ps / vt) + ps / vt - 1) + r2 * (ex(ps / vt) - ps / vt - 1)));
    return -(ps >= 0 ? 1 : -1) * Math.sqrt(2 * ESI * KB * m.T * m.NA * Q) * F;   // C/cm^2 (negative for depletion/inversion)
  }
  for (i = 0; i < 80; i++) { s = (lo + hi) / 2; if (m.VFB + s - Qs(s) / m.Cox > VG) hi = s; else lo = s; }
  s = (lo + hi) / 2; var q = Qs(s);
  return { ps: s, Qs: q, Qinv: s > 0 ? Math.max(0, -q - Math.sqrt(2 * ESI * Q * m.NA * s)) : 0 };
}
/* drain current (A) per micron of width; o: {VT,Cox,L(um),WL,mu0,sce,lam} */
function mosId(VGS, VDS, o) {
  var vt = 0.025852, n = o.n || 1.3, L = o.L * 1e-4, sign = VDS < 0 ? -1 : 1; VDS = Math.abs(VDS);
  var VT = o.VT - (o.sce ? o.dibl * VDS : 0), Vov = VGS - VT;
  var Veff = 2 * n * vt * Math.log(1 + ex(Vov / (2 * n * vt)));                // smooth weak->strong inversion (EKV-like)
  var mu = o.mu0 / (1 + 0.9 * Math.max(Vov, 0));                                // vertical-field mobility degradation
  var K = mu * o.Cox / (o.L * 1e-4) * 1e-4;                                     // A/V^2 per micron width (mu in cm2/Vs, Cox F/cm2, L cm, W=1e-4 cm)
  var Ec = o.sce ? 2 * 1e7 / mu : 1e9, Vdsat = Veff * Ec * L / (Veff + Ec * L), lam = o.lam;
  var Vde = Math.min(VDS, Vdsat);
  var I = K * (Veff * Vde - Vde * Vde / 2) / (1 + Vde / (Ec * L)) * (1 + lam * Math.max(VDS - Vdsat, 0));
  if (Vov < 0) I *= 1 - Math.exp(-VDS / vt);
  return { I: sign * I, Vdsat: Vdsat, Vov: Vov, VT: VT };
}
function inverter(Vin, VDD, nm, pm, Vout) {  // currents (A) into the output node: pMOS source current minus nMOS sink
  var In = mosId(Vin, Vout, nm).I, Ip = mosId(VDD - Vin, VDD - Vout, pm).I; return Ip - In;
}
function vout(Vin, VDD, nm, pm) {
  var lo = 0, hi = VDD, i, m;
  for (i = 0; i < 50; i++) { m = (lo + hi) / 2; if (inverter(Vin, VDD, nm, pm, m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

var PHYS = { Q: Q, KB: KB, ESI: ESI, EOX: EOX, SI: SI, Eg: Eg, NC: NC, NV: NV, ni: ni, mobility: mobility, carriers: carriers, pnDep: pnDep, poisson: poisson,
  Vbreak: Vbreak, diodeParams: diodeParams, diodeI: diodeI, solveDiode: solveDiode, cellJ: cellJ, cellStats: cellStats, bjtI: bjtI, bjtVBE: bjtVBE, bjtOp: bjtOp,
  mosParams: mosParams, mosSurface: mosSurface, mosId: mosId, vout: vout, inverter: inverter };

/* ================= drawing helpers ================= */
var C = { bg: '#070b16', card: 'rgba(255,255,255,.035)', line: 'rgba(255,255,255,.14)', grid: 'rgba(255,255,255,.07)', text: '#e8ecf5', dim: '#98a2b8',
  acc: '#6ee7ff', gold: '#ffd166', hole: '#ff8fa3', green: '#7ee787', purple: '#b69cff', orange: '#ffa657', blue: '#5b8dff' };
var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }
function sci(x, d) { if (!isFinite(x) || x === 0) return '0'; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); if (+m.toFixed(d == null ? 1 : d) >= 10) { m /= 10; e++; } return m.toFixed(d == null ? 1 : d) + '×10' + sup(e); }
function eng(x, u, d) {
  if (!isFinite(x)) return '—'; if (x === 0) return '0 ' + u; var e = Math.floor(Math.log10(Math.abs(x)) / 3); e = clamp(e, -5, 3);
  var pr = ['f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G'], v = x / Math.pow(10, 3 * e); return (+v.toPrecision(d || 3)) + ' ' + pr[e + 5] + u;
}
function txt(g, s, x, y, o) {
  o = o || {}; g.font = (o.w || 400) + ' ' + (o.s || 11) + 'px ' + (o.f || 'Inter,system-ui,sans-serif'); g.fillStyle = o.c || C.text; g.textAlign = o.a || 'left'; g.textBaseline = o.b || 'alphabetic';
  if (o.rot) { g.save(); g.translate(x, y); g.rotate(o.rot); g.fillText(s, 0, 0); g.restore(); } else g.fillText(s, x, y);
}
function wrap(g, s, x, y, w, lh, o) { var words = s.split(' '), line = '', yy = y; words.forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > w && line) { txt(g, line, x, yy, o); yy += lh; line = wd; } else line = t; }); txt(g, line, x, yy, o); return yy + lh; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function card(g, r, title) {
  rr(g, r.x, r.y, r.w, r.h, 10); g.fillStyle = C.card; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1; g.stroke();
  if (title) txt(g, title, r.x + 10, r.y + 16, { s: 11.5, w: 600, c: C.acc, f: "'Space Grotesk',Inter,sans-serif" });
}
function lay(w, h, nc, nr, spans, pad, gap) {   // grid layout -> array of rects; spans: [[c,r,cs,rs],...] (or null = full grid cells)
  pad = pad == null ? 10 : pad; gap = gap == null ? 8 : gap; var cw = (w - 2 * pad - gap * (nc - 1)) / nc, ch = (h - 2 * pad - gap * (nr - 1)) / nr, out = [], i, j;
  if (!spans) { spans = []; for (j = 0; j < nr; j++) for (i = 0; i < nc; i++) spans.push([i, j, 1, 1]); }
  return spans.map(function (s) { return { x: pad + s[0] * (cw + gap), y: pad + s[1] * (ch + gap), w: s[2] * cw + (s[2] - 1) * gap, h: s[3] * ch + (s[3] - 1) * gap }; });
}
function niceTicks(a, b, n) {
  var span = b - a, st = Math.pow(10, Math.floor(Math.log10(span / n))), m = span / n / st; st *= m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1;
  var t = [], v = Math.ceil(a / st - 1e-9) * st; for (; v <= b + st * 1e-6; v += st) t.push(+v.toPrecision(10)); return t;
}
function fmtTick(v) { var a = Math.abs(v); if (a === 0) return '0'; if (a >= 1e5 || a < 1e-3) return sci(v, 0); return +v.toPrecision(4) + ''; }
/* axes + grid; returns mapping object. o: xmin,xmax,ymin,ymax,xlog,ylog,xl,yl,xt,yt (tick arrays), fx, fy (formatters), noxl */
function plot(g, r, o) {
  var L = o.pl == null ? 44 : o.pl, B = o.pb == null ? 28 : o.pb, T = o.pt == null ? 24 : o.pt, R = o.pr == null ? 12 : o.pr;
  var P = { x: r.x + L, y: r.y + T, w: r.w - L - R, h: r.h - T - B, o: o };
  var fx = o.xlog ? Math.log10 : function (v) { return v; }, fy = o.ylog ? Math.log10 : function (v) { return v; };
  var x0 = fx(o.xmin), x1 = fx(o.xmax), y0 = fy(o.ymin), y1 = fy(o.ymax);
  P.X = function (v) { return P.x + (fx(v) - x0) / (x1 - x0) * P.w; }; P.Y = function (v) { return P.y + P.h - (fy(v) - y0) / (y1 - y0) * P.h; };
  P.iX = function (px) { var u = x0 + (px - P.x) / P.w * (x1 - x0); return o.xlog ? Math.pow(10, u) : u; };
  var xt = o.xt || (o.xlog ? decades(o.xmin, o.xmax) : niceTicks(o.xmin, o.xmax, Math.max(2, Math.floor(P.w / 70)))), yt = o.yt || (o.ylog ? decades(o.ymin, o.ymax) : niceTicks(o.ymin, o.ymax, Math.max(2, Math.floor(P.h / 38))));
  g.save(); g.lineWidth = 1; g.strokeStyle = C.grid; g.beginPath();
  xt.forEach(function (v) { var X = Math.round(P.X(v)) + .5; if (X >= P.x - 1 && X <= P.x + P.w + 1) { g.moveTo(X, P.y); g.lineTo(X, P.y + P.h); } });
  yt.forEach(function (v) { var Y = Math.round(P.Y(v)) + .5; if (Y >= P.y - 1 && Y <= P.y + P.h + 1) { g.moveTo(P.x, Y); g.lineTo(P.x + P.w, Y); } }); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.strokeRect(P.x + .5, P.y + .5, P.w, P.h);
  if (!o.xlog && o.xmin < 0 && o.xmax > 0 && !o.nozero) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(P.X(0), P.y); g.lineTo(P.X(0), P.y + P.h); g.stroke(); }
  if (!o.ylog && o.ymin < 0 && o.ymax > 0 && !o.nozero) { g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(P.x, P.Y(0)); g.lineTo(P.x + P.w, P.Y(0)); g.stroke(); }
  var fxF = o.fx || (o.xlog ? function (v) { return '10' + sup(Math.round(Math.log10(v))); } : fmtTick), fyF = o.fy || (o.ylog ? function (v) { return '10' + sup(Math.round(Math.log10(v))); } : fmtTick);
  xt.forEach(function (v) { var X = P.X(v); if (X >= P.x - 2 && X <= P.x + P.w + 2) txt(g, fxF(v), X, P.y + P.h + 12, { a: 'center', s: 9.5, c: C.dim }); });
  yt.forEach(function (v) { var Y = P.Y(v); if (Y >= P.y - 2 && Y <= P.y + P.h + 2) txt(g, fyF(v), P.x - 5, Y + 3, { a: 'right', s: 9.5, c: C.dim }); });
  if (o.xl) txt(g, o.xl, P.x + P.w / 2, r.y + r.h - 4, { a: 'center', s: 10, c: C.dim });
  if (o.yl) txt(g, o.yl, r.x + 11, P.y + P.h / 2, { a: 'center', s: 10, c: C.dim, rot: -Math.PI / 2 });
  g.restore(); return P;
}
function decades(a, b) { var t = [], e0 = Math.ceil(Math.log10(a) - 1e-9), e1 = Math.floor(Math.log10(b) + 1e-9), st = Math.max(1, Math.round((e1 - e0) / 6)); for (var e = e0; e <= e1; e += st) t.push(Math.pow(10, e)); return t; }
function clip(g, P) { g.save(); g.beginPath(); g.rect(P.x, P.y, P.w, P.h); g.clip(); }
function curve(g, P, f, col, w, dash, a, b, N) {   // f(x)->y ; clipped; skips non-finite
  a = a == null ? P.o.xmin : a; b = b == null ? P.o.xmax : b; N = N || Math.max(60, Math.floor(P.w)); clip(g, P);
  g.beginPath(); g.strokeStyle = col; g.lineWidth = w || 1.8; g.setLineDash(dash || []); g.lineJoin = 'round'; var pen = false, i;
  for (i = 0; i <= N; i++) { var x = P.o.xlog ? a * Math.pow(b / a, i / N) : a + (b - a) * i / N, y = f(x); if (!isFinite(y) || (P.o.ylog && y <= 0)) { pen = false; continue; } var X = P.X(x), Y = P.Y(y); if (pen) g.lineTo(X, Y); else { g.moveTo(X, Y); pen = true; } }
  g.stroke(); g.restore();
}
function poly(g, P, xs, ys, col, w, dash) { clip(g, P); g.beginPath(); g.strokeStyle = col; g.lineWidth = w || 1.8; g.setLineDash(dash || []); g.lineJoin = 'round'; for (var i = 0; i < xs.length; i++) { var X = P.X(xs[i]), Y = P.Y(ys[i]); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); } g.stroke(); g.restore(); }
function dot(g, x, y, col, r, ring) { g.beginPath(); g.arc(x, y, r || 4, 0, 6.2832); g.fillStyle = col; g.fill(); if (ring) { g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); } }
function line(g, x0, y0, x1, y1, col, w, dash) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = w || 1; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); }
function arrow(g, x0, y0, x1, y1, col, w) {
  var a = Math.atan2(y1 - y0, x1 - x0), s = 5 + (w || 1.5); line(g, x0, y0, x1, y1, col, w || 1.5);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - s * Math.cos(a - .45), y1 - s * Math.sin(a - .45)); g.lineTo(x1 - s * Math.cos(a + .45), y1 - s * Math.sin(a + .45)); g.closePath(); g.fillStyle = col; g.fill();
}
function legend(g, x, y, items, o) { o = o || {}; items.forEach(function (it, i) { var yy = y + i * 13; if (it[2]) { g.fillStyle = it[1]; g.fillRect(x, yy - 7, 12, 3); } else line(g, x, yy - 5, x + 12, yy - 5, it[1], 2, it[3]); txt(g, it[0], x + 17, yy - 1, { s: 9.5, c: C.dim }); }); }
function dotLegend(g, x, y, items) { var xx = x; items.forEach(function (it) { dot(g, xx + 4, y - 3, it[0], 3.5); txt(g, it[1], xx + 12, y, { s: 9.5, c: C.dim }); xx += 20 + g.measureText(it[1]).width; }); }
function placeLabels(g, items, x, a) { items.sort(function (p, q) { return p[0] - q[0]; }); var last = -99; items.forEach(function (it) { var y = it[0] + 3; if (y - last < 12) y = last + 12; last = y; txt(g, it[1], x, y, { a: a, s: 10, c: it[2], w: 600 }); }); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function rgba(c, a) { var n = parseInt(c.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
function wl2rgb(w) {   // visible wavelength (nm) -> [r,g,b] 0..255 (Bruton), with intensity roll-off at the edges
  var r = 0, g = 0, b = 0;
  if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; }
  else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else if (w <= 780) r = 1;
  var f = w < 380 || w > 780 ? 0 : w < 420 ? .3 + .7 * (w - 380) / 40 : w > 700 ? .3 + .7 * (780 - w) / 80 : 1;
  return [Math.round(255 * Math.pow(r * f, .8)), Math.round(255 * Math.pow(g * f, .8)), Math.round(255 * Math.pow(b * f, .8))];
}
var memoC = {};
function memo(key, fn) { if (memoC[key] === undefined) { var ks = Object.keys(memoC); if (ks.length > 400) memoC = {}; memoC[key] = fn(); } return memoC[key]; }
function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* ================= TAB 1: Crystal & bands ================= */
var LAT = (function () {
  var base = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0], [.25, .25, .25], [.75, .75, .25], [.75, .25, .75], [.25, .75, .75]], pts = [], bonds = [], i, j, a, b, c;
  base.forEach(function (p) { for (a = 0; a < 2; a++) for (b = 0; b < 2; b++) for (c = 0; c < 2; c++) { var q = [p[0] + a, p[1] + b, p[2] + c]; if (q.every(function (v) { return v <= 1.0001; }) && !pts.some(function (o) { return Math.abs(o[0] - q[0]) + Math.abs(o[1] - q[1]) + Math.abs(o[2] - q[2]) < 1e-6; })) pts.push(q); } });
  for (i = 0; i < pts.length; i++) for (j = i + 1; j < pts.length; j++) { var d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]); if (Math.abs(d - Math.sqrt(3) / 4) < 0.01) bonds.push([i, j]); }
  return { pts: pts, bonds: bonds };
})();
function bandE(r, c) { var w = 2.4 * Math.exp(-(r - 2.35) / 1.1), D = 0.56 * Math.exp(-(r - 2.35) / 0.9), h = 2 + w * c, s = Math.sqrt(h * h + D * D); return [-3 - s, -3 + s]; }
function bandEdges(r) { var lo = 1e9, hi = -1e9, vlo = 1e9, vhi = -1e9, k; for (k = 0; k <= 40; k++) { var e = bandE(r, Math.cos(Math.PI * k / 40)); vlo = Math.min(vlo, e[0]); vhi = Math.max(vhi, e[0]); lo = Math.min(lo, e[1]); hi = Math.max(hi, e[1]); } return { vlo: vlo, vhi: vhi, clo: lo, chi: hi, gap: lo - vhi }; }

var TAB_BANDS = {
  id: 'bands', name: 'Crystal & bands',
  def: { r: 2.35, T: 300, probe: 0.2 },
  ctl: [
    { k: 'r', l: 'Atom spacing (Å)', min: 1.6, max: 6, step: 0.05, f: function (v) { return v.toFixed(2) + ' Å' + (Math.abs(v - 2.35) < 0.06 ? '  (Si bond)' : ''); } },
    { k: 'T', l: 'Temperature', min: 20, max: 1500, step: 10, f: function (v) { return v + ' K'; } },
    { k: 'probe', l: 'Probe energy E − E_F', min: -0.6, max: 0.6, step: 0.01, f: function (v) { return v.toFixed(2) + ' eV'; } }],
  cap: 'Isolated atoms have sharp energy levels. Bring N atoms together and each level splits into N closely spaced levels that merge into a band; in silicon the s and p bands overlap, hybridise and re-open a gap (about 1.1 eV) at the bond length. Metals have a partly filled band, semiconductors and insulators a full valence band below an empty conduction band (small vs. large gap). The Fermi–Dirac curve shows how thermal energy smears the occupation around E_F.',
  eq: 'Diamond lattice: a = 5.43 Å, bond = a√3/4 = 2.35 Å, 4 bonds/atom<br>Fermi–Dirac: f(E) = 1 / (1 + e<sup>(E−E<sub>F</sub>)/kT</sup>) &nbsp; kT = 25.85 meV at 300 K<br>Thermal electrons: n ∝ e<sup>−E<sub>g</sub>/2kT</sup> &nbsp; (n<sub>i</sub> = 1.0×10¹⁰ cm⁻³ in Si at 300 K)<br>Band model here: E<sub>±</sub> = ½(E<sub>s</sub>+E<sub>p</sub>) ± √(h² + Δ²), h = ½(E<sub>p</sub>−E<sub>s</sub>) + w(r)cos k',
  read: function (s) { var e = bandEdges(s.r), kT = KB * s.T; return [['Toy gap at this spacing', e.gap.toFixed(2) + ' eV'], ['kT', (kT * 1000).toFixed(1) + ' meV'], ['f(E_F + probe)', sci(1 / (1 + ex(s.probe / kT)), 2)], ['Si gap (T)', Eg(s.T).toFixed(3) + ' eV'], ['n_i(T)', sci(ni(s.T), 2) + ' cm⁻³']]; },
  draw: function (g, w, h, s, t) {
    var R = lay(w, h, 2, 2), kT = KB * s.T, i, A = R[0];
    /* A: rotating diamond lattice */
    card(g, A, 'Silicon diamond-cubic lattice (unit cell)'); var cx = A.x + A.w * 0.5, cy = A.y + A.h * 0.54, sc = Math.min(A.w * 0.46, A.h * 0.5), ang = t * 0.5, tl = 0.45;
    var proj = function (p) { var x = p[0] - .5, y = p[1] - .5, z = p[2] - .5, x1 = x * Math.cos(ang) + z * Math.sin(ang), z1 = -x * Math.sin(ang) + z * Math.cos(ang), y1 = y * Math.cos(tl) - z1 * Math.sin(tl), z2 = y * Math.sin(tl) + z1 * Math.cos(tl); return [cx + x1 * sc, cy + y1 * sc, z2, p[0] * 4 % 2 !== 0 ? 2 : 1]; };
    var P = LAT.pts.map(proj), cc = [], a_, b_, c_; for (a_ = 0; a_ < 2; a_++) for (b_ = 0; b_ < 2; b_++) for (c_ = 0; c_ < 2; c_++) cc.push(proj([a_, b_, c_]));
    for (a_ = 0; a_ < 8; a_++) for (b_ = a_ + 1; b_ < 8; b_++) { var df = (a_ ^ b_); if (df === 1 || df === 2 || df === 4) line(g, cc[a_][0], cc[a_][1], cc[b_][0], cc[b_][1], 'rgba(255,255,255,.13)', 1, [3, 3]); }
    g.lineCap = 'round'; LAT.bonds.forEach(function (b) { var p = P[b[0]], q = P[b[1]]; line(g, p[0], p[1], q[0], q[1], 'rgba(150,170,210,' + (0.35 + 0.25 * (p[2] + q[2])) + ')', 2.2); });
    P.map(function (p, i) { return i; }).sort(function (a, b) { return P[a][2] - P[b][2]; }).forEach(function (i) { var p = P[i], r = 5 + 2.2 * (p[2] + .5), inner = p[3] === 2; dot(g, p[0], p[1], inner ? C.gold : C.acc, r); });
    txt(g, 'a = 5.43 Å · bond 2.35 Å · 4 covalent bonds per atom', A.x + A.w / 2, A.y + A.h - 8, { a: 'center', s: 10, c: C.dim });
    dotLegend(g, A.x + 10, A.y + 31, [[C.acc, 'corner / face atoms'], [C.gold, 'interior atoms']]);
    /* B: band formation */
    var B = R[1]; card(g, B, 'Energy levels broaden into bands as atoms approach');
    var Pl = plot(g, B, { xmin: 6, xmax: 1.5, ymin: -8.2, ymax: 2.4, xt: [6, 5, 4, 3, 2], xl: 'interatomic spacing r (Å)  →  atoms approach', yl: 'energy (eV, toy scale)', fx: function (v) { return v; } });
    var N = 8, k, edV = [], edC = [];
    for (var rr0 = 6; rr0 >= 1.5; rr0 -= 0.06) { var e = bandEdges(rr0); edV.push([rr0, e.vlo, e.vhi]); edC.push([rr0, e.clo, e.chi]); }
    clip(g, Pl); [[edV, 'rgba(126,231,135,.18)'], [edC, 'rgba(110,231,255,.16)']].forEach(function (z) { g.beginPath(); z[0].forEach(function (p, i) { var X = Pl.X(p[0]), Y = Pl.Y(p[2]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); for (i = z[0].length - 1; i >= 0; i--) g.lineTo(Pl.X(z[0][i][0]), Pl.Y(z[0][i][1])); g.closePath(); g.fillStyle = z[1]; g.fill(); }); g.restore();
    for (k = 0; k < N; k++) { var c = Math.cos(Math.PI * (k + .5) / N); curve(g, Pl, function (r) { return bandE(r, c)[0]; }, 'rgba(126,231,135,.75)', 1.1, null, 6, 1.5, 120); curve(g, Pl, function (r) { return bandE(r, c)[1]; }, 'rgba(110,231,255,.75)', 1.1, null, 6, 1.5, 120); }
    line(g, Pl.X(2.35), Pl.y, Pl.X(2.35), Pl.y + Pl.h, C.gold, 1, [4, 4]); txt(g, 'Si bond length', Pl.X(2.35) + 4, Pl.y + 11, { s: 9.5, c: C.gold });
    line(g, Pl.X(s.r), Pl.y, Pl.X(s.r), Pl.y + Pl.h, '#fff', 1.2); var cur = bandEdges(s.r);
    for (k = 0; k < N; k++) { var cc = Math.cos(Math.PI * (k + .5) / N), ee = bandE(s.r, cc); dot(g, Pl.X(s.r), Pl.Y(ee[0]), C.green, 2.6); dot(g, Pl.X(s.r), Pl.Y(ee[1]), C.acc, 2.6); }
    txt(g, 'conduction (p-like) levels', Pl.x + 6, Pl.Y(1.6), { s: 9.5, c: C.acc }); txt(g, 'valence (s/p-hybrid) levels', Pl.x + 6, Pl.Y(-7.5), { s: 9.5, c: C.green });
    if (cur.gap > 0.02) { var ym = (cur.vhi + cur.clo) / 2; arrow(g, Pl.X(s.r) + 14, Pl.Y(ym) + 10, Pl.X(s.r) + 14, Pl.Y(cur.vhi), '#fff', 1); arrow(g, Pl.X(s.r) + 14, Pl.Y(ym) - 10, Pl.X(s.r) + 14, Pl.Y(cur.clo), '#fff', 1); txt(g, 'gap ' + cur.gap.toFixed(2) + ' eV', Pl.X(s.r) + 20, Pl.Y(ym) + 3, { s: 10, w: 600 }); }
    /* C: metal / semiconductor / insulator */
    var Cc = R[2]; card(g, Cc, 'Metal vs semiconductor vs insulator'); var cw = (Cc.w - 20) / 3, top = Cc.y + 34, H = Cc.h - 64, k0 = 0.055 * H, bh = 0.2 * H;
    var kinds = [{ n: 'Metal', gap: 0 }, { n: 'Semiconductor (Si)', gap: Eg(s.T) }, { n: 'Insulator (SiO₂)', gap: 9 }];
    kinds.forEach(function (K, ci) {
      var x0 = Cc.x + 10 + ci * cw + 8, bw = cw - 16, gh = K.gap * k0, y0 = top + (H - (2 * bh + gh)) / 2, yc = y0, yv = y0 + bh + gh;
      if (ci === 0) { var tot = 2 * bh * 0.9, y1 = top + H / 2 - tot / 2; g.fillStyle = 'rgba(110,231,255,.2)'; g.fillRect(x0, y1, bw, tot); g.fillStyle = 'rgba(126,231,135,.35)'; g.fillRect(x0, y1 + tot / 2, bw, tot / 2); line(g, x0 - 4, y1 + tot / 2, x0 + bw + 4, y1 + tot / 2, C.gold, 1.5, [5, 3]); txt(g, 'E_F', x0 + bw / 2, y1 + tot / 2 - 4, { a: 'center', s: 9.5, c: C.gold }); txt(g, 'half-filled band', x0 + bw / 2, y1 - 6, { a: 'center', s: 9.5, c: C.dim }); txt(g, 'empty states right at E_F', x0 + bw / 2, y1 + tot + 12, { a: 'center', s: 9, c: C.dim }); }
      else {
        g.fillStyle = 'rgba(110,231,255,.2)'; g.fillRect(x0, yc, bw, bh); g.fillStyle = 'rgba(126,231,135,.35)'; g.fillRect(x0, yv, bw, bh);
        txt(g, 'CB', x0 + 5, yc + 12, { s: 9.5, c: C.acc }); txt(g, 'VB (full)', x0 + 5, yv + bh - 5, { s: 9.5, c: C.green });
        line(g, x0 - 4, yc + bh + gh / 2, x0 + bw + 4, yc + bh + gh / 2, C.gold, 1.2, [5, 3]); txt(g, 'E_F', x0 + bw - 2, yc + bh + gh / 2 - 3, { a: 'right', s: 9.5, c: C.gold });
        arrow(g, x0 + bw / 2, yc + bh + 3, x0 + bw / 2, yc + bh + gh - 3, 'rgba(255,255,255,.7)', 1); txt(g, 'E_g = ' + (K.gap).toFixed(K.gap > 5 ? 0 : 2) + ' eV', ci === 1 ? x0 + bw / 2 - 6 : x0 + bw / 2 + 6, yc + bh + gh / 2 - 5, { a: ci === 1 ? 'right' : 'left', s: 9.5, w: 600 });
        if (ci === 1) { var nd = clamp(Math.round((Math.log10(ni(s.T)) - 5) * 2), 0, 36); for (i = 0; i < nd; i++) dot(g, x0 + 8 + rnd(i * 3 + 1) * (bw - 16), yc + 6 + rnd(i * 5 + 2) * (bh - 12) + Math.sin(t * 2 + i) * 1.5, C.acc, 2.2); txt(g, 'n_i = ' + sci(ni(s.T), 1) + ' cm⁻³', x0 + bw / 2, yv + bh + 14, { a: 'center', s: 9.5, c: C.dim }); txt(g, '(dots exaggerated)', x0 + bw / 2, yv + bh + 26, { a: 'center', s: 9, c: C.dim }); }
        if (ci === 2) txt(g, 'no thermal carriers', x0 + bw / 2, yv + bh + 14, { a: 'center', s: 9.5, c: C.dim });
      }
      txt(g, K.n, x0 + bw / 2, Cc.y + Cc.h - 8, { a: 'center', s: 10.5, w: 600 });
    });
    /* D: Fermi–Dirac */
    var D = R[3]; card(g, D, 'Fermi–Dirac occupancy f(E) at T = ' + s.T + ' K');
    var Pd = plot(g, D, { xmin: -0.6, xmax: 0.6, ymin: 0, ymax: 1.05, xt: [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6], yt: [0, 0.25, 0.5, 0.75, 1], xl: 'E − E_F (eV)', yl: 'occupation probability f' });
    var fd = function (T) { return function (E) { return 1 / (1 + ex(E / (KB * T))); }; };
    clip(g, Pd); g.beginPath(); for (i = 0; i <= 200; i++) { var E = -0.6 + 1.2 * i / 200; var X = Pd.X(E), Y = Pd.Y(fd(s.T)(E)); i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.lineTo(Pd.X(0.6), Pd.Y(0)); g.lineTo(Pd.X(-0.6), Pd.Y(0)); g.fillStyle = 'rgba(255,209,102,.12)'; g.fill(); g.restore();
    poly(g, Pd, [-0.6, 0, 0, 0.6], [1, 1, 0, 0], 'rgba(255,255,255,.55)', 1.3, [5, 4]); curve(g, Pd, fd(300), 'rgba(110,231,255,.7)', 1.3, [2, 3], -0.6, 0.6, 200); curve(g, Pd, fd(s.T), C.gold, 2.2, null, -0.6, 0.6, 300);
    var fp = fd(s.T)(s.probe); line(g, Pd.X(s.probe), Pd.Y(0), Pd.X(s.probe), Pd.Y(fp), '#fff', 1, [3, 3]); dot(g, Pd.X(s.probe), Pd.Y(fp), '#fff', 4); txt(g, 'f = ' + (fp < 0.001 ? sci(fp, 1) : fp.toFixed(3)), Pd.X(s.probe) + (s.probe > 0.2 ? -8 : 8), Pd.Y(fp) - 8, { a: s.probe > 0.2 ? 'right' : 'left', s: 10, w: 600 });
    legend(g, Pd.x + Pd.w - 130, Pd.y + 16, [['T = ' + s.T + ' K', C.gold], ['T = 0 K step', 'rgba(255,255,255,.6)', 0, [5, 4]], ['300 K', 'rgba(110,231,255,.8)', 0, [2, 3]]]);
    txt(g, '10–90 % width ≈ 4.4 kT = ' + (4.4 * kT * 1000).toFixed(0) + ' meV', Pd.x + 8, Pd.y + Pd.h - 8, { s: 9.5, c: C.dim });
    txt(g, 'f at E_F + 0.56 eV (≈ E_c in Si) = ' + sci(1 / (1 + ex(0.56 / kT)), 1), Pd.x + 8, Pd.y + Pd.h - 22, { s: 9.5, c: C.dim });
  }
};

/* ================= TAB 2: Doping & carriers ================= */
function logfmt(v) { return sci(Math.pow(10, v), 1) + ' cm⁻³'; }
var TAB_DOPING = {
  id: 'doping', name: 'Doping & carriers',
  def: { lND: 16, lNA: 8, T: 300, Ef: 0, grad: 0 },
  ctl: [
    { k: 'lND', l: 'Donors N_D (phosphorus)', min: 8, max: 19, step: 0.1, f: logfmt },
    { k: 'lNA', l: 'Acceptors N_A (boron)', min: 8, max: 19, step: 0.1, f: logfmt },
    { k: 'T', l: 'Temperature', min: 40, max: 1000, step: 5, f: function (v) { return v + ' K'; } },
    { k: 'Ef', l: 'Electric field E (drift)', min: -1000, max: 1000, step: 10, f: function (v) { return v + ' V/cm'; } },
    { k: 'grad', l: 'Majority gradient (diffusion)', min: 0, max: 2, step: 0.05, f: function (v) { return v === 0 ? 'none' : '×' + Math.round(Math.pow(10, v)) + ' over 10 µm'; } }],
  cap: 'Replace a silicon atom by phosphorus (5 valence electrons) and the extra electron sits 45 meV below the conduction band; boron (3 electrons) leaves a hole 45 meV above the valence band. At low T the dopants freeze out, at room temperature they are ionised so n ≈ N_D (extrinsic), at high T thermally generated pairs (n_i) take over. Applying a field makes carriers drift; a concentration gradient makes them diffuse. Both give current.',
  eq: 'Mass action: n·p = n<sub>i</sub>² &nbsp; (n<sub>i</sub> = 1.0×10¹⁰ cm⁻³, 300 K)<br>n = N<sub>C</sub>e<sup>−(E<sub>c</sub>−E<sub>F</sub>)/kT</sup>, p = N<sub>V</sub>e<sup>−(E<sub>F</sub>−E<sub>v</sub>)/kT</sup>; N<sub>C</sub>=2.86×10¹⁹, N<sub>V</sub>=2.28×10¹⁹<br>E<sub>F</sub> − E<sub>i</sub> = kT ln(n/n<sub>i</sub>)<br>Drift: J = q(nμ<sub>n</sub> + pμ<sub>p</sub>)E = σE &nbsp; Diffusion: J<sub>n</sub> = qD<sub>n</sub>dn/dx, D = μkT/q<br>μ = μ<sub>min</sub> + (μ<sub>max</sub>−μ<sub>min</sub>)/(1+(N/N<sub>ref</sub>)<sup>α</sup>) (Caughey–Thomas)',
  state: function (s) { var ND = Math.pow(10, s.lND), NA = Math.pow(10, s.lNA), c = carriers(ND, NA, s.T), Nt = ND + NA; c.ND = ND; c.NA = NA; c.mun = mobility(Nt, s.T, false); c.mup = mobility(Nt, s.T, true); c.sig = Q * (c.n * c.mun + c.p * c.mup); return c; },
  read: function (s) {
    var c = TAB_DOPING.state(s), typ = c.n > 1.5 * c.p ? 'n-type' : c.p > 1.5 * c.n ? 'p-type' : 'intrinsic-like', R = Math.pow(10, s.grad), L = 1e-3, maj = c.n >= c.p;
    var Jd = c.sig * s.Ef, Jf = s.grad > 0 ? Q * (maj ? c.mun : c.mup) * c.kT * (maj ? c.n : c.p) * Math.log(R) / L * (maj ? -1 : 1) : 0;
    return [['Type', typ], ['n', sci(c.n, 2) + ' cm⁻³'], ['p', sci(c.p, 2) + ' cm⁻³'], ['E_F − E_i', (c.EF - c.Ei).toFixed(3) + ' eV'], ['μn / μp', c.mun.toFixed(0) + ' / ' + c.mup.toFixed(0) + ' cm²/Vs'], ['σ', sci(c.sig, 2) + ' S/cm'], ['J drift', sci(Jd, 2) + ' A/cm²'], ['J diffusion', sci(Jf, 2) + ' A/cm²'], ['Dopants ionised', (100 * (c.ndp + c.nam) / (c.ND + c.NA)).toFixed(0) + ' %']];
  },
  draw: function (g, w, h, s, t, x) {
    var R = lay(w, h, 2, 2), c = TAB_DOPING.state(s), ND = c.ND, NA = c.NA, i;
    /* A: band schematic */
    var A = R[0]; card(g, A, 'Band picture with dopant levels'); var yb = A.y + 36, hh = A.h - 56, E0 = -0.35, E1 = c.eg + 0.35, Y = function (e) { return yb + hh - (e - E0) / (E1 - E0) * hh; }, bx = A.x + 20, bw = A.w - 150;
    g.fillStyle = 'rgba(110,231,255,.13)'; g.fillRect(bx, yb, bw, Y(c.Ec) - yb); g.fillStyle = 'rgba(126,231,135,.13)'; g.fillRect(bx, Y(0), bw, yb + hh - Y(0));
    var lv = [[c.Ec, 'E_c', C.acc, 1.6], [0, 'E_v', C.green, 1.6], [c.Ei, 'E_i', C.dim, 1, [4, 4]], [c.EF, 'E_F', C.gold, 2], [c.Ed, 'E_d (donor)', C.purple, 1, [2, 3]], [c.Ea, 'E_a (acceptor)', C.orange, 1, [2, 3]]];
    lv.forEach(function (l) { var yy = Y(l[0]); line(g, bx, yy, bx + bw, yy, l[2], l[3], l[4]); });
    var ly = [[c.Ec, 'E_c', C.acc], [c.Ed, 'E_d', C.purple], [c.Ei, 'E_i', C.dim], [c.EF, 'E_F', C.gold], [c.Ea, 'E_a', C.orange], [0, 'E_v', C.green]].sort(function (a, b) { return b[0] - a[0]; }), last = -99;
    ly.forEach(function (l) { var yy = Y(l[0]) + 3; if (yy - last < 11) yy = last + 11; last = yy; txt(g, l[1], bx + bw + 8, yy, { s: 10.5, c: l[2], w: 600 }); });
    var ne = clamp(Math.round((Math.log10(c.n) - 8) * 3.2), 0, 34), nh = clamp(Math.round((Math.log10(c.p) - 8) * 3.2), 0, 34);
    for (i = 0; i < ne; i++) dot(g, bx + 8 + rnd(i + 11) * (bw - 16), Y(c.Ec) - 6 - rnd(i + 77) * (Y(c.Ec) - yb - 12) * 0.6 + Math.sin(t * 2 + i) * 2, C.acc, 2.6);
    for (i = 0; i < nh; i++) dot(g, bx + 8 + rnd(i + 31) * (bw - 16), Y(0) + 6 + rnd(i + 97) * (yb + hh - Y(0) - 12) * 0.6 + Math.sin(t * 2 + i * 2) * 2, C.hole, 2.6);
    txt(g, 'electrons n', bx + 6, yb + 12, { s: 10, c: C.acc }); txt(g, 'holes p', bx + 6, yb + hh - 5, { s: 10, c: C.hole });
    txt(g, 'E_c − E_F = ' + (c.Ec - c.EF).toFixed(3) + ' eV   E_F − E_v = ' + c.EF.toFixed(3) + ' eV   E_g = ' + c.eg.toFixed(3) + ' eV', A.x + 10, A.y + A.h - 8, { s: 9.5, c: C.dim });
    /* B: carriers vs T */
    var B = R[1]; card(g, B, 'Carrier density vs temperature'); var Pb = plot(g, B, { xmin: 40, xmax: 1000, xlog: true, ymin: 1e2, ymax: 1e20, ylog: true, xt: [50, 100, 200, 300, 500, 1000], fx: function (v) { return v; }, xl: 'T (K)', yl: 'n, p (cm⁻³)', yt: [1e2, 1e5, 1e8, 1e11, 1e14, 1e17, 1e20] });
    var pk = memo('tvd' + s.lND + '_' + s.lNA, function () { var o = { T: [], n: [], p: [], ni: [] }; for (i = 0; i <= 90; i++) { var T = 40 * Math.pow(25, i / 90), cc = carriers(ND, NA, T); o.T.push(T); o.n.push(cc.n); o.p.push(cc.p); o.ni.push(ni(T)); } return o; });
    poly(g, Pb, pk.T, pk.ni, 'rgba(255,255,255,.4)', 1.2, [4, 4]); poly(g, Pb, pk.T, pk.n, C.acc, 2); poly(g, Pb, pk.T, pk.p, C.hole, 2);
    line(g, Pb.X(300), Pb.y, Pb.X(300), Pb.y + Pb.h, 'rgba(255,255,255,.18)', 1);
    dot(g, Pb.X(s.T), Pb.Y(clamp(c.n, 1e2, 1e20)), C.acc, 4.5, true); dot(g, Pb.X(s.T), Pb.Y(clamp(c.p, 1e2, 1e20)), C.hole, 4.5, true);
    legend(g, Pb.x + Pb.w - 112, Pb.y + Pb.h - 44, [['n (electrons)', C.acc], ['p (holes)', C.hole], ['n_i(T)', 'rgba(255,255,255,.5)', 0, [4, 4]]]);
    txt(g, 'freeze-out', Pb.X(45), Pb.y + 12, { s: 9.5, c: C.dim }); txt(g, 'extrinsic', Pb.X(160), Pb.y + 12, { s: 9.5, c: C.dim }); txt(g, 'intrinsic', Pb.X(700), Pb.y + 12, { s: 9.5, c: C.dim });
    /* C: carriers vs doping */
    var Cc = R[2]; card(g, Cc, 'n and p vs donor doping (at T = ' + s.T + ' K, N_A fixed)'); var Pc = plot(g, Cc, { xmin: 1e10, xmax: 1e19, xlog: true, ymin: 1e0, ymax: 1e20, ylog: true, xl: 'N_D (cm⁻³)', yl: 'n, p (cm⁻³)', yt: [1, 1e4, 1e8, 1e12, 1e16, 1e20], xt: [1e10, 1e12, 1e14, 1e16, 1e18] });
    var dk = memo('dv' + s.lNA + '_' + s.T, function () { var o = { x: [], n: [], p: [] }; for (var j = 0; j <= 50; j++) { var nd = Math.pow(10, 10 + 9 * j / 50), cc = carriers(nd, NA, s.T); o.x.push(nd); o.n.push(cc.n); o.p.push(cc.p); } return o; });
    poly(g, Pc, dk.x, dk.n, C.acc, 2); poly(g, Pc, dk.x, dk.p, C.hole, 2); curve(g, Pc, function () { return ni(s.T); }, 'rgba(255,255,255,.4)', 1.2, [4, 4]);
    line(g, Pc.X(ND), Pc.y, Pc.X(ND), Pc.y + Pc.h, 'rgba(255,255,255,.25)', 1, [3, 3]); dot(g, Pc.X(ND), Pc.Y(clamp(c.n, 1, 1e20)), C.acc, 4.5, true); dot(g, Pc.X(ND), Pc.Y(clamp(c.p, 1, 1e20)), C.hole, 4.5, true);
    txt(g, 'n_i = ' + sci(ni(s.T), 1), Pc.x + Pc.w - 6, Pc.Y(ni(s.T)) - 5, { a: 'right', s: 9.5, c: C.dim }); txt(g, 'p ≈ n_i²/n (minority)', Pc.x + 8, Pc.y + Pc.h - 10, { s: 9.5, c: C.hole });
    /* D: animation */
    var D = R[3]; card(g, D, 'Drift & diffusion (animated; not to scale)'); var bx2 = D.x + 26, by = D.y + 64, bw2 = D.w - 52, bh2 = D.h - 120;
    var Rg = Math.pow(10, s.grad), maj = c.n >= c.p; x.ps = x.ps || { e: [], h: [] }; var PS = x.ps;
    function samp() { if (s.grad === 0) return Math.random(); var u = Math.random(); return -Math.log(1 - u * (1 - 1 / Rg)) / Math.log(Rg); }
    while (PS.e.length < 90) PS.e.push({ x: samp(), y: Math.random() }); while (PS.h.length < 90) PS.h.push({ x: samp(), y: Math.random() });
    var dt = Math.min(0.05, x.dt || 0.016), spd = function (mu) { return 80 * mu * s.Ef / 1e6; }, vdE = -spd(c.mun), vdH = spd(c.mup);
    var vdif = function (mu) { return s.grad === 0 ? 0 : 80 * mu * c.kT * Math.log(Rg) / 1e-3 / 1e6; };
    var jit = 14 * Math.sqrt(s.T / 300);
    function step(arr, v, nvis, isMaj) { for (var i = 0; i < arr.length; i++) { var p = arr[i]; p.x += (v + (isMaj ? vdif(isMaj) : 0)) * dt / bw2 + (Math.random() - .5) * jit * dt * 2 / bw2; p.y += (Math.random() - .5) * jit * dt * 2 / bh2; if (p.y < 0 || p.y > 1) p.y = clamp(p.y, 0.02, 0.98); if (p.x > 1 || p.x < 0) { p.x = (p.x > 1 ? 0.02 : 0.98); if (isMaj && s.grad > 0) p.x = samp(); p.y = Math.random(); } } }
    step(PS.e, vdE, ne, maj ? c.mun : 0); step(PS.h, vdH, nh, !maj ? c.mup : 0);
    if (s.grad > 0) { var gr = g.createLinearGradient(bx2, 0, bx2 + bw2, 0); gr.addColorStop(0, rgba(maj ? C.acc : C.hole, 0.32)); gr.addColorStop(1, rgba(maj ? C.acc : C.hole, 0.02)); g.fillStyle = gr; } else g.fillStyle = 'rgba(255,255,255,.04)';
    g.fillRect(bx2, by, bw2, bh2); g.strokeStyle = C.line; g.strokeRect(bx2 + .5, by + .5, bw2, bh2);
    g.fillStyle = '#39465f'; g.fillRect(bx2 - 12, by, 12, bh2); g.fillRect(bx2 + bw2, by, 12, bh2);
    var ni1 = clamp(Math.round((s.lND - 10) * 2.2), 0, 22), ni2 = clamp(Math.round((s.lNA - 10) * 2.2), 0, 22);
    for (i = 0; i < ni1; i++) txt(g, '+', bx2 + 10 + (i % 11) * (bw2 - 20) / 10, by + 14 + Math.floor(i / 11) * (bh2 - 28), { s: 13, c: C.gold, a: 'center', w: 600 });
    for (i = 0; i < ni2; i++) txt(g, '–', bx2 + 10 + ((i + 5) % 11) * (bw2 - 20) / 10 + 8, by + 30 + Math.floor(i / 11) * (bh2 - 58), { s: 14, c: C.orange, a: 'center', w: 700 });
    for (i = 0; i < ne; i++) { var p = PS.e[i]; dot(g, bx2 + p.x * bw2, by + 4 + p.y * (bh2 - 8), C.acc, 3); }
    for (i = 0; i < nh; i++) { var p2 = PS.h[i]; dot(g, bx2 + p2.x * bw2, by + 4 + p2.y * (bh2 - 8), C.hole, 3); }
    if (s.Ef !== 0) { var dir = Math.sign(s.Ef), L2 = 20 + 60 * Math.abs(s.Ef) / 1000; arrow(g, D.x + D.w / 2 - dir * L2 / 2, by - 14, D.x + D.w / 2 + dir * L2 / 2, by - 14, C.gold, 2.2); txt(g, 'E = ' + s.Ef + ' V/cm', D.x + D.w / 2, by - 22, { a: 'center', s: 10, c: C.gold }); }
    if (s.grad > 0) { txt(g, 'concentration ×' + Math.round(Rg) + ' → low', bx2 + bw2 / 2, by + bh2 + 14, { a: 'center', s: 10, c: maj ? C.acc : C.hole }); arrow(g, bx2 + bw2 * 0.3, by + bh2 + 24, bx2 + bw2 * 0.7, by + bh2 + 24, '#fff', 1.2); }
    dotLegend(g, D.x + 10, D.y + D.h - 8, [[C.acc, 'electron'], [C.hole, 'hole']]); txt(g, '+ ionised donor   – ionised acceptor', D.x + 150, D.y + D.h - 8, { s: 9.5, c: C.dim });
    txt(g, 'σ = ' + sci(c.sig, 2) + ' S/cm   ρ = ' + sci(1 / c.sig, 2) + ' Ω·cm', D.x + D.w - 10, D.y + 16, { a: 'right', s: 10, c: C.gold });
  }
};

/* ================= TAB 3: PN junction ================= */
function pnState(s) {
  return memo('pn' + [s.lNA, s.lND, s.V, s.T, s.Rs, s.bd].join(), function () {
    var NA = Math.pow(10, s.lNA), ND = Math.pow(10, s.lND), dp = diodeParams(NA, ND, s.T, { Rs: s.Rs, bd: s.bd }), sol = solveDiode(s.V, dp), d = pnDep(NA, ND, sol.Vj, s.T);
    return { NA: NA, ND: ND, dp: dp, sol: sol, d: d };
  });
}
var TAB_PN = {
  id: 'pn', name: 'PN junction',
  def: { lNA: 16, lND: 16, V: 0, T: 300, Rs: 5, bd: false, num: false, logI: false },
  ctl: [
    { k: 'lNA', l: 'p-side acceptors N_A', min: 14, max: 19, step: 0.1, f: logfmt },
    { k: 'lND', l: 'n-side donors N_D', min: 14, max: 19, step: 0.1, f: logfmt },
    { k: 'V', l: 'Applied bias V (+ = forward)', min: -40, max: 0.9, step: 0.02, f: function (v) { return v.toFixed(2) + ' V'; } },
    { k: 'T', l: 'Temperature', min: 250, max: 450, step: 5, f: function (v) { return v + ' K'; } },
    { k: 'Rs', l: 'Series resistance R_s', min: 0, max: 200, step: 1, f: function (v) { return v + ' Ω'; } },
    { k: 'bd', l: 'Include reverse breakdown', t: 'c' }, { k: 'num', l: 'Overlay numeric 1-D Poisson solution', t: 'c' }, { k: 'logI', l: 'Log |I| axis for the I–V', t: 'c' }],
  cap: 'Electrons diffuse from n to p and holes the other way, leaving behind fixed ionised dopants: a depletion region with a built-in field that stops further diffusion. Forward bias lowers the barrier (V_bi − V) so many carriers cross and current rises exponentially; reverse bias widens the depletion region (smaller capacitance) and only a tiny leakage flows until breakdown. Solid curves = depletion approximation; the optional numeric solution solves Poisson’s equation exactly and rounds the edges.',
  eq: 'V<sub>bi</sub> = (kT/q) ln(N<sub>A</sub>N<sub>D</sub>/n<sub>i</sub>²) &nbsp; (n<sub>i</sub>=1.0×10¹⁰)<br>W = √[ 2ε<sub>s</sub>(V<sub>bi</sub>−V)/q · (1/N<sub>A</sub> + 1/N<sub>D</sub>) ], x<sub>n</sub> = W·N<sub>A</sub>/(N<sub>A</sub>+N<sub>D</sub>)<br>E<sub>max</sub> = qN<sub>D</sub>x<sub>n</sub>/ε<sub>s</sub> &nbsp; C<sub>j</sub> = ε<sub>s</sub>A/W<br>I = I<sub>s</sub>(e<sup>V<sub>j</sub>/kT</sup> − 1), V<sub>j</sub> = V − I·R<sub>s</sub><br>I<sub>s</sub> = Aqn<sub>i</sub>²(D<sub>p</sub>/L<sub>p</sub>N<sub>D</sub> + D<sub>n</sub>/L<sub>n</sub>N<sub>A</sub>), A = 10⁻⁴ cm², τ = 1 µs',
  read: function (s) {
    var S = pnState(s), d = S.d; return [['Built-in V_bi', d.Vbi.toFixed(3) + ' V'], ['Depletion W', (d.W * 1e4).toFixed(3) + ' µm'], ['x_p / x_n', (d.xp * 1e4).toFixed(3) + ' / ' + (d.xn * 1e4).toFixed(3) + ' µm'], ['E_max', sci(d.Emax, 2) + ' V/cm'], ['C_j (area 10⁻⁴ cm²)', (d.Cj * S.dp.A * 1e12).toFixed(2) + ' pF'], ['Junction V_j', S.sol.Vj.toFixed(3) + ' V'], ['Current I', eng(S.sol.I, 'A')], ['Sat. current I_s', sci(S.dp.Is, 2) + ' A'], ['Breakdown V_br', '−' + S.dp.Vbr.toFixed(1) + ' V' + (s.bd ? '' : ' (off)')]];
  },
  draw: function (g, w, h, s, t, x) {
    var S = pnState(s), d = S.d, R = lay(w, h, 3, 2), i, um = 1e4, xL = -(d.xp + 0.45 * d.W), xR = d.xn + 0.45 * d.W;
    var num = s.num ? memo('po' + [s.lNA, s.lND, s.V, s.T, S.sol.Vj.toFixed(4)].join(), function () { return poisson(S.NA, S.ND, S.sol.Vj, s.T, xL, xR, 360); }) : null;
    var xs = function (a) { return a.map(function (v) { return v * um; }); }, nx = num ? xs(num.x) : null;
    var xmin = xL * um, xmax = xR * um, ex_ = function (a) { return [xmin, -d.xp * um, -d.xp * um, 0, 0, d.xn * um, d.xn * um, xmax]; };
    function dep(bandfn) { return bandfn; }
    function shade(P) { g.fillStyle = 'rgba(255,209,102,.07)'; g.fillRect(P.X(-d.xp * um), P.y, P.X(d.xn * um) - P.X(-d.xp * um), P.h); }
    /* A: charge density */
    var A = R[0]; card(g, A, 'Space-charge density ρ(x)'); var rm = Q * Math.max(S.NA, S.ND) * 1.25;
    var Pa = plot(g, A, { xmin: xmin, xmax: xmax, ymin: -rm, ymax: rm, xl: 'x (µm)', yl: 'ρ (C/cm³)', pl: 54, fy: function (v) { return v === 0 ? '0' : sci(v, 1); }, yt: [-rm * 0.8, 0, rm * 0.8] }); shade(Pa);
    poly(g, Pa, [xmin, -d.xp * um, -d.xp * um, 0, 0, d.xn * um, d.xn * um, xmax], [0, 0, -Q * S.NA, -Q * S.NA, Q * S.ND, Q * S.ND, 0, 0], s.num ? 'rgba(255,209,102,.9)' : C.gold, 2, s.num ? [5, 3] : null);
    if (num) poly(g, Pa, nx, num.rho, C.acc, 1.8); txt(g, '−qN_A', Pa.X(-d.xp * um / 2), Pa.Y(-Q * S.NA) - 5, { a: 'center', s: 9.5, c: C.dim }); txt(g, '+qN_D', Pa.X(d.xn * um / 2), Pa.Y(Q * S.ND) + 12, { a: 'center', s: 9.5, c: C.dim });
    txt(g, 'p side', Pa.x + 6, Pa.y + 11, { s: 9.5, c: C.hole }); txt(g, 'n side', Pa.x + Pa.w - 6, Pa.y + 11, { a: 'right', s: 9.5, c: C.acc });
    /* B: field */
    var B = R[1]; card(g, B, 'Electric field E(x)'); var em = d.Emax * 1.25;
    var Pb = plot(g, B, { xmin: xmin, xmax: xmax, ymin: -em, ymax: em * 0.12, xl: 'x (µm)', yl: 'E (V/cm)', pl: 58, yt: [-d.Emax, -d.Emax / 2, 0], fy: function (v) { return v === 0 ? '0' : sci(v, 1); } }); shade(Pb);
    poly(g, Pb, [xmin, -d.xp * um, 0, d.xn * um, xmax], [0, 0, -d.Emax, 0, 0], s.num ? 'rgba(255,209,102,.9)' : C.gold, 2, s.num ? [5, 3] : null); if (num) poly(g, Pb, nx, num.E, C.acc, 1.8);
    txt(g, 'E_max = ' + sci(d.Emax, 2) + ' V/cm', Pb.x + Pb.w / 2, Pb.y + 14, { a: 'center', s: 10, c: C.gold }); txt(g, 'points n → p', Pb.x + Pb.w / 2, Pb.y + Pb.h - 8, { a: 'center', s: 9.5, c: C.dim });
    /* C: potential */
    var Cc = R[2]; card(g, Cc, 'Electrostatic potential ψ(x)'); var vb = d.Vb;
    var Pc = plot(g, Cc, { xmin: xmin, xmax: xmax, ymin: -0.05 * vb, ymax: 1.15 * vb, xl: 'x (µm)', yl: 'ψ − ψ_p (V)' }); shade(Pc);
    var psiA = function (xx) { xx /= um; var p = xx <= -d.xp ? 0 : xx < 0 ? Q * S.NA / (2 * ESI) * Math.pow(xx + d.xp, 2) : xx < d.xn ? d.Vb - Q * S.ND / (2 * ESI) * Math.pow(d.xn - xx, 2) : d.Vb; return p; };
    curve(g, Pc, psiA, s.num ? 'rgba(255,209,102,.9)' : C.gold, 2, s.num ? [5, 3] : null, xmin, xmax, 300); if (num) poly(g, Pc, nx, num.psi.map(function (v) { return v - num.pL; }), C.acc, 1.8);
    line(g, Pc.x, Pc.Y(vb), Pc.x + Pc.w, Pc.Y(vb), 'rgba(255,255,255,.3)', 1, [3, 3]); txt(g, 'V_bi − V = ' + d.Vb.toFixed(3) + ' V', Pc.x + 8, Pc.Y(vb) - 5, { s: 10, c: C.gold });
    /* D: band diagram */
    var Dd = R[3]; card(g, Dd, 'Band diagram'); var Lv = 0.6 * d.W, Egv = Eg(s.T), EcEi = KB * s.T * Math.log(NC(s.T) / d.ni), Vj = S.sol.Vj;
    var Ei = function (xx) { return -(psiA(xx * um) + (-KB * s.T * asinh(S.NA / (2 * d.ni)))); };   // Ei(x) = -psi, psi_p = -Vt asinh(NA/2ni)
    var EFn = function (xx) { return xx >= -d.xp ? Vj : Vj * Math.exp((xx + d.xp) / Lv); }, EFp = function (xx) { return xx <= d.xn ? 0 : Vj * (1 - Math.exp(-(xx - d.xn) / Lv)); };
    var EcF = function (xx) { return Ei(xx) + EcEi; }, EvF = function (xx) { return Ei(xx) + EcEi - Egv; };
    var lo = Math.min(EvF(xR), EFn(xR), -0.2) - 0.3 - (Vj < 0 ? 0 : 0), hi = Math.max(EcF(xL), Vj + 0.5, 0.6) + 0.3;
    var Pd = plot(g, Dd, { xmin: xL, xmax: xR, ymin: lo, ymax: hi, xl: 'x', yl: 'electron energy (eV)', xt: [], nozero: true, yt: niceTicks(lo, hi, 4) }); Pd.X = function (v) { return Pd.x + (v - xL) / (xR - xL) * Pd.w; };
    g.fillStyle = 'rgba(255,209,102,.07)'; g.fillRect(Pd.X(-d.xp), Pd.y, Pd.X(d.xn) - Pd.X(-d.xp), Pd.h);
    var fx = function (f) { return function (v) { return f(v); }; };
    function cv(f, col, wd, dash) { curve(g, Pd, function (xx) { return f(xx); }, col, wd, dash, xL, xR, 300); }
    cv(EcF, C.acc, 2); cv(EvF, C.green, 2); cv(function (xx) { return Ei(xx); }, 'rgba(255,255,255,.35)', 1, [4, 4]); cv(EFn, C.gold, 1.6, [6, 3]); cv(EFp, C.hole, 1.6, [6, 3]);
    var splitF = Math.abs(Vj) > 0.02, ll = [[Pd.Y(EcF(xL)) - 6, 'E_c', C.acc], [Pd.Y(EvF(xL)) + 6, 'E_v', C.green]]; if (splitF) ll.push([Pd.Y(EFp(xL)) - 4, 'E_Fp', C.hole]); else ll.push([Pd.Y(EFp(xL)) - 4, 'E_F', C.gold]);
    placeLabels(g, ll, Pd.x + 4, 'left'); if (splitF) placeLabels(g, [[Pd.Y(EFn(xR)) - 6, 'E_Fn', C.gold], [Pd.Y(EcF(xR)) - 6, 'E_c', C.acc], [Pd.Y(EvF(xR)) + 6, 'E_v', C.green]], Pd.x + Pd.w - 4, 'right');
    var bh = Math.abs(EcF(xL) - EcF(xR)); txt(g, 'barrier q(V_bi−V) = ' + d.Vb.toFixed(2) + ' eV', Pd.x + Pd.w / 2, Pd.y + Pd.h - 6, { a: 'center', s: 9.5, c: C.dim });
    /* E: I-V */
    var Ei_ = R[4]; card(g, Ei_, 'I–V curve (Shockley + R_s' + (s.bd ? ' + breakdown' : '') + ')');
    var vmin = Math.min(-1.5, s.V * 1.08, s.bd ? -S.dp.Vbr * 1.12 : -1.5), vmax = 1.0, Imax = 0.02, IP;
    var curveI = memo('iv' + [s.lNA, s.lND, s.T, s.Rs, s.bd, vmin.toFixed(2)].join(), function () { var o = { v: [], i: [] }; for (var j = 0; j <= 160; j++) { var v = vmin + (vmax - vmin) * j / 160; o.v.push(v); o.i.push(solveDiode(v, S.dp).I); } return o; });
    if (s.logI) {
      IP = plot(g, Ei_, { xmin: vmin, xmax: vmax, ymin: 1e-14, ymax: 1, ylog: true, xl: 'V (V)', yl: '|I| (A)', yt: [1e-14, 1e-11, 1e-8, 1e-5, 1e-2] });
      var fi = [], fv = [], ri = [], rv = []; curveI.v.forEach(function (v, j) { (v >= 0 ? (fv.push(v), fi.push(curveI.i[j])) : (rv.push(v), ri.push(Math.abs(curveI.i[j])))); });
      poly(g, IP, fv, fi, C.gold, 2); poly(g, IP, rv, ri, C.hole, 2, [5, 3]); txt(g, 'forward', IP.X(0.62), IP.Y(1e-3) + 12, { s: 9.5, c: C.gold }); txt(g, 'reverse |I|', IP.x + 8, IP.Y(1e-12) - 5, { s: 9.5, c: C.hole });
      dot(g, IP.X(clamp(s.V, vmin, vmax)), IP.Y(clamp(Math.abs(S.sol.I), 1e-14, 1)), '#fff', 5, true);
    } else {
      IP = plot(g, Ei_, { xmin: vmin, xmax: vmax, ymin: s.bd ? -Imax * 0.5 : -Imax * 0.1, ymax: Imax, xl: 'V (V)', yl: 'I (mA)', fy: function (v) { return (v * 1e3).toFixed(v === 0 ? 0 : 0); } });
      poly(g, IP, curveI.v, curveI.i, C.gold, 2.2); dot(g, IP.X(clamp(s.V, vmin, vmax)), IP.Y(clamp(S.sol.I, -Imax, Imax)), '#fff', 5, true);
      if (S.sol.I > Imax) txt(g, 'I = ' + eng(S.sol.I, 'A') + ' (off scale)', IP.x + 8, IP.y + 14, { s: 10, c: '#fff' });
      txt(g, 'knee ≈ 0.6–0.7 V', IP.X(0.35), IP.Y(0.007), { a: 'center', s: 9.5, c: C.dim });
    }
    txt(g, 'operating point: V = ' + s.V.toFixed(2) + ' V, I = ' + eng(S.sol.I, 'A'), IP.x + IP.w - 6, IP.y + IP.h - 8, { a: 'right', s: 10, c: '#fff' });
    if (s.bd) line(g, IP.X(-S.dp.Vbr), IP.y, IP.X(-S.dp.Vbr), IP.y + IP.h, 'rgba(255,143,163,.6)', 1, [3, 3]);
    /* F: animation */
    var F = R[5]; card(g, F, 'Carriers crossing the junction'); var bx = F.x + 14, bwid = F.w - 28, by = F.y + 34, bhei = F.h - 70, frac = clamp(0.12 + 0.5 * Math.log10(d.W * um / 0.05) / 2.5, 0.12, 0.7);
    var xl = 0.5 - frac / 2, xr = 0.5 + frac / 2, I = S.sol.I, brk = s.bd && s.V < -S.dp.Vbr * 0.98;
    g.fillStyle = 'rgba(255,143,163,.08)'; g.fillRect(bx, by, bwid * xl, bhei); g.fillStyle = 'rgba(110,231,255,.08)'; g.fillRect(bx + bwid * xr, by, bwid * (1 - xr), bhei); g.fillStyle = 'rgba(255,209,102,.1)'; g.fillRect(bx + bwid * xl, by, bwid * frac, bhei);
    g.strokeStyle = C.line; g.strokeRect(bx + .5, by + .5, bwid, bhei);
    txt(g, 'p', bx + 8, by + 14, { s: 12, c: C.hole, w: 700 }); txt(g, 'n', bx + bwid - 8, by + 14, { a: 'right', s: 12, c: C.acc, w: 700 });
    for (i = 0; i < 6; i++) { txt(g, '–', bx + bwid * (xl + frac * 0.5 * (i + .5) / 6 * 1.0) , by + 22 + (i % 3) * bhei * 0.3, { s: 13, c: C.orange, a: 'center', w: 700 }); txt(g, '+', bx + bwid * (0.5 + frac * 0.5 * (i + .5) / 6), by + 22 + (i % 3) * bhei * 0.3, { s: 13, c: C.gold, a: 'center', w: 700 }); }
    var Ef = Math.min(1, 0.25 + 0.75 * clamp(d.Vb / 3, 0, 1)); if (frac > 0.12) { arrow(g, bx + bwid * xr - 6, by + bhei - 12, bx + bwid * xl + 6, by + bhei - 12, C.gold, 1 + 2 * Ef); txt(g, 'E', bx + bwid / 2, by + bhei - 17, { a: 'center', s: 10, c: C.gold }); }
    x.pt = x.pt || []; var dt = Math.min(0.05, x.dt || 0.016);
    var lvl = I > 1e-9 ? clamp((Math.log10(I) + 9) / 6, 0, 1) : 0, rate = (I > 1e-9 ? 4 + 44 * lvl : 1.2) * (brk ? 8 : 1);
    for (var kk = 0; kk < 2; kk++) if (Math.random() < rate * dt) {
      var hole = kk === 0;
      if (I > 1e-9 && !brk) x.pt.push({ x: hole ? 0.04 : 0.96, y: Math.random(), vx: (hole ? 1 : -1) * (0.22 + 0.2 * lvl), h: hole, life: 99 });
      else { var gx = xl + Math.random() * frac; x.pt.push({ x: gx, y: Math.random(), vx: (hole ? -1 : 1) * (brk ? 0.9 : 0.4), h: hole, life: 99, g: brk ? 1 : 0 }); }
    }
    for (i = x.pt.length - 1; i >= 0; i--) { var p = x.pt[i]; p.x += p.vx * dt; p.y += (Math.random() - .5) * 0.02;
      var dead = p.x < 0 || p.x > 1 || (I > 1e-9 && !brk && ((p.h && p.x > xr + 0.18 * Math.random() + 0.04 && Math.random() < 0.02) || (!p.h && p.x < xl - 0.04 && Math.random() < 0.02)));
      if (dead) { x.pt.splice(i, 1); continue; } dot(g, bx + p.x * bwid, by + 6 + clamp(p.y, 0, 1) * (bhei - 12), p.h ? C.hole : C.acc, p.g ? 3.4 : 3); }
    if (x.pt.length > 160) x.pt.splice(0, x.pt.length - 160);
    var nb = Math.round(clamp((s.lNA - 13.5) * 3, 3, 16)); for (i = 0; i < nb; i++) dot(g, bx + 6 + (0.02 + 0.9 * rnd(i + 3) * xl) * bwid * 0.999 + Math.sin(t * 2 + i) * 2, by + 30 + rnd(i + 40) * (bhei - 40), 'rgba(255,143,163,.55)', 2.4);
    nb = Math.round(clamp((s.lND - 13.5) * 3, 3, 16)); for (i = 0; i < nb; i++) dot(g, bx + bwid * xr + 6 + (0.9 * rnd(i + 13) * (1 - xr)) * bwid * 0.97 + Math.sin(t * 2 + i) * 2, by + 30 + rnd(i + 60) * (bhei - 40), 'rgba(110,231,255,.55)', 2.4);
    txt(g, brk ? 'breakdown: impact ionisation / tunnelling creates carriers' : I > 1e-9 ? 'forward: majority carriers diffuse across (low barrier)' : I < -1e-12 ? 'reverse: only a few thermally generated carriers are swept' : 'near equilibrium: diffusion = drift', F.x + F.w / 2, F.y + F.h - 8, { a: 'center', s: 10, c: C.dim });
    txt(g, 'W ≈ ' + (d.W * um).toFixed(2) + ' µm (drawn on a log scale)', F.x + F.w - 10, F.y + F.h - 22, { a: 'right', s: 9.5, c: C.dim });
  }
};

/* ================= TAB 4: Diodes in use (LED / solar cell / Zener) ================= */
var MATS = {
  GaAs: { n: 'GaAs', eg: function () { return 1.424; }, rng: [1.424, 1.424], eqe: 0.35, note: 'infrared LED / laser (≈ 870 nm)' },
  AlGaAs: { n: 'AlₓGa₁₋ₓAs', eg: function (x) { return 1.424 + 1.247 * x; }, xr: [0, 0.45, 0.35], rng: [1.424, 1.985], eqe: 0.3, note: 'red / IR LEDs (alloy gap grows with Al)' },
  AlGaInP: { n: '(AlₓGa₁₋ₓ)₀.₅In₀.₅P', eg: function (x) { return 1.91 + 0.61 * x; }, xr: [0, 0.53, 0.2], rng: [1.91, 2.23], eqe: 0.4, note: 'high-brightness red, orange, amber, yellow-green' },
  GaP: { n: 'GaP:N (indirect)', eg: function () { return 2.26; }, rng: [2.26, 2.26], eqe: 0.02, note: 'green via nitrogen traps; indirect gap, weak' },
  InGaN: { n: 'InₓGa₁₋ₓN', eg: function (x) { return 3.4 * (1 - x) + 0.7 * x - 1.4 * x * (1 - x); }, xr: [0, 0.6, 0.2], rng: [1.44, 3.4], eqe: 0.5, note: 'violet, blue, green: the Nobel-prize blue LED' },
  GaN: { n: 'GaN', eg: function () { return 3.4; }, rng: [3.4, 3.4], eqe: 0.4, note: 'near-UV (≈ 365 nm)' },
  Si: { n: 'Si (indirect)', eg: function () { return 1.12; }, rng: [1.12, 1.12], eqe: 1e-4, note: 'indirect gap: electron–hole pairs recombine as heat, not light' }
};
function ledEg(s) { var m = MATS[s.mat]; return m.eg(s.mx); }
function ledOp(s) { var Eg_ = ledEg(s), vt = 0.025852, Ik = 1e-3, Vk = Eg_ + 0.05, f = function (V) { return Ik * ex((V - Vk) / (2 * vt)); }, lo = 0, hi = s.Vs, i, m;
  for (i = 0; i < 60; i++) { m = (lo + hi) / 2; if (f(m) > (s.Vs - m) / s.R) hi = m; else lo = m; } var V = (lo + hi) / 2; return { V: V, I: f(V), f: f }; }
function cellParams(s) { return { Jph: 0.040 * s.suns, J0: 1e-12 * Math.pow(ni(s.Tc) / 1e10, 2), n: 1, Rs: s.Rsc, Rsh: Math.pow(10, s.lRsh), T: s.Tc }; }
function zenerI(V, s) {   // V = anode-cathode voltage; returns current (A) (negative in reverse breakdown)
  if (V >= 0) return 7e-11 * (ex(V / (1.5 * 0.025852)) - 1);
  var Vk = 0.04 + 0.4 * Math.exp(-(s.Vz - 2.7) / 1.8); return -(5e-3 * ex((-V - s.Vz) / Vk) + 1e-9);
}
function zenerOp(Vin, s) { var lo = 0, hi = Vin, i, m; for (i = 0; i < 60; i++) { m = (lo + hi) / 2; if (-zenerI(-m, s) + m / s.RL > (Vin - m) / s.Rz) hi = m; else lo = m; } var Vr = (lo + hi) / 2; return { Vr: Vr, Iz: -zenerI(-Vr, s), IR: (Vin - Vr) / s.Rz }; }
function wave(g, x0, y0, x1, y1, col, amp, ph) { var L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), n = Math.floor(L / 3); g.beginPath(); for (var i = 0; i <= n; i++) { var u = i / n * L, v = amp * Math.sin(u / 4 - ph); var X = x0 + u * Math.cos(a) - v * Math.sin(a), Y = y0 + u * Math.sin(a) + v * Math.cos(a); i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.strokeStyle = col; g.lineWidth = 2; g.stroke(); }
function resistor(g, x0, y0, x1, y1, col) { var L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), s = L * 0.2; g.save(); g.translate(x0, y0); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(s, 0); for (var i = 0; i < 6; i++) g.lineTo(s + (L - 2 * s) * (i + .5) / 6, i % 2 ? 5 : -5); g.lineTo(L - s, 0); g.lineTo(L, 0); g.strokeStyle = col || '#fff'; g.lineWidth = 1.6; g.stroke(); g.restore(); }

var TAB_DIODES = {
  id: 'diodes', name: 'Diodes in use',
  def: { mode: 'led', mat: 'AlGaInP', mx: 0.2, Vs: 3.3, R: 100, suns: 1, Tc: 300, Rsc: 0.5, lRsh: 3.5, Vz: 5.1, Vin: 12, Rz: 330, RL: 1000 },
  ctl: [
    { k: 'mode', l: 'Device', t: 's', o: [['led', 'LED'], ['solar', 'Photodiode / solar cell'], ['zener', 'Zener diode']] },
    { k: 'mat', l: 'Material', t: 's', o: Object.keys(MATS).map(function (k) { return [k, MATS[k].n]; }), show: function (s) { return s.mode === 'led'; } },
    { k: 'mx', l: 'Composition x', min: 0, max: 0.6, step: 0.01, f: function (v) { return v.toFixed(2); }, show: function (s) { return s.mode === 'led' && !!MATS[s.mat].xr; }, rng: function (s) { return MATS[s.mat].xr || [0, 1]; } },
    { k: 'Vs', l: 'Supply voltage', min: 1, max: 6, step: 0.05, f: function (v) { return v.toFixed(2) + ' V'; }, show: function (s) { return s.mode === 'led'; } },
    { k: 'R', l: 'Series resistor', min: 10, max: 1000, step: 5, f: function (v) { return v + ' Ω'; }, show: function (s) { return s.mode === 'led'; } },
    { k: 'suns', l: 'Light intensity', min: 0, max: 1.5, step: 0.01, f: function (v) { return v.toFixed(2) + ' sun'; }, show: function (s) { return s.mode === 'solar'; } },
    { k: 'Tc', l: 'Cell temperature', min: 250, max: 380, step: 1, f: function (v) { return v + ' K'; }, show: function (s) { return s.mode === 'solar'; } },
    { k: 'Rsc', l: 'Series resistance', min: 0, max: 5, step: 0.05, f: function (v) { return v.toFixed(2) + ' Ω·cm²'; }, show: function (s) { return s.mode === 'solar'; } },
    { k: 'lRsh', l: 'Shunt resistance', min: 1.5, max: 5, step: 0.1, f: function (v) { return sci(Math.pow(10, v), 1) + ' Ω·cm²'; }, show: function (s) { return s.mode === 'solar'; } },
    { k: 'Vz', l: 'Zener voltage V_Z', min: 2.7, max: 24, step: 0.1, f: function (v) { return v.toFixed(1) + ' V'; }, show: function (s) { return s.mode === 'zener'; } },
    { k: 'Vin', l: 'Input voltage', min: 0, max: 30, step: 0.1, f: function (v) { return v.toFixed(1) + ' V'; }, show: function (s) { return s.mode === 'zener'; } },
    { k: 'Rz', l: 'Series resistor', min: 50, max: 2000, step: 10, f: function (v) { return v + ' Ω'; }, show: function (s) { return s.mode === 'zener'; } },
    { k: 'RL', l: 'Load resistor', min: 50, max: 10000, step: 50, f: function (v) { return v + ' Ω'; }, show: function (s) { return s.mode === 'zener'; } }],
  cap: function (s) {
    return s.mode === 'led' ? 'An LED is a forward-biased PN junction made from a direct-gap compound semiconductor. Electrons and holes injected across the junction recombine and each recombination emits one photon of energy ≈ E_g, so the colour is set by the bandgap (wavelength = 1240 / E_g[eV] nm). Silicon has an indirect gap, so it makes heat, not light. A series resistor sets the current.'
      : s.mode === 'solar' ? 'A solar cell/photodiode is the same junction used in reverse: photons with energy above E_g create electron–hole pairs and the built-in field sweeps them apart, adding a light-generated current I_ph that shifts the whole I–V curve down into the fourth quadrant where the device delivers power. V_oc is where the current is zero, I_sc where the voltage is zero; the best load sits at the maximum-power point.'
        : 'A Zener diode is a heavily doped junction designed to break down at a well-defined reverse voltage V_Z: below about 5 V by band-to-band tunnelling through the thin depletion region (Zener effect), above about 7 V by avalanche multiplication. In breakdown the voltage barely changes while the current changes a lot, so the diode holds the output of a simple regulator nearly constant.';
  },
  eq: function (s) {
    return s.mode === 'led' ? 'λ[nm] ≈ 1239.8 / E<sub>g</sub>[eV] &nbsp; photon energy hν ≈ E<sub>g</sub><br>V<sub>f</sub> ≈ E<sub>g</sub>/q + small; I = (V<sub>s</sub> − V<sub>f</sub>)/R<br>Alloys: In<sub>x</sub>Ga<sub>1−x</sub>N: E<sub>g</sub> = 3.4(1−x) + 0.7x − 1.4x(1−x) eV<br>Spectral width ≈ 1.8 kT'
      : s.mode === 'solar' ? 'I = I<sub>0</sub>(e<sup>(V+IR<sub>s</sub>)/nkT</sup> − 1) − I<sub>ph</sub> + (V+IR<sub>s</sub>)/R<sub>sh</sub><br>I<sub>sc</sub> ≈ I<sub>ph</sub> &nbsp; V<sub>oc</sub> = (nkT/q) ln(I<sub>ph</sub>/I<sub>0</sub> + 1)<br>FF = P<sub>max</sub>/(V<sub>oc</sub>I<sub>sc</sub>) &nbsp; η = P<sub>max</sub>/P<sub>in</sub> (1 sun = 100 mW/cm²)<br>I<sub>ph</sub> = 40 mA/cm² per sun (Si, AM1.5 ideal), I<sub>0</sub> ∝ n<sub>i</sub>²(T)'
        : 'Regulator: (V<sub>in</sub> − V<sub>out</sub>)/R = I<sub>Z</sub> + V<sub>out</sub>/R<sub>L</sub><br>Breakdown knee: I<sub>Z</sub> ≈ I<sub>k</sub> e<sup>(V<sub>r</sub>−V<sub>Z</sub>)/V<sub>k</sub></sup><br>Dynamic resistance r<sub>z</sub> = dV/dI = V<sub>k</sub>/I<sub>Z</sub><br>Zener (tunnelling) V<sub>Z</sub> &lt; ~5 V, avalanche V<sub>Z</sub> &gt; ~7 V';
  },
  read: function (s) {
    if (s.mode === 'led') { var e = ledEg(s), l = 1239.84 / e, op = ledOp(s), eq = MATS[s.mat].eqe; return [['Bandgap E_g', e.toFixed(3) + ' eV'], ['Wavelength', l.toFixed(0) + ' nm' + (l > 780 ? ' (IR)' : l < 380 ? ' (UV)' : '')], ['Forward voltage', op.V.toFixed(2) + ' V'], ['LED current', eng(op.I, 'A')], ['Resistor drop', (s.Vs - op.V).toFixed(2) + ' V'], ['Optical output (EQE ' + (eq * 100).toFixed(eq < 0.01 ? 2 : 0) + ' %)', eng(op.I * eq * e, 'W')]]; }
    if (s.mode === 'solar') { var c = cellParams(s), st = memo('cs' + [s.suns, s.Tc, s.Rsc, s.lRsh].join(), function () { return cellStats(c); }); var Pin = 100 * s.suns; return [['I_sc', (st.Jsc * 1e3).toFixed(1) + ' mA/cm²'], ['V_oc', st.Voc.toFixed(3) + ' V'], ['Max power point', st.Vm.toFixed(3) + ' V, ' + (st.Jm * 1e3).toFixed(1) + ' mA/cm²'], ['P_max', (st.Pmax * 1e3).toFixed(2) + ' mW/cm²'], ['Fill factor', st.FF.toFixed(3)], ['Efficiency (ideal 40 mA/sun)', Pin > 0 ? (st.Pmax * 1e3 / Pin * 100).toFixed(1) + ' %' : '—']]; }
    var o = zenerOp(s.Vin, s); return [['V_out', o.Vr.toFixed(2) + ' V'], ['Zener current', eng(o.Iz, 'A')], ['Load current', eng(o.Vr / s.RL, 'A')], ['Zener power', eng(o.Vr * o.Iz, 'W')], ['Mechanism', s.Vz < 5 ? 'tunnelling (Zener)' : s.Vz > 7 ? 'avalanche' : 'mixed']];
  },
  draw: function (g, w, h, s, t, x) {
    var R = lay(w, h, 2, 2), i, dt = Math.min(0.05, x.dt || 0.016);
    if (s.mode === 'led') {
      var Egv = ledEg(s), lam = 1239.84 / Egv, op = ledOp(s), eq = MATS[s.mat].eqe, bright = clamp(Math.sqrt(op.I * eq / 0.02 / 0.35) , 0, 1);
      var vis = lam >= 380 && lam <= 780, rgb = vis ? wl2rgb(lam) : [90, 90, 110], col = 'rgb(' + rgb.join(',') + ')';
      /* A: recombination band picture */
      var A = R[0]; card(g, A, 'Inside the LED: recombination emits a photon'); var x0 = A.x + 20, x1 = A.x + A.w - 20, cy = A.y + A.h / 2 + 4, gh = clamp(Egv / 3.6, 0.15, 1) * (A.h - 130), fr = clamp((op.V - Egv + 0.3) / 0.5, 0, 1);
      var ecN = cy - gh / 2 - 22 + 0 * fr, ecP = ecN - 6 + 14 * (1 - fr) + 0, xm = (x0 + x1) / 2, bw = (x1 - x0) * 0.2;
      var EcY = function (xx) { var u = smooth((xx - (xm - bw * 0.9)) / (bw * 1.8)); return lerp(ecP - 14 * (1 - fr) + 0, ecN + 0, 0) + 0 * u; };
      var top = cy - gh / 2, bot = cy + gh / 2; g.fillStyle = 'rgba(110,231,255,.10)'; g.fillRect(x0, A.y + 28, x1 - x0, top - A.y - 28); g.fillStyle = 'rgba(126,231,135,.10)'; g.fillRect(x0, bot, x1 - x0, A.y + A.h - 26 - bot);
      line(g, x0, top, x1, top, C.acc, 2); line(g, x0, bot, x1, bot, C.green, 2); txt(g, 'conduction band', x0 + 4, top - 6, { s: 9.5, c: C.acc }); txt(g, 'valence band', x0 + 4, bot + 13, { s: 9.5, c: C.green });
      txt(g, 'n-side (electrons)', x0 + 4, A.y + 44, { s: 10, c: C.acc }); txt(g, 'p-side (holes)', x1 - 4, A.y + A.h - 32, { a: 'right', s: 10, c: C.hole });
      arrow(g, xm + 12, top + 2, xm + 12, bot - 2, 'rgba(255,255,255,.7)', 1); txt(g, 'E_g = ' + Egv.toFixed(2) + ' eV', xm + 18, cy + 3, { s: 10.5, w: 600 });
      var ph = (t * 1.2) % 1; for (i = 0; i < 4; i++) { var u = (ph + i / 4) % 1, ex_ = lerp(x0 + 12, xm - 6, u); dot(g, ex_, top - 7 + 0, C.acc, 4); var hx = lerp(x1 - 12, xm + 6, u); dot(g, hx, bot + 7, C.hole, 4); }
      g.globalAlpha = 0.4 + 0.6 * bright; wave(g, xm, cy, xm, A.y + 52, col, 5, t * 8); wave(g, xm, cy, xm + (x1 - xm) * 0.55, A.y + 76, col, 5, t * 8); wave(g, xm, cy, xm - (xm - x0) * 0.55, A.y + 76, col, 5, t * 8); g.globalAlpha = 1;
      txt(g, 'photon  hν = ' + Egv.toFixed(2) + ' eV  →  λ = ' + lam.toFixed(0) + ' nm', xm, A.y + A.h - 10, { a: 'center', s: 10.5, c: vis ? col : C.dim, w: 600 });
      /* B: colour + spectrum */
      var B = R[1]; card(g, B, 'Emitted colour and spectrum'); var Pb = plot(g, B, { xmin: 350, xmax: 900, ymin: 0, ymax: 1.1, xt: [400, 500, 600, 700, 800, 900], yt: [], xl: 'wavelength (nm)', pt: 24, pb: 28, nozero: true });
      var N = 120; for (i = 0; i < N; i++) { var wl = 380 + 400 * i / N, c2 = wl2rgb(wl); g.fillStyle = 'rgb(' + c2.join(',') + ')'; g.fillRect(Pb.X(wl), Pb.y + Pb.h - 16, Pb.X(wl + 400 / N) - Pb.X(wl) + 1, 12); }
      var sig = lam * lam / 1239.84 * 0.9 * 0.025852 * 1.0 / 1; curve(g, Pb, function (l) { return Math.exp(-0.5 * Math.pow((l - lam) / sig, 2)); }, col, 2.2, null, 350, 900, 300);
      clip(g, Pb); g.beginPath(); for (i = 0; i <= 300; i++) { var l2 = 350 + 550 * i / 300; i ? g.lineTo(Pb.X(l2), Pb.Y(Math.exp(-0.5 * Math.pow((l2 - lam) / sig, 2)))) : g.moveTo(Pb.X(l2), Pb.Y(0)); } g.lineTo(Pb.X(900), Pb.Y(0)); g.fillStyle = rgba(vis ? '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1) : '#8888aa', 0.35); g.fill(); g.restore();
      txt(g, 'visible 380–780 nm', Pb.X(580), Pb.y + Pb.h - 20, { a: 'center', s: 9, c: C.dim }); txt(g, 'IR', Pb.X(850), Pb.y + Pb.h - 20, { a: 'center', s: 9, c: C.dim }); txt(g, 'UV', Pb.X(365), Pb.y + Pb.h - 20, { a: 'center', s: 9, c: C.dim });
      var sx = B.x + B.w - 62, sy = B.y + 58; var rg = g.createRadialGradient(sx, sy, 4, sx, sy, 15 + 40 * bright); rg.addColorStop(0, vis ? 'rgba(' + rgb.join(',') + ',' + (0.25 + 0.75 * bright) + ')' : 'rgba(80,80,100,.7)'); rg.addColorStop(0.35, vis ? 'rgba(' + rgb.join(',') + ',' + (0.3 * bright) + ')' : 'rgba(80,80,100,.2)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(sx - 60, sy - 60, 120, 120); dot(g, sx, sy, vis ? 'rgb(' + rgb.map(function (v) { return Math.round(v * (0.35 + 0.65 * bright)); }).join(',') + ')' : '#3a3a4c', 12);
      txt(g, vis ? 'looks ' + (lam < 450 ? 'violet/blue' : lam < 495 ? 'blue' : lam < 570 ? 'green' : lam < 590 ? 'yellow' : lam < 620 ? 'orange' : 'red') : lam > 780 ? 'invisible (infrared)' : 'invisible (ultraviolet)', sx, sy + 38, { a: 'center', s: 10, c: C.dim });
      txt(g, 'width ≈ ' + (1.8 * 0.025852 * lam * lam / 1239.84).toFixed(0) + ' nm (1.8 kT)', Pb.x + 6, Pb.y + 12, { s: 9.5, c: C.dim });
      /* C: I-V + load line */
      var Cc = R[2]; card(g, Cc, 'LED I–V and resistor load line'); var Imx = Math.max(0.03, s.Vs / s.R * 1.05); Imx = Math.min(Imx, 0.2);
      var Pc = plot(g, Cc, { xmin: 0, xmax: Math.max(4, Egv + 0.8), ymin: 0, ymax: Imx, xl: 'V (V)', yl: 'I (mA)', fy: function (v) { return (v * 1e3).toFixed(0); } });
      curve(g, Pc, function (V) { return op.f(V); }, C.gold, 2.2); poly(g, Pc, [0, s.Vs], [s.Vs / s.R, 0], C.acc, 1.6, [5, 4]); dot(g, Pc.X(op.V), Pc.Y(Math.min(op.I, Imx)), '#fff', 5, true);
      txt(g, 'Q: ' + op.V.toFixed(2) + ' V, ' + eng(op.I, 'A'), Pc.X(op.V) - 8, Pc.Y(Math.min(op.I, Imx)) - 8, { a: 'right', s: 10, w: 600 }); txt(g, 'load line (V_s − V)/R', Pc.x + 8, Pc.y + 12, { s: 9.5, c: C.acc });
      line(g, Pc.X(Egv), Pc.y + Pc.h, Pc.X(Egv), Pc.y + Pc.h - 8, '#fff', 1.5); txt(g, 'E_g/q', Pc.X(Egv), Pc.y + Pc.h - 11, { a: 'center', s: 9, c: C.dim });
      /* D: materials */
      var D = R[3]; card(g, D, 'Bandgap ↔ colour: which material?'); var keys = Object.keys(MATS), Pd = plot(g, D, { xmin: 0.9, xmax: 3.7, ymin: 0, ymax: keys.length, xt: [1, 1.5, 2, 2.5, 3, 3.5], yt: [], xl: 'photon energy / bandgap (eV)', nozero: true, pl: 90 });
      for (i = 0; i < 140; i++) { var E1 = 0.9 + 2.8 * i / 140, c3 = wl2rgb(1239.84 / E1); g.fillStyle = 'rgba(' + c3.join(',') + ',.22)'; g.fillRect(Pd.X(E1), Pd.y, Pd.X(E1 + 2.8 / 140) - Pd.X(E1) + 1, Pd.h); }
      keys.forEach(function (k, j) { var m = MATS[k], yy = Pd.y + (j + .5) * Pd.h / keys.length, sel = k === s.mat; txt(g, m.n.length > 16 ? m.n.slice(0, 15) + '…' : m.n, Pd.x - 6, yy + 3, { a: 'right', s: 9.5, c: sel ? C.gold : C.dim, w: sel ? 700 : 400 });
        g.fillStyle = sel ? C.gold : 'rgba(255,255,255,.75)'; var xa = Pd.X(m.rng[0]), xb = Pd.X(m.rng[1]); g.fillRect(xa - 3, yy - 5, Math.max(6, xb - xa + 6), 10); });
      line(g, Pd.X(Egv), Pd.y, Pd.X(Egv), Pd.y + Pd.h, '#fff', 1.4, [4, 3]); txt(g, MATS[s.mat].note, D.x + 10, D.y + D.h - 8, { s: 9.5, c: C.dim });
    } else if (s.mode === 'solar') {
      var c = cellParams(s), st = memo('cs' + [s.suns, s.Tc, s.Rsc, s.lRsh].join(), function () { return cellStats(c); }), Pin = 100 * s.suns;
      var A2 = R[0]; card(g, A2, 'Photocurrent: light → electron–hole pairs → current'); var cx0 = A2.x + 40, cw = A2.w - 80, cy0 = A2.y + 100, ch = A2.h - 160, dw = 0.18;
      g.fillStyle = 'rgba(110,231,255,.22)'; g.fillRect(cx0, cy0, cw, ch * 0.12); g.fillStyle = 'rgba(255,209,102,.12)'; g.fillRect(cx0, cy0 + ch * 0.12, cw, ch * 0.16); g.fillStyle = 'rgba(255,143,163,.16)'; g.fillRect(cx0, cy0 + ch * 0.28, cw, ch * 0.72);
      txt(g, 'n⁺ emitter', cx0 + 6, cy0 + 11, { s: 9.5, c: C.acc }); txt(g, 'depletion region (field →↓)', cx0 + 6, cy0 + ch * 0.12 + 20, { s: 9.5, c: C.gold }); txt(g, 'p-type base', cx0 + 6, cy0 + ch * 0.6, { s: 9.5, c: C.hole });
      g.fillStyle = '#5a6685'; for (i = 0; i < 4; i++) g.fillRect(cx0 + 20 + i * (cw - 50) / 3, cy0 - 5, 10, 5); g.fillRect(cx0, cy0 + ch, cw, 6);
      x.sp = x.sp || []; var nr = Math.round(s.suns * 14), rate = s.suns * 14 * 0.7;
      if (Math.random() < rate * dt * 1.5) x.sp.push({ x: cx0 + 20 + Math.random() * (cw - 40), y: cy0 - 60, d: 0.0, kind: 'ph', depth: 0.1 + Math.random() * 0.5 });
      for (i = x.sp.length - 1; i >= 0; i--) { var p = x.sp[i]; if (p.kind === 'ph') { p.y += 110 * dt; if (p.y >= cy0 + p.depth * ch) { x.sp.splice(i, 1); if (s.suns > 0) { x.sp.push({ x: p.x, y: p.y, kind: 'e', t: 0 }); x.sp.push({ x: p.x, y: p.y, kind: 'h', t: 0 }); } } } else { p.t += dt; p.y += (p.kind === 'e' ? -1 : 1) * 40 * dt; if (p.kind === 'e') p.x += 28 * dt * ((cx0 + cw / 2) - p.x > 0 ? 1 : -1); if (p.y < cy0 + 3 || p.y > cy0 + ch) x.sp.splice(i, 1); } }
      if (x.sp.length > 150) x.sp.splice(0, 30);
      x.sp.forEach(function (p) { if (p.kind === 'ph') { wave(g, p.x, p.y - 22, p.x, p.y, C.gold, 3, t * 9); } else dot(g, p.x, p.y, p.kind === 'e' ? C.acc : C.hole, 3.2); });
      txt(g, 'photons (hν > E_g = ' + Eg(s.Tc).toFixed(2) + ' eV)', cx0, A2.y + 36, { s: 9.5, c: C.gold }); txt(g, '● e⁻ swept up   ● h⁺ swept down', cx0, A2.y + A2.h - 10, { s: 9.5, c: C.dim });
      var wy = cy0 + ch + 20; line(g, cx0 + 20, cy0 - 5, cx0 + 20, A2.y + 46, '#8a96b3', 1.5); line(g, cx0 + cw / 2, cy0 + ch + 6, cx0 + cw / 2, wy, '#8a96b3', 1.5); txt(g, 'I_sc = ' + (st.Jsc * 1e3).toFixed(1) + ' mA/cm²', A2.x + A2.w - 10, A2.y + 16, { a: 'right', s: 10, c: C.gold });
      var Bp = R[1]; card(g, Bp, 'Light shifts the I–V curve into the 4th quadrant'); var vm = Math.max(0.2, st.Voc * 1.2);
      var Pj = plot(g, Bp, { xmin: -0.15, xmax: vm, ymin: -50, ymax: 12, xl: 'V (V)', yl: 'current density (mA/cm², load convention)', pl: 48 });
      g.fillStyle = 'rgba(255,209,102,.07)'; g.fillRect(Pj.X(0), Pj.Y(0), Pj.X(vm) - Pj.X(0), Pj.Y(-50) - Pj.Y(0)); txt(g, '4th quadrant: P = −V·I > 0 (power delivered)', Pj.X(0.02), Pj.Y(-46), { s: 9.5, c: C.gold });
      curve(g, Pj, function (V) { return -cellJ(V, Object.assign({}, c, { Jph: 0 })) * 1e3; }, 'rgba(255,255,255,.4)', 1.3, [4, 4], -0.15, vm, 160); curve(g, Pj, function (V) { return -cellJ(V, c) * 1e3; }, C.gold, 2.4, null, -0.15, vm, 160);
      if (s.suns > 0.01) { g.fillStyle = 'rgba(110,231,255,.2)'; g.fillRect(Pj.X(0), Pj.Y(0), Pj.X(st.Vm) - Pj.X(0), Pj.Y(-st.Jm * 1e3) - Pj.Y(0)); g.strokeStyle = C.acc; g.strokeRect(Pj.X(0) + .5, Pj.Y(0) + .5, Pj.X(st.Vm) - Pj.X(0), Pj.Y(-st.Jm * 1e3) - Pj.Y(0)); dot(g, Pj.X(st.Vm), Pj.Y(-st.Jm * 1e3), C.acc, 5, true); dot(g, Pj.X(st.Voc), Pj.Y(0), '#fff', 4); dot(g, Pj.X(0), Pj.Y(-st.Jsc * 1e3), '#fff', 4);
        txt(g, 'V_oc = ' + st.Voc.toFixed(3) + ' V', Pj.X(st.Voc) - 6, Pj.Y(0) - 8, { a: 'right', s: 10, w: 600 }); txt(g, 'I_sc', Pj.X(0) + 7, Pj.Y(-st.Jsc * 1e3) + 4, { s: 10, w: 600 }); txt(g, 'MPP', Pj.X(st.Vm) - 8, Pj.Y(-st.Jm * 1e3) + 14, { a: 'right', s: 10, c: C.acc, w: 600 }); }
      legend(g, Pj.x + Pj.w - 100, Pj.y + 14, [['illuminated', C.gold], ['dark diode', 'rgba(255,255,255,.5)', 0, [4, 4]]]);
      var Cp = R[2]; card(g, Cp, 'Power vs voltage'); var Pp = plot(g, Cp, { xmin: 0, xmax: vm, ymin: 0, ymax: Math.max(10, Math.ceil(st.Pmax * 1e3 * 1.2 / 5) * 5), xl: 'V (V)', yl: 'P (mW/cm²)' });
      curve(g, Pp, function (V) { return V * cellJ(V, c) * 1e3; }, C.acc, 2.2, null, 0, vm, 160); if (s.suns > 0.01) { dot(g, Pp.X(st.Vm), Pp.Y(st.Pmax * 1e3), C.gold, 5, true); txt(g, 'P_max = ' + (st.Pmax * 1e3).toFixed(1) + ' mW/cm²   FF = ' + st.FF.toFixed(2), Pp.x + 8, Pp.y + 14, { s: 10, c: C.gold, w: 600 }); }
      var Dp = R[3]; card(g, Dp, 'Open-circuit voltage vs light intensity'); var Pv = plot(g, Dp, { xmin: 0.01, xmax: 10, xlog: true, ymin: 0.3, ymax: 0.8, xl: 'intensity (suns)', yl: 'V_oc (V)', xt: [0.01, 0.1, 1, 10], fx: function (v) { return v; } });
      var vk = memo('voc' + [s.Tc, s.Rsc, s.lRsh].join(), function () { var o = { x: [], y: [] }; for (var j = 0; j <= 30; j++) { var sn = 0.01 * Math.pow(1000, j / 30), cc = Object.assign({}, c, { Jph: 0.04 * sn }), lo = 0, hi = 1.2; for (var k = 0; k < 40; k++) { var m = (lo + hi) / 2; if (cellJ(m, cc) > 0) lo = m; else hi = m; } o.x.push(sn); o.y.push(lo); } return o; });
      poly(g, Pv, vk.x, vk.y, C.gold, 2); if (s.suns > 0.01) dot(g, Pv.X(s.suns), Pv.Y(st.Voc), '#fff', 5, true); txt(g, 'V_oc grows only logarithmically with light: ≈ 60 mV per decade', Pv.x + 8, Pv.y + Pv.h - 8, { s: 9.5, c: C.dim });
    } else {
      var op2 = zenerOp(s.Vin, s);
      var A3 = R[0]; card(g, A3, 'Zener I–V: sharp reverse breakdown at V_Z'); var Pz = plot(g, A3, { xmin: -(s.Vz * 1.5 + 1), xmax: 1, ymin: -30e-3, ymax: 10e-3, xl: 'V (V)', yl: 'I (mA)', fy: function (v) { return (v * 1e3).toFixed(0); } });
      curve(g, Pz, function (V) { return zenerI(V, s); }, C.gold, 2.2, null, -(s.Vz * 1.5 + 1), 1, 300); var lx = [0, -s.Vin * 1 / (1 + s.Rz / s.RL)];
      poly(g, Pz, [0, -s.Vin], [-s.Vin / s.Rz, 0], C.acc, 1.4, [5, 4]); dot(g, Pz.X(-op2.Vr), Pz.Y(-Math.min(op2.Iz, 0.05)), '#fff', 5, true); txt(g, 'V_Z = ' + s.Vz.toFixed(1) + ' V', Pz.X(-s.Vz) - 4, Pz.Y(0) - 8, { a: 'right', s: 10, c: C.gold, w: 600 }); txt(g, 'load line (V_in − V_r)/R', Pz.x + 8, Pz.y + 12, { s: 9.5, c: C.acc });
      var B3 = R[1]; card(g, B3, 'Regulation: V_out vs V_in'); var Pq = plot(g, B3, { xmin: 0, xmax: 30, ymin: 0, ymax: 30, xl: 'V_in (V)', yl: 'V_out (V)' });
      curve(g, Pq, function (v) { return v; }, 'rgba(255,255,255,.3)', 1, [3, 3]); curve(g, Pq, function (v) { return zenerOp(v, s).Vr; }, C.gold, 2.2, null, 0, 30, 120); dot(g, Pq.X(s.Vin), Pq.Y(op2.Vr), '#fff', 5, true); txt(g, 'flat = regulated', Pq.X(22), Pq.Y(s.Vz) - 8, { s: 9.5, c: C.dim });
      var C3 = R[2]; card(g, C3, 'Shunt regulator circuit'); var cx = C3.x + 40, cy = C3.y + 70, cw2 = C3.w - 90, cb = C3.y + C3.h - 40;
      g.strokeStyle = '#9aa7c7'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 40, cy); g.stroke(); resistor(g, cx + 40, cy, cx + 110, cy, '#fff'); line(g, cx + 110, cy, cx + cw2, cy, '#9aa7c7', 1.6); line(g, cx, cy, cx, cb, '#9aa7c7', 1.6); line(g, cx, cb, cx + cw2, cb, '#9aa7c7', 1.6);
      var zx = cx + 160, lx2 = cx + cw2 - 20; [zx, lx2].forEach(function (xx) { line(g, xx, cy, xx, cb, 'rgba(0,0,0,0)', 1); });
      line(g, zx, cy, zx, cy + 24, '#9aa7c7', 1.6); g.beginPath(); g.moveTo(zx - 9, cy + 24); g.lineTo(zx + 9, cy + 24); g.lineTo(zx, cy + 42); g.closePath(); g.fillStyle = C.gold; g.fill(); line(g, zx - 9, cy + 42, zx + 9, cy + 42, C.gold, 2); line(g, zx - 9, cy + 42, zx - 13, cy + 38, C.gold, 2); line(g, zx + 9, cy + 42, zx + 13, cy + 46, C.gold, 2); line(g, zx, cy + 42, zx, cb, '#9aa7c7', 1.6);
      resistor(g, lx2, cy, lx2, cb, '#fff'); dot(g, zx, cy, '#9aa7c7', 3); dot(g, lx2, cy, '#9aa7c7', 3); g.beginPath(); g.arc(cx, (cy + cb) / 2, 11, 0, 6.3); g.strokeStyle = '#9aa7c7'; g.stroke(); txt(g, '+', cx, (cy + cb) / 2 + 4, { a: 'center', s: 12 });
      txt(g, 'V_in = ' + s.Vin.toFixed(1) + ' V', cx + 8, (cy + cb) / 2 + 36, { s: 10, c: C.dim }); txt(g, 'R = ' + s.Rz + ' Ω', cx + 75, cy - 10, { a: 'center', s: 10 }); txt(g, 'Zener ' + s.Vz.toFixed(1) + ' V', zx + 18, cy + 36, { s: 10, c: C.gold }); txt(g, 'R_L = ' + s.RL + ' Ω', lx2 - 8, (cy + cb) / 2, { a: 'right', s: 10 });
      txt(g, 'V_out = ' + op2.Vr.toFixed(2) + ' V', zx + 18, cy - 10, { s: 11, w: 700, c: C.acc }); txt(g, 'I_R = ' + eng(op2.IR, 'A') + ' → I_Z = ' + eng(op2.Iz, 'A') + ' + I_L = ' + eng(op2.Vr / s.RL, 'A'), C3.x + C3.w / 2, C3.y + C3.h - 10, { a: 'center', s: 10, c: C.dim });
      var D3 = R[3]; card(g, D3, 'Two breakdown mechanisms'); var hw = (D3.w - 30) / 2, by2 = D3.y + 44, bh2 = D3.h - 84, gp = 46;
      [0, 1].forEach(function (k) {
        var bx2 = D3.x + 10 + k * (hw + 10), x1 = bx2 + hw * (k ? 0.12 : 0.4), x2 = bx2 + hw * (k ? 0.88 : 0.6), dd = gp * (k ? 1.1 : 1.6), yc1 = by2 + 18, yc2 = yc1 + dd, ev1 = yc1 + gp, ev2 = yc2 + gp;
        g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(bx2, by2, hw, bh2);
        var bandY = function (xx, y1, y2) { return xx <= x1 ? y1 : xx >= x2 ? y2 : lerp(y1, y2, (xx - x1) / (x2 - x1)); };
        [[yc1, yc2, C.acc], [ev1, ev2, C.green]].forEach(function (b) { g.beginPath(); g.moveTo(bx2 + 4, b[0]); g.lineTo(x1, b[0]); g.lineTo(x2, b[1]); g.lineTo(bx2 + hw - 4, b[1]); g.strokeStyle = b[2]; g.lineWidth = 2; g.stroke(); });
        txt(g, 'E_c', bx2 + 8, yc1 - 4, { s: 9, c: C.acc }); txt(g, 'E_v', bx2 + 8, ev1 + 12, { s: 9, c: C.green }); txt(g, 'p side', bx2 + 8, by2 + bh2 - 6, { s: 9.5, c: C.hole }); txt(g, 'n side', bx2 + hw - 8, by2 + bh2 - 6, { a: 'right', s: 9.5, c: C.acc });
        var u = (t * 0.55) % 1;
        if (k === 0) { var yy = ev1 + 9; line(g, x1 - 14, yy, x2 + 14, yy, 'rgba(255,255,255,.25)', 1, [3, 3]); dot(g, lerp(bx2 + 16, bx2 + hw - 16, u), yy, C.acc, 4); txt(g, 'electron tunnels VB → CB', bx2 + hw / 2, by2 + bh2 + 14, { a: 'center', s: 9.5, c: C.dim }); txt(g, 'Zener: V_Z < ~5 V', bx2 + hw / 2, by2 - 8, { a: 'center', s: 10, w: 600, c: C.gold }); }
        else { var xx = lerp(bx2 + 14, bx2 + hw - 14, u); dot(g, xx, bandY(xx, yc1, yc2) - 6, C.acc, 4); if (u > 0.55) { dot(g, xx + 7, bandY(xx + 7, yc1, yc2) - 6, C.acc, 3.4); dot(g, xx, bandY(xx, ev1, ev2) + 6, C.hole, 3.4); g.beginPath(); g.arc(xx, (bandY(xx, yc1, yc2) + bandY(xx, ev1, ev2)) / 2, 7 + 14 * (u - .55), 0, 6.3); g.strokeStyle = 'rgba(255,255,255,' + (1 - (u - .55) * 2) + ')'; g.stroke(); } txt(g, 'impact ionisation: 1 → 2 → 4 …', bx2 + hw / 2, by2 + bh2 + 14, { a: 'center', s: 9.5, c: C.dim }); txt(g, 'Avalanche: V_Z > ~7 V', bx2 + hw / 2, by2 - 8, { a: 'center', s: 10, w: 600, c: C.gold }); }
      });
    }
  }
};

/* ================= TAB 5: BJT ================= */
function bjtP(s) { return { Is: 1e-14, bf: s.bf, br: 2, VA: s.VA, vt: 0.025852 }; }
function bjtState(s) {
  return memo('bj' + [s.IB, s.VCC, s.RC, s.bf, s.VA].join(), function () {
    var P = bjtP(s), op = bjtOp(Math.max(s.IB * 1e-6, 1e-12), s.VCC, s.RC, P), VBC = op.VBE - op.VCE;
    var reg = op.VBE < 0.45 || op.IB < 2e-7 ? 'cutoff' : VBC > 0.4 ? 'saturation' : 'active'; op.VBC = VBC; op.reg = reg; op.IE = op.IC + op.IB; op.P = P; return op;
  });
}
var TAB_BJT = {
  id: 'bjt', name: 'BJT',
  def: { IB: 40, step: 20, VCC: 10, RC: 1000, bf: 100, VA: 75 },
  ctl: [
    { k: 'IB', l: 'Base current I_B', min: 0, max: 120, step: 1, f: function (v) { return v + ' µA'; } },
    { k: 'step', l: 'Family step (curves every …)', min: 10, max: 40, step: 5, f: function (v) { return v + ' µA'; } },
    { k: 'VCC', l: 'Supply V_CC', min: 3, max: 15, step: 0.5, f: function (v) { return v + ' V'; } },
    { k: 'RC', l: 'Collector resistor R_C', min: 200, max: 5000, step: 50, f: function (v) { return v + ' Ω'; } },
    { k: 'bf', l: 'Forward gain β_F', min: 30, max: 300, step: 5, f: function (v) { return v; } },
    { k: 'VA', l: 'Early voltage V_A', min: 20, max: 300, step: 5, f: function (v) { return v + ' V'; } }],
  cap: 'In an n-p-n transistor a small base current lets a much larger current flow from emitter to collector. Forward-biasing the emitter–base junction lowers the barrier so electrons are injected into the thin p-type base; most diffuse across before they can recombine and are swept into the collector by the reverse-biased collector–base field. Gain β = I_C/I_B is the ratio of electrons that cross to those that recombine. The load line shows where the circuit settles; cutoff, active and saturation regions are shaded.',
  eq: 'Ebers–Moll: I<sub>C</sub> = I<sub>s</sub>(e<sup>V<sub>BE</sub>/V<sub>T</sub></sup> − e<sup>V<sub>BC</sub>/V<sub>T</sub></sup>)(1+V<sub>CE</sub>/V<sub>A</sub>) − (I<sub>s</sub>/β<sub>R</sub>)(e<sup>V<sub>BC</sub>/V<sub>T</sub></sup> − 1)<br>I<sub>B</sub> = (I<sub>s</sub>/β<sub>F</sub>)(e<sup>V<sub>BE</sub>/V<sub>T</sub></sup> − 1) + (I<sub>s</sub>/β<sub>R</sub>)(e<sup>V<sub>BC</sub>/V<sub>T</sub></sup> − 1)<br>I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>, β = I<sub>C</sub>/I<sub>B</sub>; I<sub>s</sub> = 10⁻¹⁴ A, β<sub>R</sub> = 2, V<sub>T</sub> = 25.85 mV<br>Load line: V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub>',
  read: function (s) { var o = bjtState(s); return [['Region', o.reg], ['I_B', eng(o.IB, 'A')], ['I_C', eng(o.IC, 'A')], ['I_E', eng(o.IE, 'A')], ['β = I_C/I_B', o.IB > 0 ? (o.IC / o.IB).toFixed(1) : '—'], ['V_BE / V_CE', o.VBE.toFixed(3) + ' / ' + o.VCE.toFixed(2) + ' V'], ['V_BC', o.VBC.toFixed(3) + ' V'], ['Power in transistor', eng(o.VCE * o.IC + o.VBE * o.IB, 'W')]]; },
  draw: function (g, w, h, s, t, x) {
    var R = lay(w, h, 2, 2), o = bjtState(s), P = o.P, i, dt = Math.min(0.05, x.dt || 0.016);
    /* A: structure + carrier flow */
    var A = R[0]; card(g, A, 'n-p-n structure and carrier flow'); var bx = A.x + 20, bw = A.w - 40, by = A.y + 84, bh = A.h - 168, xe = bx + bw * 0.34, xb = bx + bw * 0.5;
    g.fillStyle = 'rgba(110,231,255,.16)'; g.fillRect(bx, by, xe - bx, bh); g.fillStyle = 'rgba(255,143,163,.18)'; g.fillRect(xe, by, xb - xe, bh); g.fillStyle = 'rgba(110,231,255,.10)'; g.fillRect(xb, by, bx + bw - xb, bh);
    g.strokeStyle = C.line; g.strokeRect(bx + .5, by + .5, bw, bh); line(g, xe, by, xe, by + bh, C.line, 1); line(g, xb, by, xb, by + bh, C.line, 1);
    txt(g, 'Emitter n⁺', bx + 8, by + 16, { s: 10.5, c: C.acc, w: 600 }); txt(g, 'Base p', (xe + xb) / 2, by + 16, { a: 'center', s: 10.5, c: C.hole, w: 600 }); txt(g, 'Collector n', bx + bw - 8, by + 16, { a: 'right', s: 10.5, c: C.acc, w: 600 });
    var rec = o.IB / Math.max(o.IE, 1e-18), lvl = clamp((Math.log10(Math.max(o.IE, 1e-12)) + 9) / 6, 0, 1), rate = o.reg === 'cutoff' ? 0.3 : 6 + 40 * lvl; x.bp = x.bp || [];
    if (Math.random() < rate * dt) x.bp.push({ x: 0, y: 0.25 + Math.random() * 0.65, die: Math.random() < clamp(rec * 4, 0, 0.9) ? 0.34 + 0.16 * Math.random() : 9, v: 0.35 + 0.2 * lvl });
    for (i = x.bp.length - 1; i >= 0; i--) { var p = x.bp[i]; if (p.flash === undefined) p.x += p.v * dt; if (p.x > p.die) { x.bp[i] = { flash: 0.4, x: p.x, y: p.y }; } var q = x.bp[i]; if (q.flash !== undefined) { q.flash -= dt; if (q.flash < 0) x.bp.splice(i, 1); else { g.beginPath(); g.arc(bx + q.x * bw, by + q.y * bh, 8 * (1 - q.flash / 0.4) + 3, 0, 6.3); g.strokeStyle = 'rgba(255,143,163,' + q.flash * 2 + ')'; g.lineWidth = 2; g.stroke(); } continue; } if (p.x > 1) { x.bp.splice(i, 1); continue; } dot(g, bx + p.x * bw, by + p.y * bh + Math.sin(p.x * 40 + i) * 1.5, C.acc, 3); }
    if (x.bp.length > 140) x.bp.splice(0, 20);
    var nh = Math.round(clamp(rec * 60, 0, 6)) + (o.reg === 'cutoff' ? 0 : 1); for (i = 0; i < nh; i++) { var u = ((t * 0.5 + i / nh) % 1); dot(g, lerp((xe + xb) / 2, (xe + xb) / 2 + 3, u) + Math.sin(i * 5) * 3, lerp(by - 24, by + bh * 0.6, u), C.hole, 2.6); }
    var aw = function (I) { return 1 + 5 * clamp((Math.log10(Math.max(I, 1e-9)) + 6) / 4, 0, 1); };
    var ex0 = bx + (xe - bx) / 2, bx0 = (xe + xb) / 2, cx0 = bx + bw - (bx + bw - xb) / 2;
    arrow(g, bx0, A.y + 40, bx0, by - 2, C.hole, aw(o.IB)); txt(g, 'B', bx0, A.y + 34, { a: 'center', s: 11, w: 700 }); txt(g, 'I_B ' + eng(o.IB, 'A', 2), bx0 + 12, A.y + 56, { s: 10, c: C.hole });
    arrow(g, cx0, A.y + 40, cx0, by - 2, C.acc, aw(o.IC)); txt(g, 'C', cx0, A.y + 34, { a: 'center', s: 11, w: 700 }); txt(g, 'I_C ' + eng(o.IC, 'A', 2), cx0 + 12, A.y + 56, { s: 10, c: C.acc });
    arrow(g, ex0, by + bh + 2, ex0, by + bh + 30, C.gold, aw(o.IE)); txt(g, 'E', ex0, by + bh + 44, { a: 'center', s: 11, w: 700 }); txt(g, 'I_E = I_C + I_B = ' + eng(o.IE, 'A', 2), ex0 + 12, by + bh + 22, { s: 10, c: C.gold });
    txt(g, o.reg === 'cutoff' ? 'CUTOFF: both junctions off, no current' : o.reg === 'saturation' ? 'SATURATION: collector junction also forward-biased, β drops' : 'ACTIVE: emitter junction forward, collector junction reverse — I_C ≈ β·I_B', A.x + A.w / 2, A.y + A.h - 8, { a: 'center', s: 10, c: o.reg === 'active' ? C.green : C.hole, w: 600 });
    dotLegend(g, A.x + 10, A.y + A.h - 26, [[C.acc, 'electrons from the emitter (a few recombine in the thin base)']]);
    /* B: band diagram */
    var B = R[1]; card(g, B, 'Band diagram at the operating point'); var Egv = Eg(300), kT = KB * 300, cE = kT * Math.log(NC(300) / 1e19), cB = Egv - kT * Math.log(NV(300) / 1e17), cC = kT * Math.log(NC(300) / 1e16);
    var EcE = o.VBE + cE, EcB = cB, EcC = o.VBC + cC, FE = o.VBE, FB = 0, FC = o.VBC;
    var Ec = function (u) { return EcE + (EcB - EcE) * smooth((u - 0.34) / 0.08 + 0.5) + (EcC - EcB) * smooth((u - 0.5) / 0.2 + 0.5); };
    var lo = Math.min(EcC - Egv, FC, -0.3) - 0.3, hi = Math.max(EcB, EcE, FE) + 0.5 + (Egv > 0 ? 0 : 0);
    var Pb = plot(g, B, { xmin: 0, xmax: 1, ymin: lo, ymax: hi, xt: [], xl: '', yl: 'electron energy (eV)', nozero: true, yt: niceTicks(lo, hi, 4) }); g.fillStyle = 'rgba(255,209,102,.06)'; g.fillRect(Pb.X(0.30), Pb.y, Pb.X(0.38) - Pb.X(0.30), Pb.h); g.fillRect(Pb.X(0.40), Pb.y, Pb.X(0.64) - Pb.X(0.40), Pb.h);
    curve(g, Pb, Ec, C.acc, 2.2, null, 0, 1, 300); curve(g, Pb, function (u) { return Ec(u) - Egv; }, C.green, 2.2, null, 0, 1, 300);
    [[0, 0.34, FE], [0.34, 0.5, FB], [0.5, 1, FC]].forEach(function (z) { line(g, Pb.X(z[0]) + 1, Pb.Y(z[2]), Pb.X(z[1]) - 1, Pb.Y(z[2]), C.gold, 1.5, [6, 3]); });
    txt(g, 'E_Fn (emitter)', Pb.X(0.02), Pb.Y(FE) - 4, { s: 9.5, c: C.gold }); txt(g, 'E_F (base)', Pb.X(0.345), Pb.Y(FB) + 12, { s: 9.5, c: C.gold }); txt(g, 'E_F (collector)', Pb.X(0.98), Pb.Y(FC) - 4, { a: 'right', s: 9.5, c: C.gold });
    txt(g, 'emitter n⁺', Pb.X(0.17), Pb.y + 12, { a: 'center', s: 10, c: C.acc }); txt(g, 'base p', Pb.X(0.42), Pb.y + 12, { a: 'center', s: 10, c: C.hole }); txt(g, 'collector n', Pb.X(0.78), Pb.y + 12, { a: 'center', s: 10, c: C.acc });
    var ph = (t * 0.5) % 1; for (i = 0; i < 3; i++) { var u2 = (ph + i / 3) % 1 * 0.95 + 0.02, yy = Ec(u2); dot(g, Pb.X(u2), Pb.Y(yy) - 6, C.acc, 3.4); }
    txt(g, 'barrier lowered by V_BE = ' + o.VBE.toFixed(2) + ' V → electrons spill into the base; V_CB = ' + (-o.VBC).toFixed(2) + ' V sweeps them away', B.x + B.w / 2, B.y + B.h - 8, { a: 'center', s: 9.5, c: C.dim });
    /* C: output characteristics */
    var Cc = R[2]; card(g, Cc, 'Output characteristics I_C vs V_CE'); var ymx = 1.15 * Math.max(s.VCC / s.RC, s.bf * 5 * s.step * 1e-6), vm = s.VCC;
    var Pc = plot(g, Cc, { xmin: 0, xmax: vm, ymin: 0, ymax: ymx, xl: 'V_CE (V)', yl: 'I_C (mA)', fy: function (v) { return +(v * 1e3).toPrecision(3); } });
    g.fillStyle = 'rgba(255,143,163,.10)'; g.fillRect(Pc.X(0), Pc.y, Pc.X(0.3) - Pc.X(0), Pc.h); g.fillStyle = 'rgba(110,231,255,.07)'; g.fillRect(Pc.X(0.3), Pc.Y(ymx * 0.025), Pc.w - (Pc.X(0.3) - Pc.x), Pc.Y(0) - Pc.Y(ymx * 0.025));
    txt(g, 'sat.', Pc.X(0.15), Pc.y + 11, { a: 'center', s: 9, c: C.hole }); txt(g, 'cutoff', Pc.X(vm * 0.75), Pc.Y(0) - 3, { a: 'center', s: 9, c: C.acc }); txt(g, 'active region', Pc.X(vm * 0.6), Pc.y + 12, { a: 'center', s: 9.5, c: C.green });
    var fam = memo('fam' + [s.step, s.VCC, s.bf, s.VA].join(), function () { var out = []; for (var j = 0; j <= 5; j++) { var ib = j * s.step * 1e-6 + (j === 0 ? 1e-12 : 0), xs = [], ys = []; for (var k = 0; k <= 100; k++) { var v = 0.003 + (vm - 0.003) * Math.pow(k / 100, 1.5); var vbe = bjtVBE(ib, v, P); xs.push(v); ys.push(bjtI(vbe, vbe - v, P).IC); } out.push({ ib: ib, x: xs, y: ys }); } return out; });
    fam.forEach(function (c, j) { poly(g, Pc, c.x, c.y, 'rgba(255,209,102,.7)', 1.4); txt(g, j * s.step + ' µA', Pc.x + Pc.w - 3, Pc.Y(c.y[100]) - 3, { a: 'right', s: 9, c: C.dim }); });
    var sel = []; for (i = 0; i <= 100; i++) { var v2 = 0.003 + (vm - 0.003) * Math.pow(i / 100, 1.5), vb = bjtVBE(Math.max(s.IB * 1e-6, 1e-12), v2, P); sel.push([v2, bjtI(vb, vb - v2, P).IC]); }
    poly(g, Pc, sel.map(function (p) { return p[0]; }), sel.map(function (p) { return p[1]; }), '#fff', 2.4); poly(g, Pc, [0, s.VCC], [s.VCC / s.RC, 0], C.acc, 1.6, [6, 4]); dot(g, Pc.X(o.VCE), Pc.Y(o.IC), '#fff', 5.5, true);
    txt(g, 'Q: V_CE = ' + o.VCE.toFixed(2) + ' V, I_C = ' + eng(o.IC, 'A'), Pc.X(o.VCE) + 8, Pc.Y(o.IC) - 8, { s: 10, w: 600, a: o.VCE > vm * 0.6 ? 'right' : 'left' }); txt(g, 'load line', Pc.X(vm * 0.08), Pc.Y(s.VCC / s.RC * 0.9) - 6, { s: 9.5, c: C.acc });
    /* D: Gummel plot */
    var D = R[3]; card(g, D, 'Gummel plot (at the operating V_CE)'); var PD = plot(g, D, { xmin: 0.3, xmax: 0.9, ymin: 1e-12, ymax: 1e-1, ylog: true, xl: 'V_BE (V)', yl: 'current (A)', yt: [1e-12, 1e-9, 1e-6, 1e-3] });
    var VCEo = o.VCE; curve(g, PD, function (v) { return bjtI(v, v - VCEo, P).IC; }, C.acc, 2); curve(g, PD, function (v) { return bjtI(v, v - VCEo, P).IB; }, C.hole, 2);
    dot(g, PD.X(o.VBE), PD.Y(Math.max(o.IC, 1e-12)), C.acc, 5, true); dot(g, PD.X(o.VBE), PD.Y(Math.max(o.IB, 1e-12)), C.hole, 5, true); legend(g, PD.x + 8, PD.y + 74, [['I_C', C.acc], ['I_B', C.hole]]);
    txt(g, 'gap between the lines = β_F ≈ ' + s.bf + '; both rise 10× per 60 mV', PD.x + PD.w - 6, PD.y + PD.h - 8, { a: 'right', s: 9.5, c: C.dim });
  }
};

/* ================= TAB 6: MOSFET ================= */
function mosModel(s) {
  var mp = mosParams({ NA: Math.pow(10, s.lNA), tox: s.tox, gate: s.gate, T: 300 }), L = Math.pow(10, s.lL), n = 1 + ESI / mp.Wmax / mp.Cox;
  return { mp: mp, L: L, o: { VT: mp.VT, Cox: mp.Cox, L: L, mu0: 400, sce: s.sce, lam: s.sce ? Math.min(0.4, 0.06 / L) : 0.04, dibl: Math.min(0.25, 0.012 / (L * L)), n: n }, n: n };
}
function isoBox(g, P, x, y, z, dx, dy, dz, col, alpha) {   // isometric cuboid; P = {ox,oy,sc}
  var pr = function (a, b, c) { return [P.ox + (a - b) * 0.866 * P.sc, P.oy + (a + b) * 0.5 * P.sc - c * P.sc]; }, f = function (pts, shade) { g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fillStyle = col; g.globalAlpha = alpha * shade; g.fill(); g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8; g.stroke(); };
  f([pr(x, y, z + dz), pr(x + dx, y, z + dz), pr(x + dx, y + dy, z + dz), pr(x, y + dy, z + dz)], 1.0);
  f([pr(x, y + dy, z), pr(x + dx, y + dy, z), pr(x + dx, y + dy, z + dz), pr(x, y + dy, z + dz)], 0.62);
  f([pr(x + dx, y, z), pr(x + dx, y + dy, z), pr(x + dx, y + dy, z + dz), pr(x + dx, y, z + dz)], 0.8);
}
var TAB_MOS = {
  id: 'mos', name: 'MOSFET',
  def: { VGS: 1.0, VDS: 1.0, tox: 2, lNA: 17, gate: 'mid', lL: 0, sce: false, Tfin: 7, logId: false },
  ctl: [
    { k: 'VGS', l: 'Gate voltage V_GS', min: -1, max: 2.5, step: 0.01, f: function (v) { return v.toFixed(2) + ' V'; } },
    { k: 'VDS', l: 'Drain voltage V_DS', min: 0, max: 2.5, step: 0.01, f: function (v) { return v.toFixed(2) + ' V'; } },
    { k: 'tox', l: 'Oxide thickness t_ox', min: 1, max: 10, step: 0.1, f: function (v) { return v.toFixed(1) + ' nm'; } },
    { k: 'lNA', l: 'Substrate doping N_A', min: 15, max: 18, step: 0.05, f: logfmt },
    { k: 'gate', l: 'Gate material', t: 's', o: [['n', 'n⁺ poly-Si'], ['mid', 'midgap metal'], ['p', 'p⁺ poly-Si']] },
    { k: 'lL', l: 'Channel length L', min: -1.7, max: 1, step: 0.02, f: function (v) { var L = Math.pow(10, v); return L < 1 ? (L * 1000).toFixed(0) + ' nm' : L.toFixed(1) + ' µm'; } },
    { k: 'sce', l: 'Short-channel effects (velocity sat., DIBL, CLM)', t: 'c' },
    { k: 'Tfin', l: 'Fin / sheet thickness T_fin', min: 3, max: 20, step: 0.5, f: function (v) { return v + ' nm'; } },
    { k: 'logId', l: 'Log scale for I_D–V_GS', t: 'c' }],
  cap: 'A positive gate voltage pulls electrons to the silicon surface. Below the threshold V_T the surface is merely depleted; above it a thin inversion layer of electrons forms and connects source and drain. For small V_DS the channel acts like a resistor; as V_DS approaches V_GS−V_T the channel at the drain end is pinched off, carriers are injected into the drain depletion region and the current saturates (square law). In short devices the carrier velocity saturates, the drain starts to lower the barrier (DIBL) and the gate loses control, which is why fins and gate-all-around wrap the gate around a thin channel.',
  eq: 'V<sub>T</sub> = V<sub>FB</sub> + 2φ<sub>F</sub> + √(2ε<sub>s</sub>qN<sub>A</sub>·2φ<sub>F</sub>)/C<sub>ox</sub> &nbsp; φ<sub>F</sub> = (kT/q) ln(N<sub>A</sub>/n<sub>i</sub>) &nbsp; C<sub>ox</sub> = ε<sub>ox</sub>/t<sub>ox</sub><br>Linear: I<sub>D</sub> = μC<sub>ox</sub>(W/L)[(V<sub>GS</sub>−V<sub>T</sub>)V<sub>DS</sub> − V<sub>DS</sub>²/2]<br>Saturation: I<sub>D</sub> = ½μC<sub>ox</sub>(W/L)(V<sub>GS</sub>−V<sub>T</sub>)²(1+λV<sub>DS</sub>), V<sub>DS,sat</sub> = V<sub>GS</sub>−V<sub>T</sub><br>Velocity sat.: V<sub>dsat</sub> = V<sub>ov</sub>E<sub>c</sub>L/(V<sub>ov</sub>+E<sub>c</sub>L), E<sub>c</sub> = 2v<sub>sat</sub>/μ, v<sub>sat</sub> = 10⁷ cm/s<br>Subthreshold: SS = n·(kT/q)ln10, n = 1 + C<sub>d</sub>/C<sub>ox</sub><br>Scale length λ = √(ε<sub>si</sub>t<sub>si</sub>t<sub>ox</sub>/(N<sub>g</sub>ε<sub>ox</sub>)); DIBL ≈ 0.8e<sup>−L/2λ</sup>',
  read: function (s) { var M = mosModel(s), r = mosId(s.VGS, s.VDS, M.o), ms = mosSurface(s.VGS, M.mp), reg = r.Vov < 0 ? 'cutoff / subthreshold' : s.VDS < r.Vdsat ? 'linear (triode)' : 'saturation';
    return [['Threshold V_T', M.mp.VT.toFixed(3) + ' V' + (s.sce ? ' (eff. ' + r.VT.toFixed(3) + ')' : '')], ['Region', reg], ['I_D (per µm width)', eng(r.I, 'A')], ['V_ov, V_dsat', r.Vov.toFixed(2) + ', ' + r.Vdsat.toFixed(2) + ' V'], ['C_ox', (M.mp.Cox * 1e6).toFixed(2) + ' µF/cm²'], ['Surface potential ψ_s', ms.ps.toFixed(3) + ' V (2φ_F = ' + (2 * M.mp.phiF).toFixed(3) + ')'], ['Inversion charge', sci(ms.Qinv / Q, 2) + ' e/cm²'], ['Subthreshold swing', (M.n * 59.5).toFixed(1) + ' mV/dec (n = ' + M.n.toFixed(2) + ')']]; },
  draw: function (g, w, h, s, t, x) {
    var R = lay(w, h, 3, 2, [[0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1], [0, 1, 1, 1], [1, 1, 2, 1]]), M = mosModel(s), mp = M.mp, o = M.o, r = mosId(s.VGS, s.VDS, o), ms = mosSurface(s.VGS, mp), i;
    /* A: cross-section */
    var A = R[0]; card(g, A, 'Cross-section: inversion layer'); var gx0 = A.x + 14, gw = A.w - 28, top = A.y + 96, sh = A.h - 124, sdw = gw * 0.24, chx0 = gx0 + sdw, chw = gw - 2 * sdw, ox = 8;
    g.fillStyle = 'rgba(255,143,163,.12)'; g.fillRect(gx0, top, gw, sh); g.fillStyle = 'rgba(110,231,255,.35)'; g.fillRect(gx0, top, sdw, sh * 0.4); g.fillRect(gx0 + gw - sdw, top, sdw, sh * 0.4);
    var wd = ms.ps > 0 ? Math.min(Math.sqrt(2 * ESI * ms.ps / (Q * mp.NA)) / mp.Wmax, 1) : 0, wpx = wd * sh * 0.55; g.fillStyle = 'rgba(150,160,190,.16)'; g.beginPath(); g.moveTo(chx0 - sdw * 0.1, top); g.lineTo(chx0 + chw + sdw * 0.1, top); g.lineTo(chx0 + chw, top + Math.max(wpx, 0)); g.lineTo(chx0, top + Math.max(wpx, 0)); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(chx0 - 6, top - ox, chw + 12, ox); g.fillStyle = C.gold; g.fillRect(chx0 - 6, top - ox - 22, chw + 12, 22); g.fillStyle = '#5a6685'; g.fillRect(gx0 + 6, top - 12, sdw - 12, 12); g.fillRect(gx0 + gw - sdw + 6, top - 12, sdw - 12, 12);
    txt(g, 'gate', chx0 + chw / 2, top - ox - 8, { a: 'center', s: 10, c: '#222', w: 600 }); txt(g, 'white strip = SiO₂ (' + s.tox + ' nm, not to scale)', A.x + 10, A.y + 31, { s: 9, c: C.dim }); txt(g, 'source n⁺', gx0 + sdw / 2, top + sh * 0.4 + 14, { a: 'center', s: 10, c: C.acc }); txt(g, 'drain n⁺', gx0 + gw - sdw / 2, top + sh * 0.4 + 14, { a: 'center', s: 10, c: C.acc }); txt(g, 'p-type substrate (N_A = ' + sci(mp.NA, 0) + ')', gx0 + gw / 2, top + sh - 7, { a: 'center', s: 10, c: C.hole });
    txt(g, 'S', gx0 + sdw / 2, top - 17, { a: 'center', s: 11, w: 700 }); txt(g, 'D', gx0 + gw - sdw / 2, top - 17, { a: 'center', s: 11, w: 700 }); txt(g, 'V_GS = ' + s.VGS.toFixed(2) + ' V', chx0 + chw / 2, top - ox - 30, { a: 'center', s: 10, c: C.gold });
    if (r.Vov > 0) { var Vde = Math.min(s.VDS, r.Vdsat), dmx = 3 + 20 * Math.min(r.Vov, 1.2) / 1.2, pinch = s.VDS > r.Vdsat ? clamp((s.VDS - r.Vdsat) / (s.VDS - r.Vdsat + 1.5), 0, 0.4) : 0, xe = 1 - pinch, N = 40;
      var tk = function (u) { var q2 = r.Vov * r.Vov - (r.Vov * r.Vov - Math.pow(r.Vov - Vde, 2)) * u; return dmx * Math.sqrt(Math.max(q2, 0)) / r.Vov; };
      g.beginPath(); g.moveTo(chx0 - sdw * 0.25, top); for (i = 0; i <= N; i++) { var u = xe * i / N; g.lineTo(chx0 + u * chw, top + tk(u / (1 - pinch + 1e-9) * (1 - pinch))); } g.lineTo(chx0 + xe * chw, top); g.closePath(); g.fillStyle = 'rgba(110,231,255,.85)'; g.fill();
      if (pinch > 0) { g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(chx0 + xe * chw, top); g.lineTo(chx0 + chw + sdw * 0.3, top); g.lineTo(chx0 + chw + sdw * 0.3, top + 18); g.lineTo(chx0 + xe * chw, top + 2); g.fill(); txt(g, 'pinch-off', chx0 + xe * chw, top + 34, { a: 'center', s: 9.5, c: '#fff' }); txt(g, 'drain depletion', chx0 + chw + 4, top + 32, { s: 8.5, c: C.dim }); }
      var nE = Math.round(10 * Math.min(r.Vov, 1.2) / 1.2) + 2, vsp = 0.15 + 0.5 * Math.min(Math.abs(r.I) * 1e4, 1); for (i = 0; i < nE; i++) { var uu = ((t * vsp + i / nE) % 1); dot(g, lerp(gx0 + sdw * 0.3, gx0 + gw - sdw * 0.3, uu), top + 2 + tk(clamp((uu * gw - sdw) / chw, 0, 1) * xe) * 0.5 * (0.6 + 0.4 * Math.sin(i * 3)), '#fff', 2); }
      txt(g, 'inversion layer (electrons)', chx0 + chw / 2, top + sh * 0.36, { a: 'center', s: 9.5, c: C.acc }); }
    else txt(g, ms.ps < 0 ? 'accumulation: holes pile up' : 'depletion only — no channel', chx0 + chw / 2, top + sh * 0.3, { a: 'center', s: 9.5, c: C.dim });
    arrow(g, gx0 + gw - sdw / 2, A.y + 36, gx0 + gw - sdw / 2, top - 22, C.gold, 1 + 4 * clamp(Math.log10(Math.max(Math.abs(r.I) * 1e6, 1)) / 4, 0, 1)); txt(g, 'I_D = ' + eng(r.I, 'A') + '/µm', gx0 + gw - sdw / 2 - 8, A.y + 40, { a: 'right', s: 10, c: C.gold, w: 600 });
    /* B: MOS band diagram */
    var B = R[1]; card(g, B, 'MOS band diagram (vertical cut under the gate)'); var Wd = Math.max(ms.ps > 0 ? Math.sqrt(2 * ESI * ms.ps / (Q * mp.NA)) : 0, 1e-8), Wm = mp.Wmax * 1.25, Egv = Eg(300), kT = KB * 300, EcEi = kT * Math.log(NC(300) / mp.ni);
    var Vox = s.VGS - mp.VFB - ms.ps, phiS = mp.phiF;
    var Ei2 = function (z) { return ms.ps >= 0 ? phiS - (z < Wd ? ms.ps * Math.pow(1 - z / Wd, 2) : 0) : phiS - ms.ps * Math.exp(-z / 5e-7); }, EcS = function (zz) { return Ei2(zz) + EcEi; };
    var Ec0 = EcS(0), oxTop = Ec0 + 3.1, oxBot = Ec0 - Egv - 4.4, EFg = -s.VGS, yAll = [oxTop, oxTop - Vox, oxBot, oxBot - Vox, EFg, EcS(Wm), EcS(Wm) - Egv, 0];
    var Pb = plot(g, B, { xmin: -0.35, xmax: 1, ymin: Math.min.apply(null, yAll) - 0.4, ymax: Math.max.apply(null, yAll) + 0.5, xt: [], xl: '', yl: 'electron energy (eV)', nozero: true, yt: [] });
    g.fillStyle = 'rgba(255,209,102,.16)'; g.fillRect(Pb.X(-0.35), Pb.y, Pb.X(-0.14) - Pb.X(-0.35), Pb.h); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(Pb.X(-0.14), Pb.y, Pb.X(0) - Pb.X(-0.14), Pb.h);
    txt(g, 'gate', Pb.X(-0.245), Pb.y + 12, { a: 'center', s: 9.5, c: C.gold }); txt(g, 'oxide', Pb.X(-0.07), Pb.y + 12, { a: 'center', s: 9.5, c: C.dim }); txt(g, 'p-Si →', Pb.X(0.5), Pb.y + 12, { a: 'center', s: 9.5, c: C.hole });
    curve(g, Pb, function (u) { return EcS(u * Wm); }, C.acc, 2.2, null, 0, 1, 200); curve(g, Pb, function (u) { return EcS(u * Wm) - Egv; }, C.green, 2.2, null, 0, 1, 200); curve(g, Pb, function (u) { return Ei2(u * Wm); }, 'rgba(255,255,255,.4)', 1, [4, 4], 0, 1, 200);
    poly(g, Pb, [-0.14, 0, 0], [oxTop - Vox, oxTop, Ec0], C.acc, 2); poly(g, Pb, [-0.14, 0, 0], [oxBot - Vox, oxBot, Ec0 - Egv], C.green, 2); line(g, Pb.X(-0.14), Pb.Y(oxTop - Vox), Pb.X(-0.14), Pb.Y(oxBot - Vox), 'rgba(255,255,255,.3)', 1, [3, 3]);
    line(g, Pb.X(-0.35), Pb.Y(EFg), Pb.X(-0.14), Pb.Y(EFg), C.gold, 2); line(g, Pb.X(0), Pb.Y(0), Pb.X(1), Pb.Y(0), C.gold, 1.8, [6, 3]);
    placeLabels(g, [[Pb.Y(0) - 7, 'E_F', C.gold], [Pb.Y(EcS(Wm)) - 7, 'E_c', C.acc], [Pb.Y(EcS(Wm) - Egv) + 6, 'E_v', C.green]], Pb.x + Pb.w - 4, 'right'); txt(g, 'E_F,gate = −qV_G', Pb.X(-0.34), Pb.Y(EFg) - 5, { s: 9.5, c: C.gold });
    var regime = ms.ps < 0 ? 'ACCUMULATION' : s.VGS < mp.VT ? (ms.ps < mp.phiF ? 'DEPLETION' : 'WEAK INVERSION') : 'STRONG INVERSION';
    txt(g, regime + '   ψ_s = ' + ms.ps.toFixed(2) + ' V', B.x + B.w / 2, B.y + B.h - 8, { a: 'center', s: 10.5, c: C.gold, w: 600 }); txt(g, 'gate | oxide | silicon depth →', B.x + B.w / 2, B.y + B.h - 22, { a: 'center', s: 9, c: C.dim });
    if (ms.ps > mp.phiF * 1.2) for (i = 0; i < 6; i++) dot(g, Pb.X(0.012 + i * 0.012), Pb.Y(EcS(0)) - 4, C.acc, 2.6);
    /* C: ID-VGS */
    var Cc = R[2]; card(g, Cc, 'Transfer curve I_D–V_GS (V_DS = ' + s.VDS.toFixed(2) + ' V)'); var PC;
    if (s.logId) { PC = plot(g, Cc, { xmin: -0.2, xmax: 2.2, ymin: 1e-12, ymax: 1e-2, ylog: true, xl: 'V_GS (V)', yl: 'I_D (A/µm)', yt: [1e-12, 1e-9, 1e-6, 1e-3] }); curve(g, PC, function (v) { return Math.abs(mosId(v, s.VDS, o).I); }, C.gold, 2.2); dot(g, PC.X(s.VGS), PC.Y(clamp(Math.abs(r.I), 1e-12, 1e-2)), '#fff', 5, true); txt(g, 'slope: ' + (M.n * 59.5).toFixed(0) + ' mV per decade', PC.x + 8, PC.y + 14, { s: 9.5, c: C.dim }); }
    else { var ym = 1.1 * Math.max(Math.abs(mosId(2.2, Math.max(s.VDS, 0.5), o).I), 1e-6); PC = plot(g, Cc, { xmin: -0.2, xmax: 2.2, ymin: 0, ymax: ym, xl: 'V_GS (V)', yl: 'I_D (mA/µm)', fy: function (v) { return +(v * 1e3).toPrecision(2); } }); curve(g, PC, function (v) { return mosId(v, s.VDS, o).I; }, C.gold, 2.2); dot(g, PC.X(s.VGS), PC.Y(clamp(r.I, 0, ym)), '#fff', 5, true); }
    line(g, PC.X(r.VT), PC.y, PC.X(r.VT), PC.y + PC.h, 'rgba(110,231,255,.6)', 1, [4, 3]); txt(g, 'V_T', PC.X(r.VT) + 3, PC.y + PC.h - 6, { s: 9.5, c: C.acc });
    /* D: ID-VDS family */
    var D = R[3]; card(g, D, 'Output curves I_D–V_DS'); var vg = [0.2, 0.4, 0.6, 0.8, 1.0].map(function (d) { return o.VT + d; }), ymx = 1.1 * Math.max(Math.abs(mosId(vg[4], 2.5, o).I), 1e-6);
    var PD = plot(g, D, { xmin: 0, xmax: 2.5, ymin: 0, ymax: ymx, xl: 'V_DS (V)', yl: 'I_D (mA/µm)', fy: function (v) { return +(v * 1e3).toPrecision(2); } });
    vg.forEach(function (v) { curve(g, PD, function (vd) { return mosId(v, vd, o).I; }, 'rgba(255,209,102,.7)', 1.5); txt(g, 'V_GS=' + v.toFixed(2), PD.x + PD.w - 3, PD.Y(mosId(v, 2.5, o).I) - 3, { a: 'right', s: 8.5, c: C.dim }); });
    if (r.Vov > 0) { var xsat = [], ysat = []; for (i = 0; i <= 40; i++) { var vgg = o.VT + 1.1 * i / 40, rr2 = mosId(vgg, 2.5, o); if (rr2.Vdsat < 2.5) { xsat.push(rr2.Vdsat); ysat.push(mosId(vgg, rr2.Vdsat, o).I); } } poly(g, PD, xsat, ysat, C.acc, 1.2, [4, 3]); }
    curve(g, PD, function (vd) { return mosId(s.VGS, vd, o).I; }, '#fff', 2.4); dot(g, PD.X(s.VDS), PD.Y(clamp(r.I, 0, ymx)), '#fff', 5.5, true); txt(g, 'V_DS,sat locus', PD.x + 8, PD.y + 14, { s: 9.5, c: C.acc }); txt(g, s.sce ? 'short-channel: lower V_dsat, higher slope' : 'ideal: flat after pinch-off (λ=0.04/V)', PD.x + PD.w - 6, PD.y + PD.h - 8, { a: 'right', s: 9, c: C.dim });
    /* E: architectures + DIBL */
    var E = R[4]; card(g, E, 'Why fins and gate-all-around? Gate control at small L'); var dw = E.w * 0.54 / 3, dy = E.y + 24, dh = E.h - 40, Tf = s.Tfin, Lnm = Math.pow(10, s.lL) * 1000;
    var arch = [{ n: 'Planar', ng: 1, tsi: mp.Wmax * 1e7, c: C.hole, f: '1 gate face' }, { n: 'FinFET', ng: 2.5, tsi: Tf, c: C.gold, f: '3 faces (tri-gate)' }, { n: 'Gate-all-around', ng: 4, tsi: Tf * 0.7, c: C.green, f: '4 faces, stacked sheets' }];
    arch.forEach(function (a, k) { var bx = E.x + 6 + k * dw, P = { ox: bx + dw / 2, oy: dy + dh * 0.64, sc: dw * 0.27 }; g.save(); g.beginPath(); g.rect(bx, dy, dw - 4, dh); g.clip();
      if (k === 0) { isoBox(g, P, -1.2, -1, -0.9, 2.4, 2, 0.9, '#7a86a8', 0.6); isoBox(g, P, -0.3, -0.6, 0, 0.6, 1.2, 0.18, C.gold, 0.85); isoBox(g, P, -1.2, -0.6, 0, 0.9, 1.2, 0.18, C.acc, 0.6); isoBox(g, P, 0.3 + 0.0, -0.6, 0, 0.9, 1.2, 0.18, C.acc, 0.6); }
      else if (k === 1) { isoBox(g, P, -1.2, -1, -0.9, 2.4, 2, 0.6, '#7a86a8', 0.6); isoBox(g, P, -0.18, -1, -0.3, 0.36, 2, 1.1, C.acc, 0.8); isoBox(g, P, -0.55, -0.25, -0.3, 1.1, 0.5, 1.25, C.gold, 0.5); }
      else { isoBox(g, P, -1.2, -1, -0.9, 2.4, 2, 0.5, '#7a86a8', 0.6); isoBox(g, P, -0.6, -0.3, -0.4, 1.2, 0.6, 1.9, C.gold, 0.28); for (var j = 0; j < 3; j++) isoBox(g, P, -0.45, -1, -0.1 + j * 0.5, 0.9, 2, 0.16, C.acc, 0.85); }
      g.restore(); txt(g, a.n, bx + dw / 2 - 2, E.y + E.h - 24, { a: 'center', s: 10.5, w: 600, c: a.c }); txt(g, a.f, bx + dw / 2 - 2, E.y + E.h - 10, { a: 'center', s: 9, c: C.dim }); });
    dotLegend(g, E.x + 10, E.y + 34, [[C.acc, 'silicon channel'], [C.gold, 'gate']]);
    var px = E.x + E.w * 0.57, PE = plot(g, { x: px, y: E.y + 2, w: E.w * 0.43 - 6, h: E.h - 4 }, { xmin: 10, xmax: 200, xlog: true, ymin: 1, ymax: 1000, ylog: true, xl: 'gate length L (nm)', yl: 'DIBL (mV/V)', xt: [10, 20, 50, 100, 200], fx: function (v) { return v; }, yt: [1, 10, 100, 1000], pl: 40, pt: 22, pb: 26 });
    var lam = arch.map(function (a) { return Math.sqrt(ESI / EOX * a.tsi * s.tox / a.ng); });
    arch.forEach(function (a, k) { curve(g, PE, function (L) { return 800 * Math.exp(-L / (2 * lam[k])); }, a.c, 2, null, 10, 200, 100); });
    legend(g, PE.x + PE.w - 96, PE.y + PE.h - 50, arch.map(function (a) { return [a.n, a.c]; }));
    line(g, PE.x, PE.Y(100), PE.x + PE.w, PE.Y(100), 'rgba(255,255,255,.35)', 1, [3, 3]); txt(g, 'target < 100', PE.x + 4, PE.Y(100) - 3, { s: 8.5, c: C.dim });
    if (Lnm >= 10 && Lnm <= 200) { line(g, PE.X(Lnm), PE.y, PE.X(Lnm), PE.y + PE.h, '#fff', 1, [3, 3]); arch.forEach(function (a, k) { dot(g, PE.X(Lnm), PE.Y(clamp(800 * Math.exp(-Lnm / (2 * lam[k])), 1, 1000)), a.c, 4); }); }
    txt(g, 'min. L for DIBL<100: ' + lam.map(function (l, k) { return Math.round(2 * l * Math.log(8)) + ' nm'; }).join(' / '), E.x + E.w - 8, E.y + 16, { a: 'right', s: 9.5, c: C.dim });
    txt(g, 'scale length λ = ' + lam.map(function (l) { return l.toFixed(1); }).join(' / ') + ' nm', E.x + E.w - 8, E.y + 30, { a: 'right', s: 9.5, c: C.dim });
  }
};

/* ================= TAB 7: CMOS ================= */
function cmosM(s) { var b = { Cox: 1.15e-6, L: 0.1, sce: false, lam: 0.05, dibl: 0, n: 1.3 }; return { VDD: s.VDD, Wr: s.Wr, nm: Object.assign({ VT: s.VTn, mu0: 400 }, b), pm: Object.assign({ VT: s.VTp, mu0: 160 }, b) }; }
function cIout(Vin, Vo, M) { return M.Wr * mosId(M.VDD - Vin, M.VDD - Vo, M.pm).I - mosId(Vin, Vo, M.nm).I; }
function cVout(Vin, M) { var lo = 0, hi = M.VDD, i, m; for (i = 0; i < 50; i++) { m = (lo + hi) / 2; if (cIout(Vin, m, M) > 0) lo = m; else hi = m; } return (lo + hi) / 2; }
function cmosVTC(s) {
  return memo('vtc' + [s.VDD, s.VTn, s.VTp, s.Wr].join(), function () {
    var M = cmosM(s), N = 160, vin = [], vo = [], i; for (i = 0; i <= N; i++) { vin.push(s.VDD * i / N); vo.push(cVout(s.VDD * i / N, M)); }
    var VIL = null, VIH = null, VM = null; for (i = 1; i <= N; i++) { var sl = (vo[i] - vo[i - 1]) / (vin[i] - vin[i - 1]); if (VIL === null && sl < -1) VIL = vin[i]; if (sl < -1) VIH = vin[i]; if (VM === null && vo[i] <= vin[i]) VM = vin[i]; }
    VIL = VIL || 0; VIH = VIH || s.VDD; var VOH = cVout(VIL, M), VOL = cVout(VIH, M);
    var gain = 0; for (i = 1; i <= N; i++) gain = Math.max(gain, -(vo[i] - vo[i - 1]) / (vin[i] - vin[i - 1]));
    return { vin: vin, vo: vo, VIL: VIL, VIH: VIH, VOH: VOH, VOL: VOL, VM: VM, NMH: VOH - VIH, NML: VIL - VOL, gain: gain };
  });
}
function cmosTran(s) {
  return memo('tr' + [s.VDD, s.VTn, s.VTp, s.Wr, s.C].join(), function () {
    var M = cmosM(s), C = s.C * 1e-15, isat = Math.abs(mosId(s.VDD, s.VDD, M.nm).I), tau = C * s.VDD / isat, half = 14 * tau, tr = 0.4 * tau, N = 1600, dt = half / N * 2, ts = [], vi = [], vo = [], ip = [], v = s.VDD, t = 0, i, k = 0;
    var Tt = 2 * half, steps = Math.round(Tt / dt); for (i = 0; i <= steps; i++) { t = i * dt; var vin = t < half ? clamp(t / tr, 0, 1) * s.VDD : s.VDD * (1 - clamp((t - half) / tr, 0, 1)); var I = cIout(vin, v, M); v = clamp(v + I / C * dt, 0, s.VDD); if (i % 4 === 0) { ts.push(t); vi.push(vin); vo.push(v); ip.push(M.Wr * mosId(s.VDD - vin, s.VDD - v, M.pm).I); } }
    function cross(from, to, lvl, falling) { for (var j = 1; j < ts.length; j++) if (ts[j] >= from && ts[j] <= to && ((falling && vo[j - 1] > lvl && vo[j] <= lvl) || (!falling && vo[j - 1] < lvl && vo[j] >= lvl))) return ts[j]; return NaN; }
    var thl = cross(0, half, s.VDD / 2, true) - tr / 2, tlh = cross(half, Tt, s.VDD / 2, false) - half - tr / 2;
    return { ts: ts, vi: vi, vo: vo, ip: ip, T: Tt, half: half, tHL: thl, tLH: tlh, tau: tau };
  });
}
function mosSym(g, cx, cy, kind, on, lbl, gateHi) {   // vertical transistor symbol; returns {top:[x,y], bot:[x,y], gate:[x,y]}
  var col = on ? C.gold : '#7d89a8'; g.save(); g.lineWidth = 2; g.strokeStyle = col; g.beginPath(); g.moveTo(cx - 3, cy - 13); g.lineTo(cx - 3, cy + 13); g.stroke(); g.beginPath(); g.moveTo(cx - 8, cy - 10); g.lineTo(cx - 8, cy + 10); g.stroke();
  g.beginPath(); g.moveTo(cx - 3, cy - 11); g.lineTo(cx + 12, cy - 11); g.lineTo(cx + 12, cy - 20); g.moveTo(cx - 3, cy + 11); g.lineTo(cx + 12, cy + 11); g.lineTo(cx + 12, cy + 20); g.moveTo(cx - 3, cy); g.lineTo(cx + 12, cy); g.stroke();
  var gx = cx - 8; if (kind === 'p') { g.beginPath(); g.arc(cx - 12, cy, 3.5, 0, 6.3); g.stroke(); gx = cx - 15.5; }
  g.beginPath(); g.moveTo(gx, cy); g.lineTo(cx - 26, cy); g.stroke(); if (kind === 'n') { arrow(g, cx + 4, cy + 11, cx + 0, cy + 11, col, 1); } else arrow(g, cx + 2, cy + 11, cx + 8, cy + 11, col, 1);
  if (lbl) txt(g, lbl, cx - 28, cy - 5, { a: 'right', s: 10, c: gateHi ? C.gold : C.dim, w: 600 }); g.restore(); return { top: [cx + 12, cy - 20], bot: [cx + 12, cy + 20] };
}
var TAB_CMOS = {
  id: 'cmos', name: 'CMOS',
  def: { VDD: 1.2, VTn: 0.4, VTp: 0.4, Wr: 2.5, Vin: 0.6, auto: true, C: 10, lf: 2.7, alpha: 0.1, lN: 7, gate: 'nand', A: true, B: true },
  ctl: [
    { k: 'VDD', l: 'Supply V_DD', min: 0.5, max: 1.8, step: 0.05, f: function (v) { return v.toFixed(2) + ' V'; } },
    { k: 'VTn', l: 'nMOS threshold V_Tn', min: 0.15, max: 0.7, step: 0.01, f: function (v) { return v.toFixed(2) + ' V'; } },
    { k: 'VTp', l: 'pMOS threshold |V_Tp|', min: 0.15, max: 0.7, step: 0.01, f: function (v) { return v.toFixed(2) + ' V'; } },
    { k: 'Wr', l: 'Width ratio W_p/W_n', min: 0.5, max: 6, step: 0.1, f: function (v) { return v.toFixed(1) + '×'; } },
    { k: 'auto', l: 'Animate switching (square-wave input)', t: 'c' },
    { k: 'Vin', l: 'Manual input V_in', min: 0, max: 1.8, step: 0.01, f: function (v) { return v.toFixed(2) + ' V'; }, show: function (s) { return !s.auto; } },
    { k: 'C', l: 'Load capacitance C', min: 1, max: 100, step: 1, f: function (v) { return v + ' fF'; } },
    { k: 'lf', l: 'Clock frequency f', min: 0, max: 3.9, step: 0.05, f: function (v) { return eng(Math.pow(10, v) * 1e6, 'Hz', 3); } },
    { k: 'alpha', l: 'Activity factor α', min: 0.01, max: 1, step: 0.01, f: function (v) { return v.toFixed(2); } },
    { k: 'lN', l: 'Gates on chip', min: 3, max: 10, step: 0.1, f: function (v) { return sci(Math.pow(10, v), 1); } },
    { k: 'gate', l: 'Logic gate', t: 's', o: [['nand', 'NAND (2-input)'], ['nor', 'NOR (2-input)']] },
    { k: 'A', l: 'Input A = 1', t: 'c' }, { k: 'B', l: 'Input B = 1', t: 'c' }],
  cap: 'A CMOS inverter pairs a pMOS pull-up with an nMOS pull-down. For a low input only the pMOS conducts and the output is high; for a high input only the nMOS conducts and the output is low, so almost no static current flows. The voltage-transfer curve is where the two I–V curves intersect (load line picture); the steep middle region gives gain and defines the noise margins. Every output transition charges or discharges a load capacitance, costing C·V² of energy, so dynamic power is α·C·V²·f — quadratic in supply voltage, which is why voltage scaling matters.',
  eq: 'Solve I<sub>Dn</sub>(V<sub>in</sub>, V<sub>out</sub>) = I<sub>Dp</sub>(V<sub>DD</sub>−V<sub>in</sub>, V<sub>DD</sub>−V<sub>out</sub>) for V<sub>out</sub><br>Noise margins: NM<sub>H</sub> = V<sub>OH</sub> − V<sub>IH</sub>, NM<sub>L</sub> = V<sub>IL</sub> − V<sub>OL</sub> (points where dV<sub>out</sub>/dV<sub>in</sub> = −1)<br>Switching: C·dV<sub>out</sub>/dt = I<sub>p</sub> − I<sub>n</sub>; t<sub>pd</sub> ≈ 0.7·C·V<sub>DD</sub>/I<sub>sat</sub><br>P<sub>dyn</sub> = α·C·V<sub>DD</sub>²·f &nbsp; E/transition = ½CV<sub>DD</sub>² (½ stored, ½ dissipated)<br>NAND: pMOS parallel, nMOS series &nbsp; NOR: pMOS series, nMOS parallel',
  read: function (s) { var V = cmosVTC(s), tr = cmosTran(s), P = s.alpha * s.C * 1e-15 * s.VDD * s.VDD * Math.pow(10, s.lf) * 1e6;
    return [['Switching threshold V_M', (V.VM || 0).toFixed(3) + ' V'], ['V_IL / V_IH', V.VIL.toFixed(3) + ' / ' + V.VIH.toFixed(3) + ' V'], ['NM_L / NM_H', V.NML.toFixed(3) + ' / ' + V.NMH.toFixed(3) + ' V'], ['Peak gain', V.gain.toFixed(1)], ['t_pHL / t_pLH', eng(tr.tHL, 's', 2) + ' / ' + eng(tr.tLH, 's', 2)], ['Energy C·V² per cycle', eng(s.C * 1e-15 * s.VDD * s.VDD, 'J', 3)], ['P per gate', eng(P, 'W', 3)], ['Chip dynamic power', eng(P * Math.pow(10, s.lN), 'W', 3)]]; },
  draw: function (g, w, h, s, t, x) {
    var R = lay(w, h, 6, 2, [[0, 0, 2, 1], [2, 0, 2, 1], [4, 0, 2, 1], [0, 1, 2, 1], [2, 1, 2, 1], [4, 1, 2, 1]]), M = cmosM(s), V = cmosVTC(s), tr = cmosTran(s), i, VDD = s.VDD;
    var u = s.auto ? (t * 0.12) % 1 : 0, ti = u * tr.T, ix = clamp(Math.floor(ti / (tr.T / (tr.ts.length - 1))), 0, tr.ts.length - 1);
    var vinN = s.auto ? tr.vi[ix] : Math.min(s.Vin, VDD), voN = s.auto ? tr.vo[ix] : cVout(vinN, M);
    /* A: VTC */
    var A = R[0]; card(g, A, 'Voltage-transfer curve V_out(V_in)'); var PA = plot(g, A, { xmin: 0, xmax: VDD, ymin: 0, ymax: VDD * 1.02, xl: 'V_in (V)', yl: 'V_out (V)' });
    curve(g, PA, function (v) { return v; }, 'rgba(255,255,255,.25)', 1, [3, 3]); poly(g, PA, V.vin, V.vo, C.gold, 2.4);
    g.fillStyle = 'rgba(126,231,135,.13)'; g.fillRect(PA.X(0), PA.Y(V.VOH), PA.X(V.VIL) - PA.X(0), PA.Y(V.VOL + (V.VOH - V.VOL)) - PA.Y(V.VOH) + (PA.Y(VDD) - PA.Y(V.VOH)) * 0); g.fillStyle = 'rgba(126,231,135,.14)'; g.fillRect(PA.X(0), PA.Y(VDD), PA.X(V.VIL) - PA.X(0), PA.Y(V.VOH) - PA.Y(VDD) + 0); g.fillStyle = 'rgba(255,143,163,.14)'; g.fillRect(PA.X(V.VIH), PA.Y(V.VOL), PA.X(VDD) - PA.X(V.VIH), PA.Y(0) - PA.Y(V.VOL));
    [[V.VIL, V.VOH], [V.VIH, V.VOL]].forEach(function (p) { dot(g, PA.X(p[0]), PA.Y(p[1]), C.acc, 4.5, true); });
    txt(g, 'V_IL = ' + V.VIL.toFixed(2), PA.X(V.VIL) - 7, PA.Y(V.VOH) + 14, { a: 'right', s: 9.5, c: C.acc }); txt(g, 'V_IH = ' + V.VIH.toFixed(2), PA.X(V.VIH) + 7, PA.Y(V.VOL) - 8, { s: 9.5, c: C.acc }); txt(g, 'NM_L ' + V.NML.toFixed(2), PA.X(VDD * 0.02) + 4, PA.Y(V.VOH) + 14, { s: 9.5, c: C.green }); txt(g, 'NM_H ' + V.NMH.toFixed(2), PA.X(VDD) - 4, PA.Y(V.VOL) - 6, { a: 'right', s: 9.5, c: C.hole });
    dot(g, PA.X(V.VM || 0), PA.Y(V.VM || 0), '#fff', 3.5); txt(g, 'V_M', PA.X(V.VM || 0) + 6, PA.Y(V.VM || 0) - 6, { s: 9.5 }); dot(g, PA.X(vinN), PA.Y(voN), '#fff', 5.5, true);
    /* B: load-line intersection */
    var B = R[1]; card(g, B, 'Load-line picture at V_in = ' + vinN.toFixed(2) + ' V'); var imx = 1e-6; for (i = 0; i <= 24; i++) { var vv = VDD * i / 24; imx = Math.max(imx, mosId(vinN, vv, M.nm).I, M.Wr * mosId(VDD - vinN, VDD - vv, M.pm).I); } imx *= 1.2;
    var PB = plot(g, B, { xmin: 0, xmax: VDD, ymin: 0, ymax: imx, xl: 'V_out (V)', yl: 'current (mA)', fy: function (v) { return +(v * 1e3).toPrecision(2); } });
    curve(g, PB, function (vo) { return mosId(vinN, vo, M.nm).I; }, C.acc, 2.2); curve(g, PB, function (vo) { return M.Wr * mosId(VDD - vinN, VDD - vo, M.pm).I; }, C.hole, 2.2);
    var vsol = cVout(vinN, M), isol = mosId(vinN, vsol, M.nm).I; dot(g, PB.X(vsol), PB.Y(clamp(isol, 0, imx)), '#fff', 5.5, true); legend(g, PB.x + 8, PB.y + 14, [['nMOS I_Dn(V_out)', C.acc], ['pMOS I_Dp(V_DD−V_out)', C.hole]]);
    txt(g, 'intersection → V_out = ' + vsol.toFixed(2) + ' V, I = ' + eng(isol, 'A') + (isol < 1e-9 ? '' : ' (short-circuit)'), PB.x + PB.w - 6, PB.y + PB.h - 8, { a: 'right', s: 9.5, c: C.dim });
    /* C: inverter schematic */
    var Cc = R[2]; card(g, Cc, 'Inverter at this instant'); var cx = Cc.x + Cc.w * 0.45, yv = Cc.y + 40, yg = Cc.y + Cc.h - 40, ym = (yv + yg) / 2, pOn = VDD - vinN > s.VTp, nOn = vinN > s.VTn, Ipn = M.Wr * mosId(VDD - vinN, VDD - voN, M.pm).I, Inn = mosId(vinN, voN, M.nm).I;
    line(g, cx - 50, yv, cx + 90, yv, '#9aa7c7', 2); txt(g, 'V_DD', cx + 90, yv - 6, { a: 'right', s: 10, c: C.dim }); line(g, cx - 50, yg, cx + 90, yg, '#9aa7c7', 2); txt(g, 'GND', cx + 90, yg + 13, { a: 'right', s: 10, c: C.dim });
    var sp = mosSym(g, cx, ym - 50, 'p', pOn, '', 0), sn = mosSym(g, cx, ym + 50, 'n', nOn, '', 0);
    line(g, sp.top[0], sp.top[1], sp.top[0], yv, pOn ? C.gold : '#7d89a8', 2); line(g, sn.bot[0], sn.bot[1], sn.bot[0], yg, nOn ? C.gold : '#7d89a8', 2); line(g, sp.bot[0], sp.bot[1], sn.top[0], sn.top[1], '#9aa7c7', 2);
    line(g, cx - 26, ym - 50, cx - 40, ym - 50, '#9aa7c7', 2); line(g, cx - 26, ym + 50, cx - 40, ym + 50, '#9aa7c7', 2); line(g, cx - 40, ym - 50, cx - 40, ym + 50, '#9aa7c7', 2); line(g, cx - 40, ym, cx - 70, ym, '#9aa7c7', 2); dot(g, cx - 40, ym, '#9aa7c7', 3); dot(g, cx + 12, ym, '#9aa7c7', 3);
    line(g, cx + 12, ym, cx + 60, ym, '#9aa7c7', 2); line(g, cx + 60, ym, cx + 60, ym + 12, '#9aa7c7', 2); line(g, cx + 50, ym + 12, cx + 70, ym + 12, '#cfd7ee', 2); line(g, cx + 50, ym + 18, cx + 70, ym + 18, '#cfd7ee', 2); line(g, cx + 60, ym + 18, cx + 60, ym + 30, '#9aa7c7', 2); line(g, cx + 52, ym + 30, cx + 68, ym + 30, '#9aa7c7', 2);
    txt(g, 'C = ' + s.C + ' fF', cx + 76, ym + 20, { s: 9.5, c: C.dim }); txt(g, 'V_in ' + vinN.toFixed(2), cx - 72, ym - 6, { a: 'right', s: 10.5, c: C.gold, w: 600 }); txt(g, 'V_out ' + voN.toFixed(2), cx + 60, ym - 8, { a: 'center', s: 10.5, c: C.acc, w: 600 });
    txt(g, pOn ? 'pMOS ON' : 'pMOS off', cx + 40, ym - 50, { s: 10, c: pOn ? C.gold : C.dim }); txt(g, nOn ? 'nMOS ON' : 'nMOS off', cx + 40, ym + 54, { s: 10, c: nOn ? C.gold : C.dim });
    var ph = (t * 1.5) % 1; if (Math.abs(Ipn) > 1e-7 && pOn) for (i = 0; i < 3; i++) dot(g, sp.top[0], lerp(yv, sp.bot[1], (ph + i / 3) % 1), C.hole, 3); if (Math.abs(Inn) > 1e-7 && nOn) for (i = 0; i < 3; i++) dot(g, sn.top[0], lerp(sn.top[1], yg, (ph + i / 3) % 1), C.acc, 3);
    txt(g, Math.abs(Ipn) > 1e-5 && Math.abs(Inn) > 1e-5 ? 'both on: brief short-circuit current' : vinN < VDD / 2 ? 'input low → output pulled high' : 'input high → output pulled low', Cc.x + Cc.w / 2, Cc.y + Cc.h - 8, { a: 'center', s: 9.5, c: C.dim });
    /* D: transient */
    var D = R[3]; card(g, D, 'Switching waveforms (transient)'); var PD = plot(g, D, { xmin: 0, xmax: tr.T, ymin: -0.05 * VDD, ymax: 1.1 * VDD, xl: 'time', yl: 'voltage (V)', fx: function (v) { return eng(v, 's', 2); }, xt: [0, tr.T / 4, tr.T / 2, 3 * tr.T / 4, tr.T] });
    poly(g, PD, tr.ts, tr.vi, C.gold, 1.8, [5, 3]); poly(g, PD, tr.ts, tr.vo, C.acc, 2.4); legend(g, PD.x + 8, PD.y + 14, [['V_in', C.gold, 0, [5, 3]], ['V_out', C.acc]]);
    var imaxp = Math.max.apply(null, tr.ip.map(Math.abs)); poly(g, PD, tr.ts, tr.ip.map(function (v) { return Math.max(0, v) / imaxp * VDD * 0.45; }), 'rgba(255,143,163,.7)', 1.2); txt(g, 'pMOS supply current (scaled)', PD.x + PD.w - 6, PD.y + PD.h - 8, { a: 'right', s: 9, c: C.hole });
    if (s.auto) line(g, PD.X(ti), PD.y, PD.X(ti), PD.y + PD.h, '#fff', 1);
    line(g, PD.X(tr.half), PD.y, PD.X(tr.half), PD.y + PD.h, 'rgba(255,255,255,.15)', 1); txt(g, 't_pHL = ' + eng(tr.tHL, 's', 2), PD.X(tr.half * 0.5), PD.Y(VDD * 0.5) - 8, { a: 'center', s: 9.5, c: C.acc }); txt(g, 't_pLH = ' + eng(tr.tLH, 's', 2), PD.X(tr.half * 1.5), PD.Y(VDD * 0.5) + 14, { a: 'center', s: 9.5, c: C.acc });
    /* E: logic gate */
    var E = R[4]; card(g, E, (s.gate === 'nand' ? 'NAND' : 'NOR') + ' gate — transistor level'); var A_ = s.A ? 1 : 0, B_ = s.B ? 1 : 0, out = s.gate === 'nand' ? 1 - (A_ & B_) : 1 - (A_ | B_), nand = s.gate === 'nand';
    var gx = E.x + 66, top = E.y + 36, bot = E.y + E.h - 28, mid = (top + bot) / 2, onP = function (v) { return !v; }, onN = function (v) { return !!v; }, pc = out ? C.gold : '#7d89a8', nc = !out ? C.gold : '#7d89a8';
    line(g, gx - 20, top, gx + 140, top, '#9aa7c7', 2); txt(g, 'V_DD', gx - 20, top - 5, { s: 10, c: C.dim }); line(g, gx - 20, bot, gx + 140, bot, '#9aa7c7', 2); txt(g, 'GND', gx - 20, bot + 13, { s: 10, c: C.dim });
    var xa = gx + 20, xb = gx + 90, wire = function (p, q, on) { line(g, p[0], p[1], q[0], q[1], on ? C.gold : '#7d89a8', 2); }, outX = gx + 160;
    if (nand) {
      var pA = mosSym(g, xa, (top + mid) / 2 + 2, 'p', onP(A_), 'A', A_), pB = mosSym(g, xb, (top + mid) / 2 + 2, 'p', onP(B_), 'B', B_); [pA, pB].forEach(function (p, k) { wire(p.top, [p.top[0], top], out && onP(k ? B_ : A_)); wire(p.bot, [p.bot[0], mid], out && onP(k ? B_ : A_)); });
      line(g, pA.bot[0], mid, pB.bot[0], mid, out ? C.gold : '#7d89a8', 2); var nA = mosSym(g, xa, mid + (bot - mid) * 0.3, 'n', onN(A_), 'A', A_), nB = mosSym(g, xa, mid + (bot - mid) * 0.74, 'n', onN(B_), 'B', B_);
      wire(nA.top, [nA.top[0], mid], !out); wire(nA.bot, nB.top, !out && onN(A_)); wire(nB.bot, [nB.bot[0], bot], !out); dot(g, pA.bot[0], mid, '#9aa7c7', 3);
    } else {
      var q1 = mosSym(g, xa, top + (mid - top) * 0.3, 'p', onP(A_), 'A', A_), q2 = mosSym(g, xa, top + (mid - top) * 0.74, 'p', onP(B_), 'B', B_); wire(q1.top, [q1.top[0], top], out); wire(q1.bot, q2.top, out && onP(A_)); wire(q2.bot, [q2.bot[0], mid], out);
      var r1 = mosSym(g, xa, (mid + bot) / 2 - 2, 'n', onN(A_), 'A', A_), r2 = mosSym(g, xb, (mid + bot) / 2 - 2, 'n', onN(B_), 'B', B_); [r1, r2].forEach(function (p) { wire(p.top, [p.top[0], mid], !out); wire(p.bot, [p.bot[0], bot], !out); }); line(g, r1.top[0], mid, r2.top[0], mid, !out ? C.gold : '#7d89a8', 2);
    }
    line(g, xa + 12, mid, outX, mid, '#9aa7c7', 2); dot(g, xa + 12, mid, '#9aa7c7', 3); dot(g, outX, mid, out ? C.gold : C.acc, 5); txt(g, 'OUT = ' + out, outX + 8, mid + 4, { s: 11, c: out ? C.gold : C.acc, w: 700 });
    txt(g, nand ? 'pull-up: parallel pMOS' : 'pull-up: series pMOS', gx + 150, top + 16, { a: 'right', s: 9, c: C.dim }); txt(g, nand ? 'pull-down: series nMOS' : 'pull-down: parallel nMOS', gx + 150, bot - 8, { a: 'right', s: 9, c: C.dim });
    var tx = E.x + E.w - 108, ty = E.y + 52; txt(g, 'A  B  OUT', tx, ty, { s: 10.5, w: 600, c: C.acc, f: 'monospace' }); for (i = 0; i < 4; i++) { var a = i >> 1, b = i & 1, o2 = nand ? 1 - (a & b) : 1 - (a | b), cur = a === A_ && b === B_; if (cur) { g.fillStyle = 'rgba(255,209,102,.18)'; g.fillRect(tx - 6, ty + 6 + i * 18, 104, 17); } txt(g, a + '  ' + b + '   ' + o2, tx, ty + 19 + i * 18, { s: 11, f: 'monospace', c: cur ? C.gold : C.text }); }
    txt(g, 'toggle A and B in the controls', tx - 6, ty + 96, { s: 9, c: C.dim });
    /* F: dynamic power */
    var F = R[5]; card(g, F, 'Dynamic power  P = α·C·V²·f'); var f = Math.pow(10, s.lf) * 1e6, Pg = function (v) { return s.alpha * s.C * 1e-15 * v * v * f; }, ymx = Pg(1.8);
    var PF = plot(g, F, { xmin: 0.4, xmax: 1.8, ymin: 0, ymax: ymx * 1.05, xl: 'V_DD (V)', yl: 'power per gate', fy: function (v) { return eng(v, 'W', 2).replace(' ', ''); }, pl: 52 }); curve(g, PF, Pg, C.gold, 2.2, null, 0.4, 1.8, 80); dot(g, PF.X(VDD), PF.Y(Pg(VDD)), '#fff', 5, true);
    txt(g, 'P/gate = ' + eng(Pg(VDD), 'W', 3), PF.x + 8, PF.y + 14, { s: 10.5, c: C.gold, w: 600 }); txt(g, 'toy estimate, chip (' + sci(Math.pow(10, s.lN), 1) + ' gates, all switching): ' + eng(Pg(VDD) * Math.pow(10, s.lN), 'W', 3), PF.x + 8, PF.y + 28, { s: 10, c: C.text });
    txt(g, 'E/cycle = C·V² = ' + eng(s.C * 1e-15 * VDD * VDD, 'J', 3) + '  —  halve V, ¼ the power', PF.x + PF.w - 6, PF.y + PF.h - 8, { a: 'right', s: 9.5, c: C.dim });
  }
};

/* ================= TAB 8: Fabrication ================= */
var FAB = [
  ['Start: silicon wafer', 'Everything begins with a wafer of ultra-pure single-crystal silicon sliced from an ingot and polished flat to atomic smoothness. This one is lightly boron-doped (p-type). We will build one n-channel transistor in a 240 nm wide window; a real chip repeats this billions of times.'],
  ['Thermal oxidation (gate oxide)', 'Heating the wafer in oxygen at ~900 °C grows a thin layer of silicon dioxide (glass) directly on the silicon — a superb insulator. Here only 2 nm thick: about 8 atoms. It will become the gate dielectric.'],
  ['Deposit polysilicon', 'A gas (silane, SiH₄) decomposes on the hot wafer and deposits a 60 nm film of polycrystalline silicon by chemical vapour deposition (CVD). Heavily doped, it conducts like a metal and will form the transistor gate.'],
  ['Spin on photoresist', 'The wafer is spun at thousands of rpm while a drop of light-sensitive polymer (photoresist) spreads into a uniform film about 80 nm thick.'],
  ['Lithography: expose', 'Deep-ultraviolet light shines through a photomask — a glass plate with a chrome pattern — and a lens system shrinks the image 4× onto the resist. Where light hits, the resist chemistry changes and becomes soluble. Shadows of the chrome protect the future gate.'],
  ['Develop', 'A chemical developer washes away the exposed resist. What remains is a 40 nm wide resist stripe: the pattern of the mask has been transferred into the resist.'],
  ['Etch polysilicon', 'A plasma of reactive ions (Cl₂/HBr) bombards the wafer vertically and removes polysilicon wherever it is not protected by resist. The etch stops on the oxide below, leaving a tall, narrow gate.'],
  ['Strip resist', 'The resist has done its job and is removed with an oxygen plasma and chemical clean. The gate stack — poly-Si on 2 nm oxide — stands alone, 40 nm long.'],
  ['Ion implantation (source & drain)', 'Arsenic or phosphorus ions are accelerated to tens of keV and fired into the wafer. The gate blocks them, so the n⁺ source and drain form self-aligned on both sides of the channel. A rapid anneal then repairs the crystal and activates the dopants.'],
  ['Deposit dielectric (ILD)', 'A thick layer of silicon dioxide is deposited over everything to insulate the transistor from the wiring that comes next. It copies the bumpy topography underneath.'],
  ['CMP: planarise', 'Chemical-mechanical polishing — a slurry of nanoparticles and a spinning pad — grinds the surface flat to within a few nanometres. Flat surfaces are essential for the next lithography steps to stay in focus.'],
  ['Etch contact holes', 'Another lithography and etch round opens narrow holes through the dielectric, down to the source and drain regions (and the gate, out of this view).'],
  ['Deposit metal', 'The holes are filled with metal (tungsten or copper, with a thin barrier) by CVD or electroplating. Some metal overfills and covers the whole surface.'],
  ['CMP metal → plugs', 'A second polish removes the metal on top and leaves metal only inside the holes: tiny wires (plugs) connecting the silicon to the first wiring level.'],
  ['Metal 1 wiring (damascene)', 'More dielectric is laid down, trenches are etched, filled with copper and polished (damascene process). Repeating this builds 10–15 stacked wiring layers that connect billions of transistors into circuits. Then the wafer is tested, diced and packaged.']
];
var FABC = { si: '#56668c', ox: 'rgba(140,205,255,.55)', poly: '#c8935c', resist: 'rgba(255,120,200,.6)', nplus: '#25c7dc', w: '#a4abb8', cu: '#e0894f' };
function fabScene(g, r, k, p, t, x) {
  var X0 = 0, X1 = 240, YB = -90, YT = [90, 90, 120, 165, 262, 172, 172, 172, 172, 235, 235, 190, 190, 190, 262][k], sc = Math.min(r.w / (X1 - X0), r.h / (YT - YB)), ox = r.x + (r.w - (X1 - X0) * sc) / 2, oy = r.y + r.h - 6 + YB * sc;
  var wx = function (v) { return ox + (v - X0) * sc; }, wy = function (v) { return oy - (v - YB) * sc * 1 + 0; };
  wy = function (v) { return r.y + r.h - 6 - (v - YB) * sc; };
  function box(x0, y0, x1, y1, col) { if (y1 <= y0 || x1 <= x0) return; g.fillStyle = col; g.fillRect(wx(x0), wy(y1), (x1 - x0) * sc, (y1 - y0) * sc); }
  function lbl(s, xx, yy, col, a) { txt(g, s, wx(xx), wy(yy), { a: a || 'left', s: 10, c: col || C.text, w: 600 }); }
  var GX0 = 100, GX1 = 140, GT = 62, T = smooth(p);
  box(0, -90, 240, 0, FABC.si); lbl('p-type silicon substrate', 6, -80, 'rgba(255,255,255,.75)');
  if (k >= 8) { var a = k === 8 ? T : 1; g.globalAlpha = 0.25 + 0.75 * a; box(0, -34, 98, 0, FABC.nplus); box(142, -34, 240, 0, FABC.nplus); box(92, -22, 100, 0, FABC.nplus); box(140, -22, 148, 0, FABC.nplus); g.globalAlpha = 1; if (k >= 8) { lbl('source (n⁺)', 6, -18, '#022', 'left'); lbl('drain (n⁺)', 234, -18, '#022', 'right'); } }
  if (k >= 1) box(0, 0, 240, k === 1 ? 2 * T : 2, FABC.ox);
  var polyTop = k === 2 ? 2 + 60 * T : GT;
  if (k >= 2 && k < 6) box(0, 2, 240, polyTop, FABC.poly);
  if (k === 6) { var tp = GT - 60 * T; box(0, 2, GX0, Math.max(tp, 2), FABC.poly); box(GX1, 2, 240, Math.max(tp, 2), FABC.poly); box(GX0, 2, GX1, GT, FABC.poly); }
  if (k >= 7 && k < 10) box(GX0, 2, GX1, GT, FABC.poly);
  if (k >= 10 || k === 9) { /* handled below */ }
  /* resist */
  var RT = GT + 80;
  if (k === 3) box(0, GT, 240, GT + 80 * T, FABC.resist);
  if (k === 4) { box(0, GT, 240, RT, FABC.resist); g.fillStyle = 'rgba(182,156,255,.35)'; g.fillRect(wx(0), wy(RT), (GX0) * sc, 80 * sc); g.fillRect(wx(GX1), wy(RT), (240 - GX1) * sc, 80 * sc); }
  if (k === 4) { lbl('exposed → soluble', 6, GT + 40, '#fff'); lbl('unexposed', 120, GT + 40, '#fff', 'center'); }
  if (k === 5) { box(GX0, GT, GX1, RT, FABC.resist); var rem = 80 * (1 - T); box(0, GT, GX0, GT + rem, FABC.resist); box(GX1, GT, 240, GT + rem, FABC.resist); }
  if (k === 6) box(GX0, GT, GX1, RT, FABC.resist);
  if (k === 7) box(GX0, GT, GX1, GT + 80 * (1 - T), FABC.resist);
  /* dielectric */
  if (k >= 9) {
    var D = 150, flat = 2 + D, bump = GT + D, level = k === 9 ? T : 1;
    if (k === 9) { g.fillStyle = FABC.ox; g.beginPath(); g.moveTo(wx(0), wy(2)); g.lineTo(wx(0), wy(2 + D * T)); g.lineTo(wx(GX0 - 30 * T), wy(2 + D * T)); g.lineTo(wx(GX0 - 30 * T + 30 * T * 0.6), wy(GT + D * T)); g.lineTo(wx(GX1 + 30 * T * 0.4), wy(GT + D * T)); g.lineTo(wx(GX1 + 30 * T), wy(2 + D * T)); g.lineTo(wx(240), wy(2 + D * T)); g.lineTo(wx(240), wy(2)); g.closePath(); g.fill(); }
    else { var top = k === 10 ? lerp(bump, 140, T) : 140; var topSide = k === 10 ? lerp(flat, 140, T) : 140; g.fillStyle = FABC.ox; g.beginPath(); g.moveTo(wx(0), wy(2)); g.lineTo(wx(0), wy(topSide)); if (k === 10) { g.lineTo(wx(GX0 - 30), wy(topSide)); g.lineTo(wx(GX0 - 12), wy(top)); g.lineTo(wx(GX1 + 12), wy(top)); g.lineTo(wx(GX1 + 30), wy(topSide)); } g.lineTo(wx(240), wy(topSide)); g.lineTo(wx(240), wy(2)); g.closePath(); g.fill(); }
    box(GX0, 2, GX1, GT, FABC.poly);
  }
  /* contacts */
  var holes = [[30, 60], [180, 210]];
  if (k === 11) holes.forEach(function (hh) { box(hh[0], 140 - 140 * T, hh[1], 140, '#0a0e1a'); });
  if (k === 12) holes.forEach(function (hh) { box(hh[0], 0, hh[1], 140 * T, FABC.w); box(hh[0], 140 * T, hh[1], 140, '#0a0e1a'); if (T > 0.98) { } }), box(0, 140, 240, 140 + 20 * Math.max(0, (T - 0.7) / 0.3), FABC.w);
  if (k === 13) { holes.forEach(function (hh) { box(hh[0], 0, hh[1], 140, FABC.w); }); box(0, 140, 240, 140 + 20 * (1 - T), FABC.w); }
  if (k >= 14) { holes.forEach(function (hh) { box(hh[0], 0, hh[1], 140, FABC.w); }); box(0, 140, 240, 140 + 50 * T, FABC.ox); var lines = [[20, 70], [170, 220]]; lines.forEach(function (l) { box(l[0], 140, l[1], 140 + 50 * T, FABC.cu); }); box(70, 140, 170, 140 + 50 * T, FABC.ox); lbl('Cu wire (metal 1)', 45, 168, '#fff', 'center'); lbl('Cu wire', 195, 168, '#fff', 'center'); g.globalAlpha = 0.5 * T; box(0, 190, 240, 232, 'rgba(140,205,255,.25)'); box(40, 190, 50, 232, FABC.cu); box(30, 220, 200, 232, FABC.cu); g.globalAlpha = 1; txt(g, 'metal 2, 3 … up to ~15 levels', wx(120), wy(250), { a: 'center', s: 10, c: C.dim }); }
  if (k >= 12 && k <= 13) { lbl('metal fill (W / Cu)', 120, 150, '#fff', 'center'); }
  if (k >= 14) { lbl('W plug', 45, 70, '#111', 'center'); }
  /* gate labels */
  if (k >= 7 && k <= 9 || (k >= 10 && k <= 13)) { if (k < 9) { lbl('gate (poly-Si) L = 40 nm', 120, GT + 12, C.gold, 'center'); } else lbl('gate', 120, 40, '#222', 'center'); }
  if (k >= 1 && k < 9) lbl('gate oxide (SiO₂) 2 nm ↑', 6, -11, 'rgba(200,235,255,.95)');
  if (k >= 2 && k <= 5) lbl('polysilicon 60 nm', 6, 2 + Math.min(30, 30 * (k === 2 ? T : 1)), '#222');
  if (k === 3 || k === 4 || k === 5) lbl('photoresist 80 nm', 6, GT + 15, '#fff');
  /* animated actors */
  g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
  if (k === 4) { var cx0 = wx(GX0), cx1 = wx(GX1); g.fillStyle = 'rgba(230,240,255,.18)'; g.fillRect(wx(0), wy(200), 240 * sc, 12); g.fillStyle = '#10131c'; g.fillRect(cx0, wy(200), cx1 - cx0, 8); txt(g, 'photomask (quartz + chrome)', wx(4), wy(204), { s: 10, c: C.dim }); txt(g, 'UV light 193 nm →', wx(236), wy(250), { a: 'right', s: 10, c: C.acc });
    for (var xx = 6; xx < 240; xx += 9) { if (xx > GX0 - 4 && xx < GX1 + 4) continue; for (var j = 0; j < 4; j++) { var yy = ((t * 55 + j * 24 + xx * 3) % 100); g.strokeStyle = 'rgba(182,156,255,.75)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(wx(xx), wy(245 - yy * 1.0)); g.lineTo(wx(xx), wy(245 - yy * 1.0 - 9)); g.stroke(); } g.strokeStyle = 'rgba(182,156,255,.18)'; g.beginPath(); g.moveTo(wx(xx), wy(245)); g.lineTo(wx(xx), wy(RT)); g.stroke(); } }
  if (k === 6) for (var q = 0; q < 26; q++) { var xx2 = 4 + (q * 9.3) % 236; if (xx2 > GX0 - 3 && xx2 < GX1 + 3) continue; var yy2 = GT + 30 - ((t * 60 + q * 17) % 60); dot(g, wx(xx2), wy(Math.max(yy2, polyTop = GT - 60 * T)) , '#ffd166', 1.8); }
  if (k === 6) txt(g, 'reactive plasma ions ↓', wx(236), wy(110), { a: 'right', s: 10, c: C.gold });
  if (k === 8) { for (var m = 0; m < 70; m++) { var xi = (m * 37.3 + 11) % 240, yi = ((t * 70 + m * 29) % 120); var yp = 150 - yi; var stop = xi > GX0 && xi < GX1 ? GT : (-8 - rnd(m) * 24); if (yp < stop) continue; dot(g, wx(xi), wy(yp), '#ff9de2', 1.9); } txt(g, 'As⁺ / P⁺ ions ↓ (gate blocks them)', wx(236), wy(160), { a: 'right', s: 10, c: '#ff9de2' }); }
  if (k === 9) txt(g, 'CVD oxide deposits on all surfaces', wx(236), wy(215), { a: 'right', s: 10, c: C.dim });
  if (k === 10) { var py = lerp(212, 140, T); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(wx(0), wy(py + 10), 240 * sc, 8); txt(g, 'polishing pad', wx(4), wy(py + 22), { s: 10, c: C.dim }); }
  if (k === 13) { var py2 = lerp(160, 140, T); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(wx(0), wy(py2 + 10), 240 * sc, 8); }
  if (k === 11) { for (var n = 0; n < 8; n++) { var hxx = holes[n % 2]; var yy3 = ((t * 80 + n * 20) % 60); dot(g, wx(hxx[0] + 4 + (n * 7) % 22), wy(145 - yy3 * 0.8), '#ffd166', 1.8); } }
  g.restore();
  /* scale bar & dimension */
  var sb = 50; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx(8), wy(-86 + 0) + 0); g.lineTo(wx(8), wy(-86)); g.stroke();
  var bx = r.x + r.w - 20 - sb * sc, by = r.y + r.h - 18; line(g, bx, by, bx + sb * sc, by, '#fff', 2.5); line(g, bx, by - 4, bx, by + 4, '#fff', 2); line(g, bx + sb * sc, by - 4, bx + sb * sc, by + 4, '#fff', 2); txt(g, '50 nm', bx + sb * sc / 2, by - 8, { a: 'center', s: 10.5, w: 600 }); txt(g, '(for scale: DNA helix ≈ 2 nm, virus ≈ 100 nm)', bx + sb * sc, by + 12, { a: 'right', s: 9, c: C.dim });
  if (k >= 7) { var gy = wy(GT + (k < 8 ? 0 : 0)) - 14; line(g, wx(GX0), wy(GT) - 40 + (k === 9 ? 0 : 0), wx(GX1), wy(GT) - 40, 'rgba(0,0,0,0)', 1); }
}
var TAB_FAB = {
  id: 'fab', name: 'Fabrication',
  def: { step: 0, auto: false },
  ctl: [
    { k: 'step', l: 'Process step', min: 0, max: FAB.length - 1, step: 1, f: function (v) { return (v + 1) + '/' + FAB.length + '  ' + FAB[v][0]; } },
    { k: 'auto', l: 'Auto-play through the process', t: 'c' },
    { t: 'b', l: 'Replay this step', fn: function (s, x) { x.t0 = null; } }],
  cap: 'A simplified n-channel MOSFET process in a 240 nm wide window, drawn to scale (see the 50 nm bar). Each step adds, patterns or modifies a layer: grow, deposit, coat, expose, develop, etch, implant, polish. Use the slider, click a step in the list, or let it auto-play. Real CMOS flows have hundreds of steps, but they are all variations on these few.',
  eq: 'Oxide growth (Deal–Grove): x² + Ax = B(t + τ), consumes 0.44·x of silicon<br>Lithography resolution: CD = k₁·λ/NA &nbsp; (193 nm immersion NA 1.35, k₁ ≈ 0.3 → ≈ 43 nm; EUV 13.5 nm)<br>Implant profile ≈ Gaussian: N(x) = [Φ/(√(2π)ΔR<sub>p</sub>)] e<sup>−(x−R<sub>p</sub>)²/2ΔR<sub>p</sub>²</sup><br>Moore-style scaling: gate length 40 nm here; leading-edge nodes use fins/nanosheets',
  read: function (s) { return [['Step', (s.step + 1) + ' of ' + FAB.length], ['Name', FAB[s.step][0]], ['Gate length', '40 nm'], ['Gate oxide', '2 nm (≈ 8 atoms)'], ['Window', '240 nm wide']]; },
  onClick: function (s, px, py, w, h) { if (px < 190) { var i = Math.floor((py - 40) / ((h - 60) / FAB.length)); if (i >= 0 && i < FAB.length) { s.step = i; return true; } } return false; },
  draw: function (g, w, h, s, t, x) {
    var capH = 112, listW = 190, i;
    if (x.last !== s.step) { x.last = s.step; x.t0 = null; } if (x.t0 == null) x.t0 = t; var el = t - x.t0, p = clamp(el / 3.2, 0, 1);
    if (s.auto && el > 6) { s.step = (s.step + 1) % FAB.length; s.__sync = true; }
    var L = { x: 10, y: 10, w: listW, h: h - 20 }; card(g, L, 'Process flow'); var rh = (L.h - 30) / FAB.length;
    FAB.forEach(function (f, j) { var yy = L.y + 26 + j * rh, cur = j === s.step; if (cur) { g.fillStyle = 'rgba(110,231,255,.16)'; rr(g, L.x + 4, yy, L.w - 8, rh - 2, 6); g.fill(); } dot(g, L.x + 16, yy + rh / 2 - 1, j < s.step ? C.green : cur ? C.acc : '#4a5570', 4); txt(g, f[0], L.x + 28, yy + rh / 2 + 3, { s: 10.5, c: cur ? '#fff' : j < s.step ? C.text : C.dim, w: cur ? 600 : 400 }); });
    var V = { x: listW + 20, y: 10, w: w - listW - 30, h: h - capH - 30 }; card(g, V, 'Cross-section (to scale)'); fabScene(g, { x: V.x + 8, y: V.y + 22, w: V.w - 16, h: V.h - 28 }, s.step, p, t, x);
    var Cp = { x: listW + 20, y: h - capH - 10, w: w - listW - 30, h: capH }; card(g, Cp, (s.step + 1) + '. ' + FAB[s.step][0]); g.font = '12.5px Inter,system-ui,sans-serif'; wrap(g, FAB[s.step][1], Cp.x + 12, Cp.y + 38, Cp.w - 24, 17, { s: 12.5, c: C.text });
  }
};

/* ================= UI shell ================= */
var TABS = [TAB_BANDS, TAB_DOPING, TAB_PN, TAB_DIODES, TAB_BJT, TAB_MOS, TAB_CMOS, TAB_FAB];
TAB_DIODES.onset = function (s, k) { if (k === 'mat' && MATS[s.mat].xr) s.mx = MATS[s.mat].xr[2]; };
var CSS = '.dl-root{--text:#e8ecf5;--dim:#98a2b8;--line:rgba(255,255,255,.12);--accent:#6ee7ff;--gold:#ffd166;--panel:rgba(10,14,26,.78);position:absolute;inset:0;display:flex;flex-direction:column;background:radial-gradient(1200px 700px at 30% 0%,#0d1428 0%,#070b16 60%);color:var(--text,#e8ecf5);font:13px Inter,system-ui,sans-serif;overflow:hidden;user-select:none}' +
  '.dl-root *{box-sizing:border-box}.dl-tabs{display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid var(--line,rgba(255,255,255,.12));background:rgba(10,14,26,.78);backdrop-filter:blur(14px);overflow-x:auto;flex:none;align-items:center;height:44px}' +
  '.dl-tab{border:1px solid transparent;background:none;color:var(--dim,#98a2b8);padding:6px 11px;border-radius:9px;cursor:pointer;font:500 12.5px "Space Grotesk",Inter,sans-serif;white-space:nowrap;transition:all .15s}.dl-tab:hover{color:#fff;background:rgba(255,255,255,.06)}' +
  '.dl-tab.on{color:#fff;background:rgba(110,231,255,.14);border-color:rgba(110,231,255,.4)}.dl-tab b{color:var(--accent,#6ee7ff);font-weight:600;margin-right:5px}' +
  '.dl-sp{flex:1}.dl-presets{background:rgba(10,14,26,.9);color:var(--text,#e8ecf5);border:1px solid var(--line,rgba(255,255,255,.2));border-radius:8px;padding:5px 8px;font:12px Inter,sans-serif;max-width:230px}' +
  '.dl-main{flex:1;display:flex;min-height:0}.dl-cv{flex:1;min-width:0;overflow:auto;position:relative}.dl-cv canvas{display:block}' +
  '.dl-side{width:340px;flex:none;overflow-y:auto;padding:10px 12px 18px;border-left:1px solid var(--line,rgba(255,255,255,.12));background:rgba(10,14,26,.78);backdrop-filter:blur(14px);user-select:text}' +
  '.dl-side h4{margin:12px 0 5px;font:600 11px "Space Grotesk",Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--accent,#6ee7ff)}' +
  '.dl-cap{margin:0;line-height:1.5;color:#c5cde0;font-size:12.5px}.dl-note{margin:0 0 4px;padding:8px 10px;border-radius:9px;background:rgba(255,209,102,.09);border:1px solid rgba(255,209,102,.3);color:var(--gold,#ffd166);font-size:12px;line-height:1.45}' +
  '.dl-row{margin:7px 0}.dl-row label{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;color:var(--dim,#98a2b8);margin-bottom:2px}.dl-row label span{color:var(--text,#e8ecf5);font-variant-numeric:tabular-nums;text-align:right}' +
  '.dl-row input[type=range]{width:100%;accent-color:#6ee7ff;margin:0;height:18px}.dl-row select{width:100%;background:rgba(10,14,26,.9);color:var(--text,#e8ecf5);border:1px solid var(--line,rgba(255,255,255,.2));border-radius:7px;padding:5px;font:12px Inter,sans-serif}' +
  '.dl-chk{display:flex;align-items:center;gap:8px;font-size:12px;color:#c5cde0;cursor:pointer}.dl-chk input{accent-color:#6ee7ff}.dl-btn{width:100%;padding:6px;border-radius:8px;border:1px solid var(--line,rgba(255,255,255,.2));background:rgba(110,231,255,.1);color:var(--text,#e8ecf5);cursor:pointer;font:500 12px Inter,sans-serif}.dl-btn:hover{background:rgba(110,231,255,.2)}' +
  '.dl-read{display:grid;grid-template-columns:1fr auto;gap:3px 10px;font-size:11.5px;padding:8px 10px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid var(--line,rgba(255,255,255,.1))}.dl-read i{font-style:normal;color:var(--dim,#98a2b8)}.dl-read b{font-weight:500;text-align:right;font-variant-numeric:tabular-nums;color:#fff}' +
  '.dl-eq{padding:9px 11px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid var(--line,rgba(255,255,255,.1));font:12px/1.75 "Space Grotesk",Inter,sans-serif;color:#dfe6f7}.dl-eq sub,.dl-eq sup{font-size:.72em;line-height:0}' +
  '.dl-narrow .dl-main{flex-direction:column;overflow-y:auto}.dl-narrow .dl-cv{flex:none;height:640px;width:100%}.dl-narrow .dl-side{width:100%;border-left:0;border-top:1px solid var(--line,rgba(255,255,255,.12));overflow:visible}';

var PRESET_URL = SCRIPT_SRC ? new URL('../../data/labs/device_presets.json', SCRIPT_SRC).href : 'data/labs/device_presets.json';
var presetPromise = null;
function loadPresets() { if (!presetPromise) presetPromise = fetch(PRESET_URL).then(function (r) { return r.json(); }).catch(function () { return []; }); return presetPromise; }

function open(container, presetId) {
  if (!document.getElementById('dl-style')) { var st = document.createElement('style'); st.id = 'dl-style'; st.textContent = CSS; document.head.appendChild(st); }
  var root = document.createElement('div'); root.className = 'dl-root'; container.appendChild(root);
  var tabsEl = document.createElement('div'); tabsEl.className = 'dl-tabs'; root.appendChild(tabsEl);
  var main = document.createElement('div'); main.className = 'dl-main'; root.appendChild(main);
  var cv = document.createElement('div'); cv.className = 'dl-cv'; main.appendChild(cv); var canvas = document.createElement('canvas'); cv.appendChild(canvas);
  var side = document.createElement('div'); side.className = 'dl-side'; main.appendChild(side);
  side.innerHTML = '<div class="dl-note" style="display:none"></div><h4>What you’re seeing</h4><p class="dl-cap"></p><h4>Controls</h4><div class="dl-ctls"></div><h4>Live values</h4><div class="dl-read"></div><h4>Key equations</h4><div class="dl-eq"></div>';
  var noteEl = side.querySelector('.dl-note'), capEl = side.querySelector('.dl-cap'), ctlEl = side.querySelector('.dl-ctls'), readEl = side.querySelector('.dl-read'), eqEl = side.querySelector('.dl-eq');
  var S = {}, X = {}, cur = TABS[0], btns = {}, presets = [], alive = true, raf = 0, rows = [], lastRead = 0, W = 800, H = 600, lastT = performance.now() / 1000, errShown = false;
  TABS.forEach(function (T) { S[T.id] = JSON.parse(JSON.stringify(T.def)); X[T.id] = {}; });
  var sel = document.createElement('select'); sel.className = 'dl-presets'; sel.title = 'Presets';
  TABS.forEach(function (T, i) { var b = document.createElement('button'); b.className = 'dl-tab'; b.innerHTML = '<b>' + (i + 1) + '</b>' + T.name; b.onclick = function () { setTab(T.id); }; tabsEl.appendChild(b); btns[T.id] = b; });
  var spc = document.createElement('div'); spc.className = 'dl-sp'; tabsEl.appendChild(spc); tabsEl.appendChild(sel);
  function setNote(txt) { noteEl.style.display = txt ? '' : 'none'; noteEl.textContent = txt || ''; }
  function setTab(id, keepNote) {
    cur = TABS.filter(function (T) { return T.id === id; })[0] || TABS[0]; TABS.forEach(function (T) { btns[T.id].classList.toggle('on', T === cur); }); if (!keepNote) setNote('');
    buildControls(); refreshText(); refreshRead(true); cv.scrollTop = 0;
  }
  function refreshText() { var s = S[cur.id]; capEl.textContent = typeof cur.cap === 'function' ? cur.cap(s) : cur.cap; eqEl.innerHTML = typeof cur.eq === 'function' ? cur.eq(s) : cur.eq; }
  function buildControls() {
    ctlEl.innerHTML = ''; rows = []; var s = S[cur.id];
    cur.ctl.forEach(function (c) {
      var row = document.createElement('div'); row.className = 'dl-row'; var inp, out;
      if (c.t === 'b') { inp = document.createElement('button'); inp.className = 'dl-btn'; inp.textContent = c.l; inp.onclick = function () { c.fn(s, X[cur.id]); }; row.appendChild(inp); }
      else if (c.t === 'c') { var lb = document.createElement('label'); lb.className = 'dl-chk'; inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = !!s[c.k]; lb.appendChild(inp); lb.appendChild(document.createTextNode(c.l)); row.appendChild(lb); inp.onchange = function () { s[c.k] = inp.checked; changed(c.k); }; }
      else if (c.t === 's') { var l2 = document.createElement('label'); l2.textContent = c.l; row.appendChild(l2); inp = document.createElement('select'); c.o.forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; inp.appendChild(op); }); inp.value = s[c.k]; row.appendChild(inp); inp.onchange = function () { s[c.k] = inp.value; changed(c.k); }; }
      else { var l3 = document.createElement('label'); l3.textContent = c.l + ' '; out = document.createElement('span'); l3.appendChild(out); row.appendChild(l3); inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = s[c.k]; row.appendChild(inp); inp.oninput = function () { s[c.k] = parseFloat(inp.value); out.textContent = c.f(s[c.k]); changed(c.k); }; out.textContent = c.f(s[c.k]); }
      ctlEl.appendChild(row); rows.push({ c: c, row: row, inp: inp, out: out });
    });
    syncControls();
  }
  function syncControls() {
    var s = S[cur.id]; rows.forEach(function (r) {
      var c = r.c; if (c.t === 'b') { r.row.style.display = c.show && !c.show(s) ? 'none' : ''; return; }
      if (c.rng) { var rg = c.rng(s); r.inp.min = rg[0]; r.inp.max = rg[1]; }
      if (c.t === 'c') r.inp.checked = !!s[c.k]; else if (c.t === 's') r.inp.value = s[c.k]; else { r.inp.value = s[c.k]; r.out.textContent = c.f(s[c.k]); }
      r.row.style.display = c.show && !c.show(s) ? 'none' : '';
    });
  }
  function changed(k) { var s = S[cur.id]; if (cur.onset) cur.onset(s, k); syncControls(); refreshText(); refreshRead(true); }
  function refreshRead(force) {
    var now = performance.now(); if (!force && now - lastRead < 120) return; lastRead = now;
    try { var r = cur.read(S[cur.id]); readEl.innerHTML = r.map(function (p) { return '<i>' + p[0] + '</i><b>' + p[1] + '</b>'; }).join(''); } catch (e) { readEl.textContent = ''; }
  }
  function resize() {
    var rw = root.clientWidth, narrow = rw < 900; root.classList.toggle('dl-narrow', narrow);
    var cw = cv.clientWidth, ch = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2); W = Math.max(cw, 900); H = Math.max(ch, 560);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; if (ro) ro.observe(root); window.addEventListener('resize', resize); resize();
  canvas.addEventListener('pointerdown', function (e) { if (!cur.onClick) return; var r = canvas.getBoundingClientRect(); if (cur.onClick(S[cur.id], e.clientX - r.left, e.clientY - r.top, W, H)) { syncControls(); refreshText(); refreshRead(true); } });
  function frame() {
    if (!alive) return; raf = requestAnimationFrame(frame);
    var g = canvas.getContext('2d'), t = performance.now() / 1000, s = S[cur.id], x = X[cur.id]; x.dt = Math.min(0.05, t - lastT); lastT = t;
    g.clearRect(0, 0, W, H);
    try { cur.draw(g, W, H, s, t, x); errShown = false; } catch (e) { g.setLineDash([]); txt(g, 'Render error: ' + e.message, 20, 40, { c: '#ff8fa3', s: 13 }); if (!errShown) { console.error(e); errShown = true; } }
    if (s.__sync) { s.__sync = false; syncControls(); refreshText(); }
    refreshRead(false);
  }
  function loadPreset(id) {
    var p = presets.filter(function (q) { return q.id === id; })[0]; if (!p) return false;
    var T = TABS.filter(function (q) { return q.id === p.tab; })[0]; if (!T) return false;
    S[T.id] = Object.assign(JSON.parse(JSON.stringify(T.def)), p.params || {}); X[T.id] = {}; setTab(T.id, true); setNote(p.text || ''); sel.value = p.id; return true;
  }
  sel.onchange = function () { if (sel.value) loadPreset(sel.value); };
  var first = document.createElement('option'); first.value = ''; first.textContent = 'Presets…'; sel.appendChild(first);
  setTab('bands'); raf = requestAnimationFrame(frame);
  loadPresets().then(function (list) {
    if (!alive) return; presets = list || [];
    TABS.forEach(function (T) { var items = presets.filter(function (p) { return p.tab === T.id; }); if (!items.length) return; var og = document.createElement('optgroup'); og.label = T.name; items.forEach(function (p) { var o = document.createElement('option'); o.value = p.id; o.textContent = p.title; og.appendChild(o); }); sel.appendChild(og); });
    if (presetId && !loadPreset(presetId) && typeof toast === 'function') toast('There is no example called "' + presetId + '" yet. Pick one from the Presets menu.');
  });
  return {
    close: function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); window.removeEventListener('resize', resize); if (root.parentNode) root.parentNode.removeChild(root); },
    loadPreset: function (id) { if (presets.length) return loadPreset(id); loadPresets().then(function () { setTimeout(function () { loadPreset(id); }, 0); }); return true; }
  };
}

G.LABS.device = { title: 'Semiconductor Device Lab', open: open, _phys: PHYS };
if (typeof module !== 'undefined' && module.exports) module.exports = PHYS;
})();
