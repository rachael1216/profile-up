import {verifyOtp} from '../../../../lib/auth-service';
import {jsonError} from '../../../../lib/request-validation';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return await verifyOtp(request);}catch(e){return jsonError(e);}}
