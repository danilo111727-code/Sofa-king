import { Router, type Request, type Response } from "express";
import { Readable } from "stream";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage.js";

const router = Router();
const storage = new ObjectStorageService();

router.get("/storage/objects/{*rest}", async (req: Request, res: Response) => {
  try {
    const wildcard = (req.params as any).rest;
    const path = Array.isArray(wildcard) ? wildcard.join("/") : wildcard;
    // Only allow serving from the public uploads/ prefix (admin-uploaded product images).
    // All other private objects remain inaccessible via this route.
    if (!path || !path.startsWith("uploads/") || path.includes("..")) {
      res.status(404).json({ error: "Arquivo não encontrado" });
      return;
    }
    const objectPath = `/objects/${path}`;
    const file = await storage.getObjectEntityFile(objectPath);
    const response = await storage.downloadObject(file, 60 * 60 * 24);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Arquivo não encontrado" });
      return;
    }
    res.status(500).json({ error: "Erro ao carregar arquivo" });
  }
});

export default router;
