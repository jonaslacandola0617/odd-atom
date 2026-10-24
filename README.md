# Odd Atom — original explanatory animation

**Latest character drawing test:** [View/download the static character sheet](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/characters/static-test-01.png) · [Design notes and generation record](docs/production/character-static-test.md). This is a standalone raster concept test following further feedback on the film's characters.

The latest test is the **artwork rebuild of Alone in a crowd**: a 20-second, 1920 × 1080, 30 fps Remotion film about the difference between proximity and connection. It has redrawn characters and environments, three shots, and the existing generated ElevenLabs narration, aligned captions, original music, and ambience.

**[Download the rebuilt 20-second MP4](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/alone-in-a-crowd-rebuilt-20s.mp4)** · [Poster](assets/videos/alone-in-a-crowd-rebuilt-20s-poster.png) · [Before/after artwork review](docs/production/crowd-rebuilt.md)

The user rejected the earlier test's artwork. The [detailed audit](docs/production/artwork-audit/README.md) documents its failures; the [rebuild review](docs/production/crowd-rebuilt.md) shows the applied corrections and remaining limitations. Technical delivery is not evidence of comparable drawing quality.

## What was built and reviewed

Mira and Sol now have distinct heads and body contours, solid eyes, filled tapered limbs, and separate resting, gesturing, and cup-holding hands. The terrace uses asymmetrical staging and an over-the-shoulder reaction view. The crowd, original artwork, gestures, expressions, and environmental details are animated in Remotion. Opening lettering has layered outline passes; captions stay below the action. No branding, episode badges, timers, or production notes appear in the film.

The [review](docs/production/crowd-rebuilt.md) contains actual encoded before/after frames, human-reference face crops, sequence and cut sheets, applied drawing changes, and remaining limits. Downloaded reference art is identified separately from our original artwork.

## Install and render

Use Node.js 24.5 or newer, Python 3, FFmpeg, and Chromium. Cloud render commands use `/usr/bin/chromium`; use your local browser path on another system.

```sh
npm ci
npm run typecheck
npm run dev
```

Select `CrowdRebuilt` in Remotion Studio. The committed narration and audio stems allow offline re-rendering without a new speech request:

```sh
npm run render:crowd-rebuilt
```

The final render command checks the narration provider, generated status, and audio file. It renders 600 frames, mixes the original PCM stems into AAC, preserves the H.264 picture, and writes an MP4 with exact 20-second track timing and fast-start metadata.

Optional asset regeneration:

```sh
npm run assets:crowd-rebuilt
npm run sound:crowd
```

Sound regeneration needs NumPy. The six rebuilt original SVG assets are under `public/assets/artwork/connection-rebuilt/`. The older character/set exports remain historical comparison material.

## ElevenLabs narration

The official `@elevenlabs/elevenlabs-js` SDK is connected and live generation has succeeded. Keep `ELEVENLABS_API_KEY` in secure environment settings under that exact name. The build-time client reads it automatically and is separate from the Remotion browser bundle. Keys are never stored in code or media assets.

To generate new narration after editing the crowd script:

```sh
npm run narrate:crowd
npm run sound:crowd
npm run render:crowd-rebuilt
```

Narration generation uses account credits. An optional `ELEVENLABS_VOICE_ID` selects another account-accessible voice; otherwise the project uses George with `eleven_multilingual_v2`. The returned character timestamps drive caption and scene timing. Tempo fitting is limited to a 10% slowdown or a 15% speedup; a longer read is rejected. Failed responses preserve existing narration.

## Source map

- `src/Connection.tsx`: rebuilt sequence, shot framing, gestures, and captions.
- `src/art/ConnectionArt.tsx`: rebuilt original character contours, head views, hands, terrace, street, and props.
- `scripts/export_connection_art.cjs`: standalone original SVG exports.
- `scripts/review_connection.py`: delivered-frame comparisons and validation.
- `src/Crowd.tsx`, `src/characters/Citizen.tsx`, `src/art/City.tsx`: previous rejected test retained for comparison.
- `src/data/crowd-narration.json`: script, generated status, aligned captions, and story cues.
- `scripts/elevenlabs_narration.mjs`: official SDK speech request; `elevenlabs_narration.py` handles audio and timing.
- `scripts/crowd_sound_design.py`: original score and ambience.
- `scripts/render_final.cjs`: guarded render and final audio/video assembly.

## Reference library

The [expanded reference study](references/studies/topic-range-2026-10-23/README.md) inspects six official episode case studies and 12 images across emotion, trust, war, collective action, future generations, and exploration. The earlier [website artwork study](references/studies/official-site/README.md) covers shape construction and a short amoeba loop.

All downloaded study illustrations are official Kurzgesagt artwork, not graphics generated for this channel. They are separate from our original production assets. YouTube playback remains blocked; the [reference catalog](references/catalog.json) records the three user-selected videos as not downloaded/viewed. Findings from accessible website text and images do not establish full-episode timing, narration, or sound design.

## Earlier tests

The star segment remains an explicitly unvoiced [visual preview](assets/videos/star-balance-20s-visual-preview.mp4); its [production record](docs/production/star-balance.md) describes that status. `npm run narrate` and `npm run render` still target the star profile, independently of the crowd test. `StarBalancePreview` and `StarBalance` remain separate compositions.

The older astronaut exports are historical review files. The four user-supplied character SVGs and their old rig remain retired; the active source uses original characters. See [ATTRIBUTION.md](ATTRIBUTION.md) for fonts, artwork, narration, and source records.

Finished MP4s and posters are tracked under `assets/videos/` and pushed for GitHub download. Temporary renders, credentials, caches, and frame extractions stay out of Git.
