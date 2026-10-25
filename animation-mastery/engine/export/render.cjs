/** Remotion export for the four original research demonstrations. */
const fs=require('node:fs');
const path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const root=path.resolve(__dirname,'../../..');
const specs={
  acting:{id:'MasteryCharacterActing',file:'A-character-acting-4s',frames:120,stills:[0,28,38,71,110]},
  explanation:{id:'MasteryVisualExplanation',file:'B-root-detour-6s',frames:180,stills:[0,51,68,107,150,174]},
  transition:{id:'MasterySceneTransition',file:'C-garden-to-roots-8s',frames:240,stills:[0,24,60,80,96,112,150,225]},
  narrative:{id:'MasteryShortNarrative',file:'D-a-little-light-12s',frames:360,stills:[0,100,138,180,235,300,350]},
};
(async()=>{
  const names=Object.keys(specs).filter(k=>!process.argv.includes('--kind')||process.argv[process.argv.indexOf('--kind')+1]===k);
  if(!names.length)throw new Error('Unknown study kind');
  const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),rootDir:root});
  const review=path.join(root,'out/animation-mastery/stills');fs.mkdirSync(review,{recursive:true});
  const delivery=path.join(root,'assets/videos/animation-mastery/v1');fs.mkdirSync(delivery,{recursive:true});
  for(const kind of names){
    const spec=specs[kind],props={kind,includeAudio:!process.argv.includes('--stills')};
    const composition=await selectComposition({serveUrl,id:spec.id,inputProps:props,browserExecutable:'/usr/bin/chromium'});
    if(composition.durationInFrames!==spec.frames)throw new Error('Wrong test duration');
    if(process.argv.includes('--stills')){
      for(const frame of spec.stills){
        await renderStill({serveUrl,composition,inputProps:props,frame,output:path.join(review,`${kind}-${frame}.png`),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
        console.log(kind,'still',frame);
      }
    }else{
      let mark=-1;
      await renderMedia({serveUrl,composition,inputProps:props,codec:'h264',outputLocation:path.join(delivery,spec.file+'.mp4'),browserExecutable:'/usr/bin/chromium',concurrency:2,crf:16,pixelFormat:'yuv420p',audioBitrate:'192k',logLevel:'error',onProgress:({renderedFrames})=>{const next=Math.floor(renderedFrames/30);if(next!==mark){mark=next;console.log(kind,renderedFrames+'/'+spec.frames);}}});
      await renderStill({serveUrl,composition,inputProps:props,frame:spec.stills[Math.floor(spec.stills.length/2)],output:path.join(delivery,spec.file+'-poster.png'),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
      console.log('Saved',spec.file);
    }
  }
})().catch(error=>{console.error(error);process.exit(1)});
