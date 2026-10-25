import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {SingularityRebuild} from './SingularityRebuild';
import timing from './data/singularity-narration.json';

export const endingStartFrame=timing.visualBeats[50].startFrame;
export const soundEndingDuration=timing.durationInFrames+360;
const smooth=(x:number)=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
const at=(x:number,a:number,b:number)=>smooth((x-a)/(b-a));
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
const C={ink:'#151630',page:'#28354E',edge:'#EFD9AC',gold:'#FFCE74',teal:'#76D8C8',lilac:'#B4A0D9'};

/** An unfinished map is an analogy for knowledge, not a physical edge of space.
 * The marker stops at the last drawn part. Blank paper supplies no new cosmic
 * history or claim of a previous universe. Twelve seconds follow the voice. */
const EndingMap:React.FC<{frame:number}>=({frame:f})=>{
 const t=(f-endingStartFrame)/30;
 const arrive=at(t,1,9),pull=at(t,14.9,21),turn=at(t,18,23.2),trace=at(t,22,25),fade=at(f,soundEndingDuration-72,soundEndingDuration-1);
 const scale=mix(1.1,.68,pull),mx=mix(300,1020,arrive),my=650-Math.sin(arrive*Math.PI/2)*145;
 const foldX=mix(2250,1350,turn),curl=Math.sin(turn*Math.PI)*145;
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
  <defs>
   <radialGradient id="ending-room"><stop stopColor="#4C3B62"/><stop offset="1" stopColor={C.ink}/></radialGradient>
   <linearGradient id="ending-paper" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#35455F"/><stop offset="1" stopColor="#222C45"/></linearGradient>
   <linearGradient id="ending-fold"><stop stopColor="#9FA9A3"/><stop offset=".5" stopColor="#DFCCAE"/><stop offset="1" stopColor="#8F8B90"/></linearGradient>
   <clipPath id="ending-sheet"><rect x="-240" y="-170" width="2400" height="1420" rx="15"/></clipPath>
   <clipPath id="ending-printed"><path d={`M-250-180H${foldX}Q${foldX-curl} 540 ${foldX} 1260H-250Z`}/></clipPath>
   <clipPath id="ending-reveal"><circle cx="960" cy="500" r={at(t,0,1.5)*2300}/></clipPath>
  </defs>
  <g clipPath="url(#ending-reveal)">
   <rect width="1920" height="1080" fill="url(#ending-room)"/>
   <g transform={`translate(960 540) rotate(${-3.5*pull}) scale(${scale}) translate(-960 -540)`}>
    <rect x="-212" y="-135" width="2400" height="1420" rx="15" fill="#0B1028" opacity=".35"/>
    <rect x="-240" y="-170" width="2400" height="1420" rx="15" fill="url(#ending-paper)" stroke={C.edge} strokeWidth={3*pull}/>
    <g clipPath="url(#ending-sheet)">
     <g opacity={.16*pull} stroke={C.teal} strokeWidth="2" fill="none">
      {[0,1,2,3,4,5].map(i=><path key={i} d={`M${1320+i*145}-170V1250`}/>)}
      {[0,1,2,3,4,5,6,7].map(i=><path key={i} d={`M1300 ${-100+i*180}H2200`}/>)}
     </g>
     <g clipPath="url(#ending-printed)">
      <rect x="-240" y="-170" width="2400" height="1420" fill={C.ink}/>
      <path d="M-250 130C250-80 640 480 1230 200S1900 150 2200 400L2200 720C1470 380 1100 760 430 430S-100 290-250 400Z" fill="#70577D" opacity=".12"/>
      <g fill="none" stroke={C.teal} strokeWidth="2" opacity=".2">
       {Array.from({length:14},(_,i)=>{const y=80+i*75;return <path key={i} d={`M-240 ${y}C380 ${y} 650 ${y+Math.sin(i*.6)*90} 1020 ${y+15}`}/>;})}
       {Array.from({length:13},(_,i)=><path key={'v'+i} d={`M${-50+i*85}-170Q${80+i*75} 540 ${i*83} 1250`}/>)}
      </g>
      <path d="M140 870C420 630 590 810 805 615S970 540 1020 505" fill="none" stroke={C.gold} strokeWidth="5" pathLength="1" strokeDasharray={`${arrive} 1`}/>
      {[0,1,2,3,4,5].map(i=><g key={i} transform={`translate(${220+i*130} ${800-Math.sin(i*.7)*160})`}><circle r="8" fill={C.teal}/><circle r="23" stroke={C.teal} strokeWidth="2" fill="none" opacity=".23"/></g>)}
      <g stroke={C.lilac} fill="none" strokeWidth="2.5" opacity={.5*(1-at(t,10,14))}>
       {Array.from({length:8},(_,i)=><path key={i} transform={`translate(${170+i%4*175} ${270+Math.floor(i/4)*150}) rotate(${at(t,2+i*.15,5+i*.15)*8})`} d="M0 0H115V105H0Z"/>)}
      </g>
      <path d={`M1080-170C1000 120 1120 280 ${1050-at(t,8,13)*30} 480S1120 870 1060 1250`} fill="none" stroke={C.gold} strokeWidth="7"/>
      <g fill="none" stroke={C.lilac} strokeWidth="3" strokeDasharray="7 15" opacity={at(t,7,11)*.45}>
       <path d="M1100 500Q1310 100 1710 225"/><path d="M1100 500Q1410 510 1790 545"/><path d="M1100 500Q1400 1000 1740 900"/>
      </g>
      <g opacity={.5+Math.sin(t*1.5)*.12}><circle cx={mx} cy={my} r="31" fill={C.gold} opacity=".07"/><circle cx={mx} cy={my} r="16" fill={C.gold}/><circle cx={mx-4} cy={my-5} r="4" fill={C.edge}/></g>
     </g>
     {turn>0&&<g><path d={`M${foldX}-180Q${foldX-curl} 540 ${foldX} 1260L${foldX+140*turn} 1260Q${foldX+curl*.15} 540 ${foldX+140*turn}-180Z`} fill="url(#ending-fold)"/><path d={`M${foldX}-180Q${foldX-curl} 540 ${foldX} 1260`} fill="none" stroke={C.edge} strokeWidth="4"/></g>}
     <g opacity={trace}>
      <path d="M1420 770Q1570 690 1640 600" fill="none" stroke={C.lilac} strokeWidth="3" strokeDasharray=".02 .08" pathLength="1"/>
      <circle cx={1640} cy={600} r="35" fill="none" stroke={C.edge} strokeWidth="3" strokeDasharray="5 13"/>
      <path d="M1600 600H1620M1660 600H1680M1640 560V580M1640 620V640" stroke={C.gold} strokeWidth="3"/>
     </g>
    </g>
    <path d="M-240 1200H2160" stroke={C.edge} strokeWidth="2" opacity={.18*pull}/>
   </g>
   <rect width="1920" height="1080" fill={C.ink} opacity={fade}/>
  </g>
 </svg>;
};

export const SingularitySoundEnding:React.FC<{includeAudio?:boolean;audioFile?:string}>=({includeAudio=true,audioFile='assets/audio/singularity-v3/final-mix.m4a'})=>{
 const frame=useCurrentFrame(),ending=frame>=endingStartFrame,joining=frame<endingStartFrame+45;
 return <AbsoluteFill style={{background:C.ink}}>
  {(!ending||joining)&&<SingularityRebuild includeAudio={false} captions={false}/>}
  {ending&&<EndingMap frame={frame}/>}
  {includeAudio&&<Audio src={staticFile(audioFile)}/>}
 </AbsoluteFill>;
};
export const singularitySoundEndingConfig={durationInFrames:soundEndingDuration,fps:30,width:1920,height:1080};
