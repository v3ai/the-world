'use strict';
/* ================= KNOWLEDGE / LIBRARY DATA ================= */
let KN = null, FRONT = null, BOOKS = null, knLoading = null;
const KN_BY_SIM = {}, KN_BY_ID = {};
function loadKnowledge() {
  if (knLoading) return knLoading;
  knLoading = Promise.all([
    fetch('data/knowledge/nodes.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('data/knowledge/frontier.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('data/library/books.json').then(r => r.ok ? r.json() : []).catch(() => []),
  ]).then(([n, f, b]) => {
    KN = n || []; FRONT = {}; (f || []).forEach(x => FRONT[x.id] = x); BOOKS = b || [];
    KN.forEach(x => { KN_BY_ID[x.id] = x; (x.sim || []).forEach(s => (KN_BY_SIM[s] = KN_BY_SIM[s] || []).push(x)); });
  });
  return knLoading;
}
// map explorer object ids → knowledge-graph sim ids
const SIM_OF = {
  mito: 'mitochondrion', chloroplast: 'chloroplast', membrane: 'membrane', phospholipid: 'membrane', channel: 'membrane', ribosome: 'ribosome', er: 'er', golgi: 'golgi', lysosome: 'lysosome',
  nucleus: 'nucleus_cell', chromatin: 'chromatin', nucleosome: 'nucleosome', histone: 'nucleosome', dna: 'dna', base_A: 'dna', base_T: 'dna', base_G: 'dna', base_C: 'dna', hbond: 'dna', sugar: 'dna', phosphate: 'dna', unzip: 'dna',
  cell_animal: 'cell:animal', cell_plant: 'cell:plant', vacuole: 'cell:plant', cellwall: 'cell:plant', human: 'human', dog: 'dog', tree: 'tree', flower: 'flower', bee: 'bee', bird: 'bird', mushroom: 'mushroom', pond: 'pond', cloud: 'cloud', air: 'air', ground: 'soil',
  earth: 'planet:earth', ocean: 'planet:earth', land: 'planet:earth', ice: 'planet:earth', moon: 'moon', iss: 'planet:earth', crust: 'planet:earth', mantle: 'planet:earth', outercore: 'planet:earth', innercore: 'planet:earth', magnetosphere: 'planet:earth', aurora: 'planet:earth',
  sun: 'sun', sunSky: 'sun', mercury: 'planet:mercury', venus: 'planet:venus', earthPlanet: 'planet:earth', mars: 'planet:mars', jupiter: 'planet:jupiter', saturn: 'planet:saturn', uranus: 'planet:uranus', neptune: 'planet:neptune', pluto: 'dwarf:pluto', asteroids: 'asteroidbelt', kuiper: 'kuiper', kepler: 'solarsystem', solar: 'solarsystem',
  galaxy: 'milkyway', sunMarker: 'milkyway', sgrA: 'sgrA', bulge: 'milkyway', spiralArm: 'milkyway', globular: 'milkyway', lmc: 'localgroup', smc: 'localgroup', darkhalo: 'milkyway',
  blackhole: 'blackhole', horizon: 'blackhole', disk: 'blackhole', photonRing: 'blackhole', s2: 'sgrA', radii: 'blackhole', jets: 'blackhole', probe: 'blackhole',
  universe: 'cosmos', milkyway: 'milkyway', andromeda: 'localgroup', cluster: 'cosmos', filament: 'cosmos', galSpiral: 'galaxy', galElliptical: 'galaxy', galIrregular: 'galaxy', cmb: 'cmb', darkmatter: 'cosmos', expansion: 'cosmos',
  proton: 'proton', neutron: 'neutron', electron: 'electron', valence: 'electron', config: 'atom', photon: 'photon', 
  gluon: 'gluon', 
  bond_single: 'molecule', bond_double: 'molecule', polarity: 'molecule', delocalized: 'molecule',
};
const CERT = { C1: ['Settled science', '#2f7d4f'], C2: ['Well supported', '#1e4e8f'], C3: ['Debated', '#b7791f'], C4: ['Speculative', '#9b2c4f'] };
function certBadge(c) { const x = CERT[c]; return x ? `<span class="cert" style="--c:${x[1]}" title="How certain science is (level ${c.slice(1)} of 4)"><i></i>${x[0]}</span>` : ''; }
function bookRef(code, sec) {
  if (!BOOKS) return '';
  const b = BOOKS.find(x => x.c === code); if (!b) return '';
  const ch = b.ch[parseInt(sec) - 1]; if (!ch) return '';
  const s = ch[2].find(x => x[0] === sec) || ch[2][0];
  return `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${s[2]}" target="_blank" rel="noopener"><b>${b.t} ${s[0] || 'Ch. ' + ch[0]}</b> ${s[1]}</a>`;
}

/* ================= WHERE AM I: back, breadcrumbs =================
   navStack holds earlier states: {card, cam}. A state is pushed when a card opens (the card you leave) and when a flight
   starts (flyTo calls navFlyHook), so Back returns to the previous place and card. navQuiet is raised while Back itself acts. */
const navStack = []; let curCard = null, navQuiet = 0;
function camSnap() { return { A: cam.A, T: cam.T.clone(), D: cam.D }; }
function sameSnap(a, b) { return a && b && a.A === b.A && a.T.distanceTo(b.T) < a.D * .02 / a.A.unit && Math.abs(Math.log(a.D / b.D)) < .05; }
function navFlyHook() {
  if (navQuiet || (typeof tour !== 'undefined' && tour && tour.i > 1)) return; // a tour is one trip: only its first leg is remembered
  const e = { card: curCard, cam: camSnap() }, top = navStack[navStack.length - 1];
  if (top && top.card === e.card && sameSnap(top.cam, e.cam)) return;
  navStack.push(e); if (navStack.length > 60) navStack.shift(); navUpdate();
}
function navUpdate() { const b = $('#navBack'); if (b) b.disabled = !navStack.length; }
/* the same view, to the eye: the same frame, the distance within a fifth, the target within a tenth of the view */
function nearSnap(a, b) { return a && b && a.A === b.A && Math.abs(Math.log(a.D / b.D)) < .2 && a.T.distanceTo(b.T) < a.D * .1 / a.A.unit; }
function navBack() {
  /* Back goes to the previous place that looks different: steps that would leave the view as it is (a card opened and closed at the same place, a framing
     that did not move: three Backs from the Sun's plasma gave the Sun at 3.0 and 3.01 million km) are passed over */
  let e = navStack.pop(); const now = camSnap();
  while (e && navStack.length && e.cam && nearSnap(e.cam, now) && !fly) e = navStack.pop();
  navUpdate(); if (!e) return;
  cancelTour(); navQuiet++;
  try {
    if (e.cam) flyTo(e.cam.A, e.cam.T, e.cam.D);
    if (e.card && e.card.reopen) e.card.reopen(); else closeInfo();
  } finally { navQuiet--; }
  navUpdate();
}
const CRUMB_NAME = { 'Observable universe': 'Universe', 'Greenwich, London': 'London' };
function crumbGo(f) {
  cancelTour();
  const lms = LANDMARKS.filter(l => l.frame === f).sort((a, b) => b.D - a.D); // the widest landmark of that frame is its overview
  if (lms.length) { lms[0].go(); return; }
  flyTo(f, f.center ? f.center.clone() : new V3(), frameOverviewD(f)); // no landmark: a little outside its content (the whole body, not 27 m away)
}
/* The path as the panel shows it: root ... the frame you are in. The patch of skin (and the cell, DNA and atoms in it) sits on the person standing in the park: say so, and let "You" be a way out. */
function crumbChain(cur) {
  const chain = chainOf(cur).reverse();
  const i = typeof FR !== 'undefined' && FR.skin ? chain.indexOf(FR.skin) : -1; if (i > 0 && FR.body && !chain.includes(FR.body)) chain.splice(i, 0, FR.body);
  return chain;
}
/* "See it from further out": one level back up, which is what the step before the last one in the path does. */
function goFurtherOut() {
  if (typeof DESCENT !== 'undefined' && DESCENT && DESCENT.up) { DESCENT.up(); return; }   // the descent module (js/descent.js) knows the way back out of what it built
  const ch = crumbChain(capFrame || cam.A); if (ch.length > 1) crumbGo(ch[ch.length - 2]); else message('This is the widest view there is.');
}
/* The path, in the panel's head on a line of its own: the root, the place you are in and its parent are always there; the steps between them fold into one
   "N more" control that opens the whole path as a list inside the panel. Every step is a whole button (a tap target), a name is never cut mid-word, and nothing
   is laid out outside the panel (the old one-line path was scrolled so that "Universe" and "N more" sat to the left of the panel, out of reach). */
function crumbName(f) { return CRUMB_NAME[humanName(f)] || humanName(f); }
function crumbShort(f) { const s = crumbName(f); if (s.length <= 42) return s; const c = s.slice(0, 42), i = c.lastIndexOf(' '); return (i > 18 ? c.slice(0, i) : c).replace(/[\s,:;.(]+$/, '') + '\u2026'; }
let crumbMenuFor = null;
function crumbMenuEl() {
  let m = document.getElementById('crumbMenu');
  if (!m) {
    m = document.createElement('div'); m.id = 'crumbMenu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', 'The whole path'); m.hidden = true;
    const head = document.getElementById('panelHead'); if (head) head.appendChild(m);
    document.addEventListener('pointerdown', e => { if (!m.hidden && !m.contains(e.target) && !(e.target.closest && e.target.closest('.crumb.more'))) crumbMenuClose(); }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) { crumbMenuClose(); const b = document.querySelector('#crumbList .more'); if (b) b.focus(); } });
  }
  return m;
}
let crumbMenuRaised = false;   // a phone's sheet is a third of the screen: the list raises it while open and lowers it again when it closes
function crumbMenuClose() { const m = document.getElementById('crumbMenu'); if (m) m.hidden = true; if (crumbMenuRaised) { crumbMenuRaised = false; const p = document.getElementById('panel'); if (p) p.classList.remove('tall'); } const b = document.querySelector('#crumbList .more'); if (b) b.setAttribute('aria-expanded', 'false'); crumbMenuFor = null; }
function crumbMenuOpen(chain) {
  const m = crumbMenuEl(), n = chain.length;
  m.innerHTML = chain.map((f, i) => i === n - 1 ? `<span class="cmi cur" role="menuitem" aria-current="location" aria-disabled="true">${crumbName(f)}</span>` : `<button class="cmi" type="button" role="menuitem" data-i="${i}" title="Fly out to ${humanName(f)}">${crumbName(f)}</button>`).join('');
  m.querySelectorAll('.cmi[data-i]').forEach(b => b.onclick = () => { crumbMenuClose(); crumbGo(chain[+b.dataset.i]); });
  m.hidden = false; crumbMenuFor = chain[n - 1];
  const p = document.getElementById('panel'); if (p && matchMedia('(max-width: 860px)').matches && !p.classList.contains('tall')) { p.classList.add('tall'); crumbMenuRaised = true; }
  const b = document.querySelector('#crumbList .more'); if (b) b.setAttribute('aria-expanded', 'true');
  const first = m.querySelector('button'); if (first) first.focus({ preventScroll: true });
}
function updateCrumbs(cur) {
  const ol = $('#crumbList'); if (!ol) return;
  const chain = crumbChain(cur), n = chain.length; // root ... current
  const show = n > 4 ? [0, -1, n - 2, n - 1] : chain.map((f, i) => i), hidden = n > 4 ? n - 3 : 0;
  ol.innerHTML = show.map(i => i < 0 ? `<li><button class="crumb more" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="crumbMenu" title="Show the whole path">${hidden} more</button></li>`
    : `<li>${i === n - 1 ? `<span class="crumb cur" aria-current="location" title="${humanName(chain[i])}">${crumbShort(chain[i])}</span>` : `<button class="crumb" type="button" data-i="${i}" title="Fly out to ${humanName(chain[i])}">${crumbShort(chain[i])}</button>`}</li>`).join('');
  ol.querySelectorAll('.crumb[data-i]').forEach(b => b.onclick = () => { crumbMenuClose(); crumbGo(chain[+b.dataset.i]); });
  const mo = ol.querySelector('.more'); if (mo) mo.onclick = () => { const m = crumbMenuEl(); if (!m.hidden) crumbMenuClose(); else crumbMenuOpen(chain); };
  if (crumbMenuFor && crumbMenuFor !== cur) crumbMenuClose();
}

