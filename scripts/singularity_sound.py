"""Original quiet score/effects around the unchanged Knox performance.

No sampled music, external voice request, time stretching or pitch shifting.
Intermediate PCM stays in out/. Final stereo soundtrack is used by Remotion.
"""
from pathlib import Path
import hashlib,json,math,subprocess,wave
import numpy as np
from scipy.signal import butter,sosfilt

ROOT=Path(__file__).resolve().parents[1]
TIMING=json.loads((ROOT/'src/data/singularity-narration.json').read_text())
OUT=ROOT/'out/singularity';OUT.mkdir(parents=True,exist_ok=True)
DEST=ROOT/'public/assets/audio/singularity'
SR=48000;D=TIMING['durationInFrames']/30;N=round(D*SR)
rng=np.random.default_rng(73137)
score=np.zeros((N,2),np.float32);effects=np.zeros((N,2),np.float32)

def midi(n):return 440*2**((n-69)/12)
def add(buffer,start,sound,pan=0):
    begin=round(start*SR)
    if begin>=N:return
    if begin<0:sound=sound[-begin:];begin=0
    end=min(N,begin+len(sound));sound=sound[:end-begin]
    if sound.ndim==1:
        buffer[begin:end,0]+=sound*np.sqrt((1-pan)/2)
        buffer[begin:end,1]+=sound*np.sqrt((1+pan)/2)
    else:buffer[begin:end]+=sound

def pluck(note,length=3.4):
    t=np.arange(round(length*SR))/SR;f=midi(note)
    attack=1-np.exp(-t*70)
    signal=np.sin(2*np.pi*f*t)*np.exp(-t*1.35)+.24*np.sin(2*np.pi*f*2*t+.08)*np.exp(-t*2.4)+.08*np.sin(2*np.pi*f*3*t)*np.exp(-t*4)
    return (signal*attack*.06).astype(np.float32)

def pad(notes,length,amp):
    t=np.arange(round(length*SR))/SR
    env=np.minimum(1,t/2.6)*np.minimum(1,(length-t)/3.4)
    result=np.zeros((len(t),2),np.float32)
    for k,note in enumerate(notes):
        f=midi(note);mod=.88+.12*np.sin(t*.41+k)
        left=np.sin(2*np.pi*f*t+.13*np.sin(t*.22+k))+.15*np.sin(2*np.pi*f*2*t)
        right=np.sin(2*np.pi*f*t+.19*np.sin(t*.23+k+.8))+.15*np.sin(2*np.pi*f*2*t+.1)
        result[:,0]+=left*env*mod*amp/len(notes)
        result[:,1]+=right*env*mod*amp/len(notes)
    return result

# Harmonic families follow the narration, with an unresolved opening/ending
# and warmer evidence/human passages. Motifs change rather than looping one bed.
sections=[
 (0,50.11,[50,57,60,64],.009,0),
 (50.11,113.77,[53,60,64,67],.014,1),
 (113.77,171.24,[50,57,60,65],.010,2),
 (171.24,242.24,[53,57,60,64],.010,1),
 (242.24,284.18,[47,54,57,62],.009,0),
 (284.18,331.84,[50,57,60,64],.011,2),
 (331.84,366.54,[52,59,62,66],.012,3),
 (366.54,414.61,[55,62,65,69],.012,2),
 (414.61,447.71,[50,57,64],.007,0),
 (447.71,488.97,[53,60,64,67],.011,1),
 (488.97,512.61,[48,55,59,64,67],.015,3),
 (512.61,D,[50,57,60,64],.008,0),
]
for start,end,notes,amp,pattern in sections:
    for pos in np.arange(start,max(start+.01,end-1),13):
        shift=0 if int((pos-start)/13)%2==0 else -2
        add(score,float(pos),pad([n+shift for n in notes],min(18,D-pos),amp))
    if pattern:
        spacing=3.2 if pattern==1 else 4.5 if pattern==2 else 2.7
        for i,pos in enumerate(np.arange(start+1.2,end-2,spacing)):
            note=notes[(i*2+pattern)%len(notes)]+12
            add(score,float(pos),pluck(note)*(.4 if pattern==2 else .65),pan=math.sin(i*1.7)*.4)

