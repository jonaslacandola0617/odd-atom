# Episode 29: "Checkout Is at Ten" (v1)

**Delivery:** `assets/videos/ep29-monte-v1/ep29-checkout-is-at-ten.mp4` (1080×1920, 30 fps, 53.4 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep29-checkout-is-at-ten-poster.png` (frame 60: the French doors after the storm). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**The case:** Monte Cristo Homestead, Junee, New South Wales (#29 in `docs/stories/season-3-world.md`). A real place called "Australia's most haunted house": years of guests' reports of footsteps, voices and being touched. It closed to visitors in January 2025 and is private property.

## Why this episode looks and sounds like this

- **Rules:** it is built to the motion rule and the no-gimmick-transitions rule (hard cuts only).
- **Form:** **second person, in real time on the phone's own clock (2:58 to 3:01)**. You are the overnight guest, filming on your phone, so the frame is the phone's camera screen:
  - its torch;
  - a status bar with the clock, "No Service" and a low battery;
  - REC and the elapsed time;
  - the stop and flip-camera buttons.
- **The bookends:** the episode opens in a roaring storm that **cuts to dead silence**, and the rain stops in the air. It ends when you **flip the camera around**, and the storm slams back over the last frame and the black, so the loop restarts inside the same storm.
- **The picture tells it (the mute test):**
  1. **The bedroom in the storm (the hook):** lightning through the French doors, rain; **the storm stops, and the rain hangs in the air**.
  2. **The house from outside:** wet, moonlit, its iron-lace verandas; your window lit upstairs.
  3. **The hall from your door:** candlelight under the far door, **which goes out**.
  4. **The room:** your phone light sweeps the dressing table and its mirror; **the wardrobe door creaks open by itself**.
  5. **The French doors:** behind the lace, **a woman in black walks along the balcony, stops, and turns to face you**.
  6. **"Something touches your shoulder":** the phone finds **pale fingers on your shoulder**, and her black sleeve.
  7. **"Turn the camera around":** the phone switches to the front camera. **Your face, and hers, just beside it.** The storm and a white flash. Black.
- **Scare placement:** front and back, as the slate planned: the storm's cut at the start, and the last frame.
- **Sound language:** a wall of storm (ElevenLabs SFX) that cuts to near-silence. Then only the gutters dripping, frogs, a candle, a wardrobe, footsteps, a breath and the phone's click. The storm returns at the end.

## Facts and their limits

Checked from **web-search summaries only**: Better Homes and Gardens Australia, The Nightly, the Canberra Times, Region Media, the Trove blog of the National Library of Australia, The Line-Up, HerCanberra, and paranormal podcasts.

| Claim in the video | Status |
|---|---|
| Monte Cristo Homestead, Junee, New South Wales; built in the 1880s by the Crawley family | Consistent: the Crawleys moved in around 1884–1885 (sources differ by a year; Christopher William Crawley) |
| Mr Crawley died here in 1910 | Consistent: in 1910, aged 69 (reported as blood poisoning; not said) |
| His wife stayed on and rarely left the house again | Consistent with the reports: she is said to have left only twice in the years after his death |
| For decades, guests who spent the night have reported footsteps on the balcony, voices, being touched | Consistent: guests' and visitors' reports (footsteps on the balcony; "a hand on my shoulder" in press interviews) |
| No one has ever proven anything | Our statement; nothing has been demonstrated |
| The house closed to visitors in 2025 | Consistent: closed to the public in January 2025, then listed for sale |

**Not used:**
- the unverified tragic stories: a maid's fall, a stable boy, a child;
- the 1960 shooting of a caretaker (a real killing, not a ghost story to tell here);
- the family members' names;
- the woman in black as Mrs Crawley (she is never identified).

## Care

- No living person is named.
- The family who restored and kept the house is not named.
- The house is private property and closed to visitors: no visiting framing, no dares.
- Nothing is claimed as proven.
- The guest is a composite ("you").
- The woman in black is our figure from the reports, not a named person.

## The cut

| Time (s) | Shot | What the picture shows | Line |
|---|---|---|---|
| 0.0 | The bedroom (phone) | Storm, lightning; **at 1.3 s the storm stops and the rain hangs in the air** | "You're the overnight guest. It's two fifty-eight…" |
| 7.6 | The house | Wet, moonlit, verandas; your window lit | "Monte Cristo Homestead…" |
| 15.1 | The hall (phone) | Candlelight under the far door; **it goes out** (21.7) | "Mister Crawley died here…" |
| 22.3 | The room (phone) | The dressing table, the mirror; **the wardrobe creaks open** (29.6) | "For decades, guests…" / "No one has ever proven…" |
| 36.1 | | The French doors; **a woman in black walks past and turns to face you** | "You hear the footsteps now…" |
| 45.9 | | **Pale fingers on your shoulder** | "Something touches your shoulder." |
| 49.8 | Front camera | **Your face, and hers beside it** | "Turn the camera around." |
| 52.5 | | The storm slams back; white; black → loop | |

## Hidden rewatch details

1. **The phone's clock** runs 2:58 → 2:59 → 3:00 → 3:01 in real time; checkout is at ten.
2. **The rain hangs in the air** after the storm stops, outside the doors, for the whole episode.
3. **The flip button turns yellow** a moment before the narrator tells you to turn the camera around.
4. **Your window is the lit one** in the shot from outside: the upstairs, second from the right.
5. **The wardrobe stays open** in the front-camera shot behind you.

**Open question (pinned comment):** what time did she get there?

## Sound (`scripts/ep29_voice.py`, `scripts/ep29_sound.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack**, English; one call on a new flow (`aql4G2yklsN5AOJWSJUw`) generated both takes (1,430 credits). Take 1 (45.2 s) is used; pauses inside a line are capped at 0.32 s; no tempo change.
- **ElevenLabs sound effects** (`eleven_text_to_sound_v2`, 4 prompts × 4 variations, 272 credits): the storm on an iron roof, footsteps on the balcony, the wardrobe door, a cold exhale. They were **picked by measurement, not listening** (`prompt.json`).
- **Synthesized:** the room tone, drips from the gutters, frogs, the candle going out, the phone's click, low hits.
- **No score.**
- **Mix:**
  - **Loudness:** −14.0 LUFS; decoded AAC peak −2.04 dBFS.
  - **Bed presence** (phone band; the whole non-voice bed): −19.7 dB during speech, and **+4.5 dB in the gaps** (the gaps include the storm bookends, which are meant to overwhelm; between them the house is near silence on purpose).
  - **Line margins:** every line at least 16.2 dB over everything else, no lifts.
  - **Loop seam:** −13.9 dBFS at the head and −8.9 dBFS at the tail: **both inside the storm**, so the loop is continuous.

**No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep29      # needs public/assets/audio/eleven-takes/ep29-take1.mp3
npm run sound:ep29      # needs public/assets/audio/eleven-sfx/ep29-*.mp3
npm run still:ep29
npm run render:ep29
python3 scripts/caption_check.py src/data/ep29-monte-v1-timeline.json assets/videos/ep29-monte-v1/ep29-checkout-is-at-ten.mp4 out/oddatom/ep29-captions
```

## Still review passes

1. **The house and the hall were nearly black:** more moonlight and fill outside, and a brighter phone torch and fill in the hall.
2. **The woman on the balcony was invisible**, black against a black night. The night beyond the doors is now a lit, moonlit blue, and a soft light falls on the veranda, so she reads as a silhouette behind the lace.
3. **The hand on the shoulder was a white block:**
   - the phone torch at 15 cm overexposed the palm, so the torch dims as the phone turns to the shoulder;
   - the fingers are longer;
   - her black sleeve comes from behind you.
4. **In the front camera she was a small head far behind:** she now leans in, her face beside yours.

## Review of the encoded file

- **File:** 42,172,630 bytes; SHA-256 `f4d09f5c8b8e0cd6dfcd2c4c5b75fcde5989ccb5ca3d4a3a264b2638f6993df6`.
- **Streams:**
  - H.264 1080×1920, 1,598 frames, 53.27 s. That is 3 frames short of the 1,601-frame timeline; they fall in the closing black.
  - AAC 53.36 s: the checked `mix.m4a`, muxed with `-c copy`.
  - It decodes with no errors.
- **Loudness:** −14.0 LUFS integrated; peak −2.0 dBFS (ffmpeg ebur128).
- **Dark key:** mean luma, sampled twice a second, runs 15–43/255 with a median of 22.
- **Captions:** all 12 caption cards were found on screen at their timeline times (`out/oddatom/ep29-captions`, not tracked).
- **Muted contact sheet** (every 2 s), in order:
  - the French doors in the storm, then the rain hanging;
  - the house with your window lit;
  - the hall and its candle line going out;
  - the room, the mirror and the wardrobe opening;
  - the doors, with the woman in black behind the lace;
  - the hand on your shoulder;
  - the front camera, with your face and hers.

  The phone's clock runs 2:58 → 3:01. It reads without sound.

## Known limits

- The bedroom, the hall and the house are composites, not the real homestead's rooms.
- The woman in black is an original figure from the reports.
- The effects were chosen without listening.
- No user approval. Re-check every claim in a full source before posting.
