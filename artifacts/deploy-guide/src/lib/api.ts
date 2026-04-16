export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  image: string;
  dimensions: string;
  colors: string[];
  fabrics: string[];
  disponibilidade: boolean;
  prazoEntrega: string;
}

const BASE = "/api";

function token(): string | null {
  return localStorage.getItem("sk_admin_token");
}

function authHeaders(): HeadersInit {
  const t = token();
  return t ? { "x-admin-token": t, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

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

export async function adminLogin(password: string): Promise<string> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Senha incorreta");
  const data = await res.json();
  localStorage.setItem("sk_admin_token", data.token);
  return data.token;
}

export async function adminLogout(): Promise<void> {
  await fetch(`${BASE}/admin/logout`, { method: "POST", headers: authHeaders() });
  localStorage.removeItem("sk_admin_token");
}

export async function verifyToken(): Promise<boolean> {
  const t = token();
  if (!t) return false;
  const res = await fetch(`${BASE}/admin/verify`, { headers: { "x-admin-token": t } });
  const data = await res.json();
  return data.valid === true;
}

export async function createProduct(data: Omit<Product, "id">): Promise<Product> {
  const res = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar produto");
  return res.json();
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>): Promise<Product> {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar produto");
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erro ao excluir produto");
}
