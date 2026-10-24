import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Audio,Img,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame} from 'remotion';
import narration from './data/singularity-narration.json';
import artwork from './data/singularity-artwork.json';
import {IllustratedTitle} from './IllustratedTitle';
import {MotionSol} from './MotionCharacters';

const ROOT='assets/artwork/singularity/';
const C={navy:'#11152F',plum:'#42275F',cream:'#FFF1CF',gold:'#FFCD72',coral:'#FF7188',teal:'#67E1CF',lilac:'#B796F5'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const at=(v:number,a:number,b:number)=>ease((v-a)/(b-a));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const mod=(v:number,n:number)=>(v%n+n)%n;
const hash=(n:number)=>mod(Math.sin(n*127.1+311.7)*43758.5453123,1);
const beatAt=(f:number)=>narration.visualBeats.find(b=>f>=b.startFrame&&f<b.endFrame)||narration.visualBeats[narration.visualBeats.length-1];
type Kind='opening'|'star'|'atom'|'plasma'|'limit'|'ideas'|'galaxies'|'afterglow'|'elements'|'observatory'|'gravity'|'room'|'extent'|'quantum'|'time'|'bounce'|'inflation'|'multiverse'|'vacuum'|'evidence'|'human'|'rewind'|'ending';
const SECTIONS:{from:number;to:number;kind:Kind}[]=[
 {from:1,to:2,kind:'opening'},{from:3,to:3,kind:'star'},{from:4,to:4,kind:'atom'},
 {from:5,to:6,kind:'plasma'},{from:7,to:7,kind:'limit'},{from:8,to:8,kind:'ideas'},
 {from:9,to:9,kind:'galaxies'},{from:10,to:10,kind:'afterglow'},{from:11,to:11,kind:'elements'},
 {from:12,to:12,kind:'observatory'},{from:13,to:16,kind:'gravity'},
 {from:17,to:19,kind:'room'},{from:20,to:23,kind:'extent'},
 {from:24,to:27,kind:'quantum'},{from:28,to:31,kind:'time'},
 {from:32,to:35,kind:'bounce'},{from:36,to:37,kind:'inflation'},
 {from:38,to:40,kind:'multiverse'},{from:41,to:43,kind:'vacuum'},
 {from:44,to:46,kind:'evidence'},{from:47,to:49,kind:'human'},
 {from:50,to:50,kind:'rewind'},{from:51,to:52,kind:'ending'},
];
const sectionAt=(id:number)=>SECTIONS.find(s=>id>=s.from&&id<=s.to)!;

// Backplates are composited as cached image layers outside the moving SVG.
// This keeps native drawing quality and avoids repainting a huge background
// texture for every small foreground motion.
const Background:React.FC<{name?:string;opacity?:number}>=()=>null;
const Backplate:React.FC<{kind:Kind;beat:number;frame:number;opacity:number}>=({kind,beat,frame,opacity})=>{
 const section=sectionAt(beat),time=(frame-narration.visualBeats[section.from-1].startFrame)/30;
 const name=kind==='room'?'thought-room':kind==='time'?'time-landscape':kind==='human'||kind==='observatory'||kind==='evidence'&&beat===46?'observatory-background':kind==='plasma'||kind==='elements'?'plasma-background':['limit','ending','gravity','quantum','inflation','vacuum','afterglow'].includes(kind)?'calm-background':'cosmos-background';
 const scale=kind==='room'?1.45-.45*at(time,10,19):1;
 const image=(file:string,alpha=1)=><Img src={staticFile(ROOT+file+'.png')} style={{position:'absolute',left:-25,top:-15,width:1970,height:1110,objectFit:'cover',opacity:alpha}}/>;
 return <AbsoluteFill style={{opacity,zIndex:0,transform:`scale(${scale}) translateZ(0)`,transformOrigin:'960px 450px',overflow:'hidden'}}>{image(name)}{kind==='afterglow'&&image('plasma-background',1-at(time,2,11))}</AbsoluteFill>;
};

/** A viewport isolates one independently animated PNG object from its alpha
 * sheet. It does not pan a flattened illustration as a substitute for motion. */
const Sprite:React.FC<{sheet:string;cell:number;x:number;y:number;size:number;angle?:number;opacity?:number;wide?:boolean}>=({sheet,cell,x,y,size,angle=0,opacity=1,wide=false})=>{
 const w=wide?768:512,h=512,height=size*h/w;
 return <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={opacity}>
  <image href={staticFile(ROOT+sheet+'-'+cell+'.png')} x={-size/2} y={-height/2} width={size} height={height}/>
 </g>;
};
const Label:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=34,fill=C.cream,anchor='middle'})=><text x={x} y={y} textAnchor={anchor} fill={fill} stroke={C.navy} strokeWidth="3" paintOrder="stroke" strokeLinejoin="round" fontSize={size} fontWeight="650">{children}</text>;

