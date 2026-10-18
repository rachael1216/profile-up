import {listProfiles,createProfile} from '../../../lib/workspace-service';
import {jsonError} from '../../../lib/request-validation';
export const dynamic='force-dynamic';
export async function GET(){try{return await listProfiles();}catch(e){return jsonError(e);}}
export async function POST(request:Request){try{return await createProfile(request);}catch(e){return jsonError(e);}}
