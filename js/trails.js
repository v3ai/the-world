'use strict';
/* =====================================================================
   TRAILS: question-led journeys across the scales, played from data/trails/*.json.
   A trail is a question, five to nine stops (a real place in the simulation, a few plain sentences, one thing to
   notice), an answer in one sentence, and where to go next. The player knows nothing about any one trail.

   Stop schema (data/trails/README in tools/trails/SCHEMA.md):
     where: ONE of
       {landmark: "Your heart"}                      the ruler landmark with that label
       {node: "sm_top"}                              goToNode(id)
       {place: "mol:chlorophyll_a"}                  placeGo(key): place:park, place:leaf, mol:<id>, crystal:<id> ...
       {view: {frame, point:[x,y,z], D, dir?}}       flyTo(FR[frame], point, D); frame is an FR key or a thing id
       {deep: {in, type, id, at, D}}                 a tissue, micro or crystal scene built inside frame `in` (thDeepFrame)
       {sm: {focus?}}                                the Standard Model view
       {scene: "sun_plasma"}                         named scene launcher
     do: [ actions run when the camera has arrived ]
       {card: id} {mode: id, thing: id} {bodyMode: "auto"|...} {element: "C"} {sm: {mode, ...}} {time: iso, speed}
       {dir: [x,y,z]} {press: "button text"} {hide: [body part ids]} {hideBody: true} {reveal: id} {wait: ms}
     expect: {frame: "regex on the frame names of the camera chain", thing: "oak"} used by the validator and the tests
     deeper: [{label, node}]                         "go deeper" links that open cards
   ===================================================================== */
const TRAILS = {
  list: [], by: {}, ready: null, cur: null, i: 0, token: 0, arrived: false, away: false, startedAt: 0,
  cardIndex: {}, instant: false, errors: []
};

