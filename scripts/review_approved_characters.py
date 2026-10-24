"""Review the delivered approved-character film; no render or speech request.
Requires FFmpeg, Python 3 and Pillow. Review boards are diagnostic extracts."""
from pathlib import Path
import hashlib
import json
import struct
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
FILM=ROOT/'assets/videos/approved-characters-20s.mp4'
OUT=ROOT/'docs/production/approved-characters'
TEMP=ROOT/'out/approved-review'


def run(args):
    return subprocess.run(args,check=True,capture_output=True,text=True).stdout


def text(canvas,xy,label,size=21,color='#FFF6EC'):
    ImageDraw.Draw(canvas).text(xy,label,fill=color,font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size))


def board(size,title,note):
    im=Image.new('RGB',size,'#171526')
    text(im,(24,14),title,29)
    text(im,(24,58),note,18,'#C9C1D6')
    return im


def fitted(image,size):
    im=image.copy();im.thumbnail(size,Image.Resampling.LANCZOS);return im


def main():
    OUT.mkdir(parents=True,exist_ok=True);TEMP.mkdir(parents=True,exist_ok=True)
    probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(FILM)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video')
    audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_frames']))==(1920,1080,'30/1',600)
    assert float(probe['format']['duration'])==float(video['duration'])==float(audio['duration'])==20
    run(['ffmpeg','-v','error','-i',str(FILM),'-f','null','-'])
    samples=sorted(set(list(range(0,600,30))+[165,224,225,226,227,228,255,256,267,268,334,335,336,337,338,339,360,460,461,462,463,464,500,520,521,540,599]))
    selector='+'.join(f'eq(n\\,{i})' for i in samples)
    run(['ffmpeg','-v','error','-y','-i',str(FILM),'-vf','select='+selector,'-fps_mode','vfr',str(TEMP/'frame-%03d.png')])
    frames={frame:Image.open(TEMP/f'frame-{index:03d}.png').convert('RGB') for index,frame in enumerate(samples,1)}
    frames[360].save(ROOT/'assets/videos/approved-characters-20s-poster.png')

    sheet=board((1960,1100),'Approved characters / delivered 20-second sequence','Encoded MP4 samples every second. Original approved character sheet remains unchanged.')
    for index,frame in enumerate(range(0,600,30)):
        x,y=10+index%5*390,105+index//5*245
        sheet.paste(frames[frame].resize((384,216),Image.Resampling.LANCZOS),(x,y))
        text(sheet,(x+4,y+218),f'{frame/30:04.1f}s / frame {frame}',16)
    sheet.save(OUT/'sequence.jpg',quality=93)

    sheet=board((1960,630),'Dialogue and reaction / actual rendered frames','Gesture, blink/response, cup lift, and the final settle. No unencoded replacement stills.')
    for index,frame in enumerate([240,270,300,335,336,360,500,520,540,599]):
        x,y=10+index%5*390,105+index//5*250
        sheet.paste(frames[frame].resize((384,216),Image.Resampling.LANCZOS),(x,y))
        text(sheet,(x+4,y+218),f'frame {frame} / {frame/30:.3f}s',16)
    sheet.save(OUT/'acting.jpg',quality=94)

    sheet=board((1600,940),'Blink and expression detail / delivered pixels','Native-coordinate face crops fitted proportionally. Inspect eyelids, brows, neck and collar joins.')
    entries=[(255,(1190,155,1620,525),'Sol blink'),(267,(565,255,995,610),'Mira worried blink'),
             (335,(565,255,995,610),'Before response'),(336,(565,255,995,610),'Response during blink'),
             (520,(500,150,1050,640),'Mira close-up blink')]
    for index,(frame,box,label) in enumerate(entries):
        col,row=index%3,index//3
        x,y=20+col*525,105+row*405
        text(sheet,(x,y),f'{label} / {frame}',19)
        crop=fitted(frames[frame].crop(box),(500,350))
        sheet.paste(crop,(x,y+34))
    sheet.save(OUT/'faces.jpg',quality=96)

    master=Image.open(ROOT/'assets/characters/static-test-01.png').convert('RGB')
    sheet=board((1900,1190),'Approved static master / delivered animated characters','Left: user-approved source sheet. Right: actual MP4 frame 360. Fit proportionally; no similarity score.')
    for x,im,title in [(25,master,'APPROVED MASTER'),(975,frames[360],'DELIVERED / 12.0s')]:
        text(sheet,(x,110),title,23)
        sheet.paste(fitted(im,(900,640)),(x,155))
    for x,source,box,title in [
        (25,master,(55,110,365,350),'Approved Mira'),
        (500,frames[360],(565,255,995,610),'Animated Mira'),
        (975,master,(450,25,680,275),'Approved Sol'),
        (1450,frames[360],(1190,155,1620,525),'Animated Sol')]:
        text(sheet,(x,830),title,21)
        sheet.paste(fitted(source.crop(box),(410,285)),(x,866))
    sheet.save(OUT/'master-comparison.jpg',quality=95)

    decoded={label:run(['ffmpeg','-v','error','-i',str(file),'-map','0:a:0','-f','md5','-']).strip()
             for label,file in [('original',ROOT/'assets/videos/alone-in-a-crowd-20s.mp4'),('approved',FILM)]}
    data=FILM.read_bytes();atoms=[];offset=0
    while offset+8<=len(data):
        length,kind=struct.unpack('>I4s',data[offset:offset+8]);kind=kind.decode('ascii')
        if length==1:length=struct.unpack('>Q',data[offset+8:offset+16])[0]
        if length==0:length=len(data)-offset
        assert length>=8
        atoms.append(kind);offset+=length
    assert atoms.index('moov')<atoms.index('mdat')
    master_hash=hashlib.sha256((ROOT/'assets/characters/static-test-01.png').read_bytes()).hexdigest()
    assert master_hash=='72842deef29e191d0f0699c66684d57b6869a0b4cfb2d50937a268f54b80b73f'
    record={
        'film':str(FILM.relative_to(ROOT)),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),
        'container_duration':probe['format']['duration'],
        'video':{key:video[key] for key in ['codec_name','width','height','r_frame_rate','nb_frames','pix_fmt','duration']},
        'audio':{key:audio[key] for key in ['codec_name','sample_rate','channels','duration']},
        'full_decode':'passed','fast_start':True,'top_level_atoms':atoms,
        'decoded_audio_md5':decoded,'same_decoded_audio_as_original':decoded['original']==decoded['approved'],
        'narration':'Existing genuine generated ElevenLabs narration reused; no new speech API request.',
        'approved_master_sha256':master_hash,'approved_master_unchanged':True,
        'retained_review_samples':samples,
        'animation_method':'Remotion cutout animation: illustrated heads, bodies, shoulder-pivot arms, eye-area blink overlays, expression replacement during a blink, breathing, layered crowd movement, and camera staging.',
        'limits':'Limited 2D cutout rig; no full turnarounds, articulated walking cycle, or phoneme lip sync is claimed.',
    }
    (OUT/'validation.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps(record,indent=2))


if __name__=='__main__':main()
