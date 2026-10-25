"""Event-aligned mixes for original wordless studies, using existing sources."""
from pathlib import Path
import hashlib
import json
import subprocess
import wave

import numpy as np
from scipy.signal import resample

from common import ROOT, REPO, digest, write_json

SR=48000
LIB=REPO/'public/assets/audio/library/curio-bureau'
CAT=json.loads((LIB/'curio_sfx_v1/CATALOG.json').read_text())
CUES={c['name']:c for c in CAT['cues']}
DEST=REPO/'public/assets/audio/animation-mastery'
TEMP=REPO/'out/animation-mastery/audio'
DEST.mkdir(parents=True,exist_ok=True);TEMP.mkdir(parents=True,exist_ok=True)


def decode(path):
    return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ar',str(SR),'-ac','2','-f','f32le','-']),np.float32).reshape(-1,2).copy()


def rms(s):
    return float(np.sqrt(np.mean(s*s)+1e-15))


def write_audio(stem,s):
    wav=TEMP/(stem+'.wav')
    with wave.open(str(wav),'wb') as stream:
        stream.setnchannels(2);stream.setsampwidth(2);stream.setframerate(SR)
        stream.writeframes((np.clip(s,-.999,.999)*32767).astype('<i2').tobytes())
    target=DEST/(stem+'.m4a')
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(wav),'-c:a','aac','-b:a','192k','-movflags','+faststart',str(target)],check=True)
    return target


def envelope(s):
    n=len(s)//9600
    return np.sqrt(np.mean(s[:n*9600].mean(axis=1).reshape(n,9600)**2,axis=1)+1e-15)


