import sys
from PIL import Image
f=sys.argv[1]; im=Image.open(f); h=im.height; k=0
step=1200
for y in range(0,h,step):
    c=im.crop((0,y,im.width,min(h,y+step))); c=c.resize((int(c.width*0.75),int(c.height*0.75)))
    c.save(f.replace('.png','_%d.png'%k)); k+=1
print(k)
