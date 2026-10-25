"""Audit source integrity, temporal coverage and truthful review status."""
from pathlib import Path
import argparse
import gzip
import json
import math

from common import ROOT, digest, source_path, write_json


def lines(path):
    with gzip.open(path, 'rt') as stream:
        return [json.loads(line) for line in stream]


def validate(manifest_path):
    manifest = json.loads(Path(manifest_path).read_text())
    results = []
    for row in manifest['videos']:
        directory = ROOT / 'analysis/video-reports' / row['video_id']
        index = lines(directory / 'frame-index.jsonl.gz')
        metrics = lines(directory / 'frame-metrics.jsonl.gz')
        features = lines(ROOT / 'analysis/motion-tracks' / f"{row['video_id']}-feature-pairs.jsonl.gz")
        report = json.loads((directory / 'report.json').read_text())
        timeline_path = ROOT / 'analysis/shot-timelines' / f"{row['video_id']}.json"
        timeline = json.loads(timeline_path.read_text())
        n = row['decoded_frame_count']
        assert digest(source_path(row)) == row['source_sha256']
        assert len(index) == len(metrics) == len(features) == n > 0
        assert all(a['frame_index'] == b['frame_index'] == i and a['pts_seconds'] == b['pts_seconds']
                   for i, (a, b) in enumerate(zip(index, metrics)))
        assert all(b['pts_seconds'] > a['pts_seconds'] for a, b in zip(index, index[1:]))
        assert all(r['duration_seconds'] > 0 for r in index)
        assert all(r['to_frame'] == i and r['from_frame'] == i - 1 for i, r in enumerate(features))
        shots = timeline['shots']
        assert shots[0]['start_frame'] == 0 and shots[-1]['end_frame'] == n
        assert all(a['end_frame'] == b['start_frame'] for a, b in zip(shots, shots[1:]))
        for shot in shots:
            assert shot['start_frame'] < shot['end_frame']
            assert shot['boundary_review_status'] == 'unreviewed_automated_proposal'
            assert shot['narrative_purpose'] is None and shot['semantic_annotation_status'] == 'not_started'
            assert all(shot['start_frame'] <= f['frame_index'] < shot['end_frame']
                       and index[f['frame_index']]['pts_seconds'] == f['pts_seconds'] for f in shot['evidence_frames'])
        if manifest['source_kind'] == 'prior_uploads':
            assert row['is_requested_archive_content'] is False
        artifacts = [directory / 'report.json', directory / 'frame-index.jsonl.gz',
                     directory / 'frame-metrics.jsonl.gz', timeline_path,
                     ROOT / 'analysis/motion-tracks' / f"{row['video_id']}-feature-pairs.jsonl.gz"]
        artifacts += [ROOT / p for p in report['storyboard_pages']]
        assert all(p.exists() for p in artifacts)
        # Upgrade the initial-run checkpoints with checked artifact hashes.
        checkpoint = json.loads((directory / 'checkpoint.json').read_text())
        checkpoint['artifacts'] = [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p)} for p in artifacts]
        write_json(directory / 'checkpoint.json', checkpoint)
        results.append({'video_id': row['video_id'], 'frames_audited': n,
                        'candidate_shots': len(shots), 'source_hash': 'unchanged',
                        'contiguous_full_timeline': True, 'review_status': 'automated_only'})
    result = {'status': 'passed', 'scope': manifest['source_kind'], 'videos': results,
              'total_decoded_frames_audited': sum(r['frames_audited'] for r in results),
              'semantic_review': 'not_completed', 'artistic_mastery': 'not_claimed',
              'requested_archive_analysis': 'not_started' if manifest['source_kind'] == 'prior_uploads' else 'automated_pass_only'}
    name='prior-uploads-pipeline-validation.json' if manifest['source_kind']=='prior_uploads' else 'pipeline-validation.json'
    write_json(ROOT / 'validation/quality-audits' / name, result)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, default=ROOT / 'references/manifest.json')
    args = parser.parse_args()
    validate(args.manifest)
