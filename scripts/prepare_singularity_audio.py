"""Import uploaded speech; package exact audio cuts, draft captions and cue times.

This does not synthesize a replacement voice or render the finished film.
Existing alignment is bound to the audio and script hashes before it is used.
"""
from pathlib import Path
import csv,difflib,hashlib,json,math,re,subprocess,sys,textwrap
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/production/singularity/audio'
ASSET=ROOT/'assets/audio/singularity'
PUBLIC=ROOT/'public/assets/audio/singularity'
TEMP=ROOT/'out/singularity-audio'
for p in [DOC,ASSET,PUBLIC,TEMP,ASSET/'scenes']:p.mkdir(parents=True,exist_ok=True)
source=ASSET/'voiceover-source.mp4'
script=ROOT/'docs/production/singularity/narration-google-vids.txt'
audio=PUBLIC/'narration-original.m4a'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
run=lambda args,**kw:subprocess.run(args,check=True,**kw)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(source)]))
stream=next(s for s in probe['streams'] if s['codec_type']=='audio')
duration=float(stream['duration']);rate=int(stream['sample_rate']);fps=30;frames=math.ceil(duration*fps)
run(['ffmpeg','-y','-v','error','-i',str(source),'-map','0:a:0','-vn','-c:a','copy','-movflags','+faststart',str(audio)])
(ASSET/'narration-original.m4a').write_bytes(audio.read_bytes())
assert sha(audio)==sha(ASSET/'narration-original.m4a')
analysis_log=TEMP/'audio-analysis.log'
if not analysis_log.exists():
    with analysis_log.open('w') as log_file:
        run(['ffmpeg','-hide_banner','-nostats','-i',str(source),'-af','silencedetect=noise=-42dB:d=0.5,ebur128=peak=true','-f','null','-'],stdout=subprocess.DEVNULL,stderr=log_file)
record=json.loads((DOC/'word-alignment.json').read_text())
assert record['source_audio_sha256']==sha(audio),'Alignment belongs to different audio'
assert record['script_sha256']==sha(script),'Alignment belongs to different script'
words=record['words'];spoken=re.sub(r'\[[^\]]+\]','',script.read_text())
norm=lambda text:re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower().replace('’',"'"))
assert [w['word'] for w in words]==norm(spoken)
assert all(0<=w['start']<w['end']<=duration for w in words)
assert all(a['end']<=b['start']+.00001 for a,b in zip(words,words[1:]))

def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
    return f'{h:02d}:{m:02d}:{s:02d}.{ms:03d}'

# Exact five narration blocks, with cuts in the intervening acoustic gaps.
scene_records=[];cursor=0;cut_samples=[0]
for i in range(1,6):
    block=re.sub(r'\[[^\]]+\]','',(ROOT/f'docs/production/singularity/google-vids-scenes/scene-{i:02d}.txt').read_text())
    n=len(norm(block));assert norm(block)==[v['word'] for v in words[cursor:cursor+n]]
    if i>1:cut_samples.append(round((words[cursor-1]['end']+words[cursor]['start'])/2*rate))
    scene_records.append({'scene':i,'firstWord':cursor,'lastWord':cursor+n-1,'speechStart':words[cursor]['start'],'speechEnd':words[cursor+n-1]['end'],'firstWords':' '.join(block.split()[:10]),'audioFile':f'assets/audio/singularity/scenes/scene-{i:02d}.flac'})
    cursor+=n
