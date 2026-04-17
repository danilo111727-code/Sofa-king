import { Router } from "express";
import { requireAdmin } from "../lib/adminAuth.js";
import * as store from "../lib/settingsStore.js";

const router = Router();

router.get("/settings", (_req, res) => {
  res.json(store.getSettings());
});

router.put("/admin/settings", requireAdmin, (req, res) => {
  const { heroImage, pixDiscountPct, maxInstallments } = req.body;
  const updated = store.updateSettings({
    ...(heroImage !== undefined && { heroImage: String(heroImage) }),
    ...(pixDiscountPct !== undefined && { pixDiscountPct: Number(pixDiscountPct) }),
    ...(maxInstallments !== undefined && { maxInstallments: Math.max(1, Math.round(Number(maxInstallments))) }),
  });
  res.json(updated);
});

export default router;
