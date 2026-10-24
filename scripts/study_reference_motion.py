"""Build diagnostic motion sheets, short silent reference loops and measurements.

Inputs are the user's uploaded reference MP4s, not downloaded full episodes.
Requires OpenCV, NumPy, Pillow and FFmpeg. Art/production assets are read only.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
if (ROOT/'.cache/motion-study').exists():
    sys.path.insert(0,str(ROOT/'.cache/motion-study'))
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFont

OUT=ROOT/'references/studies/motion-2026-10-24'
TEMP=ROOT/'out/motion-study'
NAMES={
 1:'The Deadliest Thing in Your Kitchen.mp4',
 2:'Your Brain on Magic Mushrooms.mp4',
 3:'The True Cost of War.mp4',
 4:'Where Did the Antimatter Go_.mp4',
 5:'Could Humans Evolve Flight.mp4',
 6:'Your Skeleton Is Electric.mp4',
 7:'Your Brain Peaked at Birth.mp4',
 8:'Let’s Steal a New Moon.mp4',
}
CASES=[
 {'key':'lift','source':6,'start':.5,'end':2.7,'title':'Whole-body lift: knees, hips, torso, arms, bar','crop':[35,200,575,790],'loop':True},
 {'key':'takeoff','source':5,'start':25.4,'end':26.8,'title':'Takeoff: crouch, push, flight, wing/leg changes','loop':True},
 {'key':'presenter','source':3,'start':.4,'end':2.6,'title':'Presenter: face, head and arm poses against a held screen','crop':[0,570,608,1080],'loop':True},
 {'key':'walk','source':4,'start':36.8,'end':39,'title':'Walk: alternating legs, body travel, gaze and arm pose','crop':[0,300,360,640],'loop':True},
 {'key':'emotion','source':3,'start':56.4,'end':58.3,'title':'Quiet acting: changes of face, hands and head; still field'},
 {'key':'surfer','source':7,'start':46.4,'end':48.6,'title':'Independent motion: water, sky, board, body and face','loop':True},
 {'key':'ocean','source':8,'start':9,'end':10.8,'title':'Mostly held beach: acting against a stable pier and sky','loop':True},
 {'key':'volcano','source':8,'start':40.4,'end':42.2,'title':'Scene travel: shared landscape motion; inspect plumes separately','loop':True},
 {'key':'psyche','source':2,'start':24.7,'end':26.1,'title':'Explanatory effect field: changing bands around the brain'},
 {'key':'sugar','source':1,'start':2.6,'end':3.8,'title':'Graphic actor: coordinated eyes, body tilt, arms and legs'},
 {'key':'orbit','source':8,'start':48,'end':50.2,'title':'Diagram motion: orbiting body, label and fading ring'},
]


def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def text(canvas,xy,value,size=21,color='#FFF7EA'):
    ImageDraw.Draw(canvas).text(xy,value,fill=color,font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size))


def fit(image,size):
    im=image.copy();im.thumbnail(size,Image.Resampling.LANCZOS);return im


def decode(cap,time):
    cap.set(cv2.CAP_PROP_POS_MSEC,time*1000)
    ok,bgr=cap.read()
    if not ok:raise RuntimeError(f'Cannot read requested time {time}')
    return bgr,{'requested_seconds':round(time,6),'decoded_pts_seconds':round(cap.get(cv2.CAP_PROP_POS_MSEC)/1000,6),
                'decoded_frame_index':round(cap.get(cv2.CAP_PROP_POS_FRAMES))-1}


def make_sheet(case,path,dense=False):
    cap=cv2.VideoCapture(str(path))
    if dense:
        times=1.3+np.arange(24)/30
        cell=(245,290);size=(1470,1290);rows=4;crop=[35,200,575,790]
        title='Lift / 24 consecutive nominal-30-fps samples'
    else:
        times=np.linspace(case['start'],case['end'],12)
        cell=(210,420);size=(1260,960);rows=2;crop=None
        title=case['title']
    sheet=Image.new('RGB',size,'#171426')
    text(sheet,(14,12),title,24)
    text(sheet,(14,49),NAMES[case['source']]+' / source pixels; decoded PTS shown',17,'#C7BFD5')
    records=[]
    for index,time in enumerate(times):
        bgr,info=decode(cap,float(time));records.append(info)
        image=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB))
        if crop:image=image.crop(crop)
        im=fit(image,(cell[0]-8,cell[1]-38))
        x,y=7+index%6*cell[0],92+index//6*cell[1]
        sheet.paste(im,(x,y));text(sheet,(x,y+cell[1]-33),f"{info['decoded_pts_seconds']:.3f}s",17)
    cap.release()
    name='lift-dense' if dense else case['key']
    sheet.save(OUT/'sheets'/f'{name}.jpg',quality=94)
    return {'sheet':f'sheets/{name}.jpg','crop_xyxy':crop,'samples':records}


def make_loop(case,path):
    if not case.get('loop'):return None
    crop=case.get('crop');filters=['fps=30']
    if crop:
        x,y,right,bottom=crop;filters.append(f'crop={right-x}:{bottom-y}:{x}:{y}')
    filters+=['scale=280:-1:flags=lanczos','split[a][b]']
    graph='[0:v]'+','.join(filters)+';[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3'
    target=OUT/'loops'/f"{case['key']}.gif"
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(case['start']),'-t',str(case['end']-case['start']),
                    '-i',str(path),'-filter_complex',graph,'-an','-loop','0',str(target)],check=True)
    return {'path':str(target.relative_to(OUT)),'sha256':digest(target),'bytes':target.stat().st_size,
            'nominal_preview_fps':30,'note':'Short silent excerpt, looped for study. GIF delays quantize time to centiseconds. Not an original project animation.'}


def mask(size,boxes):
    result=np.zeros(size,dtype=np.uint8)
    for x,y,right,bottom in boxes:result[y:bottom,x:right]=255
    return result


def tracked(a,b,region):
    pts=cv2.goodFeaturesToTrack(a,maxCorners=500,qualityLevel=.012,minDistance=5,mask=region)
    if pts is None:return np.empty((0,2)),np.empty((0,2))
    nxt,status,_=cv2.calcOpticalFlowPyrLK(a,b,pts,None,winSize=(31,31),maxLevel=4,
        criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,40,.01))
    if nxt is None:return np.empty((0,2)),np.empty((0,2))
    back,back_status,_=cv2.calcOpticalFlowPyrLK(b,a,nxt,None,winSize=(31,31),maxLevel=4)
    if back is None:return np.empty((0,2)),np.empty((0,2))
    p=pts.reshape(-1,2);q=nxt.reshape(-1,2);r=back.reshape(-1,2)
    valid=(status.ravel()==1)&(back_status.ravel()==1)&(np.linalg.norm(p-r,axis=1)<1.0)
    return p[valid],q[valid]


def region_comparison(key,path,times,anchor_boxes,regions):
    cap=cv2.VideoCapture(str(path));first,one=decode(cap,times[0]);second,two=decode(cap,times[1]);cap.release()
    a,b=[cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY) for frame in [first,second]]
    p,q=tracked(a,b,mask(a.shape,anchor_boxes))
    record={'key':key,'times':[one,two],'anchor_boxes_xyxy':anchor_boxes,'anchor_tracks':len(p),'regions':{}}
    if len(p)<6:
        record['status']='not enough stable anchor tracks';return record
    matrix,inliers=cv2.estimateAffinePartial2D(p,q,method=cv2.RANSAC,ransacReprojThreshold=1.25,maxIters=3000)
    if matrix is None:
        record['status']='registration failed';return record
    record.update({'status':'estimated shared anchor-layer transform','matrix':matrix.tolist(),
                   'anchor_inliers':int(inliers.sum()),'anchor_inlier_fraction':round(float(inliers.mean()),4)})
    for label,boxes in [('anchor',anchor_boxes)]+list(regions.items()):
        x,y=tracked(a,b,mask(a.shape,boxes))
        if len(x):
            expected=x@matrix[:,:2].T+matrix[:,2]
            residual=np.linalg.norm(y-expected,axis=1)
            record['regions'][label]={'boxes_xyxy':boxes,'tracks':len(x),
                'median_residual_pixels':round(float(np.median(residual)),4),
                'p90_residual_pixels':round(float(np.quantile(residual,.9)),4),
                'median_residual_percent_frame_width':round(float(np.median(residual)/a.shape[1]*100),4)}
    # Overlay is only an analytical display. It does not modify production art.
    sheet=Image.new('RGB',(1560,650),'#171426')
    text(sheet,(20,12),key+' / regions used for motion registration',26)
    text(sheet,(20,54),'Green = anchor layer; amber = independently tested regions. Native coordinates in measurements.json.',17,'#C7BFD5')
    for index,bgr in enumerate([first,second]):
        image=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));d=ImageDraw.Draw(image)
        for box in anchor_boxes:d.rectangle(box,outline='#45F0C1',width=3)
        for boxes in regions.values():
            for box in boxes:d.rectangle(box,outline='#FFD761',width=3)
        im=fit(image,(730,510));x=25+index*780;sheet.paste(im,(x,100))
        text(sheet,(x,615),f"{[one,two][index]['decoded_pts_seconds']:.3f}s",18)
    sheet.save(OUT/'sheets'/f'{key}-regions.jpg',quality=94)
    return record


def lift_trace(path):
    cap=cv2.VideoCapture(str(path));points=[]
    for target in np.arange(.5,2.701,1/30):
        frame,info=decode(cap,float(target));hsv=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV)
        region=cv2.inRange(hsv,np.array([120,70,30]),np.array([145,255,220]))
        region[:200]=0;region[790:]=0;region[:,:65]=0;region[:,180:]=0
        count,labels,stats,centers=cv2.connectedComponentsWithStats(region)
        candidates=[n for n in range(1,count) if stats[n,cv2.CC_STAT_AREA]>180]
        if not candidates:continue
        component=max(candidates,key=lambda n:stats[n,cv2.CC_STAT_AREA])
        left,top,width,height,area=stats[component]
        x,y=left+width/2,top+height/2
        points.append({'pts_seconds':info['decoded_pts_seconds'],'disc_bbox_midpoint_xy':[round(float(x),3),round(float(y),3)],'mask_area':int(area)})
    cap.release()
    sheet=Image.new('RGB',(1450,700),'#171426');d=ImageDraw.Draw(sheet)
    text(sheet,(25,16),'Lift timing / tracked purple left barbell disc',28)
    text(sheet,(25,60),'Native source position, not a quality score. Detector and all points are reproducible; inspect against the motion sheet.',17,'#C7BFD5')
    if points:
        min_t,max_t=points[0]['pts_seconds'],points[-1]['pts_seconds']
        xs=[p['disc_bbox_midpoint_xy'][1] for p in points];low,high=min(xs)-20,max(xs)+20
        def coord(p):return (100+(p['pts_seconds']-min_t)/(max_t-min_t)*1260,130+(p['disc_bbox_midpoint_xy'][1]-low)/(high-low)*450)
        for y in range(100,801,100):
            if low<=y<=high:
                line=130+(y-low)/(high-low)*450;d.line((100,line,1360,line),fill='#423A55');text(sheet,(30,line-10),str(y),16)
        for tick in np.arange(.5,2.71,.25):
            x=100+(tick-min_t)/(max_t-min_t)*1260;d.line((x,125,x,580),fill='#332D45');text(sheet,(x-16,595),f'{tick:.2f}s',16)
        d.line([coord(p) for p in points],fill='#66E6C1',width=4)
        for point in points:
            x,y=coord(point);d.ellipse((x-2,y-2,x+2,y+2),fill='#FFF0BF')
        text(sheet,(100,650),'Image Y increases downward: the upward stroke in the plot is the bar rising in the source.',18)
    sheet.save(OUT/'sheets/lift-timing.png')
    return {'method':'HSV mask H=120..145, S>=70,V=30..220 within x=65..179,y=200..789; largest component >180 pixels. Visible-component bounding-box midpoint (not mass centroid or physical units); upper ROI includes the whole raised disc and V ceiling excludes bright title fill.',
            'points':points,'plot':'sheets/lift-timing.png'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root',type=Path,default=Path('/workspace/attachments'))
    parser.add_argument('--skip-loops',action='store_true')
    args=parser.parse_args()
    for name in ['sheets','loops']: (OUT/name).mkdir(parents=True,exist_ok=True)
    TEMP.mkdir(parents=True,exist_ok=True)
    sources={}
    for key,name in NAMES.items():
        candidates=list(args.source_root.rglob(name))
        if len(candidates)!=1:raise RuntimeError(f'Expected exactly one uploaded {name}; found {len(candidates)} under {args.source_root}')
        sources[key]=candidates[0]
    frozen_paths=['assets/characters/static-test-01.png','assets/videos/approved-characters-20s.mp4']+[
        f'public/assets/artwork/approved-characters/{name}.png' for name in ['atlas','blinks','plaza','terrace']]
    frozen={path:digest(ROOT/path) for path in frozen_paths}
    source_rows=[]
    for key,path in sources.items():
        probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height,r_frame_rate,avg_frame_rate,start_time,duration','-of','json',str(path)]))
        source_rows.append({'id':key,'filename':path.name,'sha256':digest(path),'bytes':path.stat().st_size,'media':probe})
    studied=[]
    for case in CASES:
        row={**case,**make_sheet(case,sources[case['source']])}
        if not args.skip_loops:row['preview']=make_loop(case,sources[case['source']])
        elif case.get('loop') and (OUT/'loops'/f"{case['key']}.gif").exists():
            target=OUT/'loops'/f"{case['key']}.gif"
            row['preview']={'path':str(target.relative_to(OUT)),'sha256':digest(target),'bytes':target.stat().st_size,
                'nominal_preview_fps':30,'note':'Existing short silent study excerpt retained. GIF delays quantize time to centiseconds. Not an original project animation.'}
        studied.append(row);print('studied',case['key'],flush=True)
    dense=make_sheet(CASES[0],sources[6],dense=True)
    measurements=[
        region_comparison('presenter-held-background',sources[3],[.5,1.1],[[25,150,582,590]],{'actor':[[0,610,608,1079]]}),
        region_comparison('gym-held-background',sources[6],[1.323,1.823],[[0,430,65,610],[550,430,608,610]],{'actor':[[170,380,440,750]],'barbell':[[65,300,180,790]]}),
        region_comparison('surfer-sky-water',sources[7],[46.4,46.533333],[[0,0,608,250],[0,250,180,440],[440,250,608,440]],{'water':[[0,900,608,1080]],'actor_and_board':[[130,260,490,790]]}),
        region_comparison('approved-test-background',ROOT/'assets/videos/approved-characters-20s.mp4',[8.3,8.6],[[0,100,450,970],[1680,150,1920,970]],{'gesture_arm':[[980,450,1280,720]]}),
    ]
    trace=lift_trace(sources[6])
    assert all(digest(ROOT/path)==value for path,value in frozen.items()),'Approved art changed during study'
    manifest={'scope':'Dense visual study of selected ranges in all eight user-uploaded reference clips; not full long-form episode playback or access to studio project files.',
              'sources':source_rows,'cases':studied,'dense_lift':dense,
              'measurement_method':'Forward/backward checked Lucas-Kanade feature tracks, RANSAC similarity registration to selected anchor-layer features. Residuals distinguish regional motion from a shared transform, not image quality. An anchor layer need not be a physical camera.',
              'measurements':measurements,'barbell_trace':trace,
              'approved_visual_lock':{'status':'User passed the drawings; only motion/narration study authorized here. All listed files unchanged.','files':frozen},
              'limits':['Native source frames were decoded and selected dense intervals inspected; no claim of having watched blocked full episodes.',
                        'Uploaded sources are compressed, portrait reference files. Their edit rate does not prescribe long-form pacing.',
                        'Source footage does not identify a particular private rig, plugin, 2D/3D scene file, or animation software.',
                        'The silent loops cannot establish narration performance or sound-effects choices.'],
              'tool_versions':{'opencv':cv2.__version__,'numpy':np.__version__}}
    (OUT/'measurements.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (OUT/'visual-lock.json').write_text(json.dumps(manifest['approved_visual_lock'],indent=2)+'\n')
    print(json.dumps(measurements,indent=2))


if __name__=='__main__':main()
