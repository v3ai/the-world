import sys, json, importlib
sys.path.insert(0, '.')
mods = sys.argv[1:] or ['g_hubs','g_math','g_phys','g_prog','g_circ','g_elec','g_dig','g_arch']
S = {}
for m in mods:
    try:
        importlib.import_module(m).build(S)
    except ModuleNotFoundError as e:
        if e.name != m: raise
        print('skip', m)
# post-process: plot ylabel collides with the legend, so fold it into the first legend entry
for k, v in S.items():
    if v.get('type') == 'plot' and v.get('ylabel'):
        yl = v.pop('ylabel')
        import re
        mm = re.search(r'\((.+)\)$', yl)
        if mm: yl = mm.group(1)
        if len(yl) > 14: yl = yl.split(',')[0][:14]
        for f in v.get('fns', []):
            if f.get('label'):
                if yl not in f['label']:
                    f['label'] = f"{f['label']} [{yl}]"
                break
        else:
            v['ylabel'] = yl
json.dump(S, open('data/viz/ee_a.json', 'w'), ensure_ascii=False, indent=1)
print(len(S), 'specs')
