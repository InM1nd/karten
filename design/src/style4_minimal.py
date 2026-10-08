from common import *

INK = "#111111"; GREY = "#8E8E93"; LINE = "#ECECEC"; SOFT = "#F6F6F4"; ACC = "#FF6B00"
DER, DIE, DAS = "#3E63DD", "#E03E6F", "#2F9E6A"

css = f"""
body{{background:#EFEFEC}}
.page{{background:#F2F2EF;color:{INK}}}
.page-head h2{{font:600 42px/1 'Inter Tight';letter-spacing:-.035em}}
.page-head h2 em{{font-style:normal;color:{ACC}}}
.page-head .kicker,.page-head p{{font-family:'Inter Tight'}}
.phone{{background:#1C1C1E;box-shadow:0 40px 80px -30px rgba(0,0,0,.35),0 0 0 1px #000 inset}}
.screen{{background:#fff;color:{INK};font-family:'Inter Tight'}}
.status{{font-family:'Inter Tight'}}
.gesture{{background:{INK}}}
.top{{display:flex;justify-content:space-between;align-items:center;padding:16px 26px 0;font:500 14px/1 'Inter Tight';color:{GREY}}}
.hello{{padding:22px 26px 0;font:600 34px/1.08 'Inter Tight';letter-spacing:-.035em}}
.hello span{{color:#B5B5BA}}
.streak{{display:flex;align-items:center;gap:8px;padding:14px 26px 0;font:500 14px/1 'Inter Tight'}}
.streak i{{width:7px;height:7px;border-radius:50%;background:{ACC}}}
.streak span{{color:{GREY}}}
.big{{display:flex;align-items:flex-end;gap:14px;padding:34px 26px 0}}
.big b{{font:600 112px/.8 'Inter Tight';letter-spacing:-.06em}}
.big span{{font:500 17px/1.25 'Inter Tight';color:{GREY};padding-bottom:4px}}
.split{{display:flex;gap:0;margin:26px 26px 0;border-top:1px solid {LINE};border-bottom:1px solid {LINE}}}
.split div{{flex:1;padding:14px 0}}
.split div+div{{border-left:1px solid {LINE};padding-left:16px}}
.split b{{display:block;font:600 20px/1 'Inter Tight';letter-spacing:-.02em}}
.split small{{display:block;font:500 12.5px/1 'Inter Tight';color:{GREY};margin-top:6px}}
.start{{margin:22px 26px 0;height:58px;border-radius:999px;background:{INK};color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 8px 0 26px;font:600 17px/1 'Inter Tight';letter-spacing:-.01em}}
.start i{{width:42px;height:42px;border-radius:50%;background:{ACC};display:flex;align-items:center;justify-content:center}}
.week{{display:flex;justify-content:space-between;padding:26px 30px 0}}
.wd{{display:flex;flex-direction:column;align-items:center;gap:9px;font:500 12px/1 'Inter Tight';color:#B5B5BA}}
.wd i{{width:8px;height:8px;border-radius:50%;background:{LINE}}}
.wd.done{{color:{INK}}} .wd.done i{{background:{INK}}}
.wd.today{{color:{ACC}}} .wd.today i{{background:#fff;box-shadow:0 0 0 2px {ACC}}}
.sec{{padding:28px 26px 12px;font:500 12px/1 'Inter Tight';letter-spacing:.14em;text-transform:uppercase;color:{GREY}}}
.tiles{{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0 26px;border-top:1px solid {LINE}}}
.tile{{padding:15px 0 15px;display:flex;align-items:center;gap:12px;border-bottom:1px solid {LINE}}}
.tile:nth-child(odd){{border-right:1px solid {LINE}}}
.tile:nth-child(even){{padding-left:16px}}
.tile b{{display:block;font:600 16px/1 'Inter Tight';letter-spacing:-.01em}}
.tile small{{display:block;font:500 12.5px/1 'Inter Tight';color:{GREY};margin-top:5px}}
/* card */
.bar{{display:flex;align-items:center;justify-content:space-between;padding:14px 26px 0;font:500 14px/1 'Inter Tight';color:{GREY}}}
.line{{margin:16px 26px 0;height:2px;background:{LINE};border-radius:2px}}
.line i{{display:block;height:100%;width:25%;background:{INK};border-radius:2px}}
.meta{{padding:48px 26px 0;font:500 12px/1 'Inter Tight';letter-spacing:.14em;text-transform:uppercase;color:{GREY}}}
.art{{display:flex;align-items:center;gap:8px;padding:30px 26px 0;font:600 20px/1 'Inter Tight';color:{DIE}}}
.art i{{width:9px;height:9px;border-radius:50%;background:{DIE}}}
.word{{padding:10px 26px 0;font:600 52px/1 'Inter Tight';letter-spacing:-.045em}}
.plural{{padding:14px 26px 0;font:500 15px/1 'Inter Tight';color:{GREY}}}
.plural b{{color:{DIE};font-weight:600}}
.ru{{margin:30px 26px 0;padding-top:28px;border-top:1px solid {LINE};font:400 36px/1 'Inter Tight';letter-spacing:-.03em}}
.atnote{{display:flex;align-items:center;gap:10px;padding:18px 26px 0;font:500 15px/1 'Inter Tight';color:{GREY}}}
.atnote b{{color:{INK};font-weight:600}}
.ex{{margin:34px 26px 0;display:flex;gap:16px}}
.ex .de{{font:400 20px/1.35 'Inter Tight';letter-spacing:-.015em}}
.ex .de u{{text-decoration:none;font-weight:600}}
.ex .rx{{font:400 15px/1.45 'Inter Tight';color:{GREY};margin-top:8px}}
.rel{{position:absolute;left:26px;right:26px;bottom:160px;padding-top:16px;border-top:1px solid {LINE};display:flex;justify-content:space-between;font:500 14px/1 'Inter Tight';color:{GREY}}}
.rel b{{color:{INK};font-weight:600}} .rel b em{{font-style:normal;color:{DIE}}}
.legend{{position:absolute;left:26px;right:26px;bottom:124px;display:flex;gap:16px;font:500 13px/1 'Inter Tight';color:{GREY}}}
.legend span{{display:flex;align-items:center;gap:6px}}
.legend i{{width:7px;height:7px;border-radius:50%}}
.legend em{{margin-left:auto;font-style:normal}}
.grades{{position:absolute;left:20px;right:20px;bottom:36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}}
.g{{height:66px;border-radius:18px;border:1px solid {LINE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}}
.g b{{font:600 15px/1 'Inter Tight';letter-spacing:-.01em}}
.g small{{font:500 12.5px/1 'Inter Tight';color:{GREY}}}
.g.good{{background:{INK};border-color:{INK};color:#fff}} .g.good small{{color:#A1A1A6}}
"""

