"""Inspect encoded delivery and unchanged baseline art; writes review artifacts only."""
from pathlib import Path
import hashlib,json,struct,subprocess
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1]
F=R/'assets/videos/approved-characters-motion-20s.mp4'
O=R/'docs/production/characters-motion';T=R/'out/motion-review'
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True).stdout
def label(im,xy,s,size=20):ImageDraw.Draw(im).text(xy,s,fill='#FFF5E9',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size))
def board(w,h,title,note):
 im=Image.new('RGB',(w,h),'#21182A');label(im,(18,12),title,27);label(im,(18,52),note,17);return im
O.mkdir(parents=True,exist_ok=True);T.mkdir(parents=True,exist_ok=True)
p=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(F)]))
v=next(s for s in p['streams'] if s['codec_type']=='video');a=next(s for s in p['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',600)
assert float(p['format']['duration'])==float(v['duration'])==float(a['duration'])==20
run(['ffmpeg','-v','error','-i',str(F),'-f','null','-'])
samples=sorted(set(list(range(0,600,30))+[224,225,226,242,248,254,260,266,270,276,282,288,300,309,315,316,317,318,319,320,321,330,345,360,450,461,462,463,466,472,478,484,490,496,502,508,514,520,562,563,566,599]))
select='+'.join(f'eq(n\\,{f})' for f in samples)
run(['ffmpeg','-y','-v','error','-i',str(F),'-vf','select='+select,'-fps_mode','vfr',str(T/'%03d.png')])
frames={f:Image.open(T/f'{i:03d}.png').convert('RGB') for i,f in enumerate(samples,1)}
frames[345].save(R/'assets/videos/approved-characters-motion-20s-poster.png')
b=board(1960,1100,'New motion pass / encoded 20-second delivery','Samples every second. Same approved illustration assets; new acting and ElevenLabs performance.')
for i,f in enumerate(range(0,600,30)):
 x,y=10+i%5*390,100+i//5*247;b.paste(frames[f].resize((384,216),Image.Resampling.LANCZOS),(x,y));label(b,(x+4,y+218),f'{f/30:.1f}s / {f}',16)
b.save(O/'sequence.jpg',quality=94)
b=board(1960,1150,'Gesture timing / actual encoded frames','Attention and anticipation lead the hand; forearm/wrist follow the shoulder, then settle.')
for i,f in enumerate([225,242,248,254,260,266,270,276,282,288,300,309,330,360,450]):
 x,y=10+i%5*390,100+i//5*345
 crop=frames[f].crop((1000,190,1620,730));crop.thumbnail((384,310),Image.Resampling.LANCZOS);b.paste(crop,(x,y));label(b,(x+4,y+312),f'{f/30:.2f}s / {f}',16)
b.save(O/'gesture.jpg',quality=96)
b=board(1960,900,'Response and cup / actual encoded frames','Expression changes during a blink. The grip/cup stay together; steam rises independently.')
for i,f in enumerate([315,316,318,320,330,466,478,490,508,566]):
 x,y=10+i%5*390,100+i//5*385
 box=(530,260,980,660) if f<462 else (460,145,1060,750)
 crop=frames[f].crop(box);crop.thumbnail((384,345),Image.Resampling.LANCZOS);b.paste(crop,(x,y));label(b,(x+4,y+347),f'{f/30:.2f}s / {f}',16)
b.save(O/'response.jpg',quality=96)
# Retain genuine old/new encoded frames at the invitation, with the approved sheet.
old=R/'assets/videos/approved-characters-20s.mp4'
run(['ffmpeg','-y','-v','error','-i',str(old),'-vf','select=eq(n\\,270)','-frames:v','1',str(T/'baseline.png')])
baseline=Image.open(T/'baseline.png').convert('RGB');master=Image.open(R/'assets/characters/static-test-01.png').convert('RGB')
b=board(1960,1050,'Approved artwork / previous and new motion','Static design at left; actual encoded invitation frames at right. No perceptual score or reference-equivalence claim.')
for x,im,title in [(15,master,'APPROVED MASTER'),(670,baseline,'PREVIOUS / frame 270'),(1320,frames[270],'NEW MOTION / frame 270')]:
 label(b,(x,95),title,21);im=im.copy();im.thumbnail((620,430),Image.Resampling.LANCZOS);b.paste(im,(x,132))
for i,(im,box,title) in enumerate([(master,(40,105,375,560),'Approved Mira'),(frames[490],(450,140,1040,800),'New Mira / response'),(master,(365,25,775,550),'Approved Sol'),(frames[270],(1000,180,1630,740),'New Sol / gesture')]):
 x=15+i*485;label(b,(x,590),title,20);crop=im.crop(box);crop.thumbnail((460,410),Image.Resampling.LANCZOS);b.paste(crop,(x,625))
b.save(O/'artwork-comparison.jpg',quality=96)
locked=json.loads((R/'references/studies/motion-2026-10-24/visual-lock.json').read_text())['files']
for file,expected in locked.items():assert hashlib.sha256((R/file).read_bytes()).hexdigest()==expected,file
voice=json.loads((R/'src/data/crowd-motion-narration.json').read_text());assert voice['provider']=='elevenlabs' and voice['status']=='generated' and voice['speedAdjustment']==1
assert all(c['start']<c['end']<=20 for c in voice['captions'])
assert all(a['end']<=b['start'] for a,b in zip(voice['captions'],voice['captions'][1:]))
data=F.read_bytes();atoms=[];pos=0
while pos+8<=len(data):
 n,k=struct.unpack('>I4s',data[pos:pos+8]);n=struct.unpack('>Q',data[pos+8:pos+16])[0] if n==1 else n
 if not n:n=len(data)-pos
 assert n>=8;atoms.append(k.decode());pos+=n
assert atoms.index('moov')<atoms.index('mdat')
md5=lambda file:run(['ffmpeg','-v','error','-i',str(file),'-map','0:a:0','-f','md5','-']).strip()
new_audio,old_audio=md5(F),md5(old);assert new_audio!=old_audio
loudness=subprocess.run(['ffmpeg','-hide_banner','-i',str(F),'-af','loudnorm=print_format=json','-f','null','-'],check=True,capture_output=True,text=True).stderr
loudness=json.JSONDecoder().raw_decode(loudness[loudness.rfind('{'):])[0]
assert float(loudness['input_tp']) < -1
record={'film':str(F.relative_to(R)),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'container_duration':p['format']['duration'],'video':{k:v[k] for k in ['codec_name','width','height','r_frame_rate','nb_frames','pix_fmt','duration']},'audio':{k:a[k] for k in ['codec_name','sample_rate','channels','duration']},'full_decode':'passed','fast_start':True,'locked_baseline_files_unchanged':locked,'new_elevenlabs_generation':True,'speech_tempo_adjustment':1,'sentence_gap_seconds_added':sum(p['seconds'] for p in voice['performancePauses']),'caption_end_seconds':voice['captions'][-1]['end'],'new_decoded_audio_md5':new_audio,'previous_decoded_audio_md5':old_audio,'mix_loudness':{k:loudness[k] for k in ['input_i','input_tp','input_lra']},'retained_frames':samples,'animation':'Original illustrated textures continuously skinned at torso/elbow/wrist, authored anticipation/stroke/hold/settle, delayed head/body response, rigid cup grip, emitted steam. Painted backgrounds held.','limits':'Limited 2D views; no walk cycle, full turnaround or lip sync. Frame/geometry checks do not establish subjective performance quality or parity with a reference studio.'}
(O/'validation.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
