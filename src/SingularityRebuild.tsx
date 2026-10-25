import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Audio,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame} from 'remotion';
import timing from './data/singularity-narration.json';
import {MotionSol} from './MotionCharacters';

// The previous full cut remains a comparison artifact. This film never imports
// its Stage/Backplate components: objects, effects and settings are composed here.
const A='assets/artwork/singularity/';
const P={ink:'#11132F',deep:'#1C1842',purple:'#47346B',violet:'#8160AA',lilac:'#C3A2F3',cream:'#FFF0CE',gold:'#FFCE74',orange:'#F88D64',coral:'#F26E88',teal:'#61D9CC',blue:'#4B8BBE'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const q=(v:number,a:number,b:number)=>smooth((v-a)/(b-a));
const mix=(a:number,b:number,v:number)=>a+(b-a)*v;
const rnd=(i:number)=>{const x=Math.sin(i*137.13+71.2)*43758.55;return x-Math.floor(x);};
const tau=Math.PI*2;
type Point=[number,number];
type Transition='spiral'|'wave'|'tear'|'orbit'|'lens'|'fold'|'grid'|'page'|'curtain';
export const filmSections=[
 {name:'Rewind through structure',kind:'rewind',from:1,to:4,transition:'spiral',anchor:[960,500]},
 {name:'The classical extrapolation',kind:'plasma',from:5,to:6,transition:'spiral',anchor:[960,500]},
 {name:'The description breaks',kind:'boundary',from:7,to:7,transition:'tear',anchor:[960,500]},
 {name:'Separate three questions',kind:'three',from:8,to:8,transition:'page',anchor:[960,500]},
 {name:'Increasing distances and redshift',kind:'redshift',from:9,to:9,transition:'orbit',anchor:[960,500]},
 {name:'Light is set free',kind:'recombination',from:10,to:10,transition:'wave',anchor:[940,500]},
 {name:'Nuclei assemble',kind:'nuclei',from:11,to:11,transition:'spiral',anchor:[960,500]},
 {name:'Evidence reaches an instrument',kind:'evidence',from:12,to:12,transition:'lens',anchor:[1450,510]},
 {name:'Matter bends a geometry',kind:'gravity',from:13,to:13,transition:'grid',anchor:[960,500]},
 {name:'Reversing the classical model',kind:'compression',from:14,to:14,transition:'grid',anchor:[960,500]},
 {name:'A model reaches its limits',kind:'tested',from:15,to:16,transition:'tear',anchor:[1050,500]},
 {name:'The invented room',kind:'room',from:17,to:19,transition:'fold',anchor:[960,490]},
 {name:'Expansion everywhere',kind:'expansion',from:20,to:21,transition:'fold',anchor:[960,500]},
 {name:'A region is not all existence',kind:'extent',from:22,to:23,transition:'orbit',anchor:[960,500]},
 {name:'Two descriptions must meet',kind:'quantum',from:24,to:27,transition:'grid',anchor:[960,500]},
 {name:'The assumed road of time',kind:'road',from:28,to:29,transition:'curtain',anchor:[960,500]},
 {name:'An event outside a map',kind:'map',from:30,to:31,transition:'page',anchor:[960,500]},
 {name:'A finite hypothetical bounce',kind:'bounce',from:32,to:33,transition:'wave',anchor:[960,550]},
 {name:'A picture must face evidence',kind:'bounce-test',from:34,to:35,transition:'lens',anchor:[1450,510]},
 {name:'An expanding field patch',kind:'inflation',from:36,to:37,transition:'grid',anchor:[960,500]},
 {name:'Disconnected hypothetical histories',kind:'multiverse',from:38,to:40,transition:'orbit',anchor:[960,500]},
 {name:'Empty is still a framework',kind:'vacuum',from:41,to:43,transition:'curtain',anchor:[960,500]},
 {name:'Different levels of knowledge',kind:'synthesis',from:44,to:45,transition:'page',anchor:[960,500]},
 {name:'Measuring, predicting and testing',kind:'observatory',from:46,to:46,transition:'lens',anchor:[1450,510]},
 {name:'Cosmic material, human life',kind:'human',from:47,to:49,transition:'orbit',anchor:[1340,500]},
 {name:'Rewind with a new interpretation',kind:'return',from:50,to:50,transition:'spiral',anchor:[960,500]},
 {name:'An unfinished explanation',kind:'ending',from:51,to:52,transition:'tear',anchor:[960,500]},
] as const;
type Section=typeof filmSections[number];
const start=(s:Section)=>timing.visualBeats[s.from-1].startFrame;
const finish=(s:Section)=>timing.visualBeats[s.to-1].endFrame;
const sectionIndex=(f:number)=>Math.max(0,filmSections.findIndex(s=>f>=start(s)&&f<finish(s)));

const Sprite:React.FC<{sheet:string;cell:number;x:number;y:number;size:number;angle?:number;sx?:number;sy?:number;alpha?:number}>=({sheet,cell,x,y,size,angle=0,sx=1,sy=1,alpha=1})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${sx} ${sy})`} opacity={alpha}><image href={staticFile(`${A}${sheet}-${cell}.png`)} x={-size/2} y={-size/2} width={size} height={size}/></g>;
const Glow:React.FC<{x:number;y:number;r:number;color?:string}>=({x,y,r,color=P.gold})=><g><circle cx={x} cy={y} r={r*1.8} fill={color} opacity=".025"/><circle cx={x} cy={y} r={r*1.3} fill={color} opacity=".05"/><circle cx={x} cy={y} r={r} fill={color} opacity=".09"/></g>;
const Spark:React.FC<{x:number;y:number;r?:number;color?:string;angle?:number}>=({x,y,r=9,color=P.cream,angle=0})=><path transform={`translate(${x} ${y}) rotate(${angle})`} d={`M0 ${-r}Q${r*.16} ${-r*.16} ${r} 0Q${r*.16} ${r*.16} 0 ${r}Q${-r*.16} ${r*.16} ${-r} 0Q${-r*.16} ${-r*.16} 0 ${-r}Z`} fill={color}/>;
const Dot:React.FC<{x:number;y:number;r?:number;teal?:boolean}>=({x,y,r=25,teal=false})=><g><circle cx={x+2} cy={y+4} r={r} fill={P.ink} opacity=".2"/><circle cx={x} cy={y} r={r} fill={`url(#${teal?'neutron':'proton'})`}/><ellipse cx={x-r*.26} cy={y-r*.36} rx={r*.46} ry={r*.23} transform={`rotate(-28 ${x} ${y})`} fill={P.cream} opacity=".35"/></g>;
const Nucleus:React.FC<{x:number;y:number;r?:number;protons?:number;neutrons?:number;spread?:number;spin?:number}>=({x,y,r=120,protons=1,neutrons=0,spread=1,spin=0})=>{
 const n=protons+neutrons;
 return <g transform={`translate(${x} ${y}) rotate(${spin})`}>{Array.from({length:n},(_,i)=>{const a=i*2.39996,rad=n===1?0:Math.sqrt((i+.2)/n)*r*.64*spread;return <Dot key={i} x={Math.cos(a)*rad} y={Math.sin(a)*rad*.83} r={n<3?r*.5:r*.29} teal={i>=protons}/>;})}</g>;
};
const InfinityMark:React.FC<{x:number;y:number;scale?:number;draw?:number}>=({x,y,scale=1,draw=1})=><path transform={`translate(${x} ${y}) scale(${scale})`} d="M0 0C-45-70-155-75-160 0S-45 70 0 0C45-70 155-75 160 0S45 70 0 0" fill="none" stroke={P.gold} strokeWidth="14" strokeLinecap="round" pathLength="1" strokeDasharray={`${draw} 1`}/>;
const Question:React.FC<{x:number;y:number;r?:number;draw?:number}>=({x,y,r=1,draw=1})=><g transform={`translate(${x} ${y}) scale(${r})`}><path d="M-43-45C-48-113 61-124 68-57C73-12 12-14 13 35" fill="none" stroke={P.cream} strokeWidth="18" strokeLinecap="round" pathLength="1" strokeDasharray={`${draw} 1`}/><circle cx="13" cy="76" r={10*draw} fill={P.gold}/></g>;

// Distant scenery is generated geometry, not a flattened universe plate. Layers
// respond to the scene's expansion, passing waves or camera depth separately.
type Theme='cosmic'|'amber'|'mint'|'ice'|'violet'|'dusk';
const Sky:React.FC<{f:number;warm?:number;quiet?:boolean;noStars?:boolean;theme?:Theme}>=({f,warm=0,quiet=false,noStars=false,theme='cosmic'})=>{
 const t=f/30;
 return <><rect width="1920" height="1080" fill={`url(#${theme==='cosmic'?'night-sky':'sky-'+theme})`}/>{warm>0&&<rect width="1920" height="1080" fill="url(#warm-sky)" opacity={clamp(warm)}/>}
  {[0,1,2].map(i=>{const drift=Math.sin(t*.055+i)*28;return <path key={i} transform={`translate(${drift} ${Math.sin(t*.04+i)*16})`} d={`M-300 ${160+i*310}C260 ${-120+i*310} 420 ${550+i*150} 1120 ${260+i*240}S1920 ${120+i*200} 2220 ${330+i*230}L2220 ${470+i*240}C1400 ${100+i*190} 850 ${670+i*160} -300 ${310+i*310}Z`} fill={[P.violet,P.blue,P.coral][i]} opacity={quiet?.035:.065}/>;})}
  {!noStars&&Array.from({length:quiet?28:64},(_,i)=>{const z=.2+rnd(i+30)*.8,x=rnd(i+1)*2060-70-t*z*.45;return <g key={i} opacity={.22+z*.5}>{i%9===0?<Spark x={x} y={rnd(i+90)*1000} r={3+z*5} color={i%3?P.cream:P.teal}/>:<circle cx={x} cy={rnd(i+90)*1000} r={1+z*1.7} fill={P.cream}/>}</g>;})}
 </>;
};
const Galaxy:React.FC<{x:number;y:number;r?:number;angle?:number;spin?:number;alpha?:number;cell?:number}>=({x,y,r=220,angle=0,spin=0,alpha=1,cell=0})=><g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={alpha}>
 <Sprite sheet="galaxies-atlas" cell={cell} x={0} y={0} size={r*2} angle={spin}/>
 {[0,1,2].map(i=><ellipse key={i} rx={r*(.38+i*.19)} ry={r*(.16+i*.08)} transform={`rotate(${spin*.3+i*50})`} fill="none" stroke={i%2?P.teal:P.lilac} strokeWidth="1.5" opacity=".12"/>)}
</g>;
const Field:React.FC<{f:number;scale?:number;cx?:number;cy?:number;count?:number;dots?:boolean}>=({f,scale=1,cx=960,cy=500,count=17,dots=false})=><g>{Array.from({length:count},(_,i)=>{
 const col=i%5,row=Math.floor(i/5),x=cx+(col*435-880+(row%2)*150)*scale,y=cy+(row*290-435)*scale;
 return dots?<Dot key={i} x={x} y={y} r={12+scale*6} teal={i%3===0}/>:<Galaxy key={i} x={x} y={y} r={(60+rnd(i+21)*65)*(.65+scale*.35)} cell={i%6} angle={rnd(i+7)*85-40} spin={f*.0012}/>;
})}</g>;
const Wave:React.FC<{x:number;y:number;length?:number;lambda?:number;amp?:number;color?:string;phase?:number;thick?:number}>=({x,y,length=300,lambda=70,amp=20,color=P.gold,phase=0,thick=5})=>{
 const pts=Array.from({length:81},(_,i)=>{const xx=i/80*length;return `${i?'L':'M'}${x+xx},${y+Math.sin(xx/lambda*tau+phase)*amp}`;}).join('');
 return <path d={pts} fill="none" stroke={color} strokeWidth={thick} strokeLinecap="round"/>;
};
const Geometry:React.FC<{f:number;mass?:number;scale?:number;alpha?:number;center?:Point}>=({f,mass=0,scale=1,alpha=.38,center=[960,590]})=>{
 const [cx,cy]=center;
 return <g fill="none" stroke={P.teal} strokeWidth="2" opacity={alpha}>
 {Array.from({length:15},(_,i)=>{const y=cy+(i-7)*67*scale,d=mass*155*Math.exp(-(((y-cy)/260)**2));return <path key={'h'+i} d={`M-500 ${y}C${cx-440} ${y} ${cx-240} ${y+d} ${cx} ${y+d}S${cx+500} ${y} 2420 ${y}`}/>;})}
 {Array.from({length:21},(_,i)=>{const x=cx+(i-10)*105*scale,b=(cx-x)*mass*.27;return <path key={'v'+i} d={`M${x} -150C${x} 260 ${x+b} ${cy+20} ${x} 1190`}/>;})}
 </g>;
};
const Photon:React.FC<{x:number;y:number;angle?:number;size?:number;color?:string}>=({x,y,angle=0,size=1,color=P.gold})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}><Wave x={-65} y={0} length={130} lambda={36} amp={10} color={color} thick={4}/><Spark x={65} y={0} r={9} color={color}/></g>;
const OrbitalAtom:React.FC<{x:number;y:number;r?:number;f:number;capture?:number;angle?:number}>=({x,y,r=190,f,capture=1,angle=0})=><g transform={`translate(${x} ${y}) rotate(${angle})`}>
 <ellipse rx={r} ry={r*.42} transform="rotate(-22)" fill="none" stroke={P.teal} strokeWidth="3" opacity={capture*.5}/>
 <ellipse rx={r} ry={r*.42} transform="rotate(62)" fill="none" stroke={P.lilac} strokeWidth="2" opacity={capture*.33}/>
 <Nucleus x={0} y={0} r={r*.35} protons={2} neutrons={2}/>
 {[0,1].map(i=>{const a=f*.035+i*Math.PI;return <circle key={i} cx={Math.cos(a)*r*mix(2.5,1,capture)} cy={Math.sin(a)*r*.42*mix(2.5,1,capture)} r={r*.06} fill={P.cream}/>;})}
