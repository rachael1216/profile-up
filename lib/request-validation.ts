export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function checkOrigin(request: Request) { if (request.headers.get('Origin') !== new URL(request.url).origin) throw new ApiError(403, '请求来源不匹配，请从工作室页面操作。'); }
export async function readJSON(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new ApiError(415, '请使用 JSON 格式提交资料。');
  const reader = request.body?.getReader(); if (!reader) throw new ApiError(400, '没有收到资料。');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const {value, done} = await reader.read(); if (done) break; length += value.length; if (length > 900000) { await reader.cancel(); throw new ApiError(413, '资料超过云端 900 KB 限制，请减少照片或内容后重试。'); } chunks.push(value); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const body = JSON.parse(new TextDecoder().decode(bytes)); if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error(); return body; } catch { throw new ApiError(400, 'JSON 格式不正确。'); }
}
export function jsonError(error: unknown) { if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status }); console.error('Profile Up server error', error); return Response.json({ error: '云端操作失败，请稍后重试。' }, { status: 500 }); }
