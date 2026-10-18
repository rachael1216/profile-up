import {readProfile,saveProfile} from '../../../../lib/workspace-service';
import {jsonError} from '../../../../lib/request-validation';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){try{return await readProfile((await params).id);}catch(e){return jsonError(e);}}
export async function PUT(request:Request,{params}:Context){try{return await saveProfile(request,(await params).id);}catch(e){return jsonError(e);}}
