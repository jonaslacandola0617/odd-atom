"""Louder existing SFX, additional action cues, and a new scene-mood score.

Music is original deterministic composition; existing material effects come
from the user's imported library. All composed source cues/stems are saved.
"""
from pathlib import Path
import hashlib,json,subprocess,wave
import numpy as np
from scipy.signal import lfilter,butter,sosfilt
from scipy.ndimage import minimum_filter1d

R=Path(__file__).resolve().parents[1];SR=48000;SFX_BOOST_DB=6
T=json.loads((R/'src/data/singularity-narration.json').read_text());FRAMES=T['durationInFrames']+360;D=FRAMES/30;N=round(D*SR)
OUT=R/'out/singularity-v4';DEST=R/'public/assets/audio/singularity-v4';DOC=R/'docs/production/singularity/final-mix'
for p in [OUT,DEST,DEST/'music-cues',DOC]:p.mkdir(parents=True,exist_ok=True)
old=json.loads((R/'docs/production/singularity/sound-ending/sound-design.json').read_text())
lib=R/'public/assets/audio/library/curio-bureau'
catalog=json.loads((lib/'curio_sfx_v1/CATALOG.json').read_text())['cues']
paths={x['name']:lib/x['path'].removeprefix('audio/') for x in catalog}
paths.update({n:lib/'generated-editorial-v1'/f'{n}.mp3' for n in ['paper','pencil','camera_move']})
cache={};effects=np.zeros((N,2),np.float32);atmosphere=np.zeros_like(effects);events=[]
def run(args):subprocess.run(['ffmpeg','-y','-v','error',*map(str,args)],check=True)
def decode(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar',str(SR),'-ac','2','-f','f32le','-']),np.float32).reshape(-1,2).copy()
def db(x):return float(20*np.log10(max(1e-10,float(x))))
def place(event,extra=False):
    p=R/'public'/event['asset']
    key=str(p)
    if key not in cache:cache[key]=decode(p)
    s=cache[key];offset=round(event.get('source_offset',0)*SR);s=s[offset:offset+round(event['duration']*SR)].copy()
    if event.get('reverse'):s=s[::-1].copy()
    bus=event['bus'];gain=event['gain']*(10**(SFX_BOOST_DB/20) if bus=='effects' else 1)
    s*=gain;ramp=min(len(s)//4,round((.6 if bus=='atmosphere' else .018)*SR));tail=min(len(s)//3,round((.6 if bus=='atmosphere' else .16)*SR))
    s[:ramp]*=np.linspace(0,1,ramp)[:,None];s[-tail:]*=np.linspace(1,0,tail)[:,None]
    mono=s.mean(axis=1);pan=event['pan'];s[:,0]=.28*s[:,0]+.72*mono*np.sqrt(1-pan);s[:,1]=.28*s[:,1]+.72*mono*np.sqrt(1+pan)
    i=round(event['time']*SR);j=min(N,i+len(s));(effects if bus=='effects' else atmosphere)[i:j]+=s[:j-i]
    events.append({**event,'gain':float(gain),'sfx_boost_db':SFX_BOOST_DB if bus=='effects' else 0,'new_placement':extra})
for e in old['events']:place(e)
def extra(time,name,role,pan=0,target=-30,length=None):
    p=paths[name]
    if str(p) not in cache:cache[str(p)]=decode(p)
    s=cache[str(p)];duration=min(len(s)/SR,length or len(s)/SR)
    selected=s[:round(duration*SR)];gain=min(10**(target/20)/max(np.sqrt(np.mean(selected**2)),1e-9),.36/max(np.max(np.abs(selected)),1e-9))
    place({'time':time,'duration':duration,'asset':str(p.relative_to(R/'public')),'cue':name,'gain':float(gain),'pan':pan,'role':role,'bus':'effects','source_offset':0,'reverse':False,'target_rms_dbfs':target},True)

# Added only where the existing picture supplies a continued action/reveal.
for time,name,role,pan in [
 (32.4,'pencil_marks','The model-limit question finishes tracing',.45),
 (46.2,'map_route_draw','The three knowledge motifs acquire a drawn connection',0),
 (56.6,'cable_tension','Light wavelength continues stretching with distance',.2),
 (109.0,'pencil_marks','The evidence path reaches an unsupported earlier segment',-.4),
 (162.6,'pencil_marks','Infinity gives way to a question on the unsupported side',.4),
 (167.1,'document_focus','Attention settles on the question rather than a measured object',.4),
 (181.2,'soft_depth_pass','Imagined room fragments continue moving outward',.3),
 (202.0,'soft_depth_pass','Expansion continues throughout the spatial field',0),
 (222.0,'camera_move','The observable window remains local while the wider field shifts',-.3),
 (226.4,'soft_depth_pass','The wider field continues beyond the observation boundary',.3),
 (252.0,'document_focus','Attention shifts between the two successful descriptions',.35),
 (262.2,'cable_tension','Quantum and gravity descriptions approach the shared regime',0),
 (275.1,'map_route_draw','Attempted joint-description curves approach the missing region',0),
 (291.1,'pencil_marks','The time-road route finishes drawing',.2),
 (303.4,'paper_light_turn','The assumed road continuation encounters its initial boundary',.4),
 (327.8,'photo_slide','The conditional earliest-event marker stays inside the map',-.4),
 (348.7,'soft_depth_pass','The hypothetical field keeps expanding after its minimum',.2),
 (381.0,'document_focus','The inflation mechanism remains an unresolved region',.4),
 (396.0,'tiny_mask_reveal','The last independent hypothetical region grows into view',-.4),
 (411.0,'document_focus','Unobserved alternatives recede toward observational access',.2),
 (428.5,'cable_tension','A local excitation rises inside the visible physical framework',.1),
 (483.0,'pencil_marks','The possible relic-signal mark remains a question',.5),
 (506.8,'map_route_draw','The human-scale cosmic-history trail finishes tracing',-.2),
]:extra(time,name,role,pan)

voice_path=R/'public'/T['audioFile'];assert hashlib.sha256(voice_path.read_bytes()).hexdigest()==T['audioSha256']
voice=decode(voice_path);reference=np.zeros((N,2),np.float32);reference[:len(voice)]=voice*.92
def envelope(s,hop=9600):
    n=int(np.ceil(len(s)/hop));pad=np.zeros((n*hop,2),np.float32);pad[:len(s)]=s
    return np.sqrt(np.mean(pad.reshape(n,hop,2)**2,axis=(1,2))+1e-15)
def sample_control(gain,hop=9600):return np.interp(np.arange(N)/SR,(np.arange(len(gain))+.5)*hop/SR,gain,left=gain[0],right=gain[-1]).astype(np.float32)
def playback_band_envelope(s,hop=9600):
    # Also protect the mono lower playback band: bright stereo texture must not
    # be the only reason a paper/contact cue wins against the musical midrange.
    mono=sosfilt(butter(3,3200,fs=SR,output='sos'),s.mean(axis=1))
    n=int(np.ceil(len(mono)/hop));pad=np.zeros(n*hop,np.float32);pad[:len(mono)]=mono
    return np.sqrt(np.mean(pad.reshape(n,hop)**2,axis=1)+1e-15)
# Preserve v3's speech-aware ducking, then constrain the boosted SFX bus where
# simultaneous speech would otherwise be masked. Silent-word gaps may accent.
vr=envelope(reference);presence=np.clip((vr-.012)/.07,0,1)
speech=sample_control(lfilter([.22],[1,-.78],presence))
effects*=(1-.42*speech)[:,None];atmosphere*=(1-.28*speech)[:,None]
er=envelope(effects);cap=np.ones_like(er);active=vr>10**(-34/20)
cap[active]=np.minimum(1,vr[active]*10**(-4/20)/np.maximum(er[active],1e-9))
cap=minimum_filter1d(cap,3,mode='nearest');effects*=sample_control(cap)[:,None]

# Original score families share a D/A center so mood changes can overlap.
# Felt/plucked tones, bowed pads and colored air replace one repeating bed.
rng=np.random.default_rng(20261025)
def hz(n):return 440*2**((n-69)/12)
def pluck(note,duration,soft=True):
    t=np.arange(round(duration*SR))/SR;f=hz(note)
    env=(1-np.exp(-t*(35 if soft else 75)))*np.exp(-t*(2.6 if soft else 4.2))
    s=(np.sin(2*np.pi*f*t)+.23*np.sin(2*np.pi*2*f*t+.1)+.06*np.sin(2*np.pi*3*f*t))
    return (s*env).astype(np.float32)
def pad(notes,duration,eerie=False):
    t=np.arange(round(duration*SR))/SR;s=np.zeros((len(t),2),np.float32)
    for k,n in enumerate(notes):
        f=hz(n);breath=.82+.18*np.sin(t*.45+k)
        for ch,detune in enumerate([-.0015,.0015]):
            phase=2*np.pi*f*(1+detune)*t+.07*np.sin(t*.7+k)
            s[:,ch]+=(np.sin(phase)+.16*np.sin(phase*2))*breath/len(notes)
    noise=rng.standard_normal(len(t)).astype(np.float32)
    noise=sosfilt(butter(2,[180,1250 if eerie else 2200],fs=SR,btype='bandpass',output='sos'),noise)
    s+=noise[:,None]*(.055 if eerie else .025)
    return s
families={
 'curious':{'notes':[50,57,62,65],'melody':[62,65,69,64,62,57,60,64],'bpm':78,'step':1,'eerie':False,'purpose':'Sparse felt/plucked questions over an open minor harmony'},
 'strain':{'notes':[38,45,50,53],'melody':[50,53,52,57],'bpm':78,'step':2,'eerie':True,'purpose':'Low bowed tension and gently narrowing intervals'},
 'eerie':{'notes':[38,45,51,62],'melody':[62,63,57,62],'bpm':78,'step':3,'eerie':True,'purpose':'Quiet suspended cluster and colored air; no horror jump cue'},
 'evidence':{'notes':[50,57,60,65],'melody':[62,65,69,67,65,62,60,57],'bpm':78,'step':1,'eerie':False,'purpose':'Measured, clearer pattern for evidence and comparisons'},
 'playful':{'notes':[50,57,62,67],'melody':[62,69,65,67,64,62],'bpm':78,'step':.75,'eerie':False,'purpose':'Light inquisitive phrasing for the misleading room/map analogy'},
 'exploratory':{'notes':[45,52,57,62],'melody':[64,62,57,60,65,64],'bpm':78,'step':1.5,'eerie':False,'purpose':'Floating unresolved phrases for alternative histories'},
 'wonder':{'notes':[43,50,57,62],'melody':[67,69,64,62,57,64],'bpm':78,'step':1.5,'eerie':False,'purpose':'Broad, open spacing for cosmic scale without a triumphant answer'},
 'warm':{'notes':[41,48,53,57,60],'melody':[65,64,60,57,62,60],'bpm':78,'step':1.5,'eerie':False,'purpose':'Warm soft-key melody for material connected to human life'},
 'question':{'notes':[38,45,52,62],'melody':[62,64,57,64],'bpm':78,'step':3,'eerie':True,'purpose':'Open fifth/add-nine, sparse phrase and no final resolving cadence'},
}
cue_seconds=32*60/78 # eight bars at one shared tempo
music_cues={};cue_manifest=[]
def pcm(path,s):
    with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(s,-1,1)*32767).astype('<i2').tobytes())
