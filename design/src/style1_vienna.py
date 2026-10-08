from common import *

RED = "#C8102E"; INK = "#2A1D16"; CREAM = "#F6EEE1"; CARD = "#FFFBF4"; GOLD = "#B48A4A"; MUTED = "#8A7663"
DER = "#27497A"; DIE = "#C8102E"; DAS = "#2E6A4D"

css = f"""
body{{background:#E9DFCF}}
.page{{background:radial-gradient(1200px 700px at 15% 0%,#F4ECDF 0%,#E7DCCB 60%,#DED1BD 100%);color:{INK}}}
.page-head h2{{font-family:'Playfair Display';font-weight:700;color:{INK}}}
.page-head h2 em{{color:{RED};font-style:italic}}
.phone{{background:linear-gradient(145deg,#3a2c24,#1d1511);box-shadow:0 40px 80px -20px rgba(70,40,20,.45),0 0 0 1px rgba(0,0,0,.4) inset}}
.screen{{background:{CREAM};color:{INK};font-family:'Manrope'}}
.gesture{{background:{INK};opacity:.8}}
.paper{{position:absolute;inset:0;background:
  radial-gradient(500px 300px at 100% 0%,rgba(200,16,46,.06),transparent 70%),
  radial-gradient(400px 400px at 0% 100%,rgba(180,138,74,.10),transparent 70%)}}
/* home */
.top{{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 24px 0;position:relative}}
.servus{{font:italic 600 18px/1 'Playfair Display';color:{RED};margin-bottom:8px;display:flex;align-items:center;gap:8px}}
.servus i{{display:inline-block;width:22px;height:1px;background:{RED}}}
.hello{{font:700 30px/1.1 'Playfair Display';letter-spacing:-.01em}}
.iconbtn{{width:42px;height:42px;border-radius:50%;border:1px solid #E3D5BF;background:{CARD};display:flex;align-items:center;justify-content:center;color:{INK}}}
.streak{{display:inline-flex;align-items:center;gap:6px;margin:14px 24px 0;padding:7px 12px 7px 9px;border-radius:999px;background:{CARD};border:1px solid #EBD9C2;font:700 13px/1 'Manrope';color:{RED}}}
.streak span{{color:{MUTED};font-weight:600}}
.session{{margin:16px 20px 0;background:{CARD};border-radius:24px;padding:20px 20px 18px;position:relative;overflow:hidden;
  box-shadow:0 1px 0 #fff inset,0 18px 40px -18px rgba(90,50,20,.35),0 0 0 1px #EADCC6}}
.session:before{{content:'';position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,{RED} 33.3%,#fff 33.3% 66.6%,{RED} 66.6%)}}
.s-head{{display:flex;justify-content:space-between;align-items:center}}
.s-title{{font:700 13px/1 'Manrope';letter-spacing:.16em;text-transform:uppercase;color:{MUTED}}}
.s-time{{display:flex;gap:5px;align-items:center;font:600 13px/1 'Manrope';color:{MUTED}}}
.counts{{display:flex;gap:28px;margin-top:14px;position:relative;z-index:2}}
.count b{{display:block;font:700 46px/1 'Playfair Display';color:{INK}}}
.count span{{display:block;font:600 13px/1.2 'Manrope';color:{MUTED};margin-top:6px}}
.count.new b{{color:{RED}}}
.tramart{{position:absolute;right:-14px;top:46px;opacity:.85;transform:scale(.88);transform-origin:right top}}
.start{{margin-top:18px;height:54px;border-radius:16px;background:{RED};color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;
  font:700 16px/1 'Manrope';letter-spacing:.02em;box-shadow:0 10px 22px -10px rgba(200,16,46,.7),0 1px 0 rgba(255,255,255,.25) inset;position:relative;z-index:2}}
.week{{display:flex;justify-content:space-between;margin:16px 24px 0}}
.day{{display:flex;flex-direction:column;align-items:center;gap:6px;font:600 11px/1 'Manrope';color:{MUTED}}}
.dot{{width:30px;height:30px;border-radius:50%;border:1px solid #E1D2BC;display:flex;align-items:center;justify-content:center;background:{CARD}}}
.dot.done{{background:{RED};border-color:{RED}}}
.dot.today{{border:2px solid {RED};background:#fff}}
.orn{{display:flex;align-items:center;gap:10px;margin:16px 24px 10px;font:italic 600 15px/1 'Playfair Display';color:{INK}}}
.orn:after{{content:'';flex:1;height:1px;background:linear-gradient(90deg,#D9C6A8,transparent)}}
.tiles{{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 20px}}
.tile{{background:{CARD};border-radius:18px;padding:13px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 0 0 1px #EADCC6,0 8px 18px -14px rgba(90,50,20,.4)}}
.tile .ic{{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none}}
.tile b{{display:block;font:700 16px/1.15 'Playfair Display'}}
.tile small{{display:block;font:600 12px/1.2 'Manrope';color:{MUTED};margin-top:3px}}
/* card */
.bar{{display:flex;align-items:center;gap:14px;padding:12px 22px 0}}
.prog{{flex:1;height:6px;border-radius:6px;background:#E8DCC8;overflow:hidden}}
.prog i{{display:block;height:100%;width:25%;background:{RED};border-radius:6px}}
.bar .n{{font:700 13px/1 'Manrope';color:{MUTED}}}
.flash{{margin:18px 20px 0;background:{CARD};border-radius:26px;padding:26px 24px 22px;position:relative;
  box-shadow:0 0 0 1px #E8D8BF,0 30px 50px -28px rgba(90,50,20,.45)}}
.flash:after{{content:'';position:absolute;inset:8px;border:1px solid rgba(180,138,74,.35);border-radius:20px;pointer-events:none}}
.chips{{display:flex;gap:8px;align-items:center}}
.chip{{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#F3E8D8;font:700 12px/1 'Manrope';color:#6E5A47}}
.word{{margin-top:30px;font:700 42px/1.05 'Playfair Display';letter-spacing:-.01em}}
.word .art{{color:{DIE};font-style:italic;font-weight:600;margin-right:10px}}
.plural{{margin-top:10px;font:600 14px/1 'Manrope';color:{MUTED}}}
.plural b{{color:{DIE};font-weight:700}}
.divider{{display:flex;align-items:center;gap:10px;margin:26px 0 22px;color:{GOLD}}}
.divider:before,.divider:after{{content:'';flex:1;height:1px;background:#E3D2B7}}
.ru{{font:700 34px/1 'Playfair Display';color:{INK}}}
.atnote{{margin-top:24px;display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:14px;background:#FBEDEE;border:1px solid #F1D1D5}}
.atnote .t{{font:600 13px/1.35 'Manrope';color:#7A2A33}}
.atnote .t b{{font:italic 700 17px/1 'Playfair Display';color:{DIE}}}
.ex{{margin-top:18px;padding:16px 16px;border-left:3px solid {GOLD};background:#F8F0E3;border-radius:4px 14px 14px 4px;position:relative}}
.ex .de{{font:italic 500 17px/1.35 'Playfair Display';color:{INK};padding-right:30px}}
.ex .de u{{text-decoration:none;color:{DIE};font-weight:700}}
.ex .rx{{font:500 13.5px/1.4 'Manrope';color:{MUTED};margin-top:6px}}
.ex .sp{{position:absolute;right:12px;top:12px;color:{RED}}}
.flash{{height:628px;display:flex;flex-direction:column}}
.rel{{margin-top:auto;padding-top:14px;border-top:1px dashed #E3D2B7;display:flex;justify-content:space-between;align-items:center;font:600 13px/1 'Manrope';color:{MUTED}}}
.rel b{{color:{INK};font:700 15px/1 'Playfair Display'}} .rel b em{{color:{DIE};font-style:italic}}
.wod{{margin:16px 20px 0;display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:18px;background:linear-gradient(90deg,#FFF8EE,#FBEFE0);box-shadow:0 0 0 1px #EADCC6}}
.wod .k{{font:700 10.5px/1 'Manrope';letter-spacing:.16em;text-transform:uppercase;color:{GOLD}}}
.wod .w{{font:700 19px/1.1 'Playfair Display';margin-top:5px}} .wod .w em{{color:{DAS};font-style:italic;font-weight:600}}
.wod .r{{font:600 13px/1 'Manrope';color:{MUTED};margin-left:auto;text-align:right}}
.legend{{position:absolute;left:0;right:0;bottom:118px;display:flex;justify-content:center;gap:16px;font:italic 700 15px/1 'Playfair Display'}}
.legend span{{display:flex;align-items:center;gap:6px}}
.legend i{{width:8px;height:8px;border-radius:50%}}
.grades{{position:absolute;left:20px;right:20px;bottom:34px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}}
.g{{height:70px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}}
.g b{{font:700 15px/1 'Manrope'}}
.g small{{font:600 12px/1 'Manrope';opacity:.75}}
.g.again{{background:#F6DCDD;color:#9E1328;box-shadow:0 0 0 1px #EDC3C7 inset}}
.g.hard{{background:#F3E5C8;color:#7A5717;box-shadow:0 0 0 1px #E6D1A6 inset}}
.g.good{{background:{DAS};color:#fff;box-shadow:0 12px 22px -12px rgba(46,106,77,.8)}}
"""

