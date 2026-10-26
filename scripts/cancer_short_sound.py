"""Narrated cancer test: purposeful contacts, present music, reusable stems.

New organic designed cues are original synthesis, not real biological sounds.
"""
import hashlib,json,subprocess,wave
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt,resample

ROOT=Path(__file__).resolve().parents[1];SR=48000;N=76*SR
DEST=ROOT/'public/assets/audio/cancer-short-v1';NEW=DEST/'reusable-cues';NEW.mkdir(parents=True,exist_ok=True)
DOC=ROOT/'docs/production/cancer-short';TEMP=ROOT/'out/cancer-short/audio';TEMP.mkdir(parents=True,exist_ok=True)
T=json.loads((ROOT/'src/data/cancer-short-timing.json').read_text());E=T['events'];SC={s['id']:s for s in T['scenes']}
LIB=ROOT/'public/assets/audio/library/curio-bureau';CAT=json.loads((LIB/'curio_sfx_v1/CATALOG.json').read_text());CUES={c['name']:c for c in CAT['cues']}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rms(x):return float(np.sqrt(np.mean(x*x)+1e-15))
def decode(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar',str(SR),'-ac','2','-f','f32le','-']),np.float32).reshape(-1,2).copy()
def output(file,x,codec='aac'):
 x=np.asarray(x,np.float32)
 subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(SR),'-ac',str(1 if x.ndim==1 else x.shape[1]),'-i','-','-c:a',codec,*(['-sample_fmt','s32'] if codec=='flac' else ['-b:a','192k']),str(file)],input=x.tobytes(),check=True)
