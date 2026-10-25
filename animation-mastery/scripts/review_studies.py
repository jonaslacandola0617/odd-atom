"""Audit the actual MP4s and export temporal evidence for visual review."""
from pathlib import Path
import json
import re
import subprocess

from common import ROOT, REPO, dependency_modules, digest, write_json
from PIL import Image,ImageDraw,ImageFont

cv2,np=dependency_modules()
cv2.setNumThreads(1)
SPEC={
 'acting':('A-character-acting-4s',120,[0,24,34,46,69,110]),
 'explanation':('B-root-detour-6s',180,[0,30,52,68,107,165]),
 'transition':('C-garden-to-roots-8s',240,[24,65,80,96,118,225]),
 'narrative':('D-a-little-light-12s',360,[0,112,150,197,255,350]),
}
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
DELIVERY=REPO/'assets/videos/animation-mastery/v1'
REVIEW=ROOT/'validation/comparison-reports'
TEMP=REPO/'out/animation-mastery/encoded-review'
REVIEW.mkdir(parents=True,exist_ok=True);TEMP.mkdir(parents=True,exist_ok=True)


def frame(cap,index):
    cap.set(cv2.CAP_PROP_POS_FRAMES,index);okay,bgr=cap.read()
    if not okay or round(cap.get(cv2.CAP_PROP_POS_FRAMES))-1!=index:raise ValueError('Encoded frame seek mismatch')
    return Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))


records=[]
for kind,(name,count,samples) in SPEC.items():
    movie=DELIVERY/(name+'.mp4')
    meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]))
    video=next(s for s in meta['streams'] if s['codec_type']=='video');audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_frames']))==(1920,1080,'30/1',count)
    assert audio['codec_name']=='aac' and int(audio['channels'])==2 and int(audio['sample_rate'])==48000
    assert abs(float(meta['format']['duration'])-count/30)<.05
    result=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(movie),'-af','volumedetect','-f','null','-'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    log=result.stderr.decode();(TEMP/(kind+'-decode.log')).write_text(log)
    assert not re.search(r'corrupt decoded|Error while decoding|Invalid data',log,re.I)
    assert int(re.findall(r'frame=\s*(\d+)',log)[-1])==count
    peak=float(re.search(r'max_volume:\s*([-\d.]+) dB',log)[1]);assert peak<-.1,peak
    cap=cv2.VideoCapture(str(movie));sheet=Image.new('RGB',(1920,1740),'#171c2d');draw=ImageDraw.Draw(sheet)
    for i,f in enumerate(samples):
        image=frame(cap,f);image.save(TEMP/f'{kind}-{f}.png');image.thumbnail((960,540),Image.Resampling.LANCZOS)
        x=i%2*960;y=i//2*580;sheet.paste(image,(x,y));draw.text((x+10,y+548),f'{kind} / encoded frame {f} / {f/30:.3f} s',fill='white',font=FONT)
    sheet.save(REVIEW/(kind+'-encoded-sequence.jpg'),quality=92)
    if kind=='acting':
        contact=Image.new('RGB',(1200,1510),'#171c2d');d=ImageDraw.Draw(contact)
        for i,f in enumerate(range(23,47)):
            image=frame(cap,f).crop((620,190,1100,1030));image.thumbnail((192,336),Image.Resampling.LANCZOS)
            x=i%6*200;y=i//6*375;contact.paste(image,(x,y));d.text((x+3,y+341),f'f{f} {f/30:.3f}s',font=FONT,fill='white')
        contact.save(REVIEW/'acting-consecutive-23-46.jpg',quality=94)
    cap.release()
    records.append({'kind':kind,'file':str(movie.relative_to(REPO)),'sha256':digest(movie),'bytes':movie.stat().st_size,
                    'frames':count,'seconds':float(meta['format']['duration']),'full_decode':'passed','audio_peak_dbfs':peak,
                    'dimensions':[1920,1080],'fps':30,'encoded_review_frames':samples,'on_screen_titles':False,
                    'voice_generation_requests':0,'narration_present':False,'visual_review':'pending_encoded_sequence_inspection'})

# The original approval remains tied to the unchanged artwork, not to these new movies.
locked={
 'assets/characters/static-test-01.png':'72842deef29e191d0f0699c66684d57b6869a0b4cfb2d50937a268f54b80b73f',
 'assets/scenes/artwork-consistency-02/medicine-immune-defense.png':'d9f245e4aad1866de4b29f10a4dd45c7e9312cd3450dd07d68e36f750ed3fd5e',
 'assets/scenes/artwork-consistency-02/cyber-network-defense.png':'e6bece838f7095e1346f255533802e62f8f9b114a73479c9a4396ae8088162fd',
}
for file,fingerprint in locked.items():assert digest(REPO/file)==fingerprint,file
write_json(ROOT/'validation/quality-audits/delivery.json',{'status':'technical_checks_passed_visual_review_pending',
    'original_studies':records,'approved_source_artwork_unchanged':locked,
    'scope':'Four original technique/narrative tests. Not recreations or approvals of the full singularity film.',
    'direct_audio_audition':'unavailable; no listening pass claimed','user_artistic_approval':'pending'})
print('All four actual MP4s decode, retain expected frames/timing, and stay below clipping. Source artwork unchanged.',flush=True)
