import React from 'react';
import {staticFile} from 'remotion';

/** Native-size alpha export. Color artwork stays unchanged inside its cell;
 * only the outer 5% fades to prevent generated halo/edge cutoffs in motion. */
export const SingularitySpriteExport:React.FC<{sheet:string;cell:number}>=({sheet,cell})=>{
 const wide=sheet==='field-ribbons',w=wide?768:512,h=512,cols=wide?2:3,x=cell%cols*w,y=Math.floor(cell/cols)*h;
 return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'hidden'}}>
  <defs>
   <linearGradient id="h"><stop stopColor="white" stopOpacity="0"/><stop offset=".055" stopColor="white"/><stop offset=".945" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
   <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity="0"/><stop offset=".055" stopColor="white"/><stop offset=".945" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
   <mask id="hx" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}><rect width={w} height={h} fill="url(#h)"/></mask>
   <mask id="vy" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}><rect width={w} height={h} fill="url(#v)"/></mask>
  </defs>
  <g mask="url(#hx)"><g mask="url(#vy)"><image href={staticFile('assets/artwork/singularity/'+sheet+'.png')} x={-x} y={-y} width="1536" height="1024"/></g></g>
 </svg>;
};