/* ================= ONE CARD =================
   Every thing you can click opens the same card, whichever data it comes from: a scene object (INFO), an explorable topic
   (NODE) or a knowledge-map topic (KN). The three code paths below only build a spec; cardHtml() draws it, so the header,
   the Basics / Deeper / Expert tabs and the sections always appear in the same order:
   header, figure, tabs, facts, actions, what it is made of, what it is part of, how it works, more, textbook sections,
   open questions, how certain science is. Spec keys: tag, title, figure, core, track, basics, deeper, expert, facts, note,
   buttons, after, madeLabel, made, partLabel, part, howLabel, how, more, books, open (html), cert (C1..C4), sci (true: fill
   "The science behind this" once the knowledge map has loaded), look (true: the card of a clicked thing: Look inside and See it
   from further out go straight under its title). */
const infoEl = $('#info');
let depthPref = store.get('depth', 0), infoState = null;
const CERT_WORDS = { C1: 'Settled: checked in many independent ways and not in serious doubt.', C2: 'Well supported, and the details are still being refined.', C3: 'Debated: experts disagree about this.', C4: 'Speculative: a proposal that has not been tested yet.' };
function refChip(code) {
  const r = REFS[code]; if (!r) return '';
  return `<a class="ref" href="https://openstax.org/books/${r[1]}/pages/${r[2]}" target="_blank" rel="noopener"><b>${BOOK_NAMES[r[0]]} ${r[3]}</b> ${r[4]}</a>`;
}
function layered(tabs) { // tabs: [[label, html], ...]
  const t = tabs.filter(x => x[1]); const di = Math.min(depthPref, t.length - 1);
  let h = t.length > 1 ? `<div class="tabs">${t.map((x, i) => `<button data-i="${i}" class="${i === di ? 'on' : ''}">${x[0]}</button>`).join('')}</div>` : '';
  t.forEach((x, i) => h += `<div class="lay" data-i="${i}"${i === di ? '' : ' hidden'}>${x[1]}</div>`);
  return h;
}
function wireTabs() {
  infoEl.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
    const i = +b.dataset.i; depthPref = i; store.set('depth', i);
    infoEl.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    infoEl.querySelectorAll('.lay').forEach(l => l.hidden = +l.dataset.i !== i);
  });
}
function cardHtml(s) {
  const sec = (label, body) => body ? `<div class="refs"><div class="rh">${label}</div>${body}</div>` : '';
  let h = `<div class="cardhead"><div class="tag">${s.tag || ''}</div></div><h2>${s.title}</h2>`; // Back is in the panel's head, once
  if (s.look) h += `<div class="lookrow">${LOOK_BTNS}</div>`; // the card of a clicked thing: its two controls, straight under the title
  h += (s.figure || '') + (s.core || '') + (s.track || '');
  h += layered([['Basics', s.basics ? `<div class="body">${s.basics}</div>` : ''], ['Deeper', s.deeper ? `<div class="body"><p>${s.deeper}</p></div>` : ''], ['Expert', s.expert ? `<div class="body expert"><p>${s.expert}</p></div>` : '']]);
  if (s.facts && s.facts.length) h += '<dl>' + s.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('') + '</dl>';
  if (s.note) h += `<div class="note">${s.note}</div>`;
  if (s.buttons) h += `<div class="btnrow">${s.buttons}</div>`;
  h += s.after || '';
  h += sec(s.madeLabel || 'What it is made of', s.made) + sec(s.partLabel || 'What it is part of', s.part) + sec(s.howLabel || 'How it works', s.how);
  h += s.more || '';
  h += sec('Textbook sections', s.books) + sec('Open questions', s.open);
  if (s.cert && CERT[s.cert]) h += sec('How certain is this?', `<div class="certrow">${certBadge(s.cert)}<span>${CERT_WORDS[s.cert]}</span></div>`);
  else if (s.sci) h += '<div id="sci"></div>';
  return h;
}
/* The two controls every card of a clicked thing has. "Look inside" does exactly what a double click on the thing does (lookInside, js/engine.js);
   "See it from further out" goes one level back up, which is what the step before the last one in the path does. */
const LOOK_BTNS = '<button class="zoom" id="zoomBtn" title="The same as double-clicking it: its cut-open view if it has one, otherwise the next level down">Look inside</button><button class="zoom alt" id="outBtn" title="Fly out one level, to the place this is part of">See it from further out</button>';
function wireLookBtns(h) {
  const zb = $('#zoomBtn'); if (zb) zb.onclick = () => lookInside(h); const ob = $('#outBtn'); if (ob) ob.onclick = goFurtherOut;
  /* where the answer is the next level down (no cut-open view to show first), the descent module can say what that level is: the button names it, and a stand-in is admitted under the buttons */
  if (zb && h && h.obj && h.frame && h.frame.built && typeof DESCENT !== 'undefined' && DESCENT && DESCENT.describe && !h.obj.userData.lookInside) {
    let d = null, ls = null; try { ls = typeof layerNext === 'function' ? layerNext(h) : null; if (!ls && !cutOpenOf(h, true)) d = DESCENT.describe(h); } catch (e) { d = null; }
    if (ls) { zb.textContent = 'Look inside: ' + ls.name.charAt(0).toLowerCase() + ls.name.slice(1); zb.title = 'The same as double-clicking it: the next layer under this spot'; }
    if (d && d.title) zb.textContent = 'Look inside: ' + d.title;
    if (d && d.note) { const n = document.createElement('p'); n.className = 'cnote lookNote'; n.textContent = d.note; const row = zb.closest('.lookrow'); if (row) row.insertAdjacentElement('afterend', n); }
  }
}
function chipsHtml(items) { return items.length ? `<div class="chips">${items.join('')}</div>` : ''; }
/* A card opened in this same run of code and then a flight started (goToNode, search, a trail stop, a chip) is a deliberate jump: the card describes where
   the flight is going, so it stays open (with whatever the jump highlighted or peeled). A flight started on its own closes a card left over from where you were.
   (The flights that belong to a selection, framing it and looking inside it, go through flyKeep in js/engine.js.) */
let CARD_FRESH = false;
{ const _fly = flyTo; window.flyTo = function (...a) { if (!CARD_FRESH) { try { closeInfo(); } catch (e) { } } return _fly.apply(this, a); }; }

/* ================= THE PANEL =================
   One panel on the right holds everything there is to read (see ONE PANEL in css/app.css and the layout in index.html):
   the path and Back; a trail (js/trails.js) and a process (js/nodes.js) when one is running; the card of the selected thing (#info,
   drawn by openPanel) or else the place (#place, kept by updateCaption); the scene's own explanations (panelSection); the clock.
   PANEL.min is the minimised state, remembered across reloads. While minimised the panel NEVER opens by itself: panelShow(why) is
   called only from something the visitor did (a click on a thing, a search result, a link in a list, the tab, a trail's "Show text",
   the clock button). Everything else that changes its content only updates the tab (title, and a quiet dot). */
const panelEl = $('#panel');
const PANEL = { min: !!store.get('panelMin', false), hint: !store.get('panelHint', false), tab: '', secs: store.get('panelSecs', {}), opened: [], userSel: false };
function panelApply() {
  panelEl.classList.toggle('min', PANEL.min); document.body.classList.toggle('panelMin', PANEL.min); document.body.classList.toggle('panelOpen', !PANEL.min);
  const b = $('#panelMin'); if (b) b.setAttribute('aria-expanded', String(!PANEL.min));
  const h = $('#panelHint'); if (h) h.hidden = !PANEL.hint;
}
function panelSet(min) {
  if (PANEL.min === min) return; PANEL.min = min; store.set('panelMin', min); panelApply();
  $('#panelTab').classList.remove('new'); if (!min) panelEl.classList.remove('tall');
}
function panelShow(why) { PANEL.opened.push(why || '?'); if (PANEL.opened.length > 40) PANEL.opened.shift(); panelSet(false); } // PANEL.opened: what opened it, for the tests
function panelMinimise() { panelSet(true); panelHintDone(); canvas.focus(); }
function panelHintDone() { if (!PANEL.hint) return; PANEL.hint = false; store.set('panelHint', true); const h = $('#panelHint'); if (h) h.hidden = true; }
/* what the panel is about now, in a few words: the tab shows it while the panel is minimised */
function panelTitle() {
  if (typeof TRAILS !== 'undefined' && TRAILS.cur) { const t = TRAILS.cur, n = t.stops.length; return TRAILS.i < n ? `Stop ${TRAILS.i + 1} of ${n}: ${String(t.stops[TRAILS.i].title).replace(/<[^>]+>/g, '')}` : 'The answer'; }
  const h2 = infoState && infoEl.querySelector('h2'); if (h2) return h2.textContent;
  return $('#capN').textContent || '';
}
let _ptT = 0;
function panelSync(now) { // about four times a second: the tab's title, the dot, the scene sections that have emptied or filled
  if (now - _ptT < 240) return; _ptT = now;
  const t = panelTitle(), el = $('#panelTabT');
  if (t !== PANEL.tab) { const first = !PANEL.tab; PANEL.tab = t; el.textContent = W <= 860 && /^Stop \d+ of \d+: /.test(t) ? t.split(':')[0] : t; if (PANEL.min && !first) $('#panelTab').classList.add('new'); } // a phone's pill has room for "Stop 3 of 9" beside the trail's buttons, not for the stop's title
  const tt = $('#tabTrail'), on = typeof TRAILS !== 'undefined' && !!TRAILS.cur;
  if (tt.hidden === on) tt.hidden = !on;
  if (on) { const n = TRAILS.cur.stops.length; $('#tabPrev').disabled = TRAILS.i === 0; $('#tabNext').disabled = TRAILS.i >= n; }
  const ss = $('#sceneSecs');
  for (const d of [...ss.children]) {
    const e = d._el; if (!e || e.parentNode !== d) { d.remove(); continue; }
    const empty = e.style.display === 'none' || !e.firstChild; if (d.classList.contains('empty') !== empty) d.classList.toggle('empty', empty);
    const sm = d.firstChild, ti = e.dataset.sec || 'About this view'; if (sm.textContent !== ti) sm.textContent = ti;
    if (!empty && d.open && !PANEL.min && !PANEL.secs[d.dataset.k] && e.dataset.secOpen !== 'always') { d._seen = (d._seen || 0) + .24; if (d._seen > 20) { PANEL.secs[d.dataset.k] = 1; store.set('panelSecs', PANEL.secs); } } // read once (on screen for 20 s): folded the next time
  }
}
/* A scene's own explanation as a section of the panel: open the first time it is met, folded after it has been read (or always open
   for a section the scene works through: data-sec-open="always"). The visitor's own fold or unfold is remembered. */
