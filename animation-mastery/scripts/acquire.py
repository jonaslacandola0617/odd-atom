"""Download or safely extract the requested archive; preserve every source byte.

No instructions found inside the archive are executed. Google confirmation HTML
is handled only as a download form, never as project instructions.
"""
from pathlib import Path, PurePosixPath
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import os
import shutil
import stat
import tempfile
import urllib.parse
import urllib.request
import zipfile

from common import ROOT, digest, write_json

FILE_ID = '1jMjgwkzDE0gnEuhXB4FkXqazeRLRu0O5'
URLS = [
    f'https://drive.google.com/uc?export=download&id={FILE_ID}',
    f'https://drive.usercontent.google.com/download?id={FILE_ID}&export=download&confirm=t',
    f'https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing',
    f'https://drive.googleusercontent.com/uc?id={FILE_ID}&export=download',
]
MAX_BYTES = 12 * 1024 ** 3


def safe_extract(archive, destination, max_bytes=MAX_BYTES):
    """Reject traversal, links, duplicate/case-colliding names and zip bombs."""
    destination = Path(destination)
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist()
        if len(entries) > 20000 or sum(i.file_size for i in entries) > max_bytes:
            raise ValueError('Archive exceeds the file-count or uncompressed-size limit')
        seen = set()
        for info in entries:
            p = PurePosixPath(info.filename)
            mode = info.external_attr >> 16
            if (p.is_absolute() or '..' in p.parts or '\\' in info.filename
                    or (p.parts and ':' in p.parts[0]) or stat.S_ISLNK(mode)):
                raise ValueError(f'Unsafe archive member: {info.filename!r}')
            key = info.filename.rstrip('/').casefold()
            if key in seen:
                raise ValueError(f'Duplicate archive member: {info.filename!r}')
            seen.add(key)
            if info.file_size > 100 * max(info.compress_size, 1) and info.file_size > 100 * 1024 ** 2:
                raise ValueError(f'Unusual compression ratio: {info.filename!r}')
        if destination.exists():
            raise FileExistsError(f'Refusing to replace preserved originals: {destination}')
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = Path(tempfile.mkdtemp(prefix='archive-extract-', dir=destination.parent))
        try:
            for info in entries:
                target = temporary.joinpath(*PurePosixPath(info.filename).parts)
                if info.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(info) as src, target.open('xb') as dst:
                        shutil.copyfileobj(src, dst, 1024 * 1024)
            temporary.replace(destination)
        except Exception:
            shutil.rmtree(temporary)
            raise
    return destination


class DownloadForm(HTMLParser):
    def __init__(self):
        super().__init__()
        self.action = None
        self.fields = {}
        self.inside = False

    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if tag == 'form' and a.get('id') == 'download-form':
            self.action = a.get('action')
            self.inside = True
        if self.inside and tag == 'input' and a.get('name'):
            self.fields[a['name']] = a.get('value', '')

    def handle_endtag(self, tag):
        if tag == 'form':
            self.inside = False


def download(url, target, opener=None):
    opener = opener or urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with opener.open(request, timeout=25) as response:
        first = response.read(4096)
        if not first.startswith(b'PK'):
            html = first + response.read(1024 * 1024)
            parser = DownloadForm()
            parser.feed(html.decode(errors='replace'))
            if parser.action:
                action = urllib.parse.urljoin(url, parser.action)
                parts = urllib.parse.urlsplit(action)
                if parts.scheme != 'https' or parts.hostname not in {
                        'drive.google.com', 'drive.usercontent.google.com', 'drive.googleusercontent.com'}:
                    raise ValueError('Unrecognized confirmation download host')
                query = urllib.parse.parse_qsl(parts.query) + list(parser.fields.items())
                confirmed = urllib.parse.urlunsplit(parts._replace(query=urllib.parse.urlencode(query)))
                if confirmed != url:
                    # At most one confirmation request; no unbounded form recursion.
                    with opener.open(confirmed, timeout=25) as confirmed_response:
                        return save_response(confirmed_response, target)
            raise ValueError(f'Response is not a ZIP; content-type={response.headers.get("content-type")}')
        return save_response(response, target, first)


def save_response(response, target, first=b''):
    prefix = first or response.read(4096)
    if not prefix.startswith(b'PK'):
        raise ValueError('Confirmed response is not a ZIP')
    target = Path(target)
    temporary = target.with_suffix('.zip.partial')
    try:
        with temporary.open('xb') as stream:
            stream.write(prefix)
            count = len(prefix)
            while chunk := response.read(1024 * 1024):
                count += len(chunk)
                if count > MAX_BYTES:
                    raise ValueError('Download exceeds 12GiB limit')
                stream.write(chunk)
        if not zipfile.is_zipfile(temporary):
            raise ValueError('Incomplete/invalid ZIP download')
        temporary.replace(target)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise
    return target


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', type=Path, help='Use an already downloaded local ZIP')
    args = parser.parse_args()
    original = ROOT / 'references/original'
    original.mkdir(parents=True, exist_ok=True)
    archive = args.archive or original / 'video-samples.zip'
    report = {'requested_filename': 'video-samples.zip', 'google_drive_file_id': FILE_ID,
              'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'attempts': []}
    if not archive.exists():
        for url in URLS:
            try:
                download(url, archive)
                report['attempts'].append({'url': url, 'status': 'downloaded'})
                break
            except Exception as exc:
                report['attempts'].append({'url': url, 'status': 'failed',
                                           'error_type': type(exc).__name__, 'error': str(exc)})
    if not archive.exists():
        report.update(status='blocked', authenticated_drive_connector_available=False,
                      reason='No local archive; all available public download attempts failed. '
                             'Earlier uploads are a separate collection, not the archive contents.')
        write_json(ROOT / 'references/acquisition.json', report)
        print(json.dumps(report, indent=2))
        raise SystemExit(2)
    if not zipfile.is_zipfile(archive):
        raise ValueError('Local input is not a valid ZIP')
    destination = original / 'archive-contents'
    # A repeated run never replaces originals. Confirm the archive identity first.
    fingerprint = digest(archive)
    prior_file = ROOT / 'references/acquisition.json'
    prior = json.loads(prior_file.read_text()) if prior_file.exists() else {}
    if destination.exists():
        if prior.get('archive_sha256') != fingerprint or prior.get('status') != 'acquired':
            raise ValueError('Existing extracted directory belongs to an unverified/different archive')
    else:
        safe_extract(archive, destination)
    report.update(status='acquired', archive_path=os.path.relpath(archive.resolve(), ROOT),
                  archive_sha256=fingerprint, archive_bytes=archive.stat().st_size,
                  extracted_directory=str(destination.relative_to(ROOT)))
    write_json(ROOT / 'references/acquisition.json', report)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
