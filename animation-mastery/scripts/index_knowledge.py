"""Rebuild searchable inventory, proposals, reviewed cases, guides and coarse ASR."""
import json
import sqlite3
from common import ROOT
from analyze import build_search_index

if __name__=='__main__':
    manifest=json.loads((ROOT/'references/manifest.json').read_text())
    build_search_index(manifest)
    database=ROOT/'references/extracted/reference-index.sqlite'
    with sqlite3.connect(database) as db:
        db.execute("DELETE FROM search WHERE shot_id LIKE 'case_%' OR shot_id LIKE 'guide:%' OR shot_id LIKE 'asr:%' OR shot_id LIKE 'navigation:%'")
        count=0
        for p in sorted((ROOT/'analysis/reviewed-cases').glob('*.json')):
            if p.name=='index.json':continue
            r=json.loads(p.read_text());db.execute('INSERT INTO search VALUES (?,?,?)',[r['video_id'],r['shot_id'],json.dumps(r,ensure_ascii=False)]);count+=1
        for p in sorted((ROOT/'knowledge').glob('*.md')):
            db.execute('INSERT INTO search VALUES (?,?,?)',['knowledge','guide:'+p.stem,p.read_text()]);count+=1
        nav=json.loads((ROOT/'analysis/storyboard-navigation-review.json').read_text())
        for video in nav['videos']:
            for page in video['pages']:
                db.execute('INSERT INTO search VALUES (?,?,?)',[video['video_id'],'navigation:'+str(page['page']),json.dumps(page,ensure_ascii=False)]);count+=1
        for r in manifest['videos']:
            p=ROOT/'analysis/video-reports'/r['video_id']/'transcript-asr.json'
            if p.exists():
                for chunk in json.loads(p.read_text())['chunks']:
                    value={'status':'UNVERIFIED coarse ASR; not exact word alignment or a factual endorsement',**chunk}
                    db.execute('INSERT INTO search VALUES (?,?,?)',[r['video_id'],'asr:'+str(chunk['index']),json.dumps(value,ensure_ascii=False)]);count+=1
    print(f'Indexed{count} knowledge/case/navigation/ASR entries in addition to video/proposal inventory.')
