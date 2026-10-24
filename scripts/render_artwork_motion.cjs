const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const {bundle}=require('@remotion/bundler');const {selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..');
const topics=process.argv.includes('medicine')?['medicine']:process.argv.includes('cyber')?['cyber']:['medicine','cyber'];
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 fs.mkdirSync(path.join(root,'out/artwork-motion'),{recursive:true});fs.mkdirSync(path.join(root,'assets/videos'),{recursive:true});
 for(const topic of topics){
  const id=topic==='medicine'?'MedicineArtworkMotion':'CyberArtworkMotion';
  const composition=await selectComposition({serveUrl,id,browserExecutable:'/usr/bin/chromium'});
  if(process.argv.includes('--stills')){
   for(const frame of (process.argv.includes('--one')?[70]:[0,70,170,240,430,590])){
    await renderStill({serveUrl,composition,frame,output:path.join(root,`out/artwork-motion/${topic}-${frame}.png`),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
    console.log(topic,'review frame',frame);
   }
   continue;
  }
  const temp=path.join(root,`out/artwork-motion/${topic}.render.mp4`),candidate=path.join(root,`out/artwork-motion/${topic}.delivery.mp4`);
  let step=-1;
  await renderMedia({serveUrl,composition,codec:'h264',outputLocation:temp,browserExecutable:'/usr/bin/chromium',concurrency:3,crf:16,pixelFormat:'yuv420p',logLevel:'error',onProgress:({renderedFrames})=>{const next=Math.floor(renderedFrames/60);if(next!==step){step=next;console.log(topic,Math.min(600,renderedFrames)+'/600');}}});
  const p=spawnSync('ffmpeg',['-y','-v','error','-i',temp,'-i',path.join(root,`public/assets/audio/artwork-motion/${topic}.wav`),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-t','20','-movflags','+faststart',candidate],{stdio:'inherit'});
  if(p.status!==0)throw new Error('Final sound assembly failed');
  fs.renameSync(candidate,path.join(root,`assets/videos/${topic}-artwork-motion-20s.mp4`));console.log('Saved',topic,'20-second artwork animation.');
 }
})().catch(error=>{console.error(error);process.exit(1)});
