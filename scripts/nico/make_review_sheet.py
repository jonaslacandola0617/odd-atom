"""Compose actual Blender renders; never generate or paint over the geometry."""
import json,hashlib,zipfile,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/characters/nico-lowpoly-v1';R=OUT/'review'
v=json.loads((OUT/'verification.json').read_text());tris=v['native_reopened']['triangles'];version=v['blender_version_actually_tested']
assert not v['technical_issues']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(OUT/'Nico_LowPoly.blend')==v['native_blend_sha256'] and sha(OUT/'Nico_LowPoly.glb')==v['glb_sha256']
im=Image.new('RGB',(3200,2450),'#202629');d=ImageDraw.Draw(im)
def font(n,bold=False):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if bold else '')+'.ttf',n)
def text(x,y,s,n=28,color='#DEE3E0',bold=False):d.text((x,y),s,font=font(n,bold),fill=color)
def picture(file,x,y,w,h):
    p=Image.open(R/file).convert('RGB');p.thumbnail((w,h),Image.Resampling.LANCZOS);im.paste(p,(x,y));return p
text(40,28,'Nico',56,bold=True);text(230,48,'EDITABLE LOW-POLY CHARACTER  /  NEUTRAL RENDER REVIEW',27,color='#AEBAB6')
text(40,115,'Front',30);text(835,115,'Profile',30);text(1630,115,'Back',30);text(2425,115,'Three-quarter',30)
for x,f in zip([40,835,1630,2425],['body-front.png','body-profile.png','body-back.png','body-three-quarter.png']):picture(f,x,160,735,690)
text(40,872,'All body views use the same orthographic scale. Model height: %.3f m.'%v['native_reopened']['bounds']['max'][2],25,color='#AEBAB6')
d.line((40,930,3160,930),fill='#56605C',width=2)
text(40,968,'Face, glasses and integrated hair',31,bold=True);picture('head-three-quarter.png',40,1020,900,980)
text(1000,968,'Crown and nape — elevated view',27);picture('head-back-elevated.png',1000,1020,600,640)
text(1640,968,'Five fingers / anatomical left watch',27);picture('hand-left.png',1640,1020,600,535)
text(2280,968,'Small on-screen check',29)
picture('body-three-quarter.png',2280,1040,220,200)
head=Image.open(R/'head-three-quarter.png').convert('RGB').crop((205,130,820,960));head.thumbnail((96,96),Image.Resampling.LANCZOS);im.paste(head,(2580,1080))
text(2280,1270,'200px review frame / 96px head',24,color='#AEBAB6')
text(2280,1460,'Worn sneakers / flat ground contact',27);picture('shoes-detail.png',2280,1510,600,470)
text(1000,1720,'Untextured head geometry',28)
for x,f,label in [(1000,'clay-head-front.png','Front'),(1415,'clay-head-profile.png','Profile'),(1830,'clay-head-three-quarter.png','Three-quarter')]:
    text(x,1770,label,24,color='#AEBAB6');picture(f,x,1810,385,430)
for y,s in [(2070,'One connected scalp with broad directional relief.'),(2114,'Hair, glasses and watch remain separately editable.'),(2158,'Symmetrical T-pose, palms down; feet on Z = 0.'),(2202,'No rig or animation is included in this pass.')]:text(40,y,s,25,color='#B9C5BF')
d.line((40,2290,3160,2290),fill='#56605C',width=2)
text(40,2320,f'{tris:,} triangles  |  Blender {version} tested  |  five packed / embedded textures',30,bold=True)
text(40,2373,f'Native .blend saved in {version}. GLB is the import option for Blender 2.93 LTS; 2.93 was not available for testing.',26,color='#B9C5BF')
im.save(OUT/'Nico_ReviewSheet.png')
small=Image.open(R/'body-three-quarter.png').convert('RGB');small.thumbnail((220,200),Image.Resampling.LANCZOS);small.save(R/'small-preview.png')

