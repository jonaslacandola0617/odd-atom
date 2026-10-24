"""Image-derived, object-layered Bezier reconstruction of the approved medicine art.
No raster content is embedded in the SVG. Temporary raster masks are tracing
inputs only. Requires pinned VTracer plus Pillow, NumPy, OpenCV and lxml.
"""
from pathlib import Path
import argparse,hashlib,json,re,sys,time,copy,os,subprocess
R=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(R/'.cache/vector-tools'),str(R/'.cache/motion-study')]
import cv2,numpy as np,vtracer,pathops
from fontTools.svgLib.path import parse_path
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image
from lxml import etree as E
S='http://www.w3.org/2000/svg';I='http://www.inkscape.org/namespaces/inkscape'
SRC=R/'assets/scenes/artwork-consistency-02/medicine-immune-defense.png'
CLEAN=R/'public/assets/artwork/scene-motion/medicine-clean.png'
TMP=R/'out/medicine-vector/layers';TMP.mkdir(parents=True,exist_ok=True)
OUT=R/'assets/scenes/medicine-vector';OUT.mkdir(parents=True,exist_ok=True)
raw=np.array(Image.open(SRC).convert('RGB'));h,w=raw.shape[:2]
reg=json.loads((R/'src/data/artwork-motion-registration.json').read_text())
# Derive semantic boundaries from the shared vector rendering, so its fitted
# curves and the object mattes agree at subpixel edges.
mask_master=TMP/'approved-polished.svg'
if not mask_master.exists():
 enlarged=TMP/'approved-source-2x.png';Image.open(SRC).resize((w*2,h*2),Image.Resampling.LANCZOS).save(enlarged)
 vtracer.convert_image_to_svg_py(str(enlarged),str(mask_master),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=12,color_precision=8,layer_difference=8,corner_threshold=120,length_threshold=8,max_iterations=10,splice_threshold=90,path_precision=3)
mask_preview=TMP/'approved-mask-render.png'
if not mask_preview.exists():
 environment=os.environ.copy();environment.update(XDG_CONFIG_HOME='/tmp/odd-vector-config',XDG_CACHE_HOME='/tmp/odd-vector-cache')
 subprocess.run(['inkscape',str(mask_master),'--export-type=png','--export-width='+str(w),'--export-height='+str(h),'--export-filename='+str(mask_preview)],check=True,capture_output=True,env=environment)
mask_image=np.array(Image.open(mask_preview).convert('RGBA'));mask_rgb=mask_image[:,:,:3].copy();mask_rgb[mask_image[:,:,3]<128]=raw[mask_image[:,:,3]<128]
Y,X=np.mgrid[:h,:w];rgb=mask_rgb.astype(float);rr,gg,bb=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]

def polygon(points):
 m=np.zeros((h,w),np.uint8);cv2.fillPoly(m,[np.array(points,np.int32)],255);return m

def outline(d):
 contours=[]
 for part in re.findall(r'M([^Z]+)Z',d):
  nums=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',part)];contours.append(np.round(np.array(nums).reshape(-1,2)).astype(np.int32))
 m=np.zeros((h,w),np.uint8);cv2.fillPoly(m,contours,255);return m

def largest(m,min_area=10):
 n,lab,stats,cent=cv2.connectedComponentsWithStats((m>0).astype(np.uint8));out=np.zeros_like(m,np.uint8)
 for i in range(1,n):
  if stats[i,cv2.CC_STAT_AREA]>=min_area:out[lab==i]=255
 return out

def fillholes(m):
 contours,_=cv2.findContours((m>0).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);out=np.zeros((h,w),np.uint8)
 cv2.drawContours(out,contours,-1,255,cv2.FILLED);return out

def rect(x,y,W,H):return polygon([(x,y),(x+W,y),(x+W,y+H),(x,y+H)])

def andm(a,b):return cv2.bitwise_and(a,b.astype(np.uint8))

def cm(cond):return cond.astype(np.uint8)*255

