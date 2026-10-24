# User-selected visual references

The [motion study](studies/motion-2026-10-24/README.md) now examines selected sequences across all eight uploaded reference clips, with short motion loops, dense frame sheets, a timing trace, background/actor registration checks, and official production-process evidence. It is separate from the three blocked full-episode links below. The current approved artwork is preserved; [the next-pass plan](../docs/production/motion-next-pass.md) focuses on acting, environmental motion, and narration timing.

These three links are saved as the next priority references for studying illustration, graphic design, composition, color, character design, typography, and motion:

1. https://www.youtube.com/watch?v=_y9JuojAIg0
2. https://www.youtube.com/watch?v=ujkD4SxPKOI
3. https://www.youtube.com/watch?v=0NY2gAftzJE

**Current status: none downloaded or viewed.** All three actual download attempts failed when the environment proxy rejected YouTube access with HTTP 403. No video metadata was returned, so titles, durations, and visual findings have not been invented. `catalog.json` records this status individually.

Retried on October 23, 2026 after the user published the network configuration. All three still failed at the proxy, as did independent requests for YouTube pages and thumbnails. The published configuration includes the requested YouTube destinations; the running requests remain blocked. This is not a missing downloader installation.

The official studio website now responds with HTTP 200. Eight website reference assets were downloaded, including a short silent amoeba animation. See the [actual artwork observations and visual boards](studies/official-site/README.md). These findings are separate from the three unseen YouTube episodes.

The [expanded topic study](studies/topic-range-2026-10-23/README.md) adds six official episode case studies and 12 accompanying images, covering emotion, trust, war, collective action, future generations, and a scale journey. It includes three comparison boards, source records, and an original-production guide. All downloaded illustrations are official reference artwork, not generated Odd Atom assets. YouTube was rechecked and remains blocked; these are case-study/still-image findings, not full-episode reviews.

The installed downloader is yt-dlp 2026.10.21, with Node.js for JavaScript support and FFmpeg for merging. Retries were disabled for the blocked requests. No additional installation is needed to try again after access changes.

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

The user has also requested a broader study of additional Kurzgesagt videos. Start with these three, then cover a varied selection of space, biology, technology, and society episodes. Record observed examples and timing for each rather than increasing the catalog with unviewed links. This broader YouTube study remains pending access.

For each video, capture timestamped examples of the opening, representative scenes, cutaways, transitions, and closing. Inspect the actual frames before recording findings about:

- Silhouettes, shape construction, outlines, layered fills, highlights, and shading.
- Color roles, foreground/background separation, contrast, and recurring palette relationships.
- Character proportions, facial features, joint construction, expressions, and posed action.
- Wide composition, scale changes, visual hierarchy, focal points, and scene density.
- Main titles, ordinary diagram labels, caption typography, contour layers, and placement.
- Moving elements, holds, timing, transitions, camera movement, and how animation explains the narration.

Keep observed details separate from proposed choices for our original artwork. Do not describe these videos as studied until the material has actually been retrieved and inspected. Downloading alone does not establish a completed visual study.
