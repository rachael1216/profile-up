import {downloadFile,deleteFile} from '../../../../lib/file-service';
import {jsonError} from '../../../../lib/request-validation';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){try{return await downloadFile((await params).id);}catch(e){return jsonError(e);}}
export async function DELETE(request:Request,{params}:Context){try{return await deleteFile(request,(await params).id);}catch(e){return jsonError(e);}}
