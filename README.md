# Odd Atom — original explanatory animation

**Artwork passed; current focus is animation and narration.** The [motion study](references/studies/motion-2026-10-24/README.md) contains source-motion loops, dense frame sheets, timing/region measurements, official process evidence, and a [next-pass plan](docs/production/motion-next-pass.md). The approved drawings, background plates and current export were preserved unchanged during the study.

**Approved character master:** [View/download the static sheet](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/characters/static-test-01.png). The user approved these Mira and Sol designs; the latest film adapts them into animated illustrated cutouts.

The latest test is **Alone in a crowd with the approved characters**: a 20-second, 1920 × 1080, 30 fps Remotion film about proximity and connection. Mira and Sol have separate head, body, and arm layers, matching illustrated environments, and the existing generated ElevenLabs narration, aligned captions, original music, and ambience.

**[Download the approved-character 20-second MP4](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/approved-characters-20s.mp4)** · [Poster](assets/videos/approved-characters-20s-poster.png) · [Approved-sheet/animation comparison](docs/production/approved-characters.md)

The [earlier artwork audit](docs/production/artwork-audit/README.md) and [previous rebuild](docs/production/crowd-rebuilt.md) remain as historical comparisons. The current approved master guides the character drawing. Technical delivery is not evidence of comparable visual quality.

## What was built and reviewed

The approved faces, hair, hoodie, sweater, trousers, and hands are retained in adapted transparent illustration layers. The test animates head tilts/nods, breathing, shoulder-pivot gestures, eye-area blinks, an expression change during a blink, and a cup response. Three shots move from a twilight crowd to a garden conversation and closer reaction. The opening title has layered outline passes and captions stay below the action. No production labels or branding appear in the film.

The [review](docs/production/approved-characters.md) compares the approved sheet with actual MP4 frames and includes sequence, acting, and blink-detail boards. The source sheet is unchanged. This is a limited cutout rig, with its scope and source-generation records documented.

## Install and render

Use Node.js 24.5 or newer, Python 3, FFmpeg, and Chromium. Cloud render commands use `/usr/bin/chromium`; use your local browser path on another system.

```sh
npm ci
npm run typecheck
npm run dev
```

Select `ApprovedCharactersTest` in Remotion Studio. The committed artwork, narration and audio stems allow offline re-rendering without new image or speech requests:

```sh
npm run render:approved-characters
```

The final render command checks the narration provider, generated status, and audio file. It renders 600 frames, mixes the original PCM stems into AAC, preserves the H.264 picture, and writes an MP4 with exact 20-second track timing and fast-start metadata.

Optional sound regeneration:

```sh
npm run sound:crowd
```

Sound regeneration needs NumPy. The current transparent art atlases and background PNGs are under `public/assets/artwork/approved-characters/`; prompts and hashes are in `docs/production/approved-characters/`. Older SVG character/set exports remain historical comparison material.

## ElevenLabs narration

The official `@elevenlabs/elevenlabs-js` SDK is connected and live generation has succeeded. Keep `ELEVENLABS_API_KEY` in secure environment settings under that exact name. The build-time client reads it automatically and is separate from the Remotion browser bundle. Keys are never stored in code or media assets.

To generate new narration after editing the crowd script:

```sh
npm run narrate:crowd
npm run sound:crowd
npm run render:approved-characters
```

Narration generation uses account credits. An optional `ELEVENLABS_VOICE_ID` selects another account-accessible voice; otherwise the project uses George with `eleven_multilingual_v2`. The returned character timestamps drive caption and scene timing. Tempo fitting is limited to a 10% slowdown or a 15% speedup; a longer read is rejected. Failed responses preserve existing narration.

## Source map

- `src/ApprovedCharacters.tsx`: current illustrated cutout rig, sequence, shot framing, gestures, and captions.
- `public/assets/artwork/approved-characters/`: current transparent image atlases and background plates.
- `scripts/review_approved_characters.py`: encoded-frame comparisons and validation.
- `src/Connection.tsx`, `src/art/ConnectionArt.tsx`: previous vector rebuild retained for comparison.
- `src/Crowd.tsx`, `src/characters/Citizen.tsx`, `src/art/City.tsx`: previous rejected test retained for comparison.
- `src/data/crowd-narration.json`: script, generated status, aligned captions, and story cues.
- `scripts/elevenlabs_narration.mjs`: official SDK speech request; `elevenlabs_narration.py` handles audio and timing.
- `scripts/crowd_sound_design.py`: original score and ambience.
- `scripts/render_final.cjs`: guarded render and final audio/video assembly.

## Reference library

The [expanded reference study](references/studies/topic-range-2026-10-23/README.md) inspects six official episode case studies and 12 images across emotion, trust, war, collective action, future generations, and exploration. The earlier [website artwork study](references/studies/official-site/README.md) covers shape construction and a short amoeba loop.

All downloaded study illustrations are official Kurzgesagt artwork, not graphics generated for this channel. They are separate from our original production assets. YouTube playback remains blocked; the [reference catalog](references/catalog.json) records the three user-selected videos as not downloaded/viewed. Findings from accessible website text and images do not establish full-episode timing, narration, or sound design.

## Earlier tests

The previous [vector rebuild](docs/production/crowd-rebuilt.md) uses `CrowdRebuilt` and `npm run render:crowd-rebuilt`; it is separate from the approved-character composition.

The star segment remains an explicitly unvoiced [visual preview](assets/videos/star-balance-20s-visual-preview.mp4); its [production record](docs/production/star-balance.md) describes that status. `npm run narrate` and `npm run render` still target the star profile, independently of the crowd test. `StarBalancePreview` and `StarBalance` remain separate compositions.

The older astronaut exports are historical review files. The four user-supplied character SVGs and their old rig remain retired; the active source uses original characters. See [ATTRIBUTION.md](ATTRIBUTION.md) for fonts, artwork, narration, and source records.

Finished MP4s and posters are tracked under `assets/videos/` and pushed for GitHub download. Temporary renders, credentials, caches, and frame extractions stay out of Git.
