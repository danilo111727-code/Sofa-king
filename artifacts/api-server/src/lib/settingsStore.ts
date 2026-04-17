import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { dbQuery } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/settings.json");

export interface SiteSettings {
  heroImage: string;
  pixDiscountPct: number;
  maxInstallments: number;
}

const DEFAULTS: SiteSettings = {
  heroImage: "/images/hero.png",
  pixDiscountPct: 10,
  maxInstallments: 10,
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
      _cache = { ...DEFAULTS, ...result.rows[0].value };
      console.log("[settingsStore] Loaded settings from database");
    } else {
      const fromFile = loadFromFile();
      _cache = fromFile;
      await persistSettings(fromFile);
      console.log("[settingsStore] Migrated settings from JSON to database");
    }
  } catch (err) {
    console.error("[settingsStore] DB init failed, using file fallback:", err);
    _cache = loadFromFile();
  }
}

export function getSettings(): SiteSettings {
  return getCache();
}

export function updateSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = getCache();
  const updated = { ...current, ...patch };
  _cache = updated;
  persistSettings(updated).catch((e) => console.error("[settingsStore] persist error:", e));
  return updated;
}
