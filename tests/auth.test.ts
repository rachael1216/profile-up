import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeContact,configuredSettings,authCookie,cookieValue,digest,randomToken} from '../lib/auth-contract';
import {otpProvider} from '../lib/otp-provider';
import {ApiError} from '../lib/request-validation';
const userId='03e71623-136a-4b91-a684-745aac1db26e';
const now=new Date().toISOString();
function fixture(channel:'email'|'sms',options:{confirmed?:boolean;different?:boolean;status?:number}={}){
 const calls:{path:string;body:Record<string,unknown>;authorization:string|null}[]=[];
 const user={id:userId,email:channel==='email'?(options.different?'another@example.org':'person@example.org'):undefined,phone:channel==='sms'?'8613800000000':undefined,email_confirmed_at:channel==='email'&&options.confirmed!==false?now:undefined,phone_confirmed_at:channel==='sms'&&options.confirmed!==false?now:undefined,app_metadata:{provider:channel==='email'?'email':'phone'},user_metadata:{},aud:'authenticated',created_at:now};
 const transport:typeof fetch=async(input,init)=>{const path=new URL(typeof input==='string'?input:input instanceof URL?input:input.url).pathname;calls.push({path,body:init?.body?JSON.parse(String(init.body)):{},authorization:new Headers(init?.headers).get('authorization')});
  const result=options.status?{msg:'Provider failure',code:'request_failure'}:path.endsWith('/verify')?{access_token:'opaque-test-access',refresh_token:'opaque-test-refresh',token_type:'bearer',expires_in:3600,user}:path.endsWith('/user')?user:{};
  return new Response(JSON.stringify(result),{status:options.status??200,headers:{'Content-Type':'application/json'}});
 };
 return {provider:otpProvider('https://auth.example.test','public-test-key',transport),calls};
}
test('email and phone input normalizes; malformed identifiers are rejected',()=>{
 assert.deepEqual(normalizeContact('email',' Person@Example.ORG '),{channel:'email',destination:'person@example.org'});
 assert.equal(normalizeContact('sms','138 0000 0000').destination,'+8613800000000');
 assert.equal(normalizeContact('sms','+1 (202) 555-0100').destination,'+12025550100');
 for(const [kind,value] of [['sms','123'],['email','a\r\nb@example.com'],['email','bad'],['other','person@example.org']])assert.throws(()=>normalizeContact(kind,value));
});
test('OTP channels fail closed until HTTPS provider configuration and activation',()=>{
 assert.equal(configuredSettings({url:'http://auth.example.test',key:'key',emailEnabled:'true'}).email,false);
 assert.equal(configuredSettings({url:'https://auth.example.test',key:'key'}).sms,false);
 assert.equal(configuredSettings({url:'https://auth.example.test',key:'key',emailEnabled:'true'}).email,true);
 assert.equal(configuredSettings({url:'https://auth.example.test/path',key:'key',smsEnabled:'true'}).sms,false);
});
test('session cookies are host-bound, HttpOnly and Secure in production; raw tokens are not stored',async()=>{
 const token=randomToken();assert.match(token,/^[a-f0-9]{64}$/);assert.notEqual(await digest(token),token);
 const cookie=authCookie('session',token,3600,true);for(const part of ['__Host-profileup-session=','HttpOnly','Secure','SameSite=Lax','Path=/'])assert.ok(cookie.includes(part));assert.ok(!cookie.includes('Domain='));
 assert.equal(cookieValue('x=1; profileup-session=valid','profileup-session'),'valid');assert.equal(cookieValue('profileup-session=a; profileup-session=b','profileup-session'),null);
});
test('email and SMS codes use the provider and require confirmed matching identities',async()=>{
 for(const channel of ['email','sms'] as const){const contact=normalizeContact(channel,channel==='email'?'person@example.org':'+8613800000000');const {provider,calls}=fixture(channel);await provider.send(contact);const checked=await provider.verify(contact,'123456');assert.equal(checked.subject,userId);assert.ok(calls.some(c=>c.path.endsWith('/otp')&&c.body.create_user===true));assert.ok(calls.some(c=>c.path.endsWith('/verify')&&c.body.type===(channel==='email'?'email':'sms')));assert.ok(calls.some(c=>c.path.endsWith('/user')&&c.authorization==='Bearer opaque-test-access'));}
 const contact=normalizeContact('email','person@example.org');for(const options of [{confirmed:false},{different:true}])await assert.rejects(fixture('email',options).provider.verify(contact,'123456'),(e:unknown)=>e instanceof ApiError&&e.status===401);
});
test('provider failures and limits do not produce a successful send or session',async()=>{
 const contact=normalizeContact('sms','+8613800000000');await assert.rejects(fixture('sms',{status:429}).provider.send(contact),(e:unknown)=>e instanceof ApiError&&e.status===429);
 await assert.rejects(fixture('sms',{status:500}).provider.send(contact),(e:unknown)=>e instanceof ApiError&&e.status===503);
 await assert.rejects(fixture('sms',{status:400}).provider.verify(contact,'123456'),(e:unknown)=>e instanceof ApiError&&e.status===400);
});
