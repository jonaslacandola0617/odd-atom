# Episode 31: "Dalawa Sila" (v1), the Season 4 opener

**Delivery:** `assets/videos/ep31-clarita-v1/ep31-dalawa-sila.mp4` (1080×1920, 30 fps, 59.97 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep31-dalawa-sila-poster.png` (frame 70: the bite in the torchlight). It has **no user approval** and **no listening pass**.

**Source:** `Ep31DalawaSila` in `src/horror/ep31/`:
- `world.tsx` (composites, not a survey of the real jail):
  - **the cell:** concrete walls, a barred front, an iron cot and blanket (it can ripple, or sink as if someone sits on it), a kerosene lamp, a caged bulb, a tin cup, a clock stopped at ten past two;
  - **her forearm and hand** on the blanket. **She is never seen above the shoulder**; the head end of the cot stays dark;
  - **the corridor:** barred cells under swinging bulbs, ending at her door;
  - **the wall:** the jail's stone wall at night, a watchtower, one lit barred window, a running guard with a lamp;
  - **the press:** two rollers and the page (our words, no real masthead);
  - **the office:** a desk, a typewriter with the report, a lamp, the same clock;
  - **props:** low-poly hands with sleeves and cuffs, the mayor's shoes, trousers and hat (never a face), a Bible, and the two shadows on the wall (tall and hunched; child-height).
  - `drawBite()` and `Decal` draw the bite marks live on a canvas texture, tooth by tooth.
- `Episode31.tsx`: the shot list, the key times (shared with `scripts/ep31_sound.py`), the flashes, the grades (warm sepia in the jail, grey at night outside, a hard halftone for the press, grey for the flash photographs), and the captions.

The story is #31 in `docs/stories/season-4-philippines.md`. The user approved the slate and chose Taglish with Juanito on 2026-11-14 ("approved, taglish with juanito, start ep 31").

## Form: "the examination"

We only ever see hands, arms, shoes and paper; the camera leans in like a reporter. Every shot moves, every scene has a visible event, and it reads with the sound off. Hard cuts only.

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | Her forearm in torchlight | A ring of tooth marks presses into clean skin, tooth by tooth; a small second bite is already there (hidden) | "Walang tao sa selda. Pero may kumakagat sa kanya." / No one is in the cell. But something is biting her. |
| 4.6 | The jail wall at night | A guard runs with a lamp toward the one lit window | "Maynila, Mayo, nineteen fifty-three…" / Manila, May 1953. A teenage girl named Clarita, held in the Manila City Jail, the old Bilibid. |
| 9.7 | The corridor | We walk to her door; the keys, and the door swings open | (continues) |
| 14.6 | The cell | A tin cup rolls across the floor by itself; two shadows grow on the wall, one tall, one small, and lean toward the cot | "Gabi-gabi, sumisigaw siya. Dalawa raw sila…" / Every night she screamed. There were two of them, she said. One big and black. And one small. |
| 22.4 | The examination | The doctor's hands; a finger touches the mark; it glistens. In the gap, a second, smaller bite presses in beside it | "Tinawag ang mga doktor…" / Doctors were called. According to the reports, they saw tooth marks on her arm. Still wet, like saliva. |
| 31.8 | The press | The page comes off the rollers: GIRL IN CITY JAIL "BITTEN" BY UNSEEN | "Pumunta mismo ang mayor ng Maynila…" / The Mayor of Manila came himself. He told reporters he saw it. |
| 34.5 | At the bars | Polished shoes walk up; after the line the hat falls from his hand | (continues) |
| 37.7 | The cell, a photographer's flash | Flash 1: nothing. The cot sinks as someone unseen sits on it. Flash 2: the two shadows stand by the cot | "May mga doktor na nagsabing nasa isip lang ito…" / Some doctors said it was all in her mind. But no one could explain the bites. |
| 44.7 | Prayer | Two hands in dark sleeves over hers, a Bible; the blanket ripples as something crosses under it; the lamp bends, then all is still | "Isang pastor na Amerikano ang nanalangin…" / An American pastor prayed over her for days. After that, they say, the bites stopped. |
| 52.4 | The report | The doctor types; the typing stops; a bite presses into his own wrist; the lamp flickers | "Dalawa sila. At walang nakakaalam kung saan sila pumunta." / There were two of them. And no one knows where they went. |
| 59.6 | Black | The loop returns to the first bite | |

**Hidden details:** the small bite already beside the big one in the hook; a cup also rolls in the next cell in the corridor; the cell clock and the office clock both read ten past two; the dent in the cot stays through the second flash.

## Facts and their limits

Checked from web-search summaries only (Wikipedia "Possession of Clarita Villanueva" and mirrors, Philstar 2019 on the film's research, Inquirer Opinion "The Thing", FilipiKnow, an excerpt of Lester Sumrall's book). No 1953 newspaper was read.

| Claim in the video | Status |
|---|---|
| Manila, May 1953; a teenage girl named Clarita held in the Manila City Jail (the old Bilibid) | Consistent; her age differs by source (15, 17 or 18), so the video says only "dalagita" |
| She screamed that two beings bit her: one big and dark, one small | Consistent with the retellings |
| Doctors saw tooth marks, still wet, like saliva | Reported (much of the detail traces to Sumrall, a partisan source); told with "ayon sa mga ulat" (according to the reports) |
| The mayor came and told reporters he saw it | Reported: a US wire story of 20 May 1953, "Manila Mayor Confirms 'Spook' Attacks On Girl" (the headline was found in search, not read) |
| Some doctors said it was in her mind | Reported: medical findings, later set aside, per the summaries |
| An American pastor prayed over her for days; then the bites stopped | Reported (Sumrall's account); told with "daw" (they say) |
| The newspaper page | **A reconstruction** in our words, with no real masthead |
| The second bite, the shadows, the cot sinking, the bite on the doctor's wrist | **Our dramatisation**; never claimed |

## Care

- She was a minor and a real person: her face is never shown, nothing is sexualised, and the narration gives the doctors' explanation.
- Mayor Arsenio Lacson and Lester Sumrall are not named on screen; they are shoes, a hat and hands.
- The prayer is reported, not endorsed or mocked.
- No real recording, photograph or newspaper is used.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish, one performance with `[long pause]` between lines (prompt and credits in `prompt.json`): both takes at once, **836 credits each (1,672)**; take 1 used (65.6 s). `scripts/ep31_voice.py` split it into eight lines, capped the pauses inside a line at 0.24 s and applied atempo 1.05 to fit 60 s; timeline 59.97 s (`src/data/ep31-clarita-v1-timeline.json`).

## Sound

`scripts/ep31_sound.py`. **No score**: the jail itself (room tone, a far ceiling fan, the bulbs' hum, crickets outside). ElevenLabs sound effects (`eleven_text_to_sound_v2`, flow `yHb6WbLuxxQMhDPhRmGR`, four prompts × four variations, about 267 credits): the typewriter, the press, the tin cup and the cell door, picked by measurement. Synthesized: the bites (a soft, close, wet pressure, never a crunch), breaths, steps, the lamp chain, heel clicks, the hat, flashbulbs, cot springs, the blanket dragging, the lamp flame, low hits. Her voice is never heard.

Figures (from `public/assets/audio/ep31-clarita-v1/PROVENANCE.json`):
- bed presence −10.3 dB during speech and −9.5 dB in the gaps (no score, so the whole bed is measured);
- every line ≥4.8 dB over everything else (l08 lifted 1.2 dB, under the typewriter); phone-band margins ≥3.8 dB;
- −14.0 LUFS integrated; decoded AAC peak −1.74 dBFS;
- no stinger inside a line; the loop restarts from black and silence into a breath.

## Render

`npm run sound:ep31` then `npm run render:ep31` (stills: `npm run still:ep31`). The script deletes its Remotion bundle.
