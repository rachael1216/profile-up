import test from 'node:test';
import assert from 'node:assert/strict';
import legacy from '../src/lib/legacy-demo-v06.json';
import {demoProfile,parseBackup} from '../src/lib/model';
import {refreshAnonymousDemo} from '../src/lib/demo-migration';
test('stock demo content is replaced with anonymous placeholders while layout choices are retained',()=>{
 const old=parseBackup(legacy);old.settings.cvTemplate='clinical';old.settings.language='zh';
 const updated=refreshAnonymousDemo(old);
 assert.deepEqual(updated.basics,demoProfile.basics);assert.equal(updated.basics.aliases,'');assert.ok(updated.publications.every(p=>!p.authors));
 assert.equal(updated.settings.cvTemplate,'clinical');assert.equal(updated.settings.language,'zh');assert.equal(updated.settings.slug,'my-website');
});
test('an edited anonymous draft is preserved, including personal data and custom research interests',()=>{
 const edited=parseBackup(legacy);edited.basics.biography.zh='用户自己填写的简介';
 assert.equal(refreshAnonymousDemo(edited),edited);
 const renamed=parseBackup(legacy);renamed.basics.name.en='User supplied name';assert.equal(refreshAnonymousDemo(renamed),renamed);
});
