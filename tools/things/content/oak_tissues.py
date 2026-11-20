# Writes the oak's mycorrhizal root-tip scene: data/things/tissues/oak_ecm_tip.json  (all lengths in micrometres).
# Run from the repo root:  /home/rhett/projects/how/.devtools/venv/bin/python tools/things/content/oak_tissues.py
# Sources opened: Wikipedia "Ectomycorrhiza" (the sheathing mantle can be up to 40 um thick; the fungus suppresses root-hair development;
# in angiosperms the Hartig net is mostly confined to the outer root layer); Howarth, "Ectomycorrhizas" (davidmoore.org.uk: infected roots are shorter and wider
# than uninfected ones; the sheath suppresses root hairs); a fungal thread is about 5 um wide (see mushroom_tissues.py). Tip length and width, the number of
# threads and the grains are illustrative (no size for an oak tip was found in an opened source).
import json, math, random
import tissue_material as TM
rnd = random.Random(11)
def pop(id, name, node, shape, size, color, items, deeper=None, opacity=1, priority=None, material=None):
    p = {'id': id, 'name': name, 'node': node, 'shape': shape, 'size': size, 'color': color, 'opacity': opacity, 'ink': 1, 'arrange': {'kind': 'list', 'items': items}}
    if deeper: p['deeper'] = deeper
    if priority: p['priority'] = priority
    return p
def at(x, y, z, **kw): return {'at': [round(x, 1), round(y, 1), round(z, 1)], **kw}
CORE = (1100, 480, 480); MANTLE_T = 40          # core length and width (illustrative); mantle thickness drawn at the published upper limit
cx = 250                                         # the tip's centre along x; the root axis runs along x, tip toward +x
shell = (CORE[0] + 2 * MANTLE_T, CORE[1] + 2 * MANTLE_T, CORE[2] + 2 * MANTLE_T)
# fungal threads leaving the sheath into the soil
threads = []
for i in range(46):
    th, ph = rnd.uniform(0, 2 * math.pi), math.acos(rnd.uniform(-1, 1))
    d = [math.sin(ph) * math.cos(th), math.cos(ph), math.sin(ph) * math.sin(th)]
    # a point on the sheath surface, then the thread's centre 200 um out along the same direction
    k = 1 / math.sqrt((d[0] / (shell[0] / 2)) ** 2 + (d[1] / (shell[1] / 2)) ** 2 + (d[2] / (shell[2] / 2)) ** 2)
    s = [k * d[0], k * d[1], k * d[2]]; c = [cx + s[0] + d[0] * 210, s[1] + d[1] * 210, s[2] + d[2] * 210]
    threads.append(at(*c, dir=[round(v, 3) for v in d]))
grains = []
while len(grains) < 12:
    p = (rnd.uniform(-650, 1000), rnd.uniform(-700, 700), rnd.uniform(-420, 420))
    if abs(p[1]) > 520 and rnd.random() < .9 or abs(p[2]) > 420: grains.append(at(*p, rotY=rnd.uniform(0, 3)))
d = {'tag': 'On an oak root', 'cell': 'plant', 'id': 'oak_ecm_tip', 'title': "An oak's root tip wrapped in fungus", 'node': 'oak_mycorrhiza',
 'blurb': 'A short, swollen fine-root tip of an oak, sheathed in a fungal sleeve with threads running out into the soil. There are no root hairs: the fungus does the reaching. Click the root, the sleeve, a thread or a grain of soil.',
 'note': 'Real values: the fungal sleeve (mantle) can be up to 40 micrometres thick (drawn at 40) and a fungal thread is about 5 micrometres wide. Sheathed tips are shorter and wider than bare ones, and the fungus suppresses root hairs, so none are drawn. Illustrative: the tip length and width (about 1.1 mm by 0.5 mm), the number and length of the threads, the soil grains, and the thin root behind the tip. Real sheathed tips differ in shape, colour and branching with the fungus; the layers inside the sleeve are shown in the fly agaric scene "A root tip and its fungal partner".',
 'bg': '#f3efe6', 'center': [cx - 100, 0, 0], 'D_um': 2600,
 'labels': [{'text': 'Root tip: short and swollen, no root hairs', 'at': [cx - 150, 330, 280], 'pop': 'core'}, {'text': 'Fungal sleeve (mantle), up to 40 µm thick', 'at': [cx + 330, -330, 280], 'pop': 'mantle'},
            {'text': 'Fungal thread, about 5 µm wide', 'at': [cx + 650, 330, 200], 'pop': 'threads'}, {'text': 'Thin root behind the tip', 'at': [-420, 190, 60], 'pop': 'root_behind'}, {'text': 'Soil grain (illustrative)', 'at': [-430, -520, 0], 'pop': 'grain'}],
 'populations': [
   pop('core', 'Root tip (the tree)', 'oak_roots', 'ellipsoid', list(CORE), '#d6c28f', [at(cx, 0, 0)], {'type': 'cell'}, priority=3),
   pop('mantle', 'Fungal sleeve (mantle)', 'fa_mantle', 'ellipsoid', list(shell), '#efe4c2', [at(cx, 0, 0)], opacity=.45, priority=2),
   pop('root_behind', 'Thin root behind the tip', 'oak_roots', 'cylinder', [260, 900, 260], '#c4a572', [at(-560, 0, 0, dir=[1, 0, 0])], {'type': 'cell'}),
   pop('threads', 'Fungal thread in the soil', 'fa_mycelium', 'cylinder', [5, 420, 5], '#f6f3ea', threads, {'type': 'mol', 'mol': 'n_acetylglucosamine', 'name': 'N-acetylglucosamine, the unit of chitin'}),
   pop('grain', 'Soil grain', 'bio_soil_ecology', 'rbox', [220, 140, 170], '#8a6a48', grains),
 ]}
json.dump(TM.apply(d), open('data/things/tissues/oak_ecm_tip.json', 'w'), indent=1, ensure_ascii=False)
print('oak_ecm_tip', len(d['populations']), 'populations')
