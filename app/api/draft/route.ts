import { readDraft, saveDraft, jsonError } from '../../../lib/profile-service';
export const dynamic = 'force-dynamic';
export async function GET() { try { return await readDraft(); } catch (e) { return jsonError(e); } }
export async function PUT(request: Request) { try { return await saveDraft(request); } catch (e) { return jsonError(e); } }
