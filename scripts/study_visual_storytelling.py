"""Build caption-redacted evidence for animation as visual storytelling.

Read-only toward production artwork/audio/films. User-uploaded source clips are
not copied in full; short silent GIFs and timestamped study sheets are created.
"""
from pathlib import Path
import argparse
import hashlib
from html.parser import HTMLParser
import json
import subprocess
import sys
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.cache/motion-study'))
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT=ROOT/'references/studies/storytelling-2026-10-25'
TEMP=ROOT/'out/storytelling-study'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()


def text(im,xy,value,size=17,color='#FFF1CF'):
    ImageDraw.Draw(im).text(xy,value,font=ImageFont.truetype(FONT,size),fill=color)


def decode(cap,time=None):
    if time is not None:cap.set(cv2.CAP_PROP_POS_MSEC,time*1000)
    ok,bgr=cap.read()
    if not ok:raise RuntimeError(f'Cannot decode {time}')
    return Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)),{
        'requested_seconds':time,'decoded_pts_seconds':round(cap.get(cv2.CAP_PROP_POS_MSEC)/1000,6),
        'decoded_frame_index':round(cap.get(cv2.CAP_PROP_POS_FRAMES))-1}


def mask_image(im,boxes):
    result=im.copy();draw=ImageDraw.Draw(result);w,h=result.size
    for x,y,r,b in boxes:draw.rectangle((round(x*w),round(y*h),round(r*w),round(b*h)),fill='#15243F')
    return result


