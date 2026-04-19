export interface SizeOption {
  label: string;
  basePrice: number;
  albumSurcharges?: Record<string, number>;
  foamSurcharges?: Record<string, number>;
}

export interface DiagramaAnotacao {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  sublabel: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  image: string;
  images: string[];
  category: string;
  dimensions: string;
  colors: string[];
  fabrics: string[];
  disponibilidade: boolean;
  prazoEntrega: string;
  sizes: SizeOption[];
  bestseller?: boolean;
  diagramaUrl?: string;
  diagramaAnotacoes?: DiagramaAnotacao[];
}

export interface Material {
  id: string;
  type: "espuma";
  name: string;
  description: string;
  priceAdjustment: number;
  /** Optional per-size overrides keyed by size label. Falls back to `priceAdjustment`. */
  priceAdjustmentBySize?: Record<string, number>;
  weightSupport?: string;
  comfortLevel?: string;
  useIndication?: string;
  longTermBehavior?: string;
  active: boolean;
  imageUrl?: string;
}

export function resolveFoamAdjustment(m: Pick<Material, "priceAdjustment" | "priceAdjustmentBySize"> | null | undefined, sizeLabel: string): number {
  if (!m) return 0;
  const v = m.priceAdjustmentBySize?.[sizeLabel];
  return typeof v === "number" && Number.isFinite(v) ? v : m.priceAdjustment;
}

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
  /** Optional per-size overrides keyed by size label. Falls back to `surcharge`. */
  surchargeBySize?: Record<string, number>;
  fabrics: FabricSample[];
  active: boolean;
}

export function resolveAlbumSurcharge(a: Pick<Album, "surcharge" | "surchargeBySize"> | null | undefined, sizeLabel: string): number {
  if (!a) return 0;
  const v = a.surchargeBySize?.[sizeLabel];
  return typeof v === "number" && Number.isFinite(v) ? v : a.surcharge;
}

export interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number | null;
}

export interface Stats {
  totalViews: number;
  totalWhatsapp: number;
  views7d: number;
  views30d: number;
  whatsapp7d: number;
  whatsapp30d: number;
  topViewed: { id: string; name: string; count: number }[];
  topWhatsapp: { id: string; name: string; count: number }[];
}

export interface WhatsappEvent {
  id: string;
  productId?: string;
  productName?: string;
  ts: number;
}

const BASE = "/api";
const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/products`);
  if (!res.ok) throw new Error("Erro ao carregar produtos");
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${BASE}/products/${id}`);
  if (!res.ok) throw new Error("Produto não encontrado");
  return res.json();
}

export async function fetchAdminStatus(): Promise<{ isAdmin: boolean; signedIn: boolean; email?: string }> {
  const res = await fetch(`${BASE}/admin/me`, { credentials: "include" });
  if (!res.ok) return { isAdmin: false, signedIn: false };
  return res.json();
}

export async function createProduct(data: Omit<Product, "id">): Promise<Product> {
  const res = await fetch(`${BASE}/products`, {
    method: "POST", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar produto");
  return res.json();
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>): Promise<Product> {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar produto");
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BASE}/products/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Erro ao excluir produto");
}

// --- Tracking ---
export function trackView(data: { productId?: string; productName?: string; path?: string }): void {
  fetch(`${BASE}/events/view`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) }).catch(() => {});
}

export function trackWhatsapp(data: { productId?: string; productName?: string }): void {
  fetch(`${BASE}/events/whatsapp`, { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) }).catch(() => {});
}

// --- Materials (espumas) ---
export async function fetchMaterials(): Promise<Material[]> {
  const res = await fetch(`${BASE}/materials`);
  if (!res.ok) throw new Error("Erro ao carregar materiais");
  return res.json();
}

export async function fetchAdminMaterials(): Promise<Material[]> {
  const res = await fetch(`${BASE}/admin/materials`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar materiais");
  return res.json();
}

export async function createMaterial(data: Omit<Material, "id">): Promise<Material> {
  const res = await fetch(`${BASE}/admin/materials`, {
    method: "POST", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar material");
  return res.json();
}

export async function updateMaterial(id: string, data: Partial<Omit<Material, "id">>): Promise<Material> {
  const res = await fetch(`${BASE}/admin/materials/${id}`, {
    method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar material");
  return res.json();
}

export async function deleteMaterial(id: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/materials/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Erro ao excluir material");
}

// --- Albums ---
export async function fetchAlbums(): Promise<Album[]> {
  const res = await fetch(`${BASE}/albums`);
  if (!res.ok) throw new Error("Erro ao carregar álbuns");
  return res.json();
}
export async function fetchAdminAlbums(): Promise<Album[]> {
  const res = await fetch(`${BASE}/admin/albums`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar álbuns");
  return res.json();
}
export async function createAlbum(data: Omit<Album, "id">): Promise<Album> {
  const res = await fetch(`${BASE}/admin/albums`, {
    method: "POST", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar álbum");
  return res.json();
}
export async function updateAlbum(id: string, data: Partial<Omit<Album, "id">>): Promise<Album> {
  const res = await fetch(`${BASE}/admin/albums/${id}`, {
    method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar álbum");
  return res.json();
}
export async function deleteAlbum(id: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/albums/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Erro ao excluir álbum");
}

// --- Stats / WhatsApp / Clients ---
export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/admin/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar estatísticas");
  return res.json();
}

export async function fetchWhatsappEvents(): Promise<WhatsappEvent[]> {
  const res = await fetch(`${BASE}/admin/whatsapp-events`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar eventos");
  return res.json();
}

export async function fetchClients(): Promise<{ totalCount: number; users: Client[] }> {
  const res = await fetch(`${BASE}/admin/clients`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar clientes");
  return res.json();
}

// --- Known sizes (union across all products) ---
export async function fetchKnownSizes(): Promise<string[]> {
  const res = await fetch(`${BASE}/admin/known-sizes`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar metragens");
  return res.json();
}

// --- Site settings ---
export interface SiteSettings {
  heroImage: string;
  pixDiscountPct: number;
  maxInstallments: number;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) return { heroImage: "/images/hero.png", pixDiscountPct: 10, maxInstallments: 10 };
  return res.json();
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const res = await fetch(`${BASE}/admin/settings`, {
    method: "PUT", headers: jsonHeaders, credentials: "include", body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao salvar configurações");
  return res.json();
}

// --- Image upload ---
export async function uploadImage(file: File): Promise<{ url: string; objectPath: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/admin/upload-image`, { method: "POST", credentials: "include", body: fd });
  if (!res.ok) throw new Error("Erro no upload da imagem");
  return res.json();
}
