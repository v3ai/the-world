// Evaluate every spec at each slider's min / max / default and report non-finite readouts or functions that are never finite.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis; const V = require(path.resolve('js/viz.js'));
const m = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); let bad = 0;
for (const [id, sp] of Object.entries(m)) {
  const ps = sp.params || []; const combos = [{}]; ps.forEach(p => { combos.push({ [p.id]: p.min }); combos.push({ [p.id]: p.max }); });
  for (const c of combos) {
    const sc = { t: 1.3, x: .5, y: .3, s: .2 }; ps.forEach(p => sc[p.id] = c[p.id] ?? p.value);
    (sp.readouts || []).forEach(r => { try { const v = V.compile(r.value)(sc); if (!isFinite(v)) { bad++; console.log(id, 'readout', r.label, JSON.stringify(c), v); } } catch (e) { bad++; console.log(id, 'readout err', e.message); } });
    const fns = sp.type === 'plot' ? sp.fns : (sp.type === 'signal' || sp.type === 'heatmap' || sp.type === 'surface') ? [{ f: sp.f }] : [];
    fns.forEach(f => { const g = V.compile(f.f); const xr = (sp.x || [-5, 5]).map(v => typeof v === 'number' ? v : V.compile(v)(sc)); let ok = 0; for (let i = 0; i <= 40; i++) { const x = sp.logx ? Math.pow(10, Math.log10(xr[0]) + (Math.log10(xr[1]) - Math.log10(xr[0])) * i / 40) : xr[0] + (xr[1] - xr[0]) * i / 40; if (isFinite(g({ ...sc, x, y: .3 }))) ok++; } if (ok < 30) { bad++; console.log(id, 'fn mostly non-finite', f.f.slice(0, 50), ok, JSON.stringify(c)); } });
  }
}
console.log('stress issues', bad);
