type GatewayEnv={UPSTREAM_ORIGIN:string};
type Transport=(request:Request)=>Promise<Response>;
const safeMethods=new Set(['GET','HEAD','OPTIONS']);

/** Same-origin entry point; database and file ownership remain in the application. */
export async function forward(request:Request,env:GatewayEnv,transport:Transport=fetch):Promise<Response>{
 const incoming=new URL(request.url),upstream=new URL(env.UPSTREAM_ORIGIN);
 if(upstream.protocol!=='https:'||upstream.username||upstream.password||upstream.pathname!=='/'||upstream.search||upstream.hash)return new Response('Invalid upstream configuration',{status:503});
 if(!safeMethods.has(request.method)&&request.headers.get('Origin')!==incoming.origin)return new Response(JSON.stringify({error:'请求来源不匹配。'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const target=new URL(upstream.origin);target.pathname=incoming.pathname;target.search=incoming.search;
 const headers=new Headers(request.headers);headers.delete('Host');headers.delete('Forwarded');headers.delete('X-Forwarded-Host');headers.delete('X-Forwarded-Proto');
 if(headers.get('Origin')===incoming.origin)headers.set('Origin',upstream.origin);
 const referer=headers.get('Referer');if(referer?.startsWith(incoming.origin+'/'))headers.set('Referer',upstream.origin+referer.slice(incoming.origin.length));
 const init:RequestInit&{duplex:'half'}={method:request.method,headers,redirect:'manual',duplex:'half'};
 if(!safeMethods.has(request.method))init.body=request.body;
 const response=await transport(new Request(target,init)),out=new Headers(response.headers);
 const replace=(value:string)=>value.replaceAll(upstream.origin,incoming.origin);
 for(const name of ['Location','Link','Content-Security-Policy','Content-Security-Policy-Report-Only']){const value=out.get(name);if(value)out.set(name,replace(value));}
 out.delete('Access-Control-Allow-Origin');out.delete('Access-Control-Allow-Credentials');
 // Session cookies remain host-only, so the browser binds them to the entry domain.
 // PDFs, WASM and font responses stream without buffering or textual modification.
 const type=out.get('Content-Type')??'';
 if(request.method!=='HEAD'&&response.body&&/^(text\/html|text\/x-component|application\/json)/i.test(type)){
  const body=replace(await response.text());out.delete('Content-Length');out.delete('Content-Encoding');out.delete('ETag');
  return new Response(body,{status:response.status,statusText:response.statusText,headers:out});
 }
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers:out});
}
export default {fetch:forward};
