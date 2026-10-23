# User-selected visual references

These three links are saved as the next priority references for studying illustration, graphic design, composition, color, character design, typography, and motion:

1. https://www.youtube.com/watch?v=_y9JuojAIg0
2. https://www.youtube.com/watch?v=ujkD4SxPKOI
3. https://www.youtube.com/watch?v=0NY2gAftzJE

**Current status: none downloaded or viewed.** All three actual download attempts failed when the environment proxy rejected YouTube access with HTTP 403. No video metadata was returned, so titles, durations, and visual findings have not been invented. `catalog.json` records this status individually.

The installed downloader was yt-dlp 2026.10.21, with Node.js for JavaScript support and FFmpeg for merging. Retries were disabled for the blocked requests. The required YouTube page and video-media domains already exist in the saved environment draft; that does not establish access on the running machine. Apply the saved network settings before retrying. Alternatively, the user can attach the video files directly for local study.

## Download after access changes

```sh
python -m venv /workspace/reference-tools
/workspace/reference-tools/bin/pip install -r references/requirements.txt
/workspace/reference-tools/bin/python scripts/download_references.py
```

The downloader requests MP4 video up to 1080p, saves metadata, and verifies a nonempty playable video with FFprobe before marking a reference downloaded. Completed files are reused after validation. TLS verification and the environment's proxy route remain enabled.

Downloaded originals go in `references/videos/`, separate from production assets. Large footage files, partial downloads, and logs are ignored by Git. The catalog and subsequent written studies are tracked. To check local availability without network access:

```sh
/workspace/reference-tools/bin/python scripts/download_references.py --check-only
```

## Study to perform once files are available

For each video, capture timestamped examples of the opening, representative scenes, cutaways, transitions, and closing. Inspect the actual frames before recording findings about:

- Silhouettes, shape construction, outlines, layered fills, highlights, and shading.
- Color roles, foreground/background separation, contrast, and recurring palette relationships.
- Character proportions, facial features, joint construction, expressions, and posed action.
- Wide composition, scale changes, visual hierarchy, focal points, and scene density.
- Main titles, ordinary diagram labels, caption typography, contour layers, and placement.
- Moving elements, holds, timing, transitions, camera movement, and how animation explains the narration.

Keep observed details separate from proposed choices for our original artwork. Do not describe these videos as studied until the material has actually been retrieved and inspected. Downloading alone does not establish a completed visual study.
