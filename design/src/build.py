import importlib, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ".")
for mod, out in [("style1_vienna","style-1-vienna"),("style2_playful","style-2-playful"),("style3_neon","style-3-neon"),("style4_minimal","style-4-minimal")]:
    if len(sys.argv) > 1 and out not in sys.argv[1:]: continue
    try: m = importlib.import_module(mod)
    except ModuleNotFoundError: continue
    open(out + ".html", "w").write(m.HTML); print("wrote", out)
