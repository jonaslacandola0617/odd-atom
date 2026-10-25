"""Track an analyst-selected feature region; never auto-identify a character.

The stable object ID is supplied by the analyst. Image-space position can include
camera/layer motion; this tool cannot identify rig pivots or hidden geometry.
"""
from pathlib import Path
import argparse
import csv
import gzip
import json
import math

from common import ROOT, dependency_modules, digest, source_path, write_json

cv2, np = dependency_modules()
cv2.setNumThreads(1)


def track(manifest, video_id, object_id, start, end, roi):
    row = next(v for v in manifest['videos'] if v['video_id'] == video_id)
    if digest(source_path(row)) != row['source_sha256']:
        raise ValueError('Source hash mismatch')
    if object_id != Path(object_id).name or not object_id.replace('-', '').replace('_', '').isalnum():
        raise ValueError('Use a stable alphanumeric object ID with hyphens/underscores')
    x, y, right, bottom = roi
    if not (0 <= x < right <= 1 and 0 <= y < bottom <= 1):
        raise ValueError('ROI must be normalized x,y,right,bottom in [0,1]')
    with gzip.open(ROOT / 'analysis/video-reports' / video_id / 'frame-index.jsonl.gz', 'rt') as stream:
        index = [json.loads(line) for line in stream]
    if not (0 <= start < end <= len(index)):
        raise ValueError('Invalid frame range')
    proxy = ROOT / 'references/extracted' / f"{video_id}-proxy.mp4"
    tracking_source = proxy if proxy.exists() else source_path(row)
    cap = cv2.VideoCapture(str(tracking_source))
    cap.set(cv2.CAP_PROP_POS_FRAMES, start)
    okay, image = cap.read()
    if not okay or round(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1 != start:
        raise ValueError('Frame-address seek mismatch')
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    native_scale = np.array([row['width'] / width, row['height'] / height])
    mask = np.zeros_like(gray)
    mask[round(y * height):round(bottom * height), round(x * width):round(right * width)] = 255
    points = cv2.goodFeaturesToTrack(gray, mask=mask, maxCorners=100, qualityLevel=.01, minDistance=4)
    if points is None or len(points) < 5:
        raise ValueError('Insufficient trackable features in chosen region; choose a better anchor')
    ids = np.arange(len(points))
    originals = points.reshape(-1, 2).copy()
    start_count = len(points)
    measurements = []
    stopped_reason = None
    previous_speed = None
    previous_position = np.array([(x + right) / 2 * width, (y + bottom) / 2 * height])
    center = previous_position.copy()
    for f in range(start, end):
        if f > start:
            okay, image = cap.read()
            if not okay:
                stopped_reason = 'decode_failure'
                break
            nxt_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            nxt, valid, _ = cv2.calcOpticalFlowPyrLK(gray, nxt_gray, points, None, winSize=(25, 25), maxLevel=4)
            if nxt is None:
                stopped_reason = 'tracking_lost'
                break
            back, back_valid, _ = cv2.calcOpticalFlowPyrLK(nxt_gray, gray, nxt, None, winSize=(25, 25), maxLevel=4)
            if back is None:
                stopped_reason = 'tracking_lost'
                break
            good = ((valid.ravel() == 1) & (back_valid.ravel() == 1)
                    & (np.linalg.norm(points.reshape(-1, 2) - back.reshape(-1, 2), axis=1) < .8))
            ids, points = ids[good], nxt[good].reshape(-1, 1, 2)
            gray = nxt_gray
            if len(points) < max(5, math.ceil(start_count * .2)):
                stopped_reason = 'too_few_original_features_survive_no_identity_reacquisition_attempted'
                break
        displacement = np.median(points.reshape(-1, 2) - originals[ids], axis=0)
        position = (center + displacement) * native_scale
        if f == start:
            vx = vy = speed = acceleration = None
        else:
            dt = index[f]['pts_seconds'] - index[f - 1]['pts_seconds']
            velocity = (position - previous_position) / dt
            vx, vy = map(float, velocity)
            speed = float(np.linalg.norm(velocity))
            acceleration = (speed - previous_speed) / dt if previous_speed is not None else None
        measurements.append({'frame_index': f, 'pts_seconds': index[f]['pts_seconds'],
                             'tracked_region_center_x': float(position[0]), 'tracked_region_center_y': float(position[1]),
                             'velocity_x_pixels_per_second': vx, 'velocity_y_pixels_per_second': vy,
                             'speed_pixels_per_second': speed, 'tangential_acceleration_pixels_per_second_squared': acceleration,
                             'surviving_features': len(points), 'initial_feature_fraction': len(points) / start_count,
                             'feature_ids': ids.tolist(), 'feature_positions_xy': (points.reshape(-1, 2) * native_scale).round(4).tolist()})
        previous_position = position
        previous_speed = speed
    cap.release()
    directory = ROOT / 'analysis/motion-tracks' / video_id
    directory.mkdir(parents=True, exist_ok=True)
    record = {'video_id': video_id, 'object_id': object_id, 'source_sha256': row['source_sha256'],
              'requested_range': [start, end], 'completed_range': [start, start + len(measurements)],
              'roi_normalized_xyxy': roi, 'initial_feature_count': start_count,
              'method': 'Forward/backward-checked sparse LK; median displacement of surviving initial features. No features re-added.',
              'coordinate_system': 'Native image pixels, origin top-left, +x right, +y down.',
              'tracking_image_dimensions': [width, height], 'native_dimensions': [row['width'], row['height']],
              'tracking_input': 'H264 analysis proxy' if proxy.exists() else 'native source',
              'limitations': 'Image-space motion includes any camera/layer motion. ROI center is not a rig pivot. Deformation, occlusion and crossing objects can bias the surviving-feature set. Requires visual track verification.',
              'review_status': 'unverified_estimate', 'stopped_reason': stopped_reason, 'measurements': measurements}
    write_json(directory / f'{object_id}-{start}-{end}.json', record)
    columns = [k for k in measurements[0] if k not in ['feature_ids', 'feature_positions_xy']]
    with (directory / f'{object_id}-{start}-{end}.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=columns, extrasaction='ignore', lineterminator='\n')
        writer.writeheader()
        writer.writerows(measurements)
    return record


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--manifest', type=Path, default=ROOT / 'references/manifest.json')
    p.add_argument('--video', required=True)
    p.add_argument('--object-id', required=True)
    p.add_argument('--start-frame', required=True, type=int)
    p.add_argument('--end-frame', required=True, type=int)
    p.add_argument('--roi', nargs=4, type=float, required=True)
    a = p.parse_args()
    result = track(json.loads(a.manifest.read_text()), a.video, a.object_id, a.start_frame, a.end_frame, a.roi)
    print(a.object_id, 'completed', result['completed_range'], 'of', result['requested_range'], result['stopped_reason'])
