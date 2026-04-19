import { clerkClient, getAuth, verifyToken } from "@clerk/express";

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  async function isAdminByUserId(userId: string): Promise<boolean> {
    const user = await clerkClient.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    return emails.some((e) => ADMIN_EMAILS.includes(e));
  }

  export async function isAdminRequest(req: any): Promise<boolean> {
    try {
      // Approach 1: clerkMiddleware already processed the request
      const { userId } = getAuth(req);
      if (userId) return isAdminByUserId(userId);

      // Approach 2: manual Bearer token verification
      const authHeader = req.headers["authorization"] as string | undefined;
      if (authHeader?.startsWith("Bearer ")) {
        const rawToken = authHeader.slice(7);
        const payload = await verifyToken(rawToken, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        if (payload?.sub) return isAdminByUserId(payload.sub);
      }

      return false;
    } catch {
      return false;
    }
  }

  export async function getAdminInfo(req: any): Promise<{ userId: string | null; signedIn: boolean; isAdmin: boolean; email?: string; method?: string }> {
    try {
      // Approach 1: clerkMiddleware
      const { userId } = getAuth(req);
      if (userId) {
        const isAdmin = await isAdminByUserId(userId);
        const user = await clerkClient.users.getUser(userId);
        return { userId, signedIn: true, isAdmin, email: user.emailAddresses[0]?.emailAddress, method: "middleware" };
      }

      // Approach 2: manual JWT
      const authHeader = req.headers["authorization"] as string | undefined;
      if (!authHeader) return { userId: null, signedIn: false, isAdmin: false };

      if (authHeader.startsWith("Bearer ")) {
        const rawToken = authHeader.slice(7);
        const payload = await verifyToken(rawToken, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        if (payload?.sub) {
          const isAdmin = await isAdminByUserId(payload.sub);
          const user = await clerkClient.users.getUser(payload.sub);
          return { userId: payload.sub, signedIn: true, isAdmin, email: user.emailAddresses[0]?.emailAddress, method: "manual-jwt" };
        }
      }

      return { userId: null, signedIn: false, isAdmin: false };
    } catch (e: any) {
      return { userId: null, signedIn: false, isAdmin: false };
    }
  }

  export async function requireAdmin(req: any, res: any, next: any) {
    if (await isAdminRequest(req)) return next();
    res.status(403).json({ error: "Acesso restrito ao administrador" });
  }
  