"""Original restrained keyboard score and city/cafe ambience for Alone in a crowd."""
from pathlib import Path
import json
import subprocess
import tempfile
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/audio/crowd'
RATE = 48000
N = RATE * 20
music = np.zeros((N, 2), dtype=np.float64)
sfx = np.zeros_like(music)
rng = np.random.default_rng(461)
beats = json.loads((ROOT / 'src/data/crowd-narration.json').read_text())['beats']

def hz(note):
    return 440 * 2 ** ((note - 69) / 12)

def add(target, signal, start, gain, pan=0):
    offset = round(start * RATE)
    length = min(len(signal), N-offset)
    if length <= 0:
        return
    target[offset:offset+length, 0] += signal[:length] * gain * np.sqrt((1-pan)/2)
    target[offset:offset+length, 1] += signal[:length] * gain * np.sqrt((1+pan)/2)

def key(note, length=3.0):
    t = np.arange(round(length*RATE))/RATE
    f = hz(note)
    envelope = (1-np.exp(-t*180))*np.exp(-t*1.9)
    return (np.sin(2*np.pi*f*t)+.19*np.sin(2*np.pi*f*2.004*t)*np.exp(-t*2)+.045*np.sin(2*np.pi*f*3*t))*envelope

for start,chord in [(0,[50,57,60,64]),(6.8,[46,53,57,62]),(13.6,[53,57,60,67])]:
    t=np.arange(round(6.4*RATE))/RATE
    envelope=np.minimum(1,t/.8)*np.minimum(1,(6.4-t)/1.1)
    for i,note in enumerate(chord):
        tone=(np.sin(2*np.pi*hz(note)*t)+.12*np.sin(2*np.pi*hz(note)*1.003*t))*envelope
        add(music,tone,start,.017,(i-1.5)*.32)

notes=[(0.5,74),(2.2,69),(4.8,72),(7.3,74),(9.0,77),(11.0,76),(13.8,74),(15.3,72),(17.2,76),(18.4,79)]
for i,(start,note) in enumerate(notes):
    sound=key(note)
    add(music,sound,start,.038,np.sin(i*1.8)*.35)
    add(music,sound,start+.17,.005,-np.sin(i*1.8)*.4)

# Low, diffuse city air with no sampled third-party recordings.
noise=rng.normal(0,1,N)
air=np.convolve(noise,np.ones(45)/45,mode='same')
envelope=np.linspace(.8,.3,N)
sfx[:,0]+=air*envelope*.12
sfx[:,1]+=np.roll(air,311)*envelope*.12
for start in [1.3,4.9]:
    t=np.arange(round(.9*RATE))/RATE
    soft=rng.normal(0,1,len(t));soft=np.convolve(soft,np.ones(120)/120,mode='same')
    add(sfx,soft*np.sin(np.pi*t/.9)**2,start,.18,-.6)

# A restrained cloth/chair rustle during the sit, not a generic transition hit.
sit_time=beats['notice']+1.65
t=np.arange(round(.42*RATE))/RATE
rustle=np.convolve(rng.normal(0,1,len(t)),np.ones(12)/12,mode='same')*np.sin(np.pi*t/.42)**2
add(sfx,rustle,sit_time,.09,.35)

fade=np.minimum(1,np.arange(N)/(RATE*.15))*np.minimum(1,np.arange(N)[::-1]/(RATE*.55))
OUT.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as temporary:
    for name,samples,lufs in [('music',music,-30),('sfx',sfx,-35)]:
        raw=Path(temporary)/(name+'.wav')
        with wave.open(str(raw),'wb') as file:
            file.setnchannels(2);file.setsampwidth(2);file.setframerate(RATE)
            file.writeframes((np.clip(samples*fade[:,None],-1,1)*32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af',f'loudnorm=I={lufs}:TP=-8:LRA=8','-ar',str(RATE),str(OUT/(name+'.wav'))],check=True)
        print('Saved original crowd '+name+'.wav')
