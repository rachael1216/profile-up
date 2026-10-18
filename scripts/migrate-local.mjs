import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const config='dist/server/wrangler.json';
if(!existsSync(config)) throw Error('请先运行 npm run build，再初始化本地数据库。');
const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8'));
const state='.wrangler/local-migrations.json';
const applied=existsSync(state)?JSON.parse(readFileSync(state,'utf8')):{};
for(const {tag} of journal.entries){
  const file=`drizzle/${tag}.sql`, hash=createHash('sha256').update(readFileSync(file)).digest('hex');
  if(applied[tag]) {if(applied[tag]!==hash)throw Error(`Applied migration was changed: ${tag}`);continue;}
  const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config',config,'--persist-to','.wrangler/state','--file',file],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
  applied[tag]=hash;mkdirSync('.wrangler',{recursive:true});writeFileSync(state,JSON.stringify(applied,null,2)+'\n');
}
console.log('Local D1 migrations are up to date.');
