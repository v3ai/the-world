'use strict';
/* =====================================================================
   The interface of the second look (docs/DESIGN.md section 2), a prototype, on with ?look=2 (off by default).
   The picture's foundation is js/look.js (part of the engine); this file holds only what the interface needs and is loaded
   last, because it wraps functions of the interface (the ruler, the panel, the figures) once they exist:
     ui      css/look.css, the ruler's tiers, the lead paragraph of a card    (?look=2&lookoff=ui)
     labels  light or dark label text to suit the scene                                          (?look=2&lookoff=labels, live)
   ?look=2&theme=dark gives the dark tokens of the interface.
   ===================================================================== */
(() => {
  const L = LOOK; if (!L.on) return;
  const P = L.part, root = document.documentElement, _c = new THREE.Color(), _hsl = { h: 0, s: 0, l: 0 };
  /* the interface follows the reader's system setting (docs/DESIGN.md 2.2); ?theme=dark and ?theme=light decide it for a test. The chrome never changes with the scene. */
  const forced = new URLSearchParams(location.search).get('theme'), mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const wantDark = () => forced === 'dark' || (forced !== 'light' && !!(mq && mq.matches));
  if (P('ui')) {
    root.classList.add('look2'); root.classList.toggle('look2-dark', wantDark());
    if (mq && !forced) (mq.addEventListener ? mq.addEventListener('change', () => root.classList.toggle('look2-dark', wantDark())) : mq.addListener && mq.addListener(() => root.classList.toggle('look2-dark', wantDark())));
  }

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
  /* Figures: js/viz.js has its own themes (plate, dark plate, and the old dark screen) and reads the page's look when a figure is built; the bridge that translated colours on the way to the canvas is gone (rollout step 13). */
  function wire() {
    if (!P('ui')) return;
    if (typeof buildRuler === 'function') { const f = buildRuler; window.buildRuler = function () { const r = f.apply(this, arguments); rulerTiers(); return r; }; if (f._ro) window.buildRuler._ro = f._ro; rulerTiers(); }
    if (typeof openPanel === 'function') { const f = openPanel; window.openPanel = function () { const r = f.apply(this, arguments); try { cardLead(); } catch (e) { } return r; }; }
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
