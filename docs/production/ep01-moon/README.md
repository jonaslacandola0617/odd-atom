# Episode 1: "Do Not Look at the Moon" (test v1)

**Delivery:** `assets/videos/ep01-moon-v1/ep01-do-not-look-at-the-moon.mp4` (1080×1920, 30 fps, 2,436 frames, 81.2 s, H.264 CRF 22 tuned for grain, AAC; sha256 `bc5cc022de5457a5d7e62d062cc6e3a0a6463af00a9c97fe22ce3f397cfabc45`) with its poster. It is the first test of the new channel format and has **no user approval** yet.

**Source:** `Ep01DoNotLookAtTheMoon` in `src/horror/ep01/` (`world.tsx` holds the set, people and props; `Episode01.tsx` holds the shots, lighting cues, screens and overlay). The story is the original script #8 in `docs/stories/season-1-shorts.md`, cut into broadcast lines.

## Story told by the picture

The broadcast voice gives the instructions. The picture shows what happens to one family, and the instructions are the ones they break:

1. A TV in a dark room shows **DO NOT LOOK AT THE MOON** from the first frame.
2. Mother alone on the couch in the TV glow; the open curtains behind her.
3. A quiet street. Crickets.
4. Insert of the VCR clock: **10:39**, three minutes before moonrise.
5. She turns to the open window.
6. Point of view out of the window: the neighbours' curtains close one by one.
7. She closes our curtains.
8. A neighbour hurries home with his head down and shuts his door.
9. Insert of the phone: **MARK: "look at this"**, with an almost white photo. She turns it face down. *Mark has looked; nobody says so.*
10. She turns towards the kitchen.
11. A slow dolly through the dark kitchen to the glass back door: Mark in the yard, back to us, staring east.
12. Behind Mark in the yard: no crickets now, only wind. His head tilts further than a head should.
13. Insert of the handle: it turns from outside, and the door opens a crack of pale light.
14. Dutch angle: she sits facing the TV; Mark stands in the kitchen doorway behind her.
15. Extreme wide over the rooftops: the light rising in the east, far too big. Every window is dark.
16. Her face in the TV glow. Mark is now standing right behind the couch and leans closer. *"Closer" is shown, not said.*
17. The TV rolls and dies. Silence, and the clock.
18. Dark room lit only by the glowing curtains. The voice continues, but now from **outside**.
19. Close-up of the curtains: a head and shoulders pressed against the other side.
20. Black. Silence. Then the sound of curtain rings sliding open.

## Cinematography choices

- **Shot sizes vary with purpose:** extreme close-up for information (TV, clock, phone, handle), wide shots for geography and dread (room, street, rooftops), medium close-up for reaction (mother).
- **Consistent geography:** one modelled house and street. The window, kitchen, back door and east are always in the same place, so cuts make spatial sense.
- **Framing through things:** the window frame and curtains, the kitchen door frame, the glass back door. The viewer is kept inside the house with her.
- **Motivated light only:** a flickering blue key from the TV, warm street lamps, and a pale green-white light from the east that grows through the film (back-door spill, then the curtains). When the TV dies the scene loses its key light.
- **Camera movement:** slow dollies and push-ins only, plus a barely visible operator drift, with hard cuts between shots. One dutch angle at the moment the house stops being safe.
- **Withholding:** Mark's face is never shown, and neither is the full thing in the sky. A head's shadow on the curtain is enough.
- **Text:** only on-screen diegetic text (the alert card, its crawl, the clock, the phone) plus narration captions sitting above the Shorts interface zone.

## Look

- 3D renders at **180×320**, upscaled 6× with nearest-neighbour sampling. This is more pixelated than the 270×480 Galileo test, as the user asked.
- PS1 vertex snapping, Bayer dither with colour quantisation, 32 px nearest-filtered procedural textures, low-poly people.
- A light tape layer: chromatic offset, overlay noise with a slow tracking band, scanlines and a vignette. It is heavier while the TV dies.

## Sound (`scripts/ep01_voice.py`, `scripts/ep01_sound.py`)

