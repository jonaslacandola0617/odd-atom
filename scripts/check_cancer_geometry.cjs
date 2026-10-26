// Check actual source skin deformation across the used pose envelope.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const requireLocal=name=>{
  if(name==='./ArtworkMotion')return {Medicine:()=>null};
  if(name==='./art/TextureMesh')return {TextureMesh:()=>null};
  if(!name.startsWith('.'))return require(name);
  let p=path.resolve(path.dirname(file),name);
  if(p.endsWith('.json'))return JSON.parse(fs.readFileSync(p,'utf8'));
  p=['.ts','.tsx','.js'].map(ext=>p+ext).find(p=>fs.existsSync(p));
  if(!p)throw new Error('Cannot resolve '+name);return load(p);
 };
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(js,{module,exports:module.exports,require:requireLocal,Math,console},{filename:file});cache.set(file,module.exports);return module.exports;
}
const {cancerCellPoint}=load(path.join(root,'src/CancerShort.tsx'));
const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const grid=Array.from({length:7},(_,i)=>-1.14+2.28*i/6);let min=Infinity,checked=0;
for(let f=0;f<2280;f+=3)for(let seed=0;seed<5;seed++){
 const pinch=.12*(Math.sin(f*.018)**2),contact=(Math.sin(f*.011+seed)+1)/2;
 for(let x=0;x<6;x++)for(let y=0;y<6;y++)for(const tri of [[[grid[x],grid[y]],[grid[x+1],grid[y]],[grid[x],grid[y+1]]],[[grid[x+1],grid[y+1]],[grid[x],grid[y+1]],[grid[x+1],grid[y]]]]){
  const mapped=tri.map(p=>cancerCellPoint(p,f,seed,pinch,contact));const ratio=area(...mapped)/area(...tri);
  if(!Number.isFinite(ratio)||ratio<=0)throw new Error('Cell skin fold at '+f);min=Math.min(min,ratio);checked++;
 }
}
const report={status:'passed',cell_triangles_checked:checked,min_signed_area_ratio:min,clinician_body:'Approved original source pixels retained; local blink, focus knob and prepared environment layers move. No newly deformed body rig is used in the portrait close-up.',scope:'Actual imported deformation, seeded phases and used gentle pinch/contact envelope. Extreme star-shaped division pose was removed after visual failure. Geometry is not an artwork or clinical-accuracy score.'};
fs.writeFileSync(path.join(root,'docs/production/cancer-short/geometry-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
