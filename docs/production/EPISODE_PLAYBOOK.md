# Horror episode playbook (from Episode 1)

How Episode 1 was made. New episodes should match its quality. The reference implementation is `src/horror/ep01/` (world + `Episode01Viral.tsx`) and `docs/production/ep01-moon/README.md`.

## Standard the user set

- **Pixel 3D analog horror:** low-poly Three.js through `@remotion/three`, rendered at **180×320** and upscaled 6× nearest-neighbour. Add PS1 vertex snapping and Bayer dither (`src/horror/ps1.ts`, `SNAP6` in `ep01/world.tsx`), 32 px procedural textures, fog, and a light tape layer (chroma filter, noise and tracking band, scanlines, vignette).
- **Film-grade cinematography:** shot sizes chosen for purpose; one consistent modelled world so cuts keep their geography; framing through doors and windows; motivated light only; slow dollies and push-ins with hard cuts; withholding (never show the monster or face fully).
- **The picture tells the story.** Narration only confirms it. Write the beat list as images first.
- **The viral standard:**
  - a hook on frame 0 that addresses the viewer;
  - 45–60 s;
  - a seamless loop (the last frame flows into frame 0);
  - 3–4 hidden rewatch details;
  - one open question for the pinned comment.
- **Horror score (from Episode 6; the user said the earlier episodes had no audible eerie music):**
  - Build the score with `scripts/horror_score.py`, in the band phones play: a mid drone, tremolo strings, a detuned music-box theme, reversed swells, stingers, a heartbeat, a riser and bowed metal. Sub-bass alone is inaudible on phones.
  - Measure the music with `presence()`. Aim for about −8 to −12 dB against the voice during speech and −3 to −6 dB in the gaps. Duck about 7 dB under speech.
  - Put stingers in silence, never on a word. Open the voice timeline around big reveals. Add jolts, tape tears, point-of-view reveals and subliminal frames.
- **Sound sells it:** an original score (drone, dissonant pad, a motif that returns detuned), purposeful foley, and environmental storytelling in sound (the crickets that stop). Use Curio library cues where they fit, with provenance and FLAC stems committed.
- **Complete captions:** pager logic as in `Episode01Viral.tsx` (rows of at most 26 characters, at most 3 rows per page, timed proportionally). White with a full 8-direction dark edge, above the Shorts interface zone.

## Setup in a fresh container

```
npm ci
apt-get install -y espeak-ng mbrola mbrola-us2   # broadcast TTS voice
```

Rendering uses the pre-installed headless shell (`/opt/pw-browsers/chromium_headless_shell-*/…`) with `chromiumOptions: {gl: 'swangle'}` (software WebGL). Copy `scripts/render_ep01_viral.cjs` for a new episode.

## Pipeline

1. **Script and beats:** write the beat list (picture first), then the voice lines. Season scripts are in `docs/stories/season-1-shorts.md`. For true stories, follow its fact and sensitivity notes: no gore, no bodies, never name suspects. Re-check facts.
2. **Voice:** copy `scripts/ep01v2_voice.py`. Episode 2 uses MBROLA us1 for a distinct narrator; avoid us3, which lacks the `O2` phoneme and drops vowels ("gone", "on", "off"); watch espeak-ng's stderr for `unknown, replaced` warnings. MBROLA us2 for broadcast or text-to-speech roles; the line gaps are picture time. It writes `src/data/<ep>-timeline.json`. If the story needs a human narrator, ask the user for a Google Vids recording rather than faking one.
3. **World and shots:** build one coherent set and give each shot `{t, from/to pos+look, fov, roll}`. Drive every event from timeline times.
4. **Review stills** (`--stills`) and fix exposure, framing, readability and continuity (clocks and props must agree across cuts). Expect three or more passes.
5. **Sound:** copy `scripts/ep01v2_sound.py` (TV-speaker and outdoor voice treatments, score, foley, a soft limiter with loudness targeting to **−14 LUFS**). Check the voice-over-score margin per line from stems (aim for 4 dB or more). For a loop, snap every continuous tone, beat and LFO to whole cycles over the episode (`qf()` in `scripts/ep02_sound.py`), or the drone's beat phase makes a level jump at the seam. Check the peak of the **decoded AAC**, not the WAV: clipped buzzes overshoot the limiter after encoding (Episode 2's first pass hit +1.4 dBFS).
6. **Render:** x264 CRF 22 `-tune grain` keeps files under 50 MB for about 50 s. Check that the encoded file decodes and has the right frame count. Check the loop by comparing the last frames with frame 0.
7. **Captions:** `python3 scripts/caption_check.py <timeline> <mp4> <out>`, then read every page word for word against the script.
8. **Deliver:** MP4 and poster under `assets/videos/<ep>/`, production README, a publishing kit in `docs/publishing/<ep>/` (titles to A/B test, captions per platform, pinned comment, hashtags, hidden-detail list, posting notes), and an `AGENTS.md` entry. Commit, push, verify the remote, then share links. No listening pass is possible in this runtime; say so.
