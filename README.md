# Odd Atom — long-form science animation

The current test is **The battle inside a star**: a 20-second, 1920 × 1080, 30 fps landscape segment built with Remotion. It introduces inward gravity, a stellar-core cutaway, hydrogen fusion, and outward pressure.

**Narration status: ElevenLabs is required and currently pending.** There is no replacement narrator. The exported visual preview has original music, effects, and provisional reading captions. It must not be represented as the completed narrated test.

**[Download the 20-second visual preview](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/star-balance-20s-visual-preview.mp4)** · [View the preview file](assets/videos/star-balance-20s-visual-preview.mp4)

## Character and direction

The four supplied character SVGs and their rig were removed at the user's request. The active project uses **Ember**, an original personified star drawn as editable SVG geometry. Its two arms use two-bone inverse kinematics, with connected wrists and independently posed hands. Its eyes, brows, smile, gaze, body compression, surface motion, and cutaway are controlled separately.

- Original neutral character: `public/assets/characters/ember.svg`.
- Editable animated rig: `src/characters/Ember.tsx`.
- Character SVG export: `npm run character`.

This is a landscape segment intended to test a longer explanatory-video format. On-screen text is limited to the opening story title, the mechanism/force labels, and short white narration captions. No branding overlays, episode codes, timers, progress bars, taglines, or production notes appear in the video.

The official studio website is accessible; the [website artwork study](references/studies/official-site/README.md) records the actual references inspected. YouTube long-form episodes remain blocked by the environment's network proxy. The uploaded video references previously studied are vertical shorts. The current treatment is an original production proposal; it is not claimed to be a completed study of the channel's long-form work or equivalent studio quality. See [production notes](docs/production/star-balance.md).

The user's three newly selected long-form reference links are saved in the [reference library](references/README.md), with per-video download/viewing status in [the catalog](references/catalog.json). All three download attempts are currently blocked by the network proxy.

The [expanded reference study](references/studies/topic-range-2026-10-23/README.md) examines six official episode case studies and 12 images across human emotion, trust, war, collective action, future generations, and exploration. The boards display downloaded official artwork; they are not original graphics generated for this channel. Full-episode motion and audio analysis remains pending YouTube access.

## Install and preview

Use Node.js 24.5 or newer, Python 3, FFmpeg, and Chromium. The narration command uses Node's environment-proxy routing and system certificate store. Cloud render scripts use `/usr/bin/chromium`; on another system, replace that executable path with the local Chrome/Chromium path.

```sh
cd /workspace/odd-atom
npm ci
npm run typecheck
npm run dev
```

In Remotion Studio, select `StarBalancePreview` to inspect the visual test. `StarBalance` requires generated ElevenLabs narration and deliberately refuses to render while that requirement is pending.

```sh
npm run render:preview
npm run still
```

Tracked review outputs:

- `assets/videos/star-balance-20s-visual-preview.mp4` — 600-frame landscape visual test, with music and effects but no voice.
- `assets/videos/star-balance-20s-poster.png` — poster from the visual test.

The older `why-astronauts-float` MP4 is an archived review export. Its retired source characters and rig are not part of the current pipeline. Removing current character assets does not rewrite Git history or alter old video files.

## Enable ElevenLabs narration

The official `@elevenlabs/elevenlabs-js` SDK is installed and connected to the narration pipeline. The current `ELEVENLABS_API_KEY` binding has passed ElevenLabs CLI authentication. Speech generation has not yet been tested, and the preview remains unvoiced.

Keep the key in secure environment settings under the exact name `ELEVENLABS_API_KEY`. The SDK reads it automatically; there is no key literal or environment-file reader in the application. Never paste the key in chat or add it to Git. This build-time client is separate from the Remotion browser bundle.

An optional non-secret `ELEVENLABS_VOICE_ID` selects a different account-accessible voice. Otherwise the script uses ElevenLabs' documented stock voice ID `JBFqnCBsd6RMkjVDRZzb` with `eleven_multilingual_v2`. No voice cloning is performed.

To generate the narration and render the finished segment:

```sh
npm run narrate
npm run render
```

The JavaScript entry point uses `ElevenLabsClient.textToSpeech.convertWithTimestamps`. It passes the generated audio and character alignment to the existing Python/FFmpeg processor, which writes `public/assets/audio/star-balance/narration.wav` and updates the caption and story-beat timing in `src/data/star-narration.json`. The animation maps its principal transitions to those returned story beats. A small bounded speed adjustment may fit the read into 20 seconds; a read requiring more than 15% acceleration is rejected. Failed requests do not replace existing narration, and SDK error objects are not logged because they can contain request credentials.

The final narrated output will be `assets/videos/star-balance-20s.mp4`. That file is not generated until ElevenLabs succeeds. The final-render command checks the provider, generated status, and audio file before invoking Remotion. The composition also enforces the requirement when invoked directly.

The SDK request serialization and timestamp response mapping were checked offline with a mocked response. TypeScript and script syntax checks passed. CLI authentication succeeded; live speech generation and the narrated export still need an end-to-end test. YouTube inspection remains separately blocked.

## Sound and sources

`public/assets/audio/star-balance/music.wav` and `sfx.wav` are original synthesized stems. They are retained for offline rendering. Optional regeneration needs Python, NumPy, and FFmpeg:

```sh
npm run sound
```

There are no large speech-model weights, external audio-service credentials, downloaded reference videos, or dependency caches committed to the project. See [ATTRIBUTION.md](ATTRIBUTION.md) for the local font licenses and source records.

## Main files

- `src/StarBalance.tsx`: landscape scene composition, camera/layout changes, force arrows, core detail, and captions.
- `src/characters/Ember.tsx`: original star and its animation controls.
- `src/IllustratedTitle.tsx`: layered title lettering; ordinary diagram labels use plain rounded type.
- `src/data/star-narration.json`: script, pending/generated state, caption alignment, and story beats.
- `scripts/elevenlabs_narration.mjs`: official ElevenLabs SDK client and timestamped speech generation.
- `scripts/elevenlabs_narration.py`: internal audio fitting, normalization, captions, and scene timing.
- `scripts/render_final.cjs`: final export guard and render command.
- `scripts/export_character.cjs`: original SVG export from the rig.
- `scripts/star_sound_design.py`: original score and effects.

Final exports and posters are tracked under `assets/videos/` and pushed for GitHub download. Temporary render checks remain under the ignored `out/` directory.
