import { database, identity, ApiError } from './profile-service';
import { checkOrigin, readJSON } from './request-validation';
import { emptyProfile, parseBackup, projectProfile, localized } from '../src/lib/model';
export type ProfileRow = { id: string; owner_id: string; label: string; document_json: string; revision: number; updated_at: string };
export async function ownedProfile(id: string, owner: string): Promise<ProfileRow> {
  const row = await database().prepare('SELECT * FROM profiles WHERE id = ? AND owner_id = ?').bind(id, owner).first<ProfileRow>();
  if (!row) throw new ApiError(404, '未找到这份资料。'); return row;
}
export async function listProfiles() {
  const owner = await identity();
  const {results} = await database().prepare('SELECT id, label, revision, updated_at FROM profiles WHERE owner_id = ? ORDER BY created_at, id').bind(owner).all();
  return Response.json(results, {headers:{'Cache-Control':'private, no-store'}});
}
export async function createProfile(request: Request) {
  checkOrigin(request); const owner = await identity(), body = await readJSON(request);
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label || label.length > 100) throw new ApiError(400, '请填写 1–100 字的资料名称。');
  let profile = emptyProfile();
  if (body.copyId) profile = parseBackup(JSON.parse((await ownedProfile(String(body.copyId), owner)).document_json));
  else if (body.importLegacy === true) {
    const old = await database().prepare('SELECT document_json FROM drafts WHERE user_id = ?').bind(owner).first<{document_json:string}>();
    if (!old) throw new ApiError(404, '没有可导入的旧云端草稿。'); profile = parseBackup(JSON.parse(old.document_json));
  }
  const id = crypto.randomUUID(), now = new Date().toISOString();
  profile.settings.slug = `scholar-${id.slice(0,8)}`; profile.websiteFiles = [];
  await database().prepare('INSERT OR IGNORE INTO accounts(id, created_at) VALUES (?, ?)').bind(owner, now).run();
  const result = await database().prepare('INSERT INTO profiles(id,owner_id,label,document_json,revision,created_at,updated_at) SELECT ?,?,?,?,1,?,? WHERE (SELECT COUNT(*) FROM profiles WHERE owner_id = ?) < 30').bind(id,owner,label,JSON.stringify(profile),now,now,owner).run();
  if (!result.meta.changes) throw new ApiError(409, '每个账号目前最多保留 30 份资料。');
  return Response.json({id,label,profile,revision:1}, {status:201});
}
export async function readProfile(id:string) { const row=await ownedProfile(id,await identity()); return Response.json({id,label:row.label,profile:parseBackup(JSON.parse(row.document_json)),revision:row.revision}, {headers:{'Cache-Control':'private, no-store'}}); }
export async function saveProfile(request:Request,id:string) {
  checkOrigin(request); const owner=await identity(); await ownedProfile(id,owner); const body=await readJSON(request);
  if (!Number.isInteger(body.revision) || Number(body.revision)<1) throw new ApiError(400,'草稿版本无效。');
  let profile; try {profile=parseBackup(body.profile);} catch {throw new ApiError(400,'资料字段或版本不兼容。');}
  const label=typeof body.label==='string'?body.label.trim():undefined;
  if(label!==undefined && (!label || label.length>100)) throw new ApiError(400,'资料名称需为 1–100 字。');
  const result=await database().prepare('UPDATE profiles SET document_json=?,revision=revision+1,updated_at=?,label=COALESCE(?,label) WHERE id=? AND owner_id=? AND revision=?').bind(JSON.stringify(profile),new Date().toISOString(),label??null,id,owner,body.revision).run();
  if(!result.meta.changes) throw new ApiError(409,'云端草稿已更新，请先载入云端版本。');
  return Response.json({revision:Number(body.revision)+1});
}
export async function profileSiteStatus(id:string) {
  const owner=await identity();await ownedProfile(id,owner);
  const row=await database().prepare('SELECT slug, revision, published FROM profile_sites WHERE profile_id=? AND owner_id=?').bind(id,owner).first<{slug:string;revision:number;published:number}>();
  return Response.json(row?{...row,published:!!row.published,url:`/p/${row.slug}`}:null,{headers:{'Cache-Control':'private, no-store'}});
}
export async function publishProfile(request:Request,id:string) {
  checkOrigin(request);const owner=await identity(),row=await ownedProfile(id,owner),body=await readJSON(request);
  if(body.revision!==row.revision) throw new ApiError(409,'请先保存当前资料，再发布。');
  const profile=projectProfile(parseBackup(JSON.parse(row.document_json)),'website');
  if(!localized(profile.basics.name,profile.settings.language).trim()) throw new ApiError(400,'请先填写姓名。');
  const {results}=await database().prepare('SELECT id,name,category FROM profile_files WHERE profile_id=? AND owner_id=?').bind(id,owner).all<{id:string;name:string;category:string}>();
  const files=results.filter(f=>profile.websiteFiles.includes(f.id));
  if(files.length!==new Set(profile.websiteFiles).size) throw new ApiError(400,'选中的附件已删除或不属于当前资料，请重新选择。');
  const old=await database().prepare('SELECT user_id FROM published_sites WHERE slug=?').bind(profile.settings.slug).first<{user_id:string}>();
  if(old && old.user_id!==owner) throw new ApiError(409,'这个网址名称已被使用。');
  try {
    await database().batch([
      database().prepare('UPDATE published_sites SET published=0 WHERE slug=? AND user_id=?').bind(profile.settings.slug,owner),
      database().prepare('INSERT INTO profile_sites(profile_id,owner_id,slug,document_json,files_json,revision,published,updated_at) VALUES (?,?,?,?,?,?,1,?) ON CONFLICT(profile_id) DO UPDATE SET slug=excluded.slug,document_json=excluded.document_json,files_json=excluded.files_json,revision=excluded.revision,published=1,updated_at=excluded.updated_at').bind(id,owner,profile.settings.slug,JSON.stringify(profile),JSON.stringify(files),row.revision,new Date().toISOString())
    ]);
  } catch(e) {if(String(e).includes('UNIQUE')) throw new ApiError(409,'这个网址名称已被使用，请更换。');throw e;}
  return Response.json({url:`/p/${profile.settings.slug}`,revision:row.revision,published:true});
}
export async function withdrawProfile(request:Request,id:string) {checkOrigin(request);const owner=await identity();await ownedProfile(id,owner);await database().prepare('UPDATE profile_sites SET published=0 WHERE profile_id=? AND owner_id=?').bind(id,owner).run();return Response.json({published:false});}
