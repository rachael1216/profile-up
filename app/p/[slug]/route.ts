import { database, jsonError } from '../../../lib/profile-service';
import { parseBackup } from '../../../src/lib/model';
import { renderWebsite } from '../../../src/lib/render';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try { const { slug } = await params; const row = await database().prepare('SELECT document_json FROM published_sites WHERE slug = ? AND published = 1').bind(slug).first<{ document_json: string }>();
    if (!row) return new Response('该主页尚未发布，或已撤下。', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    return new Response(renderWebsite(parseBackup(JSON.parse(row.document_json)), '/fonts/'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' } });
  } catch (e) { return jsonError(e); }
}
