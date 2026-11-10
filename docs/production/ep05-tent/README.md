# Episode 5: "Nine Hikers, One Cut Tent" (v1)

**Delivery:** `assets/videos/ep05-tent-v1/ep05-nine-hikers-one-cut-tent.mp4` (1080×1920, 30 fps, 1,725 frames, 57.52 s container, H.264 two-pass 6.2 Mbit/s tuned for grain, AAC 192k; 46.1 MB; sha256 `d32de210bf72257234ff0f6cca982cf40c810c4cc1d37643fbde6259de32b07c`) with its poster `ep05-nine-hikers-one-cut-tent-poster.png` (the blade through the canvas, frame 120). It has **no user approval** yet.

**Source:** `Ep05NineHikersOneCutTent` in `src/horror/ep05/` (`world.tsx`: the slope, the tent, the nine trails of prints, the forest, the cedar, the ravine, the slab, the knife hand, the file; `Episode05.tsx`: the shot list, lighting modes, the file texture, captions and the tape layer). The hikers reuse `Human` from `src/horror/ep01/world.tsx`; the snowfall reuses `Snowfall` from `src/horror/ep03/world.tsx`. The story is the true script #4 in `docs/stories/season-1-shorts.md`, next in the season order (8 → 1 → 6 → 7 → **4**), cut to 10 lines.

## The true story and how it is handled

The Dyatlov Pass incident: in February 1959, nine experienced hikers camped on the slope of Kholat Syakhl in the northern Urals. On 26 February searchers found the tent, cut open from the inside. Footprints in socks and bare feet led downhill towards the forest. Some of the group were found near the remains of a small fire under a cedar; the last four were found in a ravine in May. The 1959 case was closed citing a "compelling natural force". Russian prosecutors concluded in 2019–2020 that an avalanche was responsible. In 2021, Gaume and Puzrin (*Communications Earth & Environment*) showed how a small, delayed slab avalanche could explain the tent and the injuries. The researchers themselves say parts of the story will never be explained, and critics still dispute it.

- **Re-checked on 2026-11-10** with web search summaries (Mental Floss, Business Insider, Moscow Times, EPFL, National Geographic, History Skills and others). They confirmed the tent date and the cut from inside, the prints in socks and bare feet, the cedar, the 2019–2020 avalanche conclusion, and the 2021 study and its caveats. The fire under the cedar, the May ravine discovery and the wording "compelling natural force" come from the season's fact notes and widely repeated accounts, but **the search summaries did not show them directly**. Re-check them in a full source (for example Wikipedia or the EPFL long read) before posting. Full-page fetches were not attempted: `en.wikipedia.org` is blocked by this environment's network policy.
- **Nine real people died.** No bodies, no injuries and no deaths are shown or described; the injuries are deliberately left out of the script. The hikers appear only as silhouettes with torches on the evening they camped (no faces drawn). Everything afterwards is traces: the tent, the prints, the cedar, the ravine, the file.
- **No one is accused.** The script names no theory's suspects. It mentions only the official closure, the avalanche study and that not everyone is convinced.
- **Fictional touches (dramatisation):** the exact look of the slope and camp; the hook's point of view from inside the tent; the faint orange light in the sky (a nod to the reports of lights in the sky, not a claim). The slope is scaled down: the real distance from the tent to the treeline is about 1.5 km.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | **Inside the tent**: torchlit canvas, the boots in a row, a blade through the canvas tearing downwards; the night slope beyond the cut | **Hook on frame 0**: "Imagine cutting your own tent open, and running into the snow in your socks." |
| B | 5.8 | Dusk: nine figures with torches on the open slope | Who they were: nine experienced hikers |
| B2 | 9.8 | Closer: the camp being made, the tent pitched | The slope, the northern Urals |
| C | 13.6 | Grey day: the tent half buried in drift, the cut in its side | "Cut open, from the inside." |
| D | 19.4 | Low over the slope: nine lines of prints running down to the treeline | "Socks. Bare feet." |
| E | 24.8 | The cedar: a bare trunk with its branches broken off high up, a ring of stones with charred sticks; tilt up the trunk | "...by a small fire, under a cedar tree." |
| F | 29.3 | Down the gully: two snow banks, a dark thawing stream | "They are not found until May." |
| G | 34.0 | The file: the conclusion is typed out letter by letter; a red CLOSED stamp lands | "A compelling natural force." |
| H | 39.1 | Night, from upslope: a slab breaks along a fracture line above the tent and slides down onto it | The 2021 slab-avalanche model |
| I | 46.3 | The tent alone at dusk, its cut flapping | "Not everyone is convinced." |
| J | 49.2 | Inside again: a slow pan along the boots to the canvas wall | The last line |
| A | 55.9 | The hook's own shot, mid-cut | **Loop** |

## Viral standard

