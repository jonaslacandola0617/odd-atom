# TRANSFERS Episode 1 "Bayad Na": full-length PSX draft v0 (2026-11-15)

The first complete picture of Episode 1, in the PSX look the user chose, cut to the sound-only
draft mix v1 (`public/assets/audio/transfers/ep01-mix/`, 6:00). **A draft, not the finished
episode.** It locks the shot list and timing and shows whether the episode plays. Nothing here
is approved.

## What the user asked for

- "lets just use what you suggested": present-day scenes at **640×360** with the PS1 wobble at
  320×180 strength (vertex snap grid 160×90), letterboxed to 2.39:1; the **1991 tape at 320×240**
  (4:3) so recordings look older and cruder than the present; phone clips 640×360 full frame.
- "the rest i believe you can do it on your own": build the episode.
- Licences: the user confirmed every pack is free to use. The character pack forbids
  re-uploading its files, so nothing from the packs enters Git; the rendered video may.

## How it is built

- **Code:** `src/horror/transfers/ep01/Episode01.tsx` (composition `TransfersEp01`),
  `screens.ts` (PC, paper, CRT and phone pictures), `lipsync.json` (from
  `scripts/transfers_ep01_lipsync.py`), `captions.json` (from the mix's English SRT). It reuses the
  PSX look-test code in `src/horror/transfers/psx/` (shader, rigs, shop set, 1991 room).
- **One performance, many cameras.** `performNico`, `performBea` and `performProps` set every
  character and prop from the episode clock; each shot is only a camera on that timeline. The
  1991 tape has its own clock (`tapeView`), so the fast-forward, rewind, frame-step and the
  flash replay the same footage the cold open showed.
- **Characters.** Nico and Bea are the restyled pack bodies with painted faces (Nico's and Bea's
  neutral from ChatGPT, composited 2026-11-15; their other expressions are re-made from the
  painted neutral until the rest arrive). Lip flap swaps `neutral`/`talk` faces on the frames where
  the line is loud (93 mouth-open spans for Nico, 64 for Bea). The 1991 cast (Rudy in a red polo
  with the price tag, Lola, JoJo, four guests) are Elbolilloduro "Characters PSX" bodies; the figure
  is one of them as a near-black silhouette with longer forearms.
- **Animation** is procedural (the packs have no animation, only a 2-frame T-pose): seated, standing,
  walking, carrying, waving, covering the face, hand IK to the keyboard, mouse, VCR, phone and face.
- **Sets.** The shop (`buildShopEnv`, evening and night variants); the 1991 room is the DoriHome
  flat's living room with our despedida dressing (a long table under a floral cloth, food, a
  cake, softdrinks, monobloc chairs, the INGAT, TATAY RUDY! banner, a fluorescent tube) and the
  camcorder set down on the radio cabinet with the kitchen doorway at frame left.
- **Sound.** The draft mix v1, unchanged, muxed over the picture. It is still the sound-only
  draft: the final mix is to be built to this picture.

## Render

- `node scripts/render_transfers_ep01.cjs --full --chunk 60` renders 1-minute chunks into the
  git-ignored `assets3d/psx-local/ep01/` and joins them; stills with `--stills 3,45,…` (seconds).
- The draft mix is then muxed with ffmpeg (`-c:v copy`).

## Delivery (v0)

- `assets/videos/transfers-ep01-psx-draft-v0/transfers-ep01-psx-draft-v0.mp4`: 1920×1080, 30 fps,
  6:00 picture (the draft mix's audio runs 5:57 under it), H.264 two-pass at about 2 Mbit/s so it
  fits GitHub's 100 MB limit (98.5 MB), the mix's AAC copied unchanged (decoded peak −1.1 dBFS,
  about −14.6 LUFS as measured for the mix). Poster: the phone-clip frame with the figure.
- Render time: about 41 minutes for 10,800 frames at `concurrency: 2` with software WebGL
  (0.11–0.33 s a frame; the 1991 tape at 320×240 plus its overlays is the slowest).

## Known gaps (the next pass)

- **Faces:** only the two neutral faces are painted; the other expressions are warps of them.
- **Bea's uniform** is still the recoloured Japanese blazer on teen proportions.
- **Acting** is stiff: procedural poses, simple walks, no finger animation; the money count,
  the masking-tape label and the shh finger are only suggested.
- **The 1991 cast** keeps the pack's photo faces and has no lip flap (the tape is 320×240).
- **Glasses reflections** of the CRT (the close-up in Scene 2) are not modelled.
- **Lighting** of the night shots at the bench is very dark in places.
- **Sound** is the draft mix; no new SFX were made for this pass and no credits were used.