function panelSection(el) {
  const d = document.createElement('details'), k = el.dataset.secKey || el.dataset.sec || el.className; d.className = 'psec'; d.dataset.k = k; d._el = el;
  const sm = document.createElement('summary'); sm.textContent = el.dataset.sec || 'About this view'; d.appendChild(sm); d.appendChild(el);
  const st = PANEL.secs[k]; d.open = st === 'open' || (st !== 'shut' && (el.dataset.secOpen === 'always' || !st));
  d.addEventListener('toggle', () => { if (d._auto) { d._auto = false; return; } PANEL.secs[k] = d.open ? 'open' : 'shut'; store.set('panelSecs', PANEL.secs); });
  return d;
}
function openPanel(h, desc) {
  CARD_FRESH = true; Promise.resolve().then(() => { CARD_FRESH = false; });
  const key = desc && desc.key || '';
  if (!navQuiet && key && (!curCard || curCard.key !== key)) navStack.push({ card: curCard, cam: curCard ? curCard.cam : camSnap() }), navStack.length > 60 && navStack.shift();
  curCard = key ? { key, reopen: desc.reopen, cam: camSnap() } : null;
  if (typeof selHit !== 'undefined' && selHit && !(infoState && infoState.h === selHit)) setSelected(null); // another card: the thing that was selected is no longer
  document.body.classList.add('cardOpen'); panelEl.classList.add('hasSel');
  infoEl.innerHTML = `<button class="x" title="Close this card and show the place again">Close</button>` + h;
  infoEl.classList.add('open'); infoEl.querySelector('.x').onclick = closeInfo; wireTabs(); wireCardLinks(); navUpdate();
  const body = $('#panelBody'), tr = $('#trail');
  if (tr && tr.classList.contains('on') && PANEL.userSel) body.scrollTop = Math.max(0, infoEl.offsetTop - 8); else body.scrollTop = 0; // a card you asked for while a trail plays: bring it into view; otherwise the top
  PANEL.userSel = false;
}
/* Phone: the panel is a sheet that starts low (about a third of the screen, so what you tapped stays in view) and is dragged up for the rest. */
function wireGrab() {
  const g = $('#panelGrab'); if (!g) return; let y0 = null, moved = false;
  g.onpointerdown = e => { y0 = e.clientY; moved = false; try { g.setPointerCapture(e.pointerId); } catch (_) { } };
  g.onpointermove = e => { if (y0 === null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 24) { moved = true; panelEl.classList.toggle('tall', dy < 0); y0 = e.clientY; } };
  g.onpointerup = () => { if (y0 !== null && !moved) panelEl.classList.toggle('tall'); y0 = null; };
  g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panelEl.classList.toggle('tall'); } };
}
/* closeInfo: nothing is selected any more. The panel stays as it is (open or minimised) and shows the place. */
function closeInfo() {
  infoEl.classList.remove('open'); infoEl.innerHTML = ''; document.body.classList.remove('cardOpen'); panelEl.classList.remove('hasSel'); infoState = null; curCard = null; selLeave = null;
  if (typeof selHit !== 'undefined' && selHit) setSelected(null);
  if (typeof FR !== 'undefined') [FR.body, FR.body_f].forEach(b => { if (b) { b.sel = null; b.reveal = null; } });
}
/* "No closer view of this has been built yet": said in the panel, on the card of what the thing is made of when there is one, else on
   the thing's own card; with nothing selected, on the place. A toast says it too (the panel may be minimised). */
/* a thing that has no parts to show (a particle of the Standard Model): say so on its card, in the scene's own words */
function showNoParts(text) {
  toast(text.split('. ')[0] + '.');
  infoEl.querySelectorAll('.nobuilt').forEach(e => e.remove());
  const d = document.createElement('div'); d.className = 'nobuilt noparts'; d.textContent = text; const hd = infoEl.querySelector('.cardhead'); if (hd) hd.insertAdjacentElement('beforebegin', d); else $('#placeNote').textContent = text;
  $('#panelBody').scrollTop = 0;
}
/* one line on top of the open card that says what a step inward has just shown (js/body_core.js, layerStep) */
function showStepNote(text) {
  infoEl.querySelectorAll('.nobuilt').forEach(e => e.remove());
  const hd = infoEl.querySelector('.cardhead'); if (!hd) { toast(text); return; }
  const d = document.createElement('div'); d.className = 'nobuilt stepnote'; d.textContent = text; hd.insertAdjacentElement('beforebegin', d);
  if (PANEL.min) toast(text);   // the panel is folded away: say it where it can be seen
}
const NOT_BUILT = 'No closer view of this has been built yet';
/* reason: the sentence to show (the descent module gives its own; the default is NOT_BUILT). card: the node whose card goes with it (default: what the thing is made of, when that has a card). */
function showNotBuilt(h, reason, card) {
  const say = reason || NOT_BUILT + '.';
  toast(say);
  const pn = $('#placeNote'); if (pn) pn.textContent = '';
  if (!h) { if (pn) pn.textContent = reason || NOT_BUILT + '. This is as far in as the model of this place goes.'; $('#panelBody').scrollTop = 0; return; }
  const ud = h.obj.userData, n = typeof NODE !== 'undefined' && NODE[ud.node || h.id];
  const made = card !== undefined ? (card && typeof NODE !== 'undefined' && NODE[card] ? card : null) : n && (n.made_of || []).find(i => NODE[i] && i !== n.id);
  const title = (infoState && infoEl.querySelector('h2') ? infoEl.querySelector('h2').textContent : '') || (n && n.title) || 'this';
  let txt = say;
  if (made && !(infoState && infoState.node === made)) { showBodyNode(made, null); txt = `${say} ${title} is as far in as the model goes here; this card is about what it is made of.`; }
  infoEl.querySelectorAll('.nobuilt').forEach(e => e.remove());
  const d = document.createElement('div'); d.className = 'nobuilt'; d.textContent = txt; const hd = infoEl.querySelector('.cardhead'); if (hd) hd.insertAdjacentElement('beforebegin', d); else infoEl.prepend(d);
  $('#panelBody').scrollTop = 0;
}
function closePops() { ['#library', '#tourPop', '#tracks'].forEach(s => { const e = $(s); if (e) e.classList.remove('open'); }); document.body.classList.remove('trackOpen'); }
function scienceSection(simIds) {
  const nodes = []; simIds.forEach(s => (KN_BY_SIM[s] || []).forEach(n => { if (!nodes.includes(n)) nodes.push(n); }));
  if (!nodes.length) return '';
  return `<div class="refs"><div class="rh">The science behind this, and how certain it is</div>${nodes.slice(0, 8).map(n => `<button class="kn" data-k="${n.id}">${certBadge(n.certainty)} ${n.title}</button>`).join('')}</div>`;
}
function wireKn() { infoEl.querySelectorAll('.kn').forEach(b => b.onclick = () => showNode(b.dataset.k)); }
// links shared by every card: topics (.nd), knowledge-map topics (.kn), processes (.pr), back
function wireCardLinks() {
  wireKn();
  infoEl.querySelectorAll('.nd').forEach(b => b.onclick = () => (TEAR[b.dataset.n] ? goToNode(b.dataset.n) : focusNode(b.dataset.n)));
  infoEl.querySelectorAll('.pr').forEach(b => b.onclick = () => startProcess(b.dataset.p));
}
/* the card for an object that has an id but no card data: say so, never stay silent */
const NO_CARD = new Set();
function humanId(id) { return String(id || '').replace(/^(el|mol|model|node)_/, '').replace(/[_:]+/g, ' ').replace(/^./, c => c.toUpperCase()); }
function cardDataFor(h) {
  const ud = h.obj.userData, id = h.id;
  return (ud.infoFn && ud.infoFn(h)) || ud.info || (id && INFO[id]) || null;
}
function hasCard(obj, id) {
  const ud = obj.userData || {};
  return !!(ud.infoFn || ud.info || (ud.node && typeof NODE !== 'undefined' && NODE[ud.node]) || (id && (INFO[id] || (typeof NODE !== 'undefined' && NODE[id]))));
}
// info for a picked object
function showInfoFor(h) {
  const ud = h.obj.userData;
  if (ud.node && typeof NODE !== 'undefined' && NODE[ud.node]) { showBodyNode(ud.node, h); return; }
  const id = h.id;
  let d = cardDataFor(h);
  if (!d && id && typeof NODE !== 'undefined' && NODE[id]) { showBodyNode(id, h); return; }
  if (!d) {
    const nm = ud.title || h.obj.name || humanId(id) || 'This object';
    if (!NO_CARD.has(id || nm)) { NO_CARD.add(id || nm); console.warn('No card for pickable id', id, 'in frame', h.frame && h.frame.name); }
    d = { title: nm, tag: '', body: '<p>No description has been written for this yet.</p>' };
  }
  infoState = { h };
  const dp = DEEP[id] || d.deep || {};
  const simIds = [SIM_OF[id] || id].concat(ud.sim || []);
  const spec = {
    tag: d.tag || '', title: d.title, basics: (d.body || '') + (d.fun ? `<div class="fun"><b>Did you know?</b>${d.fun}</div>` : ''), deeper: dp.d, expert: dp.x, facts: d.facts, note: d.note, sci: true,
    look: !h.noZoom, buttons: (ud.madeOf ? `<button class="zoom alt" id="madeBtn">See what it is made of</button>` : '') + (h.elSym ? `<button class="zoom" id="atomBtn">Fly to ${(ELJ[h.elSym] || {}).name || h.elSym} atoms</button>` : ''),
    books: dp.r && dp.r.length ? dp.r.map(refChip).join('') : '',
  };
  openPanel(cardHtml(spec), { key: 'info:' + (id || d.title), reopen: () => showInfoFor(h) });
  wireLookBtns(h);
  const mb = $('#madeBtn'); if (mb) mb.onclick = () => { closeInfo(); diveMaterial(h); };
  const ab = $('#atomBtn'); if (ab) ab.onclick = () => flyToElement(h.elSym);
  loadKnowledge().then(() => { const s = $('#sci'); if (s && infoState && infoState.h === h) { s.outerHTML = scienceSection(simIds) || ''; wireKn(); } });
  if (id) markSeen(id);
}
function showNode(id) {
  const n = KN_BY_ID[id]; if (!n) return;
  let basics = `<p>${n.basics || ''}</p>`;
  if (n.regime) basics += `<div class="regime"><b>Where it applies:</b> ${n.regime}</div>`;
  if (n.evidence && n.evidence.length) basics += `<div class="rh" style="margin-top:10px">Evidence</div><ul class="ev">${n.evidence.map(e => `<li>${e}</li>`).join('')}</ul>`;
  const dom = (n.domain || '').replace(/_/g, ' ');
  const link = ids => chipsHtml((ids || []).filter(i => KN_BY_ID[i]).map(i => `<button class="kn chip" data-k="${i}">${KN_BY_ID[i].title}</button>`));
  const fr = (n.frontier || []).map(f => `<li><b>${f.status || 'open'}</b> ${f.text}${f.as_of ? ` <i>(${f.as_of})</i>` : ''}</li>`).join('');
  const fr2 = (n.frontier_ref || []).map(k => FRONT[k]).filter(Boolean).map(f => `<li>${certBadge(f.certainty)} <b>${f.topic}</b>: ${f.claim} <i>(as of ${f.as_of})</i>${f.note ? ` ${f.note}` : ''} ${(f.sources || []).slice(0, 2).map(s => `<a href="${s.url}" target="_blank" rel="noopener">source ↗</a>`).join(' ')}</li>`).join('');
  const spec = {
    tag: `${dom ? dom[0].toUpperCase() + dom.slice(1) : 'Topic'}${n.scale_m ? `, from ${fmtLen(n.scale_m[0])} to ${fmtLen(n.scale_m[1])}` : ''}`, title: n.title,
    figure: '<div class="vzh" id="vizHost"></div>', basics, deeper: n.deeper, expert: n.expert,
    madeLabel: 'What it emerges from', made: link(n.emerges_from), howLabel: 'What it explains', how: link(n.explains),
    books: n.refs && n.refs.length ? n.refs.slice(0, 6).map(r => bookRef(r[0], r[1])).join('') : '',
    open: fr || fr2 ? `<ul class="ev">${fr}${fr2}</ul>` : '', cert: n.certainty,
  };
  infoState = { kn: id };
  openPanel(cardHtml(spec), { key: 'kn:' + id, reopen: () => showNode(id) }); if (window.mountViz) mountViz($('#vizHost'), id);
}
const seen = new Set(store.get('seen', []));
function markSeen(id) { if (!seen.has(id)) { seen.add(id); store.set('seen', [...seen]); } if (typeof trackProgress === 'function') trackProgress(); }

