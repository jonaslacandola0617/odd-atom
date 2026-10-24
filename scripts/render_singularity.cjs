const fs=require('node:fs');
const path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,renderMedia,openBrowser}=require('@remotion/renderer');
const {spawnSync}=require('node:child_process');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const timing=require('../src/data/singularity-narration.json');
const folder=path.join(root,'out/singularity');
const delivery=path.join(root,'assets/videos/singularity');
fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(delivery,{recursive:true});
const exec=args=>{const p=spawnSync('ffmpeg',args,{stdio:'inherit'});if(p.status!==0)throw new Error('FFmpeg failed');};
const assets=require('../src/data/singularity-artwork.json');
const inputs=['src/Singularity.tsx','src/MotionCharacters.tsx','src/IllustratedTitle.tsx','src/Root.tsx','src/data/singularity-narration.json','src/data/crowd-motion-narration.json','src/data/singularity-artwork.json','public/assets/artwork/approved-characters/atlas.png','public/assets/artwork/approved-characters/blinks.png','public/assets/fonts/Outfit.ttf','public/assets/fonts/Nunito.ttf',...assets.map(a=>'public/assets/artwork/singularity/'+a.file)];
const digest=crypto.createHash('sha256');
for(const input of inputs){digest.update(input);digest.update(fs.readFileSync(path.join(root,input)));}
digest.update(JSON.stringify({fps:30,width:1920,height:1080,crf:19,preset:'fast',pixelFormat:'yuv420p',captions:true}));
const pictureKey=digest.digest('hex');
const validPicture=(file,frames)=>{const p=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=nb_frames','-of','json',file],{encoding:'utf8'});if(p.status!==0)return false;try{return Number(JSON.parse(p.stdout).streams[0].nb_frames)===frames;}catch{return false;}};
(async()=>{
 // This explicit maintenance mode is only for already inspected renders known
 // to use the current inputs. Normal rendering writes sidecars after success.
 if(process.argv.includes('--stamp-current-cache')){
  timing.scenes.forEach((s,i)=>{const end=i+1<timing.scenes.length?timing.scenes[i+1].startFrame:timing.durationInFrames,file=path.join(folder,`chapter-${String(i+1).padStart(2,'0')}.mp4`);if(fs.existsSync(file)&&validPicture(file,end-s.startFrame)){fs.writeFileSync(file+'.source.sha256',pictureKey+'\n');console.log('Stamped inspected chapter',i+1);}});
  return;
 }
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const inputProps={captions:true,includeAudio:false};
 const composition=await selectComposition({serveUrl,id:'SingularityFullFilm',inputProps,browserExecutable:'/usr/bin/chromium'});
 if(process.argv.includes('--stills')){
  const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
  try{
   const samples=process.argv.includes('--opening')?[0,45,140,210,295,490,690,850]:[0,140,295,490,850,1300,1740,2180,2730,3120,3650,4100,4600,4950,5480,5700,6050,6590,7100,7480,8100,8590,9060,9440,9860,10160,10680,11110,11530,11870,12140,12530,12810,13220,13720,14350,14740,14980,15280,15450,15700,15980];
   for(const frame of samples){
    await renderStill({serveUrl,composition,inputProps,frame,output:path.join(folder,`review-${frame}.png`),puppeteerInstance:browser,logLevel:'error'});
    console.log('review',frame,'/',composition.durationInFrames);
   }
  }finally{await browser.close({silent:true});}
  return;
 }
 if(process.argv.includes('--sample')){
  let step=-1;
  await renderMedia({serveUrl,composition,inputProps,browserExecutable:'/usr/bin/chromium',codec:'h264',outputLocation:path.join(folder,'opening-visual.mp4'),frameRange:[0,899],concurrency:3,crf:19,pixelFormat:'yuv420p',logLevel:'error',onProgress:p=>{const next=Math.floor(p.renderedFrames/90);if(next!==step){step=next;console.log('opening',p.renderedFrames+'/900');}}});
  return;
 }
 const chapters=timing.scenes.map((s,i)=>({start:s.startFrame,end:i+1<timing.scenes.length?timing.scenes[i+1].startFrame-1:timing.durationInFrames-1}));
 const renderChapter=async i=>{
  const {start,end}=chapters[i],file=path.join(folder,`chapter-${String(i+1).padStart(2,'0')}.mp4`);
  if(fs.existsSync(file)&&fs.existsSync(file+'.source.sha256')&&!process.argv.includes('--force')){
   if(fs.readFileSync(file+'.source.sha256','utf8').trim()===pictureKey&&validPicture(file,end-start+1)){console.log('Reuse completed chapter',i+1);return;}
  }
  let step=-1;const started=Date.now();
  await renderMedia({serveUrl,composition,inputProps,browserExecutable:'/usr/bin/chromium',codec:'h264',outputLocation:file,frameRange:[start,end],concurrency:2,crf:19,pixelFormat:'yuv420p',logLevel:'error',x264Preset:'fast',onProgress:p=>{const next=Math.floor(p.renderedFrames/180);if(next!==step){step=next;const elapsed=(Date.now()-started)/1000;console.log('chapter',i+1,p.renderedFrames+'/'+(end-start+1),'elapsed',elapsed.toFixed(1)+'s');}}});
  fs.writeFileSync(file+'.source.sha256',pictureKey+'\n');
 };
 for(let i=0;i<chapters.length;i+=2)await Promise.all([renderChapter(i),...(i+1<chapters.length?[renderChapter(i+1)]:[])]);
 const list=path.join(folder,'chapters.txt');fs.writeFileSync(list,chapters.map((_,i)=>`file 'chapter-${String(i+1).padStart(2,'0')}.mp4'`).join('\n')+'\n');
 const visual=path.join(folder,'full-visual-master.mp4');
 exec(['-y','-v','error','-f','concat','-safe','0','-i',list,'-c','copy',visual]);
 const output=path.join(delivery,'singularity-full-8m56.mp4');
 const mix=path.join(root,'public/assets/audio/singularity/final-mix.m4a');
 if(!fs.existsSync(mix))throw new Error('Generate the final audio mix before delivery.');
 if(fs.statSync(visual).size+fs.statSync(mix).size<96000000){
  exec(['-y','-v','error','-i',visual,'-i',mix,'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',output]);
 }else{
  // Keep a full 1080p download below GitHub's 100 MiB single-file ceiling.
  // The CRF19 chapter masters remain available for higher bitrate packaging.
  const pass=path.join(folder,'delivery-pass');
  const common=['-y','-v','error','-i',visual,'-c:v','libx264','-preset','medium','-b:v','1190k','-pix_fmt','yuv420p','-passlogfile',pass];
  exec([...common,'-pass','1','-an','-f','null','/dev/null']);
  exec(['-y','-v','error','-i',visual,'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-b:v','1190k','-pix_fmt','yuv420p','-passlogfile',pass,'-pass','2','-c:a','copy','-movflags','+faststart',output]);
 }
 if(fs.statSync(output).size>=100*1024*1024)throw new Error('Delivery exceeds GitHub asset limit');
 const chapterDir=path.join(delivery,'chapters');fs.mkdirSync(chapterDir,{recursive:true});
 for(let i=0;i<chapters.length;i++){
  const {start,end}=chapters[i],file=path.join(folder,`chapter-${String(i+1).padStart(2,'0')}.mp4`);
  const target=path.join(chapterDir,`singularity-part-${String(i+1).padStart(2,'0')}.mp4`);
  exec(['-y','-v','error','-i',file,'-ss',String(start/30),'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String((end-start+1)/30),'-movflags','+faststart',target]);
  if(fs.statSync(target).size>=100*1024*1024)throw new Error('Chapter asset exceeds GitHub file limit: '+target);
 }
 await renderStill({serveUrl,composition,inputProps:{captions:false,includeAudio:false},frame:0,output:path.join(delivery,'singularity-poster.png'),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
 console.log('Saved full film:',output,fs.statSync(output).size,'bytes');
})().catch(error=>{console.error(error);process.exitCode=1;});
