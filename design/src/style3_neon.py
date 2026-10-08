from common import *

BG = "#07070C"; TXT = "#F4F4FA"; MUT = "#8B8BA3"
CYAN = "#22D3EE"; MAG = "#FF3EA5"; LIME = "#A3FF12"; VIO = "#8B5CF6"; AMB = "#FFB547"; ROSE = "#FF4D6D"
DER, DIE, DAS = CYAN, MAG, LIME

css = f"""
body{{background:#040406}}
.page{{background:radial-gradient(700px 500px at 10% 10%,rgba(139,92,246,.22),transparent 70%),radial-gradient(700px 600px at 95% 90%,rgba(255,62,165,.16),transparent 70%),#050508;color:{TXT}}}
.page-head h2{{font-family:'Unbounded';font-weight:700;font-size:36px;letter-spacing:-.01em}}
.page-head h2 em{{font-style:normal;color:{MAG};text-shadow:0 0 18px rgba(255,62,165,.7)}}
.page-head .kicker,.page-head p{{color:#C9C9DA}}
.phone{{background:linear-gradient(160deg,#2a2a35,#0d0d12);box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 40px 90px -20px rgba(139,92,246,.35),0 30px 60px -30px rgba(0,0,0,.9)}}
.screen{{background:{BG};color:{TXT};font-family:'Manrope'}}
.gesture{{background:#fff;opacity:.7}}
.orb{{position:absolute;border-radius:50%;filter:blur(60px);z-index:0}}
.z{{position:relative;z-index:2}}
.glass{{background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.11);
  box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 20px 40px -20px rgba(0,0,0,.8);backdrop-filter:blur(22px)}}
.top{{display:flex;justify-content:space-between;align-items:center;padding:14px 22px 0}}
.top small{{display:block;font:700 11px/1 'Manrope';letter-spacing:.2em;color:{MUT}}}
.top b{{display:block;font:600 26px/1.15 'Unbounded';margin-top:8px;letter-spacing:-.01em}}
.avatar{{width:46px;height:46px;border-radius:50%;padding:2px;background:conic-gradient({CYAN},{VIO},{MAG},{CYAN})}}
.avatar div{{width:100%;height:100%;border-radius:50%;background:#14141c;display:flex;align-items:center;justify-content:center;font:700 16px 'Unbounded'}}
.streak{{display:inline-flex;align-items:center;gap:8px;margin:16px 22px 0;padding:8px 14px 8px 10px;border-radius:999px;font:700 13px/1 'Manrope'}}
.streak b{{font:700 14px/1 'Unbounded';color:{AMB};text-shadow:0 0 12px rgba(255,181,71,.8)}}
.session{{margin:14px 18px 0;border-radius:28px;padding:20px;position:relative;overflow:hidden}}
.session .lbl{{display:flex;justify-content:space-between;font:700 11px/1 'Manrope';letter-spacing:.2em;color:{MUT}}}
.counts{{display:flex;gap:12px;margin-top:16px}}
.cnt{{flex:1;padding:14px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}}
.cnt b{{display:block;font:700 36px/1 'Unbounded'}}
.cnt span{{display:block;font:600 13px/1 'Manrope';color:{MUT};margin-top:8px}}
.start{{margin-top:16px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;gap:10px;font:700 15px/1 'Unbounded';color:#07070C;
  background:linear-gradient(90deg,{CYAN},{VIO} 55%,{MAG});box-shadow:0 0 28px rgba(139,92,246,.55),0 0 0 1px rgba(255,255,255,.2) inset}}
.start span{{color:#fff}}
.week{{display:flex;justify-content:space-between;align-items:flex-end;margin:16px 22px 0;height:58px}}
.wd{{display:flex;flex-direction:column;align-items:center;gap:7px;font:700 11px/1 'Manrope';color:{MUT}}}
.wd i{{display:block;width:26px;border-radius:8px;background:rgba(255,255,255,.08)}}
.wd.done i{{background:linear-gradient(180deg,{AMB},#FF6A3D);box-shadow:0 0 14px rgba(255,140,60,.6)}}
.wd.today i{{background:transparent;border:1.5px dashed {AMB}}}
.wd.today{{color:{AMB}}}
.sec{{display:flex;justify-content:space-between;padding:20px 22px 12px;font:600 15px/1 'Unbounded'}}
.sec span{{font:600 12px/1 'Manrope';color:{MUT}}}
.wod{{margin:12px 18px 0;border-radius:20px;padding:14px 16px;display:flex;align-items:center;gap:14px}}
.wod small{{display:block;font:700 10.5px/1 'Manrope';letter-spacing:.2em;color:{MUT}}}
.wod b{{display:block;font:700 17px/1 'Unbounded';margin-top:7px}} .wod b em{{font-style:normal;color:{DAS};text-shadow:0 0 10px rgba(163,255,18,.8)}}
.wod .r{{margin-left:auto;font:600 13px/1 'Manrope';color:#C9C9DA}}
.tiles{{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 18px}}
.tile{{border-radius:20px;padding:13px 14px;display:flex;align-items:center;gap:12px}}
.tile .ic{{width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex:none}}
.tile b{{display:block;font:700 14.5px/1.1 'Manrope'}}
.tile small{{display:block;font:600 12px/1 'Manrope';color:{MUT};margin-top:4px}}
/* card */
.bar{{display:flex;align-items:center;gap:14px;padding:12px 22px 0}}
.prog{{flex:1;height:6px;border-radius:6px;background:rgba(255,255,255,.08)}}
.prog i{{display:block;height:100%;width:25%;border-radius:6px;background:linear-gradient(90deg,{CYAN},{VIO});box-shadow:0 0 12px rgba(34,211,238,.7)}}
.bar .n{{font:600 12px/1 'Unbounded';color:{MUT}}}
.flash{{margin:18px 18px 0;border-radius:30px;padding:24px 22px 20px;position:relative;height:618px;display:flex;flex-direction:column;
  box-shadow:0 0 0 1px rgba(255,62,165,.35) inset,0 0 40px -6px rgba(255,62,165,.35),0 30px 60px -30px rgba(0,0,0,.9)}}
.chips{{display:flex;gap:8px;align-items:center}}
.chip{{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font:700 12px/1 'Manrope';color:#C9C9DA}}
.art{{margin-top:28px;font:700 22px/1 'Unbounded';color:{DIE};text-shadow:0 0 10px rgba(255,62,165,.9),0 0 26px rgba(255,62,165,.6)}}
.word{{margin-top:8px;font:700 33px/1.1 'Unbounded';letter-spacing:-.02em}}
.plural{{margin-top:12px;font:600 14px/1 'Manrope';color:{MUT}}}
.plural b{{color:{DIE}}}
.ru{{margin-top:24px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);font:800 30px/1 'Manrope'}}
.atnote{{margin-top:20px;display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.28)}}
.atnote .t{{font:600 13px/1.35 'Manrope';color:#E9C9D2}}
.atnote .t b{{font:700 15px/1 'Unbounded';color:#fff}}
.ex{{margin-top:16px;padding:14px 16px 14px 18px;border-radius:16px;background:rgba(255,255,255,.04);position:relative}}
.ex:before{{content:'';position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:3px;background:{DIE};box-shadow:0 0 10px {DIE}}}
.ex .de{{font:600 16.5px/1.35 'Manrope';padding-right:34px}}
.ex .de u{{text-decoration:none;color:{DIE};font-weight:800}}
.ex .rx{{font:500 13.5px/1.4 'Manrope';color:{MUT};margin-top:6px}}
.ex .sp{{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.4)}}
.rel{{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font:600 12.5px/1 'Manrope';color:{MUT}}}
.rel b{{font:700 14px/1 'Manrope';color:{TXT}}} .rel b em{{font-style:normal;color:{DIE};text-shadow:0 0 8px rgba(255,62,165,.8)}}
.legend{{position:absolute;left:0;right:0;bottom:124px;display:flex;justify-content:center;gap:18px;font:700 13px/1 'Unbounded'}}
.legend span{{display:flex;align-items:center;gap:7px}}
.legend i{{width:8px;height:8px;border-radius:50%}}
.grades{{position:absolute;left:18px;right:18px;bottom:36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}}
.g{{height:68px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,.05)}}
.g b{{font:700 14.5px/1 'Manrope'}}
.g small{{font:600 11.5px/1 'Unbounded';opacity:.8}}
"""

