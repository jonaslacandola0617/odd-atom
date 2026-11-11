# Episode 10: "The Night the Lake Breathed Out" (v1)

**Delivery:** `assets/videos/ep10-lake-v1/ep10-the-night-the-lake-breathed-out.mp4` (1080×1920, 30 fps, 1,796 frames, 59.9 s, H.264 two-pass 6.2 Mbit/s tuned for grain, AAC 192k) with its poster `ep10-the-night-the-lake-breathed-out-poster.png` (frame 700, the mist pouring down the valley). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**Source:** `Ep10TheNightTheLakeBreathedOut` in `src/horror/ep10/`:
- `world.tsx`: the crater (a vertex-coloured heightfield with a bowl, a rim and the notch into the north valley), the lake (it lifts, and turns red at dawn), the village in the valley (huts, lamps, doors, a cooking place), the mist, the degassing pipe, the lake seen from underwater with its deep layer, and a second lake;
- `Episode10.tsx`: the shot list, the lamp going out, the held black, the dawn, the underwater descent, the eruption from below, captions and the tape layer.

The story is the **true** script #5 in `docs/stories/season-1-shorts.md`, the last of the season order (… → 9 → 3 → **5**). It is rewritten with a hook on frame 0 and cut to 10 lines.

## Care

This is the heaviest case of the season: a recent disaster with living survivors and families.
- **No people or animals are shown**, alive or dead. The village is huts, lamps and paths; at dawn its doors stand open and the paths are empty. The deaths are carried by a lamp going out, the crickets stopping and a held black.
- The number is said once, plainly, with "many in their homes". There are no jokes, no "cursed lake" framing and no monster.
- The cause is told as science: carbon dioxide from below, held down by the water, released; heavier than air, it flowed down the valleys. The trigger is said to be **still debated**.
- The ending points to real monitoring (the degassing pipes) and to other gas-holding lakes, not to a threat invented for the video.
- The grade at night is cold blue, with no red. The only red is the lake at dawn.

## Facts and their limits

Re-checked on 2026-11-11 from web-search summaries only. Wikipedia is blocked in this environment, and no primary paper (for example, the post-disaster scientific reports) was read in full.

| Claim in the video | Status |
|---|---|
| Cameroon, August 1986; villages in the valleys below Lake Nyos | Consistent: the night of 21 August 1986 |
| People heard a deep rumble; some saw a white mist rise from the water | Consistent with survivor accounts as summarised (a rumbling, a cloud or mist over the lake) |
| The mist is carbon dioxide, heavier than air, and flowed down the valleys | Consistent: CO₂ is about 1.5 times as dense as air; the cloud flowed downhill into the valleys |
| 1,746 people died that night; many in their homes | Consistent: 1,746 is the figure usually given (with about 3,500 livestock). Many were reported to have died where they slept |
| Gas from deep below had gathered at the bottom, held down by the weight of the water | Consistent: CO₂ from volcanic sources below dissolved in the deep water under pressure |
| "Something disturbed it. Scientists still debate what." | Consistent: a landslide, cooling or wind and a small volcanic input are all proposed |
| Today, pipes draw the gas up from the bottom | Consistent: a degassing pipe has run since 2001, with two more added around 2011 |
| Other lakes are still holding gas | Consistent: Lake Monoun (Cameroon) had a smaller eruption in 1984; Lake Kivu holds large amounts of dissolved gas and is monitored |

**Picture details that are dramatisation:**
- the lamp in one window going out as the mist reaches it;
- the crickets stopping dead (sound);
- cold ash at the cooking place;
- the shapes of the village;
- the ring on the water in the first and last seconds.

The lake turning red at dawn reflects reports that the water turned a reddish brown after the eruption; it is shown, not narrated.

**Before posting:** if possible, check the death toll and the pipe dates in a full source, and the red water in a primary account.

## Story told by the picture

| # | Time (s) | Shot | What the picture says |
|---|---|---|---|
| A | 0.0 | The crater lake at night from the inner rim: still water, stars, a ring on the water | **Hook on frame 0**: "Look at this lake. Calm. Blue. In one night, it breathed out." |
| B | 5.69 | High over the valley: huts with lamps lit in their windows | "Villages sleep in the valleys below Lake Nyos." |
| C | 12.63 | Low over the water: a deep rumble; at 15.4 the surface lifts | "Late at night, people hear a deep rumble…" |
| C2 | 19.22 | **Stinger in silence.** A white plume heaves up out of the lake | "…a white mist rise from the water." |
| D | 23.07 | High over the notch: the mist pours over the rim and down the valley | "…down the valleys, like water." |
| E | 26.02 | At the lamp hut's window: the lit window and its pool of light; the mist arrives; **the lamp goes out** (27.72); the crickets stop | |
| E2 | 28.17 | **Held black, silence** | |
| F | 28.62 | Dawn: the same high view of the village, grey, still, **doors open**, nothing moving | "By morning, the valleys are silent." |
| F2 | 32.23 | Down the empty path into the village; **cold ash** where the fire was | "One thousand, seven hundred and forty six people died that night…" |
| G | 37.38 | The crater from the rim at dawn: **the lake dull red** | |
| G2 | 38.48 | Down through the water: the light fades, bubbles rise from the deep | "For years, gas from deep below had gathered at the bottom…" |
| H | 44.91 | The deep layer, glowing faintly; at 49.39 (**stinger in silence**) it lets go and rushes up | "That night, something disturbed it." |
| I | 50.34 | Day: the lake calm and blue; the degassing pipe's fountain | "Today, pipes draw the gas up from the bottom…" |
| J | 55.11 | Another lake at night, calm; **one bubble breaks the surface** (58.48) | "But other lakes on Earth are still holding their breath." |
| A | 58.28 | The hook's own camera move on negative time | **Loop** |

