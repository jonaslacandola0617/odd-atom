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
2. **Voice (from Episode 7: ElevenLabs is the standard):** copy `scripts/ep07_voice.py`. Price with `estimate_only`, generate the whole narration as **one** take (true cases: Jack `BVPhWQykET1TSvfGzrUr`; fiction: True `tZssYepgGaQmegsMEXjK`; `eleven_v4`, `[long pause]` between lines), split it with `scripts/eleven_split.py`, and build the timeline from the real line durations before any picture work. A small atempo (≤1.06×) is fine to fit 60 s; for a slow read, shorten the pauses *inside* each line to about 0.35 s first (`tighten()` in `scripts/ep08_voice.py`). In the sound script, match lines by **RMS, not peak** (whispered lines otherwise sit under the music), then lift any line under 4.5 dB. The free tier often starts only one of two takes ("busy") or refuses with an "unusual activity" warning; never retry inside a turn. A diegetic voice (a TV, a tape) can be MBROLA through a speaker chain. Earlier MBROLA notes: copy `scripts/ep01v2_voice.py`. Episode 2 uses MBROLA us1 for a distinct narrator; avoid us3, which lacks the `O2` phoneme and drops vowels ("gone", "on", "off"); watch espeak-ng's stderr for `unknown, replaced` warnings. MBROLA us2 for broadcast or text-to-speech roles; the line gaps are picture time. It writes `src/data/<ep>-timeline.json`. If the story needs a human narrator, ask the user for a Google Vids recording rather than faking one.
3. **World and shots:** build one coherent set and give each shot `{t, from/to pos+look, fov, roll}`. Drive every event from timeline times.
4. **Review stills** (`--stills`) and fix exposure, framing, readability and continuity (clocks and props must agree across cuts). Expect three or more passes. Lessons from Episode 7: put a screen plane *in front of* its bezel box; never start a camera inside a prop (a point of view "from the TV" must sit in front of the glass); wide panels (meters, signs) get cropped by the 9:16 frame, so stack them vertically; a 64×48 screen texture needs the camera at least ~0.3 m back; far landmarks need a solid silhouette and glowing lights to survive 180×320. From Episode 8: a POV knock against a wall reads as a blank frame, so shoot actions on a wall in three-quarter from a few metres back; a "seeing through walls" effect is best drawn as a heat map on the wall's own surface, blurred, never as a hard silhouette. From Episode 9: check that props on a cliff or wall actually sit outside the rock mass (inside, they render grey or black), and that a tall landmark clears the near edge of what it stands on from the camera's height. From Episode 10: on terrain, aim cameras with a height above the local ground (`gnd()`), and pick the hero prop (the lamp hut) by measured clearance in front of it; a hut on a slope sinks into the ground and blocks the view. A night-then-dawn pair reads best as the same framing, first lit, then empty.
5. **Sound:** copy `scripts/ep01v2_sound.py` (TV-speaker and outdoor voice treatments, score, foley, a soft limiter with loudness targeting to **−14 LUFS**). Check the voice-over-score margin per line from stems (aim for 4 dB or more). For a loop, snap every continuous tone, beat and LFO to whole cycles over the episode (`qf()` in `scripts/ep02_sound.py`), or the drone's beat phase makes a level jump at the seam. Check the peak of the **decoded AAC**, not the WAV: clipped buzzes overshoot the limiter after encoding (Episode 2's first pass hit +1.4 dBFS). When frame 0 opens under a line, the score there is ducked; ease the score down by the same amount over the last loop shot (Episode 9: 2.6 dB) or the seam jumps. For the biggest loss, silence is the scare: in Episode 10 the crickets and the heartbeat stop with the lamp, then the whole mix holds black for 0.45 s. Fix an overshoot by lowering the limiter ceiling and re-targeting the loudness (`scripts/ep07_sound.py`), not by pulling the whole mix down, which leaves it under −14 LUFS.
6. **Render:** x264 CRF 22 `-tune grain` keeps files under 50 MB for about 50 s. Check that the encoded file decodes and has the right frame count. Check the loop by comparing the last frames with frame 0.
7. **Captions:** `python3 scripts/caption_check.py <timeline> <mp4> <out>`, then read every page word for word against the script.
8. **Deliver:** MP4 and poster under `assets/videos/<ep>/`, production README, a publishing kit in `docs/publishing/<ep>/` (titles to A/B test, captions per platform, pinned comment, hashtags, hidden-detail list, posting notes), and an `AGENTS.md` entry. Commit, push, verify the remote, then share links. No listening pass is possible in this runtime; say so.

