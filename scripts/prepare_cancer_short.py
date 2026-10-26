"""Versioned76s narration edit, provider-timed captions and story events.

Only long inter-word pauses are shortened. No pitch or word speed changes.
"""
import hashlib,json,re,subprocess
from pathlib import Path
import numpy as np
from PIL import ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/audio/cancer-short-v1';DOC=ROOT/'docs/production/cancer-short'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
original=OUT/'narration-original.mp3'
data=json.loads((OUT/'alignment-original.json').read_text());alignment=data['normalized_alignment'] or data['alignment']
text=''.join(alignment['characters']);starts=alignment['character_start_times_seconds'];ends=alignment['character_end_times_seconds']
words=[]
for m in re.finditer(r"[A-Za-z]+(?:['’][A-Za-z]+)?",text):
    if text.rfind('[',0,m.start())>text.rfind(']',0,m.start()):continue
    finish=m.end()
    while finish<len(text) and text[finish] in ',.!?:;':finish+=1
    words.append({'text':text[m.start():finish],'start_original':starts[m.start()],'end_original':ends[m.end()-1]})

rate=48000
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(original),'-ar',str(rate),'-ac','1','-f','f32le','-'])
samples=np.frombuffer(raw,np.float32).copy();cuts=[]
for a,b in zip(words,words[1:]):
    gap=b['start_original']-a['end_original']
    if gap>.6:
        remove=gap-.42
        left=a['end_original']+.21;right=left+remove
        # A pause edit is never allowed inside an aligned spoken word.
        assert all(not (w['start_original']<right and w['end_original']>left) for w in words)
        cuts.append({'start_original':left,'end_original':right,'removed_seconds':remove,'between':[a['text'],b['text']]})
def remap(t):return t-sum(max(0,min(t,c['end_original'])-c['start_original']) for c in cuts)+.10
segments=[];cursor=0
for c in cuts:
    a,b=round(c['start_original']*rate),round(c['end_original']*rate)
    segment=samples[cursor:a].copy();fade=min(round(.006*rate),len(segment));segment[-fade:]*=np.linspace(1,0,fade)
    if segments:segment[:fade]*=np.linspace(0,1,fade)
    segments.append(segment);cursor=b
segment=samples[cursor:].copy();segment[:288]*=np.linspace(0,1,288);segments.append(segment)
narration=np.concatenate([np.zeros(round(.1*rate),np.float32),*segments])
assert len(narration)<76*rate,'Narration edit exceeds delivery duration'
final=np.zeros(76*rate,np.float32);final[:len(narration)]=narration
subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(rate),'-ac','1','-i','-','-c:a','pcm_s24le',str(OUT/'narration.wav')],input=final.tobytes(),check=True)
for w in words:w.update(start=remap(w['start_original']),end=remap(w['end_original']))

captions=[];group=[]
for w in words:
    if group and (len(' '.join(x['text'] for x in group+[w]))>33 or w['start']-group[-1]['end']>.45):
        captions.append({'start':group[0]['start'],'end':group[-1]['end']+.09,'text':' '.join(x['text'] for x in group)});group=[]
    group.append(w)
    if w['text'].endswith(('.', '?', '!')) and len(group)>=2:
        captions.append({'start':group[0]['start'],'end':group[-1]['end']+.10,'text':' '.join(x['text'] for x in group)});group=[]
if group:captions.append({'start':group[0]['start'],'end':group[-1]['end']+.1,'text':' '.join(x['text'] for x in group)})
for a,b in zip(captions,captions[1:]):a['end']=min(a['end'],b['start']-.015)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',49)
for c in captions:
    if font.getlength(c['text'])<=820:c['lines']=[c['text']]
    else:
        pieces=c['text'].split();options=[]
        for i in range(1,len(pieces)):
            a,b=' '.join(pieces[:i]),' '.join(pieces[i:]);wa,wb=font.getlength(a),font.getlength(b)
            score=max(wa,wb)+abs(wa-wb)*.2+(140 if min(i,len(pieces)-i)==1 else 0)
            if max(wa,wb)<=820:options.append((score,[a,b]))
        if not options:raise ValueError('Caption cannot fit safe width: '+c['text'])
        c['lines']=min(options,key=lambda x:x[0])[1]

