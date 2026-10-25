"""Search the regenerable SQLite index, or inspect an exact frame."""
import argparse
import gzip
import json
import sqlite3

from common import ROOT


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--query', help='SQLite FTS5 expression, e.g. "Skeleton"')
    parser.add_argument('--video')
    parser.add_argument('--frame', type=int)
    parser.add_argument('--full', action='store_true', help='Return complete matching records instead of short evidence snippets')
    parser.add_argument('--limit', type=int, default=12)
    a = parser.parse_args()
    if a.video is not None and a.frame is not None:
        for name in ['frame-index', 'frame-metrics']:
            with gzip.open(ROOT / 'analysis/video-reports' / a.video / f'{name}.jsonl.gz', 'rt') as stream:
                for line in stream:
                    row = json.loads(line)
                    if row['frame_index'] == a.frame:
                        print(json.dumps({name: row}, indent=2))
                        break
                else:
                    raise SystemExit(f'Frame {a.frame} is out of range')
    elif a.query:
        if not 1<=a.limit<=100:parser.error('--limit must be1–100')
        with sqlite3.connect(ROOT / 'references/extracted/reference-index.sqlite') as db:
            db.row_factory = sqlite3.Row
            value='content' if a.full else "snippet(search,2,'[',']',' … ',36) AS excerpt"
            rows = db.execute(f'SELECT video_id,shot_id,{value} FROM search WHERE search MATCH ? LIMIT ?', [a.query,a.limit]).fetchall()
            for row in rows:
                print(json.dumps(dict(row), ensure_ascii=False))
    else:
        parser.error('Supply --query or both --video and --frame')
