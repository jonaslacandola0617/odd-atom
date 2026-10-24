"""Local, credit-free content/timing inspection of the supplied Knox recording.

Uses an ignored Sherpa ONNX Whisper model. No cloud speech request or key.
Raw recognizer output is evidence, not automatically approved caption copy.
"""
from pathlib import Path
import json,re,sys,time,wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.cache/singularity-audio'))
import sherpa_onnx

base=ROOT/'.cache/singularity-models/sherpa-onnx-whisper-base.en'
recognizer=sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=str(base/'base.en-encoder.int8.onnx'),
    decoder=str(base/'base.en-decoder.int8.onnx'),
    tokens=str(base/'base.en-tokens.txt'),
    num_threads=4,enable_segment_timestamps='--plain' not in sys.argv,
)
with wave.open(str(ROOT/'out/singularity-audio/alignment-16k.wav')) as f:
    assert f.getframerate()==16000 and f.getnchannels()==1
    audio=np.frombuffer(f.readframes(f.getnframes()),dtype=np.int16).astype(np.float32)/32768
duration=len(audio)/16000
log=(ROOT/'out/singularity-audio/audio-analysis.log').read_text()
starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]
ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
midpoints=[(a+b)/2 for a,b in zip(starts,ends)]
boundaries=[0.]
while duration-boundaries[-1]>27:
    candidates=[x for x in midpoints if boundaries[-1]+18<x<boundaries[-1]+27]
    boundaries.append(min(candidates,key=lambda x:abs(x-(boundaries[-1]+24))) if candidates else boundaries[-1]+24)
boundaries.append(duration)
chunks=[];segments=[]
for index,(start,end) in enumerate(zip(boundaries,boundaries[1:])):
    stream=recognizer.create_stream()
    stream.accept_waveform(16000,audio[round(start*16000):round(end*16000)])
    t=time.time();recognizer.decode_stream(stream);result=stream.result
    chunk={'index':index,'start':start,'end':end,'text':result.text.strip(),'seconds_processing':round(time.time()-t,2)}
    chunks.append(chunk)
    for x,y,text in zip(result.segment_timestamps,result.segment_durations,result.segment_texts):
        segments.append({'start':round(start+x,3),'end':round(min(end,start+x+y),3),'text':text.strip(),'chunk':index})
    print(index+1,'/',len(boundaries)-1,round(start,2),round(end,2),result.text.strip(),flush=True)
    target=ROOT/('docs/production/singularity/audio/recognition-plain.json' if '--plain' in sys.argv else 'docs/production/singularity/audio/recognition.json')
    target.write_text(json.dumps({'engine':'sherpa-onnx 1.12.40 / Whisper base.en int8 CPU','method':'Independent speech recognition; native model segment timestamps, not final word alignment','duration':duration,'chunks':chunks,'segments':segments},indent=2)+'\n')
