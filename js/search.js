'use strict';
/* =====================================================================
   SEARCH: find anything by its everyday name and go to its model.
   Part 1 (SearchCore) is plain JavaScript with no browser dependencies, so it runs in node for the unit tests and the coverage
   report (tools/search/). Part 2 is the interface: a field that is always on screen, results as you type, and the flights.
   Data: data/search/index.json (every thing that can be found) and data/search/aliases.json (everyday words to ids, with the
   source of each equivalence), both made by tools/search/build.mjs. Nothing is sent anywhere.
   ===================================================================== */
(function (root) {
  const SC = {};

  /* ---------- text: normalise, stem, tokenise ---------- */
  const SUPSUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '₊': '+', '₋': '-' };
  const GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'μ': 'mu', 'ν': 'nu', 'τ': 'tau', 'π': 'pi', 'σ': 'sigma', 'λ': 'lambda', 'ω': 'omega', 'Δ': 'delta', 'Ω': 'omega' };
  /* keep case, turn subscripts to digits, drop accents: for reading formulas */
  function plain(s) {
    return String(s == null ? '' : s).replace(/[₀-₉⁰¹²³⁴-⁹₊₋⁺⁻]/g, c => SUPSUB[c] || c).replace(/[αβγδεμντπσλωΔΩ]/g, c => GREEK[c] || c).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'");
  }
  function norm(s) { return plain(s).toLowerCase().replace(/'/g, '').replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, ' ').trim(); }
  const FILLER = new Set(('a an the of is are was were be been am do does did what whats which who whom whose how why where when whenever can could would should will shall may might must ' +
    'to for in on at by with from into onto about as it its this that these those there here and or but if then than so just please ' +
    'my your our their his her me i you we us they them mine tell show find see look looks looking take bring get give want need like called named name ' +
    'work works worked working made make makes making consists consist exactly really actually kind sort type tiny big small ' +
    'something anything thing stuff one some any').split(' '));
  FILLER.delete('big'); FILLER.delete('small'); FILLER.delete('tiny'); FILLER.delete('kind'); FILLER.delete('type'); FILLER.delete('sort'); FILLER.delete('name'); FILLER.delete('one');
  function stem(w) {
    const n = w.length; if (n < 4) return w;
    if (w.endsWith('ies') && n > 4) return w.slice(0, -3) + 'y';
    if (/(ss|us|is)$/.test(w)) return w;
    if (/(sses|ches|shes|xes|zes)$/.test(w)) return w.slice(0, -2);
    if (w.endsWith('s')) return w.slice(0, -1);
    return w;
  }
  function allTokens(s) { const n = norm(s); return n ? n.split(' ') : []; }
  /* the words that carry meaning, stemmed; if a phrase is all filler ("what is it") keep everything */
  function contentTokens(s) { const t = allTokens(s); const c = t.filter(w => !FILLER.has(w)); return (c.length ? c : t).map(stem); }
  SC.norm = norm; SC.stem = stem; SC.contentTokens = contentTokens; SC.FILLER = FILLER;

  /* ---------- chemical formulas and symbols ---------- */
  const EL = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  const ELSET = new Set(EL), ELLOW = new Map(EL.map(s => [s.toLowerCase(), s]));
  function sigOf(counts) { return Object.keys(counts).sort().map(k => k + (counts[k] > 1 ? counts[k] : '')).join(''); }
  /* case-sensitive formula, with brackets: "Ca(OH)2", "C6H12O6", "NaCl". Returns a signature (symbols sorted, so NH3 equals H3N) or null. */
  function formulaSig(f) {
    f = plain(f).replace(/\s+/g, '').replace(/[+-]\d*$/, '').replace(/[·.•]/g, ''); if (!f || !/^[A-Za-z0-9()]+$/.test(f)) return null;
    let i = 0; const stack = [{}];
    const num = () => { let j = i; while (i < f.length && /\d/.test(f[i])) i++; return i > j ? +f.slice(j, i) : 1; };
    while (i < f.length) {
      const ch = f[i];
      if (ch === '(') { stack.push({}); i++; }
      else if (ch === ')') { i++; const k = num(), top = stack.pop(); if (!stack.length) return null; const p = stack[stack.length - 1]; for (const s in top) p[s] = (p[s] || 0) + top[s] * k; }
      else if (/[A-Z]/.test(ch)) { let s = ch; if (i + 1 < f.length && /[a-z]/.test(f[i + 1]) && ELSET.has(ch + f[i + 1])) { s = ch + f[i + 1]; i++; } i++; if (!ELSET.has(s)) return null; const k = num(), p = stack[stack.length - 1]; p[s] = (p[s] || 0) + k; }
      else return null;
    }
    if (stack.length !== 1) return null; const c = stack[0]; return Object.keys(c).length ? sigOf(c) : null;
  }
  /* all-lower-case "nacl", "co2": every way to read it as element symbols (a few at most) */
  function formulaSigsLower(t) {
    if (!/^[a-z0-9]+$/.test(t) || t.length > 14) return [];
    const out = new Set(); let guard = 0;
    (function rec(i, counts, any) {
      if (guard++ > 400) return;
      if (i === t.length) { if (any) out.add(sigOf(counts)); return; }
      for (const L of [1, 2]) {
        const s = ELLOW.get(t.slice(i, i + L)); if (!s || (L === 2 && t.length < i + 2)) continue;
        let j = i + L; while (j < t.length && /\d/.test(t[j])) j++;
        const k = j > i + L ? +t.slice(i + L, j) : 1, c = Object.assign({}, counts); c[s] = (c[s] || 0) + k; rec(j, c, true);
      }
    })(0, {}, false);
    return [...out];
  }
  SC.formulaSig = formulaSig;

  /* ---------- edit distance (Damerau, bounded) ---------- */
  function editDist(a, b, max) {
    const n = a.length, m = b.length; if (Math.abs(n - m) > max) return max + 1;
    let p2 = null, p1 = Array.from({ length: m + 1 }, (_, j) => j);
    for (let i = 1; i <= n; i++) {
      const cur = [i]; let rowMin = i;
      for (let j = 1; j <= m; j++) {
        let v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        cur[j] = v; if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1; p2 = p1; p1 = cur;
    }
    return p1[m];
  }

  /* ---------- the index ---------- */
  /* the cards of the parts of a creature in the park carry its name in a result ("European robin: Heart"), and rank below the human part of the same name */
  const PREFIX = { dog: 'Dog', bee: 'Honey bee', oak: 'English oak', rn: 'Meadow buttercup', fa: 'Fly agaric', robin: 'European robin', pond: 'Pond', grass: 'Ryegrass', soil: 'Soil' }, PREFIX_RE = /^(dog|bee|oak|rn|fa|robin|pond|grass|soil)_/;
  function displayTitle(e) {
    if (e.dn) return e.dn;
    if (e.c === 'node') { const m = PREFIX_RE.exec(e.id.slice(5)); if (m && !/^(dog|bee|oak|buttercup|fly agaric|robin|pond|grass|ryegrass|soil)/i.test(e.t) && !/(robin|pond|grass|soil)/i.test(e.t)) return PREFIX[m[1]] + ': ' + e.t; }
    if (e.c === 'el') return `${e.t} (${e.sy})`;
    return e.t;
  }
  function parensOf(t) { return [...String(t).matchAll(/\(([^)]*)\)/g)].map(m => m[1]); }
  SC.build = function (data) {
    const E = data.entities, idx = { E, byId: new Map(), keys: [], post: new Map(), exact: new Map(), sig: new Map(), sym: new Map(), vocab: [], vocabSet: new Set(), byLen: new Map(), byLenFirst: new Map(), aliasOf: [], weak: null, hints: new Map() };
    E.forEach((e, i) => idx.byId.set(e.id, i));
    const addKey = (ei, text, w, kind, extra) => {
      const toks = contentTokens(text); if (!toks.length) return;
      const k = Object.assign({ e: ei, t: toks, p: toks.join(' '), w, kind, b: 0 }, extra || {}); const ki = idx.keys.length; idx.keys.push(k);
      let a = idx.exact.get(k.p); if (!a) idx.exact.set(k.p, a = []); a.push(ki);
      new Set(toks).forEach(t => { let l = idx.post.get(t); if (!l) idx.post.set(t, l = []); l.push(ki); });
    };
    E.forEach((e, ei) => {
      const t = e.t, parts = new Set();
      addKey(ei, t, 1, 'title');
      const bare = t.replace(/\s*\([^)]*\)/g, '').trim(); if (bare && bare !== t) addKey(ei, bare, .95, 'title');
      parensOf(t).forEach(p => { if (p.length > 1) addKey(ei, p, .9, 'alt'); });
      if (e.c === 'node' || e.c === 'kn') {
        const head = bare.split(':')[0].trim(); if (head && head !== bare) addKey(ei, head, .92, 'title');
        head.split(/ and |, | or | vs\.? /i).forEach(p => { p = p.trim(); if (p && p !== head && contentTokens(p).length && !parts.has(p)) { parts.add(p); addKey(ei, p, .72, 'part'); } });
      }
      (e.a || []).forEach(a => addKey(ei, a, .9, 'alt'));
      (e.kw || []).forEach(a => addKey(ei, a, .55, 'kw'));
      if (e.f) { const s = formulaSig(e.f); if (s) { let l = idx.sig.get(s); if (!l) idx.sig.set(s, l = []); l.push(ei); } }
      if (e.sy) idx.sym.set(e.sy, ei);
    });
    (data.aliases || []).forEach((a, ai) => {
      const near = new Set(a.near || []);
      a.t.forEach((tid, ti) => { const ei = idx.byId.get(tid); if (ei === undefined) return; a.q.forEach(ph => addKey(ei, ph, 1, 'alias', { b: Math.max(0, 6 - 1.5 * ti), alias: ai, near: near.has(tid) })); });
    });
    idx.aliases = data.aliases || [];
    idx.sources = data.sources || {};
    idx.vocab = [...idx.post.keys()].sort();
    idx.vocab.forEach(w => { idx.vocabSet.add(w); const kk = w.length + w[0]; const l = idx.byLenFirst.get(kk) || []; l.push(w); idx.byLenFirst.set(kk, l); });
    return idx;
  };

  function lowerBound(arr, x) { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < x) lo = m + 1; else hi = m; } return lo; }
  function prefixWords(idx, p, cap) { const out = []; for (let i = lowerBound(idx.vocab, p); i < idx.vocab.length && idx.vocab[i].startsWith(p) && out.length < cap; i++) out.push(idx.vocab[i]); return out; }
  function fuzzyWords(idx, w) {
    const n = w.length; if (n < 4) return [];
    const max = n >= 9 ? 2 : 1; const out = [];
    for (let L = n - max; L <= n + max; L++) for (const f of w[0] === w[1] ? [w[0]] : [w[0], w[1]]) { // a typo almost never changes the first letter (a swap of the first two can)
      const l = idx.byLenFirst.get(L + f); if (!l) continue; for (const v of l) {
        if (v[0] !== w[0] && !(w[0] === v[1] && w[1] === v[0])) continue;
        if (n === 4 && v[v.length - 1] !== w[n - 1]) continue;
        const d = editDist(w, v, max); if (d <= max) out.push([v, d]);
      } }
    return out.sort((a, b) => a[1] - b[1] || (idx.post.get(b[0]).length - idx.post.get(a[0]).length)).slice(0, 4);
  }

  /* ---------- query ---------- */
  const COMMON_WORDS2 = new Set(['he', 'be', 'no', 'as', 'at', 'in', 'is', 'it', 'on', 'or', 'so', 'to', 'us', 'we', 'am', 'an', 'by', 'do', 'go', 'if', 'me', 'my', 'of', 'up', 'hi', 'ok']);
  const GROUP_RANK = { model: 0, card: 1, lab: 1, trail: 2 };
  function parse(raw) {
    const p = plain(raw).trim(); const rawToks = p.split(/[\s,;:]+/).filter(Boolean);
    const toks = allTokens(raw); let stems = contentTokens(raw);
    if (stems.length > 1) { const nn = stems.filter(w => !/^\d+$/.test(w)); if (nn.length) stems = nn; } // a lone number says nothing ("omega 3")
    return { raw: p, rawToks, toks, stems, phrase: stems.join(' ') };
  }
  /* run a query. Returns {results:[{e, score, why, note, near, band}], hint, partial:[...], q} */
  SC.query = function (idx, raw, opt) {
    opt = opt || {};
    const q = parse(raw), out = { results: [], hint: null, partial: [], weak: [], q };
    if (!q.toks.length) return out;
    const best = new Map(); const consider = (ei, s, ki, why) => { const c = best.get(ei); if (!c || s > c.s) best.set(ei, { s, ki, why }); };
    const n = q.stems.length;
    // 1. the whole phrase equals a name or an everyday word
    const ex = idx.exact.get(q.phrase); if (ex) ex.forEach(ki => { const k = idx.keys[ki]; consider(k.e, 100 * k.w + k.b, ki, 'name'); });
    // 2. element symbols and chemical formulas
    if (q.rawToks.length <= 3) q.rawToks.forEach(t => {
      if (/^[A-Z][a-z]?$/.test(t) && idx.sym.has(t) && q.rawToks.length === 1) consider(idx.sym.get(t), 99, -1, 'symbol');
      else if (/^[a-z]{2}$/.test(t) && q.rawToks.length === 1 && ELLOW.has(t) && !FILLER.has(t) && !COMMON_WORDS2.has(t)) consider(idx.sym.get(ELLOW.get(t)), 70, -1, 'symbol');
      if (/\d/.test(t) || /[A-Z].*[A-Z]|[a-z][A-Z]/.test(t) || (/^[a-z]{3,}$/.test(t) && !idx.vocabSet.has(stem(t)))) {
        const sigs = new Set(); const cs = formulaSig(t); if (cs) sigs.add(cs); if (!cs || t === t.toLowerCase()) formulaSigsLower(t.toLowerCase()).forEach(s => sigs.add(s));
        sigs.forEach(s => { (idx.sig.get(s) || []).forEach((ei, j) => consider(ei, 98 - j * .01, -2, 'formula')); });
      }
    });
    // 3. the words
    const exp = q.stems.map((w, i) => {
      const L = [];
      if (idx.vocabSet.has(w)) L.push([w, 0, 'word']);
      if (i === n - 1 && w.length >= 3) { const known = idx.vocabSet.has(w); prefixWords(idx, w, 80).forEach(v => { if (v !== w) L.push([v, known ? .55 : .06, 'prefix']); }); } // "suga" completes to sugar; "heart" is not also "heartwood"
      else if (i === n - 1 && w.length === 2 && n > 1) prefixWords(idx, w, 40).forEach(v => { if (v !== w) L.push([v, .2, 'prefix']); });
      if (!L.length) fuzzyWords(idx, w).forEach(([v, d]) => L.push([v, .1 + .08 * d, 'typo']));
      return L;
    });
    const cand = new Map(); // key index -> {mask, pen, kinds}
    exp.forEach((L, i) => L.forEach(([w, pen, how]) => { (idx.post.get(w) || []).forEach(ki => { let c = cand.get(ki); if (!c) cand.set(ki, c = { mask: 0, pen: 0, fuzz: false, pos: [] }); if (!(c.mask & (1 << i))) { c.mask |= 1 << i; c.pen += pen; c.fuzz = c.fuzz || how === 'typo'; } else if (pen < 0) c.pen = c.pen; }); }));
    const partial = new Map();
    cand.forEach((c, ki) => {
      const k = idx.keys[ki]; let m = 0, mk = c.mask; while (mk) { m += mk & 1; mk >>= 1; }
      if (m === n) {
        const exactCov = k.t.length === n, cov = n / k.t.length, clean = c.pen === 0;
        // a name that is exactly the words typed beats one that merely contains them; a word completed from a prefix or a typo scores lower
        let s = (clean ? (exactCov ? 92 : 58 + 24 * cov) : (exactCov ? 74 : 50 + 18 * cov) - c.pen * 45);
        s *= (k.kind === 'alias' && !exactCov ? .72 : 1) * k.w; s += k.b;
        if (!exactCov && k.t[0] === q.stems[0]) s += 6; // the name starts with what was typed
        consider(k.e, s, ki, c.fuzz ? 'typo' : 'words');
      } else if (n >= 2 && m * 2 >= n && m >= 1) {
        const s = 36 * (m / n) * k.w + (k.t.length === m ? 6 : 0) - c.pen * 20; const o = partial.get(k.e); if (!o || s > o.s) partial.set(k.e, { s, ki, why: 'part' });
      }
    });
    // build results
    const list = [];
    best.forEach((b, ei) => {
      const e = idx.E[ei]; let s = b.s;
      const k = b.ki >= 0 ? idx.keys[b.ki] : null, a = k && k.alias !== undefined ? idx.aliases[k.alias] : null;
      if (e.c === 'node' && PREFIX_RE.test(e.id.slice(5)) && !(k && k.kind === 'alias' && k.b >= 6)) s -= 8;   // (not when the everyday word names this very card first: "buttercup" is the buttercup's own card)
      list.push({ e, id: e.id, score: s, why: b.why, key: k ? k.p : '', note: a && a.note || '', near: !!(k && k.near), alias: a, band: s >= 64 ? 0 : 1 });
    });
    // good matches first; among those that are about equally good, things you can fly to before cards before trails; a much weaker match never jumps the queue
    const topS = list.reduce((m, r) => Math.max(m, r.band === 0 ? r.score : 0), 0);
    list.forEach(r => { r.tier = r.band === 0 && r.score >= topS - 12 ? 0 : 1; });
    list.sort((a, b) => a.band - b.band || a.tier - b.tier || (a.band === 0 && a.tier === 0 ? (GROUP_RANK[a.e.g] - GROUP_RANK[b.e.g]) : 0) || b.score - a.score || a.e.t.length - b.e.t.length);
    out.results = list;
    const top = list.find(r => r.alias && r.alias.hint); if (top && list.indexOf(top) < 4) out.hint = top.alias.hint;
    out.partial = [...partial].map(([ei, b]) => ({ e: idx.E[ei], id: idx.E[ei].id, score: b.s, why: 'part' })).filter(r => !best.has(idx.byId.get(r.id))).sort((a, b) => b.score - a.score).slice(0, 8);
    if (list.filter(r => r.band === 0).length < 3 && !(opt.noWeak)) out.weak = SC.weak(idx, q).slice(0, 6);
    return out;
  };
  /* last resort: cards whose one-line summary mentions every word typed (built on first use, never on a keystroke when the answer is strong) */
  SC.weak = function (idx, q) {
    if (!idx.weak) { idx.weak = new Map(); idx.E.forEach((e, ei) => { if (e.c === 'el' || !e.s) return; new Set(allTokens(e.s).filter(w => w.length > 2 && !FILLER.has(w)).map(stem)).forEach(w => { let l = idx.weak.get(w); if (!l) idx.weak.set(w, l = []); l.push(ei); }); }); }
    const ws = q.stems.filter(w => w.length > 2); if (!ws.length) return [];
    let acc = null; for (const w of ws) { const l = idx.weak.get(w) || []; const s = new Set(l); acc = acc ? acc.filter(x => s.has(x)) : l.slice(); if (!acc.length) return []; }
    return acc.slice(0, 20).map(ei => ({ e: idx.E[ei], id: idx.E[ei].id, score: 20, why: 'summary' }));
  };
  SC.displayTitle = displayTitle;
  SC.GROUP_RANK = GROUP_RANK;

  /* node (unit tests, coverage): expose and stop; the browser part follows */
  if (typeof module !== 'undefined' && module.exports) { module.exports = SC; }
  root.SearchCore = SC;
  if (typeof document === 'undefined') return;

  /* =====================================================================
     Part 2: the interface
     ===================================================================== */
  const $s = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const subf = f => esc(String(f || '').replace(/(\d+)/g, m => m.split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')).replace(/([A-Za-z\)])([₀-₉]+)/g, '$1$2'));
  const S = { idx: null, loading: null, sel: -1, rows: [], open: false, q: '', t0: 0, last: null, books: null };
  root.SEARCH = S;

  function load() {
    if (S.loading) return S.loading;
    const get = f => fetch(f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
    S.loading = Promise.all([get('data/search/index.json'), get('data/search/aliases.json')]).then(([ix, al]) => {
      const t = performance.now(); S.idx = SC.build({ entities: ix.e, aliases: al.aliases, sources: al.sources }); S.buildMs = performance.now() - t; return S.idx;
    }).catch(e => { console.error('search data failed to load', e); S.failed = true; });
    return S.loading;
  }

  /* ----- what each kind of result will do, in plain words ----- */
  const KIND_LABEL = { mol: 'Molecule', crystal: 'Crystal', el: 'Element', lm: 'Place', pl: 'Place', node: 'Topic', kn: 'Topic', trail: 'Question trail', lab: 'Interactive lab' };
  function describe(r) {
    const e = r.e, c = e.c;
    if (c === 'mol') return ['Molecule', 'Fly to a 3D model'];
    if (c === 'crystal') return ['Crystal', 'Fly to a 3D model of its atoms'];
    if (c === 'el') return ['Element', 'Fly to its atom, with its card'];
    if (c === 'lm') return ['Place', 'Fly there'];
    if (c === 'pl') return [/^Moon of|planet/i.test(e.s) ? 'Moon' : e.s === 'Planet' || e.s === 'Dwarf planet' ? e.s : 'Place', 'Fly there, with its card'];
    if (c === 'act') return ['Interactive', 'Open the periodic table; choose an element to fly to its atom'];
    if (c === 'trail') return ['Question trail', `A guided journey, ${e.n || 'a few'} stops`];
    if (c === 'lab') return ['Interactive lab', 'Opens the lab: ' + e.s];
    if (c === 'kn') return ['Card', 'No 3D model yet; here is what it is'];
    const m = e.m;
    if (!m) return ['Card', 'No 3D model yet; here is what it is'];
    if (e.fc) return ['Card', 'No 3D model of it yet; here is what it is'];   // its place in the app is only loosely related (tools/search/force_card.txt): the card opens, the camera stays
    if (m === 'place' || (m === 'via' && !e.wh)) return ['Card', 'No 3D model of it yet' + (e.wh ? '; it also flies to ' + e.wh : '')];
    const to = e.wh ? 'Fly to ' + e.wh + ', with its card' : 'Fly to where it happens, with its card';
    return [{ phone: 'Part of your phone', particle: 'Particle', place: 'Topic with a place', molecule: 'Topic with a molecule', crystal: 'Topic with a crystal', atom: 'Element', park: 'In the park', body: 'Body part', via: 'Topic with a place' }[m] || 'Topic',
      { phone: 'Fly to it inside the phone', particle: 'Standard Model view, with it chosen', place: to, molecule: to, crystal: to, via: to, atom: 'Fly to its atom', park: 'Fly to it in the park', body: 'Fly to it in the body, highlighted' }[m] || 'Fly there'];
  }
  SC.describe = describe;

  /* ----- going there ----- */
  const wait = (ok, cb, max) => { let n = 0; const t = setInterval(() => { let done = false; try { done = ok(); } catch (e) { done = true; } if (done || ++n > (max || 1500)) { clearInterval(t); if (done) cb(); } }, 120); };
  const flying = () => typeof fly !== 'undefined' && !!fly;
  const say = m => { try { if (typeof toast === 'function') toast(m); } catch (e) { } };
  function openInfoOf(info, F) {
    const dummy = new THREE.Object3D(); dummy.userData = { id: 'moleculecard', info, noZoom: true };
    showInfoFor({ id: 'moleculecard', obj: dummy, frame: F, pointLocal: cam.T.clone(), noZoom: true });
  }
  function openCardById(ids) {
    for (const id of ids || []) {
      for (const f of (typeof drawn !== 'undefined' ? drawn : [])) { const o = (f.pickables || []).find(p => p.userData && p.userData.id === id); if (o) { showInfoFor({ id, obj: o, frame: f, pointLocal: o.position ? o.position.clone() : cam.T.clone(), noZoom: true }); return true; } }
      if (typeof INFO !== 'undefined' && INFO[id]) { const d = new THREE.Object3D(); d.userData = { id }; showInfoFor({ id, obj: d, frame: cam.A, pointLocal: cam.T.clone(), noZoom: true }); return true; }
    }
    return false;
  }
  function afterFlight(fn) { setTimeout(() => wait(() => !flying(), () => { try { fn(); } catch (e) { console.warn('search: card after flight failed', e && e.message); } }), 60); }
  function planetFlight(e) {
    const name = e.id.slice(3), K = 4.5;
    if (typeof bodyPlaces === 'function') { const bp = bodyPlaces().find(b => b.title === e.t || b.title === name || b.title === 'The ' + name); if (bp) { bp.go(); return true; } }
    if (e.parent) { const pf = FR[e.parent]; if (!pf) return false; pf.ensure(); const o = pf.pickables.find(x => x.userData && x.userData.id === 'moon_' + name); if (!o) return false; flyTo(pf, o.position.clone(), (e.rkm || 1000) * 1000 * K); return true; }
    const f = FR[name]; if (!f) return false; f.ensure(); const o = f.pickables.find(x => x.userData && x.userData.id && x.userData.id.toLowerCase() === name.toLowerCase());
    flyTo(f, new V3(), ((o && typeof objRadiusLocal === 'function' && objRadiusLocal(o) * f.unit) || (e.rkm || 2000) * 1000) * K); return true;
  }
  function go(r) {
    const e = r.e || r, id = e.id, c = e.c; const key = id.slice(id.indexOf(':') + 1);
    if (typeof cancelTour === 'function') cancelTour();
    if (typeof closePops === 'function') closePops();
    say(c === 'node' || c === 'kn' ? '' : '');
    if (c === 'mol') { placeGo('mol:' + key); afterFlight(() => { const F = cam.A; if (F && F.info && F.type === 'mol') openInfoOf(F.info, F); }); }
    else if (c === 'crystal') { placeGo('crystal:' + key); afterFlight(() => { const F = cam.A; if (F && F.info && F.type === 'crystal') openInfoOf(F.info, F); }); }
    else if (c === 'el') { goToNode('at_el_' + key); }
    else if (c === 'node') { if (e.fc && typeof showBodyNode === 'function') showBodyNode(key, null); else goToNode(key); }   // "the genetic code" opened its card and flew to a methionine molecule, the amino acid of the start codon: a card whose place is only loosely related does not move the camera
    else if (c === 'kn') { (typeof loadKnowledge === 'function' ? loadKnowledge() : Promise.resolve()).then(() => showNode(key)); }
    else if (c === 'lm') { const L = LANDMARKS.find(l => l.label === key); if (L) { L.go(); if (e.card) afterFlight(() => openCardById(e.card)); } }
    else if (c === 'pl') { if (planetFlight(e)) afterFlight(() => openCardById(e.card)); }
    else if (c === 'act') { goToNode('at_el_H'); afterFlight(() => { if (typeof ATM !== 'undefined' && ATM.openPicker) ATM.openPicker(); }); }
    else if (c === 'trail') { TRAILS.load().then(() => TRAILS.start(key, 0)); }
    else if (c === 'lab') { const [lab, preset] = key.split('/'); openLab(lab, preset, 'Search'); }
  }
  SC.go = go;

  /* ----- results panel ----- */
  const GROUP_TITLE = { model: 'Models and places to fly to', card: 'Cards to read', lab: 'Cards to read', trail: 'Question trails', book: 'Textbook sections' };
  const CAP = { model: 7, card: 4, lab: 4, trail: 2 };
  function groupRows(res) {
    const good = res.results.filter(r => r.band === 0), weak = res.results.filter(r => r.band === 1);
    const take = (list, caps) => { const cnt = {}, o = []; list.forEach(r => { const g = r.e.g; cnt[g] = (cnt[g] || 0) + 1; if (cnt[g] <= (caps[g] || 3)) o.push(r); }); return o; };
    return take(good, CAP).concat(good.length >= 4 ? [] : take(weak, { model: 3, card: 3, lab: 2, trail: 2 }).slice(0, 4)); // loose matches only when there are few good ones
  }
  function row(r, i) {
    const [kind, act] = describe(r);
    const near = r.near ? `<span class="near">Nearest model we have</span> ` : '';
    const sub = r.note ? `<span class="why">${esc(r.note)}</span>` : (r.e.s && r.e.g === 'card' ? `<span class="why">${esc(r.e.s)}</span>` : '');
    const t = SC.displayTitle(r.e);
    return `<li role="option" id="srchO${i}" class="srow g-${r.e.g}" data-i="${i}"><div class="st">${near}<b>${esc(t)}</b>${r.e.f && (r.e.c === 'mol' || r.e.c === 'crystal') ? `<span class="fm">${subf(r.e.f)}</span>` : ''}</div><div class="sk">${esc(kind)}<i></i>${esc(act)}</div>${sub}</li>`;
  }
  const STARTERS = ['sugar', 'a battery', 'my heart', 'table salt', 'why is the sky blue', 'vitamin C', 'wifi', 'H2O', 'rust', 'the sun'];
  function render() {
    const panel = $s('#srchPanel'), inp = $s('#srchQ'); if (!panel) return;
    const raw = inp.value.trim(); S.q = raw; S.rows = []; S.sel = -1;
    inp.setAttribute('aria-expanded', S.open ? 'true' : 'false');
    if (!S.open) { panel.classList.remove('open'); return; }
    panel.classList.add('open');
    if (!S.idx) { panel.innerHTML = `<div class="smsg">${S.failed ? 'Search could not load its index.' : 'Loading the index…'}</div>`; return; }
    if (!raw) { panel.innerHTML = `<div class="smsg">Type what you are curious about: a material, a body part, a device, a planet, a formula. Try:</div><div class="schips">${STARTERS.map(t => `<button type="button" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>${recentHtml()}`; return; }
    if (raw.length < 2 && !/^[A-Z]$/.test(raw)) { panel.innerHTML = '<div class="smsg">Keep typing…</div>'; return; }
    const t0 = performance.now(); const res = SC.query(S.idx, raw); S.lastMs = performance.now() - t0; S.res = res;
    const rows = groupRows(res); S.rows = rows;
    let h = '';
    if (rows.length) {
      if (res.hint) h += `<div class="shint">${esc(res.hint)}</div>`;
      let cur = null, i = 0; let ul = '';
      const shown = new Set(); if (res.hint) shown.add(res.hint);
      rows.forEach((r, idx) => { if (r.note) { if (shown.has(r.note)) r.note = ''; else shown.add(r.note); } const g = r.band === 1 ? 'weak' : (r.e.g === 'lab' ? 'card' : r.e.g); if (g !== cur) { if (ul) ul += '</ul>'; cur = g; ul += `<div class="sgh">${g === 'weak' ? 'Related' : GROUP_TITLE[g]}</div><ul role="presentation">`; } ul += row(r, idx); });
      h += ul + '</ul>';
    }
    if (res.weak.length && rows.filter(r => r.band === 0).length < 3) {
      S.weakRows = res.weak; const base = rows.length;
      h += `<div class="sgh">Mentioned in these cards</div><ul role="presentation">${res.weak.map((r, k) => { S.rows.push(r); return row(Object.assign({ near: false, note: '' }, r), base + k); }).join('')}</ul>`;
    }
    if (!rows.length && !res.weak.length) {
      const sug = res.partial.slice(0, 5); S.rows = sug.map(r => r);
      h += `<div class="smsg"><b>Nothing in the explorer matches “${esc(raw)}”.</b> ${sug.length ? 'The closest things it does have:' : 'Search knows names of materials, body parts, devices, places, elements, molecules and topics. Try one of these:'}</div>`;
      if (sug.length) h += `<ul role="presentation">${sug.map((r, k) => row(r, k)).join('')}</ul>`; else h += `<div class="schips">${STARTERS.slice(0, 6).map(t => `<button type="button" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
      S.noResult = raw;
    } else S.noResult = null;
    if (!S.books) { loadBooks(); } else { const b = bookRows(raw); if (b) h += b; }
    panel.innerHTML = h;
    wireRows();
  }
  function recentHtml() { const r = store.get('searchRecent', []); return r.length ? `<div class="sgh">Recent</div><div class="schips">${r.slice(0, 5).map(t => `<button type="button" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''; }
  function wireRows() {
    const panel = $s('#srchPanel');
    panel.querySelectorAll('.srow').forEach(li => { li.onmousedown = ev => ev.preventDefault(); li.onclick = () => choose(+li.dataset.i); li.onmousemove = () => hilite(+li.dataset.i, true); });
    panel.querySelectorAll('.schips button').forEach(b => { b.onmousedown = ev => ev.preventDefault(); b.onclick = () => { const i = $s('#srchQ'); i.value = b.dataset.q; i.focus(); render(); }; });
    panel.querySelectorAll('a.sbook').forEach(a => a.onmousedown = ev => ev.stopPropagation());
  }
  function hilite(i, noScroll) {
    const rows = [...document.querySelectorAll('#srchPanel .srow')]; if (!rows.length) return;
    S.sel = Math.max(-1, Math.min(rows.length - 1, i)); rows.forEach((r, k) => r.classList.toggle('on', k === S.sel));
    const inp = $s('#srchQ'); if (S.sel >= 0) { inp.setAttribute('aria-activedescendant', rows[S.sel].id); if (!noScroll) rows[S.sel].scrollIntoView({ block: 'nearest' }); } else inp.removeAttribute('aria-activedescendant');
  }
  function choose(i) {
    const r = S.rows[i]; if (!r) return;
    const raw = S.q; const rec = store.get('searchRecent', []).filter(x => x !== raw); rec.unshift(raw); store.set('searchRecent', rec.slice(0, 8));
    closePanel(true); go(r);
    try { const c = document.getElementById('c'); if (c) c.focus(); } catch (e) { }
  }
  S.choose = choose;
  function openPanel() { S.open = true; load().then(() => { if (S.open) render(); }); loadBooks(); render(); document.body.classList.add('srchOpen'); }
  function closePanel(keepText) { if (S.noResult) logMiss(S.noResult); S.open = false; document.body.classList.remove('srchOpen', 'srchFull'); render(); if (!keepText) { /* leave the text so the visitor can see what they asked */ } const b = $s('#srchQ'); if (b) b.blur(); }

  /* ----- queries that found nothing: kept in this browser only, so the owner can see what people ask for ----- */
  function logMiss(q) {
    q = String(q || '').trim().slice(0, 80); if (q.length < 3) return;
    const L = store.get('searchMisses', []); const ex = L.find(m => m.q === q.toLowerCase());
    if (ex) { ex.n++; ex.t = Date.now(); } else L.push({ q: q.toLowerCase(), n: 1, t: Date.now() });
    store.set('searchMisses', L.slice(-200));
  }
  S.misses = () => { const L = store.get('searchMisses', []).slice().sort((a, b) => b.n - a.n || b.t - a.t); console.table(L.map(m => ({ query: m.q, times: m.n, last: new Date(m.t).toISOString() }))); return L; };
  S.clearMisses = () => store.set('searchMisses', []);

  /* ----- textbook sections (OpenStax titles, loaded with the library on first focus) ----- */
  function loadBooks() {
    if (S.books || S.booksLoading) return; S.booksLoading = true;
    (typeof loadKnowledge === 'function' ? loadKnowledge() : Promise.resolve()).then(() => {
      if (typeof BOOKS === 'undefined' || !BOOKS) return; const secs = [], post = new Map();
      BOOKS.forEach((b, bi) => b.ch.forEach(c => c[2].forEach(s => { if (!s[0] || !s[1]) return; const si = secs.length; secs.push({ b, n: s[0], t: s[1], u: s[2] }); new Set(contentTokens(s[1])).forEach(w => { let l = post.get(w); if (!l) post.set(w, l = []); l.push(si); }); })));
      S.books = { secs, post }; if (S.open && S.q) render();
    }).catch(() => { S.books = { secs: [], post: new Map() }; });
  }
  function bookRows(raw) {
    const q = parse(raw); const ws = q.stems.filter(w => w.length > 2); if (!ws.length || !S.books) return '';
    let acc = null; for (const w of ws) { const l = S.books.post.get(w) || []; acc = acc ? acc.filter(x => l.includes(x)) : l.slice(); if (!acc.length) return ''; }
    const seen = new Set(), out = [];
    for (const i of acc) { const s = S.books.secs[i]; const k = s.t.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(s); if (out.length >= 3) break; }
    if (!out.length) return '';
    return `<div class="sgh">Textbook sections</div><ul role="presentation">${out.map(s => `<li class="sbook"><a class="sbook" target="_blank" rel="noopener" href="${esc((s.b.base || 'https://openstax.org/books/' + s.b.s + '/pages/') + s.u)}"><b>${esc(s.t)}</b><div class="sk">Textbook section<i></i>${esc(s.b.t)} ${esc(s.n)}: opens openstax.org in a new tab</div></a></li>`).join('')}</ul>`;
  }

  /* ----- the field itself ----- */
  function build() {
    if ($s('#srch')) return;
    const box = document.createElement('div'); box.id = 'srch';
    box.innerHTML = `<button id="srchBtn" type="button" aria-label="Search the explorer">Search</button>
      <form id="srchForm" role="search" autocomplete="off"><label for="srchQ" class="sr-only">Search the explorer</label><input id="srchQ" type="text" role="combobox" aria-expanded="false" aria-controls="srchPanel" aria-autocomplete="list" placeholder="Search: sugar, a battery, my heart…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><span class="kbd" aria-hidden="true">/</span><button id="srchX" type="button" aria-label="Close search">Close</button></form>
      <div id="srchPanel" role="listbox" aria-label="Search results" tabindex="-1"></div>`;
    document.body.appendChild(box); document.body.classList.add('hasSearch');
    const inp = $s('#srchQ'), form = $s('#srchForm');
    form.onsubmit = ev => { ev.preventDefault(); if (S.sel < 0 && S.rows.length) S.sel = 0; if (S.rows.length) choose(Math.max(0, S.sel)); else { if (S.q) logMiss(S.q); } };
    let tmr = 0; inp.addEventListener('input', () => { S.open = true; document.body.classList.add('srchOpen'); clearTimeout(tmr); render(); });
    inp.addEventListener('focus', () => { if (!S.open) openPanel(); });
    inp.addEventListener('click', () => { if (!S.open) openPanel(); });
    inp.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (!S.open) openPanel(); hilite(S.sel + 1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); hilite(S.sel <= 0 ? -1 : S.sel - 1); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); if (S.q && S.open && !S.escOnce) { S.escOnce = true; } closePanel(); inp.blur(); }
      else if (ev.key === 'Enter') { S.escOnce = false; }
    });
    inp.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== inp && !$s('#srch').contains(document.activeElement)) { if (S.open) closePanel(true); } }, 120));
    $s('#srchBtn').onclick = () => { document.body.classList.add('srchFull'); inp.focus(); openPanel(); };
    $s('#srchX').onclick = () => { inp.value = ''; closePanel(); };
    document.addEventListener('pointerdown', ev => { if (S.open && !ev.target.closest('#srch')) closePanel(true); }, true);
    // "/" and Ctrl/Cmd+K focus the field from anywhere. 
    S.focus = () => { document.body.classList.add('srchFull'); inp.focus(); inp.select(); openPanel(); };
    addEventListener('keydown', ev => {
      const t = ev.target, typing = t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) || (t && t.isContentEditable);
      const isK = (ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === 'k' || ev.key === 'K');
      if (isK || (ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey)) {
        ev.preventDefault(); ev.stopImmediatePropagation(); document.body.classList.add('srchFull'); inp.focus(); inp.select(); openPanel();
      }
    }, true);
    // keep the layout honest: the card (#info) must start below the field on desktop
    const tr = $s('#topright'); if (tr && typeof ResizeObserver === 'function') { const set = () => { const w = tr.getBoundingClientRect().width; document.documentElement.style.setProperty('--srch-w', Math.round(w) + 'px'); }; new ResizeObserver(set).observe(tr); set(); }
    load(); // fetch and index in the background; a visitor who types at once only waits for this
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})(typeof window !== 'undefined' ? window : globalThis);
