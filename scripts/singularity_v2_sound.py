"""New action-synchronized effects around the immutable Google Vids Knox take.

The earlier original synthesized score is reused at its authored timing. No
voice service calls, pitch shift, speed change, or commercial music samples.
"""
from pathlib import Path
import hashlib,json,subprocess,wave
import numpy as np
from scipy.signal import butter,sosfilt

R=Path(__file__).resolve().parents[1]
T=json.loads((R/'src/data/singularity-narration.json').read_text())
D=T['durationInFrames']/30;SR=48000;N=round(D*SR)
OUT=R/'out/singularity-v2';DEST=R/'public/assets/audio/singularity-v2'
OUT.mkdir(parents=True,exist_ok=True);DEST.mkdir(parents=True,exist_ok=True)
fx=np.zeros((N,2),np.float32);rng=np.random.default_rng(10252026);events=[]

def cue(beat,offset,kind,length=.65,pan=0,amp=.025):
    begin=round((T['visualBeats'][beat-1]['startFrame']/30+offset)*SR)
    t=np.arange(round(length*SR))/SR
    env=np.sin(np.pi*t/length)**2
    if kind=='bind':
        sound=(np.sin(2*np.pi*460*t)+.25*np.sin(2*np.pi*920*t))*np.exp(-t*8)*(1-np.exp(-t*110))
    elif kind=='fracture':
        noise=sosfilt(butter(2,[1000,5400],fs=SR,btype='bandpass',output='sos'),rng.normal(0,1,len(t)))
        sound=noise*np.exp(-t*12)*(1-np.exp(-t*100))*.6
    elif kind=='signal':
        sound=(np.sin(2*np.pi*(720*t+240*t*t))+.2*np.sin(2*np.pi*1450*t))*env*.3
    elif kind=='settle':
        sound=np.sin(2*np.pi*(105*t-20*t*t/length))*env*.5
    else:
        noise=sosfilt(butter(2,[180,2600],fs=SR,btype='bandpass',output='sos'),rng.normal(0,1,len(t)))
        sound=(noise*.55+np.sin(2*np.pi*(190*t+70*t*t/length))*.12)*env
    sound=(sound*amp).astype(np.float32)
    end=min(N,begin+len(sound));sound=sound[:end-begin]
    fx[begin:end,0]+=sound*np.sqrt((1-pan)/2);fx[begin:end,1]+=sound*np.sqrt((1+pan)/2)
    events.append(dict(beat=beat,time=round(begin/SR,4),kind=kind,duration=length,pan=pan))

# Effects accent actual authored triggers rather than every edit.
for b,o,k in [(2,1,'air'),(4,.5,'air'),(5,3,'settle'),(7,2,'fracture'),
 (9,1,'air'),(10,5,'bind'),(10,8,'air'),(10,17,'signal'),
 (11,4.5,'bind'),(11,7.5,'bind'),(12,7,'signal'),(13,4,'settle'),
 (14,11,'air'),(15,6,'fracture'),(16,6,'air'),(18,4,'air'),(19,2,'air'),
 (20,1,'air'),(22,5,'air'),(23,5,'air'),(25,2,'settle'),(26,5,'fracture'),
 (29,4,'air'),(30,3,'air'),(30,9,'settle'),(33,8,'settle'),(34,7,'signal'),
 (36,1,'air'),(38,3,'air'),(40,7,'air'),(42,4,'air'),(43,4,'settle'),
 (45,5,'bind'),(46,4,'signal'),(46,7,'signal'),(48,3,'bind'),(48,7,'air'),
 (49,3,'air'),(50,2,'air'),(51,2,'fracture')]:
    cue(b,o,k,length=.38 if k in ('bind','fracture') else .85,pan=((b%5)-2)*.18)

wav=OUT/'effects.wav'
with wave.open(str(wav),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(fx,-1,1)*32767).astype('<i2').tobytes())
def run(args):subprocess.run(['ffmpeg','-y','-v','error',*map(str,args)],check=True)
run(['-i',wav,'-c:a','aac','-b:a','96k','-movflags','+faststart',DEST/'effects.m4a'])
source=R/'public'/T['audioFile'];score=R/'public/assets/audio/singularity/score.m4a'
assert hashlib.sha256(source.read_bytes()).hexdigest()==T['audioSha256']
graph=f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=0.92,apad,atrim=duration={D}[voice];[1:a]volume=.88[score];[2:a]volume=1[fx];[voice][score][fx]amix=inputs=3:normalize=0,alimiter=limit=.8414:level=0:latency=1,apad,atrim=duration={D}[mix]'
run(['-i',source,'-i',score,'-i',wav,'-filter_complex',graph,'-map','[mix]','-ar','48000','-c:a','aac','-b:a','192k','-movflags','+faststart',DEST/'final-mix.m4a'])
record={'voice':T['audioFile'],'source_sha256':T['audioSha256'],'speed':1,'pitch_shift':0,'voice_mix_gain':.92,'score':'assets/audio/singularity/score.m4a','score_gain':.88,'effects':'assets/audio/singularity-v2/effects.m4a','events':events,'duration':D,'credits_used':0}
(R/'docs/production/singularity/rebuild/sound-design.json').write_text(json.dumps(record,indent=2)+'\n')
(DEST/'README.md').write_text('Original action-timed synthesized effects and a new mix of the unchanged Knox take with the existing original score. No voice generation, tempo or pitch change. Reproduce with `npm run sound:singularity-v2`. Source/hash and cue times are in `docs/production/singularity/rebuild/sound-design.json`.\n')
print('Saved new mix and',len(events),'action cues; original narration hash matches.')
