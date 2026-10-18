import {authConfiguration} from '../../../../lib/auth-service';
import {jsonError} from '../../../../lib/request-validation';
export const dynamic='force-dynamic';
export async function GET(){try{return await authConfiguration();}catch(e){return jsonError(e);}}
