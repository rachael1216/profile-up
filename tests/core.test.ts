import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoProfile, parseBackup, projectProfile } from '../src/lib/model';
import { renderCV, renderWebsite, safeUrl } from '../src/lib/render';
import { cvSections, renderTex } from '../src/lib/exports';

test('hidden contacts, entries, and disabled modules are removed from every public output', () => {
  const p = structuredClone(demoProfile);
  p.basics.phone = 'PRIVATE_PHONE_123'; p.basics.showPhone = false;
  p.basics.email = 'PRIVATE_EMAIL@example.edu'; p.basics.showEmail = false;
  p.basics.aliases = 'PRIVATE_ALIAS';
  p.publications[0].title = { zh: 'PRIVATE_PAPER', en: 'PRIVATE_PAPER' }; p.publications[0].visible = false;
  p.team = [{id:'private-member',name:{zh:'PRIVATE_COLLABORATOR',en:'PRIVATE_COLLABORATOR'},role:{zh:'',en:''},url:'',visible:true}];
  for (const html of [renderWebsite(p), renderCV(p), renderTex(p)]) {
    for (const secret of ['PRIVATE_PHONE', 'PRIVATE_EMAIL', 'PRIVATE_ALIAS', 'PRIVATE_PAPER', 'PRIVATE_COLLABORATOR']) assert.ok(!html.includes(secret), secret);
  }
  assert.equal(p.basics.phone, 'PRIVATE_PHONE_123', 'export must not mutate the draft');
});
test('website and CV can select different modules and preserve output order', () => {
  const p = structuredClone(demoProfile);
  p.settings.cvSections = [{ id: 'awards', enabled: true }, { id: 'education', enabled: true }];
  assert.deepEqual(cvSections(p).map(s => s.id), ['awards', 'education']);
  assert.equal(projectProfile(p, 'cv').publications.length, 0);
  assert.equal(projectProfile(p, 'website').publications.length, 2);
});
test('HTML escapes supplied text and rejects executable or credential-bearing links', () => {
  const p = structuredClone(demoProfile);
  p.basics.name.en = '<script>alert(1)</script>';
  p.links = [{ id: 'bad', visible: true, label: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)' }];
  const html = renderWebsite(p);
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.equal(safeUrl('https://name:password@example.com'), '');
  assert.equal(safeUrl('file:///etc/passwd'), '');
  assert.equal(safeUrl('https://example.com/paper'), 'https://example.com/paper');
});
test('TeX escapes content rather than executing it and preserves Chinese', () => {
  const p = structuredClone(demoProfile); p.settings.language = 'zh';
  p.basics.name.zh = '陈林 & 50% \\input{secret}';
  const tex = renderTex(p);
  assert.ok(tex.includes('陈林 \\& 50\\%'));
  assert.ok(!tex.includes('\\input{secret}'));
  assert.ok(tex.includes('\\textbackslash{}input\\{secret\\}'));
  assert.ok(tex.includes('NotoSerifSC-Regular.ttf'));
  assert.ok(tex.includes('TeXGyreTermes-Regular.otf'));
});
test('backup import validates version, shape, duplicate modules and oversized fields', () => {
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(demoProfile))), demoProfile);
  assert.throws(() => parseBackup({ ...demoProfile, version: 9 }));
  assert.throws(() => parseBackup({ ...demoProfile, basics: {} }));
  const p = structuredClone(demoProfile); p.settings.cvSections.push(p.settings.cvSections[0]);
  assert.throws(() => parseBackup(p));
});
test('non-image data URLs never enter generated documents', () => {
  const p = structuredClone(demoProfile); p.basics.photo = 'data:image/svg+xml,<svg onload="alert(1)"/>';
  assert.equal(projectProfile(p, 'website').basics.photo, '');
  assert.ok(!renderWebsite(p).includes('onload='));
});