def locate(phrase):
    normalized=[re.sub(r'[^a-z]','',w['text'].lower()) for w in words]
    target=[re.sub(r'[^a-z]','',w.lower()) for w in phrase.split()]
    candidates=[i for i in range(len(normalized)-len(target)+1) if normalized[i:i+len(target)]==target]
    if not candidates:raise ValueError('Phrase not aligned: '+phrase)
    return round(words[candidates[0]]['start']*30)

scenes=[
 ('hook','Cancer\'s strangest trick','Show a self-cell with an abnormal nucleus; an immune scan passes a matching outer identity.'),
 ('healthy','Healthy cells follow signals','Bind growth signals, repair a DNA gap, stop neighbor growth and remove a severely damaged control cell.'),
 ('mutation','But genetic changes','DNA rung changes and growth-control circuit fails; one damaged cell remains active.'),
 ('division','A damaged cell','A connected membrane pinches into daughter cells; repeated division displaces healthy neighbors.'),
 ('surveillance','Your immune system','Immune contact recognizes and destroys an abnormal control cell.'),
 ('escape','But some cancer cells','Surface identity changes; a separate inhibitory contact stops an immune attack.'),
 ('disguise','Now the danger','Matched surface patterns obscure an expanding abnormal clone; immune field of attention fails to flag it.'),
 ('spread','And some cancer cells','A cell deforms through a tissue gap, enters a blood vessel, travels with red cells and exits at a second site.'),
 ('question','So how do you fight','Microscope lens pulls back to the approved clinician concentrating on a sample.'),
 ('therapy','Immunotherapy can help','An antibody blocks an inhibitory contact; immune cell reconnects, delivers granules and the target fragments.'),
 ('outcomes','It can work','One lesion responds while a differing lesion persists; camera retains both outcomes.'),
 ('ending','The next breakthrough','Surface markers return at larger scale; a searching immune contact approaches a remaining recognition gap. Hold curiosity rather than declare cure.'),
]
scene_data=[]
for i,(sid,phrase,purpose) in enumerate(scenes):
    start=0 if i==0 else locate(phrase)
    scene_data.append({'id':sid,'start_frame':start,'purpose':purpose})
for i,s in enumerate(scene_data):s['end_frame']=scene_data[i+1]['start_frame'] if i+1<len(scene_data) else 2280
events={name:locate(phrase) for name,phrase in {
 'grow':'grow','repair':'repair damage','stop':'stop dividing','destroy':'own destruction',
 'mutation':'genetic changes','two':'One becomes two','four':'Two become four',
 'crowd':'A growing mass','evade':'escape detection','inhibit':'switch immune attacks off',
 'metastasis':'Thats metastasis','recognize':'recognize or attack cancer','brakes':'release the brakes',
 'not_everyone':'but not everyone','many':'Cancer is many diseases','see':'see what its been missing',
}.items()}
manifest={'title':'Cancer’s Strangest Trick','duration_seconds':76,'duration_frames':2280,'fps':30,'width':1080,'height':1920,
 'narration_original_sha256':sha(original),'narration_original_duration':len(samples)/rate,
 'narration_edited_file':'assets/audio/cancer-short-v1/narration.wav','narration_edit':{'cuts':cuts,'speed':1,'pitch_changed':False,'leading_pad_seconds':.1,'speech_end_seconds':words[-1]['end'],'ending_tail_seconds':76-words[-1]['end']},
 'captions':captions,'words':words,'scenes':scene_data,'events':events,
 'timing_source':'ElevenLabs character alignment with recorded pause-removal mapping; captions are provider-timed, not exact human-verified phonetics.'}
(ROOT/'src/data/cancer-short-timing.json').write_text(json.dumps(manifest,indent=2)+'\n')
(DOC/'narration-edit.json').write_text(json.dumps({k:manifest[k] for k in ['narration_original_sha256','narration_original_duration','narration_edit']},indent=2)+'\n')
def tc(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt='\n'.join(f"{i+1}\n{tc(c['start'])} --> {tc(c['end'])}\n{c['text']}\n" for i,c in enumerate(captions))
(ROOT/'assets/videos/cancer-short-v1/cancer-76s.srt').write_text(srt)
print(json.dumps({'speech_end':words[-1]['end'],'tail':76-words[-1]['end'],'pause_removed':sum(c['removed_seconds'] for c in cuts),'scene_starts':[(s['id'],s['start_frame']/30) for s in scene_data],'events':events},indent=2))
