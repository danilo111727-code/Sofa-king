import { Router } from "express";
import * as store from "../lib/albumStore.js";
import { requireAdmin } from "../lib/adminAuth.js";

const router = Router();

router.get("/albums", (_req, res) => {
  res.json(store.getActive());
});

router.get("/admin/albums", requireAdmin, (_req, res) => {
  res.json(store.getAll());
});

router.post("/admin/albums", requireAdmin, (req, res) => {
  const { name, description, surcharge, surchargeBySize, fabrics, active } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  const album = store.create({
    name,
    description: description ?? "",
    surcharge: Number(surcharge) || 0,
    surchargeBySize: surchargeBySize && typeof surchargeBySize === "object" ? surchargeBySize : undefined,
    fabrics: Array.isArray(fabrics) ? fabrics : [],
    active: active !== false,
  });
  res.status(201).json(album);
});

router.put("/admin/albums/:id", requireAdmin, (req, res) => {
  const { name, description, surcharge, surchargeBySize, fabrics, active } = req.body;
  const updated = store.update(req.params.id, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(surcharge !== undefined && { surcharge: Number(surcharge) }),
    ...(surchargeBySize !== undefined && { surchargeBySize }),
    ...(fabrics !== undefined && { fabrics }),
    ...(active !== undefined && { active }),
  });
  if (!updated) {
    res.status(404).json({ error: "Álbum não encontrado" });
    return;
  }
  res.json(updated);
});

router.delete("/admin/albums/:id", requireAdmin, (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "Álbum não encontrado" });
    return;
  }
  res.json({ success: true });
});

export default router;
