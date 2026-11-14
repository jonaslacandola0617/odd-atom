# Episode 32: "Tatlong Katok" (v1)

**Delivery:** `assets/videos/ep32-katok-v1/ep32-tatlong-katok.mp4` (1080×1920, 30 fps, 1,670 frames, 55.68 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep32-tatlong-katok-poster.png` (the three at the door across the street). It has **no user approval** and **no listening pass**.

**Source:** `Ep32TatlongKatok` in `src/horror/ep32/`:
- `world.tsx` (a composite barangay, no real place):
  - **the street:** concrete, sixteen houses facing it (hollow blocks, yero roofs, wooden doors, jalousie windows that light and then turn to candlelight), poles, one sodium streetlight, porch bulbs over five doors, the moon;
  - **chalk crosses:** six doors already crossed; ours is chalked during the episode (`ChalkCross`, drawn stroke by stroke);
  - **our house:** its jalousie (the slats close at the end) and door;
  - **the hall:** inside our house, to Lola's door, which has a chalk cross and light under it;
  - **the three (`Robed`):** long robes, hoods, darkness for faces (one smaller), a pale hand that knocks; when the lead's hood tilts up to our window, two faint points of light.
- `Episode32.tsx`: the shot list, the key times (shared with `scripts/ep32_sound.py`), the window schedule (who is knocked, when each window lights and when it turns to a candle), where the three are in each shot, our window's frame, captions.

The story is #32 in `docs/stories/season-4-philippines.md` (folklore: the kumakatok).

## Form: "the street"

One barangay at midnight, seen from above and from our window. The pattern of lights carries the story: each knock lights a window, and each death turns it to candlelight. We go inside only for the last shot. Every shot moves, every scene has an event, it reads muted; hard cuts only. **A seamless loop and a score** were built in from the start (the user's note after Episode 31).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | Through our jalousie | Across the street the three knock three times; that window lights | "Tatlong katok, sa hatinggabi…" / Three knocks, at midnight. And someone in that house will die. |
| 7.6 | Crane over the roofs | They walk up the street under the streetlight; the first window has turned to a candle | "Sa mga lumang kuwento…" / In the old stories, there are three of them, walking at night. Robed. You won't see the face. |
| 15.4 | Another door | Knock, knock, knock (before the line); the window lights, then turns to a candle | "Kakatok sila nang tatlong beses…" / They knock three times. Open the door or not, someone will still die. The eldest. Or the one who is sick. |
| 26.9 | Our door | Nanay's hand chalks a white cross, stroke by stroke | "Kaya noon, gumuguhit ang mga tao ng puting krus sa pinto." / So people used to draw a white cross on the door. |
| 31.9 | The street from above | Windows light and turn to candles; the three come up our side, past the crossed doors | "Ngayong gabi, sa kabilang bahay. Tapos sa kasunod." / Tonight, the house across. Then the next one. |
| 36.7 | Through our jalousie | They stop in front of our house; the crickets stop; the lead's hood tilts up to our window, two points of light | "Tumigil sila sa tapat namin." / They stopped in front of our house. |
| 43.8 | Through our jalousie | They move on; the dogs again; we close the slats | "Tapos, lumampas." / Then they went past. |
| 46.5 | The hall | Three knocks on Lola's door, from the inside; the door jumps; the light under it goes out | "Hanggang may kumatok. Mula sa loob. Sa kuwarto ni Lola." / Until someone knocked. From the inside. In Lola's room. |
| 53.8 | Through our jalousie | The three at the door across the street again, about to knock: the loop | |

**Hidden details:** a candle already burns at the far end of the street in the first shot (an earlier night); Lola's door has a chalk cross too; the crickets stop while the three stand in front of our house.

## Facts and their limits

Folklore only, from search summaries (Wikipedia "Kumakatok", the Aswang Project "Nangangatok", The Line Up). The lore: three hooded figures knock at night; someone in the house (the eldest or the sick) dies whether or not the door is opened; white crosses on doors were said to keep them away. Accounts differ on who the three are. Much of the modern detail traces to *The Balete Book* (2003). The knocks from inside are our dramatisation.

## Care

Folklore told as folklore; no real barangay; Lola's fate is never shown (it ends on the knock and the light); the white-cross custom is shown with respect; the three are never given faces.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **620 credits each (1,240)**; take 1 used (48.3 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change; the gaps were widened for the knocks before line 3 and the approach before line 6.

## Sound

`scripts/ep32_sound.py`. ElevenLabs sound effects (flow `zQpcgoOGwdbkyG8RJNKB`, about 267 credits): one knock cut from knock-1 and placed on every knock in the picture (muffled and closer for Lola's door), dogs-4 (in the gaps), chalk-3, steps-3. Synthesized: the night bed, crickets that fall quiet when the three stop, the house fan and hum, switch clicks, a match strike, a held breath, the slats, a low hit. **Score:** a drone on A1, a detuned string cluster (A2, B♭2, E3) with tremolo, an original three-note music-box figure (three notes, like three knocks), a heartbeat on the approach, bowed metal as they stop, a reversed swell and stinger when the hood looks up, a riser into the inside knocks, a stinger when Lola's light goes out; loop-quantised.

Figures (`public/assets/audio/ep32-katok-v1/PROVENANCE.json`): bed presence −12.3 dB during speech and −2.5 dB in the gaps; every line ≥4.7 dB over everything else (l06 lifted 0.9 dB, under the heartbeat and bowed metal); −14.0 LUFS; decoded peak −1.43 dBFS; no stinger inside a line; the loop seam −20.0 / −19.9 dBFS; the last frame matches frame 0 (0.67/255 mean difference before the hood fix).

## Render

`npm run sound:ep32` then `npm run render:ep32` (stills: `npm run still:ep32`). The script deletes its Remotion bundle.
