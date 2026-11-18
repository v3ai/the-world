import sys, re, json, glob, xml.etree.ElementTree as ET
ROOT=sys.argv[1]; lib=json.load(open(sys.argv[2])); pats=sys.argv[3:]
NS={'c':'http://cnx.rice.edu/cnxml','col':'http://cnx.rice.edu/collxml','md':'http://cnx.rice.edu/mdml'}
repo={'UP1':'osbooks-university-physics-bundle','UP2':'osbooks-university-physics-bundle','UP3':'osbooks-university-physics-bundle','AST':'osbooks-astronomy','BIO':'osbooks-biology-bundle','COB':'osbooks-biology-bundle','MIC':'osbooks-microbiology','CHE':'osbooks-chemistry-bundle','CAF':'osbooks-chemistry-bundle','ORG':'osbooks-organic-chemistry'}
# map code:sec -> module id by re-walking collections
import importlib
def mods(code, slug):
    col=ET.parse(f"{ROOT}/{repo[code]}/collections/{slug}.collection.xml").getroot(); out=[]
    def walk(n):
        for ch in n:
            t=ch.tag.split('}')[1]
            if t=='subcollection':
                cont=ch.find('col:content',NS); subs=[m for m in cont if m.tag.endswith('subcollection')]
                if subs: walk(cont)
                else: out.append([m.get('document') for m in cont if m.tag.endswith('module')])
            elif t=='content': walk(ch)
    walk(col.find('col:content',NS)); return out
for p in pats:
    code, sec, rx = p.split('|', 2)
    b=[x for x in lib['books'] if x['code']==code][0]
    ch, sn = map(int, sec.split('.'))
    mid=mods(code,b['slug'])[ch-1][sn]
    t=re.sub(r'\s+',' ',''.join(ET.parse(f"{ROOT}/{repo[code]}/modules/{mid}/index.cnxml").getroot().find('c:content',NS).itertext()))
    for m in list(re.finditer(rx,t,re.I))[:2]:
        print(f"[{code}{sec}] ...{t[max(0,m.start()-110):m.end()+110]}...")
