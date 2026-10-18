import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, checkOrigin, readJSON } from '../lib/request-validation';
import { renderWebsite } from '../src/lib/render';
import { demoProfile } from '../src/lib/model';

test('cloud mutations require the current origin', () => {
  assert.doesNotThrow(()=>checkOrigin(new Request('https://profile.test/api/draft',{headers:{Origin:'https://profile.test'}})));
  for(const origin of ['https://other.test','null','']) assert.throws(()=>checkOrigin(new Request('https://profile.test/api/draft',{headers:{Origin:origin}})), (e:unknown)=>e instanceof ApiError && e.status===403);
});
test('cloud submissions reject invalid JSON and oversized drafts', async () => {
  const request=(body:string)=>new Request('https://profile.test/api/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body});
  assert.deepEqual(await readJSON(request('{"revision":0}')),{revision:0});
  await assert.rejects(readJSON(request('{')), (e:unknown)=>e instanceof ApiError&&e.status===400);
  await assert.rejects(readJSON(request('"'+ 'x'.repeat(900001)+'"')), (e:unknown)=>e instanceof ApiError&&e.status===413);
});
test('published routes use absolute font paths while website archives remain portable', () => {
  assert.ok(renderWebsite(demoProfile,'/fonts/').includes("url('/fonts/TeXGyreTermes-Regular.otf')"));
  assert.ok(renderWebsite(demoProfile).includes("url('fonts/TeXGyreTermes-Regular.otf')"));
});