for name,cfg in families.items():
    s=pad(cfg['notes'],cue_seconds,cfg['eerie'])*.65
    beat=60/cfg['bpm'];spacing=beat*cfg['step']
    for i,start in enumerate(np.arange(.45,cue_seconds-1.5,spacing)):
        note=cfg['melody'][i%len(cfg['melody'])];tone=pluck(note,1.8,True)*(.18 if cfg['eerie'] else .3)
        j=round(start*SR);end=min(len(s),j+len(tone));pan=np.sin(i*1.3)*.4
        s[j:end,0]+=tone[:end-j]*np.sqrt((1-pan)/2);s[j:end,1]+=tone[:end-j]*np.sqrt((1+pan)/2)
    # A low, sustained root supplies weight without music percussion competing
    # with the actual contact sounds. Each cue is reusable and gently bounded.
    t=np.arange(len(s))/SR;s+=np.sin(2*np.pi*hz(cfg['notes'][0]-12)*t)[:,None]*.045
    fade=np.minimum(1,t/1.1)*np.minimum(1,(cue_seconds-t)/1.6);s*=fade[:,None]
    s*=10**(-23/20)/max(np.sqrt(np.mean(s*s)),1e-9)
    music_cues[name]=s.astype(np.float32)
    wav=OUT/(name+'.wav');pcm(wav,s)
    flac=DEST/'music-cues'/f'OA_MUSIC_{name}_78bpm_v1.flac';run(['-i',wav,'-c:a','flac','-sample_fmt','s32',flac])
    cue_manifest.append({'name':name,'file':str(flac.relative_to(R/'public')),'sha256':hashlib.sha256(flac.read_bytes()).hexdigest(),'duration':len(s)/SR,'bpm':78,'root':'D/A-centered, with F-family warmth in the human cue','purpose':cfg['purpose'],'provenance':'Original deterministic additive/noise synthesis and authored note sequence; no third-party music or model/API request'})

