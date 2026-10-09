import puppeteer from "puppeteer-core";
const d="/workspace/apps/german-cards/design/ux-v3/";
const b=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--allow-file-access-from-files"]});
for(const n of ["home","card"]){const p=await b.newPage();await p.setViewport({width:1420,height:1000,deviceScaleFactor:2});await p.goto("file://"+d+n+".html");await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:d+"v3-"+n+"-ABC.png",fullPage:true});}
await b.close();
