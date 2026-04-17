import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/settings.json");

export interface SiteSettings {
  heroImage: string;
}

const DEFAULTS: SiteSettings = {
  heroImage: "/images/hero.png",
};

function read(): SiteSettings {
  try {
    if (!existsSync(DATA_FILE)) return { ...DEFAULTS };
    const raw = readFileSync(DATA_FILE, "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(settings: SiteSettings): void {
  writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export function getSettings(): SiteSettings {
  return read();
}

export function updateSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = read();
  const updated = { ...current, ...patch };
  write(updated);
  return updated;
}
