# Episode 3: "Footprints in the Snow" (v1)

**Delivery:** `assets/videos/ep03-snow-v1/ep03-footprints-in-the-snow.mp4` with its poster `ep03-footprints-in-the-snow-poster.png` (the hollow in the attic hay). Encoded-file figures and the sha256 are in the review section below. It has **no user approval** yet.

**Source:** `Ep03FootprintsInTheSnow` in `src/horror/ep03/` (`world.tsx` holds the farm, the interiors, the forest, the footprints and the snowfall; `Episode03.tsx` holds the shot list, lighting modes, captions and the tape layer). People reuse `Human` from `src/horror/ep01/world.tsx`. The story is the true script #6 in `docs/stories/season-1-shorts.md` (the next episode in the season's release order 8 → 1 → 6 → 7), rewritten as 12 shorter lines for the viral standard.

## The true story and how it is handled

The Hinterkaifeck murders: an isolated farmstead in Bavaria, 1922. Before the killings, the farmer told neighbours about tracks in fresh snow coming from the forest to the farm, with none leading back. He also mentioned house keys gone missing, a Munich newspaper nobody had bought, and footsteps in the attic. He searched and found nothing. The previous maid had left about six months earlier, saying the place was haunted. On the night of 31 March 1922, all six people at the farm were killed. They were found on 4 April. In between, someone had fed the cattle, eaten bread from the kitchen, and smoke had been seen from the chimney. The case was never solved; a 2007 cold-case review concluded it could no longer be solved.

- **Re-checked on 2026-11-10** with web search summaries of Wikipedia, Mental Floss, Grunge, Historic Mysteries, The Line Up and others. Full-article fetches were not attempted, because `en.wikipedia.org` was already blocked by this environment's network policy in Episode 2. Sources agree on the core facts used. Two conflicts were found and avoided in the script. First, sources differ on the maid timeline: a previous maid left about six months earlier saying the farm was haunted, while a new maid had started on the day of the killings. The script says only "Months earlier, the maid had quit." Second, "smoke rose from the chimney" and "someone fed the cattle" come from neighbours' accounts as retold in secondary sources. **Before publishing, read one full primary or German-language account** to confirm the chimney smoke and cattle details.
- **Six real people died here, children among them.** Nothing violent is shown, nor any body or blood. The family appears only as lit windows. The farmer is seen in shadow, from behind or as a silhouette lit by his lantern. The line about the killings plays over a single lit window that goes dark, then a hold of black and silence. No victim is named.
- **No suspect is named or implied.** Several online sources name a suspect from the 2007 review or from older theories; none of those names appear in the video, the kit or this README. The killer is never shown or given a gender ("whoever did it", "someone").
- **Fictional touches** (cinematic, not presented as fact): the exact look of the farm and rooms, the hook's walking steps, and all four hidden details below. The real footprint story is from the farmer's own account, which he gave before the killings.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | Low over the tracks at dusk, slowly following them through falling snow to the lit house and its door | **Hook on frame 0**: "You find footprints in the snow, leading to your door." Steps crunch, as if you are walking them |
| B | 4.6 | The doorstep: the last prints stop at the step, nothing beside them | "None lead away." |
| C | 7.0 | High wide: the long house alone in a forest clearing | Isolation |
| C2 | 10.0 | The front of the farm, two windows lit | Somebody lives here; the attic gable glows faintly |
| D | 12.8 | Insert: the key board, one hook empty | "The house keys go missing." |
| E | 15.2 | Insert: a Munich paper on the table | "A newspaper turns up that nobody bought." |
| F | 18.4 | Night, low angle: the oil lamp, the ceiling boards, the farmer looking up; dust sifts down | Footsteps overhead |
| G | 23.4 | **From the dark attic**: the hatch lifts and the farmer rises with a lantern, looks around, goes back down | He searches and finds nothing. We are where the someone would be |
| H | 28.1 | The maid's chamber: stripped bed, a crucifix, grey light | "She said the house was haunted." |
| I | 33.9 | Night outside: one lit window; at 37.2 s it goes dark | The killings, without showing them. Then black and silence (38.7–40.0) |
| J | 40.0 | Grey daylight: the silent farm, smoke rising | "For days, smoke rose from the chimney." |
| K | 43.0 | The barn: cattle at a manger full of hay | "Someone fed the cattle." |
| L | 45.6 | From below: the ladder and the open hatch, black above | "Whoever did it had stayed in the house." |
| M | 49.2 | The farm in falling snow at dusk, windows dark, the tracks still there | "The case was never solved." |
| N | 52.1 | The attic: a pressed hollow in the hay, crusts of bread, a key | "No one knows how long someone had been living above them." |
| A | 56.6 | The hook's own shot again, mid-move: the tracks to the lit door | **Loop** |

## Viral standard

- **Hook (frame 0):** the tracks, the lit door and a second-person first line ("You find footprints in the snow, leading to your door.").
- **Length:** 58.4 s.
- **Seamless loop:** the last 1.8 s are the hook's camera move, played on "negative" time. The camera, the snowfall and the lit windows run continuously into frame 0. The crunching steps keep one cadence across the seam. The wind, drone and pad end at their opening levels; the mix is −20.3 dB in the first quarter-second and −20.7 dB in the last.
- **Hidden rewatch details (dramatisation):**
  1. **The attic gable window glows** faintly from frame 0, before anyone mentions the attic.
  2. **Two points of light between the ceiling boards** for three frames at 20.6 s, with a faint breath, while the farmer looks up.
  3. **A breath in the lantern light** at 25.6 s, right in front of the camera, while he searches the attic.
  4. **The missing key** lies in the hay hollow in the last shot.
