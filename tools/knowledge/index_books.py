import sys, os, re, json
import xml.etree.ElementTree as ET
ROOT = sys.argv[1]; OUT = sys.argv[2]
NS = {'col':'http://cnx.rice.edu/collxml','md':'http://cnx.rice.edu/mdml','c':'http://cnx.rice.edu/cnxml'}
BOOKS = [
 ('osbooks-university-physics-bundle','university-physics-volume-1','UP1'),
 ('osbooks-university-physics-bundle','university-physics-volume-2','UP2'),
 ('osbooks-university-physics-bundle','university-physics-volume-3','UP3'),
 ('osbooks-astronomy','astronomy-2e','AST'),
 ('osbooks-biology-bundle','biology-2e','BIO'),
 ('osbooks-biology-bundle','concepts-biology','COB'),
 ('osbooks-microbiology','microbiology','MIC'),
 ('osbooks-chemistry-bundle','chemistry-2e','CHE'),
 ('osbooks-chemistry-bundle','chemistry-atoms-first-2e','CAF'),
 ('osbooks-organic-chemistry','organic-chemistry','ORG'),
]
def slugify(t):
    t = t.lower().replace('&','').replace('’','').replace("'",'')
    t = re.sub(r'<[^>]+>','',t)
    t = re.sub(r'[^a-z0-9]+','-',t).strip('-')
    return t
def text(el):
    return re.sub(r'\s+',' ',''.join(el.itertext())).strip() if el is not None else ''
out = {'books':[], 'terms':{}}
for repo, slug, code in BOOKS:
    col = ET.parse(f'{ROOT}/{repo}/collections/{slug}.collection.xml').getroot()
    title = col.find('.//md:title', NS).text
    chapters = []
    def mod_info(mid):
        p = f'{ROOT}/{repo}/modules/{mid}/index.cnxml'
        r = ET.parse(p).getroot()
        t = text(r.find('c:title', NS))
        terms = [text(d.find('c:term', NS)) for d in r.findall('.//c:glossary/c:definition', NS)]
        if not terms:
            seen=set(); terms=[]
            for tt in r.findall('.//c:content//c:term', NS):
                x=text(tt)
                if x and 2<len(x)<60 and x.lower() not in seen: seen.add(x.lower()); terms.append(x)
        body = text(r.find('c:content', NS))
        return t, terms, len(body.split())
    def walk(node):
        for ch in node:
            tag = ch.tag.split('}')[1]
            if tag == 'subcollection':
                cont = ch.find('col:content', NS)
                mods = [m for m in cont if m.tag.endswith('module')]
                subs = [m for m in cont if m.tag.endswith('subcollection')]
                if subs: walk(cont)
                else:
                    chapters.append((text(ch.find('md:title', NS)), [m.get('document') for m in mods]))
            elif tag == 'content':
                walk(ch)
    walk(col.find('col:content', NS))
    book = {'code':code,'slug':slug,'title':title,'chapters':[]}
    nterms = 0
    for ci,(ctitle, mids) in enumerate(chapters, 1):
        secs = []
        for si, mid in enumerate(mids):
            t, terms, words = mod_info(mid)
            if si == 0:
                num = None; page = f'{ci}-{slugify(t)}'
            else:
                num = f'{ci}.{si}'; page = f'{ci}-{si}-{slugify(t)}'
            secs.append({'n':num,'t':t,'p':page,'w':words})
            for term in terms:
                if not term: continue
                k = term.lower()
                out['terms'].setdefault(k, {'t':term,'r':[]})
                out['terms'][k]['r'].append([code, num or f'{ci}', page])
                nterms += 1
        book['chapters'].append({'n':ci,'t':ctitle,'s':secs})
    out['books'].append(book)
    print(code, title, len(chapters), 'chapters', sum(len(c['s']) for c in book['chapters']), 'sections', nterms, 'terms')
json.dump(out, open(OUT,'w'), ensure_ascii=False)
print('unique terms', len(out['terms']), 'bytes', os.path.getsize(OUT))
