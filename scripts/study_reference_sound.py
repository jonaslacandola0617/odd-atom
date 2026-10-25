"""Mixed-audio measurements aligned with visible reference actions.

No direct audition is available here. Mid/side and spectral displays do not
separate speech, score and SFX; candidate peaks are never labeled isolated SFX.
"""
from pathlib import Path
import hashlib,json,subprocess,math
import numpy as np
from scipy.signal import find_peaks
from PIL import Image,ImageDraw,ImageFont

R=Path(__file__).resolve().parents[1]
OUT=R/'references/studies/sound-2026-10-25';OUT.mkdir(parents=True,exist_ok=True)
TMP=R/'out/sound-study';TMP.mkdir(parents=True,exist_ok=True)
SR=24000;HOP=480
FONT=ImageFont.truetype(str(R/'public/assets/fonts/Outfit.ttf'),18)
sources=json.loads((R/'references/studies/storytelling-2026-10-25/study.json').read_text())['sources']
cases=json.loads((R/'references/studies/storytelling-2026-10-25/cases.json').read_text())['cases']
selected={'takeoff','receptor-fit','pruning','collision','compression','repair-worker','orbital-ring','aurora-reveal','water-control','research-focus','fear-rhyme','fluid-loss'}
def run(args):return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def audio(path):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(path),'-vn','-ac','2','-ar',str(SR),'-f','f32le','-']).stdout,np.float32).reshape(-1,2)
def db(x):return float(20*np.log10(max(1e-9,float(x))))
def env(x):
    n=len(x)//HOP
    return np.sqrt(np.mean(x[:n*HOP].reshape(n,HOP)**2,axis=1)+1e-12)
paths={};data={};source_rows=[]
for s in sources:
    p=next(Path('/workspace/attachments').glob('*/'+s['filename']))
    assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']
    a=audio(p);paths[s['id']]=p;data[s['id']]=a
    mid=a.mean(axis=1);side=(a[:,0]-a[:,1])/2
    source_rows.append({'id':s['id'],'file':s['filename'],'sha256':s['sha256'],'duration':len(a)/SR,'mixed_rms_dbfs':db(np.sqrt(np.mean(a*a))),'peak_dbfs':db(np.max(np.abs(a))),'side_to_mid_rms_db':db(np.sqrt(np.mean(side*side))/max(1e-9,np.sqrt(np.mean(mid*mid))))})
