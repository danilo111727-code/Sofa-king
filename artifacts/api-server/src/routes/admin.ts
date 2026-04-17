import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";
import { clerkClient } from "@clerk/express";
import { requireAdmin } from "../lib/adminAuth.js";
import * as events from "../lib/eventStore.js";
import * as productStore from "../lib/productStore.js";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage.js";
import { objectStorageClient } from "../lib/objectStorage.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const storage = new ObjectStorageService();

function useObjectStorage(): boolean {
  return !!process.env.PRIVATE_OBJECT_DIR;
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

router.get("/admin/stats", requireAdmin, (_req, res) => {
  res.json(events.getStats());
});

// Union of all size labels currently used across products (preserves first-seen order).
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

// Upload image directly to object storage (private dir) and return the URL to serve it
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

export default router;