const Stars:React.FC<{time:number;count?:number;opacity?:number}>=({time,count=54,opacity=1})=><g opacity={opacity}>
 {Array.from({length:count},(_,i)=>{const d=.25+hash(i+18)*.7,x=mod(hash(i+1)*2020-time*d,2020)-50,y=hash(i+100)*1030+10,r=.8+hash(i+222)*2;return <circle key={i} cx={x} cy={y} r={r} fill={i%5?C.cream:C.teal} opacity={.22+d*.55}/>;})}
</g>;
const Ribbons:React.FC<{time:number;opacity?:number;warm?:boolean}>=({time,opacity=.16,warm=false})=><g opacity={opacity}>
 <Sprite sheet="field-ribbons" cell={warm?2:0} x={325+Math.sin(time/17)*48} y={200+Math.sin(time/11)*20} size={1350} angle={-13+Math.sin(time/23)*3} wide/>
 <Sprite sheet="field-ribbons" cell={warm?1:3} x={1500+Math.cos(time/21)*60} y={760+Math.sin(time/14)*30} size={1250} angle={158+Math.sin(time/27)*4} wide/>
</g>;
const Cosmos:React.FC<{time:number;dim?:number;calm?:boolean}>=({time,dim=0,calm=false})=><><Background name={calm?'calm-background':'cosmos-background'}/><Ribbons time={time} opacity={calm?.09:.16}/><Stars time={time} count={calm?24:54}/>{dim>0&&<rect width="1920" height="1080" fill={C.navy} opacity={dim}/>}</>;

const GALAXIES=Array.from({length:17},(_,i)=>({x:70+(i%5)*430+(Math.floor(i/5)%2)*155,y:120+Math.floor(i/5)*285,size:120+hash(i+45)*180,cell:i%6,angle:hash(i+77)*80-40}));
const GalaxyField:React.FC<{time:number;scale?:number;opacity?:number;offset?:number;count?:number}>=({time,scale=1,opacity=1,offset=0,count=17})=><g opacity={opacity}>
 {GALAXIES.slice(0,count).map((g,i)=><Sprite key={i} sheet="galaxies-atlas" cell={g.cell} x={960+(g.x-960)*scale+offset} y={490+(g.y-490)*scale+Math.sin(time/16+i)*6} size={g.size*(.68+scale*.32)} angle={g.angle+time*.06}/>)}
</g>;

