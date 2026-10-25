import React from 'react';
import type {Point} from '../timeline/curves';

export type Camera = {x:number;y:number;zoom:number;origin?:Point};
export const projectPoint=(point:Point,camera:Camera,depth=1):Point=>{
  const [x,y]=camera.origin??[960,540];
  return [x+(point[0]-x-camera.x*depth)*camera.zoom,y+(point[1]-y-camera.y*depth)*camera.zoom];
};
/** x/y are camera travel from the authored frame; origin is an image-space pivot. */
export const CameraWorld:React.FC<{camera:Camera;depth?:number;children:React.ReactNode}>=({camera,depth=1,children})=>{
  const [x,y]=camera.origin??[960,540];
  return <g transform={`translate(${x} ${y}) scale(${camera.zoom}) translate(${-x-camera.x*depth} ${-y-camera.y*depth})`}>{children}</g>;
};
