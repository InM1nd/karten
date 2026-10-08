from common import *

GREEN, GREEN_D = "#58CC02", "#46A302"
BLUE, BLUE_D = "#1CB0F6", "#1899D6"
RED, RED_D = "#FF4B4B", "#E03A3A"
ORANGE, ORANGE_D = "#FF9600", "#E08600"
PURPLE, PURPLE_D = "#CE82FF", "#A968D9"
YELLOW, YELLOW_D = "#FFC800", "#E0AE00"
PINK, PINK_D = "#FF5FA2", "#E0438A"
INK = "#3C3C3C"; GREY = "#AFAFAF"; LINE = "#E5E5E5"
DER, DIE, DAS = BLUE, PINK, GREEN

def bimmi(w=120, mood="happy"):
    """Friendly Vienna tram mascot ("Bimmi"). Simple shapes -> easy to port to react-native-svg."""
    mouth = ('<path d="M50 70q10 9 20 0" stroke="#3C3C3C" stroke-width="3.5" fill="#fff" stroke-linecap="round" stroke-linejoin="round"/>'
             if mood == "happy" else '<path d="M52 70q8 6 16 0" stroke="#3C3C3C" stroke-width="3.5" fill="none" stroke-linecap="round"/>')
    return f'''<svg width="{w}" height="{w*112/120:.0f}" viewBox="0 0 120 112" fill="none">
<path d="M44 20 60 6 76 20" stroke="#4B4B4B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M48 6h24" stroke="#4B4B4B" stroke-width="3" stroke-linecap="round"/>
<rect x="16" y="20" width="88" height="76" rx="22" fill="{RED_D}"/>
<rect x="16" y="20" width="88" height="70" rx="22" fill="{RED}"/>
<rect x="44" y="24" width="32" height="12" rx="5" fill="#fff"/><text x="60" y="34" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="10" fill="{RED}">D</text>
<rect x="24" y="40" width="72" height="40" rx="14" fill="#fff"/>
<circle cx="45" cy="56" r="9" fill="#3C3C3C"/><circle cx="75" cy="56" r="9" fill="#3C3C3C"/>
<circle cx="48" cy="53" r="3.2" fill="#fff"/><circle cx="78" cy="53" r="3.2" fill="#fff"/>
<ellipse cx="33" cy="68" rx="5" ry="3.2" fill="#FFB3B3"/><ellipse cx="87" cy="68" rx="5" ry="3.2" fill="#FFB3B3"/>
{mouth}
<rect x="16" y="82" width="88" height="6" fill="#fff" opacity=".9"/>
<circle cx="36" cy="100" r="9" fill="#4B4B4B"/><circle cx="84" cy="100" r="9" fill="#4B4B4B"/>
<circle cx="36" cy="100" r="3.5" fill="#AFAFAF"/><circle cx="84" cy="100" r="3.5" fill="#AFAFAF"/>
<path d="M4 108h112" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
</svg>'''

