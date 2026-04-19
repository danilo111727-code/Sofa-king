import { Router } from "express";
import * as store from "../lib/materialStore.js";
import { requireAdmin } from "../lib/adminAuth.js";

const router = Router();

router.get("/materials", (_req, res) => {
  res.json(store.getActive());
});

router.get("/admin/materials", requireAdmin, (_req, res) => {
  res.json(store.getAll());
});

router.post("/admin/materials", requireAdmin, (req, res) => {
  const { type, name, description, priceAdjustment, priceAdjustmentBySize, weightSupport, comfortLevel, useIndication, longTermBehavior, imageUrl, active } = req.body || {};
  if (!type || !name) {
    res.status(400).json({ error: "Tipo e nome são obrigatórios" });
    return;
  }
  if (type !== "tecido" && type !== "espuma") {
    res.status(400).json({ error: "Tipo inválido" });
    return;
  }
  const m = store.create({
    type,
    name,
    description: description ?? "",
    priceAdjustment: Number(priceAdjustment) || 0,
    priceAdjustmentBySize: priceAdjustmentBySize && typeof priceAdjustmentBySize === "object" ? priceAdjustmentBySize : undefined,
    weightSupport: typeof weightSupport === "string" ? weightSupport : undefined,
    comfortLevel: typeof comfortLevel === "string" ? comfortLevel : undefined,
    useIndication: typeof useIndication === "string" ? useIndication : undefined,
    longTermBehavior: typeof longTermBehavior === "string" ? longTermBehavior : undefined,
    imageUrl: imageUrl ?? undefined,
    active: active !== false,
  });
  res.status(201).json(m);
});

router.put("/admin/materials/:id", requireAdmin, (req, res) => {
  const { type, name, description, priceAdjustment, priceAdjustmentBySize, weightSupport, comfortLevel, useIndication, longTermBehavior, imageUrl, active } = req.body || {};
  const updated = store.update(req.params.id, {
    ...(type !== undefined && { type }),
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(priceAdjustment !== undefined && { priceAdjustment: Number(priceAdjustment) }),
    ...(priceAdjustmentBySize !== undefined && { priceAdjustmentBySize }),
    ...(weightSupport !== undefined && { weightSupport }),
    ...(comfortLevel !== undefined && { comfortLevel }),
    ...(useIndication !== undefined && { useIndication }),
    ...(longTermBehavior !== undefined && { longTermBehavior }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(active !== undefined && { active: !!active }),
  });
  if (!updated) {
    res.status(404).json({ error: "Material não encontrado" });
    return;
  }
  res.json(updated);
});

router.delete("/admin/materials/:id", requireAdmin, (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "Material não encontrado" });
    return;
  }
  res.json({ success: true });
});


  router.post("/maintenance/fix-foams", (req, res) => {
    const t = req.headers["x-maint-token"];
    if (t !== process.env.MAINT_TOKEN) { res.status(403).json({ error: "forbidden" }); return; }
    store.update("esp-d33-soft", { weightSupport: "90–120kg" });
    store.update("esp-d33-soft-molas", { weightSupport: "110–150kg" });
    store.remove("esp-teste-luxo");
    res.json({ ok: true, foams: store.getAll().map(f => ({ id: f.id, name: f.name, w: f.weightSupport, active: f.active })) });
  });

  export default router;
