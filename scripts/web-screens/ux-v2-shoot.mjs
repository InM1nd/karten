import puppeteer from "puppeteer-core";
const b=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--allow-file-access-from-files"]});
for(const n of ["01-home","02-session","03-practice","04-setup-sheet"]){const p=await b.newPage();await p.setViewport({width:1000,height:1100,deviceScaleFactor:2});await p.goto("file://"+"/workspace/apps/german-cards/design/ux-v2"+"/"+n+".html");await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:"/workspace/apps/german-cards/design/ux-v2/"+n+".png",fullPage:true});}
await b.close();
