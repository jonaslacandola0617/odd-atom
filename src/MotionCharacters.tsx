import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Audio,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame} from 'remotion';
import {IllustratedTitle} from './IllustratedTitle';
import narration from './data/crowd-motion-narration.json';

const art='assets/artwork/approved-characters/';
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const at=(f:number,a:number,b:number)=>smooth((f-a)/(b-a));
/** Authored pose keys: held poses have zero velocity, with distinct anticipation,
 * stroke, overshoot and settle keys. There is no continuous character idle loop. */
const track=(f:number,keys:readonly (readonly [number,number])[])=>{
  if(f<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++)if(f<=keys[i][0]){
    const [a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*at(f,a,b);
  }
  return keys[keys.length-1][1];
};
const notice=Math.ceil(narration.beats.notice*30);
const caution=Math.ceil(narration.beats.conversation*30);
const resolve=Math.ceil(narration.beats.seen*30);
const response=notice+91;
const close=resolve+10;
const blink=(f:number,starts:number[])=>starts.some(s=>f>=s&&f<s+5);
const rotate=(p:[number,number],a:number,c:[number,number]):[number,number]=>{
  const r=a*Math.PI/180,cos=Math.cos(r),sin=Math.sin(r),x=p[0]-c[0],y=p[1]-c[1];
  return [c[0]+x*cos-y*sin,c[1]+x*sin+y*cos];
};
const Part:React.FC<{col:number;row:number;x:number;y:number;scale?:number;closed?:boolean}>=({col,row,x,y,scale=1,closed=false})=><svg x={x} y={y} width={384*scale} height={512*scale} viewBox={`${col*384} ${row*512} 384 512`} overflow="hidden"><image href={staticFile(art+(closed?'blinks.png':'atlas.png'))} width="1536" height="1024"/></svg>;

function miraPose(f:number){
  const lean=track(f,[[0,-.3],[42,-.3],[54,.7],[79,-1.25],[99,-.9],[notice+43,-.9],[notice+52,-1.5],[notice+79,1.8],[notice+96,1.1],[resolve+8,1.1],[resolve+14,.6],[resolve+37,2.7],[resolve+53,1.8],[599,1.8]]);
  const head=track(f,[[0,6],[44,6],[60,8],[81,10],[106,9],[notice+44,9],[notice+51,10],[notice+67,-5],[notice+80,-2],[response+2,-2],[response+13,1],[response+24,-2],[resolve+15,-2],[resolve+29,1.5],[resolve+44,-2],[599,-2]]);
  const cup=track(f,[[0,0],[notice+75,0],[response-7,-.1],[response+11,.45],[response+27,.36],[resolve+15,.36],[resolve+23,.12],[resolve+43,1],[resolve+56,.82],[resolve+73,.86],[599,.86]]);
  return {lean,head,cup,happy:f>=response+2,shoulder:cup*3,elbow:-cup*13,wrist:cup*4};
}
function solPose(f:number){
  return {
    lean:track(f,[[0,0],[notice+3,0],[notice+9,-.6],[notice+25,-2.2],[notice+45,-1.5],[notice+78,-1.5],[notice+94,-2.3],[notice+111,-1.7],[caution+7,-1.7],[caution+27,-.5],[resolve+29,-.5],[resolve+46,-1.3],[599,-1.3]]),
    head:track(f,[[0,1],[notice+1,1],[notice+10,-5],[notice+19,-3],[notice+62,-3],[notice+74,1.5],[notice+85,-3],[caution+9,-3],[caution+22,-.5],[resolve+23,-.5],[resolve+35,2],[resolve+47,-1.5],[599,-1.5]]),
    shoulder:track(f,[[0,-7],[notice+14,-7],[notice+20,-11],[notice+35,14],[notice+42,11],[notice+66,11],[notice+83,6],[notice+105,8],[caution+2,8],[caution+24,-3],[resolve+35,-3],[resolve+56,2],[599,2]]),
    elbow:track(f,[[0,-5],[notice+21,-5],[notice+29,3],[notice+43,14],[notice+53,11],[notice+72,11],[notice+88,5],[notice+107,7],[caution+4,7],[caution+29,-2],[resolve+38,-2],[resolve+59,4],[599,4]]),
    wrist:track(f,[[0,-2],[notice+29,-2],[notice+46,5],[notice+56,2],[notice+75,2],[notice+92,-3],[notice+111,1],[caution+10,1],[caution+31,-1],[599,-1]])
  };
}

type Point=[number,number];
/** Continuous texture skinning. Adjacent triangles share deformed vertices;
 * the approved illustration stays the texture, rather than exposing a cut edge
 * when an elbow bends. Lower legs receive zero torso weight. */
const Mesh:React.FC<{id:string;xs:number[];ys:number[];deform:(p:Point)=>Point;children:React.ReactNode}>=({id,xs,ys,deform,children})=>{
  const patches:React.ReactNode[]=[];
  for(let iy=0;iy<ys.length-1;iy++)for(let ix=0;ix<xs.length-1;ix++){
    const x=xs[ix],X=xs[ix+1],y=ys[iy],Y=ys[iy+1];
    const triangles:Point[][]=[[[x,y],[X,y],[x,Y]],[[X,Y],[x,Y],[X,y]]];
    for(const points of triangles){
      const [a,b,c]=points,[A,B,C]=points.map(deform),dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-dy*ex;
      const m0=((B[0]-A[0])*ey-(C[0]-A[0])*dy)/det;
      const m2=((C[0]-A[0])*dx-(B[0]-A[0])*ex)/det;
      const m1=((B[1]-A[1])*ey-(C[1]-A[1])*dy)/det;
      const m3=((C[1]-A[1])*dx-(B[1]-A[1])*ex)/det;
      const tx=A[0]-m0*a[0]-m2*a[1],ty=A[1]-m1*a[0]-m3*a[1];
      const cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3;
      // A subpixel texture bleed prevents antialias cracks between patches.
      const distances=points.map((p,i)=>{const q=points[(i+1)%3];return Math.abs((q[1]-p[1])*cx-(q[0]-p[0])*cy+q[0]*p[1]-q[1]*p[0])/Math.hypot(q[0]-p[0],q[1]-p[1]);});
      const bleed=1+.85/Math.min(...distances);
      const polygon=points.map(([px,py])=>`${cx+(px-cx)*bleed},${cy+(py-cy)*bleed}`).join(' ');
      const key=`${id}-patch-${patches.length}`;
      patches.push(<g key={key} transform={`matrix(${m0} ${m1} ${m2} ${m3} ${tx} ${ty})`}><clipPath id={key}><polygon points={polygon} shapeRendering="crispEdges"/></clipPath><use href={`#${id}-texture`} clipPath={`url(#${key})`}/></g>);
    }
  }
  return <><defs><g id={`${id}-texture`}>{children}</g></defs>{patches}</>;
};
const mixPoint=(a:Point,b:Point,t:number):Point=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const BODY_X=[-135,-105,-75,-45,-15,15,45,65,85,110,150];
const BODY_Y=[-510,-445,-420,-395,-370,-345,-320,-295,-275,-245,-215,-185,0];
const MIRA_X=[-120,-100,-85,-70,-55,-40,-25,-10,10,35,70];
const MIRA_Y=[-435,-415,-395,-380,-365,-350,-335,-320,-300,-280];
const SOL_X=[-225,-205,-185,-165,-150,-135,-120,-105,-90,-75,-60,-40];
const SOL_Y=[-440,-420,-400,-385,-370,-355,-340,-325,-310];
const bodyPoint=(point:Point,sol:boolean,lean:number):Point=>{
  let weight=smooth((-point[1]-275)/110);
  if(!sol)weight=Math.max(weight,smooth((point[0]-65)/20)*smooth((-point[1]-175)/35));
  return mixPoint(point,rotate(point,lean,[0,sol?-316:-310]),weight);
};
const miraArmPoint=(point:Point,p:ReturnType<typeof miraPose>):Point=>{
  const elbowWeight=Math.max(smooth((point[1]+388)/43+(point[0]+62)/95),smooth((point[0]+50)/25));
  const wristWeight=smooth((point[0]+42)/28);
  const q=mixPoint(point,rotate(point,p.wrist,[-25,-354]),wristWeight);
  return mixPoint(q,rotate(q,p.elbow,[-86,-338]),elbowWeight);
};
const solArmPoint=(point:Point,p:ReturnType<typeof solPose>):Point=>{
  const elbowWeight=smooth((-point[0]-65+(point[1]+380)*.5)/55);
  const wristWeight=smooth((-point[0]-140)/25);
  const q=mixPoint(point,rotate(point,p.wrist,[-155,-356]),wristWeight);
  return mixPoint(q,rotate(q,p.elbow,[-94,-371]),elbowWeight);
};
/** Geometry-only inspection hook; no production assets or API access. */
export const motionGeometry=(frame:number)=>{
  const m=miraPose(frame),s=solPose(frame);
  return [
    {name:'Mira body',xs:BODY_X,ys:BODY_Y,deform:(p:Point)=>bodyPoint(p,false,m.lean)},
    {name:'Sol body',xs:BODY_X,ys:BODY_Y,deform:(p:Point)=>bodyPoint(p,true,s.lean)},
    {name:'Mira arm',xs:MIRA_X,ys:MIRA_Y,deform:(p:Point)=>miraArmPoint(p,m)},
    {name:'Sol arm',xs:SOL_X,ys:SOL_Y,deform:(p:Point)=>solArmPoint(p,s)},
  ];
};
const Body:React.FC<{id:string;sol?:boolean;lean:number;rigid?:boolean}>=({id,sol=false,lean,rigid=false})=>{
  const body=<Part col={0} row={sol?1:0} x={sol?-215:-213} y={sol?-476:-507}/>;
  if(rigid)return body;
  return <Mesh id={`${id}-body`} xs={BODY_X} ys={BODY_Y} deform={point=>bodyPoint(point,sol,lean)}>{body}</Mesh>;
};

export const MotionMira:React.FC<{frame:number;id:string;crowd?:boolean}>=({frame:f,id,crowd=false})=>{
  const p=miraPose(crowd?0:f),closed=blink(f,[69,168,notice+54,response,resolve+24,562]);
  const bodyY=-310;
  const arm=<Part col={3} row={0} x={-145.9} y={-531.5} scale={.55} closed/>;
  const cupPoint=(birth:number)=>{
    const q=miraPose(crowd?0:birth);
    let point:[number,number]=[16,-387];
    point=miraArmPoint(point,q);point=rotate(point,q.shoulder,[-70,-405]);return rotate(point,q.lean,[0,bodyY]);
  };
  return <>
    <Body id={id} lean={p.lean} rigid={crowd}/>
    <g transform={`rotate(${p.lean} 0 ${bodyY})`}>
      <defs>
        <clipPath id={`${id}-eyes`}><ellipse cx="-3" cy="-485" rx="13" ry="15"/><ellipse cx="34" cy="-499" rx="13" ry="15"/></clipPath>
      </defs>
      <g transform={`rotate(${p.shoulder} -70 -405)`}>
        {crowd?arm:<Mesh id={`${id}-arm`} xs={MIRA_X} ys={MIRA_Y} deform={point=>miraArmPoint(point,p)}>{arm}</Mesh>}
      </g>
      <g transform={`rotate(${p.head} 0 -430)`}>
        <Part col={p.happy?1:2} row={0} x={-125.28} y={-655.96} scale={.58}/>
        {closed&&<g clipPath={`url(#${id}-eyes)`}><Part col={p.happy?1:2} row={0} x={-125.28} y={-655.96} scale={.58} closed/></g>}
      </g>
    </g>
    {!crowd&&Array.from({length:4},(_,i)=>{
      const age=(f+i*15)%60,birth=f-age,[x,y]=cupPoint(birth),life=age/60;
      return <path key={i} d={`M${x+Math.sin(age/16+i)*3} ${y-life*39}q-5-6 1-12`} fill="none" stroke="#FCE8DB" strokeWidth="1.4" strokeLinecap="round" opacity={Math.sin(Math.PI*life)*.35}/>;
    })}
  </>;
};

export const MotionSol:React.FC<{frame:number;id:string;crowd?:boolean}>=({frame:f,id,crowd=false})=>{
  const p=solPose(crowd?0:f),closed=blink(f,[notice+7,notice+84,resolve+37,577]);
  const arm=<Part col={3} row={1} x={-219} y={-508.5} scale={.5}/>;
  return <>
    <Body id={id} sol lean={p.lean} rigid={crowd}/>
    <g transform={`rotate(${p.lean} 0 -316)`}>
      <defs>
        <clipPath id={`${id}-eyes`}><ellipse cx="-53" cy="-518" rx="13" ry="12"/><ellipse cx="-20" cy="-510" rx="13" ry="12"/></clipPath>
      </defs>
      <g transform={`rotate(${p.shoulder} -70 -422)`}>
        {crowd?arm:<Mesh id={`${id}-arm`} xs={SOL_X} ys={SOL_Y} deform={point=>solArmPoint(point,p)}>{arm}</Mesh>}
      </g>
      <g transform={`rotate(${p.head} 0 -441)`}>
        <Part col={1} row={1} x={-119.78} y={-646.64} scale={.53}/>
        {closed&&<g clipPath={`url(#${id}-eyes)`}><Part col={2} row={1} x={-119.78} y={-646.64} scale={.53}/></g>}
      </g>
    </g>
  </>;
};

const Backdrop:React.FC<{name:'plaza'|'terrace'}>=({name})=><image href={staticFile(art+name+'.png')} x="-45" y="-26" width="2010" height="1132" preserveAspectRatio="xMidYMid slice"/>;

// The environment is deliberately held. Camera travel, passing foreground
// people and independent emitted steam provide depth without repainting the set.
const Terrace:React.FC=()=> <Backdrop name="terrace"/>;

export const MotionScene:React.FC<{frame:number}>=({frame:f})=>{
  if(f<notice){
    const push=at(f,18,notice)*.045;
    return <>
      <g transform={`translate(1170 600) scale(${1+push}) translate(-1170 -600)`}>
        <Backdrop name="plaza"/>
        <g filter="url(#motion-crowd-far)">
          <g transform="translate(285 905) scale(.71)"><MotionSol frame={f+14} id="far-a" crowd/></g>
          <g transform="translate(615 920) scale(.67)"><MotionMira frame={f+38} id="far-b" crowd/></g>
          <g transform="translate(1740 946) scale(-.77 .77)"><MotionSol frame={f+76} id="far-c" crowd/></g>
        </g>
        <ellipse cx="1260" cy="970" rx="136" ry="22" fill="#211343" opacity=".46"/>
        <g transform="translate(1260 963) scale(1.15)"><MotionMira frame={f} id="mira-street"/></g>
        <g filter="url(#motion-crowd-near)">
          <g transform={`translate(${450-f*5.8} ${1540+Math.cos(f/5)*2}) scale(-1.9 1.9)`}><MotionSol frame={f+40} id="near-a" crowd/></g>
          <g transform={`translate(${2350-f*3.5} ${1515+Math.cos(f/5+2)*2}) scale(1.9)`}><MotionMira frame={f+80} id="near-b" crowd/></g>
        </g>
      </g>
      <g opacity={1-at(f,80,102)}><IllustratedTitle centerX={512} centerY={340} strokeScale={.64} tilt={-3} lines={[{text:'Alone',size:132,baseline:300},{text:'in a crowd',size:106,baseline:427}]}/></g>
    </>;
  }
  if(f<close){
    const push=at(f,notice,close)*.025;
    return <g transform={`translate(1100 590) scale(${1+push}) translate(-1100 -590)`}>
      <Terrace/>
      <g transform="translate(780 1230) scale(1.62)"><MotionMira frame={f} id="mira-terrace"/></g>
      <g transform="translate(1400 1240) scale(1.75)"><MotionSol frame={f} id="sol-terrace"/></g>
    </g>;
  }
  const push=at(f,close,570)*.018;
  return <g transform={`translate(820 450) scale(${1+push}) translate(-820 -450)`}>
    <g transform="translate(-120 -40) scale(1.1)"><Terrace/></g>
    <g transform="translate(820 1490) scale(2.25)"><MotionMira frame={f} id="mira-reaction"/></g>
    <g transform="translate(2180 1700) scale(2.8)"><MotionSol frame={f} id="sol-reaction"/></g>
  </g>;
};

export const MotionCharactersTest:React.FC=()=>{
  const frame=useCurrentFrame(),time=frame/30;
  const [assets]=useState(()=>delayRender('Approved artwork, new acting pass'));
  useEffect(()=>{
    const images=['atlas.png','blinks.png','plaza.png','terrace.png'].map(file=>new Promise<void>((resolve,reject)=>{
      const im=new window.Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error(`Missing ${file}`));im.src=staticFile(art+file);
    }));
    const fonts=[new FontFace('Outfit',`url(${staticFile('assets/fonts/Outfit.ttf')})`,{weight:'100 900'}).load(),new FontFace('Nunito',`url(${staticFile('assets/fonts/Nunito.ttf')})`,{weight:'200 1000'}).load()].map(p=>p.then(font=>{document.fonts.add(font);}));
    Promise.all([...images,...fonts]).then(()=>continueRender(assets)).catch(cancelRender);
  },[assets]);
  if(narration.provider!=='elevenlabs'||narration.status!=='generated')throw new Error('Generate the ElevenLabs performance first.');
  const caption=narration.captions.find(c=>time>=c.start&&time<c.end);
  return <AbsoluteFill style={{background:'#271344',fontFamily:'Outfit, sans-serif'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"><defs>
      <filter id="motion-crowd-far" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .23 0 0 0 0 .13 0 0 0 0 .37 0 0 0 1 0"/></filter>
      <filter id="motion-crowd-near" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .10 0 0 0 0 .05 0 0 0 0 .23 0 0 0 1 0"/></filter>
    </defs><MotionScene frame={frame}/>
      {caption&&<text x="960" y="1027" textAnchor="middle" fontSize="39" fontWeight="500" fill="#FFFDF5" stroke="#211338" strokeWidth="3.4" paintOrder="stroke" strokeLinejoin="round">{caption.text}</text>}
    </svg>
    <Audio src={staticFile('assets/audio/crowd-motion/music.wav')}/><Audio src={staticFile('assets/audio/crowd-motion/sfx.wav')}/><Audio src={staticFile(narration.audioFile)}/>
  </AbsoluteFill>;
};
