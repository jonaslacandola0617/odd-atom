"""Inventory the entire selected collection before temporal analysis."""
from pathlib import Path
import argparse
import json
import os
from fractions import Fraction

from common import ROOT, digest, ffprobe, write_json

EXTENSIONS = {'.mp4', '.mov', '.mkv', '.webm', '.m4v', '.avi'}
PRIOR_NAMES = {
    'The Deadliest Thing in Your Kitchen.mp4', 'Your Brain on Magic Mushrooms.mp4',
    'The True Cost of War.mp4', 'Where Did the Antimatter Go_.mp4',
    'Could Humans Evolve Flight.mp4', 'Your Skeleton Is Electric.mp4',
    'Your Brain Peaked at Birth.mp4', 'Let’s Steal a New Moon.mp4',
}


def inventory(directory, source_kind):
    directory = Path(directory).resolve()
    paths = sorted(p for p in directory.rglob('*') if p.is_file() and p.suffix.lower() in EXTENSIONS)
    if source_kind == 'prior_uploads':
        paths = [p for p in paths if p.name in PRIOR_NAMES]
    if not paths:
        raise ValueError(f'No video files found in {directory}')
    rows = []
    for p in paths:
        meta = ffprobe(p)
        streams = [s for s in meta['streams'] if s['codec_type'] == 'video']
        if len(streams) != 1:
            raise ValueError(f'Expected exactly one video stream; inspect {p}')
        stream = streams[0]
        fingerprint = digest(p)
        prefix = 'prior' if source_kind == 'prior_uploads' else 'reference'
        row = {
            'video_id': f'{prefix}_{fingerprint[:12]}', 'title': p.stem,
            'source_kind': source_kind, 'is_requested_archive_content': source_kind == 'archive',
            'local_path': os.path.relpath(p, ROOT), 'source_sha256': fingerprint,
            'bytes': p.stat().st_size, 'container_duration_seconds': float(meta['format']['duration']),
            'width': stream['width'], 'height': stream['height'],
            'video_codec': stream['codec_name'],
            'aspect_ratio': str(Fraction(stream['width'], stream['height'])),
            'sample_aspect_ratio': stream.get('sample_aspect_ratio'),
            'display_aspect_ratio': stream.get('display_aspect_ratio'),
            'nominal_frame_rate': stream['r_frame_rate'],
            'average_frame_rate': stream.get('avg_frame_rate'),
            'video_time_base': stream.get('time_base'),
            'container_reported_frame_count': int(stream['nb_frames']) if stream.get('nb_frames', '').isdigit() else None,
            'decoded_frame_count': None, 'confirmed_shot_count': None,
            'audio_streams': [{k: s.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'channel_layout', 'duration']}
                              for s in meta['streams'] if s['codec_type'] == 'audio'],
            'temporal_analysis_status': 'not_started',
            'semantic_review_status': 'not_started',
            'scope_notice': 'Earlier uploaded short clip; not evidence of the unavailable Drive archive.' if source_kind == 'prior_uploads' else None,
        }
        rows.append(row)
        write_json(ROOT / 'analysis/video-reports' / row['video_id'] / 'ffprobe.json', meta)
        print(row['video_id'], p.name, flush=True)
    manifest = {'schema_version': 1, 'source_kind': source_kind,
                'collection_directory': os.path.relpath(directory, ROOT), 'videos': rows,
                'requested_archive_status': 'acquired' if source_kind == 'archive' else 'blocked',
                'scope_notice': 'No substitution: this inventory covers prior uploads only.' if source_kind == 'prior_uploads' else None}
    name = 'manifest.json' if source_kind == 'archive' else 'prior-uploads-manifest.json'
    write_json(ROOT / 'references' / name, manifest)
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--source-kind', choices=['archive', 'prior_uploads'], required=True)
    args = parser.parse_args()
    inventory(args.directory, args.source_kind)