/* ================= LIBRARY (all indexed books + knowledge graph) ================= */
const termShards = {};
function libSearch(q) {
  const box = $('#libRes'); q = foldText((q || '').trim());
  if (!q) {
    let h = '';
    if (KN && KN.length) {
      const levels = {}; KN.forEach(n => (levels[n.level] = levels[n.level] || []).push(n));
      h += `<div class="jl">Knowledge map · ${KN.length} topics</div>` + Object.keys(levels).sort((a, b) => (a === 'X') - (b === 'X') || +a - +b).map(l => `<details><summary>${levelName(l)} (${levels[l].length})</summary>${levels[l].map(n => `<button class="kn chip" data-k="${n.id}">${n.title}</button>`).join('')}</details>`).join('');
    }
    if (LANDMARKS.length) h += `<div class="jl">Places on the scale</div><details><summary>${LANDMARKS.length} places, from a proton to the observable universe</summary>${LANDMARKS.slice().sort((a, b) => a.D - b.D).map(L => `<button class="kn chip" data-lm="${LANDMARKS.indexOf(L)}">${L.label}</button>`).join('')}</details>`;
    if (BOOKS && BOOKS.length) h += `<div class="jl">${BOOKS.length} textbooks</div>` + BOOKS.map(b => `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${b.ch[0][2][0][2]}" target="_blank" rel="noopener"><b>${b.t}</b> ${b.subject || ''}</a>`).join('');
    box.innerHTML = h || '<div class="sub">Loading…</div>'; wireLib(); return;
  }
  let h = '';
  const goHits = searchGoHits(q);
  if (goHits.length) h += '<div class="jl">Take me there</div>' + goHits.map((r, i) => `<button class="kn gohit" data-g="${i}"><b>${r.title}</b><span>${r.sub || ''}</span></button>`).join('');
  libGo = goHits;
  if (KN) { const wre = q.length > 2 ? new RegExp('\\b' + q.replace(/[^a-z0-9 ]/g, '') + '\\b') : null, ti = KN.filter(n => foldText(n.title).includes(q)).map((n, i) => [matchRank(n.title, q), i, n]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]), ks = ti.concat(wre && ti.length < 4 ? KN.filter(n => !ti.includes(n) && wre.test(foldText(n.basics || ''))) : []).slice(0, 8); if (ks.length) h += '<div class="jl">Knowledge map</div>' + ks.map(n => `<button class="kn simhit" data-k="${n.id}"><b>${n.title}</b><span>${n.certainty} · ${levelName(n.level)}</span></button>`).join(''); }
  const L = /[a-z]/.test(q[0]) ? q[0] : '0';
  const sh = termShards[L];
  if (!sh) { termShards[L] = 'loading'; fetch(`data/library/terms_${L}.json`).then(r => r.json()).then(j => { termShards[L] = j; libSearch(''); }).catch(() => { termShards[L] = []; }); h += '<div class="sub">Searching the textbooks…</div>'; }
  else if (sh !== 'loading' && BOOKS) {
    const terms = sh.filter(t => t[0].toLowerCase().startsWith(q)).concat(sh.filter(t => !t[0].toLowerCase().startsWith(q) && t[0].toLowerCase().includes(q))).slice(0, 30);
    if (terms.length) h += '<div class="jl">Key terms</div>' + terms.map(t => `<div class="term"><div class="tt">${t[0]}</div>${t[1].slice(0, 8).map(r => { const b = BOOKS[r[0]]; return b ? `<a class="mini" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${r[2]}" target="_blank" rel="noopener">${b.t} ${r[1]}</a>` : ''; }).join('')}</div>`).join('');
  }
  if (BOOKS) { const secs = []; for (const b of BOOKS) for (const c of b.ch) for (const s of c[2]) if (s[0] && s[1].toLowerCase().includes(q)) { secs.push([b, s]); if (secs.length >= 12) break; } if (secs.length) h += '<div class="jl">Sections</div>' + secs.map(([b, s]) => `<a class="ref" href="${b.base || ('https://openstax.org/books/' + b.s + '/pages/')}${s[2]}" target="_blank" rel="noopener"><b>${b.t} ${s[0]}</b> ${s[1]}</a>`).join(''); }
  if (!h) { h = noMatchHtml(q); }
  box.innerHTML = h; wireLib();
}
/* Nothing matched: say so, and offer the nearest topics: the longer words of the query searched one by one, then a few places to start. */
const STOPWORDS = new Set('a an the of is are was were why how what when where who which does do did can could would should work works about and or to in on for with it its this that from into like make made'.split(' '));
function noMatchHtml(q) {
  const words = q.split(/[^a-z0-9α-ω]+/).filter(w => w.length > 2 && !STOPWORDS.has(w)), sug = [], seenT = new Set();
  words.forEach(w => { const gh = searchGoHits(w).slice(0, 3); gh.forEach(r => { if (!seenT.has(r.title)) { seenT.add(r.title); sug.push({ r }); } });
    if (KN) KN.filter(n => n.title.toLowerCase().includes(w)).slice(0, 2).forEach(n => { if (!seenT.has(n.title)) { seenT.add(n.title); sug.push({ k: n }); } }); });
  libGo = sug.filter(x => x.r).map(x => x.r); let gi = 0;
  const btns = sug.slice(0, 8).map(x => x.r ? `<button class="kn gohit" data-g="${gi++}"><b>${x.r.title}</b><span>${x.r.sub || ''}</span></button>` : `<button class="kn simhit" data-k="${x.k.id}"><b>${x.k.title}</b><span>${x.k.certainty} · ${levelName(x.k.level)}</span></button>`).join('');
  if (btns) return `<div class="sub">Nothing is called "${q.replace(/[<>&]/g, '')}". The closest topics to the words in it:</div>${btns}`;
  const start = ['Heart', 'DNA', 'Gold', 'Saturn', 'The Sun', 'Proton', 'Caffeine', 'Black hole'].map(t => `<button class="chip" data-q="${t}">${t}</button>`).join('');
  return `<div class="sub">Nothing is called "${q.replace(/[<>&]/g, '')}". Search works on names (a body part, an element or its symbol, a molecule, a planet, a place on the scale), so try one word, for example:</div><div class="chips">${start}</div>`;
}
function wireLib() { $('#libRes').querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { const L = LANDMARKS[+b.dataset.lm]; if (L) { cancelTour(); closePops(); L.go(); canvas.focus(); } }); $('#libRes').querySelectorAll('.chip[data-q]').forEach(b => b.onclick = () => { libSearch(b.dataset.q); }); $('#libRes').querySelectorAll('.kn').forEach(b => b.onclick = () => b.dataset.lm !== undefined ? 0 : b.dataset.g !== undefined ? libPick(+b.dataset.g) : (closePops(), showNode(b.dataset.k))); }
let libGo = [];
function libPick(i) { const r = libGo[i]; if (!r) return; cancelTour(); closePops(); r.go(); canvas.focus(); }
/* Search sources. Anything that can be found by name registers here. A source is one of:
     1. a function:  q => [{ title, sub, go, rank?, prio? }]            q is the lower-case query (at least one character)
     2. an object with search:  { id, label, search(q) => [result] }     (js/particles.js)
     3. an object with items:   { id, title, items() => [{ id, title, sub, go? }] }   (js/atom.js); items() is called once and the
        list is filtered by title and sub. An item without go whose id is a node id (NODE[id]) opens that node with goToNode;
        an item with neither is ignored (it cannot take you anywhere).
   A result needs a title; go() takes the user somewhere (a flight, or a card). rank (lower is better) defaults from the title:
   0 exact, 1 starts with the query, 2 a word in it starts with the query, 3 contains it; anything else is not a match.
   prio orders results of the same kind of match: 0 places you can fly to (landmarks, planets, park objects), 1 topics, elements,
   molecules, 2 the rest. Results that go somewhere are listed first; textbook terms and sections follow.
   A source that throws is reported once on the console, never per keystroke; a malformed source is reported once and skipped. */