sections=json.loads((R/'docs/production/singularity/rebuild/sequence-plan.json').read_text())['sections']
moods=['curious','strain','eerie','curious','evidence','wonder','evidence','curious','evidence','strain','eerie','playful','wonder','wonder','eerie','exploratory','playful','exploratory','curious','wonder','exploratory','eerie','evidence','evidence','warm','curious','question']
music=np.zeros((N,2),np.float32);weights=np.zeros(N,np.float32);mood_rows=[]
for k,(section,mood) in enumerate(zip(sections,moods)):
    start=section['startFrame']/30;end=section['endFrame']/30 if k<len(sections)-1 else D
    # Crossfade adjacent authored moods across 1.4s, using the same tonal center.
    i=max(0,round((start-.7)*SR));j=min(N,round((end+.7)*SR));t=np.arange(j-i)/SR+i/SR
    env=np.minimum(1,np.maximum(0,(t-(start-.7))/1.4))*np.minimum(1,np.maximum(0,((end+.7)-t)/1.4))
    cue=music_cues[mood];positions=((np.arange(j-i)+(k*SR*3))%len(cue)).astype(int)
    # Reusable cue ends are already faded. Alternating offset avoids repeating
    # the exact same opening gesture at every scene boundary.
    target=-35 if mood not in ['eerie','question'] else -37
    s=cue[positions]*10**((target+23)/20)
    music[i:j]+=s*env[:,None];weights[i:j]+=env
    mood_rows.append({'sequence':section['name'],'start':start,'end':end,'mood':mood,'purpose':families[mood]['purpose'],'base_music_rms_dbfs':target})
