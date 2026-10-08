"""Notification small icon (white silhouette) and widget picker preview."""
import glob
from PIL import Image, ImageDraw, ImageFont

FONT = glob.glob("/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont*.ttf")[0]
def font(size, wght=700):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([wght] if len(f.get_variation_axes()) == 1 else [14, wght][-len(f.get_variation_axes()):])
    except Exception:
        pass
    return f

# 96x96 white-on-transparent: rounded card outline with "K"
S = 4; W = 96 * S
im = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle([14 * S, 8 * S, 82 * S, 88 * S], radius=12 * S, outline=(255, 255, 255, 255), width=7 * S)
f = font(54 * S, 800)
d.text((48 * S, 50 * S), "K", font=f, fill=(255, 255, 255, 255), anchor="mm")
im.resize((96, 96), Image.LANCZOS).save("assets/notification-icon.png")

# widget preview 4x2 (~ 500x250)
w, h = 1000, 460
grad = Image.new("RGBA", (w, h))
gd = ImageDraw.Draw(grad)
for i in range(w + h):
    t = i / (w + h)
    c = tuple(int(a + (b - a) * t) for a, b in zip((0x3D, 0x5A, 0xFE), (0x7C, 0x4D, 0xFF))) + (255,)
    gd.line([(i, 0), (i - h, h)], fill=c, width=2)
mask = Image.new("L", (w, h), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=48, fill=255)
prev = Image.new("RGBA", (w, h), (0, 0, 0, 0)); prev.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(prev)
small = font(30, 500)
d.text((36, 36), "Слово дня · AT", font=small, fill="#DDE3FF")
d.text((w - 36, 36), "12 к повторению", font=small, fill="#DDE3FF", anchor="ra")
big = font(64, 800)
d.text((36, 250), "die ", font=big, fill="#FFA3C4", anchor="ls")
x = 36 + d.textlength("die ", font=big)
d.text((x, 250), "Jause", font=big, fill="#FFFFFF", anchor="ls")
d.text((36, 330), "перекус, полдник", font=font(38, 500), fill="#FFFFFF", anchor="ls")
prev.save("assets/widget-preview.png")
print("ok")