const SEARCH_SOURCES = [];
const _srcState = new WeakMap(); // per source: {fn, warned, cache}
const foldText = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Schrödinger matches schrodinger
const LEVEL_NAMES = { 0: 'Mathematics', 1: 'Classical, quantum and thermal physics', 2: 'Nuclei', 3: 'Atoms', 4: 'Chemistry', 5: 'Materials and the molecules of life', 6: 'Cells', 7: 'Bodies, machines and technology', 8: 'Life on Earth and its history', 9: 'Planets, climate and weather', 10: 'Stars and gravity', 11: 'The whole universe', X: 'Ideas that cut across scales' };
const levelName = l => LEVEL_NAMES[l] || 'Level ' + l;
function matchRank(title, q) {
  const t = foldText(title); if (t === q) return 0; if (t.startsWith(q)) return 1;
  if (t.split(/[^a-z0-9α-ω]+/).some(w => w.startsWith(q))) return 2; return t.includes(q) ? 3 : 9;
}
function searchSourceFn(src) {
  if (!src || (typeof src !== 'object' && typeof src !== 'function')) return null;
  let st = _srcState.get(src); if (!st) { st = { warned: false }; _srcState.set(src, st); }
  const bad = why => { if (!st.warned) { st.warned = true; console.warn('search source ignored:', why, src && (src.id || src.label || src.title)); } return null; };
  if (typeof src === 'function') return src;
  if (!src || typeof src !== 'object') return bad('not a function or an object');
  if (typeof src.search === 'function') return q => src.search(q);
  if (typeof src.items === 'function') return q => {
    if (!st.cache) st.cache = (src.items() || []).map(it => ({ it, t: String(it.title || '').toLowerCase(), u: String(it.sub || '').toLowerCase() }));
    return st.cache.filter(x => x.t.includes(q) || x.u.includes(q)).map(x => {
      const it = x.it, go = it.go || (typeof NODE !== 'undefined' && NODE[it.id] ? () => goToNode(it.id) : null); if (!go) return null;
      return { title: it.title, sub: it.sub, go, rank: it.rank };
    }).filter(Boolean);
  };
  return bad('needs a function, a search(q) method or an items() method');
}
function searchGoHits(q) {
  const out = [];
  SEARCH_SOURCES.forEach(src => {
    const fn = searchSourceFn(src); if (!fn) return;
    try { (fn(q) || []).forEach(r => { if (!r || !r.title || typeof r.go !== 'function') return; if (r.rank === undefined) r.rank = matchRank(r.title, q); if (r.rank < 9) out.push(Object.assign({ prio: 1 }, r)); }); }
    catch (e) { const st = _srcState.get(src); if (st && !st.warned) { st.warned = true; console.warn('search source failed:', e && e.message, src && (src.id || src.label || src.title)); } }
  });
  const bucket = r => r.rank <= 0 ? 0 : r.rank <= 2 ? 1 : 2; // exact, then prefix or word start, then contains
  const seenT = new Set(), uniq = [];
  out.map((r, i) => [r, i]).sort((a, b) => bucket(a[0]) - bucket(b[0]) || a[0].prio - b[0].prio || a[0].rank - b[0].rank || a[1] - b[1]).forEach(([r]) => { const k = r.title.toLowerCase() + '|' + (r.prio === 0 ? 'f' : ''); if (!seenT.has(k)) { seenT.add(k); uniq.push(r); } });
  return uniq.slice(0, 14);
}
SEARCH_SOURCES.push(q => LANDMARKS.filter(L => L.label.toLowerCase().includes(q)).map(L => ({ title: L.label, sub: `Fly there: about ${fmtLen(L.D)} across`, prio: 0, go: () => L.go() })));
SEARCH_SOURCES.push(q => {
  if (typeof ELJ === 'undefined') return [];
  return Object.values(ELJ).filter(e => e.symbol.toLowerCase() === q || e.name.toLowerCase().includes(q)).map(e => ({ title: `${e.name} (${e.symbol})`, sub: `Element ${e.Z}: its card, and a way to fly to its atoms`, rank: e.symbol.toLowerCase() === q ? 0 : matchRank(e.name, q), go: () => showElement(e.symbol) })); // a symbol typed exactly ("Fe") puts that element first
});
let MOL_INDEX = null;
SEARCH_SOURCES.push(q => {
  if (!MOL_INDEX) { if (MOL_INDEX !== 0 && typeof getJSON === 'function') { MOL_INDEX = 0; getJSON('data/molecules_all.json').then(A => { MOL_INDEX = A.index; libSearch(''); }).catch(() => { MOL_INDEX = []; }); } return []; }
  return MOL_INDEX.filter(m => m.name.toLowerCase().includes(q) || m.formula.toLowerCase() === q).map(m => ({ title: m.name, sub: `Molecule, ${m.formula}: fly to it at true size`, rank: m.formula.toLowerCase() === q ? 0 : undefined, go: () => placeGo('mol:' + m.id) }));
});
let CRY_INDEX = null; // crystals by name (and everyday names: salt, sand, rust ...)
const CRY_ALIAS = { halite: 'table salt sodium chloride rock salt', diamond: 'carbon gem', graphite: 'pencil lead carbon', gold_fcc: 'gold', copper_fcc: 'copper', aluminium_fcc: 'aluminum aluminium foil', iron_bcc: 'iron steel', quartz: 'sand silica glass', calcite: 'limestone chalk marble', ice_ih: 'ice snow water frozen', silicon: 'chip semiconductor', hematite: 'rust iron ore', magnetite: 'lodestone', pyrite: 'fool\'s gold', rutile: 'titanium dioxide', fluorite: 'fluorspar calcium fluoride', forsterite: 'olivine peridot' };
SEARCH_SOURCES.push(q => {
  if (q.length < 3) return [];
  if (!CRY_INDEX) { if (CRY_INDEX !== 0 && typeof getJSON === 'function') { CRY_INDEX = 0; getJSON('data/crystals.json').then(A => { CRY_INDEX = A; libSearch(''); }).catch(() => { CRY_INDEX = []; }); } return []; }
  return CRY_INDEX.filter(c => (c.name + ' ' + c.formula + ' ' + c.id + ' ' + (CRY_ALIAS[c.id] || '')).toLowerCase().includes(q)).map(c => ({ title: c.name, sub: 'Crystal lattice', prio: 0, go: () => { FR.park.ensure(); placeChild(FR.park, crystalFrame(c.id, new V3(1.2, .01, 1.4)), 4e-9); } }));
});
SEARCH_SOURCES.push(q => typeof NODE === 'undefined' ? [] : Object.values(NODE).filter(n => n.title.toLowerCase().includes(q)).map(n => ({ title: n.title, sub: `${(n.kind || '').replace(/_/g, ' ')}${n.summary ? ': ' + n.summary : ''}`.slice(0, 110), go: () => goToNode(n.id) })));
/* The Sun, the planets, the Moon and the things in the park: places you can fly to. Built when first searched, from the frames in FR. */
let _bodyPlaces = null;
function bodyPlaces() {
  if (_bodyPlaces || !FR.solar || !FR.park) return _bodyPlaces || [];
  const P = [], fmt = (D) => `Fly there: about ${fmtLen(D)} across`;
  const planet = (name, key) => { const f = FR[key]; if (!f) return; P.push({ title: name, sub: `Planet. ${fmt(1)}`.replace(/Fly there.*/, 'Planet: fly there'), go: () => { f.ensure(); const o = f.pickables.find(x => x.userData && x.userData.id && x.userData.id.toLowerCase() === name.toLowerCase()), r = (o && objRadiusLocal(o)) || f.radius * .01; flyTo(f, new V3(), r * f.unit * 4.5); } }); };
  ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].forEach(n => planet(n, n));
  P.push({ title: 'The Sun', sub: 'Our star: fly there', alias: 'sun', go: () => flyTo(FR.sun || FR.solar, new V3(), 4e9) });
  // (the Moon is put in its place by the Earth frame's update, which runs only while that frame is drawn: from the park its position was still the origin, and the flight ended at the Earth with no Moon in sight)
  P.push({ title: 'The Moon', sub: 'Earth\'s moon: fly there', alias: 'moon', go: () => { const E = FR.earth; chainOf(E).reverse().forEach(f => { f.ensure(); if (f.place) f.place(); }); if (E.update) E.update(0, clock, E); const m = E.moon || E.pickables.find(x => x.userData && x.userData.id === 'moon'); if (m && m.position.lengthSq() > 0) flyTo(E, m.position.clone(), 1.2e7); else flyTo(E, new V3(), 1.4e9); } });
  P.push({ title: 'International Space Station', sub: 'Fly there', alias: 'iss', go: () => { FR.earth.ensure(); const m = FR.earth.pickables.find(x => x.userData && x.userData.id === 'iss'); if (m) flyTo(FR.earth, m.position.clone(), 2e3); } });
  const park = { dog: 'Dog', tree: 'Tree', pond: 'Pond', flower: 'Flowers', bee: 'Honeybee', mushroom: 'Mushroom', bird: 'Bird', cloud: 'Cloud' };
  const thingName = { dog: 'Dog', tree: 'English oak', flower: 'Meadow buttercup', bee: 'Honey bee worker', mushroom: 'Fly agaric' }; // the park's animals and plants are `thing` frames (js/things.js)
  for (const id in park) P.push({ title: (INFO[id] && INFO[id].title) || park[id], sub: 'In Greenwich Park: fly there', go: () => { FR.park.ensure();
    const tf = thingName[id] && FR.park.children.find(c => c.type === 'thing' && c.name === thingName[id]); if (tf) { flyTo(FR.park, tf.pos.clone().add(new V3(0, tf.radius * .45, 0)), Math.max(tf.radius * tf.unit * 3.5, .05)); return; } const o = FR.park.pickables.find(x => x.userData && x.userData.id === id); if (!o) { placeGo('place:park'); return; } const p = parkPointOf(id, new V3(0, 1, 0)), r = objRadiusLocal(o) || 1; flyTo(FR.park, p, Math.max(Math.min(r * 3.5, 30), 1.2)); } });
  P.push({ title: 'Air', sub: 'In Greenwich Park: what the air is made of', go: () => placeGo('place:air') }, { title: 'Soil and rock', sub: 'In Greenwich Park: down into the soil', alias: 'soil ground', go: () => placeGo('place:soil') });
  return _bodyPlaces = P;
}
SEARCH_SOURCES.push(q => bodyPlaces().filter(b => b.title.toLowerCase().includes(q) || (b.alias && b.alias.split(' ').some(a => a.startsWith(q)))).map(b => ({ title: b.title, sub: b.sub, go: b.go, prio: 0, rank: b.alias && b.alias.split(' ').some(a => a === q) ? 0 : undefined })));
function showElement(sym) {
  const dummy = new THREE.Object3D(); dummy.userData.id = 'el_' + sym; dummy.userData.info = INFO['el_' + sym] || elInfo(sym);
  showInfoFor({ id: 'el_' + sym, obj: dummy, frame: cam.A, pointLocal: cam.T.clone(), noZoom: true, elSym: sym });
}
function flyToElement(sym) {
  if (typeof atomFrame !== 'function' || !FR.park) { message('The atom view is not available.'); return; }
  closeInfo(); FR.park.ensure(); placeChild(FR.park, atomFrame(sym, new V3(1.2, .5, 1.4)), 7e-10);
}
function openLibrary(force) { const p = $('#library'); const o = force || !p.classList.contains('open'); if (!force || !p.classList.contains('open')) closePops(); if (!o) return; p.classList.add('open'); loadKnowledge().then(() => libSearch('')); libSearch(''); }

