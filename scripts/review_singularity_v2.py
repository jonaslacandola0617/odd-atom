"""Review the actual encoded remake; encoding checks are not creative approval."""
from pathlib import Path
import hashlib,json,math,re,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.signal import correlate,correlation_lags

R=Path(__file__).resolve().parents[1]
T=json.loads((R/'src/data/singularity-narration.json').read_text())
DOC=R/'docs/production/singularity/rebuild';OUT=R/'out/singularity-v2'
DEL=R/'assets/videos/singularity-v2';MOV=DEL/'singularity-rebuilt-8m56.mp4'
DOC.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]).stdout)
P=probe(MOV);v=next(s for s in P['streams'] if s['codec_type']=='video');a=next(s for s in P['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',T['durationInFrames'])
assert v['codec_name']=='h264' and a['codec_name']=='aac' and int(a['sample_rate'])==48000 and a['channels']==2
assert abs(float(P['format']['duration'])-T['durationInFrames']/30)<.05
assert MOV.stat().st_size<100*1024*1024
atoms=[]
with MOV.open('rb') as file:
    while True:
        pos=file.tell();header=file.read(8)
        if len(header)<8:break
        size=int.from_bytes(header[:4],'big');name=header[4:8].decode('ascii','replace')
        if size==1:size=int.from_bytes(file.read(8),'big')
        if size==0:size=MOV.stat().st_size-pos
        assert size>=8
        atoms.append((name,pos));file.seek(pos+size)
assert next(p for n,p in atoms if n=='moov')<next(p for n,p in atoms if n=='mdat')
result=run(['ffmpeg','-hide_banner','-nostats','-i',str(MOV),'-vf','blackdetect=d=0.4:pix_th=0.035:pic_th=0.98','-af','volumedetect','-f','null','-'])
log=result.stderr.decode();(OUT/'full-decode-v2.log').write_text(log)
assert not re.search('Error while decoding|Invalid data found|corrupt decoded frame|black_start:',log,re.I)
assert int(re.findall(r'frame=\s*(\d+)',log)[-1])==T['durationInFrames']
peak=float(re.search(r'max_volume:\s*([-\d.]+) dB',log)[1]);assert peak<-.1,'Encoded mix reaches clipping'
print('Full decode and format checks passed.',flush=True)

# Compare immutable approved originals and the rejected comparison film.
previous=json.loads((R/'references/studies/storytelling-2026-10-25/study.json').read_text())['production_files_unchanged']
baseline={}
if isinstance(previous,dict):
    for path,entry in previous.items():
        expected=entry if isinstance(entry,str) else entry.get('sha256')
        if expected:
            assert sha(R/path)==expected,path
            baseline[path]=expected
else:
    for entry in previous:
        path=entry.get('file',entry.get('path'));expected=entry.get('sha256')
        assert sha(R/path)==expected,path;baseline[path]=expected
for review in ['docs/production/story-motion/user-review.json','docs/production/transition-lab/user-review.json']:
    x=json.loads((R/review).read_text());assert x.get('creative_status',x.get('status'))=='approved'
    path=x.get('film',x.get('file'));expected=x.get('film_sha256',x.get('sha256'))
    assert sha(R/path)==expected;baseline[path]=expected
assert sha(R/'public'/T['audioFile'])==T['audioSha256']
assert sha(R/T['sourceFile'])==T['sourceSha256']
print('Approved originals, rejected comparison film and Knox source hashes match.',flush=True)

def mono(path):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(path),'-vn','-ar','8000','-ac','1','-f','f32le','-']).stdout,np.float32)
voice=mono(R/'public'/T['audioFile']);mix=mono(MOV);sync=[]
for second in [0,100,250,400,520]:
    left=voice[second*8000:(second+10)*8000].astype(float);right=mix[second*8000:second*8000+len(left)].astype(float)
    c=correlate(right,left,mode='full',method='fft');lags=correlation_lags(len(right),len(left));valid=np.abs(lags)<=800
    best=np.where(valid)[0][np.argmax(c[valid])];lag=int(lags[best]);similarity=float(c[best]/math.sqrt(np.dot(left,left)*np.dot(right,right)))
    assert abs(lag)<=160 and similarity>.94,(second,lag,similarity)
    sync.append({'seconds':second,'lag_seconds':lag/8000,'correlation':round(similarity,6)})
print('Voice correlation/sync checks passed at five separated intervals.',flush=True)

chapters=[]
fingerprints={p.read_text().strip() for p in OUT.glob('part-*.mp4.sha256')}
assert len(fingerprints)==1,'Chapter renders do not have one shared source fingerprint'
current=hashlib.sha256()
for file in ['src/SingularityRebuild.tsx','src/MotionCharacters.tsx','src/Root.tsx','src/data/singularity-narration.json','src/data/crowd-motion-narration.json']:
    current.update((R/file).read_bytes())
current.update(b'1080p30-crf18-fast-captionless-v1')
assert next(iter(fingerprints))==current.hexdigest(),'The sources changed after rendering'
for i,scene in enumerate(T['scenes']):
    file=DEL/'chapters'/f'singularity-rebuilt-part-{i+1}.mp4';p=probe(file)
    video=next(s for s in p['streams'] if s['codec_type']=='video')
    expected=(T['scenes'][i+1]['startFrame'] if i+1<len(T['scenes']) else T['durationInFrames'])-scene['startFrame']
    assert int(video['nb_frames'])==expected and file.stat().st_size<100*1024*1024
    assert abs(float(p['format']['duration'])-expected/30)<.08
    chapters.append({'file':str(file.relative_to(R)),'frames':expected,'bytes':file.stat().st_size,'sha256':sha(file)})

