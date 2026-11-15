# Episode 39: "Sino ang Susundo" (v1)

**Delivery:** `assets/videos/ep39-sundo-v1/ep39-sino-ang-susundo.mp4` (1080×1920, 30 fps, 48.79 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep39-sino-ang-susundo-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep39SinoAngSusundo` in `src/horror/ep39/`:
- `world.tsx` (a composite public ward; no real hospital or family):
  - **the ward:** pale two-tone walls, a doorway onto a dark corridor, a fluorescent tube that can flicker, curtains, other beds far off; a wall shadow drawn on a canvas (the IV stand's, and, on night two, a woman's beside it);
  - **the bed:** Tatay lying with his head raised, a blanket that breathes, a smile, a mouth that moves when he talks, an arm that reaches, an IV with a drop falling, an oxygen concentrator;
  - **the two monobloc chairs:** mine by the bed and the other across it, which comes nearer on night three;
  - **me** (a shared `Rider` figure, seated, dozing, turning) and **Nanay** (the same figure, pale, long hair), sitting in the far chair in the hook and standing in the doorway at the end.
- `Episode39.tsx`: the shot list and the key times (shared with `scripts/ep39_sound.py`).

The story is #39 in `docs/stories/season-4-philippines.md` (the Filipino belief in the *sundo*).

## Form: "the nights"

Four nights, each a hard cut onto a slow push toward the bed, a little closer each night, as if the camera were the visitor. Day never comes. Every shot moves; hard cuts only; an eerie score; **a seamless loop** (the last shot is the hook on negative time: the far chair with someone in it).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | From the doorway | My chair by Tatay's bed; across the bed the other chair, and someone sitting in it | "Dalawa ang upuan sa tabi ng kama ni Tatay. Isa lang ang inuupuan ko." / There are two chairs beside Tatay's bed. I only sit in one. |
| 6.4 | The ward | The push down the ward to his bed | "Sabi ng matatanda, bago pumanaw ang isang tao, may sumusundo sa kanya…" / The old folks say that before someone passes, someone comes to fetch them. A loved one who went ahead. |
| 15.5 | Night 1 | Tatay smiles at the empty doorway | "Unang gabi. Ngumiti si Tatay sa pinto. Walang tao roon." / The first night. Tatay smiled at the door. No one was there. |
| 20.6 | Night 2 | The drip; on the wall beside its shadow, a woman's | "Ikalawang gabi. Sabi niya, mamaya pa. Mamaya pa." / The second night. He said, later. Later. |
| 25.9 | Night 3 | I sleep; the other chair slides nearer | "Ikatlong gabi. Nakatulog ako. Paggising ko, mas malapit na ang kabilang upuan." / The third night. I fell asleep. When I woke, the other chair was closer. |
| 32.5 | Night 4 | His hand takes mine | "Ikaapat na gabi. Hinawakan ni Tatay ang kamay ko." / The fourth night. Tatay took my hand. |
| 37.1 | Close on him | His eyes go past me | "Nandito na siya. Pero hindi ako ang sinusundo niya." / She's here. But it's not me she's fetching. |
| 41.4 | I turn | The tube flickers: Nanay in the doorway, looking at me | "Si Nanay. Nakatingin sa akin." / Nanay. Looking at me. |
| 47.1 | From the doorway | The loop: the far chair, someone in it | |

**Hidden details:** someone is already in the far chair in the first frame; the woman's shadow on night two has long hair, as Nanay does; the far chair is nearer in every shot after night three; the concentrator's breathing never stops.

**Known weaknesses (from the stills):** the figures are the blocky shared ones; the woman's shadow is faint at phone size; the far chair's move on night three is small in a wide frame.

## Facts and their limits

From search summaries (GMA, the Aswang Project on Iloko beliefs about death, an essay on Philippine funerary superstitions; the 2009 film *Sundo* is only context). Used: the widely held belief that a loved one who has died comes to fetch the dying. Not used: the KMJS "Sundo" story or any family's testimony; hospice "deathbed visions" are not claimed as proof.

## Care

A composite family and ward; no real hospital. The father's death is never shown; the grief is tender and the fetcher is loving, not monstrous; nothing claims the son will die (it ends on her look). No dares.

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **622 credits each (1,244)**; take 1 used (50.8 s). Split into eight lines, no tempo change; gaps set for the picture.

## Sound

`scripts/ep39_sound.py`. ElevenLabs sound effects (flow `kBXifU3jE0k2CWVgyMlV`, about 267 credits): oxygen-3 (the concentrator, looped and folded so it **runs across the loop seam**), ward-3 (the ward far off, looped), slippers-4 (soft steps coming nearer before the turn), humming-3 (a woman humming far down the corridor, filtered and reverberant, only between lines). Synthesized: the tube's hum (it drops out when the tube flickers), the IV drip on a loop-quantised period, a breathing hiss with the concentrator, the chair scraping nearer, cloth, a rustle as I turn, the tube's buzz, a low hit, a breath across the loop seam. **Score:** a drone on F1, a detuned string cluster (F2, F♯2, C3) with tremolo, an original slow music-box lullaby (in the ward and again on night four), bowed metal under night three, a heartbeat from night four to the doorway, a reversed swell and a stinger when Nanay is in the doorway; loop-quantised.

Figures (`public/assets/audio/ep39-sundo-v1/PROVENANCE.json`): bed presence −11.4 dB during speech and −4.4 dB in the gaps; every line ≥4.6 dB over everything else (lifts up to +3.9 dB, l08; in the phone band every line is ≥6.7 dB over the rest); −14.0 LUFS; decoded peak −1.12 dBFS; no stinger inside a line; the loop seam −16.4 / −16.4 dBFS.

## Render

`npm run sound:ep39` then `npm run render:ep39` (stills: `npm run still:ep39`). The script deletes its Remotion bundle.
