import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';

// A graphic fable built on the approved six-scene drawings and handoffs.
// The gold carrier connects contact, growth, a wind obstacle, and a night payoff.
// The approved TransitionLab and its rendered movie are intentionally intact.
const C={ink:'#173D55',navy:'#162B50',water:'#137D98',aqua:'#65DACE',mint:'#68D1AE',leaf:'#39A88D',cream:'#FFF2CC',gold:'#FFCC68',coral:'#FA8C80',pink:'#ED86A9',purple:'#8665BC'};
type Point=[number,number];
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const phase=(f:number,a:number,b:number)=>smooth((f-a)/(b-a));
const rad=(d:number)=>d*Math.PI/180;
const color=(a:string,b:string,t:number)=>'#'+[1,3,5].map(i=>Math.round(mix(parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),t)).toString(16).padStart(2,'0')).join('');
const blendPoint=(a:Point,b:Point,t:number):Point=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const rotate=(p:Point,a:number):Point=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
const hash=(v:number)=>{const n=Math.sin(v*127.1+45.3)*43758.5453;return n-Math.floor(n);};

// A closed, shape-interpolatable cubic outline; tension zero gives straight
// paper edges, while the same control topology gives rounded petals/wings.
const outline=(points:Point[],tension=.8)=>{
 let d=`M${points[0].join(' ')}`;
 for(let i=0;i<points.length;i++){
  const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length],e=points[(i+2)%points.length];
  d+=`C${b[0]+(c[0]-a[0])*tension/6} ${b[1]+(c[1]-a[1])*tension/6} ${c[0]-(e[0]-b[0])*tension/6} ${c[1]-(e[1]-b[1])*tension/6} ${c.join(' ')}`;
 }
 return d+'Z';
};
const line=(points:Point[])=>'M'+points.map(p=>p.join(' ')).join('L');
const pulse=(f:number,start:number,length:number)=>{
 const t=(f-start)/length;return t<0||t>1?0:Math.sin(t*Math.PI)*Math.exp(-t*1.5);
};
const gust=(f:number)=>phase(f,332,350)*(1-phase(f,372,412));
const delayedWave=(f:number,start:number)=>{
 const age=(f-start)/30;return age<0?0:Math.sin(age*7)*Math.exp(-age*2.5);
};

