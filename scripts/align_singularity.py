"""Forced word alignment of the known script to unchanged uploaded speech.

PocketSphinx is local and cached outside Git. Times are model estimates;
independent Whisper recognition provides a separate content/anchor check.
"""
from pathlib import Path
import hashlib,json,re,sys,time,wave
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.cache/singularity-audio'))
from pocketsphinx import Decoder

source=(ROOT/'docs/production/singularity/narration-google-vids.txt').read_text()
source=re.sub(r'\[[^\]]+\]','',source)
lex=list(re.finditer(r"[A-Za-z]+(?:[’'][A-Za-z]+)?",source))
words=[m.group().lower().replace('’',"'") for m in lex]
decoder=Decoder(samprate=16000,loglevel='ERROR')
pronunciations={"map's":'M AE P S',"universe's":'Y UW N AH V ER S IH Z','multiverse':'M AH L T IY V ER S','rewinding':'R IY W AY N D IH NG','spatially':'S P EY SH AH L IY'}
for word,phones in pronunciations.items():decoder.add_word(word,phones,update=True)
oov=sorted(set(word for word in words if not decoder.lookup_word(word)))
if oov:raise RuntimeError('Missing reviewed pronunciations: '+str(oov))
with wave.open(str(ROOT/'out/singularity-audio/alignment-16k.wav')) as f:
    assert f.getframerate()==16000
    pcm=f.readframes(f.getnframes())
decoder.set_align_text(' '.join(words));t=time.time()
print('Aligning',len(words),'script words to uploaded recording',flush=True)
decoder.start_utt();decoder.process_raw(pcm,full_utt=True);decoder.end_utt()
segments=[{'word':v.word,'start':round(v.start_frame/100,3),'end':round((v.end_frame+1)/100,3),'decoderScore':v.prob} for v in decoder.seg()]
aligned=[v for v in segments if v['word'] not in ['<sil>','<s>','</s>','[NOISE]','[SPEECH]']]
assert len(aligned)==len(words),(len(aligned),len(words))
for index,(v,word,match) in enumerate(zip(aligned,words,lex)):
    assert re.sub(r'\(\d+\)$','',v['word'])==word
    v.update(index=index,word=word,display=match.group(),charStart=match.start(),charEnd=match.end())
record={'engine':'PocketSphinx 5.0.4 / bundled English acoustic model','method':'Known-script forced alignment, 10ms acoustic frames; model estimates, not manually audited word times','source_audio_sha256':hashlib.sha256((ROOT/'public/assets/audio/singularity/narration-original.m4a').read_bytes()).hexdigest(),'script_sha256':hashlib.sha256((ROOT/'docs/production/singularity/narration-google-vids.txt').read_bytes()).hexdigest(),'pronunciation_additions':pronunciations,'elapsed_seconds':round(time.time()-t,3),'word_count':len(aligned),'words':aligned,'silences':[v for v in segments if v['word']=='<sil>']}
(ROOT/'docs/production/singularity/audio/word-alignment.json').write_text(json.dumps(record,indent=2)+'\n')
(ROOT/'out/singularity-audio/spoken-script.txt').write_text(source)
print('Saved',len(aligned),'word times in',record['elapsed_seconds'],'seconds',flush=True)
print('Opening',aligned[:5]);print('Ending',aligned[-5:])
