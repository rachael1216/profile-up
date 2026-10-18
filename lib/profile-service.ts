import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { parseBackup, projectProfile, localized } from '../src/lib/model';
import { readJSON, ApiError, jsonError, checkOrigin } from './request-validation';
export { ApiError, jsonError };
export function database() { if (!env.DB) throw new ApiError(503, '云端数据库尚未连接。'); return env.DB; }
export async function identity() { const user = await getChatGPTUser(); if (!user) throw new ApiError(401, '请先登录，再保存或发布。'); return user.userId; }
type Draft = { document_json: string; revision: number; updated_at: string };
export async function getDraft(userId: string) { return database().prepare('SELECT document_json, revision, updated_at FROM drafts WHERE user_id = ?').bind(userId).first<Draft>(); }
export async function readDraft() { const row = await getDraft(await identity()); return Response.json({ profile: row ? JSON.parse(row.document_json) : null, revision: row?.revision ?? 0, updatedAt: row?.updated_at ?? null }, { headers: { 'Cache-Control': 'private, no-store' } }); }
export async function saveDraft(request: Request) {
  checkOrigin(request); const userId = await identity(); const body = await readJSON(request);
  if (!Number.isInteger(body.revision) || Number(body.revision) < 0) throw new ApiError(400, '草稿版本无效。');
  let profile; try { profile = parseBackup(body.profile); } catch { throw new ApiError(400, '资料字段或版本不兼容。'); }
  const updatedAt = new Date().toISOString();
  const result = await database().prepare('INSERT INTO drafts (user_id, document_json, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO UPDATE SET document_json = excluded.document_json, revision = drafts.revision + 1, updated_at = excluded.updated_at WHERE drafts.revision = ?').bind(userId, JSON.stringify(profile), updatedAt, body.revision).run();
  if (!result.meta.changes) throw new ApiError(409, '云端草稿已在其他窗口更新。请先载入云端版本，或下载本机备份。');
  return Response.json({ revision: Number(body.revision) + 1, updatedAt });
}
export async function siteStatus() {
  const row = await database().prepare('SELECT slug, revision, published, updated_at FROM published_sites WHERE user_id = ?').bind(await identity()).first<{ slug: string; revision: number; published: number; updated_at: string }>();
  return Response.json(row ? { slug: row.slug, url: `/p/${row.slug}`, revision: row.revision, published: Boolean(row.published), updatedAt: row.updated_at } : null, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function publishSite(request: Request) {
  checkOrigin(request); const userId = await identity(); const body = await readJSON(request); const row = await getDraft(userId);
  if (!row || body.revision !== row.revision) throw new ApiError(409, '请先保存当前资料，再发布。');
  const profile = projectProfile(parseBackup(JSON.parse(row.document_json)), 'website');
  if (!localized(profile.basics.name, profile.settings.language).trim()) throw new ApiError(400, '请先填写姓名。');
  const slug = profile.settings.slug, updatedAt = new Date().toISOString();
  try { await database().prepare('INSERT INTO published_sites (slug, user_id, document_json, revision, published, updated_at) VALUES (?, ?, ?, ?, 1, ?) ON CONFLICT(user_id) DO UPDATE SET slug = excluded.slug, document_json = excluded.document_json, revision = excluded.revision, published = 1, updated_at = excluded.updated_at').bind(slug, userId, JSON.stringify(profile), row.revision, updatedAt).run(); }
  catch (error) { if (String(error).includes('UNIQUE')) throw new ApiError(409, '这个网址名称已被使用，请在网站设置中更换。'); throw error; }
  return Response.json({ slug, url: `/p/${slug}`, revision: row.revision, published: true, updatedAt });
}
export async function unpublishSite(request: Request) { checkOrigin(request); const userId = await identity(); await database().prepare('UPDATE published_sites SET published = 0 WHERE user_id = ?').bind(userId).run(); return Response.json({ published: false }); }
