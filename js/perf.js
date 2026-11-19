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
   ===================================================================== */
const PERF = (() => {
  const q = new URLSearchParams(location.search), get = (k, ok, d) => { const v = q.get(k); return v !== null && (!ok || ok.includes(v)) ? v : d; };
  const fx = get('fx', ['low', 'high'], '');
  const PRESET = { low: { bloom: '0', shadows: '0', outline: '0', dprMax: 1 }, high: { bloom: 'full', shadows: '1', outline: 'all', dprMax: 2 }, '': { bloom: 'half', shadows: '1', outline: 'all', dprMax: 2 } }[fx];
  const dprQ = q.get('dpr'), dprN = dprQ !== null && isFinite(+dprQ) && +dprQ > 0 ? clampN(+dprQ, .25, 4) : null;
  function clampN(x, a, b) { return Math.max(a, Math.min(b, x)); }
  const flags = {
    stats: q.get('stats') === '1',
    fx,
    bloom: get('bloom', ['0', 'half', 'full'], PRESET.bloom),
    dpr: dprN !== null ? dprN : 'auto',          // a number fixes the render scale; 'auto' adapts it
    dprMax: PRESET.dprMax,
    shadows: get('shadows', ['0', '1'], PRESET.shadows) === '1',
    outline: get('outline', ['0', 'near', 'all'], PRESET.outline),
    depth: get('depth', ['log', 'tight', 'vert'], 'log'),
    merge: get('merge', ['0', '1'], '0') === '1',
    idle: get('idle', ['0', '1'], '1') === '1',
    given: {}                                      // which switches the URL set explicitly
  };
  ['fx', 'bloom', 'dpr', 'shadows', 'outline', 'depth', 'merge', 'idle', 'stats'].forEach(k => { if (q.get(k) !== null) flags.given[k] = q.get(k); });

  /* ---- measurements: cheap enough to stay on all the time ---- */
  const N = 240;
  const P = {
    flags,
    frame: 0,
    dts: new Float32Array(N), di: 0, dn: 0,        // the last N frame intervals (ms)
    cpu: { update: 0, pick: 0, render: 0, other: 0 }, acc: { update: 0, pick: 0, render: 0 },   // smoothed ms per frame, and this frame's sums
    pick: { n: 0, last: 0, max: 0, frameMax: 0, sum: 0, ring: new Float32Array(512) },   // single picks (ms): count, last, worst, the last 512; frameMax = most picking in one frame
    _framePick: 0,
    renders: 0, _renders: 0,                       // renderer.render() calls for scenes, last frame
    passes: 0, _passes: 0,                         // full-screen passes (bloom), last frame
    calls: 0, tris: 0, points: 0, scenes: 0,
    gpu: { ok: null, ms: 0, ext: null, q: [], busy: null },
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
  return P;
})();
