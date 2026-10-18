import { siteStatus, publishSite, unpublishSite, jsonError } from '../../../lib/profile-service';
export const dynamic = 'force-dynamic';
export async function GET() { try { return await siteStatus(); } catch (e) { return jsonError(e); } }
export async function POST(request: Request) { try { return await publishSite(request); } catch (e) { return jsonError(e); } }
export async function DELETE(request: Request) { try { return await unpublishSite(request); } catch (e) { return jsonError(e); } }