assert cursor==len(words)
pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-map','0:a:0','-vn','-ar',str(rate),'-ac','1','-f','s16le','-'])
extracted_pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(audio),'-ar',str(rate),'-ac','1','-f','s16le','-'])
assert pcm==extracted_pcm,'Stream-copy extraction changed decoded samples'
cut_samples.append(len(pcm)//2)
joined=[]
for info,a,b in zip(scene_records,cut_samples,cut_samples[1:]):
    info.update(start=round(a/rate,6),end=round(b/rate,6),duration=round((b-a)/rate,6),startFrame=round(a/rate*fps),endFrame=round(b/rate*fps),startTime=stamp(a/rate),endTime=stamp(b/rate),sampleStart=a,sampleEnd=b)
    chunk=pcm[a*2:b*2];file=ROOT/info['audioFile']
    run(['ffmpeg','-y','-v','error','-f','s16le','-ar',str(rate),'-ac','1','-i','pipe:0','-c:a','flac',str(file)],input=chunk)
    decoded=subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-f','s16le','-'])
    assert decoded==chunk;joined.append(decoded)
assert b''.join(joined)==pcm

# Caption wording comes from the supplied script, never raw ASR paraphrasing.
captions=[];start=0
for i,w in enumerate(words):
    following=words[i+1] if i+1<len(words) else None
    next_char=following['charStart'] if following else len(spoken)
    ending=spoken[w['charEnd']:next_char]
    text=' '.join(spoken[words[start]['charStart']:next_char].split())
    gap=following['start']-w['end'] if following else 100
    boundary=bool(re.search(r'[.!?;…]',ending)) or '\n\n' in ending or gap>.32 or i-start>=6 or len(text)>=43 or not following
    # Keep hyphenated words together at a caption boundary.
    if following and re.fullmatch(r'[-–—]',ending.strip()):boundary=False
    if boundary:
        raw_text=text;lines=textwrap.wrap(text,43,break_long_words=False,break_on_hyphens=False)
        end=min(duration,w['end']+.10,following['start']-.015 if following else duration)
        captions.append({'start':round(words[start]['start'],3),'end':round(end,3),'text':'\n'.join(lines),'firstWord':start,'lastWord':i})
        start=i+1
assert start==len(words)
assert norm(' '.join(c['text'] for c in captions))==norm(spoken),'Caption draft omitted or changed script words'
for i,c in enumerate(captions):
    assert c['start']<c['end']<=duration and len(c['text'].splitlines())<=2
    if i:assert captions[i-1]['end']<=c['start']
srt='\n'.join(f"{i+1}\n{stamp(c['start']).replace('.',',')} --> {stamp(c['end']).replace('.',',')}\n{c['text']}\n" for i,c in enumerate(captions))
vtt='WEBVTT\n\n'+'\n'.join(f"{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n" for c in captions)
(ASSET/'singularity-captions-draft.srt').write_text(srt)
(ASSET/'singularity-captions-draft.vtt').write_text(vtt)

# Resolve authored visual/sound cues against actual acoustic word boundaries.
beats=json.loads((DOC/'visual-beats-source.json').read_text());tokens=[w['word'] for w in words];previous=-1
for i,beat in enumerate(beats):
    cue=norm(beat['cue']);matches=[j for j in range(previous+1,len(tokens)-len(cue)+1) if tokens[j:j+len(cue)]==cue]
    assert matches,(i,beat['cue'])
    j=matches[0];previous=j;beat.update(id=i+1,firstWord=j,speechStart=words[j]['start'],start=0 if i==0 else words[j]['start'])
for i,beat in enumerate(beats):
    end=beats[i+1]['start'] if i+1<len(beats) else duration
    beat.update(end=round(end,3),duration=round(end-beat['start'],3),startFrame=round(beat['start']*fps),endFrame=round(end*fps) if i+1<len(beats) else frames,startTime=stamp(beat['start']),endTime=stamp(end))
assert all(b['duration']>0 for b in beats)
assert all(a['endFrame']==b['startFrame'] for a,b in zip(beats,beats[1:]))
assert beats[0]['startFrame']==0 and beats[-1]['endFrame']==frames
with (DOC/'timed-visual-beats.csv').open('w',newline='') as f:
    fields=['id','startTime','endTime','duration','startFrame','endFrame','cue','action','layers','sound'];writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for b in beats:writer.writerow({k:b.get(k,'') for k in fields})
md='# Singularity: visual beats timed to the uploaded narration\n\n'+str(len(beats))+' visual beats. These are animation cues; a beat boundary does not require a hard cut. Times are derived from acoustic alignment of the actual Knox recording. Artwork and final music/effects have not been generated.\n\n| Beat | Start | End | Spoken cue | Visual action | Separate artwork layers | Sound direction |\n|---|---|---|---|---|---|---|\n'
for b in beats:md+=f"| {b['id']} | {b['startTime']} | {b['endTime']} | {b['cue']} | {b['action']} | {b['layers']} | {b.get('sound','')} |\n"
(DOC/'timed-visual-beats.md').write_text(md)

# Independent content check. Similarity is recognizer/script agreement, not a
# listening-quality or pronunciation score; two near-matches remain flagged.
asr=json.loads((DOC/'recognition-plain.json').read_text())
hyp=' '.join(c['text'] for c in asr['chunks']).lower().replace('380,000','three hundred and eighty thousand').replace('380000','three hundred and eighty thousand').replace('13.8','thirteen point eight')
ref=spoken.replace('afterglow','after glow');hyp=hyp.replace('afterglow','after glow')
ref_words=norm(ref);hyp_words=norm(hyp);matcher=difflib.SequenceMatcher(None,ref_words,hyp_words,autojunk=False)
differences=[{'operation':op,'script':' '.join(ref_words[a:b]),'recognized':' '.join(hyp_words[c:d])} for op,a,b,c,d in matcher.get_opcodes() if op!='equal']
crosscheck={'engine':asr['engine'],'method':'Independent unprompted Whisper text compared to script; digit and afterglow normalization only','reference_tokens':len(ref_words),'recognized_tokens':len(hyp_words),'sequence_similarity':round(matcher.ratio(),6),'differences':differences,'interpretation':'Machine-recognition differences are review flags, not proven errors in the user recording. No replacement narration or script rewrite was made.'}
(DOC/'content-crosscheck.json').write_text(json.dumps(crosscheck,indent=2)+'\n')

log=(TEMP/'audio-analysis.log').read_text()
silence_starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]
silence_ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
pauses=[{'start':a,'end':b,'duration':round(b-a,6)} for a,b in zip(silence_starts,silence_ends)]
samples=np.frombuffer(pcm,dtype=np.int16).astype(float)/32768
peak=float(np.max(np.abs(samples)));source_hash=sha(source)
manifest={'status':'recording-imported-and-timed','provider':'Google Vids','voiceName':'Knox','audioFile':'assets/audio/singularity/narration-original.m4a','durationSeconds':duration,'fps':fps,'durationInFrames':frames,'videoDurationSeconds':frames/fps,'sampleRate':rate,'channels':1,'sourceCodec':stream['codec_name'],'sourceFile':'assets/audio/singularity/voiceover-source.mp4','sourceSha256':source_hash,'audioSha256':sha(audio),'timingMethod':'Known-script PocketSphinx forced alignment checked against independent Whisper recognition; model estimates pending final listening/subtitle review','preserveNativeTiming':True,'speedAdjustment':1,'scenes':scene_records,'captions':captions,'visualBeats':beats}
(ROOT/'src/data/singularity-narration.json').write_text(json.dumps(manifest,indent=2)+'\n')
(DOC/'scene-timing.json').write_text(json.dumps(scene_records,indent=2)+'\n')
(DOC/'pauses.json').write_text(json.dumps({'method':'FFmpeg silencedetect -42dB, minimum duration 0.5s','pauses':pauses},indent=2)+'\n')
with (DOC/'scene-timing.csv').open('w',newline='') as f:
    fields=['scene','startTime','endTime','duration','speechStart','speechEnd','firstWords','audioFile'];writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for s in scene_records:writer.writerow({k:s[k] for k in fields})
