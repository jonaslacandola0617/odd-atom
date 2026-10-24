"""Original quiet scores and object cues for two explicitly visual motion studies."""
from pathlib import Path
import numpy as np
import subprocess,tempfile,wave
R=Path(__file__).resolve().parents[1];RATE=48000;N=20*RATE
O=R/'public/assets/audio/artwork-motion';O.mkdir(parents=True,exist_ok=True)
def hz(n):return 440*2**((n-69)/12)
for topic,seed in [('medicine',222),('cyber',333)]:
 rng=np.random.default_rng(seed);a=np.zeros((N,2))
 def add(s,start,gain,pan=0):
  k=round(start*RATE);n=min(len(s),N-k)
  if n>0:a[k:k+n,0]+=s[:n]*gain*np.sqrt((1-pan)/2);a[k:k+n,1]+=s[:n]*gain*np.sqrt((1+pan)/2)
 for start,notes in [(0,[50,57,60,64]),(6.5,[53,57,60,67]),(13,[48,55,59,62])]:
  t=np.arange(round(7*RATE))/RATE;env=np.minimum(1,t/1.2)*np.minimum(1,(7-t)/1.5)
  for i,n in enumerate(notes):add((np.sin(2*np.pi*hz(n)*t)+.09*np.sin(2*np.pi*hz(n)*2.003*t))*env,start,.024,(i-1.5)*.4)
 for i,start in enumerate(np.arange(.6,19,1.7 if topic=='medicine' else 1.25)):
  note=[74,69,72,77,76,72][i%6];t=np.arange(round(2.4*RATE))/RATE
  s=(np.sin(2*np.pi*hz(note)*t)+.11*np.sin(2*np.pi*hz(note)*2*t))*np.exp(-t*2.9)*(1-np.exp(-t*170))
  add(s,float(start),.033,np.sin(i*1.7)*.5)
 # Diffuse lab/ventilation bed; no stock recordings or borrowed music.
 noise=np.convolve(rng.normal(0,1,N),np.ones(85)/85,mode='same')
 a[:,0]+=noise*.022;a[:,1]+=np.roll(noise,191)*.022
 cues=[1.75,2.7,5.5,7.6,14.25] if topic=='medicine' else [2.6,5.8,9.4,12.9,16.2]
 for i,start in enumerate(cues):
  t=np.arange(round(.22*RATE))/RATE
  if topic=='medicine':
   s=np.sin(2*np.pi*(260*t-55*t*t))*np.exp(-t*35)*(1-np.exp(-t*200))
  else:s=(np.sin(2*np.pi*700*t)+.2*np.sin(2*np.pi*1150*t))*np.exp(-t*45)*(1-np.exp(-t*250))
  add(s,start,.016,(-.45 if topic=='medicine' else .4))
 fade=np.minimum(1,np.arange(N)/(RATE*.3))*np.minimum(1,np.arange(N)[::-1]/(RATE*.7));a*=fade[:,None]
 with tempfile.TemporaryDirectory() as d:
  raw=Path(d)/'raw.wav'
  with wave.open(str(raw),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af','loudnorm=I=-24:TP=-5:LRA=7','-ar',str(RATE),'-ac','2',str(O/(topic+'.wav'))],check=True)
 print('Saved original',topic,'motion-study sound.')
