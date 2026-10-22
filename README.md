# Odd Atom

An original science-animation project built with React and Remotion.

The first pilot, **Why astronauts float**, is a 12-second, 1080 × 1920, 30 fps video. It uses the supplied astronaut and bird artwork, animated vector paths and expressions, a projected Earth, synchronized captions, locally generated neural narration, an original synthesized score, and timed sound effects.

**[Download the pilot MP4](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/why-astronauts-float.mp4)** · [View the video on GitHub](assets/videos/why-astronauts-float.mp4)

Final video exports are committed under `assets/videos/` so they can be downloaded from the repository. Temporary renders and review files remain in the ignored `out/` directory.

## Run and render

Node.js 22 or newer and Chromium are recommended. The cloud environment has Chromium at `/usr/bin/chromium`, which the scripts use explicitly.

```sh
cd /workspace/odd-atom
npm ci
npm run dev
```

Remotion Studio prints its selected port, normally 3000, and chooses another if that port is busy. Select the `Orbit` composition to scrub the animation or adjust it. Rendering uses the bundled local assets and does not call a voice service or download fonts.

```sh
npm run typecheck
npm run render
npm run still
```

Outputs:

- `assets/videos/why-astronauts-float.mp4` — H.264 video with AAC audio, 360 frames, 12 seconds.
- `assets/videos/why-astronauts-float-poster.png` — a full-resolution opening still.

On another operating system, replace `--browser-executable=/usr/bin/chromium` in the commands with the installed Chrome/Chromium executable. The repository includes its own writable npm cache setting for this cloud environment.

## Character assets

The four original SVG files are stored without modifying their bytes:

| Uploaded name | Repository path |
|---|---|
| MALE ORDINARY.svg | `public/assets/characters/male-ordinary.svg` |
| BIRD.svg | `public/assets/characters/bird.svg` |
| ASTRONAUT.svg | `public/assets/characters/astronaut.svg` |
| FEMALE ORDINARY.svg | `public/assets/characters/female-ordinary.svg` |

The pilot uses the astronaut and bird. Both ordinary characters are available for future episodes. The astronaut file is a sheet containing a suit and several helmet expressions; only the appropriate elements are used in the composition.

`python scripts/prepare_characters.py` regenerates `src/generated/characters.json` from the originals using Python's standard library. The astronaut's connected paths share a smooth deformation field, which bends arms and legs without separating their vector seams. The supplied helmet expressions are aligned to a shared head anchor. The bird has independent wing and leg motion. All movement is derived from the Remotion frame number and renders deterministically.

## Pilot story

| Time | Beat |
|---|---|
| 0–2.5 s | “Why don't astronauts fall?” An astronaut drifts above Earth's horizon; the bird reacts from a porthole. |
| 2.5–3.6 s | “They do.” A surprised reaction punctuates the reveal. |
| 3.6–5.95 s | “Gravity still pulls them down.” The scene pulls back to Earth and an inward gravity arrow. |
| 5.95–10.25 s | “But they move sideways so fast, they keep missing Earth.” A tangent velocity arrow and a growing orbit trail demonstrate the motion. |
| 10.25–12 s | “That's an orbit.” The explanation resolves with the orbit and a happy expression. |

In a simplified circular orbit, gravity points toward Earth's center while velocity is tangent to the orbit. The astronaut and spacecraft are in continuous free fall. The diagram deliberately exaggerates altitude and playback speed, as stated on screen. It illustrates direction and the orbital idea; it is not a numerical orbital simulation. It does not imply that every sideways speed produces a stable orbit.

Further reading: NASA, [What Is Microgravity?](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-microgravity-grades-5-8/). This page could not be fetched from the current environment's network; no claim is made that it was inspected during production. The explanation uses standard orbital mechanics and introduces no new numerical science claims. This is an original evergreen topic selection, not a claim of verified current social-platform trends.

## Audio and editable sources

The final WAV stems live in `public/assets/audio/`. Keep them with the project; they are ready for repeated renders without generating speech again.

- `narration.wav`: synthetic English voice generated locally with Kokoro-82M, voice `am_michael`. It is a stock model voice, not a clone of a reference narrator.
- `music.wav`: original deterministic synthesized harmony, bell melody, and soft rhythmic pulse.
- `sfx.wav`: original synthesized transitions, reveal accents, and bird chirps.

Speech timing is recorded in `src/narration-timing.json`. To optionally regenerate narration, install `kokoro-onnx` and `numpy` in a Python environment, obtain the official Kokoro ONNX model and voice files, and run:

```sh
python scripts/generate_narration.py /path/to/model-directory
python scripts/sound_design.py
```

The model directory must contain `kokoro-v1.0.onnx` and `voices-v1.0.bin`. The large model weights are not committed. See [ATTRIBUTION.md](ATTRIBUTION.md) for their official distribution and licenses. Normal development and video rendering only require `npm ci`; Python audio tooling is optional.

## File map

- `src/Orbit.tsx`: sequence timing, scene layout, typography, orbital graphics, captions, and sound stems.
- `src/Characters.tsx`: original-character animation and expression alignment.
- `src/Earth.tsx`: rotating orthographic globe with land projection and atmosphere.
- `src/Root.tsx`: composition dimensions, fps, and duration.
- `scripts/`: asset preparation and optional sound regeneration.
- `public/assets/`: original character files, font license, and retained audio.

No reference-video artwork, narration, music, or sound recordings have been reused in this pilot. Final MP4s and posters are retained in Git alongside source assets and the lockfile. Temporary review outputs and dependency caches are ignored.
