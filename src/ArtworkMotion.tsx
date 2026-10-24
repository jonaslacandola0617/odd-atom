import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Audio,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame} from 'remotion';
import {TextureMesh,Point} from './art/TextureMesh';
import registration from './data/artwork-motion-registration.json';

const ROOT='assets/artwork/scene-motion/';
const W=1672,H=941;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const at=(f:number,a:number,b:number)=>smooth((f-a)/(b-a));
const keys=(f:number,list:readonly (readonly[number,number])[])=>{
  if(f<=list[0][0])return list[0][1];
  for(let i=1;i<list.length;i++)if(f<=list[i][0]){const [a,x]=list[i-1],[b,y]=list[i];return x+(y-x)*at(f,a,b);}
  return list[list.length-1][1];
};
const rot=(p:Point,a:number,c:Point):Point=>{const t=a*Math.PI/180,x=p[0]-c[0],y=p[1]-c[1];return[c[0]+Math.cos(t)*x-Math.sin(t)*y,c[1]+Math.sin(t)*x+Math.cos(t)*y];};
const mix=(a:Point,b:Point,t:number):Point=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const matrix=(m:number[][])=>`matrix(${m[0][0]} ${m[1][0]} ${m[0][1]} ${m[1][1]} ${m[0][2]} ${m[1][2]})`;
const Img:React.FC<{name:string}>=({name})=><image href={staticFile(ROOT+name+'.png')} width={W} height={H}/>;
const VesselPath='M72-20H758C824 48 856 146 852 243C845 410 739 554 579 600C409 651 226 605 110 490C36 416 6 310 19 193C24 107 44 40 72-20Z';
const range=(a:number,b:number,step:number)=>Array.from({length:Math.ceil((b-a)/step)+1},(_,i)=>Math.min(b,a+i*step));

/** All face, garment, hand and plant colors are sampled from the approved PNG.
 * Generated alpha is independently registered; new paint is used only behind
 * moving silhouettes and in the empty microscopy environment. */
