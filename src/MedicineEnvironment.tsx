import React from 'react';
import {staticFile} from 'remotion';

const root='assets/artwork/medicine-layers-v1/';
const Image:React.FC<{name:string}>=({name})=><image href={staticFile(root+name+'.png')} width="1672" height="941"/>;

/** Background objects have their own alpha images and completed surfaces
 * behind them. Motion is local; the window frame and bench stay anchored. */
export const MedicineEnvironment:React.FC<{frame:number}>=({frame:f})=> <g>
  <defs>
    <clipPath id="environment-window-panes"><rect x="1281" y="0" width="95" height="469"/><rect x="1424" y="0" width="248" height="469"/></clipPath>
    <clipPath id="environment-vine-patch"><rect x="970" y="0" width="220" height="365"/></clipPath>
    <clipPath id="environment-sill-patch"><rect x="1438" y="343" width="234" height="180"/></clipPath>
  </defs>
  <g clipPath="url(#environment-window-panes)">
    <Image name="environment-clean"/>
    <g transform={`translate(${f*.075} 0)`}><Image name="window-clouds"/></g>
  </g>
  <g clipPath="url(#environment-vine-patch)"><Image name="environment-clean"/></g>
  <g transform={`rotate(${Math.sin(f/63)*1.7} 1063 66)`}><Image name="hanging-vine"/></g>
  <g clipPath="url(#environment-sill-patch)"><Image name="environment-clean"/></g>
  <g transform={`rotate(${Math.sin(f/51+.4)*1.35} 1572 492)`}><Image name="window-plant"/></g>
</g>;
