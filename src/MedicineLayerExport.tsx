import React from 'react';
import {staticFile} from 'remotion';
import masks from './data/medicine-png-layer-masks.json';

const old='assets/artwork/scene-motion/';
const fresh='assets/artwork/medicine-layers-v1/';
const picture=(file:string,width=1672,height=941)=><image href={staticFile(file)} width={width} height={height}/>;
const crop=(file:string,x:number,y:number,w:number,h:number)=><g><defs><clipPath id="part"><rect x={x} y={y} width={w} height={h}/></clipPath></defs><g clipPath="url(#part)">{picture(file)}</g></g>;
const biological:Record<string,[number,number,number,number,number,number,number]>={
  'immune-cell':[0,0,585,570,435,282,.9],
  'microbe-upper':[70,620,410,360,538,285,.288],
  'microbe-lower':[600,600,420,385,602,381,.306],
  'red-cell-a':[580,90,470,390,154,113,.42],
  'red-cell-b':[1100,170,430,300,746,222,.38],
  'red-cell-c':[1070,580,440,420,423,583,.44],
};

/** Export real RGBA files. Geometry here only masks original PNG pixels;
 * the delivered artwork has no traced SVG color regions. */
export const MedicineLayerExport:React.FC<{layer:string}>=({layer})=> {
  let content:React.ReactNode;
  if(layer==='window-clouds')content=crop(fresh+'environment-cutouts.png',1220,0,452,230);
  else if(layer==='hanging-vine')content=crop(fresh+'environment-cutouts.png',950,0,250,335);
  else if(layer==='window-plant')content=crop(fresh+'environment-cutouts.png',1400,335,272,220);
  else if(layer==='window-view')content=<g><defs><clipPath id="panes"><rect x="1281" y="0" width="95" height="469"/><rect x="1424" y="0" width="248" height="469"/></clipPath></defs><g clipPath="url(#panes)">{picture(fresh+'environment-clean.png')}</g></g>;
  else if(layer in biological){
    const [x,y,w,h,cx,cy,s]=biological[layer];
    content=<svg x={cx-w*s/2} y={cy-h*s/2} width={w*s} height={h*s} viewBox={`${x} ${y} ${w} ${h}`} overflow="hidden">{picture(old+'medicine-cell-atlas.png',1536,1024)}</svg>;
  }else{
    const paths=(masks as Record<string,string[]>)[layer];
    if(!paths)throw new Error('Unknown medicine layer: '+layer);
    content=<g><defs><clipPath id="part">{paths.map((d,i)=><path key={i} d={d} clipRule="evenodd"/>)}</clipPath></defs><g clipPath="url(#part)">{picture(old+'medicine-source.png')}</g></g>;
  }
  return <svg width="1672" height="941" viewBox="0 0 1672 941" style={{display:'block'}}>{content}</svg>;
};
