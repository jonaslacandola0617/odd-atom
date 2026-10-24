import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {IllustratedTitle} from './IllustratedTitle';
import narration from './data/crowd-narration.json';

const path='assets/artwork/approved-characters/';
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const at=(f:number,a:number,b:number)=>ease((f-a)/(b-a));
const pulse=(f:number,a:number,b:number,c:number,d:number)=>at(f,a,b)*(1-at(f,c,d));
const inBlink=(frame:number,starts:number[])=>starts.some(start=>frame>=start&&frame<start+5);

/** Original generated illustration cells, composited without replacing the
 * approved drawings with the earlier vector characters. Coordinates are native
 * atlas pixels. Nested SVG viewports isolate each part without resampling it. */
const Part: React.FC<{col:number;row:number;x:number;y:number;scale?:number;blink?:boolean}>=({col,row,x,y,scale=1,blink=false})=><svg
  x={x} y={y} width={384*scale} height={512*scale}
  viewBox={`${col*384} ${row*512} 384 512`} overflow="hidden">
  <image href={staticFile(path+(blink?'blinks.png':'atlas.png'))} width="1536" height="1024"/>
</svg>;

export const ApprovedMira: React.FC<{frame:number;id:string;happy?:boolean;attention?:number;cup?:number}>=({frame,id,happy=false,attention=0,cup=0})=>{
  const blink=inBlink(frame,[74,173,267,334,520]);
  const col=happy?1:2;
  return <g transform={`translate(0 ${-Math.sin(frame/49)*1.2}) scale(1 ${1+Math.sin(frame/49)*.002})`}>
    <Part col={0} row={0} x={-213} y={-507}/>
    <g transform={`rotate(${-cup*11+Math.sin(frame/67)*.45} -70 -405)`}>
      <Part col={3} row={0} x={-145.9} y={-531.5} scale={.55} blink/>
      <path d={`M20-396Q${12+Math.sin(frame/18)*5}-411 23-423`} stroke="#EAD5C9" opacity=".4" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
    </g>
    <g transform={`rotate(${7-attention*10+Math.sin(frame/63)*.45} 0 -430)`}>
      <Part col={col} row={0} x={-125.28} y={-655.96} scale={.58}/>
      {blink&&<g clipPath={`url(#${id}-eyes)`}>
        <Part col={col} row={0} x={-125.28} y={-655.96} scale={.58} blink/>
      </g>}
      <defs><clipPath id={`${id}-eyes`}>
        <ellipse cx="-3" cy="-485" rx="13" ry="15"/>
        <ellipse cx="34" cy="-499" rx="13" ry="15"/>
      </clipPath></defs>
    </g>
  </g>;
};

export const ApprovedSol: React.FC<{frame:number;id:string;gesture?:number;nod?:number}>=({frame,id,gesture=0,nod=0})=>{
  const blink=inBlink(frame,[255,390,560]);
  return <g transform={`translate(0 ${Math.sin(frame/53)*1.1}) scale(1 ${1+Math.sin(frame/53)*.002})`}>
    <Part col={0} row={1} x={-215} y={-476}/>
    <g transform={`rotate(${gesture*25+Math.sin(frame/71)*.5} -70 -422)`}>
      <Part col={3} row={1} x={-219} y={-508.5} scale={.5}/>
    </g>
    <g transform={`rotate(${nod+Math.sin(frame/31)*1.05} 0 -441)`}>
      <Part col={1} row={1} x={-119.78} y={-646.64} scale={.53}/>
      {blink&&<g clipPath={`url(#${id}-eyes)`}>
        <Part col={2} row={1} x={-119.78} y={-646.64} scale={.53}/>
      </g>}
      <defs><clipPath id={`${id}-eyes`}>
        <ellipse cx="-53" cy="-518" rx="13" ry="12"/>
        <ellipse cx="-20" cy="-510" rx="13" ry="12"/>
      </clipPath></defs>
    </g>
  </g>;
};

const Backdrop:React.FC<{name:'plaza'|'terrace'}>=({name})=><image
  href={staticFile(path+name+'.png')} x="-45" y="-26" width="2010" height="1132" preserveAspectRatio="xMidYMid slice"/>;

