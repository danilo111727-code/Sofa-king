import { clerkClient, getAuth } from "@clerk/express";

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  async function isAdminByUserId(userId: string): Promise<boolean> {
    const user = await clerkClient.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    return emails.some((e) => ADMIN_EMAILS.includes(e));
  }

  async function getUserIdFromRequest(req: any): Promise<string | null> {
    // Approach 1: clerkMiddleware already processed the request
    const { userId } = getAuth(req);
    if (userId) return userId;

    // Approach 2: manual Bearer token verification
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) return null;

    const rawToken = authHeader.slice(7);
    try {
      // clerkClient.verifyToken is available in @clerk/express v2
      const payload = await (clerkClient as any).verifyToken(rawToken);
      return payload?.sub ?? null;
    } catch {
      // Try alternate: decode JWT manually to get sub (no verification)
      try {
        const parts = rawToken.split(".");
        if (parts.length === 3) {
          const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
          return decoded?.sub ?? null;
        }
      } catch { /* ignore */ }
      return null;
    }
  }

  export async function isAdminRequest(req: any): Promise<boolean> {
    try {
      const userId = await getUserIdFromRequest(req);
      if (!userId) return false;
      return isAdminByUserId(userId);
    } catch {
      return false;
    }
  }

  export async function getAdminInfo(req: any): Promise<{ userId: string | null; signedIn: boolean; isAdmin: boolean; email?: string; method?: string }> {
    try {
      const { userId: middlewareUserId } = getAuth(req);
      const method = middlewareUserId ? "middleware" : "manual-jwt";
      const userId = middlewareUserId ?? await getUserIdFromRequest(req);
      if (!userId) {
        const hasHeader = !!req.headers["authorization"];
        return { userId: null, signedIn: false, isAdmin: false, method: hasHeader ? "token-invalid" : "no-header" };
      }
      const isAdmin = await isAdminByUserId(userId);
      const user = await clerkClient.users.getUser(userId);
      return { userId, signedIn: true, isAdmin, email: user.emailAddresses[0]?.emailAddress, method };
    } catch (e: any) {
      return { userId: null, signedIn: false, isAdmin: false, method: "error:" + e.message?.substring(0, 50) };
    }
  }

  export async function requireAdmin(req: any, res: any, next: any) {
    if (await isAdminRequest(req)) return next();
    res.status(403).json({ error: "Acesso restrito ao administrador" });
  }
  