- **Voice:** espeak-ng with the MBROLA us2 diphone voice, chosen for the classic emergency-alert text-to-speech sound. It plays through a TV-speaker band-pass with saturation and a small room. For the last two lines it is muffled behind glass, in a large outdoor space and quieter, because it is now outside the window. Line timings drive the edit.
- **Broadcast:** a SAME-style data burst, the dual-tone 853+960 Hz attention signal, TV hum and hiss, roll static and a CRT power-off.
- **Original score:** a beating D1/A1 drone; a D–E♭–A cluster pad, with a G♯ tritone added at the reveal; and an inharmonic music-box lullaby. The lullaby returns slower and a semitone flat behind her. There is a reversed swell and dead silence just before the doorway hit, and a tinnitus tone over the light.
- **Foley:** curtain rings and fabric (near and distant), footsteps and a door, a phone buzzing on wood, a wall clock that keeps ticking after the TV dies, and floor creaks. Crickets play in every exterior shot **except the yard**, where they have stopped.
- **Library:** steel latch, heavy hinge, wood stress, heartbeat/breath, low wind, low cinematic hit and restrained boom from the Curio library. Provenance and hashes are in `public/assets/audio/ep01-moon/PROVENANCE.json`. Stems are committed.
- **Mix:** −13.9 LUFS integrated, peaks at −1 dBFS. The voice sits 4–12 dB above the score on every line, measured from stems.
- No listening pass was possible in this runtime, so the balance is measured, not auditioned.

## Reproduce

`python3 scripts/ep01_voice.py`, then `python3 scripts/ep01_sound.py`, then `node scripts/render_ep01.cjs --stills` and `node scripts/render_ep01.cjs`. This needs `espeak-ng mbrola mbrola-us2` (apt) and software WebGL (`gl: 'swangle'`, set in the script).

## Review of the encoded file

- The full MP4 decodes without errors: 2,436 video frames, 81.216 s, with audio.
- A contact sheet sampled every 45 frames was inspected shot by shot, after three still-review passes. Those passes fixed exposure, TV framing, the upside-down phone text, the hair at the back of Mark's head, the handle insert, the doorway composition and the curtain gap.
- Continuity fix: the VCR clock now reads 10:40 when the TV dies. Frames 2010–2085 were re-rendered and spliced in; rendering is deterministic, so the joins match.
- Known limits: the street establishing shot (8.6–12 s) is dark and the least readable shot. The rooftop reveal is a near-static hold. Faces are deliberately minimal (PS1 style), which reads as uncanny. There is still no listening pass.

# Viral cut (v2), 2026-11-10

The user asked to build the episode as viral content. This is a separate composition, `Ep01ViralCut` (`src/horror/ep01/Episode01Viral.tsx`), on the same world; v1 is unchanged.

**Delivery:** `assets/videos/ep01-moon-v2/ep01-viral-cut.mp4`: 1080×1920, 30 fps, 1,473 frames, 49.1 s, sha256 `1bcf80886d1df7ea0d113b28f0ed8398a7e46b1d2ea7dd70ea657b2a0420ab6c`. Poster: `ep01-viral-cut-poster.png` (Mark behind her). Publishing drafts are in `docs/publishing/ep01/README.md`. It has no user approval yet.

- **Hook:** the attention tone and the "DO NOT LOOK AT THE MOON" card on frame 0. The first spoken line addresses the viewer: "If you are seeing this, close your curtains. Now."
- **Length:** 49 s instead of 81. Nine tighter lines (`scripts/ep01v2_voice.py`). The street establishing shot and the neighbour were cut; every story beat is kept.
- **Seamless loop:** black, then the curtain rings in the dark, then a data burst, then the TV turns itself back on. The final frames use frame 0's camera and the TV card running on "negative" time, so the last frame flows into the first. Drone, pad, clock and room tone end at their opening level. Verified by comparing frames 1466–1472 with frames 0–4 of the encoded file.
- **Hidden rewatch details:** a stranger under the street lamp already staring east with his head tilted; a figure inside Mark's white photo; the clock jumping from 10:39 to 10:42 (lost time), then back to 10:39 at the loop; the curtain shadow tilting its head like Mark.
- **Sound** (`scripts/ep01v2_sound.py`): the same synthesis tools as v1, re-mapped to the new cut. Loudness-targeted to −14.0 LUFS with a soft limiter (peak −1.9 dBFS). The voice sits 6–12 dB above the score on every line. No listening pass.
- **Known limits:** the hand turning the phone over is a crude block for about half a second. The rooftop reveal is mostly a hold.

## Caption fix (2026-11-10)

The user asked to make sure the captions are complete. The overlay used to keep only the **last three wrapped rows** of a line, so the opening words of long lines were dropped: one line in the viral cut (`l04`) and four in v1 (`l04`, `l05`, `l06`, `l10`). Long lines are now split into balanced pages of at most three rows, each timed across the spoken line in proportion to its characters. The two "outside" lines also changed from pale green to white with a full eight-direction dark edge, because the final line washed out on the glowing curtains.

Verification: one frame per caption page was extracted from the **encoded** viral cut, at each page's midpoint, and checked word for word against the script. All 10 pages are complete. The check script is session-local: it extracts frames at page midpoints and tiles them.

v1 (81 s) was fully re-rendered with the same caption fix; the clock fix is now in the source, so no splice was needed. All 17 caption pages were checked in the encoded file and are complete.