const ClinicianTexture:React.FC<{frame:number}>=({frame:f})=>{
  const closed=[48,136,242,376,523].some(s=>f>=s&&f<s+5);
  return <g mask="url(#doctor-alpha)"><Img name="medicine-source"/>{closed&&<g clipPath="url(#doctor-eyes)"><Img name="medicine-blink"/></g>}</g>;
};
export function clinicianPoint(p:Point,f:number):Point{
  const lean=keys(f,[[0,0],[30,0],[50,-.7],[88,-.45],[155,-.45],[180,.45],[215,.15],[355,.15],[390,-.5],[425,-.25],[560,-.25],[599,0]]);
  const nod=keys(f,[[0,0],[24,0],[52,2.2],[75,1.2],[120,1.2],[150,-1.3],[180,-.6],[350,-.6],[380,1.8],[404,0],[560,0],[599,.2]]);
  const focus=keys(f,[[0,0],[32,0],[52,3.5],[68,1.2],[82,2.5],[96,1.4],[190,1.4],[215,0],[599,0]]);
  const slide=keys(f,[[0,0],[130,0],[148,-.12],[175,1],[190,.86],[265,.86],[288,0],[599,0]]);
  const bodyWeight=smooth((755-p[1])/80)*smooth((p[0]-1030)/150);
  let q=mix(p,rot(p,lean,[1290,760]),bodyWeight);
  const headWeight=smooth((470-p[1])/65);
  q=mix(q,rot(q,nod,[1205,420]),headWeight);
  const handWeight=smooth((p[1]-575)/32)*(1-smooth((p[1]-685)/30))*(1-smooth((p[0]-1140)/100));
  q=mix(q,rot(q,focus,[950,633]),handWeight);
  const slideWeight=smooth((p[1]-475)/35)*(1-smooth((p[1]-580)/35))*(1-smooth((p[0]-1140)/60));
  const moved:Point=[q[0]+slide*8*slideWeight,q[1]-slide*13*slideWeight];
  const contact=smooth((p[1]-560)/30)*(1-smooth((p[1]-727)/40))*(1-smooth((p[0]-1320)/70));
  return mix(moved,p,contact);
}
const AlignedMask:React.FC<{plant?:boolean}>=({plant=false})=>plant?<path d={registration.plant.outline} fill="white" fillRule="evenodd"/>:<g clipPath="url(#doctor-upper)"><path d={registration.clinician.outline} fill="white" fillRule="evenodd"/></g>;
const NativeSprite:React.FC<{rect:[number,number,number,number];cx:number;cy:number;scale:number}>=({rect:[x,y,w,h],cx,cy,scale})=><svg x={cx-w*scale/2} y={cy-h*scale/2} width={w*scale} height={h*scale} viewBox={`${x} ${y} ${w} ${h}`} overflow="hidden"><image href={staticFile(ROOT+'medicine-cell-atlas.png')} width="1536" height="1024"/></svg>;
const RBC_A:[number,number,number,number]=[580,90,470,390],RBC_B:[number,number,number,number]=[1100,170,430,300],RBC_C:[number,number,number,number]=[1070,580,440,420];
const cubic=(t:number,a:Point,b:Point,c:Point,d:Point):Point=>{const s=1-t;return[s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]];};
export function immunePoint(p:Point,f:number):Point{
  const close=keys(f,[[0,0],[96,0],[126,-.12],[193,.75],[247,.94],[280,.76],[320,.76],[363,.67],[425,1],[465,.87],[599,.87]]);
  const upper=Math.exp(-((p[0]-138)**2/15000+(p[1]+78)**2/7000));
  const lower=Math.exp(-((p[0]-145)**2/15000+(p[1]-150)**2/7000));
  return[p[0]+close*(upper+lower)*7,p[1]+close*(upper*37-lower*48)];
}
const MicroWorld:React.FC<{frame:number}>=({frame:f})=>{
  const x=435+keys(f,[[0,0],[100,0],[210,11],[285,5],[340,5],[430,13],[480,8],[599,8]]);
  return <g clipPath="url(#vessel)">
    <Img name="medicine-clean"/>
    {[0,1].map(lane=>Array.from({length:6},(_,i)=>{
      const t=((f/510+i/6+lane*.13)%1),p=lane?cubic(t,[980,350],[820,660],[470,750],[-190,450]):cubic(t,[980,100],[550,-130],[100,-100],[-180,470]);
      const size=(lane?.49:.34)*(1+.16*Math.sin(i*2));
      return <g key={`${lane}-${i}`} transform={`rotate(${(i%3-1)*23+Math.sin(f/160+i)*8} ${p[0]} ${p[1]})`} opacity={lane?1:.88}><NativeSprite rect={[RBC_A,RBC_B,RBC_C][i%3]} cx={p[0]} cy={p[1]} scale={size}/></g>;
    }))}
    <g transform={`translate(${x} 282) scale(.9)`}>
      <TextureMesh id="immune-back" xs={range(-300,310,55)} ys={range(-300,300,55)} deform={p=>immunePoint(p,f)}><NativeSprite rect={[0,0,585,570]} cx={0} cy={0} scale={1}/></TextureMesh>
      {[0,1].map(i=>{
        const capture=at(f,i?302:110,i?432:246),start:Point=i?[185,110]:[114,3];
        const pos=mix(start,i?[18,52]:[28,26],capture),s=(i?.34:.32)*(1-capture*.22);
        return <g key={i} opacity={1-at(f,i?418:232,i?450:260)} transform={`rotate(${Math.sin(f/48+i)*5} ${pos[0]} ${pos[1]})`}><NativeSprite rect={i?[600,600,420,385]:[70,620,410,360]} cx={pos[0]+Math.sin(f/35+i)*3*(1-capture)} cy={pos[1]+Math.cos(f/42+i)*3} scale={s}/></g>;
      })}
      <defs><filter id="membrane-color" x="-320" y="-320" width="640" height="640" filterUnits="userSpaceOnUse"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  8 0 -2.8 0 -4"/></filter><mask id="membrane-alpha" maskUnits="userSpaceOnUse" x="-320" y="-320" width="640" height="640" style={{maskType:'alpha'}}><g filter="url(#membrane-color)"><NativeSprite rect={[0,0,585,570]} cx={0} cy={0} scale={1}/></g></mask></defs>
      <TextureMesh id="immune-front" xs={range(-300,310,55)} ys={range(-300,300,55)} deform={p=>immunePoint(p,f)}><g mask="url(#membrane-alpha)"><NativeSprite rect={[0,0,585,570]} cx={0} cy={0} scale={1}/></g></TextureMesh>
    </g>
    {Array.from({length:10},(_,i)=>{const x=(i*173+f*.26)%920-20,y=(i*103+f*.11)%680-40;return <circle key={i} cx={x} cy={y} r={2+i%3} fill="#FF8297" opacity=".18"/>;})}
  </g>;
};
const Medicine:React.FC<{frame:number}>=({frame:f})=>{
  const sway=Math.sin(f/82)*.8+Math.sin(f/37)*.22;
  const cam=keys(f,[[0,1],[200,1.028],[410,1.04],[599,1.012]]);
  return <g transform={`translate(750 450) scale(${cam}) translate(-750 -450)`}>
    <defs>
      <clipPath id="vessel"><path d={VesselPath}/></clipPath>
      <clipPath id="doctor-upper"><rect x="930" y="0" width="700" height="790"/></clipPath>
      <clipPath id="doctor-clean-upper"><rect x="930" y="0" width="700" height="780"/></clipPath>
      <filter id="soft-contact" x="900" y="550" width="470" height="220" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="7"/></filter>
      <mask id="contact-restore" maskUnits="userSpaceOnUse" x="900" y="550" width="470" height="220" style={{maskType:'alpha'}}><rect x="940" y="590" width="380" height="137" fill="white" filter="url(#soft-contact)"/></mask>
      <clipPath id="focus-knob"><ellipse cx="945" cy="633" rx="23" ry="24"/></clipPath>
      <clipPath id="doctor-region"><rect x="950" y="105" width="660" height="836"/></clipPath>
      <clipPath id="plant-region"><rect x="0" y="360" width="310" height="375"/></clipPath>
      <clipPath id="doctor-eyes"><ellipse cx="1132" cy="319" rx="14" ry="15"/><ellipse cx="1181" cy="332" rx="15" ry="16"/></clipPath>
      <filter id="dilate-alpha" x="0" y="0" width={W} height={H} filterUnits="userSpaceOnUse"><feColorMatrix type="luminanceToAlpha"/><feMorphology operator="dilate" radius="3"/><feFlood floodColor="white"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <mask id="doctor-alpha" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><AlignedMask/></mask>
      <mask id="plant-alpha" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><AlignedMask plant/></mask>
      <mask id="moving-clean" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><g fill="white" stroke="white" strokeWidth="7" strokeLinejoin="round"><g clipPath="url(#doctor-clean-upper)"><path d={registration.clinician.outline} fillRule="evenodd"/></g><path d={registration.plant.outline} fillRule="evenodd"/></g></mask>
    </defs>
    <Img name="medicine-source"/>
    <g mask="url(#moving-clean)"><Img name="medicine-clean"/></g>
    <MicroWorld frame={f}/>
    <g clipPath="url(#focus-knob)"><g transform={`rotate(${keys(f,[[0,0],[30,0],[53,22],[68,8],[83,16],[100,11],[599,11]])} 945 633)`}><Img name="medicine-source"/></g></g>
    <TextureMesh id="clinician" xs={range(945,1565,40)} ys={[115,155,195,235,275,315,355,395,425,455,485,510,535,560,585,610,635,660,685,715,755,815,880,941]} deform={p=>clinicianPoint(p,f)}><ClinicianTexture frame={f}/></TextureMesh>
    <g mask="url(#contact-restore)"><Img name="medicine-source"/></g>
    <g transform={`rotate(${sway} 100 650)`} mask="url(#plant-alpha)"><Img name="medicine-source"/></g>
  </g>;
};

const PacketDefinitions:React.FC=()=> <defs>
  {[
    {id:'mint',path:'M35 495L101 474 126 483 125 527 62 546 35 535Z'},
    {id:'cream',path:'M285 432L345 414 363 424 362 460 303 478 285 467Z'},
    {id:'blue',path:'M236 495L281 481 304 489 304 513 257 529 236 518Z'},
  ].map(p=><g key={p.id}><clipPath id={`sprite-${p.id}`}><path d={p.path}/></clipPath><g id={`packet-${p.id}`} clipPath={`url(#sprite-${p.id})`}><Img name="cyber-source"/></g></g>)}
  {registration.shards.map((s,i)=><g key={i}><clipPath id={`shard-${i}-clip`}><polygon points={s.points.map(p=>p.join(',')).join(' ')}/></clipPath><g id={`shard-${i}`} clipPath={`url(#shard-${i}-clip)`}><Img name="cyber-source"/></g></g>)}
</defs>;
const Packet:React.FC<{x:number;y:number;scale:number;kind:number}>=({x,y,scale,kind})=>{
  const names=['mint','cream','blue'],centers=[[80,510],[324,447],[270,505]],n=kind%3,[cx,cy]=centers[n];
  return <g transform={`translate(${x} ${y}) scale(${scale}) translate(${-cx} ${-cy})`}><use href={`#packet-${names[n]}`}/></g>;
};
const Shard:React.FC<{x:number;y:number;size:number;angle:number;kind:number}>=({x,y,size,angle,kind})=>{
  const i=kind%registration.shards.length,[cx,cy]=registration.shards[i].center;
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size}) translate(${-cx} ${-cy})`}><use href={`#shard-${i}`}/></g>;
};
const Fan:React.FC<{x:number;y:number;rx:number;ry:number;frame:number;id:string}>=({x,y,rx,ry,frame:f,id})=> <>
  <clipPath id={id}><ellipse cx={x} cy={y} rx={rx} ry={ry}/></clipPath>
  <g clipPath={`url(#${id})`}><g transform={`translate(${x} ${y}) scale(1 ${ry/rx}) rotate(${f*3.4}) scale(1 ${rx/ry}) translate(${-x} ${-y})`}><Img name="cyber-source"/></g></g>
