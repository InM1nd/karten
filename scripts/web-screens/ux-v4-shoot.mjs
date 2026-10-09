import puppeteer from "puppeteer-core";
const d="/workspace/apps/german-cards/design/ux-v4/";
const b=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--allow-file-access-from-files"]});
for(const n of ["today","card","tabbar"]){const p=await b.newPage();await p.setViewport({width:600,height:600,deviceScaleFactor:2});await p.goto("file://"+d+n+".html");await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:d+"v4-"+n+".png",fullPage:true});}
await b.close();