</g>;
const Telescope:React.FC<{x:number;y:number;s?:number;aim?:number;detected?:number}>=({x,y,s=1,aim=0,detected=0})=><g transform={`translate(${x} ${y}) scale(${s})`}>
 <ellipse cy="235" rx="160" ry="22" fill={P.ink} opacity=".35"/>
 <path d="M-18 55L-127 224M0 65L96 224M0 60V228" fill="none" stroke={P.blue} strokeWidth="19" strokeLinecap="round"/>
 <path d="M-8 45V138" stroke={P.gold} strokeWidth="29"/><circle cy="37" r="43" fill={P.deep}/><circle cy="37" r="25" fill={P.gold}/>
 <g transform={`rotate(${-28+aim} 0 10)`}><rect x="-150" y="-62" width="270" height="118" rx="24" fill={P.cream}/><rect x="-130" y="-62" width="57" height="118" rx="15" fill={P.gold}/><path d="M-120 23H75V49H-120Z" fill={P.orange} opacity=".45"/><rect x="95" y="-76" width="57" height="146" rx="16" fill={P.teal}/><ellipse cx="143" cy="-3" rx="26" ry="59" fill={P.deep}/><ellipse cx="147" cy="-10" rx="18" ry="42" fill={P.blue}/><ellipse cx="147" cy="-14" rx="8" ry="23" fill={P.teal} opacity={.5+detected*.5}/><rect x="-189" y="-22" width="45" height="39" rx="8" fill={P.purple}/></g>
</g>;
const Dish:React.FC<{x:number;y:number;s?:number;active?:number}>=({x,y,s=1,active=0})=><g transform={`translate(${x} ${y}) scale(${s})`}>
 <path d="M-12 90L-65 235H65L12 90" fill={P.blue}/><path d="M-165-85Q-65 175 150 15Z" fill={P.lilac}/><path d="M-165-85Q-70 85 150 15" fill="none" stroke={P.cream} strokeWidth="12"/><path d="M-165-85L20-42L150 15M-55 73L20-42" fill="none" stroke={P.violet} strokeWidth="7"/><circle cx="20" cy="-42" r="13" fill={P.gold}/><circle cx="20" cy="-42" r={18+active*35} fill="none" stroke={P.gold} strokeWidth="3" opacity={active}/>
</g>;

const BoundaryLine:React.FC<{f:number;gap?:number}>=({f,gap=0})=><g>
 <path d={`M1080-80C1005 160 1110 295 ${1060-gap*45} 480S1120 790 1060 1160`} fill="none" stroke={P.gold} strokeWidth="7"/>
 {Array.from({length:9},(_,i)=><path key={i} d={`M${1120+i*62} ${80+i*33}Q${1040+i*75} 510 ${1135+i*65} ${1000-i*23}`} stroke={P.lilac} strokeWidth="2" strokeDasharray="4 16" fill="none" opacity={.28*(1-i/11)}/>)}
 {Array.from({length:12},(_,i)=>{const a=q(f,i*7,i*7+20);return <path key={'p'+i} d={`M${1058+(i%2)*9} ${i*100}l${-25-a*45} ${-10+i%3*8}`} stroke={P.cream} strokeWidth="3" opacity={.5}/>;})}