- **Hook (frame 0):** a blade already through the canvas, and a second-person first line.
- **Length:** 57.5 s.
- **Seamless loop:** the last 1.6 s are the hook's camera move and cut on "negative" time. The blade, the opening of the cut and the camera all run continuously into frame 0. The tear sound is one continuous recording split across the seam. Wind, canvas, drone and pad end at their frame-0 levels; the mix measures −22.6 dB in the first quarter-second and −22.5 dB in the last.
- **Hidden rewatch details:**
  1. **The boots, left behind inside the tent**, in a row in the hook and the last shot. The group fled without their shoes; this detail is factual.
  2. **Nine lines of prints**, one for each person (dramatisation of the reported tracks).
  3. **The cedar's branches are broken off high up the trunk**, as reported, visible as the camera tilts up.
  4. **A faint orange light in the sky** beyond the cut, in the hook and the loop (dramatisation).
- **Open question:** what made nine experienced hikers cut their way out into the snow?

## Sound (`scripts/ep05_voice.py`, `scripts/ep05_sound.py`)

- **Voice:** MBROLA **us1**, the true-case archive narrator (Episodes 2 and 3).
- **Ambience:** mountain wind with gusts, canvas and wind from inside the tent, a quieter forest, a thawing stream, a room for the file.
- **Foley:** the blade tearing canvas, on the loop-continuous timebase; torches crackling at the camp; a branch creak; the slab's crack, slide and rumble.
- **Original score:** an A1/E2 beating drone, an A–C–E♭ pad, and a slow descending motif on a glassy bowed tone that returns slower and a quarter-tone flat over the last line.
- **Library (Curio, user-authorised):** `wood_stress`, `typewriter_cluster`, `document_stamp`, `low_cinematic_hit`, `restrained_boom`, `suspense_riser`; paths and hashes are in `public/assets/audio/ep05-tent-v1/PROVENANCE.json`. Stems are committed as FLAC.
- **Mix:** **−14.0 LUFS** integrated; the decoded AAC peaks at −2.5 dBFS. Voice margins from the stems:

| Line | Voice − score (dB) | Voice − all other stems (dB) |
|---|---|---|
| l01 | 14.2 | 12.4 |
| l02 | 9.9 | 9.8 |
| l03 | 9.2 | 9.0 |
| l04 | 9.0 | 8.8 |
| l05 | 9.4 | 9.1 |
| l06 | 12.3 | 12.2 |
| l07 | 10.6 | 9.0 |
| l08 | 6.9 | 5.9 |
| l09 | 11.8 | 11.4 |
| l10 | 10.6 | 10.6 |

**No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep05
npm run sound:ep05
npm run still:ep05
npm run render:ep05
python3 scripts/caption_check.py src/data/ep05-tent-v1-timeline.json assets/videos/ep05-tent-v1/ep05-nine-hikers-one-cut-tent.mp4 out/oddatom/ep05-captions
```

## Still review passes

1. **First pass:**
   - Every tent-interior shot was black: the camera sat just outside the sloped uphill panel. The interior cameras were moved inside.
   - Two tent panels had swapped angles.
   - The prints were sunk 2 cm under the slope surface.
   - The ravine was buried under the slope.
   - The slab shot was side-on and could not fit the portrait frame.
   - The ridge rocks floated, and the file's key line sat under the caption.
2. **Second pass:**
   - The knife arm was a black block filling the hook, so it now enters from the left.
   - A top-down diagnostic render showed the prints existed but were too faint, and that a tree blocked the ravine camera.
   - The "dark bar" in the slab shot was the tent seen from above.
3. **Third pass:**
   - The tent interior is now lit by the torch on the floor.
   - The cut was narrowed and the blade made bright.
   - The prints were darkened, enlarged and seen from higher up.
   - Trees were cleared around the gully, and the ravine is now shot along it.
   - The slab became one longer shot from upslope.

## Review of the encoded file

- **Decode and frames:** decodes with `ffmpeg -f null` without errors; 1,725 frames at 30 fps, with audio.
- **Loop:** the hook moves fast: frame 4 differs from frame 0 by 9.1/255 in mean absolute luma. The last frame differs from frame 0 by 5.9, which is within that normal motion; the cut keeps opening across the seam.
- **Contact sheet:** one frame every 2 s from the encoded file, inspected shot by shot.
- **Captions:** `scripts/caption_check.py` extracted all 14 caption pages from the encoded file. Each was read against the script word for word: all are complete.

## Known limits

- The hook's hand and arm are blocky PS1 shapes.
- The hikers in B2 are close enough to see their simple bodies; they have no faces.
- The case file shot is tight; its header is cropped.
- The slab sequence is a visual model, like a diagram, not a recreation of a known event.
- Fact-check limits are above; no listening pass; no user approval.
