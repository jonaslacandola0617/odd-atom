"""Comparison sheet from actual saved-file renders and the exact user reference."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,zipfile
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/characters/nico-lowpoly-v2';R=OUT/'review';V1=ROOT/'assets/characters/nico-lowpoly-v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
v=json.loads((OUT/'verification.json').read_text());build=json.loads((OUT/'construction.json').read_text());reference=OUT/'references/Nico_Original_Turnaround.png'
assert sha(reference)==json.loads((OUT/'references/source.json').read_text())['sha256']
assert v['blend_sha256']==sha(OUT/'Nico_LowPoly.blend') and v['glb_sha256']==sha(OUT/'Nico_LowPoly.glb')
crop=json.loads((OUT/'head-crop.json').read_text());head=Image.open(R/crop['source']).convert('RGB').crop(tuple(crop['box']))
small=head.resize((round(head.width*96/head.height),96),Image.Resampling.LANCZOS);small.save(OUT/'Nico_Head_96px.png')
sheet=Image.new('RGB',(3600,2850),'#202629');d=ImageDraw.Draw(sheet)
def font(n,b=False):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n)
def text(x,y,s,n=28,c='#DFE5E1',b=False):d.text((x,y),s,font=font(n,b),fill=c)
def picture(p,x,y,w,h):
    im=Image.open(p).convert('RGB');im.thumbnail((w,h),Image.Resampling.LANCZOS);sheet.paste(im,(x,y));return im
text(40,25,'Nico — v1 / v2',48,b=True);text(600,44,'ACTUAL BLENDER RENDERS • MATCHED CAMERAS / NEUTRAL MATERIALS / LIGHTING',25,c='#B3C0B9')
for x,view,label in [(40,'front','Front'),(925,'profile','Profile'),(1810,'back','Back'),(2695,'elevated-three-quarter','Elevated three-quarter')]:
    text(x,110,label,32,b=True)
    for i,version in enumerate([1,2]):
        xx=x+i*425;text(xx,157,f'v{version}',26,c='#BECBC4');picture(R/f'v{version}-gray-{view}.png',xx,200,410,515)
text(40,745,'Same 0.410 m orthographic head framing. Gray comparisons use untextured hair, skin and frame materials.',25,c='#B3C0B9')
d.line((40,805,3560,805),fill='#56645B',width=2)
text(40,835,'Original turnaround — exact user-supplied file',30,b=True);picture(reference,40,890,1120,747)
for x,view,label in [(1240,'front','Solid hair / front'),(2025,'profile','Solid hair / profile'),(2810,'back','Solid hair / back')]:
    text(x,835,label,29,b=True)
    for i,version in enumerate([1,2]):
        xx=x+i*350;text(xx,883,f'v{version}',25,c='#BECBC4');picture(R/f'v{version}-hair-mask-{view}.png',xx,925,325,410)
text(1240,1390,'Black is actual hair geometry; white head/ears occlude it.',26,c='#B3C0B9')
text(1240,1435,'Frames and brows are hidden in these masks so they cannot cut false holes.',24,c='#B3C0B9')
text(1240,1510,'V2: forward sweep • uneven fringe • bent crown lock • ear step • tapered nape',26)
d.line((40,1690,3560,1690),fill='#56645B',width=2)
text(40,1725,'Finished v2 head',30,b=True);picture(R/'v2-finished-elevated-three-quarter.png',40,1780,650,810)
text(760,1725,'Lower-leg fabric / same crop and scale',29,b=True)
for x,version,p in [(760,1,V1/'review/body-front.png'),(1100,2,R/'v2-body-front.png')]:
    text(x,1773,f'v{version}',26,c='#BECBC4');im=Image.open(p).convert('RGB').crop((510,530,785,1120));im.thumbnail((310,730),Image.Resampling.LANCZOS);sheet.paste(im,(x,1820))
text(1510,1725,'V2 full-body context',30,b=True);picture(R/'v2-body-three-quarter.png',1510,1780,1000,910)
text(2690,1725,'96 px head — displayed at native size',27,b=True);sheet.paste(small,(2690,1800))
text(2690,1940,'Wider view: sweep and hooked outline remain.',23,c='#B3C0B9')
text(2690,1980,'Fine stubble and lock detail are subdued.',23,c='#B3C0B9')
text(2690,2075,f'{v["native"]["triangles"]:,} triangles',31,b=True)
text(2690,2130,'Blender 4.3.2 tested',28)
text(2690,2180,'Native file reopened; actual GLB reimported.',23,c='#B3C0B9')
text(2690,2220,'2.93 LTS untested — GLB import supplied.',23,c='#B3C0B9')
text(2690,2320,'V1 files are unchanged.',27)
text(2690,2370,'Hair remains separately editable.',27)
text(2690,2420,'No rig included.',27)
d.line((40,2710,3560,2710),fill='#56645B',width=2)
text(40,2740,'Focused changes: outer hair replacement, narrower jaw/chin planes, tapered neck and a little more fabric over the sneakers.',26)
sheet.save(OUT/'Nico_ComparisonSheet.png')
shutil.copyfile(ROOT/'scripts/nico/import_nico_glb.py',OUT/'Nico_Import_GLB.py')
readme=f'''# Nico v2 — hair silhouette and visible likeness revision

[Blender model](Nico_LowPoly.blend) · [GLB](Nico_LowPoly.glb) · [Comparison sheet](Nico_ComparisonSheet.png) · [96 px head](Nico_Head_96px.png) · [Complete bundle](Nico_v2_Delivery.zip)

The actual delivered v1 `.blend` was opened and revised. **Every file in `nico-lowpoly-v1` is unchanged**, verified by hashes in `construction.json`. V1's hair silhouette was rejected by the user as cap-like; it remains a historical comparison, not an approved hair baseline. V2 is pending user design review.

## What changed

The old 577-vertex scalp-shaped outer mesh was removed. A new close-fitting cover supports **seven broad closed locks**: an off-center main sweep, two unequal overlapping fringe sections, two descending rear masses, a short nape mass and one bent crown lock. Each has a wide seated root, raised middle and a short flattened end. The hook is swept sideways into the mass, rather than a tall upright fin. The scalp cover steps around the ear and has modest uneven lengths at the narrower nape. All hair objects remain separately editable under the `Nico_Hair_v2_` names.

The jaw corners ease inward to the chin; the existing connected neck tapers upward with a sloped jaw underside. The quiet mouth follows that small face deformation. Lower denim is wider and has an additional row and a small break above the sneakers. Glasses, eyes/heavy lids, brows, ears, shirt, hands, watch, sneakers and other original meshes are unchanged; the scope check is in `verification.json`.

**{v['native']['triangles']:,} triangles, {v['native']['mesh_count']} mesh objects, unrigged T-pose.** Flat polygon shading, no subdivision or automatic decimation. Five original detail maps remain packed in the `.blend` and embedded in the GLB. Hair locks are closed overlapping solids, not cards; their hidden roots deliberately enter the cover/head to keep them seated.

## Reference and actual render evidence

The exact [original turnaround](references/Nico_Original_Turnaround.png) was downloaded from the user's Google Drive link without changing its bytes; `references/source.json` records the source and SHA-256. It is embedded in the comparison sheet beside solid hair masks. The reference was interpreted as a drawing guide rather than copied strand for strand.

V1 and v2 were rendered from their actual saved files with the same four cameras, 0.410 m orthographic head framing, neutral untextured material values and inherited identical studio lights. Views: front, profile, back and elevated three-quarter. Solid whole-head silhouettes and solid hair masks are supplied separately under `review/`; the latter use a white head/ear occluder and hide the frames/brows so those cannot cut false holes through the black hair. The finished head is also supplied at **exactly 96 pixels high**, cropped using projected actual mesh bounds rather than enlarged from a small screenshot. Three finished body angles show the trouser change in context.

Initial trials had overly thick column-like locks and an upright cowlick. Subsequent gray/silhouette checks led to fewer flatter masses, a sideways hook, forward lift and a tighter rear cover. A visible small scalp breakthrough in an intermediate back mask was fixed geometrically. No enclosed white scalp patches remain in the four final diagnostic masks; this is a view-specific check, not an all-angle proof. Refer to `hair-mask-check.json` and the final visual audit.

## Versions and verification

**Blender 4.3.2 is the version actually tested.** The native file was saved and reopened there; the actual GLB was reimported into a fresh scene, checked and rendered. Triangle counts and bounds match. All native meshes and the restored editable import are closed/manifold with no zero-area faces. No rig, weighting or extreme bend tests are included.

For Blender 2.93 LTS, import `Nico_LowPoly.glb` with File → Import → glTF 2.0. **2.93 itself was not available for execution and has not been tested; the native file is not a 2.93-native save.** The optional `Nico_Import_GLB.py` imports the adjacent GLB and welds coincident hardware vertices while preserving authored per-corner normals and UVs; it deletes no existing objects and saves no file automatically. Its API usage is intended for 2.93 but only execution in 4.3.2 is verified. Raw glTF repeats vertices at hard-normal/UV boundaries by design.

The remaining artistic difference is a more geometric, less wispy interpretation than the drawn turnaround. Fine strand and stubble detail is subdued at 96 px. User likeness/hair approval remains pending. The important silhouette changes and the actual geometry are shown for review rather than treated as a technical-test artistic pass.

## Reproduce from repository root

```bash
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/revise_nico_v2.py
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/render_nico_v2.py -- --quick
# Inspect gray and silhouette outputs, revise source controls if necessary.
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/render_nico_v2.py
blender --background --threads 6 --python-exit-code 1 --python scripts/nico/verify_nico_v2.py -- --render-import
python scripts/nico/assemble_nico_v2.py
```

The revision script always starts from the original v1 `.blend`, avoiding accumulation of edits. It saves/exports exclusively into v2 and validates the preserved v1 file hashes.
'''
(OUT/'README.md').write_text(readme)
with zipfile.ZipFile(OUT/'Nico_v2_Delivery.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['Nico_LowPoly.blend','Nico_LowPoly.glb','Nico_ComparisonSheet.png','Nico_Head_96px.png','Nico_Import_GLB.py','README.md','verification.json','visual-review.json','construction.json']:
        p=OUT/name
        if p.exists():z.write(p,name)
    for folder in ['textures','references']:
        for p in sorted((OUT/folder).glob('*')):
            if p.is_file():z.write(p,str(p.relative_to(OUT)))
print('Wrote comparison with exact original, 96px head, README and complete bundle.')