font=ImageFont.truetype(str(R/'public/assets/fonts/Outfit.ttf'),18)
def frame(movie,f,name):
    path=OUT/f'{name}-{f}.png'
    run(['ffmpeg','-y','-v','error','-ss',str(f/30),'-i',str(movie),'-frames:v','1',str(path)])
    return Image.open(path).convert('RGB')
def board(samples,name,columns=4,thumb=400):
    width=thumb*columns;h=round(thumb*9/16);row=h+28
    image=Image.new('RGB',(width,math.ceil(len(samples)/columns)*row),'#11132f');d=ImageDraw.Draw(image)
    for i,(f,label) in enumerate(samples):
        im=frame(MOV,f,name);im.thumbnail((thumb,h));x=i%columns*thumb;y=i//columns*row;image.paste(im,(x,y));d.text((x+6,y+h+3),label,font=font,fill='#fff0ce')
    image.save(DOC/f'{name}.jpg',quality=90)
samples=[(min(b['endFrame']-1,b['startFrame']+max(12,int((b['endFrame']-b['startFrame'])*.62))),f"Beat {b['id']} / {b['startFrame']/30:.1f}s") for b in T['visualBeats']]
board(samples[:26],'sequence-review-01');board(samples[26:],'sequence-review-02')
plan=json.loads((DOC/'sequence-plan.json').read_text())
handoffs=[]
for s in plan['sections'][1:]:
    for offset in [0,14,27,40]:
        f=s['startFrame']+offset;handoffs.append((f,f"{s['index']} {s['transition']} +{offset}f"))
board(handoffs[:52],'handoffs-01');board(handoffs[52:],'handoffs-02')
print('Saved boards from 52 encoded beats and all 26 encoded handoffs.',flush=True)

old=R/'assets/videos/singularity/singularity-full-8m56.mp4'
compare=[220,550,2300,3680,4930,5740,9130,9570,11160,14450,14980,15800]
image=Image.new('RGB',(1280,len(compare)*390),'#11132f');d=ImageDraw.Draw(image)
for i,f in enumerate(compare):
    for col,(movie,name) in enumerate([(old,'Rejected cut'),(MOV,'Rebuilt cut')]):
        im=frame(movie,f,name.replace(' ','-'));im.thumbnail((640,360));image.paste(im,(col*640,i*390));d.text((col*640+8,i*390+362),f'{name} / {f/30:.2f}s',font=font,fill='#fff0ce')
image.save(DOC/'before-after.jpg',quality=91)

# Native-pixel crop makes the unchanged approved human texture inspectable.
master=Image.open(R/'assets/characters/static-test-01.png').convert('RGB')
actual=frame(MOV,14980,'character-native')
im=Image.new('RGB',(920,460),'#11132f');d=ImageDraw.Draw(im)
im.paste(master.crop((454,32,708,298)),(25,60));im.paste(actual.crop((1235,340,1495,650)),(355,60))
d.text((25,15),'Approved Sol / native pixels',font=font,fill='#fff0ce');d.text((355,15),'Remake Sol / native pixels',font=font,fill='#fff0ce')
d.text((25,410),'Same approved atlas and rig; different camera/pose. No resizing of these crops.',font=font,fill='#fff0ce');im.save(DOC/'character-native.png')

# Action excerpts are compiled only for review; this is not the film's edit.
clips=[]
for i,(second,length) in enumerate([(67,3),(88,3),(119,3),(149,3),(310,3),(472,3)]):
    path=OUT/f'excerpt-{i}.mp4';run(['ffmpeg','-y','-v','error','-ss',str(second),'-i',str(MOV),'-t',str(length),'-an','-vf','scale=640:-2,fps=15','-c:v','libx264','-crf','22',str(path)]);clips.append(path)
lst=OUT/'excerpt-list.txt';lst.write_text(''.join(f"file '{p.name}'\n" for p in clips))
proxy=OUT/'excerpts.mp4';run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(lst),'-c','copy',str(proxy)])
run(['ffmpeg','-y','-v','error','-i',str(proxy),'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',str(DOC/'action-excerpts.gif')])
run(['ffmpeg','-y','-v','error','-i',str(MOV),'-t','30','-c:v','libx264','-crf','19','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',str(DEL/'opening-30s.mp4')])
record={'file':str(MOV.relative_to(R)),'sha256':sha(MOV),'bytes':MOV.stat().st_size,'duration_seconds':float(P['format']['duration']),'frames':T['durationInFrames'],'width':1920,'height':1080,'fps':30,'video_codec':v['codec_name'],'pixel_format':v['pix_fmt'],'audio_codec':a['codec_name'],'sample_rate':int(a['sample_rate']),'channels':a['channels'],'voice':'Original Google Vids Knox user recording','voice_sync':sync,'source_narration_sha256':T['audioSha256'],'speed':1,'pitch_shift':0,'voice_credits_used':0,'sequences':27,'speech_timed_beats':52,'major_handoffs':26,'transition_families':sorted(set(s['transition'] for s in plan['sections'][1:])),'default_on_screen_text':False,'title':False,'optional_subtitle_cues':len(T['captions']),'full_decode':'passed','unexpected_black_segments':0,'fast_start':True,'preserved_baselines':baseline,'picture_input_fingerprint':next(iter(fingerprints)),'higher_bitrate_chapters':chapters,'creative_status':'pending user review','review_limits':'Format/decode checks, five audio correlation windows, 52 representative encoded beat frames and four samples at each major handoff; this does not assert a complete human playback/listening audit, photoreal scientific simulation, studio equivalence or predicted view counts.'}
record['audio_peak_dbfs']=peak
(DOC/'delivery.json').write_text(json.dumps(record,indent=2)+'\n')
print('Saved full-film report, actual-frame comparison, native character crops and action proxy.',flush=True)
