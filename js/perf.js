'use strict';
/* =====================================================================
   PERF: switches and measurements. Loaded before engine.js, so the renderer can read the switches when it is created.
   The meter itself (shown with ?stats=1 or Shift+P) is built at the bottom of this file, the first time it is shown.

   URL switches (all optional; docs/DEVELOPMENT.md, "Performance"):
     stats=1               show the meter
     fx=low|high           a preset for the switches below; any switch given as well overrides it
     bloom=0|half|full     glow around bright things: off, at half resolution, at full resolution
     dpr=<number>|auto     render scale relative to CSS pixels: fixed, or adapted to the frame time
     shadows=0|1           the park's sun shadow
     outline=0|near|all    inked outlines: only the part under the pointer or selected, near parts, every part
     depth=log|tight|vert  depth buffer: logarithmic per fragment, fitted near and far planes, logarithmic per vertex
     merge=0|1             draw far things inside their parent's scene
     idle=0|1              drop to a low frame rate when nothing moves
     look=1|2              the illustrated (1) or the realistic (2) picture (docs/DESIGN.md section 3; js/look.js); reloads the page. Without it the
                           visitor's last choice with the Realistic button in the top bar is used (kept in localStorage as world.look; illustrated at first)
     lookq=high|low        its quality level (fx=low implies low); reloads the page
     lookoff=a,b           parts of it switched off, to judge each alone: pbr tone sky env tex sss rig shadow glow ui labels
                           (env, shadow, glow and labels change live; the others reload the page)
     lookexp=<number>      its exposure (default 0.9); live
     looksky=sky|photo|overcast  the sky over the park: computed (default), the photograph at its own hour, or the cloudy one; reloads
     theme=dark|light      with look=2, the interface's dark or light tokens whatever the system says (read in js/look_ui.js)
   ===================================================================== */