css = f"""
body{{background:#DDF4FF}}
.page{{background:radial-gradient(900px 600px at 0% 0%,#E9F9DC 0%,transparent 60%),radial-gradient(900px 700px at 100% 100%,#DCEFFF 0%,transparent 60%),#F3FAFF;color:{INK}}}
.page-head h2{{font-family:'Nunito';font-weight:900;color:{INK}}}
.page-head h2 em{{font-style:normal;color:{GREEN}}}
.phone{{background:#2B2B2B;box-shadow:0 40px 70px -25px rgba(28,120,180,.45),0 0 0 2px #1a1a1a inset}}
.screen{{background:#fff;color:{INK};font-family:'Nunito'}}
.gesture{{background:{INK}}}
.chipsrow{{display:flex;justify-content:space-between;align-items:center;padding:8px 18px 0}}
.pill{{display:flex;align-items:center;gap:6px;font:900 17px/1 'Nunito';padding:6px 4px}}
.hero{{display:flex;align-items:flex-end;gap:6px;padding:10px 18px 0}}
.bubble{{position:relative;flex:1;border:2px solid {LINE};border-radius:20px;padding:14px 16px;margin-bottom:22px;background:#fff}}
.bubble:before{{content:'';position:absolute;left:-10px;bottom:20px;width:16px;height:16px;background:#fff;border-left:2px solid {LINE};border-bottom:2px solid {LINE};transform:rotate(45deg)}}
.bubble b{{display:block;font:900 19px/1.15 'Nunito'}}
.bubble span{{display:block;font:700 14px/1.3 'Nunito';color:#777;margin-top:4px}}
.session{{margin:4px 18px 0;border:2px solid {LINE};border-bottom-width:5px;border-radius:24px;padding:16px}}
.s-top{{display:flex;justify-content:space-between;align-items:center}}
.s-top b{{font:900 18px/1 'Nunito'}}
.s-top span{{display:flex;align-items:center;gap:4px;font:800 13px/1 'Nunito';color:{GREY}}}
.counts{{display:flex;gap:10px;margin-top:14px}}
.cnt{{flex:1;border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:10px}}
.cnt .ic{{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center}}
.cnt b{{display:block;font:900 24px/1 'Nunito'}}
.cnt small{{display:block;font:800 12px/1 'Nunito';opacity:.8;margin-top:2px}}
.btn3d{{display:flex;align-items:center;justify-content:center;gap:10px;border-radius:16px;color:#fff;font:900 17px/1 'Nunito';letter-spacing:.06em;text-transform:uppercase}}
.start{{margin-top:14px;height:56px;background:{GREEN};box-shadow:0 5px 0 {GREEN_D}}}
.week{{display:flex;justify-content:space-between;margin:20px 22px 0}}
.day{{display:flex;flex-direction:column;align-items:center;gap:6px;font:800 12px/1 'Nunito';color:{GREY}}}
.dd{{width:34px;height:34px;border-radius:50%;background:#F2F2F2;display:flex;align-items:center;justify-content:center}}
.dd.done{{background:{ORANGE};box-shadow:0 3px 0 {ORANGE_D}}}
.dd.today{{background:#fff;border:3px dashed {ORANGE}}}
.sec{{font:900 18px/1 'Nunito';padding:20px 20px 12px}}
.tiles{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 18px}}
.tile{{height:124px;border-radius:20px;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center}}
.tile .ic{{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center}}
.tile b{{font:900 14.5px/1 'Nunito'}}
.tile small{{font:800 11.5px/1 'Nunito';opacity:.9;margin-top:-3px}}
/* card */
.bar{{display:flex;align-items:center;gap:14px;padding:12px 20px 0}}
.prog{{flex:1;height:16px;border-radius:10px;background:{LINE};overflow:hidden}}
.prog i{{display:block;height:100%;width:25%;background:{GREEN};border-radius:10px;position:relative}}
.prog i:after{{content:'';position:absolute;left:8px;right:8px;top:4px;height:4px;border-radius:4px;background:rgba(255,255,255,.4)}}
.bar .n{{font:900 15px/1 'Nunito';color:{GREEN}}}
.praise{{display:flex;align-items:center;gap:8px;padding:14px 22px 0;font:900 16px/1 'Nunito';color:{GREEN}}}
.flash{{height:604px;display:flex;flex-direction:column;margin:12px 18px 0;border:2px solid {LINE};border-bottom-width:6px;border-radius:28px;padding:20px 20px 18px;position:relative}}
.chips{{display:flex;gap:8px;align-items:center}}
.chip{{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:12px;background:#F2F2F2;font:900 12.5px/1 'Nunito';color:#777}}
.artchip{{align-self:flex-start;display:inline-block;margin-top:18px;padding:6px 14px;border-radius:12px;background:{PINK};box-shadow:0 3px 0 {PINK_D};color:#fff;font:900 18px/1 'Nunito'}}
.word{{margin-top:12px;font:900 46px/1.05 'Nunito';letter-spacing:-.01em}}
.plural{{margin-top:8px;font:800 15px/1 'Nunito';color:{GREY}}}
.plural b{{color:{PINK}}}
.ru{{margin-top:22px;padding-top:20px;border-top:2px dashed {LINE};font:900 30px/1 'Nunito';color:{INK}}}
.atnote{{margin-top:20px;display:flex;gap:10px;align-items:center;padding:8px 14px 8px 8px;border-radius:18px;background:#FFF5D1;border:2px solid #FFE38A}}
.atnote .t{{font:800 14px/1.3 'Nunito';color:#8A6A00}}
.atnote .t b{{color:{RED};font-weight:900;font-size:17px}}
.ex{{margin-top:16px;padding:14px;border-radius:18px;background:#EAF7FE;display:flex;gap:12px;align-items:flex-start}}
.ex .sp{{flex:none;width:42px;height:42px;border-radius:14px;background:{BLUE};box-shadow:0 4px 0 {BLUE_D};display:flex;align-items:center;justify-content:center}}
.ex .de{{font:800 16.5px/1.3 'Nunito';color:{INK}}}
.ex .de u{{text-decoration:none;color:{PINK};font-weight:900}}
.ex .rx{{font:700 14px/1.35 'Nunito';color:#6F8796;margin-top:5px}}
.rel{{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:16px;border:2px solid {LINE};font:800 13px/1 'Nunito';color:{GREY}}}
.rel b{{font:900 15px/1 'Nunito';color:{INK}}} .rel b em{{font-style:normal;color:{PINK}}}
.legend{{position:absolute;left:0;right:0;bottom:124px;display:flex;justify-content:center;gap:10px}}
.legend span{{padding:5px 12px;border-radius:10px;color:#fff;font:900 13px/1 'Nunito'}}
.grades{{position:absolute;left:18px;right:18px;bottom:36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}}
.g{{height:66px;flex-direction:column;gap:4px;letter-spacing:0;text-transform:none;font-size:16px}}
.g small{{font:800 12.5px/1 'Nunito';opacity:.9}}
"""

