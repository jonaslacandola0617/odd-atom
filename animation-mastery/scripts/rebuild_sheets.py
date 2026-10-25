"""Rebuild navigation layouts from validated proxies; no source re-analysis."""
import gzip
import json
from common import ROOT, write_json
from analyze import storyboard

if __name__=='__main__':
    manifest=json.loads((ROOT/'references/manifest.json').read_text())
    for row in manifest['videos']:
        timeline_path=ROOT/'analysis/shot-timelines'/f"{row['video_id']}.json"
        timeline=json.loads(timeline_path.read_text())
        with gzip.open(ROOT/'analysis/video-reports'/row['video_id']/'frame-index.jsonl.gz','rt') as stream:
            index=[json.loads(line) for line in stream]
        directory=ROOT/'analysis/keyframes'/row['video_id']
        pages=storyboard(row,timeline['shots'],index,directory)
        report_path=ROOT/'analysis/video-reports'/row['video_id']/'report.json'
        report=json.loads(report_path.read_text());report['storyboard_pages']=pages
        write_json(report_path,report);write_json(timeline_path,timeline)
        print(row['video_id'],len(pages),'compact storyboard pages',flush=True)
