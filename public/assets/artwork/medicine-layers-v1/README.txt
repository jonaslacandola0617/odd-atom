MEDICINE — SEPARATE PNG ANIMATION LAYERS

14 PNG files, native canvas 1672 x 941, with separate transparent environment,
foreground and biological artwork. See manifest.json for file bounds and pivots.

The clean room has clouds, hanging/window plant foliage, foreground foliage,
clinician and cells removed. Fixed microscope, furniture, glassware, pots and
stool remain. window-view contains only the clear window panes. Keep clouds
clipped behind the fixed mullions. The environment-cutouts sheet and the three
individual environment exports are alternatives, not additive layers.

clinician-cutout.png is a regenerated pose whose framing changed; register and
rig it before use. The demo retains the existing approved-art character rig.
The PNGs are not a PSD, vector document or finished turn-around character rig.

Runtime/source: public/assets/artwork/medicine-layers-v1/
Motion: src/MedicineEnvironment.tsx + src/ArtworkMotion.tsx
Full notes: docs/production/medicine-layers.md
Demo: assets/videos/medicine-layered-environment-8s.mp4

Regenerate PNG exports: npm run assets:medicine-layers
Render demo: npm run render:medicine-layers
Validate/package: python scripts/package_medicine_layers.py

New artwork layers and environment animation are pending user review.
