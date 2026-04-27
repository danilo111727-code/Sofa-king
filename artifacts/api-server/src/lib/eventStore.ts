import { dbQuery } from "./db.js";

export interface OrderItem {
  productId: string;
  productName: string;
  sizeLabel?: string;
  basePrice?: number;
  albumName?: string | null;
  fabricName?: string | null;
  foamName?: string | null;
  qty: number;
  unitPrice: number;
}

export interface OrderSnapshot {
  items: OrderItem[];
  subtotal: number;
  payment: "pix" | "cartao";
  paymentTotal: number;
  installments?: number;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface Event {
  id: string;
  type: "view" | "whatsapp";
  productId?: string;
  productName?: string;
  path?: string;
  userEmail?: string;
  /** Snapshot do carrinho quando o evento veio do checkout do carrinho. */
  order?: OrderSnapshot;
  ts: number;
}

let _cache: Event[] | null = null;
function getCache(): Event[] {
  if (_cache === null) _cache = [];
  return _cache;
}

export async function initEventStore(): Promise<void> {
  try {
    const result = await dbQuery("SELECT id, data FROM events ORDER BY created_at DESC LIMIT 5000");
    if (result) {
      _cache = result.rows.map((r) => r.data as Event);
      console.log(`[eventStore] Loaded ${_cache.length} events from database`);
    }
  } catch (err) {
    console.error("[eventStore] DB init failed:", err);
    _cache = [];
  }
}

export function track(ev: Omit<Event, "id" | "ts">): Event {
  const events = getCache();
  const event: Event = {
    id: Math.random().toString(36).slice(2, 11),
    ts: Date.now(),
    ...ev,
  };
  events.push(event);
  if (events.length > 5000) events.splice(0, events.length - 5000);
  dbQuery(
    "INSERT INTO events (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
    [event.id, JSON.stringify(event)]
  ).catch((e) => console.error("[eventStore] persist error:", e));
  return event;
}

export function getAll(): Event[] {
  return getCache();
}

export function getStats() {
  const events = getCache();
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
  const events = getCache().filter((e) => e.type === "whatsapp");
  return events.slice(-limit).reverse();
}
