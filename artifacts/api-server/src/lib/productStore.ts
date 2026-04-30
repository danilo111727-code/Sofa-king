import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { dbQuery } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../data/products.json");

export interface SizeOption {
  label: string;
  basePrice: number;
  albumSurcharges?: Record<string, number>;
  foamSurcharges?: Record<string, number>;
}

export type ProductCategory =
    | "retratil"
    | "sofa-cama"
    | "canto"
    | "organicos"
    | "living"
    | "fixo"
    | "chaise"
    | "ilha"
    | "modulos"
    | "cama"
    | "cabeceira"
    | "box"
    | "poltronas"
    | "puffs"
    | "almofadas"
    | "";
  
const VALID_CATEGORIES: ProductCategory[] = [
    "retratil", "sofa-cama", "canto", "organicos", "living",
    "fixo", "chaise", "ilha", "modulos",
    "cama", "cabeceira", "box",
    "poltronas", "puffs", "almofadas", "",
  ];
  
export interface DiagramaAnotacao {
  id: string;
  x1: number; y1: number; x2: number; y2: number;
  label: string; sublabel: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  image: string;
  images: string[];
  category: ProductCategory;
  dimensions: string;
  colors: string[];
  fabrics: string[];
  disponibilidade: boolean;
  prazoEntrega: string;
  prazoEntregaDias?: number;
  vagas?: number;
  sizes: SizeOption[];
  bestseller: boolean;
  albumIds?: string[];
  foamIds?: string[];
  diagramaUrl?: string;
  diagramaAnotacoes?: DiagramaAnotacao[];
  /** Optional %: positive markup, negative discount. Applies ONLY to size basePrice. */
  priceAdjustmentPercent?: number;
}

const TEST_IDS = new Set([
  "sofa-teste-retratil", "sofa-teste-carrinho",
  "sofa-carrinho-teste", "sofa-teste-demo-valores",
]);

function normalizeSizes(sizes: any): SizeOption[] {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((s) => ({
      label: String(s?.label ?? "").trim(),
      basePrice: Number(s?.basePrice) || 0,
      ...(s?.albumSurcharges && typeof s.albumSurcharges === "object" ? { albumSurcharges: s.albumSurcharges } : {}),
      ...(s?.foamSurcharges && typeof s.foamSurcharges === "object" ? { foamSurcharges: s.foamSurcharges } : {}),
    }))
    .filter((s) => s.label);
}

function normalizeImages(images: any, legacyImage: any): string[] {
  if (Array.isArray(images)) {
    const filtered = images.map((x) => String(x || "").trim()).filter((x) => x.length > 0);
    if (filtered.length > 0) return filtered;
  }
  if (legacyImage && typeof legacyImage === "string" && legacyImage.trim()) return [legacyImage.trim()];
  return [];
}

function normalizeCategory(c: any): ProductCategory {
  return VALID_CATEGORIES.includes(c) ? (c as ProductCategory) : "";
}

function derivedPrice(sizes: SizeOption[], fallback: number): number {
  if (sizes.length === 0) return fallback;
  const positives = sizes.map((s) => s.basePrice).filter((n) => n > 0);
  if (positives.length === 0) return 0;
  return Math.min(...positives);
}

function normalizeProduct(p: any): Product {
  const images = normalizeImages(p.images, p.image);
  return {
    ...p,
    sizes: normalizeSizes(p.sizes),
    colors: Array.isArray(p.colors) ? p.colors : [],
    fabrics: Array.isArray(p.fabrics) ? p.fabrics : [],
    images,
    image: images[0] || p.image || "",
    category: normalizeCategory(p.category),
    bestseller: Boolean(p.bestseller),
    albumIds: Array.isArray(p.albumIds) ? p.albumIds : undefined,
    foamIds: Array.isArray(p.foamIds) ? p.foamIds : undefined,
  };
}

function loadFromJson(): Product[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as any[];
    return raw
      .filter((p) => !TEST_IDS.has(String(p?.id ?? "")))
      .map(normalizeProduct);
  } catch { return []; }
}


  function saveToJson(products: Product[]): void {
    try {
      writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
    } catch (e) {
      console.error("[productStore] JSON save error:", e);
    }
  }
  let _cache: Product[] | null = null;