const KEYS:[number,number,number][]=[
 [275,1100,320],[300,1120,310],[325,1200,270],[350,980,170],
 [375,820,290],[400,1120,340],[430,1460,300],[460,1280,480],
 [490,940,470],[520,1080,340],[550,1330,240],[600,1450,350],
];
const flight=(f:number):Point=>{
 const index=Math.max(0,KEYS.findIndex((k,i)=>i<KEYS.length-1&&f>=k[0]&&f<=KEYS[i+1][0]));
 const a=KEYS[Math.max(0,index-1)],b=KEYS[index],c=KEYS[index+1],d=KEYS[Math.min(KEYS.length-1,index+2)];
 const u=clamp((f-b[0])/(c[0]-b[0]));
 return [1,2].map(axis=>{
  const v0=(c[axis]-a[axis])/(c[0]-a[0])*(c[0]-b[0]),v1=(d[axis]-b[axis])/(d[0]-b[0])*(c[0]-b[0]);
  return (2*u**3-3*u*u+1)*b[axis]+(u**3-2*u*u+u)*v0+(-2*u**3+3*u*u)*c[axis]+(u**3-u*u)*v1;
 }) as Point;
};
const orbitAngle=(f:number)=>mix(2.6,7.9,phase(f,505,599));
const orbitPoint=(angle:number):Point=>[1320+345*Math.cos(angle),430+185*Math.sin(angle)];
const carrier=(f:number):Point=>blendPoint(flight(f),orbitPoint(orbitAngle(f)),phase(f,505,570));
const rawFlightHeading=(f:number)=>{
 const p=flight(f-.3),q=flight(f+.3);
 return Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI+90;
};
const FLIGHT_ANGLES:number[]=[];
for(let f=0;f<=600;f++){
 const previous=FLIGHT_ANGLES[f-1]??rawFlightHeading(f);
 let angle=rawFlightHeading(f);
 while(angle-previous>180)angle-=360;
 while(angle-previous< -180)angle+=360;
 FLIGHT_ANGLES.push(angle);
}
const flightHeading=(f:number)=>FLIGHT_ANGLES[Math.max(0,Math.min(599,Math.round(f)))];
const flyerPose=(f:number)=>{
 const detach=phase(f,287,318),fold=phase(f,376,414),spark=phase(f,490,532);
 const center=blendPoint([1100,320],carrier(f),detach);
 const base=mix(-4,flightHeading(f),detach)+gust(f)*11*(1-fold);
 return {center,fold,spark,detach,angle:mix(base,Math.round(base/360)*360,spark)};
};
const cubic=(a:Point,b:Point,c:Point,d:Point,t:number):Point=>[
 (1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*d[0],
 (1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*d[1],
];
const leafAnchor=(f:number,t:number):Point=>{
 const p=fishPose(f),point=rotate([mix(-166,194,t),0],rad(p.angle));
 return [p.x+point[0],p.y+point[1]];
};

// The bubble contacts the fish at frame 145: nose x=1151, bubble left x=1151.
const bubblePose=(f:number):Point=>{
 if(f<89)return blendPoint([960,731],[974,788],phase(f,83,89));
 if(f<=110)return cubic([974,788],[1000,650],[1040,575],[1105,550],phase(f,89,110));
 if(f<=145)return blendPoint([1105,550],[1182,510],phase(f,110,138));
 if(f<=165)return blendPoint([1182,510],[1342,450],phase(f,145,165));
 return cubic([1342,450],[1360,360],[1310,450],leafAnchor(198,1),phase(f,165,198));
};
const sparkPose=(f:number):Point=>{
 if(f<198)return bubblePose(f);
 if(f<213)return leafAnchor(f,1-phase(f,198,213));
 if(f<228)return cubic(leafAnchor(f,0),[990,750],[925,870],[970,1000],phase(f,213,228));
 if(f<261)return cubic([970,1000],[1000,785],[1110,580],[1100,320],phase(f,228,261));
 const p=flyerPose(f),offset=rotate([0,-132*p.fold*(1-p.spark)],rad(p.angle));
 return [p.center[0]+offset[0],p.center[1]+offset[1]];
};

const LivingWater:React.FC<{f:number}>=({f})=><>
 {/* A reaction, not a clock loop: these waves start only at the impact. */}
 {f>=83&&f<119&&[0,1,2].map(i=>{
  const age=(f-83-i*4)/30;if(age<0)return null;
  const surface=mix(800,-190,phase(f,83,115));
  return <ellipse key={i} cx="960" cy={surface+25+i*8} rx={35+age*410} ry={8+age*19} fill="none" stroke="#B4EFDA" strokeWidth={Math.max(0,5-age*4)}/>;
 })}
 {f>100&&f<211&&[104,113,124,136,145,151].map((born,i)=>{
  const age=(f-born)/30;if(age<0||age>1.7)return null;
  const p=fishPose(born),x=p.x-170-age*65,y=p.y+24-age*90-age*age*18;
  return <circle key={i} cx={x} cy={y} r={(5+i%3*3)*Math.sin(Math.PI*age/1.7)} fill="none" stroke="#A4DED2" strokeWidth="2.5"/>;
 })}
</>;

const GoldenCarrier:React.FC<{f:number}>=({f})=>{
 if(f<84)return null;
 const p=sparkPose(f),contact=pulse(f,145,16),bubble=1-phase(f,184,200);
 const radius=f<198?mix(31,18,phase(f,84,111)):f<261?15:13+phase(f,490,532)*5;
 return <g transform={`translate(${p[0]} ${p[1]})`}>
  {f>=90&&f<201&&<ellipse rx={(radius+13)*bubble*(1+contact*.45)} ry={(radius+13)*bubble*(1-contact*.3)} fill="none" stroke="#DAF4CD" strokeWidth="4"/>}
  <circle r={radius*2.7} fill={C.gold} fillOpacity=".10"/>
  <circle r={radius*1.8} fill={C.gold} fillOpacity=".16"/>
  <circle r={radius} fill={C.gold}/><circle cx={-radius*.24} cy={-radius*.24} r={radius*.35} fill={C.cream}/>
 </g>;
};

const Drop:React.FC<{x:number;y:number;size:number;stretch?:number;fill?:string}>=({x,y,size,stretch=1,fill=C.gold})=><g transform={`translate(${x} ${y}) scale(${size/80} ${size/80*stretch})`}>
 <path d="M0-60C-10-39-42-12-42 13C-42 63 42 63 42 13C42-12 10-39 0-60Z" fill={fill}/>
 <path d="M-22 5Q-27 24-12 32" stroke={C.cream} strokeWidth="8" strokeLinecap="round" fill="none"/>
</g>;

const Cloud:React.FC<{x:number;y:number;size?:number;fill?:string}>=({x,y,size=1,fill=C.cream})=><g transform={`translate(${x} ${y}) scale(${size})`}>
 <path d="M-150 47C-214 47-214-35-157-35C-163-106-59-139-18-80C13-151 133-122 136-40C208-51 233 47 160 47Z" fill={fill}/>
 <path d="M-150 47H160Q199 42 193 10C137 27-88 22-178 11Q-187 40-150 47Z" fill={C.aqua} fillOpacity=".32"/>
</g>;

const waterline=(f:number)=>{
 const impact=phase(f,83,115),y=mix(800,-190,impact),height=110*Math.sin(Math.PI*impact);
 return `M-80 ${y+12}Q300 ${y-45-height*.2} 660 ${y+10}Q840 ${y+75-height} 960 ${y-height*2}Q1090 ${y+60-height} 1290 ${y-4}Q1640 ${y-55} 2000 ${y+12}V1200H-80Z`;
};

const WaterAndSky:React.FC<{f:number}>=({f})=>{
 const plant=phase(f,180,226),night=phase(f,477,544),lift=phase(f,369,455);
 const top=color(color('#75C8D6','#B4E4D1',plant),C.navy,night);
 const bottom=color(color('#235B7E','#FFE3A1',plant),'#4D4779',night);
 return <>
  <defs>
   <linearGradient id="tl-air" x2="0" y2="1"><stop stopColor="#A0DCE2"/><stop offset="1" stopColor="#E5EBD0"/></linearGradient>
   <linearGradient id="tl-world" x2="0" y2="1"><stop stopColor={top}/><stop offset="1" stopColor={bottom}/></linearGradient>
   <linearGradient id="tl-water" x2="0" y2="1"><stop stopColor="#217C9A"/><stop offset="1" stopColor="#16425F"/></linearGradient>
   <clipPath id="tl-below"><path d={waterline(f)}/></clipPath>
  </defs>
  <rect width="1920" height="1080" fill="url(#tl-air)"/>
  <g transform={`translate(960 205) scale(${1+pulse(f,18,30)*.08-pulse(f,31,18)*.04} ${1-pulse(f,18,30)*.10+pulse(f,31,18)*.05}) translate(-960 -205)`}>
   <Cloud x={960+Math.sin(f/42)*7} y={205+Math.sin(f/28)*3} size={1.4}/>
  </g>
  <Cloud x={260-f*.15} y={245} size={.55} fill="#C4E6D8"/>
  <Cloud x={1690+f*.13} y={180} size={.6} fill="#C4E6D8"/>
  {f<120&&Array.from({length:11},(_,i)=>{
   const age=(f*6+i*81)%680;return <Drop key={i} x={530+i*86} y={290+age} size={11+i%3*3} stretch={1.6} fill="#6CB8BD"/>;
  })}
  <g clipPath="url(#tl-below)">
   <rect width="1920" height="1080" fill="url(#tl-world)"/>
   <path d="M0 0H1920V1080H0Z" fill="url(#tl-water)" opacity={1-plant}/>
   {/* Bubbles broaden into cloudlets while their upward travel continues. */}
   {Array.from({length:11},(_,i)=>{
    const exit=phase(f,418,507)*(i%2?1:-1)*2100;
    const x=110+i*173+Math.sin(f/35+i)*19+lift*(i%2?1:-1)*430+exit-170*phase(f,332,373);
    const y=1100-((f*2.5+i*93)%1300)-lift*220;
    const rx=12+i%4*5+plant*38,ry=(12+i%4*5)*(1-plant*.2);
    return <g key={i}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={plant>.5?'#FFEFCC':'none'} stroke={color('#75CFCB','#FFEFCC',plant)} strokeWidth={3+plant*4}/>{plant>.5&&<><ellipse cx={x-rx*.24} cy={y-plant*14} rx={rx*.37*plant} ry={ry*plant} fill="#FFEFCC"/><ellipse cx={x+rx*.18} cy={y-plant*11} rx={rx*.3*plant} ry={ry*.9*plant} fill="#FFEFCC"/></>}{plant<.8&&<path d={`M${x-rx*.45} ${y}Q${x-rx*.5} ${y-ry*.5} ${x} ${y-ry*.6}`} fill="none" stroke="#8EE7D5" strokeWidth="3"/>}</g>;
   })}
   <g transform={`translate(0 ${lift*540})`}>
    <path d={`M-80 ${mix(1130,740,plant)}Q400 ${mix(1200,580,plant)} 950 ${mix(1180,770,plant)}T2000 ${mix(1100,690,plant)}V1400H-80Z`} fill="#A3CE9D"/>
    <path d={`M-80 ${mix(1200,880,plant)}Q580 ${mix(1200,680,plant)} 1120 ${mix(1200,850,plant)}T2000 ${mix(1200,780,plant)}V1400H-80Z`} fill="#65B69C"/>
   </g>
   {f>505&&Array.from({length:28},(_,i)=>{
    const x=80+hash(i+71)*1760,y=50+hash(i+301)*840;
    const distance=Math.hypot(x-1320,y-430),arrival=544+distance/35;
    const s=phase(f,arrival,arrival+14);
    return <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill={i%3?C.cream:C.aqua}><path d="M0-5L1.5-1.5L5 0L1.5 1.5L0 5L-1.5 1.5L-5 0L-1.5-1.5Z"/></g>;
   })}
  </g>
  {f<116&&<>
   <path d={waterline(f)} fill="none" stroke="#84E1D1" strokeWidth="14"/>
   <path d={`M0 855Q400 820 700 855T1400 855T2000 855`} fill="none" stroke="#53BBAE" strokeWidth="6"/>
  </>}
 </>;
};

const KelpAndGround:React.FC<{f:number}>=({f})=>{
 const plant=phase(f,180,225),ascent=phase(f,354,446);
 return <g transform={`translate(0 ${ascent*580})`}>
  {[130,340,1550,1770,1850].map((x,i)=>{
   const wave=delayedWave(f,83+Math.abs(x-960)/55)*50*(1-plant);
   const wake=delayedWave(f,139+Math.abs(x-1150)/55)*34*(1-plant);
   const bend=Math.sin(f/24+i)*mix(20,5,plant)+wave+wake-gust(f)*45*plant,height=mix(210+i%3*80,130+i%2*50,plant),y=mix(1110,1000,plant);
   const spine=(t:number):Point=>[x+2*(1-t)*t*bend+t*t*bend*.4,y-2*(1-t)*t*height*.55-t*t*height];
   return <g key={i}>
    <path d={`M${x} ${y}Q${x+bend} ${y-height*.55} ${x+bend*.4} ${y-height}`} fill="none" stroke={i%2?'#4DA99E':'#78C7AF'} strokeWidth={mix(22,13,plant)} strokeLinecap="round"/>
    {[.3,.55,.78].map((p,j)=>{const a=spine(p);return <g key={j} transform={`translate(${a[0]} ${a[1]}) rotate(${bend*.2})`}><path d={`M0 0q${(j%2?1:-1)*75} -75 ${(j%2?1:-1)*90} -20q${(j%2?-1:1)*45} 50 ${(j%2?-1:1)*90} 20`} fill={i%2?'#47A894':'#6BC4AC'}/></g>;})}
   </g>;
  })}
  <path d={`M-40 ${mix(1130,1005,plant)}Q550 ${mix(1110,935,plant)} 1040 ${mix(1140,1000,plant)}T1960 ${mix(1130,1015,plant)}V1400H-40Z`} fill="#E4B47E"/>
  <path d={`M-40 ${mix(1160,1040,plant)}Q600 ${mix(1160,995,plant)} 1100 ${mix(1190,1040,plant)}T1960 ${mix(1160,1050,plant)}V1400H-40Z`} fill="#C58D68"/>
  {Array.from({length:20},(_,i)=><ellipse key={i} cx={i*106+21} cy={1040+hash(i)*90} rx={7+hash(i+4)*8} ry="4" fill="#A36F60"/>)}
 </g>;
};

const fishPose=(f:number)=>{
 const turn=phase(f,170,211),p=phase(f,95,145),push=phase(f,145,160);
 return {x:mix(460+p*520+push*110,1050,turn),y:mix(585-p*75,565,turn),angle:mix(-Math.sin(p*Math.PI)*6,12-44*phase(f,201,229),turn),turn};
};
const FishLeaf:React.FC<{f:number}>=({f})=>{
 const {x,y,angle,turn}=fishPose(f),ascent=phase(f,354,446),stem=phase(f,190,222),leaf=phase(f,202,228);
 const root=rotate([-166,0],rad(angle));
 const recoil=pulse(f,145,19),unfurl=1-turn*.65*(1-phase(f,198,223));
 const tailBeat=Math.sin(f*.38)*(1-turn)*phase(f,91,112);
 const target=bubblePose(f),lookX=clamp((target[0]-x)/600)*4,lookY=Math.max(-4,Math.min(4,(target[1]-y)/25));
 const release=delayedWave(f,297)*19,stemBend=release-gust(f)*35;
 const body=`M${mix(-150,-166,turn)} 0C${mix(-120,-85,turn)} ${mix(-102,-135,turn)} ${mix(80,115,turn)} ${mix(-125,-108,turn)} ${mix(171,194,turn)} 0C${mix(85,64,turn)} ${mix(110,120,turn)} ${mix(-110,-85,turn)} ${mix(105,98,turn)} ${mix(-150,-166,turn)} 0Z`;
 return <g transform={`translate(0 ${ascent*920})`}>
  <path d={`M${x+root[0]} ${y+root[1]}C990 750 925 870 970 1000`} pathLength="1" stroke={C.leaf} strokeWidth="22" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-stem}/>
  <path d={`M973 866Q1010 714 1100 560Q${1100+stemBend} 410 ${1100+stemBend} 320`} pathLength="1" stroke={C.leaf} strokeWidth="17" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-phase(f,229,261)}/>
  {f>220&&[0,1].map((i)=>{const s=phase(f,220+i*13,244+i*13);return <g key={i} transform={`translate(${945+i*48} ${825-i*75}) rotate(${i?-145:-30}) scale(${s*.65})`}><path d="M0 0Q-130-130-220-48Q-150 65 0 0Z" fill={i?C.mint:C.leaf}/><path d="M0 0L-172-40" stroke="#C3E6B4" strokeWidth="5"/></g>;})}
  <g transform={`translate(${x-recoil*6} ${y}) rotate(${angle}) scale(${1-recoil*.035} ${unfurl})`}>
   <g transform={`translate(-135 0) rotate(${tailBeat*16}) translate(135 0)`}><path d={`M-135 0L${mix(-230,-202,turn)} ${mix(-86,-9,turn)}Q${mix(-191,-212,turn)} 0 ${mix(-230,-202,turn)} ${mix(86,9,turn)}Z`} fill={color('#E37284','#29957F',turn)}/></g>
   <g transform={`scale(1 ${1-turn})`}><path d="M-42-68Q-34-158 35-90L63-70Z" fill="#FFCB78"/><path d="M-6 69Q-42 143-93 74Z" fill="#E37284"/></g>
   <path d={body} fill={color('#FFB978',C.leaf,turn)}/>
   <path d={`M-144 0Q20 ${mix(14,0,turn)} 168 0`} stroke={color('#EF8F75','#B7E4B0',turn)} strokeWidth="6" fill="none" strokeLinecap="round"/>
   {[-1,1].map(side=>[0,1,2,3].map(i=><path key={side+'-'+i} d={`M${-100+i*56} 0Q${-70+i*56} ${side*25} ${-70+i*56} ${side*(70-i*6)}`} pathLength="1" stroke="#B7E4B0" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray="1" strokeDashoffset={1-leaf}/>))}
   <ellipse cx={103+lookX} cy={-18+lookY} rx={13*(1-phase(f,181,201))} ry={13*(1-phase(f,181,201))*(1-recoil*.55)} fill={C.ink}/>
   <path d={`M145 22Q157 31 162 18`} stroke={C.ink} strokeWidth={5*(1-phase(f,181,201))} fill="none" strokeLinecap="round"/>
  </g>
 </g>;
};

