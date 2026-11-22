'use strict';
/* =====================================================================
   VIZ: a small figure language so every concept card can show a live,
   interactive picture. Specs live in data/viz/*.json as { nodeId: spec }.
   See docs/VIZ_SPEC.md for the full reference.
   ===================================================================== */
(function (G) {
  /* ---------------- safe expression language ---------------- */
  const FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, log: Math.log, ln: Math.log, log10: Math.log10, log2: Math.log2,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
    min: Math.min, max: Math.max, pow: Math.pow, hypot: Math.hypot,
    mod: (a, b) => ((a % b) + b) % b, step: x => x >= 0 ? 1 : 0, sinc: x => Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x),
    sq: x => x * x, clamp: (x, a, b) => Math.min(Math.max(x, a), b), if: (c, a, b) => c ? a : b, deg: x => x * 180 / Math.PI, rad: x => x * Math.PI / 180,
    gauss: (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)),
    fact: n => { let r = 1; for (let i = 2; i <= Math.round(n); i++) r *= i; return r; },
    choose: (n, k) => { n = Math.round(n); k = Math.round(k); if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; },
    square: x => (FN.mod(x, 2 * Math.PI) < Math.PI ? 1 : -1), saw: x => FN.mod(x, 2 * Math.PI) / Math.PI - 1, tri: x => 2 / Math.PI * Math.asin(Math.sin(x)),
    rand: (s) => { const v = Math.sin(s * 12.9898) * 43758.5453; return v - Math.floor(v); },
    erf: x => { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; },
  };
  const CONST = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI, inf: Infinity };
  function tokenize(s) {
    const t = [], re = /\s*(?:(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(<=|>=|==|!=|&&|\|\||[-+*/^(),<>!%?:]))/y;
    let m, i = 0; re.lastIndex = 0;
    while (re.lastIndex < s.length) { const at = re.lastIndex; m = re.exec(s); if (!m || m.index !== at) { if (/^\s*$/.test(s.slice(at))) break; throw new Error('Bad character at ' + at + ' in "' + s + '"'); } if (m[1] !== undefined) t.push({ k: 'n', v: parseFloat(m[1]) }); else if (m[2]) t.push({ k: 'id', v: m[2] }); else if (m[3]) t.push({ k: 'op', v: m[3] }); i++; }
    return t;
  }
  function parse(src) { // → AST
    const T = tokenize(String(src)); let p = 0;
    const peek = () => T[p], eat = v => { const k = T[p]; if (!k || (v && k.v !== v)) throw new Error(`Expected ${v || 'token'} in "${src}"`); p++; return k; };
    const isOp = v => T[p] && T[p].k === 'op' && T[p].v === v;
    function ternary() { const c = or(); if (isOp('?')) { p++; const a = ternary(); eat(':'); const b = ternary(); return { t: 'if', c, a, b }; } return c; }
    function or() { let a = and(); while (isOp('||')) { p++; a = { t: 'b', o: '||', a, b: and() }; } return a; }
    function and() { let a = cmp(); while (isOp('&&')) { p++; a = { t: 'b', o: '&&', a, b: cmp() }; } return a; }
    function cmp() { let a = add(); while (T[p] && T[p].k === 'op' && ['<', '>', '<=', '>=', '==', '!='].includes(T[p].v)) { const o = T[p++].v; a = { t: 'b', o, a, b: add() }; } return a; }
    function add() { let a = mul(); while (isOp('+') || isOp('-')) { const o = T[p++].v; a = { t: 'b', o, a, b: mul() }; } return a; }
    function mul() { let a = un(); while (isOp('*') || isOp('/') || isOp('%') || (T[p] && (T[p].k === 'n' || T[p].k === 'id' || isOp('(')) && false)) { const o = T[p++].v; a = { t: 'b', o, a, b: un() }; } return a; }
    function un() { if (isOp('-')) { p++; return { t: 'neg', a: un() }; } if (isOp('+')) { p++; return un(); } if (isOp('!')) { p++; return { t: 'not', a: un() }; } return pow(); }
    function pow() { const a = atom(); if (isOp('^')) { p++; return { t: 'b', o: '^', a, b: un() }; } return a; }
    function atom() {
      const k = peek(); if (!k) throw new Error('Unexpected end of "' + src + '"');
      if (k.k === 'n') { p++; return { t: 'n', v: k.v }; }
      if (k.k === 'id') { p++; if (isOp('(')) { p++; const args = []; if (!isOp(')')) { args.push(ternary()); while (isOp(',')) { p++; args.push(ternary()); } } eat(')'); if (!FN[k.v]) throw new Error('Unknown function ' + k.v); return { t: 'f', f: k.v, args }; } return { t: 'v', v: k.v }; }
      if (isOp('(')) { p++; const a = ternary(); eat(')'); return a; }
      throw new Error(`Unexpected "${k.v}" in "${src}"`);
    }
    const ast = ternary(); if (p < T.length) throw new Error(`Unexpected "${T[p].v}" in "${src}"`); return ast;
  }
  function compile(src) {
    if (typeof src === 'number') return () => src;
    if (src === undefined || src === null || src === '') return () => NaN;
    const ast = parse(src), vars = new Set();
    const c = n => {
      switch (n.t) {
        case 'n': return () => n.v;
        case 'v': { vars.add(n.v); const k = n.v; return s => (k in s ? s[k] : (k in CONST ? CONST[k] : NaN)); }
        case 'neg': { const a = c(n.a); return s => -a(s); }
        case 'not': { const a = c(n.a); return s => a(s) ? 0 : 1; }
        case 'if': { const q = c(n.c), a = c(n.a), b = c(n.b); return s => q(s) ? a(s) : b(s); }
        case 'f': { const f = FN[n.f], as = n.args.map(c); return s => f(...as.map(a => a(s))); }
        case 'b': { const a = c(n.a), b = c(n.b); switch (n.o) { case '+': return s => a(s) + b(s); case '-': return s => a(s) - b(s); case '*': return s => a(s) * b(s); case '/': return s => a(s) / b(s); case '%': return s => a(s) % b(s); case '^': return s => Math.pow(a(s), b(s)); case '<': return s => +(a(s) < b(s)); case '>': return s => +(a(s) > b(s)); case '<=': return s => +(a(s) <= b(s)); case '>=': return s => +(a(s) >= b(s)); case '==': return s => +(a(s) === b(s)); case '!=': return s => +(a(s) !== b(s)); case '&&': return s => +(a(s) && b(s)); case '||': return s => +(a(s) || b(s)); } }
      }
    };
    const fn = c(ast); fn.vars = vars; return fn;
  }
  const exprCache = new Map();
  function E(src) { const k = typeof src === 'number' ? src : String(src); if (!exprCache.has(k)) exprCache.set(k, compile(src)); return exprCache.get(k); }
  const num = (v, s, d = NaN) => v === undefined ? d : typeof v === 'number' ? v : E(v)(s);
  function usesT(spec) { let found = false; JSON.stringify(spec, (k, v) => { if (typeof v === 'string' && /(^|[^A-Za-z_0-9])t([^A-Za-z_0-9(]|$)/.test(v) && !['type', 'kind', 'label', 'caption', 'title', 'text', 'color', 'xlabel', 'ylabel', 'layout'].includes(k)) found = true; return v; }); return found; }

  /* ---------------- drawing helpers ---------------- */
  /* ---------------- the figure theme (docs/DESIGN.md section 4) ----------------
     A figure is a plate on the card. K holds every colour, line weight and font the drawing code asks for, so that nothing below
     names a literal. Three themes: 'old' (the dark screen the app has always had: kept exactly while the look is off), 'plate'
     (porcelain ground, ink drawing) and 'plateDark' (the dark interface). The theme is read from the page when a figure is built. */
  const SANS_OLD = 'Inter, sans-serif', SANS = "-apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
  const THEMES = {
    old: { name: 'old', ink: '#e8ecf5', ink2: '#c5cde0', dim: '#98a2b8', node: 'rgba(10,14,26,.95)', off: '#4a5570', offFill: '#26304a', onText: '#1a1300', err: '#ff8fb1',
      w: [255, 255, 255], c: [110, 231, 255], g: [255, 209, 102], p: [255, 143, 177], gr: [155, 227, 123], back: 'rgba(8,12,22,.75)', potk: .35, flat: false,
      COL: { accent: '#6ee7ff', gold: '#ffd166', pink: '#ff8fb1', green: '#9be37b', purple: '#b388ff', orange: '#ffa94d', red: '#ff6b6b', blue: '#5b9cff', white: '#e8ecf5', dim: '#98a2b8' },
      PAL: ['#6ee7ff', '#ffd166', '#ff8fb1', '#9be37b', '#b388ff', '#ffa94d'] },
    plate: { name: 'plate', ink: '#16191d', ink2: '#3b424a', dim: '#5d6670', node: '#fafbfa', off: 'rgba(22,25,29,.35)', offFill: '#e9ebea', onText: '#ffffff', err: '#b4412f',
      w: [22, 25, 29], c: [30, 78, 143], g: [150, 105, 10], p: [180, 65, 47], gr: [63, 122, 58], back: 'rgba(250,251,250,.85)', potk: 1, flat: true,
      COL: { accent: '#1e4e8f', gold: '#96690a', pink: '#b4412f', green: '#3f7a3a', purple: '#6b4a9c', orange: '#1f7a78', red: '#b4412f', blue: '#1e4e8f', white: '#16191d', dim: '#5d6670' },
      PAL: ['#1e4e8f', '#b4412f', '#3f7a3a', '#96690a', '#6b4a9c', '#1f7a78'] },
    plateDark: { name: 'plateDark', ink: '#eef0f2', ink2: '#c5cad0', dim: '#9aa3ad', node: '#15181b', off: 'rgba(238,240,242,.35)', offFill: '#262a2f', onText: '#15181b', err: '#f0907c',
      w: [238, 240, 242], c: [141, 184, 242], g: [226, 182, 89], p: [240, 144, 124], gr: [147, 201, 138], back: 'rgba(21,24,27,.85)', potk: 1, flat: true,
      COL: { accent: '#8db8f2', gold: '#e2b659', pink: '#f0907c', green: '#93c98a', purple: '#b9a0e6', orange: '#74cfc9', red: '#f0907c', blue: '#8db8f2', white: '#eef0f2', dim: '#9aa3ad' },
      PAL: ['#8db8f2', '#f0907c', '#93c98a', '#e2b659', '#b9a0e6', '#74cfc9'] },
  };
  const K = {}, COL = {}, PAL = [];
  const rgba = (t, a) => `rgba(${t[0]},${t[1]},${t[2]},${a})`;
  /* the sheet is read on every figure built, so a change of interface theme reaches the next one */
  function useTheme(name) {
    if (!name) { const h = typeof document !== 'undefined' && document.documentElement; name = h && h.classList.contains('look2') ? (h.classList.contains('look2-dark') ? 'plateDark' : 'plate') : 'old'; }
    const T = THEMES[name] || THEMES.old; Object.assign(K, T); Object.assign(COL, T.COL); PAL.length = 0; T.PAL.forEach(c => PAL.push(c));
    K.sans = T.flat ? SANS : SANS_OLD;
    K.W = a => rgba(T.w, a); K.C = a => rgba(T.c, a); K.G = a => rgba(T.g, a); K.P = a => rgba(T.p, a); K.Gr = a => rgba(T.gr, a);
    /* font: tick labels 11, axis names and direct labels 12, weights 400, 500, 600 (the sizes of 2.1); the old screen keeps what it had */
    K.f = (wt, px, fam, fb) => T.flat ? `${wt >= 500 ? 500 : 400} ${px <= 11 ? 11 : 12}px ${fam === 'mono' ? "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" : SANS}` : `${wt === 400 ? '' : wt + ' '}${px}px ${fam === 'mono' ? '"Space Grotesk"' : 'Inter'}${fb === 2 ? ', monospace' : fb ? ', sans-serif' : ''}`;
    /* weights of line: data 2, secondary and construction 1.25, axes and hairlines 1 */
    K.lw = v => T.flat ? (v >= 1.7 ? 2 : v >= 1.2 ? 1.25 : 1) : v;
    return T;
  }
  useTheme('old');
  /* the colours that older specs name as hex (the old dark screen's own) follow the theme as well: data files keep their meaning, the plate gets its code */
  const LEGACY = { '#6ee7ff': 'accent', '#ffd166': 'gold', '#ff8fb1': 'pink', '#9be37b': 'green', '#b388ff': 'purple', '#ffa94d': 'orange', '#ff6b6b': 'red', '#5b9cff': 'blue', '#e8ecf5': 'white', '#98a2b8': 'dim' };
  const col = (c, i = 0) => !c ? PAL[i % PAL.length] : COL[c] || (K.flat && typeof c === 'string' && COL[LEGACY[c.toLowerCase()]]) || (K.flat && c === '#0a0e17' ? K.node : c);
  function niceStep(span, n = 5) { const r = span / n, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }
  function fmt(v) { if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—'; const a = Math.abs(v); if (Number.isInteger(v) && a < 1e7) return String(v); if (a !== 0 && (a < 1e-3 || a >= 1e5)) { const e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e); return `${+m.toFixed(2)}×10${String(e).replace(/-/, '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; } return String(+v.toPrecision(4)); }
  function interp(text, s) { return String(text || '').replace(/\{([^}]+)\}/g, (_, e) => { try { return fmt(E(e)(s)); } catch (er) { return '?'; } }); }
  class View {
    constructor(ctx, W, H, r, o = {}) { Object.assign(this, { ctx, W, H, logx: o.logx, logy: o.logy }); this.m = { l: o.ml ?? 38, r: 10, t: 10, b: o.mb ?? 24 }; this.set(r, o.equal); }
    set([x0, x1, y0, y1], equal) {
      this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1;
      if (equal) { const pw = this.W - this.m.l - this.m.r, ph = this.H - this.m.t - this.m.b, sx = pw / (x1 - x0), sy = ph / (y1 - y0); if (sx > sy) { const c = (x0 + x1) / 2, h = pw / sy / 2; this.x0 = c - h; this.x1 = c + h; } else { const c = (y0 + y1) / 2, h = ph / sx / 2; this.y0 = c - h; this.y1 = c + h; } }
    }
    fx(x) { const pw = this.W - this.m.l - this.m.r; return this.m.l + (this.logx ? (Math.log10(x) - Math.log10(this.x0)) / (Math.log10(this.x1) - Math.log10(this.x0)) : (x - this.x0) / (this.x1 - this.x0)) * pw; }
    fy(y) { const ph = this.H - this.m.t - this.m.b; return this.H - this.m.b - (this.logy ? (Math.log10(y) - Math.log10(this.y0)) / (Math.log10(this.y1) - Math.log10(this.y0)) : (y - this.y0) / (this.y1 - this.y0)) * ph; }
    ix(px) { const pw = this.W - this.m.l - this.m.r, u = (px - this.m.l) / pw; return this.logx ? Math.pow(10, Math.log10(this.x0) + u * (Math.log10(this.x1) - Math.log10(this.x0))) : this.x0 + u * (this.x1 - this.x0); }
    iy(py) { const ph = this.H - this.m.t - this.m.b, u = (this.H - this.m.b - py) / ph; return this.logy ? Math.pow(10, Math.log10(this.y0) + u * (Math.log10(this.y1) - Math.log10(this.y0))) : this.y0 + u * (this.y1 - this.y0); }
    axes(o = {}) {
      const c = this.ctx, { x0, x1, y0, y1 } = this; c.save(); c.font = K.f(400, 10, '', 1); c.lineWidth = K.lw(1);
      const ticks = (a, b, log) => { if (log) { const r = []; for (let e = Math.ceil(Math.log10(a)); e <= Math.floor(Math.log10(b)); e++) r.push(Math.pow(10, e)); return r; } const st = niceStep(b - a), r = []; for (let v = Math.ceil(a / st) * st; v <= b + 1e-9 * st; v += st) r.push(Math.abs(v) < st * 1e-9 ? 0 : v); return r; };
      if (o.grid !== false) { c.strokeStyle = K.W(.07); ticks(x0, x1, this.logx).forEach(v => { c.beginPath(); c.moveTo(this.fx(v), this.m.t); c.lineTo(this.fx(v), this.H - this.m.b); c.stroke(); }); ticks(y0, y1, this.logy).forEach(v => { c.beginPath(); c.moveTo(this.m.l, this.fy(v)); c.lineTo(this.W - this.m.r, this.fy(v)); c.stroke(); }); }
      c.strokeStyle = K.W(.35); c.fillStyle = K.dim;
      const ax = !this.logy && y0 < 0 && y1 > 0 ? this.fy(0) : this.H - this.m.b, ay = !this.logx && x0 < 0 && x1 > 0 ? this.fx(0) : this.m.l;
      c.beginPath(); c.moveTo(this.m.l, ax); c.lineTo(this.W - this.m.r, ax); c.moveTo(ay, this.m.t); c.lineTo(ay, this.H - this.m.b); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'top'; ticks(x0, x1, this.logx).forEach(v => c.fillText(fmt(v), this.fx(v), this.H - this.m.b + 4));
      c.textAlign = 'right'; c.textBaseline = 'middle'; ticks(y0, y1, this.logy).forEach(v => c.fillText(fmt(v), this.m.l - 4, this.fy(v)));
      if (o.xlabel) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillStyle = K.ink2; c.fillText(o.xlabel, this.W - this.m.r, this.H - this.m.b - 3); }
      if (o.ylabel) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = K.ink2; c.fillText(o.ylabel, this.m.l + 4, this.m.t); }
      c.restore();
    }
    clip() { const c = this.ctx; c.save(); c.beginPath(); c.rect(this.m.l, this.m.t, this.W - this.m.l - this.m.r, this.H - this.m.t - this.m.b); c.clip(); }
  }
  function arrow(c, x1, y1, x2, y2, color, w = 2, head = 8) {
    c.strokeStyle = c.fillStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return; const h = Math.min(head, L * .4);
    c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - h * Math.cos(a - .4), y2 - h * Math.sin(a - .4)); c.lineTo(x2 - h * Math.cos(a + .4), y2 - h * Math.sin(a + .4)); c.closePath(); c.fill();
  }
  function label(c, text, x, y, color = K.ink, align = 'left', base = 'middle', size = 11) { if (!text) return; c.save(); c.font = K.f(500, size, '', 1); c.textAlign = align; c.textBaseline = base; c.fillStyle = K.back; const w = c.measureText(text).width; const ox = align === 'center' ? -w / 2 : align === 'right' ? -w : 0; c.fillRect(x + ox - 3, y - (base === 'middle' ? 8 : base === 'bottom' ? 15 : 1), w + 6, 16); c.fillStyle = color; c.fillText(text, x, y); c.restore(); }
  function cmap(u, kind) { u = Math.max(0, Math.min(1, u)); if (K.flat) { const pl = K.name === 'plate' ? [250, 251, 250] : [21, 24, 27], bl = K.name === 'plate' ? [30, 78, 143] : [141, 184, 242], rd = K.name === 'plate' ? [180, 65, 47] : [240, 144, 124]; const a = kind === 'diverging' ? [bl, pl, rd] : [pl, bl]; const n = a.length - 1, x = u * n, k = Math.min(n - 1, Math.floor(x)), f = x - k; return a[k].map((v, i) => Math.round(v + (a[k + 1][i] - v) * f)); } if (kind === 'diverging') { const a = [[59, 111, 214], [235, 235, 245], [214, 60, 60]]; const k = u < .5 ? 0 : 1, f = u < .5 ? u * 2 : u * 2 - 1; return a[k].map((v, i) => Math.round(v + (a[k + 1][i] - v) * f)); } const stops = [[10, 14, 40], [80, 40, 140], [210, 70, 110], [255, 170, 60], [255, 245, 200]]; const x = u * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(x)), f = x - k; return stops[k].map((v, i) => Math.round(v + (stops[k + 1][i] - v) * f)); }
  // complex helpers
  const C = { mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], abs: a => Math.hypot(a[0], a[1]) };
  function polyAt(coefs, z) { let r = [0, 0]; for (const k of coefs) r = C.add(C.mul(r, z), [k, 0]); return r; } // highest power first
  function polyRoots(coefs) { // Durand–Kerner, highest power first
    let a = coefs.slice(); while (a.length && Math.abs(a[0]) < 1e-14) a.shift(); const n = a.length - 1; if (n < 1) return [];
    a = a.map(v => v / a[0]); let z = [...Array(n)].map((_, i) => { const r = .4 + .9 * i, th = .7 + 2 * Math.PI * i / n; return [Math.cos(th) * r, Math.sin(th) * r]; });
    for (let it = 0; it < 200; it++) { z = z.map((zi, i) => { let den = [1, 0]; z.forEach((zj, j) => { if (i !== j) den = C.mul(den, C.sub(zi, zj)); }); return C.sub(zi, C.div(polyAt(a, zi), den)); }); }
    return z;
  }
  const polyMul = (p, q) => { const r = Array(p.length + q.length - 1).fill(0); p.forEach((a, i) => q.forEach((b, j) => r[i + j] += a * b)); return r; };
  const fromRoots = rs => rs.reduce((p, [re, im]) => im === 0 ? polyMul(p, [1, -re]) : p, [1]);
  function tfFromSpec(sp, s) { // returns {num, den} highest power first
    if (sp.num || sp.den) return { num: (sp.num || [1]).map(v => num(v, s)), den: (sp.den || [1]).map(v => num(v, s)) };
    const z = (sp.zeros || []).map(p => [num(p[0], s), num(p[1] || 0, s)]), p = (sp.poles || []).map(q => [num(q[0], s), num(q[1] || 0, s)]);
    const norm = sp.normalize !== false; // factors (1 − s/r): DC gain = k unless a root sits at the origin
    const build = rs => { let r = [1]; const done = new Set(); rs.forEach(([re, im], i) => { if (done.has(i)) return; const m2 = re * re + im * im; if (Math.abs(im) < 1e-12) r = polyMul(r, norm && Math.abs(re) > 1e-12 ? [-1 / re, 1] : [1, -re]); else { r = polyMul(r, norm ? [1 / m2, -2 * re / m2, 1] : [1, -2 * re, m2]); const j = rs.findIndex(([r2, i2], k) => k !== i && !done.has(k) && Math.abs(r2 - re) < 1e-9 && Math.abs(i2 + im) < 1e-9); if (j >= 0) done.add(j); } done.add(i); }); return r; };
    const k = num(sp.k ?? 1, s); return { num: build(z).map(v => v * k), den: build(p) };
  }

  /* ---------------- figure types ---------------- */
  const TYPES = {};
  TYPES.plot = (c, W, H, sp, s) => {
    const xr = (sp.x || [-5, 5]).map(v => num(v, s)); let yr = sp.y && sp.y.map(v => num(v, s));
    const fns = (sp.fns || (sp.f ? [{ f: sp.f }] : [])).map((f, i) => Object.assign({}, f, { fn: E(f.f), color: col(f.color, i) }));
    const N = 400, xs = [...Array(N + 1)].map((_, i) => sp.logx ? Math.pow(10, Math.log10(xr[0]) + i / N * (Math.log10(xr[1]) - Math.log10(xr[0]))) : xr[0] + (xr[1] - xr[0]) * i / N);
    const ys = fns.map(f => xs.map(x => f.fn(Object.assign({}, s, { x }))));
    if (!yr) { let lo = Infinity, hi = -Infinity; ys.flat().forEach(v => { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); if (!isFinite(lo)) { lo = -1; hi = 1; } if (sp.logy) { const pos = ys.flat().filter(v => isFinite(v) && v > 0); yr = pos.length ? [Math.min(...pos) / 2, Math.max(...pos) * 2] : [1e-3, 1]; } else { if (hi - lo < 1e-9) { lo -= 1; hi += 1; } const pad = (hi - lo) * .08; yr = [lo - pad, hi + pad]; } }
    const V = new View(c, W, H, [xr[0], xr[1], yr[0], yr[1]], { logx: sp.logx, logy: sp.logy, equal: sp.equal }); V.axes(sp); V.clip();
    if (sp.shade) { const sh = sp.shade, f = E(sh.f), a = num(sh.from, s), b = num(sh.to, s); c.fillStyle = col(sh.color || 'accent') + '40'; c.beginPath(); c.moveTo(V.fx(a), V.fy(0)); for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; c.lineTo(V.fx(x), V.fy(f(Object.assign({}, s, { x })))); } c.lineTo(V.fx(b), V.fy(0)); c.closePath(); c.fill(); }
    (sp.vlines || []).forEach(l => { const x = num(l.x, s); c.strokeStyle = col(l.color || 'dim'); c.setLineDash([4, 4]); c.beginPath(); c.moveTo(V.fx(x), V.m.t); c.lineTo(V.fx(x), H - V.m.b); c.stroke(); c.setLineDash([]); label(c, interp(l.label, s), V.fx(x) + 4, V.m.t + 10, col(l.color || 'dim')); });
    (sp.hlines || []).forEach(l => { const y = num(l.y, s); c.strokeStyle = col(l.color || 'dim'); c.setLineDash([4, 4]); c.beginPath(); c.moveTo(V.m.l, V.fy(y)); c.lineTo(W - V.m.r, V.fy(y)); c.stroke(); c.setLineDash([]); label(c, interp(l.label, s), W - V.m.r - 4, V.fy(y) - 9, col(l.color || 'dim'), 'right'); });
    fns.forEach((f, k) => {
      c.strokeStyle = f.color; c.lineWidth = K.lw(f.width || 2.2); if (f.dash) c.setLineDash([6, 4]); c.beginPath(); let pen = false;
      xs.forEach((x, i) => { const y = ys[k][i]; if (!isFinite(y) || Math.abs(V.fy(y)) > 1e5) { pen = false; return; } const px = V.fx(x), py = V.fy(y); if (!pen) { c.moveTo(px, py); pen = true; } else c.lineTo(px, py); });
      c.stroke(); c.setLineDash([]);
    });
    if (sp.tangent) { const f = E(sp.tangent.f || fns[0].f), x0 = num(sp.tangent.at, s), y0 = f(Object.assign({}, s, { x: x0 })), h = (xr[1] - xr[0]) * 1e-5, m = (f(Object.assign({}, s, { x: x0 + h })) - f(Object.assign({}, s, { x: x0 - h }))) / (2 * h); c.strokeStyle = COL.gold; c.lineWidth = K.lw(1.5); c.beginPath(); c.moveTo(V.fx(xr[0]), V.fy(y0 + m * (xr[0] - x0))); c.lineTo(V.fx(xr[1]), V.fy(y0 + m * (xr[1] - x0))); c.stroke(); c.fillStyle = COL.gold; c.beginPath(); c.arc(V.fx(x0), V.fy(y0), 4, 0, 7); c.fill(); label(c, `slope = ${fmt(m)}`, V.fx(x0) + 8, V.fy(y0) - 12, COL.gold); }
    (sp.points || []).forEach((p, i) => { const x = num(p.x, s), y = num(p.y, s); c.fillStyle = col(p.color || 'gold'); c.beginPath(); c.arc(V.fx(x), V.fy(y), p.r || 4, 0, 7); c.fill(); label(c, interp(p.label, s), V.fx(x) + 7, V.fy(y) - 10, col(p.color || 'gold')); });
    c.restore();
    let ly = V.m.t + (sp.ylabel ? 24 : 6); fns.forEach(f => { if (f.label) { label(c, interp(f.label, s), V.m.l + 8, ly + 6, f.color); ly += 17; } });
  };
  TYPES.parametric = (c, W, H, sp, s) => {
    const r = (sp.range || [-2, 2, -2, 2]).map(v => num(v, s)), V = new View(c, W, H, r, { equal: sp.equal !== false }); V.axes(sp); V.clip();
    (sp.curves || [sp]).forEach((cv, i) => { const fx = E(cv.x), fy = E(cv.y), [a, b] = (cv.s || [0, 2 * Math.PI]).map(v => num(v, s)), N = cv.n || 500; c.strokeStyle = col(cv.color, i); c.lineWidth = K.lw(2.2); c.beginPath(); for (let k = 0; k <= N; k++) { const q = Object.assign({}, s, { s: a + (b - a) * k / N }); const X = V.fx(fx(q)), Y = V.fy(fy(q)); k ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); if (cv.dot) { const q = Object.assign({}, s, { s: num(cv.dot, s) }); c.fillStyle = col(cv.color, i); c.beginPath(); c.arc(V.fx(fx(q)), V.fy(fy(q)), 5, 0, 7); c.fill(); } });
    c.restore(); (sp.shapes || []).length && TYPES.geometry(c, W, H, Object.assign({}, sp, { range: r, noaxes: true, _V: V }), s);
  };
  TYPES.field = (c, W, H, sp, s) => {
    const R = sp.range ? sp.range.map(v => num(v, s)) : [-3, 3, -3, 3], V = new View(c, W, H, R, { equal: true, ml: 10, mb: 10 }); V.m.l = 10; V.m.b = 10;
    const charges = (sp.charges || []).map(q => ({ x: num(q.x, s), y: num(q.y, s), q: num(q.q, s) }));
    const fvx = sp.vx && E(sp.vx), fvy = sp.vy && E(sp.vy);
    const F = (x, y) => { if (charges.length) { let ex = 0, ey = 0; charges.forEach(q => { const dx = x - q.x, dy = y - q.y, r2 = dx * dx + dy * dy + 1e-3, r3 = r2 * Math.sqrt(r2); ex += q.q * dx / r3; ey += q.q * dy / r3; }); return [ex, ey]; } const q = Object.assign({}, s, { x, y }); return [fvx(q), fvy(q)]; };
    if (sp.potential && charges.length) { const img = c.createImageData(W, H), st = 3; for (let py = 0; py < H; py += st) for (let px = 0; px < W; px += st) { const x = V.ix(px), y = V.iy(py); let v = 0; charges.forEach(q => v += q.q / Math.hypot(x - q.x, y - q.y)); const u = .5 + Math.atan(v * .6) / Math.PI, rgb = cmap(u, 'diverging'); for (let a = 0; a < st; a++) for (let b = 0; b < st; b++) { const k = ((py + a) * W + px + b) * 4; if (k < img.data.length) { img.data[k] = rgb[0] * K.potk; img.data[k + 1] = rgb[1] * K.potk; img.data[k + 2] = rgb[2] * K.potk; img.data[k + 3] = 255; } } } c.putImageData(img, 0, 0); }
    const n = sp.density || 15, dx = (V.x1 - V.x0) / n;
    if (sp.mode !== 'stream') for (let i = 0; i <= n; i++) for (let j = 0; j <= Math.round(n * (V.y1 - V.y0) / (V.x1 - V.x0)); j++) {
      const x = V.x0 + i * dx, y = V.y0 + j * dx, [fx, fy] = F(x, y), m = Math.hypot(fx, fy); if (!isFinite(m) || m < 1e-12) continue;
      const L = dx * .42, ux = fx / m * L, uy = fy / m * L, k = Math.min(1, Math.log10(1 + m * 3) / 1.2), rgb = cmap(.25 + .75 * k);
      arrow(c, V.fx(x - ux / 2), V.fy(y - uy / 2), V.fx(x + ux / 2), V.fy(y + uy / 2), `rgb(${rgb})`, 1.4, 5);
    }
    if (sp.mode === 'stream' || sp.streamlines) {
      const seeds = []; if (charges.length) charges.filter(q => q.q > 0).forEach(q => { for (let a = 0; a < 16; a++) seeds.push([q.x + .12 * Math.cos(a / 16 * 6.283), q.y + .12 * Math.sin(a / 16 * 6.283)]); });
      else for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) seeds.push([V.x0 + (i + .5) * (V.x1 - V.x0) / 8, V.y0 + (j + .5) * (V.y1 - V.y0) / 8]);
      c.strokeStyle = K.C(.7); c.lineWidth = K.lw(1.2);
      seeds.forEach(([x, y]) => { c.beginPath(); c.moveTo(V.fx(x), V.fy(y)); for (let k = 0; k < 400; k++) { const [fx, fy] = F(x, y), m = Math.hypot(fx, fy); if (!(m > 1e-9)) break; const h = (V.x1 - V.x0) / 250; x += fx / m * h; y += fy / m * h; if (x < V.x0 || x > V.x1 || y < V.y0 || y > V.y1) break; if (charges.some(q => q.q < 0 && Math.hypot(x - q.x, y - q.y) < .08)) break; c.lineTo(V.fx(x), V.fy(y)); } c.stroke(); });
    }
    charges.forEach(q => { c.fillStyle = q.q > 0 ? COL.red : COL.blue; c.beginPath(); c.arc(V.fx(q.x), V.fy(q.y), 9, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = K.f(700, 13); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(q.q > 0 ? '+' : '−', V.fx(q.x), V.fy(q.y) + 1); });
    if (sp.shapes) TYPES.geometry(c, W, H, Object.assign({}, sp, { _V: V, noaxes: true }), s);
  };
  TYPES.heatmap = (c, W, H, sp, s) => {
    const xr = (sp.x || [-3, 3]).map(v => num(v, s)), yr = (sp.y || [-3, 3]).map(v => num(v, s)), V = new View(c, W, H, [xr[0], xr[1], yr[0], yr[1]], { equal: sp.equal }); const f = E(sp.f);
    const pw = Math.round(W - V.m.l - V.m.r), ph = Math.round(H - V.m.t - V.m.b), st = 3, vals = []; let lo = Infinity, hi = -Infinity;
    for (let py = 0; py < ph; py += st) for (let px = 0; px < pw; px += st) { const v = f(Object.assign({}, s, { x: V.ix(V.m.l + px), y: V.iy(V.m.t + py) })); vals.push(v); if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    if (sp.z) { lo = num(sp.z[0], s); hi = num(sp.z[1], s); }
    const img = c.createImageData(pw, ph); let k = 0; for (let py = 0; py < ph; py += st) for (let px = 0; px < pw; px += st) { const v = vals[k++], rgb = cmap((v - lo) / (hi - lo || 1), sp.colormap); for (let a = 0; a < st; a++) for (let b = 0; b < st; b++) { if (py + a >= ph || px + b >= pw) continue; const q = ((py + a) * pw + px + b) * 4; img.data[q] = rgb[0]; img.data[q + 1] = rgb[1]; img.data[q + 2] = rgb[2]; img.data[q + 3] = 255; } }
    c.putImageData(img, V.m.l, V.m.t); V.axes(Object.assign({ grid: false }, sp));
    if (sp.shapes) TYPES.geometry(c, W, H, Object.assign({}, sp, { _V: V, noaxes: true }), s);
  };
  TYPES.surface = (c, W, H, sp, s, st) => {
    const f = E(sp.f), xr = (sp.x || [-3, 3]).map(v => num(v, s)), yr = (sp.y || [-3, 3]).map(v => num(v, s)), n = 34, rot = st.rot || (st.rot = { a: .7, b: .55 });
    const pts = []; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= n; i++) { pts.push([]); for (let j = 0; j <= n; j++) { const x = xr[0] + (xr[1] - xr[0]) * i / n, y = yr[0] + (yr[1] - yr[0]) * j / n, z = f(Object.assign({}, s, { x, y })); pts[i].push([x, y, z]); if (isFinite(z)) { lo = Math.min(lo, z); hi = Math.max(hi, z); } } }
    if (sp.z) { lo = num(sp.z[0], s); hi = num(sp.z[1], s); }
    const sx = 2 / (xr[1] - xr[0]), sy = 2 / (yr[1] - yr[0]), sz = 1.3 / ((hi - lo) || 1), ca = Math.cos(rot.a), sa = Math.sin(rot.a), cb = Math.cos(rot.b), sb = Math.sin(rot.b), K = Math.min(W, H) * .36;
    const P = ([x, y, z]) => { const X = (x - (xr[0] + xr[1]) / 2) * sx, Y = (y - (yr[0] + yr[1]) / 2) * sy, Z = (Math.min(Math.max(z, lo), hi) - (lo + hi) / 2) * sz; const x1 = X * ca - Y * sa, y1 = X * sa + Y * ca; return [W / 2 + x1 * K, H / 2 - (Z * cb - y1 * sb) * K, y1 * cb + Z * sb]; };
    const quads = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = [pts[i][j], pts[i + 1][j], pts[i + 1][j + 1], pts[i][j + 1]], pp = q.map(P); quads.push({ pp, d: pp.reduce((a, p) => a + p[2], 0), z: q.reduce((a, p) => a + p[2], 0) / 4 }); }
    quads.sort((a, b) => b.d - a.d);
    quads.forEach(({ pp, z }) => { if (!isFinite(z)) return; const rgb = cmap((z - lo) / ((hi - lo) || 1), sp.colormap); c.fillStyle = `rgb(${rgb})`; c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); pp.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.stroke(); });
    label(c, 'drag to rotate', W - 8, H - 10, K.dim, 'right');
  };
  TYPES.surface.drag = (st, dx, dy) => { st.rot = st.rot || { a: .7, b: .55 }; st.rot.a += dx * .01; st.rot.b = Math.max(-.2, Math.min(1.5, st.rot.b + dy * .01)); };
  TYPES.vectors = (c, W, H, sp, s) => {
    const R = num(sp.range ?? 4, s), V = new View(c, W, H, [-R, R, -R, R], { equal: true }); V.axes(); V.clip();
    const M = sp.matrix ? sp.matrix.map(r => r.map(v => num(v, s))) : [[1, 0], [0, 1]], T = ([x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
    if (sp.matrix) { c.strokeStyle = K.C(.28); c.lineWidth = K.lw(1); for (let k = -6; k <= 6; k++) { [[[k, -6], [k, 6]], [[-6, k], [6, k]]].forEach(([a, b]) => { const A = T(a), B = T(b); c.beginPath(); c.moveTo(V.fx(A[0]), V.fy(A[1])); c.lineTo(V.fx(B[0]), V.fy(B[1])); c.stroke(); }); }
      const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(T); c.fillStyle = K.G(.22); c.beginPath(); sq.forEach(([x, y], i) => i ? c.lineTo(V.fx(x), V.fy(y)) : c.moveTo(V.fx(x), V.fy(y))); c.closePath(); c.fill();
      const det = M[0][0] * M[1][1] - M[0][1] * M[1][0]; arrow(c, V.fx(0), V.fy(0), V.fx(M[0][0]), V.fy(M[1][0]), COL.green, 2.5); arrow(c, V.fx(0), V.fy(0), V.fx(M[0][1]), V.fy(M[1][1]), COL.pink, 2.5);
      label(c, `det = ${fmt(det)}`, V.m.l + 6, V.m.t + 10, COL.gold);
      if (sp.eigen) { const tr = M[0][0] + M[1][1], disc = tr * tr / 4 - det; if (disc >= 0) [tr / 2 + Math.sqrt(disc), tr / 2 - Math.sqrt(disc)].forEach((lam, i) => { let v = Math.abs(M[0][1]) > 1e-9 ? [M[0][1], lam - M[0][0]] : Math.abs(M[1][0]) > 1e-9 ? [lam - M[1][1], M[1][0]] : (i ? [0, 1] : [1, 0]); const L = Math.hypot(...v); v = v.map(a => a / L * R * 1.5); c.strokeStyle = COL.purple; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(V.fx(-v[0]), V.fy(-v[1])); c.lineTo(V.fx(v[0]), V.fy(v[1])); c.stroke(); c.setLineDash([]); label(c, `λ${i + 1} = ${fmt(lam)}`, V.m.l + 6, V.m.t + 28 + i * 17, COL.purple); }); else label(c, 'complex eigenvalues (rotation)', V.m.l + 6, V.m.t + 28, COL.purple); }
    }
    (sp.vectors || []).forEach((v, i) => { let p = [num(v.x, s), num(v.y, s)]; if (v.transform) p = T(p); const o = v.from ? [num(v.from[0], s), num(v.from[1], s)] : [0, 0]; arrow(c, V.fx(o[0]), V.fy(o[1]), V.fx(o[0] + p[0]), V.fy(o[1] + p[1]), col(v.color, i + 1), 2.5); label(c, interp(v.label, s), V.fx(o[0] + p[0]) + 6, V.fy(o[1] + p[1]) - 8, col(v.color, i + 1)); });
    c.restore();
  };
  TYPES.phasor = (c, W, H, sp, s) => {
    const ph = (sp.phasors || []).map((p, i) => ({ m: num(p.mag ?? 1, s), a: num(p.deg ?? 0, s) * Math.PI / 180, label: p.label, color: col(p.color, i) }));
    const w = num(sp.omega ?? 1, s), th = (s.t || 0) * w, cx = H / 2, cy = H / 2, R = H * .4, mx = Math.max(1e-9, ...ph.map(p => p.m), sp.sum ? Math.hypot(ph.reduce((a, p) => a + p.m * Math.cos(p.a), 0), ph.reduce((a, p) => a + p.m * Math.sin(p.a), 0)) : 0), k = R / mx;
    c.strokeStyle = K.W(.12); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
    const all = ph.slice(); if (sp.sum) { const re = ph.reduce((a, p) => a + p.m * Math.cos(p.a), 0), im = ph.reduce((a, p) => a + p.m * Math.sin(p.a), 0); all.push({ m: Math.hypot(re, im), a: Math.atan2(im, re), label: sp.sum === true ? 'sum' : sp.sum, color: COL.white }); }
    all.forEach(p => { const a = p.a + th; arrow(c, cx, cy, cx + Math.cos(a) * p.m * k, cy - Math.sin(a) * p.m * k, p.color, 2.5); label(c, p.label, cx + Math.cos(a) * p.m * k + 5, cy - Math.sin(a) * p.m * k - 8, p.color); });
    // time traces: projections onto the vertical axis
    const x0 = H + 10, x1 = W - 8; c.strokeStyle = K.W(.2); c.beginPath(); c.moveTo(x0, cy); c.lineTo(x1, cy); c.stroke();
    all.forEach(p => { c.strokeStyle = p.color; c.lineWidth = K.lw(p.label === 'sum' ? 2.5 : 1.8); c.beginPath(); for (let i = 0; i <= 200; i++) { const u = i / 200, a = p.a + th - u * 4 * Math.PI, X = x0 + u * (x1 - x0), Y = cy - Math.sin(a) * p.m * k; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); c.setLineDash([3, 3]); c.strokeStyle = p.color + '88'; c.beginPath(); c.moveTo(cx + Math.cos(p.a + th) * p.m * k, cy - Math.sin(p.a + th) * p.m * k); c.lineTo(x0, cy - Math.sin(p.a + th) * p.m * k); c.stroke(); c.setLineDash([]); });
  };
  TYPES.signal = (c, W, H, sp, s) => {
    const f = E(sp.f), xr = (sp.x || [0, 1]).map(v => num(v, s)), spec = !!sp.spectrum, h1 = spec ? H * .55 : H;
    const N = 600, xs = [...Array(N + 1)].map((_, i) => xr[0] + (xr[1] - xr[0]) * i / N), ys = xs.map(x => f(Object.assign({}, s, { x })));
    let lo = Math.min(...ys.filter(isFinite)), hi = Math.max(...ys.filter(isFinite)); if (sp.y) { lo = num(sp.y[0], s); hi = num(sp.y[1], s); } const pad = (hi - lo || 2) * .1;
    const V = new View(c, W, h1, [xr[0], xr[1], lo - pad, hi + pad], {}); V.axes({ xlabel: sp.xlabel || 'time', ylabel: sp.ylabel }); V.clip();
    c.strokeStyle = sp.sample ? K.C(.45) : COL.accent; c.lineWidth = K.lw(2); c.beginPath(); xs.forEach((x, i) => i ? c.lineTo(V.fx(x), V.fy(ys[i])) : c.moveTo(V.fx(x), V.fy(ys[i]))); c.stroke();
    if (sp.sample) { const fs = num(sp.sample, s), T = 1 / fs, pts = []; for (let x = Math.ceil(xr[0] / T) * T; x <= xr[1]; x += T) pts.push([x, f(Object.assign({}, s, { x }))]);
      c.strokeStyle = COL.gold; c.fillStyle = COL.gold; pts.forEach(([x, y]) => { c.beginPath(); c.moveTo(V.fx(x), V.fy(0)); c.lineTo(V.fx(x), V.fy(y)); c.stroke(); c.beginPath(); c.arc(V.fx(x), V.fy(y), 3, 0, 7); c.fill(); });
      if (sp.reconstruct !== false) { c.strokeStyle = COL.pink; c.lineWidth = K.lw(1.6); c.setLineDash([5, 3]); c.beginPath(); xs.forEach((x, i) => { let y = 0; pts.forEach(([xk, yk]) => y += yk * FN.sinc((x - xk) / T)); i ? c.lineTo(V.fx(x), V.fy(y)) : c.moveTo(V.fx(x), V.fy(y)); }); c.stroke(); c.setLineDash([]); label(c, 'reconstructed from samples', W - 10, 14, COL.pink, 'right'); } }
    c.restore();
    if (spec) { // DFT magnitude of the shown window
      const M = 512, dt = (xr[1] - xr[0]) / M, smp = [...Array(M)].map((_, i) => f(Object.assign({}, s, { x: xr[0] + i * dt }))), fmax = num(sp.fmax ?? (0.5 / dt), s), K = Math.min(M / 2, Math.ceil(fmax * M * dt)), mags = [];
      for (let k = 0; k <= K; k++) { let re = 0, im = 0; for (let i = 0; i < M; i++) { const a = -2 * Math.PI * k * i / M; re += smp[i] * Math.cos(a); im += smp[i] * Math.sin(a); } mags.push(Math.hypot(re, im) / M * (k ? 2 : 1)); }
      const mm = Math.max(...mags) || 1; c.save(); c.translate(0, h1); const V2 = new View(c, W, H - h1, [0, K / (M * dt), 0, mm * 1.1], {}); V2.axes({ xlabel: 'frequency (Hz)', grid: false });
      c.fillStyle = COL.gold; mags.forEach((m, k) => { const x = V2.fx(k / (M * dt)); c.fillRect(x - 1, V2.fy(m), 2.5, V2.fy(0) - V2.fy(m)); }); c.restore();
    }
  };
  TYPES.bode = (c, W, H, sp, s) => {
    const { num: nm, den } = tfFromSpec(sp, s), fr = (sp.w || [0.01, 100]).map(v => num(v, s)), N = 300, ws = [...Array(N + 1)].map((_, i) => Math.pow(10, Math.log10(fr[0]) + i / N * (Math.log10(fr[1]) - Math.log10(fr[0]))));
    const H_ = ws.map(w => C.div(polyAt(nm, [0, w]), polyAt(den, [0, w]))), mag = H_.map(h => 20 * Math.log10(C.abs(h))); let ph = H_.map(h => Math.atan2(h[1], h[0]) * 180 / Math.PI);
    for (let i = 1; i < ph.length; i++) { while (ph[i] - ph[i - 1] > 180) ph[i] -= 360; while (ph[i] - ph[i - 1] < -180) ph[i] += 360; }
    const showPh = sp.phase !== false, h1 = showPh ? H * .55 : H; let lo = Math.min(...mag.filter(isFinite)), hi = Math.max(...mag.filter(isFinite)); lo = Math.max(lo, hi - 80);
    const V = new View(c, W, h1, [fr[0], fr[1], Math.floor((lo - 5) / 10) * 10, Math.ceil((hi + 5) / 10) * 10], { logx: true }); V.axes({ ylabel: 'gain (dB)' }); V.clip();
    c.strokeStyle = COL.accent; c.lineWidth = K.lw(2.2); c.beginPath(); ws.forEach((w, i) => i ? c.lineTo(V.fx(w), V.fy(mag[i])) : c.moveTo(V.fx(w), V.fy(mag[i]))); c.stroke();
    const m0 = Math.max(...mag), i3 = mag.findIndex((m, i) => i > 0 && m < m0 - 3 && mag[i - 1] >= m0 - 3);
    if (i3 > 0) { const w3 = ws[i3]; c.strokeStyle = COL.gold; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(V.fx(w3), V.m.t); c.lineTo(V.fx(w3), h1 - V.m.b); c.stroke(); c.setLineDash([]); label(c, `−3 dB at ${fmt(w3)} ${sp.unit || 'rad/s'}`, V.fx(w3) + 5, V.m.t + 10, COL.gold); }
    c.restore();
    if (showPh) { c.save(); c.translate(0, h1); const pl = Math.min(...ph), pu = Math.max(...ph); const V2 = new View(c, W, H - h1, [fr[0], fr[1], Math.floor(pl / 45) * 45 - 5, Math.ceil(pu / 45) * 45 + 5], { logx: true }); V2.axes({ ylabel: 'phase (°)', xlabel: sp.unit || 'ω (rad/s)' }); V2.clip(); c.strokeStyle = COL.pink; c.lineWidth = K.lw(2); c.beginPath(); ws.forEach((w, i) => i ? c.lineTo(V2.fx(w), V2.fy(ph[i])) : c.moveTo(V2.fx(w), V2.fy(ph[i]))); c.stroke(); c.restore(); c.restore(); }
  };
  TYPES.pz = (c, W, H, sp, s) => {
    const R = num(sp.range ?? 3, s), V = new View(c, W, H, [-R, R, -R, R], { equal: true }); const zp = sp.plane === 'z';
    if (zp) { c.fillStyle = K.Gr(.08); c.beginPath(); c.arc(V.fx(0), V.fy(0), V.fx(1) - V.fx(0), 0, 7); c.fill(); } else { c.fillStyle = K.Gr(.08); c.fillRect(V.m.l, V.m.t, V.fx(0) - V.m.l, H - V.m.t - V.m.b); }
    V.axes({ xlabel: 'Re', ylabel: 'Im' }); V.clip();
    if (zp) { c.strokeStyle = K.W(.5); c.beginPath(); c.arc(V.fx(0), V.fy(0), V.fx(1) - V.fx(0), 0, 7); c.stroke(); }
    if (sp.rootlocus) { const { num: N0, den: D0 } = tfFromSpec(sp.rootlocus, s); c.fillStyle = K.C(.65); for (let i = 0; i <= 160; i++) { const K = Math.pow(10, -3 + i * 6 / 160), n = D0.length >= N0.length ? D0.map((d, j) => d + K * (N0[j - (D0.length - N0.length)] || 0)) : D0; polyRoots(n).forEach(([re, im]) => { c.beginPath(); c.arc(V.fx(re), V.fy(im), 1.6, 0, 7); c.fill(); }); } const kk = num(sp.rootlocus.K ?? 1, s), n = D0.map((d, j) => d + kk * (N0[j - (D0.length - N0.length)] || 0)); polyRoots(n).forEach(([re, im]) => { c.fillStyle = COL.gold; c.beginPath(); c.arc(V.fx(re), V.fy(im), 5, 0, 7); c.fill(); }); }
    (sp.zeros || []).forEach(z => { const x = num(z[0], s), y = num(z[1] || 0, s); c.strokeStyle = COL.accent; c.lineWidth = K.lw(2); c.beginPath(); c.arc(V.fx(x), V.fy(y), 6, 0, 7); c.stroke(); });
    (sp.poles || []).forEach(p => { const x = num(p[0], s), y = num(p[1] || 0, s); c.strokeStyle = COL.pink; c.lineWidth = K.lw(2.4); c.beginPath(); c.moveTo(V.fx(x) - 6, V.fy(y) - 6); c.lineTo(V.fx(x) + 6, V.fy(y) + 6); c.moveTo(V.fx(x) + 6, V.fy(y) - 6); c.lineTo(V.fx(x) - 6, V.fy(y) + 6); c.stroke(); });
    label(c, zp ? 'stable inside the unit circle' : 'stable: left half-plane', V.m.l + 6, H - V.m.b - 10, COL.green); c.restore();
  };
  function layoutNodes(sp, W, H) { // returns id → [x,y] px
    const nodes = sp.nodes || [], P = {}, pad = 28; const has = nodes.every(n => n.x !== undefined);
    if (has) { nodes.forEach(n => P[n.id] = [pad + n.x / 100 * (W - 2 * pad), pad + n.y / 100 * (H - 2 * pad)]); return P; }
    const L = sp.layout || 'circle';
    if (L === 'tree' || L === 'layered') { const kids = {}, indeg = {}; nodes.forEach(n => { kids[n.id] = []; indeg[n.id] = 0; }); (sp.edges || []).forEach(e => { const [a, b] = Array.isArray(e) ? e : [e.from, e.to]; if (kids[a]) kids[a].push(b); indeg[b] = (indeg[b] || 0) + 1; }); const roots = nodes.filter(n => !indeg[n.id]).map(n => n.id); const depth = {}; const q = roots.map(r => [r, 0]); while (q.length) { const [id, d] = q.shift(); if (depth[id] !== undefined) continue; depth[id] = d; (kids[id] || []).forEach(k => q.push([k, d + 1])); } nodes.forEach(n => { if (depth[n.id] === undefined) depth[n.id] = 0; }); const levels = {}; nodes.forEach(n => (levels[depth[n.id]] = levels[depth[n.id]] || []).push(n.id)); const D = Math.max(...Object.keys(levels).map(Number)) + 1; Object.entries(levels).forEach(([d, ids]) => ids.forEach((id, i) => P[id] = L === 'tree' ? [pad + (i + .5) / ids.length * (W - 2 * pad), pad + (+d + .5) / D * (H - 2 * pad)] : [pad + (+d + .5) / D * (W - 2 * pad), pad + (i + .5) / ids.length * (H - 2 * pad)])); return P; }
    if (L === 'row') { nodes.forEach((n, i) => P[n.id] = [pad + (i + .5) / nodes.length * (W - 2 * pad), H / 2]); return P; }
    nodes.forEach((n, i) => { const a = -Math.PI / 2 + i / nodes.length * 2 * Math.PI; P[n.id] = [W / 2 + Math.cos(a) * (W / 2 - pad - 20), H / 2 + Math.sin(a) * (H / 2 - pad)]; }); return P;
  }
  function drawEdge(c, A, B, o, s, rA = 16, rB = 16) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const a = [A[0] + ux * rA, A[1] + uy * rA], b = [B[0] - ux * rB, B[1] - uy * rB], color = o.color ? col(o.color) : K.W(.55);
    if (o.dashed) c.setLineDash([5, 4]);
    if (o.directed !== false) arrow(c, a[0], a[1], b[0], b[1], color, K.lw(o.width || 1.6), 7); else { c.strokeStyle = color; c.lineWidth = K.lw(o.width || 1.6); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
    c.setLineDash([]); if (o.label !== undefined && o.label !== '') label(c, interp(String(o.label), s), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 8, K.ink2, 'center', 'middle', 10);
    if (o.flow) { const u = ((s.t || 0) * .6 + (o._i || 0) * .17) % 1; c.fillStyle = COL.gold; c.beginPath(); c.arc(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 3.2, 0, 7); c.fill(); }
  }
  TYPES.blocks = (c, W, H, sp, s) => {
    const P = layoutNodes(sp, W, H), size = {};
    c.font = K.f(500, 11, '', 1);
    (sp.nodes || []).forEach(n => { const tw = c.measureText(interp(n.label || n.id, s)).width; size[n.id] = n.shape === 'circle' || n.shape === 'sum' ? [15, 15] : [Math.max(28, tw / 2 + 10), 14]; });
    (sp.edges || []).forEach((e, i) => { const o = Array.isArray(e) ? { from: e[0], to: e[1], label: e[2] } : e; if (!P[o.from] || !P[o.to]) return; drawEdge(c, P[o.from], P[o.to], Object.assign({ flow: sp.flow, _i: i }, o), s, Math.min(...size[o.from]) + 4, Math.min(...size[o.to]) + 4); });
    (sp.nodes || []).forEach((n, i) => { const [x, y] = P[n.id], [w, h] = size[n.id], color = col(n.color, i); c.lineWidth = K.lw(1.6); c.strokeStyle = color; c.fillStyle = K.flat ? K.node : 'rgba(10,14,26,.92)';
      if (n.shape === 'circle' || n.shape === 'sum') { c.beginPath(); c.arc(x, y, 15, 0, 7); c.fill(); c.stroke(); if (n.shape === 'sum') { c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.moveTo(x, y - 7); c.lineTo(x, y + 7); c.stroke(); } }
      else if (n.shape === 'diamond') { c.beginPath(); c.moveTo(x, y - h - 4); c.lineTo(x + w, y); c.lineTo(x, y + h + 4); c.lineTo(x - w, y); c.closePath(); c.fill(); c.stroke(); }
      else { c.beginPath(); c.roundRect ? c.roundRect(x - w, y - h, 2 * w, 2 * h, 7) : c.rect(x - w, y - h, 2 * w, 2 * h); c.fill(); c.stroke(); }
      if (n.shape !== 'sum') { c.fillStyle = K.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(interp(n.label ?? n.id, s), x, y + (n.shape === 'circle' && n.sub ? -4 : 0)); } });
  };
  TYPES.graph = (c, W, H, sp, s) => {
    const P = layoutNodes(sp, W, H), steps = sp.steps || [], k = steps.length ? Math.floor((s.t || 0) * .8) % (steps.length + 1) : -1, lit = new Set(k > 0 ? steps.slice(0, k).flat() : []);
    (sp.edges || []).forEach((e, i) => { const [a, b, w] = Array.isArray(e) ? e : [e.from, e.to, e.label]; if (P[a] && P[b]) drawEdge(c, P[a], P[b], { directed: !!sp.directed, label: w, color: lit.has(a) && lit.has(b) ? 'gold' : null }, s, 13, 13); });
    (sp.nodes || []).forEach((n, i) => { const [x, y] = P[n.id], on = lit.has(n.id); c.fillStyle = on ? K.G(.9) : K.node; c.strokeStyle = on ? COL.gold : col(n.color, 0); c.lineWidth = K.lw(1.8); c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.stroke(); c.fillStyle = on ? K.onText : K.ink; c.font = K.f(600, 11); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n.label ?? n.id, x, y + 1); });
    if (steps.length) label(c, k > 0 ? `step ${k} of ${steps.length}` : 'start', 8, H - 10, COL.gold);
  };
  TYPES.fsm = (c, W, H, sp, s) => {
    const st = (sp.states || []).map(x => typeof x === 'string' ? { id: x } : x), P = layoutNodes({ nodes: st, layout: 'circle' }, W, H * .82), inp = String(sp.input || ''), k = inp ? Math.floor((s.t || 0) * .9) % (inp.length + 1) : 0;
    let cur = sp.start || (st[0] && st[0].id); for (let i = 0; i < k; i++) { const tr = (sp.transitions || []).find(t => t[0] === cur && String(t[2]).split(/[,/]/)[0].trim() === inp[i]); if (tr) cur = tr[1]; }
    (sp.transitions || []).forEach(([a, b, l]) => { if (a === b) { const [x, y] = P[a], up = y > 50 ? -1 : 1; c.strokeStyle = K.W(.55); c.beginPath(); c.arc(x, y + up * 22, 10, 0, 7); c.stroke(); label(c, String(l), x, y + up * 40, K.ink2, 'center', 'middle', 10); } else drawEdge(c, P[a], P[b], { label: l }, s, 17, 17); });
    st.forEach(n => { const [x, y] = P[n.id], on = n.id === cur; c.fillStyle = on ? COL.gold : K.node; c.strokeStyle = on ? COL.gold : COL.accent; c.lineWidth = K.lw(2); c.beginPath(); c.arc(x, y, 16, 0, 7); c.fill(); c.stroke(); if (n.accept) { c.beginPath(); c.arc(x, y, 12, 0, 7); c.stroke(); } c.fillStyle = on ? K.onText : K.ink; c.font = K.f(600, 11); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n.label ?? n.id, x, y + 1); });
    if (inp) { c.font = K.f(600, 13, 'mono', 2); c.textAlign = 'left'; for (let i = 0; i < inp.length; i++) { c.fillStyle = i < k ? K.dim : i === k ? COL.gold : K.ink; c.fillText(inp[i], 10 + i * 12, H - 12); } label(c, 'input →', 10 + inp.length * 12 + 8, H - 12, K.dim); }
  };
  function logicEval(ast, env) { switch (ast.t) { case 'v': return env[ast.v] ? 1 : 0; case 'n': return ast.v ? 1 : 0; case 'not': return logicEval(ast.a, env) ? 0 : 1; case 'b': { const a = logicEval(ast.a, env), b = logicEval(ast.b, env); return ast.o === '&&' || ast.o === '*' ? a & b : ast.o === '||' || ast.o === '+' ? a | b : ast.o === '^' ? a ^ b : 0; } case 'f': { const v = ast.args.map(x => logicEval(x, env)); const f = ast.f; return f === 'nand' ? 1 - (v[0] & v[1]) : f === 'nor' ? 1 - (v[0] | v[1]) : f === 'xor' ? v[0] ^ v[1] : f === 'xnor' ? 1 - (v[0] ^ v[1]) : 0; } } return 0; }
  ['nand', 'nor', 'xor', 'xnor'].forEach(f => FN[f] = (a, b) => 0);
  function normLogic(e) {
    const once = x => x.replace(/(^|[^&])&([^&]|$)/g, '$1&&$2').replace(/(^|[^|])\|([^|]|$)/g, '$1||$2');
    return once(once(String(e).replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!').replace(/~/g, '!')));
  }
  TYPES.logic = (c, W, H, sp, s, st) => {
    const ins = sp.inputs || ['A', 'B'], ast = parse(normLogic(sp.expr || 'A && B')); st.env = st.env || {}; ins.forEach(i => { if (st.env[i] === undefined) st.env[i] = 0; });
    // gate tree drawing on the left two-thirds
    const gx1 = W * .64; let leaf = 0; const leaves = [];
    const L = (n, d) => { if (n.t === 'v' || n.t === 'n') { const y = 16 + leaf++ * 0; leaves.push(n); return { n, d, kids: [] }; } const kids = n.t === 'not' ? [L(n.a, d + 1)] : n.t === 'b' ? [L(n.a, d + 1), L(n.b, d + 1)] : n.args.map(a => L(a, d + 1)); return { n, d, kids }; };
    const tree = L(ast, 0); let maxd = 0; const walk = (t) => { maxd = Math.max(maxd, t.d); t.kids.forEach(walk); }; walk(tree);
    let li = 0; const nLeaves = Math.max(1, leaves.length);
    const place = t => { if (!t.kids.length) { t.y = 18 + (li++ + .5) / nLeaves * (H - 36); } else { t.kids.forEach(place); t.y = t.kids.reduce((a, k) => a + k.y, 0) / t.kids.length; } t.x = gx1 - 28 - t.d * ((gx1 - 70) / Math.max(1, maxd + .5)); };
    place(tree);
    const val = t => logicEval(t.n, st.env);
    const gateName = n => n.t === 'not' ? 'NOT' : n.t === 'f' ? n.f.toUpperCase() : n.o === '&&' || n.o === '*' ? 'AND' : n.o === '^' ? 'XOR' : 'OR';
    const draw = t => {
      t.kids.forEach(k => { draw(k); c.strokeStyle = val(k) ? COL.gold : K.off; c.lineWidth = K.lw(2); c.beginPath(); c.moveTo(k.x + (k.kids.length ? 16 : 14), k.y); c.lineTo((t.x - 16 + k.x + 16) / 2, k.y); c.lineTo((t.x - 16 + k.x + 16) / 2, t.y + (k.y - t.y) * .35); c.lineTo(t.x - 16, t.y + (k.y - t.y) * .35); c.stroke(); });
      if (!t.kids.length) { const on = val(t); c.fillStyle = on ? COL.gold : K.offFill; c.beginPath(); c.roundRect ? c.roundRect(t.x - 14, t.y - 11, 28, 22, 6) : c.rect(t.x - 14, t.y - 11, 28, 22); c.fill(); c.fillStyle = on ? K.onText : K.ink; c.font = K.f(700, 11); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${t.n.v}=${on}`, t.x, t.y + 1); t._hit = [t.x - 14, t.y - 11, 28, 22, t.n.v]; return; }
      const on = val(t); c.fillStyle = K.node; c.strokeStyle = on ? COL.gold : COL.accent; c.lineWidth = K.lw(2); c.beginPath();
      const g = gateName(t.n); if (g === 'NOT') { c.moveTo(t.x - 14, t.y - 10); c.lineTo(t.x + 8, t.y); c.lineTo(t.x - 14, t.y + 10); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.arc(t.x + 11, t.y, 3, 0, 7); c.stroke(); }
      else if (/AND/.test(g)) { c.moveTo(t.x - 16, t.y - 13); c.lineTo(t.x, t.y - 13); c.arc(t.x, t.y, 13, -Math.PI / 2, Math.PI / 2); c.lineTo(t.x - 16, t.y + 13); c.closePath(); c.fill(); c.stroke(); if (g === 'NAND') { c.beginPath(); c.arc(t.x + 16, t.y, 3, 0, 7); c.stroke(); } }
      else { c.moveTo(t.x - 18, t.y - 13); c.quadraticCurveTo(t.x + 4, t.y - 13, t.x + 16, t.y); c.quadraticCurveTo(t.x + 4, t.y + 13, t.x - 18, t.y + 13); c.quadraticCurveTo(t.x - 10, t.y, t.x - 18, t.y - 13); c.fill(); c.stroke(); if (/X/.test(g)) { c.beginPath(); c.moveTo(t.x - 22, t.y - 13); c.quadraticCurveTo(t.x - 14, t.y, t.x - 22, t.y + 13); c.stroke(); } if (/^N|XNOR/.test(g) && g !== 'NOT') { c.beginPath(); c.arc(t.x + 19, t.y, 3, 0, 7); c.stroke(); } }
      c.fillStyle = K.dim; c.font = K.f(400, 9); c.textAlign = 'center'; c.fillText(g, t.x - 2, t.y + 23);
    };
    draw(tree); const out = val(tree); c.strokeStyle = out ? COL.gold : K.off; c.lineWidth = K.lw(2); c.beginPath(); c.moveTo(tree.x + 18, tree.y); c.lineTo(gx1, tree.y); c.stroke(); label(c, `${sp.output || 'Y'} = ${out}`, gx1 - 2, tree.y - 14, out ? COL.gold : K.ink, 'right');
    st.hits = []; const collect = t => { if (t._hit) st.hits.push(t._hit); t.kids.forEach(collect); }; collect(tree);
    // truth table
    const tx = gx1 + 10, rows = 1 << ins.length, rh = Math.min(16, (H - 24) / (rows + 1)), cw = Math.min(26, (W - tx - 6) / (ins.length + 1));
    c.font = K.f(600, Math.min(11, rh - 3)); c.textAlign = 'center'; c.textBaseline = 'middle';
    [...ins, sp.output || 'Y'].forEach((h, j) => { c.fillStyle = j === ins.length ? COL.gold : COL.accent; c.fillText(h, tx + (j + .5) * cw, 10 + rh / 2); });
    for (let r = 0; r < rows; r++) { const env = {}; ins.forEach((iN, j) => env[iN] = (r >> (ins.length - 1 - j)) & 1); const o = logicEval(ast, env), cur = ins.every(iN => env[iN] === st.env[iN]); if (cur) { c.fillStyle = K.G(.15); c.fillRect(tx, 10 + (r + 1) * rh, cw * (ins.length + 1), rh); } ins.forEach((iN, j) => { c.fillStyle = K.ink2; c.fillText(env[iN], tx + (j + .5) * cw, 10 + (r + 1.5) * rh); }); c.fillStyle = o ? COL.gold : K.dim; c.fillText(o, tx + (ins.length + .5) * cw, 10 + (r + 1.5) * rh); }
    label(c, 'click an input to flip it', 8, H - 9, K.dim);
  };
  TYPES.logic.click = (st, x, y) => { (st.hits || []).forEach(([hx, hy, w, h, v]) => { if (x >= hx && x <= hx + w && y >= hy && y <= hy + h) st.env[v] = st.env[v] ? 0 : 1; }); };
  TYPES.kmap = (c, W, H, sp) => {
    const v = sp.vars || ['A', 'B', 'C', 'D'], n = v.length, gray = [0, 1, 3, 2], rv = n >= 3 ? 2 : 1, cv = n - rv, R = 1 << rv, Cc = 1 << cv, ones = new Set(sp.minterms || []), dc = new Set(sp.dontcare || []);
    const cs = Math.min((W - 60) / Cc, (H - 50) / R), x0 = (W - cs * Cc) / 2 + 10, y0 = 36;
    c.font = K.f(600, 12); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < R; i++) for (let j = 0; j < Cc; j++) {
      const rb = R === 4 ? gray[i] : i, cb = Cc === 4 ? gray[j] : j, m = (rb << cv) | cb, x = x0 + j * cs, y = y0 + i * cs;
      c.fillStyle = ones.has(m) ? K.G(.25) : dc.has(m) ? K.C(.12) : K.W(.03); c.fillRect(x, y, cs - 2, cs - 2);
      c.fillStyle = ones.has(m) ? COL.gold : dc.has(m) ? COL.accent : K.dim; c.fillText(ones.has(m) ? '1' : dc.has(m) ? 'X' : '0', x + cs / 2, y + cs / 2); c.fillStyle = '#5d6780'; c.font = K.f(400, 9); c.fillText(m, x + cs - 9, y + 9); c.font = K.f(600, 12);
      if (i === 0) { c.fillStyle = COL.accent; c.fillText(cb.toString(2).padStart(cv, '0'), x + cs / 2, y0 - 10); }
      if (j === 0) { c.fillStyle = COL.accent; c.fillText(rb.toString(2).padStart(rv, '0'), x0 - 16, y + cs / 2); }
    }
    c.fillStyle = K.ink2; c.fillText(`${v.slice(0, rv).join('')} \\ ${v.slice(rv).join('')}`, x0 - 10, y0 - 24);
    (sp.groups || []).forEach((g, k) => { const cells = g.map(m => { const r = m >> cv, cc = m & (Cc - 1); return [gray.indexOf(r) >= 0 && R === 4 ? gray.indexOf(r) : r, Cc === 4 ? gray.indexOf(cc) : cc]; }); const rs = cells.map(a => a[0]), cs2 = cells.map(a => a[1]); c.strokeStyle = PAL[k % 6]; c.lineWidth = K.lw(2.5); c.strokeRect(x0 + Math.min(...cs2) * cs + 3 + k, y0 + Math.min(...rs) * cs + 3 + k, (Math.max(...cs2) - Math.min(...cs2) + 1) * cs - 8 - 2 * k, (Math.max(...rs) - Math.min(...rs) + 1) * cs - 8 - 2 * k); });
  };
  TYPES.dist = (c, W, H, sp, s, st) => {
    const kind = sp.kind || 'normal', P = k => num(sp[k], s), discrete = ['binomial', 'poisson', 'geometric'].includes(kind);
    let pdf, cdfLo, xr;
    if (kind === 'normal') { const m = P('mu') || 0, sd = P('sigma') || 1; pdf = x => FN.gauss(x, m, sd); xr = [m - 4 * sd, m + 4 * sd]; }
    else if (kind === 'uniform') { const a = P('a') || 0, b = P('b') || 1; pdf = x => x >= a && x <= b ? 1 / (b - a) : 0; xr = [a - (b - a) * .3, b + (b - a) * .3]; }
    else if (kind === 'exponential') { const l = P('lambda') || 1; pdf = x => x < 0 ? 0 : l * Math.exp(-l * x); xr = [0, 5 / l]; }
    else if (kind === 'binomial') { const n = Math.round(P('n') || 10), p = P('p') ?? .5; pdf = k => FN.choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); xr = [0, n]; }
    else if (kind === 'poisson') { const l = P('lambda') || 3; pdf = k => Math.exp(-l) * Math.pow(l, k) / FN.fact(k); xr = [0, Math.ceil(l + 4 * Math.sqrt(l) + 3)]; }
    else if (kind === 'geometric') { const p = P('p') || .3; pdf = k => k < 1 ? 0 : Math.pow(1 - p, k - 1) * p; xr = [0, Math.ceil(5 / p)]; }
    else { const f = E(sp.f); pdf = x => f(Object.assign({}, s, { x })); xr = (sp.x || [-4, 4]).map(v => num(v, s)); }
    const xs = discrete ? [...Array(xr[1] - xr[0] + 1)].map((_, i) => xr[0] + i) : [...Array(301)].map((_, i) => xr[0] + (xr[1] - xr[0]) * i / 300), ys = xs.map(pdf), ymax = Math.max(...ys) * 1.15 || 1;
    const V = new View(c, W, H, [xr[0] - (discrete ? .7 : 0), xr[1] + (discrete ? .7 : 0), 0, ymax], {}); V.axes({ xlabel: sp.xlabel, ylabel: discrete ? 'P(X = k)' : 'density' }); V.clip();
    const a = sp.shade ? num(sp.shade[0], s) : null, b = sp.shade ? num(sp.shade[1], s) : null; let area = 0;
    if (discrete) xs.forEach((k, i) => { const inS = sp.shade && k >= a && k <= b; if (inS) area += ys[i]; c.fillStyle = inS ? COL.gold : COL.accent + 'aa'; const w = Math.max(2, (V.fx(1) - V.fx(0)) * .7); c.fillRect(V.fx(k) - w / 2, V.fy(ys[i]), w, V.fy(0) - V.fy(ys[i])); });
    else { if (sp.shade) { c.fillStyle = COL.gold + '55'; c.beginPath(); c.moveTo(V.fx(a), V.fy(0)); for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200, y = pdf(x); c.lineTo(V.fx(x), V.fy(y)); area += y * (b - a) / 200; } c.lineTo(V.fx(b), V.fy(0)); c.fill(); } c.strokeStyle = COL.accent; c.lineWidth = K.lw(2.2); c.beginPath(); xs.forEach((x, i) => i ? c.lineTo(V.fx(x), V.fy(ys[i])) : c.moveTo(V.fx(x), V.fy(ys[i]))); c.stroke(); }
    if (sp.sample) { // histogram of random draws growing over time (law of large numbers)
      st.draws = st.draws || []; let want = Math.min(2000, Math.floor((+s.t || 0) * 60)); if (!(want >= 0)) want = 0; const rnd = () => { if (kind === 'normal') { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return (P('mu') || 0) + (P('sigma') || 1) * Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); } if (kind === 'uniform') return (P('a') || 0) + Math.random() * ((P('b') || 1) - (P('a') || 0)); if (kind === 'exponential') return -Math.log(1 - Math.random()) / (P('lambda') || 1); if (kind === 'binomial') { let k = 0; for (let i = 0; i < Math.round(P('n') || 10); i++) if (Math.random() < (P('p') ?? .5)) k++; return k; } if (kind === 'poisson') { let k = 0, L = Math.exp(-(P('lambda') || 3)), p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; } return 0; };
      while (st.draws.length < want) st.draws.push(rnd()); if (want < st.draws.length) st.draws.length = want;
      const nb = discrete ? xr[1] - xr[0] + 1 : 40, bw = discrete ? 1 : (xr[1] - xr[0]) / nb, hist = Array(nb).fill(0); st.draws.forEach(d => { const i = Math.floor((d - xr[0] + (discrete ? .5 : 0)) / bw); if (i >= 0 && i < nb) hist[i]++; });
      c.fillStyle = K.P(.45); hist.forEach((h, i) => { const hh = h / Math.max(1, st.draws.length) / bw; const x = xr[0] + i * bw - (discrete ? .5 : 0); c.fillRect(V.fx(x), V.fy(hh), V.fx(x + bw) - V.fx(x) - 1, V.fy(0) - V.fy(hh)); });
      label(c, `${st.draws.length} random samples`, W - 10, 14, COL.pink, 'right');
    }
    c.restore(); if (sp.shade) label(c, `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) ≈ ${fmt(area)}`, V.m.l + 8, V.m.t + 10, COL.gold);
  };
  TYPES.bits = (c, W, H, sp, s, st) => {
    const n = Math.min(32, sp.bits || 8), mode = sp.mode || 'unsigned', M = Math.pow(2, n); if (st.val === undefined) st.val = ((Math.round(num(sp.value ?? 37, s)) % M) + M) % M; const bit = i => Math.floor(st.val / Math.pow(2, i)) % 2;
    const bw = Math.min(36, (W - 20) / n), x0 = (W - bw * n) / 2, y0 = 26; st.hits = [];
    for (let i = 0; i < n; i++) { const b = bit(n - 1 - i), x = x0 + i * bw, w = mode === 'twos' && i === 0 ? -Math.pow(2, n - 1) : Math.pow(2, n - 1 - i); c.fillStyle = b ? COL.gold : K.W(.06); c.fillRect(x + 2, y0, bw - 4, bw - 4); c.fillStyle = b ? K.onText : K.ink; c.font = K.f(700, 16, 'mono'); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b, x + bw / 2, y0 + bw / 2 - 2); c.fillStyle = K.dim; c.font = K.f(400, n > 8 ? 8 : 9); c.fillText(n > 8 ? (i === 0 && mode === 'twos' ? '−2' : '2') + (n - 1 - i) : w, x + bw / 2, y0 + bw + 8); st.hits.push([x, y0, bw, bw, n - 1 - i]); }
    const signed = mode === 'twos' && bit(n - 1) ? st.val - M : st.val;
    c.font = K.f(600, 14, 'mono'); c.textAlign = 'center'; c.fillStyle = K.ink;
    c.fillText(`decimal ${signed}   ·   hex 0x${st.val.toString(16).toUpperCase().padStart(Math.ceil(n / 4), '0')}${mode === 'twos' ? '   ·   two\'s complement' : ''}`, W / 2, y0 + bw + 34);
    label(c, 'click a bit to flip it', 8, H - 9, K.dim);
  };
  TYPES.bits.click = (st, x, y) => (st.hits || []).forEach(([hx, hy, w, h, b]) => { if (x >= hx && x <= hx + w && y >= hy && y <= hy + h) st.val += (Math.floor(st.val / Math.pow(2, b)) % 2 ? -1 : 1) * Math.pow(2, b); });
  TYPES.bars = (c, W, H, sp, s) => {
    const bars = (sp.bars || []).map((b, i) => ({ l: interp(b.label, s), v: num(b.value, s), c: col(b.color, i) })), mx = Math.max(...bars.map(b => b.v), 1e-12) * 1.15;
    const V = new View(c, W, H, [0, bars.length, sp.logy ? Math.min(...bars.map(b => b.v)) / 3 : 0, mx], { logy: sp.logy, mb: 34 }); V.axes({ ylabel: sp.ylabel, grid: true }); c.save();
    bars.forEach((b, i) => { c.fillStyle = b.c; const x = V.fx(i + .15), w = V.fx(i + .85) - x; c.fillRect(x, V.fy(b.v), w, V.fy(V.y0) - V.fy(b.v)); c.fillStyle = K.ink2; c.font = K.f(400, 10); c.textAlign = 'center'; c.fillText(b.l, x + w / 2, H - 14); c.fillStyle = b.c; c.fillText(fmt(b.v), x + w / 2, V.fy(b.v) - 7); });
    c.restore();
  };
  TYPES.table = (c, W, H, sp, s) => {
    const cols = sp.cols || [], rows = sp.rows || [], rh = Math.min(22, (H - 10) / (rows.length + 1)), cw = (W - 16) / Math.max(1, cols.length);
    c.font = K.f(600, 11); c.textBaseline = 'middle'; c.textAlign = 'left';
    cols.forEach((h, j) => { c.fillStyle = COL.accent; c.fillText(h, 8 + j * cw + 4, 6 + rh / 2); });
    rows.forEach((r, i) => { if (i % 2 === 0) { c.fillStyle = K.W(.04); c.fillRect(8, 6 + (i + 1) * rh, W - 16, rh); } r.forEach((v, j) => { c.fillStyle = K.ink; c.font = K.f(400, 11); c.fillText(interp(String(v), s), 8 + j * cw + 4, 6 + (i + 1.5) * rh); }); });
  };
  TYPES.ode = (c, W, H, sp, s) => { // dx/dt systems, integrated with RK4
    const vars = sp.vars || [], ids = vars.map(v => v.id), fs = vars.map(v => E(v.f)), T = num(sp.t ?? 50, s), N = Math.min(4000, sp.steps || 1200), h = T / N;
    let y = vars.map(v => num(v.init ?? 0, s)); const out = [y.slice()];
    const F = (t, yy) => { const q = Object.assign({}, s, { time: t }); ids.forEach((id, i) => q[id] = yy[i]); return fs.map(f => f(q)); };
    for (let k = 0; k < N; k++) { const t = k * h, k1 = F(t, y), k2 = F(t + h / 2, y.map((v, i) => v + h / 2 * k1[i])), k3 = F(t + h / 2, y.map((v, i) => v + h / 2 * k2[i])), k4 = F(t + h, y.map((v, i) => v + h * k3[i])); y = y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); if (!y.every(isFinite)) break; out.push(y.slice()); }
    const show = sp.phase ? 'phase' : 'time';
    if (show === 'phase') { const [ix, iy] = sp.phase.map(id => ids.indexOf(id)); const xs = out.map(r => r[ix]), ys = out.map(r => r[iy]); const pad = (a, b) => { const d = (b - a) || 1; return [a - d * .08, b + d * .08]; }; const [x0, x1] = sp.xr ? sp.xr.map(v => num(v, s)) : pad(Math.min(...xs), Math.max(...xs)), [y0, y1] = sp.yr ? sp.yr.map(v => num(v, s)) : pad(Math.min(...ys), Math.max(...ys));
      const V = new View(c, W, H, [x0, x1, y0, y1], {}); V.axes({ xlabel: vars[ix].label || ids[ix], ylabel: vars[iy].label || ids[iy] }); V.clip(); c.strokeStyle = COL.accent; c.lineWidth = K.lw(2); c.beginPath(); xs.forEach((x, i) => i ? c.lineTo(V.fx(x), V.fy(ys[i])) : c.moveTo(V.fx(x), V.fy(ys[i]))); c.stroke();
      const k = Math.floor(((s.t || 0) * .12 % 1) * (out.length - 1)); c.fillStyle = COL.gold; c.beginPath(); c.arc(V.fx(xs[k]), V.fy(ys[k]), 5, 0, 7); c.fill(); c.restore(); return; }
    let lo = Infinity, hi = -Infinity; out.forEach(r => vars.forEach((v, i) => { if (v.hide) return; lo = Math.min(lo, r[i]); hi = Math.max(hi, r[i]); })); if (sp.y) { lo = num(sp.y[0], s); hi = num(sp.y[1], s); } const pd = (hi - lo || 1) * .08;
    const V = new View(c, W, H, [0, T, sp.y ? lo : lo - pd, sp.y ? hi : hi + pd], {}); V.axes({ xlabel: sp.xlabel || 'time', ylabel: sp.ylabel }); V.clip();
    vars.forEach((v, i) => { if (v.hide) return; c.strokeStyle = col(v.color, i); c.lineWidth = K.lw(2.2); c.beginPath(); out.forEach((r, k) => k ? c.lineTo(V.fx(k * h), V.fy(r[i])) : c.moveTo(V.fx(0), V.fy(r[i]))); c.stroke(); });
    if (usesT(sp)) { const tt = ((s.t || 0) * (sp.speed || .15) % 1) * T; c.strokeStyle = K.W(.35); c.beginPath(); c.moveTo(V.fx(tt), V.m.t); c.lineTo(V.fx(tt), H - V.m.b); c.stroke(); }
    c.restore(); let ly = V.m.t + (sp.ylabel ? 24 : 6); vars.forEach((v, i) => { if (v.hide || !v.label) return; label(c, v.label, V.m.l + 8, ly + 6, col(v.color, i)); ly += 17; });
  };
  TYPES.geometry = (c, W, H, sp, s) => {
    const r = (sp.range || [-5, 5, -5, 5]).map(v => num(v, s)), V = sp._V || new View(c, W, H, r, { equal: sp.equal !== false, ml: sp.axes ? 38 : 8, mb: sp.axes ? 24 : 8 });
    if (!sp._V) { if (sp.axes) V.axes(sp); else if (sp.grid) { c.strokeStyle = K.W(.06); const st = niceStep(V.x1 - V.x0, 10); for (let x = Math.ceil(V.x0 / st) * st; x <= V.x1; x += st) { c.beginPath(); c.moveTo(V.fx(x), 0); c.lineTo(V.fx(x), H); c.stroke(); } for (let y = Math.ceil(V.y0 / st) * st; y <= V.y1; y += st) { c.beginPath(); c.moveTo(0, V.fy(y)); c.lineTo(W, V.fy(y)); c.stroke(); } } }
    const sc = V.fx(1) - V.fx(0);
    (sp.shapes || []).forEach((g, i) => {
      if (g.when !== undefined && !num(g.when, s)) return;
      const color = col(g.color, i), N = k => num(g[k], s);
      c.save(); if (sp.axes && g.k !== 'text') { c.beginPath(); c.rect(V.m.l, V.m.t, W - V.m.l - V.m.r, H - V.m.t - V.m.b); c.clip(); }   /* a line stops at the plot's edge, not at the plate's */
      c.strokeStyle = color; c.fillStyle = g.fill ? col(g.fill) : color; c.lineWidth = K.lw(g.width || 2); if (g.dash) c.setLineDash([5, 4]); if (g.alpha !== undefined) c.globalAlpha = N('alpha');
      switch (g.k) {
        case 'line': c.beginPath(); c.moveTo(V.fx(N('x1')), V.fy(N('y1'))); c.lineTo(V.fx(N('x2')), V.fy(N('y2'))); c.stroke(); break;
        case 'arrow': arrow(c, V.fx(N('x1')), V.fy(N('y1')), V.fx(N('x2')), V.fy(N('y2')), color, K.lw(g.width || 2)); break;
        case 'circle': c.beginPath(); c.arc(V.fx(N('x')), V.fy(N('y')), Math.abs(N('r') * sc), 0, 7); g.fill ? c.fill() : null; if (g.stroke !== false) c.stroke(); break;
        case 'point': c.beginPath(); c.arc(V.fx(N('x')), V.fy(N('y')), g.size || 4, 0, 7); c.fill(); break;
        case 'rect': c.beginPath(); c.rect(V.fx(N('x')), V.fy(N('y') + N('h')), N('w') * sc, N('h') * sc); g.fill ? c.fill() : null; if (g.stroke !== false) c.stroke(); break;
        case 'arc': c.beginPath(); c.arc(V.fx(N('x')), V.fy(N('y')), N('r') * sc, -N('a1'), -N('a0'), false); c.stroke(); break;
        case 'poly': c.beginPath(); (g.pts || []).forEach(([x, y], k) => { const X = V.fx(num(x, s)), Y = V.fy(num(y, s)); k ? c.lineTo(X, Y) : c.moveTo(X, Y); }); if (g.closed !== false) c.closePath(); g.fill ? c.fill() : null; if (g.stroke !== false) c.stroke(); break;
        case 'curve': { const fx = E(g.x), fy = E(g.y), [a, b] = (g.s || [0, 1]).map(v => num(v, s)); c.beginPath(); for (let k = 0; k <= 200; k++) { const q = Object.assign({}, s, { s: a + (b - a) * k / 200 }); const X = V.fx(fx(q)), Y = V.fy(fy(q)); k ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); break; }
        case 'text': c.globalAlpha = 1; label(c, interp(g.text, s), V.fx(N('x')), V.fy(N('y')), color, g.align || 'center', 'middle', g.size || 11); break;
        case 'spring': { const x1 = V.fx(N('x1')), y1 = V.fy(N('y1')), x2 = V.fx(N('x2')), y2 = V.fy(N('y2')), n = g.coils || 10, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; c.beginPath(); c.moveTo(x1, y1); for (let k = 1; k < 2 * n; k++) { const u = k / (2 * n), o = (k % 2 ? 1 : -1) * 7; c.lineTo(x1 + dx * u - uy * o, y1 + dy * u + ux * o); } c.lineTo(x2, y2); c.stroke(); break; }
      }
      c.restore();
    });
  };

  /* ---------------- runtime: canvas + sliders + play ---------------- */
  const live = new Set();
  function renderViz(host, spec, o = {}) {
    useTheme(); const wrap = document.createElement('div'); wrap.className = 'vz'; host.appendChild(wrap);
    const cv = document.createElement('canvas'); wrap.appendChild(cv); const ctx = cv.getContext('2d');
    const st = { p: {}, t: 0, playing: true, dead: false }, animated = usesT(spec) || (spec.type === 'dist' && spec.sample) || (spec.type === 'phasor') || (spec.type === 'graph' && spec.steps) || (spec.type === 'fsm' && spec.input) || (spec.type === 'blocks' && spec.flow);
    (spec.params || []).forEach(p => st.p[p.id] = p.value ?? p.min ?? 0);
    const ctrl = document.createElement('div'); ctrl.className = 'vzc'; wrap.appendChild(ctrl);
    (spec.params || []).forEach(p => { const r = document.createElement('label'); r.innerHTML = `<span>${p.label || p.id}</span><input type="range" min="${p.min}" max="${p.max}" step="${p.step || (p.max - p.min) / 100}" value="${st.p[p.id]}"><b></b>`; const inp = r.querySelector('input'), b = r.querySelector('b'); const upd = () => { st.p[p.id] = +inp.value; b.textContent = fmt(+inp.value) + (p.unit ? ' ' + p.unit : ''); draw(); }; inp.oninput = upd; b.textContent = fmt(st.p[p.id]) + (p.unit ? ' ' + p.unit : ''); ctrl.appendChild(r); });
    let pb = null; if (animated) { pb = document.createElement('button'); pb.className = 'vzp'; pb.textContent = 'Pause'; pb.onclick = () => { st.playing = !st.playing; pb.textContent = st.playing ? 'Pause' : 'Play'; }; ctrl.appendChild(pb); }
    const ro = document.createElement('div'); ro.className = 'vzr'; wrap.appendChild(ro);
    if (spec.caption) { const cp = document.createElement('div'); cp.className = 'vzcap'; wrap.appendChild(cp); cp.textContent = spec.caption; }
    const size = () => { const w = Math.max(200, wrap.clientWidth || K.lw(o.width || 320)), h = o.height || spec.height || Math.round(w * (spec.aspect || .62)), dpr = Math.min(2, devicePixelRatio || 1); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return [w, h]; };
    let WH = size();
    function draw() {
      const [W, H] = WH, s = Object.assign({ t: st.t }, st.p); ctx.clearRect(0, 0, W, H);
      try { (TYPES[spec.type] || TYPES.geometry)(ctx, W, H, spec, s, st); } catch (e) { (G.VIZ_ERRORS = G.VIZ_ERRORS || []).push((o.id || spec.type) + ': ' + e.message); ctx.fillStyle = K.err; ctx.font = K.f(400, 12); ctx.fillText('Figure error: ' + e.message, 8, 20); }
      if (spec.readouts) ro.innerHTML = spec.readouts.map(r => `<span>${r.label}: <b>${(() => { try { return fmt(E(r.value)(s)); } catch (e) { return '?'; } })()}${r.unit ? ' ' + r.unit : ''}</b></span>`).join('');
    }
    const T = TYPES[spec.type] || {};
    let drag = null; cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; const b = cv.getBoundingClientRect(); if (T.click) { T.click(st, e.clientX - b.left, e.clientY - b.top); draw(); } });
    addEventListener('pointerup', () => drag = null); cv.addEventListener('pointermove', e => { if (drag && T.drag) { T.drag(st, e.clientX - drag[0], e.clientY - drag[1]); drag = [e.clientX, e.clientY]; draw(); } });
    let last = performance.now(); const tick = now => { if (st.dead) return; const dt = Math.min(.1, (now - last) / 1000); last = now; if (animated && st.playing && wrap.isConnected) { st.t += dt; draw(); } if (!wrap.isConnected) { st.dead = true; live.delete(st); return; } requestAnimationFrame(tick); };
    draw(); requestAnimationFrame(tick); live.add(st);
    const onR = () => { WH = size(); draw(); }; new ResizeObserver(onR).observe(wrap);
    return { destroy() { st.dead = true; wrap.remove(); }, redraw: draw };
  }
  G.VIZX = { parse, compile, E, TYPES, renderViz, fmt, usesT, FN };
  G.renderViz = renderViz;
  if (typeof module !== 'undefined') module.exports = G.VIZX;
})(typeof window !== 'undefined' ? window : globalThis);

/* ---------- loading specs & hooking into the node card ---------- */
const VIZ = {};
let VIZ_READY = null;
function loadViz() { if (!VIZ_READY) VIZ_READY = getJSON('data/viz/manifest.json').then(fs => Promise.all(fs.map(f => getJSON('data/viz/' + f).catch(() => ({}))))).then(arr => { arr.forEach(m => Object.assign(VIZ, m)); return VIZ; }).catch(() => VIZ); return VIZ_READY; }
function vizFor(id) { return VIZ[id] || null; }
function mountViz(el, id) {
  loadViz().then(() => {
    const spec = vizFor(id); if (!spec || !el.isConnected) return;
    el.innerHTML = ''; renderViz(el, spec);
    const big = document.createElement('button'); big.className = 'vzbig'; big.title = 'Enlarge'; big.textContent = 'Enlarge'; el.appendChild(big);
    big.onclick = () => { let m = document.getElementById('vizModal'); if (!m) { m = document.createElement('div'); m.id = 'vizModal'; m.innerHTML = '<div class="vm"><button class="x" aria-label="Close">×</button><h3></h3><div class="vmb"></div></div>'; document.body.appendChild(m); m.onclick = e => { if (e.target === m) m.classList.remove('open'); }; m.querySelector('.x').onclick = () => m.classList.remove('open'); } m.querySelector('h3').textContent = (NODE[id] && NODE[id].title) || ''; const b = m.querySelector('.vmb'); b.innerHTML = ''; m.classList.add('open'); renderViz(b, spec, { height: Math.min(innerHeight * .62, 560) }); };
  });
}
