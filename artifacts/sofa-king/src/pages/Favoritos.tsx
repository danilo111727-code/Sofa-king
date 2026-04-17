import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Heart, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useFavorites } from "@/hooks/useFavorites";
import { fetchProducts, type Product } from "@/lib/api";
import { displayName, applyPixDiscount, PIX_DISCOUNT_PCT, MAX_INSTALLMENTS } from "@/lib/categories";

export default function Favoritos() {
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const favoriteProducts = products.filter((p) => isFavorite(p.id));

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />

      <main className="flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-serif font-bold text-foreground">Seus Favoritos</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {favoriteProducts.length > 0
              ? `${favoriteProducts.length} ${favoriteProducts.length === 1 ? "modelo salvo" : "modelos salvos"}`
              : "Você ainda não favoritou nenhum modelo."}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[340px] rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                Navegue pelo catálogo e toque no coração dos modelos que gostar.
              </p>
              <Link href="/modelos">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                  Ver catálogo <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProducts.map((product) => (
                <div
                  key={product.id}
                  className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={displayName(product.name, product.category)}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-xs">
                        Sem foto
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                      aria-label="Remover dos favoritos"
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                      {displayName(product.name, product.category)}
                    </h3>
                    {product.price > 0 ? (
                      <div className="space-y-0.5 mb-3">
                        <p className="text-sm font-semibold text-foreground">
                          {MAX_INSTALLMENTS}x de R$ {(product.price / MAX_INSTALLMENTS).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-accent font-medium">
                          PIX à vista R$ {applyPixDiscount(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-muted-foreground font-normal ml-1">({PIX_DISCOUNT_PCT}% OFF)</span>
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground mb-3">Consultar valor</span>
                    )}
                    <div className="mt-auto pt-3 border-t border-border">
                      <Link href={`/produto/${product.id}`}>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                          Ver detalhes <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
