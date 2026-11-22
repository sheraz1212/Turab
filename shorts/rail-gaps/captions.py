"""Ricks-style captions: one word at a time, white bold with a dark outline, at ~70% of the frame height.
Usage: python3 captions.py frames frames_cap work/words.json"""
import sys, os, json, glob
from PIL import Image, ImageDraw, ImageFont
src, dst, wj = sys.argv[1:4]; os.makedirs(dst, exist_ok=True)
words = json.load(open(wj)); FPS = 30
font = next(p for p in ("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if os.path.exists(p))
F = ImageFont.truetype(font, 66)
FT = ImageFont.truetype(font, 120)
TAGS = [(0.15, 1.6, "39 FT"), (5.5, 6.75, "1800s"), (26.5, 28.05, "SUMMER"), (34.3, 36.85, "TINY"), (36.9, 39.55, "1 MILE"), (39.6, 41.85, "2 FEET"), (56.9, 59.75, "TODAY")]
for fp in sorted(glob.glob(os.path.join(src, "f*.jpg"))):
    k = int(os.path.basename(fp)[1:5]); t = k / FPS
    im = Image.open(fp).convert("RGB")
    if im.width != 1080: im = im.resize((1080, 1920), Image.LANCZOS)
    cur = next((w for w in words if w["s"] <= t < max(w["e"], w["s"] + 0.12)), None)
    if cur:
        txt = cur["w"].strip(",.?!\"")
        d = ImageDraw.Draw(im); tw = d.textlength(txt, font=F); x = (im.width - tw) / 2; y = im.height * 0.70
        d.text((x + 3, y + 5), txt, font=F, fill=(0, 0, 0), stroke_width=7, stroke_fill=(0, 0, 0))
        d.text((x, y), txt, font=F, fill=(255, 255, 255), stroke_width=6, stroke_fill=(20, 16, 24))
    tag = next((g for a, b, g in TAGS if a <= t < b), None)
    if tag:
        d = ImageDraw.Draw(im); tw = d.textlength(tag, font=FT); x = (im.width - tw) / 2; y = im.height * 0.11
        d.text((x + 4, y + 7), tag, font=FT, fill=(0, 0, 0), stroke_width=10, stroke_fill=(0, 0, 0))
        d.text((x, y), tag, font=FT, fill=(255, 214, 40), stroke_width=9, stroke_fill=(24, 16, 20))
    im.save(os.path.join(dst, os.path.basename(fp)), quality=95)
print("captions ok")