const PERF = (() => {
  const q = new URLSearchParams(location.search), get = (k, ok, d) => { const v = q.get(k); return v !== null && (!ok || ok.includes(v)) ? v : d; };
  const fx = get('fx', ['low', 'high'], '');
  const PRESET = { low: { bloom: '0', shadows: '0', outline: '0', dprMax: 1 }, high: { bloom: 'full', shadows: '1', outline: 'all', dprMax: 2 }, '': { bloom: 'half', shadows: '1', outline: 'near', dprMax: 2 } }[fx];
  const dprQ = q.get('dpr'), dprN = dprQ !== null && isFinite(+dprQ) && +dprQ > 0 ? clampN(+dprQ, .25, 4) : null;
  function clampN(x, a, b) { return Math.max(a, Math.min(b, x)); }
  /* the visitor's own choice of picture, kept between visits (the Realistic button in the top bar sets it) */
  function lookPref() { try { return localStorage.getItem('world.look') === '2' ? '2' : '1'; } catch (e) { return '1'; } }
  const flags = {
    stats: q.get('stats') === '1',
    fx,
    bloom: get('bloom', ['0', 'half', 'full'], PRESET.bloom),
    dpr: dprN !== null ? dprN : 'auto',          // a number fixes the render scale; 'auto' adapts it
    dprMax: PRESET.dprMax,
    shadows: get('shadows', ['0', '1'], PRESET.shadows) === '1',
    outline: get('outline', ['0', 'near', 'all'], PRESET.outline),
    depth: get('depth', ['log', 'tight', 'vert'], 'log'),
    merge: get('merge', ['0', '1'], '1') === '1',
    idle: get('idle', ['0', '1'], '1') === '1',
    look: get('look', ['1', '2'], lookPref()),   // the address wins; otherwise what the visitor last chose with the Realistic button
    lookq: get('lookq', ['low', 'high'], fx === 'low' ? 'low' : 'high'),
    lookoff: (q.get('lookoff') || '').split(',').map(s => s.trim()).filter(Boolean).sort().join(','),
    looksky: get('looksky', ['sky', 'photo', 'overcast'], 'sky'),
    lookexp: isFinite(+q.get('lookexp')) && +q.get('lookexp') > 0 ? clampN(+q.get('lookexp'), .1, 8) : .9,
    given: {}                                      // which switches the URL set explicitly
  };
  ['fx', 'bloom', 'dpr', 'shadows', 'outline', 'depth', 'merge', 'idle', 'stats', 'look', 'lookq', 'lookoff', 'lookexp', 'looksky'].forEach(k => { if (q.get(k) !== null) flags.given[k] = q.get(k); });

  /* ---- measurements: cheap enough to stay on all the time ---- */
  const N = 240;
  const P = {
    flags,
    frame: 0,
    dts: new Float32Array(N), di: 0, dn: 0,        // the last N frame intervals (ms)
    cpu: { update: 0, pick: 0, render: 0, other: 0 }, acc: { update: 0, pick: 0, render: 0 }, last: { update: 0, pick: 0, render: 0, total: 0 },   // smoothed ms per frame, and this frame's sums
    pick: { n: 0, last: 0, max: 0, frameMax: 0, sum: 0, ring: new Float32Array(512) },   // single picks (ms): count, last, worst, the last 512; frameMax = most picking in one frame
    _framePick: 0,
    renders: 0, _renders: 0,                       // renderer.render() calls for scenes, last frame
    passes: 0, _passes: 0,                         // full-screen passes (bloom), last frame
    calls: 0, tris: 0, points: 0, scenes: 0,
    gpu: { ok: null, ms: 0, n: 0, ext: null, active: null, pending: null },
    idle: false, hidden: false,
    add(k, ms) { P.acc[k] += ms; },
    pickDone(ms) { const p = P.pick; p.ring[p.n & 511] = ms; p.n++; p.last = ms; p.sum += ms; if (ms > p.max) p.max = ms; P._framePick += ms; P.acc.pick += ms; },
    resetPick() { const p = P.pick; p.n = 0; p.last = 0; p.max = 0; p.frameMax = 0; p.sum = 0; },
    pickPct() { const p = P.pick, n = Math.min(p.n, 512); if (!n) return { n: 0, p50: 0, p95: 0, max: 0, frameMax: 0 }; const a = Array.from(p.ring.subarray(0, n)).sort((x, y) => x - y); return { n: p.n, p50: a[n >> 1], p95: a[Math.min(n - 1, Math.floor(n * .95))], max: p.max, frameMax: p.frameMax }; },
    /* called once per rendered frame by the loop: dtMs = interval since the last frame, total = CPU ms spent in this one */
    endFrame(dtMs, total) {
      P.frame++;
      if (dtMs > 0 && dtMs < 1000) { P.dts[P.di] = dtMs; P.di = (P.di + 1) % N; if (P.dn < N) P.dn++; }
      const k = .1, c = P.cpu, a = P.acc;
      c.update += (a.update - c.update) * k; c.pick += (a.pick - c.pick) * k; c.render += (a.render - c.render) * k;
      c.other += (Math.max(0, total - a.update - a.pick - a.render) - c.other) * k;
      if (P._framePick > P.pick.frameMax) P.pick.frameMax = P._framePick;
      P.last.update = a.update; P.last.pick = a.pick; P.last.render = a.render; P.last.total = total; // this frame's own figures (the smoothed ones above take a while to forget a one-off)
      a.update = a.pick = a.render = 0; P._framePick = 0;
      P.renders = P._renders; P._renders = 0; P.passes = P._passes; P._passes = 0;
    },
    /* frame-interval percentiles over the window (ms) */
    pct() {
      const n = P.dn; if (!n) return { p50: 0, p95: 0, p99: 0, fps: 0 };
      const a = Array.from(P.dts.subarray(0, n)).sort((x, y) => x - y), at = f => a[Math.min(n - 1, Math.floor(f * n))];
      let s = 0; for (let i = 0; i < n; i++) s += a[i];
      return { p50: at(.5), p95: at(.95), p99: at(.99), fps: 1000 * n / s };
    }
  };
  /* ---- switches that can change while the page is open ---- */
  const hooks = {};
  P.on = (k, fn) => { (hooks[k] = hooks[k] || []).push(fn); };
  P.set = (k, v) => {
    flags[k] = v; flags.given[k] = v === true ? '1' : v === false ? '0' : String(v);
    try { const u = new URL(location.href); if (flags.given[k] === '') u.searchParams.delete(k); else u.searchParams.set(k, flags.given[k]); if (P.reloads(k, v)) { location.href = u.toString(); return; } history.replaceState(null, '', u.toString()); } catch (e) { }
    (hooks[k] || []).forEach(fn => { try { fn(v); } catch (e) { console.error('switch failed', k, e); } });
    if (P.meter) P.meter.sync();
  };
  /* switches that are read only while the page loads (they change how every shader is built): changing one reloads the page */
  const LIVE_PARTS = ['env', 'shadow', 'glow', 'labels'];
  let offWas = flags.lookoff;
  P.reloads = (k, v) => {
    if (k === 'depth' || k === 'look' || k === 'lookq' || k === 'looksky') return true;
    if (k !== 'lookoff') return false;
    const a = new Set(offWas.split(',').filter(Boolean)), b = new Set(String(v).split(',').filter(Boolean)); offWas = String(v);
    return flags.look === '2' && [...new Set([...a, ...b])].some(p => a.has(p) !== b.has(p) && !LIVE_PARTS.includes(p));
  };
  /* one part of the realistic look on or off (the meter's toggles; LOOK.part reads the same list) */
  P.lookPart = (name, on) => { const s = new Set(flags.lookoff.split(',').filter(Boolean)); if (on) s.delete(name); else s.add(name); P.set('lookoff', [...s].sort().join(',')); };
  P.flagText = () => `bloom=${flags.bloom} dpr=${flags.dpr} shadows=${flags.shadows ? 1 : 0} outline=${flags.outline} depth=${flags.depth} merge=${flags.merge ? 1 : 0} idle=${flags.idle ? 1 : 0}` + (flags.fx ? ` fx=${flags.fx}` : '') + (flags.look === '2' ? ` look=2 lookq=${flags.lookq} lookexp=${flags.lookexp}` + (flags.looksky !== 'sky' ? ` looksky=${flags.looksky}` : '') + (flags.lookoff ? ` lookoff=${flags.lookoff}` : '') : '');

  /* ---- the GPU: its name, and the time it spends on a frame where the browser lets us ask ---- */
  P.gpuName = () => {
    if (P._gpuName !== undefined) return P._gpuName;
    let n = '';
    try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); n = (e && gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || ''; } catch (e) { }
    P._gpuName = String(n); P.software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(P._gpuName);
    return P._gpuName;
  };
  /* One TIME_ELAPSED query around the frame's drawing, read a frame or more later; dropped if the GPU reports a disjoint
     (the timing was interrupted). Only runs while the meter is shown. */
  P.gpuBegin = () => {
    const G = P.gpu; if (!P.shown || G.ok === false) return;
    const gl = renderer.getContext();
    if (G.ok === null) { G.ext = gl.getExtension && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? gl.getExtension('EXT_disjoint_timer_query_webgl2') : null; G.ok = !!G.ext; if (!G.ok) return; }
    if (G.pending) {
      const done = gl.getQueryParameter(G.pending, gl.QUERY_RESULT_AVAILABLE), dis = gl.getParameter(G.ext.GPU_DISJOINT_EXT);
      if (done || dis) { if (done && !dis) { const ms = gl.getQueryParameter(G.pending, gl.QUERY_RESULT) / 1e6; G.ms = G.ms ? G.ms + (ms - G.ms) * .15 : ms; G.n = (G.n || 0) + 1; } gl.deleteQuery(G.pending); G.pending = null; }
    }
    if (!G.pending && !G.active) { G.active = gl.createQuery(); gl.beginQuery(G.ext.TIME_ELAPSED_EXT, G.active); }
  };
  P.gpuEnd = () => { const G = P.gpu; if (!G.active) return; const gl = renderer.getContext(); gl.endQuery(G.ext.TIME_ELAPSED_EXT); G.pending = G.active; G.active = null; };

  /* ---- the meter ---- */
  const K = n => n >= 1e6 ? (n / 1e6).toFixed(2) + ' million' : n >= 1e4 ? Math.round(n / 1e3) + ' thousand' : String(Math.round(n));
  function viewLine() {
    try { const f = cam.A, view = cam.D * 2 * Math.tan(25 * Math.PI / 180); return `${typeof humanName === 'function' ? humanName(f) : f.name} (${f.type}), field of view ${fmtLen(view)}`; } catch (e) { return 'unknown'; }
  }
  P.report = () => {
    const p = P.pct(), c = P.cpu, pk = P.pickPct(), G = P.gpu, sz = renderer.getDrawingBufferSize(new THREE.Vector2()), name = P.gpuName();
    const L = [
      'The World: performance report',
      `View: ${viewLine()}`,
      `Frame rate: ${p.fps.toFixed(0)} fps over the last ${P.dn} frames; frame time ${p.p50.toFixed(1)} ms median, ${p.p95.toFixed(1)} ms 95th percentile, ${p.p99.toFixed(1)} ms 99th`,
      `CPU per frame: ${(c.update + c.pick + c.render + c.other).toFixed(1)} ms (update ${c.update.toFixed(1)}, picking ${c.pick.toFixed(2)}, drawing ${c.render.toFixed(1)}, other ${c.other.toFixed(1)})`,
      `GPU per frame: ${G.ok && G.n ? G.ms.toFixed(1) + ' ms' : G.ok ? 'measuring' : 'not available in this browser'}`,
      `Draw calls ${P.calls}, triangles ${K(P.tris)}, points ${K(P.points)}, scenes drawn ${P.renders}, full-screen passes ${P.passes}`,
      `Canvas ${W} x ${H} CSS pixels, drawn at ${sz.x} x ${sz.y} (scale ${(sz.x / W).toFixed(2)}, device pixel ratio ${window.devicePixelRatio || 1})` + (P.scaleNote ? `, ${P.scaleNote()}` : ''),
      `GPU: ${name || 'unknown'}`,
      P.software ? 'Software renderer: YES. The browser is not using the graphics card.' : 'Software renderer: no',
      `Switches: ${P.flagText()}`,
      `Picking: ${pk.n} picks, median ${pk.p50.toFixed(2)} ms, worst ${pk.max.toFixed(2)} ms` + (typeof PK !== 'undefined' ? `; ${PK.built} trees over ${K(PK.tris)} triangles built in ${PK.ms.toFixed(0)} ms (largest ${PK.maxMs.toFixed(1)} ms)` : ''),
      `Browser: ${navigator.userAgent}`,
      `Page: ${location.pathname}${location.search}`
    ];
    return L.join('\n');
  };
  function build() {
    const el = document.createElement('section'); el.id = 'perf'; el.setAttribute('aria-label', 'Performance');
    el.innerHTML = `<header><b>Performance</b><span class="pf-btns"><button id="pfCopy" title="Copy these numbers as text, to paste into a message">Copy report</button><button id="pfHide" title="Hide this panel (Shift+P shows it again)">Hide</button></span></header>
<div class="pf-warn" id="pfWarn" hidden></div>
<dl>
<dt>Frame rate</dt><dd id="pfFps"></dd>
<dt>Frame time</dt><dd id="pfMs"></dd>
<dt>CPU</dt><dd id="pfCpu"></dd>
<dt>GPU time</dt><dd id="pfGpu"></dd>
<dt>Drawn</dt><dd id="pfDraw"></dd>
<dt>Resolution</dt><dd id="pfRes"></dd>
<dt>Graphics card</dt><dd id="pfName"></dd>
</dl>
<div class="pf-sw" id="pfSw"></div>
<div class="pf-foot">While this panel is open every frame is drawn (no resting rate), so the numbers are of continuous drawing. Move the view while you read them.</div>
<div class="pf-note" id="pfNote"></div>
<textarea id="pfText" readonly hidden aria-label="Performance report text"></textarea>`;
    document.body.appendChild(el);
    const SW = [
      ['bloom', 'Glow', [['0', 'Off'], ['half', 'Half size'], ['full', 'Full size']], v => v],
      ['dpr', 'Sharpness', [['auto', 'Automatic'], ['0.6', '0.6'], ['0.75', '0.75'], ['1', '1'], ['1.5', '1.5'], ['2', '2']], v => v === 'auto' ? 'auto' : +v],
      ['shadows', 'Sun shadow', [['1', 'On'], ['0', 'Off']], v => v === '1'],
      ['outline', 'Ink outlines', [['all', 'All'], ['near', 'Near'], ['0', 'Pointed at']], v => v],
      ['merge', 'Things in the park\'s scene', [['1', 'On'], ['0', 'Off']], v => v === '1'],
      ['depth', 'Depth (reloads the page)', [['log', 'Logarithmic'], ['tight', 'In slices'], ['vert', 'Per vertex (shows errors)']], v => v]
    ];
    if (flags.look === '2') SW.push(   // the realistic picture is a prototype: its rows are shown only while it is on (?look=2)
      ['look', 'Picture (reloads the page)', [['1', 'Illustrated'], ['2', 'Realistic']], v => v],
      ['lookq', 'Realistic quality (reloads)', [['high', 'High'], ['low', 'Low']], v => v],
      ['looksky', 'Sky outdoors (reloads)', [['sky', 'Computed'], ['photo', 'Photograph'], ['overcast', 'Overcast']], v => v],
      ['lookexp', 'Exposure', [['0.6', '0.6'], ['0.75', '0.75'], ['0.9', '0.9'], ['1.05', '1.05'], ['1.2', '1.2']], v => +v]);
    const sw = el.querySelector('#pfSw');
    SW.forEach(([k, label, opts, conv]) => {
      const row = document.createElement('div'); row.className = 'pf-row'; row.innerHTML = `<span>${label}</span>`;
      const seg = document.createElement('span'); seg.className = 'pf-seg'; seg.dataset.k = k;
      opts.forEach(([v, t]) => { const b = document.createElement('button'); b.textContent = t; b.dataset.v = v; b.onclick = () => P.set(k, conv(v)); seg.appendChild(b); });
      row.appendChild(seg); sw.appendChild(row);
    });
    if (flags.look === '2') {   // each part of the realistic picture alone: on (pressed) or off. Sky light, contact shadows, glow and label colour change at once; the rest reload the page
      const PARTS = [['pbr', 'Materials'], ['tone', 'Tone curve'], ['sky', 'Sky'], ['env', 'Sky and room light'], ['tex', 'Surface detail'], ['sss', 'Light through'], ['rig', 'Light rigs'], ['shadow', 'Contact shadows'], ['glow', 'Glow rule'], ['ui', 'Interface'], ['labels', 'Label colour']];
      const row = document.createElement('div'); row.className = 'pf-row pf-parts'; row.innerHTML = '<span>Realistic parts</span>';
      const seg = document.createElement('span'); seg.className = 'pf-seg pf-multi'; seg.dataset.parts = '1';
      PARTS.forEach(([k, t]) => { const b = document.createElement('button'); b.textContent = t; b.dataset.part = k; b.title = (LIVE_PARTS.includes(k) ? 'Changes at once' : 'Reloads the page'); b.onclick = () => P.lookPart(k, flags.lookoff.split(',').includes(k)); seg.appendChild(b); });
      row.appendChild(seg); sw.appendChild(row);
    }
    el.querySelector('#pfHide').onclick = () => P.show(false);
    el.querySelector('#pfCopy').onclick = () => {
      const t = P.report(), ta = el.querySelector('#pfText'), note = el.querySelector('#pfNote');
      const shown = () => { ta.hidden = false; ta.value = t; ta.focus(); ta.select(); };
      const ok = () => { note.textContent = 'Report copied. Paste it into a message.'; }, fail = () => { shown(); let done = false; try { done = document.execCommand('copy'); } catch (e) { } note.textContent = done ? 'Report copied. Paste it into a message.' : 'Could not reach the clipboard: select the text below and copy it.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fail); else fail();
    };
    const $$ = id => el.querySelector(id), val = f => f === true ? '1' : f === false ? '0' : String(f);
    const M = {
      el, t: 0,
      sync() { el.querySelectorAll('.pf-seg').forEach(s => { if (s.dataset.parts) { const off = flags.lookoff.split(','); s.querySelectorAll('button').forEach(b => b.classList.toggle('on', !off.includes(b.dataset.part))); return; } const cur = val(flags[s.dataset.k]); s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === cur)); }); },
      update(now) {
        if (now - M.t < 250) return; M.t = now;
        const p = P.pct(), c = P.cpu, G = P.gpu, sz = renderer.getDrawingBufferSize(new THREE.Vector2()), name = P.gpuName();
        $$('#pfFps').textContent = `${p.fps.toFixed(0)} per second`;
        $$('#pfMs').textContent = `${p.p50.toFixed(1)} ms median, ${p.p95.toFixed(1)} ms 95th percentile, ${p.p99.toFixed(1)} ms 99th`;
        $$('#pfCpu').textContent = `${(c.update + c.pick + c.render + c.other).toFixed(1)} ms: update ${c.update.toFixed(1)}, picking ${c.pick.toFixed(2)}, drawing ${c.render.toFixed(1)}, other ${c.other.toFixed(1)}`;
        $$('#pfGpu').textContent = G.ok && G.n ? `${G.ms.toFixed(1)} ms` : G.ok === false ? 'not available in this browser' : 'measuring';
        $$('#pfDraw').textContent = `${P.calls} draw calls, ${K(P.tris)} triangles` + (P.points ? `, ${K(P.points)} points` : '') + `, ${P.renders} ${P.renders === 1 ? 'scene' : 'scenes'}` + (P.passes ? `, ${P.passes} full-screen passes` : '');
        $$('#pfRes').textContent = `${sz.x} × ${sz.y} (${(sz.x / W).toFixed(2)} of the window's ${W} × ${H}` + (P.scaleNote ? `; ${P.scaleNote()}` : '') + ')';
        $$('#pfName').textContent = name || 'unknown';
        const w = $$('#pfWarn');
        if (P.software) { w.hidden = false; w.textContent = 'This browser is drawing with a software renderer, not the graphics card. That alone makes everything slow. Turn on hardware acceleration in the browser\'s settings (in Chrome: Settings, System, "Use graphics acceleration when available"), restart the browser and look at this line again.'; } else w.hidden = true;
      }
    };
    M.sync(); return M;
  }
  P.shown = false;
  P.show = on => {
    P.shown = on === undefined ? !P.shown : !!on;
    if (P.shown && !P.meter) P.meter = build();
    if (P.meter) P.meter.el.classList.toggle('open', P.shown);
    document.body.classList.toggle('perfOpen', P.shown);
  };
  P.tick = now => { if (P.shown && P.meter) P.meter.update(now); };
  addEventListener('keydown', e => { if (e.key === 'P' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); P.show(); } });
  return P;
})();
