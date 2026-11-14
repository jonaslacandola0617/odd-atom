"""Original painted detail maps. Geometry, not this paint, defines the silhouette."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math,random
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/characters/nico-lowpoly-v1/textures';OUT.mkdir(parents=True,exist_ok=True)
random.seed(3407)
N=1024
# Head UV uses angle around the head horizontally and world height vertically.
im=Image.new('RGB',(N,N),(168,121,83));d=ImageDraw.Draw(im)
def hp(x,z):
    # Approximation matches the broad front face of the geometric head.
    a=math.asin(max(-.98,min(.98,x/.077)))
    return ((.5+a/(2*math.pi))*N,(1-(z-1.43)/.335)*N)
def poly(points,fill):d.polygon([hp(x,z) for x,z in points],fill=fill)
# Restrained cheek/chin color, diffuse tired under-eye paint; lids remain geometry.
poly([(-.064,1.57),(-.043,1.526),(0,1.512),(.043,1.526),(.064,1.57),(.044,1.543),(-.044,1.543)],(159,115,82))
for sign in [-1,1]:
    poly([(sign*.012,1.621),(sign*.057,1.622),(sign*.062,1.612),(sign*.043,1.607),(sign*.015,1.614)],(151,108,79))
    poly([(sign*.014,1.615),(sign*.052,1.613),(sign*.052,1.608),(sign*.023,1.610)],(160,115,81))
# Very light, broken stubble. Restrict to jaw and moustache rather than a dark beard mask.
for _ in range(240):
    x=random.uniform(-.062,.062);z=random.uniform(1.516,1.567)
    if z>1.547 and abs(x)<.022:continue
    if abs(x)>.035 and z<1.524:continue
    u,v=hp(x,z);col=random.choice([(117,91,70),(132,99,74),(145,108,77)])
    d.line((u,v,u+random.uniform(-.6,.6),v+random.uniform(1.4,2.7)),fill=col,width=1)
for _ in range(32):
    x=random.uniform(-.021,.021);z=random.uniform(1.579,1.585);u,v=hp(x,z)
    d.line((u,v,u+.3,v+1.3),fill=(132,99,74),width=1)
im.save(OUT/'Nico_Skin.png')

# Denim: two front/back orthographic projection halves, restrained seams/scuffs.
im=Image.new('RGB',(N,N),(43,46,53));d=ImageDraw.Draw(im)
for _ in range(36000):
    x=random.randrange(N);y=random.randrange(N);v=random.randrange(-3,4)
    d.point((x,y),fill=(43+v,46+v,53+v))
def jp(x,z,back=False):return ((.5 if back else 0)+(x+.19)/.38*.5)*N,(1-z/.96)*N
for back in [False,True]:
    for s in [-1,1]:
        for xx in [s*.151,s*.055]:
            pts=[jp(xx*(.80+.20*z/.94),z,back) for z in [.12,.34,.50,.69,.83]]
            d.line(pts,fill=(55,57,61),width=2)
        # Painted knee wear is soft and small, not a separate geometry patch.
        u,v=jp(s*.095,.49,back);d.ellipse((u-17,v-15,u+17,v+11),fill=(48,51,57))
        if back:
            d.line([jp(s*.048,.883,back),jp(s*.126,.877,back),jp(s*.122,.823,back),jp(s*.082,.811,back),jp(s*.048,.828,back),jp(s*.048,.883,back)],fill=(57,59,63),width=2)
        else:
            d.line([jp(s*.038,.93,back),jp(s*.046,.898,back),jp(s*.105,.873,back),jp(s*.14,.885,back)],fill=(59,60,62),width=2)
    if not back:d.line([jp(.008,.935),jp(.011,.849),jp(0,.824)],fill=(30,32,38),width=3)
im.save(OUT/'Nico_Denim.png')

# Worn canvas/suede. UV is local shoe X/Y; these are paint, not floating lace meshes.
S=512;im=Image.new('RGB',(S,S),(101,101,98));d=ImageDraw.Draw(im)
def sp(x,y):return ((x+.055)/.11*S,(1-(y+.19)/.28)*S)
for _ in range(13000):
    x=random.randrange(S);y=random.randrange(S);v=random.randrange(-5,6);d.point((x,y),fill=(101+v,101+v,98+v))
for s in [-1,1]:
    d.line([sp(s*.034,.035),sp(s*.033,-.045),sp(s*.025,-.092)],fill=(75,76,75),width=4)
    d.line([sp(s*.029,.035),sp(s*.027,-.048),sp(s*.021,-.085)],fill=(134,131,122),width=2)
for i in range(5):
    y=.011-i*.018
    a=sp(-.022,y);b=sp(.022,y-.012)
    d.line([a,b],fill=(166,159,143),width=6)
    d.line([sp(.022,y),sp(-.022,y-.012)],fill=(143,140,130),width=4)
for _ in range(110):
    x=random.uniform(-.04,.04);y=random.uniform(-.17,-.11);u,v=sp(x,y)
    d.line((u,v,u+random.uniform(2,10),v+random.uniform(-2,4)),fill=(146,143,131),width=1)
im.save(OUT/'Nico_Shoes.png')

im=Image.new('RGB',(256,128),(73,89,74));d=ImageDraw.Draw(im)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',61)
d.text((20,16),'23:41',font=font,fill=(22,31,26));d.text((24,93),'MO   17',fill=(32,43,33))
im.save(OUT/'Nico_Watch.png')

im=Image.new('RGB',(256,256),(25,24,25));d=ImageDraw.Draw(im)
for i in range(8):
    x=i*37-40;d.polygon([(x,256),(x+25,256),(x+130,0),(x+96,0)],fill=(29+i%2,28+i%2,30+i%2))
im=im.filter(ImageFilter.GaussianBlur(8));im.save(OUT/'Nico_Hair.png')
print('Saved five original painted detail maps.')
