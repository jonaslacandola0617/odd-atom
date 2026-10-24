"""Validate encoded motion studies and extract diagnostic boards/previews."""
from pathlib import Path
import hashlib,json,struct,subprocess
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1];O=R/'docs/production/artwork-motion';T=R/'out/artwork-motion-review'
O.mkdir(parents=True,exist_ok=True);T.mkdir(parents=True,exist_ok=True)
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True).stdout
def txt(im,xy,s,size=20):ImageDraw.Draw(im).text(xy,s,fill='#FFF4E7',font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size))
def board(size,title,note):
 im=Image.new('RGB',size,'#20172D');txt(im,(20,14),title,28);txt(im,(20,56),note,17);return im
records=[]
for topic,source in [('medicine','medicine-immune-defense'),('cyber','cyber-network-defense')]:
 film=R/f'assets/videos/{topic}-artwork-motion-20s.mp4'
 probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(film)]))
 v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
 assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'30/1',600)
 assert float(probe['format']['duration'])==float(v['duration'])==float(a['duration'])==20
 assert a['sample_rate']=='48000' and a['channels']==2
 run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'])
 frames=sorted(set(list(range(0,600,30))+[0,47,48,49,51,52,53,70,100,135,136,138,140,141,170,180,220,232,240,242,244,246,250,260,300,360,376,378,381,418,430,440,450,500,523,525,528,544,570,590,599]))
 folder=T/topic;folder.mkdir(exist_ok=True)
 selector='+'.join(f'eq(n\\,{f})' for f in frames)
 run(['ffmpeg','-v','error','-y','-i',str(film),'-vf','select='+selector,'-fps_mode','vfr',str(folder/'%03d.png')])
 images={f:Image.open(folder/f'{i:03d}.png').convert('RGB') for i,f in enumerate(frames,1)}
 images[70 if topic=='medicine' else 180].save(R/f'assets/videos/{topic}-artwork-motion-20s-poster.png')
 b=board((1960,1100),topic.title()+' / delivered 20-second motion study','Decoded MP4 samples every second. All labels are diagnostic; the movie contains no on-screen text.')
 for i,f in enumerate(range(0,600,30)):
  x,y=10+i%5*390,100+i//5*247;b.paste(images[f].resize((384,216),Image.Resampling.LANCZOS),(x,y));txt(b,(x+4,y+219),f'{f/30:.1f}s / {f}',16)
 b.save(O/f'{topic}-sequence.jpg',quality=94)
 if topic=='medicine':
  b=board((1960,1010),'Medicine / blink, contact and immune capture','Native-coordinate crops from encoded frames. Human silhouette/garment colors come from the approved source PNG.')
  entries=[(47,(1210,180,1630,560),'before blink'),(49,(1210,180,1630,560),'blink'),(53,(1210,180,1630,560),'after blink'),(170,(1100,560,1530,900),'slide and contact'),(0,(350,160,840,640),'two microbes'),(170,(350,160,840,640),'first capture'),(260,(350,160,840,640),'first contained'),(430,(350,160,840,640),'second capture'),(450,(350,160,840,640),'second contained'),(599,(350,160,840,640),'settled')]
 else:
  b=board((1960,1010),'Cyber / routes, fans and containment','Decoded pixels: clean traffic passes the gate; fragments descend, land and settle in the basin.')
  entries=[(0,(450,180,1050,600),'gateway'),(70,(450,180,1050,600),'gateway'),(180,(450,180,1050,600),'gateway'),(300,(450,180,1050,600),'gateway'),(0,(1160,620,1870,1030),'basin start'),(180,(1160,620,1870,1030),'arriving fragments'),(360,(1160,620,1870,1030),'containment'),(599,(1160,620,1870,1030),'settled fragments'),(0,(175,50,520,185),'fan'),(70,(175,50,520,185),'rotated fan')]
 for i,(f,box,name) in enumerate(entries):
  x,y=10+i%5*390,100+i//5*445;im=images[f].crop(box);im.thumbnail((384,405),Image.Resampling.LANCZOS);b.paste(im,(x,y));txt(b,(x+3,y+408),f'{name} / {f}',16)
 b.save(O/f'{topic}-details.jpg',quality=96)
 b=board((1960,710),topic.title()+' / approved source and encoded motion frame','Source at left; delivered frame 70 at right. Proportional full-frame views; moving objects have different poses/locations.')
 for x,im,title in [(15,Image.open(R/f'assets/scenes/artwork-consistency-02/{source}.png').convert('RGB'),'APPROVED ARTWORK'),(995,images[70],'DELIVERED ANIMATION')]:
  txt(b,(x,100),title,22);im.thumbnail((950,550),Image.Resampling.LANCZOS);b.paste(im,(x,140))
 b.save(O/f'{topic}-source-comparison.jpg',quality=95)
 # Short normal-time samples, reduced for convenient GitHub previews.
 start='4.5' if topic=='medicine' else '2.0'
 filt='fps=15,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3'
 run(['ffmpeg','-y','-v','error','-ss',start,'-t','4','-i',str(film),'-filter_complex',filt,'-loop','0',str(O/f'{topic}-motion.gif')])
 data=film.read_bytes();atoms=[];offset=0
 while offset+8<=len(data):
  n,k=struct.unpack('>I4s',data[offset:offset+8]);n=struct.unpack('>Q',data[offset+8:offset+16])[0] if n==1 else n
  if not n:n=len(data)-offset
  assert n>=8;atoms.append(k.decode());offset+=n
 assert atoms.index('moov')<atoms.index('mdat')
 levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(film),'-af','loudnorm=print_format=json','-f','null','-'],check=True,capture_output=True,text=True).stderr
 levels=json.JSONDecoder().raw_decode(levels[levels.rfind('{'):])[0];assert float(levels['input_tp']) < -1
 records.append({'film':str(film.relative_to(R)),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'duration':probe['format']['duration'],'video':{k:v[k] for k in ['codec_name','width','height','r_frame_rate','nb_frames','pix_fmt','duration']},'audio':{k:a[k] for k in ['codec_name','sample_rate','channels','duration']},'fast_start':True,'full_decode':'passed','mix_loudness':{k:levels[k] for k in ['input_i','input_tp','input_lra']},'review_frames':frames,'preview':{'start_seconds':float(start),'duration_seconds':4,'fps':15,'width':720},'narration':'None; deliberately wordless artwork motion study with original synthesized sound.'})
 print(topic,'validated and reviewed')
approved=json.loads((R/'docs/production/artwork-consistency-02/generation.json').read_text())
locked=approved['unchanged_baseline_sha256'].copy()
for asset in approved['assets']:locked[asset['asset']]=asset['sha256']
for file,sha in locked.items():assert hashlib.sha256((R/file).read_bytes()).hexdigest()==sha,file
for item in json.loads((O/'assets.json').read_text()):assert hashlib.sha256((R/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
(O/'validation.json').write_text(json.dumps({'films':records,'approved_baselines_unchanged':locked,'all_runtime_png_hashes_verified':True,'limits':'Encoded-frame, contact, geometry and media checks support review; they do not establish subjective motion quality or studio parity.'},indent=2)+'\n')
print('All approved source files and runtime asset hashes verified unchanged.')