def airy(length,pitch=280,strength=.04):
    t=np.arange(round(length*SR))/SR
    noise=rng.normal(0,1,len(t)).astype(np.float32)
    noise=sosfilt(butter(2,[180,2400],btype='bandpass',fs=SR,output='sos'),noise)
    env=np.sin(np.pi*t/length)**2
    tone=np.sin(2*np.pi*(pitch*t+80*t*t/length))*.15
    return ((noise*.55+tone)*env*strength).astype(np.float32)

events=[]
def cue(t,kind,length=.7,pan=0,strength=.03):
    if kind=='air':sound=airy(length,180,strength)
    elif kind=='chime':sound=pluck(76,length)*strength*10
    elif kind=='low':
        tt=np.arange(round(length*SR))/SR;sound=(np.sin(2*np.pi*(80*tt-16*tt*tt/length))*np.sin(np.pi*tt/length)**2*strength).astype(np.float32)
    else:sound=airy(length,400,strength)
    add(effects,t,sound,pan);events.append({'time':t,'kind':kind,'duration':length,'pan':pan})

for b in TIMING['visualBeats']:
    if b['id'] in [1,3,4,7,10,13,17,20,24,28,32,36,38,41,47,50]:cue(max(0,b['start']-.12),'air',.85,pan=(b['id']%3-1)*.3,strength=.027)
    if b['id'] in [6,16,29,35,39,52]:cue(b['start']+.10,'low',.7,strength=.022)
    if b['id'] in [9,11,45,48]:cue(b['start']+.05,'chime',2.1,pan=.2,strength=.07)

# A gentle speech envelope makes the bed recede under words, retaining room
# for expressive pauses. It does not alter any voice samples.
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/'public'/TIMING['audioFile']),'-ac','1','-ar','1000','-f','f32le','-'])
voice=np.frombuffer(raw,np.float32)
envelope=np.sqrt(np.convolve(voice.astype(float)**2,np.ones(180)/180,mode='same'))
gain=1-.38*np.clip(envelope/.045,0,1)
gain=np.interp(np.arange(N)/SR,np.arange(len(gain))/1000,gain,left=1,right=1).astype(np.float32)
score*=gain[:,None]
fade=np.minimum(1,np.arange(N)/(SR*2))*np.minimum(1,(N-np.arange(N))/(SR*2.4))
score*=fade[:,None];effects*=fade[:,None]

def save_wav(name,data):
    assert np.isfinite(data).all() and np.max(np.abs(data))<.8
    file=OUT/(name+'.wav')
    with wave.open(str(file),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
    return file

for name,data in [('score',score),('effects',effects)]:
    wav=save_wav(name,data)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(wav),'-c:a','aac','-b:a','128k' if name=='score' else '96k','-movflags','+faststart',str(DEST/(name+'.m4a'))],check=True)
    print('Saved',name,'peak',float(np.max(np.abs(data))),flush=True)

final=DEST/'final-mix.m4a'
filter_graph=f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=0.92,apad,atrim=duration={D}[voice];[1:a]volume=1[bed];[2:a]volume=1[fx];[voice][bed][fx]amix=inputs=3:normalize=0,alimiter=limit=0.8414:level=0:latency=1,apad,atrim=duration={D}[mix]'
subprocess.run(['ffmpeg','-y','-v','error','-i',str(ROOT/'public'/TIMING['audioFile']),'-i',str(OUT/'score.wav'),'-i',str(OUT/'effects.wav'),'-filter_complex',filter_graph,'-map','[mix]','-ar','48000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(final)],check=True)
record={'method':'Original deterministic oscillator/pluck/pad score and filtered-noise/tonal effects; no sampled commercial music','sourceVoice':TIMING['audioFile'],'sourceVoiceSha256':hashlib.sha256((ROOT/'public'/TIMING['audioFile']).read_bytes()).hexdigest(),'voiceSpeedAdjustment':1,'voicePitchAdjustment':0,'voiceMixGain':.92,'limiterCeilingDbfs':-1.5,'durationSeconds':D,'sampleRate':SR,'channels':2,'scoreSections':[{'start':a,'end':b,'notesMidi':n} for a,b,n,_,_ in sections],'effects':events,'finalMix':'assets/audio/singularity/final-mix.m4a'}
(ROOT/'docs/production/singularity/film/sound-design.json').write_text(json.dumps(record,indent=2)+'\n')
print('Saved final soundtrack',final,flush=True)