## Viral standard

- **Hook (frame 0):** the night lake and "Look at this lake. Calm. Blue." under 1 s.
- **Length:** 59.9 s.
- **Seamless loop:** the last 1.6 s are the hook's camera move on negative time; the ring on the water spans the seam. Drone, strings, wind, the lake's lapping and the crickets use whole cycles (`qf()`). Frame 0 opens under the first line, so the score eases 2.6 dB down over the last 1.6 s. The mix measures −22.7 dBFS in the first quarter-second and −23.4 dBFS in the last.
- **Hidden rewatch details:** the lamp goes out as the mist reaches it; the crickets stop at the same moment; cold ash at dawn; the lake red at dawn; the ring on the water in the first and last seconds.
- **Open question:** which lake is holding its breath now?

## Sound (`scripts/ep10_voice.py`, `scripts/ep10_sound.py`, `scripts/horror_score.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack – Deep Dark Horror Narrator** (`BVPhWQykET1TSvfGzrUr`).
  - Pricing was 1,890 credits for 2 takes. The first call was refused as busy (nothing charged). A check-in was scheduled rather than retrying in the same turn. On the retry, **one of the two takes generated** (945 credits); the second did not start.
  - The take was split into 10 lines. Pauses inside a line are capped at 0.45 s, and `atempo` 1.03 brings the episode under 60 s. The timeline was built from the real line lengths before any picture was locked.
- **Score (horror standard):**
  - a mid-band drone;
  - tremolo string clusters;
  - the music-box theme: clean over the calm lake, detuned over the empty village, slow and flat by day;
  - reversed swells into **stingers at 19.22 s (the plume) and 49.39 s (the deep layer), both in silence**;
  - heartbeats at 66→104 bpm, which **stop when the lamp goes out**, and 70→112 bpm into the eruption;
  - a riser into the eruption;
  - bowed metal underwater and at dawn.

  Everything drops out for the held black before dawn.
- **The crater:**
  - gusting wind;
  - the lake lapping in the hook, at the other lake and in the loop;
  - four synthesized crickets that **stop dead when the lamp goes out** and are heard again only at the other lake;
  - dawn has wind only: no insects, no birds;
  - a muffled pressure underwater;
  - the degassing pipe's fountain by day.
- **Foley:**
  - the rumble and the lake lifting;
  - the plume, and the mist pouring over the rim;
  - a small glass tick as the lamp dies;
  - bubbles rising through the water, and the deep layer letting go in a rush;
  - one bubble on the other lake.
- **Library (Curio, user-authorised):** `restrained_boom` and `low_cinematic_hit`. Paths and hashes are in `public/assets/audio/ep10-lake-v1/PROVENANCE.json`. Stems are FLAC.
- **Mix:**
  - **−14.0 LUFS**; the decoded AAC peaks at **−1.26 dBFS** (limiter ceiling −1.2 dBFS).
  - **Music presence** (phone band): **−11.4 dB during speech and −3.3 dB in the gaps**, with a 7 dB duck.
  - No line needed a lift: every line is 5.9–16.8 dB over everything else. The tightest is l04, over the mist, at 5.9 dB; its phone-band margin is 7.7 dB. The lowest phone-band margin is 6.3 dB (l06).

**No listening pass was possible in this runtime**; presence and margins are measured.

## Reproduce

```
npm run voice:ep10      # needs public/assets/audio/eleven-takes/ep10-take1.mp3
npm run sound:ep10
npm run still:ep10
npm run render:ep10
python3 scripts/caption_check.py src/data/ep10-lake-v1-timeline.json assets/videos/ep10-lake-v1/ep10-the-night-the-lake-breathed-out.mp4 out/oddatom/ep10-captions
```

## Still review passes

1. **First pass (provisional timeline):**
   - The rim cameras sat outside the bowl and the rim filled the frame. They were moved to an inner rim at about 66 m from the centre.
   - Dawn cameras were below the terrain. They now sit a fixed height above the ground (`gnd()`).
   - Underwater was black. The water was brightened and the deep layer made semi-transparent, so the bubbles read.
2. **Second pass (the real timeline, 59.9 s):**
   - The village close-up looked into the valley side: the first lamp hut stood on a steep slope, sunk 4.6 m below the ground in front of its window. The lamp hut is now chosen as the lit hut whose window has the most open ground in front of it, and the camera looks straight at that window, so the lamp reads before it goes out.
   - The dawn shot was dark and cropped the huts. It now repeats the night's high view of the village (the same framing, now empty), and the dawn light was raised.

## Review of the encoded file

(filled in after the render)

## Known limits

- The crater and valley are a smooth heightfield: they read as a crater lake and a valley, not a survey of Nyos and its villages (Lower Nyos, Cha, Subum).
- The huts are generic low-poly huts, not a model of local building styles.
- The degassing pipe is a simple column and fountain, not a model of the real installation.
- No listening pass; no user approval.
