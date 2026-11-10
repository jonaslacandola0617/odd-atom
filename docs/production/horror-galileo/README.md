# Analog-horror style test: Galileo probe "final transmission" (v1)

**Delivery:** `assets/videos/horror-galileo-v1/galileo-tape-24s.mp4` (1080×1920, 30 fps, 720 frames, 24.0 s, H.264 + AAC) with poster `galileo-tape-24s-poster.png`.
sha256: MP4 `65f919772e3fc9006984b731f10483637fa4bae09ad89a4af508b566945c028d`, poster `ff62bb68055994860d00b530e578b6d848c2d56d13bc05b144f94e5a344d4946`. It has **no user approval** yet.

## Why this style

The user rejected the flat illustration attempts (`docs/production/odd-atom-style-v2/v3-rejected.md`) and proposed a new direction on 2026-11-10: "analog horror type in pixel 3D rendered". Everything in this style is procedural: geometry, fog, lighting, pixelation and VHS damage. It plays to code, not hand drawing.

## Technique (`src/horror/`)

- Three.js through `@remotion/three`. The 3D renders at **270×480** and is upscaled 4× with nearest-neighbour sampling.
- `ps1.ts`: PS1-style vertex snapping (the "wobble"), a 4×4 Bayer dither with colour quantisation in every material, and tiny nearest-filtered procedural textures (64×32 Jupiter, 32×32 cloud decks with alpha holes).
- Low-poly models: a flat-shaded icosphere Jupiter, the probe (descent module, heat shield, parachute with shroud lines), plasma streaks and stacked cloud decks. Fog changes colour with depth, from ochre through rust and maroon to near-black. Lightning flashes light the fog from below.
- VHS layer: an SVG chromatic-aberration filter, a per-frame noise canvas with a rolling tracking band and dropouts, scanlines, a vignette, a whiteout on entry and frame-hold stutter, jitter and vertical roll during signal failure.
- The on-screen readout display is drawn on the low-res canvas and alpha-thresholded so every text pixel is hard. Readouts sit above the Shorts interface area.
- Rendering needs `--gl=swangle`, which the scripts set (software WebGL in this container).

## Story and facts

| Time | Picture | Readout |
|---|---|---|
| 0–5 s | Probe approaching a low-poly Jupiter | Title "GALILEO PROBE / FINAL TRANSMISSION"; 7 Dec 1995 |
| 5–10 s | Entry: heat shield glows, plasma streaks, shake, whiteout | Speed 47 km/s; deceleration up to 228 g |
| 10–21 s | Parachute descent through darkening cloud decks, lightning | Pressure 0.4 → 22 bar; temperature −143 → 150 °C |
| 18.7–21 s | Signal degrades: stutter, glitching numbers, vertical roll | "SIGNAL DEGRADED" |
| 21–24 s | Blue VCR screen | "SIGNAL LOST / IT KEPT TRANSMITTING FOR 58 MINUTES. / THEN THE HEAT AND PRESSURE DESTROYED IT." |

These are rounded public mission figures: entry about 47.4 km/s, peak deceleration about 228–230 g, parachute near 0.4 bar, last data near 22–23 bar and about 150 °C, about 58 minutes of data. The starting temperature and every in-between readout are interpolated for display, not mission data. The probe model, parachute and cloud colours are stylised.

No running mission timer is shown, following the project rule against timers. The date and readouts are diegetic telemetry. Remove them if the user does not want any on-screen data in this style.

## Sound

`python3 scripts/horror_galileo_sound.py` builds the mix. It combines new seeded synthesis (41 Hz drone with a slow pitch fall, wind, entry rumble, two thunder bursts, tape hiss) with Curio library cues (tape reel start, telemetry pings, suspense riser, low hits, boom, cable tension, radio search, terminal error, lost signal, radio-noise bed). Stems and `PROVENANCE.json` (file hashes, cue times and gains) are under `public/assets/audio/horror-galileo-v1/`. Integrated loudness is −16.6 LUFS with peaks at −1 dBFS. There is no voice-over; the on-screen text carries the story, as is common in the genre. No listening pass was possible in this runtime.

## Reproduce

`python3 scripts/horror_galileo_sound.py`, then `npm run still:horror-galileo` (stills to `out/oddatom/horror-galileo-v1/`), then `npm run render:horror-galileo`.

## Review of the encoded file

The full MP4 decodes without errors. Frames were sampled every 24 frames, every frame was checked across the entry flash (280–305), and every fourth frame across the failure (555–640). Known limits: frames around 14–15 s, between cloud decks before the first lightning, are very dark. The plasma streaks are simple boxes. The parachute canopy is mostly off the top of the frame early in the descent.