</g>;

type StageProps={section:Section;frame:number;id:string};
const Scene:React.FC<StageProps>=({section:s,frame:f,id})=>{
 const local=f-start(s),t=local/30,span=(finish(s)-start(s))/30,p=clamp(t/span);
 const b=timing.visualBeats.find(v=>v.id>=s.from&&v.id<=s.to&&f<v.endFrame)||timing.visualBeats[s.to-1];
 const bt=(f-b.startFrame)/30,bp=clamp((f-b.startFrame)/(b.endFrame-b.startFrame));
 const B=(n:number)=>{const v=timing.visualBeats[n-1];return clamp((f-v.startFrame)/(v.endFrame-v.startFrame));};
 const theme:Theme=['road','map','room'].includes(s.kind)?'amber':['quantum','vacuum','inflation'].includes(s.kind)?'mint':['tested','boundary','ending'].includes(s.kind)?'violet':['evidence','three','synthesis'].includes(s.kind)?'ice':'cosmic';
 const background=<Sky f={f} theme={theme} quiet={['boundary','tested','quantum','vacuum','ending'].includes(s.kind)} noStars={['plasma','recombination','nuclei','inflation','vacuum','quantum','road','map'].includes(s.kind)}/>;

 if(s.kind==='rewind'||s.kind==='return'){
  const late=s.kind==='return',phase=late?p*3:(b.id===1?bp*.4:b.id===2?.4+bp*.5:b.id===3?.9+bp:b.id===4?1.9+bp:0);
  const gather=q(phase,0,.9),star=q(phase,.78,1.32),atom=q(phase,1.65,2.3),heat=q(phase,2.45,3);
  return <>{background}<g opacity={1-star}><Field f={f} scale={mix(1.3,.5,gather)} count={18}/></g>
   <g opacity={star*(1-atom)}><Glow x={960} y={500} r={300}/><Sprite sheet="stellar-atlas" cell={3} x={960} y={500} size={1100} angle={-local*.025}/><Sprite sheet="stellar-atlas" cell={0} x={960} y={500} size={mix(480,160,q(phase,1.1,1.9))}/>
    {Array.from({length:13},(_,i)=>{const a=i/13*tau,rr=mix(640,130,q(phase,1,1.7));return <Spark key={i} x={960+Math.cos(a)*rr} y={500+Math.sin(a)*rr*.65} r={9*(1-atom)} color={P.gold}/>;})}</g>
   <g opacity={atom}><OrbitalAtom x={960} y={500} r={310} f={f} capture={1-q(phase,2.35,3)}/><Glow x={960} y={500} r={260*heat} color={P.coral}/></g>
   {Array.from({length:8},(_,i)=>{const a=i*tau/8,r=mix(850,200,gather);return <path key={i} d={`M${960+Math.cos(a)*r} ${500+Math.sin(a)*r*.65}q${Math.cos(a+.4)*100} ${Math.sin(a+.4)*70} ${Math.cos(a)*180} ${Math.sin(a)*110}`} stroke={P.lilac} strokeWidth="2" fill="none" opacity={.18*(1-star)}/>;})}
  </>;
 }
 if(s.kind==='plasma'){
  const squeeze=q(t,0,8),collapse=q(t,9,12),spin=t*.5;
  return <><Sky f={f} warm={1} noStars/>
   {[0,1,2,3,4].map(i=><path key={i} transform={`translate(960 500) rotate(${i*72+t*3})`} d={`M-1600-100C-600 ${-500+squeeze*180} 100 ${550-squeeze*180} 1400 100L1600 380C300 700-300-450-1600 130Z`} fill={i%2?P.coral:P.orange} opacity=".09"/>)}
   <Geometry f={f} scale={mix(1.4,.32,squeeze)} alpha={.08}/>
   {Array.from({length:45},(_,i)=>{const a=rnd(i+4)*tau+spin*.15,r=Math.sqrt(rnd(i+70))*mix(1000,140,squeeze),x=960+Math.cos(a)*r,y=500+Math.sin(a)*r*.6;return <g key={i} opacity={1-collapse*.78}><path d={`M${x-25} ${y+18}l-22 13`} stroke={P.orange} strokeWidth="3" opacity=".3"/><Dot x={x} y={y} r={13+rnd(i+34)*17} teal={i%3===0}/></g>;})}
   <Glow x={960} y={500} r={mix(130,410,squeeze)} color={P.orange}/>
   <g transform={`translate(960 500) scale(${.5+squeeze*.5})`}><path d={`M-360 170Q0 ${350-squeeze*150} 360 170M-360-170Q0 ${-350+squeeze*150} 360-170`} fill="none" stroke={P.coral} strokeWidth="5" opacity=".5"/></g>
   {t>3&&<InfinityMark x={960} y={480} scale={1.1+collapse*.2} draw={q(t,3,5)}/>}
   <g opacity={q(t,7.8,10)}><BoundaryLine f={local}/></g>
  </>;
 }
 if(s.kind==='boundary'||s.kind==='ending'){
  const end=s.kind==='ending',reveal=q(t,end?0:1,end?4:6),question=q(t,end?2:4,end?6:9);
  return <>{background}<Geometry f={f} mass={.4} alpha={.2}/>
   <g>{Array.from({length:18},(_,i)=>{const col=i%6,row=Math.floor(i/6),detach=q(t,1+i*.06,3+i*.06);return <g key={i} transform={`translate(${150+col*142-detach*(col>3?35:0)} ${270+row*160+detach*(col>3?50:0)}) rotate(${detach*(col>3?15:0)})`} opacity={1-detach*(col>3?.7:.1)}><path d="M0 0H116L125 125H9Z" fill={i%3?P.purple:P.blue} fillOpacity=".3" stroke={P.teal} strokeOpacity=".25" strokeWidth="2"/><path d="M10 65Q60 10 111 65" fill="none" stroke={P.lilac} strokeWidth="2" opacity=".3"/></g>;})}</g>
   <BoundaryLine f={local} gap={reveal}/>
   {!end&&<g opacity={1-q(t,1,4)}><InfinityMark x={835} y={470} scale={.8}/></g>}
   <Question x={1350} y={485} r={1.4} draw={question}/>
   {Array.from({length:4},(_,i)=>{const u=q(t,i*.45+1,i*.45+5),x=mix(280+i*120,950,u);return <circle key={i} cx={x} cy={745+i%2*70} r="7" fill={P.gold}/>;})}
   <path d="M140 930C430 740 780 920 1040 820" fill="none" stroke={P.gold} strokeWidth="4" opacity={.35*reveal}/>
  </>;
 }
 if(s.kind==='three'||s.kind==='synthesis'){
  const summary=s.kind==='synthesis',a=q(t,0,3),c=q(t,summary?4:8,summary?11:12);
  return <>{background}
   <path d="M-120 1080L-120 810Q340 675 1030 795L1060 1080ZM1110 1080L1130 875Q1580 690 2040 770V1080Z" fill="#3F305C"/>
   <path d="M-80 990Q300 790 880 860M1220 1010Q1630 800 2020 900" stroke={P.violet} strokeWidth="5" fill="none" opacity=".25"/>
   <path d="M150 790C560 970 1120 890 1760 760" stroke={P.purple} strokeWidth="18" fill="none"/>
   {[0,1,2].map(i=>{const u=q(t,i*(summary?.4:2),i*(summary?.4:2)+2),x=380+i*580,y=mix(610,440,u);return <g key={i} transform={`translate(${x} ${y}) scale(${.65+u*.35})`}>
    <ellipse cy="375" rx="210" ry="28" fill={P.ink} opacity=".35"/>
    <circle r="208" fill={P.deep} stroke={i===2?P.lilac:P.teal} strokeWidth={i===2?3:5} strokeDasharray={i===2?'9 15':undefined}/>
    {i===0?<><Galaxy x={-30} y={-10} r={185} cell={1} spin={local*.009}/><path d="M-173 150A230 230 0 0 1 170-145" fill="none" stroke={P.cream} strokeWidth="3" strokeDasharray="5 9"/></>:i===1?<><Glow x={0} y={0} r={145} color={P.orange}/>{Array.from({length:14},(_,k)=><Dot key={k} x={Math.cos(k*2.4)*Math.sqrt(k)*35} y={Math.sin(k*2.4)*Math.sqrt(k)*32} r={15} teal={k%3===0}/>)}<Wave x={-145} y={120} length={290} color={P.gold} phase={-t}/></>:<><Question x={0} y={0} r={.9} draw={u}/><path d="M-115 132L-65 180M-50 180L5 132M25 132L80 180" stroke={P.lilac} strokeWidth="3" fill="none"/></>}
    <path d="M-180 280H180" stroke={i===2?P.lilac:P.teal} strokeWidth="8" strokeLinecap="round"/>
    {(summary&&i<2)&&<path d="M-25 278l20 20 42-48" fill="none" stroke={P.cream} strokeWidth="8" strokeLinecap="round"/>}
   </g>;})}
   <g opacity={c}><path d="M590 440H735M1170 440H1315" fill="none" stroke={P.gold} strokeWidth="4" strokeDasharray="3 12"/><circle cx={mix(590,735,(t*.23)%1)} cy="440" r="6" fill={P.gold}/></g>
   {summary&&<path d="M1280 830Q1490 920 1690 775" stroke={P.gold} strokeWidth="5" fill="none" pathLength="1" strokeDasharray={`${a} 1`}/>}
  </>;
 }
 if(s.kind==='redshift'){
  const exp=q(t,1,8),reverse=q(t,9,14),scale=1+exp*.65-reverse*.95;
  const left=960-530*scale,right=960+530*scale,waveX=mix(left+120,right-100,clamp((t-2)/6));
  return <>{background}<Geometry f={f} mass={0} scale={scale} alpha={.19}/>
   <Galaxy x={left} y={480} r={220} cell={1} spin={t*.3}/><Galaxy x={right} y={480} r={200} cell={0} spin={-t*.4}/>
   <path d={`M${left} 760v35H${right}v-35`} fill="none" stroke={P.teal} strokeWidth="4"/>
   {Array.from({length:9},(_,i)=><circle key={i} cx={mix(left,right,i/8)} cy="795" r={i%4?3:7} fill={P.teal}/>)}
   <Wave x={left+120} y={480} length={Math.max(80,right-left-240)} lambda={mix(45,125,exp)} amp={22} color={exp>.6?P.coral:P.gold} phase={-t*3}/>
   <Spark x={waveX} y={480} r={14} color={P.gold}/>
   <g opacity={reverse*.6}><Glow x={960} y={500} r={340} color={P.orange}/><Dot x={960} y={500} r={25}/></g>
  </>;
 }
 if(s.kind==='recombination'){
  const capture=q(t,1,7),free=q(t,6,11),stretch=q(t,10,18);
  return <><Sky f={f} noStars warm={1-capture}/>
   {Array.from({length:12},(_,i)=>{const col=i%4,row=Math.floor(i/4),x=220+col*475,y=220+row*290,a=f*.02+i;return <g key={i}><Nucleus x={x} y={y} r={54}/><ellipse cx={x} cy={y} rx="82" ry="39" fill="none" stroke={P.teal} strokeWidth="2" opacity={capture*.5}/><circle cx={x+Math.cos(a)*mix(190,82,capture)} cy={y+Math.sin(a)*mix(90,39,capture)} r="9" fill={P.cream}/></g>;})}
   {Array.from({length:9},(_,i)=>{const y=160+i*92,travel=((t*90+i*217)%2300)-200,x=mix(400+Math.sin(t*2+i)*230,travel,free);return <g key={i}><Photon x={x} y={y+Math.sin(t*3+i)*(1-free)*45} angle={(1-free)*Math.sin(t*2+i)*90} color={stretch>.5?P.coral:P.gold} size={.6+stretch*.55}/>{!free&&<path d={`M${x-80} ${y+20}l45-35 35 15`} stroke={P.gold} opacity=".16" fill="none" strokeWidth="3"/>}</g>;})}
   <g transform={`translate(${mix(2150,1510,q(t,12,16))} 690)`}><Dish x={0} y={0} s={.75} active={q(t,16,18)}/></g>
   <g opacity={q(t,14,18)}><Wave x={220} y={825} length={900} lambda={mix(35,180,stretch)} amp={40} phase={-t*1.3} color={P.coral}/><path d="M220 900H1120" stroke={P.lilac} opacity=".3" strokeWidth="3"/></g>
  </>;
 }
 if(s.kind==='nuclei'){
  const join=q(t,1.6,4.5),deuterium=q(t,4.5,7.5),settle=Math.exp(-Math.max(0,t-4.5)*3)*Math.sin(Math.max(0,t-4.5)*10)*10;
  return <><Sky f={f} warm={1} noStars/>
   <path d="M-100 850C430 650 1350 1040 2020 750V1080H-100Z" fill={P.purple} opacity=".4"/>
   <Nucleus x={350} y={480} r={150}/>
   <Nucleus x={960} y={480+settle} r={180} protons={2} neutrons={2} spread={mix(3.6,1,join)} spin={mix(-30,0,join)}/>
   <Nucleus x={1550} y={480} r={155} protons={1} neutrons={1} spread={mix(2.7,1,deuterium)}/>
   {[350,960,1550].map((x,i)=><g key={x}><ellipse cx={x} cy="745" rx="205" ry="35" fill={P.ink} opacity=".24"/><path d={`M${x-130} 790H${x+130}`} stroke={P.cream} strokeWidth="3" opacity=".3"/>{Array.from({length:i===0?17:i===1?6:2},(_,k)=><circle key={k} cx={x-125+k*15} cy="815" r="4" fill={i===1?P.teal:P.coral}/>)}</g>)}
   {Array.from({length:7},(_,i)=>{const age=clamp((t-4.4-i*.03)/.8),ang=i/7*tau;return <Spark key={i} x={960+Math.cos(ang)*(70+age*180)} y={480+Math.sin(ang)*(70+age*130)} r={10*Math.sin(age*Math.PI)} color={P.gold}/>;})}
  </>;
 }
 if(s.kind==='evidence'){
  const collect=q(t,1,8),unknown=q(t,9,14);
  return <>{background}<path d="M110 900H1810" stroke={P.purple} strokeWidth="8"/>
   <Telescope x={1450} y={620} s={1.1} aim={-q(t,0,3)*10} detected={collect}/>
   {[0,1,2].map(i=>{const tt=q(t,1+i*1.7,4+i*1.7),x=mix(290,1390,tt),y=mix(230+i*245,510,tt),size=mix(1,.25,tt);return <g key={i} transform={`translate(${x} ${y}) scale(${size})`}>{i===0?<Galaxy x={0} y={0} r={130} cell={1}/>:i===1?<Wave x={-140} y={0} length={280} lambda={60} amp={30}/>:<Nucleus x={0} y={0} r={105} protons={2} neutrons={2}/>}</g>;})}
   <path d="M1260 600C1050 890 730 930 430 750" fill="none" stroke={P.teal} strokeWidth="5" pathLength="1" strokeDasharray={`${collect} 1`}/>
   <g opacity={collect}><circle cx="465" cy="660" r="145" fill={P.orange} opacity=".12"/><Dot x={465} y={660} r={49}/><path d="M465 810V865" stroke={P.gold} strokeWidth="4"/></g>
   <g opacity={unknown}><path d="M330 660H145" stroke={P.lilac} strokeWidth="5" strokeDasharray="6 13"/><Question x={120} y={655} r={.55}/></g>
  </>;
 }
 if(s.kind==='gravity'||s.kind==='compression'){
  const compress=s.kind==='compression',land=q(t,1,4),rev=compress?q(t,1,12):q(t,9,14)*.2,scale=mix(1.3,.29,rev),mass=compress?.7:land;
  return <>{background}<Geometry f={f} mass={mass} scale={scale} alpha={.48}/>
   {!compress&&<><Sprite sheet="props-atlas" cell={0} x={960} y={mix(50,510,land)+Math.sin(Math.max(0,t-4)*7)*Math.exp(-Math.max(0,t-4)*2)*20} size={330} angle={t*.4}/>
    {Array.from({length:6},(_,i)=>{const a=i*tau/6+t*.08;return <circle key={i} cx={960+Math.cos(a)*390} cy={620+Math.sin(a)*125+land*20} r="10" fill={P.gold}/>;})}
    <path d={`M430 500Q960 ${500+land*410} 1490 500`} fill="none" stroke={P.gold} strokeWidth="4" strokeDasharray="5 15"/>
   </>}
   {compress&&<>
    {Array.from({length:24},(_,i)=>{const x=960+(i%6-2.5)*290*scale,y=500+(Math.floor(i/6)-1.5)*215*scale;return <Dot key={i} x={x} y={y} r={mix(17,26,rev)} teal={i%3===0}/>;})}
    <Glow x={960} y={500} r={290*rev} color={P.coral}/>
    <g opacity={q(t,8,12)}><BoundaryLine f={local}/><InfinityMark x={1380} y={460} scale={.8} draw={q(t,10,15)}/></g>
    <path d={`M${960-410*scale} 800v35H${960+410*scale}v-35`} stroke={P.gold} strokeWidth="4" fill="none"/>
   </>}
  </>;
 }
 if(s.kind==='tested'){
  const infinity=B(16),advance=q(t,1,6),breakup=q(t,6,10),question=q(infinity,.3,.8);
  const x=mix(290,1080,advance);
  return <>{background}
   <path d="M-120 1080L-120 810Q340 675 1030 795L1060 1080ZM1110 1080L1130 1000Q1580 960 2040 1010V1080Z" fill="#3F305C"/>
   <path d="M-80 990Q300 790 880 860" stroke={P.violet} strokeWidth="5" fill="none" opacity=".25"/>
   <path d="M-90 850Q360 560 1040 710" stroke={P.purple} strokeWidth="100" fill="none"/>
   {Array.from({length:13},(_,i)=>{const unsupported=i>7,fall=unsupported?breakup*(i-7)*40:0;return <g key={i} transform={`translate(${80+i*120} ${710+fall}) rotate(${unsupported?breakup*12:0})`} opacity={unsupported?1-breakup*.6:1}>
    <path d="M-50 0L50-14L65 35L-38 50Z" fill={unsupported?P.violet:P.blue} stroke={unsupported?P.lilac:P.teal} strokeWidth="3" strokeDasharray={unsupported?'6 8':undefined}/>
    {!unsupported&&<path d="M-22 80V185M25 67V178" stroke={P.purple} strokeWidth="11"/>}
   </g>;})}
   <circle cx={x} cy={650-Math.sin(advance*Math.PI)*65} r="28" fill={P.gold}/><path d={`M${x-65} ${650-Math.sin(advance*Math.PI)*65}h-80`} stroke={P.gold} strokeWidth="3" opacity={advance*(1-advance)}/>
   <BoundaryLine f={local}/>
   <g opacity={q(infinity,0,.25)*(1-question)}><InfinityMark x={1400} y={440} draw={q(infinity,0,.3)}/></g>
   <g opacity={question}><Question x={1380} y={450} r={1.2} draw={question}/></g>
   <path d="M240 440Q620 80 1035 375" stroke={P.teal} strokeWidth="3" fill="none" opacity=".35"/>
   {Array.from({length:7},(_,i)=><circle key={i} cx={220+i*110} cy={420-Math.sin(i/7*Math.PI)*160} r="5" fill={P.teal}/>)}
  </>;
 }
 if(s.kind==='room'){
  const explode=B(18),ex=q(explode,.25,.65),room=B(19),pull=q(room,0,.55),initial=q(B(17),0,1);
  return <><rect width="1920" height="1080" fill="#19152F"/>
   <g transform={`translate(960 520) scale(${mix(1.9,1,Math.max(initial*.25,pull))}) translate(-960 -520)`}>
    <path d="M200 120H1720V930H200Z" fill={P.deep}/><path d="M200 120L550 300V760L200 930Z" fill="#302246"/><path d="M1720 120L1370 300V760L1720 930Z" fill="#392951"/><path d="M200 930L550 760H1370L1720 930Z" fill="#493052"/><path d="M550 300H1370V760H550Z" fill="#100F29"/>
    <g stroke={P.violet} strokeWidth="2" fill="none" opacity={.1+pull*.5}><path d="M200 120L550 300M1720 120L1370 300M200 930L550 760M1720 930L1370 760M550 300V760H1370V300Z"/>
     {[0,1,2,3,4].map(i=><path key={i} d={`M${200+i*380} 930L${550+i*205} 760`}/>)}</g>
    <Glow x={960} y={500} r={80*(1-ex)+ex*250}/><circle cx="960" cy="500" r={mix(34,8,ex)} fill={P.cream}/>
    {Array.from({length:8},(_,i)=>{const a=i*tau/8;return <Galaxy key={i} x={960+Math.cos(a)*ex*370} y={500+Math.sin(a)*ex*190} r={60*ex} cell={i%6} spin={t*.3}/>;})}
    <g opacity={pull}><path d="M185 120H120V930H185M1735 120H1800V930H1735" stroke={P.coral} strokeWidth="5" fill="none"/><Question x={1605} y={420} r={.65} draw={pull}/></g>
   </g>
  </>;
 }
 if(s.kind==='expansion'||s.kind==='extent'){
  const extent=s.kind==='extent',exp=extent?.4+q(t,0,13)*.28:q(t,1,12),change=extent?q(t,9,17):B(21),scale=extent?mix(.8,.49,q(t,5,17)):mix(.48,1.12,exp);
  const cx=mix(960,1240,change),rew=extent?B(23):0,insideScale=mix(scale,.23,q(rew,.1,.9));
  return <>{background}<Geometry f={f} scale={scale} alpha={.18}/>
   <Field f={f} scale={scale} cx={cx} count={35}/>
   {!extent&&<g opacity={1-q(t,1,4)}><path d="M0 0L420 220V840L0 1080M1920 0L1500 220V840L1920 1080" fill={P.deep} stroke={P.violet} strokeWidth="5"/></g>}
   {!extent&&<g opacity={q(B(21),0,.3)}><circle cx={mix(540,1340,change)} cy={490} r="90" stroke={P.gold} strokeWidth="4" fill={P.ink} fillOpacity=".4"/><path d={`M${mix(540,1340,change)-25} 490h50m-25-25v50`} stroke={P.gold} strokeWidth="3"/></g>}
   {extent&&<>
    <defs><clipPath id={`${id}-region`}><ellipse cx="960" cy="500" rx={520*(1-rew*.58)} ry={330*(1-rew*.58)}/></clipPath></defs>
    <rect width="1920" height="1080" fill={P.ink} opacity={.5*q(t,2,6)}/>
    <g clipPath={`url(#${id}-region)`}><Sky f={f} quiet/><Geometry f={f} scale={insideScale} alpha={.16}/><Field f={f} scale={insideScale} count={25}/></g>
    <ellipse cx="960" cy="500" rx={520*(1-rew*.58)} ry={330*(1-rew*.58)} fill="none" stroke={P.gold} strokeWidth="5" strokeDasharray="10 14"/>
    <path d={`M${960-520*(1-rew*.58)} 875v35H${960+520*(1-rew*.58)}v-35`} stroke={P.teal} strokeWidth="3" fill="none"/>
    <path d="M-80 90H200M1720 90H2000M-80 950H200M1720 950H2000" stroke={P.lilac} strokeWidth="3" strokeDasharray="4 14"/>
   </>}
  </>;
 }
 if(s.kind==='quantum'){
  const combine=q(B(25),0,1),missing=B(26),end=B(27),split=1-combine*.7;
  return <>{background}
   <g transform={`translate(${mix(50,400,combine)} 0)`}>
    <path d={`M150 600C250 ${300+Math.sin(t)*35} 390 ${810-Math.cos(t)*25} 610 480S750 300 810 510`} fill="none" stroke={P.lilac} strokeWidth="8" opacity=".7"/>
    <OrbitalAtom x={430} y={480} r={180} f={f} capture={1}/>
    {Array.from({length:7},(_,i)=>{const x=180+i*93,y=490+Math.sin(i*.9+t*.7)*110;return <circle key={i} cx={x} cy={y} r={4} fill={P.cream}/>;})}
   </g>
   <g transform={`translate(${mix(810,510,combine)} 0)`}>
    <Geometry f={f} center={[500,530]} mass={.8} scale={.75} alpha={.25}/><Sprite sheet="props-atlas" cell={0} x={500} y={470} size={260}/>
   </g>
   <path d={`M${960-70*split} 150V850M${960+70*split} 150V850`} stroke={P.gold} strokeWidth="3" strokeDasharray="8 14" opacity={.35*(1-combine)}/>
   <g opacity={q(missing,0,.25)}><path d="M850 380L920 345L955 390L1000 345L1070 380V620L1010 655L965 610L920 655L850 620Z" fill={P.ink} stroke={P.gold} strokeWidth="4" strokeDasharray="8 12"/><Question x={960} y={500} r={.65} draw={q(missing,.1,.5)}/></g>
   <g opacity={q(missing,.45,.9)}><path d="M480 760Q650 910 875 740M1440 760Q1250 910 1045 740" stroke={P.teal} fill="none" strokeWidth="5" pathLength="1" strokeDasharray={`${q(missing,.4,.85)} 1`}/></g>
   <g opacity={end}><BoundaryLine f={local}/></g>
  </>;
 }
 if(s.kind==='road'){
  const road=B(29),unroll=q(t,1,8),boundary=q(road,.25,.75);
  return <>{background}
   <path d="M-150 370Q280 90 620 350T1330 270T2100 200V1080H-150Z" fill="#5B4968"/>
   <path d="M-150 600Q260 380 510 630T1130 510T2100 400V1080H-150Z" fill="#73516D"/>
   <path d="M-150 900Q300 670 690 850T1420 700T2100 620V1080H-150Z" fill="#965C74"/>
   <path d="M90 490Q300 335 490 490M1420 330Q1680 250 1950 335M90 850Q280 770 420 830" fill="none" stroke={P.orange} strokeWidth="4" opacity=".35"/>
   <path d="M-200 1100C550 790 400 620 1040 530S1490 280 2160-70" stroke={P.purple} strokeWidth="180" fill="none"/>
   <path d="M-200 1100C550 790 400 620 1040 530S1490 280 2160-70" stroke={P.lilac} strokeWidth="4" strokeDasharray="20 25" fill="none"/>
   <path d="M110 1050C600 730 430 640 1040 530" stroke={P.gold} strokeWidth="7" fill="none" pathLength="1" strokeDasharray={`${unroll} 1`}/>
   {Array.from({length:5},(_,i)=>{const x=430+i*250,y=780-i*130;return <g key={i}><circle cx={x} cy={y} r="16" fill={i>2?P.lilac:P.gold}/><path d={`M${x} ${y+25}v70`} stroke={P.violet} strokeWidth="4"/></g>;})}
   <g opacity={boundary}><path d="M1290 165C1180 330 1310 410 1190 620L1915 190V0H1330Z" fill={P.ink}/><path d="M1290 165C1180 330 1310 410 1190 620" fill="none" stroke={P.gold} strokeWidth="6"/><Question x={1550} y={390} r={.75} draw={boundary}/></g>
   <circle cx={mix(430,1110,unroll)} cy={mix(780,510,unroll)} r="20" fill={P.cream}/>
  </>;
 }
 if(s.kind==='map'){
  const unfold=q(t,0,3),tryOutside=q(t,4,10),returnToEdge=q(t,12,16),event=B(31),x=mix(1150,440,tryOutside)+returnToEdge*300;
  const y=560-Math.sin(tryOutside*Math.PI)*170;
  return <>{background}
   {[0,1,2,3,4,5].map(i=><path key={i} d={`M-150 ${110+i*175}C340 ${-120+i*170} 730 ${500+i*90} 1100 ${200+i*160}S1750 ${i*170} 2100 ${160+i*160}`} fill="none" stroke={i%2?P.orange:P.lilac} strokeWidth="4" opacity=".12"/>)}
   <ellipse cx="1000" cy="915" rx="670" ry="65" fill={P.ink} opacity=".24"/>
   <g transform={`translate(960 500) scale(${.75+unfold*.25} 1)`}>
    <path d="M-590-270L-195-320L195-260L590-320V290L195 340L-195 280L-590 340Z" fill={P.cream}/>
    <path d="M-590-270L-195-320V280L-590 340Z" fill={P.gold}/><path d="M195-260L590-320V290L195 340Z" fill={P.orange} opacity=".4"/>
    <path d="M-195-320V280M195-260V340" stroke={P.orange} strokeWidth="4"/>
    <path d="M-500 150C-330-130-80 230 50-45S320 40 475-200" fill="none" stroke={P.teal} strokeWidth="13"/>
    {Array.from({length:9},(_,i)=><path key={i} d={`M${-490+i*115} ${-170+Math.sin(i)*80}l28-32 28 32Z`} fill={P.orange} opacity=".5"/>)}
   </g>
   <g transform={`translate(${Math.max(382,x)} ${y})`}><path d="M0 0C-65-65-42-135 0-135S65-65 0 0Z" fill={P.coral} stroke={P.cream} strokeWidth="5"/><circle cy="-90" r="17" fill={P.cream}/></g>
   <g opacity={tryOutside*(1-returnToEdge)}><path d="M370 250V850" stroke={P.gold} strokeWidth="5"/><path d="M220 490l-30-30m30 0l-30 30" stroke={P.coral} strokeWidth="7"/><Question x={220} y={360} r={.45}/></g>
   <g opacity={q(event,.05,.5)}><circle cx="445" cy="700" r="24" fill={P.gold}/><path d="M400 650V780" stroke={P.cream} strokeWidth="4"/><circle cx="325" cy="700" r="22" fill="none" stroke={P.lilac} strokeWidth="3" strokeDasharray="4 8"/></g>
  </>;
 }
 if(s.kind==='bounce'||s.kind==='bounce-test'){
  const test=s.kind==='bounce-test',v=test?.5:B(33),contract=q(v,0,.43),expand=q(v,.48,1),scale=mix(1.2,.27,contract)+expand*.95;
  const progress=test?q(t,1,8):v;
  return <>{background}<Geometry f={f} mass={.15} scale={scale} alpha={.16}/>
   <g transform={test?'translate(-280 0) scale(.75 1)':''}>
    {Array.from({length:22},(_,i)=>{const a=i*2.4,rr=Math.sqrt((i+1)/22)*650*scale;return <Dot key={i} x={960+Math.cos(a)*rr} y={480+Math.sin(a)*rr*.63} r={12+scale*6} teal={i%2===0}/>;})}
    <path d="M260 230C560 240 620 810 960 810S1360 240 1660 230" fill="none" stroke={P.gold} strokeWidth="6" strokeDasharray="8 12"/>
    <circle cx={mix(260,1660,progress)} cy={230+Math.sin(progress*Math.PI)**2*580} r="17" fill={P.cream}/>
    <path d="M775 630H1145" stroke={P.teal} strokeWidth="4"/>
   </g>
   {test&&<>
    <g transform={`translate(${mix(2100,1460,q(t,0,3))} 510)`}><circle r="220" fill={P.deep} stroke={P.teal} strokeWidth="5"/><Wave x={-170} y={-60} length={340} lambda={65} phase={-t} color={P.teal}/><Wave x={-170} y={70} length={340} lambda={83} phase={-t} color={P.lilac}/><path d="M-170 130H170" stroke={P.violet} strokeWidth="3"/></g>
    <path d="M840 510H1130" fill="none" stroke={P.gold} strokeWidth="4" strokeDasharray="8 14"/>
    <Question x={1040} y={425} r={.55} draw={q(t,5,9)}/>
    <path d="M270 910H1630" fill="none" stroke={P.lilac} strokeWidth="4" strokeDasharray="5 15" opacity={q(B(35),0,.7)}/>
   </>}
  </>;
 }
 if(s.kind==='inflation'){
  const exp=q(B(36),.05,1),investigate=B(37),zoom=mix(.4,2.5,exp);
  return <><Sky f={f} noStars theme="mint"/><Geometry f={f} scale={zoom} alpha={.18}/>
   {Array.from({length:7},(_,i)=>{const y=500+(i-3)*140*zoom;return <Wave key={i} x={-250} y={y} length={2420} lambda={80*zoom} amp={35*zoom} phase={i*.8-t*.12} color={i%2?P.lilac:P.teal} thick={3}/>;})}
   <path d={`M${960-270*zoom} ${500-150*zoom}h${540*zoom}v${300*zoom}h${-540*zoom}Z`} fill="none" stroke={P.gold} strokeWidth="5"/>
   <g opacity={q(investigate,.1,.3)}><circle cx="1420" cy="360" r="180" fill={P.deep} stroke={P.lilac} strokeWidth="4" strokeDasharray="8 12"/><Question x={1420} y={355} r={.7} draw={q(investigate,.2,.55)}/></g>
   <g opacity={q(investigate,.4,.8)}><Wave x={170} y={785} length={730} lambda={180} amp={28} color={P.gold}/><path d="M170 850H900" stroke={P.teal} strokeWidth="4"/></g>
  </>;
 }
 if(s.kind==='multiverse'){
  const appear=q(B(38),0,.75),focus=B(40),question=B(39),locations=[[420,350,230],[1180,580,285],[1580,240,160],[360,930,180]];
  return <><Sky f={f} quiet noStars theme="violet"/>
   {locations.map(([x,y,r],i)=>{const grow=q(appear,i*.12,i*.12+.5),fade=i>0?1-q(focus,.1,.8)*.7:1;return <g key={i} opacity={fade}>
    <defs><clipPath id={`${id}-bubble-${i}`}><circle cx={x} cy={y} r={r*grow}/></clipPath></defs>
    <circle cx={x} cy={y} r={r*grow} fill={[P.deep,'#253B58','#46294D','#262F4B'][i]} stroke={[P.teal,P.lilac,P.coral,P.gold][i]} strokeWidth="4" strokeDasharray="8 12"/>
    <g clipPath={`url(#${id}-bubble-${i})`}><Wave x={x-r} y={y} length={r*2} amp={20+i*10} lambda={70+i*30} color={i%2?P.lilac:P.teal} phase={t*.3+i}/><Wave x={x-r} y={y+70} length={r*2} amp={25} lambda={65+i*40} color={P.gold} phase={-t*.2}/>{i===0&&<circle cx={x} cy={y} r={45} fill="none" stroke={P.cream} strokeWidth="2" strokeDasharray="3 9"/>}</g>
   </g>;})}
   <Question x={860} y={300} r={.8} draw={q(question,0,.6)}/>
   <g opacity={q(focus,.4,.9)}><path d="M820 780Q580 710 485 560" fill="none" stroke={P.gold} strokeWidth="4"/><Telescope x={1010} y={790} s={.65} aim={-12}/></g>
  </>;
 }
 if(s.kind==='vacuum'){
  const reveal=B(42),framework=B(43),remove=q(B(41),.2,.9),excite=q(reveal,.2,.8);
  return <><rect width="1920" height="1080" fill="url(#sky-mint)"/>
   <g opacity={q(reveal,0,.35)}><Geometry f={f} scale={.8} alpha={.16}/>
    {[0,1,2,3,4].map(i=><Wave key={i} x={80} y={270+i*115} length={1760} lambda={150+i*30} amp={20+Math.sin(t*.4+i)*6} color={i%2?P.lilac:P.teal} phase={t*.3+i} thick={3}/>)}
   </g>
   <g opacity={q(reveal,.25,.6)}><path d={`M400 600C650 600 670 ${600-excite*370} 960 ${600-excite*370}S1250 600 1520 600`} fill="none" stroke={P.gold} strokeWidth="8"/>
    <Dot x={mix(600,1060,excite)} y={600-excite*370} r={22}/>
   </g>
   <g opacity={q(framework,.05,.4)}><path d="M170 180H1750V870H170Z" fill="none" stroke={P.gold} strokeWidth="5"/>
    {Array.from({length:8},(_,i)=><path key={i} d={`M${250+i*205} 870v80m0-770V100`} stroke={P.violet} strokeWidth="9"/>)}
    <path d="M1750 500H1830" fill="none" stroke={P.lilac} strokeWidth="4" strokeDasharray="5 9"/><Question x={1850} y={500} r={.4} draw={q(framework,.35,.8)}/>
   </g>
   {Array.from({length:6},(_,i)=><circle key={i} cx={400+i*220} cy={450+Math.sin(i)*70} r={mix(4,0,remove)} fill={P.cream}/>)}
  </>;
 }
 if(s.kind==='observatory'||s.kind==='human'){
  const human=s.kind==='human',aim=q(t,0,4),scan=q(t,3,9),compare=q(t,10,17),material=B(48),belong=B(49);
  const gesture=human?235+q(t,0,3)*90+q(material,.15,.8)*110+belong*40:235;
  return <><Sky f={f} theme="dusk"/>
   <circle cx="1650" cy="155" r="70" fill={P.cream} opacity=".8"/><circle cx="1620" cy="133" r="65" fill="#49416C"/>
   {[0,1,2].map(i=><path key={i} transform={`translate(${Math.sin(t*.08+i)*25} 0)`} d={`M${-180+i*680} ${230+i*55}q80-65 150-20q70-80 160-10q80-15 155 40Z`} fill={P.lilac} opacity=".1"/>)}
   <g><path d="M-200 740Q250 460 660 720T1400 650T2100 710V1080H-200Z" fill="#262B51"/><path d="M-200 850Q470 670 870 830T2100 780V1080H-200Z" fill="#363352"/>
    <path d="M0 920C420 860 1440 910 1920 850V1080H0Z" fill="#181B39"/>
    <path d="M130 930H1800M210 1000H1900" fill="none" stroke={P.violet} strokeWidth="3" opacity=".2"/>
   </g>
   <g transform="translate(0 20)"><path d="M210 430A280 280 0 0 1 770 430V840H210Z" fill={P.deep}/><path d="M185 430A305 305 0 0 1 795 430Z" fill={P.blue}/><path d="M210 430A280 280 0 0 1 490 150Q310 205 310 430Z" fill={P.teal} opacity=".22"/><path d="M490 125Q610 220 610 430H490Z" fill={P.deep}/><path d="M230 330Q300 190 410 170M210 375Q250 300 280 285" stroke={P.teal} strokeWidth="5" opacity=".35" fill="none"/><path d="M215 440H765V475H215Z" fill={P.violet}/><path d="M280 850V600H700V850" fill={P.purple}/><path d="M300 620H680V700H300Z" fill={P.ink}/><path d="M210 840H770V880H210Z" fill={P.blue}/><path d="M650 500H715V570H650Z" fill={P.gold} opacity=".6"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${240+i*110} 735v82M${240+i*110} 510v50`} stroke={P.violet} strokeWidth="5" opacity=".4"/>)}<Telescope x={490} y={535} s={.74} aim={-aim*13} detected={scan}/></g>
   {!human&&<>
    <Dish x={1390} y={680} s={.8} active={q(t,3.5,4)*(1-q(t,5.5,6))}/>
    <path d="M1406 646C1250 800 1120 780 1030 690" fill="none" stroke={P.teal} strokeWidth="4" pathLength="1" strokeDasharray={`${scan} 1`}/>
    <g transform="translate(900 490)"><rect width="340" height="240" rx="22" fill={P.deep} stroke={P.blue} strokeWidth="9"/><Wave x={30} y={80} length={280} lambda={48} amp={25} color={P.teal} phase={-t*.6}/><Wave x={30} y={160} length={280} lambda={48+compare*7} amp={25} color={P.gold} phase={-t*.6}/><path d="M20 210H320" stroke={P.violet} strokeWidth="3"/></g>
    {Array.from({length:5},(_,i)=><Photon key={i} x={mix(700+i*160,1405,q(t,2+i*.65,4+i*.65))} y={mix(90+i*30,640,q(t,2+i*.65,4+i*.65))} angle={55} size={.5}/>)}
    <g opacity={q(t,12,16)}><path d="M1450 200q80-75 160 0t160 0" stroke={P.lilac} strokeWidth="3" strokeDasharray="5 10" fill="none"/><Question x={1650} y={315} r={.45}/></g>
   </>}
   {human&&<>
    <ellipse cx="1370" cy="1010" rx="160" ry="25" fill={P.ink} opacity=".5"/>
    <g transform="translate(1390 1015) scale(1.08)"><MotionSol frame={gesture} id={`${id}-sol`}/></g>
    <g opacity={q(material,0,.15)*(1-q(belong,.5,1))}>
     <Nucleus x={mix(540,1110,q(material,.05,.4))} y={mix(250,550,q(material,.05,.4))} r={65}/>
     <Glow x={650} y={380} r={130} color={P.orange}/><Sprite sheet="stellar-atlas" cell={0} x={650} y={380} size={260*(1-q(material,.5,1))}/>
     <Nucleus x={mix(650,1010,q(material,.4,.8))} y={mix(380,670,q(material,.4,.8))} r={87} protons={6} neutrons={6} spread={mix(2.7,1,q(material,.3,.55))}/>
     <Nucleus x={mix(660,1170,q(material,.65,1))} y={mix(385,730,q(material,.65,1))} r={87} protons={8} neutrons={8} spread={mix(2.7,1,q(material,.5,.8))}/>
     <path d="M1090 550Q1240 560 1280 680M1000 670Q1190 760 1290 735" fill="none" stroke={P.gold} strokeWidth="3" strokeDasharray="5 10"/>
    </g>
    <g opacity={q(belong,0,.5)}><path d="M220 250C560 130 700 480 1050 260S1580 240 1780 100" fill="none" stroke={P.gold} strokeWidth="4" strokeDasharray="6 11"/>
     <Galaxy x={420} y={280} r={140} cell={1}/><OrbitalAtom x={900} y={260} r={65} f={f}/><Question x={1700} y={120} r={.4}/>
    </g>
   </>}
   <g><path d="M20 1080Q65 900 35 820M1880 1080Q1815 900 1880 790" fill="none" stroke={P.teal} strokeWidth="8" opacity=".28"/>{Array.from({length:10},(_,i)=>{const left=i<5,n=i%5,y=1040-n*45,x=left?25+n*4:1870-n*4,a=Math.sin(t*.7-n*.5)*3;return <path key={i} transform={`rotate(${a} ${x} ${y})`} d={`M${x} ${y}q${left?100:-100}-90 ${left?80:-80}-125q${left?-100:100} 20 ${left?-80:80} 125Z`} fill={i%2?'#385F6A':'#283C58'}/>;})}</g>
  </>;
 }
 return background;
};

// Incoming scenes are revealed by a physical contour: the emitted wave, lens,
// folding wall/page, expanding grid or fracture. Both scenes keep advancing.
// There is no scene opacity ramp, screenshot hold or frozen outgoing time.
const revealPath=(mode:Transition,u:number,anchor:readonly number[]):string=>{
 const [x,y]=anchor;
 if(mode==='lens'||mode==='orbit'||mode==='spiral'){
  const r=u*2250;return `M${x-r} ${y}a${r||.01} ${r||.01} 0 1 0 ${r*2} 0a${r||.01} ${r||.01} 0 1 0 ${-r*2} 0`;
 }
 if(mode==='wave'){
  const yy=mix(1200,-220,u),a=Math.sin(u*Math.PI)*110;return `M-100 ${yy}C300 ${yy-a} 520 ${yy+a} 960 ${yy}S1540 ${yy-a} 2020 ${yy}V1200H-100Z`;
 }
 if(mode==='tear'){
  const w=u*2100,j=Math.sin(u*Math.PI)*35;return `M${1080-w} -100L${1080-w-j} 180L${1080-w+j} 390L${1080-w-j} 650L${1080-w+j} 860L${1080-w} 1200L${1080+w} 1200L${1080+w+j} 860L${1080+w-j} 650L${1080+w+j} 390L${1080+w-j} 180L${1080+w} -100Z`;
 }
 if(mode==='fold'||mode==='page'){
  const xx=mix(2080,-180,u),bend=Math.sin(u*Math.PI)*220;return `M${xx} -100Q${xx-bend} 540 ${xx} 1180H2200V-100Z`;
 }
 if(mode==='grid'){
  const h=u*750;return `M-100 ${540-h}Q960 ${540-h-h*.2} 2020 ${540-h}V${540+h}Q960 ${540+h+h*.2} -100 ${540+h}Z`;
 }
 const w=u*1150;return `M${960-w} -100H${960+w}V1180H${960-w}Z`;
};
const Handoff:React.FC<{mode:Transition;u:number;anchor:readonly number[]}>=({mode,u,anchor})=>{
 const [x,y]=anchor,v=Math.sin(u*Math.PI);
 if(mode==='lens'||mode==='orbit'||mode==='spiral')return <g><circle cx={x} cy={y} r={u*2250} fill="none" stroke={mode==='lens'?P.teal:P.gold} strokeWidth={12*v}/>{mode==='spiral'&&[0,1,2].map(i=><path key={i} transform={`translate(${x} ${y}) rotate(${u*130+i*120})`} d={`M${u*1700} 0Q${u*600} ${-u*600} 0 ${-u*1700}`} fill="none" stroke={P.lilac} strokeWidth={5*v}/>)}</g>;
 if(mode==='wave'){const yy=mix(1200,-220,u),a=v*110;return <path d={`M-100 ${yy}C300 ${yy-a} 520 ${yy+a} 960 ${yy}S1540 ${yy-a} 2020 ${yy}`} fill="none" stroke={P.teal} strokeWidth={13*v}/>;}
 if(mode==='page'||mode==='fold'){const xx=mix(2080,-180,u),bend=v*220;return <g><path d={`M${xx} -100Q${xx-bend} 540 ${xx} 1180L${xx+bend*.45} 1180Q${xx-bend*.3} 540 ${xx+bend*.45} -100Z`} fill={mode==='page'?P.gold:P.purple}/><path d={`M${xx} -100Q${xx-bend} 540 ${xx} 1180`} fill="none" stroke={P.cream} strokeWidth="4"/></g>;}
 if(mode==='grid')return <g stroke={P.teal} strokeWidth={3*v} opacity={.6}>{[-1,1].map(n=><path key={n} d={`M-100 ${540+n*u*750}Q960 ${540+n*u*900} 2020 ${540+n*u*750}`} fill="none"/>)}</g>;
 return null;
};

export const singularityRebuildState=(frame:number)=>{
 const index=sectionIndex(frame),s=filmSections[index],elapsed=frame-start(s),transition=index>0&&elapsed<40;
 return {frame,section:index,name:s.name,beat:timing.visualBeats.find(b=>frame>=b.startFrame&&frame<b.endFrame)?.id,transition:transition?s.transition:null,transitionProgress:transition?q(elapsed,0,40):1,outgoingFrame:transition?frame:null,onScreenTitle:false};
};

export const SingularityRebuild:React.FC<{includeAudio?:boolean;captions?:boolean}>=({includeAudio=true,captions=false})=>{
 const f=useCurrentFrame(),index=sectionIndex(f),s=filmSections[index],elapsed=f-start(s),joining=index>0&&elapsed<40,u=q(elapsed,0,40);
 const [handle]=useState(()=>delayRender('Load original independent sprites, approved human texture and fonts'));
 useEffect(()=>{
  const sheets=[...Array.from({length:6},(_,i)=>`galaxies-atlas-${i}.png`),...Array.from({length:4},(_,i)=>`stellar-atlas-${i}.png`),...Array.from({length:2},(_,i)=>`props-atlas-${i}.png`)];
  const urls=[...sheets.map(v=>A+v),'assets/artwork/approved-characters/atlas.png','assets/artwork/approved-characters/blinks.png'];
  const images=urls.map(url=>new Promise<void>((resolve,reject)=>{const image=new window.Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error('Missing '+url));image.src=staticFile(url);}));
  const fonts=new FontFace('Outfit',`url(${staticFile('assets/fonts/Outfit.ttf')})`,{weight:'100 900'}).load().then(font=>document.fonts.add(font));
  Promise.all([...images,fonts]).then(()=>continueRender(handle)).catch(cancelRender);
 },[handle]);
 const caption=captions?timing.captions.find(c=>f/30>=c.start&&f/30<c.end):null;
 return <AbsoluteFill style={{background:P.ink,fontFamily:'Outfit,sans-serif'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080"><defs>
   <radialGradient id="night-sky" cx="45%" cy="40%" r="75%"><stop stopColor="#34305A"/><stop offset=".6" stopColor="#211E44"/><stop offset="1" stopColor="#11132F"/></radialGradient>
   <radialGradient id="warm-sky" cx="52%" cy="45%" r="72%"><stop stopColor="#69405D"/><stop offset=".5" stopColor="#412846"/><stop offset="1" stopColor="#211C3D"/></radialGradient>
   <radialGradient id="proton" cx="30%" cy="22%"><stop stopColor="#FFC181"/><stop offset=".5" stopColor="#F48479"/><stop offset="1" stopColor="#CC416E"/></radialGradient>
   <radialGradient id="neutron" cx="30%" cy="22%"><stop stopColor="#B7F1CD"/><stop offset=".5" stopColor="#58C6B4"/><stop offset="1" stopColor="#287B9B"/></radialGradient>
   {Object.entries({amber:['#846172','#4F3A60'],mint:['#265965','#18384E'],ice:['#384A6B','#1C2B49'],violet:['#4E365E','#251B3C'],dusk:['#655580','#242A4B']}).map(([name,colors])=><linearGradient key={name} id={`sky-${name}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={colors[0]}/><stop offset="1" stopColor={colors[1]}/></linearGradient>)}
   {joining&&<clipPath id="film-reveal"><path d={revealPath(s.transition,u,s.anchor)}/></clipPath>}
  </defs>
  {joining&&<Scene section={filmSections[index-1]} frame={f} id={`out-${index}`}/>}
  <g clipPath={joining?'url(#film-reveal)':undefined}><Scene section={s} frame={f} id={`in-${index}`}/></g>
  {joining&&<Handoff mode={s.transition} u={u} anchor={s.anchor}/>}
  {caption&&<text x="960" y="1010" fontSize="38" fontWeight="500" textAnchor="middle" fill={P.cream} stroke={P.ink} strokeWidth="3.5" paintOrder="stroke">{caption.text.split('\n').map((line,i)=><tspan key={i} x="960" dy={i?46:0}>{line}</tspan>)}</text>}
  </svg>
  {includeAudio&&<Audio src={staticFile('assets/audio/singularity-v2/final-mix.m4a')}/>}
 </AbsoluteFill>;
};
export const singularityRebuildConfig={durationInFrames:timing.durationInFrames,fps:30,width:1920,height:1080};
