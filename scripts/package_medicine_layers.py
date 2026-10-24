"""Validate existing PNG/media files and package them; no image modification."""
from pathlib import Path
from PIL import Image
import hashlib,json,subprocess,zipfile

root=Path(__file__).resolve().parents[1]
folder=root/'public/assets/artwork/medicine-layers-v1'
out=root/'assets/scenes/medicine-layers-v1';out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=root/'assets/scenes/artwork-consistency-02/medicine-immune-defense.png'
assert sha(source)=='d9f245e4aad1866de4b29f10a4dd45c7e9312cd3450dd07d68e36f750ed3fd5e'
assert sha(root/'assets/scenes/artwork-consistency-02/cyber-network-defense.png')=='e6bece838f7095e1346f255533802e62f8f9b114a73479c9a4396ae8088162fd'
records=[]
for p in sorted(folder.glob('*.png')):
    im=Image.open(p);im.load();assert im.size==(1672,941)
    alpha=im.getchannel('A') if im.mode=='RGBA' else None
    if p.stem!='environment-clean':
        assert alpha is not None and alpha.getextrema()[0]==0 and alpha.getextrema()[1]>128
        assert alpha.getbbox() is not None
    records.append({'file':p.name,'width':im.width,'height':im.height,'mode':im.mode,'alpha_bounds':list(alpha.getbbox()) if alpha else None,'sha256':sha(p),'bytes':p.stat().st_size})
assert len(records)==14
manifest={'version':1,'canvas':[1672,941],'artwork_reference':'assets/scenes/artwork-consistency-02/medicine-immune-defense.png','artwork_reference_sha256':sha(source),'files':records,'pivots':{'hanging-vine':[1063,66],'window-plant':[1572,492],'foreground-foliage':[100,650]},'notes':['PNG artwork, not SVG color paths.','The room plate retains fixed microscope, bench, glassware, stool and plant pots.','window-view must stay behind the fixed mullions; clouds must be clipped to the window panes.','environment-cutouts is the source sheet for cloud/vine/window-plant exports; do not stack both.','clinician-cutout is a new generated pose, not exactly registered; the demonstration retains the existing source-sampled clinician rig.','Cell sprites are exported from the existing atlas; new environment cutouts are adapted, not pixel-identical extractions.']}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
readme='''MEDICINE — SEPARATE PNG ANIMATION LAYERS

14 PNG files, native canvas 1672 x 941, with separate transparent environment,
foreground and biological artwork. See manifest.json for file bounds and pivots.

The clean room has clouds, hanging/window plant foliage, foreground foliage,
clinician and cells removed. Fixed microscope, furniture, glassware, pots and
stool remain. window-view contains only the clear window panes. Keep clouds
clipped behind the fixed mullions. The environment-cutouts sheet and the three
individual environment exports are alternatives, not additive layers.

clinician-cutout.png is a regenerated pose whose framing changed; register and
rig it before use. The demo retains the existing approved-art character rig.
The PNGs are not a PSD, vector document or finished turn-around character rig.

Runtime/source: public/assets/artwork/medicine-layers-v1/
Motion: src/MedicineEnvironment.tsx + src/ArtworkMotion.tsx
Full notes: docs/production/medicine-layers.md
Demo: assets/videos/medicine-layered-environment-8s.mp4

Regenerate PNG exports: npm run assets:medicine-layers
Render demo: npm run render:medicine-layers
Validate/package: python scripts/package_medicine_layers.py

New artwork layers and environment animation are pending user review.
'''
(folder/'README.txt').write_text(readme)
archive=out/'medicine-png-layers.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(folder.iterdir()):z.write(p,p.name)
video=root/'assets/videos/medicine-layered-environment-8s.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
a=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['nb_read_frames'],v['r_frame_rate'])==(1920,1080,'240','30/1')
assert v['codec_name']=='h264' and a['codec_name']=='aac'
assert abs(float(probe['format']['duration'])-8)<.05
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
validation={'png_files':len(records),'all_alpha_objects_have_transparency':True,'native_canvas':[1672,941],'approved_medicine_and_cyber_sources_unchanged':True,'media':{'file':str(video.relative_to(root)),'frames':240,'fps':30,'width':1920,'height':1080,'duration':probe['format']['duration'],'video_codec':v['codec_name'],'audio_codec':a['codec_name'],'full_decode':'passed','sha256':sha(video)},'package':{'file':str(archive.relative_to(root)),'bytes':archive.stat().st_size,'sha256':sha(archive)},'typecheck':'passed','user_quality_approval':'pending'}
(root/'docs/production/medicine-layers/validation.json').write_text(json.dumps(validation,indent=2)+'\n')
print(json.dumps(validation,indent=2))
