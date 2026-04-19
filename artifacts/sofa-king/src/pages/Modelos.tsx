import { Link, useSearch, useLocation } from "wouter";
import { ArrowRight, Search, X, Heart, ShoppingCart } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useEffect, useState, useMemo } from "react";
import { fetchProducts, trackView, type Product } from "@/lib/api";
import { CATEGORIES, displayName, getCategory } from "@/lib/categories";
import { useSiteSettings, applyCardMarkup } from "@/contexts/SiteSettingsContext";
import { useFavorites } from "@/hooks/useFavorites";

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

function useFilters(): { category: string; bestseller: boolean } {
  const search = useSearch();
  return useMemo(() => {
    const params = new URLSearchParams(search);
    const raw = params.get("categoria") ?? "";
    return {
      category: VALID_CATEGORY_IDS.has(raw as any) ? raw : "",
      bestseller: params.get("destaque") === "1",
    };
  }, [search]);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Modelos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { category: activeCategory, bestseller: onlyBestsellers } = useFilters();
  const activeCatDef = getCategory(activeCategory);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { pixDiscountPct, maxInstallments } = useSiteSettings();
  const [, navigate] = useLocation();

  useEffect(() => {
    const path = onlyBestsellers
      ? "/modelos?destaque=1"
      : activeCategory ? `/modelos?categoria=${activeCategory}` : "/modelos";
    trackView({ path });
  }, [activeCategory, onlyBestsellers]);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    let avail = products.filter((p) => p.disponibilidade);
    if (onlyBestsellers) avail = avail.filter((p) => p.bestseller);
    if (activeCategory) avail = avail.filter((p) => p.category === activeCategory);
    const q = normalize(query.trim());
    if (q) {
      avail = avail.filter((p) => {
        const full = normalize(displayName(p.name, p.category));
        return full.includes(q);
      });
    }
    return [...avail].reverse();
  }, [products, activeCategory, onlyBestsellers, query]);

  const heading = onlyBestsellers
    ? "⭐ Bestsellers"
    : activeCatDef
    ? activeCatDef.label
    : "Todos os modelos";

  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow pb-20 sm:pb-8">
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-10">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3 font-semibold">Catálogo</p>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="text-catalog-title">
                {heading}
              </h1>
              <div className="w-12 h-[2px] bg-accent mx-auto mb-5" />
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Personalize cada peça em <strong className="text-foreground">metragem, tecido e espuma</strong>.
              </p>
            </div>

            {/* Search */}
            <div className="max-w-xl mx-auto mb-6 relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome do modelo…"
                className="w-full bg-background border border-border rounded-full py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                data-testid="input-search-products"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                  data-testid="button-clear-search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 justify-center mb-10" data-testid="category-filter">
              <Link
                href="/modelos"
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  !activeCategory && !onlyBestsellers
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
                data-testid="filter-category-todos"
              >
                Todos
              </Link>
              <Link
                href="/modelos?destaque=1"
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  onlyBestsellers
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
                data-testid="filter-bestseller"
              >
                ⭐ Bestsellers
              </Link>
              {CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  href={`/modelos?categoria=${c.id}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    activeCategory === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                  data-testid={`filter-category-${c.id}`}
                >
                  {c.label}
                </Link>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-muted/30 rounded-lg h-72 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl max-w-md mx-auto">
                <p className="text-muted-foreground mb-4">
                  {query
                    ? `Nenhum modelo encontrado para "${query}".`
                    : activeCatDef
                    ? `Nenhum modelo de ${activeCatDef.label} disponível no momento.`
                    : "Nenhum modelo disponível no momento."}
                </p>
                {(activeCatDef || onlyBestsellers || query) && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-primary font-medium hover:underline"
                  >
                    <Link href="/modelos">Ver todos os modelos</Link>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group group/card flex flex-col bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl cursor-pointer"
                    onClick={() => navigate(`/produto/${product.id}`)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={displayName(product.name, product.category)}
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/card:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-xs">
                          Sem foto
                        </div>
                      )}
                      {product.category && (
                        <span className="absolute top-3 left-3 text-[10px] font-semibold tracking-wider uppercase bg-white/90 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-full border border-border/50">
                          {getCategory(product.category)?.label}
                        </span>
                      )}
                      {product.bestseller && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                          ⭐ Bestseller
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                        aria-label={isFavorite(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        data-testid={`button-favorite-${product.id}`}
                      >
                        <Heart className={`w-4 h-4 transition-colors ${isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-foreground/60"}`} />
                      </button>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3
                        className="text-lg font-serif font-bold text-foreground group-hover/card:text-primary transition-colors leading-tight mb-2"
                        data-testid={`text-product-name-${product.id}`}
                      >
                        {displayName(product.name, product.category)}
                      </h3>
                      {product.price > 0 ? (
                        <div className="space-y-0.5 mb-2" data-testid={`text-product-price-${product.id}`}>
                          <p className="text-sm font-bold text-green-700">
                            PIX R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cartão: {maxInstallments}x de R$ {(applyCardMarkup(product.price, pixDiscountPct) / maxInstallments).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground mb-2">Consultar valor</span>
                      )}
                      {product.description && (
                        <p
                          className="text-xs text-muted-foreground leading-relaxed flex-grow line-clamp-2"
                          data-testid={`text-product-desc-${product.id}`}
                        >
                          {product.description}
                        </p>
                      )}
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          Ver detalhes <ArrowRight className="w-3 h-3 transform group-hover/card:translate-x-1 transition-transform" />
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/produto/${product.id}`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                          aria-label="Adicionar ao carrinho"
                          data-testid={`button-cart-${product.id}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
