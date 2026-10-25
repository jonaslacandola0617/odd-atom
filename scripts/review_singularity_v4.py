"""Measure the final audio hierarchy and verify every picture frame is retained."""
from pathlib import Path
import hashlib,json,math,re,subprocess
import numpy as np
from scipy.signal import correlate,correlation_lags

R=Path(__file__).resolve().parents[1];T=json.loads((R/'src/data/singularity-narration.json').read_text());FRAMES=T['durationInFrames']+360;D=FRAMES/30
DEL=R/'assets/videos/singularity-v4';MOV=DEL/'singularity-final-mix.mp4';OLD=R/'assets/videos/singularity-v3/singularity-sound-ending.mp4'
DOC=R/'docs/production/singularity/final-mix';OUT=R/'out/singularity-v4';SR=8000
def run(args):return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]).stdout)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def video_sha(p):return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-an','-c:v','copy','-bsf:v','h264_mp4toannexb','-f','h264','-']).stdout).hexdigest()
def mono(p):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(p),'-vn','-ac','1','-ar',str(SR),'-f','f32le','-']).stdout,np.float32)
def db(x):return float(20*np.log10(max(1e-10,float(x))))
P=probe(MOV);v=next(x for x in P['streams'] if x['codec_type']=='video');a=next(x for x in P['streams'] if x['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',FRAMES)
assert v['codec_name']=='h264' and a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
assert abs(float(P['format']['duration'])-D)<.05 and MOV.stat().st_size<100*1024*1024
assert video_sha(OLD)==video_sha(MOV),'An audio-only revision changed the picture'
log=run(['ffmpeg','-hide_banner','-nostats','-i',str(MOV),'-af','volumedetect','-f','null','-']).stderr.decode();(OUT/'decode.log').write_text(log)
assert not re.search('corrupt decoded|Error while decoding|Invalid data',log,re.I)
assert int(re.findall(r'frame=\s*(\d+)',log)[-1])==FRAMES
peak=float(re.search(r'max_volume:\s*([-\d.]+) dB',log)[1]);assert peak<-.1
old_report=json.loads((R/'docs/production/singularity/sound-ending/delivery.json').read_text());assert sha(OLD)==old_report['sha256']
assert sha(R/'public'/T['audioFile'])==T['audioSha256']
for file,expected in json.loads((R/'docs/production/singularity/rebuild/delivery.json').read_text())['preserved_baselines'].items():assert sha(R/file)==expected
library=R/'public/assets/audio/library/curio-bureau';inventory=json.loads((library/'IMPORT.json').read_text())
for file in inventory['files']:assert sha(library/file['file'])==file['sha256']
music_catalog=json.loads((R/'public/assets/audio/singularity-v4/music-cues/CATALOG.json').read_text())
for cue in music_catalog:assert sha(R/'public'/cue['file'])==cue['sha256']
print('All picture packets are unchanged; full decode, peak and source checks passed.',flush=True)

voice=mono(R/'public'/T['audioFile']);mix=mono(MOV);sync=[]
for second in [0,100,250,400,520]:
    x=voice[second*SR:(second+10)*SR].astype(float);y=mix[second*SR:second*SR+len(x)].astype(float)
    c=correlate(y,x,mode='full',method='fft');lags=correlation_lags(len(y),len(x));idx=np.where(abs(lags)<=SR*.1)[0];best=idx[np.argmax(c[idx])]
    lag=int(lags[best]);corr=float(c[best]/math.sqrt(np.dot(x,x)*np.dot(y,y)))
    assert abs(lag)<=SR*.02 and corr>.85,(second,lag,corr)
    sync.append({'seconds':second,'lag_seconds':lag/SR,'correlation':round(corr,6)})
fx=mono(R/'public/assets/audio/singularity-v4/effects.m4a');music=mono(R/'public/assets/audio/singularity-v4/music.m4a');old_fx=mono(R/'public/assets/audio/singularity-v3/effects.m4a')
def windows(s,hop=1600):
    n=len(s)//hop;return np.sqrt(np.mean(s[:n*hop].reshape(n,hop)**2,axis=1)+1e-15)
mr=windows(music);er=windows(fx);vr=windows(np.pad(voice*.92,(0,max(0,len(fx)-len(voice)))))
n=min(len(mr),len(er),len(vr));mr,er,vr=mr[:n],er[:n],vr[:n]
ea=er>10**(-42/20);va=vr>10**(-34/20)
below_fx=20*np.log10(np.maximum(er[ea],1e-10)/np.maximum(mr[ea],1e-10));below_voice=20*np.log10(np.maximum(vr[va],1e-10)/np.maximum(mr[va],1e-10))
fx_pass=float(np.mean(below_fx>=7)*100);voice_pass=float(np.mean(below_voice>=13)*100)
assert fx_pass>98 and voice_pass>98,(fx_pass,voice_pass)
matched=[]
for e in json.loads((R/'docs/production/singularity/sound-ending/sound-design.json').read_text())['events']:
    if e['bus']!='effects':continue
    i=round(e['time']*SR);j=i+round(e['duration']*SR);before=np.sqrt(np.mean(old_fx[i:j]**2));after=np.sqrt(np.mean(fx[i:j]**2))
    if before>.001:matched.append(db(after/max(before,1e-10)))
assert np.median(matched)>=3,'The encoded effects did not increase enough relative to v3'
last=float(np.sqrt(np.mean(mix[-800:]**2)));earlier=float(np.sqrt(np.mean(mix[-16000:-8000]**2)))
assert last<.003 and last<earlier*.5
print('Decoded music stays below active SFX and voice; matched SFX increase:',round(float(np.median(matched)),2),'dB.',flush=True)

chapters=[]
for i,s in enumerate(T['scenes']):
    p=DEL/'chapters'/f'singularity-final-mix-part-{i+1}.mp4';old=R/'assets/videos/singularity-v3/chapters'/f'singularity-sound-ending-part-{i+1}.mp4';cp=probe(p);cv=next(x for x in cp['streams'] if x['codec_type']=='video')
    expected=(T['scenes'][i+1]['startFrame'] if i<4 else FRAMES)-s['startFrame']
    assert int(cv['nb_frames'])==expected and p.stat().st_size<100*1024*1024 and video_sha(p)==video_sha(old)
    chapters.append({'file':str(p.relative_to(R)),'sha256':sha(p),'frames':expected,'picture_bitstream_unchanged':True})

# Preview pairs expose the same 30 seconds for the user's listening review.
for source,name in [(OLD,'previous-mix-30s.mp4'),(MOV,'revised-mix-30s.mp4')]:
    run(['ffmpeg','-y','-v','error','-ss','146','-i',str(source),'-t','30','-vf','scale=960:-2','-c:v','libx264','-crf','21','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',str(DOC/name)])
copy=json.loads((R/'docs/publishing/singularity/upload-copy.json').read_text());assert len(copy['title'])<=100 and len(copy['description'])<=5000
times=[int(c['timestamp'].split(':')[0])*60+int(c['timestamp'].split(':')[1]) for c in copy['chapters']]
assert times[0]==0 and all(b-a>=10 for a,b in zip(times,times[1:])) and D-times[-1]>=10
sound=json.loads((DOC/'sound-design.json').read_text())
report={'file':str(MOV.relative_to(R)),'sha256':sha(MOV),'bytes':MOV.stat().st_size,'frames':FRAMES,'seconds':float(P['format']['duration']),'width':1920,'height':1080,'fps':30,'full_decode':'passed','entire_picture_bitstream_unchanged':True,'previous_v3_file_unchanged':True,'original_voice_sha256':T['audioSha256'],'voice_speed':1,'voice_pitch_shift':0,'voice_sync':sync,'audio_peak_dbfs':peak,'sample_rate':48000,'channels':2,'nominal_sfx_boost_db':sound['sfx_boost_db'],'measured_median_existing_cue_increase_db':float(np.median(matched)),'extra_action_cues':sound['new_focal_effect_placements'],'new_reusable_original_music_cues':len(music_catalog),'music_at_least_7db_below_active_sfx_percent':fx_pass,'music_at_least_13db_below_active_voice_percent':voice_pass,'median_music_below_active_sfx_db':float(np.median(below_fx)),'median_music_below_active_voice_db':float(np.median(below_voice)),'music_mood_sequences':len(sound['music_moods']),'higher_bitrate_chapters':chapters,'youtube_copy':'docs/publishing/singularity/README.md','publishing_status':'draft_not_published','listening_review':'pending user; direct audio audition unavailable','animation_status':'No new animation pass is claimed; prior user feedback remains recorded.'}
(DOC/'delivery.json').write_text(json.dumps(report,indent=2)+'\n')
print('Saved final report, sound previews and checked YouTube copy.',flush=True)
