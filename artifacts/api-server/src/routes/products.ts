import { Router } from "express";
  import { requireAdmin } from "../lib/adminAuth.js";
import { validateConfiguration } from "../lib/configurator/validation.mjs";
import { listVariations } from "../lib/variationStore.js";
  import * as store from "../lib/productStore.js";

  const router = Router();

  async function validateConfig(configuration: any) {
    if (configuration === undefined) return;
    validateConfiguration(configuration);
    const albums = await listVariations();
    for (const [id, association] of Object.entries(configuration.catalogVariations ?? {}) as [string, any][]) {
      if (!association.enabled) continue;
      const album = albums.find((a: any) => a.id === id && a.active);
      if (!album || association.optionIds.some((optionId: string) => !album.options.some((o: any) => o.id === optionId && o.active !== false))) {
        throw Object.assign(new Error('Atualize as opções associadas ao modelo.'), {status:400});
      }
    }
  }

  router.get("/products", (_req, res) => {
    res.json(store.getAll());
  });

  router.get("/products/:id", (req, res) => {
    const product = store.getById(String(req.params.id));
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.json(product);
  });

  router.post("/products", requireAdmin, async (req, res) => {
    const { name, price, description, longDescription, image, images, category, dimensions, colors, fabrics, disponibilidade, prazoEntrega, sizes, bestseller, diagramaUrl, diagramaAnotacoes, priceAdjustmentPercent, displaySizeLabel, designAutoral } = req.body;
    if (!name) {
      res.status(400).json({ error: "Nome é obrigatório" });
      return;
    }
    await validateConfig(req.body.configuration);
    const product = await store.create({
      ...(req.body.configuration !== undefined && { configuration: req.body.configuration }),
      name,
      price: Number(price) || 0,
      description: description ?? "",
      longDescription: longDescription ?? "",
      image: image ?? "/images/placeholder.png",
      images: Array.isArray(images) ? images : [],
      category: category ?? "",
      dimensions: dimensions ?? "",
      colors: Array.isArray(colors) ? colors : (colors ? String(colors).split(",").map((s: string) => s.trim()) : []),
      fabrics: Array.isArray(fabrics) ? fabrics : (fabrics ? String(fabrics).split(",").map((s: string) => s.trim()) : []),
      disponibilidade: disponibilidade !== false && disponibilidade !== "false",
      prazoEntrega: prazoEntrega ?? "A consultar",
      bestseller: bestseller === true || bestseller === "true",
      sizes: Array.isArray(sizes) ? sizes : [],
      ...(diagramaUrl !== undefined && { diagramaUrl }),
      ...(diagramaAnotacoes !== undefined && { diagramaAnotacoes: Array.isArray(diagramaAnotacoes) ? diagramaAnotacoes : [] }),
      ...(priceAdjustmentPercent !== undefined && priceAdjustmentPercent !== null && priceAdjustmentPercent !== "" && { priceAdjustmentPercent: Number(priceAdjustmentPercent) || 0 }),
      ...(displaySizeLabel !== undefined && displaySizeLabel !== null && { displaySizeLabel: String(displaySizeLabel) }),
      ...(designAutoral !== undefined && { designAutoral: designAutoral === true || designAutoral === "true" }),
    });
    res.status(201).json(product);
  });

  router.put("/products/:id", requireAdmin, async (req, res) => {
    const { name, price, description, longDescription, image, images, category, dimensions, colors, fabrics, disponibilidade, prazoEntrega, bestseller, sizes, diagramaUrl, diagramaAnotacoes, priceAdjustmentPercent, displaySizeLabel, designAutoral } = req.body;
    await validateConfig(req.body.configuration);
    const updated = await store.update(String(req.params.id), {
      ...(req.body.configuration !== undefined && { configuration: req.body.configuration }),
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(description !== undefined && { description }),
      ...(longDescription !== undefined && { longDescription }),
      ...(image !== undefined && { image }),
      ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
      ...(category !== undefined && { category }),
      ...(dimensions !== undefined && { dimensions }),
      ...(colors !== undefined && { colors: Array.isArray(colors) ? colors : String(colors).split(",").map((s: string) => s.trim()) }),
      ...(fabrics !== undefined && { fabrics: Array.isArray(fabrics) ? fabrics : String(fabrics).split(",").map((s: string) => s.trim()) }),
      ...(disponibilidade !== undefined && { disponibilidade: disponibilidade !== false && disponibilidade !== "false" }),
      ...(prazoEntrega !== undefined && { prazoEntrega }),
      ...(sizes !== undefined && { sizes: Array.isArray(sizes) ? sizes : [] }),
      ...(bestseller !== undefined && { bestseller: bestseller === true || bestseller === "true" }),
      ...(diagramaUrl !== undefined && { diagramaUrl }),
      ...(diagramaAnotacoes !== undefined && { diagramaAnotacoes: Array.isArray(diagramaAnotacoes) ? diagramaAnotacoes : [] }),
      ...(priceAdjustmentPercent !== undefined && { priceAdjustmentPercent: (priceAdjustmentPercent === null || priceAdjustmentPercent === "" || !Number.isFinite(Number(priceAdjustmentPercent))) ? 0 : Number(priceAdjustmentPercent) }),
      ...(displaySizeLabel !== undefined && { displaySizeLabel: displaySizeLabel === "" ? undefined : String(displaySizeLabel) }),
      ...(designAutoral !== undefined && { designAutoral: designAutoral === true || designAutoral === "true" }),
    });
    if (!updated) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.json(updated);
  });

  router.delete("/products/:id", requireAdmin, async (req, res) => {
    const ok = await store.remove(String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.json({ success: true });
  });


  export default router;
  