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
    <div className="bg-secondary/40 border-t border-border/50 border-b border-border/50 py-2.5 overflow-hidden" data-testid="bestseller-strip">
      <div className="flex items-center gap-2 whitespace-nowrap animate-marquee">
        <span className="px-3 text-[10px] font-bold tracking-[0.25em] uppercase text-primary shrink-0">⭐ Bestsellers</span>
        {loop.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            href={`/produto/${p.id}`}
            className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border/60 hover:border-primary/60 transition-colors"
            data-testid={`bestseller-item-${p.id}`}
          >
            {p.image && (
              <span className="w-7 h-7 rounded-full overflow-hidden bg-muted/40 shrink-0">
                <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
              </span>
            )}
            <span className="text-xs font-medium text-foreground">
              {displayName(p.name, p.category)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
