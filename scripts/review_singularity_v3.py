"""Validate the delivered sound/ending revision, without claiming an audition."""
from pathlib import Path
import hashlib,json,math,re,subprocess
import numpy as np
from scipy.signal import correlate,correlation_lags
from PIL import Image,ImageDraw,ImageFont

R=Path(__file__).resolve().parents[1];T=json.loads((R/'src/data/singularity-narration.json').read_text())
FRAMES=T['durationInFrames']+360;D=FRAMES/30
OUT=R/'out/singularity-v3';DOC=R/'docs/production/singularity/sound-ending';DEL=R/'assets/videos/singularity-v3'
MOV=DEL/'singularity-sound-ending.mp4';OLD=R/'assets/videos/singularity-v2/singularity-rebuilt-8m56.mp4'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]).stdout)
p=probe(MOV);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',FRAMES)
assert v['codec_name']=='h264' and a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
assert abs(float(p['format']['duration'])-D)<.05 and MOV.stat().st_size<100*1024*1024
packets=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts_time,dts_time','-of','json',str(MOV)]).stdout)['packets']
pts=sorted(float(x['pts_time']) for x in packets);dts=[float(x['dts_time']) for x in packets]
assert len(pts)==FRAMES and np.max(np.abs(np.diff(pts)-1/30))<.00001
assert np.all(np.diff(dts)>0),'Non-monotonic picture decode timestamps'
decode=run(['ffmpeg','-hide_banner','-nostats','-i',str(MOV),'-af','volumedetect','-vf','blackdetect=d=.4:pix_th=.03:pic_th=.98','-f','null','-']).stderr.decode()
(OUT/'decode.log').write_text(decode)
assert not re.search('corrupt decoded|Error while decoding|Invalid data|black_start:',decode,re.I)
assert int(re.findall(r'frame=\s*(\d+)',decode)[-1])==FRAMES
peak=float(re.search(r'max_volume:\s*([-\d.]+) dB',decode)[1]);assert peak<-.1
print('Final movie decodes:',FRAMES,'frames; peak',peak,'dBFS.',flush=True)

baseline=json.loads((R/'docs/production/singularity/rebuild/delivery.json').read_text())
for file,expected in baseline['preserved_baselines'].items():assert sha(R/file)==expected,file
assert sha(OLD)==baseline['sha256'];assert sha(R/'public'/T['audioFile'])==T['audioSha256']
library=R/'public/assets/audio/library/curio-bureau';inventory=json.loads((library/'IMPORT.json').read_text())
for item in inventory['files']:assert sha(library/item['file'])==item['sha256'],item['file']

def mono(path):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(path),'-vn','-ar','8000','-ac','1','-f','f32le','-']).stdout,np.float32)
voice=mono(R/'public'/T['audioFile']);mixed=mono(MOV);sync=[]
for second in [0,100,250,400,520]:
    x=voice[second*8000:(second+10)*8000].astype(float);y=mixed[second*8000:second*8000+len(x)].astype(float)
    c=correlate(y,x,mode='full',method='fft');lags=correlation_lags(len(y),len(x));idx=np.where(np.abs(lags)<=800)[0];best=idx[np.argmax(c[idx])]
    lag=int(lags[best]);corr=float(c[best]/math.sqrt(np.dot(x,x)*np.dot(y,y)))
    assert abs(lag)<=160 and corr>.85,(second,lag,corr)
    sync.append({'start_seconds':second,'lag_seconds':lag/8000,'correlation':round(corr,6)})
tail_end=float(np.sqrt(np.mean(mixed[-800:]**2)));tail_before=float(np.sqrt(np.mean(mixed[-16000:-8000]**2)))
assert tail_end<.003 and tail_end<tail_before*.5,'The ending audio does not taper sufficiently'
print('Original Knox source/timing and library hashes match; ending tapers.',flush=True)

chapters=[]
for i,s in enumerate(T['scenes']):
    path=DEL/'chapters'/f'singularity-sound-ending-part-{i+1}.mp4';cp=probe(path);cv=next(x for x in cp['streams'] if x['codec_type']=='video')
    expected=(T['scenes'][i+1]['startFrame'] if i<4 else FRAMES)-s['startFrame']
    assert int(cv['nb_frames'])==expected and path.stat().st_size<100*1024*1024
    chapters.append({'file':str(path.relative_to(R)),'frames':expected,'bytes':path.stat().st_size,'sha256':sha(path)})

