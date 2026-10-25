import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {MotionMira,miraHandAnchor} from './MotionCharacters';
import {gardenActing,gardenBlink,windActing,windBlink} from '../animation-mastery/engine/animation/acting';
import {gust,seeded,settle} from '../animation-mastery/engine/animation/dynamics';
import {arcSampler,cubicAt,ribbon,type Cubic} from '../animation-mastery/engine/animation/paths';
import {mix,phase,type Point} from '../animation-mastery/engine/timeline/curves';
import {CameraWorld,projectPoint} from '../animation-mastery/engine/camera/controller';
import {LayerStack} from '../animation-mastery/engine/renderer/Layers';
import {CarrierPortal} from '../animation-mastery/engine/transitions/CarrierPortal';
import {GardenPlant,plantLeafTip} from '../animation-mastery/assets/props/GardenPlant';
import {Curtain,ForegroundSprig,SceneLight,TerracePlate} from '../animation-mastery/assets/environments/TerraceLayers';

export type MasteryStudyKind='acting'|'explanation'|'transition'|'narrative';
export const masteryStudies={acting:{id:'MasteryCharacterActing',frames:120,file:'A-character-acting-4s'},explanation:{id:'MasteryVisualExplanation',frames:180,file:'B-root-detour-6s'},transition:{id:'MasterySceneTransition',frames:240,file:'C-garden-to-roots-8s'},narrative:{id:'MasteryShortNarrative',frames:360,file:'D-a-little-light-12s'}} as const;

const STEAM_LIFE=52;
const Steam:React.FC<{frame:number;acting:boolean;actorX:number}>=({frame:f,acting,actorX})=><>
  {Array.from({length:12},(_,i)=>{
    const born=i*9+Math.floor(Math.max(0,f-100)/108)*108,age=f-born;
    if(age<0||age>STEAM_LIFE)return null;
    const p=acting?windActing(born):gardenActing(born),anchor=miraHandAnchor(p,true);
    const breeze=acting?gust(f,24,35,66):gust(f,103,119,163);
    const x=actorX+anchor[0]*1.22-age*(.24+breeze*.65),y=990+anchor[1]*1.22-age*.9;
    return <path key={i} d={`M${x} ${y}q${-8-age*.1} -10 1 -20t-1 -13`} fill="none" stroke="#FCEAD6" strokeWidth="2" opacity={Math.sin(Math.PI*age/STEAM_LIFE)*.33}/>;
  })}
</>;

