import { Router } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import * as store from "../lib/productStore.js";

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin(req: any, res: any, next: any) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    if (!emails.some((e) => ADMIN_EMAILS.includes(e))) {
      res.status(403).json({ error: "Acesso restrito ao administrador" });
      return;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "Não autorizado" });
  }
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

router.post("/products", requireAdmin, (req, res) => {
  const { name, price, description, longDescription, image, dimensions, colors, fabrics, disponibilidade, prazoEntrega, sizes } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  const product = store.create({
    name,
    price: Number(price) || 0,
    description: description ?? "",
    longDescription: longDescription ?? "",
    image: image ?? "/images/placeholder.png",
    dimensions: dimensions ?? "",
    colors: Array.isArray(colors) ? colors : (colors ? String(colors).split(",").map((s: string) => s.trim()) : []),
    fabrics: Array.isArray(fabrics) ? fabrics : (fabrics ? String(fabrics).split(",").map((s: string) => s.trim()) : []),
    disponibilidade: disponibilidade !== false && disponibilidade !== "false",
    prazoEntrega: prazoEntrega ?? "A consultar",
    sizes: Array.isArray(sizes) ? sizes : [],
  });
  res.status(201).json(product);
});

router.put("/products/:id", requireAdmin, (req, res) => {
  const { name, price, description, longDescription, image, dimensions, colors, fabrics, disponibilidade, prazoEntrega, sizes } = req.body;
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
    ...(sizes !== undefined && { sizes: Array.isArray(sizes) ? sizes : [] }),
  });
  if (!updated) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  res.json(updated);
});

router.delete("/products/:id", requireAdmin, (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }
  res.json({ success: true });
});

router.get("/admin/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.json({ isAdmin: false, signedIn: false });
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    const isAdmin = emails.some((e) => ADMIN_EMAILS.includes(e));
    res.json({ isAdmin, signedIn: true, email: user.emailAddresses[0]?.emailAddress });
  } catch {
    res.json({ isAdmin: false, signedIn: false });
  }
});

export default router;
