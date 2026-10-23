"""Reproduce the artwork audit, using saved source rasters at native resolution.

Dependencies: Python 3, Pillow, NumPy. FFmpeg is needed only with --extract.
Diagnostic annotations/crops are study material, not production illustrations.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/production/artwork-audit"
REF = ROOT / "references/studies/topic-range-2026-10-23/images"
SOURCES = {
    "ref_street": REF / "loneliness-01.webp",
    "ref_people": REF / "loneliness-02.webp",
    "ref_future": REF / "the-last-human-01.png",
    "test_street": OUT / "frames/test-street.png",
    "test_cafe": OUT / "frames/test-cafe.png",
}
BG, WHITE, MUTED, ACCENT = "#171426", "#fff6ea", "#c4bed4", "#70ead0"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
IMAGES = {}
CROPS = []


def font(size=22):
    return ImageFont.truetype(FONT, size)


def label(canvas, xy, text, size=22, color=WHITE):
    ImageDraw.Draw(canvas).text(xy, text, fill=color, font=font(size))


def board(width, height, title, subtitle):
    canvas = Image.new("RGB", (width, height), BG)
    label(canvas, (28, 18), title, 30)
    label(canvas, (28, 62), subtitle, 19, MUTED)
    return canvas


def fit(image, width, height):
    result = image.copy()
    result.thumbnail((width, height), Image.Resampling.LANCZOS)
    return result


def crop(canvas, key, box, xy, scale, title, note=""):
    """Integer nearest-neighbor zoom: source pixels remain visible."""
    region = IMAGES[key].crop(box)
    region = region.resize((region.width * scale, region.height * scale), Image.Resampling.NEAREST)
    x, y = xy
    label(canvas, (x, y), title, 23)
    label(canvas, (x, y + 32), f"{key}  {tuple(box)}  |  {scale}x native pixels", 17, MUTED)
    canvas.paste(region, (x, y + 63))
    if note:
        label(canvas, (x, y + 73 + region.height), note, 18, ACCENT)
    CROPS.append({"board": CURRENT_BOARD, "source": key, "box_xyxy": box,
                  "integer_zoom": scale, "sampling": "nearest"})


def hsv_y(image):
    rgb = np.asarray(image, dtype=np.float64) / 255
    vmax, vmin = rgb.max(2), rgb.min(2)
    sat = np.divide(vmax-vmin, vmax, out=np.zeros_like(vmax), where=vmax > 0)
    linear = np.where(rgb <= .04045, rgb/12.92, ((rgb+.055)/1.055)**2.4)
    y = linear @ np.array([.2126, .7152, .0722])
    return rgb, sat, y


def stats(image):
    _, sat, y = hsv_y(image)
    return {
        "size": list(image.size), "pixels": image.width * image.height,
        "saturation_p10_median_p90": [round(float(v), 6) for v in np.quantile(sat, [.1, .5, .9])],
        "percent_saturation_ge_0_7": round(float((sat >= .7).mean()*100), 3),
        "linear_luminance_p10_median_p90": [round(float(v), 6) for v in np.quantile(y, [.1, .5, .9])],
        "percent_linear_luminance_lt_0_05": round(float((y < .05).mean()*100), 3),
        "percent_linear_luminance_gt_0_5": round(float((y > .5).mean()*100), 3),
    }


def swatch_probe(key, point):
    x, y = point
    patch = IMAGES[key].crop((x-3, y-3, x+4, y+4))
    rgb = np.median(np.asarray(patch).reshape(-1, 3), axis=0).astype(np.uint8)
    _, sat, lum = hsv_y(Image.new("RGB", (1, 1), tuple(rgb)))
    return {"source": key, "center_xy": [x,y], "patch_size": [7,7],
            "rgb_channel_medians": rgb.tolist(), "hex": "#"+"".join(f"{v:02X}" for v in rgb),
            "hsv_saturation": round(float(sat[0,0]), 6), "linear_luminance": round(float(lum[0,0]), 6)}


def build():
    global CURRENT_BOARD
    OUT.mkdir(parents=True, exist_ok=True)
    IMAGES.update({key: Image.open(path).convert("RGB") for key, path in SOURCES.items()})

    CURRENT_BOARD = "01-faces.png"
    a = board(1440, 1140, "01 / Face construction: human references versus our humans",
              "Boxes are native source coordinates, right/bottom exclusive. Zooms do not smooth source pixels.")
    crop(a, "ref_people", (995,205,1165,395), (28,110), 2,
         "REFERENCE / standing person", "Solid dark eyes; offset hair and face contour.")
    crop(a, "ref_people", (1465,35,1635,225), (748,110), 2,
         "REFERENCE / seated person", "Solid green eyes; large, simple color shapes.")
    crop(a, "test_cafe", (540,430,710,620), (28,620), 2,
         "TEST / Mira, 12.0 seconds", "White eyes, pupils, glints, cheek ovals, nose stroke.")
    crop(a, "test_cafe", (1180,430,1350,620), (748,620), 2,
         "TEST / Sol, 12.0 seconds", "Same jaw, eye construction, ears and neck; mirrored.")
    a.save(OUT / CURRENT_BOARD)

    CURRENT_BOARD = "02-contours.png"
    a = board(1600, 1350, "02 / Body contour, shoulder construction, and hands",
              "Compare the outline and overlaps. Different poses are intentional; this is not an aligned overlay.")
    crop(a, "ref_people", (925,205,1160,840), (28,110), 1,
         "REFERENCE / slouched outline", "Panel clips the rightmost contour.")
    crop(a, "test_street", (840,250,1110,970), (500,110), 1,
         "TEST / standing lead", "Tube limbs; repeated rounded joints.")
    crop(a, "ref_people", (985,350,1160,515), (970,110), 2,
         "REFERENCE / neck to shoulder", "Clothing defines the outside contour.")
    crop(a, "test_cafe", (530,590,715,755), (970,565), 2,
         "TEST / neck to shoulder", "Exposed neck block; protruding arm cap.")
    crop(a, "ref_people", (1050,555,1130,645), (28,945), 3,
         "REFERENCE / hanging hand", "Hand shape follows the hanging pose.")
    crop(a, "test_cafe", (705,695,805,785), (520,945), 3,
         "TEST / cup and hand", "Generic fist plus attached cup; weak grip.")
    crop(a, "test_street", (1015,620,1095,710), (1080,1010), 2,
         "TEST / resting hand", "The same fist is reused.")
    a.save(OUT / CURRENT_BOARD)

    CURRENT_BOARD = "03-composition.png"
    a = board(1900, 1320, "03 / Large shapes and environment design",
              "Whole frames fit without stretching. Reference artwork belongs to Kurzgesagt; test artwork is ours.")
    entries = [
        ("ref_street", "REFERENCE / Loneliness", (28,110), [((330,400,850,996), "large foreground crop")]),
        ("test_street", "TEST / 5.5 seconds", (975,110), [((565,90,930,298), "repeated bright windows"), ((870,250,1085,700), "same rig in crowd")]),
        ("ref_future", "REFERENCE / The Last Human", (28,720), [((1400,90,1958,1046), "large foreground mass")]),
        ("test_cafe", "TEST / 12.0 seconds", (975,720), [((490,150,1415,848), "window dominates"), ((530,430,1380,978), "similar size / frontal")]),
    ]
    for key, title, (x,y), boxes in entries:
        im = fit(IMAGES[key], 890, 500)
        label(a, (x,y), title, 23)
        top = y + 40
        a.paste(im, (x,top))
        d = ImageDraw.Draw(a)
        sx, sy = im.width/IMAGES[key].width, im.height/IMAGES[key].height
        for box, caption in boxes:
            rect = (x+box[0]*sx, top+box[1]*sy, x+box[2]*sx, top+box[3]*sy)
            d.rectangle(rect, outline=ACCENT, width=2)
            tx, ty = rect[0]+5, rect[1]+5
            extent = d.textbbox((tx,ty), caption, font=font(16))
            d.rectangle((extent[0]-3, extent[1]-3, extent[2]+3, extent[3]+3), fill=BG)
            label(a, (tx,ty), caption, 16, ACCENT)
        label(a, (x,top+im.height+8), f"{key}: {IMAGES[key].width} x {IMAGES[key].height} native", 17, MUTED)
    a.save(OUT / CURRENT_BOARD)

    CURRENT_BOARD = "04-pixel-maps.png"
    a = board(1800, 1645, "04 / Every pixel: saturation, luminance, and broad value masses",
              "Computed at native size; display-only resizing. These are pixel properties, not quality or style scores.")
    for x, title in [(28,"HSV saturation: black=0, white=1"), (620,"Linear luminance: black=0, white=1"), (1210,"Grayscale after 24 px native blur")]:
        label(a, (x,110), title, 19)
    for row, key in enumerate(["ref_street", "test_street", "ref_future", "test_cafe"]):
        im = IMAGES[key]
        _, sat, lum = hsv_y(im)
        maps = [Image.fromarray(np.uint8(np.rint(sat*255))).convert("RGB"),
                Image.fromarray(np.uint8(np.rint(lum*255))).convert("RGB")]
        # Perceptual grayscale is used only for the blurred visual thumbnail.
        maps.append(im.convert("L").filter(ImageFilter.GaussianBlur(24)).convert("RGB"))
        y = 160 + row*365
        for col, mapped in enumerate(maps):
            x = [28,620,1210][col]
            label(a, (x,y), key, 21)
            a.paste(fit(mapped, 550, 306), (x,y+36))
    a.save(OUT / CURRENT_BOARD)

    probes = {name: swatch_probe(key, point) for name,key,point in [
        ("reference_street_wall", "ref_street", (370,130)),
        ("test_street_wall", "test_street", (370,130)),
        ("test_mira_coat", "test_cafe", (610,750)),
        ("test_window_near_mira", "test_cafe", (720,610)),
        ("test_mira_face", "test_cafe", (636,572)),
        ("test_window_near_face", "test_cafe", (720,572)),
        ("reference_adult_hair", "ref_future", (1800,600)),
        ("reference_sky", "ref_future", (1300,150)),
    ]}
    CURRENT_BOARD = "05-native-patches.png"
    a = board(1500, 1180, "05 / Native pixel patches and measured palette samples",
              "Unmatched regions: the board explains specific choices, not a numerical similarity percentage.")
    crop(a, "ref_street", (30,15,450,320), (28,110), 1,
         "REFERENCE / quiet city wall", "Broad saturated masses; little window linework.")
    crop(a, "test_street", (30,15,450,320), (780,110), 1,
         "TEST / city wall", "More muted wall colors; visible structural lines.")
    for i, (name,p) in enumerate(probes.items()):
        col, row = i%2, i//2
        x, y = 28+col*750, 550+row*145
        ImageDraw.Draw(a).rectangle((x,y,x+70,y+70), fill=p["hex"])
        label(a, (x+85,y), name.replace("_", " "), 20)
        label(a, (x+85,y+30), f"7x7 median at {tuple(p['center_xy'])}: {p['hex']}", 17, MUTED)
        label(a, (x+85,y+57), f"S={p['hsv_saturation']:.3f}  linear Y={p['linear_luminance']:.3f}", 18, ACCENT)
    a.save(OUT / CURRENT_BOARD)

    sources = json.loads((ROOT/"references/studies/topic-range-2026-10-23/sources.json").read_text())
    metrics = {
        "scope": "Artwork-only raster and authored-geometry audit, not episode playback or style-match scoring.",
        "tested_film_commit": "fb540ed5f5e714612484b9476d64f814bbd1dd91",
        "tested_film": {
            "path": "assets/videos/alone-in-a-crowd-20s.mp4",
            "sha256": hashlib.sha256((ROOT/"assets/videos/alone-in-a-crowd-20s.mp4").read_bytes()).hexdigest(),
            "frame_extraction": "FFmpeg -ss TIME -i INPUT -frames:v 1 OUTPUT; times 5.5 and 12.0 seconds (frames 165 and 360 at 30 fps).",
        },
        "coordinates": "Native pixels, origin top left. Crops use right/bottom exclusive boxes.",
        "methods": {
            "saturation": "HSV S=(max(sRGB)-min(sRGB))/max(sRGB), zero if max=0; encoded RGB/255.",
            "luminance": "sRGB inverse transfer, then linear Y=0.2126 R+0.7152 G+0.0722 B.",
            "patches": "Per-channel median over 7x7 pixels, then S and Y of that RGB median.",
            "limits": "Different scenes, crops, compression and dimensions; no registration, RMSE, SSIM or quality percentage. Full-frame test statistics include captions; top-900-pixel statistics exclude the caption area.",
        },
        "inputs": {}, "crops": CROPS, "probes": probes,
        "geometry": {
            "authored_face_x_extent": [-34,35], "face_width": 69,
            "eye_white_width": 17, "each_eye_white_percent_face_width": round(17/69*100,3),
            "upper_lower_arm_stroke_widths": [28,27], "leg_stroke_width": 32,
            "same_face_path_for_both_leads": True,
            "interpretation": "Source geometry, not a perceptual match score. Stroke widths are constant along each path; shoulder round caps become part of the silhouette.",
        },
    }
    for key,path in SOURCES.items():
        entry = {"path": str(path.relative_to(ROOT)), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                 "all_pixels": stats(IMAGES[key])}
        if key.startswith("test_"):
            entry["top_900_pixels"] = stats(IMAGES[key].crop((0,0,1920,900)))
        else:
            for case in sources["cases"]:
                for item in case["images"]:
                    if Path(item["file"]).name == path.name:
                        entry.update({"source_page": case["sourcePage"], "original_asset_url": item["originalAssetUrl"],
                                      "authorship": "Official Kurzgesagt artwork, downloaded previously; not ours."})
        metrics["inputs"][key] = entry
    metrics["background_regions"] = {
        key: {"box_xyxy": [30,15,450,320], **stats(IMAGES[key].crop((30,15,450,320)))}
        for key in ["ref_street", "test_street"]
    }
    (OUT / "measurements.json").write_text(json.dumps(metrics, indent=2)+"\n")
    print(json.dumps({"probes": probes, "background_regions": metrics["background_regions"],
                      "whole_image": {k: v["all_pixels"] for k,v in metrics["inputs"].items()}}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extract", action="store_true", help="Re-extract exact delivered frames with FFmpeg")
    args = parser.parse_args()
    if args.extract:
        (OUT/"frames").mkdir(parents=True, exist_ok=True)
        for t,name in [("5.5","test-street"),("12.0","test-cafe")]:
            subprocess.run(["ffmpeg","-v","error","-y","-ss",t,"-i",
                            str(ROOT/"assets/videos/alone-in-a-crowd-20s.mp4"),
                            "-frames:v","1",str(OUT/f"frames/{name}.png")], check=True)
    build()
