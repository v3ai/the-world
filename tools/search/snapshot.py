"""Dump what the running app can fly to, so the node-side generator can classify every topic card.
Run: WT_URL=http://127.0.0.1:8154/index.html python3 -I tools/search/snapshot.py   (venv python with playwright)
Writes tools/search/snapshot.json. Needs the app served; takes about a minute."""
import sys, os, json
sys.path.insert(0, '/home/rhett/projects/how/.devtools/harness')
os.environ.setdefault('WT_URL', 'http://127.0.0.1:8154/index.html')
from wt import World
JS = r'''(() => {
  const out = { tear: Object.keys(TEAR), nodes: {}, landmarks: LANDMARKS.map(l => ({ label: l.label, D: l.D, side: !!l.side })), things: [], places: [], park: [], anatParts: [] };
  const ix = ANAT_SYNC, body = FR.body;
  const organOf = oid => body && body.children.find(c => c.type === 'organ' && c.opts.organ === oid);
  const parts = nid => ix ? ix.parts.filter(p => !p.parent && p.id !== 'skin' && nodeForMesh(p.id) === nid) : [];
  const kindOf = (id, depth) => {
    const n = NODE[id]; if (!n) return null;
    if (/^at_el_/.test(id)) return 'atom';
    if (TEAR[id] || (n.where && TEAR[n.where]) || (n.hotspot && TEAR[n.hotspot.of])) return 'tear';
    if (typeof thFindNode === 'function' && thFindNode(id)) return 'thing';
    const w = n.where;
    if (w && !TEAR[w] && w !== id) {
      if (/^(place|mol|crystal):/.test(w)) return w.split(':')[0];
      if (NODE[w] && (depth || 0) < 3) { const k = kindOf(w, (depth || 0) + 1); return k ? 'via:' + k : null; }
    }
    if (organOf(id)) return 'organ';
    const of0 = n.hotspot && n.hotspot.of, of = GOTO_PARENT[of0] || of0;
    if (of && organOf(of)) return 'hotspot';
    let P = id === 'skin' ? ix.parts.filter(p => p.id === 'skin') : parts(id);
    if (!P.length && of) P = of === 'skin' ? ix.parts.filter(p => p.id === 'skin') : parts(of);
    if (!P.length && GOTO_NEAR[id]) { P = parts(GOTO_NEAR[id]); if (P.length) return 'near'; }
    if (P.length && body) return 'part';
    const her = FR.body_f;   // the woman: a structure only she has (her uterus, her breasts) flies to her
    if (her && typeof bodyHas === 'function') { if (her.children.some(c => c.type === 'organ' && c.opts.organ === id)) return 'organ'; if (bodyHas(her, id)) return 'part'; }
    return null;
  };
  Object.keys(NODE).forEach(id => { const k = kindOf(id); if (k) out.nodes[id] = k; });
  out.goto_near = GOTO_NEAR;
  (FR.things || []).forEach(f => out.things.push({ id: f.opts.thing, title: f.name, n: f.opts.n }));
  out.places = bodyPlaces().map(p => p.title);
  out.anatParts = ix ? ix.parts.filter(p => !p.parent).map(p => ({ id: p.id, name: p.name, node: nodeForMesh(p.id) })) : [];
  const ixf = FR.body_f && ANAT_SYNC_BY[FR.body_f.anatDir]; if (ixf) ixf.parts.filter(p => !p.parent).forEach(p => out.anatParts.push({ id: 'vhf_' + p.id, name: p.name + ' (the woman)', node: nodeForMesh(p.id) }));
  out.thingParts = {};
  if (typeof TH !== 'undefined') for (const k in TH.loaded) out.thingParts[k] = TH.loaded[k].parts.map(p => ({ id: p.id, name: p.name, node: p.node }));
  return out;
})()'''
with World() as w:
    w.settle(6)
    d = w.js(JS)
    print(len(d['nodes']), 'nodes with a model;', len(d['tear']), 'tear;', len(d['landmarks']), 'landmarks;', w.errors)
    json.dump(d, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snapshot.json'), 'w'), indent=0, sort_keys=True)
