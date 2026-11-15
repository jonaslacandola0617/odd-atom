# Episode 45 "Ang Humahaplos": production notes

`Ep45AngHumahaplos` / `src/horror/ep45/` (`world.tsx`, `Episode45.tsx`) is 51.67 s, 1080×1920 at 30 fps, in Taglish (Juanito). It retells, in our own words, a kind of experience students have shared online: alone in an old campus CR at night, someone strokes their hair. No real school, building or person is used.

## Form: "the mirror and the room"

The mirror is cut against the room, and they disagree. In the mirror a pale hand strokes my hair, slowly, like a mother; in the room nothing touches me, only my head dips with each stroke. In the mirror the last cubicle stands open, and the arm comes all the way across the room from inside it.

| Shot | What happens |
|---|---|
| hook (mirror) | my face over the sink; a long pale arm from behind me, its hand stroking my hair; her standing in the open cubicle |
| hall | the dark campus corridor; I walk toward the one lit door, CR |
| enter | the CR from the door's corner: the flickering tube, four cubicles; I walk to the sinks |
| wash (mirror) | I splash my face twice; behind me all four cubicle doors are shut |
| real | the room, over my shoulder: nothing touches me, but my head gives under each stroke; the last door creaks open, heard, not seen |
| mirror (close) | "Tumingin ako sa salamin": the hand on my head |
| wide (mirror) | the last cubicle open, the arm crossing the whole room to my head |
| her (mirror) | the camera runs back along the arm into the cubicle; her head comes out of the door in three held-then-snapped steps, tipped onto its side; the last snap throws it upright, at the lens (stinger) |
| loop | the hook again |

## Picture technique

- **Mirror shots** are a camera at my eye's mirror image (x < −1.5), looking into the real room with the mirror wall hidden, shown flipped (`translateX(1080px) scale(−6, 6)`), with an old-glass tint and dark spots where the silvering has gone. So the mirror can hold her, the open door and the arm while the room has none of them.
- **The long arm:** a new `reach` prop on `PsxCharacter` (`src/horror/psx/models.tsx`) aims the upper arm and forearm at a world point and stretches the forearm (a new `['stretch', s]` pose step: scale along the bone's own axis, the hand given 1/s) to exactly the length it takes. It is recomputed every frame, so the hand stays on my head while she leans and my head dips.
- **The stroke** runs on one clock (`stroke(t)`, 2.2 s, a cosine, so it is safe on negative time); the hand target follows my crown as the stroke bows my head (measured with the probe).
- **The tube:** `tube(t)` in `world.tsx` drives the light, its material and the sound's buzz and ticks.
- **The set:** box-built (the packs have no restroom props): tiled walls and floor (canvas textures), a sink counter with two basins, four cubicles with partitions, doors hinged on their far edge so the last one swings out of the arm's path, toilets.
- **Cast:** me `Character_08`; her `Character_Monster_05`, pale.

## Lessons

- **Plan a crossing limb against the partitions:** the arm leaves the cubicle's doorway at z ≈ −3.1, clear of the partition at −2.9, only because she stands at z −3.5 and I stand at z −2.3.
- **Measure head heights with the probe before aiming at them:** my crown was 0.1 m lower than estimated, so the first hand floated above my head.
- **Probe values:** Remotion's `renderStill` `onBrowserLog` callback prints a page's `console.log` (logLevel 'error' hides it). Drawing them into the 2D overlay doesn't work, because the overlay draws before the 3D tree.

## Sound (`scripts/ep45_sound.py`)

- **Generated:** ElevenLabs flow `a8s0O25d4u0Cc6XrG5TQ`, 3 prompts × 4 variations, about 320 credits: the CR at night (a 15 s loop), a faucet and splashes (5 s), a cubicle door creaking open (4 s). All variations are in Git (`public/assets/audio/eleven-sfx/ep45-*`).
- **Picked by measurement:** crloop-1 (the steadiest), faucet-1, stall-3 (the others clip).
- **Reused (the library first):**
  - Episode 25's steps-2 (the corridor);
  - Episode 39's humming-3 (looped, far off in the tiles after "Parang nanay");
  - Episode 42's lobby-2 (the corridor's tone);
  - Episode 41's unused drone-3, stinger-3, riser-2, musicbox-4 and neck-3 cracks.
- **The mix:**
  - The room loop is compressed (its tube events swing 25 dB) and folded across the seam.
  - The tube's buzz is synthesized and gated by the picture's own `tube()`, with a tick on every drop-out.
  - A soft brush on hair plays on every stroke, on the picture's stroke clock, so it runs on across the seam.
  - The stall door creaks in the silence after line 5, before we see it open.
  - A neck crack falls on each step of her head; the stinger falls in the silence after the last line.
- **Figures:**
  - presence −9.8 dB in speech and −6.1 dB in the gaps;
  - lines ≥4.8 dB over everything else (phone band ≥7.7 dB; l08 +0.3);
  - −14.0 LUFS; decoded peak −2.35 dBFS;
  - seam −21.8 / −24.6 dBFS.

## Voice

Juanito, `eleven_v4`, both takes at once (1,272 credits; take 1 used, 49.1 s), inner pauses capped at 0.32 s, no tempo change. Prompts are in `prompt.json`.

## Care

- No school, building, course or person is named.
- The figure is never shown harming anyone; the hand only strokes.
- Told as an experience shared online; nothing claimed as verified.

## Status

No user approval and no listening pass.
