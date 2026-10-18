import {env} from 'cloudflare:workers';
export async function GET(request:Request){
 const parts=await Promise.all(['icu-0.bin','icu-1.bin'].map(name=>env.ASSETS.fetch(new URL(`/texlive/2025/${name}`,request.url))));
 if(parts.some(p=>!p.ok||!p.body))return new Response('TeX runtime data unavailable',{status:503});
 const stream=new ReadableStream({async start(controller){try{for(const part of parts){const reader=part.body!.getReader();while(true){const {done,value}=await reader.read();if(done)break;controller.enqueue(value);}}controller.close();}catch(error){controller.error(error);}}});
 return new Response(stream,{headers:{'Content-Type':'application/octet-stream','Content-Length':'28566176','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
}
