# Episode 34: "Paatras" (v1)

**Delivery:** `assets/videos/ep34-sigbin-v1/ep34-paatras.mp4` (1080×1920, 30 fps, 49.11 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep34-paatras-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep34Paatras` in `src/horror/ep34/`:
- `world.tsx` (composites):
  - **the farm:** a mud yard at night with puddles, a nipa house on stilts with the child's window lit, a bamboo goat pen with a gate, a kennel, banana trees, the moon;
  - **the trail:** sixty cloven hoofprints from under the child's window out into the field, every one pointing away from the house;
  - **the room:** inside the house, the child asleep on a banig (safe), a kerosene lamp, a bamboo wall with an opening for the window;
  - **the sigbin:** hornless, long bent hind legs, short forelegs, huge dragging ears, and its head hanging upside down between its hind legs, looking where it is backing to, with pinpoint eyeshine;
  - **the others:** the farmer (salakot, kerosene lamp), goats, a dog.
- `Episode34.tsx`: the shot list, the key times (shared with `scripts/ep34_sound.py`), where the sigbin and the farmer are, captions.

The story is #34 in `docs/stories/season-4-philippines.md` (Visayan and Mindanao folklore).

## Form: "the tracker"

Ground-level shots that follow footprints, cut against the creature's own reversing walk; the viewer learns the rule with the farmer and sees the danger before he does. Every shot moves; hard cuts only; an eerie score; **a seamless loop** (the last shot is the hook on negative time; first and last frames differ by 0.06/255 in the stills).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | Low along the trail | Prints pointing away; far down the trail, two eyes between two legs, coming closer | "Palayo ang mga bakas. Pero papalapit ito." / The tracks lead away. But it's coming closer. |
| 5.9 | The farm | The goats all turned toward the field; the window lit | "Sa Visayas at Mindanao, may kuwento ng sigbin…" / In the Visayas and Mindanao, they tell of the sigbin. They say it walks backwards, its head bowed between its hind legs. |
| 11.2 | The field | The sigbin walking backwards in the moonlight | (continues) |
| 17.3 | The pen | Three goats where there were four; the gate swings open | "Parang kambing na walang sungay…" / Like a goat with no horns. Huge ears. And it stinks. |
| 23.8 | The dog | It whimpers and backs into its kennel | "Sa gabi raw ito lumalabas, para uminom ng dugo." / They say it comes out at night, to drink blood. |
| 29.1 | The farmer | He follows the prints out into the field with his lamp | "Kaya kapag may nakita kang bakas na palayo sa bahay mo," / So if you see tracks leading away from your house, |
| 34.6 | Beside the trail | Behind him, it backs up the trail toward the house, toward us | "huwag mo itong sundan." / don't follow them. |
| 38.3 | The child's room | The child asleep; at the window, its back and ears rise; the lamp gutters | "Dahil baka hindi iyon palayo." / Because they may not be leading away. |
| 42.8 | Over his shoulder | He turns; his lamp follows the prints back to the house, to the sigbin under the window | "Baka pauwi na ito." / It may be coming home. |
| 45.0 | Its face | Upside down, eyes shining, looking up into the lens | |
| 47.4 | Low along the trail | The loop | |

**Hidden details:** the trail starts right under the child's window; there are four goats in the farm shot and three in the pen; the frogs and crickets stop whenever the sigbin is near.

## Facts and their limits

Folklore only, from search summaries (Wikipedia "Sigbin", Philstar Freeman 2013 "local cryptids", Thus.ph "Monsters in the Margins"). Consistent across sources: it walks backwards with its head lowered between its hind legs; goat- or dog-like, hornless, large ears, a foul smell; associated with the Visayas and Mindanao; said to come out at night and drink blood. A web "sighting log" naming a town and year looked invented and is not used. No province is named.

## Care

Folklore told as folklore. The belief that certain families keep a sigbin has been used to stigmatise real people: no family is shown or accused. The child is safe in every frame; no animal or person is harmed on screen (the missing goat is only a missing goat).

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **544 credits each (1,088)**; take 1 used (40.8 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change; the gaps were widened for the picture.

## Sound

`scripts/ep34_sound.py`. ElevenLabs sound effects (flow `c9xroXarp4hskrjsvjJL`, about 267 credits): goats-4 and goats-2, dog-2, hooves-2, snort-3 at the window and snort-1 at the lens. Synthesized: its wet steps in a wrong rhythm (two quick, one slow), running across the loop seam; frogs and crickets that stop when it is near; banana leaves; the lamp hiss; the gate creak; the farmer's steps; a low hit. **Score:** a drone on F♯1, a detuned string cluster (F♯2, G2, C♯3) with tremolo, an original music-box figure that runs down and back up (backwards), bowed metal, a heartbeat under the farmer, a reversed swell, a riser and stingers; loop-quantised.

Figures (`public/assets/audio/ep34-sigbin-v1/PROVENANCE.json`): bed presence −13.8 dB during speech (a little under the −8 to −12 target) and −5.4 dB in the gaps; every line ≥4.8 dB over everything else (l05 +1.5, l06 +4.2, l07 +1.1, l08 +3.7 dB lifts); −14.0 LUFS; decoded peak −1.12 dBFS; no stinger inside a line; the loop seam −17.1 / −17.0 dBFS.

## Render

`npm run sound:ep34` then `npm run render:ep34` (stills: `npm run still:ep34`). The script deletes its Remotion bundle.

## Review of the encoded file

`assets/videos/ep34-sigbin-v1/ep34-paatras.mp4`: 39,460,691 bytes, SHA-256 `c67f3c086f2fa82939fb1cf36c5ca9cda639e336f1c8c0bbc1f121087c9a806b`; H.264 1080×1920, 1,473 frames (49.1 s); AAC 49.09 s; measured from the file: −14.0 LUFS, sample peak −1.12 dBFS. The decoded first and last frames differ by 0.64/255 on average (the loop). A contact board of the encoded file was checked for every shot. No listening pass.
