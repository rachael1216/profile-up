import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {installNodeWorkerHost,WasmTexCompiler} from 'wasmtex/node';
import {renderTex} from '../src/lib/exports';
import {demoProfile,layoutDemo,type Profile} from '../src/lib/model';
import {cvCatalog,fontCatalog,chineseFonts,type CVTemplate} from '../src/lib/catalog';
const root=resolve('.'),out=resolve('test-results/tex-audit');mkdirSync(out,{recursive:true});
const host=installNodeWorkerHost({publicDir:resolve('public'),assetBaseUrl:'http://127.0.0.1:5173/'});
try{
 for(const template of Object.keys(cvCatalog) as CVTemplate[]){
  const p:Profile=layoutDemo(template,demoProfile.settings);p.settings.language=template==='research'||template==='science'?'en':'zh';p.settings.latinFont=cvCatalog[template].font;p.settings.chineseFont=cvCatalog[template].chineseFont;
  const source=renderTex(p);const files:Record<string,string|Uint8Array>={'main.tex':source};
  for(const file of [fontCatalog[p.settings.latinFont].file,chineseFonts[p.settings.chineseFont].file])files[`fonts/${file}`]=readFileSync(resolve('public/fonts',file));
  const compiler=new WasmTexCompiler({assetBaseUrl:'http://127.0.0.1:5173/',engine:'xelatex',texliveVersion:'2025',texliveUrl:process.env.PROFILEUP_TEX_MIRROR??'http://127.0.0.1:5173/texlive/2025/',files,disablePreambleSnapshot:true});
  try{await compiler.init();const r=await compiler.compile();writeFileSync(`${out}/${template}.log`,r.log);writeFileSync(`${out}/${template}.tex`,source);if(!r.success||!r.pdf)throw Error(`${template}: ${JSON.stringify(r.errors)}\n${r.log.slice(-1400)}`);if(/Missing character:/.test(r.log))throw Error(`${template}: missing font glyphs`);writeFileSync(`${out}/${template}.pdf`,r.pdf);console.log(`${template}: ${r.pdf.length} bytes, ${r.compileTime.toFixed(0)} ms`);}finally{compiler.dispose();}
 }
}finally{host.dispose();}