SPECS={
 'acting':(4,'curious',[(35,'parallax_swish',-20,None,'Breeze reaches actor/cloth'),(29,'paper_light_turn',-25,.55,'Sleeve/cloth response'),(69,'soft_depth_pass',-26,.7,'Recovery and softened posture')]),
 'explanation':(6,'exploratory',[(12,'map_route_draw',-23,1.2,'Root approach'),(52,'wood_stress',-20,.65,'Tip meets rock; root briefly compresses'),(87,'map_route_draw',-21,2.25,'New branch routes around the obstacle'),(145,'causal_reveal',-23,1.1,'Root reaches water'),(157,'soft_depth_pass',-25,.65,'Uptake returns along the connected route')]),
 'transition':(8,'curious',[(28,'soft_depth_pass',-23,1.3,'Droplet detaches and falls'),(80,'tiny_mask_reveal',-20,.4,'Droplet contacts soil'),(102,'perspective_whip',-23,1.1,'Material-linked move into soil'),(122,'wood_stress',-21,.6,'Incoming root contact'),(157,'map_route_draw',-22,1.9,'Detour growth'),(215,'causal_reveal',-24,.8,'Resource reached')]),
 'narrative':(12,'warm',[(118,'parallax_swish',-20,1.7,'The same breeze drives cloth, foliage, steam and acting'),(123,'paper_light_turn',-23,1.25,'Curtain lifts off window'),(155,'soft_depth_pass',-24,1.0,'Light reaches the plant'),(183,'map_route_draw',-26,1.35,'Leaves lift in a staggered response'),(247,'quiet_resolution',-22,1.9,'Bud opens; actor expression resolves')]),
}
cache={};sources={};reports=[]
for kind,(duration,mood,events) in SPECS.items():
    N=round(duration*SR);fx=np.zeros((N,2),np.float32);placements=[]
    for frame,name,target_db,stretch,reason in events:
        if name not in cache:
            row=CUES[name];p=LIB/row['path'].removeprefix('audio/')
            assert digest(p)==row['sha256'];cache[name]=decode(p)
            sources[name]={'file':str(p.relative_to(REPO)),'sha256':row['sha256']}
        s=cache[name].copy()
        if stretch:s=resample(s,round(stretch*SR),axis=0).astype(np.float32)
        s*=10**(target_db/20)/max(rms(s),1e-9)
        peak=int(np.argmax(np.max(np.abs(s),axis=1)))
        at=round(frame/30*SR)-peak;begin=max(0,at);skip=max(0,-at);count=min(len(s)-skip,N-begin)
        if count>0:fx[begin:begin+count]+=s[skip:skip+count]
        placements.append({'event_frame':frame,'event_seconds':frame/30,'cue':name,'reason':reason,'peak_aligned_to_event':True,'desired_cue_rms_dbfs':target_db,'resampled_duration_seconds':stretch})
    # A quiet designed wind/soil room tone is distinct from the focal contacts.
    ambient_name='cavern_lowwind' if kind in ['acting','narrative'] else 'archive_room'
    row=CUES[ambient_name];p=LIB/row['path'].removeprefix('audio/');assert digest(p)==row['sha256']
    amb=decode(p);amb=np.tile(amb,(int(np.ceil(N/len(amb))),1))[:N]
    amb*=10**(-37/20)/max(rms(amb),1e-9)
    cue=REPO/f'public/assets/audio/singularity-v4/music-cues/{mood}.flac'
    if not cue.exists():
        matches=list((REPO/'public/assets/audio/singularity-v4/music-cues').glob(f'*{mood}*'))
        if len(matches)!=1:raise ValueError(f'Cannot find existing mood cue {mood}')
        cue=matches[0]
    raw=decode(cue);left=raw[:,0].copy();raw[:,1]=.65*left+.35*raw[:,1]
    start=int(.8*SR);music=np.tile(raw,(int(np.ceil((N+start)/len(raw))),1))[start:start+N].copy()
    active=envelope(fx)>10**(-32/20);old=envelope(music);er=envelope(fx)
    assert active.any()
    music*=.85/max(float(np.median(old[active]/er[active])),1e-9)
    t=np.arange(N)/SR;fade=np.minimum(1,t/.12)*np.clip((duration-t)/.55,0,1)
    for s in [fx,amb,music]:s*=fade[:,None]
    full=fx+amb+music
    # Shared gain preserves the selected music/effect ratio under peak protection.
    shared=min(1,10**(-1.5/20)/max(float(np.max(np.abs(full))),1e-9))
    fx*=shared;amb*=shared;music*=shared;full*=shared
    for suffix,s in [('effects',fx),('atmosphere',amb),('music',music)]:write_audio(kind+'-'+suffix,s)
    final=write_audio(kind,full)
    ratio=float(np.median(envelope(music)[active]/np.maximum(envelope(fx)[active],1e-9)))
    reports.append({'kind':kind,'duration_seconds':duration,'placements':placements,'music_cue':str(cue.relative_to(REPO)),'music_source_sha256':digest(cue),'target_music_to_typical_active_fx_rms_amplitude_ratio':.85,'measured_pcm_ratio_after_ending_fade':ratio,'music_mood':mood,'atmosphere_cue':ambient_name,'atmosphere_source_sha256':digest(p),'shared_safety_gain':shared,'pcm_peak_dbfs':20*np.log10(max(float(np.max(np.abs(full))),1e-10)),'file':str(final.relative_to(REPO)),'sha256':digest(final)})
write_json(ROOT/'validation/animation-tests/sound-design.json',{'scope':'Original A/B/C/D wordless studies','sources':sources,'mixes':reports,'new_audio_generation_requests':0,'narration_generation_requests':0,'provenance':'Existing original Curio Bureau designed/synthesized cues and original project music. Timing/duration/gain adaptations only; no reference soundtrack copied.','review_limit':'Direct audio audition unavailable. Level/alignment/decoding checks are not a listening approval.'})
(DEST/'README.md').write_text('# Original animation-study mixes\n\nReusable effects, atmosphere, music and final mixes for A/B/C/D. Existing original Curio Bureau effects and project mood-music cues are reused, with event-peak alignment and recorded duration/gain changes. Sources and placements: `animation-mastery/validation/animation-tests/sound-design.json`. No narration or reference soundtrack is included, and no voice credits were used.\n')
print('Saved four original wordless mixes and their reusable stems.',flush=True)
