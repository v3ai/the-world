'use strict';
/* =====================================================================
   The interface of the second look (docs/DESIGN.md section 2), a prototype, on with ?look=2 (off by default).
   The picture's foundation is js/look.js (part of the engine); this file holds only what the interface needs and is loaded
   last, because it wraps functions of the interface (the ruler, the panel, the figures) once they exist:
     ui      css/look.css, figures on a plate, the ruler's tiers, the lead paragraph of a card    (?look=2&lookoff=ui)
     labels  light or dark label text to suit the scene                                          (?look=2&lookoff=labels, live)
   ?look=2&theme=dark gives the dark tokens of the interface.
   ===================================================================== */
(() => {
  const L = LOOK; if (!L.on) return;
  const P = L.part, root = document.documentElement, _c = new THREE.Color(), _hsl = { h: 0, s: 0, l: 0 };
  if (P('ui')) { root.classList.add('look2'); if (L.dark) root.classList.add('look2-dark'); }

  /* ---------- labels: paper on a dark scene, ink on a light one ---------- */
  const lumOf = hex => { _c.set(hex); return .2126 * _c.r + .7152 * _c.g + .0722 * _c.b; };
  function sceneIsLight() {
    if (typeof cam === 'undefined' || !cam.A || typeof chainOf !== 'function') return false;
    const f = cam.A, ch = chainOf(f), s = L.sun();
    if (typeof FR !== 'undefined' && FR.park && ch.includes(FR.park) && cam.D < 300 && (f === FR.park || f === FR.body || f.type === 'thing')) return !!s && s.day > .5;
    const bg = f.scene && f.scene.background && f.scene.background.isColor ? f.scene.background.getHex() : f.env && f.env.opaque && f.env.bg !== undefined ? f.env.bg : null;
    return bg !== null && lumOf(bg) > .55;
  }

  /* ---------- the ruler's tiers, the lead paragraph, figures on a plate ---------- */
  function rulerTiers() {
    if (typeof LANDMARKS === 'undefined') return; const leads = document.querySelectorAll('#ruler svg .lead'), els = [...document.querySelectorAll('#rulerScale .lm')];
    els.forEach((el, i) => { const Lm = LANDMARKS.find(l => l._el === el), side = !!(Lm && Lm.side), near = el.classList.contains('near'); el.classList.toggle('lk-side', side && !near);
      if (leads[i]) { leads[i].classList.toggle('lk-side', side && !near); leads[i].classList.toggle('lk-near', near); } });
  }
  function cardLead() {   // the first paragraph of a card, where it is one bold sentence, is set as a lead: larger, not bolder
    const p = document.querySelector('#info .lay .body > p:first-child'); if (!p || p.classList.contains('lk-lead')) return;
    if (p.childNodes.length === 1 && p.firstChild.nodeName === 'B') p.classList.add('lk-lead');
  }
  /* Figures (js/viz.js) are drawn for a dark screen. Until the renderer has themes of its own (rollout step 13), the colours it asks for are
     translated on their way to the canvas: each named ink to its counterpart for a light plate, light text to ink, dark backings to paper.
     Only canvases made while a figure is being built are touched. */
  const FIG = { '#6ee7ff': '#1e4e8f', '#ffd166': '#96690a', '#ff8fb1': '#b4412f', '#9be37b': '#3f7a3a', '#b388ff': '#6b4a9c', '#ffa94d': '#a8561a', '#ff6b6b': '#b4412f', '#5b9cff': '#1f7a78',
    '#e8ecf5': '#16191d', '#c5cde0': '#3b424a', '#98a2b8': '#5d6670', '#5d6780': '#5d6670', '#fff': '#16191d', '#ffffff': '#16191d', '#26304a': '#dfe3e2', '#1a1300': '#ffffff' };
  const FIG_DARK = { '#6ee7ff': '#8db8f2', '#ffd166': '#e2b659', '#ff8fb1': '#f0907c', '#9be37b': '#93c98a', '#b388ff': '#b9a0e6', '#ffa94d': '#eaa56b', '#ff6b6b': '#f0907c', '#5b9cff': '#74cfc9' };
  const figMemo = new Map();
  function figColor(v) {
    if (typeof v !== 'string') return v; let r = figMemo.get(v); if (r !== undefined) return r; if (figMemo.size > 1500) figMemo.clear(); const s = v.trim().toLowerCase(); r = v;
    if (L.dark) r = FIG_DARK[s] || v;
    else if (FIG[s]) r = FIG[s];
    else { const m = s.match(   // only washes and backings (colours with an alpha) are translated here; a plain rgb() is a value on a colour scale and is data
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
      if (m && m[4] !== undefined) { const R = +m[1], G = +m[2], B = +m[3], a = +m[4], lum = (.2126 * R + .7152 * G + .0722 * B) / 255;
        if (lum > .8) r = `rgba(22,25,29,${Math.min(1, a * 1.7).toFixed(3)})`;                       // white lines and washes become ink
        else if (lum < .12) r = `rgba(250,251,250,${Math.min(1, a).toFixed(3)})`;                    // dark backings become the plate
        else if (R > 240 && G > 190 && B < 130) r = `rgba(150,105,10,${a})`; }                       // the gold of a live value
      else if (/^#[0-9a-f]{6}$/.test(s)) { _c.set(s).getHSL(_hsl); if (_hsl.l > .62) r = '#' + new THREE.Color().setHSL(_hsl.h, Math.min(1, _hsl.s * .9), .34).getHexString(); } }   // any other pale ink is deepened to read on the plate
    figMemo.set(v, r); return r;
  }
  const figFont = f => typeof f === 'string' ? f.replace(/"Space Grotesk"(,\s*monospace)?|Inter(,\s*sans-serif)?/g, "-apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Segoe UI', sans-serif") : f;
  let figNow = false;
  function figDress(ctx) {
    const proto = CanvasRenderingContext2D.prototype;
    ['fillStyle', 'strokeStyle'].forEach(k => { const d = Object.getOwnPropertyDescriptor(proto, k); Object.defineProperty(ctx, k, { get() { return d.get.call(this); }, set(v) { d.set.call(this, figColor(v)); }, configurable: true }); });
    const fd = Object.getOwnPropertyDescriptor(proto, 'font'); Object.defineProperty(ctx, 'font', { get() { return fd.get.call(this); }, set(v) { fd.set.call(this, figFont(v)); }, configurable: true });
  }
  function wire() {
    if (!P('ui')) return;
    if (typeof buildRuler === 'function') { const f = buildRuler; window.buildRuler = function () { const r = f.apply(this, arguments); rulerTiers(); return r; }; if (f._ro) window.buildRuler._ro = f._ro; rulerTiers(); }
    if (typeof openPanel === 'function') { const f = openPanel; window.openPanel = function () { const r = f.apply(this, arguments); try { cardLead(); } catch (e) { } return r; }; }
    if (typeof renderViz === 'function') {
      const gc = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type) { const ctx = gc.apply(this, arguments); if (figNow && type === '2d' && ctx && !ctx._lk) { ctx._lk = true; figDress(ctx); } return ctx; };
      const f = renderViz; window.renderViz = function () { figNow = true; try { return f.apply(this, arguments); } finally { figNow = false; } };
      if (window.VIZX) window.VIZX.renderViz = window.renderViz;
    }
  }
  let wired = false, lastNear = null;
  function tick() {
    if (!wired && typeof LANDMARKS !== 'undefined' && typeof cam !== 'undefined' && cam.A) { wired = true; try { wire(); } catch (e) { console.warn('look: wire', e && e.message); } }
    try {
      document.body.classList.toggle('lk-day', P('labels') && P('ui') && sceneIsLight());
      if (P('ui') && wired) { const n = document.querySelector('#rulerScale .lm.near'); if (n !== lastNear) { lastNear = n; rulerTiers(); } }
    } catch (e) { /* the interface prototype must never stop the app */ }
  }
  L.uiTimer = setInterval(tick, 300);
})();