const Nucleus:React.FC<{x:number;y:number;size:number;count?:number;time?:number}>=({x,y,size,count=1,time=0})=>{
 if(count<=4)return <Sprite sheet="nuclei-atlas" cell={count===1?0:count===2?2:3} x={x} y={y} size={size} angle={Math.sin(time/6)*4}/>;
 return <g>{Array.from({length:count},(_,i)=>{const a=i*2.399963+time*.025,r=Math.sqrt(i/count)*size*.29;return <Sprite key={i} sheet="nuclei-atlas" cell={i%2} x={x+Math.cos(a)*r} y={y+Math.sin(a)*r*.8} size={size*.34}/>;})}</g>;
};
const Atom:React.FC<{x:number;y:number;size:number;time:number;ionize?:number}>=({x,y,size,time,ionize=0})=><g transform={`translate(${x} ${y})`}>
 {[0,80].map((angle,i)=><g key={i} transform={`rotate(${angle})`} opacity={1-ionize*.6}>
  <ellipse rx={size*.43} ry={size*.17} fill="none" stroke={i===1?C.teal:C.lilac} strokeWidth="3" opacity=".48"/>
  <circle cx={Math.cos(time*(.55+i*.08)+i)*size*(.43+ionize)} cy={Math.sin(time*(.55+i*.08)+i)*size*(.17+ionize*.5)} r={size*.022} fill={C.cream}/>
 </g>)}
 <Nucleus x={0} y={0} size={size*.43} count={4} time={time}/>
</g>;

const Grid:React.FC<{time:number;mass?:number;contract?:number}>=({time,mass=1,contract=0})=>{
 const center=960+Math.sin(time/10)*60;
 return <g fill="none" stroke={C.teal} strokeWidth="2.2" opacity=".33">
  {Array.from({length:13},(_,i)=>{const y=270+i*45,fall=mass*120*Math.exp(-(((y-600)/260)**2));return <path key={'h'+i} d={`M-120 ${y}C${center-420} ${y} ${center-220} ${y+fall} ${center} ${y+fall}S${center+450} ${y} 2040 ${y}`}/>;})}
  {Array.from({length:17},(_,i)=>{const x=(i-8)*130*(1-contract*.6)+960,bend=(960-x)*mass*.24;return <path key={'v'+i} d={`M${x} 200Q${x+bend} 530 ${x} 940`}/>;})}
 </g>;
};

const FloatingParticles:React.FC<{time:number;count?:number;spread?:number;opacity?:number}>=({time,count=28,spread=1,opacity=1})=><g opacity={opacity}>
 {Array.from({length:count},(_,i)=>{const x=960+(hash(i+71)*2200-1100)*spread+Math.sin(time/3+i)*16,y=500+(hash(i+117)*1200-600)*spread+Math.cos(time/4+i)*13;return <Sprite key={i} sheet="nuclei-atlas" cell={i%2} x={x} y={y} size={42+hash(i+5)*66}/>;})}
</g>;

const ObservingRoom:React.FC<{time:number;human?:boolean;phase?:number;frame:number;id:string}>=({time,human=false,phase=0,frame,id})=>{
 const pose=235+at(time,1,9)*155+at(time,13,20)*75;
 return <>
  <Background name="observatory-background"/>
  <defs><clipPath id={`${id}-sky`}><path d="M365 675V370C365 160 620-85 960-85S1555 160 1555 370V675Z"/></clipPath></defs>
  <g clipPath={`url(#${id}-sky)`}>
   <Stars time={time*1.5} count={65} opacity={.65}/>
   <Sprite sheet="galaxies-atlas" cell={1} x={840+time*.6} y={285} size={460} angle={-10+time*.12} opacity={human?.45:.8}/>
   <Sprite sheet="field-ribbons" cell={1} x={1190+Math.sin(time/15)*22} y={180} size={1100} angle={-8} opacity={.18} wide/>
  </g>
  <ellipse cx={595} cy={930} rx={185} ry={23} fill={C.navy} opacity=".4"/>
  <Sprite sheet="props-atlas" cell={1} x={595} y={720} size={560}/>
  {human&&<>
   <ellipse cx="1370" cy="1008" rx="110" ry="19" fill={C.navy} opacity=".38"/>
   <g transform="translate(1370 1008) scale(.96)"><MotionSol frame={pose} id={id+'-sol'}/></g>
   {phase>0&&<g opacity={at(phase,0,.14)*(1-at(phase,.85,1))}>
    <Nucleus x={1030} y={550} size={190} count={phase<.35?1:phase<.7?12:16} time={time}/>
    <path d="M1115 575Q1215 560 1240 665" fill="none" stroke={C.gold} strokeWidth="3" strokeDasharray="8 12" strokeDashoffset={-time*18}/>
   </g>}
  </>}
  <rect width="1920" height="1080" fill="url(#caption-shade)"/>
 </>;
};

