import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const EVENTS_FILE = join(DATA_DIR, "events.json");

export interface Event {
  id: string;
  type: "view" | "whatsapp";
  productId?: string;
  productName?: string;
  path?: string;
  userEmail?: string;
  ts: number;
}

interface EventsFile {
  events: Event[];
}

function load(): EventsFile {
  if (!existsSync(EVENTS_FILE)) return { events: [] };
  try {
    return JSON.parse(readFileSync(EVENTS_FILE, "utf-8")) as EventsFile;
  } catch {
    return { events: [] };
  }
}

function save(data: EventsFile): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  // Cap at 5000 most recent events
  if (data.events.length > 5000) {
    data.events = data.events.slice(-5000);
  }
  writeFileSync(EVENTS_FILE, JSON.stringify(data), "utf-8");
}

export function track(ev: Omit<Event, "id" | "ts">): Event {
  const data = load();
  const event: Event = {
    id: Math.random().toString(36).slice(2, 11),
    ts: Date.now(),
    ...ev,
  };
  data.events.push(event);
  save(data);
  return event;
}

export function getAll(): Event[] {
  return load().events;
}

export function getStats() {
  const events = load().events;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last7 = events.filter((e) => now - e.ts < 7 * day);
  const last30 = events.filter((e) => now - e.ts < 30 * day);

  const views = events.filter((e) => e.type === "view");
  const whatsapps = events.filter((e) => e.type === "whatsapp");

  const productViewCounts = new Map<string, { name: string; count: number }>();
  for (const e of views) {
    if (!e.productId) continue;
    const cur = productViewCounts.get(e.productId) || { name: e.productName || e.productId, count: 0 };
    cur.count++;
    cur.name = e.productName || cur.name;
    productViewCounts.set(e.productId, cur);
  }
  const topViewed = Array.from(productViewCounts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const whatsappProductCounts = new Map<string, { name: string; count: number }>();
  for (const e of whatsapps) {
    const key = e.productId || "_geral";
    const cur = whatsappProductCounts.get(key) || { name: e.productName || (key === "_geral" ? "Botão geral" : key), count: 0 };
    cur.count++;
    whatsappProductCounts.set(key, cur);
  }
  const topWhatsapp = Array.from(whatsappProductCounts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalViews: views.length,
    totalWhatsapp: whatsapps.length,
    views7d: last7.filter((e) => e.type === "view").length,
    views30d: last30.filter((e) => e.type === "view").length,
    whatsapp7d: last7.filter((e) => e.type === "whatsapp").length,
    whatsapp30d: last30.filter((e) => e.type === "whatsapp").length,
    topViewed,
    topWhatsapp,
  };
}

export function getWhatsappEvents(limit = 100): Event[] {
  const events = load().events.filter((e) => e.type === "whatsapp");
  return events.slice(-limit).reverse();
}
