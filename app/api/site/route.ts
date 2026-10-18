import { siteStatus, unpublishSite, jsonError } from '../../../lib/profile-service';
export const dynamic = 'force-dynamic';
export async function GET() { try { return await siteStatus(); } catch (e) { return jsonError(e); } }
export async function POST(request: Request) { return Response.json({error:'请导入旧云端草稿，再从当前资料发布主页。'},{status:410}); }
export async function DELETE(request: Request) { try { return await unpublishSite(request); } catch (e) { return jsonError(e); } }
