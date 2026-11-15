# Episode 36: "Sunugin Mo ang Damit" (v1)

**Delivery:** `assets/videos/ep36-ikot-v1/ep36-sunugin-mo-ang-damit.mp4` (1080×1920, 30 fps, 52.44 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep36-sunugin-mo-ang-damit-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep36SunuginMoAngDamit` in `src/horror/ep36/`:
- `world.tsx` (composites; no real driver, student or dorm):
  - **the Ikot:** a long jeep with two facing benches, glazed window bays (at night, dark mirrors), a fluorescent tube, grab rails, the driver's cabin with a rosary and **its rear-view mirror turned up to the roof** (the driver is never in a mirror), the yellow roof and its IKOT board, the hood, wheels and step;
  - **the reflection:** the left windows open onto a mirrored copy of the interior (scale x −1 about the window plane) with its own riders, behind a cold tint pane, so the window can disagree with the jeep;
  - **the campus road:** asphalt under acacias and sodium lamps, with a puddle that is a hole in the ground onto the world mirrored in y (its jeep has its own riders);
  - **her room** (a boarding-house room, a bed, a desk, a ceiling light) and **the yard** (a metal can, the fire, smoke);
  - **people:** original blocky riders, her (green jacket, long hair, a bag), the driver (cap), and the grey figure (grey skin, long black hair).
- `Episode36.tsx`: the shot list, the key times (shared with `scripts/ep36_sound.py`), who sits where in the jeep and in its reflections, the jacket's handprints (a canvas texture), the shape in the smoke, captions.

The story is #36 in `docs/stories/season-4-philippines.md` (a UP Diliman campus legend).

## Form: "two jeeps"

Every story beat shows the jeep and its reflection, and they disagree: the dark windows across the aisle, then the puddle on the campus road. Every shot moves (the ride's vibration, the street lamps sweeping past the windows, slow pushes); hard cuts only; an eerie score; **a seamless loop** (the last shot is the hook on negative time).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | Your view across the aisle | In the window, your bench is full, and you are in it; the real bench across is empty | "Sa salamin, puno ang dyip. Pero ikaw lang ang nakaupo." / In the glass, the jeep is full. But you're the only one sitting there. |
| 6.5 | The campus road, low over a puddle | The Ikot comes under the acacias; the puddle shows it upside down | "Sa UP Diliman, may kuwento tungkol sa Ikot, ang dyip na umiikot sa kampus." / At UP Diliman, there's a story about the Ikot, the jeep that circles the campus. |
| 13.9 | Down the aisle, from the front | A coin on the rail; three riders stand and get off, each turning back to look at you | "Gabi na. Isa-isang bumababa ang mga pasahero. At lahat sila, lumilingon sa iyo." / It's late. One by one the passengers get off. And every one of them looks back at you. |
| 21.5 | Over the bench | Your coin; a second coin drops; the vinyl beside you sinks | "Bilangin mo ang barya sa upuan. Sobra ng isa." / Count the coins on the seat. There's one too many. |
| 25.5 | Your view across the aisle | In the window: you, and beside you a grey figure, its head on your shoulder; it lifts its head and looks at you | |
| 27.9 | Behind the driver | The jeep stops; he does not turn; his mirror is turned to the roof; his head bows | "Sa huling hinto, hindi lumingon ang drayber. Mahina lang niyang sinabi," / At the last stop, the driver didn't turn around. He only said, quietly, |
| | | | "pagdating mo, sunugin mo ang damit mo." / when you get home, burn your clothes. |
| 37.2 | Her room, behind her | Dark; the light comes on: two grey handprints on the back of her jacket; she pulls it off | |
| 40.1 | The yard | The jacket burns in a can; a bowed shape rises in the smoke | "Alamat lang daw iyon. Pero buong biyahe raw, may nakakapit sa likod mo." / It's only a legend, they say. But all the way, they say, something was holding on to your back. |
| 46.4 | The road, low over the puddle | The Ikot passes, empty; in the puddle, a dark head in its window | "At umiikot pa rin ang Ikot." / And the Ikot still goes round. |
| 50.7 | Your view across the aisle | The loop | |

**Hidden details:** in the riders' shot the reflection keeps everyone seated after they have got off; the driver's rear-view mirror is turned up to the roof; the handprints have their fingers over the shoulders (someone holding on from behind); in the last shot the head in the puddle's jeep has no one in the real jeep above it.

**Known weaknesses (from the stills):** the last reveal is small (a dark head silhouetted in the reflected window, about a dozen pixels); the grey figure's face is a plain block; the smoke shape reads as a column more than a figure.

## Facts and their limits

A campus legend, from search summaries: Rappler's "Spooky school stories: UP Diliman edition" lists the Ikot story; the Inquirer feature on the spirits of UP Diliman could not be read here (blocked). Endings vary between retellings; the burn-your-clothes advice and the driver who saw something holding on are the core we use. The Ikot itself is a real campus jeep route, said to date from 1949 (UP's own story on its first driver). Nothing in the episode is claimed as a recorded event.

## Care

A real university and real working drivers: no driver or student is named, shown as the source or blamed. The driver is kind: his warning saves her. No real dorm is named. The legend is called a legend in the narration ("Alamat lang daw iyon"). No call to ride it at night.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **599 credits each (1,198)**; take 1 used (43.2 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change; the gaps were widened for the picture.

## Sound

`scripts/ep36_sound.py`. ElevenLabs sound effects (flow `todI6x3jsNGpt5SJUHcQ`, about 267 credits): diesel-4 (about 1 s, looped under a synthesized loop-quantised throb), coin-1 (its first 0.8 s, a coin on the rail before each rider gets off), vinyl-2 (the seat sinking), fire-4 (looped). Synthesized: road rumble and the lamps whooshing past (only while the jeep moves), crickets and a far road, the riders' steps, the coins' clink, **a breath at your ear before the figure looks at you and across the loop seam**, the brakes and handbrake, the light switch, the jacket, the fire catching, the jeep passing outside (louder as it nears), a low hit. **Score:** a drone on G1, a detuned string cluster (G2, G♯2, D3) with tremolo, an original circling music-box figure, bowed metal while she is alone, a heartbeat from then to her room, a reversed swell into the light coming on, a riser and stingers; loop-quantised.

Figures (`public/assets/audio/ep36-ikot-v1/PROVENANCE.json`): bed presence −12.6 dB during speech and −3.6 dB in the gaps; every line ≥4.7 dB over everything else (lifts: l01 +0.7, l03 +1.8, l04 +3.1, l05 +3.2, l06 +3.0, l07 +2.9, l08 +4.3 dB; most of what they clear is the diesel's low end; in the phone band every line is ≥6.0 dB over the rest); −14.0 LUFS; decoded peak −1.36 dBFS; no stinger inside a line; the loop seam −15.7 / −14.9 dBFS.

## Render

`npm run sound:ep36` then `npm run render:ep36` (stills: `npm run still:ep36`). The script deletes its Remotion bundle.

## Review of the encoded file

`assets/videos/ep36-ikot-v1/ep36-sunugin-mo-ang-damit.mp4`: 41,842,610 bytes, SHA-256 `f76fe22ec08270ce76a9daae5cfbc6a48cec93754533e4e883567a88e3ca7345`; H.264 1080×1920, 1,573 frames (52.43 s); AAC 52.42 s; measured from the file: −14.0 LUFS, sample peak −1.4 dBFS. The decoded first and last frames differ by 3.13/255 on average (the loop). A contact board of the encoded file and four frames of the room reveal were checked. No listening pass.