/* ================= SCALE RULER ================= */
const RULER_MIN = -19, RULER_MAX = 27;
let LANDMARKS = []; // filled by world: {label, D, go()}
function rulerY(e, h) { return (1 - (e - RULER_MIN) / (RULER_MAX - RULER_MIN)) * h; }
/* push names down so none overlap; if the last runs off the bottom, pin it there and push the ones above it up; with more names than room, close the spacing up.
   Under the new look it is run again over the names that are shown, so that a hidden name leaves no gap (updateRuler). */
function rulerLayout(items, h) {
  const n = items.length, gap = Math.min(15, n > 1 ? (h - 12) / (n - 1) : 15);
  if (n) items[0].p = Math.max(items[0].y, 6);
  for (let k = 1; k < n; k++) items[k].p = Math.max(items[k].y, items[k - 1].p + gap);
  if (n && items[n - 1].p > h - 6) { items[n - 1].p = h - 6; for (let k = n - 2; k >= 0; k--) items[k].p = Math.min(items[k].p, items[k + 1].p - gap); }
}
function buildRuler() {
  const box = $('#rulerScale'); if (!box) return; const h = box.clientHeight || 600; box.innerHTML = '';
  let svg = `<svg viewBox="0 0 ${box.clientWidth || 184} ${h}" preserveAspectRatio="none">`;
  for (let e = RULER_MIN; e <= RULER_MAX; e++) {
    const y = rulerY(e, h), major = e % 3 === 0;
    svg += `<line class="tk" x1="0" x2="${major ? 14 : 9}" y1="${y}" y2="${y}"/>`;
    if (e < RULER_MAX) for (let k = 2; k <= 9; k++) { const yy = rulerY(e + Math.log10(k), h); svg += `<line class="tk mi" x1="0" x2="${k === 5 ? 6 : 4}" y1="${yy}" y2="${yy}"/>`; }
    if (major) svg += `<text class="ex" x="18" y="${y + 3.5}">10${sup(e)}</text>`;
  }
  // landmarks: place names at their true heights, nudged apart so none overlap
  const items = LANDMARKS.map(L => ({ L, y: rulerY(Math.log10(L.D), h) })).sort((a, b) => a.y - b.y);
  rulerLayout(items, h);
  items.forEach(it => { svg += `<path class="lead" d="M15 ${it.y} L48 ${it.y} L58 ${it.p}"/>`; });
  svg += '</svg>'; box.insertAdjacentHTML('beforeend', svg);
  { const ld = box.querySelectorAll('path.lead'); items.forEach((it, k) => { it.L._lead = ld[k]; }); }   // the leader line of each name, so the name and its line can be shown and hidden together
  box._items = items; box._h = h; box._sig = null;
  items.forEach(it => { const b = document.createElement('button'); b.className = 'lm'; b.style.top = it.p + 'px'; b.textContent = it.L.label; b.title = `Fly to ${it.L.label} (${fmtLen(it.L.D)} across)`; b.onclick = () => { cancelTour(); it.L.go(); }; it.L._el = b; box.appendChild(b); });
  const m = document.createElement('i'); m.id = 'rulerMark'; m.innerHTML = '<span class="ro" id="rulerRO"></span>'; box.appendChild(m);
  // on a phone the strip has no room for names: tapping it opens a small list of the places on the scale around where you tapped (and says where you are now); tap one to fly there
  if (!box._tap) { box._tap = 1; box.addEventListener('click', e => {
    if (e.target.closest('.lm') || !LANDMARKS.length || getComputedStyle($('#ruler .lm') || box).display !== 'none') return;
    const r = box.getBoundingClientRect(), y = e.clientY - r.top, hh = box.clientHeight || 600;
    openScalePop(y, hh, e.clientY);
  }); }
  if (!buildRuler._ro) { buildRuler._ro = new ResizeObserver(() => buildRuler()); buildRuler._ro.observe(box); }
}
/* The phone's version of the ruler's names: a small list beside the strip, the places on the scale nearest the tap (about seven), with the one you are at in bold. */
function openScalePop(y, hh, clientY) {
  let pop = $('#scalePop'); if (!pop) { pop = document.createElement('div'); pop.id = 'scalePop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Places on the scale'); document.body.appendChild(pop); }
  const e = Math.log10(cam.D * 2 * Math.tan(25 * Math.PI / 180)), path = chainOf(cam.A);
  let here = null, bd = .35; LANDMARKS.forEach(L => { const d = Math.abs(Math.log10(L.D) - e); if (d < bd && lmHere(L, path)) { bd = d; here = L; } });
  const near = LANDMARKS.map(L => ({ L, d: Math.abs(rulerY(Math.log10(L.D), hh) - y) })).sort((a, b) => a.d - b.d).slice(0, 7).sort((a, b) => b.L.D - a.L.D);
  pop.innerHTML = `<div class="sph">You are looking at about ${fmtLen(cam.D * 2 * Math.tan(25 * Math.PI / 180))} across${here ? ` (${here.label})` : ''}. Go to:</div>` + near.map(o => `<button data-i="${LANDMARKS.indexOf(o.L)}" class="${o.L === here ? 'near' : ''}"><b>${o.L.label}</b><span>${fmtLen(o.L.D)}</span></button>`).join('') + '<button class="spx" data-i="-1">Close</button>';
  pop.style.top = clamp(clientY - 120, 8, innerHeight - 330) + 'px'; pop.classList.add('open');
  pop.querySelectorAll('button').forEach(b => b.onclick = ev => { ev.stopPropagation(); const L = LANDMARKS[+b.dataset.i]; pop.classList.remove('open'); if (L) { cancelTour(); toast(`Flying to ${L.label}`); L.go(); } });
  if (!openScalePop._d) { openScalePop._d = 1; document.addEventListener('pointerdown', ev => { const p = $('#scalePop'); if (p && p.classList.contains('open') && !p.contains(ev.target) && !ev.target.closest('#rulerScale')) p.classList.remove('open'); }, true); }
}
/* Is the camera at this landmark? In its frame (or inside it), and, where the landmark is a place within a larger frame (You, in the park), near that place:
   the view is as wide as the landmark, so "near" is within one landmark width. A landmark that names no frame is matched by size alone. */
const _lmV = new V3();
function lmHere(L, path) {
  if (!L.frame) return true; if (!path.includes(L.frame)) return false;
  if (!L.at || L.frame.radius === Infinity || L.frame.radius * L.frame.unit < L.D * 3) return true;
  return convertP(_lmV.copy(cam.T), cam.A, L.frame).distanceTo(L.at) * L.frame.unit < L.D;
}
function updateRuler() {
  const box = $('#rulerScale'), m = $('#rulerMark'); if (!box || !m) return;
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180), e = Math.log10(view), h = box.clientHeight;
  m.style.top = clamp(rulerY(e, h), 0, h) + 'px'; const ro = $('#rulerRO'); const t = fmtLen(view); if (ro.textContent !== t) ro.textContent = t;
  // the name is bold only where the camera really is: a landmark whose frame is not on the camera's path (another cell, a surface you flew past) is not named, the scale tick still shows the size
  const path = chainOf(cam.A); let best = null, bd = .35; LANDMARKS.forEach(L => { const d = Math.abs(Math.log10(L.D) - e); if (d < bd && lmHere(L, path)) { bd = d; best = L; } });
  LANDMARKS.forEach(L => L._el && L._el.classList.toggle('near', L === best));
  /* the new look: a side stop (an organ, the phone) is named only within three decades of where you are, so that about twenty names are on the ruler at a time (docs/DESIGN.md 2.4) */
  if (typeof LOOK !== 'undefined' && LOOK.on && box._items) {
    const items = box._items, near = it => Math.abs(Math.log10(it.L.D) - e) <= 3, show = new Set(items.filter(it => !it.L.side || near(it)));
    /* a name on each side of the needle, always: where nothing is named within a decade and a half on one side, the nearest side stops there are named after all */
    for (const dir of [1, -1]) { const side = items.filter(it => dir * (Math.log10(it.L.D) - e) > 0 && it.L._el); if (side.some(it => show.has(it) && Math.abs(Math.log10(it.L.D) - e) < 1.5)) continue; side.sort((a, b) => Math.abs(Math.log10(a.L.D) - e) - Math.abs(Math.log10(b.L.D) - e)).slice(0, 2).forEach(it => show.add(it)); }
    const sig = items.map(it => show.has(it) ? 1 : 0).join('');
    if (sig !== box._sig) {
      box._sig = sig; const on = items.filter(it => show.has(it)); rulerLayout(on, box._h);
      items.forEach(it => { const far = !show.has(it); it.L._far = far; it.L._el.classList.toggle('lk-far', far); if (it.L._lead) it.L._lead.classList.toggle('lk-far', far); if (!far) { it.L._el.style.top = it.p + 'px'; if (it.L._lead) it.L._lead.setAttribute('d', `M15 ${it.y} L48 ${it.y} L58 ${it.p}`); } });
    }
  }
}

