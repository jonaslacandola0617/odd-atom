/** Verify the actual motion functions without rendering or external services. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),file=path.join(root,'src/ArtworkMotion.tsx'),req=createRequire(file),mod={exports:{}};
const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(js,{exports:mod.exports,module:mod,require:name=>name==='./art/TextureMesh'?{TextureMesh:()=>null}:req(name)},{filename:file});
const rig=mod.exports,range=(a,b,s)=>Array.from({length:Math.ceil((b-a)/s)+1},(_,i)=>Math.min(b,a+i*s));
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const defs=[['clinician',range(945,1565,40),[115,155,195,235,275,315,355,395,425,455,485,510,535,560,585,610,635,660,685,715,755,815,880,941],rig.clinicianPoint],['immune-cell',range(-300,310,55),range(-300,300,55),rig.immunePoint]];
const result={frames:600,meshes:{},maxContactDisplacement:0,threatsSettleInsideBasin:true};
for(const [name,xs,ys,deform] of defs){let min=Infinity,count=0;
 for(let f=0;f<600;f++){
  for(let j=0;j<ys.length-1;j++)for(let i=0;i<xs.length-1;i++){
   const a=[xs[i],ys[j]],b=[xs[i+1],ys[j]],c=[xs[i],ys[j+1]],d=[xs[i+1],ys[j+1]];
   for(const tri of [[a,b,c],[d,c,b]]){const ratio=cross(...tri.map(p=>deform(p,f)))/cross(...tri);if(!Number.isFinite(ratio)||ratio<=0)throw new Error(`${name} folded at ${f}`);min=Math.min(min,ratio);count++;}
  }
  if(name==='clinician'){const p=[1000,640],q=deform(p,f);result.maxContactDisplacement=Math.max(result.maxContactDisplacement,Math.hypot(p[0]-q[0],p[1]-q[1]));}
 }
 result.meshes[name]={trianglesChecked:count,minAreaRatio:min,noFoldovers:true};
}
if(result.maxContactDisplacement>1e-9)throw new Error('Contact anchor moved');
for(let i=0;i<24;i++)for(let age=115;age<700;age++){
 const {p,landed}=rig.threatPoint(age,i),radius=((p[0]-1333)/291)**2+((p[1]-704)/94)**2;
 if(!landed||radius>1||p.some(n=>!Number.isFinite(n)))throw new Error('Containment trajectory left the basin');
}
result.limits='Geometry/contact/containment checks; subjective motion and artwork quality require visual review.';
const dest=path.join(root,'docs/production/artwork-motion/geometry.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