const PETAL:Point[]=[[0,0],[-36,-24],[-62,-70],[-56,-115],[0,-146],[56,-115],[62,-70],[36,-24]];
const PLANE:Point[][]=[
 [[0,65],[-35,75],[-105,98],[-164,118],[0,-155],[0,-70],[0,0],[0,45]],
 [[0,65],[35,75],[105,98],[164,118],[0,-155],[0,-70],[0,0],[0,45]],
 [[0,75],[-11,85],[-23,104],[-38,118],[0,-155],[0,-60],[0,0],[0,45]],
 [[0,75],[11,85],[23,104],[38,118],[0,-155],[0,-60],[0,0],[0,45]],
];
const STAR=Array.from({length:8},(_,i)=>{const a=-Math.PI/2+i*Math.PI/4,r=i%2?11:40;return [Math.cos(a)*r,Math.sin(a)*r] as Point;});

const PetalFlyer:React.FC<{f:number}>=({f})=>{
 const bloom=phase(f,261,282),{center,detach,fold,spark,angle}=flyerPose(f);
 const flap=(.24+.76*Math.abs(Math.cos((f-291)*.19+phase(f,332,372)*4)))*(1-fold)+fold;
 const wingColors=[C.coral,C.pink,C.gold,'#E8AB6E'];
 return <g transform={`translate(${center[0]} ${center[1]}) rotate(${angle})`}>
  {[0,1,2,3].map(i=>{
   const flowerAngles=[-45,45,-135,135],butterflyAngles=[-56,56,-131,131];
   const a=rad(mix(flowerAngles[i],butterflyAngles[i],detach));
   const petal=PETAL.map(p=>{const q=rotate(p,a);return [q[0]*mix(bloom,flap,detach),q[1]*bloom*(i>1?mix(1,.79,detach):1)] as Point;});
   const paper=petal.map((p,j)=>{const q=blendPoint(p,PLANE[i][j],fold);return [q[0],q[1]+Math.sin(f*.31+i)*3.5*fold*(1-spark)*(j===3?1:0)] as Point;});
   const shape=paper.map((p,j)=>blendPoint(p,STAR[j],spark));
   const fill=color(color(wingColors[i],[C.cream,'#B6DED2','#E4B77E','#79AEB4'][i],fold),i%2?'#FFD893':C.cream,spark);
   return <path key={i} d={outline(shape,mix(.85,0,fold))} fill={fill} stroke={i<2?color(wingColors[i],C.cream,spark):'none'} strokeWidth="1.5"/>;
  })}
  {/* The flower center lengthens into the butterfly body, then a paper keel. */}
  {spark<.999&&<>
   <ellipse cy={mix(0,16,detach)} rx={mix(35,9,detach)*(1-fold)*phase(f,258,267)} ry={mix(35,65,detach)*(1-fold)*phase(f,258,267)} fill={color('#E7A34C',C.ink,detach)}/>
   <path d={`M-4-44Q-36 ${-90*(1-fold)} -48 ${-73*(1-fold)}M4-44Q36 ${-90*(1-fold)} 48 ${-73*(1-fold)}`} stroke={C.ink} strokeWidth={4*detach*(1-fold)} fill="none" strokeLinecap="round"/>
   <path d="M0-145V90" pathLength="1" fill="none" stroke="#629DA5" strokeWidth={4*fold*(1-spark)} strokeDasharray="1" strokeDashoffset={1-fold}/>
  </>}
  {spark>0&&<circle r={14*spark} fill={C.cream}/>}
 </g>;
};

