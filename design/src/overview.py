from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
names = ["style-1-vienna", "style-2-playful", "style-3-neon", "style-4-minimal"]
TW, TH, GAP, PAD, HEAD = 1120, 1240, 48, 90, 250
W, H = PAD * 2 + TW * 2 + GAP, HEAD + TH * 2 + GAP + PAD
bg = Image.new("RGB", (W, H), "#EDEDE9")
d = ImageDraw.Draw(bg)
def f(size, wght):
    ft = ImageFont.truetype("fonts/InterTight-VariableFont_wght.ttf", size)
    ft.set_variation_by_axes([wght]); return ft
d.text((PAD, 92), "Karten — 4 варианта дизайна", font=f(76, 650), fill="#111")
d.text((PAD, 186), "Главная + оборот карточки · Pixel 412×915 · 1 Венский · 2 Игровой · 3 Неоновый тёмный · 4 Минимализм", font=f(30, 450), fill="#77777C")
for i, n in enumerate(names):
    im = Image.open(n + ".png").convert("RGB").resize((TW, TH), Image.LANCZOS)
    x = PAD + (i % 2) * (TW + GAP); y = HEAD + (i // 2) * (TH + GAP)
    sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle([x, y + 18, x + TW, y + TH + 18], 36, fill=90)
    sh = sh.filter(ImageFilter.GaussianBlur(26)); bg.paste(Image.new("RGB", (W, H), "#9a9a94"), (0, 0), sh)
    m = Image.new("L", (TW, TH), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, TW - 1, TH - 1], 36, fill=255)
    bg.paste(im, (x, y), m)
bg.save("overview.png", optimize=True)
print(bg.size)
