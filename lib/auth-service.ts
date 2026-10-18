import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {database} from './database';
import {ApiError,checkOrigin,readJSON} from './request-validation';
import {authCookie,authCookieName,cookieValue,configuredSettings,digest,maskContact,normalizeContact,randomToken,type AuthChannel} from './auth-contract';
import {otpProvider} from './otp-provider';
import {dummyPasswordHash,hashPassword,validPassword,verifyPassword} from './password';
export type AppUser={id:string;name:string;provider:'otp'|'password-demo';verified:boolean};
const SESSION_SECONDS=8*60*60,CHALLENGE_SECONDS=10*60;
function settings(){return configuredSettings({url:env.SUPABASE_URL,key:env.SUPABASE_PUBLISHABLE_KEY,emailEnabled:env.AUTH_EMAIL_ENABLED,smsEnabled:env.AUTH_SMS_ENABLED,captchaSiteKey:env.TURNSTILE_SITE_KEY});}
function enabled(channel:AuthChannel){const config=settings();if(!(channel==='email'?config.email:config.sms)||!config.origin||!config.key)throw new ApiError(503,channel==='email'?'邮箱验证码暂未开通，可先免注册体验。':'短信验证码暂未开通，可先免注册体验。');return config;}
function demoEnabled(){return env.AUTH_DEMO_PASSWORD_ENABLED==='true'||(import.meta.env.DEV&&env.AUTH_DEMO_PASSWORD_ENABLED!=='false');}
export function authConfiguration(){const config=settings();return Response.json({email:config.email,sms:config.sms,passwordDemo:demoEnabled(),captchaSiteKey:config.captchaSiteKey,demo:true},{headers:{'Cache-Control':'no-store'}});}
async function limit(key:string,max:number,period:number){
 const now=Math.floor(Date.now()/1000),bucket=await digest(`${key}:${Math.floor(now/period)}`);
 const result=await database().prepare('INSERT INTO auth_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<?').bind(bucket,now+period*2,max).run();
 if(!result.meta.changes)throw new ApiError(429,'请求过于频繁，请稍后重试。');
}
function browserToken(request:Request,kind:'session'|'challenge'){return cookieValue(request.headers.get('Cookie'),authCookieName(kind,new URL(request.url).protocol==='https:'));}
export async function getAppUser():Promise<AppUser|null>{
 const h=await headers(),raw=h.get('cookie');
 const local=import.meta.env.DEV&&/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h.get('host')??'');
 const name=authCookieName('session',!local),token=cookieValue(raw,name),present=(raw??'').split(';').some(part=>part.trim().startsWith(name+'='));
 if(present){
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const row=await database().prepare("SELECT s.user_id AS id,COALESCE(u.contact,d.contact) AS contact,CASE WHEN u.id IS NOT NULL THEN 'otp' ELSE 'password-demo' END AS provider FROM auth_sessions s LEFT JOIN auth_users u ON u.id=s.user_id LEFT JOIN demo_credentials d ON d.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND (u.id IS NOT NULL OR d.user_id IS NOT NULL)").bind(await digest(token),Math.floor(Date.now()/1000)).first<{id:string;contact:string;provider:'otp'|'password-demo'}>();
  return row?{id:row.id,name:maskContact(row.contact),provider:row.provider,verified:row.provider==='otp'}:null;
 }
 return null;
}
async function passwordSession(request:Request,id:string){
 const token=randomToken(),now=Math.floor(Date.now()/1000),created=new Date().toISOString(),db=database();
 await db.batch([
  db.prepare('INSERT OR IGNORE INTO accounts(id,created_at) VALUES (?,?)').bind(id,created),
  db.prepare('INSERT INTO auth_sessions(token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(await digest(token),id,now,now+SESSION_SECONDS),
  db.prepare('DELETE FROM auth_sessions WHERE expires_at<?').bind(now),
  db.prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(now)
 ]);
 const old=browserToken(request,'session');if(old)await db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await digest(old)).run();
 return Response.json({redirect:'/',verified:false},{headers:{'Cache-Control':'no-store','Set-Cookie':authCookie('session',token,SESSION_SECONDS,new URL(request.url).protocol==='https:')}});
}
export async function passwordAccount(request:Request,action:'register'|'login'){
 checkOrigin(request);if(!demoEnabled())throw new ApiError(503,'演示账号暂未开放。');
 const body=await readJSON(request,8192),contact=normalizeContact(body.channel,body.contact),password=validPassword(body.password),ip=request.headers.get('CF-Connecting-IP')??'loopback';
 await limit(`password:${action}:ip:${ip}`,action==='register'?5:30,action==='register'?3600:600);
 await limit(`password:${action}:contact:${contact.channel}:${contact.destination}`,action==='register'?3:10,600);
 if(action==='register'){
  await limit('password:register:global',100,86400);
  const id=`demo_${crypto.randomUUID()}`,hash=await hashPassword(password);
  const result=await database().prepare('INSERT INTO demo_credentials(user_id,channel,contact,password_hash,created_at) VALUES (?,?,?,?,?) ON CONFLICT(channel,contact) DO NOTHING').bind(id,contact.channel,contact.destination,hash,new Date().toISOString()).run();
  if(!result.meta.changes)throw new ApiError(409,'此邮箱或手机号已注册，请登录。');
  return passwordSession(request,id);
 }
 const row=await database().prepare('SELECT user_id,password_hash FROM demo_credentials WHERE channel=? AND contact=?').bind(contact.channel,contact.destination).first<{user_id:string;password_hash:string}>();
 const correct=await verifyPassword(password,row?.password_hash??dummyPasswordHash);
 if(!row||!correct)throw new ApiError(401,'账号或密码不正确。');
 return passwordSession(request,row.user_id);
}
export async function sendOtp(request:Request){
 checkOrigin(request);const body=await readJSON(request,8192),contact=normalizeContact(body.channel,body.contact),config=enabled(contact.channel);
 const captchaToken=typeof body.captchaToken==='string'&&body.captchaToken.length<=4096?body.captchaToken:undefined;
 if(config.captchaSiteKey&&!captchaToken)throw new ApiError(400,'请先完成人机验证。');
 const ip=request.headers.get('CF-Connecting-IP')??'loopback';
 await limit(`send:ip:${ip}`,5,600);await limit(`send:target:${contact.destination}`,1,60);await limit(`send:hour:${contact.destination}`,6,3600);
 const daily=Number(env.AUTH_SMS_DAILY_LIMIT??'25');await limit(`send:global:${contact.channel}`,contact.channel==='sms'&&Number.isInteger(daily)&&daily>0?Math.min(daily,1000):contact.channel==='email'?200:25,86400);
 await otpProvider(config.origin!,config.key!).send(contact,captchaToken);
 const challengeId=crypto.randomUUID(),supplied=browserToken(request,'challenge'),token=supplied&&/^[a-f0-9]{64}$/.test(supplied)?supplied:randomToken(),now=Math.floor(Date.now()/1000),secure=new URL(request.url).protocol==='https:';
 await database().prepare('INSERT INTO auth_challenges(id,browser_hash,channel,contact,attempts,expires_at,used) VALUES (?,?,?,?,0,?,0)').bind(challengeId,await digest(token),contact.channel,contact.destination,now+CHALLENGE_SECONDS).run();
 // Expired records can be removed without affecting active challenges or sessions.
 await database().batch([database().prepare('DELETE FROM auth_challenges WHERE expires_at<?').bind(now),database().prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(now),database().prepare('DELETE FROM auth_sessions WHERE expires_at<?').bind(now)]);
 return Response.json({challengeId,destination:maskContact(contact.destination),resendAfter:60,expiresIn:CHALLENGE_SECONDS},{headers:{'Cache-Control':'no-store','Set-Cookie':authCookie('challenge',token,CHALLENGE_SECONDS,secure)}});
}
export async function verifyOtp(request:Request){
 checkOrigin(request);const body=await readJSON(request,8192);if(typeof body.challengeId!=='string'||body.challengeId.length>50||typeof body.code!=='string'||!/^\d{6}$/.test(body.code))throw new ApiError(400,'请填写 6 位数字验证码。');
 const token=browserToken(request,'challenge');if(!token||!/^[a-f0-9]{64}$/.test(token))throw new ApiError(400,'验证会话已过期，请重新获取验证码。');
 await limit(`verify:ip:${request.headers.get('CF-Connecting-IP')??'loopback'}`,20,600);
 const now=Math.floor(Date.now()/1000),browserHash=await digest(token);
 const challenge=await database().prepare('SELECT channel,contact FROM auth_challenges WHERE id=? AND browser_hash=? AND used=0 AND expires_at>? AND attempts<5').bind(body.challengeId,browserHash,now).first<{channel:AuthChannel;contact:string}>();
 if(!challenge)throw new ApiError(400,'验证码无效或已过期，请重新获取。');
 const attempt=await database().prepare('UPDATE auth_challenges SET attempts=attempts+1 WHERE id=? AND browser_hash=? AND used=0 AND expires_at>? AND attempts<5').bind(body.challengeId,browserHash,now).run();if(!attempt.meta.changes)throw new ApiError(400,'验证码尝试次数已达上限，请重新获取。');
 const config=enabled(challenge.channel),verified=await otpProvider(config.origin!,config.key!).verify({channel:challenge.channel,destination:challenge.contact},body.code);
 const consumed=await database().prepare('UPDATE auth_challenges SET used=1 WHERE id=? AND browser_hash=? AND used=0 AND expires_at>?').bind(body.challengeId,browserHash,now).run();if(!consumed.meta.changes)throw new ApiError(400,'验证码已使用，请重新获取。');
 const subject=`${config.origin}:${verified.subject}`,id=`otp_${await digest(subject)}`,sessionToken=randomToken(),sessionHash=await digest(sessionToken),createdAt=new Date().toISOString();
 await database().batch([
  database().prepare('INSERT INTO auth_users(id,provider_subject,channel,contact,verified_at,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET channel=excluded.channel,contact=excluded.contact,verified_at=excluded.verified_at').bind(id,subject,challenge.channel,challenge.contact,verified.verifiedAt,createdAt),
  database().prepare('INSERT OR IGNORE INTO accounts(id,created_at) VALUES (?,?)').bind(id,createdAt),
  database().prepare('INSERT INTO auth_sessions(token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(sessionHash,id,now,now+SESSION_SECONDS)
 ]);
 const old=browserToken(request,'session');if(old&&old!==sessionToken)await database().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await digest(old)).run();
 const responseHeaders=new Headers({'Cache-Control':'no-store'}),secure=new URL(request.url).protocol==='https:';
 responseHeaders.append('Set-Cookie',authCookie('session',sessionToken,SESSION_SECONDS,secure));responseHeaders.append('Set-Cookie',authCookie('challenge','',0,secure));
 return Response.json({redirect:'/'},{headers:responseHeaders});
}
export async function signOut(request:Request){checkOrigin(request);const token=browserToken(request,'session');if(token)await database().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await digest(token)).run();const secure=new URL(request.url).protocol==='https:',h=new Headers({'Cache-Control':'no-store'});h.append('Set-Cookie',authCookie('session','',0,secure));h.append('Set-Cookie',authCookie('challenge','',0,secure));return Response.json({redirect:'/'},{headers:h});}