rows=[]
for c in cases:
    if c['key'] not in selected:continue
    a=data[c['source']][round(c['start']*SR):round(c['end']*SR)]
    mid=a.mean(axis=1);side=(a[:,0]-a[:,1])/2;me=env(mid);se=env(side)
    peaks,_=find_peaks(se,distance=7,prominence=max(.0001,float(np.max(se))*.14))
    peaks=sorted(peaks,key=lambda i:se[i],reverse=True)[:5]
    candidates=[{'time':round(c['start']+int(i)*HOP/SR,3),'side_rms_dbfs':round(db(se[i]),2)} for i in sorted(peaks)]
    image=Image.new('RGB',(960,820),'#13172d');d=ImageDraw.Draw(image)
    d.text((15,10),c['key']+' / '+paths[c['source']].name,font=FONT,fill='#fff0ce')
    d.text((15,38),'User-supplied reference: mixed audio, not isolated SFX. No listening audit.',font=FONT,fill='#b0cbd7')
    for j,t in enumerate(c['key_times']):
        p=TMP/(c['key']+str(j)+'.png')
        run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(paths[c['source']]),'-frames:v','1',str(p)])
        im=Image.open(p).convert('RGB');im.thumbnail((310,350));x=j*320+(320-im.width)//2;image.paste(im,(x,75));d.text((j*320+15,430),f'{t:.3f}s / visual action',font=FONT,fill='#fff0ce')
    def plot(values,y,color,label):
        d.text((20,y),label,font=FONT,fill=color);top=y+30;bottom=y+115
        d.line((30,bottom,930,bottom),fill='#586174',width=1)
        maximum=max(.0001,float(np.max(values)))
        pts=[(30+i/max(1,len(values)-1)*900,bottom-float(v)/maximum*78) for i,v in enumerate(values)]
        d.line(pts,fill=color,width=2)
        for t in c['key_times']:
            x=30+(t-c['start'])/(c['end']-c['start'])*900;d.line((x,top,x,bottom),fill='#e6c585',width=1)
    plot(me,470,'#77d8c7','Mid-channel 20ms RMS — speech, music and effects combined')
    plot(se,610,'#c5a0ea','Side-channel 20ms RMS — off-center energy, including music')
    d.text((20,760),'Gold lines mark sampled visual moments. Each curve is normalized separately.',font=FONT,fill='#b0cbd7')
    target=c['key']+'.jpg';image.save(OUT/target,quality=91)
    row={'key':c['key'],'source':c['source'],'start':c['start'],'end':c['end'],'visual_key_times':c['key_times'],'visible_action':c['action'],'consequence':c['after'],'candidate_side_energy_peaks':candidates,'sheet':target,'audio_inference_limit':'Candidates can be score, speech leakage or effects; not an identification of individual sounds.'}
    if c['key'] in {'takeoff','pruning','collision','repair-worker','orbital-ring','aurora-reveal','water-control','research-focus'}:
        clip=OUT/(c['key']+'.mp4');run(['ffmpeg','-y','-v','error','-ss',str(c['start']),'-i',str(paths[c['source']]),'-t',str(c['end']-c['start']),'-vf','scale=240:-2','-c:v','libx264','-crf','24','-c:a','aac','-b:a','96k','-movflags','+faststart',str(clip)]);row['mixed_av_excerpt']=clip.name
    rows.append(row)

# Diagnose the rejected mix using its separate committed effect/voice tracks.
voice=audio(R/'public/assets/audio/singularity/narration-original.m4a')
fx=audio(R/'public/assets/audio/singularity-v2/effects.m4a')
old=json.loads((R/'docs/production/singularity/rebuild/sound-design.json').read_text());levels=[]
for cue in old['events']:
    start=round(cue['time']*SR);end=start+round(cue['duration']*SR)
    f=fx[start:end];v=voice[start:min(end,len(voice))]
    fr=np.sqrt(np.mean(f*f));vr=np.sqrt(np.mean(v*v))
    levels.append({'time':cue['time'],'kind':cue['kind'],'effect_rms_dbfs':db(fr),'voice_rms_dbfs':db(vr),'effect_below_voice_db':db(vr/max(fr,1e-9))})
voiced=[x for x in levels if x['voice_rms_dbfs']>-35]
record={'sources':source_rows,'cases':rows,'old_mix_events':levels,'old_mix_median_effect_below_voice_db':float(np.median([x['effect_below_voice_db'] for x in voiced])),'limits':['This runtime does not support direct audio audition.','Measurements are of mixed audio, not production stems; no specific reference effect or instrument is identified.','Stereo difference rejects only exactly centered content; music and voice leakage remain.','Short uploaded references do not establish the long-form channel sound strategy. No new long-form episode was accessed.'],'production_response':['Give approach, contact and aftermath separate sound roles.','Use distinct material, scale and duration; avoid one generic chime per edit.','Use existing user-owned paper, mechanics, movement, ambience and tension cues before generating anything.','Duck effect/score energy under speech but retain audible contact transients.','Use anticipation and silence around the final question, then leave an intentional visual/audio tail.']}
(OUT/'study.json').write_text(json.dumps(record,indent=2)+'\n')
print('Measured eight reference mixes and',len(rows),'motion-aligned intervals.')
print('V2 median effect below simultaneous voice:',round(record['old_mix_median_effect_below_voice_db'],1),'dB')
