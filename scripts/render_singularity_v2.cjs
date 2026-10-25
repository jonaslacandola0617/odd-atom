const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,renderMedia,openBrowser}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..');
const T=require('../src/data/singularity-narration.json');
const temp=path.join(root,'out/singularity-v2');
const dest=path.join(root,'assets/videos/singularity-v2');
fs.mkdirSync(temp,{recursive:true});fs.mkdirSync(dest,{recursive:true});
const run=args=>{const p=spawnSync('ffmpeg',args,{stdio:'inherit'});if(p.status!==0)throw new Error('ffmpeg failed');};
const hash=crypto.createHash('sha256');
for(const file of ['src/SingularityRebuild.tsx','src/MotionCharacters.tsx','src/Root.tsx','src/data/singularity-narration.json','src/data/crowd-motion-narration.json'])hash.update(fs.readFileSync(path.join(root,file)));
hash.update('1080p30-crf18-fast-captionless-v1');
const key=hash.digest('hex');
const inputProps={includeAudio:false,captions:false};
const stills=[0,140,220,300,550,680,900,1310,1720,2300,2790,3210,3680,4190,4520,4930,5520,5740,6060,6310,6730,7130,7570,7840,8170,8450,8760,9130,9570,9860,10360,10740,10950,11160,11500,11870,12300,12560,12850,13200,13820,14450,14760,14980,15220,15520,15800,16050];
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const composition=await selectComposition({serveUrl,id:'SingularityRebuildFull',inputProps,browserExecutable:'/usr/bin/chromium'});
 if(process.argv.includes('--stills')){
  const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
  const named=process.argv.find(a=>a.startsWith('--frames='));
  try{for(const frame of named?named.split('=')[1].split(',').map(Number):stills){
   await renderStill({serveUrl,composition,inputProps,frame,output:path.join(temp,`still-${frame}.png`),puppeteerInstance:browser,logLevel:'error'});
   console.log('still',frame);
  }}finally{await browser.close({silent:true});}return;
 }
 if(process.argv.includes('--sample')){
  const range=(process.argv.find(a=>a.startsWith('--range='))||'--range=0,899').split('=')[1].split(',').map(Number);
  await renderMedia({serveUrl,composition,inputProps,frameRange:range,outputLocation:path.join(temp,`sample-${range[0]}-${range[1]}.mp4`),codec:'h264',crf:18,x264Preset:'fast',pixelFormat:'yuv420p',concurrency:3,browserExecutable:'/usr/bin/chromium',logLevel:'error'});return;
 }
 const chapters=T.scenes.map((s,i)=>({start:s.startFrame,end:(T.scenes[i+1]?.startFrame||T.durationInFrames)-1}));
 // A single browser renderer with four workers avoids oversubscribing this host.
 for(let i=0;i<chapters.length;i++){
  const {start,end}=chapters[i],output=path.join(temp,`part-${i+1}.mp4`),stamp=output+'.sha256';
  if(fs.existsSync(output)&&fs.existsSync(stamp)&&fs.readFileSync(stamp,'utf8').trim()===key){console.log('Reuse complete part',i+1);continue;}
  let last=-1;const began=Date.now();
  await renderMedia({serveUrl,composition,inputProps,frameRange:[start,end],outputLocation:output,codec:'h264',crf:18,x264Preset:'fast',pixelFormat:'yuv420p',concurrency:4,browserExecutable:'/usr/bin/chromium',logLevel:'error',onProgress:({renderedFrames})=>{const tick=Math.floor(renderedFrames/180);if(tick!==last){last=tick;console.log(`part ${i+1}/5: ${renderedFrames}/${end-start+1}, ${((Date.now()-began)/1000).toFixed(0)}s`);}}});
  fs.writeFileSync(stamp,key+'\n');
 }
 const list=path.join(temp,'parts.txt');fs.writeFileSync(list,chapters.map((_,i)=>`file 'part-${i+1}.mp4'`).join('\n')+'\n');
 const picture=path.join(temp,'picture.mp4');run(['-y','-v','error','-f','concat','-safe','0','-i',list,'-c','copy',picture]);
 const mix=path.join(root,'public/assets/audio/singularity-v2/final-mix.m4a');
 if(!fs.existsSync(mix))throw new Error('Missing committed new mix');
 const movie=path.join(dest,'singularity-rebuilt-8m56.mp4');
 if(fs.statSync(picture).size+fs.statSync(mix).size<99000000){
  run(['-y','-v','error','-i',picture,'-i',mix,'-map','0:v:0','-map','1:a:0','-c','copy','-t',String(T.durationInFrames/30),'-movflags','+faststart',movie]);
 }else{
  // Two-pass delivery keeps the complete 1080p film inside GitHub's file limit.
  // Higher bitrate chapter downloads below preserve the CRF18 picture masters.
  const pass=path.join(temp,'delivery-pass');
  run(['-y','-v','error','-i',picture,'-c:v','libx264','-preset','medium','-b:v','1190k','-pix_fmt','yuv420p','-passlogfile',pass,'-pass','1','-an','-f','null','/dev/null']);
  run(['-y','-v','error','-i',picture,'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-b:v','1190k','-pix_fmt','yuv420p','-passlogfile',pass,'-pass','2','-c:a','copy','-t',String(T.durationInFrames/30),'-movflags','+faststart',movie]);
 }
 fs.mkdirSync(path.join(dest,'chapters'),{recursive:true});
 for(let i=0;i<chapters.length;i++){
  const {start,end}=chapters[i],out=path.join(dest,'chapters',`singularity-rebuilt-part-${i+1}.mp4`);
  run(['-y','-v','error','-i',path.join(temp,`part-${i+1}.mp4`),'-ss',String(start/30),'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String((end-start+1)/30),'-movflags','+faststart',out]);
  if(fs.statSync(out).size>=100*1024*1024)throw new Error('Chapter exceeds GitHub limit');
 }
 if(fs.statSync(movie).size>=100*1024*1024)throw new Error('Full movie exceeds GitHub limit');
 await renderStill({serveUrl,composition,inputProps,frame:14980,output:path.join(dest,'singularity-rebuilt-poster.png'),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
 fs.copyFileSync(path.join(root,'assets/audio/singularity/singularity-captions-draft.srt'),path.join(dest,'singularity-subtitles.srt'));
 console.log('Saved full remake:',movie,fs.statSync(movie).size,'bytes');
})().catch(e=>{console.error(e);process.exitCode=1;});
