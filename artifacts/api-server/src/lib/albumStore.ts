import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { dbQuery } from "./db.js";

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
  surchargeBySize?: Record<string, number>;
  fabrics: FabricSample[];
  active: boolean;
}

interface AlbumFile { albums: Album[]; }

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

function loadFromFile(): AlbumFile {
  if (!existsSync(FILE)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as AlbumFile;
  } catch { return DEFAULT_DATA; }
}

let _cache: Album[] | null = null;

function getCache(): Album[] {
  if (_cache === null) _cache = loadFromFile().albums;
  return _cache;
}

async function persistAll(albums: Album[]): Promise<void> {
  await dbQuery("DELETE FROM materials WHERE id LIKE 'album-%'");
  for (const a of albums) {
    await dbQuery(
      `INSERT INTO materials (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = $2`,
      [a.id, JSON.stringify({ ...a, _type: "album" })]
    );
  }
}

async function persistOne(a: Album): Promise<void> {
  await dbQuery(
    `INSERT INTO materials (id, data) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $2`,
    [a.id, JSON.stringify({ ...a, _type: "album" })]
  );
}

async function deleteOne(id: string): Promise<void> {
  await dbQuery("DELETE FROM materials WHERE id = $1", [id]);
}

export async function initAlbumStore(): Promise<void> {
  try {
    const result = await dbQuery("SELECT id, data FROM materials WHERE data->>'_type' = 'album' ORDER BY created_at");
    if (result && result.rows.length > 0) {
      _cache = result.rows.map((r) => {
        const { _type, ...rest } = r.data;
        return rest as Album;
      });
      console.log(`[albumStore] Loaded ${_cache.length} albums from database`);
    } else {
      const fromFile = loadFromFile().albums;
      _cache = fromFile;
      if (fromFile.length > 0) {
        await persistAll(fromFile);
        console.log(`[albumStore] Migrated ${fromFile.length} albums from JSON to database`);
      }
    }
  } catch (err) {
    console.error("[albumStore] DB init failed, using file fallback:", err);
    _cache = loadFromFile().albums;
  }
}

export function getAll(): Album[] { return getCache(); }
export function getActive(): Album[] { return getCache().filter((a) => a.active); }

export function resolveAlbumSurcharge(album: Album, sizeLabel: string): number {
  const v = album.surchargeBySize?.[sizeLabel];
  return typeof v === "number" && Number.isFinite(v) ? v : album.surcharge;
}

export function create(data: Omit<Album, "id">): Album {
  const albums = getCache();
  const id = `album-${randomUUID().slice(0, 8)}`;
  const album: Album = { ...data, id };
  albums.push(album);
  persistOne(album).catch((e) => console.error("[albumStore] persist error:", e));
  return album;
}

export function update(id: string, data: Partial<Omit<Album, "id">>): Album | null {
  const albums = getCache();
  const idx = albums.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const next = { ...albums[idx], ...data };
  albums[idx] = next;
  persistOne(next).catch((e) => console.error("[albumStore] persist error:", e));
  return next;
}

export function remove(id: string): boolean {
  const albums = getCache();
  const idx = albums.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  albums.splice(idx, 1);
  deleteOne(id).catch((e) => console.error("[albumStore] delete error:", e));
  return true;
}
