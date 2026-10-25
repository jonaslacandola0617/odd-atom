"""Export exact consecutive native frames and a playable motion interval."""
from pathlib import Path
import argparse
import gzip
import json
import subprocess
import re
from fractions import Fraction

from common import ROOT, digest, source_path, write_json, software_decoder


def export(manifest, video_id, start, end, name, stride=1):
    from PIL import Image, ImageDraw, ImageFont
    row = next(v for v in manifest['videos'] if v['video_id'] == video_id)
    if digest(source_path(row)) != row['source_sha256']:
        raise ValueError('Source hash mismatch')
    with gzip.open(ROOT / 'analysis/video-reports' / video_id / 'frame-index.jsonl.gz', 'rt') as stream:
        index = [json.loads(line) for line in stream]
    if not (0 <= start < end <= len(index)) or stride < 1 or end - start > 1800:
        raise ValueError('Invalid evidence interval; limit 1800 source frames per request')
    if name != Path(name).name or not name.replace('-', '').replace('_', '').isalnum():
        raise ValueError('Use a simple stable evidence name')
    directory = ROOT / 'analysis/keyframes' / video_id / name
    directory.mkdir(parents=True, exist_ok=True)
    frames = list(range(start, end, stride))
    # Seek to BEFORE the interval for speed, then select using exact integer
    # source PTS. The seek is only a decode optimization, not the frame address.
    time_base = Fraction(row['video_time_base'])
    start_pts = index[start].get('pts_integer', round(index[start]['pts_seconds'] / float(time_base)))
    end_pts = (index[end].get('pts_integer', round(index[end]['pts_seconds'] / float(time_base))) if end < len(index)
               else round((index[-1]['pts_seconds'] + index[-1]['duration_seconds']) / float(time_base)))
    seek_before = max(0, index[start]['pts_seconds'] - index[0]['pts_seconds'] - 1)
    source_args = ['-copyts', '-threads', '2', '-ss', str(seek_before),
                   *software_decoder(row), '-i', str(source_path(row)), '-map', '0:v:0', '-an']
    trim = f'trim=start_pts={start_pts}:end_pts={end_pts}'
    extraction = subprocess.run(['ffmpeg', '-y', '-hide_banner', '-v', 'info', *source_args,
                    '-vf', trim + f",select='not(mod(n,{stride}))',showinfo", '-fps_mode', 'passthrough',
                    '-frames:v', str(len(frames)), '-threads', '1', '-start_number', '0',
                    str(directory / 'frame-%06d.png')], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    decoded_pts = [int(m) for m in re.findall(r'\bn:\s*\d+\s+pts:\s*(-?\d+)', extraction.stderr.decode(errors='replace'))]
    expected_pts = [round(index[f]['pts_seconds'] / float(time_base)) for f in frames]
    if decoded_pts[:len(frames)] != expected_pts:
        raise ValueError('Native evidence source PTS mismatch')
    files = sorted(directory.glob('frame-*.png'))
    if len(files) != len(frames):
        raise ValueError('Extracted-frame count mismatch')
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    sheets = []
    thumbnail_height = min(340, round(230 * row['height'] / row['width']))
    card_height = thumbnail_height + 45
    for page in range((len(files) + 23) // 24):
        canvas = Image.new('RGB', (1440, 60 + card_height * 4), '#171c2d')
        draw = ImageDraw.Draw(canvas)
        draw.text((10, 12), f'{video_id} / {name} / stride={stride} / exact decoded frames; end exclusive', font=font, fill='white')
        for j, image_file in enumerate(files[page * 24:page * 24 + 24]):
            number = page * 24 + j
            image = Image.open(image_file).convert('RGB')
            image.thumbnail((230, thumbnail_height), Image.Resampling.LANCZOS)
            x, y = j % 6 * 240, 50 + j // 6 * card_height
            canvas.paste(image, (x + 4, y))
            f = frames[number]
            draw.text((x + 4, y + thumbnail_height + 5), f'f{f} / {index[f]["pts_seconds"]:.6f}s', font=font, fill='white')
        p = directory / f'consecutive-{page + 1:03}.jpg'
        canvas.save(p, quality=92)
        sheets.append(str(p.relative_to(ROOT)))
    clip = directory / 'motion-interval.mp4'
    # Retain native timestamps and actual frame cadence; no fps conversion filter.
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *source_args,
                    '-vf', trim + ',setpts=PTS-STARTPTS,scale=960:-2', '-frames:v', str(end-start),
                    '-fps_mode', 'vfr', '-an', '-c:v', 'libx264', '-crf', '18',
                    '-threads', '2', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(clip)], check=True)
    record = {'video_id': video_id, 'name': name, 'source_sha256': row['source_sha256'],
              'start_frame': start, 'end_frame': end, 'end_frame_exclusive': True,
              'source_start_pts': index[start]['pts_seconds'], 'sample_stride': stride,
              'sampled_frames': [{'frame_index': f, 'pts_seconds': index[f]['pts_seconds'],
                                  'png': str(p.relative_to(ROOT)), 'sha256': digest(p)}
                                 for f, p in zip(frames, files)],
              'sheets': sheets, 'silent_clip': str(clip.relative_to(ROOT)),
              'silent_clip_width': 960, 'native_pngs_are_full_source_resolution': True,
              'review_status': 'exported_not_yet_visually_reviewed',
              'source_notice': 'Reference excerpt, not an original project animation.'}
    write_json(directory / 'evidence.json', record)
    return record


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, default=ROOT / 'references/manifest.json')
    parser.add_argument('--video', required=True)
    parser.add_argument('--start-frame', required=True, type=int)
    parser.add_argument('--end-frame', required=True, type=int)
    parser.add_argument('--name', required=True)
    parser.add_argument('--stride', default=1, type=int)
    a = parser.parse_args()
    print(json.dumps(export(json.loads(a.manifest.read_text()), a.video, a.start_frame, a.end_frame, a.name, a.stride), indent=2))
