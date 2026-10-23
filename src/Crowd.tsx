import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Citizen, EXTRAS, MIRA, SOL} from './characters/Citizen';
import {CafeArt, CafeTable, Chair, StreetArt} from './art/City';
import {IllustratedTitle} from './IllustratedTitle';
import narration from './data/crowd-narration.json';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {const t=clamp(v);return t*t*(3-2*t);};
const at = (f: number,a: number,b: number) => smooth((f-a)/(b-a));
const mix = (a: number,b: number,t: number) => a+(b-a)*t;
const mod = (v: number,n: number) => ((v%n)+n)%n;

export const Crowd: React.FC<{includeNarration: boolean}> = ({includeNarration}) => {
  const actualFrame=useCurrentFrame(), time=actualFrame/30;
  const anchors=[[0,0],[narration.beats.nearby,4.4],[narration.beats.notice,8.1],[narration.beats.conversation,13.1],[narration.beats.seen,16],[20,20]];
  const index=Math.max(0,anchors.findIndex((a,i)=>i<anchors.length-1&&time>=a[0]&&time<anchors[i+1][0]));
  const a=anchors[index], b=anchors[index+1];
  const f=(a[1]+(time-a[0])/(b[0]-a[0])*(b[1]-a[1]))*30;
  const [fonts]=useState(()=>delayRender('Load local narration and title fonts'));
  useEffect(()=>{
    Promise.all([
      new FontFace('Outfit',`url(${staticFile('assets/fonts/Outfit.ttf')})`,{weight:'100 900'}).load(),
      new FontFace('Nunito',`url(${staticFile('assets/fonts/Nunito.ttf')})`,{weight:'200 1000'}).load(),
    ]).then(loaded=>{loaded.forEach(font=>document.fonts.add(font));continueRender(fonts);}).catch(cancelRender);
  },[fonts]);
  if(includeNarration&&(narration.status!=='generated'||!narration.audioFile))throw new Error('Crowd narration is missing. Run npm run narrate:crowd with the secure ElevenLabs environment binding.');

  const close=at(f,103,157), zoom=mix(1,1.27,close);
  const cafe=at(f,228,249);
  const attention=at(f,278,329);
  const friendX=mix(1580,1240,at(f,229,306));
  const sit=at(f,293,327);
  const gesture=at(f,320,345)*(1-at(f,364,391));
  const reply=at(f,381,408)*(1-at(f,439,465));
  const cafeZoom=1+at(f,250,390)*.07-at(f,460,599)*.07;
  const sip=at(f,482,521)*(1-at(f,547,584));
  const caption=narration.captions.find(c=>time>=c.start&&time<c.end);

  return <AbsoluteFill style={{background:'#35234F',fontFamily:'Outfit, sans-serif'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
      <g opacity={1-cafe}>
        <g transform={`translate(960 540) scale(${zoom}) translate(${-mix(960,1280,close)} ${-mix(540,620,close)})`}>
          <StreetArt />
          {[0,1,2,3,4].map(i=>{
            const x=mod(i*490+f*2.35,2780)-280;
            return <g key={i} transform={`translate(${x} ${870+i%2*12}) scale(${.79+i%3*.06})`}>
              <ellipse cy="5" rx="54" ry="12" fill="#2A2146" opacity=".5" />
              <Citizen id={`far-${i}`} frame={f+i*31} walking colors={EXTRAS[i%3]} variant={i%2?'bun':'curls'} attention={.15} mood={.3} />
            </g>;
          })}
          <g transform="translate(1280 940) scale(1.34)">
            <ellipse cy="5" rx="61" ry="12" fill="#271C3F" opacity=".6" />
            <Citizen id="mira-street" frame={f} colors={MIRA} attention={.06+at(f,143,183)*.12} mood={.2} />
          </g>
          {[0,1,2].map(i=>{
            const x=mod(i*1010-f*5.1+500,3500)-600;
            return <g key={i} transform={`translate(${x} ${1105+i%2*20}) scale(${1.43+i%2*.12})`}>
              <Citizen id={`near-${i}`} frame={f+i*48} colors={EXTRAS[(i+1)%3]} walking facing={-1} variant={i%2?'sweep':'bun'} attention={.1} mood={.3} />
            </g>;
          })}
        </g>
        <g opacity={1-at(f,91,115)}>
          <IllustratedTitle centerX={470} centerY={410} strokeScale={.58} tilt={-2} lines={[
            {text:'Alone',size:126,baseline:365},
            {text:'in a crowd',size:103,baseline:496},
          ]} />
        </g>
      </g>

      <g opacity={cafe}>
        <g transform={`translate(950 650) scale(${cafeZoom}) translate(-950 -650)`}>
          <CafeArt />
          <g transform="translate(215 829) scale(.49)">
            <Citizen id="cafe-background" frame={f} colors={EXTRAS[1]} attention={.3} walking />
          </g>
          <ellipse cx="652" cy="949" rx="100" ry="23" fill="#543753" opacity=".38" />
          <ellipse cx="1240" cy="949" rx="100" ry="23" fill="#543753" opacity=".38" />
          <Chair x={650} /><Chair x={1240} flip />
          <g transform="translate(650 930) scale(1.45)">
            <Citizen id="mira-cafe" frame={f} colors={MIRA} seated mood={mix(.22,.62,at(f,357,466))} attention={attention} gesture={reply*.72} cup sip={sip} />
          </g>
          <g transform={`translate(${friendX} 930) scale(1.45)`}>
            <Citizen id="sol-cafe" frame={f+27} colors={SOL} facing={-1} seated={sit} walking={f<302} variant="curls" attention={.82} mood={.65} gesture={gesture*.95} />
          </g>
          <CafeTable />
        </g>
      </g>
      {caption&&<text x="960" y="1024" textAnchor="middle" fontSize="39" fontWeight="500" fill="#FFFFFF" stroke="#241C39" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">{caption.text}</text>}
    </svg>
    <Audio src={staticFile('assets/audio/crowd/music.wav')} />
    <Audio src={staticFile('assets/audio/crowd/sfx.wav')} />
    {includeNarration&&narration.audioFile&&<Audio src={staticFile(narration.audioFile)} />}
  </AbsoluteFill>;
};
