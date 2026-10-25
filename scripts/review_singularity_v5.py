"""Verify score presence, not merely an upper bound on its volume."""
from pathlib import Path
import json,hashlib,re,math,subprocess
import numpy as np
from scipy.signal import correlate,correlation_lags

R=Path(__file__).resolve().parents[1];SR=8000
T=json.loads((R/'src/data/singularity-narration.json').read_text());F=T['durationInFrames']+360;D=F/30
DEL=R/'assets/videos/singularity-v5';MOV=DEL/'singularity-music-forward.mp4';OLD=R/'assets/videos/singularity-v4/singularity-final-mix.mp4';DOC=R/'docs/production/singularity/music-presence';OUT=R/'out/singularity-v5'
def run(a):return subprocess.run(a,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]).stdout)
def mono(p):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(p),'-vn','-ar',str(SR),'-ac','1','-f','f32le','-']).stdout,np.float32)
def pic(p):return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-c:v','copy','-bsf:v','h264_mp4toannexb','-f','h264','-']).stdout).hexdigest()
def rms(s,hop=8000):
    n=len(s)//hop;return np.sqrt(np.mean(s[:n*hop].reshape(n,hop)**2,axis=1)+1e-15)
def db(x):return 20*np.log10(np.maximum(x,1e-10))
p=probe(MOV);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',F)
assert a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
assert abs(float(p['format']['duration'])-D)<.05 and MOV.stat().st_size<100*1024*1024
assert pic(MOV)==pic(OLD)
baseline=json.loads((R/'docs/production/singularity/final-mix/delivery.json').read_text());assert sha(OLD)==baseline['sha256']
assert sha(R/'public'/T['audioFile'])==T['audioSha256']
cfg=json.loads((DOC/'sound-design.json').read_text())
for cue in cfg['source_cues_reused']:assert sha(R/'public'/cue['file'])==cue['sha256']
assert sha(R/'public'/cfg['effects_source'])==cfg['effects_source_sha256']
log=run(['ffmpeg','-hide_banner','-nostats','-i',str(MOV),'-af','volumedetect','-f','null','-']).stderr.decode();(OUT/'decode.log').write_text(log)
assert not re.search('corrupt decoded|Error while decoding|Invalid data',log,re.I)
assert int(re.findall(r'frame=\s*(\d+)',log)[-1])==F
peak=float(re.search(r'max_volume:\s*([-\d.]+) dB',log)[1]);assert peak<-.1
voice=mono(R/'public'/T['audioFile']);mix=mono(MOV);music=mono(R/'public/assets/audio/singularity-v5/music.m4a');old_music=mono(R/'public/assets/audio/singularity-v4/music.m4a');effects=mono(R/'public'/cfg['effects_source'])
vr=rms(voice*.92);mr=rms(music);oldr=rms(old_music);n=min(len(vr),len(mr),len(oldr));vr,mr,oldr=vr[:n],mr[:n],oldr[:n]
talk=vr>10**(-32/20);valid=talk&(oldr>10**(-65/20))
increase=db(mr[valid]/oldr[valid]);gap=db(vr[talk]/np.maximum(mr[talk],1e-10));level=db(mr[talk])
assert np.median(increase)>8,('Insufficient increase',float(np.median(increase)))
assert 7<float(np.median(gap))<17,('Still too quiet or too close to speech',float(np.median(gap)))
presence=float(np.mean((gap<20)&(level>-40))*100);voice_priority=float(np.mean(gap>3)*100)
assert presence>90 and voice_priority>95,(presence,voice_priority)
er2=rms(effects,1600);mr2=rms(music,1600);nn=min(len(er2),len(mr2));prominent=er2[:nn]>10**(-31/20)
fxgap=db(er2[:nn][prominent]/np.maximum(mr2[:nn][prominent],1e-10));fx_priority=float(np.mean(fxgap>0)*100)
assert fx_priority>95,(fx_priority,float(np.median(fxgap)))
sync=[]
for second in [0,100,250,400,520]:
    x=voice[second*SR:(second+10)*SR].astype(float);y=mix[second*SR:second*SR+len(x)].astype(float)
    c=correlate(y,x,mode='full',method='fft');lags=correlation_lags(len(y),len(x));idx=np.where(abs(lags)<SR*.1)[0];best=idx[np.argmax(c[idx])]
    lag=int(lags[best]);corr=float(c[best]/math.sqrt(np.dot(x,x)*np.dot(y,y)));assert abs(lag)<=SR*.02 and corr>.85,(second,lag,corr)
    sync.append({'seconds':second,'lag_seconds':lag/SR,'correlation':corr})
assert np.sqrt(np.mean(mix[-800:]**2))<.003
chapters=[]
for i,s in enumerate(T['scenes']):
    file=DEL/'chapters'/f'singularity-music-forward-part-{i+1}.mp4';old=R/'assets/videos/singularity-v4/chapters'/f'singularity-final-mix-part-{i+1}.mp4'
    expected=(T['scenes'][i+1]['startFrame'] if i<4 else F)-s['startFrame'];cp=probe(file);cv=next(x for x in cp['streams'] if x['codec_type']=='video')
    assert int(cv['nb_frames'])==expected and file.stat().st_size<100*1024*1024 and pic(file)==pic(old)
    chapters.append({'file':str(file.relative_to(R)),'sha256':sha(file),'frames':expected,'picture_unchanged':True})
for source,name in [(OLD,'previous-music-30s.mp4'),(MOV,'corrected-music-30s.mp4')]:
    run(['ffmpeg','-y','-v','error','-ss','25','-i',str(source),'-t','30','-vf','scale=960:-2','-c:v','libx264','-crf','21','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',str(DOC/name)])
report={'file':str(MOV.relative_to(R)),'sha256':sha(MOV),'bytes':MOV.stat().st_size,'frames':F,'seconds':float(p['format']['duration']),'width':1920,'height':1080,'fps':30,'entire_picture_bitstream_unchanged':True,'effects_source_unchanged':True,'voice_source_sha256':T['audioSha256'],'voice_speed':1,'voice_pitch_shift':0,'voice_sync':sync,'full_decode':'passed','audio_peak_dbfs':peak,'decoded_median_music_increase_db':float(np.median(increase)),'decoded_median_music_below_voice_db':float(np.median(gap)),'music_present_in_voiced_windows_percent':presence,'definition_of_presence':'1s windows with active speech; music within 20dB of voice and above -40dBFS, checked after mono playback-band decoding','voice_above_music_percent':voice_priority,'prominent_sfx_above_music_percent':fx_priority,'median_prominent_sfx_above_music_db':float(np.median(fxgap)),'higher_bitrate_chapters':chapters,'user_listening_status':'pending review; direct audio audition unavailable here','previous_v4_status':'User could not hear background music; quiet-enough checks were insufficient.'}
(DOC/'delivery.json').write_text(json.dumps(report,indent=2)+'\n')
print('Music increased',round(report['decoded_median_music_increase_db'],1),'dB; now',round(report['decoded_median_music_below_voice_db'],1),'dB below voice.',flush=True)
print('Presence checks:',presence,'%; voice priority:',voice_priority,'%; prominent SFX priority:',fx_priority,'%. Picture unchanged.',flush=True)
