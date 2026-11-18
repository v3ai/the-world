import json,glob,collections
rows=[]
for f in sorted(glob.glob('data/molecules/*.json')):
    if f.endswith('index.json'): continue
    r=json.load(open(f)); rows.append(dict(id=r['id'],name=r['name'],formula=r['formula'],category=r['category'],file=r['id']+'.json',mw=r['mw']))
cat=['gas','inorganic','organic','amino_acid','nucleotide','sugar','lipid','cofactor','pigment','hormone_neuro','drug','polymer','mineral_unit']
rows.sort(key=lambda r:(cat.index(r['category']),r['id']))
json.dump(rows,open('data/molecules/index.json','w'),separators=(',',':'))
print(len(rows),collections.Counter(r['category'] for r in rows))
