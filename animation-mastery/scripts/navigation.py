"""Whole-video navigation sheets; explicitly not a completed temporal study."""
from pathlib import Path
import argparse
import json
import math
import subprocess
import re
import io
from fractions import Fraction

from common import ROOT, dependency_modules, selected, source_path, write_json, software_decoder

cv2, np = dependency_modules()
cv2.setNumThreads(1)


def navigation(row, interval):
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    proxy = ROOT / 'references/extracted' / f"{row['video_id']}-proxy.mp4"
    cap = cv2.VideoCapture(str(proxy)) if proxy.exists() and (ROOT / 'analysis/video-reports' / row['video_id'] / 'checkpoint.json').exists() else None
    if cap is not None and not cap.isOpened():
        cap.release()
        cap = None
    packets = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                    '-show_packets', '-show_entries', 'packet=pts', '-of', 'json', str(source_path(row))]))['packets']
    source_pts = sorted(int(p['pts']) for p in packets)
    frame_by_pts = {pts: f for f, pts in enumerate(source_pts)}
    source_times = [float(pts * Fraction(row['video_time_base'])) for pts in source_pts]
    times = np.arange(0, row['container_duration_seconds'], interval)
    directory = ROOT / 'analysis/keyframes' / row['video_id'] / 'navigation'
    directory.mkdir(parents=True, exist_ok=True)
    samples = []
    pages = []
    for page in range(math.ceil(len(times) / 40)):
        sheet = Image.new('RGB', (1600, 1810), '#171c2d')
        draw = ImageDraw.Draw(sheet)
        draw.text((10, 10), row['title'], font=font, fill='white')
        draw.text((10, 33), f'Navigation only / {interval:g}s requested spacing / actual decoded frame numbers / page {page + 1}', font=font, fill='#92e3cf')
        for j, time in enumerate(times[page * 40:page * 40 + 40]):
            if cap is not None:
                frame = min(len(source_times) - 1, int(np.searchsorted(source_times, time)))
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame)
                okay, image = cap.read()
                if not okay or round(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1 != frame:
                    raise ValueError('Proxy seek mismatch')
                pts = source_times[frame]
                im = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                result = subprocess.run(['ffmpeg', '-hide_banner', '-v', 'info', '-copyts', '-threads', '2',
                    '-ss', str(float(time)), *software_decoder(row), '-i', str(source_path(row)),
                    '-map', '0:v:0', '-an', '-frames:v', '1', '-vf', 'showinfo,scale=640:-2',
                    '-c:v', 'png', '-threads', '1', '-f', 'image2pipe', '-'],
                    check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                match = re.search(r'\bn:\s*0\s+pts:\s*(-?\d+)', result.stderr.decode(errors='replace'))
                if match is None or int(match[1]) not in frame_by_pts:
                    raise ValueError('Cannot resolve sampled source frame PTS')
                frame = frame_by_pts[int(match[1])]
                pts = source_times[frame]
                im = Image.open(io.BytesIO(result.stdout)).convert('RGB')
            im.thumbnail((316, 177), Image.Resampling.LANCZOS)
            x, y = j % 5 * 320, 65 + j // 5 * 217
            sheet.paste(im, (x + 2, y))
            draw.text((x + 4, y + 181), f'{pts:.3f}s / f{frame}', font=font, fill='white')
            samples.append({'requested_seconds': float(time), 'decoded_frame_index': frame,
                            'opencv_decoded_pts_seconds': pts, 'page': page + 1,
                            'review_status': 'navigation_sample_not_yet_annotated'})
        path = directory / f'navigation-{page + 1:03}.jpg'
        sheet.save(path, quality=92)
        pages.append(str(path.relative_to(ROOT)))
        print(row['video_id'], 'navigation page', page + 1, flush=True)
    if cap is not None:
        cap.release()
    record = {'video_id': row['video_id'], 'source_sha256': row['source_sha256'],
              'purpose': 'Whole-duration navigation before detailed per-shot temporal review; not evidence that intermediate motion has been reviewed.',
              'requested_interval_seconds': interval, 'pages': pages, 'samples': samples}
    write_json(directory / 'navigation.json', record)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, default=ROOT / 'references/manifest.json')
    parser.add_argument('--video', action='append')
    parser.add_argument('--interval', type=float, default=10)
    a = parser.parse_args()
    if a.interval <= 0:
        parser.error('Interval must be positive')
    for row in selected(json.loads(a.manifest.read_text()), a.video):
        navigation(row, a.interval)
