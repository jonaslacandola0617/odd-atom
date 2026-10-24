# Medicine and cyber: animated approved artwork

Both static artworks and their cross-topic drawing consistency were explicitly passed by the user. These two separate motion studies animate those scenes with Remotion. Each delivery is **20 seconds, 1920 × 1080, 30 fps**, with original synthesized sound and no narration or on-screen text.

## Medicine

**[Download MP4](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/medicine-artwork-motion-20s.mp4)** · [Poster](../../assets/videos/medicine-artwork-motion-20s-poster.png) · [Approved source](../../assets/scenes/artwork-consistency-02/medicine-immune-defense.png)

![Medicine movement excerpt](artwork-motion/medicine-motion.gif)

- Red blood cells travel independently in front/back flow lanes inside the microscope view.
- Two microbes drift inward and are engulfed in sequence. The immune-cell membrane deforms with anticipation, closing and settling; its brighter foreground lobes overlap the microbes.
- The clinician blinks and makes staged head/torso reactions. Her specimen slide rises and settles while her lower microscope hand remains braced at the control. The knob has a restrained rotation beneath the hand.
- The nearby plant sways independently. The camera makes a gentle staged move while room architecture, microscope and bench stay steady.

[Encoded sequence](artwork-motion/medicine-sequence.jpg) · [Blink/contact/capture details](artwork-motion/medicine-details.jpg) · [Approved artwork versus rendered frame](artwork-motion/medicine-source-comparison.jpg)

## Cyber

**[Download MP4](https://github.com/jonaslacandola0617/odd-atom/raw/refs/heads/main/assets/videos/cyber-artwork-motion-20s.mp4)** · [Poster](../../assets/videos/cyber-artwork-motion-20s-poster.png) · [Approved source](../../assets/scenes/artwork-consistency-02/cyber-network-defense.png)

![Cyber movement excerpt](artwork-motion/cyber-motion.gif)

- Mint, cream and blue packet objects move along the main causeway and the more distant server route, with scale changes for depth.
- The gateway scans as traffic passes. Foreground pylons and buildings occlude the appropriate traffic layers.
- Coral fragments descend the side chute, fall into the basin, bounce and settle. Arrivals finish before the ending hold; clean traffic continues flowing.
- Three fan rotors spin in their projected elliptical housings, with restrained window-light activity and a gentle camera move.

[Encoded sequence](artwork-motion/cyber-sequence.jpg) · [Routes/fans/containment details](artwork-motion/cyber-details.jpg) · [Approved artwork versus rendered frame](artwork-motion/cyber-source-comparison.jpg)

The GIFs are four-second normal-time samples, reduced to 720 pixels wide and 15 fps for convenient review. The downloadable MP4s retain the full delivery resolution and frame rate. Diagnostic labels appear only on review boards.

## Preserve the drawing

The approved scene PNGs remain unchanged. Source-image copies are kept byte-for-byte for runtime use. Registered vector mattes select the original clinician and foliage pixels; the animation does not substitute a new face, garment or plant painting. A localized stationary contact region protects the microscope grip. The lower body stays held, avoiding a false sliding seat or floor contact.

Image generation prepared versioned clean plates behind moving silhouettes, an eye-close alternate, and a cell sprite atlas adapted from the approved cell designs. The transparent extraction changed scale/position slightly, so feature registration was measured separately for clinician and foliage, with median inlier error about one source pixel. Connected-component outlines remove detached alpha debris. The cell sprite atlas supplies the separate surfaces needed for overlap and capture. Cyber packet and fragment sprites sample colors and shaded planes from the approved source image.

The first previews exposed cutout debris, a truncated lower-body matte, and traffic appearing over foreground structures. The retained version holds the lower body and microscope contact, uses registered vector silhouettes, layers the cell membrane around microbes, and restores foreground structures over traffic. These are limited 2D illustration rigs; the studies do not add full character turnarounds, walking or lip sync.

## Validation and source

Both full movies decoded without errors. Each has 600 H.264 frames, AAC 48 kHz stereo, exact 20.000-second audio/video/container timing, and fast-start metadata. All nine approved baseline hashes and every runtime PNG hash matched their records. Geometry checks covered 600,000 triangle configurations with no foldovers, zero measured displacement at the braced contact anchor, and settled fragment centers inside the basin. These checks support review; user judgment determines animation quality.

[Delivery validation](artwork-motion/validation.json) · [Geometry checks](artwork-motion/geometry.json) · [Layer-generation prompts](artwork-motion/layer-generation.json) · [Runtime asset hashes](artwork-motion/assets.json)

[Motion source](../../src/ArtworkMotion.tsx) · [Texture renderer](../../src/art/TextureMesh.tsx) · [Registered outlines and sprite contours](../../src/data/artwork-motion-registration.json)

These are deliberately wordless visual tests with original generated musical/ambient beds and object cues. No voice API request was needed or made.

## Render again

The committed layers and audio allow offline rendering without image-generation or speech requests:

```sh
npm run typecheck
npm run render:artwork-motion
npm run review:artwork-motion
```

Select `MedicineArtworkMotion` or `CyberArtworkMotion` in Studio. To render only one, run `node scripts/render_artwork_motion.cjs medicine` or `node scripts/render_artwork_motion.cjs cyber`. `npm run still:artwork-motion` renders pose checks. `npm run sound:artwork-motion` regenerates the deterministic original sound beds. Python review/audio utilities use Pillow/NumPy and FFmpeg; Chromium remains `/usr/bin/chromium` in this environment.