/* ================= TOUR (continuous Powers-of-Ten flight) ================= */
/* A tour walks the spine of landmarks one stop at a time: fly there, pause on it so the caption can be read, go on.
   Escape, the Stop button, or any manual input (wheel, drag, keys, a ruler click) ends it. */
let tour = null;
const TOUR_PAUSE = 2600; // ms to rest at each stop
function tourBar() {
  let el = $('#tourBar');
  if (!el) { el = document.createElement('div'); el.id = 'tourBar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  return el;
}
function cancelTour() { if (!tour) return; tour = null; tourBar().classList.remove('on'); }
function startTour(dirIn) {
  const spine = LANDMARKS.filter(L => !L.side); // side branches (organs, the phone, the black hole) are ruler stops, not tour stops
  const list = dirIn ? spine.sort((a, b) => b.D - a.D) : spine.sort((a, b) => a.D - b.D);
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180);
  const rest = list.filter(L => dirIn ? L.D < view * .9 : L.D > view * 1.1);
  if (!rest.length) { message('Nothing further in that direction.'); return; }
  closeInfo(); closePops();
  tour = { list: rest, i: 0, dirIn };
  nextTour();
}
function nextTour() {
  const T = tour; if (!T) return;
  const L = T.list[T.i++], bar = tourBar();
  if (!L) { cancelTour(); message('End of the tour.'); return; }
  bar.innerHTML = `<span><b>${T.dirIn ? 'Tour in' : 'Tour out'}</b> · stop ${T.i} of ${T.list.length}: ${L.label}</span><button id="tourStop">Stop</button>`;
  bar.classList.add('on'); $('#tourStop').onclick = cancelTour;
  L.go(() => {
    if (tour !== T) return;
    bar.innerHTML = `<span><b>${T.dirIn ? 'Tour in' : 'Tour out'}</b> · stop ${T.i} of ${T.list.length}: <b>${L.label}</b>${T.i < T.list.length ? '' : ' (last stop)'}</span><button id="tourStop">Stop</button>`;
    $('#tourStop').onclick = cancelTour;
    setTimeout(() => { if (tour === T) nextTour(); }, TOUR_PAUSE);
  });
}

/* ================= CAPTION ================= */
let capFrame = null;
/* The name shown for a frame: never a raw id such as bp_GC. */
function humanName(f) {
  let n = f.name || '';
  if (!n || /^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/.test(n)) {
    const k = (f.opts && (f.opts.mol || f.opts.node || f.opts.kind)) || n;
    const t = (f.info && f.info.title) || (typeof NODE !== 'undefined' && NODE[n] && NODE[n].title) || (typeof NODE !== 'undefined' && NODE[k] && NODE[k].title);
    n = t || String(n || k || f.type || 'Scene').replace(/_/g, ' ');
  }
  return n;
}
/* The place card (#place) and the one-line field of view (#fov). The card names the frame the camera is in, with its one-paragraph
   description and the honest note on what is to scale and what is illustrative (F.blurb, F.note; F.timeNote says what moves).
   When a thing is selected the same block shrinks to the place's name and note under the thing's card. */
