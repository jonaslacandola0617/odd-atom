"""Reproducible selected artwork palettes, motion masks and comparison plates.

These are measurements of flattened pixels, never recovered authored assets.
Source crops remain reference evidence; demonstration artwork is original.
"""
from pathlib import Path
import json
import shutil
from PIL import Image,ImageDraw,ImageFont
from common import ROOT,REPO,dependency_modules,digest,write_json

cv2,np=dependency_modules();cv2.setNumThreads(1)
OUT=ROOT/'analysis/visual-comparisons';OUT.mkdir(parents=True,exist_ok=True)
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
SMALL=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
SELECTIONS=[
 ('creator','reference_fd02030ee890','creator-reaction',119,2159),
 ('farmers','reference_3dab4435d188','farmer-design',0,18600),
 ('screen-light','reference_9a02fcef71d3','scientist-design',0,16800),
 ('bird','reference_fd02030ee890','bird-design',0,120),
 ('rock-contact','reference_2e586456bc4d','root-rock-change',119,27239),
 ('forest','reference_46db30e386c9','forest-layer-motion',0,90),
]

palettes=[]
for label,video,case,local,frame in SELECTIONS:
    source=ROOT/'analysis/keyframes'/video/case/f'frame-{local:06}.png'
    target=source.with_name('native-design-selected.png')
    if not target.exists():shutil.copyfile(source,target)
    image=Image.open(source).convert('RGB')
    region={'creator':(1002,347,1589,836),'farmers':(230,260,760,1280)}.get(label)
    sample=image.crop(region) if region else image
    # Median-cut palette is a frame-local approximation, not a studio swatch file.
    q=sample.resize((640,360),Image.Resampling.BOX).quantize(colors=12,method=Image.Quantize.MEDIANCUT)
    colors=sorted(q.getcolors(),reverse=True);palette=q.getpalette()
    swatches=[{'hex':'#'+''.join(f'{c:02X}' for c in palette[i*3:i*3+3]),'pixel_fraction':n/(640*360)} for n,i in colors]
    palettes.append({'label':label,'video_id':video,'frame_index':frame,'pts_seconds':frame/60,
                     'native_evidence':str(target.relative_to(ROOT)),'sha256':digest(source),
                     'sample_region_native_xyxy':region,'swatches':swatches})
sheet=Image.new('RGB',(1440,960),'#171c2d');d=ImageDraw.Draw(sheet)
for i,p in enumerate(palettes):
    x=i%2*720;y=i//2*320
    im=Image.open(ROOT/p['native_evidence']).convert('RGB');im.thumbnail((370,240));sheet.paste(im,(x+8,y+38))
    d.text((x+8,y+8),f"{p['label']} / {p['video_id']} / f{p['frame_index']}",font=SMALL,fill='white')
    for k,c in enumerate(p['swatches']):
        cx=x+390+(k%3)*106;cy=y+42+(k//3)*60
        d.rectangle((cx,cy,cx+96,cy+31),fill=c['hex']);d.text((cx,cy+33),c['hex'],font=SMALL,fill='white')
sheet.save(OUT/'frame-local-palettes.jpg',quality=94)
write_json(OUT/'frame-local-palettes.json',{'method':'Recorded region (or full frame), 640x360 BOX resize then 12-color median-cut. Background area biases full-frame counts; no universal palette claimed. Creator/farmer swatches sample selected local regions; inset retains context.','samples':palettes})

# Original vs reference comparison at comparable face display size.
creator=Image.open(ROOT/'analysis/keyframes/reference_fd02030ee890/creator-reaction/native-crop-000119.png').convert('RGB').crop((140,100,850,740))
mira=Image.open(REPO/'out/animation-mastery/encoded-review/acting-110.png').convert('RGB').crop((695,215,955,450))
compare=Image.new('RGB',(1440,820),'#171c2d');d=ImageDraw.Draw(compare)
for i,(im,title) in enumerate([(creator,'Reference creator / f2159 / 35.983 s'),(mira,'Original Mira / encoded f110 / 3.667 s')]):
    scale=min(680/im.width,620/im.height)
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);x=i*720+20
    compare.paste(im,(x,55));d.text((x,15),title,font=FONT,fill='white')
