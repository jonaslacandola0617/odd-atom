import React from 'react';
import {phase,type Point} from '../timeline/curves';

/** The carrier must already exist in the outgoing story. Its material colour,
 * trajectory and incoming anchor are authored by the scene, not a cut preset. */
export const CarrierPortal:React.FC<{id:string;frame:number;start:number;end:number;center:Point;radius:number;children:React.ReactNode}>=({id,frame,start,end,center,radius,children})=>{
  const t=phase(frame,start,end,'accelerate'),r=radius+(2350-radius)*t;
  return <><defs><clipPath id={id}><circle cx={center[0]} cy={center[1]} r={r}/></clipPath></defs><g clipPath={`url(#${id})`}>{children}</g></>;
};
