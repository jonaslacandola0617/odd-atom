# TRANSFERS: painting Nico's and Bea's PSX faces with ChatGPT

2026-11-15. How to get hand-painted PS1-style face textures from ChatGPT for the PSX look test,
so Nico and Bea can change expression the way PS1 games did: by swapping the face texture.

## Why the earlier tries failed, and what is different now

When a whole texture atlas (a sheet of flattened body parts) goes to ChatGPT or Gemini, it
redraws it as a picture and moves things around. The atlas only works if every pixel stays
where the 3D model expects it, so the result came out scrambled on the model.

This time ChatGPT gets **only the face square**, already flattened in its exact place, and
is asked to repaint the face inside it **without moving anything**. Our script then shrinks
the result back to texture size and pastes only the face area (through a mask) into the
texture. Small drifts are forgiven, because only the masked area is used.

## What to upload (templates)

The templates are made from the user's PSX packs, whose licences are unconfirmed, so they are
not in the public repo. They are on the private review page "TRANSFERS PSX Test"
(right-click or long-press an image there and choose "Save image"), and can be rebuilt with
`python3 assets3d/characters/psx/face_templates.py templates <packs-dir>` into
`assets3d/psx-local/face-templates/`.

| File | What it is |
|---|---|
| `nico-face-template.png` | Nico's face square, 1024×1024 (88×88 texels on his 256×256 texture). **Upload this one.** |
| `nico-face-guide.png` | The same square with the face mesh (magenta), the eye lines (cyan) and the mouth line (yellow). Upload it too, as a layout reference. |
| `nico-face-mask.png` | White = the part we paste back. For you, not for ChatGPT. |
| `bea-face-template.png`, `bea-face-guide.png`, `bea-face-mask.png` | The same for Bea (88×88 texels on her 512×512 texture). |

## The 8 expressions

Use exactly these names: `neutral`, `focused`, `worried`, `fear`, `smile`, `sleepy`, `shh`, `talk`.

| Name | Nico | Bea |
|---|---|---|
| `neutral` | tired, flat, eyes slightly heavy | quiet, serious, big dark eyes |
| `focused` | brows drawn down and together, eyes narrowed at a screen | the same, a child concentrating |
| `worried` | inner brows up, mouth corners down | inner brows up, lips pressed |
| `fear` | frozen fear: eyes wide with white showing, brows up, mouth a little open | the same, wide-eyed, mouth open slightly |
| `smile` | a forced smile: the mouth smiles, the eyes don't | a small polite smile (unsettling if held) |
| `sleepy` | eyelids two-thirds closed | eyes half open (her "asleep but watching" look) |
| `shh` | whisper: lips pushed together and forward, eyes wary | the same; a finger is not needed (that is the hand pose) |
| `talk` | the neutral face mid-word: mouth half open, jaw slightly down, teeth barely showing; nothing else changes | the same |

`talk` is swapped with `neutral` while a character speaks (PS1-style lip flap), so it must
match `neutral` exactly apart from the mouth.

## The prompt (paste into ChatGPT once per character, then ask for each expression)

Upload `nico-face-template.png` and `nico-face-guide.png` (or Bea's two), then paste:

> I'm making a PS1/PSX-era horror game character. The first image is a 1024×1024 crop of the
> character's face texture: the face is flattened (unwrapped) exactly as the 3D model uses it.
> The second image is the same crop with a magenta mesh, cyan eye lines and a yellow mouth
> line, for layout only.
>
> Repaint ONLY the face in the first image as a hand-painted PS1-style texture, and keep
> everything else exactly where it is:
> - Same canvas: 1024×1024, square, same framing. Do not zoom, crop, rotate, mirror or
>   re-center. The eyes must sit on the cyan lines and the mouth on the yellow line.
> - Front view, flat and unwrapped like the template. Not a portrait, no perspective, no head
>   outline, no background scene.
> - Keep the hair, ears and the skin around the face as they are in the template.
> - Style: low-resolution hand-painted PS1 texture, like a 90s survival-horror game. Soft
>   painted shading baked in, lit evenly from the front and slightly above (the same light as
>   the template). Limited palette, no black outlines, no cel-shading, no anime or cartoon
>   style, no photo realism, no text, no watermark.
> - Character: NICO, 34, Filipino man, tanned skin, tired eyes with dark under-eye bags,
>   heavy brows, a short beard shadow (stubble only, not a full beard), no glasses (the
>   glasses are a separate 3D model).
>
> Make the expression: NEUTRAL (tired, flat).
>
> Then I'll ask for more expressions. Each one must keep exactly the same layout, skin tone,
> stubble and lighting; only the brows, eyelids, eyes and mouth change.

For Bea, replace the "Character" line with:

> - Character: BEA, 9, Filipino girl, light-brown skin, straight black hair with a fringe
>   (keep the template's hair), big serious dark-brown eyes, a real child, not cute, not chibi.

Then, in the same chat, one message per expression:

> Same face, same layout, same lighting. Expression: FOCUSED (brows drawn down and together,
> eyes narrowed as if staring at a screen).

(and so on for WORRIED, FEAR, SMILE, SLEEPY, SHH and TALK, using the descriptions in the table above).

**Check each result before you save it:** lay it over the guide image (or flick between the
two). The eyes should be on the cyan lines, the mouth on the yellow line, and the face the
same size. If ChatGPT zooms or moves the face, say "Keep exactly the template's layout and
size; the eyes on the cyan lines" and regenerate.

## Naming and sharing

- Save each as PNG, 1024×1024, named `<who>-<expression>.png`: `nico-neutral.png`,
  `nico-focused.png`, `nico-worried.png`, `nico-fear.png`, `nico-smile.png`,
  `nico-sleepy.png`, `nico-shh.png`, `nico-talk.png`, and the same for `bea-…`.
- Put all 16 in one Drive folder and share the folder link in chat. If time is short, start
  with neutral, talk, focused and fear for each.

## What happens next (Claude's side)

`python3 assets3d/characters/psx/face_templates.py composite <folder>` shrinks each face to
the texture's 88×88 texels and pastes it through the mask into
`public/assets/3d/psx-local/<who>/tex_<expr>.png`. The procedural versions are kept as
`tex_<expr>_auto.png`. `setFace(expr)` in `src/horror/transfers/psx/faces.ts` then swaps them
at render time. The look test is re-rendered for review.

Note on resolution: on screen, a face is at most about 60–100 pixels tall in our 320×180
frame, so the painting is shrunk to 88×88 texels. Clear, bold shapes (brows, lids, mouth)
survive this; fine detail will not.
