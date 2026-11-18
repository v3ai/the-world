import sys, json
d=json.load(open(sys.argv[1])); codes=[b['code'] for b in d['books']]
books=[{'c':b['code'],'s':b['slug'],'t':b['title'],'ch':[[c['n'],c['t'],[[s['n'] or '',s['t'],s['p']] for s in c['s']]] for c in b['chapters']]} for b in d['books']]
terms=[]
for k,v in sorted(d['terms'].items()):
    t=v['t'].strip()
    if len(t)<2 or len(t)>70: continue
    refs=[]; seen=set()
    for code,num,page in v['r']:
        key=(code,page)
        if key in seen: continue
        seen.add(key); refs.append([codes.index(code),num,page])
    terms.append([t,refs[:8]])
out={'license':'Index of section titles and key terms from OpenStax textbooks (CC BY-NC-SA 4.0). Links go to openstax.org.','books':books,'terms':terms}
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,separators=(',',':'))
print(len(terms),'terms')
