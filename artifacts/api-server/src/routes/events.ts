import { Router } from "express";
import * as events from "../lib/eventStore.js";

const router = Router();

router.post("/events/view", (req, res) => {
  const { productId, productName, path } = req.body || {};
  events.track({ type: "view", productId, productName, path });
  res.json({ ok: true });
});

router.post("/events/whatsapp", (req, res) => {
  const { productId, productName } = req.body || {};
  events.track({ type: "whatsapp", productId, productName });
  res.json({ ok: true });
});

export default router;
