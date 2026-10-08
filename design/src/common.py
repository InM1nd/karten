"""Shared pieces for the Karten design mockups (HTML/CSS -> PNG via headless Chrome)."""

FONTS = """
@font-face{font-family:'Playfair Display';src:url('../fonts/PlayfairDisplay-VariableFont_wght.ttf');font-weight:400 900;font-style:normal}
@font-face{font-family:'Playfair Display';src:url('../fonts/PlayfairDisplay-Italic-VariableFont_wght.ttf');font-weight:400 900;font-style:italic}
@font-face{font-family:'Unbounded';src:url('../fonts/Unbounded-VariableFont_wght.ttf');font-weight:200 900}
@font-face{font-family:'Manrope';src:url('../fonts/Manrope-VariableFont_wght.ttf');font-weight:200 800}
@font-face{font-family:'Nunito';src:url('../fonts/Nunito-VariableFont_wght.ttf');font-weight:200 1000}
@font-face{font-family:'Inter Tight';src:url('../fonts/InterTight-VariableFont_wght.ttf');font-weight:100 900}
"""

BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1120px;height:1240px;overflow:hidden}
body{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.page{width:1120px;height:1240px;padding:52px 60px 0;position:relative;overflow:hidden}
.page-head{display:flex;align-items:flex-end;justify-content:space-between;height:118px}
.page-head .kicker{font:600 13px/1 'Manrope';letter-spacing:.22em;text-transform:uppercase;opacity:.6;margin-bottom:12px}
.page-head h2{font-size:40px;line-height:1.05}
.page-head p{font:500 15px/1.5 'Manrope';max-width:380px;text-align:right;opacity:.75}
.phones{display:flex;gap:64px;justify-content:center;margin-top:34px}
.phone{width:436px;height:939px;border-radius:56px;padding:12px;position:relative;flex:none}
.screen{width:412px;height:915px;border-radius:44px;overflow:hidden;position:relative}
.cam{position:absolute;top:13px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#0b0b0d;z-index:50}
.status{height:38px;display:flex;align-items:center;justify-content:space-between;padding:4px 26px 0 30px;font:600 14px/1 'Manrope';position:relative;z-index:5}
.status .sic{display:flex;gap:6px;align-items:center}
.gesture{position:absolute;bottom:9px;left:50%;width:120px;height:4px;margin-left:-60px;border-radius:4px;z-index:50}
svg{display:block}
.label-under{position:absolute;bottom:-34px;left:0;right:0;text-align:center;font:600 13px/1 'Manrope';letter-spacing:.14em;text-transform:uppercase;opacity:.55}
"""

# --- icons (24x24, stroke based; lucide-style paths, ISC) ---
ICONS = {
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    "pen": '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    "star": '<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>',
    "book": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    "trophy": '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    "volume": '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "sliders": '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "arrow": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "tram": '<rect x="5" y="6" width="14" height="12" rx="3"/><path d="M5 12h14"/><path d="M9 6 8 3h8l-1 3"/><path d="M8 21l1.5-3M16 21l-1.5-3"/><circle cx="9" cy="15" r=".6" fill="currentColor"/><circle cx="15" cy="15" r=".6" fill="currentColor"/>',
    "coffee": '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    "rotate": '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    "repeat": '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    "sparkle": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
}

def icon(name, size=22, color="currentColor", sw=2, extra=""):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}>{ICONS[name]}</svg>')

def status_bar(color):
    return f'''<div class="status" style="color:{color}"><span>19:55</span><span class="sic">
<svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="{color}"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="{color}"/><rect x="9" y="3" width="3" height="9" rx="1" fill="{color}"/><rect x="13.5" y="0" width="3" height="12" rx="1" fill="{color}"/></svg>
<svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5 .6 4.1a10.5 10.5 0 0 1 14.8 0Z" fill="{color}"/></svg>
<svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3" fill="none" stroke="{color}" opacity=".5"/><rect x="2" y="2" width="15" height="8" rx="1.6" fill="{color}"/><rect x="22.5" y="4" width="2" height="4" rx="1" fill="{color}" opacity=".5"/></svg>
</span></div>'''

def at_flag(w=22, h=15, r=3):
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 30 20"><clipPath id="fc{w}"><rect width="30" height="20" rx="{r*2}"/></clipPath>'
            f'<g clip-path="url(#fc{w})"><rect width="30" height="20" fill="#C8102E"/><rect y="6.67" width="30" height="6.67" fill="#fff"/></g></svg>')

# real app content
TILES = [
    ("target", "Артикли", "der · die · das", "рекорд 34"),
    ("bolt", "Скорость", "60 секунд", "рекорд 420"),
    ("pen", "Письмо", "пиши слова", "10 за раунд"),
    ("star", "Мои слова", "свой словарь", "12 слов"),
    ("book", "Словарь", "390 слов", "15 тем"),
    ("trophy", "Достижения", "7 из 15", "7/15"),
]
DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]  # Thu 8 Oct 2026 = today
DONE = [True, True, True, False, False, False, False]
TODAY = 3

def page(css, body, title):
    return f"<!doctype html><html lang='ru'><head><meta charset='utf-8'><title>{title}</title><style>{FONTS}{BASE_CSS}{css}</style></head><body>{body}</body></html>"
