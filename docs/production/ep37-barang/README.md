# Episode 37: "Pitong Biyernes" (v1)

**Delivery:** `assets/videos/ep37-barang-v1/ep37-pitong-biyernes.mp4` (1080×1920, 30 fps, 51.91 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep37-pitong-biyernes-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep37PitongBiyernes` in `src/horror/ep37/`:
- `world.tsx` (composites; no real healer, family or barangay), all at real scale with the camera insect-sized (near plane 4 mm):
  - **the beetle:** original, about 3.5 cm: a glossy shell whose two halves lift and spread, membranous wings that beat, six legs in a tripod gait (or paddling on its back), antennae;
  - **the table:** a bamboo tube with nodes and a cork that lifts and jiggles, grained wood, a folded paper with an unreadable scribble for a name, a candle stub, a kerosene lamp;
  - **the island at dusk:** a gradient sky, the sea, hills, palms and a stone church tower whose bell hangs still;
  - **the road:** a dirt road at knee height between stilt houses and a bamboo fence, to a door with a lamplit gap under it;
  - **the room:** a banig, a pillow, the sleeper (a blocky face, eyes closed, an ear), his forearm with a bump that travels under the skin (no wound), a bottle of the healers' medicine;
  - **the mountain:** the cauldron on three stones over a fire, herbs turning in it, smoke, golden-hour sky; the healer (a shared `Rider` figure) and a ladle.
- `Episode37.tsx`: the shot list, the key times (shared with `scripts/ep37_sound.py`), the beetle's paths, fog per shot (it stands in for a macro lens's soft background), captions.

The story is #37 in `docs/stories/season-4-philippines.md` (Siquijor folk belief and the Holy Week healers).

## Form: "insect's-eye"

Most shots are at insect scale: macro framings, the world huge and soft behind (fog). There is a hard cut to human scale only for the healers. Every shot moves; hard cuts only; an eerie score; **a seamless loop** (the last shot is the hook on negative time).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | The tube's end, macro | The cork lifts and jiggles; legs, then antennae in the gap | "Gumalaw ang takip ng kawayan. Mula sa loob." / The bamboo's cork moved. From the inside. |
| 4.6 | The table, at insect height | The beetle crawls out of the tube and across the table toward the paper with a name | "Sa Siquijor, may lumang paniniwala sa barang…" / On Siquijor there's an old belief in barang: insects kept in bamboo and sent to a name. |
| 14.5 | The window sill | Good Friday dusk over the island; the church bell hangs still; the shell opens, the wings, it goes | "Biyernes Santo. Tahimik ang mga kampana." / Good Friday. The bells are silent. |
| 18.7 | The flight | Behind it, low over the road between the houses, to the lit gap under a door | "Lilipad ito nang mababa. Sa daan, sa baryo, sa ilalim ng pinto." / It flies low. Over the road, through the village, under a door. |
| 25.0 | His sleeping face | It lands on the pillow, crawls to his ear, and is gone | "At papasok sa natutulog." / And goes into the one asleep. |
| 28.1 | His forearm, morning | Something moves under the skin toward the elbow (a ripple, no wound) | "Kinabukasan, hindi na siya makatayo. May gumagalaw sa ilalim ng balat niya." / The next day he can't stand. Something is moving under his skin. |
| 34.3 | The mountain | The healers' cauldron at golden hour: fire, herbs, smoke; the healer stirs | "Pero karamihan sa mga mananambal ng Siquijor, nanggagamot…" / But most of Siquijor's healers heal. Every Black Saturday they brew medicine on the mountain. |
| 42.6 | His face, the bottle | The medicine at his lips; silence; two clicks of wings from inside him | "Kapag tama ang gamot, lalabas din ito." / If the medicine is right, it will come out. |
| 47.7 | | He coughs | |
| 47.9 | The banig, macro | A beetle on its back, legs paddling | |
| 50.2 | The tube's end | The loop | |

**Hidden details:** the name on the paper is only a scribble; the church bell never moves; the room falls almost silent before the clicks.

**Known weaknesses (from the stills):** the sleeper's face is blocky and reads best from above; the bottle is a translucent green shape that reads as glass only in motion; the forearm reads as a smooth limb with a moving bump, not as detailed skin.

## Facts and their limits

From search summaries (Inquirer "The potions of Siquijor", Rappler on the Holy Week gathering, ABS-CBN on the healing festival, the *Silliman Journal* paper on the mananambal's Holy Week rites, GMA's "The sorcerer of Siquijor", Philstar 2025 on debunking the myth). Used: the belief that a mambabarang keeps insects in a bamboo tube and sends them by name; the healers gathering herbs through Lent and brewing on Black Saturday on the mountain. The narration calls barang a belief and says most mananambal heal. Not claimed: that barang works, or any particular case.

## Care

Siquijor's people have long suffered from the "witch island" label: no real healer, family or barangay is named or shown; the healers are shown curing; no skin is broken, no gore; the church appears only as a silent bell on Good Friday, and nothing is mocked.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **657 credits each (1,314)**; take 1 used (47.28 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change; gaps kept short (0.5–1.2 s) except 2.2 s before the last line, for the silence.

## Sound

`scripts/ep37_sound.py`. ElevenLabs sound effects (flow `8392ieR7Wy214gWEniE8`, about 267 credits): scrape-2 (chitin in bamboo, looped; **it runs across the loop seam**), buzz-2 (the wings, looped through the flight), cauldron-2 (looped on the mountain), cough-4. Synthesized: the lamp hiss, room tone, crickets, the sea and wind at dusk (no bells), the cork knocking, tiny steps on wood and skin, the shell snapping open, the sleeper's breath, a wet creak under the skin, a far rooster, the medicine poured, two clicks of wings in the silence, legs scrabbling on the banig, a low hit. **Score:** a drone on E1, a detuned string cluster (E2, F2, B2) with tremolo, an original seven-note music-box figure, bowed metal under the flight, a heartbeat from the face to the arm, a reversed swell into the cough, stingers; loop-quantised; it drops almost to nothing in the silence before the cough.

Figures (`public/assets/audio/ep37-barang-v1/PROVENANCE.json`): bed presence −14.1 dB during speech (a little under the −8 to −12 target) and −3.4 dB in the gaps; every line ≥4.6 dB over everything else (lifts: l01 +3.1, l03 +0.4, l04 +4.3, l05 +4.8, l06 +2.0 dB; in the phone band every line is ≥8.7 dB over the rest); −14.0 LUFS; decoded peak −1.5 dBFS; no stinger inside a line; the loop seam −15.8 / −15.8 dBFS.

## Render

`npm run sound:ep37` then `npm run render:ep37` (stills: `npm run still:ep37`). The script deletes its Remotion bundle.

## Review of the encoded file

`assets/videos/ep37-barang-v1/ep37-pitong-biyernes.mp4`: 41,926,772 bytes, SHA-256 `d147748af12371bc03b486ca9319c1796c3f0ea1ba948fe4315d022c42ae0319`; H.264 1080×1920, 1,557 frames (51.9 s); AAC 51.88 s; measured from the file: −14.1 LUFS, sample peak −1.5 dBFS. The decoded first and last frames differ by 2.99/255 on average (the loop). A contact board of the encoded file was checked for every shot. No listening pass.
