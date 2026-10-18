import {passwordAccount} from '../../../../lib/auth-service';
import {jsonError} from '../../../../lib/request-validation';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return await passwordAccount(request,'register');}catch(e){return jsonError(e);}}
