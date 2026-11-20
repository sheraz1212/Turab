"""Original 2D cartoon character ("Benny") drawn procedurally -> transparent PNG sprites.
Usage: python make_character.py <out_dir>
Style: round head, thick dark outline, big readable expressions, stick limbs, era outfits via params."""
import sys, os, math
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)
S = 4                      # supersampling
W, H = 600, 1300           # final sprite size
INK = (28, 24, 30, 255)
LW = 9 * S                 # outline width

def draw_char(name, shirt=(46, 140, 150), pants=(52, 58, 80), skin=(250, 246, 238), hat="beanie", hat_col=(232, 112, 40),
              expr="neutral", face_tint=None, arms="down"):
    im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cx = W * S // 2
    head_r = 205 * S; head_cy = 300 * S
    body_top = head_cy + head_r - 25 * S; body_bot = body_top + 330 * S
    # legs (stick + shoes)
    for sx in (-55, 55):
        x = cx + sx * S
        d.line([(x, body_bot - 20 * S), (x + sx * 0.2 * S, H * S - 120 * S)], fill=INK, width=16 * S)
        d.rounded_rectangle([x + sx * 0.2 * S - 50 * S, H * S - 135 * S, x + sx * 0.2 * S + 50 * S, H * S - 85 * S], 22 * S, fill=INK)
    # pants + shirt (rounded torso)
    d.rounded_rectangle([cx - 120 * S, body_bot - 120 * S, cx + 120 * S, body_bot + 10 * S], 30 * S, fill=pants + (255,), outline=INK, width=LW)
    d.rounded_rectangle([cx - 130 * S, body_top, cx + 130 * S, body_bot - 90 * S], 60 * S, fill=shirt + (255,), outline=INK, width=LW)
    # arms
    for side in (-1, 1):
        sx = cx + side * 125 * S; sy = body_top + 70 * S
        if arms == "down" or (arms == "point" and side == -1):
            ex, ey = sx + side * 70 * S, sy + 230 * S
        elif arms == "point":
            ex, ey = sx + side * 150 * S, sy - 30 * S
        else:  # "up" (panic)
            ex, ey = sx + side * 150 * S, sy - 230 * S
        d.line([(sx, sy), (ex, ey)], fill=INK, width=16 * S)
        d.ellipse([ex - 26 * S, ey - 26 * S, ex + 26 * S, ey + 26 * S], fill=skin + (255,), outline=INK, width=7 * S)
    # head
    face = face_tint or skin
    d.ellipse([cx - head_r, head_cy - head_r * 0.98, cx + head_r, head_cy + head_r], fill=face + (255,), outline=INK, width=LW)
    # expression
    ey = head_cy - 10 * S
    for side in (-1, 1):
        ex = cx + side * 70 * S
        if expr == "shock":
            d.ellipse([ex - 32 * S, ey - 40 * S, ex + 32 * S, ey + 40 * S], fill=(255, 255, 255, 255), outline=INK, width=6 * S)
            d.ellipse([ex - 12 * S, ey - 12 * S, ex + 12 * S, ey + 12 * S], fill=INK)
        elif expr == "angry":
            d.ellipse([ex - 16 * S, ey - 10 * S, ex + 16 * S, ey + 22 * S], fill=INK)
            d.line([(ex - side * 45 * S, ey - 55 * S), (ex + side * 35 * S, ey - 25 * S)], fill=INK, width=12 * S)
        else:
            d.ellipse([ex - 17 * S, ey - 22 * S, ex + 17 * S, ey + 22 * S], fill=INK)
            d.ellipse([ex - 6 * S, ey - 15 * S, ex + 4 * S, ey - 5 * S], fill=(255, 255, 255, 255))
            lift = 8 if expr == "smug" and side == 1 else 0
            d.arc([ex - 30 * S, ey - (70 + lift) * S, ex + 30 * S, ey - (30 + lift) * S], 200, 340, fill=INK, width=9 * S)
    my = head_cy + 95 * S
    if expr == "shock":
        d.ellipse([cx - 32 * S, my - 30 * S, cx + 32 * S, my + 50 * S], fill=(120, 30, 40, 255), outline=INK, width=8 * S)
    elif expr == "angry":
        d.arc([cx - 60 * S, my + 0 * S, cx + 60 * S, my + 70 * S], 200, 340, fill=INK, width=10 * S)
    elif expr == "smug":
        d.arc([cx - 70 * S, my - 50 * S, cx + 50 * S, my + 30 * S], 20, 120, fill=INK, width=10 * S)
    elif expr == "happy":
        d.chord([cx - 70 * S, my - 50 * S, cx + 70 * S, my + 50 * S], 0, 180, fill=(120, 30, 40, 255), outline=INK, width=8 * S)
    else:
        d.arc([cx - 45 * S, my - 40 * S, cx + 45 * S, my + 20 * S], 30, 150, fill=INK, width=9 * S)
    # nose dot + cheeks (makes the design our own)
    d.ellipse([cx - 9 * S, head_cy + 40 * S, cx + 9 * S, head_cy + 58 * S], fill=(200, 160, 150, 255))
    # hat
    if hat == "beanie":
        top = head_cy - head_r * 0.98
        d.chord([cx - head_r * 0.98, top - 30 * S, cx + head_r * 0.98, top + head_r * 1.1], 180, 360, fill=hat_col + (255,), outline=INK, width=LW)
        d.rounded_rectangle([cx - head_r * 1.0, top + head_r * 0.42, cx + head_r * 1.0, top + head_r * 0.62], 30 * S, fill=tuple(int(c * 0.8) for c in hat_col) + (255,), outline=INK, width=LW)
        d.ellipse([cx - 40 * S, top - 75 * S, cx + 40 * S, top + 5 * S], fill=hat_col + (255,), outline=INK, width=LW)
    elif hat == "sheriff":
        top = head_cy - head_r * 0.98
        d.ellipse([cx - head_r * 1.55, top + head_r * 0.3, cx + head_r * 1.55, top + head_r * 0.62], fill=(150, 100, 55, 255), outline=INK, width=LW)
        d.rounded_rectangle([cx - head_r * 0.75, top - 70 * S, cx + head_r * 0.75, top + head_r * 0.48], 50 * S, fill=(165, 112, 62, 255), outline=INK, width=LW)
    im = im.resize((W, H), Image.LANCZOS)
    im.save(os.path.join(OUT, f"{name}.png"))

draw_char("benny_neutral")
draw_char("benny_shock", expr="shock", arms="up")
draw_char("benny_smug", expr="smug", arms="point")
draw_char("benny_happy", expr="happy")
draw_char("sheriff_angry", shirt=(196, 160, 90), pants=(70, 60, 50), hat="sheriff", expr="angry", face_tint=(214, 120, 200))
print("characters ok")
