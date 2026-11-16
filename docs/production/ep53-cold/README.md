# Episode 53 "Two Nights in the Cold Room"

`Ep53TwoNightsInTheColdRoom` / `src/horror/ep53/` (`world.tsx`, `Episode53.tsx`): 59.18 s, 1080×1920, English (Jack), the PSX models, a score of its own, a seamless loop.

**Story:** accounts shared online of nights in Nigerian hospital mortuaries (a young man who spent two nights at the mortuary where his brother works; attendants' night shifts of power cuts and movement in the dark), told in our own words (`docs/stories/season-6-world.md`). No hospital, city or family is named. Our dramatisation: the blackouts, the slipped sheet, the one sitting up with its stitches open, the heads turned to the torch, the fifteenth body.

## Uniqueness (Season 6 table)

- **Mechanism:** it moves only when unseen. The picture never shows anything move by itself; every change happens in the black.
- **Entity:** the covered dead (box-built under sheets; each head a bump that can turn under the cloth, the cloth sunk into eye sockets and an open mouth when it does), and the one that sits up: the pack's `Character_Monster_01` (flayed, a split face) with its post-mortem Y-incision torn open.
- **Form:** "the blackouts": one locked wide on the cold room, cut by power cuts; each return of the light is a new state. Two other locked frames (the tray by the door; the register at dawn), and one handheld torch in the dark.
- **Scares:** (1) the hook: the light surges back and one of them is sitting up mid-room, facing us; (2) after the first cut a sheet has slipped and an arm hangs; my brother covers it without looking; (3) **mid-point:** two more cuts, and the light comes back on one sitting up by the door, its chest open (**gore**); (4) false calm: "it's gas", he lays it down, shaking; (5) the second night the generator fails; my torch finds every covered head turned to me, and the one beside me sits up toward me; (6) morning, quiet: fourteen in the register, fifteen in the room (one on the floor).
- **Look:** cold cyan tubes; every return of the light stutters and surges green, then settles; the torch is a hard circle in black; dawn is grey and drained.
- **Sound:** the compressor and the tubes run on the power, and so does the score: every blackout is dead silence but for the generator outside and whatever moves unseen (a sheet, stitches tearing). Stingers: a steel tray's shriek on the one sitting up; a tray's squeal as the near one rises. Nothing from Episode 41.
- **Head-snap-to-lens:** not used.

## Cast

- the one that sits up: `Character_Monster_01` (tint `#c8c0b4`), sitting on its tray, a sheet in its lap, its Y-incision drawn open every frame (`Incision`);
- my brother, the night attendant: `Character_25_Doctor_B` (the pack's `Character_25_Doctor` with its skin darkened in a derived texture; white coat);
- me: `Character_14`.

## Shots

| Shot | Time | What happens |
|---|---|---|
| hook | 0–1.7 (and the loop, 56.98–59.18) | black; the generator; the tubes stutter on green: one covered body sitting up mid-room, facing us; the light dies |
| wide | 1.7–27.32 | the locked wide; cut 1 (12.9–15.0): a sheet slipped, an arm hanging; my brother walks over and covers it without looking; cut 2 (24.2–25.1): nothing changed, he looks round; cut 3 (26.2) |
| close | 27.32–39.64 | the light returns on the tray by the door: it sits up, chest open, blood running; my brother comes and lays it back, his hands shaking |
| night | 39.64–44.92 | the second night, the same wide; my brother asleep at the desk; the power dies; the generator fails |
| torch | 44.92–50.86 | my torch: every covered head turned to me, sockets in the cloth; the one beside me sits up toward me; the torch dies |
| ledger | 50.86–54.56 | dawn: the register, fourteen rows, TOTAL 14, his pen running down it |
| morning | 54.56–56.98 | the wide in grey daylight: a fifteenth covered body on the floor in the aisle |

## Lessons

- **`probe` returns positions in the character's parent frame** (its own position and rotation applied, not its ancestors'). An attachment that is a sibling under the same group uses the values directly; in Episode 51 there was no parent transform, so they were world positions.
- **A locked wide down a room of tables belongs over the aisle.** From above one row, that row fills the foreground and hides the aisle where things happen.
- **Double-sided planes go black under the PS1 material** when seen from behind: build hanging cloth from thin boxes.
- **Surfaces that face the camera under ceiling tubes** get only ambient light and crush to black after the grade: add a soft fill from the camera side.
- **A covered head reads as turned** only with the cloth sunk into two sockets and a mouth, seen from above it.
- **Check casting against the setting:** the pack's doctor is light-skinned; for a Nigerian mortuary his skin was darkened in a derived texture (only warm, mid-saturation pixels, so the white coat stays white).

## Sound

`scripts/ep53_sound.py` (stems as FLAC, `PROVENANCE.json`). ElevenLabs flow `SuHzrmyga31E9t0PiTA2` (`docs/production/ep53-cold/prompt.json`; every take and variation is in Git): the cold room 15 s loop, power cut, generator restart, generator failing, sheet sliding, tray squeal, sutures tearing, heads turning under sheets, a 20 s cold drone loop.

**Figures:** presence −8.9 / −3.5 dB, lines ≥6.6 dB with no lifts, −14.0 LUFS, decoded peak −1.0 dBFS, seam −28.2 / −25.8 dBFS, no stinger inside a line.

**Voice:** Jack, both takes (1,846 credits; take 1 used; inner pauses capped at 0.22 s; atempo 1.03 to fit 60 s). **Credits:** about 2,710 in all.

## Status

Delivered; no user approval and no listening pass.