def glow_icon(name, c):
    return f'<div class="ic" style="background:{c}1A;box-shadow:0 0 0 1px {c}55 inset,0 0 18px -4px {c}">{icon(name, 20, c, 2, f"style=\'filter:drop-shadow(0 0 4px {c})\'")}</div>'

TILE_C = [MAG, AMB, CYAN, LIME, VIO, "#FFD84D"]

def orbs(a, b, c):
    return (f'<div class="orb" style="width:260px;height:260px;right:-90px;top:-60px;background:{a};opacity:.45"></div>'
            f'<div class="orb" style="width:240px;height:240px;left:-120px;top:330px;background:{b};opacity:.35"></div>'
            f'<div class="orb" style="width:260px;height:260px;right:-120px;bottom:40px;background:{c};opacity:.3"></div>')

def home():
    hs = [40, 48, 34, 44, 20, 20, 20]
    week = "".join(f'<div class="wd {"done" if DONE[i] else ""} {"today" if i == TODAY else ""}"><i style="height:{hs[i]}px"></i>{d}</div>' for i, d in enumerate(DAYS))
    tiles = "".join(f'<div class="tile glass">{glow_icon(n, c)}<div><b>{t}</b><small>{s2}</small></div></div>' for (n, t, s1, s2), c in zip(TILES, TILE_C))
    return f'''<div class="screen">{orbs(VIO, CYAN, MAG)}<div class="cam"></div>{status_bar(TXT)}
<div class="z"><div class="top"><div><small>ДОБРЫЙ ВЕЧЕР</small><b>Александр</b></div><div class="avatar"><div>A</div></div></div>
<div class="streak glass">{icon("flame", 16, AMB, 2.2, "style='filter:drop-shadow(0 0 5px #FFB547)'")}<b>12</b> дней подряд</div>
<div class="session glass"><div class="lbl"><span>СЕГОДНЯ</span><span>≈ 8 МИН</span></div>
<div class="counts"><div class="cnt"><b style="color:{CYAN};text-shadow:0 0 16px rgba(34,211,238,.7)">18</b><span>к повторению</span></div>
<div class="cnt"><b style="color:{MAG};text-shadow:0 0 16px rgba(255,62,165,.7)">10</b><span>новых слов</span></div></div>
<div class="start">Начать {icon("arrow", 18, "#07070C", 2.6)}</div></div>
<div class="week">{week}</div>
<div class="sec">Режимы<span>6</span></div>
<div class="tiles">{tiles}</div>
<div class="wod glass">{at_flag(24,16)}<div><small>СЛОВО ДНЯ</small><b><em>das</em> Vorzimmer</b></div><span class="r">прихожая</span></div></div>
<div class="gesture"></div></div>'''

