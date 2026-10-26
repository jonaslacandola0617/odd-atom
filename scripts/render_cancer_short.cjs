const fs=require('node:fs'),path=require('node:path');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,renderMedia,openBrowser}=require('@remotion/renderer');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),rootDir:root});
 const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium'});
 const includeAudio=!process.argv.includes('--stills'),inputProps={includeAudio,captions:true};
 try{
  const composition=await selectComposition({serveUrl,id:'CancerShort76',inputProps,puppeteerInstance:browser});
  const out=path.join(root,'out/cancer-short/stills');fs.mkdirSync(out,{recursive:true});
  if(process.argv.includes('--stills')){
   const idx=process.argv.indexOf('--frames');
   const frames=idx>=0?process.argv[idx+1].split(',').map(Number):[0,70,220,390,470,620,690,800,1020,1120,1250,1355,1460,1600,1750,1830,1930,2140,2235];
   for(const frame of frames){await renderStill({serveUrl,composition,inputProps,frame,output:path.join(out,`frame-${String(frame).padStart(4,'0')}.png`),puppeteerInstance:browser,logLevel:'error'});console.log('Still',frame,'/',(frame/30).toFixed(2)+'s')}
  }else{
   let mark=-1;
   const intermediate=path.join(root,'out/cancer-short/render-full-range.mp4');
   const repair=process.argv.includes('--repair-division');
   if(repair&&!fs.existsSync(intermediate))throw new Error('Partial repair requires the local full-range master; use the default full render otherwise.');
   if(repair&&createHash('sha256').update(fs.readFileSync(intermediate)).digest('hex')!=='ae8738540b8d36c72bbd928601bedf8e3ea86411b76c2fd0c954d0b31b0262d6')throw new Error('Repair base differs from the inspected original master. Use a full render.');
   const repairClip=path.join(root,'out/cancer-short/division-repair.mp4');
   await renderMedia({serveUrl,composition,inputProps,codec:'h264',pixelFormat:'yuv420p',crf:18,audioBitrate:'192k',outputLocation:repair?repairClip:intermediate,...(repair?{frameRange:[532,822],muted:true}:{}),puppeteerInstance:browser,concurrency:2,logLevel:'error',onProgress:({renderedFrames})=>{const next=Math.floor(renderedFrames/150);if(next!==mark){mark=next;console.log('Rendered',renderedFrames,repair?'/291 repair frames':'/2280')}}});
   // Chromium JPEG frames arrive as full-range BT.601. Convert values as well
   // as metadata for a conventional limited-range BT.709 social-video master.
   const normalize='scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p';
   const inputs=repair?['-i',intermediate,'-i',repairClip,'-filter_complex',`[0:v]trim=start_frame=0:end_frame=532,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[0:v]trim=start_frame=823:end_frame=2280,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,${normalize}[v]`,'-map','[v]','-map','0:a']:['-i',intermediate,'-vf',normalize];
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-c:v','libx264','-preset','medium','-crf','18','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-c:a','copy','-movflags','+faststart',path.join(root,'assets/videos/cancer-short-v1/cancer-76s.mp4')],{stdio:'inherit'});
   await renderStill({serveUrl,composition,inputProps:{includeAudio:false,captions:false},frame:1750,output:path.join(root,'assets/videos/cancer-short-v1/cancer-76s-poster.png'),puppeteerInstance:browser,logLevel:'error'});
   console.log('Saved final76-second portrait MP4 and poster.');
  }
 }finally{await browser.close({silent:true})}
})().catch(e=>{console.error(e);process.exit(1)});
