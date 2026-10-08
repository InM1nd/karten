from PIL import Image, ImageDraw, ImageFont, ImageFilter
import glob
S = 1024
FONT = glob.glob("/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont*.ttf")[0]

def font(size):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name("ExtraBold")
    except Exception:
        try: f.set_variation_by_name("Bold")
        except Exception: pass
    return f

def gradient(size, c1, c2):
    im = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(im)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)], fill=tuple(int(c1[i] + (c2[i]-c1[i]) * t) for i in range(3)) + (255,))
    return im

def card_layer(scale=1.0, mono=False):
    """Two stacked cards + K + Austrian stripe, drawn centred on a transparent SxS canvas."""
    L = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    w, h = int(520*scale), int(640*scale)
    cx, cy = S//2, S//2
    # back card (rotated)
    back = Image.new("RGBA", (S, S), (0,0,0,0))
    bd = ImageDraw.Draw(back)
    bd.rounded_rectangle([cx-w//2, cy-h//2, cx+w//2, cy+h//2], radius=int(64*scale),
                         fill=(255,255,255,140) if not mono else (255,255,255,120))
    back = back.rotate(12, resample=Image.BICUBIC, center=(cx, cy))
    back = back.transform(back.size, Image.AFFINE, (1,0,-int(40*scale),0,1,int(10*scale)), resample=Image.BICUBIC)
    L.alpha_composite(back)
    # shadow
    if not mono:
        sh = Image.new("RGBA", (S, S), (0,0,0,0))
        ImageDraw.Draw(sh).rounded_rectangle([cx-w//2+10, cy-h//2+24, cx+w//2+10, cy+h//2+24], radius=int(64*scale), fill=(10,10,60,110))
        L.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))
    front = Image.new("RGBA", (S, S), (0,0,0,0))
    fd = ImageDraw.Draw(front)
    fd.rounded_rectangle([cx-w//2, cy-h//2, cx+w//2, cy+h//2], radius=int(64*scale), fill=(255,255,255,255))
    if not mono:
        f = font(int(400*scale))
        fd.text((cx, cy - int(40*scale)), "K", font=f, fill=(31,40,110,255), anchor="mm")
        # Austrian flag stripe
        sw, sh_ = int(300*scale), int(30*scale)
        top = cy + int(190*scale)
        for i, col in enumerate([(200,16,46), (255,255,255), (200,16,46)]):
            fd.rectangle([cx-sw//2, top+i*sh_, cx+sw//2, top+(i+1)*sh_], fill=col+(255,))
        fd.rectangle([cx-sw//2, top, cx+sw//2, top+3*sh_], outline=(220,220,230,255), width=2)
    else:
        f = font(int(400*scale))
        fd.text((cx, cy - int(40*scale)), "K", font=f, fill=(0,0,0,0), anchor="mm")
    front = front.rotate(-4, resample=Image.BICUBIC, center=(cx, cy))
    L.alpha_composite(front)
    if mono:
        # punch out the K so the monochrome icon is readable
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).text((cx, cy - int(40*scale)), "K", font=font(int(400*scale)), fill=255, anchor="mm")
        mask = mask.rotate(-4, resample=Image.BICUBIC, center=(cx, cy))
        a = L.getchannel("A")
        a = Image.composite(Image.new("L", (S,S), 0), a, mask)
        L.putalpha(a)
    return L

C1, C2 = (61, 90, 254), (124, 77, 255)
bg = gradient(S, C1, C2)
# full icon (legacy / iOS / store)
icon = bg.copy(); icon.alpha_composite(card_layer(1.0))
icon.convert("RGB").save("assets/icon.png")
# adaptive icon: background + foreground in safe zone (~66%)
bg.convert("RGB").save("assets/android-icon-background.png")
card_layer(0.68).save("assets/android-icon-foreground.png")
mono = card_layer(0.68, mono=True)
r = Image.new("RGBA", (S,S), (255,255,255,0)); r.putalpha(mono.getchannel("A"))
r.save("assets/android-icon-monochrome.png")
# splash
card_layer(0.8).save("assets/splash-icon.png")
icon.resize((48,48), Image.LANCZOS).save("assets/favicon.png")
print("ok")
