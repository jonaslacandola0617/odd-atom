"""Download the user-selected reference videos after YouTube access is available.

Requires yt-dlp, Node.js, and FFmpeg. Keeps normal TLS verification and proxy routing.
Run with --check-only to validate local files without making network requests.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'references/catalog.json'
VIDEOS = ROOT / 'references/videos'

def inspect(path):
    if not path.is_file() or path.stat().st_size == 0:
        return None
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)], capture_output=True, text=True)
    if probe.returncode:
        return None
    data = json.loads(probe.stdout)
    video = next((s for s in data['streams'] if s.get('codec_type') == 'video'), None)
    if not video or float(data['format'].get('duration', 0)) <= 0:
        return None
    digest = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(chunk)
    return {'duration': float(data['format']['duration']), 'width': video['width'], 'height': video['height'], 'sha256': digest.hexdigest(), 'bytes': path.stat().st_size}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    if not args.check_only and not importlib.util.find_spec('yt_dlp'):
        sys.exit('Install references/requirements.txt into your Python environment first.')
    data = json.loads(CATALOG.read_text())
    failures = 0
    for entry in data['references']:
        video_id = entry['id']
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
            sys.exit('Invalid YouTube ID in reference catalog.')
        destination = VIDEOS / f'{video_id}.mp4'
        details = inspect(destination)
        if args.check_only:
            print(f'{video_id}: ' + ('verified local video' if details else 'no valid local video'))
            failures += not bool(details)
            continue
        if details is None:
            VIDEOS.mkdir(parents=True, exist_ok=True)
            log = VIDEOS / f'{video_id}.download.log'
            command = [sys.executable, '-m', 'yt_dlp', '--no-playlist', '--socket-timeout', '15', '--retries', '0', '--extractor-retries', '0', '--no-progress', '--js-runtimes', 'node',
                       '-f', 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/best[height<=1080]', '--merge-output-format', 'mp4', '--remux-video', 'mp4', '--write-info-json',
                       '-o', str(VIDEOS / '%(id)s.%(ext)s'), f'https://www.youtube.com/watch?v={video_id}']
            with log.open('w') as output:
                result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT)
            details = inspect(destination) if result.returncode == 0 else None
            if details is None:
                output = log.read_text(errors='replace').lower()
                network_block = '403' in output and ('tunnel' in output or 'proxy' in output)
                entry.update({'status': 'blocked_network' if network_block else 'download_failed', 'reason': 'Environment proxy rejected YouTube access with HTTP 403.' if network_block else 'No complete playable MP4 was produced; inspect the local download log.', 'localVideo': None, 'studyStatus': 'not_viewed'})
                failures += 1
                print(f'{video_id}: {entry["status"]}')
                continue
        info_file = VIDEOS / f'{video_id}.info.json'
        info = json.loads(info_file.read_text()) if info_file.exists() else {}
        entry.update({'status': 'downloaded', 'reason': None, 'title': info.get('title'), 'channel': info.get('channel'), 'localVideo': str(destination.relative_to(ROOT)), 'media': details})
        print(f'{video_id}: verified {details["width"]}x{details["height"]} MP4')
    if not args.check_only:
        CATALOG.write_text(json.dumps(data, indent=2) + '\n')
    return 1 if failures else 0

if __name__ == '__main__':
    raise SystemExit(main())
