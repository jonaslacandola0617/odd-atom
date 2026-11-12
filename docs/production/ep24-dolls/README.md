# Episode 24: "They Turn Their Heads" (v1)

**Delivery:** `assets/videos/ep24-dolls-v1/ep24-they-turn-their-heads.mp4` (1080×1920, 30 fps, 53.03 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep24-they-turn-their-heads-poster.png` (frame 60: the canal, dolls in the trees). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**The case:** the Island of the Dolls (La Isla de las Muñecas), Xochimilco, Mexico City (#24 in `docs/stories/season-3-world.md`). A real place with a reported story: Don Julián Santana Barrera hung hundreds of dolls on his chinampa for a girl he said had drowned nearby; he died in 2001.

## Why this episode looks and sounds like this

- **Built to the user's motion rule** (Episodes 21–22 were too static) and **the no-transitions rule** (Episode 23 v1's rewinds were rejected): **one continuous first-person boat ride, there and back, with no cuts and no transitions at all.**
- **Form:** first person, second person narration ("you"): a visitor's phone video from a trajinera at dusk in fog; the painted bow at the bottom of the frame; the boat glides, sways and bobs; the camera turns to the trees, up into them, back.
- **The picture tells it (the mute test):**
  - dolls hang from the trees and the stick fence, **facing the water**;
  - as the narration says heads turn, **one doll beside the boat turns its head**, slowly, in plain sight;
  - Don Julián's hut passes, its walls covered in nailed-up dolls;
  - **the boat turns all the way round**;
  - on the way back, closer to the bank, **the same dolls all face the boat**, and **a doll floats face-up beside us**, keeping pace;
  - **the camera tilts down to the black water: in the reflection, a doll hangs right above us**;
  - "Don't look up." **It looks up: the doll, face down, a foot from the lens.** Black.
- **Scare placement:** several small ones (the turned head, the dolls facing you, the floater), then the last frame.
- **Sound language:** diegetic only, no score (as a phone would hear it).
- **Visual language:** handheld first-person phone video at dusk, desaturated, fog; the water is translucent and shows a mirrored world under it (the reflection is real geometry, so the overhead doll is in the water before you see it).

## Facts and their limits

Checked from **web-search summaries only** (USC Folklore Archive, The Line-Up, HowStuffWorks, Culture Trip, Guinness World Records news, Wikipedia mirrors); no primary records.

| Claim in the video | Status |
|---|---|
| Xochimilco, Mexico City; for about fifty years one man lived alone on this little island in the canals | Consistent: Don Julián Santana Barrera, a hermit on a chinampa from about the 1950s |
| He said a girl had drowned nearby; he hung dolls in the trees for her | Reported; sources differ on her age, her relation to him, and whether he found her or failed to save her |
| Hundreds of them; he pulled them out of the canals and out of the trash | Consistent with the reports |
| Visitors say the dolls whisper and their heads turn when a boat goes by | Reported by visitors (legend) |
| Some say the girl was real; others say he only dreamed her; no record of her has been found | Accurate to the sources (some say he imagined it; no primary record found in the summaries) |
| In 2001 he was found drowned, in the same canal, his family says | Reported via his nephew; some accounts add a heart attack or drinking (not used) |

## Care

- The girl and Don Julián are **never shown**. His death is one line, attributed to his family; no method or body.
- The legend is told as unverified, in the narration.
- It is a working, family-run site: no visiting at night, no dares; the posts say so.
- The dolls are generic old plastic dolls; the hut is a composite.

## The ride

| Time (s) | What the picture shows | Line |
|---|---|---|
| 0.0 | Gliding up the canal at dusk; dolls in the trees, facing the water; **one already faces you** | "Don't look at the dolls. They're already looking at you." |
| 9.7 | The island begins: the band across the water **stops dead** | "Xochimilco, Mexico City…" |
| 13–24 | The camera looks up into a tree full of dolls; the hut with dolls on its walls | "Don Julián Santana Barrera…" / "Hundreds of them…" |
| 24.3–30.5 | **A doll beside the boat turns its head** as we pass | "Visitors say the dolls whisper…" |
| 36.9–43.4 | **The boat turns all the way round** | "Some say the girl was real…" / "In two thousand one…" |
| 43.4 | The way back: **the same dolls all face the boat**; **a doll floats beside us** | "Now, on the way back. Look at the same dolls." |
| 47.8–49.4 | **Tilt down to the water: a doll hangs right above us in the reflection**; the sound drops away | |
| 49.5 | | "Don't look up." (whispered) |
| 50.6–51.0 | **It looks up: the doll, face down, a foot from the lens**; a string creaks; one low hit | |
| 52.5 | Black and silence → loop | |

## Hidden rewatch details

1. **One doll already faces you** in the first frames.
2. **The band stops** the moment the island begins.
3. **The doll that turns its head** on the way out does it while the narrator is still talking about whispers.
4. **The floating doll** is not there on the way out.
5. **The overhead doll is in the water** for a second and a half before the narrator says "Don't look up."

**Open question (pinned comment):** was it there the whole way?

## Sound (`scripts/ep24_voice.py`, `scripts/ep24_sound.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack**, English; one call on a new flow (`lFu01SsOZpgI3DYJFDbP`) generated both takes (1,548 credits); take 1 (50.88 s) is used; no tempo change.
- **ElevenLabs sound effects** (`eleven_text_to_sound_v2`, 4 prompts × 4 variations, 272 credits): the dolls creaking on strings, the pole, whispers, a distant party-boat band. **Picked by measurement, not listening** (`prompt.json`).
- **Synthesized:** water lapping, wind, the swirl at the turn, the floating doll tapping the hull, one low hit at the look up. **Library (Curio):** `wood_stress` (the string creaking).
- **No score.**
- **Mix:**
  - **−14.0 LUFS**; decoded AAC peak **−1.2 dBFS** (limiter ceiling −1.2 dBFS).
  - **Bed presence** (phone band; the whole non-voice bed): **−10.1 dB during speech, −9.0 dB in the gaps** (the gaps include the drop to near silence before "Don't look up").
  - **Line margins:** every line at least 6.5 dB over everything else, no lifts.
  - **Loop seam:** −15.8 dBFS in the first quarter-second; the last half-second is black and digital silence on purpose, so the loop restarts from silence.

**No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep24      # needs public/assets/audio/eleven-takes/ep24-take1.mp3
npm run sound:ep24      # needs public/assets/audio/eleven-sfx/ep24-*.mp3
npm run still:ep24
npm run render:ep24
python3 scripts/caption_check.py src/data/ep24-dolls-v1-timeline.json assets/videos/ep24-dolls-v1/ep24-they-turn-their-heads.mp4 out/oddatom/ep24-captions
```

## Still review passes

1. **The dolls were specks** and the ahuejote foliage read as black pillars; the boat now runs about 2 m from the bank (1 m on the way back), and the foliage and bark were lightened.
2. **The bow filled the lower third**; it was lowered and pushed forward.
3. **The tilt-down showed the boat's own deck**; the camera now turns over the side to the water.
4. **The look-up showed the back of the doll's head** (a black disc) and overshot past vertical; the doll now hangs face down, and both angles were computed from its position (its reflection about 84° down, the doll itself about 68° up), so it sits on the line of sight both times.

## Review of the encoded file

(Filled in after the render.)

## Known limits

- The island, the trees and the hut are composites; the dolls are generic.
- The reflection is mirrored geometry under translucent water, not a true mirror; it reads at dusk and at 180×320.
- No user approval. Re-check every claim in a full source before posting.
