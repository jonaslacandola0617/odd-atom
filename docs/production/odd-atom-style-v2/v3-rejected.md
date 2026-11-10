# Jupiter opening v3 (flat cel redraw): rejected

User feedback on 2026-11-10, after the v2 test: "Its improved but i dont like the art, study the art of kurzgesagt, i want the same quality of drawings."

v3 restudied native reference frames: the vertical sample shorts (Saturn, Io and a moon surface) and a native 1440p character frame from the *First Civilization* video. It then redrew the same shots with a flat cel kit (`src/oddatom/flat.tsx`): hard-edged single shadow shapes, rounded patch surfaces, thin rim lines, sparkle stars, puffy limbs and layered flat flames. The composition is `OddAtomJupiterV3Opening` (`src/OddAtomJupiterV3.tsx`).

The user stopped the work during still review: **"Nvm its too ugly."** No MP4 was rendered or delivered.

Conclusion: drawing art by writing shape coordinates in code reproduces the techniques but not the drawing quality of the reference channel. Do not try to iterate further on this kit to reach that bar. The options offered to the user are:
1. hand-drawn layered vector art that is then animated in Remotion;
2. user-approved generated style frames that are split into layers and then animated;
3. keeping the current art level and focusing on script and motion.

Keep this kit only as rejected comparison material.
