"""Validate vector-only structure and render independent editing demonstrations."""
from pathlib import Path
import colorsys,hashlib,json,os,re,subprocess
import numpy as np
from lxml import etree as E
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1];A=R/'assets/scenes/medicine-vector';D=R/'docs/production/medicine-vector';T=R/'out/medicine-vector'
S='http://www.w3.org/2000/svg';I='http://www.inkscape.org/namespaces/inkscape'
SVG=A/'medicine-scene-editable.svg';REF=R/'assets/scenes/artwork-consistency-02/medicine-immune-defense.png'
D.mkdir(parents=True,exist_ok=True);T.mkdir(parents=True,exist_ok=True)
env=os.environ.copy();env.update(XDG_CONFIG_HOME='/tmp/odd-vector-config',XDG_CACHE_HOME='/tmp/odd-vector-cache')
def render(src,dst):
 p=subprocess.run(['inkscape',str(src),'--export-type=png','--export-filename='+str(dst)],env=env,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr)
root=E.parse(str(SVG)).getroot();ids=[n.get('id') for n in root.iter() if n.get('id')];assert len(ids)==len(set(ids))
blocked={'image','feImage','foreignObject','script','video','audio','canvas'}
assert not any(E.QName(n).localname in blocked for n in root.iter())
for n in root.iter():
 for key,value in n.attrib.items():
  if E.QName(key).localname in ['href','src']:assert value.startswith('#')
  for target in re.findall(r'url\(#([^)]*)\)',value):assert target in ids,target
paths=root.findall('.//{%s}path'%S);layers=[n for n in root.iter('{%s}g'%S) if n.get('{%s}groupmode'%I)=='layer']
assert len(paths)>1000 and len(layers)>20
assert (root.get('width'),root.get('height'))==('1672','941')
assert root.find(".//*[@id='clinician-eyes']") is not None
render(SVG,A/'medicine-scene-preview.png')
# This proof changes XML vector geometry/styles only. It uses no raster edits.
demo=E.parse(str(SVG));droot=demo.getroot()
for key in ['clinician-eyes']:
 node=droot.find(f".//*[@id='{key}']");assert node is not None;node.set('display','none')
head=droot.find(".//*[@id='clinician-head']")
lids=E.SubElement(head,'{%s}g'%S,id='demo-native-eyelids')
for eye in droot.findall(".//*[@id='clinician-eyes']/{%s}ellipse"%S):
 cx,cy,rx,ry=[float(eye.get(k)) for k in ['cx','cy','rx','ry']]
 E.SubElement(lids,'{%s}path'%S,d=f'M{cx-rx} {cy}Q{cx} {cy+ry*.4} {cx+rx} {cy}',fill='none',stroke='#211039',attrib={'stroke-width':'3','stroke-linecap':'round','transform':eye.get('transform','')})
microbe=droot.find(".//*[@id='microbe-upper']");microbe.set('transform','translate(28 -16)')
changed=0
for p in microbe.findall('.//{%s}path'%S):
 fill=p.get('fill','')
 if not re.fullmatch(r'#[0-9a-fA-F]{6}',fill):continue
 r,g,b=[int(fill[i:i+2],16)/255 for i in [1,3,5]]
 if g>r*1.15 and b>r*1.15:
  hue,sat,val=colorsys.rgb_to_hsv(r,g,b);rgb=colorsys.hsv_to_rgb(.075,sat,val);p.set('fill','#'+''.join(f'{round(c*255):02x}' for c in rgb));changed+=1
assert changed>10
demo.write(str(T/'editing-demo.svg'),encoding='UTF-8',xml_declaration=True);render(T/'editing-demo.svg',D/'editing-demo.png')
# A separate subject-removal proof catches large duplicated painted subjects.
hidden=E.parse(str(SVG));hidden.getroot().find(".//*[@id='clinician']").set('display','none');hidden.write(str(T/'clinician-hidden.svg'),encoding='UTF-8',xml_declaration=True);render(T/'clinician-hidden.svg',D/'clinician-hidden.png')
source=Image.open(REF).convert('RGB');preview=Image.open(A/'medicine-scene-preview.png').convert('RGB');assert source.size==preview.size
err=np.asarray(preview,dtype=float)-np.asarray(source,dtype=float)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(im,xy,s,size=20):ImageDraw.Draw(im).text(xy,s,fill='#FFF4E8',font=ImageFont.truetype(font,size))
b=Image.new('RGB',(1960,1210),'#21172D');text(b,(20,14),'Approved artwork / editable SVG reconstruction',28);text(b,(20,54),'Left: original PNG. Right: actual SVG render. Detail crops below use native source pixels; no equivalence score.',17)
for x,im,title in [(20,source,'APPROVED RASTER SOURCE'),(1000,preview,'EDITABLE VECTOR RENDER')]:
 text(b,(x,100),title,22);a=im.copy();a.thumbnail((940,540),Image.Resampling.LANCZOS);b.paste(a,(x,140))
for x,im,title in [(20,source,'Source face and hand'),(1000,preview,'SVG face and hand')]:
 text(b,(x,710),title,22);b.paste(im.crop((1060,150,1410,430)),(x,755));b.paste(im.crop((960,505,1340,735)),(x+405,755))
b.save(D/'comparison.jpg',quality=96)
record={'artifact':str(SVG.relative_to(R)),'sha256':hashlib.sha256(SVG.read_bytes()).hexdigest(),'bytes':SVG.stat().st_size,'paths':len(paths),'layers':len(layers),'native_ellipses':len(root.findall('.//{%s}ellipse'%S)),'gradients':len(root.findall('.//{%s}linearGradient'%S)),'embedded_or_linked_rasters':0,'scripts_or_foreign_objects':0,'all_reference_targets_internal_and_present':True,'unique_ids':True,'inkscape_render':'passed','edit_demo':{'hidden_groups':['clinician-eyes'],'moved_group':'microbe-upper','recolored_vector_paths':changed,'native_closed_eyelids_added':2},'source_sha256':hashlib.sha256(REF.read_bytes()).hexdigest(),'source_size':list(source.size),'numeric_reconstruction_error':{'mean_absolute_RGB_error_0_to_255':float(abs(err).mean()),'root_mean_square_RGB_error':float(np.sqrt(np.mean(err**2)))},'limits':'Image-derived vector reconstruction with many traced color regions and vector clips. Shading/contour simplification differs from the source. Geometry/statistics do not prove equal aesthetic quality. Hidden surfaces are approximate; this is not a complete animation rig.'}
assert record['source_sha256']=='d9f245e4aad1866de4b29f10a4dd45c7e9312cd3450dd07d68e36f750ed3fd5e'
(D/'validation.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({k:record[k] for k in ['bytes','paths','layers','gradients','embedded_or_linked_rasters','inkscape_render','numeric_reconstruction_error']},indent=2))
