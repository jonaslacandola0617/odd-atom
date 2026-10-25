import React from 'react';
import {staticFile} from 'remotion';
import {gust,settle} from '../../engine/animation/dynamics';
import {mix,phase} from '../../engine/timeline/curves';

/** Retain the approved illustration. Newly authored cloth, cast shadow, light
 * and foreground foliage are independent actors; no source repainting. */
export const TerracePlate:React.FC=()=> <image href={staticFile('assets/artwork/approved-characters/terrace.png')} x="-45" y="-26" width="2010" height="1132" preserveAspectRatio="xMidYMid slice"/>;

export const Curtain:React.FC<{frame:number;id:string}>=({frame:f,id})=>{
  const pull=phase(f,102,153,'decelerate'),wind=gust(f,93,121,162),tail=settle(f,151,30,13,1.2,4);
  const top=205,bottom=mix(790,360,pull),left=1080-pull*260,right=1455-pull*70;
  const mid=(left+right)/2,sway=wind*72+tail;
  return <g transform="translate(1155 60) scale(.56 .95)">
    <defs><linearGradient id={`${id}-cloth`}><stop stopColor="#205F70"/><stop offset=".2" stopColor="#3C9297"/><stop offset=".5" stopColor="#287B87"/><stop offset=".8" stopColor="#4A9A9A"/><stop offset="1" stopColor="#235D74"/></linearGradient></defs>
    <path d={`M1080 ${top}H1455L${right+sway} ${bottom}Q${mid+sway} ${bottom+42-pull*20} ${left+sway} ${bottom-4}Z`} fill={`url(#${id}-cloth)`}/>
    {[0,1,2,3,4,5].map(i=>{
      const x=1080+i*75,goal=mix(left,right,i/5)+sway;
      return <path key={i} d={`M${x} ${top+2}Q${x+sway*.4} ${(top+bottom)*.53} ${goal} ${bottom+Math.sin(i)*9}`} stroke={i%2?'#245E77':'#7CBEAD'} strokeWidth={i%2?6:3} opacity={i%2?.25:.20} fill="none"/>;
    })}
    <path d="M1060 195H1473" stroke="#814B46" strokeWidth="13" strokeLinecap="round"/>
    {[0,1,2,3,4,5].map(i=><path key={i} d={`M${1084+i*72} 193v17`} stroke="#C38A61" strokeWidth="6" strokeLinecap="round"/>)}
  </g>;
};

export const SceneLight:React.FC<{frame:number;id:string}>=({frame:f,id})=>{
  const light=phase(f,132,176,'smooth');
  return <>
    <defs><linearGradient id={`${id}-beam`} x1="1" y1="0" x2="0" y2="1"><stop stopColor="#FFF6C5" stopOpacity=".7"/><stop offset="1" stopColor="#FFDEA0" stopOpacity="0"/></linearGradient></defs>
    <path d="M1850 280L1920 420 1150 1060 880 1060Z" fill={`url(#${id}-beam)`} opacity={light*.62}/>
    <path d="M1755 250L1825 295 1240 1010 1110 1000Z" fill="#FFF4BA" opacity={light*.09}/>
    <ellipse cx="1290" cy="953" rx="170" ry="34" fill="#F8D994" opacity={light*.22}/>
  </>;
};

export const ForegroundSprig:React.FC<{frame:number;side?:number}>=({frame:f,side=1})=>{
  const angle=gust(f,96,123,173)*-8+settle(f,153,30,2.3,1.4,4);
  return <g transform={`translate(${side>0?1800:80} 1175) rotate(${angle*side}) scale(${side} 1)`}>
    <path d="M0 0Q-36-130-128-215" stroke="#1D5757" strokeWidth="14" fill="none"/>
    {[0,1,2,3,4,5].map(i=><path key={i} transform={`translate(${-i*21} ${-i*34-27}) rotate(${i%2?70:-25})`} d="M0 0C-8-48 35-99 74-102C80-62 49-6 0 0Z" fill={i%2?'#205C5F':'#2F7670'}/>)}
  </g>;
};
