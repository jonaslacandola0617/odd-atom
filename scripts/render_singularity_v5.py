"""Remux the new audio onto the unchanged, already rendered Remotion picture."""
from pathlib import Path
import json,shutil,subprocess

R=Path(__file__).resolve().parents[1];T=json.loads((R/'src/data/singularity-narration.json').read_text());FRAMES=T['durationInFrames']+360;D=FRAMES/30
OLD=R/'assets/videos/singularity-v4';DEST=R/'assets/videos/singularity-v5';MIX=R/'public/assets/audio/singularity-v5/final-mix.m4a'
DEST.mkdir(parents=True,exist_ok=True);(DEST/'chapters').mkdir(exist_ok=True)
def run(args):subprocess.run(['ffmpeg','-y','-v','error',*map(str,args)],check=True)
def inspect(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,avg_frame_rate,width,height','-of','json',str(p)]))['streams'][0]
source=OLD/'singularity-final-mix.mp4';v=inspect(source)
assert int(v['nb_frames'])==FRAMES and v['avg_frame_rate']=='30/1' and (v['width'],v['height'])==(1920,1080)
assert MIX.exists()
movie=DEST/'singularity-music-forward.mp4'
run(['-i',source,'-i',MIX,'-map','0:v:0','-map','1:a:0','-c','copy','-t',D,'-movflags','+faststart',movie])
assert int(inspect(movie)['nb_frames'])==FRAMES and movie.stat().st_size<100*1024*1024
for i,s in enumerate(T['scenes']):
    start=s['startFrame'];end=T['scenes'][i+1]['startFrame'] if i<4 else FRAMES
    old=OLD/'chapters'/f'singularity-final-mix-part-{i+1}.mp4';new=DEST/'chapters'/f'singularity-music-forward-part-{i+1}.mp4'
    run(['-i',old,'-ss',start/30,'-i',MIX,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',(end-start)/30,'-movflags','+faststart',new])
    assert int(inspect(new)['nb_frames'])==end-start and new.stat().st_size<100*1024*1024
run(['-ss','0','-i',movie,'-t','60','-c:v','libx264','-crf','19','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',DEST/'music-preview-60s.mp4'])
shutil.copyfile(OLD/'ending-poster.png',DEST/'ending-poster.png');shutil.copyfile(OLD/'singularity-subtitles.srt',DEST/'singularity-subtitles.srt')
print('Saved final mix:',movie.stat().st_size,'bytes;',FRAMES,'unchanged picture frames.',flush=True)
