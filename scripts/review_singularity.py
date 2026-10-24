"""Validate the real full film, chapter assets, original speech and layer files.

Review boards are inspection artifacts, not replacements for production art.
"""
from pathlib import Path
import hashlib,json,math,re,subprocess,zipfile
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.signal import correlate,correlation_lags

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/production/singularity/film'
OUT=ROOT/'out/singularity';OUT.mkdir(parents=True,exist_ok=True)
DELIVERY=ROOT/'assets/videos/singularity'
T=json.loads((ROOT/'src/data/singularity-narration.json').read_text())
movie=DELIVERY/'singularity-full-8m56.mp4'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
probe=lambda p:json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
P=probe(movie);video=next(s for s in P['streams'] if s['codec_type']=='video');audio=next(s for s in P['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_frames']))==(1920,1080,'30/1',T['durationInFrames'])
assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
assert audio['codec_name']=='aac' and int(audio['sample_rate'])==48000 and int(audio['channels'])==2
assert abs(float(P['format']['duration'])-T['durationInFrames']/30)<.05
assert movie.stat().st_size<100*1024*1024

# Check top-level MP4 structure rather than matching an incidental byte string.
with movie.open('rb') as f:
    atoms=[]
    while True:
        at=f.tell();header=f.read(8)
        if len(header)<8:break
        size=int.from_bytes(header[:4],'big');name=header[4:8].decode('ascii','replace')
        if size==1:size=int.from_bytes(f.read(8),'big')
        if size==0:size=movie.stat().st_size-at
        atoms.append({'name':name,'offset':at,'size':size});f.seek(at+size)
assert next(a['offset'] for a in atoms if a['name']=='moov')<next(a['offset'] for a in atoms if a['name']=='mdat')
log=OUT/'full-decode.log'
with log.open('w') as f:
    subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(movie),'-vf','blackdetect=d=0.4:pix_th=0.04:pic_th=0.97','-f','null','-'],stderr=f,stdout=subprocess.DEVNULL,check=True)
text=log.read_text();assert 'black_start:' not in text,'Review an unexpected black segment'
assert not re.search(r'Error while decoding|Invalid data found|corrupt decoded frame',text,re.I)

# Original approved drawings and uploaded narration remain immutable.
baseline={
 'assets/characters/static-test-01.png':'72842deef29e191d0f0699c66684d57b6869a0b4cfb2d50937a268f54b80b73f',
 'assets/scenes/artwork-consistency-02/medicine-immune-defense.png':'d9f245e4aad1866de4b29f10a4dd45c7e9312cd3450dd07d68e36f750ed3fd5e',
 'assets/scenes/artwork-consistency-02/cyber-network-defense.png':'e6bece838f7095e1346f255533802e62f8f9b114a73479c9a4396ae8088162fd',
}
for file,expected in baseline.items():assert sha(ROOT/file)==expected
assert sha(ROOT/'public'/T['audioFile'])==T['audioSha256']
assert sha(ROOT/T['sourceFile'])==T['sourceSha256']

layers=json.loads((ROOT/'src/data/singularity-artwork.json').read_text())
for layer in layers:
    file=ROOT/'public/assets/artwork/singularity'/layer['file'];assert sha(file)==layer['sha256']
    im=Image.open(file);im.load();assert im.size==(layer['width'],layer['height'])
    if im.mode=='RGBA':assert im.getchannel('A').getextrema()[0]==0

# Quantify narration synchronization separately from subtitle/model confidence.
def mono(path):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vn','-ac','1','-ar','8000','-f','f32le','-']),np.float32)
ref=mono(ROOT/'public'/T['audioFile']);mixed=mono(movie);sync=[]
for start in [0,100,250,400,520]:
    a=ref[start*8000:min(len(ref),(start+10)*8000)].astype(float);b=mixed[start*8000:start*8000+len(a)].astype(float)
    corr=correlate(b,a,mode='full',method='fft');lags=correlation_lags(len(b),len(a));valid=np.abs(lags)<=800
    k=np.where(valid)[0][np.argmax(corr[valid])];lag=int(lags[k]);similarity=float(corr[k]/math.sqrt(np.dot(a,a)*np.dot(b,b)))
    assert abs(lag)<=160,(start,lag)
    assert similarity>.94,(start,similarity)
    sync.append({'start':start,'lag_seconds':lag/8000,'normalized_correlation':round(similarity,6)})

