from PIL import Image
import os
S='work/dl_sss/Solar-Wanderer/public/textures/'
G='work/dl_npm/package/example/img/'
O='assets/textures/'
os.makedirs(O,exist_ok=True)
def jpg(src,dst,w=4096):
    im=Image.open(src).convert('RGB')
    if im.width>w: im=im.resize((w,w//2),Image.LANCZOS)
    im.save(O+dst,quality=85,optimize=True)
for s,d in [('earth_day.jpg','earth_day.jpg'),('earth_night.jpg','earth_night.jpg'),('moon.jpg','moon.jpg'),('mercury.jpg','mercury.jpg'),
 ('mars.jpg','mars.jpg'),('jupiter.jpg','jupiter.jpg'),('saturn.jpg','saturn.jpg'),('uranus.jpg','uranus.jpg'),('neptune.jpg','neptune.jpg'),
 ('venus_surface.jpg','venus_surface.jpg'),('venus_atmosphere.jpg','venus_atmosphere.jpg'),('sun.jpg','sun.jpg'),('milkyway.jpg','milkyway.jpg'),
 ('pluto.jpg','pluto.jpg'),('charon.jpg','charon.jpg')]:
    jpg(S+s,d)
c=Image.open(S+'earth_clouds.jpg').convert('L').resize((4096,2048),Image.LANCZOS)
a=Image.new('RGBA',c.size,(255,255,255,0)); a.putalpha(c); a.save(O+'earth_clouds.png',optimize=True)
r=Image.open(S+'saturn_ring.png'); print('ring',r.mode,r.size)
r=r.convert('RGBA').resize((4096,250),Image.LANCZOS) if r.width>4096 else r.convert('RGBA'); r.save(O+'saturn_ring.png',optimize=True)
jpg(G+'earth-topology.png','earth_bump.jpg',2048)
Image.open(G+'earth-water.png').convert('L').save(O+'earth_water_mask.png',optimize=True)
