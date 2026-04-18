export interface ProductCategory {
    id: string;
    label: string;
    suffix: string;
  }

  export const CATEGORIES: ProductCategory[] = [
    { id: "retratil",  label: "Sofá Retrátil",   suffix: "Retrátil" },
    { id: "cama",      label: "Sofá-cama",        suffix: "Cama" },
    { id: "canto",     label: "Sofá de Canto",    suffix: "de Canto" },
    { id: "organicos", label: "Sofá Orgânico",    suffix: "Orgânico" },
    { id: "living",    label: "Sofá Living",      suffix: "Living" },
    { id: "fixo",      label: "Sofá Fixo",        suffix: "Fixo" },
    { id: "chaise",    label: "Sofá Chaise",      suffix: "Chaise" },
    { id: "ilha",      label: "Sofá Ilha",        suffix: "Ilha" },
    { id: "modulos",   label: "Módulos",          suffix: "Módulos" },
  ];

  export function getCategory(id: string): ProductCategory | null {
    return id ? CATEGORIES.find(c => c.id === id) ?? null : null;
  }

  export function displayName(name: string, categoryId?: string): string {
    const cat = getCategory(categoryId ?? "");
    if (!cat) return name;
    const trimmed = name.trim();
    return trimmed.toLowerCase().endsWith(cat.suffix.toLowerCase())
      ? trimmed
      : `${trimmed} ${cat.suffix}`;
  }
  