chapters=[]
for i,s in enumerate(T['scenes']):
    file=DELIVERY/'chapters'/f'singularity-part-{i+1:02d}.mp4';p=probe(file)
    v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
    end=T['scenes'][i+1]['startFrame'] if i+1<len(T['scenes']) else T['durationInFrames'];expected=end-s['startFrame']
    assert int(v['nb_frames'])==expected and v['r_frame_rate']=='30/1'
    assert abs(float(p['format']['duration'])-expected/30)<.08
    assert file.stat().st_size<100*1024*1024
    chapters.append({'file':str(file.relative_to(ROOT)),'frames':expected,'bytes':file.stat().st_size,'sha256':sha(file)})

# Inspect representative frames from the actual encoded delivery.
frames=[0,140,295,490,850,1300,1740,2180,2730,3120,3650,4100,4600,4950,5480,5700,6050,6590,7100,7480,8100,8590,9060,9440,9860,10160,10680,11110,11530,11870,12140,12530,12810,13220,13720,14350,14740,14980,15280,15450,15700,15980]
files=[]
for frame in frames:
    file=OUT/f'encoded-review-{frame}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-ss',str(frame/30),'-i',str(movie),'-frames:v','1',str(file)],check=True)
    files.append(file)
board=Image.new('RGB',(1600,math.ceil(len(files)/4)*250),'#11152f');draw=ImageDraw.Draw(board);font=ImageFont.truetype(str(ROOT/'public/assets/fonts/Outfit.ttf'),18)
for i,(frame,file) in enumerate(zip(frames,files)):
    im=Image.open(file).convert('RGB');im.thumbnail((400,225));x=i%4*400;y=i//4*250;board.paste(im,(x,y));draw.text((x+8,y+227),f'{frame/30:.2f}s / frame {frame}',font=font,fill='#fff1cf')
board.save(DOC/'sequence-review.jpg',quality=91)
Image.open(OUT/'encoded-review-14740.png').save(DOC/'observatory-character.png')

# Downloadable editable raster artwork, separate from the film and audio.
archive=ROOT/'assets/scenes/singularity-layered-artwork.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as z:
    for layer in layers:
        file=ROOT/'public/assets/artwork/singularity'/layer['file'];z.write(file,layer['file'])
    z.writestr('README.txt','Original layered PNG artwork for Singularity. Six clean background plates, five generation atlases, and 28 independent alpha sprites with softened 5% cell edges. Generated art is composited and animated in Remotion; source sprites and generated sheets remain included. Human character artwork uses the existing approved-characters atlas/blinks in the repository. Exact carbon/oxygen renderings are assembled from individual proton/neutron sprites rather than trusting generated cluster counts. See src/Singularity.tsx and docs/production/singularity/film/README.md.\n')
    z.writestr('manifest.json',json.dumps(layers,indent=2))

# Keep the subtitle download beside the finished film.
(DELIVERY/'singularity-captions.srt').write_bytes((ROOT/'assets/audio/singularity/singularity-captions-draft.srt').read_bytes())
record={'status':'rendered-and-validated','file':str(movie.relative_to(ROOT)),'sha256':sha(movie),'bytes':movie.stat().st_size,'duration_seconds':float(P['format']['duration']),'video':{'codec':video['codec_name'],'width':1920,'height':1080,'fps':30,'frames':T['durationInFrames'],'pixel_format':video['pix_fmt']},'audio':{'codec':audio['codec_name'],'sample_rate':48000,'channels':2,'narrator':'Google Vids Knox, original user recording','sync_checks':sync},'full_decode':'passed','unexpected_black_segments':0,'fast_start':True,'layers':len(layers),'approved_baseline_hashes_unchanged':baseline,'original_voice_hash_unchanged':True,'timing_and_voice_pitch_preserved':True,'caption_cues':len(T['captions']),'visual_beats':len(T['visualBeats']),'higher_bitrate_chapters':chapters,'artwork_archive':{'file':str(archive.relative_to(ROOT)),'bytes':archive.stat().st_size,'sha256':sha(archive)},'user_quality_approval':'pending','review_limitations':'Programmatic decoding/timing/levels plus representative rendered-frame inspection; no claim of a full human listening audit or guaranteed audience performance.'}
(DOC/'validation.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))
