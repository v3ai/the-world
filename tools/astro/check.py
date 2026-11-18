import struct,json,math
d=open('data/stars/stars.bin','rb').read()
m=json.load(open('data/stars/stars_meta.json'))
assert len(d)==m['count']*24
for i,n,s,ly in m['named']:
    if n in('Sirius','Betelgeuse','Polaris','Proxima Centauri','Vega'):
        x,y,z,am,bv,hip=struct.unpack_from('<6f',d,i*24); r=math.sqrt(x*x+y*y+z*z)
        ra=math.degrees(math.atan2(y,x))/15%24; dec=math.degrees(math.asin(z/r))
        print(n,'d=%.3f pc (%.2f ly, meta %.2f)'%(r,r*3.26156,ly),'RA=%.2fh Dec=%.2f'%(ra,dec),'M=%.2f bv=%.2f hip=%d'%(am,bv,hip))
