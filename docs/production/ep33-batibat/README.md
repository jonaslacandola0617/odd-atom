# Episode 33: "Igalaw Mo ang Daliri" (v1)

**Delivery:** `assets/videos/ep33-batibat-v1/ep33-igalaw-mo-ang-daliri.mp4` (1080×1920, 30 fps, 1,681 frames, 56.02 s, H.264 two-pass tuned for grain, the checked `mix.m4a` muxed with `-c copy`), with its poster `ep33-igalaw-mo-ang-daliri-poster.png`. It has **no user approval** and **no listening pass**.

**Source:** `Ep33IgalawMoAngDaliri` in `src/horror/ep33/`:
- `world.tsx` (composites):
  - **the house:** one room of a wooden house, plank floor and walls, rafters, a capiz window with a shaft of moonlight, a small altar candle;
  - **the post:** a whole tree trunk, bark and all, that breathes;
  - **the sleepers:** a man and his wife on a banig under a kulambo (its top sags under an unseen weight; his chest is pressed flat), their feet at the net's edge (his big toe can lift);
  - **the clock:** a wall clock with a pendulum, from 2:58 to 3:00;
  - **the tree:** an old tree alone in a field at dusk, whose branches bow and which falls;
  - **the batibat:** a vast, soft, dark mass with bark-grey skin, long hair and a heavy grey face with half-closed eyes (a faint self-light so the face reads in the dark).
- `Episode33.tsx`: the shot list, the key times (shared with `scripts/ep33_sound.py`), his POV (looking up, the top of the frame beyond his head), the tunnel vignette that closes during the paralysis, captions.

The story is #33 in `docs/stories/season-4-philippines.md`.

## Form: "paralysis POV"

Most of the episode is the sleeper's own view, locked to his head, cut hard against the one thing he is trying to move: his big toe. The tree and the house are the only wide shots. Every shot moves; hard cuts only; an eerie score; **a seamless loop** (the last shot is the first shot on negative time; the first and last frames differ by 0.04/255 in the stills).

| Time | Shot | Event | Line (Taglish) / English |
|---|---|---|---|
| 0.0 | His POV | A vast grey shape leans in from the edge; the frame is pressed down | "Hindi ka makagalaw. At may nakadagan sa dibdib mo." / You can't move. And something is pressing on your chest. |
| 5.0 | The tree at dusk | Its branches bow under a weight; it falls | "Sa mga Ilokano, may tinatawag na batibat…" / The Ilocanos have a name for it: batibat. An old spirit who lives in a tree. |
| 15.4 | The post | The trunk stands in a new house; something shifts in the rafters | "Kapag pinutol ang puno…" / When the tree is cut and made into a post of a house, they say she comes with it. |
| 18.3 | The house at night | Husband and wife asleep under the kulambo; the bark breathes | "At sinumang matulog sa tabi ng haliging iyon, dadaganan niya." / And whoever sleeps beside that post, she will lie on. |
| 24.1 | The kulambo | Its top sags under an unseen weight; his chest is pressed flat | "Bangungot naman ang tawag ng iba…" / Others call it bangungot. In one Manila study, almost everyone who died in their sleep was a man. Most often, around three in the morning. |
| 29.6 | The clock | 2:59 becomes 3:00; it strikes three (in the gap) | (continues) |
| 36.2 | His POV | The grey face comes down to him; its eyes open | "Sabi ng mga doktor…" / Doctors say it has to do with the heart and with breathing. |
| 41.6 | His big toe | Trembling, trembling; it moves | "Pero kapag nagising ka…" / But if you wake and can't move, you know what to do. Move your big toe. |
| 49.1 | His POV | A gasp; the ceiling is empty; he turns to his wife | |
| 50.5 | Her foot | Her toe does not move; the shape is over her now | "Kung kaya mo pa." / If you still can. |
| 54.2 | His POV | The ceiling; the shape at the edge again: the loop | |

**Hidden details:** the altar candle goes out in the last shot; the clock reads 2:58 in the wide shots before it reads 2:59; the kulambo stays sagged until he wakes, then springs back: the weight has moved to her.

## Facts and their limits

From search summaries (Wikipedia "Batibat", the Aswang Project, Inquirer Opinion "The nightmare called 'bangungot'", Sleepopolis).
- **Folklore:** the batibat is an Ilocano spirit, a huge old woman who lives in a tree; if the tree is made into a house post she comes with it and lies on whoever sleeps beside it. The "wiggle your big toe" cure is widely repeated (the Inquirer column mentions it).
- **Documented:** *bangungot* is also the Filipino name for sudden unexplained nocturnal death; a review of Manila cases from 1948 to 1982 found 96% of the victims were men (mean age 33) and the most common time of death was 3 a.m. Doctors link it to the heart (for example Brugada syndrome) and to breathing in sleep. The narration says "halos lahat … ay mga lalaki" (almost all were men) and "bandang alas tres" (around three).
- The wife's state at the end is our dramatisation and is left open.

## Care

Real people die of bangungot: no death is shown, and the narration gives the medical view. The batibat's size is dread, never a joke. No real town. (A suggestion for the posts: anyone with symptoms should see a doctor.)

## Voice

ElevenLabs **Juanito** (`u1CVBnSUn9JiL8ssgd2v`, `eleven_v4`), Taglish; both takes at once, **746 credits each (1,492)**; take 1 used (51.4 s). Split into eight lines, pauses inside a line capped at 0.32 s, no tempo change.

## Sound

`scripts/ep33_sound.py`. ElevenLabs sound effects (flow `xOvPJ12vuHpmYtP4GLDI`, about 267 credits): breath-2 (his strained breathing in the POV; it runs across the loop seam), breath-1 (the gasp awake), tree-4 (its crash aligned to the fall), creak-3 (the post and the floor taking weight). Synthesized: the clock's tick on whole seconds and its three chimes (no generated take had three clean strikes), insects that drop away in his POV, the dusk wind, the banig, a low hit. **Score:** a drone on G♯1, a detuned string cluster (G♯2, A2, D♯3) with tremolo, an original out-of-tune music-box lullaby, bowed metal over the post, a heartbeat under the toe that stops dead when he wakes, a reversed swell and stingers; loop-quantised.

Figures (`public/assets/audio/ep33-batibat-v1/PROVENANCE.json`): bed presence −10.6 dB during speech and −3.1 dB in the gaps; every line ≥4.6 dB over everything else (l06 +1.7, l07 +1.2, l08 +0.5 dB lifts); −14.0 LUFS; decoded peak −1.48 dBFS; no stinger inside a line; the loop seam −18.9 / −18.9 dBFS.

## Render

`npm run sound:ep33` then `npm run render:ep33` (stills: `npm run still:ep33`). The script deletes its Remotion bundle.

## Review of the encoded file

`assets/videos/ep33-batibat-v1/ep33-igalaw-mo-ang-daliri.mp4`: 45,369,535 bytes, SHA-256 `625f7051cbbb2ffe5c5879b097984dd63878456231a9b5f4b46dacaaa3979d4f`; H.264 1080×1920, 1,680 frames (56.0 s); AAC 56.02 s; measured from the file: −14.0 LUFS, sample peak −1.48 dBFS. The decoded first and last frames differ by 1.14/255 on average (the loop). A contact board of the encoded file was checked for every shot. No listening pass.