def tram_art():
    return f'''<svg class="tramart" width="190" height="96" viewBox="0 0 190 96" fill="none">
<path d="M10 90H190" stroke="#E3D2B7" stroke-width="2"/><path d="M60 10 92 2 124 10" stroke="#C9B08A" stroke-width="1.5"/><path d="M92 2v16" stroke="#C9B08A" stroke-width="1.5"/>
<rect x="40" y="18" width="150" height="62" rx="12" fill="{RED}" opacity=".12"/>
<rect x="40" y="18" width="150" height="62" rx="12" stroke="{RED}" stroke-width="2" opacity=".55"/>
<rect x="40" y="52" width="150" height="9" fill="#fff" opacity=".9"/>
<g fill="#fff" stroke="{RED}" stroke-opacity=".45" stroke-width="1.5"><rect x="52" y="27" width="22" height="18" rx="4"/><rect x="82" y="27" width="22" height="18" rx="4"/><rect x="112" y="27" width="22" height="18" rx="4"/><rect x="142" y="27" width="22" height="18" rx="4"/></g>
<g fill="{INK}" opacity=".55"><circle cx="66" cy="84" r="5"/><circle cx="90" cy="84" r="5"/><circle cx="150" cy="84" r="5"/><circle cx="174" cy="84" r="5"/></g>
<text x="176" y="72" font-family="Manrope" font-weight="800" font-size="9" fill="{RED}" opacity=".7">D</text></svg>'''

