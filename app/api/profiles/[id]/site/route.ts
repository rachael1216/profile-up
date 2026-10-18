import {profileSiteStatus,publishProfile,withdrawProfile} from '../../../../../lib/workspace-service';
import {jsonError} from '../../../../../lib/request-validation';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){try{return await profileSiteStatus((await params).id);}catch(e){return jsonError(e);}}
export async function POST(request:Request,{params}:Context){try{return await publishProfile(request,(await params).id);}catch(e){return jsonError(e);}}
export async function DELETE(request:Request,{params}:Context){try{return await withdrawProfile(request,(await params).id);}catch(e){return jsonError(e);}}
