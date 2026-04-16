export type ProductCategory = "retratil" | "canto" | "modulos" | "";

export interface CategoryDef {
  id: Exclude<ProductCategory, "">;
  label: string;
  suffix: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "retratil", label: "Sofá Retrátil", suffix: "Retrátil" },
  { id: "canto", label: "Sofá de Canto", suffix: "de Canto" },
  { id: "modulos", label: "Módulos", suffix: "Módulos" },
];

export function getCategory(id: string | null | undefined): CategoryDef | null {
  if (!id) return null;
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

export function displayName(name: string, category: string | null | undefined): string {
  const c = getCategory(category ?? "");
  if (!c) return name;
  // Avoid duplicating the suffix if the admin already typed it in the name.
  const trimmed = name.trim();
  if (trimmed.toLowerCase().endsWith(c.suffix.toLowerCase())) return trimmed;
  return `${trimmed} ${c.suffix}`;
}

export const PIX_DISCOUNT_PCT = 10;
export const MAX_INSTALLMENTS = 10;

export function applyPixDiscount(value: number): number {
  return value * (1 - PIX_DISCOUNT_PCT / 100);
}
