import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/products.json");

export interface SizeOption {
  label: string;
  basePrice: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  image: string;
  dimensions: string;
  colors: string[];
  fabrics: string[];
  disponibilidade: boolean;
  prazoEntrega: string;
  sizes: SizeOption[];
}

function normalizeSizes(sizes: any): SizeOption[] {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((s) => ({
      label: String(s?.label ?? "").trim(),
      basePrice: Number(s?.basePrice) || 0,
    }))
    .filter((s) => s.label);
}

function derivedPrice(sizes: SizeOption[], fallback: number): number {
  if (sizes.length === 0) return fallback;
  return Math.min(...sizes.map((s) => s.basePrice).filter((n) => n > 0));
}

function load(): Product[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    const raw = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as any[];
    return raw.map((p) => ({
      ...p,
      sizes: normalizeSizes(p.sizes),
      colors: Array.isArray(p.colors) ? p.colors : [],
      fabrics: Array.isArray(p.fabrics) ? p.fabrics : [],
    })) as Product[];
  } catch {
    return [];
  }
}

function save(products: Product[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export function getAll(): Product[] {
  return load();
}

export function getById(id: string): Product | undefined {
  return load().find((p) => p.id === id);
}

export function create(data: Omit<Product, "id">): Product {
  const products = load();
  const id = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const unique = products.some((p) => p.id === id) ? `${id}-${Date.now()}` : id;
  const sizes = normalizeSizes(data.sizes);
  const product: Product = {
    ...data,
    id: unique,
    sizes,
    price: derivedPrice(sizes, Number(data.price) || 0),
  };
  products.push(product);
  save(products);
  return product;
}

export function update(id: string, data: Partial<Omit<Product, "id">>): Product | null {
  const products = load();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const merged = { ...products[idx], ...data };
  if (data.sizes !== undefined) merged.sizes = normalizeSizes(data.sizes);
  merged.price = derivedPrice(merged.sizes, Number(merged.price) || 0);
  products[idx] = merged;
  save(products);
  return merged;
}

export function remove(id: string): boolean {
  const products = load();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  save(products);
  return true;
}
