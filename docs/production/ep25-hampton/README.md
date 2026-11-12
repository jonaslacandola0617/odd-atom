# Episode 25: "Camera Three" (v1)

**Delivery:** `assets/videos/ep25-hampton-v1/ep25-camera-three.mp4` (1080×1920, 30 fps, 49.37 s, H.264 two-pass tuned for grain, AAC 192k) with its poster `ep25-camera-three-poster.png` (frame 60: camera 4 on the fire doors). Size and hash are in "Review of the encoded file". It has **no user approval** and **no listening pass**.

**The case:** the Hampton Court Palace CCTV figure, October 2003 (#25 in `docs/stories/season-3-world.md`). A real, documented incident: fire doors that kept opening, and a robed figure on the palace's own CCTV, released by the palace, never explained.

## Why this episode looks and sounds like this

- **Built to the motion rule and the no-gimmick-transitions rule** (hard cuts only).
- **Form:** a guard's handheld night patrol (colour, torch, walking), cut hard against the palace CCTV (monochrome, 8 frames a second, camera names and timestamps): camera 4 full screen on the fire doors; the four-camera wall with a slow push-in; camera 3 full screen. Every shot moves (walking, a turn, digital zooms, the push into the wall).
- **The picture tells it (the mute test):**
  - camera 4: the closed fire doors; **they burst open**;
  - the guard walks the gallery and **pushes them shut** (his gloved hands on the bars);
  - the camera wall; camera 4 again: **the doors burst open; a hooded figure in a long robe with a pale face steps out of the doorway, and pulls the doors shut behind it** (as the released footage was described);
  - the guard hurries back: shut;
  - the camera wall: **on camera 3, a figure in the gallery behind the guard**, almost missed, then closer; the push ends on camera 3;
  - camera 3 full screen: **it stands right behind him**;
  - he turns: **the gallery is empty**; the torch dies; **a pale face in the green of the EXIT sign**; black.
- **Scare placement:** the front (the doors at about 3.2 s), the middle (the figure, about 24–30 s), and the last frames.
- **Sound language:** near silence; the only loud sound is the doors. CCTV has no microphone, so on camera we hear the control room: the monitors' hum and **the fire-door alarm beeping while the doors are open**. When the figure pulls the doors shut, **the alarm simply stops**.
- **Visual language:** handheld torch POV against CCTV.

## Facts and their limits

Checked from **web-search summaries only** (Historic Royal Palaces material, AP and UPI reports from December 2003, Taipei Times, Royal Central, On the Tudor Trail); the footage itself was not viewed.

| Claim in the video | Status |
|---|---|
| Hampton Court Palace, October 2003; three days running, the same fire doors flew open by themselves | Consistent: on three consecutive days staff were called to close a fire door near Clock Court / the introductory exhibition; on the first day the CCTV showed the doors flying open with no visible cause |
| Each time, a guard came to shut them | Consistent |
| On the second day, the security camera caught a figure in a long robe with a pale face who stepped out of the doorway and pulled the doors shut | Consistent with the reports (a costumed or robed figure appearing and closing the doors) |
| The palace released the footage; it has never explained it | Consistent: released in December 2003; Historic Royal Palaces material says there is no explanation |
| Skeptics say it was a visitor in costume, or a prank | Consistent with the explanations offered; the palace did not call it a hoax |
| No one was ever identified | Consistent with the summaries |

**Not used:** the "Skeletor" nickname; blog details (the kitchens, bony hands, 18th-century dress) that conflict with the palace's account; any historical identity (Catherine Howard or others).

## Care

- No member of staff is named; the guard is a generic composite.
- No historical person is claimed for the figure; the skeptics' view is in the narration.
- The gallery, the doors and the camera positions are composites, not the palace's real layout.
- No visiting framing; Hampton Court is a working visitor attraction.

## The cut

| Time (s) | Shot | What the picture shows | Line |
|---|---|---|---|
| 0.0 | Camera 4 | The closed fire doors; a slow zoom | "This fire door is locked. Watch it." |
| 3.2 | | **The doors burst open**; the alarm starts | |
| 4.6 | Guard POV | Walking the gallery with a torch; the doors open ahead | "Hampton Court Palace, England…" / "Each time, a guard came to shut them." |
| 17.0 | | **He pushes the doors shut**; the alarm stops | |
| 18.6 | Camera wall | Four feeds; a push-in | "On the second day, the security camera caught something else." |
| 22.3 | Camera 4 | **The doors burst open**; the alarm | |
| 24–30 | | **A robed, hooded figure with a pale face steps out, then pulls the doors shut behind it**; **the alarm stops** | "A figure in a long robe, with a pale face…" |
| 31.7 | Guard POV | Hurrying back; the doors are shut; his hand on the bar | "The palace released the footage…" |
| 35.8 | Camera wall | **On camera 3, a figure in the gallery behind him**, closer; the push ends on camera 3 | "Skeptics say…" / "No one was ever identified." / "Now look at camera three." |
| 46.4 | Camera 3 | **It stands right behind him** | |
| 47.8 | Guard POV | **He turns: the gallery is empty** | |
| 48.7 | | The torch clicks off; **a pale face in the green of the EXIT sign**; a low hit | |
| 49.0 | Black | → loop | |

## Hidden rewatch details

1. **Camera 3's clock** runs two seconds ahead of camera 4's.
2. **The figure is already on camera 3** in the first camera-wall shot, far down the gallery (look at the bottom-left tile).
3. **The alarm stops** the instant the figure's doors close, with no guard anywhere near them.
4. **The guard never looks behind him** until the narrator tells you to look at camera 3.
5. **The EXIT sign** lights the face at the end: the figure is standing where the guard came from.

**Open question (pinned comment):** who closed the doors?

## Sound (`scripts/ep25_voice.py`, `scripts/ep25_sound.py`)

- **Narrator:** ElevenLabs `eleven_v4`, **Jack**, English; one call on a new flow (`v8zP0Uv9sccfMY4LdoWe`) generated both takes (1,322 credits); take 1 (41.68 s) is used; no tempo change.
- **ElevenLabs sound effects** (`eleven_text_to_sound_v2`, 4 prompts × 4 variations, 272 credits): the doors bursting open, the guard's footsteps and keys, the control-room hum, a door shutting. **Picked by measurement, not listening** (`prompt.json`).
- **Synthesized:** the fire-door alarm panel (2.9 kHz beeps) while the doors are open, mains hum, the gallery's air, torch clicks, cloth on the turn, one low hit on the face.
- **No score.**
- **Mix:**
  - **−14.0 LUFS**; decoded AAC peak **−1.25 dBFS** (limiter ceiling −1.2 dBFS).
  - **Bed presence** (phone band; the whole non-voice bed): **−16.9 dB during speech, −9.2 dB in the gaps** (near silence by design; the room and the alarm duck 6–8 dB under speech).
  - **Line margins:** every line at least 13.9 dB over everything else (15.7 dB in the phone band), no lifts.
  - **Loop seam:** −18.2 dBFS at the head; the last 0.4 s is black and near silence, so the loop restarts from silence.

**No listening pass was possible in this runtime.**

## Reproduce

```
npm run voice:ep25      # needs public/assets/audio/eleven-takes/ep25-take1.mp3
npm run sound:ep25      # needs public/assets/audio/eleven-sfx/ep25-*.mp3
npm run still:ep25
npm run render:ep25
python3 scripts/caption_check.py src/data/ep25-hampton-v1-timeline.json assets/videos/ep25-hampton-v1/ep25-camera-three.mp4 out/oddatom/ep25-captions
```

## Still review passes

1. **Camera 4 was too close**: the doors were two black slabs; it moved back 6.5 m.
2. **The POV hands rendered a black frame** when attached to the camera; they became world-space gloved hands at the push bars.
3. **The tile labels were unreadable smudges**; the wall shows short names, full screen shows names and timestamps.
4. **The second push landed on the wrong tile**; the offset was recomputed to centre camera 3.
5. **The figure in the doorway was only a pale dot** against a black void; the room beyond the doors got a dim wall and floor, the robe got a hood and a longer, darker shape, and the zoom goes further, so it reads as a hooded silhouette with a pale face, as described.
6. **On camera 3, the figure showed its back**; it now faces the camera, behind the guard.
7. **The final face clipped into a green blob**; it moved to 1.6 m, the light became near-white, and the eye sockets and mouth were enlarged.

## Review of the encoded file

- **File:** 38,664,334 bytes; SHA-256 `b97cfb075c5b3ed0f724fec8df7875bed78cdabbcba5e796654ce97a020b6ecb`.
- **Streams:** H.264 1080×1920, 1,481 frames, 49.37 s; AAC 49.37 s (the checked `mix.m4a` muxed with `-c copy`). It decodes with no errors.
- **Loudness:** −14.1 LUFS integrated; peak −1.1 dBFS (ffmpeg ebur128).
- **Dark key:** mean luma sampled twice a second runs 3–61/255, median 20; the brightest frames are the torch on the doors at arm's length.
- **Captions:** all 11 caption cards were found on screen at their timeline times (`out/oddatom/ep25-captions`, not tracked).
- **Muted contact sheet** (every 2 s): camera 4 on the doors; the guard's walk with the torch and the green EXIT; the camera wall; the hooded figure in the doorway on camera 4; the guard hurrying back; the wall pushing in to camera 3; camera 3 full screen with the figure behind him; the face in the dark. It reads without sound.

## Known limits

- The palace interiors are composites; the CCTV positions are invented.
- The robed figure is described from reports, not traced from the footage.
- The effects were chosen without listening. No user approval. Re-check every claim in a full source before posting.
