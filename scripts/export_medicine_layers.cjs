const fs=require('node:fs');
const path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,openBrowser}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..');
const masks=require('../src/data/medicine-png-layer-masks.json');
const layers=['window-view','window-clouds','hanging-vine','window-plant',...Object.keys(masks),'immune-cell','microbe-upper','microbe-lower','red-cell-a','red-cell-b','red-cell-c'];
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
 try{
  for(const layer of layers){
   const inputProps={layer};
   const composition=await selectComposition({serveUrl,id:'MedicineLayerExport',inputProps,puppeteerInstance:browser});
   await renderStill({serveUrl,composition,inputProps,output:path.join(root,'public/assets/artwork/medicine-layers-v1',layer+'.png'),imageFormat:'png',puppeteerInstance:browser,logLevel:'error'});
   console.log('RGBA layer:',layer);
  }
 }finally{await browser.close({silent:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