const FlightEnvironment:React.FC<{f:number}>=({f})=>{
 const air=phase(f,317,360),night=phase(f,477,544);
 const pos=carrier(f),orbit=phase(f,505,570);
 const points=Array.from({length:100},(_,i)=>{
  const u=i/99,old=flight(mix(400,Math.max(400,f),u));
  const target=orbitPoint(orbitAngle(f)-Math.PI*2*(1-u));
  return blendPoint(old,target,orbit);
 });
 return <>
  {f>305&&f<515&&[0,1,2,3].map(i=>{
   const start=312+i*13,age=f-start,x=2050-age*(6+i*.4)-phase(f,332,373)*360,y=170+i*175;
   return <path key={i} d={`M${x} ${y}q-125 -36-240 8t-190 0`} fill="none" stroke={color('#F6EFCA','#F0CAAD',phase(f,398,464))} strokeWidth={4+air*2} strokeLinecap="round"/>
  })}
  {f>398&&<path d={line(points)} fill="none" stroke={color('#FFF2CC','#7EC9CB',night)} strokeWidth={mix(7,4,orbit)} strokeLinecap="round"/>}
  {f>398&&Array.from({length:5},(_,i)=>{
   const p=points[Math.max(0,70-i*13)],s=phase(f,398+i*8,415+i*8)*(1-orbit);
   return <circle key={i} cx={p[0]} cy={p[1]} r={s*4} fill={C.cream}/>;
  })}
  {f>490&&<g transform={`translate(1320 ${430+600*(1-phase(f,492,540))})`}>
   <defs><clipPath id="sm-moon-disc"><circle r="119"/></clipPath></defs>
   <circle r="119" fill="#3F5276"/>
   <g clipPath="url(#sm-moon-disc)">
    <rect x={mix(120,-120,phase(f,538,590))} y="-125" width="250" height="250" fill="#EAD6BC"/>
    <path d="M-20-117C-120-50-108 66-21 117A119 119 0 1 1-20-117Z" fill={C.cream} opacity={phase(f,548,590)}/>
   </g>
   <ellipse cx="48" cy="-42" rx="24" ry="19" fill={color('#354769','#D6C4B5',phase(f,542,573))}/><ellipse cx="9" cy="47" rx="35" ry="28" fill={color('#354769','#E3CFB4',phase(f,550,581))}/><circle cx="67" cy="53" r="13" fill={color('#354769','#D6C4B5',phase(f,542,573))}/>
  </g>}
  {f>530&&<g transform={`translate(${pos[0]} ${pos[1]})`}><circle r={13+phase(f,530,552)*12} fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="2 8"/></g>}
 </>;
};

