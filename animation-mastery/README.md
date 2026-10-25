# Frame-referenced animation research

**Research v1 checkpoint:** the archive is accessible and preserved locally. Four original Remotion studies have been rendered, visually inspected and revised. Download the MP4 files from these repository assets:

| Study | Video | Purpose |
|---|---|---|
| A | [Character acting /4s](../assets/videos/animation-mastery/v1/A-character-acting-4s.mp4) | Gust, anticipation, connected cup/arm gesture, recovery |
| B | [Root detour /6s](../assets/videos/animation-mastery/v1/B-root-detour-6s.mp4) | Contact, pause, alternative route, water response |
| C | [Garden to roots /8s](../assets/videos/animation-mastery/v1/C-garden-to-roots-8s.mp4) | Leaf-attached dew, fall/contact, material-driven scene reveal |
| D | [A little light /12s](../assets/videos/animation-mastery/v1/D-a-little-light-12s.mp4) | Original wordless, time-compressed plant/character story |

These tests preserve the approved original character artwork. They use no new image generation, narration generation or reference soundtrack. Mixes and reusable stems are retained under `public/assets/audio/animation-mastery/`. [Encoded visual audit](validation/quality-audits/visual-audit.md) explains revisions and unresolved differences. Technical checks pass; user artistic approval and direct listening review remain pending.

Read the [evidence index](knowledge/EVIDENCE_INDEX.md), [design specification](knowledge/MASTER_ANIMATION_STYLE_GUIDE.md), [motion library](knowledge/CHARACTER_MOTION_LIBRARY.md), [storytelling grammar](knowledge/VISUAL_STORYTELLING_GRAMMAR.md) and [working implementation](knowledge/ANIMATION_IMPLEMENTATION.md). The 12 requested guides are substantive selected-case specifications, not a claim of exhaustive mastery. The 19 native cases include16 temporal windows totaling 1776 source frames/29.6 seconds and 3 construction stills. All 46 storyboard pages were visually navigated. **Complete verified-shot semantics across 65.6 minutes remain unfinished**, with exact gaps in [remaining-work.json](remaining-work.json).

| Full source | Video-specific report |
|---|---|
| AI Just Crossed the Terrifying Line | [Report](analysis/video-reports/reference_9a02fcef71d3/VISUAL_REPORT.md) |
| Trees Are So Weird | [Report](analysis/video-reports/reference_46db30e386c9/VISUAL_REPORT.md) |
| Humanity's First Civilization | [Report](analysis/video-reports/reference_3dab4435d188/VISUAL_REPORT.md) |
| Why Are There No Holes Around Trees | [Report](analysis/video-reports/reference_2e586456bc4d/VISUAL_REPORT.md) |
| You Will Only Like Half of This Video | [Report](analysis/video-reports/reference_fd02030ee890/VISUAL_REPORT.md) |

This is an active research and production project, not a completed mastery claim. Read [progress.json](progress.json), [remaining-work.json](remaining-work.json) and [AGENTS.md](AGENTS.md) before using it. The requested `video-samples.zip` has been downloaded, hashed and safely extracted after the user published the Drive file. Its five 2560×1440, 60 fps videos total 3,935.202 seconds (65.6 minutes). See the [actual archive inventory](references/manifest.json) and [acquisition record](references/acquisition.json). The archive contains AI, two tree topics, early civilization and a contrasting-worlds video. The full-frame pass has completed: **236,097 decoded frames**, each PTS checked against software-decoded display order, and **355 unreviewed shot proposals**. Semantic research and practical validation remain in progress.

The eight earlier short uploads are a separate pipeline test collection. Their [inventory](references/prior-uploads-manifest.json) covers **17,163 decoded frames**, with **77 unreviewed shot proposals**. Every frame was measured. This does not mean every shot has received semantic or artistic review, and it does not establish what is inside the requested archive.

## Reproducible pipeline

FFmpeg and FFprobe are required. Python analysis dependencies are in [requirements.txt](requirements.txt); the existing ignored `.cache/motion-study` install is reused when present. For a fresh environment, install those dependencies in an isolated Python environment before running the commands below. Remotion remains the production renderer.

