const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderMedia,renderStill,openBrowser}=require('@remotion/renderer');
const root=path.resolve(__dirname,'..'),T=require('../src/data/singularity-narration.json');
const temp=path.join(root,'out/singularity-v3'),dest=path.join(root,'assets/videos/singularity-v3');
const first=T.visualBeats[50].startFrame,total=T.durationInFrames+360;
for(const d of [temp,dest])fs.mkdirSync(d,{recursive:true});
const ff=args=>{const p=spawnSync('ffmpeg',args,{stdio:'inherit'});if(p.status!==0)throw new Error('ffmpeg failed');};
const check=(file,frames)=>{
 const p=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=time_base,nb_frames,duration,avg_frame_rate','-of','json',file],{encoding:'utf8'});
 if(p.status!==0)throw new Error('Cannot inspect picture '+file);
 const v=JSON.parse(p.stdout).streams[0];
 if(Number(v.nb_frames)!==frames||v.time_base!=='1/90000'||v.avg_frame_rate!=='30/1'||Math.abs(Number(v.duration)-frames/30)>.002)throw new Error('Invalid picture timebase/frame duration: '+file+' '+JSON.stringify(v));
};
const props={includeAudio:false};
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
 const composition=await selectComposition({serveUrl,id:'SingularitySoundEnding',inputProps:props,browserExecutable:'/usr/bin/chromium'});
 if(process.argv.includes('--stills')){
  const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
  try{for(const frame of [15620,15650,15780,15930,16040,16098,16180,16270,16340,16420,16458]){
   await renderStill({serveUrl,composition,inputProps:props,frame,output:path.join(temp,`ending-${frame}.png`),puppeteerInstance:browser,logLevel:'error'});console.log('Ending still',frame);
  }}finally{await browser.close({silent:true});}return;
 }
 const tail=path.join(temp,'ending-picture.mp4');let tick=-1;
 if(process.argv.includes('--reuse-ending')){check(tail,total-first);console.log('Reuse already inspected ending picture');}
 else await renderMedia({serveUrl,composition,inputProps:props,frameRange:[first,total-1],codec:'h264',crf:18,x264Preset:'fast',pixelFormat:'yuv420p',outputLocation:tail,concurrency:4,browserExecutable:'/usr/bin/chromium',logLevel:'error',onProgress:({renderedFrames})=>{const n=Math.floor(renderedFrames/90);if(n!==tick){tick=n;console.log('Ending rendered',renderedFrames+'/'+(total-first));}}});
 check(tail,total-first);
 // Reuse the committed high-bitrate v2 picture. Only its final section is
 // replaced; no costly re-render or redesign of the rest of the film occurs.
 const old=path.join(root,'assets/videos/singularity-v2/chapters');
 const parts=[];
 for(let i=1;i<=4;i++){
  const out=path.join(temp,`part-${i}-picture.mp4`);
  ff(['-y','-v','error','-i',path.join(old,`singularity-rebuilt-part-${i}.mp4`),'-map','0:v:0','-an','-c:v','copy','-video_track_timescale','90000',out]);check(out,T.scenes[i].startFrame-T.scenes[i-1].startFrame);parts.push(out);
 }
 const prefixFrames=first-T.scenes[4].startFrame;
 const head=path.join(temp,'part-5-prefix.mp4');
 ff(['-y','-v','error','-i',path.join(old,'singularity-rebuilt-part-5.mp4'),'-map','0:v:0','-frames:v',String(prefixFrames),'-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuvj420p','-color_range','pc','-video_track_timescale','90000',head]);
 check(head,prefixFrames);
 const tailList=path.join(temp,'last-part.txt');fs.writeFileSync(tailList,`file '${path.basename(head)}'\nfile '${path.basename(tail)}'\n`);
 const last=path.join(temp,'part-5-picture.mp4');
 ff(['-y','-v','error','-f','concat','-safe','0','-i',tailList,'-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuvj420p','-color_range','pc','-video_track_timescale','90000',last]);check(last,total-T.scenes[4].startFrame);parts.push(last);
 const list=path.join(temp,'all-parts.txt');fs.writeFileSync(list,parts.map(p=>`file '${path.basename(p)}'`).join('\n')+'\n');
 const picture=path.join(temp,'full-picture.mp4');ff(['-y','-v','error','-f','concat','-safe','0','-i',list,'-an','-c:v','copy','-video_track_timescale','90000',picture]);check(picture,total);
 const mix=path.join(root,'public/assets/audio/singularity-v3/final-mix.m4a');
 if(!fs.existsSync(mix))throw new Error('Build new mix before delivery');
 const movie=path.join(dest,'singularity-sound-ending.mp4'),pass=path.join(temp,'full-pass');
 if(fs.statSync(picture).size+fs.statSync(mix).size<99000000){ff(['-y','-v','error','-i',picture,'-i',mix,'-map','0:v:0','-map','1:a:0','-c','copy','-t',String(total/30),'-movflags','+faststart',movie]);}
 else{
  console.log('Encoding full download, pass 1/2');
  ff(['-y','-v','error','-i',picture,'-c:v','libx264','-b:v','1190k','-preset','medium','-pix_fmt','yuv420p','-passlogfile',pass,'-pass','1','-an','-f','null','/dev/null']);
  console.log('Encoding full download, pass 2/2');
  ff(['-y','-v','error','-i',picture,'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-b:v','1190k','-preset','medium','-pix_fmt','yuv420p','-passlogfile',pass,'-pass','2','-c:a','copy','-t',String(total/30),'-movflags','+faststart',movie]);
 }
 if(fs.statSync(movie).size>=100*1024*1024)throw new Error('Full delivery exceeds GitHub limit');
 fs.mkdirSync(path.join(dest,'chapters'),{recursive:true});
 for(let i=0;i<5;i++){
  const from=T.scenes[i].startFrame,to=i<4?T.scenes[i+1].startFrame:total;
  const target=path.join(dest,'chapters',`singularity-sound-ending-part-${i+1}.mp4`);
  ff(['-y','-v','error','-i',parts[i],'-ss',String(from/30),'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String((to-from)/30),'-movflags','+faststart',target]);
  if(fs.statSync(target).size>=100*1024*1024)throw new Error('Chapter exceeds GitHub limit');
 }
 ff(['-y','-v','error','-ss','506','-i',movie,'-c:v','libx264','-crf','19','-preset','fast','-c:a','aac','-b:a','192k','-movflags','+faststart',path.join(dest,'ending-preview.mp4')]);
 await renderStill({serveUrl,composition,inputProps:props,frame:16270,output:path.join(dest,'ending-poster.png'),browserExecutable:'/usr/bin/chromium',logLevel:'error'});
 fs.copyFileSync(path.join(root,'assets/videos/singularity-v2/singularity-subtitles.srt'),path.join(dest,'singularity-subtitles.srt'));
 console.log('Saved',movie,fs.statSync(movie).size,'bytes;',total,'frames');
})().catch(e=>{console.error(e);process.exitCode=1;});
