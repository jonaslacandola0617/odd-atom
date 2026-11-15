# Episode 38: "FWD: Ingat Kayo" (v1)

**Delivery:** `assets/videos/ep38-labo-v1/ep38-fwd-ingat-kayo.mp4` (1080×1920, 30 fps, 48.67 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep38-fwd-ingat-kayo-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep38FwdIngatKayo` in `src/horror/ep38/`:
- `world.tsx` (composites; no real town, market, stall, family or number):
  - **the town from above:** blocks of houses with lit windows; a phone screen lights green in window after window, spreading outward from one house;
  - **the market by day:** a manicure stall under a striped tarpaulin, bottles of polish, a stool, a bulb, a customer's hand and the file; stalls and passers-by behind; the woman (a shared `Rider` figure) with a curtain of hair over the left half of her face;
  - **the house at night:** a front wall, a lit doorway, a mother and two children hurrying in, the door swinging shut, a bar dropped across it;
  - **our room:** a table with the phone (its screen glowing), a wall with a jalousie window of glass slats; outside, between the slats, half a face: the other half under her hair, one eye catching the light, a scar across.
- `Episode38.tsx`: the shot list, the key times (shared with `scripts/ep38_sound.py`), and **the phone**: a 2D pixel-art handset drawn over the 3D room (hand, keypad, antenna nub, a monochrome green LCD with signal bars, battery, a blinking envelope and a pixel font), whose screen states are the episode's script: the hook's forward, the forwards piling up, the inbox count, the unknown number.

The story is #38 in `docs/stories/season-4-philippines.md` (a Visayan urban legend that spread by chain text).

## Form: "the chain"

The episode is the rumour itself: hard cuts between the phone's screen and what each message claims, so the "facts" visibly contradict each other. Every shot moves (the hand's sway, a buzz on every message, slow pushes, people walking); hard cuts only; an eerie score; **a seamless loop** (the last shot is the hook on negative time: the phone buzzing with "1 message received").

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | The phone | It buzzes: 1 message received; it opens: "FWD: Si Maria Labo nakabalik na daw. Ingat kayo. Ipasa sa 10 ka tao." | "FWD: Si Maria Labo, nakabalik na raw. Ingat kayo." / FWD: Maria Labo is back, they say. Be careful. |
| 6.5 | The town from above | Phones light green in window after window | "Noong dekada nobenta, kumalat ito sa text…" / In the nineties it spread by text: a woman who became an aswang, they say, and whose husband hacked her face. |
| 15.3 | The phone | Forwards arrive, each FWD longer, each place different: "Nasa Iloilo daw siya." / "Indi, sa Capiz!" / "Ari na siya diri." | "Nasa Iloilo raw siya. Hindi, sa Capiz. Hindi, nandito na raw." / She's in Iloilo, they say. No, in Capiz. No, she's here now. |
| 21.2 | The market by day | A manicure stall; the woman's hair over half her face; she lifts her head a little | "Manikurista raw siya sa palengke…" / She's a manicurist at the market, they say. Her hair always covers half her face. |
| 27.2 | The phone | The thread scrolls, FWD:FWD:FWD:, the inbox climbing to 99 | "Walang biktimang naitala. Walang petsa. Tsismis lang na pinapasa-pasa." / No victim on record. No date. Just gossip, passed on and on. |
| 32.8 | A house at night | A mother hurries her children in; the door slams; the bar drops | "Pero gabi-gabi, may nanay na nagsasara ng pinto." / But every night, some mother shuts the door. |
| 37.6 | The phone | It buzzes: an unknown number; it opens: "Diin kamo? Ara ko sa gwa." | "Isang text mula sa hindi kilalang numero." / A text from an unknown number. |
| 42.8 | Our room | The phone's light lifts from the table to the jalousie | "Nasa labas na ako." / I'm outside. |
| 44.5 | | Between the slats: half a face, a scar | |
| 47.0 | The phone | The loop: it buzzes again | |

**Hidden details:** every forward adds a "FWD:"; the place changes in every one; the window that goes dark when the door is barred; the last message is in Hiligaynon, the legend's own language.

**Known weaknesses (from the stills):** the town reads as dark blocks with green specks; the people are the blocky shared figures; the face is small until the push-in.

## Facts and their limits

From search summaries (Wikipedia "Maria Labo", the Aswang Project, GMA's feature, a National Gallery Singapore essay). Used: a Visayan urban legend of the 1990s–2000s spread by word of mouth and chain text messages; the story of a woman said to have become an aswang and to have been hacked in the face by her husband; sightings claimed in many places, a manicurist with a scarred face among them. The narration says there is no victim on record and no date. Not used: the crime against children (it stays out of the picture and the narration entirely); the 2015 film; the misremembered-news theory.

## Care

No child is harmed, named or shown in danger beyond being hurried indoors; the crime is never shown or narrated. The legend has been used against returning OFWs and women: the narration calls it gossip with no victim on record, and the woman at the market is only a woman at work. No real town is shown as "her" town (the places named are the rumour's own contradictions); no real market, stall or number. No dares.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **619 credits each (1,238)**; take 1 used (44.24 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change; the gaps were widened for the picture.

## Sound

`scripts/ep38_sound.py`. ElevenLabs sound effects (flow `tzXH3wlop0hENgRPt8ab`, about 267 credits): market-3 (looped), whetstone-2 (a blade somewhere close, under the count, the night and the window), vibrate-3 (normalised; the phone buzzing, **across the loop seam**), door-2 (the slam and bar). Synthesized: **an original message tone** (three short rising beeps through a tiny speaker; not any real ringtone) on every message, keypad clicks, faint tones spreading through the town, crickets, wind, the nail file, quick steps, glass slats, a breath outside, a low hit. **Score:** a drone on F♯1, a detuned string cluster (F♯2, G2, C♯3) with tremolo, an original music-box figure on the message tone's three notes, bowed metal under the count, a heartbeat from the unknown number to the face, a reversed swell and a stinger at the face; loop-quantised.

Figures (`public/assets/audio/ep38-labo-v1/PROVENANCE.json`): bed presence −11.6 dB during speech and −3.3 dB in the gaps; every line ≥4.7 dB over everything else (lifts: l05 +3.3, l06 +5.2, l07 +2.4 dB, others ≤1.5; in the phone band every line is ≥7.9 dB over the rest); −14.0 LUFS; decoded peak −1.15 dBFS; no stinger inside a line (the door now slams just after line 6); the loop seam −15.3 / −15.2 dBFS.

## Render

`npm run sound:ep38` then `npm run render:ep38` (stills: `npm run still:ep38`). The script deletes its Remotion bundle.
