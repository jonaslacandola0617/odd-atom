import React from 'react';
import {CameraWorld,type Camera} from '../camera/controller';

export type Layer = {id:string;z:number;depth:number;content:React.ReactNode};
export const LayerStack:React.FC<{layers:readonly Layer[];camera:Camera}>=({layers,camera})=>{
  if(new Set(layers.map(l=>l.id)).size!==layers.length)throw new Error('Scene layer IDs must be unique');
  return <>{[...layers].sort((a,b)=>a.z-b.z||a.id.localeCompare(b.id)).map(l=><CameraWorld key={l.id} camera={camera} depth={l.depth}>{l.content}</CameraWorld>)}</>;
};
