import { test, expect } from '@playwright/test';
import { demoProfile } from '../../src/lib/model';
const origin='http://127.0.0.1:5173';
test('anonymous visitors cannot access drafts or forge a hosted identity', async ({request})=>{
  expect((await request.get('/api/draft')).status()).toBe(401);
  expect((await request.get('/api/draft',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'forged@example.org'}})).status()).toBe(401);
});
test('cloud drafts persist; publication filters private content and can be withdrawn', async ({page})=>{
  await page.goto('/signin-with-chatgpt?return_to=/');
  await expect(page.getByRole('button',{name:'保存到云端',exact:true})).toBeEnabled();
  const draft=structuredClone(demoProfile);draft.settings.slug='cloud-workflow-test';
  draft.basics.name.en='Cloud Workflow Example'; draft.basics.email='PRIVATE_EMAIL@example.edu';draft.basics.showEmail=false;
  draft.publications[0].title.en='PRIVATE_PUBLICATION';draft.publications[0].visible=false;
  const existing=await (await page.request.get('/api/draft')).json();
  const saved=await page.request.put('/api/draft',{headers:{Origin:origin},data:{profile:draft,revision:existing.revision}});expect(saved.status()).toBe(200);
  const revision=(await saved.json()).revision;
  const stale=await page.request.put('/api/draft',{headers:{Origin:origin},data:{profile:draft,revision:existing.revision}});expect(stale.status()).toBe(409);
  expect((await page.request.put('/api/draft',{headers:{Origin:'https://other.test'},data:{profile:draft,revision}})).status()).toBe(403);
  await page.reload();await page.getByRole('button',{name:'载入云端版本',exact:true}).click();
  await expect(page.frameLocator('iframe').getByRole('heading',{name:'Cloud Workflow Example',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'保存并发布主页',exact:true}).click();
  await expect(page.getByRole('link',{name:/查看已发布主页/})).toBeVisible();
  const published=await page.request.get('/p/cloud-workflow-test');expect(published.status()).toBe(200);
  const html=await published.text();expect(html).toContain('Cloud Workflow Example');expect(html).not.toContain('PRIVATE_EMAIL');expect(html).not.toContain('PRIVATE_PUBLICATION');expect(html).toContain("url('/fonts/");
  const cloud=await (await page.request.get('/api/draft')).json();expect(cloud.profile.basics.email).toBe('PRIVATE_EMAIL@example.edu');expect(cloud.profile.publications[0].title.en).toBe('PRIVATE_PUBLICATION');
  const viewer=await page.context().browser()!.newContext();const anonymous=await viewer.request.get('/p/cloud-workflow-test');expect(anonymous.status()).toBe(200);expect((await viewer.request.get('/api/draft')).status()).toBe(401);await viewer.close();
  await page.getByRole('button',{name:'撤下主页',exact:true}).click();await expect(page.getByRole('link',{name:/查看已发布主页/})).toHaveCount(0);expect((await page.request.get('/p/cloud-workflow-test')).status()).toBe(404);
  await page.screenshot({path:'test-results/cloud-workspace.png',fullPage:true});
});
