import {scrypt,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {ApiError} from './request-validation';
import {randomToken} from './auth-contract';

// OWASP's 32 MiB scrypt configuration fits the Worker memory limit.
const parameters={N:32768,r:8,p:3,maxmem:64*1024*1024};
const prefix='$scrypt$ln=15,r=8,p=3$';
export const dummyPasswordHash=prefix+'00'.repeat(32)+'$'+'00'.repeat(64);
export function validPassword(value:unknown):string{
 if(typeof value!=='string'||[...value].length<12||[...value].length>128)throw new ApiError(400,'密码须为 12–128 个字符。');
 return value;
}
function derive(password:string,salt:string){return new Promise<Buffer>((resolve,reject)=>scrypt(password,Buffer.from(salt,'hex'),64,parameters,(error,key)=>error?reject(error):resolve(key)));}
export async function hashPassword(password:string){const salt=randomToken();return prefix+salt+'$'+(await derive(password,salt)).toString('hex');}
export async function verifyPassword(password:string,encoded:string){
 const match=/^\$scrypt\$ln=15,r=8,p=3\$([a-f0-9]{64})\$([a-f0-9]{128})$/.exec(encoded);
 if(!match)return false;
 return timingSafeEqual(await derive(password,match[1]),Buffer.from(match[2],'hex'));
}
