const fs=require('node:fs');
const path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..');
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const composition=await selectComposition({serveUrl,id:'MedicineLayeredEnvironment',browserExecutable:'/usr/bin/chromium'});
 const common={serveUrl,composition,browserExecutable:'/usr/bin/chromium',logLevel:'error'};
 fs.mkdirSync(path.join(root,'out/medicine-layers'),{recursive:true});
 for(const frame of [0,90,180,239]){
  await renderStill({...common,frame,output:path.join(root,`out/medicine-layers/frame-${frame}.png`)});
  console.log('Review frame:',frame);
 }
 if(process.argv.includes('--stills'))return;
 let bucket=-1;
 await renderMedia({...common,codec:'h264',outputLocation:path.join(root,'assets/videos/medicine-layered-environment-8s.mp4'),concurrency:3,crf:17,pixelFormat:'yuv420p',audioCodec:'aac',onProgress:({renderedFrames})=>{const next=Math.floor(renderedFrames/30);if(next!==bucket){bucket=next;console.log('Layered environment:',renderedFrames+'/240');}}});
 fs.copyFileSync(path.join(root,'out/medicine-layers/frame-90.png'),path.join(root,'assets/videos/medicine-layered-environment-8s-poster.png'));
})().catch(error=>{console.error(error);process.exitCode=1;});
