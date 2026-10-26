// Build-time only. One versioned generation; never expose credentials to React.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'public/assets/audio/cancer-short-v1');
await fs.mkdir(dir,{recursive:true});
const output=path.join(dir,'narration-original.mp3');
try{await fs.access(output);console.log('Existing cancer narration preserved; no API request made.');process.exit(0)}catch{}
const p=JSON.parse(await fs.readFile(path.join(root,'src/data/cancer-short-plan.json'),'utf8'));
if(!process.env.ELEVENLABS_API_KEY)throw new Error('ELEVENLABS_API_KEY is unavailable; no alternate narrator used.');
let response;
try{
 response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${p.voice_id}/with-timestamps`,{
  method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({text:p.performance_text,model_id:p.model_id,output_format:'mp3_44100_128',voice_settings:p.voice_settings}),
  signal:AbortSignal.timeout(120000),
 });
}catch{throw new Error('Narration service/network request failed; no request headers or credentials logged.')}
if(!response.ok)throw new Error(`Narration request rejected: HTTP${response.status}. No fallback generation or automatic retry.`);
const result=await response.json();
if(!result.audio_base64||!result.alignment)throw new Error('Missing audio/alignment; no incomplete output saved.');
await fs.writeFile(output,Buffer.from(result.audio_base64,'base64'));
await fs.writeFile(path.join(dir,'alignment-original.json'),JSON.stringify({alignment:result.alignment,normalized_alignment:result.normalized_alignment},null,2)+'\n');
await fs.writeFile(path.join(dir,'generation.json'),JSON.stringify({provider:'ElevenLabs',voice_id:p.voice_id,voice_name:p.voice_name,model_id:p.model_id,text:p.performance_text,voice_settings:p.voice_settings,character_count:p.performance_text.length,requests:1,prior_knox_source:'unchanged',date_utc:new Date().toISOString()},null,2)+'\n');
console.log('Saved new cancer narration and character alignment; no existing recording replaced.');
