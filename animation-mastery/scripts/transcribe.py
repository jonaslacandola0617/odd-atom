"""Offline reference ASR with checkpointed chunks; no voice-generation credits.

Uses the project's already cached Sherpa/Whisper model. Model text and segment
times are unverified estimates, not a listening audit or exact word alignment.
"""
from pathlib import Path
import argparse
import json
import subprocess
import sys
import time

from common import ROOT, REPO, digest, selected, source_path, write_json

sys.path.insert(0, str(REPO / '.cache/singularity-audio'))
import numpy as np
import sherpa_onnx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, default=ROOT / 'references/manifest.json')
    parser.add_argument('--video', action='append')
    parser.add_argument('--threads', type=int, default=1)
    args = parser.parse_args()
    model = REPO / '.cache/singularity-models/sherpa-onnx-whisper-base.en'
    paths = [model / name for name in ['base.en-encoder.int8.onnx', 'base.en-decoder.int8.onnx', 'base.en-tokens.txt']]
    if not all(p.exists() for p in paths):
        raise SystemExit('Cached offline ASR model is missing. No model access or recognition is claimed.')
    model_hashes = {p.name: digest(p) for p in paths}
    recognizer = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(paths[0]), decoder=str(paths[1]), tokens=str(paths[2]),
        num_threads=args.threads, enable_segment_timestamps=True)
    manifest = json.loads(args.manifest.read_text())
    for row in sorted(selected(manifest, args.video), key=lambda r: r['container_duration_seconds']):
        if digest(source_path(row)) != row['source_sha256']:
            raise ValueError('Source hash changed')
        destination = ROOT / 'analysis/video-reports' / row['video_id'] / 'transcript-asr.json'
        old = json.loads(destination.read_text()) if destination.exists() else None
        if old and (old['source_sha256'] != row['source_sha256'] or old['model_sha256'] != model_hashes):
            raise ValueError('Existing ASR belongs to another source/model')
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source_path(row)),
                                       '-map', '0:a:0', '-vn', '-ar', '16000', '-ac', '1', '-f', 'f32le', '-'])
        audio = np.frombuffer(raw, np.float32)
        duration = len(audio) / 16000
        boundaries = list(np.arange(0, duration, 25.)) + [duration]
        report = old or {'video_id': row['video_id'], 'source_sha256': row['source_sha256'],
                         'engine': 'cached Sherpa-ONNX / Whisper base.en int8 CPU', 'model_sha256': model_hashes,
                         'duration_seconds': duration, 'chunks': [], 'segments': [],
                         'status': 'in_progress', 'review_status': 'unverified_machine_recognition',
                         'limitations': 'ASR can mishear names, invent words or misplace segment timing. Fixed 25s chunk boundaries can split words. Segment times are estimates, not exact word alignment. Direct audition is unavailable; this is not a listening review.',
                         'voice_generation_requests': 0}
        for i in range(len(report['chunks']), len(boundaries) - 1):
            start, end = map(float, boundaries[i:i + 2])
            stream = recognizer.create_stream()
            stream.accept_waveform(16000, audio[round(start * 16000):round(end * 16000)])
            began = time.monotonic()
            recognizer.decode_stream(stream)
            result = stream.result
            report['chunks'].append({'index': i, 'start_seconds': start, 'end_seconds': end,
                                     'text': result.text.strip(), 'processing_seconds': time.monotonic() - began})
            for x, length, text in zip(result.segment_timestamps, result.segment_durations, result.segment_texts):
                report['segments'].append({'start_seconds': start + x, 'end_seconds': min(end, start + x + length),
                                           'text': text.strip(), 'chunk': i, 'verified': False})
            write_json(destination, report)
            print(row['video_id'], 'ASR', i + 1, '/', len(boundaries) - 1, f'{start:.1f}–{end:.1f}s', flush=True)
        report['status'] = 'complete_unverified'
        write_json(destination, report)


if __name__ == '__main__':
    main()
