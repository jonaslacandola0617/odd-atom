"""Add new episodes to both schedulers from their per-episode publishing kits.

Usage: python3 publishing/tools/add_episodes.py <git-ref> <first-ep> <last-ep>
Example: python3 publishing/tools/add_episodes.py origin/claude/season-4-ph-slate 21 50

Each kit (docs/publishing/epNN/README.md at <git-ref>) gives the upload file,
the titles (the first is used), the YouTube description, the TikTok caption,
the cover text and the pinned comment. The videos are downloaded later from
GitHub at that ref's commit. Episodes already in a schedule are left alone.
Dates are set afterwards with `npm run plan`.
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
ref, first, last = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
sha = subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", ref], text=True).strip()
source = f"https://raw.githubusercontent.com/jonaslacandola0617/odd-atom/{sha}/"

SEASONS = {  # season number, playlist, audience (global = US-evening times)
    range(21, 31): (3, "Season 3: Real Cases Around the World", "global"),
    range(31, 41): (4, "Season 4: Kwentong Pinoy", "ph"),
    range(41, 51): (5, "Season 5: Mga Karanasan", "ph"),
}

def season_of(n):
    for r, v in SEASONS.items():
        if n in r: return v
    raise SystemExit(f"Episode {n}: no season set in SEASONS")

def section(text, heading_re):
    m = re.search(r"^## " + heading_re + r".*?$(.*?)(?=^## |\Z)", text, re.M | re.S | re.I)
    return m.group(1) if m else None

def code_block(text, heading_re):
    s = section(text, heading_re)
    m = re.search(r"```[^\n]*\n(.*?)\n```", s or "", re.S)
    return m.group(1).strip() if m else None

def kit(n):
    text = subprocess.check_output(["git", "-C", str(ROOT), "show", f"{ref}:docs/publishing/ep{n:02d}/README.md"], text=True)
    file = re.search(r"\*\*Upload this file:\*\* `([^`]+\.mp4)`", text).group(1)
    story = re.search(r'^# Episode \d+ publishing kit: "([^"]+)"', text, re.M).group(1)
    titles = re.findall(r"^\s*\d+\.\s+`([^`]+)`", section(text, r"Titles") or "", re.M)
    desc = code_block(text, r"YouTube.*description")
    caption = code_block(text, r"TikTok caption")
    cover = re.search(r"Cover text[^`]*`([^`]+)`", text)
    pinned = code_block(text, r"Pinned comment")
    missing = [k for k, v in dict(file=file, title=titles[:1], description=desc, caption=caption, pinned=pinned).items() if not v]
    if missing: raise SystemExit(f"Episode {n}: couldn't read {missing} from its kit")
    tags = [t.lstrip("#") for t in re.findall(r"#\w+", desc.splitlines()[-1]) if t.lower() != "#shorts"]
    return dict(file=file, story=story, title=titles[0], desc=desc, caption=caption,
                cover=cover.group(1) if cover else "", pinned=pinned, tags=tags)

main_p = ROOT / "publishing/scheduler/schedule.json"
fb_p = ROOT / "publishing/facebook-scheduler/schedule.json"
main, fb = json.loads(main_p.read_text("utf-8")), json.loads(fb_p.read_text("utf-8"))
have_main = {e["ep"] for e in main["episodes"]}
have_fb = {e["ep"] for e in fb["episodes"]}
added = []
for n in range(first, last + 1):
    k = kit(n)
    season, playlist, audience = season_of(n)
    if len(k["title"]) > 100: raise SystemExit(f"Episode {n}: title over 100 characters")
    if n not in have_main:
        main["episodes"].append({
            "ep": n, "season": season, "story": k["story"], "file": k["file"], "videoSource": source,
            "audience": audience, "watched": False,
            "youtube": {"publishAt": None, "title": k["title"], "description": k["desc"], "tags": k["tags"],
                        "playlist": playlist, "pinnedComment": k["pinned"]},
            "tiktok": {"publishAt": None, "caption": k["caption"], "aiGenerated": True,
                       "coverText": k["cover"], "pinnedComment": k["pinned"]},
        })
    if n not in have_fb:
        fb["episodes"].append({
            "ep": n, "season": season, "story": k["story"], "file": k["file"], "videoSource": source,
            "watched": False,
            "facebook": {"publishAt": None, "caption": k["title"] + "\n\n" + k["desc"].replace("#shorts", "#reels")},
        })
    added.append(n)
for d in (main, fb):
    d["episodes"].sort(key=lambda e: e["ep"])
main["defaults"].setdefault("globalYoutubeTime", "08:30")   # 7:30 p.m. US Eastern
main["defaults"].setdefault("globalTiktokTime", "09:30")    # 8:30 p.m. US Eastern
main_p.write_text(json.dumps(main, ensure_ascii=False, indent=2) + "\n", "utf-8")
fb_p.write_text(json.dumps(fb, ensure_ascii=False, indent=2) + "\n", "utf-8")
print(f"added Episodes {added[0]}–{added[-1]} from {ref} ({sha[:7]})")
