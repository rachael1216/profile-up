import {test,expect} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import {signInFixture} from './auth-fixtures';
const origin='http://127.0.0.1:5173';
test('public demo has honest OTP availability and a neutral interface',async({page,request})=>{
 const config=await request.get('/api/auth/config');expect(config.status()).toBe(200);expect(await config.json()).toMatchObject({email:false,sms:false,demo:true});
 await page.goto('/');await expect(page.getByRole('button',{name:/ChatGPT/})).toHaveCount(0);await expect(page.getByRole('link',{name:'邮箱 / 手机号注册或登录',exact:true})).toBeVisible();
 expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
 await page.getByRole('link',{name:'邮箱 / 手机号注册或登录',exact:true}).click();await expect(page.getByRole('heading',{name:'注册或登录',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'获取验证码',exact:true})).toBeDisabled();
 await expect(page.getByText('邮箱验证码暂未开通。',{exact:false})).toBeVisible();await page.getByRole('button',{name:'短信验证码',exact:true}).click();await expect(page.getByLabel('手机号（含国家区号）')).toBeVisible();
 await expect(page.getByText('短信验证码暂未开通。',{exact:false})).toBeVisible();await page.getByRole('button',{name:'English',exact:true}).click();await expect(page.getByRole('heading',{name:'Register or sign in',exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/account-page.png',fullPage:true});
 const noService=await request.post('/api/auth/send',{headers:{Origin:origin},data:{channel:'sms',contact:'+8613800000000'}});expect(noService.status()).toBe(503);expect(noService.headers()['set-cookie']).toBeUndefined();
 expect((await request.post('/api/auth/send',{headers:{Origin:'https://other.test'},data:{channel:'email',contact:'person@example.org'}})).status()).toBe(403);
 expect((await request.get('/api/profiles',{headers:{Cookie:'__sites_local_auth=1'}})).status()).toBe(401);
 expect((await request.post('/api/auth/verify',{headers:{Origin:origin},data:{challengeId:'none',code:'000000'}})).status()).toBe(400);
 expect((await request.get('/api/profiles',{headers:{Cookie:'profileup-session=forged; __sites_local_auth=1'}})).status()).toBe(401);
});
test('native session reads are isolated and signout revokes the cookie',async({browser})=>{
 // Insert only session fixtures in local D1; production has no fake verification path.
 const signed=await browser.newContext(),{token}=await signInFixture(signed);
 expect((await signed.request.get('/api/profiles')).status()).toBe(200);expect(await (await signed.request.get('/api/profiles')).json()).toEqual([]);
 const page=await signed.newPage();await page.goto('/');await expect(page.getByRole('button',{name:'新建资料',exact:true})).toBeVisible();
 const invalid=await browser.newContext();await invalid.addCookies([{name:'profileup-session',value:randomBytes(32).toString('hex'),url:origin}]);expect((await invalid.request.get('/api/profiles')).status()).toBe(401);await invalid.close();
 const result=await signed.request.post('/api/auth/signout',{headers:{Origin:origin}});expect(result.status()).toBe(200);expect((await signed.request.get('/api/profiles')).status()).toBe(401);
 await signed.addCookies([{name:'profileup-session',value:token,url:origin}]);expect((await signed.request.get('/api/profiles')).status()).toBe(401);await signed.close();
 const expired=await browser.newContext();await signInFixture(expired,-1);expect((await expired.request.get('/api/profiles')).status()).toBe(401);await expired.close();
});