# The first four chapter pictures were remuxed, with no video encoding change.
packet_checks=[]
def elementary(path):return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(path),'-map','0:v:0','-an','-c:v','copy','-bsf:v','h264_mp4toannexb','-f','h264','-']).stdout).hexdigest()
for i in range(1,5):
    old=R/'assets/videos/singularity-v2/chapters'/f'singularity-rebuilt-part-{i}.mp4';new=DEL/'chapters'/f'singularity-sound-ending-part-{i}.mp4'
    assert elementary(old)==elementary(new)
    packet_checks.append({'chapter':i,'picture_bitstream_unchanged':True})
print('First four higher-bitrate chapter pictures are bitstream-identical.',flush=True)
prefix_samples=[]
for offset in [35.5,84.8]:
    old=R/'assets/videos/singularity-v2/chapters/singularity-rebuilt-part-5.mp4';new=DEL/'chapters/singularity-sound-ending-part-5.mp4'
    stats=run(['ffmpeg','-hide_banner','-nostats','-ss',str(offset),'-i',str(old),'-ss',str(offset),'-i',str(new),'-filter_complex','[0:v][1:v]ssim','-frames:v','1','-an','-f','null','-']).stderr.decode()
    value=float(re.findall(r'All:([\d.]+)',stats)[-1]);assert value>.98,(offset,value)
    prefix_samples.append({'chapter_local_seconds':offset,'ssim':value})

font=ImageFont.truetype(str(R/'public/assets/fonts/Outfit.ttf'),18)
frames=[15620,15650,15780,15930,16040,16098,16180,16270,16340,16420,16458]
board=Image.new('RGB',(1600,3*255),'#151630');d=ImageDraw.Draw(board)
for i,f in enumerate(frames):
    path=OUT/f'encoded-ending-{f}.png';run(['ffmpeg','-y','-v','error','-ss',str(f/30),'-i',str(MOV),'-frames:v','1',str(path)])
    im=Image.open(path).convert('RGB');im.thumbnail((400,225));x=i%4*400;y=i//4*255;board.paste(im,(x,y));d.text((x+6,y+230),f'{f/30:.2f}s / frame {f}',font=font,fill='#fff0ce')
board.save(DOC/'ending-sequence.jpg',quality=92)
run(['ffmpeg','-y','-v','error','-ss','526','-i',str(MOV),'-filter_complex','[0:v]fps=15,scale=640:-2,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-an','-loop','0',str(DOC/'ending-preview.gif')])

# Same speech/images at these timestamps; review clips are explicitly named.
for movie,name in [(OLD,'previous-sound-30s.mp4'),(MOV,'revised-sound-30s.mp4')]:
    run(['ffmpeg','-y','-v','error','-ss','146','-i',str(movie),'-t','30','-vf','scale=960:-2','-c:v','libx264','-crf','21','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',str(DOC/name)])
sound=json.loads((DOC/'sound-design.json').read_text())
report={'file':str(MOV.relative_to(R)),'sha256':sha(MOV),'bytes':MOV.stat().st_size,'frames':FRAMES,'duration_seconds':float(p['format']['duration']),'width':1920,'height':1080,'fps':30,'full_decode':'passed','unexpected_black_segments':0,'audio_peak_dbfs':peak,'audio_sample_rate':48000,'channels':2,'voice_source_sha256':T['audioSha256'],'voice_speed':1,'voice_pitch_shift':0,'voice_sync':sync,'voice_credits_used':0,'new_generative_sound_requests':0,'library_import_audio_files':sum(x['file'].endswith(('.flac','.mp3')) for x in inventory['files']),'distinct_existing_cues_used':sound['distinct_library_cues_used'],'cue_placements_including_ambient_loops':len(sound['events']),'median_effect_below_simultaneous_voice_db':sound['median_effect_below_simultaneous_voice_db'],'added_visual_tail_seconds':12,'tail_after_source_recording_seconds':D-T['durationSeconds'],'last_100ms_rms':tail_end,'previous_tail_window_rms':tail_before,'first_four_chapter_picture_checks':packet_checks,'higher_bitrate_chapters':chapters,'original_v2_file_unchanged':True,'default_on_screen_text':False,'prior_animation_user_status':'not_passed','revision_creative_status':'pending user review','review_limits':'Direct audio audition is unavailable. These are source/hash, encoded-format, level, waveform/sync and representative visual checks, not a listening approval or a new animation pass.'}
report.update(monotonic_decode_timestamps=True,constant_frame_packet_spacing=True)
report['chapter_five_prefix_sample_ssim']=prefix_samples
(DOC/'delivery.json').write_text(json.dumps(report,indent=2)+'\n')
print('Saved ending review, 30-second old/new sound clips and delivery report.',flush=True)
