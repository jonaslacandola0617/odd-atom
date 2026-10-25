"""Shared read-only media analysis utilities."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent


def dependency_modules():
    # Reuse the project's existing, ignored analysis dependencies if available.
    cache = REPO / '.cache/motion-study'
    if cache.exists():
        sys.path.insert(0, str(cache))
    import cv2
    import numpy as np
    return cv2, np


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + '\n')
    temporary.replace(path)


def ffprobe(path, frames=False):
    args = ['ffprobe', '-v', 'error']
    if frames:
        args += ['-select_streams', 'v:0', '-show_frames', '-show_entries',
                 'frame=best_effort_timestamp_time,pts_time,pkt_duration_time,duration_time,key_frame,pict_type']
    else:
        args += ['-show_streams', '-show_format']
    args += ['-of', 'json', str(path)]
    return json.loads(subprocess.check_output(args))


def source_path(row):
    return (ROOT / row['local_path']).resolve()


def selected(manifest, ids):
    rows = manifest['videos']
    if ids:
        missing = set(ids) - {row['video_id'] for row in rows}
        if missing:
            raise ValueError(f'Unknown video IDs: {sorted(missing)}')
        rows = [row for row in rows if row['video_id'] in ids]
    return rows


def software_decoder(row):
    codec = row.get('video_codec')
    if not codec:
        meta = json.loads((ROOT / 'analysis/video-reports' / row['video_id'] / 'ffprobe.json').read_text())
        codec = next(s for s in meta['streams'] if s['codec_type'] == 'video')['codec_name']
    return ['-c:v', 'libdav1d'] if codec == 'av1' else []


def analysis_frames(row, width, height, proxy, log_path):
    """Single software decode: raw analysis frames plus a seekable H264 proxy.

    The proxy is a navigation/cache artifact. Native source frames remain the
    drawing-quality evidence and can be exported by exact source frame number.
    """
    _, np = dependency_modules()
    proxy.parent.mkdir(parents=True, exist_ok=True)
    pw = max(2, round(row['width'] * min(1, 512 / max(row['width'], row['height'])) / 2) * 2)
    ph = max(2, round(row['height'] * pw / row['width'] / 2) * 2)
    graph = f'[0:v:0]split[full][small];[small]scale={width}:{height},showinfo[analysis];[full]scale={pw}:{ph}[proxy]'
    args = ['ffmpeg', '-y', '-hide_banner', '-nostats', '-v', 'info', '-copyts',
            '-threads', '2', *software_decoder(row), '-i', str(source_path(row)),
            '-filter_complex_threads', '1', '-filter_complex', graph,
            '-map', '[analysis]', '-an', '-fps_mode', 'passthrough', '-pix_fmt', 'bgr24', '-f', 'rawvideo', 'pipe:1',
            '-map', '[proxy]', '-an', '-fps_mode', 'passthrough', '-c:v', 'libx264', '-threads', '1',
            '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(proxy)]
    size = width * height * 3
    with log_path.open('wb') as log:
        process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=log)
        try:
            while data := process.stdout.read(size):
                if len(data) != size:
                    raise RuntimeError('Truncated raw frame from FFmpeg')
                yield np.frombuffer(data, np.uint8).reshape(height, width, 3)
            if process.wait() != 0:
                raise RuntimeError('FFmpeg software decode failed: ' + log_path.read_text(errors='replace')[-2500:])
        finally:
            if process.poll() is None:
                process.terminate()
                process.wait()
            process.stdout.close()