- **Open question:** how long had someone been living above them?

## Cinematography

- **One world:** the tracks, the door, the windows, the hatch, the barn and the gable window keep their places in every shot. The attic shot G looks at the same hatch that L looks up at, and the hollow in N sits on the hay seen behind the hatch.
- **Point of view:** the hook and the attic are shot from where the intruder would be (following the tracks; hidden behind the hay). The film never shows them.
- **Motivated light:** dusk blue outside with warm windows; an oil lamp and a lantern at night; grey daylight once the farm is silent; the cold gable-window light in the attic.
- **Withholding:** the killings are a window going dark. The family is never shown; the farmer is never seen clearly.

## Look

180×320 render upscaled 6× nearest-neighbour, PS1 vertex snapping and Bayer dither, 16–32 px procedural textures (snow, plaster, planks, boards, hay, the green tiled stove). One-pixel snowfall (1,400 flakes, deterministic and wrapped around the camera), footprints as 90 dark decals. Light tape layer, as in Episodes 1 and 2.

## Sound (`scripts/ep03_voice.py`, `scripts/ep03_sound.py`)

- **Voice:** the same MBROLA **us1** archive narrator as Episode 2: the channel's voice for true cases. "Hinterkaifeck" is spoken from a phonetic spelling ("Hinter kye feck"); the caption keeps the real spelling. The voice script now fails if espeak reports a missing phoneme.
- **Ambience:** winter wind with gusts, a high whistle and snow hush in every exterior; room tone and stove crackle inside; wind on the roof in the attic.
- **Foley:** steps crunching in snow (hook and loop, on one cadence), footfalls and creaks overhead, dust, the hatch hinge, ladder creaks, the lantern's rattle, one held breath, the paper, the keys, cattle breathing and chewing.
- **Original score:** a beating D1/A1 drone; a D–F–A♭ pad; a plucked, zither-like lullaby in D minor (Karplus–Strong), which returns slower and a quarter-tone flat over the hollow. Everything stops for the black hold after the window goes dark.
- **Library (Curio, user-authorised):** `cavern_lowwind`, `wood_stress`, `heartbeat_breath`, `heavy_hinge`, `paper_light_turn`, `metallic_rivet`, `low_cinematic_hit`, `cable_tension`, `restrained_boom`, `suspense_riser`. Paths and hashes are in `public/assets/audio/ep03-snow-v1/PROVENANCE.json`; stems are committed as FLAC.
- **Mix:** **−14.0 LUFS** integrated; decoded AAC sample peak **−2.4 dBFS**. Voice margins from the stems:

| Line | Voice − score (dB) | Voice − all other stems (dB) |
|---|---|---|
| l01 | 14.2 | 9.8 |
| l02 | 12.4 | 12.3 |
| l03 | 13.0 | 8.9 |
| l04 | 12.1 | 11.5 |
| l05 | 9.8 | 6.5 |
| l06 | 8.9 | 7.7 |
| l07 | 8.8 | 8.5 |
| l08 | 6.6 | 4.4 |
| l09 | 9.6 | 9.3 |
| l10 | 11.4 | 9.6 |
| l11 | 9.5 | 7.1 |
| l12 | 9.2 | 9.2 |

**No listening pass was possible in this runtime**; the balance is measured, not auditioned.

## Reproduce

```
npm ci
apt-get install -y espeak-ng mbrola mbrola-us1
npm run voice:ep03
npm run sound:ep03
npm run still:ep03
npm run render:ep03
python3 scripts/caption_check.py src/data/ep03-snow-v1-timeline.json assets/videos/ep03-snow-v1/ep03-footprints-in-the-snow.mp4 out/oddatom/ep03-captions
```

## Still review passes

1. **First pass.**
   - The hook's prints were invisible: too pale, and the camera grazed them. The prints were darkened and enlarged and the camera raised.
   - The key board was hidden by the stove; it moved to the inner wall.
   - The maid's crucifix sat on the window; they were separated.
   - The barn cattle faced the wrong way.
   - The hollow camera was outside the roof (the attic is low at the eaves).
2. **Second pass.** A "trodden trail" under the prints, added so the line reads from far away, looked like paving and was removed. The lantern was shrunk and moved into the farmer's raised hand. The breath puff, placed 30 cm from the lens, filled the frame and was shrunk.
3. **Third pass.** The hatch shot stayed black at night. A daylight debug render showed the geometry was correct, but the hall had no motivated light. It became a grey-daylight shot ("days later"), framed straight up the ladder into the black opening.
4. **Fourth pass.** The barn moved to a high wide behind the cattle; the hollow was raised above the hay surface, lit, and reframed.

## Known limits

- The far wide (C) does not show the line of tracks; at 180×320 the prints vanish at that distance.
- The barn shot reads as "a stable with a cow and hay" more than "freshly fed".
- The farmer's lantern-lit head in G is a featureless PS1 block (deliberately: he is a real victim and is never shown clearly).
- Fact-check limits are above; no listening pass; no user approval.
