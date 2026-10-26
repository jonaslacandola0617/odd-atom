"""Independent offline word-content check. This is not a listening audit."""
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.cache/singularity-audio'))
import numpy as np
import sherpa_onnx
model=ROOT/'.cache/singularity-models/sherpa-onnx-whisper-base.en'
recognizer=sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(model/'base.en-encoder.int8.onnx'),decoder=str(model/'base.en-decoder.int8.onnx'),tokens=str(model/'base.en-tokens.txt'),num_threads=1,enable_segment_timestamps=True)
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/'public/assets/audio/cancer-short-v1/narration.wav'),'-ar','16000','-ac','1','-f','f32le','-'])
audio=np.frombuffer(raw,np.float32);chunks=[]
for start in [0,24,48]:
 end=min(76,start+28);stream=recognizer.create_stream();stream.accept_waveform(16000,audio[start*16000:round(end*16000)])
 recognizer.decode_stream(stream);chunks.append({'start':start,'end':end,'text':stream.result.text});print(start,end,stream.result.text,flush=True)
out=ROOT/'docs/production/cancer-short/narration-content-check.json'
out.write_text(json.dumps({'method':'Cached offline Whisper base.en via Sherpa; overlapping chunks; unverified recognition, no direct audition','chunks':chunks},indent=2)+'\n')