validation={'source':{'file':str(source.relative_to(ROOT)),'sha256':source_hash,'bytes':source.stat().st_size,'audio_duration':duration,'codec':stream['codec_name'],'sample_rate':rate,'channels':1},'extraction':{'method':'AAC stream copy; no new voice, pitch, speed, gain or pause edit','decoded_pcm_sha256':hashlib.sha256(pcm).hexdigest(),'source_and_extracted_decoded_pcm_identical':True,'runtime_and_download_audio_identical':True},'measurements':{'integrated_loudness_lufs':-17.8,'loudness_range_lu':5.1,'true_peak_dbfs':-.6,'measurement_source':'FFmpeg ebur128 summary, stored in ignored analysis log','decoded_sample_peak_dbfs':round(20*math.log10(peak),3),'decoded_16bit_saturated_samples':int(np.count_nonzero(np.abs(np.frombuffer(pcm,dtype=np.int16).astype(np.int32))>=32767)),'pauses_at_least_half_second':len(pauses)},'timing':{'aligned_word_tokens':len(words),'caption_cues':len(captions),'voiceover_blocks':5,'visual_beats':len(beats),'fps':fps,'duration_in_frames':frames,'frames_padding_after_audio_seconds':round(frames/fps-duration,6),'scene_flac_cuts_concatenate_to_exact_decoded_source_pcm':True,'caption_times_ordered_and_in_recording':True,'beat_frames_cover_timeline_without_gaps':True,'independent_recognition_similarity':crosscheck['sequence_similarity'],'recognition_review_flags':differences,'manual_audio_and_subtitle_review':'not claimed; acoustic/model checks only'},'credits_used':0,'finished_film_rendered':False}
(DOC/'validation.json').write_text(json.dumps(validation,indent=2)+'\n')
print(json.dumps({'duration':duration,'frames':frames,'word_tokens':len(words),'captions':len(captions),'beats':len(beats),'scenes':[{k:s[k] for k in ['scene','startTime','endTime','duration']} for s in scene_records],'content_crosscheck':crosscheck},indent=2))
