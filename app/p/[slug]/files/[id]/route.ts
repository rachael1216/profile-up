import {publicFile} from '../../../../../lib/file-service';
import {jsonError} from '../../../../../lib/request-validation';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string;id:string}>}){try{const {slug,id}=await params;return await publicFile(slug,id);}catch(e){return jsonError(e);}}