type StageProps={frame:number;beat:number;kind:Kind;id:string};
const Stage:React.FC<StageProps>=({frame:f,beat,kind,id})=>{
 const current=beatAt(f),section=sectionAt(beat),first=narration.visualBeats[section.from-1],last=narration.visualBeats[section.to-1];
 const time=(f-first.startFrame)/30,globalTime=f/30,u=clamp((f-current.startFrame)/Math.max(1,current.endFrame-current.startFrame)),progress=clamp((f-first.startFrame)/Math.max(1,last.endFrame-first.startFrame));
 if(kind==='opening')return <>
  <Cosmos time={time}/><GalaxyField time={time} scale={lerp(1.12,.68,at(time,0,6.1))}/>
  <Sprite sheet="galaxies-atlas" cell={0} x={1380-time*7} y={565-time*4} size={580-time*14} angle={-8-time*.45}/>
  <g opacity={1-at(time,2.05,2.8)}><IllustratedTitle centerX={640} centerY={330} strokeScale={.63} tilt={-3} lines={[{text:'Before',size:136,baseline:300},{text:'the Big Bang?',size:105,baseline:423}]}/></g>
 </>;
 if(kind==='star')return <><Cosmos time={globalTime}/><Sprite sheet="stellar-atlas" cell={3} x={960} y={510} size={930} angle={-12+time} opacity={.65+u*.35}/><Sprite sheet="stellar-atlas" cell={0} x={960} y={500} size={lerp(580,140,ease(u))} opacity={1-at(u,.45,.97)}/><Stars time={globalTime} opacity={1-u*.7}/></>;
 if(kind==='atom')return <><Cosmos time={globalTime} dim={.25}/><Ribbons time={time} opacity={.42}/><Atom x={960} y={480} size={800} time={time} ionize={at(u,.12,.93)}/><FloatingParticles time={time} count={12} opacity={at(u,.4,.9)}/></>;
 if(kind==='plasma'){
  const dense=at(time,0,8);
  return <><Background name="plasma-background"/><rect width="1920" height="1080" fill={C.plum} opacity={dense*.15}/><Ribbons time={time*2} opacity={.25} warm/><FloatingParticles time={time} count={46} spread={lerp(1,.37,dense)} opacity={1-at(time,9.5,12)}/>
   <g opacity={at(time,5.4,6.1)}><Label x={960} y={420} size={210}>∞</Label><Label x={960} y={560} size={42}>{time<8.2?'Density':'Temperature'}</Label></g>
   {beat===6&&<Label x={960} y={715} size={40}>Classical extrapolation</Label>}
  </>;
 }
 if(kind==='limit'||kind==='ending')return <>
  <Cosmos time={globalTime} dim={.12} calm/><Ribbons time={time} opacity={.12}/><Grid time={time} mass={.5}/>
  <path d={`M${880+Math.sin(time/8)*12} 200Q${830+Math.cos(time/5)*25} 530 900 875`} stroke={C.gold} strokeWidth="8" fill="none"/>
  <g opacity={.7}><path d="M910 220Q1140 400 1040 850" stroke={C.lilac} strokeWidth="4" strokeDasharray="8 18" fill="none"/></g>
  {kind==='limit'&&[0,1,2,3].map(i=>{const age=mod(time+i*2.3,9.2)/9.2;return <Sprite key={i} sheet="galaxies-atlas" cell={i%3} x={lerp(180,890,age)} y={330+i*140} size={lerp(160,52,age)} opacity={1-at(age,.82,1)}/>;})}
  <Label x={1170} y={530} size={190}>?</Label><Label x={680} y={830} size={35}>Limit of the model</Label>
 </>;
 if(kind==='ideas')return <>
  <Cosmos time={globalTime} dim={.12}/><path d="M220 560C600 240 1300 830 1730 450" stroke={C.lilac} strokeWidth="12" opacity=".24" fill="none"/>
  <Sprite sheet="galaxies-atlas" cell={1} x={400} y={470} size={450} angle={time*.12}/>
  <g transform={`translate(960 ${480+Math.sin(time/5)*5})`}><Sprite sheet="stellar-atlas" cell={4} x={0} y={0} size={440}/><FloatingParticles time={time} count={0}/></g>
  <Label x={1510} y={540} size={185}>?</Label>
  <Label x={400} y={790} size={35}>What we observe</Label><Label x={960} y={790} size={35}>The hot early universe</Label><Label x={1510} y={790} size={35}>The ultimate origin</Label>
 </>;
 if(kind==='galaxies'||kind==='extent'){
  const scale=kind==='galaxies'?lerp(.72,1.25,ease(progress)):lerp(.84,1.13,ease(progress));
  return <><Cosmos time={globalTime}/><GalaxyField time={time} scale={scale} offset={kind==='extent'?Math.sin(time/14)*65:0}/>
   {kind==='galaxies'&&<g stroke={C.teal} strokeWidth="3" opacity=".5"><path d={`M${960-350*scale} 490H${960+350*scale}`} strokeDasharray="5 12"/><circle cx={960-350*scale} cy="490" r="7" fill={C.teal}/><circle cx={960+350*scale} cy="490" r="7" fill={C.teal}/></g>}
   {kind==='extent'&&beat>=22&&<><ellipse cx={960} cy={480} rx={620-(beat===23?at(u,0,1)*140:0)} ry={365-(beat===23?at(u,0,1)*70:0)} fill={C.navy} fillOpacity=".12" stroke={C.cream} strokeWidth="4" strokeDasharray="12 14"/><Label x={960} y={925} size={34}>Our observable region</Label></>}
  </>;
 }
 if(kind==='afterglow'){
  const clear=at(time,2,11),waves=at(time,7,16);
  return <><Background name="calm-background"/><g opacity={1-clear}><Background name="plasma-background"/></g><g opacity={1-clear*.9}><Ribbons time={time*2} opacity={.4} warm/><FloatingParticles time={time} count={24}/></g>
   <g opacity={clear}><Sprite sheet="props-atlas" cell={4} x={1430+Math.sin(time/7)*24} y={650} size={520} angle={-8+time*.35}/>
    {Array.from({length:9},(_,i)=>{const x=mod(i*260+time*95,2480)-300;return <path key={i} d={`M${x} 160Q${x+120} 430 ${x} 690T${x} 1170`} stroke={i%2?C.coral:C.gold} strokeWidth="5" opacity={.2+waves*.22} fill="none"/>;})}
   </g>
   <g opacity={at(time,3,4)*(1-at(time,12,14))}><Label x={430} y={200} size={42}>380,000 years</Label></g>
   <g opacity={at(time,13,17)}><Label x={530} y={350} size={40}>Ancient light</Label><Label x={530} y={410} size={31}>Stretched into microwaves</Label></g>
  </>;
 }
 if(kind==='elements')return <>
  <Background name="plasma-background"/><rect width="1920" height="1080" fill={C.plum} opacity=".4"/><Ribbons time={time} opacity={.16} warm/>
  {[{x:420,n:1,label:'Hydrogen'},{x:960,n:4,label:'Helium'},{x:1500,n:2,label:'Deuterium'}].map((p,i)=><g key={p.label} opacity={at(time,i*.45,i*.45+.65)}><Nucleus x={p.x} y={480+Math.sin(time/6+i)*7} size={370} count={p.n} time={time}/><Label x={p.x} y={785} size={39}>{p.label}</Label></g>)}
 </>;
 if(kind==='observatory')return <><ObservingRoom time={time} frame={f} id={id}/><g opacity={at(time,1,2)*(1-at(time,10,12))}><Label x={960} y={220} size={58}>13.8 billion years</Label></g></>;
 if(kind==='gravity'){
  const contraction=at(time,14,31);
  return <><Cosmos time={globalTime} dim={.12} calm/><Grid time={time} mass={1-contraction*.55} contract={contraction}/>
   <Sprite sheet="props-atlas" cell={0} x={990+Math.sin(time/13)*65} y={490} size={330*(1-contraction*.5)} angle={time*.2} opacity={1-at(time,13,17)}/>
   {Array.from({length:8},(_,i)=><circle key={i} cx={960+(i%4-1.5)*380*(1-contraction*.7)} cy={300+Math.floor(i/4)*390} r={8} fill={i%2?C.teal:C.coral} opacity={at(time,13,18)}/>)}
   {beat>=15&&<><rect x="1185" y="180" width="6" height="660" rx="3" fill={C.gold}/><Label x={1470} y={420} size={beat===16?150:44}>{beat===16?'∞':'?'}</Label><Label x={1450} y={750} size={34}>Extrapolation</Label><Label x={650} y={850} size={34}>Tested description</Label></>}
  </>;
 }
 if(kind==='room'){
  const pull=1.45-.45*at(time,10,19),blast=at(time,9,14),dot=1-at(time,9,11);
  return <><g transform={`translate(960 450) scale(${pull}) translate(-960 -450)`}><Background name="thought-room"/>
   <Sprite sheet="stellar-atlas" cell={2} x={960} y={485} size={175} opacity={dot}/>
   {Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2;return <Sprite key={i} sheet="galaxies-atlas" cell={i%6} x={960+Math.cos(a)*blast*500} y={485+Math.sin(a)*blast*260} size={125*blast} opacity={blast}/>;})}
  </g><Label x={960} y={150} size={33}>A misleading picture</Label></>;
 }
 if(kind==='quantum')return <>
  <Background name="calm-background"/><rect width="1920" height="1080" fill={C.navy} opacity=".15"/>
  <Sprite sheet="field-ribbons" cell={0} x={620+Math.sin(time/10)*65} y={430} size={1250} angle={-12+Math.sin(time/13)*6} wide/>
  <Sprite sheet="field-ribbons" cell={1} x={1310-Math.sin(time/12)*50} y={610} size={1250} angle={12+Math.sin(time/16)*5} wide/>
  <Grid time={time} mass={.65}/><FloatingParticles time={time} count={12} spread={.7} opacity={.8}/>
  {beat===24&&<><Label x={450} y={210} size={42}>Quantum physics</Label><Label x={1460} y={210} size={42}>Gravity</Label></>}
  {beat>=26&&<Label x={960} y={540} size={170}>?</Label>}
 </>;
 if(kind==='time'){
  const domain=beat===30;
  return <><Background name="time-landscape"/><Sprite sheet="field-ribbons" cell={3} x={1480-Math.sin(time/14)*30} y={720} size={1400} opacity={.3} wide/>
   <g opacity={1-(domain?at(u,.02,.22)*.6:0)}><circle cx="1135" cy="475" r={17+Math.sin(time*1.4)*2} fill={C.gold} opacity=".8"/><circle cx="1135" cy="475" r={33+Math.sin(time*1.4)*3} stroke={C.cream} fill="none" strokeWidth="3" opacity=".4"/></g>
   {domain&&<><rect width="1920" height="1080" fill={C.navy} opacity=".4"/><Sprite sheet="props-atlas" cell={2} x={960} y={470} size={760+u*35} angle={-4+u*6}/><Label x={960} y={885} size={36}>A map has a domain</Label></>}
   {beat<=29&&<Label x={960} y={150} size={34}>One possible history</Label>}
   {beat===28&&<Label x={1360} y={420} size={150}>?</Label>}
  </>;
 }
 if(kind==='bounce'){
  const contraction=1-at(time,0,9),expansion=at(time,10,24),scale=.25+contraction*.7+expansion*.75;
  return <><Cosmos time={globalTime}/><Ribbons time={time} opacity={.6} warm/><GalaxyField time={time} scale={scale} count={13}/>
   <path d="M310 270C570 270 610 820 960 820S1350 270 1610 270" stroke={C.gold} strokeWidth="7" fill="none" opacity=".65"/>
   <Label x={960} y={150} size={36}>Hypothetical bounce</Label>
   {beat>=34&&<Label x={960} y={940} size={34}>Not established by observations</Label>}
  </>;
 }
 if(kind==='inflation'){
  const scale=1+at(time,0,18)*4;
  return <><Background name="calm-background"/><g transform={`translate(960 520) scale(${scale}) translate(-960 -520)`}><Grid time={time} mass={0}/><Sprite sheet="field-ribbons" cell={0} x={700} y={430} size={850} opacity={.8} wide/><Sprite sheet="field-ribbons" cell={1} x={1200} y={600} size={900} opacity={.8} wide/></g><Label x={960} y={150} size={36}>Proposed early inflation</Label></>;
 }
 if(kind==='multiverse')return <>
  <Cosmos time={globalTime} dim={.25}/>
  {[{x:475,y:450,r:245,c:0},{x:1110,y:600,r:260,c:1},{x:1510,y:260,r:170,c:2}].map((b,i)=>{
   const x=b.x+Math.sin(time/12+i)*18,y=b.y+Math.cos(time/14+i)*12,cid=id+'-bubble-'+i;
   return <g key={i}><defs><clipPath id={cid}><circle cx={x} cy={y} r={b.r}/></clipPath></defs><circle cx={x} cy={y} r={b.r} fill={C.navy} stroke={[C.teal,C.lilac,C.coral][i]} strokeWidth="4"/><g clipPath={`url(#${cid})`}><Sprite sheet="field-ribbons" cell={b.c} x={x+Math.sin(time/8)*30} y={y} size={b.r*3.3} wide/><Stars time={time+i*100} count={17} opacity={.3}/></g></g>;
  })}
  <Label x={960} y={150} size={36}>Speculative possibilities</Label>
  {beat===39&&<Label x={960} y={480} size={145}>?</Label>}
 </>;
 if(kind==='vacuum'){
  const reveal=beat===41?at(time,3,7):1;
  return <><Background name="calm-background"/><rect width="1920" height="1080" fill={C.navy} opacity=".65"/>
   <g opacity={reveal}>
    {[0,1,2].map(i=><Sprite key={i} sheet="field-ribbons" cell={i%2} x={500+i*450+Math.sin(time/7+i)*70} y={370+i%2*250} size={1250} angle={Math.sin(time/9+i)*12} opacity={.6} wide/>)}
    {Array.from({length:7},(_,i)=><path key={i} d={`M-100 ${250+i*85}Q450 ${100+i*85+Math.sin(time/5+i)*45} 960 ${300+i*70}T2020 ${250+i*85}`} stroke={i%2?C.teal:C.lilac} strokeWidth="3" opacity=".25" fill="none"/>)}
   </g>
   <Label x={960} y={190} size={41}>{beat===43?'A physical framework':'A quantum vacuum'}</Label>
  </>;
 }
 if(kind==='evidence'){
  if(beat===46)return <><ObservingRoom time={time} frame={f} id={id}/><g opacity={.58}><path d={`M550 370Q750 ${310+Math.sin(time)*25} 950 370T1350 370`} fill="none" stroke={C.teal} strokeWidth="4"/><Label x={960} y={210} size={33}>Possible relic signals</Label></g></>;
  return <><Cosmos time={globalTime}/><GalaxyField time={time} scale={.85} opacity={.7}/><Sprite sheet="props-atlas" cell={4} x={400} y={490} size={480} angle={-10}/><Sprite sheet="stellar-atlas" cell={4} x={1020} y={490} size={540}/><Label x={1530} y={520} size={165}>?</Label><Label x={410} y={810} size={33}>Evidence</Label><Label x={1010} y={810} size={33}>Hot early history</Label><Label x={1540} y={810} size={33}>Ultimate origin</Label></>;
 }
 if(kind==='human')return <><ObservingRoom time={time} frame={f} human phase={beat===48?u:0} id={id}/>{beat===49&&<g opacity={at(u,.1,.3)}><Sprite sheet="props-atlas" cell={3} x={850} y={620} size={500} angle={-7+u*6}/></g>}</>;
 if(kind==='rewind'){
  if(time<2.7)return <><Cosmos time={globalTime}/><GalaxyField time={time} scale={1-time*.15}/></>;
  if(time<5.2)return <><Cosmos time={globalTime}/><Sprite sheet="stellar-atlas" cell={3} x={960} y={480} size={950}/><Sprite sheet="stellar-atlas" cell={0} x={960} y={480} size={lerp(440,130,at(time,2.7,5.2))} opacity={1-at(time,4,5.2)}/></>;
  return <><Cosmos time={globalTime}/><Atom x={960} y={480} size={700} time={time} ionize={at(time,5.2,8)}/></>;
 }
 return <Cosmos time={time}/>;
};

