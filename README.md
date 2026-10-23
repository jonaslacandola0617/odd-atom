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

Live inspection of Kurzgesagt's long-form channel and official site is still blocked by the environment's network proxy. The uploaded reference files previously studied are vertical shorts. The current treatment is an original production proposal; it is not claimed to be a completed study of the channel's long-form work or equivalent studio quality. See [production notes](docs/production/star-balance.md).

The user's three newly selected long-form reference links are saved in the [reference library](references/README.md), with per-video download/viewing status in [the catalog](references/catalog.json). All three download attempts are currently blocked by the network proxy.

## Install and preview

Use Node.js 22 or newer and Chromium. Cloud scripts use `/usr/bin/chromium`; on another system, replace that executable path with the local Chrome/Chromium path.

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

The environment draft now declares `ELEVENLABS_API_KEY` as a secure requirement for `api.elevenlabs.io` and adds network destinations needed for ElevenLabs and channel research. Review and save those changes in environment settings, supply the key securely there, then publish the environment. Draft saving alone does not apply the settings to a running machine. Never paste the key in chat or add it to Git.

An optional non-secret `ELEVENLABS_VOICE_ID` selects a different account-accessible voice. Otherwise the script uses ElevenLabs' documented stock voice ID `JBFqnCBsd6RMkjVDRZzb` with `eleven_multilingual_v2`. No voice cloning is performed.

Once the key and network access are available:

```sh
npm run narrate
npm run render
```

The narration script makes an authenticated ElevenLabs request with character timestamps, writes the audio to `public/assets/audio/star-balance/narration.wav`, and updates the caption and story-beat timing in `src/data/star-narration.json`. The animation maps its principal transitions to those returned story beats. A small bounded speed adjustment may fit the read into 20 seconds; a read requiring more than 15% acceleration is rejected.

The final narrated output will be `assets/videos/star-balance-20s.mp4`. That file is not generated until ElevenLabs succeeds. The final-render command checks the provider, generated status, and audio file before invoking Remotion. The composition also enforces the requirement when invoked directly.

The ElevenLabs generation path and live channel inspection remain unverified until access is enabled. Local missing-key handling and the final-export guard have been exercised; neither produces substitute speech.

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
- `scripts/elevenlabs_narration.py`: secure ElevenLabs narration generation.
- `scripts/render_final.cjs`: final export guard and render command.
- `scripts/export_character.cjs`: original SVG export from the rig.
- `scripts/star_sound_design.py`: original score and effects.

Final exports and posters are tracked under `assets/videos/` and pushed for GitHub download. Temporary render checks remain under the ignored `out/` directory.