## Season 2 horror standard (from 2026-11-11)

The user asked for Season 2 to be "more scary and spooky" than Season 1. The stories are in `docs/stories/season-2-philippines.md`.

**What the Season 1 contact sheets show:** contact sheets of Episodes 5, 8 and 10 (one frame every 4 s) give a fair read of the season. The rules below answer each problem.
- **Too bright and flat:** whole shots of white snow, grey walls and plain sky; average exposure is high and the blacks are lifted.
- **No entity, ever:** the dread is all implied (a handprint, an empty tent, a lamp going out). That is good, but nothing ever looks back at the viewer.
- **Figures are toy-like:** blocky people read as Minecraft, not menace.
- **The camera is locked off or on smooth dollies:** nothing feels like someone is holding it.
- **Captions cover the centre of the frame:** they sit where the scare should be.

### Picture

1. **Darker key, motivated light.**
   - Except for the reveal and deliberate day shots, the average luma of every shot should be **≤ 45/255** (Season 1 often ran at 90–140). Measure it from the review stills, per shot.
   - Every light has a source in frame or just off it: a dashboard, a gasera (oil lamp), a single bulb, a flashlight, a karaoke screen, a jeepney's fluorescent tube, the moon through capiz (translucent shell) windows. Pools of light separated by true black.
   - Grade: cold blue-green in the shadows, warm tungsten in the practicals, red only for danger.
2. **Withhold, then reveal once, clearly.**
   - Until the reveal, show the entity only at the edges: hair over a headrest, a shadow on capiz, legs in the banana trees, an ember in a tree, a figure one shot early in a wide.
   - Then give **at least one clear, well-lit, held reveal (0.8–1.5 s)** per episode: lit from a practical, framed close, with a stinger in the silence just before or after it.
   - A face is half-seen at most, apart from that one reveal.
3. **Entity design inside the PS1 look (`src/horror/entities.tsx`, to be built with Episode 11):**
   - **Proportions are wrong by a little:** necks too long, arms past the knees, a head tilted further than a neck allows. Human-ish silhouettes beat monsters.
   - **Hair:** long black hair is 40–80 thin, vertex-snapped strips with a slow sway, covering most of the face. It is the white lady's main shape at 180×320.
   - **Faces:** a pale, low-poly mask with **dark, unlit eye sockets** and a tiny point of reflected light. Mouths are slightly open, a little too wide. Shading is flat; unlit black does the work.
   - **Signature shapes:**
     - the white lady: hair, a white dress with a ragged hem;
     - the manananggal: a torso with membrane wings (thin planes with visible "finger" bones) and an empty waist that stays a clean black void, never gore;
     - the tiyanak: a baby's body with an old face;
     - the tikbalang: knees above its head, a long horse face;
     - headless figures: a clean collar with nothing above it.
   - **No gore anywhere.** Fear comes from shape, stillness and wrongness.
