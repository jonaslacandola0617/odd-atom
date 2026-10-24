# Odd Atom — original explanatory animation

**Artwork passed; current focus is animation and narration.** The [motion study](references/studies/motion-2026-10-24/README.md) contains source-motion loops, dense frame sheets, timing/region measurements, official process evidence, and a [next-pass plan](docs/production/motion-next-pass.md). The approved drawings, background plates and current export were preserved unchanged during the study.

**Approved character master:** [View/download the static sheet](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/characters/static-test-01.png). The user approved these Mira and Sol designs; the latest film adapts them into animated illustrated cutouts.

The latest test is **Alone in a crowd — new motion pass**: a 20-second, 1920 × 1080, 30 fps Remotion film using the unchanged approved artwork. Torso weight shifts, elbow/wrist articulation, head-led attention, delayed reactions, and readable holds replace continuous idle movement. A fresh ElevenLabs read retains native speech speed, with edited sentence gaps, aligned captions, and quieter original music/ambience.

**[Download the new 20-second MP4](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/approved-characters-motion-20s.mp4)** · [Poster](assets/videos/approved-characters-motion-20s-poster.png) · [Motion review and comparison](docs/production/characters-motion.md)

[Previous approved-art film](assets/videos/approved-characters-20s.mp4) remains unchanged for comparison. The approved character sheet and all four illustration assets retain their recorded hashes.

The [earlier artwork audit](docs/production/artwork-audit/README.md) and [previous rebuild](docs/production/crowd-rebuilt.md) remain as historical comparisons. The current approved master guides the character drawing. Technical delivery is not evidence of comparable visual quality.

## What was built and reviewed

The original illustrated textures are skinned continuously through the torso and arm joints. Lower legs stay anchored, the cup/grip move together, and steam emits from the moving cup then rises independently. Authored pose keys separate anticipation, stroke, hold, and settling. The expression changes during a blink. The painted environments are deliberately held, with camera staging and foreground crowd motion providing depth.

The [new review](docs/production/characters-motion.md) contains actual encoded frames, a previous/new motion loop, close-ups, unchanged-art hashes, and geometry/delivery checks. The rig has limited 2D views and does not implement a walk cycle or lip sync.

## Install and render

Use Node.js 24.5 or newer, Python 3, FFmpeg, and Chromium. Cloud render commands use `/usr/bin/chromium`; use your local browser path on another system.

```sh
npm ci
npm run typecheck
npm run dev
```

Select `MotionCharactersTest` in Remotion Studio. The committed artwork, narration and audio stems allow offline re-rendering without new image or speech requests:

```sh
npm run render:characters-motion
```

The final render command checks the narration provider, generated status, and audio file. It renders 600 frames, mixes the original PCM stems into AAC, preserves the H.264 picture, and writes an MP4 with exact 20-second track timing and fast-start metadata.

Optional sound regeneration:

```sh
npm run sound:characters-motion
```

Sound regeneration needs NumPy. The current transparent art atlases and background PNGs are under `public/assets/artwork/approved-characters/`; prompts and hashes are in `docs/production/approved-characters/`. Older SVG character/set exports remain historical comparison material.

## ElevenLabs narration

The official `@elevenlabs/elevenlabs-js` SDK is connected and live generation has succeeded. Keep `ELEVENLABS_API_KEY` in secure environment settings under that exact name. The build-time client reads it automatically and is separate from the Remotion browser bundle. Keys are never stored in code or media assets.

To generate new narration after editing the crowd script:

```sh
npm run narrate:characters-motion
npm run sound:characters-motion
npm run render:characters-motion
```

Narration generation uses account credits. An optional `ELEVENLABS_VOICE_ID` selects another account-accessible voice; otherwise the project uses George with `eleven_multilingual_v2`. The returned character timestamps drive caption and scene timing. The current motion profile rejects an overlong native read, preserves spoken phoneme speed, and inserts the configured silence in sentence gaps. Older profiles retain their previous tempo fitting. Failed responses preserve existing narration.

## Source map

- `src/MotionCharacters.tsx`: current skinned illustration rig, authored pose timing, staging, and captions.
- `src/ApprovedCharacters.tsx`: previous approved-art cutout composition, retained for comparison.
- `scripts/review_motion_characters.py`, `scripts/check_motion_geometry.cjs`: current encoded-frame and geometry checks.
- `public/assets/artwork/approved-characters/`: current transparent image atlases and background plates.
- `scripts/review_approved_characters.py`: encoded-frame comparisons and validation.
- `src/Connection.tsx`, `src/art/ConnectionArt.tsx`: previous vector rebuild retained for comparison.
- `src/Crowd.tsx`, `src/characters/Citizen.tsx`, `src/art/City.tsx`: previous rejected test retained for comparison.
- `src/data/crowd-motion-narration.json`: current ElevenLabs performance settings, edited pauses, captions, and story cues.
- `scripts/elevenlabs_narration.mjs`: official SDK speech request; `elevenlabs_narration.py` handles audio and timing.
- `scripts/motion_sound_design.py`: current original score and ambience.
- `scripts/render_final.cjs`: guarded render and final audio/video assembly.

## Reference library

The [expanded reference study](references/studies/topic-range-2026-10-23/README.md) inspects six official episode case studies and 12 images across emotion, trust, war, collective action, future generations, and exploration. The earlier [website artwork study](references/studies/official-site/README.md) covers shape construction and a short amoeba loop.

All downloaded study illustrations are official Kurzgesagt artwork, not graphics generated for this channel. They are separate from our original production assets. YouTube playback remains blocked; the [reference catalog](references/catalog.json) records the three user-selected videos as not downloaded/viewed. Findings from accessible website text and images do not establish full-episode timing, narration, or sound design.

## Earlier tests

The previous [vector rebuild](docs/production/crowd-rebuilt.md) uses `CrowdRebuilt` and `npm run render:crowd-rebuilt`; it is separate from the approved-character composition.

The star segment remains an explicitly unvoiced [visual preview](assets/videos/star-balance-20s-visual-preview.mp4); its [production record](docs/production/star-balance.md) describes that status. `npm run narrate` and `npm run render` still target the star profile, independently of the crowd test. `StarBalancePreview` and `StarBalance` remain separate compositions.

The older astronaut exports are historical review files. The four user-supplied character SVGs and their old rig remain retired; the active source uses original characters. See [ATTRIBUTION.md](ATTRIBUTION.md) for fonts, artwork, narration, and source records.

Finished MP4s and posters are tracked under `assets/videos/` and pushed for GitHub download. Temporary renders, credentials, caches, and frame extractions stay out of Git.
