import {signOut} from '../../../../lib/auth-service';
import {jsonError} from '../../../../lib/request-validation';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return await signOut(request);}catch(e){return jsonError(e);}}
