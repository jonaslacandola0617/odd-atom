"""Extract source evidence for motion-led scene handoffs, without editing a film.

Uses the eight user-uploaded references. GIFs are short, silent source excerpts,
not original channel animations. Requires references/requirements-motion.txt.
"""
from pathlib import Path
import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.cache/motion-study'))
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = ROOT / 'references/studies/transitions-2026-10-25'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
NAMES = {
    1: 'The Deadliest Thing in Your Kitchen.mp4',
    2: 'Your Brain on Magic Mushrooms.mp4',
    3: 'The True Cost of War.mp4',
    4: 'Where Did the Antimatter Go_.mp4',
    5: 'Could Humans Evolve Flight.mp4',
    6: 'Your Skeleton Is Electric.mp4',
    7: 'Your Brain Peaked at Birth.mp4',
    8: 'Let’s Steal a New Moon.mp4',
}


def sha(path):
    return hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()


def label(im, pos, value, size=16, color='#FFF4E3'):
    ImageDraw.Draw(im).text(pos, value, font=ImageFont.truetype(FONT, size), fill=color)


def decode(cap, time=None):
    if time is not None:
        cap.set(cv2.CAP_PROP_POS_MSEC, time * 1000)
    ok, bgr = cap.read()
    if not ok:
        raise RuntimeError(f'Failed decoding at {time}')
    info = {'requested_seconds': time,
            'decoded_pts_seconds': round(cap.get(cv2.CAP_PROP_POS_MSEC) / 1000, 6),
            'decoded_frame_index': round(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1}
    return Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)), info


def sheet(case, path, dense=False):
    cap = cv2.VideoCapture(str(path))
    cw, ch, cols = (164, 318, 8)
    count = case['count'] if dense else 16
    canvas = Image.new('RGB', (cw * cols, 80 + ch * int(np.ceil(count / cols))), '#111526')
    label(canvas, (12, 10), case['title'], 20)
    label(canvas, (12, 42), path.name + (' / consecutive decoded frames' if dense else ' / sampled source PTS'), 15, '#BDBDD9')
    if dense:
        cap.set(cv2.CAP_PROP_POS_MSEC, case['start'] * 1000)
    times = [None] * count if dense else np.linspace(case['start'], case['end'], count)
    samples = []
    for i, time in enumerate(times):
        im, info = decode(cap, None if time is None else float(time))
        samples.append(info)
        im.thumbnail((cw - 4, ch - 25), Image.Resampling.LANCZOS)
        x, y = i % cols * cw, 80 + i // cols * ch
        canvas.paste(im, (x, y))
        label(canvas, (x + 3, y + ch - 23), f"{info['decoded_pts_seconds']:.3f}s", 15)
    cap.release()
    if dense:
        indices = [s['decoded_frame_index'] for s in samples]
        assert all(b - a == 1 for a, b in zip(indices, indices[1:])), indices
    relative = 'sheets/' + case['key'] + '.jpg'
    canvas.save(OUT / relative, quality=92)
    return {'sheet': relative, 'samples': samples, 'consecutive': dense}


def loop(case, path, width=240):
    relative = 'loops/' + case['key'] + '.gif'
    target = OUT / relative
    graph = (f'[0:v]fps=25,scale={width}:-1:flags=lanczos,split[a][b];'
             '[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(case['start']), '-t',
                    str(case['end'] - case['start']), '-i', str(path), '-filter_complex',
                    graph, '-an', '-loop', '0', str(target)], check=True)
    return {'file': relative, 'sha256': sha(target), 'bytes': target.stat().st_size,
            'preview_fps': 25, 'silent': True,
            'note': 'User-provided reference excerpt. Loop restart is artificial. 25 fps preview; source PTS and dense sheets retain native timing.'}


def survey(source, path):
    cap = cv2.VideoCapture(str(path))
    times = np.arange(.1, source['duration_seconds'] - .1, 1.5)
    cw, ch, cols = 126, 242, 12
    canvas = Image.new('RGB', (cw * cols, 60 + int(np.ceil(len(times) / cols)) * ch), '#111526')
    label(canvas, (12, 10), path.name, 16)
    samples = []
    for i, time in enumerate(times):
        im, info = decode(cap, float(time))
        samples.append(info)
        im.thumbnail((cw - 4, ch - 25), Image.Resampling.LANCZOS)
        x, y = i % cols * cw, 60 + i // cols * ch
        canvas.paste(im, (x, y))
        label(canvas, (x + 3, y + ch - 23), f"{info['decoded_pts_seconds']:.3f}s", 14)
    cap.release()
    relative = f"survey/{source['id']:02d}.jpg"
    canvas.save(OUT / relative, quality=88)
    return {'file': relative, 'samples': samples, 'interval_seconds': 1.5}


