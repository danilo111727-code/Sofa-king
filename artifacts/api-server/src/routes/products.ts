import { Router } from "express";
import * as store from "../lib/productStore.js";
import { verify } from "../lib/authStore.js";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const token = req.headers["x-admin-token"] as string | undefined;
  if (!verify(token)) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }
  next();
}

router.get("/products", (_req, res) => {
  res.json(store.getAll());
});

router.get("/products/:id", (req, res) => {
  const product = store.getById(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  res.json(product);
});

router.post("/products", requireAuth, (req, res) => {
  const { name, price, description, longDescription, image, dimensions, colors, fabrics, disponibilidade, prazoEntrega } = req.body;
  if (!name || price == null) {
    res.status(400).json({ error: "Nome e preço são obrigatórios" });
    return;
  }
  const product = store.create({
    name,
    price: Number(price),
    description: description ?? "",
    longDescription: longDescription ?? "",
    image: image ?? "/images/placeholder.png",
    dimensions: dimensions ?? "",
    colors: Array.isArray(colors) ? colors : (colors ? String(colors).split(",").map((s: string) => s.trim()) : []),
    fabrics: Array.isArray(fabrics) ? fabrics : (fabrics ? String(fabrics).split(",").map((s: string) => s.trim()) : []),
    disponibilidade: disponibilidade !== false && disponibilidade !== "false",
    prazoEntrega: prazoEntrega ?? "A consultar",
  });
  res.status(201).json(product);
});

router.put("/products/:id", requireAuth, (req, res) => {
  const { name, price, description, longDescription, image, dimensions, colors, fabrics, disponibilidade, prazoEntrega } = req.body;
  const updated = store.update(req.params.id, {
    ...(name !== undefined && { name }),
    ...(price !== undefined && { price: Number(price) }),
    ...(description !== undefined && { description }),
    ...(longDescription !== undefined && { longDescription }),
    ...(image !== undefined && { image }),
    ...(dimensions !== undefined && { dimensions }),
    ...(colors !== undefined && { colors: Array.isArray(colors) ? colors : String(colors).split(",").map((s: string) => s.trim()) }),
    ...(fabrics !== undefined && { fabrics: Array.isArray(fabrics) ? fabrics : String(fabrics).split(",").map((s: string) => s.trim()) }),
    ...(disponibilidade !== undefined && { disponibilidade: disponibilidade !== false && disponibilidade !== "false" }),
    ...(prazoEntrega !== undefined && { prazoEntrega }),
  });
  if (!updated) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  res.json(updated);
});

router.delete("/products/:id", requireAuth, (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  res.json({ success: true });
});

export default router;
