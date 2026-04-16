import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const FILE = join(DATA_DIR, "materials.json");

// Espumas: priceAdjustment is a surcharge in R$ (Reais)
export interface Material {
  id: string;
  type: "espuma";
  name: string;
  description: string;
  priceAdjustment: number;
  active: boolean;
  imageUrl?: string;
}

interface File {
  materials: Material[];
}

const DEFAULT_DATA: File = {
  materials: [
    { id: "esp-d20", type: "espuma", name: "Espuma D20 (Soft)", description: "Mais macia, ideal para encostos.", priceAdjustment: -100, active: true },
    { id: "esp-d23", type: "espuma", name: "Espuma D23", description: "Conforto firme — recomendada para uso diário.", priceAdjustment: 0, active: true },
    { id: "esp-d28", type: "espuma", name: "Espuma D28 (Premium)", description: "Mais densa e firme, recomendada para uso intenso.", priceAdjustment: 150, active: true },
  ],
};

function load(): File {
  if (!existsSync(FILE)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
    return DEFAULT_DATA;
  }
  try {
    const data = JSON.parse(readFileSync(FILE, "utf-8")) as File;
    // Migrate: drop legacy "tecido" entries (fabrics now live in albums)
    const filtered = { materials: data.materials.filter((m: any) => m.type === "espuma") };
    return filtered;
  } catch {
    return DEFAULT_DATA;
  }
}

function save(data: File): void {
  writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getAll(): Material[] {
  return load().materials;
}

export function getActive(): Material[] {
  return load().materials.filter((m) => m.active);
}

export function create(data: Omit<Material, "id">): Material {
  const d = load();
  const baseId = `esp-${slug(data.name)}`;
  const id = d.materials.some((m) => m.id === baseId) ? `${baseId}-${Date.now()}` : baseId;
  const m: Material = { id, ...data, type: "espuma" };
  d.materials.push(m);
  save(d);
  return m;
}

export function update(id: string, data: Partial<Omit<Material, "id">>): Material | null {
  const d = load();
  const idx = d.materials.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  d.materials[idx] = { ...d.materials[idx], ...data, type: "espuma" };
  save(d);
  return d.materials[idx];
}

export function remove(id: string): boolean {
  const d = load();
  const idx = d.materials.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  d.materials.splice(idx, 1);
  save(d);
  return true;
}
