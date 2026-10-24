import React from 'react';
import {AbsoluteFill,Img,staticFile} from 'remotion';

/** Renders the standalone SVG as vector artwork; no PNG fallback or voice. */
export const MedicineVectorArtwork:React.FC=()=> <AbsoluteFill style={{background:'#31213E'}}>
  <Img src={staticFile('assets/artwork/medicine-vector/medicine-scene-editable.svg')} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
</AbsoluteFill>;
