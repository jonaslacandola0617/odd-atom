/** Inspect the actual TS rig functions without rendering or speech requests. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const ts=require('typescript');
const file=path.resolve(__dirname,'../src/MotionCharacters.tsx');
const localRequire=createRequire(file);
const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(source,{require:name=>name==='./IllustratedTitle'?{IllustratedTitle:()=>null}:localRequire(name),exports:mod.exports,module:mod},{filename:file});
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const results={};let checked=0,maxFootDisplacement=0,maxCupEdgeError=0;
for(let f=0;f<600;f++){
  for(const mesh of mod.exports.motionGeometry(f)){
    const {name,xs,ys,deform}=mesh;
    const r=results[name]??={minAreaRatio:Infinity,maxAreaRatio:-Infinity,trianglesChecked:0};
    for(let y=0;y<ys.length-1;y++)for(let x=0;x<xs.length-1;x++){
      const [a,b,c,d]=[[xs[x],ys[y]],[xs[x+1],ys[y]],[xs[x],ys[y+1]],[xs[x+1],ys[y+1]]];
      for(const points of [[a,b,c],[d,c,b]]){
        const ratio=cross(...points.map(deform))/cross(...points);
        if(!Number.isFinite(ratio)||ratio<=0)throw new Error(`${name} folds at frame ${f}`);
        r.minAreaRatio=Math.min(r.minAreaRatio,ratio);r.maxAreaRatio=Math.max(r.maxAreaRatio,ratio);r.trianglesChecked++;checked++;
      }
    }
    if(name.endsWith('body'))for(const p of [[-90,-30],[10,-50],[80,-10]]){
      const q=deform(p);maxFootDisplacement=Math.max(maxFootDisplacement,Math.hypot(q[0]-p[0],q[1]-p[1]));
    }
    if(name==='Mira arm'){
      const corners=[[3,-385],[32,-385],[32,-349],[3,-349]];
      for(let i=0;i<4;i++){
        const a=corners[i],b=corners[(i+1)%4],A=deform(a),B=deform(b);
        maxCupEdgeError=Math.max(maxCupEdgeError,Math.abs(Math.hypot(B[0]-A[0],B[1]-A[1])-Math.hypot(b[0]-a[0],b[1]-a[1])));
      }
    }
  }
}
if(maxFootDisplacement!==0||maxCupEdgeError>1e-9)throw new Error('Foot anchor or rigid cup invariant failed');
const record={frames:600,trianglesChecked:checked,noFoldovers:true,maxFootDisplacementLocalPixels:maxFootDisplacement,maxCupEdgeLengthErrorLocalPixels:maxCupEdgeError,meshes:results,limits:'Geometry checks detect foldovers and anchor/prop deformation; they do not score acting, artwork similarity, or subjective voice performance.'};
const output=path.resolve(__dirname,'../docs/production/characters-motion/geometry.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
