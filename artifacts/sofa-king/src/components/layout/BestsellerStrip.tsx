import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchProducts, type Product } from "@/lib/api";
import { displayName } from "@/lib/categories";

export function BestsellerStrip() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts()
      .then((all) => setItems(all.filter((p) => p.disponibilidade && p.bestseller)))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  const loop = [...items, ...items, ...items];

  return (
    <div className="bg-background border-t border-border/50 border-b border-border/50 py-3 sm:py-5 overflow-hidden" data-testid="bestseller-strip">
      <div className="flex items-end gap-6 sm:gap-12 whitespace-nowrap animate-marquee">
        {loop.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={`/produto/${p.id}`}
            className="shrink-0 flex flex-col items-center text-center group w-[120px] sm:w-[160px]"
            data-testid={`bestseller-item-${p.id}`}
          >
            <div className="w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] overflow-hidden bg-muted/40 border border-border/50 group-hover:border-primary/40 transition-colors shadow-sm">
              {p.image ? (
                <img
                  src={p.image}
                  alt={displayName(p.name, p.category)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-[10px]">
                  Sem foto
                </div>
              )}
            </div>
            <div className="mt-2 sm:mt-3 text-[12px] sm:text-base font-medium text-foreground group-hover:text-primary leading-tight whitespace-normal line-clamp-2">
              {displayName(p.name, p.category)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
