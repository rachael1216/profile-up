import {projectProfile,type Profile} from './model';
import {fontCatalog,chineseFonts} from './catalog';
import {fontBytes,renderTex} from './exports';
export async function compileCV(profile:Profile,onProgress?:(message:string)=>void):Promise<Uint8Array>{
 const p=projectProfile(profile,'cv'),en=p.settings.interfaceLanguage==='en',t=(zh:string,enText:string)=>en?enText:zh;
 onProgress?.(t('正在加载 XeLaTeX 引擎与字体…','Loading XeLaTeX and fonts…'));
 const {WasmTexCompiler}=await import('wasmtex/headless');
 const files:Record<string,string|Uint8Array>={'main.tex':renderTex(p)};
 for(const file of [fontCatalog[p.settings.latinFont].file,chineseFonts[p.settings.chineseFont].file])files[`fonts/${file}`]=new Uint8Array(await fontBytes(file));
 if(p.basics.photo)files[`photo.${p.basics.photo.startsWith('data:image/png')?'png':'jpg'}`]=Uint8Array.from(atob(p.basics.photo.split(',')[1]),c=>c.charCodeAt(0));
 const compiler=new WasmTexCompiler({engine:'xelatex',texliveVersion:'2025',texliveUrl:new URL('/texlive/2025/',location.origin).href,assetBaseUrl:'/',persistentCache:true,files,onLoadProgress:event=>{onProgress?.(event.phase==='format'?t(`加载 TeX 格式 ${event.percent}%`,`Loading TeX format ${event.percent}%`):t(`加载排版组件 ${event.count}…`,`Loading typesetting component ${event.count}…`));}});
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
   const work=async()=>{await compiler.init();onProgress?.(t('正在使用 XeLaTeX 排版…','Typesetting with XeLaTeX…'));const result=await compiler.compile();if(!result.success||!result.pdf)throw Error(t('TeX 编译失败：','TeX compilation failed: ')+(result.errors[0]?.message??result.log.slice(-600)));if(/Missing character:/.test(result.log))throw Error(t('所选字体缺少字符，请更换字体后重试。','The selected font is missing a character. Choose another font and retry.'));return result.pdf;};
   return await Promise.race([work(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{compiler.dispose();reject(Error(t('编译超时，请检查网络或下载 TeX 源项目在本机编译。','Compilation timed out. Check your connection or compile the TeX source locally.')));},180000);})]);
 }finally{if(timer)clearTimeout(timer);compiler.dispose();}
}
