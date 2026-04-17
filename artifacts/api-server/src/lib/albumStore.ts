import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const FILE = join(DATA_DIR, "albums.json");

export interface FabricSample {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  surcharge: number;
  /** Optional per-size overrides keyed by size label (e.g. "2,20 m"). Falls back to `surcharge`. */
  surchargeBySize?: Record<string, number>;
  fabrics: FabricSample[];
  active: boolean;
}

interface AlbumFile {
  albums: Album[];
}

const DEFAULT_DATA: AlbumFile = {
  albums: [
    {
      id: "album-lisboa",
      name: "Álbum Lisboa",
      description: "Linhos nacionais — toque natural e respirável.",
      surcharge: 0,
      fabrics: [
        { id: "linho-cru", name: "Linho Cru", imageUrl: "" },
        { id: "linho-grafite", name: "Linho Grafite", imageUrl: "" },
        { id: "linho-marinho", name: "Linho Marinho", imageUrl: "" },
      ],
      active: true,
    },
  ],
};

function load(): AlbumFile {
  if (!existsSync(FILE)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as AlbumFile;
  } catch {
    return DEFAULT_DATA;
  }
}

function save(data: AlbumFile): void {
  writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
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

export function resolveAlbumSurcharge(album: Album, sizeLabel: string): number {
  const v = album.surchargeBySize?.[sizeLabel];
  return typeof v === "number" && Number.isFinite(v) ? v : album.surcharge;
}

export function getAll(): Album[] {
  return load().albums;
}
export function getActive(): Album[] {
  return load().albums.filter((a) => a.active);
}
export function getById(id: string): Album | undefined {
  return load().albums.find((a) => a.id === id);
}

export function create(data: Omit<Album, "id">): Album {
  const d = load();
  const base = `album-${slug(data.name)}`;
  const id = d.albums.some((a) => a.id === base) ? `${base}-${Date.now()}` : base;
  const normalized: Album = {
    ...data,
    id,
    surchargeBySize: normalizeBySize(data.surchargeBySize),
    fabrics: (data.fabrics || []).map((f) => ({
      id: f.id || randomUUID(),
      name: f.name,
      imageUrl: f.imageUrl || "",
    })),
  };
  d.albums.push(normalized);
  save(d);
  return normalized;
}

export function update(id: string, data: Partial<Omit<Album, "id">>): Album | null {
  const d = load();
  const idx = d.albums.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const next = { ...d.albums[idx], ...data };
  if (data.surchargeBySize !== undefined) {
    next.surchargeBySize = normalizeBySize(data.surchargeBySize);
  }
  if (data.fabrics) {
    next.fabrics = data.fabrics.map((f) => ({
      id: f.id || randomUUID(),
      name: f.name,
      imageUrl: f.imageUrl || "",
    }));
  }
  d.albums[idx] = next;
  save(d);
  return next;
}

export function remove(id: string): boolean {
  const d = load();
  const idx = d.albums.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  d.albums.splice(idx, 1);
  save(d);
  return true;
}