4. **Camera that someone is holding.** Add a `handheld(t, amount)` offset (layered noise, about 0.3–0.8° rotation and 1–3 cm drift) on POV and investigation shots. Keep locked-off frames for dread and for empty doorways. Keep push-ins slow (2–5 s) on empty doors, windows, gaps between roof slats and mirrors.
5. **Things that move when you look away.** At least once an episode, a figure changes position between two cuts of the same framing: three beds closer, a chair turned, every seat down. The second shot must match the first framing exactly, so the change is the only difference.
6. **Reflections.** Use rear-view mirrors, windows, capiz panes, black water and dark screens as second frames. Render a reflection as a second camera into a render target (or a mirrored copy of the scene), so the figure can be in the reflection and not in the room.
7. **Light failure.** Flicker means a bulb or lamp dropping out at irregular intervals (a seeded random sequence, never a sine). Dead bulbs and a lamp flame that leans towards the danger. The reveal often lands on the flicker's return.
8. **Subliminal frames.** One or two 2–4-frame inserts per episode (the face, the figure in a doorway). Never on a word, and never more than two, or they become a pattern.
9. **Filipino settings, rendered with care.** Jeepney and taxi interiors (rosary on the mirror, signboard, fluorescent tube), sari-sari store (hand-painted sign, grille, bottles), nipa hut on stilts with a bamboo ladder, a balete with hanging aerial roots, Spanish-era houses with capiz windows and ventanillas, provincial roads with bamboo, waiting sheds and a chapel, fiesta banderitas, palay paddies with pilapil (raised paddy edges). These have real proportions and real materials, not generic boxes. Signs are in Filipino, with invented names.
10. **Captions stay out of the scare.** In the reveal shot and the shot before it, put caption pages in the lower third (above the Shorts interface zone), or drop them for silent beats. Never put a caption over the entity's face.

### Sound

1. **Silence before every reveal: 0.8–1.5 s** of near silence (the room tone drops out). Then the stinger, in silence. Stingers never sit on a word (the Season 1 rule, now with a longer hold).
2. **Filipino night ambience (synthesized; Curio cues where they fit):**
   - *kuliglig* (cicadas and crickets) as a bed;
   - a *tuko* (tokay gecko) calling "to-kay" in slow, uneven repeats;
   - distant dogs;
   - frogs in the paddies;
   - bamboo creaking;
   - rain on a yero (corrugated iron) roof;
   - a far-off karaoke or fiesta loudspeaker.

   **The ambience is a scare instrument:** the karaoke stops mid-song, the dogs stop, the kuliglig stop, and the silence is the warning (Season 1's Episode 10 rule).
3. **Whispers:** a whispered layer under the score in danger beats (reversed narration fragments or breath noise shaped by formants), mixed at least 12 dB under the voice so they never compete with a line.
4. **Score:** `scripts/horror_score.py`, as before (mid-band drone, tremolo clusters, detuned music box, swells, stingers, heartbeat, riser, bowed metal). The Season 1 presence targets hold: about −8 to −12 dB during speech and −3 to −6 dB in the gaps, a 7 dB duck, and every line at least 4.5 dB over everything else. Measure them with `presence()`.
5. **Diegetic sounds that tell the story:** the taxi meter's tick, a gasera's hiss, wings, a tongue's wet click, the "tik… tik" placed by distance (louder = farther), pebbles, a trowel on concrete.

### Review gate for each episode (added to the still passes)

- A per-shot luma table: every non-reveal, non-day shot at 45/255 or below.
- The reveal frame inspected at phone size. Is it frightening, clear and unmistakable? Write down one sentence on what a viewer sees.
- The "moves when you look away" pair checked, frame for frame, for matching framing.
- A contact sheet that is mostly dark, with points of practical light. If it looks like Season 1, it fails.
- No listening pass is possible in this runtime. Report the measurements, not "it sounds scary".

### Voice for Season 2

- **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), in Taglish, chosen and approved by the user.
- **Account:** since Episode 13 it is a paid ElevenLabs **Starter** account. Start a new flow per session: old-account flows return "no access to this template".
- **Fitting 60 s:** Taglish takes run long (Episode 13: 64 s). Fit them with an atempo of at most 1.04–1.06 and tighter gaps, never by cutting words.
- **Line placement:** keep every shot inside the line timeline; Episode 13's "safe at dawn" shot was first placed after the loop point and never appeared.
