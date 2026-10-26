"""Inspect actual encoded delivery, not just the Remotion source/still renders."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'.cache/motion-study'))
import cv2
cv2.setNumThreads(1)
MOVIE=ROOT/'assets/videos/cancer-short-v1/cancer-76s.mp4';DOC=ROOT/'docs/production/cancer-short';REVIEW=DOC/'review';TEMP=ROOT/'out/cancer-short/encoded-review';TEMP.mkdir(parents=True,exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(MOVIE)]))
video=next(s for s in meta['streams'] if s['codec_type']=='video');audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_frames']))==(1080,1920,'30/1',2280)
assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
assert video['color_range']=='tv' and video['color_space']=='bt709'
assert audio['codec_name']=='aac' and int(audio['channels'])==2 and int(audio['sample_rate'])==48000
assert abs(float(meta['format']['duration'])-76)<.034
assert MOVIE.stat().st_size<100*1024**2,'Delivery must fit normal GitHub blob limit'
result=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(MOVIE),'-vf','blackdetect=d=0.08:pix_th=0.02','-af','loudnorm=I=-16:TP=-1.2:LRA=9:print_format=json','-f','null','-'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,check=True)
log=result.stderr.decode();(TEMP/'decode-audio-check.log').write_text(log)
assert not re.search('Error while decoding|corrupt decoded|Invalid data|black_start:',log,re.I)
assert int(re.findall(r'frame=\s*(\d+)',log)[-1])==2280
loudness=json.loads(re.search(r'\{\s*"input_i"[\s\S]*?\}',log)[0]);assert float(loudness['input_tp'])<-.5
locked={'assets/scenes/artwork-consistency-02/medicine-immune-defense.png':'d9f245e4aad1866de4b29f10a4dd45c7e9312cd3450dd07d68e36f750ed3fd5e','assets/characters/static-test-01.png':'72842deef29e191d0f0699c66684d57b6869a0b4cfb2d50937a268f54b80b73f','public/assets/audio/singularity/narration-original.m4a':'fb4cbe172985e7ce2a4d3d8491f4456607a5dabd39b0fe9de62f00af14f09e4a'}
for file,h in locked.items():assert sha(ROOT/file)==h,file
plan=json.loads((ROOT/'src/data/cancer-short-timing.json').read_text())
assert plan['scenes'][0]['start_frame']==0 and plan['scenes'][-1]['end_frame']==2280
assert all(a['end_frame']==b['start_frame'] for a,b in zip(plan['scenes'],plan['scenes'][1:]))
assert 73<=plan['narration_edit']['speech_end_seconds']<75
assert all(len(c['lines'])<=2 and c['start']<c['end']<=76 for c in plan['captions'])

cap=cv2.VideoCapture(str(MOVIE));font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
def frame(f):
 cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,bgr=cap.read();assert ok and round(cap.get(cv2.CAP_PROP_POS_FRAMES))-1==f
 return Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))
samples=[0,70,220,390,470,620,650,690,720,840,890,1020,1120,1250,1320,1400,1460,1470,1600,1750,1780,1830,1930,2030,2140,2235,2279]
for page in range((len(samples)+5)//6):
 sheet=Image.new('RGB',(1080,1340),'#11172B');d=ImageDraw.Draw(sheet)
 for i,f in enumerate(samples[page*6:page*6+6]):
  im=frame(f);im.save(TEMP/f'frame-{f:04}.png');im.thumbnail((360,640));x=i%3*360;y=i//3*670;sheet.paste(im,(x,y));d.text((x+8,y+644),f'encoded f{f} / {f/30:.3f}s',font=font,fill='white')
 sheet.save(REVIEW/f'encoded-story-{page+1:02}.jpg',quality=94)

# A half-second traversal of the entire movie guards against inspecting only
# representative stills; these are navigation, not a listening/attention test.
nav=list(range(0,2280,15))+[2279]
for page in range((len(nav)+15)//16):
 sheet=Image.new('RGB',(1080,2040),'#11172B');d=ImageDraw.Draw(sheet)
 for i,f in enumerate(nav[page*16:page*16+16]):
  im=frame(f);im.thumbnail((270,480));x=i%4*270;y=i//4*510;sheet.paste(im,(x,y));d.text((x+5,y+482),f'f{f} {f/30:.2f}s',font=font,fill='white')
 sheet.save(REVIEW/f'encoded-navigation-{page+1:02}.jpg',quality=92)

for name,frames,crop in [('division-pose-handoff',list(range(627,639)),(100,560,1000,1230)),('inhibitory-contact',list(range(1078,1110,2)),(240,650,950,1210)),('therapy-response',list(range(1738,1786,3)),(250,680,1050,1260))]:
 cw=300;ch=round((crop[3]-crop[1])*cw/(crop[2]-crop[0]));rows=(len(frames)+3)//4
 sheet=Image.new('RGB',(cw*4,(ch+34)*rows),'#11172B');d=ImageDraw.Draw(sheet)
 for i,f in enumerate(frames):
  im=frame(f).crop(crop).resize((cw,ch),Image.Resampling.LANCZOS);x=i%4*cw;y=i//4*(ch+34);sheet.paste(im,(x,y));d.text((x+6,y+ch+4),f'f{f} / {f/30:.3f}s',font=font,fill='white')
 sheet.save(REVIEW/(name+'.jpg'),quality=95)

joins=[]
for i,scene in enumerate(plan['scenes'][1:],1):
 start=scene['start_frame'];selected=[start-1,start,start+3,start+7,start+12,start+19,start+20,start+30]
 sheet=Image.new('RGB',(1080,1020),'#11172B');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(selected):
  im=frame(f);im.thumbnail((270,480));x=j%4*270;y=j//4*510;sheet.paste(im,(x,y));d.text((x+5,y+482),f'f{f} {f/30:.3f}s',font=font,fill='white')
 target=REVIEW/f'join-{i:02}-{scene["id"]}.jpg';sheet.save(target,quality=94);joins.append({'incoming':scene['id'],'frames':selected,'file':str(target.relative_to(ROOT))})
cap.release()
report={'status':'technical_checks_passed_encoded_visual_review_pending','file':str(MOVIE.relative_to(ROOT)),'sha256':sha(MOVIE),'bytes':MOVIE.stat().st_size,'width':1080,'height':1920,'fps':30,'frames':2280,'seconds':76,'codec':'H264/yuv420p','audio':'AAC48kHz stereo','loudness':loudness,'full_decode':'passed','black_interval_check':'passed','source_artwork_and_prior_knox_unchanged':locked,'story_phase_frames':samples,'full_duration_navigation_step_frames':15,'joins':joins,'no_on_screen_title':True,'captions':'Provider-timed, phrase-sized, two-line maximum, max820px at49px font; SRT delivered separately.','narration':'New ElevenLabs George/v3, one request; original raw audio/alignment retained; only long pauses shortened. Independent overlapping ASR content check completed; no direct audition claimed.','public_upload':'not_performed','user_artistic_approval':'pending'}
visual_record=DOC/'visual-review.json'
if visual_record.exists():
 reviewed=json.loads(visual_record.read_text())
 if reviewed.get('movie_sha256')==report['sha256']:
  report['status']='rendered_and_inspected_test_user_review_pending'
  report['visual_review']='docs/production/cancer-short/visual-review.json'
report['color']='limited-range BT.709, converted from full-range Chromium master'
(DOC/'delivery.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['status','bytes','frames','seconds','loudness']},indent=2))