</>;
export function networkPoint(t:number):Point{return cubic(t,[-110,563],[230,460],[790,350],[1190,267]);}
export function threatPoint(age:number,i:number):{p:Point;angle:number;landed:boolean}{
  const floor:Point=[1195+(i*53)%360,760-(i%4)*11];
  if(age<85)return{p:cubic(clamp(age/85),[873,432],[1020,464],[1095,520],[1160,680]),angle:age*.7+i*29,landed:false};
  if(age<115){const t=(age-85)/30,p=mix([1160,680],floor,t);return{p:[p[0],p[1]-Math.sin(Math.PI*t)*23],angle:age*.7+i*29,landed:false};}
  const settle=age-115;return{p:[floor[0],floor[1]-Math.abs(Math.sin(settle/5))*Math.exp(-settle/15)*17],angle:115*.7+i*29,landed:true};
}
const Cyber:React.FC<{frame:number}>=({frame:f})=>{
  const cam=keys(f,[[0,1],[220,1.03],[440,1.035],[599,1.012]]),arrival=(f%38)/38;
  return <g transform={`translate(870 455) scale(${cam}) translate(-870 -455)`}>
    <PacketDefinitions/>
    <defs>
      <clipPath id="cyber-moving"><path d="M-30 425L1180 224 1210 248 1190 305 330 570-30 615Z"/><path d="M960 150H1672V290H960Z"/><path d="M855 412C1030 398 1150 511 1250 660L1240 728H1030L1035 575 960 495 855 455Z"/><ellipse cx="1332" cy="704" rx="302" ry="100"/><ellipse cx="268" cy="79" rx="70" ry="24"/><ellipse cx="300" cy="255" rx="70" ry="24"/><ellipse cx="1610" cy="420" rx="106" ry="33"/></clipPath>
      <clipPath id="city-front"><path d="M1212 213L1263 195 1327 214 1336 347 1306 375 1210 359Z"/><path d="M1293 88C1290 42 1500 45 1508 87V197C1470 218 1350 225 1293 188Z"/></clipPath>
      <clipPath id="front-pylon"><path d="M769 239L839 226Q892 227 904 260L908 462Q903 485 864 495L801 504 751 482V274Q749 249 769 239Z"/></clipPath>
      <clipPath id="basin"><ellipse cx="1333" cy="704" rx="291" ry="94"/></clipPath>
      <clipPath id="gate-field"><path d="M554 218Q650 218 759 268L758 433Q670 397 553 369Z"/></clipPath>
      <linearGradient id="gate-glint"><stop stopColor="#FFF4A7" stopOpacity="0"/><stop offset=".5" stopColor="#FFF4A7" stopOpacity=".5"/><stop offset="1" stopColor="#FFF4A7" stopOpacity="0"/></linearGradient>
    </defs>
    <Img name="cyber-source"/>
    <g clipPath="url(#cyber-moving)"><Img name="cyber-clean"/></g>
    <Fan x={268} y={79} rx={68} ry={22} frame={f} id="fan-a"/>
    <Fan x={300} y={255} rx={68} ry={22} frame={f+9} id="fan-b"/>
    <Fan x={1610} y={420} rx={101} ry={30} frame={f+18} id="fan-c"/>
    {/* Background ring traffic goes behind the foreground buildings. */}
    {Array.from({length:12},(_,i)=>{const t=(f/410+i/12)%1,[x,y]=cubic(t,[1280,238],[1400,275],[1570,270],[1685,220]);return <Packet key={i} x={x} y={y} scale={.36} kind={i}/>;})}
    <g clipPath="url(#city-front)"><Img name="cyber-clean"/></g>
    {[0,1].map(lane=>Array.from({length:9},(_,i)=>{const t=(f/345+i/9+lane*.036)%1,[x,y]=networkPoint(t);return <Packet key={`${lane}-${i}`} x={x} y={y-lane*39} scale={1.15-t*.65} kind={i+lane}/>;}))}
    <g clipPath="url(#gate-field)"><rect x={505+arrival*290} y="205" width="65" height="245" fill="url(#gate-glint)" opacity={.22+Math.sin(arrival*Math.PI)*.2}/></g>
    <g clipPath="url(#front-pylon)"><Img name="cyber-clean"/></g>
    <g clipPath="url(#basin)">{Array.from({length:17},(_,i)=><Shard key={i} x={1155+i%7*59} y={764-Math.floor(i/7)*18} size={.65+(i%4)*.2} angle={i*37} kind={i}/>)}</g>
    {Array.from({length:24},(_,i)=>{const start=i*23-100,age=f-start;if(age<0)return null;const {p,angle,landed}=threatPoint(age,i);const shard=<Shard x={p[0]} y={p[1]} size={.33+(i%4)*.15} angle={angle} kind={i}/>;return <g key={i} clipPath={landed?'url(#basin)':undefined}>{shard}</g>;})}
    {[0,1,2].map(i=><rect key={i} x={1081+i*17} y={96+i%2*26} width="7" height="3" rx="1" fill="#FFED9B" opacity={.25+.55*smooth(Math.sin(f/17+i*4))}/>)}
  </g>;
};

export const ArtworkMotion:React.FC<{topic:'medicine'|'cyber'}>=({topic})=>{
  const f=useCurrentFrame();const [handle]=useState(()=>delayRender('Load approved scene layers'));
  useEffect(()=>{
    const files=topic==='medicine'?['medicine-source','medicine-clean','medicine-cutouts','medicine-blink','medicine-cell-atlas']:['cyber-source','cyber-clean'];
    Promise.all(files.map(name=>new Promise<void>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error(`Missing ${name}`));im.src=staticFile(ROOT+name+'.png');}))).then(()=>continueRender(handle)).catch(cancelRender);
  },[handle,topic]);
  return <AbsoluteFill style={{background:'#211331'}}><svg width="1920" height="1080" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">{topic==='medicine'?<Medicine frame={f}/>:<Cyber frame={f}/>}</svg><Audio src={staticFile(`assets/audio/artwork-motion/${topic}.wav`)}/></AbsoluteFill>;
};
