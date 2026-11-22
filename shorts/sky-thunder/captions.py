"""Ricks-style captions: one word at a time, white bold with a dark outline, at ~70% of the frame height.
Usage: python3 captions.py frames frames_cap work/words.json"""
import sys, os, json, glob
from PIL import Image, ImageDraw, ImageFont
src, dst, wj = sys.argv[1:4]; os.makedirs(dst, exist_ok=True)
words = json.load(open(wj)); FPS = 30
font = next(p for p in ("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if os.path.exists(p))
F = ImageFont.truetype(font, 64)
for fp in sorted(glob.glob(os.path.join(src, "f*.jpg"))):
    k = int(os.path.basename(fp)[1:5]); t = k / FPS
    im = Image.open(fp).convert("RGB")
    cur = next((w for w in words if w["s"] <= t < max(w["e"], w["s"] + 0.12)), None)
    if cur:
        txt = cur["w"].strip(",.?!\"")
        d = ImageDraw.Draw(im); tw = d.textlength(txt, font=F); x = (im.width - tw) / 2; y = im.height * 0.70
        d.text((x + 3, y + 5), txt, font=F, fill=(0, 0, 0), stroke_width=7, stroke_fill=(0, 0, 0))
        d.text((x, y), txt, font=F, fill=(255, 255, 255), stroke_width=6, stroke_fill=(20, 16, 24))
    im.save(os.path.join(dst, os.path.basename(fp)), quality=95)
print("captions ok")
