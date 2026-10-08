"""Karten v1.2 minimal brand assets: app icon, adaptive icon layers, monochrome, splash (light+dark),
notification icon, favicon and widget picker preview. Inter Tight SemiBold, black/white + one orange dot."""
from PIL import Image, ImageDraw, ImageFont

S = 1024
SEMI = "assets/fonts/InterTight-SemiBold.ttf"
MED = "assets/fonts/InterTight-Medium.ttf"
REG = "assets/fonts/InterTight-Regular.ttf"
INK, WHITE, ORANGE, ORANGE_D = (17, 17, 17, 255), (255, 255, 255, 255), (255, 107, 0, 255), (255, 122, 26, 255)

def mark(scale, fg, dot, canvas=S, ss=2):
    """'K' + orange full stop, optically centred on a transparent canvas."""
    W = canvas * ss
    scale = scale * canvas / S
    im = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(SEMI, int(560 * scale * ss))
    l, t, r, b = d.textbbox((0, 0), "K", font=f)
    kw, kh = r - l, b - t
    dot_r = int(52 * scale * ss)
    gap = int(34 * scale * ss)
    total = kw + gap + 2 * dot_r
    x0 = (W - total) // 2 - l
    y0 = (W - kh) // 2 - t
    d.text((x0, y0), "K", font=f, fill=fg)
    cx = (W - total) // 2 + kw + gap + dot_r
    cy = (W - kh) // 2 + kh - dot_r
    d.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=dot)
    return im.resize((canvas, canvas), Image.LANCZOS)

def flat(color, size=S):
    return Image.new("RGBA", (size, size), color)

# legacy/full icon: white squircle-free square (launchers mask it)
icon = flat(WHITE); icon.alpha_composite(mark(1.0, INK, ORANGE))
icon.convert("RGB").save("assets/icon.png")
icon.resize((48, 48), Image.LANCZOS).convert("RGB").save("assets/favicon.png")
# adaptive: plain white background + mark within the 66% safe zone
flat(WHITE).convert("RGB").save("assets/android-icon-background.png")
mark(0.62, INK, ORANGE).save("assets/android-icon-foreground.png")
mono = mark(0.62, WHITE, WHITE)
mono.save("assets/android-icon-monochrome.png")
# splash marks (expo-splash-screen draws them on the background colour)
mark(0.8, INK, ORANGE).save("assets/splash-icon.png")
mark(0.8, (245, 245, 245, 255), ORANGE_D).save("assets/splash-icon-dark.png")
# notification small icon: white silhouette 96x96
mark(1.2, WHITE, WHITE, canvas=96, ss=8).save("assets/notification-icon.png")

# widget preview (matches src/widget/WordOfDayWidget.tsx, light)
w, h, ss = 1000, 460, 2
P = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
d = ImageDraw.Draw(P)
d.rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], radius=52 * ss, fill=WHITE, outline=(236, 236, 236, 255), width=2 * ss)
def F(p, s): return ImageFont.truetype(p, s * ss)
d.text((40 * ss, 40 * ss), "СЛОВО ДНЯ · AT", font=F(MED, 24), fill=(142, 142, 147, 255))
right = "12 к повторению"
rf = F(MED, 27)
tw = d.textlength(right, font=rf)
d.text((w * ss - 40 * ss - tw, 38 * ss), right, font=rf, fill=INK)
d.ellipse([w * ss - 40 * ss - tw - 26 * ss, 48 * ss, w * ss - 40 * ss - tw - 12 * ss, 62 * ss], fill=ORANGE)
d.ellipse([40 * ss, 236 * ss, 56 * ss, 252 * ss], fill=(224, 62, 111, 255))
d.text((70 * ss, 228 * ss), "die", font=F(SEMI, 34), fill=(224, 62, 111, 255))
d.text((36 * ss, 270 * ss), "Jause", font=F(SEMI, 72), fill=INK)
d.text((40 * ss, 370 * ss), "перекус, полдник", font=F(REG, 34), fill=(142, 142, 147, 255))
P.resize((w, h), Image.LANCZOS).save("assets/widget-preview.png")
print("ok")
