// Validate figure specs: node tools/viz/validate.mjs data/viz/<file>.json [...]
// Checks: known type, every expression parses, main expressions evaluate to finite numbers somewhere, param defaults within range.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis; const V = require(path.resolve('js/viz.js'));
const EXPR_KEYS = new Set(['f', 'x', 'y', 'vx', 'vy', 'value', 'mag', 'deg', 'omega', 'from', 'to', 'at', 'x1', 'y1', 'x2', 'y2', 'r', 'w', 'h', 'a0', 'a1', 'q', 'mu', 'sigma', 'a', 'b', 'lambda', 'n', 'p', 'k', 'K', 'sample', 'fmax', 'when', 'alpha', 'dot', 'range', 's', 'z', 'k_']);
const TEXT_KEYS = new Set(['label', 'text', 'caption', 'title', 'xlabel', 'ylabel', 'unit', 'type', 'kind', 'color', 'fill', 'id', 'layout', 'plane', 'mode', 'colormap', 'expr', 'output', 'input', 'start', 'shape', 'align']);
let errors = 0, total = 0;
for (const file of process.argv.slice(2)) {
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [id, sp] of Object.entries(m)) {
    total++; const err = msg => { errors++; console.log(`${path.basename(file)} ${id}: ${msg}`); };
    if (!V.TYPES[sp.type]) { err('unknown type ' + sp.type); continue; }
    const scope = { t: 0.37, x: 0.5, y: 0.3, s: 0.2 }; (sp.params || []).forEach(p => { if (p.min === undefined || p.max === undefined) err(`param ${p.id} needs min/max`); scope[p.id] = p.value ?? p.min; if (p.value !== undefined && (p.value < p.min || p.value > p.max)) err(`param ${p.id} default outside range`); });
    const walk = (o, key) => { if (typeof o === 'string') { if (TEXT_KEYS.has(key)) { (o.match(/\{([^}]+)\}/g) || []).forEach(m2 => { try { V.compile(m2.slice(1, -1)); } catch (e) { err(`bad {} in ${key}: ${e.message}`); } }); return; } if (sp.type === 'logic' && key === 'expr') return; try { V.compile(o); } catch (e) { err(`${key}: ${e.message}`); } return; } if (Array.isArray(o)) o.forEach(v => walk(v, key)); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (['params', 'nodes', 'edges', 'states', 'transitions', 'steps', 'inputs', 'minterms', 'dontcare', 'groups', 'cols', 'rows', 'readouts_'].includes(k) && sp.type !== 'blocks') { if (k === 'params') continue; } if (['nodes', 'edges', 'states', 'transitions', 'steps', 'inputs', 'vars', 'minterms', 'dontcare', 'groups', 'cols', 'rows'].includes(k)) continue; walk(v, k); } };
    walk(sp, '');
    (sp.readouts || []).forEach(r => { try { const v = V.compile(r.value)(scope); if (!isFinite(v)) err(`readout ${r.label} not finite at defaults (${v})`); } catch (e) { err('readout ' + e.message); } });
    const fns = sp.type === 'plot' ? (sp.fns || (sp.f ? [{ f: sp.f }] : [])) : sp.type === 'signal' || sp.type === 'heatmap' || sp.type === 'surface' ? [{ f: sp.f }] : [];
    fns.forEach(f => { try { const g = V.compile(f.f); const xr = (sp.x || [-5, 5]).map(v => typeof v === 'number' ? v : V.compile(v)(scope)); let ok = 0; for (let i = 0; i <= 20; i++) { const v = g(Object.assign({}, scope, { x: xr[0] + (xr[1] - xr[0]) * i / 20, y: .3 })); if (isFinite(v)) ok++; } if (!ok) err(`function ${f.f} never finite on its range`); } catch (e) { err(e.message); } });
    if (sp.type === 'logic') { try { V.parse(String(sp.expr).replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!').replace(/~/g, '!').replace(/([^&])&([^&])/g, '$1&&$2').replace(/([^|])\|([^|])/g, '$1||$2')); } catch (e) { err('logic expr ' + e.message); } }
  }
}
console.log(`${total} specs, ${errors} errors`); process.exit(errors ? 1 : 0);
