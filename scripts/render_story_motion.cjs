const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..');
const temp=path.join(root,'out/story-motion');
const output=path.join(root,'assets/videos/story-motion');
(async()=>{
 fs.mkdirSync(temp,{recursive:true});fs.mkdirSync(output,{recursive:true});
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const composition=await selectComposition({serveUrl,id:'StoryMotionSixScenes',browserExecutable:'/usr/bin/chromium',inputProps:{includeAudio:false}});
 if(process.argv.includes('--stills')){
  for(const frame of [25,82,91,120,141,145,155,185,198,213,229,255,278,303,345,377,395,415,450,515,548,580,599]){
   await renderStill({serveUrl,composition,frame,inputProps:{includeAudio:false},output:path.join(temp,`frame-${frame}.png`),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
   console.log('review frame',frame);
  }
  return;
 }
 let last=-1;
 const picture=path.join(temp,'picture.mp4'),candidate=path.join(temp,'voiced.mp4');
 await renderMedia({serveUrl,composition,inputProps:{includeAudio:false},codec:'h264',outputLocation:picture,browserExecutable:'/usr/bin/chromium',concurrency:3,crf:17,pixelFormat:'yuv420p',x264Preset:'medium',logLevel:'error',onProgress:({renderedFrames})=>{
  const progress=Math.floor(renderedFrames/60);if(progress!==last){last=progress;console.log('Rendered',renderedFrames+'/600');}
 }});
 const mux=spawnSync('ffmpeg',['-y','-v','error','-i',picture,'-i',path.join(root,'public/assets/audio/story-motion/soundtrack.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t','20','-movflags','+faststart',candidate],{stdio:'inherit'});
 if(mux.status!==0)throw new Error('Transition-test sound assembly failed');
 fs.renameSync(candidate,path.join(output,'storytelling-motion-20s.mp4'));
 await renderStill({serveUrl,composition,inputProps:{includeAudio:false},frame:345,output:path.join(output,'storytelling-motion-poster.png'),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
 console.log('Saved six-scene, 20-second story/motion rebuild.');
})().catch(error=>{console.error(error);process.exit(1)});