def frame_sheet(case,path,masks,dense=False):
    cap=cv2.VideoCapture(str(path));count=24 if dense else 12;cols=6;cw,ch=200,376
    canvas=Image.new('RGB',(cols*cw,80+(count//cols)*ch),'#15243F')
    text(canvas,(12,10),case['title'],21)
    text(canvas,(12,45),path.name+' / narration-caption redacted / source PTS',15,color='#BBCBD6')
    times=[None]*24 if dense else np.linspace(case['start'],case['end'],count)
    if dense:cap.set(cv2.CAP_PROP_POS_MSEC,case['dense_start']*1000)
    samples=[]
    for i,time in enumerate(times):
        im,record=decode(cap,None if time is None else float(time));samples.append(record)
        im=mask_image(im,masks);im.thumbnail((cw-5,ch-27),Image.Resampling.LANCZOS)
        x,y=i%cols*cw,80+i//cols*ch;canvas.paste(im,(x,y));text(canvas,(x+3,y+ch-24),f"{record['decoded_pts_seconds']:.3f}s",15)
    cap.release()
    if dense:assert all(b['decoded_frame_index']==a['decoded_frame_index']+1 for a,b in zip(samples,samples[1:]))
    relative='sheets/'+case['key']+('-dense' if dense else '')+'.jpg';canvas.save(OUT/relative,quality=92)
    return {'file':relative,'consecutive':dense,'samples':samples}


def key_strip(case,path,masks):
    cap=cv2.VideoCapture(str(path));cw,ch=340,650
    canvas=Image.new('RGB',(cw*3,ch),'#15243F');samples=[]
    text(canvas,(12,10),case['title'],20)
    for i,(time,label) in enumerate(zip(case['key_times'],['Before','Action / intervention','After / consequence'])):
        im,record=decode(cap,time);samples.append(record);im=mask_image(im,masks);im.thumbnail((cw-8,570),Image.Resampling.LANCZOS)
        canvas.paste(im,(i*cw,58));text(canvas,(i*cw+4,34),label,15,color='#94D7CC');text(canvas,(i*cw+4,625),f"{record['decoded_pts_seconds']:.3f}s",15)
    cap.release();relative='story-strips/'+case['key']+'.jpg';canvas.save(OUT/relative,quality=92)
    return {'file':relative,'samples':samples,'note':'Analyst-selected sequence states, not a blinded viewer test.'}


def preview(case,path,masks):
    boxes=[]
    for x,y,r,b in masks:boxes.append(f'drawbox=x=iw*{x}:y=ih*{y}:w=iw*{r-x}:h=ih*{b-y}:color=0x15243F:t=fill')
    graph='[0:v]'+','.join(boxes+['fps=20','scale=240:-1:flags=lanczos','split[a][b]'])+';[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3'
    relative='loops/'+case['key']+'.gif';dest=OUT/relative
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(case['start']),'-t',str(case['end']-case['start']),'-i',str(path),'-filter_complex',graph,'-an','-loop','0',str(dest)],check=True)
    return {'file':relative,'sha256':sha(dest),'bytes':dest.stat().st_size,'silent':True,'fps':20,
            'note':'Short source excerpt with visible study redactions. Artificial GIF restart is not a source story event.'}


class Visible(HTMLParser):
    def __init__(self):super().__init__();self.skip=0;self.words=[]
    def handle_starttag(self,tag,attrs):
        if tag in ['script','style']:self.skip+=1
    def handle_endtag(self,tag):
        if tag in ['script','style']:self.skip=max(0,self.skip-1)
    def handle_data(self,data):
        if not self.skip and data.strip():self.words.append(data.strip())


OFFICIAL=[
 ('process','https://kurzgesagt.org/what-we-do?visit=videos',
  ['After deliberating over the best visual metaphors and ideas for each scene in the sketching phase',
   'His voiceover provides the timing for the animation team'],
  'The stated process selects visual metaphors/scene ideas before finished illustration; researched scripts organize facts into a story, and recorded voice supplies timing. This supports planning explanatory action before polishing drawings.'),
 ('loneliness','https://kurzgesagt.org/projects/loneliness',
  ['a scientific video should connect to people to have an impact'],
  'The case study emphasizes handling a personal feeling with an appropriate tone. The reviewed stills communicate withdrawal through posture and separated framing. They do not establish any animation timing.'),
 ('behind-the-lies','https://kurzgesagt.org/projects/behind-the-lies',
  ['a highly simplified story that serves as a gateway to understand the bigger picture'],
  'The studio describes deliberate simplification in science communication. A legible metaphor should preserve the relationship being explained and leave its limits clear.'),
 ('extreme-place','https://kurzgesagt.org/projects/most-extreme-place',
  ['puts you in the footsteps of a traveler that gets smaller and smaller'],
  'The official description makes a scale journey experiential through a traveler. In the inspected still, the small travelers, oversized insect and shared plant surfaces make scale relational rather than only numerical.'),
 ('nuke-city','https://kurzgesagt.org/projects/nuke-a-city',
  ['To make this danger tangible', 'Showing the unimaginable'],
  'The official page describes a play-by-play human consequence story and the balance between watchability and conveying harm. The inspected city/blast still uses recognizable buildings as a scale anchor; no full-episode timing is inferred.'),
]


def official_sources():
    result=[]
    for key,url,quotes,note in OFFICIAL:
        path=TEMP/(key+'.html')
        if not path.exists():
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=25) as response:path.write_bytes(response.read())
        parser=Visible();parser.feed(path.read_text());plain=' '.join(parser.words)
        for quote in quotes:assert quote in plain,(key,quote)
        result.append({'key':key,'url':url,'kind':'official studio production/case-study text',
                       'retrieved_date_local':'2026-10-25','timezone':'Asia/Manila','http_status':200,
                       'html_sha256':sha(path),'supporting_quotes':quotes,'paraphrased_relevance':note,
                       'limits':'Website text and selected official stills; not playback of the linked full YouTube episode.'})
    (OUT/'official-sources.json').write_text(json.dumps(result,indent=2)+'\n')
    images=[
        ('loneliness-01.webp','Loneliness: withdrawal and isolation in a crowd'),
        ('loneliness-02.webp','Loneliness: separate frames, shared vulnerable poses'),
        ('nuke-a-city-01.webp','Nuke a City: familiar buildings anchor the consequence'),
        ('most-extreme-place-01.webp','Scale journey: travelers give the insect a relative size'),
    ]
    board=Image.new('RGB',(1920,1160),'#15243F');records=[]
    for i,(name,caption) in enumerate(images):
        path=ROOT/'references/studies/topic-range-2026-10-23/images'/name;im=Image.open(path).convert('RGB');im.thumbnail((950,495),Image.Resampling.LANCZOS)
        x,y=i%2*960,i//2*580;board.paste(im,(x,y+45));text(board,(x+8,y+10),caption,20)
        text(board,(x+8,y+548),'Official reference artwork / still-image observation only',16,color='#BBCBD6')
        records.append({'file':str(path.relative_to(ROOT)),'sha256':sha(path),'inspection':'Existing official reference artwork re-inspected; not original project drawing.'})
    board.save(OUT/'official-story-staging.jpg',quality=92)
    return result,records


