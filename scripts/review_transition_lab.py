"""Review actual encoded transition-test footage; no automatic creative pass."""
from pathlib import Path
import hashlib
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
MOVIE=ROOT/'assets/videos/transition-lab/six-scene-transitions-20s.mp4'
DOC=ROOT/'docs/production/transition-lab';DOC.mkdir(parents=True,exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(MOVIE)]))
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_read_frames']))==(1920,1080,'30/1',600)
assert video['codec_name']=='h264' and audio['codec_name']=='aac'
assert int(audio['sample_rate'])==48000 and int(audio['channels'])==2
assert abs(float(probe['format']['duration'])-20)<.001
subprocess.run(['ffmpeg','-v','error','-i',str(MOVIE),'-f','null','-'],check=True)

def frame(time,width=640):
    data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(time),'-i',str(MOVIE),'-frames:v','1','-vf',f'scale={width}:-1','-f','rawvideo','-pix_fmt','rgb24','-'])
    return Image.frombytes('RGB',(width,width*9//16),data)

def label(im,xy,text,size=20):
    ImageDraw.Draw(im).text(xy,text,fill='#FFF2CC',font=ImageFont.truetype(FONT,size))

scenes=[('Rain',50),('Underwater fish',145),('Growing plant',273),('Butterfly',342),('Paper plane',438),('Night sky',575)]
board=Image.new('RGB',(1920,800),'#162B50')
for i,(name,f) in enumerate(scenes):
    x=i%3*640;y=i//3*400;board.paste(frame(f/30),(x,y));label(board,(x+15,y+367),f'{name} / {f/30:.2f}s')
board.save(DOC/'six-scenes.jpg',quality=94)

joins=[
    {'name':'Splash reveals underwater','from':78,'to':120,'mechanism':'The impacting drop creates a rising wave/splash contour; the fish keeps moving behind the changing water coverage.'},
    {'name':'Fish becomes leaf','from':178,'to':224,'mechanism':'One changing body outline, shrinking fins/eye, emerging veins, and a stalk growing from the former tail root.'},
    {'name':'Petals assemble into butterfly','from':275,'to':318,'mechanism':'The same four petal paths change orientation and flap; the flower center elongates into the butterfly body.'},
    {'name':'Butterfly folds into plane','from':375,'to':417,'mechanism':'The four wing paths flatten into paper facets while the same carrier continues on its authored path.'},
    {'name':'Flight trail becomes orbit','from':489,'to':573,'mechanism':'The plane contracts into a star; its continuing trail reshapes into an ellipse around the rising moon.'},
]
sheet=Image.new('RGB',(1920,5*180),'#162B50')
for row,join in enumerate(joins):
    label(sheet,(10,row*180+3),join['name'],17)
    for col in range(8):
        f=round(join['from']+(join['to']-join['from'])*col/7)
        sheet.paste(frame(f/30,240),(col*240,row*180+25))
        label(sheet,(col*240+4,row*180+160),f'{f/30:.3f}s',13)
sheet.save(DOC/'five-handoffs.jpg',quality=94)

graph='[0:v]fps=20,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(MOVIE),'-filter_complex',graph,'-an','-loop','0',str(DOC/'preview.gif')],check=True)
report={'file':str(MOVIE.relative_to(ROOT)),'sha256':hashlib.file_digest(MOVIE.open('rb'),'sha256').hexdigest(),
        'bytes':MOVIE.stat().st_size,'seconds':20,'frames':600,'fps':30,'width':1920,'height':1080,
        'audio':{'codec':'aac','sample_rate':48000,'channels':2,'content':'Original synthesized effects; no narration'},
        'scenes':[{'name':name,'review_frame':f} for name,f in scenes],'handoffs':joins,
        'full_decode':'passed','creative_status':'pending user review',
        'artwork':'Simple original authored SVG paths animated in Remotion; no image generation or reused singularity imagery.',
        'review_notes':'Representative encoded frames and transitional sequences inspected. Scene/hand-off sheets are spaced samples, not every source frame. GIF is a silent 20fps proxy with an artificial loop restart. Technical checks do not establish a creative pass.'}
feedback_path=DOC/'user-review.json'
if feedback_path.exists():
    feedback=json.loads(feedback_path.read_text())
    if feedback.get('sha256')==report['sha256']:
        report['creative_status']=feedback['status']
        report['user_review']=str(feedback_path.relative_to(ROOT))
(DOC/'delivery.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
