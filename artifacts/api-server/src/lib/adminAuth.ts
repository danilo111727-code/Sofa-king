import { clerkClient, getAuth } from "@clerk/express";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(req: any): Promise<boolean> {
  try {
    const { userId } = getAuth(req);
    if (!userId) return false;
    const user = await clerkClient.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    return emails.some((e) => ADMIN_EMAILS.includes(e));
  } catch {
    return false;
  }
}

export async function requireAdmin(req: any, res: any, next: any) {
  if (await isAdminRequest(req)) return next();
  res.status(403).json({ error: "Acesso restrito ao administrador" });
}
