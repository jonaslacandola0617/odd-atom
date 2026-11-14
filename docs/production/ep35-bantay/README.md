# Episode 35: "Bantay" (v1)

**Delivery:** `assets/videos/ep35-bantay-v1/ep35-bantay.mp4` (1080×1920, 30 fps, 52.04 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep35-bantay-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep35Bantay` in `src/horror/ep35/`:
- `world.tsx` (a composite provincial wake, no real family, town or parlour):
  - **the room:** tiled floor, a fluorescent tube, a wall clock, a covered mirror on the side wall, a door, twelve monobloc chairs in three rows;
  - **the coffin:** white, with a glass window over the face, candle stands and flowers;
  - **the mirror:** a wall opening onto a mirrored copy of the coffin set (scale x −1), so the mirror can show what the room does not;
  - **the body:** a stiff man in a barong, arms at his sides (never decayed or wounded);
  - **the mourners and the watcher:** the shared `Villager` figures.
- `Episode35.tsx`: the shot list, the key times (shared with `scripts/ep35_sound.py`), the fog on the glass (a canvas texture drawn from inside), the chase paths, captions.

The story is #35 in `docs/stories/season-4-philippines.md` (Visayan folklore and the real custom of the lamay).

## Form: "the clock"

One house, one night, in hard cuts by the hour, the camera orbiting the coffin a little lower and closer each hour, as if the room were sinking into sleep; then one top-down chase, the only fast motion in the episode. Every shot moves; hard cuts only; an eerie score; **a seamless loop** (the last shot is the hook on negative time; the first and last frames differ by 3.4/255 in the stills).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | The coffin glass | The glass fogs from the inside; after the line, four finger streaks are drawn down it from inside | "Humahamog ang salamin ng kabaong. Mula sa loob." / The coffin's glass is fogging. From the inside. |
| 5.4 | 9 p.m., high orbit | The wake is full, the prayers murmur | "Bakit tayo nagpupuyat sa lamay? Sabi ng matatanda, para bantayan ang bangkay." / Why do we stay up all night at a wake? The elders say: to guard the body. |
| 11.9 | 11 p.m., lower | Three left; the candle flames lean toward the coffin | "Dahil noon, may mga nilalang na kumukuha ng patay." / Because back then, there were creatures that took the dead. |
| 17.0 | 1 a.m., lower still | One watcher left, dozing | "Sa mga kuwento sa Kabisayaan, may amalanhig. Bangkay na bumabangon." / In Visayan stories, there is the amalanhig. A corpse that rises. |
| 23.5 | 2 a.m., the watcher's view | The cloth slides off the mirror: in the mirror the lid is open; the camera turns to the room: shut | "Matigas ang katawan. Hindi makabaluktot. Kaya diretso lang itong maglakad, pero mabilis." / Its body is stiff. It can't bend. So it can only walk straight, but fast. |
| 31.4 | The clock | 2:59 → 3:00, three strikes | "Kapag hinabol ka raw, tumakbo ka nang paliko-liko." / If it chases you, they say, run in zigzags. |
| 35.4 | Over the watcher's shoulder | The body is standing beside its coffin | "Alas tres na. Tulog na ang lahat ng nagbabantay." / It's three. Everyone keeping watch is asleep. |
| 41.1 | Its face | It turns, stiffly, to you | "Maliban sa iyo." / Except you. |
| 43.0 | From above | You run zigzag between the chairs; it goes straight, slamming through three of them, toward the door | |
| 47.6 | Dawn | Daylight; the coffin shut; low across the floor, the chairs it hit lie overturned, with mud on the tiles (the mourners are back, at the edges of the frame) | |
| 50.3 | The coffin glass | The loop | |

**Hidden details:** in the 2 a.m. mirror the coffin's lid stands open, while the room's coffin is shut; the candle flames lean toward the coffin at 11; the chairs it hit are still down at dawn, and there is mud on the tiles.

**Known weaknesses (from the stills):** at 9 p.m. most mourners are hidden behind the chair backs (one reads clearly); the mirror at 2 a.m. shows the raised lid as a pale slab rather than the whole coffin; at dawn the mud reads faintly and the mourners only at the frame's edges.

## Facts and their limits

Folklore and custom, from search summaries (Wikipedia "Amalanhig" and "Funeral practices and burial customs in the Philippines", the Aswang Project on the maranhig, an Inquirer Opinion column on the lamay and the aswang). Used: the amalanhig as a Visayan risen corpse, too stiff to bend or turn, so it goes in straight lines; the advice to run zigzag; the old explanation that the wake is kept all night to guard the body; covered mirrors. Not used: the details that the Aswang Project traces to *Pedro Penduko* komiks. No region more specific than "Kabisayaan" is named.

## Care

No real family, town or funeral parlour. The dead man is never shown decayed or wounded, and his face is a plain mask. The custom is told with respect: keeping watch is shown as the reason everyone is there. No one is shown harmed; the watcher gets out.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **582 credits each (1,164)**; take 1 used (41.44 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change; the gaps were widened for the picture.

## Sound

`scripts/ep35_sound.py`. ElevenLabs sound effects (flow `ca5s2GetYsp9lHxp7QWQ`, about 267 credits): prayers-3 looped as the 9 p.m. murmur (thinned at 11, gone by 1), cards-1 at 11, tuko-4 from 11 until it stops before three, chairs-3 and chairs-1 on the three chairs it slams through. Synthesized: room tone, the fluorescent tube (louder as the room empties), the clock ticking on whole seconds and striking three, **a breath behind the coffin glass that runs across the loop seam**, fingers squeaking on the glass, the cloth sliding off the mirror, stiff wooden creaks as it stands and turns, its heavy straight steps against the watcher's quick zigzag steps, the door, a low hit, a far rooster and morning birds. **Score:** a drone on F1, a detuned string cluster (F2, F♯2, C3) with tremolo, an original slowing music-box lullaby, bowed metal at 2 a.m., a heartbeat from the moment it stands, a reversed swell, a riser and stingers; loop-quantised, quieter at dawn.

Figures (`public/assets/audio/ep35-bantay-v1/PROVENANCE.json`): bed presence −12.0 dB during speech and −2.5 dB in the gaps (the chase is loud by design); every line ≥4.6 dB over everything else (lifts: l04 +1.3, l05 +1.8, l06 +2.7, l07 +4.2, l08 +3.9 dB); −14.0 LUFS; decoded peak −1.48 dBFS; no stinger inside a line (the finger streaks were moved after line 1 so their stinger sits in the gap); the loop seam −15.2 / −15.2 dBFS.

## Render

`npm run sound:ep35` then `npm run render:ep35` (stills: `npm run still:ep35`). The script deletes its Remotion bundle.

## Review of the encoded file

`assets/videos/ep35-bantay-v1/ep35-bantay.mp4`: 41,693,428 bytes, SHA-256 `72122067fcdee433a93d9459018d6ebd0339817d77159888764c648a13a285d0`; H.264 1080×1920, 1,561 frames (52.03 s); AAC 52.03 s; measured from the file: −14.0 LUFS, sample peak −1.5 dBFS. The decoded first and last frames differ by 3.46/255 on average (the loop). A contact board of the encoded file was checked for every shot. No listening pass.