tile_colors = [(DER, "#E6ECF5"), ("#B4741E", "#F6EAD6"), (DAS, "#E2EEE7"), (RED, "#F8E1E3"), ("#6B4E36", "#EFE5D8"), (GOLD, "#F5ECDC")]

def home():
    week = "".join(
        f'<div class="day">{d}<div class="dot {"done" if DONE[i] else ""} {"today" if i == TODAY else ""}">'
        + (icon("check", 15, "#fff", 3) if DONE[i] else (f'<span style="font:700 12px Manrope;color:{RED}">8</span>' if i == TODAY else ""))
        + "</div></div>" for i, d in enumerate(DAYS))
    tiles = "".join(
        f'<div class="tile"><div class="ic" style="background:{bg};color:{fg}">{icon(n, 21, fg, 1.9)}</div><div><b>{t}</b><small>{s2}</small></div></div>'
        for (n, t, s1, s2), (fg, bg) in zip(TILES, tile_colors))
    return f'''<div class="screen"><div class="paper"></div><div class="cam"></div>{status_bar(INK)}
<div class="top"><div><div class="servus"><i></i>Servus!</div><div class="hello">Добрый вечер,<br>Александр</div></div>
<div class="iconbtn">{icon("sliders", 19, INK, 1.8)}</div></div>
<div class="streak">{icon("flame", 15, RED, 2.2)} 12 дней подряд <span>· рекорд 21</span></div>
<div class="session"><div class="s-head"><span class="s-title">Сегодня</span><span class="s-time">{icon("clock", 14, MUTED, 2)} ≈ 8 мин</span></div>
{tram_art()}
<div class="counts"><div class="count"><b>18</b><span>к повторению</span></div><div class="count new"><b>10</b><span>новых слов</span></div></div>
<div class="start">Начать занятие {icon("arrow", 18, "#fff", 2.4)}</div></div>
<div class="week">{week}</div>
<div class="wod">{at_flag(24,16)}<div><div class="k">Слово дня</div><div class="w"><em>das</em> Vorzimmer</div></div><div class="r">прихожая</div></div>
<div class="orn">{icon("coffee", 18, GOLD, 1.8)} Тренировки</div>
<div class="tiles">{tiles}</div>
<div class="gesture"></div></div>'''

def card():
    return f'''<div class="screen"><div class="paper"></div><div class="cam"></div>{status_bar(INK)}
<div class="bar">{icon("x", 22, INK, 2)}<div class="prog"><i></i></div><span class="n">7 / 28</span></div>
<div class="flash">
<div class="chips"><span class="chip">{icon("tram", 14, "#6E5A47", 2)} Транспорт</span><span class="chip">A2</span><span class="chip" style="margin-left:auto;background:transparent;padding:0">{icon("volume", 20, RED, 2)}</span></div>
<div class="word"><span class="art">die</span>Straßenbahn</div>
<div class="plural">мн. ч. <b>die</b> Straßenbahnen</div>
<div class="divider">✦</div>
<div class="ru">трамвай</div>
<div class="atnote">{at_flag(26, 17)}<div class="t">В Вене говорят <b>die Bim</b><br>разговорное, очень по-венски</div></div>
<div class="ex"><div class="de">Die <u>Straßenbahn</u> kommt alle fünf Minuten.</div><div class="rx">Трамвай ходит каждые пять минут.</div></div>
<div class="rel"><span>Похожее</span><b><em>die</em> Haltestelle <span style="font:600 13px Manrope;color:#8A7663">· остановка</span></b></div>
</div>
<div class="legend"><span style="color:{DER}"><i style="background:{DER}"></i>der</span><span style="color:{DIE}"><i style="background:{DIE}"></i>die</span><span style="color:{DAS}"><i style="background:{DAS}"></i>das</span></div>
<div class="grades"><div class="g again"><b>Не помню</b><small>сейчас</small></div><div class="g hard"><b>Трудно</b><small>2 дн.</small></div><div class="g good"><b>Помню</b><small>6 дн.</small></div></div>
<div class="gesture"></div></div>'''

body = f'''<div class="page"><div class="page-head"><div><div class="kicker">Karten · стиль 1</div><h2>Венский <em>Kaffeehaus</em></h2></div>
<p>Красно-бело-красная палитра, кремовые карточки, антиква Playfair Display и мотивы венского трамвая и кофейни.</p></div>
<div class="phones"><div class="phone">{home()}<div class="label-under">Главная</div></div><div class="phone">{card()}<div class="label-under">Карточка · ответ</div></div></div></div>'''

HTML = page(css, body, "Karten — Венский")