# Registered mattes establish silhouette; visible source colors refine limbs.
doctor=outline(reg['clinician']['outline'])
# The extraction was clipped at its own canvas bottom. Restore the real visible
# lower garment surfaces directly from the source colors, behind the front desk.
pants=cm((Y>730)&(Y<926)&(X>1080)&(X<1465)&(rr>55)&(bb>55)&(rr>gg*1.48))
coat=cm((Y>730)&(Y<926)&(X>1370)&(X<1555)&(rr>175)&(gg>145)&(bb>130))
doctor=cv2.bitwise_or(doctor,cv2.bitwise_or(pants,coat));doctor[Y>926]=0
# Exact focus-hand silhouette, avoiding the extraction's changed finger contour.
handroi=rect(950,598,123,81);skin=cm((rr>120)&(rr>gg*1.15)&(gg>bb*1.15))
doctor[598:679,950:1073]=andm(skin,handroi)[598:679,950:1073]
plant=outline(reg['plant']['outline']);plant=andm(plant,rect(0,380,305,345))
# Color-supported biological silhouettes, retaining the original major lobes.
immune=cm((X>175)&(X<710)&(Y>55)&(Y<505)&(bb>110)&(bb>rr*.76)&(rr>gg*.78));immune=largest(immune,100)
microbes=cm((X>440)&(X<675)&(Y>215)&(Y<450)&(gg>rr*1.35)&(gg>65)&(bb>70));microbes=fillholes(largest(microbes,20))
# Fill tiny interior gaps in the biological masks, but keep the teal holes out
# of the immune-cell layer so the microbes remain individually selectable.
immune=cv2.morphologyEx(immune,cv2.MORPH_CLOSE,np.ones((2,2),np.uint8));immune[microbes>0]=0
upper=(X-530)**2+(Y-280)**2<=(X-606)**2+(Y-382)**2
micro_a=andm(microbes,cm(upper));micro_b=andm(microbes,cm(~upper))
# Individual red-cell mattes start from bright rims; fill their dark centers.
rbc_seed=cm((X<855)&(Y<625)&(rr>204)&(rr>gg*1.7)&(rr>bb*1.65));rbc_seed=andm(rbc_seed,cv2.bitwise_not(immune))
rbc_seed=cv2.morphologyEx(rbc_seed,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
n,lab,stats,cent=cv2.connectedComponentsWithStats((rbc_seed>0).astype(np.uint8));rbcs=[]
for i in range(1,n):
 if stats[i,4]>650:
  component=cm(lab==i);contours,_=cv2.findContours(component,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE);m=np.zeros((h,w),np.uint8);cv2.fillConvexPoly(m,cv2.convexHull(max(contours,key=cv2.contourArea)),255);m[immune>0]=0;m[plant>0]=0;rbcs.append((float(cent[i,1]),float(cent[i,0]),m))
rbcs.sort()
# The microscope, glassware and plant pot have explicit object boundaries.
microscope=polygon([(927,400),(1017,354),(1040,354),(1052,365),(1090,354),(1119,368),(1116,393),(1081,428),(1064,444),(1061,470),(1020,481),(1020,505),(1043,514),(1050,544),(1023,551),(1023,571),(1072,574),(1073,593),(1018,600),(1016,682),(1068,687),(1075,728),(1049,742),(779,735),(775,690),(805,687),(806,548),(821,482),(930,470)])
# Cable is a separate editable object; its trace follows the existing artwork.
cable=polygon([(825,568),(840,572),(821,589),(793,644),(768,669),(725,670),(696,659),(675,642),(656,618),(660,611),(667,614),(680,638),(703,652),(728,659),(759,657),(778,642),(804,590)])
petri=polygon([(525,681),(688,681),(704,696),(704,729),(685,742),(541,744),(520,730),(520,695)])
tray=polygon([(184,667),(423,665),(441,683),(440,759),(184,763)])
pot=polygon([(0,585),(100,589),(165,602),(166,670),(155,731),(138,757),(0,760)]);pot[plant>0]=0
slide=polygon([(1062,541),(1150,565),(1119,583),(1049,559)]);slide[skin>0]=0;doctor[slide>0]=0
# Small source skin/slide overlaps stay in the clinician layer; the separate
# slide group contains the visible glass and specimen outside the hand.

# Assign every visible clinician pixel to a meaningful local editable part.
remaining=doctor.copy();human=[]
def take_human(key,label,cond):
 global remaining
 m=andm(remaining,cm(cond));remaining[m>0]=0
 if np.count_nonzero(m)>10:human.append((key,label,m))
take_human('clinician-hair','Silver curls',(Y<412)&(bb>rr*.83)&(gg>rr*.48))
take_human('clinician-face','Face and neck',(Y<465)&((rr>gg*1.16)&(gg>bb*1.2)))
take_human('clinician-trousers','Purple trousers',(Y>725)&(rr>gg*1.45)&(bb>gg*1.35))
take_human('clinician-scrubs','Jade scrubs',(Y>415)&(Y<790)&(gg>rr*1.1)&(bb>rr*1.1))
take_human('clinician-slide-hand','Specimen hand and forearm',(Y>475)&(Y<601)&(rr>gg*1.15)&(gg>bb*1.15))
take_human('clinician-focus-arm','Focus hand and forearm',(Y>=590)&(Y<735)&(rr>gg*1.15)&(gg>bb*1.15))
human.append(('clinician-coat','Lab coat, cuffs and remaining visible details',remaining))
# Eyes/brows are dark holes in the skin threshold. Put those feature pixels
# back into the face layer with source colors, rather than leaving a hole.
face_features=andm(doctor,rect(1103,266,110,127))
face_hull=fillholes(cm((Y<420)&(X>1090)&(X<1310)&(rr>gg*1.16)&(gg>bb*1.2)))
face_hull=andm(face_hull,cv2.dilate(doctor,np.ones((3,3),np.uint8)))
for i,(key,label,m) in enumerate(human):
 if key=='clinician-face':human[i]=(key,label,cv2.bitwise_or(m,face_hull))
 else:
  m=m.copy();m[face_hull>0]=0;human[i]=(key,label,m)

# Keep the full head color field in one geometric layer to avoid artificial
# seams between the original silver curls, skin and shaded neckline.
head=andm(doctor,rect(1030,105,420,367))
kept=[]
for key,label,m in human:
 m=m.copy();m[head>0]=0
 if np.count_nonzero(m)>10:kept.append((key,label,m))
human=[('clinician-head','Head, silver curls and neckline',head)]+kept

foreground=[('microscope-cable','Microscope cable',cable),('microscope','Microscope: body, eyepieces, stage and controls',microscope)]
foreground +=[(f'red-cell-{i+1:02d}',f'Red blood cell {i+1:02d}',m) for i,(_,_,m) in enumerate(rbcs)]
foreground +=[('immune-cell','Immune cell: cream and lavender membranes',immune),('microbe-upper','Upper teal microbe',micro_a),('microbe-lower','Lower teal microbe',micro_b)]
foreground +=[('plant-pot','Terracotta plant pot',pot),('foreground-foliage','Foreground plant leaves and stems',plant),('sample-tube-tray','Specimen tubes and tray',tray),('petri-dish','Glass culture dish and specimen',petri)]
foreground +=human+[('specimen-slide','Glass specimen slide',slide)]
union=np.zeros((h,w),np.uint8)
foreground=[(key,label,cv2.dilate(m,np.ones((3,3),np.uint8))) for key,label,m in foreground]
for key,label,m in foreground:
 if key=='immune-cell':m[cv2.dilate(microbes,np.ones((5,5),np.uint8))>0]=0
for _,_,m in foreground:union=cv2.bitwise_or(union,m)
# Original visible set surfaces over a completed vector underpainting. The
# completed underpainting makes hiding/repositioning the major groups useful.
hull_mask=np.zeros((h,w),np.uint8);points=cv2.findNonZero(doctor);cv2.fillConvexPoly(hull_mask,cv2.convexHull(points),255)
background_holes=cv2.bitwise_or(union,cv2.dilate(hull_mask,np.ones((9,9),np.uint8)));background_holes=cv2.bitwise_or(background_holes,cv2.dilate(microbes,np.ones((5,5),np.uint8)))
visible_bg=cv2.bitwise_not(background_holes)

prop_holes=np.zeros((h,w),np.uint8)
for m in [microscope,cable,pot,tray,petri]:prop_holes=cv2.bitwise_or(prop_holes,cv2.dilate(m,np.ones((5,5),np.uint8)))
completed_room_mask=cv2.bitwise_not(prop_holes)
FAST=True  # Rectangular curve cropping plus editable vector silhouette clips.
NS={None:S,'inkscape':I}
root=E.Element('{%s}svg'%S,nsmap=NS,width=str(w),height=str(h),viewBox=f'0 0 {w} {h}',version='1.1')
E.SubElement(root,'{%s}title'%S).text='Medicine scene — editable image-derived vector reconstruction'
E.SubElement(root,'{%s}desc'%S).text='Approved raster artwork reconstructed as grouped editable cubic Bezier paths. No embedded or linked raster images. Source-derived geometry; visible-surface vector reconstruction, not a hand-drawn-from-scratch illustration or a completed character rig.'
meta=E.SubElement(root,'{%s}metadata'%S);meta.text=json.dumps({'source':str(SRC.relative_to(R)),'sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'method':'VTracer cubic Bezier tracing with named object masks; background completion from the existing approved-scene animation clean plate.','raster_embeds':0})
# Native vector shading for newly exposed areas, behind the traced clean room.
base_defs=E.SubElement(root,'{%s}defs'%S)
for gid,stops in [('hidden-wall',[('#594063','0'),('#EFA960','1')]),('hidden-bench',[('#F1AF68','0'),('#FFCD83','1')])]:
 gradient=E.SubElement(base_defs,'{%s}linearGradient'%S,id=gid,x1='0',y1='0',x2='0',y2='1')
 for color,offset in stops:E.SubElement(gradient,'{%s}stop'%S,offset=offset,attrib={'stop-color':color})
base=E.SubElement(root,'{%s}g'%S,id='hidden-room-planes');base.set('{%s}groupmode'%I,'layer');base.set('{%s}label'%I,'00 · Editable hidden wall and workbench planes')
E.SubElement(base,'{%s}rect'%S,width=str(w),height=str(h),fill='#52435E')
E.SubElement(base,'{%s}path'%S,d='M640 310H1250V750H640Z',fill='url(#hidden-wall)')
E.SubElement(base,'{%s}path'%S,d='M0 658L1040 655Q1200 660 1190 733Q1120 809 0 818Z',fill='url(#hidden-bench)')
records=[];total=0

# Trace each source image once. Boolean Bezier intersections then give each
# named object its own real geometry, keeping a common color/curve solution at
# adjoining boundaries. There are no shared full-frame SVG images or uses.
cache={}
def source_paths(image,kind):
 if kind in cache:return cache[kind]
 srcfile=SRC if kind=='approved' else CLEAN
 scale=2 if kind=='approved' else 1
 if scale==2:
  enlarged=TMP/'approved-source-2x.png'
  if not enlarged.exists():Image.open(SRC).resize((w*2,h*2),Image.Resampling.LANCZOS).save(enlarged)
  srcfile=enlarged
 outfile=TMP/(kind+'-polished.svg')
 if not outfile.exists():
  vtracer.convert_image_to_svg_py(str(srcfile),str(outfile),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=12 if kind=='approved' else 2,color_precision=8 if kind=='approved' else 7,layer_difference=8 if kind=='approved' else 20,corner_threshold=120 if kind=='approved' else 90,length_threshold=8 if kind=='approved' else 2,max_iterations=10,splice_threshold=90 if kind=='approved' else 60,path_precision=3)
 parsed=E.parse(str(outfile));items=[]
 for element in parsed.findall('.//{%s}path'%S):
  nums=[float(n) for n in re.findall(r'-?\d+(?:\.\d+)?',element.get('transform',''))];tx,ty=nums if len(nums)==2 else (0,0)
  geometry=pathops.Path();parse_path(element.get('d'),TransformPen(geometry.getPen(),(1/scale,0,0,1/scale,tx/scale,ty/scale)))
  items.append((geometry,element.get('fill'),geometry.bounds))
 cache[kind]=items;return items

def mask_geometry(mask):
 contours,_=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
 geometry=pathops.Path();geometry.fillType=pathops.FillType.EVEN_ODD
 for contour in contours:
  pts=cv2.approxPolyDP(contour,.35,True)[:,0,:]
  if len(pts)<3:continue
  geometry.moveTo(float(pts[0][0]),float(pts[0][1]))
  for x,y in pts[1:]:geometry.lineTo(float(x),float(y))
  geometry.close()
 return geometry

def svg_d(geometry):
 pen=SVGPathPen(None,ntos=lambda n:format(n,'.3f').rstrip('0').rstrip('.') if n else '0');geometry.draw(pen);return pen.getCommands()

def add_layer(key,label,mask=None,image=raw,precision=8,diff=3,scale=1,parent=root):
 global total
 start=time.time();kind='completed' if key=='room-underpainting' or key in ['microscope','microscope-cable'] else 'approved'
 geometry_mask=mask_geometry(mask) if mask is not None else None
 bounds=geometry_mask.bounds if geometry_mask is not None else (0,0,w,h)
 rectangle=pathops.Path();rectangle.moveTo(bounds[0],bounds[1]);rectangle.lineTo(bounds[2],bounds[1]);rectangle.lineTo(bounds[2],bounds[3]);rectangle.lineTo(bounds[0],bounds[3]);rectangle.close()
 integral=cv2.integral((mask>0).astype(np.uint8)) if mask is not None else None
 layer=E.SubElement(parent,'{%s}g'%S,id=key);layer.set('{%s}groupmode'%I,'layer');layer.set('{%s}label'%I,label);layer.set('data-object',key)
 if mask is not None and FAST:
  clip_defs=E.SubElement(layer,'{%s}defs'%S);clip=E.SubElement(clip_defs,'{%s}clipPath'%S,id=key+'-contour');clip_path=E.SubElement(clip,'{%s}path'%S,d=svg_d(geometry_mask));clip_path.set('clip-rule','evenodd')
  paint=E.SubElement(layer,'{%s}g'%S);paint.set('clip-path','url(#'+key+'-contour)')
 else:paint=layer
 count=0
 for geometry,fill,b in source_paths(image,kind):
  if b[2]<bounds[0] or b[0]>bounds[2] or b[3]<bounds[1] or b[1]>bounds[3]:continue
  if geometry_mask is None:piece=geometry
  else:
   x0=max(0,int(np.floor(b[0])));y0=max(0,int(np.floor(b[1])));x1=min(w,int(np.ceil(b[2]))+1);y1=min(h,int(np.ceil(b[3]))+1)
   if x1<=x0 or y1<=y0:continue
   covered=int(integral[y1,x1]-integral[y0,x1]-integral[y1,x0]+integral[y0,x0]);area=(x1-x0)*(y1-y0)
   if not covered:continue
   if covered==area:piece=geometry
   else:
    try:piece=pathops.op(geometry,rectangle if FAST else geometry_mask,pathops.PathOp.INTERSECTION,fix_winding=True,keep_starting_points=False)
    except pathops.PathOpsError as error:raise RuntimeError('Invalid vector intersection in '+key) from error
  if not len(piece):continue
  commands=svg_d(piece)
  if not commands:continue
  count+=1;path=E.SubElement(paint,'{%s}path'%S,id=f'{key}-shape-{count:04d}',d=commands,fill=fill)
  path.set('{%s}label'%I,f'{label} / color shape {count}')
 total+=count
 records.append({'id':key,'label':label,'paths':count,'bounds':list(bounds),'source_vector':kind,'geometry':'Independent cubic Bezier paths, geometrically trimmed to the object silhouette' if not FAST else 'Bezier geometry with vector silhouette clips','trace_scale':2 if kind=='approved' else 1})
 print(key,count,round(time.time()-start,2),flush=True);return layer

add_layer('room-underpainting','01 · Completed room underpainting',completed_room_mask,image=np.array(Image.open(CLEAN).convert('RGB')),precision=7,diff=20)
add_layer('room-visible','02 · Approved visible room, window, cabinetry and workbench',visible_bg,diff=4)
# Foreground authored groups are independently editable real paths. Room
# underpainting remains behind them when a group is hidden or moved.
clinician_group=None
for key,label,m in foreground:
 if key.startswith('clinician-'):
  if clinician_group is None:
   clinician_group=E.SubElement(root,'{%s}g'%S,id='clinician');clinician_group.set('{%s}groupmode'%I,'layer');clinician_group.set('{%s}label'%I,'Clinician · editable character parts')
  add_layer(key,label,m,scale=2 if key in ['clinician-face','clinician-hair'] else 1,diff=5,parent=clinician_group)
 else:add_layer(key,label,m,diff=3)
# Source-matched editable purple well surfaces beneath the microbes.
immune_layer=root.find(".//*[@id='immune-cell']")
if immune_layer is not None:
 well=E.Element('{%s}g'%S,id='immune-hidden-well');well.set('{%s}label'%I,'Editable occluded purple well surfaces')
 combined=cv2.bitwise_or(immune,cv2.bitwise_or(micro_a,micro_b));area_mask=mask_geometry(combined)
 for i,(cx,cy,rx,ry,c0,c1) in enumerate([(535,285,83,83,'#5B2597','#A45CD2'),(600,380,86,81,'#793BB3','#B976DA')]):
  grad=E.SubElement(base_defs,'{%s}linearGradient'%S,id=f'cell-well-{i}',x1='0',y1='1',x2='1',y2='0')
  E.SubElement(grad,'{%s}stop'%S,offset='0',attrib={'stop-color':c0});E.SubElement(grad,'{%s}stop'%S,offset='1',attrib={'stop-color':c1})
  ellipse=pathops.Path();parse_path(f'M{cx-rx} {cy}C{cx-rx} {cy-ry*.5523} {cx-rx*.5523} {cy-ry} {cx} {cy-ry}C{cx+rx*.5523} {cy-ry} {cx+rx} {cy-ry*.5523} {cx+rx} {cy}C{cx+rx} {cy+ry*.5523} {cx+rx*.5523} {cy+ry} {cx} {cy+ry}C{cx-rx*.5523} {cy+ry} {cx-rx} {cy+ry*.5523} {cx-rx} {cy}Z',ellipse.getPen())
  piece=pathops.op(ellipse,area_mask,pathops.PathOp.INTERSECTION)
  E.SubElement(well,'{%s}path'%S,d=svg_d(piece),fill=f'url(#cell-well-{i})')
 immune_layer.insert(0,well)

# Rebuild the two small solid eyes as smooth native SVG ellipses. Local
# editable skin gradients complete the surface beneath them for expression edits.
head_layer=root.find(".//*[@id='clinician-head']")
if head_layer is not None:
 under=E.SubElement(head_layer,'{%s}g'%S,id='face-under-eyes');under.set('{%s}label'%I,'Editable skin beneath the eyes')
 eyes=E.SubElement(head_layer,'{%s}g'%S,id='clinician-eyes');eyes.set('{%s}label'%I,'Eyes · two native editable ellipses')
 dark=cm((X>1115)&(X<1202)&(Y>300)&(Y<352)&(rr<90)&(gg<70)&(bb<125))
 contours,_=cv2.findContours(dark,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 eye_contours=sorted([c for c in contours if cv2.contourArea(c)>80],key=lambda c:cv2.boundingRect(c)[0])
 for i,contour in enumerate(eye_contours):
  (cx,cy),(ax,ay),angle=cv2.fitEllipse(contour);rx,ry=ax/2,ay/2
  # Nearby skin samples exclude dark features and keep the original warm tint.
  samples=raw[max(0,int(cy-20)):int(cy+21),max(0,int(cx-19)):int(cx+20)]
  valid=(samples[:,:,0]>160)&(samples[:,:,1]>55)&(samples[:,:,0]>samples[:,:,1]*1.2)
  top=samples[:20];bottom=samples[20:]
  def color(part):
   ok=(part[:,:,0]>160)&(part[:,:,1]>55)&(part[:,:,0]>part[:,:,1]*1.2)
   a=np.median(part[ok],axis=0).astype(int);return '#%02x%02x%02x'%tuple(a)
  gid=f'eye-skin-{i}';grad=E.SubElement(base_defs,'{%s}linearGradient'%S,id=gid,x1='0',y1='0',x2='0',y2='1')
  E.SubElement(grad,'{%s}stop'%S,offset='0',attrib={'stop-color':color(top)});E.SubElement(grad,'{%s}stop'%S,offset='1',attrib={'stop-color':color(bottom)})
  transform=f'rotate({angle:.3f} {cx:.3f} {cy:.3f})'
  E.SubElement(under,'{%s}ellipse'%S,cx=f'{cx:.3f}',cy=f'{cy:.3f}',rx=f'{rx+2:.3f}',ry=f'{ry+2:.3f}',fill=f'url(#{gid})',transform=transform)
  E.SubElement(eyes,'{%s}ellipse'%S,id=f'eye-{i+1}',cx=f'{cx:.3f}',cy=f'{cy:.3f}',rx=f'{rx:.3f}',ry=f'{ry:.3f}',fill='#211039',transform=transform)

# Keep adjoining vector-layer antialias coverage from exposing a dark seam.
edge_filter=E.SubElement(base_defs,'{%s}filter'%S,id='vector-edge-coverage',x='-1%',y='-1%',width='102%',height='102%',attrib={'color-interpolation-filters':'sRGB'})
transfer=E.SubElement(edge_filter,'{%s}feComponentTransfer'%S);E.SubElement(transfer,'{%s}feFuncA'%S,type='linear',slope='3')
for group in root.findall('.//{%s}g'%S):
 if group.get('data-object'):group.set('filter','url(#vector-edge-coverage)')

# Clip everything to the original artboard; this is a vector rectangle only.
defs=E.SubElement(root,'{%s}defs'%S);clip=E.SubElement(defs,'{%s}clipPath'%S,id='artboard');E.SubElement(clip,'{%s}rect'%S,width=str(w),height=str(h))
for child in root:
 if E.QName(child).localname=='g':child.set('clip-path','url(#artboard)')
path=OUT/'medicine-scene-editable.svg';E.ElementTree(root).write(str(path),encoding='UTF-8',xml_declaration=True,pretty_print=False)
report={'file':str(path.relative_to(R)),'source_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'dimensions':[w,h],'method':'Image-derived cubic Bezier reconstruction with independent object paths, editable vector silhouette clips, native eye ellipses and gradient completions.','paths':total,'named_layers':len(records)+2,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'layers':records,'source_trace_settings':{'supersampling':2,'color_precision':8,'layer_difference':8,'corner_threshold':120,'length_threshold':8,'splice_threshold':90,'speckle_filter':12},'raster_embeds':0,'native_eye_ellipses':len(eye_contours),'limits':'Shading is represented by traced color regions. Visible surfaces are reconstructed; hidden limb/face contours and a complete animation rig are not authored.'}
D=R/'docs/production/medicine-vector';D.mkdir(parents=True,exist_ok=True);(D/'build.json').write_text(json.dumps(report,indent=2)+'\n');print('Saved',path,total,'paths',path.stat().st_size,flush=True)
