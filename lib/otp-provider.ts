import {createClient} from '@supabase/supabase-js';
import {normalizeContact,type Contact} from './auth-contract';
import {ApiError} from './request-validation';
export function otpProvider(url:string,key:string,transport:typeof fetch=fetch){
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,init)=>transport(input,{...init,signal:AbortSignal.timeout(12000)})}});
 function failure(status?:number){if(status===429)return new ApiError(429,'验证码请求过于频繁，请稍后重试。');return new ApiError(503,'验证服务暂不可用，请稍后重试。');}
 return {
  async send(contact:Contact,captchaToken?:string){
   const credentials=contact.channel==='email'?{email:contact.destination,options:{shouldCreateUser:true,captchaToken}}:{phone:contact.destination,options:{shouldCreateUser:true,captchaToken},channel:'sms' as const};
   const {error}=await client.auth.signInWithOtp(credentials);if(error)throw failure(error.status);
  },
  async verify(contact:Contact,token:string){
   const credentials=contact.channel==='email'?{email:contact.destination,token,type:'email' as const}:{phone:contact.destination,token,type:'sms' as const};
   const {data,error}=await client.auth.verifyOtp(credentials);
   if(error||!data.session?.access_token)throw new ApiError(error?.status===429?429:400,error?.status===429?'验证码请求过于频繁，请稍后重试。':'验证码无效或已过期，请重新获取。');
   // Validate the session with the provider. Never derive an owner from client claims.
   const {data:checked,error:checkError}=await client.auth.getUser(data.session.access_token);
   const user=checked.user;if(checkError||!user||!/^[-a-f0-9]{36}$/i.test(user.id))throw failure(checkError?.status);
   const verifiedAt=contact.channel==='email'?user.email_confirmed_at:user.phone_confirmed_at;
   const claimed=contact.channel==='email'?user.email:user.phone;
   let normalized;try{normalized=normalizeContact(contact.channel,contact.channel==='sms'&&claimed&&!claimed.startsWith('+')?'+'+claimed:claimed);}catch{throw new ApiError(401,'验证的账号与请求不匹配。');}
   if(!verifiedAt||normalized.destination!==contact.destination)throw new ApiError(401,'验证的账号与请求不匹配。');
   return {subject:user.id,verifiedAt};
  }
 };
}