notes=f'''# Nico — editable low-poly character

[Native Blender model](Nico_LowPoly.blend) · [GLB](Nico_LowPoly.glb) · [Review sheet](Nico_ReviewSheet.png) · [Complete download](Nico_Delivery.zip)

**{tris:,} triangles, {v['native_reopened']['meshes']} mesh objects; Blender {version} actually tested.** Metres; +Z up, −Y forward, +X is Nico's anatomical left. Height is {v['native_reopened']['bounds']['max'][2]:.3f} m. The cheap digital watch is on +X / left. Both soles have lowest Z = 0. Arms and shoes are mirrored; hands have a thumb and four separately formed fingers. No rig, weights or animation is included.

## Versions and import

The native file was saved and reopened in **Blender {version}**. It is not a Blender 2.93-native save. **For Blender 2.93 LTS, use File → Import → glTF 2.0 and select `Nico_LowPoly.glb`.** Blender 2.93 was unavailable and has not been tested; no 2.93 compatibility pass is claimed. The actual GLB was imported into a new empty Blender {version} scene and rendered again. Its dimensions and triangle count match the reopened native asset.

glTF stores repeated vertices at hard-normal and UV boundaries. This is normal for rendering, but editing/rigging benefits from welding coincident positions. The optional **`Nico_Import_GLB.py`** helper imports the adjacent GLB, restores welded topology and retains the original per-corner faceted normals and UVs. Open the helper in Blender's Scripting workspace and run it; it deletes no existing objects and saves no file automatically. Alternatively merge by distance manually, then restore flat/custom normals as appropriate. The helper uses 2.93-compatible API calls but, like the file, was only executed in {version}. Both raw import and the welded editable import are recorded in `verification.json`.

All five PNG maps are packed in the `.blend` and embedded as binary image buffers in the GLB. The GLB needs no external texture directory or required material extensions. Materials use opaque base color, roughness and exported normals. Separate original maps are also supplied under `textures/` for painting.

## Design and construction

The original turnaround supplied in chat guided identity and proportions; the T-pose drawings guided stance. The three earlier render sheets were reviewed visually. No earlier editable Nico meshes were present locally and no donor geometry was retained. This is an original geometric reconstruction, not a traced illustration or image-generation output.

The head has a compact cranium, cheek/jaw planes, a recessed short neck and a modeled nose. Rectangular glasses have real rim depth, bridge and temples, without a printed frame texture or duplicate outline shell. The heavy eyelid and eyebrow pieces remain editable; stubble and under-eye color are painted.

Hair is a **single closed manifold scalp mesh** with seven broad directional reliefs and a small swept crown displacement. The reliefs taper into the base, so there are no hair cards, detached blades or free-standing fin. The fringe, temple recesses, sideburn shapes and nape are geometric. A restrained painted charcoal map adds tone only after the form is established. Crown and side silhouettes were checked with untextured renders.

Arms and hands are connected meshes with elbow/wrist/finger loops and a branched thumb web. The T-shirt has a joined torso/sleeve mesh and a collar band, with modest forward belly volume. The jeans have a continuous pelvis/crotch and knee rows. Shoe soles are flat; laces, wear and denim seams are painted. Flat polygon shading preserves the facets. No subdivision, automatic decimation or global smoothing was used. Small one-segment chamfers construct the watch case edges and are applied in the editable mesh.

`NICO • editable geometry` contains the character. `REVIEW • cameras and neutral lights` contains the excluded studio setup; its objects are hidden in the viewport, but available for rendering. The native file opens framed on Nico. The GLB contains only the character.

## Visual revisions and inspection

The first clay crown was too high and was lowered together with the underlying skull. A forward nose root and disconnected-looking bridge were brought into the face/frame construction. The first separate hair relief patches read too much like plates, so they were replaced by relief in one continuous surface. Raised sleeve corners were leveled into the shoulder line. Visible back-hem clipping was corrected by giving the shirt enough rear clearance over the jeans. The shoes were mirrored as a left/right pair, and stray upper sclera wedges were removed to keep the eyes tired rather than wide open.

Final front/profile/three-quarter clay heads, four full-body angles at matching scale, a larger head close-up, an elevated rear hair view, left hand/watch detail, shoes and a small screen-size preview are supplied in `review/`. The composite sheet uses these actual Blender renders. The GLB reimport render is separate. The verification file binds checks to the final model hashes.

## Remaining limits

The neutral face is a deliberately angular interpretation; no expression library, eyelid animation or facial blendshapes is included. Joint loops are prepared for rigging, but extreme bend deformation is untested because this pass intentionally has no rig. Fine stubble, shallow hair relief and shoe paint naturally lose visibility in the small screen-size image; glasses and the overall head/clothing silhouette remain the primary identity cues. The hidden body is not modeled underneath the shirt and jeans. Refer to `visual-review.json` for the final observed visual findings; user design approval remains pending.

## Reproduce

```bash
python scripts/nico/make_textures.py
blender --background --threads 6 --python scripts/nico/build_nico.py -- --head-only
# Inspect the three clay heads before proceeding.
blender --background --threads 6 --python scripts/nico/build_nico.py
blender --background --threads 6 --python scripts/nico/verify_nico.py -- --render-import
python scripts/nico/make_review_sheet.py
```

The scripts use Blender's Python API and Pillow for original texture painting and review-sheet composition. All model construction remains editable geometry; the generated source is in `scripts/nico/`.
'''
(OUT/'README.md').write_text(notes)
shutil.copyfile(ROOT/'scripts/nico/import_nico_glb.py',OUT/'Nico_Import_GLB.py')
with zipfile.ZipFile(OUT/'Nico_Delivery.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['Nico_LowPoly.blend','Nico_LowPoly.glb','Nico_ReviewSheet.png','Nico_Import_GLB.py','README.md','verification.json','visual-review.json']:
        p=OUT/name
        if p.exists():z.write(p,name)
    for p in sorted((OUT/'textures').glob('*.png')):z.write(p,'textures/'+p.name)
print('Created Nico_ReviewSheet.png, README.md and Nico_Delivery.zip.')
