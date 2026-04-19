import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { clerkClient, getAuth } from "@clerk/express";
import { requireAdmin, isAdminRequest } from "../lib/adminAuth.js";
import * as events from "../lib/eventStore.js";
import * as productStore from "../lib/productStore.js";
import { ObjectStorageService } from "../lib/objectStorage.js";
import { objectStorageClient } from "../lib/objectStorage.js";

const router = Router();
router.get("/admin/debug", async (req: any, res) => {
    try {
      const auth = getAuth(req);
      const hasAuthHeader = !!req.headers["authorization"];
      const authHeaderPrefix = req.headers["authorization"]?.substring(0, 20) ?? null;
      res.json({
        userId: auth.userId ?? null,
        sessionId: auth.sessionId ?? null,
        hasAuthHeader,
        authHeaderPrefix,
        clerkMiddlewareActive: true,
      });
    } catch (e: any) {
      res.json({ error: e.message, clerkMiddlewareActive: false });
    }
  });

  router.get("/admin/me", async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) { res.json({ isAdmin: false, signedIn: false }); return; }
      const isAdmin = await isAdminRequest(req);
      const user = await clerkClient.users.getUser(userId);
      const email = user.emailAddresses[0]?.emailAddress;
      res.json({ isAdmin, signedIn: true, email });
    } catch {
      res.json({ isAdmin: false, signedIn: false });
    }
  });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const storage = new ObjectStorageService();

function useObjectStorage(): boolean {
  return !!process.env.PRIVATE_OBJECT_DIR;
}

function useGitHubStorage(): boolean {
  return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_FRONTEND_REPO);
}

function getLocalUploadsDir(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(__dirname, "..", "..", "sofa-king", "dist", "public", "uploads"),
    join(process.cwd(), "artifacts", "sofa-king", "dist", "public", "uploads"),
    join(process.cwd(), "uploads"),
  ];
  for (const c of candidates) {
    try { mkdirSync(c, { recursive: true }); return c; } catch { continue; }
  }
  return join(process.cwd(), "uploads");
}

async function uploadToGitHub(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType === "image/png" ? ".png"
    : mimeType === "image/webp" ? ".webp"
    : mimeType === "image/gif" ? ".gif"
    : ".jpg";
  const fileName = `${randomUUID()}${ext}`;
  const token = process.env.GITHUB_TOKEN!;
  const repo = process.env.GITHUB_FRONTEND_REPO!;
  const filePath = `public/images/uploads/${fileName}`;
  const content = buffer.toString("base64");

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "sofa-king-backend",
    },
    body: JSON.stringify({
      message: `upload: add product image ${fileName}`,
      content,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub upload failed (${response.status}): ${err}`);
  }

  // Return GitHub raw URL — available in seconds without waiting for Vercel redeploy
  return `https://raw.githubusercontent.com/${repo}/main/${filePath}`;
}

router.get("/admin/stats", requireAdmin, (_req, res) => {
  res.json(events.getStats());
});

router.get("/admin/known-sizes", requireAdmin, (_req, res) => {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const p of productStore.getAll()) {
    for (const s of p.sizes || []) {
      const lbl = (s.label || "").trim();
      if (lbl && !set.has(lbl)) { set.add(lbl); seen.push(lbl); }
    }
  }
  res.json(seen);
});

router.get("/admin/whatsapp-events", requireAdmin, (_req, res) => {
  res.json(events.getWhatsappEvents(200));
});

router.get("/admin/clients", requireAdmin, async (_req, res) => {
  try {
    const list = await clerkClient.users.getUserList({ limit: 200, orderBy: "-created_at" });
    const users = list.data.map((u: any) => ({
      id: u.id,
      email: u.emailAddresses?.[0]?.emailAddress || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      imageUrl: u.imageUrl || "",
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
    }));
    res.json({ totalCount: list.totalCount, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erro ao buscar clientes" });
  }
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

router.post("/admin/upload-image", requireAdmin, upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo não enviado" });
      return;
    }
    if (!ALLOWED_MIME.has(req.file.mimetype)) {
      res.status(400).json({ error: "Formato inválido. Use JPG, PNG, WEBP ou GIF." });
      return;
    }

    if (useObjectStorage()) {
      const privateDir = storage.getPrivateObjectDir();
      const trimmed = privateDir.startsWith("/") ? privateDir.slice(1) : privateDir;
      const [bucketName, ...rest] = trimmed.split("/");
      const objectId = randomUUID();
      const objectName = `${rest.join("/")}/uploads/${objectId}`;
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        resumable: false,
      });
      const objectPath = `/objects/uploads/${objectId}`;
      const url = `/api/storage${objectPath}`;
      res.json({ url, objectPath });
    } else if (useGitHubStorage()) {
      const url = await uploadToGitHub(req.file.buffer, req.file.mimetype);
      res.json({ url, objectPath: url });
    } else {
      const ext = req.file.mimetype === "image/png" ? ".png"
        : req.file.mimetype === "image/webp" ? ".webp"
        : req.file.mimetype === "image/gif" ? ".gif"
        : ".jpg";
      const objectId = randomUUID();
      const fileName = `${objectId}${ext}`;
      const uploadsDir = getLocalUploadsDir();
      writeFileSync(join(uploadsDir, fileName), req.file.buffer);
      const url = `/uploads/${fileName}`;
      res.json({ url, objectPath: url });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erro no upload" });
  }
});

  // One-time migration: move sofá-camas from categoria='cama' to 'sofa-cama'ort { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { clerkClient, getAuth } from "@clerk/express";
import { dbQuery } from "../lib/db.js";
import { requireAdmin, isAdminRequest } from "../lib/adminAuth.js";
import * as events from "../lib/eventStore.js";
import * as productStore from "../lib/productStore.js";
import { ObjectStorageService } from "../lib/objectStorage.js";
import { objectStorageClient } from "../lib/objectStorage.js";

