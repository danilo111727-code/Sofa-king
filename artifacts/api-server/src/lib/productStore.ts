import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/products.json");

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
}

function load(): Product[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Product[];
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
  const unique = products.some((p) => p.id === id)
    ? `${id}-${Date.now()}`
    : id;
  const product: Product = { id: unique, ...data };
  products.push(product);
  save(products);
  return product;
}

export function update(id: string, data: Partial<Omit<Product, "id">>): Product | null {
  const products = load();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data };
  save(products);
  return products[idx];
}

export function remove(id: string): boolean {
  const products = load();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  save(products);
  return true;
}