(function () {
  const T = TRAILS;
  const $q = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const V = a => new V3(...(a || [0, 0, 0]));
  const frameOfKey = k => FR[k] || FR['thing_' + k] || null;
  const para = t => (Array.isArray(t) ? t : [t]).filter(Boolean);

  /* ---------- load ---------- */
  T.load = function () {
    if (T.ready) return T.ready;
    return T.ready = getJSON('data/trails/manifest.json').then(m => Promise.all((m.files || m).map(f => getJSON('data/trails/' + f).catch(e => { T.errors.push(f + ': ' + e.message); return null; }))))
      .then(all => {
        T.list = all.filter(Boolean).flatMap(x => x.trails || [x]).filter(t => t && t.id && t.stops && t.stops.length);
        T.list.forEach(t => T.by[t.id] = t);
        T.list.sort((a, b) => (a.order || 99) - (b.order || 99));
        buildCardIndex(); buildList(); buildStarters();
      }).catch(e => { T.errors.push(String(e && e.message || e)); console.warn('trails: could not load', e && e.message); });
  };

  /* ---------- card index: which cards are stops of which trail ---------- */
  function buildCardIndex() {
    const add = (id, t, i) => { if (!id) return; (T.cardIndex[id] = T.cardIndex[id] || []).some(x => x.t === t.id) || T.cardIndex[id].push({ t: t.id, i }); };
    T.list.forEach(t => t.stops.forEach((s, i) => {
      if (s.where && s.where.node) add(s.where.node, t, i);
      (s.do || []).forEach(a => { if (a.card) add(a.card, t, i); });
      (s.asked || []).forEach(id => add(id, t, i));
      (s.deeper || []).forEach(d => add(d.node, t, i));
    }));
  }
  const _openPanel = openPanel;
  openPanel = function (h, desc) {
    const r = _openPanel(h, desc);
    try { addAsked(desc && desc.key); } catch (e) { /* never break a card */ }
    return r;
  };
  function addAsked(key) {
    if (!key) return;
    const id = key.replace(/^(node|info|kn):/, ''), hits = (T.cardIndex[id] || []).filter(x => !(T.cur && T.cur.id === x.t));
    if (!hits.length) return;
    const el = $q('#info'); if (!el) return;
    const d = document.createElement('div'); d.className = 'asked';
    d.innerHTML = 'Asked here: ' + hits.slice(0, 2).map(x => `<button data-t="${x.t}" data-i="${x.i}">${esc(T.by[x.t].question)}</button>`).join(' · ');
    d.querySelectorAll('button').forEach(b => b.onclick = () => T.start(b.dataset.t, +b.dataset.i));
    const body = el.querySelector('h2'); if (body && body.nextSibling) body.parentNode.insertBefore(d, body.nextSibling); else el.appendChild(d);
  }

  /* ---------- the list ---------- */
  const mins = t => t.minutes || Math.max(3, Math.round(t.stops.length * 0.9));
  function resumeAt(t) { const i = store.get('trail_' + t.id, null); return i !== null && i > 0 && i < t.stops.length ? i : null; }
  function buildList() {
    let el = $q('#questions');
    if (!el) { el = document.createElement('div'); el.id = 'questions'; el.className = 'pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Questions to explore'); document.body.appendChild(el); }
    const themes = []; T.list.forEach(t => { if (!themes.includes(t.theme)) themes.push(t.theme); });
    el.innerHTML = `<button class="qx" aria-label="Close">×</button><h3>Questions</h3><div class="sub">Pick a question. Each one is a short trail of places in this world, with the answer at the end. At any stop you can wander off and explore, then come back.</div>`
      + themes.map(th => `<div class="qtheme">${esc(th)}</div>` + T.list.filter(t => t.theme === th).map(t => {
        const r = resumeAt(t);
        return `<button class="qitem" data-t="${t.id}"><span class="qq">${esc(t.question)}</span><span class="qt">${esc(t.teaser)}</span><span class="qm">${t.stops.length} stops · about ${mins(t)} min · ${esc((t.scales || []).join(' to '))}${r ? `<span class="qr">Continue from stop ${r + 1}</span>` : ''}</span></button>`;
      }).join('')).join('');
    el.querySelector('.qx').onclick = closeQ;
    el.querySelectorAll('.qitem').forEach(b => b.onclick = () => { const t = T.by[b.dataset.t], r = resumeAt(t); closeQ(); T.start(t.id, r || 0); });
  }
  function openQ() { buildList(); if (typeof closePops === 'function') closePops(); const e = $q('#questions'); e.classList.add('open'); const b = $q('#bQuestions'); if (b) b.classList.add('on'); e.scrollTop = 0; }
  function closeQ() { const e = $q('#questions'); if (e) e.classList.remove('open'); const b = $q('#bQuestions'); if (b) b.classList.remove('on'); }
  const _closePops = closePops;
  closePops = function () { _closePops(); closeQ(); };
  T.openList = openQ; T.closeList = closeQ;

  /* ---------- the Questions button ---------- */
  function addButton() {
    const nav = $q('#topright'); if (!nav || $q('#bQuestions')) return;
    const b = document.createElement('button'); b.className = 'tb'; b.id = 'bQuestions'; b.textContent = 'Questions'; b.title = 'Short guided trails that start from a question';
    nav.insertBefore(b, nav.firstChild);
    b.onclick = e => { e.stopPropagation(); const open = $q('#questions') && $q('#questions').classList.contains('open'); if (open) closeQ(); else { T.load().then(openQ); } };
    ['#bLibrary', '#bTracks'].forEach(s => { const x = $q(s); if (x) x.addEventListener('click', closeQ); });
  }

  /* ---------- starter questions on the first-visit overlay ---------- */
  function buildStarters() {
    const card = $q('#help .card'), go = $q('#goBtn'); if (!card || !go || card.querySelector('.starters')) return;
    const st = T.list.filter(t => t.starter).slice(0, 3); if (!st.length) return;
    const d = document.createElement('div'); d.className = 'starters';
    d.innerHTML = '<b>Not sure where to go? Start with a question</b>' + st.map(t => `<button data-t="${t.id}">${esc(t.question)}<span>${t.stops.length} stops</span></button>`).join('');
    d.querySelectorAll('button').forEach(b => b.onclick = () => { $q('#help').classList.add('hide'); store.set('seenHelp', true); T.start(b.dataset.t, 0); });
    const lead = card.querySelector('.lead'); if (lead && lead.nextSibling) lead.parentNode.insertBefore(d, lead.nextSibling); else go.parentNode.insertBefore(d, go);
  }

  /* ---------- search: a question finds its trail ---------- */
  const STOP = new Set('a an the is are was were be do does did how why what when where which who whom can could would should will of to in on at for from with by about as into it its this that these those and or but if then than so i me my we our you your they them there here have has had'.split(' '));
  const words = s => String(s).toLowerCase().replace(/[^a-z0-9À-ɏ\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const stem = w => w.length > 4 ? w.replace(/(ing|ies|es|s|ed|ly)$/, '') : w.replace(/s$/, '');
  function searchTrails(q) {
    if (!T.list.length) { T.load(); return []; }
    const qw = words(q).filter(w => !STOP.has(w) && w.length > 1); if (!qw.length) return [];
    const out = [];
    T.list.forEach(t => {
      if (!t._w) t._w = { head: words(t.question + ' ' + t.theme).map(stem), all: words(t.question + ' ' + t.teaser + ' ' + (t.keywords || []).join(' ') + ' ' + t.stops.map(s => s.title).join(' ')).map(stem) };
      const hit = (arr, w) => arr.some(x => x === stem(w) || (w.length > 2 && x.startsWith(stem(w))));
      const inHead = qw.filter(w => hit(t._w.head, w)).length, inAll = qw.filter(w => hit(t._w.all, w)).length;
      const full = String(t.question).toLowerCase().replace(/[?]/g, '');
      let rank = 9;
      if (q.replace(/[?\s]+$/, '') === full) rank = 0;
      else if (inHead === qw.length) rank = 1;
      else if (inAll === qw.length) rank = 2;
      else if (qw.length > 2 && inAll >= Math.ceil(qw.length * .6)) rank = 3;
      if (rank < 9) out.push({ title: t.question, sub: `A trail of ${t.stops.length} stops, about ${mins(t)} minutes`, prio: 0, rank, go: () => T.start(t.id, resumeAt(t) || 0) });
    });
    return out;
  }
  SEARCH_SOURCES.push(searchTrails);

  /* ---------- resolving where ---------- */
  function openCard(id) {
    if (typeof NODE !== 'undefined' && NODE[id]) showBodyNode(id, null);
    else if (typeof INFO !== 'undefined' && INFO[id]) showInfo(id);
    else if (typeof showNode === 'function') showNode(id);
  }
  T.openCard = openCard;
  function landAt(w, then) {
    const fin = () => { if (w.dir) { setCamDir(V(w.dir)); } then(); };
    if (w.landmark) { const L = LANDMARKS.find(l => l.label === w.landmark); if (!L) throw new Error('no landmark ' + w.landmark); L.go(fin); return; }
    if (w.node) { goToNode(w.node); waitFly(fin); return; }
    if (w.place) { if (!placeGo(w.place)) throw new Error('no place ' + w.place); waitFly(fin); return; }
    if (w.view) {
      const v = w.view, f = frameOfKey(v.frame); if (!f) throw new Error('no frame ' + v.frame); if (f.place) f.place(); w.dir = w.dir || v.dir;
      const go = () => {
        let p = V(v.point);
        if (v.part) { const rec = f.T && f.T.parts && f.T.parts[v.part]; if (!rec) { T.errors.push('no part ' + v.part); } else p = V(rec.pd.center).applyMatrix4(f.T.group.matrix); }
        flyTo(f, p, v.D, fin);
      };
      // a thing's parts exist only once its frame has been drawn: arrive near it first, then fly to the part
      if (v.part && !(f.T && f.T.parts && f.T.parts[v.part])) { f.ensure(); flyTo(f, V(v.point || [0, 1, 0]), v.D0 || (f.radius ? f.radius * f.unit * 3 : 20), () => until(() => f.T && f.T.parts && f.T.parts[v.part], 25000).then(go)); }
      else go();
      return;
    }
    if (w.deep) {
      const d = w.deep, parent = frameOfKey(d.in); if (!parent) throw new Error('no frame ' + d.in);
      parent.ensure(); const f = thDeepFrame({ type: d.type, id: d.id, kind: d.kind, organ: d.organ }, V(d.at)); if (!f) throw new Error('no deep scene ' + d.type + ':' + d.id);
      f.dynamic = true; f.keep = performance.now() + 120000; parent.addChild(f); f.ensure(); flyTo(f, new V3(), d.D, fin); return;
    }
    if (w.sm) { PX.goSM(w.sm.focus || null, null, fin); return; }
    if (w.scene === 'sun_plasma') { PX.goSunCore(); waitFly(fin); return; }
    throw new Error('stop has no usable where');
  }
  // functions that start a flight and give no callback: wait until the flight object is gone
  function waitFly(then) {
    const t0 = performance.now();
    const tick = () => { if (typeof fly !== 'undefined' && fly && performance.now() - t0 < 180000) { setTimeout(tick, 120); return; } then(); };
    setTimeout(tick, 60);
  }

  /* ---------- actions ---------- */
  function until(test, ms) { return new Promise(res => { const t0 = performance.now(); const k = () => { let v = null; try { v = test(); } catch (e) { /* not ready */ } if (v || performance.now() - t0 > (ms || 12000)) res(v); else setTimeout(k, 150); }; k(); }); }
  async function runAction(a, tok) {
    if (tok !== T.token) return;
    if (a.card) openCard(a.card);
    else if (a.mode) { const F = frameOfKey(a.thing); const ok = await until(() => F && F.T && F.T.modeId !== undefined && F.T.def && F.T.def.modes.some(m => m.id === a.mode), 15000); if (ok && tok === T.token) { F.T.setMode(a.mode); if (typeof thUpdateControls === 'function') try { thUpdateControls(F); } catch (e) { } } else T.errors.push('mode ' + a.thing + ':' + a.mode + ' not available'); }
    else if (a.bodyMode) { const F = FR.body; F.mode = a.bodyMode; store.set('bodyMode', a.bodyMode); if (typeof applyMode === 'function') applyMode(F); if (F.modeSeg) F.modeSeg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === a.bodyMode)); }
    else if (a.element) { const F = FR.atom; await until(() => F.setElement, 8000); F.setElement(a.element); }
    else if (a.sm) { await until(() => typeof PX !== 'undefined' && PX.inSM(), 8000); PX.smSet(a.sm.mode || 'overview', Object.assign({}, a.sm, { mode: undefined })); }
    else if (a.time) { simTime = Date.parse(a.time); if (a.speed !== undefined) { timeSpeed = a.speed; const b = $q('#timeS'); if (b) b.textContent = a.speed === 0 ? '⏸' : a.speed === 1 ? '1×' : b.textContent; } }
    else if (a.dir) { setCamDir(V(a.dir)); }
    else if (a.press) { const want = a.press.toLowerCase(); const b = await until(() => [...document.querySelectorAll('#info button, #controls button, #ptable button')].find(x => x.offsetParent && x.textContent.trim().toLowerCase().includes(want)), a.waitMs || 6000); if (b) b.click(); else T.errors.push('no button: ' + a.press); }
    else if (a.hide) { const F = FR.body; a.hide.forEach(id => F.hidden.add(id)); applyMode(F); }
    else if (a.hideBody) { const F = FR.body; if (F && F.hidden && typeof ANAT_SYNC !== 'undefined' && ANAT_SYNC) { ANAT_SYNC.parts.forEach(p => F.hidden.add(p.id)); if (typeof applyMode === 'function') applyMode(F); } }
    else if (a.reveal) { goToNode(a.reveal); }
    else if (a.wait) await new Promise(r => setTimeout(r, a.wait));
  }

  /* ---------- the player ---------- */
  function panel() {
    let el = $q('#trail');
    if (!el) { el = document.createElement('aside'); el.id = 'trail'; el.setAttribute('aria-label', 'Trail'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    return el;
  }
  T.start = function (id, i) {
    return T.load().then(() => {
      const t = T.by[id]; if (!t) return;
      closeQ(); if (typeof cancelTour === 'function') cancelTour();
      if (T.cur && T.cur.id !== id) store.set('trail_last', id);
      T.cur = t; store.set('trail_last', id); document.body.classList.add('trailOn'); panel().classList.add('on');
      return T.go(Math.max(0, Math.min(i || 0, t.stops.length)));
    });
  };
  T.leave = function () {
    T.token++; T.cur = null; T.arrived = false; document.body.classList.remove('trailOn'); const p = $q('#trail'); if (p) { p.classList.remove('on'); p.innerHTML = ''; } document.body.style.removeProperty('--trailH');
    buildList();
  };
  T.go = function (i) {
    const t = T.cur; if (!t) return Promise.resolve();
    const tok = ++T.token; T.i = i; T.arrived = false; T.away = false; T.startedAt = performance.now();
    if (i < t.stops.length) store.set('trail_' + t.id, i); else store.set('trail_' + t.id, null);
    render();
    if (i >= t.stops.length) { T.arrived = true; return Promise.resolve(); }
    const s = t.stops[i];
    if (typeof closeInfo === 'function' && !(s.do || []).some(a => a.card)) closeInfo();
    if (typeof FR !== 'undefined' && FR.body) { FR.body.reveal = null; if (FR.body.hidden && FR.body.hidden.size && s.keepHidden !== true) { FR.body.hidden.clear(); } }
    return new Promise(res => {
      const done = async () => {
        if (tok !== T.token) return res();
        try { for (const a of (s.do || [])) await runAction(a, tok); } catch (e) { T.errors.push('stop ' + (i + 1) + ': ' + (e && e.message)); console.warn('trail action failed', e && e.message); }
        if (tok === T.token) { T.arrived = true; T.landed = { frame: cam.A, D: cam.D }; T.away = false; syncAway(); }
        res();
      };
      try { landAt(Object.assign({}, s.where), () => { if (tok === T.token) done(); else res(); }); }
      catch (e) { T.errors.push('stop ' + (i + 1) + ': ' + e.message); console.warn('trail stop failed', e.message); done(); }
    });
  };
  T.next = () => { if (T.cur && T.i < T.cur.stops.length) T.go(T.i + 1); };
  T.back = () => { if (T.cur && T.i > 0) T.go(T.i - 1); };
  T.state = () => ({ id: T.cur && T.cur.id, i: T.i, arrived: T.arrived, away: T.away, errors: T.errors.slice(), chain: chainOf(cam.A).map(f => f.name || f.type), D: cam.D });

  function render() {
    const t = T.cur, el = panel(); if (!t) return;
    const n = t.stops.length, atEnd = T.i >= n;
    let h = `<div class="tr-head"><span class="tr-q">${esc(t.question)}</span><span class="tr-btns"><button class="tr-fold" title="Hide the text to see more of the scene">${T.fold ? 'Show text' : 'Hide text'}</button><button class="tr-leave" title="Close the trail. Your place is remembered.">Leave trail</button></span></div>`;
    if (!atEnd) {
      const s = t.stops[T.i];
      h += `<div class="tr-step">Stop ${T.i + 1} of ${n}${s.scale ? ' · ' + esc(s.scale) : ''}</div><h3>${s.title}</h3>`;
      if (s.model) h += `<div class="tr-model">${s.model}</div>`;
      h += para(s.text).map(p => `<p>${p}</p>`).join('');
      if (s.notice) h += `<div class="tr-notice"><b>Notice</b>${s.notice}</div>`;
      if (s.deeper && s.deeper.length) h += `<div class="tr-deeper">Go deeper:${s.deeper.map(d => `<button data-n="${esc(d.node)}">${esc(d.label)}</button>`).join('')}</div>`;
      h += `<div class="tr-away"><span>You have moved away from this stop.</span><button class="tr-ret">Return to this stop</button></div>`;
    } else {
      h += `<div class="tr-step">The answer</div><h3>${esc(t.question)}</h3><p class="tr-ans">${t.answer}</p>`;
      if (t.unknown) h += `<div class="tr-unk"><b>Still unknown</b>${t.unknown}</div>`;
      const nx = (t.next || []).map(id => T.by[id]).filter(Boolean);
      if (nx.length) h += `<div class="tr-next"><b>Where next</b>${nx.map(x => `<button data-t="${x.id}">${esc(x.question)}</button>`).join('')}</div>`;
    }
    h += `<div class="tr-here"><b></b><span class="tr-fnote"></span></div>`;
    h += `<div class="tr-nav"><button class="b back"${T.i === 0 ? ' disabled' : ''}>Back</button><div class="tr-dots" role="group" aria-label="Progress">`
      + Array.from({ length: n + 1 }, (_, k) => `<button class="${k < T.i ? 'done' : ''}${k === T.i ? ' on' : ''}${k === n ? ' end' : ''}" data-k="${k}" aria-label="${k === n ? 'The answer' : 'Stop ' + (k + 1)}"></button>`).join('')
      + `</div><button class="b next"${atEnd ? ' disabled' : ''}>${T.i === n - 1 ? 'The answer' : 'Next'}</button></div>`;
    el.innerHTML = h;
    el.querySelector('.tr-leave').onclick = T.leave; el.classList.toggle('fold', !!T.fold);
    el.querySelector('.tr-fold').onclick = e => { T.fold = !T.fold; e.target.textContent = T.fold ? 'Show text' : 'Hide text'; el.classList.toggle('fold', T.fold); sizeVars(); };
    el.querySelector('.back').onclick = T.back; el.querySelector('.next').onclick = T.next;
    el.querySelectorAll('.tr-dots button').forEach(b => b.onclick = () => T.go(+b.dataset.k));
    el.querySelectorAll('.tr-deeper button').forEach(b => b.onclick = () => openCard(b.dataset.n));
    el.querySelectorAll('.tr-next button').forEach(b => b.onclick = () => T.start(b.dataset.t, 0));
    const r = el.querySelector('.tr-ret'); if (r) r.onclick = () => T.go(T.i);
    el.scrollTop = 0; syncHere(); sizeVars();
  }
  function syncHere() {
    const el = $q('#trail .tr-here'); if (!el) return; const n = ($q('#capN') || {}).textContent || '', k = ($q('#capK') || {}).textContent || '', note = ($q('#capNote') || {}).textContent || '';
    const b = el.querySelector('b'), f = el.querySelector('.tr-fnote'), t1 = n ? n + (k ? ' · ' + k : '') : k; if (b.textContent !== t1) b.textContent = t1; if (f.textContent !== note) f.textContent = note;
  }
  function sizeVars() { const p = $q('#trail'), c = $q('#caption'); if (c) document.body.style.setProperty('--capH', c.offsetHeight + 'px'); if (p && T.cur) document.body.style.setProperty('--trailH', p.offsetHeight + 'px'); }

  /* has the visitor wandered off? */
  function syncAway() { const a = $q('#trail .tr-away'); if (a) a.classList.toggle('on', !!T.away && !!T.cur && T.i < T.cur.stops.length); sizeVars(); }
  setInterval(() => {
    if (!T.cur) return;
    syncHere(); sizeVars();
    if (T.i >= T.cur.stops.length) return;
    if (typeof fly !== 'undefined' && fly) { return; }
    if (!T.arrived) { if (performance.now() - T.startedAt > 3000 && !T.pending) { /* the visitor took over the camera mid-flight: treat as arrived */ T.arrived = true; T.landed = { frame: cam.A, D: cam.D }; T.away = true; syncAway(); } return; }
    const L = T.landed; if (!L) return;
    const away = !chainOf(cam.A).includes(L.frame) || cam.D > L.D * 12 || cam.D < L.D / 12;
    if (away !== T.away) { T.away = away; syncAway(); }
  }, 600);

  /* ---------- keyboard: arrows move along the trail, Escape never traps ---------- */
  let escHadOther = false;
  addEventListener('keydown', e => {
    if (!T.cur || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if ($q('#lab') && $q('#lab').offsetParent) return; if ($q('#ptable') && $q('#ptable').offsetParent) return;
    const help = $q('#help') && !$q('#help').classList.contains('hide');
    if (e.key === 'Escape') { escHadOther = help || !!document.querySelector('.pop.open') || !!($q('#info') && $q('#info').classList.contains('open')) || !!(typeof tour !== 'undefined' && tour); if (!escHadOther) setTimeout(T.leave, 0); return; }
    if (help) return;
    if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); e.preventDefault(); T.next(); }
    else if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); e.preventDefault(); T.back(); }
  }, true);

  /* ---------- boot ---------- */
  addButton();
  if (typeof ResizeObserver !== 'undefined') { const c = $q('#caption'); if (c) new ResizeObserver(sizeVars).observe(c); }
  T.load();
})();
