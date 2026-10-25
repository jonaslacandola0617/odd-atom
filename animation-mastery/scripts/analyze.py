"""Every-frame temporal pass with reviewable shot proposals, not semantic claims.

Absolute PTS comes from FFprobe. Image changes and sparse feature registration
come from consecutive decoded frames. An affine fit is NOT a camera diagnosis.
"""
from pathlib import Path
import argparse
import csv
from fractions import Fraction
import gzip
import json
import math
import sqlite3
import subprocess
import re
from concurrent.futures import ProcessPoolExecutor, as_completed

from common import ROOT, dependency_modules, digest, ffprobe, selected, source_path, write_json, analysis_frames

cv2, np = dependency_modules()
cv2.setNumThreads(1)
cv2.setRNGSeed(0)
VERSION = 3


def pair_metrics(previous, current):
    """All coordinates refer to the downscaled analysis image."""
    a = cv2.cvtColor(previous, cv2.COLOR_BGR2GRAY)
    b = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
    delta = cv2.absdiff(a, b)
    ha = cv2.calcHist([previous], [0, 1], None, [24, 16], [0, 256, 0, 256])
    hb = cv2.calcHist([current], [0, 1], None, [24, 16], [0, 256, 0, 256])
    cv2.normalize(ha, ha, norm_type=cv2.NORM_L1)
    cv2.normalize(hb, hb, norm_type=cv2.NORM_L1)
    metrics = {
        'mean_absolute_gray_difference': float(delta.mean()) / 255,
        'changed_pixel_fraction_over_16': float(np.mean(delta > 16)),
        'color_histogram_bhattacharyya': float(cv2.compareHist(ha, hb, cv2.HISTCMP_BHATTACHARYYA)),
        'gray_mean': float(b.mean()) / 255,
        'registered_feature_count': 0, 'affine': None, 'affine_inlier_fraction': None,
        'median_affine_residual_pixels': None,
    }
    points = cv2.goodFeaturesToTrack(a, maxCorners=100, qualityLevel=.02, minDistance=5)
    pairs = []
    if points is not None:
        nxt, valid, _ = cv2.calcOpticalFlowPyrLK(a, b, points, None, winSize=(19, 19), maxLevel=3)
        if nxt is not None:
            back, back_valid, _ = cv2.calcOpticalFlowPyrLK(b, a, nxt, None, winSize=(19, 19), maxLevel=3)
            if back is not None:
                p, q, r = points.reshape(-1, 2), nxt.reshape(-1, 2), back.reshape(-1, 2)
                mask = (valid.ravel() == 1) & (back_valid.ravel() == 1) & (np.linalg.norm(p - r, axis=1) < .8)
                p, q = p[mask], q[mask]
                metrics['registered_feature_count'] = int(len(p))
                pairs = np.concatenate([p, q], axis=1).round(4).tolist()
                if len(p) >= 6:
                    matrix, inliers = cv2.estimateAffinePartial2D(
                        p, q, method=cv2.RANSAC, ransacReprojThreshold=1.2, maxIters=1000)
                    if matrix is not None:
                        residual = np.linalg.norm(q - (p @ matrix[:, :2].T + matrix[:, 2]), axis=1)
                        metrics.update(affine=matrix.tolist(), affine_inlier_fraction=float(inliers.mean()),
                                       median_affine_residual_pixels=float(np.median(residual)))
    return metrics, pairs


def cut_candidates(metrics):
    """Conservative proposals; fast pans/reveals can be false positives."""
    out = []
    for i, row in enumerate(metrics):
        difference = row['mean_absolute_gray_difference']
        histogram = row['color_histogram_bhattacharyya']
        changed = row['changed_pixel_fraction_over_16']
        if (difference > .15 and changed > .55 and histogram > .18) or (difference > .28 and changed > .75):
            score = difference + histogram * .4
            if out and i - out[-1]['frame_index'] <= 2:
                if score > out[-1]['score']:
                    out[-1] = {'frame_index': i, 'score': score}
            else:
                out.append({'frame_index': i, 'score': score})
    return out


