# Storyboarding and annotation workflow

The archive has complete **frame-addressable measurement**, full-duration navigation and selected detailed cases. It does **not** yet have a verified exhaustive shot/scene count or completed semantics for every shot. [Navigation review](../analysis/storyboard-navigation-review.json) records all 46 inspected pages separately from the 19 case studies.

## Three levels of evidence

1. **Inventory:** original membership, hash, dimensions, actual decoded frame count, PTS and audio streams. [Manifest](../references/manifest.json) is authoritative. Earlier eight short uploads are a separate collection.
2. **Navigation:** first/middle/last of every conservative proposal and fixed-spacing whole-video sheets. Useful for locating design families and actions. Several proposals are too broad: AI proposal031 covers f43006–55265, and Civilization proposal001 covers0–4808. A four-frame Trees blur split aroundf17987 is a counterexample to blindly calling proposals shots.
3. **Temporal case/verified shot:** consecutive evidence, element identities, interaction phases, composition, camera uncertainty and relationship to neighboring shots. Current JSON cases select windows inside larger sequences; their boundaries remain marked `needs_refinement`. They must not inflate the completed-shot count.

## Required storyboard fields

Use [shot-schema.json](../analysis/shot-schema.json). Every actual reviewed shot needs: sourceID/hash; exact half-open frames and PTS; narrative purpose; attention order and normalized layout where useful; stable character/prop IDs; depth/occlusion; background construction; property changes and phases; camera observation versus inference; incoming/outgoing relationship; emotional tone/design notes; evidence files; confidence/basis. Leave an unknown pivot or interpolation unknown instead of assigning a plausible-looking value.

For a reusable action, record initial condition, anticipation/attention, path, maximum pose/contact, consequence, recovery and final hold. If a phase is absent, say so. T01 shows contact without release. A01 is a setup hold, corrected by exporting A02. This correction is part of the research, not a reason to discard the hold.

## Translate a new script into visual decisions

For each spoken idea, write the visual inference separately from the literal wording. Choose a subject/prop that expresses the mechanism or human consequence, not merely the topic noun. Assign a visible action that changes something. Decide what must be visible before the action and what should remain afterward. Then design a handoff to the next idea: an object, direction, scale, material or deliberate cut.

Example: instead of illustrating “a root wants water” as a wiggling root, B establishes water beyond a rock, approaches, contacts, pauses, branches and reaches the destination. For a real film about rock fracture, that detour would be incorrect; R01's crack/swelling mechanism would need another scene. Scientific script validation and visual metaphor validation belong in the storyboard, before expensive rendering.

## Narration and sound sync

The archive transcripts are coarse offline ASR, not exact word alignment. Quote them as context only, with chunk intervals and uncertainty. A new production should have approved final narration, then timed story beats and specific sound contacts. Do not treat a25-second ASR chunk as one shot or infer a sound effect from a bright visual. Direct listening remains necessary for source sound design and final mixes.

## Resume the exhaustive review

Keep the existing proposals stable for provenance. Refine them into a separate verified-boundary layer, exporting overlapping native windows around cuts, masks and continuous transformations. Review all frames inside a candidate and split it where visual ideas demand. Assign recurring object IDs only after identification. Link case observations to the verified containing shot once established. Update the remaining-work manifest with reviewed intervals and exact gaps; do not reset already-completed decoding or present a new threshold run as semantic completion.
