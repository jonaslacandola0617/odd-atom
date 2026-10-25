# Regenerable search index

`analyze.py` writes `reference-index.sqlite` here. Tables cover source videos and proposed shots; the `search` FTS5 table supports title and annotation searches. This database is ignored because the tracked JSON files are authoritative and portable.

The compressed frame index, every-frame metrics and feature-pair data are under `../../analysis/`. No nominal-FPS timestamps are substituted for presentation timestamps.
