"""Correct music presence using the existing nine source cues, not new music.

V4 effects and atmosphere are preserved. The earlier all-tail guard is replaced
by phrase-level voice control and short ducking for prominent contacts only.
"""
from pathlib import Path
import json,hashlib,subprocess,wave
import numpy as np
from scipy.signal import resample_poly
from scipy.ndimage import minimum_filter1d

R=Path(__file__).resolve().parents[1];SR=48000
T=json.loads((R/'src/data/singularity-narration.json').read_text());F=T['durationInFrames']+360;D=F/30;N=round(D*SR)
OUT=R/'out/singularity-v5';DEST=R/'public/assets/audio/singularity-v5';DOC=R/'docs/production/singularity/music-presence'
for p in [OUT,DEST,DOC]:p.mkdir(parents=True,exist_ok=True)
BASE=R/'public/assets/audio/singularity-v4';data=json.loads((R/'docs/production/singularity/final-mix/sound-design.json').read_text())
def decode(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar',str(SR),'-ac','2','-f','f32le','-']),np.float32).reshape(-1,2).copy()
def run(args):subprocess.run(['ffmpeg','-y','-v','error',*map(str,args)],check=True)
def env(s,hop=9600):
    n=int(np.ceil(len(s)/hop));p=np.zeros((n*hop,2),np.float32);p[:len(s)]=s
    return np.sqrt(np.mean(p.reshape(n,hop,2)**2,axis=(1,2))+1e-15)
def control(g,hop=9600):return np.interp(np.arange(N)/SR,(np.arange(len(g))+.5)*hop/SR,g,left=g[0],right=g[-1]).astype(np.float32)
def mono_band_env(s,hop=9600):
    y=resample_poly(s.mean(axis=1),1,6);h=hop//6;n=int(np.ceil(len(y)/h));p=np.zeros(n*h,np.float32);p[:len(y)]=y
    return np.sqrt(np.mean(p.reshape(n,h)**2,axis=1)+1e-15)
def db(x):return float(20*np.log10(max(1e-10,float(x))))
cues={};sources=[]
for cue in data['music_cues']:
    p=R/'public'/cue['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==cue['sha256']
    s=decode(p)
    # A stable shared component survives mono playback; use a source channel
    # rather than averaging phase-separated detuned pads before anchoring.
    left=s[:,0].copy();s[:,0]=left;s[:,1]=.65*left+.35*s[:,1]
    s*=10**(-23/20)/max(np.sqrt(np.mean(s*s)),1e-9)
    cues[cue['name']]=s;sources.append({'file':cue['file'],'sha256':cue['sha256']})
music=np.zeros((N,2),np.float32);weight=np.zeros(N,np.float32);moods=[]
for k,row in enumerate(data['music_moods']):
    start,end,mood=row['start'],row['end'],row['mood'];i=max(0,round((start-.7)*SR));j=min(N,round((end+.7)*SR));t=np.arange(j-i)/SR+i/SR
    fade=np.minimum(1,np.maximum(0,(t-start+.7)/1.4))*np.minimum(1,np.maximum(0,(end+.7-t)/1.4))
    cue=cues[mood];positions=((np.arange(j-i)+k*SR*3)%len(cue)).astype(int)
    target=-27.5 if mood not in ['eerie','question'] else -29
    music[i:j]+=cue[positions]*10**((target+23)/20)*fade[:,None];weight[i:j]+=fade
    moods.append({**row,'base_music_rms_dbfs':target})
music/=np.maximum(1,weight)[:,None]
for start,end in [(24,26),(146.4,148.5),(264,266.5),(399,401.2),(531,537.4)]:
    i,j=round(start*SR),round(end*SR);t=np.arange(j-i)/SR;fade=np.minimum(1,np.minimum(t/.3,(end-start-t)/.5));music[i:j]*=(1-.35*fade)[:,None]

voice=decode(R/'public'/T['audioFile']);reference=np.zeros((N,2),np.float32);reference[:len(voice)]=voice*.92
effects=decode(BASE/'effects.m4a');effects=effects[:N]
if len(effects)<N:effects=np.pad(effects,((0,N-len(effects)),(0,0)))
# Voice control follows phrases over a second, not each quiet syllable. This
# leaves a musical bed rather than applying the previous 15–17dB blanket gap.
phrase_v=env(reference,48000);phrase_m=env(music,48000);vg=np.ones_like(phrase_m);talk=phrase_v>10**(-34/20)
vg[talk]=np.minimum(1,phrase_v[talk]*10**(-11/20)/np.maximum(phrase_m[talk],1e-9))
voice_gain=control(np.maximum(vg,.28),48000)
music*=voice_gain[:,None]
er=env(effects);mr=env(music);prominent=er>10**(-31/20)
g=np.ones_like(mr);g[prominent]=np.minimum(1,er[prominent]*10**(-4/20)/np.maximum(mr[prominent],1e-9))
be=mono_band_env(effects);bm=mono_band_env(music);mono_contact=be>10**(-32/20)
g[mono_contact]=np.minimum(g[mono_contact],be[mono_contact]*10**(-6/20)/np.maximum(bm[mono_contact],1e-9))
# A 200ms look-ahead anticipates prominent contacts only. Quiet tails do not
# trigger this control, and recovery is about half a second, not several.
g=minimum_filter1d(g,3,mode='nearest')
for i in range(1,len(g)):g[i]=min(g[i],g[i-1]+.65*(g[i]-g[i-1]))
music*=control(np.maximum(g,.3))[:,None]
music*=np.minimum(1,np.arange(N)/SR/.5)[:,None]
music*=np.clip((D-np.arange(N)/SR)/3.8,0,1).astype(np.float32)[:,None]
assert np.isfinite(music).all() and np.max(np.abs(music))<.5
wav=OUT/'music.wav'
with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((music*32767).astype('<i2').tobytes())
run(['-i',wav,'-c:a','aac','-b:a','192k','-movflags','+faststart',DEST/'music.m4a'])
graph=f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=.92,apad,atrim=duration={D}[voice];[voice][1:a][2:a][3:a]amix=inputs=4:normalize=0,alimiter=limit=.8414:level=0:latency=1,apad,atrim=duration={D}[mix]'
run(['-i',R/'public'/T['audioFile'],'-i',BASE/'effects.m4a','-i',BASE/'atmosphere.m4a','-i',wav,'-filter_complex',graph,'-map','[mix]','-ar',SR,'-c:a','aac','-b:a','192k','-movflags','+faststart',DEST/'final-mix.m4a'])
old=decode(BASE/'music.m4a')[:N];oldr=env(old,48000);newr=env(music,48000);voicer=env(reference,48000)
n=min(len(oldr),len(newr),len(voicer));valid=(voicer[:n]>10**(-32/20))&(oldr[:n]>10**(-65/20));increase=20*np.log10(newr[:n][valid]/np.maximum(oldr[:n][valid],1e-10))
record={'frames':F,'seconds':D,'change':'Raise and sustain music presence after user could not hear v4 score','source_cues_reused':sources,'music_moods':moods,'music_mono_anchor':'.65 of source left channel shared into right, .35 original right retained; source files unchanged','voice_phrase_gap_db':11,'sfx_duck_only_above_rms_dbfs':-31,'prominent_sfx_music_gap_db':4,'release_200ms_step':.65,'median_music_increase_over_v4_db':float(np.median(increase)),'median_music_below_voice_db':float(np.median(20*np.log10(voicer[:n][valid]/np.maximum(newr[:n][valid],1e-10)))),'source_voice_sha256':T['audioSha256'],'voice_speed':1,'voice_pitch_shift':0,'effects_source':'assets/audio/singularity-v4/effects.m4a','effects_source_sha256':hashlib.sha256((BASE/'effects.m4a').read_bytes()).hexdigest(),'atmosphere_source':'assets/audio/singularity-v4/atmosphere.m4a','new_music_or_voice_generation_requests':0,'review_limit':'Direct audition is unavailable. Level/presence checks are not a listening pass.'}
(DOC/'sound-design.json').write_text(json.dumps(record,indent=2)+'\n')
(DEST/'README.md').write_text('# Music presence correction\n\nThe new music stem and final mix are committed here. The nine original source music cues remain unchanged under `../singularity-v4/music-cues/`; the v4 effects and atmosphere stems are reused unchanged. Music is raised and anchored for more reliable mono playback, with phrase-level narration control and short ducking only for prominent effects. See `docs/production/singularity/music-presence/sound-design.json`. Rebuild with `npm run sound:singularity-v5`.\n')
print('Music increase over v4:',round(record['median_music_increase_over_v4_db'],1),'dB; median music below voice:',round(record['median_music_below_voice_db'],1),'dB.',flush=True)
