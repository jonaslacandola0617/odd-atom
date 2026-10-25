"""Export the planned native motion cases, two independent jobs at a time.

Names describe investigation targets, not findings. Evidence stays unreviewed
until its actual consecutive frames have been inspected and annotated.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import subprocess
import sys

from common import ROOT, REPO, write_json

CASES=[
    ('reference_fd02030ee890',2040,2160,'creator-reaction'),
    ('reference_fd02030ee890',7340,7460,'materials-arrival'),
    ('reference_46db30e386c9',90,114,'forest-layer-motion'),
    ('reference_46db30e386c9',13080,13200,'tree-conduit-flow'),
    ('reference_46db30e386c9',24960,25032,'cell-column-change'),
    ('reference_2e586456bc4d',27120,27240,'root-rock-change'),
    ('reference_2e586456bc4d',10140,10260,'leaf-section-reveal'),
    ('reference_3dab4435d188',46200,46260,'hillside-walk-cycle'),
    ('reference_3dab4435d188',54540,54660,'tablet-hand-interaction'),
    ('reference_3dab4435d188',24960,25080,'fire-circle-secondary-motion'),
    ('reference_9a02fcef71d3',12300,12420,'boat-reward-path'),
    ('reference_9a02fcef71d3',10260,10380,'room-object-change'),
    ('reference_9a02fcef71d3',28320,28440,'shared-route-reveal'),
    ('reference_9a02fcef71d3',53940,54060,'agent-group-staging'),
    ('reference_9a02fcef71d3',10530,10610,'room-strip-action'),
    ('reference_9a02fcef71d3',12660,12780,'boat-collision-and-turn'),
    ('reference_3dab4435d188',18600,18601,'farmer-design'),
    ('reference_9a02fcef71d3',16800,16801,'scientist-design'),
    ('reference_fd02030ee890',120,121,'bird-design'),
]


def export(case):
    video,start,end,name=case
    destination=ROOT/'analysis/keyframes'/video/name/'evidence.json'
    if destination.exists():
        import json
        evidence=json.loads(destination.read_text())
        if all((ROOT/f['png']).exists() for f in evidence['sampled_frames']):
            return name,'existing_native_frames'
    logs=REPO/'out/animation-mastery/case-exports'
    logs.mkdir(parents=True,exist_ok=True)
    with (logs/f'{name}.log').open('w') as log:
        p=subprocess.run([sys.executable,str(ROOT/'scripts/evidence.py'),'--video',video,
                          '--start-frame',str(start),'--end-frame',str(end),'--name',name],
                         cwd=REPO,stdout=log,stderr=subprocess.STDOUT)
    return name,'exported_unreviewed' if p.returncode==0 else 'failed_inspect_log'


if __name__=='__main__':
    write_json(ROOT/'analysis/case-plan.json',{'scope':'Actual requested archive',
        'status':'Investigation targets selected from whole-video navigation; conclusions require consecutive-frame inspection.',
        'cases':[{'video_id':v,'start_frame':a,'end_frame':b,'name':n,'frame_range_convention':'[start,end)'} for v,a,b,n in CASES]})
    with ThreadPoolExecutor(max_workers=2) as pool:
        for future in as_completed([pool.submit(export,case) for case in CASES]):
            print(*future.result(),flush=True)
