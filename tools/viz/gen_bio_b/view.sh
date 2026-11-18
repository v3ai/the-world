#!/bin/sh
# usage: view.sh FROM N  -> /tmp/bbv.png (downscaled)
cd . && python3 tools/viz/gen_bio_b/shot.py $1 $2 && python3 -c "
from PIL import Image
im=Image.open('/tmp/bb_%03d.png'%$1);im.resize((int(im.width*.6),int(im.height*.6))).save('/tmp/bbv.png');print(im.size)"