music/=np.maximum(1,weights)[:,None]
# Thin the music around central reversals and the spoken final question.
for start,end in [(24,26),(146.4,148.5),(264,266.5),(399,401.2),(531,537.4)]:
    i,j=round(start*SR),round(end*SR);t=np.arange(j-i)/SR;env=np.minimum(1,np.minimum(t/.3,(end-start-t)/.5));music[i:j]*=(1-.76*env)[:,None]

# Priority: narration, focal SFX, then music. Guard active buses with a forward
# margin and slow recovery. A silent effects track is not a music target.
mr=envelope(music);er=envelope(effects);gain=np.ones_like(mr)
va=vr>10**(-34/20);ea=er>10**(-42/20)
gain[va]=np.minimum(gain[va],vr[va]*10**(-15/20)/np.maximum(mr[va],1e-9))
gain[ea]=np.minimum(gain[ea],er[ea]*10**(-9/20)/np.maximum(mr[ea],1e-9))
band_mr=playback_band_envelope(music);band_er=playback_band_envelope(effects);band_vr=playback_band_envelope(reference)
band_ea=band_er>10**(-44/20);band_va=band_vr>10**(-35/20)
gain[band_ea]=np.minimum(gain[band_ea],band_er[band_ea]*10**(-11/20)/np.maximum(band_mr[band_ea],1e-9))
gain[band_va]=np.minimum(gain[band_va],band_vr[band_va]*10**(-17/20)/np.maximum(band_mr[band_va],1e-9))
gain=minimum_filter1d(gain,3,mode='nearest')
for i in range(1,len(gain)):gain[i]=min(gain[i],gain[i-1]+.18*(gain[i]-gain[i-1]))
music*=sample_control(gain)[:,None]
fade=np.clip((D-np.arange(N)/SR)/3.8,0,1).astype(np.float32)
for bus in [effects,atmosphere,music]:bus*=fade[:,None]
effects*=np.minimum(1,np.arange(N)/SR/.22).astype(np.float32)[:,None]
def save(name,s,rate):
    assert np.isfinite(s).all() and np.max(np.abs(s))<1,(name,float(np.max(np.abs(s))))
    wav=OUT/(name+'.wav');pcm(wav,s);run(['-i',wav,'-c:a','aac','-b:a',rate,'-movflags','+faststart',DEST/(name+'.m4a')]);return wav