d.text((20,712),'Compare silhouette, eye/brow shapes, color boundaries and identity; different people and poses.',font=FONT,fill='white')
d.text((20,748),'Crops resized for display (Mira enlarged). No pixel-error score between different drawings.',font=FONT,fill='#A2DECF')
compare.save(OUT/'character-construction-comparison.jpg',quality=95)

reference=Image.open(ROOT/'analysis/keyframes/reference_2e586456bc4d/root-rock-change/frame-000119.png').convert('RGB')
original=Image.open(REPO/'out/animation-mastery/encoded-review/explanation-165.png').convert('RGB')
compare=Image.new('RGB',(1920,650),'#171c2d');d=ImageDraw.Draw(compare)
for i,(im,title) in enumerate([(reference,'Reference / f27239 / 453.983 s / crack, force and mineral particles'),(original,'Original B / f165 / 5.500 s / contact, detour, water response')]):
    im.thumbnail((950,535),Image.Resampling.LANCZOS);compare.paste(im,(i*960+5,55));d.text((i*960+8,12),title,font=SMALL,fill='white')
d.text((12,605),'Different mechanisms. Compare contrast, continuous contours, layering, texture and cause/effect staging.',font=FONT,fill='white')
compare.save(OUT/'root-explanation-comparison.jpg',quality=94)

# Track only the lime hull within a broad, fixed native-pixel ROI. Flames/wake
# are excluded by color where possible; damage flashing can reduce the mask.
base=ROOT/'analysis/keyframes/reference_9a02fcef71d3/boat-collision-and-turn'
rows=[]
for i in range(120):
    rgb=np.asarray(Image.open(base/f'frame-{i:06}.png').convert('RGB'))
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    mask=((g>145)&(g>r*1.35)&(g>b*1.2)&(r<180)&(b<165)).astype(np.uint8)
    mask[:80]=0;mask[850:]=0;mask[:,:400]=0;mask[:,1600:]=0
    count,labels,stats,centers=cv2.connectedComponentsWithStats(mask,8)
    candidates=[j for j in range(1,count) if stats[j,cv2.CC_STAT_AREA]>120]
    if not candidates:
        rows.append({'frame_index':12660+i,'pts_seconds':(12660+i)/60,'mask_found':False});continue
    j=max(candidates,key=lambda k:stats[k,cv2.CC_STAT_AREA]);ys,xs=np.where(labels==j)
    cov=np.cov(np.stack([xs,ys]));values,vectors=np.linalg.eigh(cov);axis=vectors[:,np.argmax(values)]
    angle=float(np.degrees(np.arctan2(axis[1],axis[0]))%180)
    rows.append({'frame_index':12660+i,'pts_seconds':(12660+i)/60,'mask_found':True,
                 'centroid_native_px':centers[j].tolist(),'area_native_px':int(len(xs)),
                 'major_axis_degrees_mod180':angle})
write_json(ROOT/'analysis/motion-tracks/reference_9a02fcef71d3/boat-lime-hull-mask.json',{
 'video_id':'reference_9a02fcef71d3','object_id':'ai-race-green-hull','source_frame_range':[12660,12780],
 'basis':'measured','confidence':.78,'method':'Largest connected lime-color component in fixed ROI, native PNGs; covariance major axis modulo180.',
 'limitations':'Threshold and damage-opacity changes alter the visible mask. Centroid is not pivot. Axis has180-degree ambiguity. Does not recover source spline or steering model.',
 'samples':rows})
print('Saved six source-local palettes, two honest construction comparisons and native hull-mask series.')
