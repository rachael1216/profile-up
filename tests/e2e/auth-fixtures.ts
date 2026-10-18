import {execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import type {BrowserContext} from '@playwright/test';
export const origin='http://127.0.0.1:5173';
export async function signInFixture(context:BrowserContext,expiresIn=3600){
 const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex'),id='otp_test_'+randomBytes(8).toString('hex'),now=Math.floor(Date.now()/1000);
 const sql=`INSERT INTO auth_users(id,provider_subject,channel,contact,verified_at,created_at) VALUES ('${id}','test:${id}','email','test@example.org','2026-10-18T00:00:00Z','2026-10-18T00:00:00Z'); INSERT INTO auth_sessions(token_hash,user_id,created_at,expires_at) VALUES ('${hash}','${id}',${now},${now+expiresIn});`;
 execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',sql],{stdio:'pipe'});
 await context.addCookies([{name:'profileup-session',value:token,url:origin,httpOnly:true,sameSite:'Lax'}]);return {id,token};
}
