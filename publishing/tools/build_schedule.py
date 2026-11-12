"""Build publishing/scheduler/schedule.json from the posting kits.

Reads docs/publishing/POSTS-ep01-08.md (Episodes 1-10) and POSTS-ep11-20.md
(Episodes 11-20). Dates are assigned later by `npm run plan`.
Usage: python3 publishing/tools/build_schedule.py <video-commit-sha>
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "publishing/scheduler/schedule.json"
SHA = sys.argv[1]

def block(text, label):
    m = re.search(r"\*\*" + re.escape(label) + r"\*\*\n```\n(.*?)\n```", text, re.S)
    return m.group(1).strip() if m else None

def inline(text, pattern):
    m = re.search(pattern, text)
    return m.group(1).strip() if m else None

episodes = []
for doc in ["POSTS-ep01-08.md", "POSTS-ep11-20.md"]:
    text = (ROOT / "docs/publishing" / doc).read_text(encoding="utf-8")
    files = {int(n): f for n, f in re.findall(r"^\| (\d+) \|[^\n]*?`(assets/videos/[^`]+\.mp4)`", text, re.M)}
    for sec in re.split(r"^## Broadcast ", text, flags=re.M)[1:]:
        head = sec.splitlines()[0]
        n = int(head.split(":")[0])
        story = re.sub(r"\s*\([^)]*\)\s*$", "", head.split(":", 1)[1]).strip()
        desc = block(sec, "YouTube description")
        tags = [t.lstrip("#") for t in re.findall(r"#\w+", desc.splitlines()[-1]) if t.lower() != "#shorts"]
        tt = sec.split("**TikTok caption**", 1)[1]
        ep = {
            "ep": n,
            "season": 1 if n <= 10 else 2,
            "story": story,
            "file": files[n],
            "watched": False,
            "youtube": {
                "publishAt": None,
                "title": inline(sec, r"\*\*YouTube title:\*\* `([^`]+)`"),
                "description": desc,
                "tags": tags,
                "playlist": "Season 1: After Sign-Off" if n <= 10 else "Season 2: Kwentong Kababalaghan",
                "pinnedComment": inline(sec, r"\*\*YouTube pinned comment:\*\* `([^`]+)`"),
            },
            "tiktok": {
                "publishAt": None,
                "caption": block(sec, "TikTok caption"),
                "aiGenerated": True,
                "coverText": inline(tt, r"\*\*Cover text:\*\* `([^`]+)`"),
                "pinnedComment": inline(tt, r"\*\*Pinned comment:\*\* `([^`]+)`"),
            },
        }
        if n == 20:
            ep["notOn"] = ["11-17"]
            ep["note"] = "Real accident on 17 November 1981: never post on 17 November unless as a remembrance."
        for k, v in list(ep["youtube"].items()) + list(ep["tiktok"].items()):
            if v is None and k != "publishAt":
                sys.exit(f"Episode {n}: missing {k}")
        episodes.append(ep)

episodes.sort(key=lambda e: e["ep"])
assert [e["ep"] for e in episodes] == list(range(1, 21)), [e["ep"] for e in episodes]
data = {
    "about": "After Sign-Off posting schedule. Times are Philippine time (+08:00). Edit freely; run `npm run check` after editing.",
    "videoSource": f"https://raw.githubusercontent.com/jonaslacandola0617/odd-atom/{SHA}/",
    "defaults": {"youtubeTime": "20:30", "tiktokTime": "21:30", "utcOffset": "+08:00"},
    "episodes": episodes,
}
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"wrote {OUT} with {len(episodes)} episodes")