def card():
    return f'''<div class="screen">{orbs(MAG, VIO, CYAN)}<div class="cam"></div>{status_bar(TXT)}
<div class="z"><div class="bar">{icon("x", 22, TXT, 2)}<div class="prog"><i></i></div><span class="n">7/28</span></div>
<div class="flash glass">
<div class="chips"><span class="chip">{icon("tram", 14, "#C9C9DA", 2)} Транспорт</span><span class="chip">A2</span></div>
<div class="art">die</div>
<div class="word">Straßenbahn</div>
<div class="plural">мн. ч. <b>die</b> Straßenbahnen</div>
<div class="ru">трамвай</div>
<div class="atnote">{at_flag(26, 17)}<div class="t">В Вене говорят <b>die Bim</b><br>разговорное венское слово</div></div>
<div class="ex"><div class="de">Die <u>Straßenbahn</u> kommt alle fünf Minuten.</div><div class="rx">Трамвай ходит каждые пять минут.</div><div class="sp">{icon("volume", 17, CYAN, 2)}</div></div>
<div class="rel"><span>похожее</span><b><em>die</em> Haltestelle <span style="color:{MUT};font-weight:600">· остановка</span></b></div>
</div></div>
<div class="legend z"><span style="color:{DER}"><i style="background:{DER};box-shadow:0 0 10px {DER}"></i>der</span><span style="color:{DIE}"><i style="background:{DIE};box-shadow:0 0 10px {DIE}"></i>die</span><span style="color:{DAS}"><i style="background:{DAS};box-shadow:0 0 10px {DAS}"></i>das</span></div>
<div class="grades z">
<div class="g" style="border:1px solid {ROSE}88;box-shadow:0 0 18px -6px {ROSE};color:{ROSE}"><b>Не помню</b><small>сейчас</small></div>
<div class="g" style="border:1px solid {AMB}88;box-shadow:0 0 18px -6px {AMB};color:{AMB}"><b>Трудно</b><small>2 дн.</small></div>
<div class="g" style="border:1px solid {LIME};background:{LIME}22;box-shadow:0 0 24px -4px {LIME};color:{LIME}"><b>Помню</b><small>6 дн.</small></div></div>
<div class="gesture"></div></div>'''

body = f'''<div class="page"><div class="page-head"><div><div class="kicker">Karten · стиль 3</div><h2>Неоновый <em>тёмный</em></h2></div>
<p>Почти чёрный фон, стеклянные карточки, Unbounded и светящиеся цвета артиклей: der — циан, die — маджента, das — лайм.</p></div>
<div class="phones"><div class="phone">{home()}<div class="label-under">Главная</div></div><div class="phone">{card()}<div class="label-under">Карточка · ответ</div></div></div></div>'''

HTML = page(css, body, "Karten — Неон")
