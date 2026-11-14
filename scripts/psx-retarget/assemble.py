from pathlib import Path
import json,hashlib,shutil,zipfile,textwrap
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2];O=R/'assets/characters/psx-texture-retarget-v1';T=R/'out/psx-retarget'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F=lambda size:ImageFont.truetype(font,size)
regions=json.loads((O/'UV_Regions.json').read_text())['face_regions'];uv=json.loads((T/'target-uv.json').read_text())
atlas=Image.open(O/'Attached_Texture.png').convert('RGB');overlay=atlas.copy();d=ImageDraw.Draw(overlay)
colors={'head':'#ffd66b','neck':'#ffab8c','hands':'#ffab8c','arms':'#ffab8c','sleeves':'#76e5df','shirt-front':'#76e5df','shirt-back':'#76e5df','jeans-front':'#b5b8ff','jeans-back':'#b5b8ff','shoes':'#e8e0bc'}
for i,tri in enumerate(uv):
 pts=[(u*1254,(1-v)*1254) for u,v in tri];d.line(pts+[pts[0]],fill=colors[regions[str(i)]],width=1)
overlay.save(O/'Attached_Atlas_UV.png')
P=O/'previews';P.mkdir(exist_ok=True)
for name in ['front','back','profile','three-quarter','head']:shutil.copy2(T/('retarget-'+name+'.png'),P/(name+'.png'))
shutil.copy2(T/'original-front.png',P/'original-front.png');shutil.copy2(T/'glb-head.png',P/'glb-reimport-head.png')
# A before/after review, actual renders at matching scale, not a generated mockup.
sheet=Image.new('RGB',(2400,1500),'#222629');d=ImageDraw.Draw(sheet);d.text((30,20),'PSX character | Pixel-atlas UV remap',font=F(36),fill='white');d.text((30,66),'Original geometry retained · 744 triangles · User-supplied pixel texture · Nearest filtering',font=F(23),fill='#b5c7ce')
for j,(fn,label) in enumerate([('original-front','Original'),('front','Remapped · Front'),('three-quarter','Three-quarter'),('back','Back'),('profile','Profile')]):
 x=20+j*476;d.text((x,115),label,font=F(24),fill='white');im=Image.open(P/(fn+'.png')).convert('RGB').resize((460,613),Image.Resampling.LANCZOS);sheet.paste(im,(x,155))
for j,(im,label) in enumerate([(Image.open(P/'glb-reimport-head.png'),'Head · Reimported GLB'),(atlas,'Exact supplied atlas'),(overlay,'Editable UV layout')]):
 x=[20,510,1150][j];d.text((x,798),label,font=F(24),fill='white')
 if j==0:im=im.resize((460,613),Image.Resampling.NEAREST)
 else:im=im.resize((610,610),Image.Resampling.NEAREST)
 sheet.paste(im,(x,840))
x=1790;y=842
for heading,body in [('Verified','Saved Blender file reopened. GLB reimported. Texture embedded byte-for-byte. Triangle positions preserved within 0.0000004 m.'),('Scope','UV and material edit. Original A-pose, silhouette, collar and sleeve volume retained. No rig or animation exists in the source.'),('Atlas coverage','Palms and shoe sides reuse nearby atlas regions. No watch geometry exists, so the watch patch is unused.'),('Blender','Tested: 4.3.2. For 2.93 use the GLB import option; 2.93 has not been tested.')]:
 d.text((x,y),heading,font=F(23),fill='#83dfd3');y+=34
 for line in textwrap.wrap(body,39):d.text((x,y),line,font=F(20),fill='#d1d7da');y+=28
 y+=21
d.text((20,1465),'Source: Jim Wing · 90s Survival Horror Protagonist (PSX Style) · CC BY 4.0 · Attribution in README',font=F(18),fill='#a8b5bc');sheet.save(O/'PSX_ReviewSheet.png')
report=json.loads((O/'Verification.json').read_text());report['render_comparison']={}
for n in ['front','three-quarter','head']:
 a=np.array(Image.open(T/('retarget-'+n+'.png'))).astype(float);b=np.array(Image.open(T/('glb-'+n+'.png'))).astype(float);report['render_comparison'][n]={'mean_absolute_channel_error_0_255':float(np.abs(a-b).mean()),'max_channel_error':float(np.abs(a-b).max()),'note':'Matching cameras; float32 coordinate/UV and renderer sampling differences are included.'}
report['visual_review']={'inspected':['front','back','profile','three-quarter','head','reimported GLB head'],'changes_after_inspection':['Reprojected vertical shoe faces to remove stretched stripes.','Kept fingertips inside skin chart.','Moved rear crown triangle chart to avoid face-color bleed.','Refit eyes, nose and mouth to replacement pixel atlas.','Corrected rear pelvis-to-leg chart orientation and neck chart continuity.'],'remaining':['Inherited jacket/collar/long-sleeve silhouette remains under short-sleeve texture.','Palms and shoe sides lack dedicated atlas art and reuse nearby regions.','Sparse head geometry stretches large pixel blocks on oblique surfaces; this is not a rebuilt head or hair model.'],'approval':'Pending user review.'}
(O/'Verification.json').write_text(json.dumps(report,indent=2))
provenance={'model_source':'User-uploaded 90s_survival_horror_protagonist_psx_style.zip','model_title':'90s Survival Horror Protagonist (PSX Style)','author':'Jim Wing','license':'CC-BY-4.0','model_url':'https://sketchfab.com/3d-models/90s-survival-horror-protagonist-psx-style-cb4302ee78264867ab1d77b2cb59eacd','texture_source':'https://drive.google.com/file/d/1ILEojXpcWdaxXDZmyzi7Q-W1HK1cPInw/view','texture_sha256':sha(O/'Attached_Texture.png'),'texture_dimensions':[1254,1254],'texture_modified':False,'superseded_texture':'Earlier realistic atlas was explicitly replaced by the user; not used in these deliveries.','source_file_hashes':{str(p.relative_to(O)):sha(p) for p in sorted((O/'source').rglob('*')) if p.is_file()}}
(O/'PROVENANCE.json').write_text(json.dumps(provenance,indent=2))
# No Blender autosave backups in the delivery.
for p in O.glob('*.blend1'):p.unlink()
print('Assembled',O/'PSX_ReviewSheet.png')
