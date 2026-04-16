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
    method: "POST",
    headers: jsonHeaders,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar produto");
  return res.json();
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>): Promise<Product> {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PUT",
    headers: jsonHeaders,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar produto");
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erro ao excluir produto");
}