function getCache(): Product[] {
  if (_cache === null) _cache = loadFromJson();
  return _cache;
}

async function persistAll(products: Product[]): Promise<void> {
  const r = await dbQuery(
    "DELETE FROM products WHERE id = ANY($1::text[])",
    [TEST_IDS.size > 0 ? [...TEST_IDS] : [""]]
  );
  for (const p of products) {
    await dbQuery(
      `INSERT INTO products (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [p.id, JSON.stringify(p)]
    );
  }
}

async function persistOne(p: Product): Promise<void> {
  const result = await dbQuery(
    `INSERT INTO products (id, data) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [p.id, JSON.stringify(p)]
  );
  if (result === null) saveToJson(getCache());
}

async function deleteOne(id: string): Promise<void> {
  const result = await dbQuery("DELETE FROM products WHERE id = $1", [id]);
  if (result === null) saveToJson(getCache());
}

export async function initProductStore(): Promise<void> {
  try {
    const result = await dbQuery("SELECT id, data FROM products ORDER BY created_at");
    if (result === null) {
      // DB connection failed — use JSON as read-only fallback, never overwrite DB
      console.error("[productStore] DB unavailable at startup, using JSON fallback (read-only — DB will NOT be overwritten)");
      _cache = loadFromJson();
    } else if (result.rows.length > 0) {
      // DB has data — load normally
      _cache = result.rows
        .map((r) => normalizeProduct(r.data))
        .filter((p) => !TEST_IDS.has(p.id));
      console.log(`[productStore] Loaded ${_cache.length} products from database`);
    } else {
      // DB is genuinely empty (zero rows) — seed from JSON only on first run
      const fromJson = loadFromJson();
      _cache = fromJson;
      if (fromJson.length > 0) {
        await persistAll(fromJson);
        console.log(`[productStore] Seeded ${fromJson.length} products from JSON (DB was empty)`);
      }
    }
  } catch (err) {
    console.error("[productStore] DB init failed, using JSON fallback:", err);
    _cache = loadFromJson();
  }
}

export function getAll(): Product[] {
  return getCache();
}

export function getById(id: string): Product | undefined {
  return getCache().find((p) => p.id === id);
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function create(data: Omit<Product, "id">): Product {
  const products = getCache();
  const base = slugify(data.name);
  const id = products.some((p) => p.id === base) ? `${base}-${Date.now()}` : base;
  const sizes = normalizeSizes(data.sizes);
  const images = normalizeImages(data.images, data.image);
  const product: Product = {
    ...data, id, sizes, images,
    image: images[0] || "",
    category: normalizeCategory(data.category),
    bestseller: Boolean(data.bestseller),
    price: derivedPrice(sizes, Number(data.price) || 0),
  };
  products.push(product);
  persistOne(product).catch((e) => console.error("[productStore] persist error:", e));
  return product;
}

export function update(id: string, data: Partial<Omit<Product, "id">>): Product | null {
  const products = getCache();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const merged = { ...products[idx], ...data };
  if (data.sizes !== undefined) merged.sizes = normalizeSizes(data.sizes);
  if (data.images !== undefined) {
    const images = normalizeImages(data.images, data.image);
    merged.images = images;
    merged.image = images[0] || "";
  } else if (data.image !== undefined) {
    const rest = (products[idx].images || []).slice(1);
    const newImages = normalizeImages([data.image, ...rest], data.image);
    merged.images = newImages;
    merged.image = newImages[0] || "";
  }
  if (data.category !== undefined) merged.category = normalizeCategory(data.category);
  if (data.bestseller !== undefined) merged.bestseller = Boolean(data.bestseller);
  merged.price = derivedPrice(merged.sizes, Number(merged.price) || 0);
  products[idx] = merged;
  persistOne(merged).catch((e) => console.error("[productStore] persist error:", e));
  return merged;
}

export function remove(id: string): boolean {
  const products = getCache();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  deleteOne(id).catch((e) => console.error("[productStore] delete error:", e));
  return true;
}
