// Try queries from the command line:  node tools/search/q.mjs "sugar" "a battery"
import { SC, load } from './lib.mjs';
const idx = load();
for (const q of process.argv.slice(2)) {
  const t = performance.now(); const r = SC.query(idx, q); const ms = performance.now() - t;
  console.log(`\n== ${q}   (${ms.toFixed(1)} ms)${r.hint ? '\n   hint: ' + r.hint : ''}`);
  r.results.slice(0, 9).forEach(x => console.log(`  ${x.score.toFixed(0).padStart(3)} ${x.band}${x.e.g[0]} ${x.id.padEnd(34)} ${x.e.t}${x.near ? '  [nearest]' : ''}${x.note ? '  // ' + x.note.slice(0, 50) : ''}`));
  if (!r.results.length) { console.log('  (none)  partial:', r.partial.slice(0, 4).map(x => x.id).join(' '), ' weak:', r.weak.slice(0, 3).map(x => x.id).join(' ')); }
}