function updateCaption() {
  let f = active[active.length - 1];
  if (active.includes(cam.A)) f = cam.A; // the place and the path name the frame the camera is in as soon as it is the anchor, not once it has faded in
  else for (let i = active.length - 1; i >= 0; i--) if (active[i].alpha > .6) { f = active[i]; break; }
  const view = cam.D * 2 * Math.tan(25 * Math.PI / 180);
  const nm = humanName(f);
  if (f !== capFrame || $('#capN').textContent !== nm) {
    capFrame = f; updateCrumbs(f);
    $('#capN').textContent = nm;
    $('#capD').textContent = f.blurb || '';
    $('#capNote').textContent = f.note || '';
    $('#placeNote').textContent = '';
    $('#timeSec').hidden = $('#clockBtn').hidden = !!f.device; // the clock means nothing inside a chip
    $('#placeOut').hidden = crumbChain(f).length < 2;
    updateControls(f);
  }
  const tn = f.timeNote || ''; if ($('#capT').textContent !== tn) $('#capT').textContent = tn;
  const k = `Field of view ${fmtLen(view)}`; if ($('#capK').textContent !== k) $('#capK').textContent = k;
  // an empty stretch of a descent (zoomStretch, js/engine.js): say what is happening, so that a picture that does not change is not taken for a hang
  { const zs = !fly && cam.A.built ? zoomStretch(cam.A) : null, g = $('#capG'); let t = '';
    /* it does not name the place it leads to: a waiting scene's name is not final until it is built ("Inside the tissue" became "Inside a dog's skin and
       coat"), and the panel names each place as it is entered */
    if (zs) t = `Nothing new to draw here: the next level is ${fmtTimes(zs.ratio)} further in` + (zs.f ? (W > 860 ? '. Double-click jumps there.' : '. Double-tap jumps there.') : '.');
    if (g && g.textContent !== t) { g.textContent = t; g.hidden = !t; } }
  // a thing you looked inside: when the camera arrives in the new place (or the flight is over), the place takes the panel
  if (selLeave) { const L = selLeave; if (!curCard || curCard.key !== L.key) selLeave = null; else if (chainOf(cam.A).includes(L.frame) || (!fly && performance.now() - L.t > 400)) { const arrived = chainOf(cam.A).includes(L.frame); selLeave = null; closeInfo(); if (arrived && L.note) $('#placeNote').textContent = L.note; } } // L.note: what the descent module said about the level it built (a stand-in, say)
  panelSync(performance.now());
}
/* "1,000 times", "30 million times", "10²⁶ times": how much further in, to one figure */
function fmtTimes(r) {
  const e = Math.floor(Math.log10(r)), m = Math.max(1, Math.round(r / Math.pow(10, e)));
  if (e < 6) return (m * Math.pow(10, e)).toLocaleString('en-US') + ' times';
  if (e < 12) { const w = e < 9 ? 'million' : 'billion', v = m * Math.pow(10, e - (e < 9 ? 6 : 9)); return v.toLocaleString('en-US') + ' ' + w + ' times'; }
  return '10' + sup(e + (m >= 5 ? 1 : 0)) + ' times';
}
/* The ring round a selected thing that has no glow of its own (a star, a marker, one of a crowd). One projection a frame, no picking. */
const _smV = new V3(); let _selMark = null;
function updateSelMark() {
  const h = typeof selHit !== 'undefined' ? selHit : null, f = h && h.frame;
  const show = !!(h && !h.glow && h.selP && f && f.built && f.C && drawn.includes(f));
  if (!_selMark) { if (!show) return; _selMark = document.createElement('i'); _selMark.id = 'selMark'; _selMark.setAttribute('aria-hidden', 'true'); document.body.appendChild(_selMark); }
  let vis = false;
  if (show) { _smV.copy(h.selP).sub(f.C).project(f.cam); vis = _smV.z < 1 && Math.abs(_smV.x) < 1.02 && Math.abs(_smV.y) < 1.02; if (vis) _selMark.style.transform = `translate(${(_smV.x * .5 + .5) * W}px,${(-_smV.y * .5 + .5) * H}px) translate(-50%,-50%)`; }
  if (_selMark._on !== vis) { _selMark._on = vis; _selMark.style.display = vis ? 'block' : 'none'; }
}
function updateTimeUI() {
  const d = new Date(simTime);
  $('#timeT').textContent = `${d.getUTCDate()} ${d.toUTCString().slice(8, 11)} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
}

/* ================= MAIN LOOP ================= */
let lastT = performance.now(), pickSig = 0, lastChange = performance.now(), restedLast = false;
const REST_AFTER_MS = 1500, REST_FRAME_MS = 31; // nothing has moved for 1.5 s: about 30 frames a second until something does
function coversCanvas() { const l = document.getElementById('lab'); return !!(l && l.classList.contains('open')); } // a lab is a full-screen, opaque overlay
document.addEventListener('visibilitychange', () => { lastT = performance.now(); });
function loop(now) {
  requestAnimationFrame(loop);
  /* Nothing to show (the tab is hidden, or a lab covers the canvas): do nothing. Nothing moving (no input, flight, zoom, tour, fade or
     fast clock for a while): skip every other frame, so ambient motion runs at about 30 frames a second. Any input sets lastInput, and
     the very next frame is drawn in full, so the resting rate never delays a response. The meter (Shift+P) switches resting off. */
  if (document.hidden || coversCanvas()) { lastT = now; PERF.hidden = true; return; }
  PERF.hidden = false;
  const tA = performance.now(), busy = !!fly || zoom.pending !== 0 || pointers.size > 0 || !!holdZoom || !!tour || Math.abs(timeSpeed) > 1;
  if (busy) lastChange = tA;
  PERF.idle = PERF.flags.idle && !PERF.shown && tA - Math.max(lastChange, lastInput) > REST_AFTER_MS;
  if (PERF.idle && now - lastT < REST_FRAME_MS) return;
  const dtMs = now - lastT, pk0 = PERF.acc.pick;
  if (!PERF.idle && !restedLast) rsFeed(dtMs); restedLast = PERF.idle; // the render scale follows the frame time (engine.js, RENDER SCALE)
  const dt = Math.min(.05, dtMs / 1000); lastT = now; clock += dt;
  simTime += dt * 1000 * timeSpeed;
  if (holdZoom) { holdT += dt; zoomBy(holdZoom * dt * Math.min(6, 2.2 + holdT * 2.4), holdZoom < 0 ? W / 2 : undefined, H / 2); } else holdT = 0; // a held + or - starts gently and speeds up
  if (fly) stepFly(dt);
  applyZoom(dt);
  if (!pointers.size && !fly) levelUp(dt);
  orthoUp();
  reanchor();
  computeActive();
  for (const f of drawn) { f.ensure(); if (f.place) f.place(); }
  for (let f = cam.A; f; f = f.parent) if (f.place && !drawn.includes(f)) f.place(); // an ancestor that is not drawn (the park hides the Earth) still moves with the clock: the Sun's direction in the park comes from it
  mergeStep();
  updateViewOffset();
  for (const f of drawn) {
    placeFrameCam(f); applyFade(f); frameCull(f); if (f._merged) mergePlace(f); if (f._faded) lastChange = tA;
    if (!f.update) continue;
    if (!f._culled) { f._skipDt = 0; f.update(dt, clock, f); }
    else { f._skipDt = (f._skipDt || 0) + dt; if (((PERF.frame + (f._phase ?? (f._phase = drawn.indexOf(f)))) & 7) === 0) { f.update(Math.min(f._skipDt, .25), clock, f); f._skipDt = 0; } } // out of view: every eighth frame is enough
  }
  if (LOOK.on) LOOK.step(now);   // the realistic look: environments follow their Suns, rigs for late lights (js/look.js)
  compileStep();
  const tB = performance.now(); PERF.add('update', tB - tA - (PERF.acc.pick - pk0)); // picks made on the way (the zoom buttons' pivot) are counted as picking
  renderer.info.reset(); PERF.gpuBegin();
  renderAll(dt);
  PERF.gpuEnd();
  const tC = performance.now(); PERF.add('render', tC - tB);
  updateLabels(); updateCaption(); updateRuler(); updateSelMark();
  /* Hover. What can be picked changes when frames arrive, load their parts or fade in: that counts as a change of the view.
     The pick itself waits until the pointer has rested and the camera is still; while either moves, the tooltip is hidden. */
  let sig = drawn.length; for (const f of drawn) sig = (sig * 31 + (f.pickables ? f.pickables.length : 0) * 2 + (f.alpha >= .5 ? 1 : 0)) | 0;
  if (sig !== pickSig) { pickSig = sig; viewChanged(); lastChange = tA; }
  const camMoving = !!fly || Math.abs(zoom.pending) > 2e-3 || pointers.size > 0 || !!holdZoom; // the last 0.2% of a zoom ease no longer moves anything under the pointer
  // (a flight moves the view under the pointer as a zoom does: the tooltip of where it was goes, and the hover is worked out again once the camera is still)
  if (camMoving || tour) { if (tipEl.classList.contains('show')) tipEl.classList.remove('show'); mouse.dirty = true; }
  else if (mouse.dirty && performance.now() - mouse.t >= HOVER_REST_MS) doHover();
  if (!camMoving) pkIdle(clamp(dtMs * .1, 4, 12), performance.now() - lastInput > 1500); // trees for picking, a few milliseconds at a time (a tenth of the frame when frames are slow), never while the camera moves
  if ((clock * 4 | 0) !== ((clock - dt) * 4 | 0)) updateTimeUI();
  const pe = $('#push'); if (now - msg.t < 2600 && msg.text) { $('#pushT').textContent = msg.text; pe.classList.add('show'); } else pe.classList.remove('show');
  PERF.endFrame(dtMs, performance.now() - tA); PERF.tick(now);
}
async function startApp() {
  if (LOOK.on) LOOK.wire();
  ROOT = await buildWorld();
  setupBloom(); resize();
  buildRuler();
  bindHold($('#zin'), -1); bindHold($('#zout'), 1);
  $('#bLibrary').onclick = e => { e.stopPropagation(); openLibrary(); };
  $('#bTracks').onclick = e => { e.stopPropagation(); openTracks(); };
  $('#libSearchBtn').onclick = () => { closePops(); if (typeof SEARCH !== 'undefined' && SEARCH.focus) SEARCH.focus(); };
  document.querySelectorAll('.pop .px').forEach(b => b.onclick = () => closePops());
  $('#navBack').onclick = navBack;
  // the panel: minimise, the tab, the hint, the clock, the place's two buttons
  panelApply(); wireGrab();
  $('#panelMin').onclick = panelMinimise; $('#panelTabB').onclick = () => panelShow('tab');
  $('#panelHintX').onclick = panelHintDone;
  if (matchMedia('(pointer: coarse)').matches) $('#panelHint').firstChild.textContent = 'Tap a thing to read about it here. Double-tap it to look inside.';
  /* On a touch screen every sentence the app shows says tap and double-tap, not click: the place's text, the cards, the step notes, the messages
     ("Click anywhere to see what is under that spot; double-click a part to look inside it" stood under the hint "Double-tap it to look inside").
     Text is written in click words once, here it is turned into touch words as it appears. */
  if (matchMedia('(pointer: coarse)').matches) {
    const TW = { 'double-click': 'double-tap', 'double-clicks': 'double-taps', 'double-clicked': 'double-tapped', 'double-clicking': 'double-tapping', click: 'tap', clicks: 'taps', clicked: 'tapped', clicking: 'tapping' };
    const RE = /\b(double-click(?:s|ed|ing)?|click(?:s|ed|ing)?)\b/gi;
    const fix = t => t.replace(RE, w => { const r = TW[w.toLowerCase()]; return w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r; });
    const walk = root => { const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = it.nextNode())) { const v = n.nodeValue; if (RE.test(v)) { RE.lastIndex = 0; n.nodeValue = fix(v); } RE.lastIndex = 0; }
      if (root.querySelectorAll) root.querySelectorAll('[title]').forEach(e => { if (/click/i.test(e.title)) e.title = fix(e.title); }); };
    const roots = ['#panel', '#panelTab', '#toasts', '#push', '#fov', '#tip', '#help'].map(q => $(q)).filter(Boolean);
    roots.forEach(walk);
    const mo = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') { const n = m.target; if (/click/i.test(n.nodeValue)) n.nodeValue = fix(n.nodeValue); } else m.addedNodes.forEach(n => { if (n.nodeType === 3) { if (/click/i.test(n.nodeValue)) n.nodeValue = fix(n.nodeValue); } else if (n.nodeType === 1) walk(n); }); } });
    roots.forEach(r => mo.observe(r, { childList: true, subtree: true, characterData: true }));
  }
  $('#tabShow').onclick = () => panelShow('trail-show-text'); $('#tabPrev').onclick = () => TRAILS.back(); $('#tabNext').onclick = () => TRAILS.next();
  $('#clockBtn').onclick = () => { panelShow('clock'); const t = $('#timeSec'); t.open = true; t.scrollIntoView({ block: 'nearest' }); };
  $('#placeIn').onclick = () => lookInsidePlace(); $('#placeOut').onclick = goFurtherOut;
  /* A result in search, or a link in a list (the Library, Tracks, the Questions list, the starter questions): the visitor asked for something to read, so a minimised panel opens.
     Nothing else opens it: not a ruler stop, not a tour, not a flight. */
  const LIST_LINK = '#srchPanel .srow, #library .kn, #library [data-lm], #tracks .trk, #questions .qitem, #help .starters button, #scalePopNever';
  document.addEventListener('click', e => { const t = e.target && e.target.closest && e.target.closest(LIST_LINK); if (t) panelShow(t.closest('#srchPanel') ? 'search' : 'list'); }, true);
  document.addEventListener('submit', e => { if (e.target && e.target.id === 'srchForm' && document.querySelector('#srchPanel .srow')) panelShow('search'); }, true);
  $('#bLabels').classList.toggle('off', !labelsOn);
  $('#bLabels').onclick = () => { labelsOn = !labelsOn; store.set('labels', labelsOn); $('#bLabels').classList.toggle('off', !labelsOn); };
  /* Realistic / illustrated: the two pictures are built differently from the first shader on, so the choice is kept and the page reloads with it.
     A look named in the address (?look=1 or 2) still wins for that visit; the button drops it from the address so the kept choice applies. */
  { const bl = $('#bLook'), real = typeof PERF !== 'undefined' && PERF.flags.look === '2';
    if (bl) { bl.classList.toggle('on', real); bl.classList.toggle('off', !real); bl.setAttribute('aria-pressed', real ? 'true' : 'false');
      bl.onclick = () => { try { localStorage.setItem('world.look', real ? '1' : '2'); } catch (e) { }
        const u = new URL(location.href); try { localStorage.getItem('world.look'); u.searchParams.delete('look'); } catch (e) { u.searchParams.set('look', real ? '1' : '2'); }
        location.href = u.toString(); }; } }
  $('#bHelp').onclick = () => $('#help').classList.remove('hide');
  $('#goBtn').onclick = () => { $('#help').classList.add('hide'); store.set('seenHelp', true); canvas.focus(); };
  $('#tourIn').onclick = () => startTour(true); $('#tourOut').onclick = () => startTour(false);
  $('#tourIn2').onclick = () => { closePops(); startTour(true); }; $('#tourOut2').onclick = () => { closePops(); startTour(false); }; // the same tours, from the Library panel (the ruler's buttons have no room on a phone)
  const speeds = [[1, 'Real time'], [60, '1 min per s'], [3600, '1 hour per s'], [86400, '1 day per s'], [86400 * 30, '1 month per s'], [0, 'Paused']];
  let si = 0; $('#timeS').onclick = () => { si = (si + 1) % speeds.length; timeSpeed = speeds[si][0]; $('#timeS').textContent = speeds[si][1]; };
  $('#timeNow').onclick = () => { simTime = Date.now(); };
  if (store.get('seenHelp', false)) $('#help').classList.add('hide');
  startView();
  if (PERF.flags.stats) PERF.show(true);
  const fade = $('#fade'); fade.style.transition = 'opacity 1.2s'; requestAnimationFrame(() => fade.style.opacity = 0);
  loadKnowledge();
  requestAnimationFrame(loop);
}

/* ================= DEBUG: pickables without a card =================
   auditPickables() lists, for every frame drawn now, the pickable ids that have no card data (no INFO entry, no NODE,
   no userData.info or infoFn). Clicking one still opens a minimal card and logs a console warning; this finds them before
   a user does. Ids resolved at pick time (userData.resolve) cannot be listed in advance and are counted as `dynamic`. */
// a hit-sphere child of a group that carries the card shows that card when picked
function cardOnAncestor(o) { for (let a = o.parent; a; a = a.parent) { const u = a.userData || {}; if (u.infoFn || u.info) return true; } return false; }
function auditPickables(quiet) {
  const out = [];
  for (const f of drawn) {
    if (!f.pickables) continue;
    const missing = new Map(); let dyn = 0, total = 0;
    const seenObj = new Set();
    const visit = o => {
      if (seenObj.has(o)) return; seenObj.add(o);
      const ud = o.userData || {};
      if (ud.resolve) { dyn++; return; }
      if (ud.id !== undefined) { total++; if (!hasCard(o, ud.id) && !cardOnAncestor(o)) missing.set(ud.id, (missing.get(ud.id) || 0) + 1); }
    };
    f.pickables.forEach(p => { visit(p); p.traverse && p.traverse(visit); });
    out.push({ frame: humanName(f), type: f.type, pickables: total, dynamic: dyn, missing: [...missing.keys()] });
  }
  if (!quiet) console.table(out.map(r => ({ frame: r.frame, pickables: r.pickables, dynamic: r.dynamic, missing: r.missing.join(', ') })));
  return out;
}