def case_notes(config):
    lines=['# Case-by-case visual-story notes','',
           'Read these as analyst observations of selected source intervals, not measured audience comprehension. Narration captions are redacted in previews. Four cases also remove their remaining readable diagram labels; other cases retain scientific labels and explicitly list what still needs language. Masks can obscure other source pixels in the same rectangles.','']
    for i,c in enumerate(config['cases'],1):
        lines.extend([f"## {i}. {c['title']}",'',f"**Source {c['source']} / {c['start']:.2f}–{c['end']:.2f} s** · {c['function']}"+(' · ambient-motion control' if c.get('control') else ''),'',
                      f"![Caption-redacted source excerpt](loops/{c['key']}.gif)",'',
                      '| State | Observed staging/action |','|---|---|',
                      f"| Before | {c['before']} |",f"| Intervention/action | {c['action']} |",f"| Result | {c['after']} |",'',
                      '**Visible relationship:** '+c['visible_without_words'],'',
                      '**Still needs language/context:** '+c['needs_language'],'',
                      '**What the action adds:** '+c['removing_motion_loses'],'',
                      '**Production lesson:** '+c['lesson'],'',
                      f"[Before/action/after strip](story-strips/{c['key']}.jpg) · [Timestamped samples](sheets/{c['key']}.jpg)",''])
    (OUT/'case-notes.md').write_text('\n'.join(lines))


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source-root',type=Path,default=Path('/workspace/attachments'));args=parser.parse_args()
    for folder in ['sheets','loops','story-strips']:(OUT/folder).mkdir(parents=True,exist_ok=True)
    TEMP.mkdir(parents=True,exist_ok=True)
    config=json.loads((OUT/'cases.json').read_text())
    frozen_paths=['assets/videos/transition-lab/six-scene-transitions-20s.mp4','assets/videos/singularity/singularity-full-8m56.mp4',
                  'assets/characters/static-test-01.png','assets/scenes/artwork-consistency-02/medicine-immune-defense.png',
                  'assets/scenes/artwork-consistency-02/cyber-network-defense.png','public/assets/audio/singularity/narration-original.m4a']
    frozen={p:sha(ROOT/p) for p in frozen_paths}
    old=json.loads((ROOT/'references/studies/motion-2026-10-24/measurements.json').read_text())['sources'];paths={};sources=[]
    for row in old:
        found=list(args.source_root.rglob(row['filename']));assert len(found)==1,(row['filename'],len(found))
        path=paths[row['id']]=found[0];assert sha(path)==row['sha256']
        sources.append({'id':row['id'],'filename':row['filename'],'sha256':row['sha256'],'media':row['media']})
    studied=[]
    dense_times={'takeoff':25.5,'receptor-fit':14.95,'pruning':62.4,'repair-worker':53.1}
    for case in config['cases']:
        caption_mask=config.get('source_caption_masks',{}).get(str(case['source']),config['caption_mask_normalized_xyxy'])
        masks=[caption_mask]+case['extra_masks'];path=paths[case['source']]
        row={**case,'masks_normalized_xyxy':masks,'sheet':frame_sheet(case,path,masks),
             'story_strip':key_strip(case,path,masks),'preview':preview(case,path,masks)}
        if case['key'] in dense_times:
            row['dense']=frame_sheet({**case,'dense_start':dense_times[case['key']]},path,masks,True)
        studied.append(row);print('studied',case['key'],flush=True)
    # Preserve a scientific-uncertainty annotation as a separate context still.
    cap=cv2.VideoCapture(str(paths[6]));im,record=decode(cap,50.6);cap.release()
    mask_image(im,[config.get('source_caption_masks',{}).get('6',config['caption_mask_normalized_xyxy'])]).save(OUT/'repair-uncertainty.png')
    official,images=official_sources();case_notes(config)
    assert all(sha(ROOT/p)==digest for p,digest in frozen.items()),'Production/reference baseline changed during study'
    manifest={'review_date_local':'2026-10-25','timezone':'Asia/Manila',
              'scope':'16 selected storytelling intervals and one ambient-motion control across all eight supplied reference videos, with four words-off examples and four consecutive-frame intervals. Five official studio production/case-study pages and four official stills were inspected. This is not a new full-episode YouTube review.',
              'sources':sources,'cases':studied,'official_text_sources':official,'official_still_sources':images,
              'uncertainty_context':{'source':6,'file':'repair-uncertainty.png','frame':record,'note':'The original speech bubble explicitly preserves uncertainty about the recruitment signal; it is retained as evidence of what language must clarify.'},
              'production_files_unchanged':frozen,
              'method_limits':['Analyst knows the topics and has inspected original frames; this is not a blind study or audience experiment.',
                  'Caption masks obscure all pixels in their rectangles, including some actors/props. Original files remain unchanged.',
                  'Only four words-off cases remove additional readable labels; scientific labels/icons remain in the others.',
                  'GIFs are silent, scaled to 240px and 20fps, with artificial restarts. Dense sheets retain 24 consecutive decoded source-frame records.',
                  'Before/action/after strips are analyst-selected states; a juxtaposition is not automatically proof of a scientific mechanism.',
                  'Motion inference applies to the uploaded clips; official stills/text support only composition or stated production intentions.',
                  'No new production animation, narration or API-funded assets are generated by this study.'],
              'tools':{'opencv':cv2.__version__,'numpy':np.__version__}}
    (OUT/'study.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Saved storytelling evidence and case notes.',flush=True)


if __name__=='__main__':main()