def home():
    week = "".join(f'<div class="wd {"done" if DONE[i] else ""} {"today" if i == TODAY else ""}">{d}<i></i></div>' for i, d in enumerate(DAYS))
    tiles = "".join(f'<div class="tile">{icon(n, 22, INK, 1.6)}<div><b>{t}</b><small>{s2}</small></div></div>' for (n, t, s1, s2) in TILES)
    return f'''<div class="screen"><div class="cam"></div>{status_bar(INK)}
<div class="top"><span>Четверг, 8 октября</span>{icon("sliders", 20, INK, 1.6)}</div>
<div class="hello">Добрый вечер,<br><span>Александр.</span></div>
<div class="streak"><i></i>12 дней подряд <span>· рекорд 21</span></div>
<div class="big"><b>28</b><span>карточек<br>на сегодня</span></div>
<div class="split"><div><b>18</b><small>повторить</small></div><div><b>10</b><small>новых</small></div><div><b>8 мин</b><small>примерно</small></div></div>
<div class="start">Начать<i>{icon("arrow", 20, "#fff", 2.2)}</i></div>
<div class="week">{week}</div>
<div class="sec">Режимы</div>
<div class="tiles">{tiles}</div>
<div class="gesture"></div></div>'''

def card():
    return f'''<div class="screen"><div class="cam"></div>{status_bar(INK)}
<div class="bar">{icon("x", 22, INK, 1.6)}<span>7 из 28</span>{icon("volume", 21, INK, 1.6)}</div>
<div class="line"><i></i></div>
<div class="meta">Транспорт · A2</div>
<div class="art"><i></i>die</div>
<div class="word">Straßenbahn</div>
<div class="plural">мн. ч. <b>die</b> Straßenbahnen</div>
<div class="ru">трамвай</div>
<div class="atnote">{at_flag(20, 13, 2)}<span>В Вене говорят <b>die Bim</b></span></div>
<div class="ex"><div style="width:2px;background:{INK};border-radius:2px;flex:none"></div><div><div class="de">Die <u>Straßenbahn</u> kommt alle fünf Minuten.</div><div class="rx">Трамвай ходит каждые пять минут.</div></div></div>
<div class="rel"><span>Похожее</span><span><b><em>die</em> Haltestelle</b> · остановка</span></div>
<div class="legend"><span><i style="background:{DER}"></i>der</span><span><i style="background:{DIE}"></i>die</span><span><i style="background:{DAS}"></i>das</span><em>Как хорошо помнишь?</em></div>
<div class="grades"><div class="g"><b>Не помню</b><small>сейчас</small></div><div class="g"><b>Трудно</b><small>2 дн.</small></div><div class="g good"><b>Помню</b><small>6 дн.</small></div></div>
<div class="gesture"></div></div>'''

body = f'''<div class="page"><div class="page-head"><div><div class="kicker">Karten · стиль 4</div><h2>Минимализм<em>.</em></h2></div>
<p>Много воздуха, крупная типографика Inter Tight, чёрно-белая гамма с одним оранжевым акцентом; цвет остаётся только у артиклей der/die/das.</p></div>
<div class="phones"><div class="phone">{home()}<div class="label-under">Главная</div></div><div class="phone">{card()}<div class="label-under">Карточка · ответ</div></div></div></div>'''

HTML = page(css, body, "Karten — Минимализм")
