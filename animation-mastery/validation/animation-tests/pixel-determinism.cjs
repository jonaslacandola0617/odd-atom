/** Render a peak pose before and after a different frame; compare decoded pixels. */
const path=require('node:path');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill}=require('@remotion/renderer');
const root=path.resolve(__dirname,'../../..');
(async()=>{
  const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),rootDir:root});
  const inputProps={kind:'acting',includeAudio:false};
  const composition=await selectComposition({serveUrl,id:'MasteryCharacterActing',inputProps,browserExecutable:'/usr/bin/chromium'});
  const dir=path.join(root,'out/animation-mastery/determinism');fs.mkdirSync(dir,{recursive:true});
  const hashes=[];
  for(const [i,frame] of [38,7,38].entries()){
    const output=path.join(dir,`${i}-${frame}.png`);
    await renderStill({serveUrl,composition,inputProps,frame,output,browserExecutable:'/usr/bin/chromium',logLevel:'error'});
    const pixels=execFileSync('ffmpeg',['-v','error','-i',output,'-f','rawvideo','-pix_fmt','rgba','-'],{maxBuffer:1920*1080*4+1024});
    hashes.push({frame,rgba_sha256:crypto.createHash('sha256').update(pixels).digest('hex')});
  }
  if(hashes[0].rgba_sha256!==hashes[2].rgba_sha256)throw new Error('Frame-order-dependent rendered pixels');
  const report={status:'passed',renderer:'Chromium / Remotion / 1920x1080 / same runtime',samples:hashes,scope:'One actual peak pose repeated after another frame. Pure pose/property tests cover other frames; this is not cross-platform bit identity.'};
  fs.writeFileSync(path.join(root,'animation-mastery/validation/quality-audits/pixel-determinism.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Actual peak-pose decoded pixels are identical across repeated renders.');
})().catch(e=>{console.error(e);process.exit(1)});