const gardenCamera=(f:number,actingOnly=false)=>({x:actingOnly?0:mix(14,0,phase(f,278,350)),y:0,zoom:actingOnly?1.075:mix(1.035,1,phase(f,278,350)),origin:[960,655] as Point});
export const GardenWorld:React.FC<{frame:number;id:string;actingOnly?:boolean}>=({frame:f,id,actingOnly=false})=>{
  const scene=actingOnly?Math.max(0,f+80):f,p=actingOnly?windActing(f):gardenActing(f);
  const breeze=actingOnly?gust(f,24,35,66):gust(f,103,119,163),light=actingOnly?.4:phase(f,132,176);
  const camera=gardenCamera(f,actingOnly),actorX=actingOnly?860:620;
  return <>
    <defs><linearGradient id={`${id}-shade`}><stop stopColor="#1A2360" stopOpacity=".20"/><stop offset="1" stopColor="#182D57" stopOpacity=".30"/></linearGradient><filter id={`${id}-soft-shadow`}><feGaussianBlur stdDeviation="12"/></filter></defs>
    <LayerStack camera={camera} layers={[
      {id:id+'-plate',z:0,depth:1,content:<TerracePlate/>},
      {id:id+'-shade',z:1,depth:1,content:<path d="M1770 270L1990 390 1510 1080H1080Z" fill={`url(#${id}-shade)`} opacity={1-light} filter={`url(#${id}-soft-shadow)`}/>} ,
      {id:id+'-cloth',z:2,depth:1,content:<Curtain frame={actingOnly?scene:scene} id={id+'-cloth'}/>},
      {id:id+'-plant',z:3,depth:1,content:actingOnly?null:<g transform="translate(1290 930)"><GardenPlant frame={f} id={id+'-plant'}/></g>},
      {id:id+'-actor',z:4,depth:1,content:<>
        <ellipse cx={actorX} cy="992" rx="127" ry="18" fill="#57304D" opacity=".24"/>
        <g transform={`translate(${actorX} 990) scale(1.22)`}><MotionMira frame={f} id={id+'-mira'} poseOverride={p} blinkOverride={actingOnly?windBlink(f):gardenBlink(f)} steam={false} skinMode="extended"/></g>
        <Steam frame={f} acting={actingOnly} actorX={actorX}/>
      </>},
      {id:id+'-light',z:5,depth:1,content:<SceneLight frame={actingOnly?150:f} id={id+'-light'}/>},
      {id:id+'-breeze',z:6,depth:1.04,content:<>
        {[0,1,2].map(i=>{
          const age=(f-(actingOnly?19:98)-i*6)/38;if(age<0||age>1)return null;
          const x=mix(1870,310,age),y=430+i*38+Math.sin(age*3+i)*25;
          return <path key={i} transform={`translate(${x} ${y}) rotate(${-age*140+i*70}) scale(.22)`} d="M0 0C-10-30 20-67 58-68C60-28 35 3 0 0Z" fill="#EACD84" opacity={Math.sin(Math.PI*age)*.82}/>;
        })}
        <path d={`M1860 420Q1530 ${370+breeze*35} 1130 455`} fill="none" stroke="#FFF1C5" strokeWidth="3" opacity={breeze*.12}/>
      </>},
      {id:id+'-foreground',z:7,depth:1.16,content:<><ForegroundSprig frame={scene}/><ForegroundSprig frame={scene} side={-1}/></>},
    ]}/>
  </>;
};

const firstRoot:Cubic=[[80,610],[290,580],[610,640],[832,620]];
const detour:Cubic=[[730,623],[730,1070],[1280,1030],[1370,720]];
const lastRoot:Cubic=[[1370,720],[1410,600],[1550,555],[1660,568]];
const sampleFirst=arcSampler(firstRoot),sampleDetour=arcSampler(detour),sampleLast=arcSampler(lastRoot);
const detourPoint=(t:number):Point=>t<.74?sampleDetour(t/.74):sampleLast((t-.74)/.26);

