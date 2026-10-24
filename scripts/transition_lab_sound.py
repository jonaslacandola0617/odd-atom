"""Original small motion cues for the wordless six-scene transition test."""
from pathlib import Path
import json
import wave
import numpy as np
from scipy.signal import butter, sosfilt

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/audio/transition-lab';DEST.mkdir(parents=True,exist_ok=True)
SR=48000;N=20*SR;rng=np.random.default_rng(5025)
mix=np.zeros((N,2),np.float64)

def add(start,sound,gain=1,pan=0):
    a=round(start*SR);b=min(N,a+len(sound));x=sound[:b-a]*gain
    mix[a:b,0]+=x*np.sqrt((1-pan)/2);mix[a:b,1]+=x*np.sqrt((1+pan)/2)

def chime(freq,length=.5):
    t=np.arange(round(length*SR))/SR
    return (np.sin(2*np.pi*freq*t)+.22*np.sin(2*np.pi*freq*2.01*t))*np.exp(-t*6)*(1-np.exp(-t*200))

def air(length,low=400,high=3600):
    n=round(length*SR);t=np.arange(n)/SR
    noise=sosfilt(butter(2,[low,high],btype='band',fs=SR,output='sos'),rng.normal(0,1,n))
    return noise*np.sin(np.pi*t/length)**2

def bubble(freq,length=.25):
    t=np.arange(round(length*SR))/SR
    return np.sin(2*np.pi*(freq*t+freq*t*t*2))*np.sin(np.pi*t/length)**2*np.exp(-t*8)

# Sparse droplets; the larger splash is tied to the water-surface impact.
for i,t in enumerate([.25,.77,1.28,1.8,2.34]):add(t,bubble(520+i*55),.035,pan=(-1)**i*.4)
add(2.75,air(.65,180,6500),.20)
add(2.78,bubble(160,.6),.12)
for i,t in enumerate([3.8,4.6,5.2,5.7]):add(t,bubble(430+i*80),.045,pan=(i-1.5)*.3)
# Leaf change, stem growth, petals opening, butterfly strokes and paper folds.
add(6.04,air(.75,800,6200),.09,-.2)
for t,f in [(6.4,440),(7.1,554.37),(7.85,659.25),(8.45,880)]:add(t,chime(f,.65),.035)
add(9.28,air(.65,950,5300),.08)
add(9.85,chime(1108.73,.8),.045)
for i,t in enumerate([10.45,10.85,11.25,11.65,12.05,12.43]):add(t,air(.13,650,4500),.055,pan=np.sin(i)*.5)
for i,t in enumerate([12.65,12.87,13.12,13.4]):add(t,air(.09,1800,8500),.10,pan=(i-1.5)*.2)
add(13.68,air(.55,380,4300),.095,.3)
add(15.82,air(.95,500,5200),.10,-.2)
for t,f in [(16.55,659.25),(17.05,880),(17.48,1108.73),(18.05,1318.51)]:add(t,chime(f,1.2),.045)
# Gentle isolated tones support the last orbit rather than a constant beat.
add(18.5,chime(554.37,1.3),.035,-.35)
add(18.75,chime(830.61,1.1),.03,.35)
mix*=np.minimum(1,np.arange(N)/6000)[:,None]*np.minimum(1,(N-np.arange(N))/(SR*.6))[:,None]
peak=np.max(np.abs(mix));mix*=min(1,.77/max(peak,1e-9))
with wave.open(str(DEST/'soundtrack.wav'),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())
(DEST/'README.md').write_text('Original synthesized motion effects for the wordless 20-second transition test. Oscillators and filtered deterministic noise; no sampled commercial score, generated speech or voice credits. Regenerate with `npm run sound:transitions`.\n')
print(json.dumps({'seconds':20,'sample_rate':SR,'channels':2,'peak_dbfs':round(float(20*np.log10(np.max(np.abs(mix))+1e-12)),2),'narration':False}))
