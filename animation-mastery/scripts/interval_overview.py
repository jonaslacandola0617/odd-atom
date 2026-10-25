"""Fast PTS-addressed phase scouting from the validated H264 navigation proxy."""
import argparse
import gzip
import json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from common import ROOT,dependency_modules,write_json
cv2,np=dependency_modules()
cv2.setNumThreads(1)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--video',required=True);p.add_argument('--start',type=float,required=True);p.add_argument('--end',type=float,required=True);p.add_argument('--step',type=float,default=.5);p.add_argument('--name',required=True);a=p.parse_args()
    if not (a.end>a.start>=0 and a.step>0):p.error('Invalid interval')
    if a.name!=Path(a.name).name:p.error('Name must be a simple directory name')
    with gzip.open(ROOT/'analysis/video-reports'/a.video/'frame-index.jsonl.gz','rt') as s:index=[json.loads(line) for line in s]
    times=np.array([f['pts_seconds'] for f in index]);samples=[];directory=ROOT/'analysis/keyframes'/a.video/a.name;directory.mkdir(parents=True,exist_ok=True)
    cap=cv2.VideoCapture(str(ROOT/'references/extracted'/f'{a.video}-proxy.mp4'));font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
    requested=np.arange(a.start,a.end,a.step)
    for page in range(int(np.ceil(len(requested)/24))):
        sheet=Image.new('RGB',(1440,780),'#171c2d');d=ImageDraw.Draw(sheet);d.text((12,12),a.video+' / '+a.name+' / PROXY PHASE SCOUT, not native-pixel artwork evidence',font=font,fill='white')
        for i,t in enumerate(requested[page*24:page*24+24]):
            f=int(np.searchsorted(times,t));cap.set(cv2.CAP_PROP_POS_FRAMES,f);okay,bgr=cap.read()
            if not okay or round(cap.get(cv2.CAP_PROP_POS_FRAMES))-1!=f:raise ValueError('Proxy frame seek failed')
            im=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));im.thumbnail((232,131),Image.Resampling.LANCZOS);x=i%6*240;y=50+i//6*180;sheet.paste(im,(x,y));d.text((x+3,y+137),f'f{f} / {times[f]:.4f}s',font=font,fill='white');samples.append({'frame_index':f,'pts_seconds':float(times[f]),'page':page+1})
        sheet.save(directory/f'overview-{page+1:03}.jpg',quality=93)
    cap.release();write_json(directory/'overview.json',{'video_id':a.video,'method':'Verified display-order proxy, frames selected by recorded source PTS; navigation only.','samples':samples,'visual_review':'pending'})
