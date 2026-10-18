import {z} from 'zod';
import {ApiError} from './request-validation';
export type AuthChannel='email'|'sms';
export type Contact={channel:AuthChannel;destination:string};
export type AuthSettings={url?:string;key?:string;emailEnabled?:string;smsEnabled?:string;captchaSiteKey?:string;dailySmsLimit?:string};
export function normalizeContact(channel:unknown,value:unknown):Contact{
 if(typeof value!=='string'||value.length>254)throw new ApiError(400,'请填写有效的邮箱或手机号。');
 if(channel==='email'){const destination=value.trim().toLowerCase();if(!z.string().email().safeParse(destination).success)throw new ApiError(400,'邮箱格式不正确。');return {channel,destination};}
 if(channel==='sms'){let destination=value.replace(/[ ()-]/g,'');if(/^1[3-9]\d{9}$/.test(destination))destination='+86'+destination;if(!/^\+[1-9]\d{7,14}$/.test(destination))throw new ApiError(400,'手机号请包含国家区号，例如 +86。');return {channel,destination};}
 throw new ApiError(400,'请选择邮箱或短信验证。');
}
export function configuredSettings(settings:AuthSettings){
 let origin:string|undefined;
 try{const u=new URL(settings.url??'');if(u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash)origin=u.origin;}catch{}
 const configured=!!origin&&!!settings.key;
 return {origin,key:settings.key,email:configured&&settings.emailEnabled==='true',sms:configured&&settings.smsEnabled==='true',captchaSiteKey:settings.captchaSiteKey??''};
}
export function maskContact(contact:string){if(contact.includes('@')){const [name,domain]=contact.split('@');return `${name.slice(0,2)}***@${domain}`;}return `${contact.slice(0,3)}••••${contact.slice(-4)}`;}
export function cookieValue(header:string|null,name:string):string|null{const values=(header??'').split(';').map(p=>p.trim()).filter(p=>p.startsWith(name+'=')).map(p=>p.slice(name.length+1));return values.length===1?values[0]:null;}
export function authCookieName(kind:'session'|'challenge',secure:boolean){return `${secure?'__Host-':''}profileup-${kind}`;}
export function authCookie(kind:'session'|'challenge',value:string,maxAge:number,secure:boolean){return `${authCookieName(kind,secure)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export function randomToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export async function digest(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