def block_rms(x):return np.sqrt(np.mean(x[:N//9600*9600].mean(axis=1).reshape(-1,9600)**2,axis=1)+1e-15)

def organic(kind,duration,seed):
 rng=np.random.default_rng(seed);t=np.arange(round(duration*SR))/SR;q=t/duration
 noise=sosfilt(butter(3,[180,3200],btype='bandpass',fs=SR,output='sos'),rng.standard_normal(len(t)))
 if kind=='membrane_divide':
  env=np.sin(np.pi*q)**1.6;hz=170-95*q+22*np.sin(q*5);tone=np.sin(TAU*np.cumsum(hz)/SR)
  mono=(noise*.22+tone*.19+np.sin(TAU*np.cumsum(hz*1.49)/SR)*.07)*env
 elif kind=='cell_contact':
  env=(1-np.exp(-t*60))*np.exp(-t*8);hz=310*np.exp(-t*3)+85
  mono=(np.sin(TAU*np.cumsum(hz)/SR)*.22+noise*.24)*env
 elif kind=='soft_lysis':
  env=(1-np.exp(-t*18))*np.exp(-t*3);pops=np.zeros(len(t))
  for k in range(7):
   age=t-k*.075;active=age>=0;pops+=np.sin(TAU*(460-k*31)*age)*np.exp(-np.maximum(age,0)*35)*active*.1
  mono=(noise*.38+pops)*env
 else:
  env=(1-np.exp(-t*16))*np.exp(-t*2.7)
  mono=sum(np.sin(TAU*hz*t)*amp for hz,amp in [(220,.12),(330,.07),(440,.04)])*env+noise*.02*env
 stereo=np.stack([mono,np.roll(mono,43)*.45+mono*.55],axis=1).astype(np.float32)
 stereo*=.6/max(float(np.max(np.abs(stereo))),1e-8);return stereo
TAU=2*np.pi
sources={};cache={}
for i,(kind,duration) in enumerate([('membrane_divide',.95),('cell_contact',.48),('soft_lysis',1.3),('recognition_warm',1.7)]):
 p=NEW/(kind+'.flac');sound=organic(kind,duration,870+i);output(p,sound,'flac');cache[kind]=sound
 sources[kind]={'file':str(p.relative_to(ROOT)),'sha256':sha(p),'production':'Original seeded procedural synthesis; not authentic biological Foley','seed':870+i,'duration':duration}

placements=[];fx=np.zeros((N,2),np.float32)
def place(frame,name,db=-25,duration=None,reason='',pan=0):
 if name not in cache:
  row=CUES[name];p=LIB/row['path'].removeprefix('audio/');assert sha(p)==row['sha256'];cache[name]=decode(p);sources[name]={'file':str(p.relative_to(ROOT)),'sha256':row['sha256'],'production':'Reused original Curio Bureau designed cue'}
 s=cache[name].copy()
 if duration:s=resample(s,round(duration*SR),axis=0).astype(np.float32)
 s*=10**(db/20)/max(rms(s),1e-9)
 s[:,0]*=1-.22*max(pan,0);s[:,1]*=1-.22*max(-pan,0)
 peak=np.argmax(np.max(np.abs(s),axis=1));start=round(frame/30*SR)-int(peak);begin=max(0,start);skip=max(0,-start);count=min(N-begin,len(s)-skip)
 if count>0:fx[begin:begin+count]+=s[skip:skip+count]
 placements.append({'frame':frame,'seconds':frame/30,'cue':name,'target_rms_dbfs':db,'adapted_duration':duration,'reason':reason,'peak_aligned':True})
place(37,'radar_sweep',-29,1.8,'Immune scan passes apparently familiar cell')
place(E['grow'],'cell_contact',-24,None,'Growth signal docks at membrane',-.4)
place(E['repair']+8,'recognition_warm',-27,.6,'DNA gap repaired')
place(E['stop']+2,'cell_contact',-25,None,'Neighbor contact stops growth',.4)
place(E['destroy']+10,'soft_lysis',-23,.9,'Damaged control cell fragments')
place(E['mutation']+8,'lost_signal',-25,.8,'Growth safeguard is disrupted')
for frame in [E['two']+40,E['four']+36,E['four']+43]:place(frame,'membrane_divide',-23,.9,'Connected membrane pinches and daughter cells separate')
place(E['crowd']+22,'soft_depth_pass',-26,1.2,'Growing clone displaces neighboring cells')
place(SC['surveillance']['start_frame']+44,'cell_contact',-23,None,'Immune recognition contact')
place(SC['surveillance']['start_frame']+65,'data_pulse',-28,.65,'Cytotoxic granules cross contact')
place(SC['surveillance']['start_frame']+88,'soft_lysis',-24,None,'Recognized control target breaks apart')
place(E['evade']+15,'soft_depth_pass',-26,1,'Surface recognition changes')
place(E['inhibit']+5,'evidence_lock',-24,.48,'Inhibitory contact stops the attack; molecular lock is a visual metaphor')
place(SC['disguise']['start_frame']+42,'heartbeat_breath',-29,1.6,'Hidden growth raises narrative tension')
place(SC['spread']['start_frame']+45,'membrane_divide',-24,1.1,'Migrant cell deforms through tissue gap')
place(SC['spread']['start_frame']+95,'parallax_swish',-25,1.4,'Blood flow transports migrant and red cells')
place(SC['spread']['start_frame']+143,'cell_contact',-24,None,'Cell reaches a second tissue site')
place(SC['question']['start_frame']+15,'document_focus',-27,.7,'Microscope pullback')
place(SC['question']['start_frame']+35,'screw_jack_turn',-29,.7,'Clinician adjusts microscope focus')
place(SC['therapy']['start_frame']+77,'cell_contact',-24,None,'Antibody arrives at inhibitory interaction')
place(E['brakes']+6,'recognition_warm',-23,1.2,'Blocked inhibitory contact releases immune action')
place(E['brakes']+42,'data_pulse',-28,.75,'Renewed cytotoxic contact')
place(E['brakes']+67,'soft_lysis',-23,1.15,'Target cell fragments after restored attack')
place(SC['outcomes']['start_frame']+40,'soft_lysis',-25,.95,'One lesion responds')
place(E['not_everyone']+15,'low_cinematic_hit',-27,1,'A contrasting lesion persists')
place(E['many']+30,'soft_depth_pass',-27,1.6,'Different cancer-cell identities remain visible')
place(E['see']+18,'recognition_warm',-27,1.6,'Closing recognition question; not a promised cure')
for sid,name,db in [('mutation','perspective_whip',-28),('surveillance','soft_depth_pass',-28),('spread','soft_depth_pass',-27),('therapy','perspective_whip',-28),('ending','soft_depth_pass',-29)]:
 place(SC[sid]['start_frame']+10,name,db,.8,'Object/contact/tissue handoff into '+sid)

# Reused score changes with narrative state, equal-power blended at each join.
music=np.zeros((N,2),np.float32);mood_rows=[]
moods=[(0,14.5,'curious'),(14.5,41.5,'eerie'),(41.5,50.4,'strain'),(50.4,67.4,'warm'),(67.4,76,'question')]
for i,(a,b,mood) in enumerate(moods):
 p=next((ROOT/'public/assets/audio/singularity-v4/music-cues').glob('*_'+mood+'_*'))
 raw=decode(p);raw[:,1]=.65*raw[:,0]+.35*raw[:,1]
 count=N;offset=round(i*.7*SR);loop=np.tile(raw,(int(np.ceil((N+offset)/len(raw))),1))[offset:offset+N]
 t=np.arange(N)/SR;env=np.minimum(np.clip((t-a+.65)/.65,0,1),np.clip((b+.65-t)/.65,0,1))
 if i==0:env[t<.08]=t[t<.08]/.08
 if i==len(moods)-1:env*=np.clip((76-t)/1.1,0,1)
 loop*=10**(-27/20)/max(rms(loop),1e-9);music+=loop*env[:,None]
 mood_rows.append({'start':a,'end':b,'mood':mood,'file':str(p.relative_to(ROOT)),'sha256':sha(p)})
voice=decode(DEST/'narration.wav');voice=voice[:N];active_voice=block_rms(voice)>10**(-34/20)
vscale=10**(-19/20)/max(float(np.median(block_rms(voice)[active_voice])),1e-9);voice*=vscale
fx_rms=block_rms(fx);music_rms=block_rms(music);active_fx=fx_rms>10**(-32/20)
music*=.85/max(float(np.median(music_rms[active_fx]/fx_rms[active_fx])),1e-9)
# Keep both music and focal effects below typical active narration.
vlevel=float(np.median(block_rms(voice)[active_voice]));mlevel=float(np.median(block_rms(music)[active_voice]))
if mlevel>vlevel*.42:music*=vlevel*.42/mlevel
ambient=decode(LIB/CUES['cavern_lowwind']['path'].removeprefix('audio/'));ambient=np.tile(ambient,(int(np.ceil(N/len(ambient))),1))[:N]
ambient*=10**(-40/20)/max(rms(ambient),1e-9)
time=np.arange(N)/SR;end=np.clip((76-time)/.85,0,1)
for x in [fx,music,ambient]:x*=end[:,None]
mix=voice+fx+music+ambient;gain=min(1,10**(-1.8/20)/max(float(np.max(np.abs(mix))),1e-9))
for x in [voice,fx,music,ambient,mix]:x*=gain
for name,x in [('narration-edited',voice),('effects',fx),('music',music),('atmosphere',ambient),('final-mix',mix)]:output(DEST/(name+'.m4a'),x)
active=block_rms(fx)>10**(-35/20)
report={'duration_seconds':76,'new_narration_requests':1,'new_original_designed_cues':4,'new_music_generation_requests':0,'source_effects':sources,'placements':placements,'music_moods':mood_rows,'narration_gain':vscale,'shared_peak_gain':gain,'target_music_to_typical_active_sfx_rms_ratio':.85,'measured_ratio_after_speech_ceiling':float(np.median(block_rms(music)[active]/np.maximum(block_rms(fx)[active],1e-9))),'music_to_active_voice_db':20*np.log10(float(np.median(block_rms(music)[active_voice]))/float(np.median(block_rms(voice)[active_voice]))),'pcm_peak_dbfs':20*np.log10(float(np.max(np.abs(mix)))),'audio_scope':'Existing original library/music plus four new original synthetic organic cues. No authentic medical sound or reference soundtrack claimed.','direct_listening_review':'Not available in this runtime; provider alignment, independent ASR, signal levels and decoding are checked.'}
(DOC/'sound-design.json').write_text(json.dumps(report,indent=2)+'\n')
(DEST/'README.md').write_text('# Cancer short audio v1\n\nNew ElevenLabs George/v3 narration, original response/alignment and a pause-only76s edit; existing Knox source unchanged. Music and Curio effects are reused with recorded source hashes and narrative timing. Four new original synthesized organic cues are in reusable-cues/. Narration, effects, music, atmosphere and final mixes are retained for reuse. See docs/production/cancer-short/sound-design.json and generation.json for provenance. No reference audio is copied. Direct listening review is not claimed.\n')
print(json.dumps({'placements':len(placements),'new_reusable_cues':4,'peak_dbfs':report['pcm_peak_dbfs'],'music_voice_db':report['music_to_active_voice_db'],'music_sfx_ratio':report['measured_ratio_after_speech_ceiling']},indent=2))
