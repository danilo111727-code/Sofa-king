import {clerkClient,getAuth} from '@clerk/express';
import type {Request,Response,NextFunction} from 'express';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export async function getAdminInfo(req: Request): Promise<{userId:string|null;signedIn:boolean;isAdmin:boolean;email?:string;method?:string}> {
  try {
    // getAuth trusts only the result of Clerk's signature-verifying middleware.
    // Never decode Bearer payloads as a fallback when verification fails.
    const {userId} = getAuth(req);
    if (!userId) return {userId:null,signedIn:false,isAdmin:false};
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses.find(e => e.verification?.status === 'verified' && ADMIN_EMAILS.includes(e.emailAddress.toLowerCase()))?.emailAddress;
    return {userId,signedIn:true,isAdmin:!!email,email,method:'middleware'};
  } catch {
    return {userId:null,signedIn:false,isAdmin:false};
  }
}
export async function isAdminRequest(req: Request): Promise<boolean> {
  return (await getAdminInfo(req)).isAdmin;
}
export async function requireAdmin(req: Request,res: Response,next: NextFunction) {
  const info = await getAdminInfo(req);
  if (info.isAdmin) { next(); return; }
  res.status(info.signedIn ? 403 : 401).json({error:info.signedIn ? 'Acesso restrito ao administrador' : 'Não autenticado'});
}
