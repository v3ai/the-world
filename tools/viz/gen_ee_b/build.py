import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import part_a, part_b, part_c, part_d, part_e
D = {}
for m in (part_a, part_b, part_c, part_d, part_e):
    for k, v in m.D.items():
        assert k not in D, k
        D[k] = v
root = os.path.join(os.path.dirname(__file__), "..", "..", "..")
samples = set(json.load(open(os.path.join(root, "data/viz/samples.json"))))
ids = []
for n in "signals dsp em devices control comm power labs electives teardown".split():
    for x in json.load(open(os.path.join(root, "data/nodes/ee_%s.json" % n))):
        if x["id"] not in samples: ids.append(x["id"])
missing = [i for i in ids if i not in D]; extra = [k for k in D if k not in ids]
print("nodes", len(ids), "missing", missing, "extra", extra)
COL = {'accent':'#6ee7ff','gold':'#ffd166','pink':'#ff8fb1','green':'#9be37b','purple':'#b388ff','orange':'#ffa94d','red':'#ff6b6b','blue':'#5b9cff','white':'#e8ecf5','dim':'#98a2b8'}
def fix(sp):
    for f in sp.get('fns', []):
        if f.get('color') in COL: f['color'] = COL[f['color']]
    if sp.get("type") in ("geometry", "parametric", "field", "heatmap"):
        for g in sp.get("shapes", []):
            if g.get("k") == "text" and "color" not in g: g["color"] = "white"
    return sp
out = {i: fix(D[i]) for i in ids if i in D}
json.dump(out, open(os.path.join(root, "data/viz/ee_b.json"), "w"), ensure_ascii=False, indent=1)
print("wrote", len(out))
