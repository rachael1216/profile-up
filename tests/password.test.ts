import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,validPassword,dummyPasswordHash} from '../lib/password';
test('password hashes use independent salts and reject incorrect or malformed credentials',async()=>{
 const password='Research archive 2026! 中文';
 const first=await hashPassword(password),second=await hashPassword(password);
 assert.notEqual(first,second);assert.ok(!first.includes(password));
 assert.equal(await verifyPassword(password,first),true);
 assert.equal(await verifyPassword(password+'x',first),false);
 assert.equal(await verifyPassword(password,dummyPasswordHash),false);
 assert.equal(await verifyPassword(password,'plain-text'),false);
});
test('password policy preserves Unicode, spaces and long input without truncation',()=>{
 const value='  Twelve chars 中文🙂  ';assert.equal(validPassword(value),value);
 for(const invalid of [null,123,'short','a'.repeat(129)])assert.throws(()=>validPassword(invalid));
 assert.equal(validPassword('a'.repeat(128)).length,128);
});
