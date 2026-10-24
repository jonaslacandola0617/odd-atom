const fs=require('node:fs');const path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,openBrowser}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..');
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
 try{
  for(const sheet of ['galaxies-atlas','stellar-atlas','nuclei-atlas','props-atlas','field-ribbons']){
   for(let cell=0;cell<(sheet==='field-ribbons'?4:6);cell++){
    const inputProps={sheet,cell};const composition=await selectComposition({serveUrl,id:'SingularitySpriteExport',inputProps,puppeteerInstance:browser});
    await renderStill({serveUrl,composition,inputProps,output:path.join(root,`public/assets/artwork/singularity/${sheet}-${cell}.png`),imageFormat:'png',puppeteerInstance:browser,logLevel:'error'});
    console.log('sprite',sheet,cell);
   }
  }
 }finally{await browser.close({silent:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