export const StoryMotionLab:React.FC<{includeAudio?:boolean}>=({includeAudio=true})=>{
 const f=useCurrentFrame();
 const dropY=mix(290,731,phase(f,31,83)**1.45),hit=phase(f,83,91);
 return <AbsoluteFill style={{background:C.navy}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080">
   <WaterAndSky f={f}/>
   <g clipPath="url(#tl-below)">
    <KelpAndGround f={f}/>
    {f<228&&[0,1,2].map(i=>{
     const x=180+i*500+(f-100)*(i%2?-3:2)-phase(f,173,218)*(i%2?1300:-1300),y=820+i%2*80;
     return <g key={i} transform={`translate(${x} ${y}) scale(${i%2?-.32:.27} .3)`}><path d="M-120 0Q15-100 130 0Q15 100-120 0L-190 65V-65Z" fill={i%2?'#91BCAB':'#76AEB7'}/><circle cx="72" cy="-13" r="11" fill={C.ink}/></g>;
    })}
    <FishLeaf f={f}/>
    {f>258&&<PetalFlyer f={f}/>}
    <FlightEnvironment f={f}/>
    <LivingWater f={f}/>
   </g>
   {f>=198&&f<261&&<path d={line(Array.from({length:13},(_,i)=>sparkPose(Math.max(198,f-12+i))))} stroke={C.gold} strokeWidth="5" strokeLinecap="round" fill="none"/>}
   <GoldenCarrier f={f}/>
   {f<84&&<Drop x={960} y={dropY} size={mix(24,88,phase(f,16,36))*(1-hit)} stretch={mix(1,1.25,phase(f,55,80))} fill={C.gold}/>}
   {f>=82&&f<112&&Array.from({length:9},(_,i)=>{
    const u=(f-82)/30,a=rad(205+i*16),distance=280*u;
    return <Drop key={i} x={960+Math.cos(a)*distance*2.4} y={790+Math.sin(a)*distance+u*u*240-100*phase(f,83,105)} size={20*(1-u)} stretch={1.2} fill={i%2?'#D3F0D4':'#9AE4CB'}/>;
   })}
  </svg>
  {includeAudio&&<Audio src={staticFile('assets/audio/story-motion/soundtrack.wav')}/>}
 </AbsoluteFill>;
};

// Read-only diagnostics for contact/trajectory review alongside rendered frames.
export const storyMotionState=(f:number)=>({
 frame:f,fish:fishPose(f),bubble:bubblePose(f),spark:sparkPose(f),
 fishNose:[fishPose(f).x+171,fishPose(f).y],
 bubbleRadius:31,gust:gust(f),flyer:flyerPose(f),
 moonLight:phase(f,538,590),
});
