"""Build publishing/facebook-scheduler/schedule.json from the main schedule.

Facebook Reels caption = the YouTube title, a blank line, then the YouTube
description with #shorts swapped for #reels. Dates are set by `npm run plan`.
"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
src = json.loads((ROOT / "scheduler/schedule.json").read_text(encoding="utf-8"))
eps = []
for e in src["episodes"]:
    y = e["youtube"]
    caption = y["title"] + "\n\n" + y["description"].replace("#shorts", "#reels")
    ep = {"ep": e["ep"], "season": e["season"], "story": e["story"], "file": e["file"], "watched": False,
          "facebook": {"publishAt": None, "caption": caption}}
    for k in ("notOn", "note"):
        if k in e: ep[k] = e[k]
    eps.append(ep)
out = {
    "about": "After Sign-Off Facebook Reels schedule. Times are Philippine time (+08:00). Edit freely; run `npm run check` after editing.",
    "videoSource": src["videoSource"],
    "defaults": {"facebookTime": "20:00", "utcOffset": "+08:00"},
    "episodes": eps,
}
(ROOT / "facebook-scheduler/schedule.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("wrote", len(eps), "episodes")
