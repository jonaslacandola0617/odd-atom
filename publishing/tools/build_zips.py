"""Build both download ZIPs.

- publishing/after-sign-off-scheduler.zip           (YouTube + TikTok)
- publishing/after-sign-off-facebook-scheduler.zip  (Facebook Reels)

The Facebook tool shares chrome.mjs and util.mjs with the main tool; they are
copied from publishing/scheduler/src first so the two never drift apart.
"""
import pathlib, shutil, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
for name in ("chrome.mjs", "util.mjs"):
    shutil.copyfile(ROOT / "scheduler/src" / name, ROOT / "facebook-scheduler/src" / name)

SKIP_DIRS = {"node_modules", "videos", "debug"}
SKIP_FILES = {"state.json", "fake.mp4"}
for folder, out, top in [
    ("scheduler", "after-sign-off-scheduler.zip", "after-sign-off-scheduler"),
    ("facebook-scheduler", "after-sign-off-facebook-scheduler.zip", "after-sign-off-facebook-scheduler"),
]:
    src = ROOT / folder
    with zipfile.ZipFile(ROOT / out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(src.rglob("*")):
            rel = p.relative_to(src)
            if rel.parts[0] in SKIP_DIRS or p.name in SKIP_FILES or p.is_dir():
                continue
            z.write(p, pathlib.Path(top) / rel)
    print(out, (ROOT / out).stat().st_size, "bytes")
