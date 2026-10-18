import {env} from 'cloudflare:workers';
import {database,identity,ApiError} from './profile-service';
import {ownedProfile} from './workspace-service';
import {checkOrigin} from './request-validation';
export type StoredFile={id:string;profile_id:string;owner_id:string;object_key:string;name:string;category:string;size:number;created_at:string};
function bucket(){if(!env.BUCKET)throw new ApiError(503,'云端文件存储尚未连接。');return env.BUCKET;}
export async function listFiles(id:string){const owner=await identity();await ownedProfile(id,owner);const {results}=await database().prepare('SELECT id,name,category,size,created_at FROM profile_files WHERE profile_id=? AND owner_id=? ORDER BY created_at').bind(id,owner).all();return Response.json(results,{headers:{'Cache-Control':'private, no-store'}});}
export async function uploadFile(request:Request,id:string){
  checkOrigin(request);const owner=await identity();await ownedProfile(id,owner);const storage=bucket();
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/pdf') throw new ApiError(415,'目前支持 PDF 附件。');
  const name=new URL(request.url).searchParams.get('name')?.trim(),category=new URL(request.url).searchParams.get('category')??'other';
  if(!name || name.length>180 || !name.toLowerCase().endsWith('.pdf') || /[\r\n\x00-\x1f]/.test(name)) throw new ApiError(400,'请使用有效的 PDF 文件名（不超过 180 字）。');
  if(!['certificate','publication','lecture','other'].includes(category)) throw new ApiError(400,'附件类别无效。');
  const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'没有收到文件。');
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>10*1024*1024){await reader.cancel();throw new ApiError(413,'单个 PDF 不得超过 10 MB。');}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new ApiError(400,'文件内容不是有效的 PDF 格式。');
  const fileId=crypto.randomUUID(),key=`profiles/${id}/${fileId}.pdf`,now=new Date().toISOString();
  await storage.put(key,bytes,{httpMetadata:{contentType:'application/pdf'}});
  try{const result=await database().prepare('INSERT INTO profile_files(id,profile_id,owner_id,object_key,name,category,size,created_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM profile_files WHERE profile_id=?)<50 AND (SELECT COALESCE(SUM(size),0) FROM profile_files WHERE owner_id=?)+?<=104857600').bind(fileId,id,owner,key,name,category,size,now,id,owner,size).run();if(!result.meta.changes)throw new ApiError(409,'存储限额：每份资料 50 个附件，每个账号总计 100 MB。');}
  catch(e){await storage.delete(key);throw e;}
  return Response.json({id:fileId,name,category,size,created_at:now},{status:201});
}
async function storedFile(fileId:string,owner:string){const row=await database().prepare('SELECT * FROM profile_files WHERE id=? AND owner_id=?').bind(fileId,owner).first<StoredFile>();if(!row)throw new ApiError(404,'未找到附件。');return row;}
export async function fileResponse(row:StoredFile){const object=await bucket().get(row.object_key);if(!object)throw new ApiError(404,'未找到附件。');return new Response(object.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(row.name)}`,'Content-Length':String(row.size),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"sandbox; default-src 'none'"}});}
export async function downloadFile(id:string){return fileResponse(await storedFile(id,await identity()));}
export async function deleteFile(request:Request,id:string){checkOrigin(request);const row=await storedFile(id,await identity());await database().prepare('DELETE FROM profile_files WHERE id=? AND owner_id=?').bind(id,row.owner_id).run();await bucket().delete(row.object_key);return Response.json({deleted:true});}
export async function publicFile(slug:string,id:string){
 const site=await database().prepare('SELECT profile_id,owner_id,files_json FROM profile_sites WHERE slug=? AND published=1').bind(slug).first<{profile_id:string;owner_id:string;files_json:string}>();
 if(!site || !(JSON.parse(site.files_json) as {id:string}[]).some(f=>f.id===id))throw new ApiError(404,'未找到公开附件。');
 const row=await storedFile(id,site.owner_id);if(row.profile_id!==site.profile_id)throw new ApiError(404,'未找到公开附件。');return fileResponse(row);
}
