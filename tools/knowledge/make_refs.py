import sys, re, json
lib=json.load(open(sys.argv[1])); src=''.join(open(f).read() for f in sys.argv[2:-1]); out=sys.argv[-1]
books={b['code']:b for b in lib['books']}
refs={}; bad=[]
for m in set(re.findall(r"'((?:UP[123]|AST|BIO|COB|MIC|CHE|CAF|ORG)\d+\.\d+)'", src)):
    mm=re.match(r'(UP[123]|[A-Z]{3})(\d+)\.(\d+)$', m); code,ch,sn=mm.group(1),int(mm.group(2)),int(mm.group(3))
    b=books[code]
    try:
        c=b['chapters'][ch-1]; s=[x for x in c['s'] if x['n']==f'{ch}.{sn}'][0]
        refs[m]=[code,b['slug'],s['p'],f'{ch}.{sn}',s['t']]
    except Exception: bad.append(m)
chs={}
for m in set(re.findall(r"'((?:UP[123]|AST|BIO|COB|MIC|CHE|CAF|ORG)):(\d+)'", src)):
    code,ch=m; b=books[code]; c=b['chapters'][int(ch)-1]
    chs[f'{code}:{ch}']=[code,b['slug'],c['s'][0]['p'],ch,c['t']]
open(out,'w').write('/* Generated: OpenStax section links (openstax.org) */\nconst REFS = '+json.dumps(refs,ensure_ascii=False)+';\nconst CHAPTERS = '+json.dumps(chs,ensure_ascii=False)+';\n')
print('refs',len(refs),'chapters',len(chs),'BAD',bad)
for k in sorted(refs): print(k, refs[k][4])
