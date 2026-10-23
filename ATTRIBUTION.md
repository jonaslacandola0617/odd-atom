# Asset and tooling records

## User-supplied character artwork

The four SVGs in `public/assets/characters/` were supplied by the user in this conversation. The originals are preserved as uploaded. No new ownership or public-use license is asserted for this artwork.

## Fonts

Outfit variable font, distributed by Google Fonts under the SIL Open Font License 1.1. The license is retained at `public/assets/fonts/OFL.txt`.

- Font: https://github.com/google/fonts/tree/main/ofl/outfit

Nunito variable font, used for the revised title lettering, is distributed by Google Fonts under the SIL Open Font License 1.1. Its license is retained at `public/assets/fonts/Nunito-OFL.txt`. It is a chosen production font; the exact fonts in the reference videos have not been identified.

- Font: https://github.com/google/fonts/tree/main/ofl/nunito

## Geographic source

`src/generated/land.geojson.json` is Natural Earth's 1:110m land dataset, distributed as public-domain map data. The globe design, colors, atmosphere, clouds, lighting, and animation are original to this project.

- Dataset: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
- Terms: https://www.naturalearthdata.com/about/terms-of-use/
- Projection: `d3-geo` orthographic projection (ISC license; see the installed package's license).

## Narration

The pilot's narration was generated locally using Kokoro-82M with the stock `am_michael` voice, through `kokoro-onnx`. It is synthetic speech, not a recording or imitation of a particular reference narrator.

- Runtime: https://github.com/thewh1teagle/kokoro-onnx (MIT).
- Official ONNX/voice distribution used: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1
- Base model: Kokoro-82M (Apache 2.0), linked from the runtime's documentation.
- Voice processing: optional timing adjustment with FFmpeg `atempo`, followed by loudness normalization.

## Original production elements

The script, scene design, illustration treatments, animation code, synthesized score, and synthesized effects were created for this pilot. The sound generator uses deterministic oscillators and noise; it does not use sampled commercial music or effects. No footage or soundtrack was extracted from the reference videos for inclusion in the pilot.

## Remotion

Remotion and its CLI are pinned to version 4.0.538 in the lockfile. Remotion's own license applies to use of that software; see the installed packages and https://www.remotion.dev/license.