def audit_film():
    source_path = ROOT / 'src/Singularity.tsx'
    text = source_path.read_text()
    # This audits the rejected cut, not an assumed implementation in later cuts.
    assert 'const opacity=sectionStart>0?at(frame,sectionStart,sectionStart+11):1;' in text
    assert '<Stage frame={sectionStart-1}' in text and 'opacity={1-opacity}' in text
    beats = json.loads((ROOT / 'src/data/singularity-narration.json').read_text())['visualBeats']
    sections = re.findall(r"\{from:(\d+),to:(\d+),kind:'(\w+)'\}", text)
    joins = []
    for previous, incoming in zip(sections, sections[1:]):
        frame = beats[int(incoming[0]) - 1]['startFrame']
        joins.append({'from': previous[2], 'to': incoming[2], 'start_frame': frame,
                      'seconds': round(frame / 30, 6), 'ramp_intervals': 11,
                      'ramp_seconds': round(11 / 30, 6), 'previous_stage_frame': frame - 1,
                      'outgoing_animation': 'frozen', 'method': 'whole-composition opacity overlap'})
    path = ROOT / 'assets/videos/singularity/singularity-full-8m56.mp4'
    with (OUT / 'singularity-joins.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(joins[0]), lineterminator='\n')
        writer.writeheader(); writer.writerows(joins)
    own_cases = [
        {'key': 'our-opening-star', 'start': 5.93, 'end': 6.58, 'title': 'Rejected cut: galaxies dissolve over frozen outgoing stage', 'source': 'our-film'},
        {'key': 'our-observatory-gravity', 'start': 113.6, 'end': 114.24, 'title': 'Rejected cut: room dissolves into unrelated grid composition', 'source': 'our-film'},
    ]
    examples = []
    for case in own_cases:
        # Landscape source gets landscape cells rather than the portrait layout.
        cap = cv2.VideoCapture(str(path)); canvas = Image.new('RGB', (1280, 610), '#111526')
        label(canvas, (12, 10), case['title'], 20); samples = []
        for i, time in enumerate(np.linspace(case['start'], case['end'], 12)):
            im, info = decode(cap, float(time)); samples.append(info)
            im.thumbnail((316, 178), Image.Resampling.LANCZOS)
            x, y = i % 4 * 320, 60 + i // 4 * 182
            canvas.paste(im, (x, y)); label(canvas, (x + 4, y + 154), f"{info['decoded_pts_seconds']:.3f}s", 15)
        cap.release(); relative = 'sheets/' + case['key'] + '.jpg'; canvas.save(OUT / relative, quality=92)
        examples.append({**case, 'sheet': relative, 'samples': samples, 'preview': loop(case, path, 480)})
    return {'film': str(path.relative_to(ROOT)), 'film_sha256': sha(path),
            'source_sha256': sha(source_path), 'source_lines_at_review': [256, 264],
            'major_section_boundaries': len(joins), 'all_same_dissolve': True,
            'outgoing_stage_time_frozen_at_all_major_joins': True,
            'classification': 'Implementation audit, not an automatic quality score. Internal beat changes are separate.',
            'joins': joins, 'examples': examples}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, default=Path('/workspace/attachments'))
    parser.add_argument('--skip-film', action='store_true', help='Useful after production code has changed from this rejected cut')
    args = parser.parse_args()
    for folder in ['sheets', 'loops', 'survey']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    config = json.loads((OUT / 'cases.json').read_text())
    old = {s['id']: s for s in json.loads((ROOT / 'references/studies/motion-2026-10-24/measurements.json').read_text())['sources']}
    paths, sources = {}, []
    for sid, name in NAMES.items():
        candidates = list(args.source_root.rglob(name))
        if len(candidates) != 1:
            raise RuntimeError(f'Expected one uploaded {name}, found {len(candidates)}')
        path = paths[sid] = candidates[0]
        digest = sha(path)
        assert digest == old[sid]['sha256'], f'Source changed: {name}'
        source = {'id': sid, 'filename': name, 'sha256': digest, 'bytes': path.stat().st_size,
                  'duration_seconds': float(old[sid]['media']['format']['duration']),
                  'media': old[sid]['media'], 'survey': None}
        source['survey'] = survey(source, path)
        sources.append(source)
        print('surveyed', name, flush=True)
    studied = []
    for category in ['cases', 'controls', 'dense']:
        for case in config[category]:
            path = paths[case['source']]
            row = {**case, 'category': category, **sheet(case, path, category == 'dense')}
            if category == 'cases':
                row['preview'] = loop(case, path)
            studied.append(row)
            print('studied', case['key'], flush=True)
    report = {'review_date_local': '2026-10-25', 'timezone': 'Asia/Manila',
              'scope': 'Eight uploaded portrait references surveyed; twelve selected animated handoffs, three direct-cut controls and five consecutive-frame intervals. No blocked long-form YouTube episode was viewed.',
              'sources': sources, 'examples': studied,
              'film_audit': None if args.skip_film else audit_film(),
              'limits': [
                  'Source footage shows visible action, not the private rig, scene graph or interpolation curves.',
                  'GIFs are silent 25fps study excerpts; artificial loop restarts are not source transitions.',
                  'Only dense sheets are consecutive-frame studies; survey and ordinary sheets are spaced samples.',
                  'Portrait short-form cutting density is not a target for the nine-minute landscape episode.',
                  'No narration/SFX performance is inferred from silent evidence.',
                  'This script produces evidence, not a quality pass or replacement film.'
              ], 'tools': {'opencv': cv2.__version__, 'numpy': np.__version__}}
    (OUT / 'study.json').write_text(json.dumps(report, indent=2) + '\n')
    print('Saved', OUT / 'study.json', flush=True)


if __name__ == '__main__':
    main()
