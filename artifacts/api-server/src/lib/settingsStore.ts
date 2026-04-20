import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { dbQuery } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/settings.json");

export interface SiteSettings {
  heroImage: string;
  heroImages: string[];
  pixDiscountPct: number;
  maxInstallments: number;
  vagas: number;
  prazoEntregaDias: number;
}

const DEFAULTS: SiteSettings = {
  heroImage: "/images/hero.png",
  heroImages: [],
  pixDiscountPct: 10,
  maxInstallments: 10,
  vagas: 8,
  prazoEntregaDias: 30,
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
    if (imgs.length > 0) return { ...s, heroImages: imgs, heroImage: imgs[0] };
    if (s.heroImage) return { ...s, heroImages: [s.heroImage] };
    return { ...s, heroImages: [] };
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