export const ApprovedCharacterScene:React.FC<{frame:number}>=({frame:f})=>{
  const cafeFrame=Math.ceil(narration.beats.notice*30), closeFrame=Math.ceil(narration.beats.seen*30);
  const gesture=pulse(f,238,275,298,325)+.65*pulse(f,338,363,381,405);
  const reply=.65*pulse(f,328,355,377,405)+.85*pulse(f,466,502,544,590);
  const attention=at(f,237,310);
  const happy=f>=336;
  if(f<cafeFrame){
    const push=at(f,95,218);
    return <>
      <g transform={`translate(960 540) scale(${1+push*.075}) translate(-960 -540)`}>
        <Backdrop name="plaza"/>
        <g filter="url(#approved-crowd-far)">
          <g transform="translate(285 905) scale(.71)"><ApprovedSol frame={f+14} id="crowd-far-a" gesture={.1}/></g>
          <g transform="translate(615 920) scale(.67)"><ApprovedMira frame={f+38} id="crowd-far-b" happy attention={.4}/></g>
          <g transform="translate(1740 946) scale(-.77 .77)"><ApprovedSol frame={f+76} id="crowd-far-c" gesture={.3}/></g>
        </g>
        <ellipse cx="1260" cy="970" rx="136" ry="22" fill="#211343" opacity=".46"/>
        <g transform="translate(1260 963) scale(1.15)"><ApprovedMira frame={f} id="mira-street"/></g>
        <g filter="url(#approved-crowd-near)">
          <g transform={`translate(${520-f*4.8} ${1540+Math.sin(f/9)*3}) scale(-1.9 1.9)`}><ApprovedSol frame={f+40} id="crowd-near-a"/></g>
          <g transform={`translate(${2220-f*1.8} ${1515+Math.sin(f/10)*3}) scale(1.9)`}><ApprovedMira frame={f+80} id="crowd-near-b" happy/></g>
        </g>
      </g>
      <g opacity={1-at(f,83,106)}><IllustratedTitle centerX={512} centerY={340} strokeScale={.64} tilt={-3} lines={[
        {text:'Alone',size:132,baseline:300},{text:'in a crowd',size:106,baseline:427},
      ]}/></g>
    </>;
  }
  if(f<closeFrame){
    const push=at(f,cafeFrame,closeFrame)*.025;
    return <g transform={`translate(1100 590) scale(${1+push}) translate(-1100 -590)`}>
      <Backdrop name="terrace"/>
      <g transform="translate(780 1230) scale(1.62)"><ApprovedMira frame={f} id="mira-terrace" happy={happy} attention={attention} cup={reply}/></g>
      <g transform="translate(1400 1240) scale(1.75)"><ApprovedSol frame={f} id="sol-terrace" gesture={gesture} nod={-.6}/></g>
    </g>;
  }
  const push=at(f,closeFrame,599)*.025;
  return <g transform={`translate(820 450) scale(${1+push}) translate(-820 -450)`}>
    <g transform="translate(-120 -40) scale(1.1)"><Backdrop name="terrace"/></g>
    <g transform="translate(820 1490) scale(2.25)"><ApprovedMira frame={f} id="mira-reaction" happy attention={1} cup={reply}/></g>
    <g transform="translate(2180 1700) scale(2.8)"><ApprovedSol frame={f} id="sol-reaction" gesture={.12+reply*.12}/></g>
  </g>;
};

export const ApprovedCharactersTest:React.FC=()=>{
  const frame=useCurrentFrame(), time=frame/30;
  const [assets]=useState(()=>delayRender('Load approved artwork and local fonts'));
  useEffect(()=>{
    const images=['atlas.png','blinks.png','plaza.png','terrace.png'].map(file=>new Promise<void>((resolve,reject)=>{
      const im=new window.Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error(`Failed to load ${file}`));im.src=staticFile(path+file);
    }));
    const fonts=[
      new FontFace('Outfit',`url(${staticFile('assets/fonts/Outfit.ttf')})`,{weight:'100 900'}).load(),
      new FontFace('Nunito',`url(${staticFile('assets/fonts/Nunito.ttf')})`,{weight:'200 1000'}).load(),
    ].map(p=>p.then(font=>{document.fonts.add(font);}));
    Promise.all([...images,...fonts]).then(()=>continueRender(assets)).catch(cancelRender);
  },[assets]);
  if(narration.provider!=='elevenlabs'||narration.status!=='generated'||!narration.audioFile)throw new Error('The approved-character test requires the saved generated ElevenLabs narration.');
  const caption=narration.captions.find(c=>time>=c.start&&time<c.end);
  return <AbsoluteFill style={{background:'#271344',fontFamily:'Outfit, sans-serif'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <filter id="approved-crowd-far" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .23 0 0 0 0 .13 0 0 0 0 .37 0 0 0 1 0"/></filter>
        <filter id="approved-crowd-near" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .10 0 0 0 0 .05 0 0 0 0 .23 0 0 0 1 0"/></filter>
      </defs>
      <ApprovedCharacterScene frame={frame}/>
      {caption&&<text x="960" y="1027" textAnchor="middle" fontSize="39" fontWeight="500" fill="#FFFDF5" stroke="#211338" strokeWidth="3.4" paintOrder="stroke" strokeLinejoin="round">{caption.text}</text>}
    </svg>
    <Audio src={staticFile('assets/audio/crowd/music.wav')}/>
    <Audio src={staticFile('assets/audio/crowd/sfx.wav')}/>
    <Audio src={staticFile(narration.audioFile)}/>
  </AbsoluteFill>;
};
