import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { dbQuery } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/settings.json");

export interface CategoryDef {
  id: string;
  label: string;
  suffix: string;
}

export interface SiteSettings {
  heroImage: string;
  heroImages: string[];
  pixDiscountPct: number;
  maxInstallments: number;
  vagas: number;
  prazoEntregaDias: number;
  categories: CategoryDef[];
}

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: "retratil",  label: "Sofá Retrátil",  suffix: "Retrátil" },
  { id: "sofa-cama", label: "Sofá-cama",       suffix: "Cama" },
  { id: "canto",     label: "Sofá de Canto",   suffix: "de Canto" },
  { id: "organicos", label: "Sofá Orgânico",   suffix: "Orgânico" },
  { id: "living",    label: "Sofá Living",      suffix: "Living" },
  { id: "fixo",      label: "Sofá Fixo",        suffix: "Fixo" },
  { id: "chaise",    label: "Sofá Chaise",      suffix: "Chaise" },
  { id: "ilha",      label: "Sofá Ilha",        suffix: "Ilha" },
  { id: "modulos",   label: "Módulos",          suffix: "Módulos" },
  { id: "poltronas", label: "Poltronas",        suffix: "Poltrona" },
  { id: "puffs",     label: "Puffs",            suffix: "Puff" },
  { id: "almofadas", label: "Almofadas",        suffix: "Almofada" },
  { id: "cama",      label: "Cama",             suffix: "Cama" },
  { id: "cabeceira", label: "Cabeceira",        suffix: "Cabeceira" },
  { id: "box",       label: "Box",              suffix: "Box" },
];

const DEFAULTS: SiteSettings = {
  heroImage: "/images/hero.png",
  heroImages: [],
  pixDiscountPct: 10,
  maxInstallments: 10,
  vagas: 8,
  prazoEntregaDias: 30,
  categories: DEFAULT_CATEGORIES,
};

function loadFromFile(): SiteSettings {
  try {
    if (!existsSync(DATA_FILE)) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(readFileSync(DATA_FILE, "utf-8")) };
  } catch { return { ...DEFAULTS }; }
}

let _cache: SiteSettings | null = null;
function getCache(): SiteSettings {
  if (_cache === null) _cache = loadFromFile();
  return _cache;
}

async function persistSettings(s: SiteSettings): Promise<void> {
  await dbQuery(
    `INSERT INTO site_settings (key, value) VALUES ('main', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(s)]
  );
}

export async function initSettingsStore(): Promise<void> {
  try {
    const result = await dbQuery("SELECT value FROM site_settings WHERE key = 'main'");
    if (result && result.rows.length > 0) {
      _cache = normalize({ ...DEFAULTS, ...result.rows[0].value });
      console.log("[settingsStore] Loaded settings from database");
    } else {
      const fromFile = normalize(loadFromFile());
      _cache = fromFile;
      await persistSettings(fromFile);
      console.log("[settingsStore] Migrated settings from JSON to database");
    }
  } catch (err) {
    console.error("[settingsStore] DB init failed, using file fallback:", err);
    _cache = loadFromFile();
  }
}

function normalize(s: SiteSettings): SiteSettings {
  const imgs = Array.isArray(s.heroImages) ? s.heroImages.filter(x => typeof x === "string" && x.length > 0) : [];
  const cats = normalizeCategories(s.categories);
  const base: SiteSettings = { ...s, categories: cats };
  if (imgs.length > 0) return { ...base, heroImages: imgs, heroImage: imgs[0] };
  if (s.heroImage) return { ...base, heroImages: [s.heroImage] };
  return { ...base, heroImages: [] };
}

export function normalizeCategories(input: any): CategoryDef[] {
  if (!Array.isArray(input) || input.length === 0) return DEFAULT_CATEGORIES;
  const seen = new Set<string>();
  const out: CategoryDef[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const id = String(raw.id ?? "").trim();
    const label = String(raw.label ?? "").trim();
    const suffix = String(raw.suffix ?? "").trim();
    if (!id || !label) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, suffix });
  }
  return out.length > 0 ? out : DEFAULT_CATEGORIES;
}

export function getSettings(): SiteSettings {
  return getCache();
}

export function updateSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = getCache();
  const updated = normalize({ ...current, ...patch });
  _cache = updated;
  persistSettings(updated).catch((e) => console.error("[settingsStore] persist error:", e));
  return updated;
}
