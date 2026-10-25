"""Behavior checks using synthetic media; no animation-quality claims."""
from pathlib import Path
import gzip
import json
import subprocess
import tempfile
import unittest
import zipfile

import acquire
import analyze
from common import digest, ffprobe

cv2, np = analyze.cv2, analyze.np


class ArchiveTests(unittest.TestCase):
    def test_traversal_is_rejected_before_any_extraction(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / 'malicious.zip'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('safe/video.txt', 'preserve')
                z.writestr('../outside.txt', 'escape')
            with self.assertRaises(ValueError):
                acquire.safe_extract(archive, root / 'destination')
            self.assertFalse((root / 'outside.txt').exists())
            self.assertFalse((root / 'destination').exists())

    def test_original_bytes_preserved_and_overwrite_refused(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / 'input.zip'
            payload = bytes(range(256)) * 9
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('nested/source.mp4', payload)
            acquire.safe_extract(archive, root / 'destination')
            self.assertEqual((root / 'destination/nested/source.mp4').read_bytes(), payload)
            with self.assertRaises(FileExistsError):
                acquire.safe_extract(archive, root / 'destination')


class TemporalTests(unittest.TestCase):
    def test_known_translation_measured_without_claiming_camera(self):
        rng = np.random.default_rng(4)
        image = rng.integers(0, 256, (128, 192, 3), dtype=np.uint8)
        image = cv2.GaussianBlur(image, (3, 3), .6)
        moved = cv2.warpAffine(image, np.array([[1., 0., 3.], [0., 1., -2.]]), (192, 128))
        metrics, pairs = analyze.pair_metrics(image, moved)
        self.assertGreater(len(pairs), 30)
        self.assertIsNotNone(metrics['affine'])
        transform = np.array(metrics['affine'])
        np.testing.assert_allclose(transform[:, 2], [3, -2], atol=.25)
        self.assertNotIn('camera_animation', metrics)

    def test_real_decode_keeps_vfr_pts_and_partitions_all_frames(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for i, color in enumerate(['#202020', '#202020', '#ffffff', '#ffffff']):
                Image.new('RGB', (160, 96), color).save(root / f'{i}.png')
            # Vary durations deliberately; nominal frame index/fps is wrong here.
            concat = root / 'inputs.txt'
            concat.write_text("file '0.png'\nduration 0.04\nfile '1.png'\nduration 0.12\nfile '2.png'\nduration 0.08\nfile '3.png'\nduration 0.16\nfile '3.png'\n")
            source = root / 'test.mp4'
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0',
                            '-i', str(concat), '-fps_mode', 'vfr', '-c:v', 'libx264',
                            '-pix_fmt', 'yuv420p', str(source)], check=True)
            original_root = analyze.ROOT
            analyze.ROOT = root / 'study'
            try:
                row = {'video_id': 'synthetic', 'local_path': str(source),
                       'source_sha256': digest(source), 'width': 160, 'height': 96,
                       'video_codec': 'h264', 'video_time_base': ffprobe(source)['streams'][0]['time_base'],
                       'nominal_frame_rate': '25/1', 'title': 'Synthetic VFR validation'}
                updates = analyze.process(row)
                with gzip.open(analyze.ROOT / 'analysis/video-reports/synthetic/frame-index.jsonl.gz', 'rt') as stream:
                    frames = [json.loads(line) for line in stream]
                self.assertEqual(updates['decoded_frame_count'], len(ffprobe(source, frames=True)['frames']))
                differences = np.diff([r['pts_seconds'] for r in frames])
                self.assertGreater(float(np.max(differences) - np.min(differences)), .05)
                shots = json.loads((analyze.ROOT / 'analysis/shot-timelines/synthetic.json').read_text())['shots']
                self.assertEqual(shots[0]['start_frame'], 0)
                self.assertEqual(shots[-1]['end_frame'], len(frames))
                self.assertTrue(all(a['end_frame'] == b['start_frame'] for a, b in zip(shots, shots[1:])))
                self.assertIn(2, [s['start_frame'] for s in shots])
                self.assertTrue(all(s['narrative_purpose'] is None for s in shots))
                self.assertTrue(all(s['boundary_review_status'] == 'unreviewed_automated_proposal' for s in shots))
            finally:
                analyze.ROOT = original_root


if __name__ == '__main__':
    unittest.main(verbosity=2)
