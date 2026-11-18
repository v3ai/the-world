import csv,json,struct,math
B='work/'
rows=list(csv.DictReader(open(B+'dl_hyg/HYG-Database/hyg/CURRENT/hygdata_v41.csv')))
out=bytearray(); idx=0; hip2i={}; named=[]
def f(v,d=0.0):
    try: return float(v)
    except: return d
for r in rows:
    if r['id']=='0' or r['proper']=='Sol': continue
    d=f(r['dist'],1e9)
    if d>=100000 or d<=0: continue
    ci=r['ci']; ci=f(ci,0.65) if ci!='' else 0.65
    hip=int(r['hip']) if r['hip'] else 0
    out+=struct.pack('<6f',f(r['x']),f(r['y']),f(r['z']),f(r['absmag']),ci,float(hip))
    if hip and hip not in hip2i: hip2i[hip]=idx
    mag=f(r['mag'],99)
    nm=r['proper'] or (r['bf'].strip() if mag<3 and r['bf'].strip() else '')
    if nm: named.append([idx,nm,r['spect'],round(d*3.26156,2)])
    idx+=1
open(B+'../data/stars/stars.bin','wb').write(out)
json.dump({"count":idx,"fields":["x_pc","y_pc","z_pc","absmag","bv","hip"],"source":"HYG Database v4.1 (astronexus/HYG-Database, CC BY-SA 4.0); equatorial J2000, parsecs, Sun excluded; stars with dist>=100000 pc sentinel excluded","named":named},open(B+'../data/stars/stars_meta.json','w'),separators=(',',':'))
sc=json.load(open(B+'dl_stell/stellarium/skycultures/modern/index.json'))
lines=[];miss=0;tot=0
for c in sc['constellations']:
    ab=c['id'].split()[-1]; segs=[]
    for pl in c['lines']:
        for a,b in zip(pl,pl[1:]):
            tot+=1
            if a in hip2i and b in hip2i: segs.append([hip2i[a],hip2i[b]])
            else: miss+=1
    lines.append([ab,segs])
json.dump({"lines":lines,"source":"Stellarium modern sky culture (CC BY-SA 4.0), mapped via HIP->HYG"},open(B+'../data/stars/constellations.json','w'),separators=(',',':'))
print(idx,len(named),len(lines),tot,miss)
