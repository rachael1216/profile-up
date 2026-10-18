// Development-only asset acquisition proxy. Never accepts documents or POST requests.
import {createServer} from 'node:http';
import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const base='https://texlive.corca.ai/snapshots/2025-92e10d3241a312f0/2025/';
const root=resolve('public/texlive/2025');
createServer(async(req,res)=>{
 const path=decodeURIComponent((req.url??'/').slice(1));
 if(req.method!=='GET'||!path||path.includes('..')||!/^[-a-zA-Z0-9_./]+$/.test(path)){res.writeHead(400).end();return;}
 const file=resolve(root,path);
 try{
  if(existsSync(file)){res.writeHead(200);res.end(readFileSync(file));return;}
  const remote=await fetch(base+path,{signal:AbortSignal.timeout(30000)});
  if(!remote.ok){res.writeHead(remote.status).end();return;}
  const bytes=new Uint8Array(await remote.arrayBuffer());mkdirSync(dirname(file),{recursive:true});writeFileSync(file,bytes);
  console.log(`${path}: ${bytes.length}`);res.writeHead(200);res.end(bytes);
 }catch(e){console.error(path,e.message);res.writeHead(502).end();}
}).listen(5181,'127.0.0.1',()=>console.log('TeX asset cache: http://127.0.0.1:5181/'));