def storyboard(row, shots, index, directory):
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    cap = cv2.VideoCapture(str(ROOT / 'references/extracted' / f"{row['video_id']}-proxy.mp4"))
    output = []
    cell_width=480
    thumbnail_height=min(414,round(154*row['height']/row['width']))
    card_height=thumbnail_height+92
    # Every proposed shot gets start/middle/last evidence, spread over pages.
    for page in range(math.ceil(len(shots) / 8)):
        sheet = Image.new('RGB', (1920, 50+card_height*2), '#171c2d')
        draw = ImageDraw.Draw(sheet)
        draw.text((12, 12), row['title'] + ' — AUTOMATED SHOT PROPOSALS, NOT REVIEWED', fill='white', font=font)
        for k, shot in enumerate(shots[page * 8:page * 8 + 8]):
            x, y = (k % 4) * cell_width, 50 + (k // 4) * card_height
            start, end = shot['start_frame'], shot['end_frame']
            evidence = [start, (start + end - 1) // 2, end - 1]
            draw.text((x + 5, y), f"{shot['shot_id']} [{start},{end})", fill='#92e3cf', font=font)
            for col, f in enumerate(evidence):
                cap.set(cv2.CAP_PROP_POS_FRAMES, f)
                okay, frame = cap.read()
                actual = round(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1
                if not okay or actual != f:
                    raise RuntimeError(f'Frame-address seek mismatch: requested {f}, got {actual}')
                image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                image.thumbnail((154, thumbnail_height), Image.Resampling.LANCZOS)
                sheet.paste(image, (x + col * 158 + 4, y + 30))
                draw.text((x + col * 158 + 4, y + thumbnail_height+38), f'f{f}', fill='white', font=font)
                draw.text((x + col * 158 + 4, y + thumbnail_height+61), f"{index[f]['pts_seconds']:.3f}s", fill='white', font=font)
            shot['evidence_frames'] = [{'frame_index': f, 'pts_seconds': index[f]['pts_seconds'],
                                         'role': role, 'review_status': 'unreviewed'}
                                        for f, role in zip(evidence, ['first', 'middle', 'last'])]
        path = directory / f'storyboard-{page + 1:03}.jpg'
        sheet.save(path, quality=88)
        output.append(str(path.relative_to(ROOT)))
    cap.release()
    return output


def build_search_index(manifest):
    target = ROOT / 'references/extracted/reference-index.sqlite'
    target.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(target) as db:
        db.execute('CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT, collection TEXT, frames INTEGER, source_sha256 TEXT)')
        db.execute('CREATE TABLE IF NOT EXISTS shots (video_id TEXT, shot_id TEXT, start_frame INTEGER, end_frame INTEGER, start_pts REAL, end_pts REAL, review_status TEXT, json TEXT, PRIMARY KEY(video_id,shot_id))')
        db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(video_id, shot_id, content)')
        for row in manifest['videos']:
            file = ROOT / 'analysis/shot-timelines' / f"{row['video_id']}.json"
            db.execute('INSERT OR REPLACE INTO videos VALUES (?,?,?,?,?)',
                       [row['video_id'], row['title'], row['source_kind'], row['decoded_frame_count'], row['source_sha256']])
            db.execute('DELETE FROM shots WHERE video_id=?', [row['video_id']])
            db.execute('DELETE FROM search WHERE video_id=?', [row['video_id']])
            if file.exists():
                for shot in json.loads(file.read_text())['shots']:
                    content = json.dumps(shot, ensure_ascii=False)
                    db.execute('INSERT INTO shots VALUES (?,?,?,?,?,?,?,?)', [row['video_id'], shot['shot_id'],
                               shot['start_frame'], shot['end_frame'], shot['start_pts_seconds'],
                               shot['end_pts_seconds'], shot['boundary_review_status'], content])
                    db.execute('INSERT INTO search VALUES (?,?,?)', [row['video_id'], shot['shot_id'], row['title'] + ' ' + content])


def process(row, force=False):
    cv2.setRNGSeed(0)
    source = source_path(row)
    if digest(source) != row['source_sha256']:
        raise ValueError(f"Source changed: {row['video_id']}")
    report_dir = ROOT / 'analysis/video-reports' / row['video_id']
    checkpoint_file = report_dir / 'checkpoint.json'
    if checkpoint_file.exists() and not force:
        checkpoint = json.loads(checkpoint_file.read_text())
        artifacts = checkpoint.get('artifacts', [])
        if (checkpoint.get('pipeline_version') == VERSION and checkpoint.get('source_sha256') == row['source_sha256']
                and (ROOT/'references/extracted'/f"{row['video_id']}-proxy.mp4").exists()
                and artifacts and all((ROOT / item['path']).exists() and digest(ROOT / item['path']) == item['sha256'] for item in artifacts)):
            return checkpoint['manifest_updates']
    report_dir.mkdir(parents=True, exist_ok=True)
    # Packet timestamps can be demuxed without decoding the 1440p AV1 stream
    # twice. Every PTS is subsequently checked against decoded showinfo output.
    packet_data = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_packets',
        '-show_entries', 'packet=pts,duration,flags', '-of', 'json', str(source)]))['packets']
    if any(p.get('pts') is None for p in packet_data):
        raise ValueError('Missing packet PTS; use a full frame-index fallback for this source')
    timing = sorted(packet_data, key=lambda p: int(p['pts']))
    if not timing:
        raise ValueError('No decoded video frames')
    index = []
    for i, frame in enumerate(timing):
        timestamp = float(int(frame['pts']) * Fraction(row['video_time_base']))
        if timestamp is None:
            raise ValueError(f'Missing PTS at frame {i}; cannot substitute nominal fps')
        index.append({'frame_index': i, 'pts_seconds': float(timestamp),
                      'pts_integer': int(frame['pts']), 'time_base': row['video_time_base'],
                      'duration_seconds': float(int(frame.get('duration', 0)) * Fraction(row['video_time_base'])),
                      'key_frame': 'K' in frame.get('flags', ''), 'picture_type': None})
    if any(b['pts_seconds'] <= a['pts_seconds'] for a, b in zip(index, index[1:])):
        raise ValueError('Non-monotonic frame PTS requires manual handling')
    for i in range(len(index) - 1):
        index[i]['duration_seconds'] = index[i + 1]['pts_seconds'] - index[i]['pts_seconds']
    if index[-1]['duration_seconds'] <= 0:
        raise ValueError('Final frame has no duration; inspect before defining timeline end')
    with gzip.open(report_dir / 'frame-index.jsonl.gz', 'wt', encoding='utf-8') as stream:
        for entry in index:
            stream.write(json.dumps(entry) + '\n')
    scale = min(1, 256 / max(row['width'], row['height']))
    width, height = round(row['width'] * scale), round(row['height'] * scale)
    proxy = ROOT / 'references/extracted' / f"{row['video_id']}-proxy.mp4"
    proxy.parent.mkdir(parents=True, exist_ok=True)
    decode_log = proxy.with_suffix('.decode.log')
    previous = None
    metrics = []
    pairs_path = ROOT / 'analysis/motion-tracks' / f"{row['video_id']}-feature-pairs.jsonl.gz"
    pairs_path.parent.mkdir(parents=True, exist_ok=True)
    # Feature pairs are deliberately NOT named objects or claimed persistent rigs.
    with gzip.open(pairs_path, 'wt', encoding='utf-8') as output:
        for small in analysis_frames(row, width, height, proxy, decode_log):
            f = len(metrics)
            if previous is None:
                data = {'mean_absolute_gray_difference': 0., 'changed_pixel_fraction_over_16': 0.,
                        'color_histogram_bhattacharyya': 0., 'gray_mean': float(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).mean()) / 255,
                        'registered_feature_count': 0, 'affine': None, 'affine_inlier_fraction': None,
                        'median_affine_residual_pixels': None}
                pairs = []
            else:
                data, pairs = pair_metrics(previous, small)
            data['frame_index'] = f
            data['pts_seconds'] = index[f]['pts_seconds'] if f < len(index) else None
            metrics.append(data)
            output.write(json.dumps({'from_frame': f - 1, 'to_frame': f,
                                     'pairs_previous_xy_current_xy': pairs}, separators=(',', ':')) + '\n')
            previous = small
            if f and f % 600 == 0:
                print(row['video_id'], f, 'frames', flush=True)
    if len(metrics) != len(index):
        raise ValueError(f'Frame/packet disagreement: FFmpeg={len(metrics)}, FFprobe packets={len(index)}')
    decoded_timing = []
    pattern = re.compile(r'\bn:\s*(\d+)\s+pts:\s*(-?\d+).*?iskey:(\d+) type:(\w+)')
    for line in decode_log.read_text(errors='replace').splitlines():
        match = pattern.search(line)
        if match:
            decoded_timing.append((int(match[1]), int(match[2]), bool(int(match[3])), match[4]))
    assert len(decoded_timing) == len(index), 'Missing decoded showinfo timing'
    for f, (number, pts, keyframe, picture_type) in enumerate(decoded_timing):
        assert number == f and pts == index[f]['pts_integer'], 'Packet/display-order PTS disagreement'
        index[f].update(key_frame=keyframe, picture_type=picture_type)
    with gzip.open(report_dir / 'frame-index.jsonl.gz', 'wt', encoding='utf-8') as stream:
        for entry in index:
            stream.write(json.dumps(entry) + '\n')
    metrics_path = report_dir / 'frame-metrics.jsonl.gz'
    with gzip.open(metrics_path, 'wt', encoding='utf-8') as output:
        for entry in metrics:
            output.write(json.dumps(entry, separators=(',', ':'), allow_nan=False) + '\n')
    candidates = cut_candidates(metrics)
    boundaries = [0] + [c['frame_index'] for c in candidates if c['frame_index'] > 0] + [len(index)]
    end_pts = index[-1]['pts_seconds'] + index[-1]['duration_seconds']
    shots = []
    for i, (start, end) in enumerate(zip(boundaries, boundaries[1:])):
        shots.append({
            'video_id': row['video_id'], 'shot_id': f'proposal_{i + 1:03}',
            'start_frame': start, 'end_frame': end, 'end_frame_exclusive': True,
            'start_pts_seconds': index[start]['pts_seconds'],
            'end_pts_seconds': index[end]['pts_seconds'] if end < len(index) else end_pts,
            'nominal_fps': row['nominal_frame_rate'], 'variable_frame_rate_supported': True,
            'boundary_review_status': 'unreviewed_automated_proposal',
            'narrative_purpose': None, 'composition': None,
            'characters': [], 'objects': [], 'background_layers': [], 'motion_events': [],
            'camera_animation': [], 'transitions': [], 'visual_style_notes': [],
            'semantic_annotation_status': 'not_started',
            'evidence_frames': [],
            'automation_limits': 'No semantic elements identified. Common image transform is not necessarily camera motion. Cuts/reveals/pans and gradual transitions need visual review.',
        })
    story_dir = ROOT / 'analysis/keyframes' / row['video_id']
    story_dir.mkdir(parents=True, exist_ok=True)
    sheets = storyboard(row, shots, index, story_dir)
    write_json(ROOT / 'analysis/shot-timelines' / f"{row['video_id']}.json", {
        'video_id': row['video_id'], 'source_sha256': row['source_sha256'],
        'frame_range_convention': '[start_frame,end_frame), zero-based decoded display order',
        'coverage': 'All decoded frames; proposed boundaries are not a verified scene count.',
        'candidate_boundaries': candidates, 'shots': shots})
    update = {'decoded_frame_count': len(index), 'decoded_picture_end_seconds': end_pts,
              'candidate_shot_count': len(shots), 'confirmed_shot_count': None,
              'temporal_analysis_status': 'all_frames_measured_semantic_review_pending'}
    report = {
        'video_id': row['video_id'], 'source_sha256': row['source_sha256'],
        **update, 'analysis_dimensions': [width, height], 'opencv_version': cv2.__version__,
        'frame_index': str((report_dir / 'frame-index.jsonl.gz').relative_to(ROOT)),
        'decoder': 'FFmpeg software decoder (libdav1d for AV1), not OpenCV media decoding',
        'timestamp_verification': 'Every decoded showinfo integer PTS agrees with FFprobe packet PTS in display order; frame and packet counts agree.',
        'navigation_proxy': str(proxy.relative_to(ROOT)),
        'frame_metrics': str(metrics_path.relative_to(ROOT)),
        'feature_pairs': str(pairs_path.relative_to(ROOT)),
        'storyboard_pages': sheets,
        'audio_status': 'Stream metadata inventoried. No direct audition, source separation or semantic audio timing analysis.',
        'semantic_status': 'Human/visual interpretation not completed. These statistics do not establish drawing or animation mastery.',
        'motion_estimation': 'Consecutive-frame sparse LK tracking with forward/backward check; RANSAC partial affine. Normalized source-image motion, not camera identification.',
        'duration_stats_seconds': {'median': float(np.median([b['duration_seconds'] for b in index])),
                                   'minimum': min(b['duration_seconds'] for b in index),
                                   'maximum': max(b['duration_seconds'] for b in index)},
    }
    write_json(report_dir / 'report.json', report)
    artifacts = [report_dir / 'report.json', report_dir / 'frame-index.jsonl.gz', metrics_path,
                 pairs_path, ROOT / 'analysis/shot-timelines' / f"{row['video_id']}.json"]
    artifacts += [ROOT / sheet for sheet in sheets]
    write_json(checkpoint_file, {'pipeline_version': VERSION, 'source_sha256': row['source_sha256'], 'manifest_updates': update,
                                'artifacts': [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p)} for p in artifacts]})
    print(row['video_id'], 'COMPLETE AUTOMATED PASS', len(index), 'frames;', len(shots), 'unreviewed shot proposals', flush=True)
    return update


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, default=ROOT / 'references/manifest.json')
    parser.add_argument('--video', action='append')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--jobs', type=int, default=1, choices=[1, 2, 3])
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    if manifest.get('source_kind') == 'archive' and manifest.get('requested_archive_status') != 'acquired':
        raise ValueError('Requested archive is not acquired; cannot claim an archive analysis')
    rows = sorted(selected(manifest, args.video), key=lambda row: row['container_duration_seconds'])
    if args.jobs == 1:
        for row in rows:
            row.update(process(row, args.force))
            # Checkpoint after every video; only the parent writes the manifest.
            write_json(args.manifest, manifest)
    else:
        with ProcessPoolExecutor(max_workers=args.jobs) as pool:
            futures = {pool.submit(process, row, args.force): row for row in rows}
            for future in as_completed(futures):
                futures[future].update(future.result())
                write_json(args.manifest, manifest)
    build_search_index(manifest)


if __name__ == '__main__':
    main()
