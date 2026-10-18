import Studio from './studio';
import { getAppUser } from '../lib/auth-service';
export const dynamic = 'force-dynamic';
export default async function Page() { const user = await getAppUser(); return <Studio account={user ? user : null} />; }
