import test from 'node:test';
import assert from 'node:assert/strict';
import {forward} from '../gateway/worker';
import {clientIP} from '../lib/client-ip';
const secret='ab'.repeat(32);
const upstream='https://origin.example.org',entry='https://profileup.example.net';
test('entry domain preserves sessions and rewrites publication URLs while enforcing the browser origin',async()=>{
 let called=0;
 const transport=async(request:Request)=>{called++;assert.equal(request.url,upstream+'/api/profiles/id/site');assert.equal(request.headers.get('Origin'),upstream);assert.equal(request.headers.get('Cookie'),'__Host-profileup-session=token');assert.equal(await request.text(),'{}');return new Response(JSON.stringify({url:upstream+'/p/alice'}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':'__Host-profileup-session=new; Secure; HttpOnly; Path=/','Location':upstream+'/p/alice'}});};
 const response=await forward(new Request(entry+'/api/profiles/id/site',{method:'POST',headers:{Origin:entry,Cookie:'__Host-profileup-session=token'},body:'{}'}),{UPSTREAM_ORIGIN:upstream,GATEWAY_SHARED_SECRET:secret},transport);
 assert.deepEqual(await response.json(),{url:entry+'/p/alice'});assert.equal(response.headers.get('Location'),entry+'/p/alice');assert.ok(response.headers.get('Set-Cookie')?.includes('HttpOnly'));assert.equal(response.headers.get('Cache-Control'),'no-store');
 for(const origin of ['https://forged.example',null]){const headers=new Headers();if(origin)headers.set('Origin',origin);const denied=await forward(new Request(entry+'/api/profiles',{method:'POST',headers,body:'{}'}),{UPSTREAM_ORIGIN:upstream,GATEWAY_SHARED_SECRET:secret},transport);assert.equal(denied.status,403);}
 assert.equal(called,1);
});
test('binary attachments stream intact and request paths cannot select another upstream',async()=>{
 const data=new Uint8Array([0,255,12,33]);
 const response=await forward(new Request(entry+'//evil.example/file.pdf'),{UPSTREAM_ORIGIN:upstream,GATEWAY_SHARED_SECRET:secret},async request=>{assert.equal(new URL(request.url).origin,upstream);return new Response(data,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="paper.pdf"'}});});
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),data);assert.equal(response.headers.get('Content-Disposition'),'attachment; filename="paper.pdf"');
});

test('forwarded visitor addresses are trusted only with the private gateway credential',()=>{
 const request=(key:string)=>new Request(entry,{headers:{'CF-Connecting-IP':'2a06:98c0:3600::103','X-ProfileUp-Client-IP':'203.0.113.7','X-ProfileUp-Gateway-Key':key}});
 assert.equal(clientIP(request(secret),secret),'203.0.113.7');
 assert.equal(clientIP(request('cd'.repeat(32)),secret),'2a06:98c0:3600::103');
 assert.equal(clientIP(request(secret)),'2a06:98c0:3600::103');
});
