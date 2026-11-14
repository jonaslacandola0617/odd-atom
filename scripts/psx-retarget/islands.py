import json,numpy as np
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
O=Path('out/psx-retarget');d=json.loads((O/'mesh.json').read_text());v=np.array(d['vertices']);f=d['faces'];uv=d['uv']
# UV connectivity; seam vertex copies join only if both positions and UV coincide
parent=list(range(len(f)))
def find(x):
 while parent[x]!=x: parent[x]=parent[parent[x]];x=parent[x]
 return x
edges={}
for i,p in enumerate(f):
 for j in range(3):
  k=(j+1)%3
  a=tuple(np.round(np.r_[v[p[j]],uv[i][j]],5));b=tuple(np.round(np.r_[v[p[k]],uv[i][k]],5));key=tuple(sorted([a,b]))
  if key in edges: parent[find(i)]=find(edges[key])
  else:edges[key]=i
groups={}
for i in range(len(f)):groups.setdefault(find(i),[]).append(i)
groups=sorted(groups.values(),key=lambda x:(-len(x),x[0]));(O/'islands.json').write_text(json.dumps(groups))
im=Image.open('assets/characters/psx-texture-retarget-v1/source/textures/CharacterMat_baseColor.png').resize((1200,1200));dr=ImageDraw.Draw(im);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
for k,ids in enumerate(groups):
 points=np.concatenate([np.array(uv[i]) for i in ids]);xyz=np.concatenate([v[f[i]] for i in ids]);print(k,'faces',len(ids),'uv',np.round(points.min(0),3),np.round(points.max(0),3),'xyz',np.round(xyz.min(0),2),np.round(xyz.max(0),2))
 for i in ids:
  pts=[(u*1200,(1-w)*1200) for u,w in uv[i]];dr.line(pts+[pts[0]],fill=(0,255,180),width=1)
 c=points.mean(0);p=(c[0]*1200,(1-c[1])*1200);dr.text(p,str(k),font=font,fill='yellow',stroke_width=2,stroke_fill='black')
im.save(O/'source-uv.png')
