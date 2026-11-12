# TRANSFERS: using free online 3D models (rules, 2026-11-12)

The user's idea: "find free models online like sketchfab and cgtrader then lets just remodel them at least
were not starting from scratch".

## Licence rules (this repository is PUBLIC on GitHub)

| Licence | Use in videos | Commit the model file to this repo? |
|---|---|---|
| CC0 / public domain | yes | yes |
| CC-BY (Attribution) | yes, with credit in the video description and `ATTRIBUTION.md` | yes, with the credit beside it |
| CC-BY-SA | yes, with credit; our changed model must stay CC-BY-SA | yes, licensed the same way |
| CC-BY-NC (NonCommercial) | **no**: the channel may be monetized | no |
| CC-BY-ND (NoDerivatives) | **no**: we remodel everything | no |
| CGTrader "Royalty Free" | yes, inside the video only | **no**: the model can't be redistributed as a file. Keep it on Drive, out of Git |
| Sketchfab "Standard" / "Free Standard" | yes, inside the video only | **no**: same as above |
| "Editorial use only" | **no** | no |

- **Check each model:** read the licence on the model's own page before
  downloading, and save the page link with the file.
- **What this licence summary is based on:** CGTrader's help says Royalty Free
  models may be used if incorporated into the product and a third party cannot
  retrieve them on their own. Its subscription terms say no "resale, sharing, or
  redistribution as standalone files".
- **Proof of licence:** for every model, save the page URL, author, licence
  name and download date, so we can prove the licence later.

## Workflow

1. **Download (user).** Sketchfab and CGTrader need an account to download, so
   the user downloads.
   - Save each model (.glb, .fbx, .obj or .blend) in a Drive folder, with a text
     note of the page URL and licence.
   - Share the folder link. Drive downloads work in this environment.
2. **Import and restyle (Claude).** Import in headless Blender and restyle to
   the series look:
   - simplify the shapes;
   - the scene's toon palette (flat colours, no outlines);
   - our scale (metres);
   - pixel-texture details.
   Then export GLB.
3. **Characters:**
   - rig a model to the same 53-bone game-engine skeleton as Nico (automatic
     weights), or keep its own rig if it already has a standard humanoid one;
   - painted pixel-face decals, as for Nico.
4. **Storage:**
   - CC0 and CC-BY results go in `public/assets/3d/` with provenance.
   - Royalty-Free and Sketchfab-Standard results stay out of Git. They live on
     Drive and are fetched into a git-ignored folder at render time.

## Candidates found so far (unverified; open each page and check the licence first)

- **Quaternius**, CC0, the best lead:
  - *Universal Base Characters*: rigged base humans, FBX and glTF, CC0 per the
    pack page.
  - *Universal Animation Library*: animations the same author says fit those
    characters.
  - Free low-poly character and prop packs, also on OpenGameArt.
  - quaternius.com and itch.io are not on this environment's allowed hosts. The
    user can download them, or allow the hosts.
- **Props:** most VHS player and CRT results were paid or showed no licence. A
  Sketchfab "crt tv" is "Free Standard" (no redistribution). A "CRT TV (Type 2)"
  on Superhive is listed as Creative Commons (unverified).
- **Sketchfab search tip:** filter by "Downloadable" and a Creative Commons
  licence (CC0 or CC-BY).
