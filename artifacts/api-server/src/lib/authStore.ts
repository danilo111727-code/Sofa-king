import { randomUUID } from "crypto";

const sessions = new Map<string, number>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function login(password: string): string | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return null;
  const token = randomUUID();
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function verify(token: string | undefined): boolean {
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp) return false;
  if (Date.now() > exp) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function logout(token: string): void {
  sessions.delete(token);
}
