import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Audio,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame} from 'remotion';
import timing from './data/cancer-short-timing.json';
import assets from './data/cancer-cell-assets.json';
import medicineRegistration from './data/artwork-motion-registration.json';
import {TextureMesh,type Point} from './art/TextureMesh';
import {phase,mix,clamp} from '../animation-mastery/engine/timeline/curves';
import {seeded,settle} from '../animation-mastery/engine/animation/dynamics';
import {MedicineEnvironment} from './MedicineEnvironment';

const W=1080,H=1920,TAU=Math.PI*2;
const P={deep:'#171A36',plum:'#351B43',violet:'#6F4B9B',lilac:'#C5A5ED',ivory:'#FFF0DC',teal:'#6DD3C8',blue:'#38778A',rose:'#EF7188',coral:'#F49B8D',gold:'#FFD47F',red:'#B93F70'};
const A='assets/artwork/cancer-short-v1/';
type Kind='healthy'|'cancer'|'immune';
type Part=keyof typeof assets.assets;
type Scene=typeof timing.scenes[number];
const E=timing.events;
const ease=(f:number,a:number,b:number)=>phase(f,a,b);
const span=(a:number,b:number,n:number)=>Array.from({length:n},(_,i)=>mix(a,b,i/(n-1)));
const cubic=(t:number,a:Point,b:Point,c:Point,d:Point):Point=>{const s=1-t;return[s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]];};

/** One registered original texture under a silhouette; PNG bytes never change. */
const ArtPart:React.FC<{name:Part;id:string}>=({name,id})=>{
 const p=assets.assets[name],s=p.native_to_unit;
 return <><defs><clipPath id={id}><path d={p.unit_outline}/></clipPath></defs><g clipPath={`url(#${id})`}>
  <image href={staticFile(A+'cell-components.png')} x={-p.center[0]*s} y={-p.center[1]*s} width={1536*s} height={1024*s}/>
 </g></>;
};

/** Continuous cell-skin response. Pinch is local, rather than rigid-piece separation. */
export function cancerCellPoint(p:Point,frame:number,seed:number,pinch=0,contact=0):Point{
 const [x,y]=p,r=Math.hypot(x,y),a=Math.atan2(y,x),w=1+.022*Math.sin(a*3-frame*.035+seed)+.012*Math.sin(a*5+frame*.022+seed);
 const touch=contact*Math.exp(-((x-.76)**2+y*y)/.32);
 return [x*w*(1+pinch*.48)-touch*.10,y*w*(1-.88*pinch*Math.exp(-x*x/.12))*(1+touch*.08)];
}

const Cell:React.FC<{id:string;kind?:Kind;x:number;y:number;r:number;frame:number;seed?:number;angle?:number;pinch?:number;contact?:number;splitNucleus?:boolean;nucleusSeparation?:number;camouflage?:number;alpha?:number;responsive?:boolean;stretch?:[number,number]}>=({id,kind='healthy',x,y,r,frame:f,seed=0,angle=0,pinch=0,contact=0,splitNucleus=false,nucleusSeparation=pinch,camouflage=0,alpha=1,responsive=true,stretch=[1,1]})=>{
 const nucleus=(kind+'_nucleus') as Part,nr=kind==='immune'?.66:kind==='cancer'?.50:.41;
 const nx=Math.sin(f*.025+seed)*.026,ny=Math.cos(f*.018+seed)*.022;
 const body=<g filter={camouflage>0?`url(#${id}-hue)`:undefined}><ArtPart name={kind} id={id+'-skin-clip'}/></g>;
 const renderBody=(name:string,children:React.ReactNode)=>(r>=155&&responsive)?<TextureMesh id={name} xs={span(-1.14,1.14,7)} ys={span(-1.14,1.14,7)} deform={p=>cancerCellPoint(p,f,seed,pinch,contact)}>{children}</TextureMesh>:<g transform={`scale(${1+.012*Math.sin(f*.029+seed)} ${1-.012*Math.sin(f*.029+seed)})`}>{children}</g>;
 return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${r*stretch[0]} ${r*stretch[1]})`} opacity={alpha}>
  {camouflage>0&&<defs><filter id={id+'-hue'} colorInterpolationFilters="sRGB"><feColorMatrix type="hueRotate" values={String(camouflage*175)}/></filter></defs>}
  {renderBody(id+'-skin',body)}
  {(splitNucleus?[-1,1]:[0]).map((side,i)=>{const size=nr*(splitNucleus?mix(1,.44,nucleusSeparation):1);return <g key={side} transform={`translate(${nx+side*nucleusSeparation*.61} ${ny}) rotate(${Math.sin(f*.018+seed)*4}) scale(${size/(splitNucleus?stretch[0]:1)} ${size/(splitNucleus?stretch[1]:1)})`}><ArtPart name={nucleus} id={id+'-nucleus-'+i}/></g>;})}
 </g>;
};

const Ripple:React.FC<{x:number;y:number;age:number;color?:string;duration?:number;r?:number}>=({x,y,age,color=P.gold,duration=26,r=110})=>{
 if(age<0||age>duration)return null;const p=age/duration;
 return <ellipse cx={x} cy={y} rx={12+p*r} ry={7+p*r*.68} stroke={color} strokeWidth={mix(7,1,p)} opacity={(1-p)*.7} fill="none"/>;
};
const SurfaceMarker:React.FC<{x:number;y:number;angle?:number;kind?:number;color?:string;scale?:number}>=({x,y,angle=0,kind=0,color=P.gold,scale=1})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
 <path d="M0 23V-1" stroke={color} strokeWidth="9" strokeLinecap="round"/>
 {kind%3===0?<path d="M-16 0V-18H16V0Z" fill={color}/>:kind%3===1?<path d="M-20 0L0-23 20 0Z" fill={color}/>:<path d="M-17-17Q0-33 17-17V0H-17Z" fill={color}/>}
 <path d="M-7 20H7" stroke={P.ivory} strokeWidth="3" strokeLinecap="round" opacity=".45"/>
</g>;
const MarkerRing:React.FC<{x:number;y:number;r:number;count?:number;kind?:number;alpha?:number;offset?:number}>=({x,y,r,count=9,kind=0,alpha=1,offset=0})=><g opacity={alpha}>{Array.from({length:count},(_,i)=>{const a=(i/count*TAU)+offset;return <SurfaceMarker key={i} x={x+Math.cos(a)*r} y={y+Math.sin(a)*r} angle={a*180/Math.PI+90} kind={kind+i%2} color={i%2?P.teal:P.gold} scale={.65}/>;})}</g>;

const Tissue:React.FC<{frame:number;id:string;vessel?:boolean;light?:number}>=({frame:f,id,vessel=false,light=0})=><>
 <defs>
  <linearGradient id={id+'-bg'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={vessel?'#4B1647':'#163747'}/><stop offset=".56" stopColor={vessel?'#29173A':'#292345'}/><stop offset="1" stopColor="#351D43"/></linearGradient>
  <radialGradient id={id+'-light'}><stop stopColor={light?P.gold:P.blue} stopOpacity={light?.24:.22}/><stop offset="1" stopColor={P.deep} stopOpacity="0"/></radialGradient>
 </defs>
 <rect width={W} height={H} fill={`url(#${id}-bg)`}/><ellipse cx="500" cy="800" rx="740" ry="1050" fill={`url(#${id}-light)`}/>
 {[0,1,2,3,4].map(i=>{const dx=Math.sin(f*.006+i)*9;return <g key={i} transform={`translate(${dx} 0)`}>
  <path d={`M-180 ${-100+i*500}C180 ${-200+i*450} 900 ${350+i*420} 1260 ${i*430-130}L1280 ${i*430-45}C850 ${480+i*420} 180 ${i*450-100} -180 ${i*500}Z`} fill={[P.violet,P.rose,P.blue][i%3]} opacity={vessel?.10:.055}/>
 </g>;})}
 {Array.from({length:95},(_,i)=>{const depth=.25+seeded(i+17)*.75,velocity=vessel?2.3:.14,x=(seeded(i+47)*1240+Math.sin(f*.004+i)*14)-80,y=(seeded(i+83)*2180+f*velocity*depth)%2180-130;return <g key={i} opacity={.06+depth*.1}>
  <ellipse cx={x} cy={y} rx={2+seeded(i+9)*5} ry={2+seeded(i+9)*5} fill={i%3?P.lilac:P.teal}/>
 </g>;})}
 {/* The low-contrast foreground fibers bend at different offsets. */}
 {[0,1,2].map(i=><path key={i} d={`M${-180+i*120} 1960C${-300+i*140} 1300 ${150+Math.sin(f*.012+i)*18} 1050 ${-120+i*35} 290`} stroke={i%2?P.violet:P.blue} strokeWidth={55-i*9} fill="none" opacity=".13"/>)}
</>;

const DNA:React.FC<{x:number;y:number;s?:number;frame:number;mutation?:number;repair?:number;id:string}>=({x,y,s=1,frame:f,mutation=0,repair=0,id})=>{
 const left:Point[]=[],right:Point[]=[];
 for(let i=0;i<=60;i++){const yy=-220+i*440/60,a=yy*.021+f*.009;left.push([Math.sin(a)*75,yy]);right.push([-Math.sin(a)*75,yy]);}
 const path=(p:Point[])=>'M'+p.map(q=>q.join(',')).join('L');
 return <g transform={`translate(${x} ${y}) scale(${s})`}>
  {Array.from({length:14},(_,i)=>{const yy=-207+i*32,a=yy*.021+f*.009,d=Math.sin(a)*75,bad=i===7;
   return <g key={i} opacity={bad?1:.74}><path d={`M${-d} ${yy}H${bad?mix(-d*.12,d*.12,repair):d}`} fill="none" stroke={bad&&mutation>0?P.rose:i%2?P.gold:P.teal} strokeWidth={bad?12:8} strokeLinecap="round"/>
    {bad&&repair<1&&<path d={`M${d*.4} ${yy}H${d}`} stroke={P.gold} strokeWidth="8" strokeLinecap="round"/>}
    {bad&&mutation>0&&<path d={`M${-d*.1} ${yy-15}l14 14-15 16`} fill="none" stroke={P.rose} strokeWidth="9" strokeLinejoin="round" opacity={mutation}/>}
   </g>;
  })}
  <path d={path(left)} fill="none" stroke={P.lilac} strokeWidth="13" strokeLinecap="round"/><path d={path(right)} fill="none" stroke={P.teal} strokeWidth="13" strokeLinecap="round"/>
 </g>;
};

const Debris:React.FC<{x:number;y:number;age:number;seed?:number;r?:number}>=({x,y,age,seed=0,r=150})=>{
 if(age<0)return null;const q=ease(age,0,30),fade=1-ease(age,24,55);
 return <g opacity={fade}>{Array.from({length:12},(_,i)=>{const a=i/12*TAU+seed,rr=q*(r*.4+seeded(i+33)*r*.65);return <path key={i} transform={`translate(${x+Math.cos(a)*rr} ${y+Math.sin(a)*rr}) rotate(${i*37+age*1.7}) scale(${(1-q*.45)*(.5+seeded(i+4)*.7)})`} d="M-9-14Q14-20 20 3Q10 22-8 13Q-20 4-9-14Z" fill={i%3?P.coral:P.lilac}/>;})}</g>;
};
const Granules:React.FC<{a:Point;b:Point;frame:number;start:number;count?:number}>=({a,b,frame:f,start,count=9})=><>{Array.from({length:count},(_,i)=>{const age=f-start-i*3;if(age<0||age>24)return null;const q=age/24,p=cubic(q,a,[a[0]+65,a[1]-70],[b[0]-30,b[1]+40],b);return <circle key={i} cx={p[0]} cy={p[1]} r={5+i%3*2} fill={P.gold} opacity={Math.sin(q*Math.PI)}/>;})}</>;

const Divide:React.FC<{id:string;x:number;y:number;r:number;frame:number;start:number;duration?:number;kind?:Kind}>=({id,x,y,r,frame:f,start,duration=48,kind='cancer'})=>{
 const q=ease(f,start,start+duration),separate=ease(q,.60,1),distance=r*mix(.37,1.10,separate),neck=r*.22*(1-ease(q,.68,1));
 return <>
  {q>=.6&&q<1&&<path d={`M${x-distance} ${y-neck}Q${x} ${y-neck*.3} ${x+distance} ${y-neck}V${y+neck}Q${x} ${y+neck*.3} ${x-distance} ${y+neck}Z`} fill="#F38EA2" stroke="#F8B4BB" strokeWidth="4"/>}
  {q<.6&&<Cell id={id+'-mother'} kind={kind} x={x} y={y} r={r} frame={f} pinch={q*.12} nucleusSeparation={q*.81} splitNucleus={q>.12} stretch={[1+q*.28,1-q*.45]}/>}
  {q>=.6&&[-1,1].map((side,i)=><Cell key={side} id={id+'-daughter-'+i} kind={kind} x={x+side*distance} y={y+side*settle(f,start+duration,30,7,2.1,6)} r={r*.73} frame={f} seed={i+2}/>)}
 </>;
};

const RBC:React.FC<{x:number;y:number;r:number;angle:number}>=({x,y,r,angle})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${r/100})`}>
 <defs><radialGradient id={`rbc-${x.toFixed(1)}-${y.toFixed(1)}`}><stop stopColor="#B12558"/><stop offset=".58" stopColor="#D84970"/><stop offset=".80" stopColor="#F16885"/><stop offset="1" stopColor="#C33666"/></radialGradient></defs>
 <ellipse rx="100" ry="66" fill={`url(#rbc-${x.toFixed(1)}-${y.toFixed(1)})`}/><ellipse cx="-3" cy="-3" rx="51" ry="28" fill="#AB2957" opacity=".65"/><path d="M-80-18Q-44-66 23-44" fill="none" stroke="#F797A4" strokeWidth="9" strokeLinecap="round" opacity=".65"/>
</g>;

const Antibody:React.FC<{x:number;y:number;angle?:number;s?:number;active?:number}>=({x,y,angle=0,s=1,active=0})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
 <path d="M0 66V3L-49-50M0 3L49-50" fill="none" stroke={P.gold} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
 <path d="M-5 60V4L-47-45M5 4L46-44" fill="none" stroke={P.ivory} strokeWidth="6" strokeLinecap="round" opacity=".7"/>
 <path d="M-60-37L-38-60M38-60L60-37" stroke={active?P.ivory:P.teal} strokeWidth="13" strokeLinecap="round"/>
</g>;

const MicroscopeFrame:React.FC<{f:number}>=({f})=>{
 const root='assets/artwork/scene-motion/',image=(name:string)=><image href={staticFile(root+name+'.png')} width="1672" height="941"/>;
 const angle=mix(0,23,ease(f,10,37))-mix(0,10,ease(f,37,65));
 return <><g transform={`translate(540 850) scale(${1+ease(f,0,75)*.012}) translate(-540 -850)`}><g transform="translate(-1660 0) scale(2.04)">
  {image('medicine-source')}<MedicineEnvironment frame={f+30}/>
  <defs><clipPath id="cancer-lab-knob"><ellipse cx="945" cy="633" rx="23" ry="24"/></clipPath><clipPath id="cancer-lab-eyes"><ellipse cx="1132" cy="319" rx="14" ry="15"/><ellipse cx="1181" cy="332" rx="15" ry="16"/></clipPath><mask id="cancer-lab-foreground" maskUnits="userSpaceOnUse" x="930" y="140" width="650" height="800"><path d={medicineRegistration.clinician.outline} fill="white" stroke="white" strokeWidth="8" strokeLinejoin="round" fillRule="evenodd"/></mask></defs>
  <g clipPath="url(#cancer-lab-knob)"><g transform={`rotate(${angle} 945 633)`}>{image('medicine-source')}</g></g>
  <g mask="url(#cancer-lab-foreground)">{image('medicine-source')}</g>
  {f>=26&&f<31&&<g clipPath="url(#cancer-lab-eyes)">{image('medicine-blink')}</g>}
 </g></g><path d="M0 1430Q540 1390 1080 1430V1920H0Z" fill={P.deep} opacity=".20"/></>;
};

/** Shot-specific choreography. No section is a held generated illustration. */
const CancerScene:React.FC<{scene:Scene;frame:number;id:string}>=({scene,frame:f,id})=>{
 const t=f-scene.start_frame,kind=scene.id;
 const bg=<Tissue frame={f} id={id} vessel={kind==='spread'} light={['therapy','ending','healthy'].includes(kind)?1:0}/>;
 if(kind==='hook'){
  const pass=ease(t,0,105),peek=ease(t,65,107);
  return <>{bg}<Cell id={id+'-hero'} kind="cancer" x={540} y={875} r={330} frame={f} camouflage={1-peek*.85}/>
   <Cell id={id+'-sentinel'} kind="immune" x={mix(120,1000,pass)} y={375+Math.sin(pass*Math.PI)*70} r={145} frame={f} seed={3}/>
   <MarkerRing x={540} y={875} r={332} kind={0} offset={.16}/>
   <path d={`M${mix(120,1000,pass)} 480L${mix(180,1060,pass)} 1170L${mix(-120,760,pass)} 1170Z`} fill={P.teal} opacity=".05"/>
   {[0,1,2].map(i=><Cell key={i} id={id+'-neighbor'+i} x={i%2?110:1040} y={620+i*480} r={130} frame={f} seed={i} alpha={.38}/>)}
  </>;
 }
 if(kind==='healthy'){
  const grow=ease(f,E.grow-20,E.grow+26),stop=ease(f,E.stop-15,E.stop+15),repair=ease(f,E.repair-8,E.repair+24),damage=ease(f,E.destroy-46,E.destroy-16),death=ease(f,E.destroy-2,E.destroy+23);
  return <>{bg}<Cell id={id+'-hero'} x={535} y={850} r={240+grow*24} frame={f}/>
   <g opacity={1-ease(f,E.repair+40,E.repair+65)}><DNA id={id+'-dna'} x={535} y={845} s={.51} frame={f} repair={repair}/></g>
   {[0,1,2].map(i=>{const q=ease(f,E.grow-50+i*8,E.grow-5+i*4),p=cubic(q,[130+i*80,350],[90,540],[190,630],[360,650]);return <g key={i} opacity={1-ease(f,E.grow+20,E.grow+42)}><SurfaceMarker x={p[0]} y={p[1]} angle={-30} scale={1.2}/><Ripple x={p[0]} y={p[1]} age={f-E.grow-i*5} r={90}/></g>;})}
   {[-1,1].map((side,i)=><Cell key={side} id={id+'-neighbor'+i} x={535+side*mix(560,430,stop)} y={865+side*20} r={170} frame={f} seed={3+i}/>)}
   <path d="M245 1190Q535 1330 825 1190" fill="none" stroke={P.teal} strokeWidth="5" opacity={stop*.5} pathLength="1" strokeDasharray={`${stop} 1`}/>
   <Cell id={id+'-control'} x={535} y={1350} r={95*(1-death*.62)} frame={f} alpha={1-death} kind={damage>.2?'cancer':'healthy'}/>
   <Debris x={535} y={1350} age={f-E.destroy} r={100}/><Ripple x={535} y={850} age={f-E.repair-8} r={170} color={P.teal}/>
  </>;
 }
 if(kind==='mutation'){
  const change=ease(f,E.mutation-4,E.mutation+25),settled=ease(t,55,88);
  return <>{bg}<g transform={`translate(535 880) scale(${mix(1.3,1,settled)}) translate(-535 -880)`}>
   <Cell id={id+'-hero'} kind="cancer" x={535} y={880} r={355} frame={f} camouflage={1-change}/>
   <ellipse cx="535" cy="880" rx="178" ry="205" fill={P.deep} opacity=".78"/>
   <DNA id={id+'-dna'} x={535} y={880} s={.8} frame={f} mutation={change}/>
   <path d="M365 1150Q530 1210 705 1150" fill="none" stroke={P.teal} strokeWidth="8" opacity={1-change}/>
   {Array.from({length:5},(_,i)=><path key={i} d={`M${370+i*77} 1152l${change*(i%2?12:-12)} ${change*34}`} stroke={P.rose} strokeWidth="7" opacity={change}/>)}</g>
   <Ripple x={535} y={900} age={f-E.mutation-4} color={P.rose} r={170}/>
  </>;
 }
 if(kind==='division'){
  const split=ease(f,E.two-8,E.two+44),twice=ease(f,E.four-4,E.four+42),crowd=ease(f,E.crowd-4,E.crowd+48);
  return <>{bg}
   {Array.from({length:7},(_,i)=>{const a=i/7*TAU;return <Cell key={i} id={id+'-healthy'+i} x={535+Math.cos(a)*(350+crowd*105)} y={875+Math.sin(a)*(380+crowd*75)} r={110} frame={f} alpha={.85} seed={i}/>;})}
   {split<1?<Divide id={id+'-first'} x={535} y={865} r={216} frame={f} start={E.two-8} duration={52}/>:<>
    <Divide id={id+'-secondL'} x={365} y={805-twice*65} r={155} frame={f} start={E.four-4} duration={46}/>
    <Divide id={id+'-secondR'} x={705} y={965+twice*65} r={155} frame={f} start={E.four-1} duration={46}/>
   </>}
   {crowd>0&&Array.from({length:5},(_,i)=>{const q=ease(f,E.crowd+i*6,E.crowd+i*6+30);return <Cell key={i} id={id+'-clone'+i} kind="cancer" x={405+i%3*135} y={670+Math.floor(i/3)*480} r={75*q} frame={f} seed={i} alpha={q}/>;})}
   <Ripple x={535} y={865} age={f-E.two-45} color={P.rose} r={230}/>
  </>;
 }
 if(kind==='surveillance'){
  const approach=ease(t,0,40),fire=scene.start_frame+57,death=ease(f,fire+17,fire+52);
  const ix=mix(130,325,approach),iy=mix(600,760,approach);
  return <>{bg}<Cell id={id+'-target'} kind="cancer" x={730} y={970} r={210*(1-death*.35)} frame={f} alpha={1-death}/>
   <MarkerRing x={730} y={970} r={215} count={6} kind={1} alpha={1-death}/>
   <Cell id={id+'-immune'} kind="immune" x={ix} y={iy} r={240} frame={f} contact={approach}/>
   <path d="M480 835Q550 890 557 917" fill="none" stroke={P.teal} strokeWidth="12" strokeLinecap="round" opacity={ease(t,30,50)*(1-death)}/>
   <Granules a={[495,830]} b={[685,945]} frame={f} start={fire}/><Debris x={730} y={970} age={f-fire-26}/>
   <Ripple x={560} y={900} age={t-44} color={P.teal} r={100}/>
  </>;
 }
 if(kind==='escape'||kind==='disguise'){
  const close=kind==='disguise'?1:ease(t,10,58),off=kind==='disguise'?1:ease(f,E.inhibit-15,E.inhibit+18),shift=ease(f,E.evade-12,E.evade+20);
  return <>{bg}
   <Cell id={id+'-cancer'} kind="cancer" x={710} y={930} r={245} frame={f} camouflage={.68*shift}/>
   <Cell id={id+'-immune'} kind="immune" x={mix(130,250,close)-off*35} y={780+off*70} r={230} frame={f} contact={close*(1-off)} alpha={1-off*.25}/>
   <MarkerRing x={710} y={930} r={248} kind={shift>.5?0:1} count={8} offset={.1}/>
   <path d="M430 860Q490 830 525 820" fill="none" stroke={P.rose} strokeWidth="15" strokeLinecap="round" pathLength="1" strokeDasharray={`${off} 1`}/>
   <g transform={`translate(475 850) scale(${off})`}><path d="M-18 1V-18A18 18 0 0 1 18-18V1" fill="none" stroke={P.gold} strokeWidth="8"/><rect x="-28" y="-1" width="56" height="43" rx="9" fill={P.violet}/><circle cy="17" r="5" fill={P.ivory}/></g>
   <Granules a={[410,850]} b={[600,925]} frame={f} start={scene.start_frame+14} count={off>.2?0:5}/>
   {kind==='disguise'&&Array.from({length:8},(_,i)=>{const q=ease(t,i*3,55+i*3);return <Cell key={i} id={id+'-hidden'+i} kind="cancer" x={200+i%4*235} y={1230+Math.floor(i/4)*255} r={100*q} frame={f} seed={i} camouflage={.78} alpha={q*.75}/>;})}
   <path d={`M${mix(60,1000,ease(t,10,120))} 400V1420`} stroke={P.teal} strokeWidth="3" opacity=".20"/>
  </>;
 }
 if(kind==='spread'){
  const enter=ease(t,8,56),travel=ease(t,48,115),leave=ease(t,110,155);
  const p=travel<1?cubic(travel,[360,1090],[510,900],[690,1100],[770,820]):cubic(leave,[770,820],[870,750],[720,590],[660,520]);
  return <>{bg}
   <path d="M-110 1270C260 1280 760 1510 1220 1050L1220 440C850 810 300 670-110 730Z" fill="#651C4A"/>
   <path d="M-110 1270C260 1280 760 1510 1220 1050M-110 730C300 670 850 810 1220 440" stroke="#B04B75" strokeWidth="45" fill="none"/>
   <path d="M-110 1255C260 1265 760 1495 1220 1035M-110 745C300 685 850 825 1220 455" stroke="#ED8B98" strokeWidth="8" fill="none" opacity=".5"/>
   {Array.from({length:8},(_,i)=>{const u=(t/130+i/8)%1,p=cubic(u,[-200,1050],[150,800],[650,1350],[1280,710]);return <RBC key={i} x={p[0]} y={p[1]} r={60+i%3*16} angle={-15+i*27+u*40}/>;})}
   <Cell id={id+'-migrant'} kind="cancer" x={mix(250,p[0],enter)} y={mix(1420,p[1],enter)} r={116} frame={f} stretch={[1-Math.sin(enter*Math.PI)*.35,1+Math.sin(enter*Math.PI)*.12]} angle={travel*55-leave*40}/>
   <defs><clipPath id={id+'-entry-gap'}><rect x="-200" y="1100" width="470" height="540"/><rect x="450" y="1100" width="900" height="540"/></clipPath></defs>
   <g clipPath={`url(#${id}-entry-gap)`}><path d="M-110 1270C260 1280 760 1510 1220 1050" stroke="#B04B75" strokeWidth="45" fill="none"/><path d="M-110 1255C260 1265 760 1495 1220 1035" stroke="#ED8B98" strokeWidth="8" fill="none" opacity=".5"/></g>
   {leave>0&&<Cell id={id+'-new-site'} kind="cancer" x={775} y={400} r={70*leave} frame={f} seed={4} alpha={leave}/>}
   <path d="M120 1600Q420 1640 500 1410" stroke={P.rose} strokeWidth="6" fill="none" pathLength="1" strokeDasharray={`${enter*.9} 1`} opacity=".4"/>
  </>;
 }
 if(kind==='question')return <><MicroscopeFrame f={t}/><ellipse cx="535" cy="700" rx="330" ry="430" fill="#F9C47A" opacity={.025+.025*ease(t,0,65)}/></>;
 if(kind==='therapy'){
  const ix=290,iy=890,tx=755,ty=1020,brake=ease(f,E.brakes-22,E.brakes+16),contact=ease(f,E.brakes+10,E.brakes+34),attack=E.brakes+34,death=ease(f,attack+17,attack+48);
  const drug=ease(t,6,78),d=cubic(drug,[510,260],[180,370],[500,600],[505,817]);
  return <>{bg}<Cell id={id+'-target'} kind="cancer" x={tx} y={ty} r={225*(1-death*.35)} frame={f} alpha={1-death}/>
   <Cell id={id+'-immune'} kind="immune" x={ix+contact*35} y={iy} r={245} frame={f} contact={contact}/>
   <MarkerRing x={tx} y={ty} r={225} count={6} kind={1} alpha={1-death}/>
   <path d={`M460 900Q520 ${890-brake*75} 570 930`} fill="none" stroke={P.rose} strokeWidth="15" strokeLinecap="round" opacity={1-brake}/>
   <g transform={`translate(${505+brake*80} ${900+brake*130}) rotate(${brake*80})`} opacity={1-brake}><path d="M-17 0V-17A17 17 0 0 1 17-17V0" fill="none" stroke={P.gold} strokeWidth="8"/><rect x="-26" width="52" height="43" rx="8" fill={P.violet}/></g>
   <Antibody x={d[0]} y={d[1]} angle={mix(-24,160,drug)} s={.9} active={brake}/>
   {Array.from({length:4},(_,i)=><Antibody key={i} x={120+i*255} y={250+Math.sin(t*.015+i)*40+t*.25} angle={i*51} s={.28} />)}
   <Granules a={[495,930]} b={[710,1010]} frame={f} start={attack}/><Debris x={tx} y={ty} age={f-attack-24} r={170}/>
   <Ripple x={505} y={880} age={f-E.brakes-4} color={P.teal} r={140}/>
  </>;
 }
 if(kind==='outcomes'){
  const contrast=ease(f,E.not_everyone-22,E.not_everyone+35),die=ease(t,8,55);
  return <>{bg}
   <path d="M540 480C485 810 590 1090 535 1390" stroke={P.violet} strokeWidth="3" opacity={contrast*.4} fill="none"/>
   <Cell id={id+'-responding-immune'} kind="immune" x={285} y={635} r={150} frame={f}/>
   <Cell id={id+'-responding-target'} kind="cancer" x={285} y={1000} r={160*(1-die*.6)} frame={f} alpha={1-die}/>
   <Granules a={[285,765]} b={[285,960]} frame={f} start={scene.start_frame+4}/><Debris x={285} y={1000} age={t-30} r={110}/>
   <g opacity={contrast}><Cell id={id+'-resistant'} kind="cancer" x={790} y={1000} r={180} frame={f} camouflage={.35}/><Cell id={id+'-resistant-immune'} kind="immune" x={790} y={610} r={135} frame={f} alpha={.65}/>
    <MarkerRing x={790} y={1000} r={181} kind={2} count={7}/>
    <Antibody x={690} y={810} angle={-35} s={.42}/><Antibody x={940} y={850} angle={55} s={.42}/>
   </g>
   {Array.from({length:4},(_,i)=>{const show=ease(f,E.many+i*8,E.many+i*8+30);return <Cell key={i} id={id+'-variation'+i} kind="cancer" x={180+i*240} y={1370} r={(70+i%2*12)*show} frame={f} seed={i*3} camouflage={i*.2} alpha={show*.7}/>;})}
  </>;
 }
 // Ending leaves a recognition problem visibly unresolved, then approaches one
 // contact. It does not depict a promised universal cure or cut to an end card.
 const search=ease(t,10,115),focus=ease(f,E.see-30,E.see+20),closing=ease(f,2248,2280);
 const ix=mix(130,330,search),iy=mix(550,740,search);
 return <>{bg}<Cell id={id+'-remaining'} kind="cancer" x={720} y={1010} r={270} frame={f} camouflage={mix(.72,.30,focus)}/>
  <Cell id={id+'-searcher'} kind="immune" x={ix} y={iy} r={220} frame={f} contact={focus*.4}/>
  <MarkerRing x={720} y={1010} r={275} kind={2} count={8} offset={.25}/>
  <g transform={`translate(${mix(1000,478,focus)} ${mix(610,865,focus)}) rotate(${mix(80,15,focus)})`}><SurfaceMarker x={0} y={0} kind={2} scale={1.6} color={P.teal}/></g>
  <path d="M485 855Q525 860 544 900" fill="none" stroke={P.gold} strokeWidth="4" strokeDasharray="5 12" opacity={focus*.6}/>
  <Ripple x={530} y={890} age={f-2225} duration={50} r={110} color={P.teal}/>
  <rect width={W} height={H} fill={P.deep} opacity={closing*.32}/>
 </>;
};

const Caption:React.FC<{frame:number}>=({frame:f})=>{
 const c=timing.captions.find(c=>f/30>=c.start&&f/30<c.end);if(!c)return null;
 const lines=c.lines;
 return <g fill={P.ivory} stroke="#172334" strokeWidth="6" paintOrder="stroke" strokeLinejoin="round" fontFamily="DejaVu Sans, sans-serif" fontSize="49" fontWeight="600" textAnchor="middle">
  {lines.map((line,i)=><text key={i} x="515" y={1558+i*61}>{line}</text>)}
 </g>;
};

/** Authored handoffs use the cell, contact, tissue wall or microscope lens.
 * Escape→disguise is a continuous composition and needs no transition mask. */
const Transition:React.FC<{scene:string;progress:number;id:string;children:React.ReactNode}>=({scene,progress:p,id,children})=>{
 let shape:React.ReactNode,transform:string|undefined;
 if(scene==='spread'){
  const y=mix(2110,-500,p);shape=<path d={`M-160 ${y}C260 ${y-170} 760 ${y+320} 1240 ${y-40}V2300H-160Z`}/>;
 }else if(scene==='question'){
  const r=mix(2350,0,p),cx=mix(600,460,p),cy=mix(950,1190,p);
  shape=<path fillRule="evenodd" clipRule="evenodd" d={`M-200-200H1280V2120H-200Z M${cx-r},${cy}a${r},${r} 0 1,0 ${r*2},0a${r},${r} 0 1,0 ${-r*2},0Z`}/>;
 }else if(scene==='surveillance'){
  const x=mix(-1500,1700,p);shape=<path d={`M-180-180H${x}Q${x+260} 850 ${x-100} 2100H-180Z`}/>;
 }else{
  const anchors:Record<string,[number,number,number]>={healthy:[535,875,260],mutation:[535,850,100],division:[535,880,175],escape:[560,900,80],therapy:[450,840,40],outcomes:[755,1020,90],ending:[790,1000,155]};
  const [cx,cy,initial]=anchors[scene]||[535,900,50],r=mix(initial,2350,p*p);
  shape=<ellipse cx={cx} cy={cy} rx={r} ry={r*1.02}/>;
  if(scene==='division')transform=`translate(535 880) scale(${mix(1.62,1,p)}) translate(-535 -880)`;
  if(scene==='ending')transform=`translate(790 1000) scale(${mix(.70,1,p)}) translate(-790 -1000)`;
 }
 return <><defs><clipPath id={id}>{shape}</clipPath></defs><g clipPath={`url(#${id})`}><g transform={transform}>{children}</g></g></>;
};

export const cancerShortConfig={width:W,height:H,fps:30,durationInFrames:2280};
export const CancerShort:React.FC<{includeAudio?:boolean;captions?:boolean}>=({includeAudio=true,captions=true})=>{
 const f=useCurrentFrame();const [handle]=useState(()=>delayRender('Load cancer production artwork'));
 useEffect(()=>{const files=[A+'cell-components.png',...['medicine-source','medicine-clean','medicine-cutouts','medicine-blink','medicine-cell-atlas'].map(n=>'assets/artwork/scene-motion/'+n+'.png'),...['environment-clean','window-clouds','hanging-vine','window-plant'].map(n=>'assets/artwork/medicine-layers-v1/'+n+'.png')];
  Promise.all(files.map(file=>new Promise<void>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error('Missing production asset: '+file));im.src=staticFile(file);}))).then(()=>continueRender(handle)).catch(cancelRender);
 },[handle]);
 const i=Math.max(0,timing.scenes.findIndex(s=>f>=s.start_frame&&f<s.end_frame)),scene=timing.scenes[i];
 const transition=20,previous=timing.scenes[Math.max(0,i-1)],age=f-scene.start_frame;
 return <AbsoluteFill style={{background:P.deep}}><svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
  {i>0&&scene.id!=='disguise'&&age<transition?<><CancerScene scene={previous} frame={f} id={'prev-'+previous.id}/><Transition scene={scene.id} progress={phase(age,0,transition,'decelerate')} id={'join-'+scene.id}><CancerScene scene={scene} frame={f} id={'now-'+scene.id}/></Transition></>:<CancerScene scene={scene} frame={f} id={'now-'+scene.id}/>}
  {captions&&<Caption frame={f}/>}
 </svg>{includeAudio&&<Audio src={staticFile('assets/audio/cancer-short-v1/final-mix.m4a')}/>}</AbsoluteFill>;
};
