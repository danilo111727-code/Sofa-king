import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BestsellerStrip } from "@/components/layout/BestsellerStrip";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo, useRef, type ReactNode } from "react";

function HorizontalScrollRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Anterior"
        className="hidden sm:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-foreground text-background shadow-md hover:bg-foreground/90"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div
        ref={ref}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        data-testid="scroll-row-products"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Próximo"
        className="hidden sm:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-foreground text-background shadow-md hover:bg-foreground/90"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
import { fetchProducts, fetchSiteSettings, trackView, type Product } from "@/lib/api";
import { CATEGORIES, displayName, getCategory } from "@/lib/categories";
import { useSiteSettings, applyCardMarkup } from "@/contexts/SiteSettingsContext";

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

function useFilters(): { category: string; bestseller: boolean } {
  const [location] = useLocation();
  return useMemo(() => {
    const noHash = location.split("#")[0];
    const qs = noHash.includes("?") ? noHash.slice(noHash.indexOf("?") + 1) : "";
    const search = qs || (typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "");
    const params = new URLSearchParams(search);
    const raw = params.get("categoria") ?? "";
    return {
      category: VALID_CATEGORY_IDS.has(raw as any) ? raw : "",
      bestseller: params.get("destaque") === "1",
    };
  }, [location]);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState("/images/hero.png");
  const { category: activeCategory, bestseller: onlyBestsellers } = useFilters();
  const activeCatDef = getCategory(activeCategory);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { pixDiscountPct, maxInstallments } = useSiteSettings();
  const [, navigate] = useLocation();

  useEffect(() => {
    const path = onlyBestsellers
      ? "/?destaque=1"
      : activeCategory ? `/?categoria=${activeCategory}` : "/";
    trackView({ path });
  }, [activeCategory, onlyBestsellers]);

  const filteredProducts = useMemo(() => {
    let avail = products.filter((p) => p.disponibilidade);
    if (onlyBestsellers) avail = avail.filter((p) => p.bestseller);
    if (activeCategory) avail = avail.filter((p) => p.category === activeCategory);
    return [...avail].reverse();
  }, [products, activeCategory, onlyBestsellers]);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchSiteSettings()
      .then((s) => setHeroImage(s.heroImage))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow pb-20 sm:pb-8">
        {/* Hero Section */}
        <section className="bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-6 sm:pb-10">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1] text-foreground" data-testid="text-hero-title">
              Não fazemos em série.{" "}
              <em className="italic font-normal">Fazemos o seu sofá.</em>
            </h1>
          </div>

          <BestsellerStrip />

          <div className="w-full aspect-[16/10] sm:aspect-[21/9] overflow-hidden bg-secondary/50">
            <img
              src={heroImage}
              alt="Sofá minimalista moderno em sala clara e arejada"
              className="w-full h-full object-cover object-center"
              data-testid="img-hero"
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 flex justify-center sm:justify-start">
            <Link href="/modelos" data-testid="button-hero-cta">
              <Button
                size="default"
                variant="outline"
                className="bg-background hover:bg-background/80 border-foreground/30 font-medium h-12 px-10 rounded-full text-sm tracking-widest uppercase"
              >
                Explorar catálogo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Horizontal scroll row of models */}
        <section className="py-14 md:py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 md:mb-8">
              <div>
                <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2 font-semibold">Nossos modelos</p>
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-foreground">
                  Explore o catálogo
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="shrink-0 w-[260px] md:w-[300px] h-[280px] bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <HorizontalScrollRow>
                {products
                  .filter((p) => p.disponibilidade)
                  .slice()
                  .reverse()
                  .map((product) => (
                    <div
                      key={product.id}
                      className="group shrink-0 w-[220px] sm:w-[260px] md:w-[300px] snap-start cursor-pointer"
                      onClick={() => navigate(`/produto/${product.id}`)}
                      data-testid={`scroll-card-${product.id}`}
                    >
                      <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-lg">
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
                          {product.bestseller && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wider uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              ⭐ Bestseller
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                            aria-label="Favoritar"
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-foreground/60"}`} />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-1 line-clamp-2 min-h-[2.6rem]">
                            {displayName(product.name, product.category)}
                          </h3>
                          {product.price > 0 ? (
                            <div className="space-y-0.5 mt-1">
                              <p className="text-sm font-bold text-green-700">
                                PIX R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cartão: {maxInstallments}x de R$ {(applyCardMarkup(product.price, pixDiscountPct) / maxInstallments).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Consultar valor</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/produto/${product.id}`); }}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Adicionar ao carrinho
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </HorizontalScrollRow>
            )}

            <div className="flex justify-center mt-8">
              <Link
                href="/modelos"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                data-testid="button-view-all"
              >
                Visualizar todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {false && (
        <section id="produtos" className="py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4 font-semibold">Vagas abertas</p>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-5" data-testid="text-section-title">
                {onlyBestsellers ? "⭐ Bestsellers" : activeCatDef?.label ?? "Modelos disponíveis agora"}
              </h2>
              <div className="w-12 h-[2px] bg-accent mx-auto mb-6" />
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Vendas pelo site são feitas a partir dos nossos <strong className="text-foreground">modelos padronizados</strong>, que você pode personalizar em <strong className="text-foreground">tecido, espuma e metragem</strong>.
              </p>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2 justify-center mb-12" data-testid="category-filter">
              <Link
                href="/"
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
                href="/?destaque=1"
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
                  href={`/?categoria=${c.id}`}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-muted/30 rounded-lg h-80 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl max-w-md mx-auto">
                <p className="text-muted-foreground mb-4">
                  {activeCatDef
                    ? `Nenhum modelo de ${activeCatDef?.label} disponível no momento.`
                    : "Nenhum modelo disponível no momento."}
                </p>
                {activeCatDef && (
                  <Link href="/" className="text-primary font-medium hover:underline">
                    Ver todos os modelos
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-12">
                {filteredProducts.map((product) => (
                  <Link key={product.id} href={`/produto/${product.id}`} className="group group/card" data-testid={`card-product-${product.id}`}>
                    <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/20 transition-all duration-500 hover:shadow-xl">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                        <img
                          src={product.image}
                          alt={displayName(product.name, product.category)}
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors duration-500" />
                        {product.category && (
                          <span className="absolute top-3 left-3 text-[10px] font-semibold tracking-wider uppercase bg-white/90 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-full border border-border/50">
                            {getCategory(product.category)?.label}
                          </span>
                        )}
                      </div>
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <h3 className="text-2xl font-serif font-bold text-foreground group-hover/card:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
                            {displayName(product.name, product.category)}
                          </h3>
                          <span className="text-xl font-medium text-accent whitespace-nowrap" data-testid={`text-product-price-${product.id}`}>
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed flex-grow" data-testid={`text-product-desc-${product.id}`}>
                          {product.description}
                        </p>
                        {product.prazoEntrega && (
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            🚚 Entrega: {product.prazoEntrega}
                          </p>
                        )}
                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-sm font-medium text-primary">
                          <span>Ver detalhes do produto</span>
                          <ArrowRight className="w-4 h-4 transform group-hover/card:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Manifesto / Sobre o Ateliê */}
        <section className="relative py-28 bg-gradient-to-b from-secondary/40 via-background to-background overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
            <div className="absolute top-10 left-10 font-serif text-[20rem] leading-none text-foreground select-none">"</div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5 font-semibold">Nosso ateliê</p>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-[1.1] mb-8">
                Cada peça nasce de uma <em className="italic text-accent">conversa</em>, não de uma esteira.
              </h2>
              <div className="w-16 h-[2px] bg-accent mx-auto mb-8" />
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Somos um ateliê — não uma fábrica. Aqui o estofado começa quando você nos diz como quer viver na sua sala. A partir daí, escolhemos juntos o desenho, o tecido, as medidas e os acabamentos. Cada vaga aberta na nossa agenda é uma nova história sendo construída à mão.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60 shadow-sm">
              <div className="bg-background p-10 md:p-12 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif italic text-4xl text-accent">i.</span>
                  <h3 className="text-xl font-serif font-bold text-foreground">Você personaliza</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  As vendas pelo site são dos nossos modelos padronizados — você escolhe a <strong className="text-foreground">metragem</strong>, o <strong className="text-foreground">tecido</strong> e a <strong className="text-foreground">espuma</strong> ideais para sua peça.
                </p>
              </div>
              <div className="bg-background p-10 md:p-12 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif italic text-4xl text-accent">ii.</span>
                  <h3 className="text-xl font-serif font-bold text-foreground">Feito à mão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Estrutura cortada, montada, estofada e costurada peça por peça dentro do nosso ateliê em Feira de Santana. O tempo de cada projeto é o tempo do bem-feito.
                </p>
              </div>
              <div className="bg-background p-10 md:p-12 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif italic text-4xl text-accent">iii.</span>
                  <h3 className="text-xl font-serif font-bold text-foreground">Vagas limitadas</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Trabalhamos com agenda. Os modelos que aparecem disponíveis no site são as vagas que liberamos agora. Quando enche, abrimos as próximas.
                </p>
              </div>
            </div>

            <div className="mt-20 max-w-3xl mx-auto text-center">
              <p className="font-serif text-2xl md:text-3xl italic text-foreground/90 leading-relaxed">
                "Não fazemos sofás em série.<br className="hidden md:block" /> Fazemos o seu sofá."
              </p>
              <p className="mt-6 text-xs tracking-[0.3em] uppercase text-muted-foreground">— Sofá King · Estofados planejados</p>
            </div>
          </div>
        </section>
        {/* Info sections: Prazo, Garantia, Pagamento */}
        <section className="py-20 bg-background border-t border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-16">
            <div id="prazo-entrega" className="scroll-mt-24" data-testid="section-prazo-entrega">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚚</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold">Prazo de Entrega</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Nossos estofados são planejados sob medida e produzidos artesanalmente,
                por isso <strong className="text-foreground">não trabalhamos com prazo fixo</strong>.
                As vagas de produção são liberadas conforme nossa disponibilidade — quando uma vaga é aberta,
                o produto aparece como disponível aqui no site. Para confirmar o prazo da sua peça e a entrega na sua cidade,
                fale com nosso vendedor pelo WhatsApp.
              </p>
            </div>

            <div id="garantia" className="scroll-mt-24" data-testid="section-garantia">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold">Garantia</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                A Sofá King concede garantia para os produtos a partir da data de entrega, conforme abaixo:
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-2xl font-serif font-bold text-foreground">02 anos</p>
                  <p className="text-sm text-muted-foreground mt-1">Estrutura de madeira</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-2xl font-serif font-bold text-foreground">01 ano</p>
                  <p className="text-sm text-muted-foreground mt-1">Espumas</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-2xl font-serif font-bold text-foreground">03 meses</p>
                  <p className="text-sm text-muted-foreground mt-1">Tecido</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-green-600">✓</span> A garantia cobre defeitos de fabricação relacionados a:
                  </h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex gap-2"><span className="text-accent">●</span> Estrutura de madeira</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Espumas</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Percintas elásticas</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Costuras</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Tecido (dentro do prazo de cobertura)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-red-500">✕</span> A garantia não cobre:
                  </h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Desgaste natural do tecido</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Manchas, rasgos ou mau uso</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Danos causados por umidade, água ou exposição ao sol</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Transporte por terceiros</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Modificações ou consertos feitos por terceiros</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="pagamento" className="scroll-mt-24" data-testid="section-pagamento">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💳</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold">Forma de Pagamento</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-xs tracking-[0.25em] uppercase text-accent font-semibold mb-2">À vista</p>
                  <p className="text-2xl font-serif font-bold text-foreground">10% de desconto</p>
                  <p className="text-sm text-muted-foreground mt-1">Pagamento à vista no fechamento</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-xs tracking-[0.25em] uppercase text-accent font-semibold mb-2">Cartão</p>
                  <p className="text-2xl font-serif font-bold text-foreground">Em até 10x</p>
                  <p className="text-sm text-muted-foreground mt-1">No cartão de crédito</p>
                </div>
              </div>
              <div className="bg-secondary/40 border-l-4 border-accent rounded-r-lg p-5">
                <p className="font-semibold text-foreground mb-2">Como funciona o parcelamento do projeto:</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex gap-2"><span className="text-accent font-bold">1.</span> <span><strong className="text-foreground">50% de entrada</strong> para iniciar a produção da sua peça no ateliê.</span></li>
                  <li className="flex gap-2"><span className="text-accent font-bold">2.</span> <span>Quando a peça está pronta, fazemos um <strong className="text-foreground">vídeo ao vivo</strong> com você — ou você pode <strong className="text-foreground">conferir pessoalmente no ateliê</strong>.</span></li>
                  <li className="flex gap-2"><span className="text-accent font-bold">3.</span> <span>Aprovado, você paga os <strong className="text-foreground">50% restantes antes da entrega</strong>.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
