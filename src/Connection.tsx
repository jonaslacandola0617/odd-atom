import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {ArtDefinitions, ForegroundLeaves, MiraSeated, MiraStanding, NightStreet, Passer, Seat, SolBack, SolSeated, Table, Terrace} from './art/ConnectionArt';
import {IllustratedTitle} from './IllustratedTitle';
import narration from './data/crowd-narration.json';

const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const progress=(f:number,a:number,b:number)=>ease((f-a)/(b-a));
const pulse=(f:number,a:number,b:number,c:number,d:number)=>progress(f,a,b)*(1-progress(f,c,d));
const mod=(v:number,n:number)=>((v%n)+n)%n;

export const ConnectionScene: React.FC<{frame: number}> = ({frame:f}) => {
  const cafeFrame=narration.beats.notice*30;
  const closeFrame=narration.beats.seen*30;
  const attention=progress(f,cafeFrame+7,cafeFrame+62);
  const gesture=pulse(f,240,273,294,322)+.6*pulse(f,327,347,361,380);
  const reply=pulse(f,325,351,366,390)*.55+progress(f,closeFrame,closeFrame+48)*.75;
  if(f<cafeFrame){
    const push=progress(f,95,214), zoom=1+push*.14;
    return <>
      <g transform={`translate(960 540) scale(${zoom}) translate(${-960-push*110} -540)`}>
        <NightStreet/>
        {[0,1,2,3].map(i=><g key={i} transform={`translate(${mod(i*660+f*2.3,2760)-320} ${865+i%2*30}) scale(${.72+i%3*.08})`}>
          <Passer frame={f+i*39} variant={i}/>
        </g>)}
        <g transform={`translate(1260 ${925-Math.sin(f/75)*2}) scale(1.16) rotate(${Math.sin(f/110)*.25} 0 -240)`}>
          <MiraStanding frame={f}/>
        </g>
        {[0,1].map(i=><g key={i} transform={`translate(${mod(680+i*1800-f*6.5,3600)-700} 1252) scale(-1.7 1.7)`}>
          <Passer frame={f+i*63} variant={i+1} near/>
        </g>)}
      </g>
      <g opacity={1-progress(f,82,106)}>
        <IllustratedTitle centerX={508} centerY={343} tilt={-3} strokeScale={.68} lines={[
          {text:'Alone',size:132,baseline:304},
          {text:'in a crowd',size:107,baseline:429},
        ]}/>
      </g>
    </>;
  }
  if(f<closeFrame){
    const push=.06+progress(f,cafeFrame,closeFrame)*.035;
    return <g transform={`translate(1050 600) scale(${1+push}) translate(-1050 -600)`}>
      <Terrace/>
      <ellipse cx="824" cy="1038" rx="150" ry="24" fill="#4D3768" opacity=".28"/>
      <Seat x={770} y={785} scale={1.08}/>
      <Seat x={1394} y={808} scale={1.25} mirror/>
      <g transform={`translate(775 782) scale(1.08) rotate(${Math.sin(f/65)*.2} 0 -100)`}>
        <MiraSeated frame={f} attention={attention} reply={reply}/>
      </g>
      <Table frame={f}/>
      <g transform="translate(1408 805) scale(1.25)"><SolSeated frame={f} gesture={gesture}/></g>
      <ForegroundLeaves frame={f}/>
    </g>;
  }
  const settle=progress(f,closeFrame,599);
  return <>
    <g transform="translate(-400 -150) scale(1.3)"><Terrace/></g>
    <g transform={`translate(${696-settle*12} ${1042+settle*8}) scale(${1.85-settle*.025})`}>
      <MiraSeated frame={f} attention={1} reply={reply}/>
    </g>
    <g transform="translate(-150 285) scale(1.17)"><Table frame={f}/></g>
    <g transform={`translate(${1660+settle*14} 1060) scale(2.12)`}><SolBack frame={f}/></g>
    <g transform="translate(-80 130) scale(1.2)"><ForegroundLeaves frame={f}/></g>
  </>;
};

export const Connection: React.FC = () => {
  const frame=useCurrentFrame(), time=frame/30;
  const [fonts]=useState(()=>delayRender('Load local title and caption fonts'));
  useEffect(()=>{
    Promise.all([
      new FontFace('Outfit',`url(${staticFile('assets/fonts/Outfit.ttf')})`,{weight:'100 900'}).load(),
      new FontFace('Nunito',`url(${staticFile('assets/fonts/Nunito.ttf')})`,{weight:'200 1000'}).load(),
    ]).then(loaded=>{loaded.forEach(font=>document.fonts.add(font));continueRender(fonts);}).catch(cancelRender);
  },[fonts]);
  if(narration.provider!=='elevenlabs'||narration.status!=='generated'||!narration.audioFile)throw new Error('This composition requires the saved ElevenLabs narration.');
  const caption=narration.captions.find(c=>time>=c.start&&time<c.end);
  return <AbsoluteFill style={{background:'#180638',fontFamily:'Outfit, sans-serif'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <ArtDefinitions/>
      <ConnectionScene frame={frame}/>
      {caption&&<text x="960" y="1027" textAnchor="middle" fontSize="39" fontWeight="500" fill="#FFFFFF" stroke="#1B103A" strokeWidth="3.4" paintOrder="stroke" strokeLinejoin="round">{caption.text}</text>}
    </svg>
    <Audio src={staticFile('assets/audio/crowd/music.wav')}/>
    <Audio src={staticFile('assets/audio/crowd/sfx.wav')}/>
    <Audio src={staticFile(narration.audioFile)}/>
  </AbsoluteFill>;
};
