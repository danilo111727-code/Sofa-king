import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";
import { fetchProducts, trackView, type Product } from "@/lib/api";
import { CATEGORIES, displayName, getCategory } from "@/lib/categories";

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

function useCategoryFilter(): string {
  const [location] = useLocation();
  return useMemo(() => {
    // Prefer wouter's `location` (path + optional ?query), strip any #hash first.
    const noHash = location.split("#")[0];
    const qs = noHash.includes("?") ? noHash.slice(noHash.indexOf("?") + 1) : "";
    // Fall back to the real URL search for cases where wouter strips it.
    const search = qs || (typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "");
    const raw = new URLSearchParams(search).get("categoria") ?? "";
    return VALID_CATEGORY_IDS.has(raw as any) ? raw : "";
  }, [location]);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const activeCategory = useCategoryFilter();
  const activeCatDef = getCategory(activeCategory);

  useEffect(() => {
    trackView({ path: activeCategory ? `/?categoria=${activeCategory}` : "/" });
  }, [activeCategory]);

  const filteredProducts = useMemo(() => {
    const avail = products.filter((p) => p.disponibilidade);
    if (!activeCategory) return avail;
    return avail.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow pb-20 sm:pb-8">
        {/* Hero Section */}
        <section className="relative w-full h-[88vh] min-h-[620px] flex items-end overflow-hidden bg-secondary/40">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/hero.png"
              alt="Sofá minimalista moderno em sala clara e arejada"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
            <div className="max-w-2xl text-white">
              <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-white/80 mb-5 font-semibold" data-testid="text-hero-tagline">
                Sofá King · Ateliê de Estofados Planejados
              </p>
              <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-[1.1] mb-6 text-white drop-shadow-lg" data-testid="text-hero-title">
                Não fazemos sofás em série.<br />
                <em className="italic font-normal">Fazemos o seu sofá.</em>
              </h1>
              <p className="text-base md:text-lg text-white/85 mb-10 max-w-lg leading-relaxed">
                10 anos de inovação e comprometimento com o cliente.
              </p>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold h-14 px-8 rounded-md text-base"
                data-testid="button-hero-cta"
                onClick={() => window.dispatchEvent(new Event("open-side-drawer"))}
              >
                Conheça nossas peças <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="produtos" className="py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4 font-semibold">Vagas abertas</p>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-5" data-testid="text-section-title">
                {activeCatDef ? activeCatDef.label : "Modelos disponíveis agora"}
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
                  !activeCategory
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
                data-testid="filter-category-todos"
              >
                Todos
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
                    ? `Nenhum modelo de ${activeCatDef.label} disponível no momento.`
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
