"""Caption completeness check: extract one frame per caption page (at its midpoint)
from an ENCODED episode and tile them for word-by-word review.
Usage: python3 scripts/caption_check.py <timeline.json> <video.mp4> <out_dir>
Must mirror the pager in the episode Overlay (26-char rows, <=3 rows per page)."""
import json,subprocess,sys,os
tl,video,out=sys.argv[1],sys.argv[2],sys.argv[3]
def rows(text):
    r=[];cur=''
    for w in text.split(' '):
        if len((cur+' '+w).strip())>26: r.append(cur.strip()); cur=w
        else: cur+=' '+w
    r.append(cur.strip()); return r
times=[];texts=[]
for l in json.load(open(tl))['lines']:
    rs=rows(l['text']); n=-(-len(rs)//3); per=-(-len(rs)//n)
    pages=[rs[i:i+per] for i in range(0,len(rs),per)]
    tot=sum(len(' '.join(p)) for p in pages); acc=0
    for p in pages:
        a=l['start']+acc/tot*(l['end']-l['start']); acc+=len(' '.join(p)); b=l['start']+acc/tot*(l['end']-l['start'])
        times.append((a+b)/2); texts.append(' / '.join(p))
os.makedirs(out,exist_ok=True)
for i,t in enumerate(times):
    subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{t:.3f}','-i',video,'-frames:v','1','-vf','crop=1080:330:0:1180,scale=540:-1',f'{out}/c{i:02d}.png'],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',f'{out}/c%02d.png','-vf',f'tile=2x{-(-len(times)//2)}','-frames:v','1',out+'.png'],check=True)
for i,x in enumerate(texts): print(i,f'{times[i]:.2f}',x)