const router = Router();
router.get("/admin/debug", async (req: any, res) => {
    try {
      const auth = getAuth(req);
      const hasAuthHeader = !!req.headers["authorization"];
      const authHeaderPrefix = req.headers["authorization"]?.substring(0, 20) ?? null;
      res.json({
        userId: auth.userId ?? null,
        sessionId: auth.sessionId ?? null,
        hasAuthHeader,
        authHeaderPrefix,
        clerkMiddlewareActive: true,
      });
    } catch (e: any) {
      res.json({ error: e.message, clerkMiddlewareActive: false });
    }
  });

  router.get("/admin/me", async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) { res.json({ isAdmin: false, signedIn: false }); return; }
      const isAdmin = await isAdminRequest(req);
      const user = await clerkClient.users.getUser(userId);
      const email = user.emailAddresses[0]?.emailAddress;
      res.json({ isAdmin, signedIn: true, email });
    } catch {
      res.json({ isAdmin: false, signedIn: false });
    }
  });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const storage = new ObjectStorageService();

function useObjectStorage(): boolean {
  return !!process.env.PRIVATE_OBJECT_DIR;
}

function useGitHubStorage(): boolean {
  return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_FRONTEND_REPO);
}

function getLocalUploadsDir(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(__dirname, "..", "..", "sofa-king", "dist", "public", "uploads"),
    join(process.cwd(), "artifacts", "sofa-king", "dist", "public", "uploads"),
    join(process.cwd(), "uploads"),
  ];
  for (const c of candidates) {
    try { mkdirSync(c, { recursive: true }); return c; } catch { continue; }
  }
  return join(process.cwd(), "uploads");
}

async function uploadToGitHub(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType === "image/png" ? ".png"
    : mimeType === "image/webp" ? ".webp"
    : mimeType === "image/gif" ? ".gif"
    : ".jpg";
  const fileName = `${randomUUID()}${ext}`;
  const token = process.env.GITHUB_TOKEN!;
  const repo = process.env.GITHUB_FRONTEND_REPO!;
  const filePath = `public/images/uploads/${fileName}`;
  const content = buffer.toString("base64");

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "sofa-king-backend",
    },
    body: JSON.stringify({
      message: `upload: add product image ${fileName}`,
      content,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub upload failed (${response.status}): ${err}`);
  }

  // Return GitHub raw URL — available in seconds without waiting for Vercel redeploy
  return `https://raw.githubusercontent.com/${repo}/main/${filePath}`;
}

router.get("/admin/stats", requireAdmin, (_req, res) => {
  res.json(events.getStats());
});

router.get("/admin/known-sizes", requireAdmin, (_req, res) => {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const p of productStore.getAll()) {
    for (const s of p.sizes || []) {
      const lbl = (s.label || "").trim();
      if (lbl && !set.has(lbl)) { set.add(lbl); seen.push(lbl); }
    }
  }
  res.json(seen);
});

router.get("/admin/whatsapp-events", requireAdmin, (_req, res) => {
  res.json(events.getWhatsappEvents(200));
});

router.get("/admin/clients", requireAdmin, async (_req, res) => {
  try {
    const list = await clerkClient.users.getUserList({ limit: 200, orderBy: "-created_at" });
    const users = list.data.map((u: any) => ({
      id: u.id,
      email: u.emailAddresses?.[0]?.emailAddress || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      imageUrl: u.imageUrl || "",
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
    }));
    res.json({ totalCount: list.totalCount, users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erro ao buscar clientes" });
  }
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

router.post("/admin/upload-image", requireAdmin, upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo não enviado" });
      return;
    }
    if (!ALLOWED_MIME.has(req.file.mimetype)) {
      res.status(400).json({ error: "Formato inválido. Use JPG, PNG, WEBP ou GIF." });
      return;
    }

    if (useObjectStorage()) {
      const privateDir = storage.getPrivateObjectDir();
      const trimmed = privateDir.startsWith("/") ? privateDir.slice(1) : privateDir;
      const [bucketName, ...rest] = trimmed.split("/");
      const objectId = randomUUID();
      const objectName = `${rest.join("/")}/uploads/${objectId}`;
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        resumable: false,
      });
      const objectPath = `/objects/uploads/${objectId}`;
      const url = `/api/storage${objectPath}`;
      res.json({ url, objectPath });
    } else if (useGitHubStorage()) {
      const url = await uploadToGitHub(req.file.buffer, req.file.mimetype);
      res.json({ url, objectPath: url });
    } else {
      const ext = req.file.mimetype === "image/png" ? ".png"
        : req.file.mimetype === "image/webp" ? ".webp"
        : req.file.mimetype === "image/gif" ? ".gif"
        : ".jpg";
      const objectId = randomUUID();
      const fileName = `${objectId}${ext}`;
      const uploadsDir = getLocalUploadsDir();
      writeFileSync(join(uploadsDir, fileName), req.file.buffer);
      const url = `/uploads/${fileName}`;
      res.json({ url, objectPath: url });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erro no upload" });
  }
});

  // One-time migration: move sofá-camas from categoria='cama' to 'sofa-cama'
router.post("/admin/migrate-categories", async (req: any, res) => {
    if (req.headers["x-migrate-secret"] !== "sofa-king-migrate-2025") {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    try {
      const all = productStore.getAll();
      const toMigrate = all.filter((p) => p.category === "cama");
      const updated: string[] = [];
      for (const p of toMigrate) {
        const result = productStore.update(p.id, { category: "sofa-cama" as any });
        if (result) updated.push(`${p.id} → sofa-cama`);
      }
      res.json({ total: all.length, migratedCount: updated.length, migrated: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  export default router;