```bash
# Obtain the actual requested collection. Local input is also supported.
npm run research:acquire
# Or: npm run research:acquire -- --archive /absolute/path/video-samples.zip

# Inventory every actual video before its temporal pass.
npm run research:inventory -- --directory animation-mastery/references/original/archive-contents --source-kind archive
npm run research:analyze -- --jobs 2
npm run research:validate

# Replay the separate prior-upload pipeline test without mislabeling its scope.
npm run research:analyze -- --manifest animation-mastery/references/prior-uploads-manifest.json
npm run research:test
npm run research:search -- --query 'Skeleton'

# Rebuild/search cases, guides, navigation and explicitly unverified ASR.
npm run research:annotate
npm run research:index
npm run research:search -- --query '"detour"' --limit 4
# Re-export ignored native case PNGs from preserved sources when needed.
npm run research:cases

# Reproduce the original studies and technical/encoded evidence.
npm run mastery:sound
npm run mastery:geometry
npm run mastery:render
npm run mastery:review
npm run mastery:determinism
```

Analysis preserves zero-based decoded display-order frame numbers and actual PTS. Frame ranges are half-open `[start,end)`. FFprobe packet PTS and the count/order of FFmpeg software-decoded frames must agree. The AV1 archive uses libdav1d; OpenCV handles image measurements and H264 navigation proxies, not native AV1 decoding. Container duration, picture endpoint and nominal frame rate are recorded separately. Variable-rate media is not silently converted into a nominal frame grid.

`frame-index.jsonl.gz` stores every frame's PTS, duration, keyframe flag and picture type. `frame-metrics.jsonl.gz` stores consecutive-image differences, color distribution differences and sparse shared-motion estimates. `analysis/motion-tracks/*-feature-pairs.jsonl.gz` preserves forward/backward-checked feature pairs at the recorded analysis resolution. A partial affine fit is common image motion, **not an identified camera move**. Flow corners are not semantic objects or rig joints.

Automated shot proposals partition the entire decoded picture. Every proposal has first/middle/last navigation frames and timestamped storyboard pages. They can miss gradual transitions and semantic changes within a continuous composition, and can falsely split fast pans, flashes or graphic reveals. They are explicitly unreviewed, with no invented narrative purpose. Review/refine them before writing per-shot conclusions. The [reviewed-shot schema](analysis/shot-schema.json) distinguishes observation, measurement, inference and implementation choices, and supports stable semantic IDs, poses, property tracks, overlaps, phases and confidence.

```bash
# Export 24 exact consecutive source frames, a contact sheet and a silent excerpt.
npm run research:evidence -- --manifest animation-mastery/references/prior-uploads-manifest.json --video prior_9f097af40530 --start-frame 39 --end-frame 63 --name lift-pipeline-validation

# Query exact source timing/metrics.
npm run research:search -- --video prior_9f097af40530 --frame 39

# Track an analyst-selected ROI; inspect its result before accepting it.
python animation-mastery/scripts/track_region.py --manifest animation-mastery/references/prior-uploads-manifest.json --video prior_9f097af40530 --object-id barbell-left-plate --start-frame 39 --end-frame 63 --roi 0.09 0.43 0.23 0.64
```

The tracker retains only surviving initial features and stops when reliability collapses. Its region center is not a rig pivot. The example above stops at frame 51 rather than inventing positions through the remaining interval. Reframing, occlusion, deformation and crossing objects still require visual interpretation.

## Evidence and verification

The [24-frame validation sheet](analysis/keyframes/prior_9f097af40530/lift-pipeline-validation/consecutive-001.jpg) and final native frame were visually inspected. They cover source frames 39–62 at PTS **1.323242–2.089909 s**. This offset from nominal frame/fps timing is retained. The [silent excerpt](analysis/keyframes/prior_9f097af40530/lift-pipeline-validation/motion-interval.mp4) is reference material, not an original animation demonstration.

The [pipeline audit](validation/quality-audits/pipeline-validation.json) checks source hashes, every-frame coverage, PTS agreement, contiguous shot proposals and truthful review status. Four synthetic-media behavior tests cover ZIP traversal, preserving source bytes/refusing replacement, known image translation, and real variable-rate decode with a known visual cut. These tests verify tooling behavior, not drawing sophistication or audience comprehension.

Original media, bulk native PNG exports and the regenerable SQLite index are ignored. Tracked frame/shot data, selected evidence, research, reusable code and original finished animation studies are the persistent foundation. Original MP4s are in Git; the 1.19GB reference ZIP and full original source videos remain preserved local inputs rather than normal Git blobs. For a fresh checkout, run acquisition/inventory/analysis to reproduce ignored source/proxy data and compare the recorded hashes. For an intact workspace, resume from the checked artifacts rather than decoding everything again.

Running `mastery:review` rechecks actual MP4s and regenerates boards, initially marking visual review pending. Re-read and re-inspect the encoded evidence if movie hashes change; do not automatically certify a new visual pass. See [QUALITY_STANDARDS.md](knowledge/QUALITY_STANDARDS.md). Original source excerpts are clearly labeled reference evidence and are not part of the original demonstration deliverables.
