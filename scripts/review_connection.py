"""Extract review evidence from the actual rebuilt MP4. Requires FFmpeg,
Pillow, and NumPy. Does not generate speech or render a new film."""
from pathlib import Path
import hashlib
import json
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/production/crowd-rebuilt-review'
TEMP = ROOT / 'out/connection-review'
FILM = ROOT / 'assets/videos/alone-in-a-crowd-rebuilt-20s.mp4'
OLD = ROOT / 'assets/videos/alone-in-a-crowd-20s.mp4'
REF = ROOT / 'references/studies/topic-range-2026-10-23/images/loneliness-02.webp'
BACKGROUND = '#171426'


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def frame(file, index, name):
    path = TEMP / f'{name}.png'
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{index/30:.8f}', '-i', str(file),
         '-frames:v', '1', str(path)])
    return Image.open(path).convert('RGB')


def text(canvas, xy, value, size=22, color='#FFF4E6'):
    ImageDraw.Draw(canvas).text(xy, value, fill=color,
        font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', size))


def sheet(size, title, subtitle):
    canvas = Image.new('RGB', size, BACKGROUND)
    text(canvas, (25,15), title, 30)
    text(canvas, (25,60), subtitle, 19, '#C5BDD6')
    return canvas


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    TEMP.mkdir(parents=True, exist_ok=True)
    media = json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(FILM)]))
    video = next(s for s in media['streams'] if s['codec_type']=='video')
    audio = next(s for s in media['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_frames']))==(1920,1080,'30/1',600)
    assert float(media['format']['duration'])==20 and float(audio['duration'])==20
    run(['ffmpeg','-v','error','-i',str(FILM),'-f','null','-'])
    audio_hashes = {name: run(['ffmpeg','-v','error','-i',str(file),'-map','0:a:0','-f','md5','-']).strip()
                    for name,file in [('original',OLD),('rebuilt',FILM)]}

    frames = {i: frame(FILM,i,f'new-{i:03d}') for i in sorted(set(list(range(0,600,30))+[165,226,225,224,227,228,360,460,461,462,463,464,540,599]))}
    old = {i: frame(OLD,i,f'old-{i:03d}') for i in [165,360,540]}
    # The poster is extracted from the deliverable, not an unencoded still.
    frames[360].save(ROOT/'assets/videos/alone-in-a-crowd-rebuilt-20s-poster.png')

    board = sheet((1960,1100), 'Delivered sequence / frames 0, 30, ... 570',
                  'One-second samples from the rebuilt MP4. Artwork, captions, shot changes, and set coverage.')
    for n, i in enumerate(range(0,600,30)):
        x,y = 10+(n%5)*390, 105+(n//5)*245
        board.paste(frames[i].resize((384,216),Image.Resampling.LANCZOS),(x,y))
        text(board,(x+5,y+219),f'{i/30:04.1f}s / frame {i}',16)
    board.save(OUT/'sequence.jpg',quality=92)

    board = sheet((1960,630), 'Actual frames around the two cuts',
                  'First cafe frame: 226 (7.533s). First reaction frame: 462 (15.400s).')
    for n,i in enumerate([224,225,226,227,228,460,461,462,463,464]):
        x,y=10+(n%5)*390,105+(n//5)*250
        board.paste(frames[i].resize((384,216),Image.Resampling.LANCZOS),(x,y))
        text(board,(x+5,y+219),f'frame {i} / {i/30:.3f}s',16)
    board.save(OUT/'cuts.jpg',quality=92)

    board=sheet((1900,1900),'Original rejected test / rebuilt artwork',
                'Left: original test. Right: rebuild. Same delivered times, full frames fitted without stretching.')
    for row,(i,name) in enumerate([(165,'Street / 5.5 seconds'),(360,'Cafe / 12.0 seconds'),(540,'Reaction / 18.0 seconds')]):
        y=110+row*585
        for col,im in enumerate([old[i],frames[i]]):
            x=25+col*950
            text(board,(x,y),('BEFORE / ' if col==0 else 'REBUILT / ')+name,23)
            board.paste(im.resize((900,506),Image.Resampling.LANCZOS),(x,y+40))
    board.save(OUT/'before-after.jpg',quality=94)

    reference=Image.open(REF).convert('RGB')
    board=sheet((1650,1470),'Faces / official reference, rejected test, rebuilt test',
                'All crops enlarged 2x with nearest sampling. Native coordinates; different head views and scale.')
    entries=[
        (0,0,reference,(995,205,1165,395),'REFERENCE / Loneliness, human 1'),
        (1,0,old[360],(540,430,710,620),'BEFORE / Mira, 12s'),
        (2,0,frames[360],(660,310,860,555),'REBUILT / Mira, 12s'),
        (0,1,reference,(1465,35,1635,225),'REFERENCE / Loneliness, human 2'),
        (1,1,old[360],(1180,430,1350,620),'BEFORE / Sol, 12s'),
        (2,1,frames[360],(1310,265,1540,560),'REBUILT / Sol profile, 12s'),
    ]
    for col,row,im,box,title in entries:
        x,y=25+col*550,110+row*665
        text(board,(x,y),title,21)
        text(board,(x,y+31),str(box)+' / 2x',17,'#C5BDD6')
        region=im.crop(box)
        board.paste(region.resize((region.width*2,region.height*2),Image.Resampling.NEAREST),(x,y+62))
    board.save(OUT/'faces.png')

    def saturation(image):
        rgb=np.asarray(image,dtype=float)/255
        hi,lo=rgb.max(2),rgb.min(2)
        sat=np.divide(hi-lo,hi,out=np.zeros_like(hi),where=hi>0)
        return {'median_hsv_saturation':round(float(np.median(sat)),4),
                'percent_saturation_ge_0_7':round(float((sat>=.7).mean()*100),3)}
    manifest={
        'film':str(FILM.relative_to(ROOT)), 'sha256':sha(FILM), 'bytes':FILM.stat().st_size,
        'container_duration':media['format']['duration'],
        'video':{k:video[k] for k in ['codec_name','width','height','r_frame_rate','nb_frames','pix_fmt','duration']},
        'audio':{k:audio[k] for k in ['codec_name','sample_rate','channels','duration']},
        'full_decode':'passed', 'decoded_audio_md5':audio_hashes,
        'same_decoded_audio_as_original':audio_hashes['original']==audio_hashes['rebuilt'],
        'narration':'Existing generated ElevenLabs narration reused; no new speech generation or account charge.',
        'source_authorship':'Official reference crops are Kurzgesagt artwork. Before/rebuilt frames are original project artwork.',
        'source_reference':{'path':str(REF.relative_to(ROOT)),'sha256':sha(REF),'page':'https://kurzgesagt.org/projects/loneliness'},
        'street_top_900_pixels':{'before':saturation(old[165].crop((0,0,1920,900))),
                                 'rebuilt':saturation(frames[165].crop((0,0,1920,900)))},
        'measurement_limit':'Saturation describes these different scene pixels, not a visual quality or style-match score.',
        'review_sampling':{'sequence_frames':list(range(0,600,30)),
                           'cut_frames':[224,225,226,227,228,460,461,462,463,464],
                           'additional_frames':[165,360,540,599]},
    }
    (OUT/'validation.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(manifest,indent=2))


if __name__=='__main__':
    main()