export const SingularityFilm:React.FC<{captions?:boolean;includeAudio?:boolean}>=({captions=true,includeAudio=true})=>{
 const frame=useCurrentFrame(),time=frame/30,current=beatAt(frame),section=sectionAt(current.id);
 const sectionStart=narration.visualBeats[section.from-1].startFrame;
 const [handle]=useState(()=>delayRender('Load original singularity layers and fonts'));
 useEffect(()=>{
  const urls=[...artwork.map(a=>ROOT+a.file),...['atlas.png','blinks.png'].map(a=>'assets/artwork/approved-characters/'+a)];
  const images=urls.map(url=>new Promise<void>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error('Missing film layer '+url));im.src=staticFile(url);}));
  const fonts=[new FontFace('Nunito',`url(${staticFile('assets/fonts/Nunito.ttf')})`,{weight:'200 1000'}).load(),new FontFace('Outfit',`url(${staticFile('assets/fonts/Outfit.ttf')})`,{weight:'100 900'}).load()].map(p=>p.then(font=>{document.fonts.add(font);}));
  Promise.all([...images,...fonts]).then(()=>continueRender(handle)).catch(cancelRender);
 },[handle]);
 const opacity=sectionStart>0?at(frame,sectionStart,sectionStart+11):1;
 const previous=sectionStart>0&&opacity<1?beatAt(sectionStart-1):null;
 const caption=captions?narration.captions.find(c=>time>=c.start&&time<c.end):undefined;
 return <AbsoluteFill style={{background:C.navy,fontFamily:'Outfit, sans-serif'}}>
  {previous&&<Backplate kind={sectionAt(previous.id).kind} beat={previous.id} frame={sectionStart-1} opacity={1}/>}
  <Backplate kind={section.kind} beat={current.id} frame={frame} opacity={opacity}/>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,zIndex:1}}>
   <defs><linearGradient id="caption-shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".78" stopColor={C.navy} stopOpacity="0"/><stop offset="1" stopColor={C.navy} stopOpacity=".35"/></linearGradient></defs>
   {previous&&<g opacity={1-opacity}><Stage frame={sectionStart-1} beat={previous.id} kind={sectionAt(previous.id).kind} id={'previous-'+previous.id}/></g>}
   <g opacity={opacity}><Stage frame={frame} beat={current.id} kind={section.kind} id={'current-'+section.from}/></g>
   <rect width="1920" height="1080" fill="url(#caption-shade)"/>
   {caption&&<text x="960" y={caption.text.includes('\n')?982:1012} textAnchor="middle" fontFamily="Outfit, sans-serif" fontSize="39" fontWeight="500" fill="#FFF9EC" stroke="#11152F" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round">{caption.text.split('\n').map((line,i)=><tspan key={i} x="960" dy={i?47:0}>{line}</tspan>)}</text>}
  </svg>
  {includeAudio&&<Audio src={staticFile('assets/audio/singularity/final-mix.m4a')}/>}
 </AbsoluteFill>;
};

export const singularityConfig={durationInFrames:narration.durationInFrames,fps:narration.fps,width:1920,height:1080};
