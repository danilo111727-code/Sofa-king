import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { dbQuery } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const FILE = join(DATA_DIR, "materials.json");

export interface Material {
  id: string;
  type: "espuma";
  name: string;
  description: string;
  priceAdjustment: number;
  priceAdjustmentBySize?: Record<string, number>;
  weightSupport?: string;
  comfortLevel?: string;
  useIndication?: string;
  longTermBehavior?: string;
  active: boolean;
  imageUrl?: string;
}

interface File { materials: Material[]; }

const DEFAULT_DATA: File = {
  materials: [
    { id: "esp-d20", type: "espuma", name: "Espuma D20 (Soft)", description: "Mais macia, ideal para encostos.", priceAdjustment: -100, active: true },
    { id: "esp-d23", type: "espuma", name: "Espuma D23", description: "Conforto firme — recomendada para uso diário.", priceAdjustment: 0, active: true },
    { id: "esp-d28", type: "espuma", name: "Espuma D28 (Premium)", description: "Mais densa e firme, recomendada para uso intenso.", priceAdjustment: 150, active: true },
  ],
};

function loadFromFile(): File {
  if (!existsSync(FILE)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
    return DEFAULT_DATA;
  }
  try {
    const data = JSON.parse(readFileSync(FILE, "utf-8")) as File;
    return { materials: data.materials.filter((m: any) => m.type === "espuma") };
  } catch { return DEFAULT_DATA; }
}

let _cache: Material[] | null = null;
function getCache(): Material[] {
  if (_cache === null) _cache = loadFromFile().materials;
  return _cache;
}

async function persistOne(m: Material): Promise<void> {
  await dbQuery(
    `INSERT INTO materials (id, data) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $2`,
    [m.id, JSON.stringify({ ...m, _type: "espuma" })]
  );
}

async function deleteOne(id: string): Promise<void> {
  await dbQuery("DELETE FROM materials WHERE id = $1", [id]);
}

export async function initMaterialStore(): Promise<void> {
  try {
    const result = await dbQuery("SELECT id, data FROM materials WHERE data->>'_type' = 'espuma' ORDER BY created_at");
    if (result && result.rows.length > 0) {
      _cache = result.rows.map((r) => { const { _type, ...rest } = r.data; return rest as Material; });
      console.log(`[materialStore] Loaded ${_cache.length} materials from database`);
    } else {
      const fromFile = loadFromFile().materials;
      _cache = fromFile;
      for (const m of fromFile) {
        await persistOne(m);
      }
      console.log(`[materialStore] Migrated ${fromFile.length} materials from JSON to database`);
    }
  } catch (err) {
    console.error("[materialStore] DB init failed, using file fallback:", err);
    _cache = loadFromFile().materials;
  }
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeBySize(input: Record<string, number> | null | undefined): Record<string, number> | undefined {
  if (!input || typeof input !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input)) {
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function getAll(): Material[] { return getCache(); }
export function getActive(): Material[] { return getCache().filter((m) => m.active); }

export function resolveFoamAdjustment(m: Material, sizeLabel: string): number {
  const v = m.priceAdjustmentBySize?.[sizeLabel];
  return typeof v === "number" && Number.isFinite(v) ? v : m.priceAdjustment;
}

export function create(data: Omit<Material, "id">): Material {
  const materials = getCache();
  const baseId = `esp-${slug(data.name)}`;
  const id = materials.some((m) => m.id === baseId) ? `${baseId}-${Date.now()}` : baseId;
  const m: Material = { id, ...data, type: "espuma", priceAdjustmentBySize: normalizeBySize(data.priceAdjustmentBySize) };
  materials.push(m);
  persistOne(m).catch((e) => console.error("[materialStore] persist error:", e));
  return m;
}

export function update(id: string, data: Partial<Omit<Material, "id">>): Material | null {
  const materials = getCache();
  const idx = materials.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const next = { ...materials[idx], ...data, type: "espuma" as const };
  if (data.priceAdjustmentBySize !== undefined) next.priceAdjustmentBySize = normalizeBySize(data.priceAdjustmentBySize);
  materials[idx] = next;
  persistOne(next).catch((e) => console.error("[materialStore] persist error:", e));
  return next;
}

export function remove(id: string): boolean {
  const materials = getCache();
  const idx = materials.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  materials.splice(idx, 1);
  deleteOne(id).catch((e) => console.error("[materialStore] delete error:", e));
  return true;
}
