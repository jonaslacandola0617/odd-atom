import React from 'react';
import {cubicAt,closedContour,morphContour,type Cubic} from '../../engine/animation/paths';
import {clamp,mix,phase,type Point} from '../../engine/timeline/curves';
import {gust,settle} from '../../engine/animation/dynamics';

const leaves=[
  {t:.29,side:-1,scale:.85},{t:.37,side:1,scale:.93},{t:.48,side:-1,scale:.95},
  {t:.57,side:1,scale:1.1},{t:.69,side:-1,scale:1.03},{t:.80,side:1,scale:.89},{t:.91,side:-1,scale:.68},
];
export const plantTip=(frame:number):Point=>[18+gust(frame,96,126,170)*14+settle(frame,150,30,7,1.3,4),-255];
const plantStem=(frame:number):Cubic=>{
  const [tipX,tipY]=plantTip(frame),bend=gust(frame,96,126,170)*11+settle(frame,150,30,6,1.3,4);
  return [[0,-40],[-28+bend,-95],[35+bend,-175],[tipX,tipY]];
};
export const plantLeafTip=(frame:number,index:number):Point=>{
  const l=leaves[index],p=cubicAt(plantStem(frame),l.t),healthy=phase(frame,155,215);
  const opening=clamp((healthy-index*.045)/(.75+index*.012));
  const angle=(l.side<0?mix(-65,22,opening):mix(65,-22,opening))+settle(frame,150+index*2,30,6,1.7,4);
  const a=angle*Math.PI/180,x=102*l.side*l.scale,y=-37*l.scale;
  return [p[0]+x*Math.cos(a)-y*Math.sin(a),p[1]+x*Math.sin(a)+y*Math.cos(a)];
};

export const GardenPlant:React.FC<{frame:number;id:string;healthy?:number;flower?:number}>=({frame:f,id,healthy=phase(f,155,215),flower=phase(f,215,282)})=>{
  const [tipX,tipY]=plantTip(f),bend=gust(f,96,126,170)*11+settle(f,150,30,6,1.3,4);
  const stem=plantStem(f);
  const bud=Array.from({length:12},(_,i):Point=>{const a=i*Math.PI/6;return [Math.cos(a)*14,Math.sin(a)*21];});
  const bloom=Array.from({length:12},(_,i):Point=>{const a=i*Math.PI/6,r=i%2?18:43;return [Math.cos(a)*r,Math.sin(a)*r];});
  return <>
    <defs>
      <linearGradient id={`${id}-pot`}><stop stopColor="#F39464"/><stop offset=".48" stopColor="#DA694F"/><stop offset="1" stopColor="#9F3A51"/></linearGradient>
      <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#A2D36B"/><stop offset=".5" stopColor="#54AA72"/><stop offset="1" stopColor="#267C68"/></linearGradient>
      <radialGradient id={`${id}-bloom`}><stop stopColor="#FFE6A0"/><stop offset=".55" stopColor="#FFBD67"/><stop offset="1" stopColor="#EF8D6B"/></radialGradient>
    </defs>
    <ellipse cy="59" rx="92" ry="15" fill="#402647" opacity=".26"/>
    <path d={`M0 -40 C${stem[1].join(' ')} ${stem[2].join(' ')} ${stem[3].join(' ')}`} fill="none" stroke="#3C8667" strokeWidth="9" strokeLinecap="round"/>
    {leaves.map((l,i)=>{
      const [x,y]=cubicAt(stem,l.t),opening=clamp((healthy-i*.045)/(.75+i*.012)),sway=settle(f,150+i*2,30,6,1.7,4);
      const angle=l.side<0?mix(-65,22,opening):mix(65,-22,opening);
      return <g key={i} transform={`translate(${x} ${y}) rotate(${angle+sway}) scale(${l.side*l.scale} ${l.scale})`}>
        <path d="M0 0C13-32 56-50 102-37C95-5 52 18 0 0Z" fill={`url(#${id}-leaf)`}/>
        <path d="M0 0Q44-11 89-29" fill="none" stroke="#338369" strokeWidth="2.2" opacity=".8"/>
        <path d="M29-7l9-16M53-15l10-17M75-23l9-13" fill="none" stroke="#B6D77D" strokeWidth="1.4" opacity=".6"/>
      </g>;
    })}
    <g transform={`translate(${tipX} ${tipY}) rotate(${bend*.4})`}>
      <path d="M-11 12Q-24-9 0-28Q24-9 11 12Z" fill="#CF9C8B" opacity={1-flower}/>
      <path d="M0-23V11" stroke="#B97E89" strokeWidth="2" opacity={1-flower}/>
      {[0,1,2,3,4,5].map(i=><g key={i} transform={`rotate(${i*60}) translate(0 ${-20*flower}) scale(${.12+.88*flower})`} opacity={flower}><ellipse rx="14" ry="25" fill={`url(#${id}-bloom)`}/><path d="M0 17Q-5 0 0-17" stroke="#EEAF78" strokeWidth="1.8" fill="none"/></g>)}
      <path d="M-12 12L-19 0Q0 9 19 0L12 12Z" fill="#4C996D" opacity={1-flower}/>
      <ellipse rx={5+flower*10} ry={7+flower*7} fill="#B96F49" opacity={flower}/>
      {[0,1,2,3,4].map(i=><circle key={i} cx={Math.cos(i*2.4)*7} cy={Math.sin(i*2.4)*7} r="1.6" fill="#FFE5A0" opacity={flower}/>) }
    </g>
    <ellipse cy="-40" rx="67" ry="18" fill="#9F4246"/>
    <path d="M-66-40L-52 47Q0 73 52 47L66-40Z" fill={`url(#${id}-pot)`}/>
    <path d="M-64-35L-52 45Q-40 53-25 55L-35-34Z" fill="#F6AB75" opacity=".42"/>
    <path d="M-62-34Q0-17 62-34" fill="none" stroke="#9E424D" strokeWidth="7"/>
    <ellipse cy="-40" rx="64" ry="15" fill="#E4815E"/>
    <ellipse cy="-42" rx="54" ry="10" fill="#5B3A4D"/>
    <path d="M-2-43L0-59" stroke="#4E9166" strokeWidth="8" strokeLinecap="round"/>
  </>;
};