fx=save('effects',effects,'192k');amb=save('atmosphere',atmosphere,'128k');score=save('music',music,'160k')
graph=f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=.92,apad,atrim=duration={D}[voice];[voice][1:a][2:a][3:a]amix=inputs=4:normalize=0,alimiter=limit=.8414:level=0:latency=1,apad,atrim=duration={D}[mix]'
run(['-i',voice_path,'-i',fx,'-i',amb,'-i',score,'-filter_complex',graph,'-map','[mix]','-ar',SR,'-c:a','aac','-b:a','192k','-movflags','+faststart',DEST/'final-mix.m4a'])
mr=envelope(music);er=envelope(effects)
levels=[]
for event in events:
    if event['bus']!='effects':continue
    i=round(event['time']*SR);j=min(N,i+round(event['duration']*SR));v=np.sqrt(np.mean(reference[i:j]**2));e=np.sqrt(np.mean(effects[i:j]**2));m=np.sqrt(np.mean(music[i:j]**2))
    levels.append({'time':event['time'],'cue':event['cue'],'new_placement':event['new_placement'],'voice_rms_dbfs':db(v),'effects_rms_dbfs':db(e),'music_rms_dbfs':db(m),'effects_below_voice_db':db(v/max(e,1e-9)),'music_below_effects_db':db(e/max(m,1e-9))})
record={'frames':FRAMES,'seconds':D,'source_voice':T['audioFile'],'source_voice_sha256':T['audioSha256'],'voice_speed':1,'voice_pitch_shift':0,'voice_mix_gain':.92,'sfx_boost_db':SFX_BOOST_DB,'new_focal_effect_placements':sum(x['new_placement'] for x in events),'events':events,'music_moods':mood_rows,'music_cues':cue_manifest,'event_window_levels':levels,'median_effects_below_voice_db':float(np.median([x['effects_below_voice_db'] for x in levels if x['voice_rms_dbfs']>-35])),'median_music_below_focal_sfx_db':float(np.median([x['music_below_effects_db'] for x in levels])),'active_sfx_music_guard_9db_percent':float(np.mean(mr[ea]<=er[ea]*10**(-8/20))*100),'active_voice_music_guard_15db_percent':float(np.mean(mr[va]<=vr[va]*10**(-14/20))*100),'source_library':'assets/audio/library/curio-bureau/IMPORT.json','new_voice_or_generative_service_requests':0,'new_music_method':'Original authored sequences with felt/plucked additive tones, detuned pads and filtered noise; nine reusable source cues saved as FLAC','review_limits':'Direct audio audition is unavailable. Bus-level and timing checks are measurable; listening approval remains with the user.'}
(DOC/'sound-design.json').write_text(json.dumps(record,indent=2)+'\n')
(DEST/'music-cues/CATALOG.json').write_text(json.dumps(cue_manifest,indent=2)+'\n')
(DEST/'README.md').write_text('# Final singularity audio and reusable music\n\nCommitted effects, atmosphere, music and final-mix M4A stems. `music-cues/` contains nine newly composed original FLAC cues and their catalog for future reuse. Material SFX are reused from the imported Curio Bureau library. The original Knox source/timing is unchanged. Rebuild with `npm run sound:singularity-v4`; mood timing, placement and measurable mix priorities are in `docs/production/singularity/final-mix/sound-design.json`. No voice or generative-service request is made. Direct audio audition is unavailable here.\n')
print('Built +'+str(SFX_BOOST_DB)+'dB SFX revision,',record['new_focal_effect_placements'],'additional actions and nine original music cues.',flush=True)
print('Median SFX below voice:',round(record['median_effects_below_voice_db'],1),'dB; music below focal SFX:',round(record['median_music_below_focal_sfx_db'],1),'dB.',flush=True)
print('Active-window guards:',record['active_sfx_music_guard_9db_percent'],record['active_voice_music_guard_15db_percent'],flush=True)