export const RootWorld:React.FC<{frame:number;id:string}>=({frame:f,id})=>{
  const initial=phase(f,5,51,'decelerate'),turn=phase(f,68,144,'linear'),reached=phase(f,144,156,'smooth');
  const main=Array.from({length:70},(_,i)=>sampleFirst(i/69*initial));
  const branch=Array.from({length:100},(_,i)=>detourPoint(i/99*turn));
  const tip=turn>.001?detourPoint(turn):sampleFirst(initial),pressure=settle(f,52,30,7,2.5,5);
  return <>
    <defs>
      <linearGradient id={`${id}-soil`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1080"><stop stopColor="#102E3C"/><stop offset="1" stopColor="#222044"/></linearGradient>
      <radialGradient id={`${id}-pool`}><stop stopColor="#B8F3CE"/><stop offset=".3" stopColor="#55D5C0"/><stop offset="1" stopColor="#19516A" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#39819A"/><stop offset=".5" stopColor="#23566B"/><stop offset="1" stopColor="#14374D"/></linearGradient>
      <linearGradient id={`${id}-root`}><stop stopColor="#CA5C67"/><stop offset=".55" stopColor="#F58A55"/><stop offset="1" stopColor="#FFC56A"/></linearGradient>
    </defs>
    <rect x="-6000" y="-6000" width="14000" height="14000" fill={`url(#${id}-soil)`}/>
    <path d="M-300 156Q470 190 960 154T2300 169V-800H-300Z" fill="#B5D8AC"/>
    <path d="M-300 169Q470 203 960 167T2300 182" fill="none" stroke="#487465" strokeWidth="17"/>
    <path d="M180 171C164 249 54 321 80 610" fill="none" stroke="#CF6A66" strokeWidth="43" strokeLinecap="round"/>
    <path d="M180 171C164 249 54 321 80 610" fill="none" stroke="#F0AC70" strokeWidth="15" strokeLinecap="round"/>
    <path d="M112 333Q168 375 181 453M91 430Q32 451 17 499" fill="none" stroke="#DA896C" strokeWidth="8" strokeLinecap="round"/>
    <path d="M180 169Q204 98 187 36" fill="none" stroke="#40856B" strokeWidth="10" strokeLinecap="round"/>
    <path d="M190 92C159 83 125 49 128 22C166 21 195 48 190 92ZM195 116C223 88 257 74 282 87C268 120 234 135 195 116Z" fill="#4D9F71"/>
    <path d="M189 78Q159 49 141 36M205 115Q240 95 264 94" stroke="#A4D48F" strokeWidth="3" fill="none"/>
    <path d="M0 970Q650 850 1220 1010T1920 970V1080H0Z" fill="#171A37"/>
    {Array.from({length:520},(_,i)=>{
      const x=seeded(i*3+137)*1920,y=seeded(i*3+19)*820+225,r=seeded(i+711)*8+2;
      return <ellipse key={i} cx={x} cy={y} rx={r*.55} ry={r*.35} fill={i%3===0?'#3F365F':i%3===1?'#2D5560':'#355E58'} opacity=".6"/>;
    })}
    {Array.from({length:29},(_,i)=>{
      const x=seeded(i+300)*1800+60,y=seeded(i+415)*820+180,s=seeded(i+20)*.65+.35;
      return <g key={i} transform={`translate(${x} ${y}) rotate(${seeded(i+90)*90-45}) scale(${s})`}>
        <path d="M-45-9L-14-29 24-24 48 4 18 26-31 21Z" fill="#315464"/><path d="M-45-9L2 0 18 26-31 21Z" fill="#233B53"/><path d="M-14-29L2 0 24-24Z" fill="#477581"/>
      </g>;
    })}
    <path d="M862 690L970 799 1155 719 1135 747 975 823 848 713Z" fill="#0E172D" opacity=".55"/>
    <path d="M900 420L1070 390 1170 490 1150 710 970 790 850 700 850 530Z" fill={`url(#${id}-rock)`}/>
    <path d="M900 420L956 563 1070 390 1170 490 1020 620 850 700 850 530Z" fill="#367B90"/>
    <path d="M956 563L1020 620 970 790 1150 710 1170 490Z" fill="#1B455E"/>
    <path d="M873 569L948 587 1005 477 940 518Z" fill="#4B8D9C" opacity=".6"/>
    <path d="M1038 658l72-41-31 70-63 41Z" fill="#2B6278"/>
    <ellipse cx="1670" cy="570" rx="180" ry="155" fill={`url(#${id}-pool)`}/>
    <path d="M1548 579Q1559 517 1622 510Q1703 481 1756 536Q1796 579 1738 625Q1635 676 1569 626Z" fill="#3A8490" opacity=".6"/>
    <path d="M1670 489C1651 521 1624 546 1624 571C1624 624 1716 624 1716 571C1716 546 1689 521 1670 489Z" fill="#83DACF" opacity={.72+reached*.2}/>
    <path d="M1640 566Q1634 590 1652 597" stroke="#D5F4DF" strokeWidth="7" strokeLinecap="round" fill="none"/>
    <path d="M1568 611Q1640 646 1739 612" fill="none" stroke="#6ABBB8" strokeWidth="3" opacity=".55"/>
    <path d={ribbon(main,t=>mix(22,17,t))} fill={`url(#${id}-root)`}/>
    <path d={ribbon(main,t=>mix(8,5,t))} fill="#F6B975" opacity=".72"/>
    {turn>0&&<><path d={ribbon(branch,t=>mix(20,13,t))} fill={`url(#${id}-root)`}/><path d={ribbon(branch,t=>mix(7,4,t))} fill="#FAD37B" opacity=".68"/></>}
    <ellipse cx={tip[0]} cy={tip[1]} rx={18-(turn===0?Math.max(0,pressure)*.4:0)} ry={16+(turn===0?Math.max(0,pressure)*.5:0)} fill="#FFBA69"/>
    {f>=52&&f<70&&[0,1,2].map(i=><path key={i} d={`M${851+i*10} ${605-i*9}l${7-i*3} ${-10-i*3}`} stroke="#FFD694" strokeWidth="2" opacity={1-phase(f,55,69)}/>)}
    {Array.from({length:7},(_,i)=>{
      const age=(f-145-i*4)/36;if(age<0||age>1)return null;
      const [x,y]=detourPoint(1-age);
      return <circle key={i} cx={x} cy={y} r="5" fill="#B3EAD5" opacity={Math.sin(Math.PI*age)}/>;
    })}
    <g transform="translate(390 140)"><path d="M0 30Q8-10 2-35M43 18Q37-11 42-35" stroke="#657886" strokeWidth="8" fill="none"/><path d="M-23-33Q0-79 29-36Q2-21-23-33ZM18-35Q43-69 66-33Q43-22 18-35Z" fill="#A06B98"/><path d="M-19-35Q0-58 23-36M23-34Q43-52 59-35" stroke="#C994AF" strokeWidth="3" fill="none"/></g>
  </>;
};

const CarrierStudy:React.FC<{frame:number}>=({frame:f})=>{
  const flight=phase(f,25,80,'accelerate');
  const leaf=plantLeafTip(247.5,1);
  const path:Cubic=[[1290+leaf[0],930+leaf[1]+24],[1435,830],[1270,860],[1290,888]];
  const outer={x:0,y:0,zoom:1+phase(f,32,108)*.16,origin:[1290,850] as Point};
  const point=cubicAt(path,flight),current=projectPoint(projectPoint(point,gardenCamera(Math.min(359,240+f*.3))),outer),reveal=phase(f,85,118,'accelerate');
  const center:Point=[mix(current[0],1670,reveal),mix(current[1],570,reveal)];
  const incomingScale=mix(3.4,1,phase(f,85,118,'decelerate'));
  const dropScale=phase(f,3,24)*gardenCamera(240+f*.3).zoom*outer.zoom*(1-phase(f,80,90));
  return <>
    <CameraWorld camera={outer}><GardenWorld frame={Math.min(359,240+f*.3)} id="c-garden"/></CameraWorld>
    {f<91&&<g transform={`translate(${current.join(' ')}) scale(${dropScale})`}><path d="M0-24C-9-10-18 0-17 10C-16 28 16 28 17 10C18 0 9-10 0-24Z" fill="#88DAD9"/><path d="M-9 4Q-14 15-4 19" fill="none" stroke="#DCF7E7" strokeWidth="4" strokeLinecap="round"/></g>}
    {f>=80&&f<103&&<ellipse cx={current[0]} cy={current[1]} rx={10+(f-80)*5} ry={3+(f-80)*1.3} fill="none" stroke="#B1EBDF" strokeWidth="2" opacity={1-phase(f,80,103)}/>}
    {f>=85&&<CarrierPortal id="c-water-portal" frame={f} start={85} end={118} center={center} radius={23}>
      <g transform={`translate(${center.join(' ')}) scale(${incomingScale}) translate(-1670 -570)`}><RootWorld frame={Math.max(0,f-70)} id="c-root"/></g>
    </CarrierPortal>}
  </>;
};

export const MasteryStudy:React.FC<{kind:MasteryStudyKind;includeAudio?:boolean}>=({kind,includeAudio=true})=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{background:'#1B2B40'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {kind==='acting'?<GardenWorld frame={f} id="a-garden" actingOnly/>:kind==='explanation'?<RootWorld frame={f} id="b-root"/>:kind==='transition'?<CarrierStudy frame={f}/>:<GardenWorld frame={f} id="d-garden"/>}
    </svg>
    {includeAudio&&<Audio src={staticFile(`assets/audio/animation-mastery/${kind}.m4a`)}/>}
  </AbsoluteFill>;
};