TILE_COL = [(BLUE, BLUE_D), (ORANGE, ORANGE_D), (PURPLE, PURPLE_D), (YELLOW, YELLOW_D), (GREEN, GREEN_D), (PINK, PINK_D)]

def home():
    week = "".join(
        f'<div class="day">{d}<div class="dd {"done" if DONE[i] else ""} {"today" if i == TODAY else ""}">'
        + (icon("flame", 17, "#fff", 2.6) if DONE[i] else (icon("flame", 16, ORANGE, 2.6) if i == TODAY else ""))
        + "</div></div>" for i, d in enumerate(DAYS))
    tiles = "".join(
        f'<div class="tile" style="background:{c};box-shadow:0 5px 0 {cd}"><div class="ic">{icon(n, 24, "#fff", 2.6)}</div><b>{t}</b><small>{s2}</small></div>'
        for (n, t, s1, s2), (c, cd) in zip(TILES, TILE_COL))
    return f'''<div class="screen"><div class="cam"></div>{status_bar(INK)}
<div class="chipsrow"><span class="pill" style="color:{GREY}">{at_flag(28, 19)}&nbsp;DE</span>
<span style="display:flex;gap:14px"><span class="pill" style="color:{ORANGE}">{icon("flame", 22, ORANGE, 2.6)}12</span><span class="pill" style="color:{YELLOW_D}">{icon("trophy", 22, YELLOW, 2.4)}7</span></span></div>
<div class="hero">{bimmi(118)}<div class="bubble"><b>Servus, Александр!</b><span>Уже 12 дней подряд!</span></div></div>
<div class="session"><div class="s-top"><b>Занятие на сегодня</b><span>{icon("clock", 14, GREY, 2.6)} 8 мин</span></div>
<div class="counts"><div class="cnt" style="background:#E3F5FE;color:{BLUE_D}"><div class="ic" style="background:{BLUE}">{icon("repeat", 19, "#fff", 2.6)}</div><div><b>18</b><small>повторить</small></div></div>
<div class="cnt" style="background:#F6EBFF;color:{PURPLE_D}"><div class="ic" style="background:{PURPLE}">{icon("sparkle", 19, "#fff", 2.6)}</div><div><b>10</b><small>новых</small></div></div></div>
<div class="btn3d start">Начать</div></div>
<div class="week">{week}</div>
<div class="sec">Тренировки</div>
<div class="tiles">{tiles}</div>
<div class="gesture"></div></div>'''

def card():
    return f'''<div class="screen"><div class="cam"></div>{status_bar(INK)}
<div class="bar">{icon("x", 24, GREY, 3)}<div class="prog"><i></i></div><span class="n">7/28</span></div>
<div class="praise">{icon("flame", 18, ORANGE, 2.8)}<span style="color:{ORANGE}">3 подряд верно!</span></div>
<div class="flash">
<div class="chips"><span class="chip">{icon("tram", 15, "#777", 2.6)} Транспорт</span><span class="chip">A2</span></div>
<div class="artchip">die</div>
<div class="word">Straßenbahn</div>
<div class="plural">мн. ч. <b>die</b> Straßenbahnen</div>
<div class="ru">трамвай</div>
<div class="atnote">{bimmi(52)}<div class="t">В Вене говорят просто<br><span style="white-space:nowrap;display:inline-flex;align-items:center;gap:6px"><b>die Bim!</b>{at_flag(20, 13)}</span></div></div>
<div class="ex"><div class="sp">{icon("volume", 21, "#fff", 2.6)}</div><div><div class="de">Die <u>Straßenbahn</u> kommt alle fünf Minuten.</div><div class="rx">Трамвай ходит каждые пять минут.</div></div></div>
<div class="rel"><span>ПОХОЖЕЕ</span><b><em>die</em> Haltestelle <span style="color:#AFAFAF;font-weight:800">· остановка</span></b></div>
</div>
<div class="legend"><span style="background:{DER}">der</span><span style="background:{DIE}">die</span><span style="background:{DAS}">das</span></div>
<div class="grades"><div class="btn3d g" style="background:{RED};box-shadow:0 5px 0 {RED_D}">Не помню<small>сейчас</small></div>
<div class="btn3d g" style="background:{ORANGE};box-shadow:0 5px 0 {ORANGE_D}">Трудно<small>2 дн.</small></div>
<div class="btn3d g" style="background:{GREEN};box-shadow:0 5px 0 {GREEN_D}">Помню<small>6 дн.</small></div></div>
<div class="gesture"></div></div>'''

body = f'''<div class="page"><div class="page-head"><div><div class="kicker">Karten · стиль 2</div><h2>Игровой <em>с Бимми</em></h2></div>
<p>Яркие цвета, «объёмные» кнопки, округлый Nunito и талисман — венский трамвайчик Бимми.</p></div>
<div class="phones"><div class="phone">{home()}<div class="label-under">Главная</div></div><div class="phone">{card()}<div class="label-under">Карточка · ответ</div></div></div></div>'''

HTML = page(css, body, "Karten — Игровой